import {
	type CompanionMigrationAction,
	type CompanionStaticUpgradeProps,
	type CompanionStaticUpgradeResult,
	type CompanionStaticUpgradeScript,
	type CompanionUpgradeContext,
	EmptyUpgradeScript,
} from '@companion-module/base'
import {
	convertOldLevelToOutputActionToSinkSpecific,
	convertOldPanToOutputActionToSinkSpecific,
	isOldLevelToOutputAction,
	isOldPanToOutputAction,
} from './actions/output.js'
import { tryCoalesceSceneRecallActions } from './actions/scene.js'
import {
	configUnnecessarilySpecifiesLabel,
	removeLabelOptionFromConfig,
	type SQInstanceConfig,
	tryEnsureLabelInConfig,
	tryEnsureModelOptionInConfig,
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

/**
 * Adjusting the level of various mixer sinks that can be assigned to physical
 * mixer outputs used to be done in one "Fader level to output" action.  One of
 * its options was a laundry list of all sinks (LR/mix/FX send/matrix/DCA) that
 * could be assigned to physical mixer outputs.  Each option value corresponded
 * exactly to the necessary offset from an NRPN base for all level-output NRPNs.
 * This meshed with internal fading logic but introduced a conceptual hurdle --
 * and prevented sensibly exposing output-level-modifying functionality in
 * `Mixer` without replicating the peculiar NRPN calculations.
 *
 * For clarity, and to reduce this NRPN encoding dependence, this action was
 * split into one action per sink category: separate "LR fader level to output",
 * "Mix fader level to output", &c. actions.  Each action identifies its sink
 * the normal way sources and sinks are identified, i.e. with a number in
 * `[0, sinkCount)` for sinks 1 to N.
 *
 * This upgrade script rewrites old-style "level to output" actions to new,
 * sink-type-specific actions.
 */
function RewriteCombinedOutputLevelActionsToSinkSpecificOutputLevelActions(
	_context: CompanionUpgradeContext<SQInstanceConfig>,
	props: CompanionStaticUpgradeProps<SQInstanceConfig>,
): CompanionStaticUpgradeResult<SQInstanceConfig> {
	const result: CompanionStaticUpgradeResult<SQInstanceConfig> = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (isOldLevelToOutputAction(action)) {
			convertOldLevelToOutputActionToSinkSpecific(action)

			result.updatedActions.push(action)
		}
	}

	return result
}

/**
 * Adjusting the level of various mixer sinks that can be assigned to physical
 * mixer outputs used to be done in one "Fader level to output" action.  One of
 * its options was a laundry list of all sinks (LR/mix/FX send/matrix/DCA) that
 * could be assigned to physical mixer outputs.  Each option value corresponded
 * exactly to the necessary offset from an NRPN base for all level-output NRPNs.
 * This meshed with internal fading logic but introduced a conceptual hurdle --
 * and prevented sensibly exposing output-level-modifying functionality in
 * `Mixer` without replicating the peculiar NRPN calculations.
 *
 * For clarity, and to reduce this NRPN encoding dependence, this action was
 * split into one action per sink category: separate "LR fader level to output",
 * "Mix fader level to output", &c. actions.  Each action identifies its sink
 * the normal way sources and sinks are identified, i.e. with a number in
 * `[0, sinkCount)` for sinks 1 to N.
 *
 * This upgrade script rewrites old-style "level to output" actions to new,
 * sink-type-specific actions.
 */
function RewriteCombinedOutputPanBalanceActionsToSinkSpecificOutputPanBalanceActions(
	_context: CompanionUpgradeContext<SQInstanceConfig>,
	props: CompanionStaticUpgradeProps<SQInstanceConfig>,
): CompanionStaticUpgradeResult<SQInstanceConfig> {
	const result: CompanionStaticUpgradeResult<SQInstanceConfig> = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	for (const action of props.actions) {
		if (isOldPanToOutputAction(action)) {
			convertOldPanToOutputActionToSinkSpecific(action)

			result.updatedActions.push(action)
		}
	}

	return result
}

/**
 * This module used to have a `'label'` option, in which the user was expected
 * to (re-)specify the instance label.  This label was then used in the "Learn"
 * operation for various actions, as well as in various preset definitions.
 *
 * But it turns out the instance label is accessible as `InstanceBase.label`
 * which is always up-to-date, so there's no point in having the config option.
 *
 * This upgrade script removes the `'label'` option from configs that have it.
 */
function RemoveUnnecessaryConnectionLabel(
	_context: CompanionUpgradeContext<SQInstanceConfig>,
	props: CompanionStaticUpgradeProps<SQInstanceConfig>,
): CompanionStaticUpgradeResult<SQInstanceConfig> {
	const result: CompanionStaticUpgradeResult<SQInstanceConfig> = {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}

	const oldConfig = props.config
	if (configUnnecessarilySpecifiesLabel(oldConfig)) {
		removeLabelOptionFromConfig(oldConfig)
		result.updatedConfig = oldConfig
	}

	return result
}

export const UpgradeScripts = [
	EmptyUpgradeScript,
	ActionUpdater(tryCoalesceSceneRecallActions),
	ConfigUpdater(tryEnsureModelOptionInConfig),
	ConfigUpdater(tryEnsureLabelInConfig),
	RewriteCombinedOutputLevelActionsToSinkSpecificOutputLevelActions,
	RewriteCombinedOutputPanBalanceActionsToSinkSpecificOutputPanBalanceActions,
	// ...yes, we added the `'label'` config option above because we thought it
	// was the only way to get the instance label, and now we're removing it
	// because there in fact *is* a way to get that label without requiring that
	// users redundantly specify it.  So it goes.
	RemoveUnnecessaryConnectionLabel,
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
