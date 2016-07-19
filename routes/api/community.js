 /**
 * Created by shadygabal on 12/3/15.
 */
var express = require('express');
var router = express.Router();

//var dbFolderLocation = "../../db/";
//var helpersFolderLocation = "../../helpers/";
//var assetsFolderLocation = "../../assets/";

var mongoose = require('app/db/mongoose_connect.js');
var fs = require('fs');
var path = require('path');
var multer = require('multer');


var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var UserVerification = require('app/db/UserVerification.js');
var CommunityPost = require('app/db/CommunityPost.js');
var CommunityComment = require('app/db/CommunityComment.js');

var DateHelper = require('app/helpers/DateHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');




/* Posts */

router.get('/posts', function(req, res){

        CommunityPost.find({}).exec(function(err, posts){
           if (err){
               res.status('404').send("Error finding posts");
           }
           else{
               var jsonArray = [];
               for (var i = 0;i < posts.length; i++){
                   jsonArray.push(posts[i].jsonObject());
               }
               res.json({"posts" : jsonArray});
           }
        });

});

router.post('/posts', function(req, res, next){
    /* Possible Error Codes:
        ErrorQuerying
        MissingData
     */
    if (!req.body.user){
        return ResHelper.sendError(res, ErrorCodes.MissingData);
    }

    User.authenticateUser(req, res, next, function(user){

        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;
        var coors = LocationHelper.createPoint({longitude : longitude, latitude: latitude});

        CommunityPost.findPosts(req, coors, user, function (posts) {

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


    }, function(err){
        ResHelper.sendError(res, err);
    });

});

router.post('/postsForUser', function(req, res, next){
    /* Possible Error Codes:
     ErrorQuerying
     */

    if (!req.body.userId){
        return ResHelper.sendError(res, ErrorCodes.MissingData);
    }

    User.authenticateUser(req, res, next, function(user){

        var userId = req.body.userId;

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

    }, function(err){
        ResHelper.sendError(res, err);
    });

});

router.post('/postWithPostId', function(req, res, next){
    User.authenticateUser(req, res, next, function(user){
       var postId = req.body.postId;
       if (!postId)
        return ResHelper.sendError(res, ErrorCodes.MissingData);

       CommunityPost.findPostWithId(postId, function(post){
           res.json({"post" : post.jsonObject(user, true)});
       }, function(err){
          ResHelper.sendError(res, err);
       });
   });
});


router.post('/createPost', function(req, res, next){
    console.log('creating post...');
    User.authenticateUser(req, res, next, function(user){
        if (!user.verified) {
            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);
        }

        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;

        var coors = LocationHelper.createPoint({longitude : longitude, latitude: latitude});

        var text = req.body.post;

        CommunityPost.createPost({
            "location" : coors,
            "text" : text
        }, user, function(post){
            res.json({"post" : post.jsonObject(user)});
        }, function(err){
            ResHelper.sendError(res, ErrorCodes.MongoError);
        });

    }, function(err){
        ResHelper.sendError(res, ErrorCodes.UserAuthenticationError);
    });
});

/* Comments */

router.post('/createComment', function(req, res, next){
    User.authenticateUser(req, res, next, function(user){
        if (!user.verified)
            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);

        var text = req.body.comment;
        var postId = req.body.postId;

        if (!text || !postId){
            return ResHelper.sendError(res, ErrorCodes.MissingData);
        }

        CommunityPost.addCommentToPostWithId(postId, {
            text : text
        }, user, function(newComment){
            res.json({"comment" : newComment.jsonObject(user)});
        }, function(err){
            ResHelper.sendError(res, err);
        });

    });
});



                                /* Voting */



router.post('/upvotePost', function(req, res, next){
   User.authenticateUser(req, res, next, function(user){
       if (!user.verified)
           return ResHelper.sendError(res, ErrorCodes.UserNotVerified);

       var postId = req.body.postId;
       if (!postId) return ResHelper.sendError(res, ErrorCodes.MissingData);

       CommunityPost.upvotePostWithId(postId, user, function(){
           ResHelper.sendSuccess(res);
       }, function(err){
          ResHelper.sendError(res, err);
       });
   });
});


router.post('/downvotePost', function(req, res, next){
    User.authenticateUser(req, res, next, function(user){
        if (!user.verified)
            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);

        var postId = req.body.postId;
        if (!postId) return ResHelper.sendError(res, ErrorCodes.MissingData);

        CommunityPost.downvotePostWithId(postId, user, function(){
            ResHelper.sendSuccess(res);
        }, function(err){
            ResHelper.sendError(res, err);
        });
    });
});


router.post('/upvoteComment', function(req, res, next){
    User.authenticateUser(req, res, next, function(user){
        if (!user.verified)
            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);

        var commentId = req.body.commentId;
        if (!commentId) return ResHelper.sendError(res, ErrorCodes.MissingData);

        CommunityComment.upvoteCommentWithId(commentId, user, function(){
            ResHelper.sendSuccess(res);
        }, function(err){
            ResHelper.sendError(res, err);
        });
    });
});

router.post('/downvoteComment', function(req, res, next){
    User.authenticateUser(req, res, next, function(user){
        if (!user.verified)
            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);

        var commentId = req.body.commentId;
        if (!commentId) return ResHelper.sendError(res, ErrorCodes.MissingData);

        CommunityComment.downvoteCommentWithId(commentId, user, function(){
            ResHelper.sendSuccess(res);
        }, function(err){
            ResHelper.sendError(res, err);
        });
    });
});


//router.post('/uploadEmotionForComment', function(req, res, next){
//    User.authenticateUser(req, res, next, function(user){
//        if (!user.verified)
//            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);
//
//        var vote = req.body.vote;
//        var commentId = req.body.commentId;
//
//        if (vote && commentId) {
//
//            CommunityComment.findOne({commentId: commentId}, function (err, comment) {
//                if (err || !comment) {
//                    ResHelper.sendMessage(res, 404, "error finding post: " + err);
//                }
//                else {
//
//                    comment.vote(user, vote, function (_comment) {
//                        ResHelper.sendSuccess(res);
//                    }, function (err) {
//                        console.log(err);
//                        ResHelper.sendError(res, ErrorCodes.ErrorQuerying);
//                    });
//
//                }
//            });
//        }
//    });
//});
//
//router.post('/uploadUnemotionForComment', function(req, res, next){
//    User.authenticateUser(req, res, next, function(user){
//        if (!user.verified)
//            return ResHelper.sendError(res, ErrorCodes.UserNotVerified);
//
//        var vote = req.body.vote;
//        var commentId = req.body.commentId;
//
//        if (vote && commentId) {
//
//            CommunityComment.findCommentWithId(commentId, function (comment) {
//                if (!comment) {
//                    ResHelper.sendMessage(res, ErrorCodes.InvalidInput);
//                }
//                else {
//                    comment.unemotion(user, vote, function (_comment) {
//                        ResHelper.sendSuccess(res);
//                    }, function (err) {
//                        console.log(err);
//                        ResHelper.sendError(res, ErrorCodes.ErrorQuerying);
//                    });
//
//                }
//            }, function(err){
//                ResHelper.sendError(res, err);
//            });
//        }
//    });
//
//});

router.post('/reportPost', function(req, res){
    var postId = req.body.postId;
    if (postId)
     ResHelper.sendSuccess(res);
    else ResHelper.sendError(res, ErrorCodes.MissingData);
});

router.post('/reportComment', function(req, res){
    var commentId = req.body.commentId;
    if (commentId)
        ResHelper.sendSuccess(res);
    else ResHelper.sendError(res, ErrorCodes.MissingData);
});


module.exports = router;
