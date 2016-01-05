var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');
var ResHelpers = require(helpersFolderLocation + 'ResHelpers.js');

var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');



/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/deleteSoirees', function(req,res){
   Soiree.remove({}, function(){
       res.send("Done");
   }) ;
});

router.get('/requestingSoirees', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        //number of unique requests per hour
        //base rate of 2 lunches, 2 dinners, 1 drinks, 2 blind dates per day
        //as soirees fill, create more
    }, function(err){

    });
});

router.get('/createSoirees', function(req, res){

    var numSoirees = req.query.numSoirees? req.query.numSoirees : 1;

    Business.nextBusinessToHostSoiree(function(nextBusiness) {
        if (!nextBusiness) {
            return res.status('404').send("Error");

        }

        var todaysDate = new Date();

        for (var i = 0; i < numSoirees; i++){

            var soireeTypes = Soiree.soireeTypes();

            var numDays = Math.random() * 7;
            var numHours = Math.random() * 24;
            var randSoireeTypeIndex = parseInt(Math.random() * soireeTypes.length);
            var soireeType = soireeTypes[randSoireeTypeIndex];
            var randNumUsersMax = parseInt(Math.random() * 3 + 2);
            var initialCharges = [100, 200, 300, 400, 500];
            var randInitialChargeIndex = parseInt(Math.random() * initialCharges.length);
            var randInitialCharge = initialCharges[randInitialChargeIndex];

            var date = new Date(todaysDate.getTime() + (numDays * 24 * 60 * 60 * 1000) + (numHours * 60 * 60 * 1000));

            Soiree.createSoiree({
                soireeType: soireeType,
                numUsersMax: randNumUsersMax,
                initialCharge: randInitialCharge,
                date: date
            }, nextBusiness, function(soiree){
                   console.log("Saved soiree: " + soiree.soireeId);
                }, function(err) {
                console.log("error saving soiree " + err);
            });

            //Soiree.createLunch(date, nextBusiness, function(soiree){
            //    console.log("Saved soiree");
            //    res.send("OK");
            //}, function(err){
            //    console.log("error saving soiree " + err);
            //});
        }


        res.send("OK");



        //Soiree.createSoiree({
        //    soireeType: "Lunch",
        //    numUsersMax: 3,
        //    initialCharge: 3,
        //    date: date
        //}, nextBusiness, function(){
        //       console.log("Saved soiree");
        //    }, function(err) {
        //    console.log("error saving soiree " + err);
        //});





        //var date2 = new Date(todaysDate.getTime() + (3 * 60 * 60 * 1000));
        //var soiree2 = new Soiree({
        //    soireeType: "Lunch",
        //    //numUsersAttending : {type: Number, default: 0},
        //    numUsersMax: 3,
        //    //soireeId: {type: ObjectId, default: function () { return new ObjectId()}},
        //    date: date2,
        //    //timeAtString : ,
        //    _usersAttending: [],
        //    _business: nextBusiness._id,
        //    location: nextBusiness.location
        //});
        //
        //soiree2.save(function () {
        //});
        //
        //
        //
        //var date3 = new Date(todaysDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        //var soiree3 = new Soiree({
        //    soireeType: "Dinner",
        //    //numUsersAttending : {type: Number, default: 0},
        //    numUsersMax: 2,
        //    //soireeId: {type: ObjectId, default: function () { return new ObjectId()}},
        //    date: date3,
        //    //timeAtString : ,
        //    _usersAttending: [],
        //    _business: nextBusiness._id,
        //    location: nextBusiness.location
        //});
        //
        //soiree3.save(function () {
        //});
        //
        //
        //
        //
        //var date4 = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        //var soiree4 = new Soiree({
        //    soireeType: "Drinks",
        //    numUsersMax: 4,
        //    date: date4,
        //    _usersAttending: [],
        //    _business: nextBusiness._id,
        //    location: nextBusiness.location
        //});
        //
        //soiree4.save(function () {
        //    res.send("OK");
        //});



    });


});


//Coupon.find({ location : { $near : coors}}).skip(numCouponsAlreadyLoaded).limit(numResultsRequested).exec(function(err, data){

router.post('/soireesNear', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        console.log("soirees near callback");


        //user.location = coors;
        //user.save(function(err){
        //   if (err){
        //       console.log("Error saving user's location in soireesNear");
        //   }
        //   else{
        //       console.log("Saved user's location in soireesNear");
        //   }
        //});

        Soiree.findSoirees(req, user, function(soirees){
            var dataToSend = [];
            for (var i = 0; i < soirees.length; i++){
                var soiree = soirees[i];
                dataToSend.push(soiree.jsonObject);
            }
            res.json(dataToSend);
        }, function(err){
            console.log("Error finding soirees near you: " +  err);
            ResHelpers.sendError(res, ErrorCodes.SoireeLoadError);
        });

    }, function(err){
        //console.log("Error finding soirees near you: " +  err);
        ResHelpers.sendError(res, ErrorCodes.SoireeLoadError);    });

});

router.get('/soireesNear', function(req, res){
    //User.verifyUser(req.query.user, function(user){
    //
    //    var longitude = req.query.user.longitude;
    //    var latitude = req.query.user.latitude;
    //    var coors = {type: "Point", coordinates: [longitude, latitude]};

        Soiree.find({ }).populate("_business").exec(function(err, soirees){
            if (err){
                console.log("Error finding soirees near you");
                res.type('text/plain');
                res.status('404').send("Error");
            }
            else {
                var dataToSend = [];
                for (var i = 0; i < soirees.length; i++){
                    var soiree = soirees[i];
                    dataToSend.push(soiree.jsonObject);
                }
                res.json(dataToSend);
            }
        });
    //}, function(err){
    //    res.status('404').send("Error finding user");
    //});

});

router.post('/joinSoiree', function(req, res, next){
    User.verifyUser(req, res, next, function(user){
        if (!user.hasStripeCustomerId){
            return ResHelpers.sendError(res, "MissingStripeCustomerId");
        }

        //var stripeToken = req.body.stripeToken;
        //
        //if (!stripeToken){
        //    return ResHelpers.sendError(res, "MissingStripeToken");
        //}

       var soireeId = req.body.soireeId;
       Soiree.joinSoireeWithId(soireeId, user, req, res);

   }, function(err){
        ResHelpers.sendMessage(res, 404, "error verifying user");
   });
});

//router.get('/soireesNear', function(req, res){
//    Soiree.find({}).populate("_business").exec(function(err, soirees){
//        if (err){
//            console.log("Error finding soirees near you");
//            res.status('404').send("Error");
//        }
//        else {
//            var dataToSend = [];
//            for (var i = 0; i < soirees.length; i++){
//                var soiree = soirees[i];
//                dataToSend.push(soiree.createDataObjectToSend());
//            }
//            res.json(dataToSend);
//        }
//    });
//});



//var soireeSchema = new Schema({
//    soireeType : {type: String, required: true, enum: soireeTypes},
//    numUsersAttending : {type: Number, default: 0},
//    numUsersMax: {type : Number, required: true},
//    soireeId: {type: String, unique: true, default: shortid.generate},
//    date: {type : Date, required: [true, "A date for the Soiree is required"]},
//    //timeAtString : {type : String},
//    _usersAttending : [{type : ObjectId, ref : "User"}],
//    _business: {type: ObjectId, ref:"Business", required :[true, "A business that will host is required to create this Soiree"]},
//    dateCreated : {type: Date, default: Date.now()}
//});


router.post('/soireeWithId', function(req, res) {

});

module.exports = router;
