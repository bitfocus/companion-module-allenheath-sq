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

/*
const level      = require('./level.json')

module.exports = [
	// From version 1.2.7 => 1.3.0
	function(context, config, actions, feedbacks) {
		let changed = false

		let checkUpgrade = (action, changed) => {
			if (action.action.slice(0 ,4) == 'mute') {
				if (action.options.mute === true) {
					action.options.mute = 1
					changed = true
				} else if (action.options.mute === false) {
					action.options.mute = 2
					changed = true
				}
			}

			return changed
		}

		for (let k in actions) {
			changed = checkUpgrade(actions[k], changed)
		}

		return changed
	},

	// From version 1.3.2 => 1.3.3
	function(context, config, actions, feedbacks) {
		let changed = false

		let checkUpgrade = (action, changed) => {
			switch (action.action) {
				case 'chlev_to_mix':
				case 'grplev_to_mix':
				case 'fxrlev_to_mix':
				case 'fxrlev_to_grp':
				case 'chlev_to_fxs':
				case 'grplev_to_fxs':
				case 'fxslev_to_fxs':
				case 'mixlev_to_mtx':
				case 'grplev_to_mtx':
				case 'level_to_output':
					if ( action.options.fade == undefined ) {
						action.options.fade = 0
						changed = true
					}
					break
			}

			return changed
		}

		for (let k in actions) {
			changed = checkUpgrade(actions[k], changed)
		}

		return changed
	},

	// From version 1.3.3 => 1.3.4
	function(context, config, actions, feedbacks) {
		let changed = false

		const configLevel = config ? config.level : 'LinearTaper' // We dont always have a value but need something

		let checkUpgrade = (action, changed) => {
			switch (action.action) {
				case 'chlev_to_mix':
				case 'grplev_to_mix':
				case 'fxrlev_to_mix':
				case 'fxrlev_to_grp':
				case 'chlev_to_fxs':
				case 'grplev_to_fxs':
				case 'fxslev_to_fxs':
				case 'mixlev_to_mtx':
				case 'grplev_to_mtx':
				case 'level_to_output':
					if ( 'level' in action.options ) {
						if ( action.options.level < 998){
							action.options.leveldb = level[configLevel][action.options.level][0]
						} else {
							action.options.leveldb = action.options.level
						}
						delete action.options.level
						changed = true
					}
					break

				case 'chpan_to_mix':
				case 'grppan_to_mix':
				case 'fxrpan_to_mix':
				case 'fxrpan_to_grp':
				case 'mixpan_to_mtx':
				case 'grppan_to_mtx':
				case 'pan_to_output':
					if ( 'level' in action.options ) {
						if ( action.options.level < 998){
							action.options.leveldb = level[configLevel][action.options.level][0]
						}

						delete action.options.level
						changed = true
					}
					break
			}

			return changed
		}

		for (let k in actions) {
			changed = checkUpgrade(actions[k], changed)
		}

		return changed
	},

	// From version 1.3.4 => 1.3.5
	function(context, config, actions, feedbacks) {
		let changed = false

		if (config) {
			config.status = (typeof config.status == 'undefined' || config.status == '') ? 'full' : config.status
			config.midich = (typeof config.midich == 'undefined' || isNaN(parseInt(config.midich))) ? 1 : config.midich
			changed = true
		}

		return changed
	},
]
*/
