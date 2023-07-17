const { InstanceStatus, TCPHelper } = require('@companion-module/base');

const level      = require('./level.json')
const sqconfig   = require('./sqconfig.json')
const callback = require('./callback.json');

const MIDI = 51325;

module.exports = {
	setRouting: function(ch, mix, ac, mc, oMB, oLB) {
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
	
			routingCmds.push(Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, 0x06, 0, this.mch, 0x26, ac ? 1 : 0]))
		}
	
		return routingCmds
	},
	
	setLevel: function(ch, mx, ct, lv, oMB, oLB, cnfg = this.config.level) {
		var self = this
		let levelCmds = []
		let tmp
		let MSB
		let LSB
	
		if (lv < 998 || ['L','R','C'].indexOf(lv.toString().slice(0,1)) != -1 || lv == '-inf') {
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
	
		if (lv < 998 || ['L','R','C'].indexOf(lv.toString().slice(0,1)) != -1 || lv == '-inf') {
			levelCmds.push( Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, 0x06, VC, this.mch, 0x26, VF ]) )
		}
		else {
			if (lv == 1000) {
				/* Last dB value */
				let rtn = self.dBToDec(self.lastValue['level_' + MSB +'.'+ LSB], cnfg)
				VC = rtn[0]
				VF = rtn[1]
				lv = 997
	
				levelCmds.push( Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, 0x06, VC, this.mch, 0x26, VF ]) )
			}
			else if (lv == 1001) { //+3dB
			}
			else if (lv == 1002) { //+6dB
			}
			else if (lv == 1003) { //-3dB
			}
			else if (lv == 1004) { //-6dB
			}
			else {
				/* Increment */
				levelCmds.push( Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, lv == 998 ? 0x60 : 0x61, 0x00 ]) )
			}
		}
	
		// Retrive value after set command
		levelCmds.push( Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, 0x60, 0x7F ]) )
	
		return levelCmds
	},
	
	setScene: async function(val) {
		var sq = sqconfig['config'][this.config.model]
		var scn
		var res = await this.getVariableValue('currentScene');
		
		scn = parseInt(res) - 1 + val
		if (scn < 0) {
			scn = 0
		}
		if (scn > sq['sceneCount']) {
			scn = sq['sceneCount']
		}
	
		return scn
	},
	
	getLevel: function(ch, mx, ct, oMB, oLB) {
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
			buffer:     [ Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, 0x60, 0x7F ]) ],
			channel:    [MSB,LSB]
		}
	},
	
	fadeLevel: async function(fd, ch, mx, ct, lv, oMB, oLB, cnfg = this.config.level) {
		var self = this
	
		if (fd == 0) {
			return self.setLevel(ch, mx, ct, lv, oMB, oLB, cnfg)
		} else {
			if (this.midiSocket !== undefined) {
				var setFade = (MSB, LSB, lv) => {
					let val = self.dBToDec(lv)
					let VC = val[0];
					let VF = val[1];
					self.midiSocket.send(Buffer.from([ this.mch, 0x63, MSB, this.mch, 0x62, LSB, this.mch, 0x06, VC, this.mch, 0x26, VF ]))
	
					lv = parseFloat(lv).toFixed(1)
					if (lv < -89) {
						lv = '-inf'
					}
					let variableObj = {};
					variableObj['level_' + MSB +'.'+ LSB] = lv;
					self.setVariableValues(variableObj);
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
				var res = await self.getVariableValue('level_' + MSB +'.'+ LSB);
				str = res
	
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
	},
	
	sendSocket: function(buff) {
		if (this.midiSocket !== undefined && this.midiSocket.isConnected) {
			this.log('debug', `Sending : ${JSON.parse(JSON.stringify(buff))['data']} from ${this.config.host}`)
			this.midiSocket.send(buff)
		}
	},	
	
	getRemoteLevel: function() {
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
	},
	
	getRemoteStatus: function(act) {
		chks = true;
		for (let key in callback[act]) {
			let mblb = key.toString().split(".")
			this.sendSocket(Buffer.from([ this.mch, 0x63, mblb[0], this.mch, 0x62, mblb[1], this.mch, 0x60, 0x7F ]))
		}
	},
	
	getRemoteValue: async function(data) {
		var self = this
	
		if (typeof data == 'object') {
			var dt, j
	
			for ( let b = 0; b < data.length; b++) {
				/* Schene Change */
				if ( data[b] == this.mch && data[b+1] == 0 ) {
					dt = data.slice(b, (b + 5))
					var csc = (dt[4] + dt[2] * 127);
					let variableObj = {}
					variableObj['currentScene'] = csc + 1
					self.setVariableValues(variableObj);
					this.log('debug', `Scene Received : ${dt} from ${self.config.host}`)
				}
	
				/* Other */
				if ( data[b] == this.mch && data[b+1] == 99 ) {
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
							var res = await self.getVariableValue('level_' + MSB +'.'+ LSB)
							if (res !== undefined) {
								self.lastValue['level_' + MSB +'.'+ LSB] = res
								ost = true
							}
	
							let db = self.decTodB(VC, VF)
							let variableObj = {}
							variableObj['level_' + MSB +'.'+ LSB] = db
							self.setVariableValues(variableObj);
	
							if (! ost) {
								self.lastValue['level_' + MSB +'.'+ LSB] = db
							}
	
							this.log('debug', `Fader Received : ${dt} from ${self.config.host}`)
						}
	
						/* Pan Level */
						if ( MSB >= 0x50 && MSB <= 0x5E ) {
							let db = self.decTodB(VC, VF, 'PanBalance')
							let variableObj = {};
							variableObj['pan_' + MSB +'.'+ LSB] = db
							self.setVariableValues(variableObj);
							this.log('debug', `Pan Received : ${dt} from ${self.config.host}`)
						}
					}
				}
			}
		}
	},	
	
	initTCP: function() {
		let self = this;

		if (self.midiSocket !== undefined) {
			self.midiSocket.destroy()
			delete self.midiSocket
		}
	
		if (self.config.host) {
			self.midiSocket = new TCPHelper(this.config.host, MIDI)
	
			self.midiSocket.on('error', (err) => {
				self.log('error', "Error: " + err.message)
			});
	
			self.midiSocket.on('connect', () => {
				self.log('debug', `Connected to ${self.config.host}`)
				self.updateStatus(InstanceStatus.Ok);
				if (self.config.status != 'nosts') {
					self.getRemoteStatus('mute')
					self.sleep(300);
					self.getRemoteLevel()
	
					if (self.config.status == 'full') {
						var gInt = setTimeout(
							() => {
								self.getRemoteLevel()
							}, 4000)
					}
				}
			})
	
			self.midiSocket.on('data', (data) => {
				self.getRemoteValue(JSON.parse(JSON.stringify(data))['data'])
			})
		}
	},

	//new send command
	sendBuffers: async function(buffers) {
		let self = this;

		function sleepSend(ms) {
			return new Promise((resolve) => {
			  setTimeout(resolve, ms);
			});
		  }

		for (let i = 0; i < buffers.length; i++) {
			self.sendSocket(buffers[i])
			await sleepSend(200)
		}
	}
}