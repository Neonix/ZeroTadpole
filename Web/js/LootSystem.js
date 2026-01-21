/**
 * ZeroTadpole - Enhanced Loot System
 * Système de loot corrigé et amélioré
 */

(function() {
    'use strict';

    // ============================================
    // LOOT DEFINITIONS
    // ============================================
    
    const LOOT_QUALITY = {
        common: { color: '#9ad7ff', glow: 'rgba(154, 215, 255, 0.3)', name: 'Commun' },
        uncommon: { color: '#7dff7d', glow: 'rgba(125, 255, 125, 0.3)', name: 'Peu commun' },
        rare: { color: '#7d7dff', glow: 'rgba(125, 125, 255, 0.4)', name: 'Rare' },
        epic: { color: '#d07dff', glow: 'rgba(208, 125, 255, 0.5)', name: 'Épique' },
        legendary: { color: '#ffd700', glow: 'rgba(255, 215, 0, 0.6)', name: 'Légendaire' }
    };

    const LOOT_TABLE = {
        // Potions
        'potion_health': {
            id: 'potion_health',
            name: 'Potion de Vie',
            icon: '❤️',
            quality: 'common',
            stackable: true,
            maxStack: 10,
            effect: { type: 'heal', value: 30 },
            sellValue: 1
        },
        'potion_health_large': {
            id: 'potion_health_large',
            name: 'Grande Potion',
            icon: '💖',
            quality: 'uncommon',
            stackable: true,
            maxStack: 5,
            effect: { type: 'heal', value: 60 },
            sellValue: 3
        },
        'potion_speed': {
            id: 'potion_speed',
            name: 'Potion de Vitesse',
            icon: '💨',
            quality: 'uncommon',
            stackable: true,
            maxStack: 5,
            effect: { type: 'speed', value: 1.5, duration: 10000 },
            sellValue: 3
        },
        'shield_bubble': {
            id: 'shield_bubble',
            name: 'Bulle Protectrice',
            icon: '🛡️',
            quality: 'rare',
            stackable: true,
            maxStack: 3,
            effect: { type: 'shield', duration: 5000 },
            sellValue: 8
        },
        
        // Sorts
        'spell_bubble': {
            id: 'spell_bubble',
            name: 'Bulle d\'Attaque',
            icon: '🫧',
            quality: 'common',
            stackable: false,
            isSpell: true,
            damage: 15,
            cooldown: 1000,
            range: 150,
            speed: 8,
            sellValue: 5
        },
        'spell_wave': {
            id: 'spell_wave',
            name: 'Vague Sonore',
            icon: '🌊',
            quality: 'uncommon',
            stackable: false,
            isSpell: true,
            damage: 25,
            cooldown: 3000,
            range: 80,
            aoe: true,
            sellValue: 12
        },
        'spell_lightning': {
            id: 'spell_lightning',
            name: 'Éclair Aquatique',
            icon: '⚡',
            quality: 'rare',
            stackable: false,
            isSpell: true,
            damage: 40,
            cooldown: 5000,
            range: 200,
            speed: 15,
            sellValue: 25
        },
        'spell_vortex': {
            id: 'spell_vortex',
            name: 'Vortex',
            icon: '🌀',
            quality: 'epic',
            stackable: false,
            isSpell: true,
            damage: 60,
            cooldown: 8000,
            range: 120,
            aoe: true,
            sellValue: 50
        },
        'spell_heal': {
            id: 'spell_heal',
            name: 'Régénération',
            icon: '✨',
            quality: 'rare',
            stackable: false,
            isSpell: true,
            heal: 40,
            cooldown: 10000,
            sellValue: 30
        },
        
        // Matériaux
        'material_pearl': {
            id: 'material_pearl',
            name: 'Perle',
            icon: '⚪',
            quality: 'common',
            stackable: true,
            maxStack: 50,
            sellValue: 1
        },
        'material_coral': {
            id: 'material_coral',
            name: 'Corail',
            icon: '🪸',
            quality: 'uncommon',
            stackable: true,
            maxStack: 30,
            sellValue: 2
        },
        'material_shell': {
            id: 'material_shell',
            name: 'Coquillage Rare',
            icon: '🐚',
            quality: 'rare',
            stackable: true,
            maxStack: 20,
            sellValue: 5
        }
    };

    // ============================================
    // LOOT DROP CLASS
    // ============================================
    
    class LootDrop {
        constructor(itemId, x, y, sourceId = null) {
            const def = LOOT_TABLE[itemId];
            if (!def) {
                console.error('Unknown loot item:', itemId);
                this.valid = false;
                return;
            }
            
            this.valid = true;
            this.id = `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.itemId = itemId;
            this.definition = def;
            this.quality = LOOT_QUALITY[def.quality] || LOOT_QUALITY.common;
            
            this.x = x;
            this.y = y;
            this.startX = x;
            this.startY = y;
            this.sourceId = sourceId;
            
            // État
            this.spawnTime = Date.now();
            this.lifetime = 30000; // 30 secondes avant disparition
            this.blinkStart = 25000; // Commence à clignoter à 25s
            this.isBlinking = false;
            this.isCollected = false;
            this.collectingBy = null;
            
            // Animation
            this.animPhase = Math.random() * Math.PI * 2;
            this.floatOffset = 0;
            this.pulseScale = 1;
            this.collectProgress = 0;
            
            // Physique initiale (petit rebond depuis la source)
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = (Math.random() - 0.5) * 4 - 2;
            this.friction = 0.92;
            this.gravity = 0.15;
            this.grounded = false;
        }
        
        update(deltaTime) {
            if (!this.valid || this.isCollected) return;
            
            const now = Date.now();
            const age = now - this.spawnTime;
            
            // Vérifier expiration
            if (age > this.lifetime) {
                this.isCollected = true; // Marquer pour suppression
                return;
            }
            
            // Clignotement avant disparition
            if (age > this.blinkStart && !this.isBlinking) {
                this.isBlinking = true;
            }
            
            // Physique (les premières secondes)
            if (!this.grounded) {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += this.gravity;
                
                this.vx *= this.friction;
                this.vy *= this.friction;
                
                // Considérer comme posé après ralentissement
                if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
                    this.grounded = true;
                }
            }
            
            // Animation
            this.animPhase += 0.05;
            this.floatOffset = Math.sin(this.animPhase) * 3;
            this.pulseScale = 1 + Math.sin(this.animPhase * 1.5) * 0.1;
            
            // Animation de collecte
            if (this.collectingBy !== null) {
                this.collectProgress += 0.1;
                if (this.collectProgress >= 1) {
                    this.isCollected = true;
                }
            }
        }
        
        draw(context, camera) {
            if (!this.valid || this.isCollected) return;
            
            const now = Date.now();
            const age = now - this.spawnTime;
            
            // Clignotement
            if (this.isBlinking) {
                const blinkPhase = Math.sin(age * 0.02);
                if (blinkPhase < 0) return; // Invisible pendant la moitié du cycle
            }
            
            const x = this.x;
            const y = this.y + this.floatOffset;
            const def = this.definition;
            const quality = this.quality;
            
            context.save();
            
            // Animation de collecte
            if (this.collectProgress > 0) {
                context.globalAlpha = 1 - this.collectProgress;
                context.translate(x, y);
                context.scale(1 + this.collectProgress * 0.5, 1 + this.collectProgress * 0.5);
                context.translate(-x, -y);
            }
            
            // Lueur de fond (selon qualité)
            const glowSize = 20 * this.pulseScale;
            const gradient = context.createRadialGradient(x, y, 0, x, y, glowSize);
            gradient.addColorStop(0, quality.glow);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, glowSize, 0, Math.PI * 2);
            context.fill();
            
            // Cercle de base
            const baseSize = 10 * this.pulseScale;
            const baseGradient = context.createRadialGradient(x - 2, y - 2, 0, x, y, baseSize);
            baseGradient.addColorStop(0, '#ffffff');
            baseGradient.addColorStop(0.7, quality.color);
            baseGradient.addColorStop(1, this.darkenColor(quality.color, 0.3));
            
            context.fillStyle = baseGradient;
            context.beginPath();
            context.arc(x, y, baseSize, 0, Math.PI * 2);
            context.fill();
            
            // Bordure
            context.strokeStyle = quality.color;
            context.lineWidth = 2;
            context.stroke();
            
            // Icône
            context.fillStyle = '#000000';
            context.font = '12px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(def.icon, x, y);
            
            // Nom de l'item au survol (si le joueur est proche)
            // Ceci sera géré par le système de hover
            
            context.restore();
        }
        
        darkenColor(hex, amount) {
            const num = parseInt(hex.replace('#', ''), 16);
            const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
            const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
            const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
            return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
        }
        
        canCollect(playerId) {
            if (!this.valid || this.isCollected) return false;
            if (this.collectingBy !== null && this.collectingBy !== playerId) return false;
            return true;
        }
        
        startCollect(playerId) {
            if (!this.canCollect(playerId)) return false;
            this.collectingBy = playerId;
            return true;
        }
        
        getDistanceTo(x, y) {
            const dx = this.x - x;
            const dy = this.y - y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        isExpired() {
            return Date.now() - this.spawnTime > this.lifetime;
        }
    }

    // ============================================
    // LOOT MANAGER
    // ============================================
    
    class LootManager {
        constructor() {
            this.drops = new Map();
            this.collectRange = 25;
            this.autoLoot = true;
        }
        
        spawnLoot(itemId, x, y, sourceId = null) {
            const drop = new LootDrop(itemId, x, y, sourceId);
            if (drop.valid) {
                this.drops.set(drop.id, drop);
                console.log(`Loot spawned: ${itemId} at (${x}, ${y})`);
                
                // Notification visuelle
                if (window.showLootNotification) {
                    window.showLootNotification(drop.definition);
                }
                
                return drop;
            }
            return null;
        }
        
        spawnFromMob(mobType, x, y, mobId) {
            const mobDropTable = this.getMobDropTable(mobType);
            const drops = [];
            
            for (const [itemId, chance] of Object.entries(mobDropTable)) {
                if (Math.random() < chance) {
                    // Petit décalage pour chaque drop
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    const drop = this.spawnLoot(itemId, x + offsetX, y + offsetY, mobId);
                    if (drop) drops.push(drop);
                }
            }
            
            return drops;
        }
        
        getMobDropTable(mobType) {
            const tables = {
                'crab_small': {
                    'potion_health': 0.4,
                    'material_pearl': 0.3,
                    'spell_bubble': 0.15
                },
                'jellyfish': {
                    'potion_health': 0.3,
                    'potion_speed': 0.2,
                    'material_coral': 0.25,
                    'spell_wave': 0.1
                },
                'shark_mini': {
                    'potion_health_large': 0.4,
                    'shield_bubble': 0.25,
                    'spell_lightning': 0.15,
                    'material_shell': 0.3
                },
                'octopus_boss': {
                    'potion_health_large': 0.8,
                    'shield_bubble': 0.5,
                    'spell_vortex': 0.3,
                    'spell_heal': 0.25,
                    'material_shell': 0.6
                },
                'leviathan': {
                    'potion_health_large': 1.0,
                    'shield_bubble': 0.8,
                    'spell_vortex': 0.6,
                    'spell_heal': 0.5,
                    'spell_lightning': 0.4,
                    'material_shell': 1.0
                }
            };
            
            return tables[mobType] || { 'potion_health': 0.3 };
        }
        
        update(deltaTime, playerX, playerY, playerId) {
            const toRemove = [];
            
            for (const [id, drop] of this.drops) {
                drop.update(deltaTime);
                
                // Suppression si collecté ou expiré
                if (drop.isCollected || drop.isExpired()) {
                    toRemove.push(id);
                    continue;
                }
                
                // Auto-loot si proche
                if (this.autoLoot && drop.canCollect(playerId)) {
                    const distance = drop.getDistanceTo(playerX, playerY);
                    if (distance < this.collectRange) {
                        this.collectLoot(drop.id, playerId);
                    }
                }
            }
            
            // Nettoyage
            for (const id of toRemove) {
                this.drops.delete(id);
            }
        }
        
        draw(context, camera) {
            for (const drop of this.drops.values()) {
                drop.draw(context, camera);
            }
        }
        
        collectLoot(dropId, playerId) {
            const drop = this.drops.get(dropId);
            if (!drop || !drop.canCollect(playerId)) return null;
            
            drop.startCollect(playerId);
            
            const item = drop.definition;
            
            // Ajouter à l'inventaire
            if (window.GameSystems && window.GameSystems.inventory) {
                const added = window.GameSystems.inventory.addItem(drop.itemId);
                if (!added) {
                    // Inventaire plein
                    drop.collectingBy = null;
                    drop.collectProgress = 0;
                    if (window.showToast) {
                        window.showToast('Inventaire plein !', 'warning');
                    }
                    return null;
                }
            }
            
            // Notification de collecte
            if (window.showToast) {
                const qualityName = LOOT_QUALITY[item.quality]?.name || '';
                window.showToast(`${item.icon} ${item.name} collecté !`, 'loot');
            }
            
            return item;
        }
        
        getLootNearPlayer(playerX, playerY, range = 50) {
            const nearby = [];
            
            for (const drop of this.drops.values()) {
                if (drop.isCollected) continue;
                
                const distance = drop.getDistanceTo(playerX, playerY);
                if (distance < range) {
                    nearby.push({ drop, distance });
                }
            }
            
            // Trier par distance
            nearby.sort((a, b) => a.distance - b.distance);
            
            return nearby.map(n => n.drop);
        }
        
        getClosestLoot(playerX, playerY) {
            const nearby = this.getLootNearPlayer(playerX, playerY, this.collectRange * 2);
            return nearby.length > 0 ? nearby[0] : null;
        }
        
        clear() {
            this.drops.clear();
        }
        
        getDropCount() {
            return this.drops.size;
        }
    }

    // ============================================
    // EXPORT
    // ============================================
    
    window.LOOT_QUALITY = LOOT_QUALITY;
    window.LOOT_TABLE = LOOT_TABLE;
    window.LootDrop = LootDrop;
    window.LootManager = new LootManager();

})();
