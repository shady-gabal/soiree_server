var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var _ = require("underscore");
var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob.js');
var SoireeHost = require('app/db/SoireeHost.js');

var SoireeReservation = require('app/db/SoireeReservation.js');
var CommunityPost = require('app/db/CommunityPost.js');
var CommunityComment = require('app/db/CommunityComment.js');

var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');
var Notification = require('app/db/Notification.js');

var ResHelper = require('app/helpers/ResHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');
var Globals = require('app/helpers/Globals.js');


var _user;
var _testUsers = [];

findTestUsers();

function findTestUsers(){
    User.findTestUsers(function (testUsers) {
        if (!testUsers || testUsers.length == 0){
            console.log("Error finding testUsers : nothing returned");
            return;
        }

        _testUsers = testUsers;
        _user = testUsers[0];
        //if (!user.location){
        //    console.log("saving user location...");
        //    _user.location = LocationHelper.createPoint(44, 44);
        //    _user.save();
        //}

        //console.log("_user set");
    }, function (err) {
        console.log("Error setting test user: " + err);
    });
}


//io.on('connection', function(socket){
//    //socket.on('event name', function(data){});
//
//    //io.emit('event name', data);
//    console.log('a user connected to testing');
//    socket.on('disconnect', function(){
//        console.log('user disconnected from testing');
//    });
//});

router.get('/deleteTestUsers', function(req, res){
    User.remove({testUser : true}).exec(function(err){
        if (err){
            res.send("Error : " + err);
        }
        else{
            res.send("Done");
        }
    });
});


router.get('/createTestUsers', function(req, res){
    console.log('1');
    _testUsers = [];

    var firstNames = ["Robert", "Joe" , "Kevin", "Jill", "Michelle", "Naomi"];
    var lastNames = ["Jones", "Roberts", "Dominican", "Ellis", "Grimes", "Stevens"];
    var numReturned = 0;

    var numToCreate = 6;
    var profilePictureUrls = [
        "https://s-media-cache-ak0.pinimg.com/736x/d8/7f/0e/d87f0e1ecddb955a74f41e1032a8a136.jpg"        , "https://i.ytimg.com/vi/KY4IzMcjX3Y/maxresdefault.jpg"
        , "https://s-media-cache-ak0.pinimg.com/736x/2b/28/50/2b285083bff26dbc1b74a7473adf054d.jpg"
        , "https://pbs.twimg.com/media/CdzAPxRWIAACmIr.jpg"
        , "https://upload.wikimedia.org/wikipedia/commons/9/96/Carassius_wild_golden_fish_2013_G1.jpg"
        , "https://s-media-cache-ak0.pinimg.com/736x/94/92/f3/9492f3f78bbc088940efe012c1bc24ef.jpg"
    ];

    for (var i = 0; i < numToCreate; i++){
        var first = firstNames[i];
        var last = lastNames[i];

        var profilePictureUrl = profilePictureUrls[i % numToCreate];


        var user = new User({
            firstName : first,
            lastName : last,
            gender : i > 2 ? 'female' : 'male',
            location : LocationHelper.createPoint(45, 45),
            testUser : true,
            profilePictureUrl : profilePictureUrl,
            college : "NYU"
        });

        user.save(function(err, testUser){

            if (!err && testUser){
                if (_testUsers.length == 0)
                    _user = testUser;

                _testUsers.push(testUser);

                console.log("Test User " + testUser.firstName + " " + testUser.lastName + " saved with err : " + err);
            }
            else console.log("Error saving test user: " + err);

            numReturned++;
            console.log('saved num ' + numReturned);

            if (numReturned == numToCreate) {
                findTestUsers();
                res.send("Done");
            }
        });
    }


});

router.get('/shady', function(req, res){
   User.findOne({firstName : "Shady"}).exec(function(err, user){
       if (err) res.json({error: err});
       else res.json(user);
   });
});

router.get('/testCron', function(req, res, next){
   var pattern = req.query.pattern ? req.query.pattern : '* * * * * *';
    var CronJob = require('cron').CronJob;

    new CronJob(pattern, function() {
        console.log('You will see this message every second');
    }, null, true, 'America/New_York');

    res.send("OK");
});

router.post('/switchTestUser', function(req, res){
    var _id = req.body.userId;

    console.log(_id);
    for (var i = 0; i < _testUsers.length; i++){
       if (_testUsers[i]._id.equals(_id)){
           _user = _testUsers[i];
           return res.send("OK");
       }
   }
    res.status(404).send("Error");
});

