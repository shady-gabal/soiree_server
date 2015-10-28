/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var Soiree = require('./Soiree.js');


/* Packages */
var shortid = require('shortid');

/* Schema Specific */

var userSchema = new Schema({
	firstName : {type: String, required: true},
	lastName : {type: String},
	facebookId : {type: String, index: true},
	userId: {type: String, unique: true, default: shortid.generate},
	phoneNumber : {type : String},
	numEventsAttended : {type: Number, default: 0},
	finishedSignUp : {type : Boolean, default: false},
	dateSignedUp: {type : Date, default: Date.now()},
	dateLastSignedIn : {type: Date, default: Date.now()},
	_soireesAttended: [{type: ObjectId, ref:"Soiree"}],
	dateUpdated : {type: Date, default: Date.now()}
});

userSchema.pre('save', function(next){
	this.dateUpdated = new Date();
	next();
});

module.exports = mongoose.model('User', userSchema);

