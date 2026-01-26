<?php
/**
 * Instance Messages
 */
namespace Server\Messages;

class InstanceList 
{
    public $instances;
    public $definitions;
    
    public function __construct($instances, $definitions = [])
    {
        $this->instances = $instances;
        $this->definitions = $definitions;
    }
    
    public function serialize()
    {
        return [
            'type' => 'instance_list',
            'instances' => $this->instances,
            'definitions' => $this->definitions
        ];
    }
}

class InstanceJoined
{
    public $instance;
    
    public function __construct($instance)
    {
        $this->instance = $instance;
    }
    
    public function serialize()
    {
        return [
            'type' => 'instance_joined',
            'instance' => [
                'id' => $this->instance['id'],
                'type' => $this->instance['type'],
                'name' => $this->instance['name'],
                'state' => $this->instance['state'],
                'mapWidth' => $this->instance['mapWidth'],
                'mapHeight' => $this->instance['mapHeight'],
                'pvpEnabled' => $this->instance['pvpEnabled'],
                'mobs' => $this->instance['mobs'] ?? []
            ]
        ];
    }
}

class InstanceCreated
{
    public $instanceId;
    public $instance;
    
    public function __construct($instanceId, $instance)
    {
        $this->instanceId = $instanceId;
        $this->instance = $instance;
    }
    
    public function serialize()
    {
        return [
            'type' => 'instance_created',
            'instanceId' => $this->instanceId,
            'instance' => $this->instance
        ];
    }
}

class InstanceError
{
    public $error;
    
    public function __construct($error)
    {
        $this->error = $error;
    }
    
    public function serialize()
    {
        return [
            'type' => 'instance_error',
            'error' => $this->error
        ];
    }
}

class InstanceReward
{
    public $rewards;
    
    public function __construct($rewards)
    {
        $this->rewards = $rewards;
    }
    
    public function serialize()
    {
        return [
            'type' => 'instance_reward',
            'rewards' => $this->rewards
        ];
    }
}

class InstanceUpdate
{
    public $instanceId;
    public $data;
    
    public function __construct($instanceId, $data)
    {
        $this->instanceId = $instanceId;
        $this->data = $data;
    }
    
    public function serialize()
    {
        return [
            'type' => 'instance_update',
            'instanceId' => $this->instanceId,
            'data' => $this->data
        ];
    }
}

class InstanceLeft
{
    public function serialize()
    {
        return [
            'type' => 'instance_left'
        ];
    }
}
