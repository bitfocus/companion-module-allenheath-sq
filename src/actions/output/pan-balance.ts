import type { CompanionActionDefinition, CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import type { Choices } from '../../choices.js'
import { faderOption, OutputFaderOptionId } from './common.js'
import type { sqInstance } from '../../instance.js'
import { LRStrip } from '../../mixer/lr.js'
import type { Mixer } from '../../mixer/mixer.js'
import type { InputOutputType, Model } from '../../mixer/model.js'
import { getCommonCount } from '../../mixer/models.js'
import { splitNRPN } from '../../mixer/nrpn/nrpn.js'
import { OutputBalanceNRPNCalculator, type SinkAsOutputForNRPN } from '../../mixer/nrpn/output.js'
import { getPanBalance, PanLevelOption, type PanBalanceChoice } from '../pan-balance.js'
import { toSourceOrSink } from '../to-source-or-sink.js'
import type { ZeroIndexed } from '../../utils/indexed.js'

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

/**
 * The action ID of the obsolete "Pan/Bal level to output" action, used to alter
 * the pan/balance of sinks of all types when assigned to physical mixer
 * outputs.
 */
export const ObsoletePanToOutputId = 'pan_to_output'

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
	const input = Number(options[OutputFaderOptionId])
	let newInput, newActionId
	if (input < 0) {
		// No valid inputs below zero.  Leave the action un-mutated in invalid
		// state.
		return false
	} else if (input < 1) {
		// LR is 0.
		// The new action doesn't include an input property because there's only
		// one LR.
		delete options[OutputFaderOptionId]
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

	options[OutputFaderOptionId] = newInput
	action.actionId = newActionId
	return true
}

/**
 * Get the number of the specified fader from options for a fading action.
 *
 * @param instance
 *   The instance in use.
 * @param model
 *   The model of the mixer.
 * @param options
 *   Options specified for the action.
 * @param type
 *   The type of the fader.
 */
function getFader(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	type: Exclude<InputOutputType, 'lr'>,
): ZeroIndexed | null {
	return toSourceOrSink(instance, model, options[OutputFaderOptionId], type)
}

type PanBalanceInfo = {
	fader: ZeroIndexed
	panBalanceChoice: PanBalanceChoice
}

function getPanBalanceType(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	type: Exclude<SinkAsOutputForNRPN<'panBalance'>, 'lr'>,
): PanBalanceInfo | null {
	const fader = getFader(instance, model, options, type)
	if (fader === null) {
		return null
	}

	const panBalanceChoice = getPanBalance(instance, options)
	if (panBalanceChoice === null) {
		return null
	}

	return {
		fader,
		panBalanceChoice,
	}
}

/**
 * Generate action definitions for adjusting the pan/balance of various mixer
 * sinks when they're assigned to mixer outputs.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param choices
 *   Option choices for use in the actions.
 * @returns
 *   The set of all output-adjustment action definitions.
 */
export function outputPanBalanceActions(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
): Record<OutputPanBalanceActionId, CompanionActionDefinition> {
	const model = mixer.model

	const ShowVar = {
		type: 'textinput',
		label: 'Instance variable containing pan/balance level (click Learn to refresh)',
		id: 'showvar',
		default: '',
	} as const

	return {
		[OutputPanBalanceActionId.LRPanBalanceOutput]: {
			name: 'LR Pan/Bal to output',
			options: [
				// There's only one LR, so don't include a fader option.
				PanLevelOption,
				ShowVar,
			],
			learn: async ({ options }) => {
				const { MSB, LSB } = splitNRPN(OutputBalanceNRPNCalculator.get(model, 'lr').calculate(LRStrip))

				return {
					...options,
					showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
				}
			},
			subscribe: async (_action) => {
				const nrpn = OutputBalanceNRPNCalculator.get(model, 'lr').calculate(LRStrip)

				// Send a "get" so the pan/balance variable is defined.
				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const panBalanceChoice = getPanBalance(instance, options)
				if (panBalanceChoice === null) {
					return
				}

				mixer.setLROutputPanBalance(panBalanceChoice)
			},
		},
		[OutputPanBalanceActionId.MixPanBalanceOutput]: {
			name: 'Mix Pan/Bal to output',
			options: [faderOption('mixes', choices), PanLevelOption, ShowVar],
			learn: async ({ options }) => {
				const mix = getFader(instance, model, options, 'mix')
				if (mix === null) {
					return
				}

				const { MSB, LSB } = splitNRPN(OutputBalanceNRPNCalculator.get(model, 'mix').calculate(mix))

				return {
					...options,
					showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
				}
			},
			subscribe: async ({ options }) => {
				const mix = getFader(instance, model, options, 'mix')
				if (mix === null) {
					return
				}

				const nrpn = OutputBalanceNRPNCalculator.get(model, 'mix').calculate(mix)

				// Send a "get" so the pan/balance variable is defined.
				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const panBalance = getPanBalanceType(instance, model, options, 'mix')
				if (panBalance === null) {
					return
				}
				const { fader: mix, panBalanceChoice } = panBalance

				mixer.setMixOutputPanBalance(mix, panBalanceChoice)
			},
		},

		[OutputPanBalanceActionId.MatrixPanBalanceOutput]: {
			name: 'Matrix Pan/Bal to output',
			options: [faderOption('matrixes', choices), PanLevelOption, ShowVar],
			learn: async ({ options }) => {
				const matrix = getFader(instance, model, options, 'matrix')
				if (matrix === null) {
					return
				}

				const { MSB, LSB } = splitNRPN(OutputBalanceNRPNCalculator.get(model, 'matrix').calculate(matrix))

				return {
					...options,
					showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
				}
			},
			subscribe: async ({ options }) => {
				const matrix = getFader(instance, model, options, 'matrix')
				if (matrix === null) {
					return
				}

				const nrpn = OutputBalanceNRPNCalculator.get(model, 'matrix').calculate(matrix)

				// Send a "get" so the pan/balance variable is defined.
				void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
			},
			callback: async ({ options }) => {
				const panBalance = getPanBalanceType(instance, model, options, 'matrix')
				if (panBalance === null) {
					return
				}
				const { fader: matrix, panBalanceChoice } = panBalance

				mixer.setMatrixOutputPanBalance(matrix, panBalanceChoice)
			},
		},
	}
}
