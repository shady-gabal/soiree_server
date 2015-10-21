var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	firstName : {type: String},
	lastName : {type: String},
	facebookId : {type: String},
	userId : {type: String},
	phoneNumber : {type : String},
	numEventsAttended : {type: Number},
	finishedSignUp : {type : Boolean},
	dateSignedUp: {type : Date},
	dateLastSignedIn : {type:Date},
	eventsAttended: [{type:String}],
	appDescription : {type: String},
	dateUpdated : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('User', userSchema);

