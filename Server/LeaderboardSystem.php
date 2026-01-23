<?php
/**
 * ZeroTadpole - Leaderboard System v1.0
 * Classements temps réel avec plusieurs catégories
 */
namespace Server;

class LeaderboardSystem
{
    private $worldServer;
    private $leaderboards = [];
    private $playerScores = [];
    private $lastBroadcast = 0;
    private $broadcastInterval = 10; // Secondes entre les mises à jour broadcast
    
    // Types de classements
    const CATEGORIES = [
        'level' => [
            'name' => '🏆 Niveau',
            'description' => 'Classement par niveau',
            'icon' => '⭐',
            'sortOrder' => 'desc'
        ],
        'kills' => [
            'name' => '⚔️ Kills',
            'description' => 'Mobs tués',
            'icon' => '💀',
            'sortOrder' => 'desc'
        ],
        'xp' => [
            'name' => '📚 Expérience',
            'description' => 'XP totale accumulée',
            'icon' => '✨',
            'sortOrder' => 'desc'
        ],
        'quests' => [
            'name' => '📜 Quêtes',
            'description' => 'Quêtes complétées',
            'icon' => '📋',
            'sortOrder' => 'desc'
        ],
        'playtime' => [
            'name' => '⏱️ Temps de jeu',
            'description' => 'Temps total joué',
            'icon' => '🕐',
            'sortOrder' => 'desc'
        ],
        'gems' => [
            'name' => '💎 Richesse',
            'description' => 'Gems possédées',
            'icon' => '💰',
            'sortOrder' => 'desc'
        ],
        'boss_kills' => [
            'name' => '🐉 Boss',
            'description' => 'Boss tués',
            'icon' => '👑',
            'sortOrder' => 'desc'
        ],
        'achievements' => [
            'name' => '🎖️ Achievements',
            'description' => 'Succès débloqués',
            'icon' => '🏅',
            'sortOrder' => 'desc'
        ],
        'pvp_wins' => [
            'name' => '⚔️ PvP',
            'description' => 'Victoires PvP',
            'icon' => '🗡️',
            'sortOrder' => 'desc'
        ],
        'survival_time' => [
            'name' => '💪 Survie',
            'description' => 'Plus longue survie sans mourir',
            'icon' => '🛡️',
            'sortOrder' => 'desc'
        ]
    ];
    
    // Récompenses par rang (top 10)
    const RANK_REWARDS = [
        1 => ['gems' => 500, 'title' => 'Champion', 'icon' => '🥇'],
        2 => ['gems' => 300, 'title' => 'Vice-Champion', 'icon' => '🥈'],
        3 => ['gems' => 200, 'title' => 'Médaillé', 'icon' => '🥉'],
        4 => ['gems' => 100, 'icon' => '4️⃣'],
        5 => ['gems' => 75, 'icon' => '5️⃣'],
        6 => ['gems' => 50, 'icon' => '6️⃣'],
        7 => ['gems' => 40, 'icon' => '7️⃣'],
        8 => ['gems' => 30, 'icon' => '8️⃣'],
        9 => ['gems' => 20, 'icon' => '9️⃣'],
        10 => ['gems' => 10, 'icon' => '🔟']
    ];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
        
