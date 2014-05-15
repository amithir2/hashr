var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');
var hbs = require('handlebars');
var qs = require('querystring');
var path = require('path');
var routes = require('./routes.js');



var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(require('connect').bodyParser());
app.use(cookieParser());
app.use(require("connect").session({ secret: 'keyboard cat'}));

app.get('/', routes.main);

app.all('/hashing', routes.hashing);

app.get('/results', routes.results);

app.get('/admin', routes.admin);

app.all('/getload', routes.getload);

app.all('/report', routes.report);

app.all('/stats', routes.stats);

app.post('/clear', routes.clear);


var port = Number(process.env.PORT || 5000 );
	app.listen(port, function() {
});
