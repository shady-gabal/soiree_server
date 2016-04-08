/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

/* Other Models */
var Business = require('./Business.js');
var Soiree = require('./Soirees/Soiree.js');
var SoireeReservation = require('./Soirees/SoireeReservation.js');
var Admin = require('./Admin.js');
var Notification = require('./Notification.js');

/* Modules */
var shortid = require('shortid');

/* Schema Specific */
var genders = ["male", "female"];
var colleges = ["NYU", "Baruch"];

var providers = ["facebook", "userpw"];
var facebookProvider = providers[0];
var userPwProvider = providers[1];

var passport = require('passport');
var bcrypt = require('bcrypt');

var facebookTokenStrategy = require('passport-facebook-token');

/* Helper */
var helpersFolderLocation = "../helpers/";
var Globals = require(helpersFolderLocation + 'Globals.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var ArrayHelper = require(helpersFolderLocation + 'ArrayHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var IdGeneratorHelper = require(helpersFolderLocation + 'IdGeneratorHelper.js');

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

//var interestedIn = ["male", "female"];

var userSchema = new Schema({
		firstName : {type: String, required: true}, /* Name */
		lastName : {type: String},
		verified : {type: Boolean, default: false}, /* Verification */
		verificationCode : {type: String},
		pendingVerification : {type: Boolean, default: false},
		provider: {type: String, enum: providers},
		//creditCardLast4Digits : {type: String}, /* Credit Card */
		stripeCustomerId : {type: String},
		gender : {type: String, required : true, enum: genders}, /* Gender */
		interestedIn : [{type: String, enum: genders}],
		college: {type: String, enum: colleges}, /* Colleges */
		email : {type: String}, /* Email */
		password : {type: String},
		birthday : {type: String}, /* Birthday */
		soireeScore : {type: Number, default: 200}, /* Soiree Score */
		facebookUserId : {type: String, index: true}, /* Facebook */
		profilePictureUrl : {type: String}, /* Profile Picture */
		userId: {type: String, index: true, default: shortid.generate}, /* IDs */
		phoneNumber : {type : String},
		//secretKey : {type: String, index: true, unique: true, default: shortid.generate},
		finishedSignUp : {type : Boolean, default: false}, /* Signup */
		//_soireesAttending: [{type: ObjectId, ref:"Soiree"}],
		//_soireesAttended: [{type: ObjectId, ref:"Soiree"}],
		dateSignedUp: {type : Date, default: new Date()}, /* Dates */
		dateLastSignedIn : {type: Date, default: new Date()},
		associatedDeviceUUIDs : [{type: String}],
		pushNotificationsEnabled : {type: Boolean, default: false},
		deviceToken : {type: String},
		dateUpdated : {type: Date, default: new Date()},
		_approvedBy: {type: ObjectId, ref: "Admin"},
		_notifications : [{type: String, ref: "Notification"}],
		classType : {type: String, default: 'user', enum: ['user']},
		_currentReservations : [{type: ObjectId, ref: "SoireeReservation"}],
		_pastReservations : [{type: ObjectId, ref: "SoireeReservation"}],
		testUser : {type: Boolean, default: false},

		location: { /* Location */
			type: {type: String},
			coordinates: []
		}
},
	{ timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

userSchema.index({location: '2dsphere'});



userSchema.pre('save', function(next){
	//determine age

	//set date updated
	this.dateUpdated = new Date();

	if (!this.associatedDeviceUUIDs){
		this.associatedDeviceUUIDs = [];
	}

	next();
});

/* Methods */

userSchema.methods.jsonObject = function(){
	console.log("in user jsonObj()");

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
		//"secretKey" : this.secretKey,
		"soireeScore" : this.soireeScore,
		"pendingVerification" : this.pendingVerification,
		//"creditCardLast4Digits" : this.creditCardLast4Digits,
		"hasStripeCustomerId" : this.hasStripeCustomerId,
		"deviceToken" : this.deviceToken
	};

	if (this.populated("_notifications")){
		var notifications = Notification.jsonArrayFromArray(this._notifications);
		obj.notifications = notifications;
		console.log(notifications);
	}
	if (this.populated("_currentReservations")){
		var reservations = [];
		for (var i = 0 ; i < this._currentReservations.length; i++){
			reservations.push(this._currentReservations[i].jsonObject());
		}
		obj["pendingReservations"] = reservations;
	}

	return obj;
};

userSchema.methods.verifyCode = function(code){
	return this.verificationCode == code && !user.verified;
};

userSchema.methods.findSoireesAttendingAndAttended = function(successCallback, errorCallback){
	this.deepPopulate("_currentReservations._soiree _pastReservations._soiree", function(err, _user){
		if (err){
			console.log(err);
			errorCallback(ErrorCodes.ErrorPopulating);
		}
		else{
			var soireesAttending = [], soireesAttended = [];

			for (var i = 0; i < _user._currentReservations.length; i++){
				var soiree = _user._currentReservations[i]._soiree;
				soireesAttending.push(soiree);
			}

			for (var j = 0; j < _user._pastReservations.length; j++){
				var soiree = _user._pastReservations[j]._soiree;
				soireesAttended.push(soiree);
			}

			successCallback(soireesAttending, soireesAttended);
		}
	});
};

userSchema.methods.checkDeviceUUIDAndDeviceToken = function(req, callback){
	var deviceUUID = req.body.deviceUUID;
	var deviceToken = req.body.deviceToken;
	var pushNotificationsEnabled = req.body.pushNotificationsEnabled;

	if (!deviceUUID && !deviceToken) {
		callback();
	}

	var user = this;
	var save = false;

	if (pushNotificationsEnabled){
		if (user.pushNotificationsEnabled != pushNotificationsEnabled){
			user.pushNotificationsEnabled = pushNotificationsEnabled;
			save = true;
		}
	}

	if (deviceToken && deviceToken != user.deviceToken){ //if have new device token
		user.deviceToken = deviceToken;
		save = true;
	}

	if (deviceUUID){//if have device uuid
		save = true;

		if (!user.associatedDeviceUUIDs){
			user.associatedDeviceUUIDs = [];
		}
		else {
			var index = user.associatedDeviceUUIDs.indexOf(deviceUUID); //does device uuid currently exist


			if (index == -1) { //if not
				user.associatedDeviceUUIDs.push(deviceUUID); // login from new device. create device uuid and set stripe customer id to null to prevent fraud
				console.log("setting stripecustomerid to null...");
				user.stripeCustomerId = null;
			}
			else {
				if (user.associatedDeviceUUIDs.length > 1 &&  index != user.associatedDeviceUUIDs.length - 1) { //if device uuid was not last device uuid
					ArrayHelper.move(user.associatedDeviceUUIDs, index, user.associatedDeviceUUIDs.length - 1); //set it to the last device uuid
				}
				else save = false; //else if it was the last then no need to save
			}
		}
	}

	if (save) {
		user.save(function (err, u) {
			//console.log("saved deviceuuid with err:" + err + "new deviceuuids: " + u.associatedDeviceUUIDs);
			if (err)
				console.log("Error saving in checkDeviceUUIDAndDeviceToken: " + err);
			callback();
		});
	}

	else{
		callback();
	}
};


userSchema.methods.generateVerificationCode = function(){
	console.log("about to generate code...");
	this.verificationCode = IdGeneratorHelper.generateId(6, false);
	this.save();
};

userSchema.methods.endedSoiree = function(soiree){
	this.deepPopulate("_currentReservations._soiree", function(err){
		if (err) return console.log(err);
		for (var i = 0; i < this._currentReservations.length; i++){
			var reservation = this._currentReservations[i];
			if (reservation._soiree._id.equals(soiree._id)){
				this._currentReservations.splice(i, 1);
				ArrayHelper.pushOnlyOnce(this._pastReservations, reservation._id);
				this.save(Globals.saveErrorCallback);
			};
		}
	});

	//var index = this._soireesAttending.indexOf(this._id);
	//if (index != -1){
	//	user._soireesAttending.splice(index, 1);
	//}
	//if (user._soireesAttended.indexOf(this._id) == -1) {
	//	user._soireesAttended.push(this._id);
	//}
	//user.save(function(err){
	//	if (err){
	//		console.log("Error saving user - end()");
	//	}
	//});
};
//userSchema.methods.chargeForSoiree = function(soiree, successCallback, errorCallback){
//	if (!this.stripeToken)
//		return errorCallback();
//
//	var amount = soiree.initialCharge;
//	if (amount == 0){
//		return successCallback();
//	}
//	else{
//		CreditCardHelper.chargeUser(user, amount, function(charge){
//			successCallback(charge);
//		}, function(err){
//			errorCallback(err);
//		});
//	}
//};


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

	var deviceUUID = req.deviceUUID;

	var profilePictureUrl;

	var provider = facebookUserId ? "facebook" : "userpw";
	if (provider === "userpw"){

	}
	else if (provider === "facebook"){
		profilePictureUrl = req.body.profilePictureUrl;
	}

	var latitude = req.body.latitude ? req.body.latitude : 1;
	var longitude = req.body.longitude ? req.body.longitude : 1;
	var coors = LocationHelper.createPoint(longitude, latitude);

	var newUser = new this({
		facebookUserId : facebookUserId,
		firstName : firstName,
		lastName : lastName,
		email : email,
		gender : gender,
		interestedIn : interestedIn,
		birthday : birthday,
		profilePictureUrl : profilePictureUrl,
		associatedDeviceUUIDs : [deviceUUID],
		location : coors,
		verified: false
	});

	newUser.save(function(err, user){
		if (err || !user) {
			console.log("Error creating user: " + err);
			errorCallback(ErrorCodes.ErrorSaving);
		}
		else {
			successCallback(user);
		}
	});
};

userSchema.statics.findTestUsers = function(successCallback, errorCallback){
	//if (process.env.LOCAL){
		this.find({testUser : true}).deepPopulate("_currentReservations _pastReservations _notifications").exec(function(err, users){
			if (err)
				errorCallback(err);
			else successCallback(users);
		});
		//return;
	//}
};

userSchema.statics.findTestUser = function(successCallback, errorCallback){
	//if (process.env.LOCAL){
	this.find({testUser : true}).limit(1).exec(function(err, users){
		if (err || users.length == 0)
			errorCallback(err);
		else successCallback(users[0]);
	});
	//return;
	//}
};

//function createUser(req, successCallback, errorCallback){
//
//}

userSchema.statics.verifyUser = function(req, res, next, successCallback, failureCallback){
	if (process.env.LOCAL){
		this.findTestUser(successCallback, failureCallback);
		return;
	}

	var user = req.body.user;

	if (!failureCallback){
		failureCallback = function(){
			ResHelper.sendError(res, ErrorCodes.UserVerificationError);
		};
	}

	if (!user){
		console.log("No user passed to verifyUser");
		return failureCallback();
	}


	//console.log("fbid " + user.facebookUserId + " userid " + user.userId + " sk " + user.secretKey);

	if (user.access_token) {
		req.body.access_token = user.access_token;

		//console.log("access token found in verifyuser: " + req.body.access_token);

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


	}
	else if (user.userId) {
		console.log("no fb access token specified in verifyUser");
		this.findOne({"userId": user.userId}).exec(function (err, userFound) {
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

userSchema.virtual('hasStripeCustomerId').get(function(){
	console.log("stripeCustomerId : "+ this.stripeCustomerId);
	return this.stripeCustomerId ? true : false;
});

userSchema.virtual('currentDeviceUUID').get(function() {
	if (this.associatedDeviceUUIDs.length <= 0)
		return "";
	return this.associatedDeviceUUIDs[this.associatedDeviceUUIDs.length-1];
});

userSchema.virtual('fullName').get(function(){
	if (!this.lastName)
		return this.firstName;
	else if (!this.firstName)
		return this.lastName;

	return this.firstName + " " + this.lastName;
});

userSchema.pre("save", function(next) {
	//var production = (process.env.NODE_ENV === "production");

	if (this.testUser && !Globals.development){
		return next("Error");
	}
	if (!this.verified && !this.verificationCode) {
		this.generateVerificationCode();
	}

	else next();
});


var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
userSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('User', userSchema);

