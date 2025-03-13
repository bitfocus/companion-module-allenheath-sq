import { describe, test } from '@jest/globals'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import { SysCommonMultiByte, SysExMessage } from '../../bytes.js'
import { ExpectNextMessageNotReady, MixerWriteMidiBytes } from './interactions.js'

describe('parse status byte (ignored data to start)', () => {
	test('data bytes only', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0x12, 0x34]),
			MixerWriteMidiBytes([0x56]),
			ExpectNextMessageNotReady(),
			// force separate lines
		])
	})

	test('data bytes and partial channel message', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0x12, 0x00, 0x56]),
			MixerWriteMidiBytes([0xb0, 0x12]),
			MixerWriteMidiBytes([0xc3]),
			ExpectNextMessageNotReady(),
		])
	})

	test('data bytes and partial system exclusive', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0x12, 0x00, 0x56]),
			MixerWriteMidiBytes(SysExMessage.slice(0, 2)),
			ExpectNextMessageNotReady(),
		])
	})

	test('data bytes and system common (incomplete data)', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0x12, 0x34, 0x71]),
			MixerWriteMidiBytes(SysCommonMultiByte.slice(0, 2)),
			ExpectNextMessageNotReady(),
		])
	})
})
