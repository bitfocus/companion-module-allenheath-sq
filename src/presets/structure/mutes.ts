import type { CompanionPresetGroup, CompanionPresetGroupTemplate, CompanionPresetSection } from '@companion-module/base'
import { StatusOptionId } from '../../actions/schemas/mute.js'
import { MutePresetStripLocalVariableId } from '../definitions/mutes.js'
import {
	MuteDCAPresetId,
	MuteFXReturnPresetId,
	MuteFXSendPresetId,
	MuteGroupPresetId,
	MuteInputChannelPresetId,
	MuteLRPresetId,
	MuteMatrixPresetId,
	MuteMixPresetId,
	MuteMuteGroupPresetId,
} from '../ids.js'
import type { SQManifest } from '../../manifest.js'
import type { InputOutputType, Model } from '../../mixer/model.js'
import type { TemplateValue } from './types.js'
import { MuteOperation } from '../../types.js'
import type { ZeroIndexed } from '../../utils/indexed.js'

const SignalTypes = {
	inputChannel: {
		label: 'Input Channel',
		presetId: MuteInputChannelPresetId,
		order: 0,
	},
	mix: {
		label: 'Mix',
		presetId: MuteMixPresetId,
		order: 1,
	},
	lr: {
		label: 'LR',
		presetId: MuteLRPresetId,
		order: 2,
	},
	group: {
		label: 'Group',
		presetId: MuteGroupPresetId,
		order: 3,
	},
	matrix: {
		label: 'Matrix',
		presetId: MuteMatrixPresetId,
		order: 4,
	},
	fxSend: {
		label: 'FX Send',
		presetId: MuteFXSendPresetId,
		order: 5,
	},
	fxReturn: {
		label: 'FX Return',
		presetId: MuteFXReturnPresetId,
		order: 6,
	},
	dca: {
		label: 'DCA',
		presetId: MuteDCAPresetId,
		order: 7,
	},
	muteGroup: {
		label: 'Mute Group',
		presetId: MuteMuteGroupPresetId,
		order: 8,
	},
} satisfies Record<
	InputOutputType,
	{ label: string; presetId: CompanionPresetGroupTemplate<SQManifest>['presetId']; order: number }
>

export function mutePresetsSection(model: Model): CompanionPresetSection<SQManifest> {
	const definitions: CompanionPresetGroup<SQManifest>[] = Object.entries(SignalTypes)
		.sort(([, { order: a }], [, { order: b }]) => b - a)
		.map(([type_, { label, presetId }]) => {
			const type = type_ as InputOutputType

			const templateValues: TemplateValue[] = []
			model.forEach(type, (n: ZeroIndexed, label) => {
				templateValues.push({ name: label, value: n + 1 })
			})

			// XXX This exposes the mute-LR preset as if it were a template,
			//     with a template variable name/value that's not actually
			//     there.  Is this kosher?
			return {
				id: `mute-${type}-group`,
				name: `Mute ${label}`,
				presetId,
				type: 'template',
				templateVariableName: MutePresetStripLocalVariableId,
				templateValues,
				commonVariableValues: {
					[StatusOptionId]: MuteOperation.Toggle,
				},
			}
		})

	return {
		id: 'mute-presets-section',
		name: 'Mute',
		description: 'Buttons toggling the muting of inputs/outputs',
		definitions,
		keywords: ['mute'],
	}
}
