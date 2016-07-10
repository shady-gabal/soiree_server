/**
 * Created by shadygabal on 1/15/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var passport = require('passport');
var bcrypt = require('bcrypt');


var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var UserVerification = require('app/db/UserVerification.js');
var Admin = require('app/db/Admin.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');

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

router.get('/deleteVerifications', function(req, res){
    UserVerification.remove({}, function(err){
        res.send("Done with err: " + err);
    });
});

router.get('/', function(req, res){
    ResHelper.render(req, res, 'admins/idVerifications', {});

});

router.get('/fetchVerifications', function(req, res){
    var idsToIgnore = req.body.idsToIgnore;

    UserVerification.findUnverifiedVerifications(req.admin, idsToIgnore, function(verifications){
        res.json(verifications);
    }, function(err){
        console.log(err);
        res.status(404).send("Error");
    });
});

router.post('/accept', function(req, res){
    if (req.admin){
        var _id = req.body._id;

        if (_id){
            UserVerification.findOne({_id : _id}).deepPopulate("_user").exec(function(err, verification){
                if (err){
                    console.log(err);
                    res.status(404).send("Error");
                }
                else{
                    verification.accept(req.admin, function(){
                        res.send("OK");
                    }, function(err){
                        res.status(404).send(err);
                    });
                }
            });
        }
        else{
            res.status(404).send("Error");
        }
    }
    else{
        console.log('no req.admin');
        res.status(404).send("Error");
    }
});

router.post('/reject', function(req, res){
    if (req.admin){
        var _id = req.body._id;
        var reason = req.body.reason;

        if (_id){
            UserVerification.findOne({_id : _id}).deepPopulate("_user").exec(function(err, verification){
                if (err){
                    console.log(err);
                }
                else{
                    verification.reject(req.admin, reason, function(){
                        res.send("OK");
                    }, function(err){
                        res.status(404).send(err);
                    });
                }
            });
        }
        else{
            res.status(404).send("Missing reason");
        }

    }
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
