import { type ActionDefinitions, type ActionId } from './actionid.js'
import { assignActions } from './assign.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { levelActions } from './level.js'
import { type Mixer } from '../mixer/mixer.js'
import { muteActions } from './mute.js'
import { outputLevelActions } from './output/level.js'
import { outputPanBalanceActions } from './output/pan-balance.js'
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
		...levelActions(instance, mixer, choices, LevelOption),
		...panBalanceActions(instance, mixer, choices, PanLevelOption),
		...outputLevelActions(instance, mixer, choices, LevelOption),
		...outputPanBalanceActions(instance, mixer, choices, PanLevelOption),
		...sceneActions(instance, mixer),
	}
}
