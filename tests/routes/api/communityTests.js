/**
 * Created by shadygabal on 6/27/16.
 */
var chai = require('chai');
var assert = chai.assert;

//chai.config.includeStack = true;
//global.expect = chai.expect;
//global.AssertionError = chai.AssertionError;
//global.Assertion = chai.Assertion;
//global.assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../../../app.js');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var Globals = require('app/helpers/Globals');

var _user;

before(function(done){
    if (!_user){
        User.findOrCreateTestUser(function(user){
            _user = user;
            done();
        }, function(err){
            done(err);
        });
    }
    else done();
});

describe('community', function() {
    var base = '/api/community';
    var params;

    before(function (done) {
        var obj = _user.jsonObject();
        obj.latitude = 40.7128;
        obj.longitude = 74;

        params = {'user': obj, 'userId': _user.userId, 'post': 'Test Post', 'comment': 'Test Comment', emotion: 'love'};

        done();
    });

    it('should create a new post', function (done) {
        request(app).post(base + '/createPost').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                var postId = res.body.post.postId;
                params.postId = postId;
                done(err);
            });
    });

    it('should create a new comment', function (done) {
        request(app).post(base + '/createComment').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                var commentId = res.body.comment.commentId;
                params.commentId = commentId;
                done(err);
            });
    });

    it('should fetch posts', function (done) {
        request(app).post(base + '/posts').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should fetch a users posts', function (done) {
        request(app).post(base + '/postsForUser').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should report post', function (done) {
        request(app).post(base + '/reportPost')
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should report comment', function (done) {
        request(app).post(base + '/reportComment')
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should upload emotion for post', function (done) {
        request(app).post(base + '/uploadEmotionForPost')
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should upload unemotion for post', function (done) {
        request(app).post(base + '/uploadUnemotionForPost')
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should upload emotion for comment', function (done) {
        request(app).post(base + '/uploadEmotionForComment')
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

    it('should upload unemotion for comment', function (done) {
        request(app).post(base + '/uploadUnemotionForComment')
            .send(params).expect(200).end(function (err, res) {
                done(err);
            });
    });

});