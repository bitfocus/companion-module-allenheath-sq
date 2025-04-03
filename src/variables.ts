import type { CompanionVariableDefinition } from '@companion-module/base'
import type { Model } from './mixer/model.js'
import { OutputLevelNRPNCalculator } from './mixer/nrpn/output.js'
import type { LevelParam } from './mixer/nrpn/param.js'
import { forEachSourceSinkLevel } from './mixer/nrpn/source-to-sink.js'

/**
 * The variable ID for the variable containing the last recalled scene
 * (1-indexed).
 */
export const CurrentSceneId = 'currentScene'

/**
 * The variable ID for the variable updated every time a scene is recalled
 * intended for use in triggers.
 */
export const SceneRecalledTriggerId = 'sceneRecalledTrigger'

export function getVariables(model: Model): CompanionVariableDefinition[] {
	const variables: CompanionVariableDefinition[] = [
		{
			name: 'Scene - Scene Recalled',
			variableId: SceneRecalledTriggerId,
		},
		{
			name: 'Scene - Current',
			variableId: CurrentSceneId,
		},
	]

	const addVariable = ({ MSB, LSB }: LevelParam, desc: string) => {
		variables.push({
			name: desc,
			variableId: `level_${MSB}.${LSB}`,
		})
	}

	forEachSourceSinkLevel(model, (nrpn, sourceDesc, sinkDesc) => {
		addVariable(nrpn, `${sourceDesc} -> ${sinkDesc} Level`)
	})

	{
		const lrOutput = OutputLevelNRPNCalculator.get(model, 'lr')
		model.forEach('lr', (_lr, _lrLabel, lrDesc) => {
			const { MSB, LSB } = lrOutput.calculate(0)

			variables.push({
				name: `${lrDesc} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		const mixOutput = OutputLevelNRPNCalculator.get(model, 'mix')
		model.forEach('mix', (mix, _mixLabel, mixDesc) => {
			const { MSB, LSB } = mixOutput.calculate(mix)

			variables.push({
				name: `${mixDesc} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		const fxSendOutput = OutputLevelNRPNCalculator.get(model, 'fxSend')
		model.forEach('fxSend', (fxs, fxsLabel) => {
			const { MSB, LSB } = fxSendOutput.calculate(fxs)

			variables.push({
				name: `${fxsLabel} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		const matrixOutput = OutputLevelNRPNCalculator.get(model, 'matrix')
		model.forEach('matrix', (matrix, matrixLabel) => {
			const { MSB, LSB } = matrixOutput.calculate(matrix)

			variables.push({
				name: `${matrixLabel} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	}

	const dcaOutput = OutputLevelNRPNCalculator.get(model, 'dca')
	model.forEach('dca', (dca, dcaLabel) => {
		const { MSB, LSB } = dcaOutput.calculate(dca)

		variables.push({
			name: `${dcaLabel} Output Level`,
			variableId: `level_${MSB}.${LSB}`,
		})
	})

	//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

	return variables
}
