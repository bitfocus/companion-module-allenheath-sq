import { prettyBytes } from '../../../utils/pretty.js'

type MixerReplyBytes = {
	readonly type: 'mixer-reply'
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
	| MixerReplyBytes
	| NextMessageNotReady
	| ExpectChannel
	| ExpectSystemCommon
	| ExpectSystemRealTime
	| ExpectSystemExclusive
	| MixerCloseSocket

export function MixerReply(bytes: readonly number[]): MixerReplyBytes {
	return { type: 'mixer-reply', bytes: new Uint8Array(bytes) }
}

export function ExpectNextMessageNotReady(): NextMessageNotReady {
	// Unlike in mixer command parsing, we can only expect message-not-ready,
	// not message-ready.  Tokenizing acts upon a TCP socket, and mixer replies
	// only wait for the write to have ycompleted from the point of view of the
	// socket *writer*, not the socket reader.  We're at the whims of the OS TCP
	// stack as to when the sent data is actually ready.
	//
	// If you want to expect the next message is ready, expect it directly.
	return { type: 'next-message-not-ready' }
}

export function ExpectChannelMessage(message: readonly number[]): ExpectChannel {
	if (message.length === 0) {
		throw new Error('forbidden zero-length message')
	}
	if ((message[0] & 0x80) === 0) {
		throw new Error(`Non-status byte at start of message ${prettyBytes(message)}`)
	}

	return { type: 'expect-channel-message', message }
}

export function ExpectSystemCommonMessage(message: readonly number[]): ExpectSystemCommon {
	return { type: 'expect-system-common', message }
}

export function ExpectSystemRealTimeMessage(message: number): ExpectSystemRealTime {
	return { type: 'expect-system-real-time', message }
}

export function ExpectSystemExclusiveMessage(message: readonly number[]): ExpectSystemExclusive {
	if (message.length < 2) {
		throw new Error('System exclusive message too short')
	}
	if (message[0] !== 0xf0) {
		throw new Error('System exclusive must begin with 0xF0')
	}
	if (message[message.length - 1] !== 0xf7) {
		throw new Error('System exclusive must end with 0xF7')
	}
	return { type: 'expect-system-exclusive', message }
}

export function CloseMixerSocket(): MixerCloseSocket {
	return { type: 'mixer-close-socket' }
}
