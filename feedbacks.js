const callback = require('./callback.json');

module.exports = {
    
	getFeedbacks : function() {
        
        var feedbacks = {};
        
        const createtFdb = (nam, typ, lab, col, chs, msb, ofs) => {
            let fg = this.rgb(col['fg'][0], col['fg'][1], col['fg'][2]);
            let bg = this.rgb(col['bg'][0], col['bg'][1], col['bg'][2]);
            
            feedbacks[nam] = {
                label: `${typ} ${lab}`,
                description: 'Change colour',
                options: [
                    {
                        type: 'colorpicker',
                        label: 'Foreground color',
                        id: 'fg',
                        default: fg
                    },{
                        type: 'colorpicker',
                        label: 'Background color',
                        id: 'bg',
                        default: bg
                    },{
        				type:    'dropdown',
        				label:   lab,
        				id:      'channel',
        				default: 0,
        				choices: chs,
        				minChoicesForSearch: 0
        			}
                ],
                callback: (feedback, bank) => {
                    return this.feedbackStatus(feedback, bank, `${typ.toLowerCase()}_${msb}.` + (parseInt(feedback.options.channel) + ofs));
                }
            }
        }
        
        /* Mute */
        createtFdb('mute_input', 'Mute', 'Input', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_INPUT_CHANNEL, 0, 0);
        createtFdb('mute_lr', 'Mute', 'LR', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_LR, 0, 68);
        createtFdb('mute_aux', 'Mute', 'Aux', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_MIX, 0, 69);
        createtFdb('mute_group', 'Mute', 'Group', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_GRP, 0, 48);
        createtFdb('mute_matrix', 'Mute', 'Matrix', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_MTX, 0, 85);
        createtFdb('mute_dca', 'Mute', 'DCA', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_DCA, 2, 0);
        createtFdb('mute_fx_return', 'Mute', 'FX Return', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_FXR, 0, 60);
        createtFdb('mute_fx_send', 'Mute', 'FX Send', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_FXS, 0, 81);
        createtFdb('mute_mutegroup', 'Mute', 'MuteGroup', {'fg':[255, 255, 255], 'bg':[153, 0, 51]}, this.CHOICES_MUTEGRP, 4, 0);
        
        return feedbacks;
	},
    
    feedbackStatus : function(feedback, bank, val) {
        var ret = {};
        
        if ( this.fdbState[val] ) {
            ret = { color: feedback.options.fg, bgcolor: feedback.options.bg };
        } else {
            ret = { color: bank.color, bgcolor: bank.bgcolor };
        }
        
        return ret;
    }
	
}
