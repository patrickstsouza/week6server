// express is the server that forms part of the nodejs program
var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var privateKey = fs.readFileSync('/home/studentuser/certs/client-key.pem').toString();
var certificate = fs.readFileSync('/home/studentuser/certs/client-cert.pem').toString();
var credentials = { key: privateKey, cert: certificate };
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(4443);

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// serve static files - e.g. html, css
app.use(express.static(__dirname));
