"use strict";

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
	}
};
