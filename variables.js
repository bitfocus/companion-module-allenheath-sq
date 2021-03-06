const callback = require('./callback.json');

module.exports = {

    getVariables() {
        
        var variables = [];
        var self = this;
        let rsp;
        
        variables.push({
           label: 'Scene - Current',
           name:  'currentScene'
        });
		
		for (let i = 0; i < self.chCount; i++) {
		    let tmp = self.CHOICES_MIX;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x40], [0,0x44]);
			    
                variables.push({
                   label: `CH ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.grpCount; i++) {
	        let tmp = self.CHOICES_MIX;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x45], [0x30,0x04]);
			    
			    variables.push({
                   label: `Group ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.fxrCount; i++) {
	        let tmp = self.CHOICES_MIX;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.mixCount, [0x40,0x46], [0x3C,0x14]);
			    
			    variables.push({
                   label: `FX Return ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.fxrCount; i++) {
		    let tmp = self.CHOICES_GRP;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.grpCount, [0,0x4B], [0,0x34]);
			    
			    variables.push({
                   label: `FX Return ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.chCount; i++) {
            let tmp = self.CHOICES_FXS;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.fxsCount, [0,0x4C], [0,0x14]);
			    
			    variables.push({
                   label: `CH ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.grpCount; i++) {
	        let tmp = self.CHOICES_FXS;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.fxsCount, [0,0x4D], [0,0x54]);
			    
			    variables.push({
                   label: `Group ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.fxrCount; i++) {
	        let tmp = self.CHOICES_FXS;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.fxsCount, [0,0x4E], [0,0x04]);
			    
			    variables.push({
                   label: `FX Return ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		let tmp = self.CHOICES_MTX;
        for ( let j = 0; j < tmp.length; j++ ) {
		    rsp = self.getLevel(0, tmp[j].id, self.mtxCount, [0,0x4E], [0,0x24]);
		    
		    variables.push({
               label: `LR -> ${tmp[j].label} Level`,
               name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
            });
	    }
		for (let i = 0; i < self.mixCount; i++) {
		    let tmp = self.CHOICES_MTX;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.mtxCount, [0x4E,0x4E], [0x24,0x27]);
			    
			    variables.push({
                   label: `Mix ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		for (let i = 0; i < self.grpCount; i++) {
	        let tmp = self.CHOICES_MTX;
	        for ( let j = 0; j < tmp.length; j++ ) {
			    rsp = self.getLevel(i, tmp[j].id, self.mtxCount, [0,0x4E], [0,0x4B]);
			    
			    variables.push({
                   label: `Group ${i + 1} -> ${tmp[j].label} Level`,
                   name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
                });
		    }
		}
		
		tmp = [];
        tmp.push({ label: `LR`, id: 0 });
        for (let i = 0; i < this.mixCount; i++) {
            tmp.push({ label: `AUX ${i + 1}`, id: i + 1 });
        }
        for (let i = 0; i < this.fxsCount; i++) {
            tmp.push({ label: `FX SEND ${i + 1}`, id: i + 1 + this.mixCount });
        }
        for (let i = 0; i < this.mtxCount; i++) {
            tmp.push({ label: `MATRIX ${i + 1}`, id: i + 1 + this.mixCount + this.fxsCount });
        }
	    for ( let j = 0; j < tmp.length; j++ ) {
		    rsp = self.getLevel(tmp[j].id, 99, 0, [0x4F,0], [0,0]);
		    
		    variables.push({
               label: `${tmp[j].label} Output Level`,
               name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
            });
		}
		
		tmp = this.CHOICES_DCA;
		for ( let j = 0; j < tmp.length; j++ ) {
		    rsp = self.getLevel(tmp[j].id, 99, 0, [0x4F,0], [0x20,0]);
		    
		    variables.push({
               label: `${tmp[j].label} Output Level`,
               name:  `level_${rsp['channel'][0]}.${rsp['channel'][1]}`
            });
		}
        
        return variables;
    }
}
