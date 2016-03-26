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
var helpersFolderLocation = "../helpers/";
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');
/* Schema Specific */

var commentSchema = new Schema({
    text : {type: String, required: true},
    commentId: {type: String, unique: true, default: shortid.generate},
    author: {type: String, required: [true, "No author specified"]}, /* Author */
    authorProfilePictureUrl : {type: String},
    _post: {type: ObjectId, ref:"CommunityPost"},
    _user : {type: ObjectId, ref:"User"},
    _loves : [{type: ObjectId, ref:"User"}],
    _laughs : [{type: ObjectId, ref:"User"}],
    _angries : [{type: ObjectId, ref:"User"}]
    //dateCreated : {type: Date, default: new Date()}
},
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

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

commentSchema.methods.emotion = function(user, emotion, successCallback, errorCallback) {
    if (emotion === "love"){
        this._loves.push(user._id);
    }
    else if (emotion === "laugh"){
        this._laughs.push(user._id);
    }
    else if (emotion === "cry"){
        this._cries.push(user._id);
    }
    else if (emotion === "angry"){
        this._angries.push(user._id);
    }

    this.save(function(err){
        if (err){
            errorCallback(ErrorCodes.ErrorSaving);
        }
        else{
            successCallback(this);
        }
    });

};

commentSchema.methods.unemotion = function(user, emotion, successCallback, errorCallback) {
    if (emotion === "love"){
        var index = this._loves.indexOf(user._id);
        if (index != -1) {
            this._loves.splice(index, 1);
        }

    }
    else if (emotion === "laugh"){
        var index = this._laughs.indexOf(user._id);
        if (index != -1) {
            this._laughs.splice(index, 1);
        }
    }
    else if (emotion === "cry"){
        var index = this._cries.indexOf(user._id);
        if (index != -1) {
            this._cries.splice(index, 1);
        }    }
    else if (emotion === "angry"){
        var index = this._angries.indexOf(user._id);
        if (index != -1) {
            this._angries.splice(index, 1);
        }
    }

    this.save(function(err){
        if (err){
            errorCallback(ErrorCodes.ErrorSaving);
        }
        else{
            successCallback(this);
        }
    });

};

commentSchema.methods.jsonObject = function(user){
    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000.;
    var likedByUser = this._likes.indexOf(user._id) != -1;

    var obj = {
        "text" : this.text,
        "dateCreated": timeIntervalSince1970InSeconds,
        "commentId": this.commentId,
        "author": this.author,
        "authorProfilePictureUrl" : this.authorProfilePictureUrl,
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


//commentSchema.virtual('author').get(function () {
//    return this._user.fullName;
//});
//
//commentSchema.virtual('authorProfilePictureUrl').get(function () {
//    return this._user.profilePictureUrl;
//});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
commentSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('CommunityComment', commentSchema);
