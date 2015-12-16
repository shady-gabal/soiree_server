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
    _communityPost: {type: ObjectId, ref:"CommunityPost"},
    commentId: {type: String, unique: true, default: shortid.generate},
    _user : {type: ObjectId, ref:"User"},
    dateCreated : {type: Date, default: Date.now()}
});

commentSchema.virtual('jsonObject').get(function () {
    var timeIntervalSince1970InSeconds = this.dateCreated.getTime() / 1000;

    var obj = {
        "text" : this.text,
        "dateCreated": timeIntervalSince1970InSeconds,
        "commentId": this.commentId,
        "author": this.author,
        "authorProfilePictureUrl" : this._user.profilePictureUrl
    };
    return obj;

});

commentSchema.virtual('author').get(function () {
    return this._user.fullName;
});

module.exports = mongoose.model('CommunityComment', commentSchema);
