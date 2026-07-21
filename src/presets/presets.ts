import type { Equal, Expect } from 'type-testing'
import type { CompanionPresetDefinitions } from '@companion-module/base'
import { AssignActionId } from '../actions/assign.js'
import { LevelActionId } from '../actions/level.js'
import { MuteActionId } from '../actions/mute.js'
import { getTalkbackChannel } from '../config.js'
import { MuteFeedbackId } from '../feedbacks/mute.js'
import type { sqInstance } from '../instance.js'
import { LR } from '../mixer/lr.js'
import type { Model } from '../mixer/model.js'
import { type NRPN, splitNRPN } from '../mixer/nrpn/nrpn.js'
import { LevelNRPNCalculator } from '../mixer/nrpn/source-to-sink.js'
import { mutePresets } from './mutes.js'
import { Black, White } from '../utils/colors.js'
import type { ZeroIndexed } from '../utils/indexed.js'

export function getPresets(instance: sqInstance, model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {
		...mutePresets(model),
	}

	/* TALKBACK*/
	model.forEach('mix', (mix, mixLabel, mixDesc) => {
		const talkbackChannelZeroIndexed = getTalkbackChannel(instance.config)
		type assert_TalkbackChannelIsZeroIndexed = Expect<Equal<typeof talkbackChannelZeroIndexed, ZeroIndexed>>

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
								inputChannel: talkbackChannelZeroIndexed,
								mixAssign: [LR],
								mixActive: false,
							},
						},
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: talkbackChannelZeroIndexed,
								mixAssign: [mix],
								mixActive: true,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								input: talkbackChannelZeroIndexed,
								assign: mix,
								level: 49,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								strip: talkbackChannelZeroIndexed,
								mute: 2,
							},
						},
					],
					up: [
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: talkbackChannelZeroIndexed,
								mixAssign: [mix],
								mixActive: false,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								input: talkbackChannelZeroIndexed,
								assign: mix,
								level: 0,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								strip: talkbackChannelZeroIndexed,
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
		nrpn: NRPN<'level'>,
		ch: number,
		channelLabel: string,
		mix: number | 'lr',
		mixLabel: string,
	): void => {
		const { MSB, LSB } = splitNRPN(nrpn)
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
		model.forEach('lr', (lr, lrLabel) => {
			const nrpn = lrCalc.calculate(channel, lr)
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
