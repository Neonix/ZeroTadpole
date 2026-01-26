<?php
/**
 * ZeroTadpole - Group/Party Manager v2.0
 * Système de groupes/équipes pour le jeu multijoueur
 */
namespace Server;

class GroupManager 
{
    private $worldServer;
    private $groups = [];
    private $playerGroups = []; // playerId => groupId
    private $invitations = [];  // playerId => [inviterId, groupId, expiresAt]
    private $groupIdCounter = 1;
    
    const MAX_GROUP_SIZE = 4;
    const INVITATION_TIMEOUT = 60; // seconds
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Créer un nouveau groupe
     */
    public function createGroup($leaderId, $name = null)
    {
        // Vérifier si le joueur est déjà dans un groupe
        if (isset($this->playerGroups[$leaderId])) {
            return ['success' => false, 'error' => 'Vous êtes déjà dans un groupe'];
        }
        
        $groupId = 'grp_' . $this->groupIdCounter++;
        $player = $this->worldServer->getEntityById($leaderId);
        $leaderName = $player ? $player->name : 'Joueur';
        
        $this->groups[$groupId] = [
            'id' => $groupId,
            'name' => $name ?: "Groupe de {$leaderName}",
            'leaderId' => $leaderId,
            'members' => [$leaderId],
            'createdAt' => microtime(true),
            'settings' => [
                'lootMode' => 'ffa', // ffa, roundrobin, leader
                'inviteOnly' => true,
                'pvpEnabled' => false
            ]
        ];
        
        $this->playerGroups[$leaderId] = $groupId;
        
        $this->notifyPlayer($leaderId, 'group_created', [
            'group' => $this->getGroupData($groupId)
        ]);
        
        return ['success' => true, 'groupId' => $groupId, 'group' => $this->getGroupData($groupId)];
    }
    
    /**
     * Inviter un joueur dans le groupe
     */
    public function invitePlayer($inviterId, $targetId)
    {
        $groupId = $this->playerGroups[$inviterId] ?? null;
        
        if (!$groupId) {
            // Créer automatiquement un groupe si le joueur n'en a pas
            $result = $this->createGroup($inviterId);
            if (!$result['success']) return $result;
            $groupId = $result['groupId'];
        }
        
        $group = &$this->groups[$groupId];
        
        // Vérifier les permissions
        if ($group['leaderId'] !== $inviterId && $group['settings']['inviteOnly']) {
            return ['success' => false, 'error' => 'Seul le chef peut inviter'];
        }
        
        // Vérifier la taille du groupe
        if (count($group['members']) >= self::MAX_GROUP_SIZE) {
            return ['success' => false, 'error' => 'Groupe plein'];
        }
        
        // Vérifier si la cible est déjà dans un groupe
        if (isset($this->playerGroups[$targetId])) {
            return ['success' => false, 'error' => 'Ce joueur est déjà dans un groupe'];
        }
        
        // Créer l'invitation
        $this->invitations[$targetId] = [
            'inviterId' => $inviterId,
            'groupId' => $groupId,
            'expiresAt' => microtime(true) + self::INVITATION_TIMEOUT
        ];
        
        $inviter = $this->worldServer->getEntityById($inviterId);
        $inviterName = $inviter ? $inviter->name : 'Joueur';
        
        $this->notifyPlayer($targetId, 'group_invite', [
            'inviterId' => $inviterId,
            'inviterName' => $inviterName,
            'groupId' => $groupId,
            'groupName' => $group['name'],
            'timeout' => self::INVITATION_TIMEOUT
        ]);
        
        return ['success' => true, 'message' => 'Invitation envoyée'];
    }
    
    /**
     * Accepter une invitation
     */
    public function acceptInvite($playerId)
    {
        if (!isset($this->invitations[$playerId])) {
            return ['success' => false, 'error' => 'Pas d\'invitation en attente'];
        }
        
        $invite = $this->invitations[$playerId];
        
        // Vérifier l'expiration
        if (microtime(true) > $invite['expiresAt']) {
            unset($this->invitations[$playerId]);
            return ['success' => false, 'error' => 'Invitation expirée'];
        }
        
        $groupId = $invite['groupId'];
        
        if (!isset($this->groups[$groupId])) {
            unset($this->invitations[$playerId]);
            return ['success' => false, 'error' => 'Groupe introuvable'];
        }
        
        $group = &$this->groups[$groupId];
        
        // Vérifier la taille
        if (count($group['members']) >= self::MAX_GROUP_SIZE) {
            unset($this->invitations[$playerId]);
            return ['success' => false, 'error' => 'Groupe plein'];
        }
        
        // Ajouter au groupe
        $group['members'][] = $playerId;
        $this->playerGroups[$playerId] = $groupId;
        unset($this->invitations[$playerId]);
        
        // Notifier tous les membres
        $player = $this->worldServer->getEntityById($playerId);
        $playerName = $player ? $player->name : 'Joueur';
        
        $this->notifyGroup($groupId, 'group_member_joined', [
            'playerId' => $playerId,
            'playerName' => $playerName,
            'group' => $this->getGroupData($groupId)
        ]);
        
        return ['success' => true, 'group' => $this->getGroupData($groupId)];
    }
    
