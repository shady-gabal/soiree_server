/**
 * Created by shadygabal on 1/17/16.
 */

var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var mongoose = require('app/db/mongoose_connect.js');
var Image = require('app/db/Image.js');
var Business = require('app/db/Business.js');
var User = require('app/db/User.js');
var Admin = require('app/db/Admin.js');

var DateHelper = require('app/helpers/DateHelper.js');
var ErrorCodes = require('app/helpers/ErrorCodes.js');


router.get('/:fileName', function(req, res){
    var fileName = req.params.fileName;
    console.log("/images called with fileName " + fileName);

    var path = Image.createPath('/images/' , fileName);

    Image.findOne({path : path}).exec(function(err, doc){
        if (err || !doc){
            console.log("Error: Image at path " + path + " not found with err " + err);
            res.status(404).send("");
        }
        else{
            if (doc.adminsOnly && !Admin.isLoggedIn(req)){
                res.status(404).send("");
            }
            else{
                res.contentType(doc.contentType);
                res.send(doc.data);
            }
        }
    });
});

router.get('/removeImages', function(req, res){
   Image.remove({}).exec(function(err){
     res.send("Completed with err: " + err);
   });
});

module.exports = router;
