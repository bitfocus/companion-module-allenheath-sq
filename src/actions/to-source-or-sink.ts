import { type CompanionOptionValues } from '@companion-module/base'
import { type sqInstance } from '../instance.js'
import { type InputOutputType } from '../mixer/model.js'
import { LR, type Model } from '../mixer/model.js'

/** The type of an option value. */
export type OptionValue = CompanionOptionValues[keyof CompanionOptionValues]

/**
 * Given an option value `optionValue` that purports to identify a source of the
 * given `type`, determine whether it refers to a valid source.  If it does,
 * return its number.  If not, log an error and return null.
 *
 * `optionValue` must not refer to the LR mix if `type === 'mix'`.  Use
 * `toMixOrLR` if you need to accept both mixes and LR.
 *
 * @param instance
 *   The active module instance.
 * @param model
 *   The mixer model.
 * @param optionValue
 *   The option value identifying a source of type `type`.
 * @param type
 *   The type of the source being identified.
 */
export function toSourceOrSink(
	instance: sqInstance,
	model: Model,
	optionValue: OptionValue,
	type: InputOutputType,
): number | null {
	const n = Number(optionValue)
	if (n < model.count[type]) {
		return n
	}

	instance.log('error', `Invalid ${type} (${optionValue})`)
	return null
}

/**
 * Given an option value `optionValue` that purports to identify a mix or LR,
 * determine whether it refers to one.  If it does, return its number.  If not,
 * log an error and return null.
 *
 * @param instance
 *   The active module instance.
 * @param model
 *   The mixer model.
 * @param optionValue
 *   The option value identifying a source of type `type`.
 */
export function toMixOrLR(instance: sqInstance, model: Model, optionValue: OptionValue): number | null {
	const n = Number(optionValue)
	if (n < model.count.mix || n === LR) {
		return n
	}

	instance.log('error', `Invalid mix-or-LR (${optionValue})`)
	return null
}

type SourceSinkType = InputOutputType | 'mix-or-lr'

/**
 * Convert an option value referring to a source or sink -- or either a mix *or*
 * LR -- to its numeric value and actual type (which will be the input type
 * unless mix-or-LR is specified, in which case the resulting type will be mix
 * or LR).
 *
 * @param instance
 *   The active module instance.
 * @param model
 *   The mixer model.
 * @param optionValue
 *   The option value identifying a source of type `type`.
 * @param type
 *   The expected type of the source/sink.  If this is `'mix-or-lr`', then the
 *   option value is permitted to refer to either a mix or LR.
 * @returns
 *   `[n, type]` where `n` is the number of the source/sink (which will be `0`
 *   to `n - 1`) and `type` is its actual type.
 */
export function toInputOutput(
	instance: sqInstance,
	model: Model,
	optionValue: OptionValue,
	type: SourceSinkType,
): [number, InputOutputType] | null {
	if (type === 'mix-or-lr') {
		const inputOutput = toMixOrLR(instance, model, optionValue)
		if (inputOutput === null) {
			return null
		}
		if (inputOutput === LR) {
			return [0, 'lr']
		}

		return [inputOutput, 'mix']
	}

	const inputOutput = toSourceOrSink(instance, model, optionValue, type)
	if (inputOutput === null) {
		return null
	}

	return [inputOutput, type]
}
