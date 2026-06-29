import type { Level } from '../mixer/level.js'
import type { PanBalance } from '../types.js'

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

/** All module variables. */
export type SQVariables = {
	[SceneRecalledTriggerId]: number
	[CurrentSceneId]: number

	[level: `level_${number}.${number}`]: Level
	[panLevel: `pan_${number}.${number}`]: PanBalance
}
