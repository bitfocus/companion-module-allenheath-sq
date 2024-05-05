import { Regex } from '@companion-module/base'

export default {
	getConfigFields() {
		this.CHOICES_INPUT_CHANNEL = []
		for (let i = 0; i < 48; i++) {
			this.CHOICES_INPUT_CHANNEL.push({ label: `CH ${i + 1}`, id: i })
		}

		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module is for Allen & Heath SQ series mixing consoles.',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 6,
				default: '192.168.0.5',
				regex: Regex.IP,
			},
			{
				type: 'dropdown',
				id: 'model',
				label: 'Console Type',
				width: 6,
				default: 'SQ5',
				choices: [
					{ id: 'SQ5', label: 'SQ 5' },
					{ id: 'SQ6', label: 'SQ 6' },
					{ id: 'SQ7', label: 'SQ 7' },
				],
			},
			{
				type: 'dropdown',
				id: 'level',
				label: 'NRPN Fader Law',
				width: 6,
				default: 'LinearTaper',
				choices: [
					{ id: 'LinearTaper', label: 'Linear Taper' },
					{ id: 'AudioTaper', label: 'Audio Taper' },
				],
			},
			{
				type: 'dropdown',
				label: 'Default talkback input channel',
				id: 'talkback',
				width: 6,
				default: '0',
				choices: this.CHOICES_INPUT_CHANNEL,
				minChoicesForSearch: 0,
			},
			{
				type: 'textinput',
				id: 'midich',
				label: 'MIDI channel',
				width: 6,
				min: 1,
				max: 16,
				default: 1,
			},
			{
				type: 'dropdown',
				id: 'status',
				label: 'Retrieve console status',
				width: 6,
				default: 'full',
				choices: [
					{ id: 'full', label: 'Fully at startup' },
					{ id: 'delay', label: 'Delayed at startup' },
					{ id: 'nosts', label: 'Not at startup' },
				],
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				width: 12,
			},
		]
	},
}
