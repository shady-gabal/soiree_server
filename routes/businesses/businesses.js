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


//router.get('/login', function(req, res){
//    res.render('businesses/login', { title: 'Express' });
//});
//
//
//router.get('/createBusiness', function(req, res){
//    var email = req.query.email;
//    var password = req.query.password;
//
//    var longitude = 40.762755;
//    var latitude = -73.882201;
//
//    var businessObj = {
//        businessType : "Bar",
//        //_soirees : [],
//        businessName : "Paddy's Pub",
//        phoneNumber : '3472102276',
//        cityArea: "SoHo",
//        location : {type: "Point", coordinates:[longitude, latitude]}
//    };
//
//    Business.createBusiness(businessObj, email, password, function(business){
//        res.send("Created business: " + business);
//    }, function(err){
//        res.send("Error creating business: " + err);
//    });
//});
////
//router.get('/createBusinesses', function(req, res){
//    var longitude = 40.762755;
//    var latitude = -73.882201;
//
//    var business = new Business({
//        businessType : "Bar",
//        _soirees : [],
//        businessName : "Paddy's Pub",
//        cityArea: "SoHo",
//        location : {type: "Point", coordinates:[longitude, latitude]}
//    });
//
//    business.save(function(){
//        res.send("Complete");
//    });
//});
//
//
//
//
//
////router.get('/deleteBusinesses', function(req, res){
////    Admin.remove({}, function(err){
////        res.send("Removed admins with err: " +err);
////    });
////});
//
//router.post('/login', function(req, res, next){
//    passport.authenticate( 'business', { successRedirect: '/businesses/', failureRedirect: '/businesses/login', failureFlash: false}, function(err, user, info){
//
//        if (err) return next(err);
//        if (!user) { return res.redirect('/businesses/login'); }
//
//        req.login(user, function(err) {
//            if (err) { return next(err); }
//            return res.redirect('/businesses/');
//        });
//
//    })(req, res, next);
//});

//router.use(function(req, res, next){
//    if (!req.user || req.user.classType !== 'business'){
//        res.redirect('/businessLogin');
//    }
//    else next();
//});

/* Everything below here will require the admin to be logged in */

router.get('/', function(req, res){

    //SoireeReservation.findUnconfirmedReservationsForBusiness(req.business, function(reservations){
        //console.log("Fetched soiree reservations for business: " + req.business.name + " : " + reservations);
        req.business.deepPopulate("_unconfirmedReservations._soiree", function(err){
            if (err){
                return res.status(404).send("Error");
            }
            //console.log(req.business);
            ResHelper.render(req, res, 'businesses/index', {reservations : req.business._unconfirmedReservations});

        });

    //}, function(err){
    //    console.log("Error fetching soirees for business: " + req.business);
    //    ResHelper.render(req, res, 'businesses/index', {});
    //});
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
        reservation.confirm(confirmationCode, function(){
            responseObj.status = "success";
            responseObj.description = "Successfully confirmed reservation";

            res.json(responseObj);
        }, function(error){
            if (error){
                console.log(error);
                responseObj.status = "fail";
                responseObj.description = "There was an error processing your request. Please try again.";
            }
            else{
                responseObj.status = "fail";
                responseObj.description = "Incorrect Confirmation Code";
            }

            res.json(responseObj);
        });
        /* END CONFIRM BLOCK */

    }, function(err) { //error callback for finding soirees
        console.log(err);

        if (err === ErrorCodes.NotFound) {
            responseObj.status = "fail";
            responseObj.description = "Incorrect Confirmation Code";
        }
        else {
            responseObj.status = "fail";
            responseObj.description = "There was an error processing your request. Please try again.";
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






//
//function loggedInRedundantCheck(req, res){
//    if (isLoggedIn(req)){
//        return true;
//    }
//    else{
//        res.status(401).send("Unauthorized. The FBI has been notified.");
//        console.log("Unauthorized access attempted - businesses");
//        return false;
//    }
//};
//
//function isLoggedIn(req) {
//    if (req.user && req.user.classType === 'business') {
//        return true;
//    }
//    return false;
//}
//
//function checkIfLoggedIn(req, res, next){
//    if (isLoggedIn(req)){
//        next();
//    }
//    else{
//        res.status(401).send("Unauthorized. The FBI has been notified.");
//        console.log("Unauthorized access attempted - businesses");
//        //return false;
//    }
//};


//router.get('/registerBusiness', function(req, res){
//    if (loggedInSafetyCheck(req, res)){
//        res.render('admins/registerBusiness', { admin: req.user });
//    }
//});



module.exports = router;
