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
        //{"type":"welcome","id":1499780854}
        //{"type":"update","x":"24.9","y":"-17.3","angle":"4.372","momentum":"0.000","name":"Teou"}
        //{"type":"update","x":"24.9","y":"-17.3","angle":"3.871","momentum":"0.000","name":"Teou"}

        //{"type":"update","id":1499779413,"angle":3.705,"momentum":0,"x":-57,"y":-30.8,"life":1,"name":"Teou","authorized":false}
        //{"type":"move","id":"2","x":"-100.1","y":"34.4","angle":"7.037","momentum":"0.219","name":"Teou","life":"1","authorized":""}
        $output = array(
            "type"      => TYPES_MESSAGES_MOVE,
            'id'        => (int) $this->entity->id + 0,
            'x'         => (int) $this->entity->x + 0,
            'y'         => (int) $this->entity->y + 0,
            'angle'     => (int) $this->entity->angle + 0,
            'momentum'  => (int) $this->entity->momentum + 0,
            'name'      => $this->entity->name,
            'life'      => 1,
            'authorized'=> false
        );

        var_dump($output);

        $str = str_replace('\\', '', $output);
        return $output;
    }
}

