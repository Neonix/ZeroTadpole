<?php
/**
 * Created by PhpStorm.
 * User: Neonix
 * Date: 08/07/2017
 * Time: 03:31
 */
use \Workerman\Worker;

define('GLOBAL_START', true);

// vendor composer, workerman
require_once __DIR__ . '/vendor/autoload.php';
// socket
require_once __DIR__ . '/start_worker.php';
// web
require_once __DIR__ . '/start_web.php';

Worker::runAll();
