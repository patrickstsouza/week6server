// express is the server that forms part of the nodejs program
var express = require('express');
var path = require("path");
var app = express();

// adding functionality to allow cross-domain queries when PhoneGap is running a server
app.use(function (req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	next();
});


// adding functionality to log the requests
app.use(function (req, res, next) {
	var filename = path.basename(req.url);
	var extension = path.extname(filename);
	console.log("The file " + filename + " was requested.");
	next();
});


// add an http server to serve files to the Edge browser 
// due to certificate issues it rejects the https files if they are not
// directly called in a typed URL
var http = require('http');
var httpServer = http.createServer(app);
httpServer.listen(4480);

// the / indicates the path that you type into the server - in this case, what happens when you type in:  http://developer.cege.ucl.ac.uk:32560/xxxxx/xxxxx
app.get('/:name1', function (req, res) {
	// run some server-side code
	// the console is the command line of your server - you will see the console.log values in the terminal window
	console.log('request ' + req.params.name1);

	// the res is the response that the server sends back to the browser - you will see this text in your browser window
	res.sendFile(__dirname + '/' + req.params.name1);
});

// read in the file and force it to be a string by adding “” at the beginning
var configtext = "" + fs.readFileSync("/home/studentuser/certs/postGISConnection.js");

// now convert the configruation file into the correct format -i.e. a name/value pair array
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
	var split = configarray[i].split(':');
	config[split[0].trim()] = split[1].trim();
}
console.log(`database connection object: ${JSON.stringify(config, null, 2)}`)

var pg = require('pg');
var pool = new pg.Pool(config);

app.get('postgistest', function (req, res) {
	pool.connect(function (err, client, done) {
		if (err) {
			console.log("not able to get connection " + err);
			res.status(400).send(err);
		}
		client.query('SELECT name FROM united_kingdom_counties'
			, function (err, result) {
				done();
				if (err) {
					console.log(err);
					res.status(400).send(err);
				}
				res.status(200).send(result.rows);
			});
	});
});