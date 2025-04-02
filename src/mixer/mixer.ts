import { type CompanionVariableValue, InstanceStatus } from '@companion-module/base'
import type { PanBalanceChoice } from '../actions/pan-balance.js'
import type { sqInstance } from '../instance.js'
import { type Level, levelFromNRPNData, nrpnDataFromLevel } from './level.js'
import { MidiSession, type NRPNDataMessage, type NRPNIncDecMessage } from '../midi/session.js'
import { type InputOutputType, LR, Model } from './model.js'
import { calculateMuteNRPN } from './nrpn/mute.js'
import { OutputBalanceNRPNCalculator, OutputLevelNRPNCalculator, type SinkAsOutputForNRPN } from './nrpn/output.js'
import type { BalanceParam } from './nrpn/param.js'
import {
	AssignNRPNCalculator,
	BalanceNRPNCalculator,
	LevelNRPNCalculator,
	type SourceForSourceInMixAndLRForNRPN,
	type SourceSinkForNRPN,
} from './nrpn/source-to-sink.js'
import { panBalanceLevelToVCVF } from './pan-balance.js'

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

// Level fading in this module historically performed fade steps every 50ms --
// maybe because humans (at least visually; I'm not sure if this applies in the
// audio realm) perceive a cause-effect duration of a tenth of a second as
// immediate and so double that frequency will sound seamless.
const FadeStepDurationMs = 50

