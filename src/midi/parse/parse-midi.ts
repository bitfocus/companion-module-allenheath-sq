import type { ChannelParser } from './channel-parser.js'
import { prettyByte, prettyBytes } from '../../utils/pretty.js'
import type { Tokenizer } from '../tokenize/tokenizer.js'

/**
 * An SQ mixer message parser of all MIDI messages emitted by a MIDI tokenizer,
 * that forwards along messages in the mixer MIDI channel to a channel-specific
 * mixer channel parser.
 */

/**
 * Given a MIDI tokenizer and the channel in which mixer commands will
 * appear, run the tokenizer until tokenizing completes, forwarding all
 * tokenized MIDI Messages in the mixer channel for mixer command parsing.
 *
 * @param midiChannel
 *   The MIDI channel where mixer commands will appear.  (Messages in other
 *   MIDI channels are currently ignored.)
 * @param verboseLog
 *   A function that logs the supplied message when verbose logging is
 *   enabled.
 * @param tokenizer
 *   A MIDI message tokenizer that emits MIDI messages from an underlying
 *   raw source (such as bytes read from a socket).
 * @param mixerChannelParser
 *   A parser of MIDI messages in the `midiChannel` channel, that will be
 *   notified with each received MIDI message in that channel.
 */
export async function parseMidi(
	midiChannel: number,
	verboseLog: (msg: string) => void,
	tokenizer: Tokenizer,
	mixerChannelParser: ChannelParser,
): Promise<void> {
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

	return tokenizer.run()
}
