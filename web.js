var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');
var hbs = require('handlebars');
var app = express();
app.use(cookieParser());
app.use(require("connect").session({ secret: 'keyboard cat'}))
var mongoose = require('mongoose');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {

});
var hashSchema = new mongoose.Schema({
	name: Number
});

var Hash = mongoose.model('Hash', hashSchema);
mongoose.connect('mongodb://localhost/test');


app.get('/', function(req, res){

	var hash = new Hash({
		name: req.query.name
	});
	if( req.query.name !== undefined ) {
		console.log(req.query.name);
		hash.save(function(err, hash) {
			if(err) return console.error(err);
		});
	}
	fs.readFile('./index.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template(hash));
	});
});

app.get('/hashing', function(req, res){
	fs.readFile('./hashing.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
	});
});

app.get('/results', function(req, res){
	fs.readFile('./results.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
	});
});

app.get('/admin', function(req, res){
	fs.readFile('./admin.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
		
	});
});

app.get('/test', function(req,res){
	var hash = new Hash({
		hash: req.query.name
	});
	
	hash.save(function(err, hash) {
		if(err) return console.error(err);
	});
});

var port = Number(process.env.PORT || 5000 );
	app.listen(port, function() {
});
