<?php
/**
 * ZeroTadpole - Crafting System v1.0
 * Système de fabrication d'items avec recettes
 */
namespace Server;

class CraftingSystem
{
    private $worldServer;
    
    // Définition des recettes
    private $recipes = [
        // === POTIONS ===
        'potion_health' => [
            'id' => 'potion_health',
            'name' => 'Potion de Vie',
            'category' => 'potions',
            'ingredients' => [
                'material_coral' => 2,
                'material_seaweed' => 1
            ],
            'result' => ['item' => 'potion_health', 'quantity' => 2],
            'craftTime' => 2000, // ms
            'xpReward' => 5,
            'levelRequired' => 1
        ],
        'potion_health_large' => [
            'id' => 'potion_health_large',
            'name' => 'Grande Potion de Vie',
            'category' => 'potions',
            'ingredients' => [
                'potion_health' => 2,
                'material_pearl' => 1
            ],
            'result' => ['item' => 'potion_health_large', 'quantity' => 1],
            'craftTime' => 3000,
            'xpReward' => 15,
            'levelRequired' => 5
        ],
        'potion_speed' => [
            'id' => 'potion_speed',
            'name' => 'Potion de Vitesse',
            'category' => 'potions',
            'ingredients' => [
                'material_coral' => 1,
                'material_jellyfish' => 2
            ],
            'result' => ['item' => 'potion_speed', 'quantity' => 1],
            'craftTime' => 3000,
            'xpReward' => 10,
            'levelRequired' => 3
        ],
        'potion_strength' => [
            'id' => 'potion_strength',
            'name' => 'Potion de Force',
            'category' => 'potions',
            'ingredients' => [
                'material_crab_claw' => 2,
                'material_pearl' => 1
            ],
            'result' => ['item' => 'potion_strength', 'quantity' => 1],
            'craftTime' => 4000,
            'xpReward' => 15,
            'levelRequired' => 5
        ],
        
        // === ÉQUIPEMENT ===
        'armor_shell' => [
            'id' => 'armor_shell',
            'name' => 'Armure Coquille',
            'category' => 'armor',
            'ingredients' => [
                'material_shell' => 5,
                'material_coral' => 3
            ],
            'result' => ['item' => 'armor_shell', 'quantity' => 1],
            'craftTime' => 5000,
            'xpReward' => 25,
            'levelRequired' => 5
        ],
        'armor_scale' => [
            'id' => 'armor_scale',
            'name' => 'Armure Écailles',
            'category' => 'armor',
            'ingredients' => [
                'material_scale' => 10,
                'material_pearl' => 3,
                'material_crab_claw' => 2
            ],
            'result' => ['item' => 'armor_scale', 'quantity' => 1],
            'craftTime' => 8000,
            'xpReward' => 50,
            'levelRequired' => 15
        ],
        'armor_abyssal' => [
            'id' => 'armor_abyssal',
            'name' => 'Armure Abyssale',
            'category' => 'armor',
            'ingredients' => [
                'armor_scale' => 1,
                'material_abyssal_essence' => 5,
                'material_pearl' => 5
            ],
            'result' => ['item' => 'armor_abyssal', 'quantity' => 1],
            'craftTime' => 15000,
            'xpReward' => 150,
            'levelRequired' => 30
        ],
        
        // === SORTS ===
        'spell_wave' => [
            'id' => 'spell_wave',
            'name' => 'Sort Vague',
            'category' => 'spells',
            'ingredients' => [
                'material_pearl' => 3,
                'material_seaweed' => 5,
                'material_coral' => 2
            ],
            'result' => ['item' => 'spell_wave', 'quantity' => 1],
            'craftTime' => 6000,
            'xpReward' => 40,
            'levelRequired' => 8
        ],
        'spell_lightning' => [
            'id' => 'spell_lightning',
            'name' => 'Sort Éclair',
            'category' => 'spells',
            'ingredients' => [
                'material_jellyfish' => 5,
                'material_pearl' => 3,
                'material_electric_eel' => 2
            ],
            'result' => ['item' => 'spell_lightning', 'quantity' => 1],
            'craftTime' => 8000,
            'xpReward' => 60,
            'levelRequired' => 15
        ],
        'spell_vortex' => [
            'id' => 'spell_vortex',
            'name' => 'Sort Vortex',
            'category' => 'spells',
            'ingredients' => [
                'spell_wave' => 1,
                'material_abyssal_essence' => 3,
                'material_pearl' => 5
            ],
            'result' => ['item' => 'spell_vortex', 'quantity' => 1],
            'craftTime' => 12000,
            'xpReward' => 100,
            'levelRequired' => 25
        ],
        'spell_heal' => [
            'id' => 'spell_heal',
            'name' => 'Sort Soin',
            'category' => 'spells',
            'ingredients' => [
                'material_coral' => 5,
                'material_seaweed' => 5,
                'material_pearl' => 2
            ],
            'result' => ['item' => 'spell_heal', 'quantity' => 1],
            'craftTime' => 7000,
            'xpReward' => 50,
            'levelRequired' => 10
        ],
        
        // === ACCESSOIRES ===
        'accessory_ring_power' => [
            'id' => 'accessory_ring_power',
            'name' => 'Anneau de Puissance',
            'category' => 'accessories',
            'ingredients' => [
                'material_pearl' => 5,
                'material_crab_claw' => 3
            ],
            'result' => ['item' => 'accessory_ring_power', 'quantity' => 1],
            'craftTime' => 6000,
            'xpReward' => 35,
            'levelRequired' => 10
        ],
        'accessory_amulet_protection' => [
            'id' => 'accessory_amulet_protection',
            'name' => 'Amulette de Protection',
            'category' => 'accessories',
            'ingredients' => [
                'material_shell' => 5,
                'material_pearl' => 3,
                'material_coral' => 2
            ],
            'result' => ['item' => 'accessory_amulet_protection', 'quantity' => 1],
            'craftTime' => 6000,
            'xpReward' => 35,
            'levelRequired' => 10
        ],
        
        // === MATÉRIAUX AVANCÉS ===
        'material_refined_pearl' => [
            'id' => 'material_refined_pearl',
            'name' => 'Perle Raffinée',
            'category' => 'materials',
            'ingredients' => [
                'material_pearl' => 5
            ],
            'result' => ['item' => 'material_refined_pearl', 'quantity' => 1],
            'craftTime' => 5000,
            'xpReward' => 20,
            'levelRequired' => 15
        ],
        'material_abyssal_essence' => [
            'id' => 'material_abyssal_essence',
            'name' => 'Essence Abyssale',
            'category' => 'materials',
            'ingredients' => [
                'material_jellyfish' => 3,
                'material_electric_eel' => 2,
                'material_scale' => 3
            ],
            'result' => ['item' => 'material_abyssal_essence', 'quantity' => 1],
            'craftTime' => 8000,
            'xpReward' => 40,
            'levelRequired' => 20
        ],
        
        // === CONSOMMABLES SPÉCIAUX ===
        'shield_bubble' => [
            'id' => 'shield_bubble',
            'name' => 'Bouclier Bulle',
            'category' => 'consumables',
            'ingredients' => [
                'material_jellyfish' => 3,
                'material_seaweed' => 2
            ],
            'result' => ['item' => 'shield_bubble', 'quantity' => 1],
            'craftTime' => 4000,
            'xpReward' => 20,
            'levelRequired' => 7
        ],
        'bomb_water' => [
            'id' => 'bomb_water',
            'name' => 'Bombe d\'Eau',
            'category' => 'consumables',
            'ingredients' => [
                'material_shell' => 2,
                'material_coral' => 3,
                'material_jellyfish' => 1
            ],
            'result' => ['item' => 'bomb_water', 'quantity' => 3],
            'craftTime' => 5000,
            'xpReward' => 25,
            'levelRequired' => 12
        ]
    ];
    
