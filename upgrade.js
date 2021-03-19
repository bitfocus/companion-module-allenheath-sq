module.exports = {
	addUpgradeScripts : function() {
		// From version 1.3.2 => 1.3.3
		this.addUpgradeScript((config, actions, releaseActions, feedbacks) => {
			let checkUpgrade = ((action) => {
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
						break;
				}
			})

			for (let k in actions) {
				checkUpgrade(actions[k])
			}

			for (let k in releaseActions) {
				checkUpgrade(releaseActions[k])
			}

			return true
		})
	}
}
