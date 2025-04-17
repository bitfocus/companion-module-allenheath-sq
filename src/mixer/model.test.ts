import { describe, expect, test } from 'vitest'
import { LR } from './lr.js'
import { Model } from './model.js'

describe('Model.forEach', () => {
	const model = new Model('SQ5')

	// Use matrix because there are few enough to readably list them all out.
	test('matrix', () => {
		const results: [number, string, string][] = []

		model.forEach('matrix', (n, label, desc) => {
			results.push([n, label, desc])
		})

		expect(results).toEqual([
			[0, 'MATRIX 1', 'Matrix 1'],
			[1, 'MATRIX 2', 'Matrix 2'],
			[2, 'MATRIX 3', 'Matrix 3'],
		])
	})

	// Test lr specially because it used to return not 0 for its one element,
	// but `LR`, i.e. 99.
	test('lr', () => {
		// LR is presently 99.  Detect if/when it is changed to something like
		// 'lr' (to allow mix-or-LR to clearly separate LR from mix at the type
		// level, rather than conflate them both into `number`) so that the
		// comment above can be adjusted.
		expect(LR).toBe(99)

		const results: [number, string, string][] = []

		model.forEach('lr', (n, label, desc) => {
			results.push([n, label, desc])
		})

		expect(results).toEqual([[0, 'LR', 'LR']])
	})
})
