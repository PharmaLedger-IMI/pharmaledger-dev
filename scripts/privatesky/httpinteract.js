httpinteractRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/opt/privatesky/builds/tmp/httpinteract_intermediar.js":[function(require,module,exports){
(function (global){
global.httpinteractLoadModules = function(){ 
	$$.__runtimeModules["interact"] = require("interact");
	$$.__runtimeModules["psk-http-client"] = require("psk-http-client");
	$$.__runtimeModules["swarmutils"] = require("swarmutils");
	$$.__runtimeModules["foldermq"] = require("foldermq");
}
if (false) {
	httpinteractLoadModules();
}; 
global.httpinteractRequire = require;
if (typeof $$ !== "undefined") {            
    $$.requireBundle("httpinteract");
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"foldermq":"foldermq","interact":"interact","psk-http-client":"psk-http-client","swarmutils":"swarmutils"}],"/opt/privatesky/modules/foldermq/lib/folderMQ.js":[function(require,module,exports){
const utils = require("swarmutils");
const OwM = utils.OwM;
var beesHealer = utils.beesHealer;
var fs = require("fs");
var path = require("path");


//TODO: prevent a class of race condition type of errors by signaling with files metadata to the watcher when it is safe to consume

function FolderMQ(folder, callback = () => {}){

	if(typeof callback !== "function"){
		throw new Error("Second parameter should be a callback function");
	}

	folder = path.normalize(folder);

	fs.mkdir(folder, {recursive: true}, function(err, res){
		fs.exists(folder, function(exists) {
			if (exists) {
				return callback(null, folder);
			} else {
				return callback(err);
			}
		});
	});

	function mkFileName(swarmRaw){
		let meta = OwM.prototype.getMetaFrom(swarmRaw);
		let name = `${folder}${path.sep}${meta.swarmId}.${meta.swarmTypeName}`;
		const unique = meta.phaseId || $$.uidGenerator.safe_uuid();

		name = name+`.${unique}`;
		return path.normalize(name);
	}

	this.getHandler = function(){
		if(producer){
			throw new Error("Only one consumer is allowed!");
		}
		producer = true;
		return {
			sendSwarmSerialization: function(serialization, callback){
				if(typeof callback !== "function"){
					throw new Error("Second parameter should be a callback function");
				}
				writeFile(mkFileName(JSON.parse(serialization)), serialization, callback);
			},
			addStream : function(stream, callback){
				if(typeof callback !== "function"){
					throw new Error("Second parameter should be a callback function");
				}

				if(!stream || !stream.pipe || typeof stream.pipe !== "function"){
					return callback(new Error("Something wrong happened"));
				}

				let swarm = "";
				stream.on('data', (chunk) =>{
					swarm += chunk;
				});

				stream.on("end", () => {
					writeFile(mkFileName(JSON.parse(swarm)), swarm, callback);
				});

				stream.on("error", (err) =>{
					callback(err);
				});
			},
			addSwarm : function(swarm, callback){
				if(!callback){
					callback = $$.defaultErrorHandlingImplementation;
				}else if(typeof callback !== "function"){
					throw new Error("Second parameter should be a callback function");
				}

				beesHealer.asJSON(swarm,null, null, function(err, res){
					if (err) {
						console.log(err);
					}
					writeFile(mkFileName(res), J(res), callback);
				});
			},
			sendSwarmForExecution: function(swarm, callback){
				if(!callback){
					callback = $$.defaultErrorHandlingImplementation;
				}else if(typeof callback !== "function"){
					throw new Error("Second parameter should be a callback function");
				}

				beesHealer.asJSON(swarm, OwM.prototype.getMetaFrom(swarm, "phaseName"), OwM.prototype.getMetaFrom(swarm, "args"), function(err, res){
					if (err) {
						console.log(err);
					}
					var file = mkFileName(res);
					var content = JSON.stringify(res);

					//if there are no more FD's for files to be written we retry.
					function wrapper(error, result){
						if(error){
							console.log(`Caught an write error. Retry to write file [${file}]`);
							setTimeout(()=>{
								writeFile(file, content, wrapper);
							}, 10);
						}else{
							return callback(error, result);
						}
					}

					writeFile(file, content, wrapper);
				});
			}
		};
	};

	var recipient;
	this.setIPCChannel = function(processChannel){
		if(processChannel && !processChannel.send || (typeof processChannel.send) != "function"){
			throw new Error("Recipient is not instance of process/child_process or it was not spawned with IPC channel!");
		}
		recipient = processChannel;
		if(consumer){
			console.log(`Channel updated`);
			(recipient || process).on("message", receiveEnvelope);
		}
	};


	var consumedMessages = {};

	function checkIfConsummed(name, message){
		const shortName = path.basename(name);
		const previousSaved = consumedMessages[shortName];
		let result = false;
		if(previousSaved && !previousSaved.localeCompare(message)){
			result = true;
		}
		return result;
	}

	function save2History(envelope){
		consumedMessages[path.basename(envelope.name)] = envelope.message;
	}

	function buildEnvelopeConfirmation(envelope, saveHistory){
		if(saveHistory){
			save2History(envelope);
		}
		return `Confirm envelope ${envelope.timestamp} sent to ${envelope.dest}`;
	}

	function buildEnvelope(name, message){
		return {
			dest: folder,
			src: process.pid,
			timestamp: new Date().getTime(),
			message: message,
			name: name
		};
	}

	function receiveEnvelope(envelope){
		if(!envelope || typeof envelope !== "object"){
			return;
		}
		//console.log("received envelope", envelope, folder);

		if(envelope.dest !== folder && folder.indexOf(envelope.dest)!== -1 && folder.length === envelope.dest+1){
			console.log("This envelope is not for me!");
			return;
		}

		let message = envelope.message;

		if(callback){
			//console.log("Sending confirmation", process.pid);
			recipient.send(buildEnvelopeConfirmation(envelope, true));
			consumer(null, JSON.parse(message));
		}
	}

	this.registerAsIPCConsumer = function(callback){
		if(typeof callback !== "function"){
			throw new Error("The argument should be a callback function");
		}
		registeredAsIPCConsumer = true;
		//will register as normal consumer in order to consume all existing messages but without setting the watcher
		this.registerConsumer(callback, true, (watcher) => !watcher);

		//console.log("Registered as IPC Consummer", );
		(recipient || process).on("message", receiveEnvelope);
	};

	this.registerConsumer = function (callback, shouldDeleteAfterRead = true, shouldWaitForMore = (watcher) => true) {
		if(typeof callback !== "function"){
			throw new Error("First parameter should be a callback function");
		}
		if (consumer) {
			throw new Error("Only one consumer is allowed! " + folder);
		}

		consumer = callback;

		fs.mkdir(folder, {recursive: true}, function (err, res) {
			if (err && (err.code !== 'EEXIST')) {
				console.log(err);
			}
			consumeAllExisting(shouldDeleteAfterRead, shouldWaitForMore);
		});
	};

	this.writeMessage = writeFile;

	this.unlinkContent = function (messageId, callback) {
		const messagePath = path.join(folder, messageId);

		fs.unlink(messagePath, (err) => {
			callback(err);
		});
	};

	this.dispose = function(force){
		if(typeof folder != "undefined"){
			var files;
			try{
				files = fs.readdirSync(folder);
			}catch(error){
				//..
			}

			if(files && files.length > 0 && !force){
				console.log("Disposing a channel that still has messages! Dir will not be removed!");
				return false;
			}else{
				try{
					fs.rmdirSync(folder);
				}catch(err){
					//..
				}
			}

			folder = null;
		}

		if(producer){
			//no need to do anything else
		}

		if(typeof consumer != "undefined"){
			consumer = () => {};
		}

		if(watcher){
			watcher.close();
			watcher = null;
		}

		return true;
	};


	/* ---------------- protected  functions */
	var consumer = null;
	var registeredAsIPCConsumer = false;
	var producer = null;

	function buildPathForFile(filename){
		return path.normalize(path.join(folder, filename));
	}

	function consumeMessage(filename, shouldDeleteAfterRead, callback) {
		var fullPath = buildPathForFile(filename);

		fs.readFile(fullPath, "utf8", function (err, data) {
			if (!err) {
				if (data !== "") {
					try {
						var message = JSON.parse(data);
					} catch (error) {
						console.log("Parsing error", error);
						err = error;
					}

					if(checkIfConsummed(fullPath, data)){
						//console.log(`message already consumed [${filename}]`);
						return ;
					}

					if (shouldDeleteAfterRead) {

						fs.unlink(fullPath, function (err, res) {
							if (err) {throw err;};
						});

					}
					return callback(err, message);
				}
			} else {
				console.log("Consume error", err);
				return callback(err);
			}
		});
	}

	function consumeAllExisting(shouldDeleteAfterRead, shouldWaitForMore) {

		let currentFiles = [];

		fs.readdir(folder, 'utf8', function (err, files) {
			if (err) {
				$$.errorHandler.error(err);
				return;
			}
			currentFiles = files;
			iterateAndConsume(files);

		});

		function startWatching(){
			if (shouldWaitForMore(true)) {
				watchFolder(shouldDeleteAfterRead, shouldWaitForMore);
			}
		}

		function iterateAndConsume(files, currentIndex = 0) {
			if (currentIndex === files.length) {
				//console.log("start watching", new Date().getTime());
				startWatching();
				return;
			}

			if (path.extname(files[currentIndex]) !== in_progress) {
				consumeMessage(files[currentIndex], shouldDeleteAfterRead, (err, data) => {
					if (err) {
						iterateAndConsume(files, ++currentIndex);
						return;
					}
					consumer(null, data, path.basename(files[currentIndex]));
					if (shouldWaitForMore()) {
						iterateAndConsume(files, ++currentIndex);
					}
				});
			} else {
				iterateAndConsume(files, ++currentIndex);
			}
		}
	}

	function writeFile(filename, content, callback){
		if(recipient){
			var envelope = buildEnvelope(filename, content);
			//console.log("Sending to", recipient.pid, recipient.ppid, "envelope", envelope);
			recipient.send(envelope);
			var confirmationReceived = false;

			function receiveConfirmation(message){
				if(message === buildEnvelopeConfirmation(envelope)){
					//console.log("Received confirmation", recipient.pid);
					confirmationReceived = true;
					try{
						recipient.off("message", receiveConfirmation);
					}catch(err){
						//...
					}

				}
			}

			recipient.on("message", receiveConfirmation);

			setTimeout(()=>{
				if(!confirmationReceived){
					//console.log("No confirmation...", process.pid);
					hidden_writeFile(filename, content, callback);
				}else{
					if(callback){
						return callback(null, content);
					}
				}
			}, 200);
		}else{
			hidden_writeFile(filename, content, callback);
		}
	}

	const in_progress = ".in_progress";
	function hidden_writeFile(filename, content, callback){
		var tmpFilename = filename+in_progress;
		try{
			if(fs.existsSync(tmpFilename) || fs.existsSync(filename)){
				console.log(new Error(`Overwriting file ${filename}`));
			}
			fs.writeFileSync(tmpFilename, content);
			fs.renameSync(tmpFilename, filename);
		}catch(err){
			return callback(err);
		}
		callback(null, content);
	}

	var alreadyKnownChanges = {};

	function alreadyFiredChanges(filename, change){
		var res = false;
		if(alreadyKnownChanges[filename]){
			res = true;
		}else{
			alreadyKnownChanges[filename] = change;
		}

		return res;
	}

	function watchFolder(shouldDeleteAfterRead, shouldWaitForMore){

		setTimeout(function(){
			fs.readdir(folder, 'utf8', function (err, files) {
				if (err) {
					$$.errorHandler.error(err);
					return;
				}

				for(var i=0; i<files.length; i++){
					watchFilesHandler("change", files[i]);
				}
			});
		}, 1000);

		function watchFilesHandler(eventType, filename){
			//console.log(`Got ${eventType} on ${filename}`);

			if(!filename || path.extname(filename) === in_progress){
				//caught a delete event of a file
				//or
				//file not ready to be consumed (in progress)
				return;
			}

			var f = buildPathForFile(filename);
			if(!fs.existsSync(f)){
				//console.log("File not found", f);
				return;
			}

			//console.log(`Preparing to consume ${filename}`);
			if(!alreadyFiredChanges(filename, eventType)){
				consumeMessage(filename, shouldDeleteAfterRead, (err, data) => {
					//allow a read a the file
					alreadyKnownChanges[filename] = undefined;

					if (err) {
						// ??
						console.log("\nCaught an error", err);
						return;
					}

					consumer(null, data, filename);


					if (!shouldWaitForMore()) {
						watcher.close();
					}
				});
			}else{
				console.log("Something happens...", filename);
			}
		}


		const watcher = fs.watch(folder, watchFilesHandler);

		const intervalTimer = setInterval(()=>{
			fs.readdir(folder, 'utf8', function (err, files) {
				if (err) {
					$$.errorHandler.error(err);
					return;
				}

				if(files.length > 0){
					console.log(`\n\nFound ${files.length} files not consumed yet in ${folder}`, new Date().getTime(),"\n\n");
					//faking a rename event trigger
					watchFilesHandler("rename", files[0]);
				}
			});
		}, 5000);
	}
}

exports.getFolderQueue = function(folder, callback){
	return new FolderMQ(folder, callback);
};

},{"fs":false,"path":false,"swarmutils":"swarmutils"}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace.js":[function(require,module,exports){
function MemoryMQInteractionSpace() {
    var swarmInteract = require("./../swarmInteraction");
    var swarmHandlersSubscribers = {};

    function dispatchingSwarms(swarm){
		setTimeout(function(){
            var subsList = swarmHandlersSubscribers[swarm.meta.swarmId];
            if(subsList){
                for(var i=0; i<subsList.length; i++){
                    var handler = subsList[i];
                    handler(null, swarm);
                }
            }
        }, 1);
    }

    var initialized = false;
    function init(){
		if(!initialized){
			initialized = true;
			$$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, dispatchingSwarms);
		}
    }

    var comm = {
        startSwarm: function (swarmName, ctor, args) {
			init();
            return $$.swarm.start(swarmName, ctor, ...args);
        },
        continueSwarm: function (swarmHandler, swarmSerialisation, ctor, args) {
			init();
            swarmHandler[ctor].apply(swarmHandler, args);
        },
        on: function (swarmHandler, callback) {
			init();
            if(!swarmHandlersSubscribers[swarmHandler.getInnerValue().meta.swarmId]){
				swarmHandlersSubscribers[swarmHandler.getInnerValue().meta.swarmId] = [ callback ];
            }else{
				swarmHandlersSubscribers[swarmHandler.getInnerValue().meta.swarmId].push(callback);
            }
        },
        off: function (swarmHandler) {
			if(swarmHandlersSubscribers[swarmHandler.getInnerValue().meta.swarmId]){
				swarmHandlersSubscribers[swarmHandler.getInnerValue().meta.swarmId] = [];
            }
        }
    };

    return swarmInteract.newInteractionSpace(comm);

}

var space;
module.exports.createInteractionSpace = function () {
    if(!space){
        space = new MemoryMQInteractionSpace();
    }else{
        console.log("MemoryMQInteractionSpace already created! Using same instance.");
    }
    return space;
};
},{"./../swarmInteraction":"/opt/privatesky/modules/interact/lib/swarmInteraction.js"}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/WebViewMQInteractionSpace.js":[function(require,module,exports){
function WindowMQInteractionSpace(channelName, communicationWindow, secondCommunicationChannel){
    var swarmInteract = require("./../swarmInteraction");
    var childMessageMQ = require("./specificMQImpl/ChildWebViewMQ").createMQ(channelName, communicationWindow, secondCommunicationChannel);
    var swarmInstances = {};

    var comm = {
        startSwarm: function (swarmName, ctor, args) {
            var swarm = {meta:{
                    swarmTypeName:swarmName,
                    ctor:ctor,
                    args:args
                }};
            childMessageMQ.produce(swarm);
            return swarm;
        },
        continueSwarm: function (swarmHandler, swarmSerialisation, phaseName, args) {

            var newSerialization = JSON.parse(JSON.stringify(swarmSerialisation));
            newSerialization.meta.ctor = undefined;
            newSerialization.meta.phaseName = phaseName;
            newSerialization.meta.target = "iframe";
            newSerialization.meta.args = args;
            childMessageMQ.produce(newSerialization);
        },
        on: function (swarmHandler, callback) {
            childMessageMQ.registerConsumer(callback);
        },
        off: function (swarmHandler) {

        }
    };


    var space = swarmInteract.newInteractionSpace(comm);
    this.startSwarm = function (name, ctor, ...args) {
        return space.startSwarm(name, ctor, ...args);
    };

    this.init = function () {

        childMessageMQ.registerConsumer(function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                var swarm;
                if(data && data.meta && data.meta.swarmId && swarmInstances[data.meta.swarmId]){
                    swarm = swarmInstances[data.meta.swarmId];
                    swarm.update(data);
                    swarm[data.meta.phaseName].apply(swarm, data.meta.args);
                }else{

                    swarm = $$.swarm.start(data.meta.swarmTypeName, data.meta.ctor, ...data.meta.args);

                    swarmInstances[swarm.getInnerValue().meta.swarmId] = swarm;

                    swarm.onReturn(function(data){
                        console.log("Swarm is finished");
                        console.log(data);
                    });
                }
            }
        });
        const readyEvt = {webViewIsReady: true};
        parent.postMessage(JSON.stringify(readyEvt), "*");

    };

    function handler(message){
        log("sending swarm ", message);
        childMessageMQ.produce(message);
    }

    function filterInteractions(message){
        log("checking if message is 'interaction' ", message);
        return message && message.meta && message.meta.target && message.meta.target === "interaction";
    }
    //TODO fix this for nativeWebView

    $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, handler, function(){return true;}, filterInteractions);

    log("registering listener for handling interactions");

    function log(...args){
        args.unshift("[WindowMQInteractionSpace"+(window.frameElement ? "*": "")+"]" );
        //console.log.apply(this, args);
    }
}

