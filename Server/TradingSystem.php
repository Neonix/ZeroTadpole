<?php
/**
 * ZeroTadpole - Trading System v1.0
 * Système d'échange entre joueurs
 */
namespace Server;

class TradingSystem
{
    private $worldServer;
    private $activeTrades = [];      // tradeId => trade data
    private $playerTrades = [];      // playerId => tradeId
    private $tradeRequests = [];     // targetId => [fromId, timestamp]
    
    const TRADE_TIMEOUT = 60;        // Secondes avant expiration de la demande
    const MAX_TRADE_SLOTS = 8;       // Items max par côté
    const TRADE_DISTANCE = 100;      // Distance max pour échanger
    
    public function __construct($worldServer)
    {
        $this->worldServer = $worldServer;
    }
    
    /**
     * Envoie une demande d'échange
     */
    public function requestTrade($fromId, $targetId)
    {
        // Vérifications
        if ($fromId === $targetId) {
            return ['success' => false, 'error' => 'Impossible d\'échanger avec soi-même'];
        }
        
        $fromPlayer = $this->worldServer->getEntityById($fromId);
        $targetPlayer = $this->worldServer->getEntityById($targetId);
        
        if (!$fromPlayer || !$targetPlayer) {
            return ['success' => false, 'error' => 'Joueur introuvable'];
        }
        
        // Vérifier la distance
        $dx = $fromPlayer->x - $targetPlayer->x;
        $dy = $fromPlayer->y - $targetPlayer->y;
        $dist = sqrt($dx * $dx + $dy * $dy);
        
        if ($dist > self::TRADE_DISTANCE) {
            return ['success' => false, 'error' => 'Joueur trop éloigné'];
        }
        
        // Vérifier si déjà en trade
        if (isset($this->playerTrades[$fromId])) {
            return ['success' => false, 'error' => 'Vous êtes déjà en échange'];
        }
        
        if (isset($this->playerTrades[$targetId])) {
            return ['success' => false, 'error' => 'Ce joueur est déjà en échange'];
        }
        
        // Créer la demande
        $this->tradeRequests[$targetId] = [
            'fromId' => $fromId,
            'fromName' => $fromPlayer->name,
            'timestamp' => time()
        ];
        
        // Notifier la cible
        $this->worldServer->pushToPlayer($targetPlayer, [
            'type' => 'trade_request',
            'fromId' => $fromId,
            'fromName' => $fromPlayer->name
        ]);
        
        // Notifier l'envoyeur
        $this->worldServer->pushToPlayer($fromPlayer, [
            'type' => 'trade_request_sent',
            'targetId' => $targetId,
            'targetName' => $targetPlayer->name
        ]);
        
        return ['success' => true];
    }
    
    /**
     * Accepte une demande d'échange
     */
    public function acceptTrade($playerId)
    {
        if (!isset($this->tradeRequests[$playerId])) {
            return ['success' => false, 'error' => 'Aucune demande d\'échange'];
        }
        
        $request = $this->tradeRequests[$playerId];
        
        // Vérifier le timeout
        if (time() - $request['timestamp'] > self::TRADE_TIMEOUT) {
            unset($this->tradeRequests[$playerId]);
            return ['success' => false, 'error' => 'Demande expirée'];
        }
        
        $fromId = $request['fromId'];
        
        // Créer l'échange
        $tradeId = 'trade_' . time() . '_' . mt_rand(1000, 9999);
        
        $this->activeTrades[$tradeId] = [
            'id' => $tradeId,
            'player1' => [
                'id' => $fromId,
                'items' => [],
                'gems' => 0,
                'confirmed' => false
            ],
            'player2' => [
                'id' => $playerId,
                'items' => [],
                'gems' => 0,
                'confirmed' => false
            ],
            'startTime' => time(),
            'status' => 'active'
        ];
        
        $this->playerTrades[$fromId] = $tradeId;
        $this->playerTrades[$playerId] = $tradeId;
        
        unset($this->tradeRequests[$playerId]);
        
        // Notifier les deux joueurs
        $this->notifyTradeUpdate($tradeId, 'trade_started');
        
        return ['success' => true, 'tradeId' => $tradeId];
    }
    
