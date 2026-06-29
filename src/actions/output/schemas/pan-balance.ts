import type { Equal, Expect } from 'type-testing'
import type { PanBalanceOptions } from '../../schemas/panning.js'

/**
 * Action IDs for all actions affecting the pan/balance of sinks when used as
 * direct mixer outputs.
 */
export const OutputPanBalanceActionId = {
	LRPanBalanceOutput: 'lr_panbalance_output',
	MixPanBalanceOutput: 'mix_panbalance_output',
	MatrixPanBalanceOutput: 'matrix_panbalance_output',
} as const

export type OutputPanBalanceActionId = (typeof OutputPanBalanceActionId)[keyof typeof OutputPanBalanceActionId]

export const AllOutputFaderPanBalanceActions: ReadonlySet<string> = new Set(
	Object.values(OutputPanBalanceActionId).filter((actionId) => actionId !== 'lr_panbalance_output'),
)

export const OutputPanBalanceSignalOptionId = 'n'

type OutputPanBalanceSignalOption = {
	[OutputPanBalanceSignalOptionId]: number
}

type OutputPanBalanceSignalOptions = OutputPanBalanceSignalOption & PanBalanceOptions

/** Output signal pan/balance adjustment actions. */
export type OutputPanBalanceActions = {
	[OutputPanBalanceActionId.LRPanBalanceOutput]: {
		// There's only one LR, so don't include an input option.
		options: PanBalanceOptions
	}
	[OutputPanBalanceActionId.MixPanBalanceOutput]: {
		options: OutputPanBalanceSignalOptions
	}
	[OutputPanBalanceActionId.MatrixPanBalanceOutput]: {
		options: OutputPanBalanceSignalOptions
	}
}

type assert_AllOutputPanBalanceActionsAccountedFor = Expect<
	Equal<keyof OutputPanBalanceActions, OutputPanBalanceActionId>
>
