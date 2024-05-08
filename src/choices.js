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

function createLevels() {
	const levels = []
	levels.push(
		{ label: `Last dB value`, id: 1000 },
		{ label: `Step +0.1 dB`, id: 'step+0.1' }, //added
		{ label: `Step +1 dB`, id: 'step+1' },
		{ label: `Step +3 dB`, id: 'step+3' }, //added
		{ label: `Step +6 dB`, id: 'step+6' }, //added
		{ label: `Step -0.1 dB`, id: 'step-0.1' }, //added
		{ label: `Step -1 dB`, id: 'step-1' },
		{ label: `Step -3 dB`, id: 'step-3' }, //added
		{ label: `Step -6 dB`, id: 'step-6' }, //added
	)
	for (let i = -90; i <= -40; i = i + 5) {
		if (i == -90) {
			i = '-inf'
		}
		levels.push({ label: `${i} dB`, id: i })
	}
	for (let i = -39; i <= -10; i = i + 1) {
		levels.push({ label: `${i} dB`, id: i })
	}
	for (let i = -9.5; i <= 10; i = i + 0.5) {
		levels.push({ label: `${i} dB`, id: i })
	}
	return levels
}

export class Choices {
	inputChannels
	levels

	/**
	 * @param {import('./mixer/model.js').Model} model
	 */
	constructor(model) {
		this.inputChannels = createInputChannels(model)
		this.levels = createLevels()
	}
}
