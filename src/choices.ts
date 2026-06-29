import type { CompanionInputFieldBase, CompanionInputFieldDropdown, DropdownChoice } from '@companion-module/base'
import type { Model } from './mixer/model.js'
import { LR } from './types.js'

function createMixesAndLR(model: Model): DropdownChoice[] {
	const mixesAndLR: DropdownChoice[] = []
	mixesAndLR.push({ label: 'LR', id: LR })
	model.forEach('mix', (id, label) => {
		mixesAndLR.push({ label, id: id + 1 })
	})
	return mixesAndLR
}

function createGroups(model: Model): DropdownChoice[] {
	const groups: DropdownChoice[] = []
	model.forEach('group', (group, groupLabel) => {
		groups.push({ label: groupLabel, id: group + 1 })
	})
	return groups
}

function createMatrixes(model: Model): DropdownChoice[] {
	const matrixes: DropdownChoice[] = []
	model.forEach('matrix', (matrix, matrixLabel) => {
		matrixes.push({ label: matrixLabel, id: matrix + 1 })
	})
	return matrixes
}

function createFXSends(model: Model): DropdownChoice[] {
	const fxSends: DropdownChoice[] = []
	model.forEach('fxSend', (fxs, fxsLabel) => {
		fxSends.push({ label: fxsLabel, id: fxs + 1 })
	})
	return fxSends
}

export class Choices {
	readonly mixesAndLR
	readonly groups
	readonly matrixes
	readonly fxSends

	constructor(model: Model) {
		this.mixesAndLR = createMixesAndLR(model)
		this.groups = createGroups(model)
		this.matrixes = createMatrixes(model)
		this.fxSends = createFXSends(model)
	}
}

export function mixOrLROption<Id extends CompanionInputFieldBase['id']>(
	label: string,
	id: Id,
	choices: DropdownChoice[],
): CompanionInputFieldDropdown<Id> {
	return {
		type: 'dropdown',
		label,
		id,
		default: 1,
		choices,
		minChoicesForSearch: 0,
	}
}
