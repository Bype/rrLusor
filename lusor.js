//setup Dependencies
var connect = require('connect'), express = require('express'), io = require('socket.io'), red = require("redis").createClient(6379, "dbserver");

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
server.listen(process.env.PORT || 5010, process.env.LISTENADDR || '127.0.0.1');

//Setup Socket.IO
var io = io.listen(server, {
	log : false
});
// assuming io is the Socket.IO server object
io.configure(function() {
	io.set("polling duration", 10);
	io.set('log level', 0);

});
io.sockets.on('connection', function(socket) {
	socket.on('position', function(data) {
		socket.broadcast.emit('position', data);
		red.select(2, function() {
			red.hset(data.id, "left", data.pos.left);
			red.hset(data.id, "top", data.pos.top);
		});
	});
	socket.on('disconnect', function() {
	});
});

var mongo = require('mongoskin');
var db = mongo.db("mongodb://dbserver/lusor", {
	safe : false
})

db.bind("poems");

server.get('/:name/init', function(req, res) {
	db.poems.findOne({
		poemname : req.params.name
	}, function(err, poem) {
		var data = poem.poemtext;
		lines = data.split(/\n/);
		var idx = 0;
		red.select(2, function() {
			red.set("idx", idx);
			lines.forEach(function(l, j) {
				var words = l.split(/\s/);
				var lastwc = 50;
				words.forEach(function(w, i) {
					if ((w != ' ') && (w !== '')) {
						red.hset(req.params.name + idx, 'id', req.params.name + idx);
						red.hset(req.params.name + idx, 'w', w);
						red.hset(req.params.name + idx, "left", lastwc + (640 * Math.floor(j / 24)));
						red.hset(req.params.name + idx, "top", 50 + 40 * (j % 24));
						red.hset(req.params.name + idx, "rot", (Math.random() * 8) - 4);
						lastwc += (8 + Math.random() * 2) * (w.length + 1);
						red.incr("idx");
						idx++;
					}
				});
			});
			red.get("idx", function(err, data) {
				res.header('Access-Control-Allow-Origin', '*');
				res.end(data)
			});
		});
	});
});

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////


var myWords = [];
server.get('/:name', function(req, res) {
	red.select(2, function() {
		myWords = [];
		var multi = red.multi();
		red.get("idx", function(err, idx) {
			for (var i = 0; i < idx; i++) {
				multi.hgetall(req.params.name + i, function(err, ret) {
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
						words : myWords,
						name : req.params.name
					}
				});
			});
		});
	});
});

server.get('/', function(req, res) {
	res.redirect('/les_quatres_sans_cou_robert_desnos');
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

