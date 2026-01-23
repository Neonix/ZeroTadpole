<?php
/**
 * ZeroTadpole - Talent System v1.0
 * Arbre de compétences passives avec branches spécialisées
 */
namespace Server;

class TalentSystem
{
    private $worldServer;
    private $playerTalents = [];  // playerId => talent data
    
    // Définition des arbres de talents
    private $talentTrees = [
        'combat' => [
            'name' => '⚔️ Combat',
            'description' => 'Augmente vos capacités offensives',
            'talents' => [
                'power_strike' => [
                    'id' => 'power_strike',
                    'name' => 'Frappe Puissante',
                    'icon' => '💪',
                    'description' => '+{value}% dégâts de base',
                    'maxRank' => 5,
                    'valuePerRank' => 4,
                    'requires' => [],
                    'row' => 1
                ],
                'critical_hit' => [
                    'id' => 'critical_hit',
                    'name' => 'Coup Critique',
                    'icon' => '🎯',
                    'description' => '+{value}% chance de critique',
                    'maxRank' => 5,
                    'valuePerRank' => 2,
                    'requires' => ['power_strike' => 3],
                    'row' => 2
                ],
                'critical_damage' => [
                    'id' => 'critical_damage',
                    'name' => 'Dégâts Critiques',
                    'icon' => '💥',
                    'description' => '+{value}% dégâts critiques',
                    'maxRank' => 5,
                    'valuePerRank' => 10,
                    'requires' => ['critical_hit' => 2],
                    'row' => 3
                ],
                'attack_speed' => [
                    'id' => 'attack_speed',
                    'name' => 'Vitesse d\'Attaque',
                    'icon' => '⚡',
                    'description' => '+{value}% vitesse d\'attaque',
                    'maxRank' => 5,
                    'valuePerRank' => 3,
                    'requires' => ['power_strike' => 3],
                    'row' => 2
                ],
                'berserker' => [
                    'id' => 'berserker',
                    'name' => 'Berserker',
                    'icon' => '🔥',
                    'description' => '+{value}% dégâts quand HP < 30%',
                    'maxRank' => 3,
                    'valuePerRank' => 15,
                    'requires' => ['critical_damage' => 3, 'attack_speed' => 3],
                    'row' => 4
                ],
                'execute' => [
                    'id' => 'execute',
                    'name' => 'Exécution',
                    'icon' => '☠️',
                    'description' => '+{value}% dégâts sur cibles < 20% HP',
                    'maxRank' => 3,
                    'valuePerRank' => 20,
                    'requires' => ['berserker' => 1],
                    'row' => 5
                ]
            ]
        ],
        'defense' => [
            'name' => '🛡️ Défense',
            'description' => 'Augmente votre survie',
            'talents' => [
                'thick_skin' => [
                    'id' => 'thick_skin',
                    'name' => 'Peau Épaisse',
                    'icon' => '🧱',
                    'description' => '+{value}% HP max',
                    'maxRank' => 5,
                    'valuePerRank' => 5,
                    'requires' => [],
                    'row' => 1
                ],
                'armor_mastery' => [
                    'id' => 'armor_mastery',
                    'name' => 'Maîtrise Armure',
                    'icon' => '🛡️',
                    'description' => '+{value}% défense',
                    'maxRank' => 5,
                    'valuePerRank' => 4,
                    'requires' => ['thick_skin' => 3],
                    'row' => 2
                ],
                'regeneration' => [
                    'id' => 'regeneration',
                    'name' => 'Régénération',
                    'icon' => '💚',
                    'description' => '+{value} HP/sec',
                    'maxRank' => 5,
                    'valuePerRank' => 1,
                    'requires' => ['thick_skin' => 3],
                    'row' => 2
                ],
                'shield_wall' => [
                    'id' => 'shield_wall',
                    'name' => 'Mur de Boucliers',
                    'icon' => '🏰',
                    'description' => '{value}% chance bloquer attaque',
                    'maxRank' => 5,
                    'valuePerRank' => 3,
                    'requires' => ['armor_mastery' => 3],
                    'row' => 3
                ],
                'last_stand' => [
                    'id' => 'last_stand',
                    'name' => 'Dernier Rempart',
                    'icon' => '⭐',
                    'description' => 'Survit à un coup mortel ({value}s CD)',
                    'maxRank' => 3,
                    'valuePerRank' => -20, // Reduce cooldown
                    'baseValue' => 120,
                    'requires' => ['shield_wall' => 3, 'regeneration' => 3],
                    'row' => 4
                ],
                'fortress' => [
                    'id' => 'fortress',
                    'name' => 'Forteresse',
                    'icon' => '🏯',
                    'description' => '-{value}% dégâts reçus',
                    'maxRank' => 3,
                    'valuePerRank' => 5,
                    'requires' => ['last_stand' => 1],
                    'row' => 5
                ]
            ]
        ],
        'magic' => [
            'name' => '✨ Magie',
            'description' => 'Améliore vos sorts',
            'talents' => [
                'mana_pool' => [
                    'id' => 'mana_pool',
                    'name' => 'Réserve de Mana',
                    'icon' => '🔵',
                    'description' => '+{value}% mana max',
                    'maxRank' => 5,
                    'valuePerRank' => 6,
                    'requires' => [],
                    'row' => 1
                ],
                'spell_power' => [
                    'id' => 'spell_power',
                    'name' => 'Puissance Magique',
                    'icon' => '🔮',
                    'description' => '+{value}% dégâts sorts',
                    'maxRank' => 5,
                    'valuePerRank' => 5,
                    'requires' => ['mana_pool' => 3],
                    'row' => 2
                ],
                'cooldown_reduction' => [
                    'id' => 'cooldown_reduction',
                    'name' => 'Réduction Cooldown',
                    'icon' => '⏱️',
                    'description' => '-{value}% cooldown sorts',
                    'maxRank' => 5,
                    'valuePerRank' => 3,
                    'requires' => ['mana_pool' => 3],
                    'row' => 2
                ],
                'elemental_mastery' => [
                    'id' => 'elemental_mastery',
                    'name' => 'Maîtrise Élémentaire',
                    'icon' => '🌀',
                    'description' => '+{value}% dégâts élémentaires',
                    'maxRank' => 5,
                    'valuePerRank' => 6,
                    'requires' => ['spell_power' => 3],
                    'row' => 3
                ],
                'arcane_surge' => [
                    'id' => 'arcane_surge',
                    'name' => 'Surge Arcanique',
                    'icon' => '⚡',
                    'description' => '{value}% chance double cast',
                    'maxRank' => 3,
                    'valuePerRank' => 5,
                    'requires' => ['elemental_mastery' => 3, 'cooldown_reduction' => 3],
                    'row' => 4
                ],
                'archmage' => [
                    'id' => 'archmage',
                    'name' => 'Archimage',
                    'icon' => '🧙',
                    'description' => 'Sorts +{value}% portée et taille',
                    'maxRank' => 3,
                    'valuePerRank' => 10,
                    'requires' => ['arcane_surge' => 1],
                    'row' => 5
                ]
            ]
        ],
        'utility' => [
            'name' => '🎒 Utilitaire',
            'description' => 'Bonus variés',
            'talents' => [
                'swift_movement' => [
                    'id' => 'swift_movement',
                    'name' => 'Mouvement Rapide',
                    'icon' => '🏃',
                    'description' => '+{value}% vitesse déplacement',
                    'maxRank' => 5,
                    'valuePerRank' => 3,
                    'requires' => [],
                    'row' => 1
                ],
                'treasure_hunter' => [
                    'id' => 'treasure_hunter',
                    'name' => 'Chasseur de Trésors',
                    'icon' => '💎',
                    'description' => '+{value}% drop rate',
                    'maxRank' => 5,
                    'valuePerRank' => 5,
                    'requires' => ['swift_movement' => 3],
                    'row' => 2
                ],
                'experience_boost' => [
                    'id' => 'experience_boost',
                    'name' => 'Boost XP',
                    'icon' => '📚',
                    'description' => '+{value}% XP gagnée',
                    'maxRank' => 5,
                    'valuePerRank' => 4,
                    'requires' => ['swift_movement' => 3],
                    'row' => 2
                ],
                'merchant' => [
                    'id' => 'merchant',
                    'name' => 'Marchand',
                    'icon' => '💰',
                    'description' => '+{value}% or des mobs',
                    'maxRank' => 5,
                    'valuePerRank' => 6,
                    'requires' => ['treasure_hunter' => 3],
                    'row' => 3
                ],
                'lucky' => [
                    'id' => 'lucky',
                    'name' => 'Chanceux',
                    'icon' => '🍀',
                    'description' => '+{value}% toutes les chances',
                    'maxRank' => 3,
                    'valuePerRank' => 3,
                    'requires' => ['merchant' => 3, 'experience_boost' => 3],
                    'row' => 4
                ],
                'master_explorer' => [
                    'id' => 'master_explorer',
                    'name' => 'Maître Explorateur',
                    'icon' => '🗺️',
                    'description' => 'Révèle mini-map +{value}%',
                    'maxRank' => 3,
                    'valuePerRank' => 25,
                    'requires' => ['lucky' => 1],
                    'row' => 5
                ]
            ]
        ]
    ];
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Initialise les talents d'un joueur
     */
    public function initPlayer($playerId)
    {
        $this->playerTalents[$playerId] = [
            'points' => 0,
            'totalSpent' => 0,
            'trees' => [
                'combat' => [],
                'defense' => [],
                'magic' => [],
                'utility' => []
            ],
            'bonuses' => $this->getEmptyBonuses()
        ];
    }
    
