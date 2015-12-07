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
    _user : {type: ObjectId, ref:"User"},
    dateCreated : {type: Date, default: Date.now()}
});


module.exports = mongoose.model('CommunityComment', commentSchema);
