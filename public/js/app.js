$(document).ready(function() {
	var socket = io();
	var username = '';

	$('#username').focus();

	$('#username-form').submit(function() {
		//check for empty input
		if($.trim($('#username').val()).length > 0) {
			username = $('#username').val();
			socket.emit('user connect', {'username': username});
			$('#prompt').hide();
			$('#m').focus();
		}
		return false;
	});

	$('#chat-form').submit(function() {

		var msg = escapeHtml($.trim($('#m').val()));

		//check for empty input
		if(msg.length > 0) {
			
			//filter
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

	//print out chat messages
	socket.on('chat message', function(msg) {
		$('#messages').append('<li>' + msg + '</li>');
		$('#chat').animate({
	    	scrollTop: $('#messages li:last-child').offset().top + 'px'
	    }, 50);
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
