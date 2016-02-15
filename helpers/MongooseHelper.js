var helper = (function () {
    var mongoose = require('../db/mongoose_connect.js');
    var Schema = mongoose.Schema;
    var ObjectId = mongoose.Types.ObjectId;

    return {
        isObjectId: function (obj) {
            return ObjectId.isValid(obj);
        }
    }

}());

module.exports = helper;