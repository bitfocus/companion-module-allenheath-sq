import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown,
	CompanionMigrationAction,
	CompanionOptionValues,
	DropdownChoice,
} from '@companion-module/base'
import { type ActionDefinitions } from './actionid.js'
import { type Choices } from '../choices.js'
import type { sqInstance } from '../instance.js'
import { LR, type MixOrLR, tryUpgradeMixOrLROptionEncoding } from '../mixer/lr.js'
import type { Mixer } from '../mixer/mixer.js'
import type { Model } from '../mixer/model.js'
import { type NRPN, splitNRPN } from '../mixer/nrpn/nrpn.js'
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

const PanBalanceSourceOptionId = 'input'
const PanBalanceSinkOptionId = 'assign'

/**
 * The LR mix used to be identified using the number `99` in options.  This
 * function attempts to upgrade pan/balance actions (*only* pan/balance actions:
 * other action types are upgraded by similar functions in their action-defining
 * files) that identify the LR mix in this fashion to use the constant string
 * `'lr'`, i.e. `LR`.
 *
 * @param action
 *   An action to potentially ugprade.
 * @returns
 *   True iff the action was a pan/balance action containing an identification
 *   of the LR mix that was rewritten to use `'lr'`.
 */
export function tryUpgradePanBalanceMixOrLREncoding(action: CompanionMigrationAction): boolean {
	switch (action.actionId) {
		case PanBalanceActionId.InputChannelPanBalanceInMixOrLR as string:
		case PanBalanceActionId.GroupPanBalanceInMixOrLR as string:
		case PanBalanceActionId.FXReturnPanBalanceInMixOrLR as string:
			return tryUpgradeMixOrLROptionEncoding(action, PanBalanceSinkOptionId)
		case PanBalanceActionId.MixOrLRPanBalanceInMatrix as string:
			return tryUpgradeMixOrLROptionEncoding(action, PanBalanceSourceOptionId)
		default:
			return false
	}
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

function getBalanceSourceToMixOrLRNumbers(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): [number, MixOrLR] | null {
	const source = toSourceOrSink(instance, model, options[PanBalanceSourceOptionId], sourceType)
	if (source === null) {
		return null
	}

	const mixOrLR = toMixOrLR(instance, model, options[PanBalanceSinkOptionId])
	if (mixOrLR === null) {
		return null
	}

	return [source, mixOrLR]
}

function getBalanceSourceToSinkNumbers(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): [number, number] | null {
	const source = toSourceOrSink(instance, model, options[PanBalanceSourceOptionId], sourceSink[0])
	if (source === null) {
		return null
	}

	const sink = toSourceOrSink(instance, model, options[PanBalanceSinkOptionId], sourceSink[1])
	if (sink === null) {
		return null
	}

	return [source, sink]
}

function getBalanceSourceToMixOrLRParam(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): NRPN<'panBalance'> | undefined {
	const sourceSink = getBalanceSourceToMixOrLRNumbers(instance, model, options, sourceType)
	if (sourceSink === null) {
		return undefined
	}

	const [source, mixOrLR] = sourceSink

	return mixOrLR === LR
		? BalanceNRPNCalculator.get(model, ['inputChannel', 'lr']).calculate(source, 0)
		: BalanceNRPNCalculator.get(model, ['inputChannel', 'mix']).calculate(source, mixOrLR)
}

function getBalanceSourceToSinkParam(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): NRPN<'panBalance'> | undefined {
	const sourceSinkNums = getBalanceSourceToSinkNumbers(instance, model, options, sourceSink)
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
		const nrpn = getBalanceSourceToMixOrLRParam(instance, model, options, sourceType)
		if (nrpn === undefined) {
			return
		}

		const { MSB, LSB } = splitNRPN(nrpn)

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
		const nrpn = getBalanceSourceToSinkParam(instance, model, options, sourceSink)
		if (nrpn === undefined) {
			return
		}

		const { MSB, LSB } = splitNRPN(nrpn)

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
		const nrpn = getBalanceSourceToMixOrLRParam(instance, model, options, sourceType)
		if (nrpn === undefined) {
			return
		}

		// Send a "get" so the pan/balance variable is defined.
		void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
	}
}

