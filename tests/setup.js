var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var app = require('../app.js');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var Globals = require('app/helpers/Globals');

var mongoose = require('app/db/mongoose_connect');
var clearDB  = require('mocha-mongoose')(mongoose.mongooseURI);


describe('setting up tests', function () {
    it('should setup properly', function (done) {
        clearDB(function(err){
            if (err) console.log(err);
            done(err);
        });
    });
});
