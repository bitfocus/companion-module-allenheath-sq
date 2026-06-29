import {
	type CompanionVariableDefinitions,
	CurrentSceneId,
	SceneRecalledTriggerId,
	type SQVariables,
} from './manifest.js'
import type { Model } from '../mixer/model.js'
import { type NRPN, splitNRPN } from '../mixer/nrpn/nrpn.js'
import { forEachOutputLevel } from '../mixer/nrpn/output.js'
import { forEachSourceSinkNRPN } from '../mixer/nrpn/source-to-sink.js'

export function getVariables(model: Model): CompanionVariableDefinitions<SQVariables> {
	const variables: CompanionVariableDefinitions<SQVariables> = {
		[SceneRecalledTriggerId]: {
			name: 'Scene - Scene Recalled Trigger',
		},
		[CurrentSceneId]: {
			name: 'Scene - Current',
		},
	}

	const addVariable = (nrpn: NRPN<'level'>, desc: string) => {
		const { MSB, LSB } = splitNRPN(nrpn)
		variables[`level_${MSB}.${LSB}`] = {
			name: desc,
		}
	}

	forEachSourceSinkNRPN(model, 'level', (nrpn, sourceDesc, sinkDesc) => {
		addVariable(nrpn, `${sourceDesc} -> ${sinkDesc} Level`)
	})

	forEachOutputLevel(model, (nrpn, outputDesc) => {
		addVariable(nrpn, `${outputDesc} Output Level`)
	})

	//mute input, LR, aux, group, matrix, dca, fx return, fx send, mute group

	return variables
}
