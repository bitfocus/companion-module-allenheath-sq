import type { CompanionInputFieldDropdown, DropdownChoice } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import type { Level } from '../mixer/level.js'
import { FadeDurationOptionId, type LevelAndFadeOptions, SignalLevelOptionId } from './schemas/fading.js'
import { repr } from '../utils/pretty.js'

export const FadingOption = {
	type: 'dropdown',
	label: 'Fading',
	id: FadeDurationOptionId,
	default: 0,
	choices: [
		{ label: `Off`, id: 0 },
		{ label: `1s`, id: 1 },
		{ label: `2s`, id: 2 },
		{ label: `3s`, id: 3 },
		//{label: `4s`, id: 4}, //added
		//{label: `5s`, id: 5}, //added
		//{label: `10s`, id: 10}, //added
	],
	// XXX We could expand this to allow computing the fade duration -- the
	//     underlying code should support it -- but that somewhat opens up the
	//     "how long can an action run" can of worms, so keep it closed for now.
	disableAutoExpression: true,
	minChoicesForSearch: 0,
} as const satisfies CompanionInputFieldDropdown<typeof FadeDurationOptionId>

/**
 * An option specifying all potential levels of a source in a sink or as output.
 */
export const LevelOption = {
	type: 'dropdown',
	label: 'Level',
	id: SignalLevelOptionId,
	default: 0,
	choices: ((): DropdownChoice[] => {
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
			const [label, id] = i === -90 ? ['-∞ dB', '-inf'] : [`${i} dB`, i]
			levels.push({ label, id })
		}
		for (let i = -39; i <= -10; i = i + 1) {
			levels.push({ label: `${i} dB`, id: i })
		}
		for (let i = -9.5; i <= 10; i = i + 0.5) {
			levels.push({ label: `${i} dB`, id: i })
		}
		return levels
	})(),
	// XXX The "Last dB value" option is horribly underdefined in its effect
	//     (especially in light of non-immediate fades), and 1000 is a terrible
	//     way to expose...whatever the heck it should be doing.  The "step"
	//     option values are also a questionable way to expose this effect --
	//     perhaps the existing "fade" actions should be split into absolute and
	//     relative forms.  And exposing dB levels only in the discrete levels
	//     defined specifically in options is...dubious, compared to just
	//     allowing '-inf' or (-90, 10] numbers directly.  In light of all this
	//     mess, punt on rigorizing values and exposing them as expressionable
	//     for now.
	disableAutoExpression: true,
	minChoicesForSearch: 0,
} as const satisfies CompanionInputFieldDropdown<typeof SignalLevelOptionId>

type FadeType =
	| {
			type: 'absolute'
			fadeTimeMs: number
			level: Level
	  }
	| {
			type: 'relative'
			fadeTimeMs: number
			dbDelta: number
	  }
	| {
			type: 'last-value'
			fadeTimeMs: number
	  }

const MsPerSecond = 1000

export function getFadeType(instance: sqInstance, options: LevelAndFadeOptions): FadeType | null {
	// Presets that incidentally invoke this function didn't always specify a
	// fade time, so treat a missing fade as zero to support them.
	const fade = options[FadeDurationOptionId]
	let fadeTimeMs = fade === undefined ? 0 : Number(fade) * MsPerSecond
	if (!(fadeTimeMs >= 0)) {
		instance.log('warn', `Bad fade time ${fadeTimeMs} milliseconds, treating as zero`)
		fadeTimeMs = 0
	}

	const levelOption = options[SignalLevelOptionId]
	if ((typeof levelOption === 'number' && -90 < levelOption && levelOption <= 10) || levelOption === '-inf') {
		return {
			type: 'absolute',
			fadeTimeMs,
			level: levelOption,
		}
	}

	if (levelOption === 1000) {
		return {
			type: 'last-value',
			fadeTimeMs,
		}
	}

	if (typeof levelOption === 'string' && levelOption.startsWith('step')) {
		const stepAmount = Number(levelOption.slice(4))
		if (Number.isNaN(stepAmount)) {
			instance.log('error', `Unexpected step amount: ${repr(levelOption)}`)
			return null
		}

		return {
			type: 'relative',
			fadeTimeMs,
			dbDelta: stepAmount,
		}
	}

	instance.log('error', `Bad level request: ${repr(levelOption)}`)
	return null
}
