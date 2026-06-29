import type { Equal, Expect, IsNever } from 'type-testing'
import type {
	CompanionActionDefinition,
	CompanionInputFieldDropdown,
	CompanionInputFieldNumber,
	CompanionMigrationAction,
	CompanionOptionValues,
	DropdownChoice,
} from '@companion-module/base'
import { mixOrLROption } from '../choices.js'
import { faderNumber } from '../fader-number.js'
import { FadingOption, getFadeType, LevelOption } from './fading.js'
import type { sqInstance } from '../instance.js'
import {
	convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption,
	tryUpgradeMixOrLRArrayEncoding,
	tryUpgradeMixOrLROptionEncoding,
} from '../mixer/lr.js'
import type { Mixer } from '../mixer/mixer.js'
import type { Model } from '../mixer/model.js'
import type { NRPN } from '../mixer/nrpn/nrpn.js'
import {
	LevelNRPNCalculator,
	type SinkForMixAndLRInSinkForNRPN,
	type SourceForSourceInMixAndLRForNRPN,
	type SourceSinkForNRPN,
} from '../mixer/nrpn/source-to-sink.js'
import { LevelActionId, LevelSetSinkOptionId, LevelSetSourceOptionId } from './schemas/level.js'
import { toMixOrLR, toSourceOrSink } from './to-source-or-sink.js'
import { LR, LRStrip } from '../types.js'
import { moveZeroIndexedOptionToOneIndexed } from '../upgrades/zero-indexed-to-one.js'
import type { ZeroIndexed } from '../utils/indexed.js'

const ObsoleteFXReturnLevelinFXSendId = 'fxslev_to_fxs'

/**
 * The action id for setting the level of an FX return in an FX send used to
 * contain a typo: it claimed to be an "FX Send to FX Send" level.  Update the
 * id to fix the typo.
 *
 * @param action
 *   The action to potentially upgrade.
 * @returns
 *   True iff the action was an FX Return to FX Send level action and its action
 *   ID was corrected.
 */
export function tryFixFXRLevelInFXSIdTypo(action: CompanionMigrationAction): boolean {
	if (action.actionId !== ObsoleteFXReturnLevelinFXSendId) {
		return false
	}

	action.actionId = LevelActionId.FXReturnLevelInFXSend
	return true
}

const ObsoleteLevelSetSourceOptionId = 'input'
const ObsoleteLevelSetSinkOptionId = 'assign'

/**
 * The LR mix used to be identified using the number `99` in options.  This
 * function attempts to upgrade assign actions (*only* level actions: other
 * action types are upgraded by similar functions in their action-defining
 * files) that identify the LR mix in this fashion to use the constant string
 * `'lr'`, i.e. `LR`.
 *
 * @param action
 *   An action to potentially ugprade.
 * @returns
 *   True iff the action was a level action containing an identification of the
 *   LR mix that was rewritten to use `'lr'`.
 */
export function tryUpgradeLevelMixOrLREncoding(action: CompanionMigrationAction): boolean {
	switch (action.actionId) {
		case LevelActionId.InputChannelLevelInMixOrLR:
		case LevelActionId.GroupLevelInMixOrLR:
		case LevelActionId.FXReturnLevelInMixOrLR:
			return tryUpgradeMixOrLRArrayEncoding(action, ObsoleteLevelSetSinkOptionId)
		case LevelActionId.MixOrLRLevelInMatrix:
			return tryUpgradeMixOrLROptionEncoding(action, ObsoleteLevelSetSourceOptionId)
		default:
			return false
	}
}

type SourceSinkInfo = {
	sourceIsMixOrLR: boolean
	sinkIsMixOrLR: boolean
}

const OnlySourceIsMixOrLR = {
	sourceIsMixOrLR: true,
	sinkIsMixOrLR: false,
} as const satisfies SourceSinkInfo

const OnlySinkIsMixOrLR = {
	sourceIsMixOrLR: false,
	sinkIsMixOrLR: true,
} as const satisfies SourceSinkInfo

const SourceAndSinkAreNotMixOrLR = {
	sourceIsMixOrLR: false,
	sinkIsMixOrLR: false,
} as const satisfies SourceSinkInfo

const UserUnfriendlyOptionInfo = {
	[LevelActionId.InputChannelLevelInMixOrLR]: OnlySinkIsMixOrLR,
	[LevelActionId.GroupLevelInMixOrLR]: OnlySinkIsMixOrLR,
	[LevelActionId.FXReturnLevelInMixOrLR]: OnlySinkIsMixOrLR,
	[LevelActionId.InputChannelLevelInFXSend]: SourceAndSinkAreNotMixOrLR,
	[LevelActionId.GroupLevelInFXSend]: SourceAndSinkAreNotMixOrLR,
	[LevelActionId.FXReturnLevelInFXSend]: SourceAndSinkAreNotMixOrLR,
	[LevelActionId.GroupLevelInMatrix]: SourceAndSinkAreNotMixOrLR,
	[LevelActionId.MixOrLRLevelInMatrix]: OnlySourceIsMixOrLR,
	// FXR to Group is omitted because the action is obsolete and does nothing.
} as const satisfies Record<Exclude<LevelActionId, 'fxrlev_to_grp'>, SourceSinkInfo>

