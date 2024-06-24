import type { InstanceBase, TCPHelper } from '@companion-module/base'
import { EventEmitter } from 'eventemitter3'
import { type SQInstanceConfig } from '../../config.js'
import { prettyBytes } from '../../utils/pretty.js'
import { SocketReader } from '../../utils/socket-reader.js'

export interface ParseInstance {
	log: InstanceBase<SQInstanceConfig>['log']
}

export interface MidiMessageEvents {
	/**
	 * MIDI channel messages starting with a byte with high bit set (but not
	 * equal to `0xF`, which denotes a system message) followed by a number of
	 * data bytes `0x00-0x7F` specified by the MIDI spec.
	 *
	 * Running statuses are silently normalized into non-running statuses.
	 */
	channel_message: [message: number[]]

	/**
	 * One-byte MIDI system real time messages, `0xF8-0xFF`.
	 */
	system_realtime: [message: number]

	/**
	 * MIDI system common messages starting with a byte `0xF1-0xF6` followed by
	 * a number of data bytes `0x00-0x7F` specified by the MIDI spec.
	 */
	system_common: [system_common_message: number[]]

	/**
	 * MIDI system exclusive messages starting with `0xF0` followed by zero or
	 * more data bytes `0x00-0x7F` terminated with `0xF7`.
	 *
	 * System exclusive messages that are terminated by a non-real time status
	 * other than `0xF7` are silently normalized to be terminated by `0xF7`.
	 */
	system_exclusive: [system_message: number[]]
}

/** A tokenizer of MIDI data that emits events for the MIDI messages read. */
export interface Tokenizer extends EventEmitter<MidiMessageEvents> {
	/** Run the tokenizer, resolving when there's no more data to tokenize. */
	run(): Promise<void>
}

/**
 * A MIDI channel message consisting of a byte in range `0x80-0xEF` and zero or
 * more data bytes in range `0x00-0x7F`.
 */
export type ChannelMessage = {
	readonly type: 'channel'
	message: number[]
}

/**
 * A MIDI system real time message consisting of a single byte in the range
 * `0xF8-0xFF`.
 */
export type SystemRealTimeMessage = {
	readonly type: 'system-real-time'
	message: number
}

/**
 * A MIDI system common message consisting of a byte in range `0xF1-0xF6` and
 * zero or more data bytes in range `0x00-0x7F`.
 */
export type SystemCommonMessage = {
	readonly type: 'system-common'
	message: number[]
}

/**
 * A MIDI system exclusive message consisting of a byte in range `0xF0`, zero or
 * more data bytes in range `0x00-0x7F`, and a byte `0xF7`.
 */
export type SystemExclusiveMessage = {
	readonly type: 'system-exclusive'
	message: number[]
}

/** All MIDI messages. */
export type MidiMessage = ChannelMessage | SystemRealTimeMessage | SystemCommonMessage | SystemExclusiveMessage

/**
 * A class for tokenizing incoming data to a socket as MIDI messages.  Attach
 * listeners for the various MIDI message types to `this` to handle tokens as
 * they're received.
 *
 * Note that tokenizing will silently normalize various MIDI edge cases: running
 * statuses will be exposed as non-running (i.e. every channel message will
 * always be prefixed by its status byte), and system exclusive messages
 * terminated not by `0xF7` but by some other status will be exposed as if they
 * were terminated by `0xF7`.
 */
export class MidiTokenizer extends EventEmitter<MidiMessageEvents> implements Tokenizer {
	#socket: TCPHelper
	#verboseLog: (msg: string) => void

	/**
	 * Create a MIDI tokenizer.
	 *
	 * @param socket
	 *   The socket to read from.
	 * @param verboseLog
	 *   A function that writes to the log only if verbose logging was enabled.
	 */
	constructor(socket: TCPHelper, verboseLog: (msg: string) => void) {
		super()
		this.#socket = socket
		this.#verboseLog = verboseLog
	}

