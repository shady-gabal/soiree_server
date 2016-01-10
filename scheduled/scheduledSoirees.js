/**
 * Created by shadygabal on 12/11/15.
 */
var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Soiree = require(dbFolderLocation + 'Soiree.js');



var scheduledTimeIdentifier = Soiree.createScheduledTimeIdentifier();

Soiree.findSoireesWithScheduledTimeIdenfitier(scheduledTimeIdentifier, function(soirees){
    for (var i = 0; i < soirees.length; i++){
        var soiree = soirees[i];

        soiree.start();
    }
}, function(err){
   console.log("Error in scheduledSoirees: " + err);
});
