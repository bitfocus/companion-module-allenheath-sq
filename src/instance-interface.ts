import type { InstanceBase, SomeCompanionConfigField } from '@companion-module/base'
import type { SQInstanceConfig } from './config.js'
import type { Mixer } from './mixer/mixer.js'

export type ParamHalf = readonly [number, number]

type Level = number | string

export interface SQInstanceInterface {
	// Not declared, simply added in configUpdated
	config: SQInstanceConfig

	mixer: Mixer | null

	dBToDec(lv: string | number, typ?: string): any
	decTodB(vc: number, vf: number, typ?: string): any

	init: InstanceBase<SQInstanceConfig>['init']
	destroy: InstanceBase<SQInstanceConfig>['destroy']
	configUpdated: InstanceBase<SQInstanceConfig>['configUpdated']
	log: InstanceBase<SQInstanceConfig>['log']
	updateStatus: InstanceBase<SQInstanceConfig>['updateStatus']

	getConfigFields(): SomeCompanionConfigField[]

	// Defined in api.js, added via Object.assign.
	setRouting(ch: number, mix: readonly number[], ac: boolean, mc: number, oMB: ParamHalf, oLB: ParamHalf): number[][]
	setLevel(
		ch: number,
		mx: number,
		ct: number,
		lv: Level,
		oMB: ParamHalf,
		oLB: ParamHalf,
		cnfg?: string,
	): Promise<number[][]>
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
		cnfg?: string,
	): Promise<number[][]>
	getRemoteLevel(): void
	getRemoteValue(data: number[]): Promise<void>
}
