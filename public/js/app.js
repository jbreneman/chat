'use strict';

jQuery.fn.extend({
	insertAtCaret: function(myValue){
	  return this.each(function(i) {
	    if (document.selection) {
	      //For browsers like Internet Explorer
	      this.focus();
	      var sel = document.selection.createRange();
	      sel.text = myValue;
	      this.focus();
	    }
	    else if (this.selectionStart || this.selectionStart == '0') {
	      //For browsers like Firefox and Webkit based
	      var startPos = this.selectionStart;
	      var endPos = this.selectionEnd;
	      var scrollTop = this.scrollTop;
	      this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
	      this.focus();
	      this.selectionStart = startPos + myValue.length;
	      this.selectionEnd = startPos + myValue.length;
	      this.scrollTop = scrollTop;
	    } else {
	      this.value += myValue;
	      this.focus();
	    }
	  });
	}
});

$(document).ready(function() {
	var path = '/';
	var socket = io({path: path + 'socket.io'});
	var username;
	var restart = false;

	$("#chat").perfectScrollbar();

	//check for name saved locally
	if(localStorage.getItem('username') !== null) {
		username = localStorage.getItem('username');

		socket.emit('user connect', {username: username});
		$('#prompt').hide();
	}

	//make sure the favicon is set to default.
	//random number generated to cache bust
	changeFavicon('img/blue-icon.ico?r=' + parseInt(Math.random() * 10000000000));

	//initial username choice
	$('#username').focus();

	$('#username-form').submit(function() {

		$('.taken').hide();
		//check for empty input
		if($.trim($('#username').val()).length > 0) {
			socket.emit('verify name', $('#username').val());
		}
		return false;
	});

	socket.on('username taken', function(usr) {
		$('.taken').show().empty();
		$('.taken').append(usr + ' is already taken, please try another name.');
	});

	socket.on('username available', function(usr) {

		if($('#save').is(':checked')) {
			localStorage.setItem('username', usr);
		}

		socket.emit('user connect', {username: usr});
		username = usr;
		$('#prompt').addClass('fade-out');
		$('#m').focus();
		window.setTimeout(function() {
			$('#prompt').hide();
		}, 600);
	});

	//detect chat message attempt
	$('#chat-form').submit(function() {
		var time = new Date();

		var data = {
			message: $.trim($('#m').val()),
			username: username,
			time: time
		};

		//check for empty input
		if(data.message.length > 0) {
			socket.emit('chat message', data);
			$('#m').val('');
		}
		return false;
	});

	//Save name checkbox on main chat
	if(localStorage.getItem('username') === null) {
		$('#save-name').prop('checked', false);
	} else {
		$('#save-name').prop('checked', true);
	}

	$('.save-name').click(function() {
		if($('.save-name').is(':checked')) {
			localStorage.setItem('username', username);
		} else {
			localStorage.removeItem('username', username);
		}
	});

	$('.emoji-popout').on('mousedown', function(e) {
		$('#emoji').addClass('active');
		$(this).addClass('active');
	});

	$(document).mouseup(function (e)
	{
	    var container = $(".active");

	    if (!container.is(e.target) && container.has(e.target).length === 0) {
	        container.removeClass('active');
	        $('.emoji-popout').removeClass('active');
	    }
	});

	$('#emoji-search').on('input', function() {
		var param = $(this).val();
		
		$('.emoji').parent().show();

		if(param) {
			$('.emoji:not([data-emoji-tags*=' + param + '])').parent().hide();
		}
		
	});

	$('.emoji-popout').one('click', function(e) {
		e.preventDefault();

		$.getJSON("./js/emoji.json")
			.done(function(data) {
		  		
		  		$('.spinner').hide();
				var emoji = '';
				$.each(data, function( key, val ) {

					if(emojione.toImage(val.shortname) != val.shortname) {
						var keywords = val.shortname + ',';
						$.each(val.keywords, function(k, v) {
							keywords += v + ',';
						});

						keywords = keywords.replace(/(^,)|(,$)/g, "");

						emoji += '<li><a class="emoji" data-emoji-shortname="'+ key + '" data-emoji-tags="' + keywords + '">' + emojione.toImage(val.shortname) + '</a></li>';
					}
				});

				//console.log(items);
				$('#emoji').append('<ul>' + emoji + '</ul>');

				//register emoji button click
				$('.emoji').click(function(e) {
					e.preventDefault();

					var emojiToAdd = $(this).attr('data-emoji-shortname');

					$('#m').insertAtCaret(':' + emojiToAdd + ':');

				});
		 
			});
	});

	//socket events

	socket.on('chat message', function(data) {
		
		var message = formatMessage(data);

		$('#messages').append(message);
		$("#chat").perfectScrollbar('update');
		$('#chat').scrollTop($('#chat').prop('scrollHeight'));

		if(pageHidden) {
			changeFavicon('img/red-icon.ico?r=' + parseInt(Math.random() * 10000000000));
		}

		if(data.hasOwnProperty('refresh') && data.refresh === true) {
			restart = true;
			$('#messages').append('<li>Refreshing page in 5 seconds.');
			$('#chat').scrollTop($('#chat').prop('scrollHeight'));
			
			$('body').fadeOut(4500);
			window.setTimeout(function() {
				document.location.reload(true);
			}, 5000);
		}

		if(data.hasOwnProperty('newName')) {
			username = data.newName;
		}
	});

	socket.on('chat log', function(messages) {

		messages.forEach(function(data) {
			var message = formatMessage(data);
			$('#messages').append(message);
		});
		
		$('#chat').scrollTop($('#chat').prop('scrollHeight'));
	});

	socket.on('userlist update', function(update) {
		$('.user-list li').remove();

		var users = update.usernames;
		users.forEach(function(user) {
			$('.user-list ul').append('<li>' + user + '</li>');
		});
		
	});

	socket.on('disconnect', function() {
		if(!restart) {
			$('#messages').append('<li>You have disconnected from the server. Attempting to reconnect.</li>');
			$('#chat').scrollTop($('#chat').prop('scrollHeight'));
		}
	});

	socket.on('reconnect', function() {
		if(!restart) {
			console.log(username);
			socket.emit('user connect', {
				username: username,
				reconnect: true
			});

			$('#messages').append('<li>You have reconnected to the server.</li>');
			$('#chat').scrollTop($('#chat').prop('scrollHeight'));
		}
	});

	//switch favicon when there's a new chat message if the user is not on the page
	var hidden, state, visibilityChange, pageHidden = false; 

	if (typeof document.hidden !== 'undefined') {
		hidden = 'hidden';
		visibilityChange = 'visibilitychange';
		state = 'visibilityState';
	} else if (typeof document.mozHidden !== 'undefined') {
		hidden = 'mozHidden';
		visibilityChange = 'mozvisibilitychange';
		state = 'mozVisibilityState';
	} else if (typeof document.msHidden !== 'undefined') {
		hidden = 'msHidden';
		visibilityChange = 'msvisibilitychange';
		state = 'msVisibilityState';
	} else if (typeof document.webkitHidden !== 'undefined') {
		hidden = 'webkitHidden';
		visibilityChange = 'webkitvisibilitychange';
		state = 'webkitVisibilityState';
	}

	$(document).bind(visibilityChange, function() {
		if(document[state] === 'hidden') {
			pageHidden = true;
		} else if(document[state] === 'visible') {
			pageHidden = false;
			changeFavicon('img/blue-icon.ico?r=' + parseInt(Math.random() * 10000000000));
		}

	});

	//detect if computer has just woken up
	var myWorker = new Worker('js/detectWakeup.js');

	myWorker.onmessage = function (ev) {
		if (ev && ev.data === 'wakeup') {
			document.location.reload(true);
		}
	};

	//builds the chat message based on what data has been passed to the browser
	function formatMessage(data) {
		var message = '<li>';

		if(data.hasOwnProperty('time')) {
			var time = new Date(data.time);
			var hours = formatHours(time.getHours());
			var minutes = formatMinutes(time.getMinutes());

			message += '<span class="time">[' + hours + ':' + minutes + ']</span> ';
		}

		if(data.hasOwnProperty('username')) {
			message += '<span class="username">' + data.username + ':</span> ';
		}

		if(data.hasOwnProperty('message')) {
			message += '<span class="message">' + data.message + '</span>';
		}

		message += '</li>';

		return emojione.toImage(message);
	}

	//user prefs triggers
	$('.user-prefs__header').click(function() {
		$('.user-prefs__header-center').toggleClass('user-prefs__header-center--show');
		$('.user-prefs__header').toggleClass('user-prefs__header--show');
		$('.user-prefs').toggleClass('user-prefs--show');
	});

	//mobile menu triggers

/*	$('.user-list').click(function() {
		$('.user-list').toggleClass('show-user-list');
		$('.menu').toggleClass('menu--flipped');
	});*/

	//helper functions

	function formatHours(hours) {
		hours = (hours < 12) ? hours : hours - 12;
		return hours || 12;
	}

	function formatMinutes(minutes) {
		return minutes >= 10 ? minutes : '0' + minutes;
	}

	function changeFavicon(src) {
		var link = document.createElement('link'),
		oldLink = document.getElementById('dynamic-favicon');
		link.id = 'dynamic-favicon';
		link.rel = 'shortcut icon';
		link.href = src;

		if (oldLink) {
			document.head.removeChild(oldLink);
		}

		document.head.appendChild(link);
	}

});
