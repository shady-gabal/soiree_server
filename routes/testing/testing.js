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
    var Admin = require(dbFolderLocation + 'Admin.js');

    var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
    var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
    var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


    var _user;

    User.findTestUser(function (user) {
        _user = user;
        console.log("_user set");
    }, function (err) {
        console.log("Error setting test user: " + err);
    });

//var http = require('http');
//var server = http.createServer(express());
//var port = process.env.PORT || 80;
//
//var io = require('socket.io').listen(server);

//var express = require('express'),
//    app = express(),
//    server = app.listen(80),
//    io = require('socket.io').listen(server);

//server.listen(port, function(){
//    console.log('listening on *:' + port);
//});

//io.on('connection', function (socket) {
//    console.log("socket.io connected");
//    socket.emit('news', { hello: 'world' });
//    socket.on('my other event', function (data) {
//        console.log(data);
//    });
//});

    io.on('connection', function (socket) {
        console.log('a user connected');
    });

    router.get('/testSocket', function (req, res) {
        ResHelper.render(req, res, 'testing/testSocket', {});
    });

    router.get('/', function (req, res) {

        Soiree.find({}).limit(50).exec(function (err, soirees) {
            if (err) {
                console.log("Error finding soirees in testing/ : " + err);
                res.status(404).send("Error");
            }
            else {
                for (var i = 0; i < soirees.length; i++) {
                    var soiree = soirees[i];
                    soiree.userAlreadyJoined = soiree.hasUserAlreadyJoined(_user);
                }
                ResHelper.render(req, res, 'testing/index', {soirees: soirees});
            }
        });
    });

    router.get('/deleteSoirees', function (req, res) {
        console.log('deleting soirees...');
        SoireeReservation.remove({}).exec(function (err) {
        });
        Soiree.remove({}).exec(function (err) {
            if (err) {
                res.status(404).send("Error");
            }
            else {
                res.send("OK");
            }
        });
    });

    router.get('/createSoirees', function (req, res) {
        console.log('creating soirees...');
        res.redirect('/api/soirees/createSoirees?numSoirees=10');
    });

    router.get('/createSoireeForSchedulerRun', function (req, res) {

        var today = new Date();
        var mins = today.getMinutes();
        var newMins = mins + (10 - (mins % 10));

        var newDate = new Date();
        newDate.setMinutes(newMins);

        Soiree.createSoiree({
            soireeType: "TEST",
            numUsersMax: 4,
            date: newDate,
            initialCharge: 500
        }, function (soiree) {
            res.send("OK");
        }, function (err) {
            res.send("Error");
        });


    });


    router.post('/joinSoiree', function (req, res) {
        console.log("Joining soiree with id: " + req.body.soireeId + " ....");
        Soiree.joinSoireeWithId(req.body.soireeId, _user, function () {
            res.send("OK");
        }, function (err) {
            console.log("Error joining soiree: " + err);
            res.status(404).send("Error");
        });
    });

    router.post('/createSoirees', function (req, res) {
        res.redirect('/api/soirees/createSoirees?numSoirees=10');
    });

    return router;
};

module.exports = returnRouter;