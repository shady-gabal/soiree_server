/**
 * Created by shadygabal on 10/24/15.
 */
var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soirees/Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');



router.get('/createBusinesses', function(req, res){
    var longitude = 40.762755;
    var latitude = -73.882201;

   var business = new Business({
       businessType : "Bar",
       _soirees : [],
       businessName : "Paddy's Pub",
       cityArea: "SoHo",
       location : {type: "Point", coordinates:[longitude, latitude]}
   });

    business.save(function(){
        res.send("Complete");
    });
});

router.get('/businessWithName', function(req, res){
    var name = req.query.name;
    if (name){
        var query = Business.where({'businessName' : name});
        query.findOne(function(err, obj){
           if (err){
               console.log("Error finding business with name: " + name);
           }
            else{
               if (obj) {
                   console.log("Found business with name: " + name);
                   console.log(obj);
               }
               else{
                   console.log("No business with name " + name);
               }
           }
        });
    }
});

module.exports = router;

/*

 var businessSchema = new Schema({
 businessType : {type: String, enum: businessTypes},
 businessName,
 businessId: {type: ObjectId, default: function () { return new ObjectId()}},
 _soirees : [{type: ObjectId, ref:"Soiree"}],
 dateCreated : {type: Date, default: Date.now()},
 dateUpdated : {type: Date, default: Date.now()}
 });


 */