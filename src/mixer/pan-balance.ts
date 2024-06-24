import { type DropdownChoice } from '@companion-module/base'

export type LevelChoice = 'CTR' | `L${number}` | `R${number}`

const CENTER = (0x3f << 7) | 0x7f
const MAX = (0x7f << 7) + 0x7f

/**
 * Convert a pan/balance level choice value to the MIDI NRPN encoding of that
 * choice.
 *
 * @param level
 *   A pan/balance level as encoded by a pan/balance choice (see `choices.js`).
 * @return
 *   A `[VC, VF]` pair that can be slotted into a MIDI NRPN data message to set
 *   pan/balance to what `level` specifies.  Except for 100%-left, 100%-right,
 *   and center, these values are not guaranteed to be exact.
 */
export function panBalanceLevelToVCVF(level: LevelChoice): [number, number] {
	// Convert L100, L95, ..., L5, CTR, R5, ... R95, R100 to
	// 0, 5, ..., 195, 200.
	let lv
	if (level === 'CTR') {
		lv = 100
	} else {
		lv = 100 + (level[0] === 'L' ? -1 : 1) * parseInt(level.slice(1), 10)
	}

	// The combined VC/VF for a pan/balance level is just a linear interpolation
	// over L100%=[0x00, 0x00] to CTR=[0x3F, 0x7F] to R100%=[0x7F, 0x7F].
	const interpolated = Math.floor((lv / 200) * MAX)
	return [interpolated >> 7, interpolated & 0x7f]
}

/**
 * Convert a `VC`/`VF` pair to a human-readable pan/balance level.
 *
 * This function returns a human-readable version of what `vc`/`vf` encode.  It
 * is _not_ guaranteed to be a valid pan/balance-level option value, as those
 * options are restricted to 5% increments.
 */
export function vcvfToReadablePanBalance(vc: number, vf: number): LevelChoice {
	const data = (vc << 7) | vf
	let val = parseFloat(((data - CENTER) / 81.9).toFixed(0))
	if (val > 100) {
		val = 100
	}
	if (val < -100) {
		val = -100
	}

	if (val == 0) {
		return 'CTR'
	}

	const amount = Math.abs(val)
	if (val < 0) {
		return `L${amount}`
	}
	return `R${amount}`
}

export function createPanLevels(): DropdownChoice[] {
	const panLevels = []
	panLevels.push({ label: `Step Right`, id: 998 }, { label: `Step Left`, id: 999 })
	for (let i = -100; i <= 100; i = i + 5) {
		const pos = i < 0 ? `L${Math.abs(i)}` : i == 0 ? `CTR` : `R${Math.abs(i)}`
		panLevels.push({ label: `${pos}`, id: `${pos}` })
	}

	return panLevels
}
