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


router.post('/findUser', function(req, res, next){
  console.log("in findUser...");

  User.verifyUser(req, res, next, function(user){
    res.json({user : user});
  });

  //var facebookAccessToken = req.body.facebook_access_token;
  //var soireeAccessToken = req.body.soiree_access_token;
  //
  //if (facebookAccessToken) {// if facebook
  //
  //  console.log("facebook access token found - finduser");
  //
  //  passport.authenticate('facebook-token', function (err, user, info) {
  //    if (err) {
  //      console.log("User not found: " + err);
  //      return ResHelper.sendError(res, ErrorCodes.FacebookOAuthError)
  //    }
  //    else if (!user){
  //      res.json({});
  //    }
  //    else{
  //      //user.checkDeviceUUIDAndDeviceToken(req, function () {
  //        res.json({user : user});
  //      //});
  //
  //    }
  //  })(req, res, next);
  //
  //}
  //else
  //else{ //else if userpw
  //    ResHelper.sendError(res, ErrorCodes.Error);
  //}

});



router.post('/createUser', function(req, res, next){

  var facebookAccessToken = req.body.facebook_access_token;
  var emailSignupData = req.body.emailSignupData;

  if (facebookAccessToken) {

    passport.authenticate('facebook-token', function (err, userFound, info) {

      if (err) {
        return ResHelper.sendError(res, ErrorCodes.UserVerificationError);
      }
      else if (!userFound){
        User.createUserWithFacebook(req, function(user){
            //user.checkDeviceUUIDAndDeviceToken(req, function(){
              res.json({user : user});
            //});
        }, function(err){
          return ResHelper.sendMessage(res, ErrorCodes.UserCreationError);
        });
      }
      else{
        res.json({user : userFound});
      }

    })(req, res, next);

  }

  else if (emailSignupData){

      User.createUserWithPassword(req, function(user, encodedAccessToken){

          res.json({user : user, soireeAccessToken : encodedAccessToken});

      }, function(err, errorMessages){

        if (errorMessages){
          var errorMessage;

          if (typeof errorMessages === 'string'){
            errorMessage = errorMessages;
          }
          else if (Array.isArray(errorMessages) && errorMessages.length > 0){
            errorMessage = errorMessages[0];
          }

          console.log(errorMessages);
          console.log(errorMessage);
          errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1); //capitalize first letter of error message

          ResHelper.sendError(res, err, {errorMessage : errorMessage});
        }
        else return ResHelper.sendError(res, err);

      });
  }
  else{
    ResHelper.sendError(res, ErrorCodes.MissingData);
  }

});

router.post('/userFeedback', function(req, res){
  res.json({});
});

router.post('/login', function(req, res, next){
  User.login(req, res, next, function(user, encodedAccessToken){
    res.json({user : user, soireeAccessToken : encodedAccessToken});
  }, function(err, errorMessage){
      ResHelper.sendError(res, err, {errorMessage : errorMessage});
  });
});






/**** Payment ****/

//Braintree

router.post('/braintreeClientToken', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    CreditCardHelper.generateBrainTreeClientToken(function(clientToken){
      res.json({clientToken: clientToken});
    }, function(){
      ResHelper.sendError(res, ErrorCodes.Error);
    });

  });
});

router.post('/addBraintreeCard', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    var paymentNonce = req.body.paymentNonce;
    if (!paymentNonce) {
      return ResHelper.sendError(res, ErrorCodes.MissingData);
    }

    CreditCardHelper.addBraintreeCard(paymentNonce, user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      ResHelper.sendError(res, ErrorCodes.Error);
    });

  });
});

router.post('/removeBraintreeCard', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    CreditCardHelper.removeBraintreeCard(user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      ResHelper.sendError(res, ErrorCodes.Error);
    });

  });
});

//Stripe

router.post('/addStripeCard', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    var stripeToken = req.body.stripeToken;
    if (!stripeToken) {
      return ResHelper.sendError(res, ErrorCodes.MissingData);
    }

    CreditCardHelper.addStripeCard(stripeToken, user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      ResHelper.sendError(res, ErrorCodes.Error);
    });

  });
});

router.post('/removeStripeCard', function(req, res, next){

  User.verifyUser(req, res, next, function(user) {

    CreditCardHelper.removeStripeCard(user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      ResHelper.sendError(res, ErrorCodes.Error);
    });
  });

});


/**** User Specific Data ****/

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
                jsonDict["reservation"] = soiree._reservation.jsonObject();
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

      });

  //});
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

  });
});



/* FUNCTIONS */

module.exports = router;
