var WebSocketService = function(model, webSocket) {
	var webSocketService = this;
	
	var webSocket = webSocket;
	var model = model;
	
	this.hasConnection = false;

	console.log('-WebSocketService');
	this.welcomeHandler = function(data) {

		webSocketService.hasConnection = true;
		
		model.userTadpole.id = data[1];
		model.tadpoles[data.id] = model.tadpoles[-1];
		delete model.tadpoles[-1];
		
		$('#chat').initChat();
		if($.cookie('todpole_name'))	{
			webSocketService.sendMessage('name:'+$.cookie('todpole_name'));
		}
		else {

			if($.cookie('user'))
				$.cookie('user', $.cookie('user'), {expires:10000});
			else
				$.cookie('user', 'guest', {expires:10000});
		}

		var sendObj = [
			0,
			$.cookie('user'),
		];
		webSocket.send(JSON.stringify(sendObj));
	};
	
	this.updateHandler = function(data) {
		var newtp = false;
		
		if(!model.tadpoles[data[1]]) {
			newtp = true;
			model.tadpoles[data[1]] = new Tadpole();
			model.arrows[data[1]] = new Arrow(model.tadpoles[data[1]], model.camera);
		}
		
		var tadpole = model.tadpoles[data[1]];
		
		if(tadpole.id == model.userTadpole.id) {			
			tadpole.name = git;
			return;
		} else {
			tadpole.name = data[1];
		}
		
		if(newtp) {
			tadpole.x = data[2];
			tadpole.y = data[3];
		} else {
			tadpole.targetX = data[2];
			tadpole.targetY = data[3];
		}
		
		tadpole.angle = data[4];
		tadpole.momentum = data[5];
		
		tadpole.timeSinceLastServerUpdate = 0;
	}
	
	this.messageHandler = function(data) {
		var tadpole = model.tadpoles[data[1]];
		if(!tadpole) {
			return;
		}
		tadpole.timeSinceLastServerUpdate = 0;
		tadpole.messages.push(new Message(data.message));
	}
	
	this.closedHandler = function(data) {
		if(model.tadpoles[data[1]]) {
			delete model.tadpoles[data[1]];
			delete model.arrows[data[1]];
		}
	}
	
	this.redirectHandler = function(data) {
		if (data.url) {
			if (authWindow) {
				authWindow.document.location = data.url;
			} else {
				document.location = data.url;
			}			
		}
	}

	//Selecteur de function
	this.processMessage = function(data) {

		//TODO fix
		data = data[0];

		//Welcome
		if(data[0] == '-1')
			var fn = webSocketService['welcomeHandler'];
		//Movement
		if(data[0] == '4')
			var fn = webSocketService['updateHandler'];

		//var fn = webSocketService[data.type + 'Handler'];

		if (fn) {
			console.log(fn);
			fn(data);
		}

	}
	
	this.connectionClosed = function() {
		webSocketService.hasConnection = false;
		$('#cant-connect').fadeIn(300);
	};
	
	this.sendUpdate = function(tadpole) {
		var sendObj = [
			4,
			tadpole.x.toFixed(1),
			tadpole.y.toFixed(1),
			tadpole.angle.toFixed(3),
			tadpole.momentum.toFixed(3)
		];
		
		if(tadpole.name) {
			sendObj = [
				4,
				//tadpole.name,
				tadpole.x.toFixed(1),
				tadpole.y.toFixed(1),
				tadpole.angle.toFixed(3),
				tadpole.momentum.toFixed(3)
			];
		}
		
		webSocket.send(JSON.stringify(sendObj));
	}
	
	this.sendMessage = function(msg) {
		var regexp = /name: ?(.+)/i;
		if(regexp.test(msg)) {
			model.userTadpole.name = msg.match(regexp)[1];
			$.cookie('todpole_name', model.userTadpole.name, {expires:14});
			return;
		}
		
		var sendObj = [
			'message',
			msg
		];

		webSocket.send(JSON.stringify(sendObj));
	}
	
	this.authorize = function(token,verifier) {

		console.log("authorize");
		var sendObj = [
			'authorize',
			token,
			verifier
		];
		console.log(sendObj);
		webSocket.send(JSON.stringify(sendObj));
	}
}