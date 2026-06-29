import type { CompanionFeedbackDefinition, CompanionOptionValues } from '@companion-module/base'
import type { MuteFeedbacks } from './schemas/mute.js'

/** All mixer feedbacks. */
export type SQFeedbacks = MuteFeedbacks

export type CompanionFeedbackDefinitions<TSchemas extends Record<string, { options: CompanionOptionValues }>> = {
	[feedbackId in keyof TSchemas as feedbackId extends string ? feedbackId : never]: CompanionFeedbackDefinition
}
