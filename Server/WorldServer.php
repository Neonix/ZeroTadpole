<?php
/**
 * WorldServer v5.0 - Architecture serveur-autoritaire ultime
 * 
 * - Système de quêtes progressives intégré
 * - IA des mobs 100% côté serveur
 * - Synchronisation optimisée mobile/desktop
 * - Zones progressives avec tutoriel
 * - Système de groupes/équipes
 * - Inventaire serveur-autoritaire
 * - Talents et compétences passives
 * - Achievements et succès
 * - Crafting et fabrication
 * - Pets et compagnons
 * - Trading entre joueurs
 * - Leaderboard temps réel
 * - Events et World Bosses
 */
namespace Server;
use \Workerman\Worker;
use \Workerman\Timer;

require_once __DIR__ . '/Constants.php';
require_once __DIR__ . '/QuestSystem.php';
require_once __DIR__ . '/GroupManager.php';
require_once __DIR__ . '/InventoryManager.php';
require_once __DIR__ . '/TalentSystem.php';
require_once __DIR__ . '/AchievementSystem.php';
require_once __DIR__ . '/LeaderboardSystem.php';
require_once __DIR__ . '/CraftingSystem.php';
require_once __DIR__ . '/EventSystem.php';
require_once __DIR__ . '/PetSystem.php';
require_once __DIR__ . '/TradingSystem.php';

class WorldServer 
{
    const ZONE_TUTORIAL = 'tutorial';
    const ZONE_TRANSITION = 'transition';
    const ZONE_NORMAL = 'normal';
    const ZONE_DANGER = 'danger';
    const PROTOCOL_VERSION = 5;
    
    public $id;
    public $maxPlayers;
    public $server;
    public $ups = 30;
    
    public $zoneConfig = [
        'tutorialRadius' => 200,
        'transitionRadius' => 400,
        'normalRadius' => 800,
        'dangerRadius' => PHP_INT_MAX
    ];
    
    public $mobConfig = [
        'maxMobs' => 50,
        'spawnInterval' => 1.5,
        'broadcastInterval' => 0.05,
        'aggroRange' => 180,
        'leashRange' => 350,
        'attackCooldown' => 1.2,
        'mobsByZone' => ['tutorial' => 8, 'transition' => 12, 'normal' => 18, 'danger' => 12]
    ];
    
    public $map;
    public $mapData;
    public $entities = [];
    public $players = [];
    public $mobs = [];
    public $npcs = [];
    public $lootItems = [];
    public $groups = [];
    public $outgoingQueues = [];
    public $groupCellSize = 350;
    
    public $playerCount = 0;
    public $mobNextId = 1;
    public $lootNextId = 1;
    public $serverTick = 0;
    public $serverStartTime = 0;
    public $lastMobSpawn = 0;
    public $lastMobBroadcast = 0;
    public $lastFullSnapshot = 0;
    public $lastQuestUpdate = 0;
    public $lastTickAt = 0;
    
    public $spawnCenter = ['x' => 0, 'y' => 0];
    public $tutorialNPCs = [];
    
    public $connectCallback;
    public $enterCallback;
    public $addedCallback;
    public $removedCallback;
    
    public $zoneGroupsReady = false;
    public $lastMobStates = [];
    public $playerSequences = [];

    // Death/respawn + melee autoattack (server-authoritative)
    public $respawnQueue = []; // playerId => respawnAtMs
    public $meleeConfig = [
        'enabled' => true,
        'cooldown' => 0.75,
        'range' => 24,
        'damage' => 6
    ];

    
    // Managers
    public $questSystem;
    public $groupManager;
    public $inventoryManager;
    public $talentSystem;
    public $achievementSystem;
    public $leaderboardSystem;
    public $craftingSystem;
    public $eventSystem;
    public $petSystem;
    public $tradingSystem;

    public function getMobDefinitions()
    {
        return [
            'training_bubble' => [
                'mobType' => 'training_bubble', 'name' => 'Bulle d\'Entraînement', 'icon' => '🫧',
                'tier' => 0, 'zone' => self::ZONE_TUTORIAL, 'hp' => 10, 'maxHp' => 10,
                'damage' => 0, 'speed' => 0.3, 'size' => 5, 'color' => '#87CEEB',
                'type' => 'training', 'spawnWeight' => 60, 'xpReward' => 2,
                'dropTable' => [], 'dropChance' => 0, 'passive' => true, 'fleeOnHit' => true
            ],
            'friendly_fish' => [
                'mobType' => 'friendly_fish', 'name' => 'Poisson Ami', 'icon' => '🐠',
                'tier' => 0, 'zone' => self::ZONE_TUTORIAL, 'hp' => 15, 'maxHp' => 15,
                'damage' => 0, 'speed' => 0.5, 'size' => 6, 'color' => '#FFD700',
                'type' => 'training', 'spawnWeight' => 40, 'xpReward' => 3,
                'dropTable' => ['potion_health'], 'dropChance' => 0.8, 'passive' => true
            ],
            'bubble_fish' => [
                'mobType' => 'bubble_fish', 'name' => 'Poisson Bulle', 'icon' => '🐟',
                'tier' => 0, 'zone' => self::ZONE_TRANSITION, 'hp' => 15, 'maxHp' => 15,
                'damage' => 2, 'speed' => 0.8, 'size' => 6, 'color' => '#87CEEB',
                'type' => 'mob', 'spawnWeight' => 50, 'xpReward' => 5,
                'dropTable' => ['potion_health'], 'dropChance' => 0.6, 'passive' => true
            ],
            'baby_crab' => [
                'mobType' => 'baby_crab', 'name' => 'Bébé Crabe', 'icon' => '🦀',
                'tier' => 0, 'zone' => self::ZONE_TRANSITION, 'hp' => 20, 'maxHp' => 20,
                'damage' => 3, 'speed' => 1.0, 'size' => 5, 'color' => '#FFB6C1',
                'type' => 'mob', 'spawnWeight' => 40, 'xpReward' => 8,
                'dropTable' => ['potion_health', 'spell_bubble'], 'dropChance' => 0.5, 'passive' => false
            ],
            'crab_small' => [
                'mobType' => 'crab_small', 'name' => 'Petit Crabe', 'icon' => '🦀',
                'tier' => 1, 'zone' => self::ZONE_NORMAL, 'hp' => 40, 'maxHp' => 40,
                'damage' => 8, 'speed' => 1.5, 'size' => 8, 'color' => '#ff6b6b',
                'type' => 'mob', 'spawnWeight' => 35, 'xpReward' => 15,
                'dropTable' => ['potion_health', 'spell_bubble'], 'dropChance' => 0.4, 'passive' => false
            ],
            'jellyfish' => [
                'mobType' => 'jellyfish', 'name' => 'Méduse', 'icon' => '🪼',
                'tier' => 1, 'zone' => self::ZONE_NORMAL, 'hp' => 60, 'maxHp' => 60,
                'damage' => 12, 'speed' => 1.0, 'size' => 10, 'color' => '#ff9eea',
                'type' => 'mob', 'spawnWeight' => 25, 'xpReward' => 25,
                'dropTable' => ['potion_health', 'potion_speed', 'spell_wave'], 'dropChance' => 0.5, 'passive' => false
            ],
            'crab_giant' => [
                'mobType' => 'crab_giant', 'name' => 'Crabe Géant', 'icon' => '🦞',
                'tier' => 2, 'zone' => self::ZONE_NORMAL, 'hp' => 100, 'maxHp' => 100,
                'damage' => 15, 'speed' => 1.2, 'size' => 14, 'color' => '#cc4444',
                'type' => 'mob', 'spawnWeight' => 15, 'xpReward' => 50,
                'dropTable' => ['potion_health', 'potion_health_large', 'shield_bubble'], 'dropChance' => 0.5, 'passive' => false
            ],
            'electric_eel' => [
                'mobType' => 'electric_eel', 'name' => 'Anguille Électrique', 'icon' => '⚡',
                'tier' => 2, 'zone' => self::ZONE_DANGER, 'hp' => 80, 'maxHp' => 80,
                'damage' => 20, 'speed' => 2.2, 'size' => 12, 'color' => '#ffeb3b',
                'type' => 'elite', 'spawnWeight' => 12, 'xpReward' => 60,
                'dropTable' => ['spell_lightning', 'potion_speed'], 'dropChance' => 0.6, 'passive' => false
            ],
            'shark_mini' => [
                'mobType' => 'shark_mini', 'name' => 'Requin Juvénile', 'icon' => '🦈',
                'tier' => 3, 'zone' => self::ZONE_DANGER, 'hp' => 180, 'maxHp' => 180,
                'damage' => 25, 'speed' => 2.0, 'size' => 18, 'color' => '#6b8cff',
                'type' => 'elite', 'spawnWeight' => 8, 'xpReward' => 100,
                'dropTable' => ['potion_health_large', 'spell_lightning', 'shield_bubble'], 'dropChance' => 0.75, 'passive' => false
            ],
            'manta_ray' => [
                'mobType' => 'manta_ray', 'name' => 'Raie Manta', 'icon' => '🐋',
                'tier' => 3, 'zone' => self::ZONE_DANGER, 'hp' => 150, 'maxHp' => 150,
                'damage' => 18, 'speed' => 1.8, 'size' => 22, 'color' => '#1a1a2e',
                'type' => 'elite', 'spawnWeight' => 6, 'xpReward' => 90,
                'dropTable' => ['spell_wave', 'spell_vortex', 'potion_speed'], 'dropChance' => 0.7, 'passive' => false
            ],
            'octopus_boss' => [
                'mobType' => 'octopus_boss', 'name' => 'Poulpe Ancien', 'icon' => '🐙',
                'tier' => 4, 'zone' => self::ZONE_DANGER, 'hp' => 600, 'maxHp' => 600,
                'damage' => 40, 'speed' => 1.3, 'size' => 30, 'color' => '#9b59b6',
                'type' => 'boss', 'spawnWeight' => 2, 'xpReward' => 400,
                'dropTable' => ['spell_vortex', 'spell_heal', 'shield_bubble'], 'dropChance' => 1.0, 'guaranteedDrops' => 2, 'passive' => false
            ],
            'kraken' => [
                'mobType' => 'kraken', 'name' => 'Kraken Primordial', 'icon' => '🦑',
                'tier' => 5, 'zone' => self::ZONE_DANGER, 'hp' => 1000, 'maxHp' => 1000,
                'damage' => 60, 'speed' => 1.5, 'size' => 40, 'color' => '#2c3e50',
                'type' => 'boss', 'spawnWeight' => 1, 'xpReward' => 800,
                'dropTable' => ['spell_vortex', 'spell_heal', 'spell_lightning', 'shield_bubble'], 'dropChance' => 1.0, 'guaranteedDrops' => 3, 'passive' => false
            ]
        ];
    }

