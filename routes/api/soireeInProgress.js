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

    var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

    var SOIREE = Soiree.SOIREE;
    var SOIREE_LOWERCASE = Soiree.SOIREE_LOWERCASE;

    var _socket;

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
        //TODO: add security that ensures that only users who are signed up for soiree can join
        var soireeId = req.params.soireeId;
        if (!soireeId){
            return ResHelper.sendError(res, ErrorCodes.MissingData);
        }

        User.verifyUser(req, res, next, function(user){

            Soiree.findBySoireeId(soireeId, function(soiree){

                var valid = false;
                for (var i = 0; i < user._soireesAttending.length; i++){
                    if(MongooseHelper.isEqualPopulated(user._soireesAttending[i], soiree._id)){
                        valid = true;
                        break;
                    }
                }

                if (valid){
                    io.on('connection', function(socket){
                        console.log('a user connected to soireeInProgress. Joining room ' + soireeId);

                        socket.join(soireeId);

                        var message = {author: SOIREE, text : "Connected to " + SOIREE_LOWERCASE};
                        socket.emit('test', message);
                        //console.log("sent message");

                        //res.json({"status" : "Connected"});

                        socket.on('disconnect', function(){
                            console.log('user disconnected from soireeInProgress');
                        });
                    });

                    res.send("OK");
                }
                else{
                    ResHelper.sendError(res, ErrorCodes.InvalidInput);
                }

            }, function(err){
                ResHelper.sendError(res, err);
            });

        });

    });

    return router;
};

module.exports = returnRouter;