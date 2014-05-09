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
 * call .completed within .timeout  milliseconds to signal that it has been checked
 */
function StringHandler(str) {
	this.hashString = str;
}
   
StringHandler.prototype.hashString='';
StringHandler.prototype.done = {};
StringHandler.prototype.curPos='';
StringHandler.prototype.timeout=20000;
StringHandler.prototype.returns = [];
StringHandler.prototype.charArray=["a","b","c"];

/* .getNext function:
 * returns next string for processing
 */
StringHandler.prototype.getNext = function () {
	var ret;
	//checks for any strings that timed out
	if (this.returns.length)
	{
		//removes a string from the array
		ret = this.returns[0];
		this.returns = this.returns.splice(1);
	}
	else
	{
		//retrieves current string and increments to next
		ret = this.curPos;
		this.incStr();
	}
	this.done[ret] = false;
	var that = this;
	//setup timeout on string processing
	setTimeout(function(){that.validate(ret)},this.timeout);
	return ret;
};

/* .incStr function:
 * increments .curPos to next string to process
 */
StringHandler.prototype.incStr = function () {
	if (this.curPos==='')
	{
		//first call, set to first value in charArray
		this.curPos = this.charArray[0];
		return;
	}
	this.incChar(this.curPos.length-1);
};
/* .incChar function:
 * recursive helper for .incStr
 */
StringHandler.prototype.incChar = function (index) {
	if (index < 0)
	{
		//overflow; all characters set to last element of charArray; prepend charArray[0]
		var str = this.charArray[0];
		str = str.concat(this.curPos);
		this.curPos = str;
		return;
	}
	if (this.curPos.charAt(index) === this.charArray[this.charArray.length-1])
	{
		//character is equal to the last element of charArray; set to charArray[0] and carry over to next index
		this.curPos = this.curPos.substring(0,index) + this.charArray[0] + this.curPos.substring(index+1);
		this.incChar(index-1);
		return;
	}
	//increment value of character
	var a = this.charArray.indexOf(this.curPos.charAt(index));
	this.curPos = this.curPos.substring(0,index) + this.charArray[a+1] + this.curPos.substring(index+1);
	return;
};
/* .validate function:
 * timeout handler. Adds string to list of strings that were not properly examined.
 */
StringHandler.prototype.validate = function (string) {
	if (!this.done[string])
	{
		this.returns.push(string);
	}
};
/* .completed function:
 * signal that string was properly processed.
 */
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

var handlerArray = [];
var hashingIdx = 0;
var numHashers = 0;
var hashRate = 0;
var HASHES_PER_SET = Math.pow(3, 10);
var CONNECTION_TIMEOUT = 20000;
var UPDATE_DELAY = 25000;
var lastHash = {};
var results = [];
var resString = "";
app.get('/', function(req, res){
	fs.readFile('./index.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
	});
});

app.all('/hashing', function(req, res){
	//check if hash string is defined
	if ( req.query.name )
	{
		var resIdx = indexOfResult(req.query.name);
		//check if hash has already been computed
		if (resIdx === -1)
		{
			//never computed, add to list of jobs if not currently being evaluated
			if (indexOfHash(req.query.name) === -1)
			handlerArray.push(new StringHandler(req.query.name));
		}
		else
		{	//hash computed, prepend result to results listing
			processResult(results[resIdx].hashString,results[resIdx].value,new Date);
		}
	}
	//return compilation of hashing.hbs
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
	//return compilation of admin.hbs
	fs.readFile('./admin.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template({body: resString}));
		
	});
});

app.all('/getload', function(req, res){
	if (handlerArray.length === 0)
	{
		//no work to be done
		res.send({work: false});
	}
	else
	{
		//select hash (round robin)
		hashingIdx = (hashingIdx + 1) % handlerArray.length;
		//send assignment
		res.send({work: true, string: handlerArray[hashingIdx].getNext(), hash: handlerArray[hashingIdx].hashString});
	}
});

app.all('/report', function(req, res){
	console.log('/report');
	var workingIdx = indexOfHash(req.body.hash);
        if (workingIdx === -1)
	{
		res.send(null);
		return;
	}
	handlerArray[workingIdx].completed(req.body.string);
	if (req.body.matched == 'true')
	{
		handlerArray.splice(workingIdx,1);
		processResult(req.body.hash,req.body.matchString,new Date);
	}
	
	var addr = req.body.addr;
	if (!lastHash[addr]) numHashers++;
	hashRate++;
	lastHash[addr] = (new Date()).getTime();
	setTimeout(function(){
		if (lastHash[addr])
		{
			if (((new Date()).getTime() -lastHash[addr])>CONNECTION_TIMEOUT)
			{
				numHashers--;
				console.log(lastHash);
				lastHash[addr] = null;
			}
		}
		hashRate--;
	},UPDATE_DELAY);
	res.send(null);
});

app.all('/stats', function(req, res){
	res.send({numHashers: numHashers, hashRate: (1000*hashRate*HASHES_PER_SET/UPDATE_DELAY)});
});

app.post('/clear', function(req,res){
	handlerArray = [];
});


var port = Number(process.env.PORT || 5000 );
	app.listen(port, function() {
});

	
function indexOfHash(hash)
{
	for (var i = 0; i < handlerArray.length; i++)
	{
		if (handlerArray[i].hashString === hash)
		return i;
	}
	return -1;
}

function indexOfResult(hash)
{
	for (var i = 0; i < results.length; i++)
	{
		if (results[i].hashString === hash)
		return i;
	}
	return -1;
}

function processResult (hash,value,time)
{
	results.unshift({hashString: hash, value: value, time: time});
	var str = hash + ": \"" + value + "\" at " + time + "<br>";
	resString = str.concat(resString);
    
}