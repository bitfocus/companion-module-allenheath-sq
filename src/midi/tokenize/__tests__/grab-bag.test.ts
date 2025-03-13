import { describe, test } from '@jest/globals'
import { TestMidiTokenizing } from './midi-tokenizing.js'
import { SysExStart, SysExEnd, SysRTTimingClock, SysCommonSongPosMessage, SysCommonSongPosition } from '../../bytes.js'
import {
	ExpectChannelMessage,
	ExpectSystemCommonMessage,
	ExpectSystemExclusiveMessage,
	ExpectSystemRealTimeMessage,
	MixerReply,
} from './interactions.js'

describe('parse MIDI data', () => {
	test('single CC', async () => {
		return TestMidiTokenizing([
			// (comment to force to separate lines)
			MixerReply([0xb0, 0x00, 0x0f]),
			ExpectChannelMessage([0xb0, 0x00, 0x0f]),
		])
	})

	test('two CCs', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb0, 0x00, 0x0f]),
			ExpectChannelMessage([0xb0, 0x00, 0x0f]),
			MixerReply([0xb7, 0x22, 0x7f]),
			ExpectChannelMessage([0xb7, 0x22, 0x7f]),
		])
	})

	test('scene change', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb3, 0x00, 0x01, 0xc3]),
			ExpectChannelMessage([0xb3, 0x00, 0x01]),
			MixerReply([0x03]),
			ExpectChannelMessage([0xc3, 0x03]),
		])
	})

	test('scene change broken up by system common', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb7, 0x00, 0x01, ...SysCommonSongPosMessage, 0xc7]),
			ExpectChannelMessage([0xb7, 0x00, 0x01]),
			ExpectSystemCommonMessage(SysCommonSongPosMessage),
			MixerReply([0x03]),
			ExpectChannelMessage([0xc7, 0x03]),
		])
	})

	test('scene change broken up by incomplete system common', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb7, 0x00, 0x01, SysCommonSongPosition, 0x03, 0xc7]),
			ExpectChannelMessage([0xb7, 0x00, 0x01]),
			MixerReply([0x03]),
			ExpectChannelMessage([0xc7, 0x03]),
		])
	})

	test('scene change w/embedded system real time', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb6, 0x00, SysRTTimingClock, 0x02]),
			ExpectSystemRealTimeMessage(SysRTTimingClock),
			ExpectChannelMessage([0xb6, 0x00, 0x02]),
			MixerReply([0xc6, 0x03]),
			ExpectChannelMessage([0xc6, 0x03]),
		])
	})

	test('scene change (as sent by SQ5 with extra data byte, generating an extra message)', async () => {
		return TestMidiTokenizing([
			MixerReply([0xb2, 0x00, 0x01, 0xc2, 0x00, 0x01]),
			ExpectChannelMessage([0xb2, 0x00, 0x01]),
			ExpectChannelMessage([0xc2, 0x00]),
			ExpectChannelMessage([0xc2, 0x01]),
		])
	})

	test('sysex then CC', async () => {
		return TestMidiTokenizing([
			MixerReply([SysExStart, 0x00, SysExEnd]),
			MixerReply([0xb2, 0x00, 0x01]),
			ExpectSystemExclusiveMessage([SysExStart, 0x00, SysExEnd]),
			ExpectChannelMessage([0xb2, 0x00, 0x01]),
		])
	})

	test("sysex terminated by status doesn't start that status", async () => {
		return TestMidiTokenizing([
			MixerReply([0xb0, 0x00]), // incomplete, ignored
			MixerReply([0xb1, 0x12, 0x34]), // new CC
			MixerReply([0x35]), // running status...
			MixerReply([SysExStart, 0x00, 0xc0]), // but preempted by sysex ended by C0
			MixerReply([0xc3, 0x03, 0x00]), // two PCs
			ExpectChannelMessage([0xb1, 0x12, 0x34]),
			ExpectSystemExclusiveMessage([SysExStart, 0x00, SysExEnd]),
			ExpectChannelMessage([0xc3, 0x03]),
			ExpectChannelMessage([0xc3, 0x00]),
		])
	})
})
