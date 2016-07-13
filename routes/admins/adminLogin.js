/**
 * Created by shadygabal on 2/8/16.
 */

var express = require('express');
var router = express.Router();

var passport = require('passport');
var bcrypt = require('bcrypt');

var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');

var ResHelper = require('app/helpers/ResHelper.js');
var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');


router.get('/', function(req, res){
    ResHelper.render(req, res, 'admins/login', {});
});

router.post('/', function(req, res, next){
    passport.authenticate( 'admin', { successReturnToOrRedirect: '/admins/', failureRedirect: '/adminLogin', failureFlash: false}, function(err, user, info){

        if (err) return next(err);
        if (!user) { return res.redirect('/adminLogin'); }

        req.login(user, function(err) {
            if (err) { return next(err); }
            if (req.session.returnTo){
                var returnTo = req.session.returnTo;
                req.session.returnTo = null;
                return res.redirect(returnTo);
            }
            return res.redirect('/admins/');
        });

    })(req, res, next);
});



router.get('/createAdmin', function(req, res){
    var email = "shady@experiencesoiree.com";
    var password = "Amir9701";

    var adminObj = {
        firstName : "Shady",
        lastName : "Gabal",
        phoneNumber : "3472102276"
    };

    Admin.createAdmin(adminObj, email, password, function(admin){
        res.send("Created admin: " + admin);
    }, function(err){
        res.send("Error creating admin: " + err);
    });
});

module.exports = router;
