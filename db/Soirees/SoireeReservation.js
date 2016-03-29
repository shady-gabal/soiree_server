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
var Globals = require(helpersFolderLocation + 'Globals.js');
var ArrayHelper = require(helpersFolderLocation + 'ArrayHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');
var MongooseHelper = require(helpersFolderLocation + 'MongooseHelper.js');

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

var RETRIES_ON_DUPLICATE_CONFIRMATION_CODE = 5;

var customSchema = new Schema({
        _user : {type: ObjectId, ref:"User", required: true},
        _soiree : {type: ObjectId, ref: "Soiree", required: true},
        _business : {type: ObjectId, ref: "Business", required: true},
        reservationId: {type: String, index: true, default: shortid.generate},
        soireeId: {type: String},
        charged : {type: Boolean, default: false},
        charge : {type: Schema.Types.Mixed},
        confirmationCode : {type: String, default: generateConfirmationCode, uppercase: true, trim: true},
        confirmed : {type: Boolean, default: false},
        confirmationCodeSet : {type: Boolean, default: false}


    },
    {timestamps: {createdAt: 'dateCreated', updatedAt: 'dateUpdated'}}
);


//customSchema.index({ confirmationCode: 1, _business: 1, confirmed: 1}, { unique: true }, function(err, indexName){
//   console.log("index callback with err: " + err + " index: " + indexName);
//});

function generateConfirmationCode(){
    var letters = "abcdefghjklmnpqrstuvwxyz".toUpperCase().split(""); //No o,i
    var numbers = "123456789".split("");//no 0
    var both = letters.concat(numbers);

    var code = "";
    var numDigits = 3;
    for (var i = 0; i < numDigits; i++){
        var arr;
        if (i != 1){
            arr = both;
        }
        else{
            arr = numbers;
        }
        var randIndex = parseInt(Math.random() * arr.length);
        code += arr[randIndex];

    }
    return code;

    //return "" + (parseInt(Math.random() * 3));

    //return "A";
};

customSchema.statics.createUnchargedSoireeReservation = function(user, soiree, successCallback, errorCallback){
    var business = soiree._business;

    var reservation = new this({
        _user : user._id,
        _soiree : soiree._id,
        soireeId : soiree.soireeId,
        _business : business._id
    });

    reservation.save(function(err, _reservation) {
        if (err) {
            console.log("Error saving reservation: " + err);
        }
        else{
            //common
            ArrayHelper.pushOnlyOnce(user._currentReservations, _reservation._id);
            //specific
            ArrayHelper.pushOnlyOnce(soiree._unchargedReservations, reservation._id);
            ArrayHelper.pushOnlyOnce(soiree._usersUncharged, user._id);

            var orderToSave = [soiree, user];
            var currSaveIndex = 0;

            var saveErrorCallback = function(err){
                if (err){
                    console.log(err);
                    errorCallback(ErrorCodes.ErrorSaving);
                }
                else{
                    currSaveIndex++;
                    if (currSaveIndex >= orderToSave.length){
                        successCallback();
                    }
                    else{
                        var nextObj = orderToSave[currSaveIndex];
                        nextObj.save(saveErrorCallback);
                    }
                }
            };

            orderToSave[0].save(saveErrorCallback);
        }
    });
};

customSchema.statics.createChargedSoireeReservation = function(user, soiree, successCallback, errorCallback) {
    if (soiree._chargedReservations.indexOf(user._id) != -1){
        return errorCallback(ErrorCodes.AlreadyExists);
    }
    else if (soiree._unchargedReservations.indexOf(user._id) != -1){
        return errorCallback(ErrorCodes.AlreadyExists);
    }
    else{
        console.log("In createChargedSoireeReservation() : charging " + user.fullName);
        CreditCardHelper.chargeForSoiree(this, user, function(charge) {
            if (!charge){ return errorCallback(ErrorCodes.StripeError); }
            createChargedSoireeReservationAfterCharge(user, soiree, charge, successCallback, errorCallback);
        }, function(err){
            errorCallback(err);
        });
    }
};

