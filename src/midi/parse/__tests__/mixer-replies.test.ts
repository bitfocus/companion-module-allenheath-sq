import { describe, test } from '@jest/globals'
import { TestMixerCommandParsing } from './mixer-command-parsing.js'
import {
	ExpectNextCommandReadiness,
	ExpectMuteMessage,
	ExpectSceneMessage,
	ReceiveChannelMessage,
} from './interactions.js'
import { MuteOff, MuteOn, SceneCommand } from './commands.js'

describe('reply processing', () => {
	test('basic reply series', async () => {
		return TestMixerCommandParsing(0, [
			ExpectNextCommandReadiness(false),
			...SceneCommand(0, 129).map(ReceiveChannelMessage),
			ExpectSceneMessage((1 << 7) + 1),
			// Mute on, Ip48
			...MuteOn(0, 0x00, 0x2f).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x2f, 0x01),
			// Mute off, Aux1
			...MuteOff(0, 0x00, 0x45).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x45, 0x00),
		])
	})

	test('basic replies with extraneous CN 00 after scene change', async () => {
		return TestMixerCommandParsing(2, [
			// Scene change
			ReceiveChannelMessage([0xb2, 0x00, 0x01]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xc2, 0x01]),
			ExpectNextCommandReadiness(true),
			ExpectSceneMessage((1 << 7) + 1),
			ReceiveChannelMessage([0xc2, 0x00]), // extraneous but sent by SQ-5
			ExpectNextCommandReadiness(false),
			// Mute on, Ip48
			...MuteOn(2, 0x00, 0x2f).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x2f, 0x01),
			// Mute off, Aux1
			ReceiveChannelMessage([0xb2, 0x63, 0x00]),
			ReceiveChannelMessage([0xb2, 0x62, 0x45]),
			ReceiveChannelMessage([0xb2, 0x06, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb2, 0x26, 0x00]),
			ExpectNextCommandReadiness(true),
			ExpectMuteMessage(0x00, 0x45, 0x00),
		])
	})

	test('basic replies with messages in different channels interspersed', async () => {
		return TestMixerCommandParsing(0, [
			// Scene change
			ReceiveChannelMessage([0xb0, 0x00, 0x01]),
			ReceiveChannelMessage([0x97, 0x3c, 0x00]), // Channel 1, C-4, Note On (velocity 0)
			ReceiveChannelMessage([0xc0, 0x01]),
			ExpectSceneMessage((1 << 7) + 1),
			// Mute on, Ip48
			ReceiveChannelMessage([0xb0, 0x63, 0x00]),
			ReceiveChannelMessage([0xb0, 0x62, 0x2f]),
			ReceiveChannelMessage([0x97, 0x00, 0x7f]), // Channel 7, C-1, Note On
			ReceiveChannelMessage([0xb0, 0x06, 0x00]),
			ReceiveChannelMessage([0xb0, 0x26, 0x01]),
			ExpectMuteMessage(0x00, 0x2f, 0x01),
			// Mute off, Aux1
			ReceiveChannelMessage([0xb0, 0x63, 0x00]),
			ReceiveChannelMessage([0xb0, 0x62, 0x45]),
			ReceiveChannelMessage([0xb0, 0x06, 0x00]),
			ReceiveChannelMessage([0xb0, 0x26, 0x00]),
			ExpectMuteMessage(0x00, 0x45, 0x00),
		])
	})
})
