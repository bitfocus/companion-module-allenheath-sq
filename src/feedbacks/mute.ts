import type { CompanionBooleanFeedbackDefinition, CompanionMigrationFeedback } from '@companion-module/base'
import { faderNumber } from '../fader-number.js'
import type { CompanionFeedbackDefinitions } from './manifest.js'
import type { Mixer } from '../mixer/mixer.js'
import type { InputOutputType } from '../mixer/model.js'
import { calculateMuteNRPN } from '../mixer/nrpn/mute.js'
import {
	AllMuteWithStripFeedbacks,
	MuteFeedbackFaderOptionId,
	MuteFeedbackId,
	type MuteFeedbacks,
} from './schemas/mute.js'
import { LRStrip } from '../types.js'
import { moveZeroIndexedOptionToOneIndexed } from '../upgrades/zero-indexed-to-one.js'
import { CarmineRed, White } from '../utils/colors.js'
import { type ZeroIndexed, zeroIndexedNumber } from '../utils/indexed.js'

const ObsoleteMuteFeedbackFaderOptionId = 'channel'

/**
 * Mute-LR feedbacks used to include a zero-indexed number identifying the LR
 * "channel" (i.e. always 0) being exposed.  Remove this option if it's present.
 */
export function tryRemoveChannelFromMuteLRFeedback(feedback: CompanionMigrationFeedback): boolean {
	if (feedback.feedbackId !== MuteFeedbackId.MuteLR) {
		return false
	}

	const options = feedback.options
	if (!(ObsoleteMuteFeedbackFaderOptionId in options)) {
		return false
	}

	delete options[ObsoleteMuteFeedbackFaderOptionId]

	return true
}

/**
 * Strip identification (e.g. input channel 3, mix 2, etc.) used to be done with
 * a zero-indexed number.  If the zero-indexed option is present, convert it to
 * a new one-indexed number option.
 */
export function tryMakeMuteFeedbackItemOneIndexed(feedback: CompanionMigrationFeedback): boolean {
	if (!AllMuteWithStripFeedbacks.has(feedback.feedbackId)) {
		return false
	}

	const options = feedback.options
	if (!(ObsoleteMuteFeedbackFaderOptionId in options)) {
		return false
	}

	moveZeroIndexedOptionToOneIndexed(options, ObsoleteMuteFeedbackFaderOptionId, MuteFeedbackFaderOptionId)

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

const CommonOptions = {
	type: 'boolean',
	description: 'Change color',
	defaultStyle: {
		color: White,
		bgcolor: CarmineRed,
	},
} as const satisfies Pick<CompanionBooleanFeedbackDefinition, 'type' | 'description' | 'defaultStyle'>

export function muteFeedbacks(mixer: Mixer): CompanionFeedbackDefinitions<MuteFeedbacks> {
	const model = mixer.model
	const counts = model.inputOutputCounts

	const faderOption = (label: string, type: Exclude<InputOutputType, 'lr'>) =>
		faderNumber(label, MuteFeedbackFaderOptionId, counts, type)

	function getMuted(type: InputOutputType, n: ZeroIndexed): boolean {
		const nrpn = calculateMuteNRPN(model, type, n)
		return mixer.muted(nrpn)
	}

	function stripOptions(
		label: string,
		type: Exclude<InputOutputType, 'lr'>,
	): Pick<CompanionBooleanFeedbackDefinition, 'name' | 'options' | 'callback'> {
		return {
			name: `Mute ${label}`,
			options: [faderOption(label, type)],
			callback: ({ options }) => getMuted(type, zeroIndexedNumber(Number(options[MuteFeedbackFaderOptionId]) - 1)),
		}
	}

	return {
		[MuteFeedbackId.MuteLR]: {
			...CommonOptions,
			name: 'Mute LR',
			options: [],
			callback: () => getMuted('lr', LRStrip),
		},
		[MuteFeedbackId.MuteInputChannel]: {
			...CommonOptions,
			...stripOptions('Input Channel', 'inputChannel'),
		},
		[MuteFeedbackId.MuteMix]: {
			...CommonOptions,
			...stripOptions('Mix', 'mix'),
		},
		[MuteFeedbackId.MuteGroup]: {
			...CommonOptions,
			...stripOptions('Group', 'group'),
		},
		[MuteFeedbackId.MuteMatrix]: {
			...CommonOptions,
			...stripOptions('Matrix', 'matrix'),
		},
		[MuteFeedbackId.MuteDCA]: {
			...CommonOptions,
			...stripOptions('DCA', 'dca'),
		},
		[MuteFeedbackId.MuteFXReturn]: {
			...CommonOptions,
			...stripOptions('FX Return', 'fxReturn'),
		},
		[MuteFeedbackId.MuteFXSend]: {
			...CommonOptions,
			...stripOptions('FX Send', 'fxSend'),
		},
		[MuteFeedbackId.MuteMuteGroup]: {
			...CommonOptions,
			...stripOptions('MuteGroup', 'muteGroup'),
		},
	}
}