    /**
     * Refuse une demande d'échange
     */
    public function declineTrade($playerId)
    {
        if (!isset($this->tradeRequests[$playerId])) {
            return ['success' => false, 'error' => 'Aucune demande d\'échange'];
        }
        
        $request = $this->tradeRequests[$playerId];
        $fromPlayer = $this->worldServer->getEntityById($request['fromId']);
        
        if ($fromPlayer) {
            $this->worldServer->pushToPlayer($fromPlayer, [
                'type' => 'trade_declined',
                'targetId' => $playerId
            ]);
        }
        
        unset($this->tradeRequests[$playerId]);
        
        return ['success' => true];
    }
    
    /**
     * Ajoute un item à l'échange
     */
    public function addItem($playerId, $itemSlot)
    {
        $tradeId = $this->playerTrades[$playerId] ?? null;
        if (!$tradeId) {
            return ['success' => false, 'error' => 'Pas d\'échange en cours'];
        }
        
        $trade = &$this->activeTrades[$tradeId];
        $playerSide = $this->getPlayerSide($trade, $playerId);
        
        if (!$playerSide) {
            return ['success' => false, 'error' => 'Erreur d\'échange'];
        }
        
        // Vérifier le nombre d'items
        if (count($trade[$playerSide]['items']) >= self::MAX_TRADE_SLOTS) {
            return ['success' => false, 'error' => 'Maximum d\'items atteint'];
        }
        
        // Reset les confirmations
        $trade['player1']['confirmed'] = false;
        $trade['player2']['confirmed'] = false;
        
        // Obtenir l'item
        $inventory = $this->worldServer->inventoryManager;
        $item = $inventory->getItemInSlot($playerId, $itemSlot);
        
        if (!$item) {
            return ['success' => false, 'error' => 'Item introuvable'];
        }
        
        // Vérifier si l'item est déjà dans l'échange
        foreach ($trade[$playerSide]['items'] as $tradeItem) {
            if ($tradeItem['slot'] === $itemSlot) {
                return ['success' => false, 'error' => 'Item déjà dans l\'échange'];
            }
        }
        
        // Ajouter l'item
        $trade[$playerSide]['items'][] = [
            'slot' => $itemSlot,
            'item' => $item
        ];
        
        $this->notifyTradeUpdate($tradeId, 'trade_item_added');
        
        return ['success' => true];
    }
    
    /**
     * Retire un item de l'échange
     */
    public function removeItem($playerId, $itemSlot)
    {
        $tradeId = $this->playerTrades[$playerId] ?? null;
        if (!$tradeId) {
            return ['success' => false, 'error' => 'Pas d\'échange en cours'];
        }
        
        $trade = &$this->activeTrades[$tradeId];
        $playerSide = $this->getPlayerSide($trade, $playerId);
        
        if (!$playerSide) {
            return ['success' => false, 'error' => 'Erreur d\'échange'];
        }
        
        // Reset les confirmations
        $trade['player1']['confirmed'] = false;
        $trade['player2']['confirmed'] = false;
        
        // Retirer l'item
        $trade[$playerSide]['items'] = array_values(array_filter(
            $trade[$playerSide]['items'],
            function($item) use ($itemSlot) {
                return $item['slot'] !== $itemSlot;
            }
        ));
        
        $this->notifyTradeUpdate($tradeId, 'trade_item_removed');
        
        return ['success' => true];
    }
    
    /**
     * Définit les gems à échanger
     */
    public function setGems($playerId, $amount)
    {
        $tradeId = $this->playerTrades[$playerId] ?? null;
        if (!$tradeId) {
            return ['success' => false, 'error' => 'Pas d\'échange en cours'];
        }
        
        $trade = &$this->activeTrades[$tradeId];
        $playerSide = $this->getPlayerSide($trade, $playerId);
        
        if (!$playerSide) {
            return ['success' => false, 'error' => 'Erreur d\'échange'];
        }
        
        // Vérifier les gems
        $amount = max(0, (int)$amount);
        $inventory = $this->worldServer->inventoryManager;
        $playerGems = $inventory->getGems($playerId);
        
        if ($amount > $playerGems) {
            return ['success' => false, 'error' => 'Gems insuffisantes'];
        }
        
        // Reset les confirmations
        $trade['player1']['confirmed'] = false;
        $trade['player2']['confirmed'] = false;
        
        $trade[$playerSide]['gems'] = $amount;
        
        $this->notifyTradeUpdate($tradeId, 'trade_gems_changed');
        
        return ['success' => true];
    }
    
