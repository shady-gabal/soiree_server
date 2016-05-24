/**
 * Created by shadygabal on 12/31/15.
 */
var express = require('express');
var router = express.Router();

var BetaSignupEmailList = require('app/db/BetaSignupEmailList');

BetaSignupEmailList.findOne({}, function(err, list){
    if (err){console.log(err);}
    else if (!list){
        var newlist = new BetaSignupEmailList({});
        newlist.save(function(err2){
           console.log("New Beta Signup Email List saved with err " + err2);
        });
    };
});

/* GET home page. */
router.get('/', function(req, res) {
    res.render('consumer/index', {});
});

router.post('/addEmail', function(req, res){
   var email = req.body.email;
    if (validateEmail(email)){
        BetaSignupEmailList.addEmail(email, function(){
            res.send("OK");
        }, function(err){
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
    if (re.test(email) && ( email.indexOf('.edu') === (email.length - 4) ) ){
        return true;
    }
    return false;
}

module.exports = router;