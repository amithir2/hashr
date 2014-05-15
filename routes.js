




var handler = require('./public/string.js');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');
var hbs = require('handlebars');
var qs = require('querystring');
var path = require('path');


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

exports.main = function(req, res){
	fs.readFile('./index.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
	});
}

exports.hashing = function(req, res){
	//check if hash string is defined
	if ( req.query.name )
	{
		var resIdx = indexOfResult(req.query.name);
		//check if hash has already been computed
		if (resIdx === -1)
		{
			//never computed, add to list of jobs if not currently being evaluated
			if (indexOfHash(req.query.name) === -1)
			handlerArray.push(new handler.StringHandler(req.query.name));
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
}

exports.results = function(req, res){
	fs.readFile('./results.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template());
	});
}


exports.admin = function(req, res){
	//return compilation of admin.hbs
	fs.readFile('./admin.hbs', function(err, data){
		if(err) throw err;
		var template = hbs.compile(data.toString());
		res.send(template({body: resString}));
		
	});
}

exports.getload = function(req, res){
	if (handlerArray.length === 0)
	{
		//no work to be done
		res.send({work: 0});
	}
	else
	{
		//select hash (round robin)
		hashingIdx = (hashingIdx + 1) % handlerArray.length;
		//send assignment
		res.send({work: 1, string: handlerArray[hashingIdx].getNext(), hash: handlerArray[hashingIdx].hashString});
	}
}

exports.report = function(req, res){
	//determine task of report's origin
	var workingIdx = indexOfHash(req.body.hash);
        if (workingIdx === -1)
	{
		//task not found
		res.send(null);
		return;
	}
	//register the string group as completed
	handlerArray[workingIdx].completed(req.body.string);
	if (req.body.matched === 1 || req.body.matched === "1")
	{
		//match found, remove job from list and process
		handlerArray.splice(workingIdx,1);
		processResult(req.body.hash,req.body.matchString,new Date);
	}
	
	var addr = req.body.addr;
	//if IP not registered as connected, increase number of hashers
	if (!lastHash[addr]) numHashers++;
	//increment hash rate
	hashRate++;
	lastHash[addr] = (new Date()).getTime();
	setTimeout(function(){
		if (lastHash[addr])
		{
			//remove from list of hashers if the client times out
			if (((new Date()).getTime() -lastHash[addr])>CONNECTION_TIMEOUT)
			{
				numHashers--;
				console.log(lastHash);
				lastHash[addr] = null;
			}
		}
		//decrement hash rate
		hashRate--;
	},UPDATE_DELAY);
	res.send(null);
}

exports.stats = function(req, res){
	res.send({numHashers: numHashers, hashRate: (1000*hashRate*HASHES_PER_SET/UPDATE_DELAY)});
}

exports.clear = function(req,res){
	handlerArray = [];
}

	
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