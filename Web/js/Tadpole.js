var Tadpole = function() {
	var tadpole = this;
	
	this.x = Math.random() * 300 - 150;
	this.y = Math.random() * 300 - 150;
	this.size = 4;
	
	this.name = '';
	this.color = '#9ad7ff';
	this.age = 0;
	
	this.hover = false;

	this.momentum = 0;
	this.maxMomentum = 3;
	this.angle = Math.PI * 2;
	
	this.targetX = 0;
	this.targetY = 0;
	this.targetMomentum = 0;
	
	this.messages = [];
	this.timeSinceLastActivity = 0;
	
	this.changed = 0;
	this.timeSinceLastServerUpdate = 0;
	
	this.update = function(mouse, model) {
		tadpole.timeSinceLastServerUpdate++;
		
		tadpole.x += Math.cos(tadpole.angle) * tadpole.momentum;
		tadpole.y += Math.sin(tadpole.angle) * tadpole.momentum;

		//Collision
		/*for(id in model.tadpoles) {
			console.log(Math.round(tadpole.x), model.tadpoles[id].x);


			if (	tadpole.id != model.tadpoles[id].id  &&
					Math.round(tadpole.x) == Math.round(model.tadpoles[id].x) )
				console.log('COLISION');


			//model.tadpoles[id].draw(context);
		}*/


		if(tadpole.targetX != 0 || tadpole.targetY != 0) {
			tadpole.x += (tadpole.targetX - tadpole.x) / 20;
			tadpole.y += (tadpole.targetY - tadpole.y) / 20;
		}
		
		// Update messages
		for (var i = tadpole.messages.length - 1; i >= 0; i--) {
			var msg = tadpole.messages[i];
			msg.update();
			
			if(msg.age == msg.maxAge) {
				tadpole.messages.splice(i,1);
			}
		}

		// Update tadpole hover/mouse state
		if(Math.sqrt(Math.pow(tadpole.x - mouse.worldx,2) + Math.pow(tadpole.y - mouse.worldy,2)) < tadpole.size+2) {
			tadpole.hover = true;
			mouse.tadpole = tadpole;
		}
		else {
			if(mouse.tadpole && mouse.tadpole.id == tadpole.id) {
				//mouse.tadpole = null;
			}
			tadpole.hover = false;
		}

		tadpole.tail.update();
		tadpole.punch.update();

	};
	
	this.onclick = function(e) {
		if(tadpole.isNpc && e.which == 1) {
			if (window.openNpcDialog) {
				window.openNpcDialog();
			}
			return true;
		}
		if(e.ctrlKey && e.which == 1) {
			if(isAuthorized() && tadpole.hover) {
				window.open("http://twitter.com/" + tadpole.name.substring(1));
                return true;
			}
		}
		else if(e.which == 2) {
			//todo:open menu
			e.preventDefault();
            return true;
		}
        return false;
	};
	
	this.userUpdate = function(tadpoles, angleTargetX, angleTargetY) {
		this.age++;

		var prevState = {
			angle: tadpole.angle,
			momentum: tadpole.momentum,
		}
		
		// Angle to targetx and targety (mouse position)
		var anglediff = ((Math.atan2(angleTargetY - tadpole.y, angleTargetX - tadpole.x)) - tadpole.angle);
		while(anglediff < -Math.PI) {
			anglediff += Math.PI * 2;
		}
		while(anglediff > Math.PI) {
			anglediff -= Math.PI * 2;
		}
		
		tadpole.angle += anglediff / 5;
		
		// Momentum to targetmomentum
		if(tadpole.targetMomentum != tadpole.momentum) {
			tadpole.momentum += (tadpole.targetMomentum - tadpole.momentum) / 20;
		}
				
		if(tadpole.momentum < 0) {
			tadpole.momentum = 0;
		}
		
		tadpole.changed += Math.abs((prevState.angle - tadpole.angle)*3) + tadpole.momentum;
		
		if(tadpole.changed > 1) {
			this.timeSinceLastServerUpdate = 0;
		}
	};
	
	this.draw = function(context) {
		var opacity = Math.max(Math.min(20 / Math.max(tadpole.timeSinceLastServerUpdate-300,1),1),.2).toFixed(3);
		var baseColor = colorToRgba(tadpole.color || '#9ad7ff', opacity);

		if(tadpole.isNpc && tadpole.isOvule) {
			drawOvule(context, baseColor, opacity, tadpole.hover || tadpole.isClose);
			drawName(context);
			return;
		} else if(tadpole.isNpc) {
			context.fillStyle = baseColor;
		} else if(tadpole.hover && isAuthorized()) {
			context.fillStyle = 'rgba(192, 253, 247,'+opacity+')';
			// context.shadowColor   = 'rgba(249, 136, 119, '+opacity*0.7+')';
		}
		else {
			context.fillStyle = baseColor;
			}
		
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowBlur    = 6;
		context.shadowColor   = 'rgba(255, 255, 255, '+opacity*0.7+')';
		
		// Draw circle
		context.beginPath();
		context.arc(tadpole.x, tadpole.y, tadpole.size, tadpole.angle + Math.PI * 2.7, tadpole.angle + Math.PI * 1.3, true);
		tadpole.tail.draw(context);

		context.closePath();
		context.fill();
		
			context.shadowBlur = 0;
			context.shadowColor   = '';

		tadpole.punch.draw(context);
		if (tadpole.isNpc) {
			context.beginPath();
			context.strokeStyle = 'rgba(140, 230, 222,' + opacity + ')';
			context.lineWidth = 1.5;
			context.arc(tadpole.x, tadpole.y, tadpole.size + 3, 0, Math.PI * 2);
			context.stroke();
		}
		drawName(context);
		drawMessages(context);
	};
	
	var isAuthorized = function() {
		return tadpole.name.charAt('0') == "@";
	};

	var drawName = function(context) {
		var opacity = Math.max(Math.min(20 / Math.max(tadpole.timeSinceLastServerUpdate-300,1),1),.2).toFixed(3);
		context.fillStyle = colorToRgba(tadpole.color || '#9ad7ff', opacity);
		context.shadowColor   = 'rgba(255, 255, 255, '+opacity*0.7+')';
		context.font = 7 + "px 'proxima-nova-1','proxima-nova-2', arial, sans-serif";
		context.textBaseline = 'hanging';
		var width = context.measureText(tadpole.name).width;
		context.fillText(tadpole.name, tadpole.x - width/2, tadpole.y - 20);
	}
	
	var drawMessages = function(context) {
		tadpole.messages.reverse();
		for(var i = 0, len = tadpole.messages.length; i<len; i++) {
			tadpole.messages[i].draw(context, tadpole.x+10, tadpole.y+5, i);
		}
		tadpole.messages.reverse();
	};

	var colorToRgba = function(hex, alpha) {
		var normalized = hex.replace('#', '');
		if (normalized.length === 3) {
			normalized = normalized.split('').map(function(c) { return c + c; }).join('');
		}
		var bigint = parseInt(normalized, 16);
		if (isNaN(bigint)) {
			return 'rgba(226,219,226,' + alpha + ')';
		}
		var r = (bigint >> 16) & 255;
		var g = (bigint >> 8) & 255;
		var b = bigint & 255;
		return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
	};

	var drawOvule = function(context, baseColor, opacity, isActive) {
		var now = Date.now();
		var pulse = 0.6 + Math.sin(now * 0.005) * 0.4;
		context.save();
		context.translate(tadpole.x, tadpole.y);
		context.scale(1.8, 1.3);
		var gradient = context.createRadialGradient(-2, -2, 2, 0, 0, tadpole.size + 2);
		gradient.addColorStop(0, 'rgba(255,255,255,' + opacity + ')');
		gradient.addColorStop(1, baseColor);
		context.fillStyle = gradient;
		context.beginPath();
		context.arc(0, 0, tadpole.size + 1, 0, Math.PI * 2);
		context.fill();
		context.restore();

		context.beginPath();
		context.strokeStyle = 'rgba(255,255,255,' + (0.2 + pulse * 0.5) + ')';
		context.lineWidth = 2;
		context.arc(tadpole.x, tadpole.y, tadpole.size + 8 + pulse * 4, 0, Math.PI * 2);
		context.stroke();

		if (isActive) {
			context.beginPath();
			context.strokeStyle = 'rgba(255,255,255,' + opacity + ')';
			context.lineWidth = 1.5;
			context.arc(tadpole.x, tadpole.y, tadpole.size + 5, 0, Math.PI * 2);
			context.stroke();
			context.beginPath();
			context.fillStyle = 'rgba(255,255,255,' + opacity + ')';
			context.arc(tadpole.x + 3, tadpole.y - 2, 2.2, 0, Math.PI * 2);
			context.fill();
		}
	};

	//Surement ici :p Action du Punch
	var punchingAction = function(context) {

	};

	// Constructor
	(function() {
		tadpole.tail 	= new TadpoleTail(tadpole);
		tadpole.punch	= new TadpolePunch(tadpole);
	})();
}
