<?php
/**
 * Checkpoint / Starting area representation.
 *
 * Supports two map formats:
 * - Legacy: rectangle areas defined with (x, y, w, h) (+ optional s flag)
 * - New: circular areas defined with (x, y, radius)
 */
namespace Server;

class Checkpoint
{
    public string $id;
    public float $x;
    public float $y;
    public ?float $width;
    public ?float $height;
    public ?float $radius;
    public bool $isStarting;

    public function __construct($id, $x, $y, $width = null, $height = null, $radius = null, $isStarting = false)
    {
        $this->id = (string)$id;
        $this->x = (float)$x;
        $this->y = (float)$y;
        $this->width = $width !== null ? (float)$width : null;
        $this->height = $height !== null ? (float)$height : null;
        $this->radius = $radius !== null ? (float)$radius : null;
        $this->isStarting = (bool)$isStarting;

        // Convenience: if only radius is provided, width/height can be derived.
        if ($this->radius !== null && $this->width === null && $this->height === null) {
            $this->width = $this->radius * 2;
            $this->height = $this->radius * 2;
        }
    }

    /**
     * Returns a random position inside the checkpoint.
     * - If radius is set: uniform random point inside circle (x,y is the center).
     * - Else: uniform random point inside rectangle (x,y is the top-left corner).
     */
    public function getRandomPosition(): array
    {
        if ($this->radius !== null) {
            $u = mt_rand() / mt_getrandmax();
            $v = mt_rand() / mt_getrandmax();
            $angle = 2.0 * M_PI * $u;
            // sqrt for uniform distribution over the disk
            $r = sqrt($v) * $this->radius;
            return [
                'x' => $this->x + cos($angle) * $r,
                'y' => $this->y + sin($angle) * $r,
            ];
        }

        $w = $this->width ?? 0.0;
        $h = $this->height ?? 0.0;
        $rx = mt_rand() / mt_getrandmax();
        $ry = mt_rand() / mt_getrandmax();

        return [
            'x' => $this->x + $rx * $w,
            'y' => $this->y + $ry * $h,
        ];
    }
}
