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

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createMixes(model) {
	/** @type {{ label: string, id: number }[]} */
	const mixes = []
	model.forEachMix((id, label) => {
		mixes.push({ label, id })
	})
	return mixes
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createMixesAndLR(model) {
	/** @type {{ label: string, id: number }[]} */
	const mixesAndLR = []
	model.forEachMixAndLR((id, label) => {
		mixesAndLR.push({ label, id })
	})
	return mixesAndLR
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createGroups(model) {
	/** @type {{ label: string, id: number }[]} */
	const groups = []
	model.forEachGroup((group, groupLabel) => {
		groups.push({ label: groupLabel, id: group })
	})
	return groups
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createMatrixes(model) {
	/** @type {{ label: string, id: number }[]} */
	const matrixes = []
	model.forEachMatrix((matrix, matrixLabel) => {
		matrixes.push({ label: matrixLabel, id: matrix })
	})
	return matrixes
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createFXReturns(model) {
	/** @type {{ label: string, id: number }[]} */
	const fxReturns = []
	model.forEachFxReturn((fxr, fxrLabel) => {
		fxReturns.push({ label: fxrLabel, id: fxr })
	})
	return fxReturns
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createFXSends(model) {
	/** @type {{ label: string, id: number }[]} */
	const fxSends = []
	model.forEachFxSend((fxs, fxsLabel) => {
		fxSends.push({ label: fxsLabel, id: fxs })
	})
	return fxSends
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createDCAs(model) {
	/** @type {{ label: string, id: number }[]} */
	const dcas = []
	model.forEachDCA((dca, dcaLabel) => {
		dcas.push({ label: dcaLabel, id: dca })
	})
	return dcas
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createMuteGroups(model) {
	/** @type {{ label: string, id: number }[]} */
	const muteGroups = []
	model.forEachMuteGroup((muteGroup, muteGroupLabel) => {
		muteGroups.push({ label: muteGroupLabel, id: muteGroup })
	})
	return muteGroups
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createSoftKeys(model) {
	/** @type {{ label: string, id: number }[]} */
	const softKeys = []
	model.forEachSoftKey((softKey, softKeyLabel) => {
		softKeys.push({ label: softKeyLabel, id: softKey })
	})
	return softKeys
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
		let id = i == -90 ? '-inf' : i
		levels.push({ label: `${i} dB`, id })
	}
	for (let i = -39; i <= -10; i = i + 1) {
		levels.push({ label: `${i} dB`, id: i })
	}
	for (let i = -9.5; i <= 10; i = i + 0.5) {
		levels.push({ label: `${i} dB`, id: i })
	}
	return levels
}

function createPanLevels() {
	const panLevels = []
	panLevels.push({ label: `Step Right`, id: 998 }, { label: `Step Left`, id: 999 })
	for (let i = -100; i <= 100; i = i + 5) {
		const pos = i < 0 ? `L${Math.abs(i)}` : i == 0 ? `CTR` : `R${Math.abs(i)}`
		panLevels.push({ label: `${pos}`, id: `${pos}` })
	}

	return panLevels
}

/**
 * @param {import('./mixer/model.js').Model} model
 * @returns {{ label: string, id: number }[]}
 */
function createAllFaders(model) {
	// All fader mix choices
	/** @type {{ label: string, id: number }[]} */
	const allFaders = []
	allFaders.push({ label: `LR`, id: 0 })
	model.forEachMix((mix, mixLabel) => {
		allFaders.push({ label: mixLabel, id: mix + 1 })
	})
	model.forEachFxSend((fxs, fxsLabel) => {
		allFaders.push({ label: fxsLabel, id: fxs + 1 + model.count.mix })
	})
	model.forEachMatrix((matrix, matrixLabel) => {
		allFaders.push({ label: matrixLabel, id: matrix + 1 + model.count.mix + model.count.fxSend })
	})
	model.forEachDCA((dca, dcaLabel) => {
		allFaders.push({
			label: dcaLabel,
			id: dca + 1 + model.count.mix + model.count.fxSend + model.count.matrix + 12,
		})
	})

	return allFaders
}

export class Choices {
	inputChannels
	mixes
	mixesAndLR
	groups
	matrixes
	fxReturns
	fxSends
	dcas
	muteGroups
	softKeys
	levels
	panLevels
	allFaders

	/**
	 * @param {import('./mixer/model.js').Model} model
	 */
	constructor(model) {
		this.inputChannels = createInputChannels(model)
		this.mixes = createMixes(model)
		this.mixesAndLR = createMixesAndLR(model)
		this.groups = createGroups(model)
		this.matrixes = createMatrixes(model)
		this.fxReturns = createFXReturns(model)
		this.fxSends = createFXSends(model)
		this.dcas = createDCAs(model)
		this.muteGroups = createMuteGroups(model)
		this.softKeys = createSoftKeys(model)
		this.levels = createLevels()
		this.panLevels = createPanLevels()
		this.allFaders = createAllFaders(model)
	}
}
