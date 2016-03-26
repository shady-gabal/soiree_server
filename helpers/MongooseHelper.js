var helper = (function () {
    var mongoose = require('../db/mongoose_connect.js');
    var Schema = mongoose.Schema;
    var ObjectId = mongoose.Types.ObjectId;

    return {
        isObjectId: function (obj) {
            return ObjectId.isValid(obj);
        },
        _id : function(obj){
            if (this.isObjectId(obj))
                return obj;
            else return obj._id;
        },
        isEqualPopulated : function(obj1, obj2){
            if(obj1._id && obj2._id || (!obj1._id && !obj2._id)){
                return obj1.isEqual(obj2);
            }
            else if (obj1._id){
                return obj1._id.isEqual(obj2);

            }
            else if (obj2._id){
                return obj2._id.isEqual(obj1);
            }
            else return false;
        }
    }

}());

module.exports = helper;