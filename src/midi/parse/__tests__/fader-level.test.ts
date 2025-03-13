import { describe, test } from '@jest/globals'
import { TestMixerCommandParsing } from './mixer-command-parsing.js'
import {
	ExpectNextCommandReadiness,
	ReceiveChannelMessage,
	ExpectFaderLevelMessage,
	ReceiveSystemCommonMessage,
} from './interactions.js'
import { FaderLevel } from './commands.js'
import { SysCommonMultiByte } from '../../bytes.js'

describe('fader level', () => {
	test('various fader level tests', async () => {
		return TestMixerCommandParsing(5, [
			// Ip23 in Aux3
			ReceiveChannelMessage([0xb5, 0x63, 0x42]),
			ReceiveChannelMessage([0xb5, 0x62, 0x4e]),
			// Channel 6, C-1, Note on (DAW channel, i.e. 6 = one more than 5)
			ReceiveChannelMessage([0xc6, 0x00, 0x7f]),
			ReceiveChannelMessage([0xb5, 0x06, 0x7d]),
			ExpectNextCommandReadiness(false),
			ReceiveSystemCommonMessage(SysCommonMultiByte),
			ReceiveChannelMessage([0xb5, 0x26, 0x00]),
			ExpectNextCommandReadiness(true),
			ExpectFaderLevelMessage(0x42, 0x4e, 0x7d, 0x00),
			// First three NRPN messages should be discarded
			ReceiveChannelMessage([0xb5, 0x63, 0x42]),
			ReceiveChannelMessage([0xb5, 0x62, 0x4e]),
			ReceiveChannelMessage([0xb5, 0x06, 0x00]),
			ExpectNextCommandReadiness(false),
			// Group 1 in Aux3
			ReceiveChannelMessage([0xb5, 0x63, 0x45]),
			ReceiveChannelMessage([0xb5, 0x62, 0x06]),
			ReceiveChannelMessage([0xb5, 0x06, 0x00]),
			ReceiveChannelMessage([0xb5, 0x26, 0x00]),
			ExpectNextCommandReadiness(true),
			ExpectFaderLevelMessage(0x45, 0x06, 0x00, 0x00),
			ExpectNextCommandReadiness(false),
			// Grp3 in Aux4, 0dB (linear taper)
			...FaderLevel(5, 0x45, 0x1f, 0x76, 0x5c).map(ReceiveChannelMessage),
			ExpectNextCommandReadiness(true),
			ExpectFaderLevelMessage(0x45, 0x1f, 0x76, 0x5c),
		])
	})
})
