/**
 * Created by shadygabal on 11/26/15.
 */
/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var Soiree = require('./Soirees/Soiree.js');
var User = require('./User.js');
var Admin = require('./Admin.js');
var Image = require('./Image.js');

/* Packages */
var shortid = require('shortid');


var userVerificationSchema = new Schema({
        idImage : {type: ObjectId, ref: "Image"},
        selfImage : {type: ObjectId, ref:"Image"},
        idImagePath : {type: String},
        selfImagePath : {type: String},
        userVerificationId: {type: String, index: true, default: shortid.generate},
        _user : {type: ObjectId, ref: "User"},
        notes : {type: String},
        college : {type: String, enum: User.colleges()},
        verified : {type : Boolean, default : false},
        rejected : {type: Boolean, default: false},
        dateVerified : {type: Date},
        _approvedBy: {type: ObjectId, ref: "Admin"}

},
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);


userVerificationSchema.statics.findUnverifiedVerifications = function(admin, idsToIgnore, successCallback, errorCallback){
    if (admin){
        var UserVerification = this;

        var constraints = {verified: false, rejected: false};

        if (idsToIgnore && idsToIgnore.length > 0){
            constraints["userVerificationId"] = {'$nin' : idsToIgnore};
        }

        this.find(constraints).deepPopulate("_user").limit(5).exec(function(err, verifications){
            if (err){
                console.log("Error finding unverifiedVerifications - findUnverifiedVerifications(): " + err);
                errorCallback(err);        }
            else{
                console.log("Found verifications: " + verifications);
                successCallback(verifications);
            }

        });
    }
    else{
        errorCallback();
    }

};

userVerificationSchema.post('remove', function(doc) {
    Image.remove({_userVerification : doc._id}).exec(function(err){
       if (err){
           console.log("Error removing ghost images in Image.post('remove'): " + err + "\n POSSIBLE DATA LEAK");
       }
    });

});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
userVerificationSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('UserVerification', userVerificationSchema);
