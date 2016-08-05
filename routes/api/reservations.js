var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var helpersFolderLocation = "../../helpers/";

var _ = require("underscore");
var mongoose = require('app/db/mongoose_connect.js');

var User = require('app/db/User');
var SoireeReservation = require('app/db/SoireeReservation');
var ResHelper = require('app/helpers/ResHelper');
var ErrorCodes = require('app/helpers/ErrorCodes');


router.post('/confirmReservation', function(req, res, next){
    var reservationId = req.body.reservationId;
    var confirmerInitials = req.body.confirmerInitials;

   User.authenticateUser(req, res, next, function(user){
       SoireeReservation.findOne({reservationId : reservationId}).exec(function(err, reservation){
          if (err){
              console.log(err);
              return ResHelper.sendError(res, ErrorCodes.MongoError);
          }

           if (reservation._user === user._id && !reservation.confirmed){
               reservation.confirm(confirmerInitials, function(){
                   ResHelper.sendSuccess(res);
               }, function(err2){
                   console.log(err2);
                   ResHelper.sendError(res, err2);
               });
           }
           else if (reservation.confirmed){
               return ResHelper.sendError(res, ErrorCodes.AlreadyExists);
           }
           else{
               return ResHelper.sendError(res, ErrorCodes.InvalidInput);
           }
       });
   });

});

module.exports = router;