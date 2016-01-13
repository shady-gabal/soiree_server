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
var scheduledTimeIdentifierPrevious = Soiree.createScheduledTimeIdentifier(Date.now() - (SOIREE_LENGTH_IN_MINS * 60 * 1000));

console.log("Running scheduled soirees task for scheduledTimeIdentifier: " + scheduledTimeIdentifierNow +  " ...");


//start
Soiree.find( { "scheduledTimeIdentifier" : {"$lte" : scheduledTimeIdentifierNow}, "started" : false, "ended" : false, "inProgress" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
    if (err){
        console.log("Error in scheduledSoirees: " + err);
    }
    else{
        console.log("Soirees returned trying to start: " + soirees);
        for (var i = 0; i < soirees.length; i++){
            var soiree = soirees[i];
            console.log("Starting soiree  " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
            soiree.start();
        }
    }
});

//end existing soirees
Soiree.find( { "scheduledTimeIdentifier" : {"$lte" : scheduledTimeIdentifierPrevious}, "started" : true, "ended" : false, "inProgress" : true} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
    if (err){
        console.log("Error in scheduledSoirees: " + err);
    }
    else{
        console.log("Soirees returned trying to end: " + soirees);
        for (var i = 0; i < soirees.length; i++){
            var soiree = soirees[i];
            console.log("Ending soiree  " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
            soiree.end();
        }
    }
});

//update inProgress soirees
Soiree.find( { "scheduledTimeIdentifier" : {"$gt" : scheduledTimeIdentifierPrevious, "$lt" : scheduledTimeIdentifierNow}, "started" : true, "ended" : false, "inProgress" : true} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
    if (err){
        console.log("Error in scheduledSoirees: " + err);
    }
    else{
        console.log("Soirees returned trying to update: " + soirees);
        for (var i = 0; i < soirees.length; i++){
            var soiree = soirees[i];
            console.log("Updating soiree " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
            //soiree.end();
        }
    }
});

//Soiree.findSoireesWithScheduledTimeIdenfitier(scheduledTimeIdentifier, function(soirees){
//
//}, function(err){
//   console.log("Error in scheduledSoirees: " + err);
//});