    /**
     * Refuser une invitation
     */
    public function declineInvite($playerId)
    {
        if (!isset($this->invitations[$playerId])) {
            return ['success' => false, 'error' => 'Pas d\'invitation en attente'];
        }
        
        $invite = $this->invitations[$playerId];
        unset($this->invitations[$playerId]);
        
        // Notifier l'inviteur
        $player = $this->worldServer->getEntityById($playerId);
        $playerName = $player ? $player->name : 'Joueur';
        
        $this->notifyPlayer($invite['inviterId'], 'group_invite_declined', [
            'playerId' => $playerId,
            'playerName' => $playerName
        ]);
        
        return ['success' => true];
    }
    
    /**
     * Quitter un groupe
     */
    public function leaveGroup($playerId)
    {
        $groupId = $this->playerGroups[$playerId] ?? null;
        
        if (!$groupId || !isset($this->groups[$groupId])) {
            return ['success' => false, 'error' => 'Pas dans un groupe'];
        }
        
        $group = &$this->groups[$groupId];
        $wasLeader = ($group['leaderId'] === $playerId);
        
        // Retirer du groupe
        $group['members'] = array_values(array_filter($group['members'], function($id) use ($playerId) { return $id !== $playerId; }));
        unset($this->playerGroups[$playerId]);
        
        $player = $this->worldServer->getEntityById($playerId);
        $playerName = $player ? $player->name : 'Joueur';
        
        // Si le groupe est vide, le supprimer
        if (empty($group['members'])) {
            unset($this->groups[$groupId]);
            $this->notifyPlayer($playerId, 'group_left', ['disbanded' => true]);
            return ['success' => true, 'disbanded' => true];
        }
        
        // Si c'était le leader, transférer le leadership
        if ($wasLeader) {
            $group['leaderId'] = $group['members'][0];
            $newLeader = $this->worldServer->getEntityById($group['leaderId']);
            $newLeaderName = $newLeader ? $newLeader->name : 'Joueur';
            
            $this->notifyGroup($groupId, 'group_leader_changed', [
                'newLeaderId' => $group['leaderId'],
                'newLeaderName' => $newLeaderName,
                'group' => $this->getGroupData($groupId)
            ]);
        }
        
        // Notifier les autres
        $this->notifyGroup($groupId, 'group_member_left', [
            'playerId' => $playerId,
            'playerName' => $playerName,
            'group' => $this->getGroupData($groupId)
        ]);
        
        $this->notifyPlayer($playerId, 'group_left', ['disbanded' => false]);
        
        return ['success' => true, 'disbanded' => false];
    }
    
    /**
     * Expulser un membre
     */
    public function kickMember($leaderId, $targetId)
    {
        $groupId = $this->playerGroups[$leaderId] ?? null;
        
        if (!$groupId || !isset($this->groups[$groupId])) {
            return ['success' => false, 'error' => 'Pas dans un groupe'];
        }
        
        $group = &$this->groups[$groupId];
        
        if ($group['leaderId'] !== $leaderId) {
            return ['success' => false, 'error' => 'Seul le chef peut expulser'];
        }
        
        if ($targetId === $leaderId) {
            return ['success' => false, 'error' => 'Impossible de s\'expulser soi-même'];
        }
        
        if (!in_array($targetId, $group['members'])) {
            return ['success' => false, 'error' => 'Joueur pas dans le groupe'];
        }
        
        // Retirer du groupe
        $group['members'] = array_values(array_filter($group['members'], function($id) use ($targetId) { return $id !== $targetId; }));
        unset($this->playerGroups[$targetId]);
        
        $target = $this->worldServer->getEntityById($targetId);
        $targetName = $target ? $target->name : 'Joueur';
        
        $this->notifyPlayer($targetId, 'group_kicked', ['groupName' => $group['name']]);
        
        $this->notifyGroup($groupId, 'group_member_kicked', [
            'playerId' => $targetId,
            'playerName' => $targetName,
            'group' => $this->getGroupData($groupId)
        ]);
        
        return ['success' => true];
    }
    
    /**
     * Promouvoir un membre chef
     */
    public function promoteLeader($currentLeaderId, $newLeaderId)
    {
        $groupId = $this->playerGroups[$currentLeaderId] ?? null;
        
        if (!$groupId || !isset($this->groups[$groupId])) {
            return ['success' => false, 'error' => 'Pas dans un groupe'];
        }
        
        $group = &$this->groups[$groupId];
        
        if ($group['leaderId'] !== $currentLeaderId) {
            return ['success' => false, 'error' => 'Seul le chef peut promouvoir'];
        }
        
        if (!in_array($newLeaderId, $group['members'])) {
            return ['success' => false, 'error' => 'Joueur pas dans le groupe'];
        }
        
        $group['leaderId'] = $newLeaderId;
        
        $newLeader = $this->worldServer->getEntityById($newLeaderId);
        $newLeaderName = $newLeader ? $newLeader->name : 'Joueur';
        
        $this->notifyGroup($groupId, 'group_leader_changed', [
            'newLeaderId' => $newLeaderId,
            'newLeaderName' => $newLeaderName,
            'group' => $this->getGroupData($groupId)
        ]);
        
        return ['success' => true];
    }
    