    // Définition des matériaux
    private $materials = [
        'material_coral' => ['name' => 'Corail', 'icon' => '🪸', 'rarity' => 'common'],
        'material_seaweed' => ['name' => 'Algue', 'icon' => '🌿', 'rarity' => 'common'],
        'material_pearl' => ['name' => 'Perle', 'icon' => '⚪', 'rarity' => 'uncommon'],
        'material_shell' => ['name' => 'Coquillage', 'icon' => '🐚', 'rarity' => 'common'],
        'material_crab_claw' => ['name' => 'Pince de Crabe', 'icon' => '🦀', 'rarity' => 'common'],
        'material_jellyfish' => ['name' => 'Tentacule Méduse', 'icon' => '🪼', 'rarity' => 'uncommon'],
        'material_scale' => ['name' => 'Écaille', 'icon' => '🐟', 'rarity' => 'uncommon'],
        'material_electric_eel' => ['name' => 'Essence Électrique', 'icon' => '⚡', 'rarity' => 'rare'],
        'material_abyssal_essence' => ['name' => 'Essence Abyssale', 'icon' => '🌀', 'rarity' => 'epic'],
        'material_refined_pearl' => ['name' => 'Perle Raffinée', 'icon' => '💎', 'rarity' => 'rare']
    ];
    
