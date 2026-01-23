<?php
/**
 * ZeroTadpole - Pet System v1.0
 * Système de compagnons qui aident au combat
 */
namespace Server;

class PetSystem
{
    private $worldServer;
    private $playerPets = [];  // playerId => pet data
    
    // Types de pets disponibles
    private $petTypes = [
        // Pets de base
        'fish_basic' => [
            'id' => 'fish_basic',
            'name' => 'Petit Poisson',
            'icon' => '🐟',
            'rarity' => 'common',
            'baseStats' => ['damage' => 5, 'hp' => 20, 'speed' => 1.2],
            'ability' => 'attack',
            'abilityCD' => 2000,
            'description' => 'Un petit poisson fidèle qui attaque les ennemis.',
            'obtainMethod' => 'starter'
        ],
        'crab_pet' => [
            'id' => 'crab_pet',
            'name' => 'Crabe Compagnon',
            'icon' => '🦀',
            'rarity' => 'common',
            'baseStats' => ['damage' => 8, 'hp' => 30, 'speed' => 0.8],
            'ability' => 'tank',
            'abilityCD' => 3000,
            'description' => 'Un crabe résistant qui protège son maître.',
            'obtainMethod' => 'drop'
        ],
        'jellyfish_pet' => [
            'id' => 'jellyfish_pet',
            'name' => 'Méduse Lumineuse',
            'icon' => '🪼',
            'rarity' => 'uncommon',
            'baseStats' => ['damage' => 10, 'hp' => 15, 'speed' => 1.0],
            'ability' => 'shock',
            'abilityCD' => 4000,
            'description' => 'Une méduse qui électrocute les ennemis.',
            'obtainMethod' => 'drop'
        ],
        'seahorse_pet' => [
            'id' => 'seahorse_pet',
            'name' => 'Hippocampe',
            'icon' => '🌊',
            'rarity' => 'uncommon',
            'baseStats' => ['damage' => 3, 'hp' => 25, 'speed' => 1.5],
            'ability' => 'heal',
            'abilityCD' => 5000,
            'description' => 'Un hippocampe qui soigne son maître.',
            'obtainMethod' => 'quest'
        ],
        'octopus_pet' => [
            'id' => 'octopus_pet',
            'name' => 'Poulpe Rusé',
            'icon' => '🐙',
            'rarity' => 'rare',
            'baseStats' => ['damage' => 15, 'hp' => 40, 'speed' => 0.9],
            'ability' => 'multiattack',
            'abilityCD' => 3500,
            'description' => 'Un poulpe qui attaque plusieurs ennemis.',
            'obtainMethod' => 'craft'
        ],
        'shark_pet' => [
            'id' => 'shark_pet',
            'name' => 'Requin Féroce',
            'icon' => '🦈',
            'rarity' => 'rare',
            'baseStats' => ['damage' => 25, 'hp' => 35, 'speed' => 1.3],
            'ability' => 'frenzy',
            'abilityCD' => 6000,
            'description' => 'Un requin redoutable en mode frénésie.',
            'obtainMethod' => 'boss'
        ],
        'turtle_pet' => [
            'id' => 'turtle_pet',
            'name' => 'Tortue Sage',
            'icon' => '🐢',
            'rarity' => 'rare',
            'baseStats' => ['damage' => 5, 'hp' => 100, 'speed' => 0.5],
            'ability' => 'shield',
            'abilityCD' => 8000,
            'description' => 'Une tortue qui génère un bouclier protecteur.',
            'obtainMethod' => 'achievement'
        ],
        'electric_eel_pet' => [
            'id' => 'electric_eel_pet',
            'name' => 'Anguille Électrique',
            'icon' => '⚡',
            'rarity' => 'epic',
            'baseStats' => ['damage' => 30, 'hp' => 30, 'speed' => 1.4],
            'ability' => 'chain_lightning',
            'abilityCD' => 5000,
            'description' => 'Une anguille dont les éclairs rebondissent.',
            'obtainMethod' => 'boss'
        ],
        'dragon_fish' => [
            'id' => 'dragon_fish',
            'name' => 'Poisson Dragon',
            'icon' => '🐉',
            'rarity' => 'epic',
            'baseStats' => ['damage' => 40, 'hp' => 60, 'speed' => 1.1],
            'ability' => 'breath',
            'abilityCD' => 4000,
            'description' => 'Un poisson légendaire au souffle dévastateur.',
            'obtainMethod' => 'event'
        ],
        'phoenix_fish' => [
            'id' => 'phoenix_fish',
            'name' => 'Phénix des Mers',
            'icon' => '🔥',
            'rarity' => 'legendary',
            'baseStats' => ['damage' => 50, 'hp' => 80, 'speed' => 1.2],
            'ability' => 'rebirth',
            'abilityCD' => 60000,
            'description' => 'Un être mythique qui renaît de ses cendres.',
            'obtainMethod' => 'special'
        ]
    ];
    
