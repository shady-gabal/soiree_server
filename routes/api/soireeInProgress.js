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

    var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

    var SOIREE = Soiree.SOIREE;
    var SOIREE_LOWERCASE = Soiree.SOIREE_LOWERCASE;

    router.get('/', function (req, res) {
        console.log("/soireeInProgress requested");
        io.on('connection', function(socket){
            console.log('a user connected to soireeInProgress');

            //socket.on('event name', function(data){});

            var message = {author: SOIREE, text : "Connected to " + SOIREE_LOWERCASE};
            socket.emit('message', message);
            console.log("sent message");

            //res.json({"status" : "Connected"});

            socket.on('disconnect', function(){
                console.log('user disconnected from soireeInProgress');
            });
        });
        //res.render('index', {title: 'Express'});
    });

    return router;
};

module.exports = returnRouter;