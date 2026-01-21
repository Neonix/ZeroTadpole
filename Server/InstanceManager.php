<?php
/**
 * ZeroTadpole - Instance Manager
 * Gestion des instances (donjons, arènes PvP, raids)
 */
namespace Server;

use \Workerman\Timer;

class InstanceManager 
{
    private $worldServer;
    private $instances = [];
    private $instanceIdCounter = 1;
    private $maxInstancesPerType = 10;
    
    // Types d'instances disponibles
    const TYPE_ARENA_1V1 = 'arena_1v1';
    const TYPE_ARENA_2V2 = 'arena_2v2';
    const TYPE_ARENA_FFA = 'arena_ffa';
    const TYPE_DUNGEON_EASY = 'dungeon_easy';
    const TYPE_DUNGEON_MEDIUM = 'dungeon_medium';
    const TYPE_DUNGEON_HARD = 'dungeon_hard';
    const TYPE_RAID = 'raid';
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
        $this->instances = [];
        
        // Nettoyage périodique des instances vides
        Timer::add(30, [$this, 'cleanupEmptyInstances']);
    }
    
    /**
     * Définitions des types d'instances
     */
    public function getInstanceDefinitions()
    {
        return [
            self::TYPE_ARENA_1V1 => [
                'name' => 'Arène 1v1',
                'description' => 'Combat PvP en duel',
                'maxPlayers' => 2,
                'minPlayers' => 2,
                'mapWidth' => 400,
                'mapHeight' => 400,
                'duration' => 300, // 5 minutes
                'pvpEnabled' => true,
                'mobsEnabled' => false,
                'rewards' => ['gems' => 3, 'xp' => 100]
            ],
            self::TYPE_ARENA_2V2 => [
                'name' => 'Arène 2v2',
                'description' => 'Combat PvP en équipe',
                'maxPlayers' => 4,
                'minPlayers' => 4,
                'mapWidth' => 600,
                'mapHeight' => 600,
                'duration' => 420,
                'pvpEnabled' => true,
                'mobsEnabled' => false,
                'rewards' => ['gems' => 5, 'xp' => 150]
            ],
            self::TYPE_ARENA_FFA => [
                'name' => 'Mêlée Générale',
                'description' => 'Tous contre tous (max 8)',
                'maxPlayers' => 8,
                'minPlayers' => 3,
                'mapWidth' => 800,
                'mapHeight' => 800,
                'duration' => 300,
                'pvpEnabled' => true,
                'mobsEnabled' => false,
                'rewards' => ['gems' => 2, 'xp' => 50]
            ],
            self::TYPE_DUNGEON_EASY => [
                'name' => 'Grotte des Crabes',
                'description' => 'Donjon facile - Niveau 1-10',
                'maxPlayers' => 4,
                'minPlayers' => 1,
                'mapWidth' => 1000,
                'mapHeight' => 1000,
                'duration' => 600,
                'pvpEnabled' => false,
                'mobsEnabled' => true,
                'mobTypes' => ['crab_small', 'jellyfish'],
                'bossType' => 'shark_mini',
                'mobCount' => 15,
                'rewards' => ['gems' => 5, 'xp' => 200]
            ],
            self::TYPE_DUNGEON_MEDIUM => [
                'name' => 'Antre du Poulpe',
                'description' => 'Donjon moyen - Niveau 10-20',
                'maxPlayers' => 4,
                'minPlayers' => 2,
                'mapWidth' => 1200,
                'mapHeight' => 1200,
                'duration' => 900,
                'pvpEnabled' => false,
                'mobsEnabled' => true,
                'mobTypes' => ['jellyfish', 'shark_mini'],
                'bossType' => 'octopus_boss',
                'mobCount' => 20,
                'rewards' => ['gems' => 10, 'xp' => 500]
            ],
            self::TYPE_DUNGEON_HARD => [
                'name' => 'Abysses Profondes',
                'description' => 'Donjon difficile - Niveau 20+',
                'maxPlayers' => 4,
                'minPlayers' => 3,
                'mapWidth' => 1500,
                'mapHeight' => 1500,
                'duration' => 1200,
                'pvpEnabled' => false,
                'mobsEnabled' => true,
                'mobTypes' => ['shark_mini', 'octopus_boss'],
                'bossType' => 'leviathan',
                'mobCount' => 25,
                'rewards' => ['gems' => 20, 'xp' => 1000]
            ],
            self::TYPE_RAID => [
                'name' => 'Raid: Léviathan',
                'description' => 'Raid épique - 8 joueurs requis',
                'maxPlayers' => 8,
                'minPlayers' => 6,
                'mapWidth' => 2000,
                'mapHeight' => 2000,
                'duration' => 1800,
                'pvpEnabled' => false,
                'mobsEnabled' => true,
                'mobTypes' => ['shark_mini', 'octopus_boss'],
                'bossType' => 'leviathan',
                'mobCount' => 40,
                'rewards' => ['gems' => 50, 'xp' => 2500]
            ]
        ];
    }
    
    /**
     * Créer une nouvelle instance
     */
    public function createInstance($type, $creatorId)
    {
        $definitions = $this->getInstanceDefinitions();
        
        if (!isset($definitions[$type])) {
            return ['success' => false, 'error' => 'Type d\'instance invalide'];
        }
        
        $def = $definitions[$type];
        $instanceId = 'inst_' . $this->instanceIdCounter++;
        
        $instance = [
            'id' => $instanceId,
            'type' => $type,
            'name' => $def['name'],
            'creatorId' => $creatorId,
            'players' => [],
            'state' => 'waiting', // waiting, active, completed
            'maxPlayers' => $def['maxPlayers'],
            'minPlayers' => $def['minPlayers'],
            'mapWidth' => $def['mapWidth'],
            'mapHeight' => $def['mapHeight'],
            'duration' => $def['duration'],
            'pvpEnabled' => $def['pvpEnabled'],
            'mobsEnabled' => $def['mobsEnabled'],
            'createdAt' => microtime(true),
            'startedAt' => null,
            'endsAt' => null,
            'mobs' => [],
            'loot' => [],
            'rewards' => $def['rewards'],
            'definition' => $def
        ];
        
        $this->instances[$instanceId] = $instance;
        
        echo "Instance créée: {$instanceId} ({$type})\n";
        
        return [
            'success' => true, 
            'instanceId' => $instanceId,
            'instance' => $this->getPublicInstanceData($instance)
        ];
    }
    
    /**
     * Rejoindre une instance
     */
    public function joinInstance($instanceId, $playerId)
    {
        if (!isset($this->instances[$instanceId])) {
            return ['success' => false, 'error' => 'Instance introuvable'];
        }
        
        $instance = &$this->instances[$instanceId];
        
        if ($instance['state'] !== 'waiting') {
            return ['success' => false, 'error' => 'Instance déjà en cours'];
        }
        
        if (count($instance['players']) >= $instance['maxPlayers']) {
            return ['success' => false, 'error' => 'Instance pleine'];
        }
        
        if (in_array($playerId, $instance['players'])) {
            return ['success' => false, 'error' => 'Déjà dans l\'instance'];
        }
        
        $instance['players'][] = $playerId;
        
        // Vérifier si on peut démarrer
        if (count($instance['players']) >= $instance['minPlayers']) {
            $this->startInstance($instanceId);
        }
        
        return [
            'success' => true,
            'instance' => $this->getPublicInstanceData($instance)
        ];
    }
    
    /**
     * Quitter une instance
     */
    public function leaveInstance($instanceId, $playerId)
    {
        if (!isset($this->instances[$instanceId])) {
            return ['success' => false, 'error' => 'Instance introuvable'];
        }
        
        $instance = &$this->instances[$instanceId];
        $index = array_search($playerId, $instance['players']);
        
        if ($index === false) {
            return ['success' => false, 'error' => 'Pas dans cette instance'];
        }
        
        array_splice($instance['players'], $index, 1);
        
        // Téléporter le joueur hors de l'instance
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $spawnPos = $this->worldServer->getSpawnPosition();
            $player->setPosition($spawnPos['x'], $spawnPos['y'], 0, 0);
            $this->worldServer->pushToPlayer($player, new Messages\Teleport($player));
        }
        
        return ['success' => true];
    }
    
    /**
     * Démarrer une instance
     */
    public function startInstance($instanceId)
    {
        if (!isset($this->instances[$instanceId])) {
            return false;
        }
        
        $instance = &$this->instances[$instanceId];
        
        if ($instance['state'] !== 'waiting') {
            return false;
        }
        
        $instance['state'] = 'active';
        $instance['startedAt'] = microtime(true);
        $instance['endsAt'] = microtime(true) + $instance['duration'];
        
        // Générer les mobs si nécessaire
        if ($instance['mobsEnabled'] && isset($instance['definition']['mobTypes'])) {
            $this->spawnInstanceMobs($instanceId);
        }
        
        // Téléporter les joueurs dans l'instance
        foreach ($instance['players'] as $playerId) {
            $this->teleportPlayerToInstance($playerId, $instanceId);
        }
        
        // Timer de fin d'instance
        Timer::add($instance['duration'], function() use ($instanceId) {
            $this->endInstance($instanceId);
        }, [], false);
        
        echo "Instance démarrée: {$instanceId}\n";
        
        return true;
    }
    
    /**
     * Terminer une instance
     */
    public function endInstance($instanceId, $winnerIds = [])
    {
        if (!isset($this->instances[$instanceId])) {
            return;
        }
        
        $instance = &$this->instances[$instanceId];
        $instance['state'] = 'completed';
        
        // Distribuer les récompenses
        foreach ($instance['players'] as $playerId) {
            $player = $this->worldServer->getEntityById($playerId);
            if ($player) {
                // Téléporter hors de l'instance
                $spawnPos = $this->worldServer->getSpawnPosition();
                $player->setPosition($spawnPos['x'], $spawnPos['y'], 0, 0);
                $this->worldServer->pushToPlayer($player, new Messages\Teleport($player));
                
                // Envoyer les récompenses
                $isWinner = in_array($playerId, $winnerIds) || empty($winnerIds);
                if ($isWinner) {
                    $this->worldServer->pushToPlayer($player, new Messages\InstanceReward($instance['rewards']));
                }
            }
        }
        
        // Supprimer l'instance après un délai
        Timer::add(5, function() use ($instanceId) {
            unset($this->instances[$instanceId]);
        }, [], false);
        
        echo "Instance terminée: {$instanceId}\n";
    }
    
    /**
     * Spawn les mobs d'une instance
     */
    private function spawnInstanceMobs($instanceId)
    {
        $instance = &$this->instances[$instanceId];
        $def = $instance['definition'];
        
        $mobTypes = $def['mobTypes'] ?? [];
        $mobCount = $def['mobCount'] ?? 10;
        
        for ($i = 0; $i < $mobCount; $i++) {
            $mobType = $mobTypes[array_rand($mobTypes)];
            $x = rand(50, $instance['mapWidth'] - 50);
            $y = rand(50, $instance['mapHeight'] - 50);
            
            $instance['mobs'][] = [
                'id' => 'mob_' . $instanceId . '_' . $i,
                'type' => $mobType,
                'x' => $x,
                'y' => $y,
                'hp' => 100, // Sera défini par le type
                'alive' => true
            ];
        }
        
        // Spawn le boss
        if (isset($def['bossType'])) {
            $instance['mobs'][] = [
                'id' => 'boss_' . $instanceId,
                'type' => $def['bossType'],
                'x' => $instance['mapWidth'] / 2,
                'y' => $instance['mapHeight'] / 2,
                'hp' => 500,
                'alive' => true,
                'isBoss' => true
            ];
        }
    }
    
    /**
     * Téléporter un joueur dans une instance
     */
    private function teleportPlayerToInstance($playerId, $instanceId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $instance = $this->instances[$instanceId];
        
        // Position aléatoire près du spawn
        $x = 50 + rand(0, 100);
        $y = 50 + rand(0, 100);
        
        $player->setPosition($x, $y, 0, 0);
        $player->currentInstance = $instanceId;
        
        $this->worldServer->pushToPlayer($player, new Messages\Teleport($player));
        $this->worldServer->pushToPlayer($player, new Messages\InstanceJoined($instance));
    }
    
    /**
     * Nettoyer les instances vides
     */
    public function cleanupEmptyInstances()
    {
        $now = microtime(true);
        
        foreach ($this->instances as $id => $instance) {
            // Supprimer les instances en attente depuis plus de 5 minutes
            if ($instance['state'] === 'waiting' && ($now - $instance['createdAt']) > 300) {
                unset($this->instances[$id]);
                echo "Instance nettoyée (timeout): {$id}\n";
            }
            
            // Supprimer les instances actives vides
            if ($instance['state'] === 'active' && empty($instance['players'])) {
                unset($this->instances[$id]);
                echo "Instance nettoyée (vide): {$id}\n";
            }
        }
    }
    
    /**
     * Obtenir la liste des instances disponibles
     */
    public function getAvailableInstances()
    {
        $available = [];
        
        foreach ($this->instances as $id => $instance) {
            if ($instance['state'] === 'waiting') {
                $available[] = $this->getPublicInstanceData($instance);
            }
        }
        
        return $available;
    }
    
    /**
     * Obtenir les données publiques d'une instance
     */
    private function getPublicInstanceData($instance)
    {
        return [
            'id' => $instance['id'],
            'type' => $instance['type'],
            'name' => $instance['name'],
            'playerCount' => count($instance['players']),
            'maxPlayers' => $instance['maxPlayers'],
            'minPlayers' => $instance['minPlayers'],
            'state' => $instance['state'],
            'pvpEnabled' => $instance['pvpEnabled']
        ];
    }
    
    /**
     * Obtenir l'instance d'un joueur
     */
    public function getPlayerInstance($playerId)
    {
        foreach ($this->instances as $instance) {
            if (in_array($playerId, $instance['players'])) {
                return $instance;
            }
        }
        return null;
    }
}
