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

var _user;
var params, post, comment;

function refresh(model, cb){
    if (model === "CommunityPost" && post){
        CommunityPost.findOne({postId : post.postId}).exec(function(err, _post){
            if (err) console.log(err);
            cb(_post);
        });
    }
    else if (model === "CommunityComment" && comment){
        CommunityComment.findOne({commentId : comment.commentId}).exec(function(err, _comment){
            if (err) console.log(err);
            cb(_comment);
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

            params = {'user': obj, 'userId': _user.userId, 'post': 'Test Post', 'comment': 'Test Comment', emotion: 'love'};

            done();
        }, function(err){
            done(err);
        });
    }
    else done();
};

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

describe('community', function() {
    var base = '/api/community';

    it('should fetch new user', function(done){
       findTestUser(done);
    });

    //before(function (done) {
    //    var obj = _user.jsonObject();
    //    obj.latitude = 40.7128;
    //    obj.longitude = 74;
    //
    //    params = {'user': obj, 'userId': _user.userId, 'post': 'Test Post', 'comment': 'Test Comment', emotion: 'love'};
    //
    //    console.log(params);
    //
    //    done();
    //});

    it('should create a new post', function (done) {
        request(app).post(base + '/createPost').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                var postId = res.body.post.postId;
                params.postId = postId;

                CommunityPost.findPostWithId(postId, function(_post){
                    post = _post;
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
                CommunityComment.findCommentWithId(commentId, function(_comment){
                    comment = _comment;
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

                refresh("CommunityPost", function(_post){
                    var _id = _user._id;
                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = post._loves;
                        newEmotions = _post._loves;

                    }
                    else{
                        oldEmotions = post._angries;
                        newEmotions = _post._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length+1, 'post must have higher number of emotions');
                    assert.include(newEmotions, _id, "post must include user's id in proper emotions array");
                    post = _post;

                    done(err);
                });

            });
    });

    it('should upload unemotion for post', function (done) {
        request(app).post(base + '/uploadUnemotionForPost')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityPost", function(_post){
                    var _id = _user._id;
                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = post._loves;
                        newEmotions = _post._loves;

                    }
                    else{
                        oldEmotions = post._angries;
                        newEmotions = _post._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length-1, 'post must have lower number of emotions');
                    assert.notInclude(newEmotions, _id, "post must not include user's id in emotions array");
                    post = _post;

                    done(err);
                });

            });
    });

    it('should upload emotion for comment', function (done) {
        request(app).post(base + '/uploadEmotionForComment')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityComment", function(_comment){
                    var _id = _user._id;
                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = comment._loves;
                        newEmotions = _comment._loves;

                    }
                    else{
                        oldEmotions = comment._angries;
                        newEmotions = _comment._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length+1, 'comment must have higher number of emotions');
                    assert.include(newEmotions, _id, "comment must include user's id in proper emotions array");
                    comment = _comment;

                    done(err);
                });
            });
    });

    it('should upload unemotion for comment', function (done) {
        request(app).post(base + '/uploadUnemotionForComment')
            .send(params).expect(200).end(function (err, res) {
                if (error(err, res, done)) return;

                refresh("CommunityComment", function(_comment){
                    var _id = _user._id;

                    var oldEmotions, newEmotions;

                    if (params.emotion === "love"){
                        oldEmotions = comment._loves;
                        newEmotions = _comment._loves;

                    }
                    else{
                        oldEmotions = comment._angries;
                        newEmotions = _comment._angries;
                    }

                    assert.equal(newEmotions.length, oldEmotions.length-1, 'comment must have lower number of emotions');
                    assert.notInclude(newEmotions, _id, "comment must not include user's id in emotions array");
                    comment = _comment;

                    done(err);
                });
            });
    });

});