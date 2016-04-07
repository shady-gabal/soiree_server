var env = require('get-env')({
    development : ['dev', 'development'],
    production : ['prod', 'production']
});

var ResHelper = require('./ResHelper.js');


var Globals = {
    io : {},
    development: env === 'development',
    production : env === 'production',
    saveErrorCallback : function(err){
        if (err){
            console.log(err);
        }
    },
    fetchErrorCallback : function(res){
        return function(err){
            ResHelper.sendError(res, error);
        };
    },
    RETRIES_ON_DUPLICATE_CONFIRMATION_CODE: 5,

};
//var helper = (function () {
//    var ResHelper = require('./ResHelper.js');
//
//    return {
//        func: function () {
//
//        },
//        development : env === 'development',
//        production : env === 'production',
//        saveErrorCallback : function(err){
//            if (err){
//                console.log(err);
//            }
//        },
//        fetchErrorCallback : function(res){
//            return function(err){
//                ResHelper.sendError(res, error);
//            };
//
//        }
//}
//
//}());

module.exports = Globals;