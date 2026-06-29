import type { Equal, Expect } from 'type-testing'

/** Action IDs for all actions that operate softkeys. */
export const SoftKeyActionId = {
	SoftKey: 'key_soft',
} as const

export type SoftKeyActionId = (typeof SoftKeyActionId)[keyof typeof SoftKeyActionId]

export const SoftKeyOptionId = 'key'
export const SoftKeyOpOptionId = 'op'

export const SoftKeyOp = {
	Toggle: 'toggle',
	Press: 'press',
	Release: 'release',
} as const

export type SoftKeyOp = (typeof SoftKeyOp)[keyof typeof SoftKeyOp]

export type SoftKeyOptions = {
	[SoftKeyOptionId]: number
	[SoftKeyOpOptionId]: SoftKeyOp
}

/** Softkey-related actions. */
export type SoftKeyActions = {
	[SoftKeyActionId.SoftKey]: {
		options: SoftKeyOptions
	}
}

type assert_AllSoftKeyActionsAccountedFor = Expect<Equal<keyof SoftKeyActions, SoftKeyActionId>>
