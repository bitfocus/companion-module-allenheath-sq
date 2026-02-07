import type { CompanionVariableDefinition } from '@companion-module/base'
import type { Model } from './mixer/model.js'
import { type NRPN, splitNRPN } from './mixer/nrpn/nrpn.js'
import { forEachOutputLevel } from './mixer/nrpn/output.js'
import { forEachSourceSinkLevel, forEachSourceSinkAssign } from './mixer/nrpn/source-to-sink.js'

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
			name: 'Scene - Scene Recalled Trigger',
			variableId: SceneRecalledTriggerId,
		},
		{
			name: 'Scene - Current',
			variableId: CurrentSceneId,
		},
	]

	const addVariable = (nrpn: NRPN<'level'>, desc: string) => {
		const { MSB, LSB } = splitNRPN(nrpn)
		variables.push({
			name: desc,
			variableId: `level_${MSB}.${LSB}`,
		})
	}

	forEachSourceSinkLevel(model, (nrpn, sourceDesc, sinkDesc) => {
		addVariable(nrpn, `${sourceDesc} -> ${sinkDesc} Level`)
	})

	forEachSourceSinkAssign(model, (nrpn: NRPN<'assign'>, sourceDesc: string, sinkDesc: string) => {
		const { MSB, LSB } = splitNRPN(nrpn)
		variables.push({
			name: `${sourceDesc} -> ${sinkDesc} Assigned`,
			variableId: `assign_${MSB}.${LSB}`,
		})
	})

	forEachOutputLevel(model, (nrpn, outputDesc) => {
		addVariable(nrpn, `${outputDesc} Output Level`)
	})

	//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

	return variables
}
