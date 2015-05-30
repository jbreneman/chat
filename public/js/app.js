$(document).ready(function() {
	var socket = io();

	$('#chat-form').submit(function() {
		if($.trim(('#m').val() === '')) {
			socket.emit('chat message', $('#m').val());
			$('#m').val('');
		}
		return false;
	});

	socket.on('chat message', function(msg) {
		$('#messages').append('<li>' + msg + '</li');
	});

});