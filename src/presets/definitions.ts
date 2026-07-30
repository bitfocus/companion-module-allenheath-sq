import type { CompanionPresetDefinitions } from '@companion-module/base'
import { getTalkbackChannel } from '../config.js'
import { mutePresets } from './definitions/mutes.js'
import { muteWithLevelPresets } from './definitions/mute-with-level.js'
import { talkbackPresets } from './definitions/talkback.js'
import type { sqInstance } from '../instance.js'
import type { Model } from '../mixer/model.js'

export function getPresetDefinitions(instance: sqInstance, model: Model): CompanionPresetDefinitions {
	return {
		...mutePresets(model),
		...talkbackPresets(getTalkbackChannel(instance.config), model),
		...muteWithLevelPresets(instance, model),
	}
}
