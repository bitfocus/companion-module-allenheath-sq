import { getSourceSinkCalculator, type InputOutputType, type Model } from '../model.js'
import type { Param, ToKnownParam, UnbrandedParam } from './param.js'

type SourceToSinkInfo = {
	/**
	 * Base parameter MSB/LSB values for controlling the assignment status of
	 * some source in some sink.
	 */
	readonly assign?: UnbrandedParam

	/**
	 * Base parameter MSB/LSB values for controlling the level of some source in
	 * some sink.
	 *
	 * For example, input channels, groups, and FX returns can be assigned to FX
	 * sends with levels set, so those relationships would define this property.
	 * Meanwhile input channel levels can't be set in groups, so this property
	 * would be absent for that relationship.
	 */
	readonly level?: UnbrandedParam

	/**
	 * Base parameter MSB/LSB values for controlling the pan/balance of some
	 * source in some sink.
	 *
	 * For example, input channels can be panned left/right in stereo mixes and
	 * in LR so will define this property.  But input channels can't be panned
	 * in groups, so that relationship doesn't define this property.
	 */
	readonly panBalance?: UnbrandedParam
}

export type SourceSinkNRPN = keyof Required<SourceToSinkInfo>

type SinkInfo = {
	readonly [sink in InputOutputType]?: SourceToSinkInfo
}

type SourceToSinkType = {
	readonly [source in InputOutputType]?: SinkInfo
}

/**
 * Base parameter MSB/LSB values corresponding to all mixer source-sink
 * relationships.  (Note that the `'mix'` category is mixes only and never
 * includes the LR mix.)
 *
 * These values are the pairs at top left of the relevant table sections in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 * Note that when the table has mixes/LR as either source or sink, this may not
 * be top left of the entire table but only of a subset of it.  This is fine so
 * long as the math works out such that the combined 14-bit MSB:LSB increases by
 * one as you move rightward across a row, then down to start of the next row to
 * move rightward again.
 */
const SourceToSinkParameterBaseRaw = {
	inputChannel: {
		group: {
			assign: { MSB: 0x66, LSB: 0x74 },
		},
		fxSend: {
			assign: { MSB: 0x6c, LSB: 0x14 },
			level: { MSB: 0x4c, LSB: 0x14 },
		},
		mix: {
			assign: { MSB: 0x60, LSB: 0x44 },
			level: { MSB: 0x40, LSB: 0x44 },
			panBalance: { MSB: 0x50, LSB: 0x44 },
		},
		lr: {
			assign: { MSB: 0x60, LSB: 0x00 },
			level: { MSB: 0x40, LSB: 0x00 },
			panBalance: { MSB: 0x50, LSB: 0x00 },
		},
	},
	fxReturn: {
		fxSend: {
			assign: { MSB: 0x6e, LSB: 0x04 },
			level: { MSB: 0x4e, LSB: 0x04 },
		},
		mix: {
			assign: { MSB: 0x66, LSB: 0x14 },
			level: { MSB: 0x46, LSB: 0x14 },
			panBalance: { MSB: 0x56, LSB: 0x14 },
		},
		lr: {
			assign: { MSB: 0x60, LSB: 0x3c },
			level: { MSB: 0x40, LSB: 0x3c },
			panBalance: { MSB: 0x50, LSB: 0x3c },
		},
		group: {
			assign: { MSB: 0x6b, LSB: 0x34 },
		},
	},
	group: {
		fxSend: {
			assign: { MSB: 0x6d, LSB: 0x54 },
			level: { MSB: 0x4d, LSB: 0x54 },
		},
		mix: {
			assign: { MSB: 0x65, LSB: 0x04 },
			level: { MSB: 0x45, LSB: 0x04 },
			panBalance: { MSB: 0x55, LSB: 0x04 },
		},
		lr: {
			assign: { MSB: 0x60, LSB: 0x30 },
			level: { MSB: 0x40, LSB: 0x30 },
			panBalance: { MSB: 0x50, LSB: 0x30 },
		},
		matrix: {
			assign: { MSB: 0x6e, LSB: 0x4b },
			level: { MSB: 0x4e, LSB: 0x4b },
			panBalance: { MSB: 0x5e, LSB: 0x4b },
		},
	},
	lr: {
		matrix: {
			assign: { MSB: 0x6e, LSB: 0x24 },
			level: { MSB: 0x4e, LSB: 0x24 },
			panBalance: { MSB: 0x5e, LSB: 0x24 },
		},
	},
	mix: {
		matrix: {
			assign: { MSB: 0x6e, LSB: 0x27 },
			level: { MSB: 0x4e, LSB: 0x27 },
			panBalance: { MSB: 0x5e, LSB: 0x27 },
		},
	},
} as const satisfies SourceToSinkType

