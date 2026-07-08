import { type CompanionStaticUpgradeScript, EmptyUpgradeScript } from '@companion-module/base'
import { tryFixFXRLevelInFXSIdTypo } from '../actions/level.js'
import { tryMakeMuteItemOneIndexed, tryTrimMuteLROptions } from '../actions/mute.js'
import {
	tryConvertOldLevelToOutputActionToSinkSpecific,
	tryMakeOutputLevelItemOneIndexed,
} from '../actions/output/level.js'
import {
	tryConvertOldPanToOutputActionToSinkSpecific,
	tryMakeOutputPanBalanceItemOneIndexed,
} from '../actions/output/pan-balance.js'
import { tryCoalesceSceneRecallActions } from '../actions/scene.js'
import { tryMakeSoftKeyOneIndexed } from '../actions/softkey.js'
import {
	type SQConfig,
	tryEnsureLabelInConfig,
	tryEnsureModelOptionInConfig,
	tryRemoveUnnecessaryLabelInConfig,
	tryRenameVariousConfigIds,
} from '../config.js'
import { tryUpdateAllLRMixEncodings } from '../mixer/lr.js'
import { ActionUpdater, ConfigUpdater } from './updaters.js'

export const UpgradeScripts = [
	EmptyUpgradeScript,
	ActionUpdater(tryCoalesceSceneRecallActions),
	ConfigUpdater(tryEnsureModelOptionInConfig),
	ConfigUpdater(tryEnsureLabelInConfig),
	ActionUpdater(tryConvertOldLevelToOutputActionToSinkSpecific),
	ActionUpdater(tryConvertOldPanToOutputActionToSinkSpecific),
	// ...yes, we added the `'label'` config option above because we thought it
	// was the only way to get the instance label, and now we're removing it
	// because there in fact *is* a way to get that label without requiring that
	// users redundantly specify it.  So it goes.
	ConfigUpdater(tryRemoveUnnecessaryLabelInConfig),
	ActionUpdater(tryUpdateAllLRMixEncodings),
	ActionUpdater(tryFixFXRLevelInFXSIdTypo),
	ConfigUpdater(tryRenameVariousConfigIds),
	// Meticulously update every formerly zero-based option value to one-based,
	// because a great many options, in order to be selectable by expression, need
	// to be user-understandable.  Boo-urns!
	ActionUpdater(tryMakeSoftKeyOneIndexed),
	ActionUpdater(tryMakeMuteItemOneIndexed),
	ActionUpdater(tryTrimMuteLROptions),
	ActionUpdater(tryMakeOutputLevelItemOneIndexed),
	ActionUpdater(tryMakeOutputPanBalanceItemOneIndexed),
] satisfies CompanionStaticUpgradeScript<SQConfig>[]
