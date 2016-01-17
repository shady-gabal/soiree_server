/**
 * Created by shadygabal on 11/26/15.
 */
/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var Soiree = require('./Soiree.js');
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


userVerificationSchema.statics.findUnverifiedVerifications = function(admin, successcallback, errorCallback){
    var UserVerification = this;

    this.find({verified: false, rejected: false}).deepPopulate("_user").exec(function(err, verifications){
       if (err){
           console.log("Error finding unverifiedVerifications - findUnverifiedVerifications(): " + err);
           errorCallback(err);
       }
        else{
           console.log("Found verifications: " + verifications);
           successcallback(verifications);
       }
    });
};

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
userVerificationSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('UserVerification', userVerificationSchema);
