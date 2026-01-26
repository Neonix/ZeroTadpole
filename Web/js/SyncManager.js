/**
 * SyncManager v2.0 - Synchronisation client-serveur améliorée
 * 
 * Améliorations:
 * - Utilisation des timestamps serveur pour interpolation précise
 * - Support des numéros de tick serveur
 * - Gestion des zones progressives avec tutoriel
 * - Batch processing optimisé des messages
 * - Prédiction côté client avec réconciliation serveur
 */

var SyncManager = (function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================
    
    const CONFIG = {
        // Interpolation
        interpolationDelay: 100,  // ms de délai pour l'interpolation
        positionSnapThreshold: 50, // Distance max avant téléportation
        
        // Prédiction
        predictionEnabled: true,
        maxPredictionTime: 200, // ms max de prédiction
        
        // Rate limiting
        sendRate: 50, // ms entre les envois (20 updates/sec)
        
        // Synchronisation serveur
        serverTimeOffset: 0,    // Décalage calculé entre client et serveur
        lastServerTick: 0,
        serverTickRate: 30,
        
        // Debug
        debug: false
    };

    // ============================================
    // ÉTAT
    // ============================================
    
    let state = {
        // Connexion
        socket: null,
        connected: false,
        protocolVersion: 0,
        
        // Temps serveur
        serverTimeOffset: 0,
        lastServerTick: 0,
        lastSendTime: 0,
        
        // Entités
        entities: {},
        localPlayer: null,
        
        // Mobs (gérés par le serveur)
        mobs: {},
        
        // NPCs du tutoriel
        npcs: {},
        
        // Zone actuelle
        currentZone: null,
        zoneConfig: null,
        inSafeZone: true,
        canDie: false,
        
        // Buffers d'interpolation
        positionBuffers: {},
        
        // Tutorial state
        tutorialStep: 'welcome',
        
        // Callbacks
        callbacks: {}
    };

    // ============================================
    // SYNCHRONISATION TEMPS SERVEUR
    // ============================================
    
    /**
     * Calcule le décalage entre le temps client et serveur
     */
    function updateServerTimeOffset(serverTime) {
        const clientTime = Date.now();
        state.serverTimeOffset = serverTime - clientTime;
        
        if (CONFIG.debug) {
            console.log('[SYNC] Server time offset:', state.serverTimeOffset, 'ms');
        }
    }
    
    /**
     * Convertit un timestamp serveur en temps local
     */
    function serverTimeToLocal(serverTime) {
        return serverTime - state.serverTimeOffset;
    }
    
    /**
     * Obtient le temps serveur estimé actuel
     */
    function getEstimatedServerTime() {
        return Date.now() + state.serverTimeOffset;
    }
    
    /**
     * Traite le message de sync initiale
     */
    function handleSyncInfo(data) {
        state.protocolVersion = data.protocolVersion || 1;
        state.lastServerTick = data.serverTick || 0;
        CONFIG.serverTickRate = data.tickRate || 30;
        
        if (data.serverTime) {
            updateServerTimeOffset(data.serverTime);
        }
        
        if (data.zones) {
            state.zoneConfig = data.zones;
        }
        
        console.log('[SYNC] Protocol v' + state.protocolVersion + ', Tick rate: ' + CONFIG.serverTickRate);
    }

    // ============================================
    // INTERPOLATION AMÉLIORÉE
    // ============================================
    
    /**
     * Ajoute une position au buffer d'interpolation avec timestamp serveur
     */
    function addPositionToBuffer(entityId, x, y, vx, vy, angle, serverTime) {
        if (!state.positionBuffers[entityId]) {
            state.positionBuffers[entityId] = [];
        }
        
        const buffer = state.positionBuffers[entityId];
        const localTime = serverTime ? serverTimeToLocal(serverTime) : Date.now();
        
        buffer.push({
            x: x,
            y: y,
            vx: vx || 0,
            vy: vy || 0,
            angle: angle || 0,
            timestamp: localTime,
            serverTime: serverTime || getEstimatedServerTime()
        });
        
        // Garder seulement les 10 dernières positions
        while (buffer.length > 10) {
            buffer.shift();
        }
    }

    /**
     * Calcule la position interpolée d'une entité
     */
    function getInterpolatedPosition(entityId) {
        const buffer = state.positionBuffers[entityId];
        if (!buffer || buffer.length === 0) {
            return null;
        }
        
        const renderTime = Date.now() - CONFIG.interpolationDelay;
        
        // Trouver les deux positions entourant le temps de rendu
        let before = null;
        let after = null;
        
        for (let i = 0; i < buffer.length; i++) {
            if (buffer[i].timestamp <= renderTime) {
                before = buffer[i];
            } else {
                after = buffer[i];
                break;
            }
        }
        
        // Si pas de position avant, utiliser la première
        if (!before && buffer.length > 0) {
            before = buffer[0];
        }
        
        // Si pas de position après, extrapoler avec vélocité
        if (!after) {
            if (before) {
                const dt = (Date.now() - before.timestamp) / 1000;
                // Limiter l'extrapolation à 200ms
                const maxDt = Math.min(dt, 0.2);
                return {
                    x: before.x + before.vx * maxDt,
                    y: before.y + before.vy * maxDt,
                    angle: before.angle
                };
            }
            return null;
        }
        
        // Interpoler entre les deux positions
        if (before && after) {
            const total = after.timestamp - before.timestamp;
            const progress = total > 0 ? (renderTime - before.timestamp) / total : 0;
            const t = Math.max(0, Math.min(1, progress));
            
            return {
                x: before.x + (after.x - before.x) * t,
                y: before.y + (after.y - before.y) * t,
                angle: lerpAngle(before.angle, after.angle, t)
            };
        }
        
        return before ? { x: before.x, y: before.y, angle: before.angle } : null;
    }

    /**
     * Interpolation d'angle (gère le wrap-around)
     */
    function lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return a + diff * t;
    }

    // ============================================
    // GESTION DES MOBS (SERVEUR AUTORITAIRE)
    // ============================================
    
    /**
     * Traite un message de mob
     */
    function handleMobMessage(data) {
        const action = data.action;
        const serverTime = data.time;
        
        // Mettre à jour le tick serveur si présent
        if (data.tick) {
            state.lastServerTick = data.tick;
        }
        
        if (action === 'spawn') {
            state.mobs[data.id] = {
                id: data.id,
                mobType: data.mobType,
                name: data.name,
                icon: data.icon,
                x: data.x,
                y: data.y,
                vx: data.vx || 0,
                vy: data.vy || 0,
                angle: data.angle || 0,
                hp: data.hp,
                maxHp: data.maxHp,
                damage: data.damage,
                speed: data.speed,
                size: data.size,
                color: data.color,
                mobClass: data.mobClass || 'mob',
                tier: data.tier || 1,
                zone: data.zone,
                passive: data.passive || false,
                xpReward: data.xpReward || 10,
                dropTable: data.dropTable || [],
                dropChance: data.dropChance || 0.3,
                state: 'idle',
                targetId: null,
                lastUpdate: Date.now(),
                serverTime: serverTime
            };
            
            addPositionToBuffer(data.id, data.x, data.y, data.vx, data.vy, data.angle, serverTime);
            
            if (state.callbacks.onMobSpawn) {
                state.callbacks.onMobSpawn(state.mobs[data.id]);
            }
        }
        else if (action === 'death') {
            const mob = state.mobs[data.id];
            if (mob && state.callbacks.onMobDeath) {
                state.callbacks.onMobDeath(mob);
            }
            delete state.mobs[data.id];
            delete state.positionBuffers[data.id];
        }
        else if (action === 'update') {
            const d = data.data;
            const mob = state.mobs[d.i];
            if (mob) {
                mob.x = d.x;
                mob.y = d.y;
                mob.vx = d.vx;
                mob.vy = d.vy;
                mob.angle = d.a;
                mob.hp = d.h;
                mob.state = decodeState(d.s);
                mob.targetId = d.t || null;
                mob.lastUpdate = Date.now();
                mob.serverTime = serverTime;
                
                addPositionToBuffer(d.i, d.x, d.y, d.vx, d.vy, d.a, serverTime);
            }
        }
    }
    
    /**
     * Décode l'état compact du mob
     */
    function decodeState(code) {
        switch (code) {
            case 'c': return 'chase';
            case 'r': return 'return';
            case 'f': return 'flee';
            default: return 'idle';
        }
    }

    /**
     * Traite un batch de mises à jour de mobs
     */
    function handleMobsBatch(data) {
        const mobs = data.mobs;
        const now = Date.now();
        const serverTime = data.time;
        
        // Mettre à jour le tick serveur
        if (data.tick) {
            state.lastServerTick = data.tick;
        }
        
        for (let i = 0; i < mobs.length; i++) {
            const d = mobs[i];
            const mob = state.mobs[d.i];
            if (mob) {
                mob.x = d.x;
                mob.y = d.y;
                mob.vx = d.vx;
                mob.vy = d.vy;
                mob.angle = d.a;
                mob.hp = d.h;
                mob.state = decodeState(d.s);
                mob.targetId = d.t || null;
                mob.lastUpdate = now;
                mob.serverTime = serverTime;
                
                addPositionToBuffer(d.i, d.x, d.y, d.vx, d.vy, d.a, serverTime);
            }
        }
    }
    
    /**
     * Traite un snapshot complet du monde
     */
    function handleWorldSnapshot(data) {
        if (data.tick) {
            state.lastServerTick = data.tick;
        }
        
        const serverTime = data.time;
        
        // Mise à jour des positions de tous les mobs
        if (data.mobs) {
            for (const d of data.mobs) {
                const mob = state.mobs[d.i];
                if (mob) {
                    mob.x = d.x;
                    mob.y = d.y;
                    mob.hp = d.h;
                    mob.state = decodeState(d.s);
                    mob.serverTime = serverTime;
                }
            }
        }
    }

    /**
     * Met à jour les positions interpolées de tous les mobs
     */
    function updateMobPositions() {
        const now = Date.now();
        
        for (const id in state.mobs) {
            const mob = state.mobs[id];
            const interpolated = getInterpolatedPosition(id);
            
            if (interpolated) {
                mob.renderX = interpolated.x;
                mob.renderY = interpolated.y;
                mob.renderAngle = interpolated.angle;
            } else {
                // Extrapoler avec vélocité
                const dt = (now - mob.lastUpdate) / 1000;
                mob.renderX = mob.x + mob.vx * dt;
                mob.renderY = mob.y + mob.vy * dt;
                mob.renderAngle = mob.angle;
            }
        }
    }

    // ============================================
    // GESTION DES ZONES
    // ============================================
    
    /**
     * Traite un message d'info de zone
     */
    function handleZoneInfo(data) {
        const oldZone = state.currentZone;
        state.currentZone = data.zone;
        state.zoneConfig = {
            tutorialRadius: data.tutorialRadius,
            transitionRadius: data.transitionRadius,
            normalRadius: data.normalRadius
        };
        
        if (state.callbacks.onZoneChange && oldZone !== data.zone) {
            state.callbacks.onZoneChange(data);
        }
        
        // Mettre à jour les flags de sécurité
        state.inSafeZone = data.safe || false;
        state.canDie = data.canDie !== false;
    }
    
    /**
     * Traite un message de tutoriel
     */
    function handleTutorialMessage(data) {
        state.tutorialStep = data.step;
        
        if (state.callbacks.onTutorialMessage) {
            state.callbacks.onTutorialMessage(data);
        }
    }
    
    /**
     * Traite le spawn d'un NPC
     */
    function handleNPCSpawn(data) {
        const npc = data.npc;
        state.npcs[npc.id] = npc;
        
        if (state.callbacks.onNPCSpawn) {
            state.callbacks.onNPCSpawn(npc);
        }
    }

    /**
     * Vérifie si une position est en zone safe
     */
    function isInSafeZone(x, y) {
        if (!state.zoneConfig) return true;  // Par défaut safe si pas de config
        const dist = Math.sqrt(x * x + y * y);
        return dist <= state.zoneConfig.tutorialRadius;
    }

    /**
     * Obtient la zone pour une position
     */
    function getZoneForPosition(x, y) {
        if (!state.zoneConfig) return 'tutorial';
        const dist = Math.sqrt(x * x + y * y);
        
        if (dist <= state.zoneConfig.tutorialRadius) return 'tutorial';
        if (dist <= state.zoneConfig.transitionRadius) return 'transition';
        if (dist <= state.zoneConfig.normalRadius) return 'normal';
        return 'danger';
    }
    
    /**
     * Obtient le nom formaté de la zone
     */
    function getZoneName(zone) {
        const names = {
            'tutorial': '🏠 Zone Tutoriel',
            'transition': '🌊 Eaux Peu Profondes',
            'normal': '🌀 Eaux Normales',
            'danger': '☠️ Abysses'
        };
        return names[zone] || 'Inconnu';
    }

    // ============================================
    // GESTION DES JOUEURS
    // ============================================
    
    /**
     * Traite une mise à jour de joueur
     */
    function handlePlayerUpdate(data) {
        const playerId = data.id;
        
        if (!playerId) return;
        
        let entity = state.entities[playerId];
        const isNew = !entity;
        
        if (isNew) {
            entity = {
                id: playerId,
                name: data.name || 'Unknown',
                color: data.color || '#9ad7ff',
                x: data.x,
                y: data.y,
                angle: data.angle || 0,
                momentum: data.momentum || 0,
                renderX: data.x,
                renderY: data.y,
                renderAngle: data.angle || 0
            };
            state.entities[playerId] = entity;
        }
        
        if (data.name) entity.name = data.name;
        if (data.color) entity.color = data.color;
        
        if (data.x !== undefined && data.y !== undefined) {
            // Vérifier si on doit téléporter ou interpoler
            const dx = data.x - entity.x;
            const dy = data.y - entity.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > CONFIG.positionSnapThreshold) {
                // Téléportation
                entity.x = data.x;
                entity.y = data.y;
                entity.renderX = data.x;
                entity.renderY = data.y;
            } else {
                // Position cible pour interpolation
                entity.x = data.x;
                entity.y = data.y;
            }
        }
        
        if (data.angle !== undefined) entity.angle = data.angle;
        if (data.momentum !== undefined) entity.momentum = data.momentum;
        
        entity.lastUpdate = Date.now();
        
        // Ajouter au buffer d'interpolation
        addPositionToBuffer(playerId, entity.x, entity.y, 0, 0, entity.angle);
        
        if (isNew && state.callbacks.onPlayerSpawn) {
            state.callbacks.onPlayerSpawn(entity);
        }
    }

    /**
     * Met à jour les positions interpolées des joueurs
     */
    function updatePlayerPositions() {
        for (const id in state.entities) {
            if (state.localPlayer && id === state.localPlayer.id) continue;
            
            const entity = state.entities[id];
            const interpolated = getInterpolatedPosition(id);
            
            if (interpolated) {
                entity.renderX = interpolated.x;
                entity.renderY = interpolated.y;
                entity.renderAngle = interpolated.angle;
            } else {
                // Smooth lerp vers la position cible
                entity.renderX += (entity.x - entity.renderX) * 0.2;
                entity.renderY += (entity.y - entity.renderY) * 0.2;
            }
        }
    }

    // ============================================
    // COMMUNICATION - MESSAGES SERVEUR
    // ============================================
    
    /**
     * Traite un message reçu du serveur
     */
    function handleMessage(messages) {
        if (!Array.isArray(messages)) {
            messages = [messages];
        }
        
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            // Mettre à jour le tick serveur si présent
            if (msg && msg.tick) {
                state.lastServerTick = msg.tick;
            }
            
            // Mettre à jour l'offset de temps si présent
            if (msg && msg.time) {
                updateServerTimeOffset(msg.time);
            }
            
            // Nouveau format (objet avec type)
            if (msg && typeof msg === 'object' && msg.type) {
                switch (msg.type) {
                    // Synchronisation
                    case 'sync_info':
                        handleSyncInfo(msg);
                        break;
                    case 'world_snapshot':
                        handleWorldSnapshot(msg);
                        break;
                    
                    // Mobs
                    case 'mob':
                        handleMobMessage(msg);
                        break;
                    case 'mobs_batch':
                        handleMobsBatch(msg);
                        break;
                    case 'mob_attack':
                        if (state.callbacks.onMobAttack) {
                            state.callbacks.onMobAttack(msg);
                        }
                        break;
                    case 'mob_hit':
                        // Mettre à jour le HP local du mob
                        if (state.mobs[msg.mobId]) {
                            state.mobs[msg.mobId].hp = msg.hp;
                        }
                        if (state.callbacks.onMobHit) {
                            state.callbacks.onMobHit(msg);
                        }
                        break;
                    
                    // Zones et tutoriel
                    case 'zone_info':
                        handleZoneInfo(msg);
                        break;
                    case 'tutorial_message':
                        handleTutorialMessage(msg);
                        break;
                    case 'npc_spawn':
                        handleNPCSpawn(msg);
                        break;
                    
                    // Loot et progression
                    case 'loot_drop':
                        if (state.callbacks.onLootDrop) {
                            state.callbacks.onLootDrop(msg);
                        }
                        break;
                    case 'xp_gain':
                        if (state.callbacks.onXPGain) {
                            state.callbacks.onXPGain(msg);
                        }
                        break;
                    
                    // Santé
                    case 'health':
                        if (state.callbacks.onHealth) {
                            state.callbacks.onHealth(msg);
                        }
                        break;
                    
                    default:
                        // Passer aux handlers existants
                        if (state.callbacks.onMessage) {
                            state.callbacks.onMessage(msg);
                        }
                }
            }
            // Ancien format (array) - compatibilité
            else if (Array.isArray(msg)) {
                if (state.callbacks.onLegacyMessage) {
                    state.callbacks.onLegacyMessage(msg);
                }
            }
        }
    }

    /**
     * Envoie les données de mouvement du joueur (rate limited)
     */
    function sendPlayerUpdate(player) {
        const now = Date.now();
        
        if (now - state.lastSendTime < CONFIG.sendRate) {
            return false;
        }
        
        state.lastSendTime = now;
        
        if (state.socket && state.connected) {
            state.socket.send(JSON.stringify({
                type: 'update',
                tick: state.lastServerTick,  // Inclure le dernier tick connu
                x: player.x.toFixed(1),
                y: player.y.toFixed(1),
                angle: player.angle.toFixed(3),
                momentum: player.momentum.toFixed(3),
                name: player.name,
                color: player.color
            }));
            return true;
        }
        
        return false;
    }

    /**
     * Envoie une attaque sur un mob
     */
    function sendMobHit(mobId, damage) {
        if (state.socket && state.connected) {
            state.socket.send(JSON.stringify({
                type: 'mob_hit',
                tick: state.lastServerTick,
                id: mobId,
                damage: damage
            }));
        }
    }

    // ============================================
    // MISE À JOUR
    // ============================================
    
    /**
     * Mise à jour appelée chaque frame
     */
    function update() {
        updatePlayerPositions();
        updateMobPositions();
    }

    // ============================================
    // API PUBLIQUE
    // ============================================
    
    return {
        // Configuration
        setSocket: function(socket) {
            state.socket = socket;
        },
        
        setConnected: function(connected) {
            state.connected = connected;
        },
        
        setLocalPlayer: function(player) {
            state.localPlayer = player;
        },
        
        // Callbacks
        on: function(event, callback) {
            state.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
        },
        
        // Messages
        handleMessage: handleMessage,
        
        // Envoi
        sendPlayerUpdate: sendPlayerUpdate,
        sendMobHit: sendMobHit,
        
        // Mise à jour
        update: update,
        
        // Getters - Entités
        getMobs: function() { return state.mobs; },
        getMob: function(id) { return state.mobs[id]; },
        getEntities: function() { return state.entities; },
        getEntity: function(id) { return state.entities[id]; },
        getNPCs: function() { return state.npcs; },
        getNPC: function(id) { return state.npcs[id]; },
        
        // Getters - Zones
        getCurrentZone: function() { return state.currentZone; },
        getZoneConfig: function() { return state.zoneConfig; },
        isInSafeZone: isInSafeZone,
        getZoneForPosition: getZoneForPosition,
        getZoneName: getZoneName,
        
        // Getters - État tutoriel
        getTutorialStep: function() { return state.tutorialStep; },
        canPlayerDie: function() { return state.canDie; },
        
        // Getters - Synchronisation
        getServerTick: function() { return state.lastServerTick; },
        getServerTimeOffset: function() { return state.serverTimeOffset; },
        getEstimatedServerTime: getEstimatedServerTime,
        getProtocolVersion: function() { return state.protocolVersion; },
        
        // Debug
        getState: function() { return state; },
        getConfig: function() { return CONFIG; }
    };
})();

// Exposer globalement
window.SyncManager = SyncManager;