    public function __construct($id, $maxPlayers, $websocketServer)
    {
        $this->id = $id;
        $this->maxPlayers = $maxPlayers;
        $this->server = $websocketServer;
        $this->serverStartTime = microtime(true) * 1000;
        
        // Initialiser les managers
        $this->questSystem = QuestSystem::getInstance();
        $this->questSystem->setWorldServer($this);
        $this->groupManager = new GroupManager($this);
        $this->inventoryManager = new InventoryManager($this);
        $this->talentSystem = new TalentSystem($this);
        $this->achievementSystem = new AchievementSystem($this);
        $this->leaderboardSystem = new LeaderboardSystem($this);
        $this->craftingSystem = new CraftingSystem($this);
        $this->eventSystem = new EventSystem($this);
        $this->petSystem = new PetSystem($this);
        $this->tradingSystem = new TradingSystem($this);
        
        $self = $this;
        
        $this->onPlayerConnect(function ($player) use ($self) {
            $self->playerSequences[$player->id] = 0;
            $player->onRequestPosition(function() use ($self) {
                return $self->spawnCenter;
            });
        });
        
        $this->onPlayerEnter(function($player) use ($self) {
            echo "[WORLD] {$player->name} joined {$self->id}\n";
            
            if (!$player->hasEnteredGame) {
                $self->incrementPlayerCount();
            }
            
            // Initialiser les systèmes pour ce joueur
            $self->questSystem->initPlayer($player->id);
            $self->inventoryManager->initPlayer($player->id);
            $self->talentSystem->initPlayer($player->id);
            $self->achievementSystem->initPlayer($player->id);
            $self->leaderboardSystem->onPlayerConnect($player->id);
            $self->eventSystem->initPlayer($player->id);
            $self->petSystem->initPlayer($player->id);
            
            // Donner le pet de départ si nouveau joueur
            if (!$player->hasStarterPet) {
                $self->petSystem->giveStarterPet($player->id);
                $player->hasStarterPet = true;
            }
            
            // Envoyer les infos de synchronisation
            $self->pushToPlayer($player, $self->createSyncInfoMessage());
            
            $zone = $self->getZoneForPosition($player->x, $player->y);
            $player->currentZone = $zone;
            $self->pushToPlayer($player, $self->createZoneInfoMessage($zone));
            $self->pushToPlayer($player, new Messages\Population($self->playerCount, 1));
            
            if ($zone === self::ZONE_TUTORIAL) {
                $self->pushToPlayer($player, $self->createTutorialMessage('welcome'));
            }
            
            // Synchroniser les états
            $self->questSystem->sendFullQuestState($player->id);
            $self->inventoryManager->syncInventory($player->id);
            $self->inventoryManager->syncEquipment($player->id);
            $self->talentSystem->syncTalents($player->id);
            $self->achievementSystem->syncAchievements($player->id);
            $self->leaderboardSystem->syncLeaderboard($player->id);
            $self->craftingSystem->syncCrafting($player->id);
            $self->eventSystem->syncEvents($player->id);
            $self->petSystem->syncPets($player->id);
            
            $self->updatePopulation($self->playerCount);
            $self->pushRelevantEntityListTo($player);
            $self->pushMobsToPlayer($player);
            $self->pushTutorialNPCsToPlayer($player);
            $self->pushLootToPlayer($player);
            
            $player->onMove(function($x, $y) use ($player, $self) {
                $self->handlePlayerMove($player, $x, $y);
            });
            
            $player->onZone(function() use ($self, $player) {
                $hasChangedGroups = $self->handleEntityGroupMembership($player);
                if ($hasChangedGroups) {
                    $self->pushToPreviousGroups($player, new Messages\Destroy($player));
                    $self->pushRelevantEntityListTo($player);
                }
            });
            
            $player->onBroadcast(function($message, $ignoreSelf) use ($self, $player) {
                $self->pushToAdjacentGroups($player->group, $message, $ignoreSelf ? $player->id : null);
            });
            
            $player->onBroadcastToZone(function($message, $ignoreSelf) use ($self, $player) {
                $self->pushToGroup($player->group, $message, $ignoreSelf ? $player->id : null);
            });
            
            $player->onExit(function() use ($self, $player) {
                echo "[WORLD] {$player->name} left.\n";
                $self->questSystem->cleanupPlayer($player->id);
                $self->groupManager->onPlayerDisconnect($player->id);
                $self->inventoryManager->onPlayerDisconnect($player->id);
                $self->talentSystem->onPlayerDisconnect($player->id);
                $self->achievementSystem->onPlayerDisconnect($player->id);
                $self->leaderboardSystem->onPlayerDisconnect($player->id);
                $self->craftingSystem->onPlayerDisconnect($player->id);
                $self->eventSystem->onPlayerDisconnect($player->id);
                $self->petSystem->onPlayerDisconnect($player->id);
                $self->tradingSystem->onPlayerDisconnect($player->id);
                unset($self->playerSequences[$player->id]);
                $self->removePlayer($player);
                $self->decrementPlayerCount();
                $self->updatePopulation($self->playerCount);
                if ($self->removedCallback) call_user_func($self->removedCallback);
            });
            
            if ($self->addedCallback) call_user_func($self->addedCallback);
        });
    }

