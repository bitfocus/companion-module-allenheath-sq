import type { CompanionOptionValues, DropdownChoice } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import type { Level } from '../mixer/level.js'
import { type NRPN, splitNRPN } from '../mixer/nrpn/param.js'
import { repr } from '../utils/pretty.js'

/** Compute the set of level options for level-setting actions. */
export function createLevels(): DropdownChoice[] {
	const levels: DropdownChoice[] = []
	levels.push(
		{ label: `Last dB value`, id: 1000 },
		{ label: `Step +0.1 dB`, id: 'step+0.1' }, //added
		{ label: `Step +1 dB`, id: 'step+1' },
		{ label: `Step +3 dB`, id: 'step+3' }, //added
		{ label: `Step +6 dB`, id: 'step+6' }, //added
		{ label: `Step -0.1 dB`, id: 'step-0.1' }, //added
		{ label: `Step -1 dB`, id: 'step-1' },
		{ label: `Step -3 dB`, id: 'step-3' }, //added
		{ label: `Step -6 dB`, id: 'step-6' },
	)
	for (let i = -90; i <= -40; i = i + 5) {
		const id = i === -90 ? '-inf' : i
		levels.push({ label: `${i} dB`, id })
	}
	for (let i = -39; i <= -10; i = i + 1) {
		levels.push({ label: `${i} dB`, id: i })
	}
	for (let i = -9.5; i <= 10; i = i + 0.5) {
		levels.push({ label: `${i} dB`, id: i })
	}
	return levels
}

type FadeParameters = {
	start: Level
	end: Level
	fadeTimeMs: number
}

const MsPerSecond = 1000

/**
 * Get the start, end, and duration of a fade of the given NRPN.
 *
 * @param instance
 *   The instance in use.
 * @param options
 *   Options specified for the action.
 * @param nrpn
 *   The NRPN.
 * @returns
 *   Information about the requested fade.
 */
export function getFadeParameters(
	instance: sqInstance,
	options: CompanionOptionValues,
	nrpn: NRPN<'level'>,
): FadeParameters | null {
	// Presets that incidentally invoke this function didn't always specify a
	// fade time, so treat a missing fade as zero to support them.
	const fade = options.fade
	const fadeTimeMs = fade === undefined ? 0 : Number(fade) * MsPerSecond
	if (!(fadeTimeMs >= 0)) {
		instance.log('error', `Bad fade time ${fadeTimeMs} milliseconds, aborting`)
		return null
	}

	// XXX It should be possible to eliminate the fallibility and range/type
	//     errors by not storing the previous level in a barely-typed
	//     variable.
	let start: Level
	{
		const { MSB, LSB } = splitNRPN(nrpn)
		const levelValue = instance.getVariableValue(`level_${MSB}.${LSB}`)
		switch (typeof levelValue) {
			case 'string':
				if (levelValue !== '-inf') {
					instance.log('error', `Bad start level: ${levelValue}`)
					return null
				}
				start = '-inf'
				break
			case 'number':
				if (!(-90 < levelValue && levelValue <= 10)) {
					instance.log('error', `Bad start level: ${levelValue}`)
					return null
				}
				start = levelValue
				break
			default:
				instance.log('error', `Bad start level`)
				return null
		}
	}

	let end: Level
	const levelOption = options.leveldb
	if (typeof levelOption === 'number' && -90 < levelOption && levelOption <= 10) {
		end = levelOption
	} else if (levelOption === '-inf') {
		end = '-inf'
	} else if (levelOption === 1000) {
		end = start
	} else if (typeof levelOption === 'string' && levelOption.startsWith('step')) {
		const stepAmount = Number(levelOption.slice(4))
		if (Number.isNaN(stepAmount)) {
			instance.log('error', `Unexpected step amount: ${repr(levelOption)}`)
			return null
		}

		const endLevel = (start === '-inf' ? -90 : start) + stepAmount
		if (endLevel <= -90) {
			end = '-inf'
		} else if (10 <= endLevel) {
			end = 10
		} else {
			end = endLevel
		}
	} else {
		instance.log('error', `Bad level request: ${repr(levelOption)}`)
		return null
	}

	return {
		start,
		end,
		fadeTimeMs,
	}
}
