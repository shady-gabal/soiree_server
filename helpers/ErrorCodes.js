/**
 * Created by shadygabal on 1/3/16.
 */

var errorCodes = (function() {

    return {
        'SoireeError' : 'SoireeError',
        'UserAlreadyJoinedSoiree' : 'UserAlreadyJoinedSoiree',
        'SoireeFull' : 'SoireeFull',
        'SoireeExpired' : 'SoireeExpired',
        'MissingStripeCustomerId' : 'MissingStripeCustomerId',
        'StripeError' : 'StripeError',
        'SoireeLoadError' : 'SoireeLoadError'
    }

}());

module.exports = errorCodes;
