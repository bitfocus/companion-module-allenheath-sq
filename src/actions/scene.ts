import type { CompanionActionDefinitions } from '@companion-module/base'
import type { sqInstance } from '../instance.js'
import { type Model } from '../mixer/model.js'
import { type Mixer } from '../mixer/mixer.js'
import { SceneActionId, type SceneActions, SceneAdjustOptionId, SceneNumberOptionId } from './schemas/scene.js'
import { type OptionValue } from './to-source-or-sink.js'
import type { OldCompanionMigrationAction } from '../upgrades/types.js'
import { type OneIndexed, oneIndexedNumber } from '../utils/indexed.js'
import { repr } from '../utils/pretty.js'

/**
 * The action ID of an action whose implementation was identical to that of
 * `SceneActionId.SceneRecall` in every way, so all uses of it are upgraded to
 * that action in an upgrade script.
 */
const ObsoleteSetCurrentSceneId = 'current_scene'

/**
 * This module once supported 'scene_recall' and 'current_scene' actions that
 * were exactly identical (other than in actionId and the name for each visible
 * in UI).  Rewrite the latter sort of action to instead encode the former.
 */
export function tryCoalesceSceneRecallActions(action: OldCompanionMigrationAction): boolean {
	if (action.actionId !== ObsoleteSetCurrentSceneId) {
		return false
	}

	action.actionId = SceneActionId.SceneRecall
	return true
}

function toScene(instance: sqInstance, model: Model, sceneOption: OptionValue): OneIndexed | null {
	const scene = Number(sceneOption) | 0
	if (1 <= scene && scene <= model.scenes) {
		return oneIndexedNumber(scene)
	}

	instance.log('error', `Attempting to recall invalid scene ${repr(sceneOption)}, ignoring`)
	return null
}

const StepMin = -(300 - 1)
const StepMax = 300 - 1

function toSceneStep(instance: sqInstance, stepOption: OptionValue): number | null {
	const step = Number(stepOption)
	if (StepMin <= step && step <= StepMax) {
		return step
	}

	instance.log('error', `Attempting to step an invalid amount ${repr(stepOption)}, ignoring`)
	return null
}

/**
 * Generate action definitions for modifying the mixer's current scene.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @returns
 *   The set of all scene action definitions.
 */
export function sceneActions(instance: sqInstance, mixer: Mixer): CompanionActionDefinitions<SceneActions> {
	const model = mixer.model

	return {
		[SceneActionId.SceneRecall]: {
			name: 'Recall scene',
			options: [
				{
					type: 'number',
					label: 'Scene nr.',
					id: SceneNumberOptionId,
					default: 1,
					min: 1,
					max: model.scenes,
					asInteger: true,
					expressionDescription: `Expression must evaluate to an integer between 1 and ${model.scenes}`,
				},
			],
			callback: async ({ options }) => {
				const scene = toScene(instance, model, options[SceneNumberOptionId])
				if (scene === null) {
					return
				}
				mixer.setScene(scene)
			},
		},

		[SceneActionId.SceneStep]: {
			name: 'Scene step',
			options: [
				{
					type: 'number',
					label: 'Scene +/-',
					id: SceneAdjustOptionId,
					default: 1,
					asInteger: true,
					min: StepMin,
					max: StepMax,
					expressionDescription: `Expression should evaluate to the integer to add/subtract to the current scene`,
				},
			],
			callback: async ({ options }) => {
				const adjust = toSceneStep(instance, options[SceneAdjustOptionId])
				if (adjust === null) {
					return
				}
				mixer.stepSceneBy(adjust)
			},
		},
	}
}
