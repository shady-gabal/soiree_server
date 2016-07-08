var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var Globals = require('app/helpers/Globals');
var Business = require('app/db/Business');
var LocationHelper = require('app/helpers/LocationHelper');
var Admin = require('app/db/Admin');

require('../setup');
require('./AdminTests.js');

var admin, business;

describe('Business', function () {

    it('setup - should fetch admin', function(done){
        Admin.findOne({}).exec(function(err, _admin){
            admin = _admin;
            done(err);
        });
    });

    it('should create business', function (done) {

        var coordinate = LocationHelper.createPoint({longitude : 74.013905, latitude: 40.717946});

        Business.createBusiness({
            businessName : 'Test Business',
            description: 'Test Description',
            phoneNumber : '3471111111',
            location : coordinate,
            address : '345 Chambers Street, New York, NY',
            soireeTypes : Globals.soireeTypes,
            generalArea : 'Lower East Side'
        }, 'shadygabal@gmail.com', '12345678', admin, function(_business){
            assert.isOk(_business, 'a business should be created');
            business = _business;
            done();
        }, function(err){
            console.log(err);
            done(new Error(err));
        });

    });
});
