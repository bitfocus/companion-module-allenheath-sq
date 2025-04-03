import { describe, expect, test } from 'vitest'
import { type InputOutputType, Model } from '../model.js'
import {
	forEachOutputLevel,
	OutputBalanceNRPNCalculator,
	OutputLevelNRPNCalculator,
	type SinkAsOutputForNRPN,
} from './output.js'
import type { LevelParam, UnbrandedParam } from './param.js'

type OutputBehavior = { type: 'ok'; result: UnbrandedParam } | { type: 'error'; match: RegExp | string }

type OutputTest = [number, OutputBehavior][]

describe('OutputLevelNRPNCalculator', () => {
	const model = new Model('SQ5')

	const outputLevelTests = new Map<SinkAsOutputForNRPN<'level'>, OutputTest>([
		[
			'mix',
			[
				[0, { type: 'ok', result: { MSB: 0x4f, LSB: 0x01 } }],
				[4, { type: 'ok', result: { MSB: 0x4f, LSB: 0x05 } }],
				[11, { type: 'ok', result: { MSB: 0x4f, LSB: 0x0c } }],
				[12, { type: 'error', match: 'mix=12 is invalid' }],
			],
		],
		[
			'lr',
			[
				[0, { type: 'ok', result: { MSB: 0x4f, LSB: 0x00 } }],
				[1, { type: 'error', match: 'lr=1 is invalid' }],
			],
		],
		[
			'matrix',
			[
				[0, { type: 'ok', result: { MSB: 0x4f, LSB: 0x11 } }],
				[1, { type: 'ok', result: { MSB: 0x4f, LSB: 0x12 } }],
				[2, { type: 'ok', result: { MSB: 0x4f, LSB: 0x13 } }],
				[3, { type: 'error', match: 'matrix=3 is invalid' }],
			],
		],
		[
			'fxSend',
			[
				[0, { type: 'ok', result: { MSB: 0x4f, LSB: 0x0d } }],
				[1, { type: 'ok', result: { MSB: 0x4f, LSB: 0x0e } }],
				[2, { type: 'ok', result: { MSB: 0x4f, LSB: 0x0f } }],
				[3, { type: 'ok', result: { MSB: 0x4f, LSB: 0x10 } }],
				[4, { type: 'error', match: 'fxSend=4 is invalid' }],
			],
		],
		[
			'dca',
			[
				[0, { type: 'ok', result: { MSB: 0x4f, LSB: 0x20 } }],
				[1, { type: 'ok', result: { MSB: 0x4f, LSB: 0x21 } }],
				[6, { type: 'ok', result: { MSB: 0x4f, LSB: 0x26 } }],
				[7, { type: 'ok', result: { MSB: 0x4f, LSB: 0x27 } }],
				[8, { type: 'error', match: 'dca=8 is invalid' }],
			],
		],
	])

	function* outputLevelSinks(): Generator<{ sink: SinkAsOutputForNRPN<'level'> }> {
		for (const [sinkType] of outputLevelTests) {
			yield { sink: sinkType }
		}
	}

	test.each([...outputLevelSinks()])(
		'OutputLevelNRPNCalculator.get(model, $sink) === OutputLevelNRPNCalculator.get(model, $sink)',
		({ sink }) => {
			expect(OutputLevelNRPNCalculator.get(model, sink)).toBe(OutputLevelNRPNCalculator.get(model, sink))
		},
	)

	function* allLevelTests(): Generator<{
		sinkType: InputOutputType
		calc: OutputLevelNRPNCalculator
		n: number
		behavior: OutputBehavior
	}> {
		for (const [sinkType, sinkTests] of outputLevelTests) {
			const calc = OutputLevelNRPNCalculator.get(model, sinkType)
			for (const [n, behavior] of sinkTests) {
				yield { sinkType, calc, n, behavior }
				switch (behavior.type) {
					case 'ok':
						expect(calc.calculate(n)).toEqual(behavior.result)
						break
					case 'error':
						expect(() => calc.calculate(n)).toThrow(behavior.match)
						break
					default:
						expect('missing').toBe('case')
				}
			}
		}
	}

	test.each([...allLevelTests()])(
		'OutputLevelNRPNCalculator.get(model, $sinkType).calculate($n)',
		({ calc, n, behavior }) => {
			switch (behavior.type) {
				case 'ok':
					expect(calc.calculate(n)).toEqual(behavior.result)
					break
				case 'error':
					expect(() => calc.calculate(n)).toThrow(behavior.match)
					break
				default:
					expect('missing').toBe('case')
			}
		},
	)
})

