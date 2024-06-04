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
 * @param {import('../index.js').sqInstance} self
 * @param {import('./mixer/mixer.js').Mixer} mixer
 * @param {import('./choices.js').Choices} choices
 * @param {string} connectionLabel
 * @returns
 */
export function getActions(self, mixer, choices, connectionLabel) {
	const model = mixer.model
	const midi = mixer.midi

	var sceneNumber

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
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0

			let strip = opt.strip
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
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
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0x44

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}

	actions['mute_aux'] = {
		name: 'Mute Aux',
		options: [StripOption('Aux', choices.mixes), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0x45

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_group'] = {
		name: 'Mute Group',
		options: [StripOption('Group', choices.groups), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0x30

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_matrix'] = {
		name: 'Mute Matrix',
		options: [StripOption('Matrix', choices.matrixes), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0x55

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_fx_send'] = {
		name: 'Mute FX Send',
		options: [StripOption('FX Send', choices.fxSends), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0x51

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_fx_return'] = {
		name: 'Mute FX Return',
		options: [StripOption('FX Return', choices.fxReturns), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0
			const LSB = 0x3c

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_dca'] = {
		name: 'Mute DCA',
		options: [StripOption('DCA', choices.dcas), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0x02
			const LSB = 0

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
			mixer.midi.sendCommands(commands)
		},
	}
	actions['mute_mutegroup'] = {
		name: 'Mute MuteGroup',
		options: [StripOption('MuteGroup', choices.muteGroups), MuteOption],
		callback: async (action) => {
			let opt = action.options
			const MSB = 0x04
			const LSB = 0

			let strip = parseInt(opt.strip)
			const key = `mute_${MSB}.${LSB + strip}`

			if (parseInt(opt.mute) > 0) {
				self.fdbState[key] = parseInt(opt.mute) == 1 ? true : false
			} else {
				self.fdbState[key] = self.fdbState[key] == true ? false : true
			}

			self.checkFeedbacks()
			const commands = [midi.nrpnData(MSB, LSB + strip, 0, Number(self.fdbState[key]))]
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
		callback: async (action) => {
			let opt = action.options
			let softKey = parseInt(opt.softKey)
			let keyValu = opt.pressedsk == '0' || opt.pressedsk == '1' ? true : false
			let tch = (keyValu ? 0x90 : 0x80) | midi.channel
			const commands = [[tch, 0x30 + softKey, keyValu ? 0x7f : 0]]
			mixer.midi.sendCommands(commands)
		},
	}

	actions['ch_to_mix'] = {
		name: 'Assign channel to mix',
		options: [
			{
				type: 'dropdown',
				label: 'Input Channel',
				id: 'inputChannel',
				default: 0,
				choices: choices.inputChannels,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'Mix',
				id: 'mixAssign',
				default: [],
				choices: choices.mixesAndLR,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'mixActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputChannel,
				opt.mixAssign,
				opt.mixActive,
				model.count.mix,
				[0x60, 0x60],
				[0, 0x44],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['ch_to_grp'] = {
		name: 'Assign channel to group',
		options: [
			{
				type: 'dropdown',
				label: 'Input Channel',
				id: 'inputChannel',
				default: 0,
				choices: choices.inputChannels,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'Group',
				id: 'grpAssign',
				default: [],
				choices: choices.groups,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'grpActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputChannel,
				opt.grpAssign,
				opt.grpActive,
				model.count.group,
				[0, 0x66],
				[0, 0x74],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['grp_to_mix'] = {
		name: 'Assign group to mix',
		options: [
			{
				type: 'dropdown',
				label: 'Group',
				id: 'inputGrp',
				default: 0,
				choices: choices.groups,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'Mix',
				id: 'mixAssign',
				default: [],
				choices: choices.mixesAndLR,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'mixActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputGrp,
				opt.mixAssign,
				opt.mixActive,
				model.count.mix,
				[0x60, 0x65],
				[0x30, 0x04],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['fxr_to_grp'] = {
		name: 'Assign FX Return to group',
		options: [
			{
				type: 'dropdown',
				label: 'FX Return',
				id: 'inputFxr',
				default: 0,
				choices: choices.fxReturns,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'Group',
				id: 'grpAssign',
				default: [],
				choices: choices.groups,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'grpActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputFxr,
				opt.grpAssign,
				opt.grpActive,
				model.count.group,
				[0, 0x6b],
				[0, 0x34],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['ch_to_fxs'] = {
		name: 'Assign channel to FX Send',
		options: [
			{
				type: 'dropdown',
				label: 'Input Channel',
				id: 'inputChannel',
				default: 0,
				choices: choices.inputChannels,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'FX Send',
				id: 'fxsAssign',
				default: [],
				choices: choices.fxSends,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'fxsActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputChannel,
				opt.fxsAssign,
				opt.fxsActive,
				model.count.fxSend,
				[0, 0x6c],
				[0, 0x14],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['grp_to_fxs'] = {
		name: 'Assign group to FX send',
		options: [
			{
				type: 'dropdown',
				label: 'Group',
				id: 'inputGrp',
				default: 0,
				choices: choices.groups,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'FX Send',
				id: 'fxsAssign',
				default: [],
				choices: choices.fxSends,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'fxsActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputGrp,
				opt.fxsAssign,
				opt.fxsActive,
				model.count.fxSend,
				[0, 0x6d],
				[0, 0x54],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['fxr_to_fxs'] = {
		name: 'Assign FX return to FX send',
		options: [
			{
				type: 'dropdown',
				label: 'FX return',
				id: 'inputFxr',
				default: 0,
				choices: choices.fxReturns,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'FX Send',
				id: 'fxsAssign',
				default: [],
				choices: choices.fxSends,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'fxsActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputFxr,
				opt.fxsAssign,
				opt.fxsActive,
				model.count.fxSend,
				[0, 0x6e],
				[0, 0x04],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['mix_to_mtx'] = {
		name: 'Assign mix to matrix',
		options: [
			{
				type: 'dropdown',
				label: 'Mix',
				id: 'inputMix',
				default: 0,
				choices: choices.mixesAndLR,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'Matrix',
				id: 'mtxAssign',
				default: [],
				choices: choices.matrixes,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'mtxActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputMix,
				opt.mtxAssign,
				opt.mtxActive,
				model.count.matrix,
				[0x6e, 0x6e],
				[0x24, 0x27],
			)
			mixer.midi.sendCommands(commands)
		},
	}

	actions['grp_to_mtx'] = {
		name: 'Assign group to matrix',
		options: [
			{
				type: 'dropdown',
				label: 'Group',
				id: 'inputGrp',
				default: 0,
				choices: choices.groups,
				minChoicesForSearch: 0,
			},
			{
				type: 'multidropdown',
				label: 'Matrix',
				id: 'mtxAssign',
				default: [],
				choices: choices.matrixes,
			},
			{
				type: 'checkbox',
				label: 'Active',
				id: 'mtxActive',
				default: true,
			},
		],
		callback: async (action) => {
			let opt = action.options
			const commands = self.setRouting(
				opt.inputGrp,
				opt.mtxAssign,
				opt.mtxActive,
				model.count.matrix,
				[0, 0x6e],
				[0, 0x4b],
			)
			mixer.midi.sendCommands(commands)
		},
	}

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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(
				opt.input,
				opt.assign,
				model.count.mix,
				opt.leveldb,
				[0x50, 0x50],
				[0, 0x44],
				'PanBalance',
			)
			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(
				opt.input,
				opt.assign,
				model.count.mix,
				opt.leveldb,
				[0x50, 0x55],
				[0x30, 0x04],
				'PanBalance',
			)
			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(
				opt.input,
				opt.assign,
				model.count.mix,
				opt.leveldb,
				[0x50, 0x56],
				[0x3c, 0x14],
				'PanBalance',
			)
			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(
				opt.input,
				opt.assign,
				model.count.group,
				opt.leveldb,
				[0, 0x5b],
				[0, 0x34],
				'PanBalance',
			)
			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(
				opt.input,
				opt.assign,
				model.count.matrix,
				opt.leveldb,
				[0x5e, 0x5e],
				[0x24, 0x27],
				'PanBalance',
			)
			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(
				opt.input,
				opt.assign,
				model.count.matrix,
				opt.leveldb,
				[0, 0x5e],
				[0, 0x4b],
				'PanBalance',
			)
			mixer.midi.sendCommands(commands)
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
				choices: choices.allFaders.filter(function (val, idx, arr) {
					return idx < 19
				}),
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
		callback: async (action) => {
			let opt = action.options
			const commands = await self.setLevel(opt.input, 99, 0, opt.leveldb, [0x5f, 0], [0, 0], 'PanBalance')
			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options

			sceneNumber = opt.scene - 1
			const commands = [[midi.BN, 0, (sceneNumber >> 7) & 0x0f, midi.CN, sceneNumber & 0x7f]]

			mixer.midi.sendCommands(commands)
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
		callback: async (action) => {
			let opt = action.options

			sceneNumber = self.setScene(opt.scene)
			const commands = [[midi.BN, 0, (sceneNumber >> 7) & 0x0f, midi.CN, sceneNumber & 0x7f]]

			mixer.midi.sendCommands(commands)
		},
	}

	return actions
}