        // Initialiser les leaderboards
        foreach (self::CATEGORIES as $category => $info) {
            $this->leaderboards[$category] = [];
        }
    }
    
    /**
     * Met à jour le score d'un joueur
     */
    public function updateScore($playerId, $category, $value, $add = false)
    {
        if (!isset(self::CATEGORIES[$category])) return;
        
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        // Initialiser si nécessaire
        if (!isset($this->playerScores[$playerId])) {
            $this->playerScores[$playerId] = [
                'name' => $player->name,
                'color' => $player->color,
                'scores' => []
            ];
        }
        
        // Mettre à jour le nom/couleur
        $this->playerScores[$playerId]['name'] = $player->name;
        $this->playerScores[$playerId]['color'] = $player->color;
        
        // Mettre à jour le score
        if ($add) {
            $this->playerScores[$playerId]['scores'][$category] = 
                ($this->playerScores[$playerId]['scores'][$category] ?? 0) + $value;
        } else {
            $this->playerScores[$playerId]['scores'][$category] = $value;
        }
        
        // Rebuild le leaderboard de cette catégorie
        $this->rebuildLeaderboard($category);
    }
    
    /**
     * Met à jour plusieurs scores à la fois
     */
    public function updateMultipleScores($playerId, $scores)
    {
        foreach ($scores as $category => $value) {
            $this->updateScore($playerId, $category, $value);
        }
    }
    
    /**
     * Reconstruit un leaderboard
     */
    private function rebuildLeaderboard($category)
    {
        $entries = [];
        
        foreach ($this->playerScores as $playerId => $data) {
            $score = $data['scores'][$category] ?? 0;
            if ($score > 0) {
                $entries[] = [
                    'playerId' => $playerId,
                    'name' => $data['name'],
                    'color' => $data['color'],
                    'score' => $score
                ];
            }
        }
        
        // Trier selon l'ordre (desc par défaut)
        $sortOrder = self::CATEGORIES[$category]['sortOrder'] ?? 'desc';
        usort($entries, function($a, $b) use ($sortOrder) {
            if ($sortOrder === 'asc') {
                return $a['score'] - $b['score'];
            }
            return $b['score'] - $a['score'];
        });
        
        // Ajouter les rangs
        foreach ($entries as $i => &$entry) {
            $entry['rank'] = $i + 1;
        }
        
        $this->leaderboards[$category] = $entries;
    }
    
    /**
     * Obtient le classement d'une catégorie
     */
    public function getLeaderboard($category, $limit = 100)
    {
        if (!isset($this->leaderboards[$category])) {
            return [];
        }
        
        return array_slice($this->leaderboards[$category], 0, $limit);
    }
    
    /**
     * Obtient le top 10 de toutes les catégories
     */
    public function getAllTop10()
    {
        $result = [];
        
        foreach (self::CATEGORIES as $category => $info) {
            $result[$category] = [
                'info' => $info,
                'entries' => array_slice($this->leaderboards[$category] ?? [], 0, 10)
            ];
        }
        
        return $result;
    }
    
    /**
     * Obtient le rang d'un joueur dans une catégorie
     */
    public function getPlayerRank($playerId, $category)
    {
        if (!isset($this->leaderboards[$category])) return null;
        
        foreach ($this->leaderboards[$category] as $entry) {
            if ($entry['playerId'] === $playerId) {
                return $entry['rank'];
            }
        }
        
        return null;
    }
    
    /**
     * Obtient tous les rangs d'un joueur
     */
    public function getPlayerRanks($playerId)
    {
        $ranks = [];
        
        foreach (self::CATEGORIES as $category => $info) {
            $ranks[$category] = [
                'rank' => $this->getPlayerRank($playerId, $category),
                'score' => $this->playerScores[$playerId]['scores'][$category] ?? 0,
                'info' => $info
            ];
        }
        
        return $ranks;
    }
    
    /**
     * Synchronise le leaderboard avec un joueur
     */
    public function syncLeaderboard($playerId, $category = null)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        if ($category) {
            // Une seule catégorie
            $this->worldServer->pushToPlayer($player, [
                'type' => 'leaderboard_sync',
                'category' => $category,
                'info' => self::CATEGORIES[$category],
                'entries' => $this->getLeaderboard($category, 100),
                'playerRank' => $this->getPlayerRank($playerId, $category),
                'playerScore' => $this->playerScores[$playerId]['scores'][$category] ?? 0
            ]);
        } else {
            // Toutes les catégories (top 10)
            $this->worldServer->pushToPlayer($player, [
                'type' => 'leaderboard_full',
                'categories' => self::CATEGORIES,
                'leaderboards' => $this->getAllTop10(),
                'playerRanks' => $this->getPlayerRanks($playerId)
            ]);
        }
    }
    
    /**
     * Broadcast le top 3 de chaque catégorie (périodique)
     */
    public function tick()
    {
        $now = time();
        
        if ($now - $this->lastBroadcast >= $this->broadcastInterval) {
            $this->lastBroadcast = $now;
            
            // Envoyer uniquement le top 3 de la catégorie "level"
            $top3 = array_slice($this->leaderboards['level'] ?? [], 0, 3);
            
            if (!empty($top3)) {
                $this->worldServer->pushBroadcast([
                    'type' => 'leaderboard_top',
                    'category' => 'level',
                    'top3' => $top3
                ]);
            }
        }
    }
    
    /**
     * Distribue les récompenses hebdomadaires
     */
    public function distributeWeeklyRewards()
    {
        foreach (self::CATEGORIES as $category => $info) {
            $leaderboard = $this->leaderboards[$category] ?? [];
            
            foreach ($leaderboard as $entry) {
                if ($entry['rank'] > 10) break;
                
                $rewards = self::RANK_REWARDS[$entry['rank']] ?? null;
                if (!$rewards) continue;
                
                $player = $this->worldServer->getEntityById($entry['playerId']);
                if (!$player) continue;
                
                // Donner les gems
                if (isset($rewards['gems'])) {
                    $this->worldServer->inventoryManager->addGems($entry['playerId'], $rewards['gems']);
                }
                
                // Donner le titre
                if (isset($rewards['title'])) {
                    $player->unlockedTitles = $player->unlockedTitles ?? [];
                    if (!in_array($rewards['title'], $player->unlockedTitles)) {
                        $player->unlockedTitles[] = $rewards['title'];
                    }
                }
                
                // Notifier
                $this->worldServer->pushToPlayer($player, [
                    'type' => 'leaderboard_reward',
                    'category' => $category,
                    'rank' => $entry['rank'],
                    'rewards' => $rewards
                ]);
            }
        }
    }
    
    /**
     * Réinitialise un leaderboard (pour les classements hebdomadaires)
     */
    public function resetLeaderboard($category)
    {
        if (!isset(self::CATEGORIES[$category])) return;
        
        $this->leaderboards[$category] = [];
        
        foreach ($this->playerScores as &$data) {
            $data['scores'][$category] = 0;
        }
        
        $this->worldServer->pushBroadcast([
            'type' => 'leaderboard_reset',
            'category' => $category,
            'info' => self::CATEGORIES[$category]
        ]);
    }
    
    /**
     * Appelé quand un joueur se déconnecte
     */
    public function onPlayerDisconnect($playerId)
    {
        // Garder les scores en mémoire pour qu'ils restent dans le leaderboard
        // Optionnel: marquer comme offline
        if (isset($this->playerScores[$playerId])) {
            $this->playerScores[$playerId]['online'] = false;
        }
    }
    
    /**
     * Appelé quand un joueur se connecte
     */
    public function onPlayerConnect($playerId)
    {
        if (isset($this->playerScores[$playerId])) {
            $this->playerScores[$playerId]['online'] = true;
        }
    }
    
    /**
     * Obtient les scores d'un joueur pour sauvegarde
     */
    public function getPlayerData($playerId)
    {
        return $this->playerScores[$playerId] ?? null;
    }
    
    /**
     * Charge les scores d'un joueur
     */
    public function loadPlayerData($playerId, $data)
    {
        if ($data) {
            $this->playerScores[$playerId] = $data;
            $this->playerScores[$playerId]['online'] = true;
            
            // Rebuild tous les leaderboards
            foreach (self::CATEGORIES as $category => $info) {
                $this->rebuildLeaderboard($category);
            }
        }
    }
}
