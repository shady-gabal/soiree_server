/**
 * Created by shadygabal on 10/22/15.
 */
/* Setup */
var mongoose = require('./mongoose_connect.js');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var ObjectIdConstructor = mongoose.Types.ObjectId;


/* Other Models */
//var Business = require('./Business.js');
var User = require('./User.js');
var Soiree = require('./Soiree.js');
var Admin = require('./Admin.js');

/* Packages */
var shortid = require('shortid');
var bcrypt = require('bcrypt');

var SALT_LENGTH = 10;

/* Schema Specific */
var businessTypes = ["Bar", "Restaurant", "Cafe"];
var tags = ["vegan options", "vegetarian options", "outdoor seating"];
/* Helpers */
var helpersFolderLocation = "../helpers/";
var DateHelper = require(helpersFolderLocation + 'DateHelper.js');
var ResHelper = require(helpersFolderLocation + 'ResHelper.js');
var CreditCardHelper = require(helpersFolderLocation + 'CreditCardHelper.js');
var LocationHelper = require(helpersFolderLocation + 'LocationHelper.js');
var PushNotificationHelper = require(helpersFolderLocation + 'PushNotificationHelper.js');
var ErrorCodes = require(helpersFolderLocation + 'ErrorCodes.js');

var businessSchema = new Schema({
        businessType : {type: String, enum: businessTypes},
        businessName : {type: String, required: [true, "Business must have a name"]},
        businessId: {type: String, index: true, default: shortid.generate},
        _soirees : [{type: ObjectId, ref:"Soiree"}],
        location: {
            type: {type: String},
            coordinates: []
        },
        phoneNumber : {type: String, required: true},
        cityArea : {type: String},
        numSoireesHosted : {type: Number, default: 0},
        _approvedBy: {type: ObjectId, ref: "Admin"},
        email : {type: String, required: true},
        password : {type: String, required: true},
        classType : {type: String, default: "business", enum: ['business']},
        tags : [{type: String, enum: tags}]

    },
    { timestamps: { createdAt: 'dateCreated', updatedAt: 'dateUpdated' } }
);

businessSchema.index({location: '2dsphere'});


businessSchema.statics.createBusiness = function(business, email, password, successCallback, errorCallback){
    var Business = this;

    //if no email or password return
    if (!email || !password){
        console.log("No username/pw specified in createBusiness()");
        return errorCallback();
    }

    business.email = email;

    //create salt
    bcrypt.genSalt(SALT_LENGTH, function(err, salt) {
        if (err){
            console.log("Error creating salt - Business.createBusiness()");
            return errorCallback();
        }

        //use salt to hash password
        bcrypt.hash(password, salt, function(err, hash) {
            if (err){
                console.log("Error generating password hash - createBusiness()");
                return errorCallback();
            }

            // Store hash in your password DB.
            business.password = hash;

            var newBusiness = new Business(business);

            newBusiness.save(function(err, savedBusiness){
                if (err){
                    console.log("Error saving new business - createBusiness(): " + err);
                    return errorCallback(err);
                }
                successCallback(savedBusiness);
            });
        });
    });
};

businessSchema.statics.nextBusinessToHostSoiree = function(callback){
    this.findOne({email : "shady@wearethirdrail.com"}, function(err, obj){
       if (err) {
           console.log("Error finding next business to host soiree");
           callback(null);
       }
        else{
           if (!obj) {
               callback(obj);
           }
           else {
               console.log("Found next business to host soiree: " + obj.businessName);
               callback(obj);
           }
       }
    });
};

businessSchema.statics.checkIfLoggedIn = function(req, res, next){
    if (!isLoggedIn(req)){
        res.redirect('/businessLogin');
    }
    else{
        req.business = req.user;
        next();
    }
};

businessSchema.statics.isLoggedIn = function(req){
    return isLoggedIn(req);
};

//businessSchema.methods.validPassword = function(password){
//    return bcrypt.compareSync(password, this.password);
//};

businessSchema.methods.validatePassword = function(password, callback){
    bcrypt.compare(password, this.password, callback);
};


function isLoggedIn(req){
    if (req.user && req.user.classType === 'business') {
        return true;
    }
    return false;
};

//businessSchema.pre('save', function(next){
//    this.dateUpdated = new Date();
//    next();
//});

var deepPopulate = require('mongoose-deep-populate')(mongoose);
var options = {};
businessSchema.plugin(deepPopulate, options);

module.exports = mongoose.model('Business', businessSchema);

