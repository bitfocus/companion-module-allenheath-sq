import { describe, expect, test } from 'vitest'
import { LevelNRPNCalculator, type SourceSinkForNRPN } from './source-to-sink.js'
import { type InputOutputType, Model } from '../model.js'
import type { UnbrandedParam } from './param.js'

describe('LevelNRPNCalculator', () => {
	const model = new Model('SQ5')

	type LevelOK = { type: 'ok'; result: UnbrandedParam }
	type LevelError = { type: 'error'; match: RegExp | string }
	type LevelBehavior = LevelOK | LevelError

	type LevelTest = [number, number, LevelBehavior]

	type LevelTests = [
		// top left corner always OK
		[0, 0, LevelOK],
		LevelTest,
		...LevelTest[],
		// below, below right, and right of bottom left corner are OOB
		[number, 0, LevelError],
		[0, number, LevelError],
		[number, number, LevelError],
	]

	type GenerateAllLevelTests<SourceSink extends SourceSinkForNRPN<'level'>> = {
		[Source in SourceSink[0]]: {
			[Sink in (SourceSink & [Source, InputOutputType])[1]]: LevelTests
		}
	}

	const tests = {
		inputChannel: {
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x44 } }],
				[3, 7, { type: 'ok', result: { MSB: 0x40, LSB: 0x6f } }],
				[15, 0, { type: 'ok', result: { MSB: 0x41, LSB: 0x78 } }],
				[32, 7, { type: 'ok', result: { MSB: 0x43, LSB: 0x4b } }],
				[47, 11, { type: 'ok', result: { MSB: 0x45, LSB: 0x03 } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[48, 12, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
			fxSend: [
				[0, 0, { type: 'ok', result: { MSB: 0x4c, LSB: 0x14 } }],
				[2, 1, { type: 'ok', result: { MSB: 0x4c, LSB: 0x1d } }],
				[7, 2, { type: 'ok', result: { MSB: 0x4c, LSB: 0x32 } }],
				[27, 1, { type: 'ok', result: { MSB: 0x4d, LSB: 0x01 } }],
				[47, 3, { type: 'ok', result: { MSB: 0x4d, LSB: 0x53 } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 4, { type: 'error', match: 'fxSend=4 is invalid' }],
				[48, 4, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x00 } }],
				[3, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x03 } }],
				[14, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x0e } }],
				[27, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x1b } }],
				[47, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x2f } }],
				[48, 0, { type: 'error', match: 'inputChannel=48 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[48, 1, { type: 'error', match: 'inputChannel=48 is invalid' }],
			],
		},
		fxReturn: {
			fxSend: [
				[0, 0, { type: 'ok', result: { MSB: 0x4e, LSB: 0x04 } }],
				[1, 3, { type: 'ok', result: { MSB: 0x4e, LSB: 0x0b } }],
				[2, 2, { type: 'ok', result: { MSB: 0x4e, LSB: 0x0e } }],
				[6, 1, { type: 'ok', result: { MSB: 0x4e, LSB: 0x1d } }],
				[7, 3, { type: 'ok', result: { MSB: 0x4e, LSB: 0x23 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 4, { type: 'error', match: 'fxSend=4 is invalid' }],
				[8, 4, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x46, LSB: 0x14 } }],
				[1, 10, { type: 'ok', result: { MSB: 0x46, LSB: 0x2a } }],
				[5, 6, { type: 'ok', result: { MSB: 0x46, LSB: 0x56 } }],
				[7, 11, { type: 'ok', result: { MSB: 0x46, LSB: 0x73 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[8, 12, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x3c } }],
				[5, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x41 } }],
				[7, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x43 } }],
				[8, 0, { type: 'error', match: 'fxReturn=8 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[8, 1, { type: 'error', match: 'fxReturn=8 is invalid' }],
			],
		},
		group: {
			fxSend: [
				[0, 0, { type: 'ok', result: { MSB: 0x4d, LSB: 0x54 } }],
				[0, 3, { type: 'ok', result: { MSB: 0x4d, LSB: 0x57 } }],
				[7, 2, { type: 'ok', result: { MSB: 0x4d, LSB: 0x72 } }],
				[2, 1, { type: 'ok', result: { MSB: 0x4d, LSB: 0x5d } }],
				[11, 3, { type: 'ok', result: { MSB: 0x4e, LSB: 0x03 } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 4, { type: 'error', match: 'fxSend=4 is invalid' }],
				[12, 4, { type: 'error', match: 'group=12 is invalid' }],
			],
			mix: [
				[0, 0, { type: 'ok', result: { MSB: 0x45, LSB: 0x04 } }],
				[0, 10, { type: 'ok', result: { MSB: 0x45, LSB: 0x0e } }],
				[2, 7, { type: 'ok', result: { MSB: 0x45, LSB: 0x23 } }],
				[6, 1, { type: 'ok', result: { MSB: 0x45, LSB: 0x4d } }],
				[10, 0, { type: 'ok', result: { MSB: 0x45, LSB: 0x7c } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 12, { type: 'error', match: 'mix=12 is invalid' }],
				[12, 12, { type: 'error', match: 'group=12 is invalid' }],
			],
			lr: [
				[0, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x30 } }],
				[3, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x33 } }],
				[8, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x38 } }],
				[11, 0, { type: 'ok', result: { MSB: 0x40, LSB: 0x3b } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 1, { type: 'error', match: 'lr=1 is invalid' }],
				[12, 1, { type: 'error', match: 'group=12 is invalid' }],
			],
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x4e, LSB: 0x4b } }],
				[5, 1, { type: 'ok', result: { MSB: 0x4e, LSB: 0x5b } }],
				[11, 2, { type: 'ok', result: { MSB: 0x4e, LSB: 0x6e } }],
				[12, 0, { type: 'error', match: 'group=12 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[12, 3, { type: 'error', match: 'group=12 is invalid' }],
			],
		},
		lr: {
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x4e, LSB: 0x24 } }],
				[0, 1, { type: 'ok', result: { MSB: 0x4e, LSB: 0x25 } }],
				[0, 2, { type: 'ok', result: { MSB: 0x4e, LSB: 0x26 } }],
				[1, 0, { type: 'error', match: 'lr=1 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[1, 3, { type: 'error', match: 'lr=1 is invalid' }],
			],
		},
		mix: {
			matrix: [
				[0, 0, { type: 'ok', result: { MSB: 0x4e, LSB: 0x27 } }],
				[0, 1, { type: 'ok', result: { MSB: 0x4e, LSB: 0x28 } }],
				[0, 2, { type: 'ok', result: { MSB: 0x4e, LSB: 0x29 } }],
				[5, 1, { type: 'ok', result: { MSB: 0x4e, LSB: 0x37 } }],
				[11, 2, { type: 'ok', result: { MSB: 0x4e, LSB: 0x4a } }],
				[12, 0, { type: 'error', match: 'mix=12 is invalid' }],
				[0, 3, { type: 'error', match: 'matrix=3 is invalid' }],
				[12, 3, { type: 'error', match: 'mix=12 is invalid' }],
			],
		},
	} satisfies GenerateAllLevelTests<SourceSinkForNRPN<'level'>>

	function* levelSourceSinks(): Generator<{ sourceSink: SourceSinkForNRPN<'level'> }> {
		for (const [sourceType, sinkTests] of Object.entries(tests)) {
			for (const sinkType of Object.keys(sinkTests)) {
				yield { sourceSink: [sourceType, sinkType] as SourceSinkForNRPN<'level'> }
			}
		}
	}

	test.each([...levelSourceSinks()])(
		'LevelNRPNCalculator.get(model, [$sourceSink.0, $sourceSink.1]) === LevelNRPNCalculator.get(model, [$sourceSink.0, $sourceSink.1])',
		({ sourceSink }) => {
			expect(LevelNRPNCalculator.get(model, sourceSink)).toBe(LevelNRPNCalculator.get(model, sourceSink))
		},
	)

	function* sourceSinkTests(): Generator<{
		calc: LevelNRPNCalculator
		sourceSink: SourceSinkForNRPN<'level'>
		source: number
		sink: number
		behavior: LevelBehavior
	}> {
		for (const [sourceType, sinkTests] of Object.entries(tests)) {
			for (const [sinkType, tests] of Object.entries(sinkTests)) {
				const sourceSink = [sourceType, sinkType] as SourceSinkForNRPN<'level'>
				const calc = LevelNRPNCalculator.get(model, sourceSink)
				for (const [source, sink, behavior] of tests as LevelTests) {
					yield { calc, sourceSink, source, sink, behavior }
				}
			}
		}
	}

	test.each([...sourceSinkTests()])(
		'LevelNRPNCalculator.get(model, [$sourceSink.0, $sourceSink.1]).calculate($source, $sink)',
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
