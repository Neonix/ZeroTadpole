<?php
/**
 * Created by neonix on 11/07/2017.
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
            'x'         => (float) $this->entity->x,
            'y'         => (float) $this->entity->y,
            'angle'     => (float) $this->entity->angle,
            'momentum'  => (float) $this->entity->momentum,
            'name'      => $this->entity->name,
            'life'      => 1,
            'authorized'=> false
        );

        $str = str_replace('\\', '', $output);
        return $output;
    }
}