    // Abilities des pets
    private $abilities = [
        'attack' => ['type' => 'damage', 'value' => 1.0, 'target' => 'single'],
        'tank' => ['type' => 'taunt', 'duration' => 3000, 'target' => 'self'],
        'shock' => ['type' => 'damage', 'value' => 1.5, 'target' => 'single', 'stun' => 1000],
        'heal' => ['type' => 'heal', 'value' => 15, 'target' => 'owner'],
        'multiattack' => ['type' => 'damage', 'value' => 0.6, 'target' => 'aoe', 'radius' => 50],
        'frenzy' => ['type' => 'buff', 'stat' => 'damage', 'value' => 2.0, 'duration' => 5000],
        'shield' => ['type' => 'shield', 'value' => 30, 'duration' => 5000, 'target' => 'owner'],
        'chain_lightning' => ['type' => 'damage', 'value' => 1.2, 'target' => 'chain', 'bounces' => 3],
        'breath' => ['type' => 'damage', 'value' => 2.0, 'target' => 'cone', 'angle' => 45],
        'rebirth' => ['type' => 'revive', 'hpPercent' => 50, 'target' => 'owner']
    ];
    
    // XP nécessaire par niveau
    private $levelXp = [1 => 0, 2 => 100, 3 => 250, 4 => 500, 5 => 1000, 6 => 2000, 7 => 4000, 8 => 7000, 9 => 12000, 10 => 20000];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Initialise le système de pets pour un joueur
     */
    public function initPlayer($playerId)
    {
        $this->playerPets[$playerId] = [
            'ownedPets' => [],
            'activePet' => null,
            'petStates' => [] // Runtime state of active pet
        ];
    }
    
