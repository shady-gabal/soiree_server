var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var multiparty = require('multiparty');
var fs = require('fs');
var multer = require('multer');
var storage = multer.memoryStorage();

//var upload = multer({ dest: 'public/images/' })
var upload = multer({ storage: storage })

var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');


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
        res.json({"user" : user});
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
      UserVerification.find({_user : user._id}).exec(function(err, verification){
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



router.post('/verifyWithPhoto', upload.single('photo'), function(req, res){
  User.verifyUser(req.body.user, function(user) {
    console.log(req.file);
      var userVerification = new UserVerification({
        _user : user._id,
      });
      userVerification.image.data = req.file.buffer;
      userVerification.image.contentType = req.file.mimetype;
    
      userVerification.save(function(err) {
        if (err) {
          res.status('404').send("Error saving photo");
        }
        else {
          res.json({"message": "Finished"});
          console.log("Saved photo");
        }
      });


      //var imagePath = req.file.path;
      //fs.readFile(imagePath, function(data){
      //  userVerification.image.data = data;
      //
      //  userVerification.save(function(err){
      //    if (err){
      //      res.status('404').send("Error saving photo");
      //    }
      //    else{
      //      res.json({"message" : "Finished", "fileName" : req.file.filename});
      //      console.log("Saved photo");
      //    }
      //
      //
      //  });
      //});



    }, function(err){
      res.status('404').send("Error finding user");
    });
});

//router.post('/verifyWithPhoto', function(req, res){
//  var form = new multiparty.Form();
//
//  form.parse(req, function(err, fields, files) {
//    console.log(fields);
//    Object.keys(fields).forEach(function(name) {
//      console.log('got field named ' + name);
//    });
//
//    User.verifyUser(fields.user, function(user) {
//      console.log("In user");
//
//      var photo = files["photo"][0];
//      var imagePath = photo.path;
//      console.log(photo);
//      var userVerification = new UserVerification({
//        _user : user._id
//      });
//      userVerification.image.data = fs.readFileSync(imagePath);
//
//
//      userVerification.save(function(err){
//        if (err){
//          res.status('404').send("Error saving photo");
//        }
//        else{
//          res.json({"message" : "Finished"});
//          console.log("Saved photo");
//        }
//      });
//
//    }, function(err){
//      res.status('404').send("Error finding user");
//    });
//  });
//});

function createUser(req, res){
  var facebookUserId = req.query.facebookUserId;
  var firstName = req.query.firstName;
  var lastName = req.query.lastName;
  var email = req.query.email;
  var gender = req.query.gender;
  var interestedIn = req.query.interestedIn;
  var birthday = req.query.birthday;
  var profilePictureUrl = req.query.profilePictureUrl;

  var newUser = new User({
    facebookUserId : facebookUserId,
    firstName : firstName,
    lastName : lastName,
    email : email,
    gender : gender,
    interestedIn : interestedIn,
    birthday : birthday,
    profilePictureUrl : profilePictureUrl,
    verified: false
  });

  newUser.save(function(err, user){
    if (err) {
      console.log("Error saving user: " + err);
      return res.status('404').send("Error saving user");
    }

    sendUser(res, user, true);
  });
}

function sendUser(res, user, firstSignUp){
  if (!firstSignUp)
    firstSignUp = false;

  var obj = {
    "firstSignUp" : firstSignUp,
    "user" : user.createDataObjectToSend()
  };
  res.json(obj);
}


module.exports = router;
