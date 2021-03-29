const level      = require('./level.json')

module.exports = {
	addUpgradeScripts : function() {
		var self = this

		// From version 1.2.7 => 1.3.0
		self.addUpgradeScript((config, actions, releaseActions, feedbacks) => {
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

			for (let k in releaseActions) {
				changed = checkUpgrade(releaseActions[k], changed)
			}

			return changed
		})

		// From version 1.3.2 => 1.3.3
		self.addUpgradeScript((config, actions, releaseActions, feedbacks) => {
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

			for (let k in releaseActions) {
				changed = checkUpgrade(releaseActions[k], changed)
			}

			return changed
		})

		// From version 1.3.3 => 1.3.4
		self.addUpgradeScript((config, actions, releaseActions, feedbacks) => {
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
						if ( 'level' in action.options ) {
							if ( action.options.level < 998){
								action.options.leveldb = level[self.config.level][action.options.level][0]
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
								action.options.leveldb = level[self.config.level][action.options.level][0]
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

			for (let k in releaseActions) {
				changed = checkUpgrade(releaseActions[k], changed)
			}

			return changed
		})
	},
}
