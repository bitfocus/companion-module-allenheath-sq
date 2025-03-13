import { describe, test } from '@jest/globals'
import { TestMixerCommandParsing } from './mixer-command-parsing.js'
import {
	ExpectNextCommandReadiness,
	ExpectMuteMessage,
	ReceiveChannelMessage,
	ReceiveSystemRealTimeMessage,
	ReceiveSystemExclusiveMessage,
} from './interactions.js'
import { MuteOff, MuteOn } from './commands.js'
import { SysExEnd, SysExMessageShortest, SysExStart, SysRTContinue, SysRTTimingClock } from '../../bytes.js'

describe('mute commands', () => {
	test('mute on', async () => {
		return TestMixerCommandParsing(0, [
			// Mute on, Ip48
			ReceiveChannelMessage([0xb0, 0x63, 0x00]),
			ReceiveChannelMessage([0xb0, 0x62, 0x48]),
			// Channel 2, C-1, Note on (DAW channel, i.e. 2 = one more than 1)
			ReceiveChannelMessage([0xc1, 0x00, 0x7f]),
			ReceiveSystemRealTimeMessage(SysRTTimingClock),
			ReceiveChannelMessage([0xb0, 0x06, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb0, 0x26, 0x01]),
			ExpectMuteMessage(0x00, 0x48, 0x01),
			// abortive message, discarded
			ReceiveChannelMessage([0xb0, 0x63, 0x02]),
			// Mute off, DCA8
			ReceiveChannelMessage([0xb0, 0x63, 0x02]),
			ReceiveSystemRealTimeMessage(SysRTContinue),
			ReceiveChannelMessage([0xb0, 0x62, 0x07]),
			ReceiveChannelMessage([0xb0, 0x06, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb0, 0x26, 0x00]),
			ExpectNextCommandReadiness(true),
			ReceiveSystemExclusiveMessage(SysExMessageShortest),
			ExpectMuteMessage(0x02, 0x07, 0x00),
			// Mute off, Aux3
			...MuteOff(0, 0x00, 0x47).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x47, 0x00),
		])
	})

	test('mute off', async () => {
		return TestMixerCommandParsing(3, [
			// Mute on, Aux4
			ReceiveChannelMessage([0xb3, 0x63, 0x00]),
			ReceiveChannelMessage([0xb3, 0x62, 0x2f]),
			// Channel 1, C-1, Note on (DAW channel, i.e. 1 = one more than 0)
			ReceiveChannelMessage([0xc4, 0x00, 0x7f]),
			ReceiveChannelMessage([0xb3, 0x06, 0x00]),
			ReceiveSystemExclusiveMessage([SysExStart, SysExEnd]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb3, 0x26, 0x01]),
			ExpectMuteMessage(0x00, 0x2f, 0x01),
			// abortive message, discarded
			ReceiveChannelMessage([0xb0, 0x63, 0x02]),
			ReceiveChannelMessage([0xb0, 0x62, 0x07]),
			// Mute off, Ip48
			ReceiveChannelMessage([0xb3, 0x63, 0x00]),
			ReceiveSystemExclusiveMessage([SysExStart, 0x33, SysExEnd]),
			ReceiveChannelMessage([0xb3, 0x62, 0x2f]),
			ReceiveSystemRealTimeMessage(SysRTTimingClock),
			ReceiveChannelMessage([0xb3, 0x06, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb3, 0x26, 0x00]),
			ExpectMuteMessage(0x00, 0x2f, 0x00),
			// Mute on, Aux1
			...MuteOn(3, 0x00, 0x45).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x45, 0x01),
		])
	})
})
