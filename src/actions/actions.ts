import type { CompanionActionDefinition } from '@companion-module/base'
import { assignActions } from './assign.js'
import type { Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { levelActions } from './level.js'
import type { ActionId } from './manifest.js'
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
export function getActions(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
): Record<ActionId, CompanionActionDefinition> {
	const mixesAndLR = choices.mixesAndLR

	return {
		...muteActions(instance, mixer),
		...(() => {
			const rotaryActions = {}
			if (mixer.model.rotaryKeys > 0) {
				// Soft Rotary
			} else {
				// No Soft Rotary
			}
			return rotaryActions
		})(),
		...softKeyActions(instance, mixer),
		...assignActions(instance, mixer, choices),
		...levelActions(instance, mixer, mixesAndLR),
		...panBalanceActions(instance, mixer, mixesAndLR),
		...outputLevelActions(instance, mixer),
		...outputPanBalanceActions(instance, mixer),
		...sceneActions(instance, mixer),
	}
}