describe('OutputBalanceNRPNCalculator', () => {
	const model = new Model('SQ5')

	const outputPanBalanceTests = new Map<SinkAsOutputForNRPN<'panBalance'>, OutputTest>([
		[
			'mix',
			[
				[0, { type: 'ok', result: { MSB: 0x5f, LSB: 0x01 } }],
				[4, { type: 'ok', result: { MSB: 0x5f, LSB: 0x05 } }],
				[11, { type: 'ok', result: { MSB: 0x5f, LSB: 0x0c } }],
				[12, { type: 'error', match: 'mix=12 is invalid' }],
			],
		],
		[
			'lr',
			[
				[0, { type: 'ok', result: { MSB: 0x5f, LSB: 0x00 } }],
				[1, { type: 'error', match: 'lr=1 is invalid' }],
			],
		],
		[
			'matrix',
			[
				[0, { type: 'ok', result: { MSB: 0x5f, LSB: 0x11 } }],
				[1, { type: 'ok', result: { MSB: 0x5f, LSB: 0x12 } }],
				[2, { type: 'ok', result: { MSB: 0x5f, LSB: 0x13 } }],
				[3, { type: 'error', match: 'matrix=3 is invalid' }],
			],
		],
	])

	function* outputBalanceSinks(): Generator<{ sink: SinkAsOutputForNRPN<'panBalance'> }> {
		for (const [sinkType] of outputPanBalanceTests) {
			yield { sink: sinkType }
		}
	}

	test.each([...outputBalanceSinks()])(
		'OutputBalanceNRPNCalculator.get(model, $sink) === OutputBalanceNRPNCalculator.get(model, $sink)',
		({ sink }) => {
			expect(OutputBalanceNRPNCalculator.get(model, sink)).toBe(OutputBalanceNRPNCalculator.get(model, sink))
		},
	)

	function* allBalanceTests(): Generator<{
		sinkType: InputOutputType
		calc: OutputBalanceNRPNCalculator
		n: number
		behavior: OutputBehavior
	}> {
		for (const [sinkType, sinkTests] of outputPanBalanceTests) {
			const calc = OutputBalanceNRPNCalculator.get(model, sinkType)
			for (const [n, behavior] of sinkTests) {
				yield { sinkType, calc, n, behavior }
			}
		}
	}

	test.each([...allBalanceTests()])(
		'OutputBalanceNRPNCalculator.get(model, $sinkType).calculate($n)',
		({ calc, n, behavior }) => {
			switch (behavior.type) {
				case 'ok':
					expect(calc.calculate(n)).toEqual(behavior.result)
					break
				case 'error':
					expect(() => calc.calculate(n)).toThrow(behavior.match)
					break
				default:
					expect('missing').toBe('case')
			}
		},
	)
})

describe('forEachOutputLevel', () => {
	const model = new Model('SQ5')

	const results: [LevelParam, string][] = []
	forEachOutputLevel(model, (nrpn, sinkDesc) => {
		results.push([nrpn, sinkDesc])
	})

	test('some levels gotten', () => {
		expect(results.length).greaterThan(0)
	})

	test('lr', () => {
		expect(
			results.findIndex(([{ MSB, LSB }, sinkDesc]) => {
				return MSB === 0x4f && LSB === 0x00 && sinkDesc === 'LR'
			}),
		).greaterThanOrEqual(0)
	})

	test('mix 7', () => {
		expect(
			results.findIndex(([{ MSB, LSB }, sinkDesc]) => {
				return MSB === 0x4f && LSB === 0x07 && sinkDesc === 'Aux 7'
			}),
		).greaterThanOrEqual(0)
	})

	test('fxSend 3', () => {
		expect(
			results.findIndex(([{ MSB, LSB }, sinkDesc]) => {
				return MSB === 0x4f && LSB === 0x0f && sinkDesc === 'FX Send 3'
			}),
		).greaterThanOrEqual(0)
	})

	test('matrix 2', () => {
		expect(
			results.findIndex(([{ MSB, LSB }, sinkDesc]) => {
				return MSB === 0x4f && LSB === 0x12 && sinkDesc === 'Matrix 2'
			}),
		).greaterThanOrEqual(0)
	})

	test('dca 6', () => {
		expect(
			results.findIndex(([{ MSB, LSB }, sinkDesc]) => {
				return MSB === 0x4f && LSB === 0x25 && sinkDesc === 'DCA 6'
			}),
		).greaterThanOrEqual(0)
	})
})
