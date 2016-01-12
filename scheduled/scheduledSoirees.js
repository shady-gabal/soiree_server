/**
 * Created by shadygabal on 12/11/15.
 */
var express = require('express');
var router = express.Router();

var dbFolderLocation = "../db/";
var helpersFolderLocation = "../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');


var SOIREE_LENGTH_IN_MINS = 10;
var deepPopulateFields = "_business _usersAttending";

var scheduledTimeIdentifierNow = Soiree.createScheduledTimeIdentifier();
var scheduledTimeIdentifierOneHourAgo = Soiree.createScheduledTimeIdentifier(new Date() - (SOIREE_LENGTH_IN_MINS * 60 * 1000));

console.log("Running scheduled soirees task for scheduledTimeIdentifier: " + scheduledTimeIdentifier +  " ...");


//start
Soiree.find( { "scheduledTimeIdentifier" : {"$lte" : scheduledTimeIdentifier}, "started" : false, "ended" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
    if (err){
        console.log("Error in scheduledSoirees: " + err);
    }
    else{
        console.log("Soirees returned trying to start: " + soirees);
        for (var i = 0; i < soirees.length; i++){
            var soiree = soirees[i];
            console.log("Starting soiree with users attending: " + soiree.numUsersAttending);
            soiree.start();
        }
    }
});

//end existing soirees
Soiree.find( { "scheduledTimeIdentifier" : {"$lte" : scheduledTimeIdentifier}, "started" : true, "ended" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
    if (err){
        console.log("Error in scheduledSoirees: " + err);
    }
    else{
        console.log("Soirees returned trying to end: " + soirees);
        for (var i = 0; i < soirees.length; i++){
            var soiree = soirees[i];
            console.log("Ending soiree with users attending: " + soiree.numUsersAttending);
            soiree.end();
        }
    }
});

//Soiree.findSoireesWithScheduledTimeIdenfitier(scheduledTimeIdentifier, function(soirees){
//
//}, function(err){
//   console.log("Error in scheduledSoirees: " + err);
//});
