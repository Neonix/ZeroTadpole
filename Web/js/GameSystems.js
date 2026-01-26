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
        'loot_unknown': {
            id: 'loot_unknown',
            name: 'Butin Mystère',
            icon: '🎁',
            type: 'misc',
            rarity: 'common',
            description: 'Un butin étrange récupéré sur une créature.',
            effect: null,
            dropRate: 0
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
        },

        // Server-authoritative utility spells
        'spell_dash': {
            id: 'spell_dash',
            name: 'Dash',
            icon: '⚡',
            type: 'spell',
            rarity: 'common',
            description: 'Accélération courte (slot R / Espace)',
            cooldown: 5000,
            subtype: 'movement',
            dropRate: 0
        },
        'spell_companion': {
            id: 'spell_companion',
            name: 'Compagnon',
            icon: '🐾',
            type: 'spell',
            rarity: 'uncommon',
            description: 'Commande / attaque spéciale du compagnon (touche B si équipé)',
            cooldown: 4000,
            subtype: 'pet_command',
            dropRate: 0
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
    // BOSS/MOB DATABASE - EXPANDED
    // ============================================
    
    const MOBS = {
        // === TIER 0: TUTORIEL ===
        'training_bubble': {
            id: 'training_bubble',
            name: 'Bulle d\'Entraînement',
            icon: '🫧',
            type: 'training',
            tier: 0,
            hp: 10,
            maxHp: 10,
            damage: 0,
            speed: 0.3,
            size: 5,
            color: '#87CEEB',
            xpReward: 2,
            dropTable: [],
            dropChance: 0,
            spawnWeight: 0,
            passive: true,
            description: 'Une bulle inoffensive pour s\'entraîner.'
        },
        'friendly_fish': {
            id: 'friendly_fish',
            name: 'Poisson Ami',
            icon: '🐠',
            type: 'training',
            tier: 0,
            hp: 15,
            maxHp: 15,
            damage: 0,
            speed: 0.5,
            size: 6,
            color: '#FFD700',
            xpReward: 3,
            dropTable: ['potion_health'],
            dropChance: 0.8,
            spawnWeight: 0,
            passive: true,
            description: 'Un gentil poisson qui laisse tomber des potions.'
        },
        'bubble_fish': {
            id: 'bubble_fish',
            name: 'Poisson Bulle',
            icon: '🐟',
            type: 'mob',
            tier: 0,
            hp: 15,
            maxHp: 15,
            damage: 2,
            speed: 0.8,
            size: 6,
            color: '#ADD8E6',
            xpReward: 5,
            dropTable: ['potion_health'],
            dropChance: 0.5,
            spawnWeight: 0,
            description: 'Un petit poisson bulle légèrement agressif.'
        },
        'baby_crab': {
            id: 'baby_crab',
            name: 'Bébé Crabe',
            icon: '🦀',
            type: 'mob',
            tier: 0,
            hp: 20,
            maxHp: 20,
            damage: 3,
            speed: 0.6,
            size: 5,
            color: '#FF6B6B',
            xpReward: 6,
            dropTable: ['potion_health'],
            dropChance: 0.6,
            spawnWeight: 0,
            description: 'Un petit crabe curieux et pinçant.'
        },
        
        // === TIER 1: CRÉATURES DE BASE ===
        'crab_small': {
            id: 'crab_small',
            name: 'Petit Crabe',
            icon: '🦀',
            type: 'mob',
            tier: 1,
            hp: 30,
            maxHp: 30,
            damage: 5,
            speed: 1.5,
            size: 8,
            color: '#ff6b6b',
            xpReward: 10,
            dropTable: ['potion_health', 'spell_bubble'],
            dropChance: 0.4,
            spawnWeight: 40,
            abilities: [],
            description: 'Un petit crabe des récifs, agressif mais fragile.'
        },
        'jellyfish': {
            id: 'jellyfish',
            name: 'Méduse',
            icon: '🪼',
            type: 'mob',
            tier: 1,
            hp: 50,
            maxHp: 50,
            damage: 10,
            speed: 1,
            size: 10,
            color: '#ff9eea',
            xpReward: 20,
            dropTable: ['potion_health', 'potion_speed', 'spell_wave'],
            dropChance: 0.5,
            spawnWeight: 30,
            abilities: ['poison_touch'],
            description: 'Une méduse bioluminescente aux tentacules venimeuses.'
        },
        
        // === TIER 2: CRÉATURES DANGEREUSES ===
        'crab_giant': {
            id: 'crab_giant',
            name: 'Crabe Géant',
            icon: '🦞',
            type: 'mob',
            tier: 2,
            hp: 80,
            maxHp: 80,
            damage: 12,
            speed: 1.2,
            size: 14,
            color: '#cc4444',
            xpReward: 40,
            dropTable: ['potion_health', 'potion_health_large', 'shield_bubble'],
            dropChance: 0.5,
            spawnWeight: 20,
            abilities: ['shell_block'],
            minPlayerLevel: 3,
            description: 'Une version massive et blindée du crabe commun.'
        },
        'electric_eel': {
            id: 'electric_eel',
            name: 'Anguille Électrique',
            icon: '⚡',
            type: 'mob',
            tier: 2,
            hp: 60,
            maxHp: 60,
            damage: 18,
            speed: 2.2,
            size: 12,
            color: '#ffeb3b',
            xpReward: 35,
            dropTable: ['spell_lightning', 'potion_speed'],
            dropChance: 0.45,
            spawnWeight: 15,
            abilities: ['electric_shock'],
            minPlayerLevel: 4,
            description: 'Une anguille rapide qui génère des décharges électriques.'
        },
        
        // === TIER 3: ÉLITES ===
        'shark_mini': {
            id: 'shark_mini',
            name: 'Requin Juvenile',
            icon: '🦈',
            type: 'elite',
            tier: 3,
            hp: 150,
            maxHp: 150,
            damage: 20,
            speed: 2.0,
            size: 18,
            color: '#6b8cff',
            xpReward: 80,
            dropTable: ['potion_health_large', 'spell_lightning', 'shield_bubble'],
            dropChance: 0.75,
            spawnWeight: 10,
            abilities: ['charge', 'bite'],
            minPlayerLevel: 6,
            description: 'Un jeune requin féroce qui chasse en eaux troubles.'
        },
        'manta_ray': {
            id: 'manta_ray',
            name: 'Raie Manta Sombre',
            icon: '🐋',
            type: 'elite',
            tier: 3,
            hp: 120,
            maxHp: 120,
            damage: 15,
            speed: 1.8,
            size: 22,
            color: '#1a1a2e',
            xpReward: 70,
            dropTable: ['spell_wave', 'spell_vortex', 'potion_speed'],
            dropChance: 0.7,
            spawnWeight: 8,
            abilities: ['wing_sweep', 'shadow_dive'],
            minPlayerLevel: 7,
            description: 'Une majestueuse raie des abysses aux pouvoirs obscurs.'
        },
        
        // === TIER 4: BOSS ===
        'octopus_boss': {
            id: 'octopus_boss',
            name: 'Poulpe Ancien',
            icon: '🐙',
            type: 'boss',
            tier: 4,
            hp: 500,
            maxHp: 500,
            damage: 35,
            speed: 1.3,
            size: 30,
            color: '#9b59b6',
            xpReward: 300,
            dropTable: ['spell_vortex', 'spell_heal', 'shield_bubble'],
            dropChance: 1.0,
            guaranteedDrops: 2,
            spawnWeight: 3,
            abilities: ['ink_cloud', 'tentacle_whip', 'regenerate'],
            minPlayerLevel: 10,
            description: 'Un ancien gardien des profondeurs, sage et impitoyable.',
            phases: [
                { hpPercent: 1.0, abilities: ['tentacle_whip'] },
                { hpPercent: 0.6, abilities: ['tentacle_whip', 'ink_cloud'] },
                { hpPercent: 0.3, abilities: ['tentacle_whip', 'ink_cloud', 'regenerate'] }
            ]
        },
        'leviathan': {
            id: 'leviathan',
            name: 'Léviathan',
            icon: '🐉',
            type: 'boss',
            tier: 5,
            hp: 1000,
            maxHp: 1000,
            damage: 60,
            speed: 1.8,
            size: 45,
            color: '#e74c3c',
            xpReward: 750,
            dropTable: ['spell_vortex', 'spell_heal', 'spell_lightning'],
            dropChance: 1.0,
            guaranteedDrops: 3,
            spawnWeight: 1,
            abilities: ['flame_breath', 'tail_sweep', 'summon_minions', 'enrage'],
            minPlayerLevel: 15,
            description: 'La terreur ultime des océans, une créature de légende.',
            phases: [
                { hpPercent: 1.0, abilities: ['flame_breath'] },
                { hpPercent: 0.7, abilities: ['flame_breath', 'tail_sweep'] },
                { hpPercent: 0.4, abilities: ['flame_breath', 'tail_sweep', 'summon_minions'] },
                { hpPercent: 0.2, abilities: ['flame_breath', 'tail_sweep', 'summon_minions', 'enrage'] }
            ]
        },
        
        // === BOSS SPÉCIAUX (Événements) ===
        'kraken': {
            id: 'kraken',
            name: 'Kraken Primordial',
            icon: '🦑',
            type: 'boss',
            tier: 5,
            hp: 800,
            maxHp: 800,
            damage: 50,
            speed: 1.5,
            size: 40,
            color: '#2c3e50',
            xpReward: 600,
            dropTable: ['spell_vortex', 'spell_heal', 'spell_lightning', 'shield_bubble'],
            dropChance: 1.0,
            guaranteedDrops: 2,
            spawnWeight: 0, // Event only
            abilities: ['tentacle_storm', 'whirlpool', 'crush'],
            minPlayerLevel: 12,
            description: 'Un monstre légendaire sorti des cauchemars des marins.'
        }
    };

    // ============================================
    // QUESTS DATABASE - EXPANDED
    // ============================================
    
    const QUESTS = {
        // === TIER 1: DÉBUTANT ===
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
            difficulty: 'easy',
            tier: 1
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
            difficulty: 'easy',
            tier: 1
        },
        'quest_first_steps': {
            id: 'quest_first_steps',
            name: 'Premiers Pas',
            icon: '👣',
            description: 'Explore le monde et parcours {target} mètres',
            type: 'distance',
            targetAmount: 500,
            rewards: { xp: 75, gems: 1 },
            repeatable: false,
            difficulty: 'easy',
            tier: 1
        },
        
        // === TIER 2: INTERMÉDIAIRE ===
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
            difficulty: 'medium',
            tier: 2,
            requiredLevel: 3
        },
        'quest_combo_master': {
            id: 'quest_combo_master',
            name: 'Maître du Combo',
            icon: '🔥',
            description: 'Atteins un combo de {target}',
            type: 'combo',
            targetAmount: 10,
            rewards: { xp: 200, gems: 5 },
            repeatable: true,
            difficulty: 'medium',
            tier: 2,
            requiredLevel: 5
        },
        'quest_survivor': {
            id: 'quest_survivor',
            name: 'Survivant',
            icon: '💪',
            description: 'Reste en vie pendant {target} secondes hors de la zone sûre',
            type: 'survive',
            targetAmount: 120,
            rewards: { xp: 250, gems: 4, item: 'potion_health_large' },
            repeatable: true,
            difficulty: 'medium',
            tier: 2,
            requiredLevel: 4
        },
        'quest_treasure_hunter': {
            id: 'quest_treasure_hunter',
            name: 'Chasseur de Trésors',
            icon: '💎',
            description: 'Ramasse {target} objets rares ou mieux',
            type: 'loot_quality',
            targetType: 'rare',
            targetAmount: 5,
            rewards: { xp: 300, gems: 8 },
            repeatable: true,
            difficulty: 'medium',
            tier: 2,
            requiredLevel: 5
        },
        
        // === TIER 3: AVANCÉ ===
        'quest_shark_hunter': {
            id: 'quest_shark_hunter',
            name: 'Chasseur de Requins',
            icon: '🦈',
            description: 'Élimine {target} requins juvéniles',
            type: 'kill',
            targetType: 'shark_mini',
            targetAmount: 3,
            rewards: { xp: 400, gems: 10, item: 'spell_lightning' },
            repeatable: true,
            difficulty: 'hard',
            tier: 3,
            requiredLevel: 8
        },
        'quest_explore': {
            id: 'quest_explore',
            name: 'Grand Explorateur',
            icon: '🗺️',
            description: 'Parcours {target} mètres au total',
            type: 'distance',
            targetAmount: 5000,
            rewards: { xp: 500, gems: 10 },
            repeatable: true,
            difficulty: 'hard',
            tier: 3,
            requiredLevel: 7
        },
        'quest_elite_slayer': {
            id: 'quest_elite_slayer',
            name: 'Tueur d\'Élite',
            icon: '⚔️',
            description: 'Vaincs {target} monstres élites',
            type: 'kill_type',
            targetType: 'elite',
            targetAmount: 5,
            rewards: { xp: 600, gems: 15, item: 'shield_bubble' },
            repeatable: true,
            difficulty: 'hard',
            tier: 3,
            requiredLevel: 10
        },
        
        // === TIER 4: BOSS ===
        'quest_boss_octopus': {
            id: 'quest_boss_octopus',
            name: 'Le Poulpe Ancien',
            icon: '🐙',
            description: 'Défais le Poulpe Ancien',
            type: 'kill',
            targetType: 'octopus_boss',
            targetAmount: 1,
            rewards: { xp: 1000, gems: 25, item: 'spell_vortex' },
            repeatable: false,
            difficulty: 'boss',
            tier: 4,
            requiredLevel: 12
        },
        'quest_boss_leviathan': {
            id: 'quest_boss_leviathan',
            name: 'Terreur des Profondeurs',
            icon: '🐉',
            description: 'Terrasse le Léviathan',
            type: 'kill',
            targetType: 'leviathan',
            targetAmount: 1,
            rewards: { xp: 2500, gems: 50, item: 'spell_heal' },
            repeatable: false,
            difficulty: 'legendary',
            tier: 4,
            requiredLevel: 15
        },
        
        // === QUÊTES SOCIALES ===
        'quest_social': {
            id: 'quest_social',
            name: 'Têtard Social',
            icon: '💬',
            description: 'Envoie {target} messages dans le chat',
            type: 'chat',
            targetAmount: 5,
            rewards: { xp: 30, gems: 1 },
            repeatable: true,
            difficulty: 'easy',
            tier: 1
        },
        'quest_pvp': {
            id: 'quest_pvp',
            name: 'Gladiateur',
            icon: '⚔️',
            description: 'Gagne {target} combats PvP',
            type: 'pvp_win',
            targetAmount: 3,
            rewards: { xp: 400, gems: 10, item: 'spell_lightning' },
            repeatable: true,
            difficulty: 'hard',
            tier: 3,
            requiredLevel: 10
        },
        
        // === QUÊTES QUOTIDIENNES ===
        'quest_daily_kills': {
            id: 'quest_daily_kills',
            name: 'Quota Quotidien',
            icon: '📅',
            description: 'Élimine {target} créatures aujourd\'hui',
            type: 'kill_any',
            targetAmount: 20,
            rewards: { xp: 300, gems: 5 },
            repeatable: true,
            difficulty: 'medium',
            tier: 2,
            daily: true
        },
        'quest_daily_collect': {
            id: 'quest_daily_collect',
            name: 'Collecte du Jour',
            icon: '📦',
            description: 'Ramasse {target} objets',
            type: 'collect_any',
            targetAmount: 15,
            rewards: { xp: 200, gems: 3 },
            repeatable: true,
            difficulty: 'easy',
            tier: 1,
            daily: true
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
        constructor(slots = 4) {
            // Hotbar is 4 slots (A/Z/E/R)
            this.hotbarSlots = 4;
            // Server inventory can be larger
            this.maxSlots = 20;
            this.slots = Array(this.maxSlots).fill(null);
            this.gems = 0;
            this.gold = 0;
            this._serverMode = false;
            this._lastFullToastAt = 0;

            // Legacy local inventory fallback (offline / no server sync yet)
            this._legacyMaxSlots = slots;
            this.items = Array(slots).fill(null);
            this.loadLegacy();
        }

        loadLegacy() {
            try {
                const saved = localStorage.getItem('tadpole_inventory');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        this.items = parsed;
                    }
                }
            } catch (e) {}
            while (this.items.length < this._legacyMaxSlots) this.items.push(null);
        }

        saveLegacy() {
            try {
                localStorage.setItem('tadpole_inventory', JSON.stringify(this.items));
            } catch (e) {}
        }

        updateUI() {
            // HUD is updated in game.js loop; keep method for WebSocketService compatibility
        }

        // Called when server sends inventory_sync
        setServerInventory(slots, gems, gold, maxSlots) {
            if (Array.isArray(slots)) {
                this.slots = slots;
            }
            if (typeof maxSlots === 'number') {
                this.maxSlots = maxSlots;
                if (!Array.isArray(this.slots) || this.slots.length !== maxSlots) {
                    const next = Array(maxSlots).fill(null);
                    for (let i = 0; i < Math.min(maxSlots, (this.slots || []).length); i++) next[i] = this.slots[i];
                    this.slots = next;
                }
            }
            if (typeof gems === 'number') this.gems = gems;
            if (typeof gold === 'number') this.gold = gold;
            this._serverMode = true;
        }

        _toastOncePer(msg, type, ms) {
            const now = Date.now();
            if (now - this._lastFullToastAt < ms) return;
            this._lastFullToastAt = now;
            window.showToast && window.showToast(msg, type);
        }

        // Hotbar: prefer equipped spells, else use inventory slot
        getItem(slotIndex) {
            if (slotIndex < 0 || slotIndex >= this.hotbarSlots) return null;

            const spells = window.GameSystems && window.GameSystems.equippedSpells;
            if (Array.isArray(spells) && spells[slotIndex]) {
                const s = spells[slotIndex];
                const sid = s.id || s.itemId || s.spellId;
                return ITEMS[sid] || s;
            }

            if (this._serverMode) {
                const slot = this.slots[slotIndex] || null;
                if (!slot) return null;
                const itemId = slot.itemId || slot.id;
                const def = ITEMS[itemId] || {};
                // Merge server-enriched data into local def
                return Object.assign({ id: itemId }, def, slot);
            }

            const itemId = this.items[slotIndex];
            return itemId ? ITEMS[itemId] : null;
        }

        isFull() {
            if (this._serverMode) {
                return (this.slots || []).every(s => s !== null);
            }
            return this.items.every(slot => slot !== null);
        }

        isEmpty() {
            if (this._serverMode) {
                return (this.slots || []).every(s => s === null);
            }
            return this.items.every(slot => slot === null);
        }

        addItem(itemId) {
            // In server mode, inventory is authoritative and items are added via loot_pickup + inventory_sync
            if (this._serverMode) {
                return false;
            }

            const item = ITEMS[itemId];
            if (!item) return false;

            const emptySlot = this.items.findIndex(slot => slot === null);
            if (emptySlot === -1) {
                this._toastOncePer('Inventaire plein !', 'warning', 1500);
                return false;
            }

            this.items[emptySlot] = itemId;
            this.saveLegacy();
            window.showToast && window.showToast(`${item.icon} ${item.name} obtenu !`, 'success');
            return true;
        }

        dropItem(slotIndex, model) {
            // Server authoritative drop
            if (this._serverMode && window.webSocketService && window.webSocketService.sendInventoryDrop) {
                window.webSocketService.sendInventoryDrop(slotIndex);
                return true;
            }

            // Legacy
            if (!window.GameSystems || !window.GameSystems.combat) return false;
            const itemId = this.removeItem(slotIndex);
            if (!itemId) return false;
            return window.GameSystems.combat.dropItem(itemId, model);
        }

        removeItem(slotIndex) {
            if (slotIndex < 0 || slotIndex >= this._legacyMaxSlots) return null;
            const itemId = this.items[slotIndex];
            this.items[slotIndex] = null;
            this.saveLegacy();
            return itemId;
        }

        useItem(slotIndex, playerStats, gameState) {
            // If spell is equipped in this hotbar slot, cast it
            const spells = window.GameSystems && window.GameSystems.equippedSpells;
            if (Array.isArray(spells) && spells[slotIndex]) {
                return this.castEquippedSpell(slotIndex, gameState);
            }

            // Otherwise, use server inventory item in the same index (first 3 slots)
            if (this._serverMode) {
                if (window.webSocketService && window.webSocketService.sendInventoryUse) {
                    window.webSocketService.sendInventoryUse(slotIndex);
                    return true;
                }
                return false;
            }

            // Legacy local use
            const item = this.getItem(slotIndex);
            if (!item) return false;

            if (item.type === 'consumable') {
                this.applyEffect(item.effect, playerStats, gameState);
                this.removeItem(slotIndex);
                window.showToast && window.showToast(`${item.icon} ${item.name} utilisé !`, 'info');
                return true;
            } else if (item.type === 'spell') {
                return this.castLegacySpell(item, slotIndex, gameState);
            }
            return false;
        }

        castEquippedSpell(slotIndex, gameState) {
            const spells = window.GameSystems && window.GameSystems.equippedSpells;
            const s = Array.isArray(spells) ? spells[slotIndex] : null;
            const spellId = s && (s.id || s.itemId || s.spellId);
            const spell = (spellId && ITEMS[spellId]) ? ITEMS[spellId] : s;
            if (!spell) return false;

            const now = Date.now();
            const cooldownKey = `spell_cooldown_${slotIndex}`;
            if (gameState && gameState[cooldownKey] && now < gameState[cooldownKey]) {
                const remaining = Math.ceil((gameState[cooldownKey] - now) / 1000);
                // Throttle per slot (holding key down shouldn't flood)
                window.showToast && window.showToast(`Recharge: ${remaining}s`, 'warning', { slot: slotIndex });
                return false;
            }
            if (gameState && spell.cooldown) {
                gameState[cooldownKey] = now + spell.cooldown;
            }

            // Local cast for responsiveness
            if (spell.heal) {
                window.GameSystems && window.GameSystems.playerStats && window.GameSystems.playerStats.heal(spell.heal);
            } else if (window.GameSystems && window.GameSystems.combat) {
                window.GameSystems.combat.castSpell(spell);
                window.GameSystems.combat._lastLocalSpellCastAt = now;
                window.GameSystems.combat._lastLocalSpellId = spell.id || spellId;
            }

            // Send to server so other players see it + server cooldown is enforced
            if (window.webSocketService && window.webSocketService.sendSpellCast) {
                const model = window.gameApp && window.gameApp.model;
                const player = model && model.userTadpole;
                const angle = player ? (player.angle || 0) : 0;
                // Use inputState target if available; otherwise aim forward
                let tx = (window.inputState && typeof window.inputState.targetX === 'number') ? window.inputState.targetX : null;
                let ty = (window.inputState && typeof window.inputState.targetY === 'number') ? window.inputState.targetY : null;
                if (tx === null || ty === null) {
                    const px = player ? player.x : 0;
                    const py = player ? player.y : 0;
                    tx = px + Math.cos(angle) * (spell.range || 200);
                    ty = py + Math.sin(angle) * (spell.range || 200);
                }
                window.webSocketService.sendSpellCast(slotIndex, tx, ty);
            }

            return true;
        }

        castLegacySpell(spell, slotIndex, gameState) {
            // Old local-only spell casting
            const now = Date.now();
            const cooldownKey = `spell_cooldown_${slotIndex}`;
            if (gameState[cooldownKey] && now < gameState[cooldownKey]) {
                const remaining = Math.ceil((gameState[cooldownKey] - now) / 1000);
                window.showToast && window.showToast(`Recharge: ${remaining}s`, 'warning', { slot: slotIndex });
                return false;
            }
            gameState[cooldownKey] = now + spell.cooldown;
            if (spell.heal) {
                window.GameSystems.playerStats.heal(spell.heal);
                window.showToast && window.showToast(`${spell.icon} +${spell.heal} PV !`, 'success');
                return true;
            }
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
            this.spellImpacts = [];
            this.deathAnimations = []; // NEW: Death animations
            this.damageNumbers = []; // NEW: Floating damage numbers
            this.pvpEnabled = false;
            this.lastMobSpawn = 0;
            this.mobSpawnInterval = 4000; // Faster spawns
            this.maxMobs = 15; // More mobs
            this.safeZoneCenter = null;
            this.safeZoneRadius = 320;
            this.serverControlledMobIds = new Set([
                'crab_small', 'jellyfish', 'crab_giant', 'electric_eel',
                'shark_mini', 'manta_ray', 'octopus_boss', 'kraken', 'leviathan'
            ]);
            this.difficultyMultiplier = 1.0; // Scales with player level
            this.comboCounter = 0;
            this.comboTimer = 0;
            this.comboMultiplier = 1.0;

            // Hover / UI helpers
            this.hoveredMobId = null;
        }

        /**
         * Updates which mob is currently hovered by the cursor.
         * Returns true if a mob is hovered.
         */
        updateHover(worldX, worldY) {
            if (!this.mobs || this.mobs.length === 0) {
                this.hoveredMobId = null;
                return false;
            }

            let best = null;
            let bestD2 = Infinity;

            for (let i = 0; i < this.mobs.length; i++) {
                const mob = this.mobs[i];
                if (!mob) continue;
                const r = (mob.size || 12) + 10; // forgiving hit box for UI hover
                const dx = (mob.x || 0) - worldX;
                const dy = (mob.y || 0) - worldY;
                const d2 = dx * dx + dy * dy;
                if (d2 <= r * r && d2 < bestD2) {
                    best = mob;
                    bestD2 = d2;
                }
            }

            this.hoveredMobId = best ? best.uniqueId : null;
            return !!best;
        }
        
        // Death animation types based on mob
        getDeathAnimation(mobType) {
            const animations = {
                'crab_small': 'explode',
                'jellyfish': 'dissolve',
                'shark_mini': 'sink',
                'octopus_boss': 'ink_explosion',
                'leviathan': 'fire_burst'
            };
            return animations[mobType] || 'dissolve';
        }
        
        // Create death animation
        createDeathAnimation(mob) {
            const animType = this.getDeathAnimation(mob.id || mob.mobType);
            const particles = [];
            const particleCount = mob.type === 'boss' ? 50 : mob.type === 'elite' ? 30 : 15;
            
            for (let i = 0; i < particleCount; i++) {
                const angle = (i / particleCount) * Math.PI * 2;
                const speed = 1 + Math.random() * 3;
                particles.push({
                    x: mob.x,
                    y: mob.y,
                    vx: Math.cos(angle) * speed * (0.5 + Math.random()),
                    vy: Math.sin(angle) * speed * (0.5 + Math.random()),
                    size: mob.size * (0.1 + Math.random() * 0.2),
                    color: mob.color || '#fff',
                    alpha: 1,
                    life: 1
                });
            }
            
            this.deathAnimations.push({
                type: animType,
                x: mob.x,
                y: mob.y,
                particles: particles,
                startTime: Date.now(),
                duration: mob.type === 'boss' ? 2000 : 1000,
                mobType: mob.id || mob.mobType,
                mobSize: mob.size
            });
        }
        
        // Create floating damage number
        createDamageNumber(x, y, damage, isCrit = false) {
            this.damageNumbers.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y - 10,
                damage: damage,
                isCrit: isCrit,
                startTime: Date.now(),
                duration: 1000,
                vy: -2
            });
        }
        
        // Update combo system
        updateCombo() {
            if (Date.now() - this.comboTimer > 3000) {
                if (this.comboCounter > 5) {
                    window.showToast?.(`🔥 Combo x${this.comboCounter} terminé!`, 'info');
                }
                this.comboCounter = 0;
                this.comboMultiplier = 1.0;
            }
        }
        
        addCombo() {
            this.comboCounter++;
            this.comboTimer = Date.now();
            this.comboMultiplier = 1 + (this.comboCounter * 0.1);
            if (this.comboCounter === 5) {
                window.showToast?.('🔥 Combo x5!', 'success');
            } else if (this.comboCounter === 10) {
                window.showToast?.('💥 MEGA COMBO x10!', 'success');
            }
        }
        
        update(model, deltaTime) {
            this.ensureSafeZone(model);
            this.updateMobs(model, deltaTime);
            this.updateProjectiles(model, deltaTime);
            this.updateSpellImpacts();
            this.updateLoot(model);
            this.updateDeathAnimations(); // NEW
            this.updateDamageNumbers(); // NEW
            this.updateCombo(); // NEW
            this.updateDifficulty(); // NEW
            if (!this.isInSafeZone(model.userTadpole?.x || 0, model.userTadpole?.y || 0)) {
                this.spawnMobs(model);
            }
            this.checkCollisions(model);
        }
        
        // Update death animations
        updateDeathAnimations() {
            const now = Date.now();
            this.deathAnimations = this.deathAnimations.filter(anim => {
                const elapsed = now - anim.startTime;
                const progress = elapsed / anim.duration;
                
                if (progress >= 1) return false;
                
                // Update particles
                anim.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // Apply effects based on animation type
                    if (anim.type === 'sink') {
                        p.vy += 0.1; // Gravity
                        p.alpha = 1 - progress;
                    } else if (anim.type === 'dissolve' || anim.type === 'ink_explosion') {
                        p.alpha = 1 - progress;
                        p.size *= 0.98;
                    } else if (anim.type === 'fire_burst') {
                        p.vy -= 0.05; // Rise
                        p.alpha = 1 - progress;
                        p.size *= 0.95;
                    } else {
                        p.alpha = 1 - progress;
                    }
                    
                    p.life = 1 - progress;
                });
                
                return true;
            });
        }
        
        // Update floating damage numbers
        updateDamageNumbers() {
            const now = Date.now();
            this.damageNumbers = this.damageNumbers.filter(dmg => {
                const elapsed = now - dmg.startTime;
                if (elapsed >= dmg.duration) return false;
                
                dmg.y += dmg.vy;
                dmg.vy *= 0.95; // Slow down
                return true;
            });
        }
        
        // Update difficulty based on player level
        updateDifficulty() {
            const playerLevel = window.GameSystems?.playerStats?.level || 1;
            this.difficultyMultiplier = 1 + (playerLevel - 1) * 0.1;
            
            // Adjust mob spawn rate based on level
            this.mobSpawnInterval = Math.max(2000, 4000 - (playerLevel * 100));
            this.maxMobs = Math.min(25, 15 + Math.floor(playerLevel / 2));
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
            // Si le serveur contrôle les mobs, ne pas spawner localement
            if (this.mobs.some(m => m.serverControlled)) {
                return; // Le serveur gère tout
            }
            
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
                if (proj.stop) {
                    return false;
                }
                proj.x += Math.cos(proj.angle) * proj.speed;
                proj.y += Math.sin(proj.angle) * proj.speed;
                proj.distance += proj.speed;
                
                // Remove if traveled too far
                return proj.distance < proj.maxDistance;
            });
        }

        updateSpellImpacts() {
            const now = Date.now();
            this.spellImpacts = this.spellImpacts.filter(impact => now - impact.spawnTime < impact.duration);
        }

        updateLoot(model) {
            const playerX = model.userTadpole?.x || 0;
            const playerY = model.userTadpole?.y || 0;
            const now = Date.now();

            // Don't attempt pickup while dead (prevents spam/desync)
            if (window.inputState && window.inputState.isDead) {
                return;
            }

            this.lootDrops = this.lootDrops.filter(loot => {
                const dx = playerX - loot.x;
                const dy = playerY - loot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Pick up loot (server authoritative)
                if (dist < 20) {
                    // If we recently got an inventory-full error, don't spam pickup
                    if (this._invFullUntil && now < this._invFullUntil) {
                        return true;
                    }

                    if (loot.serverId && window.webSocketService && window.webSocketService.sendLootPickup) {
                        this._lootPickupLast = this._lootPickupLast || {};
                        const last = this._lootPickupLast[loot.serverId] || 0;
                        // Throttle per-loot to avoid spamming the server
                        if (now - last > 800) {
                            this._lootPickupLast[loot.serverId] = now;
                            window.webSocketService.sendLootPickup(loot.serverId);
                        }
                        // Wait for server confirmation (loot_pickup / loot_expired)
                        return true;
                    }

                    // Legacy/local loot fallback (offline/dev)
                    const added = window.GameSystems?.inventory?.addItem ? window.GameSystems.inventory.addItem(loot.itemId) : false;
                    if (!added) {
                        // Toast is throttled inside inventory.addItem
                        return true;
                    }
                    return false;
                }

                // Remove old loot
                const spawnedAt = loot.spawnTime || loot.time || 0;
                if (spawnedAt && (now - spawnedAt) > 30000) {
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
                            const hitRadius = mob.size + (proj.aoe ? 20 : 5);
                            if (dist < hitRadius) {
                                proj.hitMobs = true;
                                proj.stop = true;
                                proj.distance = proj.maxDistance;
                                this.registerSpellImpact(proj.x, proj.y, proj.spell, mob);
                                if (!proj.remote && window.app && typeof window.app.sendEliteHit === 'function') {
                                    const damage = proj.damage + stats.attack;
                                    window.app.sendEliteHit(mob.serverId || mob.uniqueId, damage);
                                    if (typeof mob.hp === 'number') {
                                        mob.hp = Math.max(0, mob.hp - damage);
                                    }
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
                        proj.stop = true;
                        proj.distance = proj.maxDistance;
                        this.registerSpellImpact(proj.x, proj.y, proj.spell, mob);
                        
                        if (mob.hp <= 0) {
                            this.mobKilled(mob, model);
                        }
                    }
                });
            });
        }

        registerSpellImpact(x, y, spell, mob) {
            const spellIcon = spell?.icon;
            let color = '#8ce6de';
            if (spellIcon === '⚡') {
                color = '#ffe066';
            } else if (spellIcon === '🌀') {
                color = '#b28dff';
            } else if (spellIcon === '🌊') {
                color = '#7fd7ff';
            } else if (spellIcon === '🫧') {
                color = '#b9f0ff';
            }
            this.spellImpacts.push({
                x,
                y,
                color,
                spawnTime: Date.now(),
                duration: 350,
                baseRadius: mob?.size ? Math.max(10, mob.size * 0.6) : 12,
                spread: mob?.size ? mob.size * 0.8 : 16
            });
        }

        createSeededRng(seed) {
            let h = 2166136261;
            const str = String(seed);
            for (let i = 0; i < str.length; i += 1) {
                h ^= str.charCodeAt(i);
                h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
            }
            return function() {
                h += 0x6D2B79F5;
                let t = Math.imul(h ^ (h >>> 15), 1 | h);
                t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        handleEliteMobDefeat(mob) {
            if (!mob || mob.hasDroppedLoot) {
                return;
            }
            mob.hasDroppedLoot = true;
            if (!mob.dropTable || mob.dropTable.length === 0) {
                return;
            }
            const rng = this.createSeededRng(mob.serverId || mob.uniqueId || mob.id || mob.mobType || `${mob.x}-${mob.y}`);
            const dropChance = typeof mob.dropChance === 'number' ? mob.dropChance : 0;
            if (rng() > dropChance) {
                return;
            }
            const drops = mob.guaranteedDrops || 1;
            for (let i = 0; i < drops; i += 1) {
                const itemId = mob.dropTable[Math.floor(rng() * mob.dropTable.length)];
                this.lootDrops.push({
                    id: `${mob.serverId || mob.uniqueId || mob.id || 'elite'}-${i}`,
                    x: mob.x + (rng() - 0.5) * 20,
                    y: mob.y + (rng() - 0.5) * 20,
                    itemId: itemId,
                    spawnTime: Date.now()
                });
            }
        }
        
        mobKilled(mob, model) {
            // Create death animation BEFORE removing mob
            this.createDeathAnimation(mob);
            
            // Create damage number for XP
            this.createDamageNumber(mob.x, mob.y - mob.size, `+${mob.xpReward} XP`, true);
            
            // Add combo
            this.addCombo();
            
            // Calculate XP with combo multiplier
            const xpGained = Math.floor(mob.xpReward * this.comboMultiplier);
            
            // Remove mob
            this.mobs = this.mobs.filter(m => m.uniqueId !== mob.uniqueId);
            
            // Give XP with combo bonus
            window.GameSystems.playerStats.addXp(xpGained);
            window.GameSystems.playerStats.kills++;
            
            if (mob.type === 'boss') {
                window.GameSystems.playerStats.bossesKilled++;
                // Boss kill celebration
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.createDamageNumber(
                            mob.x + (Math.random() - 0.5) * 50,
                            mob.y + (Math.random() - 0.5) * 50,
                            '⭐', true
                        );
                    }, i * 200);
                }
            }
            
            // Update quests
            window.GameSystems.questManager.updateProgress('kill', mob.id);
            
            // Drop loot with better chances for combos
            const dropChanceBonus = Math.min(this.comboCounter * 0.02, 0.2);
            if (Math.random() < (mob.dropChance + dropChanceBonus)) {
                const drops = mob.guaranteedDrops || 1;
                for (let i = 0; i < drops; i++) {
                    const itemId = mob.dropTable[Math.floor(Math.random() * mob.dropTable.length)];
                    const item = ITEMS[itemId];
                    
                    // Animate loot spawn
                    const lootAngle = (i / drops) * Math.PI * 2;
                    const lootDist = 15 + Math.random() * 15;
                    this.lootDrops.push({
                        x: mob.x + Math.cos(lootAngle) * lootDist,
                        y: mob.y + Math.sin(lootAngle) * lootDist,
                        itemId: itemId,
                        spawnTime: Date.now(),
                        bouncePhase: 1, // For bounce animation
                        initialY: mob.y + Math.sin(lootAngle) * lootDist - 20
                    });
                    
                    // Show loot toast for rare+ items
                    if (item && (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary')) {
                        window.showToast?.(`✨ ${item.icon} ${item.name} trouvé!`, 'success');
                    }
                }
            }
            
            // Show kill message with combo
            if (window.showToast) {
                let message = `${mob.icon || '💀'} ${mob.name} vaincu ! +${xpGained} XP`;
                if (this.comboCounter > 1) {
                    message += ` (x${this.comboCounter} combo)`;
                }
                window.showToast(message, 'success');
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

        // Alias for WebSocketService handler
        handleRemoteSpell(spellData) {
            if (!spellData) return;
            // Calculate angle from caster to target
            const dx = spellData.targetX - spellData.x;
            const dy = spellData.targetY - spellData.y;
            const angle = Math.atan2(dy, dx);
            
            this.castSpellFromRemote({
                spellId: spellData.spellId,
                x: spellData.x,
                y: spellData.y,
                angle: angle
            });
        }

        // Try to pick up nearby loot (called from client controls)
        tryPickupLoot(model) {
            if (!model || !model.userTadpole) return;
            const playerX = model.userTadpole.x;
            const playerY = model.userTadpole.y;
            const pickupRange = 40;
            
            for (const loot of this.lootDrops) {
                const dx = loot.x - playerX;
                const dy = loot.y - playerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < pickupRange) {
                    // Send pickup request to server
                    if (loot.serverId && window.webSocketService) {
                        window.webSocketService.sendLootPickup(loot.serverId);
                    } else if (loot.id) {
                        // Local loot (fallback)
                        this.pickupLocalLoot(loot);
                    }
                    break; // Only pick up one at a time
                }
            }
        }

        pickupLocalLoot(loot) {
            if (!loot) return;
            const idx = this.lootDrops.findIndex(l => l.id === loot.id || l.serverId === loot.serverId);
            if (idx !== -1) {
                this.lootDrops.splice(idx, 1);
                if (window.GameSystems && window.GameSystems.inventory) {
                    window.GameSystems.inventory.addItem(loot.itemId);
                }
            }
        }
        
        draw(context, camera) {
            // Draw death animations FIRST (behind everything)
            this.deathAnimations.forEach(anim => {
                this.drawDeathAnimation(context, anim);
            });
            
            // Draw mobs
            this.mobs.forEach(mob => {
                this.drawMob(context, mob);
            });
            
            // Draw projectiles
            this.projectiles.forEach(proj => {
                if (proj.stop) {
                    return;
                }
                this.drawProjectile(context, proj);
            });

            // Draw spell impacts
            this.spellImpacts.forEach(impact => {
                this.drawSpellImpact(context, impact);
            });
            
            // Draw loot
            this.lootDrops.forEach(loot => {
                this.drawLoot(context, loot);
            });
            
            // Draw damage numbers ON TOP
            this.damageNumbers.forEach(dmg => {
                this.drawDamageNumber(context, dmg);
            });
            
            // Draw combo counter if active
            if (this.comboCounter > 1) {
                this.drawComboCounter(context, camera);
            }
        }
        
        // Draw death animation particles
        drawDeathAnimation(context, anim) {
            const now = Date.now();
            const elapsed = now - anim.startTime;
            const progress = elapsed / anim.duration;
            
            context.save();
            
            // Special effects based on animation type
            if (anim.type === 'ink_explosion') {
                // Ink cloud spreading
                const cloudRadius = anim.mobSize * (1 + progress * 3);
                const inkGrad = context.createRadialGradient(anim.x, anim.y, 0, anim.x, anim.y, cloudRadius);
                inkGrad.addColorStop(0, `rgba(30, 0, 50, ${0.6 * (1 - progress)})`);
                inkGrad.addColorStop(0.5, `rgba(50, 0, 80, ${0.4 * (1 - progress)})`);
                inkGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                context.fillStyle = inkGrad;
                context.beginPath();
                context.arc(anim.x, anim.y, cloudRadius, 0, Math.PI * 2);
                context.fill();
            } else if (anim.type === 'fire_burst') {
                // Fire explosion ring
                const ringRadius = anim.mobSize * (0.5 + progress * 2);
                context.strokeStyle = `rgba(255, ${150 - progress * 100}, 0, ${0.8 * (1 - progress)})`;
                context.lineWidth = 4 * (1 - progress);
                context.beginPath();
                context.arc(anim.x, anim.y, ringRadius, 0, Math.PI * 2);
                context.stroke();
            }
            
            // Draw particles
            anim.particles.forEach(p => {
                if (p.alpha <= 0 || p.size <= 0) return;
                
                context.globalAlpha = p.alpha;
                
                // Color based on animation type
                let color = p.color;
                if (anim.type === 'fire_burst') {
                    const hue = 30 + Math.random() * 30;
                    color = `hsl(${hue}, 100%, ${50 + p.life * 30}%)`;
                } else if (anim.type === 'ink_explosion') {
                    color = `rgba(${50 + Math.random() * 50}, 0, ${80 + Math.random() * 50}, 1)`;
                } else if (anim.type === 'dissolve') {
                    // Fade to transparent
                }
                
                context.fillStyle = color;
                context.beginPath();
                context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                context.fill();
            });
            
            context.restore();
        }
        
        // Draw floating damage number
        drawDamageNumber(context, dmg) {
            const elapsed = Date.now() - dmg.startTime;
            const progress = elapsed / dmg.duration;
            const alpha = 1 - progress;
            const scale = dmg.isCrit ? 1.3 : 1;
            
            context.save();
            context.globalAlpha = alpha;
            context.font = `bold ${14 * scale}px Arial`;
            context.textAlign = 'center';
            
            // Shadow
            context.fillStyle = 'rgba(0, 0, 0, 0.5)';
            context.fillText(dmg.damage, dmg.x + 1, dmg.y + 1);
            
            // Main text
            context.fillStyle = dmg.isCrit ? '#ffd700' : '#fff';
            context.fillText(dmg.damage, dmg.x, dmg.y);
            
            context.restore();
        }
        
        // Draw combo counter
        drawComboCounter(context, camera) {
            if (!camera) return;
            
            const screenX = camera.width / 2;
            const screenY = 100;
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            
            context.save();
            context.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen coords
            
            context.font = `bold ${24 * pulse}px Arial`;
            context.textAlign = 'center';
            context.fillStyle = this.comboCounter >= 10 ? '#ff4444' : this.comboCounter >= 5 ? '#ffaa00' : '#ffffff';
            context.shadowColor = '#000';
            context.shadowBlur = 5;
            context.fillText(`COMBO x${this.comboCounter}`, screenX, screenY);
            
            // Multiplier
            context.font = '14px Arial';
            context.fillStyle = '#8ce6de';
            context.fillText(`(${this.comboMultiplier.toFixed(1)}x XP)`, screenX, screenY + 20);
            
            context.restore();
        }
        
        drawMob(context, mob) {
            const now = Date.now();
            const mobType = mob.id || mob.mobType;
            
            // ========== REQUIN (SHARK) ==========
            if (mobType === 'shark_mini') {
                const angle = typeof mob.angle === 'number' ? mob.angle : 0;
                context.save();
                context.translate(mob.x, mob.y);
                context.rotate(angle);

                // Animated tail wag
                const tailWag = Math.sin(now * 0.012) * 0.15;
                
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

                // Tail fin with animation
                context.save();
                context.translate(mob.size * 1.25, 0);
                context.rotate(tailWag);
                context.beginPath();
                const tailGradient = context.createLinearGradient(0, 0, mob.size * 0.95, 0);
                tailGradient.addColorStop(0, 'rgba(60, 90, 150, 0.9)');
                tailGradient.addColorStop(1, 'rgba(20, 45, 95, 0.7)');
                context.fillStyle = tailGradient;
                context.moveTo(0, 0);
                context.lineTo(mob.size * 0.85, -mob.size * 0.8);
                context.lineTo(mob.size * 0.3, 0);
                context.lineTo(mob.size * 0.85, mob.size * 0.8);
                context.closePath();
                context.fill();
                context.restore();

                // Gills
                context.strokeStyle = 'rgba(25, 45, 80, 0.45)';
                context.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    context.beginPath();
                    context.moveTo(-mob.size * 0.45, -mob.size * 0.25 + i * mob.size * 0.22);
                    context.lineTo(-mob.size * 0.1, -mob.size * 0.15 + i * mob.size * 0.22);
                    context.stroke();
                }

                // Mouth with teeth
                context.beginPath();
                context.strokeStyle = 'rgba(15, 30, 55, 0.8)';
                context.lineWidth = 1.2;
                context.moveTo(-mob.size * 0.95, mob.size * 0.2);
                context.quadraticCurveTo(-mob.size * 0.6, mob.size * 0.45, -mob.size * 0.2, mob.size * 0.3);
                context.stroke();
                context.fillStyle = 'rgba(245, 250, 255, 0.85)';
                for (let i = 0; i < 4; i++) {
                    context.beginPath();
                    context.moveTo(-mob.size * 0.8 + i * mob.size * 0.18, mob.size * 0.23);
                    context.lineTo(-mob.size * 0.74 + i * mob.size * 0.18, mob.size * 0.32);
                    context.lineTo(-mob.size * 0.68 + i * mob.size * 0.18, mob.size * 0.23);
                    context.closePath();
                    context.fill();
                }

                // Eye with menacing glow
                context.beginPath();
                context.shadowColor = '#ff0000';
                context.shadowBlur = 3;
                context.fillStyle = '#0b1628';
                context.arc(-mob.size * 0.7, -mob.size * 0.1, mob.size * 0.12, 0, Math.PI * 2);
                context.fill();
                context.shadowBlur = 0;
                context.beginPath();
                context.fillStyle = '#ff4444';
                context.arc(-mob.size * 0.72, -mob.size * 0.12, mob.size * 0.06, 0, Math.PI * 2);
                context.fill();
                context.beginPath();
                context.fillStyle = '#ffffff';
                context.arc(-mob.size * 0.75, -mob.size * 0.18, mob.size * 0.03, 0, Math.PI * 2);
                context.fill();

                context.restore();
            }
            // ========== PIEUVRE (OCTOPUS) ==========
            else if (mobType === 'octopus_boss') {
                context.save();
                context.translate(mob.x, mob.y);
                
                // Pulsing mantle
                const pulse = 1 + Math.sin(now * 0.004) * 0.08;
                
                // Draw 8 animated tentacles
                const tentacleCount = 8;
                for (let i = 0; i < tentacleCount; i++) {
                    const baseAngle = (i / tentacleCount) * Math.PI * 2 - Math.PI / 2;
                    const waveOffset = Math.sin(now * 0.003 + i * 0.8) * 0.3;
                    
                    context.save();
                    context.rotate(baseAngle + waveOffset);
                    
                    // Tentacle gradient
                    const tentGrad = context.createLinearGradient(0, mob.size * 0.5, 0, mob.size * 2.5);
                    tentGrad.addColorStop(0, '#9b59b6');
                    tentGrad.addColorStop(0.5, '#8e44ad');
                    tentGrad.addColorStop(1, '#5b2c6f');
                    context.fillStyle = tentGrad;
                    
                    // Draw wavy tentacle
                    context.beginPath();
                    context.moveTo(-mob.size * 0.15, mob.size * 0.4);
                    
                    const segments = 6;
                    for (let s = 0; s <= segments; s++) {
                        const t = s / segments;
                        const y = mob.size * 0.4 + t * mob.size * 2;
                        const wave = Math.sin(now * 0.005 + s + i) * mob.size * 0.2 * t;
                        const width = mob.size * 0.15 * (1 - t * 0.8);
                        if (s === 0) {
                            context.lineTo(-width + wave, y);
                        } else {
                            context.quadraticCurveTo(-width + wave, y - mob.size * 0.15, -width + wave, y);
                        }
                    }
                    for (let s = segments; s >= 0; s--) {
                        const t = s / segments;
                        const y = mob.size * 0.4 + t * mob.size * 2;
                        const wave = Math.sin(now * 0.005 + s + i) * mob.size * 0.2 * t;
                        const width = mob.size * 0.15 * (1 - t * 0.8);
                        context.quadraticCurveTo(width + wave, y + mob.size * 0.15, width + wave, y);
                    }
                    context.closePath();
                    context.fill();
                    
                    // Suction cups
                    context.fillStyle = '#e8b4f8';
                    for (let s = 1; s <= 4; s++) {
                        const t = s / 5;
                        const y = mob.size * 0.5 + t * mob.size * 1.5;
                        const cupSize = mob.size * 0.06 * (1 - t * 0.5);
                        context.beginPath();
                        context.arc(0, y, cupSize, 0, Math.PI * 2);
                        context.fill();
                    }
                    
                    context.restore();
                }
                
                // Mantle (head)
                const mantleGrad = context.createRadialGradient(0, -mob.size * 0.2, 0, 0, 0, mob.size * 1.2);
                mantleGrad.addColorStop(0, '#d4a5e8');
                mantleGrad.addColorStop(0.4, '#9b59b6');
                mantleGrad.addColorStop(0.8, '#8e44ad');
                mantleGrad.addColorStop(1, '#5b2c6f');
                context.fillStyle = mantleGrad;
                context.shadowColor = 'rgba(155, 89, 182, 0.6)';
                context.shadowBlur = mob.size * 0.5;
                context.beginPath();
                context.ellipse(0, -mob.size * 0.1, mob.size * 0.9 * pulse, mob.size * 1.1 * pulse, 0, 0, Math.PI * 2);
                context.fill();
                context.shadowBlur = 0;
                
                // Spots on mantle
                context.fillStyle = 'rgba(90, 40, 100, 0.4)';
                for (let i = 0; i < 5; i++) {
                    const spotX = Math.cos(i * 1.2) * mob.size * 0.5;
                    const spotY = -mob.size * 0.1 + Math.sin(i * 1.5) * mob.size * 0.6;
                    context.beginPath();
                    context.arc(spotX, spotY, mob.size * 0.12, 0, Math.PI * 2);
                    context.fill();
                }
                
                // Eyes (large, glowing)
                const eyeGlow = 0.5 + Math.sin(now * 0.003) * 0.3;
                [-1, 1].forEach(side => {
                    // Eye socket
                    context.beginPath();
                    context.fillStyle = '#2c1445';
                    context.ellipse(side * mob.size * 0.35, mob.size * 0.15, mob.size * 0.22, mob.size * 0.28, 0, 0, Math.PI * 2);
                    context.fill();
                    
                    // Eye glow
                    context.beginPath();
                    context.shadowColor = '#ff00ff';
                    context.shadowBlur = 10 * eyeGlow;
                    context.fillStyle = `rgba(255, 100, 255, ${eyeGlow})`;
                    context.ellipse(side * mob.size * 0.35, mob.size * 0.15, mob.size * 0.15, mob.size * 0.2, 0, 0, Math.PI * 2);
                    context.fill();
                    context.shadowBlur = 0;
                    
                    // Pupil
                    context.beginPath();
                    context.fillStyle = '#000';
                    context.ellipse(side * mob.size * 0.35, mob.size * 0.18, mob.size * 0.06, mob.size * 0.12, 0, 0, Math.PI * 2);
                    context.fill();
                });
                
                context.restore();
            }
            // ========== LÉVIATHAN ==========
            else if (mobType === 'leviathan') {
                context.save();
                context.translate(mob.x, mob.y);
                
                const angle = typeof mob.angle === 'number' ? mob.angle : 0;
                context.rotate(angle);
                
                // Fire aura
                const auraIntensity = 0.4 + Math.sin(now * 0.008) * 0.2;
                context.beginPath();
                const auraGrad = context.createRadialGradient(0, 0, mob.size, 0, 0, mob.size * 2.5);
                auraGrad.addColorStop(0, `rgba(255, 100, 0, ${auraIntensity})`);
                auraGrad.addColorStop(0.5, `rgba(255, 50, 0, ${auraIntensity * 0.5})`);
                auraGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                context.fillStyle = auraGrad;
                context.arc(0, 0, mob.size * 2.5, 0, Math.PI * 2);
                context.fill();
                
                // Serpentine body segments
                const segmentCount = 8;
                for (let i = segmentCount - 1; i >= 0; i--) {
                    const t = i / segmentCount;
                    const segX = mob.size * 1.5 * t + Math.sin(now * 0.004 + i * 0.5) * mob.size * 0.3 * t;
                    const segY = Math.sin(now * 0.003 + i * 0.8) * mob.size * 0.2 * t;
                    const segSize = mob.size * (1 - t * 0.6) * 0.8;
                    
                    // Segment
                    const segGrad = context.createRadialGradient(segX, segY, 0, segX, segY, segSize);
                    segGrad.addColorStop(0, '#ff6b35');
                    segGrad.addColorStop(0.5, '#c0392b');
                    segGrad.addColorStop(1, '#7b241c');
                    context.fillStyle = segGrad;
                    context.beginPath();
                    context.arc(segX, segY, segSize, 0, Math.PI * 2);
                    context.fill();
                    
                    // Dorsal spine
                    if (i < segmentCount - 2) {
                        context.fillStyle = '#4a1a14';
                        context.beginPath();
                        context.moveTo(segX - segSize * 0.3, segY - segSize);
                        context.lineTo(segX, segY - segSize * 1.8);
                        context.lineTo(segX + segSize * 0.3, segY - segSize);
                        context.closePath();
                        context.fill();
                    }
                }
                
                // Main head
                const headGrad = context.createRadialGradient(-mob.size * 0.3, 0, 0, 0, 0, mob.size * 1.2);
                headGrad.addColorStop(0, '#ffab76');
                headGrad.addColorStop(0.4, '#e74c3c');
                headGrad.addColorStop(0.8, '#c0392b');
                headGrad.addColorStop(1, '#7b241c');
                context.fillStyle = headGrad;
                context.shadowColor = 'rgba(255, 100, 0, 0.8)';
                context.shadowBlur = mob.size * 0.8;
                context.beginPath();
                context.ellipse(0, 0, mob.size * 1.3, mob.size * 0.9, 0, 0, Math.PI * 2);
                context.fill();
                context.shadowBlur = 0;
                
                // Horns
                context.fillStyle = '#2c1006';
                [-1, 1].forEach(side => {
                    context.beginPath();
                    context.moveTo(side * mob.size * 0.4, -mob.size * 0.6);
                    context.quadraticCurveTo(side * mob.size * 0.8, -mob.size * 1.5, side * mob.size * 0.3, -mob.size * 1.8);
                    context.quadraticCurveTo(side * mob.size * 0.5, -mob.size * 1.2, side * mob.size * 0.3, -mob.size * 0.5);
                    context.closePath();
                    context.fill();
                });
                
                // Glowing eyes
                const eyePulse = 0.7 + Math.sin(now * 0.006) * 0.3;
                [-1, 1].forEach(side => {
                    context.beginPath();
                    context.shadowColor = '#ffff00';
                    context.shadowBlur = 15 * eyePulse;
                    context.fillStyle = `rgba(255, 255, 0, ${eyePulse})`;
                    context.arc(side * mob.size * 0.45, -mob.size * 0.1, mob.size * 0.2, 0, Math.PI * 2);
                    context.fill();
                    context.shadowBlur = 0;
                    
                    // Pupil (slit)
                    context.fillStyle = '#000';
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.45, -mob.size * 0.1, mob.size * 0.04, mob.size * 0.15, 0, 0, Math.PI * 2);
                    context.fill();
                });
                
                // Fire breath particles
                if (mob.hp < mob.maxHp * 0.5) {
                    for (let i = 0; i < 5; i++) {
                        const fireX = -mob.size * 1.5 - Math.random() * mob.size;
                        const fireY = (Math.random() - 0.5) * mob.size * 0.5;
                        const fireSize = mob.size * 0.15 * Math.random();
                        context.beginPath();
                        context.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${0.5 + Math.random() * 0.5})`;
                        context.arc(fireX, fireY, fireSize, 0, Math.PI * 2);
                        context.fill();
                    }
                }
                
                // Mouth
                context.beginPath();
                context.strokeStyle = '#2c1006';
                context.lineWidth = 2;
                context.moveTo(-mob.size * 1.1, mob.size * 0.1);
                context.quadraticCurveTo(-mob.size * 0.7, mob.size * 0.4, -mob.size * 0.3, mob.size * 0.2);
                context.stroke();
                
                context.restore();
            }
            // ========== MÉDUSE (JELLYFISH) ==========
            else if (mobType === 'jellyfish') {
                context.save();
                context.translate(mob.x, mob.y);
                
                const pulse = 1 + Math.sin(now * 0.006) * 0.15;
                const float = Math.sin(now * 0.002) * 3;
                context.translate(0, float);
                
                // Tentacles
                const tentCount = 8;
                for (let i = 0; i < tentCount; i++) {
                    const tentX = (i - tentCount / 2 + 0.5) * mob.size * 0.25;
                    const wave = Math.sin(now * 0.004 + i * 0.7) * mob.size * 0.3;
                    
                    context.beginPath();
                    context.strokeStyle = `rgba(255, 158, 234, ${0.6 - i * 0.05})`;
                    context.lineWidth = 2 - i * 0.1;
                    context.moveTo(tentX, mob.size * 0.3);
                    context.quadraticCurveTo(
                        tentX + wave * 0.5, mob.size * 1,
                        tentX + wave, mob.size * 1.8 + Math.sin(i) * mob.size * 0.3
                    );
                    context.stroke();
                }
                
                // Bell (dome)
                const bellGrad = context.createRadialGradient(0, -mob.size * 0.2, 0, 0, 0, mob.size);
                bellGrad.addColorStop(0, 'rgba(255, 220, 255, 0.9)');
                bellGrad.addColorStop(0.5, 'rgba(255, 158, 234, 0.7)');
                bellGrad.addColorStop(1, 'rgba(200, 100, 180, 0.5)');
                context.fillStyle = bellGrad;
                context.beginPath();
                context.ellipse(0, 0, mob.size * pulse, mob.size * 0.7 * pulse, 0, 0, Math.PI, true);
                context.quadraticCurveTo(-mob.size * pulse * 0.8, mob.size * 0.5, 0, mob.size * 0.3);
                context.quadraticCurveTo(mob.size * pulse * 0.8, mob.size * 0.5, mob.size * pulse, 0);
                context.closePath();
                context.fill();
                
                // Inner glow
                context.beginPath();
                context.fillStyle = 'rgba(255, 255, 255, 0.4)';
                context.ellipse(0, -mob.size * 0.1, mob.size * 0.4, mob.size * 0.3, 0, 0, Math.PI * 2);
                context.fill();
                
                // Bioluminescent spots
                for (let i = 0; i < 4; i++) {
                    const spotGlow = 0.3 + Math.sin(now * 0.005 + i) * 0.3;
                    context.beginPath();
                    context.fillStyle = `rgba(255, 200, 255, ${spotGlow})`;
                    context.arc(
                        Math.cos(i * 1.5) * mob.size * 0.4,
                        -mob.size * 0.2 + Math.sin(i * 1.2) * mob.size * 0.2,
                        mob.size * 0.1,
                        0, Math.PI * 2
                    );
                    context.fill();
                }
                
                context.restore();
            }
            // ========== CRABE (CRAB) ==========
            else if (mobType === 'crab_small') {
                context.save();
                context.translate(mob.x, mob.y);
                
                const walkCycle = Math.sin(now * 0.015) * 0.2;
                
                // Legs (6 legs, 3 each side)
                context.strokeStyle = '#cc5555';
                context.lineWidth = 2;
                [-1, 1].forEach(side => {
                    for (let i = 0; i < 3; i++) {
                        const legAngle = (i - 1) * 0.4 + walkCycle * side;
                        context.beginPath();
                        context.moveTo(side * mob.size * 0.5, mob.size * 0.1);
                        context.lineTo(
                            side * (mob.size * 0.8 + Math.cos(legAngle) * mob.size * 0.5),
                            mob.size * 0.3 + Math.sin(legAngle) * mob.size * 0.2 + i * mob.size * 0.15
                        );
                        context.stroke();
                    }
                });
                
                // Pincers
                [-1, 1].forEach(side => {
                    const pincerOpen = 0.2 + Math.sin(now * 0.008 + side) * 0.1;
                    context.fillStyle = '#ff6b6b';
                    
                    // Arm
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.9, -mob.size * 0.1, mob.size * 0.25, mob.size * 0.15, side * 0.3, 0, Math.PI * 2);
                    context.fill();
                    
                    // Pincer claws
                    context.beginPath();
                    context.moveTo(side * mob.size * 1.1, -mob.size * 0.2);
                    context.lineTo(side * mob.size * 1.5, -mob.size * 0.1 - pincerOpen * mob.size);
                    context.lineTo(side * mob.size * 1.3, -mob.size * 0.1);
                    context.lineTo(side * mob.size * 1.5, -mob.size * 0.1 + pincerOpen * mob.size);
                    context.lineTo(side * mob.size * 1.1, 0);
                    context.closePath();
                    context.fill();
                });
                
                // Body (shell)
                const shellGrad = context.createRadialGradient(-mob.size * 0.2, -mob.size * 0.2, 0, 0, 0, mob.size);
                shellGrad.addColorStop(0, '#ff9999');
                shellGrad.addColorStop(0.5, '#ff6b6b');
                shellGrad.addColorStop(1, '#cc4444');
                context.fillStyle = shellGrad;
                context.beginPath();
                context.ellipse(0, 0, mob.size, mob.size * 0.7, 0, 0, Math.PI * 2);
                context.fill();
                
                // Shell pattern
                context.strokeStyle = 'rgba(150, 50, 50, 0.4)';
                context.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    context.beginPath();
                    context.arc(0, 0, mob.size * (0.3 + i * 0.25), 0, Math.PI * 2);
                    context.stroke();
                }
                
                // Eyes on stalks
                [-1, 1].forEach(side => {
                    // Stalk
                    context.fillStyle = '#ff8888';
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.3, -mob.size * 0.6, mob.size * 0.08, mob.size * 0.2, 0, 0, Math.PI * 2);
                    context.fill();
                    
                    // Eye
                    context.fillStyle = '#000';
                    context.beginPath();
                    context.arc(side * mob.size * 0.3, -mob.size * 0.75, mob.size * 0.1, 0, Math.PI * 2);
                    context.fill();
                    context.fillStyle = '#fff';
                    context.beginPath();
                    context.arc(side * mob.size * 0.28, -mob.size * 0.78, mob.size * 0.04, 0, Math.PI * 2);
                    context.fill();
                });
                
                context.restore();
            }
            // ========== ANGUILLE ÉLECTRIQUE ==========
            else if (mobType === 'electric_eel') {
                context.save();
                context.translate(mob.x, mob.y);
                
                const angle = typeof mob.angle === 'number' ? mob.angle : 0;
                context.rotate(angle);
                
                // Electric sparks
                const sparkIntensity = 0.5 + Math.sin(now * 0.02) * 0.3;
                for (let i = 0; i < 5; i++) {
                    const sparkX = (Math.random() - 0.5) * mob.size * 2;
                    const sparkY = (Math.random() - 0.5) * mob.size;
                    context.beginPath();
                    context.strokeStyle = `rgba(255, 255, 100, ${sparkIntensity})`;
                    context.lineWidth = 1;
                    context.moveTo(sparkX, sparkY);
                    context.lineTo(sparkX + (Math.random() - 0.5) * 10, sparkY + (Math.random() - 0.5) * 10);
                    context.stroke();
                }
                
                // Serpentine body
                const wavePhase = now * 0.008;
                context.beginPath();
                const bodyGrad = context.createLinearGradient(-mob.size * 1.5, 0, mob.size * 1.5, 0);
                bodyGrad.addColorStop(0, '#8B8000');
                bodyGrad.addColorStop(0.5, '#ffeb3b');
                bodyGrad.addColorStop(1, '#8B8000');
                context.fillStyle = bodyGrad;
                
                context.moveTo(-mob.size * 1.5, 0);
                for (let i = 0; i <= 10; i++) {
                    const t = i / 10;
                    const x = -mob.size * 1.5 + t * mob.size * 3;
                    const y = Math.sin(wavePhase + t * Math.PI * 2) * mob.size * 0.3;
                    const width = mob.size * 0.4 * (1 - Math.abs(t - 0.3) * 0.5);
                    if (i === 0) {
                        context.lineTo(x, y - width);
                    } else {
                        context.lineTo(x, y - width);
                    }
                }
                for (let i = 10; i >= 0; i--) {
                    const t = i / 10;
                    const x = -mob.size * 1.5 + t * mob.size * 3;
                    const y = Math.sin(wavePhase + t * Math.PI * 2) * mob.size * 0.3;
                    const width = mob.size * 0.4 * (1 - Math.abs(t - 0.3) * 0.5);
                    context.lineTo(x, y + width);
                }
                context.closePath();
                context.fill();
                
                // Eye
                context.fillStyle = '#000';
                context.beginPath();
                context.arc(-mob.size * 1.2, 0, mob.size * 0.12, 0, Math.PI * 2);
                context.fill();
                
                // Electric glow
                context.shadowColor = '#ffff00';
                context.shadowBlur = 10 * sparkIntensity;
                context.beginPath();
                context.strokeStyle = `rgba(255, 255, 0, ${sparkIntensity * 0.5})`;
                context.lineWidth = 2;
                context.arc(0, 0, mob.size * 0.8, 0, Math.PI * 2);
                context.stroke();
                context.shadowBlur = 0;
                
                context.restore();
            }
            // ========== CRABE GÉANT ==========
            else if (mobType === 'crab_giant') {
                context.save();
                context.translate(mob.x, mob.y);
                
                const walkCycle = Math.sin(now * 0.01) * 0.15;
                
                // Massive legs (8 legs)
                context.strokeStyle = '#8B0000';
                context.lineWidth = 3;
                [-1, 1].forEach(side => {
                    for (let i = 0; i < 4; i++) {
                        const legAngle = (i - 1.5) * 0.35 + walkCycle * side;
                        context.beginPath();
                        context.moveTo(side * mob.size * 0.6, mob.size * 0.2);
                        const jointX = side * (mob.size * 0.9 + Math.cos(legAngle) * mob.size * 0.4);
                        const jointY = mob.size * 0.4 + i * mob.size * 0.12;
                        context.lineTo(jointX, jointY);
                        context.lineTo(jointX + side * mob.size * 0.3, jointY + mob.size * 0.2);
                        context.stroke();
                    }
                });
                
                // Massive pincers
                [-1, 1].forEach(side => {
                    const pincerOpen = 0.15 + Math.sin(now * 0.006 + side) * 0.1;
                    
                    // Arm segment
                    context.fillStyle = '#cc4444';
                    context.beginPath();
                    context.ellipse(side * mob.size * 1.1, -mob.size * 0.2, mob.size * 0.4, mob.size * 0.25, side * 0.2, 0, Math.PI * 2);
                    context.fill();
                    
                    // Pincer
                    context.fillStyle = '#aa3333';
                    context.beginPath();
                    context.moveTo(side * mob.size * 1.4, -mob.size * 0.4);
                    context.lineTo(side * mob.size * 2.0, -mob.size * 0.2 - pincerOpen * mob.size * 0.8);
                    context.lineTo(side * mob.size * 1.7, -mob.size * 0.2);
                    context.lineTo(side * mob.size * 2.0, -mob.size * 0.2 + pincerOpen * mob.size * 0.8);
                    context.lineTo(side * mob.size * 1.4, 0);
                    context.closePath();
                    context.fill();
                    
                    // Pincer spikes
                    context.fillStyle = '#660000';
                    for (let i = 0; i < 3; i++) {
                        context.beginPath();
                        const spikeX = side * (mob.size * 1.6 + i * mob.size * 0.12);
                        context.moveTo(spikeX, -mob.size * 0.3);
                        context.lineTo(spikeX + side * mob.size * 0.08, -mob.size * 0.45);
                        context.lineTo(spikeX + side * mob.size * 0.05, -mob.size * 0.3);
                        context.fill();
                    }
                });
                
                // Armored shell
                const shellGrad = context.createRadialGradient(-mob.size * 0.2, -mob.size * 0.3, 0, 0, 0, mob.size * 1.2);
                shellGrad.addColorStop(0, '#ff6666');
                shellGrad.addColorStop(0.4, '#cc4444');
                shellGrad.addColorStop(0.8, '#993333');
                shellGrad.addColorStop(1, '#661111');
                context.fillStyle = shellGrad;
                context.beginPath();
                context.ellipse(0, 0, mob.size * 1.2, mob.size * 0.85, 0, 0, Math.PI * 2);
                context.fill();
                
                // Shell armor plates
                context.strokeStyle = 'rgba(100, 30, 30, 0.6)';
                context.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    context.beginPath();
                    context.arc(0, 0, mob.size * (0.3 + i * 0.22), 0, Math.PI * 2);
                    context.stroke();
                }
                
                // Spikes on shell
                context.fillStyle = '#440000';
                for (let i = 0; i < 5; i++) {
                    const spikeAngle = (i / 5) * Math.PI - Math.PI / 2;
                    context.beginPath();
                    context.moveTo(Math.cos(spikeAngle) * mob.size * 0.8, Math.sin(spikeAngle) * mob.size * 0.6 - mob.size * 0.1);
                    context.lineTo(Math.cos(spikeAngle) * mob.size * 1.1, Math.sin(spikeAngle) * mob.size * 0.8 - mob.size * 0.3);
                    context.lineTo(Math.cos(spikeAngle + 0.15) * mob.size * 0.8, Math.sin(spikeAngle + 0.15) * mob.size * 0.6);
                    context.fill();
                }
                
                // Eyes
                [-1, 1].forEach(side => {
                    context.fillStyle = '#ff8888';
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.4, -mob.size * 0.8, mob.size * 0.1, mob.size * 0.25, 0, 0, Math.PI * 2);
                    context.fill();
                    context.fillStyle = '#220000';
                    context.beginPath();
                    context.arc(side * mob.size * 0.4, -mob.size * 1.0, mob.size * 0.12, 0, Math.PI * 2);
                    context.fill();
                });
                
                context.restore();
            }
            // ========== RAIE MANTA ==========
            else if (mobType === 'manta_ray') {
                context.save();
                context.translate(mob.x, mob.y);
                
                const wingFlap = Math.sin(now * 0.004) * 0.2;
                
                // Shadow beneath
                context.fillStyle = 'rgba(0, 0, 0, 0.2)';
                context.beginPath();
                context.ellipse(0, 5, mob.size * 1.5, mob.size * 0.4, 0, 0, Math.PI * 2);
                context.fill();
                
                // Wings
                const wingGrad = context.createRadialGradient(0, 0, 0, 0, 0, mob.size * 1.8);
                wingGrad.addColorStop(0, '#2c3e50');
                wingGrad.addColorStop(0.6, '#1a1a2e');
                wingGrad.addColorStop(1, '#0d0d15');
                context.fillStyle = wingGrad;
                
                context.beginPath();
                context.moveTo(0, -mob.size * 0.3);
                context.quadraticCurveTo(-mob.size * 1.2, -mob.size * 0.5 + wingFlap * mob.size, -mob.size * 1.8, mob.size * 0.2 + wingFlap * mob.size * 2);
                context.quadraticCurveTo(-mob.size * 1.0, mob.size * 0.4, 0, mob.size * 0.5);
                context.quadraticCurveTo(mob.size * 1.0, mob.size * 0.4, mob.size * 1.8, mob.size * 0.2 + wingFlap * mob.size * 2);
                context.quadraticCurveTo(mob.size * 1.2, -mob.size * 0.5 + wingFlap * mob.size, 0, -mob.size * 0.3);
                context.fill();
                
                // Body center
                context.fillStyle = '#34495e';
                context.beginPath();
                context.ellipse(0, 0, mob.size * 0.5, mob.size * 0.7, 0, 0, Math.PI * 2);
                context.fill();
                
                // Tail
                context.strokeStyle = '#1a1a2e';
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(0, mob.size * 0.5);
                context.quadraticCurveTo(Math.sin(now * 0.005) * mob.size * 0.3, mob.size * 1.5, 0, mob.size * 2.5);
                context.stroke();
                
                // Patterns on wings
                context.fillStyle = 'rgba(100, 150, 200, 0.3)';
                [-1, 1].forEach(side => {
                    for (let i = 0; i < 3; i++) {
                        context.beginPath();
                        context.arc(side * (mob.size * 0.5 + i * mob.size * 0.3), mob.size * 0.1, mob.size * 0.15 - i * 0.03, 0, Math.PI * 2);
                        context.fill();
                    }
                });
                
                // Eyes (glowing)
                const eyeGlow = 0.5 + Math.sin(now * 0.003) * 0.3;
                [-1, 1].forEach(side => {
                    context.beginPath();
                    context.shadowColor = '#00ffff';
                    context.shadowBlur = 8 * eyeGlow;
                    context.fillStyle = `rgba(0, 255, 255, ${eyeGlow})`;
                    context.arc(side * mob.size * 0.25, -mob.size * 0.2, mob.size * 0.1, 0, Math.PI * 2);
                    context.fill();
                    context.shadowBlur = 0;
                });
                
                context.restore();
            }
            // ========== KRAKEN ==========
            else if (mobType === 'kraken') {
                context.save();
                context.translate(mob.x, mob.y);
                
                // Dark aura
                const auraSize = mob.size * 2 + Math.sin(now * 0.003) * mob.size * 0.3;
                const auraGrad = context.createRadialGradient(0, 0, mob.size * 0.5, 0, 0, auraSize);
                auraGrad.addColorStop(0, 'rgba(20, 20, 40, 0.4)');
                auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                context.fillStyle = auraGrad;
                context.beginPath();
                context.arc(0, 0, auraSize, 0, Math.PI * 2);
                context.fill();
                
                // 10 massive tentacles
                for (let i = 0; i < 10; i++) {
                    const baseAngle = (i / 10) * Math.PI * 2 - Math.PI / 2;
                    const waveOffset = Math.sin(now * 0.002 + i * 0.6) * 0.25;
                    
                    context.save();
                    context.rotate(baseAngle + waveOffset);
                    
                    // Tentacle
                    const tentGrad = context.createLinearGradient(0, mob.size * 0.6, 0, mob.size * 3);
                    tentGrad.addColorStop(0, '#2c3e50');
                    tentGrad.addColorStop(1, '#1a1a2e');
                    context.fillStyle = tentGrad;
                    
                    context.beginPath();
                    context.moveTo(-mob.size * 0.2, mob.size * 0.5);
                    
                    const segs = 8;
                    for (let s = 0; s <= segs; s++) {
                        const t = s / segs;
                        const y = mob.size * 0.5 + t * mob.size * 2.5;
                        const wave = Math.sin(now * 0.003 + s + i) * mob.size * 0.25 * t;
                        const w = mob.size * 0.2 * (1 - t * 0.7);
                        context.lineTo(-w + wave, y);
                    }
                    for (let s = segs; s >= 0; s--) {
                        const t = s / segs;
                        const y = mob.size * 0.5 + t * mob.size * 2.5;
                        const wave = Math.sin(now * 0.003 + s + i) * mob.size * 0.25 * t;
                        const w = mob.size * 0.2 * (1 - t * 0.7);
                        context.lineTo(w + wave, y);
                    }
                    context.closePath();
                    context.fill();
                    
                    // Suction cups
                    context.fillStyle = '#4a6080';
                    for (let s = 1; s <= 5; s++) {
                        const t = s / 6;
                        const y = mob.size * 0.6 + t * mob.size * 2;
                        context.beginPath();
                        context.arc(0, y, mob.size * 0.08 * (1 - t * 0.5), 0, Math.PI * 2);
                        context.fill();
                    }
                    
                    context.restore();
                }
                
                // Main body
                const bodyGrad = context.createRadialGradient(0, -mob.size * 0.3, 0, 0, 0, mob.size * 1.3);
                bodyGrad.addColorStop(0, '#4a6080');
                bodyGrad.addColorStop(0.5, '#2c3e50');
                bodyGrad.addColorStop(1, '#1a1a2e');
                context.fillStyle = bodyGrad;
                context.beginPath();
                context.ellipse(0, 0, mob.size * 1.1, mob.size * 1.4, 0, 0, Math.PI * 2);
                context.fill();
                
                // Giant eyes
                const eyePulse = 0.6 + Math.sin(now * 0.004) * 0.4;
                [-1, 1].forEach(side => {
                    // Eye socket
                    context.fillStyle = '#0a0a15';
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.4, -mob.size * 0.1, mob.size * 0.35, mob.size * 0.45, 0, 0, Math.PI * 2);
                    context.fill();
                    
                    // Glowing eye
                    context.shadowColor = '#ff0000';
                    context.shadowBlur = 15 * eyePulse;
                    context.fillStyle = `rgba(255, 50, 50, ${eyePulse})`;
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.4, -mob.size * 0.1, mob.size * 0.25, mob.size * 0.35, 0, 0, Math.PI * 2);
                    context.fill();
                    context.shadowBlur = 0;
                    
                    // Pupil (slit)
                    context.fillStyle = '#000';
                    context.beginPath();
                    context.ellipse(side * mob.size * 0.4, -mob.size * 0.1, mob.size * 0.06, mob.size * 0.25, 0, 0, Math.PI * 2);
                    context.fill();
                });
                
                context.restore();
            }
            // ========== DEFAULT (cercle basique) ==========
            else {
                context.beginPath();
                const gradient = context.createRadialGradient(mob.x - 2, mob.y - 2, 1, mob.x, mob.y, mob.size);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, mob.color || '#888');
                context.fillStyle = gradient;
                context.arc(mob.x, mob.y, mob.size, 0, Math.PI * 2);
                context.fill();
            }
            
            // ========== HEALTH BAR (pour tous les mobs) ==========
            const hpPercent = mob.hp / mob.maxHp;
            const barWidth = Math.max(mob.size * 2.5, 30);
            const barHeight = 4;
            const barY = mob.y - mob.size - (mobType === 'leviathan' ? 25 : mobType === 'octopus_boss' ? 35 : 15);
            
            // Background
            context.fillStyle = 'rgba(0, 0, 0, 0.6)';
            context.fillRect(mob.x - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2);
            
            // Health gradient
            const hpGrad = context.createLinearGradient(mob.x - barWidth / 2, 0, mob.x + barWidth / 2, 0);
            if (hpPercent > 0.5) {
                hpGrad.addColorStop(0, '#4caf50');
                hpGrad.addColorStop(1, '#8bc34a');
            } else if (hpPercent > 0.25) {
                hpGrad.addColorStop(0, '#ff9800');
                hpGrad.addColorStop(1, '#ffc107');
            } else {
                hpGrad.addColorStop(0, '#f44336');
                hpGrad.addColorStop(1, '#ff5722');
            }
            context.fillStyle = hpGrad;
            context.fillRect(mob.x - barWidth / 2, barY, barWidth * hpPercent, barHeight);
            
            // Name (only on hover)
            const showName = !!(this.hoveredMobId && mob.uniqueId && this.hoveredMobId === mob.uniqueId);
            if (showName) {
                const typeColors = {
                    'mob': '#fff',
                    'elite': '#00bfff',
                    'boss': '#ffd700'
                };
                context.fillStyle = typeColors[mob.type] || '#fff';
                context.font = mob.type === 'boss' ? 'bold 10px Arial' : '9px Arial';
                context.textAlign = 'center';
                const nameY = barY - 5;
                
                // Name shadow for readability
                context.fillStyle = 'rgba(0, 0, 0, 0.7)';
                context.fillText(mob.name, mob.x + 1, nameY + 1);
                context.fillStyle = typeColors[mob.type] || '#fff';
                context.fillText(mob.name, mob.x, nameY);
            }
            
            // Boss/Elite special effects
            if (mob.type === 'boss' || mob.type === 'elite') {
                const pulse = Math.sin(now * 0.004) * 3;
                context.beginPath();
                context.strokeStyle = mob.type === 'boss' ? 'rgba(255, 215, 0, 0.4)' : 'rgba(0, 191, 255, 0.3)';
                context.lineWidth = 2;
                context.arc(mob.x, mob.y, mob.size + 8 + pulse, 0, Math.PI * 2);
                context.stroke();
                
                // Danger indicator for low HP boss
                if (mob.type === 'boss' && hpPercent < 0.3) {
                    context.beginPath();
                    context.strokeStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(now * 0.01) * 0.3})`;
                    context.lineWidth = 3;
                    context.arc(mob.x, mob.y, mob.size + 15 + pulse, 0, Math.PI * 2);
                    context.stroke();
                }
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

        drawSpellImpact(context, impact) {
            const elapsed = Date.now() - impact.spawnTime;
            const progress = Math.min(1, elapsed / impact.duration);
            const radius = impact.baseRadius + impact.spread * progress;
            const alpha = 1 - progress;

            context.save();
            context.globalAlpha = alpha;
            context.beginPath();
            context.strokeStyle = impact.color;
            context.lineWidth = 2;
            context.arc(impact.x, impact.y, radius, 0, Math.PI * 2);
            context.stroke();
            context.beginPath();
            context.fillStyle = impact.color;
            context.globalAlpha = alpha * 0.4;
            context.arc(impact.x, impact.y, radius * 0.45, 0, Math.PI * 2);
            context.fill();
            context.restore();
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
        spell_cooldown_2: 0,
        spell_cooldown_3: 0
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
        inventory: new Inventory(4),
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
    window.GameSystems.MOBS = MOBS;
    window.GameSystems.ITEMS = ITEMS;

})();
