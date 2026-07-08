import type { CompanionFeedbackDefinition } from '@companion-module/base'
import type { Mixer } from '../mixer/mixer.js'
import { type MuteFeedbackId, muteFeedbacks } from './mute.js'

/** All feedback IDs. */
export type FeedbackId = MuteFeedbackId

export function getFeedbacks(mixer: Mixer): Record<FeedbackId, CompanionFeedbackDefinition> {
	return {
		...muteFeedbacks(mixer),
	}
}
