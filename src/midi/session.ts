import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import type { Mixer } from '../mixer/mixer.js'
import { asyncSleep, prettyBytes, sleep } from '../utils.js'

/**
 * The port number used for MIDI-over-TCP connections to SQ mixers.
 */
const SQMidiPort = 51325

/**
 * The type of the array of bytes making up a MIDI NRPN data message, consisting
 * of two MIDI Control Change messages specifying NRPN MSB/LSB and two MIDI
 * Control Change messages specifying MSB/LSB of a data value.
 */
export type NRPNDataMessage = [
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
	number,
]

/**
 * The type of the array of bytes making up a MIDI NRPN increment/decrement
 * message, consisting of two MIDI Control Change messages specifying NRPN
 * MSB/LSB and one MIDI Control Change message specifying increment or decrement
 * with one unconstrained 7-bit value.
 */
export type NRPNIncDecMessage = [number, number, number, number, number, number, number, number, number]

/** A MIDI connection to an SQ mixer. */
export class MidiSession {
	/**
	 * The instance controlling this mixer.
	 */
	#instance: sqInstance

	/**
	 * The TCP socket used to interact with the mixer.
	 */
	socket: TCPHelper | null = null

	/**
	 * The hostname of the mixer.
	 */
	host = ''

	/**
	 * The MIDI channel setting used by the mixer.  (This will be 0-15 for
	 * channels 1-16 as displayed in mixer UI.)
	 */
	channel = 0

	/**
	 * When/how to retrieve all levels, routing, etc. from the mixer.
	 */
	retrieveStatus = 'nosts'

	/**
	 * Whether verbose logging is enabled.
	 */
	verbose = false

	/** A Control Change byte for this session's MIDI channel. */
	get BN(): number {
		return 0xb0 | this.channel
	}

	/** A Program Change byte for this session's MIDI channel. */
	get CN(): number {
		return 0xc0 | this.channel
	}

	/**
	 * Create an SQ mixer abstraction for the given instance.
	 */
	constructor(_mixer: Mixer, instance: sqInstance) {
		this.#instance = instance
	}

	/**
	 * Start a MIDI-over-TCP session with `host:51325`, and retrieve mixer
	 * status consistent with `retrieveStatus`.
	 *
	 * @param host
	 *   The hostname/IP address of the mixer.
	 * @param midiChannel
	 *   The MIDI channel setting used by the mixer.  (This will be 0-15 for
	 *   channels 1-16 as displayed in mixer UI.)
	 * @param retrieveStatus
	 *   When/how to retrieve the current status of mixer levels and routing.
	 * @param verbose
	 *   Whether verbose logging of mixer operations should be enabled.
	 */
	start(host: string, channel: number, retrieveStatus: string, verbose: boolean): void {
		this.stop(InstanceStatus.Connecting)

		const socket = new TCPHelper(host, SQMidiPort)
		this.socket = socket

		this.host = host
		this.channel = channel
		this.retrieveStatus = retrieveStatus
		this.verbose = verbose

		const instance = this.#instance

		socket.on('error', (err) => {
			instance.log('error', `Error: ${err}`)
			this.stop(InstanceStatus.ConnectionFailure)
		})

		socket.once('connect', () => {
			instance.log('info', `Connected to ${host}:${SQMidiPort}`)
			instance.updateStatus(InstanceStatus.Ok)

			if (retrieveStatus === 'nosts') {
				return
			}

			instance.getRemoteStatus('mute')
			sleep(300)
			instance.getRemoteLevel()

			if (retrieveStatus === 'full') {
				setTimeout(() => {
					instance.getRemoteLevel()
				}, 4000)
			}
		})

		socket.on('data', (data) => {
			// XXX need to handle thrown errors
			void instance.getRemoteValue(Array.from(data))
		})
	}

	/**
	 * Stop this session and update its associated instance's status, closing
	 * the socket and destroying related resources.
	 */
	stop(status: InstanceStatus): void {
		this.#instance.updateStatus(status)
		if (this.socket !== null) {
			this.socket.destroy()
			this.socket = null
		}
	}

	/**
	 * Return an NRPN data entry sequence:
	 *
	 *     BN 63 msb    // NRPN MSB
	 *     BN 62 lsb    // NRPN LSB
	 *     BN 06 vc     // Data entry MSB
	 *     BN 26 vf     // Data entry LSB
	 *
	 * where `N` is the session MIDI channel.
	 */
	nrpnData(msb: number, lsb: number, vc: number, vf: number): NRPNDataMessage {
		const BN = this.BN
		return [BN, 0x63, msb, BN, 0x62, lsb, BN, 0x06, vc, BN, 0x26, vf]
	}

	/**
	 * Return an NRPN increment sequence:
	 *
	 *     BN 63 msb    // NRPN MSB
	 *     BN 62 lsb    // NRPN LSB
	 *     BN 60 val    // Increment
	 *
	 * where `N` is the session MIDI channel.
	 */
	nrpnIncrement(msb: number, lsb: number, val: number): NRPNIncDecMessage {
		const BN = this.BN
		return [BN, 0x63, msb, BN, 0x62, lsb, BN, 0x60, val]
	}

	/**
	 * Return an NRPN decrement sequence:
	 *
	 *     BN 63 msb    // NRPN MSB
	 *     BN 62 lsb    // NRPN LSB
	 *     BN 61 val    // Increment
	 *
	 * where `N` is the session MIDI channel.
	 */
	nrpnDecrement(msb: number, lsb: number, val: number): NRPNIncDecMessage {
		const BN = this.BN
		return [BN, 0x63, msb, BN, 0x62, lsb, BN, 0x61, val]
	}

	/**
	 * Send the given bytes to the mixer.
	 */
	send(data: readonly number[]): void {
		const socket = this.socket
		if (socket !== null && socket.isConnected) {
			if (this.verbose) {
				this.#instance.log('debug', `SEND: ${prettyBytes(data)} from ${this.host}`)
			}

			// XXX This needs to be handled better.
			void socket.send(Buffer.from(data))
		}
	}

	// new send command
	async sendCommands(commands: readonly (readonly number[])[]): Promise<void> {
		for (let i = 0; i < commands.length; i++) {
			this.send(commands[i])
			await asyncSleep(200)
		}
	}
}
