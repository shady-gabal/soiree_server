/**
 * Created by shadygabal on 1/17/16.
 */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var imageSchema = new Schema({
        data: Buffer,
        contentType: String,
        fileName : {type: String, required: true},
        directory : {type: String, required: true},
        path : {type: String, index: true}
    },
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

imageSchema.methods.setPath = function(){
    console.log("setting path...");
    if (this.directory && this.fileName) {

        if (this.directory.charAt(this.directory.length - 1) !== '/') {
            this.directory = this.directory + '/';
        }

        this.path = this.directory + this.fileName;
        console.log("set path to: " + this.path);

    }
};

imageSchema.pre('save', function(next){
    console.log("image pre save");
    this.setPath();
    next();
});

imageSchema.post('init', function(doc){
    console.log("post init");
    doc.setPath();
});


var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
imageSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('Image', imageSchema);

