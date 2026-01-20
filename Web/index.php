<?php 
if(!function_exists('is_mobile'))
{
    function is_mobile()
    {
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
			<div id="hud">
				<button id="player-count" type="button" aria-label="Voir les joueurs connectés">
					<span class="label">Joueurs</span>
					<span id="player-count-value">0</span>
				</button>
				<div id="score-hud">
					<span class="label">Score</span>
					<span id="score-value">0</span>
				</div>
				<div id="gems-hud">
					<span class="label">Gemme</span>
					<span id="gems-value">0</span>
				</div>
				<div id="boost-hud">
					<span class="label">Boost</span>
					<span id="boost-status">Prêt</span>
				</div>
				<button id="profile-button" type="button" aria-label="Profil">
					<span class="profile-icon" aria-hidden="true"></span>
				</button>
			</div>
				<div id="profile-panel" aria-hidden="true">
					<h3>Profil</h3>
					<label for="profile-name">Nom du ver</label>
					<input id="profile-name" type="text" maxlength="24" placeholder="Ton pseudo" />
					<label for="profile-color">Couleur</label>
					<input id="profile-color" type="color" value="#9ad7ff" />
					<div id="color-swatches" aria-label="Couleurs débloquées"></div>
					<button id="profile-save" type="button">Valider</button>
				</div>
			<div id="fps"></div>

			<div id="quest-panel" role="dialog" aria-live="polite">
				<div class="panel-header">
					<h3>Guide du Prologue</h3>
					<button id="quest-close" class="panel-close" type="button" aria-label="Fermer">✕</button>
				</div>
				<p>Bienvenue, aventurier ! Choisis ton nom, explore la zone et découvre les premiers secrets.</p>
				<button id="quest-dismiss" type="button">J'ai compris</button>
			</div>

			<div id="quest-tracker" aria-live="polite">
				<h4>Mission du jour</h4>
				<p id="quest-progress">Collecte 0 / 5 orbes</p>
				<p id="bonus-status">Bonus commun : en carte</p>
			</div>

			<div id="intro-panel" class="is-hidden" role="dialog" aria-live="polite">
				<div class="panel-header">
					<h3>PNJ Ovule</h3>
					<button id="intro-close" class="panel-close" type="button" aria-label="Fermer">✕</button>
				</div>
				<p>Quel est ton nom ? Choisis aussi la couleur de ton ver.</p>
				<label for="intro-name">Nom du ver</label>
				<input id="intro-name" type="text" maxlength="24" placeholder="Ton pseudo" />
				<label for="intro-color">Couleur</label>
				<input id="intro-color" type="color" value="#9ad7ff" />
				<button id="intro-save" type="button">Commencer</button>
			</div>
		
			<input id="chat" type="text" />
			<div id="chatText"></div>
			<div id="chat-log" aria-live="polite"></div>
			<div id="toast-container" aria-live="polite"></div>
			<button id="chat-toggle" type="button" aria-label="Ouvrir le chat">
				<span aria-hidden="true">💬</span>
			</button>

			<div id="player-list-panel" aria-hidden="true">
				<h3>Joueurs connectés</h3>
				<ul id="player-list"></ul>
				<div id="player-list-empty">Aucun joueur disponible.</div>
				<div id="private-message">
					<div id="private-target"></div>
					<input id="private-input" type="text" placeholder="Écrire un message privé" maxlength="120" />
					<button id="private-send" type="button">Envoyer</button>
				</div>
			</div>

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
				Vous êtes déconnecté !
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
		<script src="/js/App.js"></script>
		<script src="/js/main.js"></script>
		
	</body>
</html>
