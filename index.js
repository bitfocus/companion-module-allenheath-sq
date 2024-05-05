// Allen & Heath SQ Series

import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import { UpgradeScripts } from './src/upgrades.js'

import config from './src/config.js'

import actions from './src/actions.js'
import feedbacks from './src/feedbacks.js'
import variables from './src/variables.js'
import presets from './src/presets.js'

import utils from './src/utils.js'
import api from './src/api.js'

import level from './src/level.js'
import callback from './src/callback.js'
import sqconfig from './src/sqconfig.js'

class sqInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
			...api,
			...level,
			...callback,
			...sqconfig,
		})

		this.fdbState = {}
		this.lastValue = {}

		this.mch = 0xb0
	}

	async destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		this.setVariableValues({
			currentScene: 1,
		})

		if (this.config.model === undefined) {
			this.config.model = 'SQ7'
		}

		this.mch = parseInt('0xB' + (this.config.midich - 1).toString(16))

		this.updateStatus(InstanceStatus.Connecting)

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
		this.initPresets()

		//this.checkVariables();
		this.checkFeedbacks()

		this.initTCP()
	}
}

runEntrypoint(sqInstance, UpgradeScripts)
