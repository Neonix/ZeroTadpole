/**
 * ZeroTadpole - NPC System
 * Système de PNJ pour Arène, Instances et Guide
 */

(function() {
    'use strict';

    // ============================================
    // NPC DEFINITIONS
    // ============================================
    
    const NPC_TYPES = {
        'ovule': {
            name: 'Ovule',
            title: 'Guide',
            color: '#f6d28c',
            icon: '✨',
            size: 6,
            dialogues: {
                welcome: [
                    "Bienvenue, jeune têtard ! Je suis Ovule, ta guide.",
                    "Collecte des orbes pour gagner des gemmes et débloquer des couleurs !",
                    "Attention aux créatures hostiles... mais tu peux aussi les combattre !"
                ],
                tutorial: [
                    "Utilise la souris ou le joystick pour te déplacer.",
                    "Maintiens le clic ou le bouton pour avancer.",
                    "Les orbes dorés donnent un boost de vitesse temporaire !",
                    "Complete des quêtes pour gagner des récompenses."
                ],
                tips: [
                    "Les mobs élites apparaissent régulièrement... sois prêt !",
                    "Reste près de la zone de départ pour être en sécurité.",
                    "Tu peux acheter des sorts et potions dans ma boutique.",
                    "Après 3 quêtes, tu pourras choisir ta couleur définitive !"
                ]
            },
            actions: ['shop', 'quests', 'help']
        },
        'arena_master': {
            name: 'Gladius',
            title: 'Maître de l\'Arène',
            color: '#e74c3c',
            icon: '⚔️',
            size: 7,
            dialogues: {
                welcome: [
                    "Ah, un nouveau challenger ! Je suis Gladius.",
                    "L'Arène est l'endroit parfait pour prouver ta valeur !",
                    "Choisis ton mode de combat et montre ta force !"
                ],
                modes: [
                    "🗡️ Duel 1v1 - Affronte un adversaire en face à face !",
                    "⚔️ Combat 2v2 - Forme une équipe et battez-vous !",
                    "👊 Mêlée Générale - Tous contre tous, le dernier debout gagne !",
                    "Le vainqueur remporte des gemmes et de l'expérience."
                ],
                tips: [
                    "Entraîne-toi contre les mobs avant d'affronter d'autres joueurs.",
                    "Les potions sont interdites en arène... seule l'habileté compte !",
                    "Chaque victoire augmente ton rang d'arène."
                ]
            },
            actions: ['arena_1v1', 'arena_2v2', 'arena_ffa', 'rankings']
        },
        'instance_keeper': {
            name: 'Coralia',
            title: 'Gardienne des Portails',
            color: '#9b59b6',
            icon: '🌀',
            size: 7,
            dialogues: {
                welcome: [
                    "Salutations, aventurier. Je suis Coralia.",
                    "Je garde les portails vers les profondeurs...",
                    "Des donjons et raids t'attendent, avec de riches récompenses !"
                ],
                dungeons: [
                    "🦀 Grotte des Crabes - Idéal pour débuter (Niveau 1-10)",
                    "🐙 Antre du Poulpe - Pour les courageux (Niveau 10-20)",
                    "🌊 Abysses Profondes - Réservé aux experts (Niveau 20+)",
                    "🐉 Raid: Léviathan - Rassemble 8 héros pour affronter le titan !"
                ],
                tips: [
                    "Les donjons génèrent des loots rares et épiques.",
                    "Forme un groupe pour les défis les plus difficiles.",
                    "Chaque boss a des mécaniques uniques... observe bien !",
                    "Les raids donnent les meilleures récompenses du jeu."
                ]
            },
            actions: ['dungeon_easy', 'dungeon_medium', 'dungeon_hard', 'raid', 'instance_list']
        }
    };

    // ============================================
    // NPC CLASS
    // ============================================
    
    class NPC {
        constructor(type, x, y) {
            const def = NPC_TYPES[type];
            if (!def) {
                console.error('Unknown NPC type:', type);
                return;
            }
            
            this.type = type;
            this.id = `npc-${type}`;
            this.name = def.name;
            this.title = def.title;
            this.color = def.color;
            this.icon = def.icon;
            this.size = def.size;
            this.dialogues = def.dialogues;
            this.actions = def.actions;
            
            this.x = x;
            this.y = y;
            this.baseX = x;
            this.baseY = y;
            
            this.isClose = false;
            this.isHovered = false;
            this.isInteracting = false;
            this.lastInteraction = 0;
            this.interactionCooldown = 2000;
            
            // Animation
            this.animTime = Math.random() * 1000;
            this.floatOffset = 0;
            this.pulseScale = 1;
        }
        
        update(playerX, playerY, time) {
            this.animTime = time;
            
            // Calcul distance au joueur
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.isClose = distance < 40;
            
            // Animation de flottement
            this.floatOffset = Math.sin(time * 0.003) * 3;
            this.pulseScale = 1 + Math.sin(time * 0.005) * 0.1;
            
            // Légère dérive vers le joueur si proche
            if (this.isClose && distance > 25) {
                this.x += dx * 0.005;
                this.y += dy * 0.005;
            } else {
                // Retour à la position de base
                this.x += (this.baseX - this.x) * 0.02;
                this.y += (this.baseY - this.y) * 0.02;
            }
        }
        
        draw(context) {
            const time = this.animTime;
            const y = this.y + this.floatOffset;
            
            context.save();
            
            // Aura si proche
            if (this.isClose) {
                const auraRadius = this.size + 15 + Math.sin(time * 0.008) * 5;
                const gradient = context.createRadialGradient(this.x, y, this.size, this.x, y, auraRadius);
                gradient.addColorStop(0, this.color + '40');
                gradient.addColorStop(1, this.color + '00');
                
                context.beginPath();
                context.fillStyle = gradient;
                context.arc(this.x, y, auraRadius, 0, Math.PI * 2);
                context.fill();
            }
            
            // Corps principal
            this.renderBody(context, this.x, y, time);
            
            // Nom et titre
            this.renderNameplate(context, this.x, y - this.size - 15);
            
            // Indicateur d'interaction
            if (this.isClose) {
                this.renderInteractionPrompt(context, this.x, y - this.size - 35, time);
            }
            
            // Point d'exclamation si quêtes disponibles
            if (this.hasAvailableContent()) {
                this.renderExclamation(context, this.x + this.size + 5, y - this.size - 5, time);
            }
            
            context.restore();
        }
        
        renderBody(context, x, y, time) {
            // Différent rendu selon le type
            switch (this.type) {
                case 'ovule':
                    this.renderOvule(context, x, y, time);
                    break;
                case 'arena_master':
                    this.renderArenaMaster(context, x, y, time);
                    break;
                case 'instance_keeper':
                    this.renderInstanceKeeper(context, x, y, time);
                    break;
                default:
                    this.renderDefault(context, x, y, time);
            }
        }
        
        renderOvule(context, x, y, time) {
            // Corps ovale lumineux
            context.save();
            context.translate(x, y);
            context.scale(1.6, 1.2);
            
            const gradient = context.createRadialGradient(-2, -2, 2, 0, 0, this.size + 2);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#fff5e6');
            gradient.addColorStop(1, this.color);
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(0, 0, this.size * this.pulseScale, 0, Math.PI * 2);
            context.fill();
            
            context.restore();
            
            // Anneaux lumineux
            context.beginPath();
            context.strokeStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 0.006) * 0.2})`;
            context.lineWidth = 2;
            context.arc(x, y, this.size + 8 + Math.sin(time * 0.005) * 3, 0, Math.PI * 2);
            context.stroke();
            
            // Particules flottantes
            for (let i = 0; i < 4; i++) {
                const angle = (time * 0.002 + i * Math.PI / 2);
                const radius = this.size + 12 + Math.sin(time * 0.004 + i) * 5;
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                
                context.beginPath();
                context.fillStyle = `rgba(246, 210, 140, ${0.5 + Math.sin(time * 0.01 + i) * 0.3})`;
                context.arc(px, py, 2, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        renderArenaMaster(context, x, y, time) {
            // Corps guerrier
            const gradient = context.createRadialGradient(x - 3, y - 3, 2, x, y, this.size);
            gradient.addColorStop(0, '#ff8a8a');
            gradient.addColorStop(1, this.color);
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, this.size * this.pulseScale, 0, Math.PI * 2);
            context.fill();
            
            // Cicatrice
            context.strokeStyle = '#8b0000';
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(x - this.size * 0.3, y - this.size * 0.2);
            context.lineTo(x + this.size * 0.4, y + this.size * 0.3);
            context.stroke();
            
            // Épée croisée (symbole)
            const swordAngle = Math.sin(time * 0.003) * 0.1;
            context.save();
            context.translate(x + this.size + 5, y - this.size);
            context.rotate(swordAngle - Math.PI / 4);
            
            context.fillStyle = '#c0c0c0';
            context.fillRect(-1, -10, 2, 14);
            context.fillStyle = '#8b4513';
            context.fillRect(-2, 2, 4, 4);
            
            context.restore();
            
            // Flammes de combat
            for (let i = 0; i < 3; i++) {
                const flameAngle = time * 0.01 + i * Math.PI * 2 / 3;
                const flameX = x + Math.cos(flameAngle) * (this.size + 8);
                const flameY = y + Math.sin(flameAngle) * (this.size + 8);
                const flameSize = 3 + Math.sin(time * 0.02 + i) * 2;
                
                const flameGrad = context.createRadialGradient(flameX, flameY, 0, flameX, flameY, flameSize);
                flameGrad.addColorStop(0, '#ff6b35');
                flameGrad.addColorStop(1, 'rgba(231, 76, 60, 0)');
                
                context.beginPath();
                context.fillStyle = flameGrad;
                context.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        renderInstanceKeeper(context, x, y, time) {
            // Corps mystique
            const gradient = context.createRadialGradient(x - 3, y - 3, 2, x, y, this.size);
            gradient.addColorStop(0, '#d7a3ff');
            gradient.addColorStop(1, this.color);
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, this.size * this.pulseScale, 0, Math.PI * 2);
            context.fill();
            
            // Portail miniature autour
            const portalRadius = this.size + 10;
            const portalRotation = time * 0.002;
            
            context.save();
            context.translate(x, y);
            context.rotate(portalRotation);
            
            // Anneau du portail
            context.beginPath();
            context.strokeStyle = `rgba(155, 89, 182, ${0.5 + Math.sin(time * 0.005) * 0.3})`;
            context.lineWidth = 3;
            context.setLineDash([5, 5]);
            context.arc(0, 0, portalRadius, 0, Math.PI * 2);
            context.stroke();
            context.setLineDash([]);
            
            // Symboles runiques
            const runes = ['◊', '○', '△', '□'];
            context.font = '8px Arial';
            context.fillStyle = '#d7a3ff';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            
            for (let i = 0; i < 4; i++) {
                const runeAngle = (Math.PI * 2 / 4) * i;
                const runeX = Math.cos(runeAngle) * (portalRadius - 2);
                const runeY = Math.sin(runeAngle) * (portalRadius - 2);
                context.fillText(runes[i], runeX, runeY);
            }
            
            context.restore();
            
            // Étoiles flottantes
            for (let i = 0; i < 5; i++) {
                const starPhase = time * 0.003 + i * Math.PI * 2 / 5;
                const starRadius = this.size + 15 + Math.sin(starPhase * 2) * 8;
                const starX = x + Math.cos(starPhase) * starRadius;
                const starY = y + Math.sin(starPhase) * starRadius;
                
                context.beginPath();
                context.fillStyle = `rgba(215, 163, 255, ${0.4 + Math.sin(time * 0.01 + i) * 0.3})`;
                context.arc(starX, starY, 1.5, 0, Math.PI * 2);
                context.fill();
            }
        }
        
        renderDefault(context, x, y, time) {
            const gradient = context.createRadialGradient(x - 2, y - 2, 1, x, y, this.size);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, this.color);
            
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(x, y, this.size * this.pulseScale, 0, Math.PI * 2);
            context.fill();
        }
        
        renderNameplate(context, x, y) {
            // Titre
            context.fillStyle = '#888888';
            context.font = '6px Arial';
            context.textAlign = 'center';
            context.fillText(this.title, x, y - 8);
            
            // Nom
            context.fillStyle = this.color;
            context.font = 'bold 8px Arial';
            context.fillText(this.name, x, y);
        }
        
        renderInteractionPrompt(context, x, y, time) {
            const bounce = Math.sin(time * 0.008) * 3;
            
            // Bulle de dialogue
            context.fillStyle = 'rgba(255, 255, 255, 0.95)';
            context.beginPath();
            context.roundRect(x - 25, y + bounce - 12, 50, 18, 5);
            context.fill();
            
            // Pointe de la bulle
            context.beginPath();
            context.moveTo(x - 5, y + bounce + 6);
            context.lineTo(x, y + bounce + 12);
            context.lineTo(x + 5, y + bounce + 6);
            context.fill();
            
            // Texte
            context.fillStyle = '#333333';
            context.font = 'bold 7px Arial';
            context.textAlign = 'center';
            context.fillText('[ Clic ]', x, y + bounce);
        }
        
        renderExclamation(context, x, y, time) {
            const bounce = Math.abs(Math.sin(time * 0.008)) * 5;
            
            // Cercle jaune
            context.beginPath();
            context.fillStyle = '#f39c12';
            context.arc(x, y - bounce, 6, 0, Math.PI * 2);
            context.fill();
            
            // Point d'exclamation
            context.fillStyle = '#ffffff';
            context.font = 'bold 8px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('!', x, y - bounce);
        }
        
        hasAvailableContent() {
            // Vérifie si le NPC a des quêtes/contenus disponibles
            if (this.type === 'ovule') {
                const hasSeen = localStorage.getItem('tadpole_has_seen');
                return !hasSeen;
            }
            return true; // Arène et Instance toujours disponibles
        }
        
        interact() {
            const now = Date.now();
            if (now - this.lastInteraction < this.interactionCooldown) {
                return false;
            }
            
            this.lastInteraction = now;
            this.isInteracting = true;
            
            // Ouvrir le dialogue approprié
            if (window.openNpcPanel) {
                window.openNpcPanel(this.type, this);
            }
            
            return true;
        }
        
        getRandomDialogue(category) {
            const dialogues = this.dialogues[category];
            if (!dialogues || dialogues.length === 0) return '';
            return dialogues[Math.floor(Math.random() * dialogues.length)];
        }
    }

    // ============================================
    // NPC MANAGER
    // ============================================
    
    class NPCManager {
        constructor() {
            this.npcs = new Map();
            this.initialized = false;
        }
        
        init() {
            if (this.initialized) return;
            
            // Créer les NPCs de base
            this.createNPC('ovule', 80, 80);
            this.createNPC('arena_master', -120, 60);
            this.createNPC('instance_keeper', 60, -120);
            
            this.initialized = true;
            console.log('NPCManager initialized with', this.npcs.size, 'NPCs');
        }
        
        createNPC(type, x, y) {
            const npc = new NPC(type, x, y);
            if (npc.id) {
                this.npcs.set(npc.id, npc);
            }
            return npc;
        }
        
        getNPC(id) {
            return this.npcs.get(id);
        }
        
        getNPCByType(type) {
            return this.npcs.get(`npc-${type}`);
        }
        
        update(playerX, playerY, time) {
            for (const npc of this.npcs.values()) {
                npc.update(playerX, playerY, time);
            }
        }
        
        draw(context) {
            for (const npc of this.npcs.values()) {
                npc.draw(context);
            }
        }
        
        checkInteraction(playerX, playerY, isClicking) {
            if (!isClicking) return null;
            
            for (const npc of this.npcs.values()) {
                if (npc.isClose) {
                    if (npc.interact()) {
                        return npc;
                    }
                }
            }
            return null;
        }
        
        getClosestNPC(playerX, playerY, maxDistance = 50) {
            let closest = null;
            let closestDist = maxDistance;
            
            for (const npc of this.npcs.values()) {
                const dx = playerX - npc.x;
                const dy = playerY - npc.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = npc;
                }
            }
            
            return closest;
        }
    }

    // ============================================
    // EXPORT
    // ============================================
    
    window.NPC_TYPES = NPC_TYPES;
    window.NPC = NPC;
    window.NPCManager = new NPCManager();

})();
