export default {
	initVariables: function () {
		let self = this
		const model = self.model

		let variables = []

		variables.push({
			name: 'Scene - Current',
			variableId: 'currentScene',
		})

		for (let i = 0; i < model.chCount; i++) {
			let tmp = self.CHOICES_MIX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.mixCount, [0x40, 0x40], [0, 0x44])

				variables.push({
					name: `CH ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.grpCount; i++) {
			let tmp = self.CHOICES_MIX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.mixCount, [0x40, 0x45], [0x30, 0x04])

				variables.push({
					name: `Group ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.fxrCount; i++) {
			let tmp = self.CHOICES_MIX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.mixCount, [0x40, 0x46], [0x3c, 0x14])

				variables.push({
					name: `FX Return ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.fxrCount; i++) {
			let tmp = self.CHOICES_GRP
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.grpCount, [0, 0x4b], [0, 0x34])

				variables.push({
					name: `FX Return ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.chCount; i++) {
			let tmp = self.CHOICES_FXS
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.fxsCount, [0, 0x4c], [0, 0x14])

				variables.push({
					name: `CH ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.grpCount; i++) {
			let tmp = self.CHOICES_FXS
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.fxsCount, [0, 0x4d], [0, 0x54])

				variables.push({
					name: `Group ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.fxrCount; i++) {
			let tmp = self.CHOICES_FXS
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.fxsCount, [0, 0x4e], [0, 0x04])

				variables.push({
					name: `FX Return ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

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
		for (let i = 0; i < model.mixCount; i++) {
			let tmp = self.CHOICES_MTX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.mtxCount, [0x4e, 0x4e], [0x24, 0x27])

				variables.push({
					name: `Mix ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		for (let i = 0; i < model.grpCount; i++) {
			let tmp = self.CHOICES_MTX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(i, tmp[j].id, model.mtxCount, [0, 0x4e], [0, 0x4b])

				variables.push({
					name: `Group ${i + 1} -> ${tmp[j].label} Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}

		{
			const tmp = []
			tmp.push({ label: `LR`, id: 0 })
			for (let i = 0; i < model.mixCount; i++) {
				tmp.push({ label: `AUX ${i + 1}`, id: i + 1 })
			}
			for (let i = 0; i < model.fxsCount; i++) {
				tmp.push({ label: `FX SEND ${i + 1}`, id: i + 1 + model.mixCount })
			}
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
		{
			const tmp = this.CHOICES_DCA
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(tmp[j].id, 99, 0, [0x4f, 0], [0x20, 0])

				variables.push({
					name: `${tmp[j].label} Output Level`,
					variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
				})
			}
		}
		//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

		self.setVariableDefinitions(variables)
	},
}
