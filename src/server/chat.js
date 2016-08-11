'use strict';

module.exports = {
	nameAvailable: function(name, list) {
		var usernameTaken = list.indexOf(name);

		return usernameTaken === -1 ? true : false;
	},

	log: function(log, data) {
		var chatLogMax = 100;

		log.push(data);

		if(log.length > chatLogMax) {
			log.shift();
		}

		return log;
	},

	escapeHtml: function(unsafe) {
		return unsafe
	     .replace(/&/g, '&amp;')
	     .replace(/</g, '&lt;')
	     .replace(/>/g, '&gt;')
	     .replace(/"/g, '&quot;')
	     .replace(/'/g, '&#039;');
	},

	parseSlash: function(data) {
		var slashMe = /^\/me /i;
		var test = slashMe.test(data.message);

		if(test) {
			return {
				message: data.message.replace(slashMe, '*' + data.username + ' '),
				time: data.time
			};
		} else {
			return false;
		}
	},

	parseBang: function(data) {

		//define regex patterns for commands to be parsed
		var commands = [
			/^!name /i,
			/^!servermsg /i
		];

		var commandNames = [
			'name',
			'servermsg'
		];

		for(var i = 0; i < commands.length; i++) {
			var test = commands[i].test(data.message);

			if(test) {

				if(commandNames[i] === 'name') {
					return {
						command: 'name',
						oldName: data.username,
						newName: data.message.replace(commands[i], '')
					};

				} else if(commandNames[i] === 'servermsg') {
					return {
						command: 'servermsg',
						message: data.message.replace(commands[i], '')
					};
				}
			}
		}
		return false;
	}

};