    /**
     * Confirme l'échange
     */
    public function confirmTrade($playerId)
    {
        $tradeId = $this->playerTrades[$playerId] ?? null;
        if (!$tradeId) {
            return ['success' => false, 'error' => 'Pas d\'échange en cours'];
        }
        
        $trade = &$this->activeTrades[$tradeId];
        $playerSide = $this->getPlayerSide($trade, $playerId);
        
        if (!$playerSide) {
            return ['success' => false, 'error' => 'Erreur d\'échange'];
        }
        
        $trade[$playerSide]['confirmed'] = true;
        
        $this->notifyTradeUpdate($tradeId, 'trade_confirmed');
        
        // Si les deux ont confirmé, effectuer l'échange
        if ($trade['player1']['confirmed'] && $trade['player2']['confirmed']) {
            return $this->executeTrade($tradeId);
        }
        
        return ['success' => true, 'waiting' => true];
    }
    
    /**
     * Annule l'échange
     */
    public function cancelTrade($playerId)
    {
        $tradeId = $this->playerTrades[$playerId] ?? null;
        if (!$tradeId) {
            return ['success' => false, 'error' => 'Pas d\'échange en cours'];
        }
        
        $this->closeTrade($tradeId, 'cancelled', $playerId);
        
        return ['success' => true];
    }
    
    /**
     * Effectue l'échange
     */
    private function executeTrade($tradeId)
    {
        $trade = $this->activeTrades[$tradeId];
        $inventory = $this->worldServer->inventoryManager;
        
        $p1Id = $trade['player1']['id'];
        $p2Id = $trade['player2']['id'];
        
        // Vérifier que les joueurs ont toujours les items
        foreach ($trade['player1']['items'] as $tradeItem) {
            $item = $inventory->getItemInSlot($p1Id, $tradeItem['slot']);
            if (!$item || $item['id'] !== $tradeItem['item']['id']) {
                $this->closeTrade($tradeId, 'invalid');
                return ['success' => false, 'error' => 'Items modifiés'];
            }
        }
        
        foreach ($trade['player2']['items'] as $tradeItem) {
            $item = $inventory->getItemInSlot($p2Id, $tradeItem['slot']);
            if (!$item || $item['id'] !== $tradeItem['item']['id']) {
                $this->closeTrade($tradeId, 'invalid');
                return ['success' => false, 'error' => 'Items modifiés'];
            }
        }
        
        // Vérifier les gems
        if ($inventory->getGems($p1Id) < $trade['player1']['gems'] ||
            $inventory->getGems($p2Id) < $trade['player2']['gems']) {
            $this->closeTrade($tradeId, 'invalid');
            return ['success' => false, 'error' => 'Gems insuffisantes'];
        }
        
        // Vérifier l'espace inventaire
        $p1Receives = count($trade['player2']['items']);
        $p1Gives = count($trade['player1']['items']);
        $p2Receives = count($trade['player1']['items']);
        $p2Gives = count($trade['player2']['items']);
        
        // Effectuer l'échange
        
        // Retirer les items du joueur 1
        foreach ($trade['player1']['items'] as $tradeItem) {
            $inventory->removeItemFromSlot($p1Id, $tradeItem['slot']);
        }
        
        // Retirer les items du joueur 2
        foreach ($trade['player2']['items'] as $tradeItem) {
            $inventory->removeItemFromSlot($p2Id, $tradeItem['slot']);
        }
        
        // Donner les items au joueur 1 (depuis joueur 2)
        foreach ($trade['player2']['items'] as $tradeItem) {
            $inventory->addItem($p1Id, $tradeItem['item']['id'], $tradeItem['item']['quantity'] ?? 1);
        }
        
        // Donner les items au joueur 2 (depuis joueur 1)
        foreach ($trade['player1']['items'] as $tradeItem) {
            $inventory->addItem($p2Id, $tradeItem['item']['id'], $tradeItem['item']['quantity'] ?? 1);
        }
        
        // Échanger les gems
        if ($trade['player1']['gems'] > 0) {
            $inventory->removeGems($p1Id, $trade['player1']['gems']);
            $inventory->addGems($p2Id, $trade['player1']['gems']);
        }
        
        if ($trade['player2']['gems'] > 0) {
            $inventory->removeGems($p2Id, $trade['player2']['gems']);
            $inventory->addGems($p1Id, $trade['player2']['gems']);
        }
        
        // Sync les inventaires
        $inventory->syncInventory($p1Id);
        $inventory->syncInventory($p2Id);
        
        $this->closeTrade($tradeId, 'completed');
        
        return ['success' => true];
    }
    
