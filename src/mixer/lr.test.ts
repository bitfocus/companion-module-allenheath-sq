import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { LR, tryUpgradeMixOrLRArrayEncoding, tryUpgradeMixOrLROptionEncoding } from './lr.js'

function makeUpgradeAction(options: CompanionOptionValues): CompanionMigrationAction {
	return {
		actionId: 'foobar',
		controlId: '42',
		id: 'hello',
		options,
	}
}

describe('ugprade LR array encoding', () => {
	test('not array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			bar: 42,
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'bar')).toBe(false)
		expect(action.options.bar).toBe(42)
	})

	test('obsolete LR as not array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			hooah: 99,
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'hooah')).toBe(false)
		expect(action.options.hooah).toBe(99)
	})

	test('modern LR as not array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			spatchcock: LR,
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'spatchcock')).toBe(false)
		expect(action.options.spatchcock).toBe('lr')
	})

	test('empty array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			baz: [],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'baz')).toBe(false)
		expect(action.options.baz).toEqual([])
	})

	test('single element not LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			quux: [17],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'quux')).toBe(false)
		expect(action.options.quux).toEqual([17])
	})

	test('single element obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			waldo: [99],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'waldo')).toBe(true)
		expect(action.options.waldo).toEqual(['lr'])
	})

	// In theory this shouldn't happen that the upgrade script is run on an
	// upgraded action, but let's play it safe.
	test('single element modern LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			waldo: [LR],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'waldo')).toBe(false)
		expect(action.options.waldo).toEqual(['lr'])
	})

	test('multiple elements leading obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			aight: [99, 2],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'aight')).toBe(true)
		expect(action.options.aight).toEqual(['lr', 2])
	})

	// Again, shouldn't happen, but playing it safe.
	test('multiple elements leading modern LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			kookaburra: [LR, 2],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'kookaburra')).toBe(false)
		expect(action.options.kookaburra).toEqual(['lr', 2])
	})

	test('multiple elements multiple obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			dorado: [3, 99, 2, 99, 6],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'dorado')).toBe(true)
		expect(action.options.dorado).toEqual([3, 'lr', 2, 'lr', 6])
	})

	test('multiple elements last is obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			legitimateSalvage: [9, 99],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'legitimateSalvage')).toBe(true)
		expect(action.options.legitimateSalvage).toEqual([9, 'lr'])
	})
})

describe('ugprade LR option encoding', () => {
	test('not obsolete LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			bar: 42,
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'bar')).toBe(false)
		expect(action.options.bar).toBe(42)
	})

	test('obsolete LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			eit: 99,
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'eit')).toBe(true)
		expect(action.options.eit).toBe('lr')
	})

	test('obsolete LR erroneously as string', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			eit: '99',
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'eit')).toBe(true)
		expect(action.options.eit).toBe('lr')
	})

	test('modern LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			fnord: LR,
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'fnord')).toBe(false)
		expect(action.options.fnord).toBe('lr')
	})
})
