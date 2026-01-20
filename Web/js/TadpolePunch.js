/**
 * Created by neonix on 07/07/2017.
 */
var TadpolePunch = function(tadpole) {

    var punch = this;
    punch.joints = [];

    var jointSpacing = 1.6;
    var animationRate = 0;


    punch.update = function() {
        animationRate += (0.12 + tadpole.momentum / 14);


        //console.log('update');
        //console.log(tadpole.change);
        //TODO
        //console.log(tadpole.changed);


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
            punchJoint.angle += anglediff * (jointSpacing * 2.4 + Math.min(tadpole.momentum, Math.PI * 1.6)) / 10;
            punchJoint.angle += Math.cos(animationRate - (i / 3)) * ((tadpole.momentum + 0.3) / 55);

            if(i == 0) {
                punchJoint.x = parentJoint.x + Math.cos(punchJoint.angle + Math.PI) * 5;
                punchJoint.y = parentJoint.y + Math.sin(punchJoint.angle + Math.PI) * 5;
            } else {
                punchJoint.x = parentJoint.x + Math.cos(punchJoint.angle + Math.PI) * jointSpacing;
                punchJoint.y = parentJoint.y + Math.sin(punchJoint.angle + Math.PI) * jointSpacing;
            }

        }

    }

    punch.draw = function(context) {

        var opacity = Math.max(Math.min(18 / Math.max(tadpole.timeSinceLastServerUpdate - 250, 1), 1), 0.2);
        var punchColor = tadpole.color || '#ff9a9a';


        //var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * espacement + décalage;
        //var x1 = tadpole.x + Math.cos(tadpole.angle + Math.PI * 1.5) * tadpole.size * 2 + 2;

        context.save();
        context.globalAlpha = opacity;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        context.lineWidth = Math.max(1.5, tadpole.size / 3);
        context.beginPath();
        for(var i = 0, len = punch.joints.length; i < len; i++) {
            var joint = punch.joints[i];
            if(i === 0) {
                context.moveTo(joint.x, joint.y);
            } else {
                context.lineTo(joint.x, joint.y);
            }
        }
        context.stroke();

        context.strokeStyle = punchColor;
        context.lineWidth = Math.max(2.2, tadpole.size / 2.4);
        context.beginPath();
        for(var j = 0, jLen = punch.joints.length; j < jLen; j++) {
            var jointLine = punch.joints[j];
            if(j === 0) {
                context.moveTo(jointLine.x, jointLine.y);
            } else {
                context.lineTo(jointLine.x, jointLine.y);
            }
        }
        context.stroke();

        var fist = punch.joints[0];
        var fistRadius = Math.max(3, tadpole.size * 0.7);
        var gradient = context.createRadialGradient(fist.x - 2, fist.y - 2, 1, fist.x, fist.y, fistRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        gradient.addColorStop(1, punchColor);
        context.fillStyle = gradient;
        context.shadowBlur = 8;
        context.shadowColor = 'rgba(255, 255, 255, 0.3)';
        context.beginPath();
        context.arc(fist.x, fist.y, fistRadius, 0, Math.PI * 2);
        context.fill();
        context.restore();

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
