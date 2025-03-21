import type { CompanionInputFieldDropdown, CompanionOptionValues } from '@companion-module/base'
import type { ActionDefinitions } from './actionid.js'
import type { Choices } from '../choices.js'
import { getFadeParameters } from './fading.js'
import type { sqInstance } from '../instance.js'
import type { Mixer } from '../mixer/mixer.js'
import type { InputOutputType, Model } from '../mixer/model.js'
import type { Param } from '../mixer/nrpn/param.js'
import {
	computeParameters,
	LevelInMixOrLRBase,
	LevelInSinkBase,
	type LevelInMixOrLRType,
	type LevelInSinkType,
	type LRLevelInSinkType,
	MixOrLRLevelInSinkBase,
} from '../mixer/parameters.js'
import { toInputOutput } from './to-source-or-sink.js'

/**
 * Action IDs for all actions that alter the level of a mixer source in a mixer
 * sink.
 */
export enum LevelActionId {
	InputChannelLevelInMixOrLR = 'chlev_to_mix',
	GroupLevelInMixOrLR = 'grplev_to_mix',
	FXReturnLevelInMixOrLR = 'fxrlev_to_mix',
	FXReturnLevelInGroup = 'fxrlev_to_grp',
	InputChannelLevelInFXSend = 'chlev_to_fxs',
	GroupLevelInFXSend = 'grplev_to_fxs',
	// The "fxslev" typo in the next line is in fact correct until it can be
	// corrected in an upgrade script.
	FXReturnLevelInFXSend = 'fxslev_to_fxs',
	MixOrLRLevelInMatrix = 'mixlev_to_mtx',
	GroupLevelInMatrix = 'grplev_to_mtx',
}

type LevelType = {
	source: number
	sourceType: InputOutputType
	sink: number
	sinkType: InputOutputType
	param: Param
}

function getLevelType(
	instance: sqInstance,
	model: Model,
	options: CompanionOptionValues,
	[srcType, snkType, levelType]:
		| [InputOutputType, InputOutputType, LevelInSinkType]
		| [LevelInMixOrLRType, 'mix-or-lr']
		| ['mix-or-lr', LRLevelInSinkType],
): LevelType | null {
	const src = toInputOutput(instance, model, options.input, srcType)
	if (src === null) {
		return null
	}
	const [source, sourceType] = src

	const snk = toInputOutput(instance, model, options.assign, snkType)
	if (snk === null) {
		return null
	}
	const [sink, sinkType] = snk

	const base =
		snkType === 'mix-or-lr'
			? LevelInMixOrLRBase[srcType][sinkType === 'lr' ? 'lr' : 'mix']
			: srcType === 'mix-or-lr'
				? MixOrLRLevelInSinkBase[snkType][sourceType === 'lr' ? 'lr' : 'mix']
				: LevelInSinkBase[levelType]

	return {
		source,
		sourceType,
		sink,
		sinkType,
		param: computeParameters(source, sink, model.inputOutputCounts[sinkType], base),
	}
}

/**
 * Generate action definitions for setting the levels of sources in sinks: input
 * channels in mixes, mixes in LR, and so on and so forth.
 *
 * @param instance
 *   The instance for which actions are being generated.
 * @param mixer
 *   The mixer object to use when executing the actions.
 * @param choices
 *   Option choices for use in the actions.
 * @param levelOption
 *   An action option specifying all levels a source in a sink can be set to.
 * @param fadingOption
 *   An action option specifying various fade times over which the set to level
 *   should take place.
 * @returns
 *   The set of all level action definitions.
 */
