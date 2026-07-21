import type { CompanionPresetDefinitions } from '@companion-module/base'
import { getTalkbackChannel } from '../config.js'
import type { sqInstance } from '../instance.js'
import type { Model } from '../mixer/model.js'
import { mutePresets } from './mutes.js'
import { muteWithLevelPresets } from './mute-with-level.js'
import { talkbackPresets } from './talkback.js'

export function getPresets(instance: sqInstance, model: Model): CompanionPresetDefinitions {
	return {
		...mutePresets(model),
		...talkbackPresets(getTalkbackChannel(instance.config), model),
		...muteWithLevelPresets(instance, model),
	}
}
