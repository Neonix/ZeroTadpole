<?php
/**
 * Elite mob sync message.
 */
namespace Server\Messages;

class EliteMob
{
    public $mob = null;
    public $action = 'update';

    public function __construct($mob, $action = 'update')
    {
        $this->mob = $mob;
        $this->action = $action;
    }

    public function serialize()
    {
        if ($this->action === 'update') {
            return array(
                'type' => 'elite_mob',
                'action' => $this->action,
                'id' => $this->mob['id'],
                'mobType' => $this->mob['mobType'],
                'x' => $this->mob['x'],
                'y' => $this->mob['y'],
                'vx' => $this->mob['vx'] ?? 0,
                'vy' => $this->mob['vy'] ?? 0,
                'angle' => $this->mob['angle'],
                'hp' => $this->mob['hp'],
                'maxHp' => $this->mob['maxHp'],
            );
        }
        return array(
            'type' => 'elite_mob',
            'action' => $this->action,
            'id' => $this->mob['id'],
            'mobType' => $this->mob['mobType'],
            'name' => $this->mob['name'],
            'icon' => $this->mob['icon'],
            'x' => $this->mob['x'],
            'y' => $this->mob['y'],
            'vx' => $this->mob['vx'] ?? 0,
            'vy' => $this->mob['vy'] ?? 0,
            'angle' => $this->mob['angle'],
            'hp' => $this->mob['hp'],
            'maxHp' => $this->mob['maxHp'],
            'damage' => $this->mob['damage'],
            'speed' => $this->mob['speed'],
            'size' => $this->mob['size'],
            'color' => $this->mob['color'],
        );
    }
}
