var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var eventSchema = new Schema({
	eventType : {type: String},
	numUsersAttending : {type: Number},
	numUsersMax: {type : Number},
	eventId: {type: Number},
	date: {type : Date},
	usersAttending : [{type:String}],
	appDescription : {type: String},
	dateUpdated : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Event', eventSchema);

