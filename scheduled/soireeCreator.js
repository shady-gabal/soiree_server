var func = function(){

    console.log("running soireeCreator...");

    var Soiree = require('app/db/Soiree.js');
    var Globals = require('app/helpers/Globals.js');

    var numToCreatePerType = {
      "Lunch" : 2, "Dinner" : 2, "Drinks" : 2, "Blind Date" : 2, "TEST" : 2
    };

    var soireeType = Globals.soireeTypes[0];
    var currSoireeTypeIndex = 0, numSoireeTypeCreated = 0, numSoireeTypeToCreate = numToCreatePerType[soireeType];

    //for (var i = 0; i < Globals.soireeTypes.length; i++){
    //    var soireeType = Globals.soireeTypes[i];

        //var numToCreate = numToCreatePerType[soireeType];
        //if (numToCreate){
        //    for (var j = 0; j < numToCreate; j++){

                    console.log('about to create soiree of type ' + soireeType);

                var cb = function(){
                    console.log('in cb: numSoireeTypeCreated ' + numSoireeTypeCreated + ' numSoireeTypeToCreate ' + numSoireeTypeToCreate + ' currSoireeTypeIndex ' + currSoireeTypeIndex + ' soireeType ' + soireeType);

                    if (numSoireeTypeCreated > numSoireeTypeToCreate){
                        currSoireeTypeIndex++;
                        if (currSoireeTypeIndex < Globals.soireeTypes.length){

                            soireeType = Globals.soireeTypes[currSoireeTypeIndex];

                            while(!numToCreatePerType[soireeType]){
                                soireeType = Globals.soireeTypes[++currSoireeTypeIndex];
                            }

                            numSoireeTypeToCreate = numToCreatePerType[soireeType];
                            numSoireeTypeCreated = 0;
                        }
                        else{
                            //done
                            return;
                        }
                    }
                    createSoiree();

                };

                var createSoiree = function(){
                    console.log('in createSoiree: numSoireeTypeCreated ' + numSoireeTypeCreated + ' numSoireeTypeToCreate ' + numSoireeTypeToCreate + ' currSoireeTypeIndex ' + currSoireeTypeIndex + ' soireeType ' + soireeType);

                    Soiree.createSoireeWithType(soireeType, function(soiree){

                        console.log("created soiree " + soiree.soireeId + " of type: " + soiree.soireeType + " in soireeCreator");

                        numSoireeTypeCreated++;
                        cb();

                    }, function(err){

                        console.log("error creating soiree in soireeCreator: " + err);
                        numSoireeTypeCreated++;
                        cb();

                    }, {});
                };


                cb();


                //}
        //    }
        //}
    //}
};

module.exports = func;