/**
 * Created by shadygabal on 12/11/15.
 */
var scheduledTasks = function(){
    var express = require('express');
    var router = express.Router();

    var dbFolderLocation = "../db/";
    var helpersFolderLocation = "../helpers/";

    var mongoose = require('app/db/mongoose_connect.js');
    var Soiree = require('app/db/Soiree.js');
    var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob.js');


    var SOIREE_REMIND_BEFORE = 30;
    var SPONTANEOUS_SOIREE_CHECK_BEFORE = 60;

    var deepPopulateFields = "_business _usersAttending _host";

    var scheduledTimeIdentifierNow = Soiree.createScheduledTimeIdentifier();
//var scheduledTimeIdentifierEnd = Soiree.createScheduledTimeIdentifierPast(SOIREE_LENGTH_IN_MINS);
    var scheduledTimeIdentifierReminder = Soiree.createScheduledTimeIdentifierFuture(SOIREE_REMIND_BEFORE);

    var scheduledTimeIdentifierSpontaneous = Soiree.createScheduledTimeIdentifier(Date.now() - (SPONTANEOUS_SOIREE_CHECK_BEFORE * 60 * 1000));

    console.log("Running scheduled tasks...");

    console.log("Running scheduled soirees task for scheduledTimeIdentifierNow: " + scheduledTimeIdentifierNow +  " ...");
    console.log("Running scheduled soirees task for scheduledTimeIdentifierReminder: " + scheduledTimeIdentifierReminder +  " ...");

//start
    Soiree.find( { "scheduledStartTimeIdentifier" : {"$lte" : scheduledTimeIdentifierNow}, "started" : false, "ended" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
        if (err){
            console.log("Error in scheduledSoirees: " + err);
        }
        else{
            console.log("Starting " + soirees.length + " soirees");
            for (var i = 0; i < soirees.length; i++){
                var soiree = soirees[i];
                if (soiree.reachedNumUsersMin){
                    soiree.open();
                    //console.log("Starting soiree  " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
                    soiree.startIfPossible();
                }
                else{
                    soiree.cancel();
                }


            }
        }
    });

////update inProgress soirees
//Soiree.find( { "scheduledTimeIdentifier" : {"$gt" : scheduledTimeIdentifierPrevious, "$lt" : scheduledTimeIdentifierNow}, "started" : true, "ended" : false, "inProgress" : true} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
//    if (err){
//        console.log("Error in scheduledSoirees: " + err);
//    }
//    else{
//        console.log("Updating progress of " + soirees.length + " soirees");
//        for (var i = 0; i < soirees.length; i++){
//            var soiree = soirees[i];
//            console.log("Updating soiree " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
//            //soiree.end();
//        }
//    }
//});

//end existing soirees
    Soiree.find( { "scheduledEndTimeIdentifier" : {"$lte" : scheduledTimeIdentifierNow}, "started" : true, "ended" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
        if (err){
            console.log("Error in scheduledSoirees: " + err);
        }
        else{
            console.log("Ending " + soirees.length + " soirees");
            for (var i = 0; i < soirees.length; i++){
                var soiree = soirees[i];
                soiree.end();
            }
        }
    });


//remind people of upcoming soirees or cancel if necessary
    Soiree.find( { "scheduledStartTimeIdentifier" : {"$lte" : scheduledTimeIdentifierReminder}, "started" : false, "ended" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
        if (err){
            console.log("Error in scheduledSoirees: " + err);
        }
        else{
            console.log("Reminding users of " + soirees.length + " soirees");
            for (var i = 0; i < soirees.length; i++){
                var soiree = soirees[i];
                //console.log("Reminding soiree " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
                if (soiree.reachedNumUsersMin){
                    soiree.open();
                    soiree.remind(SOIREE_REMIND_BEFORE + "");
                }
                else{
                    soiree.cancel();
                }
            }
        }
    });

};

module.exports = scheduledTasks;