export function levelActions(
	instance: sqInstance,
	mixer: Mixer,
	choices: Choices,
	levelOption: CompanionInputFieldDropdown,
	fadingOption: CompanionInputFieldDropdown,
): ActionDefinitions<LevelActionId> {
	const model = mixer.model

	return {
		[LevelActionId.InputChannelLevelInMixOrLR]: {
			name: 'Fader channel level to mix',
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['inputChannel', 'mix-or-lr'])
				if (levelType === null) {
					return
				}
				const { source: inputChannel, sink: mix, sinkType, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				if (sinkType === 'lr') {
					mixer.fadeInputChannelLevelInLR(inputChannel, start, end, fadeTimeMs)
				} else {
					mixer.fadeInputChannelLevelInMix(inputChannel, mix, start, end, fadeTimeMs)
				}
			},
		},
		[LevelActionId.GroupLevelInMixOrLR]: {
			name: 'Fader group level to mix',
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['group', 'mix-or-lr'])
				if (levelType === null) {
					return
				}
				const { source: group, sink: mix, sinkType, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				if (sinkType === 'lr') {
					mixer.fadeGroupLevelInLR(group, start, end, fadeTimeMs)
				} else {
					mixer.fadeGroupLevelInMix(group, mix, start, end, fadeTimeMs)
				}
			},
		},
		[LevelActionId.FXReturnLevelInMixOrLR]: {
			name: 'Fader FX return level to mix',
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['fxReturn', 'mix-or-lr'])
				if (levelType === null) {
					return
				}
				const { source: fxReturn, sink: mix, sinkType, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				if (sinkType === 'lr') {
					mixer.fadeFXReturnLevelInLR(fxReturn, start, end, fadeTimeMs)
				} else {
					mixer.fadeFXReturnLevelInMix(fxReturn, mix, start, end, fadeTimeMs)
				}
			},
		},
		[LevelActionId.FXReturnLevelInGroup]: {
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['fxReturn', 'group', 'fxReturn-group'])
				if (levelType === null) {
					return
				}
				const { source: fxReturn, sink: group, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				mixer.fadeFXReturnLevelInGroup(fxReturn, group, start, end, fadeTimeMs)
			},
		},
		[LevelActionId.InputChannelLevelInFXSend]: {
			name: 'Fader channel level to FX send',
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
					label: 'FX Send',
					id: 'assign',
					default: 0,
					choices: choices.fxSends,
					minChoicesForSearch: 0,
				},
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['inputChannel', 'fxSend', 'inputChannel-fxSend'])
				if (levelType === null) {
					return
				}
				const { source: inputChannel, sink: fxSend, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				mixer.fadeInputChannelLevelInFXSend(inputChannel, fxSend, start, end, fadeTimeMs)
			},
		},
		[LevelActionId.GroupLevelInFXSend]: {
			name: 'Fader group level to FX send',
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
					label: 'FX Send',
					id: 'assign',
					default: 0,
					choices: choices.fxSends,
					minChoicesForSearch: 0,
				},
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['group', 'fxSend', 'group-fxSend'])
				if (levelType === null) {
					return
				}
				const { source: group, sink: fxSend, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				mixer.fadeGroupLevelInFXSend(group, fxSend, start, end, fadeTimeMs)
			},
		},
		[LevelActionId.FXReturnLevelInFXSend]: {
			name: 'Fader FX return level to FX send',
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
					label: 'FX Send',
					id: 'assign',
					default: 0,
					choices: choices.fxSends,
					minChoicesForSearch: 0,
				},
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['fxReturn', 'fxSend', 'fxReturn-fxSend'])
				if (levelType === null) {
					return
				}
				const { source: fxReturn, sink: fxSend, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				mixer.fadeFXReturnLevelInFXSend(fxReturn, fxSend, start, end, fadeTimeMs)
			},
		},
		[LevelActionId.MixOrLRLevelInMatrix]: {
			name: 'Fader mix level to matrix',
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['mix-or-lr', 'matrix'])
				if (levelType === null) {
					return
				}
				const { source: mix, sourceType, sink: matrix, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				if (sourceType === 'lr') {
					mixer.fadeLRLevelInMatrix(matrix, start, end, fadeTimeMs)
				} else {
					mixer.fadeMixLevelInMatrix(mix, matrix, start, end, fadeTimeMs)
				}
			},
		},
		[LevelActionId.GroupLevelInMatrix]: {
			name: 'Fader group level to matrix',
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
				levelOption,
				fadingOption,
			],
			callback: async ({ options }) => {
				const levelType = getLevelType(instance, model, options, ['group', 'matrix', 'group-matrix'])
				if (levelType === null) {
					return
				}
				const { source: group, sink: matrix, param } = levelType

				const fade = getFadeParameters(instance, options, param)
				if (fade === null) {
					return
				}
				const { start, end, fadeTimeMs } = fade

				mixer.fadeGroupLevelInMatrix(group, matrix, start, end, fadeTimeMs)
			},
		},
	}
}
