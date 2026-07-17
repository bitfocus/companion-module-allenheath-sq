import { Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { type FaderLaw, RetrieveStatusAtStartup } from './mixer/mixer.js'
import { DefaultModel, getCommonCount, type ModelId } from './mixer/models.js'
import type { Branded } from './utils/brand.js'
import { type OneIndexed, oneIndexedNumber, type ZeroIndexed, zeroIndexedNumber } from './utils/indexed.js'

const FaderLawOptionId = 'faderLaw'
const TalkbackChannelOptionId = 'talkbackChannel'
const MidiChannelOptionId = 'midiChannel'
const RetrieveStatusOptionId = 'retrieveStatusAtStartup'

/**
 * A less-typed config type suitable for use where a representation less
 * constrained than the actual config type is being worked with -- for example
 * in upgrade scripts and similar contexts.
 */
export type RawConfig = Record<string, unknown>

/** All mixer config options. */
export type SQConfig = {
	// Before the 2.0 module API, nothing ensures that Companion config objects
	// conform to the module `TConfig` type.  Therefore we code accesses
	// extra-defensively in order to deal with wrongly-typed values sneaking in:
	//
	//  * We pass a `SQConfig` received from Companion through `validateConfig`,
	//   which will field-by-field massage an `SQConfig` whose actual value is
	//   potentially not consistent with the `SQConfig` type into true
	//   type-correctness.
	//  * We use accessor `get*` functions, operating on `SQConfig`, to return
	//   well-typed//and validated* values for each configuration option.
	//
	// To illustrate, consider the `host` field.  The user should specify a
	// valid hostname (presently only an IPv4 address), but Companion doesn't
	// enforce this.  At the `validateConfig` step we pass that field through
	// the `toHost` function, which rewrites it only into a `string`, consistent
	// with what Companion's `"textinput"` config field will pass us.  Then when
	// the module wants to know the user's specified host -- and its actual
	// validity as a hostname -- we use `getHost` passing the full `SQConfig`,
	// which will take the now guaranteed `string` field, test whether it's a
	// valid hostname, and return a branded `Host` value for it -- or the empty
	// string if the field doesn't contain a valid hostname.

	/**
	 * The TCP/IP hostname of the mixer, or the empty string if no hostname was
	 * validly specified.
	 */
	host: string

	/** The model of the mixer. */
	model: string

	/** The fader law specified in the mixer. */
	[FaderLawOptionId]: string

	/**
	 * The channel used for talkback (zero-indexed rather than 1-indexed as it
	 * appears in UI).
	 */
	[TalkbackChannelOptionId]: number

	/** The MIDI channel (1-16) used to communicate with the mixer. */
	[MidiChannelOptionId]: number

	/**
	 * How the mixer status (signal levels, etc.) should be retrieved at
	 * startup.
	 */
	[RetrieveStatusOptionId]: string

	/**
	 * Log a whole bunch of extra information about ongoing operation if verbose
	 * logging is enabled.
	 */
	verbose: boolean
}

const ipRegExp = new RegExp(Regex.IP.slice(1, -1))

/** A valid hostname as well-formed IP address. */
export type Host = Branded<string, 'config-host-valid-ip'>

function isValidHost(str: string): str is Host {
	return ipRegExp.test(str)
}

// eslint-disable-next-line @typescript-eslint/no-base-to-string
const toHost = (v: unknown) => (v === undefined ? '' : String(v))

/**
 * Get either a valid hostname from configuration, or the empty string if a
 * valid hostname wasn't configured.
 */
export function getHost(config: SQConfig): Host | '' {
	const str = config.host
	if (isValidHost(str)) {
		return str
	}
	return ''
}

const toModelId = String

/** Get the configured model ID. */
export function getModelId(config: SQConfig): ModelId {
	const modelStr = String(config.model)
	switch (modelStr) {
		case 'SQ5':
		case 'SQ6':
		case 'SQ7':
			return modelStr
		default:
			return DefaultModel
	}
}

const toFaderLaw = (v: unknown): FaderLaw => String(v) as FaderLaw

/** Get the configured fader law. */
export function getFaderLaw(config: SQConfig): FaderLaw {
	const law = config[FaderLawOptionId]
	switch (law) {
		case 'LinearTaper':
		case 'AudioTaper':
			return law
		default:
			return 'LinearTaper'
	}
}

// This is encoded in zero-indexed form, i.e. input channel 1 is encoded as 0.
// If the option is missing, interpreting as 0 entails interpreting as input
// channel 1.
const toTalkbackChannel = toNumberDefaultZero

/** Get the talkback channel specified by the user as config option. */
export function getTalkbackChannel(config: SQConfig): ZeroIndexed {
	return zeroIndexedNumber(config[TalkbackChannelOptionId])
}

// It's intentional, to comport with past behavior (and with the default MIDI
// channel on SQ mixers), that MIDI Channel 1 is the default for values not
// 1-16, including if the option is absent.
const toMidiChannel = toNumberDefaultZero

/**
 * Get the (one-indexed, i.e. 1 through 16 inclusive) MIDI channel used to
 * communicate with the mixer.
 */
export function getMidiChannel(config: SQConfig): OneIndexed {
	const n = config[MidiChannelOptionId]
	return oneIndexedNumber(1 <= n && n <= 16 && (n | 0) === n ? n : 1)
}

const toRetrieveStatusAtStartup = String

/**
 * Get the status-retrieval value used to determine how to retrieve mixer state
 * at module startup.
 */
export function getRetrieveStatusAtStartup(config: SQConfig): RetrieveStatusAtStartup {
	const retrieveStatus = String(config[RetrieveStatusOptionId])
	switch (retrieveStatus) {
		case 'delay':
		case 'nosts':
		case 'full':
			return retrieveStatus
		default:
			return RetrieveStatusAtStartup.Fully
	}
}

const toVerbose = Boolean

/** Get whether verbose logging is enabled. */
export const getVerbose = Boolean

/**
 * Force `config` into type-conformance (but not necessarily semantic validity)
 * with `SQConfig`.  (The individual accessor functions must be used to get
 * semantic validity.)
 */
export function validateConfig(config: RawConfig): asserts config is SQConfig {
	config.host = toHost(config.host)
	config.model = toModelId(config.model)
	config.faderLaw = toFaderLaw(config.faderLaw)
	config.talkbackChannel = toTalkbackChannel(config.talkbackChannel)
	config.midiChannel = toMidiChannel(config.midiChannel)
	config.retrieveStatusAtStartup = toRetrieveStatusAtStartup(config.retrieveStatusAtStartup)
	config.verbose = toVerbose(config.verbose)
}

/** Ensure a 'model' property is present in configs that lack it. */
export function tryEnsureModelOptionInConfig(oldConfig: RawConfig): boolean {
	if (!('model' in oldConfig)) {
		oldConfig.model = DefaultModel
		return true
	}
	return false
}

/** The default label for a connection from `companion/manifest.json`. */
const DefaultConnectionLabel = 'SQ'

/**
 * Ensure a 'label' property containing a connection label is present in configs
 * that lack it.
 */
export function tryEnsureLabelInConfig(oldConfig: RawConfig): boolean {
	if (!('label' in oldConfig)) {
		oldConfig.label = DefaultConnectionLabel
		return true
	}
	return false
}

/**
 * This module used to have a `'label'` option (regrettably see the function
 * above), in which the user was expected to (re-)specify the instance label.
 * This label was then used in the "Learn" operation for various actions, as
 * well as in various preset definitions.
 *
 * But it turns out the instance label is accessible as `InstanceBase.label`
 * which is always up-to-date, so there's no point in having the config option.
 *
 * This function detects and, if present, removes the `'label'` option from
 * configs that have it.
 */
export function tryRemoveUnnecessaryLabelInConfig(oldConfig: RawConfig): boolean {
	if ('label' in oldConfig) {
		delete oldConfig.label
		return true
	}
	return false
}

// `newId` could be `keyof SQConfig`, but then this couldn't be used for a
// very-old upgrade script that upgraded to a new option, that itself was
// subsequently moved or deleted.  So `string` is the best we can do.
function moveId(config: RawConfig, oldId: string, newId: string): void {
	const value = config[oldId]
	delete config[oldId]
	config[newId] = value
}

function createDefaultTalkbackChannelOption(): SomeCompanionConfigField {
	// The number of input channels depends on how many input channels the
	// user's chosen SQ model has.  Currently all SQs have the same number of
	// input channels, so use that count.
	const inputChannelCount = getCommonCount('chCount')

	const DefaultTalkbackInputChannelChoices = []
	for (let i = 0; i < inputChannelCount; i++) {
		DefaultTalkbackInputChannelChoices.push({ label: `CH ${i + 1}`, id: i })
	}

	return {
		type: 'dropdown',
		label: 'Default talkback input channel',
		id: TalkbackChannelOptionId,
		width: 6,
		default: 0,
		choices: DefaultTalkbackInputChannelChoices,
		minChoicesForSearch: 0,
	}
}

export function tryRenameVariousConfigIds(config: RawConfig): boolean {
	if ('level' in config) {
		moveId(config, 'level', FaderLawOptionId)
		moveId(config, 'talkback', TalkbackChannelOptionId)
		moveId(config, 'midich', MidiChannelOptionId)
		moveId(config, 'status', RetrieveStatusOptionId)
		return true
	}
	return false
}

/** Get SQ module configuration fields. */
export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module is for Allen & Heath SQ series mixing consoles.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			default: '192.168.0.5',
			regex: Regex.IP,
		},
		{
			type: 'dropdown',
			id: 'model',
			label: 'Console Type',
			width: 6,
			default: DefaultModel,
			choices: [
				{ id: 'SQ5', label: 'SQ 5' },
				{ id: 'SQ6', label: 'SQ 6' },
				{ id: 'SQ7', label: 'SQ 7' },
			],
		},
		{
			type: 'dropdown',
			id: FaderLawOptionId,
			label: 'NRPN Fader Law',
			width: 6,
			default: 'LinearTaper',
			choices: [
				{ id: 'LinearTaper', label: 'Linear Taper' },
				{ id: 'AudioTaper', label: 'Audio Taper' },
			],
		},
		createDefaultTalkbackChannelOption(),
		{
			type: 'number',
			id: MidiChannelOptionId,
			label: 'MIDI channel',
			width: 6,
			min: 1,
			max: 16,
			default: 1,
		},
		{
			type: 'dropdown',
			id: RetrieveStatusOptionId,
			label: 'Retrieve console status',
			width: 6,
			default: 'full',
			choices: [
				{ id: 'full', label: 'Fully at startup' },
				{ id: 'delay', label: 'Delayed at startup' },
				{ id: 'nosts', label: 'Not at startup' },
			],
		},
		{
			type: 'checkbox',
			id: 'verbose',
			label: 'Enable Verbose Logging',
			width: 12,
			default: false,
		},
	]
}

