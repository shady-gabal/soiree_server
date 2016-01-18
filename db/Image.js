/**
 * Created by shadygabal on 1/17/16.
 */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var UserVerification = require('./UserVerification.js');

var imageSchema = new Schema({
        data: Buffer,
        contentType: String,
        fileName : {type: String, required: true},
        directory : {type: String, required: true},
        path : {type: String, index: true},
        adminsOnly : {type: Boolean, default: false},
        _userVerification : {type: ObjectId, ref:"UserVerification"}
    },
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

imageSchema.statics.createPath = function(directory, fileName){
    console.log("setting path...");
    if (directory && fileName) {

        if (directory.charAt(directory.length - 1) !== '/') {
            directory = directory + '/';
        }

        var path = directory + fileName;
        console.log("set path to: " + path);
        return path;

    }
    return null;
};


imageSchema.pre('save', function(next){
    console.log("image pre save");
    if (this.directory.charAt(this.directory.length - 1) !== '/') {
        this.directory = this.directory + '/';
    }
    next();
});

imageSchema.post('init', function(doc){
    console.log("post init");
    //doc.setPath();
});


var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
imageSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('Image', imageSchema);

