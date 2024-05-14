export function SceneCommand(channel: number, scene: number): [[number, number, number], [number, number]] {
	return [
		[0xb0 | channel, 0x00, scene >> 7],
		[0xc0 | channel, scene & 0x7f],
	]
}

type NRPNData = [[number, number, number], [number, number, number], [number, number, number], [number, number, number]]

function nrpnData(channel: number, msb: number, lsb: number, vc: number, vf: number): NRPNData {
	return [
		[0xb0 | channel, 0x63, msb],
		[0xb0 | channel, 0x62, lsb],
		[0xb0 | channel, 0x06, vc],
		[0xb0 | channel, 0x26, vf],
	]
}

function mute(
	channel: number,
	msb: number,
	lsb: number,
	on: boolean,
): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] {
	return nrpnData(channel, msb, lsb, 0, on ? 1 : 0)
}

export function MuteOn(
	channel: number,
	msb: number,
	lsb: number,
): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] {
	return mute(channel, msb, lsb, true)
}

export function MuteOff(
	channel: number,
	msb: number,
	lsb: number,
): [[number, number, number], [number, number, number], [number, number, number], [number, number, number]] {
	return mute(channel, msb, lsb, false)
}

export function FaderLevel(channel: number, msb: number, lsb: number, vc: number, vf: number): NRPNData {
	return nrpnData(channel, msb, lsb, vc, vf)
}

export function PanLevel(channel: number, msb: number, lsb: number, vc: number, vf: number): NRPNData {
	return nrpnData(channel, msb, lsb, vc, vf)
}
