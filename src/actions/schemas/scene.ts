import type { Equal, Expect } from 'type-testing'

/** Action IDs for all actions that change the mixer's current scene. */
export const SceneActionId = {
	SceneRecall: 'scene_recall',
	SceneStep: 'scene_step',
} as const

export type SceneActionId = (typeof SceneActionId)[keyof typeof SceneActionId]

export const SceneNumberOptionId = 'scene'
export const SceneAdjustOptionId = 'scene' // XXX probably should rename this for clarity

/** Scene-related actions. */
export type SceneActions = {
	[SceneActionId.SceneRecall]: {
		options: {
			[SceneNumberOptionId]: number
		}
	}
	[SceneActionId.SceneStep]: {
		options: {
			[SceneAdjustOptionId]: number
		}
	}
}

type assert_AllSceneActionsAccountedFor = Expect<Equal<keyof SceneActions, SceneActionId>>
