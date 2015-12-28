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
var CommunityComment = require('./CommunityComment.js');

/* Packages */
var shortid = require('shortid');

/* Helpers */
var DateHelpers = require('../helpers/DateHelpers.js');

/* Schema Specific */

var postSchema = new Schema({
        text : {type: String},
        _comments : [{type: ObjectId, ref:"CommunityComment"}],
        postId: {type: String, unique: true, default: shortid.generate},
        college: {type: String, enum: User.colleges()},
        location: {
            type: {type: String},
            coordinates: []
        },
        author: {type: String, required: [true, "No author specified"]}, /* Author */
        authorProfilePictureUrl : {type: String},
        _likes : [{type: ObjectId, ref:"User"}],
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
            errorCallback(err);
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

postSchema.statics.findNearestPosts = function(coors, user, successCallback, errorCallback){
    //this.find({ location: { $near : coors }, "college" : user.college }).deepPopulate("_comments._user _user").exec(function(err, posts){
    this.find({ location: { $near : coors }, "college" : user.college }).populate('_comments').exec(function(err, posts){
        if (err){
            errorCallback(err);
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

    newPost.save(function(err){
        if (err){
            errorCallback(err);
        }
        else{
            successCallback(post);
        }
    });
};


/* Methods */

postSchema.methods.like = function(user, successCallback, errorCallback){
    if (this._likes.indexOf(user._id) == -1){
        this._likes.push(user._id);
        this.save(function(err){
           if (err){
               errorCallback(err);
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
            errorCallback(err);
        }
        else{
            post._comments.push(savedComment._id);

            post.save(function(err){
                if (err){
                    errorCallback(err);
                }
                else{
                    successCallback(savedComment);
                }
            });
        }
    });
};

postSchema.methods.like = function(user, successCallback, errorCallback){
    this._likes.push(user._id);

    this.save(function(err){
        if (err){
            errorCallback(err);
        }
        else{
            successCallback(this);
        }
    });
};

postSchema.methods.unlike = function(user, successCallback, errorCallback){
    var index = this._likes.indexOf(user._id);
    if (index != -1) {
        this._likes.splice(index, 1);
    }

    this.save(function(err){
        if (err){
            errorCallback(err);
        }
        else{
            successCallback(this);
        }
    });
};

postSchema.methods.jsonObject = function(user){
    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;

    var commentsJsonArray = [];

    for (var i = 0; i < this._comments.length; i++){
        var comment = this._comments[i];

        if (!this.populated('_comments')) {
            console.log("WARNING: Did not populate _comments when retrieving CommunityPost");
        }

        var jsonObject = comment.jsonObject(user);
        commentsJsonArray.push(jsonObject);
    }


    var likedByUser = this._likes.indexOf(user._id) != -1;

    var obj = {
        "text" : this.text,
        "dateCreated": timeIntervalSince1970InSeconds,
        "postId": this.postId,
        "author": this.author,
        "authorProfilePictureUrl" : this.authorProfilePictureUrl,
        "college" : this._user.college,
        "numLikes" : this.numLikes,
        "numComments" : this.numComments,
        "comments" : commentsJsonArray,
        "likedByUser" : likedByUser
    };
    return obj;
};

/* Virtuals */

//postSchema.virtual('jsonObject').get(function () {
//    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;
//
//    var commentsJsonArray = [];
//
//    for (var i = 0; i < this._comments.length; i++){
//        var comment = this._comments[i];
//        var jsonObject = comment.jsonObject;
//
//        commentsJsonArray.push(jsonObject);
//    }
//
//    var obj = {
//        "text" : this.text,
//        "dateCreated": timeIntervalSince1970InSeconds,
//        "postId": this.postId,
//        "author": this.author,
//        "authorProfilePictureUrl" : this._user.profilePictureUrl,
//        "college" : this._user.college,
//        "numLikes" : this.numLikes,
//        "numComments" : this.numComments,
//        "comments" : commentsJsonArray
//    };
//    return obj;
//});

//postSchema.virtual('author').get(function () {
//    return this._user.fullName;
//});

postSchema.virtual('numLikes').get(function () {
    return this._likes.length;
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
