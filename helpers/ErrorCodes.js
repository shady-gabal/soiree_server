/**
 * Created by shadygabal on 1/3/16.
 */

var errorCodes = (function() {

    return {
        'SoireeError' : 'SoireeError',
        'SoireeFull' : 'SoireeFull',
        'SoireeExpired' : 'SoireeExpired',
        'MissingStripeCustomerId' : 'MissingStripeCustomerId',
        'StripeError' : 'StripeError'
    }

}());

module.exports = errorCodes;
