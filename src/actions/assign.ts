import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown,
	CompanionInputFieldMultiDropdown,
	CompanionMigrationAction,
	CompanionOptionValues,
} from '@companion-module/base'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { LR, type MixOrLR, tryUpgradeMixOrLRArrayEncoding, tryUpgradeMixOrLROptionEncoding } from '../mixer/lr.js'
import type { Mixer } from '../mixer/mixer.js'
import type { InputOutputType, Model } from '../mixer/model.js'
import { type OptionValue, toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'
import { zeroIndexedNumber, type ZeroIndexed } from '../utils/indexed.js'

/**
 * Action IDs for all actions that activate/deactivate a mixer source within a
 * sink.
 */
export const AssignActionId = {
	InputChannelToMix: 'ch_to_mix',
	InputChannelToGroup: 'ch_to_grp',
	GroupToMix: 'grp_to_mix',
	FXReturnToMix: 'fxr_to_mix',
	FXReturnToGroup: 'fxr_to_grp',
	InputChannelToFXSend: 'ch_to_fxs',
	GroupToFXSend: 'grp_to_fxs',
	FXReturnToFXSend: 'fxr_to_fxs',
	MixToMatrix: 'mix_to_mtx',
	GroupToMatrix: 'grp_to_mtx',
} as const

export type AssignActionId = (typeof AssignActionId)[keyof typeof AssignActionId]

const AssignMixOrLRSinksOptionId = 'mixAssign'

const AssignMixToMatrixSourceOptionId = 'inputMix'

/**
 * The LR mix used to be identified using the number `99` in options.  This
 * function attempts to upgrade assign actions (*only* assign actions: other
 * action types are upgraded by similar functions in their action-defining
 * files) that identify the LR mix in this fashion to use the constant string
 * `'lr'`, i.e. `LR`.
 *
 * @param action
 *   An action to potentially ugprade.
 * @returns
 *   True iff the action was an assign action containing an identification of
 *   the LR mix that was rewritten to use `'lr'`.
 */
export function tryUpgradeAssignMixOrLREncoding(action: CompanionMigrationAction): boolean {
	switch (action.actionId) {
		case AssignActionId.InputChannelToMix:
		case AssignActionId.GroupToMix:
		case AssignActionId.FXReturnToMix:
			return tryUpgradeMixOrLRArrayEncoding(action, AssignMixOrLRSinksOptionId)
		case AssignActionId.MixToMatrix:
			return tryUpgradeMixOrLROptionEncoding(action, AssignMixToMatrixSourceOptionId)
		default:
			return false
	}
}

/**
 * Convert the options value for a multidropdown field of numbered sinks into a
 * well-typed list of sink numbers.
 *
 * @param assign
 *   An `options.<sink type>Assign` value.
 * @param model
 *   The model of the mixer.
 * @param sinkType
 *   The type of the sinks.
 * @returns
 *   An array of sinks.
 */
function assignOptionToSinks(
	assign: OptionValue,
	model: Model,
	sinkType: Exclude<InputOutputType, 'mix'>,
): ZeroIndexed[] {
	if (!Array.isArray(assign)) {
		return []
	}

	const sinkCount = model.inputOutputCounts[sinkType]
	const sinks: ZeroIndexed[] = []
	for (const item of assign) {
		const sink = Number(item)
		if (sink < sinkCount) {
			sinks.push(zeroIndexedNumber(sink))
		}
	}
	return sinks
}

/**
 * Given the options for an action that is an assignment to mixes-or-LR, compute
 * the specified array of mixes and LR sinks.
 *
 * @param options
 *   Action options containing a `mixAssign` option that's an array of zero or
 *   more mixes or LR.
 * @param model
 *   The model of the mixer.
 * @returns
 *   An array of sinks.
 */
function getMixAndLRSinks(options: CompanionOptionValues, model: Model): MixOrLR[] {
	const mixAssign = options[AssignMixOrLRSinksOptionId]
	if (!Array.isArray(mixAssign)) {
		return []
	}

	const sinkCount = model.inputOutputCounts.mix
	const sinks: MixOrLR[] = []
	for (const item of mixAssign) {
		if (item === LR) {
			sinks.push(LR)
		} else {
			const sink = Number(item)
			if (sink < sinkCount) {
				sinks.push(zeroIndexedNumber(sink))
			}
		}
	}
	return sinks
}

function sourceOption(
	sourceLabel: string,
	sourceId: string,
	sourceChoices: keyof Choices,
	choices: Choices,
): CompanionInputFieldDropdown {
	return {
		type: 'dropdown',
		label: sourceLabel,
		id: sourceId,
		default: 0,
		choices: choices[sourceChoices],
		minChoicesForSearch: 0,
	}
}

function sinkOption(
	sinkLabel: string,
	sinkId: string,
	sinkChoices: keyof Choices,
	choices: Choices,
): CompanionInputFieldMultiDropdown {
	return {
		type: 'multidropdown',
		label: sinkLabel,
		id: sinkId,
		default: [],
		choices: choices[sinkChoices],
	}
}

/**
 * Generate action definitions for assigning sources to mixes: input channel to
 * mix, group to mix/aux, input channel to FX send, output to matrix, and so
 * on and so forth.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param choices
 *   Option choices for use in the actions.
 * @returns
 *   The set of all assignment action definitions.
 */
export function assignActions(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
): Record<AssignActionId, CompanionActionDefinition> {
	const model = mixer.model

	return {
		[AssignActionId.InputChannelToMix]: {
			name: 'Assign channel to mix',
			options: [
				sourceOption('Input Channel', 'inputChannel', 'inputChannels', choices),
				sinkOption('Mix', AssignMixOrLRSinksOptionId, 'mixesAndLR', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'mixActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const inputChannel = toSourceOrSink(instance, model, options.inputChannel, 'inputChannel')
				if (inputChannel === null) {
					return
				}
				const active = Boolean(options.mixActive)
				const mixes = getMixAndLRSinks(options, mixer.model)
				mixer.assignInputChannelToMixesAndLR(inputChannel, active, mixes)
			},
		},

		[AssignActionId.InputChannelToGroup]: {
			name: 'Assign channel to group',
			options: [
				sourceOption('Input Channel', 'inputChannel', 'inputChannels', choices),
				sinkOption('Group', 'grpAssign', 'groups', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'grpActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const inputChannel = toSourceOrSink(instance, model, options.inputChannel, 'inputChannel')
				if (inputChannel === null) {
					return
				}
				const active = Boolean(options.grpActive)
				const groups = assignOptionToSinks(options.grpAssign, mixer.model, 'group')
				mixer.assignInputChannelToGroups(inputChannel, active, groups)
			},
		},

		[AssignActionId.GroupToMix]: {
			name: 'Assign group to mix',
			options: [
				sourceOption('Group', 'inputGrp', 'groups', choices),
				sinkOption('Mix', AssignMixOrLRSinksOptionId, 'mixesAndLR', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'mixActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const group = toSourceOrSink(instance, model, options.inputGrp, 'group')
				if (group === null) {
					return
				}
				const active = Boolean(options.mixActive)
				const mixes = getMixAndLRSinks(options, mixer.model)
				mixer.assignGroupToMixesAndLR(group, active, mixes)
			},
		},

		[AssignActionId.FXReturnToMix]: {
			name: 'Assign FX return to mix',
			options: [
				sourceOption('FX Return', 'inputFxr', 'fxReturns', choices),
				sinkOption('Mix', AssignMixOrLRSinksOptionId, 'mixesAndLR', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'mixActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const fxReturn = toSourceOrSink(instance, model, options.inputFxr, 'fxReturn')
				if (fxReturn === null) {
					return
				}
				const active = Boolean(options.mixActive)
				const mixes = getMixAndLRSinks(options, mixer.model)
				mixer.assignFXReturnToMixesAndLR(fxReturn, active, mixes)
			},
		},

		[AssignActionId.FXReturnToGroup]: {
			name: 'Assign FX Return to group',
			options: [
				sourceOption('FX Return', 'inputFxr', 'fxReturns', choices),
				sinkOption('Group', 'grpAssign', 'groups', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'grpActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const fxReturn = toSourceOrSink(instance, model, options.inputFxr, 'fxReturn')
				if (fxReturn === null) {
					return
				}
				const active = Boolean(options.grpActive)
				const groups = assignOptionToSinks(options.grpAssign, mixer.model, 'group')
				mixer.assignFXReturnToGroups(fxReturn, active, groups)
			},
		},

		[AssignActionId.InputChannelToFXSend]: {
			name: 'Assign channel to FX Send',
			options: [
				sourceOption('Input Channel', 'inputChannel', 'inputChannels', choices),
				sinkOption('FX Send', 'fxsAssign', 'fxSends', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'fxsActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const inputChannel = toSourceOrSink(instance, model, options.inputChannel, 'inputChannel')
				if (inputChannel === null) {
					return
				}
				const active = Boolean(options.fxsActive)
				const fxSends = assignOptionToSinks(options.fxsAssign, mixer.model, 'fxSend')
				mixer.assignInputChannelToFXSends(inputChannel, active, fxSends)
			},
		},

		[AssignActionId.GroupToFXSend]: {
			name: 'Assign group to FX send',
			options: [
				sourceOption('Group', 'inputGrp', 'groups', choices),
				sinkOption('FX Send', 'fxsAssign', 'fxSends', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'fxsActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const group = toSourceOrSink(instance, model, options.inputGrp, 'group')
				if (group === null) {
					return
				}
				const active = Boolean(options.fxsActive)
				const fxSends = assignOptionToSinks(options.fxsAssign, mixer.model, 'fxSend')
				mixer.assignGroupToFXSends(group, active, fxSends)
			},
		},

		[AssignActionId.FXReturnToFXSend]: {
			name: 'Assign FX return to FX send',
			options: [
				sourceOption('FX return', 'inputFxr', 'fxReturns', choices),
				sinkOption('FX Send', 'fxsAssign', 'fxSends', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'fxsActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const fxReturn = toSourceOrSink(instance, model, options.inputFxr, 'fxReturn')
				if (fxReturn === null) {
					return
				}
				const active = Boolean(options.fxsActive)
				const fxSends = assignOptionToSinks(options.fxsAssign, mixer.model, 'fxSend')
				mixer.assignFXReturnToFXSends(fxReturn, active, fxSends)
			},
		},

		[AssignActionId.MixToMatrix]: {
			name: 'Assign mix to matrix',
			options: [
				sourceOption('Mix', AssignMixToMatrixSourceOptionId, 'mixesAndLR', choices),
				sinkOption('Matrix', 'mtxAssign', 'matrixes', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'mtxActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const mixOrLR = toMixOrLR(instance, model, options.inputMix)
				if (mixOrLR === null) {
					return
				}

				const active = Boolean(options.mtxActive)
				const matrixes = assignOptionToSinks(options.mtxAssign, mixer.model, 'matrix')
				if (mixOrLR === LR) {
					mixer.assignLRToMatrixes(active, matrixes)
				} else {
					mixer.assignMixToMatrixes(mixOrLR, active, matrixes)
				}
			},
		},

		[AssignActionId.GroupToMatrix]: {
			name: 'Assign group to matrix',
			options: [
				sourceOption('Group', 'inputGrp', 'groups', choices),
				sinkOption('Matrix', 'mtxAssign', 'matrixes', choices),
				{
					type: 'checkbox',
					label: 'Active',
					id: 'mtxActive',
					default: true,
				},
			],
			callback: async ({ options }) => {
				const group = toSourceOrSink(instance, model, options.inputGrp, 'group')
				if (group === null) {
					return
				}
				const active = Boolean(options.mtxActive)
				const matrixes = assignOptionToSinks(options.mtxAssign, mixer.model, 'matrix')
				mixer.assignGroupToMatrixes(group, active, matrixes)
			},
		},
	}
}
