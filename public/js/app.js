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
		socket.emit('user connect', {'username': usr});
		username = usr;
		$('#prompt').hide();
		$('#m').focus();
	});

	$('#chat-form').submit(function() {

		var msg = $.trim($('#m').val());

		//check for empty input
		if(msg.length > 0) {
			
			//filters before we send the stuff
			var slashMe = /^\/me/;

			if(slashMe.test(msg)) {
				msg = msg.replace(slashMe, '*' + username);
			} else {
				msg = username + ': ' + msg;
			}

			socket.emit('chat message', msg);
			$('#m').val('');
		}
		return false;
	});

	//send disconnect message when user leaves page
	$(window).unload(function() {
		if(username) {
			socket.emit('user disconnect', {'username': username});
		}
	});

	socket.on('chat message', function(msg) {
		$('#messages').append('<li>' + msg + '</li>');
		$('#chat').scrollTop($('#chat').prop('scrollHeight'));
	});

	socket.on('chat log', function(messages) {

		messages.forEach(function(message) {
			$('#messages').append('<li>' + message + '</li>');
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

});
