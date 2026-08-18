import type { CompanionInputFieldBase, CompanionInputFieldNumber } from '@companion-module/base'
import { type InputOutputType, type Model, SignalExpressionDescription } from './mixer/model.js'

/**
 * Return a numeric option for selecting a one-indexed signal of the indicated
 * type.
 */
export function faderNumber<Id extends CompanionInputFieldBase['id']>(
	label: string,
	id: Id,
	counts: Model['inputOutputCounts'],
	type: Exclude<InputOutputType, 'lr'>,
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
