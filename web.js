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
      setTimeout(this.validate(ret),30000);
      return ret;
   };
   
   StringHandler.prototype.incStr = function () {
      if (this.curPos==='')
      {
	  this.curPos = this.charArray[0];
	  console.log(this.curPos);
	  return;
      }
      this.incChar(this.curPos.length-1);
   };
   StringHandler.prototype.incChar = function (index) {
      console.log("incChar, index " + index);
      if (index < 0)
      {
	  var str = this.charArray[0];
	  str = str.concat(this.curPos);
	  console.log("str="+str);
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
      console.log(a);
      this.curPos = this.curPos.substring(0,index) + this.charArray[a+1] + this.curPos.substring(index+1);
      //this.curPos.setCharAt(index,this.charArray[a+1]);
      return;
    };
    StringHandler.prototype.validate = function (string) {
      if (!this.done[string])
      {
	  this.returns.push(string);
      }
    };
    StringHandler.prototype.completed = function (string) {
      this.done[string] = true;
    };