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


router.get('/', function(req, res){
    if (Admin.isLoggedIn(req)){
        Image.find({}, function(err, images){
           if (err){
               console.log("Error: err");
               res.send("Error");
           }
            else{
               res.render("images/index", {images:images});
           }
        });
    }
    else{
        res.redirect('/adminLogin');
    }
});

router.get('/removeImages', function(req, res){
    Image.remove({}).exec(function(err){
        res.send("Completed with err: " + err);
    });
});

router.get('/:directory/:fileName', function(req, res){
    findImage(req, res);
});

router.get('/:fileName', function(req, res){
    findImage(req, res);
});

function findImage(req, res){
    var directory = req.params.directory ? req.params.directory : "/";
    var fileName = req.params.fileName;
    if (!fileName || !directory){
        return res.status(404).send("Not Found");
    }

    console.log("/images called with directory " + directory + " fileName " + fileName);

    var path = Image.createPath(directory , fileName);

    Image.findOne({path : path}).exec(function(err, doc){
        if (err || !doc){
            console.log("Error: Image at path " + path + " not found with err " + err);
            res.status(404).send("");
        }
        else{
            //console.log(req);

            //if (doc.adminsOnly && !Admin.isLoggedIn(req)){
            //    console.log("admin not logged in - can't show image");
            //    res.status(404).send("");
            //}
            //else{
                console.log("sending image...");

                req.headers['if-none-match'] = 'no-match-for-this';
                res.contentType(doc.contentType);
                res.status(200).send(doc.data);
            //}
        }
    });
};

module.exports = router;
