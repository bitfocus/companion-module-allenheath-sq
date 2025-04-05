import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'
import { LR, type Model } from './mixer/model.js'
import { AssignActionId } from './actions/assign.js'
import { LevelActionId } from './actions/level.js'
import { MuteActionId } from './actions/mute.js'
import { MuteFeedbackId } from './feedbacks/feedback-ids.js'
import type { sqInstance } from './instance.js'
import type { LevelParam } from './mixer/nrpn/param.js'
import { LevelNRPNCalculator } from './mixer/nrpn/source-to-sink.js'

const White = combineRgb(255, 255, 255)
const Black = combineRgb(0, 0, 0)

// Doesn't this lint make *no sense* for intersections?  The intersection of two
// types that *do not* duplicate is just `never`, which makes any such
// intersection's result totally vacuous...right?
// eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents
type MuteType = keyof typeof MuteFeedbackId & keyof typeof MuteActionId

export function getPresets(instance: sqInstance, model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	/* MUTE */
	const createtMute = (category: string, label: string, type: MuteType, count: number): void => {
		for (let i = 0; i < count; i++) {
			const suffix = count > 1 ? `_${i}` : ''
			const maybeSpaceNum = count > 1 ? ` ${i + 1}` : ''
			presets[`preset_${MuteActionId[type]}${suffix}`] = {
				type: 'button',
				category,
				name: `${label}${maybeSpaceNum}`,
				style: {
					text: `${label}${maybeSpaceNum}`,
					size: 'auto',
					color: White,
					bgcolor: Black,
				},
				steps: [
					{
						down: [
							{
								actionId: MuteActionId[type],
								options: {
									strip: i,
									mute: 0,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: MuteFeedbackId[type],
						options: {
							channel: i,
						},
					},
				],
			}
		}
	}

	createtMute('Mute Input', 'Input channel', 'MuteInputChannel', model.inputOutputCounts.inputChannel)
	createtMute('Mute Mix - Group', 'LR', 'MuteLR', model.inputOutputCounts.lr)
	createtMute('Mute Mix - Group', 'Aux', 'MuteMix', model.inputOutputCounts.mix)
	createtMute('Mute Mix - Group', 'Group', 'MuteGroup', model.inputOutputCounts.group)
	createtMute('Mute Mix - Group', 'Matrix', 'MuteMatrix', model.inputOutputCounts.matrix)
	createtMute('Mute FX', 'FX Send', 'MuteFXSend', model.inputOutputCounts.fxSend)
	createtMute('Mute FX', 'FX Return', 'MuteFXReturn', model.inputOutputCounts.fxReturn)
	createtMute('Mute DCA', 'DCA', 'MuteDCA', model.inputOutputCounts.dca)
	createtMute('Mute MuteGroup', 'MuteGroup', 'MuteMuteGroup', model.inputOutputCounts.muteGroup)

	/* TALKBACK*/
	model.forEach('mix', (mix, mixLabel, mixDesc) => {
		presets[`preset_talkback_mix${mix}`] = {
			type: 'button',
			category: 'Talkback',
			name: `Talk to ${mixDesc}`,
			style: {
				text: `Talk to ${mixLabel}`,
				size: 'auto',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: instance.options.talkbackChannel,
								mixAssign: [LR],
								mixActive: false,
							},
						},
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: instance.options.talkbackChannel,
								mixAssign: [mix],
								mixActive: true,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								input: instance.options.talkbackChannel,
								assign: mix,
								level: 49,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								strip: instance.options.talkbackChannel,
								mute: 2,
							},
						},
					],
					up: [
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: instance.options.talkbackChannel,
								mixAssign: [mix],
								mixActive: false,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								input: instance.options.talkbackChannel,
								assign: mix,
								level: 0,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								strip: instance.options.talkbackChannel,
								mute: 1,
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	})

	/* MUTE + FADER LEVEL */
	const muteWithFaderLevel = (
		{ MSB, LSB }: LevelParam,
		ch: number,
		channelLabel: string,
		mix: number | 'lr',
		mixLabel: string,
	): void => {
		const label = `${channelLabel}\\n${mixLabel}\\n$(${instance.label}:level_${MSB}.${LSB}) dB`

		const mixId = mix === 'lr' ? 'lr' : `mix${mix}`
		presets[`preset_mute_input${ch}_${mixId}`] = {
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
								strip: ch,
								mute: 0,
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
						channel: ch,
					},
				},
			],
		}
	}

	// Input -> Mix
	const mixCalc = LevelNRPNCalculator.get(model, ['inputChannel', 'mix'])
	const lrCalc = LevelNRPNCalculator.get(model, ['inputChannel', 'lr'])
	model.forEach('inputChannel', (channel, channelLabel) => {
		model.forEach('lr', (_lr, lrLabel) => {
			const nrpn = lrCalc.calculate(channel, 0)
			muteWithFaderLevel(nrpn, channel, channelLabel, 'lr', lrLabel)
		})

		model.forEach('mix', (mix, mixLabel) => {
			const nrpn = mixCalc.calculate(channel, mix)

			muteWithFaderLevel(nrpn, channel, channelLabel, mix, mixLabel)
		})
	})
	/**/

	return presets
}
