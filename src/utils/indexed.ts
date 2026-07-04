import type { Branded } from './brand.js'

/** A nonnegative integer in the semantic range `[0, n)`. */
export type ZeroIndexed = Branded<number, 'zero-indexed-number'>

/**
 * Convert a number with the semantic sense of `ZeroIndexed`, to `ZeroIndexed`.
 */
export function zeroIndexedNumber(n: number): ZeroIndexed {
	return n as ZeroIndexed
}

/** A nonnegative integer in the semantic range `[1, n]`. */
export type OneIndexed = Branded<number, 'one-indexed-number'>

/**
 * Convert a number with the semantic sense of `OneIndexed`, to `OneIndexed`.
 */
export function oneIndexedNumber(n: number): OneIndexed {
	if (n <= 0) {
		throw new RangeError('0 was treated as a one-indexed number')
	}
	return n as OneIndexed
}
