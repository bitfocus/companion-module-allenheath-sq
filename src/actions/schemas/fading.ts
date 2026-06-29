export const FadeDurationOptionId = 'fade'
export const SignalLevelOptionId = 'leveldb'

type SignalLevelChange =
	| 1000 // Last dB value
	| 'step+0.1'
	| 'step+1'
	| 'step+3'
	| 'step+6'
	| 'step-0.1'
	| 'step-1'
	| 'step-3'
	| 'step-6'
	| '-inf'
	| number // (-90, -40] by 5, [-39, -10] by 1, [-9.5, 10] by 0.5

type FadeDuration =
	| 0 // immediate
	| 1 // 1s
	| 2 // 2s
	| 3 // 3s

export type LevelAndFadeOptions = {
	[SignalLevelOptionId]: SignalLevelChange
	[FadeDurationOptionId]: FadeDuration
}