/**
 * Level-fading action source/sink options used to be zero-indexed numbers, or
 * `'lr'` for the LR mix.
 *
 * With the 2.0 module API and options being allowed to be defined with
 * expressions, these zero-indexed numbers ought be instead one-indexed to match
 * user expectations.  Additionally, `'lr'` as nicety ought be `'LR'` because
 * that's how it's referred to on the mixer surface.
 *
 * This function attempts to rewrite source/sink numbers to be one-indexed and
 * change `'lr'` to `'LR'`, returning true if rewriting succeeded.
 */
export function tryMakeLevelSourceSinkOptionsUserFriendly(action: CompanionMigrationAction): boolean {
	if (!Object.hasOwn(UserUnfriendlyOptionInfo, action.actionId)) {
		return false
	}

	const options = action.options
	if (!(ObsoleteLevelSetSourceOptionId in options)) {
		return false
	}

	const { sourceIsMixOrLR, sinkIsMixOrLR } =
		UserUnfriendlyOptionInfo[action.actionId as keyof typeof UserUnfriendlyOptionInfo]

	const convertSource = sourceIsMixOrLR
		? convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption
		: moveZeroIndexedOptionToOneIndexed
	convertSource(options, ObsoleteLevelSetSourceOptionId, LevelSetSourceOptionId)

	const convertSink = sinkIsMixOrLR
		? convertZeroIndexedLowercaseLROptionToOneIndexedUppercaseLROption
		: moveZeroIndexedOptionToOneIndexed
	convertSink(options, ObsoleteLevelSetSinkOptionId, LevelSetSinkOptionId)

	return true
}

type LevelSourceToSink = SourceSinkForNRPN<'level'>
type LevelSourceToMixOrLR = [SourceForSourceInMixAndLRForNRPN<'level'>, 'mix-or-lr']
type LevelMixOrLRToSink = ['mix-or-lr', SinkForMixAndLRInSinkForNRPN<'level'>]

type LevelSourceSinkOptions =
	| [CompanionOptionValues, LevelSourceToSink]
	| [CompanionOptionValues, ...LevelSourceToMixOrLR]
	| [CompanionOptionValues, ...LevelMixOrLRToSink]

function getLevelNRPN(
	instance: sqInstance,
	model: Model,
	sourceSinkOptions: LevelSourceSinkOptions,
): NRPN<'level'> | null {
	let sourceSinkType: SourceSinkForNRPN<'level'>
	let source, sink
	if (sourceSinkOptions[1] === 'mix-or-lr') {
		const options = sourceSinkOptions[0]
		const sinkType = sourceSinkOptions[2]

		const src = toMixOrLR(instance, model, options[LevelSetSourceOptionId])
		if (src === null) {
			return null
		}

		sink = toSourceOrSink(instance, model, options[LevelSetSinkOptionId], sinkType)
		if (sink === null) {
			return null
		}

		sourceSinkType = [src === LR ? 'lr' : 'mix', sinkType]
		source = src === LR ? LRStrip : src
	} else if (sourceSinkOptions[2] === 'mix-or-lr') {
		const options = sourceSinkOptions[0]
		const sourceType = sourceSinkOptions[1]

		source = toSourceOrSink(instance, model, options[LevelSetSourceOptionId], sourceType)
		if (source === null) {
			return null
		}

		const snk = toMixOrLR(instance, model, options[LevelSetSinkOptionId])
		if (snk === null) {
			return null
		}

		sourceSinkType = [sourceType, snk === LR ? 'lr' : 'mix']
		sink = snk === LR ? LRStrip : snk
	} else {
		const options = sourceSinkOptions[0]
		sourceSinkType = sourceSinkOptions[1]

		source = toSourceOrSink(instance, model, options[LevelSetSourceOptionId], sourceSinkType[0])
		if (source === null) {
			return null
		}

		sink = toSourceOrSink(instance, model, options[LevelSetSinkOptionId], sourceSinkType[1])
		if (sink === null) {
			return null
		}
	}

	const calc = LevelNRPNCalculator.get(model, sourceSinkType)

	type assert_SourceIsZeroIndexed = Expect<Equal<typeof source, ZeroIndexed>>
	type assert_SinkIsZeroIndexed = Expect<Equal<typeof sink, ZeroIndexed>>

	return calc.calculate(source, sink)
}

/**
 * Generate action definitions for setting the levels of sources in sinks: input
 * channels in mixes, mixes in LR, and so on and so forth.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param mixesAndLR
 *   A choices list containing all numbered mixes plus the LR mix.
 * @returns
 *   The set of all level action definitions.
 */
