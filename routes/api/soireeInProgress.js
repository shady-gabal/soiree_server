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

    var _socket;

    io.on('connection', function(socket){
        _socket = socket;
        console.log('a user connected to soireeInProgress');

        //socket.on('event name', function(data){});

        var message = {author: SOIREE, text : "Connected to " + SOIREE_LOWERCASE};
        socket.emit('test', message);
        //console.log("sent message");

        //res.json({"status" : "Connected"});

        socket.on('disconnect', function(){
            console.log('user disconnected from soireeInProgress');
        });
    });

    router.get('/', function (req, res) {
        console.log("/soireeInProgress requested");
        //res.render('index', {title: 'Express'});
    });

    router.get('/sendMessage', function(req, res){
        var text = req.query.message ? req.query.message : "Test Message";
        var message = {author: SOIREE, text : text};

        _socket.emit('test', message);
        res.send("Sent '" + message.text + "'");
    });

    return router;
};

module.exports = returnRouter;