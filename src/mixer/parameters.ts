/** A MIDI parameter number as its 7-bit MSB and LSB. */
export type Param = { MSB: number; LSB: number }

/**
 * Compute the MSB/LSB for a `source`-to-LR relationship.
 *
 * @param source
 *   The number of the source within its category, e.g. the fifth input channel
 *   would be `4`.
 *
 *   Note: `source` **must not** be the LR mix encoded as `99`!  To handle an LR
 *   source, specify `source === 0` and set `base` as if *that one line* in the
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

export function computeLRParameters(source: number, base: Param): Param {
	if (source === 99) {
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
 *   Note: `source` **must not** be the LR mix encoded as `99`!  To handle an LR
 *   source, specify `source === 0` and set `base` as if *that one line* in the
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
	if (source === 99) {
		throw new Error('LR source must be manually converted to 0 with parameter base appropriately adjusted')
	}
	if (sink === 99) {
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
	return sink === 99 ? computeLRParameters(source, lrBase) : computeParameters(source, sink, sinkCount, base)
}

type SourceToMixOrLR = {
	[key: string]: {
		normal: Param
		lr: Param
	}
}

type SourceToSink = {
	[key: string]: Param
}

/**
 * Base parameter MSB/LSB values corresponding to manipulations of SQ mixer
 * assignments from the given source category to mixes or LR.
 *
 * These values are the pairs at top left of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
export const AssignToMixOrLRBase = {
	inputChannel: {
		normal: { MSB: 0x60, LSB: 0x00 },
		lr: { MSB: 0x60, LSB: 0x44 },
	},
	group: {
		normal: { MSB: 0x65, LSB: 0x04 },
		lr: { MSB: 0x60, LSB: 0x30 },
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
 * because the former must be treated specially due to LR being encoded with
 * value `99` .)
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
