const callback = require('./callback.json');

module.exports = {

    getVariables() {
        
        var variables = [];
        
        for (let key in callback['mute']){
            variables.push(
               {
                       label: 'Mute ' + callback['mute'][key][0] + ' ' + (callback['mute'][key][1] + 1),
                       name:  callback['mute'][key][0] + '_' + key.toString()
               }
            );
                           
        }
        
        return variables;
    }
}
