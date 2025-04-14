import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { AssignActionId, tryUpgradeAssignMixOrLREncoding } from './assign.js'

function makeObsoleteAssignAction(actionId: AssignActionId, options: CompanionOptionValues): CompanionMigrationAction {
	return {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId,
		options,
	} satisfies CompanionMigrationAction
}

describe("upgrade mix=99 to mix='lr' in assign actions", () => {
	test('unaffected', () => {
		const action = makeObsoleteAssignAction(AssignActionId.InputChannelToFXSend, {
			inputChannel: 2,
			fxsAssign: 1,
			fxsActive: true,
		})

		expect(tryUpgradeAssignMixOrLREncoding(action)).toBe(false)
		expect(action.options).toEqual({
			inputChannel: 2,
			fxsAssign: 1,
			fxsActive: true,
		})
	})

	describe('mix/lr to matrix', () => {
		test('not lr source', () => {
			const notLRSource = makeObsoleteAssignAction(AssignActionId.MixToMatrix, {
				inputMix: 3,
				mtxAssign: [2],
				mtxActive: false,
			})

			expect(tryUpgradeAssignMixOrLREncoding(notLRSource)).toBe(false)
			expect(notLRSource.options).toEqual({
				inputMix: 3,
				mtxAssign: [2],
				mtxActive: false,
			})
		})

		test('lr source', () => {
			const lrSource = makeObsoleteAssignAction(AssignActionId.MixToMatrix, {
				inputMix: 99,
				mtxAssign: [2, 3],
				mtxActive: true,
			})

			expect(tryUpgradeAssignMixOrLREncoding(lrSource)).toBe(true)
			expect(lrSource.options).toEqual({
				inputMix: 'lr',
				mtxAssign: [2, 3],
				mtxActive: true,
			})
		})
	})

	describe('inputChannel to mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoleteAssignAction(AssignActionId.InputChannelToMix, {
				inputChannel: 3,
				mixAssign: [2],
				mixActive: false,
			})

			expect(tryUpgradeAssignMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				inputChannel: 3,
				mixAssign: [2],
				mixActive: false,
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoleteAssignAction(AssignActionId.InputChannelToMix, {
				inputChannel: 3,
				mixAssign: [2, 99, 0],
				mixActive: false,
			})

			expect(tryUpgradeAssignMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				inputChannel: 3,
				mixAssign: [2, 'lr', 0],
				mixActive: false,
			})
		})
	})

	describe('group to mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoleteAssignAction(AssignActionId.GroupToMix, {
				inputGrp: 3,
				mixAssign: [2],
				mixActive: false,
			})

			expect(tryUpgradeAssignMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				inputGrp: 3,
				mixAssign: [2],
				mixActive: false,
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoleteAssignAction(AssignActionId.GroupToMix, {
				inputGrp: 3,
				mixAssign: [2, 0, 99],
				mixActive: false,
			})

			expect(tryUpgradeAssignMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				inputGrp: 3,
				mixAssign: [2, 0, 'lr'],
				mixActive: false,
			})
		})
	})

	describe('fxr to mix/lr', () => {
		test('not lr sink', () => {
			const notLRSink = makeObsoleteAssignAction(AssignActionId.FXReturnToMix, {
				inputFxr: 3,
				mixAssign: [2],
				mixActive: false,
			})

			expect(tryUpgradeAssignMixOrLREncoding(notLRSink)).toBe(false)
			expect(notLRSink.options).toEqual({
				inputFxr: 3,
				mixAssign: [2],
				mixActive: false,
			})
		})

		test('lr sink', () => {
			const lrSink = makeObsoleteAssignAction(AssignActionId.FXReturnToMix, {
				inputFxr: 3,
				mixAssign: [99, 0, 3],
				mixActive: true,
			})

			expect(tryUpgradeAssignMixOrLREncoding(lrSink)).toBe(true)
			expect(lrSink.options).toEqual({
				inputFxr: 3,
				mixAssign: ['lr', 0, 3],
				mixActive: true,
			})
		})
	})
})
