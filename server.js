//change this if you have the chat in a subdirectory, this defaults to website root
//needs a trailing slash
var path = '/';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http, {path: path + 'socket.io'});

var usersOnline = [];
var chatLog = [];

app.use(path, express.static('public'));

app.get(path, function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {

	socket.on('verify name', function(name) {
		var usernameTaken = usersOnline.indexOf(name);

		if(usernameTaken == -1) {
			io.to(socket.id).emit('username available', name);
		} else {
			io.to(socket.id).emit('username taken', name);
		}
	});

	socket.on('user connect', function(msg) {

		var connectMsg = msg.username + ' has connected.';

		io.to(socket.id).emit('chat log', chatLog);
		io.emit('chat message', connectMsg);
		logChat(chatLog, connectMsg);

		usersOnline.push(msg.username);
		
		var update = {
			'usernames': usersOnline,
		};
		io.emit('userlist update', update);
	});

	socket.on('user disconnect', function(msg) {

		var disconnectMsg = msg.username + ' has disconnected.';

		io.emit('chat message',  disconnectMsg);
		logChat(chatLog, disconnectMsg);

		var username = usersOnline.indexOf(msg.username);

		if(username != -1) {
			usersOnline.splice(username, 1);
		}

		var update = {
			'usernames': usersOnline,
		};
		io.emit('userlist update', update);
	});

	socket.on('chat message', function(msg) {

		logChat(chatLog, msg);

		io.emit('chat message', escapeHtml(msg));
	});

});

function logChat(log, msg) {
	var chatLogMax = 20;

	log.push(msg);

	if(log.length > chatLogMax) {
		log.shift();
	}

	return log;
}

function escapeHtml(unsafe) {
return unsafe
     .replace(/&/g, "&amp;")
     .replace(/</g, "&lt;")
     .replace(/>/g, "&gt;")
     .replace(/"/g, "&quot;")
     .replace(/'/g, "&#039;");
	}

http.listen(3000, function() {
	console.log('Server started on :3000')
});
