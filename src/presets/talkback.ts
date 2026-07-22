import type { CompanionPresetDefinitions } from '@companion-module/base'
import { AssignActionId } from '../actions/assign.js'
import { LevelActionId } from '../actions/level.js'
import { MuteActionId, MuteOptionId, StripOptionId } from '../actions/mute.js'
import { LR } from '../mixer/lr.js'
import type { Model } from '../mixer/model.js'
import { White, Black } from '../utils/colors.js'
import type { ZeroIndexed } from '../utils/indexed.js'

export function talkbackPresets(talkbackChannel: ZeroIndexed, model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

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
								inputChannel: talkbackChannel,
								mixAssign: [LR],
								mixActive: false,
							},
						},
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: talkbackChannel,
								mixAssign: [mix],
								mixActive: true,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								input: talkbackChannel,
								assign: mix,
								level: 49,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								[StripOptionId]: talkbackChannel,
								[MuteOptionId]: 2,
							},
						},
					],
					up: [
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								inputChannel: talkbackChannel,
								mixAssign: [mix],
								mixActive: false,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								input: talkbackChannel,
								assign: mix,
								level: 0,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								[StripOptionId]: talkbackChannel,
								[MuteOptionId]: 1,
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	})

	return presets
}
