import { LevelActionId } from './level.js'
import { getFadeTimeSeconds } from './level.js'

/**
 * Generate action definitions for setting the levels of sources in sinks: input
 * channels in mixes, mixes in LR, and so on and so forth.
 *
 * @param {import('../instance-interface.js').SQInstanceInterface} self
 *   The instance for which actions are being generated.
 * @param {import('../mixer/mixer.js').Mixer} mixer
 *   The mixer object to use when executing the actions.
 * @param {import('../choices.js').Choices} choices
 *   Option choices for use in the actions.
 * @param {import('@companion-module/base').CompanionInputFieldDropdown} levelOption
 *   An action option specifying all levels a source in a sink can be set to.
 * @param {import('@companion-module/base').CompanionInputFieldDropdown} fadingOption
 *   An action option specifying various fade times over which the set to level
 *   should take place.
 * @returns {import('./actionid.js').ActionDefinitions<import('./level.js').LevelActionId>}
 *   The set of all level action definitions.
 */
export function oldLevelActions(self, mixer, choices, levelOption, fadingOption) {
	const model = mixer.model

	return {
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
				levelOption,
				fadingOption,
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
	}
}
