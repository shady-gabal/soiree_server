var mongoose = require('./../mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./../Business.js');
var User = require('./../User.js');
var Soiree = require('./Soiree.js');
/* Packages */
var shortid = require('shortid');
var _ = require("underscore");

/* Helper */
var helpersFolderLocation = "../../helpers/";
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');
var Globals = require(helpersFolderLocation + 'Globals.js');
var io = Globals.io;

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


var customSchema = new Schema({
        _soiree : {type: ObjectId, ref: "Soiree"},
        _usersJoined : [{type: ObjectId, ref: "User"}]

    },
    {timestamps: {createdAt: 'dateCreated', updatedAt: 'dateUpdated'}}
);

customSchema.methods.

customSchema.virtual('').get(function () {
});


customSchema.pre("save", function (next) {
    next();
});

customSchema.post("init", function (soiree) {

});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
customSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('SoireeHost', customSchema);