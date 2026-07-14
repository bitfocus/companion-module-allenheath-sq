import type { CompanionInputFieldBase, CompanionOptionValues } from '@companion-module/base'
import { type OneIndexed, oneIndexedNumber } from '../utils/indexed.js'

/**
 * Move a zero-indexed numeric integer `oldId` option to `newId` in `options`,
 * adding one to it to make it one-indexed.
 */
export function moveZeroIndexedOptionToOneIndexed(
	options: CompanionOptionValues,
	oldId: CompanionInputFieldBase['id'],
	newId: CompanionInputFieldBase['id'],
): void {
	const zeroIndexed = Number(options[oldId]) | 0
	delete options[oldId]

	options[newId] = zeroIndexed + 1
}

/**
 * Move an array of zero-indexed numeric integers in the `oldId` option to an
 * array of one-indexed numeric integers in the `newId` in `options`.
 */
export function convertZeroIndexedArrayOptionToOneIndexed(
	options: CompanionOptionValues,
	oldId: CompanionInputFieldBase['id'],
	newId: CompanionInputFieldBase['id'],
): void {
	const oldValue = options[oldId]
	delete options[oldId]

	let newValue: OneIndexed[]
	if (!Array.isArray(oldValue)) {
		// Transfer the old offending value unaltered, relying on Companion to
		// sanitize it before actually offering it to the action callback.
		newValue = oldValue as unknown as typeof newValue
	} else {
		newValue = []
		for (let i = 0, count = oldValue.length; i < count; i++) {
			const zeroIndexed = Number(oldValue[i])
			if (!isNaN(zeroIndexed)) {
				newValue.push(oneIndexedNumber((zeroIndexed | 0) + 1))
			}
		}
	}

	options[newId] = newValue
}
