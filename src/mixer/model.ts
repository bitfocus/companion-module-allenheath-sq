import { type ModelId, SQModels } from './models.js'
import {
	type OutputCalculatorCache,
	type OutputCalculatorForNRPN,
	type OutputNRPN,
	type SinkAsOutputForNRPN,
	type SinkToCalculator,
} from './nrpn/output.js'
import {
	type SourceSinkCalculatorForNRPN,
	type SourceSinkNRPN,
	type SourceSinkForNRPN,
	type SourceToSinkCalculatorCache,
} from './nrpn/source-to-sink.js'

type ForEachFunctor = (n: number, label: string, desc: string) => void

/** A record of the count of inputs, outputs, and soft keys on an SQ mixer. */
type MixerCounts = {
	inputChannel: number
	mix: number
	group: number
	fxReturn: number
	fxSend: number
	matrix: number
	dca: number
	muteGroup: number

	// LR isn't a mix in the same sense as all other mixes, because the base
	// NRPN for source-to-LR mappings is unrelated to the base for source-to-mix
	// mappings.   We therefore treat LR as a separate single-element category.
	lr: 1

	softKey: number
}

/** The type of all inputs and outputs on an SQ mixer. */
export type InputOutputType = Exclude<keyof MixerCounts, 'softKey'>

type LabelDesc = {
	readonly pairs: (readonly [string, string])[]
	readonly generate: (i: number) => readonly [string, string]
}

/**
 * The value of the LR mix, in any interface that accepts either a mix (0
 * through 11 if there exist mixes 1 to 12) or LR.
 *
 * (This really shouldn't be a number, so that mix numbers and this value can
 * have different types.  But action options currently use `99` to encode LR,
 * and that probably needs to change before this can be changed to e.g. `'lr'`.)
 */
export const LR = 99

let outputCalculatorCache: (model: Model) => OutputCalculatorCache
let sourceSinkCalculatorCache: (model: Model) => SourceToSinkCalculatorCache

export class Model {
	/** Counts of all inputs/outputs for this mixer model. */
	readonly inputOutputCounts: MixerCounts

	/** The number of softkeys on the mixer. */
	softKeys: number

	/** The number of rotaries on the mixer. */
	rotaryKeys: number

	/** The number of scenes that can be stored in the mixer. */
	scenes: number

	/** Create a representation of a mixer identified by `modelId`. */
	constructor(modelId: ModelId) {
		const sqModel = SQModels[modelId]

		this.inputOutputCounts = {
			inputChannel: sqModel.chCount,
			mix: sqModel.mixCount,
			group: sqModel.grpCount,
			fxReturn: sqModel.fxrCount,
			fxSend: sqModel.fxsCount,
			matrix: sqModel.mtxCount,
			dca: sqModel.dcaCount,
			muteGroup: sqModel.muteGroupCount,

			lr: 1,

			softKey: sqModel.softKeyCount,
		}

		this.softKeys = sqModel.softKeyCount
		this.rotaryKeys = sqModel.RotaryKey
		this.scenes = sqModel.sceneCount
	}

	readonly #labelsDescs: Record<InputOutputType | 'softKey', LabelDesc> = {
		inputChannel: {
			pairs: [],
			generate(channel: number) {
				const label = `CH ${channel + 1}`
				return [label, label]
			},
		},
		mix: {
			pairs: [],
			generate: (mix) => [`AUX ${mix + 1}`, `Aux ${mix + 1}`],
		},
		group: {
			pairs: [],
			generate: (group: number) => [`GROUP ${group + 1}`, `Group ${group + 1}`],
		},
		fxReturn: {
			pairs: [],
			generate: (fxr: number) => [`FX RETURN ${fxr + 1}`, `FX Return ${fxr + 1}`],
		},
		fxSend: {
			pairs: [],
			generate: (fxs: number) => [`FX SEND ${fxs + 1}`, `FX Send ${fxs + 1}`],
		},
		matrix: {
			pairs: [],
			generate: (matrix: number) => [`MATRIX ${matrix + 1}`, `Matrix ${matrix + 1}`],
		},
		dca: {
			pairs: [],
			generate: (dca: number) => {
				const label = `DCA ${dca + 1}`
				return [label, label]
			},
		},
		muteGroup: {
			pairs: [],
			generate: (muteGroup: number) => {
				const label = `MuteGroup ${muteGroup + 1}`
				return [label, label]
			},
		},
		lr: {
			pairs: [],
			generate: (_lr: number) => {
				// Note: `_lr === 0` here but `LR === 99`.
				return ['LR', 'LR']
			},
		},

