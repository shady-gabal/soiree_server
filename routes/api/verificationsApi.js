/**
 * Created by shadygabal on 12/1/15.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require('app/db/mongoose_connect.js');
var fs = require('fs');

var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Image = require('app/db/Image.js');

var UserVerification = require('app/db/UserVerification.js');

var EmailHelper = require('app/helpers/EmailHelper.js');
var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');
var Globals = require('app/helpers/Globals.js');

var validator = require('validator');

//EMAIL VERIFICATION

router.get('/validateEmail', function(req, res){
   var email = req.query.email;
    if (email){
        if (validator.isEmail(email)){
            res.send("is email");
        }
        else res.send("is not email");

    }
    else res.send("No email specified");
});

router.post('/sendVerificationEmail', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var email = req.body.email;
        email = email.trim();

        console.log('verified user, sending email to ' + email + '...' );

        if (EmailHelper.validateEmail(email)){
            console.log('email is valid');

            user.email = email;
            user.save(Globals.saveErrorCallback);

            EmailHelper.sendVerificationEmail(email, user, function(){
                user.pendingVerification = true;
                ResHelper.sendSuccess(res);
            }, function(err){
                console.log(err);
                ResHelper.sendError(res, ErrorCodes.Error);
            });
        }
        else{
            console.log("email is not valid");
            ResHelper.sendError(res, ErrorCodes.InvalidInput);
        }

    }, function(err){
        console.log('error verifying user, not sending email... ' + err);

        ResHelper.sendMessage(res, ErrorCodes.UserVerificationError);
    });
});

router.get('/sendVerificationEmail', function(req, res){
    var email = req.query.email;
    email = email.trim();

    User.findTestUser(function(user){
        if (EmailHelper.validateEmail(email)){
            EmailHelper.sendVerificationEmail(email, user, function(){
                user.pendingVerification = true;
                user.save();

                ResHelper.sendSuccess(res);
            }, function(err){
                console.log(err);
                ResHelper.sendError(res, ErrorCodes.Error);
            });
        }
        else{
            ResHelper.sendError(res, ErrorCodes.Error);
        }
    }, function(err){
        res.send("unable to find test user");
    });

});

router.post('/verifyCode', function(req, res, next){
   User.verifyUser(req, res, next, function(user) {
       if (!req.body.code) ResHelper.sendError(ErrorCodes.MissingData);

       if (user.verifyCode(req.body.code.toUpperCase()) || user.verified) {
           user.verified = true;
           user.pendingVerification = false;
           user.save();
           ResHelper.sendSuccess(res);
       }
       else{
           ResHelper.sendError(res, ErrorCodes.InvalidInput);
       }

   });
});

router.post('/uploadCollege', function(req, res, next){
    User.verifyUser(req, res, next, function(user) {
        var college = req.body.college;
        if (!college) return ResHelper.sendError(res, ErrorCodes.MissingData);

        user.college = college;
        user.save(function(err){
            if (err){
                ResHelper.sendError(res, ErrorCodes.MongoError);
                console.log('error');
            }
            else ResHelper.sendSuccess(res);
        });
    });
});










//ID VERIFICATION

router.get('/verificationPhoto', function(req, res){
    var userId = req.query.userId;

    User.findOne({"userId" : userId}).exec(function(err, user){
        if (err){
            res.status('404').send("Error fetching user");
        }
        else if (!user){
            res.status('404').send("No user found");
        }
        else{
            UserVerification.findOne({_user : user._id}).exec(function(err, verification){
                if (err){
                    res.status('404').send("Error finding verification");
                }
                else if (!verification){
                    res.status('404').send("No verification found");
                }
                else{
                    if (verification.image){
                        res.send("verification has image");
                    }
                    else res.send("verification has no image");
                }
            });
        }

    });
});


//var cpUpload = ;
router.post('/uploadVerification', upload.fields([{ name: 'id', maxCount: 1 }, { name: 'self', maxCount: 1 }]) , function(req, res, next){
    User.verifyUser(req, res, next, function(user) {
        if (!user.verified) {

            var idImageFile = req.files["id"][0];
            var selfImageFile = req.files["self"][0];

            if (!idImageFile || !selfImageFile){
                console.log("Missing idImage or selfImage");
                return ResHelper.sendError(res, ErrorCodes.MissingData);
            }

            UserVerification.remove({_user: user._id}, function(err){

                //if (err) {
                //    return res.status('404').send("Error removing old copies");
                //}
                var notes = req.body.notes;
                var college = req.body.college;

                var userVerification = new UserVerification({
                    _user: user._id,
                    notes : notes,
                    college : college
                });

                var directory = "/images/";
                var fileNameSuffix = user.userId + "_" + Date.now();
                var selfFileName = "self_" + fileNameSuffix;
                var idFileName = "id_" + fileNameSuffix;


                var idImage = new Image({
                    data : idImageFile.buffer,
                    contentType : idImageFile.mimetype,
                    fileName : idFileName,
                    directory: directory,
                    path : Image.createPath(directory, idFileName),
                    adminsOnly: true,
                    _userVerification : userVerification._id
                });
                idImage.save(Globals.saveErrorCallback);

                var selfImage = new Image({
                    data : selfImageFile.buffer,
                    contentType : selfImageFile.mimetype,
                    fileName : selfFileName,
                    directory: directory,
                    path : Image.createPath(directory, selfFileName),
                    adminsOnly : true,
                    _userVerification : userVerification._id
                });
                selfImage.save(Globals.saveErrorCallback);

                userVerification._idImage = idImage._id;
                userVerification._selfImage = selfImage._id;

                userVerification.idImagePath = idImage.path;
                userVerification.selfImagePath = selfImage.path;

                userVerification.save(function (err, doc) {
                    if (err) {
                        console.log("Error saving user verification: " + err);
                        selfImage.remove();
                        idImage.remove();
                        ResHelper.sendError(res, ErrorCodes.ErrorSaving);
                    }
                    else {
                        console.log("doc.idimage " + doc.idImage);
                        console.log("saved userverification with idpath : " + doc.idImagePath + " selfpath : " + doc.selfImagePath);
                        ResHelper.sendSuccess(res);
                    }
                });

            });
        }
        else{
            ResHelper.sendSuccess(res);
        }

    });
});

module.exports = router;