    private function getEmptyBonuses()
    {
        return [
            'damage_percent' => 0,
            'critical_chance' => 0,
            'critical_damage' => 0,
            'attack_speed' => 0,
            'hp_percent' => 0,
            'defense_percent' => 0,
            'hp_regen' => 0,
            'block_chance' => 0,
            'damage_reduction' => 0,
            'mana_percent' => 0,
            'spell_power' => 0,
            'cooldown_reduction' => 0,
            'double_cast_chance' => 0,
            'spell_range' => 0,
            'movement_speed' => 0,
            'drop_rate' => 0,
            'xp_bonus' => 0,
            'gold_bonus' => 0,
            'luck' => 0,
            'map_reveal' => 0,
            'low_hp_damage' => 0,      // Berserker
            'execute_damage' => 0,     // Execute
            'last_stand_cd' => 120     // Last Stand cooldown
        ];
    }
    
    /**
     * Ajoute des points de talent (appelé au level up)
     */
    public function addTalentPoints($playerId, $points = 1)
    {
        if (!isset($this->playerTalents[$playerId])) {
            $this->initPlayer($playerId);
        }
        
        $this->playerTalents[$playerId]['points'] += $points;
        $this->syncTalents($playerId);
        
        return $this->playerTalents[$playerId]['points'];
    }
    
