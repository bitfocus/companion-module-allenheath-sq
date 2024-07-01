import { type CompanionVariableValue, InstanceStatus } from '@companion-module/base'
import type { Level as InstanceLevel, SQInstanceInterface as sqInstance } from '../instance-interface.js'
import { MidiSession, type NRPNDataMessage } from '../midi/session.js'
import { type InputOutputType, Model } from './model.js'
import type { ModelId } from './models.js'
import { panBalanceLevelToVCVF } from './pan-balance.js'
import {
	AssignToMixOrLRBase,
	type AssignToMixOrLRType,
	AssignToSinkBase,
	type AssignToSinkType,
	computeLRParameters,
	computeParameters,
	MuteBases,
	type MuteType,
	PanBalanceInMixOrLRBase,
	type PanBalanceInMixOrLRType,
	PanBalanceInSinkBase,
	type PanBalanceInSinkType,
	PanBalanceOutput,
	type Param,
} from './parameters.js'
import { dBToDec } from '../utils.js'
import { type Level, levelFromNRPNData } from './level.js'
import type { PanBalanceChoice } from '../actions/pan-balance.js'

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

export enum MuteOperation {
	Toggle = 0,
	On = 1,
	Off = 2,
}

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

	/** The NRPN fader law setting in the mixer. */
	faderLaw: FaderLaw = 'LinearTaper'

	/**
	 * The MIDI transport used to interact with the mixer.
	 */
	midi: MidiSession

	/**
	 * A store of current mute status for mixer inputs/outputs.  Keys have the
	 * form `"mute_${MSB}.${LSB}"`, where `MSB` and `LSB` come from the "Mute
	 * Parameter Numbers" reference table in the
	 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
	 */
	readonly fdbState: { [key: `mute_${number}.${number}`]: boolean } = {}

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
	 * @param instance
	 *   The instance controlling this mixer.
	 */
	constructor(instance: sqInstance, model: ModelId) {
		this.#instance = instance
		this.model = new Model(model)
		this.midi = new MidiSession(this, instance)
	}

	/**
	 * Start operating an SQ mixer running at `host:51325`.  Retrieve current
	 * mixer status consistent with `retrieveStatus`, and log mixer interactions
	 * consistent with `verbose`.
	 *
	 * @param host
	 *   The hostname/IP address of the mixer.
	 * @param midiChannel
	 *   The MIDI channel setting used by the mixer.  (This will be 0-15 for
	 *   channels 1-16 as displayed in mixer UI.)
	 * @param faderLaw
	 *    The NRPN fader law set in the mixer.
	 * @param retrieveStatus
	 *   When/how to retrieve the current status of mixer levels and routing.
	 * @param verbose
	 *   Whether verbose logging of mixer operations should be enabled.
	 */
	start(host: string, midiChannel: number, faderLaw: FaderLaw, retrieveStatus: string, verbose: boolean): void {
		this.faderLaw = faderLaw
		this.midi.start(host, midiChannel, retrieveStatus, verbose)
	}

	/** Stop this mixer connection. */
	stop(status = InstanceStatus.Disconnected): void {
		this.midi.stop(status)
	}

	dBToDec(lv: InstanceLevel, typ = this.faderLaw): [number, number] {
		return dBToDec(lv, typ) as any
	}

	/**
	 * Convert a `VC`/`VF` data byte pair from a fader level message to a
	 * `Level` value consistent with the mixer's active fader law.
	 *
	 * @param vc
	 *   The `VC` byte from the NRPN data message, in range `[0x00, 0x7f)`.
	 * @param vf
	 *   The `VF` byte from the NRPN data message, in range `[0x00, 0x7f)`.
	 * @returns
	 *   The approximate encoded `Level`.
	 */
	levelFromNRPNData(vc: number, vf: number): Level {
		return levelFromNRPNData(vc, vf, this.faderLaw)
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
		if (scene < 0 || this.model.count.scene <= scene) {
			throw new Error(`Attempting to set out-of-bounds scene ${scene}`)
		}

		const midi = this.midi
		// XXX handle better
		void midi.sendCommands([midi.sceneChange(scene)])
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
			const sceneCount = this.model.count.scene
			if (sceneCount <= newScene) {
				newScene = sceneCount - 1
			}
		}

		this.setScene(newScene)
	}

	/** Perform the supplied mute operation upon the strip of the given type. */
	#mute(strip: number, type: MuteType, op: MuteOperation): void {
		if (this.model.count[type] <= strip) {
			throw new Error(`Attempting to mute invalid ${type} ${strip}`)
		}

		const { MSB, LSB } = MuteBases[type]
		const key = `mute_${MSB}.${LSB + strip}` as const

		const fdbState = this.fdbState
		if (op !== MuteOperation.Toggle) {
			fdbState[key] = op === MuteOperation.On
		} else {
			fdbState[key] = !fdbState[key]
		}

		const midi = this.midi

		this.#instance.checkFeedbacks()
		const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(fdbState[key]))]
		// XXX
		void midi.sendCommands(commands)
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
	 * Assign a `source` to LR or remove its assignment, depending on `active`.
	 *
	 * @param source
	 *   The number of the source to assign, counting from zero.
	 * @param active
	 *   If `true`, the source will be made active in LR.  If `false`, it will
	 *   be made inactive.
	 * @param base
	 *   `MSB`/`LSB` referring to the expected source if `source === 0`.
	 */
	#assignToLR(source: number, active: boolean, base: Param): NRPNDataMessage {
		const { MSB, LSB } = computeLRParameters(source, base)

		return this.midi.nrpnData(MSB, LSB, 0, active ? 1 : 0)
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
	 * @param sinkType
	 *   TThe type of sink that `sink` is.
	 * @param base
	 *   `MSB`/`LSB` referring to the expected source if `source === 0`.
	 * @returns {number[]}
	 */
	#assignToSink(
		source: number,
		active: boolean,
		sink: number,
		sinkType: InputOutputType,
		base: Param,
	): NRPNDataMessage {
		const sinkCount = this.model.count[sinkType]
		if (sinkCount <= sink) {
			throw new Error(`Attempting to assign to nonexistent ${sinkType} ${sink}`)
		}

		const { MSB, LSB } = computeParameters(source, sink, sinkCount, base)

		return this.midi.nrpnData(MSB, LSB, 0, active ? 1 : 0)
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
		sourceType: AssignToMixOrLRType,
		active: boolean,
		mixes: readonly number[],
	): void {
		const count = this.model.count
		if (count[sourceType] <= source) {
			throw new Error(`Attempting to assign out-of-range ${sourceType} ${source}`)
		}

		const { normal, lr } = AssignToMixOrLRBase[sourceType]

		const commands = mixes.map((sink) => {
			return sink === 99
				? this.#assignToLR(source, active, lr)
				: this.#assignToSink(source, active, sink, 'mix', normal)
		})

		// XXX
		void this.midi.sendCommands(commands)
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
		sourceType: InputOutputType,
		active: boolean,
		sinks: readonly number[],
		sinkType: InputOutputType,
		paramsType: AssignToSinkType,
	): void {
		const count = this.model.count
		if (count[sourceType] <= source) {
			throw new Error(`Attempting to assign out-of-range ${sourceType} ${source}`)
		}

		const params = AssignToSinkBase[paramsType]

		const commands = sinks.map((sink) => {
			return this.#assignToSink(source, active, sink, sinkType, params)
		})

		// XXX
		void this.midi.sendCommands(commands)
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
	assignInputChannelToMixesAndLR(inputChannel: number, active: boolean, mixes: readonly number[]): void {
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
		this.#assignSourceToSinks(inputChannel, 'inputChannel', active, groups, 'group', 'inputChannel-group')
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
	assignGroupToMixesAndLR(group: number, active: boolean, mixes: readonly number[]): void {
		this.#assignSourceToMixesAndLR(group, 'group', active, mixes)
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
		this.#assignSourceToSinks(fxReturn, 'fxReturn', active, groups, 'group', 'fxReturn-group')
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
		this.#assignSourceToSinks(inputChannel, 'inputChannel', active, fxSends, 'fxSend', 'inputChannel-fxSend')
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
		this.#assignSourceToSinks(group, 'group', active, fxSends, 'fxSend', 'group-fxSend')
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
		this.#assignSourceToSinks(fxReturn, 'fxReturn', active, fxSends, 'fxSend', 'fxReturn-fxSend')
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
		// Treat LR as if it were the sole source in a one-element source
		// category.
		this.#assignSourceToSinks(0, 'lr', active, matrixes, 'matrix', 'lr-matrix')
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
		this.#assignSourceToSinks(mix, 'mix', active, matrixes, 'matrix', 'mix-matrix')
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
		this.#assignSourceToSinks(group, 'group', active, matrixes, 'matrix', 'group-matrix')
	}

	/**
	 * Set the pan/balance of `source` in the sink `sink` of type `sinkType`.
	 *
	 * @param source
	 *   A source, e.g. a value in the range `[0, 12)` if `source` is a group
	 *   and the mixer supports 12 groups.  It must be in the valid range for
	 *   the type its caller intends: this function won't (and can't) do any
	 *   range-checking.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param sink
	 *   The numbered sink in which `source`'s pan/balance level will be
	 *   adjusted, e.g. `2` for Aux 3.
	 * @param sinkType
	 *   The type of `sink`.
	 * @param base
	 *   The base MSB/LSB for the desired source-to-sink pan/balance settings.
	 */
	#setPanBalance(
		source: number,
		panBalance: PanBalanceChoice,
		sink: number,
		sinkType: InputOutputType,
		base: Param,
	): void {
		const sinkCount = this.model.count[sinkType]
		if (sinkCount <= sink) {
			throw new Error(`Attempting to assign to nonexistent ${sinkType} ${sink}`)
		}

		const { MSB, LSB } = computeParameters(source, sink, sinkCount, base)

		const midi = this.midi

		let modifyPanBalanceCommand
		switch (panBalance) {
			// Step Right
			case 998:
				modifyPanBalanceCommand = midi.nrpnIncrement(MSB, LSB, 0)
				break
			// Step Left
			case 999:
				modifyPanBalanceCommand = midi.nrpnDecrement(MSB, LSB, 0)
				break
			// 'L100', 'L95', ..., 'L5', CTR', 'R5', ..., 'R95', 'R100'
			default: {
				const [VC, VF] = panBalanceLevelToVCVF(panBalance)

				modifyPanBalanceCommand = midi.nrpnData(MSB, LSB, VC, VF)
			}
		}

		// XXX
		void midi.sendCommands([
			modifyPanBalanceCommand,
			// Query the new pan/balance value to update its variable.
			// XXX check later -- possibly only stepping left/right need this
			midi.nrpnIncrement(MSB, LSB, 0x7f),
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
		sourceType: PanBalanceInMixOrLRType,
		panBalance: PanBalanceChoice,
		mixOrLR: number,
	): void {
		const count = this.model.count
		if (count[sourceType] <= source) {
			throw new Error(`Attempting to set pan/balance for out-of-range ${sourceType} ${source}`)
		}

		const { normal, lr } = PanBalanceInMixOrLRBase[sourceType]

		if (mixOrLR === 99) {
			this.#setPanBalance(source, panBalance, 0, 'lr', lr)
		} else {
			this.#setPanBalance(source, panBalance, mixOrLR, 'mix', normal)
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
		sourceType: InputOutputType,
		panBalance: PanBalanceChoice,
		sink: number,
		sinkType: InputOutputType,
		paramsType: PanBalanceInSinkType,
	) {
		const count = this.model.count
		if (count[sourceType] <= source) {
			throw new Error(`Attempting to set pan/balance for out-of-range ${sourceType} ${source}`)
		}

		const params = PanBalanceInSinkBase[paramsType]

		this.#setPanBalance(source, panBalance, sink, sinkType, params)
	}

	/**
	 * Set the pan/balance of an input channel within a mix (which may be LR).
	 *
	 * @param channel
	 *   An input channel, e.g. `3` for input channel 4.
	 * @param pan
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param mixOrLR
	 *   A mix, e.g. `2` for Aux 3, or LR (encoded as `99`).
	 */
	setInputChannelPanBalanceInMixOrLR(channel: number, pan: PanBalanceChoice, mixOrLR: number): void {
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
	 *   A mix, e.g. `2` for Aux 3, or LR (encoded as `99`).
	 */
	setGroupPanBalanceInMixOrLR(group: number, panBalance: PanBalanceChoice, mixOrLR: number): void {
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
	 *   A mix, e.g. `2` for Aux 3, or LR (encoded as `99`).
	 */
	setFXReturnPanBalanceInMixOrLR(fxReturn: number, panBalance: PanBalanceChoice, mixOrLR: number): void {
		this.#setPanBalanceInMixOrLR(fxReturn, 'fxReturn', panBalance, mixOrLR)
	}

	/**
	 * Set the pan/balance of an FX return within a group.
	 *
	 * @param fxReturn
	 *   An FX return, e.g. `1` for FX return 2.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 * @param group
	 *   A group, e.g. `2` for group 3.
	 */
	setFXReturnPanBalanceInGroup(fxReturn: number, panBalance: PanBalanceChoice, group: number): void {
		this.#setPanBalanceInSink(fxReturn, 'fxReturn', panBalance, group, 'group', 'fxReturn-group')
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
		this.#setPanBalanceInSink(0, 'lr', panBalance, matrix, 'matrix', 'lr-matrix')
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
		this.#setPanBalanceInSink(mix, 'mix', panBalance, matrix, 'matrix', 'mix-matrix')
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
		this.#setPanBalanceInSink(group, 'group', panBalance, matrix, 'matrix', 'group-matrix')
	}

	/**
	 * Set the pan/balance of any of various outputs in their own right, not fed
	 * into anything.  (For example, this can be used to pan LR all the way left
	 * or right.)
	 *
	 * @param fader
	 *   A fader value from the list of valid choices.
	 * @param panBalance
	 *   A pan/balance choice; see `createPanLevels` for details.
	 */
	setOutputPanBalance(fader: number, panBalance: PanBalanceChoice): void {
		// Abuse LR as a "sink" whose category contains exactly one element to
		// make the MSB/LSB parameter math do the desired thing.
		this.#setPanBalance(fader, panBalance, 0, 'lr', PanBalanceOutput)
	}

	/** Press (and do not subsequently release) a softkey. */
	pressSoftKey(softKey: number): void {
		if (softKey < 0 || this.model.count.softKey <= softKey) {
			throw new Error(`Attempting to press invalid softkey ${softKey}`)
		}

		const midi = this.midi
		const command = [0x90 | midi.channel, 0x30 + softKey, 0x7f]
		// XXX
		void midi.sendCommands([command])
	}

	/** Release a previously-pressed softkey. */
	releaseSoftKey(softKey: number): void {
		if (softKey < 0 || this.model.count.softKey <= softKey) {
			throw new Error(`Attempting to release invalid softkey ${softKey}`)
		}

		const midi = this.midi
		const command = [0x80 | midi.channel, 0x30 + softKey, 0x00]
		// XXX
		void midi.sendCommands([command])
	}
}
