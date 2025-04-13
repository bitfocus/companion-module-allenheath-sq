import type { CompanionVariableDefinition } from '@companion-module/base'
import type { Model } from './mixer/model.js'
import type { LevelParam } from './mixer/nrpn/level.js'
import { forEachOutputLevel } from './mixer/nrpn/output.js'
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

	forEachSourceSinkLevel(model, (param, sourceDesc, sinkDesc) => {
		addVariable(param, `${sourceDesc} -> ${sinkDesc} Level`)
	})

	forEachOutputLevel(model, (param, outputDesc) => {
		addVariable(param, `${outputDesc} Output Level`)
	})

	//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

	return variables
}