module.exports.createInteractionSpace = function(channelName, communicationWindow, secondCommunicationChannel){
    return new WindowMQInteractionSpace(channelName, communicationWindow, secondCommunicationChannel);
};
},{"./../swarmInteraction":"/opt/privatesky/modules/interact/lib/swarmInteraction.js","./specificMQImpl/ChildWebViewMQ":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ.js"}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/WindowMQInteractionSpace.js":[function(require,module,exports){
/*TODO
For the moment I don't see any problems if it's not cryptographic safe.
This version keeps  compatibility with mobile browsers/webviews.
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function WindowMQInteractionSpace(channelName, communicationWindow) {
    var swarmInteract = require("./../swarmInteraction");
    var childMessageMQ = require("./specificMQImpl/ChildWndMQ").createMQ(channelName, communicationWindow);
    var swarmInstances = {};

    var comm = {
        startSwarm: function (swarmName, ctor, args) {

            var uniqueId = uuidv4();
            var swarm = {
                meta: {
                    swarmTypeName: swarmName,
                    ctor: ctor,
                    args: args,
                    requestId: uniqueId,
                }
            };
            childMessageMQ.produce(swarm);
            return swarm;
        },
        continueSwarm: function (swarmHandler, swarmSerialisation, phaseName, args) {

            var newSerialization = JSON.parse(JSON.stringify(swarmSerialisation));
            newSerialization.meta.ctor = undefined;
            newSerialization.meta.phaseName = phaseName;
            newSerialization.meta.target = "iframe";
            newSerialization.meta.args = args;
            childMessageMQ.produce(newSerialization);
        },
        on: function (swarmHandler, callback) {
            childMessageMQ.registerCallback(swarmHandler.meta.requestId, callback);
        },
        off: function (swarmHandler) {
            console.log("Function not implemented!");
        }
    };


    var space = swarmInteract.newInteractionSpace(comm);
    this.startSwarm = function (name, ctor, ...args) {
        return space.startSwarm(name, ctor, ...args);
    };

    this.init = function () {

        childMessageMQ.registerConsumer(function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                var swarm;
                if (data && data.meta && data.meta.swarmId && swarmInstances[data.meta.swarmId]) {
                    swarm = swarmInstances[data.meta.swarmId];
                    swarm.update(data);
                    swarm[data.meta.phaseName].apply(swarm, data.meta.args);
                } else {

                    swarm = $$.swarm.start(data.meta.swarmTypeName, data.meta.ctor, ...data.meta.args);
                    swarm.setMetadata("requestId", data.meta.requestId);
                    swarmInstances[swarm.getInnerValue().meta.swarmId] = swarm;

                    swarm.onReturn(function (data) {
                        console.log("Swarm is finished");
                        console.log(data);
                    });
                }
            }
        });
        parent.postMessage({webViewIsReady: true}, "*");
    };

    function handler(message) {
        log("sending swarm ", message);
        childMessageMQ.produce(message);
    }

    function filterInteractions(message) {
        log("checking if message is 'interaction' ", message);
        return message && message.meta && message.meta.target && message.meta.target === "interaction";
    }

    $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, handler, function () {
        return true;
    }, filterInteractions);
    log("registering listener for handling interactions");

    function log(...args) {
        args.unshift("[WindowMQInteractionSpace" + (window.frameElement ? "*" : "") + "]");
        //console.log.apply(this, args);
    }
}

module.exports.createInteractionSpace = function (channelName, communicationWindow) {
    return new WindowMQInteractionSpace(channelName, communicationWindow);
};

},{"./../swarmInteraction":"/opt/privatesky/modules/interact/lib/swarmInteraction.js","./specificMQImpl/ChildWndMQ":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ.js"}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/folderMQBasedInteractionSpace.js":[function(require,module,exports){
var OwM = require("swarmutils").OwM;
var swarmInteract = require("./../swarmInteraction");
var folderMQ = require("foldermq");

function FolderMQInteractionSpace(agent, targetFolder, returnFolder) {
    var swarmHandlersSubscribers = {};
    var queueHandler = null;
    var responseQueue = null;

    var queue = folderMQ.createQue(targetFolder, (err , result) => {
        if(err){
           throw err;
        }
    });

    function createSwarmPack(swarmName, phaseName, ...args){
        var swarm = new OwM();

        swarm.setMeta("swarmId", $$.uidGenerator.safe_uuid());

        swarm.setMeta("requestId", swarm.getMeta("swarmId"));
        swarm.setMeta("swarmTypeName", swarmName);
        swarm.setMeta("phaseName", phaseName);
        swarm.setMeta("args", args);
        swarm.setMeta("command", "executeSwarmPhase");
        swarm.setMeta("target", agent);
        swarm.setMeta("homeSecurityContext", returnFolder);

        return swarm;
    }

    function dispatchingSwarms(err, swarm){
        if (err) {
            console.log(err);
        }
		setTimeout(function(){
            var subsList = swarmHandlersSubscribers[swarm.meta.swarmId];
            if(subsList){
                for(var i=0; i<subsList.length; i++){
                    let handler = subsList[i];
                    handler(null, swarm);
                }
            }
        }, 1);
    }

    function init(){
        if(!queueHandler){
            queueHandler = queue.getHandler();
        }
    }
	
	init();

    function prepareToConsume(){
        if(!responseQueue){
            responseQueue = folderMQ.createQue(returnFolder);
            responseQueue.registerConsumer(dispatchingSwarms);
        }
    }

    var communication = {
        startSwarm: function (swarmName, ctor, args) {
            prepareToConsume();
            var swarm = createSwarmPack(swarmName, ctor, ...args);
            queueHandler.sendSwarmForExecution(swarm);
            return swarm;
        },
        continueSwarm: function (swarmHandler, swarmSerialisation, ctor, ...args) {
            try{
                swarmHandler.update(swarmSerialisation);
                swarmHandler[ctor].apply(swarmHandler, args);
            }catch(err){
                console.log(err);
            }
        },
        on: function (swarmHandler, callback) {
            prepareToConsume();

            if(!swarmHandlersSubscribers[swarmHandler.meta.swarmId]){
                swarmHandlersSubscribers[swarmHandler.meta.swarmId] = [];
            }
            swarmHandlersSubscribers[swarmHandler.meta.swarmId].push(callback);

        },
        off: function (swarmHandler) {
            swarmHandlersSubscribers[swarmHandler.meta.swarmId] = [];
        }
    };

    return swarmInteract.newInteractionSpace(communication);
}

var spaces = {};

module.exports.createInteractionSpace = function (agent, targetFolder, returnFolder) {
    var index = targetFolder+returnFolder;
    if(!spaces[index]){
        spaces[index] = new FolderMQInteractionSpace(agent, targetFolder, returnFolder);
    }else{
        console.log(`FolderMQ interaction space based on [${targetFolder}, ${returnFolder}] already exists!`);
    }
    return spaces[index];
};
},{"./../swarmInteraction":"/opt/privatesky/modules/interact/lib/swarmInteraction.js","foldermq":"foldermq","swarmutils":"swarmutils"}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/httpInteractionSpace.js":[function(require,module,exports){
require('psk-http-client');

function HTTPInteractionSpace(alias, remoteEndPoint, agentUid, cryptoInfo) {
    const swarmInteract = require("./../swarmInteraction");

    let initialized = false;
    function init(){
        if(!initialized){
            initialized = true;
            $$.remote.createRequestManager();
            $$.remote.newEndPoint(alias, remoteEndPoint, agentUid, cryptoInfo);
        }
    }

    const comm = {
        startSwarm: function (swarmName, ctor, args) {
            init();
            return $$.remote[alias].startSwarm(swarmName, ctor, ...args);
        },
        continueSwarm: function (swarmHandler, swarmSerialisation, ctor, args) {
            return $$.remote[alias].continueSwarm(swarmSerialisation, ctor, args);
        },
        on: function (swarmHandler, callback) {
            swarmHandler.on('*', callback);
        },
        off: function (swarmHandler) {
            swarmHandler.off('*');
        }
    };

    return swarmInteract.newInteractionSpace(comm);
}

module.exports.createInteractionSpace = function (alias, remoteEndPoint, agentUid, cryptoInfo) {
    //singleton
    return new HTTPInteractionSpace(alias, remoteEndPoint, agentUid, cryptoInfo);
};
},{"./../swarmInteraction":"/opt/privatesky/modules/interact/lib/swarmInteraction.js","psk-http-client":"psk-http-client"}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ.js":[function(require,module,exports){
(function (global){
var channelsRegistry = {}; //keeps callbacks for consumers and windows references for producers
var callbacksRegistry = {};

function dispatchEvent(event) {
    var swarm = JSON.parse(event.data);
    if(swarm.meta){
        var callback = callbacksRegistry[swarm.meta.channelName];
        if (callback) {
            return callback(null, swarm);
        } else {
            throw new Error("");
        }
    }

}


function ChildWndMQ(channelName, mainWindow, secondCommunicationChannel) {
    //channel name is

    channelsRegistry[channelName] = mainWindow;

    this.produce = function (swarmMsg) {
        swarmMsg.meta.channelName = channelName;
        var message = {
            meta:swarmMsg.meta,
            publicVars:swarmMsg.publicVars,
            privateVars:swarmMsg.privateVars
        };

        message.meta.args = message.meta.args.map(function (argument) {
            if (argument instanceof Error) {
                var error = {};
                if (argument.message) {
                    error["message"] = argument.message;
                }
                if (argument.code) {
                    error["code"] = argument.code;
                }
                return error;
            }
            return argument;
        });
        mainWindow.postMessage(JSON.stringify(message), "*");
    };

    var consumer;

    this.registerConsumer = function (callback, shouldDeleteAfterRead = true) {
        if (typeof callback !== "function") {
            throw new Error("First parameter should be a callback function");
        }
        if (consumer) {
           // throw new Error("Only one consumer is allowed!");
        }

        consumer = callback;
        callbacksRegistry[channelName] = consumer;

        if (secondCommunicationChannel && typeof secondCommunicationChannel.addEventListener !== "undefined") {
            secondCommunicationChannel.addEventListener("message", dispatchEvent);
        }
      };
}


module.exports.createMQ = function createMQ(channelName, wnd, secondCommunicationChannel){
    return new ChildWndMQ(channelName, wnd, secondCommunicationChannel);
};


module.exports.initForSwarmingInChild = function(domainName){

    var pubSub = $$.require("soundpubsub").soundPubSub;

    var inbound = createMQ(domainName+"/inbound");
    var outbound = createMQ(domainName+"/outbound");


    inbound.registerConsumer(function(err, swarm){
        if (err) {
            console.log(err);
        }
        //restore and execute this tasty swarm
        global.$$.swarmsInstancesManager.revive_swarm(swarm);
    });

    pubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function(swarm){
        outbound.sendSwarmForExecution(swarm);
    });
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ.js":[function(require,module,exports){
(function (global){
var channelsRegistry = {}; //keeps callbacks for consumers and windows references for producers
var callbacksRegistry = {};
var swarmCallbacks = {};

function dispatchEvent(event) {

    if (event.source !== window) {

        var swarm = event.data;

        if (swarm.meta) {
            let callback;
            if (!swarm.meta.requestId || !swarmCallbacks[swarm.meta.requestId]) {
                callback = callbacksRegistry[swarm.meta.channelName];
            }
            else {
                callback = swarmCallbacks[swarm.meta.requestId];
            }

            if (callback) {
                return callback(null, swarm);
            } else {
                throw new Error("");
            }

        }
    }
}


function ChildWndMQ(channelName, mainWindow) {
    //channel name is

    channelsRegistry[channelName] = mainWindow;

    this.produce = function (swarmMsg) {
        swarmMsg.meta.channelName = channelName;
        var message = {
            meta: swarmMsg.meta,
            publicVars: swarmMsg.publicVars,
            privateVars: swarmMsg.privateVars
        };
        //console.log(swarmMsg.getJSON());
        //console.log(swarmMsg.valueOf());
        message.meta.args = message.meta.args.map(function (argument) {
            if (argument instanceof Error) {
                var error = {};
                if (argument.message) {
                    error["message"] = argument.message;
                }
                if (argument.code) {
                    error["code"] = argument.code;
                }
                return error;
            }
            return argument;
        });
        mainWindow.postMessage(message, "*");
    };

    var consumer;

    this.registerConsumer = function (callback, shouldDeleteAfterRead = true) {
        if (typeof callback !== "function") {
            throw new Error("First parameter should be a callback function");
        }
        if (consumer) {
            // throw new Error("Only one consumer is allowed!");
        }

        consumer = callback;
        callbacksRegistry[channelName] = consumer;
        mainWindow.addEventListener("message", dispatchEvent);
    };

    this.registerCallback = function (requestId, callback) {
        swarmCallbacks[requestId] = callback;
        callbacksRegistry[channelName] = callback;
        mainWindow.addEventListener("message", dispatchEvent);
    };

}


module.exports.createMQ = function createMQ(channelName, wnd) {
    return new ChildWndMQ(channelName, wnd);
};


module.exports.initForSwarmingInChild = function (domainName) {

    var pubSub = $$.require("soundpubsub").soundPubSub;

    var inbound = createMQ(domainName + "/inbound");
    var outbound = createMQ(domainName + "/outbound");


    inbound.registerConsumer(function (err, swarm) {
        if (err) {
            console.log(err);
        }
        //restore and execute this tasty swarm
        global.$$.swarmsInstancesManager.revive_swarm(swarm);
    });

    pubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function (swarm) {
        outbound.sendSwarmForExecution(swarm);
    });
};


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"/opt/privatesky/modules/interact/lib/swarmInteraction.js":[function(require,module,exports){
if (typeof $$ == "undefined") {
    $$ = {};
}

function VirtualSwarm(innerObj, globalHandler){
    let knownExtraProps = [ "swarm" ];

    function buildHandler() {
        var utility = {};
        return {
            set: function (target, property, value, receiver) {
                switch (true) {
                    case target.privateVars && target.privateVars.hasOwnProperty(property):
                        target.privateVars[property] = value;
                        break;
                    case target.publicVars && target.publicVars.hasOwnProperty(property):
                        target.publicVars[property] = value;
                        break;
                    case target.hasOwnProperty(property):
                        target[property] = value;
                        break;
                    case knownExtraProps.indexOf(property) === -1:
                        if (!globalHandler.protected) {
                            globalHandler.protected = {};
                        }
                        globalHandler.protected[property] = value;
                        break;
                    default:
                        utility[property] = value;
                }
                return true;
            },
            get: function (target, property, receiver) {

                switch (true) {
                    case target.publicVars && target.publicVars.hasOwnProperty(property):
                        return target.publicVars[property];
                    case target.privateVars && target.privateVars.hasOwnProperty(property):
                        return target.privateVars[property];
                    case target.hasOwnProperty(property):
                        return target[property];
                    case globalHandler.protected && globalHandler.protected.hasOwnProperty(property):
                        return globalHandler.protected[property];
                    case utility.hasOwnProperty(property):
                        return utility[property];
                    default:
                        return undefined;
                }
            }
        };
    }

    return new Proxy(innerObj, buildHandler());
}

function SwarmInteraction(communicationInterface, swarmName, ctor, args) {

    var swarmHandler = communicationInterface.startSwarm(swarmName, ctor, args);

    this.on = function(description){
        communicationInterface.on(swarmHandler, function(err, swarmSerialisation){
            if (err) {
                console.log(err);
            }
            let phase = description[swarmSerialisation.meta.phaseName];
            let virtualSwarm = new VirtualSwarm(swarmSerialisation, swarmHandler);

            if(!phase){
                //TODO review and fix. Fix case when an interaction is started from another interaction
                if(swarmHandler && (!swarmHandler.Target || swarmHandler.Target.swarmId !== swarmSerialisation.meta.swarmId)){
                    console.log("Not my swarm!");
                    return;
                }
                var interactPhaseErr =  new Error("Interact method "+swarmSerialisation.meta.phaseName+" was not found.");
                if(description["onError"]){
                    description["onError"].call(virtualSwarm, interactPhaseErr);
                    return;
                }
                else{
                    throw interactPhaseErr;
                }
            }

            virtualSwarm.swarm = function(phaseName, ...args){
                communicationInterface.continueSwarm(swarmHandler, swarmSerialisation, phaseName, args);
            };

            phase.apply(virtualSwarm, swarmSerialisation.meta.args);
            if(virtualSwarm.meta.command === "asyncReturn"){
                communicationInterface.off(swarmHandler);
            }
        });
    };

    this.onReturn = function(callback){
        this.on({
            __return__: callback
        });
    };
}

var abstractInteractionSpace = {
    startSwarm: function (swarmName, ctor, args) {
        throw new Error("Overwrite  SwarmInteraction.prototype.startSwarm");
    },
    resendSwarm: function (swarmInstance, swarmSerialisation, ctor, args) {
        throw new Error("Overwrite  SwarmInteraction.prototype.continueSwarm ");
    },
    on: function (swarmInstance, phaseName, callback) {
        throw new Error("Overwrite  SwarmInteraction.prototype.onSwarm");
    },
off: function (swarmInstance) {
        throw new Error("Overwrite  SwarmInteraction.prototype.onSwarm");
    }
};

module.exports.newInteractionSpace = function (communicationInterface) {

    if(!communicationInterface) {
        communicationInterface = abstractInteractionSpace ;
    }
    return {
        startSwarm: function (swarmName, ctor, ...args) {
            return new SwarmInteraction(communicationInterface, swarmName, ctor, args);
        }
    };
};


},{}],"/opt/privatesky/modules/psk-http-client/lib/psk-abstract-client.js":[function(require,module,exports){
(function (Buffer){
const msgpack = require('@msgpack/msgpack');

/**********************  utility class **********************************/
function RequestManager(pollingTimeOut){
    if(!pollingTimeOut){
        pollingTimeOut = 1000; //1 second by default
    }

    var self = this;

    function Request(endPoint, initialSwarm){
        var onReturnCallbacks = [];
        var onErrorCallbacks = [];
        var onCallbacks = [];
        var requestId = initialSwarm.meta.requestId;
        initialSwarm = null;

        this.getRequestId = function(){
            return requestId;
        };

        this.on = function(phaseName, callback){
            if(typeof phaseName != "string"  && typeof callback != "function"){
                throw new Error("The first parameter should be a string and the second parameter should be a function");
            }

            onCallbacks.push({
                callback:callback,
                phase:phaseName
            });
            self.poll(endPoint, this);
            return this;
        };

        this.onReturn = function(callback){
            onReturnCallbacks.push(callback);
            self.poll(endPoint, this);
            return this;
        };

        this.onError = function(callback){
            if(onErrorCallbacks.indexOf(callback)!==-1){
                onErrorCallbacks.push(callback);
            }else{
                console.log("Error callback already registered!");
            }
        };

        this.dispatch = function(err, result){
            if(ArrayBuffer.isView(result) || Buffer.isBuffer(result)) {
                result = msgpack.decode(result);
            }

            result = typeof result === "string" ? JSON.parse(result) : result;

            result = OwM.prototype.convert(result);
            var resultReqId = result.getMeta("requestId");
            var phaseName = result.getMeta("phaseName");
            var onReturn = false;

            if(resultReqId === requestId){
                onReturnCallbacks.forEach(function(c){
                    c(null, result);
                    onReturn = true;
                });
                if(onReturn){
                    onReturnCallbacks = [];
                    onErrorCallbacks = [];
                }

                onCallbacks.forEach(function(i){
                    //console.log("XXXXXXXX:", phaseName , i);
                    if(phaseName === i.phase || i.phase === '*') {
                        i.callback(err, result);
                    }
                });
            }

            if(onReturnCallbacks.length === 0 && onCallbacks.length === 0){
                self.unpoll(endPoint, this);
            }
        };

        this.dispatchError = function(err){
            for(var i=0; i < onErrorCallbacks.length; i++){
                var errCb = onErrorCallbacks[i];
                errCb(err);
            }
        };

        this.off = function(){
            self.unpoll(endPoint, this);
        };
    }

    this.createRequest = function(remoteEndPoint, swarm){
        let request = new Request(remoteEndPoint, swarm);
        return request;
    };

    /* *************************** polling zone ****************************/

    var pollSet = {
    };

    var activeConnections = {
    };

    this.poll = function(remoteEndPoint, request){
        var requests = pollSet[remoteEndPoint];
        if(!requests){
            requests = {};
            pollSet[remoteEndPoint] = requests;
        }
        requests[request.getRequestId()] = request;
        pollingHandler();
    };

    this.unpoll = function(remoteEndPoint, request){
        var requests = pollSet[remoteEndPoint];
        if(requests){
            delete requests[request.getRequestId()];
            if(Object.keys(requests).length === 0){
                delete pollSet[remoteEndPoint];
            }
        }
        else {
            console.log("Unpolling wrong request:",remoteEndPoint, request);
        }
    };

    function createPollThread(remoteEndPoint){
        function reArm(){
            $$.remote.doHttpGet(remoteEndPoint, function(err, res){
                let requests = pollSet[remoteEndPoint];

                if(err){
                    for(let req_id in requests){
                        let err_handler = requests[req_id].dispatchError;
                        if(err_handler){
                            err_handler(err);
                        }
                    }
                    activeConnections[remoteEndPoint] = false;
                } else {
                    if(Buffer.isBuffer(res) || ArrayBuffer.isView(res)) {
                        res = msgpack.decode(res);
                    }

                    for(var k in requests){
                        requests[k].dispatch(null, res);
                    }

                    if(Object.keys(requests).length !== 0) {
                        reArm();
                    } else {
                        delete activeConnections[remoteEndPoint];
                        console.log("Ending polling for ", remoteEndPoint);
                    }
                }
            });
        }
        reArm();
    }

    function pollingHandler(){
        let setTimer = false;
        for(var v in pollSet){
            if(!activeConnections[v]){
                createPollThread(v);
                activeConnections[v] = true;
            }
            setTimer = true;
        }
        if(setTimer) {
            setTimeout(pollingHandler, pollingTimeOut);
        }
    }

    setTimeout( pollingHandler, pollingTimeOut);
}


function extractDomainAgentDetails(url){
    const vRegex = /([a-zA-Z0-9]*|.)*\/agent\/([a-zA-Z0-9]+(\/)*)+/g;

    if(!url.match(vRegex)){
        throw new Error("Invalid format. (Eg. domain[.subdomain]*/agent/[organisation/]*agentId)");
    }

    const devider = "/agent/";
    let domain;
    let agentUrl;

    const splitPoint = url.indexOf(devider);
    if(splitPoint !== -1){
        domain = url.slice(0, splitPoint);
        agentUrl = url.slice(splitPoint+devider.length);
    }

    return {domain, agentUrl};
}

function urlEndWithSlash(url){

    if(url[url.length - 1] !== "/"){
        url += "/";
    }

    return url;
}

const OwM = require("swarmutils").OwM;

/********************** main APIs on working with remote end points **********************************/
function PskHttpClient(remoteEndPoint, agentUid, options){
    var baseOfRemoteEndPoint = remoteEndPoint; //remove last id

    remoteEndPoint = urlEndWithSlash(remoteEndPoint);

    //domainInfo contains 2 members: domain (privateSky domain) and agentUrl
    const domainInfo = extractDomainAgentDetails(agentUid);
    let homeSecurityContext = domainInfo.agentUrl;
    let returnRemoteEndPoint = remoteEndPoint;

    if(options && typeof options.returnRemote != "undefined"){
        returnRemoteEndPoint = options.returnRemote;
    }

    if(!options || options && (typeof options.uniqueId == "undefined" || options.uniqueId)){
        homeSecurityContext += "_"+Math.random().toString(36).substr(2, 9);
    }

    returnRemoteEndPoint = urlEndWithSlash(returnRemoteEndPoint);

    this.startSwarm = function(swarmName, phaseName, ...args){
        const swarm = new OwM();
        swarm.setMeta("swarmId", $$.uidGenerator.safe_uuid());
        swarm.setMeta("requestId", swarm.getMeta("swarmId"));
        swarm.setMeta("swarmTypeName", swarmName);
        swarm.setMeta("phaseName", phaseName);
        swarm.setMeta("args", args);
        swarm.setMeta("command", "executeSwarmPhase");
        swarm.setMeta("target", domainInfo.agentUrl);
        swarm.setMeta("homeSecurityContext", returnRemoteEndPoint+$$.remote.base64Encode(homeSecurityContext));

        $$.remote.doHttpPost(getRemote(remoteEndPoint, domainInfo.domain), msgpack.encode(swarm), function(err, res){
            if(err){
                console.log(err);
            }
        });

        return $$.remote.requestManager.createRequest(swarm.getMeta("homeSecurityContext"), swarm);
    };

    this.continueSwarm = function(existingSwarm, phaseName, ...args){
        var swarm = new OwM(existingSwarm);
        swarm.setMeta("phaseName", phaseName);
        swarm.setMeta("args", args);
        swarm.setMeta("command", "executeSwarmPhase");
        swarm.setMeta("target", domainInfo.agentUrl);
        swarm.setMeta("homeSecurityContext", returnRemoteEndPoint+$$.remote.base64Encode(homeSecurityContext));

        $$.remote.doHttpPost(getRemote(remoteEndPoint, domainInfo.domain), msgpack.encode(swarm), function(err, res){
            if(err){
                console.log(err);
            }
        });
        //return $$.remote.requestManager.createRequest(swarm.getMeta("homeSecurityContext"), swarm);
    };

    var allCatchAlls = [];
    var requestsCounter = 0;
    function CatchAll(swarmName, phaseName, callback){ //same interface as Request
        var requestId = requestsCounter++;
        this.getRequestId = function(){
            let reqId = "swarmName" + "phaseName" + requestId;
            return reqId;
        };

        this.dispatch = function(err, result){
            result = OwM.prototype.convert(result);
            var currentPhaseName = result.getMeta("phaseName");
            var currentSwarmName = result.getMeta("swarmTypeName");
            if((currentSwarmName === swarmName || swarmName === '*') && (currentPhaseName === phaseName || phaseName === '*')) {
                return callback(err, result);
            }
        };
    }

    this.on = function(swarmName, phaseName, callback){
        var c = new CatchAll(swarmName, phaseName, callback);
        allCatchAlls.push({
            s:swarmName,
            p:phaseName,
            c:c
        });

        $$.remote.requestManager.poll(getRemote(remoteEndPoint, domainInfo.domain) , c);
    };

    this.off = function(swarmName, phaseName){
        allCatchAlls.forEach(function(ca){
            if((ca.s === swarmName || swarmName === '*') && (phaseName === ca.p || phaseName === '*')){
                $$.remote.requestManager.unpoll(getRemote(remoteEndPoint, domainInfo.domain), ca.c);
            }
        });
    };

    this.uploadCSB = function(cryptoUid, binaryData, callback){
        $$.remote.doHttpPost(baseOfRemoteEndPoint + "/CSB/" + cryptoUid, binaryData, callback);
    };

    this.downloadCSB = function(cryptoUid, callback){
        $$.remote.doHttpGet(baseOfRemoteEndPoint + "/CSB/" + cryptoUid, callback);
    };

    function getRemote(baseUrl, domain) {
        return urlEndWithSlash(baseUrl) + $$.remote.base64Encode(domain);
    }
}

/********************** initialisation stuff **********************************/
if (typeof $$ === "undefined") {
    $$ = {};
}

if (typeof  $$.remote === "undefined") {
    $$.remote = {};
    $$.remote.createRequestManager = function(timeOut){
        $$.remote.requestManager = new RequestManager(timeOut);
    };


    $$.remote.cryptoProvider = null;
    $$.remote.newEndPoint = function(alias, remoteEndPoint, agentUid, cryptoInfo){
        if(alias === "newRemoteEndPoint" || alias === "requestManager" || alias === "cryptoProvider"){
            console.log("PskHttpClient Unsafe alias name:", alias);
            return null;
        }
        
        $$.remote[alias] = new PskHttpClient(remoteEndPoint, agentUid, cryptoInfo);
    };


    $$.remote.doHttpPost = function (url, data, callback){
        throw new Error("Overwrite this!");
    };

    $$.remote.doHttpGet = function doHttpGet(url, callback){
        throw new Error("Overwrite this!");
    };

    $$.remote.base64Encode = function base64Encode(stringToEncode){
        throw new Error("Overwrite this!");
    };

    $$.remote.base64Decode = function base64Decode(encodedString){
        throw new Error("Overwrite this!");
    };
}



/*  interface
function CryptoProvider(){

    this.generateSafeUid = function(){

    }

    this.signSwarm = function(swarm, agent){

    }
} */

}).call(this,{"isBuffer":require("../../../node_modules/is-buffer/index.js")})

},{"../../../node_modules/is-buffer/index.js":"/opt/privatesky/node_modules/is-buffer/index.js","@msgpack/msgpack":false,"swarmutils":"swarmutils"}],"/opt/privatesky/modules/psk-http-client/lib/psk-browser-client.js":[function(require,module,exports){
(function (Buffer){
$$.remote.doHttpPost = function (url, data, callback) {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
        if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
            const data = xhr.response;
            callback(null, data);
        } else {
            if(xhr.status>=400){
                callback(new Error("An error occured. StatusCode: " + xhr.status));
            } else {
                console.log(`Status code ${xhr.status} received, response is ignored.`);
            }
        }
    };

    xhr.open("POST", url, true);
    //xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    if(data && data.pipe && typeof data.pipe === "function"){
        const buffers = [];
        data.on("data", function(data) {
            buffers.push(data);
        });
        data.on("end", function() {
            const actualContents = Buffer.concat(buffers);
            xhr.send(actualContents);
        });
    }
    else {
        if(ArrayBuffer.isView(data)) {
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        }

        xhr.send(data);
    }
};


$$.remote.doHttpGet = function doHttpGet(url, callback) {

    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        //check if headers were received and if any action should be performed before receiving data
        if (xhr.readyState === 2) {
            var contentType = xhr.getResponseHeader("Content-Type");
            if (contentType === "application/octet-stream") {
                xhr.responseType = 'arraybuffer';
            }
        }
    };


    xhr.onload = function () {

        if (xhr.readyState == 4 && xhr.status == "200") {
            var contentType = xhr.getResponseHeader("Content-Type");

            if(contentType==="application/octet-stream"){
                let responseBuffer = Buffer.from(this.response);
                callback(null, responseBuffer);
            }
            else{
                callback(null, xhr.response);
            }

        } else {
            callback(new Error("An error occured. StatusCode: " + xhr.status));
        }
    };

    xhr.open("GET", url);
    xhr.send();
};


function CryptoProvider(){

    this.generateSafeUid = function(){
        let uid = "";
        var array = new Uint32Array(10);
        window.crypto.getRandomValues(array);


        for (var i = 0; i < array.length; i++) {
            uid += array[i].toString(16);
        }

        return uid;
    }

    this.signSwarm = function(swarm, agent){
        swarm.meta.signature = agent;
    }
}



$$.remote.cryptoProvider = new CryptoProvider();

$$.remote.base64Encode = function base64Encode(stringToEncode){
    return window.btoa(stringToEncode);
};

