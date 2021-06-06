/**
 *
 * Companion instance class for the Allen & Heath SQ.
 * Version 1.3.5
 * Author Max Kiusso <max@kiusso.net>
 *
 * Based on allenheath-dlive module by Andrew Broughton
 *
 * 2021-06-06  Version 1.3.5
 *			- Improve dB level
 *			- Add MIDI channel configuration
 *			- Add Retrive status configuration
 *
 * 2021-03-29  Version 1.3.4
 *             - Improve fader level
 *             - Improve pan level
 *             - Improve fading
 *			- Add Pan step increment
 *			- Add Pan level variables
 *
 * 2021-03-18  Version 1.3.3
 *             - Add "Last dB value"
 *             - Add fading option
 *
 * 2021-03-12  Version 1.3.2
 *             - Fix DCA level output
 *
 * 2021-03-10  Version 1.3.1
 *             - Beautify code
 *			- Fix level variables
 *
 * 2021-03-06  Version 1.3.0
 *             - Change Mute logics
 *             - Change dB Fader Level logics
 *             - Add Current Scene variable
 *             - Add all dB Fader Level variables
 *             - New presets
 *             - Improved receiving data function
 *             - Cleaning the code
 *
 * 2021-02-29  Version 1.2.7
 *             - Improved TCP connection
 *             - Fix dB value display
 *
 * 2021-02-20  Version 1.2.6
 *             - Improved code
 *             - Add fader step increment
 *             - Add fader level dB get
 *
 * 2021-02-14  Version 1.2.5
 *             - Add scene step and current scene display
 *
 * 2021-02-13  Version 1.2.3
 *             - Bug Fix
 *             - Add presets for mute actions and talkback
 *
 * 2021-02-11  Version 1.2.0
 *             - Add feedback for all mute actions
 *
 *             Version 1.1.2
 *             - Bug fix
 *
 * 2021-02-10  Version 1.1.0
 *             - Add listener for MIDI inbound data
 *             - Add function to autoset StreamDeck button status
 *               from status of the mute button on SQ
 *
 * 2021-02-09  Version 1.0.0
 */

let tcp			= require('../../tcp')
let instance_skel	= require('../../instance_skel')
let actions		= require('./actions')
let feedbacks		= require('./feedbacks')
let variables		= require('./variables')
let presets		= require('./presets')
let upgrade		= require('./upgrade')
let utils			= require('./utils')

