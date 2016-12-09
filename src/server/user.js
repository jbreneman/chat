"use strict";

module.exports = {
    remove: function(user, list) {
		var index = list.indexOf(user);

		if(index != -1) {
			list.splice(index, 1);
		}

		return list;
	},

    add: function(user, list) {
    	list.push(user);
		list.sort();

		return list;
    },

    changeName: function(oldName, newName, list) {
    	var index = list.indexOf(oldName);
		
		list.splice(index, 1);
		list.push(newName);
		list.sort();

		return list;
    }
};