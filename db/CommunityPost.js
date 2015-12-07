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
    _user : {type: ObjectId, ref:"User"},
    dateCreated : {type: Date, default: Date.now()}
});

postSchema.index({location: '2dsphere'});

/* Static Methods */

postSchema.statics.findNearestPosts = function(coors, callback){
    this.find({ location: { $near : coors }}).populate("_comments").populate("_user").exec(callback);
};

postSchema.statics.createPost = function(post, successCallback, errorCallback){
    var post = new this(post);
    post.save(function(err){
        if (err){
            errorCallback(err);
        }
        else{
            successCallback(post);
        }
    });
};

/* Virtuals */

postSchema.virtual('jsonObject').get(function () {
    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;

    var obj = {
        "dateCreated": timeIntervalSince1970InSeconds,
        "postId": this.postId,
        "author": this.author,
        "college" : this._user.college
    };
    return obj;
});

postSchema.virtual('author').get(function () {
    return this._user.fullName;
});

//postSchema.virtual('college').get(function () {
//    return this._user.college;
//});


module.exports = mongoose.model('CommunityPost', postSchema);
