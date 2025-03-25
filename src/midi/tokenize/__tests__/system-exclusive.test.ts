import { describe, test } from 'vitest'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import {
	ExpectNextMessageNotReady,
	ExpectSystemExclusiveMessage,
	ExpectSystemRealTimeMessage,
	MixerWriteMidiBytes,
} from './interactions.js'
import { SysCommonTuneRequest, SysExEnd, SysExStart, SysRTContinue } from '../../bytes.js'

describe('system exclusive', () => {
	test('noncanonical terminator (channel status)', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0x33]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0xc3]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextMessageNotReady(),
		])
	})

	test('noncanonical terminator, system common status', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0x33]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonTuneRequest]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextMessageNotReady(),
		])
	})

	test('shortest', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysExEnd]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			MixerWriteMidiBytes([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x80]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
		])
	})

	test('system real time cuts line', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysRTContinue, 0x23, 0x57]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0xf5]),
			ExpectSystemExclusiveMessage([SysExStart, 0x23, 0x57, SysExEnd]),
		])
	})

	test('multiple system exclusive starts', async () => {
		// F0 F0 F0 F0 should be interpreted as [F0 F7] [F0 F7]
		return TestMidiTokenizing([
			MixerWriteMidiBytes([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysExStart]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			MixerWriteMidiBytes([SysExStart, SysExStart, SysExStart]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextMessageNotReady(),
		])
	})
})
