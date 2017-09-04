//enums
require('enum').register();

var express = require('express');
var app = express();
var Globals = require('app/helpers/Globals.js');
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
app.io = io;
Globals.io = io;

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
var MongoStore = require('connect-mongo')(session);

var facebookTokenStrategy = require('passport-facebook-token');

/* Database */
var mongoose = require('app/db/mongoose_connect.js');

var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');
var Business = require('app/db/Business.js');

var COOKIE_SECRET = "SoIrEE12IsAmAzIng";
var COOKIE_NAME = "cookie_name";
var SESSION_SECRET = "SeCreTMsGSoIrEe12";

var FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;


/**** Routes ****/
/* User Facing Routes */
var userIndex = require('./routes/consumer/index');

/* API Routes */
var soirees = require('./routes/api/soirees');
var soireeInProgress = require('./routes/api/soireeInProgress');
var users = require('./routes/api/users');
var businessesApi = require('./routes/api/businessesApi');
var questionnaire = require('./routes/api/questionnaire');
var community = require('./routes/api/community');
var verificationsApi = require('./routes/api/verificationsApi');
var notifications = require('./routes/api/notifications');
var reservations = require('./routes/api/reservations');

/* Admin Facing */
var admins = require('./routes/admins/admins.js');
var adminLogin = require('./routes/admins/adminLogin.js');
var businessLogin = require('./routes/businesses/businessLogin.js');
var verifications = require('./routes/admins/idVerifications.js');

/* Business Facing */
var businesses =  require('./routes/businesses/businesses.js');

/* Testing */
var testing = require('./routes/testing/testing.js');
var images =  require('./routes/images/images.js');
var showInProgress = require('./routes/testing/showInProgress.js');

/* Scheduled */
var soireeStarterStopper = require('./scheduled/soireeStarterStopper.js');
var soireeCreator = require('./scheduled/soireeCreator.js');
var soireeFeedbackNotifier = require('./scheduled/soireeFeedbackNotifier.js');

/* Schedules Cron Tasks that start and end soirees */
scheduleCron();

/****** SETUP VIEW ENGINE (hbs) ******/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.localsAsTemplateData(app);
var helpers = require('handlebars-helpers')({
    handlebars: hbs.handlebars
});

var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this)); // for older versions of handlebars, use block.push(context(this));
});
hbs.registerHelper('consoleLog', function(value){
    console.log(value);
});
hbs.registerHelper('add', function(val1, val2){
    var sum = val1 + val2;
    if(sum){
        return sum;
    }
    if(val1){
        return val1;
    }
    if(val2){
        return val2;
    }
    return 0;
});
hbs.registerHelper('dateStringFromDate', function(date){
    
    return date.toDateString();
})
hbs.registerHelper('sumReservations', function(reservations){
   var sum = 0;
    for(var i = 0; i < reservations.length; i++){
        sum += reservations[i].amount;
    }
    return sum;
});
hbs.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});
hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    // clear the block
    blocks[name] = [];
    return val;
});


/****** SETUP COOKIES/BODYPARSER ********/
// uncomment after placing your favicon in /public
app.use(favicon(__dirname + 'public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
//app.use(express.session({ cookie: { maxAge: 60000 }}));
app.use(express.static(path.join(__dirname, 'public')));


/********* SETUP PASSPORT AND SESSIONS *********/
app.use(session(
    {
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
            mongooseConnection: mongoose.connection,
            ttl: 365 * 24 * 60 * 60 // = 365 days
        })
    }
));


//express-session must be initialized BEFORE passport.session
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(function(req, res, next){
    //console.log('middleware: ' + res.locals);

    var error = req.flash('error');

    res.locals.success = req.flash('success');
    res.locals.error = error;
    if (req.business) res.locals.business = req.business;
    else if (req.admin) res.locals.admin = req.admin;

    next();
});

//console.log("APPID : " + FACEBOOK_APP_ID + " SECRET: " + FACEBOOK_APP_SECRET);

