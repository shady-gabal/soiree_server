var func = function(){

    console.log("running soireeCreator...");

    var dbFolderLocation = "../db/";
    var helpersFolderLocation = "../helpers/";

    var Soiree = require('app/db/Soiree.js');
    var Globals = require('app/helpers/Globals.js');

    var numToCreatePerType = {
      "Lunch" : 2, "Dinner" : 2, "Drinks" : 2, "Blind Date" : 2
    };

    for (var i = 0; i < Globals.soireeTypes.length; i++){
        var soireeType = Globals.soireeTypes[i];

        var numToCreate = numToCreatePerType[soireeType];
        if (numToCreate){
            for (var j = 0; j < numToCreate; j++){
                //for (var k = 0; k < Globals.colleges.length; k++){
                //    var college = Globals.colleges[k];
                    console.log('about to create soiree of type ' + soireeType);

                    Soiree.createSoireeWithType(soireeType, function(soiree){
                        console.log("created soiree " + soiree.soireeId + " of type: " + soiree.soireeType + " in soireeCreator");
                    }, function(err){
                        console.log("error creating soiree in soireeCreator: " + err);
                    }, {});
                //}
            }
        }
    }
};

module.exports = func;