import type { Equal, Expect } from 'type-testing'
import type { LevelAndFadeOptions } from './fading.js'
import type { LR } from '../../types.js'

/**
 * Action IDs for all actions that alter the level of a mixer source in a mixer
 * sink.
 */
export const LevelActionId = {
	InputChannelLevelInMixOrLR: 'chlev_to_mix',
	GroupLevelInMixOrLR: 'grplev_to_mix',
	FXReturnLevelInMixOrLR: 'fxrlev_to_mix',
	FXReturnLevelInGroup: 'fxrlev_to_grp',
	InputChannelLevelInFXSend: 'chlev_to_fxs',
	GroupLevelInFXSend: 'grplev_to_fxs',
	FXReturnLevelInFXSend: 'fxrlev_to_fxs',
	MixOrLRLevelInMatrix: 'mixlev_to_mtx',
	GroupLevelInMatrix: 'grplev_to_mtx',
} as const

export type LevelActionId = (typeof LevelActionId)[keyof typeof LevelActionId]

export const LevelSetSourceOptionId = 'source'
export const LevelSetSinkOptionId = 'sink'

export type LevelSourceInMixOrLROptions = {
	[LevelSetSourceOptionId]: number
	[LevelSetSinkOptionId]: number | typeof LR
}

export type LevelFadeSourceInMixOrLROptions = LevelSourceInMixOrLROptions & LevelAndFadeOptions

export type LevelSourceInSinkOptions = {
	[LevelSetSourceOptionId]: number
	[LevelSetSinkOptionId]: number
}

export type LevelFadeSourceInSinkOptions = LevelSourceInSinkOptions & LevelAndFadeOptions

export type LevelMixOrLRInSinkOptions = {
	[LevelSetSourceOptionId]: number | typeof LR
	[LevelSetSinkOptionId]: number
}

export type LevelFadeMixOrLRInSinkOptions = LevelMixOrLRInSinkOptions & LevelAndFadeOptions

/** Signal level adjustment actions. */
export type LevelActions = {
	[LevelActionId.InputChannelLevelInMixOrLR]: {
		options: LevelFadeSourceInMixOrLROptions
	}
	[LevelActionId.GroupLevelInMixOrLR]: {
		options: LevelFadeSourceInMixOrLROptions
	}
	[LevelActionId.FXReturnLevelInMixOrLR]: {
		options: LevelFadeSourceInMixOrLROptions
	}
	[LevelActionId.FXReturnLevelInGroup]: {
		// This action reflected a onetime A&H MIDI API docs bug.  It's now been
		// gutted and takes only an `invalid` option corresponding to a
		// static-text "option".
		options: {
			invalid: string
		}
	}
	[LevelActionId.InputChannelLevelInFXSend]: {
		options: LevelFadeSourceInSinkOptions
	}
	[LevelActionId.GroupLevelInFXSend]: {
		options: LevelFadeSourceInSinkOptions
	}
	[LevelActionId.FXReturnLevelInFXSend]: {
		options: LevelFadeSourceInSinkOptions
	}
	[LevelActionId.MixOrLRLevelInMatrix]: {
		options: LevelFadeMixOrLRInSinkOptions
	}
	[LevelActionId.GroupLevelInMatrix]: {
		options: LevelFadeSourceInSinkOptions
	}
}

type assert_AllLevelActionsAccountedFor = Expect<Equal<keyof LevelActions, LevelActionId>>
