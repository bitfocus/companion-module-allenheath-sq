import type { Equal, Expect } from 'type-testing'

/**
 * Feedback IDs for feedbacks reacting to the mute status of particular mixer
 * sources/sinks.
 */
export const MuteFeedbackId = {
	MuteInputChannel: 'mute_input',
	MuteLR: 'mute_lr',
	MuteMix: 'mute_aux',
	MuteGroup: 'mute_group',
	MuteMatrix: 'mute_matrix',
	MuteDCA: 'mute_dca',
	MuteFXReturn: 'mute_fx_return',
	MuteFXSend: 'mute_fx_send',
	MuteMuteGroup: 'mute_mutegroup',
} as const

export type MuteFeedbackId = (typeof MuteFeedbackId)[keyof typeof MuteFeedbackId]

export const AllMuteWithStripFeedbacks: ReadonlySet<string> = new Set(
	Object.values(MuteFeedbackId).filter((feedbackId) => feedbackId !== 'mute_lr'),
)

export const MuteFeedbackFaderOptionId = 'n'

type MuteNumberedSignalType = {
	type: 'boolean'
	options: {
		[MuteFeedbackFaderOptionId]: number
	}
}

/** Mute feedbacks. */
export type MuteFeedbacks = {
	[MuteFeedbackId.MuteLR]: {
		type: 'boolean'
		// There's only one LR signal, so no need for an option to identify it.
		options: Record<never, never>
	}
	[MuteFeedbackId.MuteInputChannel]: MuteNumberedSignalType
	[MuteFeedbackId.MuteMix]: MuteNumberedSignalType
	[MuteFeedbackId.MuteGroup]: MuteNumberedSignalType
	[MuteFeedbackId.MuteMatrix]: MuteNumberedSignalType
	[MuteFeedbackId.MuteDCA]: MuteNumberedSignalType
	[MuteFeedbackId.MuteFXReturn]: MuteNumberedSignalType
	[MuteFeedbackId.MuteFXSend]: MuteNumberedSignalType
	[MuteFeedbackId.MuteMuteGroup]: MuteNumberedSignalType
}

type assert_AllMuteFeedbacksAccountedFor = Expect<Equal<keyof MuteFeedbacks, MuteFeedbackId>>
