/**
 * A do-nothing upgrade script.
 *
 * Because Companion records last-upgrade-performed status by index into the
 * `UpgradeScripts` array, this function can't be deleted even though it does
 * nothing.
 * @param {import('@companion-module/base').CompanionUpgradeContext} _context
 * @param {import('@companion-module/base').CompanionStaticUpgradeProps} _props
 * @returns {import('@companion-module/base').CompanionStaticUpgradeResult}
 */
function DummyUpgradeScript(_context, _props) {
	return {
		updatedConfig: null,
		updatedActions: [],
		updatedFeedbacks: [],
	}
}

export const UpgradeScripts = [
	DummyUpgradeScript,
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
