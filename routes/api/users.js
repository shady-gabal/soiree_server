var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var fs = require('fs');
var multer = require('multer');

var passport = require('passport');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


//router.get('/findUser', function(req, res){
//  var facebookUserId = req.query.facebookUserId;
//  if (!facebookUserId){
//    return res.status('404').send("No facebook user id specified");
//  }
//
//  User.findOne({"facebookUserId" : facebookUserId}).exec(function(err, user){
//    if (err){
//      res.status('404').send("Error finding user with facebook id: " + fbUserId);
//    }
//    else{
//      if (!user){
//        //no user found
//        res.json({});
//      }
//      else{
//        sendUser(res, user);
//      }
//    }
//  });
//});


router.post('/findUser', function(req, res, next){
  console.log("in findUser...");

  var facebookAccessToken = req.body.access_token;

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
        return ResHelper.sendMessage(res, 404, "Error fetching user specified");
      }
      else if (!userFound){
        User.createUser(req, function(user){
            user.checkDeviceUUIDAndDeviceToken(req, function(){
              sendUser(res, user);
            });
        }, function(err){
          return ResHelper.sendMessage(res, 404, "Error creating user");
        });
      }
      else{
        sendUser(res, userFound);
      }

    })(req, res, next);

  }

});


router.get('/deleteUsers', function(req, res){
  User.remove({}, function(){
    res.send("Done");
  });
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

  });
});

router.post('/createStripeCustomerId', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    var stripeToken = req.body.stripeToken;
    if (!stripeToken) {
      return ResHelper.sendError(res, "MissingStripeToken");
    }

    CreditCardHelper.createStripeCustomerId(stripeToken, user, function(customer){
      ResHelper.sendSuccess(res);
    }, function(err){
      ResHelper.sendError(res, "Error");
    });



  }, function(err){
    ResHelper.sendError(res, "Error");
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

    user.deepPopulate("_soireesAttending._business _soireesAttended._business", function(err, newUser){

      if (err){
        return ResHelper.sendError(res, ErrorCodes.Error);
      }

      console.log("newUser: " + newUser);
      console.log("newUser._soireesAttending: " + newUser._soireesAttending);

      var obj = {};

      if (newUser.populated('_soireesAttended')){
        var arr = [];
        for (var i = 0; i < newUser._soireesAttended.length; i++){
          var soiree = newUser._soireesAttended[i];
          arr.push(soiree.jsonObject(newUser));
        }
        obj["past"] = arr;
      }

      if (newUser.populated('_soireesAttending')){
        var presentArr = [];
        var futureArr = [];
        for (var i = 0; i < newUser._soireesAttending.length; i++) {
          var soiree = newUser._soireesAttending[i];

          if (soiree.started) {
            presentArr.push(soiree.jsonObject(newUser));
          }
          else {
            futureArr.push(soiree.jsonObject(newUser));
          }

        }
        obj["present"] = presentArr;
        obj["future"] = futureArr;
      }

      res.json(obj);

    });

  });
});

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
