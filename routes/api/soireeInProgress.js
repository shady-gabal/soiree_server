var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var SoireeReservation = require('app/db/SoireeReservation.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var MongooseHelper = require('app/helpers/MongooseHelper.js');
var Globals = require('app/helpers/Globals.js');

var ErrorCodes = require('app/helpers/ErrorCodes.js');

var SOIREE = Soiree.SOIREE;
var SOIREE_LOWERCASE = Soiree.SOIREE_LOWERCASE;

var io = Globals.io;

var socketAuthenticate = function(socket, data, callback){
    console.log("socket authenticate called");
    var userData = data.user;
    var soireeId = data.soireeId;

    var makeshiftReq = {};
    makeshiftReq.body = {user: userData};

    var successCallback = function(user){
        //check if soiree with id is in soirees attending
        user.deepPopulate("_currentReservations", function(err, _user){
            if (err || !_user)
                return callback(null, false);

            for (var i = 0; i < _user._currentReservations.length; i++){
                if (soireeId === _user._currentReservations[i].soireeId){
                    console.log("user authenticated");
                    /* populate user and soiree */
                    socket.client.user = _user;

                    Soiree.findOne({soireeId : soireeId}).deepPopulate("_host").exec(function(err, soiree) {
                        if (err) {
                            console.log("Error in postAuthenticate soiree : " + err);
                            return callback(null, false);
                        }
                        else {
                            socket.client.soiree = soiree;
                            return callback(null, true);
                        }
                    });

                }
            }
            //return callback(null, false);
        });
    };


    if (data.userId){
        console.log("finding user with userid " + data.userId);
        User.findOne({userId : data.userId}).exec(function(err, user){
           if (err || !user){
               callback(null, false);
           }
            else{
               successCallback(user);
           }
        });
    }
    else{
        console.log('verifying user');
        User.verifyUser(makeshiftReq, null, function(){console.log("fake next called")}, successCallback, function(err){
            console.log("Error verifying user: " + err);
            return callback(null, false);
        });
    }



};

//var postAuthenticate = function(socket, data){
//    var user = data.user;
//    var soireeId = data.soireeId;
//
//    Soiree.findOne({soireeId : soireeId}).deepPopulate("_host").exec(function(err, soiree) {
//        if (err) {
//            console.log("Error in postAuthenticate soiree : " + err);
//        }
//        else {
//            socket.client.soiree = soiree;
//        }
//    });
//
//    var makeshiftReq = {};
//    makeshiftReq.body = {user: user};
//
//    User.verifyUser(makeshiftReq, null, null, function(user){
//        console.log('setting user in postAuthenticate...');
//       socket.client.user = user;
//    }, function(err){
//        console.log("Error in postAuthenticate user: " + err);
//    });
//};

    require('socketio-auth')(io, {
        authenticate : socketAuthenticate,
        timeout: 'none'
    });

/* Socket.io */
io.on('connection', function(socket){
    console.log('io.on connection');

    socket.on('client-authenticated', function(){
        console.log('socket authenticated event');

        //console.log(socket.client.user);
        //console.log(socket.client.soiree);

        if (socket.auth && socket.client.user && socket.client.soiree && socket.client.soiree.openToUsers) {
            console.log("joining room...");
            console.log(socket.client);
            socket.client.soiree._host.joinUser(socket.client.user, socket);

            socket.on('disconnect', function (socket) {
                socket.client.soiree._host.disconnectUser(socket.client.user);
                console.log('user disconnected from soireeInProgress');
            });
        }
    });
});
router.get('/', function(req, res){
    if (Globals.development){
        res.render('testing/soireeInProgress', {});
    }
    else{
        res.send("OK");
    }
});


router.get('/sendMessage', function(req, res){
    var text = req.query.message ? req.query.message : "Test Message";
    var room = req.query.room ? req.query.room : null;

    var message = {author: Soiree.SOIREE, text : text};

    console.log(io.sockets);

    if (room){
        io.to(room).emit('test', message);
    }
    else{
        io.emit('test', message);
    }


    res.send("Sent '" + message.text + "'" + "to room " + room);
});

module.exports = router;