import type { Equal, Expect } from 'type-testing'
import type { LR } from '../../types.js'

/**
 * Action IDs for all actions that activate/deactivate a mixer source within a
 * sink.
 */
export const AssignActionId = {
	InputChannelToMix: 'ch_to_mix',
	InputChannelToGroup: 'ch_to_grp',
	GroupToMix: 'grp_to_mix',
	FXReturnToMix: 'fxr_to_mix',
	FXReturnToGroup: 'fxr_to_grp',
	InputChannelToFXSend: 'ch_to_fxs',
	GroupToFXSend: 'grp_to_fxs',
	FXReturnToFXSend: 'fxr_to_fxs',
	MixToMatrix: 'mix_to_mtx',
	GroupToMatrix: 'grp_to_mtx',
} as const

export type AssignActionId = (typeof AssignActionId)[keyof typeof AssignActionId]

export const AssignStatus = {
	Active: 'active',
	Inactive: 'inactive',
	// Toggle: 'toggle', // to be added later
} as const

export type AssignStatus = (typeof AssignStatus)[keyof typeof AssignStatus]

export const AssignSourceOptionId = 'source'
export const AssignSinksOptionId = 'sinks'
export const AssignStatusOptionId = 'status'

type AssignStatusOption = {
	[AssignStatusOptionId]: AssignStatus
}

type AssignSourceAndSinksOptions = {
	[AssignSourceOptionId]: number
	[AssignSinksOptionId]: number[]
}

type AssignSourceToSinksOptions = AssignSourceAndSinksOptions & AssignStatusOption

type AssignSourceAndMixesAndLRSinksOptions = {
	[AssignSourceOptionId]: number
	[AssignSinksOptionId]: (number | typeof LR)[]
}

type AssignSourceToMixesAndLRSinksOptions = AssignSourceAndMixesAndLRSinksOptions & AssignStatusOption

type AssignMixOrLRSourceAndSinksOptions = {
	[AssignSourceOptionId]: number | typeof LR
	[AssignSinksOptionId]: number[]
}

type AssignMixOrLRSourceToSinksOptions = AssignMixOrLRSourceAndSinksOptions & AssignStatusOption

/** Assignment-change actions. */
export type AssignActions = {
	[AssignActionId.InputChannelToMix]: {
		options: AssignSourceToMixesAndLRSinksOptions
	}
	[AssignActionId.InputChannelToGroup]: {
		options: AssignSourceToSinksOptions
	}
	[AssignActionId.GroupToMix]: {
		options: AssignSourceToMixesAndLRSinksOptions
	}
	[AssignActionId.FXReturnToMix]: {
		options: AssignSourceToMixesAndLRSinksOptions
	}
	[AssignActionId.FXReturnToGroup]: {
		options: AssignSourceToSinksOptions
	}
	[AssignActionId.InputChannelToFXSend]: {
		options: AssignSourceToSinksOptions
	}
	[AssignActionId.GroupToFXSend]: {
		options: AssignSourceToSinksOptions
	}
	[AssignActionId.FXReturnToFXSend]: {
		options: AssignSourceToSinksOptions
	}
	[AssignActionId.MixToMatrix]: {
		options: AssignMixOrLRSourceToSinksOptions
	}
	[AssignActionId.GroupToMatrix]: {
		options: AssignSourceToSinksOptions
	}
}

type assert_AllAssignActionsAccountedFor = Expect<Equal<keyof AssignActions, AssignActionId>>
