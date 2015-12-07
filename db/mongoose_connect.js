//exports mongoose connected to db

//to enable .env file to be read into process.env. Make sure to add .env to .gitignore
require('dotenv').config({silent: true});

var mongoose = require('mongoose');
var uriUtil = require('mongodb-uri');

/* 
 * Mongoose by default sets the auto_reconnect option to true.
 * We recommend setting socket options at both the server and replica set level.
 * We recommend a 30 second connection timeout because it allows for 
 * plenty of time in most operating environments.
 */
var options = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } };  



var mongodbUri = process.env.MONGOLAB_URI;
var mongooseUri = uriUtil.formatMongoose(mongodbUri);

//for local dev
if (process.env.LOCAL){
	console.log('connecting to local mongodb...');
	mongoose.connect("mongodb://localhost/soireedb", options);
}

else{
	//for remote dev
	console.log('connecting to remote mongodb...');
	mongoose.connect(mongooseUri, options);
}

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function(){
	console.log('connected to db');
});

module.exports = mongoose;