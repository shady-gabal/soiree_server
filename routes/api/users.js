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

//router.get('/findUser', function(req, res, next){
//  var facebookAccessToken = req.query.access_token;
//
//  //if (!facebookUserId){
//  //  return ResHelper.sendMessage(res, 404, "No facebook user id specified");
//  //}
//  if (facebookAccessToken) {
//    console.log("facebook access token found - finduser");
//
//    passport.authenticate('facebook-token', function (err, userFound, info) {
//      if (err) {
//        console.log("User not found " + err);
//        return ResHelper.sendMessage(res, 404, "Error fetching user specified");
//      }
//      else if (!userFound){
//        sendUser(res, null);
//        //return ResHelper.sendMessage(res, 418, "No user found");
//      }
//      else{
//        sendUser(res, userFound);
//      }
//    })(req, res, next);
//  }
//  else{
//    res.json("not found");
//  }
//});

router.post('/createUser', function(req, res, next){

  var facebookAccessToken = req.body.access_token;

  if (facebookAccessToken) {

    passport.authenticate('facebook-token', function (err, userFound, info) {

      if (err) {
        return ResHelper.sendMessage(res, 404, "Error fetching user specified");
      }
      else if (!userFound){
        User.createUser(req, function(user){
            sendUser(res, user);
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


router.get('/verificationPhoto', function(req, res){
  var userId = req.query.userId;

  User.findOne({"userId" : userId}).exec(function(err, user){
    if (err){
      res.status('404').send("Error fetching user");
    }
    else if (!user){
      res.status('404').send("No user found");
    }
    else{
      UserVerification.findOne({_user : user._id}).exec(function(err, verification){
        if (err){
          res.status('404').send("Error finding verification");
        }
        else if (!verification){
          res.status('404').send("No verification found");
        }
        else{
          if (verification.image){
            res.send("verification has image");
          }
          else res.send("verification has no image");
        }
      });
    }

  });
});

router.get('/deleteVerifications', function(req, res){
  UserVerification.remove({}, function(){
    res.send("Done");
  });
});



router.post('/verifyWithPhoto', upload.single('photo'), function(req, res, next){
  User.verifyUser(req, res, next, function(user) {
    if (!user.verified) {
      UserVerification.remove({_user: user._id}, function(err){

        if (err) {
          return res.status('404').send("Error removing old copies");
        }

        var userVerification = new UserVerification({
          _user: user._id,
        });
        userVerification.image.data = req.file.buffer;
        userVerification.image.contentType = req.file.mimetype;

        userVerification.save(function (err) {
          if (err) {
            ResHelper.sendMessage(res, 404, "error saving photo");
          }
          else {
            ResHelper.sendMessage(res, 200, "saved photo");
          }
        });

      });
    }
    else{
      ResHelper.sendMessage(res, 200, "user already verified");
    }

  }, function(err){
     ResHelper.sendMessage(res, 404, "error finding user");
    });
});

router.post('/saveStripeToken', function(req, res, next){
  User.verifyUser(req, res, next, function(user){
    var stripeToken = req.body.stripeToken;
    var last4Digits = req.body.creditCardLast4Digits;

    user.stripeToken = stripeToken;
    user.creditCardLast4Digits = last4Digits;

    console.log("stripe token: " + stripeToken);

    user.save(function(err){
      if (err){
        console.log("error saving token " + err);
        ResHelper.sendMessage(res, 404, "error saving token");
      }
      else{
        console.log("saved stripe token");
        ResHelper.sendSuccess(res);
      }
    });
  }, function(err){
     ResHelper.sendMessage(res, 404, "error finding user");
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

router.post('/uploadDeviceToken', function(req, res){
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

router.get('/testNotification', function(req, res){
    User.findOne({"firstName" : "Shady"}).exec(function(err, user) {
      if (err | !user){
          res.send("Error finding user");
        }
      else if (!user.deviceToken){
        res.send("User does not have device token");
      }
      else{
        PushNotificationHelper.sendPushNotification(user, "Testing...");
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

  var obj = {
    "firstSignUp" : firstSignUp,
    "user" : user.jsonObject()
  };
  res.json(obj);
}


module.exports = router;
