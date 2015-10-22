var express = require('express');
var router = express.Router();

var dbFolderLocation = "../../db/";
var Event = require(dbFolderLocation + 'Event.js');
var mongoose = require(dbFolderLocation + 'mongoose_connect.js');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.post('/newEvents', function(req, res){
  res.json(
      {"events":[
          {"category" : "Lunch", "timeString" : "Today at 2:00 PM", "people" : "3 spots left", "distance" : "0.3 mi away"},
            {"category" : "Dinner", "timeString" : "Tonight at 6:00 PM", "people" : "1 spot left", "distance" : "0.4 mi away"},
        {"category" : "Lunch", "timeString" : "Today at 1:00 PM", "people" : "2 spots left", "distance" : "0.25 mi away"},
        {"category" : "Lunch", "timeString" : "Today at 12:30 PM", "people" : "1 spot left", "distance" : "0.3 mi away"},
         {"category" : "Dinner", "timeString" : "Tonight at 7:00 PM", "people" : "1 spot left", "distance" : "0.2 mi away"},
           {"category" : "Drinks", "timeString" : "Tonight at 10:00 PM", "people" : "1 spot left", "distance" : "0.1 mi away"},
           {"category" : "Dinner", "timeString" : "Today at 2:00 PM", "people" : "1 spot left", "distance" : "0.9 mi away"},
         {"category" : "Drinks", "timeString" : "Tonight at 9:00 PM", "peopleGoingString" : "2 spots left", "distanceString" : "0.7 mi away"}
        ]
    }
    );
});



module.exports = router;
