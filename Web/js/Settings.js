// Configuration du serveur WebSocket
var Settings = function() {
	var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	var domain = document.domain;
	var port = 8282;
	
	// Configuration flexible pour différents environnements
	var knownDomains = ['workerman.net', 'phpgame.cn'];
	var isKnownDomain = knownDomains.some(function(d) { 
		return domain.indexOf(d) !== -1; 
	});
	
	if (isKnownDomain) {
		// Charge balancing pour les domaines connus
		var servers = knownDomains.filter(function(d) { 
			return domain.indexOf(d) !== -1; 
		});
		var selectedServer = servers[Math.floor(Math.random() * servers.length)];
		this.socketServer = protocol + '//' + selectedServer + ':' + port;
	} else {
		// Utiliser le domaine actuel
		this.socketServer = protocol + '//' + domain + ':' + port;
	}
	
	// Override possible via paramètre URL
	var urlParams = new URLSearchParams(window.location.search);
	var customServer = urlParams.get('ws');
	if (customServer) {
		this.socketServer = customServer;
	}
}
