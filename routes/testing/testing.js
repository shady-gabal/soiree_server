var returnRouter = function(io) {

    var express = require('express');
    var router = express.Router();

    var dbFolderLocation = "../../db/";
    var helpersFolderLocation = "../../helpers/";

    var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
    var Soiree = require(dbFolderLocation + 'Soiree.js');
    var SoireeReservation = require(dbFolderLocation + 'SoireeReservation.js');
    var CommunityPost = require(dbFolderLocation + 'CommunityPost.js');
    var CommunityComment = require(dbFolderLocation + 'CommunityComment.js');

    var Business = require(dbFolderLocation + 'Business.js');
    var User = require(dbFolderLocation + 'User.js');
    var Admin = require(dbFolderLocation + 'Admin.js');

    var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
    var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
    var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
    var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


    var _user;

    User.findTestUser(function (user) {
        _user = user;
        //if (!user.location){
            console.log("saving user location...");
            _user.location = LocationHelper.createPoint(44, 44);
            _user.save();
        //}

        console.log("_user set");
    }, function (err) {
        console.log("Error setting test user: " + err);
    });

    //io.on('connection', function(socket){
    //    //socket.on('event name', function(data){});
    //
    //    //io.emit('event name', data);
    //    console.log('a user connected to testing');
    //    socket.on('disconnect', function(){
    //        console.log('user disconnected from testing');
    //    });
    //});

    router.get('/testSocket', function (req, res) {
        ResHelper.render(req, res, 'testing/testSocket', {});
    });

    router.get('/', function (req, res) {

        CommunityPost.findPosts(req, null, _user, function(posts){
            Soiree.find({}).limit(50).exec(function (err, soirees) {
                if (err) {
                    console.log("Error finding soirees in testing/ : " + err);
                    res.status(404).send("Error");
                }
                else {
                    for (var i = 0; i < soirees.length; i++) {
                        var soiree = soirees[i];
                        soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);
                    }
                    ResHelper.render(req, res, 'testing/index', {soirees: soirees, posts: posts});
                }
            });
        }, function(err){
            res.send("Error finding posts : " + err);
        })

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
        res.redirect('/api/soirees/createSoirees?numSoirees=10');
    });

    router.get('/createSoireeForSchedulerRun', function (req, res) {

        var today = new Date();
        var mins = today.getMinutes();
        var newMins = mins + (10 - (mins % 10));

        var newDate = new Date();
        newDate.setMinutes(newMins);

        Soiree.createSoiree({
            soireeType: "TEST",
            numUsersMax: 4,
            date: newDate,
            initialCharge: 500
        }, function (soiree) {
            res.send("OK");
        }, function (err) {
            res.send("Error");
        });


    });


    router.post('/joinSoiree', function (req, res) {
        console.log("Joining soiree with id: " + req.body.soireeId + " ....");
        Soiree.joinSoireeWithId(req.body.soireeId, _user, function () {
            res.send("OK");
        }, function (err) {
            console.log("Error joining soiree: " + err);
            res.status(404).send("Error");
        });
    });

    router.post('/createSoirees', function (req, res) {
        res.redirect('/api/soirees/createSoirees?numSoirees=10');
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

    return router;
};

module.exports = returnRouter;