router.get('/testSocket', function (req, res) {
    ResHelper.render(req, res, 'testing/testSocket', {});
});

router.get('/', function (req, res) {

    //console.log(_user);

    var cb = function(posts){
        if (!posts) posts=[];
        Soiree.find({}).limit(50).deepPopulate("_unchargedReservations._user _unchargedReservations._soiree _chargedReservations._user _chargedReservations._soiree _usersAttending _usersUncharged _business").sort('-soireeId').exec(function (err, soirees) {
        if (err) {
            console.log("Error finding soirees in testing/ : " + err);
            res.status(404).send("Error");
        }
        else {
            for (var i = 0; i < soirees.length; i++) {
                var soiree = soirees[i];
                soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);
            }
            var testUsers = _.without(_testUsers, _user);
            ResHelper.render(req, res, 'testing/index', {soirees: soirees, posts: posts, _testUsers : testUsers, _user : _user});
        }
    });
    };

    CommunityPost.findPosts(req, null, _user, function(posts){
        cb(posts);
    }, function(err){
        console.log(err);
        cb();
    }, {deepPopulate : "_comments"})

});

router.get('/deleteSoirees', function (req, res) {
    console.log('deleting soirees...');
    SoireeReservation.remove({}).exec(function (err) {
    });
    Soiree.remove({}).exec(function (err) {
        if (err) {
            res.status(404).send("Error");
        }
        else {
            res.send("OK");
        }
    });
});

