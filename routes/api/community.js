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
var CommunityComment = require(dbFolderLocation + 'CommunityComment.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');



/* Posts */

router.get('/deletePosts', function(req, res){
   CommunityPost.remove({}, function(){
       res.send("Done");
   });
});

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

router.post('/postsNear', function(req, res, next){
    User.verifyUser(req, res, next, function(user){

        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;
        var coors = LocationHelper.createPoint(longitude, latitude);

        CommunityPost.findPosts(req, coors, user, function (posts) {

            var jsonArray = [];
            for (var i = 0; i < posts.length; i++) {
                var post = posts[i];
                var jsonObject = post.jsonObject(user);

                jsonArray.push(jsonObject);
            }
            res.json({"posts": jsonArray});

        }, function (err) {
            ResHelper.sendMessage(res, 404, "error finding posts: " + err);
        });


    }, function(err){
        ResHelper.sendMessage(res, 404, "error finding user: " + err);
    });

    //}, function(err){
    //    res.status('404').send("Error finding user");
    //});
});

router.post('/postWithPostId', function(req, res, next){
   User.verifyUser(req, res, next, function(user){
       var postId = req.body.postId;
       if (!postId)
        return ResHelper.sendError(res, ErrorCodes.MissingData);

       CommunityPost.findPostWithId(postId, function(post){
           res.json(post.jsonObject(user, true));
       }, function(err){
          ResHelper.sendError(res, err);
       });
   });
});


router.post('/createPost', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;

        var coors = LocationHelper.createPoint(longitude, latitude);

        var text = req.body.post;

        CommunityPost.createPost({
            "location" : coors,
            "text" : text
        }, user, function(post){
            res.json(post.jsonObject(user));
        }, function(err){
            ResHelper.sendMessage(res, 404, "error creating post: " + err);
        });

    }, function(err){
        ResHelper.sendMessage(res, 404, "error finding user: " + err);
    });
});

router.post('/updatePost', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
       var postId = req.body.postId;
       if (!postId) {
           return ResHelper.sendMessage(res, 418, "no post id: " + err);
       }

       CommunityPost.findPostWithId(postId, function(post){
           res.json(post.jsonObject(user));
       }, function(err) {
           ResHelper.sendMessage(res, 404, "error finding post: " + err);
       });

   }, function(err){
       ResHelper.sendMessage(res, 404, "error finding user: " + err);
   });
});
/* Comments */

router.post('/createComment', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var text = req.body.comment;
        var postId = req.body.postId;

        console.log("Finding post with postId: " + postId);
        CommunityPost.findOne({postId : postId}, function(err, post){
            if (err || !post){
                ResHelper.sendMessage(res, 404, "error finding post: " + err);
            }
            else{
                post.addComment({
                    text : text
                }, user, function(comment){
                    res.json(comment.jsonObject(user));
                    //ResHelper.sendMessage(res, 200, "created comment");
                }, function(err){
                    ResHelper.sendError(res, err);
                });
            }
        });

    }, function(err){
        ResHelper.sendMessage(res, 404, "error finding user: " + err);
    });
});

/* Liking/Unliking */

router.post('/uploadEmotion', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var emotion = req.body.emotion;
        if (emotion) {

            var postId = req.body.postId;

            CommunityPost.findOne({postId: postId}, function (err, post) {
                if (err || !post) {
                    ResHelper.sendMessage(res, 404, "error finding post: " + err);
                }
                else {

                    post.emotion(user, emotion, function (post) {
                        ResHelper.sendMessage(res, 200, "successfully emotioned post");
                    }, function (err) {
                        ResHelper.sendMessage(res, 404, "error emotioning post: " + err);
                    });

                }
            });
        }
    });

});

router.post('/uploadUnemotion', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var emotion = req.body.emotion;
        if (emotion) {

            var postId = req.body.postId;

            CommunityPost.findOne({postId: postId}, function (err, post) {
                if (err || !post) {
                    ResHelper.sendMessage(res, 404, "error finding post: " + err);
                }
                else {

                    post.unemotion(user, emotion, function (post) {
                        ResHelper.sendMessage(res, 200, "successfully unemotioned post");
                    }, function (err) {
                        ResHelper.sendMessage(res, 404, "error unemotioning post: " + err);
                    });

                }
            });
        }
    });

});


router.post('/unlikePost', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var postId = req.body.postId;

        CommunityPost.findOne({postId : postId}, function(err, post){
            if (err || !post){
                ResHelper.sendMessage(res, 404, "error finding post: " + err);
            }
            else{

                post.unlike(user, function(post){
                    ResHelper.sendMessage(res, 200, "successfully unliked post");
                }, function(err){
                    ResHelper.sendMessage(res, 404, "error unliking post: " + err);
                });

            }
        });

    }, function(err){
        ResHelper.sendMessage(res, 404, "error finding user: " + err);
    });

});

//router.get('/createComment', function(req, res){
//   CommunityComment.createComment({
//       "text" : "this is a comment"
//   }, function(comment){
//       res.send("Successful");
//   }, function(err){
//       res.send("Error: " + err);
//   });
//});

module.exports = router;
