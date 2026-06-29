import { tryMakeAssignOptionsUserFriendly } from './assign.js'
import { tryMakeLevelSourceSinkOptionsUserFriendly } from './level.js'
import { tryMakePanBalanceSourceSinkOptionsUserFriendly } from './pan-balance.js'
import type { OldCompanionMigrationAction as CompanionMigrationAction } from '../upgrades/types.js'

/**
 * Action options used to encode particular sources and sinks using zero-indexed
 * numbers, and the LR source/sink as the exact string `'lr'`.
 *
 * In a 2.0 module API world, option values now are part of the user-exposed
 * interface rather being internal, because it's desirable to allow their
 * encoding from expressions.  Thus it's desirable for "Mix 1" encoded as `0`
 * and the LR mix encoded as `'lr'`, to instead be encoded as `1` and `'LR'`.
 * (The latter is much more debatable than the former, but we might as well make
 * both as user-friendly as possible when running through them.)
 *
 * This function attempts to upgrade actions using these less user-friendly
 * option values, to use replacement user-friendly option forms.
 *
 * @param action
 *   The action to upgrade.
 * @returns True iff the action's options were upgraded.
 */
export function tryMakeSourceSinkOptionsUserFriendly(action: CompanionMigrationAction): boolean {
	// Rewriting every source/sink option that takes zero-indexed mix-or-LR
	// values to be one-indexed *could* be split on a per-action-subset basis,
	// if `toMixOrLR` were also forked into a one-indexed variety.  But once you
	// lump in a `'lr'` -> `'LR'` change too, a point is reached where it seems
	// clearest to do both changes in a single upgrade script (just as the
	// previous `99` -> `'lr'` upgrade did it), with each subset doing its own
	// subset of upgrading in its own separate function.
	return (
		tryMakeAssignOptionsUserFriendly(action) ||
		tryMakeLevelSourceSinkOptionsUserFriendly(action) ||
		tryMakePanBalanceSourceSinkOptionsUserFriendly(action)
	)
}
