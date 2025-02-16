import {
	type CompanionMigrationAction,
	type CompanionStaticUpgradeProps,
	type CompanionStaticUpgradeScript,
	type CompanionUpgradeContext,
	EmptyUpgradeScript,
} from '@companion-module/base'
import {
	tryConvertOldLevelToOutputActionToSinkSpecific,
	tryConvertOldPanToOutputActionToSinkSpecific,
} from './actions/output.js'
import { tryCoalesceSceneRecallActions } from './actions/scene.js'
import {
	type SQInstanceConfig,
	tryEnsureLabelInConfig,
	tryEnsureModelOptionInConfig,
	tryRemoveUnnecessaryLabelInConfig,
} from './config.js'

function ActionUpdater(
	tryUpdate: (action: CompanionMigrationAction) => boolean,
): CompanionStaticUpgradeScript<SQInstanceConfig> {
	return (
		_context: CompanionUpgradeContext<SQInstanceConfig>,
		props: CompanionStaticUpgradeProps<SQInstanceConfig>,
	) => {
		return {
			updatedActions: props.actions.filter(tryUpdate),
			updatedConfig: null,
			updatedFeedbacks: [],
		}
	}
}

function ConfigUpdater(
	tryUpdate: (config: SQInstanceConfig | null) => boolean,
): CompanionStaticUpgradeScript<SQInstanceConfig> {
	return (
		_context: CompanionUpgradeContext<SQInstanceConfig>,
		props: CompanionStaticUpgradeProps<SQInstanceConfig>,
	) => {
		return {
			updatedActions: [],
			updatedConfig: tryUpdate(props.config) ? props.config : null,
			updatedFeedbacks: [],
		}
	}
}

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
]
