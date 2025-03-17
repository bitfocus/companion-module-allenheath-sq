import type { InputOutputType } from './model.js'

/** A MIDI parameter number as its 7-bit MSB and LSB. */
export type Param = { MSB: number; LSB: number }

type MuteBases = {
	[sourceOrSink in InputOutputType]: Param
}

export type MuteType = keyof MuteBases
