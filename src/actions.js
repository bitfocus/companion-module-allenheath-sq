import { LevelActionId, OutputActionId } from './actions/action-ids.js'
import { assignActions } from './actions/assign.js'
import { getFadeTimeSeconds } from './actions/level.js'
import { muteActions } from './actions/mute.js'
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
	const model = mixer.model

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
		[LevelActionId.InputChannelLevelInMixOrLR]: {
			name: 'Fader channel level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Input channel',
					id: 'input',
					default: 0,
					choices: choices.inputChannels,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: 0,
					choices: choices.mixesAndLR,
					minChoicesForSearch: 0,
				},
				LevelOption,
				FadingOption,
			],
			callback: async ({ options: opt }) => {
				let fadeTimeSeconds = getFadeTimeSeconds(self, opt)
				if (fadeTimeSeconds === null) {
					return
				}
				if (fadeTimeSeconds === 0) {
					// Make it super short like 0.2s.
					fadeTimeSeconds = 0.2
				}

				const commands = await self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.mix,
					opt.leveldb,
					[0x40, 0x40],
					[0, 0x44],
				)
				console.log('commands', commands)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.GroupLevelInMixOrLR]: {
			name: 'Fader group level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: 0,
					choices: choices.groups,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: 0,
					choices: choices.mixesAndLR,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.mix,
					opt.leveldb,
					[0x40, 0x45],
					[0x30, 0x04],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.FXReturnLevelInMixOrLR]: {
			name: 'Fader FX return level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: 0,
					choices: choices.fxReturns,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: 0,
					choices: choices.mixesAndLR,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.mix,
					opt.leveldb,
					[0x40, 0x46],
					[0x3c, 0x14],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.FXReturnLevelInGroup]: {
			name: 'Fader FX return level to group',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: 0,
					choices: choices.fxReturns,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Group',
					id: 'assign',
					default: 0,
					choices: choices.groups,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.group,
					opt.leveldb,
					[0, 0x4b],
					[0, 0x34],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.InputChannelLevelInFXSend]: {
			name: 'Fader channel level to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'Input channel',
					id: 'input',
					default: 0,
					choices: choices.inputChannels,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'assign',
					default: 0,
					choices: choices.fxSends,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.fxSend,
					opt.leveldb,
					[0, 0x4c],
					[0, 0x14],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.GroupLevelInFXSend]: {
			name: 'Fader group level to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: 0,
					choices: choices.groups,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'assign',
					default: 0,
					choices: choices.fxSends,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.fxSend,
					opt.leveldb,
					[0, 0x4d],
					[0, 0x54],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.FXReturnLevelInFXSend]: {
			name: 'Fader FX return level to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: 0,
					choices: choices.fxReturns,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'assign',
					default: 0,
					choices: choices.fxSends,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.fxSend,
					opt.leveldb,
					[0, 0x4e],
					[0, 0x04],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.MixOrLRLevelInMatrix]: {
			name: 'Fader mix level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'input',
					default: 0,
					choices: choices.mixesAndLR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: 0,
					choices: choices.matrixes,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.matrix,
					opt.leveldb,
					[0x4e, 0x4e],
					[0x24, 0x27],
				)
				mixer.midi.sendCommands(commands)
			},
		},
		[LevelActionId.GroupLevelInMatrix]: {
			name: 'Fader group level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: 0,
					choices: choices.groups,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: 0,
					choices: choices.matrixes,
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
				const commands = self.fadeLevel(
					fadeTimeSeconds,
					opt.input,
					opt.assign,
					model.count.matrix,
					opt.leveldb,
					[0, 0x4e],
					[0, 0x4b],
				)
				mixer.midi.sendCommands(commands)
			},
		},

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
