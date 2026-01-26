<?php
/**
 * ZeroTadpole - Inventory Manager v2.0
 * Système d'inventaire, items et sorts côté serveur
 */
namespace Server;

class InventoryManager 
{
    private $worldServer;
    private $playerInventories = []; // playerId => inventory data
    private $playerEquipment = [];   // playerId => equipped items
    private $playerCooldowns = [];   // playerId => spell cooldowns
    
    const MAX_INVENTORY_SLOTS = 20;
    const MAX_EQUIPPED_SPELLS = 4;
    const MAX_STACK_SIZE = 99;
    
    // Définitions des items
    private $itemDefinitions = [];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
        $this->loadItemDefinitions();
    }
    
    /**
     * Charger les définitions d'items
     */
    private function loadItemDefinitions()
    {
        $this->itemDefinitions = [
            // === CONSOMMABLES ===
            'potion_health' => [
                'id' => 'potion_health',
                'name' => 'Potion de Vie',
                'icon' => '❤️',
                'type' => 'consumable',
                'subtype' => 'potion',
                'rarity' => 'common',
                'stackable' => true,
                'maxStack' => 20,
                'effect' => ['type' => 'heal', 'value' => 30],
                'cooldown' => 5000,
                'sellPrice' => 5
            ],
            'potion_health_large' => [
                'id' => 'potion_health_large',
                'name' => 'Grande Potion',
                'icon' => '💖',
                'type' => 'consumable',
                'subtype' => 'potion',
                'rarity' => 'uncommon',
                'stackable' => true,
                'maxStack' => 10,
                'effect' => ['type' => 'heal', 'value' => 60],
                'cooldown' => 8000,
                'sellPrice' => 15
            ],
            'potion_speed' => [
                'id' => 'potion_speed',
                'name' => 'Potion de Vitesse',
                'icon' => '💨',
                'type' => 'consumable',
                'subtype' => 'potion',
                'rarity' => 'uncommon',
                'stackable' => true,
                'maxStack' => 10,
                'effect' => ['type' => 'buff', 'stat' => 'speed', 'value' => 1.5, 'duration' => 10000],
                'cooldown' => 30000,
                'sellPrice' => 20
            ],
            'potion_strength' => [
                'id' => 'potion_strength',
                'name' => 'Potion de Force',
                'icon' => '💪',
                'type' => 'consumable',
                'subtype' => 'potion',
                'rarity' => 'rare',
                'stackable' => true,
                'maxStack' => 5,
                'effect' => ['type' => 'buff', 'stat' => 'damage', 'value' => 1.5, 'duration' => 15000],
                'cooldown' => 45000,
                'sellPrice' => 35
            ],
            'shield_bubble' => [
                'id' => 'shield_bubble',
                'name' => 'Bulle Protectrice',
                'icon' => '🛡️',
                'type' => 'consumable',
                'subtype' => 'shield',
                'rarity' => 'rare',
                'stackable' => true,
                'maxStack' => 5,
                'effect' => ['type' => 'shield', 'duration' => 5000],
                'cooldown' => 60000,
                'sellPrice' => 50
            ],
            
            // === SORTS ===
            'spell_bubble' => [
                'id' => 'spell_bubble',
                'name' => 'Bulle d\'Attaque',
                'icon' => '🫧',
                'type' => 'spell',
                'subtype' => 'projectile',
                'rarity' => 'common',
                'stackable' => false,
                'damage' => 15,
                'range' => 150,
                'speed' => 8,
                'cooldown' => 1000,
                'manaCost' => 0,
                'sellPrice' => 25
            ],
            'spell_wave' => [
                'id' => 'spell_wave',
                'name' => 'Vague Sonore',
                'icon' => '🌊',
                'type' => 'spell',
                'subtype' => 'aoe',
                'rarity' => 'uncommon',
                'stackable' => false,
                'damage' => 25,
                'range' => 80,
                'aoeRadius' => 60,
                'cooldown' => 3000,
                'manaCost' => 0,
                'sellPrice' => 75
            ],
            'spell_lightning' => [
                'id' => 'spell_lightning',
                'name' => 'Éclair Aquatique',
                'icon' => '⚡',
                'type' => 'spell',
                'subtype' => 'instant',
                'rarity' => 'rare',
                'stackable' => false,
                'damage' => 40,
                'range' => 200,
                'cooldown' => 5000,
                'manaCost' => 0,
                'sellPrice' => 150
            ],
            'spell_vortex' => [
                'id' => 'spell_vortex',
                'name' => 'Vortex',
                'icon' => '🌀',
                'type' => 'spell',
                'subtype' => 'aoe',
                'rarity' => 'epic',
                'stackable' => false,
                'damage' => 60,
                'range' => 120,
                'aoeRadius' => 80,
                'cooldown' => 8000,
                'manaCost' => 0,
                'sellPrice' => 300
            ],
            'spell_heal' => [
                'id' => 'spell_heal',
                'name' => 'Régénération',
                'icon' => '✨',
                'type' => 'spell',
                'subtype' => 'heal',
                'rarity' => 'rare',
                'stackable' => false,
                'healAmount' => 40,
                'cooldown' => 10000,
                'manaCost' => 0,
                'sellPrice' => 200
            ],
            'spell_dash' => [
                'id' => 'spell_dash',
                'name' => 'Dash Aquatique',
                'icon' => '💫',
                'type' => 'spell',
                'subtype' => 'movement',
                'rarity' => 'uncommon',
                'stackable' => false,
                // Utilisé côté serveur pour autoriser une vitesse plus élevée pendant un court laps de temps
                'boostMultiplier' => 1.8,
                'boostDuration' => 900,
                'cooldown' => 6000,
                'manaCost' => 0,
                'sellPrice' => 100
            ],
            'spell_companion' => [
                'id' => 'spell_companion',
                'name' => 'Commande Compagnon',
                'icon' => '🐾',
                'type' => 'spell',
                'subtype' => 'pet_command',
                'rarity' => 'uncommon',
                'stackable' => false,
                'cooldown' => 2500,
                'manaCost' => 0,
                'sellPrice' => 100
            ],
            
            // === ÉQUIPEMENT ===
            'armor_shell' => [
                'id' => 'armor_shell',
                'name' => 'Carapace de Crabe',
                'icon' => '🦀',
                'type' => 'equipment',
                'subtype' => 'armor',
                'rarity' => 'common',
                'stackable' => false,
                'stats' => ['defense' => 5, 'maxHp' => 10],
                'sellPrice' => 50
            ],
            'armor_scale' => [
                'id' => 'armor_scale',
                'name' => 'Écailles de Requin',
                'icon' => '🦈',
                'type' => 'equipment',
                'subtype' => 'armor',
                'rarity' => 'rare',
                'stackable' => false,
                'stats' => ['defense' => 15, 'maxHp' => 30, 'speed' => 0.1],
                'sellPrice' => 200
            ],
            
            // === MATÉRIAUX ===
            'material_pearl' => [
                'id' => 'material_pearl',
                'name' => 'Perle Rare',
                'icon' => '🔮',
                'type' => 'material',
                'rarity' => 'rare',
                'stackable' => true,
                'maxStack' => 50,
                'sellPrice' => 25
            ],
            'material_coral' => [
                'id' => 'material_coral',
                'name' => 'Fragment de Corail',
                'icon' => '🪸',
                'type' => 'material',
                'rarity' => 'common',
                'stackable' => true,
                'maxStack' => 99,
                'sellPrice' => 5
            ],
            'material_seaweed' => [
                'id' => 'material_seaweed',
                'name' => 'Algue Marine',
                'icon' => '🌿',
                'type' => 'material',
                'rarity' => 'common',
                'stackable' => true,
                'maxStack' => 99,
                'sellPrice' => 3
            ],
            'material_shell' => [
                'id' => 'material_shell',
                'name' => 'Coquillage',
                'icon' => '🐚',
                'type' => 'material',
                'rarity' => 'common',
                'stackable' => true,
                'maxStack' => 99,
                'sellPrice' => 4
            ],
            'material_crab_claw' => [
                'id' => 'material_crab_claw',
                'name' => 'Pince de Crabe',
                'icon' => '🦀',
                'type' => 'material',
                'rarity' => 'common',
                'stackable' => true,
                'maxStack' => 99,
                'sellPrice' => 6
            ],
            'material_jellyfish' => [
                'id' => 'material_jellyfish',
                'name' => 'Tentacule de Méduse',
                'icon' => '🪼',
                'type' => 'material',
                'rarity' => 'uncommon',
                'stackable' => true,
                'maxStack' => 50,
                'sellPrice' => 12
            ],
            'material_scale' => [
                'id' => 'material_scale',
                'name' => 'Écaille de Poisson',
                'icon' => '🐟',
                'type' => 'material',
                'rarity' => 'uncommon',
                'stackable' => true,
                'maxStack' => 50,
                'sellPrice' => 10
            ],
            'material_electric_eel' => [
                'id' => 'material_electric_eel',
                'name' => 'Essence Électrique',
                'icon' => '⚡',
                'type' => 'material',
                'rarity' => 'rare',
                'stackable' => true,
                'maxStack' => 30,
                'sellPrice' => 35
            ],
            'material_abyssal_essence' => [
                'id' => 'material_abyssal_essence',
                'name' => 'Essence Abyssale',
                'icon' => '🌀',
                'type' => 'material',
                'rarity' => 'epic',
                'stackable' => true,
                'maxStack' => 20,
                'sellPrice' => 100
            ],
            'material_refined_pearl' => [
                'id' => 'material_refined_pearl',
                'name' => 'Perle Raffinée',
                'icon' => '💎',
                'type' => 'material',
                'rarity' => 'rare',
                'stackable' => true,
                'maxStack' => 20,
                'sellPrice' => 75
            ]
        ];
    }
    
    /**
     * Initialiser l'inventaire d'un joueur
     */
    public function initPlayer($playerId)
    {
        if (!isset($this->playerInventories[$playerId])) {
            $this->playerInventories[$playerId] = [
                'slots' => array_fill(0, self::MAX_INVENTORY_SLOTS, null),
                'gems' => 0,
                'gold' => 0
            ];
            
            $this->playerEquipment[$playerId] = [
                'spells' => [null, null, null, null], // 4 slots de sorts
                'armor' => null,
                'accessory' => null
            ];
            
            $this->playerCooldowns[$playerId] = [];
            
            // Donner les sorts de base
            $this->addItem($playerId, 'spell_bubble', 1);
            $this->equipSpell($playerId, 'spell_bubble', 0);

            // Remplir Z et E par défaut (AZER)
            $this->addItem($playerId, 'spell_wave', 1);
            $this->equipSpell($playerId, 'spell_wave', 1);
            $this->addItem($playerId, 'spell_lightning', 1);
            $this->equipSpell($playerId, 'spell_lightning', 2);

            // Dash/speed sur R (et Espace)
            $this->addItem($playerId, 'spell_dash', 1);
            $this->equipSpell($playerId, 'spell_dash', 3);

            // Compagnon (non consommable, à équiper si désiré)
            $this->addItem($playerId, 'spell_companion', 1);
}
    }
    
    /**
     * Obtenir l'inventaire d'un joueur
     */
    public function getInventory($playerId)
    {
        return $this->playerInventories[$playerId] ?? null;
    }
    
    /**
     * Obtenir l'équipement d'un joueur
     */
    public function getEquipment($playerId)
    {
        return $this->playerEquipment[$playerId] ?? null;
    }
    
    /**
     * Ajouter un item à l'inventaire
     */
    public function addItem($playerId, $itemId, $quantity = 1)
    {
        if (!isset($this->playerInventories[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        $itemDef = $this->itemDefinitions[$itemId] ?? null;
        if (!$itemDef) {
            return ['success' => false, 'error' => 'Item inconnu'];
        }
        
        $inventory = &$this->playerInventories[$playerId];
        
        // Si stackable, chercher un stack existant
        if ($itemDef['stackable'] ?? false) {
            foreach ($inventory['slots'] as $i => &$slot) {
                if ($slot && $slot['itemId'] === $itemId) {
                    $maxStack = $itemDef['maxStack'] ?? self::MAX_STACK_SIZE;
                    $canAdd = $maxStack - $slot['quantity'];
                    $toAdd = min($quantity, $canAdd);
                    
                    if ($toAdd > 0) {
                        $slot['quantity'] += $toAdd;
                        $quantity -= $toAdd;
                    }
                    
                    if ($quantity <= 0) {
                        $this->syncInventory($playerId);
                        return ['success' => true, 'added' => $toAdd];
                    }
                }
            }
        }
        
        // Trouver un slot vide
        foreach ($inventory['slots'] as $i => &$slot) {
            if ($slot === null) {
                $slot = [
                    'itemId' => $itemId,
                    'quantity' => min($quantity, $itemDef['maxStack'] ?? 1)
                ];
                $quantity -= $slot['quantity'];
                
                if ($quantity <= 0 || !($itemDef['stackable'] ?? false)) {
                    $this->syncInventory($playerId);
                    return ['success' => true, 'slotIndex' => $i];
                }
            }
        }
        
        if ($quantity > 0) {
            return ['success' => false, 'error' => 'Inventaire plein', 'overflow' => $quantity];
        }
        
        $this->syncInventory($playerId);
        return ['success' => true];
    }
    
    /**
     * Retirer un item de l'inventaire
     */
    public function removeItem($playerId, $slotIndex, $quantity = 1)
    {
        if (!isset($this->playerInventories[$playerId])) {
            return ['success' => false, 'error' => 'Inventaire non initialisé'];
        }
        
        $inventory = &$this->playerInventories[$playerId];
        
        if ($slotIndex < 0 || $slotIndex >= self::MAX_INVENTORY_SLOTS) {
            return ['success' => false, 'error' => 'Slot invalide'];
        }
        
        $slot = &$inventory['slots'][$slotIndex];
        
        if ($slot === null) {
            return ['success' => false, 'error' => 'Slot vide'];
        }

        // IMPORTANT: capturer l'ID avant de modifier la référence, sinon on renvoie null
        // quand le slot devient vide (bug "drop" -> pas de loot créé).
        $itemId = $slot['itemId'] ?? null;
        
        $removed = min($quantity, $slot['quantity']);
        $slot['quantity'] -= $removed;
        
        if ($slot['quantity'] <= 0) {
            $inventory['slots'][$slotIndex] = null;
        }

        // Si on a retiré le dernier exemplaire d'un sort, le déséquiper partout
        // (sinon le joueur peut continuer à le lancer après l'avoir jeté).
        if ($itemId && ($this->itemDefinitions[$itemId]['type'] ?? '') === 'spell') {
            // Après la suppression, si le joueur ne possède plus ce sort -> purge équipement
            if (!$this->hasItem($playerId, $itemId)) {
                $this->unequipSpellEverywhere($playerId, $itemId);
            }
        }

        $this->syncInventory($playerId);
        return ['success' => true, 'removed' => $removed, 'itemId' => $itemId, 'slot' => (int)$slotIndex];
    }

    /**
     * Retirer un sort des slots équipés s'il n'est plus possédé (drop/échange).
     */
    private function unequipSpellEverywhere($playerId, $spellId)
    {
        if (!$spellId || !isset($this->playerEquipment[$playerId])) return;
        $changed = false;
        foreach ($this->playerEquipment[$playerId]['spells'] as $i => $sid) {
            if ($sid === $spellId) {
                $this->playerEquipment[$playerId]['spells'][$i] = null;
                $changed = true;
            }
        }
        if ($changed) {
            $this->syncEquipment($playerId);
        }
    }
    
    /**
     * Utiliser un item
     */
    public function useItem($playerId, $slotIndex)
    {
        if (!isset($this->playerInventories[$playerId])) {
            return ['success' => false, 'error' => 'Inventaire non initialisé', 'slot' => (int)$slotIndex];
        }

        $slotIndex = (int)$slotIndex;
        if ($slotIndex < 0 || $slotIndex >= self::MAX_INVENTORY_SLOTS) {
            return ['success' => false, 'error' => 'Slot invalide', 'slot' => $slotIndex];
        }

        $inventory = $this->playerInventories[$playerId];
        $slot = $inventory['slots'][$slotIndex] ?? null;

        if (!$slot) {
            return ['success' => false, 'error' => 'Slot vide', 'slot' => $slotIndex];
        }

        $itemDef = $this->itemDefinitions[$slot['itemId']] ?? null;
        if (!$itemDef) {
            return ['success' => false, 'error' => 'Item inconnu', 'slot' => $slotIndex, 'itemId' => $slot['itemId']];
        }

        // Vérifier le cooldown
        $cooldownKey = 'item_' . $slot['itemId'];
        if ($this->isOnCooldown($playerId, $cooldownKey)) {
            $remaining = $this->getCooldownRemaining($playerId, $cooldownKey);
            return ['success' => false, 'error' => 'En recharge', 'cooldown' => $remaining, 'slot' => $slotIndex, 'itemId' => $slot['itemId']];
        }

        // Appliquer l'effet selon le type
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) {
            return ['success' => false, 'error' => 'Joueur introuvable', 'slot' => $slotIndex, 'itemId' => $slot['itemId']];
        }

        $result = $this->applyItemEffect($player, $itemDef);

        if (!empty($result['success'])) {
            // Mettre le cooldown
            if (isset($itemDef['cooldown'])) {
                $this->setCooldown($playerId, $cooldownKey, $itemDef['cooldown']);
            }

            // Consommer l'item si consommable
            if (($itemDef['type'] ?? '') === 'consumable') {
                $this->removeItem($playerId, $slotIndex, 1);
            }
        }

        // Ajout d'info utile pour le client (anti-spam + UI)
        $result['slot'] = $slotIndex;
        $result['itemId'] = $slot['itemId'];
        return $result;
    }
    
    /**
     * Appliquer l'effet d'un item
     */
    private function applyItemEffect($player, $itemDef)
    {
        $effect = $itemDef['effect'] ?? null;
        
        if (!$effect) {
            return ['success' => false, 'error' => 'Pas d\'effet'];
        }
        
        switch ($effect['type']) {
            case 'heal':
                $healAmount = $effect['value'];
                $player->hitPoints = min($player->maxHitPoints ?? 100, $player->hitPoints + $healAmount);
                $this->worldServer->pushToPlayer($player, [
                    'type' => 'health',
                    'points' => $player->hitPoints,
                    'maxPoints' => $player->maxHitPoints ?? 100
                ]);
                return ['success' => true, 'healed' => $healAmount];
                
            case 'buff':
                $buffData = [
                    'stat' => $effect['stat'],
                    'value' => $effect['value'],
                    'expiresAt' => microtime(true) * 1000 + $effect['duration']
                ];
                $this->worldServer->pushToPlayer($player, [
                    'type' => 'buff_applied',
                    'buff' => $buffData
                ]);
                return ['success' => true, 'buff' => $buffData];
                
            case 'shield':
                $shieldData = [
                    'expiresAt' => microtime(true) * 1000 + $effect['duration']
                ];
                $this->worldServer->pushToPlayer($player, [
                    'type' => 'shield_applied',
                    'shield' => $shieldData
                ]);
                return ['success' => true, 'shield' => $shieldData];
                
            default:
                return ['success' => false, 'error' => 'Effet inconnu'];
        }
    }
    
    /**
     * Équiper un sort
     */
    public function equipSpell($playerId, $itemId, $slotIndex)
    {
        if (!isset($this->playerEquipment[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        if ($slotIndex < 0 || $slotIndex >= self::MAX_EQUIPPED_SPELLS) {
            return ['success' => false, 'error' => 'Slot de sort invalide'];
        }
        
        $itemDef = $this->itemDefinitions[$itemId] ?? null;
        if (!$itemDef || $itemDef['type'] !== 'spell') {
            return ['success' => false, 'error' => 'Item n\'est pas un sort'];
        }
        
        // Vérifier si le joueur possède ce sort
        $hasSpell = $this->hasItem($playerId, $itemId);
        if (!$hasSpell) {
            return ['success' => false, 'error' => 'Sort non possédé'];
        }
        
        $equipment = &$this->playerEquipment[$playerId];
        $equipment['spells'][$slotIndex] = $itemId;
        
        $this->syncEquipment($playerId);
        return ['success' => true, 'slot' => $slotIndex, 'spellId' => $itemId];
    }
    
    /**
     * Lancer un sort équipé
     */
    public function castSpell($playerId, $spellSlot, $targetX, $targetY)
    {
        if (!isset($this->playerEquipment[$playerId])) {
            return ['success' => false, 'error' => 'Équipement non initialisé', 'slot' => (int)$spellSlot];
        }

        $spellSlot = (int)$spellSlot;
        if ($spellSlot < 0 || $spellSlot >= self::MAX_EQUIPPED_SPELLS) {
            return ['success' => false, 'error' => 'Slot de sort invalide', 'slot' => $spellSlot];
        }

        $equipment = $this->playerEquipment[$playerId];
        $spellId = $equipment['spells'][$spellSlot] ?? null;

        if (!$spellId) {
            return ['success' => false, 'error' => 'Pas de sort dans ce slot', 'slot' => $spellSlot];
        }

        $spellDef = $this->itemDefinitions[$spellId] ?? null;
        if (!$spellDef) {
            return ['success' => false, 'error' => 'Sort inconnu', 'slot' => $spellSlot, 'spellId' => $spellId];
        }

        // Vérifier le cooldown (server-authoritative)
        $cooldownKey = 'spell_' . $spellSlot;
        if ($this->isOnCooldown($playerId, $cooldownKey)) {
            $remaining = $this->getCooldownRemaining($playerId, $cooldownKey);
            return ['success' => false, 'error' => 'Sort en recharge', 'cooldown' => $remaining, 'slot' => $spellSlot, 'spellId' => $spellId];
        }

        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) {
            return ['success' => false, 'error' => 'Joueur introuvable', 'slot' => $spellSlot, 'spellId' => $spellId];
        }

        // Clamp coords
        $targetX = is_numeric($targetX) ? (float)$targetX : (float)$player->x;
        $targetY = is_numeric($targetY) ? (float)$targetY : (float)$player->y;

        // Données communes (utiles client)
        $spellData = [
            'spellId' => $spellId,
            'casterId' => $playerId,
            'x' => $player->x,
            'y' => $player->y,
            'targetX' => $targetX,
            'targetY' => $targetY,
            'damage' => $spellDef['damage'] ?? 0,
            'healAmount' => $spellDef['healAmount'] ?? 0,
            'range' => $spellDef['range'] ?? 100,
            'speed' => $spellDef['speed'] ?? 5,
            'aoeRadius' => $spellDef['aoeRadius'] ?? 0,
            'subtype' => $spellDef['subtype'] ?? 'projectile',
            'slot' => $spellSlot
        ];

        // === Subtypes spéciaux server-authoritative ===
        $subtype = $spellDef['subtype'] ?? 'projectile';

        if ($subtype === 'movement') {
            // Appliquer un boost de vitesse court (validé serveur)
            $mult = isset($spellDef['boostMultiplier']) ? (float)$spellDef['boostMultiplier'] : 1.8;
            if ($mult < 1.0) $mult = 1.0;
            if ($mult > 3.0) $mult = 3.0;

            $duration = isset($spellDef['boostDuration']) ? (int)$spellDef['boostDuration'] : 900;
            if ($duration < 100) $duration = 100;
            if ($duration > 5000) $duration = 5000;

            $nowMs = microtime(true) * 1000;
            $player->speedBoostMultiplier = $mult;
            $player->speedBoostUntil = $nowMs + $duration;

            // Cooldown du slot
            $this->setCooldown($playerId, $cooldownKey, (int)($spellDef['cooldown'] ?? 0));
            $cooldownUntil = $this->playerCooldowns[$playerId][$cooldownKey] ?? ($nowMs + (int)($spellDef['cooldown'] ?? 0));

            // Informer le client (UI + mouvement)
            $this->worldServer->pushToPlayer($player, [
                'type' => 'boost_state',
                'until' => $player->speedBoostUntil,
                'multiplier' => $mult,
                'cooldownUntil' => $cooldownUntil,
                'slot' => $spellSlot,
                'spellId' => $spellId
            ]);

            // Broadcast optionnel (effets visuels / compat)
            $this->worldServer->pushBroadcast([
                'type' => 'spell_cast',
                'spell' => $spellData
            ]);

            return ['success' => true, 'spell' => $spellData, 'slot' => $spellSlot, 'spellId' => $spellId];
        }

        if ($subtype === 'pet_command') {
            // Commande / attaque spéciale du compagnon
            $petResult = $this->worldServer->petSystem ? $this->worldServer->petSystem->commandSpecial($playerId, $targetX, $targetY) : ['success' => false, 'error' => 'Compagnon indisponible'];
            if (empty($petResult['success'])) {
                $petResult['slot'] = $spellSlot;
                $petResult['spellId'] = $spellId;
                return $petResult;
            }

            $this->setCooldown($playerId, $cooldownKey, (int)($spellDef['cooldown'] ?? 0));

            // Broadcast optionnel (FX)
            $this->worldServer->pushBroadcast([
                'type' => 'spell_cast',
                'spell' => $spellData
            ]);

            return ['success' => true, 'spell' => $spellData, 'pet' => $petResult, 'slot' => $spellSlot, 'spellId' => $spellId];
        }

        // === Sorts classiques (projectiles / aoe / heal) ===
        $this->setCooldown($playerId, $cooldownKey, (int)($spellDef['cooldown'] ?? 0));

        // Heal direct si subtype "heal"
        if ($subtype === 'heal' && !empty($spellDef['healAmount'])) {
            $healAmount = (int)$spellDef['healAmount'];
            $player->hitPoints = min($player->maxHitPoints ?? 100, $player->hitPoints + $healAmount);
            $this->worldServer->pushToPlayer($player, [
                'type' => 'health',
                'points' => $player->hitPoints,
                'maxPoints' => $player->maxHitPoints ?? 100
            ]);
            $spellData['healAmount'] = $healAmount;
        }

        $this->worldServer->pushBroadcast([
            'type' => 'spell_cast',
            'spell' => $spellData
        ]);

        return ['success' => true, 'spell' => $spellData, 'slot' => $spellSlot, 'spellId' => $spellId];
    }
    
    /**
     * Vérifier si le joueur possède un item
     */
    public function hasItem($playerId, $itemId)
    {
        if (!isset($this->playerInventories[$playerId])) return false;
        
        foreach ($this->playerInventories[$playerId]['slots'] as $slot) {
            if ($slot && $slot['itemId'] === $itemId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Compter les items d'un type
     */
    public function countItem($playerId, $itemId)
    {
        if (!isset($this->playerInventories[$playerId])) return 0;
        
        $count = 0;
        foreach ($this->playerInventories[$playerId]['slots'] as $slot) {
            if ($slot && $slot['itemId'] === $itemId) {
                $count += $slot['quantity'];
            }
        }
        return $count;
    }
    
    /**
     * Gestion des cooldowns
     */
    private function setCooldown($playerId, $key, $duration)
    {
        if (!isset($this->playerCooldowns[$playerId])) {
            $this->playerCooldowns[$playerId] = [];
        }
        $this->playerCooldowns[$playerId][$key] = microtime(true) * 1000 + $duration;
    }
    
    private function isOnCooldown($playerId, $key)
    {
        $expiresAt = $this->playerCooldowns[$playerId][$key] ?? 0;
        return microtime(true) * 1000 < $expiresAt;
    }
    
    private function getCooldownRemaining($playerId, $key)
    {
        $expiresAt = $this->playerCooldowns[$playerId][$key] ?? 0;
        return max(0, $expiresAt - microtime(true) * 1000);
    }
    
    /**
     * Synchroniser l'inventaire avec le client
     */
    public function syncInventory($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $inventory = $this->playerInventories[$playerId] ?? null;
        if (!$inventory) return;
        
        // Enrichir les slots avec les définitions
        $enrichedSlots = [];
        foreach ($inventory['slots'] as $slot) {
            if ($slot) {
                $itemDef = $this->itemDefinitions[$slot['itemId']] ?? null;
                $enrichedSlots[] = [
                    'itemId' => $slot['itemId'],
                    'quantity' => $slot['quantity'],
                    'name' => $itemDef['name'] ?? 'Inconnu',
                    'icon' => $itemDef['icon'] ?? '❓',
                    'type' => $itemDef['type'] ?? 'misc',
                    'rarity' => $itemDef['rarity'] ?? 'common'
                ];
            } else {
                $enrichedSlots[] = null;
            }
        }
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'inventory_sync',
            'slots' => $enrichedSlots,
            'gems' => $inventory['gems'],
            'gold' => $inventory['gold'],
            'maxSlots' => self::MAX_INVENTORY_SLOTS
        ]);
    }
    
    /**
     * Synchroniser l'équipement avec le client
     */
    public function syncEquipment($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $equipment = $this->playerEquipment[$playerId] ?? null;
        if (!$equipment) return;
        
        // Enrichir les sorts équipés
        $enrichedSpells = [];
        foreach ($equipment['spells'] as $spellId) {
            if ($spellId) {
                $spellDef = $this->itemDefinitions[$spellId] ?? null;
                $enrichedSpells[] = $spellDef;
            } else {
                $enrichedSpells[] = null;
            }
        }
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'equipment_sync',
            'spells' => $enrichedSpells,
            'armor' => $equipment['armor'] ? $this->itemDefinitions[$equipment['armor']] : null,
            'accessory' => $equipment['accessory'] ? $this->itemDefinitions[$equipment['accessory']] : null
        ]);
    }
    
    /**
     * Obtenir la définition d'un item
     */
    public function getItemDefinition($itemId)
    {
        return $this->itemDefinitions[$itemId] ?? null;
    }
    
    /**
     * Obtenir toutes les définitions
     */
    public function getAllItemDefinitions()
    {
        return $this->itemDefinitions;
    }
    
    /**
     * Ajouter des gemmes
     */
    public function addGems($playerId, $amount)
    {
        if (!isset($this->playerInventories[$playerId])) {
            $this->initPlayer($playerId);
        }
        $this->playerInventories[$playerId]['gems'] += $amount;
        $this->syncInventory($playerId);
    }
    
    /**
     * Retirer des gemmes
     */
    public function removeGems($playerId, $amount)
    {
        if (!isset($this->playerInventories[$playerId])) return false;
        if ($this->playerInventories[$playerId]['gems'] < $amount) return false;
        
        $this->playerInventories[$playerId]['gems'] -= $amount;
        $this->syncInventory($playerId);
        return true;
    }
    
    /**
     * Nettoyage à la déconnexion
     */
    public function onPlayerDisconnect($playerId)
    {
        // Sauvegarder avant de nettoyer si nécessaire
        // (ici on garde en mémoire, en prod il faudrait sauvegarder en DB)
        unset($this->playerCooldowns[$playerId]);
    }
}
