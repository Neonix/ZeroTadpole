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

use Server\Entity;

class Move
{
    /**
     * @var Entity
     */
    public $entity = null;
    public function __construct($entity)
    {
        $this->entity = $entity;
    }
    
    public function serialize()
    {
        //{"type":"update","id":1499779413,"angle":3.705,"momentum":0,"x":-57,"y":-30.8,"life":1,"name":"Teou","authorized":false}
        //{"type":"move","id":"2","x":"-100.1","y":"34.4","angle":"7.037","momentum":"0.219","name":"Teou","life":"1","authorized":""}
        $output = array("type" => TYPES_MESSAGES_MOVE,
            'id' => $this->entity->id,
            'x' => $this->entity->x,
            'y' => $this->entity->y,
            'angle' => $this->entity->angle,
            'momentum' => $this->entity->momentum,
            'name' => $this->entity->name,
            'life'  => 1,
            'authorized'=> false
        );

        $str = str_replace('\\', '', $output);
        return $str;
    }
}

