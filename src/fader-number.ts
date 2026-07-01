import type { CompanionInputFieldBase, CompanionInputFieldNumber } from '@companion-module/base'
import type { InputOutputType, Model } from './mixer/model.js'

/**
 * Return a numeric option for selecting a zero-indexed signal of the indicated
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
		default: 0,
		min: 0,
		max: counts[type] - 1,
	}
}
