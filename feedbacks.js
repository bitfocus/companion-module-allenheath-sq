const callback = require('./callback.json');

module.exports = {
    
	getFeedbacks : function() {
        
        let feedbacks = {};

        feedbacks['mute_input'] = {
            label: 'Mute Input',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_input_0.', 0);
            }
        }
        
        feedbacks['mute_group'] = {
            label: 'Mute Group',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_group_0.', 48);
            }
        }
        
        feedbacks['mute_fx_return'] = {
            label: 'Mute FX Return',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_fx_return_0.', 60);
            }
        }
        
        feedbacks['mute_lr'] = {
            label: 'Mute LR',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_lr_0.', 68);
            }
        }
        
        feedbacks['mute_aux'] = {
            label: 'Mute Aux',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_aux_0.', 69);
            }
        }
        
        feedbacks['mute_fx_send'] = {
            label: 'Mute FX Send',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_fx_send_0.', 81);
            }
        }
        
        feedbacks['mute_matrix'] = {
            label: 'Mute Matrix',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_matrix_0.', 85);
            }
        }
        
        feedbacks['mute_dca'] = {
            label: 'Mute DCA',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_dca_2.', 0);
            }
        }
        
        feedbacks['mute_mutegroup'] = {
            label: 'Mute MuteGroup',
            description: 'Change colour',
            options: [
                {
                    type: 'colorpicker',
                    label: 'Foreground color',
                    id: 'fg',
                    default: this.rgb(255, 255, 255)
                },{
                    type: 'colorpicker',
                    label: 'Background color',
                    id: 'bg',
                    default: this.rgb(153, 0, 51)
                }
            ],
            callback: (feedback, bank) => {
                return this.feedbackStatus(feedback, bank, 'mute_mutegroup_4.', 0);
            }
        }
        
        return feedbacks;
	},
    
    feedbackStatus : function(feedback, bank, typ, ofs) {
        var ret = {};
        var pag, ban, strip;
        
        system.emit('db_get', 'feedbacks', function(res) {
            for ( let i = 1; i <= 99; i++ ) {
                for ( let j = 1; j <= 32; j++ ) {
                    if ( typeof res[i][j] == 'object' && Object.keys(res[i][j]).length !== 0 && 'options' in res[i][j][0]) {
                        if ( res[i][j][0]['id'] == feedback.id ) {
                            pag = i;
                            ban = j;
                        }
                    }
                }
            }
        });
        
        system.emit('db_get', 'bank_actions', function(res) {
            strip = res[pag][ban][0]['options']['strip'];
        });
        
        this.getVariable(typ + (ofs + parseInt(strip)), function(res) {
            if (res) {
                    ret = { color: feedback.options.fg, bgcolor: feedback.options.bg };
            } else {
                    ret = { color: bank.color, bgcolor: bank.bgcolor };
            }
        });
        
        return ret;
    }
	
}
