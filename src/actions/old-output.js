import { OutputActionId } from './output.js'
import { getFadeTimeSeconds } from './level.js'

/**
 * Generate action definitions for adjusting the levels or pan/balance of
 * various mixer sinks when they're assigned to mixer outputs.
 *
 * @param {import('../instance-interface.js').SQInstanceInterface} self
 *   The instance for which actions are being generated.
 * @param {import('../mixer/mixer.js').Mixer} mixer
 *   The mixer object to use when executing the actions.
 * @param {import('../choices.js').Choices} choices
 *   Option choices for use in the actions.
 * @param {import('@companion-module/base').CompanionInputFieldDropdown} levelOption
 *   An action option specifying all levels an output can be set to.
 * @param {import('@companion-module/base').CompanionInputFieldDropdown} fadingOption
 *   An action option specifying various fade times over which the set to level
 *   should take place.
 * @param {import('@companion-module/base').CompanionInputFieldDropdown} panLevelOption
 *   An action option specifying pan amounts for the output.
 * @param {string} connectionLabel
 *   The label of the SQ instance.
 * @returns {import('./actionid.js').ActionDefinitions<import('./output.js').OutputActionId>}
 *   The set of all output-adjustment action definitions.
 */
export function oldOutputActions(self, mixer, choices, levelOption, fadingOption, panLevelOption, connectionLabel) {
	return {
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options: opt }) => {
				const fadeTimeSeconds = getFadeTimeSeconds(opt)
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
				panLevelOption,
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
	}
}
