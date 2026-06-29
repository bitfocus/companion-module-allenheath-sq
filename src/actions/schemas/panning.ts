import type { PanBalance } from '../../types.js'

/** The set of pan/balance choice values offered for selection as pan levels. */
export type PanBalanceChoice = PanBalance | 998 | 999

export const PanBalanceLevelOptionId = 'leveldb'

export const ShowVarOptionId = 'showvar'

type PanBalanceLevelOption = {
	[PanBalanceLevelOptionId]: PanBalanceChoice
}

type PanBalanceShowVarOption = {
	[ShowVarOptionId]: string
}

export type PanBalanceOptions = PanBalanceLevelOption & PanBalanceShowVarOption
