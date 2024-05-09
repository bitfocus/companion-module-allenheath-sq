export default {
	initVariables: function () {
		let self = this
		const model = self.model

		let variables = []

		variables.push({
			name: 'Scene - Current',
			variableId: 'currentScene',
		})

		model.forEachInputChannel((channel, channelLabel) => {
			model.forEachMixAndLR((mix, _mixLabel, mixDesc) => {
				const rsp = self.getLevel(channel, mix, model.mixCount, [0x40, 0x40], [0, 0x44])

				variables.push({
					name: `${channelLabel} -> ${mixDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		model.forEachGroup((group, _groupLabel, groupDesc) => {
			model.forEachMixAndLR((mix, _mixLabel, mixDesc) => {
				const rsp = self.getLevel(group, mix, model.mixCount, [0x40, 0x45], [0x30, 0x04])

				variables.push({
					name: `${groupDesc} -> ${mixDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
			model.forEachMixAndLR((mix, _mixLabel, mixDesc) => {
				const rsp = self.getLevel(fxr, mix, model.mixCount, [0x40, 0x46], [0x3c, 0x14])

				variables.push({
					name: `${fxrDesc} -> ${mixDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
			model.forEachGroup((group, _groupLabel, groupDesc) => {
				const rsp = self.getLevel(fxr, group, model.grpCount, [0, 0x4b], [0, 0x34])

				variables.push({
					name: `${fxrDesc} -> ${groupDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		model.forEachInputChannel((channel, _channelLabel, channelDesc) => {
			model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
				const rsp = self.getLevel(channel, fxs, model.fxsCount, [0, 0x4c], [0, 0x14])

				variables.push({
					name: `${channelDesc} -> ${fxsDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		model.forEachGroup((group, _groupLabel, groupDesc) => {
			model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
				const rsp = self.getLevel(group, fxs, model.fxsCount, [0, 0x4d], [0, 0x54])

				variables.push({
					name: `${groupDesc} -> ${fxsDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
			model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
				const rsp = self.getLevel(fxr, fxs, model.fxsCount, [0, 0x4e], [0, 0x04])

				variables.push({
					name: `${fxrDesc} -> ${fxsDesc} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			})
		})

		{
			let tmp = self.CHOICES_MTX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(0, tmp[j].id, model.mtxCount, [0, 0x4e], [0, 0x24])

				variables.push({
					name: `LR -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}
		model.forEachMix((mix, _mixLabel, mixDesc) => {
			let tmp = self.CHOICES_MTX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(mix, tmp[j].id, model.mtxCount, [0x4e, 0x4e], [0x24, 0x27])

				variables.push({
					name: `${mixDesc} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		})

		model.forEachGroup((group, _groupLabel, groupDesc) => {
			let tmp = self.CHOICES_MTX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(group, tmp[j].id, model.mtxCount, [0, 0x4e], [0, 0x4b])

				variables.push({
					name: `${groupDesc} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		})

		{
			const tmp = []
			tmp.push({ label: `LR`, id: 0 })
			model.forEachMix((mix, _mixLabel, mixDesc) => {
				tmp.push({ label: mixDesc, id: mix + 1 })
			})
			model.forEachFxSend((fxs, fxsLabel) => {
				tmp.push({ label: fxsLabel, id: fxs + 1 + model.mixCount })
			})
			for (let i = 0; i < model.mtxCount; i++) {
				tmp.push({ label: `MATRIX ${i + 1}`, id: i + 1 + model.mixCount + model.fxsCount })
			}
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(tmp[j].id, 99, 0, [0x4f, 0], [0, 0])

				variables.push({
					name: `${tmp[j].label} Output Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}
		model.forEachDCA((dca, dcaLabel) => {
			const rsp = self.getLevel(dca, 99, 0, [0x4f, 0], [0x20, 0])

			variables.push({
				name: `${dcaLabel} Output Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})

		//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

		self.setVariableDefinitions(variables)
	},
}
