var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require('app/db/mongoose_connect.js');
var fs = require('fs');
var multer = require('multer');

var passport = require('passport');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require('app/db/Soiree.js');
var SoireeReservation = require('app/db/SoireeReservation.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var UserVerification = require('app/db/UserVerification.js');
var Notification = require('app/db/Notification.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var CreditCardHelper = require('app/helpers/CreditCardHelper.js');
var PushNotificationHelper = require('app/helpers/PushNotificationHelper.js');
var MongooseHelper = require('app/helpers/MongooseHelper.js');
var Globals = require('app/helpers/Globals.js');

var ErrorCodes = require('app/helpers/ErrorCodes.js');

router.post('/fetchNotifications', function(req, res, next){
    User.verifyUser(req, res, next, function(user){

        var idsToIgnore = req.body.idsToIgnore;

        //make copy
        var notifIds = user._notifications;
        if (idsToIgnore && idsToIgnore.length > 0) {
            //remove ids that youre supposed to ignore
            for (var i = 0; i < idsToIgnore.length; i++) {
                var index = notifIds.indexOf(idsToIgnore[i]);
                if (index !== -1) {
                    notifIds.splice(index, 1);
                }
            }
        }

        Notification.find({_id : {"$in" : notifIds}, _user : user._id}).sort({"date" : "descending"}).limit(10).exec(function(err, notifications){
            if (err){
                console.log(err);
                ResHelper.sendError(res, ErrorCodes.MongoError);
            }
            else{
                //console.log(notifications);
                //console.log('fetched ' + notifications.length + " notifications");
                var notificationsJson = Notification.jsonArrayFromArray(notifications);
                console.log('sending ' + notificationsJson.length + " notifications");
                res.json({"notifications" : notificationsJson});
            }
        });

    });
});

router.post('/fetchUnseenNotifications', function(req, res, next){
    User.verifyUser(req, res, next, function(user){

        Notification.find({_id : {"$in" : user._unseenNotifications}, seen: false, _user : user._id}).sort({"date" : "descending"}).exec(function(err, notifications){
            if (err){
                console.log(err);
                ResHelper.sendError(res, ErrorCodes.MongoError);
            }
            else{
                //console.log("fetched " + notifications.length + " unseen notifications");
                var notificationsJson = Notification.jsonArrayFromArray(notifications);
                console.log("sending " + notificationsJson.length + " unseen notifications");
                res.json({"notifications" : notificationsJson});
            }
        });

    });
});

router.post('/uploadNotificationsTapped', function(req, res, next){
    User.verifyUser(req, res, next, function(user){

        var notificationsTapped = req.body.notificationsTapped;
        console.log("notificationsTapped: " + notificationsTapped);
        if (notificationsTapped && notificationsTapped.length > 0) {

            Notification.find({"_id" : {"$in" : notificationsTapped}, "_user" : user._id, "tapped" : false}).exec(function(err, notifications){
                if (err){
                    console.log("Error fetching notifications read: " + err);
                    ResHelper.sendError(res, ErrorCodes.Error);
                }
                else if (notifications && notifications.length > 0){
                    console.log('notifications fetched: ' + notifications);

                    for (var i = 0; i < notifications.length; i++){

                        var notification = notifications[i];
                        notification.tapped = true;
                        notification.save(Globals.saveErrorCallback);
                    }
                    ResHelper.sendSuccess(res);
                }
                else{
                    console.log("no notifications fetched");
                    ResHelper.sendSuccess(res);
                }
            });

        }
        else ResHelper.sendSuccess(res);
    });
});

router.post('/uploadNotificationsSeen', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        var notificationsSeen = req.body.notificationsSeen;
        console.log('notifications seen: ' + notificationsSeen);

        if (notificationsSeen && notificationsSeen.length > 0) {

            Notification.find({"_id" : {"$in" : notificationsSeen}, "_user" : user._id, "seen" : false}).exec(function(err, notifications){
                if (err){
                    console.log("Error fetching notifications read: " + err);
                    ResHelper.sendError(res, ErrorCodes.Error);
                }
                else if (notifications && notifications.length > 0){

                    for (var i = 0; i < notifications.length; i++){
                        console.log('notifications fetched: ' + notifications);

                        var notification = notifications[i];
                        var index = user._unseenNotifications.indexOf(notification._id);
                        if (index !== -1){
                            user._unseenNotifications.splice(i,1);
                        }
                        if (!notification.seen){
                            notification.seen = true;
                            notification.save(Globals.saveErrorCallback);
                        }
                    }
                    user.save(Globals.saveErrorCallback);
                    ResHelper.sendSuccess(res);
                }
                else{
                    console.log('no notifications fetched');
                    ResHelper.sendSuccess(res);

                }
            });


        }

        else ResHelper.sendSuccess(res);
    });
});


module.exports = router;