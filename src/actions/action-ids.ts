import { type CompanionActionDefinition } from '@companion-module/base'

/**
 * The type of action definitions for all actions within the specified action
 * set.
 */
export type ActionDefinitions<ActionSet extends string> = {
	[actionId in ActionSet]: CompanionActionDefinition
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
