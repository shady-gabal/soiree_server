var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var soireeSchema = new Schema({
	soireeType : {type: String},
	numUsersAttending : {type: Number},
	numUsersMax: {type : Number},
	eventId: {type: Number},
	date: {type : Date},
	usersAttending : [{type:String}],
	dateUpdated : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Soiree', soireeSchema);

