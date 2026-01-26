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
namespace Server;

class Map
{
    public $isLoaded;
    public $width;
    public $height;
    public $tileSize = 16;
    public $collisions;
    /**
     * For large maps we keep collisions as a sparse set instead of building a huge 2D grid.
     * Keys are tile indexes (0-based) for legacy tile maps.
     */
    public $collisionSet = array();
    public $mobAreas;
    public $chestAreas;
    public $staticChests;
    public $staticEntities;
    public $zoneWidth;
    public $zoneHeight;
    public $groupWidth;
    public $groupHeight;
    public $readyFunc;
    public $connectedGroups = array();
    public $grid;
    public $filePath;
    public $checkpoints = array();
    public $startingAreas = array();
    // New-format fields (world_server.json)
    public $spawnPoint = array('x' => 0, 'y' => 0);
    public $zones = array();
    public $npcs = array();
    public $landmarks = array();
    
    public function __construct($filepath)
    {
        $this->filePath = $filepath;
        $this->isLoaded = false;
    }
    
    public function initMap()
    {
        $file = __DIR__.'/../'.$this->filePath;
        if(!file_exists($file))
        {
            echo "$file  doesn't exist.\n";
        }
        $raw = file_get_contents($file);
        $map = json_decode($raw);
        if(!$map)
        {
            throw new \RuntimeException("Invalid JSON map file: {$file}");
        }

        // -----------------------------------------------------------------
        // Compatibility layer: supports both legacy BrowserQuest-like maps
        // and the new ZeroTadpole world_server.json format.
        // -----------------------------------------------------------------

        $this->width = (int)($map->width ?? 0);
        $this->height = (int)($map->height ?? 0);
        $this->tileSize = (int)($map->tilesize ?? ($map->tileSize ?? $this->tileSize));

        $this->collisions = (array)($map->collisions ?? []);
        $this->collisionSet = [];
        if(!empty($this->collisions))
        {
            // Keep a sparse set to avoid allocating huge 2D grids.
            foreach ($this->collisions as $idx) {
                $this->collisionSet[(int)$idx] = true;
            }
        }

        // Legacy fields (may be absent in the new map format)
        $this->mobAreas = (array)($map->roamingAreas ?? []);
        $this->chestAreas = (array)($map->chestAreas ?? []);
        $this->staticChests = (array)($map->staticChests ?? []);
        $this->staticEntities = (array)($map->staticEntities ?? []);

        // New-format fields
        if(isset($map->spawnPoint) && isset($map->spawnPoint->x) && isset($map->spawnPoint->y))
        {
            $this->spawnPoint = ['x' => (float)$map->spawnPoint->x, 'y' => (float)$map->spawnPoint->y];
        }
        $this->zones = (array)($map->zones ?? []);
        $this->npcs = (array)($map->npcs ?? []);
        $this->landmarks = (array)($map->landmarks ?? []);

        $this->isLoaded = true;
        
        // ??
        foreach($this->chestAreas as $id=>$item)
        {
            $this->chestAreas[$id]->id = $id;
        }
        
        // zone groups
        $this->zoneWidth = 28;
        $this->zoneHeight = 12;
        $this->groupWidth = floor($this->width / $this->zoneWidth);
        $this->groupHeight = floor($this->height / $this->zoneHeight);
        
        $this->initConnectedGroups($map->doors ?? []);
        $this->initCheckpoints($map->checkpoints ?? []);
        
        if($this->readyFunc)
        {
            call_user_func($this->readyFunc);
        }
    }
    
    public function ready($callback)
    {
        $this->readyFunc = $callback;
    }
    
    public function titleIndexToGridPosition($tile_num)
    {
        $tile_num -= 1;
        $x = $this->getX($tile_num + 1, $this->width);
        $y = floor($tile_num / $this->width);
        
        return array('x'=> $x, 'y'=> $y);
    }
    
    protected function getX($num, $w) 
    {
        if($num == 0) 
        {
            return 0;
        }
        return ($num % $w == 0) ? $w - 1 : ($num % $w) - 1;
    }
    
    public function GridPositionToTileIndex($x ,$y)
    {
        return ($y * $this->width) + $x + 1;
    }
    
    public function generateCollisionGrid()
    {
        // Legacy tile-based collision grid. The new world map uses a continuous
        // coordinate system and usually has no collisions (open ocean).
        // Building a full 2D PHP array for large maps (e.g. 3000x3000) will
        // explode memory, so we only build the grid for small maps.

        $this->grid = null;
        if(!$this->isLoaded) return;

        if(empty($this->collisions))
        {
            return;
        }

        $totalTiles = (int)$this->width * (int)$this->height;
        $maxGridTiles = 250000; // 500x500 safeguard
        if($totalTiles > $maxGridTiles)
        {
            // Keep sparse set only.
            return;
        }

        $this->grid = array();
        $tile_index = 0;
        $collisions_map = $this->collisionSet ?: array_flip($this->collisions);
        for($i = 0; $i < $this->height; $i++)
        {
            $this->grid[$i] = array();
            for($j = 0; $j < $this->width; $j++)
            {
                $this->grid[$i][$j] = isset($collisions_map[$tile_index]) ? 1 : 0;
                $tile_index += 1;
            }
        }
    }
    
    public function isOutOfBounds($x, $y)
    {
        return $x <= 0 || $x >= $this->width || $y <= 0 || $y >= $this->height;
    }
    
