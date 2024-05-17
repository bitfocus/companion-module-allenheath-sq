import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import type { Mixer } from '../mixer/mixer.js'
import { prettyBytes, sleep } from '../utils.js'

/**
 * The port number used for MIDI-over-TCP connections to SQ mixers.
 */
const SQMidiPort = 51325

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
	 * When/how to retrieve all levels, routing, etc. from the mixer.
	 */
	retrieveStatus = 'nosts'

	/**
	 * Whether verbose logging is enabled.
	 */
	verbose = false

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
	 * @param retrieveStatus
	 *   When/how to retrieve the current status of mixer levels and routing.
	 * @param verbose
	 *   Whether verbose logging of mixer operations should be enabled.
	 */
	start(host: string, retrieveStatus: string, verbose: boolean): void {
		this.stop(InstanceStatus.Connecting)

		const socket = new TCPHelper(host, SQMidiPort)
		this.socket = socket

		this.host = host
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
}
