import { describe, expect, test } from '@jest/globals'
import { type PanBalance, panBalanceLevelToVCVF } from './pan-balance.js'

describe('pan/balance choices to VC/VF', () => {
	test('exact cases', () => {
		expect(panBalanceLevelToVCVF('L100')).toEqual([0x00, 0x00])
		expect(panBalanceLevelToVCVF('CTR')).toEqual([0x3f, 0x7f])
		expect(panBalanceLevelToVCVF('R100')).toEqual([0x7f, 0x7f])
	})

	test('various table entries', () => {
		const tests = [
			['L90', 0x06, 0x33],
			['L80', 0x0c, 0x66],
			['L70', 0x13, 0x19],
			['L60', 0x19, 0x4c],
			['L50', 0x1f, 0x7f],
			['L40', 0x26, 0x32],
			['L30', 0x2c, 0x65],
			['L20', 0x33, 0x18],
			['L15', 0x36, 0x32],
			['L10', 0x39, 0x4b],
			['L5', 0x3c, 0x65],
			['R5', 0x43, 0x18],
			['R10', 0x46, 0x32],
			['R15', 0x49, 0x4b],
			['R20', 0x4c, 0x65],
			['R30', 0x53, 0x18],
			['R40', 0x59, 0x4b],
			['R50', 0x5f, 0x7f],
			['R60', 0x66, 0x32],
			['R70', 0x6c, 0x65],
			['R80', 0x73, 0x18],
			['R90', 0x79, 0x4b],
		] satisfies [PanBalance, number, number][]

		for (const [level, expectedVC, expectedVF] of tests) {
			const [actualVC, actualVF] = panBalanceLevelToVCVF(level)
			expect(Math.abs(actualVC - expectedVC)).toBeLessThanOrEqual(1)
			expect(Math.abs(actualVF - expectedVF)).toBeLessThanOrEqual(1)
		}
	})
})
