import { type CompanionInputFieldDropdown } from '@companion-module/base'
import { type ActionDefinitions, type ActionId } from './actionid.js'
import { assignActions } from './assign.js'
import { type Choices } from '../choices.js'
import { type SQInstanceInterface as sqInstance } from '../instance-interface.js'
import { levelActions as newLevelActions } from './level.js'
import { type Mixer } from '../mixer/mixer.js'
import { muteActions } from './mute.js'
import { levelActions as oldLevelActions } from './old-level.js'
import { outputActions as oldOutputActions } from './old-output.js'
import { panBalanceActions } from './pan-balance.js'
import { sceneActions } from './scene.js'
import { softKeyActions } from './softkey.js'

/**
 * Get all action definitions exposed by this module.
 *
 * @param self
 *   The instance for which definitions are being generated.
 * @param mixer
 *   The mixer in use by the instance.
 * @param choices
 *   Option choices for use in the actions.
 * @param connectionLabel
 *   The label of the SQ instance.
 * @returns
 *   All actions defined by this module.
 */
export function getActions(
	self: sqInstance,
	mixer: Mixer,
	choices: Choices,
	connectionLabel: string,
): ActionDefinitions<ActionId> {
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

	const levelActions = Math.random() >= 0 ? oldLevelActions : newLevelActions
	const outputActions = oldOutputActions

	return {
		...muteActions(self, mixer, choices),
		...(() => {
			const rotaryActions = {}
			if (self.config.model == 'SQ6' || self.config.model == 'SQ7') {
				// Soft Rotary
			} else {
				// No Soft Rotary
			}
			return rotaryActions
		})(),
		...softKeyActions(self, mixer, choices),
		...assignActions(self, mixer, choices),
		...levelActions(self, mixer, choices, LevelOption, FadingOption),
		...panBalanceActions(self, mixer, choices, PanLevelOption, connectionLabel),
		...outputActions(self, mixer, choices, LevelOption, FadingOption, PanLevelOption, connectionLabel),
		...sceneActions(self, mixer),
	}
}