    /**
     * Donne un pet à un joueur
     */
    public function givePet($playerId, $petTypeId)
    {
        if (!isset($this->petTypes[$petTypeId])) {
            return ['success' => false, 'error' => 'Type de pet inconnu'];
        }
        
        if (!isset($this->playerPets[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        $petType = $this->petTypes[$petTypeId];
        $petId = $petTypeId . '_' . time() . '_' . mt_rand(1000, 9999);
        
        // Créer le pet
        $pet = [
            'id' => $petId,
            'typeId' => $petTypeId,
            'name' => $petType['name'],
            'customName' => null,
            'level' => 1,
            'xp' => 0,
            'stats' => $petType['baseStats'],
            'obtainedAt' => time()
        ];
        
        $this->playerPets[$playerId]['ownedPets'][$petId] = $pet;
        
        // Notifier
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $this->worldServer->pushToPlayer($player, [
                'type' => 'pet_obtained',
                'pet' => $this->getPetFullData($pet),
                'petType' => $petType
            ]);
        }
        
        return ['success' => true, 'petId' => $petId, 'pet' => $pet];
    }
    
    /**
     * Active un pet
     */
    public function activatePet($playerId, $petId)
    {
        if (!isset($this->playerPets[$playerId])) {
            return ['success' => false, 'error' => 'Joueur non initialisé'];
        }
        
        $data = &$this->playerPets[$playerId];
        
        if (!isset($data['ownedPets'][$petId])) {
            return ['success' => false, 'error' => 'Pet non possédé'];
        }
        
        $pet = $data['ownedPets'][$petId];
        $petType = $this->petTypes[$pet['typeId']];
        
        $data['activePet'] = $petId;
        $data['petStates'][$petId] = [
            'hp' => $pet['stats']['hp'],
            'maxHp' => $pet['stats']['hp'],
            'lastAbility' => 0,
            'position' => null, // Will follow player
            'target' => null
        ];
        
        // Broadcast le spawn du pet
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $this->worldServer->pushBroadcast([
                'type' => 'pet_spawn',
                'playerId' => $playerId,
                'pet' => $this->getPetFullData($pet),
                'petType' => $petType,
                'x' => $player->x + 20,
                'y' => $player->y
            ]);
        }
        
        return ['success' => true, 'petId' => $petId];
    }
    
    /**
     * Désactive le pet actif
     */
    public function deactivatePet($playerId)
    {
        if (!isset($this->playerPets[$playerId])) {
            return ['success' => false, 'error' => 'Joueur non initialisé'];
        }
        
        $data = &$this->playerPets[$playerId];
        $activePet = $data['activePet'];
        
        if (!$activePet) {
            return ['success' => false, 'error' => 'Aucun pet actif'];
        }
        
        $this->worldServer->pushBroadcast([
            'type' => 'pet_despawn',
            'playerId' => $playerId,
            'petId' => $activePet
        ]);
        
        $data['activePet'] = null;
        unset($data['petStates'][$activePet]);
        
        return ['success' => true];
    }
    
    /**
     * Renomme un pet
     */
    public function renamePet($playerId, $petId, $newName)
    {
        if (!isset($this->playerPets[$playerId]['ownedPets'][$petId])) {
            return ['success' => false, 'error' => 'Pet non possédé'];
        }
        
        // Valider le nom
        $newName = trim($newName);
        if (strlen($newName) < 2 || strlen($newName) > 16) {
            return ['success' => false, 'error' => 'Nom invalide (2-16 caractères)'];
        }
        
        $this->playerPets[$playerId]['ownedPets'][$petId]['customName'] = $newName;
        
        $this->syncPets($playerId);
        
        return ['success' => true];
    }
    
    /**
     * Ajoute de l'XP à un pet
     */
    public function addPetXp($playerId, $xp)
    {
        if (!isset($this->playerPets[$playerId])) return;
        
        $data = &$this->playerPets[$playerId];
        $activePetId = $data['activePet'];
        
        if (!$activePetId || !isset($data['ownedPets'][$activePetId])) return;
        
        $pet = &$data['ownedPets'][$activePetId];
        $pet['xp'] += $xp;
        
        // Vérifier level up
        $maxLevel = max(array_keys($this->levelXp));
        while ($pet['level'] < $maxLevel) {
            $nextLevelXp = $this->levelXp[$pet['level'] + 1] ?? PHP_INT_MAX;
            if ($pet['xp'] >= $nextLevelXp) {
                $this->levelUpPet($playerId, $activePetId);
            } else {
                break;
            }
        }
    }
    
    /**
     * Level up un pet
     */
    private function levelUpPet($playerId, $petId)
    {
        $pet = &$this->playerPets[$playerId]['ownedPets'][$petId];
        $petType = $this->petTypes[$pet['typeId']];
        
        $pet['level']++;
        
        // Augmenter les stats (10% par niveau)
        $multiplier = 1 + ($pet['level'] - 1) * 0.1;
        $pet['stats'] = [
            'damage' => (int)($petType['baseStats']['damage'] * $multiplier),
            'hp' => (int)($petType['baseStats']['hp'] * $multiplier),
            'speed' => $petType['baseStats']['speed'] * (1 + ($pet['level'] - 1) * 0.02)
        ];
        
        // Mettre à jour le state si actif
        if ($this->playerPets[$playerId]['activePet'] === $petId) {
            $this->playerPets[$playerId]['petStates'][$petId]['maxHp'] = $pet['stats']['hp'];
            $this->playerPets[$playerId]['petStates'][$petId]['hp'] = $pet['stats']['hp'];
        }
        
        // Notifier
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $this->worldServer->pushToPlayer($player, [
                'type' => 'pet_level_up',
                'petId' => $petId,
                'newLevel' => $pet['level'],
                'newStats' => $pet['stats']
            ]);
        }
    }
    
    /**
     * Met à jour les pets (appelé chaque tick)
     */
    public function tick()
    {
        $now = microtime(true) * 1000;
        
        foreach ($this->playerPets as $playerId => &$data) {
            $activePetId = $data['activePet'];
            if (!$activePetId) continue;
            
            $pet = $data['ownedPets'][$activePetId] ?? null;
            if (!$pet) continue;
            
            $state = &$data['petStates'][$activePetId];
            $petType = $this->petTypes[$pet['typeId']];
            
            $player = $this->worldServer->getEntityById($playerId);
            if (!$player) continue;
            
            // Chercher une cible
            $target = $this->findPetTarget($playerId, $player->x, $player->y);
            
            // Utiliser l'ability si possible
            if ($target && $now - $state['lastAbility'] >= $petType['abilityCD']) {
                $this->usePetAbility($playerId, $activePetId, $target);
                $state['lastAbility'] = $now;
            }
        }
    }
    
