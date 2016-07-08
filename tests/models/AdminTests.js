var chai = require('chai');
var assert = chai.assert;

var request = require('supertest');
var express = require('express');

var User = require('app/db/User');
var Soiree = require('app/db/Soiree');
var Globals = require('app/helpers/Globals');
var Admin = require('app/db/Admin');
var admin;

require('../setup');


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

//describe('Admin', function () {
//    it('should create a new Admin', function (done) {
//
//        var email = "shady@experiencesoiree.com";
//        var password = "9701";
//
//        var adminObj = {
//            firstName : "Shady",
//            lastName : "Gabal",
//            phoneNumber : "3472102276"
//        };
//
//        Admin.createAdmin(adminObj, email, password, function(_admin){
//            admin = _admin;
//            done();
//        }, function(err){
//            done(err);
//        });
//    });
//
//});
