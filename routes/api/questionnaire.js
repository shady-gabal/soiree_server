var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";
var assetsFolderLocation = "../../assets/";

var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
var fs = require('fs');
var path = require('path');
var multer = require('multer');


var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

var Soiree = require(dbFolderLocation + 'Soiree.js');
var Business = require(dbFolderLocation + 'Business.js');
var User = require(dbFolderLocation + 'User.js');
var UserVerification = require(dbFolderLocation + 'UserVerification.js');

var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');/**
 * Created by shadygabal on 11/28/15.
 */

var questionnaire;

router.post('/fetchQuestionnaire', function(req, res){

    User.verifyUser(req.body.user, function(user){
        console.log("verified");
        if (!questionnaire) {
            console.log("fetching questionnaire...");
            var questionnairePath = path.join(__dirname, assetsFolderLocation + "questionnaire/questionnaire.json");

            fs.readFile(questionnairePath, 'utf8', function (err, data) {
                if (err) {
                    console.log("error booyy");
                    console.log(err);
                    return res.status('404').send("Error finding questionnaire file");
                }
                questionnaire = JSON.parse(data);
                res.json(questionnaire);
            });
        }
        else res.json(questionnaire);

    }, function(err){
        console.log("errr");
        res.status('404').send("Error verifying user");
    });

});

router.get('/fetchQuestionnaire', function(req, res){
    if (!questionnaire) {
        var questionnairePath = path.join(__dirname, assetsFolderLocation + "questionnaire/questionnaire.json");

        fs.readFile(questionnairePath, 'utf8', function (err, data) {
            if (err) {
                console.log(err);
                return res.status('404').send("Error finding questionnaire file");
            }
            questionnaire = JSON.parse(data);
            res.json(questionnaire);
        });
    }
    else res.json(questionnaire);
});


//function questionsData(user){
//    //{"questionnaire" : [question]}
//    //question => {question : string, answers: [], indicators: []},
//
//    var q1 = createQuestionObject("",[],[]);
//    var q2 = createQuestionObject("",[],[]);
//    var q3 = createQuestionObject("",[],[]);
//
//    var questionnaire = [
//        q1, q2, q3
//    ];
//
//    var responseObject = {
//        "questionnaire": questionnaire
//    };
//
//    return responseObject;
//};
//
//function createQuestionObject(question, answers, indicators){
//    return {
//        "question" : question,
//        "answers" : answers,
//        "indicators" : indicators
//    };
//}

module.exports = router;
