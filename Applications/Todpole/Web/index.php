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
if(!function_exists('is_mobile'))
{
    function is_mobile()
    {
        //php判断客户端是否为手机
        $agent = $_SERVER['HTTP_USER_AGENT'];
        return (strpos($agent,"NetFront") || strpos($agent,"iPhone") || strpos($agent,"MIDP-2.0") || strpos($agent,"Opera Mini") || strpos($agent,"UCWEB") || strpos($agent,"Android") || strpos($agent,"Windows CE") || strpos($agent,"SymbianOS"));
    }
}
?>
<!doctype html>

<html>
	<head>
		<meta charset="utf-8">
		<title></title>
		<link rel="stylesheet" type="text/css" href="css/main.css" />
		<meta name="viewport" content="initial-scale=1.0; maximum-scale=1.0; minimum-scale=1.0; user-scalable=0;" />

    	<meta name="apple-mobile-web-app-capable" content="YES">
    	<meta name="apple-mobile-web-app-status-bar-style" content="black">
		<link rel="apple-touch-icon" href="/images/apple-touch-icon.png"/>
		<meta property="fb:app_id" content="" />
		<meta name="title" content="!" />
		<meta name="description" content="" />
		<link rel="image_src" href="" / >
	</head>
	<body>
		<canvas id="canvas"></canvas>
		
		<div id="ui">
			<div id="fps"></div>
		
			<input id="chat" type="text" />
			<div id="chatText"></div>

		<?php if(!is_mobile()){?>
			<div id="instructions"><!--
				<h2> </h2>
				<p> <br /> name: XX </p>-->
			</div>
			<aside id="info">
			<section id="share">

			</section>
			<section id="wtf">
			

			</section>
			</aside>
			<?php }?>
            <aside id="frogMode">
                <h3>Frog Mode</h3>
                <section id="tadpoles">
                    <h4>Tadpoles</h4>
                    <ul id="tadpoleList">
                    </ul>
                </section>
                <section id="console">
                    <h4>Console</h4>
                </section>
            </aside>
		
			<div id="cant-connect">
				Can't connect !
			</div>

			<div id="unsupported-browser">
				<p>
					Unsupported Browser <a rel="external" href="http://en.wikipedia.org/wiki/WebSocket">WebSockets</a>.
				</p>
				<ul>										
					<li><a rel="external" href="http://www.google.com/chrome">Google Chrome</a></li>
					<li><a rel="external" href="http://apple.com/safari">Safari 4</a></li>
					<li><a rel="external" href="http://www.mozilla.com/firefox/">Firefox 4</a></li>
					<li><a rel="external" href="http://www.opera.com/">Opera 11</a></li>
				</ul>
				<p>
					<a href="#" id="force-init-button">force-init-button !</a>
				</p>
			</div>
			
		</div>

		<script src="/js/lib/parseUri.js"></script> 
		<script src="/js/lib/modernizr-1.5.min.js"></script>
		<script src="/js/jquery.min.js"></script>
		<script src="/js/lib/Stats.js"></script>
		
		<script src="/js/App.js"></script>
		<script src="/js/Model.js"></script>
		<script src="/js/Settings.js"></script>
		<script src="/js/Keys.js"></script>
		<script src="/js/WebSocketService.js"></script>
		<script src="/js/Camera.js"></script>
		
		<script src="/js/Tadpole.js"></script>
		<script src="/js/TadpoleTail.js"></script>
		<script src="/js/TadpolePunch.js"></script>

		<script src="/js/Message.js"></script>
		<script src="/js/WaterParticle.js"></script>
		<script src="/js/Arrow.js"></script>
		<script src="/js/formControls.js"></script>
		
		<script src="/js/Cookie.js"></script>
		<script src="/js/main.js"></script>
		
	</body>
</html>
