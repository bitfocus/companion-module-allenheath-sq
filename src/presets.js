import { combineRgb } from '@companion-module/base'

const White = combineRgb(255, 255, 255)
const Black = combineRgb(0, 0, 0)

export function getPresets(self, model, talkbackChannel) {
	const presets = {}

	/* MUTE */
	const createtMute = (cat, lab, typ, cnt, nr = true) => {
		for (var i = 0; i < cnt; i++) {
			const suffix = cnt > 1 ? `_${i}` : ''
			presets[`preset_${typ}${suffix}`] = {
				type: 'button',
				category: cat,
				name: lab + (nr ? ' ' + (i + 1) : ''),
				style: {
					text: lab + (nr ? ' ' + (i + 1) : ''),
					size: 'auto',
					color: White,
					bgcolor: Black,
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
		}
	}

	createtMute('Mute Input', 'Input channel', 'mute_input', model.count.inputChannel)
	createtMute('Mute Mix - Group', 'LR', 'mute_lr', 1, false)
	createtMute('Mute Mix - Group', 'Aux', 'mute_aux', model.count.mix)
	createtMute('Mute Mix - Group', 'Group', 'mute_group', model.count.group)
	createtMute('Mute Mix - Group', 'Matrix', 'mute_matrix', model.count.matrix)
	createtMute('Mute FX', 'FX Send', 'mute_fx_send', model.count.fxSend)
	createtMute('Mute FX', 'FX Return', 'mute_fx_return', model.count.fxReturn)
	createtMute('Mute DCA', 'DCA', 'mute_dca', model.count.dca)
	createtMute('Mute MuteGroup', 'MuteGroup', 'mute_mutegroup', model.count.muteGroup)

	/* TALKBACK*/
	model.forEachMix((mix, mixLabel, mixDesc) => {
		presets[`preset_talkback_mix${mix}`] = {
			type: 'button',
			category: 'Talkback',
			name: `Talk to ${mixDesc}`,
			style: {
				text: `Talk to ${mixLabel}`,
				size: 'auto',
				color: White,
				bgcolor: Black,
			},
			steps: [
				{
					down: [
						{
							actionId: 'ch_to_mix',
							options: {
								inputChannel: `${talkbackChannel}`,
								mixAssign: [`99`],
								mixActive: false,
							},
						},
						{
							actionId: 'ch_to_mix',
							options: {
								inputChannel: `${talkbackChannel}`,
								mixAssign: [`${mix}`],
								mixActive: true,
							},
						},
						{
							actionId: 'chlev_to_mix',
							options: {
								input: `${talkbackChannel}`,
								assign: `${mix}`,
								level: '49',
							},
						},
						{
							actionId: 'mute_input',
							options: {
								strip: talkbackChannel,
								mute: 2,
							},
						},
					],
					up: [
						{
							actionId: 'ch_to_mix',
							options: {
								inputChannel: `${talkbackChannel}`,
								mixAssign: [`${mix}`],
								mixActive: false,
							},
						},
						{
							actionId: 'chlev_to_mix',
							options: {
								input: `${talkbackChannel}`,
								assign: `${mix}`,
								level: '0',
							},
						},
						{
							actionId: 'mute_input',
							options: {
								strip: talkbackChannel,
								mute: 1,
							},
						},
					],
				},
			],
			feedbacks: [],
		}
	})

	/* MUTE + FADER LEVEL */
	const createtMuteLevel = (cat, lab, typ, ch, mix) => {
		const mixId = mix === 99 ? 'lr' : `mix${mix}`
		presets[`preset_mute_input${ch}_${mixId}`] = {
			type: 'button',
			category: cat,
			name: lab,
			style: {
				text: lab,
				size: 'auto',
				color: White,
				bgcolor: Black,
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
	}

	// Input -> Mix
	model.forEachInputChannel((channel, channelLabel) => {
		model.forEachMixAndLR((mix, mixLabel) => {
			const rsp = self.getLevel(channel, mix, model.count.mix, [0x40, 0x40], [0, 0x44])
			createtMuteLevel(
				`Mt+dB CH-${mixLabel}`,
				`${channelLabel}\\n${mixLabel}\\n\$(SQ:level_${rsp['channel'][0]}.${rsp['channel'][1]}) dB`,
				'mute_input',
				channel,
				mix,
			)
		})
	})
	/**/

	return presets
}
