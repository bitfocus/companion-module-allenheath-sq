// Allen & Heath SQ Series

import { type CompanionVariableValue, InstanceBase, type SomeCompanionConfigField } from '@companion-module/base'
import { getActions } from './actions/actions.js'
import { Choices } from './choices.js'
import { GetConfigFields, type RawConfig } from './config.js'
import { getFeedbacks } from './feedbacks/feedbacks.js'
import { Mixer } from './mixer/mixer.js'
import { canUpdateConfigWithoutRestarting, noConnectionConfig, validateConfig } from './config.js'
import { getPresets } from './presets.js'
import { CurrentSceneId, getVariables, SceneRecalledTriggerId } from './variables.js'

/** An SQ mixer connection instance. */
export class sqInstance extends InstanceBase<RawConfig> {
	/** Configuration dictating the behavior of this instance. */
	config = noConnectionConfig()

	/**
	 * The mixer being manipulated by this instance if one has been identified.
	 */
	mixer: Mixer | null = null

	/**
	 * The last label specified for this instance, or `null` if there wasn't a
	 * last label.
	 */
	#lastLabel: string | null = null

	override async destroy(): Promise<void> {
		if (this.mixer !== null) {
			this.mixer.stop('Module connection destroyed')
			this.mixer = null
		}
	}

	override async init(config: RawConfig, _isFirstInit: boolean): Promise<void> {
		void this.configUpdated(config)
	}

	override getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Set the value of a variable that doesn't exist when this instance is
	 * initialized, but only is brought into existence if/when it is needed.
	 *
	 * @param variableId
	 *   The id of the variable, i.e. the part that appears to right of the
	 *   colon in `$(SQ:ident)`.
	 * @param _name
	 *   A user-exposed description of the variable.
	 * @param variableValue
	 *   The value of the variable.
	 */
	setExtraVariable(variableId: string, _name: string, variableValue: CompanionVariableValue): void {
		// The name of this potentially newly-defined variable is currently not
		// used.  If we wanted to, we could redefine the entire variable set
		// (with this new variable included), to expose this new variable in
		// UI (for example, in variable autocomplete in text fields that support
		// variables).  But that's a large amount of churn for just a single
		// variable, with quadratically increasing cost (define N variables,
		// define N + 1 variables, define N + 2 variables...).  So for now we
		// use `disableVariableValidation` to add the variable without all that
		// extra support.  Perhaps Companion itself will grow an API to define
		// individual extra variables, and then we can use the name in that API.

		const { instanceOptions } = this
		const { disableVariableValidation: oldValue } = instanceOptions
		try {
			instanceOptions.disableVariableValidation = true

			this.setVariableValues({
				[variableId]: variableValue,
			})
		} finally {
			instanceOptions.disableVariableValidation = oldValue
		}
	}

	/** Set variable definitions for this instance. */
	initVariableDefinitions(mixer: Mixer): void {
		this.setVariableDefinitions(getVariables(mixer.model))

		this.setVariableValues({
			[SceneRecalledTriggerId]: mixer.sceneRecalledTrigger,

			// This value may very well be wrong, but there's no defined way to
			// query what the current scene is, nor to be updated if it changes
			// and this module didn't do it.
			[CurrentSceneId]: 1,
		})
	}

	override async configUpdated(newConfig: RawConfig): Promise<void> {
		const oldConfig = this.config

		validateConfig(newConfig)
		this.config = newConfig

		if (this.mixer !== null) {
			if (canUpdateConfigWithoutRestarting(oldConfig, newConfig)) {
				const label = this.label
				if (label !== this.#lastLabel) {
					// The instance label might be altered just before
					// `configUpdated` is called.  The instance label is used in the
					// "Learn" operation for some actions -- and it'll always be
					// up-to-date in these uses.  But it's also hardcoded in some
					// presets, so if the label changes, we must redefine presets
					// even if we don't have to restart the connection.
					this.#lastLabel = label
					this.setPresetDefinitions(getPresets(this, this.mixer.model))
				}
				return
			}

			this.mixer.stop('Mixer connection restarting for configuration update...')
		}

		const mixer = new Mixer(this)
		this.mixer = mixer

		const model = mixer.model

		const choices = new Choices(model)

		this.initVariableDefinitions(mixer)
		this.setActionDefinitions(getActions(this, mixer, choices))
		this.setFeedbackDefinitions(getFeedbacks(mixer, choices))

		this.#lastLabel = this.label
		this.setPresetDefinitions(getPresets(this, model))

		//this.checkVariables();
		this.checkFeedbacks()

		mixer.start(newConfig.host)
	}
}
