import { zeroIndexedNumber } from './utils/indexed.js'

/**
 * The value of the LR mix, in any interface that accepts either a mix (0
 * through 11 if there exist mixes 1 to 12) or LR.
 */
export const LR = 'LR'

/**
 * In those APIs refer to LR as the sole member of a source/sink category, use
 * `LRStrip` to refer to that sole member.
 */

export const LRStrip = zeroIndexedNumber(0)
