import type { DropdownChoice } from '@companion-module/base'
import type { Model } from './mixer/model.js'
import { createPanLevels } from './mixer/pan-balance.js'

function createInputChannels(model: Model): DropdownChoice[] {
	const inputChannels: DropdownChoice[] = []
	model.forEachInputChannel((channel, channelLabel) => {
		inputChannels.push({ label: channelLabel, id: channel })
	})
	return inputChannels
}

function createMixes(model: Model): DropdownChoice[] {
	const mixes: DropdownChoice[] = []
	model.forEachMix((id, label) => {
		mixes.push({ label, id })
	})
	return mixes
}

function createMixesAndLR(model: Model): DropdownChoice[] {
	const mixesAndLR: DropdownChoice[] = []
	model.forEachMixAndLR((id, label) => {
		mixesAndLR.push({ label, id })
	})
	return mixesAndLR
}

function createGroups(model: Model): DropdownChoice[] {
	const groups: DropdownChoice[] = []
	model.forEachGroup((group, groupLabel) => {
		groups.push({ label: groupLabel, id: group })
	})
	return groups
}

function createMatrixes(model: Model): DropdownChoice[] {
	const matrixes: DropdownChoice[] = []
	model.forEachMatrix((matrix, matrixLabel) => {
		matrixes.push({ label: matrixLabel, id: matrix })
	})
	return matrixes
}

function createFXReturns(model: Model): DropdownChoice[] {
	const fxReturns: DropdownChoice[] = []
	model.forEachFxReturn((fxr, fxrLabel) => {
		fxReturns.push({ label: fxrLabel, id: fxr })
	})
	return fxReturns
}

function createFXSends(model: Model): DropdownChoice[] {
	const fxSends: DropdownChoice[] = []
	model.forEachFxSend((fxs, fxsLabel) => {
		fxSends.push({ label: fxsLabel, id: fxs })
	})
	return fxSends
}

function createDCAs(model: Model): DropdownChoice[] {
	const dcas: DropdownChoice[] = []
	model.forEachDCA((dca, dcaLabel) => {
		dcas.push({ label: dcaLabel, id: dca })
	})
	return dcas
}

function createMuteGroups(model: Model): DropdownChoice[] {
	const muteGroups: DropdownChoice[] = []
	model.forEachMuteGroup((muteGroup, muteGroupLabel) => {
		muteGroups.push({ label: muteGroupLabel, id: muteGroup })
	})
	return muteGroups
}

function createSoftKeys(model: Model): DropdownChoice[] {
	const softKeys: DropdownChoice[] = []
	model.forEachSoftKey((softKey, softKeyLabel) => {
		softKeys.push({ label: softKeyLabel, id: softKey })
	})
	return softKeys
}

function createLevels() {
	const levels: DropdownChoice[] = []
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
		const id = i == -90 ? '-inf' : i
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

function createAllFaders(model: Model): DropdownChoice[] {
	// All fader mix choices
	const allFaders: DropdownChoice[] = []
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
	readonly inputChannels
	readonly mixes
	readonly mixesAndLR
	readonly groups
	readonly matrixes
	readonly fxReturns
	readonly fxSends
	readonly dcas
	readonly muteGroups
	readonly softKeys
	readonly levels
	readonly panLevels
	readonly allFaders

	constructor(model: Model) {
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
