import { manyPrettyBytes, prettyByte, prettyBytes } from '../../utils/pretty.js'
import EventEmitter from 'eventemitter3'

export interface MixerMessageEvents {
	// (It's unfortunate that this interface encodes NRPN MSB/LSB parameters to
	// this degree.  But the underlying modeling of the mixer reiterates MSB/LSB
	// in a bunch of places -- in `CallbackInfo.mute` keys, in variable names,
	// in `lastValue` and `fdbState` keys, in conversions between level encoding
	// and level value -- so we can't really do any better.)

	/** A scene change to `newScene` (zero-based) occurred. */
	scene: [newScene: number]

	/**
	 * The input/output identified by MSB/LSB was muted (`vf=1`) or unmuted
	 * (`vf=0`).
	 */
	mute: [msb: number, lsb: number, vf: number]

	/**
	 * The signal level identified by MSB/LSB was set to the level specified by
	 * `vc`/`vf` with respect to the active fader law.
	 */
	fader_level: [msb: number, lsb: number, vc: number, vf: number]

	/**
	 * The pan/balance of a signal in a mix identified by MSB/LSB was set to the
	 * level specified by `vc`/`vf`.
	 */
	pan_level: [msb: number, lsb: number, vc: number, vf: number]
}

/**
 * Parse MIDI replies sent by the mixer in the mixer MIDI channel, and emit
 * events corresponding to the received mixer messages.
 */
export class MixerChannelParser extends EventEmitter<MixerMessageEvents> {
	#gen: Generator<void, void, number[]>

	/**
	 * Create a parser for messages sent from the mixer on the MIDI channel
	 * defined in mixer settings.
	 *
	 * After the parser is created, add listeners for the various possible
	 * message events to handle them.
	 *
	 * @param verboseLog
	 *   A function that writes to the log only if verbose logging was enabled.
	 */
	constructor(verboseLog: (msg: string) => void) {
		super()

		this.#gen = this.#parseMixerMessages(verboseLog)

		// Send `void` to `this.#gen` and advance it to the first `yield` in
		// `#parseMixerMessages`.  The next call to `handleMessage` will supply
		// the message that that `yield` evaluates to, and the one after that to
		// the second `yield` reached in execution, and so on.
		this.#gen.next()
	}

	/** Pass a newly tokenized MIDI message to the parser. */
	handleMessage(message: number[]): void {
		this.#gen.next(message)
	}

	/**
	 * Parse mixer commands from MIDI messages in a single MIDI channel.
	 *
	 * To use this function, first call it to produce a generator.  Then call
	 * `.next()` on it a single time to prime it for use.  Finally, repeatedly call
	 * call `.next(message)` on it with each MIDI message received in the channel.
	 * The generator will process messages sent into the generator, recognize
	 * complete and coherent mixer commands comprised of them, then emit events
	 * at `this` for each mixer command received.
	 *
	 * @param verboseLog
	 *   A function that writes to the log only if verbose logging was enabled.
	 */
	*#parseMixerMessages(verboseLog: (msg: string) => void): Generator<void, void, number[]> {
		read_message: for (;;) {
			let first = yield

			parse_message: for (;;) {
				// [BN xx yy] ...
				if ((first[0] & 0xf0) === 0xb0) {
					// Scene change
					// [BN 00 aa] [CN bb]
					if (first[1] === 0x00) {
						const second = yield
						if ((second[0] & 0xf0) !== 0xc0) {
							verboseLog(`Malformed scene change ${manyPrettyBytes(first, second)}, ignoring`)
							first = second
							continue parse_message
						}

						const aa = first[2]
						const bb = second[1]

						const newScene = ((aa & 0x7f) << 7) + bb
						this.emit('scene', newScene)
						continue read_message
					} // [BN 00 aa] [CN bb]

					// NRPN data message:
					// [BN 63 MB] [BN 62 LB] [BN 06 VC] [BN 26 VF]
					if (first[1] === 0x63) {
						// [BN 62 LB]
						const second = yield
						if ((second[0] & 0xf0) !== 0xb0 || second[1] !== 0x62) {
							verboseLog(`Second message in NRPN data is malformed, ignoring: ${manyPrettyBytes(first, second)}`)
							first = second
							continue parse_message
						}

						// [BN 06 VC]
						const third = yield
						if ((third[0] & 0xf0) !== 0xb0 || third[1] !== 0x06) {
							verboseLog(`Third message in NRPN data is malformed, ignoring: ${manyPrettyBytes(first, second, third)}`)
							first = third
							continue parse_message
						}

						// [BN yy zz]
						const fourth = yield
						if ((fourth[0] & 0xf0) !== 0xb0 || fourth[1] !== 0x26) {
							verboseLog(
								`Fourth message in NRPN data is malformed, ignoring: ${manyPrettyBytes(first, second, third, fourth)}`,
							)
							first = fourth
							continue parse_message
						}

						const [msb, lsb, vc, vf] = [first[2], second[2], third[2], fourth[2]]

						// Mute
						if (msb === 0x00 || msb === 0x02 || msb === 0x04) {
							if (vc == 0x00 && vf < 0x02) {
								this.emit('mute', msb, lsb, vf)
							} else {
								verboseLog(`Malformed mute message, ignoring: ${manyPrettyBytes(first, second, third, fourth)}`)
							}
						}
						// Fader level
						else if (0x40 <= msb && msb <= 0x4f) {
							this.emit('fader_level', msb, lsb, vc, vf)
						}
						// Pan Level
						else if (0x50 <= msb && msb <= 0x5e) {
							this.emit('pan_level', msb, lsb, vc, vf)
						} else {
							verboseLog(
								`Unhandled MSB/LSB ${prettyByte(msb)}/${prettyByte(lsb)} in NRPN data message ${manyPrettyBytes(first, second, third, fourth)}`,
							)
						}

						continue read_message
					} // [BN 63 MB] [BN 62 LB] [BN 06 VC] [BN 26 VF]

					verboseLog(`Unrecognized controller ${prettyByte(first[1])} in Control Change ${prettyBytes(first)}`)
					continue read_message
				} // [BN xx yy] ...

				// Ignore unrecognized messages.  This is not optional: the SQ-5
				// sends scene change messages as [BN 00 BK | CN PG 00] rather than
				// [BN 00 BK | CN PG] -- which per MIDI "running status" parsing is
				// the same as [BN 00 BK | CN PG | CN 00], and the [CN 00] ends up
				// unrecognized.
				verboseLog(`Unrecognized channel message, ignoring: ${prettyBytes(first)}`)
				continue read_message
			} // parse_message: for(;;)
		} // read_message: for (;;)
	}
}
