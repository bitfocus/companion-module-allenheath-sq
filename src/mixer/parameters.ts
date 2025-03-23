import { LR } from './model.js'
import type { UnbrandedParam } from './nrpn/param.js'

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

function computeLRParameters(source: number, base: UnbrandedParam): UnbrandedParam {
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

function computeParameters(source: number, sink: number, sinkCount: number, base: UnbrandedParam): UnbrandedParam {
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
	base: UnbrandedParam,
	lrBase: UnbrandedParam,
): UnbrandedParam {
	return sink === LR ? computeLRParameters(source, lrBase) : computeParameters(source, sink, sinkCount, base)
}
