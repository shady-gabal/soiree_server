var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var _ = require("underscore");
var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob.js');
var SoireeHost = require('app/db/SoireeHost.js');

var SoireeReservation = require('app/db/SoireeReservation.js');
var CommunityPost = require('app/db/CommunityPost.js');
var CommunityComment = require('app/db/CommunityComment.js');

var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');
var Notification = require('app/db/Notification.js');

var ResHelper = require('app/helpers/ResHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');
var Globals = require('app/helpers/Globals.js');
var io = Globals.io;

var _user, _soireeId;

//io.on('connection', function(socket){
//    console.log('testing io.on connection');
//    //console.log(socket);
//    console.log("soireeid : " + _soireeId);
//    console.log('user ' + _user);
//
//    if (_soireeId && _user) {
//        console.log('finding soiree');
//        Soiree.findOne({soireeId: _soireeId}).populate("_host").exec(function (err, soiree) {
//            if (!err && soiree) {
//                console.log("joining user...");
//                soiree._host.joinUser(_user, socket);
//                socket.to(soiree.soireeId).emit('testroom', {});
//                socket.emit('test', {});
//
//                //io.to(soiree.soireeId).emit('test', createMessage(message));
//
//            }
//        });
//    }
//
//});

router.get('/', function(req, res){
    console.log('/showInProgress');
    var soireeId = req.query.soireeId;
    _soireeId = soireeId;

    var userId = req.query.userId;

    User.findOne({userId : userId}).exec(function(err, user){
       if (!err && user){
           _user = user;
           res.render('testing/soireeInProgress', {_user : _user, soireeId : soireeId});
       };
    });
    //for (var i = 0; i < _testUsers.length; i++){
    //    if (_testUsers[i].userId === userId){
    //        _user = _testUsers[i];
    //        break;
    //    }
    //}

});


module.exports = router;