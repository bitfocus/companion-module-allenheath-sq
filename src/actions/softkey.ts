import type { Equal, Expect } from 'type-testing'
import type { CompanionActionDefinition, CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import type { Mixer } from '../mixer/mixer.js'
import type { Model } from '../mixer/model.js'
import { moveZeroIndexedOptionToOneIndexed } from '../upgrades/zero-indexed-to-one.js'
import { zeroIndexedNumber, type ZeroIndexed } from '../utils/indexed.js'
import { repr } from '../utils/pretty.js'

/** Action IDs for all actions that operate softkeys. */
export const SoftKeyActionId = {
	SoftKey: 'key_soft',
} as const

export type SoftKeyActionId = (typeof SoftKeyActionId)[keyof typeof SoftKeyActionId]

const SoftKeyOptionId = 'key'
const SoftKeyOpOptionId = 'op'

export const SoftKeyOp = {
	Toggle: 'toggle',
	Press: 'press',
	Release: 'release',
} as const

export type SoftKeyOp = (typeof SoftKeyOp)[keyof typeof SoftKeyOp]

const ObsoleteZeroBasedSoftKeyOptionId = 'softKey'
const ObsoleteSoftKeyOperationId = 'pressedsk'

export const ObsoleteSoftKeyOp = {
	Toggle: '0',
	Press: '1',
	Release: '2',
} as const

export type ObsoleteSoftKeyOp = (typeof ObsoleteSoftKeyOp)[keyof typeof ObsoleteSoftKeyOp]

/**
 * This module once supported a 'key_soft' action taking a zero-based softkey
 * and an operation identified as an inscutable number with a frankly bizarre
 * option id.  Rewrite it to take a one-based softkey, and in passing rename the
 * operation option id and make it take readable string values.
 */
export function tryMakeSoftKeyOneIndexed(action: CompanionMigrationAction): boolean {
	if (action.actionId !== SoftKeyActionId.SoftKey) {
		return false
	}

	const options = action.options
	if (!(ObsoleteZeroBasedSoftKeyOptionId in options)) {
		return false
	}

	moveZeroIndexedOptionToOneIndexed(options, ObsoleteZeroBasedSoftKeyOptionId, SoftKeyOptionId)

	let op: SoftKeyOp
	switch (String(options[ObsoleteSoftKeyOperationId])) {
		case ObsoleteSoftKeyOp.Toggle:
			op = SoftKeyOp.Toggle
			break
		case ObsoleteSoftKeyOp.Press:
			op = SoftKeyOp.Press
			break
		case ObsoleteSoftKeyOp.Release:
			op = SoftKeyOp.Release
			break
		default:
			// Just transfer the unrecognized op value unchanged.
			op = options[ObsoleteSoftKeyOperationId] as SoftKeyOp
			break
	}
	type assert_opIsSoftKeyOp = Expect<Equal<typeof op, SoftKeyOp>>

	options[SoftKeyOpOptionId] = op
	delete options[ObsoleteSoftKeyOperationId]

	return true
}

type SoftKeyOptions = {
	softKey: ZeroIndexed
	op: SoftKeyOp
}

function getSoftKeyOptions(instance: sqInstance, model: Model, options: CompanionOptionValues): SoftKeyOptions | null {
	const softKeyVal = Number(options[SoftKeyOptionId]) | 0
	if (!(1 <= softKeyVal && softKeyVal <= model.softKeys)) {
		instance.log('error', `Attempting to operate invalid softkey ${softKeyVal}, ignoring`)
		return null
	}
	const softKey = zeroIndexedNumber(softKeyVal - 1)

	const option = String(options[SoftKeyOpOptionId])
	let op: SoftKeyOp
	switch (option) {
		case SoftKeyOp.Press:
		case SoftKeyOp.Release:
		case SoftKeyOp.Toggle:
			op = option
			break
		default:
			instance.log('error', `Bad softkey operation value ${repr(option)}, ignoring`)
			return null
	}

	return { softKey, op }
}

/**
 * Generate action definitions for operating mixer softkeys.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param choices
 *   Option choices for use in the actions.
 * @returns
 *   The set of all softkey action definitions.
 */
export function softKeyActions(instance: sqInstance, mixer: Mixer): Record<SoftKeyActionId, CompanionActionDefinition> {
	const model = mixer.model

	return {
		[SoftKeyActionId.SoftKey]: {
			name: 'Press Softkey',
			options: [
				{
					type: 'number',
					label: 'Soft Key',
					id: SoftKeyOptionId,
					default: 1,
					min: 1,
					max: model.softKeys,
				},
				{
					type: 'dropdown',
					label: 'Operation',
					id: SoftKeyOpOptionId,
					default: SoftKeyOp.Press,
					choices: [
						{ id: SoftKeyOp.Toggle, label: 'Toggle' },
						{ id: SoftKeyOp.Press, label: 'Press' },
						{ id: SoftKeyOp.Release, label: 'Release' },
					],
					minChoicesForSearch: 5,
				},
			],
			callback: async ({ options }) => {
				const opts = getSoftKeyOptions(instance, model, options)
				if (opts === null) {
					return
				}

				const { softKey, op } = opts
				switch (op) {
					case SoftKeyOp.Toggle:
					// XXX This is what the module historically did, but it
					//     isn't actually toggling.  Is there actually a way to
					//     toggle?  It doesn't look like there is...
					// eslint-disable-next-line no-fallthrough
					case SoftKeyOp.Press: {
						mixer.pressSoftKey(softKey)
						break
					}
					case SoftKeyOp.Release: {
						mixer.releaseSoftKey(softKey)
						break
					}
				}
			},
		},
	}
}