    /**
     * Dépense un point de talent
     */
    public function learnTalent($playerId, $treeName, $talentId)
    {
        if (!isset($this->playerTalents[$playerId])) {
            return ['success' => false, 'error' => 'Joueur non initialisé'];
        }
        
        $playerData = &$this->playerTalents[$playerId];
        
        // Vérifier les points disponibles
        if ($playerData['points'] <= 0) {
            return ['success' => false, 'error' => 'Pas de points disponibles'];
        }
        
        // Vérifier que l'arbre existe
        if (!isset($this->talentTrees[$treeName])) {
            return ['success' => false, 'error' => 'Arbre inconnu'];
        }
        
        // Vérifier que le talent existe
        $tree = $this->talentTrees[$treeName];
        if (!isset($tree['talents'][$talentId])) {
            return ['success' => false, 'error' => 'Talent inconnu'];
        }
        
        $talent = $tree['talents'][$talentId];
        $currentRank = $playerData['trees'][$treeName][$talentId] ?? 0;
        
        // Vérifier le rang max
        if ($currentRank >= $talent['maxRank']) {
            return ['success' => false, 'error' => 'Talent au maximum'];
        }
        
        // Vérifier les prérequis
        foreach ($talent['requires'] as $reqTalent => $reqRank) {
            $currentReqRank = $playerData['trees'][$treeName][$reqTalent] ?? 0;
            if ($currentReqRank < $reqRank) {
                return ['success' => false, 'error' => 'Prérequis non remplis'];
            }
        }
        
        // Apprendre le talent
        $playerData['trees'][$treeName][$talentId] = $currentRank + 1;
        $playerData['points']--;
        $playerData['totalSpent']++;
        
        // Recalculer les bonus
        $this->recalculateBonuses($playerId);
        
        // Synchroniser avec le client
        $this->syncTalents($playerId);
        
        return [
            'success' => true,
            'talent' => $talentId,
            'newRank' => $currentRank + 1,
            'remainingPoints' => $playerData['points']
        ];
    }
    
    /**
     * Reset tous les talents d'un joueur
     */
    public function resetTalents($playerId, $cost = 100)
    {
        if (!isset($this->playerTalents[$playerId])) {
            return ['success' => false, 'error' => 'Joueur non initialisé'];
        }
        
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) {
            return ['success' => false, 'error' => 'Joueur introuvable'];
        }
        
        // Vérifier le coût (en gems)
        $inventory = $this->worldServer->inventoryManager;
        if ($inventory && !$inventory->removeGems($playerId, $cost)) {
            return ['success' => false, 'error' => "Besoin de $cost gems"];
        }
        
        // Reset
        $totalSpent = $this->playerTalents[$playerId]['totalSpent'];
        $this->playerTalents[$playerId] = [
            'points' => $totalSpent,
            'totalSpent' => 0,
            'trees' => [
                'combat' => [],
                'defense' => [],
                'magic' => [],
                'utility' => []
            ],
            'bonuses' => $this->getEmptyBonuses()
        ];
        
