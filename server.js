var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//serve static files
app.use(express.static('public'));

//send index since this is a single page app
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

//socket events
io.on('connection', function(socket) {
	console.log('user connected');

	socket.on('disconnect', function() {
		console.log('user disconnected');
	});

	socket.on('chat message', function(msg) {
		console.log(msg);
	});

});

http.listen(3000, function() {
	console.log('Server started on :3000')
});