passport.use(new facebookTokenStrategy({
        accessTokenField : "facebook_access_token",
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        profileFields: ["id"]
        //passReqToCallback: true
    }, function(accessToken, refreshToken, profile, done) {
        console.log("accesstoken: " + accessToken + " refreshtoken: " + refreshToken + " fbuserid: " + profile.id);
        console.log(profile);

        User.findByFacebookUserId(profile.id, function (user) {
            if (user){
                console.log("passport use - found user");
            }
            else console.log("passport use - did not find user");

            return done(null, user);
        }, function(err){
            console.log(err);
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

passport.use('soiree-access-token', new LocalStrategy(
    {
        usernameField: 'username',
        passwordField : 'soiree_access_token'
    },
    function(username, accessToken, done) {
        User.findUserByEncodedSoireeAccessToken(username, accessToken, done);
    }
));

passport.use('user-pw', new LocalStrategy(
    {
        usernameField: 'username',
        passwordField : 'password'
    },
    function(email, password, done) {
        console.log("Validating user...");
        User.findOne({ email: email }).exec(function (err, user) {
            if (err) { return done(err); }
            else if (!user) {
                console.log("Incorrect email");
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            else{
                user.validatePassword(password, function(err, valid){
                    if (err){
                        console.log("Error validating password: " + err);
                        return done(err);
                    }
                    if (!valid) {
                        console.log("Incorrect pw");
                        return done(null, false, { message: 'Incorrect username or password.' });
                    }
                    else{
                        console.log("User validated.");
                        return done(null, user);
                    }
                });
            }

        });
    }
));


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    if (user.classType === 'admin'){
        Admin.findById(user._id, function(err, admin) {
            done(err, admin);
        });
    }
    else if (user.classType === 'business'){
        Business.findById(user._id, function(err, business) {
            done(err, business);
        });
    }
    else if (user.classType === 'user'){
        User.findOne({_id : user._id}).exec(function(err, _user){
            done(err, _user);
        });
    }
    else{
        done(null, false);
    }
});


//TEST BUSINESS EVENT SCHEDULING

var Event = require('app/db/Event.js');

app.get('/data', function(req, res){
    // Event.remove({}).exec(function(err){
    //     if(err){
    //         console.log(err);
    //     }
    // });

    Event.find({},function(err, data){
        //set id property for all records
       for (var i = 0; i < data.length; i++){
            data[i].id = data[i]._id;
        }

        //output response
        res.send(data);

    });
});

app.get('/defaultSchedule', function(req, res){
   Event.find({default : true}, function(err, data){
       if(err){
           console.log(err);
       }
       //set id property for all records
       for (var i = 0; i < data.length; i++){
           data[i].id = data[i]._id;
       }

       //output response
       res.send(data);
   });
});


app.post('/data', function(req, res){
    
   createOrUpdateEvent(req, res, false);
});

app.post('/saveDefaultEvent', function(req, res){
    createOrUpdateEvent(req, res, true);
});

function createOrUpdateEvent(req, res, isDefault){
    var data = req.body;

    //get operation type
    var mode = data["!nativeeditor_status"];
    //get id of record
    var sid = data.id;
    var tid = sid;

    //remove properties which we do not want to save in DB
    delete data.id;
    delete data.gr_id;
    delete data["!nativeeditor_status"];


    //output confirmation response
    function update_response(err, data){
        if (err)
            mode = "error";
        else if (mode == "inserted")
            tid = data._id;

        // data.id = data._id;

        res.setHeader("Content-Type","text/xml");
        res.send("<data><action type='"+mode+"' sid='"+sid+"' tid='"+tid+"'/></data>");
    }

    //run db operation
    var newEventSchema = {
        id : sid,
        start_date : data.start_date,
        end_date : data.end_date,
        text : data.text,
        details : data.details,
        default : isDefault
    };

    if(mode == 'deleted'){


        Res.send('Not supported operation');
    }
    else if(mode == 'inserted'){
        Event.findOneAndUpdate({start_date : data.start_date},newEventSchema,
            {
                upsert : true,
                new : true
            },
            function(err, event){
                if(err){
                    console.log(err);
                }
                update_response(err, event);
            });
    }
    else if(mode == 'updated'){
        Event.findOneAndUpdate({id : sid},newEventSchema,
            {
                new : true
            },
            function(err, event){
                if(err){
                    console.log(err);
                }
                update_response(err, event);
            });
    }
}

app.post('/findEventByStartDate',function(req, res){
    var startDates = req.body.startDates;
    var endDates = req.body.endDates;
    if(!startDates || !endDates){
        res.json({});
    }
    var numEvents = startDates.length;
    var callbackCounter = 0;
    var startDatesNotFound = [];
    var endDatesNotFound = [];
    var callback = function(){
        if(++callbackCounter == numEvents){
            res.json({"startDates" : startDatesNotFound, "endDates" : endDatesNotFound });
        }
    }
    for(var i = 0; i < startDates.length; i++){
        var startDate = startDates[i];
        var endDate = endDates[i];
        findEventsByStartDate(startDate, endDate, startDatesNotFound, endDatesNotFound, callback);
    }
});

function findEventsByStartDate(startDate, endDate, startDatesNotFound, endDatesNotFound, callback){
    Event.findOne({start_date : startDate}, function(err, event){
        if(err){
            console.log(err);
        }
        if(!event){
            startDatesNotFound.push(startDate);
            endDatesNotFound.push(endDate);
        }
        callback(err, event);
    });
}




/**************** Routes *****************/

/******* API ********/
app.use('/api/soirees', soirees);
app.use('/api/soirees/soireeInProgress', soireeInProgress);
app.use('/api/users', users);
app.use('/api/users/questionnaire', questionnaire);
app.use('/api/users/notifications', notifications);
app.use('/api/businesses', businessesApi);
app.use('/api/community', community);
app.use('/api/verifications', verificationsApi);
app.use('/api/reservations', reservations);



/****** Admins *******/

//middleware
app.use('/admins', Admin.checkIfLoggedIn);
app.use('/admin', Admin.checkIfLoggedIn);

//routers
app.use('/admins', admins);
app.use('/admin', admins);

app.use('/adminLogin', adminLogin);
app.use('/admins/verifications', verifications);
app.use('/admin/verifications', verifications);

app.use('/admins/testing', testing);
app.use('/admin/testing', testing);

app.use('/admins/testing/showInProgress', showInProgress);
app.use('/admin/testing/showInProgress', showInProgress);


/****** Businesses *******/

//middleware
app.use('/business', Business.checkIfLoggedIn);
app.use('/businesses', Business.checkIfLoggedIn);

//routers
app.use('/business', businesses);
app.use('/businesses', businesses);
app.use('/businessLogin', businessLogin);
app.use('/businessesLogin', businessLogin);


/****** Consumer *******/
//routers
app.use('/', userIndex);

app.use('/images', images);


/****** Testing *******/
//app.use('/testing', testing);
//app.use('/testing/showInProgress', showInProgress);


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
        //console.log(err.message);
        console.log(err.stack);

        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
else {
// production error handler
// no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: {}
        });
    });
}

function scheduleCron(){
    var cronExpression = '0 0-59/10 * * * *';
    var CronJob = require('cron').CronJob;

    try{
        new CronJob('0 0-59/10 * * * *', soireeStarterStopper, null, true, 'America/New_York');
        //new CronJob('0 1 0 * * *', soireeCreator, null, true, 'America/New_York');
        new CronJob('0 30 17 * * *', soireeFeedbackNotifier , null, true, 'America/New_York');
    }
    catch(err){
        console.log(err);
    }

}

app.set('etag', false); // turn off



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
//            options.layout = "consumerLayout.hbs";
//        }
//        else if (view.indexOf("businesses/") !== -1 && !options.layout){
//            options.layout = "consumerLayout.hbs";
//        }
//
//        // continue with original render
//        _render.call( this, view, options, fn );
//    }
//    next();
//});

module.exports = app;
