var eyes = require('eyes'),
    haibu = require('haibu');

// Create a new client for communicating with the haibu server
var client = new haibu.drone.Client({
  host: '127.0.0.1',
  port: 9002
});

// A basic package.json for a node.js application on haibu
var app = {
   "user": "dolivari",
   "name": "lusor",
   "domain": "bype.org",
   "repository": {
     "type": "git",
     "url": "git://github.com/davidonet/rrLusor.git",
   },
   "scripts": {
     "start": "lusor.js"
   }
};

// Attempt to start up a new application
client.start(app, function (err, result) {
  if (err) {
    console.log('Error spawning app: ' + app.name);
    return eyes.inspect(err);
  }

  console.log('Successfully spawned app:');
  eyes.inspect(result);
});


client.start(app, function (err, result) {
  eyes.inspect(err);
  eyes.inspect(result);
});