function toNumberDefaultZero(v: unknown): number {
	if (v === undefined) {
		return 0
	}

	return Number(v)
}

/**
 * Instance config suitable for use at instance creation before initialization
 * with an actual config.
 */
export function noConnectionConfig(): SQConfig {
	return {
		host: '',
		model: DefaultModel,
		faderLaw: 'LinearTaper',
		talkbackChannel: 0,
		midiChannel: oneIndexedNumber(1),
		retrieveStatusAtStartup: RetrieveStatusAtStartup.Fully,
		verbose: false,
	}
}

/**
 * For an already-started instance/connection using the given old config,
 * determine whether applying the new config to it requires restarting the
 * connection.
 */
export function canUpdateConfigWithoutRestarting(oldConfig: SQConfig, newConfig: SQConfig): boolean {
	// A different host straightforwardly requires a connection restart.
	if (oldConfig.host !== newConfig.host) {
		return false
	}

	// Changing mixer model alters choices used in options.  Choice generation
	// presently is tied to mixer connection restarting, so force a restart if
	// the model changes.
	if (oldConfig.model !== newConfig.model) {
		return false
	}

	// A different fader law changes the meaning of all level messages and can't
	// really be synced up with any messages presently in flight, so forces a
	// restart.
	if (oldConfig.faderLaw !== newConfig.faderLaw) {
		return false
	}

	// Talkback channel is only used in the talkback-controlling presets, which
	// will always reflect the latest talkback channel when added as Companion
	// buttons, so we don't need to restart for a change.

	// Changing MIDI channel could result in messages on old/new MIDI channel
	// being missed, so force a restart.
	if (oldConfig.midiChannel !== newConfig.midiChannel) {
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
