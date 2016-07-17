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




//router.get('/deleteBusinesses', function(req, res){
//    Admin.remove({}, function(err){
//        res.send("Removed admins with err: " +err);
//    });
//});

router.post('/', function(req, res, next){
    passport.authenticate( 'business', { successReturnToOrRedirect: '/businesses/', failureRedirect: '/businessLogin', failureFlash: false}, function(err, user, info){

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