var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var passport = require('passport');
var _ = require("underscore");
var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob.js');
var SoireeHost = require('app/db/SoireeHost.js');
var MovieSoiree = require('app/db/MovieSoiree.js');

var SoireeReservation = require('app/db/SoireeReservation.js');
var CommunityPost = require('app/db/CommunityPost.js');
var CommunityComment = require('app/db/CommunityComment.js');

var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var UserVerification = require('app/db/UserVerification.js');
var Admin = require('app/db/Admin.js');
var Notification = require('app/db/Notification.js');
var BetaSignupEmailList = require('app/db/BetaSignupEmailList.js');
var ConfirmationCodeslist = require('app/db/ConfirmationCodesList');

var EmailHelper = require('app/helpers/EmailHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var PushNotificationHelper = require('app/helpers/PushNotificationHelper.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');
var Globals = require('app/helpers/Globals.js');
var SubwayLine = require('app/db/SubwayLine');

var _user;
var _testUsers = [];

findTestUsers();

function findTestUsers(successCallback, errorCallback){
    User.findTestUsers(function (testUsers) {
        if (!testUsers || testUsers.length == 0){
            _testUsers = [];
            _user = null;
            if (successCallback){
                successCallback();
            }
            return;
        }

        _testUsers = testUsers;
        if (!_user)
         _user = testUsers[0];
        if (successCallback){
            successCallback();
        }

    }, function (err) {
        console.log("Error setting test user: " + err);
        if (errorCallback){
            errorCallback();
        }
    });
}

function refreshUsers(successCallback, errorCallback){
    findTestUsers(successCallback, errorCallback);
}




router.get('/deleteTestUsers', function(req, res){
    User.find({testUser : true}).exec(function(err, testUsers){
        if (err){
            res.send("Error : " + err);
        }
        else{
            testUsers.forEach(function(user){
               user.remove();
            });
            _testUsers = [];
            _user = null;
            res.send("Done");
        }
    });
});

router.get('/testConcurrency', function(req, res){
    var updateQuery = {$inc : {soireeScore : -200}};

    //DOESNT WORK
   User.findOneAndUpdate({_id : _user._id}, updateQuery, {new :true}, function(err, user){
     if (err) console.log(err);

       if(user.soireeScore >= 0){

           console.log("200 soiree score points redeemed");
           user.save(function(err){
               console.log(err);
           });
       }
       else{
           User.findOneAndUpdate({_id : _user._id}, {$inc : {soireeScore : 200}}, function(err){});
       }
   });

    User.findOneAndUpdate({_id : _user._id}, updateQuery, {new :true}, function(err, user){
        if (err) console.log(err);

        if(user.soireeScore >= 0){

            console.log("200 soiree score points redeemed");
            user.save(function(err){
                console.log(err);
            });
        }
        else{
            User.findOneAndUpdate({_id : _user._id}, {$inc : {soireeScore : 200}}, function(err){});
        }
    });

    res.send("K");
});

router.get("/testVirtual", function(req, res){
    _user.t = 50;
    res.send("OK");
});

router.get('/createTestUsers', function(req, res){
    _testUsers = [];

    var firstNames = ["Robert", "Joe" , "Kevin", "Bob", "Steve", "Matt", "Mark", "Roger", "Jack", "Scott", "Jill", "Michelle", "Naomi", "Anna", "Brianna", "Donna", "Rachel", "Felicia", "Lisa", "Marge"];
    var lastNames = ["Jones", "Roberts", "Dominican", "Ellis", "Grimes", "Stevens", "Gin", "Sonny", "Creed", "Rothenberg", "Mott", "Brooks", "LaBonne", "Josy", "Garcia", "Rodriguez", "Kant", "Camus", "Hemingway", "Dawkins"];
    var numReturned = 0;

    var numToCreate = firstNames.length;
    var profilePictureUrls = [
        "https://pbs.twimg.com/profile_images/743138182607175680/ZJzktgBk_400x400.jpg"
        , "http://i.telegraph.co.uk/multimedia/archive/03295/Tyrion_1_3295189b.jpg"
        , "http://i.ndtvimg.com/i/2015-09/ned-stark_640x480_71443426196.jpg"
        , "http://25.media.tumblr.com/tumblr_m4ns0bq5pO1r39huto1_500.png"
        , "https://pbs.twimg.com/profile_images/598885932897558529/zXxnsZvo.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/a/a5/European_Rabbit,_Lake_District,_UK_-_August_2011.jpg",
        "https://sausagemeat.files.wordpress.com/2013/03/ae5f8c649a13084f0fc10b7542dc1f22.gif",
   "https://s.yimg.com/lq/i/us/sp/v/nba/players_l/20101116/3704.jpg?x=46&y=60&xc=1&yc=1&wc=164&hc=215&q=100&sig=uL0nsT4C.6jmThsRqojbzg--",
        "https://pbs.twimg.com/media/CdN9xThWwAAiRqs.jpg",
        "https://pbs.twimg.com/profile_images/1261875044/bigfoot_400x400.jpg",
        "https://pbs.twimg.com/profile_images/708019215295352832/1aID2AgJ.jpg",
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSgpzmv7a5bgCi93btMPlnke32cnvTP3eoPXUS0a7besJKxSaBp",
        "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcR63YsDiUNWx-QqlxetGDmWUagcPkOz8fmJVRFgthegmFtqKRyh",     "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQzXiaOWlKX59usrkVHhphGbz0fuqyve5Dke5D5GB2IyBBHiV4",

        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSfqzDY8l8ArhWrPvJ26anOL6FQmFd-5a-TBeG0CTacPNPAL7hpQ",

        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTyu_4j48AjBUaigRuSuAlFASIdDL17nIQFIx8Tj75OAe_0M2UT9A",

        "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQYslwWJIGGYBEKcJbVRABtbimxKuwwb0pRZErNQrwI-E5wVQ7WcQ",

        "https://s.yimg.com/ny/api/res/1.2/HLVvlyNxert_quzFlaecNg--/YXBwaWQ9aGlnaGxhbmRlcjtzbT0xO3c9NjUwO2g9MzYw/http://media.zenfs.com/en-US/homerun/uproxx_tv_739/451fd9c32682d80e54471c8da7dcdef0",

        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcRjykgDekEHamoSFs1XJsoZoafOqNgpF1hv_bhsXJsjegs_3Dsl",
        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcT12J5Lyv1Sg51Hj-I8tR09veX0L-f2ukPZlhlSHtaCkt1oB7EE"
    ];

    for (var i = 0; i < numToCreate; i++){
        var birthday = i < 2 ? "06/25/1998" : "07/23/1990";

        var first = i < firstNames.length ? firstNames[i] : firstNames[i%firstNames.length];
        var last = i < lastNames.length ? lastNames[i] : lastNames[i%lastNames.length];

        var profilePictureUrl = profilePictureUrls[i % numToCreate];
        var email = first + last + i + "@experiencesoiree.com";

        var user = new User({
            firstName : first,
            lastName : last,
            gender : i >= firstNames.length/2 ? 'female' : 'male',
            location : LocationHelper.createPoint({longitude : 45, latitude: 45}),
            testUser : true,
            profilePictureUrl : profilePictureUrl,
            verified: true,
            email : email,
            birthday : birthday
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

router.get('/createVerifications', function(req, res, next){
   //User.authenticateUser(req, res, next, function(user){
    for (var i = 0; i < _testUsers.length; i++){
        var user = _testUsers[i];
        var verification = new UserVerification({
            _user : user._id
        });
        verification.save(function(err){
            console.log(err);
        });
    }
    res.send("Done");


    // }, function(err){
   //    console.log(err);
   //    res.send("Error");
   //});
});

router.get('/createPosts', function(req, res){
   var postsPerUser = 5;

    _testUsers.forEach(function(user){

        for (var k = 0; k < postsPerUser; k++){
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            CommunityPost.createPost({
                "location" : user.location,
                "text" : text
            }, user, function(post){
                console.log("created post " + post.jsonObject(user));
            }, function(err){
                console.log(err);
            });
        }

    });

    res.send("OK");
});

router.get('/refreshUsers', function(req, res){
   refreshUsers(function(){
       res.send("OK");
   }, function(){
       res.status(404).send("error");
   });
});

router.get('/findUser', function(req, res, next){

    var facebookAccessToken = req.query.facebook_access_token;
    var soireeAccessToken = req.query.soiree_access_token;

    req.body.user = req.query;
    req.body.user.username = "username";

    User.authenticateUser(req, res, next, function(user){
        res.json({user : user});
    }, function(err){
        ResHelper.sendError(res, err);
    });

});


router.get('/createUser', function(req, res, next){

    var facebookAccessToken = req.query.facebook_access_token;
    //var emailSignupData = req.query.emailSignupData;

    if (facebookAccessToken) {

        req.body.facebook_access_token = facebookAccessToken;

        passport.authenticate('facebook-token', function (err, userFound, info) {

            if (err) {
                return ResHelper.sendError(res, ErrorCodes.UserAuthenticationError);
            }
            else if (!userFound){
                User.createUserWithFacebook(req, function(user){
                    //user.checkDeviceUUIDAndDeviceToken(req, function(){
                    res.json({user : user});
                    //});
                }, function(err){
                    return ResHelper.sendMessage(res, ErrorCodes.UserCreationError);
                });
            }
            else{
                res.json({user : userFound});
            }

        })(req, res, next);

    }

    else{

        var emailSignupData = {
            firstName : 'Jon',
            lastName : 'Kevi',
            email : 'sff@gmail.com',
            password : '9701',
            gender : 'male',
            birthday : '05/25/1994',
            interestedIn : ['female']
        };

        req.body.emailSignupData = emailSignupData;

        User.createUserWithPassword(req, function(user, encodedAccessToken){
            res.json({user : user, soireeAccessToken : encodedAccessToken});
        }, function(err){
            ResHelper.sendError(res, err);
        });
    }

});

router.get('/testCron', function(req, res, next){
   var pattern = req.query.pattern ? req.query.pattern : '* * * * * *';
    var CronJob = require('cron').CronJob;

    new CronJob(pattern, function() {
        console.log('You will see this message every second');
    }, null, true, 'America/New_York');

    res.send("OK");
});

router.get('/deleteUser', function(req, res){
    var userId = req.query.userId ? req.query.userId : _user.userId;

   User.findOne({userId : userId}).exec(function(err, user){
      if (err)
          res.status(404).send("Error");
       else {
          for (var i = 0; i < _testUsers.length; i++) {
              if (_testUsers[i].userId === userId) {
                  _testUsers.splice(i, 1);
                  if(_testUsers.length > 0) {
                      _user = _testUsers[i - 1 >= 0 ? (i - 1) : i + 1];
                  }
                  else _user = null;
              }
          }

          user.remove(function (err) {
              if (err)
                  res.status(404).send("Error");
              res.send("OK");
          });
      }
   });
});


router.get('/testPopulation', function(req, res){
    //var _id = req.query.userId ? req.query.userId : _user._id;
    //console.log(_testUsers.indexOf(_user) || _testUsers.indexOf(_user._id));
    //console.log(_testUsers.indexOf(_user));
    //var _ids = [];
    //_testUsers.forEach(function(user){
    //   _ids.push(user._id);
    //});
    //console.log(_ids.indexOf(_user));
    //console.log(_ids.indexOf(_user._id));

    res.send("OK");

});

router.post('/switchTestUser', function(req, res){
    var _id = req.body.userId;

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

    refreshUsers(function(){

        var cb = function(posts){
            if (!posts) posts=[];
            Soiree.find({cancelled: false, ended: false}).limit(20).deepPopulate("_unchargedReservations._user _unchargedReservations._soiree _chargedReservations._user _chargedReservations._soiree _usersAttending _usersUncharged _business").sort('-soireeId').exec(function (err, soirees) {
                if (err) {
                    console.log("Error finding soirees in testing/ : " + err);
                    res.status(404).send("Error");
                }
                else {

                    Soiree.find({cancelled: true}).limit(20).deepPopulate("_unchargedReservations._user _unchargedReservations._soiree _chargedReservations._user _chargedReservations._soiree _usersAttending _usersUncharged _business").sort('-soireeId').exec(function (err, overSoirees) {
                        if (err) {
                            console.log("Error finding soirees in testing/ : " + err);
                            res.status(404).send("Error");
                        }
                        else{
                            for (var i = 0; i < soirees.length; i++) {
                                var soiree = soirees[i];
                                soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);

                            }
                            for (var i = 0; i < overSoirees.length; i++) {
                                var soiree = overSoirees[i];
                                soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);
                            }

                            var testUsers = _.without(_testUsers, _user);
                            ResHelper.render(req, res, 'testing/index', {soirees: [soirees, overSoirees], posts: posts, _testUsers : testUsers, _user : _user});
                        }
                    });
                }
            });
        };

        CommunityPost.find({}).deepPopulate("_comments").limit(50).exec(function(err, posts){
           if (err){
               console.log(err);
           }
            cb(posts);

        });

    }, function(){
        res.send("error");
    });


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

    var createSoirees = require('../../scheduled/soireeCreator.js');
    createSoirees();
    res.send("OK");

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

//router.get('/createMovieSoiree', function(req, res){
//    var MovieSoiree = require('app/db/MovieSoiree.js');
//    MovieSoiree.createMovieSoiree(function(soiree){
//        res.json({soiree : soiree});
//    }, function(err){
//       res.send(err);
//    });
//    //soiree.save(function(err){
//    //    if (err) console.log(err);
//    //    res.send("OK with err " + err);
//    //});
//});

router.get('/createDrinksSoiree', function(req, res){
    var DrinksSoiree = require('app/db/DrinksSoiree.js');
    DrinksSoiree.createDrinksSoiree(function(soiree){
        res.json({soiree : soiree});
    }, function(err){
        res.send(err);
    });
    //soiree.save(function(err){
    //    if (err) console.log(err);
    //    res.send("OK with err " + err);
    //});
});

router.get('/findMovieSoiree', function(req, res){
    var MovieSoiree = require('app/db/MovieSoiree.js');
    MovieSoiree.find({}).exec(function(err, soirees){
       if (err){
           console.log(err);
           res.send("Error: " + err);
       }
        else{
           res.json({"soirees" : soirees});
       }
    });
});

//router.post('/createSoirees', function (req, res) {
//    res.redirect('/api/soirees/createSoirees?numSoirees=10');
//});

router.get('/startSoiree', function(req, res){
    var soireeId = req.query.soireeId;
    if (soireeId){
        Soiree.findOne({soireeId : soireeId}, function(err, soiree){
            if (err|| !soiree){
                console.log("error starting soiree: " + err);
                res.status(404).send("Error");
            }
            else{
                //soiree.startIfPossible();
                soiree.start();
                res.send("OK");
            }
        });
    }
});

router.get('/openSoiree', function(req, res){
    var soireeId = req.query.soireeId;
    if (soireeId){
        Soiree.findOne({soireeId : soireeId}, function(err, soiree){
            if (err|| !soiree){
                console.log("error starting soiree: " + err);
                res.status(404).send("Error");
            }
            else{
                soiree.open();
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

router.get('/findSoirees', function(req, res){

    refreshUsers(function() {
        var cb = function(posts) {
            Soiree.findSoireesForUser(req, _user, function (soirees) {
                console.log("finished");
                for (var i = 0; i < soirees.length; i++) {
                    var soiree = soirees[i];
                    soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);
                }

                var testUsers = _.without(_testUsers, _user);
                ResHelper.render(req, res, 'testing/index', {
                    soirees: [soirees],
                    posts: posts,
                    _testUsers: testUsers,
                    _user: _user
                });

            }, function (err) {
                console.log('errored');
                res.send("error: " + err);
            });
        };

        CommunityPost.findPosts(req, null, _user, function(posts){
            cb(posts);
        }, function(err){
            console.log(err);
            cb();
        }, {deepPopulate : "_comments"});
    }, function(){
        res.status(404).send('error');
    });

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
        _user = null;
        _testUsers = [];
        res.send("Done");
    });
});

router.get('/deleteShady', function(req, res){
    User.findOne({"firstName" : "Shady"}, function(err, user){
        user.remove();
        res.send("Done");
    });
});

router.get('/deleteMohab', function(req, res){
    User.findOne({"firstName" : "Mohab"}, function(err, user){
        user.remove();
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
    Notification.remove({_user : _user._id}, function(){
        _user._notifications = [];
        _user._unseenNotifications = [];
        _user.save();
        res.send("Done");
    });
});

router.get('/deleteUnseenNotifications', function(req, res){
    Notification.remove({_user : _user._id, seen: false}, function(){
        _user._unseenNotifications = [];
        _user.save();
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

router.get('/deleteCommunity', function(req, res){
    CommunityComment.remove({},Globals.saveErrorCallback);
    CommunityPost.remove({},Globals.saveErrorCallback);
    res.send("Done. Check logs for errors");
});


//router.get('/deleteEverything', function(req, res){
//    Business.remove({}, Globals.saveErrorCallback);
//    ScheduledSoireeJob.remove({},Globals.saveErrorCallback);
//    Notification.remove({},Globals.saveErrorCallback);
//    CommunityComment.remove({},Globals.saveErrorCallback);
//    CommunityPost.remove({},Globals.saveErrorCallback);
//    User.remove({},Globals.saveErrorCallback);
//    Soiree.remove({},Globals.saveErrorCallback);
//    SoireeReservation.remove({},Globals.saveErrorCallback);
//    SoireeHost.remove({},Globals.saveErrorCallback);
//
//    _user = null;
//    _testUsers = [];
//    res.send("Done. Check logs for errors");
//});


router.get('/createBusiness', function(req, res, next){
    var email = "shady@wearethirdrail.com";
    var password = "9701";

    var longitude = 40.717946;
    var latitude = -74.013905;

    var businessObj = {
        businessType : "bar",
        businessName : "Paddy's Pub",
        phoneNumber : '3473965627',
        address : "345 Chambers Street, New York, NY 10282",
        generalArea: "Battery Park",
        location : {type: "Point", coordinates:[longitude, latitude]},
        email: email,
        soireeTypes : Globals.soireeTypes
    };


    Business.createBusiness(businessObj, email, password, req.admin, function(business){
        res.send("Created business: " + business);
    }, function(err){
        res.send("Error creating business: " + err);
    });
});


//router.get('/createAdmin', function(req, res){
//    var email = "shady@experiencesoiree.com";
//    var password = "9701";
//
//    var adminObj = {
//        firstName : "Shady",
//        lastName : "Gabal",
//        phoneNumber : "3472102276"
//    };
//
//    Admin.createAdmin(adminObj, email, password, function(admin){
//        res.send("Created admin: " + admin);
//    }, function(err){
//        res.send("Error creating admin: " + err);
//    });
//});

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

router.get('/allNotifications', function(req, res){
    //make copy
    var notifIds = [];
    for (var i = 0; i < _user._notifications.length; i++){
        notifIds.push(_user._notifications[i]._id);
    }
    //console.log(notifIds);
    Notification.find({ _id : {"$in" : notifIds}, _user : _user._id }).sort({"date" : "descending"}).exec(function(err, notifications){
        if (err){
            console.log(err);
            ResHelper.sendError(res, ErrorCodes.MongoError);
        }
        else{
            //console.log('Notifications loaded: ', notifications);
            var notificationsJson = Notification.jsonArrayFromArray(notifications);
            res.json({"notifications" : notificationsJson});
        }
    });
    //
    //});
});

router.get('/fetchNotifications', function(req, res){
    //User.authenticateUser(req, res, next, function(user){

    var idsToIgnore = req.body.idsToIgnore;

    //make copy
    var notifIds = [];
    for (var i = 0; i < _user._notifications.length; i++){
        notifIds.push(_user._notifications[i]._id);
    }

    if (idsToIgnore && idsToIgnore.length > 0) {
        //remove ids that youre supposed to ignore
        for (var i = 0; i < idsToIgnore.length; i++) {
            var index = notifIds.indexOf(idsToIgnore[i]);
            if (index !== -1) {
                notifIds.splice(index, 1);
            }
        }
    }

    //console.log(notifIds);
    Notification.find({ _id : {"$in" : notifIds}, _user : _user._id }).sort({"date" : "descending"}).limit(10).exec(function(err, notifications){
        if (err){
            console.log(err);
            ResHelper.sendError(res, ErrorCodes.MongoError);
        }
        else{
            //console.log('Notifications loaded: ', notifications);
            var notificationsJson = Notification.jsonArrayFromArray(notifications);
            res.json({"notifications" : notificationsJson});
        }
    });
    //
    //});
});

router.get('/fetchUnseenNotifications', function(req, res){
    //User.authenticateUser(req, res, next, function(user){

    //make copy
    var notifIds = [];
    for (var i = 0; i < _user._notifications.length; i++){
        notifIds.push(_user._notifications[i]._id);
    }

        Notification.find({_id : notifIds, seen: false, _user : _user._id}).sort({"date" : "descending"}).exec(function(err, notifications){
            if (err){
                console.log(err);
                ResHelper.sendError(res, ErrorCodes.MongoError);
            }
            else{
                var notificationsJson = Notification.jsonArrayFromArray(notifications);
                res.json({"notifications" : notificationsJson});
            }
        });

    //});
});

router.get('/addNotification', function(req, res){
    var num = req.query.numNotifications ? req.query.numNotifications : 1;

    for (var i = 0; i < num; i++){
        Notification.createTestNotification(_user);
    }
    res.send("OK");

});


router.get('/performScheduledSoireeJobs', function(req, res){
   ScheduledSoireeJob.perform();
    res.send("OK");
});

router.get('/findNextSoiree', function(req, res, next){

    Soiree.findNextSoiree({}, [], function(soiree){
        res.json(soiree.jsonObject());
    }, function(err){
        ResHelper.sendError(res, err);
    });
});


router.get('/createMovieSoirees', function(req, res){
    var MovieSoiree = require('app/db/MovieSoiree');

    var titles = ["Captain America: Civil War", "Batman v Superman: Dawn of Justice", "Suicide Squad"];
    var descs = ["Come watch Captain America: Civil War with a bunch of other amazing people! What better way to meet new people than by bonding over a great movie? You'll have a blast!", "", ""];

    for (var i = 0; i < titles.length; i++){
        MovieSoiree.createMovieSoiree({
            movieName : titles[i],
            soireeDescription : descs[i]
        }, function(soiree){
            console.log("Movie soiree created");
            //res.json({soiree : soiree.jsonObject(_user)});
        }, function(err){
            console.log("err creating movie soiree " + err);
        });
    }
    res.send("OK");
});

router.get('/testNotification', function(req, res){
    var deviceToken = req.query.deviceToken;
    if (deviceToken) {
        PushNotificationHelper.sendTestNotificationWithToken(deviceToken);
        res.send("OK");
    }
    else res.send("Must specify deviceToken");
});

router.get('/uploadNotificationsSeen', function(req, res, next){
    //User.authenticateUser(req, res, next, function(user){
    var user = _user;

        var notificationsSeen = req.query.notificationsSeen;
        console.log('notifications seen: ' + notificationsSeen);

        if (notificationsSeen) {

            Notification.find({"_id" :  notificationsSeen, "_user" : user._id, "seen" : false}).exec(function(err, notifications){
                if (err){
                    console.log("Error fetching notifications read: " + err);
                    ResHelper.sendError(res, ErrorCodes.Error);
                }
                else if (notifications && notifications.length > 0){

                    for (var i = 0; i < notifications.length; i++){
                        console.log('notifications fetched: ' + notifications);

                        var notification = notifications[i];
                        var index = user._unseenNotifications.indexOf(notification._id);
                        if (index !== -1){
                            user._unseenNotifications.splice(i,1);
                        }
                        if (!notification.seen){
                            notification.seen = true;
                            notification.save(Globals.saveErrorCallback);
                        }
                    }
                    user.save(Globals.saveErrorCallback);
                    ResHelper.sendSuccess(res);
                }
                else{
                    console.log('no notifications fetched');
                    ResHelper.sendSuccess(res);

                }
            });


        }

        else ResHelper.sendSuccess(res);
    //});
});

router.get('/betaPartySignupList', function(req, res){
    ConfirmationCodeslist.getList(function(list){
       ResHelper.render(req, res, "admins/betaPartySignupList", {list : list, numSignups : list.confirmationCodes.length});
    }, function(){
        res.send("Error");
    });
});

router.get('/betaSignupEmailList', function(req,res){
   BetaSignupEmailList.findList(function(list){
       var uniques = {};
       var numSignups = list.emails.length;

       var iosMales = [], iosFemales = [], androidMales = [], androidFemales = [];

       for (var i = 0; i < list.emails.length; i++){
           var curr = list.emails[i];
           var id = curr.email + "_" + curr.os + "_" + curr.gender;
           if (uniques[id]){
               numSignups--;
               continue;
           }
           uniques[id] = 1;

           if (curr.os === 'android'){
               if (curr.gender === 'male'){
                   androidMales.push(curr.email);
               }
               else if (curr.gender === 'female'){
                   androidFemales.push(curr.email);
               }
           }

           else if (curr.os === 'ios'){
               if (curr.gender === 'male'){
                   iosMales.push(curr.email);
               }
               else if (curr.gender === 'female'){
                   iosFemales.push(curr.email);
               }
           }
       }
       list.save(function(err){
           console.log(err);
       });

       ResHelper.render(req, res, "admins/betaSignupEmailList", {iosMales : iosMales, iosFemales : iosFemales, androidMales : androidMales, androidFemales : androidFemales, numSignups: numSignups});
   }, function(){res.send("Error")});
});

//router.get('/NotificaDupes', function(req, res){
//    BetaSignupEmailList.findList(function(list) {
//        list.emails = _.uniq(list.emails);
//        list.save(function(err){
//            res.send("Completed with err: " + err);
//        });
//    });
//});

router.get('/sendEmail', function(req, res){
    EmailHelper.sendVerificationEmail("shady@nyu.edu", _user, function(){
        res.send("OK");
    }, function(){
        res.send("Error");
    });
});


router.get('/soireeStarterStopper', function(req, res){
    var scheduledTasks = require('../../scheduled/soireeCreator.js');
    scheduledTasks();
    res.send("OK");
});

router.get('/createSubwayLines', function(req, res){
   var SubwayLine = require('app/db/SubwayLine');
    SubwayLine.fillInData();
    res.send("OK");
});

router.get('/fetchSubwayLines', function(req, res){
    var SubwayLine = require('app/db/SubwayLine');
    SubwayLine.find({}).exec(function(err, lines){
        res.json(lines);
    });
});

router.get('/postsForUser', function(req, res, next) {
    /* Possible Error Codes:
     ErrorQuerying
     */


    var userId = _user.userId;

    CommunityPost.findPostsForUserId(userId, function (posts) {

        var jsonArray = [];
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            var jsonObject = post.jsonObject(user);

            jsonArray.push(jsonObject);
        }
        res.json({"posts": jsonArray});

    }, function (err) {
        ResHelper.sendError(res, err);
    });


});

router.get('/subwayLine', function(req, res){
    SubwayLine.remove({}, function(){
        SubwayLine.fillInData(function(lines){
            res.json({lines : lines});
        }, function(error){
            res.json({error : error});
        });
    });

});

module.exports = router;