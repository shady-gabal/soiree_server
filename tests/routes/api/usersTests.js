var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../../../app.js');

var ErrorCodes = require('app/helpers/ErrorCodes');
var Soiree = require('app/db/Soiree.js');
var UserFeedbackList = require ('app/db/UserFeedbackList.js');
var User = require('app/db/User.js');
var Globals = require('app/helpers/Globals');

require('../../setup');


var params;
var feedbackList;

describe('users', function(){
    var base = '/api/users';
    
    it('should find user', function(done){
        params = {'user': _userParams, 'userId': _user.userId};
        
        request(app).post(base + '/findUser').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
            if(error(err, res, done)) return;
            
            var userJson = res.body.user;
            assert.isOk(userJson, 'user should not be null');
            assert.isOk(userJson.userId, 'user should have an ID value');

            done();
        });
    });
    
    it('should create user using facebook', function(done){
       params.facebook_access_token = 'EAAB70onjbVUBAFyqifDswN1yqOiKknQbRoUgHZB7rlqgdYOZCSFZCyDtGue69r8rEPAocXu4bsdFZCkZAbc9D7v7syBTVugE58YAUoKUb3JFQZAZA1ZCq7UewQMkUixEob8CjQ2ws11CKCUQxZAlmpGHtHcOjPdBEErMcZCN0oZCLLFNUQgl0ojDdYd';
        params.birthday = '06/27/1996';
        params.firstName = 'Mohab';
        params.lastName = 'Gabal';
        params.email = 'mohabgabal11@gmail.com';
        params.gender = 'male';
        params.interestedIn = 'male';
        params.profilePictureUrl = 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/12733585_1117807188270364_7245327032626837789_n.jpg?oh=7f771b9a3bdffe679d16f766f5f7b5ee&oe=582F87A4';
        
        request(app).post(base + '/createUser').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
               if(error(err, res, done)) return;

                var userJson = res.body.user;
                var soireeAccessToken = res.body.soireeAccessToken;
                assert.isOk(userJson, 'user should not be null');
                assert.isOk(userJson.userId, 'user should have an ID value');
                assert.isOk(soireeAccessToken),'user should have a soiree access token';

                done();
            });
    });

    it('should create user using email', function(done){
        var emailData = {
            password : 'Amir9701',
            interestedIn : ['male'],
            firstName : 'Mohab',
            lastName : 'Gabal',
            email : 'mohabgabal12@gmail.com',
            gender : 'male',
            birthday : '06/27/1996',
            birthdayDate : 835841338
        };

        params.emailSignupData = emailData;
        params.facebook_access_token = null;

        request(app).post(base + '/createUser').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
                if(error(err, res, done)) return;

                var userJson = res.body.user;
                var soireeAccessToken = res.body.soireeAccessToken;
                assert.isOk(userJson, 'user should not be null');
                assert.isOk(userJson.userId, 'user should have an ID value');
                assert.isOk(soireeAccessToken),'user should have a soiree access token';

                done();
            });
    });

    it('should login user', function(done){
        params.username = 'mohabgabal12@gmail.com';
        params.password = 'Amir9701';

        request(app).post(base + '/login').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
            if(error(err, res, done)) return;

            var userJson = res.body.user;
            var soireeAccessToken = res.body.soireeAccessToken;
            assert.isOk(userJson, 'user should not be null');
            assert.isOk(userJson.userId, 'user should have an ID value');
            assert.isOk(soireeAccessToken),'user should have a soiree access token';

            done();
        });
    });

    it('should change profile picture url', function(done){
        params = {'user': _userParams, 'userId': _user.userId};
        params.profilePictureUrl = 'https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/12733585_1117807188270364_7245327032626837789_n.jpg?oh=7f771b9a3bdffe679d16f766f5f7b5ee&oe=582F87A4';

        request(app).post(base + '/changeProfilePictureUrl').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
           if(error(err, res, done)) return;

            done();
        });
    });

    it('should upload profile picture', function(done){
        console.log(_userParams);
        var username = _userParams.username;
        var token = _userParams.soiree_access_token;
        request(app).post(base + '/uploadProfilePicture').field('user[soiree_access_token]', token)
            .field('user[username]', username).attach('profilePicture', 'public/images/user_default_1.jpg').expect('Content-Type', /json/).expect(200).end(function(err, res){
            if(error(err, res, done)) return;

            done();
        });
    });

    it('should update profile', function(done){
        params.userProfile = {
            question1 : 'Question 1',
            question2 : 'Question 2',
            question3 : 'Question 3',
            answer1 : 'Answer 1',
            answer2 : 'Answer 2',
            answer3 : 'Answer 3',
            description : 'Description'
        };
        request(app).post(base + '/updateProfile').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
            if(error(err, res, done)) return;

            var profile = res.body.userProfile;
            assert.isOk(profile.question1.question, 'profile should have question 1');
            assert.isOk(profile.question2.question, 'profile should have question 2');
            assert.isOk(profile.question3.question, 'profile should have question 3');
            assert.isOk(profile.question1.answer, 'profile should have answer 1');
            assert.isOk(profile.question2.answer, 'profile should have answer 2');
            assert.isOk(profile.question3.answer, 'profile should have answer 3');

            done();
        });
    });
    
    it('should upload soiree feedback', function(done){
        Soiree.findOne({}).exec(function(err, soiree){
            params.message = 'Soiree Feedback';
            params.type = Globals.feedbackTypes.SOIREE;
            params.soireeId = soiree.soireeId;

            request(app).post(base + '/soireeFeedback').expect('Content-Type', /json/)
                .send(params).expect(200).end(function(err, res){
               if(error(err, res, done)) return;

                UserFeedbackList.findOne({}).exec(function(err, feedbackList){
                   if(err) {
                       console.log(err);
                   }

                    assert.equal(feedbackList.userFeedback.length, 1, 'feedback list should have only soiree feedback');

                    done();
                });
            });
        });
    });

    it('should report problem for soiree', function(done){
        params.message = 'Soiree Problem';
        params.type = Globals.feedbackTypes.PROBLEM;

        request(app).post(base + '/reportProblemForSoiree').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
            if(error(err, res, done)) return;

            UserFeedbackList.findOne({}).exec(function(err, feedbackList){
                if(err) {
                    console.log(err);
                }

                assert.equal(feedbackList.userFeedback.length, 2, 'feedback list should have only soiree and soiree problem feedback');

                done();
            });
        });
    });

    it('should upload user feedback', function(done){
        params.message = 'User Feedback';
        params.type = Globals.feedbackTypes.TIP;

        request(app).post(base + '/reportProblemForSoiree').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
            if(error(err, res, done)) return;

            UserFeedbackList.findOne({}).exec(function(err, feedbackList){
                if(err) {
                    console.log(err);
                }

                assert.equal(feedbackList.userFeedback.length, 3, 'feedback list should have only soiree, soiree problem, and user feedback');

                done();
            });
        });
    });

    it('should fetch user profile', function(done){
       request(app).post(base + '/userProfileForUserId').expect('Content-Type', /json/)
           .send(params).expect(200).end(function(err, res){
          if(error(err, res, done)) return;

           var profile = res.body.userProfile;
           assert.isOk(profile, 'user should have profile');
           assert.isOk(profile.question1.question, 'profile should have question 1');
           assert.isOk(profile.question2.question, 'profile should have question 2');
           assert.isOk(profile.question3.question, 'profile should have question 3');
           assert.isOk(profile.question1.answer, 'profile should have answer 1');
           assert.isOk(profile.question2.answer, 'profile should have answer 2');
           assert.isOk(profile.question3.answer, 'profile should have answer 3');

           done();
       });
    });

    it('should fetch user soirees', function(done){
       request(app).post(base + '/fetchUserSoirees').expect('Content-Type', /json/)
           .send(params).expect(200).end(function(err, res){
           if(error(err, res, done)) return;

           assert.isOk(res.body.cancelled, 'cancelled soirees should not be null');
           assert.isOk(res.body.past, 'past soirees should not be null');
           assert.isOk(res.body.present, 'present soirees should not be null');
           assert.equal(res.body.future.length, 1, 'test user should have joined one soiree');

           done();
       });
    });
    
    it('should upload device token', function(done){
        params.deviceToken = '07a070d0908b2bd7599c4f07097235e0310bd06b6b3016857749976ce718b10e';
        request(app).post(base + '/uploadDeviceToken').expect('Content-Type', /json/)
            .send(params).expect(200).end(function(err, res){
            if(error(err, res, done)) return;

            User.findOne({userId : _user.userId}).exec(function(err, user){
               if(err){
                   console.log(err);
               }
                assert.isOk(user.deviceToken, 'user should have device token');

                done();
            });
        });
    });
});