import type { CompanionVariableDefinition } from '@companion-module/base'
import type { Model } from './mixer/model.js'
import { OutputLevelNRPNCalculator } from './mixer/nrpn/output.js'
import { LevelNRPNCalculator } from './mixer/nrpn/source-to-sink.js'

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

	const inputToMix = LevelNRPNCalculator.get(model, ['inputChannel', 'mix'])
	const inputToLR = LevelNRPNCalculator.get(model, ['inputChannel', 'lr'])
	const inputToFXSend = LevelNRPNCalculator.get(model, ['inputChannel', 'fxSend'])
	model.forEachInputChannel((channel, channelLabel, channelDesc) => {
		model.forEachLR((_lr, _lrLabel, lrDesc) => {
			const { MSB, LSB } = inputToLR.calculate(channel, 0)

			variables.push({
				name: `${channelLabel} -> ${lrDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		model.forEachMix((mix, _mixLabel, mixDesc) => {
			const { MSB, LSB } = inputToMix.calculate(channel, mix)

			variables.push({
				name: `${channelLabel} -> ${mixDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
			const { MSB, LSB } = inputToFXSend.calculate(channel, fxs)

			variables.push({
				name: `${channelDesc} -> ${fxsDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	})

	const groupToMix = LevelNRPNCalculator.get(model, ['group', 'mix'])
	const groupToLR = LevelNRPNCalculator.get(model, ['group', 'lr'])
	const groupToFXSend = LevelNRPNCalculator.get(model, ['group', 'fxSend'])
	const groupToMatrix = LevelNRPNCalculator.get(model, ['group', 'matrix'])
	model.forEachGroup((group, _groupLabel, groupDesc) => {
		model.forEachLR((_lr, _lrLabel, lrDesc) => {
			const { MSB, LSB } = groupToLR.calculate(group, 0)

			variables.push({
				name: `${groupDesc} -> ${lrDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		model.forEachMix((mix, _mixLabel, mixDesc) => {
			const { MSB, LSB } = groupToMix.calculate(group, mix)

			variables.push({
				name: `${groupDesc} -> ${mixDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
		model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
			const { MSB, LSB } = groupToFXSend.calculate(group, fxs)

			variables.push({
				name: `${groupDesc} -> ${fxsDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
		model.forEachMatrix((matrix, _matrixLabel, matrixDesc) => {
			const { MSB, LSB } = groupToMatrix.calculate(group, matrix)

			variables.push({
				name: `${groupDesc} -> ${matrixDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	})

	const fxReturnToMix = LevelNRPNCalculator.get(model, ['fxReturn', 'mix'])
	const fxReturnToLR = LevelNRPNCalculator.get(model, ['fxReturn', 'lr'])
	const fxReturnToGroup = LevelNRPNCalculator.get(model, ['fxReturn', 'group'])
	const fxReturnToFxSend = LevelNRPNCalculator.get(model, ['fxReturn', 'fxSend'])
	model.forEachFxReturn((fxr, _fxrLabel, fxrDesc) => {
		model.forEachLR((_lr, _lrLabel, lrDesc) => {
			const { MSB, LSB } = fxReturnToLR.calculate(fxr, 0)

			variables.push({
				name: `${fxrDesc} -> ${lrDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		model.forEachMix((mix, _mixLabel, mixDesc) => {
			const { MSB, LSB } = fxReturnToMix.calculate(fxr, mix)

			variables.push({
				name: `${fxrDesc} -> ${mixDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
		model.forEachGroup((group, _groupLabel, groupDesc) => {
			const { MSB, LSB } = fxReturnToGroup.calculate(fxr, group)

			variables.push({
				name: `${fxrDesc} -> ${groupDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
		model.forEachFxSend((fxs, _fxsLabel, fxsDesc) => {
			const { MSB, LSB } = fxReturnToFxSend.calculate(fxr, fxs)

			variables.push({
				name: `${fxrDesc} -> ${fxsDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	})

	const lrToMatrix = LevelNRPNCalculator.get(model, ['lr', 'matrix'])
	model.forEachLR((_lr, _lrLabel, lrDesc) => {
		model.forEachMatrix((matrix, _matrixLabel, matrixDesc) => {
			const { MSB, LSB } = lrToMatrix.calculate(0, matrix)

			variables.push({
				name: `${lrDesc} -> ${matrixDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	})

	const mixToMatrix = LevelNRPNCalculator.get(model, ['mix', 'matrix'])
	model.forEachMix((mix, _mixLabel, mixDesc) => {
		model.forEachMatrix((matrix, _matrixLabel, matrixDesc) => {
			const { MSB, LSB } = mixToMatrix.calculate(mix, matrix)

			variables.push({
				name: `${mixDesc} -> ${matrixDesc} Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	})

	{
		const lrOutput = OutputLevelNRPNCalculator.get(model, 'lr')
		model.forEachLR((_lr, _lrLabel, lrDesc) => {
			const { MSB, LSB } = lrOutput.calculate(0)

			variables.push({
				name: `${lrDesc} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		const mixOutput = OutputLevelNRPNCalculator.get(model, 'mix')
		model.forEachMix((mix, _mixLabel, mixDesc) => {
			const { MSB, LSB } = mixOutput.calculate(mix)

			variables.push({
				name: `${mixDesc} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		const fxSendOutput = OutputLevelNRPNCalculator.get(model, 'fxSend')
		model.forEachFxSend((fxs, fxsLabel) => {
			const { MSB, LSB } = fxSendOutput.calculate(fxs)

			variables.push({
				name: `${fxsLabel} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})

		const matrixOutput = OutputLevelNRPNCalculator.get(model, 'matrix')
		model.forEachMatrix((matrix, matrixLabel) => {
			const { MSB, LSB } = matrixOutput.calculate(matrix)

			variables.push({
				name: `${matrixLabel} Output Level`,
				variableId: `level_${MSB}.${LSB}`,
			})
		})
	}

	const dcaOutput = OutputLevelNRPNCalculator.get(model, 'dca')
	model.forEachDCA((dca, dcaLabel) => {
		const { MSB, LSB } = dcaOutput.calculate(dca)

		variables.push({
			name: `${dcaLabel} Output Level`,
			variableId: `level_${MSB}.${LSB}`,
		})
	})

	//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

	return variables
}
