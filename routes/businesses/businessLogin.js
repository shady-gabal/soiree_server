var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcrypt');

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');

var ResHelper = require('app/helpers/ResHelper.js');
var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');

router.get('/', function(req, res){
    ResHelper.render(req, res, 'businesses/login', { });
});


router.get('/createBusiness', function(req, res){
    var email = req.query.email;
    var password = req.query.password;

    var longitude = 40.762755;
    var latitude = -73.882201;

    var businessObj = {
        businessType : "Bar",
        //_soirees : [],
        businessName : "Paddy's Pub",
        phoneNumber : '3472102276',
        generalArea: "SoHo",
        location : {type: "Point", coordinates:[longitude, latitude]},
        email: "shady@wearethirdrail.com",
        password: "9701"
    };

    Business.createBusiness(businessObj, email, password, function(business){
        res.send("Created business: " + business);
    }, function(err){
        res.send("Error creating business: " + err);
    });
});
//
router.get('/createBusinesses', function(req, res){
    var longitude = 40.762755;
    var latitude = -73.882201;

    var business = new Business({
        businessType : "Bar",
        _soirees : [],
        businessName : "Paddy's Pub",
        generalArea: "SoHo",
        location : {type: "Point", coordinates:[longitude, latitude]}
    });

    business.save(function(){
        res.send("Complete");
    });
});





//router.get('/deleteBusinesses', function(req, res){
//    Admin.remove({}, function(err){
//        res.send("Removed admins with err: " +err);
//    });
//});

router.post('/', function(req, res, next){
    passport.authenticate( 'business', { successReturnToOrRedirect: '/businesses/', failureRedirect: '/businesses/login', failureFlash: false}, function(err, user, info){

        if (err) return next(err);
        if (!user) { return res.redirect('/businesses/login'); }

        req.login(user, function(err) {
            if (err) { return next(err); }
            if (req.session.returnTo){
                var returnTo = req.session.returnTo;
                req.session.returnTo = null;
                return res.redirect(returnTo);
            }
            return res.redirect('/businesses/');
        });

    })(req, res, next);
});

module.exports = router;