    public function run($mapFilePath)
    {
        $self = $this;
        
        $this->map = new Map($mapFilePath);
        $this->initZoneGroups();
        
        $this->map->ready(function() use ($self) {
            $self->initZoneGroups();
            $self->map->generateCollisionGrid();
            $self->spawnTutorialNPCs();
        });
        
        $this->map->initMap();
        $this->lastTickAt = microtime(true);
        $this->serverStartTime = microtime(true) * 1000;
        
        Timer::add(1 / $this->ups, function() use ($self) {
            $now = microtime(true);
            $delta = $now - $self->lastTickAt;
            $self->lastTickAt = $now;
            $self->serverTick++;
            
            $self->updateMobs($delta);
            $self->trySpawnMobs();
            $self->broadcastMobStates();
            $self->processMeleeAutoAttacks();
            $self->processRespawns();
            
            if (($now - $self->lastFullSnapshot) >= 0.1) {
                $self->broadcastFullSnapshot();
                $self->lastFullSnapshot = $now;
            }
            
            if (($now - $self->lastQuestUpdate) >= 1.0) {
                $self->questSystem->updateSurviveTimers();
                $self->achievementSystem->tick();
                $self->leaderboardSystem->tick();
                $self->eventSystem->tick();
                $self->lastQuestUpdate = $now;
            }
            
            // Crafting tick (plus fréquent)
            $self->craftingSystem->tick();
            $self->petSystem->tick();
            $self->tradingSystem->tick();
            
            $self->cleanupExpiredLoot();
            $self->processGroups();
            $self->processQueues();
        });
        
        echo "[WORLD] {$this->id} created (v" . self::PROTOCOL_VERSION . ")\n";
    }
    
    public function createSyncInfoMessage()
    {
        return [
            'type' => 'sync_info',
            'protocolVersion' => self::PROTOCOL_VERSION,
            'serverTick' => $this->serverTick,
            'serverTime' => round(microtime(true) * 1000),
            'tickRate' => $this->ups,
            'zones' => $this->zoneConfig
        ];
    }
    
    public function broadcastFullSnapshot()
    {
        $snapshot = [
            'type' => 'world_snapshot',
            'tick' => $this->serverTick,
            'time' => round(microtime(true) * 1000),
            'mobs' => [],
            'loot' => [],
            'players' => [],
            'playerCount' => count($this->players)
        ];
        
        foreach ($this->mobs as $mob) {
            $snapshot['mobs'][] = [
                'i' => $mob['id'], 
                'x' => round($mob['x'], 1), 
                'y' => round($mob['y'], 1), 
                'h' => $mob['hp'], 
                's' => $mob['state'][0],
                't' => $mob['mobType']  // Type de mob pour le client
            ];
        }
        
        foreach ($this->lootItems as $loot) {
            $snapshot['loot'][] = ['i' => $loot['id'], 'x' => round($loot['x'], 1), 'y' => round($loot['y'], 1), 't' => $loot['itemType']];
        }
        
        // Ajouter les positions des joueurs pour synchronisation
        foreach ($this->players as $player) {
            $snapshot['players'][] = [
                'i' => $player->id,
                'x' => round($player->x, 1),
                'y' => round($player->y, 1),
                'a' => round($player->angle, 3),
                'm' => round($player->momentum, 3),
                'n' => $player->name,
                'c' => $player->color
            ];
        }
        
        $this->pushBroadcast($snapshot);
    }
    
    public function getServerTime() { return round(microtime(true) * 1000); }

    public function getZoneForPosition($x, $y)
    {
        $distance = sqrt($x * $x + $y * $y);
        if ($distance <= $this->zoneConfig['tutorialRadius']) return self::ZONE_TUTORIAL;
        if ($distance <= $this->zoneConfig['transitionRadius']) return self::ZONE_TRANSITION;
        if ($distance <= $this->zoneConfig['normalRadius']) return self::ZONE_NORMAL;
        return self::ZONE_DANGER;
    }
    
    public function isPlayerInSafeZone($player)
    {
        if (!$player) return false;
        return $this->getZoneForPosition($player->x, $player->y) === self::ZONE_TUTORIAL;
    }
    
    public function createZoneInfoMessage($zone)
    {
        $names = [
            self::ZONE_TUTORIAL => '🏠 Zone Tutoriel (100% Safe)',
            self::ZONE_TRANSITION => '🌊 Eaux Peu Profondes',
            self::ZONE_NORMAL => '🌀 Eaux Normales',
            self::ZONE_DANGER => '☠️ Abysses (Danger!)'
        ];
        $descriptions = [
            self::ZONE_TUTORIAL => 'Bienvenue ! Ici tu es en sécurité.',
            self::ZONE_TRANSITION => 'Les créatures ici sont faibles mais peuvent attaquer.',
            self::ZONE_NORMAL => 'Zone de combat standard. Sois prudent !',
            self::ZONE_DANGER => 'Les créatures ici sont mortelles !'
        ];
        
        return [
            'type' => 'zone_info', 'tick' => $this->serverTick, 'time' => $this->getServerTime(),
            'zone' => $zone, 'name' => $names[$zone] ?? 'Inconnu', 'description' => $descriptions[$zone] ?? '',
            'safe' => ($zone === self::ZONE_TUTORIAL), 'canDie' => ($zone !== self::ZONE_TUTORIAL),
            'tutorialRadius' => $this->zoneConfig['tutorialRadius'],
            'transitionRadius' => $this->zoneConfig['transitionRadius'],
            'normalRadius' => $this->zoneConfig['normalRadius']
        ];
    }
    
    public function createTutorialMessage($step)
    {
        $messages = [
            'welcome' => ['title' => 'Bienvenue dans ZeroTadpole !', 'content' => 'Tu es un têtard dans un vaste océan.', 'tips' => ['Zone sûre', 'Attaque les bulles', 'Explore dehors']],
            'first_kill' => ['title' => 'Premier Combat !', 'content' => 'Bravo !', 'tips' => ['Les créatures dehors attaquent']],
            'leaving_safe' => ['title' => 'Attention !', 'content' => 'Tu quittes la zone sûre.', 'tips' => ['Retourne au centre pour te soigner']],
            'entering_danger' => ['title' => '⚠️ Zone Dangereuse !', 'content' => 'Tu entres dans les abysses.', 'tips' => ['Boss ici', 'Meilleurs loots']]
        ];
        $msg = $messages[$step] ?? $messages['welcome'];
        return ['type' => 'tutorial_message', 'step' => $step, 'title' => $msg['title'], 'content' => $msg['content'], 'tips' => $msg['tips'] ?? []];
    }
    
    public function spawnTutorialNPCs()
    {
        $this->tutorialNPCs['guide'] = [
            'id' => 'npc-guide', 'type' => 'npc', 'npcType' => 'guide', 'name' => 'Sage Ovule', 'icon' => '🥚',
            'x' => 50, 'y' => 50, 'size' => 15, 'color' => '#f7d6ff', 'interactRadius' => 40,
            'dialogue' => ['greeting' => 'Bienvenue jeune têtard !', 'help' => 'Entraîne-toi ici.', 'tips' => 'Clique sur les bulles !']
        ];
        $this->tutorialNPCs['merchant'] = [
            'id' => 'npc-merchant', 'type' => 'npc', 'npcType' => 'merchant', 'name' => 'Poisson Marchande', 'icon' => '🐡',
            'x' => -60, 'y' => 80, 'size' => 12, 'color' => '#ffd700', 'interactRadius' => 35,
            'dialogue' => ['greeting' => 'Des potions ? Des sorts ?', 'shop' => 'Reviens avec des orbes !']
        ];
        echo "[WORLD] Tutorial NPCs spawned\n";
    }
    
    public function pushTutorialNPCsToPlayer($player)
    {
        foreach ($this->tutorialNPCs as $npc) {
            $this->pushToPlayer($player, ['type' => 'npc_spawn', 'tick' => $this->serverTick, 'npc' => $npc]);
        }
    }
    
    public function handleNPCInteract($player, $npcId)
    {
        $npcKey = str_replace('npc-', '', $npcId);
        $npc = $this->tutorialNPCs[$npcKey] ?? $this->tutorialNPCs[$npcId] ?? null;
        if (!$npc) return;
        
        $dx = $player->x - $npc['x'];
        $dy = $player->y - $npc['y'];
        $dist = sqrt($dx * $dx + $dy * $dy);
        if ($dist > ($npc['interactRadius'] ?? 40)) return;
        
        $this->questSystem->onNPCTalk($player->id, $npc['id']);
        $this->pushToPlayer($player, [
            'type' => 'npc_dialogue', 'tick' => $this->serverTick, 'npcId' => $npc['id'],
            'npcName' => $npc['name'], 'npcIcon' => $npc['icon'], 'dialogue' => $npc['dialogue'], 'npcType' => $npc['npcType']
        ]);
    }