export function levelActions(
	instance: sqInstance,
	mixer: Mixer,
	mixesAndLR: DropdownChoice[],
): Record<LevelActionId, CompanionActionDefinition> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	type Source = CompanionInputFieldNumber
	type MixOrLRSource = CompanionInputFieldDropdown
	type Sink = CompanionInputFieldNumber
	type MixOrLRSink = CompanionInputFieldDropdown

	let InputChannelSource: Source
	let GroupSource: Source
	let FXReturnSource: Source
	let MixOrLRSource: MixOrLRSource

	let FXSendSink: Sink
	let MixOrLRSink: MixOrLRSink
	let MatrixSink: Sink
	{
		const sourceNumber = (label: string, type: 'inputChannel' | 'group' | 'fxReturn') =>
			faderNumber(label, LevelSetSourceOptionId, counts, type)
		const sinkNumber = (label: string, type: 'group' | 'fxSend' | 'matrix') =>
			faderNumber(label, LevelSetSinkOptionId, counts, type)

		InputChannelSource = sourceNumber('Input channel', 'inputChannel')
		GroupSource = sourceNumber('Group', 'group')
		FXReturnSource = sourceNumber('FX return', 'fxReturn')
		MixOrLRSource = mixOrLROption('Mix', LevelSetSourceOptionId, mixesAndLR)

		FXSendSink = sinkNumber('FX Send', 'fxSend')
		MixOrLRSink = mixOrLROption('Mix', LevelSetSinkOptionId, mixesAndLR)
		MatrixSink = sinkNumber('Matrix', 'matrix')
	}

	const fadeAction = (...sourceSinkOptions: LevelSourceSinkOptions) => {
		const nrpn = getLevelNRPN(instance, model, sourceSinkOptions)
		if (nrpn === null) {
			return
		}

		const fadeType = getFadeType(instance, sourceSinkOptions[0])
		if (fadeType === null) {
			return
		}

		switch (fadeType.type) {
			case 'absolute':
				mixer.absoluteFade(nrpn, fadeType.fadeTimeMs, fadeType.level)
				return
			case 'relative':
				mixer.relativeFade(nrpn, fadeType.fadeTimeMs, fadeType.dbDelta)
				return
			case 'last-value':
				// XXX It's not clear if this ever even worked, and also it's
				//     wildly unclear what "last value" even means/meant, in the
				//     presence of fades of nonzero duration (not to mention
				//     stuff like manually adjusting the fader on the mixer
				//     surface generating a series of level messages).  Just
				//     don't do anything in this case for now.
				return
			default: {
				type assert_FadeTypeIsNever = Expect<IsNever<typeof fadeType>>
				instance.log('warn', `Invalid fade type ${(fadeType as any).type}, ignoring`)
				return
			}
		}
	}

	return {
		[LevelActionId.InputChannelLevelInMixOrLR]: {
			name: 'Fader channel level to mix',
			options: [InputChannelSource, MixOrLRSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, 'inputChannel', 'mix-or-lr')
			},
		},
		[LevelActionId.GroupLevelInMixOrLR]: {
			name: 'Fader group level to mix',
			options: [GroupSource, MixOrLRSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, 'group', 'mix-or-lr')
			},
		},
		[LevelActionId.FXReturnLevelInMixOrLR]: {
			name: 'Fader FX return level to mix',
			options: [FXReturnSource, MixOrLRSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, 'fxReturn', 'mix-or-lr')
			},
		},
		[LevelActionId.FXReturnLevelInGroup]: {
			name: 'Fader FX return level to group',
			options: [
				{
					type: 'static-text',
					id: 'invalid',
					label: 'Invalid operation!',
					value: 'FX returns can only be assigned to groups, not have their levels set in them.',
				},
			],
			callback: async () => {
				instance.log('warn', 'The "Fader FX return level to group" operation is invalid.  Don\'t use this action!')
			},
		},
		[LevelActionId.InputChannelLevelInFXSend]: {
			name: 'Fader channel level to FX send',
			options: [InputChannelSource, FXSendSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, ['inputChannel', 'fxSend'])
			},
		},
		[LevelActionId.GroupLevelInFXSend]: {
			name: 'Fader group level to FX send',
			options: [GroupSource, FXSendSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, ['group', 'fxSend'])
			},
		},
		[LevelActionId.FXReturnLevelInFXSend]: {
			name: 'Fader FX return level to FX send',
			options: [FXReturnSource, FXSendSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, ['fxReturn', 'fxSend'])
			},
		},
		[LevelActionId.MixOrLRLevelInMatrix]: {
			name: 'Fader mix level to matrix',
			options: [MixOrLRSource, MatrixSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, 'mix-or-lr', 'matrix')
			},
		},
		[LevelActionId.GroupLevelInMatrix]: {
			name: 'Fader group level to matrix',
			options: [GroupSource, MatrixSink, LevelOption, FadingOption],
			callback: async ({ options }) => {
				fadeAction(options, ['group', 'matrix'])
			},
		},
	}
}
