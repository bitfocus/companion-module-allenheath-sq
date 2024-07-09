import { OutputActionId } from './actions/action-ids.js'
import { assignActions } from './actions/assign.js'
import { getFadeTimeSeconds } from './actions/level.js'
import { muteActions } from './actions/mute.js'
import { oldLevelActions } from './actions/old-level.js'
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

		/* Level */
		...oldLevelActions(self, mixer, choices, LevelOption, FadingOption),

		/* Pan Balance */
		...panBalanceActions(self, mixer, choices, PanLevelOption, connectionLabel),

		/* Output */
		[OutputActionId.OutputLevel]: {
			name: 'Fader level to output',
			options: [
				{
					type: 'dropdown',
					label: 'Fader',
					id: 'input',
					default: 0,
					choices: choices.allFaders,
					minChoicesForSearch: 0,
				},
				LevelOption,
				FadingOption,
			],
			callback: async ({ options: opt }) => {
				const fadeTimeSeconds = getFadeTimeSeconds(self, opt)
				if (fadeTimeSeconds === null) {
					return
				}
				const commands = self.fadeLevel(fadeTimeSeconds, opt.input, 99, 0, opt.leveldb, [0x4f, 0], [0, 0])
				mixer.midi.sendCommands(commands)
			},
		},

		[OutputActionId.OutputPanBalance]: {
			name: 'Pan/Bal level to output',
			options: [
				{
					type: 'dropdown',
					label: 'Fader',
					id: 'input',
					default: 0,
					choices: choices.panBalanceFaders,
					minChoicesForSearch: 0,
				},
				PanLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, 99, 0, [0x5f, 0], [0, 0])
				mixer.midi.send(val.commands[0])
				opt.showvar = `$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async ({ options }) => {
				const { input: fader, leveldb: panBalance } = options
				mixer.setOutputPanBalance(fader, panBalance)
			},
		},

		...sceneActions(self, mixer),
	}
}
