var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

router.get('/findUser', function(req, res){
  var facebookUserId = req.query.facebookUserId;
  if (!facebookUserId){
    return res.status('404').send("No facebook user id specified");
  }

  User.findOne({"facebookUserId" : facebookUserId}).exec(function(err, user){
    if (err){
      res.status('404').send("Error finding user with facebook id: " + fbUserId);
    }
    else{
      if (!user){
        //no user found
        res.json({});
      }
      else{
        res.json(user);
      }
    }
  });
});

router.get('/createUser', function(req, res){
  var facebookUserId = req.query.facebookUserId;

  User.findOne({"facebookUserId" : facebookUserId}).exec(function(err, user){
    if (err){
      return res.status('404').send("Error finding user");
    }
    else{
      if (!user){
        createUser(req, res);
      }
      else{
        sendUser(res, user);
      }
    }
  });



});

function createUser(req, res){
  var facebookUserId = req.query.facebookUserId;
  var firstName = req.query.firstName;
  var lastName = req.query.lastName;
  var email = req.query.email;
  var gender = req.query.gender;
  var interestedIn = req.query.interestedIn;
  var birthday = req.query.birthday;

  var newUser = new User({
    "facebookUserId" : facebookUserId,
    "first_name" : firstName,
    "last_name" : lastName,
    "email" : email,
    "gender" : gender,
    "interested_in" : interestedIn,
    "birthday" : birthday
  });

  newUser.save(function(err){
    if (err)
      return res.status('404').send("Error creating user");

    sendUser(res, newUser, true);
  });
}

function sendUser(res, user, firstSignUp){
  var obj = {
    "firstSignUp" : firstSignUp,
    "user" : user.createDataObjectToSend()
  };
  res.json(obj);
}


module.exports = router;
