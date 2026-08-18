import type {
	CompanionActionDefinitions,
	CompanionInputFieldBase,
	CompanionInputFieldDropdown,
	CompanionInputFieldMultiDropdown,
	CompanionInputFieldNumber,
	CompanionOptionValues,
} from '@companion-module/base'
import type { Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import {
	convertZeroIndexedLowercaseLRArrayOptionToOneIndexedUppercaseLRArrayOption,
	convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption,
	type MixOrLR,
	tryUpgradeMixOrLRArrayEncoding,
	tryUpgradeMixOrLROptionEncoding,
} from '../mixer/lr.js'
import { MixOrLRArrayExpressionDescription, MixOrLRExpressionDescription } from '../mixer/model.js'
import type { Mixer } from '../mixer/mixer.js'
import {
	type InputOutputType,
	type Model,
	SignalArrayExpressionDescription,
	SignalExpressionDescription,
} from '../mixer/model.js'
import {
	AssignActionId,
	type AssignActions,
	type AssignMixOrLRSourceAndSinksOptions,
	AssignSinksOptionId,
	type AssignSourceAndMixesAndLRSinksOptions,
	type AssignSourceAndSinksOptions,
	AssignSourceOptionId,
	AssignStatus,
	type AssignStatusOption,
	AssignStatusOptionId,
} from './schemas/assign.js'
import { type OptionValue, toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'
import { LR } from '../types.js'
import type { OldCompanionMigrationAction as CompanionMigrationAction } from '../upgrades/types.js'
import {
	convertZeroIndexedArrayOptionToOneIndexed,
	moveZeroIndexedOptionToOneIndexed,
} from '../upgrades/zero-indexed-to-one.js'
import { zeroIndexedNumber, type ZeroIndexed } from '../utils/indexed.js'

const ObsoleteMixOrLRSourceOptionId = 'inputMix'

const ObsoleteMixOrLRSinksOptionId = 'mixAssign'

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
			return tryUpgradeMixOrLRArrayEncoding(action, ObsoleteMixOrLRSinksOptionId)
		case AssignActionId.MixToMatrix:
			return tryUpgradeMixOrLROptionEncoding(action, ObsoleteMixOrLRSourceOptionId)
		default:
			return false
	}
}

const ObsoleteInputChannelSourceOptionId = 'inputChannel'
const ObsoleteFxReturnSourceOptionId = 'inputFxr'
const ObsoleteGroupSourceOptionId = 'inputGrp'

type ObsoleteSinksOptions = {
	sinks: CompanionInputFieldBase['id']
	active: CompanionInputFieldBase['id']
}

const ObsoleteGroupSinksOptions = {
	sinks: 'grpAssign',
	active: 'grpActive',
} as const satisfies ObsoleteSinksOptions

const ObsoleteFXSendSinksOptions = {
	sinks: 'fxsAssign',
	active: 'fxsActive',
} as const satisfies ObsoleteSinksOptions

const ObsoleteMatrixSinksOptions = {
	sinks: 'mtxAssign',
	active: 'mtxActive',
} as const satisfies ObsoleteSinksOptions

const ObsoleteMixOrLRSinksOptions = {
	sinks: ObsoleteMixOrLRSinksOptionId,
	active: 'mixActive',
} as const satisfies ObsoleteSinksOptions

type ObsoleteAssignOptions = {
	source: CompanionInputFieldBase['id']
} & ObsoleteSinksOptions

