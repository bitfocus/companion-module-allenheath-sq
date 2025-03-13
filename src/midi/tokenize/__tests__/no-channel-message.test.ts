import { describe, test } from '@jest/globals'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import { SysCommonMultiByte, SysExMessage } from '../../bytes.js'
import { ExpectNextMessageNotReady, MixerReply } from './interactions.js'

describe('parse status byte (ignored data to start)', () => {
	test('data bytes only', async () => {
		return TestMidiTokenizing([
			MixerReply([0x12, 0x34]),
			MixerReply([0x56]),
			ExpectNextMessageNotReady(),
			// force separate lines
		])
	})

	test('data bytes and partial channel message', async () => {
		return TestMidiTokenizing([
			MixerReply([0x12, 0x00, 0x56]),
			MixerReply([0xb0, 0x12]),
			MixerReply([0xc3]),
			ExpectNextMessageNotReady(),
		])
	})

	test('data bytes and partial system exclusive', async () => {
		return TestMidiTokenizing([
			MixerReply([0x12, 0x00, 0x56]),
			MixerReply(SysExMessage.slice(0, 2)),
			ExpectNextMessageNotReady(),
		])
	})

	test('data bytes and system common (incomplete data)', async () => {
		return TestMidiTokenizing([
			MixerReply([0x12, 0x34, 0x71]),
			MixerReply(SysCommonMultiByte.slice(0, 2)),
			ExpectNextMessageNotReady(),
		])
	})
})
