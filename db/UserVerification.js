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

/* Packages */
var shortid = require('shortid');


var userVerificationSchema = new Schema({
    image : {data: Buffer, contentType: String},
    _user : {type: ObjectId, ref: "User"},
    verified : {type : Boolean, default : false},
    rejected : {type: Boolean, default: false},
    dateCreated : {type: Date, default: Date.now()},
    dateVerified : {type: Date},
    verifiedBy: {type: String}
});


module.exports = mongoose.model('UserVerification', userVerificationSchema);
