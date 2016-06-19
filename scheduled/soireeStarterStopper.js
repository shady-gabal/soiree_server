/**
 * Created by shadygabal on 12/11/15.
 */
var scheduledTasks = function(){
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
    //
    ////START OR CANCEL IF NECESSARY
    //console.log('starting soirees starting...');
    //
    //Soiree.find( { "scheduledStartTimeIdentifier" : {"$lte" : scheduledTimeIdentifierNow}, "started" : false, "ended" : false, "cancelled" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
    //    if (err){
    //        console.log("Error in scheduledSoirees: " + err);
    //    }
    //    else{
    //        console.log("Starting " + soirees.length + " soirees");
    //        for (var i = 0; i < soirees.length; i++){
    //            var soiree = soirees[i];
    //            if (soiree.reachedNumUsersMin){
    //                soiree.open();
    //                //console.log("Starting soiree  " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
    //                soiree.startIfPossible();
    //            }
    //            else{
    //                soiree.cancel();
    //            }
    //
    //
    //        }
    //        console.log('done starting');
    //    }
    //});

//    END
//end existing soirees
//    console.log('ending soirees starting...');
//    Soiree.find( { "scheduledEndTimeIdentifier" : {"$lte" : scheduledTimeIdentifierNow}, "started" : true, "ended" : false, "cancelled" : false} ).populate(deepPopulateFields).exec(function(err, soirees){
        //if (err){
        //    console.log("Error in scheduledSoirees: " + err);
        //}
        //else{
        //    console.log("Ending " + soirees.length + " soirees");
        //    for (var i = 0; i < soirees.length; i++){
        //        var soiree = soirees[i];
        //        console.log('trying soiree ' + soiree.soireeId);
        //
        //        if (soiree.soireeType != "TEST"){
        //            soiree.end();
        //        }
        //    }
        //    console.log('done ending');
        //
        //}
    //});

    console.log('ending soirees starting...');
    Soiree.find( { } ).populate(deepPopulateFields).exec(function(err, soirees){

    });
    console.log("done ending");

//    //REMIND
////remind people of upcoming soirees or cancel if necessary
//    Soiree.find( { "scheduledStartTimeIdentifier" : {"$lte" : scheduledTimeIdentifierReminder}, "started" : false, "ended" : false, "cancelled" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
//        if (err){
//            console.log("Error in scheduledSoirees: " + err);
//        }
//        else{
//            console.log("Reminding users of " + soirees.length + " soirees");
//            for (var i = 0; i < soirees.length; i++){
//                var soiree = soirees[i];
//                //console.log("Reminding soiree " + soiree.soireeId + " with users attending: " + soiree.numUsersAttending);
//                if (soiree.reachedNumUsersMin){
//                    soiree.open();
//                    soiree.remind(SOIREE_REMIND_BEFORE + "");
//                }
//                else{
//                    soiree.cancel();
//                }
//            }
//            console.log('done reminding');
//        }
//    });
//
    console.log('done running');
};

module.exports = scheduledTasks;
