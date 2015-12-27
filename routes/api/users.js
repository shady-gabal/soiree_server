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

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');
var ResHelpers = require(helpersFolderLocation + 'ResHelpers.js');


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

    passport.authenticate('facebook-token', function (err, userFound, info) {
      if (err) {
        console.log("User not found " + err);
        return ResHelpers.sendMessage(res, 404, "Error fetching user specified");
      }
      else if (!userFound){
        return ResHelpers.sendMessage(res, 405, "No user found");
      }
      else{
        sendUser(res, userFound);
      }
    })(req, res, next);

  }
  else{ //else if userpw

  }

});

router.get('/findUser', function(req, res, next){
  var facebookAccessToken = req.query.access_token;

  //if (!facebookUserId){
  //  return ResHelpers.sendMessage(res, 404, "No facebook user id specified");
  //}
  if (facebookAccessToken) {
    console.log("facebook access token found - finduser");

    passport.authenticate('facebook-token', function (err, userFound, info) {
      if (err) {
        console.log("User not found " + err);
        return ResHelpers.sendMessage(res, 404, "Error fetching user specified");
      }
      else if (!userFound){
        return ResHelpers.sendMessage(res, 405, "No user found");
      }
      else{
        sendUser(res, userFound);
      }
    })(req, res, next);
  }
  else{
    res.json("not found");
  }
});

router.post('/createUser', function(req, res, next){

  var facebookAccessToken = req.body.access_token;

  if (facebookAccessToken) {

    passport.authenticate('facebook-token', function (err, userFound, info) {

      if (err) {
        return ResHelpers.sendMessage(res, 404, "Error fetching user specified");
      }
      else if (!userFound){
        User.createUser(req, function(user){
            sendUser(res, user);
        }, function(err){
          return ResHelpers.sendMessage(res, 404, "Error creating user");
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
            ResHelpers.sendMessage(res, 404, "error saving photo");
          }
          else {
            ResHelpers.sendMessage(res, 200, "saved photo");
          }
        });

      });
    }
    else{
      ResHelpers.sendMessage(res, 200, "user already verified");
    }

  }, function(err){
     ResHelpers.sendMessage(res, 404, "error finding user");
    });
});

router.post('/saveStripeToken', function(req, res, next){
  User.verifyUser(req, res, next, function(user){
    var stripeToken = req.body.stripeToken;
    var last4Digits = req.body.creditCardLast4Digits;

    user.stripeToken = stripeToken;
    user.creditCardLast4Digits = last4Digits;

    console.log("stripe token: " + stripeToken);

    user.save(function(err, user){
      if (err){
        console.log("error saving token " + err);
        ResHelpers.sendMessage(res, 404, "error saving token");
      }
      else{
        console.log("saved stripe token");
        ResHelpers.sendSuccess(res);
      }
    });
  }, function(err){
     ResHelpers.sendMessage(res, 404, "error finding user");
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
