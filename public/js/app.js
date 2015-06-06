$(document).ready(function() {
	var path = '/'
	var socket = io({path: path + 'socket.io'});
	var username = '';

	$('#username').focus();

	$('#username-form').submit(function() {

		$('.taken').hide();
		//check for empty input
		if($.trim($('#username').val()).length > 0) {
			var usernameCheck = $('#username').val();
			socket.emit('verify name', usernameCheck);
		}
		return false;
	});

	socket.on('username taken', function(usr) {
		$('.taken').show().empty();
		$('.taken').append(usr + ' is already taken, please try another name.');
	});

	socket.on('username available', function(usr) {
		socket.emit('user connect', {'username': usr});
		$('#prompt').hide();
		$('#m').focus();
	});

	$('#chat-form').submit(function() {

		var msg = escapeHtml($.trim($('#m').val()));

		//check for empty input
		if(msg.length > 0) {
			
			//filter for /me
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
		socket.emit('user disconnect', {'username': username});
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

	function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 	}

});
