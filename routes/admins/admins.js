/**
 * Created by shadygabal on 1/13/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var passport = require('passport');
var bcrypt = require('bcrypt');

var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ResHelper = require('app/helpers/ResHelper.js');
var LocationHelper = require('app/helpers/LocationHelper.js');
var IDGeneratorHelper = require('app/helpers/IDGeneratorHelper.js');

var ErrorCodes = require('app/helpers/ErrorCodes.js');
var Globals = require('app/helpers/Globals.js');
var ErrorHelper = require('app/helpers/ErrorHelper.js');
var EmailHelper = require('app/helpers/EmailHelper.js');

/****** ******/
/* Everything below here will require the admin to be logged in */
/****** ******/

/* Logged In Check Middleware */
/*** ****/

router.use(function(req, res, next){
    if (!Admin.isLoggedIn(req)){
        res.redirect('/adminLogin');
    }
    else{
        if (!req.admin) {
            req.admin = req.user;
            res.locals.admin = req.user;
        }
        next();
    }
});

router.get('/',  function(req, res){
    ResHelper.render(req, res, 'admins/index', { title: 'The Admin Dashboard'} );
    //res.render('admins/index', { title: 'The Admin Dashboard', adminFirstName: req.user.firstName });
});

router.get('/createSoiree', function(req, res){
    Business.find({}).deepPopulate("_approvedBy").exec(function(err, businesses){
        if (err){
            console.log(err);
            res.status(404).send(err);
        }
        else{

            ResHelper.render(req, res, 'admins/createSoiree', {soireeTypes : Globals.soireeTypes, businesses : businesses});
        }
    });
});

router.post('/createSoiree', function(req, res){
    console.log(req.body);
    var title = req.body.soireeTitle;
    var numUsersMax = req.body.numUsersMax;
    var numUsersMin = req.body.numUsersMin;
    var soireeType = req.body.soireeType;
    var day = req.body.day;
    var time = req.body.time;

    var date = DateHelper.dateFromFormat(day + " " + time, "YYYY-MM-DD hh:mm a");

    var businessId = req.body.businessId;
    Business.findOne({businessId : businessId}).exec(function(err, business){
        if(err){
            console.log(err);
            return res.redirect('/admins/createSoiree');
        }
        business.soireeTypes = soireeType;
         Soiree.createSoireeWithType(soireeType, function(soiree){
            return res.redirect('/admins/testing');
        }, function(err){
            console.log(err);
            var errors = ErrorHelper.errorMessagesFromError(err);
            req.flash('error', errors);
            return res.redirect('/admins/createSoiree');
        }, {
            title: title,
            numUsersMax: numUsersMax,
            numUsersMin: numUsersMin,
            business: business,
            date: date
        });
    });

    var currErrors = [];
    if (!soireeType){
        currErrors.push("Must choose a soiree type");
    }
    if(!title){
        currErrors.push("Must Pick A Title");
    }
    if (!numUsersMax){
        currErrors.push("Must Pick How Many Users To Allow");
    }
    if(!numUsersMin){
        currErrors.push("Must Pick How Many Users Are Needed");
    }
    if (!businessId){
        currErrors.push("Must Pick A Business");
    }
    if(!day){
        currErrors.push("Must Pick A Day");
    }
    if(!time){
        currErrors.push("Must Pick A Time");
    }
    if (currErrors.length > 0){
        req.flash('error', currErrors);
        return res.redirect('/admins/createSoiree');
    }
});

router.get('/registerBusiness', function(req, res){
    //console.log(res.locals);
    ResHelper.render(req, res, 'admins/registerBusiness', {soireeTypes: Globals.soireeTypes, businessTypes : Globals.businessTypes, mapsAPIKey : process.env.GOOGLE_MAPS_API_KEY});
});

router.post('/registerBusiness', function(req, res){

    var email = req.body.email;
    var password = IDGeneratorHelper.generateId(8, {onlyLowercase: true});
    //var password = req.body.password;
    var businessName = req.body.businessName;
    var description = req.body.description;
    var phoneNumber = req.body.phoneNumber;
    var longitude = req.body.longitude;
    var latitude = req.body.latitude;
    var address = req.body.address;
    var soireeTypes = req.body.soireeTypes;
    var generalArea = req.body.generalArea;
    var businessType = req.body.businessType;

    var currErrors = [];
    if (!soireeTypes || soireeTypes.length === 0){
        currErrors.push("Must choose at least one soiree type");
    }
    if (!email){
        currErrors.push("Email address required");
    }
    if (!businessType){
        currErrors.push("Must select a business type");
    }
    else if (!EmailHelper.validateEmail(email)){
        currErrors.push("Email address invalid");
    }
    if (!password){
        currErrors.push("Password required");
    }
    if (currErrors.length > 0){
        req.flash('error', currErrors);
        return res.redirect('/admins/registerBusiness');
    }


    var coordinate = LocationHelper.createPoint({longitude : longitude, latitude: latitude});

    Business.createBusiness({
        businessName : businessName,
        description : description,
        phoneNumber : phoneNumber,
        location : coordinate,
        address : address,
        soireeTypes : soireeTypes,
        generalArea : generalArea
    }, email, password, req.admin, function(business){
        res.redirect("/admins/");
    }, function(err){
        //console.log(err);
        var errors = ErrorHelper.errorMessagesFromError(err);
        req.flash('error', errors);
        res.redirect('/admins/registerBusiness');
    });

});

router.get('/viewBusinesses', function(req, res){
    Business.find({}).deepPopulate("_approvedBy").exec(function(err, businesses){
        if (err){
            console.log(err);
            res.status(404).send(err);
        }
        else{
            ResHelper.render(req, res, 'admins/viewBusinesses', {businesses : businesses});
        }
    });
});

router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/adminLogin');
});



module.exports = router;
