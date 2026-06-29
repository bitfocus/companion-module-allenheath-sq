import type { Equal, Expect } from 'type-testing'
import type { MuteOperation } from '../../types.js'

/**
 * Action IDs for all actions that mute, unmute, or toggle muting of a mixer
 * input/output.
 */
export const MuteActionId = {
	MuteInputChannel: 'mute_input',
	MuteLR: 'mute_lr',
	MuteMix: 'mute_aux',
	MuteGroup: 'mute_group',
	MuteMatrix: 'mute_matrix',
	MuteFXSend: 'mute_fx_send',
	MuteFXReturn: 'mute_fx_return',
	MuteDCA: 'mute_dca',
	MuteMuteGroup: 'mute_mutegroup',
} as const

export type MuteActionId = (typeof MuteActionId)[keyof typeof MuteActionId]

export const AllMuteStripActions: ReadonlySet<string> = new Set(
	Object.values(MuteActionId).filter((id) => id !== 'mute_lr'),
)

export const StripOptionId = 'n'
export const StatusOptionId = 'status'

type MuteStripOption = {
	[StripOptionId]: number
}

export type MuteStatusOption = {
	[StatusOptionId]: MuteOperation
}

export type MuteSignalOptions = MuteStripOption & MuteStatusOption

/** Signal muting actions. */
export type MuteActions = {
	[MuteActionId.MuteInputChannel]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteLR]: {
		// mute_lr omits the unnecessary strip number.
		options: MuteStatusOption
	}
	[MuteActionId.MuteMix]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteGroup]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteMatrix]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteFXSend]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteFXReturn]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteDCA]: {
		options: MuteSignalOptions
	}
	[MuteActionId.MuteMuteGroup]: {
		options: MuteSignalOptions
	}
}

type assert_AllMuteActionsAccountedFor = Expect<Equal<keyof MuteActions, MuteActionId>>
