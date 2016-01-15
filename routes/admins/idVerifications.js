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
        res.redirect('/admins/login');
    }
    else{
        res.locals.admin = req.user;
        next();
    }
});



router.get('/', checkIfLoggedIn, function(req, res){
    if (loggedInRedundantCheck(req, res)){
        UserVerification.findUnverifiedVerifications(this, function(verifications){
            console.log(verifications);
            res.render('admins/idVerifications', {verifications: verifications});
        }, function(err){
            res.status(404).send("Error finding verifications");
        });
    }
});





function loggedInRedundantCheck(req, res){
    if (Admin.isLoggedIn(req)){
        return true;
    }
    else{
        res.status(401).send("Unauthorized. The FBI has been notified.");
        console.log("Unauthorized access attempted");
        return false;
    }
};

//function isLoggedIn(req) {
//    if (req.user && req.user.classType === 'admin') {
//        return true;
//    }
//    return false;
//}

function checkIfLoggedIn(req, res, next){
    if (Admin.isLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send("Unauthorized. The FBI has been notified.");
        console.log("Unauthorized access attempted - admins");
        //return false;
    }
};


module.exports = router;
