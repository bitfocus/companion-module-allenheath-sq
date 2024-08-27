import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'
import { LR, type Model } from './mixer/model.js'
import { AssignActionId } from './actions/assign.js'
import { LevelActionId } from './actions/level.js'
import { MuteActionId } from './actions/mute.js'
import { MuteFeedbackId } from './feedbacks/feedback-ids.js'
import { computeEitherParameters, LevelInSinkBase } from './mixer/parameters.js'
import type { SQInstanceInterface as sqInstance } from './instance-interface.js'

const White = combineRgb(255, 255, 255)
const Black = combineRgb(0, 0, 0)

type MuteType = keyof typeof MuteFeedbackId & keyof typeof MuteActionId

export function getPresets(instance: sqInstance, model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	/* MUTE */
	const createtMute = (cat: string, lab: string, typ: MuteType, cnt: number, nr = true): void => {
		for (let i = 0; i < cnt; i++) {
			const suffix = cnt > 1 ? `_${i}` : ''
			presets[`preset_${MuteActionId[typ]}${suffix}`] = {
				type: 'button',
				category: cat,
				name: lab + (nr ? ' ' + (i + 1) : ''),
				style: {
					text: lab + (nr ? ' ' + (i + 1) : ''),
					size: 'auto',
					color: White,
					bgcolor: Black,
				},
				steps: [
					{
						down: [
							{
								actionId: MuteActionId[typ],
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
						feedbackId: MuteFeedbackId[typ],
						options: {
							channel: i,
						},
					},
				],
			}
		}
	}

	createtMute('Mute Input', 'Input channel', 'MuteInputChannel', model.count.inputChannel)
	createtMute('Mute Mix - Group', 'LR', 'MuteLR', 1, false)
	createtMute('Mute Mix - Group', 'Aux', 'MuteMix', model.count.mix)
	createtMute('Mute Mix - Group', 'Group', 'MuteGroup', model.count.group)
	createtMute('Mute Mix - Group', 'Matrix', 'MuteMatrix', model.count.matrix)
	createtMute('Mute FX', 'FX Send', 'MuteFXSend', model.count.fxSend)
	createtMute('Mute FX', 'FX Return', 'MuteFXReturn', model.count.fxReturn)
	createtMute('Mute DCA', 'DCA', 'MuteDCA', model.count.dca)
	createtMute('Mute MuteGroup', 'MuteGroup', 'MuteMuteGroup', model.count.muteGroup)

	/* TALKBACK*/
	model.forEachMix((mix, mixLabel, mixDesc) => {
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
	const createtMuteLevel = (cat: string, lab: string, typ: MuteType, ch: number, mix: number): void => {
		const mixId = mix === LR ? 'lr' : `mix${mix}`
		presets[`preset_mute_input${ch}_${mixId}`] = {
			type: 'button',
			category: cat,
			name: lab,
			style: {
				text: lab,
				size: 'auto',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: MuteActionId[typ],
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
					feedbackId: MuteFeedbackId[typ],
					options: {
						channel: ch,
					},
				},
			],
		}
	}

	// Input -> Mix
	model.forEachInputChannel((channel, channelLabel) => {
		model.forEachMixAndLR((mix, mixLabel) => {
			const { MSB, LSB } = computeEitherParameters(
				channel,
				mix,
				model.count.mix,
				LevelInSinkBase['inputChannel-mix'],
				LevelInSinkBase['inputChannel-lr'],
			)

			createtMuteLevel(
				`Mt+dB CH-${mixLabel}`,
				`${channelLabel}\\n${mixLabel}\\n$(${instance.options.connectionLabel}:level_${MSB}.${LSB}) dB`,
				'MuteInputChannel',
				channel,
				mix,
			)
		})
	})
	/**/

	return presets
}
