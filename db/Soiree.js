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
	numUsersAttending : {type: Number, default: 0},
	numUsersMax: {type : Number, required: true},
	soireeId: {type: String, unique: true, default: shortid.generate},
	date: {type : Date, required: [true, "A date for the Soiree is required"]},
	//timeAtString : {type : String},
	_usersAttending : [{type : ObjectId, ref : "User"}],
	_business: {type: ObjectId, ref:"Business", required :[true, "A business that will host is required to create this Soiree"]},
	dateCreated : {type: Date, default: Date.now()}
});

soireeSchema.statics.timeAtStringFromDate = function(date){
	//var day = (24 + i) % 30;
	//var date = new Date(2015, (10 - 1), day, 18, 30, 0);
	var todaysDate = new Date();
	var hour = date.getHours();
	var minutes = date.getMinutes();

	if (minutes < 10){
		minutes = "0" + minutes.toString();
	}

	var amPm = "AM";
	var when = "Today";

	if (!DateHelpers.isSameDay(todaysDate, date)){
		if (DateHelpers.isNextDay(todaysDate, date)){
			when = "Tomorrow";
		}
		else when = DateHelpers.dayFromDayNumber(date.getDay());
	}
	else if (hour > 18){
		when = "Tonight";
	}

	if (hour > 12) {
		hour -= 12;
		amPm = "PM";
	}
	var timeAtString = when + " at " + hour + ":" + minutes + " " + amPm;
	return timeAtString;
};

soireeSchema.methods.createDataObjectToSend = function(){
	var timeIntervalSince1970InSeconds = this.date.getTime() / 1000;

	var obj = {
		"soireeType": this.soireeType,
		"numUsersAttending": this.numUsersAttending,
		"numUsersMax": this.numUsersMax,
		"date": timeIntervalSince1970InSeconds,
		"soireeId": this.soireeId,
		"businessName": this._business.businessName
	};
	return obj;
};

//soireeSchema.statics.createSoiree = function(type, date, business){
//
//}



//soireeSchema.pre('save', function(next){
//	//if (!this.timeAtString) {
//	this.timeAtString = soireeSchema.statics.timeAtStringFromDate(this.date);
//	//}
//	next();
//});

soireeSchema.pre('save', function(next){
	this.dateUpdated = new Date();
	next();
});

module.exports = mongoose.model('Soiree', soireeSchema);

