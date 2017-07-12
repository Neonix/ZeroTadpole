<?php
/**
 * Created by neonix on 11/07/2017.
 */
namespace Server\Messages;

class Despawn
{
    public $entityId = 0;
    public function __construct($entity_id)
    {
        $this->entityId  = $entity_id;
    }
    
    public function serialize()
    {
        $output = array(
            'type'     => 'closed',
            'id'       => (int) $this->entityId,
        );

        return $output;
    }
}

