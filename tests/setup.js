var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../app.js');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var Globals = require('app/helpers/Globals');

var mongoose = require('app/db/mongoose_connect');


describe('setting up tests', function () {
    it('should setup properly', function (done) {
        console.log('clearing');
        //done();
        clearDB(function(err){
            console.log('db cleared');
            if (err) console.log(err);
            done(err);
        });
    });
});

function clearDB(cb){
    var modelNames = ["User", "Soiree", "SoireeReservation", "CommunityComment", "CommunityPost", "Business", "Admin", "Image", "Notification", "SoireeHost", "UserVerification", "SubwayLine"];
    var numReturned = 0;

    var saveCb = function(err){
        if (++numReturned === modelNames.length){
            cb(err);
        }
    };

    modelNames.forEach(function(model){
        mongoose.model(model).remove({}).exec(saveCb);
    });

    //modelNames.forEach(function(model){
    //    promises.push(mongoose.model(model).remove({}).exec());
    //});
    //
    //Promise.all(promises)
    //    .then(function () {
    //        cb();
    //    });

}

