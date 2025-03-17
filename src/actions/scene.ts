import type { CompanionMigrationAction } from '@companion-module/base'
import { type Model } from '../mixer/model.js'
import { type Mixer } from '../mixer/mixer.js'
import { type ActionDefinitions } from './actionid.js'
import type { sqInstance } from '../instance.js'
import { type OptionValue } from './to-source-or-sink.js'
import { repr } from '../utils/pretty.js'

/** Action IDs for all actions that change the mixer's current scene. */
export enum SceneActionId {
	SceneRecall = 'scene_recall',
	SceneStep = 'scene_step',
}

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
export function tryCoalesceSceneRecallActions(action: CompanionMigrationAction): boolean {
	if (action.actionId !== ObsoleteSetCurrentSceneId) {
		return false
	}

	action.actionId = SceneActionId.SceneRecall
	return true
}

function toScene(instance: sqInstance, model: Model, sceneOption: OptionValue): number | null {
	const scene = Number(sceneOption) - 1
	if (0 <= scene && scene < model.scenes) {
		return scene
	}

	instance.log('error', `Attempting to recall invalid scene ${repr(sceneOption)}, ignoring`)
	return null
}

const StepMin = -50
const StepMax = 50

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
export function sceneActions(instance: sqInstance, mixer: Mixer): ActionDefinitions<SceneActionId> {
	const model = mixer.model

	return {
		[SceneActionId.SceneRecall]: {
			name: 'Scene recall',
			options: [
				{
					type: 'number',
					label: 'Scene nr.',
					id: 'scene',
					default: 1,
					min: 1,
					max: model.scenes,
					required: true,
				},
			],
			callback: async ({ options }) => {
				const scene = toScene(instance, model, options.scene)
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
					id: 'scene',
					default: 1,
					min: StepMin,
					max: StepMax,
					required: true,
				},
			],
			callback: async ({ options }) => {
				const adjust = toSceneStep(instance, options.scene)
				if (adjust === null) {
					return
				}
				mixer.stepSceneBy(adjust)
			},
		},
	}
}
