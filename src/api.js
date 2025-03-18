import { OutputActionId } from './actions/output.js'
import { RetrieveStatusAtStartup } from './mixer/mixer.js'
import { computeEitherParameters } from './mixer/parameters.js'
import { sleep } from './utils/sleep.js'

export default {
	getLevel: function (ch, mx, ct, oMB, oLB) {
		const { MSB, LSB } = computeEitherParameters(ch, mx, ct, { MSB: oMB[1], LSB: oLB[1] }, { MSB: oMB[0], LSB: oLB[0] })

		/** @type {import('./mixer/mixer.js').Mixer} */
		const mixer = this.mixer

		return {
			commands: [mixer.getNRPNValue(MSB, LSB)],
			channel: [MSB, LSB],
		}
	},

	getRemoteLevel: function () {
		/** @type {import('./instance-interface.js').SQInstanceInterface} */
		var self = this
		const model = self.mixer.model

		var buff = []

		model.forEachInputChannel((channel) => {
			model.forEachMixAndLR((mix) => {
				const rsp = self.getLevel(channel, mix, model.inputOutputCounts.mix, [0x40, 0x40], [0, 0x44])
				buff.push(rsp.commands[0])
			})
			model.forEachFxSend((fxs) => {
				const rsp = self.getLevel(channel, fxs, model.inputOutputCounts.fxSend, [0, 0x4c], [0, 0x14])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachGroup((group) => {
			model.forEachMixAndLR((mix) => {
				const rsp = self.getLevel(group, mix, model.inputOutputCounts.mix, [0x40, 0x45], [0x30, 0x04])
				buff.push(rsp.commands[0])
			})
			model.forEachFxSend((fxs) => {
				const rsp = self.getLevel(group, fxs, model.inputOutputCounts.fxSend, [0, 0x4d], [0, 0x54])
				buff.push(rsp.commands[0])
			})
			model.forEachMatrix((matrix) => {
				const rsp = self.getLevel(group, matrix, model.inputOutputCounts.matrix, [0, 0x4e], [0, 0x4b])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachFxReturn((fxr) => {
			model.forEachMixAndLR((mix) => {
				const rsp = self.getLevel(fxr, mix, model.inputOutputCounts.mix, [0x40, 0x46], [0x3c, 0x14])
				buff.push(rsp.commands[0])
			})
			model.forEachGroup((group) => {
				const rsp = self.getLevel(fxr, group, model.inputOutputCounts.group, [0, 0x4b], [0, 0x34])
				buff.push(rsp.commands[0])
			})
			model.forEachFxSend((fxs) => {
				const rsp = self.getLevel(fxr, fxs, model.inputOutputCounts.fxSend, [0, 0x4e], [0, 0x04])
				buff.push(rsp.commands[0])
			})
		})

		model.forEachMatrix((matrix) => {
			const rsp = self.getLevel(0, matrix, model.inputOutputCounts.matrix, [0, 0x4e], [0, 0x24])
			buff.push(rsp.commands[0])
		})

		model.forEachMix((mix) => {
			model.forEachMatrix((matrix) => {
				const rsp = self.getLevel(mix, matrix, model.inputOutputCounts.matrix, [0, 0x4e], [0, 0x27])
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
				tmp.push({ label: fxsLabel, id: fxs + 1 + model.inputOutputCounts.mix })
			})
			model.forEachMatrix((matrix, matrixLabel) => {
				tmp.push({ label: matrixLabel, id: matrix + 1 + model.inputOutputCounts.mix + model.inputOutputCounts.fxSend })
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

		const delayStatusRetrieval = self.options.retrieveStatusAtStartup === RetrieveStatusAtStartup.Delayed

		if (buff.length > 0 && self.mixer.midi.socket !== null) {
			let ctr = 0
			for (let i = 0; i < buff.length; i++) {
				self.mixer.midi.send(buff[i])
				ctr++
				if (delayStatusRetrieval) {
					if (ctr == 20) {
						ctr = 0
						sleep(300)
					}
				}
			}
		}

		self.subscribeActions('chpan_to_mix')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		self.subscribeActions('grppan_to_mix')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		self.subscribeActions('fxrpan_to_mix')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		self.subscribeActions('fxrpan_to_grp')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		self.subscribeActions('mixpan_to_mtx')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		self.subscribeActions('grppan_to_mtx')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		self.subscribeActions(OutputActionId.LRPanBalanceOutput)
		self.subscribeActions(OutputActionId.MixPanBalanceOutput)
		self.subscribeActions(OutputActionId.MatrixPanBalanceOutput)
	},
}
