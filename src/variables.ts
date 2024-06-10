import type { CompanionVariableDefinition } from '@companion-module/base'
import type { sqInstance } from './instance.js'
import type { Model } from './mixer/model.js'

export function getVariables(self: sqInstance, model: Model): CompanionVariableDefinition[] {
	const variables: CompanionVariableDefinition[] = []

	variables.push({
		name: 'Scene - Current',
		variableId: 'currentScene',
	})

	model.forEachInputChannel((channel, channelLabel) => {
		model.forEachMixAndLR((mix, _mixLabel, mixDesc) => {
			const rsp = self.getLevel(channel, mix, model.count.mix, [0x40, 0x40], [0, 0x44])

			variables.push({
				name: `${channelLabel} -> ${mixDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachGroup((group, _groupLabel, groupDesc) => {
		model.forEachMixAndLR((mix, _mixLabel, mixDesc) => {
			const rsp = self.getLevel(group, mix, model.count.mix, [0x40, 0x45], [0x30, 0x04])

			variables.push({
				name: `${groupDesc} -> ${mixDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
		model.forEachMixAndLR((mix, _mixLabel, mixDesc) => {
			const rsp = self.getLevel(fxr, mix, model.count.mix, [0x40, 0x46], [0x3c, 0x14])

			variables.push({
				name: `${fxrDesc} -> ${mixDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
		model.forEachGroup((group, _groupLabel, groupDesc) => {
			const rsp = self.getLevel(fxr, group, model.count.group, [0, 0x4b], [0, 0x34])

			variables.push({
				name: `${fxrDesc} -> ${groupDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachInputChannel((channel, _channelLabel, channelDesc) => {
		model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
			const rsp = self.getLevel(channel, fxs, model.count.fxSend, [0, 0x4c], [0, 0x14])

			variables.push({
				name: `${channelDesc} -> ${fxsDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachGroup((group, _groupLabel, groupDesc) => {
		model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
			const rsp = self.getLevel(group, fxs, model.count.fxSend, [0, 0x4d], [0, 0x54])

			variables.push({
				name: `${groupDesc} -> ${fxsDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
		model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
			const rsp = self.getLevel(fxr, fxs, model.count.fxSend, [0, 0x4e], [0, 0x04])

			variables.push({
				name: `${fxrDesc} -> ${fxsDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachMatrix((matrix, _matrixLabel, matrixDesc) => {
		const rsp = self.getLevel(0, matrix, model.count.matrix, [0, 0x4e], [0, 0x24])

		variables.push({
			name: `LR -> ${matrixDesc} Level`,
			variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
		})
	})
	model.forEachMix((mix, _mixLabel, mixDesc) => {
		model.forEachMatrix((matrix, _matrixLabel, matrixDesc) => {
			const rsp = self.getLevel(mix, matrix, model.count.matrix, [0x4e, 0x4e], [0x24, 0x27])

			variables.push({
				name: `${mixDesc} -> ${matrixDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	model.forEachGroup((group, _groupLabel, groupDesc) => {
		model.forEachMatrix((matrix, _matrixLabel, matrixDesc) => {
			const rsp = self.getLevel(group, matrix, model.count.matrix, [0, 0x4e], [0, 0x4b])

			variables.push({
				name: `${groupDesc} -> ${matrixDesc} Level`,
				variableId: `level_${rsp['channel'][0]}.${rsp['channel'][1]}`,
			})
		})
	})

	{
		const tmp = []
		tmp.push({ label: `LR`, id: 0 })
		model.forEachMix((mix, _mixLabel, mixDesc) => {
			tmp.push({ label: mixDesc, id: mix + 1 })
		})
		model.forEachFxSend((fxs, fxsLabel) => {
			tmp.push({ label: fxsLabel, id: fxs + 1 + model.count.mix })
		})
		model.forEachMatrix((matrix, matrixLabel) => {
			tmp.push({ label: matrixLabel, id: matrix + 1 + model.count.mix + model.count.fxSend })
		})
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

	return variables
}
