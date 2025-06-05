import { type CompanionVariableValue, InstanceStatus, TCPHelper } from '@companion-module/base'
import { OutputPanBalanceActionId } from '../actions/output.js'
import { PanBalanceActionId, type PanBalanceChoice } from '../actions/pan-balance.js'
import { type CallbackInfoType, CallbackInfo } from '../callback.js'
import type { Host } from '../config.js'
import { typeToMuteFeedback } from '../feedbacks/feedback-ids.js'
import type { sqInstance } from '../instance.js'
import { type Level, levelFromNRPNData, nrpnDataFromLevel } from './level.js'
import { LR, type MixOrLR } from './lr.js'
import { ChannelParser } from '../midi/parse/channel-parser.js'
import { parseMidi } from '../midi/parse/parse-midi.js'
import { MidiTokenizer } from '../midi/tokenize/tokenizer.js'
import { type InputOutputType, Model } from './model.js'
import { calculateMuteNRPN, forEachMute } from './nrpn/mute.js'
import { type NRPN, type NRPNType, prettyNRPN, splitNRPN } from './nrpn/nrpn.js'
import {
	forEachOutputLevel,
	OutputBalanceNRPNCalculator,
	OutputLevelNRPNCalculator,
	type SinkAsOutputForNRPN,
} from './nrpn/output.js'
import {
	AssignNRPNCalculator,
	BalanceNRPNCalculator,
	forEachSourceSinkLevel,
	LevelNRPNCalculator,
	type SourceForSourceInMixAndLRForNRPN,
	type SourceSinkForNRPN,
} from './nrpn/source-to-sink.js'
import { panBalanceLevelToVCVF, vcvfToReadablePanBalance } from './pan-balance.js'
import { enumValues } from '../utils/enumerate-enum.js'
import { prettyByte, prettyBytes } from '../utils/pretty.js'
import { sleep, asyncSleep } from '../utils/sleep.js'
import { SceneRecalledTriggerId, CurrentSceneId } from '../variables.js'

/**
 * The two values of the NRPN fader law setting in the mixer.  The two values
 * determine how signal levels are encoded in MIDI level messages sent to and
 * received from the mixer:
 *
 * * `"LinearTaper"` uses a high-resolution encoding that supports 16384
 *   different level values.
 * * `"AudioTaper"` uses a much lower-resolution encoding that's easier to map
 *   onto a physical fader position.
 *
 * For more details, see the "3.4 Levels: NRPN Fader Law" section and the
 * Taper Level Values tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export type FaderLaw = 'LinearTaper' | 'AudioTaper'

/**
 * The extent to which the mixer's current status (levels of sources in sinks,
 * mute states, etc.) should be retrieved at startup.
 *
 * Retrieving full mixer state requires sending the mixer a large amount of MIDI
 * messages (around 26KB of data on last check), then receiving a similar amount
 * of MIDI messages in response, briefly clogging the connection in both
 * directions.
 *
 * This option allows some flexibility in how status is retrieved to mitigate
 * this issue.
 */
export enum RetrieveStatusAtStartup {
	/**
	 * Fully retrieve mixer status at connection startup.  This ties up the
	 * mixer for the longest time, but when done there's no need to sync
	 * something on-demand later.
	 */
	Fully = 'full',

	/**
	 * Slightly delay retrieving mixer status after connection startup, then
	 * stagger the retrieving of full status over a few seconds.
	 */
	Delayed = 'delay',

	/**
	 * Don't retrieve any mixer status at connection startup.  Instead retrieve
	 * individual statuses as they're needed.
	 */
	None = 'nosts',
}

export enum MuteOperation {
	Toggle = 0,
	On = 1,
	Off = 2,
}

/** The port number used for MIDI-over-TCP connections to SQ mixers. */
const SQMidiPort = 51325

// Level fading in this module historically performed fade steps every 50ms --
// maybe because humans (at least visually; I'm not sure if this applies in the
// audio realm) perceive a cause-effect duration of a tenth of a second as
// immediate and so double that frequency will sound seamless.
const FadeStepDurationMs = 50

// If two fade steps would be performed closer than this duration to each other,
// eliminate the first step and do it all in the second step.
const FadeStepCoalesceMs = 5

/**
 * The type of the array of bytes making up a MIDI NRPN data message, consisting
 * of two MIDI Control Change messages specifying NRPN MSB/LSB and two MIDI
 * Control Change messages specifying MSB/LSB of a data value.
 */
type NRPNDataMessage = [number, 0x63, number, number, 0x62, number, number, 0x06, number, number, 0x26, number]

/**
 * The type of the array of bytes making up a MIDI NRPN increment/decrement
 * message, consisting of two MIDI Control Change messages specifying NRPN
 * MSB/LSB and one MIDI Control Change message specifying increment or decrement
 * with one unconstrained 7-bit value.
 */
type NRPNIncDecMessage = [number, 0x63, number, number, 0x62, number, number, 0x60 | 0x61, number]

/**
 * An abstract representation of an SQ mixer.
 */
export class Mixer {
	/** The instance controlling this mixer. */
	#instance

	/**
	 * The model of this mixer.
	 */
	model: Model

	/** The TCP socket used to interact with the mixer. */
	#socket: TCPHelper | null = null

	/** A store of current mute status for mixer inputs/outputs. */
	readonly #muteStatus: Map<NRPN<'mute'>, boolean> = new Map()

	/**
	 * Determine whether the given mute NRPN is muted.
	 *
	 * @param nrpn
	 *   The mute NRPN to check.  The NRPN must be valid and have a registered
	 *   mute status, or an error will be thrown.
	 * @returns
	 *   True if the NRPN is muted, false if it isn't.
	 */
	muted(nrpn: NRPN<'mute'>): boolean {
		let status = this.#muteStatus.get(nrpn)
		if (status === undefined) {
			// This can occur at startup if feedbacks are checked before the
			// connection is established and initial mute states queried, so it
			// can't be a full-blown error unless/until we correlate this with
			// connection status.  Treat the NRPN as unmuted for now.
			const warning = `Attempt to access mute status of invalid NRPN: ${prettyNRPN(nrpn)}`
			this.#instance.log('warn', warning)
			status = false
		}
		return status
	}

	/**
	 * A store of the last level of each source in its sinks as reported by the
	 * mixer.  Keys have the form `"level_${MSB}.${LSB}"`, where `MSB` and `LSB`
	 * come from the "Level Parameter Numbers" reference tables in the
	 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
	 */
	readonly lastValue: { [key: `level_${number}.${number}`]: CompanionVariableValue } = {}

