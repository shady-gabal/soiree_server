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
var MongooseHelper = require(helpersFolderLocation + 'MongooseHelper.js');

var notificationTypes = ["commented", "liked"];

var notificationSchema = new Schema({
    notificationId: {type: String, index: true, default: shortid.generate}, /* IDs */
    read: {type: Boolean, default: false},
    users: [{ user: {type: ObjectId, ref:"User"}, name:String }],
    bodySuffix : {type: String, required: true},
    postId : {type: String},
    imageUrl : {type: String},
    notificationType : {type: String, enum: notificationTypes, required: true},
    _user : {type: ObjectId, ref: "User"},
    _id : {type: String}

});

notificationSchema.statics.notificationTypes = {
    "commented" : "commented",
    "liked" : "liked"
};

notificationSchema.statics.createCommentedOnPostNotifications = function(userThatCommented, upPost, comment){//up = un populated
    var Notification = this;
    console.log("createCommentedOnPostNotification()");

    //upComment.deepPopulate("_user", function(err, comment){
    //    if (err || !comment){
    //        console.log("Error fetching comment: " + err);
    //        return;
    //    }

        upPost.deepPopulate("_user _comments", function(err2, post){
            if (err2 || !post){
                console.log("Error fetching post: " + err2);
                return;
            }

            if (!MongooseHelper.isEqualPopulated(userThatCommented, post._user)){
                var body = userThatCommented.firstName + ' commented on your post "' + post.text + '"';
                Notification.sendCommunityNotification(body, post._user, comment._user, post, Notification.notificationTypes.commented);
                //Notification.createNotification(bodySuffix, post._user, post, "commented");
            }

            var commentUsersNotified = [];
            for (var i = 0; i < post._comments; i++){
                var postComment = post._comments[i];
                var commentUser = postComment._user;
                if (commentUsersNotified.indexOf(commentUser._id) == -1 && !MongooseHelper.isEqualPopulated(commentUser, userThatCommented) && !MongooseHelper.isEqualPopulated(commentUser, post._user)){
                //if (commentUsersNotified.indexOf(commentUser._id) == -1){
                    var body = userThatCommented.firstName + " commented on a post you commented on \"" + post.text + "\"";
                    Notification.sendCommunityNotification(body, commentUser, userThatCommented, post, Notification.notificationTypes.commented);
                    commentUsersNotified.push(MongooseHelper._id(commentUser));
                }
            }

        });
    //});
};

notificationSchema.statics.sendCommunityNotification = function(bodySuffix, notificationsUser, causingUser,  post, type){
    console.log("sendCommunityNotification()");
    var Notification = this;

    var idToMatch = generateId(causingUser, post.postId, type);
    console.log("idToMatch: " + idToMatch);
    var index = notificationsUser._notifications.indexOf(idToMatch);
    if (index != -1){
        console.log("index: " + index + " _notifications : " + notificationsUser._notifications);
        var notificationId = notificationsUser._notifications[index];

        Notification.findOne({_id : notificationId}).exec(function(err, notification){
            if (err){
                console.log("addToNotification() error fetching notification with id: " + notificationId);
            }
            else if (!notification){
                console.log("addToNotification() no notification found with id: " + notificationId);
                Notification.createNotification(bodySuffix, notificationsUser, causingUser, post, type);
            }
            else{
                var newUser = {user: causingUser._id, name: causingUser.firstName};

                var filterOutExistingUser = function (userObj){
                    return !userObj.user.equals(newUser.user);
                };

                notification.users = notification.users.filter(filterOutExistingUser);
                console.log("Filtered out notification.users to: " + notification.users);
                notification.users.push(newUser);
                notification.imageUrl = causingUser.profilePictureUrl;
                notification.read = false;
                notification.save();
                //PushNotificationHelper.sendPushNotification(notificationsUser, notification.body);
                PushNotificationHelper.sendNotification(notificationsUser, notification);

            }
        });
    }
    else{
       console.log("addToNotification(): idToMatch " + idToMatch + " was not found in notificationsUser._notifications: " + notificationsUser._notifications + ". Creating...");
        Notification.createNotification(bodySuffix, notificationsUser, causingUser, post, type);
    }

};

notificationSchema.statics.notificationsForUser = function(user, successCallback, errorCallback) {
};

notificationSchema.statics.jsonArrayFromArray = function(_notifications) {
    var notifications = [];
    for (var i = _notifications.length-1; i >= 0; i--){
        var notification = _notifications[i];
        notifications.push(notification.jsonObject());
    }
    return notifications;
};


notificationSchema.statics.createNotification = function(bodySuffix, notificationsUser, causingUser, post, type){
    var Notification = this;

    var newNotification = new Notification({
        bodySuffix : bodySuffix,
        _user : notificationsUser._id,
        postId : post.postId,
        imageUrl : causingUser.profilePictureUrl,
        notificationType : type,
        _id : generateId(causingUser, post.postId, type),
        users: [{user: causingUser._id, name: causingUser.firstName}]
    });

    notificationsUser._notifications.push(newNotification._id);
    newNotification.save();
    notificationsUser.save();
    //PushNotificationHelper.sendPushNotification(notificationsUser, newNotification.body);
    PushNotificationHelper.sendNotification(notificationsUser, newNotification);
    console.log("Created Notification: " + newNotification.body + " for: " + notificationsUser.firstName);
    return newNotification;
};

notificationSchema.methods.jsonObject = function(){
    var obj = {
        "read" : this.read,
        "body" : this.body,
        "notificationId" : this.notificationId,
        "imageUrl" : this.imageUrl,
        "notificationType" : this.notificationType,
        "postId" : this.postId
    };
    return obj;
};

notificationSchema.virtual('body').get(function () {

    var numNames = this.users.length;

    if (numNames == 0)
        return this.bodySuffix;

    var firstName = this.users[0].name;

    if (numNames === 1){
        return firstName + this.bodySuffix;
    }

    var secondName = this.users[1].name;

    if (numNames === 2){
        return firstName + " and " + secondName + this.bodySuffix;
    }

    numNames -= 2;
    var others = (numNames === 1 ? " other" : " others");

    return firstName + ", " + secondName + ", and " + numNames + others + this.bodySuffix;
});

function generateId(user, idSuffix, type){
    var id = user._id + "_" + idSuffix + "_" + type;
    console.log("Notification.generateId(): " + id);
    return id;
}

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
notificationSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('Notification', notificationSchema);