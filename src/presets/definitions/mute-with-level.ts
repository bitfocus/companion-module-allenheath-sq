import type { CompanionPresetDefinitions, CompanionSimplePresetDefinition } from '@companion-module/base'
import { MuteActionId, StatusOptionId, StripOptionId } from '../../actions/schemas/mute.js'
import {
	InputChannelLevelInMixFeedbackId,
	InputChannelLevelInMixFeedbackInputChannelOptionId,
	InputChannelLevelInMixFeedbackMixOptionId,
} from '../../feedbacks/schemas/inputchannel-level-in-mix.js'
import { MuteFeedbackId } from '../../feedbacks/schemas/mute.js'
import type { MuteChannelWithLevelPresetId } from '../ids.js'
import type { SQManifest } from '../../manifest.js'
import type { Model } from '../../mixer/model.js'
import { LR, MuteOperation } from '../../types.js'
import { White, Black, CarmineRed } from '../../utils/colors.js'
import { type ZeroIndexed } from '../../utils/indexed.js'

export const MuteWithPresetChannelMixLocalVariableId = 'mix'

const MuteWithPresetChannelMixDescriptionLocalVariableId = 'mix-description'

const MuteWithPresetChannelUserFriendlyLevelLocalVariableId = 'mix-user-friendly-level'

/* MUTE + FADER LEVEL */
function createMuteInputPresetForChannel(
	ch: ZeroIndexed,
	channelLabel: string,
): CompanionSimplePresetDefinition<SQManifest> {
	const label = `${channelLabel}\\n$(local:${MuteWithPresetChannelMixDescriptionLocalVariableId})\\n$(local:${MuteWithPresetChannelUserFriendlyLevelLocalVariableId}) dB`

	return {
		type: 'simple',
		name: label,
		style: {
			text: label,
			size: 'auto',
			color: White,
			bgcolor: Black,
		},
		steps: [
			{
				down: [
					{
						actionId: MuteActionId.MuteInputChannel,
						options: {
							[StripOptionId]: {
								isExpression: false,
								value: ch + 1,
							},
							[StatusOptionId]: {
								isExpression: false,
								value: MuteOperation.Toggle,
							},
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: MuteFeedbackId.MuteInputChannel,
				options: {
					n: {
						isExpression: false,
						value: ch + 1,
					},
				},
				style: {
					color: Black,
					bgcolor: CarmineRed,
				},
			},
		],
		localVariables: [
			// The local variable identifying the sink mix, targeted for templating.
			{
				variableName: MuteWithPresetChannelMixLocalVariableId,
				variableType: 'simple',
				startupValue: {
					isExpression: false,
					value: LR,
				},
			},
			// Local variables evaluating to a description of the requested mix,
			// and the level of the input in the requested mix.
			{
				variableName: MuteWithPresetChannelUserFriendlyLevelLocalVariableId,
				variableType: 'feedback',
				feedbackId: InputChannelLevelInMixFeedbackId.LevelInMix,
				options: {
					[InputChannelLevelInMixFeedbackInputChannelOptionId]: {
						isExpression: false,
						value: ch + 1,
					},
					[InputChannelLevelInMixFeedbackMixOptionId]: {
						isExpression: true,
						value: `$(local:${MuteWithPresetChannelMixLocalVariableId})`,
					},
				},
			},
			{
				variableName: MuteWithPresetChannelMixDescriptionLocalVariableId,
				variableType: 'feedback',
				feedbackId: InputChannelLevelInMixFeedbackId.SinkDescription,
				options: {
					[InputChannelLevelInMixFeedbackMixOptionId]: {
						isExpression: true,
						value: `$(local:${MuteWithPresetChannelMixLocalVariableId})`,
					},
				},
			},
		],
	}
}

export function muteWithLevelPresets(model: Model): CompanionPresetDefinitions<SQManifest> {
	const presets: CompanionPresetDefinitions<SQManifest> = {}

	model.forEach('inputChannel', (channel: ZeroIndexed, channelLabel) => {
		presets[`mute-with-level-inputchannel${channel + 1}` satisfies MuteChannelWithLevelPresetId] =
			createMuteInputPresetForChannel(channel, channelLabel)
	})

	return presets
}
