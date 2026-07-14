import type { CompanionOptionValues } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import type { MixOrLR } from '../mixer/lr.js'
import type { InputOutputType, Model } from '../mixer/model.js'
import { LR } from '../types.js'
import { zeroIndexedNumber, type ZeroIndexed } from '../utils/indexed.js'

/** The type of an option value. */
export type OptionValue = CompanionOptionValues[keyof CompanionOptionValues]

/**
 * Given an option value `optionValue` that purports to identify a zero-indexed
 * source/sink of the given `type`, determine whether it refers to a valid
 * source/sink.  If it does, return its zero-indexed number.  If not, log an
 * error and return null.
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
): ZeroIndexed | null {
	const n = Number(optionValue)
	if (1 <= n && n <= model.inputOutputCounts[type]) {
		return zeroIndexedNumber((n | 0) - 1)
	}

	instance.log('error', `Invalid ${type} (${optionValue})`)
	return null
}

/**
 * Given an option value `optionValue` that purports to identify a one-indexed
 * source/sink of the given `type`, determine whether it refers to a valid
 * source/sink.  If it does, return its zero-indexed number.  (In other words,
 * `optionValue` might equal `1` and this function would then return `0`.)  If
 * not, log an error and return null.
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
export function sourceOrSinkFromOneIndexed(
	instance: sqInstance,
	model: Model,
	optionValue: OptionValue,
	type: Exclude<InputOutputType, 'lr'>,
): ZeroIndexed | null {
	const n = Number(optionValue)
	if (1 <= n && n <= model.inputOutputCounts[type]) {
		return zeroIndexedNumber((n | 0) - 1)
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
export function toMixOrLR(instance: sqInstance, model: Model, optionValue: OptionValue): MixOrLR | null {
	if (optionValue === LR) {
		return LR
	}

	const n = Number(optionValue)
	if (1 <= n && n <= model.inputOutputCounts.mix) {
		return zeroIndexedNumber((n | 0) - 1)
	}

	instance.log('error', `Invalid mix-or-LR (${optionValue})`)
	return null
}