const ObsoleteAssignOptions = {
	[AssignActionId.InputChannelToGroup]: {
		source: ObsoleteInputChannelSourceOptionId,
		...ObsoleteGroupSinksOptions,
	},
	[AssignActionId.FXReturnToGroup]: {
		source: ObsoleteFxReturnSourceOptionId,
		...ObsoleteGroupSinksOptions,
	},
	[AssignActionId.InputChannelToFXSend]: {
		source: ObsoleteInputChannelSourceOptionId,
		...ObsoleteFXSendSinksOptions,
	},
	[AssignActionId.GroupToMatrix]: {
		source: ObsoleteGroupSourceOptionId,
		...ObsoleteMatrixSinksOptions,
	},
	[AssignActionId.GroupToFXSend]: {
		source: ObsoleteGroupSourceOptionId,
		...ObsoleteFXSendSinksOptions,
	},
	[AssignActionId.FXReturnToFXSend]: {
		source: ObsoleteFxReturnSourceOptionId,
		...ObsoleteFXSendSinksOptions,
	},
	[AssignActionId.InputChannelToMix]: {
		source: ObsoleteInputChannelSourceOptionId,
		...ObsoleteMixOrLRSinksOptions,
	},
	[AssignActionId.GroupToMix]: {
		source: ObsoleteGroupSourceOptionId,
		...ObsoleteMixOrLRSinksOptions,
	},
	[AssignActionId.FXReturnToMix]: {
		source: ObsoleteFxReturnSourceOptionId,
		...ObsoleteMixOrLRSinksOptions,
	},
	[AssignActionId.MixToMatrix]: {
		source: ObsoleteMixOrLRSourceOptionId,
		...ObsoleteMatrixSinksOptions,
	},
} as const satisfies Record<AssignActionId, ObsoleteAssignOptions>

function moveAndRewriteActiveOption(options: CompanionOptionValues, oldId: CompanionInputFieldBase['id']): void {
	const oldVal = Boolean(options[oldId])
	delete options[oldId]
	options[AssignStatusOptionId] = oldVal ? AssignStatus.Active : AssignStatus.Inactive
}

/**
 * Assignment action source/sink options used to be zero-indexed numbers, or
 * `'lr'` for the LR mix.
 *
 * With the 2.0 module API and options being allowed to be defined with
 * expressions, these zero-indexed numbers ought be instead one-indexed to match
 * user expectations.  Additionally, `'lr'` as nicety ought be `'LR'` because
 * that's how it's referred to on the mixer surface.
 *
 * Additionally, the source option name, the sink option name, and the "active"
 * option (indicating whether to assign or unassign) all used to be different on
 * an action-by-action basis just to keep things complicated.
 *
 * This function attempts to 1) rewrite source/sink numbers to be one-indexed,
 * 2) change `'lr'` to `'LR'`, and 3) change all source/sinks/active option IDs
 * to follow one pattern, returning true if rewriting succeeded.
 */
export function tryMakeAssignOptionsUserFriendly(action: CompanionMigrationAction): boolean {
	if (!Object.hasOwn(ObsoleteAssignOptions, action.actionId)) {
		return false
	}

	const { source, sinks, active } = ObsoleteAssignOptions[action.actionId as keyof typeof ObsoleteAssignOptions]

	const options = action.options
	if (!(source in options)) {
		return false
	}

	const convertSource =
		source === ObsoleteMixOrLRSourceOptionId
			? convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption
			: moveZeroIndexedOptionToOneIndexed
	convertSource(options, source, AssignSourceOptionId)

	const convertSinks =
		sinks === ObsoleteMixOrLRSinksOptionId
			? convertZeroIndexedLowercaseLRArrayOptionToOneIndexedUppercaseLRArrayOption
			: convertZeroIndexedArrayOptionToOneIndexed
	convertSinks(options, sinks, AssignSinksOptionId)

	moveAndRewriteActiveOption(options, active)

	return true
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
		if (1 <= sink && sink <= sinkCount) {
			sinks.push(zeroIndexedNumber((sink | 0) - 1))
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
function getMixAndLRSinks(options: AssignSourceAndMixesAndLRSinksOptions, model: Model): MixOrLR[] {
	const mixAssign = options[AssignSinksOptionId]
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
			if (1 <= sink && sink <= sinkCount) {
				sinks.push(zeroIndexedNumber((sink | 0) - 1))
			}
		}
	}
	return sinks
}

function sourceOption<Id extends CompanionInputFieldNumber['id']>(
	label: string,
	id: Id,
	counts: Model['inputOutputCounts'],
	type: 'inputChannel' | 'group' | 'mix' | 'fxReturn',
): CompanionInputFieldNumber<Id> {
	return {
		type: 'number',
		label,
		id,
		expressionDescription: SignalExpressionDescription(counts, type),
		asInteger: true,
		default: 1,
		min: 1,
		max: counts[type],
	}
}

