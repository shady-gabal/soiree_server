/**
 * Created by shadygabal on 6/27/16.
 */
var chai = require('chai');
var assert = chai.assert;

chai.config.includeStack = true;
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
var CommunityPost = require('app/db/CommunityPost.js');
var CommunityComment = require('app/db/CommunityComment.js');

require('../../setup');

//var _user = testGlobals.user;

var post, comment, params;
//see if routes work

describe('community', function() {
    var base = '/api/community';

    it('should create a new post', function (done) {
        params = {'user': _userParams, 'userId': _user.userId, 'post': 'Test Post', 'comment': 'Test Comment', emotion: 'love'};

        request(app).post(base + '/createPost').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var postId = res.body.post.postId;
                params.postId = postId;

                CommunityPost.findPostWithId(postId, function(post){
                    _post = post;
                    done();
                }, function(err){
                    done(err);
                });
            });
    });


    it('should create a new comment', function (done) {
        request(app).post(base + '/createComment').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var commentId = res.body.comment.commentId;
                params.commentId = commentId;
                CommunityComment.findCommentWithId(commentId, function(comment){
                    _comment = comment;
                    done();
                }, function(err){
                   done(err);
                });
            });
    });

    it('should fetch posts', function (done) {
        request(app).post(base + '/posts').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var posts = res.body.posts;
                assert.isAtLeast(posts.length, 1, 'should have at least 1 post');
                done();
            });
    });

    it('should fetch a users posts', function (done) {
        request(app).post(base + '/postsForUser').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var posts = res.body.posts;
                assert.isAtLeast(posts.length, 1, 'should have at least 1 post');
                done(err);
            });
    });


    it('should fetch a post with a given postId', function (done) {
        request(app).post(base + '/postWithPostId').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var post = res.body.post;
                assert.isOk(post, 'must return post');
                done(err);
            });
    });

    it('should report post', function (done) {
        request(app).post(base + '/reportPost')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                done(err);
            });
    });

    it('should report comment', function (done) {
        request(app).post(base + '/reportComment')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                done(err);
            });
    });

    it('should upload emotion for post', function (done) {
        request(app).post(base + '/uploadEmotionForPost')
            .send(params).expect(200).end(function (err, res) {

                if (error(err, res, done)) return;

                refresh("CommunityPost", function(post){
                    var _id = _user._id;
                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = _post._loves;
                        newEmotions = post._loves;

                    }
                    else{
                        oldEmotions = _post._angries;
                        newEmotions = post._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length+1, 'post must have higher number of emotions');
                    assert.include(newEmotions, _id, "post must include user's id in proper emotions array");
                    _post = post;

                    done(err);
                });

            });
    });

    it('should upload unemotion for post', function (done) {
        request(app).post(base + '/uploadUnemotionForPost')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityPost", function(post){
                    var _id = _user._id;
                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = _post._loves;
                        newEmotions = post._loves;

                    }
                    else{
                        oldEmotions = _post._angries;
                        newEmotions = post._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length-1, 'post must have lower number of emotions');
                    assert.notInclude(newEmotions, _id, "post must not include user's id in emotions array");
                    _post = post;

                    done(err);
                });

            });
    });

    it('should upload emotion for comment', function (done) {
        request(app).post(base + '/uploadEmotionForComment')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityComment", function(comment){
                    var _id = _user._id;
                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = _comment._loves;
                        newEmotions = comment._loves;

                    }
                    else{
                        oldEmotions = _comment._angries;
                        newEmotions = comment._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length+1, 'comment must have higher number of emotions');
                    assert.include(newEmotions, _id, "comment must include user's id in proper emotions array");
                    _comment = comment;

                    done(err);
                });
            });
    });

    it('should upload unemotion for comment', function (done) {
        request(app).post(base + '/uploadUnemotionForComment')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityComment", function(comment){
                    var _id = _user._id;

                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = _comment._loves;
                        newEmotions = comment._loves;

                    }
                    else{
                        oldEmotions = _comment._angries;
                        newEmotions = comment._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length-1, 'comment must have lower number of emotions');
                    assert.notInclude(newEmotions, _id, "comment must not include user's id in emotions array");
                    _comment = comment;

                    done(err);
                });
            });
    });

});