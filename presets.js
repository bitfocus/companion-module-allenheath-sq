module.exports = {

	getPresets: function() {
		
		var presets = [];
		var self = this;
		
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
						color: self.rgb(255, 255, 255),
						bgcolor: self.rgb(0, 0, 0),
						latch: false
					},
					actions: [
						{
							action: typ,
							options: {
								strip: i,
								mute: 0
							}
						}
					],
					feedbacks: [
						{
							type: typ,
							options: {
								channel: i
							}
						}
					]
				};
				
				presets.push(pst);
			}
		}

		createtMute('Mute Input', 'Input channel', 'mute_input', self.chCount);
		createtMute('Mute Mix - Group', 'LR', 'mute_lr', 1, false);
		createtMute('Mute Mix - Group', 'Aux', 'mute_aux', self.mixCount);
		createtMute('Mute Mix - Group', 'Group', 'mute_group', self.grpCount);
		createtMute('Mute Mix - Group', 'Matrix', 'mute_matrix', self.mtxCount);
		createtMute('Mute FX', 'FX Send', 'mute_fx_send', self.fxsCount);
		createtMute('Mute FX', 'FX Return', 'mute_fx_return', self.fxrCount);
		createtMute('Mute DCA', 'DCA', 'mute_dca', self.dcaCount);
		createtMute('Mute MuteGroup', 'MuteGroup', 'mute_mutegroup', self.muteGroup);
		
		/* TALKBACK*/
		for (var i = 0; i < self.mixCount; i++) {
			let pst = {
				category: 'Talkback',
				label: 'Talk to AUX ' + (i + 1),
				bank: {
					style: 'text',
					text: 'Talk to AUX ' + (i + 1),
					size: 'auto',
					color: self.rgb(255, 255, 255),
					bgcolor: self.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: 'ch_to_mix',
						options: {
							inputChannel: `${self.config.talkback}`,
							mixAssign: [`99`],
							mixActive: false
						}
					},{
						action: 'ch_to_mix',
						options: {
							inputChannel: `${self.config.talkback}`,
							mixAssign: [`${i}`],
							mixActive: true
						}
					},{
						action: 'chlev_to_mix',
						options: {
							input: `${self.config.talkback}`,
							assign: `${i}`,
							level: '49'
						}
					},{
						action: 'mute_input',
						options: {
							strip: self.config.talkback,
							mute: 2
						}
					}
				],
				release_actions: [
					{
						action: 'ch_to_mix',
						options: {
							inputChannel: `${self.config.talkback}`,
							mixAssign: [`${i}`],
							mixActive: false
						}
					},{
						action: 'chlev_to_mix',
						options: {
							input: `${self.config.talkback}`,
							assign: `${i}`,
							level: '0'
						}
					},{
						action: 'mute_input',
						options: {
							strip: self.config.talkback,
							mute: 1
						}
					}
				]
			};
			
			presets.push(pst);
		}
		
		/* MUTE + FADER LEVEL */
		const createtMuteLevel = (cat, lab, typ, ch) => {
			let pst = {
				category: cat,
				label: lab,
				bank: {
					style: 'text',
					text: lab,
					size: 'auto',
					color: self.rgb(255, 255, 255),
					bgcolor: self.rgb(0, 0, 0),
					latch: false
				},
				actions: [
					{
						action: typ,
						options: {
							strip: ch,
							mute: 0
						}
					}
				],
				feedbacks: [
					{
						type: typ,
						options: {
							channel: ch
						}
					}
				]
			};
			
			presets.push(pst);
		}
		
		// Input -> Mix
		for (let i = 0; i < self.chCount; i++) {
		    let tmp = self.CHOICES_MIX;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x40], [0,0x44]);
                
                createtMuteLevel(`Mt+dB CH-${tmp[j].label}`, `CH ${i + 1}\\n${tmp[j].label}\\n\$(SQ:level_${rsp['channel'][0]}.${rsp['channel'][1]}) dB`, 'mute_input', i);
		    }
		}
		/**/
		
		return(presets);
	}
}