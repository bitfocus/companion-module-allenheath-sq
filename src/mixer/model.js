import { SQModels } from './models.js'

export class Model {
	chCount
	mixCount
	grpCount
	fxrCount
	fxsCount
	mtxCount
	dcaCount
	muteGroupCount
	softKeyCount
	sceneCount

	/**
	 * Create a representation of a mixer identified by `modelId`.
	 * @param {string} modelId
	 */
	constructor(modelId) {
		if (!(modelId in SQModels)) {
			throw new RangeError(`Unknown SQ model: ${modelId}`)
		}
		const sqModel = SQModels[modelId]

		this.chCount = sqModel['chCount']
		this.mixCount = sqModel['mixCount']
		this.grpCount = sqModel['grpCount']
		this.fxrCount = sqModel['fxrCount']
		this.fxsCount = sqModel['fxsCount']
		this.mtxCount = sqModel['mtxCount']
		this.dcaCount = sqModel['dcaCount']
		this.muteGroupCount = sqModel['muteGroupCount']
		this.softKeyCount = sqModel['SoftKey']
		this.sceneCount = sqModel['sceneCount']
	}

	#channelLabel(channel) {
		return `CH ${channel + 1}`
	}

	#channelLabels = []

	forEachInputChannel(f) {
		const channelLabels = this.#channelLabels
		if (channelLabels.length === 0) {
			for (let channel = 0; channel < this.chCount; channel++) {
				const label = this.#channelLabel(channel)
				channelLabels.push(label)
			}
		}

		channelLabels.forEach((label, channel) => {
			f(channel, label, label)
		})
	}

	#mixLabel(mix) {
		return `AUX ${mix + 1}`
	}

	#mixDesc(mix) {
		return `Aux ${mix + 1}`
	}

	#mixLabels = []

	forEachMix(f) {
		const mixLabels = this.#mixLabels
		if (mixLabels.length === 0) {
			for (let mix = 0; mix < this.mixCount; mix++) {
				const label = this.#mixLabel(mix)
				const desc = this.#mixDesc(mix)
				mixLabels.push([label, desc])
			}
		}

		mixLabels.forEach(([label, desc], mix) => {
			f(mix, label, desc)
		})
	}

	forEachMixAndLR(f) {
		f(99, 'LR', 'LR')
		this.forEachMix(f)
	}

	#groupLabel(group) {
		return `GROUP ${group + 1}`
	}

	#groupDesc(group) {
		return `Group ${group + 1}`
	}

	#groupLabels = []

	forEachGroup(f) {
		const groupLabels = this.#groupLabels
		if (groupLabels.length === 0) {
			for (let group = 0; group < this.grpCount; group++) {
				const label = this.#groupLabel(group)
				const desc = this.#groupDesc(group)
				groupLabels.push([label, desc])
			}
		}

		groupLabels.forEach(([label, desc], group) => {
			f(group, label, desc)
		})
	}

	#fxReturnLabel(fxr) {
		return `FX RETURN ${fxr + 1}`
	}

	#fxReturnDesc(fxr) {
		return `FX Return ${fxr + 1}`
	}

	#fxReturnLabels = []

	forEachFxReturn(f) {
		const fxReturnLabels = this.#fxReturnLabels
		if (fxReturnLabels.length === 0) {
			for (let fxr = 0; fxr < this.fxrCount; fxr++) {
				const label = this.#fxReturnLabel(fxr)
				const desc = this.#fxReturnDesc(fxr)
				fxReturnLabels.push([label, desc])
			}
		}

		fxReturnLabels.forEach(([label, desc], fxr) => {
			f(fxr, label, desc)
		})
	}

	#fxSendLabel(fxs) {
		return `FX SEND ${fxs + 1}`
	}

	#fxSendDesc(fxs) {
		return `FX Send ${fxs + 1}`
	}

	#fxSendLabels = []

	forEachFxSend(f) {
		const fxSendLabels = this.#fxSendLabels
		if (fxSendLabels.length === 0) {
			for (let fxs = 0; fxs < this.fxsCount; fxs++) {
				const label = this.#fxSendLabel(fxs)
				const desc = this.#fxSendDesc(fxs)
				fxSendLabels.push([label, desc])
			}
		}

		fxSendLabels.forEach(([label, desc], fxs) => {
			f(fxs, label, desc)
		})
	}

	#matrixLabel(matrix) {
		return `MATRIX ${matrix + 1}`
	}

	#matrixDesc(matrix) {
		return `Matrix ${matrix + 1}`
	}

	#matrixLabels = []

	forEachMatrix(f) {
		const matrixLabels = this.#matrixLabels
		if (matrixLabels.length === 0) {
			for (let matrix = 0; matrix < this.mtxCount; matrix++) {
				const label = this.#matrixLabel(matrix)
				const desc = this.#matrixDesc(matrix)
				matrixLabels.push([label, desc])
			}
		}

		matrixLabels.forEach(([label, desc], matrix) => {
			f(matrix, label, desc)
		})
	}

	#muteGroupLabel(muteGroup) {
		return `MuteGroup ${muteGroup + 1}`
	}

	#muteGroupLabels = []

	forEachMuteGroup(f) {
		const muteGroupLabels = this.#muteGroupLabels
		if (muteGroupLabels.length === 0) {
			for (let muteGroup = 0; muteGroup < this.muteGroupCount; muteGroup++) {
				const label = this.#muteGroupLabel(muteGroup)
				muteGroupLabels.push(label)
			}
		}

		muteGroupLabels.forEach((label, muteGroup) => {
			f(muteGroup, label, label)
		})
	}

	#softKeyLabel(key) {
		return `SOFTKEY ${key + 1}`
	}

	#softKeyDesc(key) {
		return `SoftKey ${key + 1}`
	}

	#softKeyLabels = []

	forEachSoftKey(f) {
		const softKeyLabels = this.#softKeyLabels
		if (softKeyLabels.length === 0) {
			for (let softKey = 0; softKey < this.softKeyCount; softKey++) {
				const label = this.#softKeyLabel(softKey)
				const desc = this.#softKeyDesc(softKey)
				softKeyLabels.push([label, desc])
			}
		}

		softKeyLabels.forEach(([label, desc], softKey) => {
			f(softKey, label, desc)
		})
	}

	#dcaLabel(dca) {
		return `DCA ${dca + 1}`
	}

	#dcaLabels = []

	forEachDCA(f) {
		const dcaLabels = this.#dcaLabels
		if (dcaLabels.length === 0) {
			for (let dca = 0; dca < this.dcaCount; dca++) {
				const label = this.#dcaLabel(dca)
				dcaLabels.push(label)
			}
		}

		dcaLabels.forEach((label, dca) => {
			f(dca, label, label)
		})
	}
}
