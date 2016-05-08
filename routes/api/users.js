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

var ErrorCodes = require('app/helpers/ErrorCodes.js');


router.post('/findUser', function(req, res, next){
  console.log("in findUser...");

  var facebookAccessToken = req.body.access_token;

  if (facebookAccessToken) {// if facebook

    console.log("facebook access token found - finduser");

    passport.authenticate('facebook-token', function (err, user, info) {
      if (err) {
        console.log("User not found: " + err);
        return ResHelper.sendError(res, ErrorCodes.FacebookOAuthError)
      }
      else if (!user){
        res.json({});
      }
      else{
        user.checkDeviceUUIDAndDeviceToken(req, function () {
          sendUser(res, user);
        });

      }
    })(req, res, next);

  }
  else{ //else if userpw

  }

});

router.get('/findUser', function(req, res, next){

  var facebookAccessToken = req.query.access_token;

  if (facebookAccessToken) {// if facebook

    console.log("facebook access token found - finduser");

    passport.authenticate('facebook-token', function (err, user, info) {
      if (err) {
        console.log("User not found: " + err);
        return ResHelper.sendMessage(res, 404, "Error fetching user specified");
      }
      else if (!user){
        res.json({});
      }
      else{
        user.checkDeviceUUIDAndDeviceToken(req, function () {
          sendUser(res, user);
        });


        //remove stripe customer id
        //user.stripeCustomerId = null;

        //user.save(function(err){
        //  if (err) console.log("Error setting stripe customer id to null - findUser " + err);
        //});
        //}
        //else{
        //  sendUser(res, user);
        //}
      }
    })(req, res, next);

  }
  else{ //else if userpw

  }

});

router.post('/createUser', function(req, res, next){

  var facebookAccessToken = req.body.access_token;

  if (facebookAccessToken) {

    passport.authenticate('facebook-token', function (err, userFound, info) {

      if (err) {
        return ResHelper.sendError(res, ErrorCodes.UserVerificationError);
      }
      else if (!userFound){
        User.createUser(req, function(user){
            user.checkDeviceUUIDAndDeviceToken(req, function(){
              sendUser(res, user);
            });
        }, function(err){
          return ResHelper.sendMessage(res, ErrorCodes.UserCreationError);
        });
      }
      else{
        sendUser(res, userFound);
      }

    })(req, res, next);

  }

});


//router.post('/saveStripeToken', function(req, res, next){
//  User.verifyUser(req, res, next, function(user){
//    var stripeToken = req.body.stripeToken;
//    var last4Digits = req.body.creditCardLast4Digits;
//
//    user.stripeToken = stripeToken;
//    user.creditCardLast4Digits = last4Digits;
//
//    console.log("stripe token: " + stripeToken);
//
//    user.save(function(err){
//      if (err){
//        console.log("error saving token " + err);
//        ResHelper.sendMessage(res, 404, "error saving token");
//      }
//      else{
//        console.log("saved stripe token");
//        ResHelper.sendSuccess(res);
//      }
//    });
//  }, function(err){
//     ResHelper.sendMessage(res, 404, "error finding user");
//  });
//});

router.post('/fetchNotifications', function(req, res, next){
  User.verifyUser(req, res, next, function(user){
    user.deepPopulate("_notifications", function(err){
      if (err){
        console.log(err);
        ResHelper.sendError(res, ErrorCodes.MongoError);
      }
      else{
        var notifications = Notification.jsonArrayFromArray(user._notifications);
        res.json({"notifications" : notifications});
      }
    })
  });
});

router.post('/uploadNotificationsRead', function(req, res, next){
  User.verifyUser(req, res, next, function(user){
    var notificationsRead = req.body.notificationsRead;
    if (notificationsRead && notificationsRead.length > 0){
      Notification.find({"notificationId" : {"$in" : notificationsRead}, "_user" : user._id, "read" : false}).exec(function(err, notifications){
        if (err){
          console.log("Error fetching notifications read: " + err);
        }
        else if (notifications && notifications.length > 0){
          for (var i = 0; i < notifications.length; i++){
            var notification = notifications[i];
            notification.read = true;
            notification.save();
          }
        }
      });
    }
  });
});

router.post('/createStripeCustomerId', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    var stripeToken = req.body.stripeToken;
    if (!stripeToken) {
      return ResHelper.sendError(res, ErrorCodes.MissingData);
    }

    CreditCardHelper.createStripeCustomerId(stripeToken, user, function(customer){
      ResHelper.sendSuccess(res);
    }, function(err){
      ResHelper.sendError(res, ErrorCodes.Error);
    });

  });
    //var last4Digits = req.body.creditCardLast4Digits;

    //user.stripeToken = stripeToken;
    //user.creditCardLast4Digits = last4Digits;



    //console.log("stripe token: " + stripeToken);


});

