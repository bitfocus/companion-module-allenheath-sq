import { SQModels } from './models.js'

export class Model {
	chCount
	mixCount
	grpCount
	fxrCount
	fxsCount
	mtxCount
	dcaCount
	muteGroup
	SoftKey
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
		this.muteGroup = sqModel['muteGroup']
		this.SoftKey = sqModel['SoftKey']
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
}
