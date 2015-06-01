$(document).ready(function() {
	var socket = io();
	var username = '';

	$('#username').focus();

	$('#username-form').submit(function() {
		//check for empty input
		if($('#username').val().length > 0) {
			username = $('#username').val();
			socket.emit('user connect', {'username': username});
			$('#prompt').hide();
			$('#m').focus();
		}
		return false;
	});

	$('#chat-form').submit(function() {

		//check for empty input
		if($('#m').val().length > 0) {
			var msg = $('#m').val();
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
		
		if(update.rm === true) {
			$('#user-list li:contains("' + update.username + '")').remove();
		} else {
			$('#user-list ul').append('<li>' + update.username + '</li>');
		}
		
	});

});