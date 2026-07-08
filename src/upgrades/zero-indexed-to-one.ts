import type { CompanionInputFieldBase, CompanionOptionValues } from '@companion-module/base'

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
