import { type ModelId, SQModels } from './models.js'

export type ForEachFunctor = (n: number, label: string, desc: string) => void

/**
 * A record of the count of the number of instances of every kind of input,
 * output, and scene.
 */
export type InputOutputCounts = {
	inputChannel: number
	mix: number
	group: number
	fxReturn: number
	fxSend: number
	matrix: number
	dca: number
	muteGroup: number
	softKey: number
	scene: number

	// Encode LR as its own "category" so we can pretend the LR mix is a
	// one-element category when computing various types of parameter numbers.
	lr: 1
}

export type InputOutputType = keyof InputOutputCounts

/**
 * The value of the LR mix, in any interface that accepts either a mix (0
 * through 11 if there exist mixes 1 to 12) or LR.
 *
 * (This really shouldn't be a number, so that mix numbers and this value can
 * have different types.  But action options currently use `99` to encode LR,
 * and that probably needs to change before this can be changed to e.g. `'lr'`.)
 */
export const LR = 99 as const

export class Model {
	readonly count: InputOutputCounts

	/** Create a representation of a mixer identified by `modelId`. */
	constructor(modelId: ModelId) {
		const sqModel = SQModels[modelId]

		this.count = {
			inputChannel: sqModel.chCount,
			mix: sqModel.mixCount,
			group: sqModel.grpCount,
			fxReturn: sqModel.fxrCount,
			fxSend: sqModel.fxsCount,
			matrix: sqModel.mtxCount,
			dca: sqModel.dcaCount,
			muteGroup: sqModel.muteGroupCount,
			softKey: sqModel.softKeyCount,
			scene: sqModel.sceneCount,
			lr: 1,
		}
	}