	/**
	 * The scene currently recalled on the mixer minus one -- so this will be in
	 * the range `[0, 300)` for scenes 1-300 displayed on the mixer.
	 *
	 * Note that this value isn't updated when scene-change messages are *sent*
	 * to the mixer, but only when scene-change messages are received *from* the
	 * mixer.  (These messages can be the result of scene changes performed on
	 * the mixer itself.)  Thus it slightly lags reality rather than slightly
	 * preceding it.
	 */
	currentScene = 0

	/**
	 * The current value of the `sceneRecalledTrigger` variable, whose value is
	 * changed every time a scene is recalled (whether or not the new scene is
	 * different from the old scene).
	 *
	 * This value is randomly initialized to prevent users depending on its
	 * exact value.
	 */
	sceneRecalledTrigger = Math.floor(Math.random() * 65536)

	/**
	 * Send the given bytes to the mixer.
	 */
	send(data: readonly number[]): void {
		const socket = this.#socket
		if (socket !== null && socket.isConnected) {
			const instance = this.#instance
			if (instance.config.verbose) {
				instance.log('debug', `SEND: ${prettyBytes(data)} to ${instance.config.host}`)
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

	/** Create a mixer for the given instance. */
	constructor(instance: sqInstance) {
		this.#instance = instance
		this.model = new Model(instance.config.model)
	}

	/**
	 * Stop operating the mixer, updating instance status to the given status.
	 */
	#stop(status: InstanceStatus, reason: string): void {
		this.#instance.updateStatus(status, reason)

		const socket = this.#socket
		if (socket !== null) {
			socket.destroy()
			this.#socket = null
		}
	}

	/** Stop operating and disconnect from the mixer. */
	stop(reason: string): void {
		this.#stop(InstanceStatus.Disconnected, reason)
	}

	/** Start operating the SQ mixer, using options from the instance. */
	start(host: Host | ''): void {
		if (host === '') {
			this.#stop(InstanceStatus.BadConfig, 'No mixer TCP/IP host specified')
			return
		}

		this.#stop(InstanceStatus.Connecting, 'Starting mixer connection...')

		const retrieveStatus = this.#instance.config.retrieveStatusAtStartup

		const socket = new TCPHelper(host, SQMidiPort)
		this.#socket = socket

		const instance = this.#instance

		socket.on('error', (err) => {
			const errStr = `Error: ${err}`
			instance.log('error', errStr)
			this.#stop(InstanceStatus.ConnectionFailure, errStr)
		})

		this.#processMixerReplies(socket).then(
			() => {
				const processingComplete = 'Mixer reply processing complete, disconnecting'
				instance.log('info', processingComplete)
				this.stop(processingComplete)
			},
			(reason: any) => {
				const err = `Error processing replies: ${reason}`
				instance.log('error', err)
				this.#stop(InstanceStatus.ConnectionFailure, err)
			},
		)

		socket.once('connect', () => {
			instance.log('info', `Connected to ${host}:${SQMidiPort}`)
			instance.updateStatus(InstanceStatus.Ok)

			if (retrieveStatus === RetrieveStatusAtStartup.None) {
				return
			}

			forEachMute(this.model, (nrpn: NRPN<'mute'>) => {
				// Initialize every mute NRPN's status.  (It'd be nice to use
				// the type system to guarantee this somehow, but it's not clear
				// how we could do it.)
				this.#muteStatus.set(nrpn, false)
				this.send(this.getNRPNValue(nrpn))
			})

			sleep(300)
			this.#getRemoteLevel()

			if (retrieveStatus === RetrieveStatusAtStartup.Fully) {
				setTimeout(() => {
					this.#getRemoteLevel()
				}, 4000)
			}
		})
	}

	#getRemoteLevel(): void {
		const model = this.model
		const instance = this.#instance

		const buff: NRPNIncDecMessage[] = []

		const getLevel = (nrpn: NRPN<'level'>) => buff.push(this.getNRPNValue(nrpn))

		forEachSourceSinkLevel(model, getLevel)
		forEachOutputLevel(model, getLevel)

		const delayStatusRetrieval = instance.config.retrieveStatusAtStartup === RetrieveStatusAtStartup.Delayed

		if (buff.length > 0 && this.#socket !== null) {
			let ctr = 0
			for (let i = 0; i < buff.length; i++) {
				this.send(buff[i])
				ctr++
				if (delayStatusRetrieval) {
					if (ctr === 20) {
						ctr = 0
						sleep(300)
					}
				}
			}
		}

		// Pan/balance level variables aren't defined by default, only after the
		// mixer sends pan/balance messages to the module.  Trigger pan/balance
		// action `subscribe` callbacks to get all mixer pan/balance levels
		// known to be in use now.
		//
		// (This isn't *all* pan/balance levels in use, because pan/balance
		// variables might be used without their corresponding actions.  But the
		// Companion module API doesn't tell us about them.)
		for (const actionId of enumValues(PanBalanceActionId)) {
			instance.subscribeActions(actionId)
			if (delayStatusRetrieval) {
				sleep(300)
			}
		}

		// Also ensure output pan/balances are queried and variables created.
		for (const actionId of enumValues(OutputPanBalanceActionId)) {
			instance.subscribeActions(actionId)
		}
	}

	/** Read and process mixer reply messages from `socket`. */
	async #processMixerReplies(socket: TCPHelper) {
		const instance = this.#instance

		const verboseLog = (msg: string) => {
			if (instance.config.verbose) {
				instance.log('debug', msg)
			}
		}

		const tokenizer = new MidiTokenizer(socket, verboseLog)

