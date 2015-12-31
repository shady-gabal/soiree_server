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
    process.env.STRIPE_SECRET_KEY
);

var ccHelpers = (function() {

    return {
        chargeForSoiree: function (soiree, user, stripeToken, successCallback, errorCallback) {
            if (!stripeToken)
              return errorCallback();

            //successCallback();

            var amount = soiree.initialCharge;
            console.log(stripeToken);
            console.log(amount);
            
            stripe.charges.create({
                amount: amount,
                currency: "usd",
                source: stripeToken, // obtained with Stripe.js
                description: "Charge for test@example.com"
            }, {

            }, function(err, charge) {
                console.log(charge);
                console.log(charge.customer);

                // asynchronously called
                if (err && err.type === 'StripeCardError') {
                    // The card has been declined
                }
                if (err){
                    errorCallback(err);
                }
                else{
                    successCallback(charge);
                }
            });

        }

    }

}());

module.exports = ccHelpers;