function panSourceToSinkSubscribe(
	instance: sqInstance,
	mixer: Mixer,
	model: Model,
	sourceSink: SourceSinkForNRPN<'panBalance'>,
): NonNullable<CompanionActionDefinition['subscribe']> {
	return async ({ options }) => {
		const nrpn = getBalanceSourceToSinkParam(instance, model, options, sourceSink)
		if (nrpn === undefined) {
			return
		}

		// Send a "get" so the pan/balance variable is defined.
		void mixer.sendCommands([mixer.getNRPNValue(nrpn)])
	}
}

function panSourceToMixOrLRCallbackPrelude(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	sourceType: SourceForSourceInMixAndLRForNRPN<'panBalance'>,
): [number, MixOrLR, PanBalanceChoice] | null {
	const sourceSink = getBalanceSourceToMixOrLRNumbers(instance, model, options, sourceType)
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
	const sourceSinkNums = getBalanceSourceToSinkNumbers(instance, model, options, sourceSink)
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
): [MixOrLR, number] | null {
	const mixOrLR = toMixOrLR(instance, model, options[PanBalanceSourceOptionId])
	if (mixOrLR === null) {
		return null
	}

	const matrix = toSourceOrSink(instance, model, options[PanBalanceSinkOptionId], 'matrix')
	if (matrix === null) {
		return null
	}

	return [mixOrLR, matrix]
}

function getMixOrLRToMatrixParam(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
): NRPN<'panBalance'> | null {
	const sourceSink = panMixOrLRToMatrix(instance, model, options)
	if (sourceSink === null) {
		return null
	}
	const [mixOrLR, matrix] = sourceSink

	return mixOrLR === LR
		? BalanceNRPNCalculator.get(model, ['lr', 'matrix']).calculate(0, matrix)
		: BalanceNRPNCalculator.get(model, ['mix', 'matrix']).calculate(mixOrLR, matrix)
}

function sourceSinkOptions(
	sourceLabel: string,
	sourceChoices: keyof Choices,
	sinkLabel: string,
	sinkChoices: keyof Choices,
	choices: Choices,
): [CompanionInputFieldDropdown, CompanionInputFieldDropdown] {
	return [
		{
			type: 'dropdown',
			label: sourceLabel,
			id: PanBalanceSourceOptionId,
			default: 0,
			choices: choices[sourceChoices],
			minChoicesForSearch: 0,
		},
		{
			type: 'dropdown',
			label: sinkLabel,
			id: PanBalanceSinkOptionId,
			default: 0,
			choices: choices[sinkChoices],
			minChoicesForSearch: 0,
		},
	]
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
				...sourceSinkOptions('Input channel', 'inputChannels', 'Mix', 'mixesAndLR', choices),
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
			options: [...sourceSinkOptions('Group', 'groups', 'Mix', 'mixesAndLR', choices), panLevelOption, ShowVarOption],
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
				...sourceSinkOptions('FX return', 'fxReturns', 'Mix', 'mixesAndLR', choices),
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
				...sourceSinkOptions('Mix', 'mixesAndLR', 'Matrix', 'matrixes', choices),
				panLevelOption,
				ShowVarOption,
			],
			learn: ({ options }, _context): CompanionOptionValues | undefined => {
				const nrpn = getMixOrLRToMatrixParam(instance, model, options)
				if (nrpn === null) {
					return undefined
				}
				const { MSB, LSB } = splitNRPN(nrpn)

				return {
					...options,
					showvar: `$(${instance.label}:pan_${MSB}.${LSB})`,
				}
			},
			subscribe: async ({ options }) => {
				const param = getMixOrLRToMatrixParam(instance, model, options)
				if (param === null) {
					return undefined
				}

				// Send a "get" so the pan/balance variable is defined.
				void mixer.sendCommands([mixer.getNRPNValue(param)])
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
			options: [...sourceSinkOptions('Group', 'groups', 'Matrix', 'matrixes', choices), panLevelOption, ShowVarOption],
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