		const mixerChannelParser = new ChannelParser(verboseLog)
		mixerChannelParser.on('scene', (newScene: number) => {
			verboseLog(`Scene recalled: ${newScene}`)

			this.currentScene = newScene

			const instance = this.#instance
			const sceneRecalledTrigger = ++this.sceneRecalledTrigger
			instance.setVariableValues({
				[SceneRecalledTriggerId]: sceneRecalledTrigger,

				// The currentScene variable is 1-indexed, consistent with how
				// the current scene is displayed to users in mixer UI.
				[CurrentSceneId]: newScene + 1,
			})
		})
		mixerChannelParser.on('mute', (nrpn: NRPN<'mute'>, vf: number) => {
			verboseLog(`Mute received: ${prettyNRPN(nrpn)}, VF=${prettyByte(vf)}`)

			// This always overwrites an existing status.  It'd be nice to check
			// that, but it's not worth an unavoidable extra function call to do
			// so.
			const muted = vf === 0x01
			this.#muteStatus.set(nrpn, muted)

			const { MSB, LSB } = splitNRPN(nrpn)
			const CI: CallbackInfoType = CallbackInfo
			instance.checkFeedbacks(CI.mute[`${MSB}:${LSB}`][0])
		})
		mixerChannelParser.on('fader_level', (nrpn: NRPN<'level'>, vc: number, vf: number) => {
			verboseLog(`Fader received: ${prettyNRPN(nrpn)}, VC=${prettyByte(vc)}, VF=${prettyByte(vf)}`)

			const { MSB, LSB } = splitNRPN(nrpn)
			const levelKey = `level_${MSB}.${LSB}` as const

			let ost = false
			const res = instance.getVariableValue(levelKey)
			if (res !== undefined) {
				this.lastValue[levelKey] = res
				ost = true
			}

			const level = levelFromNRPNData(vc, vf, this.#instance.config.faderLaw)
			instance.setVariableValues({
				[levelKey]: level,
			})

			if (!ost) {
				this.lastValue[levelKey] = level
			}
		})
		mixerChannelParser.on('pan_level', (nrpn: NRPN<'panBalance'>, vc: number, vf: number) => {
			const printedNRPN = prettyNRPN(nrpn)
			verboseLog(`Pan received: ${printedNRPN}, VC=${prettyByte(vc)}, VF=${prettyByte(vf)}`)

			// It would be nice to mention the source-sink relationship the NRPN
			// refers to, but we haven't defined a way to work backwards from
			// MSB/LSB to semantic meaning.  A name that includes MSB/LSB (in
			// hex as in the SQ MIDI Protocol document) is minimally viable.
			const name = `Pan/Balance ${printedNRPN}`

			const { MSB, LSB } = splitNRPN(nrpn)
			const variableId = `pan_${MSB}.${LSB}`
			const variableValue = vcvfToReadablePanBalance(vc, vf)
			instance.setExtraVariable(variableId, name, variableValue)
		})

		return parseMidi(instance.config.midiChannel, verboseLog, tokenizer, mixerChannelParser)
	}

	/** Compute a mixer "get" command to retrieve the value of an NRPN. */
	getNRPNValue<T extends NRPNType>(nrpn: NRPN<T>): NRPNIncDecMessage {
		return this.#nrpnIncrement(nrpn, 0x7f)
	}

	/**
	 * Recall the specified scene.  (Note that if the scene doesn't exist, SQ
	 * mixers will not change scene.)
	 *
	 * @param scene
	 *   The scene to recall.  Note that this is the scene displayed in mixer UI
	 *   *minus one*, so this will be in range `[0, 300)` if the mixer supports
	 *   scenes 1-300 in its UI.
	 */
	setScene(scene: number): void {
		if (scene < 0 || this.model.scenes <= scene) {
			throw new Error(`Attempting to set out-of-bounds scene ${scene}`)
		}

		const midiChannel = this.#instance.config.midiChannel
		const BN = 0xb0 | midiChannel
		const CN = 0xc0 | midiChannel
		const sceneUpper = (scene >> 7) & 0x0f
		const sceneLower = scene & 0x7f

		const sceneCommand = [BN, 0, sceneUpper, CN, sceneLower]
		// XXX handle better
		void this.sendCommands([sceneCommand])
	}

	/**
	 * Adjust the current scene by `adjust`, clamping to the actual scene range
	 * if necessary.  (Note that if the scene doesn't exist, SQ mixers will not
	 * change scene.)  Therefore `adjust=1` is the same as attempting to recall
	 * the next scene and `adjust=-1` is the same as attempting to recall the
	 * previous scene.
	 *
	 * @param adjust
	 *    The amount to adjust the current scene by; may be negative.
	 */
	stepSceneBy(adjust: number): void {
		let newScene = this.currentScene + adjust
		if (newScene < 0) {
			newScene = 0
		} else {
			const sceneCount = this.model.scenes
			if (sceneCount <= newScene) {
				newScene = sceneCount - 1
			}
		}

		this.setScene(newScene)
	}

	/** Perform the supplied mute operation upon the strip of the given type. */
	#mute(strip: number, type: InputOutputType, op: MuteOperation): void {
		const nrpn = calculateMuteNRPN(this.model, type, strip)

		let newMuteStatus: boolean
		let command: readonly number[]
		switch (op) {
			case MuteOperation.Toggle: {
				const currentMuteStatus = this.#muteStatus.get(nrpn)
				if (currentMuteStatus === undefined) {
					const reason = `No mute status recorded for source/sink ${prettyNRPN(nrpn)} being toggled`
					this.#instance.log('error', reason)
					throw new Error(reason)
				}

				newMuteStatus = !currentMuteStatus
				command = this.#nrpnIncrement(nrpn, 0x00)
				break
			}
			case MuteOperation.On:
			case MuteOperation.Off:
				newMuteStatus = op === MuteOperation.On
				command = this.#nrpnData(nrpn, 0x00, newMuteStatus ? 0x01 : 0x00)
				break
		}

		// An SQ-5 running 1.5.* firmware doesn't echo back mute status when a
		// mute status is set/toggled.  (How other SQ models/firmware behave is
		// presently unknown.)  Record the muting effect immediately so that
		// feedbacks immediately reflect the change (and don't bother querying
		// the new mute status because it'll just ratify this recorded status).
		this.#muteStatus.set(nrpn, newMuteStatus)

