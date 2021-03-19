/**
 *
 * Companion instance class for the Allen & Heath SQ.
 * Version 1.3.3
 * Author Max Kiusso <max@kiusso.net>
 *
 * Based on allenheath-dlive module by Andrew Broughton
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

let tcp             = require('../../tcp')
let instance_skel   = require('../../instance_skel')
let actions         = require('./actions')
let feedbacks       = require('./feedbacks')
let variables       = require('./variables')
let presets         = require('./presets')
let upgrade         = require('./upgrade')


const level         = require('./level.json')
const callback      = require('./callback.json')
const sqconfig      = require('./sqconfig.json')
const MIDI          = 51325
var chks            = false

class instance extends instance_skel {
	constructor(system, id, config) {
		super(system, id, config)

		Object.assign(this, {
			...variables,
			...actions,
			...feedbacks,
			...presets,
			...upgrade,
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

			routingCmds.push(Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, LSB, 0xB0, 0x06, 0, 0xB0, 0x26, ac ? 1 : 0]))
		}

		return routingCmds
	}

	setLevel(ch, mx, ct, lv, oMB, oLB, cnfg = this.config.level) {
		var self = this
		let routingCmds = []
		let tmp
		let MSB
		let LSB

		if (lv < 998) {
			var VC = level[cnfg][lv][1]
			var VF = level[cnfg][lv][2]
		}

		if (mx == 99) {
			MSB = oMB[0]
			LSB = parseInt(oLB[0]) + parseInt(ch)
		} else {
			tmp = parseInt(ch * ct + oLB[1]) + parseInt(mx)
			MSB = oMB[1] + ((tmp >> 7) & 0x0F)
			LSB = tmp & 0x7F
		}

		if (lv < 998) {
			routingCmds.push( Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, LSB, 0xB0, 0x06, VC, 0xB0, 0x26, VF ]) )
		} else {
			if (lv == 1000) {
				/* Last dB value */
				let rtn = self.getDBHex(self.lastValue['level_' + MSB +'.'+ LSB])
				VC = rtn[0]
				VF = rtn[1]
				lv = 997

				routingCmds.push( Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, LSB, 0xB0, 0x06, VC, 0xB0, 0x26, VF ]) )
			} else {
				/* Increment */
				routingCmds.push( Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, LSB, 0xB0, lv == 998 ? 0x60 : 0x61, 0x00 ]) )
			}
		}

		self.getVariable('level_' + MSB +'.'+ LSB, function(res) {
			if (res !== undefined) {
				var txt
				let db = lv < 998 ? self.getDBValue(VC.toString(16),('0'+VF.toString(16)).slice(-2)) : (lv == 998 ? 1 : -1) + (res == '-inf' ? -89 : res)
				if (db <= -89) db = '-inf'
				if (db > 10) db = 10

				self.setVariable('level_' + MSB +'.'+ LSB, db)
			}
		})

		return routingCmds
	}

	setScene(val) {
		var sq = sqconfig['config'][this.config.model]
		var scn
		this.getVariable('currentScene', function(res) {
			scn = parseInt(res) - 1 + val
			if (scn < 0) scn = 0
			if (scn > sq['sceneCount']) scn = sq['sceneCount']
		})

		return scn
	}

	getDBValue(vc, vf) {
		var cnfg = this.config.level
		if ( cnfg == 'LinearTaper' ) {
			let hx = `${vc}${vf}`
			let dc = parseInt(parseInt(hx, 16) / 127)
			let sb = (258 - dc) / 2
			let el = (258 - dc) % 2
			let pt = parseInt(sb / 13)
			if (el = 0) pt--

			return 10 - (parseInt(sb) + pt)
		} else {
			var rt = -89
			let hx = parseInt(parseInt(`${vc}${vf}`, 16) / 127)
			for ( let i = 0; i < level[cnfg].length; i++ ) {
				let j  = i + 1 < level[cnfg].length ? i + 1 : 0
				let lc = level[cnfg][i][1].substr(2,2)
				let lf = level[cnfg][i][2].substr(2,2)
				let vx = parseInt(parseInt(`${lc}${lf}`, 16) / 127)

				if ( (j == 0 && hx > vx) || (j == 1 && hx < vx) || (hx == vx) ) {
					rt = level[cnfg][i][0]
					break
				} else if ( j > 0 ) {
					let lc = level[cnfg][j][1].substr(2,2)
					let lf = level[cnfg][j][2].substr(2,2)
					let zx = parseInt(parseInt(`${lc}${lf}`, 16) / 127)

					if ( hx > vx && hx < zx ) {
						if ( hx - vx <= zx - hx ) {
							rt = level[cnfg][i][0]
						} else {
							rt = level[cnfg][j][0]
						}

						break
					}
				}
			}

			return rt == '-inf' ? -89 : parseInt(rt)
		}
	}

	getDBHex(rc) {
		let lv = level[this.config.level]
		let rt, zx

		for (let i = 0; i < lv.length; i++) {
			let j = i + 1 < lv.length ? i + 1 : 0
			let db = lv[i][0]
			if (db == "-inf") db = -100
			db = parseInt(db)

			let va = parseInt(lv[i][1], 16)
			let vb = parseInt(lv[i][2], 16)
			let vl = [va, vb]

			if (j == 0) {
				rt = vl
				break
			} else if (j > 0) {
				zx = lv[j][0]
				if (zx == "-inf") zx = -100
				zx = parseInt(zx)

				if (db <= rc && rc <= zx) {
					if (rc - db <= zx - rc) {
						rt = vl
					} else {
						let xa = parseInt(lv[j][1], 16)
						let xb = parseInt(lv[j][2], 16)
						rt = [xa, xb]
					}

					break
				}
			}
		}

		return rt
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
			buffer:     [ Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, LSB, 0xB0, 0x60, 0x7F ]) ],
			channel:    [MSB,LSB]
		}
	}

	sleep(ml) {
		const dt = Date.now()
		let cd = null
		do {
			cd = Date.now()
		} while (cd - dt < ml)
	}

	fadeLevel(fd, ch, mx, ct, lv, oMB, oLB, cnfg = this.config.level) {
		var self = this
		if (fd == 0 || fd === undefined) {
			return self.setLevel(ch, mx, ct, lv, oMB, oLB, cnfg)
		} else {
			if (this.midiSocket !== undefined) {
				let setFade = (MSB, LSB, lv) => {
					let val = lv.toString(16)
					let VC = parseInt(val.substr(0,2), 16);
					let VF = parseInt(val.substr(2,2), 16);
					self.midiSocket.write(Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, LSB, 0xB0, 0x06, VC, 0xB0, 0x26, VF ]))
				}

				let rm = self.getLevel(ch, mx, ct, oMB, oLB)
				var MSB = rm.channel[0]
				var LSB = rm.channel[1]
				let VC
				let VF

				if (lv < 998) {
					VC = parseInt(level[cnfg][lv][1])
					VF = parseInt(level[cnfg][lv][2])
				} else {
					if (lv == 1000) {
						/* Last dB value */
						let db = self.lastValue['level_' + MSB +'.'+ LSB]
						if (db == '-inf') db = -100;
						let rtn = self.getDBHex(db)
						VC = rtn[0]
						VF = rtn[1]
					} else {
						return self.setLevel(ch, mx, ct, lv, oMB, oLB, cnfg)
					}
				}

				var end = parseInt(VC.toString(16) + VF.toString(16), 16)
				var rnd = end;
				if ( end == 0 ) end = 18476

				var str
				self.getVariable('level_' + MSB +'.'+ LSB, function(res) {
					if (res == '-inf') res = -100
					let rtn = self.getDBHex(res)
					str = parseInt(rtn[0].toString(16) + rtn[1].toString(16), 16)
				})
				var rtr = str
				if ( str == 0 ) str = 18476

				let step = parseInt(Math.abs(str - end) / (fd * 50))
				str = str - (Math.abs(str - end) - (step * fd * 50))

				if (str > end) {
					for (let k = str; k >= end; k = k - step) {
						setFade(MSB, LSB, k)
						self.sleep(20)
					}
					self.sleep(20)
					setFade(MSB, LSB, rnd)
					end = rnd
				} else {
					setFade(MSB, LSB, rtr)
					self.sleep(20)
					for (let k = str; k <= end; k = k + step) {
						setFade(MSB, LSB, k)
						self.sleep(20)
					}
				}

				let val = end.toString(16)
				VC = val.substr(0,2);
				VF = val.substr(2,2);

				let db = self.getDBValue(VC,VF)
				if (db <= -89) db = '-inf'
				if (db > 10) db = 10

				self.setVariable('level_' + MSB +'.'+ LSB, db)
			}

			return [];
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
				cmd.buffers = [ Buffer.from([ keyValu ? 0x90 : 0x80, 0x30 + softKey, keyValu ? 0x7F : 0 ]) ]
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
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.level, [0x40,0x40], [0,0x44])
				break

			case 'grplev_to_mix':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.level, [0x40,0x45], [0x30,0x04])
				break

			case 'fxrlev_to_mix':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mixCount, opt.level, [0x40,0x46], [0x3C,0x14])
				break

			case 'fxrlev_to_grp':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.grpCount, opt.level, [0,0x4B], [0,0x34])
				break

			case 'chlev_to_fxs':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.level, [0,0x4C], [0,0x14])
				break

			case 'grplev_to_fxs':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.level, [0,0x4D], [0,0x54])
				break

			case 'fxrlev_to_fxs':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.fxsCount, opt.level, [0,0x4E], [0,0x04])
				break

			case 'mixlev_to_mtx':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mtxCount, opt.level, [0x4E,0x4E], [0x24,0x27])
				break

			case 'grplev_to_mtx':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, opt.assign, this.mtxCount, opt.level, [0,0x4E], [0,0x4B])
				break

			case 'level_to_output':
				cmd.buffers = this.fadeLevel(opt.fade, opt.input, 99, 0, opt.level, [0x4F,0], [0,0])
				break
			/* Pan Balance */
			case 'chpan_to_mix':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.level, [0x50,0x50], [0,0x44], 'PanBalance')
				break

			case 'grppan_to_mix':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.level, [0x50,0x55], [0x30,0x04], 'PanBalance')
				break

			case 'fxrpan_to_mix':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mixCount, opt.level, [0x50,0x56], [0x3C,0x14], 'PanBalance')
				break

			case 'fxrpan_to_grp':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.grpCount, opt.level, [0,0x5B], [0,0x34], 'PanBalance')
				break

			case 'mixpan_to_mtx':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mtxCount, opt.level, [0x5E,0x5E], [0x24,0x27], 'PanBalance')
				break;

			case 'grppan_to_mtx':
				cmd.buffers = this.setLevel(opt.input, opt.assign, this.mtxCount, opt.level, [0,0x5E], [0,0x4B], 'PanBalance')
				break

			case 'pan_to_output':
				cmd.buffers = this.setLevel(opt.input, 99, 0, opt.level, [0x5F,0], [0,0], 'PanBalance')
				break

			case 'scene_step':
				sceneNumber = this.setScene(opt.scene)
				cmd.buffers = [ Buffer.from([ 0xB0, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]
				break

			case 'current_scene':
			case 'scene_recall':
				sceneNumber = opt.scene - 1
				cmd.buffers = [ Buffer.from([ 0xB0, 0, (sceneNumber >> 7) & 0x0F, 0xC0, sceneNumber & 0x7F ]) ]
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
				cmd.buffers = [ Buffer.from([ 0xB0, 0x63, MSB, 0xB0, 0x62, strip + LSB, 0xB0, 0x06, 0x00, 0xB0, 0x26, this.fdbState['mute_' + MSB + '.' + (LSB + strip)] ]) ]
			}
		}

		for (let i = 0; i < cmd.buffers.length; i++) {
			if (this.midiSocket !== undefined) {
				this.midiSocket.write(cmd.buffers[i])
			}
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
			for ( let i = 0; i < buff.length; i++ ) {
				self.midiSocket.write(buff[i])
			}
		}
	}

	getRemoteStatus(act) {
		chks = true;
		for (let key in callback[act]) {
			let mblb = key.toString().split(".")
			this.midiSocket.write(Buffer.from([ 0xB0, 0x63, mblb[0], 0xB0, 0x62, mblb[1], 0xB0, 0x60, 0x7F ]))
		}
	}

	getRemoteValue(data) {
		var self = this

		if (typeof data == 'object') {
			var dt, j

			for ( let b = 0; b < data.length; b++) {
				/* Schene Change */
				if ( data[b] == 176 && data[b+1] == 0 ) {
					dt = data.slice(b, (b + 5))
					var csc = (dt[4] + dt[2] * 127);
					self.setVariable('currentScene', csc + 1)
				}

				/* Other */
				if ( data[b] == 176 && data[b+1] == 99 ) {
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
						}

						/* Level */
						if ( MSB >= 0x40 && MSB <= 0x4F ) {
							var ost = false
							self.getVariable('level_' + MSB +'.'+ LSB, function(res) {
								if (res !== undefined) {
									self.lastValue['level_' + MSB +'.'+ LSB] = res
									ost = true
								}
							})

							let db = self.getDBValue(VC.toString(16),('0'+VF.toString(16)).slice(-2))
							if (db <= -89) db = '-inf'
							self.setVariable('level_' + MSB +'.'+ LSB, db)

							if (! ost) {
								self.lastValue['level_' + MSB +'.'+ LSB] = db
							}
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
				this.getRemoteStatus('mute')
				this.getRemoteLevel()

				var ij = 1
				var gInt = setInterval(
					() => {
						this.getRemoteLevel()
						if ( ij == 2 ) clearInterval(gInt)
						ij++
					}, 3000)
			})

			this.midiSocket.on('data', (data) => {
				this.getRemoteValue(JSON.parse(JSON.stringify(data))['data'])
			})
		}
	}

	updateConfig(config) {
		this.config = config
		this.actions()
		this.variables()
		this.feedbacks()
		this.presets()
		this.init_tcp()
	}
}

exports = module.exports = instance
