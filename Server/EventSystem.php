<?php
/**
 * ZeroTadpole - Daily Rewards & Events System v1.0
 * Récompenses journalières et événements serveur
 */
namespace Server;

class EventSystem
{
    private $worldServer;
    private $playerDailyData = [];
    private $activeEvents = [];
    private $worldBosses = [];
    private $lastEventCheck = 0;
    
    // Configuration des récompenses journalières (7 jours)
    private $dailyRewards = [
        1 => ['gems' => 10, 'items' => ['potion_health' => 2], 'xp' => 50],
        2 => ['gems' => 15, 'items' => ['material_coral' => 5], 'xp' => 75],
        3 => ['gems' => 20, 'items' => ['potion_speed' => 1], 'xp' => 100],
        4 => ['gems' => 30, 'items' => ['material_pearl' => 2], 'xp' => 150],
        5 => ['gems' => 40, 'items' => ['potion_strength' => 1], 'xp' => 200],
        6 => ['gems' => 50, 'items' => ['material_pearl' => 3], 'xp' => 250],
        7 => ['gems' => 100, 'items' => ['spell_wave' => 1], 'xp' => 500, 'bonus' => true]
    ];
    
    // Types d'événements
    private $eventTypes = [
        'double_xp' => [
            'name' => '🌟 Double XP',
            'description' => 'Gagnez le double d\'expérience !',
            'duration' => 3600, // 1 heure
            'icon' => '⭐',
            'effect' => ['xp_multiplier' => 2]
        ],
        'double_drops' => [
            'name' => '💎 Double Drops',
            'description' => 'Les mobs lâchent le double de butin !',
            'duration' => 3600,
            'icon' => '🎁',
            'effect' => ['drop_multiplier' => 2]
        ],
        'mob_frenzy' => [
            'name' => '🔥 Frénésie de Mobs',
            'description' => '50% plus de mobs spawnnent !',
            'duration' => 1800, // 30 min
            'icon' => '👹',
            'effect' => ['spawn_multiplier' => 1.5]
        ],
        'elite_invasion' => [
            'name' => '👑 Invasion Élite',
            'description' => 'Les mobs élites envahissent le monde !',
            'duration' => 1800,
            'icon' => '💀',
            'effect' => ['elite_chance' => 0.5]
        ],
        'treasure_hunt' => [
            'name' => '🗺️ Chasse au Trésor',
            'description' => 'Des coffres apparaissent dans le monde !',
            'duration' => 2400, // 40 min
            'icon' => '📦',
            'effect' => ['spawn_chests' => true]
        ],
        'happy_hour' => [
            'name' => '🎉 Happy Hour',
            'description' => 'Tous les bonus actifs !',
            'duration' => 1800,
            'icon' => '🎊',
            'effect' => ['xp_multiplier' => 1.5, 'drop_multiplier' => 1.5, 'gold_multiplier' => 1.5]
        ]
    ];
    
    // World Bosses
    private $worldBossTypes = [
        'kraken' => [
            'id' => 'kraken',
            'name' => 'Le Kraken',
            'icon' => '🐙',
            'hp' => 50000,
            'damage' => 100,
            'size' => 40,
            'color' => '#8B0000',
            'rewards' => [
                'xp' => 5000,
                'gems' => 500,
                'items' => ['material_abyssal_essence' => 3, 'spell_vortex' => 1]
            ],
            'abilities' => ['tentacle_slam', 'ink_cloud', 'whirlpool'],
            'spawnMessage' => '🐙 Le Kraken émerge des profondeurs !'
        ],
        'leviathan' => [
            'id' => 'leviathan',
            'name' => 'Léviathan',
            'icon' => '🐉',
            'hp' => 75000,
            'damage' => 150,
            'size' => 50,
            'color' => '#4B0082',
            'rewards' => [
                'xp' => 8000,
                'gems' => 800,
                'items' => ['armor_abyssal' => 1, 'material_abyssal_essence' => 5]
            ],
            'abilities' => ['tidal_wave', 'deep_dive', 'roar'],
            'spawnMessage' => '🐉 Le Léviathan rugit depuis les abysses !'
        ],
        'storm_elemental' => [
            'id' => 'storm_elemental',
            'name' => 'Élémentaire de Tempête',
            'icon' => '🌊',
            'hp' => 35000,
            'damage' => 80,
            'size' => 35,
            'color' => '#00CED1',
            'rewards' => [
                'xp' => 3000,
                'gems' => 300,
                'items' => ['spell_lightning' => 1, 'material_electric_eel' => 5]
            ],
            'abilities' => ['lightning_strike', 'storm_surge', 'electric_field'],
            'spawnMessage' => '🌊 Un Élémentaire de Tempête se forme !'
        ]
    ];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Initialise les données journalières d'un joueur
     */
    public function initPlayer($playerId)
    {
        $this->playerDailyData[$playerId] = [
            'lastLogin' => null,
            'loginStreak' => 0,
            'dailyRewardClaimed' => false,
            'todayDate' => date('Y-m-d'),
            'participatedEvents' => [],
            'bossContributions' => []
        ];
    }
    
