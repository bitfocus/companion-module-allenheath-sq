import type {
	CompanionButtonPresetDefinition,
	CompanionButtonStyleProps,
	CompanionFeedbackButtonStyleResult,
	CompanionPresetAction,
	CompanionPresetDefinitions,
} from '@companion-module/base'
import { type MuteActionId, StatusOptionId, StripOptionId } from '../actions/schemas/mute.js'
import type { MuteFeedbackId } from '../feedbacks/schemas/mute.js'
import type { Model } from '../mixer/model.js'
import { MuteOperation } from '../types.js'
import { White, Black } from '../utils/colors.js'

const MutePresetStyleCommon = {
	size: 'auto',
	color: White,
	bgcolor: Black,
} as const satisfies Omit<CompanionButtonStyleProps, 'text'>

const StatusOptionValue = MuteOperation.Toggle

const MuteFeedbackStyle = {} as const satisfies CompanionFeedbackButtonStyleResult

const EmptyStepList = [] as const satisfies CompanionPresetAction[]

type NumberedSignalMuteType = Exclude<MuteFeedbackId & MuteActionId, 'mute_lr'>

function createNumberedSignalMutePreset(
	category: string,
	label: string,
	actionId: NumberedSignalMuteType,
	n: number,
): CompanionButtonPresetDefinition {
	const name = `${label} ${n + 1}`
	return {
		type: 'button',
		category,
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
						options: {
							[StripOptionId]: n + 1,
							[StatusOptionId]: StatusOptionValue,
						},
					},
				],
				up: EmptyStepList,
			},
		],
		feedbacks: [
			{
				feedbackId: actionId,
				options: {
					n: n + 1,
				},
				style: MuteFeedbackStyle,
			},
		],
	}
}

// The LR preset action doesn't have a strip identification option, so define
// this preset specially to omit it.
const MuteLRPresetDefinition = {
	type: 'button',
	category: 'Mute Mix - Group',
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
						[StatusOptionId]: MuteOperation.Toggle,
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
} as const satisfies CompanionButtonPresetDefinition

export function mutePresets(model: Model): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	/* MUTE */
	const addMutePresetsForType = (
		category: string,
		label: string,
		type: NumberedSignalMuteType,
		count: number,
	): void => {
		for (let i = 0; i < count; i++) {
			presets[`preset_${type}_${i}`] = createNumberedSignalMutePreset(category, label, type, i)
		}
	}

	addMutePresetsForType('Mute Input', 'Input channel', 'mute_input', model.inputOutputCounts.inputChannel)
	presets['preset_lr'] = MuteLRPresetDefinition
	addMutePresetsForType('Mute Mix - Group', 'Mix', 'mute_aux', model.inputOutputCounts.mix)
	addMutePresetsForType('Mute Mix - Group', 'Group', 'mute_group', model.inputOutputCounts.group)
	addMutePresetsForType('Mute Mix - Group', 'Matrix', 'mute_matrix', model.inputOutputCounts.matrix)
	addMutePresetsForType('Mute FX', 'FX Send', 'mute_fx_send', model.inputOutputCounts.fxSend)
	addMutePresetsForType('Mute FX', 'FX Return', 'mute_fx_return', model.inputOutputCounts.fxReturn)
	addMutePresetsForType('Mute DCA', 'DCA', 'mute_dca', model.inputOutputCounts.dca)
	addMutePresetsForType('Mute MuteGroup', 'MuteGroup', 'mute_mutegroup', model.inputOutputCounts.muteGroup)

	return presets
}
