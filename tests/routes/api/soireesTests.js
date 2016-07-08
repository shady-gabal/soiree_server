var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../../../app.js');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var SoireeReservation = require('app/db/SoireeReservation');
var ErrorCodes = require('app/helpers/ErrorCodes');

var Globals = require('app/helpers/Globals');
var _user;
var params, soiree, reservation, business;

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

function findTestUser(done){
    if (!_user){
        User.findOrCreateTestUser(function(user, encodedToken){
            _user = user;

            var obj = _user.jsonObject();
            obj.latitude = 40.7128;
            obj.longitude = 74;
            obj.soiree_access_token = encodedToken;

            params = {'user': obj, 'userId': _user.userId};

            done();
        }, function(err){
            done(err);
        });
    }
    else done();
};

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
        findTestUser(done);
    });

    it('should create a new soiree of each type', function(done){
        var soireeTypes = Globals.soireeTypes;
        assert.isAbove(soireeTypes.length, 0, "Globals.soireeTypes must have at least one element");

        var numCreated = 0;
        var soireeType = soireeTypes[0];

        var createNextSoiree = function(soireeType, postCb) {
            Soiree.createSoireeWithTypeForTests(soireeType, function(soiree){
                if (++numCreated === soireeTypes.length){
                    done();
                }
                else postCb();
            }, function(err){

                if (err === ErrorCodes.NoAvailableDate){
                    if (++numCreated === soireeTypes.length){
                        done();
                    }
                    else postCb();
                }
                else{
                    var error = new Error(err);
                    return done(error);
                }

            });
        };

        var postCb = function(){
            soireeType = soireeTypes[numCreated];
            createNextSoiree(soireeType, postCb);
        };

        createNextSoiree(soireeType, postCb);
    });

    it('should fetch soirees near', function (done) {
        request(app).post(base + '/soireesNear').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var soirees = res.body.soirees;
                assert.isOk(soirees, 'soirees should not be null');
                assert.isAbove(soirees.length, 0, 'should return at least one soiree');

                var soiree = soirees[0];
                params.soireeId = soiree.soireeId;

                done(err);
            });
    });

    it('user should successfully join soiree', function (done) {
        request(app).post(base + '/joinSoiree').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                assert.isOk(res.body.soiree, 'soiree returned should not be null');
                assert.equal(res.body.soiree.soireeId, params.soireeId);

                Soiree.findBySoireeId(params.soireeId, function(soiree){
                    assert.include(soiree._usersUncharged, _user._id);
                    assert.equal(soiree._unchargedReservations.length, 1, "soiree._unchargedReservations should have 1 reservation");
                    assert.equal(soiree._chargedReservations.length, 0, "soiree._chargedReservations should have no reservations");

                    soiree.deepPopulate("__chargedReservations _unchargedReservations _business", function(err){
                       if (err){
                           return done(err);
                       }
                        reservation = soiree._unchargedReservations[0];
                        assert.isFalse(reservation.charged, "reservation should not be charged");
                        var _userId = reservation._user._id ? reservation._user._id : reservation._user;
                        assert.isTrue(_userId.equals(_user._id), "reservation user should be same as joining user");
                        assert.isTrue(reservation._soiree.equals(soiree._id), "reservation soiree should be same as soiree");
                        business = soiree._business;

                        assert.isEqual(business._unconfirmedReservations.length, 0, "soiree business should have no unconfirmed reservations until reservation is charged");
                        assert.isEqual(business._confirmedReservations.length, 0, "soiree business should have no confirmed reservations");

                        done();
                    });

                }, function(err){
                    done(new Error(err));
                });
            });
    });
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