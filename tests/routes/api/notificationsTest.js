var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../../../app.js');

var ErrorCodes = require('app/helpers/ErrorCodes');

var Globals = require('app/helpers/Globals');

require('../../setup');



var params;

describe('notifications', function() {
    var base = '/api/users/notifications';

    it('should fetch notifications', function (done) {
        params = {'user': _userParams, 'userId': _user.userId};
        request(app).post(base + '/fetchNotifications').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
            if (error(err, res, done)) return;

            var notifications = res.body.notifications;
            assert.isOk(notifications, 'notifications should not be null');

            done(err);
        });
    });

    it('should fetch unseen notifications', function (done) {
        request(app).post(base + '/fetchUnseenNotifications').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
            if (error(err, res, done)) return;

            var notifications = res.body.notifications;
            assert.isOk(notifications, 'unseen notifications should not be null');

            done(err);
        });
    });

    it('should upload notifications tapped', function (done) {
        request(app).post(base + '/uploadNotificationsTapped').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
            if (error(err, res, done)) return;

            done(err);
        });
    });

    it('should upload notifications seen', function (done) {
        request(app).post(base + '/uploadNotificationsSeen').expect('Content-Type', /json/)
            .send(params).expect(200).end(function (err, res) {
            if (error(err, res, done)) return;

            done(err);
        });
    });

});

