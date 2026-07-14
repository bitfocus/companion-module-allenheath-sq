import type { CompanionPresetDefinitions } from '@companion-module/base'
import {
	AssignActionId,
	AssignSinksOptionId,
	AssignSourceOptionId,
	AssignStatus,
	AssignStatusOptionId,
} from '../actions/assign.js'
import { LevelActionId, LevelSetSinkOptionId, LevelSetSourceOptionId } from '../actions/level.js'
import { MuteActionId, StatusOptionId, StripOptionId } from '../actions/mute.js'
import { MuteOperation } from '../mixer/mixer.js'
import type { Model } from '../mixer/model.js'
import { LR } from '../types.js'
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
								[AssignSourceOptionId]: talkbackChannel + 1,
								[AssignSinksOptionId]: [LR],
								[AssignStatusOptionId]: AssignStatus.Inactive,
							},
						},
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								[AssignSourceOptionId]: talkbackChannel + 1,
								[AssignSinksOptionId]: [mix + 1],
								[AssignStatusOptionId]: AssignStatus.Active,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								[LevelSetSourceOptionId]: talkbackChannel + 1,
								[LevelSetSinkOptionId]: mix + 1,
								leveldb: 49,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								[StripOptionId]: talkbackChannel + 1,
								[StatusOptionId]: MuteOperation.Off,
							},
						},
					],
					up: [
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								[AssignSourceOptionId]: talkbackChannel + 1,
								[AssignSinksOptionId]: [mix + 1],
								[AssignStatusOptionId]: AssignStatus.Inactive,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								[LevelSetSourceOptionId]: talkbackChannel + 1,
								[LevelSetSinkOptionId]: mix + 1,
								leveldb: 0,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								[StripOptionId]: talkbackChannel + 1,
								[StatusOptionId]: MuteOperation.On,
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
