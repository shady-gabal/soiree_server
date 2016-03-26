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
var Notification = require('./Notification.js');
var CommunityComment = require('./CommunityComment.js');

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
var UserNotificationHelper = require(helpersFolderLocation + 'UserNotificationHelper.js');

/* Schema Specific */

var postSchema = new Schema({
        text : {type: String, required: true},
        _comments : [{type: ObjectId, ref:"CommunityComment"}],
        postId: {type: String, index: true, default: shortid.generate},
        college: {type: String, enum: User.colleges()},
        location: {
            type: {type: String},
            coordinates: []
        },
        author: {type: String, required: [true, "No author specified"]}, /* Author */
        authorProfilePictureUrl : {type: String},
        _loves : [{type: ObjectId, ref:"User"}],
        _laughs : [{type: ObjectId, ref:"User"}],
        _cries : [{type: ObjectId, ref:"User"}],
        _angries : [{type: ObjectId, ref:"User"}],

        _user : {type: ObjectId, ref:"User"}
},
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

postSchema.index({location: '2dsphere'});

/* Static Methods */

postSchema.statics.findPostWithId = function(postId, successCallback, errorCallback){
    //this.findOne({postId : postId }).deepPopulate('_comments._user _user').exec(function(err, post){
    this.findOne({postId : postId }).populate('_comments').exec(function(err, post){
        if (err || !post){
            errorCallback(ErrorCodes.PostNotFound);
        }
        else{
            successCallback(post);

            //post.deepPopulate('_comments._user', function(err, _post){
            //    if (err || !_post){
            //        errorCallback(err);
            //    }
            //    else{
            //    }
            //});

        }
    });
};

postSchema.statics.findPosts = function(req, coors, user, successCallback, errorCallback){
    //this.find({ location: { $near : coors }, "college" : user.college }).deepPopulate("_comments._user _user").exec(function(err, posts){
    var numPostsToFetch = 10;

    var idsToIgnore = req.body.currentPostsIds;

    //var constraints = { location: { $near : coors }, "college" : user.college };
    var constraints = {};

    if(user.college){
        constraints["college"] = user.college;
    }

    if (idsToIgnore && idsToIgnore.length > 0){
        console.log("Ignoring posts with ids in: " + idsToIgnore);
        constraints["postId"] = {'$nin' : idsToIgnore};
    }
    //else{
    //
    //}
    var query = this.find(constraints).sort('-dateCreated').limit(numPostsToFetch).populate('_comments');

    query.exec(function(err, posts){
        if (err){
            errorCallback(ErrorCodes.ErrorQuerying);
        }
        else{
            successCallback(posts);
        }
    });
};


postSchema.statics.createPost = function(post, user, successCallback, errorCallback){
    var newPost = new this(post);

    newPost._comments = [];
    newPost._user = user._id;
    newPost.college = user.college;
    newPost.author = user.fullName;
    newPost.authorProfilePictureUrl = user.profilePictureUrl;
    newPost.location = user.location;

    newPost.save(function(err){
        if (err){
            console.log(err);
            errorCallback(ErrorCodes.ErrorSaving);
        }
        else{
            successCallback(newPost);
        }
    });
};

postSchema.statics.createCommentOnPost = function(postId, user, comment, successCallback, errorCallback){
    this.findOne({postId : postId}, function(err, post){
        if (err || !post){
            console.log(err);
            errorCallback(ErrorCodes.ErrorQuerying);
            //ResHelper.sendMessage(res, 404, "error finding post: " + err);
        }
        else{
            post.addComment(comment, user, successCallback
                //res.json(_comment.jsonObject(user));
                //ResHelper.sendMessage(res, 200, "created comment");
            , errorCallback);
        }
    });
};

/* Methods */

postSchema.methods.like = function(user, successCallback, errorCallback){
    if (this._likes.indexOf(user._id) == -1){
        this._likes.push(user._id);
        this.save(function(err){
           if (err){
               errorCallback(ErrorCodes.ErrorSaving);
           }
           else{
               successCallback(this);
           }
        });
    }
    else{
        //user already liked
        errorCallback();
    }

};

postSchema.methods.addComment = function(comment, user, successCallback, errorCallback){
    var post = this;

    var newComment = new CommunityComment(comment);

    newComment._post = post._id;
    newComment._user = user._id;
    newComment.author = user.fullName;
    newComment.authorProfilePictureUrl = user.profilePictureUrl;

    newComment.save(function(err, savedComment){
        if (err){
            errorCallback(ErrorCodes.ErrorSaving);
        }
        else{
            post._comments.push(savedComment._id);

            post.save(function(err){
                if (err){
                    errorCallback(ErrorCodes.ErrorSaving);
                }
                else{
                    post.userAddedComment(user, savedComment);
                    successCallback(savedComment);
                }
            });
        }
    });
};

postSchema.methods.emotion = function(user, emotion, successCallback, errorCallback) {
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

postSchema.methods.unemotion = function(user, emotion, successCallback, errorCallback) {
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

//postSchema.methods.like = function(user, successCallback, errorCallback){
//    this._likes.push(user._id);
//
//    this.save(function(err){
//        if (err){
//            errorCallback(ErrorCodes.ErrorSaving);
//        }
//        else{
//            successCallback(this);
//        }
//    });
//};
//
//postSchema.methods.unlike = function(user, successCallback, errorCallback){
//    var index = this._likes.indexOf(user._id);
//    if (index != -1) {
//        this._likes.splice(index, 1);
//    }
//
//    this.save(function(err){
//        if (err){
//            errorCallback(ErrorCodes.ErrorSaving);
//        }
//        else{
//            successCallback(this);
//        }
//    });
//};

postSchema.methods.jsonObject = function(user, showComments){
    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;

    var commentsJsonArray = [];

    var lovedByUser = this._loves.indexOf(user._id) != -1;
    var laughedByUser = this._laughs.indexOf(user._id) != -1;
    //var criedByUser = this._cries.indexOf(user._id) != -1;
    var angriedByUser = this._angries.indexOf(user._id) != -1;

    var obj = {
        "text" : this.text,
        "dateCreated": timeIntervalSince1970InSeconds,
        "postId": this.postId,
        "author": this.author,
        "authorProfilePictureUrl" : this.authorProfilePictureUrl,
        "college" : this._user.college,
        "numLoves" : this.numLoves,
        "numLaughs" : this.numLaughs,
        "numCries" : this.numCries,
        "numAngries" : this.numAngries,
        "numComments" : this.numComments,
        "lovedByUser" : lovedByUser,
        "laughedByUser" : laughedByUser,
        //"criedByUser" : criedByUser,
        "angriedByUser" : angriedByUser

    };

    if (showComments) {
        for (var i = 0; i < this._comments.length; i++) {
            var comment = this._comments[i];

            if (!this.populated('_comments')) {
                console.log("WARNING: Did not populate _comments when retrieving CommunityPost");
            }

            var jsonObject = comment.jsonObject(user);
            commentsJsonArray.push(jsonObject);
        }
        obj["comments"] = commentsJsonArray;

    }

    return obj;
};

postSchema.methods.userAddedComment = function(user, comment){
    console.log("addedComment()");
    Notification.createCommentedOnPostNotifications(user, this, comment);
    //if (!this.populated("_user")){
    //    this.deepPopulate("_user", function(err, post){
    //        if (err || !post){ return; }
    //        else{
    //
    //        }
    //    });
    //}
};

/* Virtuals */


//postSchema.virtual('author').get(function () {
//    return this._user.fullName;
//});

postSchema.virtual('numLoves').get(function () {
    return this._loves.length;
});
postSchema.virtual('numLaughs').get(function () {
    return this._laughs.length;
});
postSchema.virtual('numCries').get(function () {
    return this._cries.length;
});
postSchema.virtual('numAngries').get(function () {
    return this._angries.length;
});
postSchema.virtual('numVotes').get(function () {
    return this._angries.length + this._cries.length + this._laughs.length + this._loves.length;
});

postSchema.virtual('numComments').get(function () {
    return this._comments.length;
});

//postSchema.virtual('college').get(function () {
//    return this._user.college;
//});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
postSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('CommunityPost', postSchema);
