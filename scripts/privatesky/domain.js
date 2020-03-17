domainRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/opt/privatesky/builds/tmp/domain_intermediar.js":[function(require,module,exports){
(function (global){
global.domainLoadModules = function(){ 
	$$.__runtimeModules["basicTestSwarms"] = require("basicTestSwarms");
}
if (true) {
	domainLoadModules();
}; 
global.domainRequire = require;
if (typeof $$ !== "undefined") {            
    $$.requireBundle("domain");
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"basicTestSwarms":"basicTestSwarms"}],"basicTestSwarms":[function(require,module,exports){
$$.swarms.describe("echo",{
    say: function(input){
        this.return("Echo "+ input);
    }
});
},{}]},{},["/opt/privatesky/builds/tmp/domain_intermediar.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZHMvdG1wL2RvbWFpbl9pbnRlcm1lZGlhci5qcyIsImxpYnJhcmllcy9iYXNpY1Rlc3RTd2FybXMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiZ2xvYmFsLmRvbWFpbkxvYWRNb2R1bGVzID0gZnVuY3Rpb24oKXsgXG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJiYXNpY1Rlc3RTd2FybXNcIl0gPSByZXF1aXJlKFwiYmFzaWNUZXN0U3dhcm1zXCIpO1xufVxuaWYgKHRydWUpIHtcblx0ZG9tYWluTG9hZE1vZHVsZXMoKTtcbn07IFxuZ2xvYmFsLmRvbWFpblJlcXVpcmUgPSByZXF1aXJlO1xuaWYgKHR5cGVvZiAkJCAhPT0gXCJ1bmRlZmluZWRcIikgeyAgICAgICAgICAgIFxuICAgICQkLnJlcXVpcmVCdW5kbGUoXCJkb21haW5cIik7XG59OyIsIiQkLnN3YXJtcy5kZXNjcmliZShcImVjaG9cIix7XG4gICAgc2F5OiBmdW5jdGlvbihpbnB1dCl7XG4gICAgICAgIHRoaXMucmV0dXJuKFwiRWNobyBcIisgaW5wdXQpO1xuICAgIH1cbn0pOyJdfQ==
