var returnRouter = function(io) {
    var express = require('express');
    var router = express.Router();

    var dbFolderLocation = "../../db/";
    var helpersFolderLocation = "../../helpers/";

    var mongoose = require('app/db/mongoose_connect.js');
    var SoireeHost = require('app/db/SoireeHost.js');
    var Soiree = require('app/db/Soiree.js');
    var SoireeReservation = require('app/db/SoireeReservation.js');
    var Business = require('app/db/Business.js');
    var User = require('app/db/User.js');
    var SpontaneousSoireeJob = require('app/db/SpontaneousSoireeJob.js');

    var DateHelper = require('app/helpers/DateHelper.js');
    var ResHelper = require('app/helpers/ResHelper.js');
    var Globals = require('app/helpers/Globals.js');

    var ErrorCodes = require('app/helpers/ErrorCodes.js');



    /* GET home page. */
    router.get('/', function (req, res) {
        res.render('index', {title: 'Express'});
    });

    router.get('/deleteSoirees', function (req, res) {
        Soiree.remove({}, function () {
            res.send("Done");
        });
    });

    router.get('/requestingSoirees', function (req, res, next) {
        User.verifyUser(req, res, next, function (user) {
            //number of unique requests per hour
            //base rate of 2 lunches, 2 dinners, 1 drinks, 2 blind dates per day
            //as soirees fill, create more
        }, function (err) {

        });
    });


    router.get('/createSoirees', function (req, res) {

        var numSoirees = req.query.numSoirees ? req.query.numSoirees : 5;

        var college = req.query.college ? req.query.college : 'NYU';
        var numReturned = 0;
        var numToReturn = numSoirees;
        var errs = [];

        for (var i = 0; i < numToReturn; i++){
            var st = Globals.soireeTypes[i % Globals.soireeTypes.length];
            console.log('creating ' + st + 'for college ' + college +' ...');

            Soiree.createSoireeWithType(st, college, function(){
                numReturned++;
                console.log(numReturned + ' returned.');
                if (numReturned >= numToReturn) res.send("OK with errs : " + errs);
            }, function(err){
                numReturned++;

                console.log(numReturned + ' returned with err ' + err);

                errs.push(err);
                if (numReturned >= numToReturn) res.send("OK with errs : " + errs);

            });
        }
        //Business.nextBusinessToHostSoiree(college, function (nextBusiness) {
        //    if (!nextBusiness) {
        //        return res.status('404').send("Error");
        //    }
        //
        //    var todaysDate = new Date();
        //
        //    var d = new Date(todaysDate.getTime() + (todaysDate.getMinutes() % 10) * 60 * 1000);
        //
        //    Soiree.createSoireeWithBusiness({
        //        soireeType: "Lunch",
        //        numUsersMax: 3,
        //        initialCharge: 250,
        //        date: d
        //    }, colleges, nextBusiness, function (soiree) {
        //        console.log("Saved soiree: " + soiree.soireeId);
        //    }, function (err) {
        //        console.log("error saving soiree " + err);
        //    });
        //
        //    var soireesCreated = [];
        //
        //    for (var i = 0; i < numSoirees; i++) {
        //
        //        var soireeTypes = Globals.soireeTypes();
        //
        //        var numDays = parseInt(Math.random() * 7);
        //        var numHours = parseInt(Math.random() * 24);
        //        var randSoireeTypeIndex = parseInt(Math.random() * soireeTypes.length - 1);
        //        var soireeType = soireeTypes[randSoireeTypeIndex];
        //        var randNumUsersMax = parseInt(Math.random() * 3 + 2);
        //        var initialCharges = [100, 200, 300, 400, 500];
        //        var randInitialChargeIndex = parseInt(Math.random() * initialCharges.length);
        //        var randInitialCharge = initialCharges[randInitialChargeIndex];
        //
        //        var roundedTime = todaysDate.getTime() - ((todaysDate.getMinutes() % 10) * 60 * 1000 - (todaysDate.getSeconds() * 1000));
        //        var date = new Date(roundedTime + (numDays * 24 * 60 * 60 * 1000) + (numHours * 60 * 60 * 1000));
        //
        //        var numReturned = 0;
        //
        //        Soiree.createSoireeWithBusiness({
        //            soireeType: soireeType,
        //            numUsersMax: randNumUsersMax,
        //            initialCharge: randInitialCharge,
        //            date: date
        //        }, colleges, nextBusiness, function (soiree) {
        //            soireesCreated.push(soiree.jsonObject());
        //            console.log("Saved soiree: " + soiree.soireeId);
        //
        //            numReturned++;
        //            if (numReturned == numSoirees) {
        //                res.json(soireesCreated);
        //            }
        //
        //        }, function (err) {
        //            res.status(404).send("Error");
        //            console.log("error saving soiree " + err);
        //        });
        //
        //        //Soiree.createLunch(date, nextBusiness, function(soiree){
        //        //    console.log("Saved soiree");
        //        //    res.send("OK");
        //        //}, function(err){
        //        //    console.log("error saving soiree " + err);
        //        //});
        //    }
        //}, function (err) {
        //    res.status(404).send("Error");
        //});


    });


//Coupon.find({ location : { $near : coors}}).skip(numCouponsAlreadyLoaded).limit(numResultsRequested).exec(function(err, data){

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
            if (!user.hasStripeCustomerId) {
                return ResHelper.sendError(res, ErrorCodes.MissingStripeCustomerId);
            }

            //var stripeToken = req.body.stripeToken;
            //
            //if (!stripeToken){
            //    return ResHelper.sendError(res, "MissingStripeToken");
            //}

            var soireeId = req.body.soireeId;
            Soiree.joinSoireeWithId(soireeId, user, function () {
                ResHelper.sendSuccess(res);
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

    router.post('/uploadSpontaneousSoiree', function (req, res, next) {

        User.verifyUser(req, res, next, function (user) {

            var startTime = req.body.startTime;
            var endTime = req.body.endTime;
            if (!startTime || !endTime) {
                return ResHelper.sendError(res, ErrorCodes.MissingData);
            }

            var availableTimes = {start: startTime, end: endTime};

            var ssJob = new SpontaneousSoireeJob({
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

    router.post('/soireeWithId', function (req, res) {

    });

    return router;
};

module.exports = returnRouter;
