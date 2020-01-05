(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// Author: Maxwell Li
// Date: 2019.05.28
// This is the source file
// To load this file into html, run "watchify -t brfs js/blog-post.js -o js/blog-bundle.js"


var path = require('path');

// define some global variables
var blogPerPage = 3;
var currPage = 1;
var numPage;
var month = new Map([
	["01", "Januray"],
	["02", "Feburary"],
	["03", "March"],
	["04", "April"],
	["05", "May"],
	["06", "June"],
	["07", "July"],
	["08", "August"],
	["09", "September"],
	["10", "October"],
	["11", "November"],
	["12", "December"]
]);
var MODE = {
    INDEX: 0,
    TAG: 1,
    SEARCH: 2
}
var blogs = [];
var keyword;
var mode;
var error;

// jQuery main execution function
$(function(){
	init_page();
});

/**************************************** homepage logic ****************************************************/
// function to determine how many pages we need for blogs based on the number of blogs
function init_page(){
	// find the keyword we received
	// by default, index page doesn't have a keyword (mode undefined)
	// if we have a keyword, then show only blogs related to keyword and hide the paginator (mode = tag or search)
	var searchParam = window.location.search;
	if (searchParam.includes("tag")){
		console.log("tag mode")
		keyword = searchParam.substring(searchParam.indexOf("=")+1,searchParam.length);
		mode = MODE.TAG;
	}
	else if (searchParam.includes("keyword")){
		console.log("search mode")
		keyword = searchParam.substring(searchParam.indexOf("=")+1,searchParam.length);
		mode = MODE.SEARCH;
	}
	else{
		console.log(mode)
		mode = MODE.INDEX;
	}
	// change %20 to space
	if (keyword){
		keyword = keyword.replace("%20"," ");
	}
	console.log("tag is " + keyword);

	// initialize error message flag to be true
	error = true;

	// find all blogs
	var blogs = search_blog();
	blogs = blogs.reverse(); // by default, unix system will already sort the posts in natural order

	// find number of pages needed
	numPage = Math.ceil(blogs.length/blogPerPage);

	// if only one page needed, disable paginator
	// if in tag/search mode, disable paginator
	if (numPage >0 && mode == MODE.INDEX){
		setup_pagination();
	}

	setup_page();
}

// function to find all the blog posts
function search_blog() {
	var files = ["2019_01_23_sample_post","2019_05_21_sample_post","2019_05_23_sample_post","2019_12_01_sample_post","default.jpg"];

	for(var i in files) {
		if(path.extname(files[i]) === "") {
   			blogs.push(files[i] + "/post.html");
   			console.log(files[i] + "/post.html")
   		}
   	}

   	return blogs;
}

// function to setup page
function setup_page(){
	// zero-index currPage
	var index = (currPage-1)*blogPerPage;

	// make sure index in range
	if (index < 0 || index >= blogs.length){
		console.log("error!");
	}
	else{
		// find the interation length based on if we are in tag/search mode
		var iterationLength;
		if (mode == MODE.INDEX) { // we are in index page, show blogPerPage blogs
			iterationLength = Math.min(index+blogPerPage,blogs.length);
			console.log("index");
		}
		else{ // we are in the other two modes, show all blogs containing the same keyword, therefore we iterating all of the blogs
			iterationLength = blogs.length;
		}
		// load up to blogPerPage blogs (not if the maximum number of blogs have reached)
		for (i = index; i < iterationLength; i++){
			document.getElementById('card-list-placeholder').innerHTML += '<div class="card mb-4" id="post_'+i.toString()+'"></div>';
			parse_html("./posts/"+blogs[i],i); // parse html
		}
	}
}

function setup_pagination(){
	$("#paginator").html('<div id="paginator-placeholder"></div>');
	// disable newer when no more newer blogs
	if (currPage == 1){
		$("#paginator-placeholder").before('<li class="page-item disabled" id="newer_button"><a class="page-link" href="javascript:on_newer_blog()">&larr; Newer</a></li>');
	}
	else{
		$("#paginator-placeholder").before('<li class="page-item" id="newer_button"><a class="page-link" href="javascript:on_newer_blog()">&larr; Newer</a></li>');
	}

	// page number
	for (i = 1; i<= numPage; i++){
		// make current page active
		if (currPage == i){
			$("#paginator-placeholder").before('<li class="page-item active"><a class="page-link" href="javascript:on_page_number('+i+')">'+i+'</a></li>');
		}
		else{
			$("#paginator-placeholder").before('<li class="page-item"><a class="page-link" href="javascript:on_page_number('+i+')">'+i+'</a></li>');
		}

	}

	// disable older when no more older blogs
	if (currPage == numPage){
		$("#paginator-placeholder").before('<li class="page-item disabled" id="older_button"><a class="page-link" href="javascript:on_older_blog()">Older &rarr;</a></li>');
	}
	else{
		$("#paginator-placeholder").before('<li class="page-item" id="older_button"><a class="page-link" href="javascript:on_older_blog()">Older &rarr;</a></li>');
	}
}


/**************************************** blog logic ****************************************************/
// parse info of html
function parse_html(file,index){
	// initialize the reader
	var xhr = new XMLHttpRequest();

	// add event listener
    xhr.addEventListener("load", function() {
    	load_card(xhr.response,file,index); // callback to load_card
    }, false);

    // open file and send even
    xhr.open('GET', file);
    xhr.send();
}

// function to load cards from post htmls
function load_card(content,file,i) {
	// read content as html
	parser = new DOMParser();
	htmlDoc = parser.parseFromString(content,"text/html");

	card = document.getElementById('post_'+i.toString())

	if (mode == MODE.INDEX || check_tag(mode,keyword) ||  check_search(mode,keyword)){ // we are in index page or keyword matches, show
		var image = file.replace("post.html","cover.jpg");
		var date = file.slice(8,18);
		date = date.split("_");

		// add image
		card.innerHTML += '<img class="card-img-top" src="'+
						image+
						'" alt="Card image cap"/>'; //http://placehold.it/750x300
		// add title
		card.innerHTML += '<div class="card-body">'+
					   	'<h2 class="card-title" align-items-center>'+
						htmlDoc.getElementById("title").childNodes[0].nodeValue+
						'</h2>';
		// // add subheading
		// document.getElementById('post_'+i.toString()).innerHTML += '<p class="card-text">'+
		// 															htmlDoc.getElementById("subheading").childNodes[0].nodeValue+
		// 															'</p>';

		// add hyperlink
		card.innerHTML += '<a href="'+
						file+
						'" class="btn btn-primary">Read More &rarr;</a>'+
						'</div>';
		// add date and tag
		var tagString = "'"+
						htmlDoc.getElementById("tag").childNodes[0].innerText+
						"'"
		card.innerHTML += '<div class="card-footer text-muted">Posted on '+month.get(date[1])+" "+date[2]+", "+date[0]+
						'  <kbd id="tag"><a href="javascript:on_tag('+tagString+')">'+
						htmlDoc.getElementById("tag").childNodes[0].innerText+'</a></kbd>';

		// in case an image doesnt exist, use default
		$(".card-img-top").on("error", function(){
	        $(this).attr('src', './posts/default.jpg');
	    });
	}
	else{
		card.parentNode.removeChild(card)
	}
}

function check_tag(mode, keyword){
	return (mode == MODE.TAG && htmlDoc.getElementById("tag").childNodes[0].innerText == keyword)
}

function check_search(mode, keyword){
	return (mode == MODE.SEARCH && htmlDoc.body.textContent.match(RegExp(keyword,"gi")))
}

/**************************************** pagination logic ****************************************************/
// function for older blog button
window.on_older_blog = function (){
	currPage ++;

	// check if page exceeds maximum
	if (currPage > numPage){
		currPage = numPage; // prevent overflow
		document.getElementById("older_button").disabled = true;
	}

	// setup page and pagination based on current page
	document.getElementById('blog-title').scrollIntoView(true);
	document.getElementById('card-list-placeholder').innerHTML = '';
	setup_page();
	setup_pagination();
}

// function for newer blog button
window.on_newer_blog = function (){
	currPage --;

	// check if page exceeds minimum
	if (currPage > 1){
		currPage = numPage; // prevent overflow
	}

	// setup page and pagination based on current page
	document.getElementById('blog-title').scrollIntoView(true);
	document.getElementById('card-list-placeholder').innerHTML = '';
	setup_page();
	setup_pagination();
}

window.on_page_number = function(pageNum){
	currPage = pageNum;

	// setup page and pagination based on current page
	document.getElementById('blog-title').scrollIntoView(true);
	document.getElementById('card-list-placeholder').innerHTML = '';
	setup_page();
	setup_pagination();
}

/**************************************** tage logic  ****************************************************/
window.on_tag = function(tag){
	window.location.href = "./index.html?tag="+tag;
}

window.on_tag_post = function(tag){
	window.location.href = "../../index.html?tag="+tag;
}

/**************************************** search logic  ****************************************************/
window.on_search = function(keyword){
	window.location.href = "./index.html?keyword="+keyword;
}

window.on_keyup = function(event){
	if (event.keyCode == 13){ // enter has received
		document.getElementsByName("search-btn")[0].click();
	}
}
/**************************************** test  ****************************************************/
// dummy test function to test adding elemetns to html
function dummy(){
	console.log("dummy");
}
},{"path":2}],2:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
