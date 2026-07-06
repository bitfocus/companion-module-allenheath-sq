import { describe, test } from 'vitest'
import { TestParsing } from './test-parsing.js'
import {
	ExpectNextCommandReadiness,
	ExpectMuteMessage,
	ExpectSceneMessage,
	ReceiveChannelMessage,
} from './interactions.js'
import { MuteOff, MuteOn, SceneCommand } from './commands.js'

describe('reply processing', () => {
	test('basic reply series', async () => {
		return TestParsing(1, [
			ExpectNextCommandReadiness(false),
			...SceneCommand(1, 130).map(ReceiveChannelMessage),
			ExpectSceneMessage(130),
			// Mute on, Ip48
			...MuteOn(1, 0x00, 0x2f).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x2f, 0x01),
			// Mute off, Aux1
			...MuteOff(0, 0x00, 0x45).map(ReceiveChannelMessage),
			ExpectMuteMessage(0x00, 0x45, 0x00),
		])
	})

	test('basic replies with extraneous CN 00 after scene change', async () => {
		return TestParsing(3, [
			// Scene change
			ReceiveChannelMessage([0xb2, 0x00, 0x01]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xc2, 0x01]),
			ExpectNextCommandReadiness(true),
			ExpectSceneMessage(130),

			// We are now past a completed SQ command and *should* be at start of a
			// new one.  `CN xx` is not the start of a documented SQ command, so in
			// principle the SQ mixer shouldn't send it here.
			//
			// Nevertheless, some SQ-5 firmware (possibly 1.5.* but not 1.6.*) sends
			// `CN 00` after every valid scene-change command (i.e. it sends the full
			// MIDI sequence `BN xx xx CN yy 00` to change scene, with `CN yy 00`
			// equivalent to `CN yy CN 00` per the MIDI running status optimization).
			// So we must ensure we ignore this trailing extraneous `CN 00` message if
			// we receive it.
			ReceiveChannelMessage([0xc2, 0x00]),
			ExpectNextCommandReadiness(false),

			// Mute on, Ip48
			...MuteOn(3, 0x00, 0x2f).map(ReceiveChannelMessage),
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
		return TestParsing(1, [
			// Scene change
			ReceiveChannelMessage([0xb0, 0x00, 0x01]),
			ReceiveChannelMessage([0x97, 0x3c, 0x00]), // Channel 1, C-4, Note On (velocity 0)
			ReceiveChannelMessage([0xc0, 0x01]),
			ExpectSceneMessage(130),
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
