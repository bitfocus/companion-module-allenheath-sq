import { type CompanionFeedbackDefinition } from '@companion-module/base'
import type { InputOutputType } from '../mixer/model.js'

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

/** A map associating mutable input/output types to mute feedback IDs. */
export const typeToMuteFeedback: Record<InputOutputType, MuteFeedbackId> = {
	inputChannel: MuteFeedbackId.MuteInputChannel,
	group: MuteFeedbackId.MuteGroup,
	mix: MuteFeedbackId.MuteMix,
	lr: MuteFeedbackId.MuteLR,
	muteGroup: MuteFeedbackId.MuteMuteGroup,
	matrix: MuteFeedbackId.MuteMatrix,
	fxReturn: MuteFeedbackId.MuteFXReturn,
	fxSend: MuteFeedbackId.MuteFXSend,
	dca: MuteFeedbackId.MuteDCA,
}

/** All feedback IDs. */
export type FeedbackId = MuteFeedbackId
