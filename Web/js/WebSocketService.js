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

	var ensureTadpole = function(id) {
		if (id === undefined || id === null) {
			return null;
		}
		if (!model.tadpoles[id]) {
			var newTadpole = new Tadpole();
			newTadpole.id = id;
			model.tadpoles[id] = newTadpole;
			model.arrows[id] = new Arrow(newTadpole, model.camera);
		} else if (model.tadpoles[id] && model.tadpoles[id].id !== id) {
			model.tadpoles[id].id = id;
		}
		return model.tadpoles[id];
	};

	var parseNumber = function(value) {
		if (typeof value === 'number') {
			return value;
		}
		if (typeof value === 'string') {
			var trimmed = value.trim();
			if (trimmed !== '' && !isNaN(trimmed)) {
				return parseFloat(trimmed);
			}
		}
		return null;
	};

	this.welcomeHandler = function(data) {
		webSocketService.hasConnection = true;
		reconnectAttempts = 0;
		if (reconnectTimeoutId) {
			clearTimeout(reconnectTimeoutId);
			reconnectTimeoutId = null;
		}
		// Support both old and new UI
		$('#cant-connect').fadeOut(300);
		if (window.hideDisconnected) {
			window.hideDisconnected();
		}

		if (model.userTadpole.id !== -1 && model.userTadpole.id !== data.id) {
			model.tadpoles = {};
			model.arrows = {};
			model.tadpoles[-1] = model.userTadpole;
		}

		model.userTadpole.id = data.id;
		model.tadpoles[data.id] = model.tadpoles[-1];
		delete model.tadpoles[-1];

		// Only init chat for old UI
		if ($('#chat').initChat) {
			$('#chat').initChat();
		}
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
		if (data.id === undefined || data.id === null) {
			return;
		}
		var newtp = false;
		var tadpole = model.tadpoles[data.id];
		if (!tadpole) {
			newtp = true;
			tadpole = ensureTadpole(data.id);
		}

		if(tadpole.id == model.userTadpole.id) {
			tadpole.name = data.name;
			if (data.color) {
				tadpole.color = data.color;
			}
			var selfX = parseNumber(data.x);
			var selfY = parseNumber(data.y);
			if (selfX !== null && selfY !== null) {
				tadpole.x = selfX;
				tadpole.y = selfY;
				tadpole.targetX = selfX;
				tadpole.targetY = selfY;
				if (window.GameSystems && window.GameSystems.combat && !window.GameSystems.combat.safeZoneCenter) {
					window.GameSystems.combat.safeZoneCenter = { x: selfX, y: selfY };
				}
			}
			var selfAngle = parseNumber(data.angle);
			if (selfAngle !== null) {
				tadpole.angle = selfAngle;
			}
			var selfMomentum = parseNumber(data.momentum);
			if (selfMomentum !== null) {
				tadpole.momentum = selfMomentum;
			}
			tadpole.timeSinceLastServerUpdate = 0;
			return;
		} else {
			tadpole.name = data.name;
			if (data.color) {
				tadpole.color = data.color;
			}
		}

		var nextX = parseNumber(data.x);
		var nextY = parseNumber(data.y);
		if (nextX !== null && nextY !== null) {
			if(newtp) {
				tadpole.x = nextX;
				tadpole.y = nextY;
			}
			tadpole.targetX = nextX;
			tadpole.targetY = nextY;
		}

		var nextAngle = parseNumber(data.angle);
		if (nextAngle !== null) {
			tadpole.angle = nextAngle;
		}
		var nextMomentum = parseNumber(data.momentum);
		if (nextMomentum !== null) {
			tadpole.momentum = nextMomentum;
		}

		tadpole.timeSinceLastServerUpdate = 0;
	}

	this.spawnHandler = function(data) {
		if (data.entityType && data.entityType !== 'player') {
			return;
		}
		if (data.id === undefined || data.id === null) {
			return;
		}

		var isNew = false;
		var tadpole = model.tadpoles[data.id];
		if (!tadpole) {
			isNew = true;
			tadpole = ensureTadpole(data.id);
		}

		if (tadpole.id == model.userTadpole.id) {
			return;
		}

		if (data.name) {
			tadpole.name = data.name;
		}
		if (data.color) {
			tadpole.color = data.color;
		}

		var spawnX = parseNumber(data.x);
		var spawnY = parseNumber(data.y);
		if (spawnX !== null && spawnY !== null) {
			if (isNew) {
				tadpole.x = spawnX;
				tadpole.y = spawnY;
			}
			tadpole.targetX = spawnX;
			tadpole.targetY = spawnY;
		}

		var spawnAngle = parseNumber(data.angle);
		if (spawnAngle !== null) {
			tadpole.angle = spawnAngle;
		}
		var spawnMomentum = parseNumber(data.momentum);
		if (spawnMomentum !== null) {
			tadpole.momentum = spawnMomentum;
		}

		tadpole.timeSinceLastServerUpdate = 0;
	}

	this.despawnHandler = function(data) {
		if (!data || data.id === undefined || data.id === null) {
			return;
		}
		this.closedHandler({ id: data.id });
	}

	this.teleportHandler = function(data) {
		if (!data || data.id === undefined || data.id === null) {
			return;
		}
		var tadpole = ensureTadpole(data.id);
		if (!tadpole) {
			return;
		}
		var nextX = parseNumber(data.x);
		var nextY = parseNumber(data.y);
		if (nextX !== null && nextY !== null) {
			tadpole.x = nextX;
			tadpole.y = nextY;
			tadpole.targetX = nextX;
			tadpole.targetY = nextY;
		}
		tadpole.timeSinceLastServerUpdate = 0;
		if (tadpole.id == model.userTadpole.id && window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.safeZoneCenter = { x: tadpole.x, y: tadpole.y };
		}
	}

	this.healthHandler = function(data) {
		if (!data || data.points === undefined) {
			return;
		}
		if (window.GameSystems && window.GameSystems.playerStats) {
			window.GameSystems.playerStats.hp = Math.max(0, Math.min(window.GameSystems.playerStats.maxHp, data.points));
			window.GameSystems.playerStats.save();
		}
	}

	this.damageHandler = function(data) {
		if (!data || data.id === undefined) {
			return;
		}
		if (window.GameSystems && window.GameSystems.combat) {
			var combat = window.GameSystems.combat;
			var mob = combat.mobs.find(function(entry) {
				return entry.serverId === data.id || entry.uniqueId === data.id;
			});
			if (mob) {
				if (data.maxHp !== undefined) {
					mob.maxHp = data.maxHp;
				}
				if (data.hp !== undefined) {
					mob.hp = data.hp;
				}
			}
		}
	}

	this.hitpointsHandler = function(data) {
		this.hitPointsHandler(data);
	}

	this.hitPointsHandler = function(data) {
		if (!data || data.maxHp === undefined) {
			return;
		}
		if (window.GameSystems && window.GameSystems.playerStats) {
			window.GameSystems.playerStats.maxHp = data.maxHp;
			if (window.GameSystems.playerStats.hp > data.maxHp) {
				window.GameSystems.playerStats.hp = data.maxHp;
			}
			window.GameSystems.playerStats.save();
		}
	}

	this.listHandler = function(data) {
		if (!data || !Array.isArray(data.ids)) {
			return;
		}
		var allowed = {};
		data.ids.forEach(function(id) {
			allowed[String(id)] = true;
		});
		var userId = model.userTadpole ? String(model.userTadpole.id) : null;
		Object.keys(model.tadpoles).forEach(function(id) {
			if (id === userId || id === 'npc-guide') {
				return;
			}
			if (!allowed[id]) {
				delete model.tadpoles[id];
				delete model.arrows[id];
			}
		});
	};

	this.listsHandler = function(data) {
		this.listHandler(data);
	};

	this.messageHandler = function(data) {
		var tadpole = model.tadpoles[data.id];
		if (tadpole) {
			tadpole.timeSinceLastServerUpdate = 0;
			if (data.name) {
				tadpole.name = data.name;
			}
			if (data.color) {
				tadpole.color = data.color;
			}
			tadpole.messages.push(new Message(data.message));
		}
		var displayName = data.name || (tadpole ? tadpole.name : '') || ('Joueur ' + data.id);
		var displayColor = data.color || (tadpole ? tadpole.color : null);
		appendChatLine(displayName, data.message, displayColor);
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
		if (window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.lootDrops = window.GameSystems.combat.lootDrops.filter(function(loot) {
				return loot.serverId !== data.id;
			});
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

	var mapServerItemKindToClient = function(kind) {
		switch (kind) {
			case 35: // TYPES_ENTITIES_FLASK
				return 'potion_health';
			case 36: // TYPES_ENTITIES_BURGER
				return 'potion_health_large';
			case 38: // TYPES_ENTITIES_FIREPOTION
				return 'shield_bubble';
			default:
				return null;
		}
	};

	this.dropHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.combat) {
			return;
		}
		var itemId = mapServerItemKindToClient(data.kind);
		if (!itemId) {
			return;
		}
		var combat = window.GameSystems.combat;
		var existing = combat.lootDrops.find(function(loot) {
			return loot.serverId === data.itemId;
		});
		if (existing) {
			return;
		}
		combat.lootDrops.push({
			serverId: data.itemId,
			itemId: itemId,
			x: data.x || (model.userTadpole?.x || 0),
			y: data.y || (model.userTadpole?.y || 0),
			spawnTime: Date.now()
		});
	};

	this.elite_mobHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.combat) {
			return;
		}
		var combat = window.GameSystems.combat;
		var existingIndex = combat.mobs.findIndex(function(mob) {
			return mob.serverId === data.id;
		});

		if (data.action === 'despawn') {
			if (existingIndex !== -1) {
				combat.mobs.splice(existingIndex, 1);
			}
			return;
		}

		var mobType = window.GameSystems.MOBS ? window.GameSystems.MOBS[data.mobType] : null;
		if (existingIndex === -1) {
			if (!mobType) {
				return;
			}
			var mob = Object.assign({}, mobType, {
				serverId: data.id,
				uniqueId: data.id,
				serverControlled: true,
				x: data.x,
				y: data.y,
				prevX: data.x,
				prevY: data.y,
				targetX: data.x,
				targetY: data.y,
				angle: data.angle,
				prevAngle: data.angle,
				targetAngle: data.angle,
				vx: data.vx || 0,
				vy: data.vy || 0,
				lastServerUpdateAt: performance.now(),
				prevServerUpdateAt: performance.now(),
				serverUpdateInterval: 250,
				hp: data.hp,
				maxHp: data.maxHp
			});
			combat.mobs.push(mob);
			return;
		}

		var existing = combat.mobs[existingIndex];
		if (!mobType && existing.mobType) {
			mobType = window.GameSystems.MOBS ? window.GameSystems.MOBS[existing.mobType] : null;
		}
		existing.prevX = typeof existing.targetX === 'number' ? existing.targetX : existing.x;
		existing.prevY = typeof existing.targetY === 'number' ? existing.targetY : existing.y;
		existing.targetX = data.x;
		existing.targetY = data.y;
		existing.prevAngle = typeof existing.targetAngle === 'number' ? existing.targetAngle : existing.angle;
		existing.targetAngle = data.angle;
		existing.vx = data.vx || 0;
		existing.vy = data.vy || 0;
		var now = performance.now();
		existing.prevServerUpdateAt = existing.lastServerUpdateAt || now;
		existing.lastServerUpdateAt = now;
		var serverDelta = existing.lastServerUpdateAt - existing.prevServerUpdateAt;
		if (serverDelta > 0) {
			existing.serverUpdateInterval = existing.serverUpdateInterval
				? existing.serverUpdateInterval * 0.8 + serverDelta * 0.2
				: serverDelta;
		}
		if (data.hp !== undefined) {
			existing.hp = data.hp;
		}
		if (data.maxHp !== undefined) {
			existing.maxHp = data.maxHp;
		}
		if (data.mobType) {
			existing.mobType = data.mobType;
		}
		existing.serverControlled = true;
	}

	// Handler for common orb collection broadcast
	this.orbHandler = function(data) {
		if (data.orbId && model.collectedCommonOrbs) {
			model.collectedCommonOrbs[data.orbId] = true;
		}
	}

	this.spellHandler = function(data) {
		if (!data || !window.GameSystems || !window.GameSystems.combat) {
			return;
		}
		window.GameSystems.combat.castSpellFromRemote(data);
	}

	// Send orb collection to other players
	this.sendOrbCollected = function(orbId) {
		if (webSocket && webSocket.readyState === WebSocket.OPEN) {
			webSocket.send(JSON.stringify({
				type: 'orb',
				orbId: orbId
			}));
		}
	}

	this.sendSpell = function(spellId, x, y, angle) {
		if (webSocket && webSocket.readyState === WebSocket.OPEN) {
			webSocket.send(JSON.stringify({
				type: 'spell',
				spellId: spellId,
				x: x,
				y: y,
				angle: angle
			}));
		}
	}

	this.processMessage = function(data) {
		if (Array.isArray(data)) {
			var legacyType = data[0];
			if (legacyType === 'update' || legacyType === 'move') {
				this.updateHandler({
					type: 'update',
					id: data[1],
					x: data[2],
					y: data[3],
					angle: data[4],
					momentum: data[5],
					name: data[6],
					color: data[7],
					life: data[8],
					authorized: data[9]
				});
			} else if (legacyType === 2 || legacyType === 'spawn') { // TYPES_MESSAGES_SPAWN
				this.spawnHandler({
					type: 'spawn',
					id: data[1],
					entityType: data[2],
					kind: data[3],
					x: data[4],
					y: data[5],
					angle: data[6],
					momentum: data[7],
					name: data[8],
					color: data[9],
					life: data[10]
				});
			} else if (legacyType === 3 || legacyType === 'despawn' || legacyType === 'closed') { // TYPES_MESSAGES_DESPAWN
				this.despawnHandler({
					type: 'despawn',
					id: data[1]
				});
			} else if (legacyType === 'message') {
				this.messageHandler({
					type: 'message',
					id: data[1],
					name: data[2],
					color: data[3],
					message: data[4]
				});
			} else if (legacyType === 'private') {
				this.privateHandler({
					type: 'private',
					from: data[1],
					name: data[2],
					color: data[3],
					message: data[4]
				});
			} else if (legacyType === 'players') {
				this.playersHandler({
					type: 'players',
					players: data[1]
				});
			} else if (legacyType === 17 || legacyType === 'population') { // TYPES_MESSAGES_POPULATION
				this.populationHandler({
					type: 'population',
					world: data[1],
					total: data[2]
				});
			} else if (legacyType === 'orb') {
				this.orbHandler({
					type: 'orb',
					orbId: data[1],
					playerId: data[2]
				});
			} else if (legacyType === 10 || legacyType === 'health') { // TYPES_MESSAGES_HEALTH
				this.healthHandler({
					type: 'health',
					points: data[1],
					isRegen: data[2] || false
				});
			} else if (legacyType === 16 || legacyType === 'damage') { // TYPES_MESSAGES_DAMAGE
				this.damageHandler({
					type: 'damage',
					id: data[1],
					points: data[2],
					maxHp: data[3],
					hp: data[4]
				});
			} else if (legacyType === 'spell') {
				this.spellHandler({
					type: 'spell',
					playerId: data[1],
					spellId: data[2],
					x: data[3],
					y: data[4],
					angle: data[5]
				});
			} else if (legacyType === 14 || legacyType === 'drop') { // TYPES_MESSAGES_DROP
				this.dropHandler({
					type: 'drop',
					mobId: data[1],
					itemId: data[2],
					kind: data[3],
					x: data.length > 4 ? data[4] : undefined,
					y: data.length > 5 ? data[5] : undefined,
					haters: data.length > 6 ? data[6] : undefined
				});
			} else if (legacyType === 19 || legacyType === 'list' || legacyType === 'lists') { // TYPES_MESSAGES_LIST
				this.listHandler({
					type: 'list',
					ids: data.slice(1)
				});
			} else if (legacyType === 15 || legacyType === 'teleport') { // TYPES_MESSAGES_TELEPORT
				this.teleportHandler({
					type: 'teleport',
					id: data[1],
					x: data[2],
					y: data[3]
				});
			} else if (legacyType === 23 || legacyType === 'hitpoints') { // TYPES_MESSAGES_HP
				this.hitPointsHandler({
					type: 'hitpoints',
					maxHp: data[1]
				});
			}
			return;
		}
		if (data && data.type === 'move') {
			data.type = 'update';
		}
		if (data && data.type === 'hitpoints') {
			data.type = 'hitPoints';
		}
		if (data && data.type === 'lists') {
			data.type = 'list';
		}
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
		// Support both old and new UI
		$('#cant-connect').fadeIn(300);
		if (window.showDisconnected) {
			window.showDisconnected();
		}
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

	this.sendPvpToggle = function(enabled) {
		webSocket.send(JSON.stringify({type: 'pvp', enabled: enabled}));
	}

	this.sendEliteHit = function(mobId, damage) {
		webSocket.send(JSON.stringify({type: 'elite_hit', id: mobId, damage: damage}));
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
