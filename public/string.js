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

StringHandler.prototype.firstOfLength = function (num) {
	var str = "";
	for (var i = 0; i < num; i++)
	{
	    str = str.concat(this.charArray[0]);
	}
	return str;
};