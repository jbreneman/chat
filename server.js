'use strict';

var config = require('./server/config.js'),
	express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http, {path: config.path + 'socket.io'}),
	autolinker = require('autolinker'),
	parseUrls = new autolinker({
		phone: false
		}),
	user = require('./server/user.js'),
	chat = require('./server/chat.js');

//storage variables
var usersOnline = [];
var chatLog = [];
var serverMessage;

app.use(config.path, express.static('public'));

app.get(config.path, function(req, res) {
	res.sendFile('./public/index.html');
});

//----------------------------------
//
//	Handle all incoming connections. User does not connect to chat until choosing name.
//
//----------------------------------

io.on('connection', function(socket) {

	var session = {
		username: undefined
	};

	socket.on('verify name', function(data) {
		var available = chat.nameAvailable(data, usersOnline);

		if(available) {
			io.to(socket.id).emit('username available', data);
		} else {
			io.to(socket.id).emit('username taken', data);
		}
	});

	//----------------------------------
	//
	//	Actual user connection - notifies chat and adds to connected users list
	//
	//----------------------------------

	socket.on('user connect', function(data) {

		if(!data.reconnect) {

			session.username = data.username;

			var connectMsg = {
				message: session.username + ' has connected.',
				time: new Date()
			};

			io.to(socket.id).emit('chat log', chatLog);

			if(serverMessage !== undefined) {
				io.to(socket.id).emit('chat message', {
					message: serverMessage,
					username: config.serverName
				});
			}
			
			io.emit('chat message', connectMsg);

			chat.log(chatLog, connectMsg);
		}

		user.add(session.username, usersOnline);

		io.emit('userlist update', {
			'usernames': usersOnline,
		});

	});

	//----------------------------------
	//
	//	User disconnect - removes from list and notifies chat
	//
	//----------------------------------

	socket.on('disconnect', function() {

		if(session.username !== undefined) {
			var disconnectMsg = {
				message: session.username + ' has disconnected.',
				time: new Date()
			};

			io.emit('chat message', disconnectMsg);
			chat.log(chatLog, disconnectMsg);

			usersOnline = user.remove(session.username, usersOnline);

			io.emit('userlist update', {
				'usernames': usersOnline,
			});
		}
	});

	//----------------------------------
	//
	//	User reconnect
	//
	//----------------------------------

	socket.on('reconnect', function(socket) {

		if(session.username !== undefined) {

			var connectMsg = {
					message: session.username + ' has reconnected.',
					time: new Date()
				};

			io.to(socket.id).emit('chat log', chatLog);

			if(serverMessage !== undefined) {
				io.to(socket.id).emit('chat message', {
					message: serverMessage,
					time: new Date()
				});
			}
			
			io.emit('chat message', connectMsg);
			chat.log(chatLog, connectMsg);

			user.add(session.username, usersOnline);
			
			var update = {
				'usernames': usersOnline,
			};

			io.emit('userlist update', update);
			}

	});

	//----------------------------------
	//
	//	Sends a chat message to client - data format follows. All properties are optional.
	//
	//	data = {
	//		time:
	//		username:
	//		message:
	//	}
	//
	//----------------------------------
	//	TODO: refactor parsing the commands 

	socket.on('chat message', function(data) {

		data.message = chat.escapeHtml(data.message);
		
		if(chat.parseBang(data)) {
			var bang = chat.parseBang(data);

			if(bang.command === 'name') {
				
				if(chat.verifyNameAvailable(bang.newName, usersOnline)) {

					user.changeName(bang.oldName, bang.newName, usersOnline);

					session.username = bang.newName;

					data = {
						message: bang.oldName + ' changed their name to ' + bang.newName,
						time: new Date()
					};

					io.emit('chat message', data);

					chat.log(chatLog, data);

					io.emit('userlist update', {
						'usernames': usersOnline,
					});
				} else {
					io.to(socket.id).emit('chat message', {
						message: bang.newName + ' is already taken, please try another name.',
						time: new Date()
					});
				}

			} else if(bang.command === 'servermsg') {
				serverMessage = bang.message;
				io.to(socket.id).emit('chat message', {
					message: 'Server message changed to ' + bang.message,
					time: new Date()
				});
			}

		} else if(chat.parseSlash(data)) {
			data = chat.parseSlash(data);

			data.message = parseUrls.link(data.message);
			
			chat.log(chatLog, data);

			io.emit('chat message', data);

		} else {
			//fall back to normal message
			data.message = parseUrls.link(data.message);

			chat.log(chatLog, data);

			io.emit('chat message', data);
		}

	});
	
});

http.listen(config.port, function() {
	console.log('Server started on :3000');
});

//server restart 
process.on('SIGTERM', function () {
  console.log('Server restarting...');
  io.emit('chat message', {
  	message: 'Server is restarting...',
  	refresh: true
  });
  process.exit();
});
