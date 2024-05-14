type ReceiveChannel = {
	readonly type: 'receive-channel-message'
	readonly message: readonly number[]
}

type ReceiveSystemCommon = {
	readonly type: 'receive-system-common-message'
	readonly message: readonly number[]
}

type ReceiveSystemExclusive = {
	readonly type: 'receive-system-exclusive-message'
	readonly message: readonly number[]
}

type ReceiveSystemRealTime = {
	readonly type: 'receive-system-real-time'
	readonly message: number
}

type NextMessageReadiness = {
	readonly type: 'message-readiness'
	ready: boolean
}

type ExpectScene = {
	readonly type: 'expect-scene'
	readonly args: readonly number[]
}

type ExpectMute = {
	readonly type: 'expect-mute'
	readonly args: readonly number[]
}

type ExpectFaderLevel = {
	readonly type: 'expect-fader-level'
	readonly args: readonly number[]
}

type ExpectPanLevel = {
	readonly type: 'expect-pan-level'
	readonly args: readonly number[]
}

export type ReceiveInteraction = ReceiveChannel | ReceiveSystemCommon | ReceiveSystemExclusive | ReceiveSystemRealTime

export type ExpectInteraction = ExpectScene | ExpectMute | ExpectFaderLevel | ExpectPanLevel

export type Interaction = ReceiveInteraction | NextMessageReadiness | ExpectInteraction

export function ReceiveChannelMessage(message: readonly number[]): ReceiveChannel {
	return { type: 'receive-channel-message', message }
}

export function ReceiveSystemCommonMessage(message: readonly number[]): ReceiveSystemCommon {
	return { type: 'receive-system-common-message', message }
}

export function ReceiveSystemExclusiveMessage(message: readonly number[]): ReceiveSystemExclusive {
	return { type: 'receive-system-exclusive-message', message }
}

export function ReceiveSystemRealTimeMessage(message: number): ReceiveSystemRealTime {
	return { type: 'receive-system-real-time', message }
}

export function ExpectNextMessageReadiness(ready: boolean): NextMessageReadiness {
	return { type: 'message-readiness', ready }
}

export function ExpectSceneMessage(scene: number): ExpectScene {
	return { type: 'expect-scene', args: [scene] }
}

export function ExpectMuteMessage(msb: number, lsb: number, vf: number): ExpectMute {
	return { type: 'expect-mute', args: [msb, lsb, vf] }
}

export function ExpectFaderLevelMessage(msb: number, lsb: number, vc: number, vf: number): ExpectFaderLevel {
	return { type: 'expect-fader-level', args: [msb, lsb, vc, vf] }
}

export function ExpectPanLevelMessage(msb: number, lsb: number, vc: number, vf: number): ExpectPanLevel {
	return { type: 'expect-pan-level', args: [msb, lsb, vc, vf] }
}
