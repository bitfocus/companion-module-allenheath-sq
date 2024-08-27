import { type InputValue, Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { DefaultModel, getCommonCount } from './mixer/models.js'

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
export interface SQInstanceConfig {
	[key: string]: InputValue | undefined
}

/**
 * Determine whether the given instance config is missing a `'model'` property.
 */
export function configIsMissingModel(config: SQInstanceConfig | null): config is SQInstanceConfig {
	return config !== null && !('model' in config)
}

/**
 * Add the 'model' option (defaulting to SQ5) to a config that's missing one.
 */
export function addModelOptionToConfig(config: SQInstanceConfig): void {
	config.model = DefaultModel
}

/** The default label for a connection from `companion/manifest.json`. */
export const DefaultConnectionLabel = 'SQ'

/**
 * Determine whether the given instance config is missing a `'label'` property.
 */
export function configIsMissingLabel(config: SQInstanceConfig | null): config is SQInstanceConfig {
	return config !== null && !('label' in config)
}

/**
 * Add the 'label' option (defaulting to SQ) to a config that's missing one.
 */
export function addLabelOptionToConfig(config: SQInstanceConfig): void {
	config.label = DefaultConnectionLabel
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
		id: 'talkback',
		width: 6,
		default: 0,
		choices: DefaultTalkbackInputChannelChoices,
		minChoicesForSearch: 0,
	}
}

/**
 * Get SQ module configuration fields.
 */
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
			id: 'level',
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
			id: 'midich',
			label: 'MIDI channel',
			width: 6,
			min: 1,
			max: 16,
			default: 1,
		},
		{
			type: 'dropdown',
			id: 'status',
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
			type: 'textinput',
			id: 'label',
			label: 'Connection label (for displaying pan/balance variables correctly)',
			width: 6,
			default: DefaultConnectionLabel,
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
