import { LR } from './model.js'
import type { MuteType, Param } from './relationships.js'

/**
 * Compute the MSB/LSB for a `source`-to-LR relationship.
 *
 * @param source
 *   The number of the source within its category, e.g. the fifth input channel
 *   would be `4`.
 *
 *   Note: `source` **must not** be the LR mix!  To handle an LR source, specify
 *   `source === 0` and set `base` as if *that one line* in the
 *   [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf)
 *   were an entire table.)
 * @param base
 *   The MSB/LSB that would be correct if `source` were of the type intended by
 *   the caller but instead had the value `0` (e.g. `{ MSB: 0x60, LSB: 0x00 }`
 *   if `source` is an input channel and input channel-to-LR assignment
 *   parameters are being computed).  Correct values for this argument are found
 *   at the top left of the relevant table in the
 *   [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).)
 */

function computeLRParameters(source: number, base: Param): Param {
	if (source === LR) {
		throw new Error('LR-to-LR must be specially handled')
	}
	return { MSB: base.MSB, LSB: base.LSB + source }
}

/**
 * Compute the MSB/LSB for a `source`-to-`sink` relationship.
 *
 * @param source
 *   The number of the source within its category, e.g. the fifth input channel
 *   would be `4`.
 *
 *   Note: `source` **must not** be the LR mix!  To handle an LR source, specify
 *   `source === 0` and set `base` as if *that one line* in the
 *   [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf)
 *   were an entire table.)
 * @param sink
 *   The sink to map to, in the range `[0, sinkCount)`.
 * @param sinkCount
 *   The total number of sinks of the kind of `sink`, for example `12` if there
 *   are twelve groups and `sink` refers to a group.
 * @param base
 *   The MSB/LSB that would be correct if `source` were of the type intended by
 *   the caller but instead had the value `0` (e.g. `{ MSB: 0x65, LSB: 0x04 }`
 *   if `source` is a group and group-to-aux assignment parameters are being
 *   computed).  Correct values for this argument are found at the top left (or,
 *   top left after excluding an LR column) of the relevant table in the
 *   [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).)
 */

export function computeParameters(source: number, sink: number, sinkCount: number, base: Param): Param {
	if (source === LR) {
		throw new Error('LR source must be manually converted to 0 with parameter base appropriately adjusted')
	}
	if (sink === LR) {
		throw new Error('Use computeLRParameters to compute parameters for an LR sink ')
	}

	const val = base.LSB + sinkCount * source + sink
	return { MSB: base.MSB + ((val >> 7) & 0xf), LSB: val & 0x7f }
}

export function computeEitherParameters(
	source: number,
	sink: number,
	sinkCount: number,
	base: Param,
	lrBase: Param,
): Param {
	return sink === LR ? computeLRParameters(source, lrBase) : computeParameters(source, sink, sinkCount, base)
}

type SourceToMixOrLR = {
	[key: string]: {
		mix: Param
		lr: Param
	}
}

type SourceToSink = {
	[key: string]: Param
}

/**
 * Base parameter MSB/LSB values corresponding to muting/unmuting a source/sink
 * or toggling its mute status.
 *
 * These values are the pairs in the top of the relevant section of the "Mute
 * Parameter Numbers" table in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const MuteBases = {
	inputChannel: { MSB: 0x00, LSB: 0x00 },
	lr: { MSB: 0x00, LSB: 0x44 },
	mix: { MSB: 0x00, LSB: 0x45 },
	group: { MSB: 0x00, LSB: 0x30 },
	matrix: { MSB: 0x00, LSB: 0x55 },
	fxSend: { MSB: 0x00, LSB: 0x51 },
	fxReturn: { MSB: 0x00, LSB: 0x3c },
	dca: { MSB: 0x02, LSB: 0x00 },
	muteGroup: { MSB: 0x04, LSB: 0x00 },
} satisfies SourceToSink & Record<MuteType, Param>

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * assignments from the given source category to mixes or LR.
 *
 * These values are the pairs at top left of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const AssignToMixOrLRBase = {
	inputChannel: {
		mix: { MSB: 0x60, LSB: 0x44 },
		lr: { MSB: 0x60, LSB: 0x00 },
	},
	group: {
		mix: { MSB: 0x65, LSB: 0x04 },
		lr: { MSB: 0x60, LSB: 0x30 },
	},
	fxReturn: {
		mix: { MSB: 0x66, LSB: 0x14 },
		lr: { MSB: 0x60, LSB: 0x3c },
	},
} satisfies SourceToMixOrLR

export type AssignToMixOrLRType = keyof typeof AssignToMixOrLRBase

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * assignments from the given source category to the given sink category.  (Note
 * that when the source category is `'mix'`, this *doesn't* include the LR mix.)
 *
 * These values are the pairs at top left of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 * (Or table *section*, in the cases of `'lr-matrix'` and `'mix-matrix'`,
 * because the former must be treated specially due to LR being specially
 * encoded.)
 */
