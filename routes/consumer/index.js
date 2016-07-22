/**
 * Created by shadygabal on 12/31/15.
 */
var express = require('express');
var router = express.Router();

var BetaSignupEmailList = require('app/db/BetaSignupEmailList');
var ResHelper = require('app/helpers/ResHelper.js');
var h = require('app/helpers/h');

function checkForList(){
    BetaSignupEmailList.findOne({}, function(err, list){
        if (err){console.log(err);}
        else if (!list){
            var newlist = new BetaSignupEmailList({});
            newlist.save(function(err2){
                console.log("New Beta Signup Email List saved with err " + err2);
            });
        };
    });
}

checkForList();


/* GET home page. */
router.get('/', function(req, res) {
    ResHelper.render(req, res, 'consumer/index', {});
});

router.get('/privacy-policy', function(req, res){
    ResHelper.render(req, res, 'consumer/privacyPolicy', {});
});

router.get('/deleteList', function(req, res){
    BetaSignupEmailList.remove({}, function(err){
        res.send("Completed with err : " + err);
        if (!err){
            checkForList();
        }
    });
});

router.post('/addEmail', function(req, res){
    var email = req.body.email;
    var gender = req.body.gender;
    var os = req.body.os;

    if (validateEmail(email) && gender && os){
        BetaSignupEmailList.addEmail(email, gender, os, function(){
            res.send("OK");
        }, function(err){
            console.log(err);
            res.status(404).send(err);
        });
    }
    else{
        res.status(404).send("InvalidEmail");
    }
});

function validateEmail(email) {
    if (!email) return false;
    email = email.trim();
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(email)){
        return true;
    }
    return false;
}

module.exports = router;