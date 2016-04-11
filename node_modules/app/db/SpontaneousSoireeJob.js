/**
 * Created by shadygabal on 1/31/16.
 */
/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
var Business = require('./Business.js');
var Soiree = require('./Soiree.js');
var User = require('./User.js');
var Admin = require('./Admin.js');
var Image = require('./Image.js');

/* Packages */
var shortid = require('shortid');


var ssJobSchema = new Schema({
        _user : {type: ObjectId, ref: "User"},
        availableTimes : [{start: {type: String}, end: {type: String}}],
        done: {type: Boolean, default: false},
        scheduledTimeIdentifier : {type: String}
    },
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

ssJobSchema.methods.perform = function(){
    console.log("Performing spontaneous soiree job...");
};


ssJobSchema.pre('save', function(next){
    if (this.availableTimes && this.availableTimes.length > 0 && !this.done){
        var min;

        for (var i =0; i < this.availableTimes.length; i++){
            var curr = this.availableTimes[i];
            var start = curr.start;
            if (start){
                var timeIdentifier = Soiree.createScheduledTimeIdentifier(new Date(start));
                if (!min || timeIdentifier < min){
                    min = timeIdentifier;
                }
            }
        }

        if (min){
            this.scheduledTimeIdentifier = min;
        }
    }

    next();
});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
ssJobSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('SpontaneousSoireeJob', ssJobSchema);