	async run(): Promise<void> {
		const socket = this.#socket
		const verboseLog = this.#verboseLog

		const receivedData: number[] = []

		const reader = await SocketReader.create(socket, receivedData)

		// References:
		// https://learn.sparkfun.com/tutorials/midi-tutorial/all
		// https://www.cs.cmu.edu/~music/cmsip/readings/MIDI%20tutorial%20for%20programmers.html
		// http://www.somascape.org/midi/tech/spec.html
		// https://midi.org/midi-1-0-core-specifications
		next_status: for (;;) {
			// Find the first status byte.
			let statusByte
			status_byte: for (;;) {
				for (let i = 0; i < receivedData.length; i++) {
					const b = receivedData[i]

					// MIDI 1.0 "Data Types: Data Bytes" says "Receivers should
					// ignore Data bytes which have not been properly preceded
					// by a valid Status byte".  (Except for data bytes in
					// running statuses, handled in the "running messages" loop
					// further down.)
					if (b < 0x80) {
						continue
					}

					// System Real Time messages aren't part of normal messages
					// and are simply ignored.
					if (0xf8 <= b) {
						this.emit('system_realtime', b)
						continue
					}

					// Begin to read data after the first non-System Real Time
					// status byte.
					statusByte = b
					receivedData.splice(0, i + 1)
					break status_byte
				}

				receivedData.length = 0
				const more = await reader.read()
				if (!more) {
					return
				}
			}

			const [highNibble, lowNibble] = [statusByte >> 4, statusByte & 0xf]

			let dataByteCount
			switch (highNibble) {
				case 0x8: // Note Off
				case 0x9: // Note On
				case 0xa: // Polyphonic Pressure
				case 0xb: // Control Change
				case 0xe: // Pitch Bend
					dataByteCount = 2
					break

				case 0xc: // Program Change
				case 0xd: // Channel Pressure
					dataByteCount = 1
					break

				default:
					throw new Error(`Unreachable: highNibble=${highNibble.toString(16)} should be a nibble with its high bit set`)

				// System
				case 0xf: {
					const systemMessage: number[] = [statusByte]

					switch (lowNibble) {
						// System Exclusive
						case 0x0:
							for (;;) {
								for (let i = 0; i < receivedData.length; i++) {
									const b = receivedData[i]

									// Data bytes continue the System Exclusive
									// message.
									if (b < 0x80) {
										systemMessage.push(b)
										continue
									}

									// Emit a System Real Time status.
									if (0xf8 <= b) {
										this.emit('system_realtime', b)
										continue
									}

									// System Exclusive terminates after an End
									// of Exclusive byte (EOX, 0xF7).  A
									// non-System Real Time status byte "will be
									// considered an EOX message, and terminate
									// the System Exclusive message".
									receivedData.splice(0, i + 1)
									systemMessage.push(0xf7)
									this.emit('system_exclusive', systemMessage)
									continue next_status
								}

								receivedData.length = 0
								const more = await reader.read()
								if (!more) {
									return
								}
							}

						case 0x1: // Time Code Quarter Frame
						case 0x3: // Song Select
							dataByteCount = 1
							break

						case 0x2: // Song Position
							dataByteCount = 2
							break

						case 0x4: // Undefined
						case 0x5: // Undefined
							// Because these are undefined, there is no count of
							// data bytes to apply (and thus eventually emit a
							// system common message for them): simply go to
							// find the next status.
							continue next_status

						case 0x6: // Tune Request
						case 0x7: // EOX
							// EOX as the *start* of a System Common message
							// seemingly (per Table V in the MIDI 1.0 spec)
							// should be treated as an entire message.  While
							// 0xF4-0xF5 are treated as total nonentities (as
							// there's no data bytes count given for them at
							// all), EOX is spelled out as having "none" data
							// bytes, which seems to make it -- like Tune
							// Request -- just a single-byte message.
							dataByteCount = 0
							break

						default: {
							const msg =
								`Unreachable: lowNibble=${lowNibble} should ` +
								'be limited to 0-7 because 0xf8-0xff were ' +
								'handled in the `status_byte` loop'
							throw new Error(msg)
						}
					}

					// Read the expected data bytes.  Running status only
					// applies to channel messages, not to system messages, so
					// only read one count of data bytes.
					next_data_byte: while (systemMessage.length < 1 + dataByteCount) {
						for (let i = 0; i < receivedData.length; i++) {
							const b = receivedData[i]

							// Add a data byte.
							if (b < 0x80) {
								systemMessage.push(b)
								receivedData.splice(0, i + 1)
								continue next_data_byte
							}

							// Non-System Real Time statuses cause an incomplete
							// message to be abandoned and a fresh one to begin.
							if (b < 0xf8) {
								receivedData.splice(0, i)
								verboseLog(`Discarding incomplete System Common message ${prettyBytes(systemMessage)}...`)
								continue next_status
							}

							// Emit System Real Time bytes.
							this.emit('system_realtime', b)
						}

						receivedData.length = 0
						const more = await reader.read()
						if (!more) {
							return
						}
					}

					this.emit('system_common', systemMessage)
					continue next_status
				}
			}

			// Read running messages for this status until a new status
			// intervenes.
			for (;;) {
				const reply = [statusByte]

				next_data_byte: while (reply.length < 1 + dataByteCount) {
					for (let i = 0; i < receivedData.length; i++) {
						const b = receivedData[i]

						// Add a data byte.
						if (b < 0x80) {
							reply.push(b)
							receivedData.splice(0, i + 1)
							continue next_data_byte
						}

						// A non-System Real Time status terminates the prior
						// message "even if the last message was not completed",
						// per MIDI 1.0 "Data Types: Status Bytes".
						if (b < 0xf8) {
							receivedData.splice(0, i)
							continue next_status
						}

						// Emit System Real Time bytes.
						this.emit('system_realtime', b)
					}

					receivedData.length = 0
					const more = await reader.read()
					if (!more) {
						return
					}
				}

				this.emit('channel_message', reply)
			} // running status loop
		} // next_status
	}
}
