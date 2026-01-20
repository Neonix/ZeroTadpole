

var App = function(aSettings, aCanvas) {
	var app = this;
	
	var 	model,
			canvas,
			context,
			webSocket,
			webSocketService,
			mouse = {x: 0, y: 0, worldx: 0, worldy: 0, tadpole:null},
			keyNav = {x:0,y:0},
			messageQuota = 5
	;
	var scoreEl = document.getElementById('score-value');
	var questEl = document.getElementById('quest-progress');
	var boostEl = document.getElementById('boost-status');
	var gemsEl = document.getElementById('gems-value');
	var bonusEl = document.getElementById('bonus-status');
	
	app.update = function() {
	  if (messageQuota < 5 && model.userTadpole.age % 50 == 0) { messageQuota++; }
	  var now = Date.now();
	  var bonusActive = model.bonusActiveUntil && now < model.bonusActiveUntil;
	  if (model.boostUntil && now < model.boostUntil && model.userTadpole.targetMomentum > 0) {
			model.userTadpole.targetMomentum = model.userTadpole.maxMomentum * 1.8;
	  } else if (bonusActive && model.userTadpole.targetMomentum > 0) {
			model.userTadpole.targetMomentum = model.userTadpole.maxMomentum * 1.5;
	  } else if (model.userTadpole.targetMomentum > model.userTadpole.maxMomentum) {
			model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
	  }

		// Update usertadpole
		if(keyNav.x != 0 || keyNav.y != 0) {
			model.userTadpole.userUpdate(model.tadpoles, model.userTadpole.x + keyNav.x,model.userTadpole.y + keyNav.y);
		}
		else {
			var mvp = getMouseWorldPosition();
			mouse.worldx = mvp.x;
			mouse.worldy = mvp.y;
			model.userTadpole.userUpdate(model.tadpoles, mouse.worldx, mouse.worldy);
		}
		
		if(model.userTadpole.age % 6 == 0 && model.userTadpole.changed > 1 && webSocketService.hasConnection) {
			model.userTadpole.changed = 0;
			webSocketService.sendUpdate(model.userTadpole);
		}
		
		model.camera.update(model);
		
		// Update tadpoles
		for(id in model.tadpoles) {
			model.tadpoles[id].update(mouse, model);
		}
		
		// Update waterParticles
		for(i in model.waterParticles) {
			model.waterParticles[i].update(model.camera.getOuterBounds(), model.camera.zoom);
		}
		
		// Update arrows
		for(i in model.arrows) {
			var cameraBounds = model.camera.getBounds();
			var arrow = model.arrows[i];
			arrow.update();
		}

		updateCollectibles();
		updateQuestUI();

		var npc = model.tadpoles['npc-guide'];
		if (npc && !model.npcTriggered) {
			var dx = model.userTadpole.x - npc.x;
			var dy = model.userTadpole.y - npc.y;
			var npcDistance = Math.sqrt(dx * dx + dy * dy);
			npc.isClose = npcDistance < 24;
			if (npcDistance < 20) {
				model.npcTriggered = true;
				if (window.openNpcDialog) {
					window.openNpcDialog();
				}
			}
		} else if (npc) {
			npc.isClose = false;
		}
	};
	
	
	
	app.draw = function() {
		model.camera.setupContext();
		
		// Draw waterParticles
		for(i in model.waterParticles) {
			model.waterParticles[i].draw(context);
		}

		drawCollectibles();
		
		// Draw tadpoles
		for(id in model.tadpoles) {
			model.tadpoles[id].draw(context);
		}
		
		// Start UI layer (reset transform matrix)
		model.camera.startUILayer();
		
		// Draw arrows
		for(i in model.arrows) {
			model.arrows[i].draw(context, canvas);
		}
	};
		
	
	
	app.onSocketOpen = function(e) {
		console.log('Socket opened!', e);
		
		//FIXIT: Proof of concept. refactor!
		uri = parseUri(document.location)
		console.log(uri);
		if ( uri.queryKey.oauth_token ) {
			app.authorize(uri.queryKey.oauth_token, uri.queryKey.oauth_verifier)						
		}
		// end of proof of concept code.
	};
	
	app.onSocketClose = function(e) {
		//console.log('Socket closed!', e);
		webSocketService.connectionClosed();
	};
	
	app.onSocketMessage = function(e) {
		try {
			var data = JSON.parse(e.data);
			if (Array.isArray(data)) {
				for (var i = 0; i < data.length; i++) {
					webSocketService.processMessage(data[i]);
				}
			} else {
				webSocketService.processMessage(data);
			}

		} catch(e) {}
	};

	var connectSocket = function() {
		webSocket = new WebSocket(model.settings.socketServer);
		webSocket.onopen = app.onSocketOpen;
		webSocket.onclose = app.onSocketClose;
		webSocket.onmessage = app.onSocketMessage;
		if (!webSocketService) {
			webSocketService = new WebSocketService(model, webSocket, connectSocket);
		} else {
			webSocketService.setSocket(webSocket);
		}
	};
	
	app.sendMessage = function(msg) {
	  
	  if (messageQuota>0) {
	    messageQuota--;
	    webSocketService.sendMessage(msg);
	  }
	  
	}
	
	app.authorize = function(token,verifier) {
		webSocketService.authorize(token,verifier);
	}

	app.requestPlayerList = function() {
		webSocketService.requestPlayerList();
	}

	app.sendPrivateMessage = function(targetId, message) {
		webSocketService.sendPrivateMessage(targetId, message);
	}
	
	app.mousedown = function(e) {
		mouse.clicking = true;

		if(mouse.tadpole && mouse.tadpole.hover && mouse.tadpole.onclick(e)) {
            return;
		}
		if(model.userTadpole && e.which == 1) {
			model.userTadpole.momentum = model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
		}


	};
	
	app.mouseup = function(e) {
		if(model.userTadpole && e.which == 1) {
			model.userTadpole.targetMomentum = 0;
		}
	};
	
	app.mousemove = function(e) {
		mouse.x = e.clientX;
		mouse.y = e.clientY;
	};

	app.keydown = function(e) {
		if(e.keyCode == keys.up) {
			keyNav.y = -1;
			model.userTadpole.momentum = model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
			e.preventDefault();
		}
		else if(e.keyCode == keys.down) {
			keyNav.y = 1;
			model.userTadpole.momentum = model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
			e.preventDefault();
		}
		else if(e.keyCode == keys.space) {
			var now = Date.now();
			if (!model.boostCooldownUntil || now > model.boostCooldownUntil) {
				model.boostUntil = now + 1000;
				model.boostCooldownUntil = now + 5000;
			}
		}
		else if(e.keyCode == keys.left) {
			keyNav.x = -1;
			model.userTadpole.momentum = model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
			e.preventDefault();
		}
		else if(e.keyCode == keys.right) {
			keyNav.x = 1;
			model.userTadpole.momentum = model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
			e.preventDefault();
		}
	};
	app.keyup = function(e) {
		if(e.keyCode == keys.up || e.keyCode == keys.down) {
			keyNav.y = 0;
			if(keyNav.x == 0 && keyNav.y == 0) {
				model.userTadpole.targetMomentum = 0;
			}
			e.preventDefault();
		}
		else if(e.keyCode == keys.left || e.keyCode == keys.right) {
			keyNav.x = 0;
			if(keyNav.x == 0 && keyNav.y == 0) {
				model.userTadpole.targetMomentum = 0;
			}
			e.preventDefault();
		}
	};
	
	app.touchstart = function(e) {
	  e.preventDefault();
	  mouse.clicking = true;		
		
		if(model.userTadpole) {
			model.userTadpole.momentum = model.userTadpole.targetMomentum = model.userTadpole.maxMomentum;
		}
		
		var touch = e.changedTouches.item(0);
    if (touch) {
      mouse.x = touch.clientX;
  		mouse.y = touch.clientY;
    }    
	}
	app.touchend = function(e) {
	  if(model.userTadpole) {
			model.userTadpole.targetMomentum = 0;
		}
	}
	app.touchmove = function(e) {
	  e.preventDefault();
    
    var touch = e.changedTouches.item(0);
    if (touch) {
      mouse.x = touch.clientX;
  		mouse.y = touch.clientY;
    }		
	}

	app.console = function(e) {
		if(e.keyCode == 64){
		console.log('Hello ' + e.keyCode);
		e.preventDefault();
		}
	};


	app.shott = function(e) {
		if(e.keyCode == keys.space) {
			console.log('shott ' + e.keyCode);

			e.preventDefault();
		}
	};


	app.resize = function(e) {
		resizeCanvas();
	};
	
	var getMouseWorldPosition = function() {
		return {
			x: (mouse.x + (model.camera.x * model.camera.zoom - canvas.width / 2)) / model.camera.zoom,
			y: (mouse.y + (model.camera.y * model.camera.zoom  - canvas.height / 2)) / model.camera.zoom
		}
	}
	
	var resizeCanvas = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};

	var updateCollectibles = function() {
		if (!model.collectibles) {
			model.collectibles = [];
		}
		ensureCollectibles();
		updateCommonOrbs();
		var now = Date.now();
		var bonusMagnet = model.bonusActiveUntil && now < model.bonusActiveUntil ? 10 : 0;
		for (var j = model.collectibles.length - 1; j >= 0; j--) {
			var orb = model.collectibles[j];
			var dx = model.userTadpole.x - orb.x;
			var dy = model.userTadpole.y - orb.y;
			if (Math.sqrt(dx * dx + dy * dy) < model.userTadpole.size + orb.r + bonusMagnet) {
				model.collectibles.splice(j, 1);
				model.score += 1;
				if (model.questCollected < model.questTarget) {
					model.questCollected += 1;
				}
				if (model.questCollected >= model.questTarget) {
					handleQuestComplete();
				}
			}
		}

		if (model.commonOrbs) {
			for (var k = model.commonOrbs.length - 1; k >= 0; k--) {
				var commonOrb = model.commonOrbs[k];
				if (model.collectedCommonOrbs[commonOrb.id]) {
					continue;
				}
				var dxCommon = model.userTadpole.x - commonOrb.x;
				var dyCommon = model.userTadpole.y - commonOrb.y;
				if (Math.sqrt(dxCommon * dxCommon + dyCommon * dyCommon) < model.userTadpole.size + commonOrb.r + bonusMagnet) {
					model.collectedCommonOrbs[commonOrb.id] = true;
					applyCommonBonus(commonOrb);
				}
			}
		}
	};

	var drawCollectibles = function() {
		if (!model.collectibles) {
			return;
		}
		var now = Date.now();
		for (var i = 0; i < model.collectibles.length; i++) {
			var orb = model.collectibles[i];
			var pulse = 1 + Math.sin(now * 0.004 + orb.pulseOffset) * 0.2;
			var radius = orb.r * pulse;
			context.beginPath();
			var gradient = context.createRadialGradient(orb.x - 2, orb.y - 2, 1, orb.x, orb.y, radius);
			gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
			gradient.addColorStop(1, 'rgba(140,230,222,0.7)');
			context.fillStyle = gradient;
			context.arc(orb.x, orb.y, radius, 0, Math.PI * 2);
			context.fill();
		}

		drawCommonOrbs();
	};

	var updateQuestUI = function() {
		if (scoreEl) {
			scoreEl.textContent = model.score;
		}
		if (gemsEl) {
			gemsEl.textContent = model.gems;
		}
		if (questEl) {
			questEl.textContent = 'Collecte ' + model.questCollected + ' / ' + model.questTarget + ' orbes';
		}
		if (boostEl) {
			var now = Date.now();
			boostEl.textContent = model.boostCooldownUntil && now < model.boostCooldownUntil ? 'Recharge' : 'Prêt';
		}
		if (bonusEl) {
			var now = Date.now();
			if (model.bonusActiveUntil && now < model.bonusActiveUntil) {
				bonusEl.textContent = 'Bonus commun : actif';
			} else {
				var remaining = model.commonOrbSeed ? ((model.commonOrbSeed + 1) * model.commonOrbCycleDuration - now) : 0;
				var seconds = Math.max(1, Math.ceil(remaining / 1000));
				bonusEl.textContent = 'Bonus commun : en carte (' + seconds + 's)';
			}
		}
	};

	var handleQuestComplete = function() {
		model.gems += 1;
		localStorage.setItem('tadpole_gems', model.gems);
		showToast('Quête terminée ! +1 Gemme');
		unlockNextColor();
		model.questCollected = 0;
		model.questTarget += 2;
	};

	var showToast = function(message) {
		var container = document.getElementById('toast-container');
		if (!container) {
			return;
		}
		var toast = document.createElement('div');
		toast.className = 'toast';
		toast.textContent = message;
		container.appendChild(toast);
		setTimeout(function() {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 2500);
	};

	var unlockNextColor = function() {
		var palette = ['#9ad7ff', '#8ce6de', '#f7d6ff', '#ffd59e', '#b8ffb0'];
		var unlocked = JSON.parse(localStorage.getItem('tadpole_colors') || '[]');
		var next = palette.find(function(color) { return unlocked.indexOf(color) === -1; });
		if (next) {
			unlocked.push(next);
			localStorage.setItem('tadpole_colors', JSON.stringify(unlocked));
			if (window.addUnlockedColor) {
				window.addUnlockedColor(next);
			}
			showToast('Nouvelle couleur débloquée');
		}
	};

	var ensureCollectibles = function() {
		if (!model.collectibleTargetCount) {
			model.collectibleTargetCount = 20;
		}
		var bounds = model.camera.getOuterBounds();
		var padding = 240;
		var minDistance = 100;
		var maxAttempts = 12;
		while (model.collectibles.length < model.collectibleTargetCount) {
			var orb = spawnOrbInBounds(bounds, padding, minDistance, model.collectibles, maxAttempts);
			if (!orb) {
				break;
			}
			model.collectibles.push(orb);
		}
	};

	var spawnOrbInBounds = function(bounds, padding, minDistance, existing, maxAttempts) {
		for (var attempt = 0; attempt < maxAttempts; attempt++) {
			var x = bounds[0].x - padding + Math.random() * (bounds[1].x - bounds[0].x + padding * 2);
			var y = bounds[0].y - padding + Math.random() * (bounds[1].y - bounds[0].y + padding * 2);
			if (!isFarFromOrbs(x, y, minDistance, existing)) {
				continue;
			}
			var dxUser = model.userTadpole.x - x;
			var dyUser = model.userTadpole.y - y;
			if (Math.sqrt(dxUser * dxUser + dyUser * dyUser) < 120) {
				continue;
			}
			return {
				x: x,
				y: y,
				r: 2 + Math.random() * 2.6,
				pulseOffset: Math.random() * Math.PI * 2
			};
		}
		return null;
	};

	var isFarFromOrbs = function(x, y, minDistance, orbs) {
		for (var i = 0; i < orbs.length; i++) {
			var dx = orbs[i].x - x;
			var dy = orbs[i].y - y;
			if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
				return false;
			}
		}
		return true;
	};

	var updateCommonOrbs = function() {
		var now = Date.now();
		var seed = Math.floor(now / model.commonOrbCycleDuration);
		if (seed !== model.commonOrbSeed) {
			model.commonOrbSeed = seed;
			model.commonOrbs = buildCommonOrbs(seed);
			model.collectedCommonOrbs = {};
		}
	};

	var buildCommonOrbs = function(seed) {
		var rng = seededRandom(seed);
		var count = 6;
		var orbs = [];
		for (var i = 0; i < count; i++) {
			var angle = rng() * Math.PI * 2;
			var radius = 360 + rng() * 920;
			var x = Math.cos(angle) * radius;
			var y = Math.sin(angle) * radius;
			var type = rng() > 0.5 ? 'boost' : 'score';
			orbs.push({
				id: seed + '-' + i,
				x: x,
				y: y,
				r: 4 + rng() * 2.5,
				type: type,
				pulseOffset: rng() * Math.PI * 2
			});
		}
		return orbs;
	};

	var drawCommonOrbs = function() {
		if (!model.commonOrbs) {
			return;
		}
		var now = Date.now();
		for (var i = 0; i < model.commonOrbs.length; i++) {
			var orb = model.commonOrbs[i];
			if (model.collectedCommonOrbs[orb.id]) {
				continue;
			}
			var pulse = 1 + Math.sin(now * 0.003 + orb.pulseOffset) * 0.25;
			var radius = orb.r * pulse;
			context.beginPath();
			var baseColor = orb.type === 'boost' ? 'rgba(255,214,137,0.9)' : 'rgba(186,137,255,0.9)';
			var glowColor = orb.type === 'boost' ? 'rgba(255,214,137,0.3)' : 'rgba(186,137,255,0.3)';
			var gradient = context.createRadialGradient(orb.x - 2, orb.y - 2, 1, orb.x, orb.y, radius + 6);
			gradient.addColorStop(0, baseColor);
			gradient.addColorStop(1, glowColor);
			context.fillStyle = gradient;
			context.arc(orb.x, orb.y, radius + 2, 0, Math.PI * 2);
			context.fill();

			context.beginPath();
			context.strokeStyle = 'rgba(255,255,255,0.6)';
			context.lineWidth = 1;
			context.arc(orb.x, orb.y, radius + 6, 0, Math.PI * 2);
			context.stroke();
		}
	};

	var applyCommonBonus = function(orb) {
		var now = Date.now();
		if (orb.type === 'boost') {
			model.bonusActiveUntil = now + 6000;
			showToast('Bonus commun : turbo !');
		} else {
			model.score += 5;
			showToast('Bonus commun : +5 score');
		}
	};

	var seededRandom = function(seed) {
		var t = seed + 0x6D2B79F5;
		return function() {
			t += 0x6D2B79F5;
			var r = Math.imul(t ^ t >>> 15, 1 | t);
			r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
			return ((r ^ r >>> 14) >>> 0) / 4294967296;
		};
	};
	
	// Constructor
	(function(){
		canvas = aCanvas;
		context = canvas.getContext('2d');
		resizeCanvas();
		
		model = new Model();
		model.settings = aSettings;
		
		model.userTadpole = new Tadpole();
		model.userTadpole.id = -1;
		model.tadpoles[model.userTadpole.id] = model.userTadpole;

		model.collectibles = [];
		model.score = 0;
		model.questTarget = 5;
		model.questCollected = 0;
		model.boostUntil = 0;
		model.boostCooldownUntil = 0;
		model.bonusActiveUntil = 0;
		model.commonOrbCycleDuration = 20000;
		model.commonOrbs = [];
		model.commonOrbSeed = null;
		model.collectedCommonOrbs = {};
		model.gems = parseInt(localStorage.getItem('tadpole_gems') || '0', 10);
		
		model.waterParticles = [];
		for(var i = 0; i < 150; i++) {
			model.waterParticles.push(new WaterParticle());
		}
		
		model.camera = new Camera(canvas, context, model.userTadpole.x, model.userTadpole.y);
		
		model.arrows = {};
		
		connectSocket();
	})();
}
