import type { CompanionButtonPresetDefinition, CompanionPresetDefinitions } from '@companion-module/base'
import { MuteActionId, StatusOptionId, StripOptionId } from '../../actions/schemas/mute.js'
import { MuteFeedbackId } from '../../feedbacks/schemas/mute.js'
import type { sqInstance } from '../../instance.js'
import type { Model } from '../../mixer/model.js'
import { type NRPN, splitNRPN } from '../../mixer/nrpn/nrpn.js'
import { LevelNRPNCalculator } from '../../mixer/nrpn/source-to-sink.js'
import { MuteOperation } from '../../types.js'
import { White, Black } from '../../utils/colors.js'
import type { ZeroIndexed } from '../../utils/indexed.js'

/* MUTE + FADER LEVEL */
function createMuteInputPresetForChannelInMix(
	ch: ZeroIndexed,
	channelLabel: string,
	instanceLabel: string,
	nrpn: NRPN<'level'>,
	mixLabel: string,
): CompanionButtonPresetDefinition {
	const { MSB, LSB } = splitNRPN(nrpn)
	const label = `${channelLabel}\\n${mixLabel}\\n$(${instanceLabel}:level_${MSB}.${LSB}) dB`

	return {
		type: 'button',
		category: `Mt+dB CH-${mixLabel}`,
		name: label,
		style: {
			text: label,
			size: 'auto',
			color: White,
			bgcolor: Black,
		},
		steps: [
			{
				down: [
					{
						actionId: MuteActionId.MuteInputChannel,
						options: {
							[StripOptionId]: ch + 1,
							[StatusOptionId]: MuteOperation.Toggle,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: MuteFeedbackId.MuteInputChannel,
				options: {
					n: ch + 1,
				},
			},
		],
	}
}

function addMuteInputPresetsForChannel(
	presets: CompanionPresetDefinitions,
	channel: ZeroIndexed,
	channelLabel: string,
	lrCalc: LevelNRPNCalculator,
	mixCalc: LevelNRPNCalculator,
	model: Model,
	instance: sqInstance,
): void {
	model.forEach('lr', (lr, lrLabel) => {
		const nrpn = lrCalc.calculate(channel, lr)
		presets[`preset_mute_input${channel}_lr`] = createMuteInputPresetForChannelInMix(
			channel,
			channelLabel,
			instance.label,
			nrpn,
			lrLabel,
		)
	})

	model.forEach('mix', (mix, mixLabel) => {
		const nrpn = mixCalc.calculate(channel, mix)

		presets[`preset_mute_input${channel}_mix${mix}`] = createMuteInputPresetForChannelInMix(
			channel,
			channelLabel,
			instance.label,
			nrpn,
			mixLabel,
		)
	})
}

export function muteWithLevelPresets(instance: sqInstance, model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	// Input -> Mix
	const mixCalc = LevelNRPNCalculator.get(model, ['inputChannel', 'mix'])
	const lrCalc = LevelNRPNCalculator.get(model, ['inputChannel', 'lr'])
	model.forEach('inputChannel', (channel, channelLabel) => {
		addMuteInputPresetsForChannel(presets, channel, channelLabel, lrCalc, mixCalc, model, instance)
	})

	return presets
}
