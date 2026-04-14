import type { Expect, Equal } from 'type-testing'
import { describe, expect, test } from 'vitest'
import { Model } from '../model.js'
import { type Param, splitNRPN } from './nrpn.js'
import { forEachSourceSinkNRPN } from './source-to-sink.js'

// @ts-expect-error Perform a test that *must fail* to verify testing happens.
type assert_VerifyThatExpectAndEqualWillErrorIfMisused = Expect<Equal<true, false>>

describe('forEachSourceSinkNRPN', () => {
	describe('assign', () => {
		const model = new Model('SQ5')

		const results: [Param<'assign'>, string, string][] = []
		forEachSourceSinkNRPN(model, 'assign', (nrpn, sourceDesc, sinkDesc) => {
			results.push([splitNRPN(nrpn), sourceDesc, sinkDesc])
		})

		test('some assigns gotten', () => {
			expect(results.length).greaterThan(0)
		})

		// Randomly chosen, nothing special
		test('FX Return 5 -> Group 7', () => {
			expect(
				results.findIndex(([{ MSB, LSB }, resultSourceDesc, resultSinkDesc]) => {
					return MSB === 0x6b && LSB === 0x6a && resultSourceDesc === 'FX Return 5' && resultSinkDesc === 'Group 7'
				}),
			).greaterThanOrEqual(0)
		})
	})

	describe('level', () => {
		const model = new Model('SQ7')

		const results: [Param<'level'>, string, string][] = []
		forEachSourceSinkNRPN(model, 'level', (nrpn, sourceDesc, sinkDesc) => {
			results.push([splitNRPN(nrpn), sourceDesc, sinkDesc])
		})

		test('some levels gotten', () => {
			expect(results.length).greaterThan(0)
		})

		// Randomly chosen, nothing special
		test('group 3 -> LR', () => {
			expect(
				results.findIndex(([{ MSB, LSB }, resultSourceDesc, resultSinkDesc]) => {
					return MSB === 0x40 && LSB === 0x32 && resultSourceDesc === 'Group 3' && resultSinkDesc === 'LR'
				}),
			).greaterThanOrEqual(0)
		})
	})
})
