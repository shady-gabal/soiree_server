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

    //it('setup - should fetch admin', function(done){
    //    Admin.findOne({}).exec(function(err, _admin){
    //        admin = _admin;
    //        done(err);
    //    });
    //});


});
