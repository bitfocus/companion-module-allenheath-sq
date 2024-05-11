// Allen & Heath SQ Series

import { InstanceBase, InstanceStatus, runEntrypoint } from '@companion-module/base'
import { UpgradeScripts } from './src/upgrades.js'

import { GetConfigFields } from './src/config.js'

import { getActions } from './src/actions.js'
import { getFeedbacks } from './src/feedbacks.js'
import { getVariables } from './src/variables.js'
import { getPresets } from './src/presets.js'

import api from './src/api.js'

import { Choices } from './src/choices.js'
import { Model } from './src/mixer/model.js'
import { dBToDec, decTodB } from './src/utils.js'

class sqInstance extends InstanceBase {
	model

	fdbState = {}
	lastValue = {}
	mch = 0xb0

	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...api,
		})
	}

	dBToDec(lv, typ = this.config.level) {
		return dBToDec(lv, typ)
	}

	decTodB(VC, VF, typ = this.config.level) {
		return decTodB(VC, VF, typ)
	}

	async destroy() {
		if (this.midiSocket !== undefined) {
			this.midiSocket.destroy()
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	getConfigFields() {
		return GetConfigFields()
	}

	async configUpdated(config) {
		this.config = config

		this.setVariableValues({
			currentScene: 1,
		})

		this.mch = parseInt('0xB' + (this.config.midich - 1).toString(16))

		this.updateStatus(InstanceStatus.Connecting)

		const model = new Model(config.model)
		this.model = model

		const choices = new Choices(model)

		this.setActionDefinitions(getActions(this, choices, config.label))
		this.setFeedbackDefinitions(getFeedbacks(this, choices))
		this.setVariableDefinitions(getVariables(this, model))
		this.setPresetDefinitions(getPresets(this, model, config.talkback))

		//this.checkVariables();
		this.checkFeedbacks()

		this.initTCP()
	}
}

runEntrypoint(sqInstance, UpgradeScripts)
