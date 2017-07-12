/**
 * Created by neonix on 07/07/2017.
 */
var TadpolePunch = function(tadpole) {
    var punch = this;
    var tadpole = tadpole;
    punch.joints = [];

    console.log('dd');
    punch.update = function() {

    }

    punch.draw = function(context) {
        console.log("punch.draw");

        context.arc(tadpole.x + 1, tadpole.y + 1, tadpole.size + 10, tadpole.angle + Math.PI * 2.7, tadpole.angle + Math.PI * 1.3, true);


    }

    //Constructor

}