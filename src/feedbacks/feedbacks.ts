import { combineRgb, type CompanionFeedbackDefinition, type DropdownChoice } from '@companion-module/base'
import type { Choices } from '../choices.js'
import { type FeedbackDefinitions, type FeedbackId, MuteFeedbackId } from './feedback-ids.js'
import type { Mixer } from '../mixer/mixer.js'

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

export function getFeedbacks(mixer: Mixer, choices: Choices): FeedbackDefinitions<FeedbackId> {
	function muteFeedback(
		label: string,
		choices: DropdownChoice[],
		msb: number,
		offset: number,
	): CompanionFeedbackDefinition {
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
				const channel = Number(feedback.options.channel)
				const key = `mute_${msb}.${channel + offset}` as const
				return Boolean(mixer.fdbState[key])
			},
		}
	}

	return {
		[MuteFeedbackId.MuteInputChannel]: muteFeedback('Input', choices.inputChannels, 0, 0),
		[MuteFeedbackId.MuteLR]: muteFeedback('LR', [{ label: `LR`, id: 0 }], 0, 68),
		[MuteFeedbackId.MuteMix]: muteFeedback('Aux', choices.mixesAndLR, 0, 69),
		[MuteFeedbackId.MuteGroup]: muteFeedback('Group', choices.groups, 0, 48),
		[MuteFeedbackId.MuteMatrix]: muteFeedback('Matrix', choices.matrixes, 0, 85),
		[MuteFeedbackId.MuteDCA]: muteFeedback('DCA', choices.dcas, 2, 0),
		[MuteFeedbackId.MuteFXReturn]: muteFeedback('FX Return', choices.fxReturns, 0, 60),
		[MuteFeedbackId.MuteFXSend]: muteFeedback('FX Send', choices.fxSends, 0, 81),
		[MuteFeedbackId.MuteMuteGroup]: muteFeedback('MuteGroup', choices.muteGroups, 4, 0),
	}
}
