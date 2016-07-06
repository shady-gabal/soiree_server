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

var db = require('app/db/db');

//var DateHelper = require('app/helpers/DateHelper.js');
//var ResHelper = require('app/helpers/ResHelper.js');
//var LocationHelper = require('app/helpers/LocationHelper.js');
//var CreditCardHelper = require('app/helpers/CreditCardHelper.js');
//var PushNotificationHelper = require('app/helpers/PushNotificationHelper.js');
//var MongooseHelper = require('app/helpers/MongooseHelper.js');
//var Globals = require('app/helpers/Globals.js');
var Image = require('app/db/Image');
//var IDGeneratorHelper = require('app/helpers/IDGeneratorHelper.js');
//
//var ErrorCodes = require('app/helpers/ErrorCodes.js');

var h = require('app/helpers/h');


router.post('/findUser', function(req, res, next){
  console.log("in findUser...");

  User.verifyUser(req, res, next, function(user){
    res.json({user : user.jsonObject()});
  });

});



router.post('/createUser', function(req, res, next){
  
  var facebookAccessToken = req.body.facebook_access_token;
  var emailSignupData = req.body.emailSignupData;
  

  if (facebookAccessToken) {

    passport.authenticate('facebook-token', function (err, userFound, info) {

      if (err) {
        return h.ResHelper.sendError(res, h.ErrorCodes.UserVerificationError);
      }
      else if (!userFound){
        User.createUserWithFacebook(req, function(user){
            //user.checkDeviceUUIDAndDeviceToken(req, function(){
              res.json({user : user.jsonObject(), firstSignUp: true});
            //});
        }, function(err, errorMessage){
          return h.ResHelper.sendError(res, h.ErrorCodes.UserCreationError, {errorMessage : errorMessage});
        });
      }
      else{
        res.json({user : userFound.jsonObject()});
      }

    })(req, res, next);

  }

  else if (emailSignupData){

      User.createUserWithPassword(req, function(user, encodedAccessToken){

          res.json({user : user, soireeAccessToken : encodedAccessToken});

      }, function(err, errorMessage){

        if (errorMessage){
          h.ResHelper.sendError(res, err, {errorMessage : errorMessage});
        }
        else return h.ResHelper.sendError(res, err);

      });
  }
  else{
    h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
  }

});

router.post('/userFeedback', function(req, res){
  res.json({});
});

router.post('/login', function(req, res, next){
  User.login(req, res, next, function(user, encodedAccessToken){
    res.json({user : user, soireeAccessToken : encodedAccessToken});
  }, function(err, errorMessage){
    h.ResHelper.sendError(res, err, {errorMessage : errorMessage});
  });
});

router.post('/changeProfilePictureUrl', function(req, res, next){
  var newProfilePictureUrl = req.body.profilePictureUrl;
  if (!newProfilePictureUrl) return h.ResHelper.sendError(res, ErrorCodes.InvalidInput);

  User.verifyUser(req, res, next, function(user){
    user.profilePictureUrl = newProfilePictureUrl;
    user.save(function(err){
      if (err){
        return h.ResHelper.sendError(res, h.ErrorCodes.MongoError);
      }
      else h.ResHelper.sendSuccess(res);
    });
  });
});

router.post('/uploadProfilePicture', upload.fields([{ name: 'profilePicture', maxCount: 1 }]) , function(req, res, next){

  User.verifyUser(req, res, next, function(user){

    Image.remove({_user : user._id}).exec(function(err){
      if (err){
        return h.ResHelper.sendError(res, h.ErrorCodes.MongoError);
      }
      else{
        var photo = req.files["profilePicture"][0];
        if (!photo){
          return h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
        }

        var directory = "/userProfilePictures/";
        var fileName = "profile_" + h.IDGeneratorHelper.generateId(15, {addLowerCase: true}) + "_" + Date.now();

        var image = new Image({
          data : photo.buffer,
          contentType : photo.mimetype,
          fileName : fileName,
          directory: directory,
          adminsOnly: false,
          _user : user._id
        });

        image.save(function(err2){
          if (err2){
            h.ResHelper.sendError(res, h.ErrorCodes.MongoError);
          }
          else{
            user.profilePictureUrl = image.url;
            user.save(function(err3){
              if (err3){
                console.log(err3);
                h.ResHelper.sendError(res, h.ErrorCodes.mongoError);
              }
              else res.json({"profilePictureUrl" : image.url});
              console.log(image.url);
            });

          }
        });
      }

    });

  });

});



/**** Payment ****/

//Braintree

router.post('/braintreeClientToken', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    h.CreditCardHelper.generateBrainTreeClientToken(function(clientToken){
      res.json({clientToken: clientToken});
    }, function(){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });

  });
});

router.post('/addBraintreeCard', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    var paymentNonce = req.body.paymentNonce;
    if (!paymentNonce) {
      return h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
    }

    h.CreditCardHelper.addBraintreeCard(paymentNonce, user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });

  });
});

router.post('/removeBraintreeCard', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    h.CreditCardHelper.removeBraintreeCard(user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });

  });
});

//Stripe

router.post('/addStripeCard', function(req, res, next){
  User.verifyUser(req, res, next, function(user) {

    var stripeToken = req.body.stripeToken;
    if (!stripeToken) {
      return h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
    }

    h.CreditCardHelper.addStripeCard(stripeToken, user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });

  });
});

router.post('/removeStripeCard', function(req, res, next){

  User.verifyUser(req, res, next, function(user) {

    h.CreditCardHelper.removeStripeCard(user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
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
              if (!h.MongooseHelper.isObjectId(soiree._reservation)){
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
    return h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
  }

  User.verifyUser(req, res, next, function(user){
    user.deviceToken = deviceToken;

    user.save(function(err){
      if (err){
        console.log("Error saving user: " + err);
        h.ResHelper.sendError(res, h.ErrorCodes.ErrorSaving);
      }
      else{
        console.log("Uploaded device token for " + user.firstName + " : " + deviceToken);
        h.ResHelper.sendSuccess(res);
      }
    });

  });
});



/* FUNCTIONS */

module.exports = router;
