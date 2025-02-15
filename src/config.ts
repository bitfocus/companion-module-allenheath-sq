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
 * Ensure a 'model' property is present in configs that lack it.
 */
export function tryEnsureModelOptionInConfig(oldConfig: SQInstanceConfig | null): boolean {
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
export function tryEnsureLabelInConfig(oldConfig: SQInstanceConfig | null): boolean {
	if (oldConfig !== null && !('label' in oldConfig)) {
		oldConfig.label = DefaultConnectionLabel
		return true
	}
	return false
}

/**
 * Determine whether the given instance config specifies a `'label'` property
 * that is unnecessary because `InstanceBase.label` is the real deal and is
 * always up-to-date.
 */
export function configUnnecessarilySpecifiesLabel(config: SQInstanceConfig | null): config is SQInstanceConfig {
	return config !== null && 'label' in config
}

/** Remove the `'label'` option from a config that has it. */
export function removeLabelOptionFromConfig(config: SQInstanceConfig): void {
	delete config.label
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
			type: 'checkbox',
			id: 'verbose',
			label: 'Enable Verbose Logging',
			width: 12,
			default: false,
		},
	]
}
