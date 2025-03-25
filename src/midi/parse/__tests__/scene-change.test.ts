import { describe, test } from 'vitest'
import { TestParsing } from './test-parsing.js'
import {
	ExpectNextCommandReadiness,
	ExpectSceneMessage,
	ReceiveChannelMessage,
	ReceiveSystemRealTimeMessage,
} from './interactions.js'
import { SysCommonTuneRequest } from '../../bytes.js'

describe('scene changes', () => {
	test('basic scene', async () => {
		return TestParsing(0, [
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb0, 0x00, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xc0, 0x05]),
			ExpectNextCommandReadiness(true),
			ExpectSceneMessage(5),
			ExpectNextCommandReadiness(false),
		])
	})

	test('basic scene with extraneous CN 00 after scene change', async () => {
		return TestParsing(6, [
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb6, 0x00, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveSystemRealTimeMessage(SysCommonTuneRequest),
			ReceiveChannelMessage([0xc6, 0x05]),
			ExpectNextCommandReadiness(true),
			ExpectSceneMessage(5),
			ReceiveChannelMessage([0xc6, 0x00]), // extraneous but sent by SQ-5
			ExpectNextCommandReadiness(false),
			// in different channel, so should be ignored
			ReceiveChannelMessage([0xb2, 0x00, 0x00]),
			ReceiveChannelMessage([0xc2, 0x03]),
			ExpectNextCommandReadiness(false),
		])
	})
})
