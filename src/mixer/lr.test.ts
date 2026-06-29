import type { CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { tryUpgradeMixOrLRArrayEncoding, tryUpgradeMixOrLROptionEncoding } from './lr.js'
import { LR } from '../types.js'
import { type OldCompanionMigrationAction as CompanionMigrationAction } from '../upgrades/types.js'

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

	test('doubly-obsolete LR as not array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			hooah: 99,
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'hooah')).toBe(false)
		expect(action.options.hooah).toBe(99)
	})

	test('obsolete LR as not array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			spatchcock: 'lr',
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

	test('single element doubly-obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			waldo: [99],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'waldo')).toBe(true)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.waldo).toEqual(['lr'])
	})

	// In theory this shouldn't happen that the upgrade script is run on an
	// upgraded action, but let's play it safe.
	test('single element obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			waldo: ['lr'],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'waldo')).toBe(false)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.waldo).toEqual(['lr'])
	})

	// And again, with modern LR.
	test('single element obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			waldo: ['LR'],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'waldo')).toBe(false)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.waldo).toEqual(['LR'])
	})

	test('multiple elements leading doubly-obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			aight: [99, 2],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'aight')).toBe(true)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.aight).toEqual(['lr', 2])
	})

	test('multiple elements leading obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			aight: ['lr', 2],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'aight')).toBe(false)
		// This upgrade function does only 99 -> 'lr', not 'lr' -> 'LR'.
		expect(action.options.aight).toEqual(['lr', 2])
	})

	// Again, shouldn't happen, but playing it safe.
	test('multiple elements leading obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			kookaburra: ['lr', 2],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'kookaburra')).toBe(false)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.kookaburra).toEqual(['lr', 2])
	})

	// Again, shouldn't happen, but playing it safe.
	test('multiple elements leading modern LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			attaboy: ['LR', 2],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'attaboy')).toBe(false)
		expect(action.options.attaboy).toEqual(['LR', 2])
	})

	test('multiple elements multiple doubly-obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			dorado: [3, 99, 2, 99, 6],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'dorado')).toBe(true)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.dorado).toEqual([3, 'lr', 2, 'lr', 6])
	})

	test('multiple elements last is obsolete LR array', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			legitimateSalvage: [9, 99],
		})

		expect(tryUpgradeMixOrLRArrayEncoding(action, 'legitimateSalvage')).toBe(true)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.legitimateSalvage).toEqual([9, 'lr'])
	})
})

describe('ugprade LR option encoding', () => {
	test('not doubly-obsolete LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			bar: 42,
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'bar')).toBe(false)
		expect(action.options.bar).toBe(42)
	})

	test('doubly-obsolete LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			eit: 99,
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'eit')).toBe(true)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.eit).toBe('lr')
	})

	test('doubly-obsolete LR erroneously as string', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			eit: '99',
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'eit')).toBe(true)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.eit).toBe('lr')
	})

	test('obsolete LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			fnord: 'lr',
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'fnord')).toBe(false)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.fnord).toBe('lr')
	})

	test('modern LR', () => {
		const action: CompanionMigrationAction = makeUpgradeAction({
			fnord: LR,
		})

		expect(tryUpgradeMixOrLROptionEncoding(action, 'fnord')).toBe(false)
		// This upgrade function performs only the partial upgrade to the
		// now-obsolete encoding in lowercase, not the modern user-friendly
		// encoding in uppercase.
		expect(action.options.fnord).toBe('LR')
	})
})
