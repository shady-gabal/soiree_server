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
    college : {type: String, enum: User.colleges()},
    verified : {type : Boolean, default : false},
    rejected : {type: Boolean, default: false},
    dateVerified : {type: Date},
    verifiedBy: {type: String}
},
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);


module.exports = mongoose.model('UserVerification', userVerificationSchema);