    public function trySpawnMobs()
    {
        $now = microtime(true);
        if (($now - $this->lastMobSpawn) < $this->mobConfig['spawnInterval']) return;
        if (count($this->mobs) >= $this->mobConfig['maxMobs']) return;
        if (empty($this->players)) return;
        
        $this->lastMobSpawn = $now;
        
        $mobsByZone = [self::ZONE_TUTORIAL => 0, self::ZONE_TRANSITION => 0, self::ZONE_NORMAL => 0, self::ZONE_DANGER => 0];
        foreach ($this->mobs as $mob) $mobsByZone[$mob['zone']]++;
        
        foreach ($this->mobConfig['mobsByZone'] as $zone => $maxMobs) {
            if ($mobsByZone[$zone] < $maxMobs) {
                $this->spawnMobInZone($zone, null);
                return;
            }
        }
    }
    
    public function spawnMobInZone($zone, $nearPlayer = null)
    {
        $definitions = $this->getMobDefinitions();
        $eligibleMobs = [];
        $totalWeight = 0;
        
        foreach ($definitions as $def) {
            if ($def['zone'] === $zone) {
                $eligibleMobs[] = $def;
                $totalWeight += $def['spawnWeight'];
            }
        }
        
        if (empty($eligibleMobs)) return false;
        
        $roll = mt_rand() / mt_getrandmax() * $totalWeight;
        $selected = null;
        foreach ($eligibleMobs as $def) {
            $roll -= $def['spawnWeight'];
            if ($roll <= 0) { $selected = $def; break; }
        }
        if (!$selected) return false;
        
        $spawnPos = $this->calculateMobSpawnPosition($zone, $nearPlayer);
        $now = microtime(true);
        
        $mob = [
            'id' => 'mob-' . $this->mobNextId++,
            'mobType' => $selected['mobType'], 'name' => $selected['name'], 'icon' => $selected['icon'],
            'x' => $spawnPos['x'], 'y' => $spawnPos['y'], 'spawnX' => $spawnPos['x'], 'spawnY' => $spawnPos['y'],
            'vx' => 0, 'vy' => 0, 'angle' => (mt_rand() / mt_getrandmax()) * M_PI * 2,
            'hp' => $selected['hp'], 'maxHp' => $selected['maxHp'], 'damage' => $selected['damage'],
            'speed' => $selected['speed'], 'size' => $selected['size'], 'color' => $selected['color'],
            'type' => $selected['type'], 'tier' => $selected['tier'], 'zone' => $zone,
            'passive' => $selected['passive'] ?? false, 'fleeOnHit' => $selected['fleeOnHit'] ?? false,
            'targetId' => null, 'lastAttackAt' => 0, 'state' => 'idle',
            'xpReward' => $selected['xpReward'], 'dropTable' => $selected['dropTable'],
            'dropChance' => $selected['dropChance'], 'guaranteedDrops' => $selected['guaranteedDrops'] ?? 1,
            'dirty' => true, 'wanderAngle' => (mt_rand() / mt_getrandmax()) * M_PI * 2,
            'nextWanderChange' => $now + (mt_rand() / mt_getrandmax()) * 3
        ];
        
        $this->mobs[$mob['id']] = $mob;
        $this->pushBroadcast($this->createMobMessage($mob, 'spawn'));
        return true;
    }
    
    public function calculateMobSpawnPosition($zone, $nearPlayer = null)
    {
        $ranges = [
            self::ZONE_TUTORIAL => [30, $this->zoneConfig['tutorialRadius'] - 30],
            self::ZONE_TRANSITION => [$this->zoneConfig['tutorialRadius'] + 20, $this->zoneConfig['transitionRadius'] - 20],
            self::ZONE_NORMAL => [$this->zoneConfig['transitionRadius'] + 20, $this->zoneConfig['normalRadius'] - 20],
            self::ZONE_DANGER => [$this->zoneConfig['normalRadius'] + 20, $this->zoneConfig['normalRadius'] + 500]
        ];
        
        $r = $ranges[$zone] ?? [100, 300];
        $minDist = $r[0]; $maxDist = $r[1];
        if ($minDist >= $maxDist) $maxDist = $minDist + 100;
        
        $angle = (mt_rand() / mt_getrandmax()) * M_PI * 2;
        $distance = $minDist + (mt_rand() / mt_getrandmax()) * ($maxDist - $minDist);
        return ['x' => cos($angle) * $distance, 'y' => sin($angle) * $distance];
    }
    
    public function updateMobs($delta)
    {
        $now = microtime(true);
        foreach ($this->mobs as $id => &$mob) {
            $this->updateMobAI($mob, $delta, $now);
        }
        unset($mob);
    }
    
    public function updateMobAI(&$mob, $delta, $now)
    {
        $prevX = $mob['x']; $prevY = $mob['y']; $prevState = $mob['state'];
        
        if ($mob['type'] === 'training') {
            $this->updateTrainingMobAI($mob, $delta, $now);
            return;
        }
        
        $player = $this->getClosestValidTarget($mob);
        $chasing = false;
        
        if ($player && !$mob['passive']) {
            $dx = $player->x - $mob['x'];
            $dy = $player->y - $mob['y'];
            $dist = sqrt($dx * $dx + $dy * $dy);
            
            $homeDx = $mob['spawnX'] - $mob['x'];
            $homeDy = $mob['spawnY'] - $mob['y'];
            $homeDist = sqrt($homeDx * $homeDx + $homeDy * $homeDy);
            
            if ($dist < $this->mobConfig['aggroRange'] && $homeDist < $this->mobConfig['leashRange']) {
                $chasing = true;
                $mob['targetId'] = $player->id;
                $mob['angle'] = atan2($dy, $dx);
                $speedMult = min(1.0, $dist / 50);
                $mob['x'] += cos($mob['angle']) * $mob['speed'] * $speedMult;
                $mob['y'] += sin($mob['angle']) * $mob['speed'] * $speedMult;
                $mob['state'] = 'chase';
                
                if ($dist < ($mob['size'] + 8)) {
                    $this->tryMobAttack($mob, $player);
                }
            }
        }
        
        if (!$chasing) {
            $mob['targetId'] = null;
            $homeDx = $mob['spawnX'] - $mob['x'];
            $homeDy = $mob['spawnY'] - $mob['y'];
            $homeDist = sqrt($homeDx * $homeDx + $homeDy * $homeDy);
            
            if ($homeDist > 30) {
                $mob['angle'] = atan2($homeDy, $homeDx);
                $mob['x'] += cos($mob['angle']) * $mob['speed'] * 0.6;
                $mob['y'] += sin($mob['angle']) * $mob['speed'] * 0.6;
                $mob['state'] = 'return';
            } else {
                if ($now >= ($mob['nextWanderChange'] ?? 0)) {
                    $mob['wanderAngle'] = ($mob['wanderAngle'] ?? 0) + (mt_rand() / mt_getrandmax() - 0.5) * 1.5;
                    $mob['nextWanderChange'] = $now + 1 + (mt_rand() / mt_getrandmax()) * 3;
                }
                $mob['angle'] = $mob['wanderAngle'] ?? $mob['angle'];
                $mob['x'] += cos($mob['angle']) * $mob['speed'] * 0.2;
                $mob['y'] += sin($mob['angle']) * $mob['speed'] * 0.2;
                $mob['state'] = 'idle';
            }
        }
        
        $this->finalizeMobUpdate($mob, $delta, $prevX, $prevY, $prevState);
    }
    
