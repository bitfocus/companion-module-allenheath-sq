import type { CompanionActionDefinition } from '@companion-module/base'
import { assignActions, type AssignActionId } from './assign.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { levelActions, type LevelActionId } from './level.js'
import { type Mixer } from '../mixer/mixer.js'
import { muteActions, type MuteActionId } from './mute.js'
import { outputLevelActions, type OutputLevelActionId } from './output/level.js'
import { outputPanBalanceActions, type OutputPanBalanceActionId } from './output/pan-balance.js'
import { panBalanceActions, type PanBalanceActionId } from './pan-balance.js'
import { sceneActions, type SceneActionId } from './scene.js'
import { softKeyActions, type SoftKeyActionId } from './softkey.js'

/** All action IDs. */
export type ActionId =
	| MuteActionId
	| AssignActionId
	| SceneActionId
	| SoftKeyActionId
	| LevelActionId
	| PanBalanceActionId
	| OutputLevelActionId
	| OutputPanBalanceActionId

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
		...levelActions(instance, mixer, choices),
		...panBalanceActions(instance, mixer, choices),
		...outputLevelActions(instance, mixer, choices),
		...outputPanBalanceActions(instance, mixer, choices),
		...sceneActions(instance, mixer),
	}
}