    // Crafting en cours par joueur
    private $craftingInProgress = [];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Obtient toutes les recettes disponibles pour un joueur
     */
    public function getAvailableRecipes($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return [];
        
        $playerLevel = $player->level ?? 1;
        $available = [];
        
        foreach ($this->recipes as $id => $recipe) {
            $canCraft = $this->canCraft($playerId, $id);
            
            $available[$id] = [
                'id' => $id,
                'name' => $recipe['name'],
                'category' => $recipe['category'],
                'ingredients' => $recipe['ingredients'],
                'result' => $recipe['result'],
                'craftTime' => $recipe['craftTime'],
                'levelRequired' => $recipe['levelRequired'],
                'canCraft' => $canCraft['canCraft'],
                'reason' => $canCraft['reason'] ?? null,
                'missingIngredients' => $canCraft['missing'] ?? []
            ];
        }
        
        return $available;
    }
    
    /**
     * Vérifie si un joueur peut crafter une recette
     */
    public function canCraft($playerId, $recipeId)
    {
        if (!isset($this->recipes[$recipeId])) {
            return ['canCraft' => false, 'reason' => 'Recette inconnue'];
        }
        
        $recipe = $this->recipes[$recipeId];
        $player = $this->worldServer->getEntityById($playerId);
        
        if (!$player) {
            return ['canCraft' => false, 'reason' => 'Joueur introuvable'];
        }
        
        // Vérifier le niveau
        $playerLevel = $player->level ?? 1;
        if ($playerLevel < $recipe['levelRequired']) {
            return [
                'canCraft' => false,
                'reason' => "Niveau {$recipe['levelRequired']} requis"
            ];
        }
        
        // Vérifier les ingrédients
        $inventory = $this->worldServer->inventoryManager;
        if (!$inventory) {
            return ['canCraft' => false, 'reason' => 'Inventaire indisponible'];
        }
        
        $missing = [];
        foreach ($recipe['ingredients'] as $itemId => $quantity) {
            $has = $inventory->countItem($playerId, $itemId);
            if ($has < $quantity) {
                $missing[$itemId] = $quantity - $has;
            }
        }
        
        if (!empty($missing)) {
            return [
                'canCraft' => false,
                'reason' => 'Ingrédients manquants',
                'missing' => $missing
            ];
        }
        
        // Vérifier l'espace inventaire
        if (!$inventory->hasSpace($playerId)) {
            return ['canCraft' => false, 'reason' => 'Inventaire plein'];
        }
        
        return ['canCraft' => true];
    }
    
    /**
     * Démarre le craft d'une recette
     */
    public function startCraft($playerId, $recipeId)
    {
        $canCraft = $this->canCraft($playerId, $recipeId);
        if (!$canCraft['canCraft']) {
            return ['success' => false, 'error' => $canCraft['reason']];
        }
        
        // Vérifier si déjà en train de crafter
        if (isset($this->craftingInProgress[$playerId])) {
            return ['success' => false, 'error' => 'Déjà en train de fabriquer'];
        }
        
        $recipe = $this->recipes[$recipeId];
        $inventory = $this->worldServer->inventoryManager;
        
        // Retirer les ingrédients
        foreach ($recipe['ingredients'] as $itemId => $quantity) {
            $inventory->removeItem($playerId, $itemId, $quantity);
        }
        
        // Démarrer le craft
        $this->craftingInProgress[$playerId] = [
            'recipeId' => $recipeId,
            'startTime' => microtime(true) * 1000,
            'endTime' => (microtime(true) * 1000) + $recipe['craftTime']
        ];
        
        // Notifier le client
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $this->worldServer->pushToPlayer($player, [
                'type' => 'craft_started',
                'recipeId' => $recipeId,
                'craftTime' => $recipe['craftTime'],
                'endTime' => $this->craftingInProgress[$playerId]['endTime']
            ]);
        }
        
