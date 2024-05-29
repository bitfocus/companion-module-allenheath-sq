const level = require('./level.json')
const sqconfig = require('./sqconfig.json')

module.exports = {
	initActions: function () {
		let self = this

		var sq = sqconfig['config'][self.config.model]

		self.chCount = sq['chCount']
		self.mixCount = sq['mixCount']
		self.grpCount = sq['grpCount']
		self.fxrCount = sq['fxrCount']
		self.fxsCount = sq['fxsCount']
		self.mtxCount = sq['mtxCount']
		self.dcaCount = sq['dcaCount']
		self.muteGroup = sq['muteGroup']
		self.SoftKey = sq['SoftKey']
		self.sceneCount = sq['sceneCount']

		let actions = {}

		var cmd = {}
		var strip

		var sceneNumber

		self.CHOICES_INPUT_CHANNEL = []
		for (let i = 0; i < self.chCount; i++) {
			self.CHOICES_INPUT_CHANNEL.push({ label: `CH ${i + 1}`, id: i })
		}

		self.CHOICES_SCENES = []
		for (let i = 0; i < self.sceneCount; i++) {
			self.CHOICES_SCENES.push({ label: `SCENE ${i + 1}`, id: i })
		}

		self.CHOICES_MIX = []
		self.CHOICES_MIX.push({ label: `LR`, id: 99 })
		for (let i = 0; i < self.mixCount; i++) {
			self.CHOICES_MIX.push({ label: `AUX ${i + 1}`, id: i })
		}

		self.CHOICES_GRP = []
		for (let i = 0; i < self.grpCount; i++) {
			self.CHOICES_GRP.push({ label: `GROUP ${i + 1}`, id: i })
		}

		self.CHOICES_FXR = []
		for (let i = 0; i < self.fxrCount; i++) {
			self.CHOICES_FXR.push({ label: `FX RETURN ${i + 1}`, id: i })
		}

		self.CHOICES_FXS = []
		for (let i = 0; i < self.fxsCount; i++) {
			self.CHOICES_FXS.push({ label: `FX SEND ${i + 1}`, id: i })
		}

		self.CHOICES_MTX = []
		for (let i = 0; i < self.mtxCount; i++) {
			self.CHOICES_MTX.push({ label: `MATRIX ${i + 1}`, id: i })
		}

		self.CHOICES_LEVEL = [
			{ label: `Last dB value`, id: 1000 },
			{ label: `Step +0.1 dB`, id: 'step+0.1' }, //added
			{ label: `Step +1 dB`, id: 'step+1' },
			{ label: `Step +3 dB`, id: 'step+3' }, //added
			{ label: `Step +6 dB`, id: 'step+6' }, //added
			{ label: `Step -0.1 dB`, id: 'step-0.1' }, //added
			{ label: `Step -1 dB`, id: 'step-1' },
			{ label: `Step -3 dB`, id: 'step-3' }, //added
			{ label: `Step -6 dB`, id: 'step-6' }, //added
		]
		for (let i = -90; i <= -40; i = i + 5) {
			if (i == -90) {
				i = '-inf'
			}
			self.CHOICES_LEVEL.push({ label: `${i} dB`, id: i })
		}
		for (let i = -39; i <= -10; i = i + 1) {
			self.CHOICES_LEVEL.push({ label: `${i} dB`, id: i })
		}
		for (let i = -9.5; i <= 10; i = i + 0.5) {
			self.CHOICES_LEVEL.push({ label: `${i} dB`, id: i })
		}

		self.CHOICES_PANLEVEL = [
			{ label: `Step Right`, id: 998 },
			{ label: `Step Left`, id: 999 },
		]
		for (let i = -100; i <= 100; i = i + 5) {
			let pos = i < 0 ? `L${Math.abs(i)}` : i == 0 ? `CTR` : `R${Math.abs(i)}`
			self.CHOICES_PANLEVEL.push({ label: `${pos}`, id: `${pos}` })
		}

		self.CHOICES_DCA = []
		for (let i = 0; i < self.dcaCount; i++) {
			self.CHOICES_DCA.push({ label: `DCA ${i + 1}`, id: i })
		}

		self.CHOICES_MUTEGRP = []
		for (let i = 0; i < self.muteGroup; i++) {
			self.CHOICES_MUTEGRP.push({ label: `MuteGroup ${i + 1}`, id: i })
		}

		self.CHOICES_SOFT = []
		for (let i = 0; i < self.SoftKey; i++) {
			self.CHOICES_SOFT.push({ label: `SOFTKEY ${i + 1}`, id: i })
		}

		// All fader mix choices
		self.CHOICES_ALLFADER = []
		self.CHOICES_ALLFADER.push({ label: `LR`, id: 0 })
		for (let i = 0; i < self.mixCount; i++) {
			self.CHOICES_ALLFADER.push({ label: `AUX ${i + 1}`, id: i + 1 })
		}
		for (let i = 0; i < self.fxsCount; i++) {
			self.CHOICES_ALLFADER.push({ label: `FX SEND ${i + 1}`, id: i + 1 + self.mixCount })
		}
		for (let i = 0; i < self.mtxCount; i++) {
			self.CHOICES_ALLFADER.push({ label: `MATRIX ${i + 1}`, id: i + 1 + self.mixCount + self.fxsCount })
		}
		for (let i = 0; i < self.dcaCount; i++) {
			self.CHOICES_ALLFADER.push({
				label: `DCA ${i + 1}`,
				id: i + 1 + self.mixCount + self.fxsCount + self.mtxCount + 12,
			})
		}

		self.muteOptions = (name, qty, ofs) => {
			self.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				self.CHOICES.push({ label: `${name} ${i}`, id: i + ofs })
			}

			return [
				{
					type: 'dropdown',
					label: name,
					id: 'strip',
					default: 1 + ofs,
					choices: self.CHOICES,
					minChoicesForSearch: 0,
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
			]
		}

		self.fadeObj = {
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

		self.levelObj = {
			type: 'dropdown',
			label: 'Level',
			id: 'leveldb',
			default: '0',
			multiple: false,
			choices: self.CHOICES_LEVEL,
			minChoicesForSearch: 0,
		}

		self.faderOptions = (name, qty, ofs) => {
			self.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				self.CHOICES.push({ label: `${name} ${i}`, id: i + ofs })
			}

			return [
				{
					type: 'dropdown',
					label: name,
					id: 'strip',
					default: 1 + ofs,
					choices: self.CHOICES,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			]
		}

		actions['mute_input'] = {
			name: 'Mute Input',
			options: self.muteOptions('Input Channel', self.chCount, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0
				LSB = 0

				let strip = opt.strip

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
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
				MSB = 0
				LSB = 0x44

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['mute_aux'] = {
			name: 'Mute Aux',
			options: self.muteOptions('Aux', 12, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0
				LSB = 0x45

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}
		actions['mute_group'] = {
			name: 'Mute Group',
			options: self.muteOptions('Aux', 12, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0
				LSB = 0x30

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}
		actions['mute_matrix'] = {
			name: 'Mute Matrix',
			options: self.muteOptions('Matrix', 3, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0
				LSB = 0x55

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}
		actions['mute_fx_send'] = {
			name: 'Mute FX Send',
			options: self.muteOptions('FX Send', 4, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0
				LSB = 0x51

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}
		actions['mute_fx_return'] = {
			name: 'Mute FX Return',
			options: self.muteOptions('FX Return', 8, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0
				LSB = 0x3c

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}
		actions['mute_dca'] = {
			name: 'Mute DCA',
			options: self.muteOptions('DCA', 8, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0x02
				LSB = 0

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
			},
		}
		actions['mute_mutegroup'] = {
			name: 'Mute MuteGroup',
			options: self.muteOptions('Mute MuteGroup', 8, -1),
			callback: async (action) => {
				let opt = action.options
				MSB = 0x04
				LSB = 0

				let strip = parseInt(opt.strip)

				if (parseInt(opt.mute) > 0) {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					self.fdbState['mute_' + MSB + '.' + (LSB + strip)] =
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				self.checkFeedbacks()
				cmd.buffers = [
					Buffer.from([
						self.mch,
						0x63,
						MSB,
						self.mch,
						0x62,
						strip + LSB,
						self.mch,
						0x06,
						0x00,
						self.mch,
						0x26,
						self.fdbState['mute_' + MSB + '.' + (LSB + strip)],
					]),
				]
				self.sendBuffers(cmd.buffers)
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
					default: '0',
					choices: self.CHOICES_SOFT,
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
				let tch = parseInt((keyValu ? '0x9' : '0x8') + (self.mch - 176).toString(16))
				cmd.buffers = [Buffer.from([tch, 0x30 + softKey, keyValu ? 0x7f : 0])]
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['ch_to_mix'] = {
			name: 'Assign channel to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Input Channel',
					id: 'inputChannel',
					default: '0',
					choices: self.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'mixAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_MIX,
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
				cmd.buffers = self.setRouting(
					opt.inputChannel,
					opt.mixAssign,
					opt.mixActive,
					self.mixCount,
					[0x60, 0x60],
					[0, 0x44],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['ch_to_grp'] = {
			name: 'Assign channel to group',
			options: [
				{
					type: 'dropdown',
					label: 'Input Channel',
					id: 'inputChannel',
					default: '0',
					choices: self.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Group',
					id: 'grpAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_GRP,
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
				cmd.buffers = self.setRouting(
					opt.inputChannel,
					opt.grpAssign,
					opt.grpActive,
					self.grpCount,
					[0, 0x66],
					[0, 0x74],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grp_to_mix'] = {
			name: 'Assign group to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'inputGrp',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'mixAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_MIX,
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
				cmd.buffers = self.setRouting(
					opt.inputGrp,
					opt.mixAssign,
					opt.mixActive,
					self.mixCount,
					[0x60, 0x65],
					[0x30, 0x04],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxr_to_grp'] = {
			name: 'Assign FX Return to group',
			options: [
				{
					type: 'dropdown',
					label: 'FX Return',
					id: 'inputFxr',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Group',
					id: 'grpAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_GRP,
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
				cmd.buffers = self.setRouting(opt.inputFxr, opt.grpAssign, opt.grpActive, self.grpCount, [0, 0x6b], [0, 0x34])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['ch_to_fxs'] = {
			name: 'Assign channel to FX Send',
			options: [
				{
					type: 'dropdown',
					label: 'Input Channel',
					id: 'inputChannel',
					default: '0',
					choices: self.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'fxsAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_FXS,
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
				cmd.buffers = self.setRouting(
					opt.inputChannel,
					opt.fxsAssign,
					opt.fxsActive,
					self.fxsCount,
					[0, 0x6c],
					[0, 0x14],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grp_to_fxs'] = {
			name: 'Assign group to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'inputGrp',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'fxsAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_FXS,
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
				cmd.buffers = self.setRouting(opt.inputGrp, opt.fxsAssign, opt.fxsActive, self.fxsCount, [0, 0x6d], [0, 0x54])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxr_to_fxs'] = {
			name: 'Assign FX return to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'inputFxr',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'fxsAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_FXS,
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
				cmd.buffers = self.setRouting(opt.inputFxr, opt.fxsAssign, opt.fxsActive, self.fxsCount, [0, 0x6e], [0, 0x04])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['mix_to_mtx'] = {
			name: 'Assign mix to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'inputMix',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'mtxAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_MTX,
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
				cmd.buffers = self.setRouting(
					opt.inputMix,
					opt.mtxAssign,
					opt.mtxActive,
					self.mtxCount,
					[0x6e, 0x6e],
					[0x24, 0x27],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grp_to_mtx'] = {
			name: 'Assign group to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'inputGrp',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'mtxAssign',
					default: [],
					multiple: true,
					choices: self.CHOICES_MTX,
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
				cmd.buffers = self.setRouting(opt.inputGrp, opt.mtxAssign, opt.mtxActive, self.mtxCount, [0, 0x6e], [0, 0x4b])
				self.sendBuffers(cmd.buffers)
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
					default: '0',
					choices: self.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				if (opt.fade == 0) {
					//make it super short like 0.2
					opt.fade = 0.2
				}

				cmd.buffers = await self.fadeLevel(
					opt.fade,
					opt.input,
					opt.assign,
					self.mixCount,
					opt.leveldb,
					[0x40, 0x40],
					[0, 0x44],
				)
				console.log('cmd.buffers', cmd.buffers)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grplev_to_mix'] = {
			name: 'Fader group level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(
					opt.fade,
					opt.input,
					opt.assign,
					self.mixCount,
					opt.leveldb,
					[0x40, 0x45],
					[0x30, 0x04],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxrlev_to_mix'] = {
			name: 'Fader FX return level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(
					opt.fade,
					opt.input,
					opt.assign,
					self.mixCount,
					opt.leveldb,
					[0x40, 0x46],
					[0x3c, 0x14],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxrlev_to_grp'] = {
			name: 'Fader FX return level to group',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Group',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(opt.fade, opt.input, opt.assign, self.grpCount, opt.leveldb, [0, 0x4b], [0, 0x34])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['chlev_to_fxs'] = {
			name: 'Fader channel level to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'Input channel',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_FXS,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(opt.fade, opt.input, opt.assign, self.fxsCount, opt.leveldb, [0, 0x4c], [0, 0x14])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grplev_to_fxs'] = {
			name: 'Fader group level to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_FXS,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(opt.fade, opt.input, opt.assign, self.fxsCount, opt.leveldb, [0, 0x4d], [0, 0x54])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxslev_to_fxs'] = {
			name: 'Fader FX return level to FX send',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'FX Send',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_FXS,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(opt.fade, opt.input, opt.assign, self.fxsCount, opt.leveldb, [0, 0x4e], [0, 0x04])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['mixlev_to_mtx'] = {
			name: 'Fader mix level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'input',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MTX,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(
					opt.fade,
					opt.input,
					opt.assign,
					self.mtxCount,
					opt.leveldb,
					[0x4e, 0x4e],
					[0x24, 0x27],
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grplev_to_mtx'] = {
			name: 'Fader group level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MTX,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(opt.fade, opt.input, opt.assign, self.mtxCount, opt.leveldb, [0, 0x4e], [0, 0x4b])
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['level_to_output'] = {
			name: 'Fader level to output',
			options: [
				{
					type: 'dropdown',
					label: 'Fader',
					id: 'input',
					default: '0',
					choices: self.CHOICES_ALLFADER,
					minChoicesForSearch: 0,
				},
				self.levelObj,
				self.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = self.fadeLevel(opt.fade, opt.input, 99, 0, opt.leveldb, [0x4f, 0], [0, 0])
				self.sendBuffers(cmd.buffers)
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
					default: '0',
					choices: self.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 'CTR',
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, opt.assign, self.mixCount, [0x50, 0x50], [0, 0x44])
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(
					opt.input,
					opt.assign,
					self.mixCount,
					opt.leveldb,
					[0x50, 0x50],
					[0, 0x44],
					'PanBalance',
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grppan_to_mix'] = {
			name: 'Pan/Bal group level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 0,
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, opt.assign, self.mixCount, [0x50, 0x55], [0x30, 0x04])
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(
					opt.input,
					opt.assign,
					self.mixCount,
					opt.leveldb,
					[0x50, 0x55],
					[0x30, 0x04],
					'PanBalance',
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxrpan_to_mix'] = {
			name: 'Pan/Bal FX return level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 0,
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, opt.assign, self.mixCount, [0x50, 0x56], [0x3c, 0x14])
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(
					opt.input,
					opt.assign,
					self.mixCount,
					opt.leveldb,
					[0x50, 0x56],
					[0x3c, 0x14],
					'PanBalance',
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['fxrpan_to_grp'] = {
			name: 'Fader FX return level to group',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: '0',
					choices: self.CHOICES_FXR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Group',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 0,
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, opt.assign, self.grpCount, [0, 0x5b], [0, 0x34])
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(
					opt.input,
					opt.assign,
					self.grpCount,
					opt.leveldb,
					[0, 0x5b],
					[0, 0x34],
					'PanBalance',
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['mixpan_to_mtx'] = {
			name: 'Pan/Bal mix level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'input',
					default: '0',
					choices: self.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MTX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 0,
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, opt.assign, self.mtxCount, [0x5e, 0x5e], [0x24, 0x27])
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(
					opt.input,
					opt.assign,
					self.mtxCount,
					opt.leveldb,
					[0x5e, 0x5e],
					[0x24, 0x27],
					'PanBalance',
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['grppan_to_mtx'] = {
			name: 'Pan/Bal group level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: '0',
					choices: self.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: '0',
					choices: self.CHOICES_MTX,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 0,
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = self.getLevel(opt.input, opt.assign, self.mtxCount, [0, 0x5e], [0, 0x4b])
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(
					opt.input,
					opt.assign,
					self.mtxCount,
					opt.leveldb,
					[0, 0x5e],
					[0, 0x4b],
					'PanBalance',
				)
				self.sendBuffers(cmd.buffers)
			},
		}

		actions['pan_to_output'] = {
			name: 'Pan/Bal level to output',
			options: [
				{
					type: 'dropdown',
					label: 'Fader',
					id: 'input',
					default: '0',
					choices: self.CHOICES_ALLFADER.filter(function (val, idx, arr) {
						return idx < 19
					}),
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Level',
					id: 'leveldb',
					default: 0,
					multiple: false,
					choices: self.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},
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
				self.sendSocket(val.buffer[0])
				opt.showvar = `\$(${self.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: async (action) => {
				let opt = action.options
				cmd.buffers = await self.setLevel(opt.input, 99, 0, opt.leveldb, [0x5f, 0], [0, 0], 'PanBalance')
				self.sendBuffers(cmd.buffers)
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
					max: self.sceneCount,
					required: true,
				},
			],
			callback: async (action) => {
				let opt = action.options

				sceneNumber = opt.scene - 1
				cmd.buffers = [
					Buffer.from([self.mch, 0, (sceneNumber >> 7) & 0x0f, 0xc0 | (self.mch & 0xf), sceneNumber & 0x7f]),
				]

				self.sendBuffers(cmd.buffers)
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
				cmd.buffers = [
					Buffer.from([self.mch, 0, (sceneNumber >> 7) & 0x0f, 0xc0 | (self.mch & 0xf), sceneNumber & 0x7f]),
				]

				self.sendBuffers(cmd.buffers)
			},
		}

		actions['current_scene'] = {
			name: 'Current scene',
			options: [
				{
					type: 'number',
					label: 'Scene nr.',
					id: 'scene',
					default: 1,
					min: 1,
					max: self.sceneCount,
					required: true,
				},
			],
			callback: async (action) => {
				let opt = action.options

				sceneNumber = opt.scene - 1
				cmd.buffers = [
					Buffer.from([self.mch, 0, (sceneNumber >> 7) & 0x0f, 0xc0 | (self.mch & 0xf), sceneNumber & 0x7f]),
				]

				self.sendBuffers(cmd.buffers)
			},
		}

		self.setActionDefinitions(actions)
	},
}