    /**
     * Trouve une cible pour le pet
     */
    private function findPetTarget($playerId, $playerX, $playerY)
    {
        $nearestMob = null;
        $nearestDist = 200; // Range de détection
        
        foreach ($this->worldServer->mobs as $mob) {
            $dx = $mob['x'] - $playerX;
            $dy = $mob['y'] - $playerY;
            $dist = sqrt($dx * $dx + $dy * $dy);
            
            if ($dist < $nearestDist) {
                $nearestDist = $dist;
                $nearestMob = $mob;
            }
        }
        
        return $nearestMob;
    }
    
    /**
     * Utilise l'ability d'un pet
     */
    private function usePetAbility($playerId, $petId, $target)
    {
        $pet = $this->playerPets[$playerId]['ownedPets'][$petId];
        $petType = $this->petTypes[$pet['typeId']];
        $ability = $this->abilities[$petType['ability']];
        
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        switch ($ability['type']) {
            case 'damage':
                $damage = (int)($pet['stats']['damage'] * $ability['value']);
                $this->worldServer->damageMob($target['id'], $damage, $player);
                break;
                
            case 'heal':
                $player->hp = min($player->maxHp ?? 100, ($player->hp ?? 100) + $ability['value']);
                $this->worldServer->pushToPlayer($player, [
                    'type' => 'pet_heal',
                    'amount' => $ability['value'],
                    'newHp' => $player->hp
                ]);
                break;
                
            case 'shield':
                $this->worldServer->pushToPlayer($player, [
                    'type' => 'pet_shield',
                    'value' => $ability['value'],
                    'duration' => $ability['duration']
                ]);
                break;
        }
        
        // Broadcast l'action du pet
        $this->worldServer->pushBroadcast([
            'type' => 'pet_ability',
            'playerId' => $playerId,
            'petId' => $petId,
            'ability' => $petType['ability'],
            'targetId' => $target ? $target['id'] : null,
            'x' => $player->x,
            'y' => $player->y
        ]);
    }
    
    /**
     * Obtient les données complètes d'un pet
     */
    private function getPetFullData($pet)
    {
        $petType = $this->petTypes[$pet['typeId']];
        return [
            'id' => $pet['id'],
            'typeId' => $pet['typeId'],
            'name' => $pet['customName'] ?? $pet['name'],
            'baseName' => $petType['name'],
            'icon' => $petType['icon'],
            'rarity' => $petType['rarity'],
            'level' => $pet['level'],
            'xp' => $pet['xp'],
            'xpToNext' => $this->levelXp[$pet['level'] + 1] ?? null,
            'stats' => $pet['stats'],
            'ability' => $petType['ability'],
            'abilityInfo' => $this->abilities[$petType['ability']],
            'description' => $petType['description']
        ];
    }
    
    /**
     * Synchronise les pets avec le client
     */
    public function syncPets($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $data = $this->playerPets[$playerId] ?? null;
        if (!$data) return;
        
        $ownedPets = [];
        foreach ($data['ownedPets'] as $petId => $pet) {
            $ownedPets[$petId] = $this->getPetFullData($pet);
        }
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'pets_sync',
            'ownedPets' => $ownedPets,
            'activePet' => $data['activePet'],
            'petTypes' => array_map(function($pt) {
                return [
                    'id' => $pt['id'],
                    'name' => $pt['name'],
                    'icon' => $pt['icon'],
                    'rarity' => $pt['rarity'],
                    'description' => $pt['description'],
                    'obtainMethod' => $pt['obtainMethod']
                ];
            }, $this->petTypes)
        ]);
    }
    
    /**
     * Donne le pet de départ
     */
    public function giveStarterPet($playerId)
    {
        $this->givePet($playerId, 'fish_basic');
    }
    
    public function onPlayerDisconnect($playerId)
    {
        if (isset($this->playerPets[$playerId]['activePet'])) {
            $this->worldServer->pushBroadcast([
                'type' => 'pet_despawn',
                'playerId' => $playerId,
                'petId' => $this->playerPets[$playerId]['activePet']
            ]);
        }
    }
    
    public function getPlayerData($playerId)
    {
        $data = $this->playerPets[$playerId] ?? null;
        if ($data) {
            // Ne pas sauvegarder le state runtime
            unset($data['petStates']);
        }
        return $data;
    }
    
    public function loadPlayerData($playerId, $data)
    {
        if ($data) {
            $data['petStates'] = [];
            $data['activePet'] = null; // Reset à la connexion
            $this->playerPets[$playerId] = $data;
        } else {
            $this->initPlayer($playerId);
        }
    }
}
