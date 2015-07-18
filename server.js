//change this if you have the chat in a subdirectory, this defaults to website root
//needs a trailing slash
var path = '/';

var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http, {path: path + 'socket.io'}),
	autolinker = require('autolinker'),
	parseUrls = new autolinker({
		phone: false
		});

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

	socket.on('user connect', function(data) {

		var connectMsg = {
				message: data.username + ' has connected.',
				time: new Date()
			};

		io.to(socket.id).emit('chat log', chatLog);
		io.emit('chat message', connectMsg);
		logChat(chatLog, connectMsg);

		usersOnline.push(data.username);
		
		var update = {
			'usernames': usersOnline,
		};
		io.emit('userlist update', update);
	});

	socket.on('user disconnect', function(data) {

		var disconnectMsg = {
			message: data.username + ' has disconnected.',
			time: new Date()
		}

		io.emit('chat message', disconnectMsg);
		logChat(chatLog, disconnectMsg);

		var username = usersOnline.indexOf(data.username);

		if(username != -1) {
			usersOnline.splice(username, 1);
		}

		var update = {
			'usernames': usersOnline,
		};
		io.emit('userlist update', update);
	});

	socket.on('chat message', function(data) {

		data.message = parseUrls.link(escapeHtml(data.message));

		data = parseCommands(data);

		logChat(chatLog, data);

		io.emit('chat message', data);
	});

});

function logChat(log, data) {
	var chatLogMax = 100;

	log.push(data);

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

function parseCommands(data) {
	var slashMe = /^\/me/;
	var test = slashMe.test(data.message);

	if(test) {
		return {
			message: data.message.replace(slashMe, '*' + data.username),
			time: data.time
		}
	} else {
		return data;
	}
}

http.listen(3000, function() {
	console.log('Server started on :3000')
});

//server restart 
process.on('SIGINT', function () {
  console.log('Server restarting...');
  io.emit('chat message', {
  	message: 'Server is restarting...',
  	refresh: true
  });
  process.exit();
});