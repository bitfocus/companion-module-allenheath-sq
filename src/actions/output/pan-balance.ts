import type { Expect, IsNever } from 'type-testing'
import type { CompanionActionDefinition, CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { faderNumber } from '../../fader-number.js'
import type { sqInstance } from '../../instance.js'
import type { Mixer } from '../../mixer/mixer.js'
import type { InputOutputType } from '../../mixer/model.js'
import { getCommonCount } from '../../mixer/models.js'
import type { NRPN } from '../../mixer/nrpn/nrpn.js'
import { OutputBalanceNRPNCalculator, type SinkAsOutputForNRPN } from '../../mixer/nrpn/output.js'
import { getPanBalanceOperation, learnShowVar, PanLevelOption, ShowVarOption } from '../panning.js'
import { sourceOrSinkFromOneIndexed } from '../to-source-or-sink.js'
import { LRStrip } from '../../types.js'
import { moveZeroIndexedOptionToOneIndexed } from '../../upgrades/zero-indexed-to-one.js'
import { repr } from '../../utils/pretty.js'

/**
 * Action IDs for all actions affecting the pan/balance of sinks when used as
 * direct mixer outputs.
 */
export const OutputPanBalanceActionId = {
	LRPanBalanceOutput: 'lr_panbalance_output',
	MixPanBalanceOutput: 'mix_panbalance_output',
	MatrixPanBalanceOutput: 'matrix_panbalance_output',
} as const

export type OutputPanBalanceActionId = (typeof OutputPanBalanceActionId)[keyof typeof OutputPanBalanceActionId]

const AllOutputFaderPanBalanceActions: ReadonlySet<string> = new Set(
	Object.values(OutputPanBalanceActionId).filter((actionId) => actionId !== 'lr_panbalance_output'),
)

const OutputPanBalanceFaderOptionId = 'n'

/**
 * The action ID of the obsolete "Pan/Bal level to output" action, used to alter
 * the pan/balance of sinks of all types when assigned to physical mixer
 * outputs.
 */
export const ObsoletePanToOutputId = 'pan_to_output'

const ObsoleteOutputPanBalanceFaderOptionId = 'input'

/**
 * Adjusting the pan/balance of various mixer sinks that can be assigned to
 * physical mixer outputs used to be done in one "Fader Pan/Bal level to output"
 * action.  One of its options was a laundry list of all sinks
 * (LR/mix/FX send/matrix/DCA) that could be assigned to physical mixer outputs.
 * Each option value corresponded exactly to the necessary offset from an NRPN
 * base for all pan/balance-output NRPNs.  This meshed with internal fading
 * logic but introduced a conceptual hurdle -- and prevented sensibly exposing
 * pan/balance-output-modifying functionality in `Mixer` without replicating the
 * peculiar NRPN calculations.
 *
 * For clarity, and to reduce this NRPN encoding dependence, this action was
 * split into one action per sink category: separate "LR Pan/Bal to output",
 * "Mix Pan/Bal to output", &c. actions.  Each action identifies its sink the
 * normal way sources and sinks are identified, i.e. with a number in
 * `[0, sinkCount)` for sinks 1 to N.
 *
 * This function rewrites actions that are old-style "pan/balance to output"
 * actions to new, sink-type-specific actions.
 */
export function tryConvertOldPanToOutputActionToSinkSpecific(action: CompanionMigrationAction): boolean {
	if (action.actionId !== ObsoletePanToOutputId) {
		return false
	}

	const mixCount = getCommonCount('mixCount')
	const mtxCount = getCommonCount('mtxCount')

	// Old output pan/balance action options:
	//
	// options: [
	//      {
	//              type: 'dropdown',
	//              label: 'Fader',
	//              id: OutputFaderOptionId,
	//              default: 0,
	//              choices: choices.panBalanceFaders,
	//              minChoicesForSearch: 0,
	//      },
	//      ...
	// ],
	//
	// Old output pan/balance fader options:
	//
	// const allFaders: DropdownChoice[] = []
	// allFaders.push({ label: `LR`, id: 0 })
	// model.forEach('mix', (mix, mixLabel) => {
	//      allFaders.push({ label: mixLabel, id: 1 + mix })
	// })
	// model.forEach('matrix', (matrix, matrixLabel) => {
	//      allFaders.push({ label: matrixLabel, id: 0x11 + matrix })
	// })
	//
	// return allFaders
	const { options } = action
	const input = Number(options[ObsoleteOutputPanBalanceFaderOptionId])
	let newInput, newActionId
	if (input < 0) {
		// No valid inputs below zero.  Leave the action un-mutated in invalid
		// state.
		return false
	} else if (input < 1) {
		// LR is 0.
		// The new action doesn't include an input property because there's only
		// one LR.
		delete options[ObsoleteOutputPanBalanceFaderOptionId]
		action.actionId = OutputPanBalanceActionId.LRPanBalanceOutput
		return true
	} else if (input < 1 + mixCount) {
		// Mix is [1, 1 + 12).
		newInput = input - 1
		newActionId = OutputPanBalanceActionId.MixPanBalanceOutput
	} else if (input < 1 + mixCount + 4) {
		// No valid inputs from [13, 17).  Again leave alone.
		return false
	} else if (input < 1 + mixCount + 4 + mtxCount) {
		// Matrix is [17, 17 + 3).
		newInput = input - (1 + mixCount + 4)
		newActionId = OutputPanBalanceActionId.MatrixPanBalanceOutput
	} else {
		// All other numbers are invalid encodings.  Again do nothing.
		return false
	}

	options[ObsoleteOutputPanBalanceFaderOptionId] = newInput
	action.actionId = newActionId
	return true
}

/**
 * The fader specifier for an output pan/balance action used to be a
 * zero-indexed number.  This function moves that old, zero-indexed number
 * option to a new, one-indexed number option.
 */
export function tryMakeOutputPanBalanceItemOneIndexed(action: CompanionMigrationAction): boolean {
	if (!AllOutputFaderPanBalanceActions.has(action.actionId)) {
		return false
	}

	const options = action.options
	if (!(ObsoleteOutputPanBalanceFaderOptionId in options)) {
		return false
	}

	moveZeroIndexedOptionToOneIndexed(options, ObsoleteOutputPanBalanceFaderOptionId, OutputPanBalanceFaderOptionId)

	return true
}

/**
 * Generate action definitions for adjusting the pan/balance of various mixer
 * sinks when they're assigned to mixer outputs.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @returns
 *   The set of all output-adjustment action definitions.
 */
export function outputPanBalanceActions(
	instance: sqInstance,
	mixer: Mixer,
): Record<OutputPanBalanceActionId, CompanionActionDefinition> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	const faderOption = (label: string, type: Exclude<InputOutputType, 'lr'>) =>
		faderNumber(label, OutputPanBalanceFaderOptionId, counts, type)

	const getNRPN = (
		options: CompanionOptionValues,
		type: Exclude<SinkAsOutputForNRPN<'panBalance'>, 'lr'>,
	): NRPN<'panBalance'> | null => {
		const n = sourceOrSinkFromOneIndexed(instance, model, options[OutputPanBalanceFaderOptionId], type)
		if (n === null) {
			return null
		}

		return OutputBalanceNRPNCalculator.get(model, type).calculate(n)
	}

	const queryNRPN = (nrpn: NRPN<'panBalance'>) => {
		// Send a "get" so the pan/balance variable is defined.
		void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
	}

	const setPanBalance = (options: CompanionOptionValues, nrpn: NRPN<'panBalance'>) => {
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
				instance.log('warn', `Invalid pan/balance type ${repr(panBalance)}, ignoring`)
				return
			}
		}
	}

	return {
		[OutputPanBalanceActionId.LRPanBalanceOutput]: {
			name: 'LR Pan/Bal to output',
			options: [
				// There's only one LR, so don't include a fader option.
				PanLevelOption,
				ShowVarOption,
			],
			learn: async ({ options }) => {
				const nrpn = OutputBalanceNRPNCalculator.get(model, 'lr').calculate(LRStrip)
				return learnShowVar(instance, options, nrpn)
			},
			subscribe: async (_action) => {
				const nrpn = OutputBalanceNRPNCalculator.get(model, 'lr').calculate(LRStrip)
				queryNRPN(nrpn)
			},
			callback: async ({ options }) => {
				const nrpn = OutputBalanceNRPNCalculator.get(model, 'lr').calculate(LRStrip)
				setPanBalance(options, nrpn)
			},
		},
		[OutputPanBalanceActionId.MixPanBalanceOutput]: {
			name: 'Mix Pan/Bal to output',
			options: [faderOption('Mix', 'mix'), PanLevelOption, ShowVarOption],
			learn: async ({ options }) => {
				const nrpn = getNRPN(options, 'mix')
				if (nrpn === null) {
					return undefined
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: async ({ options }) => {
				const nrpn = getNRPN(options, 'mix')
				if (nrpn === null) {
					return
				}

				queryNRPN(nrpn)
			},
			callback: async ({ options }) => {
				const nrpn = getNRPN(options, 'mix')
				if (nrpn === null) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},

		[OutputPanBalanceActionId.MatrixPanBalanceOutput]: {
			name: 'Matrix Pan/Bal to output',
			options: [faderOption('Matrix', 'matrix'), PanLevelOption, ShowVarOption],
			learn: async ({ options }) => {
				const nrpn = getNRPN(options, 'matrix')
				if (nrpn === null) {
					return undefined
				}

				return learnShowVar(instance, options, nrpn)
			},
			subscribe: async ({ options }) => {
				const nrpn = getNRPN(options, 'matrix')
				if (nrpn === null) {
					return
				}

				queryNRPN(nrpn)
			},
			callback: async ({ options }) => {
				const nrpn = getNRPN(options, 'matrix')
				if (nrpn === null) {
					return
				}

				setPanBalance(options, nrpn)
			},
		},
	}
}
