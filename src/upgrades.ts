import type {
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionUpgradeContext,
} from '@companion-module/base'
import { configIsMissingModel, type SQInstanceConfig } from './config.js'
import { DefaultModel } from './mixer/models.js'

/**
 * A do-nothing upgrade script.
 *
 * Because Companion records last-upgrade-performed status by index into the
 * `UpgradeScripts` array, this function can't be deleted even though it does
 * nothing.
 */
function DummyUpgradeScript(
	_context: CompanionUpgradeContext<SQInstanceConfig>,
	_props: CompanionStaticUpgradeProps<SQInstanceConfig>,
): CompanionStaticUpgradeResult<SQInstanceConfig> {
	return {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}
}

/**
 * This module once supported 'scene_recall' and 'current_scene' actions that
 * were exactly identical (other than in actionId and the name for each visible
 * in UI).  Rewrite the latter sort of action to instead encode the former.
 */
function CoalesceSceneRecallActions(
	_context: CompanionUpgradeContext<SQInstanceConfig>,
	props: CompanionStaticUpgradeProps<SQInstanceConfig>,
): CompanionStaticUpgradeResult<SQInstanceConfig> {
	const result: CompanionStaticUpgradeResult<SQInstanceConfig> = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (action.actionId === 'current_scene') {
			action.actionId = 'scene_recall'

			result.updatedActions.push(action)
		}
	}

	return result
}

/**
 * Ensure a 'model' property is present in configs that lack it.
 */
function EnsureModel(
	_context: CompanionUpgradeContext<SQInstanceConfig>,
	props: CompanionStaticUpgradeProps<SQInstanceConfig>,
): CompanionStaticUpgradeResult<SQInstanceConfig> {
	const result: CompanionStaticUpgradeResult<SQInstanceConfig> = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const oldConfig = props.config
	if (configIsMissingModel(oldConfig)) {
		oldConfig.model = DefaultModel
		result.updatedConfig = oldConfig
	}

	return result
}

export const UpgradeScripts = [
	DummyUpgradeScript,
	CoalesceSceneRecallActions,
	EnsureModel,
	// placeholder comment to force array contents to format one entry per line
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