        return ['success' => true, 'craftTime' => $recipe['craftTime']];
    }
    
    /**
     * Vérifie et complète les crafts en cours (appelé chaque tick)
     */
    public function tick()
    {
        $now = microtime(true) * 1000;
        
        foreach ($this->craftingInProgress as $playerId => $craft) {
            if ($now >= $craft['endTime']) {
                $this->completeCraft($playerId);
            }
        }
    }
    
    /**
     * Complète un craft
     */
    private function completeCraft($playerId)
    {
        if (!isset($this->craftingInProgress[$playerId])) return;
        
        $craft = $this->craftingInProgress[$playerId];
        $recipe = $this->recipes[$craft['recipeId']];
        
        $inventory = $this->worldServer->inventoryManager;
        $player = $this->worldServer->getEntityById($playerId);
        
        // Ajouter le résultat
        $result = $inventory->addItem(
            $playerId,
            $recipe['result']['item'],
            $recipe['result']['quantity']
        );
        
        // Donner l'XP
        if ($player && $this->worldServer->questSystem) {
            $this->worldServer->questSystem->addXP($player, $recipe['xpReward']);
        }
        
        // Mettre à jour les achievements
        if ($this->worldServer->achievementSystem) {
            $this->worldServer->achievementSystem->updateStat($playerId, 'items_crafted', 1);
        }
        
        // Notifier le client
        if ($player) {
            $this->worldServer->pushToPlayer($player, [
                'type' => 'craft_completed',
                'recipeId' => $craft['recipeId'],
                'result' => $recipe['result'],
                'xpReward' => $recipe['xpReward'],
                'success' => $result['success']
            ]);
        }
        
        // Nettoyer
        unset($this->craftingInProgress[$playerId]);
    }
    
    /**
     * Annule un craft en cours
     */
    public function cancelCraft($playerId)
    {
        if (!isset($this->craftingInProgress[$playerId])) {
            return ['success' => false, 'error' => 'Aucun craft en cours'];
        }
        
        $craft = $this->craftingInProgress[$playerId];
        $recipe = $this->recipes[$craft['recipeId']];
        $inventory = $this->worldServer->inventoryManager;
        
        // Rendre 50% des ingrédients
        foreach ($recipe['ingredients'] as $itemId => $quantity) {
            $refund = max(1, (int)($quantity * 0.5));
            $inventory->addItem($playerId, $itemId, $refund);
        }
        
        // Notifier
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $this->worldServer->pushToPlayer($player, [
                'type' => 'craft_cancelled',
                'recipeId' => $craft['recipeId'],
                'refundedPercent' => 50
            ]);
        }
        
        unset($this->craftingInProgress[$playerId]);
        
        return ['success' => true];
    }
    
    /**
     * Obtient le craft en cours d'un joueur
     */
    public function getCraftInProgress($playerId)
    {
        return $this->craftingInProgress[$playerId] ?? null;
    }
    
    /**
     * Synchronise l'état du crafting avec le client
     */
    public function syncCrafting($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'crafting_sync',
            'recipes' => $this->getAvailableRecipes($playerId),
            'materials' => $this->materials,
            'inProgress' => $this->getCraftInProgress($playerId),
            'categories' => [
                'potions' => ['name' => '🧪 Potions', 'order' => 1],
                'armor' => ['name' => '🛡️ Armures', 'order' => 2],
                'spells' => ['name' => '✨ Sorts', 'order' => 3],
                'accessories' => ['name' => '💍 Accessoires', 'order' => 4],
                'consumables' => ['name' => '📦 Consommables', 'order' => 5],
                'materials' => ['name' => '🪨 Matériaux', 'order' => 6]
            ]
        ]);
    }
    
    /**
     * Obtient les définitions de matériaux
     */
    public function getMaterials()
    {
        return $this->materials;
    }
    
    public function onPlayerDisconnect($playerId)
    {
        // Annuler le craft en cours sans refund
        unset($this->craftingInProgress[$playerId]);
    }
}
