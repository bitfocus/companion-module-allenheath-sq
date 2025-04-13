import { describe, expect, test } from 'vitest'
import { calculateNRPN, makeNRPN, prettyNRPN, splitNRPN, toNRPN } from './param.js'

describe('NRPN', () => {
	const ip1ToGrp1 = makeNRPN<'assign'>(0x66, 0x74)

	test('makeNRPN', () => {
		expect(makeNRPN<'level'>(0, 7)).toBe(7)
		expect(makeNRPN<'panBalance'>(1, 0)).toBe(1 << 7)
		expect(ip1ToGrp1).toBe((0x66 << 7) + 0x74)
	})

	const mixOutputBase = makeNRPN<'level'>(0x4f, 0x01)

	test('calculateNRPN', () => {
		expect(calculateNRPN(mixOutputBase, 4)).toBe((0x4f << 7) + 0x01 + 4)
	})

	const ip1ToGrp1Pair = splitNRPN(ip1ToGrp1)

	test('splitNRPN', () => {
		expect(ip1ToGrp1Pair).toEqual({ MSB: 0x66, LSB: 0x74 })
		expect(splitNRPN(mixOutputBase)).toEqual({ MSB: 0x4f, LSB: 0x01 })
	})

	test('toNRPN', () => {
		expect(toNRPN(ip1ToGrp1Pair)).toBe((0x66 << 7) + 0x74)
	})

	test('prettyNRPN', () => {
		expect(prettyNRPN(ip1ToGrp1)).toBe('MSB=66, LSB=74')
	})
})
