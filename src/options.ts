import { type ModelId, DefaultModel } from './mixer/models.js'
import type { FaderLaw } from './mixer/mixer.js'
import { RetrieveStatusAtStartup } from './mixer/mixer.js'
import type { SQInstanceConfig } from './config.js'
import { Regex } from '@companion-module/base'

/** Options information controlling the operation of a mixer instance. */
export type SQInstanceOptions = {
	/**
	 * The TCP/IP hostname of the mixer, or null if one was invalidly specified.
	 */
	host: string | null

	/** The model of the mixer. */
	model: ModelId

	/** The fader law specified in the mixer. */
	faderLaw: FaderLaw

	/**
	 * The channel used for talkback (zero-indexed rather than 1-indexed as it
	 * appears in UI).
	 */
	talkbackChannel: number

	/**
	 * The MIDI channel that should be used to communicate with the mixer.
	 * (This is the encoding-level value, i.e. 0-15 rather than 1-16.)
	 */
	midiChannel: number

	/**
	 * How the mixer status (signal levels, etc.) should be retrieved at
	 * startup.
	 */
	retrieveStatusAtStartup: RetrieveStatusAtStartup

	/**
	 * Log a whole bunch of extra information about ongoing operation if verbose
	 * logging is enabled.
	 */
	verbose: boolean
}

function toHost(host: SQInstanceConfig['host']): string | null {
	if (host !== undefined) {
		const hostStr = String(host)
		if (new RegExp(Regex.IP.slice(1, -1)).test(hostStr)) {
			return hostStr
		}
	}

	return null
}

function toModelId(model: SQInstanceConfig['model']): ModelId {
	const modelStr = String(model)
	switch (modelStr) {
		case 'SQ5':
		case 'SQ6':
		case 'SQ7':
			return modelStr
		default:
			return DefaultModel
	}
}

function toFaderLaw(faderLawOpt: SQInstanceConfig['level']): FaderLaw {
	const law = String(faderLawOpt)
	switch (law) {
		case 'LinearTaper':
		case 'AudioTaper':
			return law
		default:
			return 'LinearTaper'
	}
}

function toTalkbackChannel(ch: SQInstanceConfig['talkback']): number {
	return Number(ch || 0)
}

function toMidiChannel(midich: SQInstanceConfig['midich']): number {
	const n = Number(midich || 0)
	if (1 <= n && n <= 16) {
		return n - 1
	}

	return 0
}

function toRetrieveStatusAtStartup(status: SQInstanceConfig['status']): RetrieveStatusAtStartup {
	const retrieveStatus = String(status)
	switch (retrieveStatus) {
		case 'delay':
			return RetrieveStatusAtStartup.Delayed
		case 'nosts':
			return RetrieveStatusAtStartup.None
		case 'full':
		default:
			return RetrieveStatusAtStartup.Fully
	}
}

function toVerbose(verbose: SQInstanceConfig['verbose']): boolean {
	return Boolean(verbose)
}

/** Compute instance options from instance configuration info. */
export function optionsFromConfig({
	// Comments indicate the expected types of the various config fields.
	host, // string
	model, // string
	level, // string
	talkback, // number
	midich, // number
	status, // string
	verbose, // boolean
}: SQInstanceConfig): SQInstanceOptions {
	return {
		host: toHost(host),
		model: toModelId(model),
		faderLaw: toFaderLaw(level),
		talkbackChannel: toTalkbackChannel(talkback),
		midiChannel: toMidiChannel(midich),
		retrieveStatusAtStartup: toRetrieveStatusAtStartup(status),
		verbose: toVerbose(verbose),
	}
}

/**
 * Instance options suitable for use at instance creation, before the actual
 * options are available.
 */
export function noConnectionOptions(): SQInstanceOptions {
	return {
		// Null host ensures that these options won't trigger a connection.
		host: null,
		model: DefaultModel,
		faderLaw: 'LinearTaper',
		talkbackChannel: 0,
		midiChannel: 0,
		retrieveStatusAtStartup: RetrieveStatusAtStartup.Fully,
		verbose: false,
	}
}

/**
 * For an already-started instance/connection using the given old options,
 * determine whether applying the new options to it requires restarting the
 * connection.
 */

export function canUpdateOptionsWithoutRestarting(
	oldOptions: SQInstanceOptions,
	newOptions: SQInstanceOptions,
): boolean {
	// A different host straightforwardly requires a connection restart.
	if (oldOptions.host !== newOptions.host) {
		return false
	}

	// Changing mixer model alters choices used in options.  Choice generation
	// presently is tied to mixer connection restarting, so force a restart if
	// the model changes.
	if (oldOptions.model !== newOptions.model) {
		return false
	}

	// A different fader law changes the meaning of all level messages and can't
	// really be synced up with any messages presently in flight, so forces a
	// restart.
	if (oldOptions.faderLaw !== newOptions.faderLaw) {
		return false
	}

	// Talkback channel is only used in the talkback-controlling presets, which
	// will always reflect the latest talkback channel when added as Companion
	// buttons, so we don't need to restart for a change.

	// Changing MIDI channel could result in messages on old/new MIDI channel
	// being missed, so force a restart.
	if (oldOptions.midiChannel !== newOptions.midiChannel) {
		return false
	}

	// Once the mixer connection is started up, a change in status retrieval
	// option is irrelevant, so don't restart for such change.

	// Verbose logging can be flipped on and off live without restart -- and
	// you really want it to, because verbose logging of 26KB of startup status
	// retrieval is extremely slow (particularly if the instance debug log is
	// open.)

	// Otherwise we can update options without restarting.
	return true
}
