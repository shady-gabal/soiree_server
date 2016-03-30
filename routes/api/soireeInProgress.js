var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soirees/Soiree.js');
var SoireeReservation = require(dbFolderLocation + 'Soirees/SoireeReservation.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var SpontaneousSoireeJob = require(dbFolderLocation + 'Soirees/SpontaneousSoireeJob.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var MongooseHelper = require(helpersFolderLocation + 'MongooseHelper.js');
var Globals = require(helpersFolderLocation + 'Globals.js');

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

var SOIREE = Soiree.SOIREE;
var SOIREE_LOWERCASE = Soiree.SOIREE_LOWERCASE;

var io = Globals.io;

var socketAuthenticate = function(socket, data, callback){
    console.log("socket authenticate called");
    var user = data.user;
    var soireeId = data.soireeId;

    var makeshiftReq = {};
    makeshiftReq.body = {user: user};

    User.verifyUser(makeshiftReq, null, function(){console.log("fake next called")}, function(user){
        //check if soiree with id is in soirees attending
        user.deepPopulate("_currentReservations", function(err, _user){
           if (err || !_user)
               return callback(null, false);
           for (var i = 0; i < _user._currentReservations.length; i++){
               if (soireeId === _user._currentReservations[i].soireeId){
                   console.log("user authenticated");
                   return callback(null, true);
               }
           }
            return callback(null, false);
        });
    }, function(err){
        console.log("Error verifying user: " + err);
        return callback(null, false);
    });
};

var postAuthenticate = function(socket, data){
    var user = data.user;
    var soireeId = data.soireeId;

    Soiree.findOne({soireeId : soireeId}).deepPopulate("_host").exec(function(err, soiree) {
        if (err) {
            console.log("Error in postAuthenticate soiree : " + err);
        }
        else {
            socket.client.soiree = soiree;
        }
    });

    var makeshiftReq = {};
    makeshiftReq.body = {user: user};

    User.verifyUser(makeshiftReq, null, null, function(user){
       socket.client.user = user;
    }, function(err){
        console.log("Error in postAuthenticate user: " + err);
    });
};

    require('socketio-auth')(io, {
        authenticate : socketAuthenticate,
        postAuthenticate : postAuthenticate,
        timeout: 2000
    });

/* Socket.io */
io.on('connection', function(socket){
    console.log('io.on connection');

    socket.on('client-authenticated', function(){
        console.log('socket authenticated event');

        if (socket.auth && socket.client.user && socket.client.soiree && socket.client.soiree.open) {
            socket.client.soiree._host.joinUser(user, socket);


            socket.on('disconnect', function () {
                console.log('user disconnected from soireeInProgress');
            });
        }
    });
});



router.get('/', function(req, res){
    if (Globals.development){
        res.render('testing/testSocket', {});
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