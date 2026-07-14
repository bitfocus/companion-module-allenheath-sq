import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { LevelActionId, tryUpgradeLevelMixOrLREncoding, tryMakeLevelSourceSinkOptionsUserFriendly } from './level.js'
import type { Level } from '../mixer/level.js'

function makeObsoleteLevelAction(actionId: LevelActionId, input: number, assign: number[]): CompanionMigrationAction {
	return {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId,
		options: {
			input,
			assign,
			leveldb: 0, // 0dB
			fade: 1, // 1s
		},
	} satisfies CompanionMigrationAction
}

describe("upgrade mix=99 to mix='lr' in level actions", () => {
	test('unaffected', () => {
		const action = makeObsoleteLevelAction(LevelActionId.InputChannelLevelInFXSend, 2, [1])

		expect(tryUpgradeLevelMixOrLREncoding(action)).toBe(false)
		expect(action.options).toEqual({
			input: 2,
			assign: [1],
			leveldb: 0,
			fade: 1,
		})
	})

	describe('inputChannel in mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoleteLevelAction(LevelActionId.InputChannelLevelInMixOrLR, 3, [2])

			expect(tryUpgradeLevelMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				input: 3,
				assign: [2],
				leveldb: 0,
				fade: 1,
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoleteLevelAction(LevelActionId.InputChannelLevelInMixOrLR, 5, [6, 99])

			expect(tryUpgradeLevelMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				input: 5,
				assign: [6, 'lr'],
				leveldb: 0,
				fade: 1,
			})
		})
	})

	describe('group in mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoleteLevelAction(LevelActionId.GroupLevelInMixOrLR, 3, [2])

			expect(tryUpgradeLevelMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				input: 3,
				assign: [2],
				leveldb: 0,
				fade: 1,
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoleteLevelAction(LevelActionId.GroupLevelInMixOrLR, 2, [99, 7])

			expect(tryUpgradeLevelMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				input: 2,
				assign: ['lr', 7],
				leveldb: 0,
				fade: 1,
			})
		})
	})

	describe('fxReturn in mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoleteLevelAction(LevelActionId.FXReturnLevelInMixOrLR, 1, [5])

			expect(tryUpgradeLevelMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				input: 1,
				assign: [5],
				leveldb: 0,
				fade: 1,
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoleteLevelAction(LevelActionId.FXReturnLevelInMixOrLR, 3, [6, 99])

			expect(tryUpgradeLevelMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				input: 3,
				assign: [6, 'lr'],
				leveldb: 0,
				fade: 1,
			})
		})
	})

	describe('mix/lr in matrix', () => {
		test('not lr source', () => {
			const notLRSource = makeObsoleteLevelAction(LevelActionId.MixOrLRLevelInMatrix, 1, [5])

			expect(tryUpgradeLevelMixOrLREncoding(notLRSource)).toBe(false)
			expect(notLRSource.options).toEqual({
				input: 1,
				assign: [5],
				leveldb: 0,
				fade: 1,
			})
		})

		test('lr source', () => {
			const lrSource = makeObsoleteLevelAction(LevelActionId.MixOrLRLevelInMatrix, 99, [3, 0])

			expect(tryUpgradeLevelMixOrLREncoding(lrSource)).toBe(true)
			expect(lrSource.options).toEqual({
				input: 'lr',
				assign: [3, 0],
				leveldb: 0,
				fade: 1,
			})
		})
	})
})

