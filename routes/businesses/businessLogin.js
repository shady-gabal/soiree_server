var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcrypt');

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var Admin = require(dbFolderLocation + 'Admin.js');

var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

router.get('/', function(req, res){
    ResHelper.render(req, res, 'businesses/login', { title: 'Express' });
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
        cityArea: "SoHo",
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
        cityArea: "SoHo",
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
    passport.authenticate( 'business', { successRedirect: '/businesses/', failureRedirect: '/businesses/login', failureFlash: false}, function(err, user, info){

        if (err) return next(err);
        if (!user) { return res.redirect('/businesses/login'); }

        req.login(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/businesses/');
        });

    })(req, res, next);
});

module.exports = router;