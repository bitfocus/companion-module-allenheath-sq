import { describe, expect, test } from 'vitest'
import { adjustLevel, type Level, levelToNumeric, numericToLevel } from './level.js'

describe('levelToNumeric', () => {
	test.for([
		['-inf', -90],
		[-89, -89],
		[-43, -43],
		[-5, -5],
		[-1, -1],
		[0, 0],
		[1, 1],
		[5, 5],
		[10, 10],
	] satisfies [Level, number][])('levelToNumeric($0) should be $1', ([level, numeric]: [Level, number]) => {
		expect(levelToNumeric(level)).toBe(numeric)
	})
})

describe('numericToLevel', () => {
	test.for([
		// force to separate lines
		[-Infinity],
		[-144],
		[-95],
		[-90],
	] satisfies [number][])('below range: numericToLevel($0)', ([n]) => {
		expect(numericToLevel(n)).toBe('-inf')
	})

	test.for([
		// force to separate lines
		[-89],
		[-43],
		[-5],
		[-1],
		[0],
		[1],
		[5],
		[10],
	] satisfies [number][])('in range: numericToLevel($0)', ([numeric]) => {
		expect(numericToLevel(numeric)).toBe(numeric)
	})

	test.for([
		// force to separate lines
		[10.01],
		[11],
		[15],
		[23],
		[+Infinity],
	])('above range: numericToLevel($0)', ([numeric]) => {
		expect(numericToLevel(numeric)).toBe(10)
	})
})

describe('adjustLevel', () => {
	test.for([
		['-inf', 0],
		['-inf', -1],
		[-89, -1],
		[-89, -2],
		[-70, -20],
		[-70, -21],
		[-70, -25],
		[5, -95],
		[5, -100],
		[10, -100],
		[10, -110],
	] satisfies [Level, number][])('below range: adjustLevel($0, $1)', ([level, dbDelta]: [Level, number]) => {
		expect(adjustLevel(level, dbDelta)).toBe('-inf')
	})

	test.for([
		['-inf', 5, -85],
		['-inf', 0.01, -89.99],
		[-89, 1, -88],
		[-88, -1, -89],
		[-80, 80, 0],
		[-80, 90, 10],
		[10, 0, 10],
		[9, 1, 10],
		[-5, 10, 5],
		[-40, 40, 0],
		[-40, 45, 5],
	] satisfies [Level, number, Level][])(
		'in range: adjustLevel($0, $1)',
		([level, dbDelta, expected]: [Level, number, Level]) => {
			expect(adjustLevel(level, dbDelta)).toBe(expected)
		},
	)

	test.for([
		[-5, 16],
		['-inf', 100],
		['-inf', 105],
		[-40, 50],
		[-40, 51],
		[5, 6],
		[1, 10],
	] satisfies [Level, number][])('above range: adjustLevel($0, $1)', ([level, dbDelta]: [Level, number]) => {
		expect(adjustLevel(level, dbDelta)).toBe(10)
	})
})
