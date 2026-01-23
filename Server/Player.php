<?php
/**
 * Created by neonix on 06/07/2017.
 */
namespace Server;
use \Workerman\Timer;
use \Server\Lib\Db;


class Player extends Character
{
    public $hasEnteredGame = false;
    public $isDead = false;
    public $haters = array();
    public $lastCheckpoint = array();
    public $disconnectTimeout = 0;
    public $armor = 0;
    public $armorLevel = 0;
    public $connection;
    public $server;
    public $weaponLevel = 0;
    public $formatChecker;
    public $firepotionTimeout = 0;
    public $respawnTimeout = 0;
    public $exitCallback;
    public $moveCallback;
    public $lootmoveCallback;
    public $zoneCallback;
    public $orientCallback;
    public $messageCallback;
    public $broadcastCallback;
    public $broadcastzoneCallback;
    public $requestposCallback;
    public $pvpEnabled = false;
    
    public function __construct($connection, $worldServer)
    {
        $this->server = $worldServer;
        $this->connection = $connection;
        parent::__construct($this->connection->id, 'player', TYPES_ENTITIES_WARRIOR, 0, 0, '',0, 0);
        $this->hasEnteredGame = false;
        $this->isDead = false;
        $this->haters = array();
        $this->lastCheckpoint = null;
        $this->formatChecker = new FormatChecker();
        $this->disconnectTimeout = 0;
        $this->connection->onMessage = array($this, 'onClientMessage');
        $this->connection->onClose = array($this, 'onClientclose');
        $this->connection->onWebSocketConnect = function($con)
        {
            //TODO FIX double tab everywhere ...
            $con->send(
                json_encode(array(
                    "type" => TYPES_MESSAGES_WELCOME,
                    "id" => $this->id))
            );

        };
    }
    
