/**
 * Created by shadygabal on 10/23/15.
 */
var dateHelper = (function() {

    return {
        isSameDay: function (firstDate, secondDate) {
            return firstDate.toDateString() === secondDate.toDateString();
        },

        isNextDay: function (firstDate, secondDate) {
            var nextDayDiff = 1000 * 60 * 60 * 24;
            var midnightOne = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDay());
            var midnightTwo = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDay());

            var diff = Math.abs(midnightTwo - midnightOne);
            return diff == nextDayDiff;
        },

        dayFromDayNumber: function (num) {
            switch (num) {
                case 0:
                    return "Sunday";
                    break;
                case 1:
                    return "Monday";
                    break;
                case 2:
                    return "Tuesday";
                    break;
                case 3:
                    return "Wednesday";
                    break;
                case 4:
                    return "Thursday";
                    break;
                case 5:
                    return "Friday";
                    break;
                case 6:
                    return "Saturday";
                    break;
                default:
                    return "Error";
                    break;
            }
        }
    }

}());

module.exports = dateHelper;

