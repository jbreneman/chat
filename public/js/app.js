$(document).ready(function() {
	var path = '/'
	var socket = io({path: path + 'socket.io'});
	var username = '';

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
		$('#prompt').hide();
		$('#m').focus();
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

	//send disconnect message when user leaves page
	$(window).on('beforeunload', function() {
		if(username) {
			socket.emit('user disconnect', {username: username});
		}
	});

	//socket events

	socket.on('chat message', function(data) {
		
		var message = formatMessage(data);

		$('#messages').append(message);
		$('#chat').scrollTop($('#chat').prop('scrollHeight'));

		if(data.hasOwnProperty('refresh') && data.refresh === true) {
			$('#messages').append('<li>Refreshing page in 10 seconds.');
			$('#chat').scrollTop($('#chat').prop('scrollHeight'));
			
			window.setTimeout(function() {
				document.location.reload(true);
			}, 10000)
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
		hours = ( hours < 12 ) ? hours : hours - 12;
		return hours = hours || 12;
	}

	function formatMinutes(minutes) {
		return minutes > 10 ? minutes : 0 + minutes;
	}

});
