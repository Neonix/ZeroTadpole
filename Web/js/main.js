var settings;
window.debug = false;
var startApp = function() {
var isStatsOn = true;

var authWindow;

var app;
var setAppHeight = function() {
	document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
};
var resizeFrame;
var handleResize = function() {
	setAppHeight();
	if (app) {
		if (resizeFrame) {
			cancelAnimationFrame(resizeFrame);
		}
		resizeFrame = requestAnimationFrame(function() {
			app.resize();
		});
	}
};
var runLoop = function() {
	app.update();
	app.draw();
}
var initApp = function() {
	if (app!=null) { return; }
	app = new App(settings, document.getElementById('canvas'));
	window.app = app;

	setAppHeight();
	window.addEventListener('resize', handleResize, false);
	window.addEventListener('orientationchange', handleResize, false);

	document.addEventListener('mousemove', 		app.mousemove, false);
	document.addEventListener('mousedown', 		app.mousedown, false);
	document.addEventListener('mouseup',			app.mouseup, false);
	
	document.addEventListener('touchstart',   app.touchstart, false);
	document.addEventListener('touchend',     app.touchend, false);
	document.addEventListener('touchcancel',  app.touchend, false);
	document.addEventListener('touchmove',    app.touchmove, false);	

	document.addEventListener('keydown',    app.keydown, false);
	document.addEventListener('keyup',    app.keyup, false);

	document.addEventListener('keypress', app.console, false);



	setInterval(runLoop,30);
}

var forceInit = function() {
	initApp()
	document.getElementById('unsupported-browser').style.display = "none";
	return false;
}

if(Modernizr.canvas && Modernizr.websockets) {
	initApp();
} else {
	document.getElementById('unsupported-browser').style.display = "block";	
	document.getElementById('force-init-button').addEventListener('click', forceInit, false);
}

var addStats = function() {
	if (isStatsOn) { return; }
	// Draw fps
	var stats = new Stats();
	document.getElementById('fps').appendChild(stats.domElement);

	setInterval(function () {
	    stats.update();
	}, 1000/60);

	// Array Remove - By John Resig (MIT Licensed)
	Array.remove = function(array, from, to) {
	  var rest = array.slice((to || from) + 1 || array.length);
	  array.length = from < 0 ? array.length + from : from;
	  return array.push.apply(array, rest);
	};
	isStatsOn = true;
}

document.addEventListener('keydown',function(e) {
	if(e.which == 27) {
		addStats();
	}
})

if(debug) { addStats(); }

$(function() {
	$('a[rel=external]').click(function(e) {
		e.preventDefault();
		window.open($(this).attr('href'));
	});

	var profileButton = $('#profile-button');
	var profilePanel = $('#profile-panel');
	var profileName = $('#profile-name');
	var profileColor = $('#profile-color');
	var profileSave = $('#profile-save');
	var introPanel = $('#intro-panel');
	var introName = $('#intro-name');
	var introColor = $('#intro-color');
	var introSave = $('#intro-save');
	var questPanel = $('#quest-panel');
	var questClose = $('#quest-close');
	var introClose = $('#intro-close');
	var savedName = localStorage.getItem('tadpole_name') || $.cookie('todpole_name');
	var savedColor = localStorage.getItem('tadpole_color') || $.cookie('tadpole_color') || '#9ad7ff';
	var savedPalette = JSON.parse(localStorage.getItem('tadpole_colors') || '[]');
	var hasSeen = localStorage.getItem('tadpole_has_seen');
	if (savedName) {
		profileName.val(savedName);
		introName.val(savedName);
		introName.prop('disabled', true);
		localStorage.setItem('tadpole_has_seen', '1');
		hasSeen = '1';
	}
	profileColor.val(savedColor);
	introColor.val(savedColor);
	document.documentElement.style.setProperty('--tadpole-color', savedColor);
	if (hasSeen) {
		questPanel.addClass('is-hidden');
	}

	profileButton.on('click', function() {
		profilePanel.toggleClass('is-open');
		profilePanel.attr('aria-hidden', !profilePanel.hasClass('is-open'));
		if (profilePanel.hasClass('is-open')) {
			profileName.focus();
		}
	});

	profileColor.on('input', function() {
		document.documentElement.style.setProperty('--tadpole-color', profileColor.val());
	});

	introColor.on('input', function() {
		document.documentElement.style.setProperty('--tadpole-color', introColor.val());
	});

	var swatchContainer = $('#color-swatches');
	var renderSwatches = function(colors) {
		swatchContainer.empty();
		colors.forEach(function(color) {
			var swatch = $('<button type="button" class="color-swatch"></button>');
			swatch.css('background', color);
			swatch.on('click', function() {
				profileColor.val(color);
				introColor.val(color);
				document.documentElement.style.setProperty('--tadpole-color', color);
			});
			swatchContainer.append(swatch);
		});
	};

	if (!savedPalette.length) {
		savedPalette = ['#9ad7ff'];
		localStorage.setItem('tadpole_colors', JSON.stringify(savedPalette));
	}
	renderSwatches(savedPalette);

	window.addUnlockedColor = function(color) {
		if (savedPalette.indexOf(color) === -1) {
			savedPalette.push(color);
			localStorage.setItem('tadpole_colors', JSON.stringify(savedPalette));
			renderSwatches(savedPalette);
		}
	};

	profileSave.on('click', function() {
		var name = $.trim(profileName.val());
		var color = profileColor.val();
		if (!name) {
			return;
		}
		$.cookie('todpole_name', name, {expires:14});
		$.cookie('tadpole_color', color, {expires:14});
		localStorage.setItem('tadpole_name', name);
		localStorage.setItem('tadpole_color', color);
		document.documentElement.style.setProperty('--tadpole-color', color);
		if (app) {
			app.sendMessage('name:' + name);
			app.sendMessage('color:' + color);
		}
		profilePanel.removeClass('is-open').attr('aria-hidden', 'true');
	});

	introSave.on('click', function() {
		var name = $.trim(introName.val());
		var color = introColor.val();
		if (!name && !savedName) {
			return;
		}
		if (name) {
			profileName.val(name);
		}
		profileColor.val(color);
		if (name) {
			$.cookie('todpole_name', name, {expires:14});
			localStorage.setItem('tadpole_name', name);
			savedName = name;
		}
		localStorage.setItem('tadpole_has_seen', '1');
		$.cookie('tadpole_color', color, {expires:14});
		localStorage.setItem('tadpole_color', color);
		document.documentElement.style.setProperty('--tadpole-color', color);
		if (app) {
			if (name) {
				app.sendMessage('name:' + name);
			}
			app.sendMessage('color:' + color);
		}
		introPanel.addClass('is-hidden');
		questPanel.addClass('is-hidden');
	});

	window.openNpcDialog = function() {
		introPanel.removeClass('is-hidden');
		if (window.npcSpeak) {
			window.npcSpeak();
		}
		if (savedName) {
			introName.prop('disabled', true);
		} else {
			introName.prop('disabled', false);
		}
	};

	introClose.on('click', function() {
		introPanel.addClass('is-hidden');
	});

	var chatToggle = $('#chat-toggle');
	var chatInput = $('#chat');
	var questDismiss = $('#quest-dismiss');
	var playerCount = $('#player-count');
	var playerListPanel = $('#player-list-panel');
	var playerList = $('#player-list');
	var privateTarget = $('#private-target');
	var privateInput = $('#private-input');
	var privateSend = $('#private-send');
	var selectedPlayerId = null;

	chatToggle.on('click', function() {
		$('body').toggleClass('chat-open');
		if ($('body').hasClass('chat-open')) {
			chatInput.focus();
		} else {
			chatInput.blur();
		}
	});

	$(document).on('keydown', function(e) {
		if (e.defaultPrevented || $('body').hasClass('chat-open')) {
			return;
		}
		var targetTag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
		if (targetTag === 'input' || targetTag === 'textarea') {
			return;
		}
		if (e.key === 'Enter' || e.key === 't' || e.key === 'T') {
			e.preventDefault();
			$('body').addClass('chat-open');
			chatInput.focus();
		}
	});

	questDismiss.on('click', function() {
		$('#quest-panel').addClass('is-hidden');
		localStorage.setItem('tadpole_has_seen', '1');
	});

	questClose.on('click', function() {
		questPanel.addClass('is-hidden');
		localStorage.setItem('tadpole_has_seen', '1');
	});

	playerCount.on('click', function() {
		playerListPanel.toggleClass('is-open');
		playerListPanel.attr('aria-hidden', !playerListPanel.hasClass('is-open'));
		if (playerListPanel.hasClass('is-open') && app) {
			app.requestPlayerList();
		}
	});

	playerList.on('click', 'li', function() {
		selectedPlayerId = $(this).data('player-id');
		var playerName = $(this).data('player-name');
		privateTarget.text('Message privé à ' + playerName);
		privateInput.focus();
	});

	privateSend.on('click', function() {
		var message = $.trim(privateInput.val());
		if (!message || !selectedPlayerId) {
			return;
		}
		if (app) {
			app.sendPrivateMessage(selectedPlayerId, message);
		}
		privateInput.val('');
	});

	privateInput.on('keydown', function(e) {
		if (e.keyCode === 13) {
			privateSend.click();
		}
	});
});

document.body.onselectstart = function() { return false; }
};

var initSettings = function() {
	settings = new Settings();
	startApp();
};

window.addEventListener('load', function() {
	if (typeof Settings === 'undefined') {
		var settingsScript = document.createElement('script');
		settingsScript.src = '/js/Settings.js';
		settingsScript.onload = initSettings;
		document.head.appendChild(settingsScript);
	} else {
		initSettings();
	}
});
