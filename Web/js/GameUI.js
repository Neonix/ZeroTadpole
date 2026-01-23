/**
 * ZeroTadpole - GameUI v5.0
 * Interface utilisateur complète compatible mobile/desktop
 * Panels: Talents, Achievements, Leaderboard, Crafting, Pets, Trading, Events
 */

(function() {
    'use strict';

    window.GameUI = {
        // État
        activePanel: null,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        touchStartY: 0,
        
        // Données du serveur
        data: {
            talents: null,
            achievements: null,
            leaderboards: null,
            crafting: null,
            pets: null,
            events: null,
            dailyReward: null,
            trade: null
        },

        // Initialisation
        init: function() {
            this.createPanels();
            this.bindEvents();
            this.setupMessageHandlers();
            console.log('[GameUI] Initialized, mobile:', this.isMobile);
        },

        // Créer les panels HTML
        createPanels: function() {
            var panelsHTML = `
                <!-- Boutons rapides -->
                <div id="quick-buttons" class="quick-buttons">
                    <button class="quick-btn" data-panel="talents" title="Talents">🌟</button>
                    <button class="quick-btn" data-panel="achievements" title="Succès">🏆</button>
                    <button class="quick-btn" data-panel="leaderboard" title="Classement">📊</button>
                    <button class="quick-btn" data-panel="crafting" title="Fabrication">🔨</button>
                    <button class="quick-btn" data-panel="pets" title="Pets">🐾</button>
                    <button class="quick-btn" data-panel="events" title="Events">🎉</button>
                </div>

                <!-- Panel Talents -->
                <div id="panel-talents" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>🌟 Talents</h2>
                        <span class="talent-points">Points: <span id="talent-points">0</span></span>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="talent-trees" id="talent-trees"></div>
                        <button id="reset-talents" class="btn btn-danger">Reset (100 💎)</button>
                    </div>
                </div>

                <!-- Panel Achievements -->
                <div id="panel-achievements" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>🏆 Succès</h2>
                        <span id="achievement-count">0/0</span>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="achievement-categories" id="achievement-categories">
                            <button class="cat-btn active" data-cat="all">Tous</button>
                            <button class="cat-btn" data-cat="combat">Combat</button>
                            <button class="cat-btn" data-cat="exploration">Exploration</button>
                            <button class="cat-btn" data-cat="progression">Progression</button>
                            <button class="cat-btn" data-cat="social">Social</button>
                        </div>
                        <div class="achievement-list" id="achievement-list"></div>
                    </div>
                </div>

                <!-- Panel Leaderboard -->
                <div id="panel-leaderboard" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>📊 Classement</h2>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="leaderboard-tabs" id="leaderboard-tabs"></div>
                        <div class="leaderboard-list" id="leaderboard-list"></div>
                        <div class="leaderboard-player" id="leaderboard-player"></div>
                    </div>
                </div>

                <!-- Panel Crafting -->
                <div id="panel-crafting" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>🔨 Fabrication</h2>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="craft-categories" id="craft-categories"></div>
                        <div class="craft-list" id="craft-list"></div>
                        <div class="craft-progress hidden" id="craft-progress">
                            <div class="progress-bar"><div class="progress-fill"></div></div>
                            <span class="progress-text">Fabrication...</span>
                            <button id="cancel-craft" class="btn btn-small">Annuler</button>
                        </div>
                    </div>
                </div>

                <!-- Panel Pets -->
                <div id="panel-pets" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>🐾 Compagnons</h2>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="active-pet" id="active-pet">
                            <span class="no-pet">Aucun compagnon actif</span>
                        </div>
                        <div class="pet-list" id="pet-list"></div>
                    </div>
                </div>

                <!-- Panel Events -->
                <div id="panel-events" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>🎉 Événements</h2>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="daily-reward" id="daily-reward"></div>
                        <div class="active-events" id="active-events"></div>
                        <div class="world-bosses" id="world-bosses"></div>
                    </div>
                </div>

                <!-- Panel Trading -->
                <div id="panel-trading" class="game-panel hidden">
                    <div class="panel-header">
                        <h2>🤝 Échange</h2>
                        <button class="panel-close">✕</button>
                    </div>
                    <div class="panel-content">
                        <div class="trade-container">
                            <div class="trade-side trade-mine" id="trade-mine">
                                <h3>Mes offres</h3>
                                <div class="trade-items"></div>
                                <div class="trade-gems">
                                    <input type="number" id="trade-gems-input" min="0" value="0">
                                    <span>💎</span>
                                </div>
                            </div>
                            <div class="trade-side trade-theirs" id="trade-theirs">
                                <h3>Leur offre</h3>
                                <div class="trade-items"></div>
                                <div class="trade-gems"><span id="their-gems">0</span> 💎</div>
                            </div>
                        </div>
                        <div class="trade-actions">
                            <button id="trade-confirm" class="btn btn-success">✓ Confirmer</button>
                            <button id="trade-cancel" class="btn btn-danger">✕ Annuler</button>
                        </div>
                    </div>
                </div>

                <!-- Mini-map -->
                <div id="minimap" class="minimap">
                    <canvas id="minimap-canvas" width="150" height="150"></canvas>
                </div>

                <!-- Notifications -->
                <div id="notifications" class="notifications"></div>

                <!-- Achievement Popup -->
                <div id="achievement-popup" class="achievement-popup hidden">
                    <div class="achievement-icon"></div>
                    <div class="achievement-info">
                        <span class="achievement-title">Succès débloqué !</span>
                        <span class="achievement-name"></span>
                    </div>
                </div>
            `;

            var container = document.createElement('div');
            container.id = 'game-ui-panels';
            container.innerHTML = panelsHTML;
            document.body.appendChild(container);
        },

        // Bind des événements
        bindEvents: function() {
            var self = this;

            // Quick buttons
            document.querySelectorAll('.quick-btn').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.togglePanel(this.dataset.panel);
                });
            });

            // Close buttons
            document.querySelectorAll('.panel-close').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    self.closeAllPanels();
                });
            });

            // Fermer en cliquant à l'extérieur
            document.addEventListener('click', function(e) {
                if (self.activePanel && !e.target.closest('.game-panel') && !e.target.closest('.quick-btn')) {
                    self.closeAllPanels();
                }
            });

            // Talent reset
            document.getElementById('reset-talents')?.addEventListener('click', function() {
                if (confirm('Réinitialiser tous les talents pour 100 💎 ?')) {
                    self.sendMessage({ type: 'talent_reset' });
                }
            });

            // Cancel craft
            document.getElementById('cancel-craft')?.addEventListener('click', function() {
                self.sendMessage({ type: 'craft_cancel' });
            });

            // Trade confirm/cancel
            document.getElementById('trade-confirm')?.addEventListener('click', function() {
                self.sendMessage({ type: 'trade_confirm' });
            });
            document.getElementById('trade-cancel')?.addEventListener('click', function() {
                self.sendMessage({ type: 'trade_cancel' });
            });

            // Trade gems input
            document.getElementById('trade-gems-input')?.addEventListener('change', function() {
                self.sendMessage({ type: 'trade_set_gems', amount: parseInt(this.value) || 0 });
            });

            // Achievement categories
            document.querySelectorAll('.cat-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    self.filterAchievements(this.dataset.cat);
                });
            });

            // Touch support pour les panels (swipe down to close)
            document.querySelectorAll('.game-panel').forEach(function(panel) {
                panel.addEventListener('touchstart', function(e) {
                    self.touchStartY = e.touches[0].clientY;
                });
                panel.addEventListener('touchmove', function(e) {
                    var diff = e.touches[0].clientY - self.touchStartY;
                    if (diff > 100) {
                        self.closeAllPanels();
                    }
                });
            });
        },

        // Handlers de messages serveur
        setupMessageHandlers: function() {
            var self = this;
            
            // Hook into WebSocketService
            if (window.webSocketService) {
                var originalProcess = window.webSocketService.processMessage;
                window.webSocketService.processMessage = function(data) {
                    self.handleServerMessage(data);
                    originalProcess.call(window.webSocketService, data);
                };
            }
        },

        handleServerMessage: function(data) {
            if (!data || !data.type) return;

            switch(data.type) {
                case 'talents_sync':
                    this.data.talents = data;
                    this.renderTalents();
                    break;
                case 'talent_result':
                    if (data.result && data.result.success) {
                        this.showNotification('✨ Talent appris !', 'success');
                    }
                    break;
                case 'achievements_sync':
                    this.data.achievements = data;
                    this.renderAchievements();
                    break;
                case 'achievement_unlocked':
                    this.showAchievementPopup(data.achievement);
                    break;
                case 'leaderboard_full':
                    this.data.leaderboards = data;
                    this.renderLeaderboard();
                    break;
                case 'crafting_sync':
                    this.data.crafting = data;
                    this.renderCrafting();
                    break;
                case 'craft_started':
                    this.startCraftProgress(data);
                    break;
                case 'craft_completed':
                    this.endCraftProgress(data);
                    this.showNotification('🔨 ' + (data.result?.item || 'Item') + ' fabriqué !', 'success');
                    break;
                case 'pets_sync':
                    this.data.pets = data;
                    this.renderPets();
                    break;
                case 'pet_obtained':
                    this.showNotification('🐾 Nouveau compagnon: ' + data.pet.name, 'success');
                    break;
                case 'events_sync':
                    this.data.events = data;
                    this.renderEvents();
                    break;
                case 'daily_reward_claimed':
                    this.showNotification('🎁 Récompense réclamée !', 'success');
                    break;
                case 'event_started':
                    this.showNotification('🎉 ' + data.event.name + ' commence !', 'event');
                    break;
                case 'world_boss_spawn':
                    this.showNotification('🐉 ' + data.message, 'boss');
                    break;
                case 'trade_request':
                    this.showTradeRequest(data);
                    break;
                case 'trade_started':
                case 'trade_item_added':
                case 'trade_item_removed':
                case 'trade_gems_changed':
                case 'trade_confirmed':
                    this.data.trade = data.trade;
                    this.renderTrade();
                    if (data.type === 'trade_started') {
                        this.openPanel('trading');
                    }
                    break;
                case 'trade_closed':
                    this.closePanel('trading');
                    if (data.reason === 'completed') {
                        this.showNotification('✅ Échange réussi !', 'success');
                    }
                    break;
            }
        },

        // Toggle panel
        togglePanel: function(panelId) {
            if (this.activePanel === panelId) {
                this.closeAllPanels();
            } else {
                this.openPanel(panelId);
            }
        },

        openPanel: function(panelId) {
            this.closeAllPanels();
            var panel = document.getElementById('panel-' + panelId);
            if (panel) {
                panel.classList.remove('hidden');
                this.activePanel = panelId;
                
                // Request data update
                this.requestPanelData(panelId);
            }
        },

        closePanel: function(panelId) {
            var panel = document.getElementById('panel-' + panelId);
            if (panel) {
                panel.classList.add('hidden');
            }
            if (this.activePanel === panelId) {
                this.activePanel = null;
            }
        },

        closeAllPanels: function() {
            document.querySelectorAll('.game-panel').forEach(function(panel) {
                panel.classList.add('hidden');
            });
            this.activePanel = null;
        },

        requestPanelData: function(panelId) {
            switch(panelId) {
                case 'leaderboard':
                    this.sendMessage({ type: 'leaderboard_request' });
                    break;
                case 'achievements':
                    this.sendMessage({ type: 'achievements_request' });
                    break;
            }
        },

        // Render Talents
        renderTalents: function() {
            if (!this.data.talents) return;
            
            var container = document.getElementById('talent-trees');
            var pointsEl = document.getElementById('talent-points');
            
            if (pointsEl) pointsEl.textContent = this.data.talents.points || 0;
            if (!container) return;
            
            var html = '';
            var definitions = this.data.talents.definitions || {};
            var playerTrees = this.data.talents.trees || {};
            
            for (var treeName in definitions) {
                var tree = definitions[treeName];
                html += '<div class="talent-tree">';
                html += '<h3>' + tree.name + '</h3>';
                html += '<div class="talent-list">';
                
                for (var talentId in tree.talents) {
                    var talent = tree.talents[talentId];
                    var currentRank = (playerTrees[treeName] && playerTrees[treeName][talentId]) || 0;
                    var isMaxed = currentRank >= talent.maxRank;
                    var canLearn = this.data.talents.points > 0 && !isMaxed;
                    
                    html += '<div class="talent ' + (isMaxed ? 'maxed' : '') + (canLearn ? ' learnable' : '') + '" ';
                    html += 'data-tree="' + treeName + '" data-talent="' + talentId + '">';
                    html += '<span class="talent-icon">' + talent.icon + '</span>';
                    html += '<span class="talent-name">' + talent.name + '</span>';
                    html += '<span class="talent-rank">' + currentRank + '/' + talent.maxRank + '</span>';
                    html += '</div>';
                }
                
                html += '</div></div>';
            }
            
            container.innerHTML = html;
            
            // Bind talent clicks
            var self = this;
            container.querySelectorAll('.talent.learnable').forEach(function(el) {
                el.addEventListener('click', function() {
                    self.sendMessage({
                        type: 'talent_learn',
                        tree: this.dataset.tree,
                        talent: this.dataset.talent
                    });
                });
            });
        },

        // Render Achievements
        renderAchievements: function() {
            if (!this.data.achievements) return;
            
            var container = document.getElementById('achievement-list');
            var countEl = document.getElementById('achievement-count');
            
            if (countEl) {
                countEl.textContent = this.data.achievements.totalUnlocked + '/' + this.data.achievements.totalAchievements;
            }
            
            if (!container) return;
            
            var achievements = this.data.achievements.achievements || {};
            var html = '';
            
            for (var id in achievements) {
                var ach = achievements[id];
                var unlocked = ach.unlocked;
                
                html += '<div class="achievement ' + (unlocked ? 'unlocked' : 'locked') + '" data-category="' + ach.category + '">';
                html += '<span class="ach-icon">' + ach.icon + '</span>';
                html += '<div class="ach-info">';
                html += '<span class="ach-name">' + ach.name + '</span>';
                html += '<span class="ach-desc">' + ach.description + '</span>';
                html += '</div>';
                if (unlocked) {
                    html += '<span class="ach-check">✓</span>';
                }
                html += '</div>';
            }
            
            container.innerHTML = html;
        },

        filterAchievements: function(category) {
            document.querySelectorAll('.achievement').forEach(function(el) {
                if (category === 'all' || el.dataset.category === category) {
                    el.style.display = '';
                } else {
                    el.style.display = 'none';
                }
            });
        },

        // Render Leaderboard
        renderLeaderboard: function() {
            if (!this.data.leaderboards) return;
            
            var tabsContainer = document.getElementById('leaderboard-tabs');
            var listContainer = document.getElementById('leaderboard-list');
            var playerContainer = document.getElementById('leaderboard-player');
            
            if (!tabsContainer || !listContainer) return;
            
            var categories = this.data.leaderboards.categories || {};
            var leaderboards = this.data.leaderboards.leaderboards || {};
            var playerRanks = this.data.leaderboards.playerRanks || {};
            
            // Tabs
            var tabsHtml = '';
            var firstCat = null;
            for (var cat in categories) {
                if (!firstCat) firstCat = cat;
                tabsHtml += '<button class="lb-tab" data-cat="' + cat + '">' + categories[cat].icon + '</button>';
            }
            tabsContainer.innerHTML = tabsHtml;
            
            // Bind tabs
            var self = this;
            tabsContainer.querySelectorAll('.lb-tab').forEach(function(tab) {
                tab.addEventListener('click', function() {
                    tabsContainer.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    self.showLeaderboardCategory(this.dataset.cat);
                });
            });
            
            // Show first category
            if (firstCat) {
                tabsContainer.querySelector('.lb-tab').classList.add('active');
                this.showLeaderboardCategory(firstCat);
            }
        },

        showLeaderboardCategory: function(category) {
            var listContainer = document.getElementById('leaderboard-list');
            var playerContainer = document.getElementById('leaderboard-player');
            
            if (!listContainer || !this.data.leaderboards) return;
            
            var lb = this.data.leaderboards.leaderboards[category];
            var entries = lb ? lb.entries : [];
            var playerRank = this.data.leaderboards.playerRanks[category];
            
            var html = '';
            entries.forEach(function(entry, i) {
                var rankIcon = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : (i + 1)));
                html += '<div class="lb-entry">';
                html += '<span class="lb-rank">' + rankIcon + '</span>';
                html += '<span class="lb-name" style="color:' + (entry.color || '#fff') + '">' + entry.name + '</span>';
                html += '<span class="lb-score">' + entry.score + '</span>';
                html += '</div>';
            });
            
            listContainer.innerHTML = html || '<div class="empty">Aucun classement</div>';
            
            if (playerContainer && playerRank) {
                playerContainer.innerHTML = '<div class="your-rank">Votre rang: #' + (playerRank.rank || '?') + ' (' + (playerRank.score || 0) + ')</div>';
            }
        },

        // Render Crafting
        renderCrafting: function() {
            if (!this.data.crafting) return;
            
            var catContainer = document.getElementById('craft-categories');
            var listContainer = document.getElementById('craft-list');
            
            if (!catContainer || !listContainer) return;
            
            var categories = this.data.crafting.categories || {};
            var recipes = this.data.crafting.recipes || {};
            
            // Categories
            var catHtml = '';
            for (var cat in categories) {
                catHtml += '<button class="craft-cat" data-cat="' + cat + '">' + categories[cat].name + '</button>';
            }
            catContainer.innerHTML = catHtml;
            
            // Bind categories
            var self = this;
            catContainer.querySelectorAll('.craft-cat').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    catContainer.querySelectorAll('.craft-cat').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    self.showCraftCategory(this.dataset.cat);
                });
            });
            
            // Show all recipes initially
            this.showCraftCategory('all');
        },

        showCraftCategory: function(category) {
            var listContainer = document.getElementById('craft-list');
            if (!listContainer || !this.data.crafting) return;
            
            var recipes = this.data.crafting.recipes || {};
            var html = '';
            
            for (var id in recipes) {
                var recipe = recipes[id];
                if (category !== 'all' && recipe.category !== category) continue;
                
                var canCraft = recipe.canCraft;
                
                html += '<div class="craft-recipe ' + (canCraft ? 'craftable' : 'locked') + '" data-recipe="' + id + '">';
                html += '<span class="recipe-name">' + recipe.name + '</span>';
                html += '<div class="recipe-ingredients">';
                for (var ing in recipe.ingredients) {
                    var qty = recipe.ingredients[ing];
                    html += '<span class="ingredient">' + ing + ' x' + qty + '</span>';
                }
                html += '</div>';
                html += '<span class="recipe-result">→ ' + recipe.result.item + ' x' + recipe.result.quantity + '</span>';
                if (canCraft) {
                    html += '<button class="btn-craft">Fabriquer</button>';
                } else {
                    html += '<span class="craft-reason">' + (recipe.reason || 'Non disponible') + '</span>';
                }
                html += '</div>';
            }
            
            listContainer.innerHTML = html || '<div class="empty">Aucune recette</div>';
            
            // Bind craft buttons
            var self = this;
            listContainer.querySelectorAll('.btn-craft').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var recipe = this.closest('.craft-recipe').dataset.recipe;
                    self.sendMessage({ type: 'craft_start', recipeId: recipe });
                });
            });
        },

        startCraftProgress: function(data) {
            var progress = document.getElementById('craft-progress');
            if (!progress) return;
            
            progress.classList.remove('hidden');
            var fill = progress.querySelector('.progress-fill');
            var text = progress.querySelector('.progress-text');
            
            var duration = data.craftTime || 3000;
            var start = Date.now();
            
            var interval = setInterval(function() {
                var elapsed = Date.now() - start;
                var percent = Math.min(100, (elapsed / duration) * 100);
                fill.style.width = percent + '%';
                text.textContent = 'Fabrication... ' + Math.round(percent) + '%';
                
                if (percent >= 100) {
                    clearInterval(interval);
                }
            }, 50);
            
            this.craftInterval = interval;
        },

        endCraftProgress: function(data) {
            var progress = document.getElementById('craft-progress');
            if (progress) progress.classList.add('hidden');
            if (this.craftInterval) clearInterval(this.craftInterval);
        },

        // Render Pets
        renderPets: function() {
            if (!this.data.pets) return;
            
            var activeContainer = document.getElementById('active-pet');
            var listContainer = document.getElementById('pet-list');
            
            if (!listContainer) return;
            
            var ownedPets = this.data.pets.ownedPets || {};
            var activePetId = this.data.pets.activePet;
            
            // Active pet
            if (activeContainer) {
                if (activePetId && ownedPets[activePetId]) {
                    var pet = ownedPets[activePetId];
                    activeContainer.innerHTML = '<div class="pet-active-display">' +
                        '<span class="pet-icon">' + pet.icon + '</span>' +
                        '<span class="pet-name">' + pet.name + '</span>' +
                        '<span class="pet-level">Nv.' + pet.level + '</span>' +
                        '<button class="btn-deactivate">Ranger</button>' +
                        '</div>';
                    
                    var self = this;
                    activeContainer.querySelector('.btn-deactivate').addEventListener('click', function() {
                        self.sendMessage({ type: 'pet_deactivate' });
                    });
                } else {
                    activeContainer.innerHTML = '<span class="no-pet">Aucun compagnon actif</span>';
                }
            }
            
            // Pet list
            var html = '';
            for (var id in ownedPets) {
                var pet = ownedPets[id];
                var isActive = id === activePetId;
                
                html += '<div class="pet-card ' + pet.rarity + (isActive ? ' active' : '') + '" data-pet="' + id + '">';
                html += '<span class="pet-icon">' + pet.icon + '</span>';
                html += '<div class="pet-info">';
                html += '<span class="pet-name">' + pet.name + '</span>';
                html += '<span class="pet-level">Niveau ' + pet.level + '</span>';
                html += '<div class="pet-stats">❤️' + pet.stats.hp + ' ⚔️' + pet.stats.damage + '</div>';
                html += '</div>';
                if (!isActive) {
                    html += '<button class="btn-activate">Invoquer</button>';
                }
                html += '</div>';
            }
            
            listContainer.innerHTML = html || '<div class="empty">Aucun compagnon</div>';
            
            // Bind activate buttons
            var self = this;
            listContainer.querySelectorAll('.btn-activate').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var petId = this.closest('.pet-card').dataset.pet;
                    self.sendMessage({ type: 'pet_activate', petId: petId });
                });
            });
        },

        // Render Events
        renderEvents: function() {
            if (!this.data.events) return;
            
            var dailyContainer = document.getElementById('daily-reward');
            var eventsContainer = document.getElementById('active-events');
            var bossesContainer = document.getElementById('world-bosses');
            
            // Daily Reward
            if (dailyContainer && this.data.events.dailyReward) {
                var daily = this.data.events.dailyReward;
                var html = '<div class="daily-box">';
                html += '<h3>🎁 Récompense Journalière</h3>';
                html += '<div class="daily-streak">Série: ' + daily.currentStreak + '/7 jours</div>';
                
                if (daily.canClaim) {
                    html += '<div class="daily-today">Aujourd\'hui: ' + daily.todayReward.gems + '💎 + ' + daily.todayReward.xp + ' XP</div>';
                    html += '<button id="claim-daily" class="btn btn-success">Réclamer</button>';
                } else {
                    html += '<div class="daily-claimed">✓ Réclamé aujourd\'hui</div>';
                }
                
                html += '</div>';
                dailyContainer.innerHTML = html;
                
                var self = this;
                var claimBtn = document.getElementById('claim-daily');
                if (claimBtn) {
                    claimBtn.addEventListener('click', function() {
                        self.sendMessage({ type: 'daily_claim' });
                    });
                }
            }
            
            // Active Events
            if (eventsContainer) {
                var events = this.data.events.activeEvents || [];
                var html = '<h3>🎉 Événements Actifs</h3>';
                
                if (events.length > 0) {
                    events.forEach(function(evt) {
                        var remaining = Math.max(0, evt.endTime - Math.floor(Date.now() / 1000));
                        var mins = Math.floor(remaining / 60);
                        html += '<div class="event-card">';
                        html += '<span class="event-icon">' + evt.icon + '</span>';
                        html += '<div class="event-info">';
                        html += '<span class="event-name">' + evt.name + '</span>';
                        html += '<span class="event-desc">' + evt.description + '</span>';
                        html += '<span class="event-time">⏱️ ' + mins + ' min</span>';
                        html += '</div></div>';
                    });
                } else {
                    html += '<div class="no-events">Aucun événement actif</div>';
                }
                
                eventsContainer.innerHTML = html;
            }
            
            // World Bosses
            if (bossesContainer) {
                var bosses = this.data.events.worldBosses || [];
                var html = '<h3>🐉 Boss Mondiaux</h3>';
                
                if (bosses.length > 0) {
                    bosses.forEach(function(boss) {
                        var hpPercent = (boss.hp / boss.maxHp) * 100;
                        html += '<div class="boss-card">';
                        html += '<span class="boss-icon">' + boss.icon + '</span>';
                        html += '<div class="boss-info">';
                        html += '<span class="boss-name">' + boss.name + '</span>';
                        html += '<div class="boss-hp"><div class="hp-fill" style="width:' + hpPercent + '%"></div></div>';
                        html += '<span class="boss-location">📍 X:' + Math.round(boss.x) + ' Y:' + Math.round(boss.y) + '</span>';
                        html += '</div></div>';
                    });
                } else {
                    html += '<div class="no-bosses">Aucun boss actif</div>';
                }
                
                bossesContainer.innerHTML = html;
            }
        },

        // Render Trade
        renderTrade: function() {
            if (!this.data.trade) return;
            
            var mineContainer = document.querySelector('#trade-mine .trade-items');
            var theirsContainer = document.querySelector('#trade-theirs .trade-items');
            var theirGems = document.getElementById('their-gems');
            
            if (!mineContainer || !theirsContainer) return;
            
            var trade = this.data.trade;
            var myId = window.model?.userTadpole?.id;
            
            var mySide = trade.player1.id === myId ? trade.player1 : trade.player2;
            var theirSide = trade.player1.id === myId ? trade.player2 : trade.player1;
            
            // My items
            var myHtml = '';
            mySide.items.forEach(function(item) {
                myHtml += '<div class="trade-item" data-slot="' + item.slot + '">';
                myHtml += '<span>' + item.item.name + '</span>';
                myHtml += '<button class="remove-item">✕</button>';
                myHtml += '</div>';
            });
            mineContainer.innerHTML = myHtml || '<div class="empty-trade">Cliquez sur un item de l\'inventaire pour l\'ajouter</div>';
            
            // Their items
            var theirHtml = '';
            theirSide.items.forEach(function(item) {
                theirHtml += '<div class="trade-item">';
                theirHtml += '<span>' + item.item.name + '</span>';
                theirHtml += '</div>';
            });
            theirsContainer.innerHTML = theirHtml || '<div class="empty-trade">En attente...</div>';
            
            // Gems
            if (theirGems) theirGems.textContent = theirSide.gems;
            
            // Confirmations
            var confirmBtn = document.getElementById('trade-confirm');
            if (confirmBtn) {
                if (mySide.confirmed) {
                    confirmBtn.textContent = '✓ Confirmé';
                    confirmBtn.disabled = true;
                } else {
                    confirmBtn.textContent = '✓ Confirmer';
                    confirmBtn.disabled = false;
                }
            }
            
            // Bind remove buttons
            var self = this;
            mineContainer.querySelectorAll('.remove-item').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var slot = this.closest('.trade-item').dataset.slot;
                    self.sendMessage({ type: 'trade_remove_item', slot: parseInt(slot) });
                });
            });
        },

        showTradeRequest: function(data) {
            var html = '<div class="trade-request-popup">' +
                '<p>🤝 ' + data.fromName + ' veut échanger avec vous</p>' +
                '<button class="btn btn-success accept-trade">Accepter</button>' +
                '<button class="btn btn-danger decline-trade">Refuser</button>' +
                '</div>';
            
            this.showNotification(html, 'trade', 15000);
            
            var self = this;
            setTimeout(function() {
                var popup = document.querySelector('.trade-request-popup');
                if (popup) {
                    popup.querySelector('.accept-trade').addEventListener('click', function() {
                        self.sendMessage({ type: 'trade_accept' });
                        popup.closest('.notification').remove();
                    });
                    popup.querySelector('.decline-trade').addEventListener('click', function() {
                        self.sendMessage({ type: 'trade_decline' });
                        popup.closest('.notification').remove();
                    });
                }
            }, 100);
        },

        // Notifications
        showNotification: function(message, type, duration) {
            type = type || 'info';
            duration = duration || 3000;
            
            var container = document.getElementById('notifications');
            if (!container) return;
            
            var notif = document.createElement('div');
            notif.className = 'notification notification-' + type;
            notif.innerHTML = message;
            container.appendChild(notif);
            
            setTimeout(function() {
                notif.classList.add('fade-out');
                setTimeout(function() {
                    notif.remove();
                }, 300);
            }, duration);
        },

        showAchievementPopup: function(achievement) {
            var popup = document.getElementById('achievement-popup');
            if (!popup) return;
            
            popup.querySelector('.achievement-icon').textContent = achievement.icon;
            popup.querySelector('.achievement-name').textContent = achievement.name;
            popup.classList.remove('hidden');
            popup.classList.add('show');
            
            setTimeout(function() {
                popup.classList.remove('show');
                popup.classList.add('hidden');
            }, 4000);
        },

        // Mini-map
        updateMinimap: function() {
            var canvas = document.getElementById('minimap-canvas');
            if (!canvas) return;
            
            var ctx = canvas.getContext('2d');
            var size = 150;
            var scale = 0.05; // 1 pixel = 20 units
            
            ctx.fillStyle = '#1a2a3a';
            ctx.fillRect(0, 0, size, size);
            
            var player = window.model?.userTadpole;
            if (!player) return;
            
            var centerX = size / 2;
            var centerY = size / 2;
            
            // Draw zones
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            [200, 400, 800].forEach(function(radius) {
                ctx.beginPath();
                ctx.arc(centerX - player.x * scale, centerY - player.y * scale, radius * scale, 0, Math.PI * 2);
                ctx.stroke();
            });
            
            // Draw mobs
            if (window.GameSystems?.combat?.mobs) {
                ctx.fillStyle = '#ff4444';
                window.GameSystems.combat.mobs.forEach(function(mob) {
                    var x = centerX + (mob.x - player.x) * scale;
                    var y = centerY + (mob.y - player.y) * scale;
                    if (x >= 0 && x <= size && y >= 0 && y <= size) {
                        ctx.beginPath();
                        ctx.arc(x, y, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
            
            // Draw other players
            if (window.model?.tadpoles) {
                ctx.fillStyle = '#44ff44';
                for (var id in window.model.tadpoles) {
                    if (id == player.id) continue;
                    var other = window.model.tadpoles[id];
                    var x = centerX + (other.x - player.x) * scale;
                    var y = centerY + (other.y - player.y) * scale;
                    if (x >= 0 && x <= size && y >= 0 && y <= size) {
                        ctx.beginPath();
                        ctx.arc(x, y, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            
            // Draw player (center)
            ctx.fillStyle = '#4488ff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
            ctx.fill();
        },

        // Send message helper
        sendMessage: function(msg) {
            if (window.webSocketService && window.webSocketService.send) {
                window.webSocketService.send(JSON.stringify(msg));
            }
        }
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.GameUI.init();
        });
    } else {
        window.GameUI.init();
    }

    // Update minimap every 500ms
    setInterval(function() {
        window.GameUI.updateMinimap();
    }, 500);

})();
