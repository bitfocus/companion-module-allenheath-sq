import { describe, test } from '@jest/globals'
import { TestMixerCommandParsing } from './mixer-command-parsing.js'
import { ExpectNextMessageReadiness, ExpectSceneMessage, ReceiveChannelMessage } from './interactions.js'

describe('scene changes', () => {
	test('basic scene', async () => {
		return TestMixerCommandParsing(0, [
			ExpectNextMessageReadiness(false),
			ReceiveChannelMessage([0xb0, 0x00, 0x00]),
			ExpectNextMessageReadiness(false),
			ReceiveChannelMessage([0xc0, 0x05]),
			ExpectNextMessageReadiness(true),
			ExpectSceneMessage(5),
			ExpectNextMessageReadiness(false),
		])
	})

	test('basic scene with extraneous CN 00 after scene change', async () => {
		return TestMixerCommandParsing(6, [
			ExpectNextMessageReadiness(false),
			ReceiveChannelMessage([0xb6, 0x00, 0x00]),
			ExpectNextMessageReadiness(false),
			ReceiveChannelMessage([0xc6, 0x05]),
			ExpectNextMessageReadiness(true),
			ExpectSceneMessage(5),
			ReceiveChannelMessage([0xc6, 0x00]), // extraneous but sent by SQ-5
			ExpectNextMessageReadiness(false),
			// in different channel, so should be ignored
			ReceiveChannelMessage([0xb2, 0x00, 0x00]),
			ReceiveChannelMessage([0xc2, 0x03]),
			ExpectNextMessageReadiness(false),
		])
	})
})
