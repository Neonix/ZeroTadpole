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
	// Whether we have received at least one authoritative target position from the server.
	// This avoids treating (0,0) as "no target" which can break interpolation.
	this._hasTarget = false;
	
	// Pour l'interpolation avec gestion de latence
	this.prevX = 0;
	this.prevY = 0;
	this.lastUpdateTime = 0;
	this.interpolationSpeed = 0.15; // Vitesse d'interpolation de base
	
	this.messages = [];
	this.timeSinceLastActivity = 0;
	
	this.changed = 0;
	this.timeSinceLastServerUpdate = 0;
	
	// Constantes pour la gestion de latence
	var SNAP_THRESHOLD = 200; // Distance pour téléportation directe
	// Slightly faster interpolation to reduce perceived latency for remote players.
	var INTERPOLATION_BASE = 0.16;
	var INTERPOLATION_FAST = 0.32;
	// Use time-based thresholds (game runs at 30fps by default, so frame-based
	// thresholds would otherwise double perceived delays).
	var MAX_MS_WITHOUT_UPDATE = 3000;
	
	this.update = function(mouse, model) {
		var nowMs = Date.now();
		var isLocal = !!(model && model.userTadpole && model.userTadpole.id === tadpole.id);
		var msSinceUpdate = tadpole.lastUpdateTime ? (nowMs - tadpole.lastUpdateTime) : 999999;
		tadpole.timeSinceLastServerUpdate++;
		
		// Mouvement propre (basé sur l'angle et le momentum)
		tadpole.x += Math.cos(tadpole.angle) * tadpole.momentum;
		tadpole.y += Math.sin(tadpole.angle) * tadpole.momentum;

		// Interpolation vers la position cible (autres joueurs uniquement)
		// Note: we rely on _hasTarget so (0,0) remains a valid target.
		if(!isLocal && tadpole._hasTarget) {
			var dx = tadpole.targetX - tadpole.x;
			var dy = tadpole.targetY - tadpole.y;
			var distance = Math.sqrt(dx * dx + dy * dy);
			
			// Si trop loin, téléporter directement (gestion de la latence)
			if (distance > SNAP_THRESHOLD) {
				tadpole.x = tadpole.targetX;
				tadpole.y = tadpole.targetY;
			} else if (distance > 1) {
				// Interpolation adaptative selon la distance
				var speed = distance > 50 ? INTERPOLATION_FAST : INTERPOLATION_BASE;
				
				// Accélérer si pas de mise à jour depuis longtemps (time-based)
				if (msSinceUpdate > 1000) {
					speed = Math.min(speed * 1.5, 0.45);
				}
				
				tadpole.x += dx * speed;
				tadpole.y += dy * speed;
			}
		}
		
		// Si pas de mise à jour depuis trop longtemps, on continue avec le momentum
		if (!isLocal && msSinceUpdate > MAX_MS_WITHOUT_UPDATE) {
			// Dead reckoning: continuer dans la direction actuelle
			tadpole.x += Math.cos(tadpole.angle) * tadpole.momentum * 0.5;
			tadpole.y += Math.sin(tadpole.angle) * tadpole.momentum * 0.5;
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
		// Le joueur local se met à jour à chaque frame via l'input :
		// on évite d'utiliser timeSinceLastServerUpdate (pensé pour les entités distantes)
		// afin de supprimer les effets de "latence" visuelle (fade / inertie) quand on est immobile.
		tadpole.timeSinceLastServerUpdate = 0;

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
		// Show names for other players as usual, but only show creature/NPC names on mouseover.
		// (i.e., NPC/ovule names stay hidden unless hovered.)
		if ((tadpole.isNpc || tadpole.isOvule) && !tadpole.hover) {
			return;
		}
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
		var float = Math.sin(now * 0.003) * 2; // Floating animation
		
		context.save();
		context.translate(tadpole.x, tadpole.y + float);
		
		// Main body - oval shape
		context.scale(1.8, 1.3);
		var gradient = context.createRadialGradient(-2, -2, 2, 0, 0, tadpole.size + 2);
		gradient.addColorStop(0, 'rgba(255,255,255,' + opacity + ')');
		gradient.addColorStop(0.5, 'rgba(247,214,255,' + opacity + ')');
		gradient.addColorStop(1, baseColor);
		context.fillStyle = gradient;
		context.beginPath();
		context.arc(0, 0, tadpole.size + 1, 0, Math.PI * 2);
		context.fill();
		context.restore();

		// Animated glow ring
		context.beginPath();
		context.strokeStyle = 'rgba(255,255,255,' + (0.2 + pulse * 0.5) + ')';
		context.lineWidth = 2;
		context.arc(tadpole.x, tadpole.y + float, tadpole.size + 8 + pulse * 4, 0, Math.PI * 2);
		context.stroke();
		
		// Second smaller ring
		context.beginPath();
		context.strokeStyle = 'rgba(186,137,255,' + (0.3 + pulse * 0.3) + ')';
		context.lineWidth = 1.5;
		context.arc(tadpole.x, tadpole.y + float, tadpole.size + 14 + pulse * 2, 0, Math.PI * 2);
		context.stroke();

		// Draw speech indicator when player is close
		if (isActive) {
			// Glowing close ring
			context.beginPath();
			context.strokeStyle = 'rgba(140,230,222,' + opacity + ')';
			context.lineWidth = 2;
			context.arc(tadpole.x, tadpole.y + float, tadpole.size + 4, 0, Math.PI * 2);
			context.stroke();
			
			// Eye sparkle
			context.beginPath();
			context.fillStyle = 'rgba(255,255,255,' + opacity + ')';
			context.arc(tadpole.x + 4, tadpole.y + float - 3, 2.5, 0, Math.PI * 2);
			context.fill();
			
			// Speech bubble indicator
			var bubbleX = tadpole.x + 18;
			var bubbleY = tadpole.y + float - 18;
			var bubbleSize = 8 + Math.sin(now * 0.008) * 2;
			
			context.fillStyle = 'rgba(255,255,255,0.9)';
			context.beginPath();
			context.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
			context.fill();
			
			// Dots inside bubble
			context.fillStyle = 'rgba(100,100,100,0.8)';
			var dotOffset = Math.sin(now * 0.01);
			context.beginPath();
			context.arc(bubbleX - 3, bubbleY + dotOffset, 1.5, 0, Math.PI * 2);
			context.arc(bubbleX, bubbleY - dotOffset, 1.5, 0, Math.PI * 2);
			context.arc(bubbleX + 3, bubbleY + dotOffset, 1.5, 0, Math.PI * 2);
			context.fill();
			
			// Tail of speech bubble
			context.fillStyle = 'rgba(255,255,255,0.9)';
			context.beginPath();
			context.moveTo(bubbleX - 5, bubbleY + 5);
			context.lineTo(bubbleX - 10, bubbleY + 12);
			context.lineTo(bubbleX - 2, bubbleY + 7);
			context.fill();
		}
		
		// Draw "!" indicator when Ovule has something important to say
		var hasSeen = localStorage.getItem('tadpole_has_seen');
		var quests = parseInt(localStorage.getItem('tadpole_quests_completed') || '0', 10);
		var hasChosenColor = localStorage.getItem('tadpole_color_chosen');
		
		if (!hasSeen || (quests >= 3 && !hasChosenColor)) {
			// Draw exclamation mark
			var excX = tadpole.x;
			var excY = tadpole.y + float - 28;
			var excBounce = Math.abs(Math.sin(now * 0.006)) * 3;
			
			context.fillStyle = 'rgba(246,210,140,' + (0.8 + Math.sin(now * 0.005) * 0.2) + ')';
			context.beginPath();
			context.arc(excX, excY - excBounce, 6, 0, Math.PI * 2);
			context.fill();
			
			context.fillStyle = '#1a2744';
			context.font = 'bold 10px Arial';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText('!', excX, excY - excBounce);
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
