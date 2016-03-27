/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

/* Other Models */


/* Packages */
var shortid = require('shortid');
var _ = require("underscore");

/* Helper */
var helpersFolderLocation = "../helpers/";
var Globals = require(helpersFolderLocation + 'Globals.js');
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var ArrayHelper = require(helpersFolderLocation + 'ArrayHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');
var Globals = require(helpersFolderLocation + 'Globals.js');

/* Schema Specific */
var soireeTypes = ["Lunch", "Dinner", "Drinks", "Blind Date", "TEST"];
var numUsersMaxPerSoireeType = { "Lunch" : 4, "Dinner" : 4, "Drinks" : 6, "Blind Date" : 2 };
var AVERAGE_SOIREE_LENGTH = 60;

/* Error Codes */
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


var soireeSchema = new Schema({
		soireeType : {type: String, required: true, enum: soireeTypes},
		numUsersMax: {type : Number, required: true},
		scheduledStartTimeIdentifier : {type: String},
		scheduledEndTimeIdentifier : {type: String},
		soireeId: {type: String, index: true, default: shortid.generate},
		initialCharge: {type: Number, required: [true, "Forgot to include how much soiree will cost"]}, //in cents
		date: {type : Date, required: [true, "A date for the Soiree is required"]},
		_usersAttending : [{type : ObjectId, ref : "User"}],
		_usersUncharged : [{type : ObjectId, ref : "User"}],
		_business: {type: ObjectId, ref:"Business", required :[true, "A business that will host is required to create this Soiree"]},
		expired: {type: Boolean, default: false},
		location: {
			type: {type: String},
			coordinates: []
		},
		photoIndexIdentifier : {type: Number, default: generatePhotoIndexIdentifier},
		started : {type: Boolean, default: false},
		ended : {type: Boolean, default: false},
		open : {type: Boolean, default: false},
		length : {type: Number, default: AVERAGE_SOIREE_LENGTH},
		_unchargedReservations : [{type: ObjectId, ref: "SoireeReservation"}],
		_chargedReservations : [{type: ObjectId, ref: "SoireeReservation"}]


	},
	{ timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

soireeSchema.index({location: '2dsphere'});

soireeSchema.statics.SOIREE = "Soirée";
soireeSchema.statics.SOIREE_LOWERCASE = "soirée";
soireeSchema.statics.AVERAGE_SOIREE_LENGTH = AVERAGE_SOIREE_LENGTH;

function generatePhotoIndexIdentifier(){
	var rand = parseInt(Math.random() * 1000);
	return rand;
};

/* Static Methods */
//soireeSchema.statics.errorCodes = function() {
//	return this.errorCodes;
//}

soireeSchema.statics.createScheduledTimeIdentifier = function(date){
	if (!date){
		date = new Date();
	}
	if (date.constructor != Date){
		date = new Date(date);
	}

	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();

	var hours = date.getHours();
	var mins = date.getMinutes();
	//round mins to nearest 10
	if (date.getSeconds() >= 30)
		mins = mins + 1;
	mins -= (mins % 10);

	return "" + year + "." + month + "." + day + "." + hours + "." + mins;
};

soireeSchema.statics.createScheduledTimeIdentifierPast = function(mins){
	return this.createScheduledTimeIdentifier(Date.now() - (mins * 60 * 1000));
};

soireeSchema.statics.createScheduledTimeIdentifierFuture = function(mins){
	return this.createScheduledTimeIdentifier(Date.now() + (mins * 60 * 1000));
};


//soireeSchema.statics.findSoireesWithScheduledTimeIdentifier = function(scheduledTimeIdentifier, successCallback, errorCallback){
//	Soiree.find({"scheduledTimeIdentifier" : scheduledTimeIdentifier}).populate("_business").exec(function(err, soirees){
//		if (err){
//			errorCallback(err);
//		}
//		else{
//			successCallback(soirees);
//		}
//	});
//};

soireeSchema.statics.createSoiree = function(soiree, successCallback, errorCallback){
	var Soiree = this;

	var Business = mongoose.model("Business");

	Business.nextBusinessToHostSoiree(function(business){
		if (!business){
			return errorCallback(ErrorCodes.NotFound);
		}

		Soiree.createSoireeWithBusiness(soiree, business, successCallback, errorCallback);
	}, function(err){
		errorCallback(err);
	});
};

soireeSchema.statics.createSoireeWithBusiness = function(soiree, business, successCallback, errorCallback) {
	var newSoiree = new this(soiree);

	newSoiree._business = business._id;
	newSoiree.location = business.location;
	newSoiree._usersAttending = [];

	if (!soiree.numUsersMax && numUsersMaxPerSoireeType[soiree.soireeType]){
		soiree.numUsersMax = numUsersMaxPerSoireeType[soiree.soireeType];
	}

	newSoiree.save(function(err, savedSoiree){
		if (err){
			console.log(err);
			errorCallback(ErrorCodes.ErrorSaving);
		}
		else{
			successCallback(savedSoiree);
		}
	});
};

soireeSchema.statics.findSoireesForBusiness = function(business, options, successCallback, errorCallback){
	if (!business)
		return errorCallback(ErrorCodes.MissingData);

	_.defaults(options, {showExpired: false, sameDay: false});

	this.find({"_business" : business._id, expired: options.showExpired}).deepPopulate("_usersAttending").exec(function(err, soirees){
		if (err){
			console.log(err);
			errorCallback(ErrorCodes.ErrorQuerying);
		}
		else{
			successCallback(soirees);
		}
	});
};

soireeSchema.statics.createAppropriateSoiree = function(){
	var date = new Date();
	var hour = date.getHours();

};

soireeSchema.statics.createLunch = function(date, business, successCallback, errorCallback) {
	//var date = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));

	var soiree = new this({
		soireeType: "Lunch",
		date: date,
		_usersAttending: [],
		_business: business._id,
		initialCharge: 300,
		location: business.location
	});

	this.createSoiree(soiree, business, successCallback, errorCallback);
};

soireeSchema.statics.createDinner = function(date, business, successCallback, errorCallback) {
	//var date = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));

	var soiree = new this({
		soireeType: "Dinner",
		date: date,
		_usersAttending: [],
		_business: business._id,
		initialCharge: 300,
		location: business.location
	});

	this.createSoiree(soiree, business, successCallback, errorCallback);
};

soireeSchema.statics.createDrinks = function(date, business, successCallback, errorCallback) {
	//var date = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));

	var soiree = new this({
		soireeType: "Drinks",
		date: date,
		_usersAttending: [],
		_business: business._id,
		initialCharge: 300,
		location: business.location
	});

	this.createSoiree(soiree, business, successCallback, errorCallback);
};


soireeSchema.statics.findSoirees = function(req, user, successCallback, errorCallback){

	var constraints = {};

	if (req.body.user){
		var longitude = req.body.user.longitude;
		var latitude = req.body.user.latitude;
		var coors = LocationHelper.createPoint(longitude, latitude);

		constraints.location = { $near : coors } ;

	}


	var numSoireesToFetch = 10;

	var idsToIgnore = req.body.currentSoireesIds;

	//var constraints = { location: { $near : coors }, "college" : user.college };

	if (idsToIgnore && idsToIgnore.length > 0){
		console.log("Ignoring soirees with ids in: " + idsToIgnore);
		constraints["soireeId"] = {'$nin' : idsToIgnore};
	}

	this.find(constraints).deepPopulate("_business _usersAttending.college").limit(numSoireesToFetch).exec(function(err, soirees){
		if (err){
			errorCallback(err);
		}
		else{
			successCallback(soirees);
		}
	});
};


//soireeSchema.statics.timeAtStringFromDate = function(date){
//	//var day = (24 + i) % 30;
//	//var date = new Date(2015, (10 - 1), day, 18, 30, 0);
//	var todaysDate = new Date();
//	var hour = date.getHours();
//	var minutes = date.getMinutes();
//
//	if (minutes < 10){
//		minutes = "0" + minutes.toString();
//	}
//
//	var amPm = "AM";
//	var when = "Today";
//
//	if (!DateHelper.isSameDay(todaysDate, date)){
//		if (DateHelper.isNextDay(todaysDate, date)){
//			when = "Tomorrow";
//		}
//		else when = DateHelper.dayFromDayNumber(date.getDay());
//	}
//	else if (hour > 18){
//		when = "Tonight";
//	}
//
//	if (hour > 12) {
//		hour -= 12;
//		amPm = "PM";
//	}
//	var timeAtString = when + " at " + hour + ":" + minutes + " " + amPm;
//	return timeAtString;
//};


soireeSchema.statics.soireeTypes = function(){
	return soireeTypes;
};


soireeSchema.statics.findBySoireeId = function(soireeId, successCallback, errorCallback){
	this.findOne({soireeId : soireeId}).populate('_business').exec(function(err, soiree){
		if (err){
			return errorCallback(err);
		}
		else if(!soiree){
			return errorCallback();
		}
		else{
			successCallback(soiree);
		}
	});
};

soireeSchema.statics.joinSoireeWithId = function(soireeId, user, successCallback, errorCallback){
	this.findBySoireeId(soireeId, function(soiree){
		soiree.join(user, successCallback, errorCallback);
	}, function(err){
		errorCallback(ErrorCodes.SoireeError);
	});
};

/* Methods */

soireeSchema.methods.remind = function(mins) {
	console.log("Reminding users of soiree " + this.soireeType + " " + this.scheduledStartTimeIdentifier + " with users attending: " + this._usersAttending + " ...");

	for (var i = 0; i < this._usersAttending.length; i++){
		var user = this._usersAttending[i];
		console.log("Sending push notification to " + user.firstName);

		var message = "Hey boo. Don't forget that your " + this.soireeType + " " + this.SOIREE + " will start in " + mins + " minutes. See you there. xoxo";
		PushNotificationHelper.sendPushNotification(user, message);
	}
};

soireeSchema.methods.start = function(){
	this.deepPopulate("_usersAttending", function(err, _soiree){
		console.log("Starting soiree " + this.soireeType + " " + this.scheduledStartTimeIdentifier + " with users attending: " + this._usersAttending + " ...");

		alertUsersThatSoireeStarted(this);

		this.started = true;
		this.inProgress = true;

		this.save(function(err){
			if (err){
				console.log("Error saving soiree - start()");
				console.log(err);
			}
		});

	});

};

function alertUsersThatSoireeStarted(soiree){
	for (var i = 0; i < soiree._usersAttending.length; i++){
		var user = soiree._usersAttending[i];
		console.log("Sending push notification to " + user.firstName);

		var message = "Your " + soiree.soireeType + " " + soiree.SOIREE_LOWERCASE + " is about to start! Open up " + soiree.SOIREE + " to get started.";
		PushNotificationHelper.sendPushNotification(user, message);
	}
};


soireeSchema.methods.end = function() {
	console.log("Ending soiree " + this.soireeType + " " + this.scheduledTimeIdentifier + " with users attending: " + this._usersAttending + " ...");

	this.deepPopulate("_usersAttending", function(err){
		if (err){
			console.log("Error ending soiree: " + err);
		}
		else{
			console.log(this);
			for (var i = 0; i < this._usersAttending.length; i++) {
				var user = this._usersAttending[i];
				user.endedSoiree(this);
			}
		}
		this.ended = true;
		this.inProgress = false;
		this.save(Globals.saveErrorCallback);
	});
};

soireeSchema.methods.openToUsers = function() {
	this.open = true;
	this.save(function(err){
		if (err){
			console.log("Error opening soiree: " + err);
		}
	});
};

soireeSchema.methods.cancelSoireeIfNecessary = function(){
	if (!this.reachedNumUsersMin){
		//cancel soiree
	}
};

soireeSchema.methods.hasUserAlreadyJoined = function(user){
	if (user){
		if (this.populated("_usersAttending")){
			for (var i = 0; i < this._usersAttending.length; i++){
				var curr = this._usersAttending[i];

				if (curr._id.equals(user._id)){
					return true;
				}
			}
		}

		else{
			return this._usersAttending.indexOf(user._id) != -1;
		}
	}

	return false;
};

soireeSchema.methods.chargedForReservation = function(reservation){
	var soiree = this;

	console.log("in chargedForReservation()");

	reservation.deepPopulate("_business _user", function(err, _reservation){
		//reservation has now been charged. Remove from unchargedReservations
		ArrayHelper.removeObjectPopulated(soiree, "_unchargedReservations", _reservation);

		//remove user from list of users that we havent charged yet
		ArrayHelper.removeObjectPopulated(soiree, "_usersUncharged", _reservation._user);

		//add reservation to soirees chargedReservations
		ArrayHelper.pushOnlyOncePopulated(soiree, "_chargedReservations", _reservation);

		//add user to soirees usersAttending
		ArrayHelper.pushOnlyOncePopulated(soiree, "_usersAttending", _reservation._user);

		//add reservation to business's unconfirmedReservations
		ArrayHelper.pushOnlyOncePopulated(_reservation._business, "_unconfirmedReservations", _reservation);

		soiree.save(Globals.saveErrorCallback);
		_reservation._business.save(Globals.saveErrorCallback);
	});


};

soireeSchema.methods.join = function(user, successCallback, errorCallback){
	var soiree = this;

	if (!this.full){
		//var stripeToken = req.body.stripeToken;
		//if (!stripeToken){
		//	return ResHelper.sendError(res, errorCodes.MissingStripeToken);
		//}
		if (!user.stripeCustomerId && !(user.testUser && Globals.development)){
			return errorCallback(ErrorCodes.MissingStripeCustomerId);
		}
		if (this._usersAttending.indexOf(user._id) != -1 || this._usersUncharged.indexOf(user._id) != -1){
			//user has already joined soiree
			return errorCallback(ErrorCodes.UserAlreadyJoinedSoiree);
		}

		else{
			//user can join
			//see if you should charge him now
			var SoireeReservation = mongoose.model("SoireeReservation");
			if (this.willReachNumUsersMin || this.reachedNumUsersMin){
				if (this._unchargedReservations.length > 0 || this._usersUncharged.length > 0){
					this.chargeUnchargedUsers();
				}
				SoireeReservation.createChargedSoireeReservation(user, soiree, successCallback, errorCallback);
			}
			else{
				SoireeReservation.createUnchargedSoireeReservation(user, soiree, successCallback, errorCallback);
			}
		}

	}
	else{
		return errorCallback(ErrorCodes.SoireeFull);
	}
};

soireeSchema.methods.chargeUnchargedUsers = function(){

	console.log("In chargeUnchargedUses() : Charging " + this._unchargedReservations.length + " users...");
	console.log(this._unchargedReservations);

	var soiree = this;
	this.deepPopulate("_unchargedReservations._user", function(err, _soiree){
		if (err){
			return console.log("ERROR POPULATING: " + err);
		}
		var shadowCopy = _soiree._unchargedReservations;
		for (var i = 0; i < shadowCopy.length; i++){
			var reservation = shadowCopy[i];
			reservation.chargeUser(function(user){
				console.log("Successfully charged " + user.fullName);
				soiree.chargedForReservation(reservation);
				//console.log(_soiree);
			}, function(err){
				console.log("Error charging user " + reservation._user.fullName + " : " + err);
			});
		}
		console.log(_soiree._unchargedReservations);
	});

};

soireeSchema.methods.jsonObject = function (user) {
	var timeIntervalSince1970InSeconds = this.date.getTime() / 1000;

	var usersColleges = [];
	//console.log("_usersAttending: " + this._usersAttending);

	for (var i = 0; i < this._usersAttending.length; i++){
		var college = this._usersAttending[i].college;
		if (college){
			usersColleges.push(college);
		}
	}

	var obj = {
		"soireeType": this.soireeType,
		"numUsersAttending": this.numUsersAttending,
		"numUsersMax": this.numUsersMax,
		"date": timeIntervalSince1970InSeconds,
		"soireeId": this.soireeId,
		"started" : this.started,
		"ended" : this.ended,
		"inProgress" : this.inProgress,
		"businessName": this._business.businessName,
		"cityArea" : this._business.cityArea,
		"coordinates" : this.location.coordinates,
		"initialCharge": this.initialCharge,
		"photoIndexIdentifier" : this.photoIndexIdentifier,
		"reachedNumUsersMin" : this.reachedNumUsersMin,
		"willReachNumUsersMin" : this.willReachNumUsersMin,
		"numUsersMin" : this.numUsersMin
	};

	if (user){
		obj.userAlreadyJoined = this.hasUserAlreadyJoined(user);
	}

	return obj;
};


/* Virtuals */

soireeSchema.virtual('full').get(function () {
	return this.numUsersAttending >= this.numUsersMax;
});

soireeSchema.virtual('SOIREE').get(function () {
	return "Soirée";
});

soireeSchema.virtual('reachedNumUsersMin').get(function () {
	//var min = this.numUsersMax/2 + (this.numUsersMax % 2);
	return this.totalNumUsers >= this.numUsersMin;
});

soireeSchema.virtual('numUsersMin').get(function () {
	if (this.numUsersMax <= 2){
		return this.numUsersMax;
	}
	return parseInt(this.numUsersMax/2) + this.numUsersMax%2; //rounds down, then round up by adding 1 if necessary
});

soireeSchema.virtual('willReachNumUsersMin').get(function () {
	return this.totalNumUsers === this.numUsersMin-1;
});

soireeSchema.virtual('numUsersAttending').get(function () {
	return this._usersAttending.length;
});

soireeSchema.virtual('totalNumUsers').get(function () {
	return this._usersAttending.length + this._usersUncharged.length;
});

soireeSchema.virtual('inProgress').get(function () {
	return this.started && !this.ended;
});


soireeSchema.pre("save", function(next){
	if (!this.scheduledStartTimeIdentifier) {
		this.scheduledStartTimeIdentifier = this.constructor.createScheduledTimeIdentifier(this.date);
	}
	if (!this.scheduledEndTimeIdentifier){
		this.scheduledEndTimeIdentifier = this.constructor.createScheduledTimeIdentifierFuture(this.length);
	}
	console.log("this.length: " + this.length);

	next();
});

soireeSchema.post("init", function(soiree){

});

//var autoPopulate = function(next){
//	this.populate("_business");
//	this.populate("_user");
//	next();
//};
//
//soireeSchema.pre("findOne", autoPopulate);
//soireeSchema.pre("find", autoPopulate);

//soireeSchema.pre('save', function(next){
//	//if (!this.timeAtString) {
//	this.timeAtString = soireeSchema.statics.timeAtStringFromDate(this.date);
//	//}
//	next();
//});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
soireeSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('Soiree', soireeSchema);