    public function onClientMessage($connection, $data)
    {


        $message = json_decode($data, true);
        if (!is_array($message)) {
            $this->connection->close("Invalid message: ". $data);
            return;
        }
        $action = $message["type"] ?? null;
        if ($action === null) {
            $this->connection->close("Invalid message type: ". $data);
            return;
        }

        if(!$this->hasEnteredGame && $action !== TYPES_MESSAGES_HELLO)
        {
            $this->connection->close("Invalid handshake message: ". $data);
            return;
        }
        
        $this->resetTimeout();

        if ($this->isDead) {
            if (
                $action === TYPES_MESSAGES_MOVE
                || $action === TYPES_MESSAGES_LOOTMOVE
                || $action === TYPES_MESSAGES_ATTACK
                || $action === TYPES_MESSAGES_HIT
                || $action === TYPES_MESSAGES_HURT
            ) {
                return;
            }
        }
        
        if($action === TYPES_MESSAGES_HELLO) 
        {
            //var_dump($message);
            $name = isset($message["name"]) ? trim((string) $message["name"]) : null;
            $color = isset($message["color"]) ? trim((string) $message["color"]) : null;
            $this->name = $name === null || $name === '' ? "Guest".$this->id : $name;
            if($color !== null && $color !== '') {
                $this->color = $color;
            }
            $this->kind = TYPES_ENTITIES_WARRIOR;
            //$this->equipArmor($message[2]);
            //$this->equipWeapon($message[3]);
            $this->orientation = Utils::randomOrientation();
            $this->hitPoints = $this->maxHitPoints;
            $this->updateHitPoints();
            $this->updatePosition();
            
            $this->server->addPlayer($this);
            call_user_func($this->server->enterCallback, $this);


            //
           /* $this->connection->send(
                json_encode(array(
                "type" => TYPES_MESSAGES_HELLO,
                "id" => $this->id))
            );
           */
            //$this->connection->send(json_encode(array(TYPES_MESSAGES_WELCOME, $this->id, $this->name, $this->x, $this->y, $this->hitPoints)));
            $this->hasEnteredGame = true;
            $this->isDead = false;
            $this->server->pushToPlayer($this, new Messages\HitPoints($this->maxHitPoints));
            $this->server->pushToPlayer($this, $this->health());
        }
        elseif($action == TYPES_MESSAGES_WHO || $action === 'who')
        {
            $this->server->pushToPlayer($this, new Messages\PlayerList($this->server->getPlayerList()));
        }
        else if($action === 'pvp') {
            $enabled = isset($message["enabled"]) ? (bool) $message["enabled"] : null;
            if ($enabled !== null) {
                $this->pvpEnabled = $enabled;
            }
        }
        else if($action === 'private') {
            $targetId = isset($message["target"]) ? (int)$message["target"] : null;
            $msg = isset($message["message"]) ? trim((string) $message["message"]) : '';
            if($targetId && $msg !== '') {
                $this->server->sendPrivateMessage($this, $targetId, $msg);
            }
        }
        else if($action === TYPES_MESSAGES_ZONE) {
            call_user_func($this->zoneCallback);
        }
        else if($action == TYPES_MESSAGES_CHAT) 
        {
            $msg = isset($message["message"]) ? trim((string) $message["message"]) : '';
            
            // Sanitized messages may become empty. No need to broadcast empty chat messages.
            if($msg !== '') 
            {
                $this->broadcastToZone(new Messages\Chat($this, $msg), false);
            }
        }
        else if($action === 'orb') {
            // Broadcast orb collection to other players
            $orbId = isset($message["orbId"]) ? (string) $message["orbId"] : null;
            if($orbId !== null) {
                $this->broadcastToZone(new Messages\Orb($orbId, $this->id), true);
            }
        }
        else if($action === 'elite_hit') {
    $mobId = isset($message["id"]) ? (string) $message["id"] : '';
    $damage = isset($message["damage"]) ? (int) $message["damage"] : 0;
    if($mobId !== '' && $damage > 0) {
        // Compat: certains clients envoient encore "elite_hit"
        if (method_exists($this->server, 'handleMobHit')) {
            $this->server->handleMobHit($mobId, $damage, $this);
        } elseif (method_exists($this->server, 'handleEliteMobHit')) {
            $this->server->handleEliteMobHit($mobId, $damage, $this);
        }
    }
}
else if($action == TYPES_MESSAGES_MOVE) {
            //var_dump($message);

            if($this->moveCallback) 
            {
                if (!isset($message['x'], $message['y'], $message['angle'], $message['momentum'])) {
                    return;
                }
                $x = (float) $message['x'];
                $y = (float) $message['y'];
                $angle = (float) $message['angle'];
                $momentum = (float) $message['momentum'];
                $life = 1;
                $name = $this->name;
                $authorized = false;

               /* 'type'     => 'update',
                        'id'       => $_SESSION['id'],
                        'angle'    => $message_data["angle"]+0,
                        'momentum' => $message_data["momentum"]+0,
                        'x'        => $message_data["x"]+0,
                        'y'        => $message_data["y"]+0,
                        'life'     => 1,
                        'name'     => isset($message_data['name']) ? $message_data['name'] : 'Guest.'.$_SESSION['id'],
                        'authorized'  => false,

        */

                //if($this->server->isValidPosition($x, $y)) {



                    if(isset($message['name'])) {
                        $nextName = trim((string) $message['name']);
                        if($nextName !== '' && strlen($nextName) <= 24) {
                            $this->name = $nextName;
                        }
                    }
                    if(isset($message['color'])) {
                        $nextColor = trim((string) $message['color']);
                        if($nextColor !== '') {
                            $this->color = $nextColor;
                        }
                    }

                    $this->setPosition($x, $y, $angle, $momentum);
                    $this->clearTarget();
                    $this->server->handlePlayerSafeZone($this);
// Mise à jour des groupes (visibilité) à chaque déplacement
$hasChangedGroups = $this->server->handleEntityGroupMembership($this);
if ($hasChangedGroups) {
    $this->server->pushToPreviousGroups($this, new Messages\Destroy($this));
    $this->server->pushRelevantEntityListTo($this);
}

                    // Ne pas renvoyer le mouvement au joueur lui-même.
                    // Le client simule déjà son propre mouvement localement.
                    // L'écho serveur introduit une latence visible (rubber-banding).
                    $this->broadcast(new Messages\Move($this), true);
                //$this->broadcast(0);
                    //call_user_func($this->moveCallback, $this->x, $this->y);
                //}
            }
        }
        else if($action == TYPES_MESSAGES_LOOTMOVE) {
            if($this->lootmoveCallback) 
            {
                if (!isset($message[1], $message[2], $message[3])) {
                    return;
                }
                $this->setPosition($message[1], $message[2]);
                
                $item = $this->server->getEntityById($message[3]);
                if($item) 
                {
                    $this->clearTarget();
                    $this->broadcast(new Messages\LootMove($this, $item));
                    call_user_func($this->lootmoveCallback, $this->x, $this->y);
                }
            }
        }
        else if($action == TYPES_MESSAGES_AGGRO) {
            if($this->moveCallback) 
            {
                if (!isset($message[1])) {
                    return;
                }
                $this->server->handleMobHate($message[1], $this->id, 5);
            }
        }
        else if($action == TYPES_MESSAGES_ATTACK) {
            $target = $this->server->getEntityById($message[1]);
            if($target) 
            {
                if($target instanceof Player) {
                    if(
                        !$this->pvpEnabled
                        || !$target->pvpEnabled
                        || $this->server->isPlayerInSafeZone($this)
                        || $this->server->isPlayerInSafeZone($target)
                    ) {
                        return;
                    }
                }
                $this->setTarget($target);
                $this->server->broadcastAttacker($this);
            }
        }
        else if($action == TYPES_MESSAGES_HIT) {
            $target = $this->server->getEntityById($message[1]);
            if($target) 
            {
                if($target instanceof Player) {
                    if(
                        !$this->pvpEnabled
                        || !$target->pvpEnabled
                        || $this->server->isPlayerInSafeZone($this)
                        || $this->server->isPlayerInSafeZone($target)
                        || $target->hitPoints <= 0
                    ) {
                        return;
                    }
                    $dmg = Formulas::dmg($this->weaponLevel, $target->armorLevel);
                    if($dmg > 0) {
                        $target->hitPoints -= $dmg;
                        if($target->hitPoints <= 0) {
                            $target->isDead = true;
                        }
                        $this->server->handleHurtEntity($target, $this, $dmg);
                    }
                    return;
                }

                $dmg = Formulas::dmg($this->weaponLevel, $target->armorLevel);
                
                if($dmg > 0 && is_callable(array($target, 'receiveDamage')))
                {
                    $target->receiveDamage($dmg, $this->id);
                    $this->server->handleMobHate($target->id, $this->id, $dmg);
                    $this->server->handleHurtEntity($target, $this, $dmg);
                }
            }
        }
        else if($action == TYPES_MESSAGES_HURT) {
            $mob = $this->server->getEntityById($message[1]);
            if($mob && $this->hitPoints > 0) 
            {
                $this->hitPoints -= Formulas::dmg($mob->weaponLevel, $this->armorLevel);
                $this->server->handleHurtEntity($this);
                
                if($this->hitPoints <= 0) 
                {
                    $this->isDead = true;
                    if(!empty($this->firepotionTimeout)) 
                    {
                        Timer::del($this->firepotionTimeout);
                        $this->firepotionTimeout = 0;
                    }
                }
            }
        }
        else if($action == TYPES_MESSAGES_LOOT) {
            $item = $this->server->getEntityById($message[1]);
            
            if($item) 
            {
                $kind = $item->kind;
                
                if(Types::isItem($kind)) 
                {
                    $this->broadcast($item->despawn());
                    $this->server->removeEntity($item);
                    
                    if($kind == TYPES_ENTITIES_FIREPOTION) 
                    {
                        $this->updateHitPoints();
                        $this->broadcast($this->equip(TYPES_ENTITIES_FIREFOX));
                        $this->firepotionTimeout = Timer::add(15, array($this, 'firepotionTimeoutCallback'), array(), false);
                        $hitpoints = new Messages\HitPoints($this->maxHitPoints);
                        $data = $hitpoints->serialize();
                        $this->connection->send(json_encode($data));
                    } 
                    else if(Types::isHealingItem($kind)) 
                    {
                        $amount = 0;
                        switch($kind) 
                        {
                            case TYPES_ENTITIES_FLASK: 
                                $amount = 40;
                                break;
                            case TYPES_ENTITIES_BURGER: 
                                $amount = 100;
                                break;
                        }
                        
                        if(!$this->hasFullHealth()) 
                        {
                            $this->regenHealthBy($amount);
                            $this->server->pushToPlayer($this, $this->health());
                        }
                    } 
                    else if(Types::isArmor($kind) || Types::isWeapon($kind)) 
                    {
                        $this->equipItem($item);
                        $this->broadcast($this->equip($kind));
                    }
                }
            }
        }
        else if($action == TYPES_MESSAGES_TELEPORT) {
            $x = $message[1];
            $y = $message[2];
            
            if($this->server->isValidPosition($x, $y)) 
            {
                $this->setPosition($x, $y);
                $this->clearTarget();
                
                $this->broadcast(new Messages\Teleport($this));
                
                $this->server->handlePlayerVanish($this);
                $this->server->pushRelevantEntityListTo($this);
            }
        }
        else if($action == TYPES_MESSAGES_OPEN) {
            $chest = $this->server->getEntityById($message[1]);
            if($chest && $chest instanceof Chest) 
            {
                $this->server->handleOpenedChest($chest, $this);
            }
        }
        else if($action === 'spell') {
            if (!isset($message['spellId'], $message['x'], $message['y'], $message['angle'])) {
                return;
            }
            $spellId = trim((string) $message['spellId']);
            $x = (float) $message['x'];
            $y = (float) $message['y'];
            $angle = (float) $message['angle'];
            $this->broadcastToZone(new Messages\Spell($this, $spellId, $x, $y, $angle), true);
        }
        // === GROUPE / PARTY ===
        else if($action === 'group_create') {
            $name = isset($message['name']) ? trim((string) $message['name']) : null;
            $result = $this->server->groupManager->createGroup($this->id, $name);
            $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'create', 'result' => $result]);
        }
        else if($action === 'group_invite') {
            $targetId = isset($message['targetId']) ? $message['targetId'] : null;
            if ($targetId) {
                $result = $this->server->groupManager->invitePlayer($this->id, $targetId);
                $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'invite', 'result' => $result]);
            }
        }
        else if($action === 'group_accept') {
            $result = $this->server->groupManager->acceptInvite($this->id);
            $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'accept', 'result' => $result]);
        }
        else if($action === 'group_decline') {
            $result = $this->server->groupManager->declineInvite($this->id);
            $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'decline', 'result' => $result]);
        }
        else if($action === 'group_leave') {
            $result = $this->server->groupManager->leaveGroup($this->id);
            $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'leave', 'result' => $result]);
        }
        else if($action === 'group_kick') {
            $targetId = isset($message['targetId']) ? $message['targetId'] : null;
            if ($targetId) {
                $result = $this->server->groupManager->kickMember($this->id, $targetId);
                $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'kick', 'result' => $result]);
            }
        }
        else if($action === 'group_promote') {
            $targetId = isset($message['targetId']) ? $message['targetId'] : null;
            if ($targetId) {
                $result = $this->server->groupManager->promoteLeader($this->id, $targetId);
                $this->server->pushToPlayer($this, ['type' => 'group_result', 'action' => 'promote', 'result' => $result]);
            }
        }
        // === INVENTAIRE ===
        else if($action === 'inventory_use') {
            $slotIndex = isset($message['slot']) ? (int) $message['slot'] : -1;
            $result = $this->server->inventoryManager->useItem($this->id, $slotIndex);
            $this->server->pushToPlayer($this, ['type' => 'inventory_result', 'action' => 'use', 'result' => $result]);
        }
        else if($action === 'inventory_drop') {
            $slotIndex = isset($message['slot']) ? (int) $message['slot'] : -1;
            $result = $this->server->inventoryManager->removeItem($this->id, $slotIndex);
            if ($result['success'] && isset($result['itemId'])) {
                // Créer un loot au sol
                $this->server->createLoot($result['itemId'], $this->x, $this->y);
            }
            $this->server->pushToPlayer($this, ['type' => 'inventory_result', 'action' => 'drop', 'result' => $result]);
        }
        else if($action === 'spell_equip') {
            $spellId = isset($message['spellId']) ? trim((string) $message['spellId']) : null;
            $slotIndex = isset($message['slot']) ? (int) $message['slot'] : 0;
            if ($spellId !== null) {
                $result = $this->server->inventoryManager->equipSpell($this->id, $spellId, $slotIndex);
                $this->server->pushToPlayer($this, ['type' => 'inventory_result', 'action' => 'equip_spell', 'result' => $result]);
            }
        }
        else if($action === 'spell_cast') {
            $slotIndex = isset($message['slot']) ? (int) $message['slot'] : 0;
            $targetX = isset($message['x']) ? (float) $message['x'] : $this->x;
            $targetY = isset($message['y']) ? (float) $message['y'] : $this->y;
            $result = $this->server->inventoryManager->castSpell($this->id, $slotIndex, $targetX, $targetY);
            $this->server->pushToPlayer($this, ['type' => 'spell_result', 'result' => $result]);
        }
        else if($action === 'loot_pickup') {
            $lootId = isset($message['lootId']) ? $message['lootId'] : null;
            if ($lootId) {
                $this->server->handleLootPickup($this, $lootId);
            }
        }
        // === TALENTS ===
        else if($action === 'talent_learn') {
            $tree = isset($message['tree']) ? trim((string) $message['tree']) : null;
            $talent = isset($message['talent']) ? trim((string) $message['talent']) : null;
            if ($tree && $talent) {
                $result = $this->server->talentSystem->learnTalent($this->id, $tree, $talent);
                $this->server->pushToPlayer($this, ['type' => 'talent_result', 'action' => 'learn', 'result' => $result]);
            }
        }
        else if($action === 'talent_reset') {
            $result = $this->server->talentSystem->resetTalents($this->id);
            $this->server->pushToPlayer($this, ['type' => 'talent_result', 'action' => 'reset', 'result' => $result]);
        }
        // === CRAFTING ===
        else if($action === 'craft_start') {
            $recipeId = isset($message['recipeId']) ? trim((string) $message['recipeId']) : null;
            if ($recipeId) {
                $result = $this->server->craftingSystem->startCraft($this->id, $recipeId);
                $this->server->pushToPlayer($this, ['type' => 'craft_result', 'action' => 'start', 'result' => $result]);
            }
        }
        else if($action === 'craft_cancel') {
            $result = $this->server->craftingSystem->cancelCraft($this->id);
            $this->server->pushToPlayer($this, ['type' => 'craft_result', 'action' => 'cancel', 'result' => $result]);
        }
        // === PETS ===
        else if($action === 'pet_activate') {
            $petId = isset($message['petId']) ? $message['petId'] : null;
            if ($petId) {
                $result = $this->server->petSystem->activatePet($this->id, $petId);
                $this->server->pushToPlayer($this, ['type' => 'pet_result', 'action' => 'activate', 'result' => $result]);
            }
        }
        else if($action === 'pet_deactivate') {
            $result = $this->server->petSystem->deactivatePet($this->id);
            $this->server->pushToPlayer($this, ['type' => 'pet_result', 'action' => 'deactivate', 'result' => $result]);
        }
        else if($action === 'pet_rename') {
            $petId = isset($message['petId']) ? $message['petId'] : null;
            $newName = isset($message['name']) ? trim((string) $message['name']) : null;
            if ($petId && $newName) {
                $result = $this->server->petSystem->renamePet($this->id, $petId, $newName);
                $this->server->pushToPlayer($this, ['type' => 'pet_result', 'action' => 'rename', 'result' => $result]);
            }
        }
        // === TRADING ===
        else if($action === 'trade_request') {
            $targetId = isset($message['targetId']) ? $message['targetId'] : null;
            if ($targetId) {
                $result = $this->server->tradingSystem->requestTrade($this->id, $targetId);
                $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'request', 'result' => $result]);
            }
        }
        else if($action === 'trade_accept') {
            $result = $this->server->tradingSystem->acceptTrade($this->id);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'accept', 'result' => $result]);
        }
        else if($action === 'trade_decline') {
            $result = $this->server->tradingSystem->declineTrade($this->id);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'decline', 'result' => $result]);
        }
        else if($action === 'trade_add_item') {
            $slot = isset($message['slot']) ? (int) $message['slot'] : -1;
            $result = $this->server->tradingSystem->addItem($this->id, $slot);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'add_item', 'result' => $result]);
        }
        else if($action === 'trade_remove_item') {
            $slot = isset($message['slot']) ? (int) $message['slot'] : -1;
            $result = $this->server->tradingSystem->removeItem($this->id, $slot);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'remove_item', 'result' => $result]);
        }
        else if($action === 'trade_set_gems') {
            $amount = isset($message['amount']) ? (int) $message['amount'] : 0;
            $result = $this->server->tradingSystem->setGems($this->id, $amount);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'set_gems', 'result' => $result]);
        }
        else if($action === 'trade_confirm') {
            $result = $this->server->tradingSystem->confirmTrade($this->id);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'confirm', 'result' => $result]);
        }
        else if($action === 'trade_cancel') {
            $result = $this->server->tradingSystem->cancelTrade($this->id);
            $this->server->pushToPlayer($this, ['type' => 'trade_result', 'action' => 'cancel', 'result' => $result]);
        }
        // === EVENTS / DAILY ===
        else if($action === 'daily_claim') {
            $result = $this->server->eventSystem->claimDailyReward($this->id);
            $this->server->pushToPlayer($this, ['type' => 'daily_result', 'result' => $result]);
        }
        else if($action === 'boss_attack') {
            $bossId = isset($message['bossId']) ? $message['bossId'] : null;
            $damage = isset($message['damage']) ? (int) $message['damage'] : 10;
            if ($bossId) {
                $result = $this->server->eventSystem->damageWorldBoss($bossId, $this->id, $damage);
                // Achievement tracking
                if ($result['success']) {
                    $this->server->achievementSystem->onPlayerAttack($this->id);
                }
            }
        }
        // === LEADERBOARD ===
        else if($action === 'leaderboard_request') {
            $category = isset($message['category']) ? trim((string) $message['category']) : null;
            $this->server->leaderboardSystem->syncLeaderboard($this->id, $category);
        }
        // === ACHIEVEMENTS ===
        else if($action === 'achievements_request') {
            $this->server->achievementSystem->syncAchievements($this->id);
        }
        else if($action == TYPES_MESSAGES_CHECK) {
            $checkpoint = $this->server->map->getCheckpoint($message[1]);
            if($checkpoint) 
            {
                $this->lastCheckpoint = $checkpoint;
            }
        }
        else 
        {
            if(isset($this->messageCallback)) 
            {
                call_user_func($this->messageCallback, $message);
            }
        }
    }
    
    public function onClientClose()
    {
        if(!empty($this->firepotionTimeout)) 
        {
            Timer::del($this->firepotionTimeout);
            $this->firepotionTimeout = 0;
        }
        if(!empty($this->respawnTimeout))
        {
            Timer::del($this->respawnTimeout);
            $this->respawnTimeout = 0;
        }
        Timer::del($this->disconnectTimeout);
        $this->disconnectTimeout = 0;
        if(isset($this->exitCallback)) 
        {
            call_user_func($this->exitCallback);
        }




    }
    
    public function firepotionTimeoutCallback()
    {
        $this->broadcast($this->equip($this->armor)); // return to normal after 15 sec
        $this->firepotionTimeout = 0;
    }
    
    public function destroy()
    {
        $this->forEachAttacker(function($mob) 
        {
            $mob->clearTarget();
        });
        $this->attackers = array();
        
        $this->forEachHater(array($this, 'forEachHaterCallback'));
        $this->haters = array();
    }
    
    public function forEachHaterCallback($mob)
    {
        $mob->forgetPlayer($this->id);
    }
    
    public function getState()
    {
        $basestate = $this->_getBaseState();
        $state = array($this->name, $this->orientation, $this->armor, $this->weapon);
        
        if($this->target) 
        {
            $state[] =$this->target;
        }
        return array_merge($basestate, $state);
    }
    
    public function send($message)
    {
        $this->connection->send($message);
    }
    
    public function broadcast($message, $ignoreSelf = true)
    {
        if($this->broadcastCallback) 
        {
            call_user_func($this->broadcastCallback, $message, $ignoreSelf);
        }
    }
    
    public function broadcastToZone($message, $ignoreSelf = true)
    {
        if($this->broadcastzoneCallback) 
        {
            call_user_func($this->broadcastzoneCallback, $message, $ignoreSelf);
        }
    }
    
    public function onExit($callback)
    {
         $this->exitCallback = $callback;
    }
    
    public function onMove($callback) 
    {
        $this->moveCallback = $callback;
    }
    
    public function onLootMove($callback)
    {
        $this->lootmoveCallback = $callback;
    }
    
    public function onZone($callback) 
    {
        $this->zoneCallback = $callback;
    }
    
    public function onOrient($callback) 
    {
        $this->orientCallback = $callback;
    }
    
    public function onMessage($callback) 
    {
        $this->messageCallback = $callback;
    }
    
    public function onBroadcast($callback) 
    {
        $this->broadcastCallback = $callback;
    }
    
    public function onBroadcastToZone($callback) 
    {
        $this->broadcastzoneCallback = $callback;
    }
    
    public function equip($item) 
    {
        return new Messages\EquipItem($this, $item);
    }
    
    public function addHater($mob) 
    {
        if($mob) {
            if(!(isset($this->haters[$mob->id]))) 
            {
                $this->haters[$mob->id] = $mob;
            }
        }
    }
    
    public function removeHater($mob) 
    {
        if($mob)
        {
            unset($this->haters[$mob->id]);
        }
    }
    
    public function forEachHater($callback) 
    {
        array_walk($this->haters, function($mob) use ($callback) 
        {
            call_user_func($callback, $mob);
        });
    }
    
    public function equipArmor($kind) 
    {
        $this->armor = $kind;
        //$this->armorLevel = Properties::getArmorLevel($kind);
    }
    
    public function equipWeapon($kind) 
    {
        $this->weapon = $kind;
        //$this->weaponLevel = Properties::getWeaponLevel($kind);
    }
    
    public function equipItem($item) 
    {
        if($item) {
            if(Types::isArmor($item->kind)) 
            {
                $this->equipArmor($item->kind);
                $this->updateHitPoints();
                $obj = new Messages\HitPoints($this->maxHitPoints);
                $data = $obj->serialize();
                $this->send(json_encode($data));
            } 
            else if(Types::isWeapon($item->kind)) 
            {
                $this->equipWeapon($item->kind);
            }
        }
    }
    
    public function updateHitPoints() 
    {
        //$this->resetHitPoints(Formulas::hp($this->armorLevel));
    }
    
    public function updatePosition() 
    {
        if($this->requestposCallback) 
        {
            $pos = call_user_func($this->requestposCallback);
            $this->setPosition($pos['x'], $pos['y'], 0,0);
        }
    }
    
    public function onRequestPosition($callback) 
    {
        $this->requestposCallback = $callback;
    }
    
    public function resetTimeout()
    {
        Timer::del($this->disconnectTimeout);
        // 15分钟
        $this->disconnectTimeout = Timer::add(15*60, array($this, 'timeout'), array(), false);
    }
    
    public function timeout()
    {
        $this->connection->send('timeout');
        $this->connection->close('Player was idle for too long');
    }

    public function save()
    {
        //$ret = Db::instance('db1')->select('*')->from('users')->where('id>3')->offset(5)->limit(2)->query();
        //print_r($ret);
    }
}
