import type { Equal, Expect } from 'type-testing'
import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown,
	CompanionMigrationAction,
	CompanionOptionValues,
} from '@companion-module/base'
import { faderNumber } from '../fader-number.js'
import type { sqInstance } from '../instance.js'
import { type Mixer } from '../mixer/mixer.js'
import { type InputOutputType, type Model } from '../mixer/model.js'
import { MuteOperation } from '../mixer/mixer.js'
import { toSourceOrSink } from './to-source-or-sink.js'
import { moveZeroIndexedOptionToOneIndexed } from '../upgrades/zero-indexed-to-one.js'
import type { ZeroIndexed } from '../utils/indexed.js'
import { repr } from '../utils/pretty.js'

/**
 * Action IDs for all actions that mute, unmute, or toggle muting of a mixer
 * input/output.
 */
export const MuteActionId = {
	MuteInputChannel: 'mute_input',
	MuteLR: 'mute_lr',
	MuteMix: 'mute_aux',
	MuteGroup: 'mute_group',
	MuteMatrix: 'mute_matrix',
	MuteFXSend: 'mute_fx_send',
	MuteFXReturn: 'mute_fx_return',
	MuteDCA: 'mute_dca',
	MuteMuteGroup: 'mute_mutegroup',
} as const

export type MuteActionId = (typeof MuteActionId)[keyof typeof MuteActionId]

export const AllMuteStripActions: ReadonlySet<string> = new Set(
	Object.values(MuteActionId).filter((id) => id !== 'mute_lr'),
)

export const StripOptionId = 'n'
export const StatusOptionId = 'status'

const ObsoleteStripOptionId = 'strip'
const ObsoleteStatusOptionId = 'mute'

export const ObsoleteMuteStatus = {
	Toggle: 0,
	On: 1,
	Off: 2,
} as const

export type ObsoleteMuteStatus = (typeof ObsoleteMuteStatus)[keyof typeof ObsoleteMuteStatus]

/**
 * Translate an obsolete `mute: 0 | 1 | 2` option to the current
 * `status: 'toggle' | 'on' | 'off'` in `options`.
 */
function rewriteObsoleteStatusOption(options: CompanionMigrationAction['options']): void {
	let status: MuteOperation
	switch (options[ObsoleteStatusOptionId]) {
		case ObsoleteMuteStatus.Off:
			status = MuteOperation.Off
			break
		case ObsoleteMuteStatus.On:
			status = MuteOperation.On
			break
		case ObsoleteMuteStatus.Toggle:
			status = MuteOperation.Toggle
			break
		default:
			// Transfer the invalid option value unchanged.
			status = options[ObsoleteStatusOptionId] as MuteOperation
			break
	}

	type assert_statusIsMuteOperation = Expect<Equal<typeof status, MuteOperation>>

	options[StatusOptionId] = status
	delete options[ObsoleteStatusOptionId]
}

/**
 * Mute actions, for any input/output type, used to identify a specific instance
 * using an option with zero-indexed value, e.g. `[0, 48)` for 48 input
 * channels.  Translate any such old zero-indexed option into a new one-indexed
 * option -- and for good measure rename/reencode the mute-status option at the
 * same time.
 */
export function tryMakeMuteItemOneIndexed(action: CompanionMigrationAction): boolean {
	if (!AllMuteStripActions.has(action.actionId)) {
		return false
	}

	const options = action.options

	if (!(ObsoleteStripOptionId in options)) {
		return false
	}

	moveZeroIndexedOptionToOneIndexed(options, ObsoleteStripOptionId, StripOptionId)

	rewriteObsoleteStatusOption(options)

	return true
}

/**
 * The mute-LR action used to unnecessarily identify the single LR strip with an
 * option.  Remove this option, and rename/reencode the mute-status option as is
 * done above for all other mute actions.
 */
export function tryTrimMuteLROptions(action: CompanionMigrationAction): boolean {
	if (action.actionId !== MuteActionId.MuteLR) {
		return false
	}

	const options = action.options

	if (!(ObsoleteStripOptionId in options)) {
		return false
	}

	delete options[ObsoleteStripOptionId]

	rewriteObsoleteStatusOption(options)

	return true
}

