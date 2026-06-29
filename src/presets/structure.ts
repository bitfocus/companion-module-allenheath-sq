import type { CompanionPresetSection } from '@companion-module/base'
import type { SQManifest } from '../manifest.js'
import type { Model } from '../mixer/model.js'
import { mutePresetsSection } from './structure/mutes.js'
import { muteWithLevelSections } from './structure/mute-with-level.js'
import { talkbackPresetsSection } from './structure/talkback.js'

export function getPresetsStructure(model: Model): CompanionPresetSection<SQManifest>[] {
	return [
		// force onto separate lines
		mutePresetsSection(model),
		...muteWithLevelSections(model),
		talkbackPresetsSection(model),
	]
}
