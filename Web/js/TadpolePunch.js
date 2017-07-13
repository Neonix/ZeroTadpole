/**
 * Created by neonix on 07/07/2017.
 */
var TadpolePunch = function(tadpole) {
    var punch = this;
    var tadpole = tadpole;
    punch.joints = [];

    punch.update = function() {

    }

    punch.draw = function(context) {

        var path = [[],[]];
        context.beginPath();

        //var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * espacement + décalage;
        //var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * 2 + 2;

        var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * 2 + 2;
        var y1 = tadpole.y + Math.sin(tadpole.angle + Math.PI * 1.5) * tadpole.size * 2 + 2;

        var x2 = tadpole.x + Math.cos(tadpole.angle + Math.PI / 2) * tadpole.size * 2 + 2;
        var y2 = tadpole.y + Math.sin(tadpole.angle + Math.PI / 2) * tadpole.size * 2 + 2;

        path[0].push({x: x1, y: y1});
        path[1].push({x: x2, y: y2});

        //fist 1
        context.arc(path[0][0].x, path[0][0].y, tadpole.size / 2, tadpole.angle + Math.PI * 2.7, tadpole.angle + Math.PI * 1.3, true);
        //fist 2
        context.arc(path[1][0].x, path[1][0].y, tadpole.size / 2, tadpole.angle + Math.PI * 2.7, tadpole.angle + Math.PI * 1.3, true);

        context.closePath();
        context.fill();

    }

    //Constructor

}