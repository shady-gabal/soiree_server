/**
 * Created by shadygabal on 10/24/15.
 */
var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require('app/db/mongoose_connect.js');
var Soiree = require('app/db/Soiree.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');
var Globals = require('app/helpers/Globals.js');


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