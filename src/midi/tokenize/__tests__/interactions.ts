import { prettyByte, prettyBytes } from '../../../utils/pretty.js'

type MixerWriteMidiBytes = {
	readonly type: 'mixer-write-midi-bytes'
	readonly bytes: Uint8Array
}

type NextMessageNotReady = {
	readonly type: 'next-message-not-ready'
}

type ExpectChannel = {
	readonly type: 'expect-channel-message'
	readonly message: readonly number[]
}

type ExpectSystemCommon = {
	readonly type: 'expect-system-common'
	readonly message: readonly number[]
}

type ExpectSystemRealTime = {
	readonly type: 'expect-system-real-time'
	readonly message: number
}

type ExpectSystemExclusive = {
	readonly type: 'expect-system-exclusive'
	readonly message: readonly number[]
}

type MixerCloseSocket = {
	readonly type: 'mixer-close-socket'
}

export type Interaction =
	| MixerWriteMidiBytes
	| NextMessageNotReady
	| ExpectChannel
	| ExpectSystemCommon
	| ExpectSystemRealTime
	| ExpectSystemExclusive
	| MixerCloseSocket

/**
 * Have the "mixer" write the given MIDI bytes into its socket, to (eventually)
 * be passed to the tokenizer.
 */
export function MixerWriteMidiBytes(bytes: readonly number[]): MixerWriteMidiBytes {
	return { type: 'mixer-write-midi-bytes', bytes: new Uint8Array(bytes) }
}

/**
 * Expect that no tokenized MIDI message is presently ready to be examined
 * because the MIDI bytes scanned since the last specific MIDI message was
 * expected don't constitute a complete MIDI message.
 */
export function ExpectNextMessageNotReady(): NextMessageNotReady {
	// Unlike in mixer command parsing, we can only expect message-not-ready,
	// not message-ready.  Tokenizing acts upon a TCP socket, and mixer replies
	// only wait for the write to have completed from the point of view of the
	// socket *writer*, not the socket reader.  We're at the whims of the OS TCP
	// stack as to when the sent data is actually ready.
	//
	// If you want to expect the next message is ready, expect it directly.
	return { type: 'next-message-not-ready' }
}

/** Expect a MIDI channel message has been tokenized. */
export function ExpectChannelMessage(message: readonly number[]): ExpectChannel {
	if (message.length === 0) {
		throw new Error('forbidden zero-length message')
	}
	const first = message[0]
	if ((first & 0x80) === 0 || (first & 0x80) === 0xf0) {
		throw new Error(`bad status byte at start of channel message ${prettyBytes(message)}`)
	}

	return { type: 'expect-channel-message', message }
}

/** Expect a MIDI system common message has been tokenized. */
export function ExpectSystemCommonMessage(message: readonly number[]): ExpectSystemCommon {
	let dataBytesLen
	switch (message[0]) {
		case 0xf1:
			dataBytesLen = 1
			break
		case 0xf2:
			dataBytesLen = 2
			break
		case 0xf3:
			dataBytesLen = 1
			break
		case 0xf6:
		case 0xf7:
			dataBytesLen = 0
			break
		default:
			throw new Error(`system common message ${prettyBytes(message)} begins with a bad status byte`)
	}
	if (message.length !== dataBytesLen + 1) {
		throw new Error(`system common message ${prettyBytes(message)} length is incorrect for its status byte`)
	}

	return { type: 'expect-system-common', message }
}

/** Expect a single-byte system real time message has been tokenized. */
export function ExpectSystemRealTimeMessage(message: number): ExpectSystemRealTime {
	if (!(0xf8 <= message && message <= 0xff)) {
		throw new Error(`invalid system real time message ${prettyByte(message)}`)
	}
	return { type: 'expect-system-real-time', message }
}

/**
 * Expect a system exclusive message has been tokenized.  (The expected message
 * will be normalized to have the standard system exclusive message end byte.)
 */
export function ExpectSystemExclusiveMessage(message: readonly number[]): ExpectSystemExclusive {
	if (message.length < 2) {
		throw new Error('system exclusive message too short')
	}
	if (message[0] !== 0xf0) {
		throw new Error('system exclusive must begin with 0xF0')
	}
	if (message[message.length - 1] !== 0xf7) {
		throw new Error('system exclusive must end with 0xF7')
	}
	return { type: 'expect-system-exclusive', message }
}

/**
 * Act as if the mixer closed the socket it uses to send MIDI bytes to the
 * tokenizer, causing the tokenizer to abruptly stop receiving data in
 * ungraceful fashion.
 */
export function CloseMixerSocket(): MixerCloseSocket {
	return { type: 'mixer-close-socket' }
}
