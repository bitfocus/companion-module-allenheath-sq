import type { CompanionMigrationAction } from '@companion-module/base'
import { describe, expect, test } from 'vitest'
import { MuteOperation } from '../mixer/mixer.js'
import {
	AllMuteStripActions,
	MuteActionId,
	ObsoleteMuteStatus,
	tryMakeMuteItemOneIndexed,
	tryTrimMuteLROptions,
} from './mute.js'

function makeObsoleteMuteAction(actionId: MuteActionId, strip: number, mute: ObsoleteMuteStatus) {
	return {
		id: 'abcOdOefghiOFjBkGHlJm',
		controlId: '1/0/0',
		actionId,
		options: {
			strip,
			mute,
		},
	} satisfies CompanionMigrationAction
}

function makeActionWithActionId(actionId: CompanionMigrationAction['actionId']): CompanionMigrationAction {
	return {
		id: 'foobar',
		controlId: '3/1/4',
		actionId,
		options: {
			// Supply all options, old and new, ensuring only the actionId is examined
			strip: 2,
			n: 1,
			status: 0,
			mute: 'on',
		},
	}
}

describe('tryMakeMuteItemOneIndexed', () => {
	test.each(['USA', 'AUS', 'PAR', 'TUR', MuteActionId.MuteLR])(
		'inapplicable to non-mute-with-strip=$0',
		(actionId: CompanionMigrationAction['actionId']) => {
			const action = makeActionWithActionId(actionId)

			expect(tryMakeMuteItemOneIndexed(action)).toBe(false)
			expect(tryMakeMuteItemOneIndexed(action)).toBe(false)
		},
	)

	test.each([
		{
			actionId: MuteActionId.MuteInputChannel,
			strip: 0,
			obsoleteStatus: 0,
			rewrittenStatus: MuteOperation.Toggle,
		},
		{
			actionId: MuteActionId.MuteInputChannel,
			strip: 47,
			obsoleteStatus: 2,
			rewrittenStatus: MuteOperation.Off,
		},
		{
			actionId: MuteActionId.MuteMix,
			strip: 3,
			obsoleteStatus: ObsoleteMuteStatus.On,
			rewrittenStatus: MuteOperation.On,
		},
		{
			actionId: MuteActionId.MuteDCA,
			strip: 2,
			obsoleteStatus: ObsoleteMuteStatus.Toggle,
			rewrittenStatus: 'toggle',
		},
		{
			actionId: MuteActionId.MuteFXSend,
			strip: 3,
			obsoleteStatus: 2,
			rewrittenStatus: MuteOperation.Off,
		},
		{
			actionId: MuteActionId.MuteFXReturn,
			strip: 1,
			obsoleteStatus: ObsoleteMuteStatus.On,
			rewrittenStatus: MuteOperation.On,
		},
		{
			actionId: MuteActionId.MuteGroup,
			strip: 3,
			obsoleteStatus: ObsoleteMuteStatus.Toggle,
			rewrittenStatus: MuteOperation.Toggle,
		},
		{
			actionId: MuteActionId.MuteMatrix,
			strip: 0,
			obsoleteStatus: ObsoleteMuteStatus.Off,
			rewrittenStatus: 'off',
		},
		{
			actionId: MuteActionId.MuteMuteGroup,
			strip: 1,
			obsoleteStatus: 1,
			rewrittenStatus: MuteOperation.On,
		},
	] as const)(
		'$actionId=$strip, $obsoleteStatus => $rewrittenStatus',
		({
			actionId,
			strip,
			obsoleteStatus,
			rewrittenStatus,
		}: {
			actionId: MuteActionId
			strip: number
			obsoleteStatus: ObsoleteMuteStatus
			rewrittenStatus: MuteOperation
		}) => {
			const action = makeObsoleteMuteAction(actionId, strip, obsoleteStatus)

			expect(tryMakeMuteItemOneIndexed(action)).toBe(true)
			expect(action.actionId).toBe(actionId)
			expect(action.options).toEqual({
				n: strip + 1,
				status: rewrittenStatus,
			})
			expect(action.options).not.toHaveProperty(['strip', 'mute'])

			expect(tryMakeMuteItemOneIndexed(action)).toBe(false)
			expect(action.actionId).toBe(actionId)
			expect(action.options).toEqual({
				n: strip + 1,
				status: rewrittenStatus,
			})
			expect(action.options).not.toHaveProperty(['strip', 'mute'])
		},
	)
})

describe('tryTrimMuteLROptions', () => {
	test.each(['AUS', 'PAR', 'TUR', 'USA', ...AllMuteStripActions])(
		'inapplicable to non-mute_lr action $0',
		(actionId: CompanionMigrationAction['actionId']) => {
			const action = makeActionWithActionId(actionId)

			expect(tryTrimMuteLROptions(action)).toBe(false)
			expect(tryTrimMuteLROptions(action)).toBe(false)
		},
	)

	test.each([
		{
			strip: 0,
			obsoleteStatus: ObsoleteMuteStatus.Toggle,
			rewrittenStatus: MuteOperation.Toggle,
		},
		{
			strip: 0,
			obsoleteStatus: ObsoleteMuteStatus.Off,
			rewrittenStatus: MuteOperation.Off,
		},
		{
			strip: 0,
			obsoleteStatus: ObsoleteMuteStatus.On,
			rewrittenStatus: MuteOperation.On,
		},
		// 99 shouldn't actually appear at this point, but in case it slips through
		{
			strip: 99,
			obsoleteStatus: 0,
			rewrittenStatus: MuteOperation.Toggle,
		},
	] satisfies { strip: number; obsoleteStatus: ObsoleteMuteStatus; rewrittenStatus: MuteOperation }[])(
		'lr=$strip, $obsoleteStatus => $rewrittenStatus',
		({
			strip,
			obsoleteStatus,
			rewrittenStatus,
		}: {
			strip: number
			obsoleteStatus: ObsoleteMuteStatus
			rewrittenStatus: MuteOperation
		}) => {
			const action = makeObsoleteMuteAction(MuteActionId.MuteLR, strip, obsoleteStatus)

			expect(tryTrimMuteLROptions(action)).toBe(true)
			expect(action.actionId).toBe(MuteActionId.MuteLR)
			expect(action.options).toEqual({
				status: rewrittenStatus,
			})
			expect(action.options).not.toHaveProperty(['n', 'strip', 'mute'])

			expect(tryTrimMuteLROptions(action)).toBe(false)
			expect(action.actionId).toBe(MuteActionId.MuteLR)
			expect(action.options).toEqual({
				status: rewrittenStatus,
			})
			expect(action.options).not.toHaveProperty(['n', 'strip', 'mute'])
		},
	)
})
