var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');
var hbs = require('handlebars');
var qs = require('querystring');
var path = require('path');


/* StringHandler Object:
 * Usage:
 * initialize by passing a prehashed string to crack
 * call .getNext to request a string for testing
 * call .completed within 30 seconds to signal that it has been checked
 */
function StringHandler(str) {
	this.hashString = str;
}
   
StringHandler.prototype.hashString='';
StringHandler.prototype.done = {};
StringHandler.prototype.curPos='';
StringHandler.prototype.returns = [];
StringHandler.prototype.charArray=["a","b","c"];
StringHandler.prototype.getNext = function () {
	var ret;
	if (this.returns.length)
	{
		ret = this.returns[0];
		this.returns = this.returns.splice(1);
	}
	else
	{
		ret = this.curPos;
		this.incStr();
	}
	this.done[ret] = false;
	var that = this;
	setTimeout(function(){that.validate(ret)},5000);
	return ret;
};

StringHandler.prototype.incStr = function () {
	if (this.curPos==='')
	{
		this.curPos = this.charArray[0];
		//console.log(this.curPos);
		return;
	}
	this.incChar(this.curPos.length-1);
};
StringHandler.prototype.incChar = function (index) {
	//console.log("incChar, index " + index);
	if (index < 0)
	{
		var str = this.charArray[0];
		str = str.concat(this.curPos);
		//console.log("str="+str);
		this.curPos = str;
		return;
	}
	if (this.curPos.charAt(index) === this.charArray[this.charArray.length-1])
	{
		this.curPos = this.curPos.substring(0,index) + this.charArray[0] + this.curPos.substring(index+1);
		this.incChar(index-1);
		return;
	}
	var a = this.charArray.indexOf(this.curPos.charAt(index));
	//console.log(a);
	this.curPos = this.curPos.substring(0,index) + this.charArray[a+1] + this.curPos.substring(index+1);
	//this.curPos.setCharAt(index,this.charArray[a+1]);
	return;
};
StringHandler.prototype.validate = function (string) {
        //console.log("string: "+string);
	if (!this.done[string])
	{
		this.returns.push(string);
	}
};
StringHandler.prototype.completed = function (string) {
	this.done[string] = true;
};


var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(require('connect').bodyParser());
app.use(cookieParser());
app.use(require("connect").session({ secret: 'keyboard cat'}))
var mongoose = require('mongoose');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {

});
var hashSchema = new mongoose.Schema({
	name: String,
	stringHandler: mongoose.Schema.Types.Mixed
});

//var Hash = mongoose.model('Hash', hashSchema);
//mongoose.connect('mongodb://localhost/test');

var handlerArray = [];
var numHashers = 0;
var hashRate = 0;
var hashesPerSet = Math.pow(3, 10);
var lastHash = {};
app.get('/', function(req, res){
		if ( req.query.name )
        	handlerArray.push(new StringHandler(req.query.name));
//	var hash = new Hash({
//		name: req.query.name,
//		stringHandler: new StringHandler(req.query.name)
//	});
//	var count;
//	Hash.count( function(err, size) {
//		if (err) return console.error(err);
		// if a hashed string was provided, save to db, otherwise ignore
//		if( req.query.name !== undefined && size == 0 ) {
//			hash.save(function(err, hash) {
//				if(err) return console.error(err);
//			});
//		}
		fs.readFile('./index.hbs', function(err, data){
			if(err) throw err;
			var template = hbs.compile(data.toString());
//			Hash.findOne( {}, function(err, obj) {
//				if (err) return console.error(err);
//				hash = obj;
//				var sh;
//				if( hash !== null ){
//					sh = hash.stringHandler;
//				}
				res.send(template());
//			});
		});
//	});
});

app.all('/hashing', function(req, res){
	fs.readFile('./hashing.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
//		Hash.findOne( {}, function(err, obj) {
//			if (err) return console.error(err);
//			hash = obj;
//			var sh;
//			if( hash !== null ){
//				sh = hash.stringHandler;
//			}
			res.send(template());
//		});
	});
});

app.get('/results', function(req, res){
	fs.readFile('./results.hbs', function(err, data){
		if(err) throw err;
//		var hash;
//		Hash.findOne( {}, function(err, obj) {
//			if (err) return console.error(err);
//			hash = obj;
//		});
		var template = hbs.compile(data.toString());
		res.send(template());
	});
	// clear Hash from database
	// This actually clears the database before we send hash 
	// to ./results.hbs so that is bad
/*	Hash.count( function(err,count) {
		if (err) return console.error(err);
		while ( count > 0 )
		{
			Hash.findOneAndRemove( {}, function(err) {
				if (err) return console.error(err);
			});
			count = count - 1;
		}
	});*/
});

app.get('/admin', function(req, res){
	fs.readFile('./admin.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
		
	});
});

app.all('/getload', function(req, res){
	if (handlerArray.length === 0)
	{
	    res.send({work: false});
		
	}
	else
	{
	    res.send({work: true, string: handlerArray[0].getNext(), hash: handlerArray[0].hashString});
	}
});

app.all('/report', function(req, res){
	//console.log(req.body);
        if ((!handlerArray.length)||(handlerArray[0].hashString !== req.body.hash))
	{
	    res.send(null);
	    return;
	}
	handlerArray[0].completed(req.body.string);
	if (req.body.matched == 'true')
	{
	     handlerArray = handlerArray.splice(1);
	     console.log("hash "+req.body.hash+" solved: "+req.body.matchString);
	    
	}
	
	console.log("finished hashing for string space: " + req.body.string);
	var addr = req.connection.remoteAddress;
	if (!lastHash[addr]) numHashers++;
	hashRate++;
	lastHash[addr] = (new Date()).getTime();
	console.log(lastHash);
	setTimeout(function(){
	    console.log(lastHash);
	    if (lastHash[addr])
	    {
		if (((new Date()).getTime() -lastHash[addr])>15000)
		{
		    numHashers--;
		    console.log(lastHash);
		    lastHash[addr] = null;
		}
	    }
	    hashRate--;
	},20000);
	res.send(null);
});

app.all('/stats', function(req, res){
	res.send({numHashers: numHashers, hashRate: (hashRate*hashesPerSet/30)});
});


var port = Number(process.env.PORT || 5000 );
	app.listen(port, function() {
});

	
function followUp()
{
    
    
    
}
