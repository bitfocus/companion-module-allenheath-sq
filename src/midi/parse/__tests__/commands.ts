/**
 * Compute the sequence of MIDI messages that correspond to an SQ scene recall
 * command.
 *
 * @param channel
 *   The MIDI channel the scene recall should be sent on.
 * @param scene
 *   The scene to request.  (Note that this is zero-indexed, so on an SQ-5 with
 *   scenes 1-300 this will be `[0, 300)`.)
 * @returns
 *   An array of the MIDI messages that constitute the requested scene recall.
 */
export function SceneCommand(channel: number, scene: number): [[number, number, number], [number, number]] {
	return [
		[0xb0 | channel, 0x00, scene >> 7],
		[0xc0 | channel, scene & 0x7f],
	]
}

/**
 * The type of an NRPN data entry sequence, consisting of an array of four MIDI
 * Control Change message arrays as its elements.
 */
type NRPNData = [[number, number, number], [number, number, number], [number, number, number], [number, number, number]]

/**
 * Generate an NRPN data entry sequence.
 *
 * @param channel
 *   The MIDI channel of the NRPN data entry sequence.
 * @param msb
 *   The intended NRPN MSB.
 * @param lsb
 *   The intended NRPN LSB.
 * @param vc
 *   The velocity (coarse) byte in the message.
 * @param vf
 *   The velocity (fine) byte in the message.
 */
function nrpnData(channel: number, msb: number, lsb: number, vc: number, vf: number): NRPNData {
	return [
		[0xb0 | channel, 0x63, msb],
		[0xb0 | channel, 0x62, lsb],
		[0xb0 | channel, 0x06, vc],
		[0xb0 | channel, 0x26, vf],
	]
}

/**
 * Generate a mute on/off message sequence.
 *
 * @param channel
 *   The MIDI channel of the NRPN data entry sequence.
 * @param msb
 *   The intended NRPN MSB.
 * @param lsb
 *   The intended NRPN LSB.
 * @param on
 *   True to turn the mute on, false to turn it off.
 */
function mute(
	channel: number,
	msb: number,
	lsb: number,
	on: boolean,
): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] {
	return nrpnData(channel, msb, lsb, 0, on ? 1 : 0)
}

/**
 * Generate a mute on message sequence.
 *
 * @param channel
 *   The MIDI channel of the NRPN data entry sequence.
 * @param msb
 *   The intended NRPN MSB.
 * @param lsb
 *   The intended NRPN LSB.
 */
export function MuteOn(
	channel: number,
	msb: number,
	lsb: number,
): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] {
	return mute(channel, msb, lsb, true)
}

/**
 * Generate a mute off message sequence.
 *
 * @param channel
 *   The MIDI channel of the NRPN data entry sequence.
 * @param msb
 *   The intended NRPN MSB.
 * @param lsb
 *   The intended NRPN LSB.
 */
export function MuteOff(
	channel: number,
	msb: number,
	lsb: number,
): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] {
	return mute(channel, msb, lsb, false)
}

/**
 * Generate a fader level-setting message sequence.
 *
 * @param channel
 *   The MIDI channel of the NRPN data entry sequence.
 * @param msb
 *   The intended NRPN MSB.
 * @param lsb
 *   The intended NRPN LSB.
 * @param vc
 *   The velocity (coarse) byte encoding half of the intended fader level.
 * @param vf
 *   The velocity (fine) byte encoding half of the intended fader level.
 */
export function FaderLevel(channel: number, msb: number, lsb: number, vc: number, vf: number): NRPNData {
	return nrpnData(channel, msb, lsb, vc, vf)
}

/**
 * Generate a source/sink pan/balance-setting message sequence.
 *
 * @param channel
 *   The MIDI channel of the NRPN data entry sequence.
 * @param msb
 *   The intended NRPN MSB.
 * @param lsb
 *   The intended NRPN LSB.
 * @param vc
 *   The velocity (coarse) byte encoding half of the intended pan/balance level.
 * @param vf
 *   The velocity (fine) byte encoding half of the intended pan/balance level.
 * @returns
 */
export function PanLevel(channel: number, msb: number, lsb: number, vc: number, vf: number): NRPNData {
	return nrpnData(channel, msb, lsb, vc, vf)
}
