import { describe, expect, test } from 'vitest'
import { type InputOutputType, Model } from '../model.js'
import { splitNRPN, type UnbrandedParam } from './param.js'
import { BalanceNRPNCalculator, type SourceSinkForNRPN } from './source-to-sink.js'

describe('BalanceNRPNCalculator', () => {
	const model = new Model('SQ5')

	type BalanceOK = { type: 'ok'; result: UnbrandedParam }
	type BalanceError = { type: 'error'; match: RegExp | string }
	type BalanceBehavior = BalanceOK | BalanceError

	type BalanceTest = [number, number, BalanceBehavior]

	type BalanceTests = [
		// top left corner always OK
		[0, 0, BalanceOK],
		BalanceTest,
		...BalanceTest[],
		// below, below right, and right of bottom left corner are OOB
		[number, 0, BalanceError],
		[0, number, BalanceError],
		[number, number, BalanceError],
	]

	type GenerateAllBalanceTests<SourceSink extends SourceSinkForNRPN<'assign'>> = {
		[Source in SourceSink[0]]: {
			[Sink in (SourceSink & [Source, InputOutputType])[1]]: BalanceTests
		}
	}

	const tests = {
		inputChannel: {
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x44 } }],
				[3, 7, { type: 'ok', result: { MSB: 0x50, LSB: 0x6f } }],
				[15, 0, { type: 'ok', result: { MSB: 0x51, LSB: 0x78 } }],
				[32, 7, { type: 'ok', result: { MSB: 0x53, LSB: 0x4b } }],
				[47, 11, { type: 'ok', result: { MSB: 0x55, LSB: 0x03 } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[48, 12, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x00 } }],
				[3, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x03 } }],
				[14, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x0e } }],
				[27, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x1b } }],
				[47, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x2f } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[48, 1, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
		},
		fxReturn: {
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x56, LSB: 0x14 } }],
				[1, 10, { type: 'ok', result: { MSB: 0x56, LSB: 0x2a } }],
				[5, 6, { type: 'ok', result: { MSB: 0x56, LSB: 0x56 } }],
				[7, 11, { type: 'ok', result: { MSB: 0x56, LSB: 0x73 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[8, 12, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x3c } }],
				[5, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x41 } }],
				[7, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x43 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[8, 1, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
		},
		group: {
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x55, LSB: 0x04 } }],
				[0, 10, { type: 'ok', result: { MSB: 0x55, LSB: 0x0e } }],
				[2, 7, { type: 'ok', result: { MSB: 0x55, LSB: 0x23 } }],
				[6, 1, { type: 'ok', result: { MSB: 0x55, LSB: 0x4d } }],
				[10, 0, { type: 'ok', result: { MSB: 0x55, LSB: 0x7c } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[12, 12, { type: 'error', match: 'group=12 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x30 } }],
				[3, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x33 } }],
				[8, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x38 } }],
				[11, 0, { type: 'ok', result: { MSB: 0x50, LSB: 0x3b } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[12, 1, { type: 'error', match: 'group=12 is invalid' }],
			],
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x5e, LSB: 0x4b } }],
				[5, 1, { type: 'ok', result: { MSB: 0x5e, LSB: 0x5b } }],
				[11, 2, { type: 'ok', result: { MSB: 0x5e, LSB: 0x6e } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[12, 3, { type: 'error', match: 'group=12 is invalid' }],
			],
		},
		lr: {
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x5e, LSB: 0x24 } }],
				[0, 1, { type: 'ok', result: { MSB: 0x5e, LSB: 0x25 } }],
				[0, 2, { type: 'ok', result: { MSB: 0x5e, LSB: 0x26 } }],
				[1, 0, { type: 'error', match: 'lr=1 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[1, 3, { type: 'error', match: 'lr=1 is invalid' }],
			],
		},
		mix: {
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x5e, LSB: 0x27 } }],
				[0, 1, { type: 'ok', result: { MSB: 0x5e, LSB: 0x28 } }],
				[0, 2, { type: 'ok', result: { MSB: 0x5e, LSB: 0x29 } }],
				[5, 1, { type: 'ok', result: { MSB: 0x5e, LSB: 0x37 } }],
				[11, 2, { type: 'ok', result: { MSB: 0x5e, LSB: 0x4a } }],
				[12, 0, { type: 'error', match: 'mix=12 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[12, 3, { type: 'error', match: 'mix=12 is invalid' }],
			],
		},
	} satisfies GenerateAllBalanceTests<SourceSinkForNRPN<'panBalance'>>

	function* balanceSourceSinks(): Generator<{ sourceSink: SourceSinkForNRPN<'panBalance'> }> {
		for (const [sourceType, sinkTests] of Object.entries(tests)) {
			for (const sinkType of Object.keys(sinkTests)) {
				yield { sourceSink: [sourceType, sinkType] as SourceSinkForNRPN<'panBalance'> }
			}
		}
	}

	test.each([...balanceSourceSinks()])(
		'BalanceNRPNCalculator.get(model, [$sourceSink.0, $sourceSink.1]) === BalanceNRPNCalculator.get(model, [$sourceSink.0, $sourceSink.1])',
		({ sourceSink }) => {
			expect(BalanceNRPNCalculator.get(model, sourceSink)).toBe(BalanceNRPNCalculator.get(model, sourceSink))
		},
	)

	function* sourceSinkTests(): Generator<{
		calc: BalanceNRPNCalculator
		sourceSink: SourceSinkForNRPN<'assign'>
		source: number
		sink: number
		behavior: BalanceBehavior
	}> {
		for (const [sourceType, sinkTests] of Object.entries(tests)) {
			for (const [sinkType, tests] of Object.entries(sinkTests)) {
				const sourceSink = [sourceType, sinkType] as SourceSinkForNRPN<'panBalance'>
				const calc = BalanceNRPNCalculator.get(model, sourceSink)
				for (const [source, sink, behavior] of tests as BalanceTests) {
					yield { calc, sourceSink, source, sink, behavior }
				}
			}
		}
	}

	test.each([...sourceSinkTests()])(
		'BalanceNRPNCalculator.get(model, [$sourceSink.0, $sourceSink.1]).calculate($source, $sink)',
		({ calc, source, sink, behavior }) => {
			switch (behavior.type) {
				case 'ok':
					expect(splitNRPN(calc.calculate(source, sink))).toEqual(behavior.result)
					break
				case 'error':
					expect(() => calc.calculate(source, sink)).toThrow(behavior.match)
					break
				default:
					expect('missing').toBe('case')
			}
		},
	)
})
