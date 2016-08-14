var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../app.js');
var mongoose = require('app/db/mongoose_connect');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var Business = require('app/db/Business');
var SoireeReservation = require('app/db/SoireeReservation');
var CommunityPost = require('app/db/CommunityPost.js');
var CommunityComment = require('app/db/CommunityComment.js');

var Globals = require('app/helpers/Globals');
var LocationHelper = require('app/helpers/LocationHelper');
var Admin = require('app/db/Admin');

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

    it('should create a new Admin', function (done) {

        var email = "shady@experiencesoiree.com";
        var password = "9701";

        var adminObj = {
            firstName : "Shady",
            lastName : "Gabal",
            phoneNumber : "3472102276"
        };

        Admin.createAdmin(adminObj, email, password, function(admin){
            global._admin = admin;

            done();
        }, function(err){
            done(err);
        });
    });

    it('should create a new Business', function (done) {

        var coordinate = LocationHelper.createPoint({longitude : 74.013905, latitude: 40.717946});

        Business.createBusiness({
            businessName : 'Test Business',
            description: 'Test Description',
            phoneNumber : '3471111111',
            location : coordinate,
            address : '345 Chambers Street, New York, NY',
            soireeTypes : Globals.soireeTypes,
            generalArea : 'Lower East Side'
        }, 'shadygabal@gmail.com', '12345678', _admin, function(business){

            assert.isOk(business, 'a business should be created');
            global._business = business;
            done();

        }, function(err){
            console.log(err);
            done(new Error(err));
        });

    });

    it('should create a new test User properly', function(done){
            User.findOrCreateTestUser(function (user, encodedToken) {
                global._user = user;

                var obj = user.jsonObject();
                obj.latitude = 40.7128;
                obj.longitude = 74;
                obj.soiree_access_token = encodedToken;
                obj.username = user.email;

                global._userParams = obj;

                done();
            }, function (err) {
                done(err);
            });
        });

});

function clearDB(cb){
    var modelNames = ["User", "Soiree", "SoireeReservation", "CommunityComment", "CommunityPost", "Business", "Admin", "Image", "Notification", "SoireeHost", "UserVerification", "SubwayLine", "UserFeedbackList"];
    var numReturned = 0;

    var saveCb = function(err){
        if (++numReturned === modelNames.length){
            cb(err);
        }
    };

    modelNames.forEach(function(model){
        mongoose.model(model).remove({}).exec(saveCb);
    });
}

global.refresh = function(model, cb){
    if (model === "Soiree" && _soiree){
        Soiree.findOne({soireeId : _soiree.soireeId}).exec(function(err, soiree){
            if (err) console.log(err);
            cb(soiree);
        });
    }
    else if (model === "SoireeReservation" && reservation){
        SoireeReservation.findOne({reservationId : _reservation.reservationId}).exec(function(err, reservation){
            if (err) console.log(err);
            cb(reservation);
        });
    }
    else if (model === "User" && _user){
        User.findOne({userId : _user.userId}).exec(function(err, user){
            if (err) console.log(err);
            cb(user);
        });
    }
    else if (model === "CommunityPost" && _post){
        CommunityPost.findOne({postId : _post.postId}).exec(function(err, post){
            if (err) console.log(err);
            cb(post);
        });
    }
    else if (model === "CommunityComment" && _comment){
        CommunityComment.findOne({commentId : _comment.commentId}).exec(function(err, comment){
            if (err) console.log(err);
            cb(comment);
        });
    }
    else return cb();
};


global.error = function(err, res, done){
    if (err){
        if (res.body.error){
            console.log("Test failed. Server returned error: " + res.body.error);
        }
        done(err);
        return true;
    }
    return false;
}

