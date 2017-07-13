/**
 * Created by neonix on 07/07/2017.
 */
var TadpolePunch = function(tadpole) {

    var punch = this;
    punch.joints = [];

    var tadpole = tadpole;
    var jointSpacing = 1.4;
    var animationRate = 0;


    punch.update = function() {
        animationRate += (.2 + tadpole.momentum / 10);


        //console.log('update');
        //console.log(tadpole.change);
        //TODO
        //console.log(tadpole.changed);

    /*
        for(var i = 0, len = punch.joints.length; i < len; i++) {
            var punchJoint = punch.joints[i];
            var parentJoint = punch.joints[i-1] || tadpole;
            var anglediff = (parentJoint.angle - punchJoint.angle);

            while(anglediff < -Math.PI) {
                anglediff += Math.PI * 2;
            }
            while(anglediff > Math.PI) {
                anglediff -= Math.PI * 2;
            }
            punchJoint.angle += anglediff * (jointSpacing * 3 + (Math.min(tadpole.momentum / 2, Math.PI * 1.8))) / 8;
            punchJoint.angle += Math.cos(animationRate - (i / 3)) * ((tadpole.momentum + .3) / 40);

            if(i == 0) {
                punchJoint.x = parentJoint.x + Math.cos(punchJoint.angle + Math.PI) * 5;
                punchJoint.y = parentJoint.y + Math.sin(punchJoint.angle + Math.PI) * 5;
            } else {
                punchJoint.x = parentJoint.x + Math.cos(punchJoint.angle + Math.PI) * jointSpacing;
                punchJoint.y = parentJoint.y + Math.sin(punchJoint.angle + Math.PI) * jointSpacing;
            }
        }

        */
    }

    punch.draw = function(context) {

        var path = [[],[]];
        var opacity = Math.max(Math.min(20 / Math.max(tadpole.timeSinceLastServerUpdate-300,1),1),.2).toFixed(3);


        //var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * espacement + décalage;
        //var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * 2 + 2;
        var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * 1.5 + 1.5;
        var y1 = tadpole.y + Math.sin(tadpole.angle + Math.PI * 1.5) * tadpole.size * 1.5 + 1.5;

        var x2 = tadpole.x + Math.cos(tadpole.angle + Math.PI / 2) * tadpole.size * 1.5 + 1.5;
        var y2 = tadpole.y + Math.sin(tadpole.angle + Math.PI / 2) * tadpole.size * 1.5 + 1.5;
        path[0].push({x: x1, y: y1});
        path[1].push({x: x2, y: y2});


        //Jonction de l'annimation entre les 2 trames pour eviter les sacades
        for(var i = 0, len = punch.joints.length; i < len; i++) {
            var punchJoint = punch.joints[i];

            //TODO
            //console.log(tadpole.changed);
        }



        //fist 1
        context.beginPath();
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur    = 6;
        context.fillStyle = 'rgba(255, 151, 151,'+opacity+')';
        context.shadowColor   = 'rgba(255, 255, 255, '+opacity*0.7+')';
        context.arc(path[0][0].x, path[0][0].y, tadpole.size / 2, tadpole.angle + Math.PI * 2.7, tadpole.angle + Math.PI * 1.3, true);
        context.closePath();
        context.fill();


        //fist 2
        context.beginPath();
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur    = 6;
        context.fillStyle = 'rgba(255, 151, 151,'+opacity+')';
        context.shadowColor   = 'rgba(255, 255, 255, '+opacity*0.7+')';
        context.arc(path[1][0].x, path[1][0].y, tadpole.size / 2, tadpole.angle + Math.PI * 2.7, tadpole.angle + Math.PI * 1.3, true);
        context.closePath();
        context.fill();

    };

    //Constructor
    (function() {
        console.log("Constructor")
        for(var i = 0; i < 15; i++) {
            punch.joints.push({
                x: 0,
                y: 0,
                angle: Math.PI*2,
            })
        }
    })();
}