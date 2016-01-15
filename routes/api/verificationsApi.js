/**
 * Created by shadygabal on 12/1/15.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var fs = require('fs');
var multer = require('multer');


var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');

var EmailHelper = require(helpersFolderLocation + 'EmailHelper.js');
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');

router.post('/sendVerificationEmail', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var email = req.body.email;

        if (EmailHelper.validateEmail(email)){
            EmailHelper.sendVerificationEmail(email, user, function(){
                ResHelper.sendMessage(res, 200, "email sent");
            }, function(err){
                ResHelper.sendMessage(res, 404, "error sending email");
            });
        }
        else{
            ResHelper.sendMessage(res, 418, "email invalid");
        }

    }, function(err){
        ResHelper.sendMessage(res, 404, "error finding user");
    });
});

router.get('/sendVerificationEmail', function(req, res){
        var email = req.query.email;

        if (EmailHelper.validateEmail(email)){
            EmailHelper.sendVerificationEmail(email, null, function(){
                ResHelper.sendMessage(res, 200, "email sent");
            }, function(err){
                ResHelper.sendMessage(res, 404, "error sending email");
            });
        }
        else{
            ResHelper.sendMessage(res, 418, "email invalid");
        }
});

router.post('/verifyCode', function(req, res){
   User.verifyUser(req.body.user, function(user) {
       if (user.verifyCode(req.body.code) || user.verified) {
            user.verified = true;
           ResHelper.sendMessage(res, 200, "user verified");
       }
       else{
           ResHelper.sendMessage(res, 418, "incorrect code");
       }

   }, function(err){
       ResHelper.sendMessage(res, 404, "error finding user");
   });
});

module.exports = router;
