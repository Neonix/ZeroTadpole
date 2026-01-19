

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
	
	app.update = function() {
	  if (messageQuota < 5 && model.userTadpole.age % 50 == 0) { messageQuota++; }
	  var now = Date.now();
	  if (model.boostUntil && now < model.boostUntil && model.userTadpole.targetMomentum > 0) {
			model.userTadpole.targetMomentum = model.userTadpole.maxMomentum * 1.8;
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
		if (model.collectibles.length < 12) {
			for (var i = model.collectibles.length; i < 12; i++) {
				model.collectibles.push({
					x: model.userTadpole.x + (Math.random() * 120 - 60),
					y: model.userTadpole.y + (Math.random() * 120 - 60),
					r: 2 + Math.random() * 2
				});
			}
		}
		for (var j = model.collectibles.length - 1; j >= 0; j--) {
			var orb = model.collectibles[j];
			var dx = model.userTadpole.x - orb.x;
			var dy = model.userTadpole.y - orb.y;
			if (Math.sqrt(dx * dx + dy * dy) < model.userTadpole.size + orb.r) {
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
	};

	var drawCollectibles = function() {
		if (!model.collectibles) {
			return;
		}
		for (var i = 0; i < model.collectibles.length; i++) {
			var orb = model.collectibles[i];
			context.beginPath();
			context.fillStyle = 'rgba(140,230,222,0.7)';
			context.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
			context.fill();
		}
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
