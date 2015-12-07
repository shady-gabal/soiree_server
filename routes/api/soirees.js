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

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/deleteSoirees', function(req,res){
   Soiree.remove({}, function(){
       res.send("Done");
   }) ;
});

router.get('/createSoirees', function(req, res){

    Business.nextBusinessToHostSoiree(function(nextBusiness) {
        if (!nextBusiness) {
            return res.status('404').send("Error");

        }

        var todaysDate = new Date();

        var date = new Date(todaysDate.getTime() + (1 * 24 * 60 * 60 * 1000));
        var soiree = new Soiree({
            soireeType: "Lunch",
            //numUsersAttending : {type: Number, default: 0},
            numUsersMax: 3,
            //soireeId: {type: ObjectId, default: function () { return new ObjectId()}},
            date: date,
            //timeAtString : ,
            _usersAttending: [],
            _business: nextBusiness._id
            //dateCreated : {type: Date, default: Date.now()}
        });

        soiree.save(function () {
        });





        var date2 = new Date(todaysDate.getTime() + (3 * 60 * 60 * 1000));
        var soiree2 = new Soiree({
            soireeType: "Lunch",
            //numUsersAttending : {type: Number, default: 0},
            numUsersMax: 3,
            //soireeId: {type: ObjectId, default: function () { return new ObjectId()}},
            date: date2,
            //timeAtString : ,
            _usersAttending: [],
            _business: nextBusiness._id
            //dateCreated : {type: Date, default: Date.now()}
        });

        soiree2.save(function () {
        });



        var date3 = new Date(todaysDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        var soiree3 = new Soiree({
            soireeType: "Dinner",
            //numUsersAttending : {type: Number, default: 0},
            numUsersMax: 2,
            //soireeId: {type: ObjectId, default: function () { return new ObjectId()}},
            date: date3,
            //timeAtString : ,
            _usersAttending: [],
            _business: nextBusiness._id
            //dateCreated : {type: Date, default: Date.now()}
        });

        soiree3.save(function () {
        });




        var date4 = new Date(todaysDate.getTime() + (7 * 24 * 60 * 60 * 1000));
        var soiree4 = new Soiree({
            soireeType: "Drinks",
            //numUsersAttending : {type: Number, default: 0},
            numUsersMax: 4,
            //soireeId: {type: ObjectId, default: function () { return new ObjectId()}},
            date: date4,
            //timeAtString : ,
            _usersAttending: [],
            _business: nextBusiness._id
            //dateCreated : {type: Date, default: Date.now()}
        });

        soiree4.save(function () {
            res.send("OK");
        });



    });


});


//Coupon.find({ location : { $near : coors}}).skip(numCouponsAlreadyLoaded).limit(numResultsRequested).exec(function(err, data){

router.post('/soireesNear', function(req, res){
    User.verifyUser(req.body.user, function(user){

        var longitude = req.body.user.longitude;
        var latitude = req.body.user.latitude;
        var coors = {type: "Point", coordinates: [longitude, latitude]};

        Soiree.findNearestSoirees(coors, function(err, soirees){
            if (err){
                console.log("Error finding soirees near you");
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
    }, function(err){
        res.status('404').send("Error finding user");
    });

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

router.post('/joinSoiree', function(req, res){
   User.verifyUser(req.body.user, function(user){
       var soireeId = req.body.soireeId;

       Soiree.findBySoireeId(soireeId, function(soiree){
           soiree.join(user);
       }, function(err){
           res.status('404').send("Error finding soiree");
       });

   }, function(err){
       res.status('404').send("Error verifying user");
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
