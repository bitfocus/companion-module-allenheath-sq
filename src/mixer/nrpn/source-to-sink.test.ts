import { describe, expect, test } from 'vitest'
import { Model } from '../model.js'
import { type Param, splitNRPN } from './param.js'
import { forEachSourceSinkLevel } from './source-to-sink.js'

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
