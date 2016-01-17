/**
 * Created by shadygabal on 1/17/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var Image = require(dbFolderLocation + 'Image.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');

var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');


router.get('/:fileName', function(req, res){
    var fileName = req.params.fileName;
    console.log("/images called with fileName " + fileName);

    Image.findOne({fileName : fileName}).exec(function(err, doc){
        if (err || !doc){
            res.status(404).send("");
        }
        else{
            console.log("doc.contentType: "+ doc.contentType);
            res.contentType(doc.contentType);
            res.send(doc.data);
        }
    });
});

module.exports = router;
