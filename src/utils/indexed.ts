import type { Branded } from './brand.js'

/** A number in range `[1, n]`. */
export type OneIndexed = Branded<number, 'one-indexed-number'>

/** Convert a one-indexed number to `OneIndexed`. */
export function oneIndexedNumber(n: number): OneIndexed {
	if (n === 0) {
		throw new RangeError('0 was treated as a one-indexed number')
	}
	return n as OneIndexed
}
