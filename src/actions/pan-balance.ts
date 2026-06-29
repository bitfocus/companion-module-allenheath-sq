import type { Equal, Expect, IsNever } from 'type-testing'
import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown,
	CompanionInputFieldNumber,
	CompanionMigrationAction,
	CompanionOptionValues,
	DropdownChoice,
} from '@companion-module/base'
import { mixOrLROption } from '../choices.js'
import { faderNumber } from '../fader-number.js'
import type { sqInstance } from '../instance.js'
import {
	convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption,
	tryUpgradeMixOrLROptionEncoding,
} from '../mixer/lr.js'
import type { Mixer } from '../mixer/mixer.js'
import type { Model } from '../mixer/model.js'
import type { NRPN } from '../mixer/nrpn/nrpn.js'
import {
	BalanceNRPNCalculator,
	type SinkForMixAndLRInSinkForNRPN,
	type SourceForSourceInMixAndLRForNRPN,
	type SourceSinkForNRPN,
} from '../mixer/nrpn/source-to-sink.js'
import { getPanBalanceOperation, learnShowVar, PanLevelOption, ShowVarOption } from './panning.js'
import { PanBalanceActionId, PanBalanceSinkOptionId, PanBalanceSourceOptionId } from './schemas/pan-balance.js'
import { toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'
import { LR, LRStrip } from '../types.js'
import { moveZeroIndexedOptionToOneIndexed } from '../upgrades/zero-indexed-to-one.js'
import type { ZeroIndexed } from '../utils/indexed.js'

const ObsoletePanBalanceSourceOptionId = 'input'
const ObsoletePanBalanceSinkOptionId = 'assign'

/**
 * The LR mix used to be identified using the number `99` in options.  This
 * function attempts to upgrade pan/balance actions (*only* pan/balance actions:
 * other action types are upgraded by similar functions in their action-defining
 * files) that identify the LR mix in this fashion to use the constant string
 * `'lr'`, i.e. `LR`.
 *
 * @param action
 *   An action to potentially upgrade.
 * @returns
 *   True iff the action was a pan/balance action containing an identification
 *   of the LR mix that was rewritten to use `'lr'`.
 */
export function tryUpgradePanBalanceMixOrLREncoding(action: CompanionMigrationAction): boolean {
	switch (action.actionId) {
		case PanBalanceActionId.InputChannelPanBalanceInMixOrLR:
		case PanBalanceActionId.GroupPanBalanceInMixOrLR:
		case PanBalanceActionId.FXReturnPanBalanceInMixOrLR:
			return tryUpgradeMixOrLROptionEncoding(action, ObsoletePanBalanceSinkOptionId)
		case PanBalanceActionId.MixOrLRPanBalanceInMatrix:
			return tryUpgradeMixOrLROptionEncoding(action, ObsoletePanBalanceSourceOptionId)
		default:
			return false
	}
}

type SourceSinkInfo = {
	sourceIsMixOrLR: boolean
	sinkIsMixOrLR: boolean
}

const OnlySourceIsMixOrLR = {
	sourceIsMixOrLR: true,
	sinkIsMixOrLR: false,
} as const satisfies SourceSinkInfo

const OnlySinkIsMixOrLR = {
	sourceIsMixOrLR: false,
	sinkIsMixOrLR: true,
} as const satisfies SourceSinkInfo

const SourceAndSinkAreNotMixOrLR = {
	sourceIsMixOrLR: false,
	sinkIsMixOrLR: false,
} as const satisfies SourceSinkInfo

const UserUnfriendlyOptionInfo = {
	[PanBalanceActionId.FXReturnPanBalanceInMixOrLR]: OnlySinkIsMixOrLR,
	[PanBalanceActionId.GroupPanBalanceInMatrix]: SourceAndSinkAreNotMixOrLR,
	[PanBalanceActionId.GroupPanBalanceInMixOrLR]: OnlySinkIsMixOrLR,
	[PanBalanceActionId.InputChannelPanBalanceInMixOrLR]: OnlySinkIsMixOrLR,
	[PanBalanceActionId.MixOrLRPanBalanceInMatrix]: OnlySourceIsMixOrLR,
} as const satisfies Record<Exclude<PanBalanceActionId, 'fxrpan_to_grp'>, SourceSinkInfo>

export function tryMakePanBalanceSourceSinkOptionsUserFriendly(action: CompanionMigrationAction): boolean {
	if (!Object.hasOwn(UserUnfriendlyOptionInfo, action.actionId)) {
		return false
	}

	const options = action.options
	if (!(ObsoletePanBalanceSourceOptionId in options)) {
		return false
	}

	const { sourceIsMixOrLR, sinkIsMixOrLR } =
		UserUnfriendlyOptionInfo[action.actionId as keyof typeof UserUnfriendlyOptionInfo]

	const convertSource = sourceIsMixOrLR
		? convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption
		: moveZeroIndexedOptionToOneIndexed
	convertSource(options, ObsoletePanBalanceSourceOptionId, PanBalanceSourceOptionId)

	const convertSink = sinkIsMixOrLR
		? convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption
		: moveZeroIndexedOptionToOneIndexed
	convertSink(options, ObsoletePanBalanceSinkOptionId, PanBalanceSinkOptionId)

	return true
}

type PanBalanceSourceSink =
	| SourceSinkForNRPN<'panBalance'>
	| [SourceForSourceInMixAndLRForNRPN<'panBalance'>, 'mix-or-lr']
	| ['mix-or-lr', SinkForMixAndLRInSinkForNRPN<'panBalance'>]

type OptionsForPanBalanceSourceSink<_SourceSink extends PanBalanceSourceSink> = CompanionOptionValues

function getPanBalanceNRPN<SourceSink extends PanBalanceSourceSink>(
	instance: sqInstance,
	model: Model,
	sourceSink: SourceSink,
	options: OptionsForPanBalanceSourceSink<SourceSink>,
): NRPN<'panBalance'> | null {
	let sourceSinkType: SourceSinkForNRPN<'panBalance'>
	let source, sink
	if (sourceSink[0] === 'mix-or-lr') {
		const mixOrLR = toMixOrLR(instance, model, options[PanBalanceSourceOptionId])
		if (mixOrLR === null) {
			return null
		}

		sink = toSourceOrSink(instance, model, options[PanBalanceSinkOptionId], sourceSink[1])
		if (sink === null) {
			return null
		}

		if (mixOrLR === LR) {
			source = LRStrip
			sourceSinkType = ['lr', sourceSink[1]]
		} else {
			source = mixOrLR
			sourceSinkType = ['mix', sourceSink[1]]
		}
	} else if (sourceSink[1] === 'mix-or-lr') {
		source = toSourceOrSink(instance, model, options[PanBalanceSourceOptionId], sourceSink[0])
		if (source === null) {
			return null
		}

		const mixOrLR = toMixOrLR(instance, model, options[PanBalanceSinkOptionId])
		if (mixOrLR === null) {
			return null
		}

		if (mixOrLR === LR) {
			sink = LRStrip
			sourceSinkType = [sourceSink[0], 'lr']
		} else {
			sink = mixOrLR
			sourceSinkType = [sourceSink[0], 'mix']
		}
	} else {
		source = toSourceOrSink(instance, model, options[PanBalanceSourceOptionId], sourceSink[0])
		if (source === null) {
			return null
		}

		sink = toSourceOrSink(instance, model, options[PanBalanceSinkOptionId], sourceSink[1])
		if (sink === null) {
			return null
		}

		sourceSinkType = sourceSink
	}

	type assert_SourceIsZeroIndexed = Expect<Equal<typeof source, ZeroIndexed>>
	type assert_SinkIsZeroIndexed = Expect<Equal<typeof sink, ZeroIndexed>>

	return BalanceNRPNCalculator.get(model, sourceSinkType).calculate(source, sink)
}

/**
 * Generate action definitions for adjusting the pan/balance of mixer sources
 * across mixer sinks.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param mixesAndLR
 *   A choices list containing all numbered mixes plus the LR mix.
 * @returns
 *   The set of all pan/balance action definitions.
 */
export function panBalanceActions(
	instance: sqInstance,
	mixer: Mixer,
	mixesAndLR: DropdownChoice[],
): Record<PanBalanceActionId, CompanionActionDefinition> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	let InputChannelSource: CompanionInputFieldNumber
	let GroupSource: CompanionInputFieldNumber
	let FXReturnSource: CompanionInputFieldNumber
	let MixOrLRSource: CompanionInputFieldDropdown

	let MatrixSink: CompanionInputFieldNumber
	let MixOrLRSink: CompanionInputFieldDropdown
	{
		const sourceNumber = (label: string, type: 'inputChannel' | 'group' | 'fxReturn') =>
			faderNumber(label, PanBalanceSourceOptionId, counts, type)
		const sinkNumber = (label: string, type: 'matrix') => faderNumber(label, PanBalanceSinkOptionId, counts, type)
		const mixNumberOrLRSource = (label: string) => mixOrLROption(label, PanBalanceSourceOptionId, mixesAndLR)
		const mixNumberOrLRSink = (label: string) => mixOrLROption(label, PanBalanceSinkOptionId, mixesAndLR)

		InputChannelSource = sourceNumber('Input channel', 'inputChannel')
		GroupSource = sourceNumber('Group', 'group')
		FXReturnSource = sourceNumber('FX return', 'fxReturn')
		MixOrLRSource = mixNumberOrLRSource('Mix')

		MatrixSink = sinkNumber('Matrix', 'matrix')
		MixOrLRSink = mixNumberOrLRSink('Mix')
	}

	const setPanBalance = <Options extends CompanionOptionValues>(options: Options, nrpn: NRPN<'panBalance'>) => {
		const panBalance = getPanBalanceOperation(instance, options)
		if (panBalance === null) {
			return
		}

		switch (panBalance.type) {
			case 'step-right':
				mixer.panStepRight(nrpn)
				return
			case 'step-left':
				mixer.panStepLeft(nrpn)
				return
			case 'absolute':
				mixer.panAbsolute(nrpn, panBalance.position)
				return
			default: {
				type assert_AllTypesHandled = Expect<IsNever<typeof panBalance>>
			}
		}
	}

	return {
		[PanBalanceActionId.InputChannelPanBalanceInMixOrLR]: {
			name: 'Pan/Bal channel level to mix',
			options: [InputChannelSource, MixOrLRSink, PanLevelOption, ShowVarOption],
			learn: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['inputChannel', 'mix-or-lr'], options)
				if (nrpn === null) {
					return
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['inputChannel', 'mix-or-lr'], options)
				if (!nrpn) {
					return
				}

				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['inputChannel', 'mix-or-lr'], options)
				if (!nrpn) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},
		[PanBalanceActionId.GroupPanBalanceInMixOrLR]: {
			name: 'Pan/Bal group level to mix',
			options: [GroupSource, MixOrLRSink, PanLevelOption, ShowVarOption],
			learn: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['inputChannel', 'mix-or-lr'], options)
				if (nrpn === null) {
					return
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['group', 'mix-or-lr'], options)
				if (!nrpn) {
					return
				}

				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['group', 'mix-or-lr'], options)
				if (!nrpn) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},
		[PanBalanceActionId.FXReturnPanBalanceInMixOrLR]: {
			name: 'Pan/Bal FX return level to mix',
			options: [FXReturnSource, MixOrLRSink, PanLevelOption, ShowVarOption],
			learn: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['fxReturn', 'mix-or-lr'], options)
				if (nrpn === null) {
					return
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['fxReturn', 'mix-or-lr'], options)
				if (!nrpn) {
					return
				}

				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['fxReturn', 'mix-or-lr'], options)
				if (!nrpn) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},
		[PanBalanceActionId.FXReturnPanBalanceInGroup]: {
			name: 'Pan/Bal FX return level to group',
			options: [
				{
					type: 'static-text',
					id: 'invalid',
					label: 'Invalid operation!',
					value: 'FX returns can only be assigned to groups, not have their pan/balance set in them.',
				},
			],
			callback: async () => {
				instance.log('warn', 'The "Pan/Bal FX return level to group" operation is invalid.  Don\'t use this action!')
			},
		},
		[PanBalanceActionId.MixOrLRPanBalanceInMatrix]: {
			name: 'Pan/Bal mix level to matrix',
			options: [MixOrLRSource, MatrixSink, PanLevelOption, ShowVarOption],
			learn: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['mix-or-lr', 'matrix'], options)
				if (nrpn === null) {
					return undefined
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: async ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['mix-or-lr', 'matrix'], options)
				if (nrpn === null) {
					return
				}

				// Send a "get" so the pan/balance variable is defined.
				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['mix-or-lr', 'matrix'], options)
				if (nrpn === null) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},
		[PanBalanceActionId.GroupPanBalanceInMatrix]: {
			name: 'Pan/Bal group level to matrix',
			options: [GroupSource, MatrixSink, PanLevelOption, ShowVarOption],
			learn: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['fxReturn', 'mix-or-lr'], options)
				if (nrpn === null) {
					return
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['group', 'matrix'], options)
				if (!nrpn) {
					return
				}

				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const nrpn = getPanBalanceNRPN(instance, model, ['group', 'matrix'], options)
				if (!nrpn) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},
	}
}
