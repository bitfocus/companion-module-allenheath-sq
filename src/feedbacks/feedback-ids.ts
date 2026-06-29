import { type CompanionFeedbackDefinition } from '@companion-module/base'
import type { MuteFeedbackId } from './mute.js'

/**
 * The type of feedback definitions for all feedbacks within the specified
 * feedback set.
 */
export type FeedbackDefinitions<FeedbackSet extends string> = {
	[actionId in FeedbackSet]: CompanionFeedbackDefinition
}

/** All feedback IDs. */
export type FeedbackId = MuteFeedbackId
