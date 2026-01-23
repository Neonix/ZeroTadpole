<?php
/**
 * QuestSystem - Système de quêtes progressives 100% côté serveur
 * 
 * Gère:
 * - Définition des quêtes avec prérequis
 * - Progression et objectifs multiples
 * - Récompenses (XP, gemmes, items)
 * - Persistance des états
 * - Synchronisation avec les clients
 */
namespace Server;

class QuestSystem
{
    // Instance unique (singleton)
    private static $instance = null;
    
    // Quêtes par joueur: [playerId => [questId => QuestState]]
    private $playerQuests = [];
    
    // Progression globale par joueur: [playerId => ['completedQuests' => [], 'level' => 1, 'xp' => 0]]
    private $playerProgress = [];
    
    // Référence au serveur monde
    private $worldServer;
    
    // ============================================
    // DÉFINITIONS DES QUÊTES PROGRESSIVES
    // ============================================
    
    /**
     * Retourne toutes les définitions de quêtes
     * Ordre: tutoriel simple → progression → endgame
     */
    public function getQuestDefinitions()
    {
        return [
            // ========== CHAPITRE 1: TUTORIEL (Zone Safe) ==========
            
            'tuto_move' => [
                'id' => 'tuto_move',
                'chapter' => 1,
                'name' => 'Premiers Pas',
                'description' => 'Apprends à te déplacer dans l\'océan.',
                'icon' => '🏊',
                'type' => 'tutorial',
                'zone' => 'tutorial',
                'autoStart' => true,  // Démarre automatiquement
                'objectives' => [
                    ['type' => 'move_distance', 'target' => 100, 'description' => 'Parcours 100 unités']
                ],
                'rewards' => ['xp' => 5],
                'nextQuest' => 'tuto_bubble',
                'tips' => ['Utilise les flèches ou clique pour te déplacer', 'Tu es en zone sûre ici']
            ],
            
            'tuto_bubble' => [
                'id' => 'tuto_bubble',
                'chapter' => 1,
                'name' => 'Entraînement au Combat',
                'description' => 'Attaque les bulles d\'entraînement pour apprendre à combattre.',
                'icon' => '🫧',
                'type' => 'tutorial',
                'zone' => 'tutorial',
                'requires' => ['tuto_move'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'training_bubble', 'target' => 3, 'description' => 'Éclate 3 bulles']
                ],
                'rewards' => ['xp' => 10, 'gems' => 2],
                'nextQuest' => 'tuto_fish',
                'tips' => ['Clique sur les bulles pour les attaquer', 'Les bulles ne font pas de dégâts']
            ],
            
            'tuto_fish' => [
                'id' => 'tuto_fish',
                'chapter' => 1,
                'name' => 'Poissons Amicaux',
                'description' => 'Les poissons amis laissent parfois des objets utiles.',
                'icon' => '🐠',
                'type' => 'tutorial',
                'zone' => 'tutorial',
                'requires' => ['tuto_bubble'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'friendly_fish', 'target' => 2, 'description' => 'Attrape 2 poissons amis'],
                    ['type' => 'collect_loot', 'target' => 1, 'description' => 'Ramasse 1 objet']
                ],
                'rewards' => ['xp' => 15, 'gems' => 3, 'item' => 'potion_health'],
                'nextQuest' => 'tuto_npc',
                'tips' => ['Les loots apparaissent quand tu élimines des créatures', 'Passe dessus pour les ramasser']
            ],
            
            'tuto_npc' => [
                'id' => 'tuto_npc',
                'chapter' => 1,
                'name' => 'Rencontre avec Sage Ovule',
                'description' => 'Parle au Sage Ovule près du centre.',
                'icon' => '🥚',
                'type' => 'tutorial',
                'zone' => 'tutorial',
                'requires' => ['tuto_fish'],
                'objectives' => [
                    ['type' => 'talk_npc', 'npcId' => 'npc-guide', 'target' => 1, 'description' => 'Parle au Sage Ovule']
                ],
                'rewards' => ['xp' => 10, 'gems' => 5],
                'nextQuest' => 'tuto_complete',
                'tips' => ['Le Sage Ovule est au centre de la zone tutoriel']
            ],
            