		this.#instance.checkFeedbacks(typeToMuteFeedback[type])
		// XXX
		void this.sendCommands([command])
	}

	/** Act upon the mute status of the given input channel. */
	muteInputChannel(inputChannel: number, op: MuteOperation): void {
		this.#mute(inputChannel, 'inputChannel', op)
	}

	/** Act upon the mute status of LR. */
	muteLR(op: MuteOperation): void {
		this.#mute(0, 'lr', op)
	}

	/** Act upon the mute status of the given mix. */
	muteMix(mix: number, op: MuteOperation): void {
		this.#mute(mix, 'mix', op)
	}

	/** Act upon the mute status of the given mute group. */
	muteGroup(group: number, op: MuteOperation): void {
		this.#mute(group, 'group', op)
	}

	/** Act upon the mute status of the given matrix. */
	muteMatrix(matrix: number, op: MuteOperation): void {
		this.#mute(matrix, 'matrix', op)
	}

	/** Act upon the mute status of the given FX send. */
	muteFXSend(fxSend: number, op: MuteOperation): void {
		this.#mute(fxSend, 'fxSend', op)
	}

	/** Act upon the mute status of the given FX return. */
	muteFXReturn(fxReturn: number, op: MuteOperation): void {
		this.#mute(fxReturn, 'fxReturn', op)
	}

	/** Act upon the mute status of the given DCA. */
	muteDCA(dca: number, op: MuteOperation): void {
		this.#mute(dca, 'dca', op)
	}

	/** Act upon the mute status of the given mute group. */
	muteMuteGroup(strip: number, op: MuteOperation): void {
		this.#mute(strip, 'muteGroup', op)
	}

	/**
	 * Assign a `source` to `sink` or remove its assignment, depending on
	 * `active`.
	 *
	 * @param source
	 *   The number of the source to assign, counting from zero.
	 * @param active
	 *   If `true`, the source will be made active in the specified sink.  If
	 *   `false`, it will be made inactive.
	 * @param sink
	 *   The number of the sink to assign, relative to all sinks of that type,
	 *   counting from zero.  (For example, if there are 12 total groups and the
	 *   sink is a group, this will be in range `[0, 12)`).
	 * @param calc
	 *   A calculator of the assign NRPN dictated by `source`, `sink`, and their
	 *   types.
	 */
	#assignToSink(source: number, active: boolean, sink: number, calc: AssignNRPNCalculator): NRPNDataMessage {
		const nrpn = calc.calculate(source, sink)
		return this.#nrpnData(nrpn, 0, active ? 1 : 0)
	}

	/**
	 * Assign the numbered `source` of the given type to the supplied mixes
	 * (which may include LR) and activate or deactivate it in those mixes
	 * depending on `active`.
	 *
	 * @param source
	 *   A source, e.g. a value in the range `[0, 12)` if `source` is a group
	 *   being assigned to mixes and the mixer supports 12 groups.
	 * @param sourceType
	 *   The type of the source.
	 * @param active
	 *   Whether to activate the source in all mixes or deactivate it.
	 * @param mixes
	 *   The mixes (potentially including LR) to which `source` should be
	 *   assigned.
	 */
	#assignSourceToMixesAndLR(
		source: number,
		sourceType: SourceForSourceInMixAndLRForNRPN<'assign'>,
		active: boolean,
		mixes: readonly MixOrLR[],
	): void {
		const mixNrpn = AssignNRPNCalculator.get(this.model, [sourceType, 'mix'])
		const lrNrpn = AssignNRPNCalculator.get(this.model, [sourceType, 'lr'])

		const commands = mixes.map((mixOrLR) => {
			return mixOrLR === LR
				? this.#assignToSink(source, active, 0, lrNrpn)
				: this.#assignToSink(source, active, mixOrLR, mixNrpn)
		})

		// XXX
		void this.sendCommands(commands)
	}

	/**
	 * Assign the numbered `source` of the given type to the supplied *non-mix*
	 * sinks and activate or deactivate it in those sinks depending on `active`.
	 *
	 * @param source
	 *   A source, e.g. a value in the range `[0, 12)` if `source` is a group
	 *   being assigned to mixes and the mixer supports 12 groups.
	 * @param sourceType
	 *   The type of `source`.
	 * @param active
	 *   Whether to activate the source in all mixes or deactivate it.
	 * @param sinks
	 *   The sinks to which `source` should be assigned.
	 * @param sinkType
	 *   The type of the sinks.
	 * @param paramsType
	 *   An identifier determining the base MSB/LSB for the desired
	 *   source-to-sink assignment.
	 */
	#assignSourceToSinks(
		source: number,
		active: boolean,
		sinks: readonly number[],
		sourceSink: SourceSinkForNRPN<'assign'>,
	): void {
		const nrpn = AssignNRPNCalculator.get(this.model, sourceSink)

		const commands = sinks.map((sink) => {
			return this.#assignToSink(source, active, sink, nrpn)
		})

		// XXX
		void this.sendCommands(commands)
	}

	/**
	 * Assign the given input channel to the supplied mixes (possibly including
	 * the LR mix), making it active or inactive dependent on `active`.
	 *
	 * @param inputChannel
	 *   The input channel to alter in mixes.
	 * @param active
	 *   Whether to make the input channel active or inactive in the mixes.
	 * @param mixes
	 *   The mixes to activate it in, potentially including the LR mix.
	 */
	assignInputChannelToMixesAndLR(inputChannel: number, active: boolean, mixes: readonly MixOrLR[]): void {
		this.#assignSourceToMixesAndLR(inputChannel, 'inputChannel', active, mixes)
	}

	/**
	 * Assign the given input channel to the supplied groups, making it active
	 * or inactive dependent on `active`.
	 *
	 * @param inputChannel
	 *   The input channel to alter in groups.
	 * @param active
	 *   Whether to make the input channel active or inactive in the groups.
	 * @param groups
	 *   The groups to activate it in.
	 */
	assignInputChannelToGroups(inputChannel: number, active: boolean, groups: readonly number[]): void {
		this.#assignSourceToSinks(inputChannel, active, groups, ['inputChannel', 'group'])
	}

	/**
	 * Assign the given group to the supplied mixes (possibly including the LR
	 * mix), making it active or inactive dependent on `active`.
	 *
	 * @param group
	 *   The group to alter in mixes.
	 * @param active
	 *   Whether to make the group active or inactive in the mixes.
	 * @param mixes
	 *   The mixes to activate it in, potentially including the LR mix.
	 */
	assignGroupToMixesAndLR(group: number, active: boolean, mixes: readonly MixOrLR[]): void {
		this.#assignSourceToMixesAndLR(group, 'group', active, mixes)
	}

	/**
	 * Assign the given FX return to the supplied mixes (possibly including the
	 * LR mix), making it active or inactive dependent on `active`.
	 *
	 * @param fxReturn
	 *   The FX return to alter in mixes.
	 * @param active
	 *   Whether to make the FX return active or inactive in the mixes.
	 * @param mixes
	 *   The mixes to activate it in, potentially including the LR mix.
	 */
	assignFXReturnToMixesAndLR(fxReturn: number, active: boolean, mixes: readonly MixOrLR[]): void {
		this.#assignSourceToMixesAndLR(fxReturn, 'fxReturn', active, mixes)
	}

	/**
	 * Assign the given FX return to the supplied groups, making it active
	 * or inactive dependent on `active`.
	 *
	 * @param fxReturn
	 *   The FX return to alter in groups.
	 * @param active
	 *   Whether to make the FX return active or inactive in the groups.
	 * @param groups
	 *   The groups to activate it in.
	 */
	assignFXReturnToGroups(fxReturn: number, active: boolean, groups: readonly number[]): void {
		this.#assignSourceToSinks(fxReturn, active, groups, ['fxReturn', 'group'])
	}

	/**
	 * Assign the given input channel to the supplied FX sends, making it active
	 * or inactive dependent on `active`.
	 *
	 * @param inputChannel
	 *   The input channel to alter in FX sends.
	 * @param active
	 *   Whether to make the input channel active or inactive in the FX sends.
	 * @param fxSends
	 *   The FX sends to activate it in.
	 */
	assignInputChannelToFXSends(inputChannel: number, active: boolean, fxSends: readonly number[]): void {
		this.#assignSourceToSinks(inputChannel, active, fxSends, ['inputChannel', 'fxSend'])
	}

	/**
	 * Assign the given group to the supplied FX sends, making it active or
	 * inactive dependent on `active`.
	 *
	 * @param group
	 *   The group to alter in FX sends.
	 * @param active
	 *   Whether to make the group active or inactive in the FX sends.
	 * @param fxSends
	 *   The FX sends to activate it in.
	 */
	assignGroupToFXSends(group: number, active: boolean, fxSends: readonly number[]): void {
		this.#assignSourceToSinks(group, active, fxSends, ['group', 'fxSend'])
	}

	/**
	 * Assign the given FX return to the supplied FX sends, making it active or
	 * inactive dependent on `active`.
	 *
	 * @param fxReturn
	 *   The FX return to alter in FX sends.
	 * @param active
	 *   Whether to make the group active or inactive in the FX sends.
	 * @param fxSends
	 *   The FX sends to activate it in.
	 */
	assignFXReturnToFXSends(fxReturn: number, active: boolean, fxSends: readonly number[]): void {
		this.#assignSourceToSinks(fxReturn, active, fxSends, ['fxReturn', 'fxSend'])
	}

	/**
	 * Assign the LR mix to the supplied matrixes, making it active or inactive
	 * dependent on `active`.
	 *
	 * @param active
	 *   Whether to make the LR mix active or inactive in the matrixes.
	 * @param matrixes
	 *   The matrixes to activate it in.
	 */
	assignLRToMatrixes(active: boolean, matrixes: readonly number[]): void {
		this.#assignSourceToSinks(0, active, matrixes, ['lr', 'matrix'])
	}

	/**
	 * Assign mix `mix` to the supplied matrixes, making it active or inactive
	 * dependent on `active`.
	 *
	 * @param mix
	 *   The mix to alter in matrixes.
	 * @param active
	 *   Whether to make the mix active or inactive in the matrixes.
	 * @param matrixes
	 *   The matrixes to activate it in.
	 */
	assignMixToMatrixes(mix: number, active: boolean, matrixes: readonly number[]): void {
		this.#assignSourceToSinks(mix, active, matrixes, ['mix', 'matrix'])
	}

	/**
	 * Assign the given group to the supplied matrixes, making it active or
	 * inactive dependent on `active`.
	 *
	 * @param group
	 *   The group to alter in matrixes.
	 * @param active
	 *   Whether to make the group active or inactive in the   matrixes.
	 * @param matrixes
	 *   The matrixes to activate it in.
	 */
	assignGroupToMatrixes(group: number, active: boolean, matrixes: readonly number[]): void {
		this.#assignSourceToSinks(group, active, matrixes, ['group', 'matrix'])
	}

	/** Send a MIDI command to set the given level NRPN to the given level. */
	#setLevel(nrpn: NRPN<'level'>, level: Level): void {
		const [VC, VF] = nrpnDataFromLevel(level, this.#instance.config.faderLaw)
		this.send(this.#nrpnData(nrpn, VC, VF))

		// XXX Is this really needed?  Won't the mixer's reply indicating the
		//     updated level do this for us, just more slowly?  Or is jumping
		//     the gun intentional, so that the sent level can be immediately
		//     presumed by "what's the current level" queries?
		const { MSB, LSB } = splitNRPN(nrpn)
		this.#instance.setVariableValues({
			[`level_${MSB}.${LSB}`]: level,
		})
	}

	/**
	 * Perform a fade of the level identified by MSB/LSB from level `start` to
	 * level `end` over `fadeTimeMs` milliseconds.  (If `fadeTimeMs === 0`, this
	 * decays into an immediate set to the `end` level.)
	 *
	 * @nrpn nrpn
	 *   The level NRPN to fade.
	 * @param start
	 *   The presumed level before fading starts.
	 * @param end
	 *   The final level upon completion of fading.
	 * @param fadeTimeMs
	 *   The length of time, in milliseconds, that the fading should take.
	 */
	#fadeToLevel(nrpn: NRPN<'level'>, start: Level, end: Level, fadeTimeMs: number): void {
		if (start === end) {
			// *In principle* this function is only called to fade from the
			// actual current level to the desired end level.  But at least the
			// SQ-5 doesn't send updates for parameters changed by recalling a
			// scene, which could result in the end level *never* being
			// established in some edge cases.  Make this case an immediate set
			// to eliminate them.
			fadeTimeMs = 0
		}

		if (fadeTimeMs < 0) {
			this.#instance.log('warn', `Treating fade=${fadeTimeMs} as zero`)
			fadeTimeMs = 0
		}

		// The SQ doesn't expose functionality to smoothly fade to a level over
		// a specified time, so we have to fake it with discrete level-sets.
		//
		// We perform the discrete level-sets as an immediate set and a set at
		// end of the fade, with incremental sets at regular intervals in
		// between.  But if two sets would occur so close to each other as to be
		// effectively impossible to hear (generating TCP traffic to little
		// effect), we only do the second set.
		//
		// To best approximate the smooth line of an ideal fade, *ideally* at
		// each step we'd set the level not of the ideal line at that point, but
		// of the line at time halfway between the current time delta and the
		// time of the next step -- creating a stairstep that (for an increase
		// in level) first rises above the ideal line, then falls below it, then
		// rises above it on at next step, and so on until the final step rises
		// to the end level.
		//
		// Unfortunately A&H don't provide formulas modeling this ideal line in
		// either VC/VF for LinearTaper, or in dB that could be converted back
		// to VC/VF.  (AudioTaper is *specifically designed* so that linear
		// interpolation between VC/VF at current and end does what we want
		// here.  But AudioTaper is low-resolution and isn't even the default.)
		//
		// For now we do (for both fader laws, for consistency) what this module
		// has always done: linearly interpolate in dB space.  Fades will spend
		// too much time in lower dB and too little in higher dB, but it's *a*
		// choice that suffices in the absence of better information.

		if (fadeTimeMs <= FadeStepCoalesceMs) {
			if (fadeTimeMs === 0) {
				this.#setLevel(nrpn, end)
			} else {
				// If the entire duration is short enough to coalesce, only
				// do the end set.
				setTimeout(() => {
					this.#setLevel(nrpn, end)
				}, fadeTimeMs)
			}
			return
		}

		const numericStart = start === '-inf' ? -90 : start
		const totalLevelChange = (end === '-inf' ? -90 : end) - numericStart

		let elapsedMs = 0

		const step = () => {
			// Be defensive and use >=.  This is floating point math, after all.
			if (elapsedMs >= fadeTimeMs) {
				this.#setLevel(nrpn, end)
				return
			}

			// Determine when the next step happens.  (Step coalescing
			// guarantees `remainingMs > FadeStepCoalesceMs` here.)
			const nextStepDeltaMs =
				elapsedMs + FadeStepDurationMs + FadeStepCoalesceMs > fadeTimeMs ? fadeTimeMs - elapsedMs : FadeStepDurationMs

			// Compute the midpoint time between steps, then the level at that
			// midpoint time on a line in dB space.  (As explained above,
			// equal-dB steps aren't ideal, but they get the job done.)  Then
			// jump to that level.
			const numericLevel =
				numericStart + Math.floor(totalLevelChange * ((elapsedMs + nextStepDeltaMs / 2) / fadeTimeMs))
			const level: Level = numericLevel <= -90 ? '-inf' : 10 <= numericLevel ? 10 : numericLevel
			this.#setLevel(nrpn, level)

			// Wait and take the next step.
			setTimeout(() => {
				elapsedMs += nextStepDeltaMs
				step()
			}, nextStepDeltaMs)
		}

		step()
	}

	/**
	 * Fade the level of the given source in the given sink from `start` to
	 * `end` over `fadeTimeMs` milliseconds.  (If the current level is not
	 * `start`, the fade will begin with an immediate jump to a level
	 * approximately `start`, then fade to `end` as instructed.)
	 *
	 * For this method's purposes, LR is not a mix, rather its own source/sink
	 * type.  To specify LR as source or sink, specify `0, 'lr'` as the relevant
	 * argument pair.
	 *
	 * @param source
	 *   The number of the source within its type, e.g. `0` for input channel 1.
	 * @param sourceType
	 *   The type that `source` is, e.g. `'inputChannel'` for input channel 1.
	 * @param sink
	 *   The number of the sink within its type, e.g. `2` for group 3.
	 * @param sinkType
	 *   The type that `sink` is, e.g. `'group'` for group 3.
	 * @param levelType
	 *   The particular level type being faded.
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The duration of the fade in milliseconds.  (The fade decays into a
	 *   direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	#fadeSourceLevelInSink(
		source: number,
		sink: number,
		sourceSink: SourceSinkForNRPN<'level'>,
		start: Level,
		end: Level,
		fadeTimeMs: number,
	): void {
		const nrpn = LevelNRPNCalculator.get(this.model, sourceSink).calculate(source, sink)
		this.#fadeToLevel(nrpn, start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given input channel in the given mix from `start`
	 * to `end` over `fadeTimeMs` milliseconds.
	 */
	fadeInputChannelLevelInMix(inputChannel: number, mix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(inputChannel, mix, ['inputChannel', 'mix'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given input channel in LR from `start` to `end`
	 * over `fadeTimeMs` milliseconds.
	 */
	fadeInputChannelLevelInLR(inputChannel: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(inputChannel, 0, ['inputChannel', 'lr'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given group in the given mix from `start` to `end`
	 * over `fadeTimeMs` milliseconds.
	 */
	fadeGroupLevelInMix(group: number, mix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(group, mix, ['group', 'mix'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given group in LR from `start` to `end` over
	 * `fadeTimeMs` milliseconds.
	 */
	fadeGroupLevelInLR(group: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(group, 0, ['group', 'lr'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given FX return in the given mix from `start` to
	 * `end` over `fadeTimeMs` milliseconds.
	 */
	fadeFXReturnLevelInMix(fxReturn: number, mix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(fxReturn, mix, ['fxReturn', 'mix'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given FX return in LR from `start` to `end` over
	 * `fadeTimeMs` milliseconds.
	 */
	fadeFXReturnLevelInLR(fxReturn: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(fxReturn, 0, ['fxReturn', 'lr'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given input channel in the given FX send from
	 * `start` to `end` over `fadeTimeMs` milliseconds.
	 */
	fadeInputChannelLevelInFXSend(
		inputChannel: number,
		fxSend: number,
		start: Level,
		end: Level,
		fadeTimeMs: number,
	): void {
		this.#fadeSourceLevelInSink(inputChannel, fxSend, ['inputChannel', 'fxSend'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given group in the given FX send from `start` to
	 * `end` over `fadeTimeMs` milliseconds.
	 */
	fadeGroupLevelInFXSend(group: number, fxSend: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(group, fxSend, ['group', 'fxSend'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given FX return in the given FX send from `start`
	 * to `end` over `fadeTimeMs` milliseconds.
	 */
	fadeFXReturnLevelInFXSend(fxReturn: number, fxSend: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(fxReturn, fxSend, ['fxReturn', 'fxSend'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given mix in the given matrix from `start` to `end`
	 * over `fadeTimeMs` milliseconds.
	 */
	fadeMixLevelInMatrix(mix: number, matrix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(mix, matrix, ['mix', 'matrix'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of LR in the given matrix from `start` to `end` over
	 * `fadeTimeMs` milliseconds.
	 */
	fadeLRLevelInMatrix(matrix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(0, matrix, ['lr', 'matrix'], start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given group in the given matrix from `start` to
	 * `end` over `fadeTimeMs` milliseconds.
	 */
	fadeGroupLevelInMatrix(group: number, matrix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSourceLevelInSink(group, matrix, ['group', 'matrix'], start, end, fadeTimeMs)
	}

	/**
	 * Set the pan/balance of a source-to-sink parameter (or sink used as
	 * output) identified by its NRPN.
	 *
	 * @param nrpn
	 *   The NRPN of the desired pan/balance parameter.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 */
	#setPanBalance(nrpn: NRPN<'panBalance'>, panBalance: PanBalanceChoice): void {
		let modifyPanBalanceCommand
		switch (panBalance) {
			// Step Right
			case 998:
				modifyPanBalanceCommand = this.#nrpnIncrement(nrpn, 0)
				break
			// Step Left
			case 999:
				modifyPanBalanceCommand = this.#nrpnDecrement(nrpn, 0)
				break
			// 'L100', 'L95', ..., 'L5', CTR', 'R5', ..., 'R95', 'R100'
			default: {
				const [VC, VF] = panBalanceLevelToVCVF(panBalance)

				modifyPanBalanceCommand = this.#nrpnData(nrpn, VC, VF)
			}
		}

		// XXX
		void this.sendCommands([
			modifyPanBalanceCommand,
			// Query the new pan/balance value to update its variable.
			// XXX check later -- possibly only stepping left/right need this
			this.getNRPNValue(nrpn),
		])
	}

	/**
	 * Set the pan/balance of `source` within `mix` (which may be LR).
	 *
	 * @param source
	 *   A source, e.g. a value in the range `[0, 12)` if `source` is a group
	 *   and the mixer supports 12 groups.
	 * @param sourceType
	 *   The type of `source`.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param mixOrLR
	 *   The mix (or LR) in which `source`'s pan/balance level will be adjusted,
	 *   e.g. `2` for Aux 3.
	 */
	#setPanBalanceInMixOrLR(
		source: number,
		sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
		panBalance: PanBalanceChoice,
		mixOrLR: MixOrLR,
	): void {
		if (mixOrLR === LR) {
			const calc = BalanceNRPNCalculator.get(this.model, [sourceType, 'lr'])
			const nrpn = calc.calculate(source, 0)
			this.#setPanBalance(nrpn, panBalance)
		} else {
			const calc = BalanceNRPNCalculator.get(this.model, [sourceType, 'mix'])
			const nrpn = calc.calculate(source, mixOrLR)
			this.#setPanBalance(nrpn, panBalance)
		}
	}

	/**
	 * Set the pan/balance of `source` within `sink`.
	 *
	 * @param source
	 *   A source, e.g. a value in the range `[0, 12)` if `source` is a group
	 *   being assigned to mixes and the mixer supports 12 groups.
	 * @param sourceType
	 *   The type of `source`.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param sink
	 *   The numbered sink in which `source`'s pan/balance level will be
	 *   adjusted, e.g. `2` for Aux 3.
	 * @param sinkType
	 *   The type of `sink`.
	 * @param paramsType
	 *   An identifier determining the base MSB/LSB for the desired
	 *   pan/balance level of `source` in `sink`.
	 */
	#setPanBalanceInSink(
		source: number,
		panBalance: PanBalanceChoice,
		sink: number,
		sourceSink: SourceSinkForNRPN<'panBalance'>,
	) {
		const calc = BalanceNRPNCalculator.get(this.model, sourceSink)
		const nrpn = calc.calculate(source, sink)
		this.#setPanBalance(nrpn, panBalance)
	}

	/**
	 * Set the pan/balance of an input channel within a mix (which may be LR).
	 *
	 * @param channel
	 *   An input channel, e.g. `3` for input channel 4.
	 * @param pan
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param mixOrLR
	 *   A mix, e.g. `2` for Aux 3, or LR.
	 */
	setInputChannelPanBalanceInMixOrLR(channel: number, pan: PanBalanceChoice, mixOrLR: MixOrLR): void {
		this.#setPanBalanceInMixOrLR(channel, 'inputChannel', pan, mixOrLR)
	}

	/**
	 * Set the pan/balance of a group within a mix (which may be LR).
	 *
	 * @param group
	 *   A group, e.g. `1` for group 2.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param mixOrLR
	 *   A mix, e.g. `2` for Aux 3, or LR.
	 */
	setGroupPanBalanceInMixOrLR(group: number, panBalance: PanBalanceChoice, mixOrLR: MixOrLR): void {
		this.#setPanBalanceInMixOrLR(group, 'group', panBalance, mixOrLR)
	}

	/**
	 * Set the pan/balance of an FX return within a mix (which may be LR).
	 *
	 * @param fxReturn
	 *   An FX return, e.g. `1` for FX return 2.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param mixOrLR
	 *   A mix, e.g. `2` for Aux 3, or LR.
	 */
	setFXReturnPanBalanceInMixOrLR(fxReturn: number, panBalance: PanBalanceChoice, mixOrLR: MixOrLR): void {
		this.#setPanBalanceInMixOrLR(fxReturn, 'fxReturn', panBalance, mixOrLR)
	}

	/**
	 * Set the pan/balance of LR within a matrix.
	 *
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param matrix
	 *   A matrix, e.g. `2` for matrix 3.
	 */
	setLRPanBalanceInMatrix(panBalance: PanBalanceChoice, matrix: number): void {
		this.#setPanBalanceInSink(0, panBalance, matrix, ['lr', 'matrix'])
	}

	/**
	 * Set the pan/balance of a mix within a matrix.
	 *
	 * @param mix
	 *   A mix, e.g. `2` for Aux 3.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param matrix
	 *   A matrix, e.g. `2` for matrix 3.
	 */
	setMixPanBalanceInMatrix(mix: number, panBalance: PanBalanceChoice, matrix: number): void {
		this.#setPanBalanceInSink(mix, panBalance, matrix, ['mix', 'matrix'])
	}

	/**
	 * Set the pan/balance of a mix within a matrix.
	 *
	 * @param group
	 *   A group, e.g. `2` for Group 3.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param matrix
	 *   A matrix, e.g. `2` for matrix 3.
	 */
	setGroupPanBalanceInMatrix(group: number, panBalance: PanBalanceChoice, matrix: number): void {
		this.#setPanBalanceInSink(group, panBalance, matrix, ['group', 'matrix'])
	}

	/**
	 * Fade the level of the given sink used as a mixer output from `start` to
	 * `end` over `fadeTimeMs` milliseconds.
	 *
	 * @param sink
	 *   The number of the sink within its type, e.g. `2` for mix 3.
	 * @param sinkType
	 *   The type that `sink` is, e.g. `'mix'` for mix 3.
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The amount of time, in milliseconds, that the fade should take.  (The
	 *   fade will decay into a direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	#fadeSinkAsOutput(
		sink: number,
		sinkType: SinkAsOutputForNRPN<'level'>,
		start: Level,
		end: Level,
		fadeTimeMs: number,
	): void {
		const calc = OutputLevelNRPNCalculator.get(this.model, sinkType)
		const param = calc.calculate(sink)
		this.#fadeToLevel(param, start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of LR used as a mixer output from `start` to `end` over
	 * `fadeTimeMs` milliseconds.
	 *
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The amount of time, in milliseconds, that the fade should take.  (The
	 *   fade will decay into a direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	fadeLROutputLevel(start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSinkAsOutput(0, 'lr', start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given mix used as a mixer output from `start` to
	 * `end` over `fadeTimeMs` milliseconds.
	 *
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The amount of time, in milliseconds, that the fade should take.  (The
	 *   fade will decay into a direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	fadeMixOutputLevel(mix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSinkAsOutput(mix, 'mix', start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given FX send used as a mixer output from `start`
	 * to `end` over `fadeTimeMs` milliseconds.
	 *
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The amount of time, in milliseconds, that the fade should take.  (The
	 *   fade will decay into a direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	fadeFXSendOutputLevel(fxSend: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSinkAsOutput(fxSend, 'fxSend', start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given matrix used as a mixer output from `start`
	 * to `end` over `fadeTimeMs` milliseconds.
	 *
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The amount of time, in milliseconds, that the fade should take.  (The
	 *   fade will decay into a direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	fadeMatrixOutputLevel(matrix: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSinkAsOutput(matrix, 'matrix', start, end, fadeTimeMs)
	}

	/**
	 * Fade the level of the given DCA used as a mixer output from `start` to
	 * `end` over `fadeTimeMs` milliseconds.
	 *
	 * @param start
	 *   The presumed level at start of the fade.  (This *should* be equal to
	 *   the current level; if it isn't, the effect will be to immediately jump
	 *   to a level near `start` and then fade from that to `end` over
	 *   `fadeTimeMs`.)
	 * @param end
	 *   The desired level at end of the fade.
	 * @param fadeTimeMs
	 *   The amount of time, in milliseconds, that the fade should take.  (The
	 *   fade will decay into a direct jump to `end` if `fadeTimeMs === 0`.)
	 */
	fadeDCAOutputLevel(dca: number, start: Level, end: Level, fadeTimeMs: number): void {
		this.#fadeSinkAsOutput(dca, 'dca', start, end, fadeTimeMs)
	}

	/**
	 * Set the pan/balance of a `sink` of type `sinkType` when assigned to
	 * physical mixer outputs.
	 *
	 * @param sink
	 *   A sink, e.g. a value in the range `[0, 3)` if `sink` is a matrix
	 *   and the mixer supports 3 mixes.
	 * @param sinkType
	 *   The type of `sink`.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 */
	#setPanBalanceSinkAsOutput(
		sink: number,
		sinkType: SinkAsOutputForNRPN<'panBalance'>,
		panBalance: PanBalanceChoice,
	): void {
		const calc = OutputBalanceNRPNCalculator.get(this.model, sinkType)
		const nrpn = calc.calculate(sink)
		this.#setPanBalance(nrpn, panBalance)
	}

	/**
	 * Set the balance of LR when assigned to physical mixer outputs.
	 *
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 */
	setLROutputPanBalance(panBalance: PanBalanceChoice): void {
		this.#setPanBalanceSinkAsOutput(0, 'lr', panBalance)
	}

	/**
	 * Set the balance of a mix (not including LR) when assigned to physical
	 * mixer outputs.
	 *
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 */
	setMixOutputPanBalance(mix: number, panBalance: PanBalanceChoice): void {
		this.#setPanBalanceSinkAsOutput(mix, 'mix', panBalance)
	}

	/**
	 * Set the balance of a matrix when assigned to physical mixer outputs.
	 *
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 */
	setMatrixOutputPanBalance(matrix: number, panBalance: PanBalanceChoice): void {
		this.#setPanBalanceSinkAsOutput(matrix, 'matrix', panBalance)
	}

	/** Press (and do not subsequently release) a softkey. */
	pressSoftKey(softKey: number): void {
		if (softKey < 0 || this.model.softKeys <= softKey) {
			throw new Error(`Attempting to press invalid softkey ${softKey}`)
		}

		const command = [0x90 | this.#instance.config.midiChannel, 0x30 + softKey, 0x7f]
		// XXX
		void this.sendCommands([command])
	}

	/** Release a previously-pressed softkey. */
	releaseSoftKey(softKey: number): void {
		if (softKey < 0 || this.model.softKeys <= softKey) {
			throw new Error(`Attempting to release invalid softkey ${softKey}`)
		}

		const command = [0x80 | this.#instance.config.midiChannel, 0x30 + softKey, 0x00]
		// XXX
		void this.sendCommands([command])
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
	#nrpnData<T extends NRPNType>(nrpn: NRPN<T>, vc: number, vf: number): NRPNDataMessage {
		const { MSB, LSB } = splitNRPN(nrpn)
		const BN = 0xb0 | this.#instance.config.midiChannel
		return [BN, 0x63, MSB, BN, 0x62, LSB, BN, 0x06, vc, BN, 0x26, vf]
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
	#nrpnIncrement<T extends NRPNType>(nrpn: NRPN<T>, val: number): NRPNIncDecMessage {
		const { MSB, LSB } = splitNRPN(nrpn)
		const BN = 0xb0 | this.#instance.config.midiChannel
		return [BN, 0x63, MSB, BN, 0x62, LSB, BN, 0x60, val]
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
	#nrpnDecrement<T extends NRPNType>(nrpn: NRPN<T>, val: number): NRPNIncDecMessage {
		const { MSB, LSB } = splitNRPN(nrpn)
		const BN = 0xb0 | this.#instance.config.midiChannel
		return [BN, 0x63, MSB, BN, 0x62, LSB, BN, 0x61, val]
	}
}
