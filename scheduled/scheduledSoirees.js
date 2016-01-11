/**
 * Created by shadygabal on 12/11/15.
 */
var express = require('express');
var router = express.Router();

var dbFolderLocation = "../db/";
var helpersFolderLocation = "../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');


var scheduledTimeIdentifier = Soiree.createScheduledTimeIdentifier();

console.log("Running scheduled soirees task for scheduledTimeIdentifier: " + scheduledTimeIdentifier +  " ...");

Soiree.find( { "scheduledTimeIdentifier" : {"$lte" : scheduledTimeIdentifier}, "started" : false} ).populate("_business").exec(function(err, soirees){
    if (err){
        console.log("Error in scheduledSoirees: " + err);
    }
    else{
        console.log("Soirees returned: " + soirees);
        for (var i = 0; i < soirees.length; i++){
            var soiree = soirees[i];
            console.log("Starting soiree with users attending: " + soiree.numUsersAttending);
            soiree.start();
        }
    }
});

//Soiree.findSoireesWithScheduledTimeIdenfitier(scheduledTimeIdentifier, function(soirees){
//
//}, function(err){
//   console.log("Error in scheduledSoirees: " + err);
//});
