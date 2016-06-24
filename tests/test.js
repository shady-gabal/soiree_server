/**
 * Created by shadygabal on 6/3/16.
 */
var chai = require('chai');
//var assert = chai.assert;

chai.config.includeStack = true;
global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;

describe('Array', function() {
    describe('#indexOf()', function () {

        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        });

    });
});