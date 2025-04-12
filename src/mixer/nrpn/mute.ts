import type { InputOutputType, Model } from '../model.js'
import { calculateParam, type Param, type UnbrandedParam } from './param.js'

/** The MSB/LSB 7-bit pair for the mute status of a mixer input/output. */
export type MuteParam = Param<'mute'>

type MuteParameterBaseRaw = Readonly<Record<InputOutputType, Readonly<UnbrandedParam>>>

/**
 * Base parameter MSB/LSB values for mute state of sources/sinks.  Note that LR
 * is considered to be a special category, distinct from mixes, that consists of
 * only the single LR mix.
 *
 * These values are the pairs in the columns of the relevant tables in the
 * [SQ MIDI Protocol document](https://www.allen-heath.com/content/uploads/2023/11/SQ-MIDI-Protocol-Issue5.pdf).
 */
const MuteParameterBaseRaw = {
	inputChannel: { MSB: 0x00, LSB: 0x00 },
	lr: { MSB: 0x00, LSB: 0x44 },
	mix: { MSB: 0x00, LSB: 0x45 },
	group: { MSB: 0x00, LSB: 0x30 },
	matrix: { MSB: 0x00, LSB: 0x55 },
	fxSend: { MSB: 0x00, LSB: 0x51 },
	fxReturn: { MSB: 0x00, LSB: 0x3c },
	dca: { MSB: 0x02, LSB: 0x00 },
	muteGroup: { MSB: 0x04, LSB: 0x00 },
} as const satisfies MuteParameterBaseRaw

type ApplyMuteBranding<T extends MuteParameterBaseRaw> = {
	[NRPN in keyof T]: T[NRPN] extends UnbrandedParam ? MuteParam : never
}

const MuteParameterBase = MuteParameterBaseRaw as ApplyMuteBranding<typeof MuteParameterBaseRaw>

/**
 * Calculate the NRPN for the mute state of the numbered input/output of the
 * given type.
 *
 * @param model
 *   The mixer model for which the NRPN is computed.
 * @param inputOutputType
 *   The type of the input/output, e.g. `'inputChannel'`.
 * @param n
 *   The specific zero-indexed input/output instance, e.g. `7` to refer to input
 *   channel 8.
 * @returns
 *   The NRPN for the identified input/output.
 */
export function calculateMuteParam(model: Model, inputOutputType: InputOutputType, n: number): MuteParam {
	if (model.inputOutputCounts[inputOutputType] <= n) {
		throw new Error(`${inputOutputType}=${n} is invalid`)
	}

	return calculateParam(MuteParameterBase[inputOutputType], n)
}

type ForEachMuteFunctor = (param: MuteParam) => void

export function forEachMute(model: Model, f: ForEachMuteFunctor): void {
	for (const [type, base] of Object.entries(MuteParameterBase)) {
		const muteType = type as InputOutputType
		model.forEach(muteType, (n: number) => {
			return f(calculateParam(base, n))
		})
	}
}