    /**
     * Changer les paramètres du groupe
     */
    public function updateSettings($leaderId, $settings)
    {
        $groupId = $this->playerGroups[$leaderId] ?? null;
        
        if (!$groupId || !isset($this->groups[$groupId])) {
            return ['success' => false, 'error' => 'Pas dans un groupe'];
        }
        
        $group = &$this->groups[$groupId];
        
        if ($group['leaderId'] !== $leaderId) {
            return ['success' => false, 'error' => 'Seul le chef peut modifier les paramètres'];
        }
        
        // Mettre à jour les paramètres valides
        $validSettings = ['lootMode', 'inviteOnly', 'pvpEnabled'];
        foreach ($validSettings as $key) {
            if (isset($settings[$key])) {
                $group['settings'][$key] = $settings[$key];
            }
        }
        
        $this->notifyGroup($groupId, 'group_settings_changed', [
            'settings' => $group['settings'],
            'group' => $this->getGroupData($groupId)
        ]);
        
        return ['success' => true, 'settings' => $group['settings']];
    }
    
    /**
     * Obtenir le groupe d'un joueur
     */
    public function getPlayerGroup($playerId)
    {
        $groupId = $this->playerGroups[$playerId] ?? null;
        if (!$groupId) return null;
        return $this->groups[$groupId] ?? null;
    }
    
    /**
     * Obtenir les données publiques d'un groupe
     */
    public function getGroupData($groupId)
    {
        if (!isset($this->groups[$groupId])) return null;
        
        $group = $this->groups[$groupId];
        $members = [];
        
        foreach ($group['members'] as $memberId) {
            $player = $this->worldServer->getEntityById($memberId);
            $members[] = [
                'id' => $memberId,
                'name' => $player ? $player->name : 'Joueur',
                'isLeader' => ($memberId === $group['leaderId']),
                'x' => $player ? $player->x : 0,
                'y' => $player ? $player->y : 0,
                'hp' => $player ? $player->hitPoints : 0
            ];
        }
        
        return [
            'id' => $group['id'],
            'name' => $group['name'],
            'leaderId' => $group['leaderId'],
            'members' => $members,
            'memberCount' => count($members),
            'maxSize' => self::MAX_GROUP_SIZE,
            'settings' => $group['settings']
        ];
    }
    
    /**
     * Vérifier si deux joueurs sont dans le même groupe
     */
    public function areInSameGroup($playerId1, $playerId2)
    {
        $group1 = $this->playerGroups[$playerId1] ?? null;
        $group2 = $this->playerGroups[$playerId2] ?? null;
        return $group1 !== null && $group1 === $group2;
    }
    
    /**
     * Distribuer le loot selon le mode du groupe
     */
    public function distributeLoot($groupId, $lootItems, $killerId)
    {
        if (!isset($this->groups[$groupId])) {
            return ['playerId' => $killerId, 'items' => $lootItems];
        }
        
        $group = $this->groups[$groupId];
        $mode = $group['settings']['lootMode'];
        
        switch ($mode) {
            case 'leader':
                return ['playerId' => $group['leaderId'], 'items' => $lootItems];
                
            case 'roundrobin':
                // Distribution tournante
                static $rrIndex = [];
                if (!isset($rrIndex[$groupId])) $rrIndex[$groupId] = 0;
                $recipient = $group['members'][$rrIndex[$groupId] % count($group['members'])];
                $rrIndex[$groupId]++;
                return ['playerId' => $recipient, 'items' => $lootItems];
                
            case 'ffa':
            default:
                return ['playerId' => $killerId, 'items' => $lootItems];
        }
    }
    
    /**
     * Notifier un joueur
     */
    private function notifyPlayer($playerId, $type, $data)
    {
        $player = $this->worldServer->getEntityById($playerId);
        if ($player) {
            $this->worldServer->pushToPlayer($player, [
                'type' => $type,
                'data' => $data
            ]);
        }
    }
    
    /**
     * Notifier tout le groupe
     */
    private function notifyGroup($groupId, $type, $data)
    {
        if (!isset($this->groups[$groupId])) return;
        
        foreach ($this->groups[$groupId]['members'] as $memberId) {
            $this->notifyPlayer($memberId, $type, $data);
        }
    }
    
    /**
     * Nettoyer les invitations expirées
     */
    public function cleanupExpiredInvitations()
    {
        $now = microtime(true);
        foreach ($this->invitations as $playerId => $invite) {
            if ($now > $invite['expiresAt']) {
                unset($this->invitations[$playerId]);
            }
        }
    }
    
    /**
     * Gestion de la déconnexion d'un joueur
     */
    public function onPlayerDisconnect($playerId)
    {
        // Retirer des invitations
        unset($this->invitations[$playerId]);
        
        // Quitter le groupe
        $this->leaveGroup($playerId);
    }
}
