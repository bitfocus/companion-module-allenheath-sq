import { describe, expect, test } from 'vitest'
import { AssignNRPNCalculator, type SourceSinkForNRPN } from './source-to-sink.js'
import { type InputOutputType, Model } from '../model.js'
import type { UnbrandedParam } from './param.js'

describe('AssignNRPNCalculator', () => {
	const model = new Model('SQ5')

	type AssignOK = { type: 'ok'; result: UnbrandedParam }
	type AssignError = { type: 'error'; match: RegExp | string }
	type AssignBehavior = AssignOK | AssignError

	type AssignTest = [number, number, AssignBehavior]

	type AssignTests = [
		// top left corner always OK
		[0, 0, AssignOK],
		AssignTest,
		...AssignTest[],
		// below, below right, and right of bottom left corner are OOB
		[number, 0, AssignError],
		[0, number, AssignError],
		[number, number, AssignError],
	]

	type GenerateAllAssignTests<SourceSink extends SourceSinkForNRPN<'assign'>> = {
		[Source in SourceSink[0]]: {
			[Sink in (SourceSink & [Source, InputOutputType])[1]]: AssignTests
		}
	}

	const tests = {
		inputChannel: {
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x44 } }],
				[3, 7, { type: 'ok', result: { MSB: 0x60, LSB: 0x6f } }],
				[15, 0, { type: 'ok', result: { MSB: 0x61, LSB: 0x78 } }],
				[32, 7, { type: 'ok', result: { MSB: 0x63, LSB: 0x4b } }],
				[47, 11, { type: 'ok', result: { MSB: 0x65, LSB: 0x03 } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[48, 12, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
			group: [
				[0, 0, { type: 'ok', result: { MSB: 0x66, LSB: 0x74 } }],
				[2, 9, { type: 'ok', result: { MSB: 0x67, LSB: 0x15 } }],
				[7, 9, { type: 'ok', result: { MSB: 0x67, LSB: 0x51 } }],
				[18, 2, { type: 'ok', result: { MSB: 0x68, LSB: 0x4e } }],
				[47, 11, { type: 'ok', result: { MSB: 0x6b, LSB: 0x33 } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 12, { type: 'error', match: 'group=12 is invalid' }],
				[48, 12, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
			fxSend: [
				[0, 0, { type: 'ok', result: { MSB: 0x6c, LSB: 0x14 } }],
				[2, 1, { type: 'ok', result: { MSB: 0x6c, LSB: 0x1d } }],
				[7, 2, { type: 'ok', result: { MSB: 0x6c, LSB: 0x32 } }],
				[27, 1, { type: 'ok', result: { MSB: 0x6d, LSB: 0x01 } }],
				[47, 3, { type: 'ok', result: { MSB: 0x6d, LSB: 0x53 } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 4, { type: 'error', match: 'fxSend=4 is invalid' }],
				[48, 4, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x00 } }],
				[3, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x03 } }],
				[14, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x0e } }],
				[27, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x1b } }],
				[47, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x2f } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[48, 1, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
		},
		fxReturn: {
			fxSend: [
				[0, 0, { type: 'ok', result: { MSB: 0x6e, LSB: 0x04 } }],
				[1, 3, { type: 'ok', result: { MSB: 0x6e, LSB: 0x0b } }],
				[2, 2, { type: 'ok', result: { MSB: 0x6e, LSB: 0x0e } }],
				[6, 1, { type: 'ok', result: { MSB: 0x6e, LSB: 0x1d } }],
				[7, 3, { type: 'ok', result: { MSB: 0x6e, LSB: 0x23 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 4, { type: 'error', match: 'fxSend=4 is invalid' }],
				[8, 4, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x66, LSB: 0x14 } }],
				[1, 10, { type: 'ok', result: { MSB: 0x66, LSB: 0x2a } }],
				[5, 6, { type: 'ok', result: { MSB: 0x66, LSB: 0x56 } }],
				[7, 11, { type: 'ok', result: { MSB: 0x66, LSB: 0x73 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[8, 12, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x3c } }],
				[5, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x41 } }],
				[7, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x43 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[8, 1, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
			group: [
				[0, 0, { type: 'ok', result: { MSB: 0x6b, LSB: 0x34 } }],
				[0, 11, { type: 'ok', result: { MSB: 0x6b, LSB: 0x3f } }],
				[2, 3, { type: 'ok', result: { MSB: 0x6b, LSB: 0x4f } }],
				[6, 1, { type: 'ok', result: { MSB: 0x6b, LSB: 0x7d } }],
				[4, 7, { type: 'ok', result: { MSB: 0x6b, LSB: 0x6b } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 12, { type: 'error', match: 'group=12 is invalid' }],
				[8, 12, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
		},
		group: {
			fxSend: [
				[0, 0, { type: 'ok', result: { MSB: 0x6d, LSB: 0x54 } }],
				[0, 3, { type: 'ok', result: { MSB: 0x6d, LSB: 0x57 } }],
				[7, 2, { type: 'ok', result: { MSB: 0x6d, LSB: 0x72 } }],
				[2, 1, { type: 'ok', result: { MSB: 0x6d, LSB: 0x5d } }],
				[11, 3, { type: 'ok', result: { MSB: 0x6e, LSB: 0x03 } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 4, { type: 'error', match: 'fxSend=4 is invalid' }],
				[12, 4, { type: 'error', match: 'group=12 is invalid' }],
			],
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x65, LSB: 0x04 } }],
				[0, 10, { type: 'ok', result: { MSB: 0x65, LSB: 0x0e } }],
				[2, 7, { type: 'ok', result: { MSB: 0x65, LSB: 0x23 } }],
				[6, 1, { type: 'ok', result: { MSB: 0x65, LSB: 0x4d } }],
				[10, 0, { type: 'ok', result: { MSB: 0x65, LSB: 0x7c } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[12, 12, { type: 'error', match: 'group=12 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x30 } }],
				[3, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x33 } }],
				[8, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x38 } }],
				[11, 0, { type: 'ok', result: { MSB: 0x60, LSB: 0x3b } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[12, 1, { type: 'error', match: 'group=12 is invalid' }],
			],
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x6e, LSB: 0x4b } }],
				[5, 1, { type: 'ok', result: { MSB: 0x6e, LSB: 0x5b } }],
				[11, 2, { type: 'ok', result: { MSB: 0x6e, LSB: 0x6e } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[12, 3, { type: 'error', match: 'group=12 is invalid' }],
			],
		},
		lr: {
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x6e, LSB: 0x24 } }],
				[0, 1, { type: 'ok', result: { MSB: 0x6e, LSB: 0x25 } }],
				[0, 2, { type: 'ok', result: { MSB: 0x6e, LSB: 0x26 } }],
				[1, 0, { type: 'error', match: 'lr=1 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[1, 3, { type: 'error', match: 'lr=1 is invalid' }],
			],
		},
		mix: {
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x6e, LSB: 0x27 } }],
				[0, 1, { type: 'ok', result: { MSB: 0x6e, LSB: 0x28 } }],
				[0, 2, { type: 'ok', result: { MSB: 0x6e, LSB: 0x29 } }],
				[5, 1, { type: 'ok', result: { MSB: 0x6e, LSB: 0x37 } }],
				[12, 0, { type: 'error', match: 'mix=12 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[12, 3, { type: 'error', match: 'mix=12 is invalid' }],
			],
		},
	} satisfies GenerateAllAssignTests<SourceSinkForNRPN<'assign'>>

	function* sourceSinkTests(): Generator<{
		calc: AssignNRPNCalculator
		sourceSink: SourceSinkForNRPN<'assign'>
		source: number
		sink: number
		behavior: AssignBehavior
	}> {
		for (const [sourceType, sinkTests] of Object.entries(tests)) {
			for (const [sinkType, tests] of Object.entries(sinkTests)) {
				const sourceSink = [sourceType, sinkType] as SourceSinkForNRPN<'assign'>
				const calc = new AssignNRPNCalculator(model, sourceSink)
				for (const [source, sink, behavior] of tests as AssignTests) {
					yield { calc, sourceSink, source, sink, behavior }
				}
			}
		}
	}

	test.each([...sourceSinkTests()])(
		"new AssignNRPNCalculator(model, ['$sourceSink.0', '$sourceSink.1']).calculate($source, $sink)",
		({ calc, source, sink, behavior }) => {
			switch (behavior.type) {
				case 'ok':
					expect(calc.calculate(source, sink)).toEqual(behavior.result)
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
