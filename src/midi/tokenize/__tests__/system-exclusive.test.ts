import { describe, test } from '@jest/globals'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import {
	ExpectNextMessageNotReady,
	ExpectSystemExclusiveMessage,
	ExpectSystemRealTimeMessage,
	MixerReply,
} from './interactions.js'
import { SysCommonTuneRequest, SysExEnd, SysExStart, SysRTContinue } from '../../bytes.js'

describe('system exclusive', () => {
	test('noncanonical terminator (channel status)', async () => {
		return TestMidiTokenizing([
			MixerReply([0x33]),
			ExpectNextMessageNotReady(),
			MixerReply([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerReply([0xc3]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextMessageNotReady(),
		])
	})

	test('noncanonical terminator, system common status', async () => {
		return TestMidiTokenizing([
			MixerReply([0x33]),
			ExpectNextMessageNotReady(),
			MixerReply([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerReply([SysCommonTuneRequest]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextMessageNotReady(),
		])
	})

	test('shortest', async () => {
		return TestMidiTokenizing([
			MixerReply([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerReply([SysExEnd]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			MixerReply([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerReply([0x80]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
		])
	})

	test('system real time cuts line', async () => {
		return TestMidiTokenizing([
			MixerReply([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue, 0x23, 0x57]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerReply([0xf5]),
			ExpectSystemExclusiveMessage([SysExStart, 0x23, 0x57, SysExEnd]),
		])
	})

	test('multiple system exclusive starts', async () => {
		// F0 F0 F0 F0 should be interpreted as [F0 F7] [F0 F7]
		return TestMidiTokenizing([
			MixerReply([SysExStart]),
			ExpectNextMessageNotReady(),
			MixerReply([SysExStart]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			MixerReply([SysExStart, SysExStart, SysExStart]),
			ExpectSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextMessageNotReady(),
		])
	})
})
