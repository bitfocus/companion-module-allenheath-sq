import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { Choices } from '../choices.js'
import { inputChannelLevelInMixFeedbacks } from './inputchannel-level-in-mix.js'
import type { sqInstance } from '../instance.js'
import type { SQFeedbacks } from './manifest.js'
import type { Mixer } from '../mixer/mixer.js'
import { muteFeedbacks } from './mute.js'

export function getFeedbacks(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
): CompanionFeedbackDefinitions<SQFeedbacks> {
	return {
		...muteFeedbacks(mixer),
		...inputChannelLevelInMixFeedbacks(instance, mixer, choices.mixesAndLR),
	}
}
