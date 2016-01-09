/**
 * Created by shadygabal on 12/24/15.
 */

var emailHelper = (function() {
    var nodemailer = require('nodemailer');

    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'shadygabal@gmail.com',
            pass: 'AMIR9701663'
        },
    });

    var validator = require('validator');

    return {
        sendVerificationEmail: function (email, user, successCallback, errorCallback) {

            user.generateVerificationCode();
            var code = user.verificationCode;

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: 'Soirée <donotreply@soiree.com>', // sender address
                to: email, // list of receivers
                subject: "Start experiencing Soirée", // Subject line
                text: "Hey " + user.firstName + ",\n\n" +
                      "It's time to begin experiencing Soirée. Enter verification code \n"  +
                      code +"\n to get started.", // plaintext body
                html: "Hey " + user.firstName + ",<br /><br />" +
                      "It's time to begin experiencing Soirée. Enter verification code <br /><br />"  +
                      "<b> " + code + " </b> <br /><br /> to get started."// html body
            };


            // send mail with defined transport object
            transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    console.log(error);
                    errorCallback(error);
                }
                else {
                    console.log('Message sent: ' + info.response);
                    successCallback();
                }

            });
        },

        validateEmail: function(email){
            return validator.isEmail(email);
        }
    }

}());

module.exports = emailHelper;






