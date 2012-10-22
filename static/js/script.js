/* Author: YOUR NAME HERE
 */
requirejs.config({
	paths : {
		'jquery-ui' : 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.22/jquery-ui.min',
		'socket.io' : '/socket.io/socket.io'
	}
});
require(["jquery", 'jquery-ui', "socket.io"], function($, jqui) {
	$(document).ready(function() {
		var socket = io.connect();
		socket.on('position', function(data) {
			$('#'+data.id).animate(data.pos);
		});
		$('.word').draggable({
			stop : function() {
				socket.emit('position', {
					id : $(this).attr("id"),
					pos : $(this).position()
				});
			}
		});
	});
});
