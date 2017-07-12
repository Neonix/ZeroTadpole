<?php
/**
 * Created by PhpStorm.
 * User: Neonix
 * Date: 08/07/2017
 * Time: 03:31
 */
use \Workerman\Worker;

define('GLOBAL_START', true);
ini_set('display_errors', 'on');


if(strpos(strtolower(PHP_OS), 'win') === 0)
{
    exit("start.php not support windows, please use start_for_win.bat\n");
}

if(!extension_loaded('pcntl'))
{
    exit("Please install pcntl extension. See http://doc3.workerman.net/install/install.html\n");
}

if(!extension_loaded('posix'))
{
    exit("Please install posix extension. See http://doc3.workerman.net/install/install.html\n");
}


// vendor composer, workerman
require_once __DIR__ . '/vendor/autoload.php';
// socket
require_once __DIR__ . '/start_worker.php';
// web
require_once __DIR__ . '/start_web.php';

Worker::runAll();