const level		= require('./level.json')
const callback		= require('./callback.json')
const sqconfig		= require('./sqconfig.json')
const MIDI		= 51325
var chks			= false
var mch			= 0xB0

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...variables,
			...actions,
			...feedbacks,
			...presets,
			...upgrade,
			...utils,
		})

		this.fdbState = {}
		this.lastValue = {}

		this.addUpgradeScripts()
	}

	actions(system) {
		this.setActions(this.getActions())
	}

	feedbacks(system) {
		this.setFeedbackDefinitions(this.getFeedbacks())
	}

	variables(system) {
		this.setVariableDefinitions(this.getVariables())
	}

	presets(system) {
		this.setPresetDefinitions(this.getPresets())
	}

	setRouting(ch, mix, ac, mc, oMB, oLB) {
		let routingCmds = []
		let MSB
		let LSB
		let tmp

		for (let i = 0; i < mix.length; i++) {
			if (mix[i] == 99) {
				MSB = oMB[0]
				LSB = parseInt(oLB[0]) + parseInt(ch)
			} else {
				tmp = parseInt(ch * mc + oLB[1]) + parseInt(mix[i])
				MSB = oMB[1] + ((tmp >> 7) & 0x0F)
				LSB = tmp & 0x7F
			}

			routingCmds.push(Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, 0x06, 0, mch, 0x26, ac ? 1 : 0]))
		}

		return routingCmds
	}

	setLevel(ch, mx, ct, lv, oMB, oLB, cnfg = this.config.level) {
		var self = this
		let levelCmds = []
		let tmp
		let MSB
		let LSB

		if (lv < 998 || ['L','R','C'].indexOf(lv.slice(0,1)) != -1) {
			let tm = self.dBToDec(lv, cnfg)
			var VC = tm[0]
			var VF = tm[1]
		}

		if (mx == 99) {
			MSB = oMB[0]
			LSB = parseInt(oLB[0]) + parseInt(ch)
		} else {
			tmp = parseInt(ch * ct + oLB[1]) + parseInt(mx)
			MSB = oMB[1] + ((tmp >> 7) & 0x0F)
			LSB = tmp & 0x7F
		}

		if (lv < 998 || ['L','R','C'].indexOf(lv.slice(0,1)) != -1) {
			levelCmds.push( Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, 0x06, VC, mch, 0x26, VF ]) )
		} else {
			if (lv == 1000) {
				/* Last dB value */
				let rtn = self.dBToDec(self.lastValue['level_' + MSB +'.'+ LSB], cnfg)
				VC = rtn[0]
				VF = rtn[1]
				lv = 997

				levelCmds.push( Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, 0x06, VC, mch, 0x26, VF ]) )
			} else {
				/* Increment */
				levelCmds.push( Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, lv == 998 ? 0x60 : 0x61, 0x00 ]) )
			}
		}

		// Retrive value after set command
		levelCmds.push( Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, 0x60, 0x7F ]) )

		return levelCmds
	}

	setScene(val) {
		var sq = sqconfig['config'][this.config.model]
		var scn
		this.getVariable('currentScene', function(res) {
			scn = parseInt(res) - 1 + val
			if (scn < 0) {
				scn = 0
			}
			if (scn > sq['sceneCount']) {
				scn = sq['sceneCount']
			}
		})

		return scn
	}

	getLevel(ch, mx, ct, oMB, oLB) {
		let tmp
		let MSB
		let LSB

		if (mx == 99) {
			MSB = oMB[0]
			LSB = parseInt(oLB[0]) + parseInt(ch)
		} else {
			tmp = parseInt(ch * ct + oLB[1]) + parseInt(mx)
			MSB = oMB[1] + ((tmp >> 7) & 0x0F)
			LSB = tmp & 0x7F
		}

		return {
			buffer:     [ Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, 0x60, 0x7F ]) ],
			channel:    [MSB,LSB]
		}
	}

	fadeLevel(fd, ch, mx, ct, lv, oMB, oLB, cnfg = this.config.level) {
		var self = this
		if (fd == 0) {
			return self.setLevel(ch, mx, ct, lv, oMB, oLB, cnfg)
		} else {
			if (this.midiSocket !== undefined) {
				var setFade = (MSB, LSB, lv) => {
					let val = self.dBToDec(lv)
					let VC = val[0];
					let VF = val[1];
					self.midiSocket.write(Buffer.from([ mch, 0x63, MSB, mch, 0x62, LSB, mch, 0x06, VC, mch, 0x26, VF ]))

					lv = parseFloat(lv).toFixed(1)
					if (lv < -89) {
						lv = '-inf'
					}
					self.setVariable('level_' + MSB +'.'+ LSB, lv)
				}

				let fading = async (str, end, step, MSB, LSB) => {
					var db = parseFloat(str)
					if (db < -50) {
						db = -50
					}

					end = parseFloat(end)
					var bk = false
					if (end < -50) {
						bk = true
					}

					var itvFade = setInterval(
						() => {
							db = db - step
							if ((str < end && db > parseFloat(end)) || (str > end && db < parseFloat(end))) {
								db = end
							}
							setFade(MSB, LSB, db)

							if (db == end) {
								clearInterval(itvFade)
							} else {
								if (db <= -50 && bk) {
									db = -89
								}
							}
						},
						50
					)
				}

				let rm = self.getLevel(ch, mx, ct, oMB, oLB)
				var MSB = rm.channel[0]
				var LSB = rm.channel[1]
				let VC
				let VF
				var end

				if (lv == '-inf') {
					lv = -90
				}

				if (lv < 998) {
					end = lv
				} else {
					if (lv == 1000) {
						/* Last dB value */
						end = self.lastValue['level_' + MSB +'.'+ LSB]
					} else {
						return self.setLevel(ch, mx, ct, lv, oMB, oLB, cnfg)
					}
				}

				var str
				self.getVariable('level_' + MSB +'.'+ LSB, function(res) {
					str = res
				})

				if (str == '-inf') {
					str = -90
				}
				if (end == '-inf') {
					end = -90
				}
				if (parseInt(str) == parseInt(end)) {
					return []
				}

				let step = ((parseFloat(str) - parseFloat(end)) / (fd * 20)).toFixed(1)
				fading(str, end, step, MSB, LSB)
			}

			return [];
		}
	}

	sendSocket(buff) {
		if (this.midiSocket !== undefined) {
			this.log('debug', `Sending : ${JSON.parse(JSON.stringify(buff))['data']} from ${this.config.host}`)
			this.midiSocket.write(buff)
		}
	}

	action(action) {
		var opt = action.options
		let channel = parseInt(opt.inputChannel)
		let MSB = 0
		let LSB = 0
		let strip = parseInt(opt.strip)
		let cmd = {buffers:[]}
		let sceneNumber
		var rsp
		var self = this

		switch (action.action) {
			case 'mute_input':    MSB = 0; LSB = 0;        break
			case 'mute_lr':       MSB = 0; LSB = 0x44;     break
			case 'mute_aux':      MSB = 0; LSB = 0x45;     break
			case 'mute_group':    MSB = 0; LSB = 0x30;     break
			case 'mute_matrix':   MSB = 0; LSB = 0x55;     break
			case 'mute_fx_send':  MSB = 0; LSB = 0x51;     break
			case 'mute_fx_return':MSB = 0; LSB = 0x3C;     break
			case 'mute_dca':      MSB = 0x02; LSB = 0;     break
			case 'mute_mutegroup':MSB = 0x04; LSB = 0;     break

			case 'key_soft':
				let softKey = parseInt(opt.softKey)
				let keyValu = (opt.pressedsk == '0' || opt.pressedsk == '1') ? true : false
				let tch = parseInt((keyValu ? '0x9' : '0x8') + (mch).toString(16))
				cmd.buffers = [ Buffer.from([ tch, 0x30 + softKey, keyValu ? 0x7F : 0 ]) ]
				break

			case 'ch_to_mix':
				cmd.buffers = this.setRouting(opt.inputChannel, opt.mixAssign, opt.mixActive, this.mixCount, [0x60,0x60], [0,0x44])
				break

			case 'ch_to_grp':
				cmd.buffers = this.setRouting(opt.inputChannel, opt.grpAssign, opt.grpActive, this.grpCount, [0,0x66], [0,0x74])
				break

			case 'grp_to_mix':
				cmd.buffers = this.setRouting(opt.inputGrp, opt.mixAssign, opt.mixActive, this.mixCount, [0x60,0x65], [0x30,0x04])
				break

			case 'gfxr_to_grp':
				cmd.buffers = this.setRouting(opt.inputFxr, opt.grpAssign, opt.grpActive, this.grpCount, [0,0x6B], [0,0x34])
				break

			case 'ch_to_fxs':
				cmd.buffers = this.setRouting(opt.inputChannel, opt.fxsAssign, opt.fxsActive, this.fxsCount, [0,0x6C], [0,0x14])
				break

			case 'grp_to_fxs':
				cmd.buffers = this.setRouting(opt.inputGrp, opt.fxsAssign, opt.fxsActive, this.fxsCount, [0,0x6D], [0,0x54])
				break

			case 'fxr_to_fxs':
				cmd.buffers = this.setRouting(opt.inputFxr, opt.fxsAssign, opt.fxsActive, this.fxsCount, [0,0x6E], [0,0x04])
				break

			case 'mix_to_mtx':
				cmd.buffers = this.setRouting(opt.inputMix, opt.mtxAssign, opt.mtxActive, this.mtxCount, [0x6E,0x6E], [0x24,0x27])
				break

			case 'grp_to_mtx':
				cmd.buffers = this.setRouting(opt.inputGrp, opt.mtxAssign, opt.mtxActive, this.mtxCount, [0,0x6E], [0,0x4B])
				break
			/* Level */
			case 'chlev_to_mix':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.leveldb, [0x40,0x40], [0,0x44])
				break

			case 'grplev_to_mix':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.leveldb, [0x40,0x45], [0x30,0x04])
				break

			case 'fxrlev_to_mix':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.leveldb, [0x40,0x46], [0x3C,0x14])
				break

			case 'fxrlev_to_grp':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.grpCount, opt.leveldb, [0,0x4B], [0,0x34])
				break

			case 'chlev_to_fxs':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.leveldb, [0,0x4C], [0,0x14])
				break

			case 'grplev_to_fxs':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.leveldb, [0,0x4D], [0,0x54])
				break

			case 'fxrlev_to_fxs':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.leveldb, [0,0x4E], [0,0x04])
				break

			case 'mixlev_to_mtx':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mtxCount, opt.leveldb, [0x4E,0x4E], [0x24,0x27])
				break

			case 'grplev_to_mtx':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mtxCount, opt.leveldb, [0,0x4E], [0,0x4B])
				break

			case 'level_to_output':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, 99, 0, opt.leveldb, [0x4F,0], [0,0])
				break
			/* Pan Balance */
			case 'chpan_to_mix':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.leveldb, [0x50,0x50], [0,0x44], 'PanBalance')
				break

			case 'grppan_to_mix':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.leveldb, [0x50,0x55], [0x30,0x04], 'PanBalance')
				break

			case 'fxrpan_to_mix':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.leveldb, [0x50,0x56], [0x3C,0x14], 'PanBalance')
				break

			case 'fxrpan_to_grp':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.grpCount, opt.leveldb, [0,0x5B], [0,0x34], 'PanBalance')
				break

			case 'mixpan_to_mtx':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mtxCount, opt.leveldb, [0x5E,0x5E], [0x24,0x27], 'PanBalance')
				break;

			case 'grppan_to_mtx':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mtxCount, opt.leveldb, [0,0x5E], [0,0x4B], 'PanBalance')
				break

			case 'pan_to_output':
				cmd.buffers = this.setLevel(opt.input, 99, 0, opt.leveldb, [0x5F,0], [0,0], 'PanBalance')
				break

			case 'scene_step':
				sceneNumber = this.setScene(opt.scene)
				cmd.buffers = [ Buffer.from([ mch, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]
				break

			case 'current_scene':
			case 'scene_recall':
				sceneNumber = opt.scene - 1
				cmd.buffers = [ Buffer.from([ mch, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]
				break
		}

		if (cmd.buffers.length == 0) {
			if (action.action.slice(0 ,4) == 'mute') {
				if ( parseInt(opt.mute) > 0 ) {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = parseInt(opt.mute) == 1 ? true : false
				} else {
					this.fdbState['mute_' + MSB + '.' + (LSB + strip)] = this.fdbState['mute_' + MSB + '.' + (LSB + strip)] == true ? false : true
				}

				this.checkFeedbacks(action.action)
				cmd.buffers = [ Buffer.from([ mch, 0x63, MSB, mch, 0x62, strip + LSB, mch, 0x06, 0x00, mch, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
			}
		}

		for (let i = 0; i < cmd.buffers.length; i++) {
			this.sendSocket(cmd.buffers[i])
			this.sleep(200)
		}
	}

	getRemoteLevel() {
		var self = this
		var buff = []
		let rsp

		for (let i = 0; i < self.chCount; i++) {
			let tmp = self.CHOICES_MIX
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x40], [0,0x44])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.grpCount; i++) {
			let tmp = self.CHOICES_MIX
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x45], [0x30,0x04])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.fxrCount; i++) {
			let tmp = self.CHOICES_MIX
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x46], [0x3C,0x14])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.fxrCount; i++) {
			let tmp = self.CHOICES_GRP
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.grpCount, [0,0x4B], [0,0x34])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.chCount; i++) {
			let tmp = self.CHOICES_FXS
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.fxsCount, [0,0x4C], [0,0x14])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.grpCount; i++) {
			let tmp = self.CHOICES_FXS
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.fxsCount, [0,0x4D], [0,0x54])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.fxrCount; i++) {
			let tmp = self.CHOICES_FXS
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.fxsCount, [0,0x4E], [0,0x04])
				buff.push(rsp['buffer'][0])
			}
		}

		let tmp = self.CHOICES_MTX
		for ( let j = 0; j < tmp.length; j++ ) {
			rsp = self.getLevel(0, tmp[j].id, self.mtxCount, [0,0x4E], [0,0x24])
			buff.push(rsp['buffer'][0])
		}

		for (let i = 0; i < self.mixCount; i++) {
			let tmp = self.CHOICES_MTX
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.mtxCount, [0,0x4E], [0,0x27])
				buff.push(rsp['buffer'][0])
			}
		}

		for (let i = 0; i < self.grpCount; i++) {
			let tmp = self.CHOICES_MTX
			for ( let j = 0; j < tmp.length; j++ ) {
				rsp = self.getLevel(i, tmp[j].id, self.mtxCount, [0,0x4E], [0,0x4B])
				buff.push(rsp['buffer'][0])
			}
		}

		tmp = []
		tmp.push({ label: `LR`, id: 0 })
		for (let i = 0; i < this.mixCount; i++) {
			tmp.push({ label: `AUX ${i + 1}`, id: i + 1 })
		}
		for (let i = 0; i < this.fxsCount; i++) {
			tmp.push({ label: `FX SEND ${i + 1}`, id: i + 1 + this.mixCount })
		}
		for (let i = 0; i < this.mtxCount; i++) {
			tmp.push({ label: `MATRIX ${i + 1}`, id: i + 1 + this.mixCount + this.fxsCount })
		}
		for ( let j = 0; j < tmp.length; j++ ) {
			rsp = self.getLevel(tmp[j].id, 99, 0, [0x4F,0], [0,0])
			buff.push(rsp['buffer'][0])
		}

		tmp = this.CHOICES_DCA
		for ( let j = 0; j < tmp.length; j++ ) {
			rsp = self.getLevel(tmp[j].id, 99, 0, [0x4F,0], [0x20,0])
			buff.push(rsp['buffer'][0])
		}

		if ( buff.length > 0 && self.midiSocket !== undefined ) {
			let ctr = 0
			for ( let i = 0; i < buff.length; i++ ) {
				self.sendSocket(buff[i])
				ctr++
				if (this.config.status == 'delay') {
					if (ctr == 20) {
						ctr = 0
						this.sleep(300)
					}
				}
			}
		}

		self.subscribeActions('chpan_to_mix')
		if (this.config.status == 'delay') {
			this.sleep(300)
		}
		self.subscribeActions('grppan_to_mix')
		if (this.config.status == 'delay') {
			this.sleep(300)
		}
		self.subscribeActions('fxrpan_to_mix')
		if (this.config.status == 'delay') {
			this.sleep(300)
		}
		self.subscribeActions('fxrpan_to_grp')
		if (this.config.status == 'delay') {
			this.sleep(300)
		}
		self.subscribeActions('mixpan_to_mtx')
		if (this.config.status == 'delay') {
			this.sleep(300)
		}
		self.subscribeActions('grppan_to_mtx')
		if (this.config.status == 'delay') {
			this.sleep(300)
		}
		self.subscribeActions('pan_to_output')
	}

	getRemoteStatus(act) {
		chks = true;
		for (let key in callback[act]) {
			let mblb = key.toString().split(".")
			this.sendSocket(Buffer.from([ mch, 0x63, mblb[0], mch, 0x62, mblb[1], mch, 0x60, 0x7F ]))
		}
	}

	getRemoteValue(data) {
		var self = this

		if (typeof data == 'object') {
			var dt, j

			for ( let b = 0; b < data.length; b++) {
				/* Schene Change */
				if ( data[b] == mch && data[b+1] == 0 ) {
					dt = data.slice(b, (b + 5))
					var csc = (dt[4] + dt[2] * 127);
					self.setVariable('currentScene', csc + 1)
					this.log('debug', `Scene Received : ${dt} from ${self.config.host}`)
				}

				/* Other */
				if ( data[b] == mch && data[b+1] == 99 ) {
					dt = data.slice(b, (b + 12))

					if ( dt.length == 12) {
						var MSB = dt[2]
						var LSB = dt[5]
						var VC  = dt[8]
						var VF  = dt[11]

						/* Mute */
						if ( MSB == 0 || MSB == 2 || MSB == 4 ) {
							this.fdbState['mute_' + MSB + '.' + LSB] = VF == 1 ? true : false
							self.checkFeedbacks( callback['mute'][MSB+'.'+LSB][0] )
							this.log('debug', `Mute Received : ${dt} from ${self.config.host}`)
						}

						/* Fader Level */
						if ( MSB >= 0x40 && MSB <= 0x4F ) {
							var ost = false
							self.getVariable('level_' + MSB +'.'+ LSB, function(res) {
								if (res !== undefined) {
									self.lastValue['level_' + MSB +'.'+ LSB] = res
									ost = true
								}
							})

							let db = self.decTodB(VC, VF)
							self.setVariable('level_' + MSB +'.'+ LSB, db)

							if (! ost) {
								self.lastValue['level_' + MSB +'.'+ LSB] = db
							}

							this.log('debug', `Fader Received : ${dt} from ${self.config.host}`)
						}

						/* Pan Level */
						if ( MSB >= 0x50 && MSB <= 0x5E ) {
							let db = self.decTodB(VC, VF, 'PanBalance')
							self.setVariable('pan_' + MSB +'.'+ LSB, db)
							this.log('debug', `Pan Received : ${dt} from ${self.config.host}`)
						}
					}
				}
			}
		}
	}

	config_fields() {
		this.CHOICES_INPUT_CHANNEL = []
		for (let i = 0; i < 48; i++) {
			this.CHOICES_INPUT_CHANNEL.push({ label: `CH ${i + 1}`, id: i })
		}

		return [
			{
				type:  'text',
				id:    'info',
				width: 12,
				label: 'Information',
				value: 'This module is for the Allen & Heath SQ',
			},{
				type:    'textinput',
				id:      'host',
				label:   'Target IP',
				width:   6,
				default: '192.168.0.5',
				regex:   this.REGEX_IP,
			},{
				type:    'dropdown',
				id:      'model',
				label:   'Console Type',
				width:   6,
				default: 'SQ5',
				choices: [
					{id: 'SQ5', label: 'SQ 5'},
					{id: 'SQ6', label: 'SQ 6'},
					{id: 'SQ7', label: 'SQ 7'}
				],
			},{
				type:    'dropdown',
				id:      'level',
				label:   'NRPN Fader Law',
				width:   6,
				default: 'LinearTaper',
				choices: [
					{id: 'LinearTaper', label: 'Linear Taper'},
					{id: 'AudioTaper', label: 'Audio Taper'}
				],
			},{
				type:    'dropdown',
				label:   'Default talkback input channel',
				id:      'talkback',
				width:   6,
				default: '0',
				choices: this.CHOICES_INPUT_CHANNEL,
				minChoicesForSearch: 0,
			},{
				type:    'textinput',
				id:      'midich',
				label:   'MIDI channel',
				width:   6,
				min: 1,
				max: 16,
				default: 1,
			},{
				type:    'dropdown',
				id:      'status',
				label:   'Retrieve console status',
				width:   6,
				default: 'full',
				choices: [
					{id: 'full', label: 'Fully at startup'},
					{id: 'delay', label: 'Delayed at startup'},
					{id: 'nosts', label: 'Not at startup'}
				],
			}
		]
	}

	destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}

		this.log('debug', `destroyed ${this.id}`)
	}

	init() {
		this.updateConfig(this.config)
		this.setVariable('currentScene', 1)
	}

	init_tcp() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
			delete this.midiSocket
		}

		if (this.config.host) {
			this.midiSocket = new tcp(this.config.host, MIDI)

			this.midiSocket.on('status_change', (status, message) => {
				this.status(status, message)
			});

			this.midiSocket.on('error', (err) => {
				this.log('error', "MIDI error: " + err.message)
			});

			this.midiSocket.on('connect', () => {
				this.log('debug', `MIDI Connected to ${this.config.host}`)
				if (this.config.status != 'nosts') {
					this.getRemoteStatus('mute')
					this.sleep(300);
					this.getRemoteLevel()

					if (this.config.status == 'fully') {
						var ij = 1
						var gInt = setInterval(
							() => {
								this.getRemoteLevel()
								if ( ij == 2 ) {
									clearInterval(gInt)
								}
								ij++
							}, 3000)
					}
				}
			})

			this.midiSocket.on('data', (data) => {
				this.getRemoteValue(JSON.parse(JSON.stringify(data))['data'])
			})
		}
	}

	updateConfig(config) {
		this.config = config
		mch = parseInt('0xB' + (this.config.midich - 1).toString(16))
		this.actions()
		this.variables()
		this.feedbacks()
		this.presets()
		this.init_tcp()
	}
}

exports = module.exports = instance
