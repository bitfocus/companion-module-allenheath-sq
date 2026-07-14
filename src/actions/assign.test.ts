import type { CompanionMigrationAction, CompanionOptionValues } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import {
	AssignActionId,
	type AssignStatus,
	tryMakeAssignOptionsUserFriendly,
	tryUpgradeAssignMixOrLREncoding,
} from './assign.js'

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

function makeUserUnfriendlyAssignAction(
	actionId: AssignActionId,
	options: CompanionOptionValues,
): CompanionMigrationAction {
	return {
		id: 'zyxwVUTS',
		controlId: '3/1/4',
		actionId,
		options,
	}
}

const AssignActionToObsoleteOptionNames = {
	[AssignActionId.FXReturnToFXSend]: {
		source: 'inputFxr',
		sinks: 'fxsAssign',
		active: 'fxsActive',
	},
	[AssignActionId.FXReturnToGroup]: {
		source: 'inputFxr',
		sinks: 'grpAssign',
		active: 'grpActive',
	},
	[AssignActionId.FXReturnToMix]: {
		source: 'inputFxr',
		sinks: 'mixAssign',
		active: 'mixActive',
	},
	[AssignActionId.GroupToFXSend]: {
		source: 'inputGrp',
		sinks: 'fxsAssign',
		active: 'fxsActive',
	},
	[AssignActionId.GroupToMatrix]: {
		source: 'inputGrp',
		sinks: 'mtxAssign',
		active: 'mtxActive',
	},
	[AssignActionId.GroupToMix]: {
		source: 'inputGrp',
		sinks: 'mixAssign',
		active: 'mixActive',
	},
	[AssignActionId.InputChannelToFXSend]: {
		source: 'inputChannel',
		sinks: 'fxsAssign',
		active: 'fxsActive',
	},
	[AssignActionId.InputChannelToGroup]: {
		source: 'inputChannel',
		sinks: 'grpAssign',
		active: 'grpActive',
	},
	[AssignActionId.InputChannelToMix]: {
		source: 'inputChannel',
		sinks: 'mixAssign',
		active: 'mixActive',
	},
	[AssignActionId.MixToMatrix]: {
		source: 'inputMix',
		sinks: 'mtxAssign',
		active: 'mtxActive',
	},
} as const satisfies Record<AssignActionId, { source: string; sinks: string; active: string }>

describe('upgrading assign options to be more user-friendly', () => {
	test('not an assign action at all', () => {
		const options = (() => {
			const immutableOptions = {
				// Include the full list of option ids evaluated, added, moved,
				// or removed by the upgrade script.
				inputChannel: 1,
				inputFxr: 0,
				inputGrp: 2,
				inputMix: 3,
				grpAssign: [2, 1, 4],
				fxsAssign: [1],
				mtxAssign: [1, 2, 0],
				mixAssign: ['lr', 2, 4],
				grpActive: false,
				fxsActive: true,
				mtxActive: true,
				mixActive: false,
				source: 3,
				sinks: [8, 6, 7, 5, 3, 0, 9],
				active: true,
				status: false,
			} as const satisfies CompanionOptionValues

			return () => structuredClone(immutableOptions)
		})()

		expect(options().grpAssign, 'sanity check of options()').toEqual([2, 1, 4])

		const action = makeUserUnfriendlyAssignAction('foobar' as AssignActionId, options())

		expect(tryMakeAssignOptionsUserFriendly(action)).toBe(false)
		expect(action.options).toEqual(options())

		expect(tryMakeAssignOptionsUserFriendly(action)).toBe(false)
		expect(action.options).toEqual(options())
	})

	test.each([
		[AssignActionId.FXReturnToFXSend, 2, [0, 2], false, 3, [1, 3], 'inactive'],
		[AssignActionId.FXReturnToFXSend, 0, [], true, 1, [], 'active'],
		[AssignActionId.FXReturnToGroup, 1, [0, 1, 2], true, 2, [1, 2, 3], 'active'],
		[AssignActionId.FXReturnToMix, 0, ['lr', 1, 2, 4], true, 1, ['LR', 2, 3, 5], 'active'],
		[AssignActionId.FXReturnToMix, 0, [3, 2, 'lr', 4], true, 1, [4, 3, 'LR', 5], 'active'],
		[AssignActionId.GroupToFXSend, 2, [0, 2], false, 3, [1, 3], 'inactive'],
		[AssignActionId.GroupToFXSend, 1, [1], false, 2, [2], 'inactive'],
		[AssignActionId.GroupToMatrix, 2, [2, 0], true, 3, [3, 1], 'active'],
		[AssignActionId.GroupToMix, 3, ['lr'], false, 4, ['LR'], 'inactive'],
		[AssignActionId.InputChannelToFXSend, 16, [2, 0, 1], false, 17, [3, 1, 2], 'inactive'],
		[AssignActionId.InputChannelToGroup, 4, [0, 3], false, 5, [1, 4], 'inactive'],
		[AssignActionId.InputChannelToMix, 33, ['lr', 5, 18], true, 34, ['LR', 6, 19], 'active'],
		[AssignActionId.MixToMatrix, 'lr', [0], false, 'LR', [1], 'inactive'],
		[AssignActionId.MixToMatrix, 6, [0, 2], false, 7, [1, 3], 'inactive'],
	] satisfies [
		AssignActionId,
		number | 'lr',
		(number | 'lr')[],
		boolean,
		number | 'LR',
		(number | 'LR')[],
		AssignStatus,
	][])(
		'$0 input=$1 assigns=$2 active=$3 => source=$4 sinks=$5',
		(actionId, input, assigns, status, expectedSource, expectedSinks, expectedStatus) => {
			const {
				source: obsoleteSource,
				sinks: obsoleteSinks,
				active: obsoleteActive,
			} = AssignActionToObsoleteOptionNames[actionId]

			const action = makeUserUnfriendlyAssignAction(actionId, {
				[obsoleteSource]: input,
				[obsoleteSinks]: assigns,
				[obsoleteActive]: status,
			})

			expect(
				tryMakeAssignOptionsUserFriendly(action),
				'tryMakeAssignOptionsUserFriendly returns true applied to user-unfriendly assign action',
			).toBe(true)
			expect(action.options).toEqual({
				source: expectedSource,
				sinks: expectedSinks,
				status: expectedStatus,
			})

			expect(
				tryMakeAssignOptionsUserFriendly(action),
				'tryMakeAssignOptionsUserFriendly returns false applied a second time to user-unfriendly assign action',
			).toBe(false)
			expect(action.options).toEqual({
				source: expectedSource,
				sinks: expectedSinks,
				status: expectedStatus,
			})
		},
	)
})
