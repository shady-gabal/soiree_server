/**
 * Created by shadygabal on 12/3/15.
 */

/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var User = require('./User.js');
var CommunityPost = require('./CommunityPost.js');

/* Packages */
var shortid = require('shortid');

/* Helpers */
var DateHelpers = require('../helpers/DateHelpers.js');

/* Schema Specific */

var commentSchema = new Schema({
    text : {type: String},
    _post: {type: ObjectId, ref:"CommunityPost"},
    _likes : [{type: ObjectId, ref:"User"}],
    commentId: {type: String, unique: true, default: shortid.generate},
    _user : {type: ObjectId, ref:"User"},
    dateCreated : {type: Date, default: new Date()}
});

//commentSchema.statics.createComment = function(comment, postId, user, successCallback, errorCallback){
//
//    var newComment = new this(comment);
//
//    mongoose.model('CommunityPost').findOne({postId : postId}, function(err, post){
//      if (err || !post){
//          errorCallback(err);
//      }
//      else{
//
//          newComment._post = post._id;
//          newComment._user = user._id;
//
//          newComment.save(function(err, savedComment){
//              if (err){
//                  errorCallback(err);
//              }
//              else{
//                  //save comment to post
//                  post._comments.push(savedComment._id);
//
//                  post.save(function(err){
//                      if (err){
//                         errorCallback(err);
//                      }
//                      else{
//                          successCallback(savedComment);
//                      }
//                  });
//              }
//          });
//      }
//   });
//
//};



//commentSchema.statics.createComment = function(comment, successCallback, errorCallback){
//
//    mongoose.model('CommunityPost').find({}).exec(function(err, post){
//        if (err || !post){
//            errorCallback(err);
//        }
//        else{
//            successCallback();
//            //var newComment = new this(comment);
//            //
//            //newComment._post = post._id;
//            //newComment._user = user._id;
//            //
//            //newComment.save(function(err, savedComment){
//            //    if (err){
//            //        errorCallback(err);
//            //    }
//            //    else{
//            //        //save comment to post
//            //        post._comments.push(savedComment._id);
//            //        post._comments.push(savedComment._id);
//            //
//            //        post.save(function(err){
//            //            if (err){
//            //                errorCallback(err);
//            //            }
//            //            else{
//            //                successCallback(savedComment);
//            //            }
//            //        });
//            //    }
//            //});
//        }
//    });
//
//};

commentSchema.methods.jsonObject = function(user){
    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;
    console.log("Comment: " + this.text + " date: " + timeIntervalSince1970InSeconds);
    var likedByUser = this._likes.indexOf(user._id) != -1;

    var obj = {
        "text" : this.text,
        "dateCreated": timeIntervalSince1970InSeconds,
        "commentId": this.commentId,
        "author": this.author,
        "authorProfilePictureUrl" : this._user.profilePictureUrl,
        "likedByUser" : likedByUser
    };
    return obj;
};

//commentSchema.virtual('jsonObject').get(function () {
//    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;
//
//    var obj = {
//        "text" : this.text,
//        "dateCreated": timeIntervalSince1970InSeconds,
//        "commentId": this.commentId,
//        "author": this.author,
//        "authorProfilePictureUrl" : this._user.profilePictureUrl
//    };
//    return obj;
//
//});


commentSchema.virtual('author').get(function () {
    return this._user.fullName;
});

module.exports = mongoose.model('CommunityComment', commentSchema);
