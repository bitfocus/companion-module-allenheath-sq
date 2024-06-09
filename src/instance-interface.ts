import type { InstanceBase, SomeCompanionConfigField } from '@companion-module/base'
import type { SQInstanceConfig } from './config.js'
import type { FaderLaw, Mixer } from './mixer/mixer.js'

export type ParamHalf = readonly [number, number]

export type Level = number | string

export interface SQInstanceInterface {
	// Not declared, simply added in configUpdated
	config: SQInstanceConfig

	mixer: Mixer | null

	init: InstanceBase<SQInstanceConfig>['init']
	destroy: InstanceBase<SQInstanceConfig>['destroy']
	configUpdated: InstanceBase<SQInstanceConfig>['configUpdated']
	log: InstanceBase<SQInstanceConfig>['log']
	updateStatus: InstanceBase<SQInstanceConfig>['updateStatus']
	setVariableValues: InstanceBase<SQInstanceConfig>['setVariableValues']
	checkFeedbacks: InstanceBase<SQInstanceConfig>['checkFeedbacks']
	getVariableValue: InstanceBase<SQInstanceConfig>['getVariableValue']

	getConfigFields(): SomeCompanionConfigField[]

	// Defined in api.js, added via Object.assign.
	setLevel(
		ch: number,
		mx: number,
		ct: number,
		lv: Level,
		oMB: ParamHalf,
		oLB: ParamHalf,
		cnfg?: FaderLaw,
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
		cnfg?: FaderLaw,
	): Promise<number[][]>
	getRemoteLevel(): void
}
