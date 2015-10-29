/**
 * Created by shadygabal on 10/24/15.
 */

var soireeHelpers = (function() {
    var DateHelpers = require("./DateHelpers.js");

    return {
        createDataObjectFromSoiree: function (soiree) {
            //var timeIntervalSince1970InSeconds = soiree.date.getTime() / 1000;
            //
            //var obj = {
            //    "soireeType": soiree.soireeType,
            //    "numUsersAttending": soiree.numUsersAttending,
            //    "numUsersMax": soiree.numUsersMax,
            //    "date": timeIntervalSince1970InSeconds,
            //    "soireeId": soiree.soireeId,
            //    "businessName": soiree._business.businessName
            //};
            //return obj;
        }
    }
}());

module.exports = soireeHelpers;
