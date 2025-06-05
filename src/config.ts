import { type InputValue, Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { type FaderLaw, RetrieveStatusAtStartup } from './mixer/mixer.js'
import { DefaultModel, getCommonCount, type ModelId } from './mixer/models.js'
import type { Branded } from './utils/brand.js'

/**
 * The `TConfig` object type used to store instance configuration info.
 *
 * Nothing ensures that Companion config objects conform to the `TConfig` type
 * specified by a module.  Therefore we leave this type underdefined, not
 * well-defined, so that configuration info will be defensively processed.  (We
 * use `SQInstanceOptions` to store configuration choices as well-typed values
 * for the long haul.  See the `options.ts:optionsFromConfig` destructuring
 * parameter for a list of the field/types we expect to find in config objects.)
 */
export interface RawConfig {
	[key: string]: InputValue | undefined
}

/** Ensure a 'model' property is present in configs that lack it. */
export function tryEnsureModelOptionInConfig(oldConfig: RawConfig | null): boolean {
	if (oldConfig !== null && !('model' in oldConfig)) {
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
export function tryEnsureLabelInConfig(oldConfig: RawConfig | null): boolean {
	if (oldConfig !== null && !('label' in oldConfig)) {
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
export function tryRemoveUnnecessaryLabelInConfig(oldConfig: RawConfig | null): boolean {
	if (oldConfig !== null && 'label' in oldConfig) {
		delete oldConfig.label
		return true
	}
	return false
}

function moveId(config: RawConfig, oldId: keyof RawConfig, newId: keyof SQInstanceConfig): void {
	config[newId] = config[oldId]
	delete config[oldId]
}

const FaderLawOptionId = 'faderLaw'
const TalkbackChannelOptionId = 'talkbackChannel'
const MidiChannelOptionId = 'midiChannel'
const RetrieveStatusOptionId = 'retrieveStatusAtStartup'

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

export function tryRenameVariousConfigIds(config: RawConfig | null): boolean {
	if (config !== null && 'level' in config) {
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

/** Config information controlling the operation of a mixer instance. */
type SQInstanceConfig = {
	/**
	 * The TCP/IP hostname of the mixer, or the empty string if no hostname was
	 * validly specified.
	 */
	host: Host | ''

	/** The model of the mixer. */
	model: ModelId

	/** The fader law specified in the mixer. */
	[FaderLawOptionId]: FaderLaw

	/**
	 * The channel used for talkback (zero-indexed rather than 1-indexed as it
	 * appears in UI).
	 */
	[TalkbackChannelOptionId]: number

	/**
	 * The MIDI channel that should be used to communicate with the mixer.
	 * (This is the encoding-level value, i.e. 0-15 rather than 1-16.)
	 */
	[MidiChannelOptionId]: number

	/**
	 * How the mixer status (signal levels, etc.) should be retrieved at
	 * startup.
	 */
	[RetrieveStatusOptionId]: RetrieveStatusAtStartup

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

function toHost(host: RawConfig['host']): Host | '' {
	if (host !== undefined) {
		const str = String(host)
		if (isValidHost(str)) {
			return str
		}
	}

	return ''
}

function toModelId(model: RawConfig['model']): ModelId {
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

function toFaderLaw(faderLawOpt: RawConfig[typeof FaderLawOptionId]): FaderLaw {
	const law = String(faderLawOpt)
	switch (law) {
		case 'LinearTaper':
		case 'AudioTaper':
			return law
		default:
			return 'LinearTaper'
	}
}

function toNumberDefaultZero(v: RawConfig[string]): number {
	if (v === undefined) {
		return 0
	}

	return Number(v)
}

function toTalkbackChannel(ch: RawConfig[typeof TalkbackChannelOptionId]): number {
	return toNumberDefaultZero(ch)
}

function toMidiChannel(midiChannel: RawConfig[typeof MidiChannelOptionId]): number {
	const n = toNumberDefaultZero(midiChannel)
	if (1 <= n && n <= 16) {
		return n - 1
	}

	return 0
}

function toRetrieveStatusAtStartup(status: RawConfig[typeof RetrieveStatusOptionId]): RetrieveStatusAtStartup {
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

const toVerbose = Boolean

/**
 * Validate 'config' as a validly-encoded configuration, massaging it into type
 * conformance as necessary.
 */
export function validateConfig(config: RawConfig): asserts config is SQInstanceConfig {
	config.host = toHost(config.host)
	config.model = toModelId(config.model)
	config.faderLaw = toFaderLaw(config.faderLaw)
	config.talkbackChannel = toTalkbackChannel(config.talkbackChannel)
	config.midiChannel = toMidiChannel(config.midiChannel)
	config.retrieveStatusAtStartup = toRetrieveStatusAtStartup(config.retrieveStatusAtStartup)
	config.verbose = toVerbose(config.verbose)
}

/**
 * Instance config suitable for use at instance creation before initialization
 * with an actual config.
 */
export function noConnectionConfig(): SQInstanceConfig {
	return {
		host: '',
		model: DefaultModel,
		faderLaw: 'LinearTaper',
		talkbackChannel: 0,
		midiChannel: 0,
		retrieveStatusAtStartup: RetrieveStatusAtStartup.Fully,
		verbose: false,
	}
}

/**
 * For an already-started instance/connection using the given old config,
 * determine whether applying the new config to it requires restarting the
 * connection.
 */
export function canUpdateConfigWithoutRestarting(oldConfig: SQInstanceConfig, newConfig: SQInstanceConfig): boolean {
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
