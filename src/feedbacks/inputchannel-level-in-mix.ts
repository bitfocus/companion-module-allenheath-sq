import type { CompanionFeedbackDefinitions } from '@companion-module/base'
import { toMixOrLR, toSourceOrSink } from '../actions/to-source-or-sink.js'
import { type Choices, mixOrLROption } from '../choices.js'
import { faderNumber } from '../fader-number.js'
import type { sqInstance } from '../instance.js'
import type { Mixer } from '../mixer/mixer.js'
import { splitNRPN } from '../mixer/nrpn/nrpn.js'
import { LevelNRPNCalculator } from '../mixer/nrpn/source-to-sink.js'
import {
	InputChannelLevelInMixFeedbackId,
	InputChannelLevelInMixFeedbackInputChannelOptionId,
	InputChannelLevelInMixFeedbackMixOptionId,
	type InputChannelLevelInMixFeedbackMixOptions,
	type InputChannelLevelInMixFeedbackOptions,
	type InputChannelLevelInMixFeedbacks,
} from './schemas/inputchannel-level-in-mix.js'
import { LR, LRStrip } from '../types.js'
import type { ZeroIndexed } from '../utils/indexed.js'

/**
 * Feedbacks used in defining the "mute input channel in a specific mix" preset
 * buttons, that mute/unmute on press and display the level of the channel in
 * the mix on them.
 *
 * These aren't really intended for end-user use.  But if we want to use them
 * internally, they have to be exposed externally.  So it goes.
 *
 * @param instance
 * @param mixer
 * @param mixesAndLR
 * @returns
 */
export function inputChannelLevelInMixFeedbacks(
	instance: sqInstance,
	mixer: Mixer,
	mixesAndLR: Choices['mixesAndLR'],
): CompanionFeedbackDefinitions<InputChannelLevelInMixFeedbacks> {
	const model = mixer.model

	const SelectInputChannel = faderNumber(
		'Input Channel',
		InputChannelLevelInMixFeedbackInputChannelOptionId,
		model.inputOutputCounts,
		'inputChannel',
	)
	const getInputChannel = (options: InputChannelLevelInMixFeedbackOptions) =>
		toSourceOrSink(instance, model, options[InputChannelLevelInMixFeedbackInputChannelOptionId], 'inputChannel')

	const SelectMixOrLR = mixOrLROption('Mix', InputChannelLevelInMixFeedbackMixOptionId, mixesAndLR)

	const getMixOrLR = (options: InputChannelLevelInMixFeedbackMixOptions) =>
		toMixOrLR(instance, model, options[InputChannelLevelInMixFeedbackMixOptionId])

	return {
		[InputChannelLevelInMixFeedbackId.LevelInMix]: {
			type: 'value',
			name: 'Level of Input Channel in Mix',
			options: [SelectInputChannel, SelectMixOrLR],
			callback: ({ options }): string => {
				const source = getInputChannel(options)
				if (source === null) {
					return ''
				}

				const sink = getMixOrLR(options)
				if (sink === null) {
					return ''
				}

				const { sinkType, sinkStrip }: { sinkType: 'lr' | 'mix'; sinkStrip: ZeroIndexed } =
					sink === LR
						? {
								sinkType: 'lr',
								sinkStrip: LRStrip,
							}
						: {
								sinkType: 'mix',
								sinkStrip: sink,
							}

				const { MSB, LSB } = splitNRPN(
					LevelNRPNCalculator.get(model, ['inputChannel', sinkType]).calculate(source, sinkStrip),
				)
				// Delegate to the MSB/LSB-specified level variable.
				return `$(${instance.label}:level_${MSB}.${LSB})`
			},
		},
		[InputChannelLevelInMixFeedbackId.SinkDescription]: {
			type: 'value',
			name: 'Mix description',
			options: [SelectMixOrLR],
			callback: ({ options }): string => {
				const sink = getMixOrLR(options)
				if (sink === null) {
					return ''
				}

				return sink === LR ? 'LR' : `Mix ${sink + 1}`
			},
		},
	}
}
