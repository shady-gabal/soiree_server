var func = function(){

    console.log("running soireeCreator...");

    var Soiree = require('app/db/Soiree.js');
    var Globals = require('app/helpers/Globals.js');


    var numToCreatePerType = {
        "dinner" : 3, "drinks" : 3, "soiree date" : 3, "test" : 3, "movie" : 3
    };
    var soireeTypes = ["dinner", "drinks", "soiree date", "test", "movie"];

    var soireeType = soireeTypes[0];
    var currSoireeTypeIndex = 0, numSoireeTypeCreated = 0, numSoireeTypeToCreate = numToCreatePerType[soireeType];


    console.log('about to create soiree of type ' + soireeType);

    var cb = function(){
        console.log('in cb: numSoireeTypeCreated ' + numSoireeTypeCreated + ' numSoireeTypeToCreate ' + numSoireeTypeToCreate + ' currSoireeTypeIndex ' + currSoireeTypeIndex + ' soireeType ' + soireeType);

        if (numSoireeTypeCreated > numSoireeTypeToCreate || !numSoireeTypeToCreate){
            currSoireeTypeIndex++;
            if (currSoireeTypeIndex < soireeTypes.length){

                soireeType = soireeTypes[currSoireeTypeIndex];

                while(!numToCreatePerType[soireeType]){
                    soireeType = soireeTypes[++currSoireeTypeIndex];
                }

                numSoireeTypeToCreate = numToCreatePerType[soireeType];
                numSoireeTypeCreated = 0;
            }
            else{
                //done
                console.log('returning');
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


};

module.exports = func;