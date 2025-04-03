import type { InputOutputType, Model } from '../model.js'
import type { Param } from './param.js'

type OutputInfo = {
	/** The base MSB/LSB for adjusting output level. */
	readonly level: Param

	/**
	 * The base MSB/LSB for adjusting output balance.  Only stereo
	 * outputs define this; mono outputs omit it.
	 */
	readonly panBalance?: Param
}

/**
 * The type of all NRPNs that apply to at least one mixer sink being used as an
 * output.
 */
type OutputNRPN = keyof Required<OutputInfo>

/**
 * Base parameter MSB/LSB values for mixer sinks set as mixer outputs.  Note
 * that LR is considered to be a special category, distinct from mixes, that
 * consists of only the single LR mix.
 *
 * These values are the pairs in the columns of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
const OutputParameterBase = {
	lr: {
		level: { MSB: 0x4f, LSB: 0x00 },
		panBalance: { MSB: 0x5f, LSB: 0x00 },
	},
	mix: {
		level: { MSB: 0x4f, LSB: 0x01 },
		panBalance: { MSB: 0x5f, LSB: 0x01 },
	},
	// XXX Note that with 1.6.* firmware, if any matrixes have been split into
	//     two mono matrixes, this likely mishandles stuff, as the first 1.6.*
	//     release explicitly doesn't provide MIDI control of mono matrixes, and
	//     this might affect stereo matrixes as well.
	matrix: {
		level: { MSB: 0x4f, LSB: 0x11 },
		panBalance: { MSB: 0x5f, LSB: 0x11 },
	},
	fxSend: {
		level: { MSB: 0x4f, LSB: 0x0d },
	},
	dca: {
		level: { MSB: 0x4f, LSB: 0x20 },
	},
} as const satisfies Partial<Readonly<Record<InputOutputType, Readonly<OutputInfo>>>>

type OutputParameterBaseType = typeof OutputParameterBase

type OutputSinkMatchesNRPN<
	Sink extends keyof OutputParameterBaseType,
	NRPN extends OutputNRPN,
> = Sink extends keyof OutputParameterBaseType
	? [NRPN] extends [keyof OutputParameterBaseType[Sink]]
		? [Sink, NRPN]
		: never
	: never

/** Enumerate all `Sink` usable as output supporting the given NRPN. */
export type SinkAsOutputForNRPN<NRPN extends OutputNRPN> = OutputSinkMatchesNRPN<keyof OutputParameterBaseType, NRPN>[0]

class OutputNRPNCalculator<NRPN extends OutputNRPN> {
	readonly #inputOutputCounts
	readonly #sinkType
	readonly #base

	constructor(model: Model, nrpnType: NRPN, sinkType: SinkAsOutputForNRPN<NRPN>) {
		this.#inputOutputCounts = model.inputOutputCounts
		this.#sinkType = sinkType

		// TypeScript doesn't preserve awareness of the validity of the property
		// walk described by `sinkType` and `nrpnType` after
		// `OutputSinkMatchesNRPN` does its thing.  Do enough casting to make
		// the property access sequence type-check.
		const info = OutputParameterBase[sinkType] as Required<OutputInfo>
		this.#base = info[nrpnType]
	}

	calculate(sink: number): Param {
		if (this.#inputOutputCounts[this.#sinkType] <= sink) {
			throw new Error(`${this.#sinkType}=${sink} is invalid`)
		}

		const { MSB, LSB } = this.#base

		const val = LSB + sink
		return { MSB: MSB + ((val >> 7) & 0xf), LSB: val & 0x7f }
	}
}

export class OutputLevelNRPNCalculator extends OutputNRPNCalculator<'level'> {
	constructor(model: Model, sinkType: SinkAsOutputForNRPN<'level'>) {
		super(model, 'level', sinkType)
	}
}

export class OutputBalanceNRPNCalculator extends OutputNRPNCalculator<'panBalance'> {
	constructor(model: Model, sinkType: SinkAsOutputForNRPN<'panBalance'>) {
		super(model, 'panBalance', sinkType)
	}
}
