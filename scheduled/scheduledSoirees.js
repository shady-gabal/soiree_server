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