            'tuto_complete' => [
                'id' => 'tuto_complete',
                'chapter' => 1,
                'name' => 'Tutoriel Terminé!',
                'description' => 'Tu es prêt à explorer les eaux plus profondes.',
                'icon' => '🎓',
                'type' => 'milestone',
                'zone' => 'tutorial',
                'requires' => ['tuto_npc'],
                'objectives' => [
                    ['type' => 'leave_zone', 'fromZone' => 'tutorial', 'target' => 1, 'description' => 'Quitte la zone tutoriel']
                ],
                'rewards' => ['xp' => 25, 'gems' => 10, 'title' => 'Explorateur Novice'],
                'nextQuest' => 'trans_first_crab',
                'tips' => ['Éloigne-toi du centre pour entrer dans les eaux peu profondes', 'Attention, les créatures peuvent attaquer là-bas!']
            ],
            
            // ========== CHAPITRE 2: TRANSITION (Eaux peu profondes) ==========
            
            'trans_first_crab' => [
                'id' => 'trans_first_crab',
                'chapter' => 2,
                'name' => 'Premier Vrai Combat',
                'description' => 'Affronte ton premier véritable adversaire.',
                'icon' => '🦀',
                'type' => 'combat',
                'zone' => 'transition',
                'requires' => ['tuto_complete'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'baby_crab', 'target' => 1, 'description' => 'Vaincs un bébé crabe']
                ],
                'rewards' => ['xp' => 20, 'gems' => 5],
                'nextQuest' => 'trans_hunter',
                'tips' => ['Les bébés crabes font peu de dégâts mais peuvent attaquer', 'Retourne en zone safe si ta vie est basse']
            ],
            
            'trans_hunter' => [
                'id' => 'trans_hunter',
                'chapter' => 2,
                'name' => 'Chasseur en Herbe',
                'description' => 'Élimine plusieurs créatures des eaux peu profondes.',
                'icon' => '🎯',
                'type' => 'combat',
                'zone' => 'transition',
                'requires' => ['trans_first_crab'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'bubble_fish', 'target' => 3, 'description' => 'Élimine 3 poissons bulles'],
                    ['type' => 'kill_mob', 'mobType' => 'baby_crab', 'target' => 2, 'description' => 'Élimine 2 bébés crabes']
                ],
                'rewards' => ['xp' => 40, 'gems' => 8, 'item' => 'spell_bubble'],
                'nextQuest' => 'trans_survivor',
                'tips' => ['Gère bien ta vie et retourne te soigner si nécessaire']
            ],
            
            'trans_survivor' => [
                'id' => 'trans_survivor',
                'chapter' => 2,
                'name' => 'Survivant',
                'description' => 'Prouve ta capacité à survivre dans les eaux dangereuses.',
                'icon' => '💪',
                'type' => 'challenge',
                'zone' => 'transition',
                'requires' => ['trans_hunter'],
                'objectives' => [
                    ['type' => 'survive_time', 'zone' => 'transition', 'target' => 60, 'description' => 'Survie 60 secondes hors zone safe'],
                    ['type' => 'kill_any', 'target' => 5, 'description' => 'Élimine 5 créatures']
                ],
                'rewards' => ['xp' => 60, 'gems' => 15, 'item' => 'potion_health'],
                'nextQuest' => 'trans_complete',
                'tips' => ['Le timer ne compte que quand tu es hors de la zone tutoriel']
            ],
            
            'trans_complete' => [
                'id' => 'trans_complete',
                'chapter' => 2,
                'name' => 'Maître des Eaux Peu Profondes',
                'description' => 'Tu as conquis les eaux de transition!',
                'icon' => '🌊',
                'type' => 'milestone',
                'zone' => 'transition',
                'requires' => ['trans_survivor'],
                'objectives' => [
                    ['type' => 'reach_zone', 'zone' => 'normal', 'target' => 1, 'description' => 'Entre dans les eaux normales']
                ],
                'rewards' => ['xp' => 80, 'gems' => 20, 'title' => 'Nageur Aguerri'],
                'nextQuest' => 'normal_crabs',
                'tips' => ['Les eaux normales sont plus dangereuses!', 'Assure-toi d\'avoir des potions']
            ],
            
            // ========== CHAPITRE 3: NORMAL (Eaux normales) ==========
            
            'normal_crabs' => [
                'id' => 'normal_crabs',
                'chapter' => 3,
                'name' => 'Invasion de Crabes',
                'description' => 'Les crabes des eaux normales sont bien plus coriaces.',
                'icon' => '🦀',
                'type' => 'combat',
                'zone' => 'normal',
                'requires' => ['trans_complete'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'crab_small', 'target' => 5, 'description' => 'Élimine 5 petits crabes']
                ],
                'rewards' => ['xp' => 75, 'gems' => 12],
                'nextQuest' => 'normal_jellyfish'
            ],
            
            'normal_jellyfish' => [
                'id' => 'normal_jellyfish',
                'chapter' => 3,
                'name' => 'Méduses Électriques',
                'description' => 'Les méduses sont lentes mais dangereuses.',
                'icon' => '🪼',
                'type' => 'combat',
                'zone' => 'normal',
                'requires' => ['normal_crabs'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'jellyfish', 'target' => 3, 'description' => 'Élimine 3 méduses']
                ],
                'rewards' => ['xp' => 90, 'gems' => 15, 'item' => 'spell_wave'],
                'nextQuest' => 'normal_giant'
            ],
            
            'normal_giant' => [
                'id' => 'normal_giant',
                'chapter' => 3,
                'name' => 'Le Crabe Géant',
                'description' => 'Un crabe géant terrorise ces eaux.',
                'icon' => '🦞',
                'type' => 'boss',
                'zone' => 'normal',
                'requires' => ['normal_jellyfish'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'crab_giant', 'target' => 1, 'description' => 'Vaincs le Crabe Géant']
                ],
                'rewards' => ['xp' => 150, 'gems' => 25, 'item' => 'shield_bubble'],
                'nextQuest' => 'normal_complete'
            ],
            
            'normal_complete' => [
                'id' => 'normal_complete',
                'chapter' => 3,
                'name' => 'Conquérant des Eaux',
                'description' => 'Tu as prouvé ta valeur dans les eaux normales.',
                'icon' => '🏆',
                'type' => 'milestone',
                'zone' => 'normal',
                'requires' => ['normal_giant'],
                'objectives' => [
                    ['type' => 'total_kills', 'target' => 25, 'description' => 'Élimine 25 créatures au total']
                ],
                'rewards' => ['xp' => 200, 'gems' => 30, 'title' => 'Guerrier des Profondeurs'],
                'nextQuest' => 'danger_eel'
            ],
            
            // ========== CHAPITRE 4: DANGER (Abysses) ==========
            
            'danger_eel' => [
                'id' => 'danger_eel',
                'chapter' => 4,
                'name' => 'Anguilles Électriques',
                'description' => 'Les anguilles des abysses sont rapides et mortelles.',
                'icon' => '⚡',
                'type' => 'elite',
                'zone' => 'danger',
                'requires' => ['normal_complete'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'electric_eel', 'target' => 3, 'description' => 'Élimine 3 anguilles électriques']
                ],
                'rewards' => ['xp' => 180, 'gems' => 30, 'item' => 'spell_lightning'],
                'nextQuest' => 'danger_shark'
            ],
            
            'danger_shark' => [
                'id' => 'danger_shark',
                'chapter' => 4,
                'name' => 'Requins Juvéniles',
                'description' => 'Les requins sont les prédateurs les plus redoutés.',
                'icon' => '🦈',
                'type' => 'elite',
                'zone' => 'danger',
                'requires' => ['danger_eel'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'shark_mini', 'target' => 2, 'description' => 'Élimine 2 requins juvéniles']
                ],
                'rewards' => ['xp' => 250, 'gems' => 40, 'item' => 'potion_health_large'],
                'nextQuest' => 'danger_manta'
            ],
            
            'danger_manta' => [
                'id' => 'danger_manta',
                'chapter' => 4,
                'name' => 'Raie Manta Sombre',
                'description' => 'Une créature majestueuse mais mortelle.',
                'icon' => '🐋',
                'type' => 'elite',
                'zone' => 'danger',
                'requires' => ['danger_shark'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'manta_ray', 'target' => 1, 'description' => 'Vaincs la Raie Manta']
                ],
                'rewards' => ['xp' => 200, 'gems' => 35, 'item' => 'spell_vortex'],
                'nextQuest' => 'danger_octopus'
            ],
            
            'danger_octopus' => [
                'id' => 'danger_octopus',
                'chapter' => 4,
                'name' => 'Le Poulpe Ancien',
                'description' => 'Un boss légendaire des profondeurs.',
                'icon' => '🐙',
                'type' => 'boss',
                'zone' => 'danger',
                'requires' => ['danger_manta'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'octopus_boss', 'target' => 1, 'description' => 'Vaincs le Poulpe Ancien']
                ],
                'rewards' => ['xp' => 500, 'gems' => 75, 'item' => 'spell_heal', 'title' => 'Tueur de Boss'],
                'nextQuest' => 'danger_kraken'
            ],
            
            'danger_kraken' => [
                'id' => 'danger_kraken',
                'chapter' => 4,
                'name' => 'Le Kraken Primordial',
                'description' => 'Le boss ultime. Seuls les plus braves osent l\'affronter.',
                'icon' => '🦑',
                'type' => 'final_boss',
                'zone' => 'danger',
                'requires' => ['danger_octopus'],
                'objectives' => [
                    ['type' => 'kill_mob', 'mobType' => 'kraken', 'target' => 1, 'description' => 'Vaincs le Kraken Primordial']
                ],
                'rewards' => ['xp' => 1000, 'gems' => 150, 'title' => 'Légende de l\'Océan'],
                'nextQuest' => null
            ]
        ];
    }
    
    // ============================================
    // SINGLETON
    // ============================================
    
    private function __construct() {}
    
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function setWorldServer($server)
    {
        $this->worldServer = $server;
    }
    
    // ============================================
    // GESTION DES JOUEURS
    // ============================================
    
    /**
     * Initialise les quêtes pour un nouveau joueur
     */
    public function initPlayer($playerId)
    {
        if (!isset($this->playerQuests[$playerId])) {
            $this->playerQuests[$playerId] = [];
        }
        
        if (!isset($this->playerProgress[$playerId])) {
            $this->playerProgress[$playerId] = [
                'completedQuests' => [],
                'level' => 1,
                'xp' => 0,
                'totalXp' => 0,
                'gems' => 0,
                'titles' => [],
                'totalKills' => 0,
                'totalLoot' => 0,
                'timeInZones' => [
                    'tutorial' => 0,
                    'transition' => 0,
                    'normal' => 0,
                    'danger' => 0
                ],
                'distanceTraveled' => 0,
                'lastPosition' => null,
                'surviveStartTime' => null,
                'currentSurviveZone' => null
            ];
        }
        
        // Démarrer automatiquement la première quête
        $this->tryAutoStartQuests($playerId);
    }
    
    /**
     * Nettoie les données d'un joueur déconnecté
     */
    public function cleanupPlayer($playerId)
    {
        // On garde les données en mémoire pour cette session
        // Dans une vraie implémentation, on sauvegarderait en DB ici
    }
    
    /**
     * Démarre automatiquement les quêtes qui ont autoStart
     */
    private function tryAutoStartQuests($playerId)
    {
        $definitions = $this->getQuestDefinitions();
        
        foreach ($definitions as $questId => $quest) {
            if (!empty($quest['autoStart'])) {
                if ($this->canStartQuest($playerId, $questId)) {
                    $this->startQuest($playerId, $questId);
                }
            }
        }
    }
    
    // ============================================
    // VÉRIFICATIONS
    // ============================================
    
    /**
     * Vérifie si un joueur peut commencer une quête
     */
    public function canStartQuest($playerId, $questId)
    {
        $definitions = $this->getQuestDefinitions();
        
        if (!isset($definitions[$questId])) {
            return false;
        }
        
        $quest = $definitions[$questId];
        $progress = $this->playerProgress[$playerId] ?? null;
        
        if (!$progress) return false;
        
        // Déjà complétée?
        if (in_array($questId, $progress['completedQuests'])) {
            return false;
        }
        
        // Déjà en cours?
        if (isset($this->playerQuests[$playerId][$questId])) {
            return false;
        }
        
        // Prérequis satisfaits?
        if (!empty($quest['requires'])) {
            foreach ($quest['requires'] as $reqId) {
                if (!in_array($reqId, $progress['completedQuests'])) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Vérifie si une quête est complétée
     */
    public function isQuestComplete($playerId, $questId)
    {
        $state = $this->playerQuests[$playerId][$questId] ?? null;
        if (!$state) return false;
        
        foreach ($state['objectives'] as $obj) {
            if ($obj['current'] < $obj['target']) {
                return false;
            }
        }
        
        return true;
    }
    
    // ============================================
    // ACTIONS DE QUÊTE
    // ============================================
    
    /**
     * Démarre une quête pour un joueur
     */
    public function startQuest($playerId, $questId)
    {
        if (!$this->canStartQuest($playerId, $questId)) {
            return false;
        }
        
        $definitions = $this->getQuestDefinitions();
        $quest = $definitions[$questId];
        
        // Créer l'état de la quête
        $state = [
            'id' => $questId,
            'startedAt' => microtime(true),
            'objectives' => []
        ];
        
        foreach ($quest['objectives'] as $obj) {
            $state['objectives'][] = [
                'type' => $obj['type'],
                'target' => $obj['target'],
                'current' => 0,
                'description' => $obj['description'],
                'mobType' => $obj['mobType'] ?? null,
                'zone' => $obj['zone'] ?? null,
                'npcId' => $obj['npcId'] ?? null,
                'fromZone' => $obj['fromZone'] ?? null
            ];
        }
        
        $this->playerQuests[$playerId][$questId] = $state;
        
        // Notifier le client
        $this->sendQuestUpdate($playerId, 'quest_started', $questId, $state);
        
        return true;
    }
    
    /**
     * Met à jour la progression d'un objectif
     */
    public function updateObjective($playerId, $questId, $objectiveIndex, $amount = 1)
    {
        if (!isset($this->playerQuests[$playerId][$questId])) {
            return false;
        }
        
        $state = &$this->playerQuests[$playerId][$questId];
        
        if (!isset($state['objectives'][$objectiveIndex])) {
            return false;
        }
        
        $obj = &$state['objectives'][$objectiveIndex];
        $obj['current'] = min($obj['target'], $obj['current'] + $amount);
        
        // Notifier le client de la progression
        $this->sendQuestUpdate($playerId, 'quest_progress', $questId, $state);
        
        // Vérifier si la quête est complète
        if ($this->isQuestComplete($playerId, $questId)) {
            $this->completeQuest($playerId, $questId);
        }
        
        return true;
    }
    
    /**
     * Complète une quête et donne les récompenses
     */
    public function completeQuest($playerId, $questId)
    {
        $definitions = $this->getQuestDefinitions();
        
        if (!isset($definitions[$questId])) {
            return false;
        }
        
        $quest = $definitions[$questId];
        $progress = &$this->playerProgress[$playerId];
        
        // Marquer comme complétée
        $progress['completedQuests'][] = $questId;
        
        // Donner les récompenses
        $rewards = $quest['rewards'] ?? [];
        
        if (isset($rewards['xp'])) {
            $this->giveXP($playerId, $rewards['xp']);
        }
        
        if (isset($rewards['gems'])) {
            $progress['gems'] += $rewards['gems'];
        }
        
        if (isset($rewards['title'])) {
            $progress['titles'][] = $rewards['title'];
        }
        
        // Retirer des quêtes actives
        unset($this->playerQuests[$playerId][$questId]);
        
        // Notifier le client
        $this->sendQuestUpdate($playerId, 'quest_complete', $questId, [
            'rewards' => $rewards,
            'nextQuest' => $quest['nextQuest'] ?? null
        ]);
        
        // Démarrer automatiquement la quête suivante si possible
        if (!empty($quest['nextQuest'])) {
            $this->tryAutoStartQuests($playerId);
            
            // Si pas autoStart, proposer la quête
            if ($this->canStartQuest($playerId, $quest['nextQuest'])) {
                $this->sendQuestUpdate($playerId, 'quest_available', $quest['nextQuest'], [
                    'quest' => $definitions[$quest['nextQuest']]
                ]);
            }
        }
        
        return true;
    }
    
    /**
     * Donne de l'XP et gère les level ups
     */
    private function giveXP($playerId, $amount)
    {
        $progress = &$this->playerProgress[$playerId];
        $progress['xp'] += $amount;
        $progress['totalXp'] += $amount;
        
        // Vérifier level up (XP requis: 100 * level^1.5)
        $xpForNextLevel = (int)(100 * pow($progress['level'], 1.5));
        
        while ($progress['xp'] >= $xpForNextLevel) {
            $progress['xp'] -= $xpForNextLevel;
            $progress['level']++;
            
            // Notifier du level up
            $this->sendToPlayer($playerId, [
                'type' => 'level_up',
                'level' => $progress['level'],
                'xp' => $progress['xp'],
                'nextLevelXp' => (int)(100 * pow($progress['level'], 1.5))
            ]);
            
            $xpForNextLevel = (int)(100 * pow($progress['level'], 1.5));
        }
    }
    
    // ============================================
    // ÉVÉNEMENTS DE JEU (appelés par WorldServer)
    // ============================================
    
    /**
     * Appelé quand un joueur tue un mob
     */
    public function onMobKill($playerId, $mobType, $mob)
    {
        $progress = &$this->playerProgress[$playerId];
        $progress['totalKills']++;
        
        // Mettre à jour toutes les quêtes actives du joueur
        foreach ($this->playerQuests[$playerId] ?? [] as $questId => &$state) {
            foreach ($state['objectives'] as $idx => &$obj) {
                // Kill spécifique
                if ($obj['type'] === 'kill_mob' && $obj['mobType'] === $mobType) {
                    $this->updateObjective($playerId, $questId, $idx, 1);
                }
                // Kill générique
                elseif ($obj['type'] === 'kill_any') {
                    $this->updateObjective($playerId, $questId, $idx, 1);
                }
                // Total kills
                elseif ($obj['type'] === 'total_kills') {
                    $obj['current'] = $progress['totalKills'];
                    if ($obj['current'] >= $obj['target']) {
                        $this->sendQuestUpdate($playerId, 'quest_progress', $questId, $state);
                        if ($this->isQuestComplete($playerId, $questId)) {
                            $this->completeQuest($playerId, $questId);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Appelé quand un joueur ramasse du loot
     */
    public function onLootCollect($playerId, $itemId)
    {
        $progress = &$this->playerProgress[$playerId];
        $progress['totalLoot']++;
        
        foreach ($this->playerQuests[$playerId] ?? [] as $questId => &$state) {
            foreach ($state['objectives'] as $idx => &$obj) {
                if ($obj['type'] === 'collect_loot') {
                    $this->updateObjective($playerId, $questId, $idx, 1);
                }
            }
        }
    }
    
    /**
     * Appelé quand un joueur parle à un NPC
     */
    public function onNPCTalk($playerId, $npcId)
    {
        foreach ($this->playerQuests[$playerId] ?? [] as $questId => &$state) {
            foreach ($state['objectives'] as $idx => &$obj) {
                if ($obj['type'] === 'talk_npc' && $obj['npcId'] === $npcId) {
                    $this->updateObjective($playerId, $questId, $idx, 1);
                }
            }
        }
    }
    
    /**
     * Appelé quand un joueur se déplace
     */
    public function onPlayerMove($playerId, $x, $y, $zone)
    {
        $progress = &$this->playerProgress[$playerId];
        
        // Calculer distance parcourue
        if ($progress['lastPosition']) {
            $dx = $x - $progress['lastPosition']['x'];
            $dy = $y - $progress['lastPosition']['y'];
            $dist = sqrt($dx * $dx + $dy * $dy);
            $progress['distanceTraveled'] += $dist;
            
            // Mise à jour des quêtes de déplacement
            foreach ($this->playerQuests[$playerId] ?? [] as $questId => &$state) {
                foreach ($state['objectives'] as $idx => &$obj) {
                    if ($obj['type'] === 'move_distance') {
                        $obj['current'] = (int)$progress['distanceTraveled'];
                        if ($obj['current'] >= $obj['target']) {
                            $this->sendQuestUpdate($playerId, 'quest_progress', $questId, $state);
                            if ($this->isQuestComplete($playerId, $questId)) {
                                $this->completeQuest($playerId, $questId);
                            }
                        }
                    }
                }
            }
        }
        
        $progress['lastPosition'] = ['x' => $x, 'y' => $y];
    }
    
    /**
     * Appelé quand un joueur change de zone
     */
    public function onZoneChange($playerId, $oldZone, $newZone)
    {
        foreach ($this->playerQuests[$playerId] ?? [] as $questId => &$state) {
            foreach ($state['objectives'] as $idx => &$obj) {
                // Quitter une zone
                if ($obj['type'] === 'leave_zone' && $obj['fromZone'] === $oldZone && $oldZone !== $newZone) {
                    $this->updateObjective($playerId, $questId, $idx, 1);
                }
                // Atteindre une zone
                elseif ($obj['type'] === 'reach_zone' && $obj['zone'] === $newZone) {
                    $this->updateObjective($playerId, $questId, $idx, 1);
                }
            }
        }
        
        // Gestion du timer de survie
        $progress = &$this->playerProgress[$playerId];
        
        // Si on entre dans une zone non-safe, démarrer le timer
        if ($newZone !== 'tutorial') {
            if (!$progress['surviveStartTime'] || $progress['currentSurviveZone'] !== $newZone) {
                $progress['surviveStartTime'] = microtime(true);
                $progress['currentSurviveZone'] = $newZone;
            }
        } else {
            // Réinitialiser si on retourne en zone safe
            $progress['surviveStartTime'] = null;
            $progress['currentSurviveZone'] = null;
        }
    }
    
    /**
     * Appelé périodiquement pour mettre à jour les timers de survie
     */
    public function updateSurviveTimers()
    {
        foreach ($this->playerProgress as $playerId => &$progress) {
            if (!$progress['surviveStartTime']) continue;
            
            $elapsed = microtime(true) - $progress['surviveStartTime'];
            
            foreach ($this->playerQuests[$playerId] ?? [] as $questId => &$state) {
                foreach ($state['objectives'] as $idx => &$obj) {
                    if ($obj['type'] === 'survive_time') {
                        // Vérifier que le joueur est dans la bonne zone
                        if (!$obj['zone'] || $obj['zone'] === $progress['currentSurviveZone']) {
                            $obj['current'] = (int)$elapsed;
                            
                            if ($obj['current'] >= $obj['target']) {
                                $this->sendQuestUpdate($playerId, 'quest_progress', $questId, $state);
                                if ($this->isQuestComplete($playerId, $questId)) {
                                    $this->completeQuest($playerId, $questId);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // ============================================
    // COMMUNICATION
    // ============================================
    
    /**
     * Envoie une mise à jour de quête au client
     */
    private function sendQuestUpdate($playerId, $action, $questId, $data)
    {
        $definitions = $this->getQuestDefinitions();
        $quest = $definitions[$questId] ?? null;
        
        $message = [
            'type' => 'quest_update',
            'action' => $action,
            'questId' => $questId,
            'quest' => $quest,
            'state' => $data,
            'tick' => $this->worldServer ? $this->worldServer->serverTick : 0,
            'time' => round(microtime(true) * 1000)
        ];
        
        $this->sendToPlayer($playerId, $message);
    }
    
    /**
     * Envoie un message à un joueur
     */
    private function sendToPlayer($playerId, $message)
    {
        if ($this->worldServer) {
            $player = $this->worldServer->getEntityById($playerId);
            if ($player) {
                $this->worldServer->pushToPlayer($player, $message);
            }
        }
    }
    
    /**
     * Envoie l'état complet des quêtes à un joueur
     */
    public function sendFullQuestState($playerId)
    {
        $definitions = $this->getQuestDefinitions();
        $progress = $this->playerProgress[$playerId] ?? null;
        $activeQuests = $this->playerQuests[$playerId] ?? [];
        
        // Quêtes disponibles
        $available = [];
        foreach ($definitions as $questId => $quest) {
            if ($this->canStartQuest($playerId, $questId)) {
                $available[$questId] = $quest;
            }
        }
        
        $message = [
            'type' => 'quest_full_state',
            'progress' => $progress,
            'activeQuests' => $activeQuests,
            'availableQuests' => $available,
            'completedQuests' => $progress ? $progress['completedQuests'] : [],
            'definitions' => $definitions,
            'tick' => $this->worldServer ? $this->worldServer->serverTick : 0
        ];
        
        $this->sendToPlayer($playerId, $message);
    }
    
    /**
     * Retourne la progression d'un joueur
     */
    public function getPlayerProgress($playerId)
    {
        return $this->playerProgress[$playerId] ?? null;
    }
    
    /**
     * Retourne les quêtes actives d'un joueur
     */
    public function getActiveQuests($playerId)
    {
        return $this->playerQuests[$playerId] ?? [];
    }
}