    /**
     * Ferme un échange
     */
    private function closeTrade($tradeId, $reason, $initiator = null)
    {
        if (!isset($this->activeTrades[$tradeId])) return;
        
        $trade = $this->activeTrades[$tradeId];
        $p1Id = $trade['player1']['id'];
        $p2Id = $trade['player2']['id'];
        
        // Notifier les joueurs
        $message = [
            'type' => 'trade_closed',
            'reason' => $reason,
            'initiator' => $initiator
        ];
        
        $p1 = $this->worldServer->getEntityById($p1Id);
        $p2 = $this->worldServer->getEntityById($p2Id);
        
        if ($p1) $this->worldServer->pushToPlayer($p1, $message);
        if ($p2) $this->worldServer->pushToPlayer($p2, $message);
        
        // Nettoyer
        unset($this->activeTrades[$tradeId]);
        unset($this->playerTrades[$p1Id]);
        unset($this->playerTrades[$p2Id]);
    }
    
    /**
     * Obtient le côté du joueur dans l'échange
     */
    private function getPlayerSide($trade, $playerId)
    {
        if ($trade['player1']['id'] === $playerId) return 'player1';
        if ($trade['player2']['id'] === $playerId) return 'player2';
        return null;
    }
    
    /**
     * Notifie les deux joueurs d'une mise à jour
     */
    private function notifyTradeUpdate($tradeId, $type)
    {
        $trade = $this->activeTrades[$tradeId];
        
        $message = [
            'type' => $type,
            'trade' => [
                'id' => $tradeId,
                'player1' => [
                    'id' => $trade['player1']['id'],
                    'items' => $trade['player1']['items'],
                    'gems' => $trade['player1']['gems'],
                    'confirmed' => $trade['player1']['confirmed']
                ],
                'player2' => [
                    'id' => $trade['player2']['id'],
                    'items' => $trade['player2']['items'],
                    'gems' => $trade['player2']['gems'],
                    'confirmed' => $trade['player2']['confirmed']
                ]
            ]
        ];
        
        $p1 = $this->worldServer->getEntityById($trade['player1']['id']);
        $p2 = $this->worldServer->getEntityById($trade['player2']['id']);
        
        if ($p1) $this->worldServer->pushToPlayer($p1, $message);
        if ($p2) $this->worldServer->pushToPlayer($p2, $message);
    }
    
    /**
     * Nettoie les demandes expirées
     */
    public function tick()
    {
        $now = time();
        
        foreach ($this->tradeRequests as $targetId => $request) {
            if ($now - $request['timestamp'] > self::TRADE_TIMEOUT) {
                $fromPlayer = $this->worldServer->getEntityById($request['fromId']);
                if ($fromPlayer) {
                    $this->worldServer->pushToPlayer($fromPlayer, [
                        'type' => 'trade_request_expired'
                    ]);
                }
                unset($this->tradeRequests[$targetId]);
            }
        }
    }
    
    public function onPlayerDisconnect($playerId)
    {
        // Annuler tout échange en cours
        if (isset($this->playerTrades[$playerId])) {
            $this->closeTrade($this->playerTrades[$playerId], 'disconnected', $playerId);
        }
        
        // Annuler les demandes envoyées
        foreach ($this->tradeRequests as $targetId => $request) {
            if ($request['fromId'] === $playerId) {
                unset($this->tradeRequests[$targetId]);
            }
        }
        
        // Annuler les demandes reçues
        unset($this->tradeRequests[$playerId]);
    }
}
