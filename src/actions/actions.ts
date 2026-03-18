import { type CompanionActionDefinition, type CompanionInputFieldDropdown } from '@companion-module/base'
import { type ActionDefinitions, type ActionId } from './actionid.js'
import { assignActions } from './assign.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { levelActions } from './level.js'
import { type Mixer } from '../mixer/mixer.js'
import { muteActions } from './mute.js'
import { outputLevelActions, outputPanBalanceActions } from './output.js'
import { panBalanceActions } from './pan-balance.js'
import { resolveActionOptions } from './resolve-options.js'
import { sceneActions } from './scene.js'
import { softKeyActions } from './softkey.js'

type ActionInputField = NonNullable<CompanionActionDefinition['options']>[number]

function isVariableOverridableField(option: ActionInputField): option is ActionInputField & { id: string; label: string } {
	return (
		(option.type === 'dropdown' || option.type === 'number' || option.type === 'multidropdown') &&
		typeof option.id === 'string' &&
		typeof option.label === 'string'
	)
}

function withVariableOverrideInputs<ActionSet extends string>(
	actions: ActionDefinitions<ActionSet>,
): ActionDefinitions<ActionSet> {
	for (const actionId of Object.keys(actions) as ActionSet[]) {
		const action = actions[actionId]
		const { options } = action
		if (options === undefined) {
			continue
		}

		const extraOptions: ActionInputField[] = []
		for (const option of options) {
			if (!isVariableOverridableField(option)) {
				continue
			}

			extraOptions.push(
				{
					type: 'checkbox',
					id: `${option.id}__useVar`,
					label: `Use variable for ${option.label}`,
					default: false,
				},
				{
					type: 'textinput',
					id: `${option.id}_var`,
					label: `${option.label} variable/local variable`,
					default: '',
				},
			)
		}

		action.options = [...options, ...extraOptions]
	}

	return actions
}

function withResolvedActionOptions<ActionSet extends string>(
	instance: sqInstance,
	actions: ActionDefinitions<ActionSet>,
): ActionDefinitions<ActionSet> {
	for (const actionId of Object.keys(actions) as ActionSet[]) {
		const action = actions[actionId]
		const { callback } = action
		if (callback === undefined) {
			continue
		}

		const wrappedCallback: typeof callback = async (actionEvent, context) => {
			const options = await resolveActionOptions(instance, actionEvent.options)
			return callback({
				...actionEvent,
				options,
			}, context)
		}

		action.callback = wrappedCallback
	}

	return actions
}

/**
 * Get all action definitions exposed by this module.
 *
 * @param instance
 *   The instance for which definitions are being generated.
 * @param mixer
 *   The mixer in use by the instance.
 * @param choices
 *   Option choices for use in the actions.
 * @returns
 *   All actions defined by this module.
 */
export function getActions(instance: sqInstance, mixer: Mixer, choices: Choices): ActionDefinitions<ActionId> {
	const FadingOption: CompanionInputFieldDropdown = {
		type: 'dropdown',
		label: 'Fading',
		id: 'fade',
		default: 0,
		choices: [
			{ label: `Off`, id: 0 },
			{ label: `1s`, id: 1 },
			{ label: `2s`, id: 2 },
			{ label: `3s`, id: 3 },
			//{label: `4s`, id: 4}, //added
			//{label: `5s`, id: 5}, //added
			//{label: `10s`, id: 10}, //added
		],
		minChoicesForSearch: 0,
	}

	const LevelOption = {
		type: 'dropdown',
		label: 'Level',
		id: 'leveldb',
		default: 0,
		choices: choices.levels,
		minChoicesForSearch: 0,
	} as const

	const PanLevelOption = {
		type: 'dropdown',
		label: 'Level',
		id: 'leveldb',
		default: 'CTR',
		choices: choices.panLevels,
		minChoicesForSearch: 0,
	} as const

	const actions = {
		...muteActions(instance, mixer, choices),
		...(() => {
			const rotaryActions = {}
			if (mixer.model.rotaryKeys > 0) {
				// Soft Rotary
			} else {
				// No Soft Rotary
			}
			return rotaryActions
		})(),
		...softKeyActions(instance, mixer, choices),
		...assignActions(instance, mixer, choices),
		...levelActions(instance, mixer, choices, LevelOption, FadingOption),
		...panBalanceActions(instance, mixer, choices, PanLevelOption),
		...outputLevelActions(instance, mixer, choices, LevelOption, FadingOption),
		...outputPanBalanceActions(instance, mixer, choices, PanLevelOption),
		...sceneActions(instance, mixer),
	}

	withVariableOverrideInputs(actions)
	return withResolvedActionOptions(instance, actions)
}
