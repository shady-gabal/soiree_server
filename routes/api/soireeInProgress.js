var returnRouter = function(io) {
    var express = require('express');
    var router = express.Router();

    var dbFolderLocation = "../../db/";
    var helpersFolderLocation = "../../helpers/";

    var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
    var Soiree = require(dbFolderLocation + 'Soiree.js');
    var SoireeReservation = require(dbFolderLocation + 'SoireeReservation.js');
    var Business = require(dbFolderLocation + 'Business.js');
    var User = require(dbFolderLocation + 'User.js');
    var SpontaneousSoireeJob = require(dbFolderLocation + 'SpontaneousSoireeJob.js');

    var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
    var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
    var MongooseHelper = require(helpersFolderLocation + 'MongooseHelper.js');
    var Globals = require(helpersFolderLocation + 'Globals.js');

    var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

    var SOIREE = Soiree.SOIREE;
    var SOIREE_LOWERCASE = Soiree.SOIREE_LOWERCASE;

    var _socket;

    var socketAuthenticate = function(socket, data, callback){
        console.log("socket authenticate called");
        var user = data.user;
        var soireeId = data.soireeId;

        var makeshiftReq = {};
        makeShiftReq.body = {user: user};

        User.verifyUser(makeshiftReq, null, function(){console.log("fake next called")}, function(user){
            //check if soiree with id is in soirees attending
            return callback(null, true);
        }, function(err){
            return callback(null, false);
        });
    };

    require('socketio-auth')(io, {
        authenticate : socketAuthenticate,
        timeout: 1000
    });

    //io.on('connection', function(socket){
    //    _socket = socket;
    //    console.log('a user connected to soireeInProgress');
    //
    //    //socket.on('event name', function(data){});
    //
    //    var message = {author: SOIREE, text : "Connected to " + SOIREE_LOWERCASE};
    //    socket.emit('test', message);
    //    //console.log("sent message");
    //
    //    //res.json({"status" : "Connected"});
    //
    //    socket.on('disconnect', function(){
    //        console.log('user disconnected from soireeInProgress');
    //    });
    //});

    //router.get('/', function (req, res) {
    //    console.log("/soireeInProgress requested");
    //    //res.render('index', {title: 'Express'});
    //});


    router.get('/sendMessage', function(req, res){
        var text = req.query.message ? req.query.message : "Test Message";
        var room = req.query.room ? req.query.room : null;

        var message = {author: SOIREE, text : text};

        if (room){
            io.to(room).emit('test', message);
        }
        else{
            io.emit('test', message);
        }


        res.send("Sent '" + message.text + "'" + "to room " + room);
    });

    router.get('/:soireeId', function(req, res, next){
        console.log("/:soireeId called");
        //TODO: add security that ensures that only users who are signed up for soiree can join
        var soireeId = req.params.soireeId;
        if (!soireeId){
            return ResHelper.sendError(res, ErrorCodes.MissingData);
        }
        var roomId = soireeId;

        //User.verifyUser(req, res, next, function(user){
        //
        //    Soiree.findBySoireeId(soireeId, function(soiree){
        //
        //        var valid = false;
        //        for (var i = 0; i < user._soireesAttending.length; i++){
        //            if(MongooseHelper.isEqualPopulated(user._soireesAttending[i], soiree._id)){
        //                valid = true;
        //                break;
        //            }
        //        }
        //
        //        if (valid){
                     console.log("connecting...");
                    io.on('connection', function(socket){
                        console.log('a user connected to soireeInProgress. Joining room ' + roomId);

                        socket.join(roomId, function(err){
                            if (err){
                                console.log("Error joining room " + roomId + " : " + err);
                                socket.emit('error joining room', {roomId : roomId});
                            }
                            else{
                                socket.emit('joined room', {roomId : roomId});
                                console.log("Successfully joined room " + roomId);
                                console.log("This socket's rooms: " + JSON.stringify(socket.rooms));
                            }
                        });

                        //var message = {author: SOIREE, text : "Connected to " + SOIREE_LOWERCASE};
                        //socket.emit('test', message);
                        //console.log("sent message");

                        //res.json({"status" : "Connected"});

                        socket.on('disconnect', function(){
                            console.log('user disconnected from soireeInProgress');
                        });
                    });

                    if (Globals.development){
                        res.render('testing/testSocket', {});
                    }
                    else{
                        res.send("OK");
                    }
        //        }
        //        else{
        //            console.log("User does not have this soiree in his _soireesAttending");
        //            ResHelper.sendError(res, ErrorCodes.InvalidInput);
        //        }
        //
        //    }, function(err){
        //        ResHelper.sendError(res, err);
        //    });
        //
        //});

    });

    return router;
};

module.exports = returnRouter;