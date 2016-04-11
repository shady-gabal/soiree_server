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
        equalsPopulated : function(obj1, obj2){
            try {
                if (obj1._id && obj2._id) {
                    return obj1._id.equals(obj2._id);
                }
                else if (obj1._id) {
                    return obj1._id.equals(obj2);

                }
                else if (obj2._id) {
                    return obj2._id.equals(obj1);
                }
                else {
                    return obj1.equals(obj2);
                }
            }
            catch(err){
                console.log("Error in isEqualPopulated: " + err);
                return false;
            }
        }
    }

}());

module.exports = helper;