$$.remote.base64Decode = function base64Decode(encodedString){
    return window.atob(encodedString);
};

}).call(this,require("buffer").Buffer)

},{"buffer":false}],"/opt/privatesky/modules/psk-http-client/lib/psk-node-client.js":[function(require,module,exports){
(function (Buffer){
require("./psk-abstract-client");

const http = require("http");
const https = require("https");
const URL = require("url");
const userAgent = 'PSK NodeAgent/0.0.1';

console.log("PSK node client loading");

function getNetworkForOptions(options) {
	if(options.protocol === 'http:') {
		return http;
	} else if(options.protocol === 'https:') {
		return https;
	} else {
		throw new Error(`Can't handle protocol ${options.protocol}`);
	}

}

$$.remote.doHttpPost = function (url, data, callback){
	const innerUrl = URL.parse(url);

	const options = {
		hostname: innerUrl.hostname,
		path: innerUrl.pathname,
		port: parseInt(innerUrl.port),
		headers: {
			'User-Agent': userAgent
		},
		method: 'POST'
	};

	const network = getNetworkForOptions(innerUrl);

	if(ArrayBuffer.isView(data) || Buffer.isBuffer(data)) {
		if(!Buffer.isBuffer(data)) {
			data = Buffer.from(data);
		}

		options.headers['Content-Type'] = 'application/octet-stream';
		options.headers['Content-Length'] = data.length;
	}

	const req = network.request(options, (res) => {
		const { statusCode } = res;

		let error;
		if (statusCode >= 400) {
			error = new Error('Request Failed.\n' +
				`Status Code: ${statusCode}`);
		}

		if (error) {
			callback(error);
			// free up memory
			res.resume();
			return ;
		}

		let rawData = '';
		res.on('data', (chunk) => { rawData += chunk; });
		res.on('end', () => {
			try {
				return callback(null, rawData);
			} catch (err) {
				return callback(err);
			}
		});
	}).on("error", (error) => {
        console.log("POST Error", error);
		callback(error);
	});

    if(data && data.pipe && typeof data.pipe === "function"){
        data.pipe(req);
        return;
    }

    if(typeof data !== 'string' && !Buffer.isBuffer(data) && !ArrayBuffer.isView(data)) {
		data = JSON.stringify(data);
	}

	req.write(data);
	req.end();
};

$$.remote.doHttpGet = function doHttpGet(url, callback){
    const innerUrl = URL.parse(url);

	const options = {
		hostname: innerUrl.hostname,
		path: innerUrl.pathname + (innerUrl.search || ''),
		port: parseInt(innerUrl.port),
		headers: {
			'User-Agent': userAgent
		},
		method: 'GET'
	};

	const network = getNetworkForOptions(innerUrl);

	const req = network.request(options, (res) => {
		const { statusCode } = res;

		let error;
		if (statusCode !== 200) {
			error = new Error('Request Failed.\n' +
				`Status Code: ${statusCode}`);
			error.code = statusCode;
		}

		if (error) {
			callback(error);
			// free up memory
			res.resume();
			return ;
		}

		let rawData;
		const contentType = res.headers['content-type'];

		if(contentType === "application/octet-stream"){
			rawData = [];
		}else{
			rawData = '';
		}

		res.on('data', (chunk) => {
			if(Array.isArray(rawData)){
				rawData.push(...chunk);
			}else{
				rawData += chunk;
			}
		});
		res.on('end', () => {
			try {
				if(Array.isArray(rawData)){
					rawData = Buffer.from(rawData);
				}
				return callback(null, rawData);
			} catch (err) {
				console.log("Client error:", err);
			}
		});
	});

	req.on("error", (error) => {
		if(error && error.code !== 'ECONNRESET'){
        	console.log("GET Error", error);
		}

		callback(error);
	});

	req.end();
};

$$.remote.base64Encode = function base64Encode(stringToEncode){
    return Buffer.from(stringToEncode).toString('base64');
};

$$.remote.base64Decode = function base64Decode(encodedString){
    return Buffer.from(encodedString, 'base64').toString('ascii');
};

}).call(this,require("buffer").Buffer)

},{"./psk-abstract-client":"/opt/privatesky/modules/psk-http-client/lib/psk-abstract-client.js","buffer":false,"http":false,"https":false,"url":false}],"/opt/privatesky/modules/swarmutils/lib/Combos.js":[function(require,module,exports){
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
},{}],"/opt/privatesky/modules/swarmutils/lib/OwM.js":[function(require,module,exports){
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
},{}],"/opt/privatesky/modules/swarmutils/lib/Queue.js":[function(require,module,exports){
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
},{}],"/opt/privatesky/modules/swarmutils/lib/beesHealer.js":[function(require,module,exports){
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
},{"./OwM":"/opt/privatesky/modules/swarmutils/lib/OwM.js"}],"/opt/privatesky/modules/swarmutils/lib/pskconsole.js":[function(require,module,exports){
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


},{}],"/opt/privatesky/modules/swarmutils/lib/safe-uuid.js":[function(require,module,exports){

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
},{"crypto":false}],"/opt/privatesky/modules/swarmutils/lib/uidGenerator.js":[function(require,module,exports){
(function (Buffer){
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

}).call(this,require("buffer").Buffer)

},{"./Queue":"/opt/privatesky/modules/swarmutils/lib/Queue.js","buffer":false,"crypto":false}],"/opt/privatesky/node_modules/is-buffer/index.js":[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],"foldermq":[function(require,module,exports){
module.exports = {
					createQue: require("./lib/folderMQ").getFolderQueue
					//folderMQ: require("./lib/folderMQ")
};
},{"./lib/folderMQ":"/opt/privatesky/modules/foldermq/lib/folderMQ.js"}],"interact":[function(require,module,exports){
/*
Module that offers APIs to interact with PrivateSky web sandboxes
 */


const exportBrowserInteract = {
    enableIframeInteractions: function () {
        module.exports.createWindowMQ = require("./lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ").createMQ;
        module.exports.createWindowInteractionSpace = require("./lib/interactionSpaceImpl/WindowMQInteractionSpace").createInteractionSpace;
    },
    enableReactInteractions: function () {
        module.exports.createWindowMQ = require("./lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ").createMQ;
        module.exports.createWindowInteractionSpace = require("./lib/interactionSpaceImpl/WindowMQInteractionSpace").createInteractionSpace;
    },
    enableWebViewInteractions:function(){
        module.exports.createWindowInteractionSpace = require("./lib/interactionSpaceImpl/WebViewMQInteractionSpace").createInteractionSpace;
        module.exports.createWindowMQ = require("./lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ").createMQ;
    },
    enableLocalInteractions: function () {
        module.exports.createInteractionSpace = require("./lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace").createInteractionSpace;
    },
    enableRemoteInteractions: function () {
        module.exports.createRemoteInteractionSpace = require('./lib/interactionSpaceImpl/httpInteractionSpace').createInteractionSpace;
    }
};


if (typeof navigator !== "undefined") {
    module.exports = exportBrowserInteract;
}
else {
    module.exports = {
        createNodeInteractionSpace: require("./lib/interactionSpaceImpl/folderMQBasedInteractionSpace").createInteractionSpace,
        createInteractionSpace: require("./lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace").createInteractionSpace,
        createRemoteInteractionSpace: require('./lib/interactionSpaceImpl/httpInteractionSpace').createInteractionSpace
    };
}
},{"./lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace.js","./lib/interactionSpaceImpl/WebViewMQInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/WebViewMQInteractionSpace.js","./lib/interactionSpaceImpl/WindowMQInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/WindowMQInteractionSpace.js","./lib/interactionSpaceImpl/folderMQBasedInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/folderMQBasedInteractionSpace.js","./lib/interactionSpaceImpl/httpInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/httpInteractionSpace.js","./lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ.js","./lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ.js"}],"psk-http-client":[function(require,module,exports){
//to look nice the requireModule on Node
require("./lib/psk-abstract-client");
if(!$$.browserRuntime){
	require("./lib/psk-node-client");
}else{
	require("./lib/psk-browser-client");
}
},{"./lib/psk-abstract-client":"/opt/privatesky/modules/psk-http-client/lib/psk-abstract-client.js","./lib/psk-browser-client":"/opt/privatesky/modules/psk-http-client/lib/psk-browser-client.js","./lib/psk-node-client":"/opt/privatesky/modules/psk-http-client/lib/psk-node-client.js"}],"swarmutils":[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/Combos":"/opt/privatesky/modules/swarmutils/lib/Combos.js","./lib/OwM":"/opt/privatesky/modules/swarmutils/lib/OwM.js","./lib/Queue":"/opt/privatesky/modules/swarmutils/lib/Queue.js","./lib/beesHealer":"/opt/privatesky/modules/swarmutils/lib/beesHealer.js","./lib/pskconsole":"/opt/privatesky/modules/swarmutils/lib/pskconsole.js","./lib/safe-uuid":"/opt/privatesky/modules/swarmutils/lib/safe-uuid.js","./lib/uidGenerator":"/opt/privatesky/modules/swarmutils/lib/uidGenerator.js"}]},{},["/opt/privatesky/builds/tmp/httpinteract_intermediar.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZHMvdG1wL2h0dHBpbnRlcmFjdF9pbnRlcm1lZGlhci5qcyIsIm1vZHVsZXMvZm9sZGVybXEvbGliL2ZvbGRlck1RLmpzIiwibW9kdWxlcy9pbnRlcmFjdC9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvU291bmRQdWJTdWJNUUJhc2VkSW50ZXJhY3Rpb25TcGFjZS5qcyIsIm1vZHVsZXMvaW50ZXJhY3QvbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL1dlYlZpZXdNUUludGVyYWN0aW9uU3BhY2UuanMiLCJtb2R1bGVzL2ludGVyYWN0L2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9XaW5kb3dNUUludGVyYWN0aW9uU3BhY2UuanMiLCJtb2R1bGVzL2ludGVyYWN0L2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9mb2xkZXJNUUJhc2VkSW50ZXJhY3Rpb25TcGFjZS5qcyIsIm1vZHVsZXMvaW50ZXJhY3QvbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL2h0dHBJbnRlcmFjdGlvblNwYWNlLmpzIiwibW9kdWxlcy9pbnRlcmFjdC9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvc3BlY2lmaWNNUUltcGwvQ2hpbGRXZWJWaWV3TVEuanMiLCJtb2R1bGVzL2ludGVyYWN0L2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9zcGVjaWZpY01RSW1wbC9DaGlsZFduZE1RLmpzIiwibW9kdWxlcy9pbnRlcmFjdC9saWIvc3dhcm1JbnRlcmFjdGlvbi5qcyIsIm1vZHVsZXMvcHNrLWh0dHAtY2xpZW50L2xpYi9wc2stYWJzdHJhY3QtY2xpZW50LmpzIiwibW9kdWxlcy9wc2staHR0cC1jbGllbnQvbGliL3Bzay1icm93c2VyLWNsaWVudC5qcyIsIm1vZHVsZXMvcHNrLWh0dHAtY2xpZW50L2xpYi9wc2stbm9kZS1jbGllbnQuanMiLCJtb2R1bGVzL3N3YXJtdXRpbHMvbGliL0NvbWJvcy5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9saWIvT3dNLmpzIiwibW9kdWxlcy9zd2FybXV0aWxzL2xpYi9RdWV1ZS5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9saWIvYmVlc0hlYWxlci5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9saWIvcHNrY29uc29sZS5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9saWIvc2FmZS11dWlkLmpzIiwibW9kdWxlcy9zd2FybXV0aWxzL2xpYi91aWRHZW5lcmF0b3IuanMiLCJub2RlX21vZHVsZXMvaXMtYnVmZmVyL2luZGV4LmpzIiwibW9kdWxlcy9mb2xkZXJtcS9pbmRleC5qcyIsIm1vZHVsZXMvaW50ZXJhY3QvaW5kZXguanMiLCJtb2R1bGVzL3Bzay1odHRwLWNsaWVudC9pbmRleC5qcyIsIm1vZHVsZXMvc3dhcm11dGlscy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImdsb2JhbC5odHRwaW50ZXJhY3RMb2FkTW9kdWxlcyA9IGZ1bmN0aW9uKCl7IFxuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiaW50ZXJhY3RcIl0gPSByZXF1aXJlKFwiaW50ZXJhY3RcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJwc2staHR0cC1jbGllbnRcIl0gPSByZXF1aXJlKFwicHNrLWh0dHAtY2xpZW50XCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wic3dhcm11dGlsc1wiXSA9IHJlcXVpcmUoXCJzd2FybXV0aWxzXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiZm9sZGVybXFcIl0gPSByZXF1aXJlKFwiZm9sZGVybXFcIik7XG59XG5pZiAoZmFsc2UpIHtcblx0aHR0cGludGVyYWN0TG9hZE1vZHVsZXMoKTtcbn07IFxuZ2xvYmFsLmh0dHBpbnRlcmFjdFJlcXVpcmUgPSByZXF1aXJlO1xuaWYgKHR5cGVvZiAkJCAhPT0gXCJ1bmRlZmluZWRcIikgeyAgICAgICAgICAgIFxuICAgICQkLnJlcXVpcmVCdW5kbGUoXCJodHRwaW50ZXJhY3RcIik7XG59OyIsImNvbnN0IHV0aWxzID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIik7XG5jb25zdCBPd00gPSB1dGlscy5Pd007XG52YXIgYmVlc0hlYWxlciA9IHV0aWxzLmJlZXNIZWFsZXI7XG52YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XG52YXIgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuXG5cbi8vVE9ETzogcHJldmVudCBhIGNsYXNzIG9mIHJhY2UgY29uZGl0aW9uIHR5cGUgb2YgZXJyb3JzIGJ5IHNpZ25hbGluZyB3aXRoIGZpbGVzIG1ldGFkYXRhIHRvIHRoZSB3YXRjaGVyIHdoZW4gaXQgaXMgc2FmZSB0byBjb25zdW1lXG5cbmZ1bmN0aW9uIEZvbGRlck1RKGZvbGRlciwgY2FsbGJhY2sgPSAoKSA9PiB7fSl7XG5cblx0aWYodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgY2FsbGJhY2sgZnVuY3Rpb25cIik7XG5cdH1cblxuXHRmb2xkZXIgPSBwYXRoLm5vcm1hbGl6ZShmb2xkZXIpO1xuXG5cdGZzLm1rZGlyKGZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIGZ1bmN0aW9uKGVyciwgcmVzKXtcblx0XHRmcy5leGlzdHMoZm9sZGVyLCBmdW5jdGlvbihleGlzdHMpIHtcblx0XHRcdGlmIChleGlzdHMpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIGZvbGRlcik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0ZnVuY3Rpb24gbWtGaWxlTmFtZShzd2FybVJhdyl7XG5cdFx0bGV0IG1ldGEgPSBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHN3YXJtUmF3KTtcblx0XHRsZXQgbmFtZSA9IGAke2ZvbGRlcn0ke3BhdGguc2VwfSR7bWV0YS5zd2FybUlkfS4ke21ldGEuc3dhcm1UeXBlTmFtZX1gO1xuXHRcdGNvbnN0IHVuaXF1ZSA9IG1ldGEucGhhc2VJZCB8fCAkJC51aWRHZW5lcmF0b3Iuc2FmZV91dWlkKCk7XG5cblx0XHRuYW1lID0gbmFtZStgLiR7dW5pcXVlfWA7XG5cdFx0cmV0dXJuIHBhdGgubm9ybWFsaXplKG5hbWUpO1xuXHR9XG5cblx0dGhpcy5nZXRIYW5kbGVyID0gZnVuY3Rpb24oKXtcblx0XHRpZihwcm9kdWNlcil7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG9uZSBjb25zdW1lciBpcyBhbGxvd2VkIVwiKTtcblx0XHR9XG5cdFx0cHJvZHVjZXIgPSB0cnVlO1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZW5kU3dhcm1TZXJpYWxpemF0aW9uOiBmdW5jdGlvbihzZXJpYWxpemF0aW9uLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHdyaXRlRmlsZShta0ZpbGVOYW1lKEpTT04ucGFyc2Uoc2VyaWFsaXphdGlvbikpLCBzZXJpYWxpemF0aW9uLCBjYWxsYmFjayk7XG5cdFx0XHR9LFxuXHRcdFx0YWRkU3RyZWFtIDogZnVuY3Rpb24oc3RyZWFtLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIXN0cmVhbSB8fCAhc3RyZWFtLnBpcGUgfHwgdHlwZW9mIHN0cmVhbS5waXBlICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJTb21ldGhpbmcgd3JvbmcgaGFwcGVuZWRcIikpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHN3YXJtID0gXCJcIjtcblx0XHRcdFx0c3RyZWFtLm9uKCdkYXRhJywgKGNodW5rKSA9Pntcblx0XHRcdFx0XHRzd2FybSArPSBjaHVuaztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0c3RyZWFtLm9uKFwiZW5kXCIsICgpID0+IHtcblx0XHRcdFx0XHR3cml0ZUZpbGUobWtGaWxlTmFtZShKU09OLnBhcnNlKHN3YXJtKSksIHN3YXJtLCBjYWxsYmFjayk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHN0cmVhbS5vbihcImVycm9yXCIsIChlcnIpID0+e1xuXHRcdFx0XHRcdGNhbGxiYWNrKGVycik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSxcblx0XHRcdGFkZFN3YXJtIDogZnVuY3Rpb24oc3dhcm0sIGNhbGxiYWNrKXtcblx0XHRcdFx0aWYoIWNhbGxiYWNrKXtcblx0XHRcdFx0XHRjYWxsYmFjayA9ICQkLmRlZmF1bHRFcnJvckhhbmRsaW5nSW1wbGVtZW50YXRpb247XG5cdFx0XHRcdH1lbHNlIGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YmVlc0hlYWxlci5hc0pTT04oc3dhcm0sbnVsbCwgbnVsbCwgZnVuY3Rpb24oZXJyLCByZXMpe1xuXHRcdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHdyaXRlRmlsZShta0ZpbGVOYW1lKHJlcyksIEoocmVzKSwgY2FsbGJhY2spO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRzZW5kU3dhcm1Gb3JFeGVjdXRpb246IGZ1bmN0aW9uKHN3YXJtLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKCFjYWxsYmFjayl7XG5cdFx0XHRcdFx0Y2FsbGJhY2sgPSAkJC5kZWZhdWx0RXJyb3JIYW5kbGluZ0ltcGxlbWVudGF0aW9uO1xuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJlZXNIZWFsZXIuYXNKU09OKHN3YXJtLCBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHN3YXJtLCBcInBoYXNlTmFtZVwiKSwgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbShzd2FybSwgXCJhcmdzXCIpLCBmdW5jdGlvbihlcnIsIHJlcyl7XG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIGZpbGUgPSBta0ZpbGVOYW1lKHJlcyk7XG5cdFx0XHRcdFx0dmFyIGNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShyZXMpO1xuXG5cdFx0XHRcdFx0Ly9pZiB0aGVyZSBhcmUgbm8gbW9yZSBGRCdzIGZvciBmaWxlcyB0byBiZSB3cml0dGVuIHdlIHJldHJ5LlxuXHRcdFx0XHRcdGZ1bmN0aW9uIHdyYXBwZXIoZXJyb3IsIHJlc3VsdCl7XG5cdFx0XHRcdFx0XHRpZihlcnJvcil7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBDYXVnaHQgYW4gd3JpdGUgZXJyb3IuIFJldHJ5IHRvIHdyaXRlIGZpbGUgWyR7ZmlsZX1dYCk7XG5cdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoKCk9Pntcblx0XHRcdFx0XHRcdFx0XHR3cml0ZUZpbGUoZmlsZSwgY29udGVudCwgd3JhcHBlcik7XG5cdFx0XHRcdFx0XHRcdH0sIDEwKTtcblx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyb3IsIHJlc3VsdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0d3JpdGVGaWxlKGZpbGUsIGNvbnRlbnQsIHdyYXBwZXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9O1xuXG5cdHZhciByZWNpcGllbnQ7XG5cdHRoaXMuc2V0SVBDQ2hhbm5lbCA9IGZ1bmN0aW9uKHByb2Nlc3NDaGFubmVsKXtcblx0XHRpZihwcm9jZXNzQ2hhbm5lbCAmJiAhcHJvY2Vzc0NoYW5uZWwuc2VuZCB8fCAodHlwZW9mIHByb2Nlc3NDaGFubmVsLnNlbmQpICE9IFwiZnVuY3Rpb25cIil7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJSZWNpcGllbnQgaXMgbm90IGluc3RhbmNlIG9mIHByb2Nlc3MvY2hpbGRfcHJvY2VzcyBvciBpdCB3YXMgbm90IHNwYXduZWQgd2l0aCBJUEMgY2hhbm5lbCFcIik7XG5cdFx0fVxuXHRcdHJlY2lwaWVudCA9IHByb2Nlc3NDaGFubmVsO1xuXHRcdGlmKGNvbnN1bWVyKXtcblx0XHRcdGNvbnNvbGUubG9nKGBDaGFubmVsIHVwZGF0ZWRgKTtcblx0XHRcdChyZWNpcGllbnQgfHwgcHJvY2Vzcykub24oXCJtZXNzYWdlXCIsIHJlY2VpdmVFbnZlbG9wZSk7XG5cdFx0fVxuXHR9O1xuXG5cblx0dmFyIGNvbnN1bWVkTWVzc2FnZXMgPSB7fTtcblxuXHRmdW5jdGlvbiBjaGVja0lmQ29uc3VtbWVkKG5hbWUsIG1lc3NhZ2Upe1xuXHRcdGNvbnN0IHNob3J0TmFtZSA9IHBhdGguYmFzZW5hbWUobmFtZSk7XG5cdFx0Y29uc3QgcHJldmlvdXNTYXZlZCA9IGNvbnN1bWVkTWVzc2FnZXNbc2hvcnROYW1lXTtcblx0XHRsZXQgcmVzdWx0ID0gZmFsc2U7XG5cdFx0aWYocHJldmlvdXNTYXZlZCAmJiAhcHJldmlvdXNTYXZlZC5sb2NhbGVDb21wYXJlKG1lc3NhZ2UpKXtcblx0XHRcdHJlc3VsdCA9IHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBzYXZlMkhpc3RvcnkoZW52ZWxvcGUpe1xuXHRcdGNvbnN1bWVkTWVzc2FnZXNbcGF0aC5iYXNlbmFtZShlbnZlbG9wZS5uYW1lKV0gPSBlbnZlbG9wZS5tZXNzYWdlO1xuXHR9XG5cblx0ZnVuY3Rpb24gYnVpbGRFbnZlbG9wZUNvbmZpcm1hdGlvbihlbnZlbG9wZSwgc2F2ZUhpc3Rvcnkpe1xuXHRcdGlmKHNhdmVIaXN0b3J5KXtcblx0XHRcdHNhdmUySGlzdG9yeShlbnZlbG9wZSk7XG5cdFx0fVxuXHRcdHJldHVybiBgQ29uZmlybSBlbnZlbG9wZSAke2VudmVsb3BlLnRpbWVzdGFtcH0gc2VudCB0byAke2VudmVsb3BlLmRlc3R9YDtcblx0fVxuXG5cdGZ1bmN0aW9uIGJ1aWxkRW52ZWxvcGUobmFtZSwgbWVzc2FnZSl7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRlc3Q6IGZvbGRlcixcblx0XHRcdHNyYzogcHJvY2Vzcy5waWQsXG5cdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdG5hbWU6IG5hbWVcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVjZWl2ZUVudmVsb3BlKGVudmVsb3BlKXtcblx0XHRpZighZW52ZWxvcGUgfHwgdHlwZW9mIGVudmVsb3BlICE9PSBcIm9iamVjdFwiKXtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly9jb25zb2xlLmxvZyhcInJlY2VpdmVkIGVudmVsb3BlXCIsIGVudmVsb3BlLCBmb2xkZXIpO1xuXG5cdFx0aWYoZW52ZWxvcGUuZGVzdCAhPT0gZm9sZGVyICYmIGZvbGRlci5pbmRleE9mKGVudmVsb3BlLmRlc3QpIT09IC0xICYmIGZvbGRlci5sZW5ndGggPT09IGVudmVsb3BlLmRlc3QrMSl7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlRoaXMgZW52ZWxvcGUgaXMgbm90IGZvciBtZSFcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bGV0IG1lc3NhZ2UgPSBlbnZlbG9wZS5tZXNzYWdlO1xuXG5cdFx0aWYoY2FsbGJhY2spe1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIlNlbmRpbmcgY29uZmlybWF0aW9uXCIsIHByb2Nlc3MucGlkKTtcblx0XHRcdHJlY2lwaWVudC5zZW5kKGJ1aWxkRW52ZWxvcGVDb25maXJtYXRpb24oZW52ZWxvcGUsIHRydWUpKTtcblx0XHRcdGNvbnN1bWVyKG51bGwsIEpTT04ucGFyc2UobWVzc2FnZSkpO1xuXHRcdH1cblx0fVxuXG5cdHRoaXMucmVnaXN0ZXJBc0lQQ0NvbnN1bWVyID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuXHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlRoZSBhcmd1bWVudCBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHR9XG5cdFx0cmVnaXN0ZXJlZEFzSVBDQ29uc3VtZXIgPSB0cnVlO1xuXHRcdC8vd2lsbCByZWdpc3RlciBhcyBub3JtYWwgY29uc3VtZXIgaW4gb3JkZXIgdG8gY29uc3VtZSBhbGwgZXhpc3RpbmcgbWVzc2FnZXMgYnV0IHdpdGhvdXQgc2V0dGluZyB0aGUgd2F0Y2hlclxuXHRcdHRoaXMucmVnaXN0ZXJDb25zdW1lcihjYWxsYmFjaywgdHJ1ZSwgKHdhdGNoZXIpID0+ICF3YXRjaGVyKTtcblxuXHRcdC8vY29uc29sZS5sb2coXCJSZWdpc3RlcmVkIGFzIElQQyBDb25zdW1tZXJcIiwgKTtcblx0XHQocmVjaXBpZW50IHx8IHByb2Nlc3MpLm9uKFwibWVzc2FnZVwiLCByZWNlaXZlRW52ZWxvcGUpO1xuXHR9O1xuXG5cdHRoaXMucmVnaXN0ZXJDb25zdW1lciA9IGZ1bmN0aW9uIChjYWxsYmFjaywgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkID0gdHJ1ZSwgc2hvdWxkV2FpdEZvck1vcmUgPSAod2F0Y2hlcikgPT4gdHJ1ZSkge1xuXHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHR9XG5cdFx0aWYgKGNvbnN1bWVyKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG9uZSBjb25zdW1lciBpcyBhbGxvd2VkISBcIiArIGZvbGRlcik7XG5cdFx0fVxuXG5cdFx0Y29uc3VtZXIgPSBjYWxsYmFjaztcblxuXHRcdGZzLm1rZGlyKGZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuXHRcdFx0aWYgKGVyciAmJiAoZXJyLmNvZGUgIT09ICdFRVhJU1QnKSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3VtZUFsbEV4aXN0aW5nKHNob3VsZERlbGV0ZUFmdGVyUmVhZCwgc2hvdWxkV2FpdEZvck1vcmUpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMud3JpdGVNZXNzYWdlID0gd3JpdGVGaWxlO1xuXG5cdHRoaXMudW5saW5rQ29udGVudCA9IGZ1bmN0aW9uIChtZXNzYWdlSWQsIGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgbWVzc2FnZVBhdGggPSBwYXRoLmpvaW4oZm9sZGVyLCBtZXNzYWdlSWQpO1xuXG5cdFx0ZnMudW5saW5rKG1lc3NhZ2VQYXRoLCAoZXJyKSA9PiB7XG5cdFx0XHRjYWxsYmFjayhlcnIpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKGZvcmNlKXtcblx0XHRpZih0eXBlb2YgZm9sZGVyICE9IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0dmFyIGZpbGVzO1xuXHRcdFx0dHJ5e1xuXHRcdFx0XHRmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGZvbGRlcik7XG5cdFx0XHR9Y2F0Y2goZXJyb3Ipe1xuXHRcdFx0XHQvLy4uXG5cdFx0XHR9XG5cblx0XHRcdGlmKGZpbGVzICYmIGZpbGVzLmxlbmd0aCA+IDAgJiYgIWZvcmNlKXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJEaXNwb3NpbmcgYSBjaGFubmVsIHRoYXQgc3RpbGwgaGFzIG1lc3NhZ2VzISBEaXIgd2lsbCBub3QgYmUgcmVtb3ZlZCFcIik7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHR0cnl7XG5cdFx0XHRcdFx0ZnMucm1kaXJTeW5jKGZvbGRlcik7XG5cdFx0XHRcdH1jYXRjaChlcnIpe1xuXHRcdFx0XHRcdC8vLi5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRmb2xkZXIgPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmKHByb2R1Y2VyKXtcblx0XHRcdC8vbm8gbmVlZCB0byBkbyBhbnl0aGluZyBlbHNlXG5cdFx0fVxuXG5cdFx0aWYodHlwZW9mIGNvbnN1bWVyICE9IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0Y29uc3VtZXIgPSAoKSA9PiB7fTtcblx0XHR9XG5cblx0XHRpZih3YXRjaGVyKXtcblx0XHRcdHdhdGNoZXIuY2xvc2UoKTtcblx0XHRcdHdhdGNoZXIgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyogLS0tLS0tLS0tLS0tLS0tLSBwcm90ZWN0ZWQgIGZ1bmN0aW9ucyAqL1xuXHR2YXIgY29uc3VtZXIgPSBudWxsO1xuXHR2YXIgcmVnaXN0ZXJlZEFzSVBDQ29uc3VtZXIgPSBmYWxzZTtcblx0dmFyIHByb2R1Y2VyID0gbnVsbDtcblxuXHRmdW5jdGlvbiBidWlsZFBhdGhGb3JGaWxlKGZpbGVuYW1lKXtcblx0XHRyZXR1cm4gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKGZvbGRlciwgZmlsZW5hbWUpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnN1bWVNZXNzYWdlKGZpbGVuYW1lLCBzaG91bGREZWxldGVBZnRlclJlYWQsIGNhbGxiYWNrKSB7XG5cdFx0dmFyIGZ1bGxQYXRoID0gYnVpbGRQYXRoRm9yRmlsZShmaWxlbmFtZSk7XG5cblx0XHRmcy5yZWFkRmlsZShmdWxsUGF0aCwgXCJ1dGY4XCIsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcblx0XHRcdGlmICghZXJyKSB7XG5cdFx0XHRcdGlmIChkYXRhICE9PSBcIlwiKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJQYXJzaW5nIGVycm9yXCIsIGVycm9yKTtcblx0XHRcdFx0XHRcdGVyciA9IGVycm9yO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKGNoZWNrSWZDb25zdW1tZWQoZnVsbFBhdGgsIGRhdGEpKXtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYG1lc3NhZ2UgYWxyZWFkeSBjb25zdW1lZCBbJHtmaWxlbmFtZX1dYCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChzaG91bGREZWxldGVBZnRlclJlYWQpIHtcblxuXHRcdFx0XHRcdFx0ZnMudW5saW5rKGZ1bGxQYXRoLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGVycikge3Rocm93IGVycjt9O1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVyciwgbWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ29uc3VtZSBlcnJvclwiLCBlcnIpO1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnN1bWVBbGxFeGlzdGluZyhzaG91bGREZWxldGVBZnRlclJlYWQsIHNob3VsZFdhaXRGb3JNb3JlKSB7XG5cblx0XHRsZXQgY3VycmVudEZpbGVzID0gW107XG5cblx0XHRmcy5yZWFkZGlyKGZvbGRlciwgJ3V0ZjgnLCBmdW5jdGlvbiAoZXJyLCBmaWxlcykge1xuXHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHQkJC5lcnJvckhhbmRsZXIuZXJyb3IoZXJyKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudEZpbGVzID0gZmlsZXM7XG5cdFx0XHRpdGVyYXRlQW5kQ29uc3VtZShmaWxlcyk7XG5cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIHN0YXJ0V2F0Y2hpbmcoKXtcblx0XHRcdGlmIChzaG91bGRXYWl0Rm9yTW9yZSh0cnVlKSkge1xuXHRcdFx0XHR3YXRjaEZvbGRlcihzaG91bGREZWxldGVBZnRlclJlYWQsIHNob3VsZFdhaXRGb3JNb3JlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpdGVyYXRlQW5kQ29uc3VtZShmaWxlcywgY3VycmVudEluZGV4ID0gMCkge1xuXHRcdFx0aWYgKGN1cnJlbnRJbmRleCA9PT0gZmlsZXMubGVuZ3RoKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJzdGFydCB3YXRjaGluZ1wiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cdFx0XHRcdHN0YXJ0V2F0Y2hpbmcoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocGF0aC5leHRuYW1lKGZpbGVzW2N1cnJlbnRJbmRleF0pICE9PSBpbl9wcm9ncmVzcykge1xuXHRcdFx0XHRjb25zdW1lTWVzc2FnZShmaWxlc1tjdXJyZW50SW5kZXhdLCBzaG91bGREZWxldGVBZnRlclJlYWQsIChlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHRpdGVyYXRlQW5kQ29uc3VtZShmaWxlcywgKytjdXJyZW50SW5kZXgpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb25zdW1lcihudWxsLCBkYXRhLCBwYXRoLmJhc2VuYW1lKGZpbGVzW2N1cnJlbnRJbmRleF0pKTtcblx0XHRcdFx0XHRpZiAoc2hvdWxkV2FpdEZvck1vcmUoKSkge1xuXHRcdFx0XHRcdFx0aXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMsICsrY3VycmVudEluZGV4KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMsICsrY3VycmVudEluZGV4KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB3cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIGNhbGxiYWNrKXtcblx0XHRpZihyZWNpcGllbnQpe1xuXHRcdFx0dmFyIGVudmVsb3BlID0gYnVpbGRFbnZlbG9wZShmaWxlbmFtZSwgY29udGVudCk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKFwiU2VuZGluZyB0b1wiLCByZWNpcGllbnQucGlkLCByZWNpcGllbnQucHBpZCwgXCJlbnZlbG9wZVwiLCBlbnZlbG9wZSk7XG5cdFx0XHRyZWNpcGllbnQuc2VuZChlbnZlbG9wZSk7XG5cdFx0XHR2YXIgY29uZmlybWF0aW9uUmVjZWl2ZWQgPSBmYWxzZTtcblxuXHRcdFx0ZnVuY3Rpb24gcmVjZWl2ZUNvbmZpcm1hdGlvbihtZXNzYWdlKXtcblx0XHRcdFx0aWYobWVzc2FnZSA9PT0gYnVpbGRFbnZlbG9wZUNvbmZpcm1hdGlvbihlbnZlbG9wZSkpe1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJSZWNlaXZlZCBjb25maXJtYXRpb25cIiwgcmVjaXBpZW50LnBpZCk7XG5cdFx0XHRcdFx0Y29uZmlybWF0aW9uUmVjZWl2ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHRyeXtcblx0XHRcdFx0XHRcdHJlY2lwaWVudC5vZmYoXCJtZXNzYWdlXCIsIHJlY2VpdmVDb25maXJtYXRpb24pO1xuXHRcdFx0XHRcdH1jYXRjaChlcnIpe1xuXHRcdFx0XHRcdFx0Ly8uLi5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZWNpcGllbnQub24oXCJtZXNzYWdlXCIsIHJlY2VpdmVDb25maXJtYXRpb24pO1xuXG5cdFx0XHRzZXRUaW1lb3V0KCgpPT57XG5cdFx0XHRcdGlmKCFjb25maXJtYXRpb25SZWNlaXZlZCl7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIk5vIGNvbmZpcm1hdGlvbi4uLlwiLCBwcm9jZXNzLnBpZCk7XG5cdFx0XHRcdFx0aGlkZGVuX3dyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudCwgY2FsbGJhY2spO1xuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRpZihjYWxsYmFjayl7XG5cdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgY29udGVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LCAyMDApO1xuXHRcdH1lbHNle1xuXHRcdFx0aGlkZGVuX3dyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudCwgY2FsbGJhY2spO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGluX3Byb2dyZXNzID0gXCIuaW5fcHJvZ3Jlc3NcIjtcblx0ZnVuY3Rpb24gaGlkZGVuX3dyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudCwgY2FsbGJhY2spe1xuXHRcdHZhciB0bXBGaWxlbmFtZSA9IGZpbGVuYW1lK2luX3Byb2dyZXNzO1xuXHRcdHRyeXtcblx0XHRcdGlmKGZzLmV4aXN0c1N5bmModG1wRmlsZW5hbWUpIHx8IGZzLmV4aXN0c1N5bmMoZmlsZW5hbWUpKXtcblx0XHRcdFx0Y29uc29sZS5sb2cobmV3IEVycm9yKGBPdmVyd3JpdGluZyBmaWxlICR7ZmlsZW5hbWV9YCkpO1xuXHRcdFx0fVxuXHRcdFx0ZnMud3JpdGVGaWxlU3luYyh0bXBGaWxlbmFtZSwgY29udGVudCk7XG5cdFx0XHRmcy5yZW5hbWVTeW5jKHRtcEZpbGVuYW1lLCBmaWxlbmFtZSk7XG5cdFx0fWNhdGNoKGVycil7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHR9XG5cdFx0Y2FsbGJhY2sobnVsbCwgY29udGVudCk7XG5cdH1cblxuXHR2YXIgYWxyZWFkeUtub3duQ2hhbmdlcyA9IHt9O1xuXG5cdGZ1bmN0aW9uIGFscmVhZHlGaXJlZENoYW5nZXMoZmlsZW5hbWUsIGNoYW5nZSl7XG5cdFx0dmFyIHJlcyA9IGZhbHNlO1xuXHRcdGlmKGFscmVhZHlLbm93bkNoYW5nZXNbZmlsZW5hbWVdKXtcblx0XHRcdHJlcyA9IHRydWU7XG5cdFx0fWVsc2V7XG5cdFx0XHRhbHJlYWR5S25vd25DaGFuZ2VzW2ZpbGVuYW1lXSA9IGNoYW5nZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gd2F0Y2hGb2xkZXIoc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCBzaG91bGRXYWl0Rm9yTW9yZSl7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRmcy5yZWFkZGlyKGZvbGRlciwgJ3V0ZjgnLCBmdW5jdGlvbiAoZXJyLCBmaWxlcykge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0JCQuZXJyb3JIYW5kbGVyLmVycm9yKGVycik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yKHZhciBpPTA7IGk8ZmlsZXMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdHdhdGNoRmlsZXNIYW5kbGVyKFwiY2hhbmdlXCIsIGZpbGVzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSwgMTAwMCk7XG5cblx0XHRmdW5jdGlvbiB3YXRjaEZpbGVzSGFuZGxlcihldmVudFR5cGUsIGZpbGVuYW1lKXtcblx0XHRcdC8vY29uc29sZS5sb2coYEdvdCAke2V2ZW50VHlwZX0gb24gJHtmaWxlbmFtZX1gKTtcblxuXHRcdFx0aWYoIWZpbGVuYW1lIHx8IHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09IGluX3Byb2dyZXNzKXtcblx0XHRcdFx0Ly9jYXVnaHQgYSBkZWxldGUgZXZlbnQgb2YgYSBmaWxlXG5cdFx0XHRcdC8vb3Jcblx0XHRcdFx0Ly9maWxlIG5vdCByZWFkeSB0byBiZSBjb25zdW1lZCAoaW4gcHJvZ3Jlc3MpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGYgPSBidWlsZFBhdGhGb3JGaWxlKGZpbGVuYW1lKTtcblx0XHRcdGlmKCFmcy5leGlzdHNTeW5jKGYpKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIkZpbGUgbm90IGZvdW5kXCIsIGYpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vY29uc29sZS5sb2coYFByZXBhcmluZyB0byBjb25zdW1lICR7ZmlsZW5hbWV9YCk7XG5cdFx0XHRpZighYWxyZWFkeUZpcmVkQ2hhbmdlcyhmaWxlbmFtZSwgZXZlbnRUeXBlKSl7XG5cdFx0XHRcdGNvbnN1bWVNZXNzYWdlKGZpbGVuYW1lLCBzaG91bGREZWxldGVBZnRlclJlYWQsIChlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHQvL2FsbG93IGEgcmVhZCBhIHRoZSBmaWxlXG5cdFx0XHRcdFx0YWxyZWFkeUtub3duQ2hhbmdlc1tmaWxlbmFtZV0gPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHQvLyA/P1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJcXG5DYXVnaHQgYW4gZXJyb3JcIiwgZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdW1lcihudWxsLCBkYXRhLCBmaWxlbmFtZSk7XG5cblxuXHRcdFx0XHRcdGlmICghc2hvdWxkV2FpdEZvck1vcmUoKSkge1xuXHRcdFx0XHRcdFx0d2F0Y2hlci5jbG9zZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJTb21ldGhpbmcgaGFwcGVucy4uLlwiLCBmaWxlbmFtZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRjb25zdCB3YXRjaGVyID0gZnMud2F0Y2goZm9sZGVyLCB3YXRjaEZpbGVzSGFuZGxlcik7XG5cblx0XHRjb25zdCBpbnRlcnZhbFRpbWVyID0gc2V0SW50ZXJ2YWwoKCk9Pntcblx0XHRcdGZzLnJlYWRkaXIoZm9sZGVyLCAndXRmOCcsIGZ1bmN0aW9uIChlcnIsIGZpbGVzKSB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHQkJC5lcnJvckhhbmRsZXIuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihmaWxlcy5sZW5ndGggPiAwKXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgXFxuXFxuRm91bmQgJHtmaWxlcy5sZW5ndGh9IGZpbGVzIG5vdCBjb25zdW1lZCB5ZXQgaW4gJHtmb2xkZXJ9YCwgbmV3IERhdGUoKS5nZXRUaW1lKCksXCJcXG5cXG5cIik7XG5cdFx0XHRcdFx0Ly9mYWtpbmcgYSByZW5hbWUgZXZlbnQgdHJpZ2dlclxuXHRcdFx0XHRcdHdhdGNoRmlsZXNIYW5kbGVyKFwicmVuYW1lXCIsIGZpbGVzWzBdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSwgNTAwMCk7XG5cdH1cbn1cblxuZXhwb3J0cy5nZXRGb2xkZXJRdWV1ZSA9IGZ1bmN0aW9uKGZvbGRlciwgY2FsbGJhY2spe1xuXHRyZXR1cm4gbmV3IEZvbGRlck1RKGZvbGRlciwgY2FsbGJhY2spO1xufTtcbiIsImZ1bmN0aW9uIE1lbW9yeU1RSW50ZXJhY3Rpb25TcGFjZSgpIHtcbiAgICB2YXIgc3dhcm1JbnRlcmFjdCA9IHJlcXVpcmUoXCIuLy4uL3N3YXJtSW50ZXJhY3Rpb25cIik7XG4gICAgdmFyIHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVycyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gZGlzcGF0Y2hpbmdTd2FybXMoc3dhcm0pe1xuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzdWJzTGlzdCA9IHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybS5tZXRhLnN3YXJtSWRdO1xuICAgICAgICAgICAgaWYoc3Vic0xpc3Qpe1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPHN1YnNMaXN0Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBzdWJzTGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcihudWxsLCBzd2FybSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICB2YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBpbml0KCl7XG5cdFx0aWYoIWluaXRpYWxpemVkKXtcblx0XHRcdGluaXRpYWxpemVkID0gdHJ1ZTtcblx0XHRcdCQkLlBTS19QdWJTdWIuc3Vic2NyaWJlKCQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OLCBkaXNwYXRjaGluZ1N3YXJtcyk7XG5cdFx0fVxuICAgIH1cblxuICAgIHZhciBjb21tID0ge1xuICAgICAgICBzdGFydFN3YXJtOiBmdW5jdGlvbiAoc3dhcm1OYW1lLCBjdG9yLCBhcmdzKSB7XG5cdFx0XHRpbml0KCk7XG4gICAgICAgICAgICByZXR1cm4gJCQuc3dhcm0uc3RhcnQoc3dhcm1OYW1lLCBjdG9yLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgY29udGludWVTd2FybTogZnVuY3Rpb24gKHN3YXJtSGFuZGxlciwgc3dhcm1TZXJpYWxpc2F0aW9uLCBjdG9yLCBhcmdzKSB7XG5cdFx0XHRpbml0KCk7XG4gICAgICAgICAgICBzd2FybUhhbmRsZXJbY3Rvcl0uYXBwbHkoc3dhcm1IYW5kbGVyLCBhcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIGNhbGxiYWNrKSB7XG5cdFx0XHRpbml0KCk7XG4gICAgICAgICAgICBpZighc3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5nZXRJbm5lclZhbHVlKCkubWV0YS5zd2FybUlkXSl7XG5cdFx0XHRcdHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIuZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZF0gPSBbIGNhbGxiYWNrIF07XG4gICAgICAgICAgICB9ZWxzZXtcblx0XHRcdFx0c3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5nZXRJbm5lclZhbHVlKCkubWV0YS5zd2FybUlkXS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyKSB7XG5cdFx0XHRpZihzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnNbc3dhcm1IYW5kbGVyLmdldElubmVyVmFsdWUoKS5tZXRhLnN3YXJtSWRdKXtcblx0XHRcdFx0c3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5nZXRJbm5lclZhbHVlKCkubWV0YS5zd2FybUlkXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBzd2FybUludGVyYWN0Lm5ld0ludGVyYWN0aW9uU3BhY2UoY29tbSk7XG5cbn1cblxudmFyIHNwYWNlO1xubW9kdWxlLmV4cG9ydHMuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZighc3BhY2Upe1xuICAgICAgICBzcGFjZSA9IG5ldyBNZW1vcnlNUUludGVyYWN0aW9uU3BhY2UoKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgY29uc29sZS5sb2coXCJNZW1vcnlNUUludGVyYWN0aW9uU3BhY2UgYWxyZWFkeSBjcmVhdGVkISBVc2luZyBzYW1lIGluc3RhbmNlLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHNwYWNlO1xufTsiLCJmdW5jdGlvbiBXaW5kb3dNUUludGVyYWN0aW9uU3BhY2UoY2hhbm5lbE5hbWUsIGNvbW11bmljYXRpb25XaW5kb3csIHNlY29uZENvbW11bmljYXRpb25DaGFubmVsKXtcbiAgICB2YXIgc3dhcm1JbnRlcmFjdCA9IHJlcXVpcmUoXCIuLy4uL3N3YXJtSW50ZXJhY3Rpb25cIik7XG4gICAgdmFyIGNoaWxkTWVzc2FnZU1RID0gcmVxdWlyZShcIi4vc3BlY2lmaWNNUUltcGwvQ2hpbGRXZWJWaWV3TVFcIikuY3JlYXRlTVEoY2hhbm5lbE5hbWUsIGNvbW11bmljYXRpb25XaW5kb3csIHNlY29uZENvbW11bmljYXRpb25DaGFubmVsKTtcbiAgICB2YXIgc3dhcm1JbnN0YW5jZXMgPSB7fTtcblxuICAgIHZhciBjb21tID0ge1xuICAgICAgICBzdGFydFN3YXJtOiBmdW5jdGlvbiAoc3dhcm1OYW1lLCBjdG9yLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgc3dhcm0gPSB7bWV0YTp7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtVHlwZU5hbWU6c3dhcm1OYW1lLFxuICAgICAgICAgICAgICAgICAgICBjdG9yOmN0b3IsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6YXJnc1xuICAgICAgICAgICAgICAgIH19O1xuICAgICAgICAgICAgY2hpbGRNZXNzYWdlTVEucHJvZHVjZShzd2FybSk7XG4gICAgICAgICAgICByZXR1cm4gc3dhcm07XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRpbnVlU3dhcm06IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIHN3YXJtU2VyaWFsaXNhdGlvbiwgcGhhc2VOYW1lLCBhcmdzKSB7XG5cbiAgICAgICAgICAgIHZhciBuZXdTZXJpYWxpemF0aW9uID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzd2FybVNlcmlhbGlzYXRpb24pKTtcbiAgICAgICAgICAgIG5ld1NlcmlhbGl6YXRpb24ubWV0YS5jdG9yID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgbmV3U2VyaWFsaXphdGlvbi5tZXRhLnBoYXNlTmFtZSA9IHBoYXNlTmFtZTtcbiAgICAgICAgICAgIG5ld1NlcmlhbGl6YXRpb24ubWV0YS50YXJnZXQgPSBcImlmcmFtZVwiO1xuICAgICAgICAgICAgbmV3U2VyaWFsaXphdGlvbi5tZXRhLmFyZ3MgPSBhcmdzO1xuICAgICAgICAgICAgY2hpbGRNZXNzYWdlTVEucHJvZHVjZShuZXdTZXJpYWxpemF0aW9uKTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjaGlsZE1lc3NhZ2VNUS5yZWdpc3RlckNvbnN1bWVyKGNhbGxiYWNrKTtcbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyKSB7XG5cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHZhciBzcGFjZSA9IHN3YXJtSW50ZXJhY3QubmV3SW50ZXJhY3Rpb25TcGFjZShjb21tKTtcbiAgICB0aGlzLnN0YXJ0U3dhcm0gPSBmdW5jdGlvbiAobmFtZSwgY3RvciwgLi4uYXJncykge1xuICAgICAgICByZXR1cm4gc3BhY2Uuc3RhcnRTd2FybShuYW1lLCBjdG9yLCAuLi5hcmdzKTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGNoaWxkTWVzc2FnZU1RLnJlZ2lzdGVyQ29uc3VtZXIoZnVuY3Rpb24gKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc3dhcm07XG4gICAgICAgICAgICAgICAgaWYoZGF0YSAmJiBkYXRhLm1ldGEgJiYgZGF0YS5tZXRhLnN3YXJtSWQgJiYgc3dhcm1JbnN0YW5jZXNbZGF0YS5tZXRhLnN3YXJtSWRdKXtcbiAgICAgICAgICAgICAgICAgICAgc3dhcm0gPSBzd2FybUluc3RhbmNlc1tkYXRhLm1ldGEuc3dhcm1JZF07XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtLnVwZGF0ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc3dhcm1bZGF0YS5tZXRhLnBoYXNlTmFtZV0uYXBwbHkoc3dhcm0sIGRhdGEubWV0YS5hcmdzKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcblxuICAgICAgICAgICAgICAgICAgICBzd2FybSA9ICQkLnN3YXJtLnN0YXJ0KGRhdGEubWV0YS5zd2FybVR5cGVOYW1lLCBkYXRhLm1ldGEuY3RvciwgLi4uZGF0YS5tZXRhLmFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3YXJtSW5zdGFuY2VzW3N3YXJtLmdldElubmVyVmFsdWUoKS5tZXRhLnN3YXJtSWRdID0gc3dhcm07XG5cbiAgICAgICAgICAgICAgICAgICAgc3dhcm0ub25SZXR1cm4oZnVuY3Rpb24oZGF0YSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN3YXJtIGlzIGZpbmlzaGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHJlYWR5RXZ0ID0ge3dlYlZpZXdJc1JlYWR5OiB0cnVlfTtcbiAgICAgICAgcGFyZW50LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHJlYWR5RXZ0KSwgXCIqXCIpO1xuXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZXIobWVzc2FnZSl7XG4gICAgICAgIGxvZyhcInNlbmRpbmcgc3dhcm0gXCIsIG1lc3NhZ2UpO1xuICAgICAgICBjaGlsZE1lc3NhZ2VNUS5wcm9kdWNlKG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckludGVyYWN0aW9ucyhtZXNzYWdlKXtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmcgaWYgbWVzc2FnZSBpcyAnaW50ZXJhY3Rpb24nIFwiLCBtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2UgJiYgbWVzc2FnZS5tZXRhICYmIG1lc3NhZ2UubWV0YS50YXJnZXQgJiYgbWVzc2FnZS5tZXRhLnRhcmdldCA9PT0gXCJpbnRlcmFjdGlvblwiO1xuICAgIH1cbiAgICAvL1RPRE8gZml4IHRoaXMgZm9yIG5hdGl2ZVdlYlZpZXdcblxuICAgICQkLlBTS19QdWJTdWIuc3Vic2NyaWJlKCQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OLCBoYW5kbGVyLCBmdW5jdGlvbigpe3JldHVybiB0cnVlO30sIGZpbHRlckludGVyYWN0aW9ucyk7XG5cbiAgICBsb2coXCJyZWdpc3RlcmluZyBsaXN0ZW5lciBmb3IgaGFuZGxpbmcgaW50ZXJhY3Rpb25zXCIpO1xuXG4gICAgZnVuY3Rpb24gbG9nKC4uLmFyZ3Mpe1xuICAgICAgICBhcmdzLnVuc2hpZnQoXCJbV2luZG93TVFJbnRlcmFjdGlvblNwYWNlXCIrKHdpbmRvdy5mcmFtZUVsZW1lbnQgPyBcIipcIjogXCJcIikrXCJdXCIgKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZUludGVyYWN0aW9uU3BhY2UgPSBmdW5jdGlvbihjaGFubmVsTmFtZSwgY29tbXVuaWNhdGlvbldpbmRvdywgc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwpe1xuICAgIHJldHVybiBuZXcgV2luZG93TVFJbnRlcmFjdGlvblNwYWNlKGNoYW5uZWxOYW1lLCBjb21tdW5pY2F0aW9uV2luZG93LCBzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCk7XG59OyIsIi8qVE9ET1xuRm9yIHRoZSBtb21lbnQgSSBkb24ndCBzZWUgYW55IHByb2JsZW1zIGlmIGl0J3Mgbm90IGNyeXB0b2dyYXBoaWMgc2FmZS5cblRoaXMgdmVyc2lvbiBrZWVwcyAgY29tcGF0aWJpbGl0eSB3aXRoIG1vYmlsZSBicm93c2Vycy93ZWJ2aWV3cy5cbiAqL1xuZnVuY3Rpb24gdXVpZHY0KCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XG4gICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gV2luZG93TVFJbnRlcmFjdGlvblNwYWNlKGNoYW5uZWxOYW1lLCBjb21tdW5pY2F0aW9uV2luZG93KSB7XG4gICAgdmFyIHN3YXJtSW50ZXJhY3QgPSByZXF1aXJlKFwiLi8uLi9zd2FybUludGVyYWN0aW9uXCIpO1xuICAgIHZhciBjaGlsZE1lc3NhZ2VNUSA9IHJlcXVpcmUoXCIuL3NwZWNpZmljTVFJbXBsL0NoaWxkV25kTVFcIikuY3JlYXRlTVEoY2hhbm5lbE5hbWUsIGNvbW11bmljYXRpb25XaW5kb3cpO1xuICAgIHZhciBzd2FybUluc3RhbmNlcyA9IHt9O1xuXG4gICAgdmFyIGNvbW0gPSB7XG4gICAgICAgIHN0YXJ0U3dhcm06IGZ1bmN0aW9uIChzd2FybU5hbWUsIGN0b3IsIGFyZ3MpIHtcblxuICAgICAgICAgICAgdmFyIHVuaXF1ZUlkID0gdXVpZHY0KCk7XG4gICAgICAgICAgICB2YXIgc3dhcm0gPSB7XG4gICAgICAgICAgICAgICAgbWV0YToge1xuICAgICAgICAgICAgICAgICAgICBzd2FybVR5cGVOYW1lOiBzd2FybU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGN0b3I6IGN0b3IsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RJZDogdW5pcXVlSWQsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNoaWxkTWVzc2FnZU1RLnByb2R1Y2Uoc3dhcm0pO1xuICAgICAgICAgICAgcmV0dXJuIHN3YXJtO1xuICAgICAgICB9LFxuICAgICAgICBjb250aW51ZVN3YXJtOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBzd2FybVNlcmlhbGlzYXRpb24sIHBoYXNlTmFtZSwgYXJncykge1xuXG4gICAgICAgICAgICB2YXIgbmV3U2VyaWFsaXphdGlvbiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3dhcm1TZXJpYWxpc2F0aW9uKSk7XG4gICAgICAgICAgICBuZXdTZXJpYWxpemF0aW9uLm1ldGEuY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG5ld1NlcmlhbGl6YXRpb24ubWV0YS5waGFzZU5hbWUgPSBwaGFzZU5hbWU7XG4gICAgICAgICAgICBuZXdTZXJpYWxpemF0aW9uLm1ldGEudGFyZ2V0ID0gXCJpZnJhbWVcIjtcbiAgICAgICAgICAgIG5ld1NlcmlhbGl6YXRpb24ubWV0YS5hcmdzID0gYXJncztcbiAgICAgICAgICAgIGNoaWxkTWVzc2FnZU1RLnByb2R1Y2UobmV3U2VyaWFsaXphdGlvbik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2hpbGRNZXNzYWdlTVEucmVnaXN0ZXJDYWxsYmFjayhzd2FybUhhbmRsZXIubWV0YS5yZXF1ZXN0SWQsIGNhbGxiYWNrKTtcbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZCFcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICB2YXIgc3BhY2UgPSBzd2FybUludGVyYWN0Lm5ld0ludGVyYWN0aW9uU3BhY2UoY29tbSk7XG4gICAgdGhpcy5zdGFydFN3YXJtID0gZnVuY3Rpb24gKG5hbWUsIGN0b3IsIC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHNwYWNlLnN0YXJ0U3dhcm0obmFtZSwgY3RvciwgLi4uYXJncyk7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBjaGlsZE1lc3NhZ2VNUS5yZWdpc3RlckNvbnN1bWVyKGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHN3YXJtO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEubWV0YSAmJiBkYXRhLm1ldGEuc3dhcm1JZCAmJiBzd2FybUluc3RhbmNlc1tkYXRhLm1ldGEuc3dhcm1JZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3dhcm0gPSBzd2FybUluc3RhbmNlc1tkYXRhLm1ldGEuc3dhcm1JZF07XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtLnVwZGF0ZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc3dhcm1bZGF0YS5tZXRhLnBoYXNlTmFtZV0uYXBwbHkoc3dhcm0sIGRhdGEubWV0YS5hcmdzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHN3YXJtID0gJCQuc3dhcm0uc3RhcnQoZGF0YS5tZXRhLnN3YXJtVHlwZU5hbWUsIGRhdGEubWV0YS5jdG9yLCAuLi5kYXRhLm1ldGEuYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtLnNldE1ldGFkYXRhKFwicmVxdWVzdElkXCIsIGRhdGEubWV0YS5yZXF1ZXN0SWQpO1xuICAgICAgICAgICAgICAgICAgICBzd2FybUluc3RhbmNlc1tzd2FybS5nZXRJbm5lclZhbHVlKCkubWV0YS5zd2FybUlkXSA9IHN3YXJtO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3YXJtLm9uUmV0dXJuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN3YXJtIGlzIGZpbmlzaGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZSh7d2ViVmlld0lzUmVhZHk6IHRydWV9LCBcIipcIik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGhhbmRsZXIobWVzc2FnZSkge1xuICAgICAgICBsb2coXCJzZW5kaW5nIHN3YXJtIFwiLCBtZXNzYWdlKTtcbiAgICAgICAgY2hpbGRNZXNzYWdlTVEucHJvZHVjZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbnRlcmFjdGlvbnMobWVzc2FnZSkge1xuICAgICAgICBsb2coXCJjaGVja2luZyBpZiBtZXNzYWdlIGlzICdpbnRlcmFjdGlvbicgXCIsIG1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gbWVzc2FnZSAmJiBtZXNzYWdlLm1ldGEgJiYgbWVzc2FnZS5tZXRhLnRhcmdldCAmJiBtZXNzYWdlLm1ldGEudGFyZ2V0ID09PSBcImludGVyYWN0aW9uXCI7XG4gICAgfVxuXG4gICAgJCQuUFNLX1B1YlN1Yi5zdWJzY3JpYmUoJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04sIGhhbmRsZXIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSwgZmlsdGVySW50ZXJhY3Rpb25zKTtcbiAgICBsb2coXCJyZWdpc3RlcmluZyBsaXN0ZW5lciBmb3IgaGFuZGxpbmcgaW50ZXJhY3Rpb25zXCIpO1xuXG4gICAgZnVuY3Rpb24gbG9nKC4uLmFyZ3MpIHtcbiAgICAgICAgYXJncy51bnNoaWZ0KFwiW1dpbmRvd01RSW50ZXJhY3Rpb25TcGFjZVwiICsgKHdpbmRvdy5mcmFtZUVsZW1lbnQgPyBcIipcIiA6IFwiXCIpICsgXCJdXCIpO1xuICAgICAgICAvL2NvbnNvbGUubG9nLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSA9IGZ1bmN0aW9uIChjaGFubmVsTmFtZSwgY29tbXVuaWNhdGlvbldpbmRvdykge1xuICAgIHJldHVybiBuZXcgV2luZG93TVFJbnRlcmFjdGlvblNwYWNlKGNoYW5uZWxOYW1lLCBjb21tdW5pY2F0aW9uV2luZG93KTtcbn07XG4iLCJ2YXIgT3dNID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIikuT3dNO1xudmFyIHN3YXJtSW50ZXJhY3QgPSByZXF1aXJlKFwiLi8uLi9zd2FybUludGVyYWN0aW9uXCIpO1xudmFyIGZvbGRlck1RID0gcmVxdWlyZShcImZvbGRlcm1xXCIpO1xuXG5mdW5jdGlvbiBGb2xkZXJNUUludGVyYWN0aW9uU3BhY2UoYWdlbnQsIHRhcmdldEZvbGRlciwgcmV0dXJuRm9sZGVyKSB7XG4gICAgdmFyIHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVycyA9IHt9O1xuICAgIHZhciBxdWV1ZUhhbmRsZXIgPSBudWxsO1xuICAgIHZhciByZXNwb25zZVF1ZXVlID0gbnVsbDtcblxuICAgIHZhciBxdWV1ZSA9IGZvbGRlck1RLmNyZWF0ZVF1ZSh0YXJnZXRGb2xkZXIsIChlcnIgLCByZXN1bHQpID0+IHtcbiAgICAgICAgaWYoZXJyKXtcbiAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVTd2FybVBhY2soc3dhcm1OYW1lLCBwaGFzZU5hbWUsIC4uLmFyZ3Mpe1xuICAgICAgICB2YXIgc3dhcm0gPSBuZXcgT3dNKCk7XG5cbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInN3YXJtSWRcIiwgJCQudWlkR2VuZXJhdG9yLnNhZmVfdXVpZCgpKTtcblxuICAgICAgICBzd2FybS5zZXRNZXRhKFwicmVxdWVzdElkXCIsIHN3YXJtLmdldE1ldGEoXCJzd2FybUlkXCIpKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInN3YXJtVHlwZU5hbWVcIiwgc3dhcm1OYW1lKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInBoYXNlTmFtZVwiLCBwaGFzZU5hbWUpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiYXJnc1wiLCBhcmdzKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcImNvbW1hbmRcIiwgXCJleGVjdXRlU3dhcm1QaGFzZVwiKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInRhcmdldFwiLCBhZ2VudCk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJob21lU2VjdXJpdHlDb250ZXh0XCIsIHJldHVybkZvbGRlcik7XG5cbiAgICAgICAgcmV0dXJuIHN3YXJtO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoaW5nU3dhcm1zKGVyciwgc3dhcm0pe1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHN1YnNMaXN0ID0gc3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtLm1ldGEuc3dhcm1JZF07XG4gICAgICAgICAgICBpZihzdWJzTGlzdCl7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBpPTA7IGk8c3Vic0xpc3QubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgICAgICBsZXQgaGFuZGxlciA9IHN1YnNMaXN0W2ldO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyKG51bGwsIHN3YXJtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDEpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluaXQoKXtcbiAgICAgICAgaWYoIXF1ZXVlSGFuZGxlcil7XG4gICAgICAgICAgICBxdWV1ZUhhbmRsZXIgPSBxdWV1ZS5nZXRIYW5kbGVyKCk7XG4gICAgICAgIH1cbiAgICB9XG5cdFxuXHRpbml0KCk7XG5cbiAgICBmdW5jdGlvbiBwcmVwYXJlVG9Db25zdW1lKCl7XG4gICAgICAgIGlmKCFyZXNwb25zZVF1ZXVlKXtcbiAgICAgICAgICAgIHJlc3BvbnNlUXVldWUgPSBmb2xkZXJNUS5jcmVhdGVRdWUocmV0dXJuRm9sZGVyKTtcbiAgICAgICAgICAgIHJlc3BvbnNlUXVldWUucmVnaXN0ZXJDb25zdW1lcihkaXNwYXRjaGluZ1N3YXJtcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY29tbXVuaWNhdGlvbiA9IHtcbiAgICAgICAgc3RhcnRTd2FybTogZnVuY3Rpb24gKHN3YXJtTmFtZSwgY3RvciwgYXJncykge1xuICAgICAgICAgICAgcHJlcGFyZVRvQ29uc3VtZSgpO1xuICAgICAgICAgICAgdmFyIHN3YXJtID0gY3JlYXRlU3dhcm1QYWNrKHN3YXJtTmFtZSwgY3RvciwgLi4uYXJncyk7XG4gICAgICAgICAgICBxdWV1ZUhhbmRsZXIuc2VuZFN3YXJtRm9yRXhlY3V0aW9uKHN3YXJtKTtcbiAgICAgICAgICAgIHJldHVybiBzd2FybTtcbiAgICAgICAgfSxcbiAgICAgICAgY29udGludWVTd2FybTogZnVuY3Rpb24gKHN3YXJtSGFuZGxlciwgc3dhcm1TZXJpYWxpc2F0aW9uLCBjdG9yLCAuLi5hcmdzKSB7XG4gICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgc3dhcm1IYW5kbGVyLnVwZGF0ZShzd2FybVNlcmlhbGlzYXRpb24pO1xuICAgICAgICAgICAgICAgIHN3YXJtSGFuZGxlcltjdG9yXS5hcHBseShzd2FybUhhbmRsZXIsIGFyZ3MpO1xuICAgICAgICAgICAgfWNhdGNoKGVycil7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb246IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBwcmVwYXJlVG9Db25zdW1lKCk7XG5cbiAgICAgICAgICAgIGlmKCFzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnNbc3dhcm1IYW5kbGVyLm1ldGEuc3dhcm1JZF0pe1xuICAgICAgICAgICAgICAgIHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIubWV0YS5zd2FybUlkXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5tZXRhLnN3YXJtSWRdLnB1c2goY2FsbGJhY2spO1xuXG4gICAgICAgIH0sXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKHN3YXJtSGFuZGxlcikge1xuICAgICAgICAgICAgc3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5tZXRhLnN3YXJtSWRdID0gW107XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHN3YXJtSW50ZXJhY3QubmV3SW50ZXJhY3Rpb25TcGFjZShjb21tdW5pY2F0aW9uKTtcbn1cblxudmFyIHNwYWNlcyA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVJbnRlcmFjdGlvblNwYWNlID0gZnVuY3Rpb24gKGFnZW50LCB0YXJnZXRGb2xkZXIsIHJldHVybkZvbGRlcikge1xuICAgIHZhciBpbmRleCA9IHRhcmdldEZvbGRlcityZXR1cm5Gb2xkZXI7XG4gICAgaWYoIXNwYWNlc1tpbmRleF0pe1xuICAgICAgICBzcGFjZXNbaW5kZXhdID0gbmV3IEZvbGRlck1RSW50ZXJhY3Rpb25TcGFjZShhZ2VudCwgdGFyZ2V0Rm9sZGVyLCByZXR1cm5Gb2xkZXIpO1xuICAgIH1lbHNle1xuICAgICAgICBjb25zb2xlLmxvZyhgRm9sZGVyTVEgaW50ZXJhY3Rpb24gc3BhY2UgYmFzZWQgb24gWyR7dGFyZ2V0Rm9sZGVyfSwgJHtyZXR1cm5Gb2xkZXJ9XSBhbHJlYWR5IGV4aXN0cyFgKTtcbiAgICB9XG4gICAgcmV0dXJuIHNwYWNlc1tpbmRleF07XG59OyIsInJlcXVpcmUoJ3Bzay1odHRwLWNsaWVudCcpO1xuXG5mdW5jdGlvbiBIVFRQSW50ZXJhY3Rpb25TcGFjZShhbGlhcywgcmVtb3RlRW5kUG9pbnQsIGFnZW50VWlkLCBjcnlwdG9JbmZvKSB7XG4gICAgY29uc3Qgc3dhcm1JbnRlcmFjdCA9IHJlcXVpcmUoXCIuLy4uL3N3YXJtSW50ZXJhY3Rpb25cIik7XG5cbiAgICBsZXQgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICBmdW5jdGlvbiBpbml0KCl7XG4gICAgICAgIGlmKCFpbml0aWFsaXplZCl7XG4gICAgICAgICAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgICAgICAkJC5yZW1vdGUuY3JlYXRlUmVxdWVzdE1hbmFnZXIoKTtcbiAgICAgICAgICAgICQkLnJlbW90ZS5uZXdFbmRQb2ludChhbGlhcywgcmVtb3RlRW5kUG9pbnQsIGFnZW50VWlkLCBjcnlwdG9JbmZvKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbW0gPSB7XG4gICAgICAgIHN0YXJ0U3dhcm06IGZ1bmN0aW9uIChzd2FybU5hbWUsIGN0b3IsIGFyZ3MpIHtcbiAgICAgICAgICAgIGluaXQoKTtcbiAgICAgICAgICAgIHJldHVybiAkJC5yZW1vdGVbYWxpYXNdLnN0YXJ0U3dhcm0oc3dhcm1OYW1lLCBjdG9yLCAuLi5hcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgY29udGludWVTd2FybTogZnVuY3Rpb24gKHN3YXJtSGFuZGxlciwgc3dhcm1TZXJpYWxpc2F0aW9uLCBjdG9yLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gJCQucmVtb3RlW2FsaWFzXS5jb250aW51ZVN3YXJtKHN3YXJtU2VyaWFsaXNhdGlvbiwgY3RvciwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgc3dhcm1IYW5kbGVyLm9uKCcqJywgY2FsbGJhY2spO1xuICAgICAgICB9LFxuICAgICAgICBvZmY6IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHN3YXJtSGFuZGxlci5vZmYoJyonKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gc3dhcm1JbnRlcmFjdC5uZXdJbnRlcmFjdGlvblNwYWNlKGNvbW0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVJbnRlcmFjdGlvblNwYWNlID0gZnVuY3Rpb24gKGFsaWFzLCByZW1vdGVFbmRQb2ludCwgYWdlbnRVaWQsIGNyeXB0b0luZm8pIHtcbiAgICAvL3NpbmdsZXRvblxuICAgIHJldHVybiBuZXcgSFRUUEludGVyYWN0aW9uU3BhY2UoYWxpYXMsIHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgY3J5cHRvSW5mbyk7XG59OyIsInZhciBjaGFubmVsc1JlZ2lzdHJ5ID0ge307IC8va2VlcHMgY2FsbGJhY2tzIGZvciBjb25zdW1lcnMgYW5kIHdpbmRvd3MgcmVmZXJlbmNlcyBmb3IgcHJvZHVjZXJzXG52YXIgY2FsbGJhY2tzUmVnaXN0cnkgPSB7fTtcblxuZnVuY3Rpb24gZGlzcGF0Y2hFdmVudChldmVudCkge1xuICAgIHZhciBzd2FybSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgaWYoc3dhcm0ubWV0YSl7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1JlZ2lzdHJ5W3N3YXJtLm1ldGEuY2hhbm5lbE5hbWVdO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBzd2FybSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuXG5mdW5jdGlvbiBDaGlsZFduZE1RKGNoYW5uZWxOYW1lLCBtYWluV2luZG93LCBzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCkge1xuICAgIC8vY2hhbm5lbCBuYW1lIGlzXG5cbiAgICBjaGFubmVsc1JlZ2lzdHJ5W2NoYW5uZWxOYW1lXSA9IG1haW5XaW5kb3c7XG5cbiAgICB0aGlzLnByb2R1Y2UgPSBmdW5jdGlvbiAoc3dhcm1Nc2cpIHtcbiAgICAgICAgc3dhcm1Nc2cubWV0YS5jaGFubmVsTmFtZSA9IGNoYW5uZWxOYW1lO1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIG1ldGE6c3dhcm1Nc2cubWV0YSxcbiAgICAgICAgICAgIHB1YmxpY1ZhcnM6c3dhcm1Nc2cucHVibGljVmFycyxcbiAgICAgICAgICAgIHByaXZhdGVWYXJzOnN3YXJtTXNnLnByaXZhdGVWYXJzXG4gICAgICAgIH07XG5cbiAgICAgICAgbWVzc2FnZS5tZXRhLmFyZ3MgPSBtZXNzYWdlLm1ldGEuYXJncy5tYXAoZnVuY3Rpb24gKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnQgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IHt9O1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudC5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yW1wibWVzc2FnZVwiXSA9IGFyZ3VtZW50Lm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudC5jb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yW1wiY29kZVwiXSA9IGFyZ3VtZW50LmNvZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1haW5XaW5kb3cucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSksIFwiKlwiKTtcbiAgICB9O1xuXG4gICAgdmFyIGNvbnN1bWVyO1xuXG4gICAgdGhpcy5yZWdpc3RlckNvbnN1bWVyID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBzaG91bGREZWxldGVBZnRlclJlYWQgPSB0cnVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb25zdW1lcikge1xuICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG9uZSBjb25zdW1lciBpcyBhbGxvd2VkIVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN1bWVyID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrc1JlZ2lzdHJ5W2NoYW5uZWxOYW1lXSA9IGNvbnN1bWVyO1xuXG4gICAgICAgIGlmIChzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCAmJiB0eXBlb2Ygc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZGlzcGF0Y2hFdmVudCk7XG4gICAgICAgIH1cbiAgICAgIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlTVEgPSBmdW5jdGlvbiBjcmVhdGVNUShjaGFubmVsTmFtZSwgd25kLCBzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCl7XG4gICAgcmV0dXJuIG5ldyBDaGlsZFduZE1RKGNoYW5uZWxOYW1lLCB3bmQsIHNlY29uZENvbW11bmljYXRpb25DaGFubmVsKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMuaW5pdEZvclN3YXJtaW5nSW5DaGlsZCA9IGZ1bmN0aW9uKGRvbWFpbk5hbWUpe1xuXG4gICAgdmFyIHB1YlN1YiA9ICQkLnJlcXVpcmUoXCJzb3VuZHB1YnN1YlwiKS5zb3VuZFB1YlN1YjtcblxuICAgIHZhciBpbmJvdW5kID0gY3JlYXRlTVEoZG9tYWluTmFtZStcIi9pbmJvdW5kXCIpO1xuICAgIHZhciBvdXRib3VuZCA9IGNyZWF0ZU1RKGRvbWFpbk5hbWUrXCIvb3V0Ym91bmRcIik7XG5cblxuICAgIGluYm91bmQucmVnaXN0ZXJDb25zdW1lcihmdW5jdGlvbihlcnIsIHN3YXJtKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgICAgICAvL3Jlc3RvcmUgYW5kIGV4ZWN1dGUgdGhpcyB0YXN0eSBzd2FybVxuICAgICAgICBnbG9iYWwuJCQuc3dhcm1zSW5zdGFuY2VzTWFuYWdlci5yZXZpdmVfc3dhcm0oc3dhcm0pO1xuICAgIH0pO1xuXG4gICAgcHViU3ViLnN1YnNjcmliZSgkJC5DT05TVEFOVFMuU1dBUk1fRk9SX0VYRUNVVElPTiwgZnVuY3Rpb24oc3dhcm0pe1xuICAgICAgICBvdXRib3VuZC5zZW5kU3dhcm1Gb3JFeGVjdXRpb24oc3dhcm0pO1xuICAgIH0pO1xufTtcblxuIiwidmFyIGNoYW5uZWxzUmVnaXN0cnkgPSB7fTsgLy9rZWVwcyBjYWxsYmFja3MgZm9yIGNvbnN1bWVycyBhbmQgd2luZG93cyByZWZlcmVuY2VzIGZvciBwcm9kdWNlcnNcbnZhciBjYWxsYmFja3NSZWdpc3RyeSA9IHt9O1xudmFyIHN3YXJtQ2FsbGJhY2tzID0ge307XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoZXZlbnQpIHtcblxuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdykge1xuXG4gICAgICAgIHZhciBzd2FybSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgICAgaWYgKHN3YXJtLm1ldGEpIHtcbiAgICAgICAgICAgIGxldCBjYWxsYmFjaztcbiAgICAgICAgICAgIGlmICghc3dhcm0ubWV0YS5yZXF1ZXN0SWQgfHwgIXN3YXJtQ2FsbGJhY2tzW3N3YXJtLm1ldGEucmVxdWVzdElkXSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2tzUmVnaXN0cnlbc3dhcm0ubWV0YS5jaGFubmVsTmFtZV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHN3YXJtQ2FsbGJhY2tzW3N3YXJtLm1ldGEucmVxdWVzdElkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHN3YXJtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuZnVuY3Rpb24gQ2hpbGRXbmRNUShjaGFubmVsTmFtZSwgbWFpbldpbmRvdykge1xuICAgIC8vY2hhbm5lbCBuYW1lIGlzXG5cbiAgICBjaGFubmVsc1JlZ2lzdHJ5W2NoYW5uZWxOYW1lXSA9IG1haW5XaW5kb3c7XG5cbiAgICB0aGlzLnByb2R1Y2UgPSBmdW5jdGlvbiAoc3dhcm1Nc2cpIHtcbiAgICAgICAgc3dhcm1Nc2cubWV0YS5jaGFubmVsTmFtZSA9IGNoYW5uZWxOYW1lO1xuICAgICAgICB2YXIgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIG1ldGE6IHN3YXJtTXNnLm1ldGEsXG4gICAgICAgICAgICBwdWJsaWNWYXJzOiBzd2FybU1zZy5wdWJsaWNWYXJzLFxuICAgICAgICAgICAgcHJpdmF0ZVZhcnM6IHN3YXJtTXNnLnByaXZhdGVWYXJzXG4gICAgICAgIH07XG4gICAgICAgIC8vY29uc29sZS5sb2coc3dhcm1Nc2cuZ2V0SlNPTigpKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhzd2FybU1zZy52YWx1ZU9mKCkpO1xuICAgICAgICBtZXNzYWdlLm1ldGEuYXJncyA9IG1lc3NhZ2UubWV0YS5hcmdzLm1hcChmdW5jdGlvbiAoYXJndW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVycm9yID0ge307XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50Lm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JbXCJtZXNzYWdlXCJdID0gYXJndW1lbnQubWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50LmNvZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JbXCJjb2RlXCJdID0gYXJndW1lbnQuY29kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50O1xuICAgICAgICB9KTtcbiAgICAgICAgbWFpbldpbmRvdy5wb3N0TWVzc2FnZShtZXNzYWdlLCBcIipcIik7XG4gICAgfTtcblxuICAgIHZhciBjb25zdW1lcjtcblxuICAgIHRoaXMucmVnaXN0ZXJDb25zdW1lciA9IGZ1bmN0aW9uIChjYWxsYmFjaywgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkID0gdHJ1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uc3VtZXIpIHtcbiAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihcIk9ubHkgb25lIGNvbnN1bWVyIGlzIGFsbG93ZWQhXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3VtZXIgPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2tzUmVnaXN0cnlbY2hhbm5lbE5hbWVdID0gY29uc3VtZXI7XG4gICAgICAgIG1haW5XaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZGlzcGF0Y2hFdmVudCk7XG4gICAgfTtcblxuICAgIHRoaXMucmVnaXN0ZXJDYWxsYmFjayA9IGZ1bmN0aW9uIChyZXF1ZXN0SWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIHN3YXJtQ2FsbGJhY2tzW3JlcXVlc3RJZF0gPSBjYWxsYmFjaztcbiAgICAgICAgY2FsbGJhY2tzUmVnaXN0cnlbY2hhbm5lbE5hbWVdID0gY2FsbGJhY2s7XG4gICAgICAgIG1haW5XaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgZGlzcGF0Y2hFdmVudCk7XG4gICAgfTtcblxufVxuXG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZU1RID0gZnVuY3Rpb24gY3JlYXRlTVEoY2hhbm5lbE5hbWUsIHduZCkge1xuICAgIHJldHVybiBuZXcgQ2hpbGRXbmRNUShjaGFubmVsTmFtZSwgd25kKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMuaW5pdEZvclN3YXJtaW5nSW5DaGlsZCA9IGZ1bmN0aW9uIChkb21haW5OYW1lKSB7XG5cbiAgICB2YXIgcHViU3ViID0gJCQucmVxdWlyZShcInNvdW5kcHVic3ViXCIpLnNvdW5kUHViU3ViO1xuXG4gICAgdmFyIGluYm91bmQgPSBjcmVhdGVNUShkb21haW5OYW1lICsgXCIvaW5ib3VuZFwiKTtcbiAgICB2YXIgb3V0Ym91bmQgPSBjcmVhdGVNUShkb21haW5OYW1lICsgXCIvb3V0Ym91bmRcIik7XG5cblxuICAgIGluYm91bmQucmVnaXN0ZXJDb25zdW1lcihmdW5jdGlvbiAoZXJyLCBzd2FybSkge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIC8vcmVzdG9yZSBhbmQgZXhlY3V0ZSB0aGlzIHRhc3R5IHN3YXJtXG4gICAgICAgIGdsb2JhbC4kJC5zd2FybXNJbnN0YW5jZXNNYW5hZ2VyLnJldml2ZV9zd2FybShzd2FybSk7XG4gICAgfSk7XG5cbiAgICBwdWJTdWIuc3Vic2NyaWJlKCQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OLCBmdW5jdGlvbiAoc3dhcm0pIHtcbiAgICAgICAgb3V0Ym91bmQuc2VuZFN3YXJtRm9yRXhlY3V0aW9uKHN3YXJtKTtcbiAgICB9KTtcbn07XG5cbiIsImlmICh0eXBlb2YgJCQgPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICQkID0ge307XG59XG5cbmZ1bmN0aW9uIFZpcnR1YWxTd2FybShpbm5lck9iaiwgZ2xvYmFsSGFuZGxlcil7XG4gICAgbGV0IGtub3duRXh0cmFQcm9wcyA9IFsgXCJzd2FybVwiIF07XG5cbiAgICBmdW5jdGlvbiBidWlsZEhhbmRsZXIoKSB7XG4gICAgICAgIHZhciB1dGlsaXR5ID0ge307XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh0YXJnZXQsIHByb3BlcnR5LCB2YWx1ZSwgcmVjZWl2ZXIpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0YXJnZXQucHJpdmF0ZVZhcnMgJiYgdGFyZ2V0LnByaXZhdGVWYXJzLmhhc093blByb3BlcnR5KHByb3BlcnR5KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5wcml2YXRlVmFyc1twcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRhcmdldC5wdWJsaWNWYXJzICYmIHRhcmdldC5wdWJsaWNWYXJzLmhhc093blByb3BlcnR5KHByb3BlcnR5KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldC5wdWJsaWNWYXJzW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGFyZ2V0Lmhhc093blByb3BlcnR5KHByb3BlcnR5KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIGtub3duRXh0cmFQcm9wcy5pbmRleE9mKHByb3BlcnR5KSA9PT0gLTE6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWdsb2JhbEhhbmRsZXIucHJvdGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsSGFuZGxlci5wcm90ZWN0ZWQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbEhhbmRsZXIucHJvdGVjdGVkW3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlsaXR5W3Byb3BlcnR5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICh0YXJnZXQsIHByb3BlcnR5LCByZWNlaXZlcikge1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGFyZ2V0LnB1YmxpY1ZhcnMgJiYgdGFyZ2V0LnB1YmxpY1ZhcnMuaGFzT3duUHJvcGVydHkocHJvcGVydHkpOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5wdWJsaWNWYXJzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0YXJnZXQucHJpdmF0ZVZhcnMgJiYgdGFyZ2V0LnByaXZhdGVWYXJzLmhhc093blByb3BlcnR5KHByb3BlcnR5KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXQucHJpdmF0ZVZhcnNbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0W3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBnbG9iYWxIYW5kbGVyLnByb3RlY3RlZCAmJiBnbG9iYWxIYW5kbGVyLnByb3RlY3RlZC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2xvYmFsSGFuZGxlci5wcm90ZWN0ZWRbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHV0aWxpdHkuaGFzT3duUHJvcGVydHkocHJvcGVydHkpOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHV0aWxpdHlbcHJvcGVydHldO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm94eShpbm5lck9iaiwgYnVpbGRIYW5kbGVyKCkpO1xufVxuXG5mdW5jdGlvbiBTd2FybUludGVyYWN0aW9uKGNvbW11bmljYXRpb25JbnRlcmZhY2UsIHN3YXJtTmFtZSwgY3RvciwgYXJncykge1xuXG4gICAgdmFyIHN3YXJtSGFuZGxlciA9IGNvbW11bmljYXRpb25JbnRlcmZhY2Uuc3RhcnRTd2FybShzd2FybU5hbWUsIGN0b3IsIGFyZ3MpO1xuXG4gICAgdGhpcy5vbiA9IGZ1bmN0aW9uKGRlc2NyaXB0aW9uKXtcbiAgICAgICAgY29tbXVuaWNhdGlvbkludGVyZmFjZS5vbihzd2FybUhhbmRsZXIsIGZ1bmN0aW9uKGVyciwgc3dhcm1TZXJpYWxpc2F0aW9uKXtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHBoYXNlID0gZGVzY3JpcHRpb25bc3dhcm1TZXJpYWxpc2F0aW9uLm1ldGEucGhhc2VOYW1lXTtcbiAgICAgICAgICAgIGxldCB2aXJ0dWFsU3dhcm0gPSBuZXcgVmlydHVhbFN3YXJtKHN3YXJtU2VyaWFsaXNhdGlvbiwgc3dhcm1IYW5kbGVyKTtcblxuICAgICAgICAgICAgaWYoIXBoYXNlKXtcbiAgICAgICAgICAgICAgICAvL1RPRE8gcmV2aWV3IGFuZCBmaXguIEZpeCBjYXNlIHdoZW4gYW4gaW50ZXJhY3Rpb24gaXMgc3RhcnRlZCBmcm9tIGFub3RoZXIgaW50ZXJhY3Rpb25cbiAgICAgICAgICAgICAgICBpZihzd2FybUhhbmRsZXIgJiYgKCFzd2FybUhhbmRsZXIuVGFyZ2V0IHx8IHN3YXJtSGFuZGxlci5UYXJnZXQuc3dhcm1JZCAhPT0gc3dhcm1TZXJpYWxpc2F0aW9uLm1ldGEuc3dhcm1JZCkpe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vdCBteSBzd2FybSFcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGludGVyYWN0UGhhc2VFcnIgPSAgbmV3IEVycm9yKFwiSW50ZXJhY3QgbWV0aG9kIFwiK3N3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLnBoYXNlTmFtZStcIiB3YXMgbm90IGZvdW5kLlwiKTtcbiAgICAgICAgICAgICAgICBpZihkZXNjcmlwdGlvbltcIm9uRXJyb3JcIl0pe1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbltcIm9uRXJyb3JcIl0uY2FsbCh2aXJ0dWFsU3dhcm0sIGludGVyYWN0UGhhc2VFcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGludGVyYWN0UGhhc2VFcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2aXJ0dWFsU3dhcm0uc3dhcm0gPSBmdW5jdGlvbihwaGFzZU5hbWUsIC4uLmFyZ3Mpe1xuICAgICAgICAgICAgICAgIGNvbW11bmljYXRpb25JbnRlcmZhY2UuY29udGludWVTd2FybShzd2FybUhhbmRsZXIsIHN3YXJtU2VyaWFsaXNhdGlvbiwgcGhhc2VOYW1lLCBhcmdzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHBoYXNlLmFwcGx5KHZpcnR1YWxTd2FybSwgc3dhcm1TZXJpYWxpc2F0aW9uLm1ldGEuYXJncyk7XG4gICAgICAgICAgICBpZih2aXJ0dWFsU3dhcm0ubWV0YS5jb21tYW5kID09PSBcImFzeW5jUmV0dXJuXCIpe1xuICAgICAgICAgICAgICAgIGNvbW11bmljYXRpb25JbnRlcmZhY2Uub2ZmKHN3YXJtSGFuZGxlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLm9uUmV0dXJuID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgICAgICB0aGlzLm9uKHtcbiAgICAgICAgICAgIF9fcmV0dXJuX186IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbnZhciBhYnN0cmFjdEludGVyYWN0aW9uU3BhY2UgPSB7XG4gICAgc3RhcnRTd2FybTogZnVuY3Rpb24gKHN3YXJtTmFtZSwgY3RvciwgYXJncykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgIFN3YXJtSW50ZXJhY3Rpb24ucHJvdG90eXBlLnN0YXJ0U3dhcm1cIik7XG4gICAgfSxcbiAgICByZXNlbmRTd2FybTogZnVuY3Rpb24gKHN3YXJtSW5zdGFuY2UsIHN3YXJtU2VyaWFsaXNhdGlvbiwgY3RvciwgYXJncykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgIFN3YXJtSW50ZXJhY3Rpb24ucHJvdG90eXBlLmNvbnRpbnVlU3dhcm0gXCIpO1xuICAgIH0sXG4gICAgb246IGZ1bmN0aW9uIChzd2FybUluc3RhbmNlLCBwaGFzZU5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJ3cml0ZSAgU3dhcm1JbnRlcmFjdGlvbi5wcm90b3R5cGUub25Td2FybVwiKTtcbiAgICB9LFxub2ZmOiBmdW5jdGlvbiAoc3dhcm1JbnN0YW5jZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgIFN3YXJtSW50ZXJhY3Rpb24ucHJvdG90eXBlLm9uU3dhcm1cIik7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMubmV3SW50ZXJhY3Rpb25TcGFjZSA9IGZ1bmN0aW9uIChjb21tdW5pY2F0aW9uSW50ZXJmYWNlKSB7XG5cbiAgICBpZighY29tbXVuaWNhdGlvbkludGVyZmFjZSkge1xuICAgICAgICBjb21tdW5pY2F0aW9uSW50ZXJmYWNlID0gYWJzdHJhY3RJbnRlcmFjdGlvblNwYWNlIDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhcnRTd2FybTogZnVuY3Rpb24gKHN3YXJtTmFtZSwgY3RvciwgLi4uYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTd2FybUludGVyYWN0aW9uKGNvbW11bmljYXRpb25JbnRlcmZhY2UsIHN3YXJtTmFtZSwgY3RvciwgYXJncyk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuIiwiY29uc3QgbXNncGFjayA9IHJlcXVpcmUoJ0Btc2dwYWNrL21zZ3BhY2snKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKiogIHV0aWxpdHkgY2xhc3MgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmZ1bmN0aW9uIFJlcXVlc3RNYW5hZ2VyKHBvbGxpbmdUaW1lT3V0KXtcbiAgICBpZighcG9sbGluZ1RpbWVPdXQpe1xuICAgICAgICBwb2xsaW5nVGltZU91dCA9IDEwMDA7IC8vMSBzZWNvbmQgYnkgZGVmYXVsdFxuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIFJlcXVlc3QoZW5kUG9pbnQsIGluaXRpYWxTd2FybSl7XG4gICAgICAgIHZhciBvblJldHVybkNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgb25FcnJvckNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB2YXIgb25DYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIHJlcXVlc3RJZCA9IGluaXRpYWxTd2FybS5tZXRhLnJlcXVlc3RJZDtcbiAgICAgICAgaW5pdGlhbFN3YXJtID0gbnVsbDtcblxuICAgICAgICB0aGlzLmdldFJlcXVlc3RJZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdElkO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub24gPSBmdW5jdGlvbihwaGFzZU5hbWUsIGNhbGxiYWNrKXtcbiAgICAgICAgICAgIGlmKHR5cGVvZiBwaGFzZU5hbWUgIT0gXCJzdHJpbmdcIiAgJiYgdHlwZW9mIGNhbGxiYWNrICE9IFwiZnVuY3Rpb25cIil7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgYSBzdHJpbmcgYW5kIHRoZSBzZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvbkNhbGxiYWNrcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjazpjYWxsYmFjayxcbiAgICAgICAgICAgICAgICBwaGFzZTpwaGFzZU5hbWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc2VsZi5wb2xsKGVuZFBvaW50LCB0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub25SZXR1cm4gPSBmdW5jdGlvbihjYWxsYmFjayl7XG4gICAgICAgICAgICBvblJldHVybkNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIHNlbGYucG9sbChlbmRQb2ludCwgdGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uRXJyb3IgPSBmdW5jdGlvbihjYWxsYmFjayl7XG4gICAgICAgICAgICBpZihvbkVycm9yQ2FsbGJhY2tzLmluZGV4T2YoY2FsbGJhY2spIT09LTEpe1xuICAgICAgICAgICAgICAgIG9uRXJyb3JDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGNhbGxiYWNrIGFscmVhZHkgcmVnaXN0ZXJlZCFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kaXNwYXRjaCA9IGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgIGlmKEFycmF5QnVmZmVyLmlzVmlldyhyZXN1bHQpIHx8IEJ1ZmZlci5pc0J1ZmZlcihyZXN1bHQpKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbXNncGFjay5kZWNvZGUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzdWx0ID0gdHlwZW9mIHJlc3VsdCA9PT0gXCJzdHJpbmdcIiA/IEpTT04ucGFyc2UocmVzdWx0KSA6IHJlc3VsdDtcblxuICAgICAgICAgICAgcmVzdWx0ID0gT3dNLnByb3RvdHlwZS5jb252ZXJ0KHJlc3VsdCk7XG4gICAgICAgICAgICB2YXIgcmVzdWx0UmVxSWQgPSByZXN1bHQuZ2V0TWV0YShcInJlcXVlc3RJZFwiKTtcbiAgICAgICAgICAgIHZhciBwaGFzZU5hbWUgPSByZXN1bHQuZ2V0TWV0YShcInBoYXNlTmFtZVwiKTtcbiAgICAgICAgICAgIHZhciBvblJldHVybiA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZihyZXN1bHRSZXFJZCA9PT0gcmVxdWVzdElkKXtcbiAgICAgICAgICAgICAgICBvblJldHVybkNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGMpe1xuICAgICAgICAgICAgICAgICAgICBjKG51bGwsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIG9uUmV0dXJuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZihvblJldHVybil7XG4gICAgICAgICAgICAgICAgICAgIG9uUmV0dXJuQ2FsbGJhY2tzID0gW107XG4gICAgICAgICAgICAgICAgICAgIG9uRXJyb3JDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBvbkNhbGxiYWNrcy5mb3JFYWNoKGZ1bmN0aW9uKGkpe1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwiWFhYWFhYWFg6XCIsIHBoYXNlTmFtZSAsIGkpO1xuICAgICAgICAgICAgICAgICAgICBpZihwaGFzZU5hbWUgPT09IGkucGhhc2UgfHwgaS5waGFzZSA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpLmNhbGxiYWNrKGVyciwgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihvblJldHVybkNhbGxiYWNrcy5sZW5ndGggPT09IDAgJiYgb25DYWxsYmFja3MubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgICAgICBzZWxmLnVucG9sbChlbmRQb2ludCwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kaXNwYXRjaEVycm9yID0gZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpIDwgb25FcnJvckNhbGxiYWNrcy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgdmFyIGVyckNiID0gb25FcnJvckNhbGxiYWNrc1tpXTtcbiAgICAgICAgICAgICAgICBlcnJDYihlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMub2ZmID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHNlbGYudW5wb2xsKGVuZFBvaW50LCB0aGlzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLmNyZWF0ZVJlcXVlc3QgPSBmdW5jdGlvbihyZW1vdGVFbmRQb2ludCwgc3dhcm0pe1xuICAgICAgICBsZXQgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHJlbW90ZUVuZFBvaW50LCBzd2FybSk7XG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgIH07XG5cbiAgICAvKiAqKioqKioqKioqKioqKioqKioqKioqKioqKiogcG9sbGluZyB6b25lICoqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbiAgICB2YXIgcG9sbFNldCA9IHtcbiAgICB9O1xuXG4gICAgdmFyIGFjdGl2ZUNvbm5lY3Rpb25zID0ge1xuICAgIH07XG5cbiAgICB0aGlzLnBvbGwgPSBmdW5jdGlvbihyZW1vdGVFbmRQb2ludCwgcmVxdWVzdCl7XG4gICAgICAgIHZhciByZXF1ZXN0cyA9IHBvbGxTZXRbcmVtb3RlRW5kUG9pbnRdO1xuICAgICAgICBpZighcmVxdWVzdHMpe1xuICAgICAgICAgICAgcmVxdWVzdHMgPSB7fTtcbiAgICAgICAgICAgIHBvbGxTZXRbcmVtb3RlRW5kUG9pbnRdID0gcmVxdWVzdHM7XG4gICAgICAgIH1cbiAgICAgICAgcmVxdWVzdHNbcmVxdWVzdC5nZXRSZXF1ZXN0SWQoKV0gPSByZXF1ZXN0O1xuICAgICAgICBwb2xsaW5nSGFuZGxlcigpO1xuICAgIH07XG5cbiAgICB0aGlzLnVucG9sbCA9IGZ1bmN0aW9uKHJlbW90ZUVuZFBvaW50LCByZXF1ZXN0KXtcbiAgICAgICAgdmFyIHJlcXVlc3RzID0gcG9sbFNldFtyZW1vdGVFbmRQb2ludF07XG4gICAgICAgIGlmKHJlcXVlc3RzKXtcbiAgICAgICAgICAgIGRlbGV0ZSByZXF1ZXN0c1tyZXF1ZXN0LmdldFJlcXVlc3RJZCgpXTtcbiAgICAgICAgICAgIGlmKE9iamVjdC5rZXlzKHJlcXVlc3RzKS5sZW5ndGggPT09IDApe1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVW5wb2xsaW5nIHdyb25nIHJlcXVlc3Q6XCIscmVtb3RlRW5kUG9pbnQsIHJlcXVlc3QpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVBvbGxUaHJlYWQocmVtb3RlRW5kUG9pbnQpe1xuICAgICAgICBmdW5jdGlvbiByZUFybSgpe1xuICAgICAgICAgICAgJCQucmVtb3RlLmRvSHR0cEdldChyZW1vdGVFbmRQb2ludCwgZnVuY3Rpb24oZXJyLCByZXMpe1xuICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0cyA9IHBvbGxTZXRbcmVtb3RlRW5kUG9pbnRdO1xuXG4gICAgICAgICAgICAgICAgaWYoZXJyKXtcbiAgICAgICAgICAgICAgICAgICAgZm9yKGxldCByZXFfaWQgaW4gcmVxdWVzdHMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVycl9oYW5kbGVyID0gcmVxdWVzdHNbcmVxX2lkXS5kaXNwYXRjaEVycm9yO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZXJyX2hhbmRsZXIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycl9oYW5kbGVyKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlQ29ubmVjdGlvbnNbcmVtb3RlRW5kUG9pbnRdID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoQnVmZmVyLmlzQnVmZmVyKHJlcykgfHwgQXJyYXlCdWZmZXIuaXNWaWV3KHJlcykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IG1zZ3BhY2suZGVjb2RlKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gcmVxdWVzdHMpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHNba10uZGlzcGF0Y2gobnVsbCwgcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmKE9iamVjdC5rZXlzKHJlcXVlc3RzKS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlQXJtKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgYWN0aXZlQ29ubmVjdGlvbnNbcmVtb3RlRW5kUG9pbnRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFbmRpbmcgcG9sbGluZyBmb3IgXCIsIHJlbW90ZUVuZFBvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJlQXJtKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9sbGluZ0hhbmRsZXIoKXtcbiAgICAgICAgbGV0IHNldFRpbWVyID0gZmFsc2U7XG4gICAgICAgIGZvcih2YXIgdiBpbiBwb2xsU2V0KXtcbiAgICAgICAgICAgIGlmKCFhY3RpdmVDb25uZWN0aW9uc1t2XSl7XG4gICAgICAgICAgICAgICAgY3JlYXRlUG9sbFRocmVhZCh2KTtcbiAgICAgICAgICAgICAgICBhY3RpdmVDb25uZWN0aW9uc1t2XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZXRUaW1lciA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc2V0VGltZXIpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQocG9sbGluZ0hhbmRsZXIsIHBvbGxpbmdUaW1lT3V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFRpbWVvdXQoIHBvbGxpbmdIYW5kbGVyLCBwb2xsaW5nVGltZU91dCk7XG59XG5cblxuZnVuY3Rpb24gZXh0cmFjdERvbWFpbkFnZW50RGV0YWlscyh1cmwpe1xuICAgIGNvbnN0IHZSZWdleCA9IC8oW2EtekEtWjAtOV0qfC4pKlxcL2FnZW50XFwvKFthLXpBLVowLTldKyhcXC8pKikrL2c7XG5cbiAgICBpZighdXJsLm1hdGNoKHZSZWdleCkpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGZvcm1hdC4gKEVnLiBkb21haW5bLnN1YmRvbWFpbl0qL2FnZW50L1tvcmdhbmlzYXRpb24vXSphZ2VudElkKVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXZpZGVyID0gXCIvYWdlbnQvXCI7XG4gICAgbGV0IGRvbWFpbjtcbiAgICBsZXQgYWdlbnRVcmw7XG5cbiAgICBjb25zdCBzcGxpdFBvaW50ID0gdXJsLmluZGV4T2YoZGV2aWRlcik7XG4gICAgaWYoc3BsaXRQb2ludCAhPT0gLTEpe1xuICAgICAgICBkb21haW4gPSB1cmwuc2xpY2UoMCwgc3BsaXRQb2ludCk7XG4gICAgICAgIGFnZW50VXJsID0gdXJsLnNsaWNlKHNwbGl0UG9pbnQrZGV2aWRlci5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiB7ZG9tYWluLCBhZ2VudFVybH07XG59XG5cbmZ1bmN0aW9uIHVybEVuZFdpdGhTbGFzaCh1cmwpe1xuXG4gICAgaWYodXJsW3VybC5sZW5ndGggLSAxXSAhPT0gXCIvXCIpe1xuICAgICAgICB1cmwgKz0gXCIvXCI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVybDtcbn1cblxuY29uc3QgT3dNID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIikuT3dNO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKiBtYWluIEFQSXMgb24gd29ya2luZyB3aXRoIHJlbW90ZSBlbmQgcG9pbnRzICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5mdW5jdGlvbiBQc2tIdHRwQ2xpZW50KHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgb3B0aW9ucyl7XG4gICAgdmFyIGJhc2VPZlJlbW90ZUVuZFBvaW50ID0gcmVtb3RlRW5kUG9pbnQ7IC8vcmVtb3ZlIGxhc3QgaWRcblxuICAgIHJlbW90ZUVuZFBvaW50ID0gdXJsRW5kV2l0aFNsYXNoKHJlbW90ZUVuZFBvaW50KTtcblxuICAgIC8vZG9tYWluSW5mbyBjb250YWlucyAyIG1lbWJlcnM6IGRvbWFpbiAocHJpdmF0ZVNreSBkb21haW4pIGFuZCBhZ2VudFVybFxuICAgIGNvbnN0IGRvbWFpbkluZm8gPSBleHRyYWN0RG9tYWluQWdlbnREZXRhaWxzKGFnZW50VWlkKTtcbiAgICBsZXQgaG9tZVNlY3VyaXR5Q29udGV4dCA9IGRvbWFpbkluZm8uYWdlbnRVcmw7XG4gICAgbGV0IHJldHVyblJlbW90ZUVuZFBvaW50ID0gcmVtb3RlRW5kUG9pbnQ7XG5cbiAgICBpZihvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zLnJldHVyblJlbW90ZSAhPSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgcmV0dXJuUmVtb3RlRW5kUG9pbnQgPSBvcHRpb25zLnJldHVyblJlbW90ZTtcbiAgICB9XG5cbiAgICBpZighb3B0aW9ucyB8fCBvcHRpb25zICYmICh0eXBlb2Ygb3B0aW9ucy51bmlxdWVJZCA9PSBcInVuZGVmaW5lZFwiIHx8IG9wdGlvbnMudW5pcXVlSWQpKXtcbiAgICAgICAgaG9tZVNlY3VyaXR5Q29udGV4dCArPSBcIl9cIitNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSk7XG4gICAgfVxuXG4gICAgcmV0dXJuUmVtb3RlRW5kUG9pbnQgPSB1cmxFbmRXaXRoU2xhc2gocmV0dXJuUmVtb3RlRW5kUG9pbnQpO1xuXG4gICAgdGhpcy5zdGFydFN3YXJtID0gZnVuY3Rpb24oc3dhcm1OYW1lLCBwaGFzZU5hbWUsIC4uLmFyZ3Mpe1xuICAgICAgICBjb25zdCBzd2FybSA9IG5ldyBPd00oKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInN3YXJtSWRcIiwgJCQudWlkR2VuZXJhdG9yLnNhZmVfdXVpZCgpKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInJlcXVlc3RJZFwiLCBzd2FybS5nZXRNZXRhKFwic3dhcm1JZFwiKSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJzd2FybVR5cGVOYW1lXCIsIHN3YXJtTmFtZSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJwaGFzZU5hbWVcIiwgcGhhc2VOYW1lKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcImFyZ3NcIiwgYXJncyk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJjb21tYW5kXCIsIFwiZXhlY3V0ZVN3YXJtUGhhc2VcIik7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJ0YXJnZXRcIiwgZG9tYWluSW5mby5hZ2VudFVybCk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJob21lU2VjdXJpdHlDb250ZXh0XCIsIHJldHVyblJlbW90ZUVuZFBvaW50KyQkLnJlbW90ZS5iYXNlNjRFbmNvZGUoaG9tZVNlY3VyaXR5Q29udGV4dCkpO1xuXG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBQb3N0KGdldFJlbW90ZShyZW1vdGVFbmRQb2ludCwgZG9tYWluSW5mby5kb21haW4pLCBtc2dwYWNrLmVuY29kZShzd2FybSksIGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgICAgICAgICAgIGlmKGVycil7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICQkLnJlbW90ZS5yZXF1ZXN0TWFuYWdlci5jcmVhdGVSZXF1ZXN0KHN3YXJtLmdldE1ldGEoXCJob21lU2VjdXJpdHlDb250ZXh0XCIpLCBzd2FybSk7XG4gICAgfTtcblxuICAgIHRoaXMuY29udGludWVTd2FybSA9IGZ1bmN0aW9uKGV4aXN0aW5nU3dhcm0sIHBoYXNlTmFtZSwgLi4uYXJncyl7XG4gICAgICAgIHZhciBzd2FybSA9IG5ldyBPd00oZXhpc3RpbmdTd2FybSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJwaGFzZU5hbWVcIiwgcGhhc2VOYW1lKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcImFyZ3NcIiwgYXJncyk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJjb21tYW5kXCIsIFwiZXhlY3V0ZVN3YXJtUGhhc2VcIik7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJ0YXJnZXRcIiwgZG9tYWluSW5mby5hZ2VudFVybCk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJob21lU2VjdXJpdHlDb250ZXh0XCIsIHJldHVyblJlbW90ZUVuZFBvaW50KyQkLnJlbW90ZS5iYXNlNjRFbmNvZGUoaG9tZVNlY3VyaXR5Q29udGV4dCkpO1xuXG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBQb3N0KGdldFJlbW90ZShyZW1vdGVFbmRQb2ludCwgZG9tYWluSW5mby5kb21haW4pLCBtc2dwYWNrLmVuY29kZShzd2FybSksIGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgICAgICAgICAgIGlmKGVycil7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vcmV0dXJuICQkLnJlbW90ZS5yZXF1ZXN0TWFuYWdlci5jcmVhdGVSZXF1ZXN0KHN3YXJtLmdldE1ldGEoXCJob21lU2VjdXJpdHlDb250ZXh0XCIpLCBzd2FybSk7XG4gICAgfTtcblxuICAgIHZhciBhbGxDYXRjaEFsbHMgPSBbXTtcbiAgICB2YXIgcmVxdWVzdHNDb3VudGVyID0gMDtcbiAgICBmdW5jdGlvbiBDYXRjaEFsbChzd2FybU5hbWUsIHBoYXNlTmFtZSwgY2FsbGJhY2speyAvL3NhbWUgaW50ZXJmYWNlIGFzIFJlcXVlc3RcbiAgICAgICAgdmFyIHJlcXVlc3RJZCA9IHJlcXVlc3RzQ291bnRlcisrO1xuICAgICAgICB0aGlzLmdldFJlcXVlc3RJZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBsZXQgcmVxSWQgPSBcInN3YXJtTmFtZVwiICsgXCJwaGFzZU5hbWVcIiArIHJlcXVlc3RJZDtcbiAgICAgICAgICAgIHJldHVybiByZXFJZDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRpc3BhdGNoID0gZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuICAgICAgICAgICAgcmVzdWx0ID0gT3dNLnByb3RvdHlwZS5jb252ZXJ0KHJlc3VsdCk7XG4gICAgICAgICAgICB2YXIgY3VycmVudFBoYXNlTmFtZSA9IHJlc3VsdC5nZXRNZXRhKFwicGhhc2VOYW1lXCIpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRTd2FybU5hbWUgPSByZXN1bHQuZ2V0TWV0YShcInN3YXJtVHlwZU5hbWVcIik7XG4gICAgICAgICAgICBpZigoY3VycmVudFN3YXJtTmFtZSA9PT0gc3dhcm1OYW1lIHx8IHN3YXJtTmFtZSA9PT0gJyonKSAmJiAoY3VycmVudFBoYXNlTmFtZSA9PT0gcGhhc2VOYW1lIHx8IHBoYXNlTmFtZSA9PT0gJyonKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5vbiA9IGZ1bmN0aW9uKHN3YXJtTmFtZSwgcGhhc2VOYW1lLCBjYWxsYmFjayl7XG4gICAgICAgIHZhciBjID0gbmV3IENhdGNoQWxsKHN3YXJtTmFtZSwgcGhhc2VOYW1lLCBjYWxsYmFjayk7XG4gICAgICAgIGFsbENhdGNoQWxscy5wdXNoKHtcbiAgICAgICAgICAgIHM6c3dhcm1OYW1lLFxuICAgICAgICAgICAgcDpwaGFzZU5hbWUsXG4gICAgICAgICAgICBjOmNcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJCQucmVtb3RlLnJlcXVlc3RNYW5hZ2VyLnBvbGwoZ2V0UmVtb3RlKHJlbW90ZUVuZFBvaW50LCBkb21haW5JbmZvLmRvbWFpbikgLCBjKTtcbiAgICB9O1xuXG4gICAgdGhpcy5vZmYgPSBmdW5jdGlvbihzd2FybU5hbWUsIHBoYXNlTmFtZSl7XG4gICAgICAgIGFsbENhdGNoQWxscy5mb3JFYWNoKGZ1bmN0aW9uKGNhKXtcbiAgICAgICAgICAgIGlmKChjYS5zID09PSBzd2FybU5hbWUgfHwgc3dhcm1OYW1lID09PSAnKicpICYmIChwaGFzZU5hbWUgPT09IGNhLnAgfHwgcGhhc2VOYW1lID09PSAnKicpKXtcbiAgICAgICAgICAgICAgICAkJC5yZW1vdGUucmVxdWVzdE1hbmFnZXIudW5wb2xsKGdldFJlbW90ZShyZW1vdGVFbmRQb2ludCwgZG9tYWluSW5mby5kb21haW4pLCBjYS5jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMudXBsb2FkQ1NCID0gZnVuY3Rpb24oY3J5cHRvVWlkLCBiaW5hcnlEYXRhLCBjYWxsYmFjayl7XG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBQb3N0KGJhc2VPZlJlbW90ZUVuZFBvaW50ICsgXCIvQ1NCL1wiICsgY3J5cHRvVWlkLCBiaW5hcnlEYXRhLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIHRoaXMuZG93bmxvYWRDU0IgPSBmdW5jdGlvbihjcnlwdG9VaWQsIGNhbGxiYWNrKXtcbiAgICAgICAgJCQucmVtb3RlLmRvSHR0cEdldChiYXNlT2ZSZW1vdGVFbmRQb2ludCArIFwiL0NTQi9cIiArIGNyeXB0b1VpZCwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnZXRSZW1vdGUoYmFzZVVybCwgZG9tYWluKSB7XG4gICAgICAgIHJldHVybiB1cmxFbmRXaXRoU2xhc2goYmFzZVVybCkgKyAkJC5yZW1vdGUuYmFzZTY0RW5jb2RlKGRvbWFpbik7XG4gICAgfVxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKiBpbml0aWFsaXNhdGlvbiBzdHVmZiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuaWYgKHR5cGVvZiAkJCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICQkID0ge307XG59XG5cbmlmICh0eXBlb2YgICQkLnJlbW90ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICQkLnJlbW90ZSA9IHt9O1xuICAgICQkLnJlbW90ZS5jcmVhdGVSZXF1ZXN0TWFuYWdlciA9IGZ1bmN0aW9uKHRpbWVPdXQpe1xuICAgICAgICAkJC5yZW1vdGUucmVxdWVzdE1hbmFnZXIgPSBuZXcgUmVxdWVzdE1hbmFnZXIodGltZU91dCk7XG4gICAgfTtcblxuXG4gICAgJCQucmVtb3RlLmNyeXB0b1Byb3ZpZGVyID0gbnVsbDtcbiAgICAkJC5yZW1vdGUubmV3RW5kUG9pbnQgPSBmdW5jdGlvbihhbGlhcywgcmVtb3RlRW5kUG9pbnQsIGFnZW50VWlkLCBjcnlwdG9JbmZvKXtcbiAgICAgICAgaWYoYWxpYXMgPT09IFwibmV3UmVtb3RlRW5kUG9pbnRcIiB8fCBhbGlhcyA9PT0gXCJyZXF1ZXN0TWFuYWdlclwiIHx8IGFsaWFzID09PSBcImNyeXB0b1Byb3ZpZGVyXCIpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQc2tIdHRwQ2xpZW50IFVuc2FmZSBhbGlhcyBuYW1lOlwiLCBhbGlhcyk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgJCQucmVtb3RlW2FsaWFzXSA9IG5ldyBQc2tIdHRwQ2xpZW50KHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgY3J5cHRvSW5mbyk7XG4gICAgfTtcblxuXG4gICAgJCQucmVtb3RlLmRvSHR0cFBvc3QgPSBmdW5jdGlvbiAodXJsLCBkYXRhLCBjYWxsYmFjayl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJ3cml0ZSB0aGlzIVwiKTtcbiAgICB9O1xuXG4gICAgJCQucmVtb3RlLmRvSHR0cEdldCA9IGZ1bmN0aW9uIGRvSHR0cEdldCh1cmwsIGNhbGxiYWNrKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlIHRoaXMhXCIpO1xuICAgIH07XG5cbiAgICAkJC5yZW1vdGUuYmFzZTY0RW5jb2RlID0gZnVuY3Rpb24gYmFzZTY0RW5jb2RlKHN0cmluZ1RvRW5jb2RlKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlIHRoaXMhXCIpO1xuICAgIH07XG5cbiAgICAkJC5yZW1vdGUuYmFzZTY0RGVjb2RlID0gZnVuY3Rpb24gYmFzZTY0RGVjb2RlKGVuY29kZWRTdHJpbmcpe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgdGhpcyFcIik7XG4gICAgfTtcbn1cblxuXG5cbi8qICBpbnRlcmZhY2VcbmZ1bmN0aW9uIENyeXB0b1Byb3ZpZGVyKCl7XG5cbiAgICB0aGlzLmdlbmVyYXRlU2FmZVVpZCA9IGZ1bmN0aW9uKCl7XG5cbiAgICB9XG5cbiAgICB0aGlzLnNpZ25Td2FybSA9IGZ1bmN0aW9uKHN3YXJtLCBhZ2VudCl7XG5cbiAgICB9XG59ICovXG4iLCIkJC5yZW1vdGUuZG9IdHRwUG9zdCA9IGZ1bmN0aW9uICh1cmwsIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQgJiYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPCAzMDApKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0geGhyLnJlc3BvbnNlO1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZih4aHIuc3RhdHVzPj00MDApe1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIkFuIGVycm9yIG9jY3VyZWQuIFN0YXR1c0NvZGU6IFwiICsgeGhyLnN0YXR1cykpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU3RhdHVzIGNvZGUgJHt4aHIuc3RhdHVzfSByZWNlaXZlZCwgcmVzcG9uc2UgaXMgaWdub3JlZC5gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB4aHIub3BlbihcIlBPU1RcIiwgdXJsLCB0cnVlKTtcbiAgICAvL3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1UeXBlXCIsIFwiYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PVVURi04XCIpO1xuXG4gICAgaWYoZGF0YSAmJiBkYXRhLnBpcGUgJiYgdHlwZW9mIGRhdGEucGlwZSA9PT0gXCJmdW5jdGlvblwiKXtcbiAgICAgICAgY29uc3QgYnVmZmVycyA9IFtdO1xuICAgICAgICBkYXRhLm9uKFwiZGF0YVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBidWZmZXJzLnB1c2goZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhLm9uKFwiZW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgYWN0dWFsQ29udGVudHMgPSBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpO1xuICAgICAgICAgICAgeGhyLnNlbmQoYWN0dWFsQ29udGVudHMpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGlmKEFycmF5QnVmZmVyLmlzVmlldyhkYXRhKSkge1xuICAgICAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHhoci5zZW5kKGRhdGEpO1xuICAgIH1cbn07XG5cblxuJCQucmVtb3RlLmRvSHR0cEdldCA9IGZ1bmN0aW9uIGRvSHR0cEdldCh1cmwsIGNhbGxiYWNrKSB7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvL2NoZWNrIGlmIGhlYWRlcnMgd2VyZSByZWNlaXZlZCBhbmQgaWYgYW55IGFjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIGJlZm9yZSByZWNlaXZpbmcgZGF0YVxuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50VHlwZSA9IHhoci5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtVHlwZVwiKTtcbiAgICAgICAgICAgIGlmIChjb250ZW50VHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIikge1xuICAgICAgICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT0gNCAmJiB4aHIuc3RhdHVzID09IFwiMjAwXCIpIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50VHlwZSA9IHhoci5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtVHlwZVwiKTtcblxuICAgICAgICAgICAgaWYoY29udGVudFR5cGU9PT1cImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKXtcbiAgICAgICAgICAgICAgICBsZXQgcmVzcG9uc2VCdWZmZXIgPSBCdWZmZXIuZnJvbSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXNwb25zZUJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHhoci5yZXNwb25zZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIkFuIGVycm9yIG9jY3VyZWQuIFN0YXR1c0NvZGU6IFwiICsgeGhyLnN0YXR1cykpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCk7XG4gICAgeGhyLnNlbmQoKTtcbn07XG5cblxuZnVuY3Rpb24gQ3J5cHRvUHJvdmlkZXIoKXtcblxuICAgIHRoaXMuZ2VuZXJhdGVTYWZlVWlkID0gZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IHVpZCA9IFwiXCI7XG4gICAgICAgIHZhciBhcnJheSA9IG5ldyBVaW50MzJBcnJheSgxMCk7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFycmF5KTtcblxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHVpZCArPSBhcnJheVtpXS50b1N0cmluZygxNik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdWlkO1xuICAgIH1cblxuICAgIHRoaXMuc2lnblN3YXJtID0gZnVuY3Rpb24oc3dhcm0sIGFnZW50KXtcbiAgICAgICAgc3dhcm0ubWV0YS5zaWduYXR1cmUgPSBhZ2VudDtcbiAgICB9XG59XG5cblxuXG4kJC5yZW1vdGUuY3J5cHRvUHJvdmlkZXIgPSBuZXcgQ3J5cHRvUHJvdmlkZXIoKTtcblxuJCQucmVtb3RlLmJhc2U2NEVuY29kZSA9IGZ1bmN0aW9uIGJhc2U2NEVuY29kZShzdHJpbmdUb0VuY29kZSl7XG4gICAgcmV0dXJuIHdpbmRvdy5idG9hKHN0cmluZ1RvRW5jb2RlKTtcbn07XG5cbiQkLnJlbW90ZS5iYXNlNjREZWNvZGUgPSBmdW5jdGlvbiBiYXNlNjREZWNvZGUoZW5jb2RlZFN0cmluZyl7XG4gICAgcmV0dXJuIHdpbmRvdy5hdG9iKGVuY29kZWRTdHJpbmcpO1xufTtcbiIsInJlcXVpcmUoXCIuL3Bzay1hYnN0cmFjdC1jbGllbnRcIik7XG5cbmNvbnN0IGh0dHAgPSByZXF1aXJlKFwiaHR0cFwiKTtcbmNvbnN0IGh0dHBzID0gcmVxdWlyZShcImh0dHBzXCIpO1xuY29uc3QgVVJMID0gcmVxdWlyZShcInVybFwiKTtcbmNvbnN0IHVzZXJBZ2VudCA9ICdQU0sgTm9kZUFnZW50LzAuMC4xJztcblxuY29uc29sZS5sb2coXCJQU0sgbm9kZSBjbGllbnQgbG9hZGluZ1wiKTtcblxuZnVuY3Rpb24gZ2V0TmV0d29ya0Zvck9wdGlvbnMob3B0aW9ucykge1xuXHRpZihvcHRpb25zLnByb3RvY29sID09PSAnaHR0cDonKSB7XG5cdFx0cmV0dXJuIGh0dHA7XG5cdH0gZWxzZSBpZihvcHRpb25zLnByb3RvY29sID09PSAnaHR0cHM6Jykge1xuXHRcdHJldHVybiBodHRwcztcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoYENhbid0IGhhbmRsZSBwcm90b2NvbCAke29wdGlvbnMucHJvdG9jb2x9YCk7XG5cdH1cblxufVxuXG4kJC5yZW1vdGUuZG9IdHRwUG9zdCA9IGZ1bmN0aW9uICh1cmwsIGRhdGEsIGNhbGxiYWNrKXtcblx0Y29uc3QgaW5uZXJVcmwgPSBVUkwucGFyc2UodXJsKTtcblxuXHRjb25zdCBvcHRpb25zID0ge1xuXHRcdGhvc3RuYW1lOiBpbm5lclVybC5ob3N0bmFtZSxcblx0XHRwYXRoOiBpbm5lclVybC5wYXRobmFtZSxcblx0XHRwb3J0OiBwYXJzZUludChpbm5lclVybC5wb3J0KSxcblx0XHRoZWFkZXJzOiB7XG5cdFx0XHQnVXNlci1BZ2VudCc6IHVzZXJBZ2VudFxuXHRcdH0sXG5cdFx0bWV0aG9kOiAnUE9TVCdcblx0fTtcblxuXHRjb25zdCBuZXR3b3JrID0gZ2V0TmV0d29ya0Zvck9wdGlvbnMoaW5uZXJVcmwpO1xuXG5cdGlmKEFycmF5QnVmZmVyLmlzVmlldyhkYXRhKSB8fCBCdWZmZXIuaXNCdWZmZXIoZGF0YSkpIHtcblx0XHRpZighQnVmZmVyLmlzQnVmZmVyKGRhdGEpKSB7XG5cdFx0XHRkYXRhID0gQnVmZmVyLmZyb20oZGF0YSk7XG5cdFx0fVxuXG5cdFx0b3B0aW9ucy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nO1xuXHRcdG9wdGlvbnMuaGVhZGVyc1snQ29udGVudC1MZW5ndGgnXSA9IGRhdGEubGVuZ3RoO1xuXHR9XG5cblx0Y29uc3QgcmVxID0gbmV0d29yay5yZXF1ZXN0KG9wdGlvbnMsIChyZXMpID0+IHtcblx0XHRjb25zdCB7IHN0YXR1c0NvZGUgfSA9IHJlcztcblxuXHRcdGxldCBlcnJvcjtcblx0XHRpZiAoc3RhdHVzQ29kZSA+PSA0MDApIHtcblx0XHRcdGVycm9yID0gbmV3IEVycm9yKCdSZXF1ZXN0IEZhaWxlZC5cXG4nICtcblx0XHRcdFx0YFN0YXR1cyBDb2RlOiAke3N0YXR1c0NvZGV9YCk7XG5cdFx0fVxuXG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRjYWxsYmFjayhlcnJvcik7XG5cdFx0XHQvLyBmcmVlIHVwIG1lbW9yeVxuXHRcdFx0cmVzLnJlc3VtZSgpO1xuXHRcdFx0cmV0dXJuIDtcblx0XHR9XG5cblx0XHRsZXQgcmF3RGF0YSA9ICcnO1xuXHRcdHJlcy5vbignZGF0YScsIChjaHVuaykgPT4geyByYXdEYXRhICs9IGNodW5rOyB9KTtcblx0XHRyZXMub24oJ2VuZCcsICgpID0+IHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCByYXdEYXRhKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSkub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJQT1NUIEVycm9yXCIsIGVycm9yKTtcblx0XHRjYWxsYmFjayhlcnJvcik7XG5cdH0pO1xuXG4gICAgaWYoZGF0YSAmJiBkYXRhLnBpcGUgJiYgdHlwZW9mIGRhdGEucGlwZSA9PT0gXCJmdW5jdGlvblwiKXtcbiAgICAgICAgZGF0YS5waXBlKHJlcSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZih0eXBlb2YgZGF0YSAhPT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0J1ZmZlcihkYXRhKSAmJiAhQXJyYXlCdWZmZXIuaXNWaWV3KGRhdGEpKSB7XG5cdFx0ZGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuXHR9XG5cblx0cmVxLndyaXRlKGRhdGEpO1xuXHRyZXEuZW5kKCk7XG59O1xuXG4kJC5yZW1vdGUuZG9IdHRwR2V0ID0gZnVuY3Rpb24gZG9IdHRwR2V0KHVybCwgY2FsbGJhY2spe1xuICAgIGNvbnN0IGlubmVyVXJsID0gVVJMLnBhcnNlKHVybCk7XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRob3N0bmFtZTogaW5uZXJVcmwuaG9zdG5hbWUsXG5cdFx0cGF0aDogaW5uZXJVcmwucGF0aG5hbWUgKyAoaW5uZXJVcmwuc2VhcmNoIHx8ICcnKSxcblx0XHRwb3J0OiBwYXJzZUludChpbm5lclVybC5wb3J0KSxcblx0XHRoZWFkZXJzOiB7XG5cdFx0XHQnVXNlci1BZ2VudCc6IHVzZXJBZ2VudFxuXHRcdH0sXG5cdFx0bWV0aG9kOiAnR0VUJ1xuXHR9O1xuXG5cdGNvbnN0IG5ldHdvcmsgPSBnZXROZXR3b3JrRm9yT3B0aW9ucyhpbm5lclVybCk7XG5cblx0Y29uc3QgcmVxID0gbmV0d29yay5yZXF1ZXN0KG9wdGlvbnMsIChyZXMpID0+IHtcblx0XHRjb25zdCB7IHN0YXR1c0NvZGUgfSA9IHJlcztcblxuXHRcdGxldCBlcnJvcjtcblx0XHRpZiAoc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG5cdFx0XHRlcnJvciA9IG5ldyBFcnJvcignUmVxdWVzdCBGYWlsZWQuXFxuJyArXG5cdFx0XHRcdGBTdGF0dXMgQ29kZTogJHtzdGF0dXNDb2RlfWApO1xuXHRcdFx0ZXJyb3IuY29kZSA9IHN0YXR1c0NvZGU7XG5cdFx0fVxuXG5cdFx0aWYgKGVycm9yKSB7XG5cdFx0XHRjYWxsYmFjayhlcnJvcik7XG5cdFx0XHQvLyBmcmVlIHVwIG1lbW9yeVxuXHRcdFx0cmVzLnJlc3VtZSgpO1xuXHRcdFx0cmV0dXJuIDtcblx0XHR9XG5cblx0XHRsZXQgcmF3RGF0YTtcblx0XHRjb25zdCBjb250ZW50VHlwZSA9IHJlcy5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcblxuXHRcdGlmKGNvbnRlbnRUeXBlID09PSBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKXtcblx0XHRcdHJhd0RhdGEgPSBbXTtcblx0XHR9ZWxzZXtcblx0XHRcdHJhd0RhdGEgPSAnJztcblx0XHR9XG5cblx0XHRyZXMub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcblx0XHRcdGlmKEFycmF5LmlzQXJyYXkocmF3RGF0YSkpe1xuXHRcdFx0XHRyYXdEYXRhLnB1c2goLi4uY2h1bmspO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJhd0RhdGEgKz0gY2h1bms7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmVzLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRpZihBcnJheS5pc0FycmF5KHJhd0RhdGEpKXtcblx0XHRcdFx0XHRyYXdEYXRhID0gQnVmZmVyLmZyb20ocmF3RGF0YSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIHJhd0RhdGEpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ2xpZW50IGVycm9yOlwiLCBlcnIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHR9KTtcblxuXHRyZXEub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcblx0XHRpZihlcnJvciAmJiBlcnJvci5jb2RlICE9PSAnRUNPTk5SRVNFVCcpe1xuICAgICAgICBcdGNvbnNvbGUubG9nKFwiR0VUIEVycm9yXCIsIGVycm9yKTtcblx0XHR9XG5cblx0XHRjYWxsYmFjayhlcnJvcik7XG5cdH0pO1xuXG5cdHJlcS5lbmQoKTtcbn07XG5cbiQkLnJlbW90ZS5iYXNlNjRFbmNvZGUgPSBmdW5jdGlvbiBiYXNlNjRFbmNvZGUoc3RyaW5nVG9FbmNvZGUpe1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShzdHJpbmdUb0VuY29kZSkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xufTtcblxuJCQucmVtb3RlLmJhc2U2NERlY29kZSA9IGZ1bmN0aW9uIGJhc2U2NERlY29kZShlbmNvZGVkU3RyaW5nKXtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oZW5jb2RlZFN0cmluZywgJ2Jhc2U2NCcpLnRvU3RyaW5nKCdhc2NpaScpO1xufTtcbiIsImZ1bmN0aW9uIHByb2R1Y3QoYXJncykge1xuICAgIGlmKCFhcmdzLmxlbmd0aCl7XG4gICAgICAgIHJldHVybiBbIFtdIF07XG4gICAgfVxuICAgIHZhciBwcm9kID0gcHJvZHVjdChhcmdzLnNsaWNlKDEpKSwgciA9IFtdO1xuICAgIGFyZ3NbMF0uZm9yRWFjaChmdW5jdGlvbih4KSB7XG4gICAgICAgIHByb2QuZm9yRWFjaChmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICByLnB1c2goWyB4IF0uY29uY2F0KHApKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHI7XG59XG5cbmZ1bmN0aW9uIG9iamVjdFByb2R1Y3Qob2JqKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopLFxuICAgICAgICB2YWx1ZXMgPSBrZXlzLm1hcChmdW5jdGlvbih4KSB7IHJldHVybiBvYmpbeF07IH0pO1xuXG4gICAgcmV0dXJuIHByb2R1Y3QodmFsdWVzKS5tYXAoZnVuY3Rpb24ocCkge1xuICAgICAgICB2YXIgZSA9IHt9O1xuICAgICAgICBrZXlzLmZvckVhY2goZnVuY3Rpb24oaywgbikgeyBlW2tdID0gcFtuXTsgfSk7XG4gICAgICAgIHJldHVybiBlO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFByb2R1Y3Q7IiwidmFyIG1ldGEgPSBcIm1ldGFcIjtcblxuZnVuY3Rpb24gT3dNKHNlcmlhbGl6ZWQpe1xuXG4gICAgaWYoc2VyaWFsaXplZCl7XG4gICAgICAgIHJldHVybiBPd00ucHJvdG90eXBlLmNvbnZlcnQoc2VyaWFsaXplZCk7XG4gICAgfVxuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIG1ldGEsIHtcbiAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICB2YWx1ZToge31cbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInNldE1ldGFcIiwge1xuICAgICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICBjb25maWd1cmFibGU6ZmFsc2UsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbihwcm9wLCB2YWx1ZSl7XG4gICAgICAgICAgICBpZih0eXBlb2YgcHJvcCA9PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZSA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAgICAgICAgICAgICBmb3IodmFyIHAgaW4gcHJvcCl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbWV0YV1bcF0gPSBwcm9wW3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXNbbWV0YV1bcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZ2V0TWV0YVwiLCB7XG4gICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uKHByb3Ape1xuICAgICAgICAgICAgcmV0dXJuIHRoaXNbbWV0YV1bcHJvcF07XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdGVzdE93TVNlcmlhbGl6YXRpb24ob2JqKXtcbiAgICBsZXQgcmVzID0gZmFsc2U7XG5cbiAgICBpZihvYmope1xuICAgICAgICByZXMgPSB0eXBlb2Ygb2JqW21ldGFdICE9IFwidW5kZWZpbmVkXCIgJiYgIShvYmogaW5zdGFuY2VvZiBPd00pO1xuICAgIH1cblxuICAgIHJldHVybiByZXM7XG59XG5cbk93TS5wcm90b3R5cGUuY29udmVydCA9IGZ1bmN0aW9uKHNlcmlhbGl6ZWQpe1xuICAgIGNvbnN0IG93bSA9IG5ldyBPd00oKTtcblxuICAgIGZvcih2YXIgbWV0YVByb3AgaW4gc2VyaWFsaXplZC5tZXRhKXtcbiAgICAgICAgaWYoIXRlc3RPd01TZXJpYWxpemF0aW9uKHNlcmlhbGl6ZWRbbWV0YVByb3BdKSkge1xuICAgICAgICAgICAgb3dtLnNldE1ldGEobWV0YVByb3AsIHNlcmlhbGl6ZWQubWV0YVttZXRhUHJvcF0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIG93bS5zZXRNZXRhKG1ldGFQcm9wLCBPd00ucHJvdG90eXBlLmNvbnZlcnQoc2VyaWFsaXplZC5tZXRhW21ldGFQcm9wXSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZm9yKHZhciBzaW1wbGVQcm9wIGluIHNlcmlhbGl6ZWQpe1xuICAgICAgICBpZihzaW1wbGVQcm9wID09PSBtZXRhKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCF0ZXN0T3dNU2VyaWFsaXphdGlvbihzZXJpYWxpemVkW3NpbXBsZVByb3BdKSl7XG4gICAgICAgICAgICBvd21bc2ltcGxlUHJvcF0gPSBzZXJpYWxpemVkW3NpbXBsZVByb3BdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIG93bVtzaW1wbGVQcm9wXSA9IE93TS5wcm90b3R5cGUuY29udmVydChzZXJpYWxpemVkW3NpbXBsZVByb3BdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvd207XG59O1xuXG5Pd00ucHJvdG90eXBlLmdldE1ldGFGcm9tID0gZnVuY3Rpb24ob2JqLCBuYW1lKXtcbiAgICB2YXIgcmVzO1xuICAgIGlmKCFuYW1lKXtcbiAgICAgICAgcmVzID0gb2JqW21ldGFdO1xuICAgIH1lbHNle1xuICAgICAgICByZXMgPSBvYmpbbWV0YV1bbmFtZV07XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59O1xuXG5Pd00ucHJvdG90eXBlLnNldE1ldGFGb3IgPSBmdW5jdGlvbihvYmosIG5hbWUsIHZhbHVlKXtcbiAgICBvYmpbbWV0YV1bbmFtZV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gb2JqW21ldGFdW25hbWVdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBPd007IiwiZnVuY3Rpb24gUXVldWVFbGVtZW50KGNvbnRlbnQpIHtcblx0dGhpcy5jb250ZW50ID0gY29udGVudDtcblx0dGhpcy5uZXh0ID0gbnVsbDtcbn1cblxuZnVuY3Rpb24gUXVldWUoKSB7XG5cdHRoaXMuaGVhZCA9IG51bGw7XG5cdHRoaXMudGFpbCA9IG51bGw7XG5cdHRoaXMubGVuZ3RoID0gMDtcblx0dGhpcy5wdXNoID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0Y29uc3QgbmV3RWxlbWVudCA9IG5ldyBRdWV1ZUVsZW1lbnQodmFsdWUpO1xuXHRcdGlmICghdGhpcy5oZWFkKSB7XG5cdFx0XHR0aGlzLmhlYWQgPSBuZXdFbGVtZW50O1xuXHRcdFx0dGhpcy50YWlsID0gbmV3RWxlbWVudDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy50YWlsLm5leHQgPSBuZXdFbGVtZW50O1xuXHRcdFx0dGhpcy50YWlsID0gbmV3RWxlbWVudDtcblx0XHR9XG5cdFx0dGhpcy5sZW5ndGgrKztcblx0fTtcblxuXHR0aGlzLnBvcCA9IGZ1bmN0aW9uICgpIHtcblx0XHRpZiAoIXRoaXMuaGVhZCkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdGNvbnN0IGhlYWRDb3B5ID0gdGhpcy5oZWFkO1xuXHRcdHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuXHRcdHRoaXMubGVuZ3RoLS07XG5cblx0XHQvL2ZpeD8/Pz8/Pz9cblx0XHRpZih0aGlzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICB0aGlzLnRhaWwgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiBoZWFkQ29weS5jb250ZW50O1xuXHR9O1xuXG5cdHRoaXMuZnJvbnQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGVhZCA/IHRoaXMuaGVhZC5jb250ZW50IDogdW5kZWZpbmVkO1xuXHR9O1xuXG5cdHRoaXMuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5oZWFkID09PSBudWxsO1xuXHR9O1xuXG5cdHRoaXNbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKiAoKSB7XG5cdFx0bGV0IGhlYWQgPSB0aGlzLmhlYWQ7XG5cdFx0d2hpbGUoaGVhZCAhPT0gbnVsbCkge1xuXHRcdFx0eWllbGQgaGVhZC5jb250ZW50O1xuXHRcdFx0aGVhZCA9IGhlYWQubmV4dDtcblx0XHR9XG5cdH0uYmluZCh0aGlzKTtcbn1cblxuUXVldWUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRsZXQgc3RyaW5naWZpZWRRdWV1ZSA9ICcnO1xuXHRsZXQgaXRlcmF0b3IgPSB0aGlzLmhlYWQ7XG5cdHdoaWxlIChpdGVyYXRvcikge1xuXHRcdHN0cmluZ2lmaWVkUXVldWUgKz0gYCR7SlNPTi5zdHJpbmdpZnkoaXRlcmF0b3IuY29udGVudCl9IGA7XG5cdFx0aXRlcmF0b3IgPSBpdGVyYXRvci5uZXh0O1xuXHR9XG5cdHJldHVybiBzdHJpbmdpZmllZFF1ZXVlO1xufTtcblxuUXVldWUucHJvdG90eXBlLmluc3BlY3QgPSBRdWV1ZS5wcm90b3R5cGUudG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gUXVldWU7IiwiY29uc3QgT3dNID0gcmVxdWlyZShcIi4vT3dNXCIpO1xuXG4vKlxuICAgIFByZXBhcmUgdGhlIHN0YXRlIG9mIGEgc3dhcm0gdG8gYmUgc2VyaWFsaXNlZFxuKi9cblxuZXhwb3J0cy5hc0pTT04gPSBmdW5jdGlvbih2YWx1ZU9iaiwgcGhhc2VOYW1lLCBhcmdzLCBjYWxsYmFjayl7XG5cbiAgICAgICAgbGV0IHZhbHVlT2JqZWN0ID0gdmFsdWVPYmoudmFsdWVPZigpO1xuICAgICAgICBsZXQgcmVzID0gbmV3IE93TSgpO1xuICAgICAgICByZXMucHVibGljVmFycyAgICAgICAgICA9IHZhbHVlT2JqZWN0LnB1YmxpY1ZhcnM7XG4gICAgICAgIHJlcy5wcml2YXRlVmFycyAgICAgICAgID0gdmFsdWVPYmplY3QucHJpdmF0ZVZhcnM7XG5cbiAgICAgICAgcmVzLnNldE1ldGEoXCJzd2FybVR5cGVOYW1lXCIsIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20odmFsdWVPYmplY3QsIFwic3dhcm1UeXBlTmFtZVwiKSk7XG4gICAgICAgIHJlcy5zZXRNZXRhKFwic3dhcm1JZFwiLCAgICAgICBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHZhbHVlT2JqZWN0LCBcInN3YXJtSWRcIikpO1xuICAgICAgICByZXMuc2V0TWV0YShcInRhcmdldFwiLCAgICAgICAgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbSh2YWx1ZU9iamVjdCwgXCJ0YXJnZXRcIikpO1xuICAgICAgICByZXMuc2V0TWV0YShcImhvbWVTZWN1cml0eUNvbnRleHRcIiwgICAgICAgIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20odmFsdWVPYmplY3QsIFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiKSk7XG4gICAgICAgIHJlcy5zZXRNZXRhKFwicmVxdWVzdElkXCIsICAgICAgICBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHZhbHVlT2JqZWN0LCBcInJlcXVlc3RJZFwiKSk7XG5cbiAgICAgICAgaWYoIXBoYXNlTmFtZSl7XG4gICAgICAgICAgICByZXMuc2V0TWV0YShcImNvbW1hbmRcIiwgXCJzdG9yZWRcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMuc2V0TWV0YShcInBoYXNlTmFtZVwiLCBwaGFzZU5hbWUpO1xuICAgICAgICAgICAgcmVzLnNldE1ldGEoXCJwaGFzZUlkXCIsICQkLnVpZEdlbmVyYXRvci5zYWZlX3V1aWQoKSk7XG4gICAgICAgICAgICByZXMuc2V0TWV0YShcImFyZ3NcIiwgYXJncyk7XG4gICAgICAgICAgICByZXMuc2V0TWV0YShcImNvbW1hbmRcIiwgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbSh2YWx1ZU9iamVjdCwgXCJjb21tYW5kXCIpIHx8IFwiZXhlY3V0ZVN3YXJtUGhhc2VcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXMuc2V0TWV0YShcIndhaXRTdGFja1wiLCB2YWx1ZU9iamVjdC5tZXRhLndhaXRTdGFjayk7IC8vVE9ETzogdGhpbmsgaWYgaXMgbm90IGJldHRlciB0byBiZSBkZWVwIGNsb25lZCBhbmQgbm90IHJlZmVyZW5jZWQhISFcblxuICAgICAgICBpZihjYWxsYmFjayl7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmVzKTtcbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKFwiYXNKU09OOlwiLCByZXMsIHZhbHVlT2JqZWN0KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydHMuanNvblRvTmF0aXZlID0gZnVuY3Rpb24oc2VyaWFsaXNlZFZhbHVlcywgcmVzdWx0KXtcblxuICAgIGZvcihsZXQgdiBpbiBzZXJpYWxpc2VkVmFsdWVzLnB1YmxpY1ZhcnMpe1xuICAgICAgICByZXN1bHQucHVibGljVmFyc1t2XSA9IHNlcmlhbGlzZWRWYWx1ZXMucHVibGljVmFyc1t2XTtcblxuICAgIH07XG4gICAgZm9yKGxldCBsIGluIHNlcmlhbGlzZWRWYWx1ZXMucHJpdmF0ZVZhcnMpe1xuICAgICAgICByZXN1bHQucHJpdmF0ZVZhcnNbbF0gPSBzZXJpYWxpc2VkVmFsdWVzLnByaXZhdGVWYXJzW2xdO1xuICAgIH07XG5cbiAgICBmb3IobGV0IGkgaW4gT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbShzZXJpYWxpc2VkVmFsdWVzKSl7XG4gICAgICAgIE93TS5wcm90b3R5cGUuc2V0TWV0YUZvcihyZXN1bHQsIGksIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20oc2VyaWFsaXNlZFZhbHVlcywgaSkpO1xuICAgIH07XG5cbn07IiwidmFyIGNvbW1hbmRzID0ge307XG52YXIgY29tbWFuZHNfaGVscCA9IHt9O1xuXG4vL2dsb2JhbCBmdW5jdGlvbiBhZGRDb21tYW5kXG5hZGRDb21tYW5kID0gZnVuY3Rpb24gYWRkQ29tbWFuZCh2ZXJiLCBhZHZlcmJlLCBmdW5jdCwgaGVscExpbmUpe1xuICAgIHZhciBjbWRJZDtcbiAgICBpZighaGVscExpbmUpe1xuICAgICAgICBoZWxwTGluZSA9IFwiIFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGhlbHBMaW5lID0gXCIgXCIgKyBoZWxwTGluZTtcbiAgICB9XG4gICAgaWYoYWR2ZXJiZSl7XG4gICAgICAgIGNtZElkID0gdmVyYiArIFwiIFwiICsgIGFkdmVyYmU7XG4gICAgICAgIGhlbHBMaW5lID0gdmVyYiArIFwiIFwiICsgIGFkdmVyYmUgKyBoZWxwTGluZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjbWRJZCA9IHZlcmI7XG4gICAgICAgIGhlbHBMaW5lID0gdmVyYiArIGhlbHBMaW5lO1xuICAgIH1cbiAgICBjb21tYW5kc1tjbWRJZF0gPSBmdW5jdDtcbiAgICAgICAgY29tbWFuZHNfaGVscFtjbWRJZF0gPSBoZWxwTGluZTtcbn07XG5cbmZ1bmN0aW9uIGRvSGVscCgpe1xuICAgIGNvbnNvbGUubG9nKFwiTGlzdCBvZiBjb21tYW5kczpcIik7XG4gICAgZm9yKHZhciBsIGluIGNvbW1hbmRzX2hlbHApe1xuICAgICAgICBjb25zb2xlLmxvZyhcIlxcdFwiLCBjb21tYW5kc19oZWxwW2xdKTtcbiAgICB9XG59XG5cbmFkZENvbW1hbmQoXCItaFwiLCBudWxsLCBkb0hlbHAsIFwiXFx0XFx0XFx0XFx0XFx0XFx0IHxqdXN0IHByaW50IHRoZSBoZWxwXCIpO1xuYWRkQ29tbWFuZChcIi8/XCIsIG51bGwsIGRvSGVscCwgXCJcXHRcXHRcXHRcXHRcXHRcXHQgfGp1c3QgcHJpbnQgdGhlIGhlbHBcIik7XG5hZGRDb21tYW5kKFwiaGVscFwiLCBudWxsLCBkb0hlbHAsIFwiXFx0XFx0XFx0XFx0XFx0XFx0IHxqdXN0IHByaW50IHRoZSBoZWxwXCIpO1xuXG5cbmZ1bmN0aW9uIHJ1bkNvbW1hbmQoKXtcbiAgdmFyIGFyZ3YgPSBPYmplY3QuYXNzaWduKFtdLCBwcm9jZXNzLmFyZ3YpO1xuICB2YXIgY21kSWQgPSBudWxsO1xuICB2YXIgY21kID0gbnVsbDtcbiAgYXJndi5zaGlmdCgpO1xuICBhcmd2LnNoaWZ0KCk7XG5cbiAgaWYoYXJndi5sZW5ndGggPj0xKXtcbiAgICAgIGNtZElkID0gYXJndlswXTtcbiAgICAgIGNtZCA9IGNvbW1hbmRzW2NtZElkXTtcbiAgICAgIGFyZ3Yuc2hpZnQoKTtcbiAgfVxuXG5cbiAgaWYoIWNtZCAmJiBhcmd2Lmxlbmd0aCA+PTEpe1xuICAgICAgY21kSWQgPSBjbWRJZCArIFwiIFwiICsgYXJndlswXTtcbiAgICAgIGNtZCA9IGNvbW1hbmRzW2NtZElkXTtcbiAgICAgIGFyZ3Yuc2hpZnQoKTtcbiAgfVxuXG4gIGlmKCFjbWQpe1xuICAgIGlmKGNtZElkKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJVbmtub3duIGNvbW1hbmQ6IFwiLCBjbWRJZCk7XG4gICAgfVxuICAgIGNtZCA9IGRvSGVscDtcbiAgfVxuXG4gIGNtZC5hcHBseShudWxsLGFyZ3YpO1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJ1bkNvbW1hbmRcbn07XG5cbiIsIlxuZnVuY3Rpb24gZW5jb2RlKGJ1ZmZlcikge1xuICAgIHJldHVybiBidWZmZXIudG9TdHJpbmcoJ2Jhc2U2NCcpXG4gICAgICAgIC5yZXBsYWNlKC9cXCsvZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9cXC8vZywgJycpXG4gICAgICAgIC5yZXBsYWNlKC89KyQvLCAnJyk7XG59O1xuXG5mdW5jdGlvbiBzdGFtcFdpdGhUaW1lKGJ1Ziwgc2FsdCwgbXNhbHQpe1xuICAgIGlmKCFzYWx0KXtcbiAgICAgICAgc2FsdCA9IDE7XG4gICAgfVxuICAgIGlmKCFtc2FsdCl7XG4gICAgICAgIG1zYWx0ID0gMTtcbiAgICB9XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZTtcbiAgICB2YXIgY3QgPSBNYXRoLmZsb29yKGRhdGUuZ2V0VGltZSgpIC8gc2FsdCk7XG4gICAgdmFyIGNvdW50ZXIgPSAwO1xuICAgIHdoaWxlKGN0ID4gMCApe1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiQ291bnRlclwiLCBjb3VudGVyLCBjdCk7XG4gICAgICAgIGJ1Zltjb3VudGVyKm1zYWx0XSA9IE1hdGguZmxvb3IoY3QgJSAyNTYpO1xuICAgICAgICBjdCA9IE1hdGguZmxvb3IoY3QgLyAyNTYpO1xuICAgICAgICBjb3VudGVyKys7XG4gICAgfVxufVxuXG4vKlxuICAgIFRoZSB1aWQgY29udGFpbnMgYXJvdW5kIDI1NiBiaXRzIG9mIHJhbmRvbW5lc3MgYW5kIGFyZSB1bmlxdWUgYXQgdGhlIGxldmVsIG9mIHNlY29uZHMuIFRoaXMgVVVJRCBzaG91bGQgYnkgY3J5cHRvZ3JhcGhpY2FsbHkgc2FmZSAoY2FuIG5vdCBiZSBndWVzc2VkKVxuXG4gICAgV2UgZ2VuZXJhdGUgYSBzYWZlIFVJRCB0aGF0IGlzIGd1YXJhbnRlZWQgdW5pcXVlIChieSB1c2FnZSBvZiBhIFBSTkcgdG8gZ2VuZWF0ZSAyNTYgYml0cykgYW5kIHRpbWUgc3RhbXBpbmcgd2l0aCB0aGUgbnVtYmVyIG9mIHNlY29uZHMgYXQgdGhlIG1vbWVudCB3aGVuIGlzIGdlbmVyYXRlZFxuICAgIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBzYWZlIHRvIHVzZSBhdCB0aGUgbGV2ZWwgb2YgdmVyeSBsYXJnZSBkaXN0cmlidXRlZCBzeXN0ZW1zLlxuICAgIFRoZSBVVUlEIGlzIHN0YW1wZWQgd2l0aCB0aW1lIChzZWNvbmRzKTogZG9lcyBpdCBvcGVuIGEgd2F5IHRvIGd1ZXNzIHRoZSBVVUlEPyBJdCBkZXBlbmRzIGhvdyBzYWZlIGlzIFwiY3J5cHRvXCIgUFJORywgYnV0IGl0IHNob3VsZCBiZSBubyBwcm9ibGVtLi4uXG5cbiAqL1xuXG52YXIgZ2VuZXJhdGVVaWQgPSBudWxsO1xuXG5cbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uKGV4dGVybmFsR2VuZXJhdG9yKXtcbiAgICBnZW5lcmF0ZVVpZCA9IGV4dGVybmFsR2VuZXJhdG9yLmdlbmVyYXRlVWlkO1xuICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn07XG5cbmV4cG9ydHMuc2FmZV91dWlkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJ1ZiA9IGdlbmVyYXRlVWlkKDMyKTtcbiAgICBzdGFtcFdpdGhUaW1lKGJ1ZiwgMTAwMCwgMyk7XG4gICAgcmV0dXJuIGVuY29kZShidWYpO1xufTtcblxuXG5cbi8qXG4gICAgVHJ5IHRvIGdlbmVyYXRlIGEgc21hbGwgVUlEIHRoYXQgaXMgdW5pcXVlIGFnYWluc3QgY2hhbmNlIGluIHRoZSBzYW1lIG1pbGxpc2Vjb25kIHNlY29uZCBhbmQgaW4gYSBzcGVjaWZpYyBjb250ZXh0IChlZyBpbiB0aGUgc2FtZSBjaG9yZW9ncmFwaHkgZXhlY3V0aW9uKVxuICAgIFRoZSBpZCBjb250YWlucyBhcm91bmQgNio4ID0gNDggIGJpdHMgb2YgcmFuZG9tbmVzcyBhbmQgYXJlIHVuaXF1ZSBhdCB0aGUgbGV2ZWwgb2YgbWlsbGlzZWNvbmRzXG4gICAgVGhpcyBtZXRob2QgaXMgc2FmZSBvbiBhIHNpbmdsZSBjb21wdXRlciBidXQgc2hvdWxkIGJlIHVzZWQgd2l0aCBjYXJlIG90aGVyd2lzZVxuICAgIFRoaXMgVVVJRCBpcyBub3QgY3J5cHRvZ3JhcGhpY2FsbHkgc2FmZSAoY2FuIGJlIGd1ZXNzZWQpXG4gKi9cbmV4cG9ydHMuc2hvcnRfdXVpZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgcmVxdWlyZSgnY3J5cHRvJykucmFuZG9tQnl0ZXMoMTIsIGZ1bmN0aW9uIChlcnIsIGJ1Zikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0YW1wV2l0aFRpbWUoYnVmLDEsMik7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGVuY29kZShidWYpKTtcbiAgICB9KTtcbn07IiwiY29uc3QgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG5jb25zdCBRdWV1ZSA9IHJlcXVpcmUoXCIuL1F1ZXVlXCIpO1xudmFyIFBTS0J1ZmZlciA9IHR5cGVvZiAkJCAhPT0gXCJ1bmRlZmluZWRcIiAmJiAkJC5QU0tCdWZmZXIgPyAkJC5QU0tCdWZmZXIgOiBCdWZmZXI7XG5cbmZ1bmN0aW9uIFVpZEdlbmVyYXRvcihtaW5CdWZmZXJzLCBidWZmZXJzU2l6ZSkge1xuXHR2YXIgYnVmZmVycyA9IG5ldyBRdWV1ZSgpO1xuXHR2YXIgbG93TGltaXQgPSAuMjtcblxuXHRmdW5jdGlvbiBmaWxsQnVmZmVycyhzaXplKXtcblx0XHQvL25vdGlmeU9ic2VydmVyKCk7XG5cdFx0Y29uc3Qgc3ogPSBzaXplIHx8IG1pbkJ1ZmZlcnM7XG5cdFx0aWYoYnVmZmVycy5sZW5ndGggPCBNYXRoLmZsb29yKG1pbkJ1ZmZlcnMqbG93TGltaXQpKXtcblx0XHRcdGZvcih2YXIgaT0wK2J1ZmZlcnMubGVuZ3RoOyBpIDwgc3o7IGkrKyl7XG5cdFx0XHRcdGdlbmVyYXRlT25lQnVmZmVyKG51bGwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZpbGxCdWZmZXJzKCk7XG5cblx0ZnVuY3Rpb24gZ2VuZXJhdGVPbmVCdWZmZXIoYil7XG5cdFx0aWYoIWIpe1xuXHRcdFx0YiA9IFBTS0J1ZmZlci5hbGxvYygwKTtcblx0XHR9XG5cdFx0Y29uc3Qgc3ogPSBidWZmZXJzU2l6ZSAtIGIubGVuZ3RoO1xuXHRcdC8qY3J5cHRvLnJhbmRvbUJ5dGVzKHN6LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcblx0XHRcdGJ1ZmZlcnMucHVzaChCdWZmZXIuY29uY2F0KFtyZXMsIGJdKSk7XG5cdFx0XHRub3RpZnlPYnNlcnZlcigpO1xuXHRcdH0pOyovXG5cdFx0YnVmZmVycy5wdXNoKFBTS0J1ZmZlci5jb25jYXQoWyBjcnlwdG8ucmFuZG9tQnl0ZXMoc3opLCBiIF0pKTtcblx0XHRub3RpZnlPYnNlcnZlcigpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXh0cmFjdE4obil7XG5cdFx0dmFyIHN6ID0gTWF0aC5mbG9vcihuIC8gYnVmZmVyc1NpemUpO1xuXHRcdHZhciByZXQgPSBbXTtcblxuXHRcdGZvcih2YXIgaT0wOyBpPHN6OyBpKyspe1xuXHRcdFx0cmV0LnB1c2goYnVmZmVycy5wb3AoKSk7XG5cdFx0XHRzZXRUaW1lb3V0KGdlbmVyYXRlT25lQnVmZmVyLCAxKTtcblx0XHR9XG5cblxuXG5cdFx0dmFyIHJlbWFpbmRlciA9IG4gJSBidWZmZXJzU2l6ZTtcblx0XHRpZihyZW1haW5kZXIgPiAwKXtcblx0XHRcdHZhciBmcm9udCA9IGJ1ZmZlcnMucG9wKCk7XG5cdFx0XHRyZXQucHVzaChmcm9udC5zbGljZSgwLHJlbWFpbmRlcikpO1xuXHRcdFx0Ly9nZW5lcmF0ZU9uZUJ1ZmZlcihmcm9udC5zbGljZShyZW1haW5kZXIpKTtcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0Z2VuZXJhdGVPbmVCdWZmZXIoZnJvbnQuc2xpY2UocmVtYWluZGVyKSk7XG5cdFx0XHR9LDEpO1xuXHRcdH1cblxuXHRcdC8vc2V0VGltZW91dChmaWxsQnVmZmVycywgMSk7XG5cblx0XHRyZXR1cm4gQnVmZmVyLmNvbmNhdChyZXQpO1xuXHR9XG5cblx0dmFyIGZpbGxJblByb2dyZXNzID0gZmFsc2U7XG5cblx0dGhpcy5nZW5lcmF0ZVVpZCA9IGZ1bmN0aW9uKG4pe1xuXHRcdHZhciB0b3RhbFNpemUgPSBidWZmZXJzLmxlbmd0aCAqIGJ1ZmZlcnNTaXplO1xuXHRcdGlmKG4gPD0gdG90YWxTaXplKXtcblx0XHRcdHJldHVybiBleHRyYWN0TihuKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIWZpbGxJblByb2dyZXNzKXtcblx0XHRcdFx0ZmlsbEluUHJvZ3Jlc3MgPSB0cnVlO1xuXHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0ZmlsbEJ1ZmZlcnMoTWF0aC5mbG9vcihtaW5CdWZmZXJzKjIuNSkpO1xuXHRcdFx0XHRcdGZpbGxJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdH0sIDEpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGNyeXB0by5yYW5kb21CeXRlcyhuKTtcblx0XHR9XG5cdH07XG5cblx0dmFyIG9ic2VydmVyO1xuXHR0aGlzLnJlZ2lzdGVyT2JzZXJ2ZXIgPSBmdW5jdGlvbihvYnMpe1xuXHRcdGlmKG9ic2VydmVyKXtcblx0XHRcdGNvbnNvbGUuZXJyb3IobmV3IEVycm9yKFwiT25lIG9ic2VydmVyIGFsbG93ZWQhXCIpKTtcblx0XHR9ZWxzZXtcblx0XHRcdGlmKHR5cGVvZiBvYnMgPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0b2JzZXJ2ZXIgPSBvYnM7XG5cdFx0XHRcdC8vbm90aWZ5T2JzZXJ2ZXIoKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0ZnVuY3Rpb24gbm90aWZ5T2JzZXJ2ZXIoKXtcblx0XHRpZihvYnNlcnZlcil7XG5cdFx0XHR2YXIgdmFsdWVUb1JlcG9ydCA9IGJ1ZmZlcnMubGVuZ3RoKmJ1ZmZlcnNTaXplO1xuXHRcdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRvYnNlcnZlcihudWxsLCB7XCJzaXplXCI6IHZhbHVlVG9SZXBvcnR9KTtcblx0XHRcdH0sIDEwKTtcblx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlVWlkR2VuZXJhdG9yID0gZnVuY3Rpb24gKG1pbkJ1ZmZlcnMsIGJ1ZmZlclNpemUpIHtcblx0cmV0dXJuIG5ldyBVaWRHZW5lcmF0b3IobWluQnVmZmVycywgYnVmZmVyU2l6ZSk7XG59O1xuIiwiLyohXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIGEgQnVmZmVyXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG4vLyBUaGUgX2lzQnVmZmVyIGNoZWNrIGlzIGZvciBTYWZhcmkgNS03IHN1cHBvcnQsIGJlY2F1c2UgaXQncyBtaXNzaW5nXG4vLyBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yLiBSZW1vdmUgdGhpcyBldmVudHVhbGx5XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmIChpc0J1ZmZlcihvYmopIHx8IGlzU2xvd0J1ZmZlcihvYmopIHx8ICEhb2JqLl9pc0J1ZmZlcilcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKG9iaikge1xuICByZXR1cm4gISFvYmouY29uc3RydWN0b3IgJiYgdHlwZW9mIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKVxufVxuXG4vLyBGb3IgTm9kZSB2MC4xMCBzdXBwb3J0LiBSZW1vdmUgdGhpcyBldmVudHVhbGx5LlxuZnVuY3Rpb24gaXNTbG93QnVmZmVyIChvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmoucmVhZEZsb2F0TEUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5zbGljZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpc0J1ZmZlcihvYmouc2xpY2UoMCwgMCkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0XHRcdFx0XHRjcmVhdGVRdWU6IHJlcXVpcmUoXCIuL2xpYi9mb2xkZXJNUVwiKS5nZXRGb2xkZXJRdWV1ZVxuXHRcdFx0XHRcdC8vZm9sZGVyTVE6IHJlcXVpcmUoXCIuL2xpYi9mb2xkZXJNUVwiKVxufTsiLCIvKlxuTW9kdWxlIHRoYXQgb2ZmZXJzIEFQSXMgdG8gaW50ZXJhY3Qgd2l0aCBQcml2YXRlU2t5IHdlYiBzYW5kYm94ZXNcbiAqL1xuXG5cbmNvbnN0IGV4cG9ydEJyb3dzZXJJbnRlcmFjdCA9IHtcbiAgICBlbmFibGVJZnJhbWVJbnRlcmFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuY3JlYXRlV2luZG93TVEgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvc3BlY2lmaWNNUUltcGwvQ2hpbGRXbmRNUVwiKS5jcmVhdGVNUTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuY3JlYXRlV2luZG93SW50ZXJhY3Rpb25TcGFjZSA9IHJlcXVpcmUoXCIuL2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9XaW5kb3dNUUludGVyYWN0aW9uU3BhY2VcIikuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZTtcbiAgICB9LFxuICAgIGVuYWJsZVJlYWN0SW50ZXJhY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVdpbmRvd01RID0gcmVxdWlyZShcIi4vbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL3NwZWNpZmljTVFJbXBsL0NoaWxkV25kTVFcIikuY3JlYXRlTVE7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVdpbmRvd0ludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvV2luZG93TVFJbnRlcmFjdGlvblNwYWNlXCIpLmNyZWF0ZUludGVyYWN0aW9uU3BhY2U7XG4gICAgfSxcbiAgICBlbmFibGVXZWJWaWV3SW50ZXJhY3Rpb25zOmZ1bmN0aW9uKCl7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVdpbmRvd0ludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvV2ViVmlld01RSW50ZXJhY3Rpb25TcGFjZVwiKS5jcmVhdGVJbnRlcmFjdGlvblNwYWNlO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5jcmVhdGVXaW5kb3dNUSA9IHJlcXVpcmUoXCIuL2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9zcGVjaWZpY01RSW1wbC9DaGlsZFdlYlZpZXdNUVwiKS5jcmVhdGVNUTtcbiAgICB9LFxuICAgIGVuYWJsZUxvY2FsSW50ZXJhY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZUludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvU291bmRQdWJTdWJNUUJhc2VkSW50ZXJhY3Rpb25TcGFjZVwiKS5jcmVhdGVJbnRlcmFjdGlvblNwYWNlO1xuICAgIH0sXG4gICAgZW5hYmxlUmVtb3RlSW50ZXJhY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVJlbW90ZUludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKCcuL2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9odHRwSW50ZXJhY3Rpb25TcGFjZScpLmNyZWF0ZUludGVyYWN0aW9uU3BhY2U7XG4gICAgfVxufTtcblxuXG5pZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXhwb3J0QnJvd3NlckludGVyYWN0O1xufVxuZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGNyZWF0ZU5vZGVJbnRlcmFjdGlvblNwYWNlOiByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvZm9sZGVyTVFCYXNlZEludGVyYWN0aW9uU3BhY2VcIikuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSxcbiAgICAgICAgY3JlYXRlSW50ZXJhY3Rpb25TcGFjZTogcmVxdWlyZShcIi4vbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL1NvdW5kUHViU3ViTVFCYXNlZEludGVyYWN0aW9uU3BhY2VcIikuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSxcbiAgICAgICAgY3JlYXRlUmVtb3RlSW50ZXJhY3Rpb25TcGFjZTogcmVxdWlyZSgnLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvaHR0cEludGVyYWN0aW9uU3BhY2UnKS5jcmVhdGVJbnRlcmFjdGlvblNwYWNlXG4gICAgfTtcbn0iLCIvL3RvIGxvb2sgbmljZSB0aGUgcmVxdWlyZU1vZHVsZSBvbiBOb2RlXG5yZXF1aXJlKFwiLi9saWIvcHNrLWFic3RyYWN0LWNsaWVudFwiKTtcbmlmKCEkJC5icm93c2VyUnVudGltZSl7XG5cdHJlcXVpcmUoXCIuL2xpYi9wc2stbm9kZS1jbGllbnRcIik7XG59ZWxzZXtcblx0cmVxdWlyZShcIi4vbGliL3Bzay1icm93c2VyLWNsaWVudFwiKTtcbn0iLCJtb2R1bGUuZXhwb3J0cy5Pd00gPSByZXF1aXJlKFwiLi9saWIvT3dNXCIpO1xubW9kdWxlLmV4cG9ydHMuYmVlc0hlYWxlciA9IHJlcXVpcmUoXCIuL2xpYi9iZWVzSGVhbGVyXCIpO1xuXG5jb25zdCB1aWRHZW5lcmF0b3IgPSByZXF1aXJlKFwiLi9saWIvdWlkR2VuZXJhdG9yXCIpLmNyZWF0ZVVpZEdlbmVyYXRvcigyMDAsIDMyKTtcblxubW9kdWxlLmV4cG9ydHMuc2FmZV91dWlkID0gcmVxdWlyZShcIi4vbGliL3NhZmUtdXVpZFwiKS5pbml0KHVpZEdlbmVyYXRvcik7XG5cbm1vZHVsZS5leHBvcnRzLlF1ZXVlID0gcmVxdWlyZShcIi4vbGliL1F1ZXVlXCIpO1xubW9kdWxlLmV4cG9ydHMuY29tYm9zID0gcmVxdWlyZShcIi4vbGliL0NvbWJvc1wiKTtcblxubW9kdWxlLmV4cG9ydHMudWlkR2VuZXJhdG9yID0gdWlkR2VuZXJhdG9yO1xubW9kdWxlLmV4cG9ydHMuZ2VuZXJhdGVVaWQgPSB1aWRHZW5lcmF0b3IuZ2VuZXJhdGVVaWQ7XG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZVBza0NvbnNvbGUgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiByZXF1aXJlKCcuL2xpYi9wc2tjb25zb2xlJyk7XG59O1xuXG5cbmlmKHR5cGVvZiBnbG9iYWwuJCQgPT0gXCJ1bmRlZmluZWRcIil7XG4gIGdsb2JhbC4kJCA9IHt9O1xufVxuXG5pZih0eXBlb2YgZ2xvYmFsLiQkLnVpZEdlbmVyYXRvciA9PSBcInVuZGVmaW5lZFwiKXtcbiAgICAkJC51aWRHZW5lcmF0b3IgPSBtb2R1bGUuZXhwb3J0cy5zYWZlX3V1aWQ7XG59XG4iXX0=