        $this->syncTalents($playerId);
        
        return ['success' => true, 'pointsRestored' => $totalSpent];
    }
    
    /**
     * Recalcule tous les bonus du joueur
     */
    private function recalculateBonuses($playerId)
    {
        if (!isset($this->playerTalents[$playerId])) return;
        
        $bonuses = $this->getEmptyBonuses();
        $playerData = $this->playerTalents[$playerId];
        
        foreach ($playerData['trees'] as $treeName => $talents) {
            foreach ($talents as $talentId => $rank) {
                if ($rank <= 0) continue;
                
                $talentDef = $this->talentTrees[$treeName]['talents'][$talentId] ?? null;
                if (!$talentDef) continue;
                
                $value = $rank * $talentDef['valuePerRank'];
                if (isset($talentDef['baseValue'])) {
                    $value = $talentDef['baseValue'] + $value;
                }
                
                // Appliquer selon le talent
                switch ($talentId) {
                    // Combat
                    case 'power_strike': $bonuses['damage_percent'] += $value; break;
                    case 'critical_hit': $bonuses['critical_chance'] += $value; break;
                    case 'critical_damage': $bonuses['critical_damage'] += $value; break;
                    case 'attack_speed': $bonuses['attack_speed'] += $value; break;
                    case 'berserker': $bonuses['low_hp_damage'] += $value; break;
                    case 'execute': $bonuses['execute_damage'] += $value; break;
                    
                    // Defense
                    case 'thick_skin': $bonuses['hp_percent'] += $value; break;
                    case 'armor_mastery': $bonuses['defense_percent'] += $value; break;
                    case 'regeneration': $bonuses['hp_regen'] += $value; break;
                    case 'shield_wall': $bonuses['block_chance'] += $value; break;
                    case 'last_stand': $bonuses['last_stand_cd'] = $value; break;
                    case 'fortress': $bonuses['damage_reduction'] += $value; break;
                    
                    // Magic
                    case 'mana_pool': $bonuses['mana_percent'] += $value; break;
                    case 'spell_power': $bonuses['spell_power'] += $value; break;
                    case 'cooldown_reduction': $bonuses['cooldown_reduction'] += $value; break;
                    case 'elemental_mastery': $bonuses['spell_power'] += $value; break;
                    case 'arcane_surge': $bonuses['double_cast_chance'] += $value; break;
                    case 'archmage': $bonuses['spell_range'] += $value; break;
                    
                    // Utility
                    case 'swift_movement': $bonuses['movement_speed'] += $value; break;
                    case 'treasure_hunter': $bonuses['drop_rate'] += $value; break;
                    case 'experience_boost': $bonuses['xp_bonus'] += $value; break;
                    case 'merchant': $bonuses['gold_bonus'] += $value; break;
                    case 'lucky': $bonuses['luck'] += $value; break;
                    case 'master_explorer': $bonuses['map_reveal'] += $value; break;
                }
            }
        }
        
        $this->playerTalents[$playerId]['bonuses'] = $bonuses;
    }
    
    /**
     * Obtient un bonus spécifique
     */
    public function getBonus($playerId, $bonusName)
    {
        return $this->playerTalents[$playerId]['bonuses'][$bonusName] ?? 0;
    }
    
    /**
     * Obtient tous les bonus
     */
    public function getAllBonuses($playerId)
    {
        return $this->playerTalents[$playerId]['bonuses'] ?? $this->getEmptyBonuses();
    }
    
    /**
     * Synchronise les talents avec le client
     */
    public function syncTalents($playerId)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if (!$player) return;
        
        $data = $this->playerTalents[$playerId] ?? null;
        if (!$data) return;
        
        $this->worldServer->pushToPlayer($player, [
            'type' => 'talents_sync',
            'points' => $data['points'],
            'totalSpent' => $data['totalSpent'],
            'trees' => $data['trees'],
            'bonuses' => $data['bonuses'],
            'definitions' => $this->talentTrees
        ]);
    }
    
    /**
     * Appelé quand le joueur se déconnecte
     */
    public function onPlayerDisconnect($playerId)
    {
        // Sauvegarder en DB si nécessaire
        unset($this->playerTalents[$playerId]);
    }
    
    /**
     * Obtient les données de talent pour sauvegarde
     */
    public function getPlayerTalentData($playerId)
    {
        return $this->playerTalents[$playerId] ?? null;
    }
    
    /**
     * Charge les données de talent
     */
    public function loadPlayerTalentData($playerId, $data)
    {
        if ($data) {
            $this->playerTalents[$playerId] = $data;
            $this->recalculateBonuses($playerId);
        } else {
            $this->initPlayer($playerId);
        }
    }
}
