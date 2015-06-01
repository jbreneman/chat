var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//serve static files
app.use(express.static('public'));

//send index since this is an SPA
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

//socket events
io.on('connection', function(socket) {

	socket.on('user connect', function(msg) {
		io.emit('chat message', msg.username + ' has connected.');
		
		var update = {
			'username': msg.username,
			'rm': false
		};
		io.emit('userlist update', update);
	});

	socket.on('user disconnect', function(msg) {
		io.emit('chat message',  msg.username + ' has disconnected.');

		var update = {
			'username': msg.username,
			'rm': true
		};
		io.emit('userlist update', update);
	});

	socket.on('chat message', function(msg) {		
		io.emit('chat message', msg);
	});

});

http.listen(3000, function() {
	console.log('Server started on :3000')
});