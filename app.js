//local .env
require('dotenv').config({silent: true});
//enums
require('enum').register();

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var session = require('express-session');

var facebookTokenStrategy = require('passport-facebook-token');

/* Database */
var User = require('./db/User.js');
var Admin = require('./db/Admin.js');
var Business = require('./db/Business.js');

/* User Facing Routes */
var userIndex = require('./routes/consumer/index');

/* API Routes */
var soirees = require('./routes/api/soirees');
var users = require('./routes/api/users');
var businessesApi = require('./routes/api/businessesApi');
var questionnaire = require('./routes/api/questionnaire');
var community = require('./routes/api/community');
var verifications = require('./routes/api/verifications');


/* Admin Facing */
var admins = require('./routes/admins/admins.js');

/* Business Facing */
var businesses =  require('./routes/businesses/businesses.js');

var COOKIE_SECRET = "SoIrEE12IsAmAzIng";
var COOKIE_NAME = "cookie_name";
var SESSION_SECRET = "SeCreTMsGSoIrEe12";

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//app.use(express.session({ cookie: { maxAge: 60000 }}));
app.use(express.static(path.join(__dirname, 'public')));


 var sessionOptions = {
     secret: SESSION_SECRET,
     resave: true,
     saveUninitialized: true
 };

app.use(session(sessionOptions));


//express-session must be initialized BEFORE passport.session
//app.use(session({
//    secret: COOKIE_SECRET,
//    name: COOKIE_NAME,
//    //store: sessionStore, // connect-mongo session store
//    proxy: true,
//    resave: true,
//    saveUninitialized: true,
//    cookie: { maxAge: 60000 }
//    })
//);
//app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


//console.log("APPID : " + FACEBOOK_APP_ID + " SECRET: " + FACEBOOK_APP_SECRET);

passport.use(new facebookTokenStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        profileFields: ["id"]
        //passReqToCallback: true
    }, function(accessToken, refreshToken, profile, done) {
        //console.log("accesstoken: " + accessToken + " refreshtoken: " + refreshToken + " fbuserid: " + profile.id);
        //console.log(profile);

        User.findByFacebookUserId(profile.id, function (user) {
            console.log("passport use - found user");
            return done(null, user);
        }, function(err){
            console.log("passport use - did not find user");
            return done(err, null);
        });

    }
));

passport.use('admin', new LocalStrategy(
        {
            usernameField: 'email'
        },
        function(email, password, done) {
            console.log("Validating admin...");
            Admin.findOne({ email: email }, function (err, admin) {
                if (err) { return done(err); }
                else if (!admin) {
                    console.log("Incorrect email");
                    return done(null, false, { message: 'Incorrect username or password.' });
                }
                else{
                    admin.validatePassword(password, function(err, valid){
                        if (err){
                            console.log("Error validating password: " + err);
                            return done(err);
                        }
                        if (!valid) {
                            console.log("Incorrect pw");
                            return done(null, false, { message: 'Incorrect username or password.' });
                        }
                        else{
                            console.log("Admin validated.");
                            return done(null, admin);
                        }
                    });
                }

            });
         }
));

passport.use('business', new LocalStrategy(
    {
        usernameField: 'email'
    },
    function(email, password, done) {
        console.log("Validating business...");
        Business.findOne({ email: email }, function (err, business) {
            if (err) { return done(err); }
            else if (!business) {
                console.log("Incorrect email");
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            else{
                business.validatePassword(password, function(err, valid){
                    if (err){
                        console.log("Error validating password: " + err);
                        return done(err);
                    }
                    if (!valid) {
                        console.log("Incorrect pw");
                        return done(null, false, { message: 'Incorrect username or password.' });
                    }
                    else{
                        console.log("Business validated.");
                        return done(null, business);
                    }
                });
            }

        });
    }
));


passport.serializeUser(function(user, done) {
    console.log("serializing...");
    //if (user.prototype == Admin.prototype){
        done(null, user);
    //}
    //console.log('serializing user ' + user);
});

passport.deserializeUser(function(user, done) {
    //console.log("deserializing: " + JSON.stringify(user) + "   prototype: " + Object.getPrototypeOf(user).constructor.name + "   constructor: " + user.constructor.name);
    //console.log("user.id: " + user.id + " user._id: " + user._id);
    if (user.classType === 'admin'){
        Admin.findById(user._id, function(err, admin) {
            console.log("found admin:" + admin + " with err " + err);
            done(err, admin);
        });
    }
    else if (user.classType === 'business'){
        Business.findById(user._id, function(err, business) {
            console.log("found business:" + business + " with err " + err);
            done(err, business);
        });
    }
    else{
        done(null, false);
    }
    //Admin.findById(id, function(err, user) {
    //    done(err, user);
    //    console.log("found admin:"  +user);
    //});
});

/* Routes */

//API
app.use('/api/soirees', soirees);
app.use('/api/users', users);
app.use('/api/users/questionnaire', questionnaire);
app.use('/api/businesses', businessesApi);
app.use('/api/community', community);
app.use('/api/verifications', verifications);

//Admins
app.use('/admins', admins);

//Businesses
app.use('/businesses', businesses);

//Consumer
app.use('/', userIndex);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
