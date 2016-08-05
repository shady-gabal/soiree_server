/**
 * Created by shadygabal on 12/31/15.
 */
var express = require('express');
var router = express.Router();

var BetaSignupEmailList = require('app/db/BetaSignupEmailList');
var ResHelper = require('app/helpers/ResHelper.js');
var h = require('app/helpers/h');

var Handlebars = require('hbs').handlebars;

var CreditCardHelper = require('app/helpers/CreditCardHelper');
var btGateway = require('app/misc/braintreeGateway');
var braintree = require('braintree');
var ConfirmationCodesList = require('app/db/ConfirmationCodesList');
var EmailHelper = require('app/helpers/EmailHelper');

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

router.get('/party', function(req, res){
    CreditCardHelper.generateBrainTreeClientToken(function(token){
        ResHelper.render(req, res, "consumer/soireeCheckout", {clientToken : new Handlebars.SafeString( token)});
    }, function(){
       res.send("Oops! Looks like there is too much demand for this webpage, and the server is having trouble keeping up. Please try again later.");
    });

});

router.post('/party', function(req, res){
    var nonce = req.body.payment_method_nonce;
    var email = req.body.email;

    btGateway.transaction.sale({
        amount: 21.00,
        paymentMethodNonce : nonce,
        customer : {
            email : email
        }
    }, function(err, result){
        if (err){
            console.log(err);
            res.redirect('/party');
        }
        else{
            ConfirmationCodesList.createConfirmationCode(email, function(code){
                EmailHelper.sendEmailReservationConfirmation(email, code, function(){
                    ResHelper.render(req, res, 'consumer/soireeCheckoutFinish', {code : code});
                }, function(){
                    ResHelper.render(req, res, 'consumer/soireeCheckoutFinish', {code : code});
                });

            }, function(err){
                res.redirect('/party');
            });
        }
    });
});

router.get('/party/finish', function(req, res){
    ResHelper.render(req, res, 'consumer/soireeCheckoutFinish', {});
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