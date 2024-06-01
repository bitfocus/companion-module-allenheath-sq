// Allen & Heath SQ Series

import { InstanceBase, InstanceStatus } from '@companion-module/base'

import { GetConfigFields } from './config.js'

import { getActions } from './actions.js'
import { getFeedbacks } from './feedbacks.js'
import { getVariables } from './variables.js'
import { getPresets } from './presets.js'

import api from './api.js'

import { Choices } from './choices.js'
import { Mixer } from './mixer/mixer.js'
import { dBToDec, decTodB } from './utils.js'

export class sqInstance extends InstanceBase {
	config

	/** @type {?Mixer} */
	mixer = null

	lastValue = {}

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
		if (this.mixer !== null) {
			this.mixer.stop(InstanceStatus.Disconnected)
			this.mixer = null
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	getConfigFields() {
		return GetConfigFields()
	}

	async configUpdated(config) {
		this.mixer?.stop(InstanceStatus.Disconnected)

		const mixer = new Mixer(this, config.model)
		this.mixer = mixer

		const model = mixer.model

		this.config = config

		this.setVariableValues({
			currentScene: 1,
		})

		const choices = new Choices(model)

		this.setActionDefinitions(getActions(this, mixer, choices, config.label))
		this.setFeedbackDefinitions(getFeedbacks(mixer, choices))
		this.setVariableDefinitions(getVariables(this, model))
		this.setPresetDefinitions(getPresets(this, model, config.talkback))

		//this.checkVariables();
		this.checkFeedbacks()

		if (config.host) {
			mixer.start(config.host, config.midich - 1, config.status, config.verbose)
		} else {
			mixer.stop(InstanceStatus.BadConfig)
		}
	}
}