    public function updateTrainingMobAI(&$mob, $delta, $now)
    {
        $prevX = $mob['x']; $prevY = $mob['y']; $prevState = $mob['state'];
        
        if (isset($mob['fleeUntil']) && $now < $mob['fleeUntil']) {
            $mob['x'] += cos($mob['angle']) * $mob['speed'] * 1.5;
            $mob['y'] += sin($mob['angle']) * $mob['speed'] * 1.5;
            $mob['state'] = 'flee';
            $dist = sqrt($mob['x'] * $mob['x'] + $mob['y'] * $mob['y']);
            if ($dist > $this->zoneConfig['tutorialRadius'] - 20) {
                $mob['angle'] = atan2(-$mob['y'], -$mob['x']);
            }
        } else {
            $homeDx = $mob['spawnX'] - $mob['x'];
            $homeDy = $mob['spawnY'] - $mob['y'];
            $homeDist = sqrt($homeDx * $homeDx + $homeDy * $homeDy);
            
            if ($homeDist > 50) {
                $mob['angle'] = atan2($homeDy, $homeDx);
                $mob['x'] += cos($mob['angle']) * $mob['speed'] * 0.4;
                $mob['y'] += sin($mob['angle']) * $mob['speed'] * 0.4;
                $mob['state'] = 'return';
            } else {
                if ($now >= ($mob['nextWanderChange'] ?? 0)) {
                    $mob['wanderAngle'] = ($mob['wanderAngle'] ?? 0) + (mt_rand() / mt_getrandmax() - 0.5) * 1.0;
                    $mob['nextWanderChange'] = $now + 2 + (mt_rand() / mt_getrandmax()) * 4;
                }
                $mob['angle'] = $mob['wanderAngle'] ?? $mob['angle'];
                $mob['x'] += cos($mob['angle']) * $mob['speed'] * 0.15;
                $mob['y'] += sin($mob['angle']) * $mob['speed'] * 0.15;
                $mob['state'] = 'idle';
            }
        }
        $this->finalizeMobUpdate($mob, $delta, $prevX, $prevY, $prevState);
    }
    
    public function finalizeMobUpdate(&$mob, $delta, $prevX, $prevY, $prevState)
    {
        $deltaSeconds = max(0.001, (float)$delta);
        $mob['vx'] = ($mob['x'] - $prevX) / $deltaSeconds;
        $mob['vy'] = ($mob['y'] - $prevY) / $deltaSeconds;
        if ($mob['state'] !== $prevState || abs($mob['x'] - $prevX) > 0.5 || abs($mob['y'] - $prevY) > 0.5) {
            $mob['dirty'] = true;
        }
    }
    
    public function tryMobAttack(&$mob, $player)
    {
        $now = microtime(true);
        if ($mob['type'] === 'training' || $mob['damage'] <= 0) return;
        if (($now - $mob['lastAttackAt']) < $this->mobConfig['attackCooldown']) return;
        if ($this->isPlayerInSafeZone($player)) return;
        
        $mob['lastAttackAt'] = $now;
        $damage = $mob['damage'];
        $playerZone = $this->getZoneForPosition($player->x, $player->y);
        if ($playerZone === self::ZONE_TRANSITION) $damage = max(1, floor($damage * 0.5));
        
        $player->hitPoints -= $damage;
        if ($player->hitPoints <= 0) {
            $player->hitPoints = 0;
            $player->isDead = true;
            // Queue a respawn (server-authoritative) + inform player UI
            $this->queueRespawn($player, 3000);
        }

        $this->pushToPlayer($player, [
            'type' => 'health', 'tick' => $this->serverTick, 'time' => $this->getServerTime(), 'points' => $player->hitPoints]);
        $this->pushBroadcast(['type' => 'mob_attack', 'tick' => $this->serverTick, 'time' => $this->getServerTime(), 'mobId' => $mob['id'], 'targetId' => $player->id, 'damage' => $damage]);
    }
    
    
    // ============================================
    // Death / Respawn (server-authoritative)
    // ============================================

    public function queueRespawn($player, $delayMs = 3000)
    {
        if (!$player) return;
        $pid = (string)$player->id;
        if (isset($this->respawnQueue[$pid])) return;
        $nowMs = microtime(true) * 1000;
        $delayMs = (int)$delayMs;
        if ($delayMs < 500) $delayMs = 500;
        if ($delayMs > 15000) $delayMs = 15000;

        $this->respawnQueue[$pid] = $nowMs + $delayMs;

        // Informer le joueur (UI)
        $this->pushToPlayer($player, [
            'type' => 'death',
            'tick' => $this->serverTick,
            'time' => $this->getServerTime(),
            'respawnIn' => $delayMs,
            'respawnAt' => (int)($nowMs + $delayMs)
        ]);
    }

    public function processRespawns()
    {
        if (empty($this->respawnQueue)) return;
        $nowMs = microtime(true) * 1000;

        foreach ($this->respawnQueue as $pid => $respawnAtMs) {
            if ($nowMs < (float)$respawnAtMs) continue;
            unset($this->respawnQueue[$pid]);

            $player = $this->players[(int)$pid] ?? null;
            if (!$player) continue;

            // Respawn au centre de la zone tutoriel (safe)
            $angle = mt_rand() / mt_getrandmax() * M_PI * 2;
            $radius = 40 + (mt_rand() / mt_getrandmax()) * 60;
            $rx = $this->spawnCenter['x'] + cos($angle) * $radius;
            $ry = $this->spawnCenter['y'] + sin($angle) * $radius;

            $player->x = $rx;
            $player->y = $ry;
            $player->angle = Utils::randomOrientation();
            $player->momentum = 0;
            $player->isDead = false;
            $player->hitPoints = $player->maxHitPoints ?? 100;

            // Reset boosts
            $player->speedBoostUntil = 0;
            $player->speedBoostMultiplier = 1.0;

            // Health update
            $this->pushToPlayer($player, [
                'type' => 'health',
                'tick' => $this->serverTick,
                'time' => $this->getServerTime(),
                'points' => $player->hitPoints,
                'maxPoints' => $player->maxHitPoints ?? 100
            ]);

            // Teleport for everyone so positions are correct immediately
            $this->pushBroadcast([
                'type' => 'teleport',
                'tick' => $this->serverTick,
                'time' => $this->getServerTime(),
                'id' => $player->id,
                'x' => round($player->x, 1),
                'y' => round($player->y, 1),
                'angle' => round($player->angle, 3),
                'momentum' => 0
            ]);

            // Inform the player
            $this->pushToPlayer($player, [
                'type' => 'respawn',
                'tick' => $this->serverTick,
                'time' => $this->getServerTime()
            ]);
        }
    }

    // ============================================
    // Auto-attack melee (server-authoritative)
    // ============================================

    public function processMeleeAutoAttacks()
    {
        if (empty($this->meleeConfig['enabled'])) return;
        if (empty($this->players) || empty($this->mobs)) return;

        $now = microtime(true);
        $cooldown = (float)($this->meleeConfig['cooldown'] ?? 0.75);
        if ($cooldown < 0.2) $cooldown = 0.2;
        if ($cooldown > 3.0) $cooldown = 3.0;

        $range = (float)($this->meleeConfig['range'] ?? 24);
        if ($range < 10) $range = 10;
        if ($range > 80) $range = 80;

        $baseDamage = (int)($this->meleeConfig['damage'] ?? 6);
        if ($baseDamage < 1) $baseDamage = 1;
        if ($baseDamage > 50) $baseDamage = 50;

        foreach ($this->players as $player) {
            if (!$player) continue;
            if ($player->hitPoints <= 0 || !empty($player->isDead)) continue;
            if ($this->isPlayerInSafeZone($player)) continue;

            // Per-player cooldown
            $nextAt = isset($player->nextMeleeAt) ? (float)$player->nextMeleeAt : 0.0;
            if ($now < $nextAt) continue;

            // Find nearest alive mob
            $bestMob = null;
            $bestDist = PHP_INT_MAX;

            foreach ($this->mobs as &$mob) {
                if (empty($mob) || ($mob['hp'] ?? 0) <= 0) continue;
                $dx = ($mob['x'] - $player->x);
                $dy = ($mob['y'] - $player->y);
                $dist = sqrt($dx * $dx + $dy * $dy);
                if ($dist < $bestDist) {
                    $bestDist = $dist;
                    $bestMob = $mob;
                }
            }
            unset($mob);

            if (!$bestMob || $bestDist > $range) continue;

            $damage = $baseDamage;
            // Petit bonus en zone danger / normal pour donner du rythme
            $zone = $this->getZoneForPosition($player->x, $player->y);
            if ($zone === self::ZONE_DANGER) $damage = (int)round($damage * 1.25);
            if ($zone === self::ZONE_TRANSITION) $damage = max(1, (int)floor($damage * 0.85));

            $player->nextMeleeAt = $now + $cooldown;

            $this->handleMobHit($bestMob['id'], $damage, $player);

            // FX client (optionnel)
            $this->pushBroadcast([
                'type' => 'melee_attack',
                'tick' => $this->serverTick,
                'time' => $this->getServerTime(),
                'attackerId' => $player->id,
                'mobId' => $bestMob['id'],
                'damage' => $damage
            ]);
        }
    }


