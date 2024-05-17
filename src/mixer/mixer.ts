import { InstanceStatus } from '@companion-module/base'
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
	 * @param retrieveStatus
	 *   When/how to retrieve the current status of mixer levels and routing.
	 * @param verbose
	 *   Whether verbose logging of mixer operations should be enabled.
	 */
	start(host: string, retrieveStatus: string, verbose: boolean): void {
		this.midi.start(host, retrieveStatus, verbose)
	}

	/** Stop this mixer connection. */
	stop(status = InstanceStatus.Disconnected): void {
		this.midi.stop(status)
	}
}