type ApplySourceToSinkBranding<T extends SourceToSinkType> = {
	[Source in keyof T]: T[Source] extends SinkInfo
		? {
				[Sink in keyof T[Source]]: T[Source][Sink] extends SourceToSinkInfo
					? {
							[NRPN in keyof T[Source][Sink]]: T[Source][Sink][NRPN] extends UnbrandedParam ? Param : never
						}
					: never
			}
		: T[Source] extends undefined
			? SinkInfo | undefined
			: never
}

const SourceToSinkParameterBase = SourceToSinkParameterBaseRaw as ApplySourceToSinkBranding<
	typeof SourceToSinkParameterBaseRaw
>

type SourceToSinkParameterBaseType = typeof SourceToSinkParameterBase

type SourceSinkForSourceToSinkForNRPN<
	Source extends InputOutputType,
	Sink extends InputOutputType,
	NRPN extends SourceSinkNRPN,
> = Source extends keyof SourceToSinkParameterBaseType
	? Sink extends keyof SourceToSinkParameterBaseType[Source]
		? SourceToSinkParameterBaseType[Source][Sink] extends { [nrpnType in NRPN]: Param }
			? [Source, Sink]
			: never
		: never
	: never

/** All `[Source, Sink]` pairs that support all of the specified NRPN types. */
export type SourceSinkForNRPN<NRPN extends SourceSinkNRPN> = SourceSinkForSourceToSinkForNRPN<
	InputOutputType,
	InputOutputType,
	NRPN
>

type SourceForSourceToMixAndLRForNRPN<
	Source extends InputOutputType,
	NRPN extends SourceSinkNRPN,
> = Source extends keyof SourceToSinkParameterBaseType
	? SourceToSinkParameterBaseType[Source] extends { [sink in 'mix' | 'lr']: { [nrpnType in NRPN]: Param } }
		? Source
		: never
	: never

/** All `Source` that support all the specified NRPNs in both mixes and LR. */
export type SourceForSourceInMixAndLRForNRPN<NRPN extends SourceSinkNRPN> = SourceForSourceToMixAndLRForNRPN<
	InputOutputType,
	NRPN
>

type SinkHasNRPN<Source extends InputOutputType, Sink extends InputOutputType, NRPN extends SourceSinkNRPN> = [
	Source,
] extends [keyof SourceToSinkParameterBaseType]
	? Sink extends keyof SourceToSinkParameterBaseType[Source]
		? SourceToSinkParameterBaseType[Source][Sink] extends { [nrpnType in NRPN]: Param }
			? Sink
			: never
		: never
	: never

/**
 * All `Sink` where mixes and LR both support all the specified NRPNs in `Sink`.
 */
export type SinkForMixAndLRInSinkForNRPN<NRPN extends SourceSinkNRPN> = SinkHasNRPN<'mix', InputOutputType, NRPN> &
	SinkHasNRPN<'lr', InputOutputType, NRPN>

/**
 * A class that can be used to calculate a specific kind of NRPN for a
 * source-to-sink relationship.
 */
class NRPNCalculator<NRPN extends SourceSinkNRPN> {
	readonly #inputOutputCounts
	readonly #sourceSink: SourceSinkForNRPN<NRPN>
	readonly #base: UnbrandedParam

	/**
	 * Construct a calculator for NRPNs of type identified by `nrpnType` for
	 * some `sourceType` in some `sinkType` for the given mixer model.
	 *
	 * @param model
	 *   The mixer model for which NRPNs are computed.
	 * @param sourceType
	 *   The source type, e.g. `'inputChannel'`.
	 * @param sinkType
	 *   The sink type, e.g. `'mix'`.
	 * @param nrpnType
	 *   The type of NRPNs to compute, e.g. `'assign'`.
	 */
	constructor(model: Model, nrpnType: NRPN, sourceSink: SourceSinkForNRPN<NRPN>) {
		this.#inputOutputCounts = model.inputOutputCounts
		this.#sourceSink = sourceSink

		const [sourceType, sinkType] = this.#sourceSink

		// TypeScript doesn't preserve awareness of the validity of the property
		// walk described by `sourceSink[0]` (source type), `sourceSink[1]`
		// (sink type), and `nrpnType` after `SourceSinkNRPNMatches` has done
		// its thing.  Do enough casting to make the property access sequence
		// type-check.
		const sinks = SourceToSinkParameterBase[sourceType] as SourceToSinkType[InputOutputType] as SinkInfo
		const info = sinks[sinkType] as Required<SourceToSinkInfo>
		this.#base = info[nrpnType]
	}

