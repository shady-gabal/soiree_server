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

    router.get('/', function (req, res) {
        io.on('connection', function(socket){
            //socket.on('event name', function(data){});

            //io.emit('event name', data);

            res.json({"status" : "Connected"});
            console.log('a user connected to soireeInProgress');

            socket.on('disconnect', function(){
                console.log('user disconnected from soireeInProgress');
            });
        });
        //res.render('index', {title: 'Express'});
    });

    return router;
};

module.exports = returnRouter;