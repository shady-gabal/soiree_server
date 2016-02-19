var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var Admin = require(dbFolderLocation + 'Admin.js');

var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

var _user;

User.findTestUser(function(user){
    _user = user;
    console.log("_user set");
}, function(err){
    console.log("Error setting test user: " + err);
});

router.get('/', function (req, res) {

    Soiree.find({}).limit(50).exec(function(err, soirees){
       if (err || soirees.length == 0){
           console.log("Error finding soirees in testing/ : " + err);
            res.status(404).send("Error");
       }
        else{
           for (var i = 0; i < soirees.length; i++){
               var soiree = soirees[i];
               soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);
           }
           ResHelper.render(req, res, 'testing/index', {soirees : soirees});
       }
    });
});

router.post('/joinSoiree', function(req, res){
   console.log("Joining soiree with id: " + req.body.soireeId + " ....");
    Soiree.joinSoireeWithId(req.body.soireeId, _user, function(){
        res.send("OK");
    }, function(err){
        console.log("Error joining soiree: " + err);
       res.status(404).send("Error");
    });
});

router.post('/createSoirees', function(req, res){
    res.redirect('/api/soirees/createSoirees?numSoirees=10');
});

module.exports = router;