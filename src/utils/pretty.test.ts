import { describe, expect, test } from 'vitest'
import { manyPrettyBytes, prettyByte, prettyBytes } from './pretty.js'

describe('prettyByte', () => {
	test('prettyByte(0)', () => {
		expect(prettyByte(0)).toBe('00')
	})
	test('prettyByte(255)', () => {
		expect(prettyByte(255)).toBe('FF')
	})
	test('prettyByte(64)', () => {
		expect(prettyByte(64)).toBe('40')
	})
})

describe('prettyBytes', () => {
	test('prettyBytes([0x80, 0x00])', () => {
		expect(prettyBytes([0x80, 0x00])).toBe('80 00')
	})
})

describe('manyPrettyBytes', () => {
	test('manyPrettyBytes([0xff], [0x12, 0x9d], [0x35])', () => {
		expect(manyPrettyBytes([0xff], [0x12, 0x9d], [0x35])).toBe('FF 12 9D 35')
	})
})
