import type { Expect, IsNever } from 'type-testing'
import type { CompanionActionDefinition, CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { OutputFaderOptionId } from './common.js'
import { faderNumberZeroIndexed } from '../../fader-number.js'
import { FadingOption, getFadeType, LevelOption } from '../fading.js'
import type { sqInstance } from '../../instance.js'
import type { Mixer } from '../../mixer/mixer.js'
import type { InputOutputType, Model } from '../../mixer/model.js'
import { getCommonCount } from '../../mixer/models.js'
import type { NRPN } from '../../mixer/nrpn/nrpn.js'
import { OutputLevelNRPNCalculator, type SinkAsOutputForNRPN } from '../../mixer/nrpn/output.js'
import { toSourceOrSink } from '../to-source-or-sink.js'
import { LRStrip } from '../../types.js'

/**
 * Action IDs for all actions affecting the level of sinks when used as direct
 * mixer outputs.
 */
export const OutputLevelActionId = {
	LRLevelOutput: 'lr_level_output',
	MixLevelOutput: 'mix_level_output',
	FXSendLevelOutput: 'fxsend_level_output',
	MatrixLevelOutput: 'matrix_level_output',
	DCALevelOutput: 'dca_level_output',
} as const

export type OutputLevelActionId = (typeof OutputLevelActionId)[keyof typeof OutputLevelActionId]

/**
 * The action ID of the obsolete "Fader level to output" action, used to alter
 * the level of sinks of all types when assigned to a physical mixer output.
 */
export const ObsoleteLevelToOutputId = 'level_to_output'

/**
 * Adjusting the level of various mixer sinks that can be assigned to physical
 * mixer outputs used to be done in one "Fader level to output" action.  One of
 * its options was a laundry list of all sinks (LR/mix/FX send/matrix/DCA) that
 * could be assigned to physical mixer outputs.  Each option value corresponded
 * exactly to the necessary offset from an NRPN base for all level-output NRPNs.
 * This meshed with internal fading logic but introduced a conceptual hurdle --
 * and prevented sensibly exposing output-level-modifying functionality in
 * `Mixer` without replicating the peculiar NRPN calculations.
 *
 * For clarity, and to reduce this NRPN encoding dependence, this action was
 * split into one action per sink category: separate "LR fader level to output",
 * "Mix fader level to output", &c. actions.  Each action identifies its sink
 * the normal way sources and sinks are identified, i.e. with a number in
 * `[0, sinkCount)` for sinks 1 to N.
 *
 * This function rewrites any old-style "level to output" actions to new,
 * sink-type-specific actions.
 */
export function tryConvertOldLevelToOutputActionToSinkSpecific(action: CompanionMigrationAction): boolean {
	if (action.actionId !== ObsoleteLevelToOutputId) {
		return false
	}

	const mixCount = getCommonCount('mixCount')
	const fxsCount = getCommonCount('fxsCount')
	const mtxCount = getCommonCount('mtxCount')
	const dcaCount = getCommonCount('dcaCount')

	// Old output level action options:
	//
	// options: [
	//      {
	//              type: 'dropdown',
	//              label: 'Fader',
	//              id: OutputFaderOptionId,
	//              default: 0,
	//              choices: choices.allFaders,
	//              minChoicesForSearch: 0,
	//      },
	//      ...
	// ],
	//
	// Old output level fader options:
	//
	// // All fader mix choices
	// const allFaders: DropdownChoice[] = []
	// allFaders.push({ label: `LR`, id: 0 })
	// model.forEach('mix', (mix, mixLabel) => {
	//      allFaders.push({ label: mixLabel, id: mix + 1 })
	// })
	// model.forEach('fxSend', (fxs, fxsLabel) => {
	//      allFaders.push({ label: fxsLabel, id: fxs + 1 + model.count.mix })
	// })
	// model.forEach('matrix', (matrix, matrixLabel) => {
	//      allFaders.push({ label: matrixLabel, id: matrix + 1 + model.count.mix + model.count.fxSend })
	// })
	// model.forEach('dca', (dca, dcaLabel) => {
	//      allFaders.push({
	//              label: dcaLabel,
	//              id: dca + 1 + model.count.mix + model.count.fxSend + model.count.matrix + 12,
	//      })
	// })
	// return allFaders
	const options = action.options
	const input = Number(options[OutputFaderOptionId])
	let newInput, newActionId
	if (input < 0) {
		// No valid inputs below zero.  Do nothing so an invalid option is
		// retained as-is.
		return false
	} else if (input < 1) {
		// LR is 0.
		// The new action doesn't include an input property because there's only
		// one LR.
		delete options[OutputFaderOptionId]
		action.actionId = OutputLevelActionId.LRLevelOutput
		return true
	} else if (input < 1 + mixCount) {
		// Mix is [0x1, 0x1 + 12).
		newInput = input - 1
		newActionId = OutputLevelActionId.MixLevelOutput
	} else if (input < 1 + mixCount + fxsCount) {
		// FX send is [0xd, 0xd + 4).
		newInput = input - (1 + mixCount)
		newActionId = OutputLevelActionId.FXSendLevelOutput
	} else if (input < 1 + mixCount + fxsCount + mtxCount) {
		// Matrix is [0x11, 0x11 + 3).
		newInput = input - (1 + mixCount + fxsCount)
		newActionId = OutputLevelActionId.MatrixLevelOutput
	} else if (input < 1 + mixCount + fxsCount + mtxCount + 12) {
		// This 12-element gap in the NRPN table doesn't encode anything.  Do
		// nothing so an invalid option is retained as-is.
		return false
	} else if (input < 1 + mixCount + fxsCount + mtxCount + 12 + dcaCount) {
		// DCA is [0x20, 0x20 + 8).
		newInput = input - (1 + mixCount + fxsCount + mtxCount + 12)
		newActionId = OutputLevelActionId.DCALevelOutput
	} else {
		// All other numbers are invalid encodings.  Do nothing so an invalid
		// option is retained as-is.
		return false
	}

	options[OutputFaderOptionId] = newInput
	action.actionId = newActionId
	return true
}

function getOutputLevelNRPN(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sinkType: Exclude<SinkAsOutputForNRPN<'level'>, 'lr'>,
): NRPN<'level'> | null {
	const sink = toSourceOrSink(instance, model, options[OutputFaderOptionId], sinkType)
	if (sink === null) {
		return null
	}

	return OutputLevelNRPNCalculator.get(model, sinkType).calculate(sink)
}

/**
 * Generate action definitions for adjusting the levels of various mixer sinks
 * when they're assigned to mixer outputs.
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
export function outputLevelActions(
	instance: sqInstance,
	mixer: Mixer,
): Record<OutputLevelActionId, CompanionActionDefinition> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	const faderOption = (label: string, type: Exclude<InputOutputType, 'lr'>) =>
		faderNumberZeroIndexed(label, OutputFaderOptionId, counts, type)

	const fadeAction = <Options extends CompanionOptionValues>(nrpn: NRPN<'level'>, options: Options) => {
		const fadeType = getFadeType(instance, options)
		if (fadeType === null) {
			return
		}

		switch (fadeType.type) {
			case 'absolute':
				mixer.absoluteFade(nrpn, fadeType.fadeTimeMs, fadeType.level)
				return
			case 'relative':
				mixer.relativeFade(nrpn, fadeType.fadeTimeMs, fadeType.dbDelta)
				return
			case 'last-value':
				// XXX It's not clear if this ever even worked, and also it's
				//     wildly unclear what "last value" even means/meant, in the
				//     presence of fades of nonzero duration (not to mention
				//     stuff like manually adjusting the fader on the mixer
				//     surface generating a series of level messages).  Just
				//     don't do anything in this case for now.
				return
			default: {
				type assert_FadeTypeIsNever = Expect<IsNever<typeof fadeType>>
				instance.log('warn', `Invalid fade type ${(fadeType as any).type}, ignoring`)
				return
			}
		}
	}

	return {
		[OutputLevelActionId.LRLevelOutput]: {
			name: 'LR fader level to output',
			options: [
				// There's only one LR, so don't include an input option.
				LevelOption,
				FadingOption,
			],
			callback: async ({ options }) => {
				const nrpn = OutputLevelNRPNCalculator.get(model, 'lr').calculate(LRStrip)
				fadeAction(nrpn, options)
			},
		},

		[OutputLevelActionId.MixLevelOutput]: {
			name: 'Mix fader level to output',
			options: [faderOption('Mix', 'mix'), LevelOption, FadingOption],
			callback: async ({ options }) => {
				const nrpn = getOutputLevelNRPN(instance, model, options, 'mix')
				if (nrpn === null) {
					return
				}
				fadeAction(nrpn, options)
			},
		},

		[OutputLevelActionId.FXSendLevelOutput]: {
			name: 'FX Send fader level to output',
			options: [faderOption('FX Send', 'fxSend'), LevelOption, FadingOption],
			callback: async ({ options }) => {
				const nrpn = getOutputLevelNRPN(instance, model, options, 'fxSend')
				if (nrpn === null) {
					return
				}
				fadeAction(nrpn, options)
			},
		},

		[OutputLevelActionId.MatrixLevelOutput]: {
			name: 'Matrix fader level to output',
			options: [faderOption('Matrix', 'matrix'), LevelOption, FadingOption],
			callback: async ({ options }) => {
				const nrpn = getOutputLevelNRPN(instance, model, options, 'matrix')
				if (nrpn === null) {
					return
				}
				fadeAction(nrpn, options)
			},
		},

		[OutputLevelActionId.DCALevelOutput]: {
			name: 'DCA fader level to output',
			options: [faderOption('DCA', 'dca'), LevelOption, FadingOption],
			callback: async ({ options }) => {
				const nrpn = getOutputLevelNRPN(instance, model, options, 'dca')
				if (nrpn === null) {
					return
				}
				fadeAction(nrpn, options)
			},
		},
	}
}
