import type { CompanionInputFieldBase, CompanionInputFieldNumber } from '@companion-module/base'
import type { InputOutputType, Model } from './mixer/model.js'

/**
 * Return a numeric option for selecting a one-indexed signal of the indicated
 * type.
 */
export function faderNumber<Id extends CompanionInputFieldBase['id']>(
	label: string,
	id: Id,
	counts: Model['inputOutputCounts'],
	type: Exclude<InputOutputType, 'lr'>,
): CompanionInputFieldNumber {
	return {
		type: 'number',
		label,
		id,
		default: 1,
		min: 1,
		max: counts[type],
	}
}