    public function isColliding($x, $y)
    {
        if($this->isOutOfBounds($x, $y)) 
        {
            return false;
        }
        if(is_array($this->grid) && isset($this->grid[$y]) && isset($this->grid[$y][$x]))
        {
            return $this->grid[$y][$x] == 1;
        }
        // Sparse set fallback (legacy tile maps)
        $tile_index = ((int)$y * (int)$this->width) + (int)$x;
        return isset($this->collisionSet[$tile_index]);
    }
    
    public function GroupIdToGroupPosition($id)
    {
        $pos_array =explode('-', $id);
        
        return array('x'=>$pos_array[0], 'y'=>$pos_array[1]);
    }
    
    public function forEachGroup($callback)
    {
        $width = $this->groupWidth;
        $height = $this->groupHeight;
        
        for($x = 0; $x < $width; $x += 1) 
        {
            for($y = 0; $y < $height; $y += 1) 
            {
                call_user_func($callback, $x.'-'.$y);
            }
        }
    }
    
    public function getGroupIdFromPosition($x ,$y)
    {
        $w = $this->zoneWidth;
        $h = $this->zoneHeight;
        $gx = floor(($x - 1) / $w);
        $gy = floor(($y - 1) / $h);
        return $gx.'-'.$gy;
    }
    
    public function getAdjacentGroupPositions($id)
    {
        $position = $this->GroupIdToGroupPosition($id);
        $x = $position['x'];
        $y = $position['y'];
        // surrounding groups
        $list = array(array('x'=>$x-1, 'y'=>$y-1), array('x'=>$x, 'y'=>$y-1), array('x'=>$x+1, 'y'=>$y-1),
        array('x'=>$x-1, 'y'=>$y), array('x'=>$x, 'y'=>$y), array('x'=>$x+1, 'y'=>$y),
        array('x'=>$x-1, 'y'=>$y+1), array('x'=>$x, 'y'=>$y+1), array('x'=>$x+1, 'y'=>$y+1));
        
        // groups connected via doors
        $self = $this;
        if(!empty($this->connectedGroups[$id]))
        {
            array_walk($this->connectedGroups[$id], function ($position) use (&$list, $self){
                // don't add a connected group if it's already part of the surrounding ones.
                if(!Utils::any($list, function($group_pos)use($position, $self) {
                    return $self->equalPositions($group_pos, $position);
                })) $list[] = $position;
            });
        }
        
        return Utils::reject($list, function($pos)use($self) 
        {
            return $pos['x'] < 0 || $pos['y'] < 0 || $pos['x'] >= $self->groupWidth || $pos['y'] >= $self->groupHeight;
        });
    }
    
    public function forEachAdjacentGroup($group_id, $callback)
    {
        if($group_id) 
        {
            $groups = $this->getAdjacentGroupPositions($group_id);
            array_walk($groups, function($pos)use($callback) 
            {
                call_user_func($callback, $pos['x'].'-'.$pos['y']);
            });
        }
    }
    
    public function initConnectedGroups($doors)
    {
        $self = $this;
        $doorsArr = is_array($doors) ? $doors : (array)$doors;
        array_walk($doorsArr, function($door)use($self)
        {
            if(!isset($door->x) || !isset($door->y) || !isset($door->tx) || !isset($door->ty))
            {
                return;
            }
            $group_id = $self->getGroupIdFromPosition($door->x, $door->y);
            $connectedgroup_id = $self->getGroupIdFromPosition($door->tx, $door->ty);
            $connectedPosition = $self->GroupIdToGroupPosition($connectedgroup_id);
        
            if(isset($self->connectedGroups[$group_id])) 
            {
                $self->connectedGroups[$group_id][] =$connectedPosition;
            } 
            else 
            {
                $self->connectedGroups[$group_id] = array($connectedPosition);
            }
        });
    }
    
    public function initCheckpoints($cpList)
    {
        $this->checkpoints = array();
        $this->startingAreas = array();
        $self = $this;
        $cpArr = is_array($cpList) ? $cpList : (array)$cpList;
        $i = 0;
        array_walk($cpArr, function($cp)use($self, &$i) 
        {
            // Legacy format: {id,x,y,w,h,s}
            // New format: {x,y,radius}
            $id = $cp->id ?? ("cp".$i);
            $x = (float)($cp->x ?? 0);
            $y = (float)($cp->y ?? 0);
            $w = isset($cp->w) ? (float)$cp->w : null;
            $h = isset($cp->h) ? (float)$cp->h : null;
            $radius = isset($cp->radius) ? (float)$cp->radius : null;
            $isStarting = isset($cp->s) ? ((int)$cp->s === 1) : true;

            $checkpoint = new Checkpoint($id, $x, $y, $w, $h, $radius, $isStarting);
            $self->checkpoints[$checkpoint->id] = $checkpoint;
            if($checkpoint->isStarting)
            {
                $self->startingAreas[] = $checkpoint;
            }
            $i++;
        });
    }
    
    public function getCheckpoint($id)
    {
        return $this->checkpoints[$id];
    }
    
    public function getRandomStartingPosition()
    {
        $nbAreas = count($this->startingAreas);
        if($nbAreas <= 0)
        {
            // New map format may omit explicit starting areas.
            return ['x' => (float)($this->spawnPoint['x'] ?? 0), 'y' => (float)($this->spawnPoint['y'] ?? 0)];
        }
        $i = rand(0, $nbAreas - 1);
        $area = $this->startingAreas[$i];
        return $area->getRandomPosition();
    }
    
    public function equalPositions($pos1, $pos2)
    {
        return $pos1['x'] == $pos2['x'] && $pos1['y'] == $pos2['y'];
    }
}
