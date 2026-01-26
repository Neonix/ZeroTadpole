/**
 * ZeroTadpole - Enhanced Game Controller
 * Modern, responsive game interface with virtual joystick support
 */

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================
    
    const CONFIG = {
        debug: false,
        frameRate: 30,
        loadingDuration: 2000,
        toastDuration: 2500,
        chatMaxMessages: 20,
        chatFadeDelay: 8000,
        boostDuration: 1000,
        boostCooldown: 5000,
        joystickDeadzone: 0.15,
        joystickMaxDistance: 50,
        touchThreshold: 10
    };

    // ============================================
    // State
    // ============================================
    
    const state = {
        app: null,
        settings: null,
        isMobile: false,
        isTouch: false,
        isFullscreen: false,
        chatOpen: false,
        currentPanel: null,
        soundEnabled: true,
        joystick: {
            active: false,
            baseX: 0,
            baseY: 0,
            stickX: 0,
            stickY: 0,
            angle: 0,
            distance: 0
        },
        touch: {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            isMoving: false
        }
    };

    // UI shared state (spell equip mode, etc.)
    window.uiState = window.uiState || {
        pendingEquipSpellId: null,
        pendingEquipFromInvSlot: null,
        _pendingBagEl: null
    };

    // ============================================
    // DOM Elements Cache
    // ============================================
    
    const dom = {};

    function cacheDOMElements() {
        dom.loadingScreen = document.getElementById('loading-screen');
        dom.canvas = document.getElementById('canvas');
        dom.gameUI = document.getElementById('game-ui');
        
        // HUD
        dom.menuBtn = document.getElementById('menu-btn');
        dom.fullscreenBtn = document.getElementById('fullscreen-btn');
        dom.profileBtn = document.getElementById('profile-btn');
        dom.playerCountValue = document.getElementById('player-count-value');
        dom.scoreValue = document.getElementById('score-value');
        dom.gemsValue = document.getElementById('gems-value');
        dom.boostFill = document.getElementById('boost-fill');
        dom.questFill = document.getElementById('quest-fill');
        dom.questProgress = document.getElementById('quest-progress');
        
        // Panels
        dom.menuPanel = document.getElementById('menu-panel');
        dom.profilePanel = document.getElementById('profile-panel');
        dom.helpPanel = document.getElementById('help-panel');
        dom.playersPanel = document.getElementById('players-panel');
        dom.introPanel = document.getElementById('intro-panel');
        
        // Profile
        dom.profileNameDisplay = document.getElementById('profile-name-display');
        dom.profileColor = document.getElementById('profile-color');
        dom.profileSave = document.getElementById('profile-save');
        dom.colorSwatches = document.getElementById('color-swatches');
        dom.previewCanvas = document.getElementById('preview-canvas');
        
        // Intro
        dom.introName = document.getElementById('intro-name');
        dom.introStart = document.getElementById('intro-start');
        dom.introForm = document.getElementById('intro-form');
        dom.introContinue = document.getElementById('intro-continue');
        dom.introCloseBtn = document.getElementById('intro-close-btn');
        dom.npcText = document.getElementById('npc-text');
        
        // Color unlock panel
        dom.colorUnlockPanel = document.getElementById('color-unlock-panel');
        dom.unlockColor = document.getElementById('unlock-color');
        dom.unlockColorSwatches = document.getElementById('unlock-color-swatches');
        dom.unlockPreviewCanvas = document.getElementById('unlock-preview-canvas');
        dom.unlockColorSave = document.getElementById('unlock-color-save');
        
        // Chat
        dom.chatContainer = document.getElementById('chat-container');
        dom.chatLog = document.getElementById('chat-log');
        dom.chatInputArea = document.getElementById('chat-input-area');
        dom.chatInput = document.getElementById('chat-input');
        dom.chatSend = document.getElementById('chat-send');
        dom.chatToggle = document.getElementById('chat-toggle');
        dom.chatBadge = dom.chatToggle.querySelector('.chat-badge');
        
        // Players
        dom.playerList = document.getElementById('player-list');
        dom.playerListEmpty = document.getElementById('player-list-empty');
        dom.privateMessageArea = document.getElementById('private-message-area');
        dom.privateTarget = document.getElementById('private-target');
        dom.privateInput = document.getElementById('private-input');
        dom.privateSend = document.getElementById('private-send');
        dom.playerInspect = document.getElementById('player-inspect');
        dom.inspectName = document.getElementById('inspect-name');
        dom.inspectId = document.getElementById('inspect-id');
        dom.inspectColor = document.getElementById('inspect-color');
        dom.inspectColorValue = document.getElementById('inspect-color-value');
        
        // Mobile controls
        dom.virtualJoystick = document.getElementById('virtual-joystick');
        dom.joystickBase = dom.virtualJoystick?.querySelector('.joystick-base');
        dom.joystickStick = dom.virtualJoystick?.querySelector('.joystick-stick');
        dom.boostBtn = document.getElementById('boost-btn');
        
        // Other
        dom.toastContainer = document.getElementById('toast-container');
        dom.disconnectScreen = document.getElementById('disconnect-screen');
        dom.reconnectBtn = document.getElementById('reconnect-btn');
        dom.unsupportedBrowser = document.getElementById('unsupported-browser');
    }

    // ============================================
    // Utilities
    // ============================================
    
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) ||
               ('ontouchstart' in window);
    }

    function isIOSLike() {
        // iOS Safari doesn't support requestFullscreen for arbitrary elements.
        // iPadOS can report as MacIntel with touch.
        const ua = navigator.userAgent || '';
        const isIOSUA = /iPad|iPhone|iPod/i.test(ua);
        const isIPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
        return isIOSUA || isIPadOS;
    }

    function fullscreenSupported() {
        const el = document.documentElement;
        return !!(el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen);
    }

    function setVH() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // ============================================
    // Storage
    // ============================================
    
    const storage = {
        get(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value !== null ? value : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },
        
        set(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('LocalStorage not available');
            }
        },
        
        getJSON(key, defaultValue = null) {
            try {
                const value = localStorage.getItem(key);
                return value !== null ? JSON.parse(value) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },
        
        setJSON(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('LocalStorage not available');
            }
        }
    };

    // ============================================
    // Loading Screen
    // ============================================
    
    function hideLoadingScreen() {
        setTimeout(() => {
            dom.loadingScreen.classList.add('hidden');
        }, CONFIG.loadingDuration);
    }

    // ============================================
    // Panel Management
    // ============================================
    
    function openPanel(panel) {
        if (state.currentPanel) {
            closePanel(state.currentPanel);
        }
        panel.classList.remove('hidden');
        panel.setAttribute('aria-hidden', 'false');
        state.currentPanel = panel;
        
        // Focus first input if exists
        const firstInput = panel.querySelector('input:not([type="color"])');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    function closePanel(panel) {
        panel.classList.add('hidden');
        panel.setAttribute('aria-hidden', 'true');
        if (state.currentPanel === panel) {
            state.currentPanel = null;
        }

        // Reset any pending bag->hotbar equip when closing the profile (prevents "sac" bugs)
        try {
            if (panel && panel.id === 'profile-panel' && window.uiState) {
                if (window.uiState._pendingBagEl) {
                    window.uiState._pendingBagEl.classList.remove('selected');
                    window.uiState._pendingBagEl = null;
                }
                window.uiState.pendingEquipSpellId = null;
                window.uiState.pendingEquipFromInvSlot = null;
            }
        } catch (e) {}
    }

    function togglePanel(panel) {
        if (panel.classList.contains('hidden')) {
            openPanel(panel);
        } else {
            closePanel(panel);
        }
    }

    function closeAllPanels() {
        const questsPanel = document.getElementById('quests-panel');
        const rewardsPanel = document.getElementById('rewards-panel');
        [dom.menuPanel, dom.profilePanel, dom.helpPanel, dom.playersPanel, dom.introPanel, dom.colorUnlockPanel, questsPanel, rewardsPanel]
            .forEach(panel => {
                if (panel) closePanel(panel);
            });
    }

    // ============================================
    // Fullscreen
    // ============================================
    
    function toggleFullscreen() {
        if (isIOSLike()) {
            showToast('Sur iPhone/iPad, le plein écran Safari n\'est pas disponible. Pour un vrai plein écran: Partager → « Sur l\'écran d\'accueil ».', 'info', { throttleMs: 6000 });
            return;
        }

        if (!fullscreenSupported()) {
            showToast('Plein écran non supporté sur ce navigateur.', 'warning', { throttleMs: 4000 });
            return;
        }

        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    function updateFullscreenState() {
        state.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
        const expandIcon = dom.fullscreenBtn.querySelector('.expand-icon');
        const compressIcon = dom.fullscreenBtn.querySelector('.compress-icon');
        if (expandIcon && compressIcon) {
            expandIcon.style.display = state.isFullscreen ? 'none' : 'block';
            compressIcon.style.display = state.isFullscreen ? 'block' : 'none';
        }
    }

    // ============================================
    // Profile & Colors
    // ============================================
    
    const defaultColors = ['#8ce6de', '#9ad7ff', '#f6d28c', '#ba89ff', '#ff9eaa', '#b8ffb0'];
    
    function initProfile() {
        const savedName = storage.get('tadpole_name', '');
        const savedColor = storage.get('tadpole_color', '#8ce6de');
        const unlockedColors = storage.getJSON('tadpole_colors', ['#8ce6de']);
        const hasSeen = storage.get('tadpole_has_seen');
        const hasChosenColor = storage.get('tadpole_color_chosen');
        const questsCompleted = parseInt(storage.get('tadpole_quests_completed', '0'), 10);
        
        if (dom.profileNameDisplay) {
            dom.profileNameDisplay.textContent = savedName || 'Têtard';
        }
        dom.profileColor.value = savedColor;
        dom.introName.value = savedName;
        
        updateTadpoleColor(savedColor);
        renderColorSwatches(unlockedColors, hasChosenColor);
        updatePreviewCanvas(savedColor);
        
        // Disable color change in profile if already chosen
        if (hasChosenColor && dom.profileColor) {
            dom.profileColor.disabled = true;
            dom.profileColor.style.opacity = '0.5';
            dom.profileColor.style.cursor = 'not-allowed';
            dom.profileColor.title = 'Couleur définitive choisie';
        }
        
        // Initialize unlock color panel preview
        if (dom.unlockColor) {
            dom.unlockColor.value = savedColor;
            renderUnlockColorSwatches(unlockedColors);
            updateUnlockPreviewCanvas(savedColor);
        }
        
        // Show intro panel for new users (only asks for name)
        if (!hasSeen && !savedName) {
            setTimeout(() => openPanel(dom.introPanel), CONFIG.loadingDuration + 500);
        }
        
        // Check if we need to show color unlock (after 3 quests and not chosen yet)
        if (questsCompleted >= 3 && !hasChosenColor && savedName) {
            setTimeout(() => showColorUnlockPanel(), CONFIG.loadingDuration + 1000);
        }
    }
    
    function renderUnlockColorSwatches(colors) {
        if (!dom.unlockColorSwatches) return;
        dom.unlockColorSwatches.innerHTML = '';
        defaultColors.forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'color-swatch';
            swatch.style.background = color;
            
            if (!colors.includes(color)) {
                swatch.classList.add('locked');
                swatch.disabled = true;
            } else {
                swatch.addEventListener('click', () => {
                    if (dom.unlockColor) {
                        dom.unlockColor.value = color;
                        updateUnlockPreviewCanvas(color);
                        updateTadpoleColor(color);
                    }
                });
            }
            
            dom.unlockColorSwatches.appendChild(swatch);
        });
    }
    
    function updateUnlockPreviewCanvas(color) {
        if (!dom.unlockPreviewCanvas) return;
        const ctx = dom.unlockPreviewCanvas.getContext('2d');
        const w = dom.unlockPreviewCanvas.width;
        const h = dom.unlockPreviewCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw tadpole body (larger)
        const gradient = ctx.createRadialGradient(cx - 8, cy - 8, 3, cx, cy, 30);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tail
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx + 22, cy);
        ctx.quadraticCurveTo(cx + 50, cy - 12, cx + 65, cy - 20);
        ctx.quadraticCurveTo(cx + 45, cy, cx + 65, cy + 20);
        ctx.quadraticCurveTo(cx + 50, cy + 12, cx + 22, cy);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#1a2744';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 6, 4, 0, Math.PI * 2);
        ctx.arc(cx + 8, cy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function showColorUnlockPanel() {
        if (!dom.colorUnlockPanel) return;
        const savedColor = storage.get('tadpole_color', '#8ce6de');
        const unlockedColors = storage.getJSON('tadpole_colors', ['#8ce6de']);
        
        if (dom.unlockColor) {
            dom.unlockColor.value = savedColor;
        }
        renderUnlockColorSwatches(unlockedColors);
        updateUnlockPreviewCanvas(savedColor);
        openPanel(dom.colorUnlockPanel);
    }
    
    function saveColorChoice() {
        if (!dom.unlockColor) return;
        const color = dom.unlockColor.value;
        
        storage.set('tadpole_color', color);
        storage.set('tadpole_color_chosen', '1');
        
        dom.profileColor.value = color;
        updateTadpoleColor(color);
        updatePreviewCanvas(color);
        
        if (state.app) {
            state.app.sendMessage('color:' + color);
        }
        
        closePanel(dom.colorUnlockPanel);
        showToast('Ta couleur est maintenant définitive ! 🎨', 'success');
    }

    function updateTadpoleColor(color) {
        document.documentElement.style.setProperty('--tadpole-color', color);
    }

    function renderColorSwatches(colors, hasChosenColor = false) {
        if (!dom.colorSwatches) return;
        dom.colorSwatches.innerHTML = '';
        defaultColors.forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'color-swatch';
            swatch.style.background = color;
            
            if (!colors.includes(color) || hasChosenColor) {
                swatch.classList.add('locked');
                swatch.disabled = true;
                if (hasChosenColor) {
                    swatch.title = 'Couleur définitive choisie';
                }
            } else {
                swatch.addEventListener('click', () => {
                    dom.profileColor.value = color;
                    updateTadpoleColor(color);
                    updatePreviewCanvas(color);
                });
            }
            
            dom.colorSwatches.appendChild(swatch);
        });
    }

    function updatePreviewCanvas(color) {
        const ctx = dom.previewCanvas.getContext('2d');
        const w = dom.previewCanvas.width;
        const h = dom.previewCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        ctx.clearRect(0, 0, w, h);
        
        // Draw tadpole body
        const gradient = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, 20);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tail
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx + 15, cy);
        ctx.quadraticCurveTo(cx + 35, cy - 8, cx + 45, cy - 15);
        ctx.quadraticCurveTo(cx + 30, cy, cx + 45, cy + 15);
        ctx.quadraticCurveTo(cx + 35, cy + 8, cx + 15, cy);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#1a2744';
        ctx.beginPath();
        ctx.arc(cx - 6, cy - 4, 3, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function saveProfile() {
        const name = storage.get('tadpole_name', '').trim();
        const color = dom.profileColor.value;
        const hasChosenColor = storage.get('tadpole_color_chosen');
        
        if (!name) {
            showToast('Entre un nom pour ton têtard !', 'warning');
            return;
        }

        // Only update color if not definitively chosen, or allow minor changes
        if (!hasChosenColor) {
            storage.set('tadpole_color', color);
            updateTadpoleColor(color);
        }
        
        storage.set('tadpole_has_seen', '1');
        
        if (state.app) {
            state.app.sendMessage('name:' + name);
            if (!hasChosenColor) {
                state.app.sendMessage('color:' + color);
            }
        }
        
        closePanel(dom.profilePanel);
        showToast('Profil enregistré !', 'success');
    }

    function saveIntro() {
        const name = dom.introName.value.trim();
        
        if (!name) {
            showToast('Choisis un nom !', 'warning');
            return;
        }
        
        // Default color for new players
        const defaultColor = '#8ce6de';
        
        storage.set('tadpole_name', name);
        storage.set('tadpole_color', defaultColor);
        storage.set('tadpole_has_seen', '1');
        storage.set('tadpole_quests_completed', '0');
        
        if (dom.profileNameDisplay) {
            dom.profileNameDisplay.textContent = name;
        }
        dom.profileColor.value = defaultColor;
        updateTadpoleColor(defaultColor);
        updatePreviewCanvas(defaultColor);
        
        if (state.app) {
            state.app.sendMessage('name:' + name);
            state.app.sendMessage('color:' + defaultColor);
        }
        
        closePanel(dom.introPanel);
        showToast('Bienvenue, ' + name + ' ! 🎉', 'success');
    }

    // Global function for App.js
    window.addUnlockedColor = function(color) {
        const colors = storage.getJSON('tadpole_colors', ['#8ce6de']);
        if (!colors.includes(color)) {
            colors.push(color);
            storage.setJSON('tadpole_colors', colors);
            renderColorSwatches(colors);
        }
    };

    // ============================================
    // Profile Panel Updates
    // ============================================
    
    function updateProfilePanel() {
        if (!window.GameSystems) return;
        
        const stats = window.GameSystems.playerStats;
        const inventory = window.GameSystems.inventory;
        const ITEMS = window.GameSystems.ITEMS;
        
        // Update stats
        const levelEl = document.getElementById('profile-level');
        const hpEl = document.getElementById('profile-hp');
        const attackEl = document.getElementById('profile-attack');
        const defenseEl = document.getElementById('profile-defense');
        const killsEl = document.getElementById('profile-kills');
        const questsEl = document.getElementById('profile-quests');
        
        if (levelEl) levelEl.textContent = stats.level;
        if (hpEl) hpEl.textContent = `${stats.hp}/${stats.maxHp}`;
        if (attackEl) attackEl.textContent = stats.attack;
        if (defenseEl) defenseEl.textContent = stats.defense;
        if (killsEl) killsEl.textContent = stats.kills;
        if (questsEl) questsEl.textContent = stats.questsCompleted;
        
        // Render full bag (server inventory) so players can drop items/spells to free space.
        // Interaction:
        // - Tap a spell in bag => choose hotbar slot A/Z/E/R to equip
        // - Long press (mobile) or right-click (desktop) => drop item on the ground
        const grid = document.querySelector('.profile-slots');
        if (!grid) return;

        const ensureBagGrid = () => {
            const invMax = (inventory && inventory._serverMode) ? (inventory.maxSlots || 20) : (inventory._legacyMaxSlots || 4);
            if (!grid.classList.contains('bag-grid')) grid.classList.add('bag-grid');
            if (grid.childElementCount === invMax) return;

            grid.innerHTML = '';
            for (let i = 0; i < invMax; i++) {
                const el = document.createElement('div');
                el.className = 'profile-slot empty';
                el.dataset.invSlot = String(i);
                el.innerHTML = `<span class="profile-slot-icon"></span><span class="profile-slot-qty"></span>`;

                // Desktop: right click to drop
                el.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const idx = parseInt(el.dataset.invSlot, 10);
                    const itemSlot = inventory?._serverMode ? (inventory.slots?.[idx] || null) : null;
                    const itemId = itemSlot?.itemId || (inventory?.items ? inventory.items[idx] : null);
                    if (!itemId) return;
                    const def = itemId ? (ITEMS[itemId] || {}) : null;
                    const name = def?.name || itemId || 'cet item';
                    if (confirm(`Jeter ${name} ?`)) {
                        inventory?.dropItem(idx, state.app?.model);
                    }
                });

                // Mobile: long press to drop (with confirm)
                let pressTimer = null;
                let longPressed = false;
                el.addEventListener('touchstart', (e) => {
                    longPressed = false;
                    pressTimer = setTimeout(() => {
                        longPressed = true;
                        const idx = parseInt(el.dataset.invSlot, 10);
                        const itemSlot = inventory?._serverMode ? (inventory.slots?.[idx] || null) : null;
                        const itemId = itemSlot?.itemId || (inventory?.items ? inventory.items[idx] : null);
                        if (!itemId) return;
                        const def = itemId ? (ITEMS[itemId] || {}) : null;
                        const name = def?.name || itemId || 'cet item';
                        if (confirm(`Jeter ${name} ?`)) {
                            inventory?.dropItem(idx, state.app?.model);
                        }
                    }, 520);
                }, { passive: true });
                el.addEventListener('touchend', () => {
                    if (pressTimer) clearTimeout(pressTimer);
                    pressTimer = null;
                }, { passive: true });
                el.addEventListener('touchmove', () => {
                    if (pressTimer) clearTimeout(pressTimer);
                    pressTimer = null;
                }, { passive: true });

                // Tap: select spell to equip
                el.addEventListener('click', (e) => {
                    if (longPressed) return;
                    const idx = parseInt(el.dataset.invSlot, 10);
					const slotData = inventory?._serverMode ? (inventory.slots?.[idx] || null) : null;
					const itemId = slotData?.itemId || (inventory?.items ? inventory.items[idx] : null);
                    if (!itemId) return;
                    const def = ITEMS[itemId] || {};
                    if ((def.type || slotData?.type) === 'spell') {
                        // arm equip mode
                        if (window.uiState._pendingBagEl) {
                            window.uiState._pendingBagEl.classList.remove('selected');
                        }
                        window.uiState.pendingEquipSpellId = itemId;
                        window.uiState.pendingEquipFromInvSlot = idx;
                        window.uiState._pendingBagEl = el;
                        el.classList.add('selected');
                        showToast(`Choisis un slot A/Z/E/R pour équiper ${def.icon || ''} ${def.name || 'ce sort'}`, 'info');
                    } else {
                        // For non-spell items, just show details.
                        showToast(`${def.icon || '🎒'} ${def.name || itemId}`, 'info');
                    }
                });

                grid.appendChild(el);
            }
        };

        ensureBagGrid();

		const max = (inventory && inventory._serverMode) ? (inventory.maxSlots || 20) : (inventory._legacyMaxSlots || 4);
        for (let i = 0; i < max; i++) {
            const el = grid.children[i];
            if (!el) continue;
            const iconEl = el.querySelector('.profile-slot-icon');
            const qtyEl = el.querySelector('.profile-slot-qty');

			const slotData = inventory?._serverMode ? (inventory.slots?.[i] || null) : null;
			const itemId = slotData?.itemId || (inventory?.items ? inventory.items[i] : null);
			const qty = slotData?.quantity || (itemId ? 1 : 0);

            if (itemId) {
                const def = ITEMS[itemId] || {};
                if (iconEl) iconEl.textContent = def.icon || '';
                if (qtyEl) qtyEl.textContent = (qty && qty > 1) ? String(qty) : '';
                el.className = `profile-slot rarity-${def.rarity || 'common'}`;
                el.title = `${def.name || itemId}\n${def.description || ''}`.trim();
            } else {
                if (iconEl) iconEl.textContent = '';
                if (qtyEl) qtyEl.textContent = '';
                el.className = 'profile-slot empty';
                el.title = 'Emplacement vide';
            }
        }
    }


    // Expose for WS-driven refreshes
    window.updateProfilePanel = updateProfilePanel;


    // ============================================
    // Chat
    // ============================================
    
    function toggleChat() {
        state.chatOpen = !state.chatOpen;
        dom.chatInputArea.classList.toggle('hidden', !state.chatOpen);
        dom.chatBadge.classList.add('hidden');
        
        if (state.chatOpen) {
            requestAnimationFrame(() => {
                dom.chatInput.focus();
                dom.chatInput.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        } else {
            dom.chatInput.blur();
        }
    }

    function sendChatMessage() {
        const message = dom.chatInput.value.trim();
        if (!message) return;
        
        if (state.app) {
            state.app.sendMessage(message);
        }
        
        dom.chatInput.value = '';
    }

    function addChatMessage(name, text, isPrivate = false) {
        const line = document.createElement('div');
        line.className = 'chat-line' + (isPrivate ? ' chat-private' : '');
        line.innerHTML = `<span class="chat-name">${escapeHtml(name)}</span>${escapeHtml(text)}`;
        
        dom.chatLog.appendChild(line);
        
        // Limit messages
        while (dom.chatLog.children.length > CONFIG.chatMaxMessages) {
            dom.chatLog.removeChild(dom.chatLog.firstChild);
        }
        
        // Show badge if chat is closed
        if (!state.chatOpen) {
            dom.chatBadge.classList.remove('hidden');
        }
        
        // Auto-fade old messages
        setTimeout(() => {
            line.style.opacity = '0';
            setTimeout(() => line.remove(), 300);
        }, CONFIG.chatFadeDelay);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Global function for WebSocketService
    window.displayChatMessage = function(name, text, isPrivate) {
        addChatMessage(name, text, isPrivate);
    };

    // ============================================
    // Players List
    // ============================================
    
    let selectedPlayerId = null;

    function updatePlayersList(players) {
        dom.playerList.innerHTML = '';
        
        if (!players || players.length === 0) {
            dom.playerListEmpty.style.display = 'block';
            dom.privateMessageArea.classList.add('hidden');
            dom.playerInspect.classList.add('hidden');
            return;
        }
        
        dom.playerListEmpty.style.display = 'none';
        
        players.forEach(player => {
            const li = document.createElement('li');
            li.dataset.playerId = player.id;
            li.innerHTML = `
                <span class="player-dot" style="--player-color: ${player.color || '#8ce6de'}"></span>
                <span class="player-name">${escapeHtml(player.name || 'Anonyme')}</span>
            `;
            li.addEventListener('click', () => selectPlayer(player));
            dom.playerList.appendChild(li);
        });
    }

    function selectPlayer(player) {
        selectedPlayerId = player.id;
        dom.privateTarget.textContent = 'Message privé à ' + (player.name || 'Anonyme');
        dom.privateMessageArea.classList.remove('hidden');
        dom.playerInspect.classList.remove('hidden');
        dom.inspectName.textContent = player.name || 'Anonyme';
        dom.inspectId.textContent = player.id;
        const color = player.color || '#8ce6de';
        dom.inspectColor.style.background = color;
        dom.inspectColor.style.boxShadow = `0 0 8px ${color}`;
        dom.inspectColorValue.textContent = color;
        dom.privateInput.focus();
    }

    function sendPrivateMessage() {
        const message = dom.privateInput.value.trim();
        if (!message || !selectedPlayerId) return;
        
        if (state.app) {
            state.app.sendPrivateMessage(selectedPlayerId, message);
        }
        
        dom.privateInput.value = '';
        showToast('Message envoyé !');
    }

    // Global function for WebSocketService
    window.updatePlayerCount = function(count) {
        if (dom.playerCountValue) {
            dom.playerCountValue.textContent = count;
        }
    };

    window.updatePlayersList = updatePlayersList;

    // ============================================
    // Toasts
    // ============================================
    
    function showToast(message, typeOrOpts = '', maybeOpts = null) {
        // Robust anti-spam + dedupe:
        // - case-insensitive
        // - digits normalized ("1s" == "2s")
        // - per message + per slot
        // - update existing toast instead of stacking
        // Backward compatible signature: (message, type) OR (message, type, opts) OR (message, opts)
        let type = '';
        let opts = {};
        if (typeOrOpts && typeof typeOrOpts === 'object') {
            opts = typeOrOpts;
        } else {
            type = typeOrOpts || '';
            if (maybeOpts && typeof maybeOpts === 'object') opts = maybeOpts;
        }

        const raw = String(message || '').trim();
        if (!raw) return;

        window._toastSpamGuard = window._toastSpamGuard || {};
        window._toastInstances = window._toastInstances || {};
        const now = Date.now();
        const slot = (opts && typeof opts.slot === 'number') ? opts.slot : null;

        const norm = raw
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[0-9]+/g, '#');

        // Throttle rules
        let delay = (opts && typeof opts.throttleMs === 'number') ? opts.throttleMs : 0;
        if (!delay) {
            // Always have a small global throttle to prevent floods
            delay = 450;
            if (norm.includes('inventaire plein')) delay = Math.max(delay, 1500);
            if (norm.includes('recharge') || norm.includes('cooldown') || norm.startsWith('⏳')) delay = Math.max(delay, 1200);
            if (norm.includes('impossible') || norm.includes('ramasser') || norm.includes('loot')) delay = Math.max(delay, 1200);
            // Server announcements can spam if resent -> clamp hard
            if (norm.includes('élite') || norm.includes('boss') || norm.includes('repéré') || norm.includes('apparaît')) delay = Math.max(delay, 6000);
            if (norm.includes('nouveau compagnon')) delay = Math.max(delay, 4000);
        }

        const guardKey = `msg:${norm}|slot:${slot !== null ? slot : 'any'}`;
        const last = window._toastSpamGuard[guardKey] || 0;
        if (delay > 0 && (now - last < delay)) return;
        window._toastSpamGuard[guardKey] = now;

        // Dedupe key: same normalized message + slot + type
        const dedupeKey = `${guardKey}|type:${(type || 'default').toLowerCase()}`;
        const existing = window._toastInstances[dedupeKey];
        if (existing && existing.el && existing.el.parentNode) {
            existing.el.textContent = raw;
            if (existing.timer) clearTimeout(existing.timer);
            existing.timer = setTimeout(() => {
                try {
                    if (existing.el && existing.el.parentNode) existing.el.parentNode.removeChild(existing.el);
                } catch (e) {}
                delete window._toastInstances[dedupeKey];
            }, CONFIG.toastDuration);
            return;
        }

        const toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' ' + type : '');
        toast.textContent = raw;

        dom.toastContainer.appendChild(toast);

        // Limit visible toasts (prevents huge stacks on iPhone)
        const maxVisible = (state && (state.isMobile || state.isTouch)) ? 3 : 5;
        while (dom.toastContainer.childElementCount > maxVisible) {
            dom.toastContainer.removeChild(dom.toastContainer.firstElementChild);
        }

        const timer = setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            delete window._toastInstances[dedupeKey];
        }, CONFIG.toastDuration);

        window._toastInstances[dedupeKey] = { el: toast, timer };
    }

    // Global function
    window.showToast = showToast;

    // ============================================
    // Virtual Joystick (Mobile & Touch)
    // ============================================
    
    function initVirtualJoystick() {
        if (!dom.virtualJoystick) return;
        
        // Show joystick on mobile/touch devices
        if (state.isMobile || state.isTouch) {
            dom.virtualJoystick.classList.remove('hidden');
            if (dom.boostBtn) dom.boostBtn.classList.remove('hidden');
        }
        
        const joystickArea = dom.joystickBase;
        if (!joystickArea) return;
        
        // Touch events for joystick
        joystickArea.addEventListener('touchstart', handleJoystickStart, { passive: false });
        document.addEventListener('touchmove', handleJoystickMove, { passive: false });
        document.addEventListener('touchend', handleJoystickEnd, { passive: false });
        document.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
        
        // Mouse events for joystick (for testing on desktop)
        joystickArea.addEventListener('mousedown', handleJoystickMouseStart);
        document.addEventListener('mousemove', handleJoystickMouseMove);
        document.addEventListener('mouseup', handleJoystickMouseEnd);
        
        // Boost button
        if (dom.boostBtn) {
            dom.boostBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerBoost();
            }, { passive: false });
            
            dom.boostBtn.addEventListener('click', (e) => {
                e.preventDefault();
                triggerBoost();
            });
        }
    }
    
    let joystickTouchId = null;

    function handleJoystickStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        joystickTouchId = touch.identifier;
        
        const rect = dom.joystickBase.getBoundingClientRect();
        
        state.joystick.active = true;
        state.joystick.baseX = rect.left + rect.width / 2;
        state.joystick.baseY = rect.top + rect.height / 2;
        
        // Mark that we're using joystick
        window.inputState.useJoystick = true;
        window.inputState.isMoving = true;
        
        // Start moving
        if (state.app && state.app.model && state.app.model.userTadpole) {
            state.app.model.userTadpole.momentum = state.app.model.userTadpole.maxMomentum;
            state.app.model.userTadpole.targetMomentum = state.app.model.userTadpole.maxMomentum;
        }
        
        updateJoystickPosition(touch.clientX, touch.clientY);
    }
    
    function handleJoystickMouseStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const rect = dom.joystickBase.getBoundingClientRect();
        
        state.joystick.active = true;
        state.joystick.baseX = rect.left + rect.width / 2;
        state.joystick.baseY = rect.top + rect.height / 2;
        
        window.inputState.useJoystick = true;
        window.inputState.isMoving = true;
        
        if (state.app && state.app.model && state.app.model.userTadpole) {
            state.app.model.userTadpole.momentum = state.app.model.userTadpole.maxMomentum;
            state.app.model.userTadpole.targetMomentum = state.app.model.userTadpole.maxMomentum;
        }
        
        updateJoystickPosition(e.clientX, e.clientY);
    }

    function handleJoystickMove(e) {
        if (!state.joystick.active) return;
        
        // Find the correct touch
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === joystickTouchId) {
                touch = e.touches[i];
                break;
            }
        }
        
        if (!touch) return;
        
        e.preventDefault();
        updateJoystickPosition(touch.clientX, touch.clientY);
    }
    
    function handleJoystickMouseMove(e) {
        if (!state.joystick.active) return;
        updateJoystickPosition(e.clientX, e.clientY);
    }

    function handleJoystickEnd(e) {
        // Check if it's our touch that ended
        let ourTouchEnded = false;
        if (e.changedTouches) {
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    ourTouchEnded = true;
                    break;
                }
            }
        }
        
        if (!ourTouchEnded && e.type !== 'touchcancel') return;
        
        resetJoystick();
    }
    
    function handleJoystickMouseEnd(e) {
        if (!state.joystick.active) return;
        resetJoystick();
    }
    
    function resetJoystick() {
        state.joystick.active = false;
        state.joystick.stickX = 0;
        state.joystick.stickY = 0;
        state.joystick.distance = 0;
        joystickTouchId = null;
        
        if (dom.joystickStick) {
            dom.joystickStick.style.transform = 'translate(0, 0)';
        }
        
        // Clear joystick target
        window.joystickTarget = null;
        window.inputState.useJoystick = false;
        window.inputState.isMoving = false;
        
        // Stop moving
        if (state.app && state.app.model && state.app.model.userTadpole) {
            state.app.model.userTadpole.targetMomentum = 0;
        }
    }

    function updateJoystickPosition(touchX, touchY) {
        const dx = touchX - state.joystick.baseX;
        const dy = touchY - state.joystick.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = CONFIG.joystickMaxDistance;
        
        let clampedX = dx;
        let clampedY = dy;
        
        if (distance > maxDist) {
            clampedX = (dx / distance) * maxDist;
            clampedY = (dy / distance) * maxDist;
        }
        
        state.joystick.stickX = clampedX;
        state.joystick.stickY = clampedY;
        state.joystick.distance = Math.min(distance / maxDist, 1);
        state.joystick.angle = Math.atan2(dy, dx);
        
        if (dom.joystickStick) {
            dom.joystickStick.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
        }
        
        // Update joystick target for game - normalized direction
        if (state.joystick.distance > CONFIG.joystickDeadzone) {
            const normalizedX = clampedX / maxDist;
            const normalizedY = clampedY / maxDist;
            
            window.joystickTarget = {
                dx: normalizedX,
                dy: normalizedY,
                distance: state.joystick.distance
            };
            
            // Keep momentum going while joystick is active
            if (state.app && state.app.model && state.app.model.userTadpole) {
                state.app.model.userTadpole.targetMomentum = state.app.model.userTadpole.maxMomentum * state.joystick.distance;
                state.app.model.userTadpole.momentum = state.app.model.userTadpole.targetMomentum;
            }
        } else {
            window.joystickTarget = null;
            if (state.app && state.app.model && state.app.model.userTadpole) {
                state.app.model.userTadpole.targetMomentum = 0;
            }
        }
    }

    
    // ============================================
    // Wild Rift - Full Mobile Controls
    // ============================================

    function initWildRiftControls() {
        const root = document.getElementById('wr-controls');
        if (!root) return;

        // Show on touch devices only
        if (state.isMobile || state.isTouch) {
            root.classList.remove('hidden');
            root.setAttribute('aria-hidden', 'false');
        } else {
            root.classList.add('hidden');
            root.setAttribute('aria-hidden', 'true');
            return;
        }

        const btnAttack = document.getElementById('wr-attack');
        const btnInv = document.getElementById('wr-inventory');
        const btnComp = document.getElementById('wr-companion');
        const btnPvp = document.getElementById('wr-pvp');

        // Prevent long-press selection/context menu
        ['contextmenu'].forEach((ev) => {
            root.addEventListener(ev, (e) => { e.preventDefault(); }, { passive: false });
        });

        const fire = (fn) => (e) => {
            try { e.preventDefault(); e.stopPropagation(); } catch (_) {}
            if (window.inputState && window.inputState.isDead) return;
            fn && fn();
        };

        const triggerMelee = () => {
            if (window.webSocketService?.sendMelee) {
                window.webSocketService.sendMelee();
                // Optimistic local cooldown display (server will confirm with melee_result)
                const now = Date.now();
                const cd = (window.GameSystems && window.GameSystems.gameState && window.GameSystems.gameState.meleeCooldownMs) ? window.GameSystems.gameState.meleeCooldownMs : 750;
                if (window.GameSystems?.gameState) window.GameSystems.gameState.meleeCooldownUntil = now + cd;
            }
        };

        if (btnAttack) {
            btnAttack.addEventListener('touchstart', fire(triggerMelee), { passive: false });
            btnAttack.addEventListener('click', fire(triggerMelee));
        }

        // Inventory button (opens the profile/inventory panel)
        if (btnInv) {
            btnInv.addEventListener('touchstart', fire(() => { if (dom.profilePanel) togglePanel(dom.profilePanel); }), { passive: false });
            btnInv.addEventListener('click', fire(() => { if (dom.profilePanel) togglePanel(dom.profilePanel); }));
        }

        // Spell buttons (A/Z/E/R)
        for (let i = 0; i < 4; i++) {
            const el = document.getElementById(`wr-slot-${i}`);
            if (!el) continue;

            const useSlot = () => {
                window.GameSystems?.inventory?.useItem(i, window.GameSystems.playerStats, window.GameSystems.gameState);
            };

            el.addEventListener('touchstart', fire(useSlot), { passive: false });
            el.addEventListener('click', fire(useSlot));
        }

        // Companion button (B): trigger the companion spell if equipped, else do nothing
        const triggerCompanion = () => {
            const spells = window.GameSystems?.equippedSpells;
            if (!Array.isArray(spells)) return;
            for (let si = 0; si < Math.min(4, spells.length); si++) {
                const s = spells[si];
                const id = s && (s.id || s.itemId || s.spellId);
                if (id === 'spell_companion') {
                    window.GameSystems?.inventory?.useItem(si, window.GameSystems.playerStats, window.GameSystems.gameState);
                    break;
                }
            }
        };
        if (btnComp) {
            btnComp.addEventListener('touchstart', fire(triggerCompanion), { passive: false });
            btnComp.addEventListener('click', fire(triggerCompanion));
        }

        // PvP toggle button
        if (btnPvp) {
            btnPvp.addEventListener('touchstart', fire(() => {
                if (window.GameSystems?.combat) {
                    window.GameSystems.combat.togglePvP();
                    btnPvp.classList.toggle('active', window.GameSystems.combat.pvpEnabled);
                    if (state.app && typeof state.app.setPvpEnabled === 'function') {
                        state.app.setPvpEnabled(window.GameSystems.combat.pvpEnabled);
                    }
                }
            }), { passive: false });

            btnPvp.addEventListener('click', fire(() => {
                if (window.GameSystems?.combat) {
                    window.GameSystems.combat.togglePvP();
                    btnPvp.classList.toggle('active', window.GameSystems.combat.pvpEnabled);
                    if (state.app && typeof state.app.setPvpEnabled === 'function') {
                        state.app.setPvpEnabled(window.GameSystems.combat.pvpEnabled);
                    }
                }
            }));
        }
    }

