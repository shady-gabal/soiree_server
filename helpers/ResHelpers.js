/**
 * Created by shadygabal on 12/16/15.
 */

//var express = require('express');
//var router = express.Router();
//
//var dbFolderLocation = "../../db/";
//var helpersFolderLocation = "../../helpers/";
//
//var mongoose = require(dbFolderLocation + 'mongoose_connect.js');
//var Soiree = require(dbFolderLocation + 'Soiree.js');
//var Business = require(dbFolderLocation + 'Business.js');
//var User = require(dbFolderLocation + 'User.js');
//
//var DateHelpers = require(helpersFolderLocation + 'DateHelpers.js');
//var SoireeHelpers = require(helpersFolderLocation + 'SoireeHelpers.js');

var resHelpers = (function() {

    return {
        sendMessage: function (res, status, message) {
            if (status >= 400 && status <= 500)
                console.log(message);

            res.type('text/plain');
            res.status(status).send(message);
        }

        //isNextDay: function (firstDate, secondDate) {
        //    var nextDayDiff = 1000 * 60 * 60 * 24;
        //    var midnightOne = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDay());
        //    var midnightTwo = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDay());
        //
        //    var diff = Math.abs(midnightTwo - midnightOne);
        //    return diff == nextDayDiff;
        //}

    }

}());

module.exports = resHelpers;
