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

type NextCommandReadiness = {
	readonly type: 'command-readiness'
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

export type Interaction = ReceiveInteraction | NextCommandReadiness | ExpectInteraction

/** Receive the given MIDI channel message. */
export function ReceiveChannelMessage(message: readonly number[]): ReceiveChannel {
	return { type: 'receive-channel-message', message }
}

/** Receive the given MIDI system common message. */
export function ReceiveSystemCommonMessage(message: readonly number[]): ReceiveSystemCommon {
	return { type: 'receive-system-common-message', message }
}

/** Receive the given MIDI system exclusive message. */
export function ReceiveSystemExclusiveMessage(message: readonly number[]): ReceiveSystemExclusive {
	return { type: 'receive-system-exclusive-message', message }
}

/** Receive the given system real time single-byte message. */
export function ReceiveSystemRealTimeMessage(message: number): ReceiveSystemRealTime {
	return { type: 'receive-system-real-time', message }
}

/** Expect that the next mixer command is ready/not ready. */
export function ExpectNextCommandReadiness(ready: boolean): NextCommandReadiness {
	return { type: 'command-readiness', ready }
}

/**
 * Expect that the next mixer command is a mixer scene recall command specifying
 * the given scene.
 *
 * @param scene
 *   The zero-indexed scene (i.e. `[0, 300)` for SQ mixer scenes 1-300).
 */
export function ExpectSceneMessage(scene: number): ExpectScene {
	return { type: 'expect-scene', args: [scene] }
}

/**
 * Expect that the next mixer command is a mixer mute on/off command.
 *
 * @param msb
 *   The expected MSB byte.
 * @param lsb
 *   The expected LSB byte.
 * @param vf
 *   The velocity (fine) byte in the message.  (The velocity [coarse] byte in a
 *   mute message is always zero.)
 */
export function ExpectMuteMessage(msb: number, lsb: number, vf: number): ExpectMute {
	if (!(vf === 0 || vf === 1)) {
		throw new Error(`vf=${vf} in a mixer mute command must be 0 or 1`)
	}
	return { type: 'expect-mute', args: [msb, lsb, vf] }
}

/**
 * Expect that the next mixer command is a fader level-setting command.
 *
 * @param msb
 *   The expected MSB byte.
 * @param lsb
 *   The expected LSB byte.
 * @param vc
 *   The velocity (coarse) byte in the message.
 * @param vf
 *   The velocity (fine) byte in the message.
 */
export function ExpectFaderLevelMessage(msb: number, lsb: number, vc: number, vf: number): ExpectFaderLevel {
	return { type: 'expect-fader-level', args: [msb, lsb, vc, vf] }
}

/**
 * Expect that the next mixer command is a pan/balance level-setting command.
 *
 * @param msb
 *   The expected MSB byte.
 * @param lsb
 *   The expected LSB byte.
 * @param vc
 *   The velocity (coarse) byte in the message.
 * @param vf
 *   The velocity (fine) byte in the message.
 */
export function ExpectPanLevelMessage(msb: number, lsb: number, vc: number, vf: number): ExpectPanLevel {
	return { type: 'expect-pan-level', args: [msb, lsb, vc, vf] }
}
