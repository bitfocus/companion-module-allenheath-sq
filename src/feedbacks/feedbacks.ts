import { combineRgb, type CompanionFeedbackDefinition, type DropdownChoice } from '@companion-module/base'
import type { Choices } from '../choices.js'
import { type FeedbackDefinitions, type FeedbackId, MuteFeedbackId } from './feedback-ids.js'
import type { Mixer } from '../mixer/mixer.js'
import type { InputOutputType } from '../mixer/model.js'
import { calculateMuteNRPN } from '../mixer/nrpn/mute.js'

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

export function getFeedbacks(mixer: Mixer, choices: Choices): FeedbackDefinitions<FeedbackId> {
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
			callback: (feedback, _context) => {
				const { MSB, LSB } = calculateMuteNRPN(mixer.model, type, Number(feedback.options.channel))
				return Boolean(mixer.fdbState[`mute_${MSB}.${LSB}`])
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
