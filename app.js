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
var hbs = require('hbs');

var facebookTokenStrategy = require('passport-facebook-token');

/* Database */
var User = require('./db/User.js');
var Admin = require('./db/Admin.js');
var Business = require('./db/Business.js');

var COOKIE_SECRET = "SoIrEE12IsAmAzIng";
var COOKIE_NAME = "cookie_name";
var SESSION_SECRET = "SeCreTMsGSoIrEe12";

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

var app = express();

var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
app.io = io;

/**** Routes ****/
/* User Facing Routes */
var userIndex = require('./routes/consumer/index');
/* API Routes */
var soirees = require('./routes/api/soirees')(io);
var soireeInProgress = require('./routes/api/soireeInProgress')(io);
var users = require('./routes/api/users');
var businessesApi = require('./routes/api/businessesApi');
var questionnaire = require('./routes/api/questionnaire');
var community = require('./routes/api/community');
var verificationsApi = require('./routes/api/verificationsApi');
/* Admin Facing */
var admins = require('./routes/admins/admins.js');
var adminLogin = require('./routes/admins/adminLogin.js');
var businessLogin = require('./routes/businesses/businessLogin.js');
var verifications = require('./routes/admins/idVerifications.js');
/* Business Facing */
var businesses =  require('./routes/businesses/businesses.js');
/* Testing */
var testing = require('./routes/testing/testing.js')(io);
/* Resource Serving */
var images =  require('./routes/images/images.js');

/****** SETUP VIEW ENGINE (hbs) ******/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});

/****** SETUP COOKIES/BODYPARSER ********/
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//app.use(express.session({ cookie: { maxAge: 60000 }}));
app.use(express.static(path.join(__dirname, 'public')));


/********* SETUP PASSPORT AND SESSIONS *********/
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
        Business.findOne({ email: email }).deepPopulate("_unconfirmedReservations").exec(function (err, business) {
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
            //console.log("found admin:" + admin + " with err " + err);
            done(err, admin);
        });
    }
    else if (user.classType === 'business'){
        Business.findById(user._id, function(err, business) {
            //console.log("found business:" + business + " with err " + err);
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

/**************** Routes *****************/

/******* API ********/
app.use('/api/soirees', soirees);
app.use('/api/soireeInProgress', soireeInProgress);
app.use('/api/users', users);
app.use('/api/users/questionnaire', questionnaire);
app.use('/api/businesses', businessesApi);
app.use('/api/community', community);
app.use('/api/verifications', verificationsApi);

/****** Admins *******/

//middleware
app.use('/admins', Admin.checkIfLoggedIn);

//routers
app.use('/admins', admins);
app.use('/adminLogin', adminLogin);
app.use('/admins/verifications', verifications);

/****** Businesses *******/

//middleware
app.use('/businesses', Business.checkIfLoggedIn);

//routers
app.use('/businesses', businesses);
app.use('/businessLogin', businessLogin);


/****** Consumer *******/
//routers
app.use('/', userIndex);

app.use('/images', images);


/****** Testing *******/
app.use('/testing', testing);



/********* ERROR HANDLERS **********/
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


//var  http = require("http")
//    , response = http.ServerResponse.prototype
//    , _render = response.render;

//override res.render
//app.use(function(req, res, next){
//    console.log("res.render overriden successfully");
//    // grab reference of render
//    var _render = express.response.render;
//    // override logic
//    express.response.render = function(view, options, fn ) {
//        console.log("rendering over");
//        // do some custom logic
//        //if (req.admin && !options.admin){
//        //    options.admin = req.admin;
//        //}
//        //else if (req.business && !options.business){
//        //    options.business = req.business;
//        //}
//        //else if (req.user && !options.user){
//        //    options.user = req.user;
//        //}
//
//        if (view.indexOf("admins/") !== -1 && !options.layout){
//            options.layout = "layout.hbs";
//        }
//        else if (view.indexOf("businesses/") !== -1 && !options.layout){
//            options.layout = "layout.hbs";
//        }
//
//        // continue with original render
//        _render.call( this, view, options, fn );
//    }
//    next();
//});


module.exports = app;
