import { combineRgb } from '@companion-module/base'

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

export function getFeedbacks(self, choices) {
	function muteFdb(label, { fg, bg }, choices, msb, offset) {
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
				color: fg,
				bgcolor: bg,
			},
			callback: (feedback, _context) => {
				const key = `mute_${msb}.${parseInt(feedback.options.channel) + offset}`
				return Boolean(self.fdbState[key])
			},
		}
	}

	return {
		mute_input: muteFdb('Input', { fg: WHITE, bg: CARMINE_RED }, choices.inputChannels, 0, 0),
		mute_lr: muteFdb('LR', { fg: WHITE, bg: CARMINE_RED }, [{ label: `LR`, id: 0 }], 0, 68),
		mute_aux: muteFdb('Aux', { fg: WHITE, bg: CARMINE_RED }, choices.mixesAndLR, 0, 69),
		mute_group: muteFdb('Group', { fg: WHITE, bg: CARMINE_RED }, choices.groups, 0, 48),
		mute_matrix: muteFdb('Matrix', { fg: WHITE, bg: CARMINE_RED }, choices.matrixes, 0, 85),
		mute_dca: muteFdb('DCA', { fg: WHITE, bg: CARMINE_RED }, choices.dcas, 2, 0),
		mute_fx_return: muteFdb('FX Return', { fg: WHITE, bg: CARMINE_RED }, choices.fxReturns, 0, 60),
		mute_fx_send: muteFdb('FX Send', { fg: WHITE, bg: CARMINE_RED }, choices.fxSends, 0, 81),
		mute_mutegroup: muteFdb('MuteGroup', { fg: WHITE, bg: CARMINE_RED }, choices.muteGroups, 4, 0),
	}
}
