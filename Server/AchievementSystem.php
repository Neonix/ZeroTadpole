<?php
/**
 * ZeroTadpole - Achievement System v1.0
 * Système de succès avec récompenses
 */
namespace Server;

class AchievementSystem
{
    private $worldServer;
    private $playerAchievements = [];  // playerId => achievement data
    
    // Définition des achievements
    private $achievements = [
        // === EXPLORATION ===
        'first_steps' => [
            'id' => 'first_steps',
            'name' => 'Premiers Pas',
            'description' => 'Déplacez-vous pour la première fois',
            'icon' => '👣',
            'category' => 'exploration',
            'hidden' => false,
            'rewards' => ['xp' => 10, 'gems' => 5],
            'condition' => ['type' => 'distance', 'value' => 10]
        ],
        'explorer' => [
            'id' => 'explorer',
            'name' => 'Explorateur',
            'description' => 'Parcourez 1000 unités',
            'icon' => '🗺️',
            'category' => 'exploration',
            'hidden' => false,
            'rewards' => ['xp' => 100, 'gems' => 20],
            'condition' => ['type' => 'distance', 'value' => 1000]
        ],
        'world_traveler' => [
            'id' => 'world_traveler',
            'name' => 'Globe-Trotter',
            'description' => 'Parcourez 10000 unités',
            'icon' => '🌍',
            'category' => 'exploration',
            'hidden' => false,
            'rewards' => ['xp' => 500, 'gems' => 100, 'title' => 'Globe-Trotter'],
            'condition' => ['type' => 'distance', 'value' => 10000]
        ],
        'danger_zone' => [
            'id' => 'danger_zone',
            'name' => 'Zone Dangereuse',
            'description' => 'Entrez dans la zone de danger',
            'icon' => '☠️',
            'category' => 'exploration',
            'hidden' => false,
            'rewards' => ['xp' => 200, 'gems' => 50],
            'condition' => ['type' => 'enter_zone', 'value' => 'danger']
        ],
        
        // === COMBAT ===
        'first_blood' => [
            'id' => 'first_blood',
            'name' => 'Premier Sang',
            'description' => 'Tuez votre premier mob',
            'icon' => '🩸',
            'category' => 'combat',
            'hidden' => false,
            'rewards' => ['xp' => 25, 'gems' => 10],
            'condition' => ['type' => 'kills', 'value' => 1]
        ],
        'monster_hunter' => [
            'id' => 'monster_hunter',
            'name' => 'Chasseur de Monstres',
            'description' => 'Tuez 50 mobs',
            'icon' => '🏹',
            'category' => 'combat',
            'hidden' => false,
            'rewards' => ['xp' => 250, 'gems' => 50],
            'condition' => ['type' => 'kills', 'value' => 50]
        ],
        'slayer' => [
            'id' => 'slayer',
            'name' => 'Tueur',
            'description' => 'Tuez 500 mobs',
            'icon' => '⚔️',
            'category' => 'combat',
            'hidden' => false,
            'rewards' => ['xp' => 1000, 'gems' => 200, 'title' => 'Tueur'],
            'condition' => ['type' => 'kills', 'value' => 500]
        ],
        'legend_killer' => [
            'id' => 'legend_killer',
            'name' => 'Tueur de Légendes',
            'description' => 'Tuez 5000 mobs',
            'icon' => '🏆',
            'category' => 'combat',
            'hidden' => true,
            'rewards' => ['xp' => 5000, 'gems' => 1000, 'title' => 'Légende'],
            'condition' => ['type' => 'kills', 'value' => 5000]
        ],
        'crab_specialist' => [
            'id' => 'crab_specialist',
            'name' => 'Spécialiste Crabes',
            'description' => 'Tuez 100 crabes',
            'icon' => '🦀',
            'category' => 'combat',
            'hidden' => false,
            'rewards' => ['xp' => 300, 'gems' => 75],
            'condition' => ['type' => 'kill_type', 'mobType' => 'crab', 'value' => 100]
        ],
        'elite_hunter' => [
            'id' => 'elite_hunter',
            'name' => 'Chasseur d\'Élites',
            'description' => 'Tuez 10 mobs élites',
            'icon' => '👑',
            'category' => 'combat',
            'hidden' => false,
            'rewards' => ['xp' => 500, 'gems' => 150],
            'condition' => ['type' => 'elite_kills', 'value' => 10]
        ],
        'boss_slayer' => [
            'id' => 'boss_slayer',
            'name' => 'Tueur de Boss',
            'description' => 'Tuez un boss mondial',
            'icon' => '🐉',
            'category' => 'combat',
            'hidden' => false,
            'rewards' => ['xp' => 1000, 'gems' => 300, 'item' => 'spell_vortex'],
            'condition' => ['type' => 'boss_kills', 'value' => 1]
        ],
        
        // === SURVIE ===
        'survivor' => [
            'id' => 'survivor',
            'name' => 'Survivant',
            'description' => 'Survivez 10 minutes',
            'icon' => '⏱️',
            'category' => 'survival',
            'hidden' => false,
            'rewards' => ['xp' => 100, 'gems' => 25],
            'condition' => ['type' => 'survive_time', 'value' => 600]
        ],
        'immortal' => [
            'id' => 'immortal',
            'name' => 'Immortel',
            'description' => 'Survivez 1 heure sans mourir',
            'icon' => '♾️',
            'category' => 'survival',
            'hidden' => false,
            'rewards' => ['xp' => 1000, 'gems' => 500, 'title' => 'Immortel'],
            'condition' => ['type' => 'survive_time', 'value' => 3600]
        ],
        'close_call' => [
            'id' => 'close_call',
            'name' => 'L\'échapper Belle',
            'description' => 'Survivez avec moins de 5% HP',
            'icon' => '💔',
            'category' => 'survival',
            'hidden' => true,
            'rewards' => ['xp' => 150, 'gems' => 50],
            'condition' => ['type' => 'low_hp_survive', 'value' => 5]
        ],
        
        // === PROGRESSION ===
        'level_5' => [
            'id' => 'level_5',
            'name' => 'Apprenti',
            'description' => 'Atteignez le niveau 5',
            'icon' => '⭐',
            'category' => 'progression',
            'hidden' => false,
            'rewards' => ['xp' => 100, 'gems' => 25],
            'condition' => ['type' => 'level', 'value' => 5]
        ],
        'level_10' => [
            'id' => 'level_10',
            'name' => 'Vétéran',
            'description' => 'Atteignez le niveau 10',
            'icon' => '🌟',
            'category' => 'progression',
            'hidden' => false,
            'rewards' => ['xp' => 250, 'gems' => 75],
            'condition' => ['type' => 'level', 'value' => 10]
        ],
        'level_25' => [
            'id' => 'level_25',
            'name' => 'Expert',
            'description' => 'Atteignez le niveau 25',
            'icon' => '💫',
            'category' => 'progression',
            'hidden' => false,
            'rewards' => ['xp' => 500, 'gems' => 200, 'title' => 'Expert'],
            'condition' => ['type' => 'level', 'value' => 25]
        ],
        'level_50' => [
            'id' => 'level_50',
            'name' => 'Maître',
            'description' => 'Atteignez le niveau 50',
            'icon' => '✨',
            'category' => 'progression',
            'hidden' => false,
            'rewards' => ['xp' => 2000, 'gems' => 500, 'title' => 'Maître'],
            'condition' => ['type' => 'level', 'value' => 50]
        ],
        
        // === SOCIAL ===
        'social_butterfly' => [
            'id' => 'social_butterfly',
            'name' => 'Papillon Social',
            'description' => 'Envoyez 10 messages dans le chat',
            'icon' => '💬',
            'category' => 'social',
            'hidden' => false,
            'rewards' => ['xp' => 50, 'gems' => 15],
            'condition' => ['type' => 'chat_messages', 'value' => 10]
        ],
        'team_player' => [
            'id' => 'team_player',
            'name' => 'Joueur d\'Équipe',
            'description' => 'Rejoignez un groupe',
            'icon' => '👥',
            'category' => 'social',
            'hidden' => false,
            'rewards' => ['xp' => 75, 'gems' => 25],
            'condition' => ['type' => 'join_group', 'value' => 1]
        ],
        'leader' => [
            'id' => 'leader',
            'name' => 'Meneur',
            'description' => 'Créez un groupe',
            'icon' => '👑',
            'category' => 'social',
            'hidden' => false,
            'rewards' => ['xp' => 100, 'gems' => 35],
            'condition' => ['type' => 'create_group', 'value' => 1]
        ],
        
        // === COLLECTION ===
        'collector' => [
            'id' => 'collector',
            'name' => 'Collectionneur',
            'description' => 'Ramassez 100 items',
            'icon' => '🎒',
            'category' => 'collection',
            'hidden' => false,
            'rewards' => ['xp' => 200, 'gems' => 50],
            'condition' => ['type' => 'items_collected', 'value' => 100]
        ],
        'hoarder' => [
            'id' => 'hoarder',
            'name' => 'Accumulateur',
            'description' => 'Ramassez 1000 items',
            'icon' => '📦',
            'category' => 'collection',
            'hidden' => false,
            'rewards' => ['xp' => 1000, 'gems' => 250],
            'condition' => ['type' => 'items_collected', 'value' => 1000]
        ],
        'wealthy' => [
            'id' => 'wealthy',
            'name' => 'Fortuné',
            'description' => 'Accumulez 1000 gems',
            'icon' => '💎',
            'category' => 'collection',
            'hidden' => false,
            'rewards' => ['xp' => 500, 'gems' => 100, 'title' => 'Riche'],
            'condition' => ['type' => 'gems_total', 'value' => 1000]
        ],
        
        // === QUÊTES ===
        'quest_starter' => [
            'id' => 'quest_starter',
            'name' => 'Début d\'Aventure',
            'description' => 'Complétez votre première quête',
            'icon' => '📜',
            'category' => 'quests',
            'hidden' => false,
            'rewards' => ['xp' => 50, 'gems' => 20],
            'condition' => ['type' => 'quests_completed', 'value' => 1]
        ],
        'quest_master' => [
            'id' => 'quest_master',
            'name' => 'Maître des Quêtes',
            'description' => 'Complétez 50 quêtes',
            'icon' => '📚',
            'category' => 'quests',
            'hidden' => false,
            'rewards' => ['xp' => 1000, 'gems' => 300, 'title' => 'Aventurier'],
            'condition' => ['type' => 'quests_completed', 'value' => 50]
        ],
        
        // === SPÉCIAUX ===
        'night_owl' => [
            'id' => 'night_owl',
            'name' => 'Hibou de Nuit',
            'description' => 'Jouez entre minuit et 5h',
            'icon' => '🦉',
            'category' => 'special',
            'hidden' => true,
            'rewards' => ['xp' => 100, 'gems' => 50],
            'condition' => ['type' => 'play_time', 'hours' => [0, 1, 2, 3, 4, 5]]
        ],
        'speed_demon' => [
            'id' => 'speed_demon',
            'name' => 'Démon de Vitesse',
            'description' => 'Tuez 10 mobs en 1 minute',
            'icon' => '💨',
            'category' => 'special',
            'hidden' => true,
            'rewards' => ['xp' => 300, 'gems' => 100],
            'condition' => ['type' => 'kills_per_minute', 'value' => 10]
        ],
        'pacifist' => [
            'id' => 'pacifist',
            'name' => 'Pacifiste',
            'description' => 'Survivez 5 min sans attaquer',
            'icon' => '☮️',
            'category' => 'special',
            'hidden' => true,
            'rewards' => ['xp' => 200, 'gems' => 75],
            'condition' => ['type' => 'survive_no_attack', 'value' => 300]
        ]
    ];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Initialise les achievements d'un joueur
     */
    public function initPlayer($playerId)
    {
        $this->playerAchievements[$playerId] = [
            'unlocked' => [],
            'progress' => [],
            'stats' => [
                'distance' => 0,
                'kills' => 0,
                'elite_kills' => 0,
                'boss_kills' => 0,
                'deaths' => 0,
                'items_collected' => 0,
                'quests_completed' => 0,
                'chat_messages' => 0,
                'groups_joined' => 0,
                'groups_created' => 0,
                'survive_time' => 0,
                'current_survive_time' => 0,
                'kill_types' => [],
                'zones_visited' => [],
                'session_start' => time(),
                'last_attack' => 0,
                'kills_this_minute' => 0,
                'minute_start' => time()
            ]
        ];
    }
    