function sinksOption(
	sinkLabel: string,
	sinkChoices: keyof Choices,
	choices: Choices,
): CompanionInputFieldMultiDropdown<typeof AssignSinksOptionId> {
	const dropdownChoices = choices[sinkChoices]
	return {
		type: 'multidropdown',
		label: sinkLabel,
		id: AssignSinksOptionId,
		expressionDescription:
			sinkChoices === 'mixesAndLR'
				? MixOrLRArrayExpressionDescription(dropdownChoices.length - 1)
				: SignalArrayExpressionDescription(dropdownChoices.length),
		default: [],
		choices: dropdownChoices,
	}
}

function activate(options: AssignStatusOption): boolean {
	switch (options[AssignStatusOptionId]) {
		case AssignStatus.Active:
			return true
		case AssignStatus.Inactive:
			return false
		default:
			// Eventually this will have to be adjusted to support a 'toggle'
			// operation, but for now, choose simply to subtract sound as the
			// fallback default rather than add it.
			return false
	}
}

const StatusOption = {
	type: 'dropdown',
	label: 'Status',
	id: AssignStatusOptionId,
	choices: [
		{ id: 'active', label: 'Active' },
		{ id: 'inactive', label: 'Inactive' },
	],
	expressionDescription: `Expression must evaluate to 'active' to assign or 'inactive' to unassign`,
	default: AssignStatus.Active,
} as const satisfies CompanionInputFieldDropdown<typeof AssignStatusOptionId>

