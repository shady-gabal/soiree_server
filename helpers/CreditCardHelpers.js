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
            if (!stripeToken && !user.stripeCustomerId)
              return errorCallback();

            //successCallback();

            var amount = soiree.initialCharge;
            console.log(stripeToken);
            console.log(amount);

            var description = "Charge for " + soiree.soireeType + " Soirée on " + soiree.date.toString() + ".";

            var chargeOptions = {
                amount: amount,
                currency: "usd",
                description: description
            };
            if (stripeToken){
                chargeOptions.source = stripeToken;
            }
            else{
                chargeOptions.customer = user.stripeCustomerId;
            }

            stripe.charges.create(chargeOptions, function(err, charge) {

                console.log(err);
                console.log(charge);

                if (err){
                    errorCallback(err);
                }
                else{
                    if (!user.stripeCustomerId && charge.customer) {
                        user.stripeCustomerId = charge.customer;

                        user.save(function (err) {
                            if (err) {
                                errorCallback(err);
                            }
                            else {
                                successCallback(charge);
                            }
                        });
                    }
                    else successCallback(charge);

                }

                //console.log(charge);
                //console.log(charge.customer);

                // asynchronously called
                //if (err && err.type === 'StripeCardError') {
                //    // The card has been declined
                //}

            });

        },

        createStripeCustomerId: function(stripeToken, user, successCallback, errorCallback){

            if (!stripeToken || !user){
                return errorCallback();
            }

            if (user.stripeCustomerId){
                return stripe.customers.del(
                    user.stripeCustomerId,
                    function(err, confirmation) {
                        // asynchronously called
                        if (err){
                            errorCallback(err);
                        }
                        else{
                            successCallback(confirmation);
                        }
                    }
                );
                //return successCallback();
            }

            var description = "Soiree customer: " + user.fullName;

            stripe.customers.create({
                description: description,
                source: stripeToken // obtained with Stripe.js
            }, function(err, customer) {

                if (err){
                    return errorCallback(err);
                }

                user.stripeCustomerId = customer.id;

                user.save(function(err, user){
                    if (err){
                        errorCallback(err);
                    }
                    else{
                        console.log("Saved: " + user.stripeCustomerId);
                        successCallback(customer);
                    }
                });
            });

        },

        deleteStripeCustomer: function(user, successCallback, errorCallback){
            stripe.customers.del(
                user.stripeCustomerId,
                function(err, confirmation) {
                    // asynchronously called
                    if (err){
                        errorCallback(err);
                    }
                    else{
                        successCallback(confirmation);
                    }
                }
            );
        }

    }

}());

module.exports = ccHelpers;