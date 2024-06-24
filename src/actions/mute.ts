import {
	type CompanionOptionValues,
	type CompanionInputFieldDropdown,
	type DropdownChoice,
} from '@companion-module/base'
import { type Mixer } from '../mixer/mixer.js'
import { type SQInstanceInterface as sqInstance } from '../instance-interface.js'
import { type Choices } from '../choices.js'
import { type ActionDefinitions, MuteActionId } from './action-ids.js'
import { type InputOutputType, type Model } from '../mixer/model.js'
import { MuteOperation } from '../mixer/mixer.js'

function StripOption(label: string, choices: DropdownChoice[]): CompanionInputFieldDropdown {
	return {
		type: 'dropdown',
		label,
		id: 'strip',
		default: 0,
		choices,
		minChoicesForSearch: 0,
	}
}

const MuteOption = {
	type: 'dropdown',
	label: 'Mute',
	id: 'mute',
	default: 0,
	choices: [
		{ label: 'Toggle', id: 0 },
		{ label: 'On', id: 1 },
		{ label: 'Off', id: 2 },
	],
} satisfies CompanionInputFieldDropdown

type MuteOptions = {
	strip: number
	op: MuteOperation
}

/**
 * Convert options for a mute action to well-typed values.
 *
 * @param instance
 *   The active module instance.
 * @param model
 *   The mixer model.
 * @param options
 *   Options passed for an action callback.
 * @param type
 *   The type of the strip being acted upon.
 * @returns
 *   The strip and mute operation to perform if they were validly encoded.
 *   Otherwise return null and note the failure in the log.
 */
function getMuteOptions(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	type: InputOutputType,
): MuteOptions | null {
	const stripOption = options.strip
	const strip = Number(stripOption)
	if (model.count[type] <= strip) {
		instance.log('error', `Mute strip ${type} choice has invalid value, action aborted: ${JSON.stringify(stripOption)}`)
		return null
	}

	const muteOption = options.mute
	const op = Number(muteOption)
	switch (op) {
		case MuteOperation.Toggle:
		case MuteOperation.On:
		case MuteOperation.Off:
			return { strip, op }
		default:
			instance.log('error', `Mute option has invalid value, action aborted: ${JSON.stringify(muteOption)}`)
			return null
	}
}

/**
 * Generate action definitions for muting mixer sources and sinks: input
 * channels, mixes, groups, FX sends and returns, etc.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @returns
 *   The set of all mute action definitions.
 */
export function muteActions(instance: sqInstance, mixer: Mixer, choices: Choices): ActionDefinitions<MuteActionId> {
	const model = mixer.model

	return {
		[MuteActionId.MuteInputChannel]: {
			name: 'Mute Input',
			options: [StripOption('Input Channel', choices.inputChannels), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'inputChannel')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteInputChannel(strip, op)
			},
		},

		[MuteActionId.MuteLR]: {
			name: 'Mute LR',
			options: [
				{
					type: 'dropdown',
					label: 'LR',
					id: 'strip',
					default: 0,
					choices: [{ label: `LR`, id: 0 }],
					minChoicesForSearch: 99,
				},
				{
					type: 'dropdown',
					label: 'Mute',
					id: 'mute',
					default: 0,
					choices: [
						{ label: 'Toggle', id: 0 },
						{ label: 'On', id: 1 },
						{ label: 'Off', id: 2 },
					],
				},
			],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'lr')
				if (options === null) {
					return
				}

				const { op } = options
				mixer.muteLR(op)
			},
		},

		[MuteActionId.MuteMix]: {
			name: 'Mute Aux',
			options: [StripOption('Aux', choices.mixes), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'mix')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteMix(strip, op)
			},
		},
		[MuteActionId.MuteGroup]: {
			name: 'Mute Group',
			options: [StripOption('Group', choices.groups), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'group')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteGroup(strip, op)
			},
		},
		[MuteActionId.MuteMatrix]: {
			name: 'Mute Matrix',
			options: [StripOption('Matrix', choices.matrixes), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'matrix')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteMatrix(strip, op)
			},
		},
		[MuteActionId.MuteFXSend]: {
			name: 'Mute FX Send',
			options: [StripOption('FX Send', choices.fxSends), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'fxSend')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteFXSend(strip, op)
			},
		},
		[MuteActionId.MuteFXReturn]: {
			name: 'Mute FX Return',
			options: [StripOption('FX Return', choices.fxReturns), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'fxReturn')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteFXReturn(strip, op)
			},
		},
		[MuteActionId.MuteDCA]: {
			name: 'Mute DCA',
			options: [StripOption('DCA', choices.dcas), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'dca')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteDCA(strip, op)
			},
		},
		[MuteActionId.MuteMuteGroup]: {
			name: 'Mute MuteGroup',
			options: [StripOption('MuteGroup', choices.muteGroups), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'muteGroup')
				if (options === null) {
					return
				}

				const { strip, op } = options
				mixer.muteMuteGroup(strip, op)
			},
		},
	}
}
