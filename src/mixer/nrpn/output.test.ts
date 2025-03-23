import { describe, expect, test } from 'vitest'
import { type InputOutputType, Model } from '../model.js'
import { OutputBalanceNRPNCalculator, OutputLevelNRPNCalculator, type SinkAsOutputForNRPN } from './output.js'
import type { UnbrandedParam } from './param.js'

describe('calculateOutputNRPN', () => {
	const model = new Model('SQ5')

	type OutputBehavior = { type: 'ok'; result: UnbrandedParam } | { type: 'error'; match: RegExp | string }

	type OutputTest = [number, OutputBehavior][]

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

	function* allLevelTests(): Generator<{
		sinkType: InputOutputType
		calc: OutputLevelNRPNCalculator
		n: number
		behavior: OutputBehavior
	}> {
		for (const [sinkType, sinkTests] of outputLevelTests) {
			const calc = new OutputLevelNRPNCalculator(model, sinkType)
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
		'new OutputLevelNRPNCalculator(model, $sinkType).calculate($n)',
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

	function* allBalanceTests(): Generator<{
		sinkType: InputOutputType
		calc: OutputBalanceNRPNCalculator
		n: number
		behavior: OutputBehavior
	}> {
		for (const [sinkType, sinkTests] of outputPanBalanceTests) {
			const calc = new OutputBalanceNRPNCalculator(model, sinkType)
			for (const [n, behavior] of sinkTests) {
				yield { sinkType, calc, n, behavior }
			}
		}
	}

	test.each([...allBalanceTests()])(
		'new OutputBalanceNRPNCalculator(model, $sinkType).calculate($n)',
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
