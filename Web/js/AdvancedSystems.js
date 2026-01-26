/**
 * ZeroTadpole - Advanced Systems UI v1.0
 * Interface complète pour talents, achievements, crafting, pets, trading, leaderboard
 */

(function() {
    'use strict';

    // ============================================
    // SYSTÈMES AVANCÉS
    // ============================================

    window.AdvancedSystems = {
        // === DONNÉES ===
        talents: { points: 0, trees: {}, bonuses: {}, definitions: {} },
        achievements: { unlocked: {}, stats: {}, list: {} },
        crafting: { recipes: {}, materials: {}, inProgress: null },
        pets: { owned: {}, active: null, types: {} },
        trading: { active: null, requests: [] },
        leaderboard: { categories: {}, data: {}, playerRanks: {} },
        events: { active: [], worldBosses: [], dailyReward: {} },
        
        // === INITIALISATION ===
        init: function() {
            this.createPanels();
            this.setupHandlers();
            console.log('[AdvancedSystems] Initialized');
        },

        // === CRÉATION DES PANNEAUX ===
        createPanels: function() {
            // Conteneur principal
            const container = document.createElement('div');
            container.id = 'advanced-systems-container';
            container.innerHTML = `
                <!-- TALENTS PANEL -->
                <div id="talents-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🌟 Talents</h2>
                        <span class="talent-points">Points: <b id="talent-points-count">0</b></span>
                        <button class="close-btn" onclick="AdvancedSystems.closePanel('talents')">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="talent-trees" id="talent-trees"></div>
                    </div>
                    <div class="adv-panel-footer">
                        <button class="btn-secondary" onclick="AdvancedSystems.resetTalents()">🔄 Reset (100 💎)</button>
                    </div>
                </div>

                <!-- ACHIEVEMENTS PANEL -->
                <div id="achievements-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🏆 Achievements</h2>
                        <span id="achievement-progress">0/0</span>
                        <button class="close-btn" onclick="AdvancedSystems.closePanel('achievements')">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="achievement-categories" id="achievement-categories"></div>
                        <div class="achievement-list" id="achievement-list"></div>
                    </div>
                </div>

                <!-- CRAFTING PANEL -->
                <div id="crafting-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🔨 Craft</h2>
                        <button class="close-btn" onclick="AdvancedSystems.closePanel('crafting')">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="craft-categories" id="craft-categories"></div>
                        <div class="craft-recipes" id="craft-recipes"></div>
                        <div class="craft-progress hidden" id="craft-progress">
                            <div class="progress-bar"><div class="progress-fill" id="craft-progress-fill"></div></div>
                            <span id="craft-progress-text">Fabrication...</span>
                            <button class="btn-danger" onclick="AdvancedSystems.cancelCraft()">Annuler</button>
                        </div>
                    </div>
                </div>

                <!-- PETS PANEL -->
                <div id="pets-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🐾 Compagnons</h2>
                        <button class="close-btn" onclick="AdvancedSystems.closePanel('pets')">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="active-pet" id="active-pet-display"></div>
                        <div class="pet-list" id="pet-list"></div>
                    </div>
                </div>

                <!-- TRADING PANEL -->
                <div id="trading-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🤝 Échange</h2>
                        <button class="close-btn" onclick="AdvancedSystems.cancelTrade()">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="trade-sides">
                            <div class="trade-side" id="trade-my-side">
                                <h3>Vous offrez</h3>
                                <div class="trade-items" id="trade-my-items"></div>
                                <div class="trade-gems">
                                    <input type="number" id="trade-my-gems" min="0" value="0" onchange="AdvancedSystems.setTradeGems()">
                                    <span>💎</span>
                                </div>
                            </div>
                            <div class="trade-divider">⇄</div>
                            <div class="trade-side" id="trade-their-side">
                                <h3>Vous recevez</h3>
                                <div class="trade-items" id="trade-their-items"></div>
                                <div class="trade-gems">
                                    <span id="trade-their-gems">0</span>
                                    <span>💎</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="adv-panel-footer">
                        <button class="btn-primary" id="trade-confirm-btn" onclick="AdvancedSystems.confirmTrade()">✓ Confirmer</button>
                        <button class="btn-danger" onclick="AdvancedSystems.cancelTrade()">✗ Annuler</button>
                    </div>
                </div>

                <!-- LEADERBOARD PANEL -->
                <div id="leaderboard-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🏅 Classement</h2>
                        <button class="close-btn" onclick="AdvancedSystems.closePanel('leaderboard')">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="leaderboard-tabs" id="leaderboard-tabs"></div>
                        <div class="leaderboard-list" id="leaderboard-list"></div>
                        <div class="leaderboard-player" id="leaderboard-player"></div>
                    </div>
                </div>

                <!-- EVENTS PANEL -->
                <div id="events-panel" class="adv-panel hidden">
                    <div class="adv-panel-header">
                        <h2>🎉 Événements</h2>
                        <button class="close-btn" onclick="AdvancedSystems.closePanel('events')">&times;</button>
                    </div>
                    <div class="adv-panel-content">
                        <div class="daily-reward" id="daily-reward-section"></div>
                        <div class="active-events" id="active-events-list"></div>
                        <div class="world-bosses" id="world-bosses-list"></div>
                    </div>
                </div>

                <!-- DAILY REWARD POPUP -->
                <div id="daily-reward-popup" class="popup hidden">
                    <div class="popup-content">
                        <h2>🎁 Récompense Journalière</h2>
                        <div class="daily-streak" id="daily-streak"></div>
                        <div class="daily-rewards-grid" id="daily-rewards-grid"></div>
                        <button class="btn-primary btn-large" id="claim-daily-btn" onclick="AdvancedSystems.claimDailyReward()">
                            Récupérer !
                        </button>
                    </div>
                </div>

                <!-- ACHIEVEMENT POPUP -->
                <div id="achievement-popup" class="popup hidden">
                    <div class="popup-content achievement-unlock">
                        <div class="achievement-icon" id="achievement-popup-icon"></div>
                        <h3 id="achievement-popup-name"></h3>
                        <p id="achievement-popup-desc"></p>
                        <div class="achievement-rewards" id="achievement-popup-rewards"></div>
                    </div>
                </div>

                <!-- WORLD BOSS UI -->
                <div id="world-boss-ui" class="hidden">
                    <div class="boss-info">
                        <span class="boss-icon" id="boss-icon"></span>
                        <span class="boss-name" id="boss-name"></span>
                    </div>
                    <div class="boss-hp-bar">
                        <div class="boss-hp-fill" id="boss-hp-fill"></div>
                        <span class="boss-hp-text" id="boss-hp-text"></span>
                    </div>
                </div>

                <!-- MINIMAP -->
                <div id="minimap">
                    <canvas id="minimap-canvas" width="150" height="150"></canvas>
                    <div class="minimap-markers" id="minimap-markers"></div>
                </div>

                <!-- TOP MENU BAR -->
                <div id="top-menu-bar">
                    <button class="menu-btn" onclick="AdvancedSystems.openPanel('talents')" title="Talents">🌟</button>
                    <button class="menu-btn" onclick="AdvancedSystems.openPanel('achievements')" title="Achievements">🏆</button>
                    <button class="menu-btn" onclick="AdvancedSystems.openPanel('crafting')" title="Craft">🔨</button>
                    <button class="menu-btn" onclick="AdvancedSystems.openPanel('pets')" title="Pets">🐾</button>
                    <button class="menu-btn" onclick="AdvancedSystems.openPanel('leaderboard')" title="Classement">🏅</button>
                    <button class="menu-btn" onclick="AdvancedSystems.openPanel('events')" title="Événements">🎉</button>
                </div>

                <!-- BUFF BAR -->
                <div id="buff-bar"></div>

                <!-- DAMAGE NUMBERS CONTAINER -->
                <div id="damage-numbers"></div>

                <!-- NOTIFICATION TOAST -->
                <div id="notification-container"></div>
            `;
            document.body.appendChild(container);
        },

        // === SETUP HANDLERS ===
        setupHandlers: function() {
            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT') return;
                
                switch(e.key) {
                    case 't': case 'T': this.openPanel('talents'); break;
                    case 'y': case 'Y': this.openPanel('achievements'); break;
                    case 'c': case 'C': this.openPanel('crafting'); break;
                    case 'p': case 'P': this.openPanel('pets'); break;
                    case 'l': case 'L': this.openPanel('leaderboard'); break;
                    case 'Escape': this.closeAllPanels(); break;
                }
            });
        },

        // === PANEL MANAGEMENT ===
        openPanel: function(panelName) {
            this.closeAllPanels();
            const panel = document.getElementById(panelName + '-panel');
            if (panel) {
                panel.classList.remove('hidden');
                this.refreshPanel(panelName);
            }
        },

        closePanel: function(panelName) {
            const panel = document.getElementById(panelName + '-panel');
            if (panel) panel.classList.add('hidden');
        },

        closeAllPanels: function() {
            document.querySelectorAll('.adv-panel').forEach(p => p.classList.add('hidden'));
            document.querySelectorAll('.popup').forEach(p => p.classList.add('hidden'));
        },

        refreshPanel: function(panelName) {
            switch(panelName) {
                case 'talents': this.renderTalents(); break;
                case 'achievements': this.renderAchievements(); break;
                case 'crafting': this.renderCrafting(); break;
                case 'pets': this.renderPets(); break;
                case 'leaderboard': this.renderLeaderboard(); break;
                case 'events': this.renderEvents(); break;
            }
        },

        // ============================================
        // TALENTS
        // ============================================
        renderTalents: function() {
            const container = document.getElementById('talent-trees');
            const defs = this.talents.definitions;
            const trees = this.talents.trees;
            
            document.getElementById('talent-points-count').textContent = this.talents.points || 0;
            
            let html = '';
            for (const treeName in defs) {
                const tree = defs[treeName];
                html += `<div class="talent-tree" data-tree="${treeName}">
                    <h3>${tree.name}</h3>
                    <p class="tree-desc">${tree.description}</p>
                    <div class="talent-nodes">`;
                
                // Organiser par row
                const rows = {};
                for (const talentId in tree.talents) {
                    const talent = tree.talents[talentId];
                    const row = talent.row || 1;
                    if (!rows[row]) rows[row] = [];
                    rows[row].push({ ...talent, id: talentId });
                }
                
                for (let row = 1; row <= 5; row++) {
                    html += `<div class="talent-row">`;
                    (rows[row] || []).forEach(talent => {
                        const currentRank = (trees[treeName] && trees[treeName][talent.id]) || 0;
                        const maxRank = talent.maxRank;
                        const canLearn = this.canLearnTalent(treeName, talent.id);
                        const value = currentRank * talent.valuePerRank;
                        
                        html += `<div class="talent-node ${currentRank > 0 ? 'learned' : ''} ${canLearn ? 'available' : 'locked'}"
                                     onclick="AdvancedSystems.learnTalent('${treeName}', '${talent.id}')"
                                     title="${talent.description.replace('{value}', value)}">
                            <span class="talent-icon">${talent.icon}</span>
                            <span class="talent-rank">${currentRank}/${maxRank}</span>
                            <span class="talent-name">${talent.name}</span>
                        </div>`;
                    });
                    html += `</div>`;
                }
                
                html += `</div></div>`;
            }
            
            container.innerHTML = html;
        },

        canLearnTalent: function(treeName, talentId) {
            if (this.talents.points <= 0) return false;
            
            const tree = this.talents.definitions[treeName];
            if (!tree) return false;
            
            const talent = tree.talents[talentId];
            if (!talent) return false;
            
            const currentRank = (this.talents.trees[treeName] && this.talents.trees[treeName][talentId]) || 0;
            if (currentRank >= talent.maxRank) return false;
            
            // Check requirements
            for (const reqId in talent.requires) {
                const reqRank = talent.requires[reqId];
                const currentReqRank = (this.talents.trees[treeName] && this.talents.trees[treeName][reqId]) || 0;
                if (currentReqRank < reqRank) return false;
            }
            
            return true;
        },

        learnTalent: function(treeName, talentId) {
            if (!this.canLearnTalent(treeName, talentId)) return;
            this.sendMessage('talent_learn', { tree: treeName, talent: talentId });
        },

        resetTalents: function() {
            if (confirm('Réinitialiser tous vos talents pour 100 💎 ?')) {
                this.sendMessage('talent_reset', {});
            }
        },

        // ============================================
        // ACHIEVEMENTS
        // ============================================
        renderAchievements: function() {
            const list = document.getElementById('achievement-list');
            const achievements = this.achievements.list;
            const unlocked = this.achievements.unlocked || {};
            
            // Count
            const total = Object.keys(achievements).length;
            const done = Object.keys(unlocked).length;
            document.getElementById('achievement-progress').textContent = `${done}/${total}`;
            
            // Group by category
            const categories = {};
            for (const id in achievements) {
                const ach = achievements[id];
                const cat = ach.category || 'other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({ ...ach, id, unlocked: !!unlocked[id] });
            }
            
            let html = '';
            for (const cat in categories) {
                html += `<div class="achievement-category">
                    <h3>${this.getCategoryName(cat)}</h3>
                    <div class="achievement-grid">`;
                
                categories[cat].forEach(ach => {
                    html += `<div class="achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}">
                        <span class="ach-icon">${ach.icon}</span>
                        <div class="ach-info">
                            <span class="ach-name">${ach.name}</span>
                            <span class="ach-desc">${ach.description}</span>
                        </div>
                        ${ach.unlocked ? '<span class="ach-check">✓</span>' : ''}
                    </div>`;
                });
                
                html += `</div></div>`;
            }
            
            list.innerHTML = html;
        },

        getCategoryName: function(cat) {
            const names = {
                exploration: '🗺️ Exploration',
                combat: '⚔️ Combat',
                survival: '💪 Survie',
                progression: '📈 Progression',
                social: '👥 Social',
                collection: '📦 Collection',
                quests: '📜 Quêtes',
                special: '✨ Spécial'
            };
            return names[cat] || cat;
        },

        showAchievementPopup: function(achievement) {
            document.getElementById('achievement-popup-icon').textContent = achievement.icon;
            document.getElementById('achievement-popup-name').textContent = achievement.name;
            document.getElementById('achievement-popup-desc').textContent = achievement.description;
            
            let rewardsHtml = '';
            if (achievement.rewards) {
                if (achievement.rewards.xp) rewardsHtml += `<span>+${achievement.rewards.xp} XP</span>`;
                if (achievement.rewards.gems) rewardsHtml += `<span>+${achievement.rewards.gems} 💎</span>`;
                if (achievement.rewards.title) rewardsHtml += `<span>Titre: ${achievement.rewards.title}</span>`;
            }
            document.getElementById('achievement-popup-rewards').innerHTML = rewardsHtml;
            
            document.getElementById('achievement-popup').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('achievement-popup').classList.add('hidden');
            }, 4000);
        },

        // ============================================
        // CRAFTING
        // ============================================
        renderCrafting: function() {
            const container = document.getElementById('craft-recipes');
            const recipes = this.crafting.recipes;
            
            // Group by category
            const categories = {};
            for (const id in recipes) {
                const recipe = recipes[id];
                const cat = recipe.category || 'other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({ ...recipe, id });
            }
            
            let html = '';
            for (const cat in categories) {
                html += `<div class="craft-category">
                    <h3>${this.getCraftCategoryName(cat)}</h3>
                    <div class="recipe-grid">`;
                
                categories[cat].forEach(recipe => {
                    const canCraft = recipe.canCraft;
                    html += `<div class="recipe-item ${canCraft ? 'available' : 'unavailable'}"
                                 onclick="AdvancedSystems.showRecipeDetails('${recipe.id}')">
                        <div class="recipe-result">
                            <span class="recipe-qty">${recipe.result.quantity}x</span>
                            <span class="recipe-name">${recipe.name}</span>
                        </div>
                        <div class="recipe-ingredients">`;
                    
                    for (const ingId in recipe.ingredients) {
                        const qty = recipe.ingredients[ingId];
                        const material = this.crafting.materials[ingId];
                        const icon = material ? material.icon : '❓';
                        html += `<span class="ingredient">${icon}${qty}</span>`;
                    }
                    
                    html += `</div>
                        ${canCraft ? '<button class="craft-btn" onclick="event.stopPropagation(); AdvancedSystems.startCraft(\'' + recipe.id + '\')">Craft</button>' : ''}
                    </div>`;
                });
                
                html += `</div></div>`;
            }
            
            container.innerHTML = html;
            
            // Show progress if crafting
            if (this.crafting.inProgress) {
                document.getElementById('craft-progress').classList.remove('hidden');
                this.updateCraftProgress();
            } else {
                document.getElementById('craft-progress').classList.add('hidden');
            }
        },

        getCraftCategoryName: function(cat) {
            const names = {
                potions: '🧪 Potions',
                armor: '🛡️ Armures',
                spells: '✨ Sorts',
                accessories: '💍 Accessoires',
                consumables: '📦 Consommables',
                materials: '🪨 Matériaux'
            };
            return names[cat] || cat;
        },

        startCraft: function(recipeId) {
            this.sendMessage('craft_start', { recipeId });
        },

        cancelCraft: function() {
            this.sendMessage('craft_cancel', {});
        },

        updateCraftProgress: function() {
            if (!this.crafting.inProgress) return;
            
            const now = Date.now();
            const start = this.crafting.inProgress.startTime;
            const end = this.crafting.inProgress.endTime;
            const progress = Math.min(100, ((now - start) / (end - start)) * 100);
            
            document.getElementById('craft-progress-fill').style.width = progress + '%';
            document.getElementById('craft-progress-text').textContent = 
                `Fabrication... ${Math.ceil((end - now) / 1000)}s`;
            
            if (now < end) {
                requestAnimationFrame(() => this.updateCraftProgress());
            }
        },

        // ============================================
        // PETS
        // ============================================
        renderPets: function() {
            const activePetDiv = document.getElementById('active-pet-display');
            const listDiv = document.getElementById('pet-list');
            
            // Active pet
            if (this.pets.active && this.pets.owned[this.pets.active]) {
                const pet = this.pets.owned[this.pets.active];
                activePetDiv.innerHTML = `
                    <div class="active-pet-card">
                        <span class="pet-icon large">${pet.icon}</span>
                        <div class="pet-info">
                            <h3>${pet.name}</h3>
                            <div class="pet-level">Niv. ${pet.level}</div>
                            <div class="pet-xp-bar">
                                <div class="xp-fill" style="width: ${(pet.xp / (pet.xpToNext || 100)) * 100}%"></div>
                            </div>
                            <div class="pet-stats">
                                <span>⚔️ ${pet.stats.damage}</span>
                                <span>❤️ ${pet.stats.hp}</span>
                                <span>💨 ${pet.stats.speed.toFixed(1)}</span>
                            </div>
                        </div>
                        <button class="btn-secondary" onclick="AdvancedSystems.deactivatePet()">Ranger</button>
                    </div>
                `;
            } else {
                activePetDiv.innerHTML = '<div class="no-pet">Aucun compagnon actif</div>';
            }
            
            // Pet list
            let html = '<div class="pet-grid">';
            for (const petId in this.pets.owned) {
                const pet = this.pets.owned[petId];
                const isActive = this.pets.active === petId;
                
                html += `<div class="pet-card ${isActive ? 'active' : ''} rarity-${pet.rarity}">
                    <span class="pet-icon">${pet.icon}</span>
                    <span class="pet-name">${pet.name}</span>
                    <span class="pet-level">Niv. ${pet.level}</span>
                    ${!isActive ? `<button class="btn-small" onclick="AdvancedSystems.activatePet('${petId}')">Invoquer</button>` : ''}
                </div>`;
            }
            html += '</div>';
            
            listDiv.innerHTML = html;
        },

        activatePet: function(petId) {
            this.sendMessage('pet_activate', { petId });
        },

        deactivatePet: function() {
            this.sendMessage('pet_deactivate', {});
        },

        // ============================================
        // LEADERBOARD
        // ============================================
        renderLeaderboard: function() {
            const tabsDiv = document.getElementById('leaderboard-tabs');
            const listDiv = document.getElementById('leaderboard-list');
            const playerDiv = document.getElementById('leaderboard-player');
            
            // Tabs
            let tabsHtml = '';
            for (const cat in this.leaderboard.categories) {
                const info = this.leaderboard.categories[cat];
                tabsHtml += `<button class="lb-tab" data-cat="${cat}" onclick="AdvancedSystems.selectLeaderboardCategory('${cat}')">
                    ${info.icon} ${info.name}
                </button>`;
            }
            tabsDiv.innerHTML = tabsHtml;
            
            // Default to first category
            const firstCat = Object.keys(this.leaderboard.categories)[0] || 'level';
            this.selectLeaderboardCategory(firstCat);
        },

        selectLeaderboardCategory: function(category) {
            // Update tabs
            document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.lb-tab[data-cat="${category}"]`)?.classList.add('active');
            
            const listDiv = document.getElementById('leaderboard-list');
            const playerDiv = document.getElementById('leaderboard-player');
            
            const data = this.leaderboard.data[category];
            if (!data || !data.entries) {
                listDiv.innerHTML = '<div class="no-data">Chargement...</div>';
                return;
            }
            
            let html = '<table class="lb-table"><thead><tr><th>#</th><th>Joueur</th><th>Score</th></tr></thead><tbody>';
            
            data.entries.forEach((entry, i) => {
                const rankIcon = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : (i + 1)));
                html += `<tr class="${entry.playerId === window.model?.userTadpole?.id ? 'highlight' : ''}">
                    <td>${rankIcon}</td>
                    <td style="color: ${entry.color || '#fff'}">${entry.name}</td>
                    <td>${this.formatScore(entry.score, category)}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            listDiv.innerHTML = html;
            
            // Player rank
            const playerRank = this.leaderboard.playerRanks[category];
            if (playerRank) {
                playerDiv.innerHTML = `<div class="your-rank">Votre rang: #${playerRank.rank || '?'} (${this.formatScore(playerRank.score, category)})</div>`;
            }
        },

        formatScore: function(score, category) {
            if (category === 'playtime') {
                const hours = Math.floor(score / 3600);
                const mins = Math.floor((score % 3600) / 60);
                return `${hours}h ${mins}m`;
            }
            return score.toLocaleString();
        },

        // ============================================
        // EVENTS
        // ============================================
        renderEvents: function() {
            const dailyDiv = document.getElementById('daily-reward-section');
            const eventsDiv = document.getElementById('active-events-list');
            const bossesDiv = document.getElementById('world-bosses-list');
            
            // Daily reward
            const daily = this.events.dailyReward;
            if (daily.canClaim) {
                dailyDiv.innerHTML = `
                    <div class="daily-available">
                        <span>🎁</span>
                        <span>Récompense journalière disponible !</span>
                        <button onclick="AdvancedSystems.showDailyReward()">Récupérer</button>
                    </div>
                `;
            } else {
                dailyDiv.innerHTML = `<div class="daily-claimed">✓ Récompense récupérée (Jour ${daily.currentStreak || 1}/7)</div>`;
            }
            
            // Active events (defensive: server can send objects or arrays)
            const activeEvents = Array.isArray(this.events?.active) ? this.events.active : Object.values(this.events?.active || {});
            let eventsHtml = '<h3>Événements Actifs</h3>';
            if (activeEvents.length === 0) {
                eventsHtml += '<div class="no-events">Aucun événement actif</div>';
            } else {
                activeEvents.forEach(event => {
                    const remaining = Math.max(0, Math.floor((event.endTime * 1000 - Date.now()) / 1000));
                    const mins = Math.floor(remaining / 60);
                    const secs = remaining % 60;
                    
                    eventsHtml += `<div class="event-item">
                        <span class="event-icon">${event.icon}</span>
                        <div class="event-info">
                            <span class="event-name">${event.name}</span>
                            <span class="event-desc">${event.description}</span>
                        </div>
                        <span class="event-time">${mins}:${secs.toString().padStart(2, '0')}</span>
                    </div>`;
                });
            }
            eventsDiv.innerHTML = eventsHtml;
            
            // World bosses (defensive: server can send objects or arrays)
            const worldBosses = Array.isArray(this.events?.worldBosses) ? this.events.worldBosses : Object.values(this.events?.worldBosses || {});
            let bossesHtml = '<h3>Boss Mondiaux</h3>';
            if (worldBosses.length === 0) {
                bossesHtml += '<div class="no-bosses">Aucun boss actif</div>';
            } else {
                worldBosses.forEach(boss => {
                    const hpPercent = (boss.hp / boss.maxHp) * 100;
                    bossesHtml += `<div class="boss-item" onclick="AdvancedSystems.focusBoss('${boss.id}')">
                        <span class="boss-icon">${boss.icon}</span>
                        <div class="boss-info">
                            <span class="boss-name">${boss.name}</span>
                            <div class="boss-hp-mini">
                                <div class="hp-fill" style="width: ${hpPercent}%"></div>
                            </div>
                        </div>
                        <span class="boss-coords">📍</span>
                    </div>`;
                });
            }
            bossesDiv.innerHTML = bossesHtml;
        },

        showDailyReward: function() {
            const popup = document.getElementById('daily-reward-popup');
            const grid = document.getElementById('daily-rewards-grid');
            const streak = this.events.dailyReward.currentStreak || 1;
            const rewards = this.events.dailyReward.rewards || {};
            
            document.getElementById('daily-streak').innerHTML = `Jour ${streak}/7`;
            
            let html = '';
            for (let day = 1; day <= 7; day++) {
                const reward = rewards[day] || {};
                const isCurrent = day === streak;
                const isPast = day < streak;
                
                html += `<div class="daily-day ${isCurrent ? 'current' : ''} ${isPast ? 'claimed' : ''}">
                    <span class="day-num">Jour ${day}</span>
                    <div class="day-rewards">
                        ${reward.gems ? `<span>${reward.gems} 💎</span>` : ''}
                        ${reward.xp ? `<span>${reward.xp} XP</span>` : ''}
                    </div>
                    ${isPast ? '<span class="check">✓</span>' : ''}
                </div>`;
            }
            
            grid.innerHTML = html;
            popup.classList.remove('hidden');
        },

        claimDailyReward: function() {
            this.sendMessage('daily_claim', {});
            document.getElementById('daily-reward-popup').classList.add('hidden');
        },

        // ============================================
        // TRADING
        // ============================================
        requestTrade: function(targetId) {
            this.sendMessage('trade_request', { targetId });
        },

        acceptTradeRequest: function() {
            this.sendMessage('trade_accept', {});
        },

        declineTradeRequest: function() {
            this.sendMessage('trade_decline', {});
        },

        addItemToTrade: function(slot) {
            this.sendMessage('trade_add_item', { slot });
        },

        removeItemFromTrade: function(slot) {
            this.sendMessage('trade_remove_item', { slot });
        },

        setTradeGems: function() {
            const amount = parseInt(document.getElementById('trade-my-gems').value) || 0;
            this.sendMessage('trade_set_gems', { amount });
        },

        confirmTrade: function() {
            this.sendMessage('trade_confirm', {});
        },

        cancelTrade: function() {
            this.sendMessage('trade_cancel', {});
            this.closePanel('trading');
        },

        // ============================================
        // MINIMAP
        // ============================================
        updateMinimap: function() {
            const canvas = document.getElementById('minimap-canvas');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const size = 150;
            const scale = size / 3000; // World size
            
            ctx.clearRect(0, 0, size, size);
            
            // Background
            ctx.fillStyle = 'rgba(0, 30, 60, 0.8)';
            ctx.fillRect(0, 0, size, size);
            
            // Zones circles
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(size/2, size/2, 200 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(size/2, size/2, 600 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(size/2, size/2, 1000 * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // Player position
            if (window.model && window.model.userTadpole) {
                const px = (window.model.userTadpole.x * scale) + size/2;
                const py = (window.model.userTadpole.y * scale) + size/2;
                
                ctx.fillStyle = '#00ff00';
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Direction arrow
                const angle = window.model.userTadpole.angle || 0;
                ctx.strokeStyle = '#00ff00';
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + Math.cos(angle) * 8, py + Math.sin(angle) * 8);
                ctx.stroke();
            }
            
            // Other players
            if (window.model && window.model.tadpoles) {
                for (const id in window.model.tadpoles) {
                    if (id == window.model.userTadpole?.id) continue;
                    const tp = window.model.tadpoles[id];
                    const px = (tp.x * scale) + size/2;
                    const py = (tp.y * scale) + size/2;
                    
                    ctx.fillStyle = tp.color || '#3399ff';
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // World bosses
            const worldBosses = Array.isArray(this.events?.worldBosses) ? this.events.worldBosses : Object.values(this.events?.worldBosses || {});
        worldBosses.forEach(boss => {
                const bx = (boss.x * scale) + size/2;
                const by = (boss.y * scale) + size/2;
                
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(bx, by, 5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#fff';
                ctx.font = '8px Arial';
                ctx.fillText('💀', bx - 4, by + 3);
            });
        },

        // ============================================
        // QUICK SLOTS
        // ============================================
        quickSlots: [null, null, null, null],
        quickCooldowns: [0, 0, 0, 0],

        setQuickSlot: function(slotIndex, itemId) {
            this.quickSlots[slotIndex - 1] = itemId;
            this.renderQuickSlots();
        },

        useQuickSlot: function(slotIndex) {
            const itemId = this.quickSlots[slotIndex - 1];
            if (!itemId) return;
            
            const now = Date.now();
            if (this.quickCooldowns[slotIndex - 1] > now) return;
            
            this.sendMessage('use_item', { itemId });
        },

        renderQuickSlots: function() {
            for (let i = 1; i <= 4; i++) {
                const slot = document.getElementById('quick-slot-' + i);
                const itemId = this.quickSlots[i - 1];
                
                if (!slot) continue;
                if (itemId && window.GameSystems && window.GameSystems.ITEMS) {
                    const item = window.GameSystems.ITEMS[itemId];
                    slot.textContent = item ? item.icon : '?';
                } else {
                    slot.textContent = '';
                }
            }
        },

        // ============================================
        // BUFF BAR
        // ============================================
        activeBuffs: [],

        addBuff: function(buff) {
            this.activeBuffs.push({
                ...buff,
                startTime: Date.now(),
                endTime: Date.now() + buff.duration
            });
            this.renderBuffs();
        },

        removeBuff: function(buffId) {
            this.activeBuffs = this.activeBuffs.filter(b => b.id !== buffId);
            this.renderBuffs();
        },

        renderBuffs: function() {
            const bar = document.getElementById('buff-bar');
            if (!bar) return;
            
            const now = Date.now();
            this.activeBuffs = this.activeBuffs.filter(b => b.endTime > now);
            
            bar.innerHTML = this.activeBuffs.map(buff => {
                const remaining = Math.ceil((buff.endTime - now) / 1000);
                return `<div class="buff-icon" title="${buff.name}">
                    <span>${buff.icon}</span>
                    <span class="buff-time">${remaining}s</span>
                </div>`;
            }).join('');
        },

        // ============================================
        // DAMAGE NUMBERS
        // ============================================
        showDamageNumber: function(x, y, damage, type = 'normal') {
            const container = document.getElementById('damage-numbers');
            if (!container) return;
            
            const num = document.createElement('div');
            num.className = 'damage-number ' + type;
            num.textContent = type === 'heal' ? '+' + damage : '-' + damage;
            num.style.left = x + 'px';
            num.style.top = y + 'px';
            
            container.appendChild(num);
            
            setTimeout(() => num.remove(), 1000);
        },

        // ============================================
        // NOTIFICATIONS
        // ============================================
        notify: function(message, type = 'info', duration = 3000) {
            const container = document.getElementById('notification-container');
            if (!container) return;
            
            const notif = document.createElement('div');
            notif.className = 'notification ' + type;
            notif.innerHTML = message;
            
            container.appendChild(notif);
            
            setTimeout(() => {
                notif.classList.add('fade-out');
                setTimeout(() => notif.remove(), 300);
            }, duration);
        },

        // ============================================
        // MESSAGE HANDLING
        // ============================================
        sendMessage: function(type, data) {
            if (window.webSocketService && window.webSocketService.send) {
                window.webSocketService.send(JSON.stringify({ type, ...data }));
            }
        },

        handleMessage: function(data) {
            switch(data.type) {
                // Talents
                case 'talents_sync':
                    this.talents = data;
                    if (!document.getElementById('talents-panel').classList.contains('hidden')) {
                        this.renderTalents();
                    }
                    break;
                
                // Achievements
                case 'achievements_sync':
                    this.achievements.list = data.achievements;
                    this.achievements.stats = data.stats;
                    break;
                
                case 'achievement_unlocked':
                    this.achievements.unlocked = this.achievements.unlocked || {};
                    this.achievements.unlocked[data.achievement.id] = true;
                    this.showAchievementPopup(data.achievement);
                    break;
                
                // Crafting
                case 'crafting_sync':
                    this.crafting.recipes = data.recipes;
                    this.crafting.materials = data.materials;
                    this.crafting.inProgress = data.inProgress;
                    if (!document.getElementById('crafting-panel').classList.contains('hidden')) {
                        this.renderCrafting();
                    }
                    break;
                
                case 'craft_started':
                    this.crafting.inProgress = {
                        recipeId: data.recipeId,
                        startTime: Date.now(),
                        endTime: Date.now() + data.craftTime
                    };
                    this.renderCrafting();
                    break;
                
                case 'craft_completed':
                    this.crafting.inProgress = null;
                    this.notify(`✓ Craft terminé: ${data.result.quantity}x ${data.result.item}`, 'success');
                    this.renderCrafting();
                    break;
                
                // Pets
                case 'pets_sync':
                    this.pets.owned = data.ownedPets;
                    this.pets.active = data.activePet;
                    this.pets.types = data.petTypes;
                    if (!document.getElementById('pets-panel').classList.contains('hidden')) {
                        this.renderPets();
                    }
                    break;
                
                case 'pet_obtained':
                    this.notify(`🐾 Nouveau compagnon: ${data.pet.name}!`, 'success');
                    break;
                
                // Leaderboard
                case 'leaderboard_full':
                    this.leaderboard.categories = data.categories;
                    this.leaderboard.data = data.leaderboards;
                    this.leaderboard.playerRanks = data.playerRanks;
                    if (!document.getElementById('leaderboard-panel').classList.contains('hidden')) {
                        this.renderLeaderboard();
                    }
                    break;
                
                // Events
                case 'events_sync':
                    this.events.active = data.activeEvents;
                    this.events.worldBosses = data.worldBosses;
                    this.events.dailyReward = data.dailyReward;
                    if (!document.getElementById('events-panel').classList.contains('hidden')) {
                        this.renderEvents();
                    }
                    break;
                
                case 'event_started':
                    this.events.active.push(data.event);
                    this.notify(`🎉 ${data.event.name} commence!`, 'event');
                    break;
                
                case 'world_boss_spawn':
                    this.events.worldBosses.push(data.boss);
                    this.notify(data.message, 'boss');
                    this.showWorldBossUI(data.boss);
                    break;
                
                case 'world_boss_update':
                    const boss = this.events.worldBosses.find(b => b.id === data.bossId);
                    if (boss) {
                        boss.hp = data.hp;
                        this.updateWorldBossUI(boss);
                    }
                    break;
                
                case 'world_boss_killed':
                    this.events.worldBosses = this.events.worldBosses.filter(b => b.id !== data.bossId);
                    this.notify(`🎉 ${data.bossName} vaincu par ${data.topPlayer}!`, 'boss');
                    this.hideWorldBossUI();
                    break;
                
                case 'daily_reward_claimed':
                    this.events.dailyReward.canClaim = false;
                    this.notify(`🎁 Jour ${data.day}: +${data.reward.gems} 💎, +${data.reward.xp} XP`, 'success');
                    break;
                
                // Trading
                case 'trade_request':
                    this.notify(`📨 ${data.fromName} veut échanger avec vous`, 'trade', 10000);
                    this.trading.requests.push(data);
                    break;
                
                case 'trade_started':
                case 'trade_item_added':
                case 'trade_item_removed':
                case 'trade_gems_changed':
                case 'trade_confirmed':
                    this.trading.active = data.trade;
                    this.openPanel('trading');
                    this.renderTrade();
                    break;
                
                case 'trade_closed':
                    this.trading.active = null;
                    this.closePanel('trading');
                    if (data.reason === 'completed') {
                        this.notify('✓ Échange terminé!', 'success');
                    }
                    break;
                
                // Buffs
                case 'buff_applied':
                    this.addBuff(data.buff);
                    break;
                
                case 'buff_removed':
                    this.removeBuff(data.buffId);
                    break;
            }
        },

        // World Boss UI
        showWorldBossUI: function(boss) {
            const ui = document.getElementById('world-boss-ui');
            document.getElementById('boss-icon').textContent = boss.icon;
            document.getElementById('boss-name').textContent = boss.name;
            this.updateWorldBossUI(boss);
            ui.classList.remove('hidden');
        },

        updateWorldBossUI: function(boss) {
            const percent = (boss.hp / boss.maxHp) * 100;
            document.getElementById('boss-hp-fill').style.width = percent + '%';
            document.getElementById('boss-hp-text').textContent = 
                `${Math.floor(boss.hp).toLocaleString()} / ${boss.maxHp.toLocaleString()}`;
        },

        hideWorldBossUI: function() {
            document.getElementById('world-boss-ui').classList.add('hidden');
        },

        renderTrade: function() {
            const trade = this.trading.active;
            if (!trade) return;
            
            const myId = window.model?.userTadpole?.id;
            const mySide = trade.player1.id === myId ? 'player1' : 'player2';
            const theirSide = mySide === 'player1' ? 'player2' : 'player1';
            
            // My items
            let myHtml = '';
            trade[mySide].items.forEach(item => {
                myHtml += `<div class="trade-item" onclick="AdvancedSystems.removeItemFromTrade(${item.slot})">
                    ${item.item.icon || '📦'} ${item.item.name || item.item.id}
                </div>`;
            });
            document.getElementById('trade-my-items').innerHTML = myHtml || '<div class="empty">Cliquez sur un item de votre inventaire</div>';
            document.getElementById('trade-my-gems').value = trade[mySide].gems;
            
            // Their items
            let theirHtml = '';
            trade[theirSide].items.forEach(item => {
                theirHtml += `<div class="trade-item">
                    ${item.item.icon || '📦'} ${item.item.name || item.item.id}
                </div>`;
            });
            document.getElementById('trade-their-items').innerHTML = theirHtml || '<div class="empty">En attente...</div>';
            document.getElementById('trade-their-gems').textContent = trade[theirSide].gems;
            
            // Confirm button state
            const btn = document.getElementById('trade-confirm-btn');
            if (trade[mySide].confirmed) {
                btn.textContent = '✓ Confirmé';
                btn.disabled = true;
            } else {
                btn.textContent = '✓ Confirmer';
                btn.disabled = false;
            }
        },

        // ============================================
        // UPDATE LOOP
        // ============================================
        update: function() {
            this.updateMinimap();
            this.renderBuffs();
            
            // Update craft progress
            if (this.crafting.inProgress) {
                const now = Date.now();
                if (now >= this.crafting.inProgress.endTime) {
                    // Server will notify completion
                }
            }
        }
    };

    // Initialize when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => AdvancedSystems.init());
    } else {
        AdvancedSystems.init();
    }

    // Update loop
    setInterval(() => AdvancedSystems.update(), 100);

})();
