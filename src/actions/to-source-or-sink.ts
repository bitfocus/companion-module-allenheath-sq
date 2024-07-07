import { type CompanionOptionValues } from '@companion-module/base'
import { type SQInstanceInterface as sqInstance } from '../instance-interface.js'
import { type InputOutputType } from '../mixer/model.js'
import { type Model } from '../mixer/model.js'

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
	if (n < model.count.mix || n === 99) {
		return n
	}

	instance.log('error', `Invalid mix-or-LR (${optionValue})`)
	return null
}
