/**
 * Created by shadygabal on 1/18/16.
 */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

/* Other Models */
var User = require('./User.js');

/* Packages */
var shortid = require('shortid');

/* Helper */
var helpersFolderLocation = "../helpers/";
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');

var notificationSchema = new Schema({
    notificationId: {type: String, index: true, default: shortid.generate}, /* IDs */
    read: {type: Boolean, default: false},
    body : {type: String, required: true},
    _user : {type: ObjectId, ref: "User"}

});

notificationSchema.statics.createCommentedOnPostNotifications = function(upPost, upComment){//up = un populated
    var Notification = this;
    console.log("createCommentedOnPostNotification()");

    upComment.deepPopulate("_user", function(err, comment){
        if (err || !comment){
            console.log("Error fetching comment: " + err);
            return;
        }

        upPost.deepPopulate("_user _comments", function(err2, post){
            if (err2 || !post){
                console.log("Error fetching post: " + err2);
                return;
            }
            //if (!comment._user._id.equals(post._user._id)){
                var body = comment._user.firstName + " commented on your post \"" + post.text + "\".";
                Notification.createNotification(body, post._user);
            //}

            var commentUsersNotified = [];
            for (var i = 0; i < post._comments; i++){
                var postComment = post._comments[i];
                var commentUser = postComment._user;
                //if (commentUsersNotified.indexOf(commentUser._id) == -1 && !postComment._user._id.equals(commentUser._id)){
                if (commentUsersNotified.indexOf(commentUser._id) == -1){
                    var b = comment._user.firstName + " commented on a post you commented on \"" + post.text + "\".";
                    Notification.createNotification(postComment, commentUser);
                    commentUsersNotified.push(commentUser._id);
                }
            }

        });
    });
};

notificationSchema.statics.createNotification = function(body, user){
    var Notification = this;

    var newNotification = new Notification({
        body : body,
        _user : user
    });
    user._notifications.push(newNotification._id);
    newNotification.save();
    user.save();
    PushNotificationHelper.sendPushNotification(user, newNotification.body);
    console.log("Created Notification: " + body + " for: " + user.firstName);
    return newNotification;
};

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
notificationSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('Notification', notificationSchema);