	/**
	 * Calculate the NRPN for the desired source and sink.
	 *
	 * @param source
	 *   The zero-indexed source within the source type specified at
	 *   construction.
	 * @param sink
	 *   The zero-indexed sink within the source type specified at construction.
	 * @returns
	 *   The computed NRPN.
	 */
	calculate(source: number, sink: number): ToKnownParam<NRPN> {
		const [sourceType, sinkType] = this.#sourceSink

		const inputOutputCounts = this.#inputOutputCounts
		if (inputOutputCounts[sourceType] <= source) {
			throw new Error(`${sourceType}=${source} is invalid`)
		}

		const sinkCount = inputOutputCounts[sinkType]
		if (sinkCount <= sink) {
			throw new Error(`${sinkType}=${sink} is invalid`)
		}

		const base = this.#base

		const val = base.LSB + sinkCount * source + sink
		return { MSB: base.MSB + ((val >> 7) & 0xf), LSB: val & 0x7f } as ToKnownParam<NRPN>
	}
}

/**
 * A class that can be used to calculate NRPNs controlling assignment of some
 * type of source to some type of sink.
 */
export class AssignNRPNCalculator extends NRPNCalculator<'assign'> {
	constructor(model: Model, sourceSink: SourceSinkForNRPN<'assign'>) {
		super(model, 'assign', sourceSink)
	}

	static get(model: Model, sourceSink: SourceSinkForNRPN<'assign'>): AssignNRPNCalculator {
		return getSourceSinkCalculator(model, 'assign', sourceSink, AssignNRPNCalculator)
	}
}

/**
 * A class that can be used to calculate level NRPNs for a category of
 * source-to-sink relationships.
 */
export class LevelNRPNCalculator extends NRPNCalculator<'level'> {
	constructor(model: Model, sourceSink: SourceSinkForNRPN<'level'>) {
		super(model, 'level', sourceSink)
	}

	static get(model: Model, sourceSink: SourceSinkForNRPN<'level'>): LevelNRPNCalculator {
		return getSourceSinkCalculator(model, 'level', sourceSink, LevelNRPNCalculator)
	}
}

/**
 * A class that can be used to calculate pan/balance NRPNs for a category of
 * source-to-sink relationships.
 */
export class BalanceNRPNCalculator extends NRPNCalculator<'panBalance'> {
	constructor(model: Model, sourceSink: SourceSinkForNRPN<'panBalance'>) {
		super(model, 'panBalance', sourceSink)
	}

	static get(model: Model, sourceSink: SourceSinkForNRPN<'panBalance'>): BalanceNRPNCalculator {
		return getSourceSinkCalculator(model, 'panBalance', sourceSink, BalanceNRPNCalculator)
	}
}

export type SourceSinkCalculatorForNRPN<NRPN extends SourceSinkNRPN> = NRPN extends SourceSinkNRPN
	? [NRPN] extends ['assign']
		? typeof AssignNRPNCalculator
		: [NRPN] extends ['level']
			? typeof LevelNRPNCalculator
			: [NRPN] extends ['panBalance']
				? typeof BalanceNRPNCalculator
				: never
	: never

type SourceToSinkCalculatorCacheForNRPN<T extends SourceToSinkType, NRPN extends SourceSinkNRPN> = {
	[Source in keyof T]: T[Source] extends SinkInfo
		? {
				-readonly [Sink in keyof T[Source] as NRPN extends keyof T[Source][Sink] ? Sink : never]: InstanceType<
					SourceSinkCalculatorForNRPN<NRPN>
				> | null
			}
		: never
}

export type SourceToSinkCalculatorCache = {
	readonly assign: SourceToSinkCalculatorCacheForNRPN<SourceToSinkParameterBaseType, 'assign'>
	readonly level: SourceToSinkCalculatorCacheForNRPN<SourceToSinkParameterBaseType, 'level'>
	readonly panBalance: SourceToSinkCalculatorCacheForNRPN<SourceToSinkParameterBaseType, 'panBalance'>
}