	#channelLabel(channel: number): string {
		return `CH ${channel + 1}`
	}

	readonly #channelLabels: string[] = []

	forEachInputChannel(f: ForEachFunctor): void {
		const channelLabels = this.#channelLabels
		if (channelLabels.length === 0) {
			for (let channel = 0; channel < this.count.inputChannel; channel++) {
				const label = this.#channelLabel(channel)
				channelLabels.push(label)
			}
		}

		channelLabels.forEach((label, channel) => {
			f(channel, label, label)
		})
	}

	#mixLabel(mix: number): string {
		return `AUX ${mix + 1}`
	}

	#mixDesc(mix: number): string {
		return `Aux ${mix + 1}`
	}

	readonly #mixLabels: [string, string][] = []

	forEachMix(f: ForEachFunctor): void {
		const mixLabels = this.#mixLabels
		if (mixLabels.length === 0) {
			for (let mix = 0; mix < this.count.mix; mix++) {
				const label = this.#mixLabel(mix)
				const desc = this.#mixDesc(mix)
				mixLabels.push([label, desc])
			}
		}

		mixLabels.forEach(([label, desc], mix) => {
			f(mix, label, desc)
		})
	}

	forEachMixAndLR(f: ForEachFunctor): void {
		f(LR, 'LR', 'LR')
		this.forEachMix(f)
	}

	#groupLabel(group: number): string {
		return `GROUP ${group + 1}`
	}

	#groupDesc(group: number): string {
		return `Group ${group + 1}`
	}

	readonly #groupLabels: [string, string][] = []

	forEachGroup(f: ForEachFunctor): void {
		const groupLabels = this.#groupLabels
		if (groupLabels.length === 0) {
			for (let group = 0; group < this.count.group; group++) {
				const label = this.#groupLabel(group)
				const desc = this.#groupDesc(group)
				groupLabels.push([label, desc])
			}
		}

		groupLabels.forEach(([label, desc], group) => {
			f(group, label, desc)
		})
	}

	#fxReturnLabel(fxr: number): string {
		return `FX RETURN ${fxr + 1}`
	}

	#fxReturnDesc(fxr: number): string {
		return `FX Return ${fxr + 1}`
	}

	readonly #fxReturnLabels: [string, string][] = []

	forEachFxReturn(f: ForEachFunctor): void {
		const fxReturnLabels = this.#fxReturnLabels
		if (fxReturnLabels.length === 0) {
			for (let fxr = 0; fxr < this.count.fxReturn; fxr++) {
				const label = this.#fxReturnLabel(fxr)
				const desc = this.#fxReturnDesc(fxr)
				fxReturnLabels.push([label, desc])
			}
		}

		fxReturnLabels.forEach(([label, desc], fxr) => {
			f(fxr, label, desc)
		})
	}

	#fxSendLabel(fxs: number): string {
		return `FX SEND ${fxs + 1}`
	}

	#fxSendDesc(fxs: number): string {
		return `FX Send ${fxs + 1}`
	}

	readonly #fxSendLabels: [string, string][] = []

	forEachFxSend(f: ForEachFunctor): void {
		const fxSendLabels = this.#fxSendLabels
		if (fxSendLabels.length === 0) {
			for (let fxs = 0; fxs < this.count.fxSend; fxs++) {
				const label = this.#fxSendLabel(fxs)
				const desc = this.#fxSendDesc(fxs)
				fxSendLabels.push([label, desc])
			}
		}

		fxSendLabels.forEach(([label, desc], fxs) => {
			f(fxs, label, desc)
		})
	}

	#matrixLabel(matrix: number): string {
		return `MATRIX ${matrix + 1}`
	}

	#matrixDesc(matrix: number): string {
		return `Matrix ${matrix + 1}`
	}

	readonly #matrixLabels: [string, string][] = []

	forEachMatrix(f: ForEachFunctor): void {
		const matrixLabels = this.#matrixLabels
		if (matrixLabels.length === 0) {
			for (let matrix = 0; matrix < this.count.matrix; matrix++) {
				const label = this.#matrixLabel(matrix)
				const desc = this.#matrixDesc(matrix)
				matrixLabels.push([label, desc])
			}
		}

		matrixLabels.forEach(([label, desc], matrix) => {
			f(matrix, label, desc)
		})
	}

	#muteGroupLabel(muteGroup: number): string {
		return `MuteGroup ${muteGroup + 1}`
	}

	readonly #muteGroupLabels: string[] = []

	forEachMuteGroup(f: ForEachFunctor): void {
		const muteGroupLabels = this.#muteGroupLabels
		if (muteGroupLabels.length === 0) {
			for (let muteGroup = 0; muteGroup < this.count.muteGroup; muteGroup++) {
				const label = this.#muteGroupLabel(muteGroup)
				muteGroupLabels.push(label)
			}
		}

		muteGroupLabels.forEach((label, muteGroup) => {
			f(muteGroup, label, label)
		})
	}

	#softKeyLabel(key: number): string {
		return `SOFTKEY ${key + 1}`
	}

	#softKeyDesc(key: number): string {
		return `SoftKey ${key + 1}`
	}

	readonly #softKeyLabels: [string, string][] = []

	forEachSoftKey(f: ForEachFunctor): void {
		const softKeyLabels = this.#softKeyLabels
		if (softKeyLabels.length === 0) {
			for (let softKey = 0; softKey < this.count.softKey; softKey++) {
				const label = this.#softKeyLabel(softKey)
				const desc = this.#softKeyDesc(softKey)
				softKeyLabels.push([label, desc])
			}
		}

		softKeyLabels.forEach(([label, desc], softKey) => {
			f(softKey, label, desc)
		})
	}

	#dcaLabel(dca: number): string {
		return `DCA ${dca + 1}`
	}

	readonly #dcaLabels: string[] = []

	forEachDCA(f: ForEachFunctor): void {
		const dcaLabels = this.#dcaLabels
		if (dcaLabels.length === 0) {
			for (let dca = 0; dca < this.count.dca; dca++) {
				const label = this.#dcaLabel(dca)
				dcaLabels.push(label)
			}
		}

		dcaLabels.forEach((label, dca) => {
			f(dca, label, label)
		})
	}
}
