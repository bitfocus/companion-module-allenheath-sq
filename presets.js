const callback = require('./callback.json');
const sqconfig = require('./sqconfig.json');

module.exports = {

	getPresets: function() {
		var sq = sqconfig['config'][this.config.model];
		var presets = [];
		
		/* MUTE */
		const createtMute = (cat, lab, typ, cnt, nr = true) => {
			var tmp = [];
			
			for (var i = 0; i < cnt; i++) {
				let pst = {
					category: cat,
					label: lab + (nr ? ' ' + (i + 1) : ''),
					bank: {
						style: 'text',
						text: lab + (nr ? ' ' + (i + 1) : ''),
						size: 'auto',
						color: this.rgb(255, 255, 255),
						bgcolor: this.rgb(0, 0, 0),
						latch: true
					},
					actions: [
						{
							action: typ,
							options: {
								strip: i,
								mute: true
							}
						}
					],
					release_actions: [
						{
							action: typ,
							options: {
								strip: i,
								mute: false
							}
						}
					],
					feedbacks: [
						{
							type: typ
						}
					]
				};
				
				presets.push(pst);
			}
		}

		createtMute('Mute Input', 'Input channel', 'mute_input', sq['chCount']);
		createtMute('Mute Mix', 'LR', 'mute_lr', 1, false);
		createtMute('Mute Mix', 'Aux', 'mute_aux', sq['mixCount']);
		createtMute('Mute Group', 'Group', 'mute_group', sq['grpCount']);
		createtMute('Mute Matrix', 'Matrix', 'mute_matrix', sq['mtxCount']);
		createtMute('Mute FX Send', 'FX ', 'mute_fx_send', sq['fxsCount']);
		createtMute('Mute FX Return', 'FX ', 'mute_fx_return', sq['fxrCount']);
		createtMute('Mute DCA', 'DCA ', 'mute_dca', sq['dcaCount']);
		createtMute('Mute MuteGroup', 'MuteGroup ', 'mute_mutegroup', sq['muteGroup']);
		
		/* TALKBACK*/
		for (var i = 0; i < sq['mixCount']; i++) {
			let pst = {
				category: 'Talkback',
				label: 'Talk to AUX ' + (i + 1),
				bank: {
					style: 'text',
					text: 'Talk to AUX ' + (i + 1),
					size: 'auto',
					color: this.rgb(255, 255, 255),
					bgcolor: this.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'ch_to_mix',
						options: {
							inputChannel: '0',
							mixAssign: [`99`],
							mixActive: false
						}
					},{
						action: 'ch_to_mix',
						options: {
							inputChannel: '0',
							mixAssign: [`${i}`],
							mixActive: true
						}
					},{
						action: 'chlev_to_mix',
						options: {
							input: '0',
							assign: `${i}`,
							level: '49'
						}
					},{
						action: 'mute_input',
						options: {
							strip: 0,
							mute: false
						}
					}
				],
				release_actions: [
					{
						action: 'ch_to_mix',
						options: {
							inputChannel: '0',
							mixAssign: [`${i}`],
							mixActive: false
						}
					},{
						action: 'chlev_to_mix',
						options: {
							input: '0',
							assign: `${i}`,
							level: '0'
						}
					},{
						action: 'mute_input',
						options: {
							strip: 0,
							mute: true
						}
					}
				]
			};
			
			presets.push(pst);
		}
		
		return(presets);
	}
}