import type { CompanionActionInfo } from '@companion-module/base'
import { describe, expect, test } from '@jest/globals'
import {
	convertOldLevelToOutputActionToSinkSpecific,
	convertOldPanToOutputActionToSinkSpecific,
	isOldLevelToOutputAction,
	isOldPanToOutputAction,
	ObsoleteLevelToOutputId,
	ObsoletePanToOutputId,
	OutputActionId,
} from './output.js'
import type { Level } from '../mixer/level.js'
import type { PanBalanceChoice } from './pan-balance.js'

function makeObsoleteOutputLevelAction(input: number, level: Level, fadeSeconds: number): CompanionActionInfo {
	const cai: CompanionActionInfo = {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId: ObsoleteLevelToOutputId,
		options: {
			input,
			leveldb: level,
			fade: fadeSeconds,
		},
	}

	return cai
}

describe('obsolete output action convert to sink-specific output level action', () => {
	test('lr', () => {
		const lrNeedsUpgrade = makeObsoleteOutputLevelAction(0, '-inf', 0)

		expect(isOldLevelToOutputAction(lrNeedsUpgrade)).toBe(true)
		expect('input' in lrNeedsUpgrade.options).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(lrNeedsUpgrade)

		expect(isOldLevelToOutputAction(lrNeedsUpgrade)).toBe(false)
		expect(lrNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(lrNeedsUpgrade.actionId).toBe(OutputActionId.LRLevelOutput)
		expect('input' in lrNeedsUpgrade.options).toBe(false)
	})

	test('mix 1', () => {
		const mixNeedsUpgrade = makeObsoleteOutputLevelAction(1, '-inf', 0)

		expect(isOldLevelToOutputAction(mixNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(mixNeedsUpgrade)

		expect(isOldLevelToOutputAction(mixNeedsUpgrade)).toBe(false)
		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixLevelOutput)
		expect(mixNeedsUpgrade.options.input).toBe(0)
	})

	test('mix 12', () => {
		const mixNeedsUpgrade = makeObsoleteOutputLevelAction(12, '-inf', 0)

		expect(isOldLevelToOutputAction(mixNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(mixNeedsUpgrade)

		expect(isOldLevelToOutputAction(mixNeedsUpgrade)).toBe(false)
		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixLevelOutput)
		expect(mixNeedsUpgrade.options.input).toBe(11)
	})

	test('FX send 1', () => {
		const fxSendNeedsUpgrade = makeObsoleteOutputLevelAction(13, '-inf', 0)

		expect(isOldLevelToOutputAction(fxSendNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(fxSendNeedsUpgrade)

		expect(isOldLevelToOutputAction(fxSendNeedsUpgrade)).toBe(false)
		expect(fxSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(fxSendNeedsUpgrade.actionId).toBe(OutputActionId.FXSendLevelOutput)
		expect(fxSendNeedsUpgrade.options.input).toBe(0)
	})

	test('FX send 4', () => {
		const fxSendNeedsUpgrade = makeObsoleteOutputLevelAction(16, '-inf', 0)

		expect(isOldLevelToOutputAction(fxSendNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(fxSendNeedsUpgrade)

		expect(isOldLevelToOutputAction(fxSendNeedsUpgrade)).toBe(false)
		expect(fxSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(fxSendNeedsUpgrade.actionId).toBe(OutputActionId.FXSendLevelOutput)
		expect(fxSendNeedsUpgrade.options.input).toBe(3)
	})

	test('matrix 1', () => {
		const matrixSendNeedsUpgrade = makeObsoleteOutputLevelAction(17, '-inf', 0)

		expect(isOldLevelToOutputAction(matrixSendNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(matrixSendNeedsUpgrade)

		expect(isOldLevelToOutputAction(matrixSendNeedsUpgrade)).toBe(false)
		expect(matrixSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(matrixSendNeedsUpgrade.actionId).toBe(OutputActionId.MatrixLevelOutput)
		expect(matrixSendNeedsUpgrade.options.input).toBe(0)
	})

	test('matrix 3', () => {
		const matrixSendNeedsUpgrade = makeObsoleteOutputLevelAction(19, '-inf', 0)

		expect(isOldLevelToOutputAction(matrixSendNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(matrixSendNeedsUpgrade)

		expect(isOldLevelToOutputAction(matrixSendNeedsUpgrade)).toBe(false)
		expect(matrixSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(matrixSendNeedsUpgrade.actionId).toBe(OutputActionId.MatrixLevelOutput)
		expect(matrixSendNeedsUpgrade.options.input).toBe(2)
	})

	test('nether region between matrix 3 and DCA 1, 20', () => {
		const badObsoleteOutputLevelAction = makeObsoleteOutputLevelAction(20, '-inf', 0)

		expect(isOldLevelToOutputAction(badObsoleteOutputLevelAction)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(badObsoleteOutputLevelAction)

		expect(isOldLevelToOutputAction(badObsoleteOutputLevelAction)).toBe(true)
		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(20)
	})
	test('nether region between matrix 3 and DCA 1, 31', () => {
		const badObsoleteOutputLevelAction = makeObsoleteOutputLevelAction(31, '-inf', 0)

		expect(isOldLevelToOutputAction(badObsoleteOutputLevelAction)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(badObsoleteOutputLevelAction)

		expect(isOldLevelToOutputAction(badObsoleteOutputLevelAction)).toBe(true)
		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(31)
	})

	test('DCA 1', () => {
		const dcaNeedsUpgrade = makeObsoleteOutputLevelAction(32, '-inf', 0)

		expect(isOldLevelToOutputAction(dcaNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(dcaNeedsUpgrade)

		expect(isOldLevelToOutputAction(dcaNeedsUpgrade)).toBe(false)
		expect(dcaNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(dcaNeedsUpgrade.actionId).toBe(OutputActionId.DCALevelOutput)
		expect(dcaNeedsUpgrade.options.input).toBe(0)
	})

	test('DCA 8', () => {
		const dcaNeedsUpgrade = makeObsoleteOutputLevelAction(39, '-inf', 0)

		expect(isOldLevelToOutputAction(dcaNeedsUpgrade)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(dcaNeedsUpgrade)

		expect(isOldLevelToOutputAction(dcaNeedsUpgrade)).toBe(false)
		expect(dcaNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(dcaNeedsUpgrade.actionId).toBe(OutputActionId.DCALevelOutput)
		expect(dcaNeedsUpgrade.options.input).toBe(7)
	})

	test('invalid after DCA 8', () => {
		const badObsoleteOutputLevelAction = makeObsoleteOutputLevelAction(40, '-inf', 0)

		expect(isOldLevelToOutputAction(badObsoleteOutputLevelAction)).toBe(true)

		convertOldLevelToOutputActionToSinkSpecific(badObsoleteOutputLevelAction)

		expect(isOldLevelToOutputAction(badObsoleteOutputLevelAction)).toBe(true)
		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(40)
	})
})

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

		expect(isOldPanToOutputAction(lrNeedsUpgrade)).toBe(true)
		expect('input' in lrNeedsUpgrade.options).toBe(true)

		convertOldPanToOutputActionToSinkSpecific(lrNeedsUpgrade)

		expect(isOldPanToOutputAction(lrNeedsUpgrade)).toBe(false)
		expect(lrNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(lrNeedsUpgrade.actionId).toBe(OutputActionId.LRPanBalanceOutput)
		expect('input' in lrNeedsUpgrade.options).toBe(false)
	})

	test('mix 1', () => {
		const mixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(1, 'CTR')

		expect(isOldPanToOutputAction(mixNeedsUpgrade)).toBe(true)
		expect(mixNeedsUpgrade.options.input).toBe(1)

		convertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)

		expect(isOldPanToOutputAction(mixNeedsUpgrade)).toBe(false)
		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixPanBalanceOutput)
		expect(mixNeedsUpgrade.options.input).toBe(0)
	})

	test('mix 12', () => {
		const mixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(12, 'CTR')

		expect(isOldPanToOutputAction(mixNeedsUpgrade)).toBe(true)
		expect(mixNeedsUpgrade.options.input).toBe(12)

		convertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)

		expect(isOldPanToOutputAction(mixNeedsUpgrade)).toBe(false)
		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixPanBalanceOutput)
		expect(mixNeedsUpgrade.options.input).toBe(11)
	})

	test('invalid past mix 12', () => {
		const badObsoleteOutputPanBalanceAction = makeObsoleteOutputPanBalanceAction(13, 'CTR')

		expect(isOldPanToOutputAction(badObsoleteOutputPanBalanceAction)).toBe(true)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(13)

		convertOldPanToOutputActionToSinkSpecific(badObsoleteOutputPanBalanceAction)

		expect(isOldPanToOutputAction(badObsoleteOutputPanBalanceAction)).toBe(true)
		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(13)
	})

	test('invalid before matrix 1', () => {
		const badObsoleteOutputPanBalanceAction = makeObsoleteOutputPanBalanceAction(16, 'CTR')

		expect(isOldPanToOutputAction(badObsoleteOutputPanBalanceAction)).toBe(true)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(16)

		convertOldPanToOutputActionToSinkSpecific(badObsoleteOutputPanBalanceAction)

		expect(isOldPanToOutputAction(badObsoleteOutputPanBalanceAction)).toBe(true)
		expect(badObsoleteOutputPanBalanceAction.actionId).toBe(ObsoletePanToOutputId)
		expect(badObsoleteOutputPanBalanceAction.options.input).toBe(16)
	})

	test('matrix 1', () => {
		const matrixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(17, 'CTR')

		expect(isOldPanToOutputAction(matrixNeedsUpgrade)).toBe(true)
		expect(matrixNeedsUpgrade.options.input).toBe(17)

		convertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)

		expect(isOldPanToOutputAction(matrixNeedsUpgrade)).toBe(false)
		expect(matrixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.actionId).toBe(OutputActionId.MatrixPanBalanceOutput)
		expect(matrixNeedsUpgrade.options.input).toBe(0)
	})

	test('matrix 3', () => {
		const matrixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(19, 'CTR')

		expect(isOldPanToOutputAction(matrixNeedsUpgrade)).toBe(true)
		expect(matrixNeedsUpgrade.options.input).toBe(19)

		convertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)

		expect(isOldPanToOutputAction(matrixNeedsUpgrade)).toBe(false)
		expect(matrixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.actionId).toBe(OutputActionId.MatrixPanBalanceOutput)
		expect(matrixNeedsUpgrade.options.input).toBe(2)
	})

	test('invalid past matrix 3', () => {
		const matrixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(20, 'CTR')

		expect(isOldPanToOutputAction(matrixNeedsUpgrade)).toBe(true)
		expect(matrixNeedsUpgrade.options.input).toBe(20)

		convertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)

		expect(isOldPanToOutputAction(matrixNeedsUpgrade)).toBe(true)
		expect(matrixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.options.input).toBe(20)
	})
})
