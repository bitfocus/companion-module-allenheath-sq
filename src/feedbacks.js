import { combineRgb } from '@companion-module/base'

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

export function getFeedbacks(self, choices) {
	function muteFeedback(label, choices, msb, offset) {
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
				const key = `mute_${msb}.${parseInt(feedback.options.channel) + offset}`
				return Boolean(self.fdbState[key])
			},
		}
	}

	return {
		mute_input: muteFeedback('Input', choices.inputChannels, 0, 0),
		mute_lr: muteFeedback('LR', [{ label: `LR`, id: 0 }], 0, 68),
		mute_aux: muteFeedback('Aux', choices.mixesAndLR, 0, 69),
		mute_group: muteFeedback('Group', choices.groups, 0, 48),
		mute_matrix: muteFeedback('Matrix', choices.matrixes, 0, 85),
		mute_dca: muteFeedback('DCA', choices.dcas, 2, 0),
		mute_fx_return: muteFeedback('FX Return', choices.fxReturns, 0, 60),
		mute_fx_send: muteFeedback('FX Send', choices.fxSends, 0, 81),
		mute_mutegroup: muteFeedback('MuteGroup', choices.muteGroups, 4, 0),
	}
}
