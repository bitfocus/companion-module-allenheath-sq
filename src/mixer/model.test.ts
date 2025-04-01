import { describe, expect, test } from 'vitest'
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

	// Test lr specially because it uses the old 99 number encoding...for now.
	test('lr', () => {
		const results: [number, string, string][] = []

		model.forEach('lr', (n, label, desc) => {
			results.push([n, label, desc])
		})

		expect(results).toEqual([[99, 'LR', 'LR']])
	})
})
