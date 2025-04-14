import { describe, test } from 'vitest'
import { PanLevel } from './commands.js'
import { ExpectPanLevelMessage, ReceiveChannelMessage } from './interactions.js'
import { TestParsing } from './test-parsing.js'

describe('output pan/balance mixer commands', () => {
	test('lr', async () => {
		return TestParsing(7, [
			// LR, L100%
			...PanLevel(0x7, 0x5f, 0x00, 0x00, 0x00).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x00, 0x00, 0x00),
			// LR, R100%
			...PanLevel(0x7, 0x5f, 0x00, 0x7f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x00, 0x7f, 0x7f),
			// LR, CTR
			...PanLevel(0x7, 0x5f, 0x00, 0x3f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x00, 0x3f, 0x7f),
		])
	})

	test('mix 1', async () => {
		return TestParsing(3, [
			// Mix 1, L100%
			...PanLevel(0x3, 0x5f, 0x01, 0x00, 0x00).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x01, 0x00, 0x00),
			// Mix 1, R100%
			...PanLevel(0x3, 0x5f, 0x01, 0x7f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x01, 0x7f, 0x7f),
			// Mix 1, CTR
			...PanLevel(0x3, 0x5f, 0x01, 0x3f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x01, 0x3f, 0x7f),
		])
	})
	test('mix 12', async () => {
		return TestParsing(9, [
			// Mix 12, L100%
			...PanLevel(0x9, 0x5f, 0x0c, 0x00, 0x00).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x0c, 0x00, 0x00),
			// Mix 12, R100%
			...PanLevel(0x9, 0x5f, 0x0c, 0x7f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x0c, 0x7f, 0x7f),
			// Mix 12, CTR
			...PanLevel(0x9, 0x5f, 0x0c, 0x3f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x0c, 0x3f, 0x7f),
		])
	})

	test('matrix 1', async () => {
		return TestParsing(13, [
			// Matrix 1, L100%
			...PanLevel(0xd, 0x5f, 0x11, 0x00, 0x00).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x11, 0x00, 0x00),
			// Matrix 1, R100%
			...PanLevel(0xd, 0x5f, 0x11, 0x7f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x11, 0x7f, 0x7f),
			// Matrix 1, CTR
			...PanLevel(0xd, 0x5f, 0x11, 0x3f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x11, 0x3f, 0x7f),
		])
	})
	test('matrix 3', async () => {
		return TestParsing(2, [
			// Matrix 3, L100%
			...PanLevel(0x2, 0x5f, 0x13, 0x00, 0x00).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x13, 0x00, 0x00),
			// Matrix 3, R100%
			...PanLevel(0x2, 0x5f, 0x13, 0x7f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x13, 0x7f, 0x7f),
			// Matrix 3, CTR
			...PanLevel(0x2, 0x5f, 0x13, 0x3f, 0x7f).map(ReceiveChannelMessage),
			ExpectPanLevelMessage(0x5f, 0x13, 0x3f, 0x7f),
		])
	})
})
