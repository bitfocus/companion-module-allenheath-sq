import { MixerChannelParser } from './mixer-channel-parse.js'
import { prettyByte, prettyBytes } from '../../utils/pretty.js'
import { Tokenizer } from '../tokenize/tokenize.js'

/**
 * An SQ mixer message parser of all MIDI messages (of all types and in all
 * channels) sent by the mixer to this module.
 */
export class MixerMessageParser {
	#tokenizer: Tokenizer

	constructor(
		midiChannel: number,
		verboseLog: (msg: string) => void,
		tokenizer: Tokenizer,
		mixerChannelParser: MixerChannelParser,
	) {
		this.#tokenizer = tokenizer

		tokenizer.on('channel_message', (message: number[]) => {
			const channel = message[0] & 0xf
			if (channel === midiChannel) {
				mixerChannelParser.handleMessage(message)
			} else {
				// If/when mixer MIDI strip commands are supported, they will be
				// found when `channel === ((midiChannel + 1) % 16)`.  For now
				// they're simply ignored like all non-`midiChannel` MIDI
				// messages.
				verboseLog(`Ignoring Ch ${channel} message ${prettyBytes(message)}`)
			}
		})
		tokenizer.on('system_common', (message: number[]) => {
			verboseLog(`Discarding system common message ${prettyBytes(message)}`)
		})
		tokenizer.on('system_realtime', (b: number) => {
			verboseLog(`Discarding system real time message ${prettyByte(b)}`)
		})
		tokenizer.on('system_exclusive', (message: number[]) => {
			// Buttons in the Utility>General>MIDI UI send these System Exclusive
			// messages:
			//
			//     Back (⏪):     F0 7F 7F 06 05 F7
			//     Stop (⏹):     F0 7F 7F 06 01 F7
			//     Play (⏵):     F0 7F 7F 06 02 F7
			//     Pause (⏸):    F0 7F 7F 06 09 F7
			//     Rec/Arm (⏺):  F0 7F 7F 06 06 F7
			//     Fwd (⏩):      F0 7F 7F 06 04 F7
			//
			// It's unclear whether this module can reasonably expose these messages
			// to users.  But it seems worth noting them here as a possible avenue
			// for future improvements.
			verboseLog(`Discarding system exclusive message ${prettyBytes(message)}`)
		})
	}

	async run(): Promise<void> {
		return this.#tokenizer.run()
	}
}