router.post('/uploadDeviceToken', function(req, res, next){
  var deviceToken = req.body.deviceToken;
  if (!deviceToken){
    return ResHelper.sendError(res, ErrorCodes.MissingData);
  }

  User.verifyUser(req, res, next, function(user){
    user.deviceToken = deviceToken;

    user.save(function(err){
      if (err){
        console.log("Error saving user: " + err);
        ResHelper.sendError(res, ErrorCodes.ErrorSaving);
      }
      else{
        console.log("Uploaded device token for " + user.firstName + " : " + deviceToken);
        ResHelper.sendSuccess(res);
      }
    });

  }, function(err){
    ResHelper.sendError(res, ErrorCodes.UserVerificationError);
  });
});

router.post('/fetchUserSoirees', function(req, res, next){
  User.verifyUser(req, res, next, function(user){

      user.findSoireesAttendingAndAttended(function(soireesAttending, soireesAttended){

        //SoireeReservation.addReservationsForSoirees(soireesAttending, user, function(reservationsDict){

          var obj = {};
            var pastArr = [], presentArr = [], futureArr = [], cancelledArr = [];

            for (var i = 0; i < soireesAttended.length; i++){
              var soiree = soireesAttended[i];
              if (soiree.cancelled){
                cancelledArr.push(soiree.jsonObject(user));
              }
              else{
                pastArr.push(soiree.jsonObject(user));
              }
            }
            obj["past"] = pastArr;
            obj["cancelled"] = cancelledArr;

            for (var j = 0; j < soireesAttending.length; j++) {
              var soiree = soireesAttending[j];
              var jsonDict = soiree.jsonObject(user);
              if (!MongooseHelper.isObjectId(soiree._reservation)){
                jsonDict["reservation"] = soiree._reservation;
              }

              if (soiree.openToUsers) {
                presentArr.push(jsonDict);
              }
              else {
                futureArr.push(jsonDict);
              }
            }
            obj["present"] = presentArr;
            obj["future"] = futureArr;

           res.json(obj);
        });

      }, function(err){
        ResHelper.sendError(res, err);
      });

  //});
});









//router.get('/createUser', function(req, res){
//  var user = new User({
//    firstName : "Shady",
//    lastName : "Gabal",
//    gender : 'male'
//  });
//
//  user.save(function(err){
//    res.send("User saved with err : " + err);
//  });
//
//});


router.get('/testNotification', function(req, res){
  User.findOne({"firstName" : "Shady"}).exec(function(err, user) {
    if (err | !user){
      res.send("Error finding user: " + err);
    }
    else if (!user.deviceToken){
      res.send("User does not have device token");
    }
    else{
      PushNotificationHelper.sendPushNotification(user, "Testing...");
      res.send("Sent notification");
    }
  });
});

router.get('/postNotification', function(req, res){
  User.findOne({"firstName" : "Shady"}).populate("_notifications").exec(function(err, user) {
    if (err || !user)
      return res.send("Error : " + err);

    if (user._notifications.length == 0)
      return res.send("No notifications to show");

    var notification = user._notifications[0];
    PushNotificationHelper.sendNotification(user, notification);
    res.send("Sent");
  });

});

router.get('/removeNotifications', function(req, res){
  Notification.remove({}, function(err){
  });
  User.update({}, { $set: { _notifications : [] } }, function(err){
    res.send("Removed notifications with err: " + err);
  });

});



/* FUNCTIONS */

//function createUser(req, res){
//  var facebookUserId = req.query.facebookUserId;
//  var firstName = req.query.firstName;
//  var lastName = req.query.lastName;
//  var email = req.query.email;
//  var gender = req.query.gender;
//  var interestedIn = req.query.interestedIn;
//  var birthday = req.query.birthday;
//  var profilePictureUrl = req.query.profilePictureUrl;
//
//  var newUser = new User({
//    facebookUserId : facebookUserId,
//    firstName : firstName,
//    lastName : lastName,
//    email : email,
//    gender : gender,
//    interestedIn : interestedIn,
//    birthday : birthday,
//    profilePictureUrl : profilePictureUrl,
//    verified: false
//  });
//
//  newUser.save(function(err, user){
//    if (err) {
//      console.log("Error saving user: " + err);
//      return res.status('404').send("Error saving user");
//    }
//
//    sendUser(res, user, true);
//  });
//}

function sendUser(res, user, firstSignUp){
  if (!firstSignUp)
    firstSignUp = false;

    user.deepPopulate("_notifications", function(err){
      var obj = {
        "firstSignUp" : firstSignUp,
        "user" : user.jsonObject()
      };

      res.json(obj);
    });
}


module.exports = router;
