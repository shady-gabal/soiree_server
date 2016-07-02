var express = require('express');
var router = express.Router();


var mongoose = require('app/db/mongoose_connect.js');
var CAHGame = require('app/db/CAHGame.js');
//var SoireeHost = require('app/db/SoireeHost.js');
var Soiree = require('app/db/Soiree.js');
var SoireeReservation = require('app/db/SoireeReservation.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var Globals = require('app/helpers/Globals.js');

var ErrorCodes = require('app/helpers/ErrorCodes.js');
var io = Globals.io;


router.get('/deleteSoirees', function (req, res) {
    Soiree.remove({}, function () {
        res.send("Done");
    });
});

router.post('/soireesNear', function (req, res, next) {
    User.verifyUser(req, res, next, function (user) {

        Soiree.findSoirees(req, user, function (soirees) {
            var dataToSend = [];
            for (var i = 0; i < soirees.length; i++) {
                var soiree = soirees[i];
                dataToSend.push(soiree.jsonObject(user));
            }
            res.json(dataToSend);
        }, function (err) {
            console.log("Error finding soirees near you: " + err);
            ResHelper.sendError(res, ErrorCodes.NotFound);
        });

    });

});

router.get('/soireesNear', function (req, res) {
    //User.verifyUser(req.query.user, function(user){
    //
    //    var longitude = req.query.user.longitude;
    //    var latitude = req.query.user.latitude;
    //    var coors = {type: "Point", coordinates: [longitude, latitude]};

    Soiree.find({}).deepPopulate("_business _usersAttending").exec(function (err, soirees) {
        if (err) {
            console.log("Error finding soirees near you");
            res.type('text/plain');
            res.status('404').send("Error");
        }
        else {
            var dataToSend = [];
            for (var i = 0; i < soirees.length; i++) {
                var soiree = soirees[i];
                dataToSend.push(soiree.jsonObject());
            }
            res.json(dataToSend);
        }
    });

});

router.post('/joinSoiree', function (req, res, next) {
    User.verifyUser(req, res, next, function (user) {
        if (!user.chargeable) {
            return ResHelper.sendError(res, ErrorCodes.InvalidInput);
        }

        var soireeId = req.body.soireeId;
        Soiree.joinSoireeWithId(soireeId, user, function (soiree) {
            res.json(soiree.jsonObject(user));
        }, function (error) {
            ResHelper.sendError(res, error);
        });

    }, function (err) {
        ResHelper.sendError(res, ErrorCodes.UserVerificationError);
    });
});

router.post('/reservationForSoiree', function (req, res, next) {
    User.verifyUser(req, res, next, function (user) {
        var soireeId = req.body.soireeId;
        if (!soireeId) {
            return ResHelper.sendError(res, ErrorCodes.MissingData);
        }

        SoireeReservation.findOne({soireeId: soireeId, _user: user._id}).exec(function (err, reservation) {
            if (err) {
                console.log(err);
                ResHelper.sendError(res, ErrorCodes.ErrorQuerying);
            }
            else if (!reservation) {
                res.json({});
            }
            else {
                res.json(reservation.jsonObject());
            }
        });
    });
});

router.post('/uploadScheduledSoiree', function (req, res, next) {

    User.verifyUser(req, res, next, function (user) {

        var startTime = req.body.startTime;
        var endTime = req.body.endTime;
        if (!startTime || !endTime) {
            return ResHelper.sendError(res, ErrorCodes.MissingData);
        }

        var availableTimes = {start: startTime, end: endTime};

        var ssJob = new ScheduledSoireeJob({
            _user: user._id,
            availableTimes: availableTimes
        });

        ssJob.save(function (err) {
            if (err) {
                console.log("Error saving spontaneous soiree: " + err);
                return ResHelper.sendError(res, ErrorCodes.ErrorSaving);
            }
            ResHelper.sendSuccess(res);
        });

    });


});


router.post('/findNextSoiree', function(req, res, next){
    var idsToIgnore = req.body.idsToIgnore;
    if (!idsToIgnore) idsToIgnore = [];

    User.verifyUser(req, res, next, function(user){
        Soiree.findNextSoiree(user, idsToIgnore, function(soiree){
            if (!soiree){
                res.json({});
            }
            else{
                res.json({"soiree" : soiree.jsonObject(user)});
            }
        }, function(err){
            ResHelper.sendError(res, err);
        });
    });

});


router.post('/rosterForSoiree', function(req, res, next){
   User.verifyUser(req, res, next, function(user){

       var soireeId = req.body.soireeId;
       if (!soireeId){
           return ResHelper.sendError(res, ErrorCodes.MissingData);
       }

       Soiree.findBySoireeId(soireeId, function(soiree){

           soiree.deepPopulate("_usersAttending", function(err, _soiree){
               if (err){
                   console.log(err);
                   return ResHelper.sendError(res, err);
               }

               var roster = [];

               _soiree._usersAttending.forEach(function(userAttending){
                   if (userAttending.id !== user.id){
                       roster.push({name : userAttending.fullName, profilePictureUrl : userAttending.profilePictureUrl});
                   }
               });
               res.json({"roster" : roster});
           });

       }, function(err){
           console.log(err);
           ResHelper.sendError(res, err);
       });

   }, function(err){
      console.log(err);
       ResHelper.sendError(res, err);
   });
});


module.exports = router;
