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
			// IMPORTANT: ne pas "corriger" le joueur local à chaque écho serveur.
			// Le client simule son propre mouvement instantanément.
			// Si on applique l'écho serveur en continu, on introduit une latence visible (rubber-banding).
			if (data.name) {
				tadpole.name = data.name;
			}
			if (data.color) {
				tadpole.color = data.color;
			}

			// On accepte la position serveur uniquement:
			// - la toute première fois (spawn/respawn)
			// - si la différence est énorme (téléport/correction)
			// - ou si le joueur est mort (serveur autoritaire sur l'état)
			var selfX = parseNumber(data.x);
			var selfY = parseNumber(data.y);
			if (selfX !== null && selfY !== null) {
				var dx = selfX - tadpole.x;
				var dy = selfY - tadpole.y;
				var dist2 = dx*dx + dy*dy;
				var needsHardCorrection = dist2 > (250*250);
				var firstServerPos = !tadpole._hasServerPos;
				var dead = (window.inputState && window.inputState.isDead) || tadpole.isDead;

				if (firstServerPos || needsHardCorrection || dead) {
					tadpole.x = selfX;
					tadpole.y = selfY;
					tadpole.targetX = selfX;
					tadpole.targetY = selfY;
					tadpole._hasServerPos = true;
					if (window.GameSystems && window.GameSystems.combat) {
						window.GameSystems.combat.safeZoneCenter = { x: selfX, y: selfY };
					}
				}
			}

			// Ne pas écraser angle/momentum du joueur local en continu.
			// (Le client les calcule selon l'input; le serveur peut envoyer des messages dédiés si besoin.)
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
			// Mark that this entity has an authoritative target (even if it's (0,0))
			tadpole._hasTarget = true;
			tadpole.lastUpdateTime = Date.now();
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
			tadpole._hasTarget = true;
			tadpole.lastUpdateTime = Date.now();
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
			tadpole._hasTarget = true;
			tadpole.lastUpdateTime = Date.now();
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
		if (model && model.userTadpole) {
			var isDead = data.points <= 0;
			model.userTadpole.isDead = isDead;
			window.inputState = window.inputState || {};
			window.inputState.isDead = isDead;
			if (isDead) {
				window.inputState.isMoving = false;
				window.inputState.useJoystick = false;
				window.joystickTarget = null;
				model.userTadpole.targetMomentum = 0;
				model.userTadpole.momentum = 0;
			}
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

	// ============================================
	// NOUVEAUX HANDLERS - SYNCHRONISATION v2
	// ============================================
	
	this.sync_infoHandler = function(data) {
		console.log('[SYNC] Protocol v' + data.protocolVersion + ', Server tick: ' + data.serverTick);
		// Stocker la config de zone
		if (data.zones && window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.safeZoneRadius = data.zones.tutorialRadius || 200;
			window.GameSystems.combat.transitionRadius = data.zones.transitionRadius || 400;
			window.GameSystems.combat.normalRadius = data.zones.normalRadius || 800;
		}
	};
	
	this.world_snapshotHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.combat) return;
		var combat = window.GameSystems.combat;
		
		// Synchroniser les positions des joueurs
		if (data.players && Array.isArray(data.players) && model) {
			data.players.forEach(function(playerData) {
				// Ne pas mettre à jour notre propre position
				if (playerData.i === model.userTadpole.id) return;
				
				var tadpole = model.tadpoles[playerData.i];
				if (tadpole) {
					// Mettre à jour la position cible pour interpolation
					tadpole.targetX = playerData.x;
					tadpole.targetY = playerData.y;
					tadpole._hasTarget = true;
					tadpole.lastUpdateTime = Date.now();
					tadpole.angle = playerData.a;
					tadpole.momentum = playerData.m;
					tadpole.timeSinceLastServerUpdate = 0;
					
					// Si trop éloigné, téléporter directement
					var dx = tadpole.x - playerData.x;
					var dy = tadpole.y - playerData.y;
					var dist = Math.sqrt(dx * dx + dy * dy);
					if (dist > 200) {
						tadpole.x = playerData.x;
						tadpole.y = playerData.y;
					}
				}
			});
		}
		
		// Synchroniser les mobs du serveur
		if (data.mobs && Array.isArray(data.mobs)) {
			var serverMobIds = {};
			
			data.mobs.forEach(function(mobData) {
				serverMobIds[mobData.i] = true;
				
				// Chercher le mob existant
				var existingMob = combat.mobs.find(function(m) { 
					return m.serverId === mobData.i; 
				});
				
				if (existingMob) {
					// Mettre à jour le mob existant
					existingMob.prevX = existingMob.targetX !== undefined ? existingMob.targetX : existingMob.x;
					existingMob.prevY = existingMob.targetY !== undefined ? existingMob.targetY : existingMob.y;
					existingMob.targetX = mobData.x;
					existingMob.targetY = mobData.y;
					existingMob.hp = mobData.h;
					if (mobData.s) {
						existingMob.state = mobData.s === 'c' ? 'chase' : (mobData.s === 'r' ? 'return' : (mobData.s === 'f' ? 'flee' : 'idle'));
					}
					var now = performance.now();
					existingMob.prevServerUpdateAt = existingMob.lastServerUpdateAt || now;
					existingMob.lastServerUpdateAt = now;
				} else {
					// Créer un nouveau mob serveur
					var mobType = mobData.t || 'crab_small';
					var template = window.GameSystems.MOBS ? window.GameSystems.MOBS[mobType] : null;
					
					var newMob = {
						serverId: mobData.i,
						serverControlled: true,
						mobType: mobType,
						x: mobData.x,
						y: mobData.y,
						targetX: mobData.x,
						targetY: mobData.y,
						prevX: mobData.x,
						prevY: mobData.y,
						hp: mobData.h,
						maxHp: template ? template.hp : mobData.h,
						angle: 0,
						targetAngle: 0,
						state: 'idle',
						uniqueId: 'server_' + mobData.i,
						lastServerUpdateAt: performance.now(),
						prevServerUpdateAt: performance.now(),
						serverUpdateInterval: 100,
						// Copier les propriétés du template
						name: template ? template.name : 'Créature',
						icon: template ? template.icon : '🐟',
						color: template ? template.color : '#ff6666',
						size: template ? template.size : 8,
						type: template ? template.type : 'mob',
						damage: template ? template.damage : 5,
						xpReward: template ? template.xpReward : 5
					};
					
					combat.mobs.push(newMob);
				}
			});
			
			// Supprimer les mobs qui ne sont plus sur le serveur
			combat.mobs = combat.mobs.filter(function(m) {
				if (!m.serverControlled) return true;
				return serverMobIds[m.serverId] === true;
			});
		}
		
		// Synchroniser le loot
		if (data.loot && Array.isArray(data.loot)) {
			data.loot.forEach(function(lootData) {
				var existing = combat.lootDrops.find(function(l) { return l.serverId === lootData.i; });
				if (!existing) {
					combat.lootDrops.push({
						serverId: lootData.i,
						itemId: lootData.t,
						x: lootData.x,
						y: lootData.y,
						time: Date.now()
					});
				}
			});
		}
	};
	
	this.zone_infoHandler = function(data) {
		// Afficher notification de changement de zone
		if (data.name) {
			window.showToast && window.showToast(data.name, data.safe ? 'success' : 'info');
		}
		if (data.description) {
			window.showToast && window.showToast(data.description, 'info');
		}
		// Le SyncManager gère les zones
		if (window.SyncManager) {
			window.SyncManager.handleMessage([data]);
		}
	};
	
	this.tutorial_messageHandler = function(data) {
		// Afficher les messages de tutoriel
		if (data.title) {
			window.showToast && window.showToast('📚 ' + data.title, 'info');
		}
		if (data.content) {
			setTimeout(function() {
				window.showToast && window.showToast(data.content, 'info');
			}, 500);
		}
		if (data.tips && data.tips.length > 0) {
			data.tips.forEach(function(tip, index) {
				setTimeout(function() {
					window.showToast && window.showToast('💡 ' + tip, 'info');
				}, 1000 + index * 700);
			});
		}
	};
	
	this.npc_spawnHandler = function(data) {
		var npc = data.npc;
		if (!npc || !npc.id) return;
		
		// Créer le NPC comme un tadpole spécial
		var npcTadpole = model.tadpoles[npc.id];
		if (!npcTadpole) {
			npcTadpole = new Tadpole();
			npcTadpole.id = npc.id;
			model.tadpoles[npc.id] = npcTadpole;
			model.arrows[npc.id] = new Arrow(npcTadpole, model.camera);
		}
		
		npcTadpole.name = npc.name || 'PNJ';
		npcTadpole.color = npc.color || '#ffd700';
		npcTadpole.size = npc.size || 12;
		npcTadpole.isNpc = true;
		npcTadpole.npcType = npc.npcType;
		npcTadpole.dialogue = npc.dialogue;
		npcTadpole.x = npc.x;
		npcTadpole.y = npc.y;
		npcTadpole.targetX = npc.x;
		npcTadpole.targetY = npc.y;
	};
	
	this.xp_gainHandler = function(data) {
		if (window.GameSystems && window.GameSystems.playerStats) {
			var ps = window.GameSystems.playerStats;
			ps.xp = (ps.xp || 0) + data.amount;
			// Calcul level up simple
			while (ps.xp >= ps.xpToNextLevel) {
				ps.xp -= ps.xpToNextLevel;
				ps.level = (ps.level || 1) + 1;
				ps.xpToNextLevel = Math.floor(ps.xpToNextLevel * 1.5);
				window.showToast && window.showToast('🎉 Niveau ' + ps.level + ' !', 'success');
			}
			ps.save && ps.save();
		}
		window.showToast && window.showToast('+' + data.amount + ' XP', 'success');
	};
	
	this.quest_updateHandler = function(data) {
		// Gestion des quêtes côté client
		if (!data.action) return;
		
		switch(data.action) {
			case 'started':
				window.showToast && window.showToast('📜 Nouvelle quête: ' + (data.quest ? data.quest.name : 'Quête'), 'info');
				break;
			case 'progress':
				if (data.quest && data.quest.objectives) {
					data.quest.objectives.forEach(function(obj) {
						if (obj.current < obj.required) {
							window.showToast && window.showToast('📋 ' + obj.description + ' (' + obj.current + '/' + obj.required + ')', 'info');
						}
					});
				}
				break;
			case 'complete':
				window.showToast && window.showToast('🎉 Quête terminée: ' + (data.quest ? data.quest.name : 'Quête') + ' !', 'success');
				if (data.rewards) {
					if (data.rewards.xp) {
						window.showToast && window.showToast('+' + data.rewards.xp + ' XP', 'success');
					}
					if (data.rewards.gems) {
						window.showToast && window.showToast('+' + data.rewards.gems + ' 💎', 'success');
					}
					if (data.rewards.title) {
						window.showToast && window.showToast('🏆 Titre: ' + data.rewards.title, 'success');
					}
				}
				break;
			case 'available':
				// Nouvelle quête disponible
				window.showToast && window.showToast('📜 Nouvelle quête disponible !', 'info');
				break;
			case 'full_state':
				// État complet des quêtes - pour debug
				console.log('[QUEST] Full state:', data);
				break;
		}
		
		// Stocker l'état des quêtes
		if (window.GameSystems) {
			window.GameSystems.questState = window.GameSystems.questState || {};
			if (data.quest) {
				window.GameSystems.questState[data.quest.id] = data.quest;
			}
			if (data.activeQuests) {
				window.GameSystems.questState.active = data.activeQuests;
			}
			if (data.completedQuests) {
				window.GameSystems.questState.completed = data.completedQuests;
			}
		}
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
			case 39: // TYPES_ENTITIES_CAKE
				return 'potion_health_large';
			default:
				return 'loot_unknown';
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
			x: data.x !== undefined ? data.x : (model.userTadpole?.x || 0),
			y: data.y !== undefined ? data.y : (model.userTadpole?.y || 0),
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
				combat.handleEliteMobDefeat(combat.mobs[existingIndex]);
				combat.mobs.splice(existingIndex, 1);
			} else if (data.mobType) {
				var fallbackTemplate = window.GameSystems.MOBS ? window.GameSystems.MOBS[data.mobType] : null;
				if (fallbackTemplate) {
					combat.handleEliteMobDefeat(Object.assign({}, fallbackTemplate, data));
				}
			}
			return;
		}

		var mobType = window.GameSystems.MOBS ? window.GameSystems.MOBS[data.mobType] : null;
		if (existingIndex === -1) {
			// Spawn nouveau mob
			var baseMob = mobType || {
				id: data.mobType,
				mobType: data.mobType,
				name: data.name || 'Créature',
				icon: data.icon || '👾',
				color: data.color || '#888',
				size: data.size || 15,
				damage: data.damage || 10,
				speed: data.speed || 1.5
			};
			
			var mob = Object.assign({}, baseMob, {
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
				maxHp: data.maxHp,
				// Nouveaux champs serveur
				type: data.mobClass || baseMob.type || 'mob',
				xpReward: data.xpReward || baseMob.xpReward || 10,
				dropTable: data.dropTable || baseMob.dropTable || [],
				dropChance: data.dropChance || baseMob.dropChance || 0.3,
				guaranteedDrops: data.guaranteedDrops || baseMob.guaranteedDrops || 1
			});
			combat.mobs.push(mob);
			
			// Notification pour boss/elite
			if (mob.type === 'boss') {
				window.showToast && window.showToast('⚠️ ' + mob.icon + ' BOSS: ' + mob.name + ' apparaît !', 'warning');
			} else if (mob.type === 'elite') {
				window.showToast && window.showToast('⚔️ ' + mob.icon + ' Élite: ' + mob.name + ' repéré !', 'info');
			}
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
		if (data.mobClass) {
			existing.type = data.mobClass;
		}
		existing.serverControlled = true;
	}

	// Handler for common orb collection broadcast
	this.orbHandler = function(data) {
		if (data.orbId && model.collectedCommonOrbs) {
			model.collectedCommonOrbs[data.orbId] = true;
		}
	}

	// ============================================
	// NOUVEAUX HANDLERS - SYSTÈME UNIFIÉ DE MOBS
	// ============================================

	// Handler pour le nouveau système de mobs unifié
	this.mobHandler = function(data) {
		// Déléguer au SyncManager si disponible
		if (window.SyncManager) {
			window.SyncManager.handleMessage(data);
		}
		// Compatibilité avec GameSystems
		if (!window.GameSystems || !window.GameSystems.combat) return;
		var combat = window.GameSystems.combat;
		
		if (data.action === 'spawn') {
			// Vérifier si le mob existe déjà
			var existing = combat.mobs.find(function(m) { return m.serverId === data.id; });
			if (existing) return;
			
			var mob = {
				serverId: data.id,
				uniqueId: data.id,
				serverControlled: true,
				mobType: data.mobType,
				name: data.name,
				icon: data.icon,
				x: data.x,
				y: data.y,
				prevX: data.x,
				prevY: data.y,
				targetX: data.x,
				targetY: data.y,
				vx: data.vx || 0,
				vy: data.vy || 0,
				angle: data.angle,
				prevAngle: data.angle,
				targetAngle: data.angle,
				hp: data.hp,
				maxHp: data.maxHp,
				damage: data.damage,
				speed: data.speed,
				size: data.size,
				color: data.color,
				type: data.mobClass || 'mob',
				tier: data.tier || 1,
				zone: data.zone,
				passive: data.passive || false,
				xpReward: data.xpReward || 10,
				dropTable: data.dropTable || [],
				dropChance: data.dropChance || 0.3,
				lastServerUpdateAt: performance.now(),
				prevServerUpdateAt: performance.now(),
				serverUpdateInterval: 100
			};
			combat.mobs.push(mob);
			
			// Notification pour boss/elite
			if (mob.type === 'boss') {
				window.showToast && window.showToast('⚠️ ' + mob.icon + ' BOSS: ' + mob.name + ' apparaît !', 'warning');
			} else if (mob.type === 'elite') {
				window.showToast && window.showToast('⚔️ ' + mob.icon + ' Élite: ' + mob.name + ' repéré !', 'info');
			}
		}
		else if (data.action === 'death') {
			var idx = combat.mobs.findIndex(function(m) { return m.serverId === data.id; });
			if (idx !== -1) {
				combat.handleEliteMobDefeat(combat.mobs[idx]);
				combat.mobs.splice(idx, 1);
			}
		}
		else if (data.action === 'update' && data.data) {
			webSocketService.handleMobUpdateData(data.data);
		}
	}

	// Handler pour les mises à jour batch de mobs
	this.mobs_batchHandler = function(data) {
		if (!data.mobs) return;
		data.mobs.forEach(function(mobData) {
			webSocketService.handleMobUpdateData(mobData);
		});
	}

	// Fonction utilitaire pour mettre à jour les données d'un mob
	this.handleMobUpdateData = function(d) {
		if (!window.GameSystems || !window.GameSystems.combat) return;
		var combat = window.GameSystems.combat;
		var mob = combat.mobs.find(function(m) { return m.serverId === d.i; });
		if (!mob) return;
		
		mob.prevX = typeof mob.targetX === 'number' ? mob.targetX : mob.x;
		mob.prevY = typeof mob.targetY === 'number' ? mob.targetY : mob.y;
		mob.targetX = d.x;
		mob.targetY = d.y;
		mob.vx = d.vx || 0;
		mob.vy = d.vy || 0;
		mob.prevAngle = typeof mob.targetAngle === 'number' ? mob.targetAngle : mob.angle;
		mob.targetAngle = d.a;
		mob.hp = d.h;
		mob.state = d.s === 'c' ? 'chase' : (d.s === 'r' ? 'return' : 'idle');
		
		var now = performance.now();
		mob.prevServerUpdateAt = mob.lastServerUpdateAt || now;
		mob.lastServerUpdateAt = now;
		var delta = now - mob.prevServerUpdateAt;
		if (delta > 0) {
			mob.serverUpdateInterval = mob.serverUpdateInterval * 0.8 + delta * 0.2;
		}
	}

	// Handler pour info de zone
	this.zone_infoHandler = function(data) {
		// Stocker la config de zone
		if (window.GameSystems) {
			window.GameSystems.zoneConfig = {
				currentZone: data.zone,
				zoneName: data.name,
				isSafe: data.safe,
				tutorialRadius: data.tutorialRadius,
				transitionRadius: data.transitionRadius,
				normalRadius: data.normalRadius
			};
		}
		// Notification
		if (data.zone && window.showToast) {
			var messages = {
				'tutorial': '🛡️ Zone Tutoriel - Vous êtes en sécurité!',
				'transition': '⚠️ Zone de Transition - Créatures faibles',
				'normal': '🌊 Eaux Normales - Restez vigilant!',
				'danger': '☠️ Eaux Profondes - DANGER EXTRÊME!'
			};
			window.showToast(messages[data.zone] || 'Zone: ' + data.name);
		}
	}

	// Handler pour attaque de mob
	this.mob_attackHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.combat) return;
		// Effet visuel d'attaque
		if (data.targetId && model.userTadpole && String(data.targetId) === String(model.userTadpole.id)) {
			window.GameSystems.combat.showDamageEffect(data.damage);
		}
	}

	// Handler pour dégâts sur mob
	this.mob_hitHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.combat) return;
		var combat = window.GameSystems.combat;
		var mob = combat.mobs.find(function(m) { return m.serverId === data.mobId; });
		if (mob) {
			mob.hp = data.hp;
			mob.maxHp = data.maxHp;
			// Effet visuel de dégât
			combat.showMobDamageNumber(mob, data.damage);
		}
	}

	// Handler pour loot drop
	this.loot_dropHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.combat) return;
		var combat = window.GameSystems.combat;
		if (data.items && data.items.length > 0) {
			data.items.forEach(function(itemId, idx) {
				combat.lootDrops.push({
					serverId: 'loot-' + Date.now() + '-' + idx,
					itemId: itemId,
					x: data.x + (idx - data.items.length/2) * 15,
					y: data.y,
					spawnTime: Date.now(),
					killerId: data.killerId
				});
			});
		}
	}

	// Handler pour gain d'XP
	this.xp_gainHandler = function(data) {
		if (!window.GameSystems || !window.GameSystems.playerStats) return;
		window.GameSystems.playerStats.addXP(data.amount);
		window.showToast && window.showToast('+' + data.amount + ' XP', 'success');
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
		
		// Forward to AdvancedSystems for new system types
		if (window.AdvancedSystems && data && data.type) {
			var advancedTypes = [
				'talents_sync', 'talent_result',
				'achievements_sync', 'achievement_unlocked',
				'crafting_sync', 'craft_started', 'craft_completed', 'craft_cancelled',
				'pets_sync', 'pet_obtained', 'pet_level_up', 'pet_spawn', 'pet_despawn', 'pet_ability',
				'leaderboard_full', 'leaderboard_sync', 'leaderboard_top',
				'events_sync', 'event_started', 'event_ended',
				'world_boss_spawn', 'world_boss_update', 'world_boss_killed', 'world_boss_ability', 'world_boss_reward',
				'daily_reward_claimed',
				'trade_request', 'trade_started', 'trade_item_added', 'trade_item_removed',
				'trade_gems_changed', 'trade_confirmed', 'trade_closed',
				'buff_applied', 'buff_removed'
			];
			if (advancedTypes.indexOf(data.type) !== -1) {
				window.AdvancedSystems.handleMessage(data);
			}
		}
	}

	// === HANDLERS GROUPE ===
	this.group_resultHandler = function(data) {
		if (!data.result) return;
		var result = data.result;
		if (result.success) {
			window.showToast && window.showToast('✅ ' + (data.action || 'Action') + ' réussie', 'success');
		} else {
			window.showToast && window.showToast('❌ ' + (result.error || 'Erreur'), 'error');
		}
	};
	
	this.group_createdHandler = function(data) {
		window.showToast && window.showToast('🎉 Groupe créé !', 'success');
		if (window.GameSystems) {
			window.GameSystems.currentGroup = data.data.group;
		}
	};
	
	this.group_inviteHandler = function(data) {
		var inviterName = data.data.inviterName || 'Joueur';
		window.showToast && window.showToast('📨 ' + inviterName + ' vous invite à rejoindre son groupe', 'info');
		// Stocker l'invitation pour accepter/refuser
		if (window.GameSystems) {
			window.GameSystems.pendingGroupInvite = data.data;
		}
	};
	
	this.group_member_joinedHandler = function(data) {
		var playerName = data.data.playerName || 'Joueur';
		window.showToast && window.showToast('👋 ' + playerName + ' a rejoint le groupe', 'info');
		if (window.GameSystems) {
			window.GameSystems.currentGroup = data.data.group;
		}
	};
	
	this.group_member_leftHandler = function(data) {
		var playerName = data.data.playerName || 'Joueur';
		window.showToast && window.showToast('👋 ' + playerName + ' a quitté le groupe', 'info');
		if (window.GameSystems) {
			window.GameSystems.currentGroup = data.data.group;
		}
	};
	
	this.group_leftHandler = function(data) {
		window.showToast && window.showToast('Vous avez quitté le groupe', 'info');
		if (window.GameSystems) {
			window.GameSystems.currentGroup = null;
		}
	};
	
	this.group_kickedHandler = function(data) {
		window.showToast && window.showToast('❌ Vous avez été exclu du groupe', 'warning');
		if (window.GameSystems) {
			window.GameSystems.currentGroup = null;
		}
	};
	
	this.group_leader_changedHandler = function(data) {
		var newLeaderName = data.data.newLeaderName || 'Joueur';
		window.showToast && window.showToast('👑 ' + newLeaderName + ' est le nouveau chef', 'info');
		if (window.GameSystems) {
			window.GameSystems.currentGroup = data.data.group;
		}
	};

	// === HANDLERS INVENTAIRE ===
	this.inventory_syncHandler = function(data) {
		if (window.GameSystems && window.GameSystems.inventory) {
			window.GameSystems.inventory.slots = data.slots;
			window.GameSystems.inventory.gems = data.gems;
			window.GameSystems.inventory.gold = data.gold;
			window.GameSystems.inventory.maxSlots = data.maxSlots;
			window.GameSystems.inventory.updateUI && window.GameSystems.inventory.updateUI();
		}
	};
	
	this.equipment_syncHandler = function(data) {
		if (window.GameSystems) {
			window.GameSystems.equippedSpells = data.spells;
			window.GameSystems.equippedArmor = data.armor;
			window.GameSystems.equippedAccessory = data.accessory;
		}
	};
	
	this.inventory_resultHandler = function(data) {
		if (!data.result) return;
		if (!data.result.success) {
			window.showToast && window.showToast('❌ ' + (data.result.error || 'Erreur'), 'error');
		}
	};
	
	this.buff_appliedHandler = function(data) {
		if (window.GameSystems && window.GameSystems.gameState) {
			var buff = data.buff;
			if (buff.stat === 'speed') {
				window.GameSystems.gameState.speedBoostUntil = buff.expiresAt;
				window.GameSystems.gameState.speedMultiplier = buff.value;
			} else if (buff.stat === 'damage') {
				window.GameSystems.gameState.damageBoostUntil = buff.expiresAt;
				window.GameSystems.gameState.damageMultiplier = buff.value;
			}
		}
		window.showToast && window.showToast('✨ Buff appliqué !', 'success');
	};
	
	this.shield_appliedHandler = function(data) {
		if (window.GameSystems && window.GameSystems.gameState) {
			window.GameSystems.gameState.shieldUntil = data.shield.expiresAt;
		}
		window.showToast && window.showToast('🛡️ Bouclier activé !', 'success');
	};
	
	this.spell_castHandler = function(data) {
		if (window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.handleRemoteSpell(data.spell);
		}
	};
	
	this.spell_resultHandler = function(data) {
		if (!data.result) return;
		if (!data.result.success) {
			window.showToast && window.showToast('⏳ ' + (data.result.error || 'Sort en recharge'), 'warning');
		}
	};
	
	this.loot_spawnHandler = function(data) {
		if (window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.lootDrops.push({
				serverId: data.loot.id,
				itemId: data.loot.itemType,
				x: data.loot.x,
				y: data.loot.y,
				time: Date.now()
			});
		}
	};
	
	this.loot_pickupHandler = function(data) {
		if (window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.lootDrops = window.GameSystems.combat.lootDrops.filter(function(l) {
				return l.serverId !== data.lootId;
			});
		}
		if (data.playerId === model.userTadpole.id) {
			window.showToast && window.showToast('📦 Objet récupéré !', 'success');
		}
	};
	
	this.loot_pickup_failedHandler = function(data) {
		window.showToast && window.showToast('❌ ' + (data.reason || 'Impossible de ramasser'), 'warning');
	};
	
	this.loot_expiredHandler = function(data) {
		if (window.GameSystems && window.GameSystems.combat) {
			window.GameSystems.combat.lootDrops = window.GameSystems.combat.lootDrops.filter(function(l) {
				return l.serverId !== data.lootId;
			});
		}
	};

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
		// Avoid throws when socket is closing / closed
		if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
			return;
		}
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

	// === GROUP METHODS ===
	this.sendGroupCreate = function(name) {
		webSocket.send(JSON.stringify({type: 'group_create', name: name || null}));
	}

	this.sendGroupInvite = function(targetId) {
		webSocket.send(JSON.stringify({type: 'group_invite', targetId: targetId}));
	}

	this.sendGroupAccept = function() {
		webSocket.send(JSON.stringify({type: 'group_accept'}));
	}

	this.sendGroupDecline = function() {
		webSocket.send(JSON.stringify({type: 'group_decline'}));
	}

	this.sendGroupLeave = function() {
		webSocket.send(JSON.stringify({type: 'group_leave'}));
	}

	this.sendGroupKick = function(targetId) {
		webSocket.send(JSON.stringify({type: 'group_kick', targetId: targetId}));
	}

	this.sendGroupPromote = function(targetId) {
		webSocket.send(JSON.stringify({type: 'group_promote', targetId: targetId}));
	}

	// === INVENTORY METHODS ===
	this.sendInventoryUse = function(slotIndex) {
		webSocket.send(JSON.stringify({type: 'inventory_use', slot: slotIndex}));
	}

	this.sendInventoryDrop = function(slotIndex) {
		webSocket.send(JSON.stringify({type: 'inventory_drop', slot: slotIndex}));
	}

	this.sendSpellEquip = function(spellId, slotIndex) {
		webSocket.send(JSON.stringify({type: 'spell_equip', spellId: spellId, slot: slotIndex}));
	}

	this.sendSpellCast = function(slotIndex, x, y) {
		webSocket.send(JSON.stringify({type: 'spell_cast', slot: slotIndex, x: x, y: y}));
	}

	this.sendLootPickup = function(lootId) {
		webSocket.send(JSON.stringify({type: 'loot_pickup', lootId: lootId}));
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
