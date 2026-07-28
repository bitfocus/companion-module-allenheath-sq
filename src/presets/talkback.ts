import type { CompanionPresetDefinition, CompanionPresetDefinitions } from '@companion-module/base'
import {
	AssignActionId,
	AssignSinksOptionId,
	AssignSourceOptionId,
	AssignStatus,
	AssignStatusOptionId,
} from '../actions/schemas/assign.js'
import { FadeDurationOptionId, SignalLevelOptionId } from '../actions/schemas/fading.js'
import { LevelActionId, LevelSetSinkOptionId, LevelSetSourceOptionId } from '../actions/schemas/level.js'
import { MuteActionId, StatusOptionId, StripOptionId } from '../actions/schemas/mute.js'
import type { Model } from '../mixer/model.js'
import { LR, MuteOperation } from '../types.js'
import { White, Black } from '../utils/colors.js'
import type { ZeroIndexed } from '../utils/indexed.js'

export function talkbackPresets(talkbackChannel: ZeroIndexed, model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	function talkbackPresetForMix(mix: ZeroIndexed, mixLabel: string, mixDesc: string): CompanionPresetDefinition {
		return {
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
								[SignalLevelOptionId]: 49,
								[FadeDurationOptionId]: 0,
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
								[SignalLevelOptionId]: 0,
								[FadeDurationOptionId]: 0,
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
	}

	model.forEach('mix', (mix, mixLabel, mixDesc) => {
		presets[`preset_talkback_mix${mix}`] = talkbackPresetForMix(mix, mixLabel, mixDesc)
	})

	return presets
}
