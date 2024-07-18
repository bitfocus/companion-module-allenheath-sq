export const DefaultModel = 'SQ5'

export type ModelId = 'SQ5' | 'SQ6' | 'SQ7'

type ModelType = {
	chCount: number
	mixCount: number
	grpCount: number
	fxrCount: number
	fxsCount: number
	mtxCount: number
	dcaCount: number
	muteGroupCount: number
	softKeyCount: number
	RotaryKey: number
	sceneCount: number
}

export const SQModels: { [K in ModelId]: ModelType } = {
	SQ5: {
		chCount: 48,
		mixCount: 12,
		grpCount: 12,
		fxrCount: 8,
		fxsCount: 4,
		mtxCount: 3,
		dcaCount: 8,
		muteGroupCount: 8,
		softKeyCount: 8,
		RotaryKey: 0,
		sceneCount: 300,
	},
	SQ6: {
		chCount: 48,
		mixCount: 12,
		grpCount: 12,
		fxrCount: 8,
		fxsCount: 4,
		mtxCount: 3,
		dcaCount: 8,
		muteGroupCount: 8,
		softKeyCount: 16,
		RotaryKey: 4,
		sceneCount: 300,
	},
	SQ7: {
		chCount: 48,
		mixCount: 12,
		grpCount: 12,
		fxrCount: 8,
		fxsCount: 4,
		mtxCount: 3,
		dcaCount: 8,
		muteGroupCount: 8,
		softKeyCount: 16,
		RotaryKey: 8,
		sceneCount: 300,
	},
}

/**
 * Get the value of a particular SQ model characteristic, where that
 * characteristic is being presumed to have the same value across all SQ mixer
 * models.  If the characteristic in fact varies across models, this function
 * will throw.
 *
 * @param countType
 *   The particular SQ characteristic to query.
 * @throws
 *   A TypeError if the characteristic isn't the same across all SQ models.
 * @returns
 *   The value of the characteristic.
 */
export function getCommonCount(countType: keyof ModelType): number {
	return Object.values(SQModels).reduce((count, model) => {
		const thisCount = model[countType]
		if (count === -1) {
			return thisCount
		}
		if (count !== thisCount) {
			throw new TypeError(`SQ ${countType} is not constant across models`)
		}
		return count
	}, -1)
}
