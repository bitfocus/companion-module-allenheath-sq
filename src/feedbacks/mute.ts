import { combineRgb, type CompanionFeedbackDefinition, type DropdownChoice } from '@companion-module/base'
import type { Choices } from '../choices.js'
import { type FeedbackDefinitions, type FeedbackId } from './feedback-ids.js'
import type { Mixer } from '../mixer/mixer.js'
import type { InputOutputType } from '../mixer/model.js'
import { calculateMuteNRPN } from '../mixer/nrpn/mute.js'
import { zeroIndexedNumber } from '../utils/indexed.js'

/**
 * Feedback IDs for feedbacks reacting to the mute status of particular mixer
 * sources/sinks.
 */
export const MuteFeedbackId = {
	MuteInputChannel: 'mute_input',
	MuteLR: 'mute_lr',
	MuteMix: 'mute_aux',
	MuteGroup: 'mute_group',
	MuteMatrix: 'mute_matrix',
	MuteDCA: 'mute_dca',
	MuteFXReturn: 'mute_fx_return',
	MuteFXSend: 'mute_fx_send',
	MuteMuteGroup: 'mute_mutegroup',
} as const

export type MuteFeedbackId = (typeof MuteFeedbackId)[keyof typeof MuteFeedbackId]

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

/** A map associating mutable input/output types to mute feedback IDs. */
export const typeToMuteFeedback: Record<InputOutputType, MuteFeedbackId> = {
	inputChannel: MuteFeedbackId.MuteInputChannel,
	group: MuteFeedbackId.MuteGroup,
	mix: MuteFeedbackId.MuteMix,
	lr: MuteFeedbackId.MuteLR,
	muteGroup: MuteFeedbackId.MuteMuteGroup,
	matrix: MuteFeedbackId.MuteMatrix,
	fxReturn: MuteFeedbackId.MuteFXReturn,
	fxSend: MuteFeedbackId.MuteFXSend,
	dca: MuteFeedbackId.MuteDCA,
}

export function muteFeedbacks(mixer: Mixer, choices: Choices): FeedbackDefinitions<FeedbackId> {
	function muteFeedback(label: string, type: InputOutputType, choices: DropdownChoice[]): CompanionFeedbackDefinition {
		return {
			type: 'boolean',
			name: `Mute ${label}`,
			description: 'Change colour',
			options: [
				{
					type: 'dropdown',
					label,
					id: 'channel',
					default: 0,
					choices,
					minChoicesForSearch: 0,
				},
			],
			defaultStyle: {
				color: WHITE,
				bgcolor: CARMINE_RED,
			},
			callback: ({ options }, _context) => {
				const nrpn = calculateMuteNRPN(mixer.model, type, zeroIndexedNumber(Number(options.channel)))
				return mixer.muted(nrpn)
			},
		}
	}

	return {
		[MuteFeedbackId.MuteInputChannel]: muteFeedback('Input', 'inputChannel', choices.inputChannels),
		[MuteFeedbackId.MuteLR]: muteFeedback('LR', 'lr', [{ label: `LR`, id: 0 }]),
		[MuteFeedbackId.MuteMix]: muteFeedback('Aux', 'mix', choices.mixes),
		[MuteFeedbackId.MuteGroup]: muteFeedback('Group', 'group', choices.groups),
		[MuteFeedbackId.MuteMatrix]: muteFeedback('Matrix', 'matrix', choices.matrixes),
		[MuteFeedbackId.MuteDCA]: muteFeedback('DCA', 'dca', choices.dcas),
		[MuteFeedbackId.MuteFXReturn]: muteFeedback('FX Return', 'fxReturn', choices.fxReturns),
		[MuteFeedbackId.MuteFXSend]: muteFeedback('FX Send', 'fxSend', choices.fxSends),
		[MuteFeedbackId.MuteMuteGroup]: muteFeedback('MuteGroup', 'muteGroup', choices.muteGroups),
	}
}