function createChargedSoireeReservationAfterCharge(user, soiree, charge, successCallback, errorCallback){
    if (MongooseHelper.isObjectId(soiree))
        return errorCallback(ErrorCodes.MissingData);

    if (!soiree.populated("_business")){
        return errorCallback(ErrorCodes.InvalidInput);
    }

    if (!charge) {
        return errorCallback(ErrorCodes.StripeError);
    }

    console.log("Creating charged soiree reservation...");

    var business = soiree._business;

    var SoireeReservation = mongoose.model("SoireeReservation");

    var reservation = new SoireeReservation({
        _user : user._id,
        _soiree : soiree._id,
        soireeId : soiree.soireeId,
        _business : business._id,
        charge : charge,
        charged : true
    });


    reservation.save(function(err, _reservation){
        if (err){
            console.log("Error saving reservation: " + err);
            errorCallback(ErrorCodes.ErrorSaving);
        }
        else{
            //common
            ArrayHelper.pushOnlyOncePopulated(user, "_currentReservations", _reservation);
            //specific
            ArrayHelper.pushOnlyOncePopulated(soiree, "_chargedReservations", _reservation);
            ArrayHelper.pushOnlyOncePopulated(business, "_unconfirmedReservations", _reservation);
            ArrayHelper.pushOnlyOncePopulated(soiree, "_usersAttending", user);

            var orderToSave = [business, soiree, user];
            var currSaveIndex = 0;

            var saveErrorCallback = function(err){
                if (err){
                    console.log(err);
                    errorCallback(ErrorCodes.ErrorSaving);
                }
                else{
                    currSaveIndex++;
                    if (currSaveIndex >= orderToSave.length){
                        successCallback();
                    }
                    else{
                        var nextObj = orderToSave[currSaveIndex];
                        nextObj.save(saveErrorCallback);
                    }
                }

            };
            orderToSave[0].save(saveErrorCallback);

        }
    });
};

customSchema.methods.chargeUser = function(successCallback, errorCallback){
    if (!this.charged){
        console.log("about to charge " + this._user.fullName);

        this.deepPopulate("_soiree _user", function(err, _reservation){
            CreditCardHelper.chargeForSoiree(_reservation._soiree, _reservation._user, function(charge) {
                if (!charge){ return errorCallback(ErrorCodes.StripeError); }

                _reservation.charged = true;
                _reservation.charge = charge;

                _reservation.save(function(err){
                    if (err){
                        console.log(err);
                        //TODO: Refund Charge
                        errorCallback(err);
                    }
                    else successCallback(_reservation._user);
                });
            }, function(err){
                errorCallback(err);
            });
        });
    }

};


customSchema.statics.checkIfConfirmationCodeIsUnique = function(reservation, successCallback, errorCallback){
    SoireeReservation.find({confirmationCode : reservation.confirmationCode, _business : reservation._business, confirmed: false}).exec(function(err, reservations){
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

customSchema.methods.confirm = function(code, successCallback, errorCallback){
    code = code.toUpperCase();

    var reservation = this;

    if (code === this.confirmationCode && !this.confirmed){
        this.confirmed = true;
        this.confirmationCode = "ALREADY_CONFIRMED";
        this.save(function(err){
            if (err){
                console.log(err);
                errorCallback(ErrorCodes.ErrorSaving);
            }
            else{
                console.log(reservation);
                reservation.populate("_business", function(err){
                    if (err){
                        console.log(err);
                        return errorCallback(ErrorCodes.ErrorSaving);
                    }
                    reservation._business.confirmSoireeReservation(reservation, successCallback, errorCallback);
                });
                //console.log("Successfully confirmed reservation");
                //successCallback();
            }
        });
    }
    else errorCallback();
};

customSchema.statics.addReservationsForSoirees = function(soirees, user, successCallback){
    var ans = {};
    var numReturned = 0;

    for (var i = 0; i < soirees.length; i++){
        var soireeId = soirees[i].soireeId;
        this.findOne({soireeId: soireeId, _user: user._id}).exec(function (err, reservation) {
            numReturned++;
            if (err || !reservation) {
            }
            else {
                ans[soireeId] = reservation.jsonObject();
                if (numReturned === soirees.length){
                    successCallback(ans);
                }
            }
        });
    }
};

customSchema.methods.jsonObject = function(){
  return {
      "reservationId" : this.reservationId,
      "soireeId" : this.soireeId,
      "confirmationCode" : this.confirmationCode,
      "confirmed" : this.confirmed
  };
};

customSchema.virtual('').get(function () {
});


customSchema.pre("save", function (next) {
    if (!this.confirmationCodeSet && !this.confirmed  && this.charged && this.charge){
        var retries = 0;

        var reservation = this;

        var check = function(){
            SoireeReservation.checkIfConfirmationCodeIsUnique(reservation, function(unique){
                if (unique){
                    console.log(reservation.confirmationCode + " worked. ");
                    this.confirmationCodeSet = true;
                    next();
                }
                else{
                    console.log(reservation.confirmationCode + " didnt work. ");
                    if (retries < RETRIES_ON_DUPLICATE_CONFIRMATION_CODE){
                        reservation.confirmationCode = generateConfirmationCode();
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


customSchema.post("init", function (soiree) {

});

var autoPopulate = function(next){
    this.populate("_business");
    this.populate("_soiree");
    next();
};

customSchema.pre("findOne", autoPopulate);
customSchema.pre("find", autoPopulate);

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
customSchema.plugin(deepPopulate, options);


var SoireeReservation = mongoose.model('SoireeReservation', customSchema);
module.exports = SoireeReservation;