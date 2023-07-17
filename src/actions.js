const level      = require('./level.json')
const sqconfig   = require('./sqconfig.json')

module.exports = {
	initActions : function() {
		let self = this;

		var sq = sqconfig['config'][this.config.model]

		this.chCount    = sq['chCount']
		this.mixCount   = sq['mixCount']
		this.grpCount   = sq['grpCount']
		this.fxrCount   = sq['fxrCount']
		this.fxsCount   = sq['fxsCount']
		this.mtxCount   = sq['mtxCount']
		this.dcaCount   = sq['dcaCount']
		this.muteGroup	 = sq['muteGroup']
		this.SoftKey    = sq['SoftKey']
		this.sceneCount = sq['sceneCount']

		let actions = {}

		var cmd = {};
		var strip;

		this.CHOICES_INPUT_CHANNEL = []
		for (let i = 0; i < this.chCount; i++) {
			this.CHOICES_INPUT_CHANNEL.push({ label: `CH ${i + 1}`, id: i })
		}

		this.CHOICES_SCENES = []
		for (let i = 0; i < this.sceneCount; i++) {
			this.CHOICES_SCENES.push({ label: `SCENE ${i + 1}`, id: i })
		}

		this.CHOICES_MIX = [];
		this.CHOICES_MIX.push({ label: `LR`, id: 99 })
		for (let i = 0; i < this.mixCount; i++) {
			this.CHOICES_MIX.push({ label: `AUX ${i + 1}`, id: i })
		}

		this.CHOICES_GRP = []
		for (let i = 0; i < this.grpCount; i++) {
			this.CHOICES_GRP.push({ label: `GROUP ${i + 1}`, id: i })
		}

		this.CHOICES_FXR = []
		for (let i = 0; i < this.fxrCount; i++) {
			this.CHOICES_FXR.push({ label: `FX RETURN ${i + 1}`, id: i })
		}

		this.CHOICES_FXS = []
		for (let i = 0; i < this.fxsCount; i++) {
			this.CHOICES_FXS.push({ label: `FX SEND ${i + 1}`, id: i })
		}

		this.CHOICES_MTX = []
		for (let i = 0; i < this.mtxCount; i++) {
			this.CHOICES_MTX.push({ label: `MATRIX ${i + 1}`, id: i })
		}

		this.CHOICES_LEVEL = [
			{ label: `Last dB value`, id: 1000 },
			{ label: `Step +1 dB`, id: 998 },
			{ label: `Step +3 dB`, id: 1001 }, //added
			{ label: `Step +6 dB`, id: 1002 }, //added
			{ label: `Step -1 dB`, id: 999 },
			{ label: `Step -3 dB`, id: 1003 }, //added
			{ label: `Step -6 dB`, id: 1004 } //added
		]
		for (let i = -90; i <= -40; i = i + 5) {
			if (i == -90) {
				i = '-inf'
			}
			this.CHOICES_LEVEL.push({ label: `${i} dB`, id: i})
		}
		for (let i = -39; i <= -10; i = i + 1) {
			this.CHOICES_LEVEL.push({ label: `${i} dB`, id: i})
		}
		for (let i = -9.5; i <= 10; i = i + 0.5) {
			this.CHOICES_LEVEL.push({ label: `${i} dB`, id: i})
		}

		this.CHOICES_PANLEVEL = [
			{ label: `Step Right`, id: 998 },
			{ label: `Step Left`, id: 999 }
		]
		for (let i = -100; i <= 100; i = i + 5) {
			let pos = i < 0 ? `L${Math.abs(i)}` : i == 0 ? `CTR` : `R${Math.abs(i)}`
			this.CHOICES_PANLEVEL.push({ label: `${pos}`, id: `${pos}`})
		}

		this.CHOICES_DCA = []
		for (let i = 0; i < this.dcaCount; i++) {
			this.CHOICES_DCA.push({ label: `DCA ${i + 1}`, id: i })
		}

		this.CHOICES_MUTEGRP = []
		for (let i = 0; i < this.muteGroup; i++) {
			this.CHOICES_MUTEGRP.push({ label: `MuteGroup ${i + 1}`, id: i })
		}

		this.CHOICES_SOFT = []
		for (let i = 0; i < this.SoftKey; i++) {
			this.CHOICES_SOFT.push({ label: `SOFTKEY ${i + 1}`, id: i })
		}

		// All fader mix choices
		this.CHOICES_ALLFADER = []
		this.CHOICES_ALLFADER.push({ label: `LR`, id: 0 })
		for (let i = 0; i < this.mixCount; i++) {
			this.CHOICES_ALLFADER.push({ label: `AUX ${i + 1}`, id: i + 1 })
		}
		for (let i = 0; i < this.fxsCount; i++) {
			this.CHOICES_ALLFADER.push({ label: `FX SEND ${i + 1}`, id: i + 1 + this.mixCount })
		}
		for (let i = 0; i < this.mtxCount; i++) {
			this.CHOICES_ALLFADER.push({ label: `MATRIX ${i + 1}`, id: i + 1 + this.mixCount + this.fxsCount })
		}
		for (let i = 0; i < this.dcaCount; i++) {
			this.CHOICES_ALLFADER.push({ label: `DCA ${i + 1}`, id: i + 1 + this.mixCount + this.fxsCount + this.mtxCount + 12 })
		}

		this.muteOptions = (name, qty, ofs) => {
			this.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i + ofs })
			}

			return [
				{
					type:	'dropdown',
					label:	name,
					id:		'strip',
					default:	1 + ofs,
					choices:	this.CHOICES,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mute',
					id:		'mute',
					default:	0,
					choices:	[
						{label: 'Toggle', id: 0},
						{label: 'On', id: 1},
						{label: 'Off', id: 2}
					],
				}
			]
		}

		this.fadeObj = {
			type:	'dropdown',
			label:	'Fading',
			id:		'fade',
			default:	0,
			choices:	[
				{label: `Off`, id: 0},
				{label: `1s`, id: 1},
				{label: `2s`, id: 2},
				{label: `3s`, id: 3},
			],
			minChoicesForSearch: 0,
		}

		this.levelObj = {
			type:	'dropdown',
			label:	'Level',
			id:		'leveldb',
			default:	'0',
			multiple:	false,
			choices:	this.CHOICES_LEVEL,
			minChoicesForSearch: 0,
		}

		this.faderOptions = (name, qty, ofs) => {
			this.CHOICES = []
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i + ofs })
			}

			return [
				{
					type:	'dropdown',
					label:	name,
					id:		'strip',
					default:	1 + ofs,
					choices:	this.CHOICES,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			]
		}

		actions['mute_input'] = {
			name: 'Mute Input',
			options: this.muteOptions('Input Channel', this.chCount, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['mute_lr'] = {
			name: 'Mute LR',
			options: [
				{
					type:	'dropdown',
					label:	'LR',
					id:		'strip',
					default:	0,
					choices:	[
						{ label: `LR`, id: 0 }
					],
					minChoicesForSearch: 99,
				},{
					type:	'dropdown',
					label:	'Mute',
					id:		'mute',
					default:	0,
					choices:	[
						{label: 'Toggle', id: 0},
						{label: 'On', id: 1},
						{label: 'Off', id: 2}
					],
				}
			],
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0x44;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['mute_aux'] = {
			name: 'Mute Aux',
			options: this.muteOptions('Aux', 12, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0x45;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}
		actions['mute_group'] = {
			name: 'Mute Group',
			options: this.muteOptions('Aux', 12, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0x30;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}
		actions['mute_matrix'] = {
			name: 'Mute Matrix',
			options: this.muteOptions('Matrix', 3, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0x55;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}
		actions['mute_fx_send'] = {
			name: 'Mute FX Send',
			options: this.muteOptions('FX Send', 4, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0x51;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}
		actions['mute_fx_return'] = {
			name: 'Mute FX Return',
			options: this.muteOptions('FX Return', 8, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0;
				LSB = 0x3C;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}
		actions['mute_dca'] = {
			name: 'Mute DCA',
			options: this.muteOptions('DCA', 8, -1),
			callback: async (action) => {
				let opt = action.options;
				MSB = 0x02;
				LSB = 0;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}
		actions['mute_mutegroup'] = {
			name: 'Mute MuteGroup',
			options: this.muteOptions('Mute MuteGroup', 8, -1)
			,callback: async (action) => {
				let opt = action.options;
				MSB = 0x04;
				LSB = 0;

				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}
	
				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ self.mch, 0x63, MSB, self.mch, 0x62, strip + LSB, self.mch, 0x06, 0x00, self.mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}

		if (this.config.model == 'SQ6' || this.config.model == 'SQ7') {
			// Soft Rotary
		}

		actions['key_soft'] = {
			name:	'Press Softkey',
			options:	[
				{
					type:	'dropdown',
					label:	'Soft Key',
					id:		'softKey',
					default:	'0',
					choices:	this.CHOICES_SOFT,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Key type',
					id:		'pressedsk',
					default:	'1',
					choices:	[
						{id: '0', label: 'Toggle'},
						{id: '1', label: 'Press'},
						{id: '2', label: 'Release'}
					],
					minChoicesForSearch: 5,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				let softKey = parseInt(opt.softKey)
				let keyValu = (opt.pressedsk == '0' || opt.pressedsk == '1') ? true : false
				let tch = parseInt((keyValu ? '0x9' : '0x8') + (self.mch - 176).toString(16))
				cmd.buffers = [ Buffer.from([ tch, 0x30 + softKey, keyValu ? 0x7F : 0 ]) ]
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['ch_to_mix'] = {
			name: 'Assign channel to mix',
			options: [
				{
					type:	'dropdown',
					label:	'Input Channel',
					id:		'inputChannel',
					default:	'0',
					choices:	this.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'mixAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_MIX,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'mixActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputChannel, opt.mixAssign, opt.mixActive, this.mixCount, [0x60,0x60], [0,0x44])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['ch_to_grp'] = {
			name: 'Assign channel to group',
			options: [
				{
					type:	'dropdown',
					label:	'Input Channel',
					id:		'inputChannel',
					default:	'0',
					choices:	this.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Group',
					id:		'grpAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_GRP,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'grpActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputChannel, opt.grpAssign, opt.grpActive, this.grpCount, [0,0x66], [0,0x74])
				self.sendBuffers(cmd.buffers);
			}
		};

		actions['grp_to_mix'] = {
			name: 'Assign group to mix',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'inputGrp',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'mixAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_MIX,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'mixActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputGrp, opt.mixAssign, opt.mixActive, this.mixCount, [0x60,0x65], [0x30,0x04])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['fxr_to_grp'] = {
			name: 'Assign FX Return to group',
			options: [
				{
					type:	'dropdown',
					label:	'FX Return',
					id:		'inputFxr',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Group',
					id:		'grpAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_GRP,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'grpActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputFxr, opt.grpAssign, opt.grpActive, this.grpCount, [0,0x6B], [0,0x34])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['ch_to_fxs'] = {
			name: 'Assign channel to FX Send',
			options: [
				{
					type:	'dropdown',
					label:	'Input Channel',
					id:		'inputChannel',
					default:	'0',
					choices:	this.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'FX Send',
					id:		'fxsAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_FXS,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'fxsActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputChannel, opt.fxsAssign, opt.fxsActive, this.fxsCount, [0,0x6C], [0,0x14])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['grp_to_fxs'] = {
			name: 'Assign group to FX send',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'inputGrp',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'FX Send',
					id:		'fxsAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_FXS,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'fxsActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputGrp, opt.fxsAssign, opt.fxsActive, this.fxsCount, [0,0x6D], [0,0x54])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['fxr_to_fxs'] = {
			name: 'Assign FX return to FX send',
			options: [
				{
					type:	'dropdown',
					label:	'FX return',
					id:		'inputFxr',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'FX Send',
					id:		'fxsAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_FXS,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'fxsActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputFxr, opt.fxsAssign, opt.fxsActive, this.fxsCount, [0,0x6E], [0,0x04])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['mix_to_mtx'] = {
			name: 'Assign mix to matrix',
			options: [
				{
					type:	'dropdown',
					label:	'Mix',
					id:		'inputMix',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Matrix',
					id:		'mtxAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_MTX,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'mtxActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputMix, opt.mtxAssign, opt.mtxActive, this.mtxCount, [0x6E,0x6E], [0x24,0x27])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['grp_to_mtx'] = {
			name: 'Assign group to matrix',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'inputGrp',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Matrix',
					id:		'mtxAssign',
					default:	[],
					multiple:	true,
					choices:	this.CHOICES_MTX,
				},{
					type:	'checkbox',
					label:	'Active',
					id:		'mtxActive',
					default:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.setRouting(opt.inputGrp, opt.mtxAssign, opt.mtxActive, this.mtxCount, [0,0x6E], [0,0x4B])
				self.sendBuffers(cmd.buffers);
			}
		}

		/* Level */
		actions['chlev_to_mix'] = {
			name: 'Fader channel level to mix',
			options: [
				{
					type:	'dropdown',
					label:	'Input channel',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.leveldb, [0x40,0x40], [0,0x44])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['grplev_to_mix'] = {
			name: 'Fader group level to mix',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.leveldb, [0x40,0x45], [0x30,0x04])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['fxrlev_to_mix'] = {
			name: 'Fader FX return level to mix',
			options: [
				{
					type:	'dropdown',
					label:	'FX return',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.leveldb, [0x40,0x46], [0x3C,0x14])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['fxrlev_to_grp'] = {
			name: 'Fader FX return level to group',
			options: [
				{
					type:	'dropdown',
					label:	'FX return',
					id:	'input',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Group',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.grpCount, opt.leveldb, [0,0x4B], [0,0x34])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['chlev_to_fxs'] = {
			name: 'Fader channel level to FX send',
			options: [
				{
					type:	'dropdown',
					label:	'Input channel',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'FX Send',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_FXS,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.leveldb, [0,0x4C], [0,0x14])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['grplev_to_fxs'] = {
			name: 'Fader group level to FX send',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'FX Send',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_FXS,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.leveldb, [0,0x4D], [0,0x54])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['fxslev_to_fxs'] = {
			name: 'Fader FX return level to FX send',
			options: [
				{
					type:	'dropdown',
					label:	'FX return',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'FX Send',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_FXS,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.leveldb, [0,0x4E], [0,0x04])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['mixlev_to_mtx'] = {
			name: 'Fader mix level to matrix',
			options: [
				{
					type:	'dropdown',
					label:	'Mix',
					id:	'input',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Matrix',
					id:	'assign',
					default:	'0',
					choices:	this.CHOICES_MTX,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mtxCount, opt.leveldb, [0x4E,0x4E], [0x24,0x27])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['grplev_to_mtx'] = {
			name: 'Fader group level to matrix',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Matrix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MTX,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mtxCount, opt.leveldb, [0,0x4E], [0,0x4B])
				self.sendBuffers(cmd.buffers);
			}
		}

		actions['level_to_output'] = {
			name: 'Fader level to output',
			options: [
				{
					type:	'dropdown',
					label:	'Fader',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_ALLFADER,
					minChoicesForSearch: 0,
				},
				this.levelObj,
				this.fadeObj,
			],
			callback: async (action) => {
				let opt = action.options;
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, 99, 0, opt.leveldb, [0x4F,0], [0,0])
				self.sendBuffers(cmd.buffers);
			}
		}

		/* Pan Balance */
		actions['chpan_to_mix'] = {
			name: 'Pan/Bal channel level to mix',
			options: [
				{
					type:	'dropdown',
					label:	'Input channel',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_INPUT_CHANNEL,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	'CTR',
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, opt.assign, this.mixCount, [0x50,0x50], [0,0x44])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.leveldb, [0x50,0x50], [0,0x44], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		actions['grppan_to_mix'] = {
			name: 'Pan/Bal group level to mix',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	0,
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, opt.assign, this.mixCount, [0x50,0x55], [0x30,0x04])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.leveldb, [0x50,0x55], [0x30,0x04], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		actions['fxrpan_to_mix'] = {
			name: 'Pan/Bal FX return level to mix',
			options: [
				{
					type:	'dropdown',
					label:	'FX return',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Mix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	0,
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, opt.assign, this.mixCount, [0x50,0x56], [0x3C,0x14])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.leveldb, [0x50,0x56], [0x3C,0x14], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		actions['fxrpan_to_grp'] = {
			name: 'Fader FX return level to group',
			options: [
				{
					type:	'dropdown',
					label:	'FX return',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_FXR,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Group',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	0,
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, opt.assign, this.grpCount, [0,0x5B], [0,0x34])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.grpCount, opt.leveldb, [0,0x5B], [0,0x34], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		actions['mixpan_to_mtx'] = {
			name: 'Pan/Bal mix level to matrix',
			options: [
				{
					type:	'dropdown',
					label:	'Mix',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_MIX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Matrix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MTX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	0,
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, opt.assign, this.mtxCount, [0x5E,0x5E], [0x24,0x27])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mtxCount, opt.leveldb, [0x5E,0x5E], [0x24,0x27], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		actions['grppan_to_mtx'] = {
			name: 'Pan/Bal group level to matrix',
			options: [
				{
					type:	'dropdown',
					label:	'Group',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_GRP,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Matrix',
					id:		'assign',
					default:	'0',
					choices:	this.CHOICES_MTX,
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	0,
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, opt.assign, this.mtxCount, [0,0x5E], [0,0x4B])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mtxCount, opt.leveldb, [0,0x5E], [0,0x4B], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		actions['pan_to_output'] = {
			name: 'Pan/Bal level to output',
			options: [
				{
					type:	'dropdown',
					label:	'Fader',
					id:		'input',
					default:	'0',
					choices:	this.CHOICES_ALLFADER.filter(function(val, idx, arr){return idx < 19}),
					minChoicesForSearch: 0,
				},{
					type:	'dropdown',
					label:	'Level',
					id:		'leveldb',
					default:	0,
					multiple:	false,
					choices:	this.CHOICES_PANLEVEL,
					minChoicesForSearch: 0,
				},{
					type:	'textinput',
					label:	'Variable to show level (click config button to refresh)',
					id:		'showvar',
					default:	'',
				}
			],
			subscribe: async (action) => {
				let opt = action.options
				let val = this.getLevel(opt.input, 99, 0, [0x5F,0], [0,0])
				this.sendSocket(val.buffer[0])
				opt.showvar = `\$(${this.config.label}:pan_${val.channel[0]}.${val.channel[1]})`
			},
			callback: (action) => {
				let opt = action.options
				cmd.buffers = this.setLevel(opt.input, 99, 0, opt.leveldb, [0x5F,0], [0,0], 'PanBalance')
				self.sendBuffers(cmd.buffers);
			},
		}

		// Scene
		actions['scene_recall'] = {
			name: 'Scene recall',
			options: [
				{
					type:	'number',
					label:	'Scene nr.',
					id:		'scene',
					default:	1,
					min:		1,
					max:		this.sceneCount,
					required:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;

				sceneNumber = opt.scene - 1
				cmd.buffers = [ Buffer.from([ self.mch, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]

				self.sendBuffers(cmd.buffers);
			}
		}

		actions['scene_step'] = {
			name: 'Scene step',
			options: [
				{
					type:	'number',
					label:	'Scene +/-',
					id:		'scene',
					default:	1,
					min:		-50,
					max:		50,
					required:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;

				sceneNumber = this.setScene(opt.scene)
				cmd.buffers = [ Buffer.from([ self.mch, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]

				self.sendBuffers(cmd.buffers);
			}
		}

		actions['current_scene'] = {
			name: 'Current scene',
			options: [
				{
					type:	'number',
					label:	'Scene nr.',
					id:		'scene',
					default:	1,
					min:		1,
					max:		this.sceneCount,
					required:	true,
				}
			],
			callback: async (action) => {
				let opt = action.options;

				sceneNumber = opt.scene - 1
				cmd.buffers = [ Buffer.from([ self.mch, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]

				self.sendBuffers(cmd.buffers);
			}
		}

		self.setActionDefinitions(actions);
	},
}