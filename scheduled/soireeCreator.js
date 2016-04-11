var func = function(){

    var dbFolderLocation = "../db/";
    var helpersFolderLocation = "../helpers/";

    var Soiree = require('app/db/Soiree.js');
    var Globals = require('app/helpers/Globals.js');

    var numToCreatePerType = {
      "lunch" : 1, "dinner" : 1, "drinks" : 1, "blind date" : 2
    };

    for (var i = 0; i < Soiree.soireeTypes.length; i++){
        var soireeType = Soiree.soireeTypes[i];

        var numToCreate = numToCreatePerType[soireeType];
        if (numToCreate){
            for (var j = 0; j < numToCreate; j++){
                for (var k = 0; k < Globals.colleges.length; k++){

                }
            }
        }
    }
};

module.exports = func;