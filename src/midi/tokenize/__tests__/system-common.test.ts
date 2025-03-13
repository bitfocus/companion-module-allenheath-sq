import { describe, test } from '@jest/globals'
import {
	SysCommonSongPosition,
	SysCommonSongSelect,
	SysCommonTimeCodeQuarterFrame,
	SysExEnd,
	SysRTContinue,
} from '../../bytes.js'
import {
	ExpectChannelMessage,
	ExpectNextMessageNotReady,
	ExpectSystemCommonMessage,
	ExpectSystemRealTimeMessage,
	MixerWriteMidiBytes,
} from './interactions.js'
import { TestMidiTokenizing } from './midi-tokenizing.js'

describe('system common', () => {
	test('time code quarter frame', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb2, 0x00]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame, 0x15, 0x24, 0x33, 0x17]),
			ExpectSystemCommonMessage([SysCommonTimeCodeQuarterFrame, 0x15]),
			ExpectNextMessageNotReady(), // no running status
			MixerWriteMidiBytes([SysCommonSongPosition, 0x45]),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame, 0x72]),
			ExpectSystemCommonMessage([SysCommonTimeCodeQuarterFrame, 0x72]),
			ExpectNextMessageNotReady(),
		])
	})

	test('time code quarter frame (interleaved system real time)', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb2, 0x00]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame, 0x15, 0x24, 0x33, 0x17]), // no running status
			MixerWriteMidiBytes([SysRTContinue]),
			ExpectSystemCommonMessage([SysCommonTimeCodeQuarterFrame, 0x15]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonSongPosition, 0x45]),
			MixerWriteMidiBytes([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame, 0x72]),
			ExpectSystemCommonMessage([SysCommonTimeCodeQuarterFrame, 0x72]),
			ExpectNextMessageNotReady(),
		])
	})

	test('song position', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb2, 0x00]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonTimeCodeQuarterFrame]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([
				SysCommonSongPosition,
				SysRTContinue,
				0x15,
				SysRTContinue,
				SysRTContinue,
				0x24,
				SysRTContinue,
				0x33,
				0x17,
			]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectSystemCommonMessage([SysCommonSongPosition, 0x15, 0x24]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(), // no running status
			MixerWriteMidiBytes([SysCommonSongPosition, 0x45]),
			MixerWriteMidiBytes([SysCommonSongPosition, 0x72, 0x03]),
			ExpectSystemCommonMessage([SysCommonSongPosition, 0x72, 0x03]),
			ExpectNextMessageNotReady(),
		])
	})

	test('song select', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb2, 0x00]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonSongPosition]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonSongSelect, 0x15, 0x24, 0x33, 0x17]),
			ExpectSystemCommonMessage([SysCommonSongSelect, 0x15]),
			ExpectNextMessageNotReady(), // no running status
			MixerWriteMidiBytes([SysCommonSongPosition, 0x45]),
			MixerWriteMidiBytes([SysCommonSongSelect, 0x72]),
			ExpectSystemCommonMessage([SysCommonSongSelect, 0x72]),
			ExpectNextMessageNotReady(),
		])
	})

	test('song select (interleaved system real time)', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb2, 0x00]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonSongPosition]),
			MixerWriteMidiBytes([SysRTContinue]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([SysCommonSongSelect, SysRTContinue, SysRTContinue, 0x62, SysRTContinue, 0x24, 0x33, 0x17]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectSystemCommonMessage([SysCommonSongSelect, 0x62]),
			ExpectSystemRealTimeMessage(SysRTContinue),
			ExpectNextMessageNotReady(), // no running status
			MixerWriteMidiBytes([SysCommonSongPosition, 0x45]),
			MixerWriteMidiBytes([SysCommonSongSelect, 0x72]),
			ExpectSystemCommonMessage([SysCommonSongSelect, 0x72]),
			ExpectNextMessageNotReady(),
		])
	})

	test('undefined system common message 0xF4 in running status', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb0, 0x12, 0x34]),
			MixerWriteMidiBytes([0xf4]),
			MixerWriteMidiBytes([0xc0, 0x03]),
			ExpectChannelMessage([0xb0, 0x12, 0x34]),
			ExpectChannelMessage([0xc0, 0x03]),
		])
	})

	test('undefined system common message 0xF4 before status', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xf4]),
			MixerWriteMidiBytes([0xb0, 0x03, 0x02]),
			ExpectChannelMessage([0xb0, 0x03, 0x02]),
		])
	})

	test('undefined system common message 0xF4 in system common data', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([SysCommonSongPosition, 0x03]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0xf4]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x03, 0x01, 0xa1, 0x57, 0x3a, 0x1c]),
			ExpectChannelMessage([0xa1, 0x57, 0x3a]),
		])
	})

	test('undefined system common message 0xF5 in running status', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xb0, 0x12, 0x34]),
			MixerWriteMidiBytes([0xf4]),
			MixerWriteMidiBytes([0xc0, 0x03]),
			ExpectChannelMessage([0xb0, 0x12, 0x34]),
			ExpectChannelMessage([0xc0, 0x03]),
		])
	})

	test('undefined system common message 0xF5 before status', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([0xf5]),
			MixerWriteMidiBytes([0xb0, 0x03, 0x02]),
			ExpectChannelMessage([0xb0, 0x03, 0x02]),
		])
	})

	test('undefined system common message 0xF5 in system common data', async () => {
		return TestMidiTokenizing([
			MixerWriteMidiBytes([SysCommonSongPosition, 0x03]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0xf5]),
			ExpectNextMessageNotReady(),
			MixerWriteMidiBytes([0x03, 0x01, 0xa1, 0x57, 0x3a, 0x1c]),
			ExpectChannelMessage([0xa1, 0x57, 0x3a]),
		])
	})

	test('EOX as its own system common message', async () => {
		// Unlike 0xF4-0xF5, we interpret MIDI to require that this be treated
		// as a one-byte system common message.  (See also comments in the
		// implementation.)
		return TestMidiTokenizing([
			MixerWriteMidiBytes([SysExEnd]),
			ExpectSystemCommonMessage([SysExEnd]),
			MixerWriteMidiBytes([0x12, 0x34, 0x56, SysExEnd]),
			ExpectSystemCommonMessage([SysExEnd]),
			MixerWriteMidiBytes([0xb0, 0x12, 0x34, 0x56, SysExEnd, 0x78, 0xd3, 0x22]),
			ExpectChannelMessage([0xb0, 0x12, 0x34]),
			ExpectSystemCommonMessage([SysExEnd]),
			ExpectChannelMessage([0xd3, 0x22]),
			MixerWriteMidiBytes([SysCommonSongPosition, 0x12, SysExEnd, 0x86, 0x66, 0x33]),
			ExpectSystemCommonMessage([SysExEnd]),
			ExpectChannelMessage([0x86, 0x66, 0x33]),
		])
	})
})
