import { type CompanionVariableValue, InstanceStatus } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import { MidiSession } from '../midi/session.js'
import { Model } from './model.js'
import type { ModelId } from './models.js'

/**
 * An abstract representation of an SQ mixer.
 */
export class Mixer {
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
	lastValue: { [key: `level_${number}.${number}`]: CompanionVariableValue } = {}

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
	 * @param retrieveStatus
	 *   When/how to retrieve the current status of mixer levels and routing.
	 * @param verbose
	 *   Whether verbose logging of mixer operations should be enabled.
	 */
	start(host: string, midiChannel: number, retrieveStatus: string, verbose: boolean): void {
		this.midi.start(host, midiChannel, retrieveStatus, verbose)
	}

	/** Stop this mixer connection. */
	stop(status = InstanceStatus.Disconnected): void {
		this.midi.stop(status)
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
	 * @param {number} adjust
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
}
