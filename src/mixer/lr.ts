import type { CompanionInputFieldBase, CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { tryUpgradeAssignMixOrLREncoding } from '../actions/assign.js'
import { tryUpgradeLevelMixOrLREncoding } from '../actions/level.js'
import { tryUpgradePanBalanceMixOrLREncoding } from '../actions/pan-balance.js'
import { LR } from '../types.js'
import { type OneIndexed, oneIndexedNumber, type ZeroIndexed } from '../utils/indexed.js'

/**
 * The value of `LR` before it was changed to the constant string `'lr'`.  This
 * value also identified the LR mix in any option defining a mix or LR,
 * requiring an upgrade script be used to convert to the more readable and
 * type-safe `'lr'`.
 */
const ObsoleteLREncoding = 99

/**
 * A value specifying either the LR mix or a zero-indexed mix.  (Zero indexing
 * means that this type is not for user-visible use.)
 */
export type MixOrLR = ZeroIndexed | typeof LR

type OptionArrayElement = Extract<NonNullable<CompanionOptionValues[string]>, any[]>[0]

const isObsoleteLREncodingAndNeedsUpgrade = (mixOrLR: OptionArrayElement) => Number(mixOrLR) === ObsoleteLREncoding

/**
 * The value of `LR` used to be `'lr'`, lowercase: a perfectly cromulent string
 * for essentially internal use (as long as you weren't manually editing
 * .companionconfig files).
 *
 * But with the 2.0 module API and its ability to let options be specified by
 * expression, suddenly the internal values of options (except if opted out) are
 * user-facing API.
 *
 * It's perfectly debatable whether a lowercased `'lr'` is good enough.  But as
 * all sources/sinks except LR used to be encoded as zero-indexed numbers and
 * required an upgrade, there's reasonable argument to rewrite `'lr'` to `'LR'`
 * in uppercase -- as it appears on the mixer surface to the user -- at the same
 * time.
 *
 * So we have this additional obsolete encoding of LR for upgrade-script
 * purposes.
 */
const ObsoleteLowercaseLREncoding = 'lr'

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

	const index = arrayOption.findIndex(isObsoleteLREncodingAndNeedsUpgrade)
	if (index < 0) {
		return false
	}

	for (let i = index; i < arrayOption.length; i++) {
		if (isObsoleteLREncodingAndNeedsUpgrade(arrayOption[i])) {
			arrayOption[i] = ObsoleteLowercaseLREncoding
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

	options[optionId] = ObsoleteLowercaseLREncoding
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
	// Every encoding of LR must be changed all at once (because `LR` can only
	// have one value), so perform the separate partial upgrades together in one
	// combined upgrade script.
	//
	// Note that each script below only does `99` -> `'lr'`: that is, what it
	// has always done.  If Companion runs this upgrade script on an action, by
	// contract it must also run the upgrade script performing `'lr'` -> `'LR'`
	// because it too will be not-yet-applied.
	return (
		tryUpgradeAssignMixOrLREncoding(action) ||
		tryUpgradeLevelMixOrLREncoding(action) ||
		tryUpgradePanBalanceMixOrLREncoding(action)
	)
}

/**
 * Rewrite an `oldId` option whose value is a zero-indexed-mix-or-lowercase-LR
 * value, to a `newId` option whose value is a one-indexed-mix-or-uppercase-LR
 * value.
 */
export function convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption(
	options: CompanionMigrationAction['options'],
	oldId: CompanionInputFieldBase['id'],
	newId: CompanionInputFieldBase['id'],
): void {
	const oldValue = options[oldId]
	delete options[oldId]

	options[newId] = oldValue === ObsoleteLowercaseLREncoding ? LR : (Number(oldValue) | 0) + 1
}

/**
 * Rewrite an `oldId` option whose value is a zero-indexed-mix-or-lowercase-LR
 * array, to a `newId` option whose value is a one-indexed-mix-or-uppercase-LR
 * array.
 */
export function convertZeroIndexedLowercaseLRArrayOptionToOneIndexedUppercaseLRArrayOption(
	options: CompanionMigrationAction['options'],
	oldId: CompanionInputFieldBase['id'],
	newId: CompanionInputFieldBase['id'],
): void {
	const oldValue = options[oldId]
	delete options[oldId]

	let newValue: (OneIndexed | typeof LR)[]
	if (!Array.isArray(oldValue)) {
		// Transfer the old offending value unaltered, relying on Companion to
		// sanitize it before actually offering it to the action callback.
		newValue = oldValue as unknown as typeof newValue
	} else {
		for (let i = 0, count = oldValue.length; i < count; i++) {
			const oldSignal = oldValue[i]

			let newSignal: OneIndexed | typeof LR
			if (oldSignal === ObsoleteLowercaseLREncoding) {
				newSignal = LR
			} else {
				newSignal = oneIndexedNumber((Number(oldSignal) | 0) + 1)
			}

			oldValue[i] = newSignal
		}
		newValue = oldValue as typeof newValue
	}

	options[newId] = newValue
}
