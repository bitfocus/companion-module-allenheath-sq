import type { CompanionPresetDefinitions, CompanionPresetValue, ExpressionOrValue } from '@companion-module/base'
import {
	AssignActionId,
	type AssignActions,
	AssignSinksOptionId,
	AssignSourceOptionId,
	AssignStatus,
	AssignStatusOptionId,
} from '../../actions/schemas/assign.js'
import { FadeDurationOptionId, SignalLevelOptionId } from '../../actions/schemas/fading.js'
import {
	LevelActionId,
	type LevelActions,
	LevelSetSinkOptionId,
	LevelSetSourceOptionId,
} from '../../actions/schemas/level.js'
import { MuteActionId, type MuteActions, StatusOptionId, StripOptionId } from '../../actions/schemas/mute.js'
import type { SQManifest } from '../../manifest.js'
import { LR, MuteOperation } from '../../types.js'
import { White, Black } from '../../utils/colors.js'
import type { ZeroIndexed } from '../../utils/indexed.js'
import { TalkbackPresetId } from '../ids.js'

export const TalkbackPresetMixLocalVariableId = 'mix'

type AssignSourceOption = CompanionPresetValue<AssignActions['ch_to_mix']['options'][typeof AssignSourceOptionId]>
type AssignSinksOption = CompanionPresetValue<AssignActions['ch_to_mix']['options'][typeof AssignSinksOptionId]>
type LevelSourceOption = CompanionPresetValue<LevelActions['chlev_to_mix']['options'][typeof LevelSetSourceOptionId]>
type LevelSinkOption = CompanionPresetValue<LevelActions['chlev_to_mix']['options'][typeof LevelSetSinkOptionId]>
type MuteInputChannelStripOption = CompanionPresetValue<MuteActions['mute_input']['options'][typeof StripOptionId]>

const AssignToLROption = {
	isExpression: false,
	value: [LR],
} satisfies AssignSinksOption

const AssignToMixOption = {
	isExpression: true,
	value: `[$(local:${TalkbackPresetMixLocalVariableId})]`,
} satisfies AssignSinksOption

const LevelInMixSinkOption = {
	isExpression: true,
	value: `$(local:${TalkbackPresetMixLocalVariableId})`,
} satisfies LevelSinkOption

const RemoveFromMixValue = {
	isExpression: false,
	value: AssignStatus.Inactive,
} as const satisfies ExpressionOrValue<'inactive'>

const AddToMixValue = {
	isExpression: false,
	value: AssignStatus.Active,
} as const satisfies ExpressionOrValue<'active'>

const UnmuteOptionValue = {
	isExpression: false,
	value: MuteOperation.Off,
} as const satisfies ExpressionOrValue<'off'>

const MuteOptionValue = {
	isExpression: false,
	value: MuteOperation.On,
} as const satisfies ExpressionOrValue<'on'>

const ZeroDurationFadeOption = {
	isExpression: false,
	value: 0,
} as const satisfies ExpressionOrValue<0>

const TalkbackActiveSignalLevel = 49
const TalkbackInactiveSignalLevel = 0

const TalkbackActiveSignalLevelOption = {
	isExpression: false,
	value: TalkbackActiveSignalLevel,
} as const satisfies ExpressionOrValue<typeof TalkbackActiveSignalLevel>

const TalkbackInactiveSignalLevelOption = {
	isExpression: false,
	value: TalkbackInactiveSignalLevel,
} as const satisfies ExpressionOrValue<typeof TalkbackInactiveSignalLevel>

export function talkbackPresets(talkbackChannel: ZeroIndexed): CompanionPresetDefinitions<SQManifest> {
	const TalkbackChannelOption = {
		isExpression: false,
		value: talkbackChannel + 1,
	} as const satisfies AssignSourceOption & LevelSourceOption & MuteInputChannelStripOption

	return {
		[TalkbackPresetId]: {
			type: 'simple',
			name: `Talk to Mix`,
			style: {
				text: `Talk to $(local:${TalkbackPresetMixLocalVariableId})`,
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
								[AssignSourceOptionId]: TalkbackChannelOption,
								[AssignSinksOptionId]: AssignToLROption,
								[AssignStatusOptionId]: RemoveFromMixValue,
							},
						},
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								[AssignSourceOptionId]: TalkbackChannelOption,
								[AssignSinksOptionId]: AssignToMixOption,
								[AssignStatusOptionId]: AddToMixValue,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								[LevelSetSourceOptionId]: TalkbackChannelOption,
								[LevelSetSinkOptionId]: LevelInMixSinkOption,
								[SignalLevelOptionId]: TalkbackActiveSignalLevelOption,
								[FadeDurationOptionId]: ZeroDurationFadeOption,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								[StripOptionId]: TalkbackChannelOption,
								[StatusOptionId]: UnmuteOptionValue,
							},
						},
					],
					up: [
						{
							actionId: AssignActionId.InputChannelToMix,
							options: {
								[AssignSourceOptionId]: TalkbackChannelOption,
								[AssignSinksOptionId]: AssignToMixOption,
								[AssignStatusOptionId]: RemoveFromMixValue,
							},
						},
						{
							actionId: LevelActionId.InputChannelLevelInMixOrLR,
							options: {
								[LevelSetSourceOptionId]: TalkbackChannelOption,
								[LevelSetSinkOptionId]: LevelInMixSinkOption,
								[SignalLevelOptionId]: TalkbackInactiveSignalLevelOption,
								[FadeDurationOptionId]: ZeroDurationFadeOption,
							},
						},
						{
							actionId: MuteActionId.MuteInputChannel,
							options: {
								[StripOptionId]: TalkbackChannelOption,
								[StatusOptionId]: MuteOptionValue,
							},
						},
					],
				},
			],
			feedbacks: [],
			localVariables: [
				// The local variable identifying the sink mix, targeted for templating.
				{
					variableName: TalkbackPresetMixLocalVariableId,
					variableType: 'simple',
					startupValue: {
						isExpression: false,
						value: 1,
					},
				},
			],
		},
	}
}
