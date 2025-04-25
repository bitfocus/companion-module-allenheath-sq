import type { Expect, Equal, Extends, ExpectFalse } from 'type-testing'
import { describe, expect, test } from 'vitest'
import { Model } from '../model.js'
import { type Param, splitNRPN } from './nrpn.js'
import { forEachSourceSinkLevel, type SourceSinkForNRPN, type SinkForMixAndLRInSinkForNRPN } from './source-to-sink.js'

type test_MixesIntoSinkSet = Expect<Equal<SinkForMixAndLRInSinkForNRPN<'level'>, 'matrix'>>

type test_CantSetFXRLevelInGroup = ExpectFalse<Extends<['fxReturn', 'group'], SourceSinkForNRPN<'level'>>>

type test_CantSetInputLevelInGroup = ExpectFalse<Extends<['inputChannel', 'group'], SourceSinkForNRPN<'level'>>>

describe('forEachSourceToSinkLevel', () => {
	const model = new Model('SQ5')

	const results: [Param<'level'>, string, string][] = []
	forEachSourceSinkLevel(model, (nrpn, sourceDesc, sinkDesc) => {
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
