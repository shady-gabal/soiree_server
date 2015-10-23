/**
 * Created by shadygabal on 10/22/15.
 */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var Soiree = require('./Soiree.js');

var businessSchema = new Schema({
    businessType : {type: String},
    businessId: {type: Number},
    soirees : [{type: Soiree}],
    dateCreated : {type: Date, default: Date.now()},
    dateUpdated : {type: Date, default: Date.now()}
});

module.exports = mongoose.model('Business', businessSchema);

