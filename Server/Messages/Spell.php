<?php
namespace Server\Messages;

class Spell
{
    public $type = 'spell';
    public $playerId;
    public $spellId;
    public $x;
    public $y;
    public $angle;

    public function __construct($player, $spellId, $x, $y, $angle)
    {
        $this->playerId = $player->id;
        $this->spellId = $spellId;
        $this->x = $x;
        $this->y = $y;
        $this->angle = $angle;
    }

    public function serialize()
    {
        return array(
            $this->type,
            $this->playerId,
            $this->spellId,
            $this->x,
            $this->y,
            $this->angle,
        );
    }
}
