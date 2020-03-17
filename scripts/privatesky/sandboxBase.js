sandboxBaseRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/opt/privatesky/builds/tmp/sandboxBase_intermediar.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
global.sandboxBaseLoadModules = function(){ 
	$$.__runtimeModules["callflow"] = require("callflow");
	$$.__runtimeModules["psklogger"] = require("psklogger");
	$$.__runtimeModules["swarmutils"] = require("swarmutils");
	$$.__runtimeModules["soundpubsub"] = require("soundpubsub");
	$$.__runtimeModules["pskbuffer"] = require("pskbuffer");
	$$.__runtimeModules["assert"] = require("assert");
	$$.__runtimeModules["buffer"] = require("buffer");
	$$.__runtimeModules["events"] = require("events");
	$$.__runtimeModules["path"] = require("path");
	$$.__runtimeModules["querystring"] = require("querystring");
	$$.__runtimeModules["stream"] = require("stream");
	$$.__runtimeModules["string_decoder"] = require("string_decoder");
	$$.__runtimeModules["timers"] = require("timers");
	$$.__runtimeModules["url"] = require("url");
	$$.__runtimeModules["util"] = require("util");
	$$.__runtimeModules["inherits"] = require("inherits");
	$$.__runtimeModules["zlib"] = require("zlib");
	$$.__runtimeModules["ieee754"] = require("ieee754");
	$$.__runtimeModules["base64-js"] = require("base64-js");
	$$.__runtimeModules["process/browser.js"] = require("process/browser.js");
}
if (false) {
	sandboxBaseLoadModules();
}; 
global.sandboxBaseRequire = require;
if (typeof $$ !== "undefined") {            
    $$.requireBundle("sandboxBase");
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/builds/tmp/sandboxBase_intermediar.js","/builds/tmp")

},{"assert":"assert","base64-js":"base64-js","buffer":"buffer","callflow":"callflow","events":"events","ieee754":"ieee754","inherits":"inherits","path":"path","process/browser.js":"process/browser.js","pskbuffer":"pskbuffer","psklogger":"psklogger","querystring":"querystring","soundpubsub":"soundpubsub","stream":"stream","string_decoder":"string_decoder","swarmutils":"swarmutils","timers":"timers","url":"url","util":"util","zlib":"zlib"}],"/opt/privatesky/modules/callflow/constants.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
$$.CONSTANTS = {
    SWARM_FOR_EXECUTION:"swarm_for_execution",
    INBOUND:"inbound",
    OUTBOUND:"outbound",
    PDS:"PrivateDataSystem",
    CRL:"CommunicationReplicationLayer",
    SWARM_RETURN: 'swarm_return',
    BEFORE_INTERCEPTOR: 'before',
    AFTER_INTERCEPTOR: 'after',
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/constants.js","/modules/callflow")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/InterceptorRegistry.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
// related to: SwarmSpace.SwarmDescription.createPhase()

function InterceptorRegistry() {
    const rules = new Map();

    // ??? $$.errorHandler Library ???
    const _CLASS_NAME = 'InterceptorRegistry';

    /************* PRIVATE METHODS *************/

    function _throwError(err, msg) {
        console.error(err.message, `${_CLASS_NAME} error message:`, msg);
        throw err;
    }

    function _warning(msg) {
        console.warn(`${_CLASS_NAME} warning message:`, msg);
    }

    const getWhenOptions = (function () {
        let WHEN_OPTIONS;
        return function () {
            if (WHEN_OPTIONS === undefined) {
                WHEN_OPTIONS = Object.freeze([
                    $$.CONSTANTS.BEFORE_INTERCEPTOR,
                    $$.CONSTANTS.AFTER_INTERCEPTOR
                ]);
            }
            return WHEN_OPTIONS;
        };
    })();

    function verifyWhenOption(when) {
        if (!getWhenOptions().includes(when)) {
            _throwError(new RangeError(`Option '${when}' is wrong!`),
                `it should be one of: ${getWhenOptions()}`);
        }
    }

    function verifyIsFunctionType(fn) {
        if (typeof fn !== 'function') {
            _throwError(new TypeError(`Parameter '${fn}' is wrong!`),
                `it should be a function, not ${typeof fn}!`);
        }
    }

    function resolveNamespaceResolution(swarmTypeName) {
        if (swarmTypeName === '*') {
            return swarmTypeName;
        }

        return (swarmTypeName.includes(".") ? swarmTypeName : ($$.libraryPrefix + "." + swarmTypeName));
    }

    /**
     * Transforms an array into a generator with the particularity that done is set to true on the last element,
     * not after it finished iterating, this is helpful in optimizing some other functions
     * It is useful if you want call a recursive function over the array elements but without popping the first
     * element of the Array or sending the index as an extra parameter
     * @param {Array<*>} arr
     * @return {IterableIterator<*>}
     */
    function* createArrayGenerator(arr) {
        const len = arr.length;

        for (let i = 0; i < len - 1; ++i) {
            yield arr[i];
        }

        return arr[len - 1];
    }

    /**
     * Builds a tree like structure over time (if called on the same root node) where internal nodes are instances of
     * Map containing the name of the children nodes (each child name is the result of calling next on `keysGenerator)
     * and a reference to them and on leafs it contains an instance of Set where it adds the function given as parameter
     * (ex: for a keyGenerator that returns in this order ("key1", "key2") the resulting structure will be:
     * {"key1": {"key1": Set([fn])}} - using JSON just for illustration purposes because it's easier to represent)
     * @param {Map} rulesMap
     * @param {IterableIterator} keysGenerator - it has the particularity that done is set on last element, not after it
     * @param {function} fn
     */
    function registerRecursiveRule(rulesMap, keysGenerator, fn) {
        const {value, done} = keysGenerator.next();

        if (!done) { // internal node
            const nextKey = rulesMap.get(value);

            if (typeof nextKey === 'undefined') { // if value not found in rulesMap
                rulesMap.set(value, new Map());
            }

            registerRecursiveRule(rulesMap.get(value), keysGenerator, fn);
        } else { // reached leaf node
            if (!rulesMap.has(value)) {

                rulesMap.set(value, new Set([fn]));
            } else {
                const set = rulesMap.get(value);

                if (set.has(fn)) {
                    _warning(`Duplicated interceptor for '${key}'`);
                }

                set.add(fn);
            }
        }
    }

    /**
     * Returns the corresponding set of functions for the given key if found
     * @param {string} key - formatted as a path without the first '/' (ex: swarmType/swarmPhase/before)
     * @return {Array<Set<function>>}
     */
    function getInterceptorsForKey(key) {
        if (key.startsWith('/')) {
            _warning(`Interceptor called on key ${key} starting with '/', automatically removing it`);
            key = key.substring(1);
        }

        const keyElements = key.split('/');
        const keysGenerator = createArrayGenerator(keyElements);

        return getValueRecursively([rules], keysGenerator);
    }

    /**
     * It works like a BFS search returning the leafs resulting from traversing the internal nodes with corresponding
     * names given for each level (depth) by `keysGenerator`
     * @param {Array<Map>} searchableNodes
     * @param {IterableIterator} keysGenerator - it has the particularity that done is set on last element, not after it
     * @return {Array<Set<function>>}
     */
    function getValueRecursively(searchableNodes, keysGenerator) {
        const {value: nodeName, done} = keysGenerator.next();

        const nextNodes = [];

        for (const nodeInRules of searchableNodes) {
            const nextNodeForAll = nodeInRules.get('*');
            const nextNode = nodeInRules.get(nodeName);

            if (typeof nextNode !== "undefined") {
                nextNodes.push(nextNode);
            }

            if (typeof nextNodeForAll !== "undefined") {
                nextNodes.push(nextNodeForAll);
            }

        }

        if (done) {
            return nextNodes;
        }

        return getValueRecursively(nextNodes, keysGenerator);
    }


    /************* PUBLIC METHODS *************/

    this.register = function (swarmTypeName, phaseName, when, fn) {
        verifyWhenOption(when);
        verifyIsFunctionType(fn);

        const resolvedSwarmTypeName = resolveNamespaceResolution(swarmTypeName);
        const keys = createArrayGenerator([resolvedSwarmTypeName, phaseName, when]);

        registerRecursiveRule(rules, keys, fn);
    };

    // this.unregister = function () { }

    this.callInterceptors = function (key, targetObject, args) {
        const interceptors = getInterceptorsForKey(key);

        if (interceptors) {
            for (const interceptorSet of interceptors) {
                for (const fn of interceptorSet) { // interceptors on key '*' are called before those specified by name
                    fn.apply(targetObject, args);
                }
            }
        }
    };
}


exports.createInterceptorRegistry = function () {
    return new InterceptorRegistry();
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/InterceptorRegistry.js","/modules/callflow/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/choreographies/SwarmDebug.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/*
 Initial License: (c) Axiologic Research & Alboaie Sînică.
 Contributors: Axiologic Research , PrivateSky project
 Code License: LGPL or MIT.
 */

var util = require("util");
var fs = require("fs");
cprint = console.log;
wprint = console.warn;
dprint = console.debug;
eprint = console.error;


/**
 * Shortcut to JSON.stringify
 * @param obj
 */
J = function (obj) {
    return JSON.stringify(obj);
}


/**
 * Print swarm contexts (Messages) and easier to read compared with J
 * @param obj
 * @return {string}
 */
exports.cleanDump = function (obj) {
    var o = obj.valueOf();
    var meta = {
        swarmTypeName:o.meta.swarmTypeName
    };
    return "\t swarmId: " + o.meta.swarmId + "{\n\t\tmeta: "    + J(meta) +
        "\n\t\tpublic: "        + J(o.publicVars) +
        "\n\t\tprotected: "     + J(o.protectedVars) +
        "\n\t\tprivate: "       + J(o.privateVars) + "\n\t}\n";
}

//M = exports.cleanDump;
/**
 * Experimental functions
 */


/*

 logger      = monitor.logger;
 assert      = monitor.assert;
 throwing    = monitor.exceptions;


 var temporaryLogBuffer = [];

 var currentSwarmComImpl = null;

 logger.record = function(record){
 if(currentSwarmComImpl===null){
 temporaryLogBuffer.push(record);
 } else {
 currentSwarmComImpl.recordLog(record);
 }
 }

 var container = require("dicontainer").container;

 container.service("swarmLoggingMonitor", ["swarmingIsWorking", "swarmComImpl"], function(outOfService,swarming, swarmComImpl){

 if(outOfService){
 if(!temporaryLogBuffer){
 temporaryLogBuffer = [];
 }
 } else {
 var tmp = temporaryLogBuffer;
 temporaryLogBuffer = [];
 currentSwarmComImpl = swarmComImpl;
 logger.record = function(record){
 currentSwarmComImpl.recordLog(record);
 }

 tmp.forEach(function(record){
 logger.record(record);
 });
 }
 })

 */
uncaughtExceptionString = "";
uncaughtExceptionExists = false;
if(typeof globalVerbosity == 'undefined'){
    globalVerbosity = false;
}

var DEBUG_START_TIME = new Date().getTime();

function getDebugDelta(){
    var currentTime = new Date().getTime();
    return currentTime - DEBUG_START_TIME;
}

/**
 * Debug functions, influenced by globalVerbosity global variable
 * @param txt
 */
dprint = function (txt) {
    if (globalVerbosity == true) {
        if (thisAdapter.initilised ) {
            console.log("DEBUG: [" + thisAdapter.nodeName + "](" + getDebugDelta()+ "):"+txt);
        }
        else {
            console.log("DEBUG: (" + getDebugDelta()+ "):"+txt);
            console.log("DEBUG: " + txt);
        }
    }
}

/**
 * obsolete!?
 * @param txt
 */
aprint = function (txt) {
    console.log("DEBUG: [" + thisAdapter.nodeName + "]: " + txt);
}



/**
 * Utility function usually used in tests, exit current process after a while
 * @param msg
 * @param timeout
 */
delayExit = function (msg, retCode,timeout) {
    if(retCode == undefined){
        retCode = ExitCodes.UnknownError;
    }

    if(timeout == undefined){
        timeout = 100;
    }

    if(msg == undefined){
        msg = "Delaying exit with "+ timeout + "ms";
    }

    console.log(msg);
    setTimeout(function () {
        process.exit(retCode);
    }, timeout);
}


function localLog (logType, message, err) {
    var time = new Date();
    var now = time.getDate() + "-" + (time.getMonth() + 1) + "," + time.getHours() + ":" + time.getMinutes();
    var msg;

    msg = '[' + now + '][' + thisAdapter.nodeName + '] ' + message;

    if (err != null && err != undefined) {
        msg += '\n     Err: ' + err.toString();
        if (err.stack && err.stack != undefined)
            msg += '\n     Stack: ' + err.stack + '\n';
    }

    cprint(msg);
    if(thisAdapter.initilised){
        try{
            fs.appendFileSync(getSwarmFilePath(thisAdapter.config.logsPath + "/" + logType), msg);
        } catch(err){
            console.log("Failing to write logs in ", thisAdapter.config.logsPath );
        }

    }
}


// printf = function (...params) {
//     var args = []; // empty array
//     // copy all other arguments we want to "pass through"
//     for (var i = 0; i < params.length; i++) {
//         args.push(params[i]);
//     }
//     var out = util.format.apply(this, args);
//     console.log(out);
// }
//
// sprintf = function (...params) {
//     var args = []; // empty array
//     for (var i = 0; i < params.length; i++) {
//         args.push(params[i]);
//     }
//     return util.format.apply(this, args);
// }


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/choreographies/SwarmDebug.js","/modules/callflow/lib/choreographies")

},{"buffer":"buffer","fs":false,"timers":"timers","util":"util"}],"/opt/privatesky/modules/callflow/lib/choreographies/swarm.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
exports.createForObject = function(valueObject, thisObject, localId){
	return require("../utilityFunctions/base").createForObject(valueObject, thisObject, localId);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/choreographies/swarm.js","/modules/callflow/lib/choreographies")

},{"../utilityFunctions/base":"/opt/privatesky/modules/callflow/lib/utilityFunctions/base.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/choreographies/swarmInstancesManager.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){


function SwarmsInstancesManager(){
    var swarmAliveInstances = {

    }

    this.waitForSwarm = function(callback, swarm, keepAliveCheck){

        function doLogic(){
            var swarmId = swarm.getInnerValue().meta.swarmId;
            var watcher = swarmAliveInstances[swarmId];
            if(!watcher){
                watcher = {
                    swarm:swarm,
                    callback:callback,
                    keepAliveCheck:keepAliveCheck
                }
                swarmAliveInstances[swarmId] = watcher;
            }
        }

        function filter(){
            return swarm.getInnerValue().meta.swarmId;
        }

        //$$.uidGenerator.wait_for_condition(condition,doLogic);
        swarm.observe(doLogic, null, filter);
    }

    function cleanSwarmWaiter(swarmSerialisation){ // TODO: add better mechanisms to prevent memory leaks
        var swarmId = swarmSerialisation.meta.swarmId;
        var watcher = swarmAliveInstances[swarmId];

        if(!watcher){
            $$.errorHandler.warning("Invalid swarm received: " + swarmId);
            return;
        }

        var args = swarmSerialisation.meta.args;
        args.push(swarmSerialisation);

        watcher.callback.apply(null, args);
        if(!watcher.keepAliveCheck()){
            delete swarmAliveInstances[swarmId];
        }
    }

    this.revive_swarm = function(swarmSerialisation){


        var swarmId     = swarmSerialisation.meta.swarmId;
        var swarmType   = swarmSerialisation.meta.swarmTypeName;
        var instance    = swarmAliveInstances[swarmId];

        var swarm;

        if(instance){
            swarm = instance.swarm;
            swarm.update(swarmSerialisation);

        } else {
            swarm = $$.swarm.start(swarmType);
            if(!swarm){
                throw new Error(`Unknown swarm type <${swarmType}>. Check if swarm type is present in domain constituion!`);
            }else{
                swarm.update(swarmSerialisation);
            }

            /*swarm = $$.swarm.start(swarmType, swarmSerialisation);*/
        }

        if (swarmSerialisation.meta.command == "asyncReturn") {
            var co = $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_RETURN, swarmSerialisation);
            console.log("Subscribers listening on", $$.CONSTANTS.SWARM_RETURN, co);
            // cleanSwarmWaiter(swarmSerialisation);
        } else if (swarmSerialisation.meta.command == "executeSwarmPhase") {
            swarm.runPhase(swarmSerialisation.meta.phaseName, swarmSerialisation.meta.args);
        } else {
            console.log("Unknown command", swarmSerialisation.meta.command, "in swarmSerialisation.meta.command");
        }

        return swarm;
    }
}


$$.swarmsInstancesManager = new SwarmsInstancesManager();



}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/choreographies/swarmInstancesManager.js","/modules/callflow/lib/choreographies")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/loadLibrary.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/*
Initial License: (c) Axiologic Research & Alboaie Sînică.
Contributors: Axiologic Research , PrivateSky project
Code License: LGPL or MIT.
*/

//var fs = require("fs");
//var path = require("path");


function SwarmLibrary(prefixName, folder){
    var self = this;
    function wrapCall(original, prefixName){
        return function(...args){
            //console.log("prefixName", prefixName)
            var previousPrefix = $$.libraryPrefix;
            var previousLibrary = $$.__global.currentLibrary;

            $$.libraryPrefix = prefixName;
            $$.__global.currentLibrary = self;
            try{
                var ret = original.apply(this, args);
                $$.libraryPrefix = previousPrefix ;
                $$.__global.currentLibrary = previousLibrary;
            }catch(err){
                $$.libraryPrefix = previousPrefix ;
                $$.__global.currentLibrary = previousLibrary;
                throw err;
            }
            return ret;
        }
    }

    $$.libraries[prefixName] = this;
    var prefixedRequire = wrapCall(function(path){
        return require(path);
    }, prefixName);

    function includeAllInRoot(folder) {
        if(typeof folder != "string"){
            //we assume that it is a library module properly required with require and containing $$.library
            for(var v in folder){
                $$.registerSwarmDescription(prefixName,v, prefixName + "." + v,  folder[v]);
            }

            var newNames = $$.__global.requireLibrariesNames[prefixName];
            for(var v in newNames){
                self[v] =  newNames[v];
            }
            return folder;
        }


        var res = prefixedRequire(folder); // a library is just a module
        if(typeof res.__autogenerated_privatesky_libraryName != "undefined"){
            var swarms = $$.__global.requireLibrariesNames[res.__autogenerated_privatesky_libraryName];
        } else {
            var swarms = $$.__global.requireLibrariesNames[folder];
        }
            var existingName;
            for(var v in swarms){
                existingName = swarms[v];
                self[v] = existingName;
                $$.registerSwarmDescription(prefixName,v, prefixName + "." + v,  existingName);
            }
        return res;
    }

    function wrapSwarmRelatedFunctions(space, prefixName){
        var ret = {};
        var names = ["create", "describe", "start", "restart"];
        for(var i = 0; i<names.length; i++ ){
            ret[names[i]] = wrapCall(space[names[i]], prefixName);
        }
        return ret;
    }

    this.callflows        = this.callflow   = wrapSwarmRelatedFunctions($$.callflows, prefixName);
    this.swarms           = this.swarm      = wrapSwarmRelatedFunctions($$.swarms, prefixName);
    this.contracts        = this.contract   = wrapSwarmRelatedFunctions($$.contracts, prefixName);
    includeAllInRoot(folder, prefixName);
}

exports.loadLibrary = function(prefixName, folder){
    var existing = $$.libraries[prefixName];
    if(existing ){
        if(!(existing instanceof SwarmLibrary)){
            var sL = new SwarmLibrary(prefixName, folder);
            for(var prop in existing){
                sL[prop] = existing[prop];
            }
            return sL;
        }
        if(folder) {
            $$.errorHandler.warning("Reusing already loaded library " + prefixName + "could be an error!");
        }
        return existing;
    }
    //var absolutePath = path.resolve(folder);
    return new SwarmLibrary(prefixName, folder);
}


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/loadLibrary.js","/modules/callflow/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/overwriteRequire.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/*
 require and $$.require are overwriting the node.js defaults in loading modules for increasing security,speed and making it work to the privatesky runtime build with browserify.
 The privatesky code for domains should work in node and browsers.
 */


if (typeof(window) !== "undefined") {
    global = window;
}


if (typeof(global.$$) == "undefined") {
    global.$$ = {};
    $$.__global = {};
}

if (typeof($$.__global) == "undefined") {
    $$.__global = {};
}

if (typeof($$.__global.requireLibrariesNames) == "undefined") {
    $$.__global.currentLibraryName = null;
    $$.__global.requireLibrariesNames = {};
}


if (typeof($$.__runtimeModules) == "undefined") {
    $$.__runtimeModules = {};
}

require("./../standardGlobalSymbols");

if (typeof(global.functionUndefined) == "undefined") {
    global.functionUndefined = function () {
        console.log("Called of an undefined function!!!!");
        throw new Error("Called of an undefined function");
    };
    if (typeof(global.webshimsRequire) == "undefined") {
        global.webshimsRequire = global.functionUndefined;
    }

    if (typeof(global.domainRequire) == "undefined") {
        global.domainRequire = global.functionUndefined;
    }

    if (typeof(global.pskruntimeRequire) == "undefined") {
        global.pskruntimeRequire = global.functionUndefined;
    }
}

const weAreInbrowser = (typeof ($$.browserRuntime) != "undefined");
const weAreInSandbox = (typeof global.require !== 'undefined');


const pastRequests = {};

function preventRecursiveRequire(request) {
    if (pastRequests[request]) {
        const err = new Error("Preventing recursive require for " + request);
        err.type = "PSKIgnorableError";
        throw err;
    }

}

function disableRequire(request) {
    pastRequests[request] = true;
}

function enableRequire(request) {
    pastRequests[request] = false;
}


function requireFromCache(request) {
    const existingModule = $$.__runtimeModules[request];
    return existingModule;
}

function wrapStep(callbackName) {
    const callback = global[callbackName];

    if (callback === undefined) {
        return null;
    }

    if (callback === global.functionUndefined) {
        return null;
    }

    return function (request) {
        const result = callback(request);
        $$.__runtimeModules[request] = result;
        return result;
    }
}

function tryRequireSequence(originalRequire, request) {
    let arr;
    if (originalRequire) {
        arr = $$.__requireFunctionsChain.slice();
        arr.push(originalRequire);
    } else {
        arr = $$.__requireFunctionsChain;
    }

    preventRecursiveRequire(request);
    disableRequire(request);
    let result;
    const previousRequire = $$.__global.currentLibraryName;
    let previousRequireChanged = false;

    if (!previousRequire) {
        // console.log("Loading library for require", request);
        $$.__global.currentLibraryName = request;

        if (typeof $$.__global.requireLibrariesNames[request] == "undefined") {
            $$.__global.requireLibrariesNames[request] = {};
            //$$.__global.requireLibrariesDescriptions[request]   = {};
        }
        previousRequireChanged = true;
    }
    for (let i = 0; i < arr.length; i++) {
        const func = arr[i];
        try {

            if (func === global.functionUndefined) continue;
            result = func(request);

            if (result) {
                break;
            }

        } catch (err) {
            if (err.type !== "PSKIgnorableError") {
                $$.log("Require encountered an error while loading ", request, "\nCause:\n", err.stack);
            }
        }
    }

    if (!result) {
        $$.log("Failed to load module ", request, result);
    }

    enableRequire(request);
    if (previousRequireChanged) {
        //console.log("End loading library for require", request, $$.__global.requireLibrariesNames[request]);
        $$.__global.currentLibraryName = null;
    }
    return result;
}

if (typeof($$.require) == "undefined") {

    $$.__requireList = ["webshimsRequire", "pskruntimeRequire"];
    $$.__requireFunctionsChain = [];

    $$.requireBundle = function (name) {
        name += "Require";
        $$.__requireList.push(name);
        const arr = [requireFromCache];
        $$.__requireList.forEach(function (item) {
            const callback = wrapStep(item);
            if (callback) {
                arr.push(callback);
            }
        });

        $$.__requireFunctionsChain = arr;
    };

    $$.requireBundle("init");

    if (weAreInbrowser) {
        $$.log("Defining global require in browser");


        global.require = function (request) {

            ///*[requireFromCache, wrapStep(webshimsRequire), , wrapStep(pskruntimeRequire), wrapStep(domainRequire)*]
            return tryRequireSequence(null, request);
        }
    } else
        if (weAreInSandbox) {
        // require should be provided when code is loaded in browserify
        const bundleRequire = require;

        $$.requireBundle('sandboxBase');
        // this should be set up by sandbox prior to
        const sandboxRequire = global.require;
        global.crypto = require('crypto');

        function newLoader(request) {
            // console.log("newLoader:", request);
            //preventRecursiveRequire(request);
            const self = this;

            // console.log('trying to load ', request);

            function tryBundleRequire(...args) {
                //return $$.__originalRequire.apply(self,args);
                //return Module._load.apply(self,args)
                let res;
                try {
                    res = sandboxRequire.apply(self, args);
                } catch (err) {
                    if (err.code === "MODULE_NOT_FOUND") {
                        const p = path.join(process.cwd(), request);
                        res = sandboxRequire.apply(self, [p]);
                        request = p;
                    } else {
                        throw err;
                    }
                }
                return res;
            }

            let res;


            res = tryRequireSequence(tryBundleRequire, request);


            return res;
        }

        global.require = newLoader;

    } else {  //we are in node
        const path = require("path");
        $$.__runtimeModules["crypto"] = require("crypto");
        $$.__runtimeModules["util"] = require("util");

        const Module = require('module');
        $$.__runtimeModules["module"] = Module;

        $$.log("Redefining require for node");

        $$.__originalRequire = Module._load;
        const moduleOriginalRequire = Module.prototype.require;

        function newLoader(request) {
            // console.log("newLoader:", request);
            //preventRecursiveRequire(request);
            const self = this;

            function originalRequire(...args) {
                //return $$.__originalRequire.apply(self,args);
                //return Module._load.apply(self,args)
                let res;
                try {
                    res = moduleOriginalRequire.apply(self, args);
                } catch (err) {
                    if (err.code === "MODULE_NOT_FOUND") {
                        const p = path.join(process.cwd(), request);
                        res = moduleOriginalRequire.apply(self, [p]);
                        request = p;
                    } else {
                        throw err;
                    }
                }
                return res;
            }

            function currentFolderRequire(request) {
                return
            }

            //[requireFromCache, wrapStep(pskruntimeRequire), wrapStep(domainRequire), originalRequire]
            return tryRequireSequence(originalRequire, request);
        }

        Module.prototype.require = newLoader;
    }

    $$.require = require;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/overwriteRequire.js","/modules/callflow/lib")

},{"./../standardGlobalSymbols":"/opt/privatesky/modules/callflow/standardGlobalSymbols.js","buffer":"buffer","crypto":false,"module":false,"path":"path","timers":"timers","util":"util"}],"/opt/privatesky/modules/callflow/lib/parallelJoinPoint.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){

var joinCounter = 0;

function ParallelJoinPoint(swarm, callback, args){
    joinCounter++;
    var channelId = "ParallelJoinPoint" + joinCounter;
    var self = this;
    var counter = 0;
    var stopOtherExecution     = false;

    function executionStep(stepFunc, localArgs, stop){

        this.doExecute = function(){
            if(stopOtherExecution){
                return false;
            }
            try{
                stepFunc.apply(swarm, localArgs);
                if(stop){
                    stopOtherExecution = true;
                    return false;
                }
                return true; //everyting is fine
            } catch(err){
                args.unshift(err);
                sendForSoundExecution(callback, args, true);
                return false; //stop it, do not call again anything
            }
        }
    }

    if(typeof callback !== "function"){
        $$.errorHandler.syntaxError("invalid join",swarm, "invalid function at join in swarm");
        return;
    }

    $$.PSK_PubSub.subscribe(channelId,function(forExecution){
        if(stopOtherExecution){
            return ;
        }

        try{
            if(forExecution.doExecute()){
                decCounter();
            } // had an error...
        } catch(err){
            //console.log(err);
            //$$.errorHandler.syntaxError("__internal__",swarm, "exception in the execution of the join function of a parallel task");
        }
    });

    function incCounter(){
        if(testIfUnderInspection()){
            //preventing inspector from increasing counter when reading the values for debug reason
            //console.log("preventing inspection");
            return;
        }
        counter++;
    }

    function testIfUnderInspection(){
        var res = false;
        var constArgv = process.execArgv.join();
        if(constArgv.indexOf("inspect")!==-1 || constArgv.indexOf("debug")!==-1){
            //only when running in debug
            var callstack = new Error().stack;
            if(callstack.indexOf("DebugCommandProcessor")!==-1){
                console.log("DebugCommandProcessor detected!");
                res = true;
            }
        }
        return res;
    }

    function sendForSoundExecution(funct, args, stop){
        var obj = new executionStep(funct, args, stop);
        $$.PSK_PubSub.publish(channelId, obj); // force execution to be "sound"
    }

    function decCounter(){
        counter--;
        if(counter == 0) {
            args.unshift(null);
            sendForSoundExecution(callback, args, false);
        }
    }

    var inner = swarm.getInnerValue();

    function defaultProgressReport(err, res){
        if(err) {
            throw err;
        }
        return {
            text:"Parallel execution progress event",
            swarm:swarm,
            args:args,
            currentResult:res
        };
    }

    function mkFunction(name){
        return function(...args){
            var f = defaultProgressReport;
            if(name != "progress"){
                f = inner.myFunctions[name];
            }
            var args = $$.__intern.mkArgs(args, 0);
            sendForSoundExecution(f, args, false);
            return __proxyObject;
        }
    }


    this.get = function(target, prop, receiver){
        if(inner.myFunctions.hasOwnProperty(prop) || prop == "progress"){
            incCounter();
            return mkFunction(prop);
        }
        return swarm[prop];
    };

    var __proxyObject;

    this.__setProxyObject = function(p){
        __proxyObject = p;
    }
}

exports.createJoinPoint = function(swarm, callback, args){
    var jp = new ParallelJoinPoint(swarm, callback, args);
    var inner = swarm.getInnerValue();
    var p = new Proxy(inner, jp);
    jp.__setProxyObject(p);
    return p;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/parallelJoinPoint.js","/modules/callflow/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/serialJoinPoint.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){

var joinCounter = 0;

function SerialJoinPoint(swarm, callback, args){

    joinCounter++;

    var self = this;
    var channelId = "SerialJoinPoint" + joinCounter;

    if(typeof callback !== "function"){
        $$.errorHandler.syntaxError("unknown", swarm, "invalid function given to serial in swarm");
        return;
    }

    var inner = swarm.getInnerValue();


    function defaultProgressReport(err, res){
        if(err) {
            throw err;
        }
        return res;
    }


    var functionCounter     = 0;
    var executionCounter    = 0;

    var plannedExecutions   = [];
    var plannedArguments    = {};

    function mkFunction(name, pos){
        //console.log("Creating function ", name, pos);
        plannedArguments[pos] = undefined;

        function triggetNextStep(){
            if(plannedExecutions.length == executionCounter || plannedArguments[executionCounter] )  {
                $$.PSK_PubSub.publish(channelId, self);
            }
        }

        var f = function (...args){
            if(executionCounter != pos) {
                plannedArguments[pos] = args;
                //console.log("Delaying function:", executionCounter, pos, plannedArguments, arguments, functionCounter);
                return __proxy;
            } else{
                if(plannedArguments[pos]){
                    //console.log("Executing  function:", executionCounter, pos, plannedArguments, arguments, functionCounter);
					args = plannedArguments[pos];
                } else {
                    plannedArguments[pos] = args;
                    triggetNextStep();
                    return __proxy;
                }
            }

            var f = defaultProgressReport;
            if(name != "progress"){
                f = inner.myFunctions[name];
            }


            try{
                f.apply(self,args);
            } catch(err){
                    args.unshift(err);
                    callback.apply(swarm,args); //error
                    $$.PSK_PubSub.unsubscribe(channelId,runNextFunction);
                return; //terminate execution with an error...!
            }
            executionCounter++;

            triggetNextStep();

            return __proxy;
        };

        plannedExecutions.push(f);
        functionCounter++;
        return f;
    }

     var finished = false;

    function runNextFunction(){
        if(executionCounter == plannedExecutions.length ){
            if(!finished){
                args.unshift(null);
                callback.apply(swarm,args);
                finished = true;
                $$.PSK_PubSub.unsubscribe(channelId,runNextFunction);
            } else {
                console.log("serial construct is using functions that are called multiple times...");
            }
        } else {
            plannedExecutions[executionCounter]();
        }
    }

    $$.PSK_PubSub.subscribe(channelId,runNextFunction); // force it to be "sound"


    this.get = function(target, prop, receiver){
        if(prop == "progress" || inner.myFunctions.hasOwnProperty(prop)){
            return mkFunction(prop, functionCounter);
        }
        return swarm[prop];
    }

    var __proxy;
    this.setProxyObject = function(p){
        __proxy = p;
    }
}

exports.createSerialJoinPoint = function(swarm, callback, args){
    var jp = new SerialJoinPoint(swarm, callback, args);
    var inner = swarm.getInnerValue();
    var p = new Proxy(inner, jp);
    jp.setProxyObject(p);
    return p;
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/serialJoinPoint.js","/modules/callflow/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/swarmDescription.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const OwM = require("swarmutils").OwM;

var swarmDescriptionsRegistry = {};


$$.registerSwarmDescription =  function(libraryName, shortName, swarmTypeName, description){
    if(!$$.libraries[libraryName]){
        $$.libraries[libraryName] = {};
    }

    if(!$$.__global.requireLibrariesNames[libraryName]){
        $$.__global.requireLibrariesNames[libraryName] = {};
    }

    $$.libraries[libraryName][shortName] = description;
    //console.log("Registering ", libraryName,shortName, $$.__global.currentLibraryName);
    if($$.__global.currentLibraryName){
        $$.__global.requireLibrariesNames[$$.__global.currentLibraryName][shortName] = libraryName + "." + shortName;
    }

    $$.__global.requireLibrariesNames[libraryName][shortName] = swarmTypeName;

    if(typeof description == "string"){
        description = swarmDescriptionsRegistry[description];
    }
    swarmDescriptionsRegistry[swarmTypeName] = description;
}


var currentLibraryCounter = 0;
$$.library = function(callback){
    currentLibraryCounter++;
    var previousCurrentLibrary = $$.__global.currentLibraryName;
    var libraryName = "___privatesky_library"+currentLibraryCounter;
    var ret = $$.__global.requireLibrariesNames[libraryName] = {};
    $$.__global.currentLibraryName = libraryName;
    callback();
    $$.__global.currentLibraryName = previousCurrentLibrary;
    ret.__autogenerated_privatesky_libraryName = libraryName;
    return ret;
}

function SwarmSpace(swarmType, utils) {

    var beesHealer = require("swarmutils").beesHealer;

    function getFullName(shortName){
        var fullName;
        if(shortName && shortName.includes(".")) {
            fullName = shortName;
        } else {
            fullName = $$.libraryPrefix + "." + shortName;
        }
        return fullName;
    }

    function VarDescription(desc){
        return {
            init:function(){
                return undefined;
            },
            restore:function(jsonString){
                return JSON.parse(jsonString);
            },
            toJsonString:function(x){
                return JSON.stringify();
            }
        };
    }

    function SwarmDescription(swarmTypeName, description){

        swarmTypeName = getFullName(swarmTypeName);

        var localId = 0;  // unique for each swarm

        function createVars(descr){
            var members = {};
            for(var v in descr){
                members[v] = new VarDescription(descr[v]);
            }
            return members;
        }

        function createMembers(descr){
            var members = {};
            for(var v in description){

                if(v != "public" && v != "private"){
                    members[v] = description[v];
                }
            }
            return members;
        }

        var publicVars = createVars(description.public);
        var privateVars = createVars(description.private);
        var myFunctions = createMembers(description);

        function createPhase(thisInstance, func, phaseName){
            var keyBefore = `${swarmTypeName}/${phaseName}/${$$.CONSTANTS.BEFORE_INTERCEPTOR}`;
            var keyAfter = `${swarmTypeName}/${phaseName}/${$$.CONSTANTS.AFTER_INTERCEPTOR}`;

            var phase = function(...args){
                var ret;
                try{
                    $$.PSK_PubSub.blockCallBacks();
                    thisInstance.setMetadata('phaseName', phaseName);
                    $$.interceptor.callInterceptors(keyBefore, thisInstance, args);
                    ret = func.apply(thisInstance, args);
                    $$.interceptor.callInterceptors(keyAfter, thisInstance, args);
                    $$.PSK_PubSub.releaseCallBacks();
                }catch(err){
                    $$.PSK_PubSub.releaseCallBacks();
                    throw err;
                }
                return ret;
            }
            //dynamic named func in order to improve callstack
            Object.defineProperty(phase, "name", {get: function(){return swarmTypeName+"."+func.name}});
            return phase;
        }

        this.initialise = function(serialisedValues){

            var result = new OwM({
                publicVars:{

                },
                privateVars:{

                },
                protectedVars:{

                },
                myFunctions:{

                },
                utilityFunctions:{

                },
                meta:{
                    swarmTypeName:swarmTypeName,
                    swarmDescription:description
                }
            });


            for(var v in publicVars){
                result.publicVars[v] = publicVars[v].init();
            };

            for(var v in privateVars){
                result.privateVars[v] = privateVars[v].init();
            };


            if(serialisedValues){
                beesHealer.jsonToNative(serialisedValues, result);
            }
            return result;
        };

        this.initialiseFunctions = function(valueObject, thisObject){

            for(var v in myFunctions){
                valueObject.myFunctions[v] = createPhase(thisObject, myFunctions[v], v);
            };

            localId++;
            valueObject.utilityFunctions = utils.createForObject(valueObject, thisObject, localId);

        }

        this.get = function(target, property, receiver){


            if(publicVars.hasOwnProperty(property))
            {
                return target.publicVars[property];
            }

            if(privateVars.hasOwnProperty(property))
            {
                return target.privateVars[property];
            }

            if(target.utilityFunctions.hasOwnProperty(property))
            {

                return target.utilityFunctions[property];
            }


            if(myFunctions.hasOwnProperty(property))
            {
                return target.myFunctions[property];
            }

            if(target.protectedVars.hasOwnProperty(property))
            {
                return target.protectedVars[property];
            }

            if(typeof property != "symbol") {
                $$.errorHandler.syntaxError(property, target);
            }
            return undefined;
        }

        this.set = function(target, property, value, receiver){

            if(target.utilityFunctions.hasOwnProperty(property) || target.myFunctions.hasOwnProperty(property)) {
                $$.errorHandler.syntaxError(property);
                throw new Error("Trying to overwrite immutable member" + property);
            }

            if(privateVars.hasOwnProperty(property))
            {
                target.privateVars[property] = value;
            } else
            if(publicVars.hasOwnProperty(property))
            {
                target.publicVars[property] = value;
            } else {
                target.protectedVars[property] = value;
            }
            return true;
        }

        this.apply = function(target, thisArg, argumentsList){
            console.log("Proxy apply");
            //var func = target[]
            //swarmGlobals.executionProvider.execute(null, thisArg, func, argumentsList)
        }

        var self = this;

        this.isExtensible = function(target) {
            return false;
        };

        this.has = function(target, prop) {
            if(target.publicVars[prop] || target.protectedVars[prop]) {
                return true;
            }
            return false;
        };

        this.ownKeys = function(target) {
            return Reflect.ownKeys(target.publicVars);
        };

        return function(serialisedValues){
            var valueObject = self.initialise(serialisedValues);
            var result = new Proxy(valueObject,self);
            self.initialiseFunctions(valueObject,result);
			if(!serialisedValues){
				if(!valueObject.getMeta("swarmId")){
					valueObject.setMeta("swarmId", $$.uidGenerator.safe_uuid());  //do not overwrite!!!
				}
				valueObject.utilityFunctions.notify();
			}

			if(result.autoInit){
                result.autoInit();
                $$.obsolete("fix the above comment")
                //result.autoInit = undefined;
            }
			return result;
        }
    }



    this.describe = function describeSwarm(swarmTypeName, description){
        swarmTypeName = getFullName(swarmTypeName);

        var pointPos = swarmTypeName.lastIndexOf('.');
        var shortName = swarmTypeName.substr( pointPos+ 1);
        var libraryName = swarmTypeName.substr(0, pointPos);
        if(!libraryName){
            libraryName = "global";
        }

        var description = new SwarmDescription(swarmTypeName, description);
        if(swarmDescriptionsRegistry[swarmTypeName] != undefined){
            $$.errorHandler.warning("Duplicate swarm description "+ swarmTypeName);
        }

        //swarmDescriptionsRegistry[swarmTypeName] = description;
		$$.registerSwarmDescription(libraryName, shortName, swarmTypeName, description);

        return description;
    }

    this.create = function(){
        $$.error("create function is obsolete. use describe!");
    }
    /* // confusing variant
    this.create = function createSwarm(swarmTypeName, description, initialValues){
        swarmTypeName = getFullName(swarmTypeName);
        try{
            if(undefined == description){
                return swarmDescriptionsRegistry[swarmTypeName](initialValues);
            } else {
                return this.describe(swarmTypeName, description)(initialValues);
            }
        } catch(err){
            console.log("CreateSwarm error", err);
            $$.errorHandler.error(err, arguments, "Wrong name or descriptions");
        }
    }*/

    this.continue = function(swarmTypeName, initialValues){
        swarmTypeName = getFullName(swarmTypeName);
        var desc = swarmDescriptionsRegistry[swarmTypeName];

        if(desc){
            return desc(initialValues);
        } else {
            $$.errorHandler.syntaxError(swarmTypeName,initialValues,
                "Failed to restart a swarm with type " + swarmTypeName + "\n Maybe different swarm space (used flow instead of swarm!?)");
        }
    }

    this.start = function(swarmTypeName, ctor, ...params){
        swarmTypeName = getFullName(swarmTypeName);
        var desc = swarmDescriptionsRegistry[swarmTypeName];
        if(!desc){
            $$.errorHandler.syntaxError(null, swarmTypeName);
            return null;
        }
        var res = desc();
        res.setMetadata("homeSecurityContext", $$.securityContext);

        if(ctor){
            res[ctor].apply(res, params);
        }

        return res;
    }
}

exports.createSwarmEngine = function(swarmType, utils){
    if(typeof utils == "undefined"){
        utils = require("./utilityFunctions/callflow");
    }
    return new SwarmSpace(swarmType, utils);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/swarmDescription.js","/modules/callflow/lib")

},{"./utilityFunctions/callflow":"/opt/privatesky/modules/callflow/lib/utilityFunctions/callflow.js","buffer":"buffer","swarmutils":"swarmutils","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/utilityFunctions/asset.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
exports.createForObject = function(valueObject, thisObject, localId){
	var ret = require("./base").createForObject(valueObject, thisObject, localId);

	ret.swarm           = null;
	ret.onReturn        = null;
	ret.onResult        = null;
	ret.asyncReturn     = null;
	ret.return          = null;
	ret.home            = null;
	ret.isPersisted  	= function () {
		return thisObject.getMetadata('persisted') === true;
	};

	return ret;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/utilityFunctions/asset.js","/modules/callflow/lib/utilityFunctions")

},{"./base":"/opt/privatesky/modules/callflow/lib/utilityFunctions/base.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/utilityFunctions/base.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
var beesHealer = require("swarmutils").beesHealer;
var swarmDebug = require("../choreographies/SwarmDebug");

exports.createForObject = function(valueObject, thisObject, localId){
	var ret = {};

	function filterForSerialisable (valueObject){
		return valueObject.meta.swarmId;
	}

	var swarmFunction = function(context, phaseName){
		var args =[];
		for(var i = 2; i < arguments.length; i++){
			args.push(arguments[i]);
		}

		//make the execution at level 0  (after all pending events) and wait to have a swarmId
		ret.observe(function(){
			beesHealer.asJSON(valueObject, phaseName, args, function(err,jsMsg){
				jsMsg.meta.target = context;
				var subscribersCount = $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, jsMsg);
				if(!subscribersCount){
					console.log(`Nobody listening for <${$$.CONSTANTS.SWARM_FOR_EXECUTION}>!`);
				}
			});
		},null,filterForSerialisable);

		ret.notify();


		return thisObject;
	};

	var asyncReturn = function(err, result){
		var context = valueObject.protectedVars.context;

		if(!context && valueObject.meta.waitStack){
			context = valueObject.meta.waitStack.pop();
			valueObject.protectedVars.context = context;
		}

		beesHealer.asJSON(valueObject, "__return__", [err, result], function(err,jsMsg){
			jsMsg.meta.command = "asyncReturn";
			if(!context){
				context = valueObject.meta.homeSecurityContext;//TODO: CHECK THIS

			}
			jsMsg.meta.target = context;

			if(!context){
				$$.errorHandler.error(new Error("Asynchronous return inside of a swarm that does not wait for results"));
			} else {
				$$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, jsMsg);
			}
		});
	};

	function home(err, result){
		beesHealer.asJSON(valueObject, "home", [err, result], function(err,jsMsg){
			var context = valueObject.meta.homeContext;
			jsMsg.meta.target = context;
			$$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, jsMsg);
		});
	}



	function waitResults(callback, keepAliveCheck, swarm){
		if(!swarm){
			swarm = this;
		}
		if(!keepAliveCheck){
			keepAliveCheck = function(){
				return false;
			}
		}
		var inner = swarm.getInnerValue();
		if(!inner.meta.waitStack){
			inner.meta.waitStack = [];
			inner.meta.waitStack.push($$.securityContext)
		}
		$$.swarmsInstancesManager.waitForSwarm(callback, swarm, keepAliveCheck);
	}


	function getInnerValue(){
		return valueObject;
	}

	function runPhase(functName, args){
		var func = valueObject.myFunctions[functName];
		if(func){
			func.apply(thisObject, args);
		} else {
			$$.errorHandler.syntaxError(functName, valueObject, "Function " + functName + " does not exist!");
		}

	}

	function update(serialisation){
		beesHealer.jsonToNative(serialisation,valueObject);
	}


	function valueOf(){
		var ret = {};
		ret.meta                = valueObject.meta;
		ret.publicVars          = valueObject.publicVars;
		ret.privateVars         = valueObject.privateVars;
		ret.protectedVars       = valueObject.protectedVars;
		return ret;
	}

	function toString (){
		return swarmDebug.cleanDump(thisObject.valueOf());
	}


	function createParallel(callback){
		return require("../parallelJoinPoint").createJoinPoint(thisObject, callback, $$.__intern.mkArgs(arguments,1));
	}

	function createSerial(callback){
		return require("../serialJoinPoint").createSerialJoinPoint(thisObject, callback, $$.__intern.mkArgs(arguments,1));
	}

	function inspect(){
		return swarmDebug.cleanDump(thisObject.valueOf());
	}

	function constructor(){
		return SwarmDescription;
	}

	function ensureLocalId(){
		if(!valueObject.localId){
			valueObject.localId = valueObject.meta.swarmTypeName + "-" + localId;
			localId++;
		}
	}

	function observe(callback, waitForMore, filter){
		if(!waitForMore){
			waitForMore = function (){
				return false;
			}
		}

		ensureLocalId();

		$$.PSK_PubSub.subscribe(valueObject.localId, callback, waitForMore, filter);
	}

	function toJSON(prop){
		//preventing max call stack size exceeding on proxy auto referencing
		//replace {} as result of JSON(Proxy) with the string [Object protected object]
		return "[Object protected object]";
	}

	function getJSON(callback){
		return	beesHealer.asJSON(valueObject, null, null,callback);
	}

	function notify(event){
		if(!event){
			event = valueObject;
		}
		ensureLocalId();
		$$.PSK_PubSub.publish(valueObject.localId, event);
	}

	function getMeta(name){
		return valueObject.getMeta(name);
	}

	function setMeta(name, value){
		return valueObject.setMeta(name, value);
	}

	ret.setMeta			= setMeta;
	ret.getMeta			= getMeta;
	ret.swarm           = swarmFunction;
	ret.notify          = notify;
	ret.getJSON    	    = getJSON;
	ret.toJSON          = toJSON;
	ret.observe         = observe;
	ret.inspect         = inspect;
	ret.join            = createParallel;
	ret.parallel        = createParallel;
	ret.serial          = createSerial;
	ret.valueOf         = valueOf;
	ret.update          = update;
	ret.runPhase        = runPhase;
	ret.onReturn        = waitResults;
	ret.onResult        = waitResults;
	ret.asyncReturn     = asyncReturn;
	ret.return          = asyncReturn;
	ret.getInnerValue   = getInnerValue;
	ret.home            = home;
	ret.toString        = toString;
	ret.constructor     = constructor;
	ret.setMetadata		= valueObject.setMeta.bind(valueObject);
	ret.getMetadata		= valueObject.getMeta.bind(valueObject);

	ret.autoInit		= null;
	return ret;

};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/utilityFunctions/base.js","/modules/callflow/lib/utilityFunctions")

},{"../choreographies/SwarmDebug":"/opt/privatesky/modules/callflow/lib/choreographies/SwarmDebug.js","../parallelJoinPoint":"/opt/privatesky/modules/callflow/lib/parallelJoinPoint.js","../serialJoinPoint":"/opt/privatesky/modules/callflow/lib/serialJoinPoint.js","buffer":"buffer","swarmutils":"swarmutils","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/utilityFunctions/callflow.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
exports.createForObject = function(valueObject, thisObject, localId){
	var ret = require("./base").createForObject(valueObject, thisObject, localId);

	ret.swarm           = null;
	ret.onReturn        = null;
	ret.onResult        = null;
	ret.asyncReturn     = null;
	ret.return          = null;
	ret.home            = null;

	return ret;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/utilityFunctions/callflow.js","/modules/callflow/lib/utilityFunctions")

},{"./base":"/opt/privatesky/modules/callflow/lib/utilityFunctions/base.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/lib/utilityFunctions/transaction.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
exports.createForObject = function(valueObject, thisObject, localId){
	var ret = require("./base").createForObject(valueObject, thisObject, localId);

	ret.swarm           = null;
	ret.onReturn        = null;
	ret.onResult        = null;
	ret.asyncReturn     = null;
	ret.return          = null;
	ret.home            = null;
	ret.autoInit        = function(){
		thisObject.transaction = $$.blockchain.beginTransaction(thisObject);
	};
	ret.isPersisted  	= function () {
		return thisObject.getMetadata('persisted') === true;
	};

	return ret;
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/lib/utilityFunctions/transaction.js","/modules/callflow/lib/utilityFunctions")

},{"./base":"/opt/privatesky/modules/callflow/lib/utilityFunctions/base.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/callflow/standardGlobalSymbols.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
let logger = console;

if (process.env.NO_LOGS !== 'true') {
    try {
        const PSKLoggerModule = require('psklogger');
        const PSKLogger = PSKLoggerModule.PSKLogger;
        
        logger = PSKLogger.getLogger();
        
        // TODO: remove this once $$ logger is used instead of console
        PSKLoggerModule.overwriteConsole();

        console.log('Logger init successful', process.pid);
    } catch (e) {
        console.warn('Logger not available, using console', e);
        logger = console;
    }
} else {
    console.log('Environment flag NO_LOGS is set, logging to console');
}

$$.registerGlobalSymbol = function (newSymbol, value) {
    if (typeof $$[newSymbol] == "undefined") {
        Object.defineProperty($$, newSymbol, {
            value: value,
            writable: false
        });
    } else {
        logger.error("Refusing to overwrite $$." + newSymbol);
    }
};

$$.registerGlobalSymbol("autoThrow", function (err) {
    if (!err) {
        throw err;
    }
});

$$.registerGlobalSymbol("ignoreError", function (err) {
    if (err) {
        $$.error(err);
    }
});

$$.registerGlobalSymbol("exception", function (message, type) {
    if (!err) {
        throw new Error(message);
    }
});

$$.registerGlobalSymbol("err", function (...args) {
    logger.error(...args);
});

$$.registerGlobalSymbol("warn", function (...args) {
    logger.warn(...args);
});

/* a feature is planned but not implemented (during development) but
also it could remain in production and should be flagged asap*/
$$.registerGlobalSymbol("incomplete", function (...args) {
    logger.warn(...args);
});

/* used during development and when trying to discover elusive errors*/
$$.registerGlobalSymbol("assert", function (value, explainWhy) {
    if (!value) {
        throw new Error("Assert false " + explainWhy);
    }
});

/* enable/disabale flags that control psk behaviour*/
$$.registerGlobalSymbol("flags", function (flagName, value) {
    $$.incomplete("flags handling not implemented");
});

$$.registerGlobalSymbol("obsolete", function (...args) {
    logger.log(...args);
});

$$.registerGlobalSymbol("log", function (...args) {
    logger.log(...args);
});

$$.registerGlobalSymbol("syntaxError", function (...args) {
    logger.log(...args);
});

/* log unknown exceptions*/
$$.registerGlobalSymbol("unknownException", function (...args) {
    logger.log(...args);
});

/* PrivateSky event, used by monitoring and statistics*/
$$.registerGlobalSymbol("event", function (event, ...args) {
    if (logger.hasOwnProperty('event')) {
        logger.event(event, ...args);
    } else {
        console.log(event, ...args);
    }
});

/* */
$$.registerGlobalSymbol("redirectLog", function(logType, logObject) {
    logger.redirect(logType, logObject);
});

/* log throttling event // it is just an event?*/
$$.registerGlobalSymbol("throttlingEvent", function (...args) {
    logger.log(...args);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/standardGlobalSymbols.js","/modules/callflow")

},{"buffer":"buffer","psklogger":"psklogger","timers":"timers"}],"/opt/privatesky/modules/pskbuffer/lib/PSKBuffer.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
function PSKBuffer() {}

function getArrayBufferInterface () {
    if(typeof SharedArrayBuffer === 'undefined') {
        return ArrayBuffer;
    } else {
        return SharedArrayBuffer;
    }
}

PSKBuffer.from = function (source) {
    const ArrayBufferInterface = getArrayBufferInterface();

    const buffer = new Uint8Array(new ArrayBufferInterface(source.length));
    buffer.set(source, 0);

    return buffer;
};

PSKBuffer.concat = function ([ ...params ], totalLength) {
    const ArrayBufferInterface = getArrayBufferInterface();

    if (!totalLength && totalLength !== 0) {
        totalLength = 0;
        for (const buffer of params) {
            totalLength += buffer.length;
        }
    }

    const buffer = new Uint8Array(new ArrayBufferInterface(totalLength));
    let offset = 0;

    for (const buf of params) {
        const len = buf.length;

        const nextOffset = offset + len;
        if (nextOffset > totalLength) {
            const remainingSpace = totalLength - offset;
            for (let i = 0; i < remainingSpace; ++i) {
                buffer[offset + i] = buf[i];
            }
        } else {
            buffer.set(buf, offset);
        }

        offset = nextOffset;
    }

    return buffer;
};

PSKBuffer.isBuffer = function (pskBuffer) {
    return !!ArrayBuffer.isView(pskBuffer);
};

PSKBuffer.alloc = function(size) {
    const ArrayBufferInterface = getArrayBufferInterface();

    return new Uint8Array(new ArrayBufferInterface(size));
};

module.exports = PSKBuffer;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/pskbuffer/lib/PSKBuffer.js","/modules/pskbuffer/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/LoggerClient/GenericLoggerClient.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const LogFactory = require('./LogFactory');

/**
 *
 * @param {TransportInterface} messagePublisher
 * @constructor
 */
function GenericLoggerClient(messagePublisher) {
    /**
     * This is to be used to send normal logs. They will be published in a subchannel of the "logs" channel.
     * It is easier to trace only user and platform logs if they are separated in this channel
     *
     * @param {{code: Number, name: string}} logLevel
     * @param {Object} meta
     * @param {Array<any>} messages
     *
     * @return {{level, meta, time, msTime, messages}}
     */
    function log(logLevel, meta, messages) {
        const log = LogFactory.createLog(logLevel, meta, messages);

        const logChannel = `logs.${logLevel.name}`;
        messagePublisher.send(logChannel, log);

        return log;
    }


    /**
     * This is to be used for sending custom events when messages don't happen in the normal flow of the platform
     * or they shouldn't interfere with the tracing of logs
     * For example, sending statistics about a node or a sandbox is happening periodically and not as a result of
     * users' running code, therefore this should not be merged with logs
     *
     * @param {string} channel
     * @param {Object} meta
     * @param {Array<any>} messages
     * @return {{meta, messages, time}}
     */
    function event(channel, meta, messages) {
        const event = LogFactory.createEvent(meta, messages);

        const logChannel = `events.${channel}`;
        messagePublisher.send(logChannel, event);

        return event;
    }

    function publish(channel, message) {
        messagePublisher.send(channel, message);

        return message;
    }

    this.event  = event;
    this.log    = log;
    this.publish = publish;
}

module.exports = GenericLoggerClient;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/LoggerClient/GenericLoggerClient.js","/modules/psklogger/src/LoggerClient")

},{"./LogFactory":"/opt/privatesky/modules/psklogger/src/LoggerClient/LogFactory.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/LoggerClient/LogFactory.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
function getTime() {
    if(process.env.context === 'sandbox') {

        return Date.now()
    } else {
        const {performance} = require('perf_hooks');

        return performance.now() + performance.timeOrigin;
    }
}


function createLog(logLevel, meta, messages) {
    return {
        level: logLevel,
        messages: messages,
        meta: meta,
        time: getTime()
    }
}

function createEvent(meta, messages) {
    return {
        messages,
        meta,
        time: getTime()
    };
}

module.exports = {
    createLog,
    createEvent
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/LoggerClient/LogFactory.js","/modules/psklogger/src/LoggerClient")

},{"buffer":"buffer","perf_hooks":false,"timers":"timers"}],"/opt/privatesky/modules/psklogger/src/LoggerClient/LoggerClient.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const GenericLoggerClient = require('./GenericLoggerClient');
const LogLevel = require('../utils/LogLevel');
const LoggerInterface = require('./LoggerInterface');

/**
 *
 * @param {TransportInterface} messagePublisher
 * @implements LoggerInterface
 * @constructor
 */
function LoggerClient(messagePublisher) {
    LoggerInterface.call(this);

    const genericLoggerClient = new GenericLoggerClient(messagePublisher);


    /************* PUBLIC METHODS *************/

    function debug(meta = {}, ...params) {
        const logLevel = _getLogLevel(LogLevel.debug);

        return genericLoggerClient.log(logLevel, meta, params);
    }

    function error(meta = {}, ...params) {
        const logLevel = _getLogLevel(LogLevel.error);

        return genericLoggerClient.log(logLevel, meta, params);
    }

    function info(meta = {}, ...params) {
        const logLevel = _getLogLevel(LogLevel.info);

        return genericLoggerClient.log(logLevel, meta, params);
    }

    function log(meta = {}, ...params) {
        const logLevel = _getLogLevel(LogLevel.log);

        return genericLoggerClient.log(logLevel, meta, params);
    }

    function warn(meta = {}, ...params) {
        const logLevel = _getLogLevel(LogLevel.warn);

        return genericLoggerClient.log(logLevel, meta, params);
    }

    function event(channel, meta = {}, ...params) {
        return genericLoggerClient.event(channel, meta, ...params);
    }
    
    function redirect(channel, logObject) {
        return genericLoggerClient.publish(channel, logObject)
    }


    /************* PRIVATE METHODS *************/

    function _getLogLevel(levelCode) {
        return {
            code: levelCode,
            name: LogLevel[levelCode]
        };
    }


    /************* EXPORTS *************/

    this.debug    = debug;
    this.error    = error;
    this.event    = event;
    this.info     = info;
    this.log      = log;
    this.redirect = redirect;
    this.warn     = warn;
}

module.exports = LoggerClient;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/LoggerClient/LoggerClient.js","/modules/psklogger/src/LoggerClient")

},{"../utils/LogLevel":"/opt/privatesky/modules/psklogger/src/utils/LogLevel.js","./GenericLoggerClient":"/opt/privatesky/modules/psklogger/src/LoggerClient/GenericLoggerClient.js","./LoggerInterface":"/opt/privatesky/modules/psklogger/src/LoggerClient/LoggerInterface.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/LoggerClient/LoggerInterface.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/**
 * @interface
 */
function LoggerInterface() {
    function genericMethod(channel, logObject) {
        throw new Error('Not implemented');
    }

    this.debug    = genericMethod;
    this.error    = genericMethod;
    this.event    = genericMethod;
    this.info     = genericMethod;
    this.log      = genericMethod;
    this.redirect = genericMethod;
    this.warn     = genericMethod;
}

module.exports = LoggerInterface;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/LoggerClient/LoggerInterface.js","/modules/psklogger/src/LoggerClient")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/LoggerClient/index.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const GenericLoggerClient = require('./GenericLoggerClient');
const LogFactory          = require('./LogFactory');
const LoggerClient        = require('./LoggerClient');
const LoggerInterface     = require('./LoggerInterface');


module.exports = {
    GenericLoggerClient,
    LogFactory,
    LoggerClient,
    LoggerInterface
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/LoggerClient/index.js","/modules/psklogger/src/LoggerClient")

},{"./GenericLoggerClient":"/opt/privatesky/modules/psklogger/src/LoggerClient/GenericLoggerClient.js","./LogFactory":"/opt/privatesky/modules/psklogger/src/LoggerClient/LogFactory.js","./LoggerClient":"/opt/privatesky/modules/psklogger/src/LoggerClient/LoggerClient.js","./LoggerInterface":"/opt/privatesky/modules/psklogger/src/LoggerClient/LoggerInterface.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/MessagePublisher/MessagePublisher.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const TransportInterface = require('./TransportInterface');
const utils = require('../utils');
const zeroMQ = require('zeromq');


/**
 * Creates a ZeroMQ Publisher Socket and connects to the specified address for a ZeroMQ Subscriber
 * @param {string!} address - Base address including protocol and port (ex: tcp://127.0.0.1:8080)
 * @implements TransportInterface
 * @constructor
 */
function MessagePublisher(address) {
    TransportInterface.call(this);

    const zmqSocket = zeroMQ.createSocket('pub');

    // uncomment next line if messages are lost
    // zmqSocket.setsockopt(zeroMQ.ZMQ_SNDHWM, 0);
    const socket = new utils.BufferedSocket(zmqSocket, utils.SocketType.connectable);


    /************* PUBLIC METHODS *************/

    /**
     *
     * @param {string} channel
     * @param {Object} logObject
     */
    this.send = function (channel, logObject) {
        try {
            const serializedLog = JSON.stringify(logObject);

            socket.send([channel, serializedLog]);
        } catch (e) {
            process.stderr.write('Error while sending or serializing message');
        }
    };


    /************* MONITOR SOCKET *************/

    zmqSocket.connect(address);
}

module.exports = MessagePublisher;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/MessagePublisher/MessagePublisher.js","/modules/psklogger/src/MessagePublisher")

},{"../utils":"/opt/privatesky/modules/psklogger/src/utils/index.js","./TransportInterface":"/opt/privatesky/modules/psklogger/src/MessagePublisher/TransportInterface.js","buffer":"buffer","timers":"timers","zeromq":false}],"/opt/privatesky/modules/psklogger/src/MessagePublisher/MessagePublisherForSandbox.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const TransportInterface = require('./TransportInterface');

/**
 * This assumes it is executed inside a sandbox and that exists an object "logger" on "global" with a method "send".
 * Sandboxes can't connect directly to ZeroMQ therefore this just relays the message outside the sandbox.
 *
 * @implements TransportInterface
 * @constructor
 */
function MessagePublisherForSandbox() {

    TransportInterface.call(this);

    /************* PUBLIC METHODS *************/

    /**
     *
     * @param {string} channel
     * @param {Object} logObject
     */
    this.send = function (channel, logObject) {
        try {
            global.logger.send([channel, logObject]);
        } catch (e) {
            console.error('Error while sending or serializing message');
        }
    };

}

module.exports = MessagePublisherForSandbox;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/MessagePublisher/MessagePublisherForSandbox.js","/modules/psklogger/src/MessagePublisher")

},{"./TransportInterface":"/opt/privatesky/modules/psklogger/src/MessagePublisher/TransportInterface.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/MessagePublisher/TransportInterface.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/**
 *
 * @interface
 */
function TransportInterface() {
    this.send = function (channel, logObject) {
        throw new Error('Not implemented');
    }
}

module.exports = TransportInterface;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/MessagePublisher/TransportInterface.js","/modules/psklogger/src/MessagePublisher")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/MessagePublisher/index.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const TransportInterface = require('./TransportInterface');

module.exports = {
    TransportInterface
};

if(process.env.context === 'sandbox') {
    module.exports.MessagePublisher = require('./MessagePublisherForSandbox');
} else {
    module.exports.MessagePublisher = require('./MessagePublisher');
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/MessagePublisher/index.js","/modules/psklogger/src/MessagePublisher")

},{"./MessagePublisher":"/opt/privatesky/modules/psklogger/src/MessagePublisher/MessagePublisher.js","./MessagePublisherForSandbox":"/opt/privatesky/modules/psklogger/src/MessagePublisher/MessagePublisherForSandbox.js","./TransportInterface":"/opt/privatesky/modules/psklogger/src/MessagePublisher/TransportInterface.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/MessageSubscriber/MessageSubscriber.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const zeroMQ = require('zeromq');

/**
 * Creates a ZeroMQ Subscriber that listens for provided topics on the specified address for a publisher
 * @param {string!} address - Base address including protocol and port (ex: tcp://127.0.0.1:8080)
 * @param {Array<string>|function?} subscriptions - a list of subscription topics, if missing it will subscribe to everything
 * @param {function!} onMessageCallback
 * @constructor
 */
function MessageSubscriber(address, subscriptions, onMessageCallback) {
    const zmqSocket = zeroMQ.createSocket('sub');

    // uncomment next line if messages are lost
    // zmqSocket.setsockopt(zeroMQ.ZMQ_RCVHWM, 0);

    if(arguments.length === 2 && typeof subscriptions === 'function') {
        onMessageCallback = subscriptions;
        subscriptions = [''];
    }

    subscriptions.forEach(subscription => zmqSocket.subscribe(subscription));

    zmqSocket.connect(address);

    zmqSocket.on('message', onMessageCallback);

    const events = ["SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM", "SIGHUP"];

    events.forEach(event => {
        process.on(event, () => {
            zmqSocket.close();
        });
    });
}

module.exports = MessageSubscriber;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/MessageSubscriber/MessageSubscriber.js","/modules/psklogger/src/MessageSubscriber")

},{"buffer":"buffer","timers":"timers","zeromq":false}],"/opt/privatesky/modules/psklogger/src/MessageSubscriber/index.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const MessageSubscriber = require('./MessageSubscriber');

module.exports = {MessageSubscriber};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/MessageSubscriber/index.js","/modules/psklogger/src/MessageSubscriber")

},{"./MessageSubscriber":"/opt/privatesky/modules/psklogger/src/MessageSubscriber/MessageSubscriber.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/PSKLoggerClient/GenericPSKLogger.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const LoggerClientModule = require('../LoggerClient');

const LoggerClient = LoggerClientModule.LoggerClient;
const LoggerInterface = LoggerClientModule.LoggerInterface;


/**
 *
 * @param messagePublisher
 * @implements LoggerInterface
 * @constructor
 */
function GenericPSKLogger(messagePublisher) {
    LoggerInterface.call(this);

    const logger = new LoggerClient(messagePublisher);

    function debug(...params) {
        const meta = prepareMeta();
        return logger.debug(meta, ...params);
    }

    function error(...params) {
        const meta = prepareMeta();
        return logger.error(meta, ...params);
    }

    function info(...params) {
        const meta = prepareMeta();
        return logger.info(meta, ...params);
    }

    function log(...params) {
        const meta = prepareMeta();
        return logger.log(meta, ...params);
    }

    function warn(...params) {
        const meta = prepareMeta();
        return logger.warn(meta, ...params);
    }

    function event(event, ...params) {
        const meta = prepareMeta();
        return logger.event(event, meta, params);
    }
    
    function redirect(logType, logObject) {
        const logMeta = logObject.meta;
        const meta = prepareMeta();
        
        Object.assign(meta, logMeta);

        logObject.meta = meta;

        return logger.redirect(logType, logObject);
    }

    function prepareMeta() {
        if (global.$$.getEnvironmentData) {
            return global.$$.getEnvironmentData();
        }
        
        return {};
    }


    this.debug    = debug;
    this.error    = error;
    this.event    = event;
    this.info     = info;
    this.log      = log;
    this.redirect = redirect;
    this.warn     = warn;

}

module.exports = GenericPSKLogger;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/PSKLoggerClient/GenericPSKLogger.js","/modules/psklogger/src/PSKLoggerClient")

},{"../LoggerClient":"/opt/privatesky/modules/psklogger/src/LoggerClient/index.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/PSKLoggerClient/index.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const Configurator     = require('../utils/Configurator');
const GenericPSKLogger = require('./GenericPSKLogger');
const MessagePublisher = require('../MessagePublisher').MessagePublisher;

function getLogger() {
    let messagePublisher;

    if (process.env.context === 'sandbox') {

        messagePublisher = new MessagePublisher();
    } else {
        const config = Configurator.getConfig();
        messagePublisher = new MessagePublisher(config.addressForPublishers);
    }

    return new GenericPSKLogger(messagePublisher);
}

module.exports = {
    getLogger
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/PSKLoggerClient/index.js","/modules/psklogger/src/PSKLoggerClient")

},{"../MessagePublisher":"/opt/privatesky/modules/psklogger/src/MessagePublisher/index.js","../utils/Configurator":"/opt/privatesky/modules/psklogger/src/utils/Configurator.js","./GenericPSKLogger":"/opt/privatesky/modules/psklogger/src/PSKLoggerClient/GenericPSKLogger.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/PubSubProxy/PubSubProxy.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const zeroMQ = require('zeromq');
const utils = require('../utils');

/**
 * Proxy between publishers and subscribers to avoid star topology communication
 * Subscribers should connect first otherwise no subscription request will be sent to publishers and therefore they
 * won't even send the messages to the proxy. This is because the filtering is done on the publisher for tcp or ipc,
 * view http://zguide.zeromq.org/page:all#Getting-the-Message-Out for more info
 * @param {string!} addressForPublishers - Base address including protocol and port (ex: tcp://127.0.0.1:8080)
 * @param {string!} addressForSubscribers - Base address including protocol and port (ex: tcp://127.0.0.1:8080)
 * @constructor
 */
function PubSubProxy({addressForPublishers, addressForSubscribers}) {
    const frontend = zeroMQ.createSocket('xsub');
    const backend = zeroMQ.createSocket('xpub');
    const bufferedBackend = new utils.BufferedSocket(backend, utils.SocketType.bindable);

    // By default xpub only signals new subscriptions
    // Settings it to verbose = 1 , will signal on every new subscribe
    // uncomment next lines if messages are lost
    // backend.setsockopt(zeroMQ.ZMQ_XPUB_VERBOSE, 1);
    // backend.setsockopt(zeroMQ.ZMQ_SNDHWM, 0);
    // backend.setsockopt(zeroMQ.ZMQ_RCVHWM, 0);
    // frontend.setsockopt(zeroMQ.ZMQ_RCVHWM, 0);
    // frontend.setsockopt(zeroMQ.ZMQ_SNDHWM, 0);

    // When we receive data on frontend, it means someone is publishing
    frontend.on('message', (...args) => {
        // We just relay it to the backend, so subscribers can receive it
        bufferedBackend.send(args);
    });

    // When backend receives a message, it's subscribe requests
    backend.on('message', (data) => {
        // We send it to frontend, so it knows to what channels to listen to
        frontend.send(data);
    });

    /************* MONITOR SOCKET *************/

    frontend.bindSync(addressForPublishers);
    backend.bindSync(addressForSubscribers);

    const events = ["SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM", "SIGHUP"];

    events.forEach(event => {
        process.on(event, () => {
            frontend.close();
            backend.close();
        });
    });
}

module.exports = PubSubProxy;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/PubSubProxy/PubSubProxy.js","/modules/psklogger/src/PubSubProxy")

},{"../utils":"/opt/privatesky/modules/psklogger/src/utils/index.js","buffer":"buffer","timers":"timers","zeromq":false}],"/opt/privatesky/modules/psklogger/src/PubSubProxy/index.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const PubSubProxy = require('./PubSubProxy');

module.exports = {PubSubProxy};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/PubSubProxy/index.js","/modules/psklogger/src/PubSubProxy")

},{"./PubSubProxy":"/opt/privatesky/modules/psklogger/src/PubSubProxy/PubSubProxy.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/utils/BufferedSocket.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const SocketType = require('./SocketType');

/**
 * Wrapper for ZeroMQ socket that tries to prevent 'slow joiner', meaning it buffers the first messages until the
 * connection is established, otherwise the first messages would be lost
 * @param {Socket} socket - instance of ZeroMQ Socket
 * @param {SocketType<number>} type - used to determine if should listen for 'connect' or 'accept' event
 * @param {Number?} maxSize = 1000 - Max size for the internal buffer, if 0 the buffer is infinite but can cause memory leak
 * @constructor
 */
function BufferedSocket(socket, type, maxSize = 10000) {
    if(maxSize < 0) {
        maxSize = 1000;
    }

    let messageQueue = [];
    let isConnected = false;
    let currentBufferSize = 0;

    socket.monitor();
    const event = _getEventForType(type);

    socket.on(event, () => {
        isConnected = true;
        _flushQueue();
    });

    /************* PUBLIC METHODS *************/

    function send(message) {
        if (!isConnected) {
            if (maxSize !== 0 && currentBufferSize < maxSize) {
                currentBufferSize += 1;
                messageQueue.push(message);
            }
        } else {
            socket.send(message);
        }
    }

    /************* PRIVATE METHODS *************/

    function _flushQueue() {
        for (const message of messageQueue) {
            socket.send(message);
        }

        messageQueue = [];
        currentBufferSize = 0;
    }

    function _getEventForType(type) {
        if (type === SocketType.connectable) {
            return 'connect';
        } else if (type === SocketType.bindable) {
            return 'accept';
        }
    }

    /************* EXPORTS *************/

    this.send = send;
}


module.exports = BufferedSocket;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/utils/BufferedSocket.js","/modules/psklogger/src/utils")

},{"./SocketType":"/opt/privatesky/modules/psklogger/src/utils/SocketType.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/utils/Configurator.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const config = {
    addressForPublishers: 'tcp://127.0.0.1:7000',
    addressForSubscribers: 'tcp://127.0.0.1:7001',
    addressForCollector: 'tcp://127.0.0.1:5558'
};

module.exports = {
    getConfig () {
        return Object.freeze(config);
    }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/utils/Configurator.js","/modules/psklogger/src/utils")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/utils/EnvironmentDataProvider.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){


function getEnvironmentData () {
    const path = require('path');
    const os = require('os');
    const platform = os.platform();

    const processPath = process.argv[1];
    const lastSep = processPath.lastIndexOf(path.sep);
    const processStartFile = processPath.substring(lastSep + 1);
    return {
        origin: 'node',
        context: processStartFile,
        processStartFile: processStartFile,
        platform: platform
    };
}

function getEnvironmentDataForDomain() {
    const os = require('os');
    const platform = os.platform();

    return {
        origin: 'domain',
        domain: process.env.PRIVATESKY_DOMAIN_NAME,
        platform: platform
    }
}

function getEnvironmentDataForAgent() {
    const os = require('os');
    const platform = os.platform();

    return {
        origin: 'agent',
        domain: process.env.PRIVATESKY_DOMAIN_NAME,
        agent: process.env.PRIVATESKY_AGENT_NAME,
        platform: platform
    }
}

function getEnvironmentDataForSandbox() {
    return {
        origin: 'sandbox'
    }
}

module.exports = {
    getEnvironmentData,
    getEnvironmentDataForAgent,
    getEnvironmentDataForDomain,
    getEnvironmentDataForSandbox
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/utils/EnvironmentDataProvider.js","/modules/psklogger/src/utils")

},{"buffer":"buffer","os":false,"path":"path","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/utils/LogLevel.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const LogLevel = {};

LogLevel[LogLevel["error"] = 0] = "error";
LogLevel[LogLevel["warn"]  = 1] = "warn";
LogLevel[LogLevel["info"]  = 2] = "info";
LogLevel[LogLevel["debug"] = 3] = "debug";
LogLevel[LogLevel["log"]   = 4] = "log";

module.exports = Object.freeze(LogLevel);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/utils/LogLevel.js","/modules/psklogger/src/utils")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/utils/SocketType.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const SocketType = {};
SocketType[SocketType["connectable"] = 0] = "connectable"; // if .connect is called on socket
SocketType[SocketType["bindable"] = 1] = "bindable"; // if .bind is called on socket

module.exports = Object.freeze(SocketType);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/utils/SocketType.js","/modules/psklogger/src/utils")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/psklogger/src/utils/index.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const Configurator            = require('./Configurator');
const EnvironmentDataProvider = require('./EnvironmentDataProvider');
const LogLevel                = require('./LogLevel');
const BufferedSocket          = require('./BufferedSocket');
const SocketType              = require('./SocketType');

module.exports = {
    Configurator,
    EnvironmentDataProvider,
    LogLevel,
    BufferedSocket,
    SocketType
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/src/utils/index.js","/modules/psklogger/src/utils")

},{"./BufferedSocket":"/opt/privatesky/modules/psklogger/src/utils/BufferedSocket.js","./Configurator":"/opt/privatesky/modules/psklogger/src/utils/Configurator.js","./EnvironmentDataProvider":"/opt/privatesky/modules/psklogger/src/utils/EnvironmentDataProvider.js","./LogLevel":"/opt/privatesky/modules/psklogger/src/utils/LogLevel.js","./SocketType":"/opt/privatesky/modules/psklogger/src/utils/SocketType.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/soundpubsub/lib/soundPubSub.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/*
Initial License: (c) Axiologic Research & Alboaie Sînică.
Contributors: Axiologic Research , PrivateSky project
Code License: LGPL or MIT.
*/


/**
 *   Usually an event could cause execution of other callback events . We say that is a level 1 event if is causeed by a level 0 event and so on
 *
 *      SoundPubSub provides intuitive results regarding to asynchronous calls of callbacks and computed values/expressions:
 *   we prevent immediate execution of event callbacks to ensure the intuitive final result is guaranteed as level 0 execution
 *   we guarantee that any callback function is "re-entrant"
 *   we are also trying to reduce the number of callback execution by looking in queues at new messages published by
 *   trying to compact those messages (removing duplicate messages, modifying messages, or adding in the history of another event ,etc)
 *
 *      Example of what can be wrong without non-sound asynchronous calls:
 *
 *  Step 0: Initial state:
 *   a = 0;
 *   b = 0;
 *
 *  Step 1: Initial operations:
 *   a = 1;
 *   b = -1;
 *
 *  // an observer reacts to changes in a and b and compute CORRECT like this:
 *   if( a + b == 0) {
 *       CORRECT = false;
 *       notify(...); // act or send a notification somewhere..
 *   } else {
 *      CORRECT = false;
 *   }
 *
 *    Notice that: CORRECT will be true in the end , but meantime, after a notification was sent and CORRECT was wrongly, temporarily false!
 *    soundPubSub guarantee that this does not happen because the syncronous call will before any observer (bot asignation on a and b)
 *
 *   More:
 *   you can use blockCallBacks and releaseCallBacks in a function that change a lot a collection or bindable objects and all
 *   the notifications will be sent compacted and properly
 */

// TODO: optimisation!? use a more efficient queue instead of arrays with push and shift!?
// TODO: see how big those queues can be in real applications
// for a few hundreds items, queues made from array should be enough
//*   Potential TODOs:
//    *     prevent any form of problem by calling callbacks in the expected order !?
//*     preventing infinite loops execution cause by events!?
//*
//*
// TODO: detect infinite loops (or very deep propagation) It is possible!?

const Queue = require('swarmutils').Queue;

function SoundPubSub(){

	/**
	 * publish
	 *      Publish a message {Object} to a list of subscribers on a specific topic
	 *
	 * @params {String|Number} target,  {Object} message
	 * @return number of channel subscribers that will be notified
	 */
	this.publish = function(target, message){
		if(!invalidChannelName(target) && !invalidMessageType(message) && (typeof channelSubscribers[target] != 'undefined')){
			compactAndStore(target, message);
			setTimeout(dispatchNext, 0);
			return channelSubscribers[target].length;
		} else{
			return null;
		}
	};

	/**
	 * subscribe
	 *      Subscribe / add a {Function} callBack on a {String|Number}target channel subscribers list in order to receive
	 *      messages published if the conditions defined by {Function}waitForMore and {Function}filter are passed.
	 *
	 * @params {String|Number}target, {Function}callBack, {Function}waitForMore, {Function}filter
	 *
	 *          target      - channel name to subscribe
	 *          callback    - function to be called when a message was published on the channel
	 *          waitForMore - a intermediary function that will be called after a successfuly message delivery in order
	 *                          to decide if a new messages is expected...
	 *          filter      - a function that receives the message before invocation of callback function in order to allow
	 *                          relevant message before entering in normal callback flow
	 * @return
	 */
	this.subscribe = function(target, callBack, waitForMore, filter){
		if(!invalidChannelName(target) && !invalidFunction(callBack)){
			var subscriber = {"callBack":callBack, "waitForMore":waitForMore, "filter":filter};
			var arr = channelSubscribers[target];
			if(typeof arr == 'undefined'){
				arr = [];
				channelSubscribers[target] = arr;
			}
			arr.push(subscriber);
		}
	};

	/**
	 * unsubscribe
	 *      Unsubscribe/remove {Function} callBack from the list of subscribers of the {String|Number} target channel
	 *
	 * @params {String|Number} target, {Function} callBack, {Function} filter
	 *
	 *          target      - channel name to unsubscribe
	 *          callback    - reference of the original function that was used as subscribe
	 *          filter      - reference of the original filter function
	 * @return
	 */
	this.unsubscribe = function(target, callBack, filter){
		if(!invalidFunction(callBack)){
			var gotit = false;
			if(channelSubscribers[target]){
				for(var i = 0; i < channelSubscribers[target].length;i++){
					var subscriber =  channelSubscribers[target][i];
					if(subscriber.callBack === callBack && ( typeof filter === 'undefined' || subscriber.filter === filter )){
						gotit = true;
						subscriber.forDelete = true;
						subscriber.callBack = undefined;
						subscriber.filter = undefined;
					}
				}
			}
			if(!gotit){
				wprint("Unable to unsubscribe a callback that was not subscribed!");
			}
		}
	};

	/**
	 * blockCallBacks
	 *
	 * @params
	 * @return
	 */
	this.blockCallBacks = function(){
		level++;
	};

	/**
	 * releaseCallBacks
	 *
	 * @params
	 * @return
	 */
	this.releaseCallBacks = function(){
		level--;
		//hack/optimisation to not fill the stack in extreme cases (many events caused by loops in collections,etc)
		while(level === 0 && dispatchNext(true)){
			//nothing
		}

		while(level === 0 && callAfterAllEvents()){
            //nothing
		}
	};

	/**
	 * afterAllEvents
	 *
	 * @params {Function} callback
	 *
	 *          callback - function that needs to be invoked once all events are delivered
	 * @return
	 */
	this.afterAllEvents = function(callBack){
		if(!invalidFunction(callBack)){
			afterEventsCalls.push(callBack);
		}
		this.blockCallBacks();
		this.releaseCallBacks();
	};

	/**
	 * hasChannel
	 *
	 * @params {String|Number} channel
	 *
	 *          channel - name of the channel that need to be tested if present
	 * @return
	 */
	this.hasChannel = function(channel){
		return !invalidChannelName(channel) && (typeof channelSubscribers[channel] != 'undefined') ? true : false;
	};

	/**
	 * addChannel
	 *
	 * @params {String} channel
	 *
	 *          channel - name of a channel that needs to be created and added to soundpubsub repository
	 * @return
	 */
	this.addChannel = function(channel){
		if(!invalidChannelName(channel) && !this.hasChannel(channel)){
			channelSubscribers[channel] = [];
		}
	};

	/* ---------------------------------------- protected stuff ---------------------------------------- */
	var self = this;
	// map channelName (object local id) -> array with subscribers
	var channelSubscribers = {};

	// map channelName (object local id) -> queue with waiting messages
	var channelsStorage = {};

	// object
	var typeCompactor = {};

	// channel names
	var executionQueue = new Queue();
	var level = 0;



	/**
	 * registerCompactor
	 *
	 *       An compactor takes a newEvent and and oldEvent and return the one that survives (oldEvent if
	 *  it can compact the new one or the newEvent if can't be compacted)
	 *
	 * @params {String} type, {Function} callBack
	 *
	 *          type        - channel name to unsubscribe
	 *          callBack    - handler function for that specific event type
	 * @return
	 */
	this.registerCompactor = function(type, callBack) {
		if(!invalidFunction(callBack)){
			typeCompactor[type] = callBack;
		}
	};

	/**
	 * dispatchNext
	 *
	 * @param fromReleaseCallBacks: hack to prevent too many recursive calls on releaseCallBacks
	 * @return {Boolean}
	 */
	function dispatchNext(fromReleaseCallBacks){
		if(level > 0) {
			return false;
		}
		const channelName = executionQueue.front();
		if(typeof channelName != 'undefined'){
			self.blockCallBacks();
			try{
				let message;
				if(!channelsStorage[channelName].isEmpty()) {
					message = channelsStorage[channelName].front();
				}
				if(typeof message == 'undefined'){
					if(!channelsStorage[channelName].isEmpty()){
						wprint("Can't use as message in a pub/sub channel this object: " + message);
					}
					executionQueue.pop();
				} else {
					if(typeof message.__transmisionIndex == 'undefined'){
						message.__transmisionIndex = 0;
						for(var i = channelSubscribers[channelName].length-1; i >= 0 ; i--){
							var subscriber =  channelSubscribers[channelName][i];
							if(subscriber.forDelete === true){
								channelSubscribers[channelName].splice(i,1);
							}
						}
					} else{
						message.__transmisionIndex++;
					}
					//TODO: for immutable objects it will not work also, fix for shape models
					if(typeof message.__transmisionIndex == 'undefined'){
						wprint("Can't use as message in a pub/sub channel this object: " + message);
					}
					subscriber = channelSubscribers[channelName][message.__transmisionIndex];
					if(typeof subscriber == 'undefined'){
						delete message.__transmisionIndex;
						channelsStorage[channelName].pop();
					} else{
						if(subscriber.filter === null || typeof subscriber.filter === "undefined" || (!invalidFunction(subscriber.filter) && subscriber.filter(message))){
							if(!subscriber.forDelete){
								subscriber.callBack(message);
								if(subscriber.waitForMore && !invalidFunction(subscriber.waitForMore) && !subscriber.waitForMore(message)){
									subscriber.forDelete = true;
								}
							}
						}
					}
				}
			} catch(err){
				wprint("Event callback failed: "+ subscriber.callBack +"error: " + err.stack);
			}
			//
			if(fromReleaseCallBacks){
				level--;
			} else{
				self.releaseCallBacks();
			}
			return true;
		} else{
			return false;
		}
	}

	function compactAndStore(target, message){
		var gotCompacted = false;
		var arr = channelsStorage[target];
		if(typeof arr == 'undefined'){
			arr = new Queue();
			channelsStorage[target] = arr;
		}

		if(message && typeof message.type != 'undefined'){
			var typeCompactorCallBack = typeCompactor[message.type];

			if(typeof typeCompactorCallBack != 'undefined'){
				for(let channel of arr) {
					if(typeCompactorCallBack(message, channel) === channel) {
						if(typeof channel.__transmisionIndex == 'undefined') {
							gotCompacted = true;
							break;
						}
					}
				}
			}
		}

		if(!gotCompacted && message){
			arr.push(message);
			executionQueue.push(target);
		}
	}

	var afterEventsCalls = new Queue();
	function callAfterAllEvents (){
		if(!afterEventsCalls.isEmpty()){
			var callBack = afterEventsCalls.pop();
			//do not catch exceptions here..
			callBack();
		}
		return !afterEventsCalls.isEmpty();
	}

	function invalidChannelName(name){
		var result = false;
		if(!name || (typeof name != "string" && typeof name != "number")){
			result = true;
			wprint("Invalid channel name: " + name);
		}

		return result;
	}

	function invalidMessageType(message){
		var result = false;
		if(!message || typeof message != "object"){
			result = true;
			wprint("Invalid messages types: " + message);
		}
		return result;
	}

	function invalidFunction(callback){
		var result = false;
		if(!callback || typeof callback != "function"){
			result = true;
			wprint("Expected to be function but is: " + callback);
		}
		return result;
	}
}

exports.soundPubSub = new SoundPubSub();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/soundpubsub/lib/soundPubSub.js","/modules/soundpubsub/lib")

},{"buffer":"buffer","swarmutils":"swarmutils","timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/Combos.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
function product(args) {
    if(!args.length){
        return [ [] ];
    }
    var prod = product(args.slice(1)), r = [];
    args[0].forEach(function(x) {
        prod.forEach(function(p) {
            r.push([ x ].concat(p));
        });
    });
    return r;
}

function objectProduct(obj) {
    var keys = Object.keys(obj),
        values = keys.map(function(x) { return obj[x]; });

    return product(values).map(function(p) {
        var e = {};
        keys.forEach(function(k, n) { e[k] = p[n]; });
        return e;
    });
}

module.exports = objectProduct;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/Combos.js","/modules/swarmutils/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/OwM.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
var meta = "meta";

function OwM(serialized){

    if(serialized){
        return OwM.prototype.convert(serialized);
    }

    Object.defineProperty(this, meta, {
        writable: false,
        enumerable: true,
        value: {}
    });

    Object.defineProperty(this, "setMeta", {
        writable: false,
        enumerable: false,
        configurable:false,
        value: function(prop, value){
            if(typeof prop == "object" && typeof value == "undefined"){
                for(var p in prop){
                    this[meta][p] = prop[p];
                }
                return prop;
            }
            this[meta][prop] = value;
            return value;
        }
    });

    Object.defineProperty(this, "getMeta", {
        writable: false,
        value: function(prop){
            return this[meta][prop];
        }
    });
}

function testOwMSerialization(obj){
    let res = false;

    if(obj){
        res = typeof obj[meta] != "undefined" && !(obj instanceof OwM);
    }

    return res;
}

OwM.prototype.convert = function(serialized){
    const owm = new OwM();

    for(var metaProp in serialized.meta){
        if(!testOwMSerialization(serialized[metaProp])) {
            owm.setMeta(metaProp, serialized.meta[metaProp]);
        }else{
            owm.setMeta(metaProp, OwM.prototype.convert(serialized.meta[metaProp]));
        }
    }

    for(var simpleProp in serialized){
        if(simpleProp === meta) {
            continue;
        }

        if(!testOwMSerialization(serialized[simpleProp])){
            owm[simpleProp] = serialized[simpleProp];
        }else{
            owm[simpleProp] = OwM.prototype.convert(serialized[simpleProp]);
        }
    }

    return owm;
};

OwM.prototype.getMetaFrom = function(obj, name){
    var res;
    if(!name){
        res = obj[meta];
    }else{
        res = obj[meta][name];
    }
    return res;
};

OwM.prototype.setMetaFor = function(obj, name, value){
    obj[meta][name] = value;
    return obj[meta][name];
};

module.exports = OwM;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/OwM.js","/modules/swarmutils/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/Queue.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
function QueueElement(content) {
	this.content = content;
	this.next = null;
}

function Queue() {
	this.head = null;
	this.tail = null;
	this.length = 0;
	this.push = function (value) {
		const newElement = new QueueElement(value);
		if (!this.head) {
			this.head = newElement;
			this.tail = newElement;
		} else {
			this.tail.next = newElement;
			this.tail = newElement;
		}
		this.length++;
	};

	this.pop = function () {
		if (!this.head) {
			return null;
		}
		const headCopy = this.head;
		this.head = this.head.next;
		this.length--;

		//fix???????
		if(this.length === 0){
            this.tail = null;
		}

		return headCopy.content;
	};

	this.front = function () {
		return this.head ? this.head.content : undefined;
	};

	this.isEmpty = function () {
		return this.head === null;
	};

	this[Symbol.iterator] = function* () {
		let head = this.head;
		while(head !== null) {
			yield head.content;
			head = head.next;
		}
	}.bind(this);
}

Queue.prototype.toString = function () {
	let stringifiedQueue = '';
	let iterator = this.head;
	while (iterator) {
		stringifiedQueue += `${JSON.stringify(iterator.content)} `;
		iterator = iterator.next;
	}
	return stringifiedQueue;
};

Queue.prototype.inspect = Queue.prototype.toString;

module.exports = Queue;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/Queue.js","/modules/swarmutils/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/beesHealer.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const OwM = require("./OwM");

/*
    Prepare the state of a swarm to be serialised
*/

exports.asJSON = function(valueObj, phaseName, args, callback){

        let valueObject = valueObj.valueOf();
        let res = new OwM();
        res.publicVars          = valueObject.publicVars;
        res.privateVars         = valueObject.privateVars;

        res.setMeta("swarmTypeName", OwM.prototype.getMetaFrom(valueObject, "swarmTypeName"));
        res.setMeta("swarmId",       OwM.prototype.getMetaFrom(valueObject, "swarmId"));
        res.setMeta("target",        OwM.prototype.getMetaFrom(valueObject, "target"));
        res.setMeta("homeSecurityContext",        OwM.prototype.getMetaFrom(valueObject, "homeSecurityContext"));
        res.setMeta("requestId",        OwM.prototype.getMetaFrom(valueObject, "requestId"));

        if(!phaseName){
            res.setMeta("command", "stored");
        } else {
            res.setMeta("phaseName", phaseName);
            res.setMeta("phaseId", $$.uidGenerator.safe_uuid());
            res.setMeta("args", args);
            res.setMeta("command", OwM.prototype.getMetaFrom(valueObject, "command") || "executeSwarmPhase");
        }

        res.setMeta("waitStack", valueObject.meta.waitStack); //TODO: think if is not better to be deep cloned and not referenced!!!

        if(callback){
            return callback(null, res);
        }
        //console.log("asJSON:", res, valueObject);
        return res;
};

exports.jsonToNative = function(serialisedValues, result){

    for(let v in serialisedValues.publicVars){
        result.publicVars[v] = serialisedValues.publicVars[v];

    };
    for(let l in serialisedValues.privateVars){
        result.privateVars[l] = serialisedValues.privateVars[l];
    };

    for(let i in OwM.prototype.getMetaFrom(serialisedValues)){
        OwM.prototype.setMetaFor(result, i, OwM.prototype.getMetaFrom(serialisedValues, i));
    };

};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/beesHealer.js","/modules/swarmutils/lib")

},{"./OwM":"/opt/privatesky/modules/swarmutils/lib/OwM.js","buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/pskconsole.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
var commands = {};
var commands_help = {};

//global function addCommand
addCommand = function addCommand(verb, adverbe, funct, helpLine){
    var cmdId;
    if(!helpLine){
        helpLine = " ";
    } else {
        helpLine = " " + helpLine;
    }
    if(adverbe){
        cmdId = verb + " " +  adverbe;
        helpLine = verb + " " +  adverbe + helpLine;
    } else {
        cmdId = verb;
        helpLine = verb + helpLine;
    }
    commands[cmdId] = funct;
        commands_help[cmdId] = helpLine;
};

function doHelp(){
    console.log("List of commands:");
    for(var l in commands_help){
        console.log("\t", commands_help[l]);
    }
}

addCommand("-h", null, doHelp, "\t\t\t\t\t\t |just print the help");
addCommand("/?", null, doHelp, "\t\t\t\t\t\t |just print the help");
addCommand("help", null, doHelp, "\t\t\t\t\t\t |just print the help");


function runCommand(){
  var argv = Object.assign([], process.argv);
  var cmdId = null;
  var cmd = null;
  argv.shift();
  argv.shift();

  if(argv.length >=1){
      cmdId = argv[0];
      cmd = commands[cmdId];
      argv.shift();
  }


  if(!cmd && argv.length >=1){
      cmdId = cmdId + " " + argv[0];
      cmd = commands[cmdId];
      argv.shift();
  }

  if(!cmd){
    if(cmdId){
        console.log("Unknown command: ", cmdId);
    }
    cmd = doHelp;
  }

  cmd.apply(null,argv);

}

module.exports = {
    runCommand
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/pskconsole.js","/modules/swarmutils/lib")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/safe-uuid.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){

function encode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '')
        .replace(/\//g, '')
        .replace(/=+$/, '');
};

function stampWithTime(buf, salt, msalt){
    if(!salt){
        salt = 1;
    }
    if(!msalt){
        msalt = 1;
    }
    var date = new Date;
    var ct = Math.floor(date.getTime() / salt);
    var counter = 0;
    while(ct > 0 ){
        //console.log("Counter", counter, ct);
        buf[counter*msalt] = Math.floor(ct % 256);
        ct = Math.floor(ct / 256);
        counter++;
    }
}

/*
    The uid contains around 256 bits of randomness and are unique at the level of seconds. This UUID should by cryptographically safe (can not be guessed)

    We generate a safe UID that is guaranteed unique (by usage of a PRNG to geneate 256 bits) and time stamping with the number of seconds at the moment when is generated
    This method should be safe to use at the level of very large distributed systems.
    The UUID is stamped with time (seconds): does it open a way to guess the UUID? It depends how safe is "crypto" PRNG, but it should be no problem...

 */

var generateUid = null;


exports.init = function(externalGenerator){
    generateUid = externalGenerator.generateUid;
    return module.exports;
};

exports.safe_uuid = function() {
    var buf = generateUid(32);
    stampWithTime(buf, 1000, 3);
    return encode(buf);
};



/*
    Try to generate a small UID that is unique against chance in the same millisecond second and in a specific context (eg in the same choreography execution)
    The id contains around 6*8 = 48  bits of randomness and are unique at the level of milliseconds
    This method is safe on a single computer but should be used with care otherwise
    This UUID is not cryptographically safe (can be guessed)
 */
exports.short_uuid = function(callback) {
    require('crypto').randomBytes(12, function (err, buf) {
        if (err) {
            callback(err);
            return;
        }
        stampWithTime(buf,1,2);
        callback(null, encode(buf));
    });
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/safe-uuid.js","/modules/swarmutils/lib")

},{"buffer":"buffer","crypto":false,"timers":"timers"}],"/opt/privatesky/modules/swarmutils/lib/uidGenerator.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const crypto = require('crypto');
const Queue = require("./Queue");
var PSKBuffer = typeof $$ !== "undefined" && $$.PSKBuffer ? $$.PSKBuffer : Buffer;

function UidGenerator(minBuffers, buffersSize) {
	var buffers = new Queue();
	var lowLimit = .2;

	function fillBuffers(size){
		//notifyObserver();
		const sz = size || minBuffers;
		if(buffers.length < Math.floor(minBuffers*lowLimit)){
			for(var i=0+buffers.length; i < sz; i++){
				generateOneBuffer(null);
			}
		}
	}

	fillBuffers();

	function generateOneBuffer(b){
		if(!b){
			b = PSKBuffer.alloc(0);
		}
		const sz = buffersSize - b.length;
		/*crypto.randomBytes(sz, function (err, res) {
			buffers.push(Buffer.concat([res, b]));
			notifyObserver();
		});*/
		buffers.push(PSKBuffer.concat([ crypto.randomBytes(sz), b ]));
		notifyObserver();
	}

	function extractN(n){
		var sz = Math.floor(n / buffersSize);
		var ret = [];

		for(var i=0; i<sz; i++){
			ret.push(buffers.pop());
			setTimeout(generateOneBuffer, 1);
		}



		var remainder = n % buffersSize;
		if(remainder > 0){
			var front = buffers.pop();
			ret.push(front.slice(0,remainder));
			//generateOneBuffer(front.slice(remainder));
			setTimeout(function(){
				generateOneBuffer(front.slice(remainder));
			},1);
		}

		//setTimeout(fillBuffers, 1);

		return Buffer.concat(ret);
	}

	var fillInProgress = false;

	this.generateUid = function(n){
		var totalSize = buffers.length * buffersSize;
		if(n <= totalSize){
			return extractN(n);
		} else {
			if(!fillInProgress){
				fillInProgress = true;
				setTimeout(function(){
					fillBuffers(Math.floor(minBuffers*2.5));
					fillInProgress = false;
				}, 1);
			}
			return crypto.randomBytes(n);
		}
	};

	var observer;
	this.registerObserver = function(obs){
		if(observer){
			console.error(new Error("One observer allowed!"));
		}else{
			if(typeof obs == "function"){
				observer = obs;
				//notifyObserver();
			}
		}
	};

	function notifyObserver(){
		if(observer){
			var valueToReport = buffers.length*buffersSize;
			setTimeout(function(){
				observer(null, {"size": valueToReport});
			}, 10);
		}
	}
}

module.exports.createUidGenerator = function (minBuffers, bufferSize) {
	return new UidGenerator(minBuffers, bufferSize);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/lib/uidGenerator.js","/modules/swarmutils/lib")

},{"./Queue":"/opt/privatesky/modules/swarmutils/lib/Queue.js","buffer":"buffer","crypto":false,"timers":"timers"}],"/opt/privatesky/node_modules/browserify-zlib/lib/binding.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
'use strict';
/* eslint camelcase: "off" */

var assert = require('assert');

var Zstream = require('pako/lib/zlib/zstream');
var zlib_deflate = require('pako/lib/zlib/deflate.js');
var zlib_inflate = require('pako/lib/zlib/inflate.js');
var constants = require('pako/lib/zlib/constants');

for (var key in constants) {
  exports[key] = constants[key];
}

// zlib modes
exports.NONE = 0;
exports.DEFLATE = 1;
exports.INFLATE = 2;
exports.GZIP = 3;
exports.GUNZIP = 4;
exports.DEFLATERAW = 5;
exports.INFLATERAW = 6;
exports.UNZIP = 7;

var GZIP_HEADER_ID1 = 0x1f;
var GZIP_HEADER_ID2 = 0x8b;

/**
 * Emulate Node's zlib C++ layer for use by the JS layer in index.js
 */
function Zlib(mode) {
  if (typeof mode !== 'number' || mode < exports.DEFLATE || mode > exports.UNZIP) {
    throw new TypeError('Bad argument');
  }

  this.dictionary = null;
  this.err = 0;
  this.flush = 0;
  this.init_done = false;
  this.level = 0;
  this.memLevel = 0;
  this.mode = mode;
  this.strategy = 0;
  this.windowBits = 0;
  this.write_in_progress = false;
  this.pending_close = false;
  this.gzip_id_bytes_read = 0;
}

Zlib.prototype.close = function () {
  if (this.write_in_progress) {
    this.pending_close = true;
    return;
  }

  this.pending_close = false;

  assert(this.init_done, 'close before init');
  assert(this.mode <= exports.UNZIP);

  if (this.mode === exports.DEFLATE || this.mode === exports.GZIP || this.mode === exports.DEFLATERAW) {
    zlib_deflate.deflateEnd(this.strm);
  } else if (this.mode === exports.INFLATE || this.mode === exports.GUNZIP || this.mode === exports.INFLATERAW || this.mode === exports.UNZIP) {
    zlib_inflate.inflateEnd(this.strm);
  }

  this.mode = exports.NONE;

  this.dictionary = null;
};

Zlib.prototype.write = function (flush, input, in_off, in_len, out, out_off, out_len) {
  return this._write(true, flush, input, in_off, in_len, out, out_off, out_len);
};

Zlib.prototype.writeSync = function (flush, input, in_off, in_len, out, out_off, out_len) {
  return this._write(false, flush, input, in_off, in_len, out, out_off, out_len);
};

Zlib.prototype._write = function (async, flush, input, in_off, in_len, out, out_off, out_len) {
  assert.equal(arguments.length, 8);

  assert(this.init_done, 'write before init');
  assert(this.mode !== exports.NONE, 'already finalized');
  assert.equal(false, this.write_in_progress, 'write already in progress');
  assert.equal(false, this.pending_close, 'close is pending');

  this.write_in_progress = true;

  assert.equal(false, flush === undefined, 'must provide flush value');

  this.write_in_progress = true;

  if (flush !== exports.Z_NO_FLUSH && flush !== exports.Z_PARTIAL_FLUSH && flush !== exports.Z_SYNC_FLUSH && flush !== exports.Z_FULL_FLUSH && flush !== exports.Z_FINISH && flush !== exports.Z_BLOCK) {
    throw new Error('Invalid flush value');
  }

  if (input == null) {
    input = Buffer.alloc(0);
    in_len = 0;
    in_off = 0;
  }

  this.strm.avail_in = in_len;
  this.strm.input = input;
  this.strm.next_in = in_off;
  this.strm.avail_out = out_len;
  this.strm.output = out;
  this.strm.next_out = out_off;
  this.flush = flush;

  if (!async) {
    // sync version
    this._process();

    if (this._checkError()) {
      return this._afterSync();
    }
    return;
  }

  // async version
  var self = this;
  process.nextTick(function () {
    self._process();
    self._after();
  });

  return this;
};

Zlib.prototype._afterSync = function () {
  var avail_out = this.strm.avail_out;
  var avail_in = this.strm.avail_in;

  this.write_in_progress = false;

  return [avail_in, avail_out];
};

Zlib.prototype._process = function () {
  var next_expected_header_byte = null;

  // If the avail_out is left at 0, then it means that it ran out
  // of room.  If there was avail_out left over, then it means
  // that all of the input was consumed.
  switch (this.mode) {
    case exports.DEFLATE:
    case exports.GZIP:
    case exports.DEFLATERAW:
      this.err = zlib_deflate.deflate(this.strm, this.flush);
      break;
    case exports.UNZIP:
      if (this.strm.avail_in > 0) {
        next_expected_header_byte = this.strm.next_in;
      }

      switch (this.gzip_id_bytes_read) {
        case 0:
          if (next_expected_header_byte === null) {
            break;
          }

          if (this.strm.input[next_expected_header_byte] === GZIP_HEADER_ID1) {
            this.gzip_id_bytes_read = 1;
            next_expected_header_byte++;

            if (this.strm.avail_in === 1) {
              // The only available byte was already read.
              break;
            }
          } else {
            this.mode = exports.INFLATE;
            break;
          }

        // fallthrough
        case 1:
          if (next_expected_header_byte === null) {
            break;
          }

          if (this.strm.input[next_expected_header_byte] === GZIP_HEADER_ID2) {
            this.gzip_id_bytes_read = 2;
            this.mode = exports.GUNZIP;
          } else {
            // There is no actual difference between INFLATE and INFLATERAW
            // (after initialization).
            this.mode = exports.INFLATE;
          }

          break;
        default:
          throw new Error('invalid number of gzip magic number bytes read');
      }

    // fallthrough
    case exports.INFLATE:
    case exports.GUNZIP:
    case exports.INFLATERAW:
      this.err = zlib_inflate.inflate(this.strm, this.flush

      // If data was encoded with dictionary
      );if (this.err === exports.Z_NEED_DICT && this.dictionary) {
        // Load it
        this.err = zlib_inflate.inflateSetDictionary(this.strm, this.dictionary);
        if (this.err === exports.Z_OK) {
          // And try to decode again
          this.err = zlib_inflate.inflate(this.strm, this.flush);
        } else if (this.err === exports.Z_DATA_ERROR) {
          // Both inflateSetDictionary() and inflate() return Z_DATA_ERROR.
          // Make it possible for After() to tell a bad dictionary from bad
          // input.
          this.err = exports.Z_NEED_DICT;
        }
      }
      while (this.strm.avail_in > 0 && this.mode === exports.GUNZIP && this.err === exports.Z_STREAM_END && this.strm.next_in[0] !== 0x00) {
        // Bytes remain in input buffer. Perhaps this is another compressed
        // member in the same archive, or just trailing garbage.
        // Trailing zero bytes are okay, though, since they are frequently
        // used for padding.

        this.reset();
        this.err = zlib_inflate.inflate(this.strm, this.flush);
      }
      break;
    default:
      throw new Error('Unknown mode ' + this.mode);
  }
};

Zlib.prototype._checkError = function () {
  // Acceptable error states depend on the type of zlib stream.
  switch (this.err) {
    case exports.Z_OK:
    case exports.Z_BUF_ERROR:
      if (this.strm.avail_out !== 0 && this.flush === exports.Z_FINISH) {
        this._error('unexpected end of file');
        return false;
      }
      break;
    case exports.Z_STREAM_END:
      // normal statuses, not fatal
      break;
    case exports.Z_NEED_DICT:
      if (this.dictionary == null) {
        this._error('Missing dictionary');
      } else {
        this._error('Bad dictionary');
      }
      return false;
    default:
      // something else.
      this._error('Zlib error');
      return false;
  }

  return true;
};

Zlib.prototype._after = function () {
  if (!this._checkError()) {
    return;
  }

  var avail_out = this.strm.avail_out;
  var avail_in = this.strm.avail_in;

  this.write_in_progress = false;

  // call the write() cb
  this.callback(avail_in, avail_out);

  if (this.pending_close) {
    this.close();
  }
};

Zlib.prototype._error = function (message) {
  if (this.strm.msg) {
    message = this.strm.msg;
  }
  this.onerror(message, this.err

  // no hope of rescue.
  );this.write_in_progress = false;
  if (this.pending_close) {
    this.close();
  }
};

Zlib.prototype.init = function (windowBits, level, memLevel, strategy, dictionary) {
  assert(arguments.length === 4 || arguments.length === 5, 'init(windowBits, level, memLevel, strategy, [dictionary])');

  assert(windowBits >= 8 && windowBits <= 15, 'invalid windowBits');
  assert(level >= -1 && level <= 9, 'invalid compression level');

  assert(memLevel >= 1 && memLevel <= 9, 'invalid memlevel');

  assert(strategy === exports.Z_FILTERED || strategy === exports.Z_HUFFMAN_ONLY || strategy === exports.Z_RLE || strategy === exports.Z_FIXED || strategy === exports.Z_DEFAULT_STRATEGY, 'invalid strategy');

  this._init(level, windowBits, memLevel, strategy, dictionary);
  this._setDictionary();
};

Zlib.prototype.params = function () {
  throw new Error('deflateParams Not supported');
};

Zlib.prototype.reset = function () {
  this._reset();
  this._setDictionary();
};

Zlib.prototype._init = function (level, windowBits, memLevel, strategy, dictionary) {
  this.level = level;
  this.windowBits = windowBits;
  this.memLevel = memLevel;
  this.strategy = strategy;

  this.flush = exports.Z_NO_FLUSH;

  this.err = exports.Z_OK;

  if (this.mode === exports.GZIP || this.mode === exports.GUNZIP) {
    this.windowBits += 16;
  }

  if (this.mode === exports.UNZIP) {
    this.windowBits += 32;
  }

  if (this.mode === exports.DEFLATERAW || this.mode === exports.INFLATERAW) {
    this.windowBits = -1 * this.windowBits;
  }

  this.strm = new Zstream();

  switch (this.mode) {
    case exports.DEFLATE:
    case exports.GZIP:
    case exports.DEFLATERAW:
      this.err = zlib_deflate.deflateInit2(this.strm, this.level, exports.Z_DEFLATED, this.windowBits, this.memLevel, this.strategy);
      break;
    case exports.INFLATE:
    case exports.GUNZIP:
    case exports.INFLATERAW:
    case exports.UNZIP:
      this.err = zlib_inflate.inflateInit2(this.strm, this.windowBits);
      break;
    default:
      throw new Error('Unknown mode ' + this.mode);
  }

  if (this.err !== exports.Z_OK) {
    this._error('Init error');
  }

  this.dictionary = dictionary;

  this.write_in_progress = false;
  this.init_done = true;
};

Zlib.prototype._setDictionary = function () {
  if (this.dictionary == null) {
    return;
  }

  this.err = exports.Z_OK;

  switch (this.mode) {
    case exports.DEFLATE:
    case exports.DEFLATERAW:
      this.err = zlib_deflate.deflateSetDictionary(this.strm, this.dictionary);
      break;
    default:
      break;
  }

  if (this.err !== exports.Z_OK) {
    this._error('Failed to set dictionary');
  }
};

Zlib.prototype._reset = function () {
  this.err = exports.Z_OK;

  switch (this.mode) {
    case exports.DEFLATE:
    case exports.DEFLATERAW:
    case exports.GZIP:
      this.err = zlib_deflate.deflateReset(this.strm);
      break;
    case exports.INFLATE:
    case exports.INFLATERAW:
    case exports.GUNZIP:
      this.err = zlib_inflate.inflateReset(this.strm);
      break;
    default:
      break;
  }

  if (this.err !== exports.Z_OK) {
    this._error('Failed to reset stream');
  }
};

exports.Zlib = Zlib;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/browserify-zlib/lib/binding.js","/node_modules/browserify-zlib/lib")

},{"assert":"assert","buffer":"buffer","pako/lib/zlib/constants":false,"pako/lib/zlib/deflate.js":false,"pako/lib/zlib/inflate.js":false,"pako/lib/zlib/zstream":false,"timers":"timers"}],"/opt/privatesky/node_modules/querystring-es3/decode.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/querystring-es3/decode.js","/node_modules/querystring-es3")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/node_modules/querystring-es3/encode.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/querystring-es3/encode.js","/node_modules/querystring-es3")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/node_modules/url/util.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/url/util.js","/node_modules/url")

},{"buffer":"buffer","timers":"timers"}],"/opt/privatesky/node_modules/util/support/isBufferBrowser.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/util/support/isBufferBrowser.js","/node_modules/util/support")

},{"buffer":"buffer","timers":"timers"}],"assert":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/assert/assert.js","/node_modules/assert")

},{"buffer":"buffer","object-assign":false,"timers":"timers","util/":false}],"base64-js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/base64-js/index.js","/node_modules/base64-js")

},{"buffer":"buffer","timers":"timers"}],"buffer":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/buffer/index.js","/node_modules/buffer")

},{"base64-js":"base64-js","buffer":"buffer","ieee754":"ieee754","timers":"timers"}],"callflow":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){

//var path = require("path");
function defaultErrorHandlingImplementation(err, res){
	//console.log(err.stack);
	if(err) throw err;
	return res;
}

require("./lib/overwriteRequire");
/*
const PSKBuffer = require('pskbuffer');
$$.PSKBuffer = PSKBuffer; */


$$.obsolete("Please remove $$.errorHandler  asap");
$$.errorHandler = {
        error:function(err, args, msg){
            console.log(err, "Unknown error from function call with arguments:", args, "Message:", msg);
        },
        throwError:function(err, args, msg){
            console.log(err, "Unknown error from function call with arguments:", args, "Message:", msg);
            throw err;
        },
        ignorePossibleError: function(name){
            console.log(name);
        },
        syntaxError:function(property, swarm, text){
            //throw new Error("Misspelled member name or other internal error!");
            var swarmName;
            try{
                if(typeof swarm == "string"){
                    swarmName = swarm;
                } else
                if(swarm && swarm.meta){
                    swarmName  = swarm.meta.swarmTypeName;
                } else {
                    swarmName = swarm.getInnerValue().meta.swarmTypeName;
                }
            } catch(err){
                swarmName = err.toString();
            }
            if(property){
                console.log("Wrong member name ", property,  " in swarm ", swarmName);
                if(text) {
                    console.log(text);
                }
            } else {
                console.log("Unknown swarm", swarmName);
            }

        },
        warning:function(msg){
            console.log(msg);
        }
    };


$$.obsolete("Please remove $$.safeErrorHandling asap");
$$.safeErrorHandling = function(callback){
        if(callback){
            return callback;
        } else{
            return defaultErrorHandlingImplementation;
        }
    };



$$.obsolete("Please remove $$.__intern asap");
$$.__intern = {
        mkArgs:function(args,pos){
            var argsArray = [];
            for(var i = pos; i < args.length; i++){
                argsArray.push(args[i]);
            }
            return argsArray;
        }
    };



var swarmUtils = require("./lib/choreographies/swarm");
var assetUtils = require("./lib/utilityFunctions/asset");

var transactionUtils = require("./lib/utilityFunctions/transaction");
$$.defaultErrorHandlingImplementation = defaultErrorHandlingImplementation;

var callflowModule = require("./lib/swarmDescription");
$$.callflows        = callflowModule.createSwarmEngine("callflow");
$$.callflow         = $$.callflows;
$$.flow             = $$.callflows;
$$.flows            = $$.callflows;

$$.swarms           = callflowModule.createSwarmEngine("swarm", swarmUtils);
$$.swarm            = $$.swarms;
$$.contracts        = callflowModule.createSwarmEngine("contract", swarmUtils);
$$.contract         = $$.contracts;
$$.assets           = callflowModule.createSwarmEngine("asset", assetUtils);
$$.asset            = $$.assets;
$$.transactions     = callflowModule.createSwarmEngine("transaction", transactionUtils);
$$.transaction      = $$.transactions;


$$.PSK_PubSub = require("soundpubsub").soundPubSub;

$$.securityContext = "system";
$$.libraryPrefix = "global";
$$.libraries = {
    global:{

    }
};

$$.interceptor = require("./lib/InterceptorRegistry").createInterceptorRegistry();

$$.loadLibrary = require("./lib/loadLibrary").loadLibrary;

requireLibrary = function(name){
    //var absolutePath = path.resolve(  $$.__global.__loadLibraryRoot + name);
    return $$.loadLibrary(name,name);
};

require("./constants");

/*//TODO: SHOULD be moved in $$.__globals
$$.ensureFolderExists = function (folder, callback) {
    const flow = $$.flow.start("utils.mkDirRec");
    flow.make(folder, callback);
};

$$.ensureLinkExists = function (existingPath, newPath, callback) {
    const flow = $$.flow.start("utils.mkDirRec");
    flow.makeLink(existingPath, newPath, callback);
};*/

$$.pathNormalize = function (pathToNormalize) {
    const path = require("path");
    pathToNormalize = path.normalize(pathToNormalize);

    return pathToNormalize.replace(/[\/\\]/g, path.sep);
};

// add interceptors

const crypto = require('crypto');

$$.interceptor.register('*', '*', 'before', function () {
    const swarmTypeName = this.getMetadata('swarmTypeName');
    const phaseName = this.getMetadata('phaseName');
    const swarmId = this.getMetadata('swarmId');
    const executionId = crypto.randomBytes(16).toString('hex');

    this.setMetadata('executionId', executionId);

    $$.event('swarm.call.before', {swarmTypeName, phaseName, executionId});
});

$$.interceptor.register('*', '*', 'after', function () {
    const swarmTypeName = this.getMetadata('swarmTypeName');
    const phaseName = this.getMetadata('phaseName');
    const executionId = this.getMetadata('executionId');

    this.setMetadata('executionId', undefined);

    $$.event('swarm.call.time', {swarmTypeName, phaseName, executionId});
});

module.exports = {
    				createSwarmEngine: require("./lib/swarmDescription").createSwarmEngine,
                    createJoinPoint: require("./lib/parallelJoinPoint").createJoinPoint,
                    createSerialJoinPoint: require("./lib/serialJoinPoint").createSerialJoinPoint,
                    swarmInstanceManager: require("./lib/choreographies/swarmInstancesManager"),
                    enableInternalSwarmRouting: function(){
                        function dummyVM(name){
                            function solveSwarm(swarm){
                                $$.swarmsInstancesManager.revive_swarm(swarm);
                            }

                            $$.PSK_PubSub.subscribe(name, solveSwarm);
                            console.log("Creating a fake execution context...");
                        }
                        dummyVM($$.CONSTANTS.SWARM_FOR_EXECUTION);
                    }
				};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/callflow/index.js","/modules/callflow")

},{"./constants":"/opt/privatesky/modules/callflow/constants.js","./lib/InterceptorRegistry":"/opt/privatesky/modules/callflow/lib/InterceptorRegistry.js","./lib/choreographies/swarm":"/opt/privatesky/modules/callflow/lib/choreographies/swarm.js","./lib/choreographies/swarmInstancesManager":"/opt/privatesky/modules/callflow/lib/choreographies/swarmInstancesManager.js","./lib/loadLibrary":"/opt/privatesky/modules/callflow/lib/loadLibrary.js","./lib/overwriteRequire":"/opt/privatesky/modules/callflow/lib/overwriteRequire.js","./lib/parallelJoinPoint":"/opt/privatesky/modules/callflow/lib/parallelJoinPoint.js","./lib/serialJoinPoint":"/opt/privatesky/modules/callflow/lib/serialJoinPoint.js","./lib/swarmDescription":"/opt/privatesky/modules/callflow/lib/swarmDescription.js","./lib/utilityFunctions/asset":"/opt/privatesky/modules/callflow/lib/utilityFunctions/asset.js","./lib/utilityFunctions/transaction":"/opt/privatesky/modules/callflow/lib/utilityFunctions/transaction.js","buffer":"buffer","crypto":false,"path":"path","soundpubsub":"soundpubsub","timers":"timers"}],"events":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/events/events.js","/node_modules/events")

},{"buffer":"buffer","timers":"timers"}],"ieee754":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/ieee754/index.js","/node_modules/ieee754")

},{"buffer":"buffer","timers":"timers"}],"inherits":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/inherits/inherits_browser.js","/node_modules/inherits")

},{"buffer":"buffer","timers":"timers"}],"path":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/path-browserify/index.js","/node_modules/path-browserify")

},{"buffer":"buffer","timers":"timers"}],"process/browser.js":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/process/browser.js","/node_modules/process")

},{"buffer":"buffer","timers":"timers"}],"pskbuffer":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const PSKBuffer = require('./lib/PSKBuffer');

module.exports = PSKBuffer;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/pskbuffer/index.js","/modules/pskbuffer")

},{"./lib/PSKBuffer":"/opt/privatesky/modules/pskbuffer/lib/PSKBuffer.js","buffer":"buffer","timers":"timers"}],"psklogger":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
const PSKLogger = require('./src/PSKLoggerClient/index');
const EnvironmentDataProvider = require('./src/utils').EnvironmentDataProvider;


if(!global.hasOwnProperty('$$')) {
    global.$$ = {};
}


/**
 * @deprecated
 * PSKLogger should be used as is without overwriting console.
 * The functionality should be added to PSKLogger to log to console the message and useful metadata
 */
function overwriteConsole() {
    if(process.env.context === 'sandbox') {
        console.log("Execution detected in sandbox, console won't be overwritten");
        return;
    }

    const logger = PSKLogger.getLogger();

    const originalConsole = {};
    Object.keys(console).forEach(key => originalConsole[key] = console[key]);

    Object.keys(logger).forEach(key => {
       console[key] = function() {
           const log = logger[key].apply(logger, arguments);

           const context = getContextForMeta(log.meta);

           if(originalConsole.hasOwnProperty(key)) {
               originalConsole[key].apply(originalConsole, [`[${context}]`, ...log.messages]);
           }
       }
    });


    /**
     * @return {string|*}
     */
    function getContextForMeta(meta) {
        const contexts = {
            node: (meta) => `node:${meta.context}`,
            domain: (meta) =>`domain:${meta.domain}`,
            agent: (meta) => `domain:${meta.domain}:agent:${meta.agent}`,
            sandbox: () => `sandbox`
        };

        if (contexts.hasOwnProperty(meta.origin)) {
            return contexts[meta.origin](meta);
        } else {
            return '';
        }
    }
}

if (process.env.context !== 'sandbox') {

    const MessagePublisher = require('./src/MessagePublisher');
    const MessageSubscriber = require('./src/MessageSubscriber');
    const PubSubProxy = require('./src/PubSubProxy');

    function enableEnvironmentDataDefault() {
        global.$$.getEnvironmentData = EnvironmentDataProvider.getEnvironmentData;
    }

    function enableEnvironmentDataForAgent() {
        global.$$.getEnvironmentData = EnvironmentDataProvider.getEnvironmentDataForAgent;
    }

    function enableEnvironmentDataForDomain() {
        global.$$.getEnvironmentData = EnvironmentDataProvider.getEnvironmentDataForDomain;
    }


    /**
     * Overwrite this to provide relevant information for other environments (ex: for domains, browser etc.)
     */
    if(process.env.hasOwnProperty('PRIVATESKY_AGENT_NAME')) {
        enableEnvironmentDataForAgent();
    } else if(process.env.hasOwnProperty('PRIVATESKY_DOMAIN_NAME')) {
        enableEnvironmentDataForDomain()
    } else if(!global.$$.hasOwnProperty('getEnvironmentData')) {
        enableEnvironmentDataDefault();
    }

    module.exports.MessagePublisherModule  = MessagePublisher;
    module.exports.MessageSubscriberModule = MessageSubscriber;
    module.exports.PubSubProxyModule       = PubSubProxy;
} else {
    global.$$.getEnvironmentData = EnvironmentDataProvider.getEnvironmentDataForSandbox;
}


module.exports.overwriteConsole = overwriteConsole;
module.exports.PSKLogger = PSKLogger;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/psklogger/index.js","/modules/psklogger")

},{"./src/MessagePublisher":"/opt/privatesky/modules/psklogger/src/MessagePublisher/index.js","./src/MessageSubscriber":"/opt/privatesky/modules/psklogger/src/MessageSubscriber/index.js","./src/PSKLoggerClient/index":"/opt/privatesky/modules/psklogger/src/PSKLoggerClient/index.js","./src/PubSubProxy":"/opt/privatesky/modules/psklogger/src/PubSubProxy/index.js","./src/utils":"/opt/privatesky/modules/psklogger/src/utils/index.js","buffer":"buffer","timers":"timers"}],"querystring":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/querystring-es3/index.js","/node_modules/querystring-es3")

},{"./decode":"/opt/privatesky/node_modules/querystring-es3/decode.js","./encode":"/opt/privatesky/node_modules/querystring-es3/encode.js","buffer":"buffer","timers":"timers"}],"soundpubsub":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
module.exports = {
					soundPubSub: require("./lib/soundPubSub").soundPubSub
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/soundpubsub/index.js","/modules/soundpubsub")

},{"./lib/soundPubSub":"/opt/privatesky/modules/soundpubsub/lib/soundPubSub.js","buffer":"buffer","timers":"timers"}],"stream":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/stream-browserify/index.js","/node_modules/stream-browserify")

},{"buffer":"buffer","events":"events","inherits":"inherits","readable-stream/duplex.js":false,"readable-stream/passthrough.js":false,"readable-stream/readable.js":false,"readable-stream/transform.js":false,"readable-stream/writable.js":false,"timers":"timers"}],"string_decoder":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/string_decoder/lib/string_decoder.js","/node_modules/string_decoder/lib")

},{"buffer":"buffer","safe-buffer":false,"timers":"timers"}],"swarmutils":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
module.exports.OwM = require("./lib/OwM");
module.exports.beesHealer = require("./lib/beesHealer");

const uidGenerator = require("./lib/uidGenerator").createUidGenerator(200, 32);

module.exports.safe_uuid = require("./lib/safe-uuid").init(uidGenerator);

module.exports.Queue = require("./lib/Queue");
module.exports.combos = require("./lib/Combos");

module.exports.uidGenerator = uidGenerator;
module.exports.generateUid = uidGenerator.generateUid;

module.exports.createPskConsole = function () {
  return require('./lib/pskconsole');
};


if(typeof global.$$ == "undefined"){
  global.$$ = {};
}

if(typeof global.$$.uidGenerator == "undefined"){
    $$.uidGenerator = module.exports.safe_uuid;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/modules/swarmutils/index.js","/modules/swarmutils")

},{"./lib/Combos":"/opt/privatesky/modules/swarmutils/lib/Combos.js","./lib/OwM":"/opt/privatesky/modules/swarmutils/lib/OwM.js","./lib/Queue":"/opt/privatesky/modules/swarmutils/lib/Queue.js","./lib/beesHealer":"/opt/privatesky/modules/swarmutils/lib/beesHealer.js","./lib/pskconsole":"/opt/privatesky/modules/swarmutils/lib/pskconsole.js","./lib/safe-uuid":"/opt/privatesky/modules/swarmutils/lib/safe-uuid.js","./lib/uidGenerator":"/opt/privatesky/modules/swarmutils/lib/uidGenerator.js","buffer":"buffer","timers":"timers"}],"timers":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/timers-browserify/main.js","/node_modules/timers-browserify")

},{"buffer":"buffer","process/browser.js":"process/browser.js","timers":"timers"}],"url":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/url/url.js","/node_modules/url")

},{"./util":"/opt/privatesky/node_modules/url/util.js","buffer":"buffer","punycode":false,"querystring":"querystring","timers":"timers"}],"util":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/util/util.js","/node_modules/util")

},{"./support/isBuffer":"/opt/privatesky/node_modules/util/support/isBufferBrowser.js","buffer":"buffer","inherits":"inherits","timers":"timers"}],"zlib":[function(require,module,exports){
(function (global,Buffer,setImmediate,__argument0,__argument1,__argument2,__argument3,clearImmediate,__filename,__dirname){
'use strict';

var Buffer = require('buffer').Buffer;
var Transform = require('stream').Transform;
var binding = require('./binding');
var util = require('util');
var assert = require('assert').ok;
var kMaxLength = require('buffer').kMaxLength;
var kRangeErrorMessage = 'Cannot create final Buffer. It would be larger ' + 'than 0x' + kMaxLength.toString(16) + ' bytes';

// zlib doesn't provide these, so kludge them in following the same
// const naming scheme zlib uses.
binding.Z_MIN_WINDOWBITS = 8;
binding.Z_MAX_WINDOWBITS = 15;
binding.Z_DEFAULT_WINDOWBITS = 15;

// fewer than 64 bytes per chunk is stupid.
// technically it could work with as few as 8, but even 64 bytes
// is absurdly low.  Usually a MB or more is best.
binding.Z_MIN_CHUNK = 64;
binding.Z_MAX_CHUNK = Infinity;
binding.Z_DEFAULT_CHUNK = 16 * 1024;

binding.Z_MIN_MEMLEVEL = 1;
binding.Z_MAX_MEMLEVEL = 9;
binding.Z_DEFAULT_MEMLEVEL = 8;

binding.Z_MIN_LEVEL = -1;
binding.Z_MAX_LEVEL = 9;
binding.Z_DEFAULT_LEVEL = binding.Z_DEFAULT_COMPRESSION;

// expose all the zlib constants
var bkeys = Object.keys(binding);
for (var bk = 0; bk < bkeys.length; bk++) {
  var bkey = bkeys[bk];
  if (bkey.match(/^Z/)) {
    Object.defineProperty(exports, bkey, {
      enumerable: true, value: binding[bkey], writable: false
    });
  }
}

// translation table for return codes.
var codes = {
  Z_OK: binding.Z_OK,
  Z_STREAM_END: binding.Z_STREAM_END,
  Z_NEED_DICT: binding.Z_NEED_DICT,
  Z_ERRNO: binding.Z_ERRNO,
  Z_STREAM_ERROR: binding.Z_STREAM_ERROR,
  Z_DATA_ERROR: binding.Z_DATA_ERROR,
  Z_MEM_ERROR: binding.Z_MEM_ERROR,
  Z_BUF_ERROR: binding.Z_BUF_ERROR,
  Z_VERSION_ERROR: binding.Z_VERSION_ERROR
};

var ckeys = Object.keys(codes);
for (var ck = 0; ck < ckeys.length; ck++) {
  var ckey = ckeys[ck];
  codes[codes[ckey]] = ckey;
}

Object.defineProperty(exports, 'codes', {
  enumerable: true, value: Object.freeze(codes), writable: false
});

exports.Deflate = Deflate;
exports.Inflate = Inflate;
exports.Gzip = Gzip;
exports.Gunzip = Gunzip;
exports.DeflateRaw = DeflateRaw;
exports.InflateRaw = InflateRaw;
exports.Unzip = Unzip;

exports.createDeflate = function (o) {
  return new Deflate(o);
};

exports.createInflate = function (o) {
  return new Inflate(o);
};

exports.createDeflateRaw = function (o) {
  return new DeflateRaw(o);
};

exports.createInflateRaw = function (o) {
  return new InflateRaw(o);
};

exports.createGzip = function (o) {
  return new Gzip(o);
};

exports.createGunzip = function (o) {
  return new Gunzip(o);
};

exports.createUnzip = function (o) {
  return new Unzip(o);
};

// Convenience methods.
// compress/decompress a string or buffer in one step.
exports.deflate = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Deflate(opts), buffer, callback);
};

exports.deflateSync = function (buffer, opts) {
  return zlibBufferSync(new Deflate(opts), buffer);
};

exports.gzip = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gzip(opts), buffer, callback);
};

exports.gzipSync = function (buffer, opts) {
  return zlibBufferSync(new Gzip(opts), buffer);
};

exports.deflateRaw = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new DeflateRaw(opts), buffer, callback);
};

exports.deflateRawSync = function (buffer, opts) {
  return zlibBufferSync(new DeflateRaw(opts), buffer);
};

exports.unzip = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Unzip(opts), buffer, callback);
};

exports.unzipSync = function (buffer, opts) {
  return zlibBufferSync(new Unzip(opts), buffer);
};

exports.inflate = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Inflate(opts), buffer, callback);
};

exports.inflateSync = function (buffer, opts) {
  return zlibBufferSync(new Inflate(opts), buffer);
};

exports.gunzip = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new Gunzip(opts), buffer, callback);
};

exports.gunzipSync = function (buffer, opts) {
  return zlibBufferSync(new Gunzip(opts), buffer);
};

exports.inflateRaw = function (buffer, opts, callback) {
  if (typeof opts === 'function') {
    callback = opts;
    opts = {};
  }
  return zlibBuffer(new InflateRaw(opts), buffer, callback);
};

exports.inflateRawSync = function (buffer, opts) {
  return zlibBufferSync(new InflateRaw(opts), buffer);
};

function zlibBuffer(engine, buffer, callback) {
  var buffers = [];
  var nread = 0;

  engine.on('error', onError);
  engine.on('end', onEnd);

  engine.end(buffer);
  flow();

  function flow() {
    var chunk;
    while (null !== (chunk = engine.read())) {
      buffers.push(chunk);
      nread += chunk.length;
    }
    engine.once('readable', flow);
  }

  function onError(err) {
    engine.removeListener('end', onEnd);
    engine.removeListener('readable', flow);
    callback(err);
  }

  function onEnd() {
    var buf;
    var err = null;

    if (nread >= kMaxLength) {
      err = new RangeError(kRangeErrorMessage);
    } else {
      buf = Buffer.concat(buffers, nread);
    }

    buffers = [];
    engine.close();
    callback(err, buf);
  }
}

function zlibBufferSync(engine, buffer) {
  if (typeof buffer === 'string') buffer = Buffer.from(buffer);

  if (!Buffer.isBuffer(buffer)) throw new TypeError('Not a string or buffer');

  var flushFlag = engine._finishFlushFlag;

  return engine._processChunk(buffer, flushFlag);
}

// generic zlib
// minimal 2-byte header
function Deflate(opts) {
  if (!(this instanceof Deflate)) return new Deflate(opts);
  Zlib.call(this, opts, binding.DEFLATE);
}

function Inflate(opts) {
  if (!(this instanceof Inflate)) return new Inflate(opts);
  Zlib.call(this, opts, binding.INFLATE);
}

// gzip - bigger header, same deflate compression
function Gzip(opts) {
  if (!(this instanceof Gzip)) return new Gzip(opts);
  Zlib.call(this, opts, binding.GZIP);
}

function Gunzip(opts) {
  if (!(this instanceof Gunzip)) return new Gunzip(opts);
  Zlib.call(this, opts, binding.GUNZIP);
}

// raw - no header
function DeflateRaw(opts) {
  if (!(this instanceof DeflateRaw)) return new DeflateRaw(opts);
  Zlib.call(this, opts, binding.DEFLATERAW);
}

function InflateRaw(opts) {
  if (!(this instanceof InflateRaw)) return new InflateRaw(opts);
  Zlib.call(this, opts, binding.INFLATERAW);
}

// auto-detect header.
function Unzip(opts) {
  if (!(this instanceof Unzip)) return new Unzip(opts);
  Zlib.call(this, opts, binding.UNZIP);
}

function isValidFlushFlag(flag) {
  return flag === binding.Z_NO_FLUSH || flag === binding.Z_PARTIAL_FLUSH || flag === binding.Z_SYNC_FLUSH || flag === binding.Z_FULL_FLUSH || flag === binding.Z_FINISH || flag === binding.Z_BLOCK;
}

// the Zlib class they all inherit from
// This thing manages the queue of requests, and returns
// true or false if there is anything in the queue when
// you call the .write() method.

function Zlib(opts, mode) {
  var _this = this;

  this._opts = opts = opts || {};
  this._chunkSize = opts.chunkSize || exports.Z_DEFAULT_CHUNK;

  Transform.call(this, opts);

  if (opts.flush && !isValidFlushFlag(opts.flush)) {
    throw new Error('Invalid flush flag: ' + opts.flush);
  }
  if (opts.finishFlush && !isValidFlushFlag(opts.finishFlush)) {
    throw new Error('Invalid flush flag: ' + opts.finishFlush);
  }

  this._flushFlag = opts.flush || binding.Z_NO_FLUSH;
  this._finishFlushFlag = typeof opts.finishFlush !== 'undefined' ? opts.finishFlush : binding.Z_FINISH;

  if (opts.chunkSize) {
    if (opts.chunkSize < exports.Z_MIN_CHUNK || opts.chunkSize > exports.Z_MAX_CHUNK) {
      throw new Error('Invalid chunk size: ' + opts.chunkSize);
    }
  }

  if (opts.windowBits) {
    if (opts.windowBits < exports.Z_MIN_WINDOWBITS || opts.windowBits > exports.Z_MAX_WINDOWBITS) {
      throw new Error('Invalid windowBits: ' + opts.windowBits);
    }
  }

  if (opts.level) {
    if (opts.level < exports.Z_MIN_LEVEL || opts.level > exports.Z_MAX_LEVEL) {
      throw new Error('Invalid compression level: ' + opts.level);
    }
  }

  if (opts.memLevel) {
    if (opts.memLevel < exports.Z_MIN_MEMLEVEL || opts.memLevel > exports.Z_MAX_MEMLEVEL) {
      throw new Error('Invalid memLevel: ' + opts.memLevel);
    }
  }

  if (opts.strategy) {
    if (opts.strategy != exports.Z_FILTERED && opts.strategy != exports.Z_HUFFMAN_ONLY && opts.strategy != exports.Z_RLE && opts.strategy != exports.Z_FIXED && opts.strategy != exports.Z_DEFAULT_STRATEGY) {
      throw new Error('Invalid strategy: ' + opts.strategy);
    }
  }

  if (opts.dictionary) {
    if (!Buffer.isBuffer(opts.dictionary)) {
      throw new Error('Invalid dictionary: it should be a Buffer instance');
    }
  }

  this._handle = new binding.Zlib(mode);

  var self = this;
  this._hadError = false;
  this._handle.onerror = function (message, errno) {
    // there is no way to cleanly recover.
    // continuing only obscures problems.
    _close(self);
    self._hadError = true;

    var error = new Error(message);
    error.errno = errno;
    error.code = exports.codes[errno];
    self.emit('error', error);
  };

  var level = exports.Z_DEFAULT_COMPRESSION;
  if (typeof opts.level === 'number') level = opts.level;

  var strategy = exports.Z_DEFAULT_STRATEGY;
  if (typeof opts.strategy === 'number') strategy = opts.strategy;

  this._handle.init(opts.windowBits || exports.Z_DEFAULT_WINDOWBITS, level, opts.memLevel || exports.Z_DEFAULT_MEMLEVEL, strategy, opts.dictionary);

  this._buffer = Buffer.allocUnsafe(this._chunkSize);
  this._offset = 0;
  this._level = level;
  this._strategy = strategy;

  this.once('end', this.close);

  Object.defineProperty(this, '_closed', {
    get: function () {
      return !_this._handle;
    },
    configurable: true,
    enumerable: true
  });
}

util.inherits(Zlib, Transform);

Zlib.prototype.params = function (level, strategy, callback) {
  if (level < exports.Z_MIN_LEVEL || level > exports.Z_MAX_LEVEL) {
    throw new RangeError('Invalid compression level: ' + level);
  }
  if (strategy != exports.Z_FILTERED && strategy != exports.Z_HUFFMAN_ONLY && strategy != exports.Z_RLE && strategy != exports.Z_FIXED && strategy != exports.Z_DEFAULT_STRATEGY) {
    throw new TypeError('Invalid strategy: ' + strategy);
  }

  if (this._level !== level || this._strategy !== strategy) {
    var self = this;
    this.flush(binding.Z_SYNC_FLUSH, function () {
      assert(self._handle, 'zlib binding closed');
      self._handle.params(level, strategy);
      if (!self._hadError) {
        self._level = level;
        self._strategy = strategy;
        if (callback) callback();
      }
    });
  } else {
    process.nextTick(callback);
  }
};

Zlib.prototype.reset = function () {
  assert(this._handle, 'zlib binding closed');
  return this._handle.reset();
};

// This is the _flush function called by the transform class,
// internally, when the last chunk has been written.
Zlib.prototype._flush = function (callback) {
  this._transform(Buffer.alloc(0), '', callback);
};

Zlib.prototype.flush = function (kind, callback) {
  var _this2 = this;

  var ws = this._writableState;

  if (typeof kind === 'function' || kind === undefined && !callback) {
    callback = kind;
    kind = binding.Z_FULL_FLUSH;
  }

  if (ws.ended) {
    if (callback) process.nextTick(callback);
  } else if (ws.ending) {
    if (callback) this.once('end', callback);
  } else if (ws.needDrain) {
    if (callback) {
      this.once('drain', function () {
        return _this2.flush(kind, callback);
      });
    }
  } else {
    this._flushFlag = kind;
    this.write(Buffer.alloc(0), '', callback);
  }
};

Zlib.prototype.close = function (callback) {
  _close(this, callback);
  process.nextTick(emitCloseNT, this);
};

function _close(engine, callback) {
  if (callback) process.nextTick(callback);

  // Caller may invoke .close after a zlib error (which will null _handle).
  if (!engine._handle) return;

  engine._handle.close();
  engine._handle = null;
}

function emitCloseNT(self) {
  self.emit('close');
}

Zlib.prototype._transform = function (chunk, encoding, cb) {
  var flushFlag;
  var ws = this._writableState;
  var ending = ws.ending || ws.ended;
  var last = ending && (!chunk || ws.length === chunk.length);

  if (chunk !== null && !Buffer.isBuffer(chunk)) return cb(new Error('invalid input'));

  if (!this._handle) return cb(new Error('zlib binding closed'));

  // If it's the last chunk, or a final flush, we use the Z_FINISH flush flag
  // (or whatever flag was provided using opts.finishFlush).
  // If it's explicitly flushing at some other time, then we use
  // Z_FULL_FLUSH. Otherwise, use Z_NO_FLUSH for maximum compression
  // goodness.
  if (last) flushFlag = this._finishFlushFlag;else {
    flushFlag = this._flushFlag;
    // once we've flushed the last of the queue, stop flushing and
    // go back to the normal behavior.
    if (chunk.length >= ws.length) {
      this._flushFlag = this._opts.flush || binding.Z_NO_FLUSH;
    }
  }

  this._processChunk(chunk, flushFlag, cb);
};

Zlib.prototype._processChunk = function (chunk, flushFlag, cb) {
  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var inOff = 0;

  var self = this;

  var async = typeof cb === 'function';

  if (!async) {
    var buffers = [];
    var nread = 0;

    var error;
    this.on('error', function (er) {
      error = er;
    });

    assert(this._handle, 'zlib binding closed');
    do {
      var res = this._handle.writeSync(flushFlag, chunk, // in
      inOff, // in_off
      availInBefore, // in_len
      this._buffer, // out
      this._offset, //out_off
      availOutBefore); // out_len
    } while (!this._hadError && callback(res[0], res[1]));

    if (this._hadError) {
      throw error;
    }

    if (nread >= kMaxLength) {
      _close(this);
      throw new RangeError(kRangeErrorMessage);
    }

    var buf = Buffer.concat(buffers, nread);
    _close(this);

    return buf;
  }

  assert(this._handle, 'zlib binding closed');
  var req = this._handle.write(flushFlag, chunk, // in
  inOff, // in_off
  availInBefore, // in_len
  this._buffer, // out
  this._offset, //out_off
  availOutBefore); // out_len

  req.buffer = chunk;
  req.callback = callback;

  function callback(availInAfter, availOutAfter) {
    // When the callback is used in an async write, the callback's
    // context is the `req` object that was created. The req object
    // is === this._handle, and that's why it's important to null
    // out the values after they are done being used. `this._handle`
    // can stay in memory longer than the callback and buffer are needed.
    if (this) {
      this.buffer = null;
      this.callback = null;
    }

    if (self._hadError) return;

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, 'have should not go down');

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;
      // serve some output to the consumer.
      if (async) {
        self.push(out);
      } else {
        buffers.push(out);
        nread += out.length;
      }
    }

    // exhausted the output buffer, or used all the input create a new one.
    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = Buffer.allocUnsafe(self._chunkSize);
    }

    if (availOutAfter === 0) {
      // Not actually done.  Need to reprocess.
      // Also, update the availInBefore to the availInAfter value,
      // so that if we have to hit it a third (fourth, etc.) time,
      // it'll have the correct byte counts.
      inOff += availInBefore - availInAfter;
      availInBefore = availInAfter;

      if (!async) return true;

      var newReq = self._handle.write(flushFlag, chunk, inOff, availInBefore, self._buffer, self._offset, self._chunkSize);
      newReq.callback = callback; // this same function
      newReq.buffer = chunk;
      return;
    }

    if (!async) return false;

    // finished with the chunk.
    cb();
  }
};

util.inherits(Deflate, Zlib);
util.inherits(Inflate, Zlib);
util.inherits(Gzip, Zlib);
util.inherits(Gunzip, Zlib);
util.inherits(DeflateRaw, Zlib);
util.inherits(InflateRaw, Zlib);
util.inherits(Unzip, Zlib);
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,require("timers").setImmediate,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").clearImmediate,"/node_modules/browserify-zlib/lib/index.js","/node_modules/browserify-zlib/lib")

},{"./binding":"/opt/privatesky/node_modules/browserify-zlib/lib/binding.js","assert":"assert","buffer":"buffer","stream":"stream","timers":"timers","util":"util"}]},{},["/opt/privatesky/builds/tmp/sandboxBase_intermediar.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZHMvdG1wL3NhbmRib3hCYXNlX2ludGVybWVkaWFyLmpzIiwibW9kdWxlcy9jYWxsZmxvdy9jb25zdGFudHMuanMiLCJtb2R1bGVzL2NhbGxmbG93L2xpYi9JbnRlcmNlcHRvclJlZ2lzdHJ5LmpzIiwibW9kdWxlcy9jYWxsZmxvdy9saWIvY2hvcmVvZ3JhcGhpZXMvU3dhcm1EZWJ1Zy5qcyIsIm1vZHVsZXMvY2FsbGZsb3cvbGliL2Nob3Jlb2dyYXBoaWVzL3N3YXJtLmpzIiwibW9kdWxlcy9jYWxsZmxvdy9saWIvY2hvcmVvZ3JhcGhpZXMvc3dhcm1JbnN0YW5jZXNNYW5hZ2VyLmpzIiwibW9kdWxlcy9jYWxsZmxvdy9saWIvbG9hZExpYnJhcnkuanMiLCJtb2R1bGVzL2NhbGxmbG93L2xpYi9vdmVyd3JpdGVSZXF1aXJlLmpzIiwibW9kdWxlcy9jYWxsZmxvdy9saWIvcGFyYWxsZWxKb2luUG9pbnQuanMiLCJtb2R1bGVzL2NhbGxmbG93L2xpYi9zZXJpYWxKb2luUG9pbnQuanMiLCJtb2R1bGVzL2NhbGxmbG93L2xpYi9zd2FybURlc2NyaXB0aW9uLmpzIiwibW9kdWxlcy9jYWxsZmxvdy9saWIvdXRpbGl0eUZ1bmN0aW9ucy9hc3NldC5qcyIsIm1vZHVsZXMvY2FsbGZsb3cvbGliL3V0aWxpdHlGdW5jdGlvbnMvYmFzZS5qcyIsIm1vZHVsZXMvY2FsbGZsb3cvbGliL3V0aWxpdHlGdW5jdGlvbnMvY2FsbGZsb3cuanMiLCJtb2R1bGVzL2NhbGxmbG93L2xpYi91dGlsaXR5RnVuY3Rpb25zL3RyYW5zYWN0aW9uLmpzIiwibW9kdWxlcy9jYWxsZmxvdy9zdGFuZGFyZEdsb2JhbFN5bWJvbHMuanMiLCJtb2R1bGVzL3Bza2J1ZmZlci9saWIvUFNLQnVmZmVyLmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL0xvZ2dlckNsaWVudC9HZW5lcmljTG9nZ2VyQ2xpZW50LmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL0xvZ2dlckNsaWVudC9Mb2dGYWN0b3J5LmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL0xvZ2dlckNsaWVudC9Mb2dnZXJDbGllbnQuanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvTG9nZ2VyQ2xpZW50L0xvZ2dlckludGVyZmFjZS5qcyIsIm1vZHVsZXMvcHNrbG9nZ2VyL3NyYy9Mb2dnZXJDbGllbnQvaW5kZXguanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvTWVzc2FnZVB1Ymxpc2hlci9NZXNzYWdlUHVibGlzaGVyLmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL01lc3NhZ2VQdWJsaXNoZXIvTWVzc2FnZVB1Ymxpc2hlckZvclNhbmRib3guanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvTWVzc2FnZVB1Ymxpc2hlci9UcmFuc3BvcnRJbnRlcmZhY2UuanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvTWVzc2FnZVB1Ymxpc2hlci9pbmRleC5qcyIsIm1vZHVsZXMvcHNrbG9nZ2VyL3NyYy9NZXNzYWdlU3Vic2NyaWJlci9NZXNzYWdlU3Vic2NyaWJlci5qcyIsIm1vZHVsZXMvcHNrbG9nZ2VyL3NyYy9NZXNzYWdlU3Vic2NyaWJlci9pbmRleC5qcyIsIm1vZHVsZXMvcHNrbG9nZ2VyL3NyYy9QU0tMb2dnZXJDbGllbnQvR2VuZXJpY1BTS0xvZ2dlci5qcyIsIm1vZHVsZXMvcHNrbG9nZ2VyL3NyYy9QU0tMb2dnZXJDbGllbnQvaW5kZXguanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvUHViU3ViUHJveHkvUHViU3ViUHJveHkuanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvUHViU3ViUHJveHkvaW5kZXguanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvdXRpbHMvQnVmZmVyZWRTb2NrZXQuanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvdXRpbHMvQ29uZmlndXJhdG9yLmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL3V0aWxzL0Vudmlyb25tZW50RGF0YVByb3ZpZGVyLmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL3V0aWxzL0xvZ0xldmVsLmpzIiwibW9kdWxlcy9wc2tsb2dnZXIvc3JjL3V0aWxzL1NvY2tldFR5cGUuanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9zcmMvdXRpbHMvaW5kZXguanMiLCJtb2R1bGVzL3NvdW5kcHVic3ViL2xpYi9zb3VuZFB1YlN1Yi5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9saWIvQ29tYm9zLmpzIiwibW9kdWxlcy9zd2FybXV0aWxzL2xpYi9Pd00uanMiLCJtb2R1bGVzL3N3YXJtdXRpbHMvbGliL1F1ZXVlLmpzIiwibW9kdWxlcy9zd2FybXV0aWxzL2xpYi9iZWVzSGVhbGVyLmpzIiwibW9kdWxlcy9zd2FybXV0aWxzL2xpYi9wc2tjb25zb2xlLmpzIiwibW9kdWxlcy9zd2FybXV0aWxzL2xpYi9zYWZlLXV1aWQuanMiLCJtb2R1bGVzL3N3YXJtdXRpbHMvbGliL3VpZEdlbmVyYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5LXpsaWIvbGliL2JpbmRpbmcuanMiLCJub2RlX21vZHVsZXMvcXVlcnlzdHJpbmctZXMzL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3VybC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyIsIm5vZGVfbW9kdWxlcy9iYXNlNjQtanMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnVmZmVyL2luZGV4LmpzIiwibW9kdWxlcy9jYWxsZmxvdy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL2llZWU3NTQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9wYXRoLWJyb3dzZXJpZnkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibW9kdWxlcy9wc2tidWZmZXIvaW5kZXguanMiLCJtb2R1bGVzL3Bza2xvZ2dlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9xdWVyeXN0cmluZy1lczMvaW5kZXguanMiLCJtb2R1bGVzL3NvdW5kcHVic3ViL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0cmVhbS1icm93c2VyaWZ5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N0cmluZ19kZWNvZGVyL2xpYi9zdHJpbmdfZGVjb2Rlci5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3VybC91cmwuanMiLCJub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnktemxpYi9saWIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMvTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xNQTtBQUNBO0FBQ0E7Ozs7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM5VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDclhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDeFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMzZ0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzlTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ0pBO0FBQ0E7QUFDQTs7Ozs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3ZTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNXRCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiZ2xvYmFsLnNhbmRib3hCYXNlTG9hZE1vZHVsZXMgPSBmdW5jdGlvbigpeyBcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcImNhbGxmbG93XCJdID0gcmVxdWlyZShcImNhbGxmbG93XCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wicHNrbG9nZ2VyXCJdID0gcmVxdWlyZShcInBza2xvZ2dlclwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInN3YXJtdXRpbHNcIl0gPSByZXF1aXJlKFwic3dhcm11dGlsc1wiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInNvdW5kcHVic3ViXCJdID0gcmVxdWlyZShcInNvdW5kcHVic3ViXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wicHNrYnVmZmVyXCJdID0gcmVxdWlyZShcInBza2J1ZmZlclwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcImFzc2VydFwiXSA9IHJlcXVpcmUoXCJhc3NlcnRcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJidWZmZXJcIl0gPSByZXF1aXJlKFwiYnVmZmVyXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiZXZlbnRzXCJdID0gcmVxdWlyZShcImV2ZW50c1wiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInBhdGhcIl0gPSByZXF1aXJlKFwicGF0aFwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInF1ZXJ5c3RyaW5nXCJdID0gcmVxdWlyZShcInF1ZXJ5c3RyaW5nXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wic3RyZWFtXCJdID0gcmVxdWlyZShcInN0cmVhbVwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInN0cmluZ19kZWNvZGVyXCJdID0gcmVxdWlyZShcInN0cmluZ19kZWNvZGVyXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1widGltZXJzXCJdID0gcmVxdWlyZShcInRpbWVyc1wiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInVybFwiXSA9IHJlcXVpcmUoXCJ1cmxcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJ1dGlsXCJdID0gcmVxdWlyZShcInV0aWxcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJpbmhlcml0c1wiXSA9IHJlcXVpcmUoXCJpbmhlcml0c1wiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInpsaWJcIl0gPSByZXF1aXJlKFwiemxpYlwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcImllZWU3NTRcIl0gPSByZXF1aXJlKFwiaWVlZTc1NFwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcImJhc2U2NC1qc1wiXSA9IHJlcXVpcmUoXCJiYXNlNjQtanNcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJwcm9jZXNzL2Jyb3dzZXIuanNcIl0gPSByZXF1aXJlKFwicHJvY2Vzcy9icm93c2VyLmpzXCIpO1xufVxuaWYgKGZhbHNlKSB7XG5cdHNhbmRib3hCYXNlTG9hZE1vZHVsZXMoKTtcbn07IFxuZ2xvYmFsLnNhbmRib3hCYXNlUmVxdWlyZSA9IHJlcXVpcmU7XG5pZiAodHlwZW9mICQkICE9PSBcInVuZGVmaW5lZFwiKSB7ICAgICAgICAgICAgXG4gICAgJCQucmVxdWlyZUJ1bmRsZShcInNhbmRib3hCYXNlXCIpO1xufTsiLCIkJC5DT05TVEFOVFMgPSB7XG4gICAgU1dBUk1fRk9SX0VYRUNVVElPTjpcInN3YXJtX2Zvcl9leGVjdXRpb25cIixcbiAgICBJTkJPVU5EOlwiaW5ib3VuZFwiLFxuICAgIE9VVEJPVU5EOlwib3V0Ym91bmRcIixcbiAgICBQRFM6XCJQcml2YXRlRGF0YVN5c3RlbVwiLFxuICAgIENSTDpcIkNvbW11bmljYXRpb25SZXBsaWNhdGlvbkxheWVyXCIsXG4gICAgU1dBUk1fUkVUVVJOOiAnc3dhcm1fcmV0dXJuJyxcbiAgICBCRUZPUkVfSU5URVJDRVBUT1I6ICdiZWZvcmUnLFxuICAgIEFGVEVSX0lOVEVSQ0VQVE9SOiAnYWZ0ZXInLFxufTtcblxuIiwiLy8gcmVsYXRlZCB0bzogU3dhcm1TcGFjZS5Td2FybURlc2NyaXB0aW9uLmNyZWF0ZVBoYXNlKClcblxuZnVuY3Rpb24gSW50ZXJjZXB0b3JSZWdpc3RyeSgpIHtcbiAgICBjb25zdCBydWxlcyA9IG5ldyBNYXAoKTtcblxuICAgIC8vID8/PyAkJC5lcnJvckhhbmRsZXIgTGlicmFyeSA/Pz9cbiAgICBjb25zdCBfQ0xBU1NfTkFNRSA9ICdJbnRlcmNlcHRvclJlZ2lzdHJ5JztcblxuICAgIC8qKioqKioqKioqKioqIFBSSVZBVEUgTUVUSE9EUyAqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gX3Rocm93RXJyb3IoZXJyLCBtc2cpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIubWVzc2FnZSwgYCR7X0NMQVNTX05BTUV9IGVycm9yIG1lc3NhZ2U6YCwgbXNnKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF93YXJuaW5nKG1zZykge1xuICAgICAgICBjb25zb2xlLndhcm4oYCR7X0NMQVNTX05BTUV9IHdhcm5pbmcgbWVzc2FnZTpgLCBtc2cpO1xuICAgIH1cblxuICAgIGNvbnN0IGdldFdoZW5PcHRpb25zID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IFdIRU5fT1BUSU9OUztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChXSEVOX09QVElPTlMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFdIRU5fT1BUSU9OUyA9IE9iamVjdC5mcmVlemUoW1xuICAgICAgICAgICAgICAgICAgICAkJC5DT05TVEFOVFMuQkVGT1JFX0lOVEVSQ0VQVE9SLFxuICAgICAgICAgICAgICAgICAgICAkJC5DT05TVEFOVFMuQUZURVJfSU5URVJDRVBUT1JcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBXSEVOX09QVElPTlM7XG4gICAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIGZ1bmN0aW9uIHZlcmlmeVdoZW5PcHRpb24od2hlbikge1xuICAgICAgICBpZiAoIWdldFdoZW5PcHRpb25zKCkuaW5jbHVkZXMod2hlbikpIHtcbiAgICAgICAgICAgIF90aHJvd0Vycm9yKG5ldyBSYW5nZUVycm9yKGBPcHRpb24gJyR7d2hlbn0nIGlzIHdyb25nIWApLFxuICAgICAgICAgICAgICAgIGBpdCBzaG91bGQgYmUgb25lIG9mOiAke2dldFdoZW5PcHRpb25zKCl9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiB2ZXJpZnlJc0Z1bmN0aW9uVHlwZShmbikge1xuICAgICAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBfdGhyb3dFcnJvcihuZXcgVHlwZUVycm9yKGBQYXJhbWV0ZXIgJyR7Zm59JyBpcyB3cm9uZyFgKSxcbiAgICAgICAgICAgICAgICBgaXQgc2hvdWxkIGJlIGEgZnVuY3Rpb24sIG5vdCAke3R5cGVvZiBmbn0hYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXNvbHZlTmFtZXNwYWNlUmVzb2x1dGlvbihzd2FybVR5cGVOYW1lKSB7XG4gICAgICAgIGlmIChzd2FybVR5cGVOYW1lID09PSAnKicpIHtcbiAgICAgICAgICAgIHJldHVybiBzd2FybVR5cGVOYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIChzd2FybVR5cGVOYW1lLmluY2x1ZGVzKFwiLlwiKSA/IHN3YXJtVHlwZU5hbWUgOiAoJCQubGlicmFyeVByZWZpeCArIFwiLlwiICsgc3dhcm1UeXBlTmFtZSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybXMgYW4gYXJyYXkgaW50byBhIGdlbmVyYXRvciB3aXRoIHRoZSBwYXJ0aWN1bGFyaXR5IHRoYXQgZG9uZSBpcyBzZXQgdG8gdHJ1ZSBvbiB0aGUgbGFzdCBlbGVtZW50LFxuICAgICAqIG5vdCBhZnRlciBpdCBmaW5pc2hlZCBpdGVyYXRpbmcsIHRoaXMgaXMgaGVscGZ1bCBpbiBvcHRpbWl6aW5nIHNvbWUgb3RoZXIgZnVuY3Rpb25zXG4gICAgICogSXQgaXMgdXNlZnVsIGlmIHlvdSB3YW50IGNhbGwgYSByZWN1cnNpdmUgZnVuY3Rpb24gb3ZlciB0aGUgYXJyYXkgZWxlbWVudHMgYnV0IHdpdGhvdXQgcG9wcGluZyB0aGUgZmlyc3RcbiAgICAgKiBlbGVtZW50IG9mIHRoZSBBcnJheSBvciBzZW5kaW5nIHRoZSBpbmRleCBhcyBhbiBleHRyYSBwYXJhbWV0ZXJcbiAgICAgKiBAcGFyYW0ge0FycmF5PCo+fSBhcnJcbiAgICAgKiBAcmV0dXJuIHtJdGVyYWJsZUl0ZXJhdG9yPCo+fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uKiBjcmVhdGVBcnJheUdlbmVyYXRvcihhcnIpIHtcbiAgICAgICAgY29uc3QgbGVuID0gYXJyLmxlbmd0aDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbiAtIDE7ICsraSkge1xuICAgICAgICAgICAgeWllbGQgYXJyW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycltsZW4gLSAxXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZHMgYSB0cmVlIGxpa2Ugc3RydWN0dXJlIG92ZXIgdGltZSAoaWYgY2FsbGVkIG9uIHRoZSBzYW1lIHJvb3Qgbm9kZSkgd2hlcmUgaW50ZXJuYWwgbm9kZXMgYXJlIGluc3RhbmNlcyBvZlxuICAgICAqIE1hcCBjb250YWluaW5nIHRoZSBuYW1lIG9mIHRoZSBjaGlsZHJlbiBub2RlcyAoZWFjaCBjaGlsZCBuYW1lIGlzIHRoZSByZXN1bHQgb2YgY2FsbGluZyBuZXh0IG9uIGBrZXlzR2VuZXJhdG9yKVxuICAgICAqIGFuZCBhIHJlZmVyZW5jZSB0byB0aGVtIGFuZCBvbiBsZWFmcyBpdCBjb250YWlucyBhbiBpbnN0YW5jZSBvZiBTZXQgd2hlcmUgaXQgYWRkcyB0aGUgZnVuY3Rpb24gZ2l2ZW4gYXMgcGFyYW1ldGVyXG4gICAgICogKGV4OiBmb3IgYSBrZXlHZW5lcmF0b3IgdGhhdCByZXR1cm5zIGluIHRoaXMgb3JkZXIgKFwia2V5MVwiLCBcImtleTJcIikgdGhlIHJlc3VsdGluZyBzdHJ1Y3R1cmUgd2lsbCBiZTpcbiAgICAgKiB7XCJrZXkxXCI6IHtcImtleTFcIjogU2V0KFtmbl0pfX0gLSB1c2luZyBKU09OIGp1c3QgZm9yIGlsbHVzdHJhdGlvbiBwdXJwb3NlcyBiZWNhdXNlIGl0J3MgZWFzaWVyIHRvIHJlcHJlc2VudClcbiAgICAgKiBAcGFyYW0ge01hcH0gcnVsZXNNYXBcbiAgICAgKiBAcGFyYW0ge0l0ZXJhYmxlSXRlcmF0b3J9IGtleXNHZW5lcmF0b3IgLSBpdCBoYXMgdGhlIHBhcnRpY3VsYXJpdHkgdGhhdCBkb25lIGlzIHNldCBvbiBsYXN0IGVsZW1lbnQsIG5vdCBhZnRlciBpdFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGZuXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVnaXN0ZXJSZWN1cnNpdmVSdWxlKHJ1bGVzTWFwLCBrZXlzR2VuZXJhdG9yLCBmbikge1xuICAgICAgICBjb25zdCB7dmFsdWUsIGRvbmV9ID0ga2V5c0dlbmVyYXRvci5uZXh0KCk7XG5cbiAgICAgICAgaWYgKCFkb25lKSB7IC8vIGludGVybmFsIG5vZGVcbiAgICAgICAgICAgIGNvbnN0IG5leHRLZXkgPSBydWxlc01hcC5nZXQodmFsdWUpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5leHRLZXkgPT09ICd1bmRlZmluZWQnKSB7IC8vIGlmIHZhbHVlIG5vdCBmb3VuZCBpbiBydWxlc01hcFxuICAgICAgICAgICAgICAgIHJ1bGVzTWFwLnNldCh2YWx1ZSwgbmV3IE1hcCgpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVnaXN0ZXJSZWN1cnNpdmVSdWxlKHJ1bGVzTWFwLmdldCh2YWx1ZSksIGtleXNHZW5lcmF0b3IsIGZuKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gcmVhY2hlZCBsZWFmIG5vZGVcbiAgICAgICAgICAgIGlmICghcnVsZXNNYXAuaGFzKHZhbHVlKSkge1xuXG4gICAgICAgICAgICAgICAgcnVsZXNNYXAuc2V0KHZhbHVlLCBuZXcgU2V0KFtmbl0pKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2V0ID0gcnVsZXNNYXAuZ2V0KHZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGlmIChzZXQuaGFzKGZuKSkge1xuICAgICAgICAgICAgICAgICAgICBfd2FybmluZyhgRHVwbGljYXRlZCBpbnRlcmNlcHRvciBmb3IgJyR7a2V5fSdgKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzZXQuYWRkKGZuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGNvcnJlc3BvbmRpbmcgc2V0IG9mIGZ1bmN0aW9ucyBmb3IgdGhlIGdpdmVuIGtleSBpZiBmb3VuZFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBmb3JtYXR0ZWQgYXMgYSBwYXRoIHdpdGhvdXQgdGhlIGZpcnN0ICcvJyAoZXg6IHN3YXJtVHlwZS9zd2FybVBoYXNlL2JlZm9yZSlcbiAgICAgKiBAcmV0dXJuIHtBcnJheTxTZXQ8ZnVuY3Rpb24+Pn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRJbnRlcmNlcHRvcnNGb3JLZXkoa2V5KSB7XG4gICAgICAgIGlmIChrZXkuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICAgICAgICBfd2FybmluZyhgSW50ZXJjZXB0b3IgY2FsbGVkIG9uIGtleSAke2tleX0gc3RhcnRpbmcgd2l0aCAnLycsIGF1dG9tYXRpY2FsbHkgcmVtb3ZpbmcgaXRgKTtcbiAgICAgICAgICAgIGtleSA9IGtleS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBrZXlFbGVtZW50cyA9IGtleS5zcGxpdCgnLycpO1xuICAgICAgICBjb25zdCBrZXlzR2VuZXJhdG9yID0gY3JlYXRlQXJyYXlHZW5lcmF0b3Ioa2V5RWxlbWVudHMpO1xuXG4gICAgICAgIHJldHVybiBnZXRWYWx1ZVJlY3Vyc2l2ZWx5KFtydWxlc10sIGtleXNHZW5lcmF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEl0IHdvcmtzIGxpa2UgYSBCRlMgc2VhcmNoIHJldHVybmluZyB0aGUgbGVhZnMgcmVzdWx0aW5nIGZyb20gdHJhdmVyc2luZyB0aGUgaW50ZXJuYWwgbm9kZXMgd2l0aCBjb3JyZXNwb25kaW5nXG4gICAgICogbmFtZXMgZ2l2ZW4gZm9yIGVhY2ggbGV2ZWwgKGRlcHRoKSBieSBga2V5c0dlbmVyYXRvcmBcbiAgICAgKiBAcGFyYW0ge0FycmF5PE1hcD59IHNlYXJjaGFibGVOb2Rlc1xuICAgICAqIEBwYXJhbSB7SXRlcmFibGVJdGVyYXRvcn0ga2V5c0dlbmVyYXRvciAtIGl0IGhhcyB0aGUgcGFydGljdWxhcml0eSB0aGF0IGRvbmUgaXMgc2V0IG9uIGxhc3QgZWxlbWVudCwgbm90IGFmdGVyIGl0XG4gICAgICogQHJldHVybiB7QXJyYXk8U2V0PGZ1bmN0aW9uPj59XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0VmFsdWVSZWN1cnNpdmVseShzZWFyY2hhYmxlTm9kZXMsIGtleXNHZW5lcmF0b3IpIHtcbiAgICAgICAgY29uc3Qge3ZhbHVlOiBub2RlTmFtZSwgZG9uZX0gPSBrZXlzR2VuZXJhdG9yLm5leHQoKTtcblxuICAgICAgICBjb25zdCBuZXh0Tm9kZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGNvbnN0IG5vZGVJblJ1bGVzIG9mIHNlYXJjaGFibGVOb2Rlcykge1xuICAgICAgICAgICAgY29uc3QgbmV4dE5vZGVGb3JBbGwgPSBub2RlSW5SdWxlcy5nZXQoJyonKTtcbiAgICAgICAgICAgIGNvbnN0IG5leHROb2RlID0gbm9kZUluUnVsZXMuZ2V0KG5vZGVOYW1lKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXh0Tm9kZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIG5leHROb2Rlcy5wdXNoKG5leHROb2RlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXh0Tm9kZUZvckFsbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIG5leHROb2Rlcy5wdXNoKG5leHROb2RlRm9yQWxsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0Tm9kZXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZ2V0VmFsdWVSZWN1cnNpdmVseShuZXh0Tm9kZXMsIGtleXNHZW5lcmF0b3IpO1xuICAgIH1cblxuXG4gICAgLyoqKioqKioqKioqKiogUFVCTElDIE1FVEhPRFMgKioqKioqKioqKioqKi9cblxuICAgIHRoaXMucmVnaXN0ZXIgPSBmdW5jdGlvbiAoc3dhcm1UeXBlTmFtZSwgcGhhc2VOYW1lLCB3aGVuLCBmbikge1xuICAgICAgICB2ZXJpZnlXaGVuT3B0aW9uKHdoZW4pO1xuICAgICAgICB2ZXJpZnlJc0Z1bmN0aW9uVHlwZShmbik7XG5cbiAgICAgICAgY29uc3QgcmVzb2x2ZWRTd2FybVR5cGVOYW1lID0gcmVzb2x2ZU5hbWVzcGFjZVJlc29sdXRpb24oc3dhcm1UeXBlTmFtZSk7XG4gICAgICAgIGNvbnN0IGtleXMgPSBjcmVhdGVBcnJheUdlbmVyYXRvcihbcmVzb2x2ZWRTd2FybVR5cGVOYW1lLCBwaGFzZU5hbWUsIHdoZW5dKTtcblxuICAgICAgICByZWdpc3RlclJlY3Vyc2l2ZVJ1bGUocnVsZXMsIGtleXMsIGZuKTtcbiAgICB9O1xuXG4gICAgLy8gdGhpcy51bnJlZ2lzdGVyID0gZnVuY3Rpb24gKCkgeyB9XG5cbiAgICB0aGlzLmNhbGxJbnRlcmNlcHRvcnMgPSBmdW5jdGlvbiAoa2V5LCB0YXJnZXRPYmplY3QsIGFyZ3MpIHtcbiAgICAgICAgY29uc3QgaW50ZXJjZXB0b3JzID0gZ2V0SW50ZXJjZXB0b3JzRm9yS2V5KGtleSk7XG5cbiAgICAgICAgaWYgKGludGVyY2VwdG9ycykge1xuICAgICAgICAgICAgZm9yIChjb25zdCBpbnRlcmNlcHRvclNldCBvZiBpbnRlcmNlcHRvcnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZuIG9mIGludGVyY2VwdG9yU2V0KSB7IC8vIGludGVyY2VwdG9ycyBvbiBrZXkgJyonIGFyZSBjYWxsZWQgYmVmb3JlIHRob3NlIHNwZWNpZmllZCBieSBuYW1lXG4gICAgICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRhcmdldE9iamVjdCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn1cblxuXG5leHBvcnRzLmNyZWF0ZUludGVyY2VwdG9yUmVnaXN0cnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBJbnRlcmNlcHRvclJlZ2lzdHJ5KCk7XG59O1xuIiwiLypcbiBJbml0aWFsIExpY2Vuc2U6IChjKSBBeGlvbG9naWMgUmVzZWFyY2ggJiBBbGJvYWllIFPDrm5pY8SDLlxuIENvbnRyaWJ1dG9yczogQXhpb2xvZ2ljIFJlc2VhcmNoICwgUHJpdmF0ZVNreSBwcm9qZWN0XG4gQ29kZSBMaWNlbnNlOiBMR1BMIG9yIE1JVC5cbiAqL1xuXG52YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xudmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xuY3ByaW50ID0gY29uc29sZS5sb2c7XG53cHJpbnQgPSBjb25zb2xlLndhcm47XG5kcHJpbnQgPSBjb25zb2xlLmRlYnVnO1xuZXByaW50ID0gY29uc29sZS5lcnJvcjtcblxuXG4vKipcbiAqIFNob3J0Y3V0IHRvIEpTT04uc3RyaW5naWZ5XG4gKiBAcGFyYW0gb2JqXG4gKi9cbkogPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9iaik7XG59XG5cblxuLyoqXG4gKiBQcmludCBzd2FybSBjb250ZXh0cyAoTWVzc2FnZXMpIGFuZCBlYXNpZXIgdG8gcmVhZCBjb21wYXJlZCB3aXRoIEpcbiAqIEBwYXJhbSBvYmpcbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZXhwb3J0cy5jbGVhbkR1bXAgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIG8gPSBvYmoudmFsdWVPZigpO1xuICAgIHZhciBtZXRhID0ge1xuICAgICAgICBzd2FybVR5cGVOYW1lOm8ubWV0YS5zd2FybVR5cGVOYW1lXG4gICAgfTtcbiAgICByZXR1cm4gXCJcXHQgc3dhcm1JZDogXCIgKyBvLm1ldGEuc3dhcm1JZCArIFwie1xcblxcdFxcdG1ldGE6IFwiICAgICsgSihtZXRhKSArXG4gICAgICAgIFwiXFxuXFx0XFx0cHVibGljOiBcIiAgICAgICAgKyBKKG8ucHVibGljVmFycykgK1xuICAgICAgICBcIlxcblxcdFxcdHByb3RlY3RlZDogXCIgICAgICsgSihvLnByb3RlY3RlZFZhcnMpICtcbiAgICAgICAgXCJcXG5cXHRcXHRwcml2YXRlOiBcIiAgICAgICArIEooby5wcml2YXRlVmFycykgKyBcIlxcblxcdH1cXG5cIjtcbn1cblxuLy9NID0gZXhwb3J0cy5jbGVhbkR1bXA7XG4vKipcbiAqIEV4cGVyaW1lbnRhbCBmdW5jdGlvbnNcbiAqL1xuXG5cbi8qXG5cbiBsb2dnZXIgICAgICA9IG1vbml0b3IubG9nZ2VyO1xuIGFzc2VydCAgICAgID0gbW9uaXRvci5hc3NlcnQ7XG4gdGhyb3dpbmcgICAgPSBtb25pdG9yLmV4Y2VwdGlvbnM7XG5cblxuIHZhciB0ZW1wb3JhcnlMb2dCdWZmZXIgPSBbXTtcblxuIHZhciBjdXJyZW50U3dhcm1Db21JbXBsID0gbnVsbDtcblxuIGxvZ2dlci5yZWNvcmQgPSBmdW5jdGlvbihyZWNvcmQpe1xuIGlmKGN1cnJlbnRTd2FybUNvbUltcGw9PT1udWxsKXtcbiB0ZW1wb3JhcnlMb2dCdWZmZXIucHVzaChyZWNvcmQpO1xuIH0gZWxzZSB7XG4gY3VycmVudFN3YXJtQ29tSW1wbC5yZWNvcmRMb2cocmVjb3JkKTtcbiB9XG4gfVxuXG4gdmFyIGNvbnRhaW5lciA9IHJlcXVpcmUoXCJkaWNvbnRhaW5lclwiKS5jb250YWluZXI7XG5cbiBjb250YWluZXIuc2VydmljZShcInN3YXJtTG9nZ2luZ01vbml0b3JcIiwgW1wic3dhcm1pbmdJc1dvcmtpbmdcIiwgXCJzd2FybUNvbUltcGxcIl0sIGZ1bmN0aW9uKG91dE9mU2VydmljZSxzd2FybWluZywgc3dhcm1Db21JbXBsKXtcblxuIGlmKG91dE9mU2VydmljZSl7XG4gaWYoIXRlbXBvcmFyeUxvZ0J1ZmZlcil7XG4gdGVtcG9yYXJ5TG9nQnVmZmVyID0gW107XG4gfVxuIH0gZWxzZSB7XG4gdmFyIHRtcCA9IHRlbXBvcmFyeUxvZ0J1ZmZlcjtcbiB0ZW1wb3JhcnlMb2dCdWZmZXIgPSBbXTtcbiBjdXJyZW50U3dhcm1Db21JbXBsID0gc3dhcm1Db21JbXBsO1xuIGxvZ2dlci5yZWNvcmQgPSBmdW5jdGlvbihyZWNvcmQpe1xuIGN1cnJlbnRTd2FybUNvbUltcGwucmVjb3JkTG9nKHJlY29yZCk7XG4gfVxuXG4gdG1wLmZvckVhY2goZnVuY3Rpb24ocmVjb3JkKXtcbiBsb2dnZXIucmVjb3JkKHJlY29yZCk7XG4gfSk7XG4gfVxuIH0pXG5cbiAqL1xudW5jYXVnaHRFeGNlcHRpb25TdHJpbmcgPSBcIlwiO1xudW5jYXVnaHRFeGNlcHRpb25FeGlzdHMgPSBmYWxzZTtcbmlmKHR5cGVvZiBnbG9iYWxWZXJib3NpdHkgPT0gJ3VuZGVmaW5lZCcpe1xuICAgIGdsb2JhbFZlcmJvc2l0eSA9IGZhbHNlO1xufVxuXG52YXIgREVCVUdfU1RBUlRfVElNRSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG5mdW5jdGlvbiBnZXREZWJ1Z0RlbHRhKCl7XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgcmV0dXJuIGN1cnJlbnRUaW1lIC0gREVCVUdfU1RBUlRfVElNRTtcbn1cblxuLyoqXG4gKiBEZWJ1ZyBmdW5jdGlvbnMsIGluZmx1ZW5jZWQgYnkgZ2xvYmFsVmVyYm9zaXR5IGdsb2JhbCB2YXJpYWJsZVxuICogQHBhcmFtIHR4dFxuICovXG5kcHJpbnQgPSBmdW5jdGlvbiAodHh0KSB7XG4gICAgaWYgKGdsb2JhbFZlcmJvc2l0eSA9PSB0cnVlKSB7XG4gICAgICAgIGlmICh0aGlzQWRhcHRlci5pbml0aWxpc2VkICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJERUJVRzogW1wiICsgdGhpc0FkYXB0ZXIubm9kZU5hbWUgKyBcIl0oXCIgKyBnZXREZWJ1Z0RlbHRhKCkrIFwiKTpcIit0eHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJERUJVRzogKFwiICsgZ2V0RGVidWdEZWx0YSgpKyBcIik6XCIrdHh0KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiREVCVUc6IFwiICsgdHh0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBvYnNvbGV0ZSE/XG4gKiBAcGFyYW0gdHh0XG4gKi9cbmFwcmludCA9IGZ1bmN0aW9uICh0eHQpIHtcbiAgICBjb25zb2xlLmxvZyhcIkRFQlVHOiBbXCIgKyB0aGlzQWRhcHRlci5ub2RlTmFtZSArIFwiXTogXCIgKyB0eHQpO1xufVxuXG5cblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHVzdWFsbHkgdXNlZCBpbiB0ZXN0cywgZXhpdCBjdXJyZW50IHByb2Nlc3MgYWZ0ZXIgYSB3aGlsZVxuICogQHBhcmFtIG1zZ1xuICogQHBhcmFtIHRpbWVvdXRcbiAqL1xuZGVsYXlFeGl0ID0gZnVuY3Rpb24gKG1zZywgcmV0Q29kZSx0aW1lb3V0KSB7XG4gICAgaWYocmV0Q29kZSA9PSB1bmRlZmluZWQpe1xuICAgICAgICByZXRDb2RlID0gRXhpdENvZGVzLlVua25vd25FcnJvcjtcbiAgICB9XG5cbiAgICBpZih0aW1lb3V0ID09IHVuZGVmaW5lZCl7XG4gICAgICAgIHRpbWVvdXQgPSAxMDA7XG4gICAgfVxuXG4gICAgaWYobXNnID09IHVuZGVmaW5lZCl7XG4gICAgICAgIG1zZyA9IFwiRGVsYXlpbmcgZXhpdCB3aXRoIFwiKyB0aW1lb3V0ICsgXCJtc1wiO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKG1zZyk7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHByb2Nlc3MuZXhpdChyZXRDb2RlKTtcbiAgICB9LCB0aW1lb3V0KTtcbn1cblxuXG5mdW5jdGlvbiBsb2NhbExvZyAobG9nVHlwZSwgbWVzc2FnZSwgZXJyKSB7XG4gICAgdmFyIHRpbWUgPSBuZXcgRGF0ZSgpO1xuICAgIHZhciBub3cgPSB0aW1lLmdldERhdGUoKSArIFwiLVwiICsgKHRpbWUuZ2V0TW9udGgoKSArIDEpICsgXCIsXCIgKyB0aW1lLmdldEhvdXJzKCkgKyBcIjpcIiArIHRpbWUuZ2V0TWludXRlcygpO1xuICAgIHZhciBtc2c7XG5cbiAgICBtc2cgPSAnWycgKyBub3cgKyAnXVsnICsgdGhpc0FkYXB0ZXIubm9kZU5hbWUgKyAnXSAnICsgbWVzc2FnZTtcblxuICAgIGlmIChlcnIgIT0gbnVsbCAmJiBlcnIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1zZyArPSAnXFxuICAgICBFcnI6ICcgKyBlcnIudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKGVyci5zdGFjayAmJiBlcnIuc3RhY2sgIT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgbXNnICs9ICdcXG4gICAgIFN0YWNrOiAnICsgZXJyLnN0YWNrICsgJ1xcbic7XG4gICAgfVxuXG4gICAgY3ByaW50KG1zZyk7XG4gICAgaWYodGhpc0FkYXB0ZXIuaW5pdGlsaXNlZCl7XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGZzLmFwcGVuZEZpbGVTeW5jKGdldFN3YXJtRmlsZVBhdGgodGhpc0FkYXB0ZXIuY29uZmlnLmxvZ3NQYXRoICsgXCIvXCIgKyBsb2dUeXBlKSwgbXNnKTtcbiAgICAgICAgfSBjYXRjaChlcnIpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGYWlsaW5nIHRvIHdyaXRlIGxvZ3MgaW4gXCIsIHRoaXNBZGFwdGVyLmNvbmZpZy5sb2dzUGF0aCApO1xuICAgICAgICB9XG5cbiAgICB9XG59XG5cblxuLy8gcHJpbnRmID0gZnVuY3Rpb24gKC4uLnBhcmFtcykge1xuLy8gICAgIHZhciBhcmdzID0gW107IC8vIGVtcHR5IGFycmF5XG4vLyAgICAgLy8gY29weSBhbGwgb3RoZXIgYXJndW1lbnRzIHdlIHdhbnQgdG8gXCJwYXNzIHRocm91Z2hcIlxuLy8gICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyYW1zLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgIGFyZ3MucHVzaChwYXJhbXNbaV0pO1xuLy8gICAgIH1cbi8vICAgICB2YXIgb3V0ID0gdXRpbC5mb3JtYXQuYXBwbHkodGhpcywgYXJncyk7XG4vLyAgICAgY29uc29sZS5sb2cob3V0KTtcbi8vIH1cbi8vXG4vLyBzcHJpbnRmID0gZnVuY3Rpb24gKC4uLnBhcmFtcykge1xuLy8gICAgIHZhciBhcmdzID0gW107IC8vIGVtcHR5IGFycmF5XG4vLyAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgYXJncy5wdXNoKHBhcmFtc1tpXSk7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiB1dGlsLmZvcm1hdC5hcHBseSh0aGlzLCBhcmdzKTtcbi8vIH1cblxuIiwiZXhwb3J0cy5jcmVhdGVGb3JPYmplY3QgPSBmdW5jdGlvbih2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCl7XG5cdHJldHVybiByZXF1aXJlKFwiLi4vdXRpbGl0eUZ1bmN0aW9ucy9iYXNlXCIpLmNyZWF0ZUZvck9iamVjdCh2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCk7XG59OyIsIlxuXG5mdW5jdGlvbiBTd2FybXNJbnN0YW5jZXNNYW5hZ2VyKCl7XG4gICAgdmFyIHN3YXJtQWxpdmVJbnN0YW5jZXMgPSB7XG5cbiAgICB9XG5cbiAgICB0aGlzLndhaXRGb3JTd2FybSA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBzd2FybSwga2VlcEFsaXZlQ2hlY2spe1xuXG4gICAgICAgIGZ1bmN0aW9uIGRvTG9naWMoKXtcbiAgICAgICAgICAgIHZhciBzd2FybUlkID0gc3dhcm0uZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZDtcbiAgICAgICAgICAgIHZhciB3YXRjaGVyID0gc3dhcm1BbGl2ZUluc3RhbmNlc1tzd2FybUlkXTtcbiAgICAgICAgICAgIGlmKCF3YXRjaGVyKXtcbiAgICAgICAgICAgICAgICB3YXRjaGVyID0ge1xuICAgICAgICAgICAgICAgICAgICBzd2FybTpzd2FybSxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6Y2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICAgIGtlZXBBbGl2ZUNoZWNrOmtlZXBBbGl2ZUNoZWNrXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3YXJtQWxpdmVJbnN0YW5jZXNbc3dhcm1JZF0gPSB3YXRjaGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZmlsdGVyKCl7XG4gICAgICAgICAgICByZXR1cm4gc3dhcm0uZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vJCQudWlkR2VuZXJhdG9yLndhaXRfZm9yX2NvbmRpdGlvbihjb25kaXRpb24sZG9Mb2dpYyk7XG4gICAgICAgIHN3YXJtLm9ic2VydmUoZG9Mb2dpYywgbnVsbCwgZmlsdGVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGVhblN3YXJtV2FpdGVyKHN3YXJtU2VyaWFsaXNhdGlvbil7IC8vIFRPRE86IGFkZCBiZXR0ZXIgbWVjaGFuaXNtcyB0byBwcmV2ZW50IG1lbW9yeSBsZWFrc1xuICAgICAgICB2YXIgc3dhcm1JZCA9IHN3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLnN3YXJtSWQ7XG4gICAgICAgIHZhciB3YXRjaGVyID0gc3dhcm1BbGl2ZUluc3RhbmNlc1tzd2FybUlkXTtcblxuICAgICAgICBpZighd2F0Y2hlcil7XG4gICAgICAgICAgICAkJC5lcnJvckhhbmRsZXIud2FybmluZyhcIkludmFsaWQgc3dhcm0gcmVjZWl2ZWQ6IFwiICsgc3dhcm1JZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJncyA9IHN3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLmFyZ3M7XG4gICAgICAgIGFyZ3MucHVzaChzd2FybVNlcmlhbGlzYXRpb24pO1xuXG4gICAgICAgIHdhdGNoZXIuY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgIGlmKCF3YXRjaGVyLmtlZXBBbGl2ZUNoZWNrKCkpe1xuICAgICAgICAgICAgZGVsZXRlIHN3YXJtQWxpdmVJbnN0YW5jZXNbc3dhcm1JZF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJldml2ZV9zd2FybSA9IGZ1bmN0aW9uKHN3YXJtU2VyaWFsaXNhdGlvbil7XG5cblxuICAgICAgICB2YXIgc3dhcm1JZCAgICAgPSBzd2FybVNlcmlhbGlzYXRpb24ubWV0YS5zd2FybUlkO1xuICAgICAgICB2YXIgc3dhcm1UeXBlICAgPSBzd2FybVNlcmlhbGlzYXRpb24ubWV0YS5zd2FybVR5cGVOYW1lO1xuICAgICAgICB2YXIgaW5zdGFuY2UgICAgPSBzd2FybUFsaXZlSW5zdGFuY2VzW3N3YXJtSWRdO1xuXG4gICAgICAgIHZhciBzd2FybTtcblxuICAgICAgICBpZihpbnN0YW5jZSl7XG4gICAgICAgICAgICBzd2FybSA9IGluc3RhbmNlLnN3YXJtO1xuICAgICAgICAgICAgc3dhcm0udXBkYXRlKHN3YXJtU2VyaWFsaXNhdGlvbik7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN3YXJtID0gJCQuc3dhcm0uc3RhcnQoc3dhcm1UeXBlKTtcbiAgICAgICAgICAgIGlmKCFzd2FybSl7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIHN3YXJtIHR5cGUgPCR7c3dhcm1UeXBlfT4uIENoZWNrIGlmIHN3YXJtIHR5cGUgaXMgcHJlc2VudCBpbiBkb21haW4gY29uc3RpdHVpb24hYCk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBzd2FybS51cGRhdGUoc3dhcm1TZXJpYWxpc2F0aW9uKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLypzd2FybSA9ICQkLnN3YXJtLnN0YXJ0KHN3YXJtVHlwZSwgc3dhcm1TZXJpYWxpc2F0aW9uKTsqL1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLmNvbW1hbmQgPT0gXCJhc3luY1JldHVyblwiKSB7XG4gICAgICAgICAgICB2YXIgY28gPSAkJC5QU0tfUHViU3ViLnB1Ymxpc2goJCQuQ09OU1RBTlRTLlNXQVJNX1JFVFVSTiwgc3dhcm1TZXJpYWxpc2F0aW9uKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3Vic2NyaWJlcnMgbGlzdGVuaW5nIG9uXCIsICQkLkNPTlNUQU5UUy5TV0FSTV9SRVRVUk4sIGNvKTtcbiAgICAgICAgICAgIC8vIGNsZWFuU3dhcm1XYWl0ZXIoc3dhcm1TZXJpYWxpc2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChzd2FybVNlcmlhbGlzYXRpb24ubWV0YS5jb21tYW5kID09IFwiZXhlY3V0ZVN3YXJtUGhhc2VcIikge1xuICAgICAgICAgICAgc3dhcm0ucnVuUGhhc2Uoc3dhcm1TZXJpYWxpc2F0aW9uLm1ldGEucGhhc2VOYW1lLCBzd2FybVNlcmlhbGlzYXRpb24ubWV0YS5hcmdzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5rbm93biBjb21tYW5kXCIsIHN3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLmNvbW1hbmQsIFwiaW4gc3dhcm1TZXJpYWxpc2F0aW9uLm1ldGEuY29tbWFuZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzd2FybTtcbiAgICB9XG59XG5cblxuJCQuc3dhcm1zSW5zdGFuY2VzTWFuYWdlciA9IG5ldyBTd2FybXNJbnN0YW5jZXNNYW5hZ2VyKCk7XG5cblxuIiwiLypcbkluaXRpYWwgTGljZW5zZTogKGMpIEF4aW9sb2dpYyBSZXNlYXJjaCAmIEFsYm9haWUgU8OubmljxIMuXG5Db250cmlidXRvcnM6IEF4aW9sb2dpYyBSZXNlYXJjaCAsIFByaXZhdGVTa3kgcHJvamVjdFxuQ29kZSBMaWNlbnNlOiBMR1BMIG9yIE1JVC5cbiovXG5cbi8vdmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xuLy92YXIgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuXG5cbmZ1bmN0aW9uIFN3YXJtTGlicmFyeShwcmVmaXhOYW1lLCBmb2xkZXIpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiB3cmFwQ2FsbChvcmlnaW5hbCwgcHJlZml4TmFtZSl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiguLi5hcmdzKXtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJwcmVmaXhOYW1lXCIsIHByZWZpeE5hbWUpXG4gICAgICAgICAgICB2YXIgcHJldmlvdXNQcmVmaXggPSAkJC5saWJyYXJ5UHJlZml4O1xuICAgICAgICAgICAgdmFyIHByZXZpb3VzTGlicmFyeSA9ICQkLl9fZ2xvYmFsLmN1cnJlbnRMaWJyYXJ5O1xuXG4gICAgICAgICAgICAkJC5saWJyYXJ5UHJlZml4ID0gcHJlZml4TmFtZTtcbiAgICAgICAgICAgICQkLl9fZ2xvYmFsLmN1cnJlbnRMaWJyYXJ5ID0gc2VsZjtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICB2YXIgcmV0ID0gb3JpZ2luYWwuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgJCQubGlicmFyeVByZWZpeCA9IHByZXZpb3VzUHJlZml4IDtcbiAgICAgICAgICAgICAgICAkJC5fX2dsb2JhbC5jdXJyZW50TGlicmFyeSA9IHByZXZpb3VzTGlicmFyeTtcbiAgICAgICAgICAgIH1jYXRjaChlcnIpe1xuICAgICAgICAgICAgICAgICQkLmxpYnJhcnlQcmVmaXggPSBwcmV2aW91c1ByZWZpeCA7XG4gICAgICAgICAgICAgICAgJCQuX19nbG9iYWwuY3VycmVudExpYnJhcnkgPSBwcmV2aW91c0xpYnJhcnk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQkLmxpYnJhcmllc1twcmVmaXhOYW1lXSA9IHRoaXM7XG4gICAgdmFyIHByZWZpeGVkUmVxdWlyZSA9IHdyYXBDYWxsKGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgICByZXR1cm4gcmVxdWlyZShwYXRoKTtcbiAgICB9LCBwcmVmaXhOYW1lKTtcblxuICAgIGZ1bmN0aW9uIGluY2x1ZGVBbGxJblJvb3QoZm9sZGVyKSB7XG4gICAgICAgIGlmKHR5cGVvZiBmb2xkZXIgIT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICAvL3dlIGFzc3VtZSB0aGF0IGl0IGlzIGEgbGlicmFyeSBtb2R1bGUgcHJvcGVybHkgcmVxdWlyZWQgd2l0aCByZXF1aXJlIGFuZCBjb250YWluaW5nICQkLmxpYnJhcnlcbiAgICAgICAgICAgIGZvcih2YXIgdiBpbiBmb2xkZXIpe1xuICAgICAgICAgICAgICAgICQkLnJlZ2lzdGVyU3dhcm1EZXNjcmlwdGlvbihwcmVmaXhOYW1lLHYsIHByZWZpeE5hbWUgKyBcIi5cIiArIHYsICBmb2xkZXJbdl0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbmV3TmFtZXMgPSAkJC5fX2dsb2JhbC5yZXF1aXJlTGlicmFyaWVzTmFtZXNbcHJlZml4TmFtZV07XG4gICAgICAgICAgICBmb3IodmFyIHYgaW4gbmV3TmFtZXMpe1xuICAgICAgICAgICAgICAgIHNlbGZbdl0gPSAgbmV3TmFtZXNbdl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZm9sZGVyO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgcmVzID0gcHJlZml4ZWRSZXF1aXJlKGZvbGRlcik7IC8vIGEgbGlicmFyeSBpcyBqdXN0IGEgbW9kdWxlXG4gICAgICAgIGlmKHR5cGVvZiByZXMuX19hdXRvZ2VuZXJhdGVkX3ByaXZhdGVza3lfbGlicmFyeU5hbWUgIT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgICAgICB2YXIgc3dhcm1zID0gJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc05hbWVzW3Jlcy5fX2F1dG9nZW5lcmF0ZWRfcHJpdmF0ZXNreV9saWJyYXJ5TmFtZV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgc3dhcm1zID0gJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc05hbWVzW2ZvbGRlcl07XG4gICAgICAgIH1cbiAgICAgICAgICAgIHZhciBleGlzdGluZ05hbWU7XG4gICAgICAgICAgICBmb3IodmFyIHYgaW4gc3dhcm1zKXtcbiAgICAgICAgICAgICAgICBleGlzdGluZ05hbWUgPSBzd2FybXNbdl07XG4gICAgICAgICAgICAgICAgc2VsZlt2XSA9IGV4aXN0aW5nTmFtZTtcbiAgICAgICAgICAgICAgICAkJC5yZWdpc3RlclN3YXJtRGVzY3JpcHRpb24ocHJlZml4TmFtZSx2LCBwcmVmaXhOYW1lICsgXCIuXCIgKyB2LCAgZXhpc3RpbmdOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3cmFwU3dhcm1SZWxhdGVkRnVuY3Rpb25zKHNwYWNlLCBwcmVmaXhOYW1lKXtcbiAgICAgICAgdmFyIHJldCA9IHt9O1xuICAgICAgICB2YXIgbmFtZXMgPSBbXCJjcmVhdGVcIiwgXCJkZXNjcmliZVwiLCBcInN0YXJ0XCIsIFwicmVzdGFydFwiXTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaTxuYW1lcy5sZW5ndGg7IGkrKyApe1xuICAgICAgICAgICAgcmV0W25hbWVzW2ldXSA9IHdyYXBDYWxsKHNwYWNlW25hbWVzW2ldXSwgcHJlZml4TmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG5cbiAgICB0aGlzLmNhbGxmbG93cyAgICAgICAgPSB0aGlzLmNhbGxmbG93ICAgPSB3cmFwU3dhcm1SZWxhdGVkRnVuY3Rpb25zKCQkLmNhbGxmbG93cywgcHJlZml4TmFtZSk7XG4gICAgdGhpcy5zd2FybXMgICAgICAgICAgID0gdGhpcy5zd2FybSAgICAgID0gd3JhcFN3YXJtUmVsYXRlZEZ1bmN0aW9ucygkJC5zd2FybXMsIHByZWZpeE5hbWUpO1xuICAgIHRoaXMuY29udHJhY3RzICAgICAgICA9IHRoaXMuY29udHJhY3QgICA9IHdyYXBTd2FybVJlbGF0ZWRGdW5jdGlvbnMoJCQuY29udHJhY3RzLCBwcmVmaXhOYW1lKTtcbiAgICBpbmNsdWRlQWxsSW5Sb290KGZvbGRlciwgcHJlZml4TmFtZSk7XG59XG5cbmV4cG9ydHMubG9hZExpYnJhcnkgPSBmdW5jdGlvbihwcmVmaXhOYW1lLCBmb2xkZXIpe1xuICAgIHZhciBleGlzdGluZyA9ICQkLmxpYnJhcmllc1twcmVmaXhOYW1lXTtcbiAgICBpZihleGlzdGluZyApe1xuICAgICAgICBpZighKGV4aXN0aW5nIGluc3RhbmNlb2YgU3dhcm1MaWJyYXJ5KSl7XG4gICAgICAgICAgICB2YXIgc0wgPSBuZXcgU3dhcm1MaWJyYXJ5KHByZWZpeE5hbWUsIGZvbGRlcik7XG4gICAgICAgICAgICBmb3IodmFyIHByb3AgaW4gZXhpc3Rpbmcpe1xuICAgICAgICAgICAgICAgIHNMW3Byb3BdID0gZXhpc3RpbmdbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc0w7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZm9sZGVyKSB7XG4gICAgICAgICAgICAkJC5lcnJvckhhbmRsZXIud2FybmluZyhcIlJldXNpbmcgYWxyZWFkeSBsb2FkZWQgbGlicmFyeSBcIiArIHByZWZpeE5hbWUgKyBcImNvdWxkIGJlIGFuIGVycm9yIVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuICAgIC8vdmFyIGFic29sdXRlUGF0aCA9IHBhdGgucmVzb2x2ZShmb2xkZXIpO1xuICAgIHJldHVybiBuZXcgU3dhcm1MaWJyYXJ5KHByZWZpeE5hbWUsIGZvbGRlcik7XG59XG5cbiIsIi8qXG4gcmVxdWlyZSBhbmQgJCQucmVxdWlyZSBhcmUgb3ZlcndyaXRpbmcgdGhlIG5vZGUuanMgZGVmYXVsdHMgaW4gbG9hZGluZyBtb2R1bGVzIGZvciBpbmNyZWFzaW5nIHNlY3VyaXR5LHNwZWVkIGFuZCBtYWtpbmcgaXQgd29yayB0byB0aGUgcHJpdmF0ZXNreSBydW50aW1lIGJ1aWxkIHdpdGggYnJvd3NlcmlmeS5cbiBUaGUgcHJpdmF0ZXNreSBjb2RlIGZvciBkb21haW5zIHNob3VsZCB3b3JrIGluIG5vZGUgYW5kIGJyb3dzZXJzLlxuICovXG5cblxuaWYgKHR5cGVvZih3aW5kb3cpICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZ2xvYmFsID0gd2luZG93O1xufVxuXG5cbmlmICh0eXBlb2YoZ2xvYmFsLiQkKSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgZ2xvYmFsLiQkID0ge307XG4gICAgJCQuX19nbG9iYWwgPSB7fTtcbn1cblxuaWYgKHR5cGVvZigkJC5fX2dsb2JhbCkgPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICQkLl9fZ2xvYmFsID0ge307XG59XG5cbmlmICh0eXBlb2YoJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc05hbWVzKSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgJCQuX19nbG9iYWwuY3VycmVudExpYnJhcnlOYW1lID0gbnVsbDtcbiAgICAkJC5fX2dsb2JhbC5yZXF1aXJlTGlicmFyaWVzTmFtZXMgPSB7fTtcbn1cblxuXG5pZiAodHlwZW9mKCQkLl9fcnVudGltZU1vZHVsZXMpID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAkJC5fX3J1bnRpbWVNb2R1bGVzID0ge307XG59XG5cbnJlcXVpcmUoXCIuLy4uL3N0YW5kYXJkR2xvYmFsU3ltYm9sc1wiKTtcblxuaWYgKHR5cGVvZihnbG9iYWwuZnVuY3Rpb25VbmRlZmluZWQpID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBnbG9iYWwuZnVuY3Rpb25VbmRlZmluZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQ2FsbGVkIG9mIGFuIHVuZGVmaW5lZCBmdW5jdGlvbiEhISFcIik7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbGxlZCBvZiBhbiB1bmRlZmluZWQgZnVuY3Rpb25cIik7XG4gICAgfTtcbiAgICBpZiAodHlwZW9mKGdsb2JhbC53ZWJzaGltc1JlcXVpcmUpID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgZ2xvYmFsLndlYnNoaW1zUmVxdWlyZSA9IGdsb2JhbC5mdW5jdGlvblVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mKGdsb2JhbC5kb21haW5SZXF1aXJlKSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGdsb2JhbC5kb21haW5SZXF1aXJlID0gZ2xvYmFsLmZ1bmN0aW9uVW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YoZ2xvYmFsLnBza3J1bnRpbWVSZXF1aXJlKSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGdsb2JhbC5wc2tydW50aW1lUmVxdWlyZSA9IGdsb2JhbC5mdW5jdGlvblVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmNvbnN0IHdlQXJlSW5icm93c2VyID0gKHR5cGVvZiAoJCQuYnJvd3NlclJ1bnRpbWUpICE9IFwidW5kZWZpbmVkXCIpO1xuY29uc3Qgd2VBcmVJblNhbmRib3ggPSAodHlwZW9mIGdsb2JhbC5yZXF1aXJlICE9PSAndW5kZWZpbmVkJyk7XG5cblxuY29uc3QgcGFzdFJlcXVlc3RzID0ge307XG5cbmZ1bmN0aW9uIHByZXZlbnRSZWN1cnNpdmVSZXF1aXJlKHJlcXVlc3QpIHtcbiAgICBpZiAocGFzdFJlcXVlc3RzW3JlcXVlc3RdKSB7XG4gICAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcihcIlByZXZlbnRpbmcgcmVjdXJzaXZlIHJlcXVpcmUgZm9yIFwiICsgcmVxdWVzdCk7XG4gICAgICAgIGVyci50eXBlID0gXCJQU0tJZ25vcmFibGVFcnJvclwiO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIGRpc2FibGVSZXF1aXJlKHJlcXVlc3QpIHtcbiAgICBwYXN0UmVxdWVzdHNbcmVxdWVzdF0gPSB0cnVlO1xufVxuXG5mdW5jdGlvbiBlbmFibGVSZXF1aXJlKHJlcXVlc3QpIHtcbiAgICBwYXN0UmVxdWVzdHNbcmVxdWVzdF0gPSBmYWxzZTtcbn1cblxuXG5mdW5jdGlvbiByZXF1aXJlRnJvbUNhY2hlKHJlcXVlc3QpIHtcbiAgICBjb25zdCBleGlzdGluZ01vZHVsZSA9ICQkLl9fcnVudGltZU1vZHVsZXNbcmVxdWVzdF07XG4gICAgcmV0dXJuIGV4aXN0aW5nTW9kdWxlO1xufVxuXG5mdW5jdGlvbiB3cmFwU3RlcChjYWxsYmFja05hbWUpIHtcbiAgICBjb25zdCBjYWxsYmFjayA9IGdsb2JhbFtjYWxsYmFja05hbWVdO1xuXG4gICAgaWYgKGNhbGxiYWNrID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrID09PSBnbG9iYWwuZnVuY3Rpb25VbmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKHJlcXVlc3QpO1xuICAgICAgICAkJC5fX3J1bnRpbWVNb2R1bGVzW3JlcXVlc3RdID0gcmVzdWx0O1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdHJ5UmVxdWlyZVNlcXVlbmNlKG9yaWdpbmFsUmVxdWlyZSwgcmVxdWVzdCkge1xuICAgIGxldCBhcnI7XG4gICAgaWYgKG9yaWdpbmFsUmVxdWlyZSkge1xuICAgICAgICBhcnIgPSAkJC5fX3JlcXVpcmVGdW5jdGlvbnNDaGFpbi5zbGljZSgpO1xuICAgICAgICBhcnIucHVzaChvcmlnaW5hbFJlcXVpcmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFyciA9ICQkLl9fcmVxdWlyZUZ1bmN0aW9uc0NoYWluO1xuICAgIH1cblxuICAgIHByZXZlbnRSZWN1cnNpdmVSZXF1aXJlKHJlcXVlc3QpO1xuICAgIGRpc2FibGVSZXF1aXJlKHJlcXVlc3QpO1xuICAgIGxldCByZXN1bHQ7XG4gICAgY29uc3QgcHJldmlvdXNSZXF1aXJlID0gJCQuX19nbG9iYWwuY3VycmVudExpYnJhcnlOYW1lO1xuICAgIGxldCBwcmV2aW91c1JlcXVpcmVDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICBpZiAoIXByZXZpb3VzUmVxdWlyZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkxvYWRpbmcgbGlicmFyeSBmb3IgcmVxdWlyZVwiLCByZXF1ZXN0KTtcbiAgICAgICAgJCQuX19nbG9iYWwuY3VycmVudExpYnJhcnlOYW1lID0gcmVxdWVzdDtcblxuICAgICAgICBpZiAodHlwZW9mICQkLl9fZ2xvYmFsLnJlcXVpcmVMaWJyYXJpZXNOYW1lc1tyZXF1ZXN0XSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAkJC5fX2dsb2JhbC5yZXF1aXJlTGlicmFyaWVzTmFtZXNbcmVxdWVzdF0gPSB7fTtcbiAgICAgICAgICAgIC8vJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc0Rlc2NyaXB0aW9uc1tyZXF1ZXN0XSAgID0ge307XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlvdXNSZXF1aXJlQ2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGZ1bmMgPSBhcnJbaV07XG4gICAgICAgIHRyeSB7XG5cbiAgICAgICAgICAgIGlmIChmdW5jID09PSBnbG9iYWwuZnVuY3Rpb25VbmRlZmluZWQpIGNvbnRpbnVlO1xuICAgICAgICAgICAgcmVzdWx0ID0gZnVuYyhyZXF1ZXN0KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKGVyci50eXBlICE9PSBcIlBTS0lnbm9yYWJsZUVycm9yXCIpIHtcbiAgICAgICAgICAgICAgICAkJC5sb2coXCJSZXF1aXJlIGVuY291bnRlcmVkIGFuIGVycm9yIHdoaWxlIGxvYWRpbmcgXCIsIHJlcXVlc3QsIFwiXFxuQ2F1c2U6XFxuXCIsIGVyci5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXJlc3VsdCkge1xuICAgICAgICAkJC5sb2coXCJGYWlsZWQgdG8gbG9hZCBtb2R1bGUgXCIsIHJlcXVlc3QsIHJlc3VsdCk7XG4gICAgfVxuXG4gICAgZW5hYmxlUmVxdWlyZShyZXF1ZXN0KTtcbiAgICBpZiAocHJldmlvdXNSZXF1aXJlQ2hhbmdlZCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiRW5kIGxvYWRpbmcgbGlicmFyeSBmb3IgcmVxdWlyZVwiLCByZXF1ZXN0LCAkJC5fX2dsb2JhbC5yZXF1aXJlTGlicmFyaWVzTmFtZXNbcmVxdWVzdF0pO1xuICAgICAgICAkJC5fX2dsb2JhbC5jdXJyZW50TGlicmFyeU5hbWUgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5pZiAodHlwZW9mKCQkLnJlcXVpcmUpID09IFwidW5kZWZpbmVkXCIpIHtcblxuICAgICQkLl9fcmVxdWlyZUxpc3QgPSBbXCJ3ZWJzaGltc1JlcXVpcmVcIiwgXCJwc2tydW50aW1lUmVxdWlyZVwiXTtcbiAgICAkJC5fX3JlcXVpcmVGdW5jdGlvbnNDaGFpbiA9IFtdO1xuXG4gICAgJCQucmVxdWlyZUJ1bmRsZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIG5hbWUgKz0gXCJSZXF1aXJlXCI7XG4gICAgICAgICQkLl9fcmVxdWlyZUxpc3QucHVzaChuYW1lKTtcbiAgICAgICAgY29uc3QgYXJyID0gW3JlcXVpcmVGcm9tQ2FjaGVdO1xuICAgICAgICAkJC5fX3JlcXVpcmVMaXN0LmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gd3JhcFN0ZXAoaXRlbSk7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBhcnIucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgICQkLl9fcmVxdWlyZUZ1bmN0aW9uc0NoYWluID0gYXJyO1xuICAgIH07XG5cbiAgICAkJC5yZXF1aXJlQnVuZGxlKFwiaW5pdFwiKTtcblxuICAgIGlmICh3ZUFyZUluYnJvd3Nlcikge1xuICAgICAgICAkJC5sb2coXCJEZWZpbmluZyBnbG9iYWwgcmVxdWlyZSBpbiBicm93c2VyXCIpO1xuXG5cbiAgICAgICAgZ2xvYmFsLnJlcXVpcmUgPSBmdW5jdGlvbiAocmVxdWVzdCkge1xuXG4gICAgICAgICAgICAvLy8qW3JlcXVpcmVGcm9tQ2FjaGUsIHdyYXBTdGVwKHdlYnNoaW1zUmVxdWlyZSksICwgd3JhcFN0ZXAocHNrcnVudGltZVJlcXVpcmUpLCB3cmFwU3RlcChkb21haW5SZXF1aXJlKSpdXG4gICAgICAgICAgICByZXR1cm4gdHJ5UmVxdWlyZVNlcXVlbmNlKG51bGwsIHJlcXVlc3QpO1xuICAgICAgICB9XG4gICAgfSBlbHNlXG4gICAgICAgIGlmICh3ZUFyZUluU2FuZGJveCkge1xuICAgICAgICAvLyByZXF1aXJlIHNob3VsZCBiZSBwcm92aWRlZCB3aGVuIGNvZGUgaXMgbG9hZGVkIGluIGJyb3dzZXJpZnlcbiAgICAgICAgY29uc3QgYnVuZGxlUmVxdWlyZSA9IHJlcXVpcmU7XG5cbiAgICAgICAgJCQucmVxdWlyZUJ1bmRsZSgnc2FuZGJveEJhc2UnKTtcbiAgICAgICAgLy8gdGhpcyBzaG91bGQgYmUgc2V0IHVwIGJ5IHNhbmRib3ggcHJpb3IgdG9cbiAgICAgICAgY29uc3Qgc2FuZGJveFJlcXVpcmUgPSBnbG9iYWwucmVxdWlyZTtcbiAgICAgICAgZ2xvYmFsLmNyeXB0byA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuXG4gICAgICAgIGZ1bmN0aW9uIG5ld0xvYWRlcihyZXF1ZXN0KSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm5ld0xvYWRlcjpcIiwgcmVxdWVzdCk7XG4gICAgICAgICAgICAvL3ByZXZlbnRSZWN1cnNpdmVSZXF1aXJlKHJlcXVlc3QpO1xuICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCd0cnlpbmcgdG8gbG9hZCAnLCByZXF1ZXN0KTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gdHJ5QnVuZGxlUmVxdWlyZSguLi5hcmdzKSB7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gJCQuX19vcmlnaW5hbFJlcXVpcmUuYXBwbHkoc2VsZixhcmdzKTtcbiAgICAgICAgICAgICAgICAvL3JldHVybiBNb2R1bGUuX2xvYWQuYXBwbHkoc2VsZixhcmdzKVxuICAgICAgICAgICAgICAgIGxldCByZXM7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gc2FuZGJveFJlcXVpcmUuYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIuY29kZSA9PT0gXCJNT0RVTEVfTk9UX0ZPVU5EXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHAgPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgcmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSBzYW5kYm94UmVxdWlyZS5hcHBseShzZWxmLCBbcF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdCA9IHA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHJlcztcblxuXG4gICAgICAgICAgICByZXMgPSB0cnlSZXF1aXJlU2VxdWVuY2UodHJ5QnVuZGxlUmVxdWlyZSwgcmVxdWVzdCk7XG5cblxuICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGdsb2JhbC5yZXF1aXJlID0gbmV3TG9hZGVyO1xuXG4gICAgfSBlbHNlIHsgIC8vd2UgYXJlIGluIG5vZGVcbiAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuICAgICAgICAkJC5fX3J1bnRpbWVNb2R1bGVzW1wiY3J5cHRvXCJdID0gcmVxdWlyZShcImNyeXB0b1wiKTtcbiAgICAgICAgJCQuX19ydW50aW1lTW9kdWxlc1tcInV0aWxcIl0gPSByZXF1aXJlKFwidXRpbFwiKTtcblxuICAgICAgICBjb25zdCBNb2R1bGUgPSByZXF1aXJlKCdtb2R1bGUnKTtcbiAgICAgICAgJCQuX19ydW50aW1lTW9kdWxlc1tcIm1vZHVsZVwiXSA9IE1vZHVsZTtcblxuICAgICAgICAkJC5sb2coXCJSZWRlZmluaW5nIHJlcXVpcmUgZm9yIG5vZGVcIik7XG5cbiAgICAgICAgJCQuX19vcmlnaW5hbFJlcXVpcmUgPSBNb2R1bGUuX2xvYWQ7XG4gICAgICAgIGNvbnN0IG1vZHVsZU9yaWdpbmFsUmVxdWlyZSA9IE1vZHVsZS5wcm90b3R5cGUucmVxdWlyZTtcblxuICAgICAgICBmdW5jdGlvbiBuZXdMb2FkZXIocmVxdWVzdCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJuZXdMb2FkZXI6XCIsIHJlcXVlc3QpO1xuICAgICAgICAgICAgLy9wcmV2ZW50UmVjdXJzaXZlUmVxdWlyZShyZXF1ZXN0KTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBvcmlnaW5hbFJlcXVpcmUoLi4uYXJncykge1xuICAgICAgICAgICAgICAgIC8vcmV0dXJuICQkLl9fb3JpZ2luYWxSZXF1aXJlLmFwcGx5KHNlbGYsYXJncyk7XG4gICAgICAgICAgICAgICAgLy9yZXR1cm4gTW9kdWxlLl9sb2FkLmFwcGx5KHNlbGYsYXJncylcbiAgICAgICAgICAgICAgICBsZXQgcmVzO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IG1vZHVsZU9yaWdpbmFsUmVxdWlyZS5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSBcIk1PRFVMRV9OT1RfRk9VTkRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCByZXF1ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IG1vZHVsZU9yaWdpbmFsUmVxdWlyZS5hcHBseShzZWxmLCBbcF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdCA9IHA7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY3VycmVudEZvbGRlclJlcXVpcmUocmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1tyZXF1aXJlRnJvbUNhY2hlLCB3cmFwU3RlcChwc2tydW50aW1lUmVxdWlyZSksIHdyYXBTdGVwKGRvbWFpblJlcXVpcmUpLCBvcmlnaW5hbFJlcXVpcmVdXG4gICAgICAgICAgICByZXR1cm4gdHJ5UmVxdWlyZVNlcXVlbmNlKG9yaWdpbmFsUmVxdWlyZSwgcmVxdWVzdCk7XG4gICAgICAgIH1cblxuICAgICAgICBNb2R1bGUucHJvdG90eXBlLnJlcXVpcmUgPSBuZXdMb2FkZXI7XG4gICAgfVxuXG4gICAgJCQucmVxdWlyZSA9IHJlcXVpcmU7XG59XG4iLCJcbnZhciBqb2luQ291bnRlciA9IDA7XG5cbmZ1bmN0aW9uIFBhcmFsbGVsSm9pblBvaW50KHN3YXJtLCBjYWxsYmFjaywgYXJncyl7XG4gICAgam9pbkNvdW50ZXIrKztcbiAgICB2YXIgY2hhbm5lbElkID0gXCJQYXJhbGxlbEpvaW5Qb2ludFwiICsgam9pbkNvdW50ZXI7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB2YXIgc3RvcE90aGVyRXhlY3V0aW9uICAgICA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gZXhlY3V0aW9uU3RlcChzdGVwRnVuYywgbG9jYWxBcmdzLCBzdG9wKXtcblxuICAgICAgICB0aGlzLmRvRXhlY3V0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZihzdG9wT3RoZXJFeGVjdXRpb24pe1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBzdGVwRnVuYy5hcHBseShzd2FybSwgbG9jYWxBcmdzKTtcbiAgICAgICAgICAgICAgICBpZihzdG9wKXtcbiAgICAgICAgICAgICAgICAgICAgc3RvcE90aGVyRXhlY3V0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgLy9ldmVyeXRpbmcgaXMgZmluZVxuICAgICAgICAgICAgfSBjYXRjaChlcnIpe1xuICAgICAgICAgICAgICAgIGFyZ3MudW5zaGlmdChlcnIpO1xuICAgICAgICAgICAgICAgIHNlbmRGb3JTb3VuZEV4ZWN1dGlvbihjYWxsYmFjaywgYXJncywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAvL3N0b3AgaXQsIGRvIG5vdCBjYWxsIGFnYWluIGFueXRoaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG4gICAgICAgICQkLmVycm9ySGFuZGxlci5zeW50YXhFcnJvcihcImludmFsaWQgam9pblwiLHN3YXJtLCBcImludmFsaWQgZnVuY3Rpb24gYXQgam9pbiBpbiBzd2FybVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICQkLlBTS19QdWJTdWIuc3Vic2NyaWJlKGNoYW5uZWxJZCxmdW5jdGlvbihmb3JFeGVjdXRpb24pe1xuICAgICAgICBpZihzdG9wT3RoZXJFeGVjdXRpb24pe1xuICAgICAgICAgICAgcmV0dXJuIDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIGlmKGZvckV4ZWN1dGlvbi5kb0V4ZWN1dGUoKSl7XG4gICAgICAgICAgICAgICAgZGVjQ291bnRlcigpO1xuICAgICAgICAgICAgfSAvLyBoYWQgYW4gZXJyb3IuLi5cbiAgICAgICAgfSBjYXRjaChlcnIpe1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgLy8kJC5lcnJvckhhbmRsZXIuc3ludGF4RXJyb3IoXCJfX2ludGVybmFsX19cIixzd2FybSwgXCJleGNlcHRpb24gaW4gdGhlIGV4ZWN1dGlvbiBvZiB0aGUgam9pbiBmdW5jdGlvbiBvZiBhIHBhcmFsbGVsIHRhc2tcIik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGluY0NvdW50ZXIoKXtcbiAgICAgICAgaWYodGVzdElmVW5kZXJJbnNwZWN0aW9uKCkpe1xuICAgICAgICAgICAgLy9wcmV2ZW50aW5nIGluc3BlY3RvciBmcm9tIGluY3JlYXNpbmcgY291bnRlciB3aGVuIHJlYWRpbmcgdGhlIHZhbHVlcyBmb3IgZGVidWcgcmVhc29uXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwicHJldmVudGluZyBpbnNwZWN0aW9uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvdW50ZXIrKztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZXN0SWZVbmRlckluc3BlY3Rpb24oKXtcbiAgICAgICAgdmFyIHJlcyA9IGZhbHNlO1xuICAgICAgICB2YXIgY29uc3RBcmd2ID0gcHJvY2Vzcy5leGVjQXJndi5qb2luKCk7XG4gICAgICAgIGlmKGNvbnN0QXJndi5pbmRleE9mKFwiaW5zcGVjdFwiKSE9PS0xIHx8IGNvbnN0QXJndi5pbmRleE9mKFwiZGVidWdcIikhPT0tMSl7XG4gICAgICAgICAgICAvL29ubHkgd2hlbiBydW5uaW5nIGluIGRlYnVnXG4gICAgICAgICAgICB2YXIgY2FsbHN0YWNrID0gbmV3IEVycm9yKCkuc3RhY2s7XG4gICAgICAgICAgICBpZihjYWxsc3RhY2suaW5kZXhPZihcIkRlYnVnQ29tbWFuZFByb2Nlc3NvclwiKSE9PS0xKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRlYnVnQ29tbWFuZFByb2Nlc3NvciBkZXRlY3RlZCFcIik7XG4gICAgICAgICAgICAgICAgcmVzID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlbmRGb3JTb3VuZEV4ZWN1dGlvbihmdW5jdCwgYXJncywgc3RvcCl7XG4gICAgICAgIHZhciBvYmogPSBuZXcgZXhlY3V0aW9uU3RlcChmdW5jdCwgYXJncywgc3RvcCk7XG4gICAgICAgICQkLlBTS19QdWJTdWIucHVibGlzaChjaGFubmVsSWQsIG9iaik7IC8vIGZvcmNlIGV4ZWN1dGlvbiB0byBiZSBcInNvdW5kXCJcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZWNDb3VudGVyKCl7XG4gICAgICAgIGNvdW50ZXItLTtcbiAgICAgICAgaWYoY291bnRlciA9PSAwKSB7XG4gICAgICAgICAgICBhcmdzLnVuc2hpZnQobnVsbCk7XG4gICAgICAgICAgICBzZW5kRm9yU291bmRFeGVjdXRpb24oY2FsbGJhY2ssIGFyZ3MsIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBpbm5lciA9IHN3YXJtLmdldElubmVyVmFsdWUoKTtcblxuICAgIGZ1bmN0aW9uIGRlZmF1bHRQcm9ncmVzc1JlcG9ydChlcnIsIHJlcyl7XG4gICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OlwiUGFyYWxsZWwgZXhlY3V0aW9uIHByb2dyZXNzIGV2ZW50XCIsXG4gICAgICAgICAgICBzd2FybTpzd2FybSxcbiAgICAgICAgICAgIGFyZ3M6YXJncyxcbiAgICAgICAgICAgIGN1cnJlbnRSZXN1bHQ6cmVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWtGdW5jdGlvbihuYW1lKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKC4uLmFyZ3Mpe1xuICAgICAgICAgICAgdmFyIGYgPSBkZWZhdWx0UHJvZ3Jlc3NSZXBvcnQ7XG4gICAgICAgICAgICBpZihuYW1lICE9IFwicHJvZ3Jlc3NcIil7XG4gICAgICAgICAgICAgICAgZiA9IGlubmVyLm15RnVuY3Rpb25zW25hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFyZ3MgPSAkJC5fX2ludGVybi5ta0FyZ3MoYXJncywgMCk7XG4gICAgICAgICAgICBzZW5kRm9yU291bmRFeGVjdXRpb24oZiwgYXJncywgZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuIF9fcHJveHlPYmplY3Q7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24odGFyZ2V0LCBwcm9wLCByZWNlaXZlcil7XG4gICAgICAgIGlmKGlubmVyLm15RnVuY3Rpb25zLmhhc093blByb3BlcnR5KHByb3ApIHx8IHByb3AgPT0gXCJwcm9ncmVzc1wiKXtcbiAgICAgICAgICAgIGluY0NvdW50ZXIoKTtcbiAgICAgICAgICAgIHJldHVybiBta0Z1bmN0aW9uKHByb3ApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzd2FybVtwcm9wXTtcbiAgICB9O1xuXG4gICAgdmFyIF9fcHJveHlPYmplY3Q7XG5cbiAgICB0aGlzLl9fc2V0UHJveHlPYmplY3QgPSBmdW5jdGlvbihwKXtcbiAgICAgICAgX19wcm94eU9iamVjdCA9IHA7XG4gICAgfVxufVxuXG5leHBvcnRzLmNyZWF0ZUpvaW5Qb2ludCA9IGZ1bmN0aW9uKHN3YXJtLCBjYWxsYmFjaywgYXJncyl7XG4gICAgdmFyIGpwID0gbmV3IFBhcmFsbGVsSm9pblBvaW50KHN3YXJtLCBjYWxsYmFjaywgYXJncyk7XG4gICAgdmFyIGlubmVyID0gc3dhcm0uZ2V0SW5uZXJWYWx1ZSgpO1xuICAgIHZhciBwID0gbmV3IFByb3h5KGlubmVyLCBqcCk7XG4gICAganAuX19zZXRQcm94eU9iamVjdChwKTtcbiAgICByZXR1cm4gcDtcbn07IiwiXG52YXIgam9pbkNvdW50ZXIgPSAwO1xuXG5mdW5jdGlvbiBTZXJpYWxKb2luUG9pbnQoc3dhcm0sIGNhbGxiYWNrLCBhcmdzKXtcblxuICAgIGpvaW5Db3VudGVyKys7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGNoYW5uZWxJZCA9IFwiU2VyaWFsSm9pblBvaW50XCIgKyBqb2luQ291bnRlcjtcblxuICAgIGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgICAgJCQuZXJyb3JIYW5kbGVyLnN5bnRheEVycm9yKFwidW5rbm93blwiLCBzd2FybSwgXCJpbnZhbGlkIGZ1bmN0aW9uIGdpdmVuIHRvIHNlcmlhbCBpbiBzd2FybVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBpbm5lciA9IHN3YXJtLmdldElubmVyVmFsdWUoKTtcblxuXG4gICAgZnVuY3Rpb24gZGVmYXVsdFByb2dyZXNzUmVwb3J0KGVyciwgcmVzKXtcbiAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cblxuICAgIHZhciBmdW5jdGlvbkNvdW50ZXIgICAgID0gMDtcbiAgICB2YXIgZXhlY3V0aW9uQ291bnRlciAgICA9IDA7XG5cbiAgICB2YXIgcGxhbm5lZEV4ZWN1dGlvbnMgICA9IFtdO1xuICAgIHZhciBwbGFubmVkQXJndW1lbnRzICAgID0ge307XG5cbiAgICBmdW5jdGlvbiBta0Z1bmN0aW9uKG5hbWUsIHBvcyl7XG4gICAgICAgIC8vY29uc29sZS5sb2coXCJDcmVhdGluZyBmdW5jdGlvbiBcIiwgbmFtZSwgcG9zKTtcbiAgICAgICAgcGxhbm5lZEFyZ3VtZW50c1twb3NdID0gdW5kZWZpbmVkO1xuXG4gICAgICAgIGZ1bmN0aW9uIHRyaWdnZXROZXh0U3RlcCgpe1xuICAgICAgICAgICAgaWYocGxhbm5lZEV4ZWN1dGlvbnMubGVuZ3RoID09IGV4ZWN1dGlvbkNvdW50ZXIgfHwgcGxhbm5lZEFyZ3VtZW50c1tleGVjdXRpb25Db3VudGVyXSApICB7XG4gICAgICAgICAgICAgICAgJCQuUFNLX1B1YlN1Yi5wdWJsaXNoKGNoYW5uZWxJZCwgc2VsZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uICguLi5hcmdzKXtcbiAgICAgICAgICAgIGlmKGV4ZWN1dGlvbkNvdW50ZXIgIT0gcG9zKSB7XG4gICAgICAgICAgICAgICAgcGxhbm5lZEFyZ3VtZW50c1twb3NdID0gYXJncztcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiRGVsYXlpbmcgZnVuY3Rpb246XCIsIGV4ZWN1dGlvbkNvdW50ZXIsIHBvcywgcGxhbm5lZEFyZ3VtZW50cywgYXJndW1lbnRzLCBmdW5jdGlvbkNvdW50ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBfX3Byb3h5O1xuICAgICAgICAgICAgfSBlbHNle1xuICAgICAgICAgICAgICAgIGlmKHBsYW5uZWRBcmd1bWVudHNbcG9zXSl7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJFeGVjdXRpbmcgIGZ1bmN0aW9uOlwiLCBleGVjdXRpb25Db3VudGVyLCBwb3MsIHBsYW5uZWRBcmd1bWVudHMsIGFyZ3VtZW50cywgZnVuY3Rpb25Db3VudGVyKTtcblx0XHRcdFx0XHRhcmdzID0gcGxhbm5lZEFyZ3VtZW50c1twb3NdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYW5uZWRBcmd1bWVudHNbcG9zXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXROZXh0U3RlcCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX19wcm94eTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBmID0gZGVmYXVsdFByb2dyZXNzUmVwb3J0O1xuICAgICAgICAgICAgaWYobmFtZSAhPSBcInByb2dyZXNzXCIpe1xuICAgICAgICAgICAgICAgIGYgPSBpbm5lci5teUZ1bmN0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgZi5hcHBseShzZWxmLGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaChlcnIpe1xuICAgICAgICAgICAgICAgICAgICBhcmdzLnVuc2hpZnQoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkoc3dhcm0sYXJncyk7IC8vZXJyb3JcbiAgICAgICAgICAgICAgICAgICAgJCQuUFNLX1B1YlN1Yi51bnN1YnNjcmliZShjaGFubmVsSWQscnVuTmV4dEZ1bmN0aW9uKTtcbiAgICAgICAgICAgICAgICByZXR1cm47IC8vdGVybWluYXRlIGV4ZWN1dGlvbiB3aXRoIGFuIGVycm9yLi4uIVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhlY3V0aW9uQ291bnRlcisrO1xuXG4gICAgICAgICAgICB0cmlnZ2V0TmV4dFN0ZXAoKTtcblxuICAgICAgICAgICAgcmV0dXJuIF9fcHJveHk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcGxhbm5lZEV4ZWN1dGlvbnMucHVzaChmKTtcbiAgICAgICAgZnVuY3Rpb25Db3VudGVyKys7XG4gICAgICAgIHJldHVybiBmO1xuICAgIH1cblxuICAgICB2YXIgZmluaXNoZWQgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIHJ1bk5leHRGdW5jdGlvbigpe1xuICAgICAgICBpZihleGVjdXRpb25Db3VudGVyID09IHBsYW5uZWRFeGVjdXRpb25zLmxlbmd0aCApe1xuICAgICAgICAgICAgaWYoIWZpbmlzaGVkKXtcbiAgICAgICAgICAgICAgICBhcmdzLnVuc2hpZnQobnVsbCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkoc3dhcm0sYXJncyk7XG4gICAgICAgICAgICAgICAgZmluaXNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICQkLlBTS19QdWJTdWIudW5zdWJzY3JpYmUoY2hhbm5lbElkLHJ1bk5leHRGdW5jdGlvbik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwic2VyaWFsIGNvbnN0cnVjdCBpcyB1c2luZyBmdW5jdGlvbnMgdGhhdCBhcmUgY2FsbGVkIG11bHRpcGxlIHRpbWVzLi4uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGxhbm5lZEV4ZWN1dGlvbnNbZXhlY3V0aW9uQ291bnRlcl0oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQkLlBTS19QdWJTdWIuc3Vic2NyaWJlKGNoYW5uZWxJZCxydW5OZXh0RnVuY3Rpb24pOyAvLyBmb3JjZSBpdCB0byBiZSBcInNvdW5kXCJcblxuXG4gICAgdGhpcy5nZXQgPSBmdW5jdGlvbih0YXJnZXQsIHByb3AsIHJlY2VpdmVyKXtcbiAgICAgICAgaWYocHJvcCA9PSBcInByb2dyZXNzXCIgfHwgaW5uZXIubXlGdW5jdGlvbnMuaGFzT3duUHJvcGVydHkocHJvcCkpe1xuICAgICAgICAgICAgcmV0dXJuIG1rRnVuY3Rpb24ocHJvcCwgZnVuY3Rpb25Db3VudGVyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3dhcm1bcHJvcF07XG4gICAgfVxuXG4gICAgdmFyIF9fcHJveHk7XG4gICAgdGhpcy5zZXRQcm94eU9iamVjdCA9IGZ1bmN0aW9uKHApe1xuICAgICAgICBfX3Byb3h5ID0gcDtcbiAgICB9XG59XG5cbmV4cG9ydHMuY3JlYXRlU2VyaWFsSm9pblBvaW50ID0gZnVuY3Rpb24oc3dhcm0sIGNhbGxiYWNrLCBhcmdzKXtcbiAgICB2YXIganAgPSBuZXcgU2VyaWFsSm9pblBvaW50KHN3YXJtLCBjYWxsYmFjaywgYXJncyk7XG4gICAgdmFyIGlubmVyID0gc3dhcm0uZ2V0SW5uZXJWYWx1ZSgpO1xuICAgIHZhciBwID0gbmV3IFByb3h5KGlubmVyLCBqcCk7XG4gICAganAuc2V0UHJveHlPYmplY3QocCk7XG4gICAgcmV0dXJuIHA7XG59IiwiY29uc3QgT3dNID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIikuT3dNO1xuXG52YXIgc3dhcm1EZXNjcmlwdGlvbnNSZWdpc3RyeSA9IHt9O1xuXG5cbiQkLnJlZ2lzdGVyU3dhcm1EZXNjcmlwdGlvbiA9ICBmdW5jdGlvbihsaWJyYXJ5TmFtZSwgc2hvcnROYW1lLCBzd2FybVR5cGVOYW1lLCBkZXNjcmlwdGlvbil7XG4gICAgaWYoISQkLmxpYnJhcmllc1tsaWJyYXJ5TmFtZV0pe1xuICAgICAgICAkJC5saWJyYXJpZXNbbGlicmFyeU5hbWVdID0ge307XG4gICAgfVxuXG4gICAgaWYoISQkLl9fZ2xvYmFsLnJlcXVpcmVMaWJyYXJpZXNOYW1lc1tsaWJyYXJ5TmFtZV0pe1xuICAgICAgICAkJC5fX2dsb2JhbC5yZXF1aXJlTGlicmFyaWVzTmFtZXNbbGlicmFyeU5hbWVdID0ge307XG4gICAgfVxuXG4gICAgJCQubGlicmFyaWVzW2xpYnJhcnlOYW1lXVtzaG9ydE5hbWVdID0gZGVzY3JpcHRpb247XG4gICAgLy9jb25zb2xlLmxvZyhcIlJlZ2lzdGVyaW5nIFwiLCBsaWJyYXJ5TmFtZSxzaG9ydE5hbWUsICQkLl9fZ2xvYmFsLmN1cnJlbnRMaWJyYXJ5TmFtZSk7XG4gICAgaWYoJCQuX19nbG9iYWwuY3VycmVudExpYnJhcnlOYW1lKXtcbiAgICAgICAgJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc05hbWVzWyQkLl9fZ2xvYmFsLmN1cnJlbnRMaWJyYXJ5TmFtZV1bc2hvcnROYW1lXSA9IGxpYnJhcnlOYW1lICsgXCIuXCIgKyBzaG9ydE5hbWU7XG4gICAgfVxuXG4gICAgJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc05hbWVzW2xpYnJhcnlOYW1lXVtzaG9ydE5hbWVdID0gc3dhcm1UeXBlTmFtZTtcblxuICAgIGlmKHR5cGVvZiBkZXNjcmlwdGlvbiA9PSBcInN0cmluZ1wiKXtcbiAgICAgICAgZGVzY3JpcHRpb24gPSBzd2FybURlc2NyaXB0aW9uc1JlZ2lzdHJ5W2Rlc2NyaXB0aW9uXTtcbiAgICB9XG4gICAgc3dhcm1EZXNjcmlwdGlvbnNSZWdpc3RyeVtzd2FybVR5cGVOYW1lXSA9IGRlc2NyaXB0aW9uO1xufVxuXG5cbnZhciBjdXJyZW50TGlicmFyeUNvdW50ZXIgPSAwO1xuJCQubGlicmFyeSA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICBjdXJyZW50TGlicmFyeUNvdW50ZXIrKztcbiAgICB2YXIgcHJldmlvdXNDdXJyZW50TGlicmFyeSA9ICQkLl9fZ2xvYmFsLmN1cnJlbnRMaWJyYXJ5TmFtZTtcbiAgICB2YXIgbGlicmFyeU5hbWUgPSBcIl9fX3ByaXZhdGVza3lfbGlicmFyeVwiK2N1cnJlbnRMaWJyYXJ5Q291bnRlcjtcbiAgICB2YXIgcmV0ID0gJCQuX19nbG9iYWwucmVxdWlyZUxpYnJhcmllc05hbWVzW2xpYnJhcnlOYW1lXSA9IHt9O1xuICAgICQkLl9fZ2xvYmFsLmN1cnJlbnRMaWJyYXJ5TmFtZSA9IGxpYnJhcnlOYW1lO1xuICAgIGNhbGxiYWNrKCk7XG4gICAgJCQuX19nbG9iYWwuY3VycmVudExpYnJhcnlOYW1lID0gcHJldmlvdXNDdXJyZW50TGlicmFyeTtcbiAgICByZXQuX19hdXRvZ2VuZXJhdGVkX3ByaXZhdGVza3lfbGlicmFyeU5hbWUgPSBsaWJyYXJ5TmFtZTtcbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBTd2FybVNwYWNlKHN3YXJtVHlwZSwgdXRpbHMpIHtcblxuICAgIHZhciBiZWVzSGVhbGVyID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIikuYmVlc0hlYWxlcjtcblxuICAgIGZ1bmN0aW9uIGdldEZ1bGxOYW1lKHNob3J0TmFtZSl7XG4gICAgICAgIHZhciBmdWxsTmFtZTtcbiAgICAgICAgaWYoc2hvcnROYW1lICYmIHNob3J0TmFtZS5pbmNsdWRlcyhcIi5cIikpIHtcbiAgICAgICAgICAgIGZ1bGxOYW1lID0gc2hvcnROYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnVsbE5hbWUgPSAkJC5saWJyYXJ5UHJlZml4ICsgXCIuXCIgKyBzaG9ydE5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bGxOYW1lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIFZhckRlc2NyaXB0aW9uKGRlc2Mpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaW5pdDpmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdG9yZTpmdW5jdGlvbihqc29uU3RyaW5nKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b0pzb25TdHJpbmc6ZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gU3dhcm1EZXNjcmlwdGlvbihzd2FybVR5cGVOYW1lLCBkZXNjcmlwdGlvbil7XG5cbiAgICAgICAgc3dhcm1UeXBlTmFtZSA9IGdldEZ1bGxOYW1lKHN3YXJtVHlwZU5hbWUpO1xuXG4gICAgICAgIHZhciBsb2NhbElkID0gMDsgIC8vIHVuaXF1ZSBmb3IgZWFjaCBzd2FybVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVZhcnMoZGVzY3Ipe1xuICAgICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fTtcbiAgICAgICAgICAgIGZvcih2YXIgdiBpbiBkZXNjcil7XG4gICAgICAgICAgICAgICAgbWVtYmVyc1t2XSA9IG5ldyBWYXJEZXNjcmlwdGlvbihkZXNjclt2XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVtYmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU1lbWJlcnMoZGVzY3Ipe1xuICAgICAgICAgICAgdmFyIG1lbWJlcnMgPSB7fTtcbiAgICAgICAgICAgIGZvcih2YXIgdiBpbiBkZXNjcmlwdGlvbil7XG5cbiAgICAgICAgICAgICAgICBpZih2ICE9IFwicHVibGljXCIgJiYgdiAhPSBcInByaXZhdGVcIil7XG4gICAgICAgICAgICAgICAgICAgIG1lbWJlcnNbdl0gPSBkZXNjcmlwdGlvblt2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVtYmVycztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwdWJsaWNWYXJzID0gY3JlYXRlVmFycyhkZXNjcmlwdGlvbi5wdWJsaWMpO1xuICAgICAgICB2YXIgcHJpdmF0ZVZhcnMgPSBjcmVhdGVWYXJzKGRlc2NyaXB0aW9uLnByaXZhdGUpO1xuICAgICAgICB2YXIgbXlGdW5jdGlvbnMgPSBjcmVhdGVNZW1iZXJzKGRlc2NyaXB0aW9uKTtcblxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVQaGFzZSh0aGlzSW5zdGFuY2UsIGZ1bmMsIHBoYXNlTmFtZSl7XG4gICAgICAgICAgICB2YXIga2V5QmVmb3JlID0gYCR7c3dhcm1UeXBlTmFtZX0vJHtwaGFzZU5hbWV9LyR7JCQuQ09OU1RBTlRTLkJFRk9SRV9JTlRFUkNFUFRPUn1gO1xuICAgICAgICAgICAgdmFyIGtleUFmdGVyID0gYCR7c3dhcm1UeXBlTmFtZX0vJHtwaGFzZU5hbWV9LyR7JCQuQ09OU1RBTlRTLkFGVEVSX0lOVEVSQ0VQVE9SfWA7XG5cbiAgICAgICAgICAgIHZhciBwaGFzZSA9IGZ1bmN0aW9uKC4uLmFyZ3Mpe1xuICAgICAgICAgICAgICAgIHZhciByZXQ7XG4gICAgICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgICAgICAkJC5QU0tfUHViU3ViLmJsb2NrQ2FsbEJhY2tzKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNJbnN0YW5jZS5zZXRNZXRhZGF0YSgncGhhc2VOYW1lJywgcGhhc2VOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgJCQuaW50ZXJjZXB0b3IuY2FsbEludGVyY2VwdG9ycyhrZXlCZWZvcmUsIHRoaXNJbnN0YW5jZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIHJldCA9IGZ1bmMuYXBwbHkodGhpc0luc3RhbmNlLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgJCQuaW50ZXJjZXB0b3IuY2FsbEludGVyY2VwdG9ycyhrZXlBZnRlciwgdGhpc0luc3RhbmNlLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgJCQuUFNLX1B1YlN1Yi5yZWxlYXNlQ2FsbEJhY2tzKCk7XG4gICAgICAgICAgICAgICAgfWNhdGNoKGVycil7XG4gICAgICAgICAgICAgICAgICAgICQkLlBTS19QdWJTdWIucmVsZWFzZUNhbGxCYWNrcygpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvL2R5bmFtaWMgbmFtZWQgZnVuYyBpbiBvcmRlciB0byBpbXByb3ZlIGNhbGxzdGFja1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHBoYXNlLCBcIm5hbWVcIiwge2dldDogZnVuY3Rpb24oKXtyZXR1cm4gc3dhcm1UeXBlTmFtZStcIi5cIitmdW5jLm5hbWV9fSk7XG4gICAgICAgICAgICByZXR1cm4gcGhhc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRpYWxpc2UgPSBmdW5jdGlvbihzZXJpYWxpc2VkVmFsdWVzKXtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBPd00oe1xuICAgICAgICAgICAgICAgIHB1YmxpY1ZhcnM6e1xuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwcml2YXRlVmFyczp7XG5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHByb3RlY3RlZFZhcnM6e1xuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBteUZ1bmN0aW9uczp7XG5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHV0aWxpdHlGdW5jdGlvbnM6e1xuXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtZXRhOntcbiAgICAgICAgICAgICAgICAgICAgc3dhcm1UeXBlTmFtZTpzd2FybVR5cGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICBzd2FybURlc2NyaXB0aW9uOmRlc2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgZm9yKHZhciB2IGluIHB1YmxpY1ZhcnMpe1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdWJsaWNWYXJzW3ZdID0gcHVibGljVmFyc1t2XS5pbml0KCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IodmFyIHYgaW4gcHJpdmF0ZVZhcnMpe1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wcml2YXRlVmFyc1t2XSA9IHByaXZhdGVWYXJzW3ZdLmluaXQoKTtcbiAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgaWYoc2VyaWFsaXNlZFZhbHVlcyl7XG4gICAgICAgICAgICAgICAgYmVlc0hlYWxlci5qc29uVG9OYXRpdmUoc2VyaWFsaXNlZFZhbHVlcywgcmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5pbml0aWFsaXNlRnVuY3Rpb25zID0gZnVuY3Rpb24odmFsdWVPYmplY3QsIHRoaXNPYmplY3Qpe1xuXG4gICAgICAgICAgICBmb3IodmFyIHYgaW4gbXlGdW5jdGlvbnMpe1xuICAgICAgICAgICAgICAgIHZhbHVlT2JqZWN0Lm15RnVuY3Rpb25zW3ZdID0gY3JlYXRlUGhhc2UodGhpc09iamVjdCwgbXlGdW5jdGlvbnNbdl0sIHYpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbG9jYWxJZCsrO1xuICAgICAgICAgICAgdmFsdWVPYmplY3QudXRpbGl0eUZ1bmN0aW9ucyA9IHV0aWxzLmNyZWF0ZUZvck9iamVjdCh2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpe1xuXG5cbiAgICAgICAgICAgIGlmKHB1YmxpY1ZhcnMuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXQucHVibGljVmFyc1twcm9wZXJ0eV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHByaXZhdGVWYXJzLmhhc093blByb3BlcnR5KHByb3BlcnR5KSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnByaXZhdGVWYXJzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGFyZ2V0LnV0aWxpdHlGdW5jdGlvbnMuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKVxuICAgICAgICAgICAge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC51dGlsaXR5RnVuY3Rpb25zW3Byb3BlcnR5XTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBpZihteUZ1bmN0aW9ucy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5teUZ1bmN0aW9uc1twcm9wZXJ0eV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHRhcmdldC5wcm90ZWN0ZWRWYXJzLmhhc093blByb3BlcnR5KHByb3BlcnR5KSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnByb3RlY3RlZFZhcnNbcHJvcGVydHldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0eXBlb2YgcHJvcGVydHkgIT0gXCJzeW1ib2xcIikge1xuICAgICAgICAgICAgICAgICQkLmVycm9ySGFuZGxlci5zeW50YXhFcnJvcihwcm9wZXJ0eSwgdGFyZ2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldCA9IGZ1bmN0aW9uKHRhcmdldCwgcHJvcGVydHksIHZhbHVlLCByZWNlaXZlcil7XG5cbiAgICAgICAgICAgIGlmKHRhcmdldC51dGlsaXR5RnVuY3Rpb25zLmhhc093blByb3BlcnR5KHByb3BlcnR5KSB8fCB0YXJnZXQubXlGdW5jdGlvbnMuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgJCQuZXJyb3JIYW5kbGVyLnN5bnRheEVycm9yKHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUcnlpbmcgdG8gb3ZlcndyaXRlIGltbXV0YWJsZSBtZW1iZXJcIiArIHByb3BlcnR5KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYocHJpdmF0ZVZhcnMuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRhcmdldC5wcml2YXRlVmFyc1twcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgaWYocHVibGljVmFycy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LnB1YmxpY1ZhcnNbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRhcmdldC5wcm90ZWN0ZWRWYXJzW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFwcGx5ID0gZnVuY3Rpb24odGFyZ2V0LCB0aGlzQXJnLCBhcmd1bWVudHNMaXN0KXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUHJveHkgYXBwbHlcIik7XG4gICAgICAgICAgICAvL3ZhciBmdW5jID0gdGFyZ2V0W11cbiAgICAgICAgICAgIC8vc3dhcm1HbG9iYWxzLmV4ZWN1dGlvblByb3ZpZGVyLmV4ZWN1dGUobnVsbCwgdGhpc0FyZywgZnVuYywgYXJndW1lbnRzTGlzdClcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICB0aGlzLmlzRXh0ZW5zaWJsZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaGFzID0gZnVuY3Rpb24odGFyZ2V0LCBwcm9wKSB7XG4gICAgICAgICAgICBpZih0YXJnZXQucHVibGljVmFyc1twcm9wXSB8fCB0YXJnZXQucHJvdGVjdGVkVmFyc1twcm9wXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub3duS2V5cyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIFJlZmxlY3Qub3duS2V5cyh0YXJnZXQucHVibGljVmFycyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHNlcmlhbGlzZWRWYWx1ZXMpe1xuICAgICAgICAgICAgdmFyIHZhbHVlT2JqZWN0ID0gc2VsZi5pbml0aWFsaXNlKHNlcmlhbGlzZWRWYWx1ZXMpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBQcm94eSh2YWx1ZU9iamVjdCxzZWxmKTtcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGlzZUZ1bmN0aW9ucyh2YWx1ZU9iamVjdCxyZXN1bHQpO1xuXHRcdFx0aWYoIXNlcmlhbGlzZWRWYWx1ZXMpe1xuXHRcdFx0XHRpZighdmFsdWVPYmplY3QuZ2V0TWV0YShcInN3YXJtSWRcIikpe1xuXHRcdFx0XHRcdHZhbHVlT2JqZWN0LnNldE1ldGEoXCJzd2FybUlkXCIsICQkLnVpZEdlbmVyYXRvci5zYWZlX3V1aWQoKSk7ICAvL2RvIG5vdCBvdmVyd3JpdGUhISFcblx0XHRcdFx0fVxuXHRcdFx0XHR2YWx1ZU9iamVjdC51dGlsaXR5RnVuY3Rpb25zLm5vdGlmeSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZihyZXN1bHQuYXV0b0luaXQpe1xuICAgICAgICAgICAgICAgIHJlc3VsdC5hdXRvSW5pdCgpO1xuICAgICAgICAgICAgICAgICQkLm9ic29sZXRlKFwiZml4IHRoZSBhYm92ZSBjb21tZW50XCIpXG4gICAgICAgICAgICAgICAgLy9yZXN1bHQuYXV0b0luaXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHRoaXMuZGVzY3JpYmUgPSBmdW5jdGlvbiBkZXNjcmliZVN3YXJtKHN3YXJtVHlwZU5hbWUsIGRlc2NyaXB0aW9uKXtcbiAgICAgICAgc3dhcm1UeXBlTmFtZSA9IGdldEZ1bGxOYW1lKHN3YXJtVHlwZU5hbWUpO1xuXG4gICAgICAgIHZhciBwb2ludFBvcyA9IHN3YXJtVHlwZU5hbWUubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgICAgdmFyIHNob3J0TmFtZSA9IHN3YXJtVHlwZU5hbWUuc3Vic3RyKCBwb2ludFBvcysgMSk7XG4gICAgICAgIHZhciBsaWJyYXJ5TmFtZSA9IHN3YXJtVHlwZU5hbWUuc3Vic3RyKDAsIHBvaW50UG9zKTtcbiAgICAgICAgaWYoIWxpYnJhcnlOYW1lKXtcbiAgICAgICAgICAgIGxpYnJhcnlOYW1lID0gXCJnbG9iYWxcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBkZXNjcmlwdGlvbiA9IG5ldyBTd2FybURlc2NyaXB0aW9uKHN3YXJtVHlwZU5hbWUsIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgaWYoc3dhcm1EZXNjcmlwdGlvbnNSZWdpc3RyeVtzd2FybVR5cGVOYW1lXSAhPSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgJCQuZXJyb3JIYW5kbGVyLndhcm5pbmcoXCJEdXBsaWNhdGUgc3dhcm0gZGVzY3JpcHRpb24gXCIrIHN3YXJtVHlwZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9zd2FybURlc2NyaXB0aW9uc1JlZ2lzdHJ5W3N3YXJtVHlwZU5hbWVdID0gZGVzY3JpcHRpb247XG5cdFx0JCQucmVnaXN0ZXJTd2FybURlc2NyaXB0aW9uKGxpYnJhcnlOYW1lLCBzaG9ydE5hbWUsIHN3YXJtVHlwZU5hbWUsIGRlc2NyaXB0aW9uKTtcblxuICAgICAgICByZXR1cm4gZGVzY3JpcHRpb247XG4gICAgfVxuXG4gICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbigpe1xuICAgICAgICAkJC5lcnJvcihcImNyZWF0ZSBmdW5jdGlvbiBpcyBvYnNvbGV0ZS4gdXNlIGRlc2NyaWJlIVwiKTtcbiAgICB9XG4gICAgLyogLy8gY29uZnVzaW5nIHZhcmlhbnRcbiAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZVN3YXJtKHN3YXJtVHlwZU5hbWUsIGRlc2NyaXB0aW9uLCBpbml0aWFsVmFsdWVzKXtcbiAgICAgICAgc3dhcm1UeXBlTmFtZSA9IGdldEZ1bGxOYW1lKHN3YXJtVHlwZU5hbWUpO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBpZih1bmRlZmluZWQgPT0gZGVzY3JpcHRpb24pe1xuICAgICAgICAgICAgICAgIHJldHVybiBzd2FybURlc2NyaXB0aW9uc1JlZ2lzdHJ5W3N3YXJtVHlwZU5hbWVdKGluaXRpYWxWYWx1ZXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kZXNjcmliZShzd2FybVR5cGVOYW1lLCBkZXNjcmlwdGlvbikoaW5pdGlhbFZhbHVlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2goZXJyKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRlU3dhcm0gZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgICQkLmVycm9ySGFuZGxlci5lcnJvcihlcnIsIGFyZ3VtZW50cywgXCJXcm9uZyBuYW1lIG9yIGRlc2NyaXB0aW9uc1wiKTtcbiAgICAgICAgfVxuICAgIH0qL1xuXG4gICAgdGhpcy5jb250aW51ZSA9IGZ1bmN0aW9uKHN3YXJtVHlwZU5hbWUsIGluaXRpYWxWYWx1ZXMpe1xuICAgICAgICBzd2FybVR5cGVOYW1lID0gZ2V0RnVsbE5hbWUoc3dhcm1UeXBlTmFtZSk7XG4gICAgICAgIHZhciBkZXNjID0gc3dhcm1EZXNjcmlwdGlvbnNSZWdpc3RyeVtzd2FybVR5cGVOYW1lXTtcblxuICAgICAgICBpZihkZXNjKXtcbiAgICAgICAgICAgIHJldHVybiBkZXNjKGluaXRpYWxWYWx1ZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCQuZXJyb3JIYW5kbGVyLnN5bnRheEVycm9yKHN3YXJtVHlwZU5hbWUsaW5pdGlhbFZhbHVlcyxcbiAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byByZXN0YXJ0IGEgc3dhcm0gd2l0aCB0eXBlIFwiICsgc3dhcm1UeXBlTmFtZSArIFwiXFxuIE1heWJlIGRpZmZlcmVudCBzd2FybSBzcGFjZSAodXNlZCBmbG93IGluc3RlYWQgb2Ygc3dhcm0hPylcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnN0YXJ0ID0gZnVuY3Rpb24oc3dhcm1UeXBlTmFtZSwgY3RvciwgLi4ucGFyYW1zKXtcbiAgICAgICAgc3dhcm1UeXBlTmFtZSA9IGdldEZ1bGxOYW1lKHN3YXJtVHlwZU5hbWUpO1xuICAgICAgICB2YXIgZGVzYyA9IHN3YXJtRGVzY3JpcHRpb25zUmVnaXN0cnlbc3dhcm1UeXBlTmFtZV07XG4gICAgICAgIGlmKCFkZXNjKXtcbiAgICAgICAgICAgICQkLmVycm9ySGFuZGxlci5zeW50YXhFcnJvcihudWxsLCBzd2FybVR5cGVOYW1lKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBkZXNjKCk7XG4gICAgICAgIHJlcy5zZXRNZXRhZGF0YShcImhvbWVTZWN1cml0eUNvbnRleHRcIiwgJCQuc2VjdXJpdHlDb250ZXh0KTtcblxuICAgICAgICBpZihjdG9yKXtcbiAgICAgICAgICAgIHJlc1tjdG9yXS5hcHBseShyZXMsIHBhcmFtcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbn1cblxuZXhwb3J0cy5jcmVhdGVTd2FybUVuZ2luZSA9IGZ1bmN0aW9uKHN3YXJtVHlwZSwgdXRpbHMpe1xuICAgIGlmKHR5cGVvZiB1dGlscyA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlsaXR5RnVuY3Rpb25zL2NhbGxmbG93XCIpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFN3YXJtU3BhY2Uoc3dhcm1UeXBlLCB1dGlscyk7XG59O1xuIiwiZXhwb3J0cy5jcmVhdGVGb3JPYmplY3QgPSBmdW5jdGlvbih2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCl7XG5cdHZhciByZXQgPSByZXF1aXJlKFwiLi9iYXNlXCIpLmNyZWF0ZUZvck9iamVjdCh2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCk7XG5cblx0cmV0LnN3YXJtICAgICAgICAgICA9IG51bGw7XG5cdHJldC5vblJldHVybiAgICAgICAgPSBudWxsO1xuXHRyZXQub25SZXN1bHQgICAgICAgID0gbnVsbDtcblx0cmV0LmFzeW5jUmV0dXJuICAgICA9IG51bGw7XG5cdHJldC5yZXR1cm4gICAgICAgICAgPSBudWxsO1xuXHRyZXQuaG9tZSAgICAgICAgICAgID0gbnVsbDtcblx0cmV0LmlzUGVyc2lzdGVkICBcdD0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzT2JqZWN0LmdldE1ldGFkYXRhKCdwZXJzaXN0ZWQnKSA9PT0gdHJ1ZTtcblx0fTtcblxuXHRyZXR1cm4gcmV0O1xufTsiLCJ2YXIgYmVlc0hlYWxlciA9IHJlcXVpcmUoXCJzd2FybXV0aWxzXCIpLmJlZXNIZWFsZXI7XG52YXIgc3dhcm1EZWJ1ZyA9IHJlcXVpcmUoXCIuLi9jaG9yZW9ncmFwaGllcy9Td2FybURlYnVnXCIpO1xuXG5leHBvcnRzLmNyZWF0ZUZvck9iamVjdCA9IGZ1bmN0aW9uKHZhbHVlT2JqZWN0LCB0aGlzT2JqZWN0LCBsb2NhbElkKXtcblx0dmFyIHJldCA9IHt9O1xuXG5cdGZ1bmN0aW9uIGZpbHRlckZvclNlcmlhbGlzYWJsZSAodmFsdWVPYmplY3Qpe1xuXHRcdHJldHVybiB2YWx1ZU9iamVjdC5tZXRhLnN3YXJtSWQ7XG5cdH1cblxuXHR2YXIgc3dhcm1GdW5jdGlvbiA9IGZ1bmN0aW9uKGNvbnRleHQsIHBoYXNlTmFtZSl7XG5cdFx0dmFyIGFyZ3MgPVtdO1xuXHRcdGZvcih2YXIgaSA9IDI7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspe1xuXHRcdFx0YXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG5cdFx0fVxuXG5cdFx0Ly9tYWtlIHRoZSBleGVjdXRpb24gYXQgbGV2ZWwgMCAgKGFmdGVyIGFsbCBwZW5kaW5nIGV2ZW50cykgYW5kIHdhaXQgdG8gaGF2ZSBhIHN3YXJtSWRcblx0XHRyZXQub2JzZXJ2ZShmdW5jdGlvbigpe1xuXHRcdFx0YmVlc0hlYWxlci5hc0pTT04odmFsdWVPYmplY3QsIHBoYXNlTmFtZSwgYXJncywgZnVuY3Rpb24oZXJyLGpzTXNnKXtcblx0XHRcdFx0anNNc2cubWV0YS50YXJnZXQgPSBjb250ZXh0O1xuXHRcdFx0XHR2YXIgc3Vic2NyaWJlcnNDb3VudCA9ICQkLlBTS19QdWJTdWIucHVibGlzaCgkJC5DT05TVEFOVFMuU1dBUk1fRk9SX0VYRUNVVElPTiwganNNc2cpO1xuXHRcdFx0XHRpZighc3Vic2NyaWJlcnNDb3VudCl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYE5vYm9keSBsaXN0ZW5pbmcgZm9yIDwkeyQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OfT4hYCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0sbnVsbCxmaWx0ZXJGb3JTZXJpYWxpc2FibGUpO1xuXG5cdFx0cmV0Lm5vdGlmeSgpO1xuXG5cblx0XHRyZXR1cm4gdGhpc09iamVjdDtcblx0fTtcblxuXHR2YXIgYXN5bmNSZXR1cm4gPSBmdW5jdGlvbihlcnIsIHJlc3VsdCl7XG5cdFx0dmFyIGNvbnRleHQgPSB2YWx1ZU9iamVjdC5wcm90ZWN0ZWRWYXJzLmNvbnRleHQ7XG5cblx0XHRpZighY29udGV4dCAmJiB2YWx1ZU9iamVjdC5tZXRhLndhaXRTdGFjayl7XG5cdFx0XHRjb250ZXh0ID0gdmFsdWVPYmplY3QubWV0YS53YWl0U3RhY2sucG9wKCk7XG5cdFx0XHR2YWx1ZU9iamVjdC5wcm90ZWN0ZWRWYXJzLmNvbnRleHQgPSBjb250ZXh0O1xuXHRcdH1cblxuXHRcdGJlZXNIZWFsZXIuYXNKU09OKHZhbHVlT2JqZWN0LCBcIl9fcmV0dXJuX19cIiwgW2VyciwgcmVzdWx0XSwgZnVuY3Rpb24oZXJyLGpzTXNnKXtcblx0XHRcdGpzTXNnLm1ldGEuY29tbWFuZCA9IFwiYXN5bmNSZXR1cm5cIjtcblx0XHRcdGlmKCFjb250ZXh0KXtcblx0XHRcdFx0Y29udGV4dCA9IHZhbHVlT2JqZWN0Lm1ldGEuaG9tZVNlY3VyaXR5Q29udGV4dDsvL1RPRE86IENIRUNLIFRISVNcblxuXHRcdFx0fVxuXHRcdFx0anNNc2cubWV0YS50YXJnZXQgPSBjb250ZXh0O1xuXG5cdFx0XHRpZighY29udGV4dCl7XG5cdFx0XHRcdCQkLmVycm9ySGFuZGxlci5lcnJvcihuZXcgRXJyb3IoXCJBc3luY2hyb25vdXMgcmV0dXJuIGluc2lkZSBvZiBhIHN3YXJtIHRoYXQgZG9lcyBub3Qgd2FpdCBmb3IgcmVzdWx0c1wiKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQkJC5QU0tfUHViU3ViLnB1Ymxpc2goJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04sIGpzTXNnKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblxuXHRmdW5jdGlvbiBob21lKGVyciwgcmVzdWx0KXtcblx0XHRiZWVzSGVhbGVyLmFzSlNPTih2YWx1ZU9iamVjdCwgXCJob21lXCIsIFtlcnIsIHJlc3VsdF0sIGZ1bmN0aW9uKGVycixqc01zZyl7XG5cdFx0XHR2YXIgY29udGV4dCA9IHZhbHVlT2JqZWN0Lm1ldGEuaG9tZUNvbnRleHQ7XG5cdFx0XHRqc01zZy5tZXRhLnRhcmdldCA9IGNvbnRleHQ7XG5cdFx0XHQkJC5QU0tfUHViU3ViLnB1Ymxpc2goJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04sIGpzTXNnKTtcblx0XHR9KTtcblx0fVxuXG5cblxuXHRmdW5jdGlvbiB3YWl0UmVzdWx0cyhjYWxsYmFjaywga2VlcEFsaXZlQ2hlY2ssIHN3YXJtKXtcblx0XHRpZighc3dhcm0pe1xuXHRcdFx0c3dhcm0gPSB0aGlzO1xuXHRcdH1cblx0XHRpZigha2VlcEFsaXZlQ2hlY2spe1xuXHRcdFx0a2VlcEFsaXZlQ2hlY2sgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHZhciBpbm5lciA9IHN3YXJtLmdldElubmVyVmFsdWUoKTtcblx0XHRpZighaW5uZXIubWV0YS53YWl0U3RhY2spe1xuXHRcdFx0aW5uZXIubWV0YS53YWl0U3RhY2sgPSBbXTtcblx0XHRcdGlubmVyLm1ldGEud2FpdFN0YWNrLnB1c2goJCQuc2VjdXJpdHlDb250ZXh0KVxuXHRcdH1cblx0XHQkJC5zd2FybXNJbnN0YW5jZXNNYW5hZ2VyLndhaXRGb3JTd2FybShjYWxsYmFjaywgc3dhcm0sIGtlZXBBbGl2ZUNoZWNrKTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gZ2V0SW5uZXJWYWx1ZSgpe1xuXHRcdHJldHVybiB2YWx1ZU9iamVjdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHJ1blBoYXNlKGZ1bmN0TmFtZSwgYXJncyl7XG5cdFx0dmFyIGZ1bmMgPSB2YWx1ZU9iamVjdC5teUZ1bmN0aW9uc1tmdW5jdE5hbWVdO1xuXHRcdGlmKGZ1bmMpe1xuXHRcdFx0ZnVuYy5hcHBseSh0aGlzT2JqZWN0LCBhcmdzKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JCQuZXJyb3JIYW5kbGVyLnN5bnRheEVycm9yKGZ1bmN0TmFtZSwgdmFsdWVPYmplY3QsIFwiRnVuY3Rpb24gXCIgKyBmdW5jdE5hbWUgKyBcIiBkb2VzIG5vdCBleGlzdCFcIik7XG5cdFx0fVxuXG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGUoc2VyaWFsaXNhdGlvbil7XG5cdFx0YmVlc0hlYWxlci5qc29uVG9OYXRpdmUoc2VyaWFsaXNhdGlvbix2YWx1ZU9iamVjdCk7XG5cdH1cblxuXG5cdGZ1bmN0aW9uIHZhbHVlT2YoKXtcblx0XHR2YXIgcmV0ID0ge307XG5cdFx0cmV0Lm1ldGEgICAgICAgICAgICAgICAgPSB2YWx1ZU9iamVjdC5tZXRhO1xuXHRcdHJldC5wdWJsaWNWYXJzICAgICAgICAgID0gdmFsdWVPYmplY3QucHVibGljVmFycztcblx0XHRyZXQucHJpdmF0ZVZhcnMgICAgICAgICA9IHZhbHVlT2JqZWN0LnByaXZhdGVWYXJzO1xuXHRcdHJldC5wcm90ZWN0ZWRWYXJzICAgICAgID0gdmFsdWVPYmplY3QucHJvdGVjdGVkVmFycztcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0ZnVuY3Rpb24gdG9TdHJpbmcgKCl7XG5cdFx0cmV0dXJuIHN3YXJtRGVidWcuY2xlYW5EdW1wKHRoaXNPYmplY3QudmFsdWVPZigpKTtcblx0fVxuXG5cblx0ZnVuY3Rpb24gY3JlYXRlUGFyYWxsZWwoY2FsbGJhY2spe1xuXHRcdHJldHVybiByZXF1aXJlKFwiLi4vcGFyYWxsZWxKb2luUG9pbnRcIikuY3JlYXRlSm9pblBvaW50KHRoaXNPYmplY3QsIGNhbGxiYWNrLCAkJC5fX2ludGVybi5ta0FyZ3MoYXJndW1lbnRzLDEpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNyZWF0ZVNlcmlhbChjYWxsYmFjayl7XG5cdFx0cmV0dXJuIHJlcXVpcmUoXCIuLi9zZXJpYWxKb2luUG9pbnRcIikuY3JlYXRlU2VyaWFsSm9pblBvaW50KHRoaXNPYmplY3QsIGNhbGxiYWNrLCAkJC5fX2ludGVybi5ta0FyZ3MoYXJndW1lbnRzLDEpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3QoKXtcblx0XHRyZXR1cm4gc3dhcm1EZWJ1Zy5jbGVhbkR1bXAodGhpc09iamVjdC52YWx1ZU9mKCkpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29uc3RydWN0b3IoKXtcblx0XHRyZXR1cm4gU3dhcm1EZXNjcmlwdGlvbjtcblx0fVxuXG5cdGZ1bmN0aW9uIGVuc3VyZUxvY2FsSWQoKXtcblx0XHRpZighdmFsdWVPYmplY3QubG9jYWxJZCl7XG5cdFx0XHR2YWx1ZU9iamVjdC5sb2NhbElkID0gdmFsdWVPYmplY3QubWV0YS5zd2FybVR5cGVOYW1lICsgXCItXCIgKyBsb2NhbElkO1xuXHRcdFx0bG9jYWxJZCsrO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG9ic2VydmUoY2FsbGJhY2ssIHdhaXRGb3JNb3JlLCBmaWx0ZXIpe1xuXHRcdGlmKCF3YWl0Rm9yTW9yZSl7XG5cdFx0XHR3YWl0Rm9yTW9yZSA9IGZ1bmN0aW9uICgpe1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZW5zdXJlTG9jYWxJZCgpO1xuXG5cdFx0JCQuUFNLX1B1YlN1Yi5zdWJzY3JpYmUodmFsdWVPYmplY3QubG9jYWxJZCwgY2FsbGJhY2ssIHdhaXRGb3JNb3JlLCBmaWx0ZXIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdG9KU09OKHByb3Ape1xuXHRcdC8vcHJldmVudGluZyBtYXggY2FsbCBzdGFjayBzaXplIGV4Y2VlZGluZyBvbiBwcm94eSBhdXRvIHJlZmVyZW5jaW5nXG5cdFx0Ly9yZXBsYWNlIHt9IGFzIHJlc3VsdCBvZiBKU09OKFByb3h5KSB3aXRoIHRoZSBzdHJpbmcgW09iamVjdCBwcm90ZWN0ZWQgb2JqZWN0XVxuXHRcdHJldHVybiBcIltPYmplY3QgcHJvdGVjdGVkIG9iamVjdF1cIjtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEpTT04oY2FsbGJhY2spe1xuXHRcdHJldHVyblx0YmVlc0hlYWxlci5hc0pTT04odmFsdWVPYmplY3QsIG51bGwsIG51bGwsY2FsbGJhY2spO1xuXHR9XG5cblx0ZnVuY3Rpb24gbm90aWZ5KGV2ZW50KXtcblx0XHRpZighZXZlbnQpe1xuXHRcdFx0ZXZlbnQgPSB2YWx1ZU9iamVjdDtcblx0XHR9XG5cdFx0ZW5zdXJlTG9jYWxJZCgpO1xuXHRcdCQkLlBTS19QdWJTdWIucHVibGlzaCh2YWx1ZU9iamVjdC5sb2NhbElkLCBldmVudCk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRNZXRhKG5hbWUpe1xuXHRcdHJldHVybiB2YWx1ZU9iamVjdC5nZXRNZXRhKG5hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2V0TWV0YShuYW1lLCB2YWx1ZSl7XG5cdFx0cmV0dXJuIHZhbHVlT2JqZWN0LnNldE1ldGEobmFtZSwgdmFsdWUpO1xuXHR9XG5cblx0cmV0LnNldE1ldGFcdFx0XHQ9IHNldE1ldGE7XG5cdHJldC5nZXRNZXRhXHRcdFx0PSBnZXRNZXRhO1xuXHRyZXQuc3dhcm0gICAgICAgICAgID0gc3dhcm1GdW5jdGlvbjtcblx0cmV0Lm5vdGlmeSAgICAgICAgICA9IG5vdGlmeTtcblx0cmV0LmdldEpTT04gICAgXHQgICAgPSBnZXRKU09OO1xuXHRyZXQudG9KU09OICAgICAgICAgID0gdG9KU09OO1xuXHRyZXQub2JzZXJ2ZSAgICAgICAgID0gb2JzZXJ2ZTtcblx0cmV0Lmluc3BlY3QgICAgICAgICA9IGluc3BlY3Q7XG5cdHJldC5qb2luICAgICAgICAgICAgPSBjcmVhdGVQYXJhbGxlbDtcblx0cmV0LnBhcmFsbGVsICAgICAgICA9IGNyZWF0ZVBhcmFsbGVsO1xuXHRyZXQuc2VyaWFsICAgICAgICAgID0gY3JlYXRlU2VyaWFsO1xuXHRyZXQudmFsdWVPZiAgICAgICAgID0gdmFsdWVPZjtcblx0cmV0LnVwZGF0ZSAgICAgICAgICA9IHVwZGF0ZTtcblx0cmV0LnJ1blBoYXNlICAgICAgICA9IHJ1blBoYXNlO1xuXHRyZXQub25SZXR1cm4gICAgICAgID0gd2FpdFJlc3VsdHM7XG5cdHJldC5vblJlc3VsdCAgICAgICAgPSB3YWl0UmVzdWx0cztcblx0cmV0LmFzeW5jUmV0dXJuICAgICA9IGFzeW5jUmV0dXJuO1xuXHRyZXQucmV0dXJuICAgICAgICAgID0gYXN5bmNSZXR1cm47XG5cdHJldC5nZXRJbm5lclZhbHVlICAgPSBnZXRJbm5lclZhbHVlO1xuXHRyZXQuaG9tZSAgICAgICAgICAgID0gaG9tZTtcblx0cmV0LnRvU3RyaW5nICAgICAgICA9IHRvU3RyaW5nO1xuXHRyZXQuY29uc3RydWN0b3IgICAgID0gY29uc3RydWN0b3I7XG5cdHJldC5zZXRNZXRhZGF0YVx0XHQ9IHZhbHVlT2JqZWN0LnNldE1ldGEuYmluZCh2YWx1ZU9iamVjdCk7XG5cdHJldC5nZXRNZXRhZGF0YVx0XHQ9IHZhbHVlT2JqZWN0LmdldE1ldGEuYmluZCh2YWx1ZU9iamVjdCk7XG5cblx0cmV0LmF1dG9Jbml0XHRcdD0gbnVsbDtcblx0cmV0dXJuIHJldDtcblxufTtcbiIsImV4cG9ydHMuY3JlYXRlRm9yT2JqZWN0ID0gZnVuY3Rpb24odmFsdWVPYmplY3QsIHRoaXNPYmplY3QsIGxvY2FsSWQpe1xuXHR2YXIgcmV0ID0gcmVxdWlyZShcIi4vYmFzZVwiKS5jcmVhdGVGb3JPYmplY3QodmFsdWVPYmplY3QsIHRoaXNPYmplY3QsIGxvY2FsSWQpO1xuXG5cdHJldC5zd2FybSAgICAgICAgICAgPSBudWxsO1xuXHRyZXQub25SZXR1cm4gICAgICAgID0gbnVsbDtcblx0cmV0Lm9uUmVzdWx0ICAgICAgICA9IG51bGw7XG5cdHJldC5hc3luY1JldHVybiAgICAgPSBudWxsO1xuXHRyZXQucmV0dXJuICAgICAgICAgID0gbnVsbDtcblx0cmV0LmhvbWUgICAgICAgICAgICA9IG51bGw7XG5cblx0cmV0dXJuIHJldDtcbn07IiwiZXhwb3J0cy5jcmVhdGVGb3JPYmplY3QgPSBmdW5jdGlvbih2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCl7XG5cdHZhciByZXQgPSByZXF1aXJlKFwiLi9iYXNlXCIpLmNyZWF0ZUZvck9iamVjdCh2YWx1ZU9iamVjdCwgdGhpc09iamVjdCwgbG9jYWxJZCk7XG5cblx0cmV0LnN3YXJtICAgICAgICAgICA9IG51bGw7XG5cdHJldC5vblJldHVybiAgICAgICAgPSBudWxsO1xuXHRyZXQub25SZXN1bHQgICAgICAgID0gbnVsbDtcblx0cmV0LmFzeW5jUmV0dXJuICAgICA9IG51bGw7XG5cdHJldC5yZXR1cm4gICAgICAgICAgPSBudWxsO1xuXHRyZXQuaG9tZSAgICAgICAgICAgID0gbnVsbDtcblx0cmV0LmF1dG9Jbml0ICAgICAgICA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpc09iamVjdC50cmFuc2FjdGlvbiA9ICQkLmJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih0aGlzT2JqZWN0KTtcblx0fTtcblx0cmV0LmlzUGVyc2lzdGVkICBcdD0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzT2JqZWN0LmdldE1ldGFkYXRhKCdwZXJzaXN0ZWQnKSA9PT0gdHJ1ZTtcblx0fTtcblxuXHRyZXR1cm4gcmV0O1xufTsiLCJsZXQgbG9nZ2VyID0gY29uc29sZTtcblxuaWYgKHByb2Nlc3MuZW52Lk5PX0xPR1MgIT09ICd0cnVlJykge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IFBTS0xvZ2dlck1vZHVsZSA9IHJlcXVpcmUoJ3Bza2xvZ2dlcicpO1xuICAgICAgICBjb25zdCBQU0tMb2dnZXIgPSBQU0tMb2dnZXJNb2R1bGUuUFNLTG9nZ2VyO1xuICAgICAgICBcbiAgICAgICAgbG9nZ2VyID0gUFNLTG9nZ2VyLmdldExvZ2dlcigpO1xuICAgICAgICBcbiAgICAgICAgLy8gVE9ETzogcmVtb3ZlIHRoaXMgb25jZSAkJCBsb2dnZXIgaXMgdXNlZCBpbnN0ZWFkIG9mIGNvbnNvbGVcbiAgICAgICAgUFNLTG9nZ2VyTW9kdWxlLm92ZXJ3cml0ZUNvbnNvbGUoKTtcblxuICAgICAgICBjb25zb2xlLmxvZygnTG9nZ2VyIGluaXQgc3VjY2Vzc2Z1bCcsIHByb2Nlc3MucGlkKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignTG9nZ2VyIG5vdCBhdmFpbGFibGUsIHVzaW5nIGNvbnNvbGUnLCBlKTtcbiAgICAgICAgbG9nZ2VyID0gY29uc29sZTtcbiAgICB9XG59IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCdFbnZpcm9ubWVudCBmbGFnIE5PX0xPR1MgaXMgc2V0LCBsb2dnaW5nIHRvIGNvbnNvbGUnKTtcbn1cblxuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2wgPSBmdW5jdGlvbiAobmV3U3ltYm9sLCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgJCRbbmV3U3ltYm9sXSA9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSgkJCwgbmV3U3ltYm9sLCB7XG4gICAgICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgICAgICB3cml0YWJsZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKFwiUmVmdXNpbmcgdG8gb3ZlcndyaXRlICQkLlwiICsgbmV3U3ltYm9sKTtcbiAgICB9XG59O1xuXG4kJC5yZWdpc3Rlckdsb2JhbFN5bWJvbChcImF1dG9UaHJvd1wiLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKCFlcnIpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbn0pO1xuXG4kJC5yZWdpc3Rlckdsb2JhbFN5bWJvbChcImlnbm9yZUVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICAgICQkLmVycm9yKGVycik7XG4gICAgfVxufSk7XG5cbiQkLnJlZ2lzdGVyR2xvYmFsU3ltYm9sKFwiZXhjZXB0aW9uXCIsIGZ1bmN0aW9uIChtZXNzYWdlLCB0eXBlKSB7XG4gICAgaWYgKCFlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbn0pO1xuXG4kJC5yZWdpc3Rlckdsb2JhbFN5bWJvbChcImVyclwiLCBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGxvZ2dlci5lcnJvciguLi5hcmdzKTtcbn0pO1xuXG4kJC5yZWdpc3Rlckdsb2JhbFN5bWJvbChcIndhcm5cIiwgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBsb2dnZXIud2FybiguLi5hcmdzKTtcbn0pO1xuXG4vKiBhIGZlYXR1cmUgaXMgcGxhbm5lZCBidXQgbm90IGltcGxlbWVudGVkIChkdXJpbmcgZGV2ZWxvcG1lbnQpIGJ1dFxuYWxzbyBpdCBjb3VsZCByZW1haW4gaW4gcHJvZHVjdGlvbiBhbmQgc2hvdWxkIGJlIGZsYWdnZWQgYXNhcCovXG4kJC5yZWdpc3Rlckdsb2JhbFN5bWJvbChcImluY29tcGxldGVcIiwgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBsb2dnZXIud2FybiguLi5hcmdzKTtcbn0pO1xuXG4vKiB1c2VkIGR1cmluZyBkZXZlbG9wbWVudCBhbmQgd2hlbiB0cnlpbmcgdG8gZGlzY292ZXIgZWx1c2l2ZSBlcnJvcnMqL1xuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2woXCJhc3NlcnRcIiwgZnVuY3Rpb24gKHZhbHVlLCBleHBsYWluV2h5KSB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBc3NlcnQgZmFsc2UgXCIgKyBleHBsYWluV2h5KTtcbiAgICB9XG59KTtcblxuLyogZW5hYmxlL2Rpc2FiYWxlIGZsYWdzIHRoYXQgY29udHJvbCBwc2sgYmVoYXZpb3VyKi9cbiQkLnJlZ2lzdGVyR2xvYmFsU3ltYm9sKFwiZmxhZ3NcIiwgZnVuY3Rpb24gKGZsYWdOYW1lLCB2YWx1ZSkge1xuICAgICQkLmluY29tcGxldGUoXCJmbGFncyBoYW5kbGluZyBub3QgaW1wbGVtZW50ZWRcIik7XG59KTtcblxuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2woXCJvYnNvbGV0ZVwiLCBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGxvZ2dlci5sb2coLi4uYXJncyk7XG59KTtcblxuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2woXCJsb2dcIiwgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBsb2dnZXIubG9nKC4uLmFyZ3MpO1xufSk7XG5cbiQkLnJlZ2lzdGVyR2xvYmFsU3ltYm9sKFwic3ludGF4RXJyb3JcIiwgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICBsb2dnZXIubG9nKC4uLmFyZ3MpO1xufSk7XG5cbi8qIGxvZyB1bmtub3duIGV4Y2VwdGlvbnMqL1xuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2woXCJ1bmtub3duRXhjZXB0aW9uXCIsIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgbG9nZ2VyLmxvZyguLi5hcmdzKTtcbn0pO1xuXG4vKiBQcml2YXRlU2t5IGV2ZW50LCB1c2VkIGJ5IG1vbml0b3JpbmcgYW5kIHN0YXRpc3RpY3MqL1xuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2woXCJldmVudFwiLCBmdW5jdGlvbiAoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgICBpZiAobG9nZ2VyLmhhc093blByb3BlcnR5KCdldmVudCcpKSB7XG4gICAgICAgIGxvZ2dlci5ldmVudChldmVudCwgLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coZXZlbnQsIC4uLmFyZ3MpO1xuICAgIH1cbn0pO1xuXG4vKiAqL1xuJCQucmVnaXN0ZXJHbG9iYWxTeW1ib2woXCJyZWRpcmVjdExvZ1wiLCBmdW5jdGlvbihsb2dUeXBlLCBsb2dPYmplY3QpIHtcbiAgICBsb2dnZXIucmVkaXJlY3QobG9nVHlwZSwgbG9nT2JqZWN0KTtcbn0pO1xuXG4vKiBsb2cgdGhyb3R0bGluZyBldmVudCAvLyBpdCBpcyBqdXN0IGFuIGV2ZW50PyovXG4kJC5yZWdpc3Rlckdsb2JhbFN5bWJvbChcInRocm90dGxpbmdFdmVudFwiLCBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGxvZ2dlci5sb2coLi4uYXJncyk7XG59KTtcbiIsImZ1bmN0aW9uIFBTS0J1ZmZlcigpIHt9XG5cbmZ1bmN0aW9uIGdldEFycmF5QnVmZmVySW50ZXJmYWNlICgpIHtcbiAgICBpZih0eXBlb2YgU2hhcmVkQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBBcnJheUJ1ZmZlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gU2hhcmVkQXJyYXlCdWZmZXI7XG4gICAgfVxufVxuXG5QU0tCdWZmZXIuZnJvbSA9IGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBjb25zdCBBcnJheUJ1ZmZlckludGVyZmFjZSA9IGdldEFycmF5QnVmZmVySW50ZXJmYWNlKCk7XG5cbiAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShuZXcgQXJyYXlCdWZmZXJJbnRlcmZhY2Uoc291cmNlLmxlbmd0aCkpO1xuICAgIGJ1ZmZlci5zZXQoc291cmNlLCAwKTtcblxuICAgIHJldHVybiBidWZmZXI7XG59O1xuXG5QU0tCdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gKFsgLi4ucGFyYW1zIF0sIHRvdGFsTGVuZ3RoKSB7XG4gICAgY29uc3QgQXJyYXlCdWZmZXJJbnRlcmZhY2UgPSBnZXRBcnJheUJ1ZmZlckludGVyZmFjZSgpO1xuXG4gICAgaWYgKCF0b3RhbExlbmd0aCAmJiB0b3RhbExlbmd0aCAhPT0gMCkge1xuICAgICAgICB0b3RhbExlbmd0aCA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIHBhcmFtcykge1xuICAgICAgICAgICAgdG90YWxMZW5ndGggKz0gYnVmZmVyLmxlbmd0aDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KG5ldyBBcnJheUJ1ZmZlckludGVyZmFjZSh0b3RhbExlbmd0aCkpO1xuICAgIGxldCBvZmZzZXQgPSAwO1xuXG4gICAgZm9yIChjb25zdCBidWYgb2YgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGxlbiA9IGJ1Zi5sZW5ndGg7XG5cbiAgICAgICAgY29uc3QgbmV4dE9mZnNldCA9IG9mZnNldCArIGxlbjtcbiAgICAgICAgaWYgKG5leHRPZmZzZXQgPiB0b3RhbExlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcmVtYWluaW5nU3BhY2UgPSB0b3RhbExlbmd0aCAtIG9mZnNldDtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVtYWluaW5nU3BhY2U7ICsraSkge1xuICAgICAgICAgICAgICAgIGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGJ1ZltpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ1ZmZlci5zZXQoYnVmLCBvZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgb2Zmc2V0ID0gbmV4dE9mZnNldDtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVmZmVyO1xufTtcblxuUFNLQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gKHBza0J1ZmZlcikge1xuICAgIHJldHVybiAhIUFycmF5QnVmZmVyLmlzVmlldyhwc2tCdWZmZXIpO1xufTtcblxuUFNLQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24oc2l6ZSkge1xuICAgIGNvbnN0IEFycmF5QnVmZmVySW50ZXJmYWNlID0gZ2V0QXJyYXlCdWZmZXJJbnRlcmZhY2UoKTtcblxuICAgIHJldHVybiBuZXcgVWludDhBcnJheShuZXcgQXJyYXlCdWZmZXJJbnRlcmZhY2Uoc2l6ZSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQU0tCdWZmZXI7IiwiY29uc3QgTG9nRmFjdG9yeSA9IHJlcXVpcmUoJy4vTG9nRmFjdG9yeScpO1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1RyYW5zcG9ydEludGVyZmFjZX0gbWVzc2FnZVB1Ymxpc2hlclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEdlbmVyaWNMb2dnZXJDbGllbnQobWVzc2FnZVB1Ymxpc2hlcikge1xuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgdG8gYmUgdXNlZCB0byBzZW5kIG5vcm1hbCBsb2dzLiBUaGV5IHdpbGwgYmUgcHVibGlzaGVkIGluIGEgc3ViY2hhbm5lbCBvZiB0aGUgXCJsb2dzXCIgY2hhbm5lbC5cbiAgICAgKiBJdCBpcyBlYXNpZXIgdG8gdHJhY2Ugb25seSB1c2VyIGFuZCBwbGF0Zm9ybSBsb2dzIGlmIHRoZXkgYXJlIHNlcGFyYXRlZCBpbiB0aGlzIGNoYW5uZWxcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7e2NvZGU6IE51bWJlciwgbmFtZTogc3RyaW5nfX0gbG9nTGV2ZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbWV0YVxuICAgICAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gbWVzc2FnZXNcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3tsZXZlbCwgbWV0YSwgdGltZSwgbXNUaW1lLCBtZXNzYWdlc319XG4gICAgICovXG4gICAgZnVuY3Rpb24gbG9nKGxvZ0xldmVsLCBtZXRhLCBtZXNzYWdlcykge1xuICAgICAgICBjb25zdCBsb2cgPSBMb2dGYWN0b3J5LmNyZWF0ZUxvZyhsb2dMZXZlbCwgbWV0YSwgbWVzc2FnZXMpO1xuXG4gICAgICAgIGNvbnN0IGxvZ0NoYW5uZWwgPSBgbG9ncy4ke2xvZ0xldmVsLm5hbWV9YDtcbiAgICAgICAgbWVzc2FnZVB1Ymxpc2hlci5zZW5kKGxvZ0NoYW5uZWwsIGxvZyk7XG5cbiAgICAgICAgcmV0dXJuIGxvZztcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgdG8gYmUgdXNlZCBmb3Igc2VuZGluZyBjdXN0b20gZXZlbnRzIHdoZW4gbWVzc2FnZXMgZG9uJ3QgaGFwcGVuIGluIHRoZSBub3JtYWwgZmxvdyBvZiB0aGUgcGxhdGZvcm1cbiAgICAgKiBvciB0aGV5IHNob3VsZG4ndCBpbnRlcmZlcmUgd2l0aCB0aGUgdHJhY2luZyBvZiBsb2dzXG4gICAgICogRm9yIGV4YW1wbGUsIHNlbmRpbmcgc3RhdGlzdGljcyBhYm91dCBhIG5vZGUgb3IgYSBzYW5kYm94IGlzIGhhcHBlbmluZyBwZXJpb2RpY2FsbHkgYW5kIG5vdCBhcyBhIHJlc3VsdCBvZlxuICAgICAqIHVzZXJzJyBydW5uaW5nIGNvZGUsIHRoZXJlZm9yZSB0aGlzIHNob3VsZCBub3QgYmUgbWVyZ2VkIHdpdGggbG9nc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNoYW5uZWxcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gbWV0YVxuICAgICAqIEBwYXJhbSB7QXJyYXk8YW55Pn0gbWVzc2FnZXNcbiAgICAgKiBAcmV0dXJuIHt7bWV0YSwgbWVzc2FnZXMsIHRpbWV9fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGV2ZW50KGNoYW5uZWwsIG1ldGEsIG1lc3NhZ2VzKSB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gTG9nRmFjdG9yeS5jcmVhdGVFdmVudChtZXRhLCBtZXNzYWdlcyk7XG5cbiAgICAgICAgY29uc3QgbG9nQ2hhbm5lbCA9IGBldmVudHMuJHtjaGFubmVsfWA7XG4gICAgICAgIG1lc3NhZ2VQdWJsaXNoZXIuc2VuZChsb2dDaGFubmVsLCBldmVudCk7XG5cbiAgICAgICAgcmV0dXJuIGV2ZW50O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHB1Ymxpc2goY2hhbm5lbCwgbWVzc2FnZSkge1xuICAgICAgICBtZXNzYWdlUHVibGlzaGVyLnNlbmQoY2hhbm5lbCwgbWVzc2FnZSk7XG5cbiAgICAgICAgcmV0dXJuIG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgdGhpcy5ldmVudCAgPSBldmVudDtcbiAgICB0aGlzLmxvZyAgICA9IGxvZztcbiAgICB0aGlzLnB1Ymxpc2ggPSBwdWJsaXNoO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdlbmVyaWNMb2dnZXJDbGllbnQ7XG4iLCJmdW5jdGlvbiBnZXRUaW1lKCkge1xuICAgIGlmKHByb2Nlc3MuZW52LmNvbnRleHQgPT09ICdzYW5kYm94Jykge1xuXG4gICAgICAgIHJldHVybiBEYXRlLm5vdygpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qge3BlcmZvcm1hbmNlfSA9IHJlcXVpcmUoJ3BlcmZfaG9va3MnKTtcblxuICAgICAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCkgKyBwZXJmb3JtYW5jZS50aW1lT3JpZ2luO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBjcmVhdGVMb2cobG9nTGV2ZWwsIG1ldGEsIG1lc3NhZ2VzKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGV2ZWw6IGxvZ0xldmVsLFxuICAgICAgICBtZXNzYWdlczogbWVzc2FnZXMsXG4gICAgICAgIG1ldGE6IG1ldGEsXG4gICAgICAgIHRpbWU6IGdldFRpbWUoKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRXZlbnQobWV0YSwgbWVzc2FnZXMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlcyxcbiAgICAgICAgbWV0YSxcbiAgICAgICAgdGltZTogZ2V0VGltZSgpXG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlTG9nLFxuICAgIGNyZWF0ZUV2ZW50XG59O1xuIiwiY29uc3QgR2VuZXJpY0xvZ2dlckNsaWVudCA9IHJlcXVpcmUoJy4vR2VuZXJpY0xvZ2dlckNsaWVudCcpO1xuY29uc3QgTG9nTGV2ZWwgPSByZXF1aXJlKCcuLi91dGlscy9Mb2dMZXZlbCcpO1xuY29uc3QgTG9nZ2VySW50ZXJmYWNlID0gcmVxdWlyZSgnLi9Mb2dnZXJJbnRlcmZhY2UnKTtcblxuLyoqXG4gKlxuICogQHBhcmFtIHtUcmFuc3BvcnRJbnRlcmZhY2V9IG1lc3NhZ2VQdWJsaXNoZXJcbiAqIEBpbXBsZW1lbnRzIExvZ2dlckludGVyZmFjZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIExvZ2dlckNsaWVudChtZXNzYWdlUHVibGlzaGVyKSB7XG4gICAgTG9nZ2VySW50ZXJmYWNlLmNhbGwodGhpcyk7XG5cbiAgICBjb25zdCBnZW5lcmljTG9nZ2VyQ2xpZW50ID0gbmV3IEdlbmVyaWNMb2dnZXJDbGllbnQobWVzc2FnZVB1Ymxpc2hlcik7XG5cblxuICAgIC8qKioqKioqKioqKioqIFBVQkxJQyBNRVRIT0RTICoqKioqKioqKioqKiovXG5cbiAgICBmdW5jdGlvbiBkZWJ1ZyhtZXRhID0ge30sIC4uLnBhcmFtcykge1xuICAgICAgICBjb25zdCBsb2dMZXZlbCA9IF9nZXRMb2dMZXZlbChMb2dMZXZlbC5kZWJ1Zyk7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyaWNMb2dnZXJDbGllbnQubG9nKGxvZ0xldmVsLCBtZXRhLCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKG1ldGEgPSB7fSwgLi4ucGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGxvZ0xldmVsID0gX2dldExvZ0xldmVsKExvZ0xldmVsLmVycm9yKTtcblxuICAgICAgICByZXR1cm4gZ2VuZXJpY0xvZ2dlckNsaWVudC5sb2cobG9nTGV2ZWwsIG1ldGEsIHBhcmFtcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaW5mbyhtZXRhID0ge30sIC4uLnBhcmFtcykge1xuICAgICAgICBjb25zdCBsb2dMZXZlbCA9IF9nZXRMb2dMZXZlbChMb2dMZXZlbC5pbmZvKTtcblxuICAgICAgICByZXR1cm4gZ2VuZXJpY0xvZ2dlckNsaWVudC5sb2cobG9nTGV2ZWwsIG1ldGEsIHBhcmFtcyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9nKG1ldGEgPSB7fSwgLi4ucGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGxvZ0xldmVsID0gX2dldExvZ0xldmVsKExvZ0xldmVsLmxvZyk7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyaWNMb2dnZXJDbGllbnQubG9nKGxvZ0xldmVsLCBtZXRhLCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdhcm4obWV0YSA9IHt9LCAuLi5wYXJhbXMpIHtcbiAgICAgICAgY29uc3QgbG9nTGV2ZWwgPSBfZ2V0TG9nTGV2ZWwoTG9nTGV2ZWwud2Fybik7XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyaWNMb2dnZXJDbGllbnQubG9nKGxvZ0xldmVsLCBtZXRhLCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2ZW50KGNoYW5uZWwsIG1ldGEgPSB7fSwgLi4ucGFyYW1zKSB7XG4gICAgICAgIHJldHVybiBnZW5lcmljTG9nZ2VyQ2xpZW50LmV2ZW50KGNoYW5uZWwsIG1ldGEsIC4uLnBhcmFtcyk7XG4gICAgfVxuICAgIFxuICAgIGZ1bmN0aW9uIHJlZGlyZWN0KGNoYW5uZWwsIGxvZ09iamVjdCkge1xuICAgICAgICByZXR1cm4gZ2VuZXJpY0xvZ2dlckNsaWVudC5wdWJsaXNoKGNoYW5uZWwsIGxvZ09iamVjdClcbiAgICB9XG5cblxuICAgIC8qKioqKioqKioqKioqIFBSSVZBVEUgTUVUSE9EUyAqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gX2dldExvZ0xldmVsKGxldmVsQ29kZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogbGV2ZWxDb2RlLFxuICAgICAgICAgICAgbmFtZTogTG9nTGV2ZWxbbGV2ZWxDb2RlXVxuICAgICAgICB9O1xuICAgIH1cblxuXG4gICAgLyoqKioqKioqKioqKiogRVhQT1JUUyAqKioqKioqKioqKioqL1xuXG4gICAgdGhpcy5kZWJ1ZyAgICA9IGRlYnVnO1xuICAgIHRoaXMuZXJyb3IgICAgPSBlcnJvcjtcbiAgICB0aGlzLmV2ZW50ICAgID0gZXZlbnQ7XG4gICAgdGhpcy5pbmZvICAgICA9IGluZm87XG4gICAgdGhpcy5sb2cgICAgICA9IGxvZztcbiAgICB0aGlzLnJlZGlyZWN0ID0gcmVkaXJlY3Q7XG4gICAgdGhpcy53YXJuICAgICA9IHdhcm47XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9nZ2VyQ2xpZW50O1xuIiwiLyoqXG4gKiBAaW50ZXJmYWNlXG4gKi9cbmZ1bmN0aW9uIExvZ2dlckludGVyZmFjZSgpIHtcbiAgICBmdW5jdGlvbiBnZW5lcmljTWV0aG9kKGNoYW5uZWwsIGxvZ09iamVjdCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICAgIH1cblxuICAgIHRoaXMuZGVidWcgICAgPSBnZW5lcmljTWV0aG9kO1xuICAgIHRoaXMuZXJyb3IgICAgPSBnZW5lcmljTWV0aG9kO1xuICAgIHRoaXMuZXZlbnQgICAgPSBnZW5lcmljTWV0aG9kO1xuICAgIHRoaXMuaW5mbyAgICAgPSBnZW5lcmljTWV0aG9kO1xuICAgIHRoaXMubG9nICAgICAgPSBnZW5lcmljTWV0aG9kO1xuICAgIHRoaXMucmVkaXJlY3QgPSBnZW5lcmljTWV0aG9kO1xuICAgIHRoaXMud2FybiAgICAgPSBnZW5lcmljTWV0aG9kO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvZ2dlckludGVyZmFjZTtcbiIsImNvbnN0IEdlbmVyaWNMb2dnZXJDbGllbnQgPSByZXF1aXJlKCcuL0dlbmVyaWNMb2dnZXJDbGllbnQnKTtcbmNvbnN0IExvZ0ZhY3RvcnkgICAgICAgICAgPSByZXF1aXJlKCcuL0xvZ0ZhY3RvcnknKTtcbmNvbnN0IExvZ2dlckNsaWVudCAgICAgICAgPSByZXF1aXJlKCcuL0xvZ2dlckNsaWVudCcpO1xuY29uc3QgTG9nZ2VySW50ZXJmYWNlICAgICA9IHJlcXVpcmUoJy4vTG9nZ2VySW50ZXJmYWNlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgR2VuZXJpY0xvZ2dlckNsaWVudCxcbiAgICBMb2dGYWN0b3J5LFxuICAgIExvZ2dlckNsaWVudCxcbiAgICBMb2dnZXJJbnRlcmZhY2Vcbn07XG4iLCJjb25zdCBUcmFuc3BvcnRJbnRlcmZhY2UgPSByZXF1aXJlKCcuL1RyYW5zcG9ydEludGVyZmFjZScpO1xuY29uc3QgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscycpO1xuY29uc3QgemVyb01RID0gcmVxdWlyZSgnemVyb21xJyk7XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgWmVyb01RIFB1Ymxpc2hlciBTb2NrZXQgYW5kIGNvbm5lY3RzIHRvIHRoZSBzcGVjaWZpZWQgYWRkcmVzcyBmb3IgYSBaZXJvTVEgU3Vic2NyaWJlclxuICogQHBhcmFtIHtzdHJpbmchfSBhZGRyZXNzIC0gQmFzZSBhZGRyZXNzIGluY2x1ZGluZyBwcm90b2NvbCBhbmQgcG9ydCAoZXg6IHRjcDovLzEyNy4wLjAuMTo4MDgwKVxuICogQGltcGxlbWVudHMgVHJhbnNwb3J0SW50ZXJmYWNlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWVzc2FnZVB1Ymxpc2hlcihhZGRyZXNzKSB7XG4gICAgVHJhbnNwb3J0SW50ZXJmYWNlLmNhbGwodGhpcyk7XG5cbiAgICBjb25zdCB6bXFTb2NrZXQgPSB6ZXJvTVEuY3JlYXRlU29ja2V0KCdwdWInKTtcblxuICAgIC8vIHVuY29tbWVudCBuZXh0IGxpbmUgaWYgbWVzc2FnZXMgYXJlIGxvc3RcbiAgICAvLyB6bXFTb2NrZXQuc2V0c29ja29wdCh6ZXJvTVEuWk1RX1NOREhXTSwgMCk7XG4gICAgY29uc3Qgc29ja2V0ID0gbmV3IHV0aWxzLkJ1ZmZlcmVkU29ja2V0KHptcVNvY2tldCwgdXRpbHMuU29ja2V0VHlwZS5jb25uZWN0YWJsZSk7XG5cblxuICAgIC8qKioqKioqKioqKioqIFBVQkxJQyBNRVRIT0RTICoqKioqKioqKioqKiovXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFubmVsXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGxvZ09iamVjdFxuICAgICAqL1xuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIChjaGFubmVsLCBsb2dPYmplY3QpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRMb2cgPSBKU09OLnN0cmluZ2lmeShsb2dPYmplY3QpO1xuXG4gICAgICAgICAgICBzb2NrZXQuc2VuZChbY2hhbm5lbCwgc2VyaWFsaXplZExvZ10pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZGVyci53cml0ZSgnRXJyb3Igd2hpbGUgc2VuZGluZyBvciBzZXJpYWxpemluZyBtZXNzYWdlJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvKioqKioqKioqKioqKiBNT05JVE9SIFNPQ0tFVCAqKioqKioqKioqKioqL1xuXG4gICAgem1xU29ja2V0LmNvbm5lY3QoYWRkcmVzcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWVzc2FnZVB1Ymxpc2hlcjtcbiIsImNvbnN0IFRyYW5zcG9ydEludGVyZmFjZSA9IHJlcXVpcmUoJy4vVHJhbnNwb3J0SW50ZXJmYWNlJyk7XG5cbi8qKlxuICogVGhpcyBhc3N1bWVzIGl0IGlzIGV4ZWN1dGVkIGluc2lkZSBhIHNhbmRib3ggYW5kIHRoYXQgZXhpc3RzIGFuIG9iamVjdCBcImxvZ2dlclwiIG9uIFwiZ2xvYmFsXCIgd2l0aCBhIG1ldGhvZCBcInNlbmRcIi5cbiAqIFNhbmRib3hlcyBjYW4ndCBjb25uZWN0IGRpcmVjdGx5IHRvIFplcm9NUSB0aGVyZWZvcmUgdGhpcyBqdXN0IHJlbGF5cyB0aGUgbWVzc2FnZSBvdXRzaWRlIHRoZSBzYW5kYm94LlxuICpcbiAqIEBpbXBsZW1lbnRzIFRyYW5zcG9ydEludGVyZmFjZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1lc3NhZ2VQdWJsaXNoZXJGb3JTYW5kYm94KCkge1xuXG4gICAgVHJhbnNwb3J0SW50ZXJmYWNlLmNhbGwodGhpcyk7XG5cbiAgICAvKioqKioqKioqKioqKiBQVUJMSUMgTUVUSE9EUyAqKioqKioqKioqKioqL1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbm5lbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBsb2dPYmplY3RcbiAgICAgKi9cbiAgICB0aGlzLnNlbmQgPSBmdW5jdGlvbiAoY2hhbm5lbCwgbG9nT2JqZWN0KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBnbG9iYWwubG9nZ2VyLnNlbmQoW2NoYW5uZWwsIGxvZ09iamVjdF0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciB3aGlsZSBzZW5kaW5nIG9yIHNlcmlhbGl6aW5nIG1lc3NhZ2UnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlUHVibGlzaGVyRm9yU2FuZGJveDtcbiIsIi8qKlxuICpcbiAqIEBpbnRlcmZhY2VcbiAqL1xuZnVuY3Rpb24gVHJhbnNwb3J0SW50ZXJmYWNlKCkge1xuICAgIHRoaXMuc2VuZCA9IGZ1bmN0aW9uIChjaGFubmVsLCBsb2dPYmplY3QpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNwb3J0SW50ZXJmYWNlO1xuIiwiY29uc3QgVHJhbnNwb3J0SW50ZXJmYWNlID0gcmVxdWlyZSgnLi9UcmFuc3BvcnRJbnRlcmZhY2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgVHJhbnNwb3J0SW50ZXJmYWNlXG59O1xuXG5pZihwcm9jZXNzLmVudi5jb250ZXh0ID09PSAnc2FuZGJveCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cy5NZXNzYWdlUHVibGlzaGVyID0gcmVxdWlyZSgnLi9NZXNzYWdlUHVibGlzaGVyRm9yU2FuZGJveCcpO1xufSBlbHNlIHtcbiAgICBtb2R1bGUuZXhwb3J0cy5NZXNzYWdlUHVibGlzaGVyID0gcmVxdWlyZSgnLi9NZXNzYWdlUHVibGlzaGVyJyk7XG59XG4iLCJjb25zdCB6ZXJvTVEgPSByZXF1aXJlKCd6ZXJvbXEnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgWmVyb01RIFN1YnNjcmliZXIgdGhhdCBsaXN0ZW5zIGZvciBwcm92aWRlZCB0b3BpY3Mgb24gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGZvciBhIHB1Ymxpc2hlclxuICogQHBhcmFtIHtzdHJpbmchfSBhZGRyZXNzIC0gQmFzZSBhZGRyZXNzIGluY2x1ZGluZyBwcm90b2NvbCBhbmQgcG9ydCAoZXg6IHRjcDovLzEyNy4wLjAuMTo4MDgwKVxuICogQHBhcmFtIHtBcnJheTxzdHJpbmc+fGZ1bmN0aW9uP30gc3Vic2NyaXB0aW9ucyAtIGEgbGlzdCBvZiBzdWJzY3JpcHRpb24gdG9waWNzLCBpZiBtaXNzaW5nIGl0IHdpbGwgc3Vic2NyaWJlIHRvIGV2ZXJ5dGhpbmdcbiAqIEBwYXJhbSB7ZnVuY3Rpb24hfSBvbk1lc3NhZ2VDYWxsYmFja1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE1lc3NhZ2VTdWJzY3JpYmVyKGFkZHJlc3MsIHN1YnNjcmlwdGlvbnMsIG9uTWVzc2FnZUNhbGxiYWNrKSB7XG4gICAgY29uc3Qgem1xU29ja2V0ID0gemVyb01RLmNyZWF0ZVNvY2tldCgnc3ViJyk7XG5cbiAgICAvLyB1bmNvbW1lbnQgbmV4dCBsaW5lIGlmIG1lc3NhZ2VzIGFyZSBsb3N0XG4gICAgLy8gem1xU29ja2V0LnNldHNvY2tvcHQoemVyb01RLlpNUV9SQ1ZIV00sIDApO1xuXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiAmJiB0eXBlb2Ygc3Vic2NyaXB0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvbk1lc3NhZ2VDYWxsYmFjayA9IHN1YnNjcmlwdGlvbnM7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMgPSBbJyddO1xuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvbnMuZm9yRWFjaChzdWJzY3JpcHRpb24gPT4gem1xU29ja2V0LnN1YnNjcmliZShzdWJzY3JpcHRpb24pKTtcblxuICAgIHptcVNvY2tldC5jb25uZWN0KGFkZHJlc3MpO1xuXG4gICAgem1xU29ja2V0Lm9uKCdtZXNzYWdlJywgb25NZXNzYWdlQ2FsbGJhY2spO1xuXG4gICAgY29uc3QgZXZlbnRzID0gW1wiU0lHSU5UXCIsIFwiU0lHVVNSMVwiLCBcIlNJR1VTUjJcIiwgXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBcIlNJR1RFUk1cIiwgXCJTSUdIVVBcIl07XG5cbiAgICBldmVudHMuZm9yRWFjaChldmVudCA9PiB7XG4gICAgICAgIHByb2Nlc3Mub24oZXZlbnQsICgpID0+IHtcbiAgICAgICAgICAgIHptcVNvY2tldC5jbG9zZSgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNZXNzYWdlU3Vic2NyaWJlcjtcbiIsImNvbnN0IE1lc3NhZ2VTdWJzY3JpYmVyID0gcmVxdWlyZSgnLi9NZXNzYWdlU3Vic2NyaWJlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtNZXNzYWdlU3Vic2NyaWJlcn07XG4iLCJjb25zdCBMb2dnZXJDbGllbnRNb2R1bGUgPSByZXF1aXJlKCcuLi9Mb2dnZXJDbGllbnQnKTtcblxuY29uc3QgTG9nZ2VyQ2xpZW50ID0gTG9nZ2VyQ2xpZW50TW9kdWxlLkxvZ2dlckNsaWVudDtcbmNvbnN0IExvZ2dlckludGVyZmFjZSA9IExvZ2dlckNsaWVudE1vZHVsZS5Mb2dnZXJJbnRlcmZhY2U7XG5cblxuLyoqXG4gKlxuICogQHBhcmFtIG1lc3NhZ2VQdWJsaXNoZXJcbiAqIEBpbXBsZW1lbnRzIExvZ2dlckludGVyZmFjZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEdlbmVyaWNQU0tMb2dnZXIobWVzc2FnZVB1Ymxpc2hlcikge1xuICAgIExvZ2dlckludGVyZmFjZS5jYWxsKHRoaXMpO1xuXG4gICAgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlckNsaWVudChtZXNzYWdlUHVibGlzaGVyKTtcblxuICAgIGZ1bmN0aW9uIGRlYnVnKC4uLnBhcmFtcykge1xuICAgICAgICBjb25zdCBtZXRhID0gcHJlcGFyZU1ldGEoKTtcbiAgICAgICAgcmV0dXJuIGxvZ2dlci5kZWJ1ZyhtZXRhLCAuLi5wYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVycm9yKC4uLnBhcmFtcykge1xuICAgICAgICBjb25zdCBtZXRhID0gcHJlcGFyZU1ldGEoKTtcbiAgICAgICAgcmV0dXJuIGxvZ2dlci5lcnJvcihtZXRhLCAuLi5wYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluZm8oLi4ucGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcmVwYXJlTWV0YSgpO1xuICAgICAgICByZXR1cm4gbG9nZ2VyLmluZm8obWV0YSwgLi4ucGFyYW1zKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2coLi4ucGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcmVwYXJlTWV0YSgpO1xuICAgICAgICByZXR1cm4gbG9nZ2VyLmxvZyhtZXRhLCAuLi5wYXJhbXMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdhcm4oLi4ucGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcmVwYXJlTWV0YSgpO1xuICAgICAgICByZXR1cm4gbG9nZ2VyLndhcm4obWV0YSwgLi4ucGFyYW1zKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBldmVudChldmVudCwgLi4ucGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBwcmVwYXJlTWV0YSgpO1xuICAgICAgICByZXR1cm4gbG9nZ2VyLmV2ZW50KGV2ZW50LCBtZXRhLCBwYXJhbXMpO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiByZWRpcmVjdChsb2dUeXBlLCBsb2dPYmplY3QpIHtcbiAgICAgICAgY29uc3QgbG9nTWV0YSA9IGxvZ09iamVjdC5tZXRhO1xuICAgICAgICBjb25zdCBtZXRhID0gcHJlcGFyZU1ldGEoKTtcbiAgICAgICAgXG4gICAgICAgIE9iamVjdC5hc3NpZ24obWV0YSwgbG9nTWV0YSk7XG5cbiAgICAgICAgbG9nT2JqZWN0Lm1ldGEgPSBtZXRhO1xuXG4gICAgICAgIHJldHVybiBsb2dnZXIucmVkaXJlY3QobG9nVHlwZSwgbG9nT2JqZWN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlTWV0YSgpIHtcbiAgICAgICAgaWYgKGdsb2JhbC4kJC5nZXRFbnZpcm9ubWVudERhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWwuJCQuZ2V0RW52aXJvbm1lbnREYXRhKCk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7fTtcbiAgICB9XG5cblxuICAgIHRoaXMuZGVidWcgICAgPSBkZWJ1ZztcbiAgICB0aGlzLmVycm9yICAgID0gZXJyb3I7XG4gICAgdGhpcy5ldmVudCAgICA9IGV2ZW50O1xuICAgIHRoaXMuaW5mbyAgICAgPSBpbmZvO1xuICAgIHRoaXMubG9nICAgICAgPSBsb2c7XG4gICAgdGhpcy5yZWRpcmVjdCA9IHJlZGlyZWN0O1xuICAgIHRoaXMud2FybiAgICAgPSB3YXJuO1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gR2VuZXJpY1BTS0xvZ2dlcjtcbiIsImNvbnN0IENvbmZpZ3VyYXRvciAgICAgPSByZXF1aXJlKCcuLi91dGlscy9Db25maWd1cmF0b3InKTtcbmNvbnN0IEdlbmVyaWNQU0tMb2dnZXIgPSByZXF1aXJlKCcuL0dlbmVyaWNQU0tMb2dnZXInKTtcbmNvbnN0IE1lc3NhZ2VQdWJsaXNoZXIgPSByZXF1aXJlKCcuLi9NZXNzYWdlUHVibGlzaGVyJykuTWVzc2FnZVB1Ymxpc2hlcjtcblxuZnVuY3Rpb24gZ2V0TG9nZ2VyKCkge1xuICAgIGxldCBtZXNzYWdlUHVibGlzaGVyO1xuXG4gICAgaWYgKHByb2Nlc3MuZW52LmNvbnRleHQgPT09ICdzYW5kYm94Jykge1xuXG4gICAgICAgIG1lc3NhZ2VQdWJsaXNoZXIgPSBuZXcgTWVzc2FnZVB1Ymxpc2hlcigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IENvbmZpZ3VyYXRvci5nZXRDb25maWcoKTtcbiAgICAgICAgbWVzc2FnZVB1Ymxpc2hlciA9IG5ldyBNZXNzYWdlUHVibGlzaGVyKGNvbmZpZy5hZGRyZXNzRm9yUHVibGlzaGVycyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBHZW5lcmljUFNLTG9nZ2VyKG1lc3NhZ2VQdWJsaXNoZXIpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRMb2dnZXJcbn07XG4iLCJjb25zdCB6ZXJvTVEgPSByZXF1aXJlKCd6ZXJvbXEnKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMnKTtcblxuLyoqXG4gKiBQcm94eSBiZXR3ZWVuIHB1Ymxpc2hlcnMgYW5kIHN1YnNjcmliZXJzIHRvIGF2b2lkIHN0YXIgdG9wb2xvZ3kgY29tbXVuaWNhdGlvblxuICogU3Vic2NyaWJlcnMgc2hvdWxkIGNvbm5lY3QgZmlyc3Qgb3RoZXJ3aXNlIG5vIHN1YnNjcmlwdGlvbiByZXF1ZXN0IHdpbGwgYmUgc2VudCB0byBwdWJsaXNoZXJzIGFuZCB0aGVyZWZvcmUgdGhleVxuICogd29uJ3QgZXZlbiBzZW5kIHRoZSBtZXNzYWdlcyB0byB0aGUgcHJveHkuIFRoaXMgaXMgYmVjYXVzZSB0aGUgZmlsdGVyaW5nIGlzIGRvbmUgb24gdGhlIHB1Ymxpc2hlciBmb3IgdGNwIG9yIGlwYyxcbiAqIHZpZXcgaHR0cDovL3pndWlkZS56ZXJvbXEub3JnL3BhZ2U6YWxsI0dldHRpbmctdGhlLU1lc3NhZ2UtT3V0IGZvciBtb3JlIGluZm9cbiAqIEBwYXJhbSB7c3RyaW5nIX0gYWRkcmVzc0ZvclB1Ymxpc2hlcnMgLSBCYXNlIGFkZHJlc3MgaW5jbHVkaW5nIHByb3RvY29sIGFuZCBwb3J0IChleDogdGNwOi8vMTI3LjAuMC4xOjgwODApXG4gKiBAcGFyYW0ge3N0cmluZyF9IGFkZHJlc3NGb3JTdWJzY3JpYmVycyAtIEJhc2UgYWRkcmVzcyBpbmNsdWRpbmcgcHJvdG9jb2wgYW5kIHBvcnQgKGV4OiB0Y3A6Ly8xMjcuMC4wLjE6ODA4MClcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQdWJTdWJQcm94eSh7YWRkcmVzc0ZvclB1Ymxpc2hlcnMsIGFkZHJlc3NGb3JTdWJzY3JpYmVyc30pIHtcbiAgICBjb25zdCBmcm9udGVuZCA9IHplcm9NUS5jcmVhdGVTb2NrZXQoJ3hzdWInKTtcbiAgICBjb25zdCBiYWNrZW5kID0gemVyb01RLmNyZWF0ZVNvY2tldCgneHB1YicpO1xuICAgIGNvbnN0IGJ1ZmZlcmVkQmFja2VuZCA9IG5ldyB1dGlscy5CdWZmZXJlZFNvY2tldChiYWNrZW5kLCB1dGlscy5Tb2NrZXRUeXBlLmJpbmRhYmxlKTtcblxuICAgIC8vIEJ5IGRlZmF1bHQgeHB1YiBvbmx5IHNpZ25hbHMgbmV3IHN1YnNjcmlwdGlvbnNcbiAgICAvLyBTZXR0aW5ncyBpdCB0byB2ZXJib3NlID0gMSAsIHdpbGwgc2lnbmFsIG9uIGV2ZXJ5IG5ldyBzdWJzY3JpYmVcbiAgICAvLyB1bmNvbW1lbnQgbmV4dCBsaW5lcyBpZiBtZXNzYWdlcyBhcmUgbG9zdFxuICAgIC8vIGJhY2tlbmQuc2V0c29ja29wdCh6ZXJvTVEuWk1RX1hQVUJfVkVSQk9TRSwgMSk7XG4gICAgLy8gYmFja2VuZC5zZXRzb2Nrb3B0KHplcm9NUS5aTVFfU05ESFdNLCAwKTtcbiAgICAvLyBiYWNrZW5kLnNldHNvY2tvcHQoemVyb01RLlpNUV9SQ1ZIV00sIDApO1xuICAgIC8vIGZyb250ZW5kLnNldHNvY2tvcHQoemVyb01RLlpNUV9SQ1ZIV00sIDApO1xuICAgIC8vIGZyb250ZW5kLnNldHNvY2tvcHQoemVyb01RLlpNUV9TTkRIV00sIDApO1xuXG4gICAgLy8gV2hlbiB3ZSByZWNlaXZlIGRhdGEgb24gZnJvbnRlbmQsIGl0IG1lYW5zIHNvbWVvbmUgaXMgcHVibGlzaGluZ1xuICAgIGZyb250ZW5kLm9uKCdtZXNzYWdlJywgKC4uLmFyZ3MpID0+IHtcbiAgICAgICAgLy8gV2UganVzdCByZWxheSBpdCB0byB0aGUgYmFja2VuZCwgc28gc3Vic2NyaWJlcnMgY2FuIHJlY2VpdmUgaXRcbiAgICAgICAgYnVmZmVyZWRCYWNrZW5kLnNlbmQoYXJncyk7XG4gICAgfSk7XG5cbiAgICAvLyBXaGVuIGJhY2tlbmQgcmVjZWl2ZXMgYSBtZXNzYWdlLCBpdCdzIHN1YnNjcmliZSByZXF1ZXN0c1xuICAgIGJhY2tlbmQub24oJ21lc3NhZ2UnLCAoZGF0YSkgPT4ge1xuICAgICAgICAvLyBXZSBzZW5kIGl0IHRvIGZyb250ZW5kLCBzbyBpdCBrbm93cyB0byB3aGF0IGNoYW5uZWxzIHRvIGxpc3RlbiB0b1xuICAgICAgICBmcm9udGVuZC5zZW5kKGRhdGEpO1xuICAgIH0pO1xuXG4gICAgLyoqKioqKioqKioqKiogTU9OSVRPUiBTT0NLRVQgKioqKioqKioqKioqKi9cblxuICAgIGZyb250ZW5kLmJpbmRTeW5jKGFkZHJlc3NGb3JQdWJsaXNoZXJzKTtcbiAgICBiYWNrZW5kLmJpbmRTeW5jKGFkZHJlc3NGb3JTdWJzY3JpYmVycyk7XG5cbiAgICBjb25zdCBldmVudHMgPSBbXCJTSUdJTlRcIiwgXCJTSUdVU1IxXCIsIFwiU0lHVVNSMlwiLCBcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIFwiU0lHVEVSTVwiLCBcIlNJR0hVUFwiXTtcblxuICAgIGV2ZW50cy5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgICAgcHJvY2Vzcy5vbihldmVudCwgKCkgPT4ge1xuICAgICAgICAgICAgZnJvbnRlbmQuY2xvc2UoKTtcbiAgICAgICAgICAgIGJhY2tlbmQuY2xvc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHViU3ViUHJveHk7XG4iLCJjb25zdCBQdWJTdWJQcm94eSA9IHJlcXVpcmUoJy4vUHViU3ViUHJveHknKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7UHViU3ViUHJveHl9O1xuIiwiY29uc3QgU29ja2V0VHlwZSA9IHJlcXVpcmUoJy4vU29ja2V0VHlwZScpO1xuXG4vKipcbiAqIFdyYXBwZXIgZm9yIFplcm9NUSBzb2NrZXQgdGhhdCB0cmllcyB0byBwcmV2ZW50ICdzbG93IGpvaW5lcicsIG1lYW5pbmcgaXQgYnVmZmVycyB0aGUgZmlyc3QgbWVzc2FnZXMgdW50aWwgdGhlXG4gKiBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkLCBvdGhlcndpc2UgdGhlIGZpcnN0IG1lc3NhZ2VzIHdvdWxkIGJlIGxvc3RcbiAqIEBwYXJhbSB7U29ja2V0fSBzb2NrZXQgLSBpbnN0YW5jZSBvZiBaZXJvTVEgU29ja2V0XG4gKiBAcGFyYW0ge1NvY2tldFR5cGU8bnVtYmVyPn0gdHlwZSAtIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHNob3VsZCBsaXN0ZW4gZm9yICdjb25uZWN0JyBvciAnYWNjZXB0JyBldmVudFxuICogQHBhcmFtIHtOdW1iZXI/fSBtYXhTaXplID0gMTAwMCAtIE1heCBzaXplIGZvciB0aGUgaW50ZXJuYWwgYnVmZmVyLCBpZiAwIHRoZSBidWZmZXIgaXMgaW5maW5pdGUgYnV0IGNhbiBjYXVzZSBtZW1vcnkgbGVha1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlcmVkU29ja2V0KHNvY2tldCwgdHlwZSwgbWF4U2l6ZSA9IDEwMDAwKSB7XG4gICAgaWYobWF4U2l6ZSA8IDApIHtcbiAgICAgICAgbWF4U2l6ZSA9IDEwMDA7XG4gICAgfVxuXG4gICAgbGV0IG1lc3NhZ2VRdWV1ZSA9IFtdO1xuICAgIGxldCBpc0Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIGxldCBjdXJyZW50QnVmZmVyU2l6ZSA9IDA7XG5cbiAgICBzb2NrZXQubW9uaXRvcigpO1xuICAgIGNvbnN0IGV2ZW50ID0gX2dldEV2ZW50Rm9yVHlwZSh0eXBlKTtcblxuICAgIHNvY2tldC5vbihldmVudCwgKCkgPT4ge1xuICAgICAgICBpc0Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgIF9mbHVzaFF1ZXVlKCk7XG4gICAgfSk7XG5cbiAgICAvKioqKioqKioqKioqKiBQVUJMSUMgTUVUSE9EUyAqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gc2VuZChtZXNzYWdlKSB7XG4gICAgICAgIGlmICghaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIGlmIChtYXhTaXplICE9PSAwICYmIGN1cnJlbnRCdWZmZXJTaXplIDwgbWF4U2l6ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRCdWZmZXJTaXplICs9IDE7XG4gICAgICAgICAgICAgICAgbWVzc2FnZVF1ZXVlLnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb2NrZXQuc2VuZChtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKioqKioqKioqKioqIFBSSVZBVEUgTUVUSE9EUyAqKioqKioqKioqKioqL1xuXG4gICAgZnVuY3Rpb24gX2ZsdXNoUXVldWUoKSB7XG4gICAgICAgIGZvciAoY29uc3QgbWVzc2FnZSBvZiBtZXNzYWdlUXVldWUpIHtcbiAgICAgICAgICAgIHNvY2tldC5zZW5kKG1lc3NhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZVF1ZXVlID0gW107XG4gICAgICAgIGN1cnJlbnRCdWZmZXJTaXplID0gMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfZ2V0RXZlbnRGb3JUeXBlKHR5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IFNvY2tldFR5cGUuY29ubmVjdGFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnY29ubmVjdCc7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gU29ja2V0VHlwZS5iaW5kYWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuICdhY2NlcHQnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqKioqKioqKioqKiogRVhQT1JUUyAqKioqKioqKioqKioqL1xuXG4gICAgdGhpcy5zZW5kID0gc2VuZDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlcmVkU29ja2V0O1xuIiwiY29uc3QgY29uZmlnID0ge1xuICAgIGFkZHJlc3NGb3JQdWJsaXNoZXJzOiAndGNwOi8vMTI3LjAuMC4xOjcwMDAnLFxuICAgIGFkZHJlc3NGb3JTdWJzY3JpYmVyczogJ3RjcDovLzEyNy4wLjAuMTo3MDAxJyxcbiAgICBhZGRyZXNzRm9yQ29sbGVjdG9yOiAndGNwOi8vMTI3LjAuMC4xOjU1NTgnXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRDb25maWcgKCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShjb25maWcpO1xuICAgIH1cbn07XG4iLCJcblxuZnVuY3Rpb24gZ2V0RW52aXJvbm1lbnREYXRhICgpIHtcbiAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuICAgIGNvbnN0IG9zID0gcmVxdWlyZSgnb3MnKTtcbiAgICBjb25zdCBwbGF0Zm9ybSA9IG9zLnBsYXRmb3JtKCk7XG5cbiAgICBjb25zdCBwcm9jZXNzUGF0aCA9IHByb2Nlc3MuYXJndlsxXTtcbiAgICBjb25zdCBsYXN0U2VwID0gcHJvY2Vzc1BhdGgubGFzdEluZGV4T2YocGF0aC5zZXApO1xuICAgIGNvbnN0IHByb2Nlc3NTdGFydEZpbGUgPSBwcm9jZXNzUGF0aC5zdWJzdHJpbmcobGFzdFNlcCArIDEpO1xuICAgIHJldHVybiB7XG4gICAgICAgIG9yaWdpbjogJ25vZGUnLFxuICAgICAgICBjb250ZXh0OiBwcm9jZXNzU3RhcnRGaWxlLFxuICAgICAgICBwcm9jZXNzU3RhcnRGaWxlOiBwcm9jZXNzU3RhcnRGaWxlLFxuICAgICAgICBwbGF0Zm9ybTogcGxhdGZvcm1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRFbnZpcm9ubWVudERhdGFGb3JEb21haW4oKSB7XG4gICAgY29uc3Qgb3MgPSByZXF1aXJlKCdvcycpO1xuICAgIGNvbnN0IHBsYXRmb3JtID0gb3MucGxhdGZvcm0oKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIG9yaWdpbjogJ2RvbWFpbicsXG4gICAgICAgIGRvbWFpbjogcHJvY2Vzcy5lbnYuUFJJVkFURVNLWV9ET01BSU5fTkFNRSxcbiAgICAgICAgcGxhdGZvcm06IHBsYXRmb3JtXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRFbnZpcm9ubWVudERhdGFGb3JBZ2VudCgpIHtcbiAgICBjb25zdCBvcyA9IHJlcXVpcmUoJ29zJyk7XG4gICAgY29uc3QgcGxhdGZvcm0gPSBvcy5wbGF0Zm9ybSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3JpZ2luOiAnYWdlbnQnLFxuICAgICAgICBkb21haW46IHByb2Nlc3MuZW52LlBSSVZBVEVTS1lfRE9NQUlOX05BTUUsXG4gICAgICAgIGFnZW50OiBwcm9jZXNzLmVudi5QUklWQVRFU0tZX0FHRU5UX05BTUUsXG4gICAgICAgIHBsYXRmb3JtOiBwbGF0Zm9ybVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2V0RW52aXJvbm1lbnREYXRhRm9yU2FuZGJveCgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBvcmlnaW46ICdzYW5kYm94J1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0RW52aXJvbm1lbnREYXRhLFxuICAgIGdldEVudmlyb25tZW50RGF0YUZvckFnZW50LFxuICAgIGdldEVudmlyb25tZW50RGF0YUZvckRvbWFpbixcbiAgICBnZXRFbnZpcm9ubWVudERhdGFGb3JTYW5kYm94XG59O1xuIiwiY29uc3QgTG9nTGV2ZWwgPSB7fTtcblxuTG9nTGV2ZWxbTG9nTGV2ZWxbXCJlcnJvclwiXSA9IDBdID0gXCJlcnJvclwiO1xuTG9nTGV2ZWxbTG9nTGV2ZWxbXCJ3YXJuXCJdICA9IDFdID0gXCJ3YXJuXCI7XG5Mb2dMZXZlbFtMb2dMZXZlbFtcImluZm9cIl0gID0gMl0gPSBcImluZm9cIjtcbkxvZ0xldmVsW0xvZ0xldmVsW1wiZGVidWdcIl0gPSAzXSA9IFwiZGVidWdcIjtcbkxvZ0xldmVsW0xvZ0xldmVsW1wibG9nXCJdICAgPSA0XSA9IFwibG9nXCI7XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmZyZWV6ZShMb2dMZXZlbCk7XG4iLCJjb25zdCBTb2NrZXRUeXBlID0ge307XG5Tb2NrZXRUeXBlW1NvY2tldFR5cGVbXCJjb25uZWN0YWJsZVwiXSA9IDBdID0gXCJjb25uZWN0YWJsZVwiOyAvLyBpZiAuY29ubmVjdCBpcyBjYWxsZWQgb24gc29ja2V0XG5Tb2NrZXRUeXBlW1NvY2tldFR5cGVbXCJiaW5kYWJsZVwiXSA9IDFdID0gXCJiaW5kYWJsZVwiOyAvLyBpZiAuYmluZCBpcyBjYWxsZWQgb24gc29ja2V0XG5cbm1vZHVsZS5leHBvcnRzID0gT2JqZWN0LmZyZWV6ZShTb2NrZXRUeXBlKTtcbiIsImNvbnN0IENvbmZpZ3VyYXRvciAgICAgICAgICAgID0gcmVxdWlyZSgnLi9Db25maWd1cmF0b3InKTtcbmNvbnN0IEVudmlyb25tZW50RGF0YVByb3ZpZGVyID0gcmVxdWlyZSgnLi9FbnZpcm9ubWVudERhdGFQcm92aWRlcicpO1xuY29uc3QgTG9nTGV2ZWwgICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuL0xvZ0xldmVsJyk7XG5jb25zdCBCdWZmZXJlZFNvY2tldCAgICAgICAgICA9IHJlcXVpcmUoJy4vQnVmZmVyZWRTb2NrZXQnKTtcbmNvbnN0IFNvY2tldFR5cGUgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi9Tb2NrZXRUeXBlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIENvbmZpZ3VyYXRvcixcbiAgICBFbnZpcm9ubWVudERhdGFQcm92aWRlcixcbiAgICBMb2dMZXZlbCxcbiAgICBCdWZmZXJlZFNvY2tldCxcbiAgICBTb2NrZXRUeXBlXG59O1xuIiwiLypcbkluaXRpYWwgTGljZW5zZTogKGMpIEF4aW9sb2dpYyBSZXNlYXJjaCAmIEFsYm9haWUgU8OubmljxIMuXG5Db250cmlidXRvcnM6IEF4aW9sb2dpYyBSZXNlYXJjaCAsIFByaXZhdGVTa3kgcHJvamVjdFxuQ29kZSBMaWNlbnNlOiBMR1BMIG9yIE1JVC5cbiovXG5cblxuLyoqXG4gKiAgIFVzdWFsbHkgYW4gZXZlbnQgY291bGQgY2F1c2UgZXhlY3V0aW9uIG9mIG90aGVyIGNhbGxiYWNrIGV2ZW50cyAuIFdlIHNheSB0aGF0IGlzIGEgbGV2ZWwgMSBldmVudCBpZiBpcyBjYXVzZWVkIGJ5IGEgbGV2ZWwgMCBldmVudCBhbmQgc28gb25cbiAqXG4gKiAgICAgIFNvdW5kUHViU3ViIHByb3ZpZGVzIGludHVpdGl2ZSByZXN1bHRzIHJlZ2FyZGluZyB0byBhc3luY2hyb25vdXMgY2FsbHMgb2YgY2FsbGJhY2tzIGFuZCBjb21wdXRlZCB2YWx1ZXMvZXhwcmVzc2lvbnM6XG4gKiAgIHdlIHByZXZlbnQgaW1tZWRpYXRlIGV4ZWN1dGlvbiBvZiBldmVudCBjYWxsYmFja3MgdG8gZW5zdXJlIHRoZSBpbnR1aXRpdmUgZmluYWwgcmVzdWx0IGlzIGd1YXJhbnRlZWQgYXMgbGV2ZWwgMCBleGVjdXRpb25cbiAqICAgd2UgZ3VhcmFudGVlIHRoYXQgYW55IGNhbGxiYWNrIGZ1bmN0aW9uIGlzIFwicmUtZW50cmFudFwiXG4gKiAgIHdlIGFyZSBhbHNvIHRyeWluZyB0byByZWR1Y2UgdGhlIG51bWJlciBvZiBjYWxsYmFjayBleGVjdXRpb24gYnkgbG9va2luZyBpbiBxdWV1ZXMgYXQgbmV3IG1lc3NhZ2VzIHB1Ymxpc2hlZCBieVxuICogICB0cnlpbmcgdG8gY29tcGFjdCB0aG9zZSBtZXNzYWdlcyAocmVtb3ZpbmcgZHVwbGljYXRlIG1lc3NhZ2VzLCBtb2RpZnlpbmcgbWVzc2FnZXMsIG9yIGFkZGluZyBpbiB0aGUgaGlzdG9yeSBvZiBhbm90aGVyIGV2ZW50ICxldGMpXG4gKlxuICogICAgICBFeGFtcGxlIG9mIHdoYXQgY2FuIGJlIHdyb25nIHdpdGhvdXQgbm9uLXNvdW5kIGFzeW5jaHJvbm91cyBjYWxsczpcbiAqXG4gKiAgU3RlcCAwOiBJbml0aWFsIHN0YXRlOlxuICogICBhID0gMDtcbiAqICAgYiA9IDA7XG4gKlxuICogIFN0ZXAgMTogSW5pdGlhbCBvcGVyYXRpb25zOlxuICogICBhID0gMTtcbiAqICAgYiA9IC0xO1xuICpcbiAqICAvLyBhbiBvYnNlcnZlciByZWFjdHMgdG8gY2hhbmdlcyBpbiBhIGFuZCBiIGFuZCBjb21wdXRlIENPUlJFQ1QgbGlrZSB0aGlzOlxuICogICBpZiggYSArIGIgPT0gMCkge1xuICogICAgICAgQ09SUkVDVCA9IGZhbHNlO1xuICogICAgICAgbm90aWZ5KC4uLik7IC8vIGFjdCBvciBzZW5kIGEgbm90aWZpY2F0aW9uIHNvbWV3aGVyZS4uXG4gKiAgIH0gZWxzZSB7XG4gKiAgICAgIENPUlJFQ1QgPSBmYWxzZTtcbiAqICAgfVxuICpcbiAqICAgIE5vdGljZSB0aGF0OiBDT1JSRUNUIHdpbGwgYmUgdHJ1ZSBpbiB0aGUgZW5kICwgYnV0IG1lYW50aW1lLCBhZnRlciBhIG5vdGlmaWNhdGlvbiB3YXMgc2VudCBhbmQgQ09SUkVDVCB3YXMgd3JvbmdseSwgdGVtcG9yYXJpbHkgZmFsc2UhXG4gKiAgICBzb3VuZFB1YlN1YiBndWFyYW50ZWUgdGhhdCB0aGlzIGRvZXMgbm90IGhhcHBlbiBiZWNhdXNlIHRoZSBzeW5jcm9ub3VzIGNhbGwgd2lsbCBiZWZvcmUgYW55IG9ic2VydmVyIChib3QgYXNpZ25hdGlvbiBvbiBhIGFuZCBiKVxuICpcbiAqICAgTW9yZTpcbiAqICAgeW91IGNhbiB1c2UgYmxvY2tDYWxsQmFja3MgYW5kIHJlbGVhc2VDYWxsQmFja3MgaW4gYSBmdW5jdGlvbiB0aGF0IGNoYW5nZSBhIGxvdCBhIGNvbGxlY3Rpb24gb3IgYmluZGFibGUgb2JqZWN0cyBhbmQgYWxsXG4gKiAgIHRoZSBub3RpZmljYXRpb25zIHdpbGwgYmUgc2VudCBjb21wYWN0ZWQgYW5kIHByb3Blcmx5XG4gKi9cblxuLy8gVE9ETzogb3B0aW1pc2F0aW9uIT8gdXNlIGEgbW9yZSBlZmZpY2llbnQgcXVldWUgaW5zdGVhZCBvZiBhcnJheXMgd2l0aCBwdXNoIGFuZCBzaGlmdCE/XG4vLyBUT0RPOiBzZWUgaG93IGJpZyB0aG9zZSBxdWV1ZXMgY2FuIGJlIGluIHJlYWwgYXBwbGljYXRpb25zXG4vLyBmb3IgYSBmZXcgaHVuZHJlZHMgaXRlbXMsIHF1ZXVlcyBtYWRlIGZyb20gYXJyYXkgc2hvdWxkIGJlIGVub3VnaFxuLy8qICAgUG90ZW50aWFsIFRPRE9zOlxuLy8gICAgKiAgICAgcHJldmVudCBhbnkgZm9ybSBvZiBwcm9ibGVtIGJ5IGNhbGxpbmcgY2FsbGJhY2tzIGluIHRoZSBleHBlY3RlZCBvcmRlciAhP1xuLy8qICAgICBwcmV2ZW50aW5nIGluZmluaXRlIGxvb3BzIGV4ZWN1dGlvbiBjYXVzZSBieSBldmVudHMhP1xuLy8qXG4vLypcbi8vIFRPRE86IGRldGVjdCBpbmZpbml0ZSBsb29wcyAob3IgdmVyeSBkZWVwIHByb3BhZ2F0aW9uKSBJdCBpcyBwb3NzaWJsZSE/XG5cbmNvbnN0IFF1ZXVlID0gcmVxdWlyZSgnc3dhcm11dGlscycpLlF1ZXVlO1xuXG5mdW5jdGlvbiBTb3VuZFB1YlN1Yigpe1xuXG5cdC8qKlxuXHQgKiBwdWJsaXNoXG5cdCAqICAgICAgUHVibGlzaCBhIG1lc3NhZ2Uge09iamVjdH0gdG8gYSBsaXN0IG9mIHN1YnNjcmliZXJzIG9uIGEgc3BlY2lmaWMgdG9waWNcblx0ICpcblx0ICogQHBhcmFtcyB7U3RyaW5nfE51bWJlcn0gdGFyZ2V0LCAge09iamVjdH0gbWVzc2FnZVxuXHQgKiBAcmV0dXJuIG51bWJlciBvZiBjaGFubmVsIHN1YnNjcmliZXJzIHRoYXQgd2lsbCBiZSBub3RpZmllZFxuXHQgKi9cblx0dGhpcy5wdWJsaXNoID0gZnVuY3Rpb24odGFyZ2V0LCBtZXNzYWdlKXtcblx0XHRpZighaW52YWxpZENoYW5uZWxOYW1lKHRhcmdldCkgJiYgIWludmFsaWRNZXNzYWdlVHlwZShtZXNzYWdlKSAmJiAodHlwZW9mIGNoYW5uZWxTdWJzY3JpYmVyc1t0YXJnZXRdICE9ICd1bmRlZmluZWQnKSl7XG5cdFx0XHRjb21wYWN0QW5kU3RvcmUodGFyZ2V0LCBtZXNzYWdlKTtcblx0XHRcdHNldFRpbWVvdXQoZGlzcGF0Y2hOZXh0LCAwKTtcblx0XHRcdHJldHVybiBjaGFubmVsU3Vic2NyaWJlcnNbdGFyZ2V0XS5sZW5ndGg7XG5cdFx0fSBlbHNle1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBzdWJzY3JpYmVcblx0ICogICAgICBTdWJzY3JpYmUgLyBhZGQgYSB7RnVuY3Rpb259IGNhbGxCYWNrIG9uIGEge1N0cmluZ3xOdW1iZXJ9dGFyZ2V0IGNoYW5uZWwgc3Vic2NyaWJlcnMgbGlzdCBpbiBvcmRlciB0byByZWNlaXZlXG5cdCAqICAgICAgbWVzc2FnZXMgcHVibGlzaGVkIGlmIHRoZSBjb25kaXRpb25zIGRlZmluZWQgYnkge0Z1bmN0aW9ufXdhaXRGb3JNb3JlIGFuZCB7RnVuY3Rpb259ZmlsdGVyIGFyZSBwYXNzZWQuXG5cdCAqXG5cdCAqIEBwYXJhbXMge1N0cmluZ3xOdW1iZXJ9dGFyZ2V0LCB7RnVuY3Rpb259Y2FsbEJhY2ssIHtGdW5jdGlvbn13YWl0Rm9yTW9yZSwge0Z1bmN0aW9ufWZpbHRlclxuXHQgKlxuXHQgKiAgICAgICAgICB0YXJnZXQgICAgICAtIGNoYW5uZWwgbmFtZSB0byBzdWJzY3JpYmVcblx0ICogICAgICAgICAgY2FsbGJhY2sgICAgLSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBhIG1lc3NhZ2Ugd2FzIHB1Ymxpc2hlZCBvbiB0aGUgY2hhbm5lbFxuXHQgKiAgICAgICAgICB3YWl0Rm9yTW9yZSAtIGEgaW50ZXJtZWRpYXJ5IGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSBjYWxsZWQgYWZ0ZXIgYSBzdWNjZXNzZnVseSBtZXNzYWdlIGRlbGl2ZXJ5IGluIG9yZGVyXG5cdCAqICAgICAgICAgICAgICAgICAgICAgICAgICB0byBkZWNpZGUgaWYgYSBuZXcgbWVzc2FnZXMgaXMgZXhwZWN0ZWQuLi5cblx0ICogICAgICAgICAgZmlsdGVyICAgICAgLSBhIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIG1lc3NhZ2UgYmVmb3JlIGludm9jYXRpb24gb2YgY2FsbGJhY2sgZnVuY3Rpb24gaW4gb3JkZXIgdG8gYWxsb3dcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW50IG1lc3NhZ2UgYmVmb3JlIGVudGVyaW5nIGluIG5vcm1hbCBjYWxsYmFjayBmbG93XG5cdCAqIEByZXR1cm5cblx0ICovXG5cdHRoaXMuc3Vic2NyaWJlID0gZnVuY3Rpb24odGFyZ2V0LCBjYWxsQmFjaywgd2FpdEZvck1vcmUsIGZpbHRlcil7XG5cdFx0aWYoIWludmFsaWRDaGFubmVsTmFtZSh0YXJnZXQpICYmICFpbnZhbGlkRnVuY3Rpb24oY2FsbEJhY2spKXtcblx0XHRcdHZhciBzdWJzY3JpYmVyID0ge1wiY2FsbEJhY2tcIjpjYWxsQmFjaywgXCJ3YWl0Rm9yTW9yZVwiOndhaXRGb3JNb3JlLCBcImZpbHRlclwiOmZpbHRlcn07XG5cdFx0XHR2YXIgYXJyID0gY2hhbm5lbFN1YnNjcmliZXJzW3RhcmdldF07XG5cdFx0XHRpZih0eXBlb2YgYXJyID09ICd1bmRlZmluZWQnKXtcblx0XHRcdFx0YXJyID0gW107XG5cdFx0XHRcdGNoYW5uZWxTdWJzY3JpYmVyc1t0YXJnZXRdID0gYXJyO1xuXHRcdFx0fVxuXHRcdFx0YXJyLnB1c2goc3Vic2NyaWJlcik7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiB1bnN1YnNjcmliZVxuXHQgKiAgICAgIFVuc3Vic2NyaWJlL3JlbW92ZSB7RnVuY3Rpb259IGNhbGxCYWNrIGZyb20gdGhlIGxpc3Qgb2Ygc3Vic2NyaWJlcnMgb2YgdGhlIHtTdHJpbmd8TnVtYmVyfSB0YXJnZXQgY2hhbm5lbFxuXHQgKlxuXHQgKiBAcGFyYW1zIHtTdHJpbmd8TnVtYmVyfSB0YXJnZXQsIHtGdW5jdGlvbn0gY2FsbEJhY2ssIHtGdW5jdGlvbn0gZmlsdGVyXG5cdCAqXG5cdCAqICAgICAgICAgIHRhcmdldCAgICAgIC0gY2hhbm5lbCBuYW1lIHRvIHVuc3Vic2NyaWJlXG5cdCAqICAgICAgICAgIGNhbGxiYWNrICAgIC0gcmVmZXJlbmNlIG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB0aGF0IHdhcyB1c2VkIGFzIHN1YnNjcmliZVxuXHQgKiAgICAgICAgICBmaWx0ZXIgICAgICAtIHJlZmVyZW5jZSBvZiB0aGUgb3JpZ2luYWwgZmlsdGVyIGZ1bmN0aW9uXG5cdCAqIEByZXR1cm5cblx0ICovXG5cdHRoaXMudW5zdWJzY3JpYmUgPSBmdW5jdGlvbih0YXJnZXQsIGNhbGxCYWNrLCBmaWx0ZXIpe1xuXHRcdGlmKCFpbnZhbGlkRnVuY3Rpb24oY2FsbEJhY2spKXtcblx0XHRcdHZhciBnb3RpdCA9IGZhbHNlO1xuXHRcdFx0aWYoY2hhbm5lbFN1YnNjcmliZXJzW3RhcmdldF0pe1xuXHRcdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgY2hhbm5lbFN1YnNjcmliZXJzW3RhcmdldF0ubGVuZ3RoO2krKyl7XG5cdFx0XHRcdFx0dmFyIHN1YnNjcmliZXIgPSAgY2hhbm5lbFN1YnNjcmliZXJzW3RhcmdldF1baV07XG5cdFx0XHRcdFx0aWYoc3Vic2NyaWJlci5jYWxsQmFjayA9PT0gY2FsbEJhY2sgJiYgKCB0eXBlb2YgZmlsdGVyID09PSAndW5kZWZpbmVkJyB8fCBzdWJzY3JpYmVyLmZpbHRlciA9PT0gZmlsdGVyICkpe1xuXHRcdFx0XHRcdFx0Z290aXQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0c3Vic2NyaWJlci5mb3JEZWxldGUgPSB0cnVlO1xuXHRcdFx0XHRcdFx0c3Vic2NyaWJlci5jYWxsQmFjayA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRcdHN1YnNjcmliZXIuZmlsdGVyID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYoIWdvdGl0KXtcblx0XHRcdFx0d3ByaW50KFwiVW5hYmxlIHRvIHVuc3Vic2NyaWJlIGEgY2FsbGJhY2sgdGhhdCB3YXMgbm90IHN1YnNjcmliZWQhXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogYmxvY2tDYWxsQmFja3Ncblx0ICpcblx0ICogQHBhcmFtc1xuXHQgKiBAcmV0dXJuXG5cdCAqL1xuXHR0aGlzLmJsb2NrQ2FsbEJhY2tzID0gZnVuY3Rpb24oKXtcblx0XHRsZXZlbCsrO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiByZWxlYXNlQ2FsbEJhY2tzXG5cdCAqXG5cdCAqIEBwYXJhbXNcblx0ICogQHJldHVyblxuXHQgKi9cblx0dGhpcy5yZWxlYXNlQ2FsbEJhY2tzID0gZnVuY3Rpb24oKXtcblx0XHRsZXZlbC0tO1xuXHRcdC8vaGFjay9vcHRpbWlzYXRpb24gdG8gbm90IGZpbGwgdGhlIHN0YWNrIGluIGV4dHJlbWUgY2FzZXMgKG1hbnkgZXZlbnRzIGNhdXNlZCBieSBsb29wcyBpbiBjb2xsZWN0aW9ucyxldGMpXG5cdFx0d2hpbGUobGV2ZWwgPT09IDAgJiYgZGlzcGF0Y2hOZXh0KHRydWUpKXtcblx0XHRcdC8vbm90aGluZ1xuXHRcdH1cblxuXHRcdHdoaWxlKGxldmVsID09PSAwICYmIGNhbGxBZnRlckFsbEV2ZW50cygpKXtcbiAgICAgICAgICAgIC8vbm90aGluZ1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogYWZ0ZXJBbGxFdmVudHNcblx0ICpcblx0ICogQHBhcmFtcyB7RnVuY3Rpb259IGNhbGxiYWNrXG5cdCAqXG5cdCAqICAgICAgICAgIGNhbGxiYWNrIC0gZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBpbnZva2VkIG9uY2UgYWxsIGV2ZW50cyBhcmUgZGVsaXZlcmVkXG5cdCAqIEByZXR1cm5cblx0ICovXG5cdHRoaXMuYWZ0ZXJBbGxFdmVudHMgPSBmdW5jdGlvbihjYWxsQmFjayl7XG5cdFx0aWYoIWludmFsaWRGdW5jdGlvbihjYWxsQmFjaykpe1xuXHRcdFx0YWZ0ZXJFdmVudHNDYWxscy5wdXNoKGNhbGxCYWNrKTtcblx0XHR9XG5cdFx0dGhpcy5ibG9ja0NhbGxCYWNrcygpO1xuXHRcdHRoaXMucmVsZWFzZUNhbGxCYWNrcygpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBoYXNDaGFubmVsXG5cdCAqXG5cdCAqIEBwYXJhbXMge1N0cmluZ3xOdW1iZXJ9IGNoYW5uZWxcblx0ICpcblx0ICogICAgICAgICAgY2hhbm5lbCAtIG5hbWUgb2YgdGhlIGNoYW5uZWwgdGhhdCBuZWVkIHRvIGJlIHRlc3RlZCBpZiBwcmVzZW50XG5cdCAqIEByZXR1cm5cblx0ICovXG5cdHRoaXMuaGFzQ2hhbm5lbCA9IGZ1bmN0aW9uKGNoYW5uZWwpe1xuXHRcdHJldHVybiAhaW52YWxpZENoYW5uZWxOYW1lKGNoYW5uZWwpICYmICh0eXBlb2YgY2hhbm5lbFN1YnNjcmliZXJzW2NoYW5uZWxdICE9ICd1bmRlZmluZWQnKSA/IHRydWUgOiBmYWxzZTtcblx0fTtcblxuXHQvKipcblx0ICogYWRkQ2hhbm5lbFxuXHQgKlxuXHQgKiBAcGFyYW1zIHtTdHJpbmd9IGNoYW5uZWxcblx0ICpcblx0ICogICAgICAgICAgY2hhbm5lbCAtIG5hbWUgb2YgYSBjaGFubmVsIHRoYXQgbmVlZHMgdG8gYmUgY3JlYXRlZCBhbmQgYWRkZWQgdG8gc291bmRwdWJzdWIgcmVwb3NpdG9yeVxuXHQgKiBAcmV0dXJuXG5cdCAqL1xuXHR0aGlzLmFkZENoYW5uZWwgPSBmdW5jdGlvbihjaGFubmVsKXtcblx0XHRpZighaW52YWxpZENoYW5uZWxOYW1lKGNoYW5uZWwpICYmICF0aGlzLmhhc0NoYW5uZWwoY2hhbm5lbCkpe1xuXHRcdFx0Y2hhbm5lbFN1YnNjcmliZXJzW2NoYW5uZWxdID0gW107XG5cdFx0fVxuXHR9O1xuXG5cdC8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gcHJvdGVjdGVkIHN0dWZmIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cblx0dmFyIHNlbGYgPSB0aGlzO1xuXHQvLyBtYXAgY2hhbm5lbE5hbWUgKG9iamVjdCBsb2NhbCBpZCkgLT4gYXJyYXkgd2l0aCBzdWJzY3JpYmVyc1xuXHR2YXIgY2hhbm5lbFN1YnNjcmliZXJzID0ge307XG5cblx0Ly8gbWFwIGNoYW5uZWxOYW1lIChvYmplY3QgbG9jYWwgaWQpIC0+IHF1ZXVlIHdpdGggd2FpdGluZyBtZXNzYWdlc1xuXHR2YXIgY2hhbm5lbHNTdG9yYWdlID0ge307XG5cblx0Ly8gb2JqZWN0XG5cdHZhciB0eXBlQ29tcGFjdG9yID0ge307XG5cblx0Ly8gY2hhbm5lbCBuYW1lc1xuXHR2YXIgZXhlY3V0aW9uUXVldWUgPSBuZXcgUXVldWUoKTtcblx0dmFyIGxldmVsID0gMDtcblxuXG5cblx0LyoqXG5cdCAqIHJlZ2lzdGVyQ29tcGFjdG9yXG5cdCAqXG5cdCAqICAgICAgIEFuIGNvbXBhY3RvciB0YWtlcyBhIG5ld0V2ZW50IGFuZCBhbmQgb2xkRXZlbnQgYW5kIHJldHVybiB0aGUgb25lIHRoYXQgc3Vydml2ZXMgKG9sZEV2ZW50IGlmXG5cdCAqICBpdCBjYW4gY29tcGFjdCB0aGUgbmV3IG9uZSBvciB0aGUgbmV3RXZlbnQgaWYgY2FuJ3QgYmUgY29tcGFjdGVkKVxuXHQgKlxuXHQgKiBAcGFyYW1zIHtTdHJpbmd9IHR5cGUsIHtGdW5jdGlvbn0gY2FsbEJhY2tcblx0ICpcblx0ICogICAgICAgICAgdHlwZSAgICAgICAgLSBjaGFubmVsIG5hbWUgdG8gdW5zdWJzY3JpYmVcblx0ICogICAgICAgICAgY2FsbEJhY2sgICAgLSBoYW5kbGVyIGZ1bmN0aW9uIGZvciB0aGF0IHNwZWNpZmljIGV2ZW50IHR5cGVcblx0ICogQHJldHVyblxuXHQgKi9cblx0dGhpcy5yZWdpc3RlckNvbXBhY3RvciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxCYWNrKSB7XG5cdFx0aWYoIWludmFsaWRGdW5jdGlvbihjYWxsQmFjaykpe1xuXHRcdFx0dHlwZUNvbXBhY3Rvclt0eXBlXSA9IGNhbGxCYWNrO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogZGlzcGF0Y2hOZXh0XG5cdCAqXG5cdCAqIEBwYXJhbSBmcm9tUmVsZWFzZUNhbGxCYWNrczogaGFjayB0byBwcmV2ZW50IHRvbyBtYW55IHJlY3Vyc2l2ZSBjYWxscyBvbiByZWxlYXNlQ2FsbEJhY2tzXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCAqL1xuXHRmdW5jdGlvbiBkaXNwYXRjaE5leHQoZnJvbVJlbGVhc2VDYWxsQmFja3Mpe1xuXHRcdGlmKGxldmVsID4gMCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRjb25zdCBjaGFubmVsTmFtZSA9IGV4ZWN1dGlvblF1ZXVlLmZyb250KCk7XG5cdFx0aWYodHlwZW9mIGNoYW5uZWxOYW1lICE9ICd1bmRlZmluZWQnKXtcblx0XHRcdHNlbGYuYmxvY2tDYWxsQmFja3MoKTtcblx0XHRcdHRyeXtcblx0XHRcdFx0bGV0IG1lc3NhZ2U7XG5cdFx0XHRcdGlmKCFjaGFubmVsc1N0b3JhZ2VbY2hhbm5lbE5hbWVdLmlzRW1wdHkoKSkge1xuXHRcdFx0XHRcdG1lc3NhZ2UgPSBjaGFubmVsc1N0b3JhZ2VbY2hhbm5lbE5hbWVdLmZyb250KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYodHlwZW9mIG1lc3NhZ2UgPT0gJ3VuZGVmaW5lZCcpe1xuXHRcdFx0XHRcdGlmKCFjaGFubmVsc1N0b3JhZ2VbY2hhbm5lbE5hbWVdLmlzRW1wdHkoKSl7XG5cdFx0XHRcdFx0XHR3cHJpbnQoXCJDYW4ndCB1c2UgYXMgbWVzc2FnZSBpbiBhIHB1Yi9zdWIgY2hhbm5lbCB0aGlzIG9iamVjdDogXCIgKyBtZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZXhlY3V0aW9uUXVldWUucG9wKCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0aWYodHlwZW9mIG1lc3NhZ2UuX190cmFuc21pc2lvbkluZGV4ID09ICd1bmRlZmluZWQnKXtcblx0XHRcdFx0XHRcdG1lc3NhZ2UuX190cmFuc21pc2lvbkluZGV4ID0gMDtcblx0XHRcdFx0XHRcdGZvcih2YXIgaSA9IGNoYW5uZWxTdWJzY3JpYmVyc1tjaGFubmVsTmFtZV0ubGVuZ3RoLTE7IGkgPj0gMCA7IGktLSl7XG5cdFx0XHRcdFx0XHRcdHZhciBzdWJzY3JpYmVyID0gIGNoYW5uZWxTdWJzY3JpYmVyc1tjaGFubmVsTmFtZV1baV07XG5cdFx0XHRcdFx0XHRcdGlmKHN1YnNjcmliZXIuZm9yRGVsZXRlID09PSB0cnVlKXtcblx0XHRcdFx0XHRcdFx0XHRjaGFubmVsU3Vic2NyaWJlcnNbY2hhbm5lbE5hbWVdLnNwbGljZShpLDEpO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNle1xuXHRcdFx0XHRcdFx0bWVzc2FnZS5fX3RyYW5zbWlzaW9uSW5kZXgrKztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly9UT0RPOiBmb3IgaW1tdXRhYmxlIG9iamVjdHMgaXQgd2lsbCBub3Qgd29yayBhbHNvLCBmaXggZm9yIHNoYXBlIG1vZGVsc1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBtZXNzYWdlLl9fdHJhbnNtaXNpb25JbmRleCA9PSAndW5kZWZpbmVkJyl7XG5cdFx0XHRcdFx0XHR3cHJpbnQoXCJDYW4ndCB1c2UgYXMgbWVzc2FnZSBpbiBhIHB1Yi9zdWIgY2hhbm5lbCB0aGlzIG9iamVjdDogXCIgKyBtZXNzYWdlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0c3Vic2NyaWJlciA9IGNoYW5uZWxTdWJzY3JpYmVyc1tjaGFubmVsTmFtZV1bbWVzc2FnZS5fX3RyYW5zbWlzaW9uSW5kZXhdO1xuXHRcdFx0XHRcdGlmKHR5cGVvZiBzdWJzY3JpYmVyID09ICd1bmRlZmluZWQnKXtcblx0XHRcdFx0XHRcdGRlbGV0ZSBtZXNzYWdlLl9fdHJhbnNtaXNpb25JbmRleDtcblx0XHRcdFx0XHRcdGNoYW5uZWxzU3RvcmFnZVtjaGFubmVsTmFtZV0ucG9wKCk7XG5cdFx0XHRcdFx0fSBlbHNle1xuXHRcdFx0XHRcdFx0aWYoc3Vic2NyaWJlci5maWx0ZXIgPT09IG51bGwgfHwgdHlwZW9mIHN1YnNjcmliZXIuZmlsdGVyID09PSBcInVuZGVmaW5lZFwiIHx8ICghaW52YWxpZEZ1bmN0aW9uKHN1YnNjcmliZXIuZmlsdGVyKSAmJiBzdWJzY3JpYmVyLmZpbHRlcihtZXNzYWdlKSkpe1xuXHRcdFx0XHRcdFx0XHRpZighc3Vic2NyaWJlci5mb3JEZWxldGUpe1xuXHRcdFx0XHRcdFx0XHRcdHN1YnNjcmliZXIuY2FsbEJhY2sobWVzc2FnZSk7XG5cdFx0XHRcdFx0XHRcdFx0aWYoc3Vic2NyaWJlci53YWl0Rm9yTW9yZSAmJiAhaW52YWxpZEZ1bmN0aW9uKHN1YnNjcmliZXIud2FpdEZvck1vcmUpICYmICFzdWJzY3JpYmVyLndhaXRGb3JNb3JlKG1lc3NhZ2UpKXtcblx0XHRcdFx0XHRcdFx0XHRcdHN1YnNjcmliZXIuZm9yRGVsZXRlID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2goZXJyKXtcblx0XHRcdFx0d3ByaW50KFwiRXZlbnQgY2FsbGJhY2sgZmFpbGVkOiBcIisgc3Vic2NyaWJlci5jYWxsQmFjayArXCJlcnJvcjogXCIgKyBlcnIuc3RhY2spO1xuXHRcdFx0fVxuXHRcdFx0Ly9cblx0XHRcdGlmKGZyb21SZWxlYXNlQ2FsbEJhY2tzKXtcblx0XHRcdFx0bGV2ZWwtLTtcblx0XHRcdH0gZWxzZXtcblx0XHRcdFx0c2VsZi5yZWxlYXNlQ2FsbEJhY2tzKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9IGVsc2V7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gY29tcGFjdEFuZFN0b3JlKHRhcmdldCwgbWVzc2FnZSl7XG5cdFx0dmFyIGdvdENvbXBhY3RlZCA9IGZhbHNlO1xuXHRcdHZhciBhcnIgPSBjaGFubmVsc1N0b3JhZ2VbdGFyZ2V0XTtcblx0XHRpZih0eXBlb2YgYXJyID09ICd1bmRlZmluZWQnKXtcblx0XHRcdGFyciA9IG5ldyBRdWV1ZSgpO1xuXHRcdFx0Y2hhbm5lbHNTdG9yYWdlW3RhcmdldF0gPSBhcnI7XG5cdFx0fVxuXG5cdFx0aWYobWVzc2FnZSAmJiB0eXBlb2YgbWVzc2FnZS50eXBlICE9ICd1bmRlZmluZWQnKXtcblx0XHRcdHZhciB0eXBlQ29tcGFjdG9yQ2FsbEJhY2sgPSB0eXBlQ29tcGFjdG9yW21lc3NhZ2UudHlwZV07XG5cblx0XHRcdGlmKHR5cGVvZiB0eXBlQ29tcGFjdG9yQ2FsbEJhY2sgIT0gJ3VuZGVmaW5lZCcpe1xuXHRcdFx0XHRmb3IobGV0IGNoYW5uZWwgb2YgYXJyKSB7XG5cdFx0XHRcdFx0aWYodHlwZUNvbXBhY3RvckNhbGxCYWNrKG1lc3NhZ2UsIGNoYW5uZWwpID09PSBjaGFubmVsKSB7XG5cdFx0XHRcdFx0XHRpZih0eXBlb2YgY2hhbm5lbC5fX3RyYW5zbWlzaW9uSW5kZXggPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0XHRcdFx0Z290Q29tcGFjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoIWdvdENvbXBhY3RlZCAmJiBtZXNzYWdlKXtcblx0XHRcdGFyci5wdXNoKG1lc3NhZ2UpO1xuXHRcdFx0ZXhlY3V0aW9uUXVldWUucHVzaCh0YXJnZXQpO1xuXHRcdH1cblx0fVxuXG5cdHZhciBhZnRlckV2ZW50c0NhbGxzID0gbmV3IFF1ZXVlKCk7XG5cdGZ1bmN0aW9uIGNhbGxBZnRlckFsbEV2ZW50cyAoKXtcblx0XHRpZighYWZ0ZXJFdmVudHNDYWxscy5pc0VtcHR5KCkpe1xuXHRcdFx0dmFyIGNhbGxCYWNrID0gYWZ0ZXJFdmVudHNDYWxscy5wb3AoKTtcblx0XHRcdC8vZG8gbm90IGNhdGNoIGV4Y2VwdGlvbnMgaGVyZS4uXG5cdFx0XHRjYWxsQmFjaygpO1xuXHRcdH1cblx0XHRyZXR1cm4gIWFmdGVyRXZlbnRzQ2FsbHMuaXNFbXB0eSgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW52YWxpZENoYW5uZWxOYW1lKG5hbWUpe1xuXHRcdHZhciByZXN1bHQgPSBmYWxzZTtcblx0XHRpZighbmFtZSB8fCAodHlwZW9mIG5hbWUgIT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgbmFtZSAhPSBcIm51bWJlclwiKSl7XG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdFx0d3ByaW50KFwiSW52YWxpZCBjaGFubmVsIG5hbWU6IFwiICsgbmFtZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIGludmFsaWRNZXNzYWdlVHlwZShtZXNzYWdlKXtcblx0XHR2YXIgcmVzdWx0ID0gZmFsc2U7XG5cdFx0aWYoIW1lc3NhZ2UgfHwgdHlwZW9mIG1lc3NhZ2UgIT0gXCJvYmplY3RcIil7XG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdFx0d3ByaW50KFwiSW52YWxpZCBtZXNzYWdlcyB0eXBlczogXCIgKyBtZXNzYWdlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxuXG5cdGZ1bmN0aW9uIGludmFsaWRGdW5jdGlvbihjYWxsYmFjayl7XG5cdFx0dmFyIHJlc3VsdCA9IGZhbHNlO1xuXHRcdGlmKCFjYWxsYmFjayB8fCB0eXBlb2YgY2FsbGJhY2sgIT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdHJlc3VsdCA9IHRydWU7XG5cdFx0XHR3cHJpbnQoXCJFeHBlY3RlZCB0byBiZSBmdW5jdGlvbiBidXQgaXM6IFwiICsgY2FsbGJhY2spO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG59XG5cbmV4cG9ydHMuc291bmRQdWJTdWIgPSBuZXcgU291bmRQdWJTdWIoKTsiLCJmdW5jdGlvbiBwcm9kdWN0KGFyZ3MpIHtcbiAgICBpZighYXJncy5sZW5ndGgpe1xuICAgICAgICByZXR1cm4gWyBbXSBdO1xuICAgIH1cbiAgICB2YXIgcHJvZCA9IHByb2R1Y3QoYXJncy5zbGljZSgxKSksIHIgPSBbXTtcbiAgICBhcmdzWzBdLmZvckVhY2goZnVuY3Rpb24oeCkge1xuICAgICAgICBwcm9kLmZvckVhY2goZnVuY3Rpb24ocCkge1xuICAgICAgICAgICAgci5wdXNoKFsgeCBdLmNvbmNhdChwKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiByO1xufVxuXG5mdW5jdGlvbiBvYmplY3RQcm9kdWN0KG9iaikge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqKSxcbiAgICAgICAgdmFsdWVzID0ga2V5cy5tYXAoZnVuY3Rpb24oeCkgeyByZXR1cm4gb2JqW3hdOyB9KTtcblxuICAgIHJldHVybiBwcm9kdWN0KHZhbHVlcykubWFwKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgdmFyIGUgPSB7fTtcbiAgICAgICAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGssIG4pIHsgZVtrXSA9IHBbbl07IH0pO1xuICAgICAgICByZXR1cm4gZTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RQcm9kdWN0OyIsInZhciBtZXRhID0gXCJtZXRhXCI7XG5cbmZ1bmN0aW9uIE93TShzZXJpYWxpemVkKXtcblxuICAgIGlmKHNlcmlhbGl6ZWQpe1xuICAgICAgICByZXR1cm4gT3dNLnByb3RvdHlwZS5jb252ZXJ0KHNlcmlhbGl6ZWQpO1xuICAgIH1cblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBtZXRhLCB7XG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmFsdWU6IHt9XG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJzZXRNZXRhXCIsIHtcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgY29uZmlndXJhYmxlOmZhbHNlLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24ocHJvcCwgdmFsdWUpe1xuICAgICAgICAgICAgaWYodHlwZW9mIHByb3AgPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgdmFsdWUgPT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBwIGluIHByb3Ape1xuICAgICAgICAgICAgICAgICAgICB0aGlzW21ldGFdW3BdID0gcHJvcFtwXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzW21ldGFdW3Byb3BdID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImdldE1ldGFcIiwge1xuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihwcm9wKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW21ldGFdW3Byb3BdO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHRlc3RPd01TZXJpYWxpemF0aW9uKG9iail7XG4gICAgbGV0IHJlcyA9IGZhbHNlO1xuXG4gICAgaWYob2JqKXtcbiAgICAgICAgcmVzID0gdHlwZW9mIG9ialttZXRhXSAhPSBcInVuZGVmaW5lZFwiICYmICEob2JqIGluc3RhbmNlb2YgT3dNKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzO1xufVxuXG5Pd00ucHJvdG90eXBlLmNvbnZlcnQgPSBmdW5jdGlvbihzZXJpYWxpemVkKXtcbiAgICBjb25zdCBvd20gPSBuZXcgT3dNKCk7XG5cbiAgICBmb3IodmFyIG1ldGFQcm9wIGluIHNlcmlhbGl6ZWQubWV0YSl7XG4gICAgICAgIGlmKCF0ZXN0T3dNU2VyaWFsaXphdGlvbihzZXJpYWxpemVkW21ldGFQcm9wXSkpIHtcbiAgICAgICAgICAgIG93bS5zZXRNZXRhKG1ldGFQcm9wLCBzZXJpYWxpemVkLm1ldGFbbWV0YVByb3BdKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBvd20uc2V0TWV0YShtZXRhUHJvcCwgT3dNLnByb3RvdHlwZS5jb252ZXJ0KHNlcmlhbGl6ZWQubWV0YVttZXRhUHJvcF0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvcih2YXIgc2ltcGxlUHJvcCBpbiBzZXJpYWxpemVkKXtcbiAgICAgICAgaWYoc2ltcGxlUHJvcCA9PT0gbWV0YSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZighdGVzdE93TVNlcmlhbGl6YXRpb24oc2VyaWFsaXplZFtzaW1wbGVQcm9wXSkpe1xuICAgICAgICAgICAgb3dtW3NpbXBsZVByb3BdID0gc2VyaWFsaXplZFtzaW1wbGVQcm9wXTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBvd21bc2ltcGxlUHJvcF0gPSBPd00ucHJvdG90eXBlLmNvbnZlcnQoc2VyaWFsaXplZFtzaW1wbGVQcm9wXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gb3dtO1xufTtcblxuT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbSA9IGZ1bmN0aW9uKG9iaiwgbmFtZSl7XG4gICAgdmFyIHJlcztcbiAgICBpZighbmFtZSl7XG4gICAgICAgIHJlcyA9IG9ialttZXRhXTtcbiAgICB9ZWxzZXtcbiAgICAgICAgcmVzID0gb2JqW21ldGFdW25hbWVdO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufTtcblxuT3dNLnByb3RvdHlwZS5zZXRNZXRhRm9yID0gZnVuY3Rpb24ob2JqLCBuYW1lLCB2YWx1ZSl7XG4gICAgb2JqW21ldGFdW25hbWVdID0gdmFsdWU7XG4gICAgcmV0dXJuIG9ialttZXRhXVtuYW1lXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gT3dNOyIsImZ1bmN0aW9uIFF1ZXVlRWxlbWVudChjb250ZW50KSB7XG5cdHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XG5cdHRoaXMubmV4dCA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIFF1ZXVlKCkge1xuXHR0aGlzLmhlYWQgPSBudWxsO1xuXHR0aGlzLnRhaWwgPSBudWxsO1xuXHR0aGlzLmxlbmd0aCA9IDA7XG5cdHRoaXMucHVzaCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdGNvbnN0IG5ld0VsZW1lbnQgPSBuZXcgUXVldWVFbGVtZW50KHZhbHVlKTtcblx0XHRpZiAoIXRoaXMuaGVhZCkge1xuXHRcdFx0dGhpcy5oZWFkID0gbmV3RWxlbWVudDtcblx0XHRcdHRoaXMudGFpbCA9IG5ld0VsZW1lbnQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudGFpbC5uZXh0ID0gbmV3RWxlbWVudDtcblx0XHRcdHRoaXMudGFpbCA9IG5ld0VsZW1lbnQ7XG5cdFx0fVxuXHRcdHRoaXMubGVuZ3RoKys7XG5cdH07XG5cblx0dGhpcy5wb3AgPSBmdW5jdGlvbiAoKSB7XG5cdFx0aWYgKCF0aGlzLmhlYWQpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRjb25zdCBoZWFkQ29weSA9IHRoaXMuaGVhZDtcblx0XHR0aGlzLmhlYWQgPSB0aGlzLmhlYWQubmV4dDtcblx0XHR0aGlzLmxlbmd0aC0tO1xuXG5cdFx0Ly9maXg/Pz8/Pz8/XG5cdFx0aWYodGhpcy5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgdGhpcy50YWlsID0gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gaGVhZENvcHkuY29udGVudDtcblx0fTtcblxuXHR0aGlzLmZyb250ID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLmhlYWQgPyB0aGlzLmhlYWQuY29udGVudCA6IHVuZGVmaW5lZDtcblx0fTtcblxuXHR0aGlzLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGVhZCA9PT0gbnVsbDtcblx0fTtcblxuXHR0aGlzW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbiogKCkge1xuXHRcdGxldCBoZWFkID0gdGhpcy5oZWFkO1xuXHRcdHdoaWxlKGhlYWQgIT09IG51bGwpIHtcblx0XHRcdHlpZWxkIGhlYWQuY29udGVudDtcblx0XHRcdGhlYWQgPSBoZWFkLm5leHQ7XG5cdFx0fVxuXHR9LmJpbmQodGhpcyk7XG59XG5cblF1ZXVlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0bGV0IHN0cmluZ2lmaWVkUXVldWUgPSAnJztcblx0bGV0IGl0ZXJhdG9yID0gdGhpcy5oZWFkO1xuXHR3aGlsZSAoaXRlcmF0b3IpIHtcblx0XHRzdHJpbmdpZmllZFF1ZXVlICs9IGAke0pTT04uc3RyaW5naWZ5KGl0ZXJhdG9yLmNvbnRlbnQpfSBgO1xuXHRcdGl0ZXJhdG9yID0gaXRlcmF0b3IubmV4dDtcblx0fVxuXHRyZXR1cm4gc3RyaW5naWZpZWRRdWV1ZTtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5pbnNwZWN0ID0gUXVldWUucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXVlOyIsImNvbnN0IE93TSA9IHJlcXVpcmUoXCIuL093TVwiKTtcblxuLypcbiAgICBQcmVwYXJlIHRoZSBzdGF0ZSBvZiBhIHN3YXJtIHRvIGJlIHNlcmlhbGlzZWRcbiovXG5cbmV4cG9ydHMuYXNKU09OID0gZnVuY3Rpb24odmFsdWVPYmosIHBoYXNlTmFtZSwgYXJncywgY2FsbGJhY2spe1xuXG4gICAgICAgIGxldCB2YWx1ZU9iamVjdCA9IHZhbHVlT2JqLnZhbHVlT2YoKTtcbiAgICAgICAgbGV0IHJlcyA9IG5ldyBPd00oKTtcbiAgICAgICAgcmVzLnB1YmxpY1ZhcnMgICAgICAgICAgPSB2YWx1ZU9iamVjdC5wdWJsaWNWYXJzO1xuICAgICAgICByZXMucHJpdmF0ZVZhcnMgICAgICAgICA9IHZhbHVlT2JqZWN0LnByaXZhdGVWYXJzO1xuXG4gICAgICAgIHJlcy5zZXRNZXRhKFwic3dhcm1UeXBlTmFtZVwiLCBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHZhbHVlT2JqZWN0LCBcInN3YXJtVHlwZU5hbWVcIikpO1xuICAgICAgICByZXMuc2V0TWV0YShcInN3YXJtSWRcIiwgICAgICAgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbSh2YWx1ZU9iamVjdCwgXCJzd2FybUlkXCIpKTtcbiAgICAgICAgcmVzLnNldE1ldGEoXCJ0YXJnZXRcIiwgICAgICAgIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20odmFsdWVPYmplY3QsIFwidGFyZ2V0XCIpKTtcbiAgICAgICAgcmVzLnNldE1ldGEoXCJob21lU2VjdXJpdHlDb250ZXh0XCIsICAgICAgICBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHZhbHVlT2JqZWN0LCBcImhvbWVTZWN1cml0eUNvbnRleHRcIikpO1xuICAgICAgICByZXMuc2V0TWV0YShcInJlcXVlc3RJZFwiLCAgICAgICAgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbSh2YWx1ZU9iamVjdCwgXCJyZXF1ZXN0SWRcIikpO1xuXG4gICAgICAgIGlmKCFwaGFzZU5hbWUpe1xuICAgICAgICAgICAgcmVzLnNldE1ldGEoXCJjb21tYW5kXCIsIFwic3RvcmVkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzLnNldE1ldGEoXCJwaGFzZU5hbWVcIiwgcGhhc2VOYW1lKTtcbiAgICAgICAgICAgIHJlcy5zZXRNZXRhKFwicGhhc2VJZFwiLCAkJC51aWRHZW5lcmF0b3Iuc2FmZV91dWlkKCkpO1xuICAgICAgICAgICAgcmVzLnNldE1ldGEoXCJhcmdzXCIsIGFyZ3MpO1xuICAgICAgICAgICAgcmVzLnNldE1ldGEoXCJjb21tYW5kXCIsIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20odmFsdWVPYmplY3QsIFwiY29tbWFuZFwiKSB8fCBcImV4ZWN1dGVTd2FybVBoYXNlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzLnNldE1ldGEoXCJ3YWl0U3RhY2tcIiwgdmFsdWVPYmplY3QubWV0YS53YWl0U3RhY2spOyAvL1RPRE86IHRoaW5rIGlmIGlzIG5vdCBiZXR0ZXIgdG8gYmUgZGVlcCBjbG9uZWQgYW5kIG5vdCByZWZlcmVuY2VkISEhXG5cbiAgICAgICAgaWYoY2FsbGJhY2spe1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHJlcyk7XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImFzSlNPTjpcIiwgcmVzLCB2YWx1ZU9iamVjdCk7XG4gICAgICAgIHJldHVybiByZXM7XG59O1xuXG5leHBvcnRzLmpzb25Ub05hdGl2ZSA9IGZ1bmN0aW9uKHNlcmlhbGlzZWRWYWx1ZXMsIHJlc3VsdCl7XG5cbiAgICBmb3IobGV0IHYgaW4gc2VyaWFsaXNlZFZhbHVlcy5wdWJsaWNWYXJzKXtcbiAgICAgICAgcmVzdWx0LnB1YmxpY1ZhcnNbdl0gPSBzZXJpYWxpc2VkVmFsdWVzLnB1YmxpY1ZhcnNbdl07XG5cbiAgICB9O1xuICAgIGZvcihsZXQgbCBpbiBzZXJpYWxpc2VkVmFsdWVzLnByaXZhdGVWYXJzKXtcbiAgICAgICAgcmVzdWx0LnByaXZhdGVWYXJzW2xdID0gc2VyaWFsaXNlZFZhbHVlcy5wcml2YXRlVmFyc1tsXTtcbiAgICB9O1xuXG4gICAgZm9yKGxldCBpIGluIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20oc2VyaWFsaXNlZFZhbHVlcykpe1xuICAgICAgICBPd00ucHJvdG90eXBlLnNldE1ldGFGb3IocmVzdWx0LCBpLCBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHNlcmlhbGlzZWRWYWx1ZXMsIGkpKTtcbiAgICB9O1xuXG59OyIsInZhciBjb21tYW5kcyA9IHt9O1xudmFyIGNvbW1hbmRzX2hlbHAgPSB7fTtcblxuLy9nbG9iYWwgZnVuY3Rpb24gYWRkQ29tbWFuZFxuYWRkQ29tbWFuZCA9IGZ1bmN0aW9uIGFkZENvbW1hbmQodmVyYiwgYWR2ZXJiZSwgZnVuY3QsIGhlbHBMaW5lKXtcbiAgICB2YXIgY21kSWQ7XG4gICAgaWYoIWhlbHBMaW5lKXtcbiAgICAgICAgaGVscExpbmUgPSBcIiBcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBoZWxwTGluZSA9IFwiIFwiICsgaGVscExpbmU7XG4gICAgfVxuICAgIGlmKGFkdmVyYmUpe1xuICAgICAgICBjbWRJZCA9IHZlcmIgKyBcIiBcIiArICBhZHZlcmJlO1xuICAgICAgICBoZWxwTGluZSA9IHZlcmIgKyBcIiBcIiArICBhZHZlcmJlICsgaGVscExpbmU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY21kSWQgPSB2ZXJiO1xuICAgICAgICBoZWxwTGluZSA9IHZlcmIgKyBoZWxwTGluZTtcbiAgICB9XG4gICAgY29tbWFuZHNbY21kSWRdID0gZnVuY3Q7XG4gICAgICAgIGNvbW1hbmRzX2hlbHBbY21kSWRdID0gaGVscExpbmU7XG59O1xuXG5mdW5jdGlvbiBkb0hlbHAoKXtcbiAgICBjb25zb2xlLmxvZyhcIkxpc3Qgb2YgY29tbWFuZHM6XCIpO1xuICAgIGZvcih2YXIgbCBpbiBjb21tYW5kc19oZWxwKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJcXHRcIiwgY29tbWFuZHNfaGVscFtsXSk7XG4gICAgfVxufVxuXG5hZGRDb21tYW5kKFwiLWhcIiwgbnVsbCwgZG9IZWxwLCBcIlxcdFxcdFxcdFxcdFxcdFxcdCB8anVzdCBwcmludCB0aGUgaGVscFwiKTtcbmFkZENvbW1hbmQoXCIvP1wiLCBudWxsLCBkb0hlbHAsIFwiXFx0XFx0XFx0XFx0XFx0XFx0IHxqdXN0IHByaW50IHRoZSBoZWxwXCIpO1xuYWRkQ29tbWFuZChcImhlbHBcIiwgbnVsbCwgZG9IZWxwLCBcIlxcdFxcdFxcdFxcdFxcdFxcdCB8anVzdCBwcmludCB0aGUgaGVscFwiKTtcblxuXG5mdW5jdGlvbiBydW5Db21tYW5kKCl7XG4gIHZhciBhcmd2ID0gT2JqZWN0LmFzc2lnbihbXSwgcHJvY2Vzcy5hcmd2KTtcbiAgdmFyIGNtZElkID0gbnVsbDtcbiAgdmFyIGNtZCA9IG51bGw7XG4gIGFyZ3Yuc2hpZnQoKTtcbiAgYXJndi5zaGlmdCgpO1xuXG4gIGlmKGFyZ3YubGVuZ3RoID49MSl7XG4gICAgICBjbWRJZCA9IGFyZ3ZbMF07XG4gICAgICBjbWQgPSBjb21tYW5kc1tjbWRJZF07XG4gICAgICBhcmd2LnNoaWZ0KCk7XG4gIH1cblxuXG4gIGlmKCFjbWQgJiYgYXJndi5sZW5ndGggPj0xKXtcbiAgICAgIGNtZElkID0gY21kSWQgKyBcIiBcIiArIGFyZ3ZbMF07XG4gICAgICBjbWQgPSBjb21tYW5kc1tjbWRJZF07XG4gICAgICBhcmd2LnNoaWZ0KCk7XG4gIH1cblxuICBpZighY21kKXtcbiAgICBpZihjbWRJZCl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiVW5rbm93biBjb21tYW5kOiBcIiwgY21kSWQpO1xuICAgIH1cbiAgICBjbWQgPSBkb0hlbHA7XG4gIH1cblxuICBjbWQuYXBwbHkobnVsbCxhcmd2KTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBydW5Db21tYW5kXG59O1xuXG4iLCJcbmZ1bmN0aW9uIGVuY29kZShidWZmZXIpIHtcbiAgICByZXR1cm4gYnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKVxuICAgICAgICAucmVwbGFjZSgvXFwrL2csICcnKVxuICAgICAgICAucmVwbGFjZSgvXFwvL2csICcnKVxuICAgICAgICAucmVwbGFjZSgvPSskLywgJycpO1xufTtcblxuZnVuY3Rpb24gc3RhbXBXaXRoVGltZShidWYsIHNhbHQsIG1zYWx0KXtcbiAgICBpZighc2FsdCl7XG4gICAgICAgIHNhbHQgPSAxO1xuICAgIH1cbiAgICBpZighbXNhbHQpe1xuICAgICAgICBtc2FsdCA9IDE7XG4gICAgfVxuICAgIHZhciBkYXRlID0gbmV3IERhdGU7XG4gICAgdmFyIGN0ID0gTWF0aC5mbG9vcihkYXRlLmdldFRpbWUoKSAvIHNhbHQpO1xuICAgIHZhciBjb3VudGVyID0gMDtcbiAgICB3aGlsZShjdCA+IDAgKXtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkNvdW50ZXJcIiwgY291bnRlciwgY3QpO1xuICAgICAgICBidWZbY291bnRlciptc2FsdF0gPSBNYXRoLmZsb29yKGN0ICUgMjU2KTtcbiAgICAgICAgY3QgPSBNYXRoLmZsb29yKGN0IC8gMjU2KTtcbiAgICAgICAgY291bnRlcisrO1xuICAgIH1cbn1cblxuLypcbiAgICBUaGUgdWlkIGNvbnRhaW5zIGFyb3VuZCAyNTYgYml0cyBvZiByYW5kb21uZXNzIGFuZCBhcmUgdW5pcXVlIGF0IHRoZSBsZXZlbCBvZiBzZWNvbmRzLiBUaGlzIFVVSUQgc2hvdWxkIGJ5IGNyeXB0b2dyYXBoaWNhbGx5IHNhZmUgKGNhbiBub3QgYmUgZ3Vlc3NlZClcblxuICAgIFdlIGdlbmVyYXRlIGEgc2FmZSBVSUQgdGhhdCBpcyBndWFyYW50ZWVkIHVuaXF1ZSAoYnkgdXNhZ2Ugb2YgYSBQUk5HIHRvIGdlbmVhdGUgMjU2IGJpdHMpIGFuZCB0aW1lIHN0YW1waW5nIHdpdGggdGhlIG51bWJlciBvZiBzZWNvbmRzIGF0IHRoZSBtb21lbnQgd2hlbiBpcyBnZW5lcmF0ZWRcbiAgICBUaGlzIG1ldGhvZCBzaG91bGQgYmUgc2FmZSB0byB1c2UgYXQgdGhlIGxldmVsIG9mIHZlcnkgbGFyZ2UgZGlzdHJpYnV0ZWQgc3lzdGVtcy5cbiAgICBUaGUgVVVJRCBpcyBzdGFtcGVkIHdpdGggdGltZSAoc2Vjb25kcyk6IGRvZXMgaXQgb3BlbiBhIHdheSB0byBndWVzcyB0aGUgVVVJRD8gSXQgZGVwZW5kcyBob3cgc2FmZSBpcyBcImNyeXB0b1wiIFBSTkcsIGJ1dCBpdCBzaG91bGQgYmUgbm8gcHJvYmxlbS4uLlxuXG4gKi9cblxudmFyIGdlbmVyYXRlVWlkID0gbnVsbDtcblxuXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbihleHRlcm5hbEdlbmVyYXRvcil7XG4gICAgZ2VuZXJhdGVVaWQgPSBleHRlcm5hbEdlbmVyYXRvci5nZW5lcmF0ZVVpZDtcbiAgICByZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59O1xuXG5leHBvcnRzLnNhZmVfdXVpZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBidWYgPSBnZW5lcmF0ZVVpZCgzMik7XG4gICAgc3RhbXBXaXRoVGltZShidWYsIDEwMDAsIDMpO1xuICAgIHJldHVybiBlbmNvZGUoYnVmKTtcbn07XG5cblxuXG4vKlxuICAgIFRyeSB0byBnZW5lcmF0ZSBhIHNtYWxsIFVJRCB0aGF0IGlzIHVuaXF1ZSBhZ2FpbnN0IGNoYW5jZSBpbiB0aGUgc2FtZSBtaWxsaXNlY29uZCBzZWNvbmQgYW5kIGluIGEgc3BlY2lmaWMgY29udGV4dCAoZWcgaW4gdGhlIHNhbWUgY2hvcmVvZ3JhcGh5IGV4ZWN1dGlvbilcbiAgICBUaGUgaWQgY29udGFpbnMgYXJvdW5kIDYqOCA9IDQ4ICBiaXRzIG9mIHJhbmRvbW5lc3MgYW5kIGFyZSB1bmlxdWUgYXQgdGhlIGxldmVsIG9mIG1pbGxpc2Vjb25kc1xuICAgIFRoaXMgbWV0aG9kIGlzIHNhZmUgb24gYSBzaW5nbGUgY29tcHV0ZXIgYnV0IHNob3VsZCBiZSB1c2VkIHdpdGggY2FyZSBvdGhlcndpc2VcbiAgICBUaGlzIFVVSUQgaXMgbm90IGNyeXB0b2dyYXBoaWNhbGx5IHNhZmUgKGNhbiBiZSBndWVzc2VkKVxuICovXG5leHBvcnRzLnNob3J0X3V1aWQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHJlcXVpcmUoJ2NyeXB0bycpLnJhbmRvbUJ5dGVzKDEyLCBmdW5jdGlvbiAoZXJyLCBidWYpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdGFtcFdpdGhUaW1lKGJ1ZiwxLDIpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCBlbmNvZGUoYnVmKSk7XG4gICAgfSk7XG59OyIsImNvbnN0IGNyeXB0byA9IHJlcXVpcmUoJ2NyeXB0bycpO1xuY29uc3QgUXVldWUgPSByZXF1aXJlKFwiLi9RdWV1ZVwiKTtcbnZhciBQU0tCdWZmZXIgPSB0eXBlb2YgJCQgIT09IFwidW5kZWZpbmVkXCIgJiYgJCQuUFNLQnVmZmVyID8gJCQuUFNLQnVmZmVyIDogQnVmZmVyO1xuXG5mdW5jdGlvbiBVaWRHZW5lcmF0b3IobWluQnVmZmVycywgYnVmZmVyc1NpemUpIHtcblx0dmFyIGJ1ZmZlcnMgPSBuZXcgUXVldWUoKTtcblx0dmFyIGxvd0xpbWl0ID0gLjI7XG5cblx0ZnVuY3Rpb24gZmlsbEJ1ZmZlcnMoc2l6ZSl7XG5cdFx0Ly9ub3RpZnlPYnNlcnZlcigpO1xuXHRcdGNvbnN0IHN6ID0gc2l6ZSB8fCBtaW5CdWZmZXJzO1xuXHRcdGlmKGJ1ZmZlcnMubGVuZ3RoIDwgTWF0aC5mbG9vcihtaW5CdWZmZXJzKmxvd0xpbWl0KSl7XG5cdFx0XHRmb3IodmFyIGk9MCtidWZmZXJzLmxlbmd0aDsgaSA8IHN6OyBpKyspe1xuXHRcdFx0XHRnZW5lcmF0ZU9uZUJ1ZmZlcihudWxsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmaWxsQnVmZmVycygpO1xuXG5cdGZ1bmN0aW9uIGdlbmVyYXRlT25lQnVmZmVyKGIpe1xuXHRcdGlmKCFiKXtcblx0XHRcdGIgPSBQU0tCdWZmZXIuYWxsb2MoMCk7XG5cdFx0fVxuXHRcdGNvbnN0IHN6ID0gYnVmZmVyc1NpemUgLSBiLmxlbmd0aDtcblx0XHQvKmNyeXB0by5yYW5kb21CeXRlcyhzeiwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG5cdFx0XHRidWZmZXJzLnB1c2goQnVmZmVyLmNvbmNhdChbcmVzLCBiXSkpO1xuXHRcdFx0bm90aWZ5T2JzZXJ2ZXIoKTtcblx0XHR9KTsqL1xuXHRcdGJ1ZmZlcnMucHVzaChQU0tCdWZmZXIuY29uY2F0KFsgY3J5cHRvLnJhbmRvbUJ5dGVzKHN6KSwgYiBdKSk7XG5cdFx0bm90aWZ5T2JzZXJ2ZXIoKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dHJhY3ROKG4pe1xuXHRcdHZhciBzeiA9IE1hdGguZmxvb3IobiAvIGJ1ZmZlcnNTaXplKTtcblx0XHR2YXIgcmV0ID0gW107XG5cblx0XHRmb3IodmFyIGk9MDsgaTxzejsgaSsrKXtcblx0XHRcdHJldC5wdXNoKGJ1ZmZlcnMucG9wKCkpO1xuXHRcdFx0c2V0VGltZW91dChnZW5lcmF0ZU9uZUJ1ZmZlciwgMSk7XG5cdFx0fVxuXG5cblxuXHRcdHZhciByZW1haW5kZXIgPSBuICUgYnVmZmVyc1NpemU7XG5cdFx0aWYocmVtYWluZGVyID4gMCl7XG5cdFx0XHR2YXIgZnJvbnQgPSBidWZmZXJzLnBvcCgpO1xuXHRcdFx0cmV0LnB1c2goZnJvbnQuc2xpY2UoMCxyZW1haW5kZXIpKTtcblx0XHRcdC8vZ2VuZXJhdGVPbmVCdWZmZXIoZnJvbnQuc2xpY2UocmVtYWluZGVyKSk7XG5cdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdGdlbmVyYXRlT25lQnVmZmVyKGZyb250LnNsaWNlKHJlbWFpbmRlcikpO1xuXHRcdFx0fSwxKTtcblx0XHR9XG5cblx0XHQvL3NldFRpbWVvdXQoZmlsbEJ1ZmZlcnMsIDEpO1xuXG5cdFx0cmV0dXJuIEJ1ZmZlci5jb25jYXQocmV0KTtcblx0fVxuXG5cdHZhciBmaWxsSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG5cdHRoaXMuZ2VuZXJhdGVVaWQgPSBmdW5jdGlvbihuKXtcblx0XHR2YXIgdG90YWxTaXplID0gYnVmZmVycy5sZW5ndGggKiBidWZmZXJzU2l6ZTtcblx0XHRpZihuIDw9IHRvdGFsU2l6ZSl7XG5cdFx0XHRyZXR1cm4gZXh0cmFjdE4obik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKCFmaWxsSW5Qcm9ncmVzcyl7XG5cdFx0XHRcdGZpbGxJblByb2dyZXNzID0gdHJ1ZTtcblx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdGZpbGxCdWZmZXJzKE1hdGguZmxvb3IobWluQnVmZmVycyoyLjUpKTtcblx0XHRcdFx0XHRmaWxsSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHR9LCAxKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBjcnlwdG8ucmFuZG9tQnl0ZXMobik7XG5cdFx0fVxuXHR9O1xuXG5cdHZhciBvYnNlcnZlcjtcblx0dGhpcy5yZWdpc3Rlck9ic2VydmVyID0gZnVuY3Rpb24ob2JzKXtcblx0XHRpZihvYnNlcnZlcil7XG5cdFx0XHRjb25zb2xlLmVycm9yKG5ldyBFcnJvcihcIk9uZSBvYnNlcnZlciBhbGxvd2VkIVwiKSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRpZih0eXBlb2Ygb2JzID09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdG9ic2VydmVyID0gb2JzO1xuXHRcdFx0XHQvL25vdGlmeU9ic2VydmVyKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIG5vdGlmeU9ic2VydmVyKCl7XG5cdFx0aWYob2JzZXJ2ZXIpe1xuXHRcdFx0dmFyIHZhbHVlVG9SZXBvcnQgPSBidWZmZXJzLmxlbmd0aCpidWZmZXJzU2l6ZTtcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0b2JzZXJ2ZXIobnVsbCwge1wic2l6ZVwiOiB2YWx1ZVRvUmVwb3J0fSk7XG5cdFx0XHR9LCAxMCk7XG5cdFx0fVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZVVpZEdlbmVyYXRvciA9IGZ1bmN0aW9uIChtaW5CdWZmZXJzLCBidWZmZXJTaXplKSB7XG5cdHJldHVybiBuZXcgVWlkR2VuZXJhdG9yKG1pbkJ1ZmZlcnMsIGJ1ZmZlclNpemUpO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludCBjYW1lbGNhc2U6IFwib2ZmXCIgKi9cblxudmFyIGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuXG52YXIgWnN0cmVhbSA9IHJlcXVpcmUoJ3Bha28vbGliL3psaWIvenN0cmVhbScpO1xudmFyIHpsaWJfZGVmbGF0ZSA9IHJlcXVpcmUoJ3Bha28vbGliL3psaWIvZGVmbGF0ZS5qcycpO1xudmFyIHpsaWJfaW5mbGF0ZSA9IHJlcXVpcmUoJ3Bha28vbGliL3psaWIvaW5mbGF0ZS5qcycpO1xudmFyIGNvbnN0YW50cyA9IHJlcXVpcmUoJ3Bha28vbGliL3psaWIvY29uc3RhbnRzJyk7XG5cbmZvciAodmFyIGtleSBpbiBjb25zdGFudHMpIHtcbiAgZXhwb3J0c1trZXldID0gY29uc3RhbnRzW2tleV07XG59XG5cbi8vIHpsaWIgbW9kZXNcbmV4cG9ydHMuTk9ORSA9IDA7XG5leHBvcnRzLkRFRkxBVEUgPSAxO1xuZXhwb3J0cy5JTkZMQVRFID0gMjtcbmV4cG9ydHMuR1pJUCA9IDM7XG5leHBvcnRzLkdVTlpJUCA9IDQ7XG5leHBvcnRzLkRFRkxBVEVSQVcgPSA1O1xuZXhwb3J0cy5JTkZMQVRFUkFXID0gNjtcbmV4cG9ydHMuVU5aSVAgPSA3O1xuXG52YXIgR1pJUF9IRUFERVJfSUQxID0gMHgxZjtcbnZhciBHWklQX0hFQURFUl9JRDIgPSAweDhiO1xuXG4vKipcbiAqIEVtdWxhdGUgTm9kZSdzIHpsaWIgQysrIGxheWVyIGZvciB1c2UgYnkgdGhlIEpTIGxheWVyIGluIGluZGV4LmpzXG4gKi9cbmZ1bmN0aW9uIFpsaWIobW9kZSkge1xuICBpZiAodHlwZW9mIG1vZGUgIT09ICdudW1iZXInIHx8IG1vZGUgPCBleHBvcnRzLkRFRkxBVEUgfHwgbW9kZSA+IGV4cG9ydHMuVU5aSVApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCYWQgYXJndW1lbnQnKTtcbiAgfVxuXG4gIHRoaXMuZGljdGlvbmFyeSA9IG51bGw7XG4gIHRoaXMuZXJyID0gMDtcbiAgdGhpcy5mbHVzaCA9IDA7XG4gIHRoaXMuaW5pdF9kb25lID0gZmFsc2U7XG4gIHRoaXMubGV2ZWwgPSAwO1xuICB0aGlzLm1lbUxldmVsID0gMDtcbiAgdGhpcy5tb2RlID0gbW9kZTtcbiAgdGhpcy5zdHJhdGVneSA9IDA7XG4gIHRoaXMud2luZG93Qml0cyA9IDA7XG4gIHRoaXMud3JpdGVfaW5fcHJvZ3Jlc3MgPSBmYWxzZTtcbiAgdGhpcy5wZW5kaW5nX2Nsb3NlID0gZmFsc2U7XG4gIHRoaXMuZ3ppcF9pZF9ieXRlc19yZWFkID0gMDtcbn1cblxuWmxpYi5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLndyaXRlX2luX3Byb2dyZXNzKSB7XG4gICAgdGhpcy5wZW5kaW5nX2Nsb3NlID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLnBlbmRpbmdfY2xvc2UgPSBmYWxzZTtcblxuICBhc3NlcnQodGhpcy5pbml0X2RvbmUsICdjbG9zZSBiZWZvcmUgaW5pdCcpO1xuICBhc3NlcnQodGhpcy5tb2RlIDw9IGV4cG9ydHMuVU5aSVApO1xuXG4gIGlmICh0aGlzLm1vZGUgPT09IGV4cG9ydHMuREVGTEFURSB8fCB0aGlzLm1vZGUgPT09IGV4cG9ydHMuR1pJUCB8fCB0aGlzLm1vZGUgPT09IGV4cG9ydHMuREVGTEFURVJBVykge1xuICAgIHpsaWJfZGVmbGF0ZS5kZWZsYXRlRW5kKHRoaXMuc3RybSk7XG4gIH0gZWxzZSBpZiAodGhpcy5tb2RlID09PSBleHBvcnRzLklORkxBVEUgfHwgdGhpcy5tb2RlID09PSBleHBvcnRzLkdVTlpJUCB8fCB0aGlzLm1vZGUgPT09IGV4cG9ydHMuSU5GTEFURVJBVyB8fCB0aGlzLm1vZGUgPT09IGV4cG9ydHMuVU5aSVApIHtcbiAgICB6bGliX2luZmxhdGUuaW5mbGF0ZUVuZCh0aGlzLnN0cm0pO1xuICB9XG5cbiAgdGhpcy5tb2RlID0gZXhwb3J0cy5OT05FO1xuXG4gIHRoaXMuZGljdGlvbmFyeSA9IG51bGw7XG59O1xuXG5abGliLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChmbHVzaCwgaW5wdXQsIGluX29mZiwgaW5fbGVuLCBvdXQsIG91dF9vZmYsIG91dF9sZW4pIHtcbiAgcmV0dXJuIHRoaXMuX3dyaXRlKHRydWUsIGZsdXNoLCBpbnB1dCwgaW5fb2ZmLCBpbl9sZW4sIG91dCwgb3V0X29mZiwgb3V0X2xlbik7XG59O1xuXG5abGliLnByb3RvdHlwZS53cml0ZVN5bmMgPSBmdW5jdGlvbiAoZmx1c2gsIGlucHV0LCBpbl9vZmYsIGluX2xlbiwgb3V0LCBvdXRfb2ZmLCBvdXRfbGVuKSB7XG4gIHJldHVybiB0aGlzLl93cml0ZShmYWxzZSwgZmx1c2gsIGlucHV0LCBpbl9vZmYsIGluX2xlbiwgb3V0LCBvdXRfb2ZmLCBvdXRfbGVuKTtcbn07XG5cblpsaWIucHJvdG90eXBlLl93cml0ZSA9IGZ1bmN0aW9uIChhc3luYywgZmx1c2gsIGlucHV0LCBpbl9vZmYsIGluX2xlbiwgb3V0LCBvdXRfb2ZmLCBvdXRfbGVuKSB7XG4gIGFzc2VydC5lcXVhbChhcmd1bWVudHMubGVuZ3RoLCA4KTtcblxuICBhc3NlcnQodGhpcy5pbml0X2RvbmUsICd3cml0ZSBiZWZvcmUgaW5pdCcpO1xuICBhc3NlcnQodGhpcy5tb2RlICE9PSBleHBvcnRzLk5PTkUsICdhbHJlYWR5IGZpbmFsaXplZCcpO1xuICBhc3NlcnQuZXF1YWwoZmFsc2UsIHRoaXMud3JpdGVfaW5fcHJvZ3Jlc3MsICd3cml0ZSBhbHJlYWR5IGluIHByb2dyZXNzJyk7XG4gIGFzc2VydC5lcXVhbChmYWxzZSwgdGhpcy5wZW5kaW5nX2Nsb3NlLCAnY2xvc2UgaXMgcGVuZGluZycpO1xuXG4gIHRoaXMud3JpdGVfaW5fcHJvZ3Jlc3MgPSB0cnVlO1xuXG4gIGFzc2VydC5lcXVhbChmYWxzZSwgZmx1c2ggPT09IHVuZGVmaW5lZCwgJ211c3QgcHJvdmlkZSBmbHVzaCB2YWx1ZScpO1xuXG4gIHRoaXMud3JpdGVfaW5fcHJvZ3Jlc3MgPSB0cnVlO1xuXG4gIGlmIChmbHVzaCAhPT0gZXhwb3J0cy5aX05PX0ZMVVNIICYmIGZsdXNoICE9PSBleHBvcnRzLlpfUEFSVElBTF9GTFVTSCAmJiBmbHVzaCAhPT0gZXhwb3J0cy5aX1NZTkNfRkxVU0ggJiYgZmx1c2ggIT09IGV4cG9ydHMuWl9GVUxMX0ZMVVNIICYmIGZsdXNoICE9PSBleHBvcnRzLlpfRklOSVNIICYmIGZsdXNoICE9PSBleHBvcnRzLlpfQkxPQ0spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZmx1c2ggdmFsdWUnKTtcbiAgfVxuXG4gIGlmIChpbnB1dCA9PSBudWxsKSB7XG4gICAgaW5wdXQgPSBCdWZmZXIuYWxsb2MoMCk7XG4gICAgaW5fbGVuID0gMDtcbiAgICBpbl9vZmYgPSAwO1xuICB9XG5cbiAgdGhpcy5zdHJtLmF2YWlsX2luID0gaW5fbGVuO1xuICB0aGlzLnN0cm0uaW5wdXQgPSBpbnB1dDtcbiAgdGhpcy5zdHJtLm5leHRfaW4gPSBpbl9vZmY7XG4gIHRoaXMuc3RybS5hdmFpbF9vdXQgPSBvdXRfbGVuO1xuICB0aGlzLnN0cm0ub3V0cHV0ID0gb3V0O1xuICB0aGlzLnN0cm0ubmV4dF9vdXQgPSBvdXRfb2ZmO1xuICB0aGlzLmZsdXNoID0gZmx1c2g7XG5cbiAgaWYgKCFhc3luYykge1xuICAgIC8vIHN5bmMgdmVyc2lvblxuICAgIHRoaXMuX3Byb2Nlc3MoKTtcblxuICAgIGlmICh0aGlzLl9jaGVja0Vycm9yKCkpIHtcbiAgICAgIHJldHVybiB0aGlzLl9hZnRlclN5bmMoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gYXN5bmMgdmVyc2lvblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgIHNlbGYuX3Byb2Nlc3MoKTtcbiAgICBzZWxmLl9hZnRlcigpO1xuICB9KTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cblpsaWIucHJvdG90eXBlLl9hZnRlclN5bmMgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhdmFpbF9vdXQgPSB0aGlzLnN0cm0uYXZhaWxfb3V0O1xuICB2YXIgYXZhaWxfaW4gPSB0aGlzLnN0cm0uYXZhaWxfaW47XG5cbiAgdGhpcy53cml0ZV9pbl9wcm9ncmVzcyA9IGZhbHNlO1xuXG4gIHJldHVybiBbYXZhaWxfaW4sIGF2YWlsX291dF07XG59O1xuXG5abGliLnByb3RvdHlwZS5fcHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIG5leHRfZXhwZWN0ZWRfaGVhZGVyX2J5dGUgPSBudWxsO1xuXG4gIC8vIElmIHRoZSBhdmFpbF9vdXQgaXMgbGVmdCBhdCAwLCB0aGVuIGl0IG1lYW5zIHRoYXQgaXQgcmFuIG91dFxuICAvLyBvZiByb29tLiAgSWYgdGhlcmUgd2FzIGF2YWlsX291dCBsZWZ0IG92ZXIsIHRoZW4gaXQgbWVhbnNcbiAgLy8gdGhhdCBhbGwgb2YgdGhlIGlucHV0IHdhcyBjb25zdW1lZC5cbiAgc3dpdGNoICh0aGlzLm1vZGUpIHtcbiAgICBjYXNlIGV4cG9ydHMuREVGTEFURTpcbiAgICBjYXNlIGV4cG9ydHMuR1pJUDpcbiAgICBjYXNlIGV4cG9ydHMuREVGTEFURVJBVzpcbiAgICAgIHRoaXMuZXJyID0gemxpYl9kZWZsYXRlLmRlZmxhdGUodGhpcy5zdHJtLCB0aGlzLmZsdXNoKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZXhwb3J0cy5VTlpJUDpcbiAgICAgIGlmICh0aGlzLnN0cm0uYXZhaWxfaW4gPiAwKSB7XG4gICAgICAgIG5leHRfZXhwZWN0ZWRfaGVhZGVyX2J5dGUgPSB0aGlzLnN0cm0ubmV4dF9pbjtcbiAgICAgIH1cblxuICAgICAgc3dpdGNoICh0aGlzLmd6aXBfaWRfYnl0ZXNfcmVhZCkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgaWYgKG5leHRfZXhwZWN0ZWRfaGVhZGVyX2J5dGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLnN0cm0uaW5wdXRbbmV4dF9leHBlY3RlZF9oZWFkZXJfYnl0ZV0gPT09IEdaSVBfSEVBREVSX0lEMSkge1xuICAgICAgICAgICAgdGhpcy5nemlwX2lkX2J5dGVzX3JlYWQgPSAxO1xuICAgICAgICAgICAgbmV4dF9leHBlY3RlZF9oZWFkZXJfYnl0ZSsrO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zdHJtLmF2YWlsX2luID09PSAxKSB7XG4gICAgICAgICAgICAgIC8vIFRoZSBvbmx5IGF2YWlsYWJsZSBieXRlIHdhcyBhbHJlYWR5IHJlYWQuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm1vZGUgPSBleHBvcnRzLklORkxBVEU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgLy8gZmFsbHRocm91Z2hcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChuZXh0X2V4cGVjdGVkX2hlYWRlcl9ieXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodGhpcy5zdHJtLmlucHV0W25leHRfZXhwZWN0ZWRfaGVhZGVyX2J5dGVdID09PSBHWklQX0hFQURFUl9JRDIpIHtcbiAgICAgICAgICAgIHRoaXMuZ3ppcF9pZF9ieXRlc19yZWFkID0gMjtcbiAgICAgICAgICAgIHRoaXMubW9kZSA9IGV4cG9ydHMuR1VOWklQO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhY3R1YWwgZGlmZmVyZW5jZSBiZXR3ZWVuIElORkxBVEUgYW5kIElORkxBVEVSQVdcbiAgICAgICAgICAgIC8vIChhZnRlciBpbml0aWFsaXphdGlvbikuXG4gICAgICAgICAgICB0aGlzLm1vZGUgPSBleHBvcnRzLklORkxBVEU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIG51bWJlciBvZiBnemlwIG1hZ2ljIG51bWJlciBieXRlcyByZWFkJyk7XG4gICAgICB9XG5cbiAgICAvLyBmYWxsdGhyb3VnaFxuICAgIGNhc2UgZXhwb3J0cy5JTkZMQVRFOlxuICAgIGNhc2UgZXhwb3J0cy5HVU5aSVA6XG4gICAgY2FzZSBleHBvcnRzLklORkxBVEVSQVc6XG4gICAgICB0aGlzLmVyciA9IHpsaWJfaW5mbGF0ZS5pbmZsYXRlKHRoaXMuc3RybSwgdGhpcy5mbHVzaFxuXG4gICAgICAvLyBJZiBkYXRhIHdhcyBlbmNvZGVkIHdpdGggZGljdGlvbmFyeVxuICAgICAgKTtpZiAodGhpcy5lcnIgPT09IGV4cG9ydHMuWl9ORUVEX0RJQ1QgJiYgdGhpcy5kaWN0aW9uYXJ5KSB7XG4gICAgICAgIC8vIExvYWQgaXRcbiAgICAgICAgdGhpcy5lcnIgPSB6bGliX2luZmxhdGUuaW5mbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLCB0aGlzLmRpY3Rpb25hcnkpO1xuICAgICAgICBpZiAodGhpcy5lcnIgPT09IGV4cG9ydHMuWl9PSykge1xuICAgICAgICAgIC8vIEFuZCB0cnkgdG8gZGVjb2RlIGFnYWluXG4gICAgICAgICAgdGhpcy5lcnIgPSB6bGliX2luZmxhdGUuaW5mbGF0ZSh0aGlzLnN0cm0sIHRoaXMuZmx1c2gpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZXJyID09PSBleHBvcnRzLlpfREFUQV9FUlJPUikge1xuICAgICAgICAgIC8vIEJvdGggaW5mbGF0ZVNldERpY3Rpb25hcnkoKSBhbmQgaW5mbGF0ZSgpIHJldHVybiBaX0RBVEFfRVJST1IuXG4gICAgICAgICAgLy8gTWFrZSBpdCBwb3NzaWJsZSBmb3IgQWZ0ZXIoKSB0byB0ZWxsIGEgYmFkIGRpY3Rpb25hcnkgZnJvbSBiYWRcbiAgICAgICAgICAvLyBpbnB1dC5cbiAgICAgICAgICB0aGlzLmVyciA9IGV4cG9ydHMuWl9ORUVEX0RJQ1Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHdoaWxlICh0aGlzLnN0cm0uYXZhaWxfaW4gPiAwICYmIHRoaXMubW9kZSA9PT0gZXhwb3J0cy5HVU5aSVAgJiYgdGhpcy5lcnIgPT09IGV4cG9ydHMuWl9TVFJFQU1fRU5EICYmIHRoaXMuc3RybS5uZXh0X2luWzBdICE9PSAweDAwKSB7XG4gICAgICAgIC8vIEJ5dGVzIHJlbWFpbiBpbiBpbnB1dCBidWZmZXIuIFBlcmhhcHMgdGhpcyBpcyBhbm90aGVyIGNvbXByZXNzZWRcbiAgICAgICAgLy8gbWVtYmVyIGluIHRoZSBzYW1lIGFyY2hpdmUsIG9yIGp1c3QgdHJhaWxpbmcgZ2FyYmFnZS5cbiAgICAgICAgLy8gVHJhaWxpbmcgemVybyBieXRlcyBhcmUgb2theSwgdGhvdWdoLCBzaW5jZSB0aGV5IGFyZSBmcmVxdWVudGx5XG4gICAgICAgIC8vIHVzZWQgZm9yIHBhZGRpbmcuXG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB0aGlzLmVyciA9IHpsaWJfaW5mbGF0ZS5pbmZsYXRlKHRoaXMuc3RybSwgdGhpcy5mbHVzaCk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIG1vZGUgJyArIHRoaXMubW9kZSk7XG4gIH1cbn07XG5cblpsaWIucHJvdG90eXBlLl9jaGVja0Vycm9yID0gZnVuY3Rpb24gKCkge1xuICAvLyBBY2NlcHRhYmxlIGVycm9yIHN0YXRlcyBkZXBlbmQgb24gdGhlIHR5cGUgb2YgemxpYiBzdHJlYW0uXG4gIHN3aXRjaCAodGhpcy5lcnIpIHtcbiAgICBjYXNlIGV4cG9ydHMuWl9PSzpcbiAgICBjYXNlIGV4cG9ydHMuWl9CVUZfRVJST1I6XG4gICAgICBpZiAodGhpcy5zdHJtLmF2YWlsX291dCAhPT0gMCAmJiB0aGlzLmZsdXNoID09PSBleHBvcnRzLlpfRklOSVNIKSB7XG4gICAgICAgIHRoaXMuX2Vycm9yKCd1bmV4cGVjdGVkIGVuZCBvZiBmaWxlJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZXhwb3J0cy5aX1NUUkVBTV9FTkQ6XG4gICAgICAvLyBub3JtYWwgc3RhdHVzZXMsIG5vdCBmYXRhbFxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBleHBvcnRzLlpfTkVFRF9ESUNUOlxuICAgICAgaWYgKHRoaXMuZGljdGlvbmFyeSA9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX2Vycm9yKCdNaXNzaW5nIGRpY3Rpb25hcnknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2Vycm9yKCdCYWQgZGljdGlvbmFyeScpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGRlZmF1bHQ6XG4gICAgICAvLyBzb21ldGhpbmcgZWxzZS5cbiAgICAgIHRoaXMuX2Vycm9yKCdabGliIGVycm9yJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblpsaWIucHJvdG90eXBlLl9hZnRlciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLl9jaGVja0Vycm9yKCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYXZhaWxfb3V0ID0gdGhpcy5zdHJtLmF2YWlsX291dDtcbiAgdmFyIGF2YWlsX2luID0gdGhpcy5zdHJtLmF2YWlsX2luO1xuXG4gIHRoaXMud3JpdGVfaW5fcHJvZ3Jlc3MgPSBmYWxzZTtcblxuICAvLyBjYWxsIHRoZSB3cml0ZSgpIGNiXG4gIHRoaXMuY2FsbGJhY2soYXZhaWxfaW4sIGF2YWlsX291dCk7XG5cbiAgaWYgKHRoaXMucGVuZGluZ19jbG9zZSkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgfVxufTtcblxuWmxpYi5wcm90b3R5cGUuX2Vycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuc3RybS5tc2cpIHtcbiAgICBtZXNzYWdlID0gdGhpcy5zdHJtLm1zZztcbiAgfVxuICB0aGlzLm9uZXJyb3IobWVzc2FnZSwgdGhpcy5lcnJcblxuICAvLyBubyBob3BlIG9mIHJlc2N1ZS5cbiAgKTt0aGlzLndyaXRlX2luX3Byb2dyZXNzID0gZmFsc2U7XG4gIGlmICh0aGlzLnBlbmRpbmdfY2xvc2UpIHtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn07XG5cblpsaWIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAod2luZG93Qml0cywgbGV2ZWwsIG1lbUxldmVsLCBzdHJhdGVneSwgZGljdGlvbmFyeSkge1xuICBhc3NlcnQoYXJndW1lbnRzLmxlbmd0aCA9PT0gNCB8fCBhcmd1bWVudHMubGVuZ3RoID09PSA1LCAnaW5pdCh3aW5kb3dCaXRzLCBsZXZlbCwgbWVtTGV2ZWwsIHN0cmF0ZWd5LCBbZGljdGlvbmFyeV0pJyk7XG5cbiAgYXNzZXJ0KHdpbmRvd0JpdHMgPj0gOCAmJiB3aW5kb3dCaXRzIDw9IDE1LCAnaW52YWxpZCB3aW5kb3dCaXRzJyk7XG4gIGFzc2VydChsZXZlbCA+PSAtMSAmJiBsZXZlbCA8PSA5LCAnaW52YWxpZCBjb21wcmVzc2lvbiBsZXZlbCcpO1xuXG4gIGFzc2VydChtZW1MZXZlbCA+PSAxICYmIG1lbUxldmVsIDw9IDksICdpbnZhbGlkIG1lbWxldmVsJyk7XG5cbiAgYXNzZXJ0KHN0cmF0ZWd5ID09PSBleHBvcnRzLlpfRklMVEVSRUQgfHwgc3RyYXRlZ3kgPT09IGV4cG9ydHMuWl9IVUZGTUFOX09OTFkgfHwgc3RyYXRlZ3kgPT09IGV4cG9ydHMuWl9STEUgfHwgc3RyYXRlZ3kgPT09IGV4cG9ydHMuWl9GSVhFRCB8fCBzdHJhdGVneSA9PT0gZXhwb3J0cy5aX0RFRkFVTFRfU1RSQVRFR1ksICdpbnZhbGlkIHN0cmF0ZWd5Jyk7XG5cbiAgdGhpcy5faW5pdChsZXZlbCwgd2luZG93Qml0cywgbWVtTGV2ZWwsIHN0cmF0ZWd5LCBkaWN0aW9uYXJ5KTtcbiAgdGhpcy5fc2V0RGljdGlvbmFyeSgpO1xufTtcblxuWmxpYi5wcm90b3R5cGUucGFyYW1zID0gZnVuY3Rpb24gKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ2RlZmxhdGVQYXJhbXMgTm90IHN1cHBvcnRlZCcpO1xufTtcblxuWmxpYi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX3Jlc2V0KCk7XG4gIHRoaXMuX3NldERpY3Rpb25hcnkoKTtcbn07XG5cblpsaWIucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24gKGxldmVsLCB3aW5kb3dCaXRzLCBtZW1MZXZlbCwgc3RyYXRlZ3ksIGRpY3Rpb25hcnkpIHtcbiAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICB0aGlzLndpbmRvd0JpdHMgPSB3aW5kb3dCaXRzO1xuICB0aGlzLm1lbUxldmVsID0gbWVtTGV2ZWw7XG4gIHRoaXMuc3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICB0aGlzLmZsdXNoID0gZXhwb3J0cy5aX05PX0ZMVVNIO1xuXG4gIHRoaXMuZXJyID0gZXhwb3J0cy5aX09LO1xuXG4gIGlmICh0aGlzLm1vZGUgPT09IGV4cG9ydHMuR1pJUCB8fCB0aGlzLm1vZGUgPT09IGV4cG9ydHMuR1VOWklQKSB7XG4gICAgdGhpcy53aW5kb3dCaXRzICs9IDE2O1xuICB9XG5cbiAgaWYgKHRoaXMubW9kZSA9PT0gZXhwb3J0cy5VTlpJUCkge1xuICAgIHRoaXMud2luZG93Qml0cyArPSAzMjtcbiAgfVxuXG4gIGlmICh0aGlzLm1vZGUgPT09IGV4cG9ydHMuREVGTEFURVJBVyB8fCB0aGlzLm1vZGUgPT09IGV4cG9ydHMuSU5GTEFURVJBVykge1xuICAgIHRoaXMud2luZG93Qml0cyA9IC0xICogdGhpcy53aW5kb3dCaXRzO1xuICB9XG5cbiAgdGhpcy5zdHJtID0gbmV3IFpzdHJlYW0oKTtcblxuICBzd2l0Y2ggKHRoaXMubW9kZSkge1xuICAgIGNhc2UgZXhwb3J0cy5ERUZMQVRFOlxuICAgIGNhc2UgZXhwb3J0cy5HWklQOlxuICAgIGNhc2UgZXhwb3J0cy5ERUZMQVRFUkFXOlxuICAgICAgdGhpcy5lcnIgPSB6bGliX2RlZmxhdGUuZGVmbGF0ZUluaXQyKHRoaXMuc3RybSwgdGhpcy5sZXZlbCwgZXhwb3J0cy5aX0RFRkxBVEVELCB0aGlzLndpbmRvd0JpdHMsIHRoaXMubWVtTGV2ZWwsIHRoaXMuc3RyYXRlZ3kpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBleHBvcnRzLklORkxBVEU6XG4gICAgY2FzZSBleHBvcnRzLkdVTlpJUDpcbiAgICBjYXNlIGV4cG9ydHMuSU5GTEFURVJBVzpcbiAgICBjYXNlIGV4cG9ydHMuVU5aSVA6XG4gICAgICB0aGlzLmVyciA9IHpsaWJfaW5mbGF0ZS5pbmZsYXRlSW5pdDIodGhpcy5zdHJtLCB0aGlzLndpbmRvd0JpdHMpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBtb2RlICcgKyB0aGlzLm1vZGUpO1xuICB9XG5cbiAgaWYgKHRoaXMuZXJyICE9PSBleHBvcnRzLlpfT0spIHtcbiAgICB0aGlzLl9lcnJvcignSW5pdCBlcnJvcicpO1xuICB9XG5cbiAgdGhpcy5kaWN0aW9uYXJ5ID0gZGljdGlvbmFyeTtcblxuICB0aGlzLndyaXRlX2luX3Byb2dyZXNzID0gZmFsc2U7XG4gIHRoaXMuaW5pdF9kb25lID0gdHJ1ZTtcbn07XG5cblpsaWIucHJvdG90eXBlLl9zZXREaWN0aW9uYXJ5ID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kaWN0aW9uYXJ5ID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmVyciA9IGV4cG9ydHMuWl9PSztcblxuICBzd2l0Y2ggKHRoaXMubW9kZSkge1xuICAgIGNhc2UgZXhwb3J0cy5ERUZMQVRFOlxuICAgIGNhc2UgZXhwb3J0cy5ERUZMQVRFUkFXOlxuICAgICAgdGhpcy5lcnIgPSB6bGliX2RlZmxhdGUuZGVmbGF0ZVNldERpY3Rpb25hcnkodGhpcy5zdHJtLCB0aGlzLmRpY3Rpb25hcnkpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKHRoaXMuZXJyICE9PSBleHBvcnRzLlpfT0spIHtcbiAgICB0aGlzLl9lcnJvcignRmFpbGVkIHRvIHNldCBkaWN0aW9uYXJ5Jyk7XG4gIH1cbn07XG5cblpsaWIucHJvdG90eXBlLl9yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5lcnIgPSBleHBvcnRzLlpfT0s7XG5cbiAgc3dpdGNoICh0aGlzLm1vZGUpIHtcbiAgICBjYXNlIGV4cG9ydHMuREVGTEFURTpcbiAgICBjYXNlIGV4cG9ydHMuREVGTEFURVJBVzpcbiAgICBjYXNlIGV4cG9ydHMuR1pJUDpcbiAgICAgIHRoaXMuZXJyID0gemxpYl9kZWZsYXRlLmRlZmxhdGVSZXNldCh0aGlzLnN0cm0pO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBleHBvcnRzLklORkxBVEU6XG4gICAgY2FzZSBleHBvcnRzLklORkxBVEVSQVc6XG4gICAgY2FzZSBleHBvcnRzLkdVTlpJUDpcbiAgICAgIHRoaXMuZXJyID0gemxpYl9pbmZsYXRlLmluZmxhdGVSZXNldCh0aGlzLnN0cm0pO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICB9XG5cbiAgaWYgKHRoaXMuZXJyICE9PSBleHBvcnRzLlpfT0spIHtcbiAgICB0aGlzLl9lcnJvcignRmFpbGVkIHRvIHJlc2V0IHN0cmVhbScpO1xuICB9XG59O1xuXG5leHBvcnRzLlpsaWIgPSBabGliOyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIElmIG9iai5oYXNPd25Qcm9wZXJ0eSBoYXMgYmVlbiBvdmVycmlkZGVuLCB0aGVuIGNhbGxpbmdcbi8vIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSB3aWxsIGJyZWFrLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzE3MDdcbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocXMsIHNlcCwgZXEsIG9wdGlvbnMpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIHZhciBvYmogPSB7fTtcblxuICBpZiAodHlwZW9mIHFzICE9PSAnc3RyaW5nJyB8fCBxcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gb2JqO1xuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IC9cXCsvZztcbiAgcXMgPSBxcy5zcGxpdChzZXApO1xuXG4gIHZhciBtYXhLZXlzID0gMTAwMDtcbiAgaWYgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMubWF4S2V5cyA9PT0gJ251bWJlcicpIHtcbiAgICBtYXhLZXlzID0gb3B0aW9ucy5tYXhLZXlzO1xuICB9XG5cbiAgdmFyIGxlbiA9IHFzLmxlbmd0aDtcbiAgLy8gbWF4S2V5cyA8PSAwIG1lYW5zIHRoYXQgd2Ugc2hvdWxkIG5vdCBsaW1pdCBrZXlzIGNvdW50XG4gIGlmIChtYXhLZXlzID4gMCAmJiBsZW4gPiBtYXhLZXlzKSB7XG4gICAgbGVuID0gbWF4S2V5cztcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXIgeCA9IHFzW2ldLnJlcGxhY2UocmVnZXhwLCAnJTIwJyksXG4gICAgICAgIGlkeCA9IHguaW5kZXhPZihlcSksXG4gICAgICAgIGtzdHIsIHZzdHIsIGssIHY7XG5cbiAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgIGtzdHIgPSB4LnN1YnN0cigwLCBpZHgpO1xuICAgICAgdnN0ciA9IHguc3Vic3RyKGlkeCArIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBrc3RyID0geDtcbiAgICAgIHZzdHIgPSAnJztcbiAgICB9XG5cbiAgICBrID0gZGVjb2RlVVJJQ29tcG9uZW50KGtzdHIpO1xuICAgIHYgPSBkZWNvZGVVUklDb21wb25lbnQodnN0cik7XG5cbiAgICBpZiAoIWhhc093blByb3BlcnR5KG9iaiwgaykpIHtcbiAgICAgIG9ialtrXSA9IHY7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgIG9ialtrXS5wdXNoKHYpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvYmpba10gPSBbb2JqW2tdLCB2XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc3RyaW5naWZ5UHJpbWl0aXZlID0gZnVuY3Rpb24odikge1xuICBzd2l0Y2ggKHR5cGVvZiB2KSB7XG4gICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIHJldHVybiB2O1xuXG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICByZXR1cm4gdiA/ICd0cnVlJyA6ICdmYWxzZSc7XG5cbiAgICBjYXNlICdudW1iZXInOlxuICAgICAgcmV0dXJuIGlzRmluaXRlKHYpID8gdiA6ICcnO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIHNlcCwgZXEsIG5hbWUpIHtcbiAgc2VwID0gc2VwIHx8ICcmJztcbiAgZXEgPSBlcSB8fCAnPSc7XG4gIGlmIChvYmogPT09IG51bGwpIHtcbiAgICBvYmogPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gbWFwKG9iamVjdEtleXMob2JqKSwgZnVuY3Rpb24oaykge1xuICAgICAgdmFyIGtzID0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShrKSkgKyBlcTtcbiAgICAgIGlmIChpc0FycmF5KG9ialtrXSkpIHtcbiAgICAgICAgcmV0dXJuIG1hcChvYmpba10sIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4ga3MgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKHYpKTtcbiAgICAgICAgfSkuam9pbihzZXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtzICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShvYmpba10pKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKHNlcCk7XG5cbiAgfVxuXG4gIGlmICghbmFtZSkgcmV0dXJuICcnO1xuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ2lmeVByaW1pdGl2ZShuYW1lKSkgKyBlcSArXG4gICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5naWZ5UHJpbWl0aXZlKG9iaikpO1xufTtcblxudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHhzKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmZ1bmN0aW9uIG1hcCAoeHMsIGYpIHtcbiAgaWYgKHhzLm1hcCkgcmV0dXJuIHhzLm1hcChmKTtcbiAgdmFyIHJlcyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzLnB1c2goZih4c1tpXSwgaSkpO1xuICB9XG4gIHJldHVybiByZXM7XG59XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgcmVzLnB1c2goa2V5KTtcbiAgfVxuICByZXR1cm4gcmVzO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGlzU3RyaW5nOiBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT09ICdzdHJpbmcnO1xuICB9LFxuICBpc09iamVjdDogZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIHR5cGVvZihhcmcpID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG4gIH0sXG4gIGlzTnVsbDogZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbiAgfSxcbiAgaXNOdWxsT3JVbmRlZmluZWQ6IGZ1bmN0aW9uKGFyZykge1xuICAgIHJldHVybiBhcmcgPT0gbnVsbDtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIndXNlIHN0cmljdCc7XG5cbnZhciBvYmplY3RBc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbi8vIGNvbXBhcmUgYW5kIGlzQnVmZmVyIHRha2VuIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvYmxvYi82ODBlOWU1ZTQ4OGYyMmFhYzI3NTk5YTU3ZGM4NDRhNjMxNTkyOGRkL2luZGV4LmpzXG4vLyBvcmlnaW5hbCBub3RpY2U6XG5cbi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGZlcm9zc0BmZXJvc3Mub3JnPiA8aHR0cDovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICBpZiAoYSA9PT0gYikge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIHggPSBhLmxlbmd0aDtcbiAgdmFyIHkgPSBiLmxlbmd0aDtcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXTtcbiAgICAgIHkgPSBiW2ldO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG4gIGlmICh5IDwgeCkge1xuICAgIHJldHVybiAxO1xuICB9XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gaXNCdWZmZXIoYikge1xuICBpZiAoZ2xvYmFsLkJ1ZmZlciAmJiB0eXBlb2YgZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBnbG9iYWwuQnVmZmVyLmlzQnVmZmVyKGIpO1xuICB9XG4gIHJldHVybiAhIShiICE9IG51bGwgJiYgYi5faXNCdWZmZXIpO1xufVxuXG4vLyBiYXNlZCBvbiBub2RlIGFzc2VydCwgb3JpZ2luYWwgbm90aWNlOlxuLy8gTkI6IFRoZSBVUkwgdG8gdGhlIENvbW1vbkpTIHNwZWMgaXMga2VwdCBqdXN0IGZvciB0cmFkaXRpb24uXG4vLyAgICAgbm9kZS1hc3NlcnQgaGFzIGV2b2x2ZWQgYSBsb3Qgc2luY2UgdGhlbiwgYm90aCBpbiBBUEkgYW5kIGJlaGF2aW9yLlxuXG4vLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsLycpO1xudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGZ1bmN0aW9uc0hhdmVOYW1lcyA9IChmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmb28oKSB7fS5uYW1lID09PSAnZm9vJztcbn0oKSk7XG5mdW5jdGlvbiBwVG9TdHJpbmcgKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaik7XG59XG5mdW5jdGlvbiBpc1ZpZXcoYXJyYnVmKSB7XG4gIGlmIChpc0J1ZmZlcihhcnJidWYpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgZ2xvYmFsLkFycmF5QnVmZmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIuaXNWaWV3ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlldyhhcnJidWYpO1xuICB9XG4gIGlmICghYXJyYnVmKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChhcnJidWYgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChhcnJidWYuYnVmZmVyICYmIGFycmJ1Zi5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbi8vIDEuIFRoZSBhc3NlcnQgbW9kdWxlIHByb3ZpZGVzIGZ1bmN0aW9ucyB0aGF0IHRocm93XG4vLyBBc3NlcnRpb25FcnJvcidzIHdoZW4gcGFydGljdWxhciBjb25kaXRpb25zIGFyZSBub3QgbWV0LiBUaGVcbi8vIGFzc2VydCBtb2R1bGUgbXVzdCBjb25mb3JtIHRvIHRoZSBmb2xsb3dpbmcgaW50ZXJmYWNlLlxuXG52YXIgYXNzZXJ0ID0gbW9kdWxlLmV4cG9ydHMgPSBvaztcblxuLy8gMi4gVGhlIEFzc2VydGlvbkVycm9yIGlzIGRlZmluZWQgaW4gYXNzZXJ0LlxuLy8gbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7IG1lc3NhZ2U6IG1lc3NhZ2UsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWwsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkIH0pXG5cbnZhciByZWdleCA9IC9cXHMqZnVuY3Rpb25cXHMrKFteXFwoXFxzXSopXFxzKi87XG4vLyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vbGpoYXJiL2Z1bmN0aW9uLnByb3RvdHlwZS5uYW1lL2Jsb2IvYWRlZWVlYzhiZmNjNjA2OGIxODdkN2Q5ZmIzZDViYjFkM2EzMDg5OS9pbXBsZW1lbnRhdGlvbi5qc1xuZnVuY3Rpb24gZ2V0TmFtZShmdW5jKSB7XG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGZ1bmMpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMpIHtcbiAgICByZXR1cm4gZnVuYy5uYW1lO1xuICB9XG4gIHZhciBzdHIgPSBmdW5jLnRvU3RyaW5nKCk7XG4gIHZhciBtYXRjaCA9IHN0ci5tYXRjaChyZWdleCk7XG4gIHJldHVybiBtYXRjaCAmJiBtYXRjaFsxXTtcbn1cbmFzc2VydC5Bc3NlcnRpb25FcnJvciA9IGZ1bmN0aW9uIEFzc2VydGlvbkVycm9yKG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gJ0Fzc2VydGlvbkVycm9yJztcbiAgdGhpcy5hY3R1YWwgPSBvcHRpb25zLmFjdHVhbDtcbiAgdGhpcy5leHBlY3RlZCA9IG9wdGlvbnMuZXhwZWN0ZWQ7XG4gIHRoaXMub3BlcmF0b3IgPSBvcHRpb25zLm9wZXJhdG9yO1xuICBpZiAob3B0aW9ucy5tZXNzYWdlKSB7XG4gICAgdGhpcy5tZXNzYWdlID0gb3B0aW9ucy5tZXNzYWdlO1xuICAgIHRoaXMuZ2VuZXJhdGVkTWVzc2FnZSA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubWVzc2FnZSA9IGdldE1lc3NhZ2UodGhpcyk7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gdHJ1ZTtcbiAgfVxuICB2YXIgc3RhY2tTdGFydEZ1bmN0aW9uID0gb3B0aW9ucy5zdGFja1N0YXJ0RnVuY3Rpb24gfHwgZmFpbDtcbiAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBub24gdjggYnJvd3NlcnMgc28gd2UgY2FuIGhhdmUgYSBzdGFja3RyYWNlXG4gICAgdmFyIGVyciA9IG5ldyBFcnJvcigpO1xuICAgIGlmIChlcnIuc3RhY2spIHtcbiAgICAgIHZhciBvdXQgPSBlcnIuc3RhY2s7XG5cbiAgICAgIC8vIHRyeSB0byBzdHJpcCB1c2VsZXNzIGZyYW1lc1xuICAgICAgdmFyIGZuX25hbWUgPSBnZXROYW1lKHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiB0cnVuY2F0ZShzLCBuKSB7XG4gIGlmICh0eXBlb2YgcyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cbmZ1bmN0aW9uIGluc3BlY3Qoc29tZXRoaW5nKSB7XG4gIGlmIChmdW5jdGlvbnNIYXZlTmFtZXMgfHwgIXV0aWwuaXNGdW5jdGlvbihzb21ldGhpbmcpKSB7XG4gICAgcmV0dXJuIHV0aWwuaW5zcGVjdChzb21ldGhpbmcpO1xuICB9XG4gIHZhciByYXduYW1lID0gZ2V0TmFtZShzb21ldGhpbmcpO1xuICB2YXIgbmFtZSA9IHJhd25hbWUgPyAnOiAnICsgcmF3bmFtZSA6ICcnO1xuICByZXR1cm4gJ1tGdW5jdGlvbicgKyAgbmFtZSArICddJztcbn1cbmZ1bmN0aW9uIGdldE1lc3NhZ2Uoc2VsZikge1xuICByZXR1cm4gdHJ1bmNhdGUoaW5zcGVjdChzZWxmLmFjdHVhbCksIDEyOCkgKyAnICcgK1xuICAgICAgICAgc2VsZi5vcGVyYXRvciArICcgJyArXG4gICAgICAgICB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuZXhwZWN0ZWQpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdkZWVwRXF1YWwnLCBhc3NlcnQuZGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIGRlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBTdHJpY3RFcXVhbCcsIGFzc2VydC5kZWVwU3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAmJiBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gY29tcGFyZShhY3R1YWwsIGV4cGVjdGVkKSA9PT0gMDtcblxuICAvLyA3LjIuIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIERhdGUgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIERhdGUgb2JqZWN0IHRoYXQgcmVmZXJzIHRvIHRoZSBzYW1lIHRpbWUuXG4gIH0gZWxzZSBpZiAodXRpbC5pc0RhdGUoYWN0dWFsKSAmJiB1dGlsLmlzRGF0ZShleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMyBJZiB0aGUgZXhwZWN0ZWQgdmFsdWUgaXMgYSBSZWdFeHAgb2JqZWN0LCB0aGUgYWN0dWFsIHZhbHVlIGlzXG4gIC8vIGVxdWl2YWxlbnQgaWYgaXQgaXMgYWxzbyBhIFJlZ0V4cCBvYmplY3Qgd2l0aCB0aGUgc2FtZSBzb3VyY2UgYW5kXG4gIC8vIHByb3BlcnRpZXMgKGBnbG9iYWxgLCBgbXVsdGlsaW5lYCwgYGxhc3RJbmRleGAsIGBpZ25vcmVDYXNlYCkuXG4gIH0gZWxzZSBpZiAodXRpbC5pc1JlZ0V4cChhY3R1YWwpICYmIHV0aWwuaXNSZWdFeHAoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGFjdHVhbC5zb3VyY2UgPT09IGV4cGVjdGVkLnNvdXJjZSAmJlxuICAgICAgICAgICBhY3R1YWwuZ2xvYmFsID09PSBleHBlY3RlZC5nbG9iYWwgJiZcbiAgICAgICAgICAgYWN0dWFsLm11bHRpbGluZSA9PT0gZXhwZWN0ZWQubXVsdGlsaW5lICYmXG4gICAgICAgICAgIGFjdHVhbC5sYXN0SW5kZXggPT09IGV4cGVjdGVkLmxhc3RJbmRleCAmJlxuICAgICAgICAgICBhY3R1YWwuaWdub3JlQ2FzZSA9PT0gZXhwZWN0ZWQuaWdub3JlQ2FzZTtcblxuICAvLyA3LjQuIE90aGVyIHBhaXJzIHRoYXQgZG8gbm90IGJvdGggcGFzcyB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcsXG4gIC8vIGVxdWl2YWxlbmNlIGlzIGRldGVybWluZWQgYnkgPT0uXG4gIH0gZWxzZSBpZiAoKGFjdHVhbCA9PT0gbnVsbCB8fCB0eXBlb2YgYWN0dWFsICE9PSAnb2JqZWN0JykgJiZcbiAgICAgICAgICAgICAoZXhwZWN0ZWQgPT09IG51bGwgfHwgdHlwZW9mIGV4cGVjdGVkICE9PSAnb2JqZWN0JykpIHtcbiAgICByZXR1cm4gc3RyaWN0ID8gYWN0dWFsID09PSBleHBlY3RlZCA6IGFjdHVhbCA9PSBleHBlY3RlZDtcblxuICAvLyBJZiBib3RoIHZhbHVlcyBhcmUgaW5zdGFuY2VzIG9mIHR5cGVkIGFycmF5cywgd3JhcCB0aGVpciB1bmRlcmx5aW5nXG4gIC8vIEFycmF5QnVmZmVycyBpbiBhIEJ1ZmZlciBlYWNoIHRvIGluY3JlYXNlIHBlcmZvcm1hbmNlXG4gIC8vIFRoaXMgb3B0aW1pemF0aW9uIHJlcXVpcmVzIHRoZSBhcnJheXMgdG8gaGF2ZSB0aGUgc2FtZSB0eXBlIGFzIGNoZWNrZWQgYnlcbiAgLy8gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyAoYWthIHBUb1N0cmluZykuIE5ldmVyIHBlcmZvcm0gYmluYXJ5XG4gIC8vIGNvbXBhcmlzb25zIGZvciBGbG9hdCpBcnJheXMsIHRob3VnaCwgc2luY2UgZS5nLiArMCA9PT0gLTAgYnV0IHRoZWlyXG4gIC8vIGJpdCBwYXR0ZXJucyBhcmUgbm90IGlkZW50aWNhbC5cbiAgfSBlbHNlIGlmIChpc1ZpZXcoYWN0dWFsKSAmJiBpc1ZpZXcoZXhwZWN0ZWQpICYmXG4gICAgICAgICAgICAgcFRvU3RyaW5nKGFjdHVhbCkgPT09IHBUb1N0cmluZyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICAhKGFjdHVhbCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSB8fFxuICAgICAgICAgICAgICAgYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSkge1xuICAgIHJldHVybiBjb21wYXJlKG5ldyBVaW50OEFycmF5KGFjdHVhbC5idWZmZXIpLFxuICAgICAgICAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KGV4cGVjdGVkLmJ1ZmZlcikpID09PSAwO1xuXG4gIC8vIDcuNSBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSBpZiAoaXNCdWZmZXIoYWN0dWFsKSAhPT0gaXNCdWZmZXIoZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG1lbW9zID0gbWVtb3MgfHwge2FjdHVhbDogW10sIGV4cGVjdGVkOiBbXX07XG5cbiAgICB2YXIgYWN0dWFsSW5kZXggPSBtZW1vcy5hY3R1YWwuaW5kZXhPZihhY3R1YWwpO1xuICAgIGlmIChhY3R1YWxJbmRleCAhPT0gLTEpIHtcbiAgICAgIGlmIChhY3R1YWxJbmRleCA9PT0gbWVtb3MuZXhwZWN0ZWQuaW5kZXhPZihleHBlY3RlZCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbWVtb3MuYWN0dWFsLnB1c2goYWN0dWFsKTtcbiAgICBtZW1vcy5leHBlY3RlZC5wdXNoKGV4cGVjdGVkKTtcblxuICAgIHJldHVybiBvYmpFcXVpdihhY3R1YWwsIGV4cGVjdGVkLCBzdHJpY3QsIG1lbW9zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufVxuXG5mdW5jdGlvbiBvYmpFcXVpdihhLCBiLCBzdHJpY3QsIGFjdHVhbFZpc2l0ZWRPYmplY3RzKSB7XG4gIGlmIChhID09PSBudWxsIHx8IGEgPT09IHVuZGVmaW5lZCB8fCBiID09PSBudWxsIHx8IGIgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKVxuICAgIHJldHVybiBhID09PSBiO1xuICBpZiAoc3RyaWN0ICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKTtcbiAgdmFyIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYiwgc3RyaWN0KTtcbiAgfVxuICB2YXIga2EgPSBvYmplY3RLZXlzKGEpO1xuICB2YXIga2IgPSBvYmplY3RLZXlzKGIpO1xuICB2YXIga2V5LCBpO1xuICAvLyBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGtleXMgaW5jb3Jwb3JhdGVzXG4gIC8vIGhhc093blByb3BlcnR5KVxuICBpZiAoa2EubGVuZ3RoICE9PSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIV9kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0sIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyA4LiBUaGUgbm9uLWVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBmb3IgYW55IGRlZXAgaW5lcXVhbGl0eS5cbi8vIGFzc2VydC5ub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90RGVlcEVxdWFsID0gZnVuY3Rpb24gbm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgZmFsc2UpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbmFzc2VydC5ub3REZWVwU3RyaWN0RXF1YWwgPSBub3REZWVwU3RyaWN0RXF1YWw7XG5mdW5jdGlvbiBub3REZWVwU3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCB0cnVlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ25vdERlZXBTdHJpY3RFcXVhbCcsIG5vdERlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn1cblxuXG4vLyA5LiBUaGUgc3RyaWN0IGVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBzdHJpY3QgZXF1YWxpdHksIGFzIGRldGVybWluZWQgYnkgPT09LlxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnN0cmljdEVxdWFsID0gZnVuY3Rpb24gc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09PScsIGFzc2VydC5zdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDEwLiBUaGUgc3RyaWN0IG5vbi1lcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgZm9yIHN0cmljdCBpbmVxdWFsaXR5LCBhc1xuLy8gZGV0ZXJtaW5lZCBieSAhPT0uICBhc3NlcnQubm90U3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQubm90U3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT09JywgYXNzZXJ0Lm5vdFN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkge1xuICBpZiAoIWFjdHVhbCB8fCAhZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGV4cGVjdGVkKSA9PSAnW29iamVjdCBSZWdFeHBdJykge1xuICAgIHJldHVybiBleHBlY3RlZC50ZXN0KGFjdHVhbCk7XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWdub3JlLiAgVGhlIGluc3RhbmNlb2YgY2hlY2sgZG9lc24ndCB3b3JrIGZvciBhcnJvdyBmdW5jdGlvbnMuXG4gIH1cblxuICBpZiAoRXJyb3IuaXNQcm90b3R5cGVPZihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gZXhwZWN0ZWQuY2FsbCh7fSwgYWN0dWFsKSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gX3RyeUJsb2NrKGJsb2NrKSB7XG4gIHZhciBlcnJvcjtcbiAgdHJ5IHtcbiAgICBibG9jaygpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHR5cGVvZiBibG9jayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYmxvY2tcIiBhcmd1bWVudCBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZXhwZWN0ZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIGFjdHVhbCA9IF90cnlCbG9jayhibG9jayk7XG5cbiAgbWVzc2FnZSA9IChleHBlY3RlZCAmJiBleHBlY3RlZC5uYW1lID8gJyAoJyArIGV4cGVjdGVkLm5hbWUgKyAnKS4nIDogJy4nKSArXG4gICAgICAgICAgICAobWVzc2FnZSA/ICcgJyArIG1lc3NhZ2UgOiAnLicpO1xuXG4gIGlmIChzaG91bGRUaHJvdyAmJiAhYWN0dWFsKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnTWlzc2luZyBleHBlY3RlZCBleGNlcHRpb24nICsgbWVzc2FnZSk7XG4gIH1cblxuICB2YXIgdXNlclByb3ZpZGVkTWVzc2FnZSA9IHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJztcbiAgdmFyIGlzVW53YW50ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgdXRpbC5pc0Vycm9yKGFjdHVhbCk7XG4gIHZhciBpc1VuZXhwZWN0ZWRFeGNlcHRpb24gPSAhc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmICFleHBlY3RlZDtcblxuICBpZiAoKGlzVW53YW50ZWRFeGNlcHRpb24gJiZcbiAgICAgIHVzZXJQcm92aWRlZE1lc3NhZ2UgJiZcbiAgICAgIGV4cGVjdGVkRXhjZXB0aW9uKGFjdHVhbCwgZXhwZWN0ZWQpKSB8fFxuICAgICAgaXNVbmV4cGVjdGVkRXhjZXB0aW9uKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCAnR290IHVud2FudGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICgoc2hvdWxkVGhyb3cgJiYgYWN0dWFsICYmIGV4cGVjdGVkICYmXG4gICAgICAhZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8ICghc2hvdWxkVGhyb3cgJiYgYWN0dWFsKSkge1xuICAgIHRocm93IGFjdHVhbDtcbiAgfVxufVxuXG4vLyAxMS4gRXhwZWN0ZWQgdG8gdGhyb3cgYW4gZXJyb3I6XG4vLyBhc3NlcnQudGhyb3dzKGJsb2NrLCBFcnJvcl9vcHQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LnRocm93cyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKHRydWUsIGJsb2NrLCBlcnJvciwgbWVzc2FnZSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovZXJyb3IsIC8qb3B0aW9uYWwqL21lc3NhZ2UpIHtcbiAgX3Rocm93cyhmYWxzZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHRocm93IGVycjsgfTtcblxuLy8gRXhwb3NlIGEgc3RyaWN0IG9ubHkgdmFyaWFudCBvZiBhc3NlcnRcbmZ1bmN0aW9uIHN0cmljdCh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBzdHJpY3QpO1xufVxuYXNzZXJ0LnN0cmljdCA9IG9iamVjdEFzc2lnbihzdHJpY3QsIGFzc2VydCwge1xuICBlcXVhbDogYXNzZXJ0LnN0cmljdEVxdWFsLFxuICBkZWVwRXF1YWw6IGFzc2VydC5kZWVwU3RyaWN0RXF1YWwsXG4gIG5vdEVxdWFsOiBhc3NlcnQubm90U3RyaWN0RXF1YWwsXG4gIG5vdERlZXBFcXVhbDogYXNzZXJ0Lm5vdERlZXBTdHJpY3RFcXVhbFxufSk7XG5hc3NlcnQuc3RyaWN0LnN0cmljdCA9IGFzc2VydC5zdHJpY3Q7XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayhcbiAgICAgIHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aClcbiAgICApKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiXG4vL3ZhciBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5mdW5jdGlvbiBkZWZhdWx0RXJyb3JIYW5kbGluZ0ltcGxlbWVudGF0aW9uKGVyciwgcmVzKXtcblx0Ly9jb25zb2xlLmxvZyhlcnIuc3RhY2spO1xuXHRpZihlcnIpIHRocm93IGVycjtcblx0cmV0dXJuIHJlcztcbn1cblxucmVxdWlyZShcIi4vbGliL292ZXJ3cml0ZVJlcXVpcmVcIik7XG4vKlxuY29uc3QgUFNLQnVmZmVyID0gcmVxdWlyZSgncHNrYnVmZmVyJyk7XG4kJC5QU0tCdWZmZXIgPSBQU0tCdWZmZXI7ICovXG5cblxuJCQub2Jzb2xldGUoXCJQbGVhc2UgcmVtb3ZlICQkLmVycm9ySGFuZGxlciAgYXNhcFwiKTtcbiQkLmVycm9ySGFuZGxlciA9IHtcbiAgICAgICAgZXJyb3I6ZnVuY3Rpb24oZXJyLCBhcmdzLCBtc2cpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLCBcIlVua25vd24gZXJyb3IgZnJvbSBmdW5jdGlvbiBjYWxsIHdpdGggYXJndW1lbnRzOlwiLCBhcmdzLCBcIk1lc3NhZ2U6XCIsIG1zZyk7XG4gICAgICAgIH0sXG4gICAgICAgIHRocm93RXJyb3I6ZnVuY3Rpb24oZXJyLCBhcmdzLCBtc2cpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyLCBcIlVua25vd24gZXJyb3IgZnJvbSBmdW5jdGlvbiBjYWxsIHdpdGggYXJndW1lbnRzOlwiLCBhcmdzLCBcIk1lc3NhZ2U6XCIsIG1zZyk7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH0sXG4gICAgICAgIGlnbm9yZVBvc3NpYmxlRXJyb3I6IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgICAgICAgY29uc29sZS5sb2cobmFtZSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN5bnRheEVycm9yOmZ1bmN0aW9uKHByb3BlcnR5LCBzd2FybSwgdGV4dCl7XG4gICAgICAgICAgICAvL3Rocm93IG5ldyBFcnJvcihcIk1pc3NwZWxsZWQgbWVtYmVyIG5hbWUgb3Igb3RoZXIgaW50ZXJuYWwgZXJyb3IhXCIpO1xuICAgICAgICAgICAgdmFyIHN3YXJtTmFtZTtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBpZih0eXBlb2Ygc3dhcm0gPT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtTmFtZSA9IHN3YXJtO1xuICAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAgIGlmKHN3YXJtICYmIHN3YXJtLm1ldGEpe1xuICAgICAgICAgICAgICAgICAgICBzd2FybU5hbWUgID0gc3dhcm0ubWV0YS5zd2FybVR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtTmFtZSA9IHN3YXJtLmdldElubmVyVmFsdWUoKS5tZXRhLnN3YXJtVHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaChlcnIpe1xuICAgICAgICAgICAgICAgIHN3YXJtTmFtZSA9IGVyci50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYocHJvcGVydHkpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV3JvbmcgbWVtYmVyIG5hbWUgXCIsIHByb3BlcnR5LCAgXCIgaW4gc3dhcm0gXCIsIHN3YXJtTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYodGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5rbm93biBzd2FybVwiLCBzd2FybU5hbWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sXG4gICAgICAgIHdhcm5pbmc6ZnVuY3Rpb24obXNnKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1zZyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiQkLm9ic29sZXRlKFwiUGxlYXNlIHJlbW92ZSAkJC5zYWZlRXJyb3JIYW5kbGluZyBhc2FwXCIpO1xuJCQuc2FmZUVycm9ySGFuZGxpbmcgPSBmdW5jdGlvbihjYWxsYmFjayl7XG4gICAgICAgIGlmKGNhbGxiYWNrKXtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaztcbiAgICAgICAgfSBlbHNle1xuICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRFcnJvckhhbmRsaW5nSW1wbGVtZW50YXRpb247XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuJCQub2Jzb2xldGUoXCJQbGVhc2UgcmVtb3ZlICQkLl9faW50ZXJuIGFzYXBcIik7XG4kJC5fX2ludGVybiA9IHtcbiAgICAgICAgbWtBcmdzOmZ1bmN0aW9uKGFyZ3MscG9zKXtcbiAgICAgICAgICAgIHZhciBhcmdzQXJyYXkgPSBbXTtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IHBvczsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIGFyZ3NBcnJheS5wdXNoKGFyZ3NbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NBcnJheTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG52YXIgc3dhcm1VdGlscyA9IHJlcXVpcmUoXCIuL2xpYi9jaG9yZW9ncmFwaGllcy9zd2FybVwiKTtcbnZhciBhc3NldFV0aWxzID0gcmVxdWlyZShcIi4vbGliL3V0aWxpdHlGdW5jdGlvbnMvYXNzZXRcIik7XG5cbnZhciB0cmFuc2FjdGlvblV0aWxzID0gcmVxdWlyZShcIi4vbGliL3V0aWxpdHlGdW5jdGlvbnMvdHJhbnNhY3Rpb25cIik7XG4kJC5kZWZhdWx0RXJyb3JIYW5kbGluZ0ltcGxlbWVudGF0aW9uID0gZGVmYXVsdEVycm9ySGFuZGxpbmdJbXBsZW1lbnRhdGlvbjtcblxudmFyIGNhbGxmbG93TW9kdWxlID0gcmVxdWlyZShcIi4vbGliL3N3YXJtRGVzY3JpcHRpb25cIik7XG4kJC5jYWxsZmxvd3MgICAgICAgID0gY2FsbGZsb3dNb2R1bGUuY3JlYXRlU3dhcm1FbmdpbmUoXCJjYWxsZmxvd1wiKTtcbiQkLmNhbGxmbG93ICAgICAgICAgPSAkJC5jYWxsZmxvd3M7XG4kJC5mbG93ICAgICAgICAgICAgID0gJCQuY2FsbGZsb3dzO1xuJCQuZmxvd3MgICAgICAgICAgICA9ICQkLmNhbGxmbG93cztcblxuJCQuc3dhcm1zICAgICAgICAgICA9IGNhbGxmbG93TW9kdWxlLmNyZWF0ZVN3YXJtRW5naW5lKFwic3dhcm1cIiwgc3dhcm1VdGlscyk7XG4kJC5zd2FybSAgICAgICAgICAgID0gJCQuc3dhcm1zO1xuJCQuY29udHJhY3RzICAgICAgICA9IGNhbGxmbG93TW9kdWxlLmNyZWF0ZVN3YXJtRW5naW5lKFwiY29udHJhY3RcIiwgc3dhcm1VdGlscyk7XG4kJC5jb250cmFjdCAgICAgICAgID0gJCQuY29udHJhY3RzO1xuJCQuYXNzZXRzICAgICAgICAgICA9IGNhbGxmbG93TW9kdWxlLmNyZWF0ZVN3YXJtRW5naW5lKFwiYXNzZXRcIiwgYXNzZXRVdGlscyk7XG4kJC5hc3NldCAgICAgICAgICAgID0gJCQuYXNzZXRzO1xuJCQudHJhbnNhY3Rpb25zICAgICA9IGNhbGxmbG93TW9kdWxlLmNyZWF0ZVN3YXJtRW5naW5lKFwidHJhbnNhY3Rpb25cIiwgdHJhbnNhY3Rpb25VdGlscyk7XG4kJC50cmFuc2FjdGlvbiAgICAgID0gJCQudHJhbnNhY3Rpb25zO1xuXG5cbiQkLlBTS19QdWJTdWIgPSByZXF1aXJlKFwic291bmRwdWJzdWJcIikuc291bmRQdWJTdWI7XG5cbiQkLnNlY3VyaXR5Q29udGV4dCA9IFwic3lzdGVtXCI7XG4kJC5saWJyYXJ5UHJlZml4ID0gXCJnbG9iYWxcIjtcbiQkLmxpYnJhcmllcyA9IHtcbiAgICBnbG9iYWw6e1xuXG4gICAgfVxufTtcblxuJCQuaW50ZXJjZXB0b3IgPSByZXF1aXJlKFwiLi9saWIvSW50ZXJjZXB0b3JSZWdpc3RyeVwiKS5jcmVhdGVJbnRlcmNlcHRvclJlZ2lzdHJ5KCk7XG5cbiQkLmxvYWRMaWJyYXJ5ID0gcmVxdWlyZShcIi4vbGliL2xvYWRMaWJyYXJ5XCIpLmxvYWRMaWJyYXJ5O1xuXG5yZXF1aXJlTGlicmFyeSA9IGZ1bmN0aW9uKG5hbWUpe1xuICAgIC8vdmFyIGFic29sdXRlUGF0aCA9IHBhdGgucmVzb2x2ZSggICQkLl9fZ2xvYmFsLl9fbG9hZExpYnJhcnlSb290ICsgbmFtZSk7XG4gICAgcmV0dXJuICQkLmxvYWRMaWJyYXJ5KG5hbWUsbmFtZSk7XG59O1xuXG5yZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5cbi8qLy9UT0RPOiBTSE9VTEQgYmUgbW92ZWQgaW4gJCQuX19nbG9iYWxzXG4kJC5lbnN1cmVGb2xkZXJFeGlzdHMgPSBmdW5jdGlvbiAoZm9sZGVyLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IGZsb3cgPSAkJC5mbG93LnN0YXJ0KFwidXRpbHMubWtEaXJSZWNcIik7XG4gICAgZmxvdy5tYWtlKGZvbGRlciwgY2FsbGJhY2spO1xufTtcblxuJCQuZW5zdXJlTGlua0V4aXN0cyA9IGZ1bmN0aW9uIChleGlzdGluZ1BhdGgsIG5ld1BhdGgsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgZmxvdyA9ICQkLmZsb3cuc3RhcnQoXCJ1dGlscy5ta0RpclJlY1wiKTtcbiAgICBmbG93Lm1ha2VMaW5rKGV4aXN0aW5nUGF0aCwgbmV3UGF0aCwgY2FsbGJhY2spO1xufTsqL1xuXG4kJC5wYXRoTm9ybWFsaXplID0gZnVuY3Rpb24gKHBhdGhUb05vcm1hbGl6ZSkge1xuICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcbiAgICBwYXRoVG9Ob3JtYWxpemUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoVG9Ob3JtYWxpemUpO1xuXG4gICAgcmV0dXJuIHBhdGhUb05vcm1hbGl6ZS5yZXBsYWNlKC9bXFwvXFxcXF0vZywgcGF0aC5zZXApO1xufTtcblxuLy8gYWRkIGludGVyY2VwdG9yc1xuXG5jb25zdCBjcnlwdG8gPSByZXF1aXJlKCdjcnlwdG8nKTtcblxuJCQuaW50ZXJjZXB0b3IucmVnaXN0ZXIoJyonLCAnKicsICdiZWZvcmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3Qgc3dhcm1UeXBlTmFtZSA9IHRoaXMuZ2V0TWV0YWRhdGEoJ3N3YXJtVHlwZU5hbWUnKTtcbiAgICBjb25zdCBwaGFzZU5hbWUgPSB0aGlzLmdldE1ldGFkYXRhKCdwaGFzZU5hbWUnKTtcbiAgICBjb25zdCBzd2FybUlkID0gdGhpcy5nZXRNZXRhZGF0YSgnc3dhcm1JZCcpO1xuICAgIGNvbnN0IGV4ZWN1dGlvbklkID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnaGV4Jyk7XG5cbiAgICB0aGlzLnNldE1ldGFkYXRhKCdleGVjdXRpb25JZCcsIGV4ZWN1dGlvbklkKTtcblxuICAgICQkLmV2ZW50KCdzd2FybS5jYWxsLmJlZm9yZScsIHtzd2FybVR5cGVOYW1lLCBwaGFzZU5hbWUsIGV4ZWN1dGlvbklkfSk7XG59KTtcblxuJCQuaW50ZXJjZXB0b3IucmVnaXN0ZXIoJyonLCAnKicsICdhZnRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBzd2FybVR5cGVOYW1lID0gdGhpcy5nZXRNZXRhZGF0YSgnc3dhcm1UeXBlTmFtZScpO1xuICAgIGNvbnN0IHBoYXNlTmFtZSA9IHRoaXMuZ2V0TWV0YWRhdGEoJ3BoYXNlTmFtZScpO1xuICAgIGNvbnN0IGV4ZWN1dGlvbklkID0gdGhpcy5nZXRNZXRhZGF0YSgnZXhlY3V0aW9uSWQnKTtcblxuICAgIHRoaXMuc2V0TWV0YWRhdGEoJ2V4ZWN1dGlvbklkJywgdW5kZWZpbmVkKTtcblxuICAgICQkLmV2ZW50KCdzd2FybS5jYWxsLnRpbWUnLCB7c3dhcm1UeXBlTmFtZSwgcGhhc2VOYW1lLCBleGVjdXRpb25JZH0pO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFx0XHRcdFx0Y3JlYXRlU3dhcm1FbmdpbmU6IHJlcXVpcmUoXCIuL2xpYi9zd2FybURlc2NyaXB0aW9uXCIpLmNyZWF0ZVN3YXJtRW5naW5lLFxuICAgICAgICAgICAgICAgICAgICBjcmVhdGVKb2luUG9pbnQ6IHJlcXVpcmUoXCIuL2xpYi9wYXJhbGxlbEpvaW5Qb2ludFwiKS5jcmVhdGVKb2luUG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIGNyZWF0ZVNlcmlhbEpvaW5Qb2ludDogcmVxdWlyZShcIi4vbGliL3NlcmlhbEpvaW5Qb2ludFwiKS5jcmVhdGVTZXJpYWxKb2luUG9pbnQsXG4gICAgICAgICAgICAgICAgICAgIHN3YXJtSW5zdGFuY2VNYW5hZ2VyOiByZXF1aXJlKFwiLi9saWIvY2hvcmVvZ3JhcGhpZXMvc3dhcm1JbnN0YW5jZXNNYW5hZ2VyXCIpLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVJbnRlcm5hbFN3YXJtUm91dGluZzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGR1bW15Vk0obmFtZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gc29sdmVTd2FybShzd2FybSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQkLnN3YXJtc0luc3RhbmNlc01hbmFnZXIucmV2aXZlX3N3YXJtKHN3YXJtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkJC5QU0tfUHViU3ViLnN1YnNjcmliZShuYW1lLCBzb2x2ZVN3YXJtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIGEgZmFrZSBleGVjdXRpb24gY29udGV4dC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGR1bW15Vk0oJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04pO1xuICAgICAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdH07XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIG9iamVjdENyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgb2JqZWN0Q3JlYXRlUG9seWZpbGxcbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgb2JqZWN0S2V5c1BvbHlmaWxsXG52YXIgYmluZCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIHx8IGZ1bmN0aW9uQmluZFBvbHlmaWxsXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX2V2ZW50cycpKSB7XG4gICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgfVxuXG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbnZhciBkZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbnZhciBoYXNEZWZpbmVQcm9wZXJ0eTtcbnRyeSB7XG4gIHZhciBvID0ge307XG4gIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvLCAneCcsIHsgdmFsdWU6IDAgfSk7XG4gIGhhc0RlZmluZVByb3BlcnR5ID0gby54ID09PSAwO1xufSBjYXRjaCAoZXJyKSB7IGhhc0RlZmluZVByb3BlcnR5ID0gZmFsc2UgfVxuaWYgKGhhc0RlZmluZVByb3BlcnR5KSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIsICdkZWZhdWx0TWF4TGlzdGVuZXJzJywge1xuICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbihhcmcpIHtcbiAgICAgIC8vIGNoZWNrIHdoZXRoZXIgdGhlIGlucHV0IGlzIGEgcG9zaXRpdmUgbnVtYmVyICh3aG9zZSB2YWx1ZSBpcyB6ZXJvIG9yXG4gICAgICAvLyBncmVhdGVyIGFuZCBub3QgYSBOYU4pLlxuICAgICAgaWYgKHR5cGVvZiBhcmcgIT09ICdudW1iZXInIHx8IGFyZyA8IDAgfHwgYXJnICE9PSBhcmcpXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZGVmYXVsdE1heExpc3RlbmVyc1wiIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgICAgIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSBhcmc7XG4gICAgfVxuICB9KTtcbn0gZWxzZSB7XG4gIEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gZGVmYXVsdE1heExpc3RlbmVycztcbn1cblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKG4pIHtcbiAgaWYgKHR5cGVvZiBuICE9PSAnbnVtYmVyJyB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcIm5cIiBhcmd1bWVudCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gJGdldE1heExpc3RlbmVycyh0aGF0KSB7XG4gIGlmICh0aGF0Ll9tYXhMaXN0ZW5lcnMgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gIHJldHVybiB0aGF0Ll9tYXhMaXN0ZW5lcnM7XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZ2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gJGdldE1heExpc3RlbmVycyh0aGlzKTtcbn07XG5cbi8vIFRoZXNlIHN0YW5kYWxvbmUgZW1pdCogZnVuY3Rpb25zIGFyZSB1c2VkIHRvIG9wdGltaXplIGNhbGxpbmcgb2YgZXZlbnRcbi8vIGhhbmRsZXJzIGZvciBmYXN0IGNhc2VzIGJlY2F1c2UgZW1pdCgpIGl0c2VsZiBvZnRlbiBoYXMgYSB2YXJpYWJsZSBudW1iZXIgb2Zcbi8vIGFyZ3VtZW50cyBhbmQgY2FuIGJlIGRlb3B0aW1pemVkIGJlY2F1c2Ugb2YgdGhhdC4gVGhlc2UgZnVuY3Rpb25zIGFsd2F5cyBoYXZlXG4vLyB0aGUgc2FtZSBudW1iZXIgb2YgYXJndW1lbnRzIGFuZCB0aHVzIGRvIG5vdCBnZXQgZGVvcHRpbWl6ZWQsIHNvIHRoZSBjb2RlXG4vLyBpbnNpZGUgdGhlbSBjYW4gZXhlY3V0ZSBmYXN0ZXIuXG5mdW5jdGlvbiBlbWl0Tm9uZShoYW5kbGVyLCBpc0ZuLCBzZWxmKSB7XG4gIGlmIChpc0ZuKVxuICAgIGhhbmRsZXIuY2FsbChzZWxmKTtcbiAgZWxzZSB7XG4gICAgdmFyIGxlbiA9IGhhbmRsZXIubGVuZ3RoO1xuICAgIHZhciBsaXN0ZW5lcnMgPSBhcnJheUNsb25lKGhhbmRsZXIsIGxlbik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSlcbiAgICAgIGxpc3RlbmVyc1tpXS5jYWxsKHNlbGYpO1xuICB9XG59XG5mdW5jdGlvbiBlbWl0T25lKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGVtaXRUd28oaGFuZGxlciwgaXNGbiwgc2VsZiwgYXJnMSwgYXJnMikge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmNhbGwoc2VsZiwgYXJnMSwgYXJnMik7XG4gIGVsc2Uge1xuICAgIHZhciBsZW4gPSBoYW5kbGVyLmxlbmd0aDtcbiAgICB2YXIgbGlzdGVuZXJzID0gYXJyYXlDbG9uZShoYW5kbGVyLCBsZW4pO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpXG4gICAgICBsaXN0ZW5lcnNbaV0uY2FsbChzZWxmLCBhcmcxLCBhcmcyKTtcbiAgfVxufVxuZnVuY3Rpb24gZW1pdFRocmVlKGhhbmRsZXIsIGlzRm4sIHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpIHtcbiAgaWYgKGlzRm4pXG4gICAgaGFuZGxlci5jYWxsKHNlbGYsIGFyZzEsIGFyZzIsIGFyZzMpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmNhbGwoc2VsZiwgYXJnMSwgYXJnMiwgYXJnMyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZW1pdE1hbnkoaGFuZGxlciwgaXNGbiwgc2VsZiwgYXJncykge1xuICBpZiAoaXNGbilcbiAgICBoYW5kbGVyLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICBlbHNlIHtcbiAgICB2YXIgbGVuID0gaGFuZGxlci5sZW5ndGg7XG4gICAgdmFyIGxpc3RlbmVycyA9IGFycmF5Q2xvbmUoaGFuZGxlciwgbGVuKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICB9XG59XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQodHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgZXZlbnRzO1xuICB2YXIgZG9FcnJvciA9ICh0eXBlID09PSAnZXJyb3InKTtcblxuICBldmVudHMgPSB0aGlzLl9ldmVudHM7XG4gIGlmIChldmVudHMpXG4gICAgZG9FcnJvciA9IChkb0Vycm9yICYmIGV2ZW50cy5lcnJvciA9PSBudWxsKTtcbiAgZWxzZSBpZiAoIWRvRXJyb3IpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKGRvRXJyb3IpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpXG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuaGFuZGxlZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgZXJyLmNvbnRleHQgPSBlcjtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaGFuZGxlciA9IGV2ZW50c1t0eXBlXTtcblxuICBpZiAoIWhhbmRsZXIpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIHZhciBpc0ZuID0gdHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbic7XG4gIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgY2FzZSAxOlxuICAgICAgZW1pdE5vbmUoaGFuZGxlciwgaXNGbiwgdGhpcyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDI6XG4gICAgICBlbWl0T25lKGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM6XG4gICAgICBlbWl0VHdvKGhhbmRsZXIsIGlzRm4sIHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIGVtaXRUaHJlZShoYW5kbGVyLCBpc0ZuLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcbiAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgZGVmYXVsdDpcbiAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgZW1pdE1hbnkoaGFuZGxlciwgaXNGbiwgdGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmZ1bmN0aW9uIF9hZGRMaXN0ZW5lcih0YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBwcmVwZW5kKSB7XG4gIHZhciBtO1xuICB2YXIgZXZlbnRzO1xuICB2YXIgZXhpc3Rpbmc7XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RlbmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG4gIGlmICghZXZlbnRzKSB7XG4gICAgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgdGFyZ2V0Ll9ldmVudHNDb3VudCA9IDA7XG4gIH0gZWxzZSB7XG4gICAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gICAgaWYgKGV2ZW50cy5uZXdMaXN0ZW5lcikge1xuICAgICAgdGFyZ2V0LmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA/IGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gICAgICAvLyBSZS1hc3NpZ24gYGV2ZW50c2AgYmVjYXVzZSBhIG5ld0xpc3RlbmVyIGhhbmRsZXIgY291bGQgaGF2ZSBjYXVzZWQgdGhlXG4gICAgICAvLyB0aGlzLl9ldmVudHMgdG8gYmUgYXNzaWduZWQgdG8gYSBuZXcgb2JqZWN0XG4gICAgICBldmVudHMgPSB0YXJnZXQuX2V2ZW50cztcbiAgICB9XG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV07XG4gIH1cblxuICBpZiAoIWV4aXN0aW5nKSB7XG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgZXhpc3RpbmcgPSBldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgICArK3RhcmdldC5fZXZlbnRzQ291bnQ7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBleGlzdGluZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgICBleGlzdGluZyA9IGV2ZW50c1t0eXBlXSA9XG4gICAgICAgICAgcHJlcGVuZCA/IFtsaXN0ZW5lciwgZXhpc3RpbmddIDogW2V4aXN0aW5nLCBsaXN0ZW5lcl07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICAgIGlmIChwcmVwZW5kKSB7XG4gICAgICAgIGV4aXN0aW5nLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXhpc3RpbmcucHVzaChsaXN0ZW5lcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgICBpZiAoIWV4aXN0aW5nLndhcm5lZCkge1xuICAgICAgbSA9ICRnZXRNYXhMaXN0ZW5lcnModGFyZ2V0KTtcbiAgICAgIGlmIChtICYmIG0gPiAwICYmIGV4aXN0aW5nLmxlbmd0aCA+IG0pIHtcbiAgICAgICAgZXhpc3Rpbmcud2FybmVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHcgPSBuZXcgRXJyb3IoJ1Bvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgbGVhayBkZXRlY3RlZC4gJyArXG4gICAgICAgICAgICBleGlzdGluZy5sZW5ndGggKyAnIFwiJyArIFN0cmluZyh0eXBlKSArICdcIiBsaXN0ZW5lcnMgJyArXG4gICAgICAgICAgICAnYWRkZWQuIFVzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvICcgK1xuICAgICAgICAgICAgJ2luY3JlYXNlIGxpbWl0LicpO1xuICAgICAgICB3Lm5hbWUgPSAnTWF4TGlzdGVuZXJzRXhjZWVkZWRXYXJuaW5nJztcbiAgICAgICAgdy5lbWl0dGVyID0gdGFyZ2V0O1xuICAgICAgICB3LnR5cGUgPSB0eXBlO1xuICAgICAgICB3LmNvdW50ID0gZXhpc3RpbmcubGVuZ3RoO1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgPT09ICdvYmplY3QnICYmIGNvbnNvbGUud2Fybikge1xuICAgICAgICAgIGNvbnNvbGUud2FybignJXM6ICVzJywgdy5uYW1lLCB3Lm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHJldHVybiBfYWRkTGlzdGVuZXIodGhpcywgdHlwZSwgbGlzdGVuZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnByZXBlbmRMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICByZXR1cm4gX2FkZExpc3RlbmVyKHRoaXMsIHR5cGUsIGxpc3RlbmVyLCB0cnVlKTtcbiAgICB9O1xuXG5mdW5jdGlvbiBvbmNlV3JhcHBlcigpIHtcbiAgaWYgKCF0aGlzLmZpcmVkKSB7XG4gICAgdGhpcy50YXJnZXQucmVtb3ZlTGlzdGVuZXIodGhpcy50eXBlLCB0aGlzLndyYXBGbik7XG4gICAgdGhpcy5maXJlZCA9IHRydWU7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQpO1xuICAgICAgY2FzZSAxOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0pO1xuICAgICAgY2FzZSAyOlxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lci5jYWxsKHRoaXMudGFyZ2V0LCBhcmd1bWVudHNbMF0sIGFyZ3VtZW50c1sxXSk7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVyLmNhbGwodGhpcy50YXJnZXQsIGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdLFxuICAgICAgICAgICAgYXJndW1lbnRzWzJdKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpXG4gICAgICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5hcHBseSh0aGlzLnRhcmdldCwgYXJncyk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIF9vbmNlV3JhcCh0YXJnZXQsIHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBzdGF0ZSA9IHsgZmlyZWQ6IGZhbHNlLCB3cmFwRm46IHVuZGVmaW5lZCwgdGFyZ2V0OiB0YXJnZXQsIHR5cGU6IHR5cGUsIGxpc3RlbmVyOiBsaXN0ZW5lciB9O1xuICB2YXIgd3JhcHBlZCA9IGJpbmQuY2FsbChvbmNlV3JhcHBlciwgc3RhdGUpO1xuICB3cmFwcGVkLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHN0YXRlLndyYXBGbiA9IHdyYXBwZWQ7XG4gIHJldHVybiB3cmFwcGVkO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB0aGlzLm9uKHR5cGUsIF9vbmNlV3JhcCh0aGlzLCB0eXBlLCBsaXN0ZW5lcikpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucHJlcGVuZE9uY2VMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcHJlcGVuZE9uY2VMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0ZW5lclwiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgdGhpcy5wcmVwZW5kTGlzdGVuZXIodHlwZSwgX29uY2VXcmFwKHRoaXMsIHR5cGUsIGxpc3RlbmVyKSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4vLyBFbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWYgYW5kIG9ubHkgaWYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG4gICAgZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgIHZhciBsaXN0LCBldmVudHMsIHBvc2l0aW9uLCBpLCBvcmlnaW5hbExpc3RlbmVyO1xuXG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RlbmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmICghZXZlbnRzKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgbGlzdCA9IGV2ZW50c1t0eXBlXTtcbiAgICAgIGlmICghbGlzdClcbiAgICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICAgIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fCBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoLS10aGlzLl9ldmVudHNDb3VudCA9PT0gMClcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgICAgaWYgKGV2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0Lmxpc3RlbmVyIHx8IGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbGlzdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwb3NpdGlvbiA9IC0xO1xuXG4gICAgICAgIGZvciAoaSA9IGxpc3QubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHwgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsTGlzdGVuZXIgPSBsaXN0W2ldLmxpc3RlbmVyO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgICBpZiAocG9zaXRpb24gPT09IDApXG4gICAgICAgICAgbGlzdC5zaGlmdCgpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgc3BsaWNlT25lKGxpc3QsIHBvc2l0aW9uKTtcblxuICAgICAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpXG4gICAgICAgICAgZXZlbnRzW3R5cGVdID0gbGlzdFswXTtcblxuICAgICAgICBpZiAoZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBvcmlnaW5hbExpc3RlbmVyIHx8IGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbExpc3RlbmVycyh0eXBlKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzLCBldmVudHMsIGk7XG5cbiAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcbiAgICAgIGlmICghZXZlbnRzKVxuICAgICAgICByZXR1cm4gdGhpcztcblxuICAgICAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICAgICAgaWYgKCFldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICB0aGlzLl9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgICAgICAgdGhpcy5fZXZlbnRzQ291bnQgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50c1t0eXBlXSkge1xuICAgICAgICAgIGlmICgtLXRoaXMuX2V2ZW50c0NvdW50ID09PSAwKVxuICAgICAgICAgICAgdGhpcy5fZXZlbnRzID0gb2JqZWN0Q3JlYXRlKG51bGwpO1xuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudHNbdHlwZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdmFyIGtleXMgPSBvYmplY3RLZXlzKGV2ZW50cyk7XG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAga2V5ID0ga2V5c1tpXTtcbiAgICAgICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgICAgICB0aGlzLl9ldmVudHMgPSBvYmplY3RDcmVhdGUobnVsbCk7XG4gICAgICAgIHRoaXMuX2V2ZW50c0NvdW50ID0gMDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIGxpc3RlbmVycyA9IGV2ZW50c1t0eXBlXTtcblxuICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICAgICAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAgICAgLy8gTElGTyBvcmRlclxuICAgICAgICBmb3IgKGkgPSBsaXN0ZW5lcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuZnVuY3Rpb24gX2xpc3RlbmVycyh0YXJnZXQsIHR5cGUsIHVud3JhcCkge1xuICB2YXIgZXZlbnRzID0gdGFyZ2V0Ll9ldmVudHM7XG5cbiAgaWYgKCFldmVudHMpXG4gICAgcmV0dXJuIFtdO1xuXG4gIHZhciBldmxpc3RlbmVyID0gZXZlbnRzW3R5cGVdO1xuICBpZiAoIWV2bGlzdGVuZXIpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGlmICh0eXBlb2YgZXZsaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJylcbiAgICByZXR1cm4gdW53cmFwID8gW2V2bGlzdGVuZXIubGlzdGVuZXIgfHwgZXZsaXN0ZW5lcl0gOiBbZXZsaXN0ZW5lcl07XG5cbiAgcmV0dXJuIHVud3JhcCA/IHVud3JhcExpc3RlbmVycyhldmxpc3RlbmVyKSA6IGFycmF5Q2xvbmUoZXZsaXN0ZW5lciwgZXZsaXN0ZW5lci5sZW5ndGgpO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyh0eXBlKSB7XG4gIHJldHVybiBfbGlzdGVuZXJzKHRoaXMsIHR5cGUsIHRydWUpO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yYXdMaXN0ZW5lcnMgPSBmdW5jdGlvbiByYXdMaXN0ZW5lcnModHlwZSkge1xuICByZXR1cm4gX2xpc3RlbmVycyh0aGlzLCB0eXBlLCBmYWxzZSk7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgaWYgKHR5cGVvZiBlbWl0dGVyLmxpc3RlbmVyQ291bnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsaXN0ZW5lckNvdW50LmNhbGwoZW1pdHRlciwgdHlwZSk7XG4gIH1cbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJDb3VudCA9IGxpc3RlbmVyQ291bnQ7XG5mdW5jdGlvbiBsaXN0ZW5lckNvdW50KHR5cGUpIHtcbiAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50cztcblxuICBpZiAoZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSBldmVudHNbdHlwZV07XG5cbiAgICBpZiAodHlwZW9mIGV2bGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH0gZWxzZSBpZiAoZXZsaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIGV2bGlzdGVuZXIubGVuZ3RoO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAwO1xufVxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50TmFtZXMgPSBmdW5jdGlvbiBldmVudE5hbWVzKCkge1xuICByZXR1cm4gdGhpcy5fZXZlbnRzQ291bnQgPiAwID8gUmVmbGVjdC5vd25LZXlzKHRoaXMuX2V2ZW50cykgOiBbXTtcbn07XG5cbi8vIEFib3V0IDEuNXggZmFzdGVyIHRoYW4gdGhlIHR3by1hcmcgdmVyc2lvbiBvZiBBcnJheSNzcGxpY2UoKS5cbmZ1bmN0aW9uIHNwbGljZU9uZShsaXN0LCBpbmRleCkge1xuICBmb3IgKHZhciBpID0gaW5kZXgsIGsgPSBpICsgMSwgbiA9IGxpc3QubGVuZ3RoOyBrIDwgbjsgaSArPSAxLCBrICs9IDEpXG4gICAgbGlzdFtpXSA9IGxpc3Rba107XG4gIGxpc3QucG9wKCk7XG59XG5cbmZ1bmN0aW9uIGFycmF5Q2xvbmUoYXJyLCBuKSB7XG4gIHZhciBjb3B5ID0gbmV3IEFycmF5KG4pO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSlcbiAgICBjb3B5W2ldID0gYXJyW2ldO1xuICByZXR1cm4gY29weTtcbn1cblxuZnVuY3Rpb24gdW53cmFwTGlzdGVuZXJzKGFycikge1xuICB2YXIgcmV0ID0gbmV3IEFycmF5KGFyci5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHJldC5sZW5ndGg7ICsraSkge1xuICAgIHJldFtpXSA9IGFycltpXS5saXN0ZW5lciB8fCBhcnJbaV07XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gb2JqZWN0Q3JlYXRlUG9seWZpbGwocHJvdG8pIHtcbiAgdmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuICBGLnByb3RvdHlwZSA9IHByb3RvO1xuICByZXR1cm4gbmV3IEY7XG59XG5mdW5jdGlvbiBvYmplY3RLZXlzUG9seWZpbGwob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGsgaW4gb2JqKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgaykpIHtcbiAgICBrZXlzLnB1c2goayk7XG4gIH1cbiAgcmV0dXJuIGs7XG59XG5mdW5jdGlvbiBmdW5jdGlvbkJpbmRQb2x5ZmlsbChjb250ZXh0KSB7XG4gIHZhciBmbiA9IHRoaXM7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7XG4gIH07XG59XG4iLCJleHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBpZiAoc3VwZXJDdG9yKSB7XG4gICAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGlmIChzdXBlckN0b3IpIHtcbiAgICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gICAgfVxuICB9XG59XG4iLCIvLyAuZGlybmFtZSwgLmJhc2VuYW1lLCBhbmQgLmV4dG5hbWUgbWV0aG9kcyBhcmUgZXh0cmFjdGVkIGZyb20gTm9kZS5qcyB2OC4xMS4xLFxuLy8gYmFja3BvcnRlZCBhbmQgdHJhbnNwbGl0ZWQgd2l0aCBCYWJlbCwgd2l0aCBiYWNrd2FyZHMtY29tcGF0IGZpeGVzXG5cbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcbi8vIG11c3QgYmUgbm8gc2xhc2hlcywgZW1wdHkgZWxlbWVudHMsIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XG4vLyAoc28gYWxzbyBubyBsZWFkaW5nIGFuZCB0cmFpbGluZyBzbGFzaGVzIC0gaXQgZG9lcyBub3QgZGlzdGluZ3Vpc2hcbi8vIHJlbGF0aXZlIGFuZCBhYnNvbHV0ZSBwYXRocylcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xuICAvLyBpZiB0aGUgcGF0aCB0cmllcyB0byBnbyBhYm92ZSB0aGUgcm9vdCwgYHVwYCBlbmRzIHVwID4gMFxuICB2YXIgdXAgPSAwO1xuICBmb3IgKHZhciBpID0gcGFydHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgbGFzdCA9IHBhcnRzW2ldO1xuICAgIGlmIChsYXN0ID09PSAnLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHBhcnRzLnNwbGljZShpLCAxKTtcbiAgICAgIHVwKys7XG4gICAgfSBlbHNlIGlmICh1cCkge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXAtLTtcbiAgICB9XG4gIH1cblxuICAvLyBpZiB0aGUgcGF0aCBpcyBhbGxvd2VkIHRvIGdvIGFib3ZlIHRoZSByb290LCByZXN0b3JlIGxlYWRpbmcgLi5zXG4gIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgIGZvciAoOyB1cC0tOyB1cCkge1xuICAgICAgcGFydHMudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGFydHM7XG59XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHBhdGggPSBwYXRoICsgJyc7XG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcbiAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gIHZhciBoYXNSb290ID0gY29kZSA9PT0gNDcgLyovKi87XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMTsgLS1pKSB7XG4gICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3JcbiAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm4gaGFzUm9vdCA/ICcvJyA6ICcuJztcbiAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSB7XG4gICAgLy8gcmV0dXJuICcvLyc7XG4gICAgLy8gQmFja3dhcmRzLWNvbXBhdCBmaXg6XG4gICAgcmV0dXJuICcvJztcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xufTtcblxuZnVuY3Rpb24gYmFzZW5hbWUocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuXG4gIHZhciBzdGFydCA9IDA7XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIHZhciBpO1xuXG4gIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIHBhdGggY29tcG9uZW50XG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgfVxuXG4gIGlmIChlbmQgPT09IC0xKSByZXR1cm4gJyc7XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xufVxuXG4vLyBVc2VzIGEgbWl4ZWQgYXBwcm9hY2ggZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5LCBhcyBleHQgYmVoYXZpb3IgY2hhbmdlZFxuLy8gaW4gbmV3IE5vZGUuanMgdmVyc2lvbnMsIHNvIG9ubHkgYmFzZW5hbWUoKSBhYm92ZSBpcyBiYWNrcG9ydGVkIGhlcmVcbmV4cG9ydHMuYmFzZW5hbWUgPSBmdW5jdGlvbiAocGF0aCwgZXh0KSB7XG4gIHZhciBmID0gYmFzZW5hbWUocGF0aCk7XG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIGY7XG59O1xuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbiAocGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggIT09ICdzdHJpbmcnKSBwYXRoID0gcGF0aCArICcnO1xuICB2YXIgc3RhcnREb3QgPSAtMTtcbiAgdmFyIHN0YXJ0UGFydCA9IDA7XG4gIHZhciBlbmQgPSAtMTtcbiAgdmFyIG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgdmFyIHByZURvdFN0YXRlID0gMDtcbiAgZm9yICh2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoY29kZSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnRQYXJ0ID0gaSArIDE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IDQ2IC8qLiovKSB7XG4gICAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKVxuICAgICAgICAgIHN0YXJ0RG90ID0gaTtcbiAgICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpXG4gICAgICAgICAgcHJlRG90U3RhdGUgPSAxO1xuICAgIH0gZWxzZSBpZiAoc3RhcnREb3QgIT09IC0xKSB7XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGFuZCBub24tcGF0aCBzZXBhcmF0b3IgYmVmb3JlIG91ciBkb3QsIHNvIHdlIHNob3VsZFxuICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgIHByZURvdFN0YXRlID0gLTE7XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0YXJ0RG90ID09PSAtMSB8fCBlbmQgPT09IC0xIHx8XG4gICAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyICh4cywgZikge1xuICAgIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZik7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGYoeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG52YXIgc3Vic3RyID0gJ2FiJy5zdWJzdHIoLTEpID09PSAnYidcbiAgICA/IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW4pIHsgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbikgfVxuICAgIDogZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikge1xuICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbik7XG4gICAgfVxuO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImNvbnN0IFBTS0J1ZmZlciA9IHJlcXVpcmUoJy4vbGliL1BTS0J1ZmZlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBTS0J1ZmZlcjtcbiIsImNvbnN0IFBTS0xvZ2dlciA9IHJlcXVpcmUoJy4vc3JjL1BTS0xvZ2dlckNsaWVudC9pbmRleCcpO1xuY29uc3QgRW52aXJvbm1lbnREYXRhUHJvdmlkZXIgPSByZXF1aXJlKCcuL3NyYy91dGlscycpLkVudmlyb25tZW50RGF0YVByb3ZpZGVyO1xuXG5cbmlmKCFnbG9iYWwuaGFzT3duUHJvcGVydHkoJyQkJykpIHtcbiAgICBnbG9iYWwuJCQgPSB7fTtcbn1cblxuXG4vKipcbiAqIEBkZXByZWNhdGVkXG4gKiBQU0tMb2dnZXIgc2hvdWxkIGJlIHVzZWQgYXMgaXMgd2l0aG91dCBvdmVyd3JpdGluZyBjb25zb2xlLlxuICogVGhlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIGJlIGFkZGVkIHRvIFBTS0xvZ2dlciB0byBsb2cgdG8gY29uc29sZSB0aGUgbWVzc2FnZSBhbmQgdXNlZnVsIG1ldGFkYXRhXG4gKi9cbmZ1bmN0aW9uIG92ZXJ3cml0ZUNvbnNvbGUoKSB7XG4gICAgaWYocHJvY2Vzcy5lbnYuY29udGV4dCA9PT0gJ3NhbmRib3gnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXhlY3V0aW9uIGRldGVjdGVkIGluIHNhbmRib3gsIGNvbnNvbGUgd29uJ3QgYmUgb3ZlcndyaXR0ZW5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsb2dnZXIgPSBQU0tMb2dnZXIuZ2V0TG9nZ2VyKCk7XG5cbiAgICBjb25zdCBvcmlnaW5hbENvbnNvbGUgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhjb25zb2xlKS5mb3JFYWNoKGtleSA9PiBvcmlnaW5hbENvbnNvbGVba2V5XSA9IGNvbnNvbGVba2V5XSk7XG5cbiAgICBPYmplY3Qua2V5cyhsb2dnZXIpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICBjb25zb2xlW2tleV0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgY29uc3QgbG9nID0gbG9nZ2VyW2tleV0uYXBwbHkobG9nZ2VyLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBnZXRDb250ZXh0Rm9yTWV0YShsb2cubWV0YSk7XG5cbiAgICAgICAgICAgaWYob3JpZ2luYWxDb25zb2xlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgIG9yaWdpbmFsQ29uc29sZVtrZXldLmFwcGx5KG9yaWdpbmFsQ29uc29sZSwgW2BbJHtjb250ZXh0fV1gLCAuLi5sb2cubWVzc2FnZXNdKTtcbiAgICAgICAgICAgfVxuICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgLyoqXG4gICAgICogQHJldHVybiB7c3RyaW5nfCp9XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0Q29udGV4dEZvck1ldGEobWV0YSkge1xuICAgICAgICBjb25zdCBjb250ZXh0cyA9IHtcbiAgICAgICAgICAgIG5vZGU6IChtZXRhKSA9PiBgbm9kZToke21ldGEuY29udGV4dH1gLFxuICAgICAgICAgICAgZG9tYWluOiAobWV0YSkgPT5gZG9tYWluOiR7bWV0YS5kb21haW59YCxcbiAgICAgICAgICAgIGFnZW50OiAobWV0YSkgPT4gYGRvbWFpbjoke21ldGEuZG9tYWlufTphZ2VudDoke21ldGEuYWdlbnR9YCxcbiAgICAgICAgICAgIHNhbmRib3g6ICgpID0+IGBzYW5kYm94YFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChjb250ZXh0cy5oYXNPd25Qcm9wZXJ0eShtZXRhLm9yaWdpbikpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0c1ttZXRhLm9yaWdpbl0obWV0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmlmIChwcm9jZXNzLmVudi5jb250ZXh0ICE9PSAnc2FuZGJveCcpIHtcblxuICAgIGNvbnN0IE1lc3NhZ2VQdWJsaXNoZXIgPSByZXF1aXJlKCcuL3NyYy9NZXNzYWdlUHVibGlzaGVyJyk7XG4gICAgY29uc3QgTWVzc2FnZVN1YnNjcmliZXIgPSByZXF1aXJlKCcuL3NyYy9NZXNzYWdlU3Vic2NyaWJlcicpO1xuICAgIGNvbnN0IFB1YlN1YlByb3h5ID0gcmVxdWlyZSgnLi9zcmMvUHViU3ViUHJveHknKTtcblxuICAgIGZ1bmN0aW9uIGVuYWJsZUVudmlyb25tZW50RGF0YURlZmF1bHQoKSB7XG4gICAgICAgIGdsb2JhbC4kJC5nZXRFbnZpcm9ubWVudERhdGEgPSBFbnZpcm9ubWVudERhdGFQcm92aWRlci5nZXRFbnZpcm9ubWVudERhdGE7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZW5hYmxlRW52aXJvbm1lbnREYXRhRm9yQWdlbnQoKSB7XG4gICAgICAgIGdsb2JhbC4kJC5nZXRFbnZpcm9ubWVudERhdGEgPSBFbnZpcm9ubWVudERhdGFQcm92aWRlci5nZXRFbnZpcm9ubWVudERhdGFGb3JBZ2VudDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbmFibGVFbnZpcm9ubWVudERhdGFGb3JEb21haW4oKSB7XG4gICAgICAgIGdsb2JhbC4kJC5nZXRFbnZpcm9ubWVudERhdGEgPSBFbnZpcm9ubWVudERhdGFQcm92aWRlci5nZXRFbnZpcm9ubWVudERhdGFGb3JEb21haW47XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBPdmVyd3JpdGUgdGhpcyB0byBwcm92aWRlIHJlbGV2YW50IGluZm9ybWF0aW9uIGZvciBvdGhlciBlbnZpcm9ubWVudHMgKGV4OiBmb3IgZG9tYWlucywgYnJvd3NlciBldGMuKVxuICAgICAqL1xuICAgIGlmKHByb2Nlc3MuZW52Lmhhc093blByb3BlcnR5KCdQUklWQVRFU0tZX0FHRU5UX05BTUUnKSkge1xuICAgICAgICBlbmFibGVFbnZpcm9ubWVudERhdGFGb3JBZ2VudCgpO1xuICAgIH0gZWxzZSBpZihwcm9jZXNzLmVudi5oYXNPd25Qcm9wZXJ0eSgnUFJJVkFURVNLWV9ET01BSU5fTkFNRScpKSB7XG4gICAgICAgIGVuYWJsZUVudmlyb25tZW50RGF0YUZvckRvbWFpbigpXG4gICAgfSBlbHNlIGlmKCFnbG9iYWwuJCQuaGFzT3duUHJvcGVydHkoJ2dldEVudmlyb25tZW50RGF0YScpKSB7XG4gICAgICAgIGVuYWJsZUVudmlyb25tZW50RGF0YURlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBtb2R1bGUuZXhwb3J0cy5NZXNzYWdlUHVibGlzaGVyTW9kdWxlICA9IE1lc3NhZ2VQdWJsaXNoZXI7XG4gICAgbW9kdWxlLmV4cG9ydHMuTWVzc2FnZVN1YnNjcmliZXJNb2R1bGUgPSBNZXNzYWdlU3Vic2NyaWJlcjtcbiAgICBtb2R1bGUuZXhwb3J0cy5QdWJTdWJQcm94eU1vZHVsZSAgICAgICA9IFB1YlN1YlByb3h5O1xufSBlbHNlIHtcbiAgICBnbG9iYWwuJCQuZ2V0RW52aXJvbm1lbnREYXRhID0gRW52aXJvbm1lbnREYXRhUHJvdmlkZXIuZ2V0RW52aXJvbm1lbnREYXRhRm9yU2FuZGJveDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5vdmVyd3JpdGVDb25zb2xlID0gb3ZlcndyaXRlQ29uc29sZTtcbm1vZHVsZS5leHBvcnRzLlBTS0xvZ2dlciA9IFBTS0xvZ2dlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5kZWNvZGUgPSBleHBvcnRzLnBhcnNlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbmV4cG9ydHMuZW5jb2RlID0gZXhwb3J0cy5zdHJpbmdpZnkgPSByZXF1aXJlKCcuL2VuY29kZScpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFx0XHRcdFx0c291bmRQdWJTdWI6IHJlcXVpcmUoXCIuL2xpYi9zb3VuZFB1YlN1YlwiKS5zb3VuZFB1YlN1YlxufTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxubW9kdWxlLmV4cG9ydHMgPSBTdHJlYW07XG5cbnZhciBFRSA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbnZhciBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmluaGVyaXRzKFN0cmVhbSwgRUUpO1xuU3RyZWFtLlJlYWRhYmxlID0gcmVxdWlyZSgncmVhZGFibGUtc3RyZWFtL3JlYWRhYmxlLmpzJyk7XG5TdHJlYW0uV3JpdGFibGUgPSByZXF1aXJlKCdyZWFkYWJsZS1zdHJlYW0vd3JpdGFibGUuanMnKTtcblN0cmVhbS5EdXBsZXggPSByZXF1aXJlKCdyZWFkYWJsZS1zdHJlYW0vZHVwbGV4LmpzJyk7XG5TdHJlYW0uVHJhbnNmb3JtID0gcmVxdWlyZSgncmVhZGFibGUtc3RyZWFtL3RyYW5zZm9ybS5qcycpO1xuU3RyZWFtLlBhc3NUaHJvdWdoID0gcmVxdWlyZSgncmVhZGFibGUtc3RyZWFtL3Bhc3N0aHJvdWdoLmpzJyk7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuNC54XG5TdHJlYW0uU3RyZWFtID0gU3RyZWFtO1xuXG5cblxuLy8gb2xkLXN0eWxlIHN0cmVhbXMuICBOb3RlIHRoYXQgdGhlIHBpcGUgbWV0aG9kICh0aGUgb25seSByZWxldmFudFxuLy8gcGFydCBvZiB0aGlzIGNsYXNzKSBpcyBvdmVycmlkZGVuIGluIHRoZSBSZWFkYWJsZSBjbGFzcy5cblxuZnVuY3Rpb24gU3RyZWFtKCkge1xuICBFRS5jYWxsKHRoaXMpO1xufVxuXG5TdHJlYW0ucHJvdG90eXBlLnBpcGUgPSBmdW5jdGlvbihkZXN0LCBvcHRpb25zKSB7XG4gIHZhciBzb3VyY2UgPSB0aGlzO1xuXG4gIGZ1bmN0aW9uIG9uZGF0YShjaHVuaykge1xuICAgIGlmIChkZXN0LndyaXRhYmxlKSB7XG4gICAgICBpZiAoZmFsc2UgPT09IGRlc3Qud3JpdGUoY2h1bmspICYmIHNvdXJjZS5wYXVzZSkge1xuICAgICAgICBzb3VyY2UucGF1c2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzb3VyY2Uub24oJ2RhdGEnLCBvbmRhdGEpO1xuXG4gIGZ1bmN0aW9uIG9uZHJhaW4oKSB7XG4gICAgaWYgKHNvdXJjZS5yZWFkYWJsZSAmJiBzb3VyY2UucmVzdW1lKSB7XG4gICAgICBzb3VyY2UucmVzdW1lKCk7XG4gICAgfVxuICB9XG5cbiAgZGVzdC5vbignZHJhaW4nLCBvbmRyYWluKTtcblxuICAvLyBJZiB0aGUgJ2VuZCcgb3B0aW9uIGlzIG5vdCBzdXBwbGllZCwgZGVzdC5lbmQoKSB3aWxsIGJlIGNhbGxlZCB3aGVuXG4gIC8vIHNvdXJjZSBnZXRzIHRoZSAnZW5kJyBvciAnY2xvc2UnIGV2ZW50cy4gIE9ubHkgZGVzdC5lbmQoKSBvbmNlLlxuICBpZiAoIWRlc3QuX2lzU3RkaW8gJiYgKCFvcHRpb25zIHx8IG9wdGlvbnMuZW5kICE9PSBmYWxzZSkpIHtcbiAgICBzb3VyY2Uub24oJ2VuZCcsIG9uZW5kKTtcbiAgICBzb3VyY2Uub24oJ2Nsb3NlJywgb25jbG9zZSk7XG4gIH1cblxuICB2YXIgZGlkT25FbmQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gb25lbmQoKSB7XG4gICAgaWYgKGRpZE9uRW5kKSByZXR1cm47XG4gICAgZGlkT25FbmQgPSB0cnVlO1xuXG4gICAgZGVzdC5lbmQoKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gb25jbG9zZSgpIHtcbiAgICBpZiAoZGlkT25FbmQpIHJldHVybjtcbiAgICBkaWRPbkVuZCA9IHRydWU7XG5cbiAgICBpZiAodHlwZW9mIGRlc3QuZGVzdHJveSA9PT0gJ2Z1bmN0aW9uJykgZGVzdC5kZXN0cm95KCk7XG4gIH1cblxuICAvLyBkb24ndCBsZWF2ZSBkYW5nbGluZyBwaXBlcyB3aGVuIHRoZXJlIGFyZSBlcnJvcnMuXG4gIGZ1bmN0aW9uIG9uZXJyb3IoZXIpIHtcbiAgICBjbGVhbnVwKCk7XG4gICAgaWYgKEVFLmxpc3RlbmVyQ291bnQodGhpcywgJ2Vycm9yJykgPT09IDApIHtcbiAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgc3RyZWFtIGVycm9yIGluIHBpcGUuXG4gICAgfVxuICB9XG5cbiAgc291cmNlLm9uKCdlcnJvcicsIG9uZXJyb3IpO1xuICBkZXN0Lm9uKCdlcnJvcicsIG9uZXJyb3IpO1xuXG4gIC8vIHJlbW92ZSBhbGwgdGhlIGV2ZW50IGxpc3RlbmVycyB0aGF0IHdlcmUgYWRkZWQuXG4gIGZ1bmN0aW9uIGNsZWFudXAoKSB7XG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdkYXRhJywgb25kYXRhKTtcbiAgICBkZXN0LnJlbW92ZUxpc3RlbmVyKCdkcmFpbicsIG9uZHJhaW4pO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlbmQnLCBvbmVuZCk7XG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uY2xvc2UpO1xuXG4gICAgc291cmNlLnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uZXJyb3IpO1xuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgb25lcnJvcik7XG5cbiAgICBzb3VyY2UucmVtb3ZlTGlzdGVuZXIoJ2VuZCcsIGNsZWFudXApO1xuICAgIHNvdXJjZS5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBjbGVhbnVwKTtcblxuICAgIGRlc3QucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgY2xlYW51cCk7XG4gIH1cblxuICBzb3VyY2Uub24oJ2VuZCcsIGNsZWFudXApO1xuICBzb3VyY2Uub24oJ2Nsb3NlJywgY2xlYW51cCk7XG5cbiAgZGVzdC5vbignY2xvc2UnLCBjbGVhbnVwKTtcblxuICBkZXN0LmVtaXQoJ3BpcGUnLCBzb3VyY2UpO1xuXG4gIC8vIEFsbG93IGZvciB1bml4LWxpa2UgdXNhZ2U6IEEucGlwZShCKS5waXBlKEMpXG4gIHJldHVybiBkZXN0O1xufTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8qPHJlcGxhY2VtZW50PiovXG5cbnZhciBCdWZmZXIgPSByZXF1aXJlKCdzYWZlLWJ1ZmZlcicpLkJ1ZmZlcjtcbi8qPC9yZXBsYWNlbWVudD4qL1xuXG52YXIgaXNFbmNvZGluZyA9IEJ1ZmZlci5pc0VuY29kaW5nIHx8IGZ1bmN0aW9uIChlbmNvZGluZykge1xuICBlbmNvZGluZyA9ICcnICsgZW5jb2Rpbmc7XG4gIHN3aXRjaCAoZW5jb2RpbmcgJiYgZW5jb2RpbmcudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6Y2FzZSAndXRmOCc6Y2FzZSAndXRmLTgnOmNhc2UgJ2FzY2lpJzpjYXNlICdiaW5hcnknOmNhc2UgJ2Jhc2U2NCc6Y2FzZSAndWNzMic6Y2FzZSAndWNzLTInOmNhc2UgJ3V0ZjE2bGUnOmNhc2UgJ3V0Zi0xNmxlJzpjYXNlICdyYXcnOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuZnVuY3Rpb24gX25vcm1hbGl6ZUVuY29kaW5nKGVuYykge1xuICBpZiAoIWVuYykgcmV0dXJuICd1dGY4JztcbiAgdmFyIHJldHJpZWQ7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmMpIHtcbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gJ3V0ZjgnO1xuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuICd1dGYxNmxlJztcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gJ2xhdGluMSc7XG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGVuYztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChyZXRyaWVkKSByZXR1cm47IC8vIHVuZGVmaW5lZFxuICAgICAgICBlbmMgPSAoJycgKyBlbmMpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHJpZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxufTtcblxuLy8gRG8gbm90IGNhY2hlIGBCdWZmZXIuaXNFbmNvZGluZ2Agd2hlbiBjaGVja2luZyBlbmNvZGluZyBuYW1lcyBhcyBzb21lXG4vLyBtb2R1bGVzIG1vbmtleS1wYXRjaCBpdCB0byBzdXBwb3J0IGFkZGl0aW9uYWwgZW5jb2RpbmdzXG5mdW5jdGlvbiBub3JtYWxpemVFbmNvZGluZyhlbmMpIHtcbiAgdmFyIG5lbmMgPSBfbm9ybWFsaXplRW5jb2RpbmcoZW5jKTtcbiAgaWYgKHR5cGVvZiBuZW5jICE9PSAnc3RyaW5nJyAmJiAoQnVmZmVyLmlzRW5jb2RpbmcgPT09IGlzRW5jb2RpbmcgfHwgIWlzRW5jb2RpbmcoZW5jKSkpIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuYyk7XG4gIHJldHVybiBuZW5jIHx8IGVuYztcbn1cblxuLy8gU3RyaW5nRGVjb2RlciBwcm92aWRlcyBhbiBpbnRlcmZhY2UgZm9yIGVmZmljaWVudGx5IHNwbGl0dGluZyBhIHNlcmllcyBvZlxuLy8gYnVmZmVycyBpbnRvIGEgc2VyaWVzIG9mIEpTIHN0cmluZ3Mgd2l0aG91dCBicmVha2luZyBhcGFydCBtdWx0aS1ieXRlXG4vLyBjaGFyYWN0ZXJzLlxuZXhwb3J0cy5TdHJpbmdEZWNvZGVyID0gU3RyaW5nRGVjb2RlcjtcbmZ1bmN0aW9uIFN0cmluZ0RlY29kZXIoZW5jb2RpbmcpIHtcbiAgdGhpcy5lbmNvZGluZyA9IG5vcm1hbGl6ZUVuY29kaW5nKGVuY29kaW5nKTtcbiAgdmFyIG5iO1xuICBzd2l0Y2ggKHRoaXMuZW5jb2RpbmcpIHtcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIHRoaXMudGV4dCA9IHV0ZjE2VGV4dDtcbiAgICAgIHRoaXMuZW5kID0gdXRmMTZFbmQ7XG4gICAgICBuYiA9IDQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd1dGY4JzpcbiAgICAgIHRoaXMuZmlsbExhc3QgPSB1dGY4RmlsbExhc3Q7XG4gICAgICBuYiA9IDQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgdGhpcy50ZXh0ID0gYmFzZTY0VGV4dDtcbiAgICAgIHRoaXMuZW5kID0gYmFzZTY0RW5kO1xuICAgICAgbmIgPSAzO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRoaXMud3JpdGUgPSBzaW1wbGVXcml0ZTtcbiAgICAgIHRoaXMuZW5kID0gc2ltcGxlRW5kO1xuICAgICAgcmV0dXJuO1xuICB9XG4gIHRoaXMubGFzdE5lZWQgPSAwO1xuICB0aGlzLmxhc3RUb3RhbCA9IDA7XG4gIHRoaXMubGFzdENoYXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobmIpO1xufVxuXG5TdHJpbmdEZWNvZGVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIChidWYpIHtcbiAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHJldHVybiAnJztcbiAgdmFyIHI7XG4gIHZhciBpO1xuICBpZiAodGhpcy5sYXN0TmVlZCkge1xuICAgIHIgPSB0aGlzLmZpbGxMYXN0KGJ1Zik7XG4gICAgaWYgKHIgPT09IHVuZGVmaW5lZCkgcmV0dXJuICcnO1xuICAgIGkgPSB0aGlzLmxhc3ROZWVkO1xuICAgIHRoaXMubGFzdE5lZWQgPSAwO1xuICB9IGVsc2Uge1xuICAgIGkgPSAwO1xuICB9XG4gIGlmIChpIDwgYnVmLmxlbmd0aCkgcmV0dXJuIHIgPyByICsgdGhpcy50ZXh0KGJ1ZiwgaSkgOiB0aGlzLnRleHQoYnVmLCBpKTtcbiAgcmV0dXJuIHIgfHwgJyc7XG59O1xuXG5TdHJpbmdEZWNvZGVyLnByb3RvdHlwZS5lbmQgPSB1dGY4RW5kO1xuXG4vLyBSZXR1cm5zIG9ubHkgY29tcGxldGUgY2hhcmFjdGVycyBpbiBhIEJ1ZmZlclxuU3RyaW5nRGVjb2Rlci5wcm90b3R5cGUudGV4dCA9IHV0ZjhUZXh0O1xuXG4vLyBBdHRlbXB0cyB0byBjb21wbGV0ZSBhIHBhcnRpYWwgbm9uLVVURi04IGNoYXJhY3RlciB1c2luZyBieXRlcyBmcm9tIGEgQnVmZmVyXG5TdHJpbmdEZWNvZGVyLnByb3RvdHlwZS5maWxsTGFzdCA9IGZ1bmN0aW9uIChidWYpIHtcbiAgaWYgKHRoaXMubGFzdE5lZWQgPD0gYnVmLmxlbmd0aCkge1xuICAgIGJ1Zi5jb3B5KHRoaXMubGFzdENoYXIsIHRoaXMubGFzdFRvdGFsIC0gdGhpcy5sYXN0TmVlZCwgMCwgdGhpcy5sYXN0TmVlZCk7XG4gICAgcmV0dXJuIHRoaXMubGFzdENoYXIudG9TdHJpbmcodGhpcy5lbmNvZGluZywgMCwgdGhpcy5sYXN0VG90YWwpO1xuICB9XG4gIGJ1Zi5jb3B5KHRoaXMubGFzdENoYXIsIHRoaXMubGFzdFRvdGFsIC0gdGhpcy5sYXN0TmVlZCwgMCwgYnVmLmxlbmd0aCk7XG4gIHRoaXMubGFzdE5lZWQgLT0gYnVmLmxlbmd0aDtcbn07XG5cbi8vIENoZWNrcyB0aGUgdHlwZSBvZiBhIFVURi04IGJ5dGUsIHdoZXRoZXIgaXQncyBBU0NJSSwgYSBsZWFkaW5nIGJ5dGUsIG9yIGFcbi8vIGNvbnRpbnVhdGlvbiBieXRlLiBJZiBhbiBpbnZhbGlkIGJ5dGUgaXMgZGV0ZWN0ZWQsIC0yIGlzIHJldHVybmVkLlxuZnVuY3Rpb24gdXRmOENoZWNrQnl0ZShieXRlKSB7XG4gIGlmIChieXRlIDw9IDB4N0YpIHJldHVybiAwO2Vsc2UgaWYgKGJ5dGUgPj4gNSA9PT0gMHgwNikgcmV0dXJuIDI7ZWxzZSBpZiAoYnl0ZSA+PiA0ID09PSAweDBFKSByZXR1cm4gMztlbHNlIGlmIChieXRlID4+IDMgPT09IDB4MUUpIHJldHVybiA0O1xuICByZXR1cm4gYnl0ZSA+PiA2ID09PSAweDAyID8gLTEgOiAtMjtcbn1cblxuLy8gQ2hlY2tzIGF0IG1vc3QgMyBieXRlcyBhdCB0aGUgZW5kIG9mIGEgQnVmZmVyIGluIG9yZGVyIHRvIGRldGVjdCBhblxuLy8gaW5jb21wbGV0ZSBtdWx0aS1ieXRlIFVURi04IGNoYXJhY3Rlci4gVGhlIHRvdGFsIG51bWJlciBvZiBieXRlcyAoMiwgMywgb3IgNClcbi8vIG5lZWRlZCB0byBjb21wbGV0ZSB0aGUgVVRGLTggY2hhcmFjdGVyIChpZiBhcHBsaWNhYmxlKSBhcmUgcmV0dXJuZWQuXG5mdW5jdGlvbiB1dGY4Q2hlY2tJbmNvbXBsZXRlKHNlbGYsIGJ1ZiwgaSkge1xuICB2YXIgaiA9IGJ1Zi5sZW5ndGggLSAxO1xuICBpZiAoaiA8IGkpIHJldHVybiAwO1xuICB2YXIgbmIgPSB1dGY4Q2hlY2tCeXRlKGJ1ZltqXSk7XG4gIGlmIChuYiA+PSAwKSB7XG4gICAgaWYgKG5iID4gMCkgc2VsZi5sYXN0TmVlZCA9IG5iIC0gMTtcbiAgICByZXR1cm4gbmI7XG4gIH1cbiAgaWYgKC0taiA8IGkgfHwgbmIgPT09IC0yKSByZXR1cm4gMDtcbiAgbmIgPSB1dGY4Q2hlY2tCeXRlKGJ1ZltqXSk7XG4gIGlmIChuYiA+PSAwKSB7XG4gICAgaWYgKG5iID4gMCkgc2VsZi5sYXN0TmVlZCA9IG5iIC0gMjtcbiAgICByZXR1cm4gbmI7XG4gIH1cbiAgaWYgKC0taiA8IGkgfHwgbmIgPT09IC0yKSByZXR1cm4gMDtcbiAgbmIgPSB1dGY4Q2hlY2tCeXRlKGJ1ZltqXSk7XG4gIGlmIChuYiA+PSAwKSB7XG4gICAgaWYgKG5iID4gMCkge1xuICAgICAgaWYgKG5iID09PSAyKSBuYiA9IDA7ZWxzZSBzZWxmLmxhc3ROZWVkID0gbmIgLSAzO1xuICAgIH1cbiAgICByZXR1cm4gbmI7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbi8vIFZhbGlkYXRlcyBhcyBtYW55IGNvbnRpbnVhdGlvbiBieXRlcyBmb3IgYSBtdWx0aS1ieXRlIFVURi04IGNoYXJhY3RlciBhc1xuLy8gbmVlZGVkIG9yIGFyZSBhdmFpbGFibGUuIElmIHdlIHNlZSBhIG5vbi1jb250aW51YXRpb24gYnl0ZSB3aGVyZSB3ZSBleHBlY3Rcbi8vIG9uZSwgd2UgXCJyZXBsYWNlXCIgdGhlIHZhbGlkYXRlZCBjb250aW51YXRpb24gYnl0ZXMgd2UndmUgc2VlbiBzbyBmYXIgd2l0aFxuLy8gYSBzaW5nbGUgVVRGLTggcmVwbGFjZW1lbnQgY2hhcmFjdGVyICgnXFx1ZmZmZCcpLCB0byBtYXRjaCB2OCdzIFVURi04IGRlY29kaW5nXG4vLyBiZWhhdmlvci4gVGhlIGNvbnRpbnVhdGlvbiBieXRlIGNoZWNrIGlzIGluY2x1ZGVkIHRocmVlIHRpbWVzIGluIHRoZSBjYXNlXG4vLyB3aGVyZSBhbGwgb2YgdGhlIGNvbnRpbnVhdGlvbiBieXRlcyBmb3IgYSBjaGFyYWN0ZXIgZXhpc3QgaW4gdGhlIHNhbWUgYnVmZmVyLlxuLy8gSXQgaXMgYWxzbyBkb25lIHRoaXMgd2F5IGFzIGEgc2xpZ2h0IHBlcmZvcm1hbmNlIGluY3JlYXNlIGluc3RlYWQgb2YgdXNpbmcgYVxuLy8gbG9vcC5cbmZ1bmN0aW9uIHV0ZjhDaGVja0V4dHJhQnl0ZXMoc2VsZiwgYnVmLCBwKSB7XG4gIGlmICgoYnVmWzBdICYgMHhDMCkgIT09IDB4ODApIHtcbiAgICBzZWxmLmxhc3ROZWVkID0gMDtcbiAgICByZXR1cm4gJ1xcdWZmZmQnO1xuICB9XG4gIGlmIChzZWxmLmxhc3ROZWVkID4gMSAmJiBidWYubGVuZ3RoID4gMSkge1xuICAgIGlmICgoYnVmWzFdICYgMHhDMCkgIT09IDB4ODApIHtcbiAgICAgIHNlbGYubGFzdE5lZWQgPSAxO1xuICAgICAgcmV0dXJuICdcXHVmZmZkJztcbiAgICB9XG4gICAgaWYgKHNlbGYubGFzdE5lZWQgPiAyICYmIGJ1Zi5sZW5ndGggPiAyKSB7XG4gICAgICBpZiAoKGJ1ZlsyXSAmIDB4QzApICE9PSAweDgwKSB7XG4gICAgICAgIHNlbGYubGFzdE5lZWQgPSAyO1xuICAgICAgICByZXR1cm4gJ1xcdWZmZmQnO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLyBBdHRlbXB0cyB0byBjb21wbGV0ZSBhIG11bHRpLWJ5dGUgVVRGLTggY2hhcmFjdGVyIHVzaW5nIGJ5dGVzIGZyb20gYSBCdWZmZXIuXG5mdW5jdGlvbiB1dGY4RmlsbExhc3QoYnVmKSB7XG4gIHZhciBwID0gdGhpcy5sYXN0VG90YWwgLSB0aGlzLmxhc3ROZWVkO1xuICB2YXIgciA9IHV0ZjhDaGVja0V4dHJhQnl0ZXModGhpcywgYnVmLCBwKTtcbiAgaWYgKHIgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHI7XG4gIGlmICh0aGlzLmxhc3ROZWVkIDw9IGJ1Zi5sZW5ndGgpIHtcbiAgICBidWYuY29weSh0aGlzLmxhc3RDaGFyLCBwLCAwLCB0aGlzLmxhc3ROZWVkKTtcbiAgICByZXR1cm4gdGhpcy5sYXN0Q2hhci50b1N0cmluZyh0aGlzLmVuY29kaW5nLCAwLCB0aGlzLmxhc3RUb3RhbCk7XG4gIH1cbiAgYnVmLmNvcHkodGhpcy5sYXN0Q2hhciwgcCwgMCwgYnVmLmxlbmd0aCk7XG4gIHRoaXMubGFzdE5lZWQgLT0gYnVmLmxlbmd0aDtcbn1cblxuLy8gUmV0dXJucyBhbGwgY29tcGxldGUgVVRGLTggY2hhcmFjdGVycyBpbiBhIEJ1ZmZlci4gSWYgdGhlIEJ1ZmZlciBlbmRlZCBvbiBhXG4vLyBwYXJ0aWFsIGNoYXJhY3RlciwgdGhlIGNoYXJhY3RlcidzIGJ5dGVzIGFyZSBidWZmZXJlZCB1bnRpbCB0aGUgcmVxdWlyZWRcbi8vIG51bWJlciBvZiBieXRlcyBhcmUgYXZhaWxhYmxlLlxuZnVuY3Rpb24gdXRmOFRleHQoYnVmLCBpKSB7XG4gIHZhciB0b3RhbCA9IHV0ZjhDaGVja0luY29tcGxldGUodGhpcywgYnVmLCBpKTtcbiAgaWYgKCF0aGlzLmxhc3ROZWVkKSByZXR1cm4gYnVmLnRvU3RyaW5nKCd1dGY4JywgaSk7XG4gIHRoaXMubGFzdFRvdGFsID0gdG90YWw7XG4gIHZhciBlbmQgPSBidWYubGVuZ3RoIC0gKHRvdGFsIC0gdGhpcy5sYXN0TmVlZCk7XG4gIGJ1Zi5jb3B5KHRoaXMubGFzdENoYXIsIDAsIGVuZCk7XG4gIHJldHVybiBidWYudG9TdHJpbmcoJ3V0ZjgnLCBpLCBlbmQpO1xufVxuXG4vLyBGb3IgVVRGLTgsIGEgcmVwbGFjZW1lbnQgY2hhcmFjdGVyIGlzIGFkZGVkIHdoZW4gZW5kaW5nIG9uIGEgcGFydGlhbFxuLy8gY2hhcmFjdGVyLlxuZnVuY3Rpb24gdXRmOEVuZChidWYpIHtcbiAgdmFyIHIgPSBidWYgJiYgYnVmLmxlbmd0aCA/IHRoaXMud3JpdGUoYnVmKSA6ICcnO1xuICBpZiAodGhpcy5sYXN0TmVlZCkgcmV0dXJuIHIgKyAnXFx1ZmZmZCc7XG4gIHJldHVybiByO1xufVxuXG4vLyBVVEYtMTZMRSB0eXBpY2FsbHkgbmVlZHMgdHdvIGJ5dGVzIHBlciBjaGFyYWN0ZXIsIGJ1dCBldmVuIGlmIHdlIGhhdmUgYW4gZXZlblxuLy8gbnVtYmVyIG9mIGJ5dGVzIGF2YWlsYWJsZSwgd2UgbmVlZCB0byBjaGVjayBpZiB3ZSBlbmQgb24gYSBsZWFkaW5nL2hpZ2hcbi8vIHN1cnJvZ2F0ZS4gSW4gdGhhdCBjYXNlLCB3ZSBuZWVkIHRvIHdhaXQgZm9yIHRoZSBuZXh0IHR3byBieXRlcyBpbiBvcmRlciB0b1xuLy8gZGVjb2RlIHRoZSBsYXN0IGNoYXJhY3RlciBwcm9wZXJseS5cbmZ1bmN0aW9uIHV0ZjE2VGV4dChidWYsIGkpIHtcbiAgaWYgKChidWYubGVuZ3RoIC0gaSkgJSAyID09PSAwKSB7XG4gICAgdmFyIHIgPSBidWYudG9TdHJpbmcoJ3V0ZjE2bGUnLCBpKTtcbiAgICBpZiAocikge1xuICAgICAgdmFyIGMgPSByLmNoYXJDb2RlQXQoci5sZW5ndGggLSAxKTtcbiAgICAgIGlmIChjID49IDB4RDgwMCAmJiBjIDw9IDB4REJGRikge1xuICAgICAgICB0aGlzLmxhc3ROZWVkID0gMjtcbiAgICAgICAgdGhpcy5sYXN0VG90YWwgPSA0O1xuICAgICAgICB0aGlzLmxhc3RDaGFyWzBdID0gYnVmW2J1Zi5sZW5ndGggLSAyXTtcbiAgICAgICAgdGhpcy5sYXN0Q2hhclsxXSA9IGJ1ZltidWYubGVuZ3RoIC0gMV07XG4gICAgICAgIHJldHVybiByLnNsaWNlKDAsIC0xKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cbiAgdGhpcy5sYXN0TmVlZCA9IDE7XG4gIHRoaXMubGFzdFRvdGFsID0gMjtcbiAgdGhpcy5sYXN0Q2hhclswXSA9IGJ1ZltidWYubGVuZ3RoIC0gMV07XG4gIHJldHVybiBidWYudG9TdHJpbmcoJ3V0ZjE2bGUnLCBpLCBidWYubGVuZ3RoIC0gMSk7XG59XG5cbi8vIEZvciBVVEYtMTZMRSB3ZSBkbyBub3QgZXhwbGljaXRseSBhcHBlbmQgc3BlY2lhbCByZXBsYWNlbWVudCBjaGFyYWN0ZXJzIGlmIHdlXG4vLyBlbmQgb24gYSBwYXJ0aWFsIGNoYXJhY3Rlciwgd2Ugc2ltcGx5IGxldCB2OCBoYW5kbGUgdGhhdC5cbmZ1bmN0aW9uIHV0ZjE2RW5kKGJ1Zikge1xuICB2YXIgciA9IGJ1ZiAmJiBidWYubGVuZ3RoID8gdGhpcy53cml0ZShidWYpIDogJyc7XG4gIGlmICh0aGlzLmxhc3ROZWVkKSB7XG4gICAgdmFyIGVuZCA9IHRoaXMubGFzdFRvdGFsIC0gdGhpcy5sYXN0TmVlZDtcbiAgICByZXR1cm4gciArIHRoaXMubGFzdENoYXIudG9TdHJpbmcoJ3V0ZjE2bGUnLCAwLCBlbmQpO1xuICB9XG4gIHJldHVybiByO1xufVxuXG5mdW5jdGlvbiBiYXNlNjRUZXh0KGJ1ZiwgaSkge1xuICB2YXIgbiA9IChidWYubGVuZ3RoIC0gaSkgJSAzO1xuICBpZiAobiA9PT0gMCkgcmV0dXJuIGJ1Zi50b1N0cmluZygnYmFzZTY0JywgaSk7XG4gIHRoaXMubGFzdE5lZWQgPSAzIC0gbjtcbiAgdGhpcy5sYXN0VG90YWwgPSAzO1xuICBpZiAobiA9PT0gMSkge1xuICAgIHRoaXMubGFzdENoYXJbMF0gPSBidWZbYnVmLmxlbmd0aCAtIDFdO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubGFzdENoYXJbMF0gPSBidWZbYnVmLmxlbmd0aCAtIDJdO1xuICAgIHRoaXMubGFzdENoYXJbMV0gPSBidWZbYnVmLmxlbmd0aCAtIDFdO1xuICB9XG4gIHJldHVybiBidWYudG9TdHJpbmcoJ2Jhc2U2NCcsIGksIGJ1Zi5sZW5ndGggLSBuKTtcbn1cblxuZnVuY3Rpb24gYmFzZTY0RW5kKGJ1Zikge1xuICB2YXIgciA9IGJ1ZiAmJiBidWYubGVuZ3RoID8gdGhpcy53cml0ZShidWYpIDogJyc7XG4gIGlmICh0aGlzLmxhc3ROZWVkKSByZXR1cm4gciArIHRoaXMubGFzdENoYXIudG9TdHJpbmcoJ2Jhc2U2NCcsIDAsIDMgLSB0aGlzLmxhc3ROZWVkKTtcbiAgcmV0dXJuIHI7XG59XG5cbi8vIFBhc3MgYnl0ZXMgb24gdGhyb3VnaCBmb3Igc2luZ2xlLWJ5dGUgZW5jb2RpbmdzIChlLmcuIGFzY2lpLCBsYXRpbjEsIGhleClcbmZ1bmN0aW9uIHNpbXBsZVdyaXRlKGJ1Zikge1xuICByZXR1cm4gYnVmLnRvU3RyaW5nKHRoaXMuZW5jb2RpbmcpO1xufVxuXG5mdW5jdGlvbiBzaW1wbGVFbmQoYnVmKSB7XG4gIHJldHVybiBidWYgJiYgYnVmLmxlbmd0aCA/IHRoaXMud3JpdGUoYnVmKSA6ICcnO1xufSIsIm1vZHVsZS5leHBvcnRzLk93TSA9IHJlcXVpcmUoXCIuL2xpYi9Pd01cIik7XG5tb2R1bGUuZXhwb3J0cy5iZWVzSGVhbGVyID0gcmVxdWlyZShcIi4vbGliL2JlZXNIZWFsZXJcIik7XG5cbmNvbnN0IHVpZEdlbmVyYXRvciA9IHJlcXVpcmUoXCIuL2xpYi91aWRHZW5lcmF0b3JcIikuY3JlYXRlVWlkR2VuZXJhdG9yKDIwMCwgMzIpO1xuXG5tb2R1bGUuZXhwb3J0cy5zYWZlX3V1aWQgPSByZXF1aXJlKFwiLi9saWIvc2FmZS11dWlkXCIpLmluaXQodWlkR2VuZXJhdG9yKTtcblxubW9kdWxlLmV4cG9ydHMuUXVldWUgPSByZXF1aXJlKFwiLi9saWIvUXVldWVcIik7XG5tb2R1bGUuZXhwb3J0cy5jb21ib3MgPSByZXF1aXJlKFwiLi9saWIvQ29tYm9zXCIpO1xuXG5tb2R1bGUuZXhwb3J0cy51aWRHZW5lcmF0b3IgPSB1aWRHZW5lcmF0b3I7XG5tb2R1bGUuZXhwb3J0cy5nZW5lcmF0ZVVpZCA9IHVpZEdlbmVyYXRvci5nZW5lcmF0ZVVpZDtcblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlUHNrQ29uc29sZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHJlcXVpcmUoJy4vbGliL3Bza2NvbnNvbGUnKTtcbn07XG5cblxuaWYodHlwZW9mIGdsb2JhbC4kJCA9PSBcInVuZGVmaW5lZFwiKXtcbiAgZ2xvYmFsLiQkID0ge307XG59XG5cbmlmKHR5cGVvZiBnbG9iYWwuJCQudWlkR2VuZXJhdG9yID09IFwidW5kZWZpbmVkXCIpe1xuICAgICQkLnVpZEdlbmVyYXRvciA9IG1vZHVsZS5leHBvcnRzLnNhZmVfdXVpZDtcbn1cbiIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBwdW55Y29kZSA9IHJlcXVpcmUoJ3B1bnljb2RlJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4vdXRpbCcpO1xuXG5leHBvcnRzLnBhcnNlID0gdXJsUGFyc2U7XG5leHBvcnRzLnJlc29sdmUgPSB1cmxSZXNvbHZlO1xuZXhwb3J0cy5yZXNvbHZlT2JqZWN0ID0gdXJsUmVzb2x2ZU9iamVjdDtcbmV4cG9ydHMuZm9ybWF0ID0gdXJsRm9ybWF0O1xuXG5leHBvcnRzLlVybCA9IFVybDtcblxuZnVuY3Rpb24gVXJsKCkge1xuICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgdGhpcy5zbGFzaGVzID0gbnVsbDtcbiAgdGhpcy5hdXRoID0gbnVsbDtcbiAgdGhpcy5ob3N0ID0gbnVsbDtcbiAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgdGhpcy5ob3N0bmFtZSA9IG51bGw7XG4gIHRoaXMuaGFzaCA9IG51bGw7XG4gIHRoaXMuc2VhcmNoID0gbnVsbDtcbiAgdGhpcy5xdWVyeSA9IG51bGw7XG4gIHRoaXMucGF0aG5hbWUgPSBudWxsO1xuICB0aGlzLnBhdGggPSBudWxsO1xuICB0aGlzLmhyZWYgPSBudWxsO1xufVxuXG4vLyBSZWZlcmVuY2U6IFJGQyAzOTg2LCBSRkMgMTgwOCwgUkZDIDIzOTZcblxuLy8gZGVmaW5lIHRoZXNlIGhlcmUgc28gYXQgbGVhc3QgdGhleSBvbmx5IGhhdmUgdG8gYmVcbi8vIGNvbXBpbGVkIG9uY2Ugb24gdGhlIGZpcnN0IG1vZHVsZSBsb2FkLlxudmFyIHByb3RvY29sUGF0dGVybiA9IC9eKFthLXowLTkuKy1dKzopL2ksXG4gICAgcG9ydFBhdHRlcm4gPSAvOlswLTldKiQvLFxuXG4gICAgLy8gU3BlY2lhbCBjYXNlIGZvciBhIHNpbXBsZSBwYXRoIFVSTFxuICAgIHNpbXBsZVBhdGhQYXR0ZXJuID0gL14oXFwvXFwvPyg/IVxcLylbXlxcP1xcc10qKShcXD9bXlxcc10qKT8kLyxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIHJlc2VydmVkIGZvciBkZWxpbWl0aW5nIFVSTHMuXG4gICAgLy8gV2UgYWN0dWFsbHkganVzdCBhdXRvLWVzY2FwZSB0aGVzZS5cbiAgICBkZWxpbXMgPSBbJzwnLCAnPicsICdcIicsICdgJywgJyAnLCAnXFxyJywgJ1xcbicsICdcXHQnXSxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIG5vdCBhbGxvd2VkIGZvciB2YXJpb3VzIHJlYXNvbnMuXG4gICAgdW53aXNlID0gWyd7JywgJ30nLCAnfCcsICdcXFxcJywgJ14nLCAnYCddLmNvbmNhdChkZWxpbXMpLFxuXG4gICAgLy8gQWxsb3dlZCBieSBSRkNzLCBidXQgY2F1c2Ugb2YgWFNTIGF0dGFja3MuICBBbHdheXMgZXNjYXBlIHRoZXNlLlxuICAgIGF1dG9Fc2NhcGUgPSBbJ1xcJyddLmNvbmNhdCh1bndpc2UpLFxuICAgIC8vIENoYXJhY3RlcnMgdGhhdCBhcmUgbmV2ZXIgZXZlciBhbGxvd2VkIGluIGEgaG9zdG5hbWUuXG4gICAgLy8gTm90ZSB0aGF0IGFueSBpbnZhbGlkIGNoYXJzIGFyZSBhbHNvIGhhbmRsZWQsIGJ1dCB0aGVzZVxuICAgIC8vIGFyZSB0aGUgb25lcyB0aGF0IGFyZSAqZXhwZWN0ZWQqIHRvIGJlIHNlZW4sIHNvIHdlIGZhc3QtcGF0aFxuICAgIC8vIHRoZW0uXG4gICAgbm9uSG9zdENoYXJzID0gWyclJywgJy8nLCAnPycsICc7JywgJyMnXS5jb25jYXQoYXV0b0VzY2FwZSksXG4gICAgaG9zdEVuZGluZ0NoYXJzID0gWycvJywgJz8nLCAnIyddLFxuICAgIGhvc3RuYW1lTWF4TGVuID0gMjU1LFxuICAgIGhvc3RuYW1lUGFydFBhdHRlcm4gPSAvXlsrYS16MC05QS1aXy1dezAsNjN9JC8sXG4gICAgaG9zdG5hbWVQYXJ0U3RhcnQgPSAvXihbK2EtejAtOUEtWl8tXXswLDYzfSkoLiopJC8sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgY2FuIGFsbG93IFwidW5zYWZlXCIgYW5kIFwidW53aXNlXCIgY2hhcnMuXG4gICAgdW5zYWZlUHJvdG9jb2wgPSB7XG4gICAgICAnamF2YXNjcmlwdCc6IHRydWUsXG4gICAgICAnamF2YXNjcmlwdDonOiB0cnVlXG4gICAgfSxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBuZXZlciBoYXZlIGEgaG9zdG5hbWUuXG4gICAgaG9zdGxlc3NQcm90b2NvbCA9IHtcbiAgICAgICdqYXZhc2NyaXB0JzogdHJ1ZSxcbiAgICAgICdqYXZhc2NyaXB0Oic6IHRydWVcbiAgICB9LFxuICAgIC8vIHByb3RvY29scyB0aGF0IGFsd2F5cyBjb250YWluIGEgLy8gYml0LlxuICAgIHNsYXNoZWRQcm90b2NvbCA9IHtcbiAgICAgICdodHRwJzogdHJ1ZSxcbiAgICAgICdodHRwcyc6IHRydWUsXG4gICAgICAnZnRwJzogdHJ1ZSxcbiAgICAgICdnb3BoZXInOiB0cnVlLFxuICAgICAgJ2ZpbGUnOiB0cnVlLFxuICAgICAgJ2h0dHA6JzogdHJ1ZSxcbiAgICAgICdodHRwczonOiB0cnVlLFxuICAgICAgJ2Z0cDonOiB0cnVlLFxuICAgICAgJ2dvcGhlcjonOiB0cnVlLFxuICAgICAgJ2ZpbGU6JzogdHJ1ZVxuICAgIH0sXG4gICAgcXVlcnlzdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuXG5mdW5jdGlvbiB1cmxQYXJzZSh1cmwsIHBhcnNlUXVlcnlTdHJpbmcsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICh1cmwgJiYgdXRpbC5pc09iamVjdCh1cmwpICYmIHVybCBpbnN0YW5jZW9mIFVybCkgcmV0dXJuIHVybDtcblxuICB2YXIgdSA9IG5ldyBVcmw7XG4gIHUucGFyc2UodXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCk7XG4gIHJldHVybiB1O1xufVxuXG5VcmwucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odXJsLCBwYXJzZVF1ZXJ5U3RyaW5nLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBpZiAoIXV0aWwuaXNTdHJpbmcodXJsKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQYXJhbWV0ZXIgJ3VybCcgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHVybCk7XG4gIH1cblxuICAvLyBDb3B5IGNocm9tZSwgSUUsIG9wZXJhIGJhY2tzbGFzaC1oYW5kbGluZyBiZWhhdmlvci5cbiAgLy8gQmFjayBzbGFzaGVzIGJlZm9yZSB0aGUgcXVlcnkgc3RyaW5nIGdldCBjb252ZXJ0ZWQgdG8gZm9yd2FyZCBzbGFzaGVzXG4gIC8vIFNlZTogaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1OTE2XG4gIHZhciBxdWVyeUluZGV4ID0gdXJsLmluZGV4T2YoJz8nKSxcbiAgICAgIHNwbGl0dGVyID1cbiAgICAgICAgICAocXVlcnlJbmRleCAhPT0gLTEgJiYgcXVlcnlJbmRleCA8IHVybC5pbmRleE9mKCcjJykpID8gJz8nIDogJyMnLFxuICAgICAgdVNwbGl0ID0gdXJsLnNwbGl0KHNwbGl0dGVyKSxcbiAgICAgIHNsYXNoUmVnZXggPSAvXFxcXC9nO1xuICB1U3BsaXRbMF0gPSB1U3BsaXRbMF0ucmVwbGFjZShzbGFzaFJlZ2V4LCAnLycpO1xuICB1cmwgPSB1U3BsaXQuam9pbihzcGxpdHRlcik7XG5cbiAgdmFyIHJlc3QgPSB1cmw7XG5cbiAgLy8gdHJpbSBiZWZvcmUgcHJvY2VlZGluZy5cbiAgLy8gVGhpcyBpcyB0byBzdXBwb3J0IHBhcnNlIHN0dWZmIGxpa2UgXCIgIGh0dHA6Ly9mb28uY29tICBcXG5cIlxuICByZXN0ID0gcmVzdC50cmltKCk7XG5cbiAgaWYgKCFzbGFzaGVzRGVub3RlSG9zdCAmJiB1cmwuc3BsaXQoJyMnKS5sZW5ndGggPT09IDEpIHtcbiAgICAvLyBUcnkgZmFzdCBwYXRoIHJlZ2V4cFxuICAgIHZhciBzaW1wbGVQYXRoID0gc2ltcGxlUGF0aFBhdHRlcm4uZXhlYyhyZXN0KTtcbiAgICBpZiAoc2ltcGxlUGF0aCkge1xuICAgICAgdGhpcy5wYXRoID0gcmVzdDtcbiAgICAgIHRoaXMuaHJlZiA9IHJlc3Q7XG4gICAgICB0aGlzLnBhdGhuYW1lID0gc2ltcGxlUGF0aFsxXTtcbiAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2ltcGxlUGF0aFsyXTtcbiAgICAgICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gcXVlcnlzdHJpbmcucGFyc2UodGhpcy5zZWFyY2guc3Vic3RyKDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5ID0gdGhpcy5zZWFyY2guc3Vic3RyKDEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSAnJztcbiAgICAgICAgdGhpcy5xdWVyeSA9IHt9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgdmFyIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBsb3dlclByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICB2YXIgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG5cbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICB2YXIgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaG9zdEVuZGluZ0NoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpXG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgdmFyIGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KGF1dGgpO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBoZWMgPSByZXN0LmluZGV4T2Yobm9uSG9zdENoYXJzW2ldKTtcbiAgICAgIGlmIChoZWMgIT09IC0xICYmIChob3N0RW5kID09PSAtMSB8fCBoZWMgPCBob3N0RW5kKSlcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSlcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcblxuICAgIHRoaXMuaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIHZhciBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gJy8nICsgbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaG9zdG5hbWVzIGFyZSBhbHdheXMgbG93ZXIgY2FzZS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIC8vIElETkEgU3VwcG9ydDogUmV0dXJucyBhIHB1bnljb2RlZCByZXByZXNlbnRhdGlvbiBvZiBcImRvbWFpblwiLlxuICAgICAgLy8gSXQgb25seSBjb252ZXJ0cyBwYXJ0cyBvZiB0aGUgZG9tYWluIG5hbWUgdGhhdFxuICAgICAgLy8gaGF2ZSBub24tQVNDSUkgY2hhcmFjdGVycywgaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZlxuICAgICAgLy8geW91IGNhbGwgaXQgd2l0aCBhIGRvbWFpbiB0aGF0IGFscmVhZHkgaXMgQVNDSUktb25seS5cbiAgICAgIHRoaXMuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHRoaXMuaG9zdG5hbWUpO1xuICAgIH1cblxuICAgIHZhciBwID0gdGhpcy5wb3J0ID8gJzonICsgdGhpcy5wb3J0IDogJyc7XG4gICAgdmFyIGggPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuICAgIHRoaXMuaG9zdCA9IGggKyBwO1xuICAgIHRoaXMuaHJlZiArPSB0aGlzLmhvc3Q7XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIGlmIChyZXN0WzBdICE9PSAnLycpIHtcbiAgICAgICAgcmVzdCA9ICcvJyArIHJlc3Q7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gbm93IHJlc3QgaXMgc2V0IHRvIHRoZSBwb3N0LWhvc3Qgc3R1ZmYuXG4gIC8vIGNob3Agb2ZmIGFueSBkZWxpbSBjaGFycy5cbiAgaWYgKCF1bnNhZmVQcm90b2NvbFtsb3dlclByb3RvXSkge1xuXG4gICAgLy8gRmlyc3QsIG1ha2UgMTAwJSBzdXJlIHRoYXQgYW55IFwiYXV0b0VzY2FwZVwiIGNoYXJzIGdldFxuICAgIC8vIGVzY2FwZWQsIGV2ZW4gaWYgZW5jb2RlVVJJQ29tcG9uZW50IGRvZXNuJ3QgdGhpbmsgdGhleVxuICAgIC8vIG5lZWQgdG8gYmUuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdXRvRXNjYXBlLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIGFlID0gYXV0b0VzY2FwZVtpXTtcbiAgICAgIGlmIChyZXN0LmluZGV4T2YoYWUpID09PSAtMSlcbiAgICAgICAgY29udGludWU7XG4gICAgICB2YXIgZXNjID0gZW5jb2RlVVJJQ29tcG9uZW50KGFlKTtcbiAgICAgIGlmIChlc2MgPT09IGFlKSB7XG4gICAgICAgIGVzYyA9IGVzY2FwZShhZSk7XG4gICAgICB9XG4gICAgICByZXN0ID0gcmVzdC5zcGxpdChhZSkuam9pbihlc2MpO1xuICAgIH1cbiAgfVxuXG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgdmFyIGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgdGhpcy5xdWVyeSA9IHJlc3Quc3Vic3RyKHFtICsgMSk7XG4gICAgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAgIHRoaXMucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh0aGlzLnF1ZXJ5KTtcbiAgICB9XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9IGVsc2UgaWYgKHBhcnNlUXVlcnlTdHJpbmcpIHtcbiAgICAvLyBubyBxdWVyeSBzdHJpbmcsIGJ1dCBwYXJzZVF1ZXJ5U3RyaW5nIHN0aWxsIHJlcXVlc3RlZFxuICAgIHRoaXMuc2VhcmNoID0gJyc7XG4gICAgdGhpcy5xdWVyeSA9IHt9O1xuICB9XG4gIGlmIChyZXN0KSB0aGlzLnBhdGhuYW1lID0gcmVzdDtcbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnLyc7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gIGlmICh0aGlzLnBhdGhuYW1lIHx8IHRoaXMuc2VhcmNoKSB7XG4gICAgdmFyIHAgPSB0aGlzLnBhdGhuYW1lIHx8ICcnO1xuICAgIHZhciBzID0gdGhpcy5zZWFyY2ggfHwgJyc7XG4gICAgdGhpcy5wYXRoID0gcCArIHM7XG4gIH1cblxuICAvLyBmaW5hbGx5LCByZWNvbnN0cnVjdCB0aGUgaHJlZiBiYXNlZCBvbiB3aGF0IGhhcyBiZWVuIHZhbGlkYXRlZC5cbiAgdGhpcy5ocmVmID0gdGhpcy5mb3JtYXQoKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmb3JtYXQgYSBwYXJzZWQgb2JqZWN0IGludG8gYSB1cmwgc3RyaW5nXG5mdW5jdGlvbiB1cmxGb3JtYXQob2JqKSB7XG4gIC8vIGVuc3VyZSBpdCdzIGFuIG9iamVjdCwgYW5kIG5vdCBhIHN0cmluZyB1cmwuXG4gIC8vIElmIGl0J3MgYW4gb2JqLCB0aGlzIGlzIGEgbm8tb3AuXG4gIC8vIHRoaXMgd2F5LCB5b3UgY2FuIGNhbGwgdXJsX2Zvcm1hdCgpIG9uIHN0cmluZ3NcbiAgLy8gdG8gY2xlYW4gdXAgcG90ZW50aWFsbHkgd29ua3kgdXJscy5cbiAgaWYgKHV0aWwuaXNTdHJpbmcob2JqKSkgb2JqID0gdXJsUGFyc2Uob2JqKTtcbiAgaWYgKCEob2JqIGluc3RhbmNlb2YgVXJsKSkgcmV0dXJuIFVybC5wcm90b3R5cGUuZm9ybWF0LmNhbGwob2JqKTtcbiAgcmV0dXJuIG9iai5mb3JtYXQoKTtcbn1cblxuVXJsLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGF1dGggPSB0aGlzLmF1dGggfHwgJyc7XG4gIGlmIChhdXRoKSB7XG4gICAgYXV0aCA9IGVuY29kZVVSSUNvbXBvbmVudChhdXRoKTtcbiAgICBhdXRoID0gYXV0aC5yZXBsYWNlKC8lM0EvaSwgJzonKTtcbiAgICBhdXRoICs9ICdAJztcbiAgfVxuXG4gIHZhciBwcm90b2NvbCA9IHRoaXMucHJvdG9jb2wgfHwgJycsXG4gICAgICBwYXRobmFtZSA9IHRoaXMucGF0aG5hbWUgfHwgJycsXG4gICAgICBoYXNoID0gdGhpcy5oYXNoIHx8ICcnLFxuICAgICAgaG9zdCA9IGZhbHNlLFxuICAgICAgcXVlcnkgPSAnJztcblxuICBpZiAodGhpcy5ob3N0KSB7XG4gICAgaG9zdCA9IGF1dGggKyB0aGlzLmhvc3Q7XG4gIH0gZWxzZSBpZiAodGhpcy5ob3N0bmFtZSkge1xuICAgIGhvc3QgPSBhdXRoICsgKHRoaXMuaG9zdG5hbWUuaW5kZXhPZignOicpID09PSAtMSA/XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgOlxuICAgICAgICAnWycgKyB0aGlzLmhvc3RuYW1lICsgJ10nKTtcbiAgICBpZiAodGhpcy5wb3J0KSB7XG4gICAgICBob3N0ICs9ICc6JyArIHRoaXMucG9ydDtcbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5xdWVyeSAmJlxuICAgICAgdXRpbC5pc09iamVjdCh0aGlzLnF1ZXJ5KSAmJlxuICAgICAgT2JqZWN0LmtleXModGhpcy5xdWVyeSkubGVuZ3RoKSB7XG4gICAgcXVlcnkgPSBxdWVyeXN0cmluZy5zdHJpbmdpZnkodGhpcy5xdWVyeSk7XG4gIH1cblxuICB2YXIgc2VhcmNoID0gdGhpcy5zZWFyY2ggfHwgKHF1ZXJ5ICYmICgnPycgKyBxdWVyeSkpIHx8ICcnO1xuXG4gIGlmIChwcm90b2NvbCAmJiBwcm90b2NvbC5zdWJzdHIoLTEpICE9PSAnOicpIHByb3RvY29sICs9ICc6JztcblxuICAvLyBvbmx5IHRoZSBzbGFzaGVkUHJvdG9jb2xzIGdldCB0aGUgLy8uICBOb3QgbWFpbHRvOiwgeG1wcDosIGV0Yy5cbiAgLy8gdW5sZXNzIHRoZXkgaGFkIHRoZW0gdG8gYmVnaW4gd2l0aC5cbiAgaWYgKHRoaXMuc2xhc2hlcyB8fFxuICAgICAgKCFwcm90b2NvbCB8fCBzbGFzaGVkUHJvdG9jb2xbcHJvdG9jb2xdKSAmJiBob3N0ICE9PSBmYWxzZSkge1xuICAgIGhvc3QgPSAnLy8nICsgKGhvc3QgfHwgJycpO1xuICAgIGlmIChwYXRobmFtZSAmJiBwYXRobmFtZS5jaGFyQXQoMCkgIT09ICcvJykgcGF0aG5hbWUgPSAnLycgKyBwYXRobmFtZTtcbiAgfSBlbHNlIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSAnJztcbiAgfVxuXG4gIGlmIChoYXNoICYmIGhhc2guY2hhckF0KDApICE9PSAnIycpIGhhc2ggPSAnIycgKyBoYXNoO1xuICBpZiAoc2VhcmNoICYmIHNlYXJjaC5jaGFyQXQoMCkgIT09ICc/Jykgc2VhcmNoID0gJz8nICsgc2VhcmNoO1xuXG4gIHBhdGhuYW1lID0gcGF0aG5hbWUucmVwbGFjZSgvWz8jXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIHJldHVybiBlbmNvZGVVUklDb21wb25lbnQobWF0Y2gpO1xuICB9KTtcbiAgc2VhcmNoID0gc2VhcmNoLnJlcGxhY2UoJyMnLCAnJTIzJyk7XG5cbiAgcmV0dXJuIHByb3RvY29sICsgaG9zdCArIHBhdGhuYW1lICsgc2VhcmNoICsgaGFzaDtcbn07XG5cbmZ1bmN0aW9uIHVybFJlc29sdmUoc291cmNlLCByZWxhdGl2ZSkge1xuICByZXR1cm4gdXJsUGFyc2Uoc291cmNlLCBmYWxzZSwgdHJ1ZSkucmVzb2x2ZShyZWxhdGl2ZSk7XG59XG5cblVybC5wcm90b3R5cGUucmVzb2x2ZSA9IGZ1bmN0aW9uKHJlbGF0aXZlKSB7XG4gIHJldHVybiB0aGlzLnJlc29sdmVPYmplY3QodXJsUGFyc2UocmVsYXRpdmUsIGZhbHNlLCB0cnVlKSkuZm9ybWF0KCk7XG59O1xuXG5mdW5jdGlvbiB1cmxSZXNvbHZlT2JqZWN0KHNvdXJjZSwgcmVsYXRpdmUpIHtcbiAgaWYgKCFzb3VyY2UpIHJldHVybiByZWxhdGl2ZTtcbiAgcmV0dXJuIHVybFBhcnNlKHNvdXJjZSwgZmFsc2UsIHRydWUpLnJlc29sdmVPYmplY3QocmVsYXRpdmUpO1xufVxuXG5VcmwucHJvdG90eXBlLnJlc29sdmVPYmplY3QgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICBpZiAodXRpbC5pc1N0cmluZyhyZWxhdGl2ZSkpIHtcbiAgICB2YXIgcmVsID0gbmV3IFVybCgpO1xuICAgIHJlbC5wYXJzZShyZWxhdGl2ZSwgZmFsc2UsIHRydWUpO1xuICAgIHJlbGF0aXZlID0gcmVsO1xuICB9XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBVcmwoKTtcbiAgdmFyIHRrZXlzID0gT2JqZWN0LmtleXModGhpcyk7XG4gIGZvciAodmFyIHRrID0gMDsgdGsgPCB0a2V5cy5sZW5ndGg7IHRrKyspIHtcbiAgICB2YXIgdGtleSA9IHRrZXlzW3RrXTtcbiAgICByZXN1bHRbdGtleV0gPSB0aGlzW3RrZXldO1xuICB9XG5cbiAgLy8gaGFzaCBpcyBhbHdheXMgb3ZlcnJpZGRlbiwgbm8gbWF0dGVyIHdoYXQuXG4gIC8vIGV2ZW4gaHJlZj1cIlwiIHdpbGwgcmVtb3ZlIGl0LlxuICByZXN1bHQuaGFzaCA9IHJlbGF0aXZlLmhhc2g7XG5cbiAgLy8gaWYgdGhlIHJlbGF0aXZlIHVybCBpcyBlbXB0eSwgdGhlbiB0aGVyZSdzIG5vdGhpbmcgbGVmdCB0byBkbyBoZXJlLlxuICBpZiAocmVsYXRpdmUuaHJlZiA9PT0gJycpIHtcbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gaHJlZnMgbGlrZSAvL2Zvby9iYXIgYWx3YXlzIGN1dCB0byB0aGUgcHJvdG9jb2wuXG4gIGlmIChyZWxhdGl2ZS5zbGFzaGVzICYmICFyZWxhdGl2ZS5wcm90b2NvbCkge1xuICAgIC8vIHRha2UgZXZlcnl0aGluZyBleGNlcHQgdGhlIHByb3RvY29sIGZyb20gcmVsYXRpdmVcbiAgICB2YXIgcmtleXMgPSBPYmplY3Qua2V5cyhyZWxhdGl2ZSk7XG4gICAgZm9yICh2YXIgcmsgPSAwOyByayA8IHJrZXlzLmxlbmd0aDsgcmsrKykge1xuICAgICAgdmFyIHJrZXkgPSBya2V5c1tya107XG4gICAgICBpZiAocmtleSAhPT0gJ3Byb3RvY29sJylcbiAgICAgICAgcmVzdWx0W3JrZXldID0gcmVsYXRpdmVbcmtleV07XG4gICAgfVxuXG4gICAgLy91cmxQYXJzZSBhcHBlbmRzIHRyYWlsaW5nIC8gdG8gdXJscyBsaWtlIGh0dHA6Ly93d3cuZXhhbXBsZS5jb21cbiAgICBpZiAoc2xhc2hlZFByb3RvY29sW3Jlc3VsdC5wcm90b2NvbF0gJiZcbiAgICAgICAgcmVzdWx0Lmhvc3RuYW1lICYmICFyZXN1bHQucGF0aG5hbWUpIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gcmVzdWx0LnBhdGhuYW1lID0gJy8nO1xuICAgIH1cblxuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpZiAocmVsYXRpdmUucHJvdG9jb2wgJiYgcmVsYXRpdmUucHJvdG9jb2wgIT09IHJlc3VsdC5wcm90b2NvbCkge1xuICAgIC8vIGlmIGl0J3MgYSBrbm93biB1cmwgcHJvdG9jb2wsIHRoZW4gY2hhbmdpbmdcbiAgICAvLyB0aGUgcHJvdG9jb2wgZG9lcyB3ZWlyZCB0aGluZ3NcbiAgICAvLyBmaXJzdCwgaWYgaXQncyBub3QgZmlsZTosIHRoZW4gd2UgTVVTVCBoYXZlIGEgaG9zdCxcbiAgICAvLyBhbmQgaWYgdGhlcmUgd2FzIGEgcGF0aFxuICAgIC8vIHRvIGJlZ2luIHdpdGgsIHRoZW4gd2UgTVVTVCBoYXZlIGEgcGF0aC5cbiAgICAvLyBpZiBpdCBpcyBmaWxlOiwgdGhlbiB0aGUgaG9zdCBpcyBkcm9wcGVkLFxuICAgIC8vIGJlY2F1c2UgdGhhdCdzIGtub3duIHRvIGJlIGhvc3RsZXNzLlxuICAgIC8vIGFueXRoaW5nIGVsc2UgaXMgYXNzdW1lZCB0byBiZSBhYnNvbHV0ZS5cbiAgICBpZiAoIXNsYXNoZWRQcm90b2NvbFtyZWxhdGl2ZS5wcm90b2NvbF0pIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocmVsYXRpdmUpO1xuICAgICAgZm9yICh2YXIgdiA9IDA7IHYgPCBrZXlzLmxlbmd0aDsgdisrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1t2XTtcbiAgICAgICAgcmVzdWx0W2tdID0gcmVsYXRpdmVba107XG4gICAgICB9XG4gICAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgcmVzdWx0LnByb3RvY29sID0gcmVsYXRpdmUucHJvdG9jb2w7XG4gICAgaWYgKCFyZWxhdGl2ZS5ob3N0ICYmICFob3N0bGVzc1Byb3RvY29sW3JlbGF0aXZlLnByb3RvY29sXSkge1xuICAgICAgdmFyIHJlbFBhdGggPSAocmVsYXRpdmUucGF0aG5hbWUgfHwgJycpLnNwbGl0KCcvJyk7XG4gICAgICB3aGlsZSAocmVsUGF0aC5sZW5ndGggJiYgIShyZWxhdGl2ZS5ob3N0ID0gcmVsUGF0aC5zaGlmdCgpKSk7XG4gICAgICBpZiAoIXJlbGF0aXZlLmhvc3QpIHJlbGF0aXZlLmhvc3QgPSAnJztcbiAgICAgIGlmICghcmVsYXRpdmUuaG9zdG5hbWUpIHJlbGF0aXZlLmhvc3RuYW1lID0gJyc7XG4gICAgICBpZiAocmVsUGF0aFswXSAhPT0gJycpIHJlbFBhdGgudW5zaGlmdCgnJyk7XG4gICAgICBpZiAocmVsUGF0aC5sZW5ndGggPCAyKSByZWxQYXRoLnVuc2hpZnQoJycpO1xuICAgICAgcmVzdWx0LnBhdGhuYW1lID0gcmVsUGF0aC5qb2luKCcvJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRobmFtZSA9IHJlbGF0aXZlLnBhdGhuYW1lO1xuICAgIH1cbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICAgIHJlc3VsdC5ob3N0ID0gcmVsYXRpdmUuaG9zdCB8fCAnJztcbiAgICByZXN1bHQuYXV0aCA9IHJlbGF0aXZlLmF1dGg7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gcmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdDtcbiAgICByZXN1bHQucG9ydCA9IHJlbGF0aXZlLnBvcnQ7XG4gICAgLy8gdG8gc3VwcG9ydCBodHRwLnJlcXVlc3RcbiAgICBpZiAocmVzdWx0LnBhdGhuYW1lIHx8IHJlc3VsdC5zZWFyY2gpIHtcbiAgICAgIHZhciBwID0gcmVzdWx0LnBhdGhuYW1lIHx8ICcnO1xuICAgICAgdmFyIHMgPSByZXN1bHQuc2VhcmNoIHx8ICcnO1xuICAgICAgcmVzdWx0LnBhdGggPSBwICsgcztcbiAgICB9XG4gICAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICAgIHJlc3VsdC5ocmVmID0gcmVzdWx0LmZvcm1hdCgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICB2YXIgaXNTb3VyY2VBYnMgPSAocmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5jaGFyQXQoMCkgPT09ICcvJyksXG4gICAgICBpc1JlbEFicyA9IChcbiAgICAgICAgICByZWxhdGl2ZS5ob3N0IHx8XG4gICAgICAgICAgcmVsYXRpdmUucGF0aG5hbWUgJiYgcmVsYXRpdmUucGF0aG5hbWUuY2hhckF0KDApID09PSAnLydcbiAgICAgICksXG4gICAgICBtdXN0RW5kQWJzID0gKGlzUmVsQWJzIHx8IGlzU291cmNlQWJzIHx8XG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQuaG9zdCAmJiByZWxhdGl2ZS5wYXRobmFtZSkpLFxuICAgICAgcmVtb3ZlQWxsRG90cyA9IG11c3RFbmRBYnMsXG4gICAgICBzcmNQYXRoID0gcmVzdWx0LnBhdGhuYW1lICYmIHJlc3VsdC5wYXRobmFtZS5zcGxpdCgnLycpIHx8IFtdLFxuICAgICAgcmVsUGF0aCA9IHJlbGF0aXZlLnBhdGhuYW1lICYmIHJlbGF0aXZlLnBhdGhuYW1lLnNwbGl0KCcvJykgfHwgW10sXG4gICAgICBwc3ljaG90aWMgPSByZXN1bHQucHJvdG9jb2wgJiYgIXNsYXNoZWRQcm90b2NvbFtyZXN1bHQucHJvdG9jb2xdO1xuXG4gIC8vIGlmIHRoZSB1cmwgaXMgYSBub24tc2xhc2hlZCB1cmwsIHRoZW4gcmVsYXRpdmVcbiAgLy8gbGlua3MgbGlrZSAuLi8uLiBzaG91bGQgYmUgYWJsZVxuICAvLyB0byBjcmF3bCB1cCB0byB0aGUgaG9zdG5hbWUsIGFzIHdlbGwuICBUaGlzIGlzIHN0cmFuZ2UuXG4gIC8vIHJlc3VsdC5wcm90b2NvbCBoYXMgYWxyZWFkeSBiZWVuIHNldCBieSBub3cuXG4gIC8vIExhdGVyIG9uLCBwdXQgdGhlIGZpcnN0IHBhdGggcGFydCBpbnRvIHRoZSBob3N0IGZpZWxkLlxuICBpZiAocHN5Y2hvdGljKSB7XG4gICAgcmVzdWx0Lmhvc3RuYW1lID0gJyc7XG4gICAgcmVzdWx0LnBvcnQgPSBudWxsO1xuICAgIGlmIChyZXN1bHQuaG9zdCkge1xuICAgICAgaWYgKHNyY1BhdGhbMF0gPT09ICcnKSBzcmNQYXRoWzBdID0gcmVzdWx0Lmhvc3Q7XG4gICAgICBlbHNlIHNyY1BhdGgudW5zaGlmdChyZXN1bHQuaG9zdCk7XG4gICAgfVxuICAgIHJlc3VsdC5ob3N0ID0gJyc7XG4gICAgaWYgKHJlbGF0aXZlLnByb3RvY29sKSB7XG4gICAgICByZWxhdGl2ZS5ob3N0bmFtZSA9IG51bGw7XG4gICAgICByZWxhdGl2ZS5wb3J0ID0gbnVsbDtcbiAgICAgIGlmIChyZWxhdGl2ZS5ob3N0KSB7XG4gICAgICAgIGlmIChyZWxQYXRoWzBdID09PSAnJykgcmVsUGF0aFswXSA9IHJlbGF0aXZlLmhvc3Q7XG4gICAgICAgIGVsc2UgcmVsUGF0aC51bnNoaWZ0KHJlbGF0aXZlLmhvc3QpO1xuICAgICAgfVxuICAgICAgcmVsYXRpdmUuaG9zdCA9IG51bGw7XG4gICAgfVxuICAgIG11c3RFbmRBYnMgPSBtdXN0RW5kQWJzICYmIChyZWxQYXRoWzBdID09PSAnJyB8fCBzcmNQYXRoWzBdID09PSAnJyk7XG4gIH1cblxuICBpZiAoaXNSZWxBYnMpIHtcbiAgICAvLyBpdCdzIGFic29sdXRlLlxuICAgIHJlc3VsdC5ob3N0ID0gKHJlbGF0aXZlLmhvc3QgfHwgcmVsYXRpdmUuaG9zdCA9PT0gJycpID9cbiAgICAgICAgICAgICAgICAgIHJlbGF0aXZlLmhvc3QgOiByZXN1bHQuaG9zdDtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSAocmVsYXRpdmUuaG9zdG5hbWUgfHwgcmVsYXRpdmUuaG9zdG5hbWUgPT09ICcnKSA/XG4gICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmUuaG9zdG5hbWUgOiByZXN1bHQuaG9zdG5hbWU7XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICBzcmNQYXRoID0gcmVsUGF0aDtcbiAgICAvLyBmYWxsIHRocm91Z2ggdG8gdGhlIGRvdC1oYW5kbGluZyBiZWxvdy5cbiAgfSBlbHNlIGlmIChyZWxQYXRoLmxlbmd0aCkge1xuICAgIC8vIGl0J3MgcmVsYXRpdmVcbiAgICAvLyB0aHJvdyBhd2F5IHRoZSBleGlzdGluZyBmaWxlLCBhbmQgdGFrZSB0aGUgbmV3IHBhdGggaW5zdGVhZC5cbiAgICBpZiAoIXNyY1BhdGgpIHNyY1BhdGggPSBbXTtcbiAgICBzcmNQYXRoLnBvcCgpO1xuICAgIHNyY1BhdGggPSBzcmNQYXRoLmNvbmNhdChyZWxQYXRoKTtcbiAgICByZXN1bHQuc2VhcmNoID0gcmVsYXRpdmUuc2VhcmNoO1xuICAgIHJlc3VsdC5xdWVyeSA9IHJlbGF0aXZlLnF1ZXJ5O1xuICB9IGVsc2UgaWYgKCF1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKHJlbGF0aXZlLnNlYXJjaCkpIHtcbiAgICAvLyBqdXN0IHB1bGwgb3V0IHRoZSBzZWFyY2guXG4gICAgLy8gbGlrZSBocmVmPSc/Zm9vJy5cbiAgICAvLyBQdXQgdGhpcyBhZnRlciB0aGUgb3RoZXIgdHdvIGNhc2VzIGJlY2F1c2UgaXQgc2ltcGxpZmllcyB0aGUgYm9vbGVhbnNcbiAgICBpZiAocHN5Y2hvdGljKSB7XG4gICAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IHNyY1BhdGguc2hpZnQoKTtcbiAgICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAgIC8vdGhpcyBlc3BlY2lhbGx5IGhhcHBlbnMgaW4gY2FzZXMgbGlrZVxuICAgICAgLy91cmwucmVzb2x2ZU9iamVjdCgnbWFpbHRvOmxvY2FsMUBkb21haW4xJywgJ2xvY2FsMkBkb21haW4yJylcbiAgICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5ob3N0LnNwbGl0KCdAJykgOiBmYWxzZTtcbiAgICAgIGlmIChhdXRoSW5Ib3N0KSB7XG4gICAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgICByZXN1bHQuaG9zdCA9IHJlc3VsdC5ob3N0bmFtZSA9IGF1dGhJbkhvc3Quc2hpZnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmVzdWx0LnNlYXJjaCA9IHJlbGF0aXZlLnNlYXJjaDtcbiAgICByZXN1bHQucXVlcnkgPSByZWxhdGl2ZS5xdWVyeTtcbiAgICAvL3RvIHN1cHBvcnQgaHR0cC5yZXF1ZXN0XG4gICAgaWYgKCF1dGlsLmlzTnVsbChyZXN1bHQucGF0aG5hbWUpIHx8ICF1dGlsLmlzTnVsbChyZXN1bHQuc2VhcmNoKSkge1xuICAgICAgcmVzdWx0LnBhdGggPSAocmVzdWx0LnBhdGhuYW1lID8gcmVzdWx0LnBhdGhuYW1lIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICAgIH1cbiAgICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaWYgKCFzcmNQYXRoLmxlbmd0aCkge1xuICAgIC8vIG5vIHBhdGggYXQgYWxsLiAgZWFzeS5cbiAgICAvLyB3ZSd2ZSBhbHJlYWR5IGhhbmRsZWQgdGhlIG90aGVyIHN0dWZmIGFib3ZlLlxuICAgIHJlc3VsdC5wYXRobmFtZSA9IG51bGw7XG4gICAgLy90byBzdXBwb3J0IGh0dHAucmVxdWVzdFxuICAgIGlmIChyZXN1bHQuc2VhcmNoKSB7XG4gICAgICByZXN1bHQucGF0aCA9ICcvJyArIHJlc3VsdC5zZWFyY2g7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5wYXRoID0gbnVsbDtcbiAgICB9XG4gICAgcmVzdWx0LmhyZWYgPSByZXN1bHQuZm9ybWF0KCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIGlmIGEgdXJsIEVORHMgaW4gLiBvciAuLiwgdGhlbiBpdCBtdXN0IGdldCBhIHRyYWlsaW5nIHNsYXNoLlxuICAvLyBob3dldmVyLCBpZiBpdCBlbmRzIGluIGFueXRoaW5nIGVsc2Ugbm9uLXNsYXNoeSxcbiAgLy8gdGhlbiBpdCBtdXN0IE5PVCBnZXQgYSB0cmFpbGluZyBzbGFzaC5cbiAgdmFyIGxhc3QgPSBzcmNQYXRoLnNsaWNlKC0xKVswXTtcbiAgdmFyIGhhc1RyYWlsaW5nU2xhc2ggPSAoXG4gICAgICAocmVzdWx0Lmhvc3QgfHwgcmVsYXRpdmUuaG9zdCB8fCBzcmNQYXRoLmxlbmd0aCA+IDEpICYmXG4gICAgICAobGFzdCA9PT0gJy4nIHx8IGxhc3QgPT09ICcuLicpIHx8IGxhc3QgPT09ICcnKTtcblxuICAvLyBzdHJpcCBzaW5nbGUgZG90cywgcmVzb2x2ZSBkb3VibGUgZG90cyB0byBwYXJlbnQgZGlyXG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBzcmNQYXRoLmxlbmd0aDsgaSA+PSAwOyBpLS0pIHtcbiAgICBsYXN0ID0gc3JjUGF0aFtpXTtcbiAgICBpZiAobGFzdCA9PT0gJy4nKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09ICcuLicpIHtcbiAgICAgIHNyY1BhdGguc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBzcmNQYXRoLnNwbGljZShpLCAxKTtcbiAgICAgIHVwLS07XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgdGhlIHBhdGggaXMgYWxsb3dlZCB0byBnbyBhYm92ZSB0aGUgcm9vdCwgcmVzdG9yZSBsZWFkaW5nIC4uc1xuICBpZiAoIW11c3RFbmRBYnMgJiYgIXJlbW92ZUFsbERvdHMpIHtcbiAgICBmb3IgKDsgdXAtLTsgdXApIHtcbiAgICAgIHNyY1BhdGgudW5zaGlmdCgnLi4nKTtcbiAgICB9XG4gIH1cblxuICBpZiAobXVzdEVuZEFicyAmJiBzcmNQYXRoWzBdICE9PSAnJyAmJlxuICAgICAgKCFzcmNQYXRoWzBdIHx8IHNyY1BhdGhbMF0uY2hhckF0KDApICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC51bnNoaWZ0KCcnKTtcbiAgfVxuXG4gIGlmIChoYXNUcmFpbGluZ1NsYXNoICYmIChzcmNQYXRoLmpvaW4oJy8nKS5zdWJzdHIoLTEpICE9PSAnLycpKSB7XG4gICAgc3JjUGF0aC5wdXNoKCcnKTtcbiAgfVxuXG4gIHZhciBpc0Fic29sdXRlID0gc3JjUGF0aFswXSA9PT0gJycgfHxcbiAgICAgIChzcmNQYXRoWzBdICYmIHNyY1BhdGhbMF0uY2hhckF0KDApID09PSAnLycpO1xuXG4gIC8vIHB1dCB0aGUgaG9zdCBiYWNrXG4gIGlmIChwc3ljaG90aWMpIHtcbiAgICByZXN1bHQuaG9zdG5hbWUgPSByZXN1bHQuaG9zdCA9IGlzQWJzb2x1dGUgPyAnJyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmNQYXRoLmxlbmd0aCA/IHNyY1BhdGguc2hpZnQoKSA6ICcnO1xuICAgIC8vb2NjYXRpb25hbHkgdGhlIGF1dGggY2FuIGdldCBzdHVjayBvbmx5IGluIGhvc3RcbiAgICAvL3RoaXMgZXNwZWNpYWxseSBoYXBwZW5zIGluIGNhc2VzIGxpa2VcbiAgICAvL3VybC5yZXNvbHZlT2JqZWN0KCdtYWlsdG86bG9jYWwxQGRvbWFpbjEnLCAnbG9jYWwyQGRvbWFpbjInKVxuICAgIHZhciBhdXRoSW5Ib3N0ID0gcmVzdWx0Lmhvc3QgJiYgcmVzdWx0Lmhvc3QuaW5kZXhPZignQCcpID4gMCA/XG4gICAgICAgICAgICAgICAgICAgICByZXN1bHQuaG9zdC5zcGxpdCgnQCcpIDogZmFsc2U7XG4gICAgaWYgKGF1dGhJbkhvc3QpIHtcbiAgICAgIHJlc3VsdC5hdXRoID0gYXV0aEluSG9zdC5zaGlmdCgpO1xuICAgICAgcmVzdWx0Lmhvc3QgPSByZXN1bHQuaG9zdG5hbWUgPSBhdXRoSW5Ib3N0LnNoaWZ0KCk7XG4gICAgfVxuICB9XG5cbiAgbXVzdEVuZEFicyA9IG11c3RFbmRBYnMgfHwgKHJlc3VsdC5ob3N0ICYmIHNyY1BhdGgubGVuZ3RoKTtcblxuICBpZiAobXVzdEVuZEFicyAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHNyY1BhdGgudW5zaGlmdCgnJyk7XG4gIH1cblxuICBpZiAoIXNyY1BhdGgubGVuZ3RoKSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gbnVsbDtcbiAgICByZXN1bHQucGF0aCA9IG51bGw7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0LnBhdGhuYW1lID0gc3JjUGF0aC5qb2luKCcvJyk7XG4gIH1cblxuICAvL3RvIHN1cHBvcnQgcmVxdWVzdC5odHRwXG4gIGlmICghdXRpbC5pc051bGwocmVzdWx0LnBhdGhuYW1lKSB8fCAhdXRpbC5pc051bGwocmVzdWx0LnNlYXJjaCkpIHtcbiAgICByZXN1bHQucGF0aCA9IChyZXN1bHQucGF0aG5hbWUgPyByZXN1bHQucGF0aG5hbWUgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgKHJlc3VsdC5zZWFyY2ggPyByZXN1bHQuc2VhcmNoIDogJycpO1xuICB9XG4gIHJlc3VsdC5hdXRoID0gcmVsYXRpdmUuYXV0aCB8fCByZXN1bHQuYXV0aDtcbiAgcmVzdWx0LnNsYXNoZXMgPSByZXN1bHQuc2xhc2hlcyB8fCByZWxhdGl2ZS5zbGFzaGVzO1xuICByZXN1bHQuaHJlZiA9IHJlc3VsdC5mb3JtYXQoKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBob3N0ID0gdGhpcy5ob3N0O1xuICB2YXIgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgdGhpcy5ob3N0bmFtZSA9IGhvc3Q7XG59O1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJykuQnVmZmVyO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJ3N0cmVhbScpLlRyYW5zZm9ybTtcbnZhciBiaW5kaW5nID0gcmVxdWlyZSgnLi9iaW5kaW5nJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBhc3NlcnQgPSByZXF1aXJlKCdhc3NlcnQnKS5vaztcbnZhciBrTWF4TGVuZ3RoID0gcmVxdWlyZSgnYnVmZmVyJykua01heExlbmd0aDtcbnZhciBrUmFuZ2VFcnJvck1lc3NhZ2UgPSAnQ2Fubm90IGNyZWF0ZSBmaW5hbCBCdWZmZXIuIEl0IHdvdWxkIGJlIGxhcmdlciAnICsgJ3RoYW4gMHgnICsga01heExlbmd0aC50b1N0cmluZygxNikgKyAnIGJ5dGVzJztcblxuLy8gemxpYiBkb2Vzbid0IHByb3ZpZGUgdGhlc2UsIHNvIGtsdWRnZSB0aGVtIGluIGZvbGxvd2luZyB0aGUgc2FtZVxuLy8gY29uc3QgbmFtaW5nIHNjaGVtZSB6bGliIHVzZXMuXG5iaW5kaW5nLlpfTUlOX1dJTkRPV0JJVFMgPSA4O1xuYmluZGluZy5aX01BWF9XSU5ET1dCSVRTID0gMTU7XG5iaW5kaW5nLlpfREVGQVVMVF9XSU5ET1dCSVRTID0gMTU7XG5cbi8vIGZld2VyIHRoYW4gNjQgYnl0ZXMgcGVyIGNodW5rIGlzIHN0dXBpZC5cbi8vIHRlY2huaWNhbGx5IGl0IGNvdWxkIHdvcmsgd2l0aCBhcyBmZXcgYXMgOCwgYnV0IGV2ZW4gNjQgYnl0ZXNcbi8vIGlzIGFic3VyZGx5IGxvdy4gIFVzdWFsbHkgYSBNQiBvciBtb3JlIGlzIGJlc3QuXG5iaW5kaW5nLlpfTUlOX0NIVU5LID0gNjQ7XG5iaW5kaW5nLlpfTUFYX0NIVU5LID0gSW5maW5pdHk7XG5iaW5kaW5nLlpfREVGQVVMVF9DSFVOSyA9IDE2ICogMTAyNDtcblxuYmluZGluZy5aX01JTl9NRU1MRVZFTCA9IDE7XG5iaW5kaW5nLlpfTUFYX01FTUxFVkVMID0gOTtcbmJpbmRpbmcuWl9ERUZBVUxUX01FTUxFVkVMID0gODtcblxuYmluZGluZy5aX01JTl9MRVZFTCA9IC0xO1xuYmluZGluZy5aX01BWF9MRVZFTCA9IDk7XG5iaW5kaW5nLlpfREVGQVVMVF9MRVZFTCA9IGJpbmRpbmcuWl9ERUZBVUxUX0NPTVBSRVNTSU9OO1xuXG4vLyBleHBvc2UgYWxsIHRoZSB6bGliIGNvbnN0YW50c1xudmFyIGJrZXlzID0gT2JqZWN0LmtleXMoYmluZGluZyk7XG5mb3IgKHZhciBiayA9IDA7IGJrIDwgYmtleXMubGVuZ3RoOyBiaysrKSB7XG4gIHZhciBia2V5ID0gYmtleXNbYmtdO1xuICBpZiAoYmtleS5tYXRjaCgvXlovKSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBia2V5LCB7XG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogYmluZGluZ1tia2V5XSwgd3JpdGFibGU6IGZhbHNlXG4gICAgfSk7XG4gIH1cbn1cblxuLy8gdHJhbnNsYXRpb24gdGFibGUgZm9yIHJldHVybiBjb2Rlcy5cbnZhciBjb2RlcyA9IHtcbiAgWl9PSzogYmluZGluZy5aX09LLFxuICBaX1NUUkVBTV9FTkQ6IGJpbmRpbmcuWl9TVFJFQU1fRU5ELFxuICBaX05FRURfRElDVDogYmluZGluZy5aX05FRURfRElDVCxcbiAgWl9FUlJOTzogYmluZGluZy5aX0VSUk5PLFxuICBaX1NUUkVBTV9FUlJPUjogYmluZGluZy5aX1NUUkVBTV9FUlJPUixcbiAgWl9EQVRBX0VSUk9SOiBiaW5kaW5nLlpfREFUQV9FUlJPUixcbiAgWl9NRU1fRVJST1I6IGJpbmRpbmcuWl9NRU1fRVJST1IsXG4gIFpfQlVGX0VSUk9SOiBiaW5kaW5nLlpfQlVGX0VSUk9SLFxuICBaX1ZFUlNJT05fRVJST1I6IGJpbmRpbmcuWl9WRVJTSU9OX0VSUk9SXG59O1xuXG52YXIgY2tleXMgPSBPYmplY3Qua2V5cyhjb2Rlcyk7XG5mb3IgKHZhciBjayA9IDA7IGNrIDwgY2tleXMubGVuZ3RoOyBjaysrKSB7XG4gIHZhciBja2V5ID0gY2tleXNbY2tdO1xuICBjb2Rlc1tjb2Rlc1tja2V5XV0gPSBja2V5O1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ2NvZGVzJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogT2JqZWN0LmZyZWV6ZShjb2RlcyksIHdyaXRhYmxlOiBmYWxzZVxufSk7XG5cbmV4cG9ydHMuRGVmbGF0ZSA9IERlZmxhdGU7XG5leHBvcnRzLkluZmxhdGUgPSBJbmZsYXRlO1xuZXhwb3J0cy5HemlwID0gR3ppcDtcbmV4cG9ydHMuR3VuemlwID0gR3VuemlwO1xuZXhwb3J0cy5EZWZsYXRlUmF3ID0gRGVmbGF0ZVJhdztcbmV4cG9ydHMuSW5mbGF0ZVJhdyA9IEluZmxhdGVSYXc7XG5leHBvcnRzLlVuemlwID0gVW56aXA7XG5cbmV4cG9ydHMuY3JlYXRlRGVmbGF0ZSA9IGZ1bmN0aW9uIChvKSB7XG4gIHJldHVybiBuZXcgRGVmbGF0ZShvKTtcbn07XG5cbmV4cG9ydHMuY3JlYXRlSW5mbGF0ZSA9IGZ1bmN0aW9uIChvKSB7XG4gIHJldHVybiBuZXcgSW5mbGF0ZShvKTtcbn07XG5cbmV4cG9ydHMuY3JlYXRlRGVmbGF0ZVJhdyA9IGZ1bmN0aW9uIChvKSB7XG4gIHJldHVybiBuZXcgRGVmbGF0ZVJhdyhvKTtcbn07XG5cbmV4cG9ydHMuY3JlYXRlSW5mbGF0ZVJhdyA9IGZ1bmN0aW9uIChvKSB7XG4gIHJldHVybiBuZXcgSW5mbGF0ZVJhdyhvKTtcbn07XG5cbmV4cG9ydHMuY3JlYXRlR3ppcCA9IGZ1bmN0aW9uIChvKSB7XG4gIHJldHVybiBuZXcgR3ppcChvKTtcbn07XG5cbmV4cG9ydHMuY3JlYXRlR3VuemlwID0gZnVuY3Rpb24gKG8pIHtcbiAgcmV0dXJuIG5ldyBHdW56aXAobyk7XG59O1xuXG5leHBvcnRzLmNyZWF0ZVVuemlwID0gZnVuY3Rpb24gKG8pIHtcbiAgcmV0dXJuIG5ldyBVbnppcChvKTtcbn07XG5cbi8vIENvbnZlbmllbmNlIG1ldGhvZHMuXG4vLyBjb21wcmVzcy9kZWNvbXByZXNzIGEgc3RyaW5nIG9yIGJ1ZmZlciBpbiBvbmUgc3RlcC5cbmV4cG9ydHMuZGVmbGF0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgcmV0dXJuIHpsaWJCdWZmZXIobmV3IERlZmxhdGUob3B0cyksIGJ1ZmZlciwgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy5kZWZsYXRlU3luYyA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMpIHtcbiAgcmV0dXJuIHpsaWJCdWZmZXJTeW5jKG5ldyBEZWZsYXRlKG9wdHMpLCBidWZmZXIpO1xufTtcblxuZXhwb3J0cy5nemlwID0gZnVuY3Rpb24gKGJ1ZmZlciwgb3B0cywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRzO1xuICAgIG9wdHMgPSB7fTtcbiAgfVxuICByZXR1cm4gemxpYkJ1ZmZlcihuZXcgR3ppcChvcHRzKSwgYnVmZmVyLCBjYWxsYmFjayk7XG59O1xuXG5leHBvcnRzLmd6aXBTeW5jID0gZnVuY3Rpb24gKGJ1ZmZlciwgb3B0cykge1xuICByZXR1cm4gemxpYkJ1ZmZlclN5bmMobmV3IEd6aXAob3B0cyksIGJ1ZmZlcik7XG59O1xuXG5leHBvcnRzLmRlZmxhdGVSYXcgPSBmdW5jdGlvbiAoYnVmZmVyLCBvcHRzLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgb3B0cyA9IHt9O1xuICB9XG4gIHJldHVybiB6bGliQnVmZmVyKG5ldyBEZWZsYXRlUmF3KG9wdHMpLCBidWZmZXIsIGNhbGxiYWNrKTtcbn07XG5cbmV4cG9ydHMuZGVmbGF0ZVJhd1N5bmMgPSBmdW5jdGlvbiAoYnVmZmVyLCBvcHRzKSB7XG4gIHJldHVybiB6bGliQnVmZmVyU3luYyhuZXcgRGVmbGF0ZVJhdyhvcHRzKSwgYnVmZmVyKTtcbn07XG5cbmV4cG9ydHMudW56aXAgPSBmdW5jdGlvbiAoYnVmZmVyLCBvcHRzLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgb3B0cyA9IHt9O1xuICB9XG4gIHJldHVybiB6bGliQnVmZmVyKG5ldyBVbnppcChvcHRzKSwgYnVmZmVyLCBjYWxsYmFjayk7XG59O1xuXG5leHBvcnRzLnVuemlwU3luYyA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMpIHtcbiAgcmV0dXJuIHpsaWJCdWZmZXJTeW5jKG5ldyBVbnppcChvcHRzKSwgYnVmZmVyKTtcbn07XG5cbmV4cG9ydHMuaW5mbGF0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgcmV0dXJuIHpsaWJCdWZmZXIobmV3IEluZmxhdGUob3B0cyksIGJ1ZmZlciwgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy5pbmZsYXRlU3luYyA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMpIHtcbiAgcmV0dXJuIHpsaWJCdWZmZXJTeW5jKG5ldyBJbmZsYXRlKG9wdHMpLCBidWZmZXIpO1xufTtcblxuZXhwb3J0cy5ndW56aXAgPSBmdW5jdGlvbiAoYnVmZmVyLCBvcHRzLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG9wdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdHM7XG4gICAgb3B0cyA9IHt9O1xuICB9XG4gIHJldHVybiB6bGliQnVmZmVyKG5ldyBHdW56aXAob3B0cyksIGJ1ZmZlciwgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy5ndW56aXBTeW5jID0gZnVuY3Rpb24gKGJ1ZmZlciwgb3B0cykge1xuICByZXR1cm4gemxpYkJ1ZmZlclN5bmMobmV3IEd1bnppcChvcHRzKSwgYnVmZmVyKTtcbn07XG5cbmV4cG9ydHMuaW5mbGF0ZVJhdyA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0cztcbiAgICBvcHRzID0ge307XG4gIH1cbiAgcmV0dXJuIHpsaWJCdWZmZXIobmV3IEluZmxhdGVSYXcob3B0cyksIGJ1ZmZlciwgY2FsbGJhY2spO1xufTtcblxuZXhwb3J0cy5pbmZsYXRlUmF3U3luYyA9IGZ1bmN0aW9uIChidWZmZXIsIG9wdHMpIHtcbiAgcmV0dXJuIHpsaWJCdWZmZXJTeW5jKG5ldyBJbmZsYXRlUmF3KG9wdHMpLCBidWZmZXIpO1xufTtcblxuZnVuY3Rpb24gemxpYkJ1ZmZlcihlbmdpbmUsIGJ1ZmZlciwgY2FsbGJhY2spIHtcbiAgdmFyIGJ1ZmZlcnMgPSBbXTtcbiAgdmFyIG5yZWFkID0gMDtcblxuICBlbmdpbmUub24oJ2Vycm9yJywgb25FcnJvcik7XG4gIGVuZ2luZS5vbignZW5kJywgb25FbmQpO1xuXG4gIGVuZ2luZS5lbmQoYnVmZmVyKTtcbiAgZmxvdygpO1xuXG4gIGZ1bmN0aW9uIGZsb3coKSB7XG4gICAgdmFyIGNodW5rO1xuICAgIHdoaWxlIChudWxsICE9PSAoY2h1bmsgPSBlbmdpbmUucmVhZCgpKSkge1xuICAgICAgYnVmZmVycy5wdXNoKGNodW5rKTtcbiAgICAgIG5yZWFkICs9IGNodW5rLmxlbmd0aDtcbiAgICB9XG4gICAgZW5naW5lLm9uY2UoJ3JlYWRhYmxlJywgZmxvdyk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkVycm9yKGVycikge1xuICAgIGVuZ2luZS5yZW1vdmVMaXN0ZW5lcignZW5kJywgb25FbmQpO1xuICAgIGVuZ2luZS5yZW1vdmVMaXN0ZW5lcigncmVhZGFibGUnLCBmbG93KTtcbiAgICBjYWxsYmFjayhlcnIpO1xuICB9XG5cbiAgZnVuY3Rpb24gb25FbmQoKSB7XG4gICAgdmFyIGJ1ZjtcbiAgICB2YXIgZXJyID0gbnVsbDtcblxuICAgIGlmIChucmVhZCA+PSBrTWF4TGVuZ3RoKSB7XG4gICAgICBlcnIgPSBuZXcgUmFuZ2VFcnJvcihrUmFuZ2VFcnJvck1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBidWYgPSBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMsIG5yZWFkKTtcbiAgICB9XG5cbiAgICBidWZmZXJzID0gW107XG4gICAgZW5naW5lLmNsb3NlKCk7XG4gICAgY2FsbGJhY2soZXJyLCBidWYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHpsaWJCdWZmZXJTeW5jKGVuZ2luZSwgYnVmZmVyKSB7XG4gIGlmICh0eXBlb2YgYnVmZmVyID09PSAnc3RyaW5nJykgYnVmZmVyID0gQnVmZmVyLmZyb20oYnVmZmVyKTtcblxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWZmZXIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdOb3QgYSBzdHJpbmcgb3IgYnVmZmVyJyk7XG5cbiAgdmFyIGZsdXNoRmxhZyA9IGVuZ2luZS5fZmluaXNoRmx1c2hGbGFnO1xuXG4gIHJldHVybiBlbmdpbmUuX3Byb2Nlc3NDaHVuayhidWZmZXIsIGZsdXNoRmxhZyk7XG59XG5cbi8vIGdlbmVyaWMgemxpYlxuLy8gbWluaW1hbCAyLWJ5dGUgaGVhZGVyXG5mdW5jdGlvbiBEZWZsYXRlKG9wdHMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIERlZmxhdGUpKSByZXR1cm4gbmV3IERlZmxhdGUob3B0cyk7XG4gIFpsaWIuY2FsbCh0aGlzLCBvcHRzLCBiaW5kaW5nLkRFRkxBVEUpO1xufVxuXG5mdW5jdGlvbiBJbmZsYXRlKG9wdHMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEluZmxhdGUpKSByZXR1cm4gbmV3IEluZmxhdGUob3B0cyk7XG4gIFpsaWIuY2FsbCh0aGlzLCBvcHRzLCBiaW5kaW5nLklORkxBVEUpO1xufVxuXG4vLyBnemlwIC0gYmlnZ2VyIGhlYWRlciwgc2FtZSBkZWZsYXRlIGNvbXByZXNzaW9uXG5mdW5jdGlvbiBHemlwKG9wdHMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEd6aXApKSByZXR1cm4gbmV3IEd6aXAob3B0cyk7XG4gIFpsaWIuY2FsbCh0aGlzLCBvcHRzLCBiaW5kaW5nLkdaSVApO1xufVxuXG5mdW5jdGlvbiBHdW56aXAob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgR3VuemlwKSkgcmV0dXJuIG5ldyBHdW56aXAob3B0cyk7XG4gIFpsaWIuY2FsbCh0aGlzLCBvcHRzLCBiaW5kaW5nLkdVTlpJUCk7XG59XG5cbi8vIHJhdyAtIG5vIGhlYWRlclxuZnVuY3Rpb24gRGVmbGF0ZVJhdyhvcHRzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBEZWZsYXRlUmF3KSkgcmV0dXJuIG5ldyBEZWZsYXRlUmF3KG9wdHMpO1xuICBabGliLmNhbGwodGhpcywgb3B0cywgYmluZGluZy5ERUZMQVRFUkFXKTtcbn1cblxuZnVuY3Rpb24gSW5mbGF0ZVJhdyhvcHRzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBJbmZsYXRlUmF3KSkgcmV0dXJuIG5ldyBJbmZsYXRlUmF3KG9wdHMpO1xuICBabGliLmNhbGwodGhpcywgb3B0cywgYmluZGluZy5JTkZMQVRFUkFXKTtcbn1cblxuLy8gYXV0by1kZXRlY3QgaGVhZGVyLlxuZnVuY3Rpb24gVW56aXAob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVW56aXApKSByZXR1cm4gbmV3IFVuemlwKG9wdHMpO1xuICBabGliLmNhbGwodGhpcywgb3B0cywgYmluZGluZy5VTlpJUCk7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRGbHVzaEZsYWcoZmxhZykge1xuICByZXR1cm4gZmxhZyA9PT0gYmluZGluZy5aX05PX0ZMVVNIIHx8IGZsYWcgPT09IGJpbmRpbmcuWl9QQVJUSUFMX0ZMVVNIIHx8IGZsYWcgPT09IGJpbmRpbmcuWl9TWU5DX0ZMVVNIIHx8IGZsYWcgPT09IGJpbmRpbmcuWl9GVUxMX0ZMVVNIIHx8IGZsYWcgPT09IGJpbmRpbmcuWl9GSU5JU0ggfHwgZmxhZyA9PT0gYmluZGluZy5aX0JMT0NLO1xufVxuXG4vLyB0aGUgWmxpYiBjbGFzcyB0aGV5IGFsbCBpbmhlcml0IGZyb21cbi8vIFRoaXMgdGhpbmcgbWFuYWdlcyB0aGUgcXVldWUgb2YgcmVxdWVzdHMsIGFuZCByZXR1cm5zXG4vLyB0cnVlIG9yIGZhbHNlIGlmIHRoZXJlIGlzIGFueXRoaW5nIGluIHRoZSBxdWV1ZSB3aGVuXG4vLyB5b3UgY2FsbCB0aGUgLndyaXRlKCkgbWV0aG9kLlxuXG5mdW5jdGlvbiBabGliKG9wdHMsIG1vZGUpIHtcbiAgdmFyIF90aGlzID0gdGhpcztcblxuICB0aGlzLl9vcHRzID0gb3B0cyA9IG9wdHMgfHwge307XG4gIHRoaXMuX2NodW5rU2l6ZSA9IG9wdHMuY2h1bmtTaXplIHx8IGV4cG9ydHMuWl9ERUZBVUxUX0NIVU5LO1xuXG4gIFRyYW5zZm9ybS5jYWxsKHRoaXMsIG9wdHMpO1xuXG4gIGlmIChvcHRzLmZsdXNoICYmICFpc1ZhbGlkRmx1c2hGbGFnKG9wdHMuZmx1c2gpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGZsdXNoIGZsYWc6ICcgKyBvcHRzLmZsdXNoKTtcbiAgfVxuICBpZiAob3B0cy5maW5pc2hGbHVzaCAmJiAhaXNWYWxpZEZsdXNoRmxhZyhvcHRzLmZpbmlzaEZsdXNoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBmbHVzaCBmbGFnOiAnICsgb3B0cy5maW5pc2hGbHVzaCk7XG4gIH1cblxuICB0aGlzLl9mbHVzaEZsYWcgPSBvcHRzLmZsdXNoIHx8IGJpbmRpbmcuWl9OT19GTFVTSDtcbiAgdGhpcy5fZmluaXNoRmx1c2hGbGFnID0gdHlwZW9mIG9wdHMuZmluaXNoRmx1c2ggIT09ICd1bmRlZmluZWQnID8gb3B0cy5maW5pc2hGbHVzaCA6IGJpbmRpbmcuWl9GSU5JU0g7XG5cbiAgaWYgKG9wdHMuY2h1bmtTaXplKSB7XG4gICAgaWYgKG9wdHMuY2h1bmtTaXplIDwgZXhwb3J0cy5aX01JTl9DSFVOSyB8fCBvcHRzLmNodW5rU2l6ZSA+IGV4cG9ydHMuWl9NQVhfQ0hVTkspIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaHVuayBzaXplOiAnICsgb3B0cy5jaHVua1NpemUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRzLndpbmRvd0JpdHMpIHtcbiAgICBpZiAob3B0cy53aW5kb3dCaXRzIDwgZXhwb3J0cy5aX01JTl9XSU5ET1dCSVRTIHx8IG9wdHMud2luZG93Qml0cyA+IGV4cG9ydHMuWl9NQVhfV0lORE9XQklUUykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHdpbmRvd0JpdHM6ICcgKyBvcHRzLndpbmRvd0JpdHMpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChvcHRzLmxldmVsKSB7XG4gICAgaWYgKG9wdHMubGV2ZWwgPCBleHBvcnRzLlpfTUlOX0xFVkVMIHx8IG9wdHMubGV2ZWwgPiBleHBvcnRzLlpfTUFYX0xFVkVMKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tcHJlc3Npb24gbGV2ZWw6ICcgKyBvcHRzLmxldmVsKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0cy5tZW1MZXZlbCkge1xuICAgIGlmIChvcHRzLm1lbUxldmVsIDwgZXhwb3J0cy5aX01JTl9NRU1MRVZFTCB8fCBvcHRzLm1lbUxldmVsID4gZXhwb3J0cy5aX01BWF9NRU1MRVZFTCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG1lbUxldmVsOiAnICsgb3B0cy5tZW1MZXZlbCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKG9wdHMuc3RyYXRlZ3kpIHtcbiAgICBpZiAob3B0cy5zdHJhdGVneSAhPSBleHBvcnRzLlpfRklMVEVSRUQgJiYgb3B0cy5zdHJhdGVneSAhPSBleHBvcnRzLlpfSFVGRk1BTl9PTkxZICYmIG9wdHMuc3RyYXRlZ3kgIT0gZXhwb3J0cy5aX1JMRSAmJiBvcHRzLnN0cmF0ZWd5ICE9IGV4cG9ydHMuWl9GSVhFRCAmJiBvcHRzLnN0cmF0ZWd5ICE9IGV4cG9ydHMuWl9ERUZBVUxUX1NUUkFURUdZKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyYXRlZ3k6ICcgKyBvcHRzLnN0cmF0ZWd5KTtcbiAgICB9XG4gIH1cblxuICBpZiAob3B0cy5kaWN0aW9uYXJ5KSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIob3B0cy5kaWN0aW9uYXJ5KSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGRpY3Rpb25hcnk6IGl0IHNob3VsZCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuX2hhbmRsZSA9IG5ldyBiaW5kaW5nLlpsaWIobW9kZSk7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLl9oYWRFcnJvciA9IGZhbHNlO1xuICB0aGlzLl9oYW5kbGUub25lcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCBlcnJubykge1xuICAgIC8vIHRoZXJlIGlzIG5vIHdheSB0byBjbGVhbmx5IHJlY292ZXIuXG4gICAgLy8gY29udGludWluZyBvbmx5IG9ic2N1cmVzIHByb2JsZW1zLlxuICAgIF9jbG9zZShzZWxmKTtcbiAgICBzZWxmLl9oYWRFcnJvciA9IHRydWU7XG5cbiAgICB2YXIgZXJyb3IgPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgZXJyb3IuZXJybm8gPSBlcnJubztcbiAgICBlcnJvci5jb2RlID0gZXhwb3J0cy5jb2Rlc1tlcnJub107XG4gICAgc2VsZi5lbWl0KCdlcnJvcicsIGVycm9yKTtcbiAgfTtcblxuICB2YXIgbGV2ZWwgPSBleHBvcnRzLlpfREVGQVVMVF9DT01QUkVTU0lPTjtcbiAgaWYgKHR5cGVvZiBvcHRzLmxldmVsID09PSAnbnVtYmVyJykgbGV2ZWwgPSBvcHRzLmxldmVsO1xuXG4gIHZhciBzdHJhdGVneSA9IGV4cG9ydHMuWl9ERUZBVUxUX1NUUkFURUdZO1xuICBpZiAodHlwZW9mIG9wdHMuc3RyYXRlZ3kgPT09ICdudW1iZXInKSBzdHJhdGVneSA9IG9wdHMuc3RyYXRlZ3k7XG5cbiAgdGhpcy5faGFuZGxlLmluaXQob3B0cy53aW5kb3dCaXRzIHx8IGV4cG9ydHMuWl9ERUZBVUxUX1dJTkRPV0JJVFMsIGxldmVsLCBvcHRzLm1lbUxldmVsIHx8IGV4cG9ydHMuWl9ERUZBVUxUX01FTUxFVkVMLCBzdHJhdGVneSwgb3B0cy5kaWN0aW9uYXJ5KTtcblxuICB0aGlzLl9idWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUodGhpcy5fY2h1bmtTaXplKTtcbiAgdGhpcy5fb2Zmc2V0ID0gMDtcbiAgdGhpcy5fbGV2ZWwgPSBsZXZlbDtcbiAgdGhpcy5fc3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICB0aGlzLm9uY2UoJ2VuZCcsIHRoaXMuY2xvc2UpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnX2Nsb3NlZCcsIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAhX3RoaXMuX2hhbmRsZTtcbiAgICB9LFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiB0cnVlXG4gIH0pO1xufVxuXG51dGlsLmluaGVyaXRzKFpsaWIsIFRyYW5zZm9ybSk7XG5cblpsaWIucHJvdG90eXBlLnBhcmFtcyA9IGZ1bmN0aW9uIChsZXZlbCwgc3RyYXRlZ3ksIGNhbGxiYWNrKSB7XG4gIGlmIChsZXZlbCA8IGV4cG9ydHMuWl9NSU5fTEVWRUwgfHwgbGV2ZWwgPiBleHBvcnRzLlpfTUFYX0xFVkVMKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgY29tcHJlc3Npb24gbGV2ZWw6ICcgKyBsZXZlbCk7XG4gIH1cbiAgaWYgKHN0cmF0ZWd5ICE9IGV4cG9ydHMuWl9GSUxURVJFRCAmJiBzdHJhdGVneSAhPSBleHBvcnRzLlpfSFVGRk1BTl9PTkxZICYmIHN0cmF0ZWd5ICE9IGV4cG9ydHMuWl9STEUgJiYgc3RyYXRlZ3kgIT0gZXhwb3J0cy5aX0ZJWEVEICYmIHN0cmF0ZWd5ICE9IGV4cG9ydHMuWl9ERUZBVUxUX1NUUkFURUdZKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBzdHJhdGVneTogJyArIHN0cmF0ZWd5KTtcbiAgfVxuXG4gIGlmICh0aGlzLl9sZXZlbCAhPT0gbGV2ZWwgfHwgdGhpcy5fc3RyYXRlZ3kgIT09IHN0cmF0ZWd5KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZmx1c2goYmluZGluZy5aX1NZTkNfRkxVU0gsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGFzc2VydChzZWxmLl9oYW5kbGUsICd6bGliIGJpbmRpbmcgY2xvc2VkJyk7XG4gICAgICBzZWxmLl9oYW5kbGUucGFyYW1zKGxldmVsLCBzdHJhdGVneSk7XG4gICAgICBpZiAoIXNlbGYuX2hhZEVycm9yKSB7XG4gICAgICAgIHNlbGYuX2xldmVsID0gbGV2ZWw7XG4gICAgICAgIHNlbGYuX3N0cmF0ZWd5ID0gc3RyYXRlZ3k7XG4gICAgICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBwcm9jZXNzLm5leHRUaWNrKGNhbGxiYWNrKTtcbiAgfVxufTtcblxuWmxpYi5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gIGFzc2VydCh0aGlzLl9oYW5kbGUsICd6bGliIGJpbmRpbmcgY2xvc2VkJyk7XG4gIHJldHVybiB0aGlzLl9oYW5kbGUucmVzZXQoKTtcbn07XG5cbi8vIFRoaXMgaXMgdGhlIF9mbHVzaCBmdW5jdGlvbiBjYWxsZWQgYnkgdGhlIHRyYW5zZm9ybSBjbGFzcyxcbi8vIGludGVybmFsbHksIHdoZW4gdGhlIGxhc3QgY2h1bmsgaGFzIGJlZW4gd3JpdHRlbi5cblpsaWIucHJvdG90eXBlLl9mbHVzaCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICB0aGlzLl90cmFuc2Zvcm0oQnVmZmVyLmFsbG9jKDApLCAnJywgY2FsbGJhY2spO1xufTtcblxuWmxpYi5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAoa2luZCwgY2FsbGJhY2spIHtcbiAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgdmFyIHdzID0gdGhpcy5fd3JpdGFibGVTdGF0ZTtcblxuICBpZiAodHlwZW9mIGtpbmQgPT09ICdmdW5jdGlvbicgfHwga2luZCA9PT0gdW5kZWZpbmVkICYmICFjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0ga2luZDtcbiAgICBraW5kID0gYmluZGluZy5aX0ZVTExfRkxVU0g7XG4gIH1cblxuICBpZiAod3MuZW5kZWQpIHtcbiAgICBpZiAoY2FsbGJhY2spIHByb2Nlc3MubmV4dFRpY2soY2FsbGJhY2spO1xuICB9IGVsc2UgaWYgKHdzLmVuZGluZykge1xuICAgIGlmIChjYWxsYmFjaykgdGhpcy5vbmNlKCdlbmQnLCBjYWxsYmFjayk7XG4gIH0gZWxzZSBpZiAod3MubmVlZERyYWluKSB7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICB0aGlzLm9uY2UoJ2RyYWluJywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gX3RoaXMyLmZsdXNoKGtpbmQsIGNhbGxiYWNrKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9mbHVzaEZsYWcgPSBraW5kO1xuICAgIHRoaXMud3JpdGUoQnVmZmVyLmFsbG9jKDApLCAnJywgY2FsbGJhY2spO1xuICB9XG59O1xuXG5abGliLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICBfY2xvc2UodGhpcywgY2FsbGJhY2spO1xuICBwcm9jZXNzLm5leHRUaWNrKGVtaXRDbG9zZU5ULCB0aGlzKTtcbn07XG5cbmZ1bmN0aW9uIF9jbG9zZShlbmdpbmUsIGNhbGxiYWNrKSB7XG4gIGlmIChjYWxsYmFjaykgcHJvY2Vzcy5uZXh0VGljayhjYWxsYmFjayk7XG5cbiAgLy8gQ2FsbGVyIG1heSBpbnZva2UgLmNsb3NlIGFmdGVyIGEgemxpYiBlcnJvciAod2hpY2ggd2lsbCBudWxsIF9oYW5kbGUpLlxuICBpZiAoIWVuZ2luZS5faGFuZGxlKSByZXR1cm47XG5cbiAgZW5naW5lLl9oYW5kbGUuY2xvc2UoKTtcbiAgZW5naW5lLl9oYW5kbGUgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBlbWl0Q2xvc2VOVChzZWxmKSB7XG4gIHNlbGYuZW1pdCgnY2xvc2UnKTtcbn1cblxuWmxpYi5wcm90b3R5cGUuX3RyYW5zZm9ybSA9IGZ1bmN0aW9uIChjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG4gIHZhciBmbHVzaEZsYWc7XG4gIHZhciB3cyA9IHRoaXMuX3dyaXRhYmxlU3RhdGU7XG4gIHZhciBlbmRpbmcgPSB3cy5lbmRpbmcgfHwgd3MuZW5kZWQ7XG4gIHZhciBsYXN0ID0gZW5kaW5nICYmICghY2h1bmsgfHwgd3MubGVuZ3RoID09PSBjaHVuay5sZW5ndGgpO1xuXG4gIGlmIChjaHVuayAhPT0gbnVsbCAmJiAhQnVmZmVyLmlzQnVmZmVyKGNodW5rKSkgcmV0dXJuIGNiKG5ldyBFcnJvcignaW52YWxpZCBpbnB1dCcpKTtcblxuICBpZiAoIXRoaXMuX2hhbmRsZSkgcmV0dXJuIGNiKG5ldyBFcnJvcignemxpYiBiaW5kaW5nIGNsb3NlZCcpKTtcblxuICAvLyBJZiBpdCdzIHRoZSBsYXN0IGNodW5rLCBvciBhIGZpbmFsIGZsdXNoLCB3ZSB1c2UgdGhlIFpfRklOSVNIIGZsdXNoIGZsYWdcbiAgLy8gKG9yIHdoYXRldmVyIGZsYWcgd2FzIHByb3ZpZGVkIHVzaW5nIG9wdHMuZmluaXNoRmx1c2gpLlxuICAvLyBJZiBpdCdzIGV4cGxpY2l0bHkgZmx1c2hpbmcgYXQgc29tZSBvdGhlciB0aW1lLCB0aGVuIHdlIHVzZVxuICAvLyBaX0ZVTExfRkxVU0guIE90aGVyd2lzZSwgdXNlIFpfTk9fRkxVU0ggZm9yIG1heGltdW0gY29tcHJlc3Npb25cbiAgLy8gZ29vZG5lc3MuXG4gIGlmIChsYXN0KSBmbHVzaEZsYWcgPSB0aGlzLl9maW5pc2hGbHVzaEZsYWc7ZWxzZSB7XG4gICAgZmx1c2hGbGFnID0gdGhpcy5fZmx1c2hGbGFnO1xuICAgIC8vIG9uY2Ugd2UndmUgZmx1c2hlZCB0aGUgbGFzdCBvZiB0aGUgcXVldWUsIHN0b3AgZmx1c2hpbmcgYW5kXG4gICAgLy8gZ28gYmFjayB0byB0aGUgbm9ybWFsIGJlaGF2aW9yLlxuICAgIGlmIChjaHVuay5sZW5ndGggPj0gd3MubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9mbHVzaEZsYWcgPSB0aGlzLl9vcHRzLmZsdXNoIHx8IGJpbmRpbmcuWl9OT19GTFVTSDtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9wcm9jZXNzQ2h1bmsoY2h1bmssIGZsdXNoRmxhZywgY2IpO1xufTtcblxuWmxpYi5wcm90b3R5cGUuX3Byb2Nlc3NDaHVuayA9IGZ1bmN0aW9uIChjaHVuaywgZmx1c2hGbGFnLCBjYikge1xuICB2YXIgYXZhaWxJbkJlZm9yZSA9IGNodW5rICYmIGNodW5rLmxlbmd0aDtcbiAgdmFyIGF2YWlsT3V0QmVmb3JlID0gdGhpcy5fY2h1bmtTaXplIC0gdGhpcy5fb2Zmc2V0O1xuICB2YXIgaW5PZmYgPSAwO1xuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICB2YXIgYXN5bmMgPSB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbic7XG5cbiAgaWYgKCFhc3luYykge1xuICAgIHZhciBidWZmZXJzID0gW107XG4gICAgdmFyIG5yZWFkID0gMDtcblxuICAgIHZhciBlcnJvcjtcbiAgICB0aGlzLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcikge1xuICAgICAgZXJyb3IgPSBlcjtcbiAgICB9KTtcblxuICAgIGFzc2VydCh0aGlzLl9oYW5kbGUsICd6bGliIGJpbmRpbmcgY2xvc2VkJyk7XG4gICAgZG8ge1xuICAgICAgdmFyIHJlcyA9IHRoaXMuX2hhbmRsZS53cml0ZVN5bmMoZmx1c2hGbGFnLCBjaHVuaywgLy8gaW5cbiAgICAgIGluT2ZmLCAvLyBpbl9vZmZcbiAgICAgIGF2YWlsSW5CZWZvcmUsIC8vIGluX2xlblxuICAgICAgdGhpcy5fYnVmZmVyLCAvLyBvdXRcbiAgICAgIHRoaXMuX29mZnNldCwgLy9vdXRfb2ZmXG4gICAgICBhdmFpbE91dEJlZm9yZSk7IC8vIG91dF9sZW5cbiAgICB9IHdoaWxlICghdGhpcy5faGFkRXJyb3IgJiYgY2FsbGJhY2socmVzWzBdLCByZXNbMV0pKTtcblxuICAgIGlmICh0aGlzLl9oYWRFcnJvcikge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuXG4gICAgaWYgKG5yZWFkID49IGtNYXhMZW5ndGgpIHtcbiAgICAgIF9jbG9zZSh0aGlzKTtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKGtSYW5nZUVycm9yTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgdmFyIGJ1ZiA9IEJ1ZmZlci5jb25jYXQoYnVmZmVycywgbnJlYWQpO1xuICAgIF9jbG9zZSh0aGlzKTtcblxuICAgIHJldHVybiBidWY7XG4gIH1cblxuICBhc3NlcnQodGhpcy5faGFuZGxlLCAnemxpYiBiaW5kaW5nIGNsb3NlZCcpO1xuICB2YXIgcmVxID0gdGhpcy5faGFuZGxlLndyaXRlKGZsdXNoRmxhZywgY2h1bmssIC8vIGluXG4gIGluT2ZmLCAvLyBpbl9vZmZcbiAgYXZhaWxJbkJlZm9yZSwgLy8gaW5fbGVuXG4gIHRoaXMuX2J1ZmZlciwgLy8gb3V0XG4gIHRoaXMuX29mZnNldCwgLy9vdXRfb2ZmXG4gIGF2YWlsT3V0QmVmb3JlKTsgLy8gb3V0X2xlblxuXG4gIHJlcS5idWZmZXIgPSBjaHVuaztcbiAgcmVxLmNhbGxiYWNrID0gY2FsbGJhY2s7XG5cbiAgZnVuY3Rpb24gY2FsbGJhY2soYXZhaWxJbkFmdGVyLCBhdmFpbE91dEFmdGVyKSB7XG4gICAgLy8gV2hlbiB0aGUgY2FsbGJhY2sgaXMgdXNlZCBpbiBhbiBhc3luYyB3cml0ZSwgdGhlIGNhbGxiYWNrJ3NcbiAgICAvLyBjb250ZXh0IGlzIHRoZSBgcmVxYCBvYmplY3QgdGhhdCB3YXMgY3JlYXRlZC4gVGhlIHJlcSBvYmplY3RcbiAgICAvLyBpcyA9PT0gdGhpcy5faGFuZGxlLCBhbmQgdGhhdCdzIHdoeSBpdCdzIGltcG9ydGFudCB0byBudWxsXG4gICAgLy8gb3V0IHRoZSB2YWx1ZXMgYWZ0ZXIgdGhleSBhcmUgZG9uZSBiZWluZyB1c2VkLiBgdGhpcy5faGFuZGxlYFxuICAgIC8vIGNhbiBzdGF5IGluIG1lbW9yeSBsb25nZXIgdGhhbiB0aGUgY2FsbGJhY2sgYW5kIGJ1ZmZlciBhcmUgbmVlZGVkLlxuICAgIGlmICh0aGlzKSB7XG4gICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5faGFkRXJyb3IpIHJldHVybjtcblxuICAgIHZhciBoYXZlID0gYXZhaWxPdXRCZWZvcmUgLSBhdmFpbE91dEFmdGVyO1xuICAgIGFzc2VydChoYXZlID49IDAsICdoYXZlIHNob3VsZCBub3QgZ28gZG93bicpO1xuXG4gICAgaWYgKGhhdmUgPiAwKSB7XG4gICAgICB2YXIgb3V0ID0gc2VsZi5fYnVmZmVyLnNsaWNlKHNlbGYuX29mZnNldCwgc2VsZi5fb2Zmc2V0ICsgaGF2ZSk7XG4gICAgICBzZWxmLl9vZmZzZXQgKz0gaGF2ZTtcbiAgICAgIC8vIHNlcnZlIHNvbWUgb3V0cHV0IHRvIHRoZSBjb25zdW1lci5cbiAgICAgIGlmIChhc3luYykge1xuICAgICAgICBzZWxmLnB1c2gob3V0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJ1ZmZlcnMucHVzaChvdXQpO1xuICAgICAgICBucmVhZCArPSBvdXQubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGV4aGF1c3RlZCB0aGUgb3V0cHV0IGJ1ZmZlciwgb3IgdXNlZCBhbGwgdGhlIGlucHV0IGNyZWF0ZSBhIG5ldyBvbmUuXG4gICAgaWYgKGF2YWlsT3V0QWZ0ZXIgPT09IDAgfHwgc2VsZi5fb2Zmc2V0ID49IHNlbGYuX2NodW5rU2l6ZSkge1xuICAgICAgYXZhaWxPdXRCZWZvcmUgPSBzZWxmLl9jaHVua1NpemU7XG4gICAgICBzZWxmLl9vZmZzZXQgPSAwO1xuICAgICAgc2VsZi5fYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKHNlbGYuX2NodW5rU2l6ZSk7XG4gICAgfVxuXG4gICAgaWYgKGF2YWlsT3V0QWZ0ZXIgPT09IDApIHtcbiAgICAgIC8vIE5vdCBhY3R1YWxseSBkb25lLiAgTmVlZCB0byByZXByb2Nlc3MuXG4gICAgICAvLyBBbHNvLCB1cGRhdGUgdGhlIGF2YWlsSW5CZWZvcmUgdG8gdGhlIGF2YWlsSW5BZnRlciB2YWx1ZSxcbiAgICAgIC8vIHNvIHRoYXQgaWYgd2UgaGF2ZSB0byBoaXQgaXQgYSB0aGlyZCAoZm91cnRoLCBldGMuKSB0aW1lLFxuICAgICAgLy8gaXQnbGwgaGF2ZSB0aGUgY29ycmVjdCBieXRlIGNvdW50cy5cbiAgICAgIGluT2ZmICs9IGF2YWlsSW5CZWZvcmUgLSBhdmFpbEluQWZ0ZXI7XG4gICAgICBhdmFpbEluQmVmb3JlID0gYXZhaWxJbkFmdGVyO1xuXG4gICAgICBpZiAoIWFzeW5jKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgdmFyIG5ld1JlcSA9IHNlbGYuX2hhbmRsZS53cml0ZShmbHVzaEZsYWcsIGNodW5rLCBpbk9mZiwgYXZhaWxJbkJlZm9yZSwgc2VsZi5fYnVmZmVyLCBzZWxmLl9vZmZzZXQsIHNlbGYuX2NodW5rU2l6ZSk7XG4gICAgICBuZXdSZXEuY2FsbGJhY2sgPSBjYWxsYmFjazsgLy8gdGhpcyBzYW1lIGZ1bmN0aW9uXG4gICAgICBuZXdSZXEuYnVmZmVyID0gY2h1bms7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFhc3luYykgcmV0dXJuIGZhbHNlO1xuXG4gICAgLy8gZmluaXNoZWQgd2l0aCB0aGUgY2h1bmsuXG4gICAgY2IoKTtcbiAgfVxufTtcblxudXRpbC5pbmhlcml0cyhEZWZsYXRlLCBabGliKTtcbnV0aWwuaW5oZXJpdHMoSW5mbGF0ZSwgWmxpYik7XG51dGlsLmluaGVyaXRzKEd6aXAsIFpsaWIpO1xudXRpbC5pbmhlcml0cyhHdW56aXAsIFpsaWIpO1xudXRpbC5pbmhlcml0cyhEZWZsYXRlUmF3LCBabGliKTtcbnV0aWwuaW5oZXJpdHMoSW5mbGF0ZVJhdywgWmxpYik7XG51dGlsLmluaGVyaXRzKFVuemlwLCBabGliKTsiXX0=
