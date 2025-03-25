import type { CompanionActionInfo } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import {
	ObsoleteLevelToOutputId,
	ObsoletePanToOutputId,
	OutputActionId,
	tryConvertOldLevelToOutputActionToSinkSpecific,
	tryConvertOldPanToOutputActionToSinkSpecific,
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

		expect(lrNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect('input' in lrNeedsUpgrade.options).toBe(true)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(lrNeedsUpgrade)).toBe(true)

		expect(lrNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(lrNeedsUpgrade.actionId).toBe(OutputActionId.LRLevelOutput)
		expect('input' in lrNeedsUpgrade.options).toBe(false)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(lrNeedsUpgrade)).toBe(false)
	})

	test('mix 1', () => {
		const mixNeedsUpgrade = makeObsoleteOutputLevelAction(1, '-inf', 0)

		expect(mixNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(mixNeedsUpgrade.options.input).toBe(1)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(true)

		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixLevelOutput)
		expect(mixNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(false)
	})
	test('mix 12', () => {
		const mixNeedsUpgrade = makeObsoleteOutputLevelAction(12, '-inf', 0)

		expect(mixNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(mixNeedsUpgrade.options.input).toBe(12)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(true)

		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixLevelOutput)
		expect(mixNeedsUpgrade.options.input).toBe(11)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(false)
	})

	test('FX send 1', () => {
		const fxSendNeedsUpgrade = makeObsoleteOutputLevelAction(13, '-inf', 0)

		expect(fxSendNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(fxSendNeedsUpgrade.options.input).toBe(13)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(fxSendNeedsUpgrade)).toBe(true)

		expect(fxSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(fxSendNeedsUpgrade.actionId).toBe(OutputActionId.FXSendLevelOutput)
		expect(fxSendNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(fxSendNeedsUpgrade)).toBe(false)
	})
	test('FX send 4', () => {
		const fxSendNeedsUpgrade = makeObsoleteOutputLevelAction(16, '-inf', 0)

		expect(fxSendNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(fxSendNeedsUpgrade.options.input).toBe(16)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(fxSendNeedsUpgrade)).toBe(true)

		expect(fxSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(fxSendNeedsUpgrade.actionId).toBe(OutputActionId.FXSendLevelOutput)
		expect(fxSendNeedsUpgrade.options.input).toBe(3)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(fxSendNeedsUpgrade)).toBe(false)
	})

	test('matrix 1', () => {
		const matrixSendNeedsUpgrade = makeObsoleteOutputLevelAction(17, '-inf', 0)

		expect(matrixSendNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(matrixSendNeedsUpgrade.options.input).toBe(17)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(matrixSendNeedsUpgrade)).toBe(true)

		expect(matrixSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(matrixSendNeedsUpgrade.actionId).toBe(OutputActionId.MatrixLevelOutput)
		expect(matrixSendNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(matrixSendNeedsUpgrade)).toBe(false)
	})
	test('matrix 3', () => {
		const matrixSendNeedsUpgrade = makeObsoleteOutputLevelAction(19, '-inf', 0)

		expect(matrixSendNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(matrixSendNeedsUpgrade.options.input).toBe(19)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(matrixSendNeedsUpgrade)).toBe(true)

		expect(matrixSendNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(matrixSendNeedsUpgrade.actionId).toBe(OutputActionId.MatrixLevelOutput)
		expect(matrixSendNeedsUpgrade.options.input).toBe(2)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(matrixSendNeedsUpgrade)).toBe(false)
	})

	test('nether region between matrix 3 and DCA 1, 20', () => {
		const badObsoleteOutputLevelAction = makeObsoleteOutputLevelAction(20, '-inf', 0)

		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(20)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(badObsoleteOutputLevelAction)).toBe(false)

		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(20)
	})
	test('nether region between matrix 3 and DCA 1, 31', () => {
		const badObsoleteOutputLevelAction = makeObsoleteOutputLevelAction(31, '-inf', 0)

		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(31)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(badObsoleteOutputLevelAction)).toBe(false)

		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(31)
	})

	test('DCA 1', () => {
		const dcaNeedsUpgrade = makeObsoleteOutputLevelAction(32, '-inf', 0)

		expect(dcaNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(dcaNeedsUpgrade.options.input).toBe(32)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(dcaNeedsUpgrade)).toBe(true)

		expect(dcaNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(dcaNeedsUpgrade.actionId).toBe(OutputActionId.DCALevelOutput)
		expect(dcaNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(dcaNeedsUpgrade)).toBe(false)
	})
	test('DCA 8', () => {
		const dcaNeedsUpgrade = makeObsoleteOutputLevelAction(39, '-inf', 0)

		expect(dcaNeedsUpgrade.actionId).toBe(ObsoleteLevelToOutputId)
		expect(dcaNeedsUpgrade.options.input).toBe(39)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(dcaNeedsUpgrade)).toBe(true)

		expect(dcaNeedsUpgrade.actionId).not.toBe(ObsoleteLevelToOutputId)
		expect(dcaNeedsUpgrade.actionId).toBe(OutputActionId.DCALevelOutput)
		expect(dcaNeedsUpgrade.options.input).toBe(7)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(dcaNeedsUpgrade)).toBe(false)
	})

	test('invalid after DCA 8', () => {
		const badObsoleteOutputLevelAction = makeObsoleteOutputLevelAction(40, '-inf', 0)

		expect(badObsoleteOutputLevelAction.actionId).toBe(ObsoleteLevelToOutputId)
		expect(badObsoleteOutputLevelAction.options.input).toBe(40)

		expect(tryConvertOldLevelToOutputActionToSinkSpecific(badObsoleteOutputLevelAction)).toBe(false)

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

		expect(lrNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(lrNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(lrNeedsUpgrade)).toBe(true)

		expect(lrNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(lrNeedsUpgrade.actionId).toBe(OutputActionId.LRPanBalanceOutput)
		expect('input' in lrNeedsUpgrade.options).toBe(false)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(lrNeedsUpgrade)).toBe(false)
	})

	test('mix 1', () => {
		const mixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(1, 'CTR')

		expect(mixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.options.input).toBe(1)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(true)

		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixPanBalanceOutput)
		expect(mixNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(false)
	})
	test('mix 12', () => {
		const mixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(12, 'CTR')

		expect(mixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.options.input).toBe(12)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(mixNeedsUpgrade)).toBe(true)

		expect(mixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(mixNeedsUpgrade.actionId).toBe(OutputActionId.MixPanBalanceOutput)
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
		expect(matrixNeedsUpgrade.actionId).toBe(OutputActionId.MatrixPanBalanceOutput)
		expect(matrixNeedsUpgrade.options.input).toBe(0)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)).toBe(false)
	})
	test('matrix 3', () => {
		const matrixNeedsUpgrade = makeObsoleteOutputPanBalanceAction(19, 'CTR')

		expect(matrixNeedsUpgrade.actionId).toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.options.input).toBe(19)

		expect(tryConvertOldPanToOutputActionToSinkSpecific(matrixNeedsUpgrade)).toBe(true)

		expect(matrixNeedsUpgrade.actionId).not.toBe(ObsoletePanToOutputId)
		expect(matrixNeedsUpgrade.actionId).toBe(OutputActionId.MatrixPanBalanceOutput)
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
