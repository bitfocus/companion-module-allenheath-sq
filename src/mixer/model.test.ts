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
	// but 99 (which used to be the value of `LR`).
	test('lr', () => {
		// Although `LR` is a constant string now, this shouldn't affect the
		// enumeration of LR signals.
		expect(LR).toBe('lr')

		const results: [number, string, string][] = []

		model.forEach('lr', (n, label, desc) => {
			results.push([n, label, desc])
		})

		expect(results).toEqual([[0, 'LR', 'LR']])
	})
})
