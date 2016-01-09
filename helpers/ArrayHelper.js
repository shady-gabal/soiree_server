/**
 * Created by shadygabal on 1/7/16.
 */

var arrHelper = (function() {
    return {
        move : function(arr, fromIndex, toIndex) {
            if (toIndex < 0 || fromIndex < 0 || !arr || fromIndex == toIndex)
             return;

            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        }

    }

    });

module.exports = arrHelper;

