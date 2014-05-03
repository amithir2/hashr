var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');
var hbs = require('handlebars');
var qs = require('querystring');
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
	var count;
	Hash.count( function(err, size) {
		if (err) return console.error(err);
		// if a hashed string was provided, save to db, otherwise ignore
		if( req.query.name !== undefined && size == 0 ) {
			hash.save(function(err, hash) {
				if(err) return console.error(err);
			});
		}
		else
		{
			Hash.findOne( {}, function(err, obj) {
				if (err) return console.error(err);
				hash = obj;
			});
		}
		fs.readFile('./index.hbs', function(err, data){
			if(err) throw err;
			var template = hbs.compile(data.toString());
			res.send(template(hash));
		});
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
		var hash;
		Hash.findOne( {}, function(err, obj) {
			if (err) return console.error(err);
			hash = obj;
		});
		var template = hbs.compile(data.toString());
		res.send(template(hash));
	});
	// clear Hash from database
	Hash.count( function(err,count) {
		if (err) return console.error(err);
		while ( count > 0 )
		{
			Hash.findOneAndRemove( {}, function(err) {
				if (err) return console.error(err);
			});
			count = count - 1;
		}
	});
});

app.get('/admin', function(req, res){
	fs.readFile('./admin.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
		
	});
});

var port = Number(process.env.PORT || 5000 );
	app.listen(port, function() {
});
