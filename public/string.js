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
StringHandler.prototype.charArray=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"," "];

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
/* .firstOfLength function:
 * return string of length num, where each character is charArray[0]
 */
StringHandler.prototype.firstOfLength = function (num) {
	var str = "";
	for (var i = 0; i < num; i++)
	{
	    str = str.concat(this.charArray[0]);
	}
	return str;
};

exports.StringHandler = StringHandler;