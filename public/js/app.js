$(document).ready(function() {
	var path = '/'
	var socket = io({path: path + 'socket.io'});
	var username = '';

	changeFavicon('img/blue-icon.ico?r=' + parseInt(Math.random() * 10000000000));

	$('#username').focus();

	$('#username-form').submit(function() {

		$('.taken').hide();
		//check for empty input
		if($.trim($('#username').val()).length > 0) {
			socket.emit('verify name', $('#username').val());
		}
		return false;
	});

	socket.on('username taken', function(usr) {
		$('.taken').show().empty();
		$('.taken').append(usr + ' is already taken, please try another name.');
	});

	socket.on('username available', function(usr) {
		socket.emit('user connect', {username: usr});
		username = usr;
		$('#prompt').addClass('fade-out');
		$('#m').focus();
		window.setTimeout(function() {
			$('#prompt').hide();
		}, 600)
	});

	//detect chat message attempt
	$('#chat-form').submit(function() {
		var time = new Date();

		var data = {
			message: $.trim($('#m').val()),
			username: username,
			time: time
		}

		//check for empty input
		if(data.message.length > 0) {
			socket.emit('chat message', data);
			$('#m').val('');
		}
		return false;
	});

	//socket events

	socket.on('chat message', function(data) {
		
		var message = formatMessage(data);

		$('#messages').append(message);
		$('#chat').scrollTop($('#chat').prop('scrollHeight'));

		if(pageHidden) {
			changeFavicon('img/red-icon.ico?r=' + parseInt(Math.random() * 10000000000));
		}

		if(data.hasOwnProperty('refresh') && data.refresh === true) {
			$('#messages').append('<li>Refreshing page in 10 seconds.');
			$('#chat').scrollTop($('#chat').prop('scrollHeight'));
			
			window.setTimeout(function() {
				document.location.reload(true);
			}, 10000)
		}

		if(data.hasOwnProperty('newName')) {
			username = data.newName;
		}
	});

	socket.on('chat log', function(messages) {

		messages.forEach(function(data) {
			var message = formatMessage(data);
			$('#messages').append(message);
		});
		
		$('#chat').scrollTop($('#chat').prop('scrollHeight'));
	});

	socket.on('userlist update', function(update) {
		$('#user-list li').remove();

		var users = update.usernames;
		users.forEach(function(user) {
			$('#user-list ul').append('<li>' + user + '</li>');
		});
		
	});

	//switch favicon when there's a new chat message if the user is not on the page
	var hidden, state, visibilityChange, pageHidden = false; 

	if (typeof document.hidden !== "undefined") {
		hidden = "hidden";
		visibilityChange = "visibilitychange";
		state = "visibilityState";
	} else if (typeof document.mozHidden !== "undefined") {
		hidden = "mozHidden";
		visibilityChange = "mozvisibilitychange";
		state = "mozVisibilityState";
	} else if (typeof document.msHidden !== "undefined") {
		hidden = "msHidden";
		visibilityChange = "msvisibilitychange";
		state = "msVisibilityState";
	} else if (typeof document.webkitHidden !== "undefined") {
		hidden = "webkitHidden";
		visibilityChange = "webkitvisibilitychange";
		state = "webkitVisibilityState";
	}

	$(document).bind(visibilityChange, function() {
		if(document[state] === 'hidden') {
			pageHidden = true;
		} else if(document[state] === 'visible') {
			pageHidden = false;
			changeFavicon('img/blue-icon.ico?r=' + parseInt(Math.random() * 10000000000));
		}

	});

	//detect if computer has just woken up
	var myWorker = new Worker('detectWakeup.js');

	myWorker.onmessage = function (ev) {
		if (ev && ev.data === 'wakeup') {
			document.location.reload(true);
		}
	}

	//builds the chat message based on what data has been passed to the browser
	function formatMessage(data) {
		var message = '<li>';

		if(data.hasOwnProperty('time')) {
			var time = new Date(data.time);
			var hours = formatHours(time.getHours());
			var minutes = formatMinutes(time.getMinutes())

			message += '<span class="time">[' + hours + ':' + minutes + ']</span> ';
		}

		if(data.hasOwnProperty('username')) {
			message += '<span class="username">' + data.username + ':</span> ';
		}

		if(data.hasOwnProperty('message')) {
			message += data.message;
		}

		message += '</li>';

		return message;
	}

	function formatHours(hours) {
		hours = (hours < 12) ? hours : hours - 12;
		return hours = hours || 12;
	}

	function formatMinutes(minutes) {
		return minutes >= 10 ? minutes : '0' + minutes;
	}

	function changeFavicon(src) {
		var link = document.createElement('link'),
		oldLink = document.getElementById('dynamic-favicon');
		link.id = 'dynamic-favicon';
		link.rel = 'shortcut icon';
		link.href = src;

		if (oldLink) {
			document.head.removeChild(oldLink);
		}

		document.head.appendChild(link);
	}

});