    /**
     * Met à jour une statistique et vérifie les achievements
     */
    public function updateStat($playerId, $stat, $value = 1, $set = false)
    {
        if (!isset($this->playerAchievements[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        $data = &$this->playerAchievements[$playerId];
        
        if ($set) {
            $data['stats'][$stat] = $value;
        } else {
            $data['stats'][$stat] = ($data['stats'][$stat] ?? 0) + $value;
        }
        
        // Vérifier les achievements liés
        $this->checkAchievements($playerId);
    }
    
    /**
     * Incrémente un type de kill spécifique
     */
    public function recordKill($playerId, $mobType, $isElite = false, $isBoss = false)
    {
        if (!isset($this->playerAchievements[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        $data = &$this->playerAchievements[$playerId];
        $data['stats']['kills']++;
        
        if ($isElite) $data['stats']['elite_kills']++;
        if ($isBoss) $data['stats']['boss_kills']++;
        
        // Type spécifique
        $baseType = preg_replace('/_small|_large|_giant|_elite/', '', $mobType);
        $data['stats']['kill_types'][$baseType] = ($data['stats']['kill_types'][$baseType] ?? 0) + 1;
        
        // Kills par minute
        $now = time();
        if ($now - $data['stats']['minute_start'] > 60) {
            $data['stats']['minute_start'] = $now;
            $data['stats']['kills_this_minute'] = 0;
        }
        $data['stats']['kills_this_minute']++;
        
        $this->checkAchievements($playerId);
    }
    
    /**
     * Vérifie tous les achievements
     */
    public function checkAchievements($playerId)
    {
        if (!isset($this->playerAchievements[$playerId])) return;
        
        $data = &$this->playerAchievements[$playerId];
        $player = $this->worldServer->getEntityById($playerId);
        
        foreach ($this->achievements as $id => $achievement) {
            // Déjà débloqué ?
            if (isset($data['unlocked'][$id])) continue;
            
            $unlocked = $this->checkCondition($playerId, $achievement['condition']);
            
            if ($unlocked) {
                $this->unlockAchievement($playerId, $id);
            }
        }
    }
    
    /**
     * Vérifie une condition spécifique
     */
    private function checkCondition($playerId, $condition)
    {
        $data = $this->playerAchievements[$playerId];
        $stats = $data['stats'];
        
        switch ($condition['type']) {
            case 'distance':
                return $stats['distance'] >= $condition['value'];
                
            case 'kills':
                return $stats['kills'] >= $condition['value'];
                
            case 'elite_kills':
                return $stats['elite_kills'] >= $condition['value'];
                
            case 'boss_kills':
                return $stats['boss_kills'] >= $condition['value'];
                
            case 'kill_type':
                $typeKills = $stats['kill_types'][$condition['mobType']] ?? 0;
                return $typeKills >= $condition['value'];
                
            case 'survive_time':
                return $stats['survive_time'] >= $condition['value'];
                
            case 'level':
                $player = $this->worldServer->getEntityById($playerId);
                return $player && ($player->level ?? 1) >= $condition['value'];
                
            case 'items_collected':
                return $stats['items_collected'] >= $condition['value'];
                
            case 'quests_completed':
                return $stats['quests_completed'] >= $condition['value'];
                
            case 'chat_messages':
                return $stats['chat_messages'] >= $condition['value'];
                
            case 'join_group':
                return $stats['groups_joined'] >= $condition['value'];
                
            case 'create_group':
                return $stats['groups_created'] >= $condition['value'];
                
            case 'gems_total':
                $inventory = $this->worldServer->inventoryManager;
                if ($inventory) {
                    $gems = $inventory->getGems($playerId);
                    return $gems >= $condition['value'];
                }
                return false;
                
            case 'enter_zone':
                return in_array($condition['value'], $stats['zones_visited']);
                
            case 'low_hp_survive':
                // Géré en temps réel
                return false;
                
            case 'play_time':
                $hour = (int)date('G');
                return in_array($hour, $condition['hours']);
                
            case 'kills_per_minute':
                return $stats['kills_this_minute'] >= $condition['value'];
                
            case 'survive_no_attack':
                $timeSinceAttack = time() - $stats['last_attack'];
                return $timeSinceAttack >= $condition['value'];
        }
        
        return false;
    }
    
    /**
     * Débloque un achievement
     */
    public function unlockAchievement($playerId, $achievementId)
    {
        if (!isset($this->achievements[$achievementId])) return;
        if (!isset($this->playerAchievements[$playerId])) return;
        
        $achievement = $this->achievements[$achievementId];
        $data = &$this->playerAchievements[$playerId];
        
        // Marquer comme débloqué
        $data['unlocked'][$achievementId] = time();
        
        // Donner les récompenses
        $rewards = $achievement['rewards'];
        $player = $this->worldServer->getEntityById($playerId);
        
        if ($player) {
            if (isset($rewards['xp'])) {
                $this->worldServer->questSystem->addXP($player, $rewards['xp']);
            }
            
            if (isset($rewards['gems'])) {
                $this->worldServer->inventoryManager->addGems($playerId, $rewards['gems']);
            }
            
            if (isset($rewards['item'])) {
                $this->worldServer->inventoryManager->addItem($playerId, $rewards['item'], 1);
            }
            
            if (isset($rewards['title'])) {
                $player->unlockedTitles = $player->unlockedTitles ?? [];
                $player->unlockedTitles[] = $rewards['title'];
            }
            
            // Notifier le joueur
            $this->worldServer->pushToPlayer($player, [
                'type' => 'achievement_unlocked',
                'achievement' => $achievement,
                'rewards' => $rewards
            ]);
            
            // Annoncer (sauf si caché)
            if (!$achievement['hidden']) {
                $this->worldServer->pushBroadcast([
                    'type' => 'achievement_announce',
                    'playerName' => $player->name,
                    'achievement' => [
                        'name' => $achievement['name'],
                        'icon' => $achievement['icon']
                    ]
                ]);
            }
        }
    }
    
    /**
     * Synchronise les achievements avec le client
     */
    public function syncAchievements($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $data = $this->playerAchievements[$playerId] ?? null;
        if (!$data) return;
        
        // Filtrer les achievements cachés non débloqués
        $visibleAchievements = [];
        foreach ($this->achievements as $id => $achievement) {
            if (!$achievement['hidden'] || isset($data['unlocked'][$id])) {
                $visibleAchievements[$id] = $achievement;
                $visibleAchievements[$id]['unlocked'] = isset($data['unlocked'][$id]);
                $visibleAchievements[$id]['unlockedAt'] = $data['unlocked'][$id] ?? null;
            }
        }
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'achievements_sync',
            'achievements' => $visibleAchievements,
            'stats' => $data['stats'],
            'totalUnlocked' => count($data['unlocked']),
            'totalAchievements' => count($this->achievements)
        ]);
    }
    
    /**
     * Appelé chaque tick pour mettre à jour les temps
     */
    public function tick()
    {
        foreach ($this->playerAchievements as $playerId => &$data) {
            $data['stats']['survive_time']++;
            $data['stats']['current_survive_time']++;
        }
    }
    
    /**
     * Appelé quand le joueur meurt
     */
    public function onPlayerDeath($playerId)
    {
        if (!isset($this->playerAchievements[$playerId])) return;
        
        $this->playerAchievements[$playerId]['stats']['deaths']++;
        $this->playerAchievements[$playerId]['stats']['current_survive_time'] = 0;
    }
    
    /**
     * Appelé quand le joueur attaque
     */
    public function onPlayerAttack($playerId)
    {
        if (!isset($this->playerAchievements[$playerId])) return;
        $this->playerAchievements[$playerId]['stats']['last_attack'] = time();
    }
    
    /**
     * Appelé quand le joueur entre dans une zone
     */
    public function onEnterZone($playerId, $zoneName)
    {
        if (!isset($this->playerAchievements[$playerId])) return;
        
        if (!in_array($zoneName, $this->playerAchievements[$playerId]['stats']['zones_visited'])) {
            $this->playerAchievements[$playerId]['stats']['zones_visited'][] = $zoneName;
            $this->checkAchievements($playerId);
        }
    }
    
    /**
     * Appelé quand le joueur survit avec peu de HP
     */
    public function onLowHpSurvive($playerId, $hpPercent)
    {
        if (!isset($this->playerAchievements[$playerId])) return;
        
        if ($hpPercent <= 5 && !isset($this->playerAchievements[$playerId]['unlocked']['close_call'])) {
            $this->unlockAchievement($playerId, 'close_call');
        }
    }
    
    public function onPlayerDisconnect($playerId)
    {
        unset($this->playerAchievements[$playerId]);
    }
    
    public function getPlayerData($playerId)
    {
        return $this->playerAchievements[$playerId] ?? null;
    }
    
    public function loadPlayerData($playerId, $data)
    {
        if ($data) {
            $this->playerAchievements[$playerId] = $data;
        } else {
            $this->initPlayer($playerId);
        }
    }
}
