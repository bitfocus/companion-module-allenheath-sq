import type { CompanionMigrationAction } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { LevelActionId, tryUpgradeLevelMixOrLREncoding } from './level.js'

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
