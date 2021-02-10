const { config } = require("chai");
const level      = require('./level.json');

module.exports = {

	getActions() {
		this.chCount    = 48;
		this.mixCount   = 12;
        this.grpCount   = 12;
        this.fxrCount   = 8;
        this.fxsCount   = 4;
        this.mtxCount   = 3;
        this.dcaCount   = 8;
        this.SoftKey    = 16;
		this.sceneCount = 300;
		
		let actions = {};

		this.CHOICES_INPUT_CHANNEL = [];
		for (let i = 0; i < this.chCount; i++) {
			this.CHOICES_INPUT_CHANNEL.push({ label: `CH ${i + 1}`, id: i });
		}
		
		this.CHOICES_SCENES = [];
		for (let i = 0; i < this.sceneCount; i++) {
			this.CHOICES_SCENES.push({ label: `SCENE ${i + 1}`, id: i });
		}

		this.CHOICES_MIX = [];
        this.CHOICES_MIX.push({ label: `LR`, id: 99 });
		for (let i = 0; i < this.mixCount; i++) {
			this.CHOICES_MIX.push({ label: `AUX ${i + 1}`, id: i });
		}
        
        this.CHOICES_GRP = [];
        for (let i = 0; i < this.grpCount; i++) {
            this.CHOICES_GRP.push({ label: `GROUP ${i + 1}`, id: i });
        }
        
        this.CHOICES_FXR = [];
        for (let i = 0; i < this.fxrCount; i++) {
            this.CHOICES_FXR.push({ label: `FX RETURN ${i + 1}`, id: i });
        }
        
        this.CHOICES_FXS = [];
        for (let i = 0; i < this.fxsCount; i++) {
            this.CHOICES_FXS.push({ label: `FX SEND ${i + 1}`, id: i });
        }
        
        this.CHOICES_MTX = [];
        for (let i = 0; i < this.mtxCount; i++) {
            this.CHOICES_MTX.push({ label: `MATRIX ${i + 1}`, id: i });
        }

		this.CHOICES_LEVEL = [];
        for (let i = 0; i < level[this.config.level].length; i++) {
            let dbStr = level[this.config.level][i][0];
			this.CHOICES_LEVEL.push({ label: `${dbStr} dB`, id: i})
		}
        
        this.CHOICES_PANLEVEL = [];
        for (let i = 0; i < level['PanBalance'].length; i++) {
            let dbStr = level['PanBalance'][i][0];
            this.CHOICES_PANLEVEL.push({ label: `${dbStr}`, id: i})
        }
        
        this.CHOICES_DCA = [];
        for (let i = 0; i < this.dcaCount; i++) {
            this.CHOICES_DCA.push({ label: `DCA ${i + 1}`, id: i });
        }
		
		this.CHOICES_SOFT = [];
		for (let i = 0; i < this.SoftKey; i++) {
			this.CHOICES_SOFT.push({ label: `SOFTKEY ${i + 1}`, id: i });
		}
        
        /* All fader choices */
        this.CHOICES_ALLFADER = [];
        this.CHOICES_ALLFADER.push({ label: `LR`, id: 0 });
        for (let i = 0; i < this.mixCount; i++) {
            this.CHOICES_ALLFADER.push({ label: `AUX ${i + 1}`, id: i + 1 });
        }
        for (let i = 0; i < this.fxsCount; i++) {
            this.CHOICES_ALLFADER.push({ label: `FX SEND ${i + 1}`, id: i + 1 + this.mixCount });
        }
        for (let i = 0; i < this.mtxCount; i++) {
            this.CHOICES_ALLFADER.push({ label: `MATRIX ${i + 1}`, id: i + 1 + this.mixCount + this.fxsCount });
        }
        for (let i = 0; i < this.dcaCount; i++) {
            this.CHOICES_ALLFADER.push({ label: `DCA ${i + 1}`, id: i + 1 + this.mixCount + this.fxsCount + this.mtxCount });
        }
        /* */

		this.muteOptions = (name, qty, ofs) => {
			this.CHOICES = [];
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i + ofs });
			}
			return [{
				type:    'dropdown',
				label:   name,
				id:      'strip',
				default: 1 + ofs,
				choices: this.CHOICES,
				minChoicesForSearch: 0
			},{
				type:    'checkbox',
				label:   'Mute',
				id:      'mute',
				default: true
			}]
		}

		this.faderOptions = (name, qty, ofs) => {
			this.CHOICES = [];
			for (let i = 1; i <= qty; i++) {
				this.CHOICES.push({ label: `${name} ${i}`, id: i + ofs });
			}
			return [{
				type:    'dropdown',
				label:   name,
				id:      'strip',
				default: 1 + ofs,
				choices: this.CHOICES,
				minChoicesForSearch: 0
			},{
				type:    'dropdown',
				label:   'Level',
				id:      'level',
				default: 0,
				choices: this.CHOICES_FADER,
				minChoicesForSearch: 0
			}]
		}


		// Actions for all
		actions['mute_input'] = {
			label: 'Mute Input',
			options: this.muteOptions('Input Channel', this.chCount, -1)
		};
        
		actions['mute_lr'] = {
			label: 'Mute LR',
			options: [{
                type:    'dropdown',
                label:   'LR',
                id:      'strip',
                default: 0,
                choices: [{ label: `LR`, id: 0 }],
                minChoicesForSearch: 99
            },{
                type:    'checkbox',
                label:   'Mute',
                id:      'mute',
                default: true
            }]
		}
        
		actions['mute_aux'] = {
			label: 'Mute Aux',
			options: this.muteOptions('Aux', 12, -1)
		}
		actions['mute_group'] = {
			label: 'Mute Group',
			options: this.muteOptions('Aux', 12, -1)
		}
		actions['mute_matrix'] = {
			label: 'Mute Matrix',
			options: this.muteOptions('Matrix', 3, -1)
		}
		actions['mute_fx_send'] = {
			label: 'Mute FX Send',
			options: this.muteOptions('FX Send', 4, -1)
		};
		actions['mute_fx_return'] = {
			label: 'Mute FX Return',
			options: this.muteOptions('FX Return', 8, -1)
		};
		actions['mute_dca'] = {
			label: 'Mute DCA',
			options: this.muteOptions('DCA', 8, -1)
		};
		actions['mute_mutegroup'] = {
			label: 'Mute MuteGroup',
			options: this.muteOptions('Mute MuteGroup', 8, -1)
		};
	
		if (this.config.model == 'SQ6' || this.config.model == 'SQ7') {
			// Soft rotary
			
		}
		
		actions['key_soft'] = {
			label: 'Press Softkey',
			options: [{
				type:    'dropdown',
				label:   'Soft Key',
				id:      'softKey',
				default: '0',
				choices: this.CHOICES_SOFT,
				minChoicesForSearch: 0
			},{
				type:    'dropdown',
				label:   'Key type',
				id:      'pressedsk',
				default: '1',
				choices: [
					{id: '0', label: 'Toggle'},
					{id: '1', label: 'Press'},
					{id: '2', label: 'Release'}
				],
				minChoicesForSearch: 5
			}]
		};
        
         actions['scene_recall'] = {
             label: 'Scene recall',
             options: [{
                 type:    'dropdown',
                 label:   'Scene Number',
                 id:      'sceneNumber',
                 default: '0',
                 choices: this.CHOICES_SCENES,
                 minChoicesForSearch: 0
             }]
         };
	
		actions['ch_to_mix'] = {
			label: 'Assign channel to mix',
			options: [{
				type:    'dropdown',
				label:   'Input Channel',
				id:      'inputChannel',
				default: '0',
				choices: this.CHOICES_INPUT_CHANNEL,
				minChoicesForSearch: 0
			},{
				type:     'dropdown',
				label:    'Mix',
				id:       'mixAssign',
				default:  [],
				multiple: true,
				choices:  this.CHOICES_MIX
			},{
                type:     'checkbox',
                label:    'Active',
                id:       'mixActive',
                default:  true
            }]
		};
                         
         actions['ch_to_grp'] = {
             label: 'Assign channel to group',
             options: [{
                 type:    'dropdown',
                 label:   'Input Channel',
                 id:      'inputChannel',
                 default: '0',
                 choices: this.CHOICES_INPUT_CHANNEL,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'Group',
                 id:       'grpAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_GRP
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'grpActive',
                 default:  true
             }]
         };

         actions['grp_to_mix'] = {
             label: 'Assign group to mix',
             options: [{
                 type:    'dropdown',
                 label:   'Group',
                 id:      'inputGrp',
                 default: '0',
                 choices: this.CHOICES_GRP,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'Mix',
                 id:       'mixAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_MIX
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'mixActive',
                 default:  true
             }]
         };
        
         actions['fxr_to_grp'] = {
             label: 'Assign FX Return to group',
             options: [{
                 type:    'dropdown',
                 label:   'FX Return',
                 id:      'inputFxr',
                 default: '0',
                 choices: this.CHOICES_FXR,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'Group',
                 id:       'grpAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_GRP
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'grpActive',
                 default:  true
             }]
         };

         actions['ch_to_fxs'] = {
             label: 'Assign channel to FX Send',
             options: [{
                 type:    'dropdown',
                 label:   'Input Channel',
                 id:      'inputChannel',
                 default: '0',
                 choices: this.CHOICES_INPUT_CHANNEL,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'FX Send',
                 id:       'fxsAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_FXS
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'fxsActive',
                 default:  true
             }]
         };
                         
         actions['grp_to_fxs'] = {
             label: 'Assign group to FX send',
             options: [{
                 type:    'dropdown',
                 label:   'Group',
                 id:      'inputGrp',
                 default: '0',
                 choices: this.CHOICES_GRP,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'FX Send',
                 id:       'fxsAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_FXS
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'fxsActive',
                 default:  true
             }]
         };
                         
         actions['fxr_to_fxs'] = {
             label: 'Assign FX return to FX send',
             options: [{
                 type:    'dropdown',
                 label:   'FX return',
                 id:      'inputFxr',
                 default: '0',
                 choices: this.CHOICES_FXR,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'FX Send',
                 id:       'fxsAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_FXS
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'fxsActive',
                 default:  true
             }]
         };
             
         actions['mix_to_mtx'] = {
             label: 'Assign mix to matrix',
             options: [{
                 type:    'dropdown',
                 label:   'Mix',
                 id:      'inputMix',
                 default: '0',
                 choices: this.CHOICES_MIX,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'Matrix',
                 id:       'mtxAssign',
                 default:  [],
                 multiple: true,
                 choices:  this.CHOICES_MTX
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'mtxActive',
                 default:  true
             }]
         };
                         
         actions['grp_to_mtx'] = {
             label: 'Assign group to matrix',
             options: [{
                 type:    'dropdown',
                 label:   'Group',
                 id:      'inputGrp',
                 default: '0',
                 choices: this.CHOICES_GRP,
                 minChoicesForSearch: 0
             },{
                 type:     'dropdown',
                 label:    'Matrix',
                 id:       'mtxAssign',
                 default: [],
                 multiple: true,
                 choices:  this.CHOICES_MTX
             },{
                 type:     'checkbox',
                 label:    'Active',
                 id:       'mtxActive',
                 default:  true
             }]
         };
        
        actions['chlev_to_mix'] = {
            label: 'Fader channel level to mix',
            options: [{
                type:    'dropdown',
                label:   'Input channel',
                id:      'input',
                default: '0',
                choices: this.CHOICES_INPUT_CHANNEL,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Mix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['grplev_to_mix'] = {
            label: 'Fader group level to mix',
            options: [{
                type:    'dropdown',
                label:   'Group',
                id:      'input',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Mix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['fxrlev_to_mix'] = {
            label: 'Fader FX return level to mix',
            options: [{
                type:    'dropdown',
                label:   'FX return',
                id:      'input',
                default: '0',
                choices: this.CHOICES_FXR,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Mix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['fxrlev_to_grp'] = {
            label: 'Fader FX return level to group',
            options: [{
                type:    'dropdown',
                label:   'FX return',
                id:      'input',
                default: '0',
                choices: this.CHOICES_FXR,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Group',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['chlev_to_fxs'] = {
            label: 'Fader channel level to FX send',
            options: [{
                type:    'dropdown',
                label:   'Input channel',
                id:      'input',
                default: '0',
                choices: this.CHOICES_INPUT_CHANNEL,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'FX Send',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_FXS,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['grplev_to_fxs'] = {
            label: 'Fader group level to FX send',
            options: [{
                type:    'dropdown',
                label:   'Group',
                id:      'input',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'FX Send',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_FXS,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['fxslev_to_fxs'] = {
            label: 'Fader FX return level to FX send',
            options: [{
                type:    'dropdown',
                label:   'FX return',
                id:      'input',
                default: '0',
                choices: this.CHOICES_FXR,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'FX Send',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_FXS,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '0',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['mixlev_to_mtx'] = {
            label: 'Fader mix level to matrix',
            options: [{
                type:    'dropdown',
                label:   'Mix',
                id:      'input',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Matrix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MTX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '49',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['grplev_to_mtx'] = {
            label: 'Fader group level to matrix',
            options: [{
                type:    'dropdown',
                label:   'Group',
                id:      'input',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Matrix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MTX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '49',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['level_to_output'] = {
            label: 'Fader level to output',
            options: [{
                type:    'dropdown',
                label:   'Fader',
                id:      'input',
                default: '0',
                choices: this.CHOICES_ALLFADER,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '49',
                multiple: false,
                choices:  this.CHOICES_LEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['chpan_to_mix'] = {
            label: 'Pan/Bal channel level to mix',
            options: [{
                type:    'dropdown',
                label:   'Input channel',
                id:      'input',
                default: '0',
                choices: this.CHOICES_INPUT_CHANNEL,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Mix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['grppan_to_mix'] = {
            label: 'Pan/Bal group level to mix',
            options: [{
                type:    'dropdown',
                label:   'Group',
                id:      'input',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Mix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['fxrpan_to_mix'] = {
            label: 'Pan/Bal FX return level to mix',
            options: [{
                type:    'dropdown',
                label:   'FX return',
                id:      'input',
                default: '0',
                choices: this.CHOICES_FXR,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Mix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['fxrpan_to_grp'] = {
            label: 'Fader FX return level to group',
            options: [{
                type:    'dropdown',
                label:   'FX return',
                id:      'input',
                default: '0',
                choices: this.CHOICES_FXR,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Group',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['mixpan_to_mtx'] = {
            label: 'Pan/Bal mix level to matrix',
            options: [{
                type:    'dropdown',
                label:   'Mix',
                id:      'input',
                default: '0',
                choices: this.CHOICES_MIX,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Matrix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MTX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['grppan_to_mtx'] = {
            label: 'Pan/Bal group level to matrix',
            options: [{
                type:    'dropdown',
                label:   'Group',
                id:      'input',
                default: '0',
                choices: this.CHOICES_GRP,
                minChoicesForSearch: 0
            },{
                type:    'dropdown',
                label:   'Matrix',
                id:      'assign',
                default: '0',
                choices: this.CHOICES_MTX,
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
        
        actions['pan_to_output'] = {
            label: 'Pan/Bal level to output',
            options: [{
                type:    'dropdown',
                label:   'Fader',
                id:      'input',
                default: '0',
                choices: this.CHOICES_ALLFADER.filter(function(val, idx, arr){return idx < 19}),
                minChoicesForSearch: 0
            },{
                type:     'dropdown',
                label:    'Level',
                id:       'level',
                default: '12',
                multiple: false,
                choices:  this.CHOICES_PANLEVEL,
                minChoicesForSearch: 0
            }]
        };
                         
        return actions;
	
	}
}
