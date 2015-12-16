/**
 * Created by shadygabal on 12/3/15.
 */
var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";
var assetsFolderLocation = "../../assets/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var fs = require('fs');
var path = require('path');
var multer = require('multer');


var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');
var CommunityPost = require(dbFolderLocation + 'CommunityPost.js');

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');





router.get('/postsNear', function(req, res){
    //User.verifyUser(req.body.user, function(user){
        //var longitude = req.body.user.longitude;
        //var latitude = req.body.user.latitude;
        //var coors = {type: "Point", coordinates: [longitude, latitude]};

        CommunityPost.find({}).exec(function(err, posts){
           if (err){
               res.status('404').send("Error finding posts");
           }
           else{
               var jsonArray = [];
               for (var i = 0;i < posts.length; i++){
                   jsonArray.push(posts[i].jsonObject);
               }
               res.json({"posts" : jsonArray});
           }
        });

    //}, function(err){
    //    res.status('404').send("Error finding user");
    //});
});

router.post('/postsNear', function(req, res){
    User.verifyUser(req.body.user, function(user) {

        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;
        var coors = {type: "Point", coordinates: [longitude, latitude]};

        CommunityPost.findNearestPosts(coors, function (posts) {
            var jsonArray = [];
            for (var i = 0; i < posts.length; i++) {
                jsonArray.push(posts[i].jsonObject);
            }
            res.json({"posts": jsonArray});

        }, function (err) {
            res.status('404').send("Error finding posts");
        });


    }, function(err){
            res.status('404').send("Error finding user");
        });

    //}, function(err){
    //    res.status('404').send("Error finding user");
    //});
});


router.post('/createPost', function(req, res){
    User.verifyUser(req.body.user, function(user){
        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;
        var coors = {type: "Point", coordinates: [Number(longitude), Number(latitude)]};

        var text = req.body.post;

        CommunityPost.createPost({
            "location" : coors,
            "text" : text,
        }, user, function(post){
            res.status('200').send("Done");
        }, function(err){
            console.log("error creating post: " + err);
            res.status('404').send("Error creating post");
        });

    }, function(err){
        console.log("error finding user");
        res.status('404').send("Error finding user");
    });
});

module.exports = router;
