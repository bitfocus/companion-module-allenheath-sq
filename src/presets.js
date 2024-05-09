import { combineRgb } from '@companion-module/base'

export function getPresets(self, model) {
	const presets = []

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
	createtMute('Mute MuteGroup', 'MuteGroup', 'mute_mutegroup', model.muteGroupCount)

	/* TALKBACK*/
	model.forEachMix((mix, mixLabel, mixDesc) => {
		let pst = {
			type: 'button',
			category: 'Talkback',
			name: `Talk to ${mixDesc}`,
			style: {
				text: `Talk to ${mixLabel}`,
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
								mixAssign: [`${mix}`],
								mixActive: true,
							},
						},
						{
							actionId: 'chlev_to_mix',
							options: {
								input: `${self.config.talkback}`,
								assign: `${mix}`,
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
								mixAssign: [`${mix}`],
								mixActive: false,
							},
						},
						{
							actionId: 'chlev_to_mix',
							options: {
								input: `${self.config.talkback}`,
								assign: `${mix}`,
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
	})

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
		model.forEachMixAndLR((mix, mixLabel) => {
			const rsp = self.getLevel(channel, mix, model.mixCount, [0x40, 0x40], [0, 0x44])
			createtMuteLevel(
				`Mt+dB CH-${mixLabel}`,
				`${channelLabel}\\n${mixLabel}\\n\$(SQ:level_${rsp['channel'][0]}.${rsp['channel'][1]}) dB`,
				'mute_input',
				channel,
			)
		})
	})
	/**/

	return presets
}
