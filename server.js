//setup Dependencies
var connect = require('connect'), express = require('express'), io = require('socket.io'), port = (process.env.PORT || 8081);
var redis = require("redis");
if (process.env.REDISTOGO_URL) {
	var rtg = require("url").parse(process.env.REDISTOGO_URL);
	var red = require("redis").createClient(rtg.port, rtg.hostname);
	red.auth(rtg.auth.split(":")[1]);
} else {
	red = require("redis").createClient(6379, "gator2.lan");
}

var fs = require("fs");

//Setup Express
var server = express.createServer();
server.configure(function() {
	server.set('views', __dirname + '/views');
	server.set('view options', {
		layout : false
	});
	server.use(connect.bodyParser());
	server.use(express.cookieParser());
	server.use(express.session({
		secret : "shhhhhhhhh!"
	}));
	server.use(connect.static(__dirname + '/static'));
	server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next) {
	if ( err instanceof NotFound) {
		res.render('404.jade', {
			locals : {
				title : '404 - Not Found',
				description : '',
				author : ''

			},
			status : 404
		});
	} else {
		res.render('500.jade', {
			locals : {
				title : 'The Server Encountered an Error',
				description : '',
				author : '',
				error : err
			},
			status : 500
		});
	}
});
server.listen(port,process.env.LISTENADDR);

//Setup Socket.IO
var io = io.listen(server);
// assuming io is the Socket.IO server object
io.configure(function() {
	io.set("transports", ["xhr-polling"]);
	io.set("polling duration", 10);
});
io.sockets.on('connection', function(socket) {
	socket.on('position', function(data) {
		socket.broadcast.emit('position', data);
		red.hset(data.id, "left", data.pos.left);
		red.hset(data.id, "top", data.pos.top);
	});
	socket.on('disconnect', function() {
	});
});

server.get('/init', function(req, res) {
	fs.readFile('base.txt', 'utf8', function(err, data) {
		lines = data.split(/\n/);
		var idx = 0;
		red.set("idx", idx);
		lines.forEach(function(l, j) {
			var words = l.split(/\s/);
			var lastwc = 50;
			words.forEach(function(w, i) {
				if ((w != ' ') && (w !== '')) {
					red.hset("w" + idx, 'id', "w" + idx);
					red.hset("w" + idx, 'w', w);
					red.hset("w" + idx, "left", lastwc + (640 * Math.floor(j / 24)));
					red.hset("w" + idx, "top", 50 + 40 * (j % 24));
					red.hset("w" + idx, "rot", (Math.random() * 8) - 4);
					lastwc += (8 + Math.random() * 2) * (w.length + 1);
					red.incr("idx");
					idx++;
				}
			});
		});
		console.log(idx);
		red.get("idx", function(err, data) {

			res.end(data)
		});

	});
});

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/', function(req, res) {
	var multi = red.multi();
	var myWords = [];
	red.get("idx", function(err, idx) {
		for (var i = 0; i < idx; i++) {
			multi.hgetall("w" + i, function(err, ret) {
				if (ret !== null)
					myWords.push(ret);
			});
		}
		multi.exec(function(err, ret) {
			res.render('index.jade', {
				locals : {
					title : 'Poème Magnétique',
					description : 'Your Page Description',
					author : 'Your Name',
					words : myWords
				}
			});
		});
	});
});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res) {
	throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res) {
	throw new NotFound;
});

function NotFound(msg) {
	this.name = 'NotFound';
	Error.call(this, msg);
	Error.captureStackTrace(this, arguments.callee);
}

console.log('Listening on http://0.0.0.0:' + port);
