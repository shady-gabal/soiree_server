var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var Event = require(dbFolderLocation + 'Event.js');
var mongoose = require(dbFolderLocation + 'mongoose_connect.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/test', function(req, res){
  res.send("HIII");
});



module.exports = router;
