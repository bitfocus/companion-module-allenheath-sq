import type { CompanionActionInfo } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import {
	ObsoletePanToOutputId,
	OutputPanBalanceActionId,
	tryConvertOldPanToOutputActionToSinkSpecific,
	tryMakeOutputPanBalanceItemOneIndexed,
} from './pan-balance.js'
import type { PanBalanceChoice } from '../pan-balance.js'

function makeObsoleteOutputPanBalanceAction(input: number, panBalance: PanBalanceChoice): CompanionActionInfo {
	const cai: CompanionActionInfo = {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId: ObsoletePanToOutputId,
		options: {
			input,
			leveldb: panBalance,
		},
	}

	return cai
}

describe('obsolete output action convert to sink-specific output pan/balance action', () => {
	test('lr', () => {
		const lrNeedsUpgrade = makeObsoleteOutputPanBalanceAction(0, 'CTR')

		expect(lrNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(lrNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(lrNeedsUpgrade)).toBe(true)

		expect(lrNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(lrNeedsUpgrade.actionId).toBe(OutputPanBalanceActionId.LRPanBalanceOutput)
		expect('input' in lrNeedsUpgrade.options).toBe(false)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(lrNeedsUpgrade)).toBe(false)
	})

	test('mix 1', () => {
		const mixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(1, 'CTR')

		expect(mixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.options.input).toBe(1)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(true)

		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputPanBalanceActionId.MixPanBalanceOutput)
		expect(mixNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(false)
	})
	test('mix 12', () => {
		const mixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(12, 'CTR')

		expect(mixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.options.input).toBe(12)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(true)

		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputPanBalanceActionId.MixPanBalanceOutput)
		expect(mixNeedsUpgrade.options.input).toBe(11)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(false)
	})

	test('invalid past mix 12', () => {
		const badObsoleteOutputPanBalanceAction = makeObsoleteOutputPanBalanceAction(13, 'CTR')

		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(13)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(badObsoleteOutputPanBalanceAction)).toBe(false)

		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(13)
	})
	test('invalid before matrix 1', () => {
		const badObsoleteOutputPanBalanceAction = makeObsoleteOutputPanBalanceAction(16, 'CTR')

		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(16)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(badObsoleteOutputPanBalanceAction)).toBe(false)

		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(16)
	})

	test('matrix 1', () => {
		const matrixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(17, 'CTR')

		expect(matrixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.options.input).toBe(17)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)).toBe(true)

		expect(matrixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.actionId).toBe(OutputPanBalanceActionId.MatrixPanBalanceOutput)
		expect(matrixNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)).toBe(false)
	})
	test('matrix 3', () => {
		const matrixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(19, 'CTR')

		expect(matrixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.options.input).toBe(19)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)).toBe(true)

		expect(matrixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.actionId).toBe(OutputPanBalanceActionId.MatrixPanBalanceOutput)
		expect(matrixNeedsUpgrade.options.input).toBe(2)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)).toBe(false)
	})

	test('invalid past matrix 3', () => {
		const badObsoleteOutputPanBalanceAction = makeObsoleteOutputPanBalanceAction(20, 'CTR')

		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(20)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(badObsoleteOutputPanBalanceAction)).toBe(false)

		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(20)
	})
})

function makeZeroIndexedOutputPanBalanceAction(
	actionId: OutputPanBalanceActionId,
	input: number,
	panBalance: PanBalanceChoice,
): CompanionActionInfo {
	const cai: CompanionActionInfo = {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId,
		options: {
			...(actionId === OutputPanBalanceActionId.LRPanBalanceOutput ? {} : { input }),
			leveldb: panBalance,
		},
	}

	return cai
}

describe('output pan/balance zero-indexed input upgraded to one-indexed', () => {
	test('LR output pan/balance should not be upgradable', () => {
		const action = makeZeroIndexedOutputPanBalanceAction(OutputPanBalanceActionId.LRPanBalanceOutput, 42, 'L100')

		expect(tryMakeOutputPanBalanceItemOneIndexed(action)).toBe(false)
		expect(action.actionId).toBe(OutputPanBalanceActionId.LRPanBalanceOutput)
		expect(action.options).toEqual({
			leveldb: 'L100',
		})

		expect(tryMakeOutputPanBalanceItemOneIndexed(action)).toBe(false)
		expect(action.actionId).toBe(OutputPanBalanceActionId.LRPanBalanceOutput)
		expect(action.options).toEqual({
			leveldb: 'L100',
		})
	})

	test.each([
		[OutputPanBalanceActionId.MixPanBalanceOutput, 7, 998],
		[OutputPanBalanceActionId.MatrixPanBalanceOutput, 1, 'CTR'],
	] satisfies [OutputPanBalanceActionId, number, PanBalanceChoice][])(
		'$0 input=$1 panBalance=$2',
		(actionId, input, panBalance) => {
			const action = makeZeroIndexedOutputPanBalanceAction(actionId, input, panBalance)

			expect(tryMakeOutputPanBalanceItemOneIndexed(action)).toBe(true)
			expect(action.actionId).toBe(actionId)
			expect(action.options).toEqual({
				n: input + 1,
				leveldb: panBalance,
			})

			expect(tryMakeOutputPanBalanceItemOneIndexed(action)).toBe(false)
			expect(action.actionId).toBe(actionId)
			expect(action.options).toEqual({
				n: input + 1,
				leveldb: panBalance,
			})
		},
	)
})
