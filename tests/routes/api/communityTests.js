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
        params = {'user': _userParams, 'userId': _user.userId, 'post': 'Test Post', 'comment': 'Test Comment'};

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

    it('should upvote post', function (done) {
        request(app).post(base + '/upvotePost')
            .send(params).expect(200).end(function (err, res) {

                if (error(err, res, done)) return;

                refresh("CommunityPost", function(post){
                    var _id = _user._id;

                    assert.equal(post._upvotes.length, _post._upvotes.length+1, 'post must have 1 more upvote');
                    assert.equal(post._downvotes.length, _post._downvotes.length, 'post must have same number of downvotes');

                    assert.include(post._upvotes, _id, "post must include user's id in _upvotes array");
                    assert.equal(post.score, _post.score+1, "post's score must be 1 point higher than previous");
                    _post = post;

                    done(err);
                });

            });
    });

    it('should downvote post', function (done) {
        request(app).post(base + '/downvotePost')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityPost", function(post){
                    var _id = _user._id;

                    assert.equal(post._downvotes.length, _post._downvotes.length+1, 'post must have 1 more downvote');
                    assert.equal(post._upvotes.length, _post._upvotes.length-1, 'post must have 1 less upvote');
                    assert.include(post._downvotes, _id, "post must include user's id in _downvotes array");
                    assert.equal(post.score, _post.score-2, "post's score must be 2 points less than previous (-1 for lost upvote, -1 for downvote)");
                    _post = post;

                    done(err);
                });

            });
    });

    it('should upvote comment', function (done) {
        request(app).post(base + '/upvoteComment')
            .send(params).expect(200).end(function (err, res) {

                if (error(err, res, done)) return;

                refresh("CommunityComment", function(comment){
                    var _id = _user._id;

                    assert.equal(comment._upvotes.length, _comment._upvotes.length+1, 'comment must have 1 more upvote');
                    assert.equal(comment._downvotes.length, _comment._downvotes.length, 'comment must have same number of downvotes');

                    assert.include(comment._upvotes, _id, "comment must include user's id in _upvotes array");
                    assert.equal(comment.score, _comment.score+1, "comment's score must be 1 point higher than previous");
                    _comment = comment;

                    done(err);
                });

            });
    });

    it('should downvote comment', function (done) {
        request(app).post(base + '/downvoteComment')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityComment", function(comment){
                    var _id = _user._id;

                    assert.equal(comment._downvotes.length, _comment._downvotes.length+1, 'comment must have 1 more downvote');
                    assert.equal(comment._upvotes.length, _comment._upvotes.length-1, 'comment must have 1 less upvote');
                    assert.include(comment._downvotes, _id, "comment must include user's id in _downvotes array");
                    assert.equal(comment.score, _comment.score-2, "comment's score must be 2 points less than previous (-1 for lost upvote, -1 for downvote)");
                    _comment = comment;

                    done(err);
                });

            });
    });
    
    //it('should upload emotion for comment', function (done) {
    //    request(app).post(base + '/uploadEmotionForComment')
    //        .send(params).expect(200).end(function (err, res) {
    //            if (error(err, res, done)) return;
    //
    //            refresh("CommunityComment", function(comment){
    //                var _id = _user._id;
    //                var oldEmotions, newEmotions;
    //
    //                if (params.emotion === "love"){
    //                    oldEmotions = _comment._upvotes;
    //                    newEmotions = comment._upvotes;
    //
    //                }
    //                else{
    //                    oldEmotions = _comment._angries;
    //                    newEmotions = comment._angries;
    //                }
    //
    //                assert.equal(newEmotions.length, oldEmotions.length+1, 'comment must have higher number of emotions');
    //                assert.include(newEmotions, _id, "comment must include user's id in proper emotions array");
    //                _comment = comment;
    //
    //                done(err);
    //            });
    //        });
    //});
    //
    //it('should upload unemotion for comment', function (done) {
    //    request(app).post(base + '/uploadUnemotionForComment')
    //        .send(params).expect(200).end(function (err, res) {
    //            if (error(err, res, done)) return;
    //
    //            refresh("CommunityComment", function(comment){
    //                var _id = _user._id;
    //
    //                var oldEmotions, newEmotions;
    //
    //                if (params.emotion === "love"){
    //                    oldEmotions = _comment._upvotes;
    //                    newEmotions = comment._upvotes;
    //
    //                }
    //                else{
    //                    oldEmotions = _comment._angries;
    //                    newEmotions = comment._angries;
    //                }
    //
    //                assert.equal(newEmotions.length, oldEmotions.length-1, 'comment must have lower number of emotions');
    //                assert.notInclude(newEmotions, _id, "comment must not include user's id in emotions array");
    //                _comment = comment;
    //
    //                done(err);
    //            });
    //        });
    //});

});