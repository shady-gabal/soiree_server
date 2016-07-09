var User = require('app/db/User');

var testGlobals = {
    findTestUser: function (done) {
        User.findOrCreateTestUser(function (user, encodedToken) {
            this.user = user;

            var obj = user.jsonObject();
            obj.latitude = 40.7128;
            obj.longitude = 74;
            obj.soiree_access_token = encodedToken;

            this.userParams = obj;

            done();
        }, function (err) {
            done(err);
        });
    }
};

module.exports = testGlobals;