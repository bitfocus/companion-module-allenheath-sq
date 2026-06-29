import type { CompanionPresetSection } from '@companion-module/base'
import { MuteWithPresetChannelMixLocalVariableId } from '../definitions/mute-with-level.js'
import type { MuteChannelWithLevelPresetId } from '../ids.js'
import type { SQManifest } from '../../manifest.js'
import type { Model } from '../../mixer/model.js'
import type { TemplateValue } from './types.js'
import type { ZeroIndexed } from '../../utils/indexed.js'
import { LR } from '../../types.js'

export function muteWithLevelSections(model: Model): CompanionPresetSection<SQManifest>[] {
	const templateValues: TemplateValue[] = [
		{
			name: 'LR',
			value: LR,
		},
	]

	model.forEach('mix', (n: ZeroIndexed, label) => {
		templateValues.push({
			name: label,
			value: n + 1,
		})
	})

	const sections: CompanionPresetSection<SQManifest>[] = []

	model.forEach('inputChannel', (n: ZeroIndexed, label) => {
		sections.push({
			id: `mute-with-level-inputchannel${n + 1}`,
			name: `Mute ${label} with level`,
			description: 'Mute input channel button displaying level of channel in mix',
			definitions: [
				{
					id: `mute-with-level-inputchannel${n + 1}-group`,
					name: `Mute ${label}`,
					presetId: `mute-with-level-inputchannel${n + 1}` satisfies MuteChannelWithLevelPresetId,
					type: 'template',
					templateVariableName: MuteWithPresetChannelMixLocalVariableId,
					templateValues,
				},
			],
		})
	})

	return sections
}
