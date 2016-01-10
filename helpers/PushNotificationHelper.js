/**
 * Created by shadygabal on 1/8/16.
 */


var pushNotificationHelper = (function() {
    var apn  = require("apn")

    var apnError = function(err){
        console.log("APN Error:", err);
    };

    var options = {
        "cert": "cert.pem",
        "key":  "key.pem",
        "passphrase": null,
        "gateway": "gateway.sandbox.push.apple.com",
        "port": 2195,
        "enhanced": true,
        "cacheLength": 5
    };
    options.errorCallback = apnError;

    var feedBackOptions = {
        "batchFeedback": true,
        "interval": 300
    };

    var apnConnection, feedback;

    var pushNotifier;

    apnConnection = new apn.Connection(options);
    console.log("initializing push notifier...");
    feedback = new apn.Feedback(feedBackOptions);
    feedback.on("feedback", function(devices) {
        devices.forEach(function(item) {
            console.log("FEEDBACK. item.device: " + item.device + "item.time: " + item.time);
            //TODO Do something with item.device and item.time;
        });
    });


    return {

        sendPushNotification : function (user, message) {
            if (user.deviceToken) {
                console.log("Sending " + message + " to " + user.firstName + "...");
                var myDevice, note;

                myDevice = new apn.Device(user.deviceToken);
                note = new apn.Notification();

                note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                note.badge = 1;
                //note.sound = "ping.aiff";
                note.alert = message;
                note.payload = {}; //additional info


                if (apnConnection) {
                    console.log("Pushing push notification...");
                    apnConnection.pushNotification(note, myDevice);
                }
            }
            else{
                console.log("Attempt to send push notification '" + message + "' failed because user '" + user.firstName + "' does not have a device token");
            }

        }
        //sendPushNotificationsForSoiree : function (soiree) {
        //    for(var i = 0; i < soiree._usersAttending.length; i++){
        //        var user = soiree._usersAttending[i];
        //        if (user.deviceToken){
        //            var message = "";
        //            this.sendPushNotification(user, message);
        //        }
        //    }
        //}

        }

}());

module.exports = pushNotificationHelper;


/*
usage
 pushNotifier = require("./pushNotifier");
 pushNotifier.init();
 //use valid device token to get it working
 pushNotifier.process({token:'', message:'Test message', from: 'sender'});

 */