    /**
     * Client-triggered basic melee attack (server-authoritative)
     * Returns an associative array used as melee_result payload.
     */
    public function handleMeleeRequest($player)
    {
        $now = microtime(true);
        $nowMs = (int)round($now * 1000);

        $cooldown = (float)($this->meleeConfig['cooldown'] ?? 0.75);
        if ($cooldown < 0.2) $cooldown = 0.2;
        if ($cooldown > 3.0) $cooldown = 3.0;
        $cooldownMs = (int)round($cooldown * 1000);

        $range = (float)($this->meleeConfig['range'] ?? 24);
        if ($range < 10) $range = 10;
        if ($range > 80) $range = 80;

        $baseDamage = (int)($this->meleeConfig['damage'] ?? 6);
        if ($baseDamage < 1) $baseDamage = 1;
        if ($baseDamage > 50) $baseDamage = 50;

        if (!$player) return ['success' => false, 'error' => 'Impossible', 'cooldownUntil' => $nowMs, 'cooldownMs' => $cooldownMs];
        if (!empty($player->isDead) || ($player->hitPoints ?? 0) <= 0) {
            return ['success' => false, 'error' => 'Tu es mort', 'cooldownUntil' => $nowMs, 'cooldownMs' => $cooldownMs];
        }
        if ($this->isPlayerInSafeZone($player)) {
            return ['success' => false, 'error' => 'Zone sûre', 'cooldownUntil' => $nowMs, 'cooldownMs' => $cooldownMs];
        }

        // Per-player cooldown
        $nextAt = isset($player->nextMeleeAt) ? (float)$player->nextMeleeAt : 0.0;
        if ($now < $nextAt) {
            $untilMs = (int)round($nextAt * 1000);
            return ['success' => false, 'error' => 'Recharge', 'cooldownUntil' => $untilMs, 'cooldownMs' => $cooldownMs];
        }

        // Find nearest alive mob
        $bestMob = null;
        $bestDist = PHP_INT_MAX;

        foreach ($this->mobs as &$mob) {
            if (empty($mob) || ($mob['hp'] ?? 0) <= 0) continue;
            $dx = ($mob['x'] - $player->x);
            $dy = ($mob['y'] - $player->y);
            $dist = sqrt($dx * $dx + $dy * $dy);
            if ($dist < $bestDist) {
                $bestDist = $dist;
                $bestMob = $mob;
            }
        }
        unset($mob);

        if (!$bestMob || $bestDist > $range) {
            return ['success' => false, 'error' => 'Aucune cible', 'cooldownUntil' => $nowMs, 'cooldownMs' => $cooldownMs];
        }

        $damage = $baseDamage;
        $zone = $this->getZoneForPosition($player->x, $player->y);
        if ($zone === self::ZONE_DANGER) $damage = (int)round($damage * 1.25);
        if ($zone === self::ZONE_TRANSITION) $damage = max(1, (int)floor($damage * 0.85));

        $player->nextMeleeAt = $now + $cooldown;

        $this->handleMobHit($bestMob['id'], $damage, $player);

        // FX broadcast (adjacent groups is enough)
        $this->pushToAdjacentGroups($player->group ?? null, [
            'type' => 'melee_attack',
            'tick' => $this->serverTick,
            'time' => $this->getServerTime(),
            'attackerId' => $player->id,
            'mobId' => $bestMob['id'],
            'damage' => $damage
        ]);

        $untilMs = (int)round($player->nextMeleeAt * 1000);

        return [
            'success' => true,
            'cooldownUntil' => $untilMs,
            'cooldownMs' => $cooldownMs
        ];
    }


public function getClosestValidTarget($mob)
    {
        $closest = null; $closestDist = PHP_INT_MAX;
        foreach ($this->players as $player) {
            if ($player->hitPoints <= 0 || $this->isPlayerInSafeZone($player)) continue;
            $dx = $player->x - $mob['x']; $dy = $player->y - $mob['y'];
            $dist = sqrt($dx * $dx + $dy * $dy);
            if ($dist < $closestDist) { $closestDist = $dist; $closest = $player; }
        }
        return $closest;
    }
    
    public function broadcastMobStates()
    {
        $now = microtime(true);
        if (($now - $this->lastMobBroadcast) < $this->mobConfig['broadcastInterval']) return;
        $this->lastMobBroadcast = $now;
        
        $updates = [];
        foreach ($this->mobs as $id => &$mob) {
            if ($mob['dirty']) {
                $updates[] = $this->createMobUpdateData($mob);
                $mob['dirty'] = false;
            }
        }
        unset($mob);
        
        if (!empty($updates)) {
            $this->pushBroadcast(['type' => 'mobs_batch', 'tick' => $this->serverTick, 'time' => $this->getServerTime(), 'mobs' => $updates]);
        }
    }
    
    public function createMobUpdateData($mob)
    {
        return ['i' => $mob['id'], 'x' => round($mob['x'], 1), 'y' => round($mob['y'], 1), 'vx' => round($mob['vx'], 2), 'vy' => round($mob['vy'], 2), 'a' => round($mob['angle'], 2), 'h' => $mob['hp'], 's' => $mob['state'][0], 't' => $mob['targetId'] ?? null];
    }
    
    public function createMobMessage($mob, $action)
    {
        if ($action === 'update') {
            return ['type' => 'mob', 'action' => 'update', 'tick' => $this->serverTick, 'data' => $this->createMobUpdateData($mob)];
        }
        return [
            'type' => 'mob', 'action' => $action, 'tick' => $this->serverTick, 'time' => $this->getServerTime(),
            'id' => $mob['id'], 'mobType' => $mob['mobType'], 'name' => $mob['name'], 'icon' => $mob['icon'],
            'x' => round($mob['x'], 1), 'y' => round($mob['y'], 1), 'vx' => round($mob['vx'], 2), 'vy' => round($mob['vy'], 2),
            'angle' => round($mob['angle'], 2), 'hp' => $mob['hp'], 'maxHp' => $mob['maxHp'], 'damage' => $mob['damage'],
            'speed' => $mob['speed'], 'size' => $mob['size'], 'color' => $mob['color'], 'mobClass' => $mob['type'],
            'tier' => $mob['tier'], 'zone' => $mob['zone'], 'passive' => $mob['passive'],
            'xpReward' => $mob['xpReward'], 'dropTable' => $mob['dropTable'], 'dropChance' => $mob['dropChance']
        ];
    }
    
    public function pushMobsToPlayer($player)
    {
        foreach ($this->mobs as $mob) {
            $this->pushToPlayer($player, $this->createMobMessage($mob, 'spawn'));
        }
    }
    
    public function handleMobHit($mobId, $damage, $attacker)
    {
        if (!isset($this->mobs[$mobId])) return;
        
        $mob = &$this->mobs[$mobId];
        $isTutorialMob = ($mob['type'] === 'training');
        
        if (!$isTutorialMob && $attacker && $this->isPlayerInSafeZone($attacker)) return;
        
        $damage = max(1, min(500, (int)$damage));
        $mob['hp'] -= $damage;
        $mob['dirty'] = true;
        
        if ($isTutorialMob && !empty($mob['fleeOnHit'])) {
            if ($attacker) {
                $dx = $mob['x'] - $attacker->x; $dy = $mob['y'] - $attacker->y;
                $mob['angle'] = atan2($dy, $dx);
            } else {
                $mob['angle'] = (mt_rand() / mt_getrandmax()) * M_PI * 2;
            }
            $mob['fleeUntil'] = microtime(true) + 2.0;
            $mob['state'] = 'flee';
        } elseif ($attacker && !$mob['passive']) {
            $mob['targetId'] = $attacker->id;
        }
        
        if ($mob['hp'] <= 0) {
            $mob['hp'] = 0;
            $deathMsg = $this->createMobMessage($mob, 'death');
            $this->pushBroadcast($deathMsg);
            $this->generateMobLoot($mob, $attacker);
            
            if ($attacker) {
                $this->giveXP($attacker, $mob['xpReward']);
                $this->questSystem->onMobKill($attacker->id, $mob['mobType'], $mob);
                if ($isTutorialMob) $this->pushToPlayer($attacker, $this->createTutorialMessage('first_kill'));
            }
            unset($this->mobs[$mobId]);
            return;
        }
        
        $this->pushBroadcast(['type' => 'mob_hit', 'tick' => $this->serverTick, 'time' => $this->getServerTime(), 'mobId' => $mobId, 'hp' => $mob['hp'], 'maxHp' => $mob['maxHp'], 'damage' => $damage, 'isFleeing' => $isTutorialMob && isset($mob['fleeUntil'])]);
    }
    
