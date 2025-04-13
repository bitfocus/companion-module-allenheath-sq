import type { Branded } from '../../utils/brand.js'
import { prettyByte } from '../../utils/pretty.js'

export type NRPNType = 'mute' | 'assign' | 'panBalance' | 'level'

/** A MIDI NRPN of a specific type as its 7-bit MSB and LSB. */
export type Param<T extends NRPNType> = T extends NRPNType
	? { MSB: Branded<number, `${T}-msb`>; LSB: Branded<number, `${T}-lsb`> }
	: never

/**
 * An untyped MIDI NRPN.  (This is generally only used to specify an NRPN in a
 * literal; `Param<T>` is used to overlay typing information upon MSB/LSB
 * parameters as actually used.)
 */
export type UnbrandedParam = { MSB: number; LSB: number }

export function makeParam<T extends NRPNType>(MSB: number, LSB: number): Param<T> {
	return { MSB, LSB } as Param<T>
}

/**
 * An NRPN for the assign state of a mixer source in a sink.
 * @allowunused
 */
export type AssignParam = Param<'assign'>

export function calculateParam<T extends NRPNType>(base: Param<T>, offset: number): Param<T> {
	const val = base.LSB + offset
	const LSB = val & 0b0111_1111
	const MSB = base.MSB + ((val >> 7) & 0xf)
	return { MSB, LSB } as Param<T>
}

export function prettyParam<T extends NRPNType>({ MSB, LSB }: Param<T>): string {
	return `MSB=${prettyByte(MSB)}, LSB=${prettyByte(LSB)}`
}