describe('upgrading level-setting options to be more user-friendly', () => {
	test.for([
		'not-a-level-actionid',
		LevelActionId.FXReturnLevelInGroup, // obsolete action, options will not be written
	] as const)("$0 isn't a level-setting action with user-unfriendly options", (actionId) => {
		const immutableOptions = {
			input: 2,
			assign: [1, 2, 3],
			fade: 42,
			leveldb: 17,
		} as const satisfies CompanionOptionValues

		const action: CompanionMigrationAction = {
			id: 'zyxwVUTS',
			controlId: '3/1/4',
			actionId,
			options: structuredClone(immutableOptions),
		}
		expect(action.options).not.toBe(immutableOptions)

		expect(tryMakeLevelSourceSinkOptionsUserFriendly(action)).toBe(false)
		expect(action.options).toEqual(immutableOptions)

		expect(tryMakeLevelSourceSinkOptionsUserFriendly(action)).toBe(false)
		expect(action.options).toEqual(immutableOptions)
	})

	type UnfriendlyOptions = {
		input: number | 'lr'
		assign: number | 'lr'
		fade: number
		leveldb: Level
	}

	function makeUserUnfriendlyLevelAction(
		actionId: LevelActionId,
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

	const tests: [Exclude<LevelActionId, 'fxrlev_to_grp'>, ...OptionTest[]][] = [
		[
			LevelActionId.FXReturnLevelInFXSend,
			{
				unfriendly: {
					input: 2,
					assign: 0,
					fade: 1,
					leveldb: '-inf',
				},
				rewritten: {
					source: 3,
					sink: 1,
					fade: 1,
					leveldb: '-inf',
				},
			},
			{
				unfriendly: {
					input: 0,
					assign: 1,
					fade: 0,
					leveldb: 0,
				},
				rewritten: {
					source: 1,
					sink: 2,
					fade: 0,
					leveldb: 0,
				},
			},
		],
		[
			LevelActionId.FXReturnLevelInMixOrLR,
			{
				unfriendly: {
					input: 2,
					assign: 'lr',
					fade: 1,
					leveldb: '-inf',
				},
				rewritten: {
					source: 3,
					sink: 'LR',
					fade: 1,
					leveldb: '-inf',
				},
			},
			{
				unfriendly: {
					input: 1,
					assign: 8,
					fade: 2,
					leveldb: -10,
				},
				rewritten: {
					source: 2,
					sink: 9,
					fade: 2,
					leveldb: -10,
				},
			},
		],
		[
			LevelActionId.GroupLevelInFXSend,
			{
				unfriendly: {
					input: 1,
					assign: 2,
					fade: 1,
					leveldb: -7,
				},
				rewritten: {
					source: 2,
					sink: 3,
					fade: 1,
					leveldb: -7,
				},
			},
			{
				unfriendly: {
					input: 2,
					assign: 0,
					fade: 1,
					leveldb: 5,
				},
				rewritten: {
					source: 3,
					sink: 1,
					fade: 1,
					leveldb: 5,
				},
			},
		],
		[
			LevelActionId.GroupLevelInMatrix,
			{
				unfriendly: {
					input: 6,
					assign: 2,
					fade: 1,
					leveldb: -30,
				},
				rewritten: {
					source: 7,
					sink: 3,
					fade: 1,
					leveldb: -30,
				},
			},
			{
				unfriendly: {
					input: 3,
					assign: 0,
					fade: 1,
					leveldb: 2,
				},
				rewritten: {
					source: 4,
					sink: 1,
					fade: 1,
					leveldb: 2,
				},
			},
		],
		[
			LevelActionId.GroupLevelInMixOrLR,
			{
				unfriendly: {
					input: 2,
					assign: 7,
					fade: 1,
					leveldb: '-inf',
				},
				rewritten: {
					source: 3,
					sink: 8,
					fade: 1,
					leveldb: '-inf',
				},
			},
			{
				unfriendly: {
					input: 4,
					assign: 'lr',
					fade: 2,
					leveldb: '-inf',
				},
				rewritten: {
					source: 5,
					sink: 'LR',
					fade: 2,
					leveldb: '-inf',
				},
			},
		],
		[
			LevelActionId.InputChannelLevelInFXSend,
			{
				unfriendly: {
					input: 23,
					assign: 0,
					fade: 0,
					leveldb: -25,
				},
				rewritten: {
					source: 24,
					sink: 1,
					fade: 0,
					leveldb: -25,
				},
			},
			{
				unfriendly: {
					input: 17,
					assign: 2,
					fade: 1,
					leveldb: -25,
				},
				rewritten: {
					source: 18,
					sink: 3,
					fade: 1,
					leveldb: -25,
				},
			},
		],
		[
			LevelActionId.InputChannelLevelInMixOrLR,
			{
				unfriendly: {
					input: 47,
					assign: 'lr',
					fade: 0,
					leveldb: 0,
				},
				rewritten: {
					source: 48,
					sink: 'LR',
					fade: 0,
					leveldb: 0,
				},
			},
			{
				unfriendly: {
					input: 0,
					assign: 11,
					fade: 0,
					leveldb: 0,
				},
				rewritten: {
					source: 1,
					sink: 12,
					fade: 0,
					leveldb: 0,
				},
			},
		],
		[
			LevelActionId.MixOrLRLevelInMatrix,
			{
				unfriendly: {
					input: 0,
					assign: 1,
					fade: 1,
					leveldb: '-inf',
				},
				rewritten: {
					source: 1,
					sink: 2,
					fade: 1,
					leveldb: '-inf',
				},
			},
			{
				unfriendly: {
					input: 'lr',
					assign: 2,
					fade: 0,
					leveldb: 5,
				},
				rewritten: {
					source: 'LR',
					sink: 3,
					fade: 0,
					leveldb: 5,
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
					tryMakeLevelSourceSinkOptionsUserFriendly(action),
					'tryMakeLevelSourceSinkOptionsUserFriendly returns true applied to user-unfriendly level action',
				).toBe(true)
				expect(action.options).toEqual(rewrittenOptions)

				expect(
					tryMakeLevelSourceSinkOptionsUserFriendly(action),
					'tryMakeLevelSourceSinkOptionsUserFriendly returns false applied a second time to user-unfriendly level action',
				).toBe(false)
				expect(action.options).toEqual(rewrittenOptions)
			},
		)
	})
})