// If two fade steps would be performed closer than this duration to each other,
// eliminate the first step and do it all in the second step.
const FadeStepCoalesceMs = 5

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

	/** Create a mixer for the given instance. */
	constructor(instance: sqInstance) {
		this.#instance = instance
		this.model = new Model(instance.options.model)
		this.midi = new MidiSession(this, instance)
	}

	/** Start operating the SQ mixer, using options from the instance. */
	start(host: string): void {
		this.midi.start(host, this.#instance.options.retrieveStatusAtStartup)
	}

	/** Stop this mixer connection. */
	stop(status = InstanceStatus.Disconnected): void {
		this.midi.stop(status)
	}

	/** Compute a mixer "get" command to retrieve the value of an NRPN. */
	getNRPNValue(msb: number, lsb: number): NRPNIncDecMessage {
		return this.midi.nrpnIncrement(msb, lsb, 0x7f)
	}

	/**
	 * Convert a fader level to a `[VC, VF]` data byte pair approximately
	 * equivalent to it under the mixer's current fader law.
	 *
	 * @param level
	 *   The fader level to convert.
	 */
	nrpnDataFromLevel(level: Level): [number, number] {
		return nrpnDataFromLevel(level, this.#instance.options.faderLaw)
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
		return levelFromNRPNData(vc, vf, this.#instance.options.faderLaw)
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
			const sceneCount = this.model.scenes
			if (sceneCount <= newScene) {
				newScene = sceneCount - 1
			}
		}

		this.setScene(newScene)
	}

	/** Perform the supplied mute operation upon the strip of the given type. */
	#mute(strip: number, type: InputOutputType, op: MuteOperation): void {
		const { MSB, LSB } = calculateMuteNRPN(this.model, type, strip)
		const key = `mute_${MSB}.${LSB}` as const

		const fdbState = this.fdbState
		if (op !== MuteOperation.Toggle) {
			fdbState[key] = op === MuteOperation.On
		} else {
			fdbState[key] = !fdbState[key]
		}

		const midi = this.midi

		this.#instance.checkFeedbacks()
		const commands = [midi.nrpnData(MSB, LSB, 0, Number(fdbState[key]))]
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
	 * @param nrpn
	 *   A calculator of the assign NRPN dictated by `source`, `sink`, and their
	 *   types.
	 */
	#assignToSink(source: number, active: boolean, sink: number, nrpn: AssignNRPNCalculator): NRPNDataMessage {
		const { MSB, LSB } = nrpn.calculate(source, sink)
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
		sourceType: SourceForSourceInMixAndLRForNRPN<'assign'>,
		active: boolean,
		mixes: readonly number[],
	): void {
		const mixNrpn = AssignNRPNCalculator.get(this.model, [sourceType, 'mix'])
		const lrNrpn = AssignNRPNCalculator.get(this.model, [sourceType, 'lr'])

		const commands = mixes.map((mixOrLR) => {
			return mixOrLR === LR
				? this.#assignToSink(source, active, 0, lrNrpn)
				: this.#assignToSink(source, active, mixOrLR, mixNrpn)
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
		active: boolean,
		sinks: readonly number[],
		sourceSink: SourceSinkForNRPN<'assign'>,
	): void {
		const nrpn = AssignNRPNCalculator.get(this.model, sourceSink)

		const commands = sinks.map((sink) => {
			return this.#assignToSink(source, active, sink, nrpn)
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
	assignGroupToMixesAndLR(group: number, active: boolean, mixes: readonly number[]): void {
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
	assignFXReturnToMixesAndLR(fxReturn: number, active: boolean, mixes: readonly number[]): void {
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
	#setLevelImmediately(msb: number, lsb: number, level: Level): void {
		const midi = this.midi

		const [VC, VF] = this.nrpnDataFromLevel(level)
		midi.send(midi.nrpnData(msb, lsb, VC, VF))

		// XXX Is this really needed?  Won't the mixer's reply indicating the
		//     updated level do this for us, just more slowly?  Or is jumping
		//     the gun intentional, so that the sent level can be immediately
		//     presumed by "what's the current level" queries?
		this.#instance.setVariableValues({
			[`level_${msb}.${lsb}`]: level,
		})
	}

	/**
	 * Perform a fade of the level identified by MSB/LSB from level `start` to
	 * level `end` over `fadeTimeMs` milliseconds.  (If `fadeTimeMs === 0`, this
	 * decays into an immediate set to the `end` level.)
	 *
	 * @param start
	 *   The presumed level before fading starts.
	 * @param end
	 *   The final level upon completion of fading.
	 * @param fadeTimeMs
	 *   The length of time, in milliseconds, that the fading should take.
	 */
	#fadeToLevel(msb: number, lsb: number, start: Level, end: Level, fadeTimeMs: number): void {
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
				this.#setLevelImmediately(msb, lsb, end)
			} else {
				// If the entire duration is short enough to coalesce, only
				// do the end set.
				setTimeout(() => {
					this.#setLevelImmediately(msb, lsb, end)
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
				this.#setLevelImmediately(msb, lsb, end)
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
			this.#setLevelImmediately(msb, lsb, level)

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
		const { MSB, LSB } = LevelNRPNCalculator.get(this.model, sourceSink).calculate(source, sink)
		this.#fadeToLevel(MSB, LSB, start, end, fadeTimeMs)
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
	#setPanBalance({ MSB, LSB }: BalanceParam, panBalance: PanBalanceChoice): void {
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
			this.getNRPNValue(MSB, LSB),
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
		mixOrLR: number,
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
	 *   A mix, e.g. `2` for Aux 3, or LR.
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
	 *   A mix, e.g. `2` for Aux 3, or LR.
	 */
	setFXReturnPanBalanceInMixOrLR(fxReturn: number, panBalance: PanBalanceChoice, mixOrLR: number): void {
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
		const { MSB, LSB } = calc.calculate(sink)
		this.#fadeToLevel(MSB, LSB, start, end, fadeTimeMs)
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

		const midi = this.midi
		const command = [0x90 | this.#instance.options.midiChannel, 0x30 + softKey, 0x7f]
		// XXX
		void midi.sendCommands([command])
	}

	/** Release a previously-pressed softkey. */
	releaseSoftKey(softKey: number): void {
		if (softKey < 0 || this.model.softKeys <= softKey) {
			throw new Error(`Attempting to release invalid softkey ${softKey}`)
		}

		const midi = this.midi
		const command = [0x80 | this.#instance.options.midiChannel, 0x30 + softKey, 0x00]
		// XXX
		void midi.sendCommands([command])
	}
}
