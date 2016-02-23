/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */


//console.log("in soiree:");
//console.log(Business);
//console.log(SoireeReservation);
//console.log("USER:");
//console.log(User);

/* Packages */
var shortid = require('shortid');
var _ = require("underscore");

/* Helper */
var helpersFolderLocation = "../helpers/";
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');

/* Schema Specific */
var soireeTypes = ["Lunch", "Dinner", "Drinks", "Blind Date", "TEST"];

/* Error Codes */
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


var soireeSchema = new Schema({
		soireeType : {type: String, required: true, enum: soireeTypes},
		numUsersMax: {type : Number, required: true},
		scheduledTimeIdentifier : {type: String},
		soireeId: {type: String, index: true, default: shortid.generate},
		initialCharge: {type: Number, required: [true, "Forgot to include how much soiree will cost"]}, //in cents
		date: {type : Date, required: [true, "A date for the Soiree is required"]},
		//full: {type: Boolean, default: false},
		_usersAttending : [{type : ObjectId, ref : "User"}],
		_business: {type: ObjectId, ref:"Business", required :[true, "A business that will host is required to create this Soiree"]},
		expired: {type: Boolean, default: false},
		location: {
			type: {type: String},
			coordinates: []
		},
		photoIndexIdentifier : {type: Number, default: generatePhotoIndexIdentifier},
		started : {type: Boolean, default: false},
		ended : {type: Boolean, default: false},
		inProgress : {type: Boolean, default: false},
		_reservations : [{type: ObjectId, ref: "SoireeReservation"}]


	},
	{ timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

soireeSchema.index({location: '2dsphere'});

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

soireeSchema.statics.SOIREE = "Soirée";
soireeSchema.statics.SOIREE_LOWERCASE = "soirée";

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
		numUsersMax: 3,
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
		numUsersMax: 4,
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
		numUsersMax: 4,
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



//function(){
//	res.type('text/plain');
//	res.status('200').send("Done");
//}, function(err){
//	res.type('text/plain');
//	ResHelper.sendMessage(res, 404, "error finding soiree");
//});

/* Methods */

soireeSchema.methods.remind = function() {
	console.log("Reminding users of soiree " + this.soireeType + " " + this.scheduledTimeIdentifier + " with users attending: " + this._usersAttending + " ...");

	for (var i = 0; i < this._usersAttending.length; i++){
		var user = this._usersAttending[i];
		console.log("Sending push notification to " + user.firstName);

		var message = "Hey boo. Don't forget that your " + this.soireeType + " " + this.SOIREE + " will start in 30 minutes. See you there. xoxo";
		PushNotificationHelper.sendPushNotification(user, message);
	}
};

soireeSchema.methods.start = function(){
	console.log("Starting soiree " + this.soireeType + " " + this.scheduledTimeIdentifier + " with users attending: " + this._usersAttending + " ...");

	for (var i = 0; i < this._usersAttending.length; i++){
		var user = this._usersAttending[i];
		console.log("Sending push notification to " + user.firstName);

		var message = "Your " + this.soireeType + " " + this.SOIREE_LOWERCASE + " is about to start! Open up " + this.SOIREE + " to get started.";
		PushNotificationHelper.sendPushNotification(user, message);
	}

	this.started = true;
	this.inProgress = true;
	this.save(function(err){
		if (err){
			console.log("Error saving soiree - start()");
			console.log(err);
		}
	});
};


soireeSchema.methods.end = function() {
	console.log("Ending soiree " + this.soireeType + " " + this.scheduledTimeIdentifier + " with users attending: " + this._usersAttending + " ...");

	this.ended = true;
	this.inProgress = false;

	//for (var i = 0; i < this._usersAttending.length; i++) {
	//	var user = this._usersAttending[i];
	//	var index = user._soireesAttending.indexOf(this._id);
	//	if (index != -1){
	//		user._soireesAttending.splice(index, 1);
	//	}
	//	if (user._soireesAttended.indexOf(this._id) == -1) {
	//		user._soireesAttended.push(this._id);
	//	}
	//	user.save(function(err){
	//		if (err){
	//			console.log("Error saving user - end()");
	//		}
	//	});
    //
	//}

	this.save(function(err){
		if (err){
			console.log("Error saving soiree - end()");
		}
	});
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


soireeSchema.methods.join = function(user, successCallback, errorCallback){
	//if (this.numUsersAttending >= this.numUsersMax) {
	//	this.full = true;
	//}

	var soiree = this;

	if (!this.full){
		//var stripeToken = req.body.stripeToken;
		//if (!stripeToken){
		//	return ResHelper.sendError(res, errorCodes.MissingStripeToken);
		//}
		if (!user.stripeCustomerId){
			if (!process.env.LOCAL)
				return errorCallback(ErrorCodes.MissingStripeCustomerId);
		}

		if (this._usersAttending.indexOf(user._id) != -1){
			//user has already joined soiree
			return errorCallback(ErrorCodes.UserAlreadyJoinedSoiree);
		}

		CreditCardHelper.chargeForSoiree(soiree, user, function(charge){
			var SoireeReservation = mongoose.model("SoireeReservation");
			SoireeReservation.createSoireeReservation(user, soiree, charge, successCallback, errorCallback);

		}, function(err){
			errorCallback(ErrorCodes.StripeError);
		});

	}
	else{
		return errorCallback(ErrorCodes.SoireeFull);
	}
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
	};

	if (user){
		obj.userAlreadyJoined = this.hasUserAlreadyJoined(user);
	}

	return obj;
};

//soireeSchema.methods.createDataObjectToSend = function(){
//	var timeIntervalSince1970InSeconds = this.date.getTime() / 1000;
//
//	var obj = {
//		"soireeType": this.soireeType,
//		"numUsersAttending": this.numUsersAttending,
//		"numUsersMax": this.numUsersMax,
//		"date": timeIntervalSince1970InSeconds,
//		"soireeId": this.soireeId,
//		"businessName": this._business.businessName,
//		"coordinates" : this._business.location.coordinates
//	};
//	return obj;
//};



/* Virtuals */

soireeSchema.virtual('full').get(function () {
	return this.numUsersAttending >= this.numUsersMax;
});

soireeSchema.virtual('SOIREE').get(function () {
	return "Soirée";
});


soireeSchema.virtual('numUsersAttending').get(function () {
	return this._usersAttending.length;
});


soireeSchema.pre("save", function(next){
	//this.dateUpdated = new Date();
	this.scheduledTimeIdentifier = this.constructor.createScheduledTimeIdentifier(this.date);
	//console.log("num users attending: " + this.numUsersAttending);
	//this.full = (this.numUsersAttending >= this.numUsersMax);

	//if (!this._usersAttending){
	//	this._usersAttending = [];
	//}

	next();
});

soireeSchema.post("init", function(soiree){

});

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

