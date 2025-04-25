import type { Equal, Expect } from 'type-testing'
import { describe, expect, test } from 'vitest'
import { type InputOutputType, Model } from '../model.js'
import { calculateMuteNRPN } from './mute.js'
import { splitNRPN, type UnbrandedParam } from './nrpn.js'

type test_AllMuteTypes = Expect<Equal<Parameters<typeof calculateMuteNRPN>[1], InputOutputType>>

describe('calculateMuteNRPN', () => {
	const model = new Model('SQ5')

	type InputOutputBehavior = { type: 'ok'; result: UnbrandedParam } | { type: 'error'; match: RegExp | string }

	type InputOutputTests = {
		[n: number]: InputOutputBehavior
	}
	const allInputsOutputs: Record<InputOutputType, InputOutputTests> = {
		inputChannel: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x00 } },
			1: { type: 'ok', result: { MSB: 0x00, LSB: 0x01 } },
			17: { type: 'ok', result: { MSB: 0x00, LSB: 0x11 } },
			47: { type: 'ok', result: { MSB: 0x00, LSB: 0x2f } },
			48: { type: 'error', match: 'inputChannel=48 is invalid' },
		},
		group: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x30 } },
			1: { type: 'ok', result: { MSB: 0x00, LSB: 0x31 } },
			5: { type: 'ok', result: { MSB: 0x00, LSB: 0x35 } },
			11: { type: 'ok', result: { MSB: 0x00, LSB: 0x3b } },
			12: { type: 'error', match: 'group=12 is invalid' },
		},
		mix: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x45 } },
			1: { type: 'ok', result: { MSB: 0x00, LSB: 0x46 } },
			5: { type: 'ok', result: { MSB: 0x00, LSB: 0x4a } },
			11: { type: 'ok', result: { MSB: 0x00, LSB: 0x50 } },
			12: { type: 'error', match: 'mix=12 is invalid' },
		},
		lr: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x44 } },
			1: { type: 'error', match: 'lr=1 is invalid' },
		},
		matrix: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x55 } },
			1: { type: 'ok', result: { MSB: 0x00, LSB: 0x56 } },
			2: { type: 'ok', result: { MSB: 0x00, LSB: 0x57 } },
			3: { type: 'error', match: 'matrix=3 is invalid' },
		},
		muteGroup: {
			0: { type: 'ok', result: { MSB: 0x04, LSB: 0x00 } },
			1: { type: 'ok', result: { MSB: 0x04, LSB: 0x01 } },
			5: { type: 'ok', result: { MSB: 0x04, LSB: 0x05 } },
			7: { type: 'ok', result: { MSB: 0x04, LSB: 0x07 } },
			8: { type: 'error', match: 'muteGroup=8 is invalid' },
		},
		fxReturn: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x3c } },
			1: { type: 'ok', result: { MSB: 0x00, LSB: 0x3d } },
			5: { type: 'ok', result: { MSB: 0x00, LSB: 0x41 } },
			7: { type: 'ok', result: { MSB: 0x00, LSB: 0x43 } },
			8: { type: 'error', match: 'fxReturn=8 is invalid' },
		},
		fxSend: {
			0: { type: 'ok', result: { MSB: 0x00, LSB: 0x51 } },
			1: { type: 'ok', result: { MSB: 0x00, LSB: 0x52 } },
			2: { type: 'ok', result: { MSB: 0x00, LSB: 0x53 } },
			3: { type: 'ok', result: { MSB: 0x00, LSB: 0x54 } },
			4: { type: 'error', match: 'fxSend=4 is invalid' },
		},
		dca: {
			0: { type: 'ok', result: { MSB: 0x02, LSB: 0x00 } },
			1: { type: 'ok', result: { MSB: 0x02, LSB: 0x01 } },
			5: { type: 'ok', result: { MSB: 0x02, LSB: 0x05 } },
			7: { type: 'ok', result: { MSB: 0x02, LSB: 0x07 } },
			8: { type: 'error', match: 'dca=8 is invalid' },
		},
	}

	function* allMuteTests(): Generator<{
		type: InputOutputType
		n: number
		behavior: InputOutputBehavior
	}> {
		for (const key in allInputsOutputs) {
			const type = key as InputOutputType
			const tests = allInputsOutputs[type]
			for (const [num, behavior] of Object.entries(tests)) {
				const n = Number(num)
				yield { type, n, behavior }
			}
		}
	}

	test.each([...allMuteTests()])('calculateMuteNRPN(model, $type, $n)', ({ type, n, behavior }) => {
		switch (behavior.type) {
			case 'ok':
				expect(splitNRPN(calculateMuteNRPN(model, type, n))).toEqual(behavior.result)
				break
			case 'error':
				expect(() => calculateMuteNRPN(model, type, n)).toThrow(behavior.match)
				break
			default:
				expect('missing').toBe('case')
		}
	})
})
