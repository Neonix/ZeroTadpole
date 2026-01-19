var WebSocketService = function(model, webSocket, reconnectFn) {
	var webSocketService = this;

	var webSocket = webSocket;
	var model = model;
	var playerCountEl = document.getElementById('player-count-value');
	var chatLogEl = document.getElementById('chat-log');
	var reconnectAttempts = 0;
	var reconnectTimeoutId = null;
	var reconnectHandler = reconnectFn;

	this.hasConnection = false;
	this.setSocket = function(nextSocket) {
		webSocket = nextSocket;
	};

	this.welcomeHandler = function(data) {
		webSocketService.hasConnection = true;
		reconnectAttempts = 0;
		if (reconnectTimeoutId) {
			clearTimeout(reconnectTimeoutId);
			reconnectTimeoutId = null;
		}
		$('#cant-connect').fadeOut(300);

		if (model.userTadpole.id !== -1 && model.userTadpole.id !== data.id) {
			model.tadpoles = {};
			model.arrows = {};
			model.tadpoles[-1] = model.userTadpole;
		}

		model.userTadpole.id = data.id;
		model.tadpoles[data.id] = model.tadpoles[-1];
		delete model.tadpoles[-1];

		$('#chat').initChat();
		var storedName = localStorage.getItem('tadpole_name') || $.cookie('todpole_name');
		var storedColor = localStorage.getItem('tadpole_color') || $.cookie('tadpole_color');
		if (storedColor) {
			model.userTadpole.color = storedColor;
		}
		if(storedName)	{
			model.userTadpole.name = storedName;
		}
		if(storedColor)	{
			model.userTadpole.color = storedColor;
		}

		ensureGuideNpc();
		window.npcSpeak = function() {
			appendChatLine('PNJ Ovule', 'Bonjour voyageur ! Dis-moi ton nom et ta couleur pour commencer.', storedColor);
		};


		var sendObj = {
			type: 'hello',
			name: storedName,
			color: storedColor
		};

		webSocket.send(JSON.stringify(sendObj));

	};

	this.updateHandler = function(data) {
		var newtp = false;

		if(!model.tadpoles[data.id]) {
			newtp = true;
			model.tadpoles[data.id] = new Tadpole();
			model.arrows[data.id] = new Arrow(model.tadpoles[data.id], model.camera);
		}

		var tadpole = model.tadpoles[data.id];

		if(tadpole.id == model.userTadpole.id) {
			tadpole.name = data.name;
			if (data.color) {
				tadpole.color = data.color;
			}
			return;
		} else {
			tadpole.name = data.name;
			if (data.color) {
				tadpole.color = data.color;
			}
		}

		if(newtp) {
			tadpole.x = data.x;
			tadpole.y = data.y;
		} else {
			tadpole.targetX = data.x;
			tadpole.targetY = data.y;
		}

		tadpole.angle = data.angle;
		tadpole.momentum = data.momentum;

		tadpole.timeSinceLastServerUpdate = 0;
	}

	this.messageHandler = function(data) {
		var tadpole = model.tadpoles[data.id];
		if(!tadpole) {
			return;
		}
		tadpole.timeSinceLastServerUpdate = 0;
		tadpole.messages.push(new Message(data.message));
		appendChatLine(tadpole.name || ('Joueur ' + data.id), data.message, tadpole.color);
	}

	this.privateHandler = function(data) {
		appendChatLine('MP de ' + (data.name || 'Joueur'), data.message, data.color, true);
	}

	this.playersHandler = function(data) {
		updatePlayerList(data.players || []);
	}

	this.closedHandler = function(data) {
		if(model.tadpoles[data.id]) {
			delete model.tadpoles[data.id];
			delete model.arrows[data.id];
		}
	}

	this.redirectHandler = function(data) {
		if (data.url) {
			if (authWindow) {
				authWindow.document.location = data.url;
			} else {
				document.location = data.url;
			}
		}
	}

	this.populationHandler = function(data) {
		var totalPlayers = data.total !== undefined ? data.total : data.world;
		if (totalPlayers === undefined) {
			return;
		}
		model.playerCount = totalPlayers;
		if (playerCountEl) {
			playerCountEl.textContent = totalPlayers;
		}
	}

	this.processMessage = function(data) {
		var fn = webSocketService[data.type + 'Handler'];
		if (fn) {
			fn(data);
		}
	}

	var appendChatLine = function(name, message, color, isPrivate) {
		if (!chatLogEl) {
			return;
		}
		var line = document.createElement('div');
		line.className = 'chat-line';
		var nameSpan = document.createElement('span');
		nameSpan.className = 'chat-name';
		nameSpan.textContent = name + ':';
		if (color) {
			nameSpan.style.color = color;
		}
		if (isPrivate) {
			line.style.border = '1px solid rgba(140, 230, 222, 0.6)';
		}
		var messageSpan = document.createElement('span');
		messageSpan.className = 'chat-message';
		messageSpan.textContent = ' ' + message;
		line.appendChild(nameSpan);
		line.appendChild(messageSpan);
		chatLogEl.appendChild(line);
		while (chatLogEl.children.length > 6) {
			chatLogEl.removeChild(chatLogEl.firstChild);
		}
	};

	this.connectionClosed = function() {
		webSocketService.hasConnection = false;
		$('#cant-connect').fadeIn(300);
		if (!reconnectHandler || reconnectTimeoutId) {
			return;
		}
		var baseDelay = Math.min(30000, 1000 * Math.pow(2, reconnectAttempts));
		var jitter = Math.floor(Math.random() * 1000);
		var delay = baseDelay + jitter;
		reconnectAttempts += 1;
		reconnectTimeoutId = setTimeout(function() {
			reconnectTimeoutId = null;
			reconnectHandler();
		}, delay);
	};

	this.sendUpdate = function(tadpole) {
		var sendObj = {
			type: 'update',
			x: tadpole.x.toFixed(1),
			y: tadpole.y.toFixed(1),
			angle: tadpole.angle.toFixed(3),
			momentum: tadpole.momentum.toFixed(3)
		};

		if(tadpole.name) {
			sendObj['name'] = tadpole.name;
		}
		if(tadpole.color) {
			sendObj['color'] = tadpole.color;
		}

		webSocket.send(JSON.stringify(sendObj));
	}

	this.sendMessage = function(msg) {
		var regexp = /name: ?(.+)/i;
		if(regexp.test(msg)) {
			model.userTadpole.name = msg.match(regexp)[1];
			$.cookie('todpole_name', model.userTadpole.name, {expires:14});
			localStorage.setItem('tadpole_name', model.userTadpole.name);
			if (webSocketService.hasConnection) {
				var tadpole = model.userTadpole;
				var sendObj = {
					type: 'update',
					x: tadpole.x.toFixed(1),
					y: tadpole.y.toFixed(1),
					angle: tadpole.angle.toFixed(3),
					momentum: tadpole.momentum.toFixed(3),
					name: tadpole.name,
					color: tadpole.color
				};
				webSocket.send(JSON.stringify(sendObj));
			}
			return;
		}
		var colorMatch = /color: ?(.+)/i;
		if(colorMatch.test(msg)) {
			model.userTadpole.color = msg.match(colorMatch)[1];
			$.cookie('tadpole_color', model.userTadpole.color, {expires:14});
			localStorage.setItem('tadpole_color', model.userTadpole.color);
			if (webSocketService.hasConnection) {
				var colorObj = {
					type: 'update',
					x: model.userTadpole.x.toFixed(1),
					y: model.userTadpole.y.toFixed(1),
					angle: model.userTadpole.angle.toFixed(3),
					momentum: model.userTadpole.momentum.toFixed(3),
					name: model.userTadpole.name,
					color: model.userTadpole.color
				};
				webSocket.send(JSON.stringify(colorObj));
			}
			return;
		}

		var sendObj = {
			type: 'message',
			message: msg
		};

		webSocket.send(JSON.stringify(sendObj));
	}

	this.authorize = function(token,verifier) {
		var sendObj = {
			type: 'authorize',
			token: token,
			verifier: verifier
		};

		webSocket.send(JSON.stringify(sendObj));
	}

	this.requestPlayerList = function() {
		webSocket.send(JSON.stringify({type: 'who'}));
	}

	this.sendPrivateMessage = function(targetId, message) {
		webSocket.send(JSON.stringify({type: 'private', target: targetId, message: message}));
	}

	var ensureGuideNpc = function() {
		var npcId = 'npc-guide';
		if (model.tadpoles[npcId]) {
			return;
		}
		var guide = new Tadpole();
		guide.id = npcId;
		guide.name = 'Ovule';
		guide.color = '#f7d6ff';
		guide.size = 12;
		guide.isNpc = true;
		guide.isOvule = true;
		guide.x = 100;
		guide.y = 60;
		model.tadpoles[npcId] = guide;
		model.arrows[npcId] = new Arrow(guide, model.camera);
	};

	var updatePlayerList = function(players) {
		var listEl = document.getElementById('player-list');
		var emptyEl = document.getElementById('player-list-empty');
		var targetEl = document.getElementById('private-target');
		if (!listEl) {
			return;
		}
		listEl.innerHTML = '';
		if (!players.length) {
			if (emptyEl) {
				emptyEl.style.display = 'block';
			}
			if (targetEl) {
				targetEl.textContent = '';
			}
			return;
		}
		if (emptyEl) {
			emptyEl.style.display = 'none';
		}
		players.forEach(function(player) {
			var item = document.createElement('li');
			item.setAttribute('data-player-id', player.id);
			item.setAttribute('data-player-name', player.name || ('Joueur ' + player.id));
			var dot = document.createElement('span');
			dot.className = 'player-dot';
			dot.style.setProperty('--player-color', player.color || '#9ad7ff');
			var name = document.createElement('span');
			name.textContent = player.name || ('Joueur ' + player.id);
			item.appendChild(dot);
			item.appendChild(name);
			listEl.appendChild(item);
		});
	};
}