    public function handleEliteMobHit($mobId, $damage, $attacker) { return $this->handleMobHit($mobId, $damage, $attacker); }

    public function generateMobLoot($mob, $killer)
    {
        $roll = mt_rand() / mt_getrandmax();
        if ($roll > $mob['dropChance']) return;

        $drops = [];
        $numDrops = $mob['guaranteedDrops'] ?? 1;
        for ($i = 0; $i < $numDrops; $i++) {
            if (!empty($mob['dropTable'])) {
                $drops[] = $mob['dropTable'][array_rand($mob['dropTable'])];
            }
        }

        if (empty($drops)) return;

        // IMPORTANT: spawn de loots avec ID serveur (loot_spawn) pour éviter les loots "fantômes"
        $killerId = $killer ? $killer->id : null;
        $spawnedLootIds = [];
        foreach ($drops as $itemType) {
            $lx = $mob['x'] + (mt_rand() / mt_getrandmax() - 0.5) * 20;
            $ly = $mob['y'] + (mt_rand() / mt_getrandmax() - 0.5) * 20;
            $spawnedLootIds[] = $this->createLoot($itemType, $lx, $ly, 60, $killerId);
        }

        // Garder l'évènement legacy pour compat (le client ne doit plus générer d'ID fake à partir de loot_drop)
        $this->pushBroadcast([
            'type' => 'loot_drop',
            'tick' => $this->serverTick,
            'time' => $this->getServerTime(),
            'x' => $mob['x'],
            'y' => $mob['y'],
            'items' => $drops,
            'loots' => $spawnedLootIds,
            'killerId' => $killerId
        ]);
    }

    public function handleLootPickup($player, $lootId)
    {
        if (!isset($this->lootItems[$lootId])) return false;
        $loot = $this->lootItems[$lootId];
        $dx = $player->x - $loot['x']; $dy = $player->y - $loot['y'];
        if (sqrt($dx * $dx + $dy * $dy) > 50) return false;
        
        // Ajouter l'item à l'inventaire du joueur
        $addResult = $this->inventoryManager->addItem($player->id, $loot['itemType'], 1);
        if (!$addResult['success']) {
            $reason = $addResult['error'] ?? 'Inventaire plein';
            $now = microtime(true);
            // Anti-spam: rate limit identical failures
            if (($now - (float)$player->lastLootFailAt) > 1.0 || $player->lastLootFailReason !== $reason) {
                $player->lastLootFailAt = $now;
                $player->lastLootFailReason = $reason;
                $this->pushToPlayer($player, ['type' => 'loot_pickup_failed', 'reason' => $reason]);
            }
            return false;
        }
        
        $this->questSystem->onLootCollect($player->id, $loot['itemType']);
        unset($this->lootItems[$lootId]);
        $this->pushBroadcast(['type' => 'loot_pickup', 'tick' => $this->serverTick, 'lootId' => $lootId, 'playerId' => $player->id, 'itemType' => $loot['itemType']]);
        return true;
    }
    
    public function createLoot($itemType, $x, $y, $expiresIn = 60, $killerId = null)
    {
        $lootId = 'loot_' . $this->lootNextId++;
        $this->lootItems[$lootId] = [
            'id' => $lootId,
            'itemType' => $itemType,
            'x' => $x,
            'y' => $y,
            'killerId' => $killerId,
            'createdAt' => microtime(true),
            'expiresAt' => microtime(true) + $expiresIn
        ];

        $this->pushBroadcast(['type' => 'loot_spawn', 'tick' => $this->serverTick, 'loot' => $this->lootItems[$lootId]]);
        return $lootId;
    }
    
    public function cleanupExpiredLoot()
    {
        $now = microtime(true);
        foreach ($this->lootItems as $id => $loot) {
            if ($now >= $loot['expiresAt']) {
                unset($this->lootItems[$id]);
                $this->pushBroadcast(['type' => 'loot_expired', 'tick' => $this->serverTick, 'lootId' => $id]);
            }
        }
    }
    
    public function pushLootToPlayer($player)
    {
        foreach ($this->lootItems as $loot) {
            $this->pushToPlayer($player, ['type' => 'loot_spawn', 'tick' => $this->serverTick, 'loot' => $loot]);
        }
    }

    public function handlePlayerMove($player, $x, $y)
    {
        if (!is_numeric($x) || !is_numeric($y)) return;
        $x = (float)$x; $y = (float)$y;
        
        $dx = $x - $player->x; $dy = $y - $player->y;
        $dist = sqrt($dx * $dx + $dy * $dy);
        $maxSpeed = 15;
        // Bonus de vitesse server-authoritative (ex: spell_dash)
        $nowMs = microtime(true) * 1000;
        if (isset($player->speedBoostUntil) && $nowMs < (float)$player->speedBoostUntil) {
            $mult = isset($player->speedBoostMultiplier) ? (float)$player->speedBoostMultiplier : 1.8;
            if ($mult < 1.0) $mult = 1.0;
            if ($mult > 3.0) $mult = 3.0;
            $maxSpeed = $maxSpeed * $mult;
        }
        if ($dist > $maxSpeed) {
            $ratio = $maxSpeed / $dist;
            $x = $player->x + $dx * $ratio;
            $y = $player->y + $dy * $ratio;
        }
        
        $oldZone = $this->getZoneForPosition($player->x, $player->y);
        $player->setPosition($x, $y, $player->angle, $player->momentum);
        $newZone = $this->getZoneForPosition($x, $y);
        
        $this->questSystem->onPlayerMove($player->id, $x, $y, $newZone);
        
        if ($oldZone !== $newZone) {
            $player->currentZone = $newZone;
            $this->pushToPlayer($player, $this->createZoneInfoMessage($newZone));
            $this->questSystem->onZoneChange($player->id, $oldZone, $newZone);
            if ($oldZone === self::ZONE_TUTORIAL && $newZone !== self::ZONE_TUTORIAL) {
                $this->pushToPlayer($player, $this->createTutorialMessage('leaving_safe'));
            }
            if ($newZone === self::ZONE_DANGER && $oldZone !== self::ZONE_DANGER) {
                $this->pushToPlayer($player, $this->createTutorialMessage('entering_danger'));
            }
        }
        $this->handlePlayerSafeZone($player);
    }
    
    public function handlePlayerSafeZone($player)
    {
        if (!$this->isPlayerInSafeZone($player)) return;
        foreach ($this->mobs as &$mob) {
            if ($mob['targetId'] === $player->id) {
                $mob['targetId'] = null; $mob['state'] = 'idle'; $mob['dirty'] = true;
            }
        }
        unset($mob);
        if ($player->hitPoints < $player->maxHitPoints) {
            $player->hitPoints = min($player->maxHitPoints, $player->hitPoints + 1);
            if (mt_rand(0, 10) === 0) {
                $this->pushToPlayer($player, ['type' => 'health', 'tick' => $this->serverTick, 'points' => $player->hitPoints, 'isRegen' => true]);
            }
        }
    }
    
    public function giveXP($player, $amount)
    {
        $this->pushToPlayer($player, ['type' => 'xp_gain', 'tick' => $this->serverTick, 'time' => $this->getServerTime(), 'amount' => $amount]);
    }
    
    public function getRandomPlayer()
    {
        if (empty($this->players)) return null;
        $keys = array_keys($this->players);
        return $this->players[$keys[array_rand($keys)]];
    }

    public function onPlayerConnect($callback) { $this->connectCallback = $callback; }
    public function onPlayerEnter($callback) { $this->enterCallback = $callback; }
    public function onPlayerAdded($callback) { $this->addedCallback = $callback; }
    public function onPlayerRemoved($callback) { $this->removedCallback = $callback; }
    