const MuteOption = {
	type: 'dropdown',
	label: 'Mute',
	id: StatusOptionId,
	default: MuteOperation.Toggle,
	choices: [
		{ label: 'Toggle', id: MuteOperation.Toggle },
		{ label: 'On', id: MuteOperation.On },
		{ label: 'Off', id: MuteOperation.Off },
	],
} satisfies CompanionInputFieldDropdown

type MuteOptions = {
	n: ZeroIndexed
	status: MuteOperation
}

function getStatus(instance: sqInstance, options: CompanionOptionValues): MuteOperation | null {
	const statusOption = options[StatusOptionId]
	let status
	switch (statusOption) {
		case MuteOperation.Toggle:
		case MuteOperation.Off:
		case MuteOperation.On:
			status = statusOption
			break
		default:
			instance.log('error', `Mute status option has invalid value, action aborted: ${repr(statusOption)}`)
			return null
	}

	type assert_statusIsMuteOperation = Expect<Equal<typeof status, MuteOperation>>

	return status
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
	type: Exclude<InputOutputType, 'lr'>,
): MuteOptions | null {
	const n = toSourceOrSink(instance, model, options[StripOptionId], type)
	if (n === null) {
		return null
	}

	const status = getStatus(instance, options)
	if (status === null) {
		return null
	}

	type assert_nIsZeroIndexed = Expect<Equal<typeof n, ZeroIndexed>>
	type assert_statusIsMuteOperation = Expect<Equal<typeof status, MuteOperation>>

	return { n, status }
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
export function muteActions(instance: sqInstance, mixer: Mixer): Record<MuteActionId, CompanionActionDefinition> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	const faderOption = (label: string, type: Exclude<InputOutputType, 'lr'>) =>
		faderNumber(label, StripOptionId, counts, type)

	return {
		[MuteActionId.MuteInputChannel]: {
			name: 'Mute Input',
			options: [faderOption('Input Channel', 'inputChannel'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'inputChannel')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteInputChannel(n, status)
			},
		},

		[MuteActionId.MuteLR]: {
			name: 'Mute LR',
			options: [MuteOption],
			callback: async ({ options }) => {
				const status = getStatus(instance, options)
				if (status === null) {
					return
				}

				mixer.muteLR(status)
			},
		},

		[MuteActionId.MuteMix]: {
			name: 'Mute Mix',
			options: [faderOption('Mix', 'mix'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'mix')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteMix(n, status)
			},
		},
		[MuteActionId.MuteGroup]: {
			name: 'Mute Group',
			options: [faderOption('Group', 'group'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'group')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteGroup(n, status)
			},
		},
		[MuteActionId.MuteMatrix]: {
			name: 'Mute Matrix',
			options: [faderOption('Matrix', 'matrix'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'matrix')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteMatrix(n, status)
			},
		},
		[MuteActionId.MuteFXSend]: {
			name: 'Mute FX Send',
			options: [faderOption('FX Send', 'fxSend'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'fxSend')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteFXSend(n, status)
			},
		},
		[MuteActionId.MuteFXReturn]: {
			name: 'Mute FX Return',
			options: [faderOption('FX Return', 'fxReturn'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'fxReturn')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteFXReturn(n, status)
			},
		},
		[MuteActionId.MuteDCA]: {
			name: 'Mute DCA',
			options: [faderOption('DCA', 'dca'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'dca')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteDCA(n, status)
			},
		},
		[MuteActionId.MuteMuteGroup]: {
			name: 'Mute MuteGroup',
			options: [faderOption('MuteGroup', 'muteGroup'), MuteOption],
			callback: async ({ options: opt }) => {
				const options = getMuteOptions(instance, model, opt, 'muteGroup')
				if (options === null) {
					return
				}

				const { n, status } = options
				mixer.muteMuteGroup(n, status)
			},
		},
	}
}
