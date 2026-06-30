import type { CompanionMigrationAction } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { ObsoleteSoftKeyOp, SoftKeyActionId, SoftKeyOp, tryMakeSoftKeyOneIndexed } from './softkey.js'

function makeObsoleteZeroIndexedSoftKeyAction(softKey: number, pressedsk: ObsoleteSoftKeyOp): CompanionMigrationAction {
	return {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId: SoftKeyActionId.SoftKey,
		options: {
			softKey,
			pressedsk,
		},
	} satisfies CompanionMigrationAction
}

function makeActionWithActionId(actionId: CompanionMigrationAction['actionId']): CompanionMigrationAction {
	return {
		id: 'foobar',
		controlId: '3/1/4',
		actionId,
		options: {
			softKey: 42,
			key: 17,
			pressedsk: ObsoleteSoftKeyOp.Press,
			op: SoftKeyOp.Release,
		},
	}
}

describe('tryMakeSoftKeyOneIndexed', () => {
	test.each([
		[makeActionWithActionId('hello')],
		[makeActionWithActionId('goodbye')],
		[makeActionWithActionId('sawft')],
	])('inapplicable', (action: CompanionMigrationAction) => {
		expect(tryMakeSoftKeyOneIndexed(action)).toBe(false)
		expect(tryMakeSoftKeyOneIndexed(action)).toBe(false)
	})

	test('softKey=0', () => {
		const action = makeObsoleteZeroIndexedSoftKeyAction(0, ObsoleteSoftKeyOp.Press)

		expect(tryMakeSoftKeyOneIndexed(action)).toBe(true)
		expect(action.actionId).toEqual(SoftKeyActionId.SoftKey)
		expect(action.options).toEqual({
			key: 1,
			op: SoftKeyOp.Press,
		})
		expect(action.options).not.toHaveProperty('softKey')

		expect(tryMakeSoftKeyOneIndexed(action)).toBe(false)
		expect(action.actionId).toEqual(SoftKeyActionId.SoftKey)
		expect(action.options).toEqual({
			key: 1,
			op: SoftKeyOp.Press,
		})
	})

	test('softKey=15', () => {
		const action = makeObsoleteZeroIndexedSoftKeyAction(15, ObsoleteSoftKeyOp.Release)

		expect(tryMakeSoftKeyOneIndexed(action)).toBe(true)
		expect(action.actionId).toEqual(SoftKeyActionId.SoftKey)
		expect(action.options).toEqual({
			key: 16,
			op: SoftKeyOp.Release,
		})
		expect(action.options).not.toHaveProperty('softKey')

		expect(tryMakeSoftKeyOneIndexed(action)).toBe(false)
		expect(action.actionId).toEqual(SoftKeyActionId.SoftKey)
		expect(action.options).toEqual({
			key: 16,
			op: SoftKeyOp.Release,
		})
	})
})
