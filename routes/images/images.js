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
    console.log(req.user);

    var path = Image.createPath('/images/' , fileName);

    Image.findOne({path : path}).exec(function(err, doc){
        if (err || !doc){
            res.status(404).send("");
        }
        else{
            console.log("doc : "+ doc);
            res.contentType(doc.contentType);
            res.send(doc.data);
        }
    });
});

router.get('/removeImages', function(req, res){
   Image.remove({}).exec(function(err){
     res.send("Completed with err: " + err);
   });
});

module.exports = router;