router.get('/createSoirees', function (req, res) {
    console.log('creating soirees...');

        var numSoirees = req.query.numSoirees ? req.query.numSoirees : 10;

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

router.get('/createSoireeForSchedulerRun', function (req, res) {

    Soiree.createSoireeWithType("TEST", "NYU", function (soiree) {
        res.send("OK");
    }, function (err) {
        res.send("Error");
    });


});


router.post('/joinSoiree', function (req, res) {
    console.log("Joining soiree with id: " + req.body.soireeId + " ....");
    Soiree.joinSoireeWithId(req.body.soireeId, _user, function () {
        ResHelper.sendSuccess(res);
    }, function (err) {
        console.log("Error joining soiree: " + err);
        ResHelper.sendError(res, err);
    });
});



router.post('/createSoirees', function (req, res) {
    res.redirect('/api/soirees/createSoirees?numSoirees=10');
});

router.get('/startSoiree', function(req, res){
    var soireeId = req.query.soireeId;
    if (soireeId){
        Soiree.findOne({soireeId : soireeId}, function(err, soiree){
            if (err|| !soiree){
                console.log("error starting soiree: " + err);
                res.status(404).send("Error");
            }
            else{
                soiree.start();
                res.send("OK");
            }
        });
    }
});

router.get('/endSoiree', function(req, res){
    var soireeId = req.query.soireeId;
    if (soireeId){
        Soiree.findOne({soireeId : soireeId}, function(err, soiree){
            if (err|| !soiree){
                console.log("error starting soiree: " + err);
                res.status(404).send("Error");
            }
            else{
                soiree.end();
                res.send("OK");
            }
        });
    }
});

router.get('/remindSoiree', function(req, res){
    var soireeId = req.query.soireeId;
    if (soireeId){
        Soiree.findOne({soireeId : soireeId}, function(err, soiree){
            if (err|| !soiree){
                console.log("error starting soiree: " + err);
                res.status(404).send("Error");
            }
            else{
                soiree.remind();
                res.send("OK");
            }
        });
    }
});


router.get('/cancelSoiree', function(req, res){
    var soireeId = req.query.soireeId;
    if (soireeId){
        Soiree.findOne({soireeId : soireeId}, function(err, soiree){
            if (err|| !soiree){
                console.log("error starting soiree: " + err);
                res.status(404).send("Error");
            }
            else{
                soiree.cancel();
                res.send("OK");
            }
        });
    }
});

router.post('/createPost', function(req, res, next){
   CommunityPost.createPost({text: req.body.text}, _user, function(){
       res.send("OK");
   }, function(err){
     ResHelper.sendError(res, err);
   });
});

router.post('/createComment', function(req, res, next){
   CommunityPost.createCommentOnPost(req.body.postId, _user, {text:req.body.text}, function(comment){
       res.send("OK");
   }, function(err){
      ResHelper.sendError(res, ErrorCodes.Error);
   });
});

router.get('/globals', function(req, res){
    res.send('OK');
    console.log(Globals);
});

router.get('/deleteUsers', function(req, res){
    CommunityComment.remove({}, function(){
    });
    CommunityPost.remove({}, function(){
    });
    User.remove({}, function(){
        res.send("Done");
    });
});

router.get('/createUser', function(req, res){
    var user = new User({
        firstName : "Shady",
        lastName : "Gabal",
        gender : 'male'
    });

    user.save(function(err){
        res.send("User saved with err : " + err);
    });

});

router.get('/deletePosts', function(req, res){
    CommunityPost.remove({}, function(){
        res.send("Done");
    });
});

router.get('/deleteNotifications', function(req, res){
    Notification.remove({}, function(){
        res.send("Done");
    });
});

router.get('/deleteComments', function(req, res){
    CommunityComment.remove({}, function(){
        res.send("Done");
    });
});

router.get('/deleteSSJobs', function(req, res){
    ScheduledSoireeJob.remove({}, function(){
        res.send("Done");
    });
});

router.get('/deleteBusinesses', function(req, res){
   Business.remove({}, function(err){
       res.send("Completed with err: " + err);
   });
});

router.get('/deleteEverything', function(req, res){
    Business.remove({}, Globals.saveErrorCallback);
    ScheduledSoireeJob.remove({},Globals.saveErrorCallback);
    Notification.remove({},Globals.saveErrorCallback);
    CommunityComment.remove({},Globals.saveErrorCallback);
    CommunityPost.remove({},Globals.saveErrorCallback);
    User.remove({},Globals.saveErrorCallback);
    Soiree.remove({},Globals.saveErrorCallback);
    SoireeReservation.remove({},Globals.saveErrorCallback);
    SoireeHost.remove({},Globals.saveErrorCallback);

    res.send("Done");
});

router.get('/createBusiness', function(req, res){
    var longitude = 40.762755;
    var latitude = -73.882201;

    var business = new Business({
        businessType : "Bar",
        _soirees : [],
        businessName : "Paddy's Pub",
        cityArea: "SoHo",
        location : {type: "Point", coordinates:[longitude, latitude]},
        colleges : Globals.colleges,
        phoneNumber: 3472102276
    });

    Business.createBusiness(business, 'shady@wearethirdrail.com', '9701', function(_business){
        res.send("Created");
    }, function(err){
        res.send("Complete with err: " + err);

    });
});

router.get('/soireeCreator', function(req, res){
    var soireeCreator = require('../../scheduled/soireeCreator.js');
    soireeCreator();
    res.send("OK");
});

router.get('/deleteScheduledSoireeJobs', function(req, res) {
    ScheduledSoireeJob.remove({}, function(err){
       res.send("Completed with err: " + err);
    });
});

router.get('/createScheduledSoireeJobs', function(req, res){
    var numJobs = req.query.numJobs ? req.query.numJobs : 10;
    for (var i = 0; i < numJobs; i++){

        var randStartIndex = parseInt(Math.random() * (Globals.scheduledSoireeAvailableTimes.length - 5));
        var randEndIndex = parseInt(Math.random() * (Globals.scheduledSoireeAvailableTimes.length - randStartIndex)) + randStartIndex;

        var randCollegeIndex = parseInt(Math.random() * Globals.colleges.length);
        var college = Globals.colleges[randCollegeIndex];

        var startTime = Globals.scheduledSoireeAvailableTimes[randStartIndex];
        var endTime = Globals.scheduledSoireeAvailableTimes[randEndIndex];

        var startDate = DateHelper.dateFromTime(startTime);
        var endDate = DateHelper.dateFromTime(endTime);

        var randTypeIndex = parseInt(Math.random() * Globals.soireeTypes.length);
        var soireeType = Globals.soireeTypes[randTypeIndex];

        var ssJob = new ScheduledSoireeJob({
            availableTimes : {start:startDate, end: endDate},
            soireeType: soireeType,
            _user : _user._id,
            college : college
        });

        ssJob.save(function(err){
            console.log("saved ssjob with err: " + err);
        })

    }

    res.send("Done");

});

router.get('/performScheduledSoireeJobs', function(req, res){
   ScheduledSoireeJob.perform();
    res.send("OK");
});

router.get('/findNextSoiree', function(req, res, next){
    //var idsToIgnore = req.body.idsToIgnore;
    //if (!idsToIgnore) idsToIgnore = [];

    //User.verifyUser(req, res, next, function(user){
    var college = req.query.college;

    Soiree.findNextSoiree({college : college}, [], function(soiree){
        res.json(soiree.jsonObject());
    }, function(err){
        ResHelper.sendError(res, err);
    });
    //});

});


module.exports = router;