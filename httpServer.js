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

var fs = require('fs')

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

app.get('/postgistest', function (req, res) {
	pool.connect(function (err, client, done) {
		if (err) {
			console.log("not able to get connection " + err);
			res.status(400).send(err);
			return;
		}
		console.log('connected to database');
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

app.get('/getPOI', function (req, res) {
	pool.connect(function (err, client, done) {
		if (err) {
			console.log("not able to get connection " + err);
			res.status(400).send(err);
			return;
		}
		// use the inbuilt geoJSON functionality
		// and create the required geoJSON format using a query adapted from here:	http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-	Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018
		// note that query needs to be a single string with no line breaks so builtit up bit by bit
		var querystring = "SELECT 'FeatureCollection' As type,	array_to_json(array_agg(f)) As features FROM ";
		querystring = querystring + "(SELECT 'Feature' As type ,	ST_AsGeoJSON(lg.geom)::json As geometry, ";
		querystring = querystring + "row_to_json((SELECT l FROM (SELECT id,	name, category) As l )) As properties";
		querystring = querystring + " FROM united_kingdom_poi As lg limit	100 ) As f ";
		console.log(querystring);
		client.query(querystring, function (err, result) {
			//call `done()` to release the client back to the pool
			done();
			if (err) {
				console.log(err);
				res.status(400).send(err);
				return;
			}
			res.status(200).send(result.rows);
		});
	});
});

app.get('/getGeoJSON/:tablename/:geomcolumn', function (req, res) {
	pool.connect(function (err, client, done) {
		if (err) {
			console.log("not able to get connection " + err);
			res.status(400).send(err);
		}
		var colnames = "";
		// first get a list of the columns that are in the table
		// use string_agg to generate a comma separated list that can then bepasted into the next query
		var querystring = "select string_agg(colname,',') from ( select	column_name as colname ";
		querystring = querystring + " FROM information_schema.columns as	colname ";
		querystring = querystring + " where table_name = '" + req.params.tablename + "'";
		querystring = querystring + " and column_name	<>'" + req.params.geomcolumn + "') as cols ";
		console.log(querystring);
		// now run the query
		client.query(querystring, function (err, result) {
			//call `done()` to release the client back to the pool
			console.log("trying");
			done();
			if (err) {
				console.log(err);
				res.status(400).send(err);
				return;
			}
			// for (var i =0; i< result.rows.length ;i++) {
			// console.log(result.rows[i].string_agg);
			// }
			thecolnames = result.rows[0].string_agg;
			colnames = thecolnames;
			console.log("the colnames " + thecolnames);
			// now use the inbuilt geoJSON functionality
			// and create the required geoJSON format using a query adapted from	here:
			// http://www.postgresonline.com/journal/archives/267-Creating-	GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th	January 2018
			// note that query needs to be a single string with no line breaks so built it up bit by bit
			var querystring = " SELECT 'FeatureCollection' As type,	array_to_json(array_agg(f)) As features FROM ";
			querystring = querystring + "(SELECT 'Feature' As type ,	ST_AsGeoJSON(lg." + req.params.geomcolumn + ")::json As geometry, ";
			querystring = querystring + "row_to_json((SELECT l FROM (SELECT		" + colnames + ") As l )) As properties";
			querystring = querystring + " FROM " + req.params.tablename + " As lg		limit 100 ) As f ";
			console.log(querystring);
			// run the second query
			client.query(querystring, function (err, result) {
				//call `done()` to release the client back to the pool
				done();
				if (err) {
					console.log(err);
					res.status(400).send(err);
					return;
				}
				res.status(200).send(result.rows);
			});
		});
	});
});
