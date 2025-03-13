import { describe, test } from '@jest/globals'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import { SysRTContinue } from '../../bytes.js'
import {
	ExpectChannelMessage,
	ExpectNextMessageNotReady,
	ExpectSystemRealTimeMessage,
	MixerReply,
} from './interactions.js'

describe('channel messages (2 data bytes)', () => {
	test('note off', async () => {
		return TestMidiTokenizing([
			MixerReply([0x80, 0x90]),
			ExpectNextMessageNotReady(),
			MixerReply([0x80]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x37]),
			ExpectChannelMessage([0x80, 0x25, 0x37]),
			MixerReply([0x22, 0x66]),
			ExpectChannelMessage([0x80, 0x22, 0x66]),
		])
	})

	test('note on', async () => {
		return TestMidiTokenizing([
			MixerReply([0x93, 0x80]),
			ExpectNextMessageNotReady(),
			MixerReply([0x92]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x19]),
			ExpectChannelMessage([0x92, 0x25, 0x19]),
			MixerReply([0x37, 0x55]),
			ExpectChannelMessage([0x92, 0x37, 0x55]),
		])
	})

	test('polyphonic pressure', async () => {
		return TestMidiTokenizing([
			// (comment to force to separate lines)
			MixerReply([0xa7, 0x80]),
			ExpectNextMessageNotReady(),
			MixerReply([0xa6]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x19]),
			ExpectChannelMessage([0xa6, 0x25, 0x19]),
			MixerReply([0x37, 0x55]),
			ExpectChannelMessage([0xa6, 0x37, 0x55]),
		])
	})

	test('control change', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb7, 0x80]),
			ExpectNextMessageNotReady(),
			MixerReply([0xb2]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x19]),
			ExpectChannelMessage([0xb2, 0x25, 0x19]),
			MixerReply([0x37, 0x55]),
			ExpectChannelMessage([0xb2, 0x37, 0x55]),
		])
	})

	test('pitch bend', async () => {
		return TestMidiTokenizing([
			MixerReply([0xe3, 0x80]),
			ExpectNextMessageNotReady(),
			MixerReply([0xe2]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x19]),
			ExpectChannelMessage([0xe2, 0x25, 0x19]),
			MixerReply([0x37, 0x55]),
			ExpectChannelMessage([0xe2, 0x37, 0x55]),
		])
	})
})

describe('channel messages (1 data byte)', () => {
	test('program change', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc0, 0x90]),
			ExpectNextMessageNotReady(),
			MixerReply([0xc0]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectChannelMessage([0xc0, 0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x37]),
			ExpectChannelMessage([0xc0, 0x37]),
			MixerReply([0x22, 0xc6, 0x66]),
			ExpectChannelMessage([0xc0, 0x22]),
			ExpectChannelMessage([0xc6, 0x66]),
		])
	})

	test('channel pressure', async () => {
		return TestMidiTokenizing([
			MixerReply([0xd6, 0x90]),
			ExpectNextMessageNotReady(),
			MixerReply([0xd1]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x25]),
			ExpectChannelMessage([0xd1, 0x25]),
			ExpectNextMessageNotReady(),
			MixerReply([0x37]),
			ExpectChannelMessage([0xd1, 0x37]),
			MixerReply([0x22, 0xd6, 0x73]),
			ExpectChannelMessage([0xd1, 0x22]),
			ExpectChannelMessage([0xd6, 0x73]),
		])
	})
})
