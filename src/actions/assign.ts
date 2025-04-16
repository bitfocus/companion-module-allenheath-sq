import type {
	CompanionInputFieldDropdown,
	CompanionInputFieldMultiDropdown,
	CompanionOptionValues,
} from '@companion-module/base'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { type Mixer } from '../mixer/mixer.js'
import { LR } from '../mixer/model.js'
import { type InputOutputType, type Model } from '../mixer/model.js'
import { type ActionDefinitions } from './actionid.js'
import { type OptionValue, toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'

/**
 * Action IDs for all actions that activate/deactivate a mixer source within a
 * sink.
 */
export enum AssignActionId {
	InputChannelToMix = 'ch_to_mix',
	InputChannelToGroup = 'ch_to_grp',
	GroupToMix = 'grp_to_mix',
	FXReturnToMix = 'fxr_to_mix',
	FXReturnToGroup = 'fxr_to_grp',
	InputChannelToFXSend = 'ch_to_fxs',
	GroupToFXSend = 'grp_to_fxs',
	FXReturnToFXSend = 'fxr_to_fxs',
	MixToMatrix = 'mix_to_mtx',
	GroupToMatrix = 'grp_to_mtx',
}

const AssignMixOrLRSinksOptionId = 'mixAssign'

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
function assignOptionToSinks(assign: OptionValue, model: Model, sinkType: Exclude<InputOutputType, 'mix'>): number[] {
	if (!Array.isArray(assign)) {
		return []
	}

	const sinkCount = model.inputOutputCounts[sinkType]
	const sinks: number[] = []
	for (const item of assign) {
		const sink = Number(item)
		if (sink < sinkCount) {
			sinks.push(sink)
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
function getMixAndLRSinks(options: CompanionOptionValues, model: Model): number[] {
	const mixAssign = options[AssignMixOrLRSinksOptionId]
	if (!Array.isArray(mixAssign)) {
		return []
	}

	const sinkCount = model.inputOutputCounts.mix
	const sinks: number[] = []
	for (const item of mixAssign) {
		const sink = Number(item)
		if (sink < sinkCount || sink === LR) {
			sinks.push(sink)
		}
	}
	return sinks
}

function sourceSinkOptions(
	sourceLabel: string,
	sourceId: string,
	sourceChoices: keyof Choices,
	sinkLabel: string,
	sinkId: string,
	sinkChoices: keyof Choices,
	choices: Choices,
): [CompanionInputFieldDropdown, CompanionInputFieldMultiDropdown] {
	return [
		{
			type: 'dropdown',
			label: sourceLabel,
			id: sourceId,
			default: 0,
			choices: choices[sourceChoices],
			minChoicesForSearch: 0,
		},
		{
			type: 'multidropdown',
			label: sinkLabel,
			id: sinkId,
			default: [],
			choices: choices[sinkChoices],
		},
	]
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
export function assignActions(instance: sqInstance, mixer: Mixer, choices: Choices): ActionDefinitions<AssignActionId> {
	const model = mixer.model

	return {
		[AssignActionId.InputChannelToMix]: {
			name: 'Assign channel to mix',
			options: [
				...sourceSinkOptions(
					'Input Channel',
					'inputChannel',
					'inputChannels',
					'Mix',
					AssignMixOrLRSinksOptionId,
					'mixesAndLR',
					choices,
				),
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
				...sourceSinkOptions('Input Channel', 'inputChannel', 'inputChannels', 'Group', 'grpAssign', 'groups', choices),
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
				...sourceSinkOptions('Group', 'inputGrp', 'groups', 'Mix', AssignMixOrLRSinksOptionId, 'mixesAndLR', choices),
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
				...sourceSinkOptions(
					'FX Return',
					'inputFxr',
					'fxReturns',
					'Mix',
					AssignMixOrLRSinksOptionId,
					'mixesAndLR',
					choices,
				),
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
				...sourceSinkOptions('FX Return', 'inputFxr', 'fxReturns', 'Group', 'grpAssign', 'groups', choices),
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
				...sourceSinkOptions(
					'Input Channel',
					'inputChannel',
					'inputChannels',
					'FX Send',
					'fxsAssign',
					'fxSends',
					choices,
				),
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
				...sourceSinkOptions('Group', 'inputGrp', 'groups', 'FX Send', 'fxsAssign', 'fxSends', choices),
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
				...sourceSinkOptions('FX return', 'inputFxr', 'fxReturns', 'FX Send', 'fxsAssign', 'fxSends', choices),
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
				...sourceSinkOptions('Mix', 'inputMix', 'mixesAndLR', 'Matrix', 'mtxAssign', 'matrixes', choices),
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
				...sourceSinkOptions('Group', 'inputGrp', 'groups', 'Matrix', 'mtxAssign', 'matrixes', choices),
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
