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
var ResHelpers = require(helpersFolderLocation + 'ResHelpers.js');

/* Schema Specific */
var soireeTypes = ["Lunch", "Dinner", "Drinks", "Blind Date"];

/* Error Codes */
var errorCodes = new Enum({'SoireeError' : 1, 'SoireeFull' : 2, 'SoireeExpired' : 3, 'UserNeedsStripeToken' : 4});


var soireeSchema = new Schema({
	soireeType : {type: String, required: true, enum: soireeTypes},
	numUsersMax: {type : Number, required: true},
	scheduledTime : {type: Number},
	soireeId: {type: String, unique: true, default: shortid.generate},
	initialCharge: {type: Number, required: [true, "Forgot to include how much soiree will cost"]},
	date: {type : Date, required: [true, "A date for the Soiree is required"]},
	full: {type: Boolean, default: false},
	_usersAttending : [{type : ObjectId, ref : "User"}],
	_business: {type: ObjectId, ref:"Business", required :[true, "A business that will host is required to create this Soiree"]},
	location: {
		type: {type: String},
		coordinates: []
	}
},
	{ timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

soireeSchema.index({location: '2dsphere'});



/* Static Methods */

soireeSchema.statics.createScheduledTime = function(date){
	var scheduledTime = date.getHours();
	var minsRemainder = date.getMinutes() / 100;

	return scheduledTime + minsRemainder;
};

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

soireeSchema.statics.joinSoireeWithId = function(soireeId, user, res){
	this.findBySoireeId(soireeId, function(soiree){
		soiree.join(user, res);
	}, function(err){
		ResHelpers.sendError(res, errorCodes.SoireeError);
	});
};



//function(){
//	res.type('text/plain');
//	res.status('200').send("Done");
//}, function(err){
//	res.type('text/plain');
//	ResHelpers.sendMessage(res, 404, "error finding soiree");
//});

/* Methods */

soireeSchema.methods.join = function(user, res){
	if (this.numUsersAttending >= this.numUsersMax) {
		this.full = true;
	}

	if (!this.full){
		if (!user.stripeToken){
			return ResHelpers.sendError(res, errorCodes.UserNeedsStripeToken);
		}
		else{
			user.chargeForSoiree(soiree, function(charge){
				this._usersAttending.push(user._id);
				//this.full = (this.numUsersAttending >= this.numUsersMax);

				this.save(function(err){
					if (!err){
						ResHelpers.sendSuccess(res);
					}
					else{
						ResHelpers.sendError(res, errorCodes.SoireeError);
					}
				});
			}, function(err){

			});
		}



	}
	else{
		ResHelpers.sendError(res, errorCodes.SoireeFull);
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


soireeSchema.pre("save", function(next){
	this.dateUpdated = new Date();
	this.scheduledTime = this.constructor.createScheduledTime(this.date);
	console.log("num users attending: " + this.numUsersAttending);
	this.full = (this.numUsersAttending >= this.numUsersMax);

	next();
});

//soireeSchema.pre('save', function(next){
//	//if (!this.timeAtString) {
//	this.timeAtString = soireeSchema.statics.timeAtStringFromDate(this.date);
//	//}
//	next();
//});



module.exports = mongoose.model('Soiree', soireeSchema);

