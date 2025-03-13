import { describe, test } from '@jest/globals'
import { TestMixerCommandParsing } from './mixer-command-parsing.js'
import {
	ExpectNextCommandReadiness,
	ExpectPanLevelMessage,
	ReceiveChannelMessage,
	ReceiveSystemCommonMessage,
} from './interactions.js'
import { PanLevel } from './commands.js'
import { SysCommonMultiByte, SysCommonSingleByte } from '../../bytes.js'

describe('pan/balance level commands', () => {
	test('pan/balance', async () => {
		return TestMixerCommandParsing(7, [
			// Ip37 in Aux10
			ReceiveChannelMessage([0xb7, 0x63, 0x53]),
			ReceiveChannelMessage([0xb7, 0x62, 0x7d]),
			// Channel 1, C-1, Note on (DAW channel, i.e. 0 = one more than 7)
			ReceiveChannelMessage([0xc0, 0x00, 0x7f]),
			ReceiveChannelMessage([0xb7, 0x06, 0x00]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb7, 0x26, 0x00]),
			ReceiveSystemCommonMessage(SysCommonSingleByte),
			ExpectPanLevelMessage(0x53, 0x7d, 0x00, 0x00),
			// abortive message, discarded
			ReceiveChannelMessage([0xb7, 0x63, 0x55]),
			// Group 4 in Aux2, CTR
			ReceiveChannelMessage([0xb7, 0x63, 0x55]),
			ReceiveChannelMessage([0xb7, 0x62, 0x29]),
			ReceiveSystemCommonMessage(SysCommonMultiByte),
			ReceiveChannelMessage([0xb7, 0x06, 0x3f]),
			ExpectNextCommandReadiness(false),
			ReceiveChannelMessage([0xb7, 0x26, 0x7f]),
			ExpectNextCommandReadiness(true),
			ExpectPanLevelMessage(0x55, 0x29, 0x3f, 0x7f),
			ExpectNextCommandReadiness(false),
			// LR in Mtx1, L30%
			...PanLevel(7, 0x5e, 0x24, 0x2c, 0x65).map(ReceiveChannelMessage),
			ExpectNextCommandReadiness(true),
			ExpectPanLevelMessage(0x5e, 0x24, 0x2c, 0x65),
		])
	})
})
