import type { Equal, Expect } from 'type-testing'
import type { LR } from '../../types.js'

/**
 * Feedbacks to compute a label string for a mix-or-LR, or a string containing
 * the level of an input channel in a mix-or-LR, for use in defining the
 * mute-with-level preset.
 */
export const InputChannelLevelInMixFeedbackId = {
	LevelInMix: 'input_level_in_mix',
	SinkDescription: 'mix_description',
} as const

export type InputChannelLevelInMixFeedbackId =
	(typeof InputChannelLevelInMixFeedbackId)[keyof typeof InputChannelLevelInMixFeedbackId]

export const InputChannelLevelInMixFeedbackMixOptionId = 'mix'

export type InputChannelLevelInMixFeedbackMixOptions = {
	[InputChannelLevelInMixFeedbackMixOptionId]: number | typeof LR
}

export const InputChannelLevelInMixFeedbackInputChannelOptionId = 'inputChannel'

export type InputChannelLevelInMixFeedbackOptions = {
	[InputChannelLevelInMixFeedbackInputChannelOptionId]: number
} & InputChannelLevelInMixFeedbackMixOptions

/** Mute feedbacks. */
export type InputChannelLevelInMixFeedbacks = {
	[InputChannelLevelInMixFeedbackId.LevelInMix]: {
		type: 'value'
		options: InputChannelLevelInMixFeedbackOptions
		result: string
	}
	[InputChannelLevelInMixFeedbackId.SinkDescription]: {
		type: 'value'
		options: InputChannelLevelInMixFeedbackMixOptions
		result: string
	}
}

type assert_AllInputChannelLevelInMixFeedbacksAccountedFor = Expect<
	Equal<keyof InputChannelLevelInMixFeedbacks, InputChannelLevelInMixFeedbackId>
>
