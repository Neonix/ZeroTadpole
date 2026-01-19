<?php
/**
 * This file is part of workerman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link http://www.workerman.net/
 * @license http://www.opensource.org/licenses/mit-license.php MIT License
 */
namespace Server\Messages;

class PrivateChat
{
    public $player = null;
    public $message = '';

    public function __construct($player, $message)
    {
        $this->player = $player;
        $this->message = $message;
    }
    
    public function serialize()
    {
        return array(
            'type' => 'private',
            'from' => $this->player ? $this->player->id : null,
            'name' => $this->player ? $this->player->name : 'Inconnu',
            'color' => $this->player ? $this->player->color : '#9ad7ff',
            'message' => $this->message
        );
    }
}
