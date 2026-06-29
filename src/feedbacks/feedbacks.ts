import type { CompanionFeedbackDefinitions, SQFeedbacks } from './manifest.js'
import type { Mixer } from '../mixer/mixer.js'
import { muteFeedbacks } from './mute.js'

export function getFeedbacks(mixer: Mixer): CompanionFeedbackDefinitions<SQFeedbacks> {
	return {
		...muteFeedbacks(mixer),
	}
}
