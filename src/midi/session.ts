import { InstanceStatus, TCPHelper } from '@companion-module/base'
import callback from '../callback.js'
import type { SQInstanceInterface as sqInstance } from '../instance-interface.js'
import type { Mixer } from '../mixer/mixer.js'
import { vcvfToReadablePanBalance } from '../mixer/pan-balance.js'
import { MidiTokenizer } from './tokenize/tokenize.js'
import { MixerMessageParser } from './parse/parse.js'
import { prettyByte, prettyBytes } from '../utils/pretty.js'
import { asyncSleep, sleep } from '../utils/sleep.js'
import { MixerChannelParser } from './parse/mixer-channel-parse.js'

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

/**
 * The type of the array of bytes making up an SQ scene change message,
 * consisting of one MIDI Control Change Bank Select message with with a 7-bit
 * data byte and one MIDI Program Change message with a 7-bit data byte.  The
 * two 7-bit values, concatenated, specify the scene (with mixer scene 1 encoded
 * as `0` to mixer scene 300 encoded as `299`).
 */
export type SceneChangeMessage = [number, number, number, number, number]

/** A MIDI connection to an SQ mixer. */
export class MidiSession {
	/**
	 * The instance controlling this mixer.
	 */
	#instance: sqInstance

	/**
	 * The mixer this session connects to.
	 */
	#mixer: Mixer

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

	/**
	 * Create an SQ mixer abstraction for the given instance.
	 */
	constructor(mixer: Mixer, instance: sqInstance) {
		this.#instance = instance
		this.#mixer = mixer
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

		this.#processMixerReplies(socket).then(
			() => {
				instance.log('info', 'All mixer replies received, disconnecting')
				this.stop(InstanceStatus.Disconnected)
			},
			(reason: any) => {
				instance.log('error', `Error processing replies: ${reason}`)
				this.stop(InstanceStatus.ConnectionFailure)
			},
		)

		socket.once('connect', () => {
			instance.log('info', `Connected to ${host}:${SQMidiPort}`)
			instance.updateStatus(InstanceStatus.Ok)

			if (retrieveStatus === 'nosts') {
				return
			}

			this.#retrieveMuteStatuses()
			sleep(300)
			instance.getRemoteLevel()

			if (retrieveStatus === 'full') {
				setTimeout(() => {
					instance.getRemoteLevel()
				}, 4000)
			}
		})
	}

	/** Read and process mixer reply messages from `socket`. */
	async #processMixerReplies(socket: TCPHelper) {
		const mixer = this.#mixer
		const instance = this.#instance

		const verboseLog = (msg: string) => {
			if (this.verbose) {
				instance.log('debug', msg)
			}
		}

		const tokenizer = new MidiTokenizer(socket, verboseLog)

		const mixerChannelParser = new MixerChannelParser(verboseLog)
		mixerChannelParser.on('scene', (newScene: number) => {
			verboseLog(`Scene changed: ${newScene}`)

			mixer.currentScene = newScene
			instance.setVariableValues({
				// The currentScene variable is 1-indexed, consistent with how
				// the current scene is displayed to users in mixer UI.
				currentScene: newScene + 1,
			})
		})
		mixerChannelParser.on('mute', (msb: number, lsb: number, vf: number) => {
			verboseLog(`Mute received: MSB=${prettyByte(msb)}, LSB=${prettyByte(lsb)}, VF=${prettyByte(vf)}`)

			mixer.fdbState[`mute_${msb}.${lsb}`] = vf === 0x01
			instance.checkFeedbacks((callback.mute as any)[msb + ':' + lsb][0])
		})
		mixerChannelParser.on('fader_level', (msb: number, lsb: number, vc: number, vf: number) => {
			verboseLog(
				`Fader received: MSB=${prettyByte(msb)}, LSB=${prettyByte(lsb)}, VC=${prettyByte(vc)}, VF=${prettyByte(vf)}`,
			)

			const levelKey = `level_${msb}.${lsb}` as const

			let ost = false
			const res = instance.getVariableValue(levelKey)
			if (res !== undefined) {
				mixer.lastValue[levelKey] = res
				ost = true
			}

			const level = mixer.levelFromNRPNData(vc, vf)
			instance.setVariableValues({
				[levelKey]: level,
			})

			if (!ost) {
				mixer.lastValue[levelKey] = level
			}
		})
		mixerChannelParser.on('pan_level', (msb: number, lsb: number, vc: number, vf: number) => {
			verboseLog(
				`Pan received: MSB=${prettyByte(msb)}, LSB=${prettyByte(lsb)}, VC=${prettyByte(vc)}, VF=${prettyByte(vf)}`,
			)
			instance.setVariableValues({
				[`pan_${msb}.${lsb}`]: vcvfToReadablePanBalance(vc, vf),
			})
		})

		return new MixerMessageParser(this.channel, verboseLog, tokenizer, mixerChannelParser).run()
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
	 * Issue MIDI commands to the mixer to retrieve the current mute states of
	 * all inputs and outputs.
	 */
	#retrieveMuteStatuses(): void {
		for (const key in callback.mute) {
			const mblb = key.toString().split(':')
			this.send(this.nrpnIncrement(Number(mblb[0]), Number(mblb[1]), 0x7f))
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
		const BN = 0xb0 | this.channel
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
		const BN = 0xb0 | this.channel
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
		const BN = 0xb0 | this.channel
		return [BN, 0x63, msb, BN, 0x62, lsb, BN, 0x61, val]
	}

	/**
	 * Return a MIDI message sequence to recall the specified scene.
	 *
	 * @param scene
	 *   The scene to recall.  Note that this is the scene displayed in mixer UI
	 *   *minus one*, so this will be in range `[0, 300)` if the mixer supports
	 *   scenes 1-300 in its UI.
	 */
	sceneChange(scene: number): SceneChangeMessage {
		const BN = 0xb0 | this.channel
		const CN = 0xc0 | this.channel
		const sceneUpper = (scene >> 7) & 0x0f
		const sceneLower = scene & 0x7f
		return [BN, 0, sceneUpper, CN, sceneLower]
	}

	/**
	 * Send the given bytes to the mixer.
	 */
	send(data: readonly number[]): void {
		const socket = this.socket
		if (socket !== null && socket.isConnected) {
			if (this.verbose) {
				this.#instance.log('debug', `SEND: ${prettyBytes(data)} to ${this.host}`)
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
