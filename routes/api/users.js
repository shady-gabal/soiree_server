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
var UserFeedbackList = require ('app/db/UserFeedbackList.js');
var UserVerification = require('app/db/UserVerification.js');
var Notification = require('app/db/Notification.js');

var db = require('app/db/db');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var CreditCardHelper = require('app/helpers/CreditCardHelper.js');
var PushNotificationHelper = require('app/helpers/PushNotificationHelper.js');
var MongooseHelper = require('app/helpers/MongooseHelper.js');
var Globals = require('app/helpers/Globals.js');
var Image = require('app/db/Image');
var IDGeneratorHelper = require('app/helpers/IDGeneratorHelper.js');

var ErrorCodes = require('app/helpers/ErrorCodes.js');

var h = require('app/helpers/h');


router.post('/findUser', function(req, res, next){
  console.log("in findUser...");

  User.authenticateUser(req, res, next, function(user){
    res.json({user : user.jsonObject()});
  });

});



router.post('/createUser', function(req, res, next){

  var facebookAccessToken = req.body.facebook_access_token;
  var emailSignupData = req.body.emailSignupData;
  

  if (facebookAccessToken) {

    passport.authenticate('facebook-token', function (err, userFound, info) {

      if (err) {
        console.log(err);
        return h.ResHelper.sendError(res, h.ErrorCodes.UserAuthenticationError);
      }
      else if (!userFound){
        User.createUserWithFacebook(req, function(user, encodedAccessToken){
              res.json({user : user.jsonObject(), firstSignUp: true, soireeAccessToken : encodedAccessToken});
        }, function(err, errorMessage){
          return h.ResHelper.sendError(res, h.ErrorCodes.UserCreationError, {errorMessage : errorMessage});
        });

      }
      else{
        userFound.generateNewSoireeAccessToken(function(encodedAccessToken) {
          res.json({user : userFound.jsonObject(), soireeAccessToken : encodedAccessToken});
        }, function(){
          ResHelper.sendError(res, ErrorCodes.Error);
        });
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

  User.authenticateUser(req, res, next, function(user){
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

  User.authenticateUser(req, res, next, function(user){

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


router.post('/updateProfile', function(req, res, next){

  User.authenticateUser(req, res, next, function(user){

    var profile = req.body.userProfile;
    if (!profile){
      return ResHelper.sendError(res, ErrorCodes.MissingData);
    }

    if (profile.question1){
      user.profile.question1.question = profile.question1;
    }
    if (profile.question2){
      user.profile.question2.question = profile.question2;
    }
    if (profile.question3){
      user.profile.question3.question = profile.question3;
    }
    if (profile.answer1){
      user.profile.question1.answer = profile.answer1;
    }
    if (profile.answer2){
      user.profile.question2.answer = profile.answer2;
    }
    if (profile.answer3){
      user.profile.question3.answer = profile.answer3;
    }
    if (profile.description){
      user.profile.description = profile.description;
    }

    user.save(function(err){
      if (err){
        console.log(err);
        ResHelper.sendError(res, ErrorCodes.MongoError);
      }
      else{
        console.log("UPDATED PROFILE");
        res.json({"userProfile" : user.userProfile()});
      }
    });


  });


});

/**** Payment ****/

//Braintree

router.post('/braintreeClientToken', function(req, res, next){
  User.authenticateUser(req, res, next, function(user) {

    h.CreditCardHelper.generateBrainTreeClientToken(function(clientToken){
      res.json({clientToken: clientToken});
    }, function(){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });

  });
});

router.post('/addBraintreeCard', function(req, res, next){
  User.authenticateUser(req, res, next, function(user) {

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
  User.authenticateUser(req, res, next, function(user) {

    h.CreditCardHelper.removeBraintreeCard(user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });

  });
});

//Stripe

router.post('/addStripeCard', function(req, res, next){
  User.authenticateUser(req, res, next, function(user) {

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

  User.authenticateUser(req, res, next, function(user) {

    h.CreditCardHelper.removeStripeCard(user, function(_user){
      res.json({user : _user.jsonObject()})
    }, function(err){
      h.ResHelper.sendError(res, h.ErrorCodes.Error);
    });
  });

});








/**** Reporting *****/

router.post('/soireeFeedback', function(req, res, next){

  User.authenticateUser(req, res, next, function(user){
    var message = req.body.message;
    var type = Globals.feedbackTypes.SOIREE;
    var soireeId = req.body.soireeId;
    var pars = {
      message : message,
      type : type,
      user : user._id,
      soireeId : soireeId
    }
    if(!message || !type || !soireeId){
      h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
    }
    UserFeedbackList.addFeedback(pars, function(err){
      console.log(err);
    }, function(list){
      console.log("Uploaded Soiree feedback ");
      h.ResHelper.sendSuccess(res);
    });
  });

});

router.post('/reportProblemForSoiree', function(req, res, next){

  User.authenticateUser(req, res, next, function(user){
    var message = req.body.message;
    var type = Globals.feedbackTypes.PROBLEM;
    var soireeId = req.body.soireeId;
    var pars = {
      message : message,
      type : type,
      user : user._id,
      soireeId : soireeId
    }
    if(!message || !type || !soireeId){
      h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
    }
    UserFeedbackList.addFeedback(pars, function(err){
      console.log(err);
    }, function(list){
      console.log("Uploaded Soiree Problem feedback ");
      h.ResHelper.sendSuccess(res);
    });
  });


});

router.post('/userFeedback', function(req, res, next){
  
  User.authenticateUser(req, res, next, function(user){
    var message = req.body.message;
    var type = Globals.feedbackTypes.TIP;
    var soireeId = req.body.soireeId;
    var pars = {
      message : message,
      type : type,
      user : user._id,
      soireeId : soireeId
    }
    if(!message || !type){
      h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
    }
    UserFeedbackList.addFeedback(pars, function(err){
      console.log(err);
    }, function(list){
      console.log("Uploaded User feedback ");
      h.ResHelper.sendSuccess(res);
    });
  });
});




/**** User Specific Data ****/

router.post('/userProfileForUserId', function(req, res, next){
  User.authenticateUser(req, res, next, function(user){

    if (!user.verified){
      return ResHelper.sendError(res, ErrorCodes.UserNotVerified);
    }

    var userId = req.body.userId;
    if (!userId) return ResHelper.sendError(res, ErrorCodes.MissingData);

    User.findByUserId(userId, function(requestedUser){
      res.json({userProfile : requestedUser.userProfile()});

    }, function(err){
        ResHelper.sendError(res, err);
    });

  });
});
router.post('/fetchUserSoirees', function(req, res, next){
  User.authenticateUser(req, res, next, function(user){

      user.findSoireesAttendingAndAttended(function(soireesAttending, soireesAttended){

        var obj = {};
        var pastArr = [], presentArr = [], futureArr = [], cancelledArr = [];

        var finished = function(){
          obj["present"] = presentArr;
          obj["future"] = futureArr;

          res.json(obj);
        };

        //past and cancelled soirees
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

          var numReturned = 0;

        if (soireesAttending.length == 0){
          return finished();
        }

        //present soirees
          for (var j = 0; j < soireesAttending.length; j++) {
            var soiree = soireesAttending[j];
            var jsonDict = soiree.jsonObject(user);

            if (!soiree._reservation){
              if (++numReturned === soireesAttending.length){
                finished();
              }
            }
            else{
              soiree._reservation.makeJsonObject(function(jsonObject){
                jsonDict["reservation"] = jsonObject;

                if (soiree.openToUsers) {
                  presentArr.push(jsonDict);
                }
                else {
                  futureArr.push(jsonDict);
                }

                if (++numReturned === soireesAttending.length){
                  finished();
                }
              });
            }


          }

        });

      });
});







router.post('/uploadDeviceToken', function(req, res, next){
  var deviceToken = req.body.deviceToken;
  if (!deviceToken){
    return h.ResHelper.sendError(res, h.ErrorCodes.MissingData);
  }

  User.authenticateUser(req, res, next, function(user){
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