    /**
     * Vérifie et récompense la connexion journalière
     */
    public function checkDailyLogin($playerId)
    {
        if (!isset($this->playerDailyData[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        $data = &$this->playerDailyData[$playerId];
        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        
        // Si déjà connecté aujourd'hui
        if ($data['todayDate'] === $today) {
            return ['alreadyClaimed' => $data['dailyRewardClaimed'], 'streak' => $data['loginStreak']];
        }
        
        // Nouveau jour
        $data['todayDate'] = $today;
        $data['dailyRewardClaimed'] = false;
        
        // Vérifier la série
        if ($data['lastLogin'] === $yesterday) {
            $data['loginStreak']++;
            if ($data['loginStreak'] > 7) {
                $data['loginStreak'] = 1; // Reset après 7 jours
            }
        } else {
            $data['loginStreak'] = 1; // Reset si pas connecté hier
        }
        
        $data['lastLogin'] = $today;
        
        return ['alreadyClaimed' => false, 'streak' => $data['loginStreak']];
    }
    
    /**
     * Réclame la récompense journalière
     */
    public function claimDailyReward($playerId)
    {
        $loginStatus = $this->checkDailyLogin($playerId);
        
        if ($loginStatus['alreadyClaimed']) {
            return ['success' => false, 'error' => 'Récompense déjà réclamée aujourd\'hui'];
        }
        
        $streak = $loginStatus['streak'];
        $reward = $this->dailyRewards[$streak];
        
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) {
            return ['success' => false, 'error' => 'Joueur introuvable'];
        }
        
        // Donner les récompenses
        $inventory = $this->worldServer->inventoryManager;
        
        // Gems
        if (isset($reward['gems'])) {
            $inventory->addGems($playerId, $reward['gems']);
        }
        
        // Items
        if (isset($reward['items'])) {
            foreach ($reward['items'] as $itemId => $quantity) {
                $inventory->addItem($playerId, $itemId, $quantity);
            }
        }
        
        // XP
        if (isset($reward['xp']) && $this->worldServer->questSystem) {
            $this->worldServer->questSystem->addXP($player, $reward['xp']);
        }
        
        // Marquer comme réclamé
        $this->playerDailyData[$playerId]['dailyRewardClaimed'] = true;
        
        // Notifier
        $this->worldServer->pushToPlayer($player, [
            'type' => 'daily_reward_claimed',
            'day' => $streak,
            'reward' => $reward,
            'nextReward' => $this->dailyRewards[($streak % 7) + 1] ?? $this->dailyRewards[1]
        ]);
        
        return ['success' => true, 'day' => $streak, 'reward' => $reward];
    }
    
    /**
     * Démarre un événement
     */
    public function startEvent($eventType)
    {
        if (!isset($this->eventTypes[$eventType])) {
            return ['success' => false, 'error' => 'Type d\'événement inconnu'];
        }
        
        // Vérifier si l'événement est déjà actif
        if (isset($this->activeEvents[$eventType])) {
            return ['success' => false, 'error' => 'Événement déjà actif'];
        }
        
        $eventConfig = $this->eventTypes[$eventType];
        $now = time();
        
        $this->activeEvents[$eventType] = [
            'type' => $eventType,
            'config' => $eventConfig,
            'startTime' => $now,
            'endTime' => $now + $eventConfig['duration'],
            'participants' => []
        ];
        
        // Annoncer l'événement
        $this->worldServer->pushBroadcast([
            'type' => 'event_started',
            'event' => [
                'type' => $eventType,
                'name' => $eventConfig['name'],
                'description' => $eventConfig['description'],
                'icon' => $eventConfig['icon'],
                'duration' => $eventConfig['duration'],
                'endTime' => $now + $eventConfig['duration']
            ]
        ]);
        
        return ['success' => true, 'event' => $this->activeEvents[$eventType]];
    }
    
    /**
     * Termine un événement
     */
    public function endEvent($eventType)
    {
        if (!isset($this->activeEvents[$eventType])) {
            return;
        }
        
        $event = $this->activeEvents[$eventType];
        
        // Annoncer la fin
        $this->worldServer->pushBroadcast([
            'type' => 'event_ended',
            'event' => [
                'type' => $eventType,
                'name' => $event['config']['name'],
                'participants' => count($event['participants'])
            ]
        ]);
        
        unset($this->activeEvents[$eventType]);
    }
    
    /**
     * Obtient les bonus d'événements actifs
     */
    public function getActiveEventBonuses()
    {
        $bonuses = [
            'xp_multiplier' => 1,
            'drop_multiplier' => 1,
            'gold_multiplier' => 1,
            'spawn_multiplier' => 1,
            'elite_chance' => 0
        ];
        
        foreach ($this->activeEvents as $event) {
            $effects = $event['config']['effect'];
            
            foreach ($effects as $key => $value) {
                if (isset($bonuses[$key])) {
                    if (strpos($key, 'multiplier') !== false) {
                        $bonuses[$key] *= $value;
                    } else {
                        $bonuses[$key] += $value;
                    }
                }
            }
        }
        
        return $bonuses;
    }
    
    /**
     * Spawn un World Boss
     */
    public function spawnWorldBoss($bossType = null)
    {
        // Choisir un boss aléatoire si non spécifié
        if ($bossType === null) {
            $types = array_keys($this->worldBossTypes);
            $bossType = $types[array_rand($types)];
        }
        
        if (!isset($this->worldBossTypes[$bossType])) {
            return ['success' => false, 'error' => 'Type de boss inconnu'];
        }
        
        $bossConfig = $this->worldBossTypes[$bossType];
        
        // Position aléatoire dans la zone danger
        $angle = mt_rand(0, 360) * M_PI / 180;
        $distance = mt_rand(900, 1200);
        $x = cos($angle) * $distance;
        $y = sin($angle) * $distance;
        
        $bossId = 'boss_' . time();
        
        $this->worldBosses[$bossId] = [
            'id' => $bossId,
            'type' => $bossType,
            'config' => $bossConfig,
            'x' => $x,
            'y' => $y,
            'hp' => $bossConfig['hp'],
            'maxHp' => $bossConfig['hp'],
            'spawnTime' => time(),
            'contributors' => [], // playerId => damage dealt
            'lastAbility' => 0
        ];
        
        // Annoncer le spawn
        $this->worldServer->pushBroadcast([
            'type' => 'world_boss_spawn',
            'boss' => [
                'id' => $bossId,
                'type' => $bossType,
                'name' => $bossConfig['name'],
                'icon' => $bossConfig['icon'],
                'x' => $x,
                'y' => $y,
                'hp' => $bossConfig['hp'],
                'maxHp' => $bossConfig['hp']
            ],
            'message' => $bossConfig['spawnMessage']
        ]);
        
        return ['success' => true, 'bossId' => $bossId, 'position' => ['x' => $x, 'y' => $y]];
    }
    
    /**
     * Inflige des dégâts à un World Boss
     */
    public function damageWorldBoss($bossId, $playerId, $damage)
    {
        if (!isset($this->worldBosses[$bossId])) {
            return ['success' => false, 'error' => 'Boss introuvable'];
        }
        
        $boss = &$this->worldBosses[$bossId];
        
        // Enregistrer la contribution
        $boss['contributors'][$playerId] = ($boss['contributors'][$playerId] ?? 0) + $damage;
        
        // Infliger les dégâts
        $boss['hp'] -= $damage;
        
        // Broadcast la mise à jour
        $this->worldServer->pushBroadcast([
            'type' => 'world_boss_update',
            'bossId' => $bossId,
            'hp' => max(0, $boss['hp']),
            'maxHp' => $boss['maxHp'],
            'damageBy' => $playerId,
            'damage' => $damage
        ]);
        
        // Vérifier si mort
        if ($boss['hp'] <= 0) {
            $this->killWorldBoss($bossId);
        }
        
        return ['success' => true, 'bossHp' => max(0, $boss['hp'])];
    }
    
    /**
     * Tue un World Boss et distribue les récompenses
     */
    private function killWorldBoss($bossId)
    {
        if (!isset($this->worldBosses[$bossId])) return;
        
        $boss = $this->worldBosses[$bossId];
        $rewards = $boss['config']['rewards'];
        
        // Trier les contributeurs par dégâts
        arsort($boss['contributors']);
        
        $rank = 1;
        foreach ($boss['contributors'] as $playerId => $damage) {
            $player = $this->worldServer->getEntityById($playerId);
            if (!$player) continue;
            
            // Calculer le pourcentage de contribution
            $contribution = $damage / $boss['maxHp'];
            
            // Récompenses de base
            $playerRewards = [
                'xp' => (int)($rewards['xp'] * max(0.1, $contribution)),
                'gems' => (int)($rewards['gems'] * max(0.1, $contribution)),
                'items' => []
            ];
            
            // Top 3 obtient des items bonus
            if ($rank <= 3 && isset($rewards['items'])) {
                foreach ($rewards['items'] as $itemId => $qty) {
                    $playerRewards['items'][$itemId] = $rank === 1 ? $qty : max(1, (int)($qty / $rank));
                }
            }
            
            // Donner les récompenses
            $this->worldServer->inventoryManager->addGems($playerId, $playerRewards['gems']);
            foreach ($playerRewards['items'] as $itemId => $qty) {
                $this->worldServer->inventoryManager->addItem($playerId, $itemId, $qty);
            }
            if ($this->worldServer->questSystem) {
                $this->worldServer->questSystem->addXP($player, $playerRewards['xp']);
            }
            
            // Achievement
            if ($this->worldServer->achievementSystem) {
                $this->worldServer->achievementSystem->recordKill($playerId, $boss['type'], false, true);
            }
            
            // Notifier
            $this->worldServer->pushToPlayer($player, [
                'type' => 'world_boss_reward',
                'bossName' => $boss['config']['name'],
                'rank' => $rank,
                'contribution' => round($contribution * 100, 1),
                'rewards' => $playerRewards
            ]);
            
            $rank++;
        }
        
        // Annoncer la mort
        $topContributor = array_key_first($boss['contributors']);
        $topPlayer = $this->worldServer->getEntityById($topContributor);
        
        $this->worldServer->pushBroadcast([
            'type' => 'world_boss_killed',
            'bossId' => $bossId,
            'bossName' => $boss['config']['name'],
            'topPlayer' => $topPlayer ? $topPlayer->name : 'Inconnu',
            'participants' => count($boss['contributors'])
        ]);
        
        unset($this->worldBosses[$bossId]);
    }
    
    /**
     * Tick - vérifie les événements et boss
     */
    public function tick()
    {
        $now = time();
        
        // Vérifier les événements expirés
        foreach ($this->activeEvents as $type => $event) {
            if ($now >= $event['endTime']) {
                $this->endEvent($type);
            }
        }
        
        // Événements aléatoires (toutes les 5 min de jeu, 10% de chance)
        if ($now - $this->lastEventCheck >= 300) {
            $this->lastEventCheck = $now;
            
            if (mt_rand(1, 100) <= 10 && count($this->activeEvents) < 2) {
                $types = array_keys($this->eventTypes);
                $randomType = $types[array_rand($types)];
                
                if (!isset($this->activeEvents[$randomType])) {
                    $this->startEvent($randomType);
                }
            }
            
            // World Boss (5% de chance si aucun actif)
            if (empty($this->worldBosses) && mt_rand(1, 100) <= 5) {
                $this->spawnWorldBoss();
            }
        }
        
        // Mise à jour des boss (abilities, etc.)
        foreach ($this->worldBosses as $bossId => &$boss) {
            if ($now - $boss['lastAbility'] >= 10) {
                $boss['lastAbility'] = $now;
                $this->worldBossAbility($bossId);
            }
        }
    }
    
    /**
     * Fait utiliser une ability à un world boss
     */
    private function worldBossAbility($bossId)
    {
        if (!isset($this->worldBosses[$bossId])) return;
        
        $boss = $this->worldBosses[$bossId];
        $abilities = $boss['config']['abilities'];
        $ability = $abilities[array_rand($abilities)];
        
        $this->worldServer->pushBroadcast([
            'type' => 'world_boss_ability',
            'bossId' => $bossId,
            'ability' => $ability,
            'x' => $boss['x'],
            'y' => $boss['y']
        ]);
    }
    
    /**
     * Synchronise l'état avec un joueur
     */
    public function syncEvents($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $loginStatus = $this->checkDailyLogin($playerId);
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'events_sync',
            'activeEvents' => array_map(function($e) {
                return [
                    'type' => $e['type'],
                    'name' => $e['config']['name'],
                    'description' => $e['config']['description'],
                    'icon' => $e['config']['icon'],
                    'endTime' => $e['endTime'],
                    'effect' => $e['config']['effect']
                ];
            }, $this->activeEvents),
            'worldBosses' => array_map(function($b) {
                return [
                    'id' => $b['id'],
                    'type' => $b['type'],
                    'name' => $b['config']['name'],
                    'icon' => $b['config']['icon'],
                    'x' => $b['x'],
                    'y' => $b['y'],
                    'hp' => $b['hp'],
                    'maxHp' => $b['maxHp']
                ];
            }, $this->worldBosses),
            'dailyReward' => [
                'canClaim' => !$loginStatus['alreadyClaimed'],
                'currentStreak' => $loginStatus['streak'],
                'rewards' => $this->dailyRewards,
                'todayReward' => $this->dailyRewards[$loginStatus['streak']]
            ]
        ]);
    }
    
    public function onPlayerDisconnect($playerId)
    {
        // Garder les données daily pour la persistance
    }
    
    public function getPlayerData($playerId)
    {
        return $this->playerDailyData[$playerId] ?? null;
    }
    
    public function loadPlayerData($playerId, $data)
    {
        if ($data) {
            $this->playerDailyData[$playerId] = $data;
        } else {
            $this->initPlayer($playerId);
        }
    }
}
