/**
 * Created by shadygabal on 12/1/15.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var fs = require('fs');
var multer = require('multer');


var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');

router.post('/verify', function(req, res){

});

module.exports = router;
