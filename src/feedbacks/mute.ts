import type { CompanionFeedbackDefinition, CompanionMigrationFeedback } from '@companion-module/base'
import { faderNumberZeroIndexed } from '../fader-number.js'
import { LRStrip } from '../mixer/lr.js'
import type { Mixer } from '../mixer/mixer.js'
import type { InputOutputType } from '../mixer/model.js'
import { calculateMuteNRPN } from '../mixer/nrpn/mute.js'
import { CarmineRed, White } from '../utils/colors.js'
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

const MuteFeedbackFaderOptionId = 'channel'

/**
 * Mute-LR feedbacks used to include a zero-indexed number identifying the LR
 * "channel" (i.e. always 0) being exposed.  Remove this option if it's present.
 */
export function tryRemoveChannelFromMuteLRFeedback(feedback: CompanionMigrationFeedback): boolean {
	if (feedback.feedbackId !== MuteFeedbackId.MuteLR) {
		return false
	}

	const options = feedback.options
	if (!(MuteFeedbackFaderOptionId in options)) {
		return false
	}

	delete options[MuteFeedbackFaderOptionId]

	return true
}

/** A map associating mutable input/output types to mute feedback IDs. */
export const typeToMuteFeedback = {
	inputChannel: MuteFeedbackId.MuteInputChannel,
	group: MuteFeedbackId.MuteGroup,
	mix: MuteFeedbackId.MuteMix,
	lr: MuteFeedbackId.MuteLR,
	muteGroup: MuteFeedbackId.MuteMuteGroup,
	matrix: MuteFeedbackId.MuteMatrix,
	fxReturn: MuteFeedbackId.MuteFXReturn,
	fxSend: MuteFeedbackId.MuteFXSend,
	dca: MuteFeedbackId.MuteDCA,
} as const satisfies Record<InputOutputType, MuteFeedbackId>

export function muteFeedbacks(mixer: Mixer): Record<MuteFeedbackId, CompanionFeedbackDefinition> {
	const counts = mixer.model.inputOutputCounts

	const faderOption = (label: string, type: Exclude<InputOutputType, 'lr'>) =>
		faderNumberZeroIndexed(label, MuteFeedbackFaderOptionId, counts, type)

	function muteFeedback(label: string, type: InputOutputType): CompanionFeedbackDefinition {
		return {
			type: 'boolean',
			name: `Mute ${label}`,
			description: 'Change colour',
			options: type === 'lr' ? [] : [faderOption(label, type)],
			defaultStyle: {
				color: White,
				bgcolor: CarmineRed,
			},
			callback: ({ options }, _context) => {
				const nrpn = calculateMuteNRPN(
					mixer.model,
					type,
					type === 'lr' ? LRStrip : zeroIndexedNumber(Number(options[MuteFeedbackFaderOptionId])),
				)
				return mixer.muted(nrpn)
			},
		}
	}

	return {
		[MuteFeedbackId.MuteLR]: muteFeedback('LR', 'lr'),
		[MuteFeedbackId.MuteInputChannel]: muteFeedback('Input', 'inputChannel'),
		[MuteFeedbackId.MuteMix]: muteFeedback('Mix', 'mix'),
		[MuteFeedbackId.MuteGroup]: muteFeedback('Group', 'group'),
		[MuteFeedbackId.MuteMatrix]: muteFeedback('Matrix', 'matrix'),
		[MuteFeedbackId.MuteDCA]: muteFeedback('DCA', 'dca'),
		[MuteFeedbackId.MuteFXReturn]: muteFeedback('FX Return', 'fxReturn'),
		[MuteFeedbackId.MuteFXSend]: muteFeedback('FX Send', 'fxSend'),
		[MuteFeedbackId.MuteMuteGroup]: muteFeedback('MuteGroup', 'muteGroup'),
	}
}