/**
 * Generate action definitions for assigning sources to sinks: input channel to
 * mix, group to mix, input channel to FX send, output to matrix, and so on and
 * so forth.
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
): CompanionActionDefinitions<AssignActions> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	const MixOrLRSource = {
		type: 'dropdown',
		label: 'Mix',
		id: AssignSourceOptionId,
		expressionDescription: MixOrLRExpressionDescription(counts.mix),
		default: 1,
		choices: choices.mixesAndLR,
		minChoicesForSearch: 0,
	} satisfies CompanionInputFieldDropdown<typeof AssignSourceOptionId>

	type Source = CompanionInputFieldNumber<typeof AssignSourceOptionId>
	type Sinks = CompanionInputFieldMultiDropdown<typeof AssignSinksOptionId>

	let InputChannelSource: Source
	let GroupSource: Source
	let FXReturnSource: Source

	let GroupSinks: Sinks
	let FXSendSinks: Sinks
	let MixOrLRSinks: Sinks
	let MatrixSinks: Sinks
	{
		const sourceNumber = (label: string, type: 'inputChannel' | 'group' | 'fxReturn') =>
			sourceOption(label, AssignSourceOptionId, counts, type)
		const sinkNumbers = (label: string, sinkChoice: 'groups' | 'fxSends' | 'matrixes') =>
			sinksOption(label, sinkChoice, choices)

		InputChannelSource = sourceNumber('Input Channel', 'inputChannel')
		GroupSource = sourceNumber('Group', 'group')
		FXReturnSource = sourceNumber('FX Return', 'fxReturn')

		GroupSinks = sinkNumbers('Group', 'groups')
		FXSendSinks = sinkNumbers('FX Send', 'fxSends')
		MixOrLRSinks = sinksOption('Mix', 'mixesAndLR', choices)
		MatrixSinks = sinkNumbers('Matrix', 'matrixes')
	}

	const getSource = (
		options: AssignSourceAndSinksOptions | AssignMixOrLRSourceAndSinksOptions | AssignSourceAndMixesAndLRSinksOptions,
		type: 'inputChannel' | 'group' | 'fxReturn',
	) => toSourceOrSink(instance, model, options[AssignSourceOptionId], type)
	const getMixOrLRSource = (options: AssignMixOrLRSourceAndSinksOptions) =>
		toMixOrLR(instance, model, options[AssignSourceOptionId])

	const getSinks = (
		options: AssignSourceAndSinksOptions | AssignMixOrLRSourceAndSinksOptions | AssignSourceAndMixesAndLRSinksOptions,
		type: 'group' | 'fxSend' | 'matrix',
	) => assignOptionToSinks(options[AssignSinksOptionId], model, type)

	return {
		[AssignActionId.InputChannelToMix]: {
			name: 'Assign channel to mix',
			options: [InputChannelSource, MixOrLRSinks, StatusOption],
			callback: async ({ options }) => {
				const inputChannel = getSource(options, 'inputChannel')
				if (inputChannel === null) {
					return
				}

				const mixes = getMixAndLRSinks(options, model)
				mixer.assignInputChannelToMixesAndLR(inputChannel, activate(options), mixes)
			},
		},

		[AssignActionId.InputChannelToGroup]: {
			name: 'Assign channel to group',
			options: [InputChannelSource, GroupSinks, StatusOption],
			callback: async ({ options }) => {
				const inputChannel = getSource(options, 'inputChannel')
				if (inputChannel === null) {
					return
				}

				const groups = getSinks(options, 'group')
				mixer.assignInputChannelToGroups(inputChannel, activate(options), groups)
			},
		},

		[AssignActionId.GroupToMix]: {
			name: 'Assign group to mix',
			options: [GroupSource, MixOrLRSinks, StatusOption],
			callback: async ({ options }) => {
				const group = getSource(options, 'group')
				if (group === null) {
					return
				}

				const mixes = getMixAndLRSinks(options, model)
				mixer.assignGroupToMixesAndLR(group, activate(options), mixes)
			},
		},

		[AssignActionId.FXReturnToMix]: {
			name: 'Assign FX return to mix',
			options: [FXReturnSource, MixOrLRSinks, StatusOption],
			callback: async ({ options }) => {
				const fxReturn = getSource(options, 'fxReturn')
				if (fxReturn === null) {
					return
				}

				const mixes = getMixAndLRSinks(options, model)
				mixer.assignFXReturnToMixesAndLR(fxReturn, activate(options), mixes)
			},
		},

		[AssignActionId.FXReturnToGroup]: {
			name: 'Assign FX Return to group',
			options: [FXReturnSource, GroupSinks, StatusOption],
			callback: async ({ options }) => {
				const fxReturn = getSource(options, 'fxReturn')
				if (fxReturn === null) {
					return
				}

				const groups = getSinks(options, 'group')
				mixer.assignFXReturnToGroups(fxReturn, activate(options), groups)
			},
		},

		[AssignActionId.InputChannelToFXSend]: {
			name: 'Assign channel to FX Send',
			options: [InputChannelSource, FXSendSinks, StatusOption],
			callback: async ({ options }) => {
				const inputChannel = getSource(options, 'inputChannel')
				if (inputChannel === null) {
					return
				}

				const fxSends = getSinks(options, 'fxSend')
				mixer.assignInputChannelToFXSends(inputChannel, activate(options), fxSends)
			},
		},

		[AssignActionId.GroupToFXSend]: {
			name: 'Assign group to FX send',
			options: [GroupSource, FXSendSinks, StatusOption],
			callback: async ({ options }) => {
				const group = getSource(options, 'group')
				if (group === null) {
					return
				}

				const fxSends = getSinks(options, 'fxSend')
				mixer.assignGroupToFXSends(group, activate(options), fxSends)
			},
		},

		[AssignActionId.FXReturnToFXSend]: {
			name: 'Assign FX return to FX send',
			options: [FXReturnSource, FXSendSinks, StatusOption],
			callback: async ({ options }) => {
				const fxReturn = getSource(options, 'fxReturn')
				if (fxReturn === null) {
					return
				}

				const fxSends = getSinks(options, 'fxSend')
				mixer.assignFXReturnToFXSends(fxReturn, activate(options), fxSends)
			},
		},

		[AssignActionId.MixToMatrix]: {
			name: 'Assign mix to matrix',
			options: [MixOrLRSource, MatrixSinks, StatusOption],
			callback: async ({ options }) => {
				const mixOrLR = getMixOrLRSource(options)
				if (mixOrLR === null) {
					return
				}

				const active = activate(options)
				const matrixes = getSinks(options, 'matrix')
				if (mixOrLR === LR) {
					mixer.assignLRToMatrixes(active, matrixes)
				} else {
					mixer.assignMixToMatrixes(mixOrLR, active, matrixes)
				}
			},
		},

		[AssignActionId.GroupToMatrix]: {
			name: 'Assign group to matrix',
			options: [GroupSource, MatrixSinks, StatusOption],
			callback: async ({ options }) => {
				const group = getSource(options, 'group')
				if (group === null) {
					return
				}

				const matrixes = getSinks(options, 'matrix')
				mixer.assignGroupToMatrixes(group, activate(options), matrixes)
			},
		},
	}
}
