import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { tryUpgradeAssignMixOrLREncoding } from '../actions/assign.js'
import { tryUpgradeLevelMixOrLREncoding } from '../actions/level.js'
import { tryUpgradePanBalanceMixOrLREncoding } from '../actions/pan-balance.js'

/**
 * The value of `LR` before it was changed to the constant string `'lr'`.  This
 * value also identified the LR mix in any option defining a mix or LR,
 * requiring an upgrade script be used to convert to the more readable and
 * type-safe `'lr'`.
 */
const ObsoleteLREncoding = 99

/**
 * The value of the LR mix, in any interface that accepts either a mix (0
 * through 11 if there exist mixes 1 to 12) or LR.
 */
export const LR = 'lr'

/** A value specifying either the LR mix or a numbered mix. */
export type MixOrLR = number | typeof LR

type OptionArrayElement = Extract<NonNullable<CompanionOptionValues[string]>, any[]>[0]

const isLRMixAndNeedsUpgrade = (mixOrLR: OptionArrayElement) => Number(mixOrLR) === ObsoleteLREncoding

/**
 * Try to upgrade the given action's option of `optionId` from a mix-or-LR array
 * containing an obsolete encoding of the LR mix as the number 99, to its
 * current encoding as a constant string.
 *
 * @param action
 *   The action to potentially upgrade.
 * @param optionId
 *   The id of the option on the action that might contain an obsolete LR
 *   encoding.  The option is expected to be an array of mixes (potentially
 *   including LR), which is to say an array of numbers either `99` for the LR
 *   mix or `[0, N)` for `N` possible mixes.
 * @returns
 */
export function tryUpgradeMixOrLRArrayEncoding(action: CompanionMigrationAction, optionId: string): boolean {
	const arrayOption = action.options[optionId]
	if (!Array.isArray(arrayOption)) {
		return false
	}

	const index = arrayOption.findIndex(isLRMixAndNeedsUpgrade)
	if (index < 0) {
		return false
	}

	for (let i = index; i < arrayOption.length; i++) {
		if (isLRMixAndNeedsUpgrade(arrayOption[i])) {
			arrayOption[i] = LR
		}
	}

	return true
}

/**
 * Try to upgrade the given action's option of `optionId` to rewrite an obsolete
 * encoding of the LR mix.
 *
 * @param action
 *   The action to potentially upgrade.
 * @param optionId
 *   The id of the option on the action that specifies a mix or LR.  The option
 *   is expected to convert to number 99 if identifying LR, or to `[0, N)` if
 *   identifying a mix.
 * @returns
 *   True if the mix-or-LR was rewritten.
 */
export function tryUpgradeMixOrLROptionEncoding(action: CompanionMigrationAction, optionId: string): boolean {
	const { options } = action
	if (Number(options[optionId]) !== ObsoleteLREncoding) {
		return false
	}

	options[optionId] = LR
	return true
}

/**
 * Historically, many actions that specified "mix or LR" as their source or sink
 * or standalone signal identified the LR mix using the value 99.  All non-LR
 * mixes were identified as `[0, N)`.  This made it fairly easy to confuse the
 * two if you weren't careful (especially before the module was converted to
 * TypeScript).
 *
 * To address this problem and to make "mix or LR" be a union of two types for
 * mixes and LR, LR was changed from `99` to `'lr'`.
 *
 * Update the encoding of LR in all actions to its new encoding.
 *
 * @param action
 *   The action to consider rewriting.
 * @returns
 *   The action if any options containing the obsolete encoding of LR were
 *   encountered.
 */
export function tryUpdateAllLRMixEncodings(action: CompanionMigrationAction): boolean {
	// Every encoding of LR must be changed all at once, so perform the separate
	// partial upgrades together in one combined upgrade script.
	return (
		tryUpgradeAssignMixOrLREncoding(action) ||
		tryUpgradeLevelMixOrLREncoding(action) ||
		tryUpgradePanBalanceMixOrLREncoding(action)
	)
}
