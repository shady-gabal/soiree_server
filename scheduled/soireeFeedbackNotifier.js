var scheduled = function(){
    var Soiree = require('app/db/Soiree.js');
    var Notification = require ('app/db/Notification.js');
    var Globals = require('app/helpers/Globals.js');
    
    var SOIREE_ASK_BEFORE = 60 * 24;

    var deepPopulateFields = "_usersAttending";

    var scheduledTimeIdentifierNow = Soiree.createScheduledTimeIdentifier();
    var scheduledTimeIdentifierFeedback = Soiree.createScheduledTimeIdentifierPast(SOIREE_ASK_BEFORE);
    console.log("Feedback Time " + scheduledTimeIdentifierFeedback);
    Soiree.find( { "scheduledEndTimeIdentifier" : {"$gt" : scheduledTimeIdentifierFeedback, "$lt" : scheduledTimeIdentifierNow}, "started" : true, "ended" : true, "cancelled" : false} ).deepPopulate(deepPopulateFields).exec(function(err, soirees){
        if (err){
            console.log("Error in soireeFeedbackNotifier: " + err);
        }
        else{
            console.log("Asking for feedback from " + soirees.length + " soirees");
            for(var i = 0; i < soirees.length; i++){
                var soiree = soirees[i];
                for(var j = 0; j < soiree._usersAttending.length; j++){
                    var user = soiree._usersAttending[j];
                    if(!user.askedForFeedback){
                        user.askedForFeedback = true;
                        user.save(Globals.saveErrorCallback);
                        Notification.createSoireeFeedbackNotification(soiree, user);
                    }
                }
            }
        }
    });
};

module.exports = scheduled;