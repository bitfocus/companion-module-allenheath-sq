import { describe, test } from '@jest/globals'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import { SysCommonMultiByte, SysRTContinue } from '../../bytes.js'
import {
	ExpectNextMessageNotReady,
	ExpectChannelMessage,
	ExpectSystemCommonMessage,
	ExpectSystemRealTimeMessage,
	MixerReply,
} from './interactions.js'

describe('parse status byte (ignored data to start)', () => {
	test('single data byte', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3, 0x01]),
			MixerReply([0x05]),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x05]),
			ExpectNextMessageNotReady(),
			MixerReply([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
		])
	})

	test('system real time before running data', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3]),
			ExpectNextMessageNotReady(),
			MixerReply([SysRTContinue, 0x01]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectNextMessageNotReady(),
			MixerReply([0x05]),
			ExpectChannelMessage([0xc3, 0x05]),
			MixerReply([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
		])
	})

	test('system real time after first running data', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3, 0x01, SysRTContinue]),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerReply([0x05]),
			ExpectChannelMessage([0xc3, 0x05]),
			MixerReply([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
			ExpectNextMessageNotReady(),
		])
	})

	test('system real time after second running data', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x01]),
			MixerReply([0x05, SysRTContinue]),
			ExpectChannelMessage([0xc3, 0x05]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerReply([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
			ExpectNextMessageNotReady(),
		])
	})
	test('system real time end of running data', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x01]),
			MixerReply([0x05]),
			ExpectChannelMessage([0xc3, 0x05]),
			MixerReply([0x07, SysRTContinue, 0xb0, 0x00, 0x17]),
			ExpectChannelMessage([0xc3, 0x07]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectChannelMessage([0xb0, 0x00, 0x17]),
		])
	})

	test('terminated by system common', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x01]),
			MixerReply(SysCommonMultiByte),
			MixerReply([0x05]),
			MixerReply([0xb1, 0x33, 0x77]),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
		])
	})

	test('terminated by system common after running', async () => {
		return TestMidiTokenizing([
			MixerReply([0xc3, 0x01, 0x72]),
			MixerReply(SysCommonMultiByte.slice(0, 1)),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x72]),
			ExpectNextMessageNotReady(),
			MixerReply(SysCommonMultiByte.slice(1)),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			MixerReply([0x05]),
			MixerReply([0xb1, 0x33, 0x77]),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
		])
	})

	test('multiple data bytes, terminated by system common', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb5, 0x03, 0x27]),
			MixerReply(SysCommonMultiByte),
			ExpectChannelMessage([0xb5, 0x03, 0x27]),
			MixerReply([0x05]),
			MixerReply([0xb1, 0x33, 0x77]),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
			ExpectNextMessageNotReady(),
		])
	})

	test('multiple data bytes, preempted by system common', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb5, ...SysCommonMultiByte]),
			MixerReply([0x05]),
			MixerReply([0xb1, 0x33]),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			ExpectNextMessageNotReady(),
			MixerReply([0x77]),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
		])
	})

	test('multiple data bytes, interrupted by system common', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb7, 0x36, 0x65]),
			MixerReply([0x52]),
			MixerReply(SysCommonMultiByte.slice(0, 1)),
			ExpectChannelMessage([0xb7, 0x36, 0x65]),
			MixerReply(SysCommonMultiByte.slice(1)),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			MixerReply([0x05]),
			MixerReply([0x06]),
			MixerReply([0xb1, 0x33, 0x77]),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
			ExpectNextMessageNotReady(),
		])
	})
})
