/**
 * Created by shadygabal on 1/15/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var passport = require('passport');
var bcrypt = require('bcrypt');

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');
var Admin = require(dbFolderLocation + 'Admin.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

/****** ******/
/* Everything below here will require the admin to be logged in */
/****** ******/

/* Logged In Check Middleware */
/*** ****/
router.use(function(req, res, next){
    if (!Admin.isLoggedIn(req)){
        res.redirect('/adminLogin');
    }
    else{
        if (!req.admin) req.admin = req.user;
        next();
    }
});

router.get('/', function(req, res){

    UserVerification.findUnverifiedVerifications(req.admin, [], function(verifications){
        res.render('admins/idVerifications', {verifications: verifications});
    }, function(err){
        console.log(err);
        res.status(404).send("Error");
    });
});

router.post('/fetchVerifications', function(req, res){
    var idsToIgnore = req.body.idsToIgnore;

    UserVerification.findUnverifiedVerifications(req.admin, idsToIgnore, function(verifications){
        res.json(verifications);
    }, function(err){
        console.log(err);
        res.status(404).send("Error");
    });
});






//function loggedInRedundantCheck(req, res){
//    if (Admin.isLoggedIn(req)){
//        return true;
//    }
//    else{
//        res.status(401).send("Unauthorized. The FBI has been notified.");
//        console.log("Unauthorized access attempted");
//        return false;
//    }
//};
//
//function checkIfLoggedIn(req, res, next){
//    if (Admin.isLoggedIn(req)){
//        next();
//    }
//    else{
//        res.status(401).send("Unauthorized. The FBI has been notified.");
//        console.log("Unauthorized access attempted - admins");
//        //return false;
//    }
//};


module.exports = router;
