import type { Branded } from '../../utils/brand.js'

export type NRPNType = 'assign' | 'panBalance' | 'level'

export type UnbrandedParam = { MSB: number; LSB: number }

type GenericMSB = Branded<number, 'generic-msb'>
type GenericLSB = Branded<number, 'generic-lsb'>

/** A MIDI parameter number as its 7-bit MSB and LSB. */
export type Param = { MSB: GenericMSB; LSB: GenericLSB }

type MuteMSB = Branded<number, 'mute-msb'>
type MuteLSB = Branded<number, 'mute-lsb'>

/** An NRPN for the mute status of a mixer input/output. */
export type MuteParam = { MSB: MuteMSB; LSB: MuteLSB }

type AssignMSB = Branded<number, 'assign-msb'>
type AssignLSB = Branded<number, 'assign-lsb'>

/**
 * An NRPN for the assign state of a mixer source in a sink.
 * @allowunused
 */
export type AssignParam = { MSB: AssignMSB; LSB: AssignLSB }

type LevelMSB = Branded<number, 'level-msb'>
type LevelLSB = Branded<number, 'level-lsb'>

/**
 * An NRPN for the level of a mixer source in a sink or a sink used as a mixer
 * output.
 */
export type LevelParam = { MSB: LevelMSB; LSB: LevelLSB }

type BalanceMSB = Branded<number, 'balance-msb'>
type BalanceLSB = Branded<number, 'balance-lsb'>

/**
 * An NRPN for the pan/balance of a mixer source in a sink or a sink used as a
 * mixer output.
 */
export type BalanceParam = { MSB: BalanceMSB; LSB: BalanceLSB }

export type ToKnownParam<NRPN extends NRPNType> = [NRPN] extends [NRPNType]
	? [NRPN] extends ['assign']
		? AssignParam
		: [NRPN] extends ['level']
			? LevelParam
			: [NRPN] extends ['panBalance']
				? BalanceParam
				: never
	: never
