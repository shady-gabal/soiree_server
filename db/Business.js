/**
 * Created by shadygabal on 10/22/15.
 */
/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;


/* Other Models */
//var Business = require('./Business.js');
var User = require('./User.js');
var Soiree = require('./Soiree.js');

/* Packages */
var shortid = require('shortid');


/* Schema Specific */
var businessTypes = ["Bar", "Restaurant", "Cafe"];

var businessSchema = new Schema({
    businessType : {type: String, enum: businessTypes},
    businessName : {type: String, required: [true, "Business must have a name"]},
    businessId: {type: String, unique: true, default: shortid.generate},
    _soirees : [{type: ObjectId, ref:"Soiree"}],
    location: {
        type: {type: String},
        coordinates: []
    },
    numSoireesHosted : {type: Number, default: 0},
    dateCreated : {type: Date, default: Date.now()},
    dateUpdated : {type: Date, default: Date.now()}
});

businessSchema.index({location: '2dsphere'});


businessSchema.statics.nextBusinessToHostSoiree = function(callback){
    this.findOne({}, function(err, obj){
       if (err) {
           console.log("Error finding next business to host soiree");
           callback(null);
       }
        else{
           console.log("Found next business to host soiree: " + obj.businessName);
           callback(obj);
       }
    });
};


businessSchema.pre('save', function(next){
    this.dateUpdated = new Date();
    next();
});



module.exports = mongoose.model('Business', businessSchema);

