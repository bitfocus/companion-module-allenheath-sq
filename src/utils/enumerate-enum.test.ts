import { describe, expect, test } from 'vitest'
import { enumValues } from './enumerate-enum.js'

describe('enumValues', () => {
	enum Foo {
		X = 'x-value',
		Y = 'y-value',
	}

	test('upon enum Foo', () => {
		const vals = enumValues(Foo)
		expect(vals).toEqual(['x-value', 'y-value'])
	})
})
