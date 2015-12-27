/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var Soiree = require('./Soiree.js');


/* Modules */
var shortid = require('shortid');

/* Schema Specific */
var genders = ["male", "female"];
var colleges = ["NYU", "Baruch"];

var providers = ["facebook", "userpw"];
var facebookProvider = providers[0];
var userPwProvider = providers[1];

var passport = require('passport');
var facebookTokenStrategy = require('passport-facebook-token');


//var interestedIn = ["male", "female"];

var userSchema = new Schema({
	firstName : {type: String, required: true}, /* Name */
	lastName : {type: String},
	verified : {type: Boolean, default: false}, /* Verification */
	verificationCode : {type: String},
	pendingVerification : {type: Boolean, default: false},
	provider: {type: String, enum: providers},
	creditCardLast4Digits : {type: String}, /* Credit Card */
	stripeToken : {type: String},
	gender : {type: String, required : true, enum: genders}, /* Gender */
	interestedIn : [{type: String, required : true, enum: genders}],
	college: {type: String, enum: colleges}, /* Colleges */
	email : {type: String}, /* Email */
	birthday : {type: String}, /* Birthday */
	soireeScore : {type: Number, default: 200}, /* Soiree Score */
	facebookUserId : {type: String, index: true}, /* Facebook */
	profilePictureUrl : {type: String}, /* Profile Picture */
	userId: {type: String, unique: true, default: shortid.generate}, /* IDs */
	phoneNumber : {type : String},
	secretKey : {type: String, index:true, unique: true, default: shortid.generate},
	finishedSignUp : {type : Boolean, default: false}, /* Signup */
	_soireesAttending: [{type: ObjectId, ref:"Soiree"}],
	_soireesAttended: [{type: ObjectId, ref:"Soiree"}],
	dateSignedUp: {type : Date, default: new Date()}, /* Dates */
	dateLastSignedIn : {type: Date, default: new Date()},
	dateUpdated : {type: Date, default: new Date()}
	//location: { /* Location */
	//	type: {type: String},
	//	coordinates: []
	//}
},
	{ timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

userSchema.index({location: '2dsphere'});



userSchema.pre('save', function(next){
	//determine age

	//set date updated
	this.dateUpdated = new Date();
	next();
});

/* Methods */

userSchema.methods.jsonObject = function(){
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
		"soireeScore" : this.soireeScore,
		"pendingVerification" : this.pendingVerification,
		"creditCardLast4Digits" : this.creditCardLast4Digits,
		"hasStripeToken" : this.hasStripeToken
	};
	return obj;
};

userSchema.methods.verifyCode = function(code){
	return this.verificationCode == code;
};



userSchema.methods.generateVerificationCode = function(){
	var length = 6;
	var code = '';

	var nums = '0123456789';

	for (var i = 0; i < length; i++){
		var c = nums[parseInt(Math.random() * (nums.length))];
		code += c;
	}

	this.verificationCode = code;
};


/* Statics */

userSchema.statics.colleges = function(){
	return colleges;
};

userSchema.statics.findOrCreate = function(req, successCallback, errorCallback){
	var User = this;

	var facebookUserId = req.body.facebookUserId;

	var criteria = {"facebookUserId" : facebookUserId};

	//TODO: add user/pw options

	this.findOne(criteria).exec(function(err, user){
		if (err){
			errorCallback(err);
		}
		else{
			if (!user){
				User.createUser(req, successCallback, errorCallback);
			}
			else{
				successCallback(user);
			}
		}
	});
};

userSchema.statics.findByFacebookUserId = function(facebookUserId, successCallback, errorCallback){
	//var User = this;

	//var facebookUserId = req.body.facebookUserId;

	//var criteria = {"facebookUserId" : facebookUserId};

	//TODO: add user/pw options
	console.log("Finding user with fb id: " + facebookUserId);

	this.findOne({facebookUserId : facebookUserId}).exec(function(err, user){
		if (err){
			errorCallback(err);
		}
		else{
			successCallback(user);
		}
	});
};

userSchema.statics.createUser = function(req, successCallback, errorCallback){
	console.log("Creating user....");
	//createUser(req, successCallback, errorCallback);
	var facebookUserId = req.body.facebookUserId;
	var firstName = req.body.firstName;
	var lastName = req.body.lastName;
	var email = req.body.email;
	var gender = req.body.gender;
	var interestedIn = req.body.interestedIn;
	var birthday = req.body.birthday;

	var profilePictureUrl;

	var provider = facebookUserId ? "facebook" : "userpw";
	if (provider === "userpw"){

	}
	else if (provider === "facebook"){
		profilePictureUrl = req.body.profilePictureUrl;
	}

	var newUser = new this({
		facebookUserId : facebookUserId,
		firstName : firstName,
		lastName : lastName,
		email : email,
		gender : gender,
		interestedIn : interestedIn,
		birthday : birthday,
		profilePictureUrl : profilePictureUrl,
		verified: false
	});

	newUser.save(function(err, user){
		if (err || !user) {
			errorCallback(err);
		}
		else {
			successCallback(user);
		}
	});
};

//function createUser(req, successCallback, errorCallback){
//
//}

userSchema.statics.verifyUser = function(req, res, next, successCallback, failureCallback){
	var user = req.body.user;

	if (!user){
		console.log("No user passed to verifyUser");
		return failureCallback();
	}


	//console.log("fbid " + user.facebookUserId + " userid " + user.userId + " sk " + user.secretKey);

	if (user.facebookUserId) {

		passport.authenticate('facebook-token', function(err, userFound, info){
			if (err || !userFound) {
				console.log("User not found " + err);
				failureCallback(err);
			}
			else {
				console.log("User found " + userFound.userId);
				successCallback(userFound);
			}
		})(req, res, next);

		//this.findOne({"facebookUserId": user.facebookUserId, "secretKey": user.secretKey}).exec(function (err, userFound) {
		//	if (err || !userFound) {
		//		console.log("User not found " + err);
		//		failureCallback(err);
		//	}
		//	else {
		//		console.log("User found " + userFound.userId);
		//		successCallback(userFound);
		//	}
		//});


	}
	else if (user.userId) {
		this.findOne({"userId": user.userId, "secretKey": user.secretKey}).exec(function (err, userFound) {
			if (err || !userFound) {
				console.log("User not found " + err);
				failureCallback();
			}
			else {
				console.log("User found " + userFound);
				successCallback(userFound);
			}
		});
	}
	else {
		console.log("No fbuserid or userid");
		failureCallback();
	}
};



/* Virtuals */

userSchema.virtual('age').get(function(){
	var birthdate = new Date(this.birthday);
	var age = (Date.now() - birthdate) / (1000 * 60 * 60 * 24 * 365.25);
	return parseInt(age);
});

userSchema.virtual('hasStripeToken').get(function(){
	return this.stripeToken ? true : false;
});


userSchema.virtual('fullName').get(function(){
	if (!this.lastName)
		return this.firstName;
	else if (!this.firstName)
		return this.lastName;

	return this.firstName + " " + this.lastName;
});



module.exports = mongoose.model('User', userSchema);

