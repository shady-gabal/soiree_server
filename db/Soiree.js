/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var User = require('./User.js');

/* Packages */
var shortid = require('shortid');

/* Helpers */
var DateHelpers = require('../helpers/DateHelpers.js');

/* Schema Specific */
var soireeTypes = ["Lunch", "Dinner", "Drinks", "Blind Date"];

var soireeSchema = new Schema({
	soireeType : {type: String, required: true, enum: soireeTypes},
	numUsersMax: {type : Number, required: true},
	scheduledTime : {type: Number, required: true},
	soireeId: {type: String, unique: true, default: shortid.generate},
	initialCharge: {type: Number, required: [true, "Forgot to include how much soiree will cost"]},
	date: {type : Date, required: [true, "A date for the Soiree is required"]},
	full: {type: Boolean, default: false},
	_usersAttending : [{type : ObjectId, ref : "User"}],
	_business: {type: ObjectId, ref:"Business", required :[true, "A business that will host is required to create this Soiree"]},
	location: {
		type: {type: String},
		coordinates: []
	},
	dateCreated : {type: Date, default: new Date()}
});

soireeSchema.index({location: '2dsphere'});

/* Static Methods */

soireeSchema.statics.createSoiree = function(soiree, business, successCallback, errorCallback) {
	var newSoiree = new this(soiree);

	newSoiree._business = business._id;
	newSoiree.location = business.location;
	newSoiree._usersAttending = [];

	newSoiree.save(function(err){
		if (err){
			errorCallback(err);
		}
		else{
			successCallback();
		}
	});
};

soireeSchema.statics.createLunch = function(date, business, successCallback, errorCallback) {
	//var date = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));

	var soiree = new Soiree({
		soireeType: "Lunch",
		numUsersMax: 3,
		date: date,
		_usersAttending: [],
		_business: business._id,
		initialCharge: 3,
		location: business.location
	});

	this.createSoiree(soiree, business, successCallback, errorCallback);
};

soireeSchema.statics.createDinner = function(date, business, successCallback, errorCallback) {
	//var date = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));

	var soiree = new Soiree({
		soireeType: "Dinner",
		numUsersMax: 4,
		date: date,
		_usersAttending: [],
		_business: business._id,
		initialCharge: 3,
		location: business.location
	});

	this.createSoiree(soiree, business, successCallback, errorCallback);
};

soireeSchema.statics.createDrinks = function(date, business, successCallback, errorCallback) {
	//var date = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));

	var soiree = new Soiree({
		soireeType: "Drinks",
		numUsersMax: 4,
		date: date,
		_usersAttending: [],
		_business: business._id,
		initialCharge: 3,
		location: business.location
	});

	this.createSoiree(soiree, business, successCallback, errorCallback);
};


soireeSchema.statics.findNearestSoirees = function(coors, callback){
	this.find({ location: { $near : coors }}).populate("_business").exec(callback);
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
//	if (!DateHelpers.isSameDay(todaysDate, date)){
//		if (DateHelpers.isNextDay(todaysDate, date)){
//			when = "Tomorrow";
//		}
//		else when = DateHelpers.dayFromDayNumber(date.getDay());
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
	this.findOne({soireeId : soireeId}).exec(function(err, soiree){
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
		errorCallback("no soiree");
	});
};




/* Methods */

soireeSchema.methods.join = function(user, successCallback, errorCallback){
	if (this.numUsersAttending >= this.numUsersMax) {
		this.full = true;
	}

	if (!this.full){
		this._usersAttending.push(user._id);
		this.full = (this.numUsersAttending >= this.numUsersMax);

		this.save(function(err){
			if (!err){
				successCallback(this);
			}
			else{
				errorCallback(err);
			}
		});

	}
	else{
		errorCallback("full");
	}
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

soireeSchema.virtual('numUsersAttending').get(function () {
	return this._usersAttending.length;
});

soireeSchema.virtual('jsonObject').get(function () {
	var timeIntervalSince1970InSeconds = this.date.getTime() / 1000;

	var obj = {
		"soireeType": this.soireeType,
		"numUsersAttending": this.numUsersAttending,
		"numUsersMax": this.numUsersMax,
		"date": timeIntervalSince1970InSeconds,
		"soireeId": this.soireeId,
		"businessName": this._business.businessName,
		"cityArea" : this._business.cityArea,
		"coordinates" : this.location.coordinates,
		"initialCharge": this.initialCharge
	};
	return obj;
});



//soireeSchema.pre('save', function(next){
//	//if (!this.timeAtString) {
//	this.timeAtString = soireeSchema.statics.timeAtStringFromDate(this.date);
//	//}
//	next();
//});

soireeSchema.pre('save', function(next){
	this.dateUpdated = new Date();

	var scheduledTime = this.date.getHours();
	var minsRemainder = parseInt(this.getMinutes() / 15) * .15;
	this.scheduledTime = scheduledTime + minsRemainder;
	console.log("scheduled time: " + this.scheduledTime);
	
	next();
});

module.exports = mongoose.model('Soiree', soireeSchema);

