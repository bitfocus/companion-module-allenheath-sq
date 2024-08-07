import { computeEitherParameters } from './mixer/parameters.js'
import { sleep } from './utils/sleep.js'

export default {
	setLevel: async function (ch, mx, ct, lv, oMB, oLB) {
		var self = this

		/** @type {import('./mixer/mixer.js').Mixer} */
		const mixer = this.mixer
		const cnfg = mixer.faderLaw

		let levelCmds = []

		const { MSB, LSB } = computeEitherParameters(ch, mx, ct, { MSB: oMB[1], LSB: oLB[1] }, { MSB: oMB[0], LSB: oLB[0] })

		console.log('old lv: ' + lv)

		const levelKey = `level_${MSB}.${LSB}`

		if (lv.toString().indexOf('step') > -1) {
			let currentLevel = await self.getVariableValue(levelKey)
			if (currentLevel == '-inf') {
				currentLevel = -90
			} else {
				currentLevel = parseFloat(currentLevel)
			}

			console.log('current level: ' + currentLevel)
			let newLevel = currentLevel

			//replace this with a switch case

			switch (lv) {
				case 'step+0.1':
					newLevel += 0.1
					break
				case 'step+1':
					newLevel += 1
					break
				case 'step+3':
					newLevel += 3
					break
				case 'step+6':
					newLevel += 6
					break
				case 'step-0.1':
					newLevel -= 0.1
					break
				case 'step-3':
					newLevel -= 3
					break
				case 'step-6':
					newLevel -= 6
					break
				case 'step-1':
					newLevel -= 1
					break
				default:
					break
			}

			//make sure the new level is within the bounds of the mixer
			if (newLevel < -90) {
				newLevel = -90
			} else if (newLevel > 10) {
				newLevel = 10
			}

			lv = newLevel.toFixed(1)
		}

		console.log('new level: ' + lv)

		//ensure it's a number
		lv = parseFloat(lv)

		self.setVariableValues({
			[levelKey]: lv.toFixed(1),
		})

		if (lv < 998 || ['L', 'R', 'C'].indexOf(lv.toString().slice(0, 1)) != -1 || lv == '-inf') {
			var [VC, VF] = mixer.nrpnDataFromLevel(lv)
		}

		const midi = mixer.midi

		if (lv < 998 || ['L', 'R', 'C'].indexOf(lv.toString().slice(0, 1)) != -1 || lv == '-inf') {
			levelCmds.push(midi.nrpnData(MSB, LSB, VC, VF))
		} else {
			if (lv == 1000) {
				/* Last dB value */
				let rtn = mixer.nrpnDataFromLevel(mixer.lastValue[levelKey])
				VC = rtn[0]
				VF = rtn[1]
				lv = 997

				levelCmds.push(midi.nrpnData(MSB, LSB, VC, VF))
			}
			//else {
			/* Increment +1 */
			//	levelCmds.push(
			//		lv == 998
			//		? midi.nrpnIncrement(MSB, LSB, 0)
			//		: midi.nrpnDecrement(MSB, LSB, 0)
			//	)
			//}
		}

		// Retrive value after set command
		levelCmds.push(mixer.getNRPNValue(MSB, LSB))

		return levelCmds
	},

	getLevel: function (ch, mx, ct, oMB, oLB) {
		const { MSB, LSB } = computeEitherParameters(ch, mx, ct, { MSB: oMB[1], LSB: oLB[1] }, { MSB: oMB[0], LSB: oLB[0] })

		/** @type {import('./mixer/mixer.js').Mixer} */
		const mixer = this.mixer

		return {
			commands: [mixer.getNRPNValue(MSB, LSB)],
			channel: [MSB, LSB],
		}
	},

	fadeLevel: async function (fd, ch, mx, ct, lv, oMB, oLB) {
		const cnfg = this.mixer.faderLaw
		var self = this

		if (fd == 0) {
			//if the user did not choose a fade time
			return await self.setLevel(ch, mx, ct, lv, oMB, oLB)
		} else {
			const mixer = this.mixer
			const midi = mixer.midi

			const midiSocket = midi.socket
			if (midiSocket !== null) {
				let setFade = (MSB, LSB, lv) => {
					const [VC, VF] = mixer.nrpnDataFromLevel(lv)
					midi.send(midi.nrpnData(MSB, LSB, VC, VF))

					lv = parseFloat(lv).toFixed(1)
					if (lv < -89) {
						lv = '-inf'
					}
					self.setVariableValues({
						['level_' + MSB + '.' + LSB]: lv,
					})
				}

				let fading = async (str, end, step, MSB, LSB) => {
					let db = parseFloat(str) //.toFixed(1)

					if (db < -50) {
						db = -50
					}

					end = parseFloat(end) //.toFixed(1)
					let bk = false
					if (end < -50) {
						bk = true
					}

					let itvFade = setInterval(() => {
						db = db - step
						if ((str < end && db > parseFloat(end).toFixed(1)) || (str > end && db < parseFloat(end).toFixed(1))) {
							db = end
						}
						setFade(MSB, LSB, db)

						if (db == end || db < -89) {
							clearInterval(itvFade)
						} else {
							if (db <= -50 && bk) {
								db = -89
							}
						}
					}, 50)
				}

				const { MSB, LSB } = computeEitherParameters(
					ch,
					mx,
					ct,
					{ MSB: oMB[1], LSB: oLB[1] },
					{ MSB: oMB[0], LSB: oLB[0] },
				)
				var end

				if (lv == '-inf') {
					lv = -90
				}

				const levelKey = `level_${MSB}.${LSB}`

				if (lv < 998) {
					end = lv
				} else {
					if (lv == 1000) {
						/* Last dB value */
						end = mixer.lastValue[levelKey]
					} else {
						end = await self.getVariableValue(levelKey)

						if (end == '-inf') {
							end = -90
						} else {
							end = parseFloat(end)
						}

						if (lv == 'step+3') {
							//+3dB
							end += 3
						} else if (lv == 'step+6') {
							//+6dB
							end += 6
						} else if (lv == 'step-3') {
							//-3dB
							end -= 3
						} else if (lv == 'step-6') {
							//-6dB
							end -= 6
						} else {
							//it's a +1/-1 (or less) step command, so just immediately step without fading
							return self.setLevel(ch, mx, ct, lv, oMB, oLB)
						}

						//make sure the new level is within the bounds of the mixer
						if (end < -90) {
							end = -90
						} else if (end > 10) {
							end = 10
						}
					}
				}

				let str //start value
				let res = await self.getVariableValue(levelKey)
				str = res

				if (str == '-inf') {
					str = -90
				}
				if (end == '-inf') {
					end = -90
				}
				if (parseInt(str) == parseInt(end)) {
					return [] //no change in level so no need to fade
				}

				//calculate the steps

				let difference = parseFloat(str).toFixed(1) - parseFloat(end).toFixed(1) //the difference is the start value minus the end value
				//difference = Math.abs(difference); //make it an absolute value

				//determine the number of steps needed to get to the end value if the interval runs every 50ms and the fade time is fd
				let step = difference / (fd * 20) //take the difference between the two decibel values and divide it by the fade time to determine the total number of steps needed to get to the end value

				//now determine the step size
				//let step = difference / steps; //divide the difference by the number of steps to determine the individual step size

				//now we have the steps in seconds, but we need the number of steps in 50ms intervals
				//step = step / 20; //divide the step size by 20 to get the number of steps in 50ms intervals (50ms * 20 = 1 second)
				//step = Math.abs(step); //make it an absolute value

				//fixed position of 1 decimal
				//step = step.toFixed(1);

				//step = (difference / (fd * 20))//.toFixed(1)

				console.log('difference dB: ' + difference)
				console.log('fade time: ' + fd)
				//console.log('steps: ' + steps);
				console.log('step: ' + step)
				console.log('str: ' + str)
				console.log('end: ' + end)

				fading(str, end, step, MSB, LSB)
			}

			return []
		}
	},

	getRemoteLevel: function () {
		var self = this
		const model = self.mixer.model

		var buff = []

		model.forEachInputChannel((channel) => {
			model.forEachMixAndLR((mix) => {
				const rsp = self.getLevel(channel, mix, model.count.mix, [0x40, 0x40], [0, 0x44])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachGroup((group) => {
			model.forEachMixAndLR((mix) => {
				const rsp = self.getLevel(group, mix, model.count.mix, [0x40, 0x45], [0x30, 0x04])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachFxReturn((fxr) => {
			model.forEachMixAndLR((mix) => {
				const rsp = self.getLevel(fxr, mix, model.count.mix, [0x40, 0x46], [0x3c, 0x14])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachFxReturn((fxr) => {
			model.forEachGroup((group) => {
				const rsp = self.getLevel(fxr, group, model.count.group, [0, 0x4b], [0, 0x34])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachInputChannel((channel) => {
			model.forEachFxSend((fxs) => {
				const rsp = self.getLevel(channel, fxs, model.count.fxSend, [0, 0x4c], [0, 0x14])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachGroup((group) => {
			model.forEachFxSend((fxs) => {
				const rsp = self.getLevel(group, fxs, model.count.fxSend, [0, 0x4d], [0, 0x54])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachFxReturn((fxr) => {
			model.forEachFxSend((fxs) => {
				const rsp = self.getLevel(fxr, fxs, model.count.fxSend, [0, 0x4e], [0, 0x04])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachMatrix((matrix) => {
			const rsp = self.getLevel(0, matrix, model.count.matrix, [0, 0x4e], [0, 0x24])
			buff.push(rsp.commands[0])
		})

		model.forEachMix((mix) => {
			model.forEachMatrix((matrix) => {
				const rsp = self.getLevel(mix, matrix, model.count.matrix, [0, 0x4e], [0, 0x27])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachGroup((group) => {
			model.forEachMatrix((matrix) => {
				const rsp = self.getLevel(group, matrix, model.count.matrix, [0, 0x4e], [0, 0x4b])
				buff.push(rsp.commands[0])
			})
		})

		{
			const tmp = []
			tmp.push({ label: `LR`, id: 0 })
			model.forEachMix((mix, mixLabel) => {
				tmp.push({ label: mixLabel, id: mix + 1 })
			})
			model.forEachFxSend((fxs, fxsLabel) => {
				tmp.push({ label: fxsLabel, id: fxs + 1 + model.count.mix })
			})
			model.forEachMatrix((matrix, matrixLabel) => {
				tmp.push({ label: matrixLabel, id: matrix + 1 + model.count.mix + model.count.fxSend })
			})
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(tmp[j].id, 99, 0, [0x4f, 0], [0, 0])
				buff.push(rsp.commands[0])
			}
		}

		model.forEachDCA((dca) => {
			const rsp = self.getLevel(dca, 99, 0, [0x4f, 0], [0x20, 0])
			buff.push(rsp.commands[0])
		})

		if (buff.length > 0 && self.mixer.midi.socket !== null) {
			let ctr = 0
			for (let i = 0; i < buff.length; i++) {
				self.mixer.midi.send(buff[i])
				ctr++
				if (this.config.status == 'delay') {
					if (ctr == 20) {
						ctr = 0
						sleep(300)
					}
				}
			}
		}

		self.subscribeActions('chpan_to_mix')
		if (this.config.status == 'delay') {
			sleep(300)
		}
		self.subscribeActions('grppan_to_mix')
		if (this.config.status == 'delay') {
			sleep(300)
		}
		self.subscribeActions('fxrpan_to_mix')
		if (this.config.status == 'delay') {
			sleep(300)
		}
		self.subscribeActions('fxrpan_to_grp')
		if (this.config.status == 'delay') {
			sleep(300)
		}
		self.subscribeActions('mixpan_to_mtx')
		if (this.config.status == 'delay') {
			sleep(300)
		}
		self.subscribeActions('grppan_to_mtx')
		if (this.config.status == 'delay') {
			sleep(300)
		}
		self.subscribeActions('pan_to_output')
	},
}
