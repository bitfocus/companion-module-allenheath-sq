/**
 *
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createInputChannels(model) {
	/** @type {{ label: string, id: number }[]} */
	const inputChannels = []
	model.forEachInputChannel((channel, channelLabel) => {
		inputChannels.push({ label: channelLabel, id: channel })
	})
	return inputChannels
}

export class Choices {
	inputChannels

	/**
	 * @param {import('./mixer/model.js').Model} model
	 */
	constructor(model) {
		this.inputChannels = createInputChannels(model)
	}
}
