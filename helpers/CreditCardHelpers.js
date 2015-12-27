/**
 * Created by shadygabal on 12/13/15.
 */
//var express = require('express');
//var router = express.Router();
//
//var dbFolderLocation = "../../db/";
//var helpersFolderLocation = "../../helpers/";
//
//var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
//var Soiree = require(dbFolderLocation + 'Soiree.js');
//var Business = require(dbFolderLocation + 'Business.js');
//var User = require(dbFolderLocation + 'User.js');
//
//var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
//var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');

var stripe = require("stripe")(
    "sk_test_BQokikJOvBiI2HlWgH4olfQ2"
);

var ccHelpers = (function() {

    return {
        chargeUser: function (user, amount, successCallback, errorCallback) {
            stripe.charges.create({
                amount: amount,
                currency: "usd",
                source: "tok_17HYmn2eZvKYlo2CGwmmv0Wm", // obtained with Stripe.js
                description: "Charge for test@example.com"
            }, {

            }, function(err, charge) {
                // asynchronously called
                if (err){
                    errorCallback(err);
                }
                else{
                    successCallback(charge);
                }
            });

        }

        //isNextDay: function (firstDate, secondDate) {
        //    var nextDayDiff = 1000 * 60 * 60 * 24;
        //    var midnightOne = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDay());
        //    var midnightTwo = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDay());
        //
        //    var diff = Math.abs(midnightTwo - midnightOne);
        //    return diff == nextDayDiff;
        //}

    }

}());

module.exports = ccHelpers;