var helper = function () {

    var ScheduledSoireeJob = require('app/db/ScheduledSoireeJob');

    console.log("Performing spontaneous soiree job...");

    for (var i = 0; i < Globals.colleges.length; i++){
        var college = Globals.colleges[i];

        ScheduledSoireeJob.performForCollege(college);
    }

    //ScheduledSoireeJob.find( { "scheduledStartTimeIdentifier" : {"$lte" : scheduledTimeIdentifierSpontaneous}, "done" : false} ).deepPopulate(deepPopulateFields).exec(function(err, ssJobs) {
    //if (err){
    //    console.log("SSJob Error in scheduledSoirees: " + err);
    //}
    //else{
    //    console.log("Performing ssJobs: " + ssJobs);
    //    for (var i = 0; i < ssJobs.length; i++){
    //        var ssJob = ssJobs[i];
    //        ssJob.perform();
    //    }
    //}
    //});

};

module.exports = helper;