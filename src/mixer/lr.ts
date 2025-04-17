/**
 * The value of the LR mix, in any interface that accepts either a mix (0
 * through 11 if there exist mixes 1 to 12) or LR.
 *
 * (This really shouldn't be a number, so that mix numbers and this value can
 * have different types.  But action options currently use `99` to encode LR,
 * and that probably needs to change before this can be changed to e.g. `'lr'`.)
 */
export const LR = 99
