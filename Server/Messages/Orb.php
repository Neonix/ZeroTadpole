<?php 
/**
 * Orb collection message for synchronization between players
 */
namespace Server\Messages;

class Orb
{
    public $orbId;
    public $playerId;
    
    public function __construct($orbId, $playerId)
    {
        $this->orbId = $orbId;
        $this->playerId = $playerId;
    }
    
    public function serialize()
    {
        return array(
            'type' => 'orb',
            'orbId' => $this->orbId,
            'playerId' => $this->playerId
        );
    }
}
