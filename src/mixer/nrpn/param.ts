import type { Branded } from '../../utils/brand.js'
import { prettyByte } from '../../utils/pretty.js'

export type NRPNType = 'mute' | 'assign' | 'panBalance' | 'level'

/** A 14-bit NRPN of specific type. */
export type NRPN<T extends NRPNType> = Branded<number, `${T}-nrpn`>

/** A MIDI NRPN decomposed into 7-bit MSB and LSB. */
export type Param<T extends NRPNType> = T extends NRPNType
	? { MSB: Branded<number, `${T}-msb`>; LSB: Branded<number, `${T}-lsb`> }
	: never

/**
 * An untyped MIDI NRPN decomposed into 7-bit MSB and LSB.  (This is generally
 * only used to specify an NRPN in a literal; `Param<T>` is used to overlay
  typing information upon NRPN MSB/LSB as actually used.)
 */
export type UnbrandedParam = { MSB: number; LSB: number }

/** Compute an NRPN of the given type from a 7-bit MSB/LSB. */
export function makeNRPN<T extends NRPNType>(MSB: number, LSB: number): NRPN<T> {
	return ((MSB << 7) + LSB) as NRPN<T>
}

/**
 * An NRPN for the assign state of a mixer source in a sink.
 * @allowunused
 */
export type AssignParam = Param<'assign'>

/** Compute the NRPN at the given offset from another NRPN. */
export function calculateNRPN<T extends NRPNType>(nrpn: NRPN<T>, offset: number): NRPN<T> {
	return (nrpn + offset) as NRPN<T>
}

/** Split `nrpn` into its 7-bit halves. */
export function splitNRPN<T extends NRPNType>(nrpn: NRPN<T>): Param<T> {
	return { MSB: (nrpn >> 7) & 0b0111_1111, LSB: nrpn & 0b0111_1111 } as Param<T>
}

/** Convert a 7-bit MSB/LSB pair into a 14-bit NRPN. */
export function toNRPN<T extends NRPNType>({ MSB, LSB }: Param<T>): NRPN<T> {
	return makeNRPN(MSB, LSB)
}

/** Pretty-print an NRPN into its 7-bit MSB/LSB decomposition. */
export function prettyNRPN<T extends NRPNType>(nrpn: NRPN<T>): string {
	const { MSB, LSB } = splitNRPN(nrpn)
	return `MSB=${prettyByte(MSB)}, LSB=${prettyByte(LSB)}`
}
