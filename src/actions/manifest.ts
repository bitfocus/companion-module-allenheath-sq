import type { OutputLevelActions } from './output/schemas/level.js'
import type { OutputPanBalanceActions } from './output/schemas/pan-balance.js'
import type { AssignActions } from './schemas/assign.js'
import type { LevelActions } from './schemas/level.js'
import type { MuteActions } from './schemas/mute.js'
import type { PanBalanceActions } from './schemas/pan-balance.js'
import type { SceneActions } from './schemas/scene.js'
import type { SoftKeyActions } from './schemas/softkey.js'

/** All mixer actions. */
export type SQActions = AssignActions &
	LevelActions &
	MuteActions &
	OutputLevelActions &
	OutputPanBalanceActions &
	PanBalanceActions &
	SceneActions &
	SoftKeyActions
