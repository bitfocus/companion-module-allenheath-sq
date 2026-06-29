import type { Equal, Expect } from 'type-testing'
import type { PanBalanceOptions } from './panning.js'

/**
 * Action IDs for all actions setting the pan/balance of a mixer source in a
 * mixer sink.
 */

export const PanBalanceActionId = {
	InputChannelPanBalanceInMixOrLR: 'chpan_to_mix',
	GroupPanBalanceInMixOrLR: 'grppan_to_mix',
	FXReturnPanBalanceInMixOrLR: 'fxrpan_to_mix',
	FXReturnPanBalanceInGroup: 'fxrpan_to_grp',
	MixOrLRPanBalanceInMatrix: 'mixpan_to_mtx',
	GroupPanBalanceInMatrix: 'grppan_to_mtx',
} as const

export type PanBalanceActionId = (typeof PanBalanceActionId)[keyof typeof PanBalanceActionId]

export const PanBalanceSourceOptionId = 'source'
export const PanBalanceSinkOptionId = 'sink'

export type PanBalanceSourceAndMixOrLRSinkOptions = {
	[PanBalanceSourceOptionId]: number
	[PanBalanceSinkOptionId]: number | 'lr'
}

export type PanBalanceSourceInMixOrLROptions = PanBalanceSourceAndMixOrLRSinkOptions & PanBalanceOptions

export type PanBalanceMixOrLRSourceAndSinkOptions = {
	[PanBalanceSourceOptionId]: number | 'lr'
	[PanBalanceSinkOptionId]: number
}

export type PanBalanceMixOrLRInSinkOptions = PanBalanceMixOrLRSourceAndSinkOptions & PanBalanceOptions

export type PanBalanceSourceAndSinkOptions = {
	[PanBalanceSourceOptionId]: number
	[PanBalanceSinkOptionId]: number
}

export type PanBalanceSourceInSinkOptions = PanBalanceSourceAndSinkOptions & PanBalanceOptions

/** Signal pan/balance adjustment in stereo sink actions. */
export type PanBalanceActions = {
	[PanBalanceActionId.InputChannelPanBalanceInMixOrLR]: {
		options: PanBalanceSourceInMixOrLROptions
	}
	[PanBalanceActionId.GroupPanBalanceInMixOrLR]: {
		options: PanBalanceSourceInMixOrLROptions
	}
	[PanBalanceActionId.FXReturnPanBalanceInMixOrLR]: {
		options: PanBalanceSourceInMixOrLROptions
	}
	[PanBalanceActionId.FXReturnPanBalanceInGroup]: {
		// This action reflected a onetime A&H MIDI API docs bug.  It's now been
		// gutted and takes only an `invalid` option corresponding to a
		// static-text "option".
		options: {
			invalid: string
		}
	}
	[PanBalanceActionId.MixOrLRPanBalanceInMatrix]: {
		options: PanBalanceMixOrLRInSinkOptions
	}
	[PanBalanceActionId.GroupPanBalanceInMatrix]: {
		options: PanBalanceSourceInSinkOptions
	}
}

type assert_AllPanBalanceActionsAccountedFor = Expect<Equal<keyof PanBalanceActions, PanBalanceActionId>>
