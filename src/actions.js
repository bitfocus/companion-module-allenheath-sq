import { assignActions } from './actions/assign.js'

function StripOption(label, choices) {
	return {
		type: 'dropdown',
		label,
		id: 'strip',
		default: 0,
		choices,
		minChoicesForSearch: 0,
	}
}

const MuteOption = {
	type: 'dropdown',
	label: 'Mute',
	id: 'mute',
	default: 0,
	choices: [
		{ label: 'Toggle', id: 0 },
		{ label: 'On', id: 1 },
		{ label: 'Off', id: 2 },
	],
}

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
	const midi = mixer.midi

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

	const actions = {}

	actions['mute_input'] = {
		name: 'Mute Input',
		options: [StripOption('Input Channel', choices.inputChannels), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0

			let strip = opt.strip
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}

	actions['mute_lr'] = {
		name: 'Mute LR',
		options: [
			{
				type: 'dropdown',
				label: 'LR',
				id: 'strip',
				default: 0,
				choices: [{ label: `LR`, id: 0 }],
				minChoicesForSearch: 99,
			},
			{
				type: 'dropdown',
				label: 'Mute',
				id: 'mute',
				default: 0,
				choices: [
					{ label: 'Toggle', id: 0 },
					{ label: 'On', id: 1 },
					{ label: 'Off', id: 2 },
				],
			},
		],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0x44

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}

	actions['mute_aux'] = {
		name: 'Mute Aux',
		options: [StripOption('Aux', choices.mixes), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0x45

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_group'] = {
		name: 'Mute Group',
		options: [StripOption('Group', choices.groups), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0x30

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_matrix'] = {
		name: 'Mute Matrix',
		options: [StripOption('Matrix', choices.matrixes), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0x55

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_fx_send'] = {
		name: 'Mute FX Send',
		options: [StripOption('FX Send', choices.fxSends), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0x51

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_fx_return'] = {
		name: 'Mute FX Return',
		options: [StripOption('FX Return', choices.fxReturns), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0
			const LSB = 0x3c

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_dca'] = {
		name: 'Mute DCA',
		options: [StripOption('DCA', choices.dcas), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0x02
			const LSB = 0

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_mutegroup'] = {
		name: 'Mute MuteGroup',
		options: [StripOption('MuteGroup', choices.muteGroups), MuteOption],
		callback: async ({ options: opt }) => {
			const MSB = 0x04
			const LSB = 0

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				mixer.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				mixer.fdbState[key] = mixer.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(mixer.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}

	if (self.config.model == 'SQ6' || self.config.model == 'SQ7') {
		// Soft Rotary
	}

	actions['key_soft'] = {
		name: 'Press Softkey',
		options: [
			{
				type: 'dropdown',
				label: 'Soft Key',
				id: 'softKey',
				default: 0,
				choices: choices.softKeys,
				minChoicesForSearch: 0,
			},
			{
				type: 'dropdown',
				label: 'Key type',
				id: 'pressedsk',
				default: '1',
				choices: [
					{ id: '0', label: 'Toggle' },
					{ id: '1', label: 'Press' },
					{ id: '2', label: 'Release' },
				],
				minChoicesForSearch: 5,
			},
		],
		callback: async ({ options: opt }) => {
			let softKey = parseInt(opt.softKey)
			let keyValu = opt.pressedsk == '0' || opt.pressedsk == '1' ? true : false
			let tch = (keyValu ? 0x90 : 0x80) | midi.channel
			const commands = [[tch, 0x30 + softKey, keyValu ? 0x7f : 0]]
			mixer.midi.sendCommands(commands)
		},
	}

	Object.assign(actions, assignActions(self, mixer, choices))

	/* Level */
	actions['chlev_to_mix'] = {
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
			if (opt.fade == 0) {
				//make it super short like 0.2
				opt.fade = 0.2
			}

			const commands = await self.fadeLevel(
				opt.fade,
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
	}

	actions['grplev_to_mix'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.mix,
				opt.leveldb,
				[0x40, 0x45],
				[0x30, 0x04],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['fxrlev_to_mix'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.mix,
				opt.leveldb,
				[0x40, 0x46],
				[0x3c, 0x14],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['fxrlev_to_grp'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.group,
				opt.leveldb,
				[0, 0x4b],
				[0, 0x34],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['chlev_to_fxs'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.fxSend,
				opt.leveldb,
				[0, 0x4c],
				[0, 0x14],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['grplev_to_fxs'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.fxSend,
				opt.leveldb,
				[0, 0x4d],
				[0, 0x54],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['fxslev_to_fxs'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.fxSend,
				opt.leveldb,
				[0, 0x4e],
				[0, 0x04],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['mixlev_to_mtx'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.matrix,
				opt.leveldb,
				[0x4e, 0x4e],
				[0x24, 0x27],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['grplev_to_mtx'] = {
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
			const commands = self.fadeLevel(
				opt.fade,
				opt.input,
				opt.assign,
				model.count.matrix,
				opt.leveldb,
				[0, 0x4e],
				[0, 0x4b],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['level_to_output'] = {
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
			const commands = self.fadeLevel(opt.fade, opt.input, 99, 0, opt.leveldb, [0x4f, 0], [0, 0])
			mixer.midi.sendCommands(commands)
		},
	}

	/* Pan Balance */
	actions['chpan_to_mix'] = {
		name: 'Pan/Bal channel level to mix',
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
			let val = self.getLevel(opt.input, opt.assign, model.count.mix, [0x50, 0x50], [0, 0x44])
			mixer.midi.send(val.commands[0])
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			const { input: inputChannel, leveldb: panBalance, assign: mixOrLR } = options
			mixer.setInputChannelPanBalanceInMixOrLR(inputChannel, panBalance, mixOrLR)
		},
	}

	actions['grppan_to_mix'] = {
		name: 'Pan/Bal group level to mix',
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
			let val = self.getLevel(opt.input, opt.assign, model.count.mix, [0x50, 0x55], [0x30, 0x04])
			mixer.midi.send(val.commands[0])
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			const { input: group, leveldb: panBalance, assign: mixOrLR } = options
			mixer.setGroupPanBalanceInMixOrLR(group, panBalance, mixOrLR)
		},
	}

	actions['fxrpan_to_mix'] = {
		name: 'Pan/Bal FX return level to mix',
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
			let val = self.getLevel(opt.input, opt.assign, model.count.mix, [0x50, 0x56], [0x3c, 0x14])
			mixer.midi.send(val.commands[0])
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			const { input: fxReturn, leveldb: panBalance, assign: mixOrLR } = options
			mixer.setFXReturnPanBalanceInMixOrLR(fxReturn, panBalance, mixOrLR)
		},
	}

	actions['fxrpan_to_grp'] = {
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
			let val = self.getLevel(opt.input, opt.assign, model.count.group, [0, 0x5b], [0, 0x34])
			mixer.midi.send(val.commands[0])
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			// XXX The SQ MIDI Protocol document (Issue 3) includes a table for
			//     this (page 26).  Issue 5 of the same document does not.  Is
			//     this operation even a thing?
			const { input: fxReturn, leveldb: panBalance, assign: group } = options
			mixer.setFXReturnPanBalanceInGroup(fxReturn, panBalance, group)
		},
	}

	actions['mixpan_to_mtx'] = {
		name: 'Pan/Bal mix level to matrix',
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
			let val = self.getLevel(opt.input, opt.assign, model.count.matrix, [0x5e, 0x5e], [0x24, 0x27])
			mixer.midi.send(val.commands[0])
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			const { input: mixOrLR, leveldb: panBalance, assign: matrix } = options
			if (mixOrLR === 99) {
				mixer.setLRPanBalanceInMatrix(panBalance, matrix)
			} else {
				const mix = mixOrLR
				mixer.setMixPanBalanceInMatrix(mix, panBalance, matrix)
			}
		},
	}

	actions['grppan_to_mtx'] = {
		name: 'Pan/Bal group level to matrix',
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
			let val = self.getLevel(opt.input, opt.assign, model.count.matrix, [0, 0x5e], [0, 0x4b])
			mixer.midi.send(val.commands[0])
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			const { input: group, leveldb: panBalance, assign: matrix } = options
			mixer.setGroupPanBalanceInMatrix(group, panBalance, matrix)
		},
	}

	actions['pan_to_output'] = {
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
			opt.showvar = `\$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
		},
		callback: async ({ options }) => {
			const { input: fader, leveldb: panBalance } = options
			mixer.setOutputPanBalance(fader, panBalance)
		},
	}

	// Scene
	actions['scene_recall'] = {
		name: 'Scene recall',
		options: [
			{
				type: 'number',
				label: 'Scene nr.',
				id: 'scene',
				default: 1,
				min: 1,
				max: model.count.scene,
				required: true,
			},
		],
		callback: async ({ options }) => {
			mixer.setScene(options.scene - 1)
		},
	}

	actions['scene_step'] = {
		name: 'Scene step',
		options: [
			{
				type: 'number',
				label: 'Scene +/-',
				id: 'scene',
				default: 1,
				min: -50,
				max: 50,
				required: true,
			},
		],
		callback: async ({ options }) => {
			const adjust = options.scene
			mixer.stepSceneBy(adjust)
		},
	}

	return actions
}
