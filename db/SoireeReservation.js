var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var User = require('./User.js');
var Soiree = require('./Soiree.js');

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
var MongooseHelper = require(helpersFolderLocation + 'MongooseHelper.js');

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


var customSchema = new Schema({
        _user : {type: ObjectId, ref:"User", required: true},
        _soiree : {type: ObjectId, ref: "Soiree", required: true},
        _business : {type: ObjectId, ref: "Business", required: true},
        confirmationCode : {type: String, default: generateConfirmationCode},
        confirmed : {type: Boolean, default: false}

    },
    {timestamps: {createdAt: 'dateCreated', updatedAt: 'dateUpdated'}}
);

customSchema.index({ confirmationCode: 1, _business: 1, confirmed: 1}, { unique: true }, function(err, indexName){
   console.log("index callback with err: " + err + " index: " + indexName);
});

function generateConfirmationCode(){
    //var letters = "abcdefghijklmnopqrstuvwxyz123456789".toUpperCase().split("");
    //
    //var code = "";
    //var numDigits = 3;
    //for (var i = 0; i < numDigits; i++){
    //    var randIndex = parseInt(Math.random() * letters.length);
    //    code += letters[randIndex];
    //}
    //return code;

    return "" + (parseInt(Math.random() * 2));

    //return "A";
};

customSchema.statics.createSoireeReservation = function(user, soiree, charge, successCallback, errorCallback){
    console.log(soiree);
    if (MongooseHelper.isObjectId(soiree))
        return errorCallback(ErrorCodes.MissingData);

    var businessId = MongooseHelper.isObjectId(soiree._business) ? soiree._business : soiree._business._id;
    //if (MongooseHelper.isObjectId(soiree)){
    //    businessId = _business;
    //}
    //else businessId = _business._id;

    var reservation = new this({
        _user : user._id,
        _soiree : soiree._id,
        _business : businessId
    });

    var retries = 0;

    var saveCallback = function(err, _reservation){
        if (err){
            console.log("Error saving reservation: " + err);

            //if (err.code == "11000" && retries < 5){
            //    retries++;
            //    console.log("Retrying num " + retries + "...");
            //    reservation.confirmationCode = generateConfirmationCode();
            //    reservation.save(saveCallback);
            //}
            //else{
                errorCallback(ErrorCodes.ErrorSaving);
            //}
        }
        else{
            soiree._reservations.push(_reservation._id);
            user._reservations.push(_reservation._id);

            soiree._usersAttending.push(user._id);
            user._soireesAttending.push(soiree._id);

            user.save(function(err){

                if (err){
                    console.log("Error saving user: " + err);
                    errorCallback(ErrorCodes.ErrorSaving);
                }

                else{
                    soiree.save(function(err){
                        if (!err){
                            successCallback();
                        }
                        else{
                            errorCallback(ErrorCodes.SoireeError);
                        }
                    });
                }
            });
        }
    };

    reservation.save(saveCallback);

};

customSchema.statics.findReservationWithConfirmationCode = function(business, code, successCallback, errorCallback){
    this.findOne({confirmationCode : code, _business : business._id, confirmed: false}).deepPopulate("_soiree _user").exec(function(err, reservation){
       if (err){
           errorCallback();
       }
        else{
           successCallback(reservation);
       }
    });
};

customSchema.statics.findReservationsForBusiness = function(business, successCallback, errorCallback){
    this.find({_business : business._id}).deepPopulate("_soiree _user").exec(function(err, reservations){
        if (err){
            errorCallback();
        }
        else{
            successCallback(reservations);
        }
    });
};

customSchema.methods.confirm = function(code, successCallback, errorCallback){
    if (code === this.confirmationCode && !this.confirmed){
        this.confirmed = true;
        this.confirmationCode = "ALREADY_CONFIRMED";
        this.save();
        successCallback();
    }
    else errorCallback();
};

customSchema.virtual('').get(function () {
});


customSchema.pre("save", function (next) {
    if (!this.confirmed){
        var retries = 0;

        var check = function(){
            this.checkIfConfirmationCodeIsUnique(this, function(unique){
                if (unique){
                    next();
                }
                else{
                    if (retries < 5){
                        retries++;
                        check();
                    }
                    else next(new Error("Unable to create unique confirmation code"));
                }
            }, function(err){
                console.log("Error checking if there are any existing reservations with same confirmation code : " + err);
                next(new Error("Error checking for existing reservations in pre(save)"));
            });
        };

        check();
    }
    else{
        next();
    }

});

customSchema.statics.checkIfConfirmationCodeIsUnique = function(reservation, successCallback, errorCallback){
    this.find({confirmationCode : reservation.confirmationCode, _business : reservation._business, confirmed: false}).exec(function(err, reservations){
        if (err){
           errorCallback(err);
        }
        else{
            if (reservations.length === 0){
                successCallback(true);
            }
            else{
                successCallback(false);
            }
        }
    });
};

customSchema.post("init", function (soiree) {

});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
customSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('SoireeReservation', customSchema);