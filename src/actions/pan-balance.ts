import type {
	CompanionActionInfo,
	CompanionInputFieldDropdown,
	CompanionOptionValues,
	DropdownChoice,
} from '@companion-module/base'
import { type ActionDefinitions, PanBalanceActionId } from './action-ids.js'
import { type Choices } from '../choices.js'
import type { ParamHalf, SQInstanceInterface as sqInstance } from '../instance-interface.js'
import { type Mixer } from '../mixer/mixer.js'
import type { InputOutputType, Model } from '../mixer/model.js'
import { toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'
import { type PanBalance } from '../mixer/pan-balance.js'

/** Compute the set of pan/balance level options for pan/balance actions. */
export function createPanLevels(): DropdownChoice[] {
	const panLevels = []
	panLevels.push({ label: `Step Right`, id: 998 }, { label: `Step Left`, id: 999 })
	for (let i = -100; i <= 100; i += 5) {
		const pos = i < 0 ? `L${Math.abs(i)}` : i == 0 ? `CTR` : `R${i}`
		panLevels.push({ label: `${pos}`, id: `${pos}` })
	}

	return panLevels
}

/** The set of pan/balance choice values offered for selection as pan levels. */
export type PanBalanceChoice = PanBalance | 998 | 999

/**
 *
 * @param instance
 *   The instance for which an action is being processed.
 * @param options
 *   The options supplied to the action.
 * @returns
 *   The pan/balance specified in options.
 */
function getPanBalance(instance: sqInstance, options: CompanionOptionValues): PanBalanceChoice | null {
	const rawOptionVal = options.leveldb
	if (rawOptionVal === 998 || rawOptionVal === 999) {
		return rawOptionVal
	}

	const optionVal = String(rawOptionVal)
	if (optionVal === 'CTR') {
		return 'CTR'
	}

	if (optionVal.length > 0) {
		const first = optionVal[0]
		if (first === 'L' || first === 'R') {
			const n = Number(optionVal.slice(1))
			if (n % 5 === 0 && 5 <= n && n <= 100) {
				return `${first}${n}`
			}
		}
	}

	instance.log('error', `Invalid pan/balance specified, aborting action: ${JSON.stringify(rawOptionVal)}`)
	return null
}

function subscribeOperation(
	instance: sqInstance,
	mixer: Mixer,
	model: Model,
	action: CompanionActionInfo,
	connectionLabel: string,
	sinkType: InputOutputType,
	oMB: ParamHalf,
	oLB: ParamHalf,
): void {
	const opt = action.options
	const val = instance.getLevel(Number(opt.input), Number(opt.assign), model.count[sinkType], oMB, oLB)
	mixer.midi.send(val.commands[0])
	opt.showvar = `$(${connectionLabel}:pan_${val.channel[0]}.${val.channel[1]})`
}

/**
 * Generate action definitions for adjusting the pan/balance of mixer sources
 * across mixer sinks.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param choices
 *   Choice definitions for the mixer.
 * @param panLevelOption
 *   An input option containing a list of usable pan/balance positions.
 * @param connectionLabel
 *   The label of this instance's connection.
 * @returns
 *   The set of all pan/balance action definitions.
 */
export function panBalanceActions(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
	panLevelOption: CompanionInputFieldDropdown,
	connectionLabel: string,
): ActionDefinitions<PanBalanceActionId> {
	const model = mixer.model

	return {
		[PanBalanceActionId.InputChannelPanBalanceInMixOrLR]: {
			name: 'Pan/Bal channel level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Input channel',
					id: 'input',
					default: 0,
					choices: choices.inputChannels,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: 0,
					choices: choices.mixesAndLR,
					minChoicesForSearch: 0,
				},
				panLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				subscribeOperation(instance, mixer, model, action, connectionLabel, 'mix', [0x50, 0x50], [0, 0x44])
			},
			callback: async ({ options }) => {
				const inputChannel = toSourceOrSink(instance, model, options.input, 'inputChannel')
				if (inputChannel === null) {
					return
				}

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				const mixOrLR = toMixOrLR(instance, model, options.assign)
				if (mixOrLR === null) {
					return
				}

				mixer.setInputChannelPanBalanceInMixOrLR(inputChannel, panBalance, mixOrLR)
			},
		},
		[PanBalanceActionId.GroupPanBalanceInMixOrLR]: {
			name: 'Pan/Bal group level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: 0,
					choices: choices.groups,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: 0,
					choices: choices.mixesAndLR,
					minChoicesForSearch: 0,
				},
				panLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				subscribeOperation(instance, mixer, model, action, connectionLabel, 'mix', [0x50, 0x55], [0x30, 0x04])
			},
			callback: async ({ options }) => {
				const group = toSourceOrSink(instance, model, options.input, 'group')
				if (group === null) {
					return
				}

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				const mixOrLR = toMixOrLR(instance, model, options.assign)
				if (mixOrLR === null) {
					return
				}

				mixer.setGroupPanBalanceInMixOrLR(group, panBalance, mixOrLR)
			},
		},
		[PanBalanceActionId.FXReturnPanBalanceInMixOrLR]: {
			name: 'Pan/Bal FX return level to mix',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: 0,
					choices: choices.fxReturns,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'assign',
					default: 0,
					choices: choices.mixesAndLR,
					minChoicesForSearch: 0,
				},
				panLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				subscribeOperation(instance, mixer, model, action, connectionLabel, 'mix', [0x50, 0x56], [0x3c, 0x14])
			},
			callback: async ({ options }) => {
				const fxReturn = toSourceOrSink(instance, model, options.input, 'fxReturn')
				if (fxReturn === null) {
					return
				}

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				const mixOrLR = toMixOrLR(instance, model, options.assign)
				if (mixOrLR === null) {
					return
				}

				mixer.setFXReturnPanBalanceInMixOrLR(fxReturn, panBalance, mixOrLR)
			},
		},
		[PanBalanceActionId.FXReturnPanBalanceInGroup]: {
			name: 'Fader FX return level to group',
			options: [
				{
					type: 'dropdown',
					label: 'FX return',
					id: 'input',
					default: 0,
					choices: choices.fxReturns,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Group',
					id: 'assign',
					default: 0,
					choices: choices.groups,
					minChoicesForSearch: 0,
				},
				panLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				subscribeOperation(instance, mixer, model, action, connectionLabel, 'group', [0, 0x5b], [0, 0x34])
			},
			callback: async ({ options }) => {
				// XXX The SQ MIDI Protocol document (Issue 3) includes a table
				//     for this (page 26).  Issue 5 of the same document does
				//     not.  Is this operation even a thing?
				const fxReturn = toSourceOrSink(instance, model, options.input, 'fxReturn')
				if (fxReturn === null) {
					return
				}

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				const group = toSourceOrSink(instance, model, options.assign, 'group')
				if (group === null) {
					return
				}

				mixer.setFXReturnPanBalanceInGroup(fxReturn, panBalance, group)
			},
		},
		[PanBalanceActionId.MixOrLRPanBalanceInMatrix]: {
			name: 'Pan/Bal mix level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Mix',
					id: 'input',
					default: 0,
					choices: choices.mixesAndLR,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: 0,
					choices: choices.matrixes,
					minChoicesForSearch: 0,
				},
				panLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				subscribeOperation(instance, mixer, model, action, connectionLabel, 'matrix', [0x5e, 0x5e], [0x24, 0x27])
			},
			callback: async ({ options }) => {
				const mixOrLR = toMixOrLR(instance, model, options.input)
				if (mixOrLR === null) {
					return
				}

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				const matrix = toSourceOrSink(instance, model, options.assign, 'matrix')
				if (matrix === null) {
					return
				}

				if (mixOrLR === 99) {
					mixer.setLRPanBalanceInMatrix(panBalance, matrix)
				} else {
					mixer.setMixPanBalanceInMatrix(mixOrLR, panBalance, matrix)
				}
			},
		},
		[PanBalanceActionId.GroupPanBalanceInMatrix]: {
			name: 'Pan/Bal group level to matrix',
			options: [
				{
					type: 'dropdown',
					label: 'Group',
					id: 'input',
					default: 0,
					choices: choices.groups,
					minChoicesForSearch: 0,
				},
				{
					type: 'dropdown',
					label: 'Matrix',
					id: 'assign',
					default: 0,
					choices: choices.matrixes,
					minChoicesForSearch: 0,
				},
				panLevelOption,
				{
					type: 'textinput',
					label: 'Variable to show level (click config button to refresh)',
					id: 'showvar',
					default: '',
				},
			],
			subscribe: async (action) => {
				subscribeOperation(instance, mixer, model, action, connectionLabel, 'matrix', [0, 0x5e], [0, 0x4b])
			},
			callback: async ({ options }) => {
				const group = toSourceOrSink(instance, model, options.input, 'group')
				if (group === null) {
					return
				}

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				const matrix = toSourceOrSink(instance, model, options.assign, 'matrix')
				if (matrix === null) {
					return
				}

				mixer.setGroupPanBalanceInMatrix(group, panBalance, matrix)
			},
		},
	}
}
