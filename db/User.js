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
var genders = ["male", "female"];
//var interestedIn = ["male", "female"];

var userSchema = new Schema({
	firstName : {type: String, required: true},
	lastName : {type: String},
	verified : {type: Boolean, default: false},
	pendingVerification : {type: Boolean, default: false},
	gender : {type: String, required : true, enum: genders},
	email : {type: String},
	birthday : {type: String},
	interestedIn : [{type: String, required : true, enum: genders}],
	facebookUserId : {type: String, index: true},
	profilePictureUrl : {type: String},
	userId: {type: String, unique: true, default: shortid.generate},
	phoneNumber : {type : String},
	secretKey : {type: String, unique: true, default: shortid.generate},
	finishedSignUp : {type : Boolean, default: false},
	dateSignedUp: {type : Date, default: Date.now()},
	dateLastSignedIn : {type: Date, default: Date.now()},
	_soireesAttending: [{type: ObjectId, ref:"Soiree"}],
	_soireesAttended: [{type: ObjectId, ref:"Soiree"}],
	dateUpdated : {type: Date, default: Date.now()}
});

userSchema.pre('save', function(next){
	//determine age

	//set date updated
	this.dateUpdated = new Date();
	next();
});

userSchema.methods.createDataObjectToSend = function(){
	var obj = {
		"firstName" : this.firstName,
		"lastName" : this.lastName,
		"gender" : this.gender,
		"email" : this.email,
		"age" : this.age,
		"birthday" : this.birthday,
		"userId" : this.userId,
		"finishedSignUp" : this.finishedSignUp,
		"interestedIn" : this.interestedIn,
		"profilePictureUrl" : this.profilePictureUrl,
		"facebookUserId" : this.facebookUserId,
		"verified" : this.verified,
		"secretKey" : this.secretKey,
		"pendingVerification" : this.pendingVerification
	};
	return obj;
};

userSchema.virtual('age').get(function(){
	var birthdate = new Date(this.birthday);
	var age = (Date.now() - birthdate) / (1000 * 60 * 60 * 24 * 365.25);
	return parseInt(age);
});

userSchema.statics.verifyUser = function(user, successCallback, failureCallback){
	console.log("Verifying " + user + "...");

	if (!user)
		return failureCallback();

	if (user.facebookUserId) {
		User.findOne({"facebookUserId": user.facebookUserId, "secretKey": user.secretKey}).exec(function (err, user) {
			if (err || !user) {
				failureCallback(err);
			}
			else {
				successCallback(user);
			}
		});

	}
	else if (user.userId) {
		User.findOne({"user": user.userId, "secretKey": user.secretKey}).exec(function (err, user) {
			if (err || !user) {
				failureCallback();
			}
			else {
				successCallback(user);
			}
		});
	}
	else {
		failureCallback();
	}
};

module.exports = mongoose.model('User', userSchema);

