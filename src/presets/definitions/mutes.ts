import type {
	CompanionButtonStyleProps,
	CompanionFeedbackButtonStyleResult,
	CompanionPresetAction,
	CompanionPresetDefinition,
	CompanionPresetDefinitions,
	CompanionPresetOptionValues,
	CompanionSimplePresetDefinition,
	ExpressionOrValue,
} from '@companion-module/base'
import type { SQActions } from '../../actions/manifest.js'
import { type MuteActionId, type MuteSignalOptions, StatusOptionId, StripOptionId } from '../../actions/schemas/mute.js'
import {
	MuteFeedbackFaderOptionId,
	type MuteFeedbackId,
	type MuteFeedbackNumberedSignalOptions,
} from '../../feedbacks/schemas/mute.js'
import {
	MuteDCAPresetId,
	MuteFXReturnPresetId,
	MuteFXSendPresetId,
	MuteGroupPresetId,
	MuteInputChannelPresetId,
	MuteLRPresetId,
	MuteMatrixPresetId,
	MuteMixPresetId,
	MuteMuteGroupPresetId,
} from '../ids.js'
import type { SQManifest } from '../../manifest.js'
import { MuteOperation } from '../../types.js'
import { White, Black, CarmineRed } from '../../utils/colors.js'

export const MutePresetStripLocalVariableId = 'n'

const MutePresetStyleCommon = {
	size: 'auto',
	color: White,
	bgcolor: Black,
} as const satisfies Omit<CompanionButtonStyleProps, 'text'>

const StripNumberOptionValue = {
	isExpression: true,
	value: `$(local:${MutePresetStripLocalVariableId})`,
} as const satisfies ExpressionOrValue<number>

const StatusOptionValue = {
	isExpression: false,
	value: MuteOperation.Toggle,
} as const satisfies ExpressionOrValue<MuteOperation>

const NumberedSignalActionOptions = {
	[StripOptionId]: StripNumberOptionValue,
	[StatusOptionId]: StatusOptionValue,
} as const satisfies CompanionPresetOptionValues<MuteSignalOptions>

const MuteNumberedSignalFeedbackOptions = {
	[MuteFeedbackFaderOptionId]: StripNumberOptionValue,
} as const satisfies CompanionPresetOptionValues<MuteFeedbackNumberedSignalOptions>

const MuteFeedbackStyle = {
	color: Black,
	bgcolor: CarmineRed,
} as const satisfies CompanionFeedbackButtonStyleResult

const EmptyStepList = [] as const satisfies CompanionPresetAction<SQActions>[]

function createNumberedSignalMutePreset(
	label: string,
	actionId: Exclude<MuteFeedbackId & MuteActionId, 'mute_lr'>,
): CompanionSimplePresetDefinition<SQManifest> {
	const name = `Mute ${label} $(local:${MutePresetStripLocalVariableId})`
	return {
		type: 'simple',
		name,
		style: {
			text: name,
			...MutePresetStyleCommon,
		},
		steps: [
			{
				down: [
					{
						actionId,
						options: NumberedSignalActionOptions,
					},
				],
				up: EmptyStepList,
			},
		],
		feedbacks: [
			{
				feedbackId: actionId,
				options: MuteNumberedSignalFeedbackOptions,
				style: MuteFeedbackStyle,
			},
		],
		localVariables: [
			{
				variableName: MutePresetStripLocalVariableId,
				headline: `${label} to mute/unmute`,
				variableType: 'simple',
				startupValue: 1,
			},
		],
	}
}

// The LR preset action doesn't have a strip identification option and doesn't
// require a local variable to use in identfiying it.  Define this preset
// specially to omit both.
const MuteLRPresetDefinition = {
	type: 'simple',
	name: `Mute LR`,
	style: {
		text: 'Mute LR',
		...MutePresetStyleCommon,
	},
	steps: [
		{
			down: [
				{
					actionId: 'mute_lr',
					options: {
						[StatusOptionId]: StatusOptionValue,
					},
				},
			],
			up: EmptyStepList,
		},
	],
	feedbacks: [
		{
			feedbackId: 'mute_lr',
			options: {},
			style: MuteFeedbackStyle,
		},
	],
} as const satisfies CompanionPresetDefinition<SQManifest>

export function mutePresets(): CompanionPresetDefinitions<SQManifest> {
	return {
		[MuteLRPresetId]: MuteLRPresetDefinition,
		[MuteInputChannelPresetId]: createNumberedSignalMutePreset('Input Channel', 'mute_input'),
		[MuteMixPresetId]: createNumberedSignalMutePreset('Mix', 'mute_aux'),
		[MuteGroupPresetId]: createNumberedSignalMutePreset('Group', 'mute_group'),
		[MuteMatrixPresetId]: createNumberedSignalMutePreset('Matrix', 'mute_group'),
		[MuteFXSendPresetId]: createNumberedSignalMutePreset('FX Send', 'mute_fx_send'),
		[MuteFXReturnPresetId]: createNumberedSignalMutePreset('FX Return', 'mute_fx_return'),
		[MuteDCAPresetId]: createNumberedSignalMutePreset('DCA', 'mute_dca'),
		[MuteMuteGroupPresetId]: createNumberedSignalMutePreset('Mute Group', 'mute_mutegroup'),
	}
}