    public function pushToPlayer($player, $message)
    {
        if (!$player || !isset($this->outgoingQueues[$player->id])) return;
        $data = is_array($message) ? $message : $message->serialize();
        $this->outgoingQueues[$player->id][] = $data;
    }
    
    public function pushBroadcast($message, $ignoredPlayer = null)
    {
        $data = is_array($message) ? $message : $message->serialize();
        foreach ($this->outgoingQueues as $id => $queue) {
            if ($id != $ignoredPlayer) $this->outgoingQueues[$id][] = $data;
        }
    }
    
    public function pushToGroup($groupId, $message, $ignoredPlayer = null)
    {
        if ($groupId === null || $groupId === '') return;
        $group = $this->groups[$groupId] ?? null;
        if (!$group) return;
        foreach ($group->players as $playerId) {
            if ($playerId != $ignoredPlayer) {
                $player = $this->getEntityById($playerId);
                if ($player) $this->pushToPlayer($player, $message);
            }
        }
    }
    
    public function pushToAdjacentGroups($groupId, $message, $ignoredPlayer = null)
    {
        if ($groupId === null || $groupId === '') return;
        foreach ($this->getAdjacentGroupIds($groupId) as $id) {
            $this->pushToGroup($id, $message, $ignoredPlayer);
        }
    }
    
    public function pushToPreviousGroups($player, $message)
    {
        if (!isset($player->recentlyLeftGroups)) return;
        foreach ($player->recentlyLeftGroups as $id) $this->pushToGroup($id, $message);
        $player->recentlyLeftGroups = [];
    }
    
    public function processQueues()
    {
        foreach ($this->outgoingQueues as $id => $queue) {
            if (!empty($queue) && isset($this->server->connections[$id])) {
                $this->server->connections[$id]->send(json_encode($queue));
                $this->outgoingQueues[$id] = [];
            }
        }
    }

    public function addEntity($entity) { $this->entities[$entity->id] = $entity; $this->handleEntityGroupMembership($entity); }
    public function removeEntity($entity) { unset($this->entities[$entity->id]); $entity->destroy(); $this->removeFromGroups($entity); }
    
    public function addPlayer($player)
    {
        $this->addEntity($player);
        $this->players[$player->id] = $player;
        $this->outgoingQueues[$player->id] = [];
        if ($this->connectCallback) call_user_func($this->connectCallback, $player);
    }
    
    public function removePlayer($player)
    {
        $player->save();
        $player->broadcast($player->despawn());
        $this->removeEntity($player);
        unset($this->players[$player->id], $this->outgoingQueues[$player->id]);
    }
    
    public function getEntityById($id) { return $this->entities[$id] ?? null; }
    public function getSpawnPosition() { return $this->spawnCenter; }
    public function incrementPlayerCount() { $this->playerCount++; }
    public function decrementPlayerCount() { $this->playerCount = max(0, $this->playerCount - 1); }
    
    public function updatePopulation($totalPlayers) { $this->pushBroadcast(new Messages\Population($this->playerCount, $totalPlayers ?: $this->playerCount)); }
    
    public function pushRelevantEntityListTo($player)
    {
        if (!$player || !isset($this->groups[$player->group])) return;
        $entities = array_keys($this->groups[$player->group]->entities);
        $entities = Utils::reject($entities, function($id) use ($player) { return $id == $player->id; });
        if ($entities) {
            $this->pushToPlayer($player, new Messages\Lists($entities));
            $this->pushSpawnsToPlayer($player, $entities);
        }
    }
    
    public function pushSpawnsToPlayer($player, $ids)
    {
        foreach ($ids as $id) {
            $entity = $this->getEntityById($id);
            if ($entity) $this->pushToPlayer($player, new Messages\Spawn($entity));
        }
    }
    
    public function getPlayerList()
    {
        $list = [];
        foreach ($this->players as $player) $list[] = ['id' => $player->id, 'name' => $player->name, 'color' => $player->color];
        return $list;
    }
    
    public function sendPrivateMessage($from, $targetId, $message)
    {
        $target = $this->getEntityById($targetId);
        if ($target && $target instanceof Player) $this->pushToPlayer($target, new Messages\PrivateChat($from, $message));
    }

    protected function ensureGroup($id)
    {
        if ($id === null || $id === '') return null;
        if (!isset($this->groups[$id])) $this->groups[$id] = (object)['entities' => [], 'players' => [], 'incoming' => []];
        return $this->groups[$id];
    }

    protected function getGroupIdFromWorldPosition($x, $y)
    {
        $size = (float)$this->groupCellSize;
        if ($size <= 0) $size = 350.0;
        return (int)floor(((float)$x) / $size) . ':' . (int)floor(((float)$y) / $size);
    }

    protected function parseGroupId($id)
    {
        if (!is_string($id)) return [0, 0];
        if (preg_match('/^(-?\d+):(-?\d+)$/', $id, $m)) return [(int)$m[1], (int)$m[2]];
        if (preg_match('/^(-?\d+)-(-?\d+)$/', $id, $m)) return [(int)$m[1], (int)$m[2]];
        return [0, 0];
    }

    public function getAdjacentGroupIds($groupId)
    {
        [$gx, $gy] = $this->parseGroupId($groupId);
        $ids = [];
        for ($dx = -1; $dx <= 1; $dx++) for ($dy = -1; $dy <= 1; $dy++) $ids[] = ($gx + $dx) . ':' . ($gy + $dy);
        return $ids;
    }

    public function initZoneGroups() { $this->zoneGroupsReady = true; }

    public function handleEntityGroupMembership($entity)
    {
        $hasChangedGroups = false;
        if (!$entity) return $hasChangedGroups;
        $groupId = $this->getGroupIdFromWorldPosition($entity->x, $entity->y);
        if (empty($entity->group) || ($entity->group && $entity->group !== $groupId)) {
            $hasChangedGroups = true;
            $oldGroups = $this->removeFromGroups($entity);
            $newGroups = $this->addToGroup($entity, $groupId);
            if (count($oldGroups) > 0) $entity->recentlyLeftGroups = array_diff($oldGroups, $newGroups);
        }
        return $hasChangedGroups;
    }

    public function removeFromGroups($entity)
    {
        $oldGroups = [];
        if (!$entity || !isset($entity->group) || $entity->group === null) return $oldGroups;
        $currentGroupId = $entity->group;
        $currentGroup = $this->groups[$currentGroupId] ?? null;
        if ($entity instanceof Player && $currentGroup) {
            $currentGroup->players = Utils::reject($currentGroup->players, function($id) use ($entity) { return $id == $entity->id; });
        }
        foreach ($this->getAdjacentGroupIds($currentGroupId) as $id) {
            $group = $this->groups[$id] ?? null;
            if (!$group) continue;
            if (isset($group->entities[$entity->id])) { unset($group->entities[$entity->id]); $oldGroups[] = $id; }
            if (!empty($group->incoming)) {
                $group->incoming = array_values(array_filter($group->incoming, function($e) use ($entity) { return $e && isset($e->id) ? $e->id != $entity->id : true; }));
            }
        }
        $entity->group = null;
        return $oldGroups;
    }

    public function addToGroup($entity, $groupId)
    {
        $newGroups = [];
        if (!$entity || !$groupId) return $newGroups;
        $this->ensureGroup($groupId);
        foreach ($this->getAdjacentGroupIds($groupId) as $id) {
            $group = $this->ensureGroup($id);
            if (!$group) continue;
            $group->entities[$entity->id] = $entity;
            $group->incoming[] = $entity;
            $newGroups[] = $id;
        }
        $entity->group = $groupId;
        if ($entity instanceof Player) $this->groups[$groupId]->players[] = $entity->id;
        return $newGroups;
    }

    public function processGroups()
    {
        if (!$this->zoneGroupsReady) return;
        foreach ($this->groups as $id => $group) {
            if (empty($group->incoming)) continue;
            foreach ($group->incoming as $entity) {
                if (!$entity) continue;
                if ($entity instanceof Player) $this->pushToGroup($id, new Messages\Spawn($entity), $entity->id);
                else $this->pushToGroup($id, new Messages\Spawn($entity));
            }
            $group->incoming = [];
        }
    }
}
