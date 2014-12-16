$(document).ready(function() {
    var socket = io.connect();
    socket.on('position', function(data) {
        $('#' + data.id).animate(data.pos);
    });
    $('.word').draggable({
        stop: function() {
            socket.emit('position', {
                id: $(this).attr("id"),
                pos: $(this).position()
            });
        }
    });

});
