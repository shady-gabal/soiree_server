/**
 * Created by shadygabal on 12/24/15.
 */

var emailHelpers = (function() {
    var nodemailer = require('nodemailer');

    // create reusable transporter object using SMTP transport
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'shadygabal@gmail.com',
            pass: 'AMIR9701663'
        }
    });

    var validator = require('validator');

    return {
        sendVerificationEmail: function (email, user, successCallback, errorCallback) {

            // NB! No need to recreate the transporter object. You can use
            // the same transporter object for all e-mails

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: 'Soiree <shadygabal@gmail.com>', // sender address
                to: 'sg3301@nyu.edu', // list of receivers
                subject: 'Hello. Is it me youre looking for', // Subject line
                text: 'Hello world', // plaintext body
                html: '<b>Hello world ✔</b>' // html body
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

module.exports = emailHelpers;






