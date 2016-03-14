var env = require('get-env')({
    development : ['dev', 'development'],
    production : ['prod', 'production']
});

var helper = (function () {
    return {
        func: function () {

        },
        development : env === 'development',
        production : env === 'production',
        saveErrorCallback : function(err){
            if (err){
                console.log(err);
            }
        }
}

}());

module.exports = helper;