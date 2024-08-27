import { type ModelId, DefaultModel } from './mixer/models.js'
import type { FaderLaw } from './mixer/mixer.js'
import { RetrieveStatusAtStartup } from './mixer/mixer.js'
import { DefaultConnectionLabel, type SQInstanceConfig } from './config.js'
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

	/** The label used to identify this Companion instance/connection. */
	connectionLabel: string
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

function toConnectionLabel(label: SQInstanceConfig['label']): string {
	return typeof label === 'undefined' ? DefaultConnectionLabel : String(label)
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
	label, // string
}: SQInstanceConfig): SQInstanceOptions {
	return {
		host: toHost(host),
		model: toModelId(model),
		faderLaw: toFaderLaw(level),
		talkbackChannel: toTalkbackChannel(talkback),
		midiChannel: toMidiChannel(midich),
		retrieveStatusAtStartup: toRetrieveStatusAtStartup(status),
		verbose: toVerbose(verbose),
		connectionLabel: toConnectionLabel(label),
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
		connectionLabel: DefaultConnectionLabel,
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
	// For now, as in the past, updating any option forces the connection to be
	// restarted.  This will be refined in the future.
	void oldOptions
	void newOptions
	return false
}
