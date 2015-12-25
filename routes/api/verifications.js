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

var EmailHelpers = require(helpersFolderLocation + 'EmailHelpers.js');
var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');
var ResHelpers = require(helpersFolderLocation + 'ResHelpers.js');

router.post('/sendVerificationEmail', function(req, res){
    User.verifyUser(req.body.user, function(user){
        var email = req.body.email;

        if (EmailHelpers.validateEmail(email)){
            EmailHelpers.sendVerificationEmail(email, user, function(){
                ResHelpers.sendMessage(res, 200, "email sent");
            }, function(err){
                ResHelpers.sendMessage(res, 404, "error sending email");
            });
        }
        else{
            ResHelpers.sendMessage(res, 405, "email invalid");
        }

    }, function(err){
        ResHelpers.sendMessage(res, 404, "error finding user");
    });
});

router.get('/sendVerificationEmail', function(req, res){
        var email = req.query.email;

        if (EmailHelpers.validateEmail(email)){
            EmailHelpers.sendVerificationEmail(email, null, function(){
                ResHelpers.sendMessage(res, 200, "email sent");
            }, function(err){
                ResHelpers.sendMessage(res, 404, "error sending email");
            });
        }
        else{
            ResHelpers.sendMessage(res, 404, "email invalid");
        }
});

router.post('/verifyCode', function(req, res){
   User.verifyUser(req.body.user, function(user) {
       if (user.verifyCode(req.body.code) || user.verified) {
            user.verified = true;
           ResHelpers.sendMessage(res, 200, "user verified");
       }
       else{
           ResHelpers.sendMessage(res, 405, "incorrect code");
       }

   }, function(err){
       ResHelpers.sendMessage(res, 404, "error finding user");
   });
});

module.exports = router;
