import { type CompanionInputFieldDropdown } from '@companion-module/base'
import { type ActionDefinitions, type ActionId } from './actionid.js'
import { assignActions } from './assign.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { levelActions } from './level.js'
import { type Mixer } from '../mixer/mixer.js'
import { muteActions } from './mute.js'
import { outputActions } from './output.js'
import { panBalanceActions } from './pan-balance.js'
import { sceneActions } from './scene.js'
import { softKeyActions } from './softkey.js'

/**
 * Get all action definitions exposed by this module.
 *
 * @param instance
 *   The instance for which definitions are being generated.
 * @param mixer
 *   The mixer in use by the instance.
 * @param choices
 *   Option choices for use in the actions.
 * @returns
 *   All actions defined by this module.
 */
export function getActions(instance: sqInstance, mixer: Mixer, choices: Choices): ActionDefinitions<ActionId> {
	const FadingOption: CompanionInputFieldDropdown = {
		type: 'dropdown',
		label: 'Fading',
		id: 'fade',
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
		minChoicesForSearch: 0,
	}

	const LevelOption = {
		type: 'dropdown',
		label: 'Level',
		id: 'leveldb',
		default: 0,
		choices: choices.levels,
		minChoicesForSearch: 0,
	} as const

	const PanLevelOption = {
		type: 'dropdown',
		label: 'Level',
		id: 'leveldb',
		default: 'CTR',
		choices: choices.panLevels,
		minChoicesForSearch: 0,
	} as const

	return {
		...muteActions(instance, mixer, choices),
		...(() => {
			const rotaryActions = {}
			if (mixer.model.rotaryKeys > 0) {
				// Soft Rotary
			} else {
				// No Soft Rotary
			}
			return rotaryActions
		})(),
		...softKeyActions(instance, mixer, choices),
		...assignActions(instance, mixer, choices),
		...levelActions(instance, mixer, choices, LevelOption, FadingOption),
		...panBalanceActions(instance, mixer, choices, PanLevelOption),
		...outputActions(instance, mixer, choices, LevelOption, FadingOption, PanLevelOption),
		...sceneActions(instance, mixer),
	}
}
