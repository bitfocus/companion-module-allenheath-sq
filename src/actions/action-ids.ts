import { type CompanionActionDefinition } from '@companion-module/base'

/**
 * The type of action definitions for all actions within the specified action
 * set.
 */
export type ActionDefinitions<ActionSet extends string> = {
	[actionId in ActionSet]: CompanionActionDefinition
}

/**
 * Action IDs for all actions that mute, unmute, or toggle muting of a mixer
 * input/output.
 */
export enum MuteActionId {
	MuteInputChannel = 'mute_input',
	MuteLR = 'mute_lr',
	MuteMix = 'mute_aux',
	MuteGroup = 'mute_group',
	MuteMatrix = 'mute_matrix',
	MuteFXSend = 'mute_fx_send',
	MuteFXReturn = 'mute_fx_return',
	MuteDCA = 'mute_dca',
	MuteMuteGroup = 'mute_mutegroup',
}

/**
 * Action IDs for all actions that activate/deactivate a mixer source within a
 * sink.
 */
export enum AssignActionId {
	ChannelToMix = 'ch_to_mix',
	ChannelToGroup = 'ch_to_grp',
	GroupToMix = 'grp_to_mix',
	FXReturnToGroup = 'fxr_to_grp',
	ChannelToFXSend = 'ch_to_fxs',
	GroupToFXSend = 'grp_to_fxs',
	FXReturnToFXSend = 'fxr_to_fxs',
	MixToMatrix = 'mix_to_mtx',
	GroupToMatrix = 'grp_to_mtx',
}

/** Action IDs for all actions that change the mixer's current scene. */
export enum SceneActionId {
	SceneRecall = 'scene_recall',
	SceneStep = 'scene_step',
}

/** Action IDs for all actions that operate softkeys. */
export enum SoftKeyId {
	SoftKey = 'key_soft',
}
