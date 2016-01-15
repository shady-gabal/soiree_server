/**
 * Created by shadygabal on 1/13/16.
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
var bcrypt = require('bcrypt');

var SALT_LENGTH = 10;

var adminSchema = new Schema({
        firstName : {type: String, required: true}, /* Name */
        lastName : {type: String, required: true},
        phoneNumber : {type : String, required: true},
        email : {type: String, required: true},
        password : {type: String, required: true},
        classType : {type: String, default: 'admin', enum: ['admin']}
        //salt : {type: String}

    },
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

adminSchema.statics.createAdmin = function(admin, email, password, successCallback, errorCallback){
    var Admin = this;

    //if no email or password return
    if (!email || !password){
        console.log("No username/pw specified in createAdmin()");
        return errorCallback();
    }

    admin.email = email;

    //create salt
    bcrypt.genSalt(SALT_LENGTH, function(err, salt) {
        if (err){
            console.log("Error creating salt - Admin.createAdmin()");
            return errorCallback();
        }
        //use salt to hash password
        bcrypt.hash(password, salt, function(err, hash) {
            if (err){
                console.log("Error generating password hash - createAdmin()");
                return errorCallback();
            }

            // Store hash in your password DB.
            admin.password = hash;

            var newAdmin = new Admin(admin);

            newAdmin.save(function(err, savedAdmin){
               if (err){
                   console.log("Error saving new admin - createAdmin(): " + err);
                   return errorCallback(err);
               }
               successCallback(savedAdmin);
            });
        });
    });
};

adminSchema.statics.isLoggedIn = function(req){
    if (req.user && req.user.classType === 'admin') {
        return true;
    }
    return false;
};

//adminSchema.methods.validPassword = function(password){
//    return bcrypt.compareSync(password, this.password);
//};

adminSchema.methods.validatePassword = function(password, callback){
    bcrypt.compare(password, this.password, callback);
};

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
adminSchema.plugin(deepPopulate, options);


module.exports = mongoose.model('Admin', adminSchema);
