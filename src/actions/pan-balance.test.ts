import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { tryMakePanBalanceSourceSinkOptionsUserFriendly, tryUpgradePanBalanceMixOrLREncoding } from './pan-balance.js'
import { PanBalanceActionId } from './schemas/pan-balance.js'
import type { PanBalanceChoice } from './schemas/panning.js'

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

describe('upgrading pan/balance-setting options to be more user-friendly', () => {
	test.for([
		'not-a-level-actionid',
		PanBalanceActionId.FXReturnPanBalanceInGroup, // obsolete action, options will not be written
	] as const)("$0 isn't a pan/balance-setting action with user-unfriendly options", (actionId) => {
		const immutableOptions = {
			input: 2,
			assign: 4,
			leveldb: 'CTR',
		} as const satisfies CompanionOptionValues

		const action: CompanionMigrationAction = {
			id: 'zyxwVUTS',
			controlId: '3/1/4',
			actionId,
			options: structuredClone(immutableOptions),
		}
		expect(action.options).not.toBe(immutableOptions)

		expect(tryMakePanBalanceSourceSinkOptionsUserFriendly(action)).toBe(false)
		expect(action.options).toEqual(immutableOptions)

		expect(tryMakePanBalanceSourceSinkOptionsUserFriendly(action)).toBe(false)
		expect(action.options).toEqual(immutableOptions)
	})

	type UnfriendlyOptions = {
		input: number | 'lr'
		assign: number | 'lr'
		leveldb: PanBalanceChoice
	}

	function makeUserUnfriendlyLevelAction(
		actionId: PanBalanceActionId,
		options: UnfriendlyOptions,
	): CompanionMigrationAction {
		return {
			id: 'zyxwVUTS',
			controlId: '3/1/4',
			actionId,
			options,
		}
	}

	type OptionTest = {
		unfriendly: UnfriendlyOptions
		rewritten: CompanionOptionValues
	}

	const tests: [Exclude<PanBalanceActionId, 'fxrpan_to_grp'>, ...OptionTest[]][] = [
		[
			PanBalanceActionId.FXReturnPanBalanceInMixOrLR,
			{
				unfriendly: {
					input: 2,
					assign: 1,
					leveldb: 'CTR',
				},
				rewritten: {
					source: 3,
					sink: 2,
					leveldb: 'CTR',
				},
			},
			{
				unfriendly: {
					input: 0,
					assign: 'lr',
					leveldb: 'L100',
				},
				rewritten: {
					source: 1,
					sink: 'LR',
					leveldb: 'L100',
				},
			},
		],
		[
			PanBalanceActionId.GroupPanBalanceInMatrix,
			{
				unfriendly: {
					input: 2,
					assign: 1,
					leveldb: 'L50',
				},
				rewritten: {
					source: 3,
					sink: 2,
					leveldb: 'L50',
				},
			},
			{
				unfriendly: {
					input: 5,
					assign: 0,
					leveldb: 'R100',
				},
				rewritten: {
					source: 6,
					sink: 1,
					leveldb: 'R100',
				},
			},
		],
		[
			PanBalanceActionId.GroupPanBalanceInMixOrLR,
			{
				unfriendly: {
					input: 1,
					assign: 'lr',
					leveldb: 'L75',
				},
				rewritten: {
					source: 2,
					sink: 'LR',
					leveldb: 'L75',
				},
			},
			{
				unfriendly: {
					input: 3,
					assign: 0,
					leveldb: 'L75',
				},
				rewritten: {
					source: 4,
					sink: 1,
					leveldb: 'L75',
				},
			},
		],
		[
			PanBalanceActionId.InputChannelPanBalanceInMixOrLR,
			{
				unfriendly: {
					input: 37,
					assign: 'lr',
					leveldb: 'R25',
				},
				rewritten: {
					source: 38,
					sink: 'LR',
					leveldb: 'R25',
				},
			},
			{
				unfriendly: {
					input: 17,
					assign: 6,
					leveldb: 'L75',
				},
				rewritten: {
					source: 18,
					sink: 7,
					leveldb: 'L75',
				},
			},
		],
		[
			PanBalanceActionId.MixOrLRPanBalanceInMatrix,
			{
				unfriendly: {
					input: 'lr',
					assign: 2,
					leveldb: 'L50',
				},
				rewritten: {
					source: 'LR',
					sink: 3,
					leveldb: 'L50',
				},
			},
			{
				unfriendly: {
					input: 5,
					assign: 0,
					leveldb: 'R100',
				},
				rewritten: {
					source: 6,
					sink: 1,
					leveldb: 'R100',
				},
			},
		],
	]

	describe.for(tests)('upgrading $0 user-unfriendly options', ([actionId, ...optionPairs]) => {
		test.for(optionPairs)(
			`rewriting ${actionId} { input: $unfriendly.input, assign: $unfriendly.assign }`,
			({ unfriendly: unfriendlyOptions, rewritten: rewrittenOptions }) => {
				const action = makeUserUnfriendlyLevelAction(actionId, unfriendlyOptions)

				expect(
					tryMakePanBalanceSourceSinkOptionsUserFriendly(action),
					'tryMakePanBalanceSourceSinkOptionsUserFriendly returns true applied to user-unfriendly level action',
				).toBe(true)
				expect(action.options).toEqual(rewrittenOptions)

				expect(
					tryMakePanBalanceSourceSinkOptionsUserFriendly(action),
					'tryMakePanBalanceSourceSinkOptionsUserFriendly returns false applied a second time to user-unfriendly level action',
				).toBe(false)
				expect(action.options).toEqual(rewrittenOptions)
			},
		)
	})
})
