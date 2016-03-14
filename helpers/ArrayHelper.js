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
        },
        pushOnlyOnce : function(arr, obj){
            var index = arr.indexOf(obj);
            if (index === -1){
                arr.push(obj);
            }
        },
        removeObject : function(arr, obj){
            if (!arr || !obj){
                console.log("ArrayHelper removeObject() passed empty arr or obj");
                return;
            }

            var index = arr.indexOf(obj);
            if (index != -1){
                arr.splice(index, 1);
            }
            else{
                console.log("ArrayHelper removeObject() cannot remove object because it is not in array");
                console.log(arr);
                console.log(obj);
            }
        },
        pushOnlyOncePopulated : function(doc ,field, obj){
            try {


                if (doc.populated(field)) {
                    this.pushOnlyOnce(doc[field], obj);
                }
                else {
                    if (!obj._id){
                        return console.log("pushOnlyOncePopulated() passed object without _id");
                    }
                    this.pushOnlyOnce(doc[field], obj._id);
                }
            }
            catch(err){
                console.log("Error in pushOnlyOncePopulated: " + err);
                return;
            }
        },
        removeObjectPopulated : function(doc ,field, obj){
            try{
                if (doc.populated(field)){
                    this.removeObject(doc[field], obj);
                }
                else{
                    if (!obj._id){
                        return console.log("removeObjectPopulated() passed object without _id");
                    }
                    this.removeObject(doc[field], obj._id);
                }
            }
            catch(err){
                console.log("Error in removeObjectPopulated: " + err);
                return;
            }

        }

    }

    }());

module.exports = arrHelper;




