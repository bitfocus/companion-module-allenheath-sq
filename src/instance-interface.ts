import type { sqInstance } from './instance.js'

export type ParamHalf = readonly [number, number]

export type Level = number | string

export interface SQInstanceInterface {
	// Not declared, simply added in configUpdated
	config: sqInstance['config']

	mixer: sqInstance['mixer']

	init: sqInstance['init']
	destroy: sqInstance['destroy']
	configUpdated: sqInstance['configUpdated']
	log: sqInstance['log']
	updateStatus: sqInstance['updateStatus']
	setVariableValues: sqInstance['setVariableValues']
	checkFeedbacks: sqInstance['checkFeedbacks']
	getVariableValue: sqInstance['getVariableValue']

	getConfigFields(): sqInstance['getConfigFields']

	// Defined in api.js, added via Object.assign.
	setLevel(ch: number, mx: number, ct: number, lv: Level, oMB: ParamHalf, oLB: ParamHalf): Promise<number[][]>
	getLevel(
		ch: number,
		mx: number,
		ct: number,
		oMB: ParamHalf,
		oLB: ParamHalf,
	): { commands: [number[]]; channel: [number, number] }
	fadeLevel(
		fd: number,
		ch: number,
		mx: number,
		ct: number,
		lv: Level,
		oMB: ParamHalf,
		oLB: ParamHalf,
	): Promise<number[][]>
	getRemoteLevel(): void
}
