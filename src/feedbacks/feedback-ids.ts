import { type CompanionFeedbackDefinition } from '@companion-module/base'

/**
 * The type of feedback definitions for all feedbacks within the specified
 * feedback set.
 */
export type FeedbackDefinitions<FeedbackSet extends string> = {
	[actionId in FeedbackSet]: CompanionFeedbackDefinition
}

/**
 * Feedback IDs for feedbacks reacting to the mute status of particular mixer
 * sources/sinks.
 */
export enum MuteFeedbackId {
	MuteInputChannel = 'mute_input',
	MuteLR = 'mute_lr',
	MuteMix = 'mute_aux',
	MuteGroup = 'mute_group',
	MuteMatrix = 'mute_matrix',
	MuteDCA = 'mute_dca',
	MuteFXReturn = 'mute_fx_return',
	MuteFXSend = 'mute_fx_send',
	MuteMuteGroup = 'mute_mutegroup',
}

/** All feedback IDs. */
export type FeedbackId = MuteFeedbackId
