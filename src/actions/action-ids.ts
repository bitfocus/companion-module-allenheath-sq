import type { CompanionActionDefinition } from '@companion-module/base'
import type { AssignActionId } from './assign.js'
import type { LevelActionId } from './level.js'
import type { MuteActionId } from './mute.js'
import type { OutputActionId } from './output.js'
import type { PanBalanceActionId } from './pan-balance.js'
import type { SceneActionId } from './scene.js'
import type { SoftKeyId } from './softkey.js'

/**
 * The type of action definitions for all actions within the specified action
 * set.
 */
export type ActionDefinitions<ActionSet extends string> = {
	[actionId in ActionSet]: CompanionActionDefinition
}

/** All action IDs. */
export type ActionId =
	| MuteActionId
	| AssignActionId
	| SceneActionId
	| SoftKeyId
	| LevelActionId
	| PanBalanceActionId
	| OutputActionId
