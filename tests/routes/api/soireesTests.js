var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../../../app.js');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var SoireeReservation = require('app/db/SoireeReservation');

var Globals = require('app/helpers/Globals');
var _user;
var params, soiree, reservation;

require('../../setup');
require('../../models/BusinessTests.js');

function refresh(model, cb){
    if (model === "Soiree" && soiree){
        Soiree.findOne({soireeId : soiree.soireeId}).exec(function(err, _soiree){
            if (err) console.log(err);
            cb(_soiree);
        });
    }
    else if (model === "SoireeReservation" && comment){
        SoireeReservation.findOne({reservationId : reservation.reservationId}).exec(function(err, _reservation){
            if (err) console.log(err);
            cb(_reservation);
        });
    }
    else if (model === "User" && _user){
        User.findOne({userId : _user.userId}).exec(function(err, user){
            if (err) console.log(err);
            cb(user);
        });
    }
    else return cb();
}

function error(err, res, done){
    if (err){
        if (res.body.error){
            console.log("Test failed. Server returned error: " + res.body.error);
        }
        done(err);
        return true;
    }
    return false;
}
//
//before(function(done){
//    if (!_user){
//        User.findOrCreateTestUser(function(user){
//            _user = user;
//            done();
//        }, function(err){
//            done(err);
//        });
//    }
//    else done();
//});

//see if routes work

//var postUrls = {
//
//};
//var getUrls = {
//    "/soireesNear" : "should show soirees near"
//};
//
//
//Globals.loopThroughObject(getUrls, function(url){
//    var msg = getUrls[url];
//
//    it(msg, function (done) {
//        request(app).post(base + url)
//            .send(params).expect(200).end(function (err, res) {
//                done(err);
//            });
//    });
//
//});

describe('soirees', function() {
    var base = '/api/soirees';

    it('should fetch new user', function(done){
        if (!_user){
            User.findOrCreateTestUser(function(user){
                _user = user;

                var obj = _user.jsonObject();
                obj.latitude = 40.7128;
                obj.longitude = 74;

                params = {'user': obj, 'userId': _user.userId, 'post': 'Test Post', 'comment': 'Test Comment', emotion: 'love'};

                done();
            }, function(err){
                done(err);
            });
        }
        else done();
    });

    //it('should create a new soiree', function(done){
    //
    //});

    it('should fetch soirees near', function (done) {
        request(app).post(base + '/soireesNear').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var soirees = res.body.soirees;
                assert.isOk(soirees, 'soirees should not be null');
                assert.isAbove(soirees.length, 0, 'should return at least one soiree');
                done(err);
            });
    });

    //it('should create a new comment', function (done) {
    //    request(app).post(base + '/createComment').expect('Content-Type', /json/)
    //        .send(params).expect(200).end(function (err, res) {
    //            if (error(err, res, done)) return;
    //
    //            var commentId = res.body.comment.commentId;
    //            params.commentId = commentId;
    //            done(err);
    //        });
    //});
    //
    //it('should fetch posts', function (done) {
    //    request(app).post(base + '/posts').expect('Content-Type', /json/)
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should fetch a users posts', function (done) {
    //    request(app).post(base + '/postsForUser').expect('Content-Type', /json/)
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //
    //it('should fetch a post with a given postId', function (done) {
    //    request(app).post(base + '/postsWithPostId').expect('Content-Type', /json/)
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should report post', function (done) {
    //    request(app).post(base + '/reportPost')
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should report comment', function (done) {
    //    request(app).post(base + '/reportComment')
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should upload emotion for post', function (done) {
    //    request(app).post(base + '/uploadEmotionForPost')
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should upload unemotion for post', function (done) {
    //    request(app).post(base + '/uploadUnemotionForPost')
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should upload emotion for comment', function (done) {
    //    request(app).post(base + '/uploadEmotionForComment')
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});
    //
    //it('should upload unemotion for comment', function (done) {
    //    request(app).post(base + '/uploadUnemotionForComment')
    //        .send(params).expect(200).end(function (err, res) {
    //            done(err);
    //        });
    //});

});