function triggerBoost() {
        // Server-authoritative: slot R (index 3) is triggered by Space and the mobile button
        if (window.GameSystems && window.GameSystems.inventory) {
            window.GameSystems.inventory.useItem(3, window.GameSystems.playerStats, window.GameSystems.gameState);
        }
    }

    // ============================================
    // Boost Bar Update
    // ============================================
    
    function updateBoostBar() {
        if (!state.app || !state.app.model) return;
        
        const now = Date.now();
        const model = state.app.model;
        
        // Prefer the authoritative server cooldown (boost_state), fallback to local slot R cooldown
        const localCooldownEnd = window.GameSystems?.gameState?.spell_cooldown_3 || 0;
        const end = Math.max(model.boostCooldownUntil || 0, localCooldownEnd);

        // Duration guess from the equipped spell in slot R, fallback to CONFIG.boostCooldown
        let duration = CONFIG.boostCooldown;
        const spells = window.GameSystems?.equippedSpells;
        const s = Array.isArray(spells) ? spells[3] : null;
        const spellId = s && (s.id || s.itemId || s.spellId);
        const def = spellId && window.GameSystems?.ITEMS ? window.GameSystems.ITEMS[spellId] : null;
        if (def && typeof def.cooldown === 'number' && def.cooldown > 0) duration = def.cooldown;

        if (end && now < end) {
            const remaining = end - now;
            const progress = 1 - (remaining / duration);
            dom.boostFill.style.width = (progress * 100) + '%';
            dom.boostFill.classList.add('recharging');
        } else {
            dom.boostFill.style.width = '100%';
            dom.boostFill.classList.remove('recharging');
        }
    }

    // ============================================
    // Quest UI Update
    // ============================================
    
    function updateQuestUI() {
        if (!state.app || !state.app.model) return;
        
        const model = state.app.model;
        
        if (dom.scoreValue) {
            dom.scoreValue.textContent = model.score || 0;
        }
        
        if (dom.gemsValue) {
            dom.gemsValue.textContent = model.gems || 0;
        }
        
        if (dom.questProgress && dom.questFill) {
            const collected = model.questCollected || 0;
            const target = model.questTarget || 5;
            const percent = (collected / target) * 100;
            
            dom.questProgress.textContent = `${collected} / ${target} orbes`;
            dom.questFill.style.width = percent + '%';
        }
    }

    // Global functions
    window.updateQuestUI = updateQuestUI;
    window.updateBoostBar = updateBoostBar;
    window.showColorUnlockPanel = showColorUnlockPanel;

    // ============================================
    // NPC Ovule - Advanced AI System
    // ============================================
    
    const OvuleNPC = {
        // Personality traits
        personality: {
            name: 'Ovule',
            mood: 'friendly',
            energy: 100
        },
        
        // Track player interactions
        interactions: 0,
        lastInteraction: 0,
        playerMilestones: {},
        
        // Dialogue categories
        dialogues: {
            // First meeting
            firstMeet: [
                "Bienvenue, petit têtard ! 🌊 Je suis Ovule, le guide ancestral de ces eaux. Comment t'appelles-tu ?",
                "Oh, un nouveau visiteur ! Les courants m'avaient prévenu de ton arrivée. Je suis Ovule, enchanté !"
            ],
            
            // General greetings (return visits)
            greetings: [
                "Te revoilà, {name} ! Content de te revoir nager par ici. 🐸",
                "Ah, {name} ! Les bulles m'ont dit que tu revenais. Que puis-je faire pour toi ?",
                "Salut {name} ! Tu as l'air en pleine forme aujourd'hui !",
                "{name} ! Mon têtard préféré ! ... Ne dis pas aux autres que j'ai dit ça. 🤫",
                "Oh ! {name} approche ! *fait une petite danse aquatique*"
            ],
            
            // Tips based on score
            tipsLowScore: [
                "Astuce : Les petites orbes brillantes te donnent des points. Collectionne-en !",
                "Tu vois ces lumières qui dansent ? Ce sont des orbes. Nage vers elles !",
                "Clique et maintiens pour nager vers le curseur. Simple comme bonjour !",
                "Sur mobile, utilise le joystick virtuel. C'est super intuitif !"
            ],
            
            tipsMidScore: [
                "Tu progresses bien ! Savais-tu que la touche ESPACE te donne un boost de vitesse ?",
                "Les orbes dorées sont spéciales - elles donnent des bonus temporaires !",
                "Continue comme ça ! Tu débloques de nouvelles couleurs en terminant des quêtes.",
                "Astuce pro : Le boost a un temps de recharge. Utilise-le stratégiquement !"
            ],
            
            tipsHighScore: [
                "Impressionnant, {name} ! Tu maîtrises vraiment ces eaux maintenant !",
                "Avec ton expérience, tu pourrais aider les nouveaux arrivants...",
                "Les légendes parlent d'un têtard légendaire... serait-ce toi ?",
                "Tu as exploré tous les recoins ? Il y a des secrets cachés par ici..."
            ],
            
            // Quest-related
            questProgress: [
                "Ta mission avance bien ! Encore {remaining} orbes et tu auras ta récompense !",
                "Je vois que tu as collecté {collected} orbes. Continue, {name} !",
                "Chaque orbe te rapproche de la gemme... et de nouvelles couleurs !"
            ],
            
            questComplete: [
                "🎉 Félicitations ! Tu as terminé ta quête ! Voici ta gemme bien méritée !",
                "Incroyable travail, {name} ! Tu es un vrai champion des profondeurs !",
                "Mission accomplie ! Les anciens seraient fiers de toi !"
            ],
            
            // Color unlock (after 3 quests)
            colorUnlock: [
                "C'est un grand jour, {name} ! Après 3 quêtes, tu as prouvé ta valeur. Il est temps de choisir ta couleur définitive !",
                "Le moment est venu... Choisis la couleur qui représentera ton âme de têtard pour toujours !"
            ],
            
            // Boost-related
            boostReady: [
                "Ton boost est rechargé ! ESPACE pour filer comme l'éclair ! ⚡",
                "Prêt pour une accélération ? Le boost est disponible !"
            ],
            
            boostUsed: [
                "Woooosh ! Tu vas vite ! 💨",
                "Attention aux virages à cette vitesse !"
            ],
            
            // Social
            otherPlayers: [
                "Tu vois les autres têtards ? Dis-leur bonjour avec le chat ! Touche T ou clique sur 💬",
                "On n'est jamais seul dans ces eaux. Les autres joueurs sont tes amis !",
                "Astuce sociale : Tu peux envoyer des messages privés via la liste des joueurs."
            ],
            
            // Idle (when player hasn't moved)
            idle: [
                "Tu te reposes ? C'est important aussi, prends ton temps.",
                "*bulle* ... Tu rêves éveillé ? Je comprends, ces eaux sont relaxantes.",
                "Psst... si tu t'ennuies, il y a des orbes qui t'attendent par là-bas !"
            ],
            
            // Random fun facts
            funFacts: [
                "Le savais-tu ? Les vrais têtards peuvent régénérer leur queue !",
                "Fait amusant : Un groupe de grenouilles s'appelle une 'armée'. Cool, non ?",
                "Dans la vraie vie, les têtards respirent par des branchies. Magie de la nature !",
                "Certains têtards mettent 3 ans à devenir grenouilles. Patience !",
                "Les grenouilles existent depuis plus de 200 millions d'années. On est des ancêtres !"
            ],
            
            // Encouragement
            encouragement: [
                "Tu peux le faire, {name} ! Je crois en toi ! 💪",
                "Chaque grand têtard a commencé petit. Continue !",
                "L'important n'est pas la vitesse, mais la persévérance !",
                "Tu es sur la bonne voie, je le sens dans mes écailles !"
            ],
            
            // Farewell
            farewell: [
                "À bientôt, {name} ! Les eaux t'attendront toujours !",
                "Bonne continuation ! N'oublie pas : nage toujours vers tes rêves !",
                "Au revoir ! Reviens quand tu veux, je serai là. 🌊"
            ]
        },
        
        // Get player context
        getPlayerContext() {
            const name = storage.get('tadpole_name', 'Têtard');
            const score = state.app?.model?.score || 0;
            const quests = parseInt(storage.get('tadpole_quests_completed', '0'), 10);
            const hasChosenColor = storage.get('tadpole_color_chosen');
            const collected = state.app?.model?.questCollected || 0;
            const target = state.app?.model?.questTarget || 5;
            const hasSeen = storage.get('tadpole_has_seen');
            
            return { name, score, quests, hasChosenColor, collected, target, hasSeen };
        },
        
        // Replace placeholders in text
        formatText(text, context) {
            return text
                .replace(/{name}/g, context.name)
                .replace(/{score}/g, context.score)
                .replace(/{quests}/g, context.quests)
                .replace(/{collected}/g, context.collected)
                .replace(/{target}/g, context.target)
                .replace(/{remaining}/g, context.target - context.collected);
        },
        
        // Get random item from array
        random(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        },
        
        // Choose appropriate dialogue based on context
        getContextualDialogue() {
            const ctx = this.getPlayerContext();
            const now = Date.now();
            const timeSinceLastInteraction = now - this.lastInteraction;
            
            this.interactions++;
            this.lastInteraction = now;
            
            let dialogue;
            let category = 'general';
            
            // First time meeting
            if (!ctx.hasSeen) {
                dialogue = this.random(this.dialogues.firstMeet);
                category = 'firstMeet';
            }
            // After 3 quests, prompt color choice
            else if (ctx.quests >= 3 && !ctx.hasChosenColor) {
                dialogue = this.random(this.dialogues.colorUnlock);
                category = 'colorUnlock';
            }
            // Quest just completed
            else if (ctx.collected >= ctx.target) {
                dialogue = this.random(this.dialogues.questComplete);
                category = 'questComplete';
            }
            // Quest in progress
            else if (ctx.collected > 0 && Math.random() < 0.3) {
                dialogue = this.random(this.dialogues.questProgress);
                category = 'questProgress';
            }
            // Based on score
            else if (ctx.score < 10) {
                // Mix of greetings and tips for beginners
                if (this.interactions <= 2 || Math.random() < 0.5) {
                    dialogue = this.random(this.dialogues.greetings);
                } else {
                    dialogue = this.random(this.dialogues.tipsLowScore);
                }
            }
            else if (ctx.score < 50) {
                const options = [...this.dialogues.greetings, ...this.dialogues.tipsMidScore];
                dialogue = this.random(options);
            }
            else {
                const options = [...this.dialogues.greetings, ...this.dialogues.tipsHighScore, ...this.dialogues.funFacts];
                dialogue = this.random(options);
            }
            
            // Occasional encouragement (20% chance)
            if (Math.random() < 0.2 && category === 'general') {
                dialogue = this.random(this.dialogues.encouragement);
            }
            
            // Very rare fun facts (10% chance)
            if (Math.random() < 0.1) {
                dialogue += '\n\n' + this.random(this.dialogues.funFacts);
            }
            
            return {
                text: this.formatText(dialogue, ctx),
                category: category,
                shouldShowColorPanel: category === 'colorUnlock'
            };
        },
        
        // Get idle message (when player hasn't interacted)
        getIdleMessage() {
            const ctx = this.getPlayerContext();
            return this.formatText(this.random(this.dialogues.idle), ctx);
        },
        
        // Get boost-related message
        getBoostMessage(isReady) {
            const ctx = this.getPlayerContext();
            const arr = isReady ? this.dialogues.boostReady : this.dialogues.boostUsed;
            return this.formatText(this.random(arr), ctx);
        },
        
        // Get social message
        getSocialMessage() {
            const ctx = this.getPlayerContext();
            return this.formatText(this.random(this.dialogues.otherPlayers), ctx);
        }
    };
    
    // Updated openNpcDialog function
    window.openNpcDialog = function() {
        const result = OvuleNPC.getContextualDialogue();
        const hasSeen = storage.get('tadpole_has_seen');
        const savedName = storage.get('tadpole_name', '');
        
        if (dom.npcText) {
            dom.npcText.innerHTML = result.text.replace(/\n/g, '<br>');
        }
        
        // Show/hide form based on whether player has set name
        if (dom.introForm && dom.introContinue) {
            if (!hasSeen && !savedName) {
                // New player - show name form
                dom.introForm.classList.remove('hidden');
                dom.introContinue.classList.add('hidden');
            } else {
                // Returning player - show continue button
                dom.introForm.classList.add('hidden');
                dom.introContinue.classList.remove('hidden');
            }
        }
        
        // Show intro panel if it's a regular dialog
        if (!result.shouldShowColorPanel) {
            openPanel(dom.introPanel);
        } else {
            // Show color unlock panel instead
            showColorUnlockPanel();
        }
    };

    window.npcSpeak = function() {
        // Could add sound effect here
    };
    
    // Expose OvuleNPC for external use
    window.OvuleNPC = OvuleNPC;

    // ============================================
    // Connection Status
    // ============================================
    
    function showDisconnected() {
        dom.disconnectScreen.classList.remove('hidden');
    }

    function hideDisconnected() {
        dom.disconnectScreen.classList.add('hidden');
    }

    window.showDisconnected = showDisconnected;
    window.hideDisconnected = hideDisconnected;

    // ============================================
    // Event Listeners
    // ============================================
    
    function setupEventListeners() {
        // iOS Safari: hide the fullscreen button (not supported; users should Add to Home Screen)
        try {
            if (isIOSLike() || !fullscreenSupported()) {
                dom.fullscreenBtn?.classList.add('hidden');
                const menuFs = document.getElementById('menu-fullscreen');
                if (menuFs) menuFs.style.display = 'none';
            }
        } catch (e) {}

        // Resize handling
        window.addEventListener('resize', debounce(() => {
            setVH();
            if (state.app) state.app.resize();
        }, 100));
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                setVH();
                if (state.app) state.app.resize();
            }, 100);
        });
        
        // Fullscreen
        document.addEventListener('fullscreenchange', updateFullscreenState);
        document.addEventListener('webkitfullscreenchange', updateFullscreenState);
        
        // HUD buttons - stop propagation to prevent immediate close
        dom.menuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel(dom.menuPanel);
        });
        dom.fullscreenBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullscreen();
        });
        dom.profileBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            updateProfilePanel();
            togglePanel(dom.profilePanel);
        });
        
        // Menu items
        document.getElementById('menu-profile')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.menuPanel);
            updateProfilePanel();
            openPanel(dom.profilePanel);
        });
        
        document.getElementById('menu-quests')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.menuPanel);
            if (window.openQuestsPanel) {
                window.openQuestsPanel();
            }
        });
        
        document.getElementById('menu-players')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.menuPanel);
            openPanel(dom.playersPanel);
            if (state.app) state.app.requestPlayerList();
        });
        
        document.getElementById('menu-help')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.menuPanel);
            openPanel(dom.helpPanel);
        });
        
        document.getElementById('menu-sound')?.addEventListener('click', (e) => {
            e.stopPropagation();
            state.soundEnabled = !state.soundEnabled;
            const menuItem = e.currentTarget;
            const textSpan = menuItem.querySelector('span:last-child');
            if (textSpan) {
                textSpan.textContent = 'Son : ' + (state.soundEnabled ? 'Activé' : 'Désactivé');
            }
        });
        
        document.getElementById('menu-fullscreen')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.menuPanel);
            toggleFullscreen();
        });
        
        // Panel close buttons
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.closest('.panel');
                if (panel) closePanel(panel);
            });
        });
        
        // Profile
        dom.profileSave?.addEventListener('click', saveProfile);
        dom.profileColor?.addEventListener('input', (e) => {
            updateTadpoleColor(e.target.value);
            updatePreviewCanvas(e.target.value);
        });
        
        // Intro (name only)
        dom.introStart?.addEventListener('click', saveIntro);
        dom.introCloseBtn?.addEventListener('click', () => {
            closePanel(dom.introPanel);
        });
        
        // NPC Quest button
        document.getElementById('npc-quests-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.introPanel);
            if (window.openQuestsPanel) {
                window.openQuestsPanel();
            }
        });
        
        // NPC Shop/Rewards button
        document.getElementById('npc-shop-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            closePanel(dom.introPanel);
            showRewardsPanel();
        });
        
        // Color unlock panel
        dom.unlockColorSave?.addEventListener('click', saveColorChoice);
        dom.unlockColor?.addEventListener('input', (e) => {
            updateTadpoleColor(e.target.value);
            updateUnlockPreviewCanvas(e.target.value);
        });
        
        // Chat
        dom.chatToggle?.addEventListener('click', toggleChat);
        dom.chatToggle?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleChat();
        }, { passive: false });
        dom.chatSend?.addEventListener('click', sendChatMessage);
        dom.chatSend?.addEventListener('touchstart', (e) => {
            e.preventDefault();
            sendChatMessage();
        }, { passive: false });
        dom.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
            if (e.key === 'Escape') {
                toggleChat();
            }
        });
        dom.chatInput?.addEventListener('focus', () => {
            if (!state.chatOpen) {
                state.chatOpen = true;
                dom.chatInputArea.classList.remove('hidden');
            }
        });
        
        // Chat keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (state.currentPanel) return;
            
            const target = e.target.tagName.toLowerCase();
            if (target === 'input' || target === 'textarea') return;
            
            if (e.key === 'Enter' || e.key === 't' || e.key === 'T') {
                if (!state.chatOpen) {
                    e.preventDefault();
                    toggleChat();
                }
            }
            
            if (e.key === 'Escape') {
                if (state.chatOpen) {
                    toggleChat();
                }
                closeAllPanels();
            }
        });
        
        // Players
        dom.playerCountValue?.parentElement?.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel(dom.playersPanel);
            if (!dom.playersPanel.classList.contains('hidden') && state.app) {
                state.app.requestPlayerList();
            }
        });
        
        dom.privateSend?.addEventListener('click', sendPrivateMessage);
        dom.privateInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendPrivateMessage();
            }
        });
        
        // Reconnect
        dom.reconnectBtn?.addEventListener('click', () => {
            location.reload();
        });
        
        // Click outside panels to close - with delay to prevent immediate close
        let panelJustOpened = false;
        
        const originalOpenPanel = openPanel;
        openPanel = function(panel) {
            panelJustOpened = true;
            originalOpenPanel(panel);
            setTimeout(() => { panelJustOpened = false; }, 100);
        };
        
        document.addEventListener('click', (e) => {
            if (!state.currentPanel || panelJustOpened) return;
            
            // Don't close if clicking inside the panel
            if (state.currentPanel.contains(e.target)) return;
            
            // Don't close if clicking on HUD buttons
            if (e.target.closest('.hud-btn, .hud-stat, .floating-btn, #menu-panel, #profile-panel, #help-panel, #players-panel, #intro-panel, #color-unlock-panel')) return;
            
            closeAllPanels();
        });
        
        // Prevent context menu on game
        dom.canvas?.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // ============================================
    // Game Loop Integration
    // ============================================
    
    function gameLoop() {
        if (state.app) {
            state.app.update();
            state.app.draw();
            
            // Update GameSystems
            if (window.GameSystems && state.app.model) {
                window.GameSystems.update(state.app.model, 1000 / CONFIG.frameRate);
            }
        }
        updateBoostBar();
        updateQuestUI();
        updateGameSystemsUI();
    }
    
    // ============================================
    // Game Systems UI Updates
    // ============================================
    
    function updateGameSystemsUI() {
        if (!window.GameSystems) return;
        
        const stats = window.GameSystems.playerStats;
        const inventory = window.GameSystems.inventory;
        const gameState = window.GameSystems.gameState;
        const now = Date.now();
        
        // Update health bar
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        if (healthFill && healthText) {
            const hpPercent = (stats.hp / stats.maxHp) * 100;
            healthFill.style.width = hpPercent + '%';
            healthText.textContent = `${stats.hp}/${stats.maxHp}`;
            
            // Color based on health
            if (hpPercent > 50) {
                healthFill.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
            } else if (hpPercent > 25) {
                healthFill.style.background = 'linear-gradient(90deg, #ff9800, #ffc107)';
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #f44336, #ff5722)';
            }
        }
        
        // Update XP bar
        const xpFill = document.getElementById('xp-fill');
        const levelValue = document.getElementById('level-value');
        if (xpFill && levelValue) {
            const xpPercent = (stats.xp / stats.xpToNext) * 100;
            xpFill.style.width = xpPercent + '%';
            levelValue.textContent = `Niv.${stats.level}`;
        }
        
        // Update inventory slots
        const hotbarSlots = window.GameSystems?.inventory?.hotbarSlots || 4;
        for (let i = 0; i < hotbarSlots; i++) {
            const slot = document.getElementById(`inv-slot-${i}`);
            const icon = document.getElementById(`slot-icon-${i}`);
            const cooldown = document.getElementById(`slot-cooldown-${i}`);
            
            if (!slot || !icon) continue;
            
            const item = inventory.getItem(i);
            
            if (item) {
                icon.textContent = item.icon;
                slot.classList.remove('empty');
                slot.className = `inventory-slot rarity-${item.rarity}`;
                slot.title = `${item.name}\n${item.description}`;
                
                // Check cooldown for spells
                if (item.type === 'spell') {
                    const cooldownKey = `spell_cooldown_${i}`;
                    const cooldownEnd = gameState[cooldownKey] || 0;
                    
                    if (now < cooldownEnd) {
                        const remaining = cooldownEnd - now;
                        const percent = (remaining / item.cooldown) * 100;
                        cooldown.style.height = percent + '%';
                        slot.classList.add('on-cooldown');
                    } else {
                        cooldown.style.height = '0%';
                        slot.classList.remove('on-cooldown');
                    }
                }
            } else {
                icon.textContent = '';
                slot.className = 'inventory-slot empty';
                slot.title = 'Slot vide';
                cooldown.style.height = '0%';
            }
        }
        
        
        // Mirror hotbar to Wild Rift mobile controls (WR slots)
        for (let i = 0; i < hotbarSlots; i++) {
            const btn = document.getElementById(`wr-slot-${i}`);
            const icon = document.getElementById(`wr-slot-icon-${i}`);
            const cd = document.getElementById(`wr-slot-cd-${i}`);
            if (!btn || !icon || !cd) continue;

            const item = inventory.getItem(i);
            if (item) {
                icon.textContent = item.icon;
                btn.classList.remove('empty');
                btn.title = `${item.name}\n${item.description}`;
                // Cooldown for spells
                if (item.type === 'spell') {
                    const cooldownKey = `spell_cooldown_${i}`;
                    const cooldownEnd = gameState[cooldownKey] || 0;
                    if (now < cooldownEnd) {
                        const remaining = cooldownEnd - now;
                        const percent = (remaining / item.cooldown) * 100;
                        cd.style.height = percent + '%';
                        btn.classList.add('on-cooldown');
                    } else {
                        cd.style.height = '0%';
                        btn.classList.remove('on-cooldown');
                    }
                } else {
                    cd.style.height = '0%';
                    btn.classList.remove('on-cooldown');
                }
            } else {
                icon.textContent = '';
                btn.classList.add('empty');
                btn.title = 'Slot vide';
                cd.style.height = '0%';
                btn.classList.remove('on-cooldown');
            }
        }

        // Attack button cooldown (server-authoritative when possible)
        const attackCdEl = document.getElementById('wr-attack-cd');
        if (attackCdEl) {
            const meleeEnd = gameState.meleeCooldownUntil || 0;
            const meleeMs = gameState.meleeCooldownMs || 750;
            if (meleeEnd && now < meleeEnd) {
                const remaining = meleeEnd - now;
                const percent = (remaining / meleeMs) * 100;
                attackCdEl.style.height = percent + '%';
            } else {
                attackCdEl.style.height = '0%';
            }
        }


        // Update active quest
        const questManager = window.GameSystems.questManager;
        if (questManager.activeQuests.length > 0) {
            const activeQuest = questManager.activeQuests[0];
            const questData = window.GameSystems.QUESTS[activeQuest.id];
            
            const questIcon = document.getElementById('active-quest-icon');
            const questName = document.getElementById('active-quest-name');
            const questProgress = document.getElementById('quest-progress');
            const questFill = document.getElementById('quest-fill');
            
            if (questData && questIcon && questName) {
                questIcon.textContent = questData.icon;
                questName.textContent = questData.name;
                questProgress.textContent = `${activeQuest.progress} / ${activeQuest.target}`;
                
                const percent = (activeQuest.progress / activeQuest.target) * 100;
                questFill.style.width = percent + '%';
            }
        }
    }
    
    // Initialize inventory slot click handlers
    function initInventoryHandlers() {
        const hotbarSlots = window.GameSystems?.inventory?.hotbarSlots || 4;
        for (let i = 0; i < hotbarSlots; i++) {
            const slot = document.getElementById(`inv-slot-${i}`);
            if (slot) {
				// Touch-friendly (avoid 300ms delay and double-trigger)
				slot.addEventListener('touchstart', (e) => {
					e.preventDefault();
					e.stopPropagation();
					slot._lastTouchAt = Date.now();
					// Spell equip mode: tap a hotbar slot after selecting a spell in the bag
					if (window.uiState && window.uiState.pendingEquipSpellId && window.webSocketService?.sendSpellEquip) {
						const spellId = window.uiState.pendingEquipSpellId;
						window.webSocketService.sendSpellEquip(spellId, i);
						if (window.uiState._pendingBagEl) window.uiState._pendingBagEl.classList.remove('selected');
						window.uiState.pendingEquipSpellId = null;
						window.uiState.pendingEquipFromInvSlot = null;
						window.uiState._pendingBagEl = null;
						showToast('✅ Sort équipé', 'success');
						updateGameSystemsUI();
						updateProfilePanel();
						return;
					}
					if (window.GameSystems) {
						if (window.inputState && window.inputState.isDropping) {
							if (window.GameSystems.inventory.dropItem(i, state.app?.model)) {
								updateGameSystemsUI();
							}
							window.inputState.isDropping = false;
							slot.classList.remove('dropping');
							return;
						}
						window.GameSystems.inventory.useItem(i, window.GameSystems.playerStats, window.GameSystems.gameState);
					}
				}, { passive: false });

				slot.addEventListener('click', (e) => {
					if (slot._lastTouchAt && (Date.now() - slot._lastTouchAt) < 450) return;
					// Spell equip mode: tap a hotbar slot after selecting a spell in the bag
					if (window.uiState && window.uiState.pendingEquipSpellId && window.webSocketService?.sendSpellEquip) {
						e.preventDefault();
						const spellId = window.uiState.pendingEquipSpellId;
						window.webSocketService.sendSpellEquip(spellId, i);
						if (window.uiState._pendingBagEl) window.uiState._pendingBagEl.classList.remove('selected');
						window.uiState.pendingEquipSpellId = null;
						window.uiState.pendingEquipFromInvSlot = null;
						window.uiState._pendingBagEl = null;
						showToast('✅ Sort équipé', 'success');
						updateGameSystemsUI();
						updateProfilePanel();
						return;
					}
                    if (window.GameSystems) {
                        if (window.inputState && window.inputState.isDropping) {
                            if (window.GameSystems.inventory.dropItem(i, state.app?.model)) {
                                updateGameSystemsUI();
                            }
                            window.inputState.isDropping = false;
                            slot.classList.remove('dropping');
                            return;
                        }
                        window.GameSystems.inventory.useItem(i, window.GameSystems.playerStats, window.GameSystems.gameState);
                    }
                });
                slot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (window.GameSystems?.inventory.dropItem(i, state.app?.model)) {
                        updateGameSystemsUI();
                    }
                });
            }
        }
        
        // Keyboard shortcuts for hotbar (AZER only) + inventory (I) + companion (B)
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'Shift') {
                window.inputState = window.inputState || {};
                window.inputState.isDropping = true;
                document.querySelectorAll('.inventory-slot').forEach((slot) => {
                    slot.classList.add('dropping');
                });
            }
            
            const key = String(e.key || '').toLowerCase();
            // Slot R is also triggered by Space
            if (key === 'a') {
                window.GameSystems?.inventory.useItem(0, window.GameSystems.playerStats, window.GameSystems.gameState);
            } else if (key === 'z') {
                window.GameSystems?.inventory.useItem(1, window.GameSystems.playerStats, window.GameSystems.gameState);
            } else if (key === 'e') {
                window.GameSystems?.inventory.useItem(2, window.GameSystems.playerStats, window.GameSystems.gameState);
            } else if (key === 'r' || e.code === 'Space') {
                if (e.code === 'Space') e.preventDefault();
                window.GameSystems?.inventory.useItem(3, window.GameSystems.playerStats, window.GameSystems.gameState);
            } else if (key === 'i') {
                // Open inventory/profile panel
                if (dom.profilePanel) {
                    e.preventDefault();
                    togglePanel(dom.profilePanel);
                }
            } else if (key === 'b') {
                // Companion command spell (if equipped in any slot)
                const spells = window.GameSystems?.equippedSpells;
                if (Array.isArray(spells)) {
                    for (let si = 0; si < Math.min(4, spells.length); si++) {
                        const s = spells[si];
                        const id = s && (s.id || s.itemId || s.spellId);
                        if (id === 'spell_companion') {
                            window.GameSystems?.inventory.useItem(si, window.GameSystems.playerStats, window.GameSystems.gameState);
                            break;
                        }
                    }
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                window.inputState = window.inputState || {};
                window.inputState.isDropping = false;
                document.querySelectorAll('.inventory-slot').forEach((slot) => {
                    slot.classList.remove('dropping');
                });
            }
        });
        
        // PvP toggle
        const pvpToggle = document.getElementById('pvp-toggle');
        if (pvpToggle) {
            pvpToggle.addEventListener('click', () => {
                if (window.GameSystems && window.GameSystems.combat) {
                    window.GameSystems.combat.togglePvP();
                    pvpToggle.classList.toggle('active', window.GameSystems.combat.pvpEnabled);
                    if (state.app && typeof state.app.setPvpEnabled === 'function') {
                        state.app.setPvpEnabled(window.GameSystems.combat.pvpEnabled);
                    }
                }
            });
        }
    }
    
    // Initialize quest panel
    function initQuestPanel() {
        const questTracker = document.getElementById('quest-tracker');
        if (questTracker) {
            questTracker.addEventListener('click', (e) => {
                e.stopPropagation();
                openQuestsPanel();
            });
        }
        
        // Tab switching
        document.querySelectorAll('.quest-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderQuestsList(tab.dataset.tab);
            });
        });
    }
    
    function openQuestsPanel() {
        const panel = document.getElementById('quests-panel');
        if (panel) {
            renderQuestsList('available');
            openPanel(panel);
        }
    }
    
    function renderQuestsList(tab) {
        const list = document.getElementById('quests-list');
        if (!list || !window.GameSystems) return;
        
        list.innerHTML = '';
        const qm = window.GameSystems.questManager;
        const QUESTS = window.GameSystems.QUESTS;
        
        let quests = [];
        
        if (tab === 'available') {
            quests = qm.getAvailableQuests();
        } else if (tab === 'active') {
            quests = qm.activeQuests.map(aq => ({
                ...QUESTS[aq.id],
                progress: aq.progress,
                target: aq.target
            }));
        } else if (tab === 'completed') {
            quests = qm.completedQuests.map(id => QUESTS[id]).filter(Boolean);
        }
        
        if (quests.length === 0) {
            list.innerHTML = '<div class="empty-state">Aucune quête</div>';
            return;
        }
        
        quests.forEach(quest => {
            const item = document.createElement('div');
            item.className = `quest-item difficulty-${quest.difficulty || 'easy'}`;
            
            const isActive = qm.activeQuests.some(aq => aq.id === quest.id);
            const activeData = qm.activeQuests.find(aq => aq.id === quest.id);
            
            let progressHtml = '';
            if (isActive && activeData) {
                const percent = (activeData.progress / activeData.target) * 100;
                progressHtml = `
                    <div class="quest-item-progress">
                        <div class="quest-item-progress-bar">
                            <div class="quest-item-progress-fill" style="width: ${percent}%"></div>
                        </div>
                        <span>${activeData.progress} / ${activeData.target}</span>
                    </div>
                `;
            }
            
            let buttonHtml = '';
            if (tab === 'available') {
                buttonHtml = `<button class="quest-item-btn" data-quest-id="${quest.id}">Accepter</button>`;
            }
            
            item.innerHTML = `
                <div class="quest-item-header">
                    <span class="quest-item-icon">${quest.icon}</span>
                    <span class="quest-item-name">${quest.name}</span>
                    <span class="quest-item-difficulty">${quest.difficulty?.toUpperCase() || 'FACILE'}</span>
                </div>
                <div class="quest-item-desc">${quest.description?.replace('{target}', quest.targetAmount) || ''}</div>
                <div class="quest-item-rewards">
                    ${quest.rewards?.xp ? `<span>⭐ ${quest.rewards.xp} XP</span>` : ''}
                    ${quest.rewards?.gems ? `<span>💎 ${quest.rewards.gems}</span>` : ''}
                    ${quest.rewards?.item ? `<span>🎁 Item</span>` : ''}
                </div>
                ${progressHtml}
                ${buttonHtml}
            `;
            
            list.appendChild(item);
        });
        
        // Add click handlers for accept buttons
        list.querySelectorAll('.quest-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const questId = btn.dataset.questId;
                if (qm.acceptQuest(questId)) {
                    renderQuestsList(tab);
                }
            });
        });
    }
    
    // Expose quest panel function
    window.openQuestsPanel = openQuestsPanel;
    
    // ============================================
    // Rewards Panel (Ovule's Shop)
    // ============================================
    
    function showRewardsPanel() {
        const panel = document.getElementById('rewards-panel');
        if (!panel) return;
        
        renderRewardsList();
        openPanel(panel);
    }
    
    function renderRewardsList() {
        const list = document.getElementById('rewards-list');
        if (!list || !window.GameSystems) return;
        
        const stats = window.GameSystems.playerStats;
        const gems = parseInt(localStorage.getItem('tadpole_gems') || '0', 10);
        
        // Update gems display
        const gemsDisplay = document.getElementById('shop-gems-count');
        if (gemsDisplay) {
            gemsDisplay.textContent = gems;
        }
        
        // Available rewards
        const rewards = [
            { id: 'potion_health', name: 'Potion de Vie', icon: '❤️', cost: 2, desc: 'Restaure 30 PV' },
            { id: 'potion_speed', name: 'Potion de Vitesse', icon: '💨', cost: 3, desc: 'Boost 10s' },
            { id: 'shield_bubble', name: 'Bulle Protectrice', icon: '🛡️', cost: 5, desc: 'Invincible 5s' },
            { id: 'spell_wave', name: 'Sort: Vague', icon: '🌊', cost: 8, desc: '25 dégâts zone' },
            { id: 'spell_lightning', name: 'Sort: Éclair', icon: '⚡', cost: 12, desc: '40 dégâts rapide' },
            { id: 'spell_vortex', name: 'Sort: Vortex', icon: '🌀', cost: 20, desc: '60 dégâts dévastateur' },
        ];
        
        list.innerHTML = '';
        
        rewards.forEach(reward => {
            const canAfford = gems >= reward.cost;
            const isFull = window.GameSystems.inventory.isFull();
            
            const item = document.createElement('div');
            item.className = `reward-item ${!canAfford ? 'disabled' : ''}`;
            item.innerHTML = `
                <span class="reward-icon">${reward.icon}</span>
                <div class="reward-info">
                    <span class="reward-name">${reward.name}</span>
                    <span class="reward-desc">${reward.desc}</span>
                </div>
                <div class="reward-cost">
                    <span>💎</span>
                    <span>${reward.cost}</span>
                </div>
                <button class="reward-buy-btn" ${!canAfford || isFull ? 'disabled' : ''} data-item="${reward.id}" data-cost="${reward.cost}">
                    ${isFull ? 'Sac plein' : (canAfford ? 'Acheter' : 'Pas assez')}
                </button>
            `;
            list.appendChild(item);
        });
        
        // Add buy handlers
        list.querySelectorAll('.reward-buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.dataset.item;
                const cost = parseInt(btn.dataset.cost, 10);
                buyReward(itemId, cost);
                renderRewardsList(); // Refresh list
            });
        });
    }
    
    function buyReward(itemId, cost) {
        const gems = parseInt(localStorage.getItem('tadpole_gems') || '0', 10);
        
        if (gems < cost) {
            showToast('Pas assez de gemmes !', 'error');
            return;
        }
        
        if (window.GameSystems.inventory.isFull()) {
            showToast('Inventaire plein !', 'warning');
            return;
        }
        
        // Deduct gems
        localStorage.setItem('tadpole_gems', (gems - cost).toString());
        
        // Add item
        if (window.GameSystems.inventory.addItem(itemId)) {
            showToast('Achat réussi !', 'success');
        }
    }
    
    window.showRewardsPanel = showRewardsPanel;

    // ============================================
    // App Initialization
    // ============================================
    
    function initApp() {
        if (state.app) return;
        
        state.settings = new Settings();
        state.app = new App(state.settings, dom.canvas);
        window.app = state.app;
        window.gameApp = state.app;
        
        // Initialize GameSystems
        if (window.GameSystems) {
            window.GameSystems.init();
        }
        
        // Initialize inventory handlers
        initInventoryHandlers();
        initQuestPanel();
        
        // Input handlers
        document.addEventListener('mousemove', state.app.mousemove, false);
        document.addEventListener('mousedown', state.app.mousedown, false);
        document.addEventListener('mouseup', state.app.mouseup, false);
        document.addEventListener('touchstart', state.app.touchstart, { passive: false });
        document.addEventListener('touchend', state.app.touchend, { passive: false });
        document.addEventListener('touchcancel', state.app.touchend, { passive: false });
        document.addEventListener('touchmove', state.app.touchmove, { passive: false });
        document.addEventListener('keydown', state.app.keydown, false);
        document.addEventListener('keyup', state.app.keyup, false);
        
        // Game loop
        setInterval(gameLoop, 1000 / CONFIG.frameRate);
    }

    // ============================================
    // Bootstrap
    // ============================================
    
    function init() {
        // Detect device type
        state.isMobile = isMobileDevice();
        state.isTouch = 'ontouchstart' in window;
        try {
            if (state.isMobile || state.isTouch) {
                document.body.classList.add('wr-mobile');
            }
        } catch (e) {}
        
        // Set viewport height
        setVH();
        
        // Cache DOM elements
        cacheDOMElements();
        
        // Check browser support
        const hasCanvas = !!window.HTMLCanvasElement;
        const hasWebSocket = 'WebSocket' in window;
        
        if (!hasCanvas || !hasWebSocket) {
            dom.unsupportedBrowser.classList.remove('hidden');
            return;
        }
        
        // Initialize
        setupEventListeners();
        initProfile();
        hideLoadingScreen();
        
        // Initialize app when Settings is ready
        if (typeof Settings !== 'undefined') {
            initApp();
        } else {
            // Wait for Settings to load
            const checkSettings = setInterval(() => {
                if (typeof Settings !== 'undefined') {
                    clearInterval(checkSettings);
                    initApp();
                }
            }, 100);
        }
        
        // Initialize mobile controls
        if (state.isMobile || state.isTouch) {
            initVirtualJoystick();
            initWildRiftControls();
        }
        
        // Prevent body scroll on mobile
        document.body.addEventListener('touchmove', (e) => {
            if (e.target === document.body || e.target === dom.canvas) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
