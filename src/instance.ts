// Allen & Heath SQ Series

import {
	type CompanionVariableValue,
	InstanceBase,
	InstanceStatus,
	type SomeCompanionConfigField,
} from '@companion-module/base'
import { getActions } from './actions/actions.js'
import { OutputActionId } from './actions/output.js'
import { Choices } from './choices.js'
import { GetConfigFields, type SQInstanceConfig } from './config.js'
import { getFeedbacks } from './feedbacks/feedbacks.js'
import type { NRPNIncDecMessage } from './midi/session.js'
import { Mixer, RetrieveStatusAtStartup } from './mixer/mixer.js'
import type { Model } from './mixer/model.js'
import { computeEitherParameters } from './mixer/parameters.js'
import { canUpdateOptionsWithoutRestarting, noConnectionOptions, optionsFromConfig } from './options.js'
import { getPresets } from './presets.js'
import { sleep } from './utils/sleep.js'
import { CurrentSceneId, getVariables, SceneRecalledTriggerId } from './variables.js'

/** An SQ mixer connection instance. */
export class sqInstance extends InstanceBase<SQInstanceConfig> {
	/** Options dictating the behavior of this instance. */
	options = noConnectionOptions()

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
			this.mixer.stop(InstanceStatus.Disconnected)
			this.mixer = null
		}
	}

	override async init(config: SQInstanceConfig, _isFirstInit: boolean): Promise<void> {
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
	initVariableDefinitions(model: Model): void {
		this.setVariableDefinitions(getVariables(model))

		this.setVariableValues({
			[SceneRecalledTriggerId]: 0,

			// This value may very well be wrong, but there's no defined way to
			// query what the current scene is, nor to be updated if it changes
			// and this module didn't do it.
			[CurrentSceneId]: 1,
		})
	}

	override async configUpdated(config: SQInstanceConfig): Promise<void> {
		const oldOptions = this.options

		const newOptions = optionsFromConfig(config)
		this.options = newOptions

		if (canUpdateOptionsWithoutRestarting(oldOptions, newOptions)) {
			const label = this.label
			if (label !== this.#lastLabel) {
				// The instance label might be altered just before
				// `configUpdated` is called.  The instance label is used in the
				// "Learn" operation for some actions -- and it'll always be
				// up-to-date in these uses.  But it's also hardcoded in some
				// presets, so if the label changes, we must redefine presets
				// even if we don't have to restart the connection.
				this.#lastLabel = label
				// XXX This assertion is actually wrong...
				this.setPresetDefinitions(getPresets(this, this.mixer!.model))
			}
			return
		}

		this.mixer?.stop(InstanceStatus.Disconnected)

		const mixer = new Mixer(this)
		this.mixer = mixer

		const model = mixer.model

		const choices = new Choices(model)

		this.initVariableDefinitions(model)
		this.setActionDefinitions(getActions(this, mixer, choices))
		this.setFeedbackDefinitions(getFeedbacks(mixer, choices))

		this.#lastLabel = this.label
		this.setPresetDefinitions(getPresets(this, model))

		//this.checkVariables();
		this.checkFeedbacks()

		const host = newOptions.host
		if (host === null) {
			mixer.stop(InstanceStatus.BadConfig)
		} else {
			mixer.start(host)
		}
	}

	// DEPRECATED BELOW HERE

	getLevel(
		ch: number,
		mx: number,
		ct: number,
		oMB: readonly [number, number],
		oLB: readonly [number, number],
	): {
		readonly commands: readonly [NRPNIncDecMessage]
		readonly channel: [number, number]
	} {
		const { MSB, LSB } = computeEitherParameters(ch, mx, ct, { MSB: oMB[1], LSB: oLB[1] }, { MSB: oMB[0], LSB: oLB[0] })

		// XXX Assert non-null to get it working for now.
		const mixer = this.mixer!

		return {
			commands: [mixer.getNRPNValue(MSB, LSB)],
			channel: [MSB, LSB],
		}
	}

	getRemoteLevel(): void {
		// XXX Assert non-null to get it working for now.
		const mixer = this.mixer!

		const model = mixer.model

		const buff = []

		model.forEach('inputChannel', (channel) => {
			model.forEachMixAndLR((mix) => {
				const rsp = this.getLevel(channel, mix, model.inputOutputCounts.mix, [0x40, 0x40], [0, 0x44])
				buff.push(rsp.commands[0])
			})
			model.forEach('fxSend', (fxs) => {
				const rsp = this.getLevel(channel, fxs, model.inputOutputCounts.fxSend, [0, 0x4c], [0, 0x14])
				buff.push(rsp.commands[0])
			})
		})

		model.forEach('group', (group) => {
			model.forEachMixAndLR((mix) => {
				const rsp = this.getLevel(group, mix, model.inputOutputCounts.mix, [0x40, 0x45], [0x30, 0x04])
				buff.push(rsp.commands[0])
			})
			model.forEach('fxSend', (fxs) => {
				const rsp = this.getLevel(group, fxs, model.inputOutputCounts.fxSend, [0, 0x4d], [0, 0x54])
				buff.push(rsp.commands[0])
			})
			model.forEach('matrix', (matrix) => {
				const rsp = this.getLevel(group, matrix, model.inputOutputCounts.matrix, [0, 0x4e], [0, 0x4b])
				buff.push(rsp.commands[0])
			})
		})

		model.forEach('fxReturn', (fxr) => {
			model.forEachMixAndLR((mix) => {
				const rsp = this.getLevel(fxr, mix, model.inputOutputCounts.mix, [0x40, 0x46], [0x3c, 0x14])
				buff.push(rsp.commands[0])
			})
			model.forEach('group', (group) => {
				const rsp = this.getLevel(fxr, group, model.inputOutputCounts.group, [0, 0x4b], [0, 0x34])
				buff.push(rsp.commands[0])
			})
			model.forEach('fxSend', (fxs) => {
				const rsp = this.getLevel(fxr, fxs, model.inputOutputCounts.fxSend, [0, 0x4e], [0, 0x04])
				buff.push(rsp.commands[0])
			})
		})

		model.forEach('matrix', (matrix) => {
			const rsp = this.getLevel(0, matrix, model.inputOutputCounts.matrix, [0, 0x4e], [0, 0x24])
			buff.push(rsp.commands[0])
		})

		model.forEach('mix', (mix) => {
			model.forEach('matrix', (matrix) => {
				const rsp = this.getLevel(mix, matrix, model.inputOutputCounts.matrix, [0, 0x4e], [0, 0x27])
				buff.push(rsp.commands[0])
			})
		})

		{
			const tmp = []
			tmp.push({ label: `LR`, id: 0 })
			model.forEach('mix', (mix, mixLabel) => {
				tmp.push({ label: mixLabel, id: mix + 1 })
			})
			model.forEach('fxSend', (fxs, fxsLabel) => {
				tmp.push({ label: fxsLabel, id: fxs + 1 + model.inputOutputCounts.mix })
			})
			model.forEach('matrix', (matrix, matrixLabel) => {
				tmp.push({ label: matrixLabel, id: matrix + 1 + model.inputOutputCounts.mix + model.inputOutputCounts.fxSend })
			})
			for (let j = 0; j < tmp.length; j++) {
				const rsp = this.getLevel(tmp[j].id, 99, 0, [0x4f, 0], [0, 0])
				buff.push(rsp.commands[0])
			}
		}

		model.forEach('dca', (dca) => {
			const rsp = this.getLevel(dca, 99, 0, [0x4f, 0], [0x20, 0])
			buff.push(rsp.commands[0])
		})

		const delayStatusRetrieval = this.options.retrieveStatusAtStartup === RetrieveStatusAtStartup.Delayed

		if (buff.length > 0 && mixer.midi.socket !== null) {
			let ctr = 0
			for (let i = 0; i < buff.length; i++) {
				mixer.midi.send(buff[i])
				ctr++
				if (delayStatusRetrieval) {
					if (ctr === 20) {
						ctr = 0
						sleep(300)
					}
				}
			}
		}

		this.subscribeActions('chpan_to_mix')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		this.subscribeActions('grppan_to_mix')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		this.subscribeActions('fxrpan_to_mix')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		this.subscribeActions('fxrpan_to_grp')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		this.subscribeActions('mixpan_to_mtx')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		this.subscribeActions('grppan_to_mtx')
		if (delayStatusRetrieval) {
			sleep(300)
		}
		this.subscribeActions(OutputActionId.LRPanBalanceOutput)
		this.subscribeActions(OutputActionId.MixPanBalanceOutput)
		this.subscribeActions(OutputActionId.MatrixPanBalanceOutput)
	}
}
