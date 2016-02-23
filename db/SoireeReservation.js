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

var RETRIES_ON_DUPLICATE_CONFIRMATION_CODE = 5;

var customSchema = new Schema({
        _user : {type: ObjectId, ref:"User", required: true},
        _soiree : {type: ObjectId, ref: "Soiree", required: true},
        _business : {type: ObjectId, ref: "Business", required: true},
        reservationId: {type: String, index: true, default: shortid.generate},
        soireeId: {type: String},
        confirmationCode : {type: String, default: generateConfirmationCode, uppercase: true, trim: true},
        confirmed : {type: Boolean, default: false}

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

customSchema.statics.createSoireeReservation = function(user, soiree, charge, successCallback, errorCallback){
    if (MongooseHelper.isObjectId(soiree))
        return errorCallback(ErrorCodes.MissingData);

    if (!soiree.populated("_business")){
        return errorCallback(ErrorCodes.InvalidInput);
    }

    //var businessId = MongooseHelper.isObjectId(soiree._business) ? soiree._business : soiree._business._id;
    //if (MongooseHelper.isObjectId(soiree)){
    //    businessId = _business;
    //}
    //else businessId = _business._id;

    var business = soiree._business;

    var reservation = new this({
        _user : user._id,
        _soiree : soiree._id,
        soireeId : soiree.soireeId,
        _business : business._id
    });

    //var retries = 0;

    reservation.save(function(err, _reservation){
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
            user._pendingReservations.push(_reservation._id);
            business._unconfirmedReservations.push(_reservation._id);

            soiree._usersAttending.push(user._id);
            //user._soireesAttending.push(soiree._id);

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

            //user.save(function(err){
            //    if (err){ console.log(err); errorCallback(ErrorCodes.ErrorSaving); }
            //    else{
            //        soiree.save(function(err){
            //            if (err){ console.log(err); errorCallback(ErrorCodes.ErrorSaving); }
            //        });
            //    }
            //});
        }
    });

    //reservation.save(saveCallback);

};

//customSchema.statics.findReservationWithConfirmationCode = function(business, code, successCallback, errorCallback){
//    code = code.toUpperCase();
//
//    this.findOne({confirmationCode : code, _business : business._id, confirmed: false}).deepPopulate("_soiree _user _business").exec(function(err, reservation){
//       if (err){
//           console.log("Error finding reservation: " + err);
//           errorCallback();
//       }
//        else{
//           successCallback(reservation);
//       }
//    });
//};

//customSchema.statics.findUnconfirmedReservationsForBusiness = function(business, successCallback, errorCallback){
//    this.find({_business : business._id, confirmed: false}).deepPopulate("_soiree _user _business").exec(function(err, reservations){
//        if (err){
//            errorCallback();
//        }
//        else{
//            successCallback(reservations);
//        }
//    });
//};

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
    if (!this.confirmed){
        var retries = 0;

        var reservation = this;

        var check = function(){
            SoireeReservation.checkIfConfirmationCodeIsUnique(reservation, function(unique){
                if (unique){
                    console.log(reservation.confirmationCode + " worked. ");
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

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
customSchema.plugin(deepPopulate, options);


var SoireeReservation = mongoose.model('SoireeReservation', customSchema);
module.exports = SoireeReservation;