		softKey: {
			pairs: [],
			generate: (key: number) => [`SOFTKEY ${key + 1}`, `SoftKey ${key + 1}`],
		},
	}

	forEach(type: InputOutputType | 'softKey', f: ForEachFunctor): void {
		if (type === 'lr') {
			// Note: `LR === 99` rather than `0` to `N` as is the case for all
			// the other functors.  (This can be regularized to `0` when LR's
			// internal handling is decoupled from the encoding of LR as 99 in
			// actions, but for right now it requires a special case.)
			f(LR, 'LR', 'LR')
			return
		}

		const labelDescs = this.#labelsDescs[type]
		const pairs = labelDescs.pairs
		if (pairs.length === 0) {
			for (let i = 0, count = this.inputOutputCounts[type]; i < count; i++) {
				pairs.push(labelDescs.generate(i))
			}
		}

		pairs.forEach(([label, desc], i) => {
			f(i, label, desc)
		})
	}

	#outputCalculators: OutputCalculatorCache = {
		level: {
			lr: null,
			mix: null,
			matrix: null,
			fxSend: null,
			dca: null,
		},
		panBalance: {
			lr: null,
			mix: null,
			matrix: null,
		},
	}

	static {
		outputCalculatorCache = (model: Model) => model.#outputCalculators
	}

	#sourceSinkCalculators: SourceToSinkCalculatorCache = {
		assign: {
			inputChannel: {
				group: null,
				fxSend: null,
				mix: null,
				lr: null,
			},
			fxReturn: {
				fxSend: null,
				mix: null,
				lr: null,
				group: null,
			},
			group: {
				fxSend: null,
				mix: null,
				lr: null,
				matrix: null,
			},
			lr: {
				matrix: null,
			},
			mix: {
				matrix: null,
			},
		},
		level: {
			inputChannel: {
				fxSend: null,
				mix: null,
				lr: null,
			},
			fxReturn: {
				fxSend: null,
				mix: null,
				lr: null,
			},
			group: {
				fxSend: null,
				mix: null,
				lr: null,
				matrix: null,
			},
			lr: {
				matrix: null,
			},
			mix: {
				matrix: null,
			},
		},
		panBalance: {
			inputChannel: {
				mix: null,
				lr: null,
			},
			fxReturn: {
				mix: null,
				lr: null,
			},
			group: {
				mix: null,
				lr: null,
				matrix: null,
			},
			lr: {
				matrix: null,
			},
			mix: {
				matrix: null,
			},
		},
	}

	static {
		sourceSinkCalculatorCache = (model: Model) => model.#sourceSinkCalculators
	}
}

export function getOutputCalculator<NRPN extends OutputNRPN>(
	model: Model,
	nrpnType: NRPN,
	sinkType: SinkAsOutputForNRPN<NRPN>,
	Calculator: OutputCalculatorForNRPN<NRPN>,
): InstanceType<OutputCalculatorForNRPN<NRPN>> {
	const cache = outputCalculatorCache(model)
	const calcs = cache[nrpnType] as SinkToCalculator<NRPN>
	let calc = calcs[sinkType]
	if (calc === null) {
		calc = calcs[sinkType] = new Calculator(model, sinkType as any) as any
	}
	return calc!
}

export function getSourceSinkCalculator<NRPN extends SourceSinkNRPN>(
	model: Model,
	nrpnType: NRPN,
	sourceSink: SourceSinkForNRPN<NRPN>,
	Calculator: SourceSinkCalculatorForNRPN<NRPN>,
): InstanceType<SourceSinkCalculatorForNRPN<NRPN>> {
	const cache = sourceSinkCalculatorCache(model)
	const calcs = cache[nrpnType] as Record<
		InputOutputType,
		Record<InputOutputType, InstanceType<SourceSinkCalculatorForNRPN<NRPN>> | null>
	>
	const [sourceType, sinkType] = sourceSink
	const sinks = calcs[sourceType]
	let calc = sinks[sinkType]
	if (calc === null) {
		calc = sinks[sinkType] = new Calculator(model, sourceSink as any) as any
	}
	return calc!
}
