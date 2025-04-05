import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown,
	CompanionOptionValues,
	DropdownChoice,
} from '@companion-module/base'
import { type ActionDefinitions } from './actionid.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { type Mixer } from '../mixer/mixer.js'
import { LR, type Model } from '../mixer/model.js'
import type { BalanceParam } from '../mixer/nrpn/param.js'
import {
	BalanceNRPNCalculator,
	type SourceForSourceInMixAndLRForNRPN,
	type SourceSinkForNRPN,
} from '../mixer/nrpn/source-to-sink.js'
import { type PanBalance } from '../mixer/pan-balance.js'
import { toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'
import { repr } from '../utils/pretty.js'

/**
 * Action IDs for all actions setting the pan/balance of a mixer source in a
 * mixer sink.
 */
export enum PanBalanceActionId {
	InputChannelPanBalanceInMixOrLR = 'chpan_to_mix',
	GroupPanBalanceInMixOrLR = 'grppan_to_mix',
	FXReturnPanBalanceInMixOrLR = 'fxrpan_to_mix',
	FXReturnPanBalanceInGroup = 'fxrpan_to_grp',
	MixOrLRPanBalanceInMatrix = 'mixpan_to_mtx',
	GroupPanBalanceInMatrix = 'grppan_to_mtx',
}

/** Compute the set of pan/balance level options for pan/balance actions. */
export function createPanLevels(): DropdownChoice[] {
	const panLevels = []
	panLevels.push({ label: `Step Right`, id: 998 }, { label: `Step Left`, id: 999 })
	for (let i = -100; i <= 100; i += 5) {
		const pos = i < 0 ? `L${Math.abs(i)}` : i === 0 ? `CTR` : `R${i}`
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
export function getPanBalance(instance: sqInstance, options: CompanionOptionValues): PanBalanceChoice | null {
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

	instance.log('error', `Invalid pan/balance specified, aborting action: ${repr(rawOptionVal)}`)
	return null
}

function panSourceToMixOrLR(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): [number, number] | null {
	const source = toSourceOrSink(instance, model, options.input, sourceType)
	if (source === null) {
		return null
	}

	const mixOrLR = toMixOrLR(instance, model, options.assign)
	if (mixOrLR === null) {
		return null
	}

	return [source, mixOrLR]
}

function panSourceToSink(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): [number, number] | null {
	const source = toSourceOrSink(instance, model, options.input, sourceSink[0])
	if (source === null) {
		return null
	}

	const sink = toSourceOrSink(instance, model, options.assign, sourceSink[1])
	if (sink === null) {
		return null
	}

	return [source, sink]
}

function panSourceToMixOrLRLearnSubPrelude(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): BalanceParam | undefined {
	const sourceSink = panSourceToMixOrLR(instance, model, options, sourceType)
	if (sourceSink === null) {
		return undefined
	}

	const [source, mixOrLR] = sourceSink

	return mixOrLR === LR
		? BalanceNRPNCalculator.get(model, ['inputChannel', 'lr']).calculate(source, 0)
		: BalanceNRPNCalculator.get(model, ['inputChannel', 'mix']).calculate(source, mixOrLR)
}

function panSourceToSinkLearnSubPrelude(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): BalanceParam | undefined {
	const sourceSinkNums = panSourceToSink(instance, model, options, sourceSink)
	if (sourceSinkNums === null) {
		return undefined
	}

	const [source, sink] = sourceSinkNums

	return BalanceNRPNCalculator.get(model, sourceSink).calculate(source, sink)
}

function panSourceToMixOrLRLearn(
	instance: sqInstance,
	model: Model,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): NonNullable<CompanionActionDefinition['learn']> {
	return ({ options }): CompanionOptionValues | undefined => {
		const param = panSourceToMixOrLRLearnSubPrelude(instance, model, options, sourceType)
		if (param === undefined) {
			return
		}

		const { MSB, LSB } = param

		return {
			...options,
			showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
		}
	}
}

function panSourceToSinkLearn(
	instance: sqInstance,
	model: Model,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): NonNullable<CompanionActionDefinition['learn']> {
	return ({ options }): CompanionOptionValues | undefined => {
		const param = panSourceToSinkLearnSubPrelude(instance, model, options, sourceSink)
		if (param === undefined) {
			return
		}

		const { MSB, LSB } = param

		return {
			...options,
			showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
		}
	}
}

function panSourceToMixOrLRSubscribe(
	instance: sqInstance,
	mixer: Mixer,
	model: Model,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): NonNullable<CompanionActionDefinition['subscribe']> {
	return async ({ options }) => {
		const param = panSourceToMixOrLRLearnSubPrelude(instance, model, options, sourceType)
		if (param === undefined) {
			return
		}

		const { MSB, LSB } = param

		// Send a "get" so the pan/balance variable is defined.
		void mixer.sendCommands([mixer.getNRPNValue(MSB, LSB)])
	}
}

function panSourceToSinkSubscribe(
	instance: sqInstance,
	mixer: Mixer,
	model: Model,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): NonNullable<CompanionActionDefinition['subscribe']> {
	return async ({ options }) => {
		const param = panSourceToSinkLearnSubPrelude(instance, model, options, sourceSink)
		if (param === undefined) {
			return
		}

		const { MSB, LSB } = param

		// Send a "get" so the pan/balance variable is defined.
		void mixer.sendCommands([mixer.getNRPNValue(MSB, LSB)])
	}
}

function panSourceToMixOrLRCallbackPrelude(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): [number, number, PanBalanceChoice] | null {
	const sourceSink = panSourceToMixOrLR(instance, model, options, sourceType)
	if (sourceSink === null) {
		return null
	}

	const panBalance = getPanBalance(instance, options)
	if (panBalance === null) {
		return null
	}

	return [...sourceSink, panBalance]
}

function panSourceToSinkCallbackPrelude(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): [number, number, PanBalanceChoice] | null {
	const sourceSinkNums = panSourceToSink(instance, model, options, sourceSink)
	if (sourceSinkNums === null) {
		return null
	}

	const panBalance = getPanBalance(instance, options)
	if (panBalance === null) {
		return null
	}

	return [...sourceSinkNums, panBalance]
}

function panMixOrLRToMatrix(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
): [number, number] | null {
	const mixOrLR = toMixOrLR(instance, model, options.input)
	if (mixOrLR === null) {
		return null
	}

	const matrix = toSourceOrSink(instance, model, options.assign, 'matrix')
	if (matrix === null) {
		return null
	}

	return [mixOrLR, matrix]
}

function panMixOrLRToMatrixLearnSubPrelude(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
): BalanceParam | null {
	const sourceSink = panMixOrLRToMatrix(instance, model, options)
	if (sourceSink === null) {
		return null
	}
	const [mixOrLR, matrix] = sourceSink

	return mixOrLR === LR
		? BalanceNRPNCalculator.get(model, ['lr', 'matrix']).calculate(0, matrix)
		: BalanceNRPNCalculator.get(model, ['mix', 'matrix']).calculate(mixOrLR, matrix)
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
 * @returns
 *   The set of all pan/balance action definitions.
 */
export function panBalanceActions(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
	panLevelOption: CompanionInputFieldDropdown,
): ActionDefinitions<PanBalanceActionId> {
	const model = mixer.model

	const ShowVarOption = {
		type: 'textinput',
		label: 'Instance variable containing pan/balance level (click Learn to refresh)',
		id: 'showvar',
		default: '',
	} as const

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
				ShowVarOption,
			],
			learn: panSourceToMixOrLRLearn(instance, model, 'inputChannel'),
			subscribe: panSourceToMixOrLRSubscribe(instance, mixer, model, 'inputChannel'),
			callback: async ({ options }) => {
				const sourceSinkBalance = panSourceToMixOrLRCallbackPrelude(instance, model, options, 'inputChannel')
				if (sourceSinkBalance === null) {
					return
				}
				const [inputChannel, mixOrLR, panBalance] = sourceSinkBalance

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
				ShowVarOption,
			],
			learn: panSourceToMixOrLRLearn(instance, model, 'group'),
			subscribe: panSourceToMixOrLRSubscribe(instance, mixer, model, 'group'),
			callback: async ({ options }) => {
				const sourceSinkBalance = panSourceToMixOrLRCallbackPrelude(instance, model, options, 'group')
				if (sourceSinkBalance === null) {
					return
				}
				const [group, mixOrLR, panBalance] = sourceSinkBalance

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
				ShowVarOption,
			],
			learn: panSourceToMixOrLRLearn(instance, model, 'fxReturn'),
			subscribe: panSourceToMixOrLRSubscribe(instance, mixer, model, 'fxReturn'),
			callback: async ({ options }) => {
				const sourceSinkBalance = panSourceToMixOrLRCallbackPrelude(instance, model, options, 'fxReturn')
				if (sourceSinkBalance === null) {
					return
				}
				const [fxReturn, mixOrLR, panBalance] = sourceSinkBalance

				mixer.setFXReturnPanBalanceInMixOrLR(fxReturn, panBalance, mixOrLR)
			},
		},
		[PanBalanceActionId.FXReturnPanBalanceInGroup]: {
			name: 'Pan/Bal FX return level to group',
			options: [
				{
					type: 'static-text',
					id: 'invalid',
					label: 'Invalid operation!',
					value: 'FX returns can only be assigned to groups, not have their pan/balance set in them.',
				},
			],
			callback: async () => {
				instance.log('warn', 'The "Pan/Bal FX return level to group" operation is invalid.  Don\'t use this action!')
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
				ShowVarOption,
			],
			learn: ({ options }, _context): CompanionOptionValues | undefined => {
				const nrpn = panMixOrLRToMatrixLearnSubPrelude(instance, model, options)
				if (nrpn === null) {
					return undefined
				}
				const { MSB, LSB } = nrpn

				return {
					...options,
					showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
				}
			},
			subscribe: async ({ options }) => {
				const nrpn = panMixOrLRToMatrixLearnSubPrelude(instance, model, options)
				if (nrpn === null) {
					return undefined
				}
				const { MSB, LSB } = nrpn

				// Send a "get" so the pan/balance variable is defined.
				void mixer.sendCommands([mixer.getNRPNValue(MSB, LSB)])
			},
			callback: async ({ options }) => {
				const sourceSink = panMixOrLRToMatrix(instance, model, options)
				if (sourceSink === null) {
					return
				}
				const [mixOrLR, matrix] = sourceSink

				const panBalance = getPanBalance(instance, options)
				if (panBalance === null) {
					return
				}

				if (mixOrLR === LR) {
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
				ShowVarOption,
			],
			learn: panSourceToSinkLearn(instance, model, ['group', 'matrix']),
			subscribe: panSourceToSinkSubscribe(instance, mixer, model, ['group', 'matrix']),
			callback: async ({ options }) => {
				const sourceSinkBalance = panSourceToSinkCallbackPrelude(instance, model, options, ['group', 'matrix'])
				if (sourceSinkBalance === null) {
					return
				}
				const [group, matrix, panBalance] = sourceSinkBalance

				mixer.setGroupPanBalanceInMatrix(group, panBalance, matrix)
			},
		},
	}
}
