/**
 * Created by shadygabal on 1/14/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var passport = require('passport');
var bcrypt = require('bcrypt');

var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var SoireeReservation = require('app/db/SoireeReservation.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');

var h = require('app/helpers/h');


//router.use(function(req, res, next){
    router.use(function(req, res, next){
        if (!Business.isLoggedIn(req)){
            res.redirect('/adminLogin');
        }
        else{
            if (!req.business) {
                req.business = req.user;
                if (!res.locals.business)
                    res.locals.business = req.user;
            }
            next();
        }
    });
//});

/* Everything below here will require the admin to be logged in */

router.get('/', function(req, res){

    //SoireeReservation.findUnconfirmedReservationsForBusiness(req.business, function(reservations){
        //console.log("Fetched soiree reservations for business: " + req.business.name + " : " + reservations);
    console.log(req.business);

    req.business.deepPopulate("_unconfirmedReservations._soiree", function(err){
            if (err){
                return res.status(404).send("Error");
            }
            ResHelper.render(req, res, 'businesses/index', {reservations : req.business._unconfirmedReservations});

        });

    //}, function(err){
    //    console.log("Error fetching soirees for business: " + req.business);
    //    ResHelper.render(req, res, 'businesses/index', {});
    //});
});

router.get('/contact', function(req, res){
    ResHelper.render(req, res, 'businesses/contact', {});
});

router.get('/history', function(req,res){
   if (req.business){
       req.business.deepPopulate("_unconfirmedReservations _confirmedReservations", function(err, business){
           if (err){
               console.log(err);
               res.status(404).send("Error. Please reload.");
           }
           else{
               var today = [];
               var past7days = [];

               business._confirmedReservations.forEach(function(reservation){
                  if (DateHelper.isSameDay(new Date(), reservation.date)){
                      today.push(reservation);
                  }
               });

               ResHelper.render(req,res,'businesses/history',{business : business, today:today, past7days:past7days});
           }
       });
   }
    else{
       res.redirect('/businessLogin');
   }
});

router.post('/confirmSoireeReservation', function(req, res){
    var confirmationCode = req.body.confirmationCode;
    console.log("Attempting to confirm " + confirmationCode);
    if (!confirmationCode){
        return res.status(404).send("Error");
    }

    confirmationCode = confirmationCode.toUpperCase();
    var responseObj = {};

    req.business.findReservationWithConfirmationCode(confirmationCode, function(reservation){
      //found reservation
        console.log("Confirming...");
        /* CONFIRM BLOCK */
        reservation.confirm(confirmationCode, function(user){
            responseObj.status = "success";

            responseObj.userFullName = user.fullName;
            responseObj.userProfilePictureUrl = user.profilePictureUrl;
            var age = (h.Globals.devOrTest) ? (user.age ? user.age : 26) : user.age;
            responseObj.userAge = age;

            responseObj.message = "Successfully confirmed reservation!";
            responseObj.userId = user.userId;

            var amountPrepaid = "$" + (reservation.amount/100).toFixed(2);
            responseObj.amountPrepaid = amountPrepaid;

            //req.flash('success', 'Successfully confirmed reservation');

            res.json(responseObj);
        }, function(error){
            if (error){
                console.log(error);
                responseObj.status = "fail";
                responseObj.message = "There was an error processing your request. Please try again.";
            }
            else{
                responseObj.status = "fail";
                responseObj.message = "Invalid Confirmation Code.";
            }

            res.json(responseObj);
        });
        /* END CONFIRM BLOCK */

    }, function(err) { //error callback for finding soirees
        console.log(err);

        if (err === ErrorCodes.NotFound) {
            responseObj.status = "fail";
            responseObj.message = "Invalid Confirmation Code.";
        }
        else {
            responseObj.status = "fail";
            responseObj.message = "There was an error processing your request. Please try again.";
        }

        res.json(responseObj);



    });

    //
    //SoireeReservation.findReservationWithConfirmationCode(req.business, confirmationCode, function(reservation){
    //    if (reservation){
    //        console.log("Confirming...");
    //        reservation.confirm(confirmationCode, function(){
    //            responseObj.status = "success";
    //            responseObj.description = "Successfully confirmed reservation";
    //
    //            res.json(responseObj);
    //        }, function(error){
    //            if (error){
    //                console.log(error);
    //                responseObj.status = "fail";
    //                responseObj.description = "There was an error processing your request. Please try again.";
    //            }
    //            else{
    //                responseObj.status = "fail";
    //                responseObj.description = "Incorrect Confirmation Code";
    //            }
    //
    //            res.json(responseObj);
    //        });
    //
    //    }
    //    else{
    //        responseObj.status = "fail";
    //        responseObj.description = "Incorrect Confirmation Code";
    //
    //        res.json(responseObj);
    //    }
    //}, function(err){
    //    console.log(err);
    //    responseObj.status = "fail";
    //    responseObj.description = "There was an error processing your request. Please try again.";
    //
    //    res.json(responseObj);
    //});



});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/businessLogin');
});


module.exports = router;
