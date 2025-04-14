import type { CompanionMigrationAction } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { PanBalanceActionId, tryUpgradePanBalanceMixOrLREncoding } from './pan-balance.js'

function makeObsoletePanBalanceAction(
	actionId: PanBalanceActionId,
	source: number,
	sink: number,
): CompanionMigrationAction {
	return {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId,
		options: {
			input: source,
			assign: sink,
			leveldb: 'CTR',
			showvar: '',
		},
	}
}

describe("upgrade mix=99 to mix='lr' in pan/balance actions", () => {
	test('unaffected', () => {
		const action = makeObsoletePanBalanceAction(PanBalanceActionId.GroupPanBalanceInMatrix, 2, 1)

		expect(tryUpgradePanBalanceMixOrLREncoding(action)).toBe(false)
		expect(action.options).toEqual({
			input: 2,
			assign: 1,
			leveldb: 'CTR',
			showvar: '',
		})
	})

	describe('inputChannel in mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoletePanBalanceAction(PanBalanceActionId.InputChannelPanBalanceInMixOrLR, 17, 5)

			expect(tryUpgradePanBalanceMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				input: 17,
				assign: 5,
				leveldb: 'CTR',
				showvar: '',
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoletePanBalanceAction(PanBalanceActionId.InputChannelPanBalanceInMixOrLR, 13, 99)

			expect(tryUpgradePanBalanceMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				input: 13,
				assign: 'lr',
				leveldb: 'CTR',
				showvar: '',
			})
		})
	})

	describe('group in mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoletePanBalanceAction(PanBalanceActionId.GroupPanBalanceInMixOrLR, 1, 9)

			expect(tryUpgradePanBalanceMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				input: 1,
				assign: 9,
				leveldb: 'CTR',
				showvar: '',
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoletePanBalanceAction(PanBalanceActionId.InputChannelPanBalanceInMixOrLR, 0, 99)

			expect(tryUpgradePanBalanceMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				input: 0,
				assign: 'lr',
				leveldb: 'CTR',
				showvar: '',
			})
		})
	})

	describe('fxr in mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoletePanBalanceAction(PanBalanceActionId.FXReturnPanBalanceInMixOrLR, 3, 6)

			expect(tryUpgradePanBalanceMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				input: 3,
				assign: 6,
				leveldb: 'CTR',
				showvar: '',
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoletePanBalanceAction(PanBalanceActionId.InputChannelPanBalanceInMixOrLR, 2, 99)

			expect(tryUpgradePanBalanceMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				input: 2,
				assign: 'lr',
				leveldb: 'CTR',
				showvar: '',
			})
		})
	})

	describe('mix/lr in matrix', () => {
		test('not lr source', () => {
			const notLRSource = makeObsoletePanBalanceAction(PanBalanceActionId.MixOrLRPanBalanceInMatrix, 5, 1)

			expect(tryUpgradePanBalanceMixOrLREncoding(notLRSource)).toBe(false)
			expect(notLRSource.options).toEqual({
				input: 5,
				assign: 1,
				leveldb: 'CTR',
				showvar: '',
			})
		})

		test('lr source', () => {
			const lrSource = makeObsoletePanBalanceAction(PanBalanceActionId.MixOrLRPanBalanceInMatrix, 99, 2)

			expect(tryUpgradePanBalanceMixOrLREncoding(lrSource)).toBe(true)
			expect(lrSource.options).toEqual({
				input: 'lr',
				assign: 2,
				leveldb: 'CTR',
				showvar: '',
			})
		})
	})
})
