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
var passport = require('passport');
var facebookTokenStrategy = require('passport-facebook-token');


/* User Facing Routes */
var userIndex = require('./routes/user facing/index');

/* API Routes */
var soirees = require('./routes/api/soirees');
var users = require('./routes/api/users');
var businesses = require('./routes/api/businesses');
var questionnaire = require('./routes/api/questionnaire');
var community = require('./routes/api/community');
var verifications = require('./routes/api/verifications');

var User = require('./db/User.js');

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
app.use(express.static(path.join(__dirname, 'public')));


// passport
var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

app.use(passport.initialize());
app.use(passport.session());


//console.log("APPID : " + FACEBOOK_APP_ID + " SECRET: " + FACEBOOK_APP_SECRET);

passport.use(new facebookTokenStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        profileFields: ["id"]
        //passReqToCallback: true
    }, function(accessToken, refreshToken, profile, done) {
        console.log("accesstoken: " + accessToken + " refreshtoken: " + refreshToken + " fbuserid: " + profile.id);
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

//passport.serializeUser(function(user, done) {
//    done(null, user);
//});
//
//passport.deserializeUser(function(user, done) {
//    done(null, user);
//});


/* Routes */

//API
app.use('/api/soirees', soirees);
app.use('/api/users', users);
app.use('/api/users/questionnaire', questionnaire);
app.use('/api/businesses', businesses);
app.use('/api/community', community);
app.use('/api/verifications', verifications);

//Customer Facing
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
