import type { CompanionVariableValue, InstanceBase, SomeCompanionConfigField, TCPHelper } from '@companion-module/base'
import type { SQInstanceConfig } from './config.js'
import type { Model } from './mixer/model.js'

export type ParamHalf = readonly [number, number]

type Level = number | string

declare class sqInstance extends InstanceBase<SQInstanceConfig> {
	// Not declared, simply added in configUpdated
	config: SQInstanceConfig

	model: Model

	readonly fdbState: { [key: string]: boolean }
	readonly lastValue: { [key: string]: CompanionVariableValue }
	mch: number

	constructor(internal: unknown): InstanceBase<SQInstanceConfig>

	dBToDec(lv: string | number, typ?: string)
	decTodB(vc: number, vf: number, typ?: string)

	async destroy(): Promise<void>
	async init(config: SQInstanceConfig): Promise<void>

	getConfigFields(): SomeCompanionConfigField[]

	async configUpdated(config: SQInstanceConfig): Promise<void>

	// Absent after construction, added by initTCP in api.js
	midiSocket: TCPHelper | undefined

	// Defined in api.js, added via Object.assign.
	setRouting(ch: number, mix: readonly number[], ac: boolean, mc: number, oMB: ParamHalf, oLB: ParamHalf): number[][]
	async setLevel(
		ch: number,
		mx: number,
		ct: number,
		lv: Level,
		oMB: ParamHalf,
		oLB: ParamHalf,
		cnfg?: string,
	): Promise<number[][]>
	async setScene(val: number): Promise<number>
	getLevel(
		ch: number,
		mx: number,
		ct: number,
		oMB: ParamHalf,
		oLB: ParamHalf,
	): { buffer: [number[]]; channel: [number, number] }
	async fadeLevel(
		fd: number,
		ch: number,
		mx: number,
		ct: number,
		lv: Level,
		oMB: ParamHalf,
		oLB: ParamHalf,
		cnfg?: string,
	): Promise<number[][]>
	sendSocket(data: readonly number[]): void
	getRemoteLevel(): void
	getRemoteStatus(act: string): void
	async getRemoteValue(data: number[]): Promise<void>
	initTCP(): void
	async sendBuffers(buffers: readonly number[][]): Promise<void>
}
