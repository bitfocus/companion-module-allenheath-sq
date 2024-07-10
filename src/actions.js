import { assignActions } from './actions/assign.js'
import { muteActions } from './actions/mute.js'
import { oldLevelActions } from './actions/old-level.js'
import { oldOutputActions } from './actions/old-output.js'
import { panBalanceActions } from './actions/pan-balance.js'
import { sceneActions } from './actions/scene.js'
import { softKeyActions } from './actions/softkey.js'

/**
 *
 * @param {import('./instance-interface.js').SQInstanceInterface} self
 * @param {import('./mixer/mixer.js').Mixer} mixer
 * @param {import('./choices.js').Choices} choices
 * @param {string} connectionLabel
 * @returns
 */
export function getActions(self, mixer, choices, connectionLabel) {
	const FadingOption = {
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
	}

	const PanLevelOption = {
		type: 'dropdown',
		label: 'Level',
		id: 'leveldb',
		default: 'CTR',
		choices: choices.panLevels,
		minChoicesForSearch: 0,
	}

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
		...oldLevelActions(self, mixer, choices, LevelOption, FadingOption),
		...panBalanceActions(self, mixer, choices, PanLevelOption, connectionLabel),
		...oldOutputActions(self, mixer, choices, LevelOption, FadingOption, PanLevelOption, connectionLabel),
		...sceneActions(self, mixer),
	}
}
