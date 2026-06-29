import type { Choices } from '../choices.js'
import { type FeedbackDefinitions, type FeedbackId } from './feedback-ids.js'
import type { Mixer } from '../mixer/mixer.js'
import { muteFeedbacks } from './mute.js'

export function getFeedbacks(mixer: Mixer, choices: Choices): FeedbackDefinitions<FeedbackId> {
	return {
		...muteFeedbacks(mixer, choices),
	}
}
