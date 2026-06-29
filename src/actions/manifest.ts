import type { OutputLevelActionId, OutputLevelActions } from './output/schemas/level.js'
import type { OutputPanBalanceActionId, OutputPanBalanceActions } from './output/schemas/pan-balance.js'
import type { AssignActionId, AssignActions } from './schemas/assign.js'
import type { LevelActionId, LevelActions } from './schemas/level.js'
import type { MuteActionId, MuteActions } from './schemas/mute.js'
import type { PanBalanceActionId, PanBalanceActions } from './schemas/pan-balance.js'
import type { SceneActionId, SceneActions } from './schemas/scene.js'
import type { SoftKeyActionId, SoftKeyActions } from './schemas/softkey.js'

/** All action IDs. */
export type ActionId =
	| MuteActionId
	| AssignActionId
	| SceneActionId
	| SoftKeyActionId
	| LevelActionId
	| PanBalanceActionId
	| OutputLevelActionId
	| OutputPanBalanceActionId

/** All mixer actions. */
export type SQActions = AssignActions &
	LevelActions &
	MuteActions &
	OutputLevelActions &
	OutputPanBalanceActions &
	PanBalanceActions &
	SceneActions &
	SoftKeyActions
