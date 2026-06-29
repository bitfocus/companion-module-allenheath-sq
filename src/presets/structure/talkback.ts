import type { CompanionPresetSection } from '@companion-module/base'
import { TalkbackPresetMixLocalVariableId } from '../definitions/talkback.js'
import { TalkbackPresetId } from '../ids.js'
import type { SQManifest } from '../../manifest.js'
import type { Model } from '../../mixer/model.js'
import type { TemplateValue } from './types.js'
import type { ZeroIndexed } from '../../utils/indexed.js'

export function talkbackPresetsSection(model: Model): CompanionPresetSection<SQManifest> {
	const templateValues: TemplateValue[] = []

	model.forEach('mix', (n: ZeroIndexed, label) => {
		templateValues.push({
			name: label,
			value: n + 1,
		})
	})

	return {
		id: 'talkback-preset-section',
		name: 'Talkback',
		description: 'Buttons emulating talkback to a mix',
		definitions: [
			{
				id: `talkback-group`,
				name: `Talkback to Mix`,
				presetId: TalkbackPresetId,
				type: 'template',
				templateVariableName: TalkbackPresetMixLocalVariableId,
				templateValues,
			},
		],
		keywords: ['mix', 'talkback'],
	}
}
