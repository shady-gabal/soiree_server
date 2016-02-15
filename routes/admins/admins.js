/**
 * Created by shadygabal on 1/13/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var passport = require('passport');
var bcrypt = require('bcrypt');

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var Admin = require(dbFolderLocation + 'Admin.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

//
//router.get('/login', function(req, res){
//    res.render('admins/login', { title: 'Express' });
//});
//
//
//router.get('/createAdmin', function(req, res){
//    var email = req.query.email;
//    var password = req.query.password;
//
//    var adminObj = {
//        firstName : "Shady",
//        lastName : "Gabal",
//        phoneNumber : "3472102276"
//    };
//
//    Admin.createAdmin(adminObj, email, password, function(admin){
//        res.send("Created admin: " + admin);
//    }, function(err){
//        res.send("Error creating admin: " + err);
//    });
//});
//
//
//router.get('/deleteAdmins', function(req, res){
//   Admin.remove({}, function(err){
//       res.send("Removed admins with err: " +err);
//   });
//});
//
//router.post('/login', function(req, res, next){
//    passport.authenticate( 'admin', { successRedirect: '/admins/', failureRedirect: '/admins/login', failureFlash: false}, function(err, user, info){
//
//        if (err) return next(err);
//        if (!user) { return res.redirect('/admins/login'); }
//
//        req.login(user, function(err) {
//            if (err) { return next(err); }
//            return res.redirect('/admins/');
//        });
//
//    })(req, res, next);
//});



/****** ******/
/* Everything below here will require the admin to be logged in */
/****** ******/

/* Logged In Check Middleware */
/*** ****/

router.use(function(req, res, next){
    if (!Admin.isLoggedIn(req)){
        res.redirect('/admins/login');
    }
    else{
        if (!res.locals.admin)
            req.admin = req.user;
        next();
    }
});

router.get('/',  function(req, res){
    ResHelper.render(req, res, 'admins/index', { title: 'The Admin Dashboard'} );
    //res.render('admins/index', { title: 'The Admin Dashboard', adminFirstName: req.user.firstName });
});

router.get('/registerBusiness', function(req, res){
    ResHelper.render(req, res, 'admins/registerBusiness', { } );

    //res.render('admins/registerBusiness', { admin: req.admin });
});

router.post('/registerBusiness', function(req, res){
    console.log(req.body);
    res.send("OK");
});







function loggedInRedundantCheck(req, res){
    if (Admin.isLoggedIn(req)){
        return true;
    }
    else{
        res.status(401).send("Unauthorized. The FBI has been notified.");
        console.log("Unauthorized access attempted");
        return false;
    }
};

//function isLoggedIn(req) {
//    if (req.user && req.user.classType === 'admin') {
//        return true;
//    }
//    return false;
//}

function checkIfLoggedIn(req, res, next){
    if (Admin.isLoggedIn(req)){
        next();
    }
    else{
        res.status(401).send("Unauthorized. The FBI has been notified.");
        console.log("Unauthorized access attempted - admins");
        //return false;
    }
};


module.exports = router;