export const AssignToSinkBase = {
	'inputChannel-group': { MSB: 0x66, LSB: 0x74 },
	'fxReturn-group': { MSB: 0x6b, LSB: 0x34 },
	'inputChannel-fxSend': { MSB: 0x6c, LSB: 0x14 },
	'group-fxSend': { MSB: 0x6d, LSB: 0x54 },
	'fxReturn-fxSend': { MSB: 0x6e, LSB: 0x04 },
	'lr-matrix': { MSB: 0x6e, LSB: 0x24 },
	'mix-matrix': { MSB: 0x6e, LSB: 0x27 },
	'group-matrix': { MSB: 0x6e, LSB: 0x4b },
} satisfies SourceToSink

export type AssignToSinkType = keyof typeof AssignToSinkBase

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of a mix (not including LR) in a matrix.
 */
const MixInMatrixLevelBase = { MSB: 0x4e, LSB: 0x27 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of LR in a matrix.
 */
const LRInMatrixLevelBase = { MSB: 0x4e, LSB: 0x24 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of an input channel in a mix (not including LR).
 */
const InputChannelInMixLevelBase = { MSB: 0x40, LSB: 0x44 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of an input channel in LR.
 */
const InputChannelInLRLevelBase = { MSB: 0x40, LSB: 0x00 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of a group in a mix (not including LR).
 */
const GroupInMixLevelBase = { MSB: 0x45, LSB: 0x04 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of a group in LR.
 */
const GroupInLRLevelBase = { MSB: 0x40, LSB: 0x30 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of an FX return in a mix (not including LR).
 */
const FXReturnInMixLevelBase = { MSB: 0x46, LSB: 0x14 }

/**
 * The base parameter MSB/LSB value corresponding to manipulation of the level
 * of an FX return in LR.
 */
const FXReturnInLRLevelBase = { MSB: 0x40, LSB: 0x3c }

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * levels of a source of the given type in a sink of the given type.  (Note that
 * the `'mix'` category is mixes only and never includes the LR mix.)
 *
 * These values are the pairs at top left of the relevant table sections in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const LevelInSinkBase = {
	'inputChannel-mix': InputChannelInMixLevelBase,
	'inputChannel-lr': InputChannelInLRLevelBase,
	'group-mix': GroupInMixLevelBase,
	'group-lr': GroupInLRLevelBase,
	'group-fxSend': { MSB: 0x4d, LSB: 0x54 },
	'fxReturn-mix': FXReturnInMixLevelBase,
	'fxReturn-lr': FXReturnInLRLevelBase,
	'fxReturn-fxSend': { MSB: 0x4e, LSB: 0x04 },
	'fxReturn-group': { MSB: 0x4b, LSB: 0x34 },
	'inputChannel-fxSend': { MSB: 0x4c, LSB: 0x14 },
	'mix-matrix': MixInMatrixLevelBase,
	'lr-matrix': LRInMatrixLevelBase,
	'group-matrix': { MSB: 0x4e, LSB: 0x4b },
} satisfies SourceToSink

export type LevelInSinkType = keyof typeof LevelInSinkBase

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * levels of a source of the given type in a sink that's either a mix or LR.
 *
 * These values are the pairs at top left of relevant subtables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 *
 * XXX Can we avoid having two different tables to look up these base values?
 */
export const LevelInMixOrLRBase = {
	inputChannel: {
		mix: InputChannelInMixLevelBase,
		lr: InputChannelInLRLevelBase,
	},
	group: {
		mix: GroupInMixLevelBase,
		lr: GroupInLRLevelBase,
	},
	fxReturn: {
		mix: FXReturnInMixLevelBase,
		lr: FXReturnInLRLevelBase,
	},
} satisfies SourceToMixOrLR

export type LevelInMixOrLRType = keyof typeof LevelInMixOrLRBase

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * levels of a source that's either a mix or LR in a sink of the given type.
 *
 * These values are the pairs at top left of relevant subtables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 *
 * XXX Can we avoid having two different tables to look up these base values?
 */
export const MixOrLRLevelInSinkBase = {
	matrix: {
		mix: MixInMatrixLevelBase,
		lr: LRInMatrixLevelBase,
	},
} satisfies SourceToMixOrLR

export type LRLevelInSinkType = keyof typeof MixOrLRLevelInSinkBase

/**
 * Base parameter MSB/LSB values corresponding to setting the mixer pan/balance
 * level of the given source category in mixes or LR.
 *
 * These values are the pairs at top left of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const PanBalanceInMixOrLRBase = {
	inputChannel: {
		mix: { MSB: 0x50, LSB: 0x44 },
		lr: { MSB: 0x50, LSB: 0x00 },
	},
	group: {
		mix: { MSB: 0x55, LSB: 0x04 },
		lr: { MSB: 0x50, LSB: 0x30 },
	},
	fxReturn: {
		mix: { MSB: 0x56, LSB: 0x14 },
		lr: { MSB: 0x50, LSB: 0x3c },
	},
} satisfies SourceToMixOrLR

export type PanBalanceInMixOrLRType = keyof typeof PanBalanceInMixOrLRBase

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * pan/balance levels of the given source category in the given sink category.
 * (Note that when the source category is `'mix'`, this *doesn't* include the LR
 * mix.)
 *
 * These values are the pairs at top left of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 * (Or table *section*, in the cases of `'lr-matrix'` and `'mix-matrix'`,
 * because the former must be treated specially due to LR being specially
 * encoded.)
 */
export const PanBalanceInSinkBase = {
	'fxReturn-group': { MSB: 0x5b, LSB: 0x34 },
	'lr-matrix': { MSB: 0x5e, LSB: 0x24 },
	'mix-matrix': { MSB: 0x5e, LSB: 0x27 },
	'group-matrix': { MSB: 0x5e, LSB: 0x4b },
} satisfies SourceToSink

export type PanBalanceInSinkType = keyof typeof PanBalanceInSinkBase

/**
 * Base parameter MSB/LSB corresponding to setting levels of various sink
 * categories when assigned to physical mixer outputs.
 *
 * These values come from the top of the LR/mixes/matrixes to "Output" tables
 * under "Level Parameter Number - Master Sends" in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const SinkLevelInOutputBase = {
	lr: { MSB: 0x4f, LSB: 0x00 },
	mix: { MSB: 0x4f, LSB: 0x01 },
	fxSend: { MSB: 0x4f, LSB: 0x0d },
	matrix: { MSB: 0x4f, LSB: 0x11 },
	dca: { MSB: 0x4f, LSB: 0x20 },
} satisfies SourceToSink

export type SinkLevelInOutputType = keyof typeof SinkLevelInOutputBase

/**
 * Base parameter MSB/LSB corresponding to setting balance of various source
 * categories when assigned as mixer outputs.
 *
 * These values come from the top of the LR/mixes/matrixes to "Output" tables
 * under "Balance Parameter Number - Master Sends" in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const SinkPanBalanceInOutputBase = {
	lr: { MSB: 0x5f, LSB: 0x00 },
	mix: { MSB: 0x5f, LSB: 0x01 },
	matrix: { MSB: 0x5f, LSB: 0x11 },
}

export type SinkPanBalanceInOutputType = keyof typeof SinkPanBalanceInOutputBase
