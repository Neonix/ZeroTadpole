/**
 * ZeroTadpole - Game Systems
 * Combat, Inventory, Quests, Bosses, Spells, PvP/PvE
 */

(function() {
    'use strict';

    // ============================================
    // ITEMS & SPELLS DATABASE
    // ============================================
    
    const ITEMS = {
        // Healing items
        'potion_health': {
            id: 'potion_health',
            name: 'Potion de Vie',
            icon: '❤️',
            type: 'consumable',
            rarity: 'common',
            description: 'Restaure 30 PV',
            effect: { type: 'heal', value: 30 },
            dropRate: 0.3
        },
        'potion_health_large': {
            id: 'potion_health_large',
            name: 'Grande Potion',
            icon: '💖',
            type: 'consumable',
            rarity: 'uncommon',
            description: 'Restaure 60 PV',
            effect: { type: 'heal', value: 60 },
            dropRate: 0.15
        },
        'potion_speed': {
            id: 'potion_speed',
            name: 'Potion de Vitesse',
            icon: '💨',
            type: 'consumable',
            rarity: 'uncommon',
            description: 'Boost de vitesse 10s',
            effect: { type: 'speed', value: 1.5, duration: 10000 },
            dropRate: 0.15
        },
        'shield_bubble': {
            id: 'shield_bubble',
            name: 'Bulle Protectrice',
            icon: '🛡️',
            type: 'consumable',
            rarity: 'rare',
            description: 'Invincible 5s',
            effect: { type: 'shield', duration: 5000 },
            dropRate: 0.08
        },
        
        // Spells
        'spell_bubble': {
            id: 'spell_bubble',
            name: 'Bulle d\'Attaque',
            icon: '🫧',
            type: 'spell',
            rarity: 'common',
            description: 'Lance une bulle (15 dégâts)',
            damage: 15,
            cooldown: 1000,
            range: 150,
            speed: 8,
            dropRate: 0.25
        },
        'spell_wave': {
            id: 'spell_wave',
            name: 'Vague Sonore',
            icon: '🌊',
            type: 'spell',
            rarity: 'uncommon',
            description: 'Onde de choc (25 dégâts, zone)',
            damage: 25,
            cooldown: 3000,
            range: 80,
            aoe: true,
            dropRate: 0.12
        },
        'spell_lightning': {
            id: 'spell_lightning',
            name: 'Éclair Aquatique',
            icon: '⚡',
            type: 'spell',
            rarity: 'rare',
            description: 'Foudre rapide (40 dégâts)',
            damage: 40,
            cooldown: 5000,
            range: 200,
            speed: 15,
            dropRate: 0.06
        },
        'spell_vortex': {
            id: 'spell_vortex',
            name: 'Vortex',
            icon: '🌀',
            type: 'spell',
            rarity: 'epic',
            description: 'Tourbillon dévastateur (60 dégâts)',
            damage: 60,
            cooldown: 8000,
            range: 120,
            aoe: true,
            dropRate: 0.03
        },
        'spell_heal': {
            id: 'spell_heal',
            name: 'Régénération',
            icon: '✨',
            type: 'spell',
            rarity: 'rare',
            description: 'Soigne 40 PV',
            heal: 40,
            cooldown: 10000,
            dropRate: 0.05
        }
    };

    const RARITY_COLORS = {
        common: '#9ad7ff',
        uncommon: '#7dff7d',
        rare: '#7d7dff',
        epic: '#d07dff',
        legendary: '#ffd700'
    };

    // ============================================
    // BOSS/MOB DATABASE
    // ============================================
    
    const MOBS = {
        'crab_small': {
            id: 'crab_small',
            name: 'Petit Crabe',
            icon: '🦀',
            type: 'mob',
            hp: 30,
            maxHp: 30,
            damage: 5,
            speed: 1.5,
            size: 8,
            color: '#ff6b6b',
            xpReward: 10,
            dropTable: ['potion_health', 'spell_bubble'],
            dropChance: 0.4,
            spawnWeight: 40
        },
        'jellyfish': {
            id: 'jellyfish',
            name: 'Méduse',
            icon: '🪼',
            type: 'mob',
            hp: 50,
            maxHp: 50,
            damage: 10,
            speed: 1,
            size: 10,
            color: '#ff9eea',
            xpReward: 20,
            dropTable: ['potion_health', 'potion_speed', 'spell_wave'],
            dropChance: 0.5,
            spawnWeight: 30
        },
        'shark_mini': {
            id: 'shark_mini',
            name: 'Requin Juvenile',
            icon: '🦈',
            type: 'elite',
            hp: 100,
            maxHp: 100,
            damage: 20,
            speed: 2.5,
            size: 15,
            color: '#6b8cff',
            xpReward: 50,
            dropTable: ['potion_health_large', 'spell_lightning', 'shield_bubble'],
            dropChance: 0.7,
            spawnWeight: 15
        },
        'octopus_boss': {
            id: 'octopus_boss',
            name: 'Poulpe Ancien',
            icon: '🐙',
            type: 'boss',
            hp: 300,
            maxHp: 300,
            damage: 35,
            speed: 1.2,
            size: 25,
            color: '#9b59b6',
            xpReward: 200,
            dropTable: ['spell_vortex', 'spell_heal', 'shield_bubble'],
            dropChance: 1.0,
            spawnWeight: 5,
            abilities: ['ink_cloud', 'tentacle_whip']
        },
        'leviathan': {
            id: 'leviathan',
            name: 'Léviathan',
            icon: '🐉',
            type: 'boss',
            hp: 500,
            maxHp: 500,
            damage: 50,
            speed: 1.8,
            size: 35,
            color: '#e74c3c',
            xpReward: 500,
            dropTable: ['spell_vortex', 'spell_heal', 'spell_lightning'],
            dropChance: 1.0,
            guaranteedDrops: 2,
            spawnWeight: 2,
            abilities: ['flame_breath', 'tail_sweep', 'summon_minions']
        }
    };

    // ============================================
    // QUESTS DATABASE
    // ============================================
    
    const QUESTS = {
        'quest_collect_orbs': {
            id: 'quest_collect_orbs',
            name: 'Collecteur d\'Orbes',
            icon: '🔮',
            description: 'Collecte {target} orbes lumineuses',
            type: 'collect',
            targetType: 'orb',
            targetAmount: 10,
            rewards: { xp: 50, gems: 1 },
            repeatable: true,
            difficulty: 'easy'
        },
        'quest_kill_crabs': {
            id: 'quest_kill_crabs',
            name: 'Chasseur de Crabes',
            icon: '🦀',
            description: 'Élimine {target} petits crabes',
            type: 'kill',
            targetType: 'crab_small',
            targetAmount: 5,
            rewards: { xp: 100, gems: 2, item: 'potion_health' },
            repeatable: true,
            difficulty: 'easy'
        },
        'quest_kill_jellyfish': {
            id: 'quest_kill_jellyfish',
            name: 'Piqueur Piqué',
            icon: '🪼',
            description: 'Vaincs {target} méduses',
            type: 'kill',
            targetType: 'jellyfish',
            targetAmount: 3,
            rewards: { xp: 150, gems: 3, item: 'spell_wave' },
            repeatable: true,
            difficulty: 'medium'
        },
        'quest_boss_octopus': {
            id: 'quest_boss_octopus',
            name: 'Le Poulpe Ancien',
            icon: '🐙',
            description: 'Défais le Poulpe Ancien',
            type: 'kill',
            targetType: 'octopus_boss',
            targetAmount: 1,
            rewards: { xp: 500, gems: 10, item: 'spell_vortex' },
            repeatable: false,
            difficulty: 'hard'
        },
        'quest_explore': {
            id: 'quest_explore',
            name: 'Explorateur',
            icon: '🗺️',
            description: 'Parcours {target} mètres',
            type: 'distance',
            targetAmount: 1000,
            rewards: { xp: 75, gems: 1 },
            repeatable: true,
            difficulty: 'easy'
        },
        'quest_social': {
            id: 'quest_social',
            name: 'Têtard Social',
            icon: '💬',
            description: 'Envoie {target} messages dans le chat',
            type: 'chat',
            targetAmount: 5,
            rewards: { xp: 30, gems: 1 },
            repeatable: true,
            difficulty: 'easy'
        },
        'quest_pvp': {
            id: 'quest_pvp',
            name: 'Combattant',
            icon: '⚔️',
            description: 'Gagne {target} combats PvP',
            type: 'pvp_win',
            targetAmount: 3,
            rewards: { xp: 200, gems: 5, item: 'spell_lightning' },
            repeatable: true,
            difficulty: 'hard'
        }
    };

    // ============================================
    // PLAYER STATS CLASS
    // ============================================
    
    class PlayerStats {
        constructor() {
            this.load();
        }
        
        load() {
            const saved = localStorage.getItem('tadpole_stats');
            const defaults = {
                level: 1,
                xp: 0,
                xpToNext: 100,
                hp: 100,
                maxHp: 100,
                attack: 10,
                defense: 5,
                speed: 1,
                kills: 0,
                deaths: 0,
                pvpWins: 0,
                pvpLosses: 0,
                distanceTraveled: 0,
                orbsCollected: 0,
                bossesKilled: 0,
                questsCompleted: 0,
                chatMessages: 0
            };
            
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this, defaults, parsed);
            } else {
                Object.assign(this, defaults);
            }
        }
        
        save() {
            localStorage.setItem('tadpole_stats', JSON.stringify(this));
        }
        
        addXp(amount) {
            this.xp += amount;
            while (this.xp >= this.xpToNext) {
                this.levelUp();
            }
            this.save();
        }
        
        levelUp() {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.xpToNext * 1.5);
            this.maxHp += 10;
            this.hp = this.maxHp;
            this.attack += 2;
            this.defense += 1;
            
            if (window.showToast) {
                window.showToast(`🎉 Niveau ${this.level} ! +10 PV max, +2 ATK, +1 DEF`, 'success');
            }
        }
        
        takeDamage(amount) {
            const actualDamage = Math.max(1, amount - this.defense);
            this.hp = Math.max(0, this.hp - actualDamage);
            this.save();
            return actualDamage;
        }
        
        heal(amount) {
            this.hp = Math.min(this.maxHp, this.hp + amount);
            this.save();
        }
        
        isDead() {
            return this.hp <= 0;
        }
        
        respawn() {
            this.hp = this.maxHp;
            this.deaths++;
            this.save();
        }
    }

    // ============================================
    // INVENTORY CLASS
    // ============================================
    
    class Inventory {
        constructor(slots = 3) {
            this.maxSlots = slots;
            this.load();
        }
        
        load() {
            const saved = localStorage.getItem('tadpole_inventory');
            if (saved) {
                this.items = JSON.parse(saved);
            } else {
                this.items = [null, null, null];
            }
            // Ensure correct number of slots
            while (this.items.length < this.maxSlots) {
                this.items.push(null);
            }
        }
        
        save() {
            localStorage.setItem('tadpole_inventory', JSON.stringify(this.items));
        }
        
        addItem(itemId) {
            const item = ITEMS[itemId];
            if (!item) return false;
            
            // Find empty slot
            const emptySlot = this.items.findIndex(slot => slot === null);
            if (emptySlot === -1) {
                if (window.showToast) {
                    window.showToast('Inventaire plein !', 'warning');
                }
                return false;
            }
            
            this.items[emptySlot] = itemId;
            this.save();
            
            if (window.showToast) {
                window.showToast(`${item.icon} ${item.name} obtenu !`, 'success');
            }
            
            return true;
        }

        dropItem(slotIndex, model) {
            if (!window.GameSystems || !window.GameSystems.combat) {
                return false;
            }
            const itemId = this.removeItem(slotIndex);
            if (!itemId) {
                return false;
            }
            return window.GameSystems.combat.dropItem(itemId, model);
        }

        
        removeItem(slotIndex) {
            if (slotIndex < 0 || slotIndex >= this.maxSlots) return null;
            const itemId = this.items[slotIndex];
            this.items[slotIndex] = null;
            this.save();
            return itemId;
        }
        
        getItem(slotIndex) {
            if (slotIndex < 0 || slotIndex >= this.maxSlots) return null;
            const itemId = this.items[slotIndex];
            return itemId ? ITEMS[itemId] : null;
        }
        
        useItem(slotIndex, playerStats, gameState) {
            const item = this.getItem(slotIndex);
            if (!item) return false;
            
            if (item.type === 'consumable') {
                this.applyEffect(item.effect, playerStats, gameState);
                this.removeItem(slotIndex);
                if (window.showToast) {
                    window.showToast(`${item.icon} ${item.name} utilisé !`, 'info');
                }
                return true;
            } else if (item.type === 'spell') {
                return this.castSpell(item, slotIndex, gameState);
            }
            
            return false;
        }
        
        applyEffect(effect, playerStats, gameState) {
            switch (effect.type) {
                case 'heal':
                    playerStats.heal(effect.value);
                    break;
                case 'speed':
                    gameState.speedBoostUntil = Date.now() + effect.duration;
                    gameState.speedMultiplier = effect.value;
                    break;
                case 'shield':
                    gameState.shieldUntil = Date.now() + effect.duration;
                    break;
            }
        }
        
        castSpell(spell, slotIndex, gameState) {
            const now = Date.now();
            const cooldownKey = `spell_cooldown_${slotIndex}`;
            
            if (gameState[cooldownKey] && now < gameState[cooldownKey]) {
                const remaining = Math.ceil((gameState[cooldownKey] - now) / 1000);
                if (window.showToast) {
                    window.showToast(`Recharge: ${remaining}s`, 'warning');
                }
                return false;
            }
            
            gameState[cooldownKey] = now + spell.cooldown;
            
            // Healing spell
            if (spell.heal) {
                window.GameSystems.playerStats.heal(spell.heal);
                if (window.showToast) {
                    window.showToast(`${spell.icon} +${spell.heal} PV !`, 'success');
                }
                return true;
            }
            
            // Attack spell - create projectile
            if (window.GameSystems.combat) {
                window.GameSystems.combat.castSpell(spell);
                if (window.gameApp && window.gameApp.sendSpell) {
                    const model = window.gameApp.model;
                    const player = model?.userTadpole;
                    if (player) {
                        window.gameApp.sendSpell(spell.id, player.x, player.y, player.angle || 0);
                    }
                }
            }
            
            return true;
        }
        
        isFull() {
            return this.items.every(slot => slot !== null);
        }
        
        isEmpty() {
            return this.items.every(slot => slot === null);
        }
    }

    // ============================================
    // QUEST MANAGER
    // ============================================
    
    class QuestManager {
        constructor() {
            this.load();
        }
        
        load() {
            const saved = localStorage.getItem('tadpole_quests');
            if (saved) {
                const data = JSON.parse(saved);
                this.activeQuests = data.activeQuests || [];
                this.completedQuests = data.completedQuests || [];
            } else {
                this.activeQuests = [];
                this.completedQuests = [];
            }
        }
        
        save() {
            localStorage.setItem('tadpole_quests', JSON.stringify({
                activeQuests: this.activeQuests,
                completedQuests: this.completedQuests
            }));
        }
        
        getAvailableQuests() {
            return Object.values(QUESTS).filter(quest => {
                // Not already active
                if (this.activeQuests.find(q => q.id === quest.id)) return false;
                // Not completed (unless repeatable)
                if (!quest.repeatable && this.completedQuests.includes(quest.id)) return false;
                return true;
            });
        }
        
        acceptQuest(questId) {
            const quest = QUESTS[questId];
            if (!quest) return false;
            
            // Check if already active
            if (this.activeQuests.find(q => q.id === questId)) return false;
            
            this.activeQuests.push({
                id: questId,
                progress: 0,
                target: quest.targetAmount,
                startedAt: Date.now()
            });
            
            this.save();
            
            if (window.showToast) {
                window.showToast(`${quest.icon} Quête acceptée: ${quest.name}`, 'info');
            }
            
            return true;
        }
        
        updateProgress(type, targetType = null, amount = 1) {
            let questCompleted = false;
            
            this.activeQuests.forEach(activeQuest => {
                const quest = QUESTS[activeQuest.id];
                if (!quest) return;
                
                // Check if this update applies to this quest
                if (quest.type !== type) return;
                if (quest.targetType && quest.targetType !== targetType) return;
                
                activeQuest.progress += amount;
                
                // Check completion
                if (activeQuest.progress >= activeQuest.target) {
                    questCompleted = true;
                    this.completeQuest(activeQuest.id);
                }
            });
            
            this.save();
            return questCompleted;
        }
        
        completeQuest(questId) {
            const quest = QUESTS[questId];
            if (!quest) return;
            
            // Remove from active
            this.activeQuests = this.activeQuests.filter(q => q.id !== questId);
            
            // Add to completed
            if (!this.completedQuests.includes(questId)) {
                this.completedQuests.push(questId);
            }
            
            // Give rewards
            if (quest.rewards) {
                if (quest.rewards.xp) {
                    window.GameSystems.playerStats.addXp(quest.rewards.xp);
                }
                if (quest.rewards.gems) {
                    const currentGems = parseInt(localStorage.getItem('tadpole_gems') || '0', 10);
                    localStorage.setItem('tadpole_gems', (currentGems + quest.rewards.gems).toString());
                }
                if (quest.rewards.item) {
                    window.GameSystems.inventory.addItem(quest.rewards.item);
                }
            }
            
            window.GameSystems.playerStats.questsCompleted++;
            window.GameSystems.playerStats.save();
            
            if (window.showToast) {
                window.showToast(`🎉 Quête terminée: ${quest.name} !`, 'success');
            }
            
            this.save();
        }
        
        getActiveQuest(questId) {
            return this.activeQuests.find(q => q.id === questId);
        }
    }

    // ============================================
    // COMBAT SYSTEM
    // ============================================
    
    class CombatSystem {
        constructor() {
            this.mobs = [];
            this.projectiles = [];
            this.lootDrops = [];
            this.pvpEnabled = false;
            this.lastMobSpawn = 0;
            this.mobSpawnInterval = 5000; // 5 seconds
            this.maxMobs = 10;
            this.safeZoneCenter = null;
            this.safeZoneRadius = 220;
            this.serverControlledMobIds = new Set(['shark_mini', 'octopus_boss', 'leviathan']);
        }
        
        update(model, deltaTime) {
            this.ensureSafeZone(model);
            this.updateMobs(model, deltaTime);
            this.updateProjectiles(model, deltaTime);
            this.updateLoot(model);
            if (!this.isInSafeZone(model.userTadpole?.x || 0, model.userTadpole?.y || 0)) {
                this.spawnMobs(model);
            }
            this.checkCollisions(model);
        }

        dropItem(itemId, model) {
            const item = ITEMS[itemId];
            if (!item || !model.userTadpole) {
                return false;
            }
            this.lootDrops.push({
                id: Date.now() + Math.random(),
                itemId: itemId,
                x: model.userTadpole.x,
                y: model.userTadpole.y,
                spawnTime: Date.now()
            });
            if (window.showToast) {
                window.showToast(`${item.icon} ${item.name} jeté.`, 'info');
            }
            return true;
        }

        ensureSafeZone(model) {
            if (!model.userTadpole) {
                return;
            }
            if (!this.safeZoneCenter) {
                this.safeZoneCenter = {
                    x: model.userTadpole.x,
                    y: model.userTadpole.y
                };
                return;
            }
            const dx = model.userTadpole.x - this.safeZoneCenter.x;
            const dy = model.userTadpole.y - this.safeZoneCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > this.safeZoneRadius * 2) {
                this.safeZoneCenter = {
                    x: model.userTadpole.x,
                    y: model.userTadpole.y
                };
            }
        }

        isInSafeZone(x, y) {
            if (!this.safeZoneCenter) {
                return false;
            }
            const dx = x - this.safeZoneCenter.x;
            const dy = y - this.safeZoneCenter.y;
            return Math.sqrt(dx * dx + dy * dy) <= this.safeZoneRadius;
        }
        
        spawnMobs(model) {
            const now = Date.now();
            if (now - this.lastMobSpawn < this.mobSpawnInterval) return;
            if (this.mobs.length >= this.maxMobs) return;
            
            this.lastMobSpawn = now;
            
            // Random spawn based on weights
            const totalWeight = Object.values(MOBS).reduce((sum, mob) => sum + mob.spawnWeight, 0);
            let random = Math.random() * totalWeight;
            
            for (const mobType of Object.values(MOBS)) {
                if (this.serverControlledMobIds.has(mobType.id)) {
                    continue;
                }
                random -= mobType.spawnWeight;
                if (random <= 0) {
                    this.spawnMob(mobType, model);
                    break;
                }
            }
        }
        
        spawnMob(mobType, model) {
            // Spawn at random position away from player
            const playerX = model.userTadpole?.x || 0;
            const playerY = model.userTadpole?.y || 0;
            const safePadding = this.safeZoneRadius + 80;
            let angle = Math.random() * Math.PI * 2;
            let distance = 200 + Math.random() * 300;
            let attempts = 0;
            while (this.safeZoneCenter && attempts < 10) {
                const candidateX = playerX + Math.cos(angle) * distance;
                const candidateY = playerY + Math.sin(angle) * distance;
                if (!this.isInSafeZone(candidateX, candidateY)) {
                    break;
                }
                angle = Math.random() * Math.PI * 2;
                distance = safePadding + Math.random() * 300;
                attempts += 1;
            }
            
            const mob = {
                ...mobType,
                x: playerX + Math.cos(angle) * distance,
                y: playerY + Math.sin(angle) * distance,
                hp: mobType.hp,
                angle: Math.random() * Math.PI * 2,
                targetX: 0,
                targetY: 0,
                lastAttack: 0,
                attackCooldown: 1500,
                uniqueId: Date.now() + Math.random()
            };
            
            this.mobs.push(mob);
            
            // Announce boss spawns
            if (mobType.type === 'boss') {
                if (window.showToast) {
                    window.showToast(`⚠️ ${mobType.icon} ${mobType.name} apparaît !`, 'warning');
                }
            }
        }
        
        updateMobs(model, deltaTime) {
            const playerX = model.userTadpole?.x || 0;
            const playerY = model.userTadpole?.y || 0;
            const smoothFactor = Math.min(1, Math.max(0.05, deltaTime / 120));
            const deltaSeconds = Math.max(0.001, deltaTime / 1000);
            const now = performance.now();
            
            this.mobs.forEach(mob => {
                if (mob.serverControlled) {
                    if (mob.type === undefined && mob.mobType && window.GameSystems && window.GameSystems.MOBS) {
                        const mobTemplate = window.GameSystems.MOBS[mob.mobType];
                        if (mobTemplate && mobTemplate.type) {
                            mob.type = mobTemplate.type;
                        }
                    }
                    const interpolationDelay = mob.serverUpdateInterval
                        ? Math.min(400, Math.max(120, mob.serverUpdateInterval * 1.1))
                        : 120;
                    if (
                        typeof mob.prevX === 'number'
                        && typeof mob.prevY === 'number'
                        && typeof mob.targetX === 'number'
                        && typeof mob.targetY === 'number'
                        && typeof mob.lastServerUpdateAt === 'number'
                        && typeof mob.prevServerUpdateAt === 'number'
                    ) {
                        const serverDelta = Math.max(16, mob.lastServerUpdateAt - mob.prevServerUpdateAt);
                        const renderTime = now - interpolationDelay;
                        const alpha = Math.max(0, (renderTime - mob.prevServerUpdateAt) / serverDelta);
                        if (alpha <= 1) {
                            mob.x = mob.prevX + (mob.targetX - mob.prevX) * alpha;
                            mob.y = mob.prevY + (mob.targetY - mob.prevY) * alpha;
                        } else if (typeof mob.vx === 'number' && typeof mob.vy === 'number') {
                            mob.x += mob.vx * deltaSeconds;
                            mob.y += mob.vy * deltaSeconds;
                        }
                        if (typeof mob.targetAngle === 'number') {
                            const baseAngle = typeof mob.prevAngle === 'number' ? mob.prevAngle : mob.angle;
                            const angleDiff = ((mob.targetAngle - baseAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
                            mob.angle = baseAngle + angleDiff * Math.min(1, alpha) * smoothFactor;
                        }
                    } else if (typeof mob.vx === 'number' && typeof mob.vy === 'number') {
                        mob.x += mob.vx * deltaSeconds;
                        mob.y += mob.vy * deltaSeconds;
                    } else if (typeof mob.targetX === 'number' && typeof mob.targetY === 'number') {
                        mob.x += (mob.targetX - mob.x) * smoothFactor;
                        mob.y += (mob.targetY - mob.y) * smoothFactor;
                    }
                    if (this.safeZoneCenter && this.isInSafeZone(mob.x, mob.y)) {
                        const angleAway = Math.atan2(mob.y - this.safeZoneCenter.y, mob.x - this.safeZoneCenter.x);
                        mob.x += Math.cos(angleAway) * 2;
                        mob.y += Math.sin(angleAway) * 2;
                    }
                    return;
                }
                // AI: Move towards player if close enough
                const dx = playerX - mob.x;
                const dy = playerY - mob.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (this.isInSafeZone(playerX, playerY)) {
                    if (this.isInSafeZone(mob.x, mob.y)) {
                        const push = this.safeZoneRadius - dist + 5;
                        if (push > 0) {
                            const angleAway = Math.atan2(mob.y - playerY, mob.x - playerX);
                            mob.x += Math.cos(angleAway) * push * 0.05;
                            mob.y += Math.sin(angleAway) * push * 0.05;
                        }
                    }
                } else if (dist < 300) {
                    // Chase player
                    mob.angle = Math.atan2(dy, dx);
                    mob.x += Math.cos(mob.angle) * mob.speed;
                    mob.y += Math.sin(mob.angle) * mob.speed;
                } else {
                    // Wander randomly
                    if (Math.random() < 0.02) {
                        mob.angle += (Math.random() - 0.5) * 0.5;
                    }
                    mob.x += Math.cos(mob.angle) * mob.speed * 0.3;
                    mob.y += Math.sin(mob.angle) * mob.speed * 0.3;
                }
            });
        }
        
        updateProjectiles(model, deltaTime) {
            this.projectiles = this.projectiles.filter(proj => {
                proj.x += Math.cos(proj.angle) * proj.speed;
                proj.y += Math.sin(proj.angle) * proj.speed;
                proj.distance += proj.speed;
                
                // Remove if traveled too far
                return proj.distance < proj.maxDistance;
            });
        }
        
        updateLoot(model) {
            const playerX = model.userTadpole?.x || 0;
            const playerY = model.userTadpole?.y || 0;
            
            this.lootDrops = this.lootDrops.filter(loot => {
                const dx = playerX - loot.x;
                const dy = playerY - loot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // Pick up loot
                if (dist < 20) {
                    var added = window.GameSystems.inventory.addItem(loot.itemId);
                    if (!added && window.showToast) {
                        window.showToast('Inventaire plein !', 'warning');
                    }
                    return added ? false : true;
                }
                
                // Remove old loot
                if (Date.now() - loot.spawnTime > 30000) {
                    return false;
                }
                
                return true;
            });
        }
        
        checkCollisions(model) {
            const playerX = model.userTadpole?.x || 0;
            const playerY = model.userTadpole?.y || 0;
            const playerSize = model.userTadpole?.size || 4;
            const stats = window.GameSystems.playerStats;
            const gameState = window.GameSystems.gameState;
            const now = Date.now();
            
            if (this.isInSafeZone(playerX, playerY)) {
                return;
            }

            // Check shield
            const isShielded = gameState.shieldUntil && now < gameState.shieldUntil;
            
            // Mob-Player collisions
            this.mobs.forEach(mob => {
                if (mob.serverControlled) {
                    return;
                }
                const dx = playerX - mob.x;
                const dy = playerY - mob.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < playerSize + mob.size && !isShielded) {
                    // Player takes damage
                    if (now - mob.lastAttack > mob.attackCooldown) {
                        mob.lastAttack = now;
                        const damage = stats.takeDamage(mob.damage);
                        if (window.showToast) {
                            window.showToast(`${mob.icon} -${damage} PV !`, 'error');
                        }
                        
                        if (stats.isDead()) {
                            this.playerDied(model);
                        }
                    }
                }
            });
            
            // Projectile-Mob collisions
            this.projectiles.forEach(proj => {
                if (proj.hitMobs) return;
                
                this.mobs.forEach(mob => {
                    if (mob.serverControlled) {
                        if (!proj.hitMobs) {
                            const dx = proj.x - mob.x;
                            const dy = proj.y - mob.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < mob.size + 5) {
                                proj.hitMobs = true;
                                if (window.showToast) {
                                    window.showToast(`${mob.icon} touché !`, 'info');
                                }
                                if (window.app && typeof window.app.sendEliteHit === 'function') {
                                    const damage = proj.damage + stats.attack;
                                    window.app.sendEliteHit(mob.serverId || mob.uniqueId, damage);
                                }
                            }
                        }
                        return;
                    }
                    const dx = proj.x - mob.x;
                    const dy = proj.y - mob.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < mob.size + 5) {
                        // Hit!
                        const damage = proj.damage + stats.attack;
                        mob.hp -= damage;
                        proj.hitMobs = true;
                        
                        if (mob.hp <= 0) {
                            this.mobKilled(mob, model);
                        }
                    }
                });
            });
        }
        
        mobKilled(mob, model) {
            // Remove mob
            this.mobs = this.mobs.filter(m => m.uniqueId !== mob.uniqueId);
            
            // Give XP
            window.GameSystems.playerStats.addXp(mob.xpReward);
            window.GameSystems.playerStats.kills++;
            
            if (mob.type === 'boss') {
                window.GameSystems.playerStats.bossesKilled++;
            }
            
            // Update quests
            window.GameSystems.questManager.updateProgress('kill', mob.id);
            
            // Drop loot
            if (Math.random() < mob.dropChance) {
                const drops = mob.guaranteedDrops || 1;
                for (let i = 0; i < drops; i++) {
                    const itemId = mob.dropTable[Math.floor(Math.random() * mob.dropTable.length)];
                    this.lootDrops.push({
                        x: mob.x + (Math.random() - 0.5) * 20,
                        y: mob.y + (Math.random() - 0.5) * 20,
                        itemId: itemId,
                        spawnTime: Date.now()
                    });
                }
            }
            
            if (window.showToast) {
                window.showToast(`${mob.icon} ${mob.name} vaincu ! +${mob.xpReward} XP`, 'success');
            }
            
            window.GameSystems.playerStats.save();
        }
        
        playerDied(model) {
            window.GameSystems.playerStats.respawn();
            
            // Teleport to safe position
            if (model.userTadpole) {
                if (!this.safeZoneCenter) {
                    this.ensureSafeZone(model);
                }
                const safeCenter = this.safeZoneCenter || { x: 0, y: 0 };
                model.userTadpole.x = safeCenter.x;
                model.userTadpole.y = safeCenter.y;
                model.userTadpole.targetX = safeCenter.x;
                model.userTadpole.targetY = safeCenter.y;
                model.userTadpole.momentum = 0;
                model.userTadpole.targetMomentum = 0;
                model.userTadpole.changed = 2;
            }
            if (window.GameSystems.gameState) {
                window.GameSystems.gameState.shieldUntil = Date.now() + 3000;
            }
            
            if (window.showToast) {
                window.showToast('💀 Tu es mort ! Réapparition...', 'error');
            }
        }
        
        castSpell(spell) {
            if (!window.gameApp || !window.gameApp.model) return;
            
            const model = window.gameApp.model;
            const playerX = model.userTadpole?.x || 0;
            const playerY = model.userTadpole?.y || 0;
            const playerAngle = model.userTadpole?.angle || 0;
            
            const projectile = {
                x: playerX,
                y: playerY,
                angle: playerAngle,
                speed: spell.speed || 10,
                damage: spell.damage,
                distance: 0,
                maxDistance: spell.range,
                spell: spell,
                aoe: spell.aoe || false
            };
            
            this.projectiles.push(projectile);
            
            if (window.showToast) {
                window.showToast(`${spell.icon} ${spell.name} !`, 'info');
            }
        }

        castSpellFromRemote(payload) {
            if (!payload || !payload.spellId) {
                return;
            }
            const spell = ITEMS[payload.spellId];
            if (!spell || spell.type !== 'spell') {
                return;
            }
            const projectile = {
                x: payload.x || 0,
                y: payload.y || 0,
                angle: payload.angle || 0,
                speed: spell.speed || 10,
                damage: spell.damage,
                distance: 0,
                maxDistance: spell.range,
                spell: spell,
                aoe: spell.aoe || false,
                remote: true
            };
            this.projectiles.push(projectile);
        }
        
        draw(context, camera) {
            // Draw mobs
            this.mobs.forEach(mob => {
                this.drawMob(context, mob);
            });
            
            // Draw projectiles
            this.projectiles.forEach(proj => {
                this.drawProjectile(context, proj);
            });
            
            // Draw loot
            this.lootDrops.forEach(loot => {
                this.drawLoot(context, loot);
            });
        }
        
        drawMob(context, mob) {
            const now = Date.now();
            
            const isShark = mob.id === 'shark_mini' || mob.mobType === 'shark_mini';

            if (isShark) {
                const angle = typeof mob.angle === 'number' ? mob.angle : 0;
                context.save();
                context.translate(mob.x, mob.y);
                context.rotate(angle);

                const bodyGradient = context.createRadialGradient(-mob.size * 0.5, -mob.size * 0.3, 2, 0, 0, mob.size * 1.8);
                bodyGradient.addColorStop(0, '#f6fbff');
                bodyGradient.addColorStop(0.35, '#b8d4ff');
                bodyGradient.addColorStop(0.7, '#6f94d6');
                bodyGradient.addColorStop(1, '#365a94');
                context.fillStyle = bodyGradient;
                context.shadowColor = 'rgba(70, 140, 255, 0.35)';
                context.shadowBlur = mob.size * 0.6;
                context.beginPath();
                context.ellipse(0, 0, mob.size * 1.45, mob.size * 0.78, 0, 0, Math.PI * 2);
                context.fill();
                context.shadowBlur = 0;

                // Belly highlight
                context.beginPath();
                context.fillStyle = 'rgba(255, 255, 255, 0.75)';
                context.ellipse(-mob.size * 0.15, mob.size * 0.25, mob.size * 0.75, mob.size * 0.32, 0, 0, Math.PI * 2);
                context.fill();

                // Dorsal fin
                context.beginPath();
                context.fillStyle = 'rgba(80, 120, 185, 0.95)';
                context.moveTo(-mob.size * 0.2, -mob.size * 1.05);
                context.lineTo(mob.size * 0.55, -mob.size * 0.2);
                context.lineTo(-mob.size * 0.7, -mob.size * 0.3);
                context.closePath();
                context.fill();

                // Side fin
                context.beginPath();
                context.fillStyle = 'rgba(60, 95, 160, 0.9)';
                context.moveTo(mob.size * 0.1, mob.size * 0.15);
                context.lineTo(mob.size * 0.55, mob.size * 0.55);
                context.lineTo(mob.size * 0.05, mob.size * 0.45);
                context.closePath();
                context.fill();

                // Tail fin
                context.beginPath();
                const tailGradient = context.createLinearGradient(mob.size * 1.1, 0, mob.size * 2.2, 0);
                tailGradient.addColorStop(0, 'rgba(60, 90, 150, 0.9)');
                tailGradient.addColorStop(1, 'rgba(20, 45, 95, 0.7)');
                context.fillStyle = tailGradient;
                context.moveTo(mob.size * 1.25, 0);
                context.lineTo(mob.size * 2.1, -mob.size * 0.8);
                context.lineTo(mob.size * 1.55, 0);
                context.lineTo(mob.size * 2.1, mob.size * 0.8);
                context.closePath();
                context.fill();

                // Gills
                context.strokeStyle = 'rgba(25, 45, 80, 0.45)';
                context.lineWidth = 1;
                for (let i = 0; i < 3; i += 1) {
                    context.beginPath();
                    context.moveTo(-mob.size * 0.45, -mob.size * 0.25 + i * mob.size * 0.22);
                    context.lineTo(-mob.size * 0.1, -mob.size * 0.15 + i * mob.size * 0.22);
                    context.stroke();
                }

                // Mouth line + teeth
                context.beginPath();
                context.strokeStyle = 'rgba(15, 30, 55, 0.8)';
                context.lineWidth = 1.2;
                context.moveTo(-mob.size * 0.95, mob.size * 0.2);
                context.quadraticCurveTo(-mob.size * 0.6, mob.size * 0.45, -mob.size * 0.2, mob.size * 0.3);
                context.stroke();
                context.fillStyle = 'rgba(245, 250, 255, 0.85)';
                for (let i = 0; i < 4; i += 1) {
                    context.beginPath();
                    context.moveTo(-mob.size * 0.8 + i * mob.size * 0.18, mob.size * 0.23);
                    context.lineTo(-mob.size * 0.74 + i * mob.size * 0.18, mob.size * 0.32);
                    context.lineTo(-mob.size * 0.68 + i * mob.size * 0.18, mob.size * 0.23);
                    context.closePath();
                    context.fill();
                }

                // Eye
                context.beginPath();
                context.fillStyle = '#0b1628';
                context.arc(-mob.size * 0.7, -mob.size * 0.1, mob.size * 0.12, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.fillStyle = '#ffffff';
                context.arc(-mob.size * 0.75, -mob.size * 0.18, mob.size * 0.04, 0, Math.PI * 2);
                context.fill();

                // Nose highlight
                context.beginPath();
                context.fillStyle = 'rgba(255, 255, 255, 0.55)';
                context.ellipse(-mob.size * 1.2, 0, mob.size * 0.16, mob.size * 0.09, 0, 0, Math.PI * 2);
                context.fill();

                context.restore();
            } else {
                // Body
                context.beginPath();
                const gradient = context.createRadialGradient(mob.x - 2, mob.y - 2, 1, mob.x, mob.y, mob.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, mob.color);
                context.fillStyle = gradient;
                context.arc(mob.x, mob.y, mob.size, 0, Math.PI * 2);
                context.fill();
            }
            
            // Health bar
            const hpPercent = mob.hp / mob.maxHp;
            const barWidth = mob.size * 2;
            const barHeight = 3;
            const barY = mob.y - mob.size - 8;
            
            context.fillStyle = '#333';
            context.fillRect(mob.x - barWidth / 2, barY, barWidth, barHeight);
            
            context.fillStyle = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#f44336';
            context.fillRect(mob.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);
            
            // Name
            context.fillStyle = mob.type === 'boss' ? '#ffd700' : '#fff';
            context.font = '8px Arial';
            context.textAlign = 'center';
            context.fillText(mob.name, mob.x, mob.y - mob.size - 12);
            
            // Boss indicator
            if (mob.type === 'boss') {
                const pulse = Math.sin(now * 0.005) * 2;
                context.beginPath();
                context.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                context.lineWidth = 2;
                context.arc(mob.x, mob.y, mob.size + 5 + pulse, 0, Math.PI * 2);
                context.stroke();
            }
        }
        
        drawProjectile(context, proj) {
            context.beginPath();
            const gradient = context.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, 6);
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, proj.spell.icon === '⚡' ? '#ffeb3b' : '#8ce6de');
            context.fillStyle = gradient;
            context.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            context.fill();
        }
        
        drawLoot(context, loot) {
            const now = Date.now();
            const item = ITEMS[loot.itemId];
            if (!item) return;
            
            const pulse = 1 + Math.sin(now * 0.005) * 0.2;
            const float = Math.sin(now * 0.003) * 3;
            
            // Glow
            context.beginPath();
            context.fillStyle = RARITY_COLORS[item.rarity] + '40';
            context.arc(loot.x, loot.y + float, 12 * pulse, 0, Math.PI * 2);
            context.fill();
            
            // Icon background
            context.beginPath();
            context.fillStyle = RARITY_COLORS[item.rarity];
            context.arc(loot.x, loot.y + float, 8, 0, Math.PI * 2);
            context.fill();
            
            // Icon text
            context.fillStyle = '#fff';
            context.font = '10px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(item.icon, loot.x, loot.y + float);
        }
        
        togglePvP() {
            this.pvpEnabled = !this.pvpEnabled;
            if (window.showToast) {
                window.showToast(this.pvpEnabled ? '⚔️ PvP activé !' : '🛡️ PvP désactivé', 'info');
            }
        }
    }

    // ============================================
    // GAME STATE
    // ============================================
    
    const gameState = {
        speedBoostUntil: 0,
        speedMultiplier: 1,
        shieldUntil: 0,
        spell_cooldown_0: 0,
        spell_cooldown_1: 0,
        spell_cooldown_2: 0
    };

    // ============================================
    // INITIALIZE
    // ============================================
    
    const GameSystems = {
        ITEMS,
        MOBS,
        QUESTS,
        RARITY_COLORS,
        playerStats: new PlayerStats(),
        inventory: new Inventory(3),
        questManager: new QuestManager(),
        combat: new CombatSystem(),
        gameState: gameState,
        
        init() {
            console.log('GameSystems initialized');
            
            // Give starter spell if inventory empty
            if (this.inventory.isEmpty()) {
                this.inventory.addItem('spell_bubble');
            }
            
            // Accept first quest if no active quests
            if (this.questManager.activeQuests.length === 0) {
                this.questManager.acceptQuest('quest_collect_orbs');
            }
        },
        
        update(model, deltaTime) {
            this.combat.update(model, deltaTime);
        },
        
        draw(context, camera) {
            this.combat.draw(context, camera);
        }
    };

    // Export globally
    window.GameSystems = GameSystems;

})();
