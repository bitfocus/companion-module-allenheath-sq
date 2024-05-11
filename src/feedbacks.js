import { combineRgb } from '@companion-module/base'

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

export function getFeedbacks(self, choices) {
	function createtFdb(typ, lab, { fg, bg }, chs, msb, ofs) {
		return {
			type: 'boolean',
			name: `${typ} ${lab}`,
			description: 'Change colour',
			options: [
				{
					type: 'dropdown',
					label: lab,
					id: 'channel',
					default: 0,
					choices: chs,
					minChoicesForSearch: 0,
				},
			],
			defaultStyle: {
				color: fg,
				bgcolor: bg,
			},
			callback: (feedback, _context) => {
				const key = `${typ.toLowerCase()}_${msb}.${parseInt(feedback.options.channel) + ofs}`
				return Boolean(self.fdbState[key])
			},
		}
	}

	return {
		mute_input: createtFdb('Mute', 'Input', { fg: WHITE, bg: CARMINE_RED }, choices.inputChannels, 0, 0),
		mute_lr: createtFdb('Mute', 'LR', { fg: WHITE, bg: CARMINE_RED }, [{ label: `LR`, id: 0 }], 0, 68),
		mute_aux: createtFdb('Mute', 'Aux', { fg: WHITE, bg: CARMINE_RED }, choices.mixesAndLR, 0, 69),
		mute_group: createtFdb('Mute', 'Group', { fg: WHITE, bg: CARMINE_RED }, choices.groups, 0, 48),
		mute_matrix: createtFdb('Mute', 'Matrix', { fg: WHITE, bg: CARMINE_RED }, choices.matrixes, 0, 85),
		mute_dca: createtFdb('Mute', 'DCA', { fg: WHITE, bg: CARMINE_RED }, choices.dcas, 2, 0),
		mute_fx_return: createtFdb('Mute', 'FX Return', { fg: WHITE, bg: CARMINE_RED }, choices.fxReturns, 0, 60),
		mute_fx_send: createtFdb('Mute', 'FX Send', { fg: WHITE, bg: CARMINE_RED }, choices.fxSends, 0, 81),
		mute_mutegroup: createtFdb('Mute', 'MuteGroup', { fg: WHITE, bg: CARMINE_RED }, choices.muteGroups, 4, 0),
	}
}
