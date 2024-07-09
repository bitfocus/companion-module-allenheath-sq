// Allen & Heath SQ Series

import { InstanceBase, InstanceStatus } from '@companion-module/base'

import { GetConfigFields } from './config.js'

import { getActions } from './actions/actions.js'
import { getFeedbacks } from './feedbacks/feedbacks.js'
import { getVariables } from './variables.js'
import { getPresets } from './presets.js'

import api from './api.js'

import { Choices } from './choices.js'
import { Mixer } from './mixer/mixer.js'

/**
 * Convert the fader law option value to a properly-typed value.
 *
 * @param {import('@companion-module/base').InputValue | undefined} faderLawOpt
 * @returns {import('./mixer/mixer.js').FaderLaw}
 */
function toFaderLaw(faderLawOpt) {
	const law = String(faderLawOpt)
	switch (law) {
		case 'LinearTaper':
		case 'AudioTaper':
			return law
		default:
			return 'LinearTaper'
	}
}

export class sqInstance extends InstanceBase {
	config

	/** @type {?Mixer} */
	mixer = null

	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...api,
		})
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
			mixer.start(config.host, config.midich - 1, toFaderLaw(config.level), config.status, config.verbose)
		} else {
			mixer.stop(InstanceStatus.BadConfig)
		}
	}
}
