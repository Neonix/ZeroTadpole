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
use Workerman\Protocols\Http\Response;
use Workerman\Worker;

require_once __DIR__ . '/vendor/autoload.php';

$webRoot = realpath(__DIR__ . '/Web');
$webRoot = $webRoot === false ? __DIR__ . '/Web' : rtrim($webRoot, DIRECTORY_SEPARATOR);

$configPath = __DIR__ . '/config.json';
$config = file_exists($configPath) ? json_decode(file_get_contents($configPath), true) : array();
$webPort = isset($config['web_port']) ? (int) $config['web_port'] : 8080;

$web = new Worker('http://0.0.0.0:' . $webPort);

$web->count = 1;

$web->name = 'ZeroWeb';

$web->onMessage = static function ($connection, $request) use ($webRoot) {
    $path = rawurldecode($request->path());

    if ($path === '/') {
        $path = '/index.html';
    }

    $relativePath = ltrim($path, '/');
    $fullPath = realpath($webRoot . DIRECTORY_SEPARATOR . $relativePath);

    if ($fullPath !== false && is_dir($fullPath)) {
        $fullPath = realpath($fullPath . DIRECTORY_SEPARATOR . 'index.html');
    }

    $rootPrefix = $webRoot . DIRECTORY_SEPARATOR;
    if (
        $fullPath === false
        || strncmp($fullPath, $rootPrefix, strlen($rootPrefix)) !== 0
        || !is_file($fullPath)
    ) {
        $connection->send(new Response(404, ['Content-Type' => 'text/html; charset=utf-8'], '<h3>404 Not Found</h3>'));
        return;
    }

    $connection->send((new Response())->withFile($fullPath));
};

// 如果不是在根目录启动，则运行runAll方法
if (!defined('GLOBAL_START')) {
    Worker::runAll();
}
