import type { Equal, Expect } from 'type-testing'
import type { LevelAndFadeOptions } from '../../schemas/fading.js'

/**
 * Action IDs for all actions affecting the level of sinks when used as direct
 * mixer outputs.
 */
export const OutputLevelActionId = {
	LRLevelOutput: 'lr_level_output',
	MixLevelOutput: 'mix_level_output',
	FXSendLevelOutput: 'fxsend_level_output',
	MatrixLevelOutput: 'matrix_level_output',
	DCALevelOutput: 'dca_level_output',
} as const

export type OutputLevelActionId = (typeof OutputLevelActionId)[keyof typeof OutputLevelActionId]

export const AllOutputLevelActions: ReadonlySet<string> = new Set(
	Object.values(OutputLevelActionId).filter((actionId) => actionId !== 'lr_level_output'),
)

export const OutputLevelSignalOptionId = 'n'

export type OutputLevelSignalOption = {
	[OutputLevelSignalOptionId]: number
}

type OutputLevelWithSignalOptions = OutputLevelSignalOption & LevelAndFadeOptions

/** Output signal level adjustment actions. */
export type OutputLevelActions = {
	[OutputLevelActionId.LRLevelOutput]: {
		// There's only one LR, so don't include a signal option.
		options: LevelAndFadeOptions
	}
	[OutputLevelActionId.MixLevelOutput]: {
		options: OutputLevelWithSignalOptions
	}
	[OutputLevelActionId.FXSendLevelOutput]: {
		options: OutputLevelWithSignalOptions
	}
	[OutputLevelActionId.MatrixLevelOutput]: {
		options: OutputLevelWithSignalOptions
	}
	[OutputLevelActionId.DCALevelOutput]: {
		options: OutputLevelWithSignalOptions
	}
}

type assert_AllOutputLevelActionsAccountedFor = Expect<Equal<keyof OutputLevelActions, OutputLevelActionId>>
