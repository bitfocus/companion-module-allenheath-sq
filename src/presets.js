import { combineRgb } from '@companion-module/base'

export default {
	initPresets: function () {
		var presets = []
		var self = this
		const model = self.model

		/* MUTE */
		const createtMute = (cat, lab, typ, cnt, nr = true) => {
			var tmp = []

			for (var i = 0; i < cnt; i++) {
				let pst = {
					type: 'button',
					category: cat,
					name: lab + (nr ? ' ' + (i + 1) : ''),
					style: {
						text: lab + (nr ? ' ' + (i + 1) : ''),
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [
								{
									actionId: typ,
									options: {
										strip: i,
										mute: 0,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: typ,
							options: {
								channel: i,
							},
						},
					],
				}

				presets.push(pst)
			}
		}

		createtMute('Mute Input', 'Input channel', 'mute_input', model.chCount)
		createtMute('Mute Mix - Group', 'LR', 'mute_lr', 1, false)
		createtMute('Mute Mix - Group', 'Aux', 'mute_aux', model.mixCount)
		createtMute('Mute Mix - Group', 'Group', 'mute_group', model.grpCount)
		createtMute('Mute Mix - Group', 'Matrix', 'mute_matrix', model.mtxCount)
		createtMute('Mute FX', 'FX Send', 'mute_fx_send', model.fxsCount)
		createtMute('Mute FX', 'FX Return', 'mute_fx_return', model.fxrCount)
		createtMute('Mute DCA', 'DCA', 'mute_dca', model.dcaCount)
		createtMute('Mute MuteGroup', 'MuteGroup', 'mute_mutegroup', model.muteGroup)

		/* TALKBACK*/
		for (var i = 0; i < model.mixCount; i++) {
			let pst = {
				type: 'button',
				category: 'Talkback',
				name: 'Talk to AUX ' + (i + 1),
				style: {
					text: 'Talk to AUX ' + (i + 1),
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'ch_to_mix',
								options: {
									inputChannel: `${self.config.talkback}`,
									mixAssign: [`99`],
									mixActive: false,
								},
							},
							{
								actionId: 'ch_to_mix',
								options: {
									inputChannel: `${self.config.talkback}`,
									mixAssign: [`${i}`],
									mixActive: true,
								},
							},
							{
								actionId: 'chlev_to_mix',
								options: {
									input: `${self.config.talkback}`,
									assign: `${i}`,
									level: '49',
								},
							},
							{
								actionId: 'mute_input',
								options: {
									strip: self.config.talkback,
									mute: 2,
								},
							},
						],
						up: [
							{
								actionId: 'ch_to_mix',
								options: {
									inputChannel: `${self.config.talkback}`,
									mixAssign: [`${i}`],
									mixActive: false,
								},
							},
							{
								actionId: 'chlev_to_mix',
								options: {
									input: `${self.config.talkback}`,
									assign: `${i}`,
									level: '0',
								},
							},
							{
								actionId: 'mute_input',
								options: {
									strip: self.config.talkback,
									mute: 1,
								},
							},
						],
					},
				],
				feedbacks: [],
			}

			presets.push(pst)
		}

		/* MUTE + FADER LEVEL */
		const createtMuteLevel = (cat, lab, typ, ch) => {
			let pst = {
				type: 'button',
				category: cat,
				name: lab,
				style: {
					text: lab,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: typ,
								options: {
									strip: ch,
									mute: 0,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: typ,
						options: {
							channel: ch,
						},
					},
				],
			}

			presets.push(pst)
		}

		// Input -> Mix
		model.forEachInputChannel((channel, channelLabel) => {
			let tmp = self.CHOICES_MIX
			for (let j = 0; j < tmp.length; j++) {
				const rsp = self.getLevel(channel, tmp[j].id, model.mixCount, [0x40, 0x40], [0, 0x44])
				createtMuteLevel(
					`Mt+dB CH-${tmp[j].label}`,
					`${channelLabel}\\n${tmp[j].label}\\n\$(SQ:level_${rsp['channel'][0]}.${rsp['channel'][1]}) dB`,
					'mute_input',
					channel,
				)
			}
		})
		/**/

		self.setPresetDefinitions(presets)
	},
}
