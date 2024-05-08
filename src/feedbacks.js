import { combineRgb } from '@companion-module/base'

const WHITE = combineRgb(255, 255, 255)
const CARMINE_RED = combineRgb(153, 0, 51)

export default {
	initFeedbacks: function (choices) {
		let self = this

		var feedbacks = {}

		const createtFdb = (nam, typ, lab, { fg, bg }, chs, msb, ofs) => {
			feedbacks[nam] = {
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
				callback: (feedback, bank) => {
					return this.feedbackStatus(
						feedback,
						bank,
						`${typ.toLowerCase()}_${msb}.` + (parseInt(feedback.options.channel) + ofs),
					)
				},
			}
		}

		/* Mute */
		createtFdb('mute_input', 'Mute', 'Input', { fg: WHITE, bg: CARMINE_RED }, choices.inputChannels, 0, 0)
		createtFdb('mute_lr', 'Mute', 'LR', { fg: WHITE, bg: CARMINE_RED }, [{ label: `LR`, id: 0 }], 0, 68)
		createtFdb('mute_aux', 'Mute', 'Aux', { fg: WHITE, bg: CARMINE_RED }, choices.mixesAndLR, 0, 69)
		createtFdb('mute_group', 'Mute', 'Group', { fg: WHITE, bg: CARMINE_RED }, this.CHOICES_GRP, 0, 48)
		createtFdb('mute_matrix', 'Mute', 'Matrix', { fg: WHITE, bg: CARMINE_RED }, this.CHOICES_MTX, 0, 85)
		createtFdb('mute_dca', 'Mute', 'DCA', { fg: WHITE, bg: CARMINE_RED }, this.CHOICES_DCA, 2, 0)
		createtFdb('mute_fx_return', 'Mute', 'FX Return', { fg: WHITE, bg: CARMINE_RED }, this.CHOICES_FXR, 0, 60)
		createtFdb('mute_fx_send', 'Mute', 'FX Send', { fg: WHITE, bg: CARMINE_RED }, this.CHOICES_FXS, 0, 81)
		createtFdb('mute_mutegroup', 'Mute', 'MuteGroup', { fg: WHITE, bg: CARMINE_RED }, this.CHOICES_MUTEGRP, 4, 0)

		this.setFeedbackDefinitions(feedbacks)
	},

	feedbackStatus: function (feedback, bank, val) {
		if (this.fdbState[val]) {
			return true
		}
		return false
	},
}
