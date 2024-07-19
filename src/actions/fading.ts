import type { CompanionOptionValues, DropdownChoice } from '@companion-module/base'
import type { SQInstanceInterface as sqInstance } from '../instance-interface.js'
import type { Model } from '../mixer/model.js'
import type { InputOutputType } from '../mixer/model.js'
import { toSourceOrSink } from './to-source-or-sink.js'

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
		const id = i == -90 ? '-inf' : i
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

/**
 * Get the number of the specified fader from options for a fading action.
 *
 * @param instance
 *   The instance in use.
 * @param model
 *   The model of the mixer.
 * @param options
 *   Options specified for the action.
 * @param type
 *   The type of the fader.
 */
export function getFader(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	type: InputOutputType,
): number | null {
	return toSourceOrSink(instance, model, options.input, type)
}

/**
 * Given options for a fade-to-level action, compute the time the fade should
 * take.  On failure log an error and return null, otherwise return the fade
 * time, in seconds.
 */
export function getFadeTimeSeconds(instance: sqInstance, options: CompanionOptionValues): number | null {
	// Presets that incidentally invoke this function don't always seem to have
	// specified a fade time, so treat a missing fade as zero to support them.
	const fade = options.fade
	const fadeSeconds = fade === undefined ? 0 : Number(fade)
	if (fadeSeconds >= 0) {
		return fadeSeconds
	}

	instance.log('error', `Bad fade time ${fadeSeconds} seconds, aborting`)
	return null
}
