import { describe, test } from 'vitest'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import { SysCommonMultiByte, SysRTContinue } from '../../bytes.js'
import {
	ExpectNextMessageNotReady,
	ExpectChannelMessage,
	ExpectSystemCommonMessage,
	ExpectSystemRealTimeMessage,
	MixerWriteMidiBytes,
} from './interactions.js'

describe('parse status byte (ignored data to start)', () => {
	test('single data byte', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3, 0x01]),
			MixerWriteMidiBytes([0x05]),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x05]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
		])
	})

	test('system real time before running data', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysRTContinue, 0x01]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x05]),
			ExpectChannelMessage([0xc3, 0x05]),
			MixerWriteMidiBytes([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
		])
	})

	test('system real time after first running data', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3, 0x01, SysRTContinue]),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x05]),
			ExpectChannelMessage([0xc3, 0x05]),
			MixerWriteMidiBytes([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
			ExpectNextMessageNotReady(),
		])
	})

	test('system real time after second running data', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x01]),
			MixerWriteMidiBytes([0x05, SysRTContinue]),
			ExpectChannelMessage([0xc3, 0x05]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerWriteMidiBytes([0x07]),
			ExpectChannelMessage([0xc3, 0x07]),
			ExpectNextMessageNotReady(),
		])
	})
	test('system real time end of running data', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x01]),
			MixerWriteMidiBytes([0x05]),
			ExpectChannelMessage([0xc3, 0x05]),
			MixerWriteMidiBytes([0x07, SysRTContinue, 0xb0, 0x00, 0x17]),
			ExpectChannelMessage([0xc3, 0x07]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectChannelMessage([0xb0, 0x00, 0x17]),
		])
	})

	test('terminated by system common', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x01]),
			MixerWriteMidiBytes(SysCommonMultiByte),
			MixerWriteMidiBytes([0x05]),
			MixerWriteMidiBytes([0xb1, 0x33, 0x77]),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
		])
	})

	test('terminated by system common after running', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xc3, 0x01, 0x72]),
			MixerWriteMidiBytes(SysCommonMultiByte.slice(0, 1)),
			ExpectChannelMessage([0xc3, 0x01]),
			ExpectChannelMessage([0xc3, 0x72]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes(SysCommonMultiByte.slice(1)),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			MixerWriteMidiBytes([0x05]),
			MixerWriteMidiBytes([0xb1, 0x33, 0x77]),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
		])
	})

	test('multiple data bytes, terminated by system common', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb5, 0x03, 0x27]),
			MixerWriteMidiBytes(SysCommonMultiByte),
			ExpectChannelMessage([0xb5, 0x03, 0x27]),
			MixerWriteMidiBytes([0x05]),
			MixerWriteMidiBytes([0xb1, 0x33, 0x77]),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
			ExpectNextMessageNotReady(),
		])
	})

	test('multiple data bytes, preempted by system common', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb5, ...SysCommonMultiByte]),
			MixerWriteMidiBytes([0x05]),
			MixerWriteMidiBytes([0xb1, 0x33]),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x77]),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
		])
	})

	test('multiple data bytes, interrupted by system common', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb7, 0x36, 0x65]),
			MixerWriteMidiBytes([0x52]),
			MixerWriteMidiBytes(SysCommonMultiByte.slice(0, 1)),
			ExpectChannelMessage([0xb7, 0x36, 0x65]),
			MixerWriteMidiBytes(SysCommonMultiByte.slice(1)),
			ExpectSystemCommonMessage(SysCommonMultiByte),
			MixerWriteMidiBytes([0x05]),
			MixerWriteMidiBytes([0x06]),
			MixerWriteMidiBytes([0xb1, 0x33, 0x77]),
			ExpectChannelMessage([0xb1, 0x33, 0x77]),
			ExpectNextMessageNotReady(),
		])
	})
})
