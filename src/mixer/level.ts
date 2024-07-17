import { assertNever } from '@companion-module/base'
import { type FaderLaw } from './mixer.js'

/**
 * A mixer fader level.  `'-inf'` is -∞.  Otherwise the level is in range
 * `(-90, 10]` directly encoding a dB value.
 */
export type Level = '-inf' | number

/**
 * Convert a `VC`/`VF` data byte pair from a fader level message to a
 * `Level` value, interpreting `vc`/`vf` consistent with `faderLaw`.
 */
export function levelFromNRPNData(vc: number, vf: number, faderLaw: FaderLaw): Level {
	switch (faderLaw) {
		case 'LinearTaper': {
			// Linear Taper has a high-resolution `2**(7 + 7) === 16384` level
			// values.
			const data = (vc << 7) | vf

			// The SQ MIDI Protocol document gives example values and their
			// meanings that (on random spot-checking) fairly closely correspond
			// to this line, but it doesn't give this formula.  Past revision
			// history offers no explanation, either -- and the formula's been
			// tweaked over time, e.g. the divisor used to be 119 before
			// 8c09283326d2db3ba46a286a5024d9a89f065b9b.
			//
			// https://community.allen-heath.com/forums/topic/db-to-linear-taper-sum
			// says this was invented by observation and experimentation.  Given
			// it spot-checks, we keep using the formula while hoping an
			// explanation (or better formula) can be added in the future.
			const level = parseFloat(((data - 15196) / 118.775).toFixed(1))

			return level < -89 ? '-inf' : 10 < level ? 10 : level
		}

		case 'AudioTaper': {
			if (!(0 <= vc && vc <= 127)) {
				throw new Error(`Unexpected out-of-range VC=${vc}`)
			}

			// Audio Taper has 255 possible values according to the SQ MIDI
			// Protocol document.  That document doesn't give a tidy formula to
			// explain how 255 values map onto 16384 VC/VF values (or onto 128
			// `VC` values alone).
			//
			// The algorithm below was used before this function was introduced.
			// It adheres *somewhat* to the examples in the "Approximate Audio
			// Taper Level Values" table in the SQ MIDI Protocol document, but
			// it's noticeably off in places, e.g. treating dB<-65 as '-inf'.
			// We leave it as-is for the moment, because changing this
			// interpretation could result in serialization/deserialization
			// consistencies so changing can't be done lightly.
			let val
			if (vc > 115) {
				val = (10 - (127 - vc) / 3).toFixed(1)
			} else if (vc > 99) {
				val = (5 - (115 - vc) / 4).toFixed(1)
			} else if (vc > 79) {
				val = (0 - (99 - vc) / 5).toFixed(1)
			} else if (vc > 63) {
				val = (-5 - (79 - vc) / 4).toFixed(1)
			} else if (vc > 15) {
				val = (-10 - (63 - vc) / 1.778).toFixed(0)
			} else {
				val = (-40 - (15 - vc) / 0.2).toFixed(0)
			}

			val = parseFloat(val)
			return val < -89 ? '-inf' : val
		}

		default:
			assertNever(faderLaw)
			throw new Error(`Bad fader law: ${faderLaw}`)
	}
}

/**
 * Convert a fader level to a `VC`/`VF` data byte pair approximately equivalent
 * to it under the given `faderLaw`.
 */
export function nrpnDataFromLevel(level: Level, faderLaw: FaderLaw): [number, number] {
	// `[0, 0]` with both fader laws is -∞.
	if (level === '-inf') {
		return [0, 0]
	}

	// `level` must be a number in range (-90, 10] at this point.  Enforce this
	// to assist understanding the operations performed below.
	if (!(-90 < level && level <= 10)) {
		throw new Error(`Unexpected out-of-range level: ${level}`)
	}

	switch (faderLaw) {
		case 'LinearTaper': {
			// As above, there is no explanation or justification for this
			// formula except "it seems to fit well enough...".
			const val = 15196 + level * 118.775
			const vcvf = Math.floor(val)
			return [(vcvf >> 7) & 0x7f, vcvf & 0x7f]
		}

		case 'AudioTaper': {
			// There doesn't seem to be any ready explanation of the algorithm
			// below, save that it's roughly consistent with example values in
			// the SQ MIDI Protocol document.
			let candidateVC
			if (5 < level) {
				candidateVC = 127 - (10 - level) * 3
			} else if (0 < level) {
				candidateVC = 115 - (5 - level) * 4
			} else if (-5 < level) {
				candidateVC = 99 + (0 - level) * 5
			} else if (-10 < level) {
				candidateVC = 79 + (5 + level) * 4
			} else if (-40 < level) {
				candidateVC = 63 + (10 + level) * 1.778
			} else {
				candidateVC = 15 + (40 + level) * 0.2
			}

			const vc = Math.floor(candidateVC)
			const vf = Math.floor((candidateVC - vc) * 100)
			return [vc, vf]
		}

		default:
			assertNever(faderLaw)
			throw new Error(`Bad fader law: ${faderLaw}`)
	}
}
