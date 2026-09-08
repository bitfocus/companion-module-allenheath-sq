import { describe, expect, test, vi } from 'vitest'
import { getLastLevel, rememberCurrentLevel } from './fading.js'
import { makeNRPN } from '../mixer/nrpn/nrpn.js'
import type { Mixer } from '../mixer/mixer.js'
import type { sqInstance } from '../instance.js'

describe('getLastLevel', () => {
	const nrpn = makeNRPN<'level'>(0x40, 0x44)

	test.each([-12.5, 10, '-inf'] as const)('captures and returns the level before an action: %s', (level) => {
		const mixer = { lastActionValue: new Map() } as Pick<Mixer, 'lastActionValue'>
		const log = vi.fn()
		const instance = { getVariableValue: vi.fn(() => level), log } as unknown as sqInstance

		rememberCurrentLevel(instance, mixer, nrpn)
		expect(getLastLevel(instance, mixer, nrpn)).toBe(level)
		expect(log).not.toHaveBeenCalled()
	})

	test.each([undefined, true, 'bad', -90, 10.1])('does not capture an unusable current value: %s', (level) => {
		const mixer = { lastActionValue: new Map() } as Pick<Mixer, 'lastActionValue'>
		const log = vi.fn()
		const instance = { getVariableValue: vi.fn(() => level), log } as unknown as sqInstance

		rememberCurrentLevel(instance, mixer, nrpn)
		expect(getLastLevel(instance, mixer, nrpn)).toBeNull()
		expect(log).toHaveBeenCalledWith('warn', 'No previous dB value is available for fader 64:68')
	})

	test('reading the saved level does not overwrite it', () => {
		const mixer = { lastActionValue: new Map() } as Pick<Mixer, 'lastActionValue'>
		const instance = { getVariableValue: vi.fn(() => -18), log: vi.fn() } as unknown as sqInstance

		rememberCurrentLevel(instance, mixer, nrpn)
		expect(getLastLevel(instance, mixer, nrpn)).toBe(-18)
		expect(getLastLevel(instance, mixer, nrpn)).toBe(-18)
	})
})
