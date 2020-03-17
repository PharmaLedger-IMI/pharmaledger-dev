virtualMQRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/opt/privatesky/builds/tmp/virtualMQ_intermediar.js":[function(require,module,exports){
(function (global){
global.virtualMQLoadModules = function(){ 
	$$.__runtimeModules["virtualmq"] = require("virtualmq");
	$$.__runtimeModules["foldermq"] = require("foldermq");
	$$.__runtimeModules["yazl"] = require("yazl");
	$$.__runtimeModules["yauzl"] = require("yauzl");
	$$.__runtimeModules["buffer-crc32"] = require("buffer-crc32");
	$$.__runtimeModules["node-fd-slicer"] = require("node-fd-slicer");
	$$.__runtimeModules["edfs"] = require("edfs");
	$$.__runtimeModules["pskdb"] = require("pskdb");
	$$.__runtimeModules["psk-http-client"] = require("psk-http-client");
	$$.__runtimeModules["signsensus"] = require("signsensus");
}
if (false) {
	virtualMQLoadModules();
}; 
global.virtualMQRequire = require;
if (typeof $$ !== "undefined") {            
    $$.requireBundle("virtualMQ");
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"buffer-crc32":"buffer-crc32","edfs":"edfs","foldermq":"foldermq","node-fd-slicer":"node-fd-slicer","psk-http-client":"psk-http-client","pskdb":"pskdb","signsensus":"signsensus","virtualmq":"virtualmq","yauzl":"yauzl","yazl":"yazl"}],"/opt/privatesky/modules/edfs/flows/BricksManager.js":[function(require,module,exports){
const path = require("path");
const fs = require("fs");
const PskHash = require('pskcrypto').PskHash;

const folderNameSize = process.env.FOLDER_NAME_SIZE || 5;
const FILE_SEPARATOR = '-';
let rootfolder;

$$.flow.describe("BricksManager", {
    init: function (rootFolder, callback) {
        if (!rootFolder) {
            callback(new Error("No root folder specified!"));
            return;
        }
        rootFolder = path.resolve(rootFolder);
        this.__ensureFolderStructure(rootFolder, function (err, path) {
            rootfolder = rootFolder;
            callback(err, rootFolder);
        });
    },
    write: function (fileName, readFileStream, callback) {
        if (!this.__verifyFileName(fileName, callback)) {
            return;
        }

        if (!readFileStream || !readFileStream.pipe || typeof readFileStream.pipe !== "function") {
            callback(new Error("Something wrong happened"));
            return;
        }

        const folderName = path.join(rootfolder, fileName.substr(0, folderNameSize));

        const serial = this.serial(() => {
        });

        serial.__ensureFolderStructure(folderName, serial.__progress);
        serial.__writeFile(readFileStream, folderName, fileName, callback);
    },
    read: function (fileName, writeFileStream, callback) {
        if (!this.__verifyFileName(fileName, callback)) {
            return;
        }

        const folderPath = path.join(rootfolder, fileName.substr(0, folderNameSize));
        const filePath = path.join(folderPath, fileName);
        this.__verifyFileExistence(filePath, (err, result) => {
            if (!err) {
                this.__readFile(writeFileStream, filePath, callback);
            } else {
                callback(new Error("No file found."));
            }
        });
    },
    addAlias: function (filename, alias, callback) {
        if (!this.__verifyFileName(fileName, callback)) {
            return;
        }

        if (!alias) {
            return callback(new Error("No alias was provided"));
        }

        if (!this.aliases) {
            this.aliases = {};
        }

        this.aliases[alias] = filename;

        callback();
    },
    writeWithAlias: function (alias, readStream, callback) {
        const fileName = this.__getFileName(alias, callback);
        this.write(fileName, readStream, callback);
    },
    readWithAlias: function (alias, writeStream, callback) {
        const fileName = this.__getFileName(alias, callback);
        this.read(fileName, writeStream, callback);
    },
    readVersion: function (fileName, fileVersion, writeFileStream, callback) {
        if (!this.__verifyFileName(fileName, callback)) {
            return;
        }

        const folderPath = path.join(rootfolder, fileName.substr(0, folderNameSize));
        const filePath = path.join(folderPath, fileName, fileVersion);
        this.__verifyFileExistence(filePath, (err, result) => {
            if (!err) {
                this.__readFile(writeFileStream, path.join(filePath), callback);
            } else {
                callback(new Error("No file found."));
            }
        });
    },
    getVersionsForFile: function (fileName, callback) {
        if (!this.__verifyFileName(fileName, callback)) {
            return;
        }

        const folderPath = path.join(rootfolder, fileName.substr(0, folderNameSize), fileName);
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                return callback(err);
            }

            const totalNumberOfFiles = files.length;
            const filesData = [];

            let resolvedFiles = 0;

            for (let i = 0; i < totalNumberOfFiles; ++i) {
                fs.stat(path.join(folderPath, files[i]), (err, stats) => {
                    if (err) {
                        filesData.push({version: files[i], creationTime: null, creationTimeMs: null});
                        return;
                    }

                    filesData.push({
                        version: files[i],
                        creationTime: stats.birthtime,
                        creationTimeMs: stats.birthtimeMs
                    });

                    resolvedFiles += 1;

                    if (resolvedFiles >= totalNumberOfFiles) {
                        filesData.sort((first, second) => {
                            const firstCompareData = first.creationTimeMs || first.version;
                            const secondCompareData = second.creationTimeMs || second.version;

                            return firstCompareData - secondCompareData;
                        });
                        callback(undefined, filesData);
                    }
                });
            }
        });
    },
    compareVersions: function (bodyStream, callback) {
        let body = '';

        bodyStream.on('data', (data) => {
            body += data;
        });

        bodyStream.on('end', () => {
            try {
                body = JSON.parse(body);
                this.__compareVersions(body, callback);
            } catch (e) {
                callback(e);
            }
        });
    },
    __verifyFileName: function (fileName, callback) {
        if (!fileName || typeof fileName != "string") {
            callback(new Error("No fileId specified."));
            return;
        }

        if (fileName.length < folderNameSize) {
            callback(new Error("FileId too small. " + fileName));
            return;
        }

        return true;
    },
    __ensureFolderStructure: function (folder, callback) {
        fs.mkdir(folder, {recursive: true}, callback);
    },
    __writeFile: function (readStream, folderPath, fileName, callback) {
        const hash = require("crypto").createHash("sha256");
        const filePath = path.join(folderPath, fileName);
        fs.access(filePath, (err) => {
            if (err) {
                readStream.on('data', (data) => {
                    hash.update(data);
                });

                const writeStream = fs.createWriteStream(filePath, {mode: 0o444});

                writeStream.on("finish", () => {
                    const hashDigest = hash.digest("hex");
                    if (hashDigest !== fileName) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                return callback(err);
                            } else {
                                return callback(new Error("Content hash and filename are not the same"));
                            }
                        });
                    }
                });

                writeStream.on("error", function () {
                    writeStream.close();
                    readStream.close();
                    callback(...arguments);
                });

                readStream.pipe(writeStream);
            } else {
                callback();

            }
        });
    },
    __getNextVersionFileName: function (folderPath, fileName, callback) {
        this.__getLatestVersionNameOfFile(folderPath, (err, fileVersion) => {
            if (err) {
                console.error(err);
                return callback(err);
            }

            callback(undefined, fileVersion.numericVersion + 1);
        });
    }
    ,
    __getLatestVersionNameOfFile: function (folderPath, callback) {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error(err);
                callback(err);
                return;
            }

            let fileVersion = {numericVersion: 0, fullVersion: '0' + FILE_SEPARATOR};

            if (files.length > 0) {
                try {
                    const allVersions = files.map(file => file.split(FILE_SEPARATOR)[0]);
                    const latestFile = this.__maxElement(allVersions);
                    fileVersion = {
                        numericVersion: parseInt(latestFile),
                        fullVersion: files.filter(file => file.split(FILE_SEPARATOR)[0] === latestFile.toString())[0]
                    };

                } catch (e) {
                    e.code = 'invalid_file_name_found';
                    callback(e);
                }
            }

            callback(undefined, fileVersion);
        });
    }
    ,
    __maxElement: function (numbers) {
        let max = numbers[0];

        for (let i = 1; i < numbers.length; ++i) {
            max = Math.max(max, numbers[i]);
        }

        if (isNaN(max)) {
            throw new Error('Invalid element found');
        }

        return max;
    }
    ,
    __compareVersions: function (files, callback) {
        const filesWithChanges = [];
        const entries = Object.entries(files);
        let remaining = entries.length;

        if (entries.length === 0) {
            callback(undefined, filesWithChanges);
            return;
        }

        entries.forEach(([fileName, fileHash]) => {
            this.getVersionsForFile(fileName, (err, versions) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        versions = [];
                    } else {
                        callback(err);
                    }

                }

                const match = versions.some(version => {
                    const hash = version.version.split(FILE_SEPARATOR)[1];
                    return hash === fileHash;
                });

                if (!match) {
                    filesWithChanges.push(fileName);
                }

                if (--remaining === 0) {
                    callback(undefined, filesWithChanges);
                }
            })
        });
    }
    ,
    __readFile: function (writeFileStream, filePath, callback) {
        const readStream = fs.createReadStream(filePath);

        writeFileStream.on("finish", callback);
        writeFileStream.on("error", callback);

        readStream.pipe(writeFileStream);
    }
    ,
    __progress: function (err, result) {
        if (err) {
            console.error(err);
        }
    }
    ,
    __verifyFileExistence: function (filePath, callback) {
        fs.access(filePath, callback);
    }
    ,
    __getFileName: function (alias, callback) {
        if (!this.aliases) {
            return callback(new Error("No files have been associated with aliases"));
        }
        const fileName = this.aliases[alias];
        if (!fileName) {
            return callback(new Error("The specified alias was not associated with any file"));
        } else {
            return fileName;
        }
    }
    ,
});

},{"crypto":false,"fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/edfs/lib/EDFSMiddleware.js":[function(require,module,exports){
require("../flows/BricksManager");

function EDFSMiddleware(server) {

    server.post('/:fileId', (req, res) => {
        $$.flow.start("BricksManager").write(req.params.fileId, req, (err, result) => {
            res.statusCode = 201;
            if (err) {
                res.statusCode = 500;

                if (err.code === 'EACCES') {
                    res.statusCode = 409;
                }
            }
            res.end();
        });

    });

    server.get('/:fileId', (req, res) => {
        res.setHeader("content-type", "application/octet-stream");
        $$.flow.start("BricksManager").read(req.params.fileId, res, (err, result) => {
            res.statusCode = 200;
            if (err) {
                console.log(err);
                res.statusCode = 404;
            }
            res.end();
        });
    });

    server.post('/addAlias/:fileId', (req, res) => {
        $$.flow.start("BricksManager").addAlias(req.params.fileId, req,  (err, result) => {
            res.statusCode = 201;
            if (err) {
                res.statusCode = 500;

                if (err.code === 'EACCES') {
                    res.statusCode = 409;
                }
            }
            res.end();
        });

    });

    server.post('/alias/:alias', (req, res) => {
        $$.flow.start("BricksManager").writeWithAlias(req.params.alias, req,  (err, result) => {
            res.statusCode = 201;
            if (err) {
                res.statusCode = 500;

                if (err.code === 'EACCES') {
                    res.statusCode = 409;
                }
            }
            res.end();
        });
    });

    server.get('/alias/:alias', (req, res) => {
        res.setHeader("content-type", "application/octet-stream");
        $$.flow.start("BricksManager").readWithAlias(req.params.alias, res, (err, result) => {
            res.statusCode = 200;
            if (err) {
                console.log(err);
                res.statusCode = 404;
            }
            res.end();
        });
    });
}

module.exports = EDFSMiddleware;
},{"../flows/BricksManager":"/opt/privatesky/modules/edfs/flows/BricksManager.js"}],"/opt/privatesky/modules/foldermq/lib/folderMQ.js":[function(require,module,exports){
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

},{"fs":false,"path":false,"swarmutils":false}],"/opt/privatesky/modules/node-fd-slicer/modules/node-pend/index.js":[function(require,module,exports){
module.exports = Pend;

function Pend() {
  this.pending = 0;
  this.max = Infinity;
  this.listeners = [];
  this.waiting = [];
  this.error = null;
}

Pend.prototype.go = function(fn) {
  if (this.pending < this.max) {
    pendGo(this, fn);
  } else {
    this.waiting.push(fn);
  }
};

Pend.prototype.wait = function(cb) {
  if (this.pending === 0) {
    cb(this.error);
  } else {
    this.listeners.push(cb);
  }
};

Pend.prototype.hold = function() {
  return pendHold(this);
};

function pendHold(self) {
  self.pending += 1;
  var called = false;
  return onCb;
  function onCb(err) {
    if (called) throw new Error("callback called twice");
    called = true;
    self.error = self.error || err;
    self.pending -= 1;
    if (self.waiting.length > 0 && self.pending < self.max) {
      pendGo(self, self.waiting.shift());
    } else if (self.pending === 0) {
      var listeners = self.listeners;
      self.listeners = [];
      listeners.forEach(cbListener);
    }
  }
  function cbListener(listener) {
    listener(self.error);
  }
}

function pendGo(self, fn) {
  fn(pendHold(self));
}

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

},{"../../../node_modules/is-buffer/index.js":"/opt/privatesky/node_modules/is-buffer/index.js","@msgpack/msgpack":false,"swarmutils":false}],"/opt/privatesky/modules/psk-http-client/lib/psk-browser-client.js":[function(require,module,exports){
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

},{"./psk-abstract-client":"/opt/privatesky/modules/psk-http-client/lib/psk-abstract-client.js","buffer":false,"http":false,"https":false,"url":false}],"/opt/privatesky/modules/pskdb/lib/Blockchain.js":[function(require,module,exports){
const consUtil = require('signsensus').consUtil;
const beesHealer = require("swarmutils").beesHealer;

function Blockchain(pds) {
    let swarm = null;

    this.beginTransaction = function (transactionSwarm) {
        if (!transactionSwarm) {
            throw new Error('Missing swarm');
        }

        swarm = transactionSwarm;
        return new Transaction(pds.getHandler());
    };

    this.commit = function (transaction) {

        const diff = pds.computeSwarmTransactionDiff(swarm, transaction.getHandler());
        const t = consUtil.createTransaction(0, diff);
        const set = {};
        set[t.digest] = t;
        pds.commit(set, 1);
    };
}


function Transaction(pdsHandler) {
    const ALIASES = '/aliases';


    this.add = function (asset) {
        const swarmTypeName = asset.getMetadata('swarmTypeName');
        const swarmId = asset.getMetadata('swarmId');

        const aliasIndex = new AliasIndex(swarmTypeName);
        if (asset.alias && aliasIndex.getUid(asset.alias) !== swarmId) {
            aliasIndex.create(asset.alias, swarmId);
        }

        asset.setMetadata('persisted', true);
        const serializedSwarm = beesHealer.asJSON(asset, null, null);

        pdsHandler.writeKey(swarmTypeName + '/' + swarmId, J(serializedSwarm));
    };

    this.lookup = function (assetType, aid) { // alias sau id
        let localUid = aid;

        if (hasAliases(assetType)) {
            const aliasIndex = new AliasIndex(assetType);
            localUid = aliasIndex.getUid(aid) || aid;
        }

        const value = pdsHandler.readKey(assetType + '/' + localUid);

        if (!value) {
            return $$.asset.start(assetType);
        } else {
            const swarm = $$.asset.continue(assetType, JSON.parse(value));
            swarm.setMetadata("persisted", true);
            return swarm;
        }
    };

    this.loadAssets = function (assetType) {
        const assets = [];

        const aliasIndex = new AliasIndex(assetType);
        Object.keys(aliasIndex.getAliases()).forEach((alias) => {
            assets.push(this.lookup(assetType, alias));
        });

        return assets;
    };

    this.getHandler = function () {
        return pdsHandler;
    };

    function hasAliases(spaceName) {
        return !!pdsHandler.readKey(spaceName + ALIASES);
    }

    function AliasIndex(assetType) {
        this.create = function (alias, uid) {
            const assetAliases = this.getAliases();

            if (typeof assetAliases[alias] !== "undefined") {
                $$.errorHandler.throwError(new Error(`Alias ${alias} for assets of type ${assetType} already exists`));
            }

            assetAliases[alias] = uid;

            pdsHandler.writeKey(assetType + ALIASES, J(assetAliases));
        };

        this.getUid = function (alias) {
            const assetAliases = this.getAliases();
            return assetAliases[alias];
        };

        this.getAliases = function () {
            let aliases = pdsHandler.readKey(assetType + ALIASES);
            return aliases ? JSON.parse(aliases) : {};
        };
    }
}

module.exports = Blockchain;
},{"signsensus":"signsensus","swarmutils":false}],"/opt/privatesky/modules/pskdb/lib/FolderPersistentPDS.js":[function(require,module,exports){
var memoryPDS = require("./InMemoryPDS");
var fs = require("fs");
var path = require("path");


function FolderPersistentPDS(folder) {
    this.memCache = memoryPDS.newPDS(this);

    function mkSingleLine(str) {
        return str.replace(/[\n\r]/g, "");
    }

    function makeCurrentValueFilename() {
        return path.normalize(folder + '/currentVersion');
    }

    function getCurrentValue(path) {
        try {
            if(!fs.existsSync(path)) {
                return null;
            }

            return JSON.parse(fs.readFileSync(path).toString());
        } catch (e) {
            console.log('error ', e);
            return null;
        }
    }

    this.persist = function (transactionLog, currentValues, currentPulse) {

        transactionLog.currentPulse = currentPulse;
        transactionLog = mkSingleLine(JSON.stringify(transactionLog)) + "\n";

        fs.mkdir(folder, {recursive: true}, function (err, res) {
            if (err && err.code !== "EEXIST") {
                throw err;
            }

            fs.appendFileSync(folder + '/transactionsLog', transactionLog, 'utf8');
            fs.writeFileSync(makeCurrentValueFilename(), JSON.stringify(currentValues, null, 1));
        });
    };

    const innerValues = getCurrentValue(makeCurrentValueFilename());
    this.memCache.initialise(innerValues);
}

exports.newPDS = function (folder) {
    const pds = new FolderPersistentPDS(folder);
    return pds.memCache;
};

},{"./InMemoryPDS":"/opt/privatesky/modules/pskdb/lib/InMemoryPDS.js","fs":false,"path":false}],"/opt/privatesky/modules/pskdb/lib/InMemoryPDS.js":[function(require,module,exports){
(function (global){

var cutil   = require("../../signsensus/lib/consUtil");
var ssutil  = require("pskcrypto");


function Storage(parentStorage){
    var cset            = {};  // containes all keys in parent storage, contains only keys touched in handlers
    var writeSet        = !parentStorage ? cset : {};   //contains only keys modified in handlers

    var readSetVersions  = {}; //meaningful only in handlers
    var writeSetVersions = {}; //will store all versions generated by writeKey

    var vsd             = "empty"; //only for parent storage
    var previousVSD     = null;

    var myCurrentPulse    = 0;
    var self = this;


    function hasLocalKey(name){
        return cset.hasOwnProperty(name);
    }

    this.hasKey = function(name){
        return parentStorage ? parentStorage.hasKey(name) : hasLocalKey(name);
    };

    this.readKey = function readKey(name){
        var value;
        if(hasLocalKey(name)){
            value = cset[name];
        }else{
            if(this.hasKey(name)){
                value = parentStorage.readKey(name);
                cset[name] = value;
                readSetVersions[name] = parentStorage.getVersion(name);
            }else{
                cset[name] = undefined;
                readSetVersions[name] = 0;
            }
            writeSetVersions[name] = readSetVersions[name];
        }
        return value;
    };

    this.getVersion = function(name, realVersion){
        var version = 0;
        if(hasLocalKey(name)){
            version = readSetVersions[name];
        }else{
            if(this.hasKey(name)){
                cset[name] = parentStorage.readKey();
                version = readSetVersions[name] = parentStorage.getVersion(name);
            }else{
                cset[name] = undefined;
                readSetVersions[name] = version;
            }
        }
        return version;
    };

    this.writeKey = function modifyKey(name, value){
        var k = this.readKey(name); //TODO: unused var

        cset [name] = value;
        writeSetVersions[name]++;
        writeSet[name] = value;
    };

    this.getInputOutput = function () {
        return {
            input: readSetVersions,
            output: writeSet
        };
    };

    this.getInternalValues = function(currentPulse, updatePreviousVSD){
        if(updatePreviousVSD){
            myCurrentPulse = currentPulse;
            previousVSD = vsd;
        }
        return {
            cset:cset,
            writeSetVersions:writeSetVersions,
            previousVSD:previousVSD,
            vsd:vsd,
            currentPulse:currentPulse
        };
    };

    this.initialiseInternalValue = function(storedValues){
        if(!storedValues) {
            return;
        }

        cset = storedValues.cset;
        writeSetVersions = storedValues.writeSetVersions;
        vsd = storedValues.vsd;
        writeSet = cset;
        myCurrentPulse = storedValues.currentPulse;
        previousVSD = storedValues.previousVSD;
    };

    function applyTransaction(t){
        for(let k in t.output){ 
            if(!t.input.hasOwnProperty(k)){
                return false;
            }
        }
        for(let l in t.input){
            var transactionVersion = t.input[l];
            var currentVersion = self.getVersion(l);
            if(transactionVersion !== currentVersion){
                //console.log(l, transactionVersion , currentVersion);
                return false;
            }
        }

        for(let v in t.output){
            self.writeKey(v, t.output[v]);
        }

		var arr = process.hrtime();
		var current_second = arr[0];
		var diff = current_second-t.second;

		global["Tranzactions_Time"]+=diff;

		return true;
    }

    this.computePTBlock = function(nextBlockSet){   //make a transactions block from nextBlockSet by removing invalid transactions from the key versions point of view
        var validBlock = [];
        var orderedByTime = cutil.orderTransactions(nextBlockSet);
        var i = 0;

        while(i < orderedByTime.length){
            var t = orderedByTime[i];
            if(applyTransaction(t)){
                validBlock.push(t.digest);
            }
            i++;
        }
        return validBlock;
    };

    this.commit = function(blockSet){
        var i = 0;
        var orderedByTime = cutil.orderTransactions(blockSet);

        while(i < orderedByTime.length){
            var t = orderedByTime[i];
            if(!applyTransaction(t)){ //paranoid check,  fail to work if a majority is corrupted
                //pretty bad
                //throw new Error("Failed to commit an invalid block. This could be a nasty bug or the stakeholders majority is corrupted! It should never happen!");
                console.log("Failed to commit an invalid block. This could be a nasty bug or the stakeholders majority is corrupted! It should never happen!"); //TODO: replace with better error handling
            }
            i++;
        }
        this.getVSD(true);
    };

    this.getVSD = function(forceCalculation){
        if(forceCalculation){
            var tmp = this.getInternalValues(myCurrentPulse, true);
            vsd = ssutil.hashValues(tmp);
        }
        return vsd;
    };
}

function InMemoryPDS(permanentPersistence){

    var mainStorage = new Storage(null);


    this.getHandler = function(){ // a way to work with PDS
        var tempStorage = new Storage(mainStorage);
        return tempStorage;
    };

    this.computeSwarmTransactionDiff = function(swarm, forkedPds){
        var inpOutp     = forkedPds.getInputOutput();
        swarm.input     = inpOutp.input;
        swarm.output    = inpOutp.output;
        return swarm;
    };

    this.computePTBlock = function(nextBlockSet){
        var tempStorage = new Storage(mainStorage);
        return tempStorage.computePTBlock(nextBlockSet);

    };

    this.commit = function(blockSet, currentPulse){
        mainStorage.commit(blockSet);
        if(permanentPersistence) {
            permanentPersistence.persist(blockSet, mainStorage.getInternalValues(currentPulse, false), currentPulse);
        }
    };

    this.getVSD = function (){
        return mainStorage.getVSD(false);
    };

    this.initialise = function(savedInternalValues){
        mainStorage.initialiseInternalValue(savedInternalValues);
    };

}


exports.newPDS = function(persistence){
    return new InMemoryPDS(persistence);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../../signsensus/lib/consUtil":"/opt/privatesky/modules/signsensus/lib/consUtil.js","pskcrypto":false}],"/opt/privatesky/modules/pskdb/lib/PersistentPDS.js":[function(require,module,exports){
const memoryPDS = require("./InMemoryPDS");

function PersistentPDS({getInitValues, persist}) {
	this.memCache = memoryPDS.newPDS(this);
	this.persist = persist;

	const innerValues = getInitValues() || null;
	this.memCache.initialise(innerValues);
}


module.exports.newPDS = function (readerWriter) {
	const pds = new PersistentPDS(readerWriter);
	return pds.memCache;
};

},{"./InMemoryPDS":"/opt/privatesky/modules/pskdb/lib/InMemoryPDS.js"}],"/opt/privatesky/modules/pskdb/lib/domain/ACLScope.js":[function(require,module,exports){

$$.asset.describe("ACLScope", {
    public:{
        concern:"string:key",
        db:"json"
    },
    init:function(concern){
        this.concern = concern;
    },
    addResourceParent : function(resourceId, parentId){
        //TODO: empty functions!
    },
    addZoneParent : function(zoneId, parentId){
        //TODO: empty functions!
    },
    grant :function(agentId,  resourceId){
        //TODO: empty functions!
    },
    allow :function(agentId,  resourceId){
        return true;
    }
});
},{}],"/opt/privatesky/modules/pskdb/lib/domain/Agent.js":[function(require,module,exports){

$$.asset.describe("Agent", {
    public:{
        alias:"string:key",
        publicKey:"string"
    },
    init:function(alias, value){
        this.alias      = alias;
        this.publicKey  = value;
    },
    update:function(value){
        this.publicKey = value;
    },
    addAgent: function () {
        throw new Error('Not Implemented');
    },
    listAgent: function () {
        throw new Error('Not Implemented');

    },
    removeAgent: function () {
        throw new Error('Not Implemented');

    }
});
},{}],"/opt/privatesky/modules/pskdb/lib/domain/Backup.js":[function(require,module,exports){

$$.asset.describe("Backup", {
    public:{
        id:  "string",
        url: "string"
    },

    init:function(id, url){
        this.id = id;
        this.url = url;
    }
});

},{}],"/opt/privatesky/modules/pskdb/lib/domain/CSBMeta.js":[function(require,module,exports){

$$.asset.describe("CSBMeta", {
	public:{
		isMaster:"string",
		alias:"string:key",
		description: "string",
		creationDate: "string",
		updatedDate : "string",
		id: "string",
		icon: "string"
	},
	init:function(id){
		this.alias = "meta";
		this.id = id;
	},

	setIsMaster: function (isMaster) {
		this.isMaster = isMaster;
	}

});

},{}],"/opt/privatesky/modules/pskdb/lib/domain/CSBReference.js":[function(require,module,exports){

$$.asset.describe("CSBReference", {
    public:{
        alias:"string:key",
        seed :"string",
        dseed:"string"
    },
    init:function(alias, seed, dseed ){
        this.alias = alias;
        this.seed  = seed;
        this.dseed = dseed;
    },
    update:function(fingerprint){
        this.fingerprint = fingerprint;
        this.version++;
    },
    registerBackupUrl:function(backupUrl){
        this.backups.add(backupUrl);
    }
});

},{}],"/opt/privatesky/modules/pskdb/lib/domain/DomainReference.js":[function(require,module,exports){

$$.asset.describe("DomainReference", {
    public:{
        role:"string:index",
        alias:"string:key",
        addresses:"map",
        constitution:"string",
        workspace:"string",
        remoteInterfaces:"map",
        localInterfaces:"map"
    },
    init:function(role, alias){
        this.role = role;
        this.alias = alias;
        this.addresses = {};
        this.remoteInterfaces = {};
        this.localInterfaces = {};
    },
    updateDomainAddress:function(replicationAgent, address){
        if(!this.addresses){
            this.addresses = {};
        }
        this.addresses[replicationAgent] = address;
    },
    removeDomainAddress:function(replicationAgent){
        this.addresses[replicationAgent] = undefined;
        delete this.addresses[replicationAgent];
    },
    addRemoteInterface:function(alias, remoteEndPoint){
        if(!this.remoteInterfaces){
            this.remoteInterfaces = {};
        }
        this.remoteInterfaces[alias] = remoteEndPoint;
    },
    removeRemoteInterface:function(alias){
        if(this.remoteInterface){
            this.remoteInterfaces[alias] = undefined;
            delete this.remoteInterfaces[alias];
        }
    },
    addLocalInterface:function(alias, path){
        if(!this.localInterfaces){
            this.localInterfaces = {};
        }
        this.localInterfaces[alias] = path;
    },
    removeLocalInterface:function(alias){
        if(this.localInterfaces){
            this.localInterfaces[alias] = undefined;
            delete this.localInterfaces[alias];
        }
    },
    setConstitution:function(pathOrUrlOrCSB){
        this.constitution = pathOrUrlOrCSB;
    },
    getConstitution:function(){
        return this.constitution;
    },
    setWorkspace:function(path){
        this.workspace = path;
    },
    getWorkspace:function(){
        return this.workspace;
    }
});
},{}],"/opt/privatesky/modules/pskdb/lib/domain/EmbeddedFile.js":[function(require,module,exports){
$$.asset.describe("EmbeddedFile", {
	public:{
		alias:"string"
	},

	init:function(alias){
		this.alias = alias;
	}
});
},{}],"/opt/privatesky/modules/pskdb/lib/domain/FileReference.js":[function(require,module,exports){
$$.asset.describe("FileReference", {
	public:{
		alias:"string",
		seed :"string",
		dseed:"string"
	},
	init:function(alias, seed, dseed){
		this.alias = alias;
		this.seed  = seed;
		this.dseed = dseed;
	}
});
},{}],"/opt/privatesky/modules/pskdb/lib/domain/Key.js":[function(require,module,exports){

$$.asset.describe("key", {
    public:{
        alias:"string"
    },
    init:function(alias, value){
        this.alias = alias;
        this.value = value;
    },
    update:function(value){
        this.value = value;
    }
});
},{}],"/opt/privatesky/modules/pskdb/lib/domain/index.js":[function(require,module,exports){
module.exports = $$.library(function(){
    require("./DomainReference");
    require("./CSBReference");
    require("./Agent");
    require("./Backup");
    require("./ACLScope");
    require("./Key");
    require("./transactions");
    require("./FileReference");
    require("./EmbeddedFile");
    require('./CSBMeta');
});
},{"./ACLScope":"/opt/privatesky/modules/pskdb/lib/domain/ACLScope.js","./Agent":"/opt/privatesky/modules/pskdb/lib/domain/Agent.js","./Backup":"/opt/privatesky/modules/pskdb/lib/domain/Backup.js","./CSBMeta":"/opt/privatesky/modules/pskdb/lib/domain/CSBMeta.js","./CSBReference":"/opt/privatesky/modules/pskdb/lib/domain/CSBReference.js","./DomainReference":"/opt/privatesky/modules/pskdb/lib/domain/DomainReference.js","./EmbeddedFile":"/opt/privatesky/modules/pskdb/lib/domain/EmbeddedFile.js","./FileReference":"/opt/privatesky/modules/pskdb/lib/domain/FileReference.js","./Key":"/opt/privatesky/modules/pskdb/lib/domain/Key.js","./transactions":"/opt/privatesky/modules/pskdb/lib/domain/transactions.js"}],"/opt/privatesky/modules/pskdb/lib/domain/transactions.js":[function(require,module,exports){
$$.transaction.describe("transactions", {
    updateKey: function (key, value) {
        var transaction = $$.blockchain.beginTransaction(this);
        var key = transaction.lookup("Key", key);
        var keyPermissions = transaction.lookup("ACLScope", "KeysConcern");
        if (keyPermissions.allow(this.agentId, key)) {
            key.update(value);
            transaction.add(key);
            $$.blockchain.commit(transaction);
        } else {
            this.securityError("Agent " + this.agentId + " denied to change key " + key);
        }
    },
    addChild: function (alias) {
        var transaction = $$.blockchain.beginTransaction();
        var reference = $$.contract.start("DomainReference", "init", "child", alias);
        transaction.add(reference);
        $$.blockchain.commit(transaction);
    },
    addParent: function (value) {
        var reference = $$.contract.start("DomainReference", "init", "child", alias);
        this.transaction.save(reference);
        $$.blockchain.persist(this.transaction);
    },
    addAgent: function (alias, publicKey) {
        var reference = $$.contract.start("Agent", "init", alias, publicKey);
        this.transaction.save(reference);
        $$.blockchain.persist(this.transaction);
    },
    updateAgent: function (alias, publicKey) {
        var agent = this.transaction.lookup("Agent", alias);
        agent.update(publicKey);
        this.transaction.save(reference);
        $$.blockchain.persist(this.transaction);
    }
});


$$.newTransaction = function(transactionFlow,ctor,...args){
    var transaction = $$.swarm.start( transactionFlow);
    transaction.meta("agentId", $$.currentAgentId);
    transaction.meta("command", "runEveryWhere");
    transaction.meta("ctor", ctor);
    transaction.meta("args", args);
    transaction.sign();
    //$$.blockchain.sendForConsent(transaction);
    //temporary until consent layer is activated
    transaction[ctor].apply(transaction,args);
};

/*
usages:
    $$.newTransaction("domain.transactions", "updateKey", "key", "value")

 */

},{}],"/opt/privatesky/modules/pskdb/lib/swarms/agentsSwarm.js":[function(require,module,exports){
// const sharedPhases = require('./sharedPhases');
// const beesHealer = require('swarmutils').beesHealer;

$$.swarms.describe("agents", {
    add: function (alias, publicKey) {
        const transaction = $$.blockchain.beginTransaction({});
        const agentAsset = transaction.lookup('global.Agent', alias);

        agentAsset.init(alias, publicKey);
        try {
            transaction.add(agentAsset);

            $$.blockchain.commit(transaction);
        } catch (err) {
            this.return(new Error("Agent already exists"));
            return;
        }

        this.return(null, alias);
    },
});

},{}],"/opt/privatesky/modules/pskdb/lib/swarms/domainSwarms.js":[function(require,module,exports){
const sharedPhases = require('./sharedPhases');
const beesHealer = require('swarmutils').beesHealer;

$$.swarms.describe("domains", {
    add: function (role, alias) {
        const transaction = $$.blockchain.beginTransaction({});
        const domainsSwarm = transaction.lookup('global.DomainReference', alias);

        if (!domainsSwarm) {
            this.return(new Error('Could not find swarm named "global.DomainReference"'));
            return;
        }

        domainsSwarm.init(role, alias);
        try{
            transaction.add(domainsSwarm);

            $$.blockchain.commit(transaction);
        }catch(err){
            this.return(new Error("Domain allready exists!"));
            return;
        }

        this.return(null, alias);
    },
    getDomainDetails:function(alias){
        const transaction = $$.blockchain.beginTransaction({});
        const domain = transaction.lookup('global.DomainReference', alias);

        if (!domain) {
            this.return(new Error('Could not find swarm named "global.DomainReference"'));
            return;
        }

        this.return(null, beesHealer.asJSON(domain).publicVars);
    },
    connectDomainToRemote(domainName, alias, remoteEndPoint){
        const transaction = $$.blockchain.beginTransaction({});
        const domain = transaction.lookup('global.DomainReference', domainName);

        if (!domain) {
            this.return(new Error('Could not find swarm named "global.DomainReference"'));
            return;
        }

        domain.addRemoteInterface(alias, remoteEndPoint);

        try{
            transaction.add(domain);

            $$.blockchain.commit(transaction);
        }catch(err){
            console.log(err);
            this.return(new Error("Domain update failed!"));
            return;
        }

        this.return(null, alias);
    },
    // getDomainDetails: sharedPhases.getAssetFactory('global.DomainReference'),
    getDomains: sharedPhases.getAllAssetsFactory('global.DomainReference')
});

},{"./sharedPhases":"/opt/privatesky/modules/pskdb/lib/swarms/sharedPhases.js","swarmutils":false}],"/opt/privatesky/modules/pskdb/lib/swarms/index.js":[function(require,module,exports){
require('./domainSwarms');
require('./agentsSwarm');
},{"./agentsSwarm":"/opt/privatesky/modules/pskdb/lib/swarms/agentsSwarm.js","./domainSwarms":"/opt/privatesky/modules/pskdb/lib/swarms/domainSwarms.js"}],"/opt/privatesky/modules/pskdb/lib/swarms/sharedPhases.js":[function(require,module,exports){
const beesHealer = require("swarmutils").beesHealer;

module.exports = {
    getAssetFactory: function(assetType) {
        return function(alias) {
            const transaction = $$.blockchain.beginTransaction({});
            const domainReferenceSwarm = transaction.lookup(assetType, alias);

            if(!domainReferenceSwarm) {
                this.return(new Error(`Could not find swarm named "${assetType}"`));
                return;
            }

            this.return(undefined, beesHealer.asJSON(domainReferenceSwarm));
        };
    },
    getAllAssetsFactory: function(assetType) {
        return function() {
            const transaction = $$.blockchain.beginTransaction({});
            const domains = transaction.loadAssets(assetType) || [];

            this.return(undefined, domains.map((domain) => beesHealer.asJSON(domain)));
        };
    }
};
},{"swarmutils":false}],"/opt/privatesky/modules/signsensus/lib/consUtil.js":[function(require,module,exports){
/*
consensus helper functions
*/

var pskcrypto = require("pskcrypto");


function Pulse(signer, currentPulseNumber, block, newTransactions, vsd, top, last) {
    this.signer         = signer;               //a.k.a. delegatedAgentName
    this.currentPulse   = currentPulseNumber;
    this.lset           = newTransactions;      //digest -> transaction
    this.ptBlock        = block;                //array of digests
    this.vsd            = vsd;
    this.top            = top;                  // a.k.a. topPulseConsensus
    this.last           = last;                 // a.k.a. lastPulseAchievedConsensus
}

function Transaction(currentPulse, swarm) {
    this.input      = swarm.input;
    this.output     = swarm.output;
    this.swarm      = swarm;

    var arr = process.hrtime();
    this.second     = arr[0];
    this.nanosecod  = arr[1];

    this.CP         = currentPulse;
    this.digest     = pskcrypto.hashValues(this);
}


exports.createTransaction = function (currentPulse, swarm) {
    return new Transaction(currentPulse, swarm);
}

exports.createPulse = function (signer, currentPulseNumber, block, newTransactions, vsd, top, last) {
    return new Pulse(signer, currentPulseNumber, block, newTransactions, vsd, top, last);
}

exports.orderTransactions = function (pset) { //order in place the pset array
    var arr = [];
    for (var d in pset) {
        arr.push(pset[d]);
    }

    arr.sort(function (t1, t2) {
        if (t1.CP < t2.CP) return -1;
        if (t1.CP > t2.CP) return 1;
        if (t1.second < t2.second) return -1;
        if (t1.second > t2.second) return 1;
        if (t1.nanosecod < t2.nanosecod) return -1;
        if (t1.nanosecod > t2.nanosecod) return 1;
        if (t1.digest < t2.digest) return -1;
        if (t1.digest > t2.digest) return 1;
        return 0; //only for identical transactions...
    })
    return arr;
}

function getMajorityFieldInPulses(allPulses, fieldName, extractFieldName, votingBox) {
    var counterFields = {};
    var majorityValue;
    var pulse;

    for (var agent in allPulses) {
        pulse = allPulses[agent];
        var v = pulse[fieldName];
        counterFields[v] = votingBox.vote(counterFields[v]);        // ++counterFields[v]
    }

    for (var i in counterFields) {
        if (votingBox.isMajoritarian(counterFields[i])) {
            majorityValue = i;
            if (fieldName == extractFieldName) {                    //??? "vsd", "vsd"
                return majorityValue;
            } else {                                                // "blockDigest", "ptBlock"
                for (var agent in allPulses) {
                    pulse = allPulses[agent];
                    if (pulse[fieldName] == majorityValue) {
                        return pulse[extractFieldName];
                    }
                }
            }
        }
    }
    return "none"; //there is no majority
}

exports.detectMajoritarianVSD = function (pulse, pulsesHistory, votingBox) {
    if (pulse == 0) return "none";
    var pulses = pulsesHistory[pulse];
    var majorityValue = getMajorityFieldInPulses(pulses, "vsd", "vsd", votingBox);
    return majorityValue;
}

/*
    detect a candidate block
 */
exports.detectMajoritarianPTBlock = function (pulse, pulsesHistory, votingBox) {
    if (pulse == 0) return "none";
    var pulses = pulsesHistory[pulse];
    var btBlock = getMajorityFieldInPulses(pulses, "blockDigest", "ptBlock", votingBox);
    return btBlock;
}

exports.makeSetFromBlock = function (knownTransactions, block) {
    var result = {};
    for (var i = 0; i < block.length; i++) {
        var item = block[i];
        result[item] = knownTransactions[item];
        if (!knownTransactions.hasOwnProperty(item)) {
            console.log(new Error("Do not give unknown transaction digests to makeSetFromBlock " + item));
        }
    }
    return result;
}

exports.setsConcat = function (target, from) {
    for (var d in from) {
        target[d] = from[d];
    }
    return target;
}

exports.setsRemoveArray = function (target, arr) {
    arr.forEach(item => delete target[item]);
    return target;
}

exports.setsRemovePtBlockAndPastTransactions = function (target, arr, maxPulse) {
    var toBeRemoved = [];
    for (var d in target) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == d || target[d].CP < maxPulse) {
                toBeRemoved.push(d);
            }
        }
    }

    toBeRemoved.forEach(item => delete target[item]);
    return target;
}

exports.createDemocraticVotingBox = function (shareHoldersCounter) {
    return {
        vote: function (previosValue) {
            if (!previosValue) {
                previosValue = 0;
            }
            return previosValue + 1;
        },

        isMajoritarian: function (value) {
            //console.log(value , Math.floor(shareHoldersCounter/2) + 1);
            return value >= Math.floor(shareHoldersCounter / 2) + 1;
        }
    };
}

},{"pskcrypto":false}],"/opt/privatesky/modules/virtualmq/VirtualMQ.js":[function(require,module,exports){
(function (Buffer){
require("./flows/CSBmanager");
require("./flows/remoteSwarming");
const path = require("path");
const httpWrapper = require('./libs/http-wrapper');
const edfs = require("edfs");
const EDFSMiddleware = edfs.EDFSMiddleware;
const Server = httpWrapper.Server;
const Router = httpWrapper.Router;
const TokenBucket = require('./libs/TokenBucket');
const msgpack = require('@msgpack/msgpack');


function VirtualMQ({listeningPort, rootFolder, sslConfig}, callback) {
	const port = listeningPort || 8080;
	const server = new Server(sslConfig).listen(port);
	const tokenBucket = new TokenBucket(600000, 1, 10);
	const CSB_storage_folder = "uploads";
	const SWARM_storage_folder = "swarms";
	console.log("Listening on port:", port);

	this.close = server.close;
	$$.flow.start("CSBmanager").init(path.join(rootFolder, CSB_storage_folder), function (err, result) {
		if (err) {
			throw err;
		} else {
			console.log("CSBManager is using folder", result);
			$$.flow.start("RemoteSwarming").init(path.join(rootFolder, SWARM_storage_folder), function(err, result){
				registerEndpoints();
				if (callback) {
					callback();
				}
			});
		}
	});

	function registerEndpoints() {
		const router = new Router(server);
		router.use("/EDFS", (newServer) => {
			new EDFSMiddleware(newServer);
		});

		server.use(function (req, res, next) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Origin');
			res.setHeader('Access-Control-Allow-Credentials', true);
			next();
		});

        server.use(function (req, res, next) {
            const ip = res.socket.remoteAddress;

            tokenBucket.takeToken(ip, tokenBucket.COST_MEDIUM, function(err, remainedTokens) {
            	res.setHeader('X-RateLimit-Limit', tokenBucket.getLimitByCost(tokenBucket.COST_MEDIUM));
            	res.setHeader('X-RateLimit-Remaining', tokenBucket.getRemainingTokenByCost(remainedTokens, tokenBucket.COST_MEDIUM));

            	if(err) {
            		switch (err) {
            			case TokenBucket.ERROR_LIMIT_EXCEEDED:
            				res.statusCode = 429;
            				break;
            			default:
            				res.statusCode = 500;

            		}

            		res.end();
            		return;
            	}

            	next();
            });
        });

        server.post('/:channelId', function (req, res, next) {
            const contentType = req.headers['content-type'];

            if (contentType === 'application/octet-stream') {
                const contentLength = Number.parseInt(req.headers['content-length']);

                streamToBuffer(req, contentLength, (err, bodyAsBuffer) => {
                    if(err) {
                        res.statusCode = 500;
                        return;
                    }

                    req.body = msgpack.decode(bodyAsBuffer);

                    next();
                });
            } else {
                next();
            }


            /***** HELPER FUNCTION *****/

            function streamToBuffer(stream, bufferSize, callback) {
                const buffer = Buffer.alloc(bufferSize);
                let currentOffset = 0;

                stream
                    .on('data', chunk => {
                        const chunkSize = chunk.length;
                        const nextOffset = chunkSize + currentOffset;

                        if (currentOffset > bufferSize - 1) {
                            stream.close();
                            return callback(new Error('Stream is bigger than reported size'));
                        }

                        unsafeAppendInBufferFromOffset(buffer, chunk, currentOffset);
                        currentOffset = nextOffset;

                    })
                    .on('end', () => {
                        callback(undefined, buffer);
                    })
                    .on('error', callback);


            }

            function unsafeAppendInBufferFromOffset(buffer, dataToAppend, offset) {
                const dataSize = dataToAppend.length;

                for (let i = 0; i < dataSize; i++) {
                    buffer[offset++] = dataToAppend[i];
                }
            }

        });

        server.post('/:channelId', function (req, res) {
            $$.flow.start("RemoteSwarming").startSwarm(req.params.channelId, JSON.stringify(req.body), function (err, result) {
                res.statusCode = 201;
                if (err) {
                    console.log(err);
                    res.statusCode = 500;
                }
                res.end();
            });
        });


        server.get('/:channelId', function (req, res) {
            $$.flow.start("RemoteSwarming").waitForSwarm(req.params.channelId, res, function (err, result, confirmationId) {

                if (err) {
                    console.log(err);
                    res.statusCode = 500;
                }

                let responseMessage = result;

                if ((req.query.waitConfirmation || 'false') === 'false') {
                    res.on('finish', () => {
                        $$.flow.start('RemoteSwarming').confirmSwarm(req.params.channelId, confirmationId, (err) => {
                        });
                    });
                } else {
                    responseMessage = {result, confirmationId};
                }

                res.setHeader('Content-Type', 'application/octet-stream');

                const encodedResponseMessage = msgpack.encode(responseMessage);
                res.write(Buffer.from(encodedResponseMessage));
                res.end();
            });
        });

		server.delete("/:channelId/:confirmationId", function(req, res){
			$$.flow.start("RemoteSwarming").confirmSwarm(req.params.channelId, req.params.confirmationId, function (err, result) {
				if (err) {
					console.log(err);
					res.statusCode = 500;
				}
				res.end();
			});
		});

		//folder can be userId/tripId/...
		server.post('/files/upload/:folder', function (req,res) {
			let fileManager = require('./fileManager');
			fileManager.upload(req, (err, result)=>{
				if(err){
					res.statusCode = 500;
					res.end();
				}else{
					res.statusCode = 200;
					res.end(JSON.stringify(result));
				}
			})
		});

		server.get('/files/download/:folder/:fileId', function (req,res) {
			let fileManager = require('./fileManager');
			fileManager.download(req, (err, result)=>{
				if(err){
					res.statusCode = 404;
					res.end();
				}else{
					res.statusCode = 200;
					res.setHeader('Content-Type', `image/${req.params.fileId.split('.')[1]}`);
					result.pipe(res);
					result.on('finish', () => {
						res.end();
					})
				}
			})
		});

		server.post('/CSB', function (req, res) {
			//preventing illegal characters passing as fileId
			res.statusCode = 400;
			res.end();
		});

		server.post('/CSB/compareVersions', function(req, res) {
			$$.flow.start('CSBmanager').compareVersions(req, function(err, filesWithChanges) {
				if (err) {
					console.log(err);
					res.statusCode = 500;
				}
				res.end(JSON.stringify(filesWithChanges));
			});
		});

		server.post('/CSB/:fileId', function (req, res) {
			$$.flow.start("CSBmanager").write(req.params.fileId, req, function (err, result) {
				res.statusCode = 201;
				if (err) {
					res.statusCode = 500;

					if (err.code === 'EACCES') {
						res.statusCode = 409;
					}
				}
				res.end();
			});

		});

		server.get('/CSB/:fileId', function (req, res) {
			res.setHeader("content-type", "application/octet-stream");
			$$.flow.start("CSBmanager").read(req.params.fileId, res, function (err, result) {
				res.statusCode = 200;
				if (err) {
					console.log(err);
					res.statusCode = 404;
				}
				res.end();
			});
		});

		server.get('/CSB/:fileId/versions', function (req, res) {
			$$.flow.start("CSBmanager").getVersionsForFile(req.params.fileId, function(err, fileVersions) {
				if(err) {
					console.error(err);
					res.statusCode = 404;
				}

				res.end(JSON.stringify(fileVersions));
			});
		});

		server.get('/CSB/:fileId/:version', function (req, res) {
			$$.flow.start("CSBmanager").readVersion(req.params.fileId, req.params.version, res, function (err, result) {
				res.statusCode = 200;
				if (err) {
					console.log(err);
					res.statusCode = 404;
				}
				res.end();
			});
		});




		server.options('/*', function (req, res) {
			var headers = {};
			// IE8 does not allow domains to be specified, just the *
			// headers["Access-Control-Allow-Origin"] = req.headers.origin;
			headers["Access-Control-Allow-Origin"] = "*";
			headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
			headers["Access-Control-Allow-Credentials"] = true;
			headers["Access-Control-Max-Age"] = '3600'; //one hour
			headers["Access-Control-Allow-Headers"] = "Content-Type, Access-Control-Allow-Origin, User-Agent";
			res.writeHead(200, headers);
			res.end();
		});

		server.use(function (req, res) {
			res.statusCode = 404;
			res.end();
		});
	}
}

module.exports.createVirtualMQ = function(port, folder, sslConfig, callback){
	if(typeof sslConfig === 'function') {
		callback = sslConfig;
		sslConfig = undefined;
	}

	return new VirtualMQ({listeningPort:port, rootFolder:folder, sslConfig}, callback);
};

module.exports.VirtualMQ = VirtualMQ;

module.exports.getHttpWrapper = function() {
	return require('./libs/http-wrapper');
};

}).call(this,require("buffer").Buffer)

},{"./fileManager":"/opt/privatesky/modules/virtualmq/fileManager.js","./flows/CSBmanager":"/opt/privatesky/modules/virtualmq/flows/CSBmanager.js","./flows/remoteSwarming":"/opt/privatesky/modules/virtualmq/flows/remoteSwarming.js","./libs/TokenBucket":"/opt/privatesky/modules/virtualmq/libs/TokenBucket.js","./libs/http-wrapper":"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/index.js","@msgpack/msgpack":false,"buffer":false,"edfs":"edfs","path":false}],"/opt/privatesky/modules/virtualmq/fileManager.js":[function(require,module,exports){
(function (Buffer){
const fs = require('fs');
const path = require('path');
let rootFolder = process.env.ROOT_FILE_UPLOAD || "./FileUploads";

rootFolder = path.resolve(rootFolder);

guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
  
    return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
  };

module.exports.upload = function (req, callback) {
    const readFileStream = req;
    if(!readFileStream || !readFileStream.pipe || typeof readFileStream.pipe !== "function"){
        callback(new Error("Something wrong happened"));
        return;
    }

    const folder = Buffer.from(req.params.folder, 'base64').toString().replace('\n', '');
    if (folder.includes('..')){
        return callback('err');
    }
    let filename = guid();
    if (filename.split('.').length > 1){
        return callback('err');
    }
    const completeFolderPath = path.join( rootFolder, folder );

    contentType = req.headers['content-type'].split('/');

    if (contentType[0] === 'image') {
        filename += '.' + contentType[1];
    }else {
        return callback('err');
    }
    try {
        fs.mkdirSync(completeFolderPath, { recursive: true });
    }catch (e) {
        return callback(e);
    }
    const writeStream = fs.createWriteStream( path.join(completeFolderPath, filename));

    writeStream.on('finish', () => {
        writeStream.close();
        return callback(null, {'path': path.join(folder,filename)});
    });

    writeStream.on('error', (err) => {
        writeStream.close();
        return callback(err);
    });
    req.pipe(writeStream);
};
module.exports.download = function (req, callback) {
    const readFileStream = req;
    if(!readFileStream || !readFileStream.pipe || typeof readFileStream.pipe !== "function"){
        callback(new Error("Something wrong happened"));
        return;
    }

    const folder = req.params.folder;
    const filename = req.params.fileId;
    const completeFolderPath = path.join( rootFolder, folder );
    const filePath = path.join(completeFolderPath, filename);

    if (fs.existsSync(filePath)) {
        const fileToSend = fs.createReadStream(filePath);
        return callback(null, fileToSend);
    }
    else {
        return callback('err');
    }
};
}).call(this,require("buffer").Buffer)

},{"buffer":false,"fs":false,"path":false}],"/opt/privatesky/modules/virtualmq/flows/CSBmanager.js":[function(require,module,exports){
require('launcher');
const path = require("path");
const fs = require("fs");
const PskHash = require('pskcrypto').PskHash;

const folderNameSize = process.env.FOLDER_NAME_SIZE || 5;
const FILE_SEPARATOR = '-';
let rootfolder;

$$.flow.describe("CSBmanager", {
    init: function(rootFolder, callback){
        if(!rootFolder){
            callback(new Error("No root folder specified!"));
            return;
        }
        rootFolder = path.resolve(rootFolder);
        this.__ensureFolderStructure(rootFolder, function(err/*, path*/){
            rootfolder = rootFolder;
            callback(err, rootFolder);
        });
    },
    write: function(fileName, readFileStream, callback){
        if(!this.__verifyFileName(fileName, callback)){
            return;
        }

        if(!readFileStream || !readFileStream.pipe || typeof readFileStream.pipe !== "function"){
            callback(new Error("Something wrong happened"));
            return;
        }

        const folderName = path.join(rootfolder, fileName.substr(0, folderNameSize), fileName);

        const serial = this.serial(() => {}); //TODO: Empty function

        serial.__ensureFolderStructure(folderName, serial.__progress);
        serial.__writeFile(readFileStream, folderName, fileName, callback);
    },
    read: function(fileName, writeFileStream, callback){
        if(!this.__verifyFileName(fileName, callback)){
            return;
        }

        const folderPath = path.join(rootfolder, fileName.substr(0, folderNameSize));
        const filePath = path.join(folderPath, fileName);
        this.__verifyFileExistence(filePath, (err, result) => {
            if(!err){
                this.__getLatestVersionNameOfFile(filePath, (err, fileVersion) => {
                    if(err) {
                        return callback(err);
                    }
                    this.__readFile(writeFileStream, path.join(filePath, fileVersion.fullVersion), callback);
                });
            }else{
                return callback(new Error("No file found."));
            }
        });
    },
    readVersion: function(fileName, fileVersion, writeFileStream, callback) {
        if(!this.__verifyFileName(fileName, callback)){
            return;
        }

        const folderPath = path.join(rootfolder, fileName.substr(0, folderNameSize));
        const filePath = path.join(folderPath, fileName, fileVersion);
        this.__verifyFileExistence(filePath, (err, result) => {
            if(!err){
                this.__readFile(writeFileStream, path.join(filePath), callback);
            }else{
                return callback(new Error("No file found."));
            }
        });
    },
    getVersionsForFile: function (fileName, callback) {
        if (!this.__verifyFileName(fileName, callback)) {
            return;
        }

        const folderPath = path.join(rootfolder, fileName.substr(0, folderNameSize), fileName);
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                return callback(err);
            }

            const totalNumberOfFiles = files.length;
            const filesData = [];

            let resolvedFiles = 0;

            for (let i = 0; i < totalNumberOfFiles; ++i) {
                fs.stat(path.join(folderPath, files[i]), (err, stats) => {
                    if (err) {
                        filesData.push({version: files[i], creationTime: null, creationTimeMs: null});
                        return;
                    }

                    filesData.push({version: files[i], creationTime: stats.birthtime, creationTimeMs: stats.birthtimeMs});

                    resolvedFiles += 1;

                    if (resolvedFiles >= totalNumberOfFiles) {
                        filesData.sort((first, second) => {
                            const firstCompareData = first.creationTimeMs || first.version;
                            const secondCompareData = second.creationTimeMs || second.version;

                            return firstCompareData - secondCompareData;
                        });
                        return callback(undefined, filesData);
                    }
                });
            }
        });
    },
    compareVersions: function(bodyStream, callback) {
        let body = '';

        bodyStream.on('data', (data) => {
            body += data;
        });

        bodyStream.on('end', () => {
           try {
               body = JSON.parse(body);
               this.__compareVersions(body, callback);
           } catch (e) {
                return callback(e);
           }
        });
    },
    __verifyFileName: function(fileName, callback){
        if(!fileName || typeof fileName != "string"){
            callback(new Error("No fileId specified."));
            return;
        }

        if(fileName.length < folderNameSize){
            callback(new Error("FileId too small. "+fileName));
            return;
        }

        return true;
    },
    __ensureFolderStructure: function(folder, callback){
        fs.mkdir(folder, {recursive: true},  callback);
    },
    __writeFile: function(readStream, folderPath, fileName, callback){
        this.__getNextVersionFileName(folderPath, fileName, (err, nextVersionFileName) => {
            if(err) {
                console.error(err);
                return callback(err);
            }

            const hash = new PskHash();
            readStream.on('data', (data) => {
                hash.update(data);
            });

            const filePath = path.join(folderPath, nextVersionFileName.toString());
            const writeStream = fs.createWriteStream(filePath, {mode:0o444});

            writeStream.on("finish", () => {
                const hashDigest = hash.digest().toString('hex');
                const newPath = filePath + FILE_SEPARATOR + hashDigest;
                fs.rename(filePath, newPath, callback);
            });

            writeStream.on("error", function() {
				writeStream.close();
				readStream.close();
                callback(...arguments);
            });

            readStream.pipe(writeStream);
        });
    },
    __getNextVersionFileName: function (folderPath, fileName, callback) {
        this.__getLatestVersionNameOfFile(folderPath, (err, fileVersion) => {
            if(err) {
                console.error(err);
                return callback(err);
            }

            callback(undefined, fileVersion.numericVersion + 1);
        });
    },
    __getLatestVersionNameOfFile: function (folderPath, callback) {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error(err);
                callback(err);
                return;
            }

            let fileVersion = {numericVersion: 0, fullVersion: '0' + FILE_SEPARATOR};

            if(files.length > 0) {
                try {
                    const allVersions = files.map((file) => file.split(FILE_SEPARATOR)[0]);
                    const latestFile = this.__maxElement(allVersions);
                    fileVersion = {
                        numericVersion: parseInt(latestFile),
                        fullVersion: files.filter((file) => file.split(FILE_SEPARATOR)[0] === latestFile.toString())[0]
                    };

                } catch (e) {
                    e.code = 'invalid_file_name_found';
                    return callback(e);
                }
            }

            callback(undefined, fileVersion);
        });
    },
    __maxElement: function (numbers) {
        let max = numbers[0];

        for(let i = 1; i < numbers.length; ++i) {
            max = Math.max(max, numbers[i]);
        }

        if(isNaN(max)) {
            throw new Error('Invalid element found');
        }

        return max;
    },
    __compareVersions: function (files, callback) {
        const filesWithChanges = [];
        const entries = Object.entries(files);
        let remaining = entries.length;

        if(entries.length === 0) {
            callback(undefined, filesWithChanges);
            return;
        }

        entries.forEach(([ fileName, fileHash ]) => {
            this.getVersionsForFile(fileName, (err, versions) => {
                if (err) {
                    if(err.code === 'ENOENT') {
                        versions = [];
                    } else {
                        return callback(err);
                    }

                }

                const match = versions.some((version) => {
                    const hash = version.version.split(FILE_SEPARATOR)[1];
                    return hash === fileHash;
                });

                if (!match) {
                    filesWithChanges.push(fileName);
                }

                if (--remaining === 0) {
                    return callback(undefined, filesWithChanges);
                }
            });
        });
    },
    __readFile: function(writeFileStream, filePath, callback){
        const readStream = fs.createReadStream(filePath);

        writeFileStream.on("finish", callback);
        writeFileStream.on("error", callback);

        readStream.pipe(writeFileStream);
    },
    __progress: function(err, result){
        if(err){
            console.error(err);
        }
    },
    __verifyFileExistence: function(filePath, callback){
        fs.stat(filePath, callback);
    }
});
},{"fs":false,"launcher":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/virtualmq/flows/remoteSwarming.js":[function(require,module,exports){
const path = require("path");
const fs = require("fs");
const folderMQ = require("foldermq");

let rootfolder;
const channels = {};

function storeChannel(id, channel, clientConsumer){
	var storedChannel = {
		channel: channel,
		handler: channel.getHandler(),
		mqConsumer: null,
		consumers:[]
	};

	if(!channels[id]){
		channels[id] = storedChannel;
	}

	if(clientConsumer){
		storedChannel = channels[id];
		channels[id].consumers.push(clientConsumer);
	}

	return storedChannel;
}


function registerConsumer(id, consumer){
	const storedChannel = channels[id];
	if(storedChannel){
		storedChannel.consumers.push(consumer);
		return true;
	}
	return false;
}

function deliverToConsumers(consumers, err, result, confirmationId){
	if(!consumers){
		return false;
	}
    let deliveredMessages = 0;
    while(consumers.length>0){
        //we iterate through the consumers list in case that we have a ref. of a request that time-outed meanwhile
        //and in this case we expect to have more then one consumer...
        const consumer = consumers.pop();
        try{
            consumer(err, result, confirmationId);
            deliveredMessages++;
        }catch(error){
            //just some small error ignored
            console.log("Error catched", error);
        }
    }
    return !!deliveredMessages;
}

function registerMainConsumer(id){
	const storedChannel = channels[id];
	if(storedChannel && !storedChannel.mqConsumer){
		storedChannel.mqConsumer = (err, result, confirmationId) => {
			channels[id] = null;
			deliverToConsumers(storedChannel.consumers, err, result, confirmationId);
			/*while(storedChannel.consumers.length>0){
				//we iterate through the consumers list in case that we have a ref. of a request that time-outed meanwhile
				//and in this case we expect to have more then one consumer...
				let consumer = storedChannel.consumers.pop();
				try{
					consumer(err, result, confirmationId);
				}catch(error){
					//just some small error ignored
					console.log("Error catched", error);
				}
			}*/
		};

		storedChannel.channel.registerConsumer(storedChannel.mqConsumer, false, () => !!channels[id]);
		return true;
	}
	return false;
}

function readSwarmFromStream(stream, callback){
    let swarm = "";
    stream.on('data', (chunk) =>{
        swarm += chunk;
	});

    stream.on("end", () => {
       callback(null, swarm);
	});

    stream.on("error", (err) =>{
        callback(err);
	});
}

$$.flow.describe("RemoteSwarming", {
	init: function(rootFolder, callback){
		if(!rootFolder){
			callback(new Error("No root folder specified!"));
			return;
		}
		rootFolder = path.resolve(rootFolder);
		fs.mkdir(rootFolder, {recursive: true}, function(err, path){
			rootfolder = rootFolder;

			if(!err){
				fs.readdir(rootfolder, (cleanErr, files) => {
					while(files && files.length > 0){
						console.log("Root folder found to have some dirs. Start cleaning empty dirs.");
						let dir = files.pop();
						try{
							const path = require("path");
							dir = path.join(rootFolder, dir);
							var content = fs.readdirSync(dir);
							if(content && content.length === 0){
								console.log("Removing empty dir", dir);
								fs.rmdirSync(dir);
							}
						}catch(err){
							//console.log(err);
						}
					}
					callback(cleanErr, rootFolder);
				});
			}else{
				return callback(err, rootFolder);
			}
		});
	},
	startSwarm: function (channelId, swarmSerialization, callback) {
		let channel = channels[channelId];
		if (!channel) {
			const channelFolder = path.join(rootfolder, channelId);
			let storedChannel;
			channel = folderMQ.createQue(channelFolder, (err, result) => {
				if (err) {
					//we delete the channel in order to try again next time
					channels[channelId] = null;
					callback(new Error("Channel initialization failed"));
					return;
				}

				let sent = false;
				try {
					sent = deliverToConsumers(channel.consumers, null, JSON.parse(swarmSerialization));
				} catch (err) {
					console.log(err);
				}

				if (!sent) {
					storedChannel.handler.sendSwarmSerialization(swarmSerialization, callback);
				} else {
					return callback(null, swarmSerialization);
				}

			});
			storedChannel = storeChannel(channelId, channel);
		} else {

			let sent = false;
			try {
				sent = deliverToConsumers(channel.consumers, null, JSON.parse(swarmSerialization));
			} catch (err) {
				console.log(err);
			}

			if (!sent) {
				channel.handler.sendSwarmSerialization(swarmSerialization, callback);
			} else {
				return callback(null, swarmSerialization);
			}
		}
	},
	confirmSwarm: function(channelId, confirmationId, callback){
		if(!confirmationId){
			callback();
			return;
		}
		const storedChannel = channels[channelId];
		if(!storedChannel){
			const channelFolder = path.join(rootfolder, channelId);
			const channel = folderMQ.createQue(channelFolder, (err, result) => {
				if(err){
					//we delete the channel in order to try again next time
					channels[channelId] = null;
					callback(new Error("Channel initialization failed"));
					return;
				}
				channel.unlinkContent(confirmationId, callback);
			});
		}else{
			storedChannel.channel.unlinkContent(confirmationId, callback);
		}
	},
	waitForSwarm: function(channelId, writeSwarmStream, callback){
		let channel = channels[channelId];
		if(!channel){
			const channelFolder = path.join(rootfolder, channelId);
			channel = folderMQ.createQue(channelFolder, (err, result) => {
				if(err){
					//we delete the channel in order to try again next time
					channels[channelId] = null;
					callback(new Error("Channel initialization failed"), {});
					return;
				}
				if(!registerConsumer(channelId, callback)){
					callback(new Error("Registering consumer failed!"), {});
				}
				registerMainConsumer(channelId);
			});
			storeChannel(channelId, channel);
		}else{
			//channel.channel.registerConsumer(callback);
            if(!registerConsumer(channelId, callback)){
                callback(new Error("Registering consumer failed!"), {});
            }
            registerMainConsumer(channelId);
		}
	}
});

},{"foldermq":"foldermq","fs":false,"path":false}],"/opt/privatesky/modules/virtualmq/libs/TokenBucket.js":[function(require,module,exports){
/**
 * An implementation of the Token bucket algorithm
 * @param startTokens - maximum number of tokens possible to obtain and the default starting value
 * @param tokenValuePerTime - number of tokens given back for each "unitOfTime"
 * @param unitOfTime - for each "unitOfTime" (in milliseconds) passed "tokenValuePerTime" amount of tokens will be given back
 * @constructor
 */

function TokenBucket(startTokens = 6000, tokenValuePerTime = 10, unitOfTime = 100) {

    if(typeof startTokens !== 'number' || typeof  tokenValuePerTime !== 'number' || typeof unitOfTime !== 'number') {
        throw new Error('All parameters must be of type number');
    }

    if(isNaN(startTokens) || isNaN(tokenValuePerTime) || isNaN(unitOfTime)) {
        throw new Error('All parameters must not be NaN');
    }

    if(startTokens <= 0 || tokenValuePerTime <= 0 || unitOfTime <= 0) {
        throw new Error('All parameters must be bigger than 0');
    }


    TokenBucket.prototype.COST_LOW    = 10;  // equivalent to 10op/s with default values
    TokenBucket.prototype.COST_MEDIUM = 100; // equivalent to 1op/s with default values
    TokenBucket.prototype.COST_HIGH   = 500; // equivalent to 12op/minute with default values

    TokenBucket.ERROR_LIMIT_EXCEEDED  = 'error_limit_exceeded';
    TokenBucket.ERROR_BAD_ARGUMENT    = 'error_bad_argument';



    const limits = {};

    function takeToken(userKey, cost, callback = () => {}) {
        if(typeof cost !== 'number' || isNaN(cost) || cost <= 0 || cost === Infinity) {
            callback(TokenBucket.ERROR_BAD_ARGUMENT);
            return;
        }

        const userBucket = limits[userKey];

        if (userBucket) {
            userBucket.tokens += calculateReturnTokens(userBucket.timestamp);
            userBucket.tokens -= cost;

            userBucket.timestamp = Date.now();



            if (userBucket.tokens < 0) {
                userBucket.tokens = 0;
                callback(TokenBucket.ERROR_LIMIT_EXCEEDED, 0);
                return;
            }

            return callback(undefined, userBucket.tokens);
        } else {
            limits[userKey] = new Limit(startTokens, Date.now());
            takeToken(userKey, cost, callback);
        }
    }

    function getLimitByCost(cost) {
        if(startTokens === 0 || cost === 0) {
            return 0;
        }

        return Math.floor(startTokens / cost);
    }

    function getRemainingTokenByCost(tokens, cost) {
        if(tokens === 0 || cost === 0) {
            return 0;
        }

        return Math.floor(tokens / cost);
    }

    function Limit(maximumTokens, timestamp) {
        this.tokens = maximumTokens;
        this.timestamp = timestamp;

        const self = this;

        return {
            set tokens(numberOfTokens) {
                if (numberOfTokens < 0) {
                    numberOfTokens = -1;
                }

                if (numberOfTokens > maximumTokens) {
                    numberOfTokens = maximumTokens;
                }

                self.tokens = numberOfTokens;
            },
            get tokens() {
                return self.tokens;
            },
            timestamp
        };
    }


    function calculateReturnTokens(timestamp) {
        const currentTime = Date.now();

        const elapsedTime = Math.floor((currentTime - timestamp) / unitOfTime);

        return elapsedTime * tokenValuePerTime;
    }

    this.takeToken               = takeToken;
    this.getLimitByCost          = getLimitByCost;
    this.getRemainingTokenByCost = getRemainingTokenByCost;
}

module.exports = TokenBucket;

},{}],"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Client.js":[function(require,module,exports){
(function (Buffer){
const http = require('http');
const url = require('url');
const stream = require('stream');

/**
 * Wraps a request and augments it with a "do" method to modify it in a "fluent builder" style
 * @param {string} url
 * @param {*} body
 * @constructor
 */
function Request(url, body) {
    this.request = {
        options: url,
        body
    };

    this.do = function (modifier) {
        modifier(this.request);
        return this;
    };

    this.getHttpRequest = function () {
        return this.request;
    };
}


/**
 * Modifies request.options to contain the url parsed instead of as string
 * @param {Object} request - Object that contains options and body
 */
function urlToOptions(request) {
    const parsedUrl = url.parse(request.options);

    // TODO: movie headers declaration from here
    request.options = {
        host: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname,
        headers: {}
    };
}


/**
 * Transforms the request.body in a type that can be sent through network if it is needed
 * @param {Object} request - Object that contains options and body
 */
function serializeBody(request) {
    if (!request.body) {
        return;
    }

    const handler = {
        get: function (target, name) {
            return name in target ? target[name] : (data) => data;
        }
    };

    const bodySerializationMapping = new Proxy({
        'Object': (data) => JSON.stringify(data),
    }, handler);

    request.body = bodySerializationMapping[request.body.constructor.name](request.body);
}

/**
 *
 * @param {Object} request - Object that contains options and body
 */
function bodyContentLength(request) {
    if (!request.body) {
        return;
    }

    if (request.body.constructor.name in [ 'String', 'Buffer', 'ArrayBuffer' ]) {
        request.options.headers['Content-Length'] = Buffer.byteLength(request.body);
    }
}


function Client() {
    /**
     *
     * @param {Request} customRequest
     * @param modifiers - array of functions that modify the request
     * @returns {Object} - with url and body properties
     */
    function request(customRequest, modifiers) {
        for (let i = 0; i < modifiers.length; ++i) {
            customRequest.do(modifiers[i]);
        }

        return customRequest.getHttpRequest();
    }

    function getReq(url, config, callback) {
        const modifiers = [
            urlToOptions,
            (request) => {request.options.headers = config.headers || {};}
        ];

        const packedRequest = request(new Request(url, config.body), modifiers);
        const httpRequest = http.request(packedRequest.options, callback);
        httpRequest.end();

        return httpRequest;
    }

    function postReq(url, config, callback) {
        const modifiers = [
            urlToOptions,
            (request) => {request.options.method = 'POST'; },
            (request) => {request.options.headers = config.headers || {}; },
            serializeBody,
            bodyContentLength
        ];

        const packedRequest = request(new Request(url, config.body), modifiers);
        const httpRequest = http.request(packedRequest.options, callback);

        if (config.body instanceof stream.Readable) {
            config.body.pipe(httpRequest);
        }
        else {
            httpRequest.end(packedRequest.body, config.encoding || 'utf8');
        }
        return httpRequest;
    }

    function deleteReq(url, config, callback) {
        const modifiers = [
            urlToOptions,
            (request) => {request.options.method = 'DELETE';},
            (request) => {request.options.headers = config.headers || {};},
        ];

        const packedRequest = request(new Request(url, config.body), modifiers);
        const httpRequest = http.request(packedRequest.options, callback);
        httpRequest.end();

        return httpRequest;
    }

    this.get = getReq;
    this.post = postReq;
    this.delete = deleteReq;
}

/**
 * Swap third and second parameter if only two are provided and converts arguments to array
 * @param {Object} params
 * @returns {Array} - arguments as array
 */
function parametersPreProcessing(params) {
    const res = [];

    if (typeof params[0] !== 'string') {
        throw new Error('First parameter must be a string (url)');
    }

    const parsedUrl = url.parse(params[0]);

    if (!parsedUrl.hostname) {
        throw new Error('First argument (url) is not valid');
    }

    if (params.length >= 3) {
        if (typeof params[1] !== 'object' || !params[1]) {
            throw new Error('When 3 parameters are provided the second parameter must be a not null object');
        }

        if (typeof params[2] !== 'function') {
            throw new Error('When 3 parameters are provided the third parameter must be a function');
        }
    }

    if (params.length === 2) {
        if (typeof params[1] !== 'function') {
            throw new Error('When 2 parameters are provided the second one must be a function');
        }

        params[2] = params[1];
        params[1] = {};
    }

    const properties = Object.keys(params);
    for(let i = 0, len = properties.length; i < len; ++i) {
        res.push(params[properties[i]]);
    }

    return res;
}

const handler = {
    get(target, propName) {
        if (!target[propName]) {
            console.log(propName, "Not implemented!");
        } else {
            return function () {
                const args = parametersPreProcessing(arguments);
                return target[propName].apply(target, args);
            };
        }
    }
};

module.exports = function () {
    return new Proxy(new Client(), handler);
};
}).call(this,require("buffer").Buffer)

},{"buffer":false,"http":false,"stream":false,"url":false}],"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Middleware.js":[function(require,module,exports){
const querystring = require('querystring');

function matchUrl(pattern, url) {
	const result = {
		match: true,
		params: {},
		query: {}
	};

	const queryParametersStartIndex = url.indexOf('?');
	if(queryParametersStartIndex !== -1) {
		const urlQueryString = url.substr(queryParametersStartIndex + 1); // + 1 to ignore the '?'
		result.query = querystring.parse(urlQueryString);
		url = url.substr(0, queryParametersStartIndex);
	}

    const patternTokens = pattern.split('/');
    const urlTokens = url.split('/');

    if(urlTokens[urlTokens.length - 1] === '') {
        urlTokens.pop();
    }

    if (patternTokens.length !== urlTokens.length) {
        result.match = false;
    }

    if(patternTokens[patternTokens.length - 1] === '*') {
        result.match = true;
        patternTokens.pop();
    }

    for (let i = 0; i < patternTokens.length && result.match; ++i) {
        if (patternTokens[i].startsWith(':')) {
            result.params[patternTokens[i].substring(1)] = urlTokens[i];
        } else if (patternTokens[i] !== urlTokens[i]) {
            result.match = false;
        }
    }

    return result;
}

function isTruthy(value) {
    return !!value;

}

function methodMatch(pattern, method) {
    if (!pattern || !method) {
        return true;
    }

    return pattern === method;
}

function Middleware() {
    const registeredMiddlewareFunctions = [];

    function use(method, url, fn) {
        method = method ? method.toLowerCase() : undefined;
        registeredMiddlewareFunctions.push({method, url, fn});
    }

    this.use = function (...params) {
	    let args = [ undefined, undefined, undefined ];

	    switch (params.length) {
            case 0:
				throw Error('Use method needs at least one argument.');
				
            case 1:
                if (typeof params[0] !== 'function') {
                    throw Error('If only one argument is provided it must be a function');
                }

                args[2] = params[0];

                break;
            case 2:
                if (typeof params[0] !== 'string' || typeof params[1] !== 'function') {
                    throw Error('If two arguments are provided the first one must be a string (url) and the second a function');
                }

                args[1]=params[0];
                args[2]=params[1];

                break;
            default:
                if (typeof params[0] !== 'string' || typeof params[1] !== 'string' || typeof params[2] !== 'function') {
                    throw Error('If three or more arguments are provided the first one must be a string (HTTP verb), the second a string (url) and the third a function');
                }

                if (!([ 'get', 'post', 'put', 'delete', 'patch', 'head', 'connect', 'options', 'trace' ].includes(params[0].toLowerCase()))) {
                    throw new Error('If three or more arguments are provided the first one must be a HTTP verb but none could be matched');
                }

                args = params;

                break;
        }

        use.apply(this, args);
    };


    /**
     * Starts execution from the first registered middleware function
     * @param {Object} req
     * @param {Object} res
     */
    this.go = function go(req, res) {
        execute(0, req.method.toLowerCase(), req.url, req, res);
    };

    /**
     * Executes a middleware if it passes the method and url validation and calls the next one when necessary
     * @param index
     * @param method
     * @param url
     * @param params
     */
    function execute(index, method, url, ...params) {
        if (!registeredMiddlewareFunctions[index]) {
            if(index===0){
                console.error("No handlers registered yet!");
            }
            return;
        }

	    const registeredMethod = registeredMiddlewareFunctions[index].method;
	    const registeredUrl = registeredMiddlewareFunctions[index].url;
	    const fn = registeredMiddlewareFunctions[index].fn;

	    if (!methodMatch(registeredMethod, method)) {
            execute(++index, method, url, ...params);
            return;
        }

        if (isTruthy(registeredUrl)) {
            const urlMatch = matchUrl(registeredUrl, url);

            if (!urlMatch.match) {
                execute(++index, method, url, ...params);
                return;
            }

            if (params[0]) {
                params[0].params = urlMatch.params;
                params[0].query  = urlMatch.query;
            }
        }

        let counter = 0;

        fn(...params, (err) => {
            counter++;
            if (counter > 1) {
                console.warn('You called next multiple times, only the first one will be executed');
                return;
            }

            if (err) {
                console.error(err);
                return;
            }

            execute(++index, method, url, ...params);
        });
    }
}

module.exports = Middleware;

},{"querystring":false}],"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Router.js":[function(require,module,exports){
function Router(server) {
    this.use = function use(url, callback) {
        callback(serverWrapper(url, server));
    };
}


function serverWrapper(baseUrl, server) {
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }

    return {
        use(url, reqResolver) {
            server.use(baseUrl + url, reqResolver);
        },
        get(url, reqResolver) {
            server.get(baseUrl + url, reqResolver);
        },
        post(url, reqResolver) {
            server.post(baseUrl + url, reqResolver);
        },
        put(url, reqResolver) {
            server.put(baseUrl + url, reqResolver);
        },
        delete(url, reqResolver) {
            server.delete(baseUrl + url, reqResolver);
        },
        options(url, reqResolver) {
            server.options(baseUrl + url, reqResolver);
        }
    };
}

module.exports = Router;

},{}],"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Server.js":[function(require,module,exports){
const Middleware = require('./Middleware');
const http = require('http');
const https = require('https');

function Server(sslOptions) {
    const middleware = new Middleware();
    const server = _initServer(sslOptions);


    this.listen = function listen(port) {
        server.listen(port);
        return this;
    };

    this.use = function use(url, callback) {
        //TODO: find a better way
        if (arguments.length >= 2) {
            middleware.use(url, callback);
        } else if (arguments.length === 1) {
            callback = url;
            middleware.use(callback);
        }

    };

    this.close = function (callback) {
        server.close(callback);
    };

    this.get = function getReq(reqUrl, reqResolver) {
        middleware.use("GET", reqUrl, reqResolver);
    };

    this.post = function postReq(reqUrl, reqResolver) {
        middleware.use("POST", reqUrl, reqResolver);
    };

    this.put = function putReq(reqUrl, reqResolver) {
        middleware.use("PUT", reqUrl, reqResolver);
    };

    this.delete = function deleteReq(reqUrl, reqResolver) {
        middleware.use("DELETE", reqUrl, reqResolver);
    };

    this.options = function optionsReq(reqUrl, reqResolver) {
        middleware.use("OPTIONS", reqUrl, reqResolver);
    };


    /* INTERNAL METHODS */

    function _initServer(sslConfig) {
        if (sslConfig) {
            return https.createServer(sslConfig, middleware.go);
        } else {
            return http.createServer(middleware.go);
        }
    }
}

module.exports = Server;
},{"./Middleware":"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Middleware.js","http":false,"https":false}],"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/httpUtils.js":[function(require,module,exports){
const fs = require('fs');
const path = require('path');

function setDataHandler(request, callback) {
    let bodyContent = '';

    request.on('data', function (dataChunk) {
        bodyContent += dataChunk;
    });

    request.on('end', function () {
        callback(undefined, bodyContent);
    });

    request.on('error', callback);
}

function setDataHandlerMiddleware(request, response, next) {
    if (request.headers['content-type'] !== 'application/octet-stream') {
        setDataHandler(request, function (error, bodyContent) {
            request.body = bodyContent;
            next(error);
        });
    } else {
        return next();
    }
}

function sendErrorResponse(error, response, statusCode) {
    console.error(error);
    response.statusCode = statusCode;
    response.end();
}

function bodyParser(req, res, next) {
    let bodyContent = '';

    req.on('data', function (dataChunk) {
        bodyContent += dataChunk;
    });

    req.on('end', function () {
        req.body = bodyContent;
        next();
    });

    req.on('error', function (err) {
        next(err);
    });
}

function serveStaticFile(baseFolder, ignorePath) {
    return function (req, res) {
        const url = req.url.substring(ignorePath.length);
        const filePath = path.join(baseFolder, url);
        fs.stat(filePath, (err) => {
            if (err) {
                res.statusCode = 404;
                res.end();
                return;
            }

            if (url.endsWith('.html')) {
                res.contentType = 'text/html';
            } else if (url.endsWith('.css')) {
                res.contentType = 'text/css';
            } else if (url.endsWith('.js')) {
                res.contentType = 'text/javascript';
            }

            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);

        });
    };
}

module.exports = {setDataHandler, setDataHandlerMiddleware, sendErrorResponse, bodyParser, serveStaticFile};

},{"fs":false,"path":false}],"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/index.js":[function(require,module,exports){
const Client = require('./classes/Client');
const Server = require('./classes/Server');
const httpUtils = require('./httpUtils');
const Router = require('./classes/Router');

module.exports = {Server, Client, httpUtils, Router};


},{"./classes/Client":"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Client.js","./classes/Router":"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Router.js","./classes/Server":"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/classes/Server.js","./httpUtils":"/opt/privatesky/modules/virtualmq/libs/http-wrapper/src/httpUtils.js"}],"/opt/privatesky/node_modules/is-buffer/index.js":[function(require,module,exports){
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

},{}],"buffer-crc32":[function(require,module,exports){
var Buffer = require('buffer').Buffer;

var CRC_TABLE = [
  0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,
  0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,
  0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,
  0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
  0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,
  0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
  0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
  0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
  0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,
  0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,
  0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,
  0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
  0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,
  0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
  0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,
  0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
  0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,
  0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
  0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,
  0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
  0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
  0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,
  0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,
  0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
  0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,
  0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,
  0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,
  0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
  0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,
  0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
  0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,
  0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
  0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,
  0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,
  0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
  0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
  0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,
  0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,
  0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,
  0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
  0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,
  0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
  0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,
  0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
  0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,
  0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,
  0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,
  0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
  0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
  0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,
  0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,
  0x2d02ef8d
];

if (typeof Int32Array !== 'undefined') {
  CRC_TABLE = new Int32Array(CRC_TABLE);
}

function newEmptyBuffer(length) {
  var buffer = new Buffer(length);
  buffer.fill(0x00);
  return buffer;
}

function ensureBuffer(input) {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  var hasNewBufferAPI =
      typeof Buffer.alloc === "function" &&
      typeof Buffer.from === "function";

  if (typeof input === "number") {
    return hasNewBufferAPI ? Buffer.alloc(input) : newEmptyBuffer(input);
  }
  else if (typeof input === "string") {
    return hasNewBufferAPI ? Buffer.from(input) : new Buffer(input);
  }
  else {
    throw new Error("input must be buffer, number, or string, received " +
                    typeof input);
  }
}

function bufferizeInt(num) {
  var tmp = ensureBuffer(4);
  tmp.writeInt32BE(num, 0);
  return tmp;
}

function _crc32(buf, previous) {
  buf = ensureBuffer(buf);
  if (Buffer.isBuffer(previous)) {
    previous = previous.readUInt32BE(0);
  }
  var crc = ~~previous ^ -1;
  for (var n = 0; n < buf.length; n++) {
    crc = CRC_TABLE[(crc ^ buf[n]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1);
}

function crc32() {
  return bufferizeInt(_crc32.apply(null, arguments));
}
crc32.signed = function () {
  return _crc32.apply(null, arguments);
};
crc32.unsigned = function () {
  return _crc32.apply(null, arguments) >>> 0;
};

module.exports = crc32;

},{"buffer":false}],"edfs":[function(require,module,exports){
module.exports.EDFSMiddleware = require("./lib/EDFSMiddleware");



},{"./lib/EDFSMiddleware":"/opt/privatesky/modules/edfs/lib/EDFSMiddleware.js"}],"foldermq":[function(require,module,exports){
module.exports = {
					createQue: require("./lib/folderMQ").getFolderQueue
					//folderMQ: require("./lib/folderMQ")
};
},{"./lib/folderMQ":"/opt/privatesky/modules/foldermq/lib/folderMQ.js"}],"node-fd-slicer":[function(require,module,exports){
(function (Buffer,setImmediate){
var fs = require('fs');
var util = require('util');
var stream = require('stream');
var Readable = stream.Readable;
var Writable = stream.Writable;
var PassThrough = stream.PassThrough;
var Pend = require('./modules/node-pend');
var EventEmitter = require('events').EventEmitter;

exports.createFromBuffer = createFromBuffer;
exports.createFromFd = createFromFd;
exports.BufferSlicer = BufferSlicer;
exports.FdSlicer = FdSlicer;

util.inherits(FdSlicer, EventEmitter);
function FdSlicer(fd, options) {
  options = options || {};
  EventEmitter.call(this);

  this.fd = fd;
  this.pend = new Pend();
  this.pend.max = 1;
  this.refCount = 0;
  this.autoClose = !!options.autoClose;
}

FdSlicer.prototype.read = function(buffer, offset, length, position, callback) {
  var self = this;
  self.pend.go(function(cb) {
    fs.read(self.fd, buffer, offset, length, position, function(err, bytesRead, buffer) {
      cb();
      callback(err, bytesRead, buffer);
    });
  });
};

FdSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  var self = this;
  self.pend.go(function(cb) {
    fs.write(self.fd, buffer, offset, length, position, function(err, written, buffer) {
      cb();
      callback(err, written, buffer);
    });
  });
};

FdSlicer.prototype.createReadStream = function(options) {
  return new ReadStream(this, options);
};

FdSlicer.prototype.createWriteStream = function(options) {
  return new WriteStream(this, options);
};

FdSlicer.prototype.ref = function() {
  this.refCount += 1;
};

FdSlicer.prototype.unref = function() {
  var self = this;
  self.refCount -= 1;

  if (self.refCount > 0) return;
  if (self.refCount < 0) throw new Error("invalid unref");

  if (self.autoClose) {
    fs.close(self.fd, onCloseDone);
  }

  function onCloseDone(err) {
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('close');
    }
  }
};

util.inherits(ReadStream, Readable);
function ReadStream(context, options) {
  options = options || {};
  Readable.call(this, options);

  this.context = context;
  this.context.ref();

  this.start = options.start || 0;
  this.endOffset = options.end;
  this.pos = this.start;
  this.destroyed = false;
}

ReadStream.prototype._read = function(n) {
  var self = this;
  if (self.destroyed) return;

  var toRead = Math.min(self._readableState.highWaterMark, n);
  if (self.endOffset != null) {
    toRead = Math.min(toRead, self.endOffset - self.pos);
  }
  if (toRead <= 0) {
    self.destroyed = true;
    self.push(null);
    self.context.unref();
    return;
  }
  self.context.pend.go(function(cb) {
    if (self.destroyed) return cb();
    var buffer = new Buffer(toRead);
    fs.read(self.context.fd, buffer, 0, toRead, self.pos, function(err, bytesRead) {
      if (err) {
        self.destroy(err);
      } else if (bytesRead === 0) {
        self.destroyed = true;
        self.push(null);
        self.context.unref();
      } else {
        self.pos += bytesRead;
        self.push(buffer.slice(0, bytesRead));
      }
      cb();
    });
  });
};

ReadStream.prototype.destroy = function(err) {
  if (this.destroyed) return;
  err = err || new Error("stream destroyed");
  this.destroyed = true;
  this.emit('error', err);
  this.context.unref();
};

util.inherits(WriteStream, Writable);
function WriteStream(context, options) {
  options = options || {};
  Writable.call(this, options);

  this.context = context;
  this.context.ref();

  this.start = options.start || 0;
  this.endOffset = (options.end == null) ? Infinity : +options.end;
  this.bytesWritten = 0;
  this.pos = this.start;
  this.destroyed = false;

  this.on('finish', this.destroy.bind(this));
}

WriteStream.prototype._write = function(buffer, encoding, callback) {
  var self = this;
  if (self.destroyed) return;

  if (self.pos + buffer.length > self.endOffset) {
    var err = new Error("maximum file length exceeded");
    err.code = 'ETOOBIG';
    self.destroy();
    callback(err);
    return;
  }
  self.context.pend.go(function(cb) {
    if (self.destroyed) return cb();
    fs.write(self.context.fd, buffer, 0, buffer.length, self.pos, function(err, bytes) {
      if (err) {
        self.destroy();
        cb();
        callback(err);
      } else {
        self.bytesWritten += bytes;
        self.pos += bytes;
        self.emit('progress');
        cb();
        callback();
      }
    });
  });
};

WriteStream.prototype.destroy = function() {
  if (this.destroyed) return;
  this.destroyed = true;
  this.context.unref();
};

util.inherits(BufferSlicer, EventEmitter);
function BufferSlicer(buffer, options) {
  EventEmitter.call(this);

  options = options || {};
  this.refCount = 0;
  this.buffer = buffer;
  this.maxChunkSize = options.maxChunkSize || Number.MAX_SAFE_INTEGER;
}

BufferSlicer.prototype.read = function(buffer, offset, length, position, callback) {
  var end = position + length;
  var delta = end - this.buffer.length;
  var written = (delta > 0) ? delta : length;
  this.buffer.copy(buffer, offset, position, end);
  setImmediate(function() {
    callback(null, written);
  });
};

BufferSlicer.prototype.write = function(buffer, offset, length, position, callback) {
  buffer.copy(this.buffer, position, offset, offset + length);
  setImmediate(function() {
    callback(null, length, buffer);
  });
};

BufferSlicer.prototype.createReadStream = function(options) {
  options = options || {};
  var readStream = new PassThrough(options);
  readStream.destroyed = false;
  readStream.start = options.start || 0;
  readStream.endOffset = options.end;
  // by the time this function returns, we'll be done.
  readStream.pos = readStream.endOffset || this.buffer.length;

  // respect the maxChunkSize option to slice up the chunk into smaller pieces.
  var entireSlice = this.buffer.slice(readStream.start, readStream.pos);
  var offset = 0;
  while (true) {
    var nextOffset = offset + this.maxChunkSize;
    if (nextOffset >= entireSlice.length) {
      // last chunk
      if (offset < entireSlice.length) {
        readStream.write(entireSlice.slice(offset, entireSlice.length));
      }
      break;
    }
    readStream.write(entireSlice.slice(offset, nextOffset));
    offset = nextOffset;
  }

  readStream.end();
  readStream.destroy = function() {
    readStream.destroyed = true;
  };
  return readStream;
};

BufferSlicer.prototype.createWriteStream = function(options) {
  var bufferSlicer = this;
  options = options || {};
  var writeStream = new Writable(options);
  writeStream.start = options.start || 0;
  writeStream.endOffset = (options.end == null) ? this.buffer.length : +options.end;
  writeStream.bytesWritten = 0;
  writeStream.pos = writeStream.start;
  writeStream.destroyed = false;
  writeStream._write = function(buffer, encoding, callback) {
    if (writeStream.destroyed) return;

    var end = writeStream.pos + buffer.length;
    if (end > writeStream.endOffset) {
      var err = new Error("maximum file length exceeded");
      err.code = 'ETOOBIG';
      writeStream.destroyed = true;
      callback(err);
      return;
    }
    buffer.copy(bufferSlicer.buffer, writeStream.pos, 0, buffer.length);

    writeStream.bytesWritten += buffer.length;
    writeStream.pos = end;
    writeStream.emit('progress');
    callback();
  };
  writeStream.destroy = function() {
    writeStream.destroyed = true;
  };
  return writeStream;
};

BufferSlicer.prototype.ref = function() {
  this.refCount += 1;
};

BufferSlicer.prototype.unref = function() {
  this.refCount -= 1;

  if (this.refCount < 0) {
    throw new Error("invalid unref");
  }
};

function createFromBuffer(buffer, options) {
  return new BufferSlicer(buffer, options);
}

function createFromFd(fd, options) {
  return new FdSlicer(fd, options);
}

}).call(this,require("buffer").Buffer,require("timers").setImmediate)

},{"./modules/node-pend":"/opt/privatesky/modules/node-fd-slicer/modules/node-pend/index.js","buffer":false,"events":false,"fs":false,"stream":false,"timers":false,"util":false}],"psk-http-client":[function(require,module,exports){
//to look nice the requireModule on Node
require("./lib/psk-abstract-client");
if(!$$.browserRuntime){
	require("./lib/psk-node-client");
}else{
	require("./lib/psk-browser-client");
}
},{"./lib/psk-abstract-client":"/opt/privatesky/modules/psk-http-client/lib/psk-abstract-client.js","./lib/psk-browser-client":"/opt/privatesky/modules/psk-http-client/lib/psk-browser-client.js","./lib/psk-node-client":"/opt/privatesky/modules/psk-http-client/lib/psk-node-client.js"}],"pskdb":[function(require,module,exports){
const Blockchain = require('./lib/Blockchain');

module.exports = {
    startDB: function (folder) {
        if ($$.blockchain) {
            throw new Error('$$.blockchain is already defined');
        }
        $$.blockchain = this.createDBHandler(folder);
        return $$.blockchain;
    },
    createDBHandler: function(folder){
        require('./lib/domain');
        require('./lib/swarms');

        const fpds = require("./lib/FolderPersistentPDS");
        const pds = fpds.newPDS(folder);

        return new Blockchain(pds);
    },
    parseDomainUrl: function (domainUrl) {
        console.log("Empty function");
    },
    getDomainInfo: function () {
        console.log("Empty function");
    },
    startInMemoryDB: function() {
		require('./lib/domain');
		require('./lib/swarms');

		const pds = require('./lib/InMemoryPDS');

		return new Blockchain(pds.newPDS(null));
    },
    startDb: function(readerWriter) {
        require('./lib/domain');
        require('./lib/swarms');

        const ppds = require("./lib/PersistentPDS");
        const pds = ppds.newPDS(readerWriter);

        return new Blockchain(pds);
    }
};

},{"./lib/Blockchain":"/opt/privatesky/modules/pskdb/lib/Blockchain.js","./lib/FolderPersistentPDS":"/opt/privatesky/modules/pskdb/lib/FolderPersistentPDS.js","./lib/InMemoryPDS":"/opt/privatesky/modules/pskdb/lib/InMemoryPDS.js","./lib/PersistentPDS":"/opt/privatesky/modules/pskdb/lib/PersistentPDS.js","./lib/domain":"/opt/privatesky/modules/pskdb/lib/domain/index.js","./lib/swarms":"/opt/privatesky/modules/pskdb/lib/swarms/index.js"}],"signsensus":[function(require,module,exports){
module.exports = {
    consUtil: require('./consUtil')
};
},{"./consUtil":"/opt/privatesky/modules/signsensus/lib/consUtil.js"}],"virtualmq":[function(require,module,exports){
const Server = require('./VirtualMQ.js');

module.exports = Server;

},{"./VirtualMQ.js":"/opt/privatesky/modules/virtualmq/VirtualMQ.js"}],"yauzl":[function(require,module,exports){
(function (Buffer,setImmediate){
var fs = require("fs");
var zlib = require("zlib");
const fd_slicer = require("node-fd-slicer");
var crc32 = require("buffer-crc32");
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var Transform = require("stream").Transform;
var PassThrough = require("stream").PassThrough;
var Writable = require("stream").Writable;

exports.open = open;
exports.fromFd = fromFd;
exports.fromBuffer = fromBuffer;
exports.fromRandomAccessReader = fromRandomAccessReader;
exports.dosDateTimeToDate = dosDateTimeToDate;
exports.validateFileName = validateFileName;
exports.ZipFile = ZipFile;
exports.Entry = Entry;
exports.RandomAccessReader = RandomAccessReader;

function open(path, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = null;
	}
	if (options == null) options = {};
	if (options.autoClose == null) options.autoClose = true;
	if (options.lazyEntries == null) options.lazyEntries = false;
	if (options.decodeStrings == null) options.decodeStrings = true;
	if (options.validateEntrySizes == null) options.validateEntrySizes = true;
	if (options.strictFileNames == null) options.strictFileNames = false;
	if (callback == null) callback = defaultCallback;
	fs.open(path, "r", function (err, fd) {
		if (err) return callback(err);
		fromFd(fd, options, function (err, zipfile) {
			if (err) fs.close(fd, defaultCallback);
			callback(err, zipfile);
		});
	});
}

function fromFd(fd, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = null;
	}
	if (options == null) options = {};
	if (options.autoClose == null) options.autoClose = false;
	if (options.lazyEntries == null) options.lazyEntries = false;
	if (options.decodeStrings == null) options.decodeStrings = true;
	if (options.validateEntrySizes == null) options.validateEntrySizes = true;
	if (options.strictFileNames == null) options.strictFileNames = false;
	if (callback == null) callback = defaultCallback;
	fs.fstat(fd, function (err, stats) {
		if (err) return callback(err);
		var reader = fd_slicer.createFromFd(fd, {autoClose: true});
		fromRandomAccessReader(reader, stats.size, options, callback);
	});
}

function fromBuffer(buffer, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = null;
	}
	if (options == null) options = {};
	options.autoClose = false;
	if (options.lazyEntries == null) options.lazyEntries = false;
	if (options.decodeStrings == null) options.decodeStrings = true;
	if (options.validateEntrySizes == null) options.validateEntrySizes = true;
	if (options.strictFileNames == null) options.strictFileNames = false;
	// limit the max chunk size. see https://github.com/thejoshwolfe/yauzl/issues/87
	var reader = fd_slicer.createFromBuffer(buffer, {maxChunkSize: 0x10000});
	fromRandomAccessReader(reader, buffer.length, options, callback);
}

function fromRandomAccessReader(reader, totalSize, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = null;
	}
	if (options == null) options = {};
	if (options.autoClose == null) options.autoClose = true;
	if (options.lazyEntries == null) options.lazyEntries = false;
	if (options.decodeStrings == null) options.decodeStrings = true;
	var decodeStrings = !!options.decodeStrings;
	if (options.validateEntrySizes == null) options.validateEntrySizes = true;
	if (options.strictFileNames == null) options.strictFileNames = false;
	if (callback == null) callback = defaultCallback;
	if (typeof totalSize !== "number") throw new Error("expected totalSize parameter to be a number");
	if (totalSize > Number.MAX_SAFE_INTEGER) {
		throw new Error("zip file too large. only file sizes up to 2^52 are supported due to JavaScript's Number type being an IEEE 754 double.");
	}

	// the matching unref() call is in zipfile.close()
	reader.ref();

	// eocdr means End of Central Directory Record.
	// search backwards for the eocdr signature.
	// the last field of the eocdr is a variable-length comment.
	// the comment size is encoded in a 2-byte field in the eocdr, which we can't find without trudging backwards through the comment to find it.
	// as a consequence of this design decision, it's possible to have ambiguous zip file metadata if a coherent eocdr was in the comment.
	// we search backwards for a eocdr signature, and hope that whoever made the zip file was smart enough to forbid the eocdr signature in the comment.
	var eocdrWithoutCommentSize = 22;
	var maxCommentSize = 0xffff; // 2-byte size
	var bufferSize = Math.min(eocdrWithoutCommentSize + maxCommentSize, totalSize);
	var buffer = newBuffer(bufferSize);
	var bufferReadStart = totalSize - buffer.length;
	readAndAssertNoEof(reader, buffer, 0, bufferSize, bufferReadStart, function (err) {
		if (err) return callback(err);
		for (var i = bufferSize - eocdrWithoutCommentSize; i >= 0; i -= 1) {
			if (buffer.readUInt32LE(i) !== 0x06054b50) continue;
			// found eocdr
			var eocdrBuffer = buffer.slice(i);

			// 0 - End of central directory signature = 0x06054b50
			// 4 - Number of this disk
			var diskNumber = eocdrBuffer.readUInt16LE(4);
			if (diskNumber !== 0) {
				return callback(new Error("multi-disk zip files are not supported: found disk number: " + diskNumber));
			}
			// 6 - Disk where central directory starts
			// 8 - Number of central directory records on this disk
			// 10 - Total number of central directory records
			var entryCount = eocdrBuffer.readUInt16LE(10);
			// 12 - Size of central directory (bytes)
			// 16 - Offset of start of central directory, relative to start of archive
			var centralDirectoryOffset = eocdrBuffer.readUInt32LE(16);
			// 20 - Comment length
			var commentLength = eocdrBuffer.readUInt16LE(20);
			var expectedCommentLength = eocdrBuffer.length - eocdrWithoutCommentSize;
			if (commentLength !== expectedCommentLength) {
				return callback(new Error("invalid comment length. expected: " + expectedCommentLength + ". found: " + commentLength));
			}
			// 22 - Comment
			// the encoding is always cp437.
			var comment = decodeStrings ? decodeBuffer(eocdrBuffer, 22, eocdrBuffer.length, false)
				: eocdrBuffer.slice(22);

			if (!(entryCount === 0xffff || centralDirectoryOffset === 0xffffffff)) {
				return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries, decodeStrings, options.validateEntrySizes, options.strictFileNames));
			}

			// ZIP64 format

			// ZIP64 Zip64 end of central directory locator
			var zip64EocdlBuffer = newBuffer(20);
			var zip64EocdlOffset = bufferReadStart + i - zip64EocdlBuffer.length;
			readAndAssertNoEof(reader, zip64EocdlBuffer, 0, zip64EocdlBuffer.length, zip64EocdlOffset, function (err) {
				if (err) return callback(err);

				// 0 - zip64 end of central dir locator signature = 0x07064b50
				if (zip64EocdlBuffer.readUInt32LE(0) !== 0x07064b50) {
					return callback(new Error("invalid zip64 end of central directory locator signature"));
				}
				// 4 - number of the disk with the start of the zip64 end of central directory
				// 8 - relative offset of the zip64 end of central directory record
				var zip64EocdrOffset = readUInt64LE(zip64EocdlBuffer, 8);
				// 16 - total number of disks

				// ZIP64 end of central directory record
				var zip64EocdrBuffer = newBuffer(56);
				readAndAssertNoEof(reader, zip64EocdrBuffer, 0, zip64EocdrBuffer.length, zip64EocdrOffset, function (err) {
					if (err) return callback(err);

					// 0 - zip64 end of central dir signature                           4 bytes  (0x06064b50)
					if (zip64EocdrBuffer.readUInt32LE(0) !== 0x06064b50) {
						return callback(new Error("invalid zip64 end of central directory record signature"));
					}
					// 4 - size of zip64 end of central directory record                8 bytes
					// 12 - version made by                                             2 bytes
					// 14 - version needed to extract                                   2 bytes
					// 16 - number of this disk                                         4 bytes
					// 20 - number of the disk with the start of the central directory  4 bytes
					// 24 - total number of entries in the central directory on this disk         8 bytes
					// 32 - total number of entries in the central directory            8 bytes
					entryCount = readUInt64LE(zip64EocdrBuffer, 32);
					// 40 - size of the central directory                               8 bytes
					// 48 - offset of start of central directory with respect to the starting disk number     8 bytes
					centralDirectoryOffset = readUInt64LE(zip64EocdrBuffer, 48);
					// 56 - zip64 extensible data sector                                (variable size)
					return callback(null, new ZipFile(reader, centralDirectoryOffset, totalSize, entryCount, comment, options.autoClose, options.lazyEntries, decodeStrings, options.validateEntrySizes, options.strictFileNames));
				});
			});
			return;
		}
		callback(new Error("end of central directory record signature not found"));
	});
}

util.inherits(ZipFile, EventEmitter);

function ZipFile(reader, centralDirectoryOffset, fileSize, entryCount, comment, autoClose, lazyEntries, decodeStrings, validateEntrySizes, strictFileNames) {
	var self = this;
	EventEmitter.call(self);
	self.reader = reader;
	// forward close events
	self.reader.on("error", function (err) {
		// error closing the fd
		emitError(self, err);
	});
	self.reader.once("close", function () {
		self.emit("close");
	});
	self.readEntryCursor = centralDirectoryOffset;
	self.fileSize = fileSize;
	self.entryCount = entryCount;
	self.comment = comment;
	self.entriesRead = 0;
	self.autoClose = !!autoClose;
	self.lazyEntries = !!lazyEntries;
	self.decodeStrings = !!decodeStrings;
	self.validateEntrySizes = !!validateEntrySizes;
	self.strictFileNames = !!strictFileNames;
	self.isOpen = true;
	self.emittedError = false;

	if (!self.lazyEntries) self._readEntry();
}

ZipFile.prototype.close = function () {
	if (!this.isOpen) return;
	this.isOpen = false;
	this.reader.unref();
};

function emitErrorAndAutoClose(self, err) {
	if (self.autoClose) self.close();
	emitError(self, err);
}

function emitError(self, err) {
	if (self.emittedError) return;
	self.emittedError = true;
	self.emit("error", err);
}

ZipFile.prototype.readEntry = function () {
	if (!this.lazyEntries) throw new Error("readEntry() called without lazyEntries:true");
	this._readEntry();
};
ZipFile.prototype._readEntry = function () {
	var self = this;
	if (self.entryCount === self.entriesRead) {
		// done with metadata
		setImmediate(function () {
			if (self.autoClose) self.close();
			if (self.emittedError) return;
			self.emit("end");
		});
		return;
	}
	if (self.emittedError) return;
	var buffer = newBuffer(46);
	readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function (err) {
		if (err) return emitErrorAndAutoClose(self, err);
		if (self.emittedError) return;
		var entry = new Entry();
		// 0 - Central directory file header signature
		var signature = buffer.readUInt32LE(0);
		if (signature !== 0x02014b50) return emitErrorAndAutoClose(self, new Error("invalid central directory file header signature: 0x" + signature.toString(16)));
		// 4 - Version made by
		entry.versionMadeBy = buffer.readUInt16LE(4);
		// 6 - Version needed to extract (minimum)
		entry.versionNeededToExtract = buffer.readUInt16LE(6);
		// 8 - General purpose bit flag
		entry.generalPurposeBitFlag = buffer.readUInt16LE(8);
		// 10 - Compression method
		entry.compressionMethod = buffer.readUInt16LE(10);
		// 12 - File last modification time
		entry.lastModFileTime = buffer.readUInt16LE(12);
		// 14 - File last modification date
		entry.lastModFileDate = buffer.readUInt16LE(14);
		// 16 - CRC-32
		entry.crc32 = buffer.readUInt32LE(16);
		// 20 - Compressed size
		entry.compressedSize = buffer.readUInt32LE(20);
		// 24 - Uncompressed size
		entry.uncompressedSize = buffer.readUInt32LE(24);
		// 28 - File name length (n)
		entry.fileNameLength = buffer.readUInt16LE(28);
		// 30 - Extra field length (m)
		entry.extraFieldLength = buffer.readUInt16LE(30);
		// 32 - File comment length (k)
		entry.fileCommentLength = buffer.readUInt16LE(32);
		// 34 - Disk number where file starts
		// 36 - Internal file attributes
		entry.internalFileAttributes = buffer.readUInt16LE(36);
		// 38 - External file attributes
		entry.externalFileAttributes = buffer.readUInt32LE(38);
		// 42 - Relative offset of local file header
		entry.relativeOffsetOfLocalHeader = buffer.readUInt32LE(42);

		if (entry.generalPurposeBitFlag & 0x40) return emitErrorAndAutoClose(self, new Error("strong encryption is not supported"));

		self.readEntryCursor += 46;

		buffer = newBuffer(entry.fileNameLength + entry.extraFieldLength + entry.fileCommentLength);
		readAndAssertNoEof(self.reader, buffer, 0, buffer.length, self.readEntryCursor, function (err) {
			if (err) return emitErrorAndAutoClose(self, err);
			if (self.emittedError) return;
			// 46 - File name
			var isUtf8 = (entry.generalPurposeBitFlag & 0x800) !== 0;
			entry.fileName = self.decodeStrings ? decodeBuffer(buffer, 0, entry.fileNameLength, isUtf8)
				: buffer.slice(0, entry.fileNameLength);

			// 46+n - Extra field
			var fileCommentStart = entry.fileNameLength + entry.extraFieldLength;
			var extraFieldBuffer = buffer.slice(entry.fileNameLength, fileCommentStart);
			entry.extraFields = [];
			var i = 0;
			while (i < extraFieldBuffer.length - 3) {
				var headerId = extraFieldBuffer.readUInt16LE(i + 0);
				var dataSize = extraFieldBuffer.readUInt16LE(i + 2);
				var dataStart = i + 4;
				var dataEnd = dataStart + dataSize;
				if (dataEnd > extraFieldBuffer.length) return emitErrorAndAutoClose(self, new Error("extra field length exceeds extra field buffer size"));
				var dataBuffer = newBuffer(dataSize);
				extraFieldBuffer.copy(dataBuffer, 0, dataStart, dataEnd);
				entry.extraFields.push({
					id: headerId,
					data: dataBuffer,
				});
				i = dataEnd;
			}

			// 46+n+m - File comment
			entry.fileComment = self.decodeStrings ? decodeBuffer(buffer, fileCommentStart, fileCommentStart + entry.fileCommentLength, isUtf8)
				: buffer.slice(fileCommentStart, fileCommentStart + entry.fileCommentLength);
			// compatibility hack for https://github.com/thejoshwolfe/yauzl/issues/47
			entry.comment = entry.fileComment;

			self.readEntryCursor += buffer.length;
			self.entriesRead += 1;

			if (entry.uncompressedSize === 0xffffffff ||
				entry.compressedSize === 0xffffffff ||
				entry.relativeOffsetOfLocalHeader === 0xffffffff) {
				// ZIP64 format
				// find the Zip64 Extended Information Extra Field
				var zip64EiefBuffer = null;
				for (var i = 0; i < entry.extraFields.length; i++) {
					var extraField = entry.extraFields[i];
					if (extraField.id === 0x0001) {
						zip64EiefBuffer = extraField.data;
						break;
					}
				}
				if (zip64EiefBuffer == null) {
					return emitErrorAndAutoClose(self, new Error("expected zip64 extended information extra field"));
				}
				var index = 0;
				// 0 - Original Size          8 bytes
				if (entry.uncompressedSize === 0xffffffff) {
					if (index + 8 > zip64EiefBuffer.length) {
						return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include uncompressed size"));
					}
					entry.uncompressedSize = readUInt64LE(zip64EiefBuffer, index);
					index += 8;
				}
				// 8 - Compressed Size        8 bytes
				if (entry.compressedSize === 0xffffffff) {
					if (index + 8 > zip64EiefBuffer.length) {
						return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include compressed size"));
					}
					entry.compressedSize = readUInt64LE(zip64EiefBuffer, index);
					index += 8;
				}
				// 16 - Relative Header Offset 8 bytes
				if (entry.relativeOffsetOfLocalHeader === 0xffffffff) {
					if (index + 8 > zip64EiefBuffer.length) {
						return emitErrorAndAutoClose(self, new Error("zip64 extended information extra field does not include relative header offset"));
					}
					entry.relativeOffsetOfLocalHeader = readUInt64LE(zip64EiefBuffer, index);
					index += 8;
				}
				// 24 - Disk Start Number      4 bytes
			}

			// check for Info-ZIP Unicode Path Extra Field (0x7075)
			// see https://github.com/thejoshwolfe/yauzl/issues/33
			if (self.decodeStrings) {
				for (var i = 0; i < entry.extraFields.length; i++) {
					var extraField = entry.extraFields[i];
					if (extraField.id === 0x7075) {
						if (extraField.data.length < 6) {
							// too short to be meaningful
							continue;
						}
						// Version       1 byte      version of this extra field, currently 1
						if (extraField.data.readUInt8(0) !== 1) {
							// > Changes may not be backward compatible so this extra
							// > field should not be used if the version is not recognized.
							continue;
						}
						// NameCRC32     4 bytes     File Name Field CRC32 Checksum
						var oldNameCrc32 = extraField.data.readUInt32LE(1);
						if (crc32.unsigned(buffer.slice(0, entry.fileNameLength)) !== oldNameCrc32) {
							// > If the CRC check fails, this UTF-8 Path Extra Field should be
							// > ignored and the File Name field in the header should be used instead.
							continue;
						}
						// UnicodeName   Variable    UTF-8 version of the entry File Name
						entry.fileName = decodeBuffer(extraField.data, 5, extraField.data.length, true);
						break;
					}
				}
			}

			// validate file size
			if (self.validateEntrySizes && entry.compressionMethod === 0) {
				var expectedCompressedSize = entry.uncompressedSize;
				if (entry.isEncrypted()) {
					// traditional encryption prefixes the file data with a header
					expectedCompressedSize += 12;
				}
				if (entry.compressedSize !== expectedCompressedSize) {
					var msg = "compressed/uncompressed size mismatch for stored file: " + entry.compressedSize + " != " + entry.uncompressedSize;
					return emitErrorAndAutoClose(self, new Error(msg));
				}
			}

			if (self.decodeStrings) {
				if (!self.strictFileNames) {
					// allow backslash
					entry.fileName = entry.fileName.replace(/\\/g, "/");
				}
				var errorMessage = validateFileName(entry.fileName, self.validateFileNameOptions);
				if (errorMessage != null) return emitErrorAndAutoClose(self, new Error(errorMessage));
			}
			self.emit("entry", entry);

			if (!self.lazyEntries) self._readEntry();
		});
	});
};

ZipFile.prototype.openReadStream = function (entry, options, callback) {
	var self = this;
	// parameter validation
	var relativeStart = 0;
	var relativeEnd = entry.compressedSize;
	if (callback == null) {
		callback = options;
		options = {};
	} else {
		// validate options that the caller has no excuse to get wrong
		if (options.decrypt != null) {
			if (!entry.isEncrypted()) {
				throw new Error("options.decrypt can only be specified for encrypted entries");
			}
			if (options.decrypt !== false) throw new Error("invalid options.decrypt value: " + options.decrypt);
			if (entry.isCompressed()) {
				if (options.decompress !== false) throw new Error("entry is encrypted and compressed, and options.decompress !== false");
			}
		}
		if (options.decompress != null) {
			if (!entry.isCompressed()) {
				throw new Error("options.decompress can only be specified for compressed entries");
			}
			if (!(options.decompress === false || options.decompress === true)) {
				throw new Error("invalid options.decompress value: " + options.decompress);
			}
		}
		if (options.start != null || options.end != null) {
			if (entry.isCompressed() && options.decompress !== false) {
				throw new Error("start/end range not allowed for compressed entry without options.decompress === false");
			}
			if (entry.isEncrypted() && options.decrypt !== false) {
				throw new Error("start/end range not allowed for encrypted entry without options.decrypt === false");
			}
		}
		if (options.start != null) {
			relativeStart = options.start;
			if (relativeStart < 0) throw new Error("options.start < 0");
			if (relativeStart > entry.compressedSize) throw new Error("options.start > entry.compressedSize");
		}
		if (options.end != null) {
			relativeEnd = options.end;
			if (relativeEnd < 0) throw new Error("options.end < 0");
			if (relativeEnd > entry.compressedSize) throw new Error("options.end > entry.compressedSize");
			if (relativeEnd < relativeStart) throw new Error("options.end < options.start");
		}
	}
	// any further errors can either be caused by the zipfile,
	// or were introduced in a minor version of yauzl,
	// so should be passed to the client rather than thrown.
	if (!self.isOpen) return callback(new Error("closed"));
	if (entry.isEncrypted()) {
		if (options.decrypt !== false) return callback(new Error("entry is encrypted, and options.decrypt !== false"));
	}
	// make sure we don't lose the fd before we open the actual read stream
	self.reader.ref();
	var buffer = newBuffer(30);
	readAndAssertNoEof(self.reader, buffer, 0, buffer.length, entry.relativeOffsetOfLocalHeader, function (err) {
		try {
			if (err) return callback(err);
			// 0 - Local file header signature = 0x04034b50
			var signature = buffer.readUInt32LE(0);
			if (signature !== 0x04034b50) {
				return callback(new Error("invalid local file header signature: 0x" + signature.toString(16)));
			}
			// all this should be redundant
			// 4 - Version needed to extract (minimum)
			// 6 - General purpose bit flag
			// 8 - Compression method
			// 10 - File last modification time
			// 12 - File last modification date
			// 14 - CRC-32
			// 18 - Compressed size
			// 22 - Uncompressed size
			// 26 - File name length (n)
			var fileNameLength = buffer.readUInt16LE(26);
			// 28 - Extra field length (m)
			var extraFieldLength = buffer.readUInt16LE(28);
			// 30 - File name
			// 30+n - Extra field
			var localFileHeaderEnd = entry.relativeOffsetOfLocalHeader + buffer.length + fileNameLength + extraFieldLength;
			var decompress;
			if (entry.compressionMethod === 0) {
				// 0 - The file is stored (no compression)
				decompress = false;
			} else if (entry.compressionMethod === 8) {
				// 8 - The file is Deflated
				decompress = options.decompress != null ? options.decompress : true;
			} else {
				return callback(new Error("unsupported compression method: " + entry.compressionMethod));
			}
			var fileDataStart = localFileHeaderEnd;
			var fileDataEnd = fileDataStart + entry.compressedSize;
			if (entry.compressedSize !== 0) {
				// bounds check now, because the read streams will probably not complain loud enough.
				// since we're dealing with an unsigned offset plus an unsigned size,
				// we only have 1 thing to check for.
				if (fileDataEnd > self.fileSize) {
					return callback(new Error("file data overflows file bounds: " +
						fileDataStart + " + " + entry.compressedSize + " > " + self.fileSize));
				}
			}
			var readStream = self.reader.createReadStream({
				start: fileDataStart + relativeStart,
				end: fileDataStart + relativeEnd,
			});
			var endpointStream = readStream;
			if (decompress) {
				var destroyed = false;
				var inflateFilter = zlib.createInflateRaw();
				readStream.on("error", function (err) {
					// setImmediate here because errors can be emitted during the first call to pipe()
					setImmediate(function () {
						if (!destroyed) inflateFilter.emit("error", err);
					});
				});
				readStream.pipe(inflateFilter);

				if (self.validateEntrySizes) {
					endpointStream = new AssertByteCountStream(entry.uncompressedSize);
					inflateFilter.on("error", function (err) {
						// forward zlib errors to the client-visible stream
						setImmediate(function () {
							if (!destroyed) endpointStream.emit("error", err);
						});
					});
					inflateFilter.pipe(endpointStream);
				} else {
					// the zlib filter is the client-visible stream
					endpointStream = inflateFilter;
				}
				// this is part of yauzl's API, so implement this function on the client-visible stream
				endpointStream.destroy = function () {
					destroyed = true;
					if (inflateFilter !== endpointStream) inflateFilter.unpipe(endpointStream);
					readStream.unpipe(inflateFilter);
					// TODO: the inflateFilter may cause a memory leak. see Issue #27.
					readStream.destroy();
				};
			}
			callback(null, endpointStream);
		} finally {
			self.reader.unref();
		}
	});
};

function Entry() {
}

Entry.prototype.getLastModDate = function () {
	return dosDateTimeToDate(this.lastModFileDate, this.lastModFileTime);
};
Entry.prototype.isEncrypted = function () {
	return (this.generalPurposeBitFlag & 0x1) !== 0;
};
Entry.prototype.isCompressed = function () {
	return this.compressionMethod === 8;
};

function dosDateTimeToDate(date, time) {
	var day = date & 0x1f; // 1-31
	var month = (date >> 5 & 0xf) - 1; // 1-12, 0-11
	var year = (date >> 9 & 0x7f) + 1980; // 0-128, 1980-2108

	var millisecond = 0;
	var second = (time & 0x1f) * 2; // 0-29, 0-58 (even numbers)
	var minute = time >> 5 & 0x3f; // 0-59
	var hour = time >> 11 & 0x1f; // 0-23

	return new Date(year, month, day, hour, minute, second, millisecond);
}

function validateFileName(fileName) {
	if (fileName.indexOf("\\") !== -1) {
		return "invalid characters in fileName: " + fileName;
	}
	if (/^[a-zA-Z]:/.test(fileName) || /^\//.test(fileName)) {
		return "absolute path: " + fileName;
	}
	if (fileName.split("/").indexOf("..") !== -1) {
		return "invalid relative path: " + fileName;
	}
	// all good
	return null;
}

function readAndAssertNoEof(reader, buffer, offset, length, position, callback) {
	if (length === 0) {
		// fs.read will throw an out-of-bounds error if you try to read 0 bytes from a 0 byte file
		return setImmediate(function () {
			callback(null, newBuffer(0));
		});
	}
	reader.read(buffer, offset, length, position, function (err, bytesRead) {
		if (err) return callback(err);
		if (bytesRead < length) {
			return callback(new Error("unexpected EOF"));
		}
		callback();
	});
}

util.inherits(AssertByteCountStream, Transform);

function AssertByteCountStream(byteCount) {
	Transform.call(this);
	this.actualByteCount = 0;
	this.expectedByteCount = byteCount;
}

AssertByteCountStream.prototype._transform = function (chunk, encoding, cb) {
	this.actualByteCount += chunk.length;
	if (this.actualByteCount > this.expectedByteCount) {
		var msg = "too many bytes in the stream. expected " + this.expectedByteCount + ". got at least " + this.actualByteCount;
		return cb(new Error(msg));
	}
	cb(null, chunk);
};
AssertByteCountStream.prototype._flush = function (cb) {
	if (this.actualByteCount < this.expectedByteCount) {
		var msg = "not enough bytes in the stream. expected " + this.expectedByteCount + ". got only " + this.actualByteCount;
		return cb(new Error(msg));
	}
	cb();
};

util.inherits(RandomAccessReader, EventEmitter);

function RandomAccessReader() {
	EventEmitter.call(this);
	this.refCount = 0;
}

RandomAccessReader.prototype.ref = function () {
	this.refCount += 1;
};
RandomAccessReader.prototype.unref = function () {
	var self = this;
	self.refCount -= 1;

	if (self.refCount > 0) return;
	if (self.refCount < 0) throw new Error("invalid unref");

	self.close(onCloseDone);

	function onCloseDone(err) {
		if (err) return self.emit('error', err);
		self.emit('close');
	}
};
RandomAccessReader.prototype.createReadStream = function (options) {
	var start = options.start;
	var end = options.end;
	if (start === end) {
		var emptyStream = new PassThrough();
		setImmediate(function () {
			emptyStream.end();
		});
		return emptyStream;
	}
	var stream = this._readStreamForRange(start, end);

	var destroyed = false;
	var refUnrefFilter = new RefUnrefFilter(this);
	stream.on("error", function (err) {
		setImmediate(function () {
			if (!destroyed) refUnrefFilter.emit("error", err);
		});
	});
	refUnrefFilter.destroy = function () {
		stream.unpipe(refUnrefFilter);
		refUnrefFilter.unref();
		stream.destroy();
	};

	var byteCounter = new AssertByteCountStream(end - start);
	refUnrefFilter.on("error", function (err) {
		setImmediate(function () {
			if (!destroyed) byteCounter.emit("error", err);
		});
	});
	byteCounter.destroy = function () {
		destroyed = true;
		refUnrefFilter.unpipe(byteCounter);
		refUnrefFilter.destroy();
	};

	return stream.pipe(refUnrefFilter).pipe(byteCounter);
};
RandomAccessReader.prototype._readStreamForRange = function (start, end) {
	throw new Error("not implemented");
};
RandomAccessReader.prototype.read = function (buffer, offset, length, position, callback) {
	var readStream = this.createReadStream({start: position, end: position + length});
	var writeStream = new Writable();
	var written = 0;
	writeStream._write = function (chunk, encoding, cb) {
		chunk.copy(buffer, offset + written, 0, chunk.length);
		written += chunk.length;
		cb();
	};
	writeStream.on("finish", callback);
	readStream.on("error", function (error) {
		callback(error);
	});
	readStream.pipe(writeStream);
};
RandomAccessReader.prototype.close = function (callback) {
	setImmediate(callback);
};

util.inherits(RefUnrefFilter, PassThrough);

function RefUnrefFilter(context) {
	PassThrough.call(this);
	this.context = context;
	this.context.ref();
	this.unreffedYet = false;
}

RefUnrefFilter.prototype._flush = function (cb) {
	this.unref();
	cb();
};
RefUnrefFilter.prototype.unref = function (cb) {
	if (this.unreffedYet) return;
	this.unreffedYet = true;
	this.context.unref();
};

var cp437 = '\u0000☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

function decodeBuffer(buffer, start, end, isUtf8) {
	if (isUtf8) {
		return buffer.toString("utf8", start, end);
	} else {
		var result = "";
		for (var i = start; i < end; i++) {
			result += cp437[buffer[i]];
		}
		return result;
	}
}

function readUInt64LE(buffer, offset) {
	// there is no native function for this, because we can't actually store 64-bit integers precisely.
	// after 53 bits, JavaScript's Number type (IEEE 754 double) can't store individual integers anymore.
	// but since 53 bits is a whole lot more than 32 bits, we do our best anyway.
	var lower32 = buffer.readUInt32LE(offset);
	var upper32 = buffer.readUInt32LE(offset + 4);
	// we can't use bitshifting here, because JavaScript bitshifting only works on 32-bit integers.
	return upper32 * 0x100000000 + lower32;
	// as long as we're bounds checking the result of this function against the total file size,
	// we'll catch any overflow errors, because we already made sure the total file size was within reason.
}

// Node 10 deprecated new Buffer().
var newBuffer;
if (typeof Buffer.allocUnsafe === "function") {
	newBuffer = function (len) {
		return Buffer.allocUnsafe(len);
	};
} else {
	newBuffer = function (len) {
		return new Buffer(len);
	};
}

function defaultCallback(err) {
	if (err) throw err;
}

}).call(this,require("buffer").Buffer,require("timers").setImmediate)

},{"buffer":false,"buffer-crc32":"buffer-crc32","events":false,"fs":false,"node-fd-slicer":"node-fd-slicer","stream":false,"timers":false,"util":false,"zlib":false}],"yazl":[function(require,module,exports){
(function (Buffer,setImmediate){
var fs = require("fs");
var Transform = require("stream").Transform;
var PassThrough = require("stream").PassThrough;
var zlib = require("zlib");
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var crc32 = require("buffer-crc32");

exports.ZipFile = ZipFile;
exports.dateToDosDateTime = dateToDosDateTime;

util.inherits(ZipFile, EventEmitter);

function ZipFile() {
	this.outputStream = new PassThrough();
	this.entries = [];
	this.outputStreamCursor = 0;
	this.ended = false; // .end() sets this
	this.allDone = false; // set when we've written the last bytes
	this.forceZip64Eocd = false; // configurable in .end()
}

ZipFile.prototype.addFile = function (realPath, metadataPath, options) {
	var self = this;
	metadataPath = validateMetadataPath(metadataPath, false);
	if (options == null) options = {};

	var entry = new Entry(metadataPath, false, options);
	self.entries.push(entry);
	fs.stat(realPath, function (err, stats) {
		if (err) return self.emit("error", err);
		if (!stats.isFile()) return self.emit("error", new Error("not a file: " + realPath));
		entry.uncompressedSize = stats.size;
		if (options.mtime == null) entry.setLastModDate(stats.mtime);
		if (options.mode == null) entry.setFileAttributesMode(stats.mode);
		entry.setFileDataPumpFunction(function () {
			var readStream = fs.createReadStream(realPath);
			entry.state = Entry.FILE_DATA_IN_PROGRESS;
			readStream.on("error", function (err) {
				self.emit("error", err);
			});
			pumpFileDataReadStream(self, entry, readStream);
		});
		pumpEntries(self);
	});
};

ZipFile.prototype.addReadStream = function (readStream, metadataPath, options) {
	var self = this;
	metadataPath = validateMetadataPath(metadataPath, false);
	if (options == null) options = {};
	var entry = new Entry(metadataPath, false, options);
	self.entries.push(entry);
	entry.setFileDataPumpFunction(function () {
		entry.state = Entry.FILE_DATA_IN_PROGRESS;
		pumpFileDataReadStream(self, entry, readStream);
	});
	pumpEntries(self);
};

ZipFile.prototype.addBuffer = function (buffer, metadataPath, options) {
	var self = this;
	metadataPath = validateMetadataPath(metadataPath, false);
	if (buffer.length > 0x3fffffff) throw new Error("buffer too large: " + buffer.length + " > " + 0x3fffffff);
	if (options == null) options = {};
	if (options.size != null) throw new Error("options.size not allowed");
	var entry = new Entry(metadataPath, false, options);
	entry.uncompressedSize = buffer.length;
	entry.crc32 = crc32.unsigned(buffer);
	entry.crcAndFileSizeKnown = true;
	self.entries.push(entry);
	if (!entry.compress) {
		setCompressedBuffer(buffer);
	} else {
		zlib.deflateRaw(buffer, function (err, compressedBuffer) {
			setCompressedBuffer(compressedBuffer);
			
		});
	}

	function setCompressedBuffer(compressedBuffer) {
		entry.compressedSize = compressedBuffer.length;
		entry.setFileDataPumpFunction(function () {
			writeToOutputStream(self, compressedBuffer);
			writeToOutputStream(self, entry.getDataDescriptor());
			entry.state = Entry.FILE_DATA_DONE;

			// don't call pumpEntries() recursively.
			// (also, don't call process.nextTick recursively.)
			setImmediate(function () {
				pumpEntries(self);
			});
		});
		pumpEntries(self);
	}
};


ZipFile.prototype.addEmptyDirectory = function (metadataPath, options) {
	var self = this;
	metadataPath = validateMetadataPath(metadataPath, true);
	if (options == null) options = {};
	if (options.size != null) throw new Error("options.size not allowed");
	if (options.compress != null) throw new Error("options.compress not allowed");
	var entry = new Entry(metadataPath, true, options);
	self.entries.push(entry);
	entry.setFileDataPumpFunction(function () {
		writeToOutputStream(self, entry.getDataDescriptor());
		entry.state = Entry.FILE_DATA_DONE;
		pumpEntries(self);
	});
	pumpEntries(self);
};

ZipFile.prototype.end = function (options, finalSizeCallback) {
	if (typeof options === "function") {
		finalSizeCallback = options;
		options = null;
	}
	if (options == null) options = {};
	if (this.ended) return;
	this.ended = true;
	this.finalSizeCallback = finalSizeCallback;
	this.forceZip64Eocd = !!options.forceZip64Format;
	pumpEntries(this);
};

function writeToOutputStream(self, buffer) {
	self.outputStream.write(buffer);
	self.outputStreamCursor += buffer.length;
}

function pumpFileDataReadStream(self, entry, readStream) {
	var crc32Watcher = new Crc32Watcher();
	var uncompressedSizeCounter = new ByteCounter();
	var compressor = entry.compress ? new zlib.DeflateRaw() : new PassThrough();
	var compressedSizeCounter = new ByteCounter();
	readStream.pipe(crc32Watcher)
		.pipe(uncompressedSizeCounter)
		.pipe(compressor)
		.pipe(compressedSizeCounter)
		.pipe(self.outputStream, {end: false});
	compressedSizeCounter.on("end", function () {
		entry.crc32 = crc32Watcher.crc32;
		if (entry.uncompressedSize == null) {
			entry.uncompressedSize = uncompressedSizeCounter.byteCount;
		} else {
			if (entry.uncompressedSize !== uncompressedSizeCounter.byteCount) return self.emit("error", new Error("file data stream has unexpected number of bytes"));
		}
		entry.compressedSize = compressedSizeCounter.byteCount;
		self.outputStreamCursor += entry.compressedSize;
		writeToOutputStream(self, entry.getDataDescriptor());
		entry.state = Entry.FILE_DATA_DONE;
		pumpEntries(self);
	});
}

function pumpEntries(self) {
	if (self.allDone) return;
	// first check if finalSize is finally known
	if (self.ended && self.finalSizeCallback != null) {
		var finalSize = calculateFinalSize(self);
		if (finalSize != null) {
			// we have an answer
			self.finalSizeCallback(finalSize);
			self.finalSizeCallback = null;
		}
	}

	// pump entries
	var entry = getFirstNotDoneEntry();

	function getFirstNotDoneEntry() {
		for (var i = 0; i < self.entries.length; i++) {
			var entry = self.entries[i];
			if (entry.state < Entry.FILE_DATA_DONE) return entry;
		}
		return null;
	}

	if (entry != null) {
		// this entry is not done yet
		if (entry.state < Entry.READY_TO_PUMP_FILE_DATA) return; // input file not open yet
		if (entry.state === Entry.FILE_DATA_IN_PROGRESS) return; // we'll get there
		// start with local file header
		entry.relativeOffsetOfLocalHeader = self.outputStreamCursor;
		var localFileHeader = entry.getLocalFileHeader();
		writeToOutputStream(self, localFileHeader);
		entry.doFileDataPump();
	} else {
		// all cought up on writing entries
		if (self.ended) {
			// head for the exit
			self.offsetOfStartOfCentralDirectory = self.outputStreamCursor;
			self.entries.forEach(function (entry) {
				var centralDirectoryRecord = entry.getCentralDirectoryRecord();
				writeToOutputStream(self, centralDirectoryRecord);
			});
			writeToOutputStream(self, getEndOfCentralDirectoryRecord(self));
			self.outputStream.end();
			self.allDone = true;
		}
	}
}

function calculateFinalSize(self) {
	var pretendOutputCursor = 0;
	var centralDirectorySize = 0;
	for (var i = 0; i < self.entries.length; i++) {
		var entry = self.entries[i];
		// compression is too hard to predict
		if (entry.compress) return -1;
		if (entry.state >= Entry.READY_TO_PUMP_FILE_DATA) {
			// if addReadStream was called without providing the size, we can't predict the final size
			if (entry.uncompressedSize == null) return -1;
		} else {
			// if we're still waiting for fs.stat, we might learn the size someday
			if (entry.uncompressedSize == null) return null;
		}
		// we know this for sure, and this is important to know if we need ZIP64 format.
		entry.relativeOffsetOfLocalHeader = pretendOutputCursor;
		var useZip64Format = entry.useZip64Format();

		pretendOutputCursor += LOCAL_FILE_HEADER_FIXED_SIZE + entry.utf8FileName.length;
		pretendOutputCursor += entry.uncompressedSize;
		if (!entry.crcAndFileSizeKnown) {
			// use a data descriptor
			if (useZip64Format) {
				pretendOutputCursor += ZIP64_DATA_DESCRIPTOR_SIZE;
			} else {
				pretendOutputCursor += DATA_DESCRIPTOR_SIZE;
			}
		}

		centralDirectorySize += CENTRAL_DIRECTORY_RECORD_FIXED_SIZE + entry.utf8FileName.length;
		if (useZip64Format) {
			centralDirectorySize += ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE;
		}
	}

	var endOfCentralDirectorySize = 0;
	if (self.forceZip64Eocd ||
		self.entries.length >= 0xffff ||
		centralDirectorySize >= 0xffff ||
		pretendOutputCursor >= 0xffffffff) {
		// use zip64 end of central directory stuff
		endOfCentralDirectorySize += ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE + ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE;
	}
	endOfCentralDirectorySize += END_OF_CENTRAL_DIRECTORY_RECORD_SIZE;
	return pretendOutputCursor + centralDirectorySize + endOfCentralDirectorySize;
}

var ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE = 56;
var ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE = 20;
var END_OF_CENTRAL_DIRECTORY_RECORD_SIZE = 22;

function getEndOfCentralDirectoryRecord(self, actuallyJustTellMeHowLongItWouldBe) {
	var needZip64Format = false;
	var normalEntriesLength = self.entries.length;
	if (self.forceZip64Eocd || self.entries.length >= 0xffff) {
		normalEntriesLength = 0xffff;
		needZip64Format = true;
	}
	var sizeOfCentralDirectory = self.outputStreamCursor - self.offsetOfStartOfCentralDirectory;
	var normalSizeOfCentralDirectory = sizeOfCentralDirectory;
	if (self.forceZip64Eocd || sizeOfCentralDirectory >= 0xffffffff) {
		normalSizeOfCentralDirectory = 0xffffffff;
		needZip64Format = true;
	}
	var normalOffsetOfStartOfCentralDirectory = self.offsetOfStartOfCentralDirectory;
	if (self.forceZip64Eocd || self.offsetOfStartOfCentralDirectory >= 0xffffffff) {
		normalOffsetOfStartOfCentralDirectory = 0xffffffff;
		needZip64Format = true;
	}
	if (actuallyJustTellMeHowLongItWouldBe) {
		if (needZip64Format) {
			return (
				ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE +
				ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE +
				END_OF_CENTRAL_DIRECTORY_RECORD_SIZE
			);
		} else {
			return END_OF_CENTRAL_DIRECTORY_RECORD_SIZE;
		}
	}

	var eocdrBuffer = new Buffer(END_OF_CENTRAL_DIRECTORY_RECORD_SIZE);
	// end of central dir signature                       4 bytes  (0x06054b50)
	eocdrBuffer.writeUInt32LE(0x06054b50, 0);
	// number of this disk                                2 bytes
	eocdrBuffer.writeUInt16LE(0, 4);
	// number of the disk with the start of the central directory  2 bytes
	eocdrBuffer.writeUInt16LE(0, 6);
	// total number of entries in the central directory on this disk  2 bytes
	eocdrBuffer.writeUInt16LE(normalEntriesLength, 8);
	// total number of entries in the central directory   2 bytes
	eocdrBuffer.writeUInt16LE(normalEntriesLength, 10);
	// size of the central directory                      4 bytes
	eocdrBuffer.writeUInt32LE(normalSizeOfCentralDirectory, 12);
	// offset of start of central directory with respect to the starting disk number  4 bytes
	eocdrBuffer.writeUInt32LE(normalOffsetOfStartOfCentralDirectory, 16);
	// .ZIP file comment length                           2 bytes
	eocdrBuffer.writeUInt16LE(0, 20);
	// .ZIP file comment                                  (variable size)
	// no comment

	if (!needZip64Format) return eocdrBuffer;

	// ZIP64 format
	// ZIP64 End of Central Directory Record
	var zip64EocdrBuffer = new Buffer(ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE);
	// zip64 end of central dir signature                                             4 bytes  (0x06064b50)
	zip64EocdrBuffer.writeUInt32LE(0x06064b50, 0);
	// size of zip64 end of central directory record                                  8 bytes
	writeUInt64LE(zip64EocdrBuffer, ZIP64_END_OF_CENTRAL_DIRECTORY_RECORD_SIZE - 12, 4);
	// version made by                                                                2 bytes
	zip64EocdrBuffer.writeUInt16LE(VERSION_MADE_BY, 12);
	// version needed to extract                                                      2 bytes
	zip64EocdrBuffer.writeUInt16LE(VERSION_NEEDED_TO_EXTRACT_ZIP64, 14);
	// number of this disk                                                            4 bytes
	zip64EocdrBuffer.writeUInt32LE(0, 16);
	// number of the disk with the start of the central directory                     4 bytes
	zip64EocdrBuffer.writeUInt32LE(0, 20);
	// total number of entries in the central directory on this disk                  8 bytes
	writeUInt64LE(zip64EocdrBuffer, self.entries.length, 24);
	// total number of entries in the central directory                               8 bytes
	writeUInt64LE(zip64EocdrBuffer, self.entries.length, 32);
	// size of the central directory                                                  8 bytes
	writeUInt64LE(zip64EocdrBuffer, sizeOfCentralDirectory, 40);
	// offset of start of central directory with respect to the starting disk number  8 bytes
	writeUInt64LE(zip64EocdrBuffer, self.offsetOfStartOfCentralDirectory, 48);
	// zip64 extensible data sector                                                   (variable size)
	// nothing in the zip64 extensible data sector


	// ZIP64 End of Central Directory Locator
	var zip64EocdlBuffer = new Buffer(ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE);
	// zip64 end of central dir locator signature                               4 bytes  (0x07064b50)
	zip64EocdlBuffer.writeUInt32LE(0x07064b50, 0);
	// number of the disk with the start of the zip64 end of central directory  4 bytes
	zip64EocdlBuffer.writeUInt32LE(0, 4);
	// relative offset of the zip64 end of central directory record             8 bytes
	writeUInt64LE(zip64EocdlBuffer, self.outputStreamCursor, 8);
	// total number of disks                                                    4 bytes
	zip64EocdlBuffer.writeUInt32LE(1, 16);


	return Buffer.concat([
		zip64EocdrBuffer,
		zip64EocdlBuffer,
		eocdrBuffer,
	]);
}

function validateMetadataPath(metadataPath, isDirectory) {
	if (metadataPath === "") throw new Error("empty metadataPath");
	metadataPath = metadataPath.replace(/\\/g, "/");
	if (/^[a-zA-Z]:/.test(metadataPath) || /^\//.test(metadataPath)) throw new Error("absolute path: " + metadataPath);
	if (metadataPath.split("/").indexOf("..") !== -1) throw new Error("invalid relative path: " + metadataPath);
	var looksLikeDirectory = /\/$/.test(metadataPath);
	if (isDirectory) {
		// append a trailing '/' if necessary.
		if (!looksLikeDirectory) metadataPath += "/";
	} else {
		if (looksLikeDirectory) throw new Error("file path cannot end with '/': " + metadataPath);
	}
	return metadataPath;
}

var defaultFileMode = parseInt("0100664", 8);
var defaultDirectoryMode = parseInt("040775", 8);

// this class is not part of the public API
function Entry(metadataPath, isDirectory, options) {
	this.utf8FileName = new Buffer(metadataPath);
	if (this.utf8FileName.length > 0xffff) throw new Error("utf8 file name too long. " + utf8FileName.length + " > " + 0xffff);
	this.isDirectory = isDirectory;
	this.state = Entry.WAITING_FOR_METADATA;
	this.setLastModDate(options.mtime != null ? options.mtime : new Date());
	if (options.mode != null) {
		this.setFileAttributesMode(options.mode);
	} else {
		this.setFileAttributesMode(isDirectory ? defaultDirectoryMode : defaultFileMode);
	}
	if (isDirectory) {
		this.crcAndFileSizeKnown = true;
		this.crc32 = 0;
		this.uncompressedSize = 0;
		this.compressedSize = 0;
	} else {
		// unknown so far
		this.crcAndFileSizeKnown = false;
		this.crc32 = null;
		this.uncompressedSize = null;
		this.compressedSize = null;
		if (options.size != null) this.uncompressedSize = options.size;
	}
	if (isDirectory) {
		this.compress = false;
	} else {
		this.compress = true; // default
		if (options.compress != null) this.compress = !!options.compress;
	}
	this.forceZip64Format = !!options.forceZip64Format;
}

Entry.WAITING_FOR_METADATA = 0;
Entry.READY_TO_PUMP_FILE_DATA = 1;
Entry.FILE_DATA_IN_PROGRESS = 2;
Entry.FILE_DATA_DONE = 3;
Entry.prototype.setLastModDate = function (date) {
	var dosDateTime = dateToDosDateTime(date);
	this.lastModFileTime = dosDateTime.time;
	this.lastModFileDate = dosDateTime.date;
};
Entry.prototype.setFileAttributesMode = function (mode) {
	if ((mode & 0xffff) !== mode) throw new Error("invalid mode. expected: 0 <= " + mode + " <= " + 0xffff);
	// http://unix.stackexchange.com/questions/14705/the-zip-formats-external-file-attribute/14727#14727
	this.externalFileAttributes = (mode << 16) >>> 0;
};
// doFileDataPump() should not call pumpEntries() directly. see issue #9.
Entry.prototype.setFileDataPumpFunction = function (doFileDataPump) {
	this.doFileDataPump = doFileDataPump;
	this.state = Entry.READY_TO_PUMP_FILE_DATA;
};
Entry.prototype.useZip64Format = function () {
	return (
		(this.forceZip64Format) ||
		(this.uncompressedSize != null && this.uncompressedSize > 0xfffffffe) ||
		(this.compressedSize != null && this.compressedSize > 0xfffffffe) ||
		(this.relativeOffsetOfLocalHeader != null && this.relativeOffsetOfLocalHeader > 0xfffffffe)
	);
}
var LOCAL_FILE_HEADER_FIXED_SIZE = 30;
var VERSION_NEEDED_TO_EXTRACT_UTF8 = 20;
var VERSION_NEEDED_TO_EXTRACT_ZIP64 = 45;
// 3 = unix. 63 = spec version 6.3
var VERSION_MADE_BY = (3 << 8) | 63;
var FILE_NAME_IS_UTF8 = 1 << 11;
var UNKNOWN_CRC32_AND_FILE_SIZES = 1 << 3;
Entry.prototype.getLocalFileHeader = function () {
	var crc32 = 0;
	var compressedSize = 0;
	var uncompressedSize = 0;
	if (this.crcAndFileSizeKnown) {
		crc32 = this.crc32;
		compressedSize = this.compressedSize;
		uncompressedSize = this.uncompressedSize;
	}

	var fixedSizeStuff = new Buffer(LOCAL_FILE_HEADER_FIXED_SIZE);
	var generalPurposeBitFlag = FILE_NAME_IS_UTF8;
	if (!this.crcAndFileSizeKnown) generalPurposeBitFlag |= UNKNOWN_CRC32_AND_FILE_SIZES;

	// local file header signature     4 bytes  (0x04034b50)
	fixedSizeStuff.writeUInt32LE(0x04034b50, 0);
	// version needed to extract       2 bytes
	fixedSizeStuff.writeUInt16LE(VERSION_NEEDED_TO_EXTRACT_UTF8, 4);
	// general purpose bit flag        2 bytes
	fixedSizeStuff.writeUInt16LE(generalPurposeBitFlag, 6);
	// compression method              2 bytes
	fixedSizeStuff.writeUInt16LE(this.getCompressionMethod(), 8);
	// last mod file time              2 bytes
	fixedSizeStuff.writeUInt16LE(this.lastModFileTime, 10);
	// last mod file date              2 bytes
	fixedSizeStuff.writeUInt16LE(this.lastModFileDate, 12);
	// crc-32                          4 bytes
	fixedSizeStuff.writeUInt32LE(crc32, 14);
	// compressed size                 4 bytes
	fixedSizeStuff.writeUInt32LE(compressedSize, 18);
	// uncompressed size               4 bytes
	fixedSizeStuff.writeUInt32LE(uncompressedSize, 22);
	// file name length                2 bytes
	fixedSizeStuff.writeUInt16LE(this.utf8FileName.length, 26);
	// extra field length              2 bytes
	fixedSizeStuff.writeUInt16LE(0, 28);
	return Buffer.concat([
		fixedSizeStuff,
		// file name (variable size)
		this.utf8FileName,
		// extra field (variable size)
		// no extra fields
	]);
};
var DATA_DESCRIPTOR_SIZE = 16;
var ZIP64_DATA_DESCRIPTOR_SIZE = 24;
Entry.prototype.getDataDescriptor = function () {
	if (this.crcAndFileSizeKnown) {
		// the Mac Archive Utility requires this not be present unless we set general purpose bit 3
		return new Buffer(0);
	}
	if (!this.useZip64Format()) {
		var buffer = new Buffer(DATA_DESCRIPTOR_SIZE);
		// optional signature (required according to Archive Utility)
		buffer.writeUInt32LE(0x08074b50, 0);
		// crc-32                          4 bytes
		buffer.writeUInt32LE(this.crc32, 4);
		// compressed size                 4 bytes
		buffer.writeUInt32LE(this.compressedSize, 8);
		// uncompressed size               4 bytes
		buffer.writeUInt32LE(this.uncompressedSize, 12);
		return buffer;
	} else {
		// ZIP64 format
		var buffer = new Buffer(ZIP64_DATA_DESCRIPTOR_SIZE);
		// optional signature (unknown if anyone cares about this)
		buffer.writeUInt32LE(0x08074b50, 0);
		// crc-32                          4 bytes
		buffer.writeUInt32LE(this.crc32, 4);
		// compressed size                 8 bytes
		writeUInt64LE(buffer, this.compressedSize, 8);
		// uncompressed size               8 bytes
		writeUInt64LE(buffer, this.uncompressedSize, 16);
		return buffer;
	}
};
var CENTRAL_DIRECTORY_RECORD_FIXED_SIZE = 46;
var ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE = 28;
Entry.prototype.getCentralDirectoryRecord = function () {
	var fixedSizeStuff = new Buffer(CENTRAL_DIRECTORY_RECORD_FIXED_SIZE);
	var generalPurposeBitFlag = FILE_NAME_IS_UTF8;
	if (!this.crcAndFileSizeKnown) generalPurposeBitFlag |= UNKNOWN_CRC32_AND_FILE_SIZES;

	var normalCompressedSize = this.compressedSize;
	var normalUncompressedSize = this.uncompressedSize;
	var normalRelativeOffsetOfLocalHeader = this.relativeOffsetOfLocalHeader;
	var versionNeededToExtract;
	var zeiefBuffer;
	if (this.useZip64Format()) {
		normalCompressedSize = 0xffffffff;
		normalUncompressedSize = 0xffffffff;
		normalRelativeOffsetOfLocalHeader = 0xffffffff;
		versionNeededToExtract = VERSION_NEEDED_TO_EXTRACT_ZIP64;

		// ZIP64 extended information extra field
		zeiefBuffer = new Buffer(ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE);
		// 0x0001                  2 bytes    Tag for this "extra" block type
		zeiefBuffer.writeUInt16LE(0x0001, 0);
		// Size                    2 bytes    Size of this "extra" block
		zeiefBuffer.writeUInt16LE(ZIP64_EXTENDED_INFORMATION_EXTRA_FIELD_SIZE - 4, 2);
		// Original Size           8 bytes    Original uncompressed file size
		writeUInt64LE(zeiefBuffer, this.uncompressedSize, 4);
		// Compressed Size         8 bytes    Size of compressed data
		writeUInt64LE(zeiefBuffer, this.compressedSize, 12);
		// Relative Header Offset  8 bytes    Offset of local header record
		writeUInt64LE(zeiefBuffer, this.relativeOffsetOfLocalHeader, 20);
		// Disk Start Number       4 bytes    Number of the disk on which this file starts
		// (omit)
	} else {
		versionNeededToExtract = VERSION_NEEDED_TO_EXTRACT_UTF8;
		zeiefBuffer = new Buffer(0);
	}

	// central file header signature   4 bytes  (0x02014b50)
	fixedSizeStuff.writeUInt32LE(0x02014b50, 0);
	// version made by                 2 bytes
	fixedSizeStuff.writeUInt16LE(VERSION_MADE_BY, 4);
	// version needed to extract       2 bytes
	fixedSizeStuff.writeUInt16LE(versionNeededToExtract, 6);
	// general purpose bit flag        2 bytes
	fixedSizeStuff.writeUInt16LE(generalPurposeBitFlag, 8);
	// compression method              2 bytes
	fixedSizeStuff.writeUInt16LE(this.getCompressionMethod(), 10);
	// last mod file time              2 bytes
	fixedSizeStuff.writeUInt16LE(this.lastModFileTime, 12);
	// last mod file date              2 bytes
	fixedSizeStuff.writeUInt16LE(this.lastModFileDate, 14);
	// crc-32                          4 bytes
	fixedSizeStuff.writeUInt32LE(this.crc32, 16);
	// compressed size                 4 bytes
	fixedSizeStuff.writeUInt32LE(normalCompressedSize, 20);
	// uncompressed size               4 bytes
	fixedSizeStuff.writeUInt32LE(normalUncompressedSize, 24);
	// file name length                2 bytes
	fixedSizeStuff.writeUInt16LE(this.utf8FileName.length, 28);
	// extra field length              2 bytes
	fixedSizeStuff.writeUInt16LE(zeiefBuffer.length, 30);
	// file comment length             2 bytes
	fixedSizeStuff.writeUInt16LE(0, 32);
	// disk number start               2 bytes
	fixedSizeStuff.writeUInt16LE(0, 34);
	// internal file attributes        2 bytes
	fixedSizeStuff.writeUInt16LE(0, 36);
	// external file attributes        4 bytes
	fixedSizeStuff.writeUInt32LE(this.externalFileAttributes, 38);
	// relative offset of local header 4 bytes
	fixedSizeStuff.writeUInt32LE(normalRelativeOffsetOfLocalHeader, 42);

	return Buffer.concat([
		fixedSizeStuff,
		// file name (variable size)
		this.utf8FileName,
		// extra field (variable size)
		zeiefBuffer,
		// file comment (variable size)
		// empty comment
	]);
};
Entry.prototype.getCompressionMethod = function () {
	var NO_COMPRESSION = 0;
	var DEFLATE_COMPRESSION = 8;
	return this.compress ? DEFLATE_COMPRESSION : NO_COMPRESSION;
};

function dateToDosDateTime(jsDate) {
	var date = 0;
	date |= jsDate.getDate() & 0x1f; // 1-31
	date |= ((jsDate.getMonth() + 1) & 0xf) << 5; // 0-11, 1-12
	date |= ((jsDate.getFullYear() - 1980) & 0x7f) << 9; // 0-128, 1980-2108

	var time = 0;
	time |= Math.floor(jsDate.getSeconds() / 2); // 0-59, 0-29 (lose odd numbers)
	time |= (jsDate.getMinutes() & 0x3f) << 5; // 0-59
	time |= (jsDate.getHours() & 0x1f) << 11; // 0-23

	return {date: date, time: time};
}

function writeUInt64LE(buffer, n, offset) {
	// can't use bitshift here, because JavaScript only allows bitshiting on 32-bit integers.
	var high = Math.floor(n / 0x100000000);
	var low = n % 0x100000000;
	buffer.writeUInt32LE(low, offset);
	buffer.writeUInt32LE(high, offset + 4);
}

function defaultCallback(err) {
	if (err) throw err;
}

util.inherits(ByteCounter, Transform);

function ByteCounter(options) {
	Transform.call(this, options);
	this.byteCount = 0;
}

ByteCounter.prototype._transform = function (chunk, encoding, cb) {
	this.byteCount += chunk.length;
	cb(null, chunk);
};

util.inherits(Crc32Watcher, Transform);

function Crc32Watcher(options) {
	Transform.call(this, options);
	this.crc32 = 0;
}

Crc32Watcher.prototype._transform = function (chunk, encoding, cb) {
	this.crc32 = crc32.unsigned(chunk, this.crc32);
	cb(null, chunk);
};
}).call(this,require("buffer").Buffer,require("timers").setImmediate)

},{"buffer":false,"buffer-crc32":"buffer-crc32","events":false,"fs":false,"stream":false,"timers":false,"util":false,"zlib":false}]},{},["/opt/privatesky/builds/tmp/virtualMQ_intermediar.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZHMvdG1wL3ZpcnR1YWxNUV9pbnRlcm1lZGlhci5qcyIsIm1vZHVsZXMvZWRmcy9mbG93cy9Ccmlja3NNYW5hZ2VyLmpzIiwibW9kdWxlcy9lZGZzL2xpYi9FREZTTWlkZGxld2FyZS5qcyIsIm1vZHVsZXMvZm9sZGVybXEvbGliL2ZvbGRlck1RLmpzIiwibW9kdWxlcy9ub2RlLWZkLXNsaWNlci9tb2R1bGVzL25vZGUtcGVuZC9pbmRleC5qcyIsIm1vZHVsZXMvcHNrLWh0dHAtY2xpZW50L2xpYi9wc2stYWJzdHJhY3QtY2xpZW50LmpzIiwibW9kdWxlcy9wc2staHR0cC1jbGllbnQvbGliL3Bzay1icm93c2VyLWNsaWVudC5qcyIsIm1vZHVsZXMvcHNrLWh0dHAtY2xpZW50L2xpYi9wc2stbm9kZS1jbGllbnQuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9CbG9ja2NoYWluLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvRm9sZGVyUGVyc2lzdGVudFBEUy5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL0luTWVtb3J5UERTLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvUGVyc2lzdGVudFBEUy5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9BQ0xTY29wZS5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9BZ2VudC5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9CYWNrdXAuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vQ1NCTWV0YS5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9DU0JSZWZlcmVuY2UuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vRG9tYWluUmVmZXJlbmNlLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvZG9tYWluL0VtYmVkZGVkRmlsZS5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9GaWxlUmVmZXJlbmNlLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvZG9tYWluL0tleS5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9pbmRleC5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi90cmFuc2FjdGlvbnMuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9zd2FybXMvYWdlbnRzU3dhcm0uanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9zd2FybXMvZG9tYWluU3dhcm1zLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvc3dhcm1zL2luZGV4LmpzIiwibW9kdWxlcy9wc2tkYi9saWIvc3dhcm1zL3NoYXJlZFBoYXNlcy5qcyIsIm1vZHVsZXMvc2lnbnNlbnN1cy9saWIvY29uc1V0aWwuanMiLCJtb2R1bGVzL3ZpcnR1YWxtcS9WaXJ0dWFsTVEuanMiLCJtb2R1bGVzL3ZpcnR1YWxtcS9maWxlTWFuYWdlci5qcyIsIm1vZHVsZXMvdmlydHVhbG1xL2Zsb3dzL0NTQm1hbmFnZXIuanMiLCJtb2R1bGVzL3ZpcnR1YWxtcS9mbG93cy9yZW1vdGVTd2FybWluZy5qcyIsIm1vZHVsZXMvdmlydHVhbG1xL2xpYnMvVG9rZW5CdWNrZXQuanMiLCJtb2R1bGVzL3ZpcnR1YWxtcS9saWJzL2h0dHAtd3JhcHBlci9zcmMvY2xhc3Nlcy9DbGllbnQuanMiLCJtb2R1bGVzL3ZpcnR1YWxtcS9saWJzL2h0dHAtd3JhcHBlci9zcmMvY2xhc3Nlcy9NaWRkbGV3YXJlLmpzIiwibW9kdWxlcy92aXJ0dWFsbXEvbGlicy9odHRwLXdyYXBwZXIvc3JjL2NsYXNzZXMvUm91dGVyLmpzIiwibW9kdWxlcy92aXJ0dWFsbXEvbGlicy9odHRwLXdyYXBwZXIvc3JjL2NsYXNzZXMvU2VydmVyLmpzIiwibW9kdWxlcy92aXJ0dWFsbXEvbGlicy9odHRwLXdyYXBwZXIvc3JjL2h0dHBVdGlscy5qcyIsIm1vZHVsZXMvdmlydHVhbG1xL2xpYnMvaHR0cC13cmFwcGVyL3NyYy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJtb2R1bGVzL2J1ZmZlci1jcmMzMi9pbmRleC5qcyIsIm1vZHVsZXMvZWRmcy9pbmRleC5qcyIsIm1vZHVsZXMvZm9sZGVybXEvaW5kZXguanMiLCJtb2R1bGVzL25vZGUtZmQtc2xpY2VyL2luZGV4LmpzIiwibW9kdWxlcy9wc2staHR0cC1jbGllbnQvaW5kZXguanMiLCJtb2R1bGVzL3Bza2RiL2luZGV4LmpzIiwibW9kdWxlcy9zaWduc2Vuc3VzL2xpYi9pbmRleC5qcyIsIm1vZHVsZXMvdmlydHVhbG1xL2luZGV4LmpzIiwibW9kdWxlcy95YXV6bC9pbmRleC5qcyIsIm1vZHVsZXMveWF6bC9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdlhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzlKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3p5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImdsb2JhbC52aXJ0dWFsTVFMb2FkTW9kdWxlcyA9IGZ1bmN0aW9uKCl7IFxuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1widmlydHVhbG1xXCJdID0gcmVxdWlyZShcInZpcnR1YWxtcVwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcImZvbGRlcm1xXCJdID0gcmVxdWlyZShcImZvbGRlcm1xXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wieWF6bFwiXSA9IHJlcXVpcmUoXCJ5YXpsXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wieWF1emxcIl0gPSByZXF1aXJlKFwieWF1emxcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJidWZmZXItY3JjMzJcIl0gPSByZXF1aXJlKFwiYnVmZmVyLWNyYzMyXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wibm9kZS1mZC1zbGljZXJcIl0gPSByZXF1aXJlKFwibm9kZS1mZC1zbGljZXJcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJlZGZzXCJdID0gcmVxdWlyZShcImVkZnNcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJwc2tkYlwiXSA9IHJlcXVpcmUoXCJwc2tkYlwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInBzay1odHRwLWNsaWVudFwiXSA9IHJlcXVpcmUoXCJwc2staHR0cC1jbGllbnRcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJzaWduc2Vuc3VzXCJdID0gcmVxdWlyZShcInNpZ25zZW5zdXNcIik7XG59XG5pZiAoZmFsc2UpIHtcblx0dmlydHVhbE1RTG9hZE1vZHVsZXMoKTtcbn07IFxuZ2xvYmFsLnZpcnR1YWxNUVJlcXVpcmUgPSByZXF1aXJlO1xuaWYgKHR5cGVvZiAkJCAhPT0gXCJ1bmRlZmluZWRcIikgeyAgICAgICAgICAgIFxuICAgICQkLnJlcXVpcmVCdW5kbGUoXCJ2aXJ0dWFsTVFcIik7XG59OyIsImNvbnN0IHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcbmNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xuY29uc3QgUHNrSGFzaCA9IHJlcXVpcmUoJ3Bza2NyeXB0bycpLlBza0hhc2g7XG5cbmNvbnN0IGZvbGRlck5hbWVTaXplID0gcHJvY2Vzcy5lbnYuRk9MREVSX05BTUVfU0laRSB8fCA1O1xuY29uc3QgRklMRV9TRVBBUkFUT1IgPSAnLSc7XG5sZXQgcm9vdGZvbGRlcjtcblxuJCQuZmxvdy5kZXNjcmliZShcIkJyaWNrc01hbmFnZXJcIiwge1xuICAgIGluaXQ6IGZ1bmN0aW9uIChyb290Rm9sZGVyLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXJvb3RGb2xkZXIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIk5vIHJvb3QgZm9sZGVyIHNwZWNpZmllZCFcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJvb3RGb2xkZXIgPSBwYXRoLnJlc29sdmUocm9vdEZvbGRlcik7XG4gICAgICAgIHRoaXMuX19lbnN1cmVGb2xkZXJTdHJ1Y3R1cmUocm9vdEZvbGRlciwgZnVuY3Rpb24gKGVyciwgcGF0aCkge1xuICAgICAgICAgICAgcm9vdGZvbGRlciA9IHJvb3RGb2xkZXI7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJvb3RGb2xkZXIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHdyaXRlOiBmdW5jdGlvbiAoZmlsZU5hbWUsIHJlYWRGaWxlU3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlYWRGaWxlU3RyZWFtIHx8ICFyZWFkRmlsZVN0cmVhbS5waXBlIHx8IHR5cGVvZiByZWFkRmlsZVN0cmVhbS5waXBlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIlNvbWV0aGluZyB3cm9uZyBoYXBwZW5lZFwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJOYW1lID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSkpO1xuXG4gICAgICAgIGNvbnN0IHNlcmlhbCA9IHRoaXMuc2VyaWFsKCgpID0+IHtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VyaWFsLl9fZW5zdXJlRm9sZGVyU3RydWN0dXJlKGZvbGRlck5hbWUsIHNlcmlhbC5fX3Byb2dyZXNzKTtcbiAgICAgICAgc2VyaWFsLl9fd3JpdGVGaWxlKHJlYWRGaWxlU3RyZWFtLCBmb2xkZXJOYW1lLCBmaWxlTmFtZSwgY2FsbGJhY2spO1xuICAgIH0sXG4gICAgcmVhZDogZnVuY3Rpb24gKGZpbGVOYW1lLCB3cml0ZUZpbGVTdHJlYW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5fX3ZlcmlmeUZpbGVOYW1lKGZpbGVOYW1lLCBjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZvbGRlclBhdGggPSBwYXRoLmpvaW4ocm9vdGZvbGRlciwgZmlsZU5hbWUuc3Vic3RyKDAsIGZvbGRlck5hbWVTaXplKSk7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZvbGRlclBhdGgsIGZpbGVOYW1lKTtcbiAgICAgICAgdGhpcy5fX3ZlcmlmeUZpbGVFeGlzdGVuY2UoZmlsZVBhdGgsIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmVhZEZpbGUod3JpdGVGaWxlU3RyZWFtLCBmaWxlUGF0aCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJObyBmaWxlIGZvdW5kLlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgYWRkQWxpYXM6IGZ1bmN0aW9uIChmaWxlbmFtZSwgYWxpYXMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5fX3ZlcmlmeUZpbGVOYW1lKGZpbGVOYW1lLCBjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYWxpYXMpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJObyBhbGlhcyB3YXMgcHJvdmlkZWRcIikpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmFsaWFzZXMpIHtcbiAgICAgICAgICAgIHRoaXMuYWxpYXNlcyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hbGlhc2VzW2FsaWFzXSA9IGZpbGVuYW1lO1xuXG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfSxcbiAgICB3cml0ZVdpdGhBbGlhczogZnVuY3Rpb24gKGFsaWFzLCByZWFkU3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHRoaXMuX19nZXRGaWxlTmFtZShhbGlhcywgY2FsbGJhY2spO1xuICAgICAgICB0aGlzLndyaXRlKGZpbGVOYW1lLCByZWFkU3RyZWFtLCBjYWxsYmFjayk7XG4gICAgfSxcbiAgICByZWFkV2l0aEFsaWFzOiBmdW5jdGlvbiAoYWxpYXMsIHdyaXRlU3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHRoaXMuX19nZXRGaWxlTmFtZShhbGlhcywgY2FsbGJhY2spO1xuICAgICAgICB0aGlzLnJlYWQoZmlsZU5hbWUsIHdyaXRlU3RyZWFtLCBjYWxsYmFjayk7XG4gICAgfSxcbiAgICByZWFkVmVyc2lvbjogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVmVyc2lvbiwgd3JpdGVGaWxlU3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSkpO1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmb2xkZXJQYXRoLCBmaWxlTmFtZSwgZmlsZVZlcnNpb24pO1xuICAgICAgICB0aGlzLl9fdmVyaWZ5RmlsZUV4aXN0ZW5jZShmaWxlUGF0aCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuX19yZWFkRmlsZSh3cml0ZUZpbGVTdHJlYW0sIHBhdGguam9pbihmaWxlUGF0aCksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gZmlsZSBmb3VuZC5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldFZlcnNpb25zRm9yRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSksIGZpbGVOYW1lKTtcbiAgICAgICAgZnMucmVhZGRpcihmb2xkZXJQYXRoLCAoZXJyLCBmaWxlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0b3RhbE51bWJlck9mRmlsZXMgPSBmaWxlcy5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBmaWxlc0RhdGEgPSBbXTtcblxuICAgICAgICAgICAgbGV0IHJlc29sdmVkRmlsZXMgPSAwO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsTnVtYmVyT2ZGaWxlczsgKytpKSB7XG4gICAgICAgICAgICAgICAgZnMuc3RhdChwYXRoLmpvaW4oZm9sZGVyUGF0aCwgZmlsZXNbaV0pLCAoZXJyLCBzdGF0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlc0RhdGEucHVzaCh7dmVyc2lvbjogZmlsZXNbaV0sIGNyZWF0aW9uVGltZTogbnVsbCwgY3JlYXRpb25UaW1lTXM6IG51bGx9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzRGF0YS5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGZpbGVzW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25UaW1lOiBzdGF0cy5iaXJ0aHRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGlvblRpbWVNczogc3RhdHMuYmlydGh0aW1lTXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRGaWxlcyArPSAxO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZEZpbGVzID49IHRvdGFsTnVtYmVyT2ZGaWxlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXNEYXRhLnNvcnQoKGZpcnN0LCBzZWNvbmQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaXJzdENvbXBhcmVEYXRhID0gZmlyc3QuY3JlYXRpb25UaW1lTXMgfHwgZmlyc3QudmVyc2lvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWNvbmRDb21wYXJlRGF0YSA9IHNlY29uZC5jcmVhdGlvblRpbWVNcyB8fCBzZWNvbmQudmVyc2lvbjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdENvbXBhcmVEYXRhIC0gc2Vjb25kQ29tcGFyZURhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgZmlsZXNEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGNvbXBhcmVWZXJzaW9uczogZnVuY3Rpb24gKGJvZHlTdHJlYW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGxldCBib2R5ID0gJyc7XG5cbiAgICAgICAgYm9keVN0cmVhbS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICBib2R5ICs9IGRhdGE7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJvZHlTdHJlYW0ub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fX2NvbXBhcmVWZXJzaW9ucyhib2R5LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgX192ZXJpZnlGaWxlTmFtZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIWZpbGVOYW1lIHx8IHR5cGVvZiBmaWxlTmFtZSAhPSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJObyBmaWxlSWQgc3BlY2lmaWVkLlwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlsZU5hbWUubGVuZ3RoIDwgZm9sZGVyTmFtZVNpemUpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIkZpbGVJZCB0b28gc21hbGwuIFwiICsgZmlsZU5hbWUpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG4gICAgX19lbnN1cmVGb2xkZXJTdHJ1Y3R1cmU6IGZ1bmN0aW9uIChmb2xkZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIGZzLm1rZGlyKGZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIGNhbGxiYWNrKTtcbiAgICB9LFxuICAgIF9fd3JpdGVGaWxlOiBmdW5jdGlvbiAocmVhZFN0cmVhbSwgZm9sZGVyUGF0aCwgZmlsZU5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGhhc2ggPSByZXF1aXJlKFwiY3J5cHRvXCIpLmNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZvbGRlclBhdGgsIGZpbGVOYW1lKTtcbiAgICAgICAgZnMuYWNjZXNzKGZpbGVQYXRoLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVhZFN0cmVhbS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGhhc2gudXBkYXRlKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgd3JpdGVTdHJlYW0gPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaWxlUGF0aCwge21vZGU6IDBvNDQ0fSk7XG5cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmVhbS5vbihcImZpbmlzaFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhhc2hEaWdlc3QgPSBoYXNoLmRpZ2VzdChcImhleFwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc2hEaWdlc3QgIT09IGZpbGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcy51bmxpbmsoZmlsZVBhdGgsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJDb250ZW50IGhhc2ggYW5kIGZpbGVuYW1lIGFyZSBub3QgdGhlIHNhbWVcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVhZFN0cmVhbS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayguLi5hcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVhZFN0cmVhbS5waXBlKHdyaXRlU3RyZWFtKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIF9fZ2V0TmV4dFZlcnNpb25GaWxlTmFtZTogZnVuY3Rpb24gKGZvbGRlclBhdGgsIGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9fZ2V0TGF0ZXN0VmVyc2lvbk5hbWVPZkZpbGUoZm9sZGVyUGF0aCwgKGVyciwgZmlsZVZlcnNpb24pID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgZmlsZVZlcnNpb24ubnVtZXJpY1ZlcnNpb24gKyAxKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICxcbiAgICBfX2dldExhdGVzdFZlcnNpb25OYW1lT2ZGaWxlOiBmdW5jdGlvbiAoZm9sZGVyUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgZnMucmVhZGRpcihmb2xkZXJQYXRoLCAoZXJyLCBmaWxlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGZpbGVWZXJzaW9uID0ge251bWVyaWNWZXJzaW9uOiAwLCBmdWxsVmVyc2lvbjogJzAnICsgRklMRV9TRVBBUkFUT1J9O1xuXG4gICAgICAgICAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFsbFZlcnNpb25zID0gZmlsZXMubWFwKGZpbGUgPT4gZmlsZS5zcGxpdChGSUxFX1NFUEFSQVRPUilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXRlc3RGaWxlID0gdGhpcy5fX21heEVsZW1lbnQoYWxsVmVyc2lvbnMpO1xuICAgICAgICAgICAgICAgICAgICBmaWxlVmVyc2lvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWZXJzaW9uOiBwYXJzZUludChsYXRlc3RGaWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxWZXJzaW9uOiBmaWxlcy5maWx0ZXIoZmlsZSA9PiBmaWxlLnNwbGl0KEZJTEVfU0VQQVJBVE9SKVswXSA9PT0gbGF0ZXN0RmlsZS50b1N0cmluZygpKVswXVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBlLmNvZGUgPSAnaW52YWxpZF9maWxlX25hbWVfZm91bmQnO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgZmlsZVZlcnNpb24pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLFxuICAgIF9fbWF4RWxlbWVudDogZnVuY3Rpb24gKG51bWJlcnMpIHtcbiAgICAgICAgbGV0IG1heCA9IG51bWJlcnNbMF07XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBudW1iZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBtYXggPSBNYXRoLm1heChtYXgsIG51bWJlcnNbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzTmFOKG1heCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBlbGVtZW50IGZvdW5kJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWF4O1xuICAgIH1cbiAgICAsXG4gICAgX19jb21wYXJlVmVyc2lvbnM6IGZ1bmN0aW9uIChmaWxlcywgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgZmlsZXNXaXRoQ2hhbmdlcyA9IFtdO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoZmlsZXMpO1xuICAgICAgICBsZXQgcmVtYWluaW5nID0gZW50cmllcy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGVzV2l0aENoYW5nZXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZW50cmllcy5mb3JFYWNoKChbZmlsZU5hbWUsIGZpbGVIYXNoXSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nZXRWZXJzaW9uc0ZvckZpbGUoZmlsZU5hbWUsIChlcnIsIHZlcnNpb25zKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSB2ZXJzaW9ucy5zb21lKHZlcnNpb24gPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYXNoID0gdmVyc2lvbi52ZXJzaW9uLnNwbGl0KEZJTEVfU0VQQVJBVE9SKVsxXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhc2ggPT09IGZpbGVIYXNoO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlc1dpdGhDaGFuZ2VzLnB1c2goZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGVzV2l0aENoYW5nZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAsXG4gICAgX19yZWFkRmlsZTogZnVuY3Rpb24gKHdyaXRlRmlsZVN0cmVhbSwgZmlsZVBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHJlYWRTdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcblxuICAgICAgICB3cml0ZUZpbGVTdHJlYW0ub24oXCJmaW5pc2hcIiwgY2FsbGJhY2spO1xuICAgICAgICB3cml0ZUZpbGVTdHJlYW0ub24oXCJlcnJvclwiLCBjYWxsYmFjayk7XG5cbiAgICAgICAgcmVhZFN0cmVhbS5waXBlKHdyaXRlRmlsZVN0cmVhbSk7XG4gICAgfVxuICAgICxcbiAgICBfX3Byb2dyZXNzOiBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgICxcbiAgICBfX3ZlcmlmeUZpbGVFeGlzdGVuY2U6IGZ1bmN0aW9uIChmaWxlUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgZnMuYWNjZXNzKGZpbGVQYXRoLCBjYWxsYmFjayk7XG4gICAgfVxuICAgICxcbiAgICBfX2dldEZpbGVOYW1lOiBmdW5jdGlvbiAoYWxpYXMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5hbGlhc2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gZmlsZXMgaGF2ZSBiZWVuIGFzc29jaWF0ZWQgd2l0aCBhbGlhc2VzXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHRoaXMuYWxpYXNlc1thbGlhc107XG4gICAgICAgIGlmICghZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJUaGUgc3BlY2lmaWVkIGFsaWFzIHdhcyBub3QgYXNzb2NpYXRlZCB3aXRoIGFueSBmaWxlXCIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlTmFtZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAsXG59KTtcbiIsInJlcXVpcmUoXCIuLi9mbG93cy9Ccmlja3NNYW5hZ2VyXCIpO1xuXG5mdW5jdGlvbiBFREZTTWlkZGxld2FyZShzZXJ2ZXIpIHtcblxuICAgIHNlcnZlci5wb3N0KCcvOmZpbGVJZCcsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAkJC5mbG93LnN0YXJ0KFwiQnJpY2tzTWFuYWdlclwiKS53cml0ZShyZXEucGFyYW1zLmZpbGVJZCwgcmVxLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAxO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwOTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBzZXJ2ZXIuZ2V0KCcvOmZpbGVJZCcsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIpO1xuICAgICAgICAkJC5mbG93LnN0YXJ0KFwiQnJpY2tzTWFuYWdlclwiKS5yZWFkKHJlcS5wYXJhbXMuZmlsZUlkLCByZXMsIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwNDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBzZXJ2ZXIucG9zdCgnL2FkZEFsaWFzLzpmaWxlSWQnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgJCQuZmxvdy5zdGFydChcIkJyaWNrc01hbmFnZXJcIikuYWRkQWxpYXMocmVxLnBhcmFtcy5maWxlSWQsIHJlcSwgIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDE7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyLmNvZGUgPT09ICdFQUNDRVMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIHNlcnZlci5wb3N0KCcvYWxpYXMvOmFsaWFzJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICQkLmZsb3cuc3RhcnQoXCJCcmlja3NNYW5hZ2VyXCIpLndyaXRlV2l0aEFsaWFzKHJlcS5wYXJhbXMuYWxpYXMsIHJlcSwgIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDE7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyLmNvZGUgPT09ICdFQUNDRVMnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBzZXJ2ZXIuZ2V0KCcvYWxpYXMvOmFsaWFzJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJjb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIik7XG4gICAgICAgICQkLmZsb3cuc3RhcnQoXCJCcmlja3NNYW5hZ2VyXCIpLnJlYWRXaXRoQWxpYXMocmVxLnBhcmFtcy5hbGlhcywgcmVzLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVERlNNaWRkbGV3YXJlOyIsImNvbnN0IHV0aWxzID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIik7XG5jb25zdCBPd00gPSB1dGlscy5Pd007XG52YXIgYmVlc0hlYWxlciA9IHV0aWxzLmJlZXNIZWFsZXI7XG52YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XG52YXIgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuXG5cbi8vVE9ETzogcHJldmVudCBhIGNsYXNzIG9mIHJhY2UgY29uZGl0aW9uIHR5cGUgb2YgZXJyb3JzIGJ5IHNpZ25hbGluZyB3aXRoIGZpbGVzIG1ldGFkYXRhIHRvIHRoZSB3YXRjaGVyIHdoZW4gaXQgaXMgc2FmZSB0byBjb25zdW1lXG5cbmZ1bmN0aW9uIEZvbGRlck1RKGZvbGRlciwgY2FsbGJhY2sgPSAoKSA9PiB7fSl7XG5cblx0aWYodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgY2FsbGJhY2sgZnVuY3Rpb25cIik7XG5cdH1cblxuXHRmb2xkZXIgPSBwYXRoLm5vcm1hbGl6ZShmb2xkZXIpO1xuXG5cdGZzLm1rZGlyKGZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIGZ1bmN0aW9uKGVyciwgcmVzKXtcblx0XHRmcy5leGlzdHMoZm9sZGVyLCBmdW5jdGlvbihleGlzdHMpIHtcblx0XHRcdGlmIChleGlzdHMpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIGZvbGRlcik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0ZnVuY3Rpb24gbWtGaWxlTmFtZShzd2FybVJhdyl7XG5cdFx0bGV0IG1ldGEgPSBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHN3YXJtUmF3KTtcblx0XHRsZXQgbmFtZSA9IGAke2ZvbGRlcn0ke3BhdGguc2VwfSR7bWV0YS5zd2FybUlkfS4ke21ldGEuc3dhcm1UeXBlTmFtZX1gO1xuXHRcdGNvbnN0IHVuaXF1ZSA9IG1ldGEucGhhc2VJZCB8fCAkJC51aWRHZW5lcmF0b3Iuc2FmZV91dWlkKCk7XG5cblx0XHRuYW1lID0gbmFtZStgLiR7dW5pcXVlfWA7XG5cdFx0cmV0dXJuIHBhdGgubm9ybWFsaXplKG5hbWUpO1xuXHR9XG5cblx0dGhpcy5nZXRIYW5kbGVyID0gZnVuY3Rpb24oKXtcblx0XHRpZihwcm9kdWNlcil7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG9uZSBjb25zdW1lciBpcyBhbGxvd2VkIVwiKTtcblx0XHR9XG5cdFx0cHJvZHVjZXIgPSB0cnVlO1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZW5kU3dhcm1TZXJpYWxpemF0aW9uOiBmdW5jdGlvbihzZXJpYWxpemF0aW9uLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHdyaXRlRmlsZShta0ZpbGVOYW1lKEpTT04ucGFyc2Uoc2VyaWFsaXphdGlvbikpLCBzZXJpYWxpemF0aW9uLCBjYWxsYmFjayk7XG5cdFx0XHR9LFxuXHRcdFx0YWRkU3RyZWFtIDogZnVuY3Rpb24oc3RyZWFtLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIXN0cmVhbSB8fCAhc3RyZWFtLnBpcGUgfHwgdHlwZW9mIHN0cmVhbS5waXBlICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJTb21ldGhpbmcgd3JvbmcgaGFwcGVuZWRcIikpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IHN3YXJtID0gXCJcIjtcblx0XHRcdFx0c3RyZWFtLm9uKCdkYXRhJywgKGNodW5rKSA9Pntcblx0XHRcdFx0XHRzd2FybSArPSBjaHVuaztcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0c3RyZWFtLm9uKFwiZW5kXCIsICgpID0+IHtcblx0XHRcdFx0XHR3cml0ZUZpbGUobWtGaWxlTmFtZShKU09OLnBhcnNlKHN3YXJtKSksIHN3YXJtLCBjYWxsYmFjayk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHN0cmVhbS5vbihcImVycm9yXCIsIChlcnIpID0+e1xuXHRcdFx0XHRcdGNhbGxiYWNrKGVycik7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSxcblx0XHRcdGFkZFN3YXJtIDogZnVuY3Rpb24oc3dhcm0sIGNhbGxiYWNrKXtcblx0XHRcdFx0aWYoIWNhbGxiYWNrKXtcblx0XHRcdFx0XHRjYWxsYmFjayA9ICQkLmRlZmF1bHRFcnJvckhhbmRsaW5nSW1wbGVtZW50YXRpb247XG5cdFx0XHRcdH1lbHNlIGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YmVlc0hlYWxlci5hc0pTT04oc3dhcm0sbnVsbCwgbnVsbCwgZnVuY3Rpb24oZXJyLCByZXMpe1xuXHRcdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHdyaXRlRmlsZShta0ZpbGVOYW1lKHJlcyksIEoocmVzKSwgY2FsbGJhY2spO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRzZW5kU3dhcm1Gb3JFeGVjdXRpb246IGZ1bmN0aW9uKHN3YXJtLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKCFjYWxsYmFjayl7XG5cdFx0XHRcdFx0Y2FsbGJhY2sgPSAkJC5kZWZhdWx0RXJyb3JIYW5kbGluZ0ltcGxlbWVudGF0aW9uO1xuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJlZXNIZWFsZXIuYXNKU09OKHN3YXJtLCBPd00ucHJvdG90eXBlLmdldE1ldGFGcm9tKHN3YXJtLCBcInBoYXNlTmFtZVwiKSwgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbShzd2FybSwgXCJhcmdzXCIpLCBmdW5jdGlvbihlcnIsIHJlcyl7XG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIGZpbGUgPSBta0ZpbGVOYW1lKHJlcyk7XG5cdFx0XHRcdFx0dmFyIGNvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShyZXMpO1xuXG5cdFx0XHRcdFx0Ly9pZiB0aGVyZSBhcmUgbm8gbW9yZSBGRCdzIGZvciBmaWxlcyB0byBiZSB3cml0dGVuIHdlIHJldHJ5LlxuXHRcdFx0XHRcdGZ1bmN0aW9uIHdyYXBwZXIoZXJyb3IsIHJlc3VsdCl7XG5cdFx0XHRcdFx0XHRpZihlcnJvcil7XG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGBDYXVnaHQgYW4gd3JpdGUgZXJyb3IuIFJldHJ5IHRvIHdyaXRlIGZpbGUgWyR7ZmlsZX1dYCk7XG5cdFx0XHRcdFx0XHRcdHNldFRpbWVvdXQoKCk9Pntcblx0XHRcdFx0XHRcdFx0XHR3cml0ZUZpbGUoZmlsZSwgY29udGVudCwgd3JhcHBlcik7XG5cdFx0XHRcdFx0XHRcdH0sIDEwKTtcblx0XHRcdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyb3IsIHJlc3VsdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0d3JpdGVGaWxlKGZpbGUsIGNvbnRlbnQsIHdyYXBwZXIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9O1xuXHR9O1xuXG5cdHZhciByZWNpcGllbnQ7XG5cdHRoaXMuc2V0SVBDQ2hhbm5lbCA9IGZ1bmN0aW9uKHByb2Nlc3NDaGFubmVsKXtcblx0XHRpZihwcm9jZXNzQ2hhbm5lbCAmJiAhcHJvY2Vzc0NoYW5uZWwuc2VuZCB8fCAodHlwZW9mIHByb2Nlc3NDaGFubmVsLnNlbmQpICE9IFwiZnVuY3Rpb25cIil7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJSZWNpcGllbnQgaXMgbm90IGluc3RhbmNlIG9mIHByb2Nlc3MvY2hpbGRfcHJvY2VzcyBvciBpdCB3YXMgbm90IHNwYXduZWQgd2l0aCBJUEMgY2hhbm5lbCFcIik7XG5cdFx0fVxuXHRcdHJlY2lwaWVudCA9IHByb2Nlc3NDaGFubmVsO1xuXHRcdGlmKGNvbnN1bWVyKXtcblx0XHRcdGNvbnNvbGUubG9nKGBDaGFubmVsIHVwZGF0ZWRgKTtcblx0XHRcdChyZWNpcGllbnQgfHwgcHJvY2Vzcykub24oXCJtZXNzYWdlXCIsIHJlY2VpdmVFbnZlbG9wZSk7XG5cdFx0fVxuXHR9O1xuXG5cblx0dmFyIGNvbnN1bWVkTWVzc2FnZXMgPSB7fTtcblxuXHRmdW5jdGlvbiBjaGVja0lmQ29uc3VtbWVkKG5hbWUsIG1lc3NhZ2Upe1xuXHRcdGNvbnN0IHNob3J0TmFtZSA9IHBhdGguYmFzZW5hbWUobmFtZSk7XG5cdFx0Y29uc3QgcHJldmlvdXNTYXZlZCA9IGNvbnN1bWVkTWVzc2FnZXNbc2hvcnROYW1lXTtcblx0XHRsZXQgcmVzdWx0ID0gZmFsc2U7XG5cdFx0aWYocHJldmlvdXNTYXZlZCAmJiAhcHJldmlvdXNTYXZlZC5sb2NhbGVDb21wYXJlKG1lc3NhZ2UpKXtcblx0XHRcdHJlc3VsdCA9IHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBzYXZlMkhpc3RvcnkoZW52ZWxvcGUpe1xuXHRcdGNvbnN1bWVkTWVzc2FnZXNbcGF0aC5iYXNlbmFtZShlbnZlbG9wZS5uYW1lKV0gPSBlbnZlbG9wZS5tZXNzYWdlO1xuXHR9XG5cblx0ZnVuY3Rpb24gYnVpbGRFbnZlbG9wZUNvbmZpcm1hdGlvbihlbnZlbG9wZSwgc2F2ZUhpc3Rvcnkpe1xuXHRcdGlmKHNhdmVIaXN0b3J5KXtcblx0XHRcdHNhdmUySGlzdG9yeShlbnZlbG9wZSk7XG5cdFx0fVxuXHRcdHJldHVybiBgQ29uZmlybSBlbnZlbG9wZSAke2VudmVsb3BlLnRpbWVzdGFtcH0gc2VudCB0byAke2VudmVsb3BlLmRlc3R9YDtcblx0fVxuXG5cdGZ1bmN0aW9uIGJ1aWxkRW52ZWxvcGUobmFtZSwgbWVzc2FnZSl7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGRlc3Q6IGZvbGRlcixcblx0XHRcdHNyYzogcHJvY2Vzcy5waWQsXG5cdFx0XHR0aW1lc3RhbXA6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuXHRcdFx0bWVzc2FnZTogbWVzc2FnZSxcblx0XHRcdG5hbWU6IG5hbWVcblx0XHR9O1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVjZWl2ZUVudmVsb3BlKGVudmVsb3BlKXtcblx0XHRpZighZW52ZWxvcGUgfHwgdHlwZW9mIGVudmVsb3BlICE9PSBcIm9iamVjdFwiKXtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Ly9jb25zb2xlLmxvZyhcInJlY2VpdmVkIGVudmVsb3BlXCIsIGVudmVsb3BlLCBmb2xkZXIpO1xuXG5cdFx0aWYoZW52ZWxvcGUuZGVzdCAhPT0gZm9sZGVyICYmIGZvbGRlci5pbmRleE9mKGVudmVsb3BlLmRlc3QpIT09IC0xICYmIGZvbGRlci5sZW5ndGggPT09IGVudmVsb3BlLmRlc3QrMSl7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlRoaXMgZW52ZWxvcGUgaXMgbm90IGZvciBtZSFcIik7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0bGV0IG1lc3NhZ2UgPSBlbnZlbG9wZS5tZXNzYWdlO1xuXG5cdFx0aWYoY2FsbGJhY2spe1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIlNlbmRpbmcgY29uZmlybWF0aW9uXCIsIHByb2Nlc3MucGlkKTtcblx0XHRcdHJlY2lwaWVudC5zZW5kKGJ1aWxkRW52ZWxvcGVDb25maXJtYXRpb24oZW52ZWxvcGUsIHRydWUpKTtcblx0XHRcdGNvbnN1bWVyKG51bGwsIEpTT04ucGFyc2UobWVzc2FnZSkpO1xuXHRcdH1cblx0fVxuXG5cdHRoaXMucmVnaXN0ZXJBc0lQQ0NvbnN1bWVyID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuXHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlRoZSBhcmd1bWVudCBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHR9XG5cdFx0cmVnaXN0ZXJlZEFzSVBDQ29uc3VtZXIgPSB0cnVlO1xuXHRcdC8vd2lsbCByZWdpc3RlciBhcyBub3JtYWwgY29uc3VtZXIgaW4gb3JkZXIgdG8gY29uc3VtZSBhbGwgZXhpc3RpbmcgbWVzc2FnZXMgYnV0IHdpdGhvdXQgc2V0dGluZyB0aGUgd2F0Y2hlclxuXHRcdHRoaXMucmVnaXN0ZXJDb25zdW1lcihjYWxsYmFjaywgdHJ1ZSwgKHdhdGNoZXIpID0+ICF3YXRjaGVyKTtcblxuXHRcdC8vY29uc29sZS5sb2coXCJSZWdpc3RlcmVkIGFzIElQQyBDb25zdW1tZXJcIiwgKTtcblx0XHQocmVjaXBpZW50IHx8IHByb2Nlc3MpLm9uKFwibWVzc2FnZVwiLCByZWNlaXZlRW52ZWxvcGUpO1xuXHR9O1xuXG5cdHRoaXMucmVnaXN0ZXJDb25zdW1lciA9IGZ1bmN0aW9uIChjYWxsYmFjaywgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkID0gdHJ1ZSwgc2hvdWxkV2FpdEZvck1vcmUgPSAod2F0Y2hlcikgPT4gdHJ1ZSkge1xuXHRcdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHR9XG5cdFx0aWYgKGNvbnN1bWVyKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG9uZSBjb25zdW1lciBpcyBhbGxvd2VkISBcIiArIGZvbGRlcik7XG5cdFx0fVxuXG5cdFx0Y29uc3VtZXIgPSBjYWxsYmFjaztcblxuXHRcdGZzLm1rZGlyKGZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuXHRcdFx0aWYgKGVyciAmJiAoZXJyLmNvZGUgIT09ICdFRVhJU1QnKSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0fVxuXHRcdFx0Y29uc3VtZUFsbEV4aXN0aW5nKHNob3VsZERlbGV0ZUFmdGVyUmVhZCwgc2hvdWxkV2FpdEZvck1vcmUpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMud3JpdGVNZXNzYWdlID0gd3JpdGVGaWxlO1xuXG5cdHRoaXMudW5saW5rQ29udGVudCA9IGZ1bmN0aW9uIChtZXNzYWdlSWQsIGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgbWVzc2FnZVBhdGggPSBwYXRoLmpvaW4oZm9sZGVyLCBtZXNzYWdlSWQpO1xuXG5cdFx0ZnMudW5saW5rKG1lc3NhZ2VQYXRoLCAoZXJyKSA9PiB7XG5cdFx0XHRjYWxsYmFjayhlcnIpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHRoaXMuZGlzcG9zZSA9IGZ1bmN0aW9uKGZvcmNlKXtcblx0XHRpZih0eXBlb2YgZm9sZGVyICE9IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0dmFyIGZpbGVzO1xuXHRcdFx0dHJ5e1xuXHRcdFx0XHRmaWxlcyA9IGZzLnJlYWRkaXJTeW5jKGZvbGRlcik7XG5cdFx0XHR9Y2F0Y2goZXJyb3Ipe1xuXHRcdFx0XHQvLy4uXG5cdFx0XHR9XG5cblx0XHRcdGlmKGZpbGVzICYmIGZpbGVzLmxlbmd0aCA+IDAgJiYgIWZvcmNlKXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJEaXNwb3NpbmcgYSBjaGFubmVsIHRoYXQgc3RpbGwgaGFzIG1lc3NhZ2VzISBEaXIgd2lsbCBub3QgYmUgcmVtb3ZlZCFcIik7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHR0cnl7XG5cdFx0XHRcdFx0ZnMucm1kaXJTeW5jKGZvbGRlcik7XG5cdFx0XHRcdH1jYXRjaChlcnIpe1xuXHRcdFx0XHRcdC8vLi5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRmb2xkZXIgPSBudWxsO1xuXHRcdH1cblxuXHRcdGlmKHByb2R1Y2VyKXtcblx0XHRcdC8vbm8gbmVlZCB0byBkbyBhbnl0aGluZyBlbHNlXG5cdFx0fVxuXG5cdFx0aWYodHlwZW9mIGNvbnN1bWVyICE9IFwidW5kZWZpbmVkXCIpe1xuXHRcdFx0Y29uc3VtZXIgPSAoKSA9PiB7fTtcblx0XHR9XG5cblx0XHRpZih3YXRjaGVyKXtcblx0XHRcdHdhdGNoZXIuY2xvc2UoKTtcblx0XHRcdHdhdGNoZXIgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyogLS0tLS0tLS0tLS0tLS0tLSBwcm90ZWN0ZWQgIGZ1bmN0aW9ucyAqL1xuXHR2YXIgY29uc3VtZXIgPSBudWxsO1xuXHR2YXIgcmVnaXN0ZXJlZEFzSVBDQ29uc3VtZXIgPSBmYWxzZTtcblx0dmFyIHByb2R1Y2VyID0gbnVsbDtcblxuXHRmdW5jdGlvbiBidWlsZFBhdGhGb3JGaWxlKGZpbGVuYW1lKXtcblx0XHRyZXR1cm4gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKGZvbGRlciwgZmlsZW5hbWUpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnN1bWVNZXNzYWdlKGZpbGVuYW1lLCBzaG91bGREZWxldGVBZnRlclJlYWQsIGNhbGxiYWNrKSB7XG5cdFx0dmFyIGZ1bGxQYXRoID0gYnVpbGRQYXRoRm9yRmlsZShmaWxlbmFtZSk7XG5cblx0XHRmcy5yZWFkRmlsZShmdWxsUGF0aCwgXCJ1dGY4XCIsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcblx0XHRcdGlmICghZXJyKSB7XG5cdFx0XHRcdGlmIChkYXRhICE9PSBcIlwiKSB7XG5cdFx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHRcdHZhciBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhKTtcblx0XHRcdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJQYXJzaW5nIGVycm9yXCIsIGVycm9yKTtcblx0XHRcdFx0XHRcdGVyciA9IGVycm9yO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKGNoZWNrSWZDb25zdW1tZWQoZnVsbFBhdGgsIGRhdGEpKXtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYG1lc3NhZ2UgYWxyZWFkeSBjb25zdW1lZCBbJHtmaWxlbmFtZX1dYCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChzaG91bGREZWxldGVBZnRlclJlYWQpIHtcblxuXHRcdFx0XHRcdFx0ZnMudW5saW5rKGZ1bGxQYXRoLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcblx0XHRcdFx0XHRcdFx0aWYgKGVycikge3Rocm93IGVycjt9O1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVyciwgbWVzc2FnZSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiQ29uc3VtZSBlcnJvclwiLCBlcnIpO1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIGNvbnN1bWVBbGxFeGlzdGluZyhzaG91bGREZWxldGVBZnRlclJlYWQsIHNob3VsZFdhaXRGb3JNb3JlKSB7XG5cblx0XHRsZXQgY3VycmVudEZpbGVzID0gW107XG5cblx0XHRmcy5yZWFkZGlyKGZvbGRlciwgJ3V0ZjgnLCBmdW5jdGlvbiAoZXJyLCBmaWxlcykge1xuXHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHQkJC5lcnJvckhhbmRsZXIuZXJyb3IoZXJyKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0Y3VycmVudEZpbGVzID0gZmlsZXM7XG5cdFx0XHRpdGVyYXRlQW5kQ29uc3VtZShmaWxlcyk7XG5cblx0XHR9KTtcblxuXHRcdGZ1bmN0aW9uIHN0YXJ0V2F0Y2hpbmcoKXtcblx0XHRcdGlmIChzaG91bGRXYWl0Rm9yTW9yZSh0cnVlKSkge1xuXHRcdFx0XHR3YXRjaEZvbGRlcihzaG91bGREZWxldGVBZnRlclJlYWQsIHNob3VsZFdhaXRGb3JNb3JlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmdW5jdGlvbiBpdGVyYXRlQW5kQ29uc3VtZShmaWxlcywgY3VycmVudEluZGV4ID0gMCkge1xuXHRcdFx0aWYgKGN1cnJlbnRJbmRleCA9PT0gZmlsZXMubGVuZ3RoKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJzdGFydCB3YXRjaGluZ1wiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cdFx0XHRcdHN0YXJ0V2F0Y2hpbmcoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocGF0aC5leHRuYW1lKGZpbGVzW2N1cnJlbnRJbmRleF0pICE9PSBpbl9wcm9ncmVzcykge1xuXHRcdFx0XHRjb25zdW1lTWVzc2FnZShmaWxlc1tjdXJyZW50SW5kZXhdLCBzaG91bGREZWxldGVBZnRlclJlYWQsIChlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHRpdGVyYXRlQW5kQ29uc3VtZShmaWxlcywgKytjdXJyZW50SW5kZXgpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRjb25zdW1lcihudWxsLCBkYXRhLCBwYXRoLmJhc2VuYW1lKGZpbGVzW2N1cnJlbnRJbmRleF0pKTtcblx0XHRcdFx0XHRpZiAoc2hvdWxkV2FpdEZvck1vcmUoKSkge1xuXHRcdFx0XHRcdFx0aXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMsICsrY3VycmVudEluZGV4KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMsICsrY3VycmVudEluZGV4KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiB3cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIGNhbGxiYWNrKXtcblx0XHRpZihyZWNpcGllbnQpe1xuXHRcdFx0dmFyIGVudmVsb3BlID0gYnVpbGRFbnZlbG9wZShmaWxlbmFtZSwgY29udGVudCk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKFwiU2VuZGluZyB0b1wiLCByZWNpcGllbnQucGlkLCByZWNpcGllbnQucHBpZCwgXCJlbnZlbG9wZVwiLCBlbnZlbG9wZSk7XG5cdFx0XHRyZWNpcGllbnQuc2VuZChlbnZlbG9wZSk7XG5cdFx0XHR2YXIgY29uZmlybWF0aW9uUmVjZWl2ZWQgPSBmYWxzZTtcblxuXHRcdFx0ZnVuY3Rpb24gcmVjZWl2ZUNvbmZpcm1hdGlvbihtZXNzYWdlKXtcblx0XHRcdFx0aWYobWVzc2FnZSA9PT0gYnVpbGRFbnZlbG9wZUNvbmZpcm1hdGlvbihlbnZlbG9wZSkpe1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJSZWNlaXZlZCBjb25maXJtYXRpb25cIiwgcmVjaXBpZW50LnBpZCk7XG5cdFx0XHRcdFx0Y29uZmlybWF0aW9uUmVjZWl2ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHRyeXtcblx0XHRcdFx0XHRcdHJlY2lwaWVudC5vZmYoXCJtZXNzYWdlXCIsIHJlY2VpdmVDb25maXJtYXRpb24pO1xuXHRcdFx0XHRcdH1jYXRjaChlcnIpe1xuXHRcdFx0XHRcdFx0Ly8uLi5cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZWNpcGllbnQub24oXCJtZXNzYWdlXCIsIHJlY2VpdmVDb25maXJtYXRpb24pO1xuXG5cdFx0XHRzZXRUaW1lb3V0KCgpPT57XG5cdFx0XHRcdGlmKCFjb25maXJtYXRpb25SZWNlaXZlZCl7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIk5vIGNvbmZpcm1hdGlvbi4uLlwiLCBwcm9jZXNzLnBpZCk7XG5cdFx0XHRcdFx0aGlkZGVuX3dyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudCwgY2FsbGJhY2spO1xuXHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRpZihjYWxsYmFjayl7XG5cdFx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgY29udGVudCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9LCAyMDApO1xuXHRcdH1lbHNle1xuXHRcdFx0aGlkZGVuX3dyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudCwgY2FsbGJhY2spO1xuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGluX3Byb2dyZXNzID0gXCIuaW5fcHJvZ3Jlc3NcIjtcblx0ZnVuY3Rpb24gaGlkZGVuX3dyaXRlRmlsZShmaWxlbmFtZSwgY29udGVudCwgY2FsbGJhY2spe1xuXHRcdHZhciB0bXBGaWxlbmFtZSA9IGZpbGVuYW1lK2luX3Byb2dyZXNzO1xuXHRcdHRyeXtcblx0XHRcdGlmKGZzLmV4aXN0c1N5bmModG1wRmlsZW5hbWUpIHx8IGZzLmV4aXN0c1N5bmMoZmlsZW5hbWUpKXtcblx0XHRcdFx0Y29uc29sZS5sb2cobmV3IEVycm9yKGBPdmVyd3JpdGluZyBmaWxlICR7ZmlsZW5hbWV9YCkpO1xuXHRcdFx0fVxuXHRcdFx0ZnMud3JpdGVGaWxlU3luYyh0bXBGaWxlbmFtZSwgY29udGVudCk7XG5cdFx0XHRmcy5yZW5hbWVTeW5jKHRtcEZpbGVuYW1lLCBmaWxlbmFtZSk7XG5cdFx0fWNhdGNoKGVycil7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHR9XG5cdFx0Y2FsbGJhY2sobnVsbCwgY29udGVudCk7XG5cdH1cblxuXHR2YXIgYWxyZWFkeUtub3duQ2hhbmdlcyA9IHt9O1xuXG5cdGZ1bmN0aW9uIGFscmVhZHlGaXJlZENoYW5nZXMoZmlsZW5hbWUsIGNoYW5nZSl7XG5cdFx0dmFyIHJlcyA9IGZhbHNlO1xuXHRcdGlmKGFscmVhZHlLbm93bkNoYW5nZXNbZmlsZW5hbWVdKXtcblx0XHRcdHJlcyA9IHRydWU7XG5cdFx0fWVsc2V7XG5cdFx0XHRhbHJlYWR5S25vd25DaGFuZ2VzW2ZpbGVuYW1lXSA9IGNoYW5nZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzO1xuXHR9XG5cblx0ZnVuY3Rpb24gd2F0Y2hGb2xkZXIoc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCBzaG91bGRXYWl0Rm9yTW9yZSl7XG5cblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRmcy5yZWFkZGlyKGZvbGRlciwgJ3V0ZjgnLCBmdW5jdGlvbiAoZXJyLCBmaWxlcykge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0JCQuZXJyb3JIYW5kbGVyLmVycm9yKGVycik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yKHZhciBpPTA7IGk8ZmlsZXMubGVuZ3RoOyBpKyspe1xuXHRcdFx0XHRcdHdhdGNoRmlsZXNIYW5kbGVyKFwiY2hhbmdlXCIsIGZpbGVzW2ldKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSwgMTAwMCk7XG5cblx0XHRmdW5jdGlvbiB3YXRjaEZpbGVzSGFuZGxlcihldmVudFR5cGUsIGZpbGVuYW1lKXtcblx0XHRcdC8vY29uc29sZS5sb2coYEdvdCAke2V2ZW50VHlwZX0gb24gJHtmaWxlbmFtZX1gKTtcblxuXHRcdFx0aWYoIWZpbGVuYW1lIHx8IHBhdGguZXh0bmFtZShmaWxlbmFtZSkgPT09IGluX3Byb2dyZXNzKXtcblx0XHRcdFx0Ly9jYXVnaHQgYSBkZWxldGUgZXZlbnQgb2YgYSBmaWxlXG5cdFx0XHRcdC8vb3Jcblx0XHRcdFx0Ly9maWxlIG5vdCByZWFkeSB0byBiZSBjb25zdW1lZCAoaW4gcHJvZ3Jlc3MpXG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGYgPSBidWlsZFBhdGhGb3JGaWxlKGZpbGVuYW1lKTtcblx0XHRcdGlmKCFmcy5leGlzdHNTeW5jKGYpKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcIkZpbGUgbm90IGZvdW5kXCIsIGYpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdC8vY29uc29sZS5sb2coYFByZXBhcmluZyB0byBjb25zdW1lICR7ZmlsZW5hbWV9YCk7XG5cdFx0XHRpZighYWxyZWFkeUZpcmVkQ2hhbmdlcyhmaWxlbmFtZSwgZXZlbnRUeXBlKSl7XG5cdFx0XHRcdGNvbnN1bWVNZXNzYWdlKGZpbGVuYW1lLCBzaG91bGREZWxldGVBZnRlclJlYWQsIChlcnIsIGRhdGEpID0+IHtcblx0XHRcdFx0XHQvL2FsbG93IGEgcmVhZCBhIHRoZSBmaWxlXG5cdFx0XHRcdFx0YWxyZWFkeUtub3duQ2hhbmdlc1tmaWxlbmFtZV0gPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHQvLyA/P1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coXCJcXG5DYXVnaHQgYW4gZXJyb3JcIiwgZXJyKTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zdW1lcihudWxsLCBkYXRhLCBmaWxlbmFtZSk7XG5cblxuXHRcdFx0XHRcdGlmICghc2hvdWxkV2FpdEZvck1vcmUoKSkge1xuXHRcdFx0XHRcdFx0d2F0Y2hlci5jbG9zZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJTb21ldGhpbmcgaGFwcGVucy4uLlwiLCBmaWxlbmFtZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cblx0XHRjb25zdCB3YXRjaGVyID0gZnMud2F0Y2goZm9sZGVyLCB3YXRjaEZpbGVzSGFuZGxlcik7XG5cblx0XHRjb25zdCBpbnRlcnZhbFRpbWVyID0gc2V0SW50ZXJ2YWwoKCk9Pntcblx0XHRcdGZzLnJlYWRkaXIoZm9sZGVyLCAndXRmOCcsIGZ1bmN0aW9uIChlcnIsIGZpbGVzKSB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHQkJC5lcnJvckhhbmRsZXIuZXJyb3IoZXJyKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZihmaWxlcy5sZW5ndGggPiAwKXtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhgXFxuXFxuRm91bmQgJHtmaWxlcy5sZW5ndGh9IGZpbGVzIG5vdCBjb25zdW1lZCB5ZXQgaW4gJHtmb2xkZXJ9YCwgbmV3IERhdGUoKS5nZXRUaW1lKCksXCJcXG5cXG5cIik7XG5cdFx0XHRcdFx0Ly9mYWtpbmcgYSByZW5hbWUgZXZlbnQgdHJpZ2dlclxuXHRcdFx0XHRcdHdhdGNoRmlsZXNIYW5kbGVyKFwicmVuYW1lXCIsIGZpbGVzWzBdKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSwgNTAwMCk7XG5cdH1cbn1cblxuZXhwb3J0cy5nZXRGb2xkZXJRdWV1ZSA9IGZ1bmN0aW9uKGZvbGRlciwgY2FsbGJhY2spe1xuXHRyZXR1cm4gbmV3IEZvbGRlck1RKGZvbGRlciwgY2FsbGJhY2spO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gUGVuZDtcblxuZnVuY3Rpb24gUGVuZCgpIHtcbiAgdGhpcy5wZW5kaW5nID0gMDtcbiAgdGhpcy5tYXggPSBJbmZpbml0eTtcbiAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgdGhpcy53YWl0aW5nID0gW107XG4gIHRoaXMuZXJyb3IgPSBudWxsO1xufVxuXG5QZW5kLnByb3RvdHlwZS5nbyA9IGZ1bmN0aW9uKGZuKSB7XG4gIGlmICh0aGlzLnBlbmRpbmcgPCB0aGlzLm1heCkge1xuICAgIHBlbmRHbyh0aGlzLCBmbik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy53YWl0aW5nLnB1c2goZm4pO1xuICB9XG59O1xuXG5QZW5kLnByb3RvdHlwZS53YWl0ID0gZnVuY3Rpb24oY2IpIHtcbiAgaWYgKHRoaXMucGVuZGluZyA9PT0gMCkge1xuICAgIGNiKHRoaXMuZXJyb3IpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2goY2IpO1xuICB9XG59O1xuXG5QZW5kLnByb3RvdHlwZS5ob2xkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBwZW5kSG9sZCh0aGlzKTtcbn07XG5cbmZ1bmN0aW9uIHBlbmRIb2xkKHNlbGYpIHtcbiAgc2VsZi5wZW5kaW5nICs9IDE7XG4gIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgcmV0dXJuIG9uQ2I7XG4gIGZ1bmN0aW9uIG9uQ2IoZXJyKSB7XG4gICAgaWYgKGNhbGxlZCkgdGhyb3cgbmV3IEVycm9yKFwiY2FsbGJhY2sgY2FsbGVkIHR3aWNlXCIpO1xuICAgIGNhbGxlZCA9IHRydWU7XG4gICAgc2VsZi5lcnJvciA9IHNlbGYuZXJyb3IgfHwgZXJyO1xuICAgIHNlbGYucGVuZGluZyAtPSAxO1xuICAgIGlmIChzZWxmLndhaXRpbmcubGVuZ3RoID4gMCAmJiBzZWxmLnBlbmRpbmcgPCBzZWxmLm1heCkge1xuICAgICAgcGVuZEdvKHNlbGYsIHNlbGYud2FpdGluZy5zaGlmdCgpKTtcbiAgICB9IGVsc2UgaWYgKHNlbGYucGVuZGluZyA9PT0gMCkge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHNlbGYubGlzdGVuZXJzO1xuICAgICAgc2VsZi5saXN0ZW5lcnMgPSBbXTtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGNiTGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjYkxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGlzdGVuZXIoc2VsZi5lcnJvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGVuZEdvKHNlbGYsIGZuKSB7XG4gIGZuKHBlbmRIb2xkKHNlbGYpKTtcbn1cbiIsImNvbnN0IG1zZ3BhY2sgPSByZXF1aXJlKCdAbXNncGFjay9tc2dwYWNrJyk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqICB1dGlsaXR5IGNsYXNzICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5mdW5jdGlvbiBSZXF1ZXN0TWFuYWdlcihwb2xsaW5nVGltZU91dCl7XG4gICAgaWYoIXBvbGxpbmdUaW1lT3V0KXtcbiAgICAgICAgcG9sbGluZ1RpbWVPdXQgPSAxMDAwOyAvLzEgc2Vjb25kIGJ5IGRlZmF1bHRcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBSZXF1ZXN0KGVuZFBvaW50LCBpbml0aWFsU3dhcm0pe1xuICAgICAgICB2YXIgb25SZXR1cm5DYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIG9uRXJyb3JDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIG9uQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHZhciByZXF1ZXN0SWQgPSBpbml0aWFsU3dhcm0ubWV0YS5yZXF1ZXN0SWQ7XG4gICAgICAgIGluaXRpYWxTd2FybSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5nZXRSZXF1ZXN0SWQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RJZDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uID0gZnVuY3Rpb24ocGhhc2VOYW1lLCBjYWxsYmFjayl7XG4gICAgICAgICAgICBpZih0eXBlb2YgcGhhc2VOYW1lICE9IFwic3RyaW5nXCIgICYmIHR5cGVvZiBjYWxsYmFjayAhPSBcImZ1bmN0aW9uXCIpe1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBmaXJzdCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgc3RyaW5nIGFuZCB0aGUgc2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb25DYWxsYmFja3MucHVzaCh7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6Y2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcGhhc2U6cGhhc2VOYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlbGYucG9sbChlbmRQb2ludCwgdGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uUmV0dXJuID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgICAgICAgICAgb25SZXR1cm5DYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICBzZWxmLnBvbGwoZW5kUG9pbnQsIHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5vbkVycm9yID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgICAgICAgICAgaWYob25FcnJvckNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKSE9PS0xKXtcbiAgICAgICAgICAgICAgICBvbkVycm9yQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBjYWxsYmFjayBhbHJlYWR5IHJlZ2lzdGVyZWQhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGlzcGF0Y2ggPSBmdW5jdGlvbihlcnIsIHJlc3VsdCl7XG4gICAgICAgICAgICBpZihBcnJheUJ1ZmZlci5pc1ZpZXcocmVzdWx0KSB8fCBCdWZmZXIuaXNCdWZmZXIocmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG1zZ3BhY2suZGVjb2RlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyBKU09OLnBhcnNlKHJlc3VsdCkgOiByZXN1bHQ7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IE93TS5wcm90b3R5cGUuY29udmVydChyZXN1bHQpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdFJlcUlkID0gcmVzdWx0LmdldE1ldGEoXCJyZXF1ZXN0SWRcIik7XG4gICAgICAgICAgICB2YXIgcGhhc2VOYW1lID0gcmVzdWx0LmdldE1ldGEoXCJwaGFzZU5hbWVcIik7XG4gICAgICAgICAgICB2YXIgb25SZXR1cm4gPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYocmVzdWx0UmVxSWQgPT09IHJlcXVlc3RJZCl7XG4gICAgICAgICAgICAgICAgb25SZXR1cm5DYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgICAgICAgICAgYyhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBvblJldHVybiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYob25SZXR1cm4pe1xuICAgICAgICAgICAgICAgICAgICBvblJldHVybkNhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBvbkVycm9yQ2FsbGJhY2tzID0gW107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb25DYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihpKXtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIlhYWFhYWFhYOlwiLCBwaGFzZU5hbWUgLCBpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocGhhc2VOYW1lID09PSBpLnBoYXNlIHx8IGkucGhhc2UgPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaS5jYWxsYmFjayhlcnIsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYob25SZXR1cm5DYWxsYmFja3MubGVuZ3RoID09PSAwICYmIG9uQ2FsbGJhY2tzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICAgICAgc2VsZi51bnBvbGwoZW5kUG9pbnQsIHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFcnJvciA9IGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaSA8IG9uRXJyb3JDYWxsYmFja3MubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBlcnJDYiA9IG9uRXJyb3JDYWxsYmFja3NbaV07XG4gICAgICAgICAgICAgICAgZXJyQ2IoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzZWxmLnVucG9sbChlbmRQb2ludCwgdGhpcyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5jcmVhdGVSZXF1ZXN0ID0gZnVuY3Rpb24ocmVtb3RlRW5kUG9pbnQsIHN3YXJtKXtcbiAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdChyZW1vdGVFbmRQb2ludCwgc3dhcm0pO1xuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9O1xuXG4gICAgLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqIHBvbGxpbmcgem9uZSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIHBvbGxTZXQgPSB7XG4gICAgfTtcblxuICAgIHZhciBhY3RpdmVDb25uZWN0aW9ucyA9IHtcbiAgICB9O1xuXG4gICAgdGhpcy5wb2xsID0gZnVuY3Rpb24ocmVtb3RlRW5kUG9pbnQsIHJlcXVlc3Qpe1xuICAgICAgICB2YXIgcmVxdWVzdHMgPSBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XTtcbiAgICAgICAgaWYoIXJlcXVlc3RzKXtcbiAgICAgICAgICAgIHJlcXVlc3RzID0ge307XG4gICAgICAgICAgICBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XSA9IHJlcXVlc3RzO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3RzW3JlcXVlc3QuZ2V0UmVxdWVzdElkKCldID0gcmVxdWVzdDtcbiAgICAgICAgcG9sbGluZ0hhbmRsZXIoKTtcbiAgICB9O1xuXG4gICAgdGhpcy51bnBvbGwgPSBmdW5jdGlvbihyZW1vdGVFbmRQb2ludCwgcmVxdWVzdCl7XG4gICAgICAgIHZhciByZXF1ZXN0cyA9IHBvbGxTZXRbcmVtb3RlRW5kUG9pbnRdO1xuICAgICAgICBpZihyZXF1ZXN0cyl7XG4gICAgICAgICAgICBkZWxldGUgcmVxdWVzdHNbcmVxdWVzdC5nZXRSZXF1ZXN0SWQoKV07XG4gICAgICAgICAgICBpZihPYmplY3Qua2V5cyhyZXF1ZXN0cykubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgICAgICBkZWxldGUgcG9sbFNldFtyZW1vdGVFbmRQb2ludF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVucG9sbGluZyB3cm9uZyByZXF1ZXN0OlwiLHJlbW90ZUVuZFBvaW50LCByZXF1ZXN0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVQb2xsVGhyZWFkKHJlbW90ZUVuZFBvaW50KXtcbiAgICAgICAgZnVuY3Rpb24gcmVBcm0oKXtcbiAgICAgICAgICAgICQkLnJlbW90ZS5kb0h0dHBHZXQocmVtb3RlRW5kUG9pbnQsIGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdHMgPSBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XTtcblxuICAgICAgICAgICAgICAgIGlmKGVycil7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgcmVxX2lkIGluIHJlcXVlc3RzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlcnJfaGFuZGxlciA9IHJlcXVlc3RzW3JlcV9pZF0uZGlzcGF0Y2hFcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVycl9oYW5kbGVyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJfaGFuZGxlcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZUNvbm5lY3Rpb25zW3JlbW90ZUVuZFBvaW50XSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKEJ1ZmZlci5pc0J1ZmZlcihyZXMpIHx8IEFycmF5QnVmZmVyLmlzVmlldyhyZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSBtc2dwYWNrLmRlY29kZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIHJlcXVlc3RzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW2tdLmRpc3BhdGNoKG51bGwsIHJlcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZihPYmplY3Qua2V5cyhyZXF1ZXN0cykubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZUFybSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFjdGl2ZUNvbm5lY3Rpb25zW3JlbW90ZUVuZFBvaW50XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRW5kaW5nIHBvbGxpbmcgZm9yIFwiLCByZW1vdGVFbmRQb2ludCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZUFybSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvbGxpbmdIYW5kbGVyKCl7XG4gICAgICAgIGxldCBzZXRUaW1lciA9IGZhbHNlO1xuICAgICAgICBmb3IodmFyIHYgaW4gcG9sbFNldCl7XG4gICAgICAgICAgICBpZighYWN0aXZlQ29ubmVjdGlvbnNbdl0pe1xuICAgICAgICAgICAgICAgIGNyZWF0ZVBvbGxUaHJlYWQodik7XG4gICAgICAgICAgICAgICAgYWN0aXZlQ29ubmVjdGlvbnNbdl0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGltZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHNldFRpbWVyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KHBvbGxpbmdIYW5kbGVyLCBwb2xsaW5nVGltZU91dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCBwb2xsaW5nSGFuZGxlciwgcG9sbGluZ1RpbWVPdXQpO1xufVxuXG5cbmZ1bmN0aW9uIGV4dHJhY3REb21haW5BZ2VudERldGFpbHModXJsKXtcbiAgICBjb25zdCB2UmVnZXggPSAvKFthLXpBLVowLTldKnwuKSpcXC9hZ2VudFxcLyhbYS16QS1aMC05XSsoXFwvKSopKy9nO1xuXG4gICAgaWYoIXVybC5tYXRjaCh2UmVnZXgpKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBmb3JtYXQuIChFZy4gZG9tYWluWy5zdWJkb21haW5dKi9hZ2VudC9bb3JnYW5pc2F0aW9uL10qYWdlbnRJZClcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZGV2aWRlciA9IFwiL2FnZW50L1wiO1xuICAgIGxldCBkb21haW47XG4gICAgbGV0IGFnZW50VXJsO1xuXG4gICAgY29uc3Qgc3BsaXRQb2ludCA9IHVybC5pbmRleE9mKGRldmlkZXIpO1xuICAgIGlmKHNwbGl0UG9pbnQgIT09IC0xKXtcbiAgICAgICAgZG9tYWluID0gdXJsLnNsaWNlKDAsIHNwbGl0UG9pbnQpO1xuICAgICAgICBhZ2VudFVybCA9IHVybC5zbGljZShzcGxpdFBvaW50K2RldmlkZXIubGVuZ3RoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge2RvbWFpbiwgYWdlbnRVcmx9O1xufVxuXG5mdW5jdGlvbiB1cmxFbmRXaXRoU2xhc2godXJsKXtcblxuICAgIGlmKHVybFt1cmwubGVuZ3RoIC0gMV0gIT09IFwiL1wiKXtcbiAgICAgICAgdXJsICs9IFwiL1wiO1xuICAgIH1cblxuICAgIHJldHVybiB1cmw7XG59XG5cbmNvbnN0IE93TSA9IHJlcXVpcmUoXCJzd2FybXV0aWxzXCIpLk93TTtcblxuLyoqKioqKioqKioqKioqKioqKioqKiogbWFpbiBBUElzIG9uIHdvcmtpbmcgd2l0aCByZW1vdGUgZW5kIHBvaW50cyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuZnVuY3Rpb24gUHNrSHR0cENsaWVudChyZW1vdGVFbmRQb2ludCwgYWdlbnRVaWQsIG9wdGlvbnMpe1xuICAgIHZhciBiYXNlT2ZSZW1vdGVFbmRQb2ludCA9IHJlbW90ZUVuZFBvaW50OyAvL3JlbW92ZSBsYXN0IGlkXG5cbiAgICByZW1vdGVFbmRQb2ludCA9IHVybEVuZFdpdGhTbGFzaChyZW1vdGVFbmRQb2ludCk7XG5cbiAgICAvL2RvbWFpbkluZm8gY29udGFpbnMgMiBtZW1iZXJzOiBkb21haW4gKHByaXZhdGVTa3kgZG9tYWluKSBhbmQgYWdlbnRVcmxcbiAgICBjb25zdCBkb21haW5JbmZvID0gZXh0cmFjdERvbWFpbkFnZW50RGV0YWlscyhhZ2VudFVpZCk7XG4gICAgbGV0IGhvbWVTZWN1cml0eUNvbnRleHQgPSBkb21haW5JbmZvLmFnZW50VXJsO1xuICAgIGxldCByZXR1cm5SZW1vdGVFbmRQb2ludCA9IHJlbW90ZUVuZFBvaW50O1xuXG4gICAgaWYob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5yZXR1cm5SZW1vdGUgIT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgIHJldHVyblJlbW90ZUVuZFBvaW50ID0gb3B0aW9ucy5yZXR1cm5SZW1vdGU7XG4gICAgfVxuXG4gICAgaWYoIW9wdGlvbnMgfHwgb3B0aW9ucyAmJiAodHlwZW9mIG9wdGlvbnMudW5pcXVlSWQgPT0gXCJ1bmRlZmluZWRcIiB8fCBvcHRpb25zLnVuaXF1ZUlkKSl7XG4gICAgICAgIGhvbWVTZWN1cml0eUNvbnRleHQgKz0gXCJfXCIrTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpO1xuICAgIH1cblxuICAgIHJldHVyblJlbW90ZUVuZFBvaW50ID0gdXJsRW5kV2l0aFNsYXNoKHJldHVyblJlbW90ZUVuZFBvaW50KTtcblxuICAgIHRoaXMuc3RhcnRTd2FybSA9IGZ1bmN0aW9uKHN3YXJtTmFtZSwgcGhhc2VOYW1lLCAuLi5hcmdzKXtcbiAgICAgICAgY29uc3Qgc3dhcm0gPSBuZXcgT3dNKCk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJzd2FybUlkXCIsICQkLnVpZEdlbmVyYXRvci5zYWZlX3V1aWQoKSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJyZXF1ZXN0SWRcIiwgc3dhcm0uZ2V0TWV0YShcInN3YXJtSWRcIikpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwic3dhcm1UeXBlTmFtZVwiLCBzd2FybU5hbWUpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwicGhhc2VOYW1lXCIsIHBoYXNlTmFtZSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJhcmdzXCIsIGFyZ3MpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiY29tbWFuZFwiLCBcImV4ZWN1dGVTd2FybVBoYXNlXCIpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwidGFyZ2V0XCIsIGRvbWFpbkluZm8uYWdlbnRVcmwpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiLCByZXR1cm5SZW1vdGVFbmRQb2ludCskJC5yZW1vdGUuYmFzZTY0RW5jb2RlKGhvbWVTZWN1cml0eUNvbnRleHQpKTtcblxuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdChnZXRSZW1vdGUocmVtb3RlRW5kUG9pbnQsIGRvbWFpbkluZm8uZG9tYWluKSwgbXNncGFjay5lbmNvZGUoc3dhcm0pLCBmdW5jdGlvbihlcnIsIHJlcyl7XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAkJC5yZW1vdGUucmVxdWVzdE1hbmFnZXIuY3JlYXRlUmVxdWVzdChzd2FybS5nZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiKSwgc3dhcm0pO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbnRpbnVlU3dhcm0gPSBmdW5jdGlvbihleGlzdGluZ1N3YXJtLCBwaGFzZU5hbWUsIC4uLmFyZ3Mpe1xuICAgICAgICB2YXIgc3dhcm0gPSBuZXcgT3dNKGV4aXN0aW5nU3dhcm0pO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwicGhhc2VOYW1lXCIsIHBoYXNlTmFtZSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJhcmdzXCIsIGFyZ3MpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiY29tbWFuZFwiLCBcImV4ZWN1dGVTd2FybVBoYXNlXCIpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwidGFyZ2V0XCIsIGRvbWFpbkluZm8uYWdlbnRVcmwpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiLCByZXR1cm5SZW1vdGVFbmRQb2ludCskJC5yZW1vdGUuYmFzZTY0RW5jb2RlKGhvbWVTZWN1cml0eUNvbnRleHQpKTtcblxuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdChnZXRSZW1vdGUocmVtb3RlRW5kUG9pbnQsIGRvbWFpbkluZm8uZG9tYWluKSwgbXNncGFjay5lbmNvZGUoc3dhcm0pLCBmdW5jdGlvbihlcnIsIHJlcyl7XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvL3JldHVybiAkJC5yZW1vdGUucmVxdWVzdE1hbmFnZXIuY3JlYXRlUmVxdWVzdChzd2FybS5nZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiKSwgc3dhcm0pO1xuICAgIH07XG5cbiAgICB2YXIgYWxsQ2F0Y2hBbGxzID0gW107XG4gICAgdmFyIHJlcXVlc3RzQ291bnRlciA9IDA7XG4gICAgZnVuY3Rpb24gQ2F0Y2hBbGwoc3dhcm1OYW1lLCBwaGFzZU5hbWUsIGNhbGxiYWNrKXsgLy9zYW1lIGludGVyZmFjZSBhcyBSZXF1ZXN0XG4gICAgICAgIHZhciByZXF1ZXN0SWQgPSByZXF1ZXN0c0NvdW50ZXIrKztcbiAgICAgICAgdGhpcy5nZXRSZXF1ZXN0SWQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgbGV0IHJlcUlkID0gXCJzd2FybU5hbWVcIiArIFwicGhhc2VOYW1lXCIgKyByZXF1ZXN0SWQ7XG4gICAgICAgICAgICByZXR1cm4gcmVxSWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kaXNwYXRjaCA9IGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgIHJlc3VsdCA9IE93TS5wcm90b3R5cGUuY29udmVydChyZXN1bHQpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRQaGFzZU5hbWUgPSByZXN1bHQuZ2V0TWV0YShcInBoYXNlTmFtZVwiKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50U3dhcm1OYW1lID0gcmVzdWx0LmdldE1ldGEoXCJzd2FybVR5cGVOYW1lXCIpO1xuICAgICAgICAgICAgaWYoKGN1cnJlbnRTd2FybU5hbWUgPT09IHN3YXJtTmFtZSB8fCBzd2FybU5hbWUgPT09ICcqJykgJiYgKGN1cnJlbnRQaGFzZU5hbWUgPT09IHBoYXNlTmFtZSB8fCBwaGFzZU5hbWUgPT09ICcqJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMub24gPSBmdW5jdGlvbihzd2FybU5hbWUsIHBoYXNlTmFtZSwgY2FsbGJhY2spe1xuICAgICAgICB2YXIgYyA9IG5ldyBDYXRjaEFsbChzd2FybU5hbWUsIHBoYXNlTmFtZSwgY2FsbGJhY2spO1xuICAgICAgICBhbGxDYXRjaEFsbHMucHVzaCh7XG4gICAgICAgICAgICBzOnN3YXJtTmFtZSxcbiAgICAgICAgICAgIHA6cGhhc2VOYW1lLFxuICAgICAgICAgICAgYzpjXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQkLnJlbW90ZS5yZXF1ZXN0TWFuYWdlci5wb2xsKGdldFJlbW90ZShyZW1vdGVFbmRQb2ludCwgZG9tYWluSW5mby5kb21haW4pICwgYyk7XG4gICAgfTtcblxuICAgIHRoaXMub2ZmID0gZnVuY3Rpb24oc3dhcm1OYW1lLCBwaGFzZU5hbWUpe1xuICAgICAgICBhbGxDYXRjaEFsbHMuZm9yRWFjaChmdW5jdGlvbihjYSl7XG4gICAgICAgICAgICBpZigoY2EucyA9PT0gc3dhcm1OYW1lIHx8IHN3YXJtTmFtZSA9PT0gJyonKSAmJiAocGhhc2VOYW1lID09PSBjYS5wIHx8IHBoYXNlTmFtZSA9PT0gJyonKSl7XG4gICAgICAgICAgICAgICAgJCQucmVtb3RlLnJlcXVlc3RNYW5hZ2VyLnVucG9sbChnZXRSZW1vdGUocmVtb3RlRW5kUG9pbnQsIGRvbWFpbkluZm8uZG9tYWluKSwgY2EuYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLnVwbG9hZENTQiA9IGZ1bmN0aW9uKGNyeXB0b1VpZCwgYmluYXJ5RGF0YSwgY2FsbGJhY2spe1xuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdChiYXNlT2ZSZW1vdGVFbmRQb2ludCArIFwiL0NTQi9cIiArIGNyeXB0b1VpZCwgYmluYXJ5RGF0YSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB0aGlzLmRvd25sb2FkQ1NCID0gZnVuY3Rpb24oY3J5cHRvVWlkLCBjYWxsYmFjayl7XG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBHZXQoYmFzZU9mUmVtb3RlRW5kUG9pbnQgKyBcIi9DU0IvXCIgKyBjcnlwdG9VaWQsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0UmVtb3RlKGJhc2VVcmwsIGRvbWFpbikge1xuICAgICAgICByZXR1cm4gdXJsRW5kV2l0aFNsYXNoKGJhc2VVcmwpICsgJCQucmVtb3RlLmJhc2U2NEVuY29kZShkb21haW4pO1xuICAgIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKiogaW5pdGlhbGlzYXRpb24gc3R1ZmYgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmlmICh0eXBlb2YgJCQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAkJCA9IHt9O1xufVxuXG5pZiAodHlwZW9mICAkJC5yZW1vdGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAkJC5yZW1vdGUgPSB7fTtcbiAgICAkJC5yZW1vdGUuY3JlYXRlUmVxdWVzdE1hbmFnZXIgPSBmdW5jdGlvbih0aW1lT3V0KXtcbiAgICAgICAgJCQucmVtb3RlLnJlcXVlc3RNYW5hZ2VyID0gbmV3IFJlcXVlc3RNYW5hZ2VyKHRpbWVPdXQpO1xuICAgIH07XG5cblxuICAgICQkLnJlbW90ZS5jcnlwdG9Qcm92aWRlciA9IG51bGw7XG4gICAgJCQucmVtb3RlLm5ld0VuZFBvaW50ID0gZnVuY3Rpb24oYWxpYXMsIHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgY3J5cHRvSW5mbyl7XG4gICAgICAgIGlmKGFsaWFzID09PSBcIm5ld1JlbW90ZUVuZFBvaW50XCIgfHwgYWxpYXMgPT09IFwicmVxdWVzdE1hbmFnZXJcIiB8fCBhbGlhcyA9PT0gXCJjcnlwdG9Qcm92aWRlclwiKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUHNrSHR0cENsaWVudCBVbnNhZmUgYWxpYXMgbmFtZTpcIiwgYWxpYXMpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICQkLnJlbW90ZVthbGlhc10gPSBuZXcgUHNrSHR0cENsaWVudChyZW1vdGVFbmRQb2ludCwgYWdlbnRVaWQsIGNyeXB0b0luZm8pO1xuICAgIH07XG5cblxuICAgICQkLnJlbW90ZS5kb0h0dHBQb3N0ID0gZnVuY3Rpb24gKHVybCwgZGF0YSwgY2FsbGJhY2spe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgdGhpcyFcIik7XG4gICAgfTtcblxuICAgICQkLnJlbW90ZS5kb0h0dHBHZXQgPSBmdW5jdGlvbiBkb0h0dHBHZXQodXJsLCBjYWxsYmFjayl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJ3cml0ZSB0aGlzIVwiKTtcbiAgICB9O1xuXG4gICAgJCQucmVtb3RlLmJhc2U2NEVuY29kZSA9IGZ1bmN0aW9uIGJhc2U2NEVuY29kZShzdHJpbmdUb0VuY29kZSl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJ3cml0ZSB0aGlzIVwiKTtcbiAgICB9O1xuXG4gICAgJCQucmVtb3RlLmJhc2U2NERlY29kZSA9IGZ1bmN0aW9uIGJhc2U2NERlY29kZShlbmNvZGVkU3RyaW5nKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlIHRoaXMhXCIpO1xuICAgIH07XG59XG5cblxuXG4vKiAgaW50ZXJmYWNlXG5mdW5jdGlvbiBDcnlwdG9Qcm92aWRlcigpe1xuXG4gICAgdGhpcy5nZW5lcmF0ZVNhZmVVaWQgPSBmdW5jdGlvbigpe1xuXG4gICAgfVxuXG4gICAgdGhpcy5zaWduU3dhcm0gPSBmdW5jdGlvbihzd2FybSwgYWdlbnQpe1xuXG4gICAgfVxufSAqL1xuIiwiJCQucmVtb3RlLmRvSHR0cFBvc3QgPSBmdW5jdGlvbiAodXJsLCBkYXRhLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHhoci5yZXNwb25zZTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoeGhyLnN0YXR1cz49NDAwKXtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJBbiBlcnJvciBvY2N1cmVkLiBTdGF0dXNDb2RlOiBcIiArIHhoci5zdGF0dXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFN0YXR1cyBjb2RlICR7eGhyLnN0YXR1c30gcmVjZWl2ZWQsIHJlc3BvbnNlIGlzIGlnbm9yZWQuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oXCJQT1NUXCIsIHVybCwgdHJ1ZSk7XG4gICAgLy94aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOFwiKTtcblxuICAgIGlmKGRhdGEgJiYgZGF0YS5waXBlICYmIHR5cGVvZiBkYXRhLnBpcGUgPT09IFwiZnVuY3Rpb25cIil7XG4gICAgICAgIGNvbnN0IGJ1ZmZlcnMgPSBbXTtcbiAgICAgICAgZGF0YS5vbihcImRhdGFcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgYnVmZmVycy5wdXNoKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGF0YS5vbihcImVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGFjdHVhbENvbnRlbnRzID0gQnVmZmVyLmNvbmNhdChidWZmZXJzKTtcbiAgICAgICAgICAgIHhoci5zZW5kKGFjdHVhbENvbnRlbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgICAgIH1cblxuICAgICAgICB4aHIuc2VuZChkYXRhKTtcbiAgICB9XG59O1xuXG5cbiQkLnJlbW90ZS5kb0h0dHBHZXQgPSBmdW5jdGlvbiBkb0h0dHBHZXQodXJsLCBjYWxsYmFjaykge1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9jaGVjayBpZiBoZWFkZXJzIHdlcmUgcmVjZWl2ZWQgYW5kIGlmIGFueSBhY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBiZWZvcmUgcmVjZWl2aW5nIGRhdGFcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSAyKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudFR5cGUgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIik7XG4gICAgICAgICAgICBpZiAoY29udGVudFR5cGUgPT09IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIpIHtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09IDQgJiYgeGhyLnN0YXR1cyA9PSBcIjIwMFwiKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudFR5cGUgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIik7XG5cbiAgICAgICAgICAgIGlmKGNvbnRlbnRUeXBlPT09XCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIil7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3BvbnNlQnVmZmVyID0gQnVmZmVyLmZyb20odGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2VCdWZmZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB4aHIucmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJBbiBlcnJvciBvY2N1cmVkLiBTdGF0dXNDb2RlOiBcIiArIHhoci5zdGF0dXMpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwpO1xuICAgIHhoci5zZW5kKCk7XG59O1xuXG5cbmZ1bmN0aW9uIENyeXB0b1Byb3ZpZGVyKCl7XG5cbiAgICB0aGlzLmdlbmVyYXRlU2FmZVVpZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCB1aWQgPSBcIlwiO1xuICAgICAgICB2YXIgYXJyYXkgPSBuZXcgVWludDMyQXJyYXkoMTApO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhhcnJheSk7XG5cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB1aWQgKz0gYXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVpZDtcbiAgICB9XG5cbiAgICB0aGlzLnNpZ25Td2FybSA9IGZ1bmN0aW9uKHN3YXJtLCBhZ2VudCl7XG4gICAgICAgIHN3YXJtLm1ldGEuc2lnbmF0dXJlID0gYWdlbnQ7XG4gICAgfVxufVxuXG5cblxuJCQucmVtb3RlLmNyeXB0b1Byb3ZpZGVyID0gbmV3IENyeXB0b1Byb3ZpZGVyKCk7XG5cbiQkLnJlbW90ZS5iYXNlNjRFbmNvZGUgPSBmdW5jdGlvbiBiYXNlNjRFbmNvZGUoc3RyaW5nVG9FbmNvZGUpe1xuICAgIHJldHVybiB3aW5kb3cuYnRvYShzdHJpbmdUb0VuY29kZSk7XG59O1xuXG4kJC5yZW1vdGUuYmFzZTY0RGVjb2RlID0gZnVuY3Rpb24gYmFzZTY0RGVjb2RlKGVuY29kZWRTdHJpbmcpe1xuICAgIHJldHVybiB3aW5kb3cuYXRvYihlbmNvZGVkU3RyaW5nKTtcbn07XG4iLCJyZXF1aXJlKFwiLi9wc2stYWJzdHJhY3QtY2xpZW50XCIpO1xuXG5jb25zdCBodHRwID0gcmVxdWlyZShcImh0dHBcIik7XG5jb25zdCBodHRwcyA9IHJlcXVpcmUoXCJodHRwc1wiKTtcbmNvbnN0IFVSTCA9IHJlcXVpcmUoXCJ1cmxcIik7XG5jb25zdCB1c2VyQWdlbnQgPSAnUFNLIE5vZGVBZ2VudC8wLjAuMSc7XG5cbmNvbnNvbGUubG9nKFwiUFNLIG5vZGUgY2xpZW50IGxvYWRpbmdcIik7XG5cbmZ1bmN0aW9uIGdldE5ldHdvcmtGb3JPcHRpb25zKG9wdGlvbnMpIHtcblx0aWYob3B0aW9ucy5wcm90b2NvbCA9PT0gJ2h0dHA6Jykge1xuXHRcdHJldHVybiBodHRwO1xuXHR9IGVsc2UgaWYob3B0aW9ucy5wcm90b2NvbCA9PT0gJ2h0dHBzOicpIHtcblx0XHRyZXR1cm4gaHR0cHM7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBDYW4ndCBoYW5kbGUgcHJvdG9jb2wgJHtvcHRpb25zLnByb3RvY29sfWApO1xuXHR9XG5cbn1cblxuJCQucmVtb3RlLmRvSHR0cFBvc3QgPSBmdW5jdGlvbiAodXJsLCBkYXRhLCBjYWxsYmFjayl7XG5cdGNvbnN0IGlubmVyVXJsID0gVVJMLnBhcnNlKHVybCk7XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRob3N0bmFtZTogaW5uZXJVcmwuaG9zdG5hbWUsXG5cdFx0cGF0aDogaW5uZXJVcmwucGF0aG5hbWUsXG5cdFx0cG9ydDogcGFyc2VJbnQoaW5uZXJVcmwucG9ydCksXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J1VzZXItQWdlbnQnOiB1c2VyQWdlbnRcblx0XHR9LFxuXHRcdG1ldGhvZDogJ1BPU1QnXG5cdH07XG5cblx0Y29uc3QgbmV0d29yayA9IGdldE5ldHdvcmtGb3JPcHRpb25zKGlubmVyVXJsKTtcblxuXHRpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkgfHwgQnVmZmVyLmlzQnVmZmVyKGRhdGEpKSB7XG5cdFx0aWYoIUJ1ZmZlci5pc0J1ZmZlcihkYXRhKSkge1xuXHRcdFx0ZGF0YSA9IEJ1ZmZlci5mcm9tKGRhdGEpO1xuXHRcdH1cblxuXHRcdG9wdGlvbnMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcblx0XHRvcHRpb25zLmhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSBkYXRhLmxlbmd0aDtcblx0fVxuXG5cdGNvbnN0IHJlcSA9IG5ldHdvcmsucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG5cdFx0Y29uc3QgeyBzdGF0dXNDb2RlIH0gPSByZXM7XG5cblx0XHRsZXQgZXJyb3I7XG5cdFx0aWYgKHN0YXR1c0NvZGUgPj0gNDAwKSB7XG5cdFx0XHRlcnJvciA9IG5ldyBFcnJvcignUmVxdWVzdCBGYWlsZWQuXFxuJyArXG5cdFx0XHRcdGBTdGF0dXMgQ29kZTogJHtzdGF0dXNDb2RlfWApO1xuXHRcdH1cblxuXHRcdGlmIChlcnJvcikge1xuXHRcdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHRcdFx0Ly8gZnJlZSB1cCBtZW1vcnlcblx0XHRcdHJlcy5yZXN1bWUoKTtcblx0XHRcdHJldHVybiA7XG5cdFx0fVxuXG5cdFx0bGV0IHJhd0RhdGEgPSAnJztcblx0XHRyZXMub24oJ2RhdGEnLCAoY2h1bmspID0+IHsgcmF3RGF0YSArPSBjaHVuazsgfSk7XG5cdFx0cmVzLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgcmF3RGF0YSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUE9TVCBFcnJvclwiLCBlcnJvcik7XG5cdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHR9KTtcblxuICAgIGlmKGRhdGEgJiYgZGF0YS5waXBlICYmIHR5cGVvZiBkYXRhLnBpcGUgPT09IFwiZnVuY3Rpb25cIil7XG4gICAgICAgIGRhdGEucGlwZShyZXEpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNCdWZmZXIoZGF0YSkgJiYgIUFycmF5QnVmZmVyLmlzVmlldyhkYXRhKSkge1xuXHRcdGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcblx0fVxuXG5cdHJlcS53cml0ZShkYXRhKTtcblx0cmVxLmVuZCgpO1xufTtcblxuJCQucmVtb3RlLmRvSHR0cEdldCA9IGZ1bmN0aW9uIGRvSHR0cEdldCh1cmwsIGNhbGxiYWNrKXtcbiAgICBjb25zdCBpbm5lclVybCA9IFVSTC5wYXJzZSh1cmwpO1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0aG9zdG5hbWU6IGlubmVyVXJsLmhvc3RuYW1lLFxuXHRcdHBhdGg6IGlubmVyVXJsLnBhdGhuYW1lICsgKGlubmVyVXJsLnNlYXJjaCB8fCAnJyksXG5cdFx0cG9ydDogcGFyc2VJbnQoaW5uZXJVcmwucG9ydCksXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J1VzZXItQWdlbnQnOiB1c2VyQWdlbnRcblx0XHR9LFxuXHRcdG1ldGhvZDogJ0dFVCdcblx0fTtcblxuXHRjb25zdCBuZXR3b3JrID0gZ2V0TmV0d29ya0Zvck9wdGlvbnMoaW5uZXJVcmwpO1xuXG5cdGNvbnN0IHJlcSA9IG5ldHdvcmsucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG5cdFx0Y29uc3QgeyBzdGF0dXNDb2RlIH0gPSByZXM7XG5cblx0XHRsZXQgZXJyb3I7XG5cdFx0aWYgKHN0YXR1c0NvZGUgIT09IDIwMCkge1xuXHRcdFx0ZXJyb3IgPSBuZXcgRXJyb3IoJ1JlcXVlc3QgRmFpbGVkLlxcbicgK1xuXHRcdFx0XHRgU3RhdHVzIENvZGU6ICR7c3RhdHVzQ29kZX1gKTtcblx0XHRcdGVycm9yLmNvZGUgPSBzdGF0dXNDb2RlO1xuXHRcdH1cblxuXHRcdGlmIChlcnJvcikge1xuXHRcdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHRcdFx0Ly8gZnJlZSB1cCBtZW1vcnlcblx0XHRcdHJlcy5yZXN1bWUoKTtcblx0XHRcdHJldHVybiA7XG5cdFx0fVxuXG5cdFx0bGV0IHJhd0RhdGE7XG5cdFx0Y29uc3QgY29udGVudFR5cGUgPSByZXMuaGVhZGVyc1snY29udGVudC10eXBlJ107XG5cblx0XHRpZihjb250ZW50VHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIil7XG5cdFx0XHRyYXdEYXRhID0gW107XG5cdFx0fWVsc2V7XG5cdFx0XHRyYXdEYXRhID0gJyc7XG5cdFx0fVxuXG5cdFx0cmVzLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG5cdFx0XHRpZihBcnJheS5pc0FycmF5KHJhd0RhdGEpKXtcblx0XHRcdFx0cmF3RGF0YS5wdXNoKC4uLmNodW5rKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRyYXdEYXRhICs9IGNodW5rO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJlcy5vbignZW5kJywgKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShyYXdEYXRhKSl7XG5cdFx0XHRcdFx0cmF3RGF0YSA9IEJ1ZmZlci5mcm9tKHJhd0RhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCByYXdEYXRhKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNsaWVudCBlcnJvcjpcIiwgZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0cmVxLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG5cdFx0aWYoZXJyb3IgJiYgZXJyb3IuY29kZSAhPT0gJ0VDT05OUkVTRVQnKXtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhcIkdFVCBFcnJvclwiLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHR9KTtcblxuXHRyZXEuZW5kKCk7XG59O1xuXG4kJC5yZW1vdGUuYmFzZTY0RW5jb2RlID0gZnVuY3Rpb24gYmFzZTY0RW5jb2RlKHN0cmluZ1RvRW5jb2RlKXtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oc3RyaW5nVG9FbmNvZGUpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbn07XG5cbiQkLnJlbW90ZS5iYXNlNjREZWNvZGUgPSBmdW5jdGlvbiBiYXNlNjREZWNvZGUoZW5jb2RlZFN0cmluZyl7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGVuY29kZWRTdHJpbmcsICdiYXNlNjQnKS50b1N0cmluZygnYXNjaWknKTtcbn07XG4iLCJjb25zdCBjb25zVXRpbCA9IHJlcXVpcmUoJ3NpZ25zZW5zdXMnKS5jb25zVXRpbDtcbmNvbnN0IGJlZXNIZWFsZXIgPSByZXF1aXJlKFwic3dhcm11dGlsc1wiKS5iZWVzSGVhbGVyO1xuXG5mdW5jdGlvbiBCbG9ja2NoYWluKHBkcykge1xuICAgIGxldCBzd2FybSA9IG51bGw7XG5cbiAgICB0aGlzLmJlZ2luVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAodHJhbnNhY3Rpb25Td2FybSkge1xuICAgICAgICBpZiAoIXRyYW5zYWN0aW9uU3dhcm0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBzd2FybScpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dhcm0gPSB0cmFuc2FjdGlvblN3YXJtO1xuICAgICAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHBkcy5nZXRIYW5kbGVyKCkpO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbW1pdCA9IGZ1bmN0aW9uICh0cmFuc2FjdGlvbikge1xuXG4gICAgICAgIGNvbnN0IGRpZmYgPSBwZHMuY29tcHV0ZVN3YXJtVHJhbnNhY3Rpb25EaWZmKHN3YXJtLCB0cmFuc2FjdGlvbi5nZXRIYW5kbGVyKCkpO1xuICAgICAgICBjb25zdCB0ID0gY29uc1V0aWwuY3JlYXRlVHJhbnNhY3Rpb24oMCwgZGlmZik7XG4gICAgICAgIGNvbnN0IHNldCA9IHt9O1xuICAgICAgICBzZXRbdC5kaWdlc3RdID0gdDtcbiAgICAgICAgcGRzLmNvbW1pdChzZXQsIDEpO1xuICAgIH07XG59XG5cblxuZnVuY3Rpb24gVHJhbnNhY3Rpb24ocGRzSGFuZGxlcikge1xuICAgIGNvbnN0IEFMSUFTRVMgPSAnL2FsaWFzZXMnO1xuXG5cbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChhc3NldCkge1xuICAgICAgICBjb25zdCBzd2FybVR5cGVOYW1lID0gYXNzZXQuZ2V0TWV0YWRhdGEoJ3N3YXJtVHlwZU5hbWUnKTtcbiAgICAgICAgY29uc3Qgc3dhcm1JZCA9IGFzc2V0LmdldE1ldGFkYXRhKCdzd2FybUlkJyk7XG5cbiAgICAgICAgY29uc3QgYWxpYXNJbmRleCA9IG5ldyBBbGlhc0luZGV4KHN3YXJtVHlwZU5hbWUpO1xuICAgICAgICBpZiAoYXNzZXQuYWxpYXMgJiYgYWxpYXNJbmRleC5nZXRVaWQoYXNzZXQuYWxpYXMpICE9PSBzd2FybUlkKSB7XG4gICAgICAgICAgICBhbGlhc0luZGV4LmNyZWF0ZShhc3NldC5hbGlhcywgc3dhcm1JZCk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3NldC5zZXRNZXRhZGF0YSgncGVyc2lzdGVkJywgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRTd2FybSA9IGJlZXNIZWFsZXIuYXNKU09OKGFzc2V0LCBudWxsLCBudWxsKTtcblxuICAgICAgICBwZHNIYW5kbGVyLndyaXRlS2V5KHN3YXJtVHlwZU5hbWUgKyAnLycgKyBzd2FybUlkLCBKKHNlcmlhbGl6ZWRTd2FybSkpO1xuICAgIH07XG5cbiAgICB0aGlzLmxvb2t1cCA9IGZ1bmN0aW9uIChhc3NldFR5cGUsIGFpZCkgeyAvLyBhbGlhcyBzYXUgaWRcbiAgICAgICAgbGV0IGxvY2FsVWlkID0gYWlkO1xuXG4gICAgICAgIGlmIChoYXNBbGlhc2VzKGFzc2V0VHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzSW5kZXggPSBuZXcgQWxpYXNJbmRleChhc3NldFR5cGUpO1xuICAgICAgICAgICAgbG9jYWxVaWQgPSBhbGlhc0luZGV4LmdldFVpZChhaWQpIHx8IGFpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGRzSGFuZGxlci5yZWFkS2V5KGFzc2V0VHlwZSArICcvJyArIGxvY2FsVWlkKTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gJCQuYXNzZXQuc3RhcnQoYXNzZXRUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN3YXJtID0gJCQuYXNzZXQuY29udGludWUoYXNzZXRUeXBlLCBKU09OLnBhcnNlKHZhbHVlKSk7XG4gICAgICAgICAgICBzd2FybS5zZXRNZXRhZGF0YShcInBlcnNpc3RlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiBzd2FybTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmxvYWRBc3NldHMgPSBmdW5jdGlvbiAoYXNzZXRUeXBlKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IFtdO1xuXG4gICAgICAgIGNvbnN0IGFsaWFzSW5kZXggPSBuZXcgQWxpYXNJbmRleChhc3NldFR5cGUpO1xuICAgICAgICBPYmplY3Qua2V5cyhhbGlhc0luZGV4LmdldEFsaWFzZXMoKSkuZm9yRWFjaCgoYWxpYXMpID0+IHtcbiAgICAgICAgICAgIGFzc2V0cy5wdXNoKHRoaXMubG9va3VwKGFzc2V0VHlwZSwgYWxpYXMpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGFzc2V0cztcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcGRzSGFuZGxlcjtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaGFzQWxpYXNlcyhzcGFjZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuICEhcGRzSGFuZGxlci5yZWFkS2V5KHNwYWNlTmFtZSArIEFMSUFTRVMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIEFsaWFzSW5kZXgoYXNzZXRUeXBlKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKGFsaWFzLCB1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0QWxpYXNlcyA9IHRoaXMuZ2V0QWxpYXNlcygpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzc2V0QWxpYXNlc1thbGlhc10gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAkJC5lcnJvckhhbmRsZXIudGhyb3dFcnJvcihuZXcgRXJyb3IoYEFsaWFzICR7YWxpYXN9IGZvciBhc3NldHMgb2YgdHlwZSAke2Fzc2V0VHlwZX0gYWxyZWFkeSBleGlzdHNgKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFzc2V0QWxpYXNlc1thbGlhc10gPSB1aWQ7XG5cbiAgICAgICAgICAgIHBkc0hhbmRsZXIud3JpdGVLZXkoYXNzZXRUeXBlICsgQUxJQVNFUywgSihhc3NldEFsaWFzZXMpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFVpZCA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICAgICAgY29uc3QgYXNzZXRBbGlhc2VzID0gdGhpcy5nZXRBbGlhc2VzKCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXRBbGlhc2VzW2FsaWFzXTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsaWFzZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgYWxpYXNlcyA9IHBkc0hhbmRsZXIucmVhZEtleShhc3NldFR5cGUgKyBBTElBU0VTKTtcbiAgICAgICAgICAgIHJldHVybiBhbGlhc2VzID8gSlNPTi5wYXJzZShhbGlhc2VzKSA6IHt9O1xuICAgICAgICB9O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja2NoYWluOyIsInZhciBtZW1vcnlQRFMgPSByZXF1aXJlKFwiLi9Jbk1lbW9yeVBEU1wiKTtcbnZhciBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbnZhciBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cblxuZnVuY3Rpb24gRm9sZGVyUGVyc2lzdGVudFBEUyhmb2xkZXIpIHtcbiAgICB0aGlzLm1lbUNhY2hlID0gbWVtb3J5UERTLm5ld1BEUyh0aGlzKTtcblxuICAgIGZ1bmN0aW9uIG1rU2luZ2xlTGluZShzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFxuXFxyXS9nLCBcIlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQ3VycmVudFZhbHVlRmlsZW5hbWUoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZShmb2xkZXIgKyAnL2N1cnJlbnRWZXJzaW9uJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q3VycmVudFZhbHVlKHBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmKCFmcy5leGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoKS50b1N0cmluZygpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yICcsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBlcnNpc3QgPSBmdW5jdGlvbiAodHJhbnNhY3Rpb25Mb2csIGN1cnJlbnRWYWx1ZXMsIGN1cnJlbnRQdWxzZSkge1xuXG4gICAgICAgIHRyYW5zYWN0aW9uTG9nLmN1cnJlbnRQdWxzZSA9IGN1cnJlbnRQdWxzZTtcbiAgICAgICAgdHJhbnNhY3Rpb25Mb2cgPSBta1NpbmdsZUxpbmUoSlNPTi5zdHJpbmdpZnkodHJhbnNhY3Rpb25Mb2cpKSArIFwiXFxuXCI7XG5cbiAgICAgICAgZnMubWtkaXIoZm9sZGVyLCB7cmVjdXJzaXZlOiB0cnVlfSwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgICBpZiAoZXJyICYmIGVyci5jb2RlICE9PSBcIkVFWElTVFwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcy5hcHBlbmRGaWxlU3luYyhmb2xkZXIgKyAnL3RyYW5zYWN0aW9uc0xvZycsIHRyYW5zYWN0aW9uTG9nLCAndXRmOCcpO1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhtYWtlQ3VycmVudFZhbHVlRmlsZW5hbWUoKSwgSlNPTi5zdHJpbmdpZnkoY3VycmVudFZhbHVlcywgbnVsbCwgMSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaW5uZXJWYWx1ZXMgPSBnZXRDdXJyZW50VmFsdWUobWFrZUN1cnJlbnRWYWx1ZUZpbGVuYW1lKCkpO1xuICAgIHRoaXMubWVtQ2FjaGUuaW5pdGlhbGlzZShpbm5lclZhbHVlcyk7XG59XG5cbmV4cG9ydHMubmV3UERTID0gZnVuY3Rpb24gKGZvbGRlcikge1xuICAgIGNvbnN0IHBkcyA9IG5ldyBGb2xkZXJQZXJzaXN0ZW50UERTKGZvbGRlcik7XG4gICAgcmV0dXJuIHBkcy5tZW1DYWNoZTtcbn07XG4iLCJcbnZhciBjdXRpbCAgID0gcmVxdWlyZShcIi4uLy4uL3NpZ25zZW5zdXMvbGliL2NvbnNVdGlsXCIpO1xudmFyIHNzdXRpbCAgPSByZXF1aXJlKFwicHNrY3J5cHRvXCIpO1xuXG5cbmZ1bmN0aW9uIFN0b3JhZ2UocGFyZW50U3RvcmFnZSl7XG4gICAgdmFyIGNzZXQgICAgICAgICAgICA9IHt9OyAgLy8gY29udGFpbmVzIGFsbCBrZXlzIGluIHBhcmVudCBzdG9yYWdlLCBjb250YWlucyBvbmx5IGtleXMgdG91Y2hlZCBpbiBoYW5kbGVyc1xuICAgIHZhciB3cml0ZVNldCAgICAgICAgPSAhcGFyZW50U3RvcmFnZSA/IGNzZXQgOiB7fTsgICAvL2NvbnRhaW5zIG9ubHkga2V5cyBtb2RpZmllZCBpbiBoYW5kbGVyc1xuXG4gICAgdmFyIHJlYWRTZXRWZXJzaW9ucyAgPSB7fTsgLy9tZWFuaW5nZnVsIG9ubHkgaW4gaGFuZGxlcnNcbiAgICB2YXIgd3JpdGVTZXRWZXJzaW9ucyA9IHt9OyAvL3dpbGwgc3RvcmUgYWxsIHZlcnNpb25zIGdlbmVyYXRlZCBieSB3cml0ZUtleVxuXG4gICAgdmFyIHZzZCAgICAgICAgICAgICA9IFwiZW1wdHlcIjsgLy9vbmx5IGZvciBwYXJlbnQgc3RvcmFnZVxuICAgIHZhciBwcmV2aW91c1ZTRCAgICAgPSBudWxsO1xuXG4gICAgdmFyIG15Q3VycmVudFB1bHNlICAgID0gMDtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAgIGZ1bmN0aW9uIGhhc0xvY2FsS2V5KG5hbWUpe1xuICAgICAgICByZXR1cm4gY3NldC5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmhhc0tleSA9IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgICByZXR1cm4gcGFyZW50U3RvcmFnZSA/IHBhcmVudFN0b3JhZ2UuaGFzS2V5KG5hbWUpIDogaGFzTG9jYWxLZXkobmFtZSk7XG4gICAgfTtcblxuICAgIHRoaXMucmVhZEtleSA9IGZ1bmN0aW9uIHJlYWRLZXkobmFtZSl7XG4gICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgaWYoaGFzTG9jYWxLZXkobmFtZSkpe1xuICAgICAgICAgICAgdmFsdWUgPSBjc2V0W25hbWVdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKHRoaXMuaGFzS2V5KG5hbWUpKXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcmVudFN0b3JhZ2UucmVhZEtleShuYW1lKTtcbiAgICAgICAgICAgICAgICBjc2V0W25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmVhZFNldFZlcnNpb25zW25hbWVdID0gcGFyZW50U3RvcmFnZS5nZXRWZXJzaW9uKG5hbWUpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgY3NldFtuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZWFkU2V0VmVyc2lvbnNbbmFtZV0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd3JpdGVTZXRWZXJzaW9uc1tuYW1lXSA9IHJlYWRTZXRWZXJzaW9uc1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uKG5hbWUsIHJlYWxWZXJzaW9uKXtcbiAgICAgICAgdmFyIHZlcnNpb24gPSAwO1xuICAgICAgICBpZihoYXNMb2NhbEtleShuYW1lKSl7XG4gICAgICAgICAgICB2ZXJzaW9uID0gcmVhZFNldFZlcnNpb25zW25hbWVdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKHRoaXMuaGFzS2V5KG5hbWUpKXtcbiAgICAgICAgICAgICAgICBjc2V0W25hbWVdID0gcGFyZW50U3RvcmFnZS5yZWFkS2V5KCk7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IHJlYWRTZXRWZXJzaW9uc1tuYW1lXSA9IHBhcmVudFN0b3JhZ2UuZ2V0VmVyc2lvbihuYW1lKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGNzZXRbbmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmVhZFNldFZlcnNpb25zW25hbWVdID0gdmVyc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICB9O1xuXG4gICAgdGhpcy53cml0ZUtleSA9IGZ1bmN0aW9uIG1vZGlmeUtleShuYW1lLCB2YWx1ZSl7XG4gICAgICAgIHZhciBrID0gdGhpcy5yZWFkS2V5KG5hbWUpOyAvL1RPRE86IHVudXNlZCB2YXJcblxuICAgICAgICBjc2V0IFtuYW1lXSA9IHZhbHVlO1xuICAgICAgICB3cml0ZVNldFZlcnNpb25zW25hbWVdKys7XG4gICAgICAgIHdyaXRlU2V0W25hbWVdID0gdmFsdWU7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0SW5wdXRPdXRwdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbnB1dDogcmVhZFNldFZlcnNpb25zLFxuICAgICAgICAgICAgb3V0cHV0OiB3cml0ZVNldFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB0aGlzLmdldEludGVybmFsVmFsdWVzID0gZnVuY3Rpb24oY3VycmVudFB1bHNlLCB1cGRhdGVQcmV2aW91c1ZTRCl7XG4gICAgICAgIGlmKHVwZGF0ZVByZXZpb3VzVlNEKXtcbiAgICAgICAgICAgIG15Q3VycmVudFB1bHNlID0gY3VycmVudFB1bHNlO1xuICAgICAgICAgICAgcHJldmlvdXNWU0QgPSB2c2Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNzZXQ6Y3NldCxcbiAgICAgICAgICAgIHdyaXRlU2V0VmVyc2lvbnM6d3JpdGVTZXRWZXJzaW9ucyxcbiAgICAgICAgICAgIHByZXZpb3VzVlNEOnByZXZpb3VzVlNELFxuICAgICAgICAgICAgdnNkOnZzZCxcbiAgICAgICAgICAgIGN1cnJlbnRQdWxzZTpjdXJyZW50UHVsc2VcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0aWFsaXNlSW50ZXJuYWxWYWx1ZSA9IGZ1bmN0aW9uKHN0b3JlZFZhbHVlcyl7XG4gICAgICAgIGlmKCFzdG9yZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNzZXQgPSBzdG9yZWRWYWx1ZXMuY3NldDtcbiAgICAgICAgd3JpdGVTZXRWZXJzaW9ucyA9IHN0b3JlZFZhbHVlcy53cml0ZVNldFZlcnNpb25zO1xuICAgICAgICB2c2QgPSBzdG9yZWRWYWx1ZXMudnNkO1xuICAgICAgICB3cml0ZVNldCA9IGNzZXQ7XG4gICAgICAgIG15Q3VycmVudFB1bHNlID0gc3RvcmVkVmFsdWVzLmN1cnJlbnRQdWxzZTtcbiAgICAgICAgcHJldmlvdXNWU0QgPSBzdG9yZWRWYWx1ZXMucHJldmlvdXNWU0Q7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFwcGx5VHJhbnNhY3Rpb24odCl7XG4gICAgICAgIGZvcihsZXQgayBpbiB0Lm91dHB1dCl7IFxuICAgICAgICAgICAgaWYoIXQuaW5wdXQuaGFzT3duUHJvcGVydHkoaykpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IobGV0IGwgaW4gdC5pbnB1dCl7XG4gICAgICAgICAgICB2YXIgdHJhbnNhY3Rpb25WZXJzaW9uID0gdC5pbnB1dFtsXTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50VmVyc2lvbiA9IHNlbGYuZ2V0VmVyc2lvbihsKTtcbiAgICAgICAgICAgIGlmKHRyYW5zYWN0aW9uVmVyc2lvbiAhPT0gY3VycmVudFZlcnNpb24pe1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cobCwgdHJhbnNhY3Rpb25WZXJzaW9uICwgY3VycmVudFZlcnNpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihsZXQgdiBpbiB0Lm91dHB1dCl7XG4gICAgICAgICAgICBzZWxmLndyaXRlS2V5KHYsIHQub3V0cHV0W3ZdKTtcbiAgICAgICAgfVxuXG5cdFx0dmFyIGFyciA9IHByb2Nlc3MuaHJ0aW1lKCk7XG5cdFx0dmFyIGN1cnJlbnRfc2Vjb25kID0gYXJyWzBdO1xuXHRcdHZhciBkaWZmID0gY3VycmVudF9zZWNvbmQtdC5zZWNvbmQ7XG5cblx0XHRnbG9iYWxbXCJUcmFuemFjdGlvbnNfVGltZVwiXSs9ZGlmZjtcblxuXHRcdHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuY29tcHV0ZVBUQmxvY2sgPSBmdW5jdGlvbihuZXh0QmxvY2tTZXQpeyAgIC8vbWFrZSBhIHRyYW5zYWN0aW9ucyBibG9jayBmcm9tIG5leHRCbG9ja1NldCBieSByZW1vdmluZyBpbnZhbGlkIHRyYW5zYWN0aW9ucyBmcm9tIHRoZSBrZXkgdmVyc2lvbnMgcG9pbnQgb2Ygdmlld1xuICAgICAgICB2YXIgdmFsaWRCbG9jayA9IFtdO1xuICAgICAgICB2YXIgb3JkZXJlZEJ5VGltZSA9IGN1dGlsLm9yZGVyVHJhbnNhY3Rpb25zKG5leHRCbG9ja1NldCk7XG4gICAgICAgIHZhciBpID0gMDtcblxuICAgICAgICB3aGlsZShpIDwgb3JkZXJlZEJ5VGltZS5sZW5ndGgpe1xuICAgICAgICAgICAgdmFyIHQgPSBvcmRlcmVkQnlUaW1lW2ldO1xuICAgICAgICAgICAgaWYoYXBwbHlUcmFuc2FjdGlvbih0KSl7XG4gICAgICAgICAgICAgICAgdmFsaWRCbG9jay5wdXNoKHQuZGlnZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsaWRCbG9jaztcbiAgICB9O1xuXG4gICAgdGhpcy5jb21taXQgPSBmdW5jdGlvbihibG9ja1NldCl7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIG9yZGVyZWRCeVRpbWUgPSBjdXRpbC5vcmRlclRyYW5zYWN0aW9ucyhibG9ja1NldCk7XG5cbiAgICAgICAgd2hpbGUoaSA8IG9yZGVyZWRCeVRpbWUubGVuZ3RoKXtcbiAgICAgICAgICAgIHZhciB0ID0gb3JkZXJlZEJ5VGltZVtpXTtcbiAgICAgICAgICAgIGlmKCFhcHBseVRyYW5zYWN0aW9uKHQpKXsgLy9wYXJhbm9pZCBjaGVjaywgIGZhaWwgdG8gd29yayBpZiBhIG1ham9yaXR5IGlzIGNvcnJ1cHRlZFxuICAgICAgICAgICAgICAgIC8vcHJldHR5IGJhZFxuICAgICAgICAgICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGNvbW1pdCBhbiBpbnZhbGlkIGJsb2NrLiBUaGlzIGNvdWxkIGJlIGEgbmFzdHkgYnVnIG9yIHRoZSBzdGFrZWhvbGRlcnMgbWFqb3JpdHkgaXMgY29ycnVwdGVkISBJdCBzaG91bGQgbmV2ZXIgaGFwcGVuIVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBjb21taXQgYW4gaW52YWxpZCBibG9jay4gVGhpcyBjb3VsZCBiZSBhIG5hc3R5IGJ1ZyBvciB0aGUgc3Rha2Vob2xkZXJzIG1ham9yaXR5IGlzIGNvcnJ1cHRlZCEgSXQgc2hvdWxkIG5ldmVyIGhhcHBlbiFcIik7IC8vVE9ETzogcmVwbGFjZSB3aXRoIGJldHRlciBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2V0VlNEKHRydWUpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFZTRCA9IGZ1bmN0aW9uKGZvcmNlQ2FsY3VsYXRpb24pe1xuICAgICAgICBpZihmb3JjZUNhbGN1bGF0aW9uKXtcbiAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLmdldEludGVybmFsVmFsdWVzKG15Q3VycmVudFB1bHNlLCB0cnVlKTtcbiAgICAgICAgICAgIHZzZCA9IHNzdXRpbC5oYXNoVmFsdWVzKHRtcCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZzZDtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBJbk1lbW9yeVBEUyhwZXJtYW5lbnRQZXJzaXN0ZW5jZSl7XG5cbiAgICB2YXIgbWFpblN0b3JhZ2UgPSBuZXcgU3RvcmFnZShudWxsKTtcblxuXG4gICAgdGhpcy5nZXRIYW5kbGVyID0gZnVuY3Rpb24oKXsgLy8gYSB3YXkgdG8gd29yayB3aXRoIFBEU1xuICAgICAgICB2YXIgdGVtcFN0b3JhZ2UgPSBuZXcgU3RvcmFnZShtYWluU3RvcmFnZSk7XG4gICAgICAgIHJldHVybiB0ZW1wU3RvcmFnZTtcbiAgICB9O1xuXG4gICAgdGhpcy5jb21wdXRlU3dhcm1UcmFuc2FjdGlvbkRpZmYgPSBmdW5jdGlvbihzd2FybSwgZm9ya2VkUGRzKXtcbiAgICAgICAgdmFyIGlucE91dHAgICAgID0gZm9ya2VkUGRzLmdldElucHV0T3V0cHV0KCk7XG4gICAgICAgIHN3YXJtLmlucHV0ICAgICA9IGlucE91dHAuaW5wdXQ7XG4gICAgICAgIHN3YXJtLm91dHB1dCAgICA9IGlucE91dHAub3V0cHV0O1xuICAgICAgICByZXR1cm4gc3dhcm07XG4gICAgfTtcblxuICAgIHRoaXMuY29tcHV0ZVBUQmxvY2sgPSBmdW5jdGlvbihuZXh0QmxvY2tTZXQpe1xuICAgICAgICB2YXIgdGVtcFN0b3JhZ2UgPSBuZXcgU3RvcmFnZShtYWluU3RvcmFnZSk7XG4gICAgICAgIHJldHVybiB0ZW1wU3RvcmFnZS5jb21wdXRlUFRCbG9jayhuZXh0QmxvY2tTZXQpO1xuXG4gICAgfTtcblxuICAgIHRoaXMuY29tbWl0ID0gZnVuY3Rpb24oYmxvY2tTZXQsIGN1cnJlbnRQdWxzZSl7XG4gICAgICAgIG1haW5TdG9yYWdlLmNvbW1pdChibG9ja1NldCk7XG4gICAgICAgIGlmKHBlcm1hbmVudFBlcnNpc3RlbmNlKSB7XG4gICAgICAgICAgICBwZXJtYW5lbnRQZXJzaXN0ZW5jZS5wZXJzaXN0KGJsb2NrU2V0LCBtYWluU3RvcmFnZS5nZXRJbnRlcm5hbFZhbHVlcyhjdXJyZW50UHVsc2UsIGZhbHNlKSwgY3VycmVudFB1bHNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmdldFZTRCA9IGZ1bmN0aW9uICgpe1xuICAgICAgICByZXR1cm4gbWFpblN0b3JhZ2UuZ2V0VlNEKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0aWFsaXNlID0gZnVuY3Rpb24oc2F2ZWRJbnRlcm5hbFZhbHVlcyl7XG4gICAgICAgIG1haW5TdG9yYWdlLmluaXRpYWxpc2VJbnRlcm5hbFZhbHVlKHNhdmVkSW50ZXJuYWxWYWx1ZXMpO1xuICAgIH07XG5cbn1cblxuXG5leHBvcnRzLm5ld1BEUyA9IGZ1bmN0aW9uKHBlcnNpc3RlbmNlKXtcbiAgICByZXR1cm4gbmV3IEluTWVtb3J5UERTKHBlcnNpc3RlbmNlKTtcbn07IiwiY29uc3QgbWVtb3J5UERTID0gcmVxdWlyZShcIi4vSW5NZW1vcnlQRFNcIik7XG5cbmZ1bmN0aW9uIFBlcnNpc3RlbnRQRFMoe2dldEluaXRWYWx1ZXMsIHBlcnNpc3R9KSB7XG5cdHRoaXMubWVtQ2FjaGUgPSBtZW1vcnlQRFMubmV3UERTKHRoaXMpO1xuXHR0aGlzLnBlcnNpc3QgPSBwZXJzaXN0O1xuXG5cdGNvbnN0IGlubmVyVmFsdWVzID0gZ2V0SW5pdFZhbHVlcygpIHx8IG51bGw7XG5cdHRoaXMubWVtQ2FjaGUuaW5pdGlhbGlzZShpbm5lclZhbHVlcyk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMubmV3UERTID0gZnVuY3Rpb24gKHJlYWRlcldyaXRlcikge1xuXHRjb25zdCBwZHMgPSBuZXcgUGVyc2lzdGVudFBEUyhyZWFkZXJXcml0ZXIpO1xuXHRyZXR1cm4gcGRzLm1lbUNhY2hlO1xufTtcbiIsIlxuJCQuYXNzZXQuZGVzY3JpYmUoXCJBQ0xTY29wZVwiLCB7XG4gICAgcHVibGljOntcbiAgICAgICAgY29uY2VybjpcInN0cmluZzprZXlcIixcbiAgICAgICAgZGI6XCJqc29uXCJcbiAgICB9LFxuICAgIGluaXQ6ZnVuY3Rpb24oY29uY2Vybil7XG4gICAgICAgIHRoaXMuY29uY2VybiA9IGNvbmNlcm47XG4gICAgfSxcbiAgICBhZGRSZXNvdXJjZVBhcmVudCA6IGZ1bmN0aW9uKHJlc291cmNlSWQsIHBhcmVudElkKXtcbiAgICAgICAgLy9UT0RPOiBlbXB0eSBmdW5jdGlvbnMhXG4gICAgfSxcbiAgICBhZGRab25lUGFyZW50IDogZnVuY3Rpb24oem9uZUlkLCBwYXJlbnRJZCl7XG4gICAgICAgIC8vVE9ETzogZW1wdHkgZnVuY3Rpb25zIVxuICAgIH0sXG4gICAgZ3JhbnQgOmZ1bmN0aW9uKGFnZW50SWQsICByZXNvdXJjZUlkKXtcbiAgICAgICAgLy9UT0RPOiBlbXB0eSBmdW5jdGlvbnMhXG4gICAgfSxcbiAgICBhbGxvdyA6ZnVuY3Rpb24oYWdlbnRJZCwgIHJlc291cmNlSWQpe1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KTsiLCJcbiQkLmFzc2V0LmRlc2NyaWJlKFwiQWdlbnRcIiwge1xuICAgIHB1YmxpYzp7XG4gICAgICAgIGFsaWFzOlwic3RyaW5nOmtleVwiLFxuICAgICAgICBwdWJsaWNLZXk6XCJzdHJpbmdcIlxuICAgIH0sXG4gICAgaW5pdDpmdW5jdGlvbihhbGlhcywgdmFsdWUpe1xuICAgICAgICB0aGlzLmFsaWFzICAgICAgPSBhbGlhcztcbiAgICAgICAgdGhpcy5wdWJsaWNLZXkgID0gdmFsdWU7XG4gICAgfSxcbiAgICB1cGRhdGU6ZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICB0aGlzLnB1YmxpY0tleSA9IHZhbHVlO1xuICAgIH0sXG4gICAgYWRkQWdlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgSW1wbGVtZW50ZWQnKTtcbiAgICB9LFxuICAgIGxpc3RBZ2VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuXG4gICAgfSxcbiAgICByZW1vdmVBZ2VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuXG4gICAgfVxufSk7IiwiXG4kJC5hc3NldC5kZXNjcmliZShcIkJhY2t1cFwiLCB7XG4gICAgcHVibGljOntcbiAgICAgICAgaWQ6ICBcInN0cmluZ1wiLFxuICAgICAgICB1cmw6IFwic3RyaW5nXCJcbiAgICB9LFxuXG4gICAgaW5pdDpmdW5jdGlvbihpZCwgdXJsKXtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcbiAgICB9XG59KTtcbiIsIlxuJCQuYXNzZXQuZGVzY3JpYmUoXCJDU0JNZXRhXCIsIHtcblx0cHVibGljOntcblx0XHRpc01hc3RlcjpcInN0cmluZ1wiLFxuXHRcdGFsaWFzOlwic3RyaW5nOmtleVwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcInN0cmluZ1wiLFxuXHRcdGNyZWF0aW9uRGF0ZTogXCJzdHJpbmdcIixcblx0XHR1cGRhdGVkRGF0ZSA6IFwic3RyaW5nXCIsXG5cdFx0aWQ6IFwic3RyaW5nXCIsXG5cdFx0aWNvbjogXCJzdHJpbmdcIlxuXHR9LFxuXHRpbml0OmZ1bmN0aW9uKGlkKXtcblx0XHR0aGlzLmFsaWFzID0gXCJtZXRhXCI7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHR9LFxuXG5cdHNldElzTWFzdGVyOiBmdW5jdGlvbiAoaXNNYXN0ZXIpIHtcblx0XHR0aGlzLmlzTWFzdGVyID0gaXNNYXN0ZXI7XG5cdH1cblxufSk7XG4iLCJcbiQkLmFzc2V0LmRlc2NyaWJlKFwiQ1NCUmVmZXJlbmNlXCIsIHtcbiAgICBwdWJsaWM6e1xuICAgICAgICBhbGlhczpcInN0cmluZzprZXlcIixcbiAgICAgICAgc2VlZCA6XCJzdHJpbmdcIixcbiAgICAgICAgZHNlZWQ6XCJzdHJpbmdcIlxuICAgIH0sXG4gICAgaW5pdDpmdW5jdGlvbihhbGlhcywgc2VlZCwgZHNlZWQgKXtcbiAgICAgICAgdGhpcy5hbGlhcyA9IGFsaWFzO1xuICAgICAgICB0aGlzLnNlZWQgID0gc2VlZDtcbiAgICAgICAgdGhpcy5kc2VlZCA9IGRzZWVkO1xuICAgIH0sXG4gICAgdXBkYXRlOmZ1bmN0aW9uKGZpbmdlcnByaW50KXtcbiAgICAgICAgdGhpcy5maW5nZXJwcmludCA9IGZpbmdlcnByaW50O1xuICAgICAgICB0aGlzLnZlcnNpb24rKztcbiAgICB9LFxuICAgIHJlZ2lzdGVyQmFja3VwVXJsOmZ1bmN0aW9uKGJhY2t1cFVybCl7XG4gICAgICAgIHRoaXMuYmFja3Vwcy5hZGQoYmFja3VwVXJsKTtcbiAgICB9XG59KTtcbiIsIlxuJCQuYXNzZXQuZGVzY3JpYmUoXCJEb21haW5SZWZlcmVuY2VcIiwge1xuICAgIHB1YmxpYzp7XG4gICAgICAgIHJvbGU6XCJzdHJpbmc6aW5kZXhcIixcbiAgICAgICAgYWxpYXM6XCJzdHJpbmc6a2V5XCIsXG4gICAgICAgIGFkZHJlc3NlczpcIm1hcFwiLFxuICAgICAgICBjb25zdGl0dXRpb246XCJzdHJpbmdcIixcbiAgICAgICAgd29ya3NwYWNlOlwic3RyaW5nXCIsXG4gICAgICAgIHJlbW90ZUludGVyZmFjZXM6XCJtYXBcIixcbiAgICAgICAgbG9jYWxJbnRlcmZhY2VzOlwibWFwXCJcbiAgICB9LFxuICAgIGluaXQ6ZnVuY3Rpb24ocm9sZSwgYWxpYXMpe1xuICAgICAgICB0aGlzLnJvbGUgPSByb2xlO1xuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXM7XG4gICAgICAgIHRoaXMuYWRkcmVzc2VzID0ge307XG4gICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlcyA9IHt9O1xuICAgICAgICB0aGlzLmxvY2FsSW50ZXJmYWNlcyA9IHt9O1xuICAgIH0sXG4gICAgdXBkYXRlRG9tYWluQWRkcmVzczpmdW5jdGlvbihyZXBsaWNhdGlvbkFnZW50LCBhZGRyZXNzKXtcbiAgICAgICAgaWYoIXRoaXMuYWRkcmVzc2VzKXtcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc2VzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRyZXNzZXNbcmVwbGljYXRpb25BZ2VudF0gPSBhZGRyZXNzO1xuICAgIH0sXG4gICAgcmVtb3ZlRG9tYWluQWRkcmVzczpmdW5jdGlvbihyZXBsaWNhdGlvbkFnZW50KXtcbiAgICAgICAgdGhpcy5hZGRyZXNzZXNbcmVwbGljYXRpb25BZ2VudF0gPSB1bmRlZmluZWQ7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3Nlc1tyZXBsaWNhdGlvbkFnZW50XTtcbiAgICB9LFxuICAgIGFkZFJlbW90ZUludGVyZmFjZTpmdW5jdGlvbihhbGlhcywgcmVtb3RlRW5kUG9pbnQpe1xuICAgICAgICBpZighdGhpcy5yZW1vdGVJbnRlcmZhY2VzKXtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlcyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlc1thbGlhc10gPSByZW1vdGVFbmRQb2ludDtcbiAgICB9LFxuICAgIHJlbW92ZVJlbW90ZUludGVyZmFjZTpmdW5jdGlvbihhbGlhcyl7XG4gICAgICAgIGlmKHRoaXMucmVtb3RlSW50ZXJmYWNlKXtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlc1thbGlhc10gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5yZW1vdGVJbnRlcmZhY2VzW2FsaWFzXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYWRkTG9jYWxJbnRlcmZhY2U6ZnVuY3Rpb24oYWxpYXMsIHBhdGgpe1xuICAgICAgICBpZighdGhpcy5sb2NhbEludGVyZmFjZXMpe1xuICAgICAgICAgICAgdGhpcy5sb2NhbEludGVyZmFjZXMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvY2FsSW50ZXJmYWNlc1thbGlhc10gPSBwYXRoO1xuICAgIH0sXG4gICAgcmVtb3ZlTG9jYWxJbnRlcmZhY2U6ZnVuY3Rpb24oYWxpYXMpe1xuICAgICAgICBpZih0aGlzLmxvY2FsSW50ZXJmYWNlcyl7XG4gICAgICAgICAgICB0aGlzLmxvY2FsSW50ZXJmYWNlc1thbGlhc10gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEludGVyZmFjZXNbYWxpYXNdO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZXRDb25zdGl0dXRpb246ZnVuY3Rpb24ocGF0aE9yVXJsT3JDU0Ipe1xuICAgICAgICB0aGlzLmNvbnN0aXR1dGlvbiA9IHBhdGhPclVybE9yQ1NCO1xuICAgIH0sXG4gICAgZ2V0Q29uc3RpdHV0aW9uOmZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0aXR1dGlvbjtcbiAgICB9LFxuICAgIHNldFdvcmtzcGFjZTpmdW5jdGlvbihwYXRoKXtcbiAgICAgICAgdGhpcy53b3Jrc3BhY2UgPSBwYXRoO1xuICAgIH0sXG4gICAgZ2V0V29ya3NwYWNlOmZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLndvcmtzcGFjZTtcbiAgICB9XG59KTsiLCIkJC5hc3NldC5kZXNjcmliZShcIkVtYmVkZGVkRmlsZVwiLCB7XG5cdHB1YmxpYzp7XG5cdFx0YWxpYXM6XCJzdHJpbmdcIlxuXHR9LFxuXG5cdGluaXQ6ZnVuY3Rpb24oYWxpYXMpe1xuXHRcdHRoaXMuYWxpYXMgPSBhbGlhcztcblx0fVxufSk7IiwiJCQuYXNzZXQuZGVzY3JpYmUoXCJGaWxlUmVmZXJlbmNlXCIsIHtcblx0cHVibGljOntcblx0XHRhbGlhczpcInN0cmluZ1wiLFxuXHRcdHNlZWQgOlwic3RyaW5nXCIsXG5cdFx0ZHNlZWQ6XCJzdHJpbmdcIlxuXHR9LFxuXHRpbml0OmZ1bmN0aW9uKGFsaWFzLCBzZWVkLCBkc2VlZCl7XG5cdFx0dGhpcy5hbGlhcyA9IGFsaWFzO1xuXHRcdHRoaXMuc2VlZCAgPSBzZWVkO1xuXHRcdHRoaXMuZHNlZWQgPSBkc2VlZDtcblx0fVxufSk7IiwiXG4kJC5hc3NldC5kZXNjcmliZShcImtleVwiLCB7XG4gICAgcHVibGljOntcbiAgICAgICAgYWxpYXM6XCJzdHJpbmdcIlxuICAgIH0sXG4gICAgaW5pdDpmdW5jdGlvbihhbGlhcywgdmFsdWUpe1xuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXM7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9LFxuICAgIHVwZGF0ZTpmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9ICQkLmxpYnJhcnkoZnVuY3Rpb24oKXtcbiAgICByZXF1aXJlKFwiLi9Eb21haW5SZWZlcmVuY2VcIik7XG4gICAgcmVxdWlyZShcIi4vQ1NCUmVmZXJlbmNlXCIpO1xuICAgIHJlcXVpcmUoXCIuL0FnZW50XCIpO1xuICAgIHJlcXVpcmUoXCIuL0JhY2t1cFwiKTtcbiAgICByZXF1aXJlKFwiLi9BQ0xTY29wZVwiKTtcbiAgICByZXF1aXJlKFwiLi9LZXlcIik7XG4gICAgcmVxdWlyZShcIi4vdHJhbnNhY3Rpb25zXCIpO1xuICAgIHJlcXVpcmUoXCIuL0ZpbGVSZWZlcmVuY2VcIik7XG4gICAgcmVxdWlyZShcIi4vRW1iZWRkZWRGaWxlXCIpO1xuICAgIHJlcXVpcmUoJy4vQ1NCTWV0YScpO1xufSk7IiwiJCQudHJhbnNhY3Rpb24uZGVzY3JpYmUoXCJ0cmFuc2FjdGlvbnNcIiwge1xuICAgIHVwZGF0ZUtleTogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gJCQuYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHRoaXMpO1xuICAgICAgICB2YXIga2V5ID0gdHJhbnNhY3Rpb24ubG9va3VwKFwiS2V5XCIsIGtleSk7XG4gICAgICAgIHZhciBrZXlQZXJtaXNzaW9ucyA9IHRyYW5zYWN0aW9uLmxvb2t1cChcIkFDTFNjb3BlXCIsIFwiS2V5c0NvbmNlcm5cIik7XG4gICAgICAgIGlmIChrZXlQZXJtaXNzaW9ucy5hbGxvdyh0aGlzLmFnZW50SWQsIGtleSkpIHtcbiAgICAgICAgICAgIGtleS51cGRhdGUodmFsdWUpO1xuICAgICAgICAgICAgdHJhbnNhY3Rpb24uYWRkKGtleSk7XG4gICAgICAgICAgICAkJC5ibG9ja2NoYWluLmNvbW1pdCh0cmFuc2FjdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlY3VyaXR5RXJyb3IoXCJBZ2VudCBcIiArIHRoaXMuYWdlbnRJZCArIFwiIGRlbmllZCB0byBjaGFuZ2Uga2V5IFwiICsga2V5KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYWRkQ2hpbGQ6IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSAkJC5ibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgdmFyIHJlZmVyZW5jZSA9ICQkLmNvbnRyYWN0LnN0YXJ0KFwiRG9tYWluUmVmZXJlbmNlXCIsIFwiaW5pdFwiLCBcImNoaWxkXCIsIGFsaWFzKTtcbiAgICAgICAgdHJhbnNhY3Rpb24uYWRkKHJlZmVyZW5jZSk7XG4gICAgICAgICQkLmJsb2NrY2hhaW4uY29tbWl0KHRyYW5zYWN0aW9uKTtcbiAgICB9LFxuICAgIGFkZFBhcmVudDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciByZWZlcmVuY2UgPSAkJC5jb250cmFjdC5zdGFydChcIkRvbWFpblJlZmVyZW5jZVwiLCBcImluaXRcIiwgXCJjaGlsZFwiLCBhbGlhcyk7XG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb24uc2F2ZShyZWZlcmVuY2UpO1xuICAgICAgICAkJC5ibG9ja2NoYWluLnBlcnNpc3QodGhpcy50cmFuc2FjdGlvbik7XG4gICAgfSxcbiAgICBhZGRBZ2VudDogZnVuY3Rpb24gKGFsaWFzLCBwdWJsaWNLZXkpIHtcbiAgICAgICAgdmFyIHJlZmVyZW5jZSA9ICQkLmNvbnRyYWN0LnN0YXJ0KFwiQWdlbnRcIiwgXCJpbml0XCIsIGFsaWFzLCBwdWJsaWNLZXkpO1xuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uLnNhdmUocmVmZXJlbmNlKTtcbiAgICAgICAgJCQuYmxvY2tjaGFpbi5wZXJzaXN0KHRoaXMudHJhbnNhY3Rpb24pO1xuICAgIH0sXG4gICAgdXBkYXRlQWdlbnQ6IGZ1bmN0aW9uIChhbGlhcywgcHVibGljS2V5KSB7XG4gICAgICAgIHZhciBhZ2VudCA9IHRoaXMudHJhbnNhY3Rpb24ubG9va3VwKFwiQWdlbnRcIiwgYWxpYXMpO1xuICAgICAgICBhZ2VudC51cGRhdGUocHVibGljS2V5KTtcbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5zYXZlKHJlZmVyZW5jZSk7XG4gICAgICAgICQkLmJsb2NrY2hhaW4ucGVyc2lzdCh0aGlzLnRyYW5zYWN0aW9uKTtcbiAgICB9XG59KTtcblxuXG4kJC5uZXdUcmFuc2FjdGlvbiA9IGZ1bmN0aW9uKHRyYW5zYWN0aW9uRmxvdyxjdG9yLC4uLmFyZ3Mpe1xuICAgIHZhciB0cmFuc2FjdGlvbiA9ICQkLnN3YXJtLnN0YXJ0KCB0cmFuc2FjdGlvbkZsb3cpO1xuICAgIHRyYW5zYWN0aW9uLm1ldGEoXCJhZ2VudElkXCIsICQkLmN1cnJlbnRBZ2VudElkKTtcbiAgICB0cmFuc2FjdGlvbi5tZXRhKFwiY29tbWFuZFwiLCBcInJ1bkV2ZXJ5V2hlcmVcIik7XG4gICAgdHJhbnNhY3Rpb24ubWV0YShcImN0b3JcIiwgY3Rvcik7XG4gICAgdHJhbnNhY3Rpb24ubWV0YShcImFyZ3NcIiwgYXJncyk7XG4gICAgdHJhbnNhY3Rpb24uc2lnbigpO1xuICAgIC8vJCQuYmxvY2tjaGFpbi5zZW5kRm9yQ29uc2VudCh0cmFuc2FjdGlvbik7XG4gICAgLy90ZW1wb3JhcnkgdW50aWwgY29uc2VudCBsYXllciBpcyBhY3RpdmF0ZWRcbiAgICB0cmFuc2FjdGlvbltjdG9yXS5hcHBseSh0cmFuc2FjdGlvbixhcmdzKTtcbn07XG5cbi8qXG51c2FnZXM6XG4gICAgJCQubmV3VHJhbnNhY3Rpb24oXCJkb21haW4udHJhbnNhY3Rpb25zXCIsIFwidXBkYXRlS2V5XCIsIFwia2V5XCIsIFwidmFsdWVcIilcblxuICovXG4iLCIvLyBjb25zdCBzaGFyZWRQaGFzZXMgPSByZXF1aXJlKCcuL3NoYXJlZFBoYXNlcycpO1xuLy8gY29uc3QgYmVlc0hlYWxlciA9IHJlcXVpcmUoJ3N3YXJtdXRpbHMnKS5iZWVzSGVhbGVyO1xuXG4kJC5zd2FybXMuZGVzY3JpYmUoXCJhZ2VudHNcIiwge1xuICAgIGFkZDogZnVuY3Rpb24gKGFsaWFzLCBwdWJsaWNLZXkpIHtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSAkJC5ibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuICAgICAgICBjb25zdCBhZ2VudEFzc2V0ID0gdHJhbnNhY3Rpb24ubG9va3VwKCdnbG9iYWwuQWdlbnQnLCBhbGlhcyk7XG5cbiAgICAgICAgYWdlbnRBc3NldC5pbml0KGFsaWFzLCBwdWJsaWNLZXkpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb24uYWRkKGFnZW50QXNzZXQpO1xuXG4gICAgICAgICAgICAkJC5ibG9ja2NoYWluLmNvbW1pdCh0cmFuc2FjdGlvbik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKFwiQWdlbnQgYWxyZWFkeSBleGlzdHNcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXR1cm4obnVsbCwgYWxpYXMpO1xuICAgIH0sXG59KTtcbiIsImNvbnN0IHNoYXJlZFBoYXNlcyA9IHJlcXVpcmUoJy4vc2hhcmVkUGhhc2VzJyk7XG5jb25zdCBiZWVzSGVhbGVyID0gcmVxdWlyZSgnc3dhcm11dGlscycpLmJlZXNIZWFsZXI7XG5cbiQkLnN3YXJtcy5kZXNjcmliZShcImRvbWFpbnNcIiwge1xuICAgIGFkZDogZnVuY3Rpb24gKHJvbGUsIGFsaWFzKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gJCQuYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHt9KTtcbiAgICAgICAgY29uc3QgZG9tYWluc1N3YXJtID0gdHJhbnNhY3Rpb24ubG9va3VwKCdnbG9iYWwuRG9tYWluUmVmZXJlbmNlJywgYWxpYXMpO1xuXG4gICAgICAgIGlmICghZG9tYWluc1N3YXJtKSB7XG4gICAgICAgICAgICB0aGlzLnJldHVybihuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHN3YXJtIG5hbWVkIFwiZ2xvYmFsLkRvbWFpblJlZmVyZW5jZVwiJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9tYWluc1N3YXJtLmluaXQocm9sZSwgYWxpYXMpO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hZGQoZG9tYWluc1N3YXJtKTtcblxuICAgICAgICAgICAgJCQuYmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuICAgICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICAgICAgIHRoaXMucmV0dXJuKG5ldyBFcnJvcihcIkRvbWFpbiBhbGxyZWFkeSBleGlzdHMhXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmV0dXJuKG51bGwsIGFsaWFzKTtcbiAgICB9LFxuICAgIGdldERvbWFpbkRldGFpbHM6ZnVuY3Rpb24oYWxpYXMpe1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9ICQkLmJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG4gICAgICAgIGNvbnN0IGRvbWFpbiA9IHRyYW5zYWN0aW9uLmxvb2t1cCgnZ2xvYmFsLkRvbWFpblJlZmVyZW5jZScsIGFsaWFzKTtcblxuICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBzd2FybSBuYW1lZCBcImdsb2JhbC5Eb21haW5SZWZlcmVuY2VcIicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmV0dXJuKG51bGwsIGJlZXNIZWFsZXIuYXNKU09OKGRvbWFpbikucHVibGljVmFycyk7XG4gICAgfSxcbiAgICBjb25uZWN0RG9tYWluVG9SZW1vdGUoZG9tYWluTmFtZSwgYWxpYXMsIHJlbW90ZUVuZFBvaW50KXtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSAkJC5ibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuICAgICAgICBjb25zdCBkb21haW4gPSB0cmFuc2FjdGlvbi5sb29rdXAoJ2dsb2JhbC5Eb21haW5SZWZlcmVuY2UnLCBkb21haW5OYW1lKTtcblxuICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBzd2FybSBuYW1lZCBcImdsb2JhbC5Eb21haW5SZWZlcmVuY2VcIicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRvbWFpbi5hZGRSZW1vdGVJbnRlcmZhY2UoYWxpYXMsIHJlbW90ZUVuZFBvaW50KTtcblxuICAgICAgICB0cnl7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hZGQoZG9tYWluKTtcblxuICAgICAgICAgICAgJCQuYmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuICAgICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB0aGlzLnJldHVybihuZXcgRXJyb3IoXCJEb21haW4gdXBkYXRlIGZhaWxlZCFcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXR1cm4obnVsbCwgYWxpYXMpO1xuICAgIH0sXG4gICAgLy8gZ2V0RG9tYWluRGV0YWlsczogc2hhcmVkUGhhc2VzLmdldEFzc2V0RmFjdG9yeSgnZ2xvYmFsLkRvbWFpblJlZmVyZW5jZScpLFxuICAgIGdldERvbWFpbnM6IHNoYXJlZFBoYXNlcy5nZXRBbGxBc3NldHNGYWN0b3J5KCdnbG9iYWwuRG9tYWluUmVmZXJlbmNlJylcbn0pO1xuIiwicmVxdWlyZSgnLi9kb21haW5Td2FybXMnKTtcbnJlcXVpcmUoJy4vYWdlbnRzU3dhcm0nKTsiLCJjb25zdCBiZWVzSGVhbGVyID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIikuYmVlc0hlYWxlcjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0QXNzZXRGYWN0b3J5OiBmdW5jdGlvbihhc3NldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9ICQkLmJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG4gICAgICAgICAgICBjb25zdCBkb21haW5SZWZlcmVuY2VTd2FybSA9IHRyYW5zYWN0aW9uLmxvb2t1cChhc3NldFR5cGUsIGFsaWFzKTtcblxuICAgICAgICAgICAgaWYoIWRvbWFpblJlZmVyZW5jZVN3YXJtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBzd2FybSBuYW1lZCBcIiR7YXNzZXRUeXBlfVwiYCkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXR1cm4odW5kZWZpbmVkLCBiZWVzSGVhbGVyLmFzSlNPTihkb21haW5SZWZlcmVuY2VTd2FybSkpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgZ2V0QWxsQXNzZXRzRmFjdG9yeTogZnVuY3Rpb24oYXNzZXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gJCQuYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHt9KTtcbiAgICAgICAgICAgIGNvbnN0IGRvbWFpbnMgPSB0cmFuc2FjdGlvbi5sb2FkQXNzZXRzKGFzc2V0VHlwZSkgfHwgW107XG5cbiAgICAgICAgICAgIHRoaXMucmV0dXJuKHVuZGVmaW5lZCwgZG9tYWlucy5tYXAoKGRvbWFpbikgPT4gYmVlc0hlYWxlci5hc0pTT04oZG9tYWluKSkpO1xuICAgICAgICB9O1xuICAgIH1cbn07IiwiLypcbmNvbnNlbnN1cyBoZWxwZXIgZnVuY3Rpb25zXG4qL1xuXG52YXIgcHNrY3J5cHRvID0gcmVxdWlyZShcInBza2NyeXB0b1wiKTtcblxuXG5mdW5jdGlvbiBQdWxzZShzaWduZXIsIGN1cnJlbnRQdWxzZU51bWJlciwgYmxvY2ssIG5ld1RyYW5zYWN0aW9ucywgdnNkLCB0b3AsIGxhc3QpIHtcbiAgICB0aGlzLnNpZ25lciAgICAgICAgID0gc2lnbmVyOyAgICAgICAgICAgICAgIC8vYS5rLmEuIGRlbGVnYXRlZEFnZW50TmFtZVxuICAgIHRoaXMuY3VycmVudFB1bHNlICAgPSBjdXJyZW50UHVsc2VOdW1iZXI7XG4gICAgdGhpcy5sc2V0ICAgICAgICAgICA9IG5ld1RyYW5zYWN0aW9uczsgICAgICAvL2RpZ2VzdCAtPiB0cmFuc2FjdGlvblxuICAgIHRoaXMucHRCbG9jayAgICAgICAgPSBibG9jazsgICAgICAgICAgICAgICAgLy9hcnJheSBvZiBkaWdlc3RzXG4gICAgdGhpcy52c2QgICAgICAgICAgICA9IHZzZDtcbiAgICB0aGlzLnRvcCAgICAgICAgICAgID0gdG9wOyAgICAgICAgICAgICAgICAgIC8vIGEuay5hLiB0b3BQdWxzZUNvbnNlbnN1c1xuICAgIHRoaXMubGFzdCAgICAgICAgICAgPSBsYXN0OyAgICAgICAgICAgICAgICAgLy8gYS5rLmEuIGxhc3RQdWxzZUFjaGlldmVkQ29uc2Vuc3VzXG59XG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uKGN1cnJlbnRQdWxzZSwgc3dhcm0pIHtcbiAgICB0aGlzLmlucHV0ICAgICAgPSBzd2FybS5pbnB1dDtcbiAgICB0aGlzLm91dHB1dCAgICAgPSBzd2FybS5vdXRwdXQ7XG4gICAgdGhpcy5zd2FybSAgICAgID0gc3dhcm07XG5cbiAgICB2YXIgYXJyID0gcHJvY2Vzcy5ocnRpbWUoKTtcbiAgICB0aGlzLnNlY29uZCAgICAgPSBhcnJbMF07XG4gICAgdGhpcy5uYW5vc2Vjb2QgID0gYXJyWzFdO1xuXG4gICAgdGhpcy5DUCAgICAgICAgID0gY3VycmVudFB1bHNlO1xuICAgIHRoaXMuZGlnZXN0ICAgICA9IHBza2NyeXB0by5oYXNoVmFsdWVzKHRoaXMpO1xufVxuXG5cbmV4cG9ydHMuY3JlYXRlVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAoY3VycmVudFB1bHNlLCBzd2FybSkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oY3VycmVudFB1bHNlLCBzd2FybSk7XG59XG5cbmV4cG9ydHMuY3JlYXRlUHVsc2UgPSBmdW5jdGlvbiAoc2lnbmVyLCBjdXJyZW50UHVsc2VOdW1iZXIsIGJsb2NrLCBuZXdUcmFuc2FjdGlvbnMsIHZzZCwgdG9wLCBsYXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQdWxzZShzaWduZXIsIGN1cnJlbnRQdWxzZU51bWJlciwgYmxvY2ssIG5ld1RyYW5zYWN0aW9ucywgdnNkLCB0b3AsIGxhc3QpO1xufVxuXG5leHBvcnRzLm9yZGVyVHJhbnNhY3Rpb25zID0gZnVuY3Rpb24gKHBzZXQpIHsgLy9vcmRlciBpbiBwbGFjZSB0aGUgcHNldCBhcnJheVxuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IgKHZhciBkIGluIHBzZXQpIHtcbiAgICAgICAgYXJyLnB1c2gocHNldFtkXSk7XG4gICAgfVxuXG4gICAgYXJyLnNvcnQoZnVuY3Rpb24gKHQxLCB0Mikge1xuICAgICAgICBpZiAodDEuQ1AgPCB0Mi5DUCkgcmV0dXJuIC0xO1xuICAgICAgICBpZiAodDEuQ1AgPiB0Mi5DUCkgcmV0dXJuIDE7XG4gICAgICAgIGlmICh0MS5zZWNvbmQgPCB0Mi5zZWNvbmQpIHJldHVybiAtMTtcbiAgICAgICAgaWYgKHQxLnNlY29uZCA+IHQyLnNlY29uZCkgcmV0dXJuIDE7XG4gICAgICAgIGlmICh0MS5uYW5vc2Vjb2QgPCB0Mi5uYW5vc2Vjb2QpIHJldHVybiAtMTtcbiAgICAgICAgaWYgKHQxLm5hbm9zZWNvZCA+IHQyLm5hbm9zZWNvZCkgcmV0dXJuIDE7XG4gICAgICAgIGlmICh0MS5kaWdlc3QgPCB0Mi5kaWdlc3QpIHJldHVybiAtMTtcbiAgICAgICAgaWYgKHQxLmRpZ2VzdCA+IHQyLmRpZ2VzdCkgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiAwOyAvL29ubHkgZm9yIGlkZW50aWNhbCB0cmFuc2FjdGlvbnMuLi5cbiAgICB9KVxuICAgIHJldHVybiBhcnI7XG59XG5cbmZ1bmN0aW9uIGdldE1ham9yaXR5RmllbGRJblB1bHNlcyhhbGxQdWxzZXMsIGZpZWxkTmFtZSwgZXh0cmFjdEZpZWxkTmFtZSwgdm90aW5nQm94KSB7XG4gICAgdmFyIGNvdW50ZXJGaWVsZHMgPSB7fTtcbiAgICB2YXIgbWFqb3JpdHlWYWx1ZTtcbiAgICB2YXIgcHVsc2U7XG5cbiAgICBmb3IgKHZhciBhZ2VudCBpbiBhbGxQdWxzZXMpIHtcbiAgICAgICAgcHVsc2UgPSBhbGxQdWxzZXNbYWdlbnRdO1xuICAgICAgICB2YXIgdiA9IHB1bHNlW2ZpZWxkTmFtZV07XG4gICAgICAgIGNvdW50ZXJGaWVsZHNbdl0gPSB2b3RpbmdCb3gudm90ZShjb3VudGVyRmllbGRzW3ZdKTsgICAgICAgIC8vICsrY291bnRlckZpZWxkc1t2XVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gY291bnRlckZpZWxkcykge1xuICAgICAgICBpZiAodm90aW5nQm94LmlzTWFqb3JpdGFyaWFuKGNvdW50ZXJGaWVsZHNbaV0pKSB7XG4gICAgICAgICAgICBtYWpvcml0eVZhbHVlID0gaTtcbiAgICAgICAgICAgIGlmIChmaWVsZE5hbWUgPT0gZXh0cmFjdEZpZWxkTmFtZSkgeyAgICAgICAgICAgICAgICAgICAgLy8/Pz8gXCJ2c2RcIiwgXCJ2c2RcIlxuICAgICAgICAgICAgICAgIHJldHVybiBtYWpvcml0eVZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcImJsb2NrRGlnZXN0XCIsIFwicHRCbG9ja1wiXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYWdlbnQgaW4gYWxsUHVsc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1bHNlID0gYWxsUHVsc2VzW2FnZW50XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHB1bHNlW2ZpZWxkTmFtZV0gPT0gbWFqb3JpdHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHB1bHNlW2V4dHJhY3RGaWVsZE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBcIm5vbmVcIjsgLy90aGVyZSBpcyBubyBtYWpvcml0eVxufVxuXG5leHBvcnRzLmRldGVjdE1ham9yaXRhcmlhblZTRCA9IGZ1bmN0aW9uIChwdWxzZSwgcHVsc2VzSGlzdG9yeSwgdm90aW5nQm94KSB7XG4gICAgaWYgKHB1bHNlID09IDApIHJldHVybiBcIm5vbmVcIjtcbiAgICB2YXIgcHVsc2VzID0gcHVsc2VzSGlzdG9yeVtwdWxzZV07XG4gICAgdmFyIG1ham9yaXR5VmFsdWUgPSBnZXRNYWpvcml0eUZpZWxkSW5QdWxzZXMocHVsc2VzLCBcInZzZFwiLCBcInZzZFwiLCB2b3RpbmdCb3gpO1xuICAgIHJldHVybiBtYWpvcml0eVZhbHVlO1xufVxuXG4vKlxuICAgIGRldGVjdCBhIGNhbmRpZGF0ZSBibG9ja1xuICovXG5leHBvcnRzLmRldGVjdE1ham9yaXRhcmlhblBUQmxvY2sgPSBmdW5jdGlvbiAocHVsc2UsIHB1bHNlc0hpc3RvcnksIHZvdGluZ0JveCkge1xuICAgIGlmIChwdWxzZSA9PSAwKSByZXR1cm4gXCJub25lXCI7XG4gICAgdmFyIHB1bHNlcyA9IHB1bHNlc0hpc3RvcnlbcHVsc2VdO1xuICAgIHZhciBidEJsb2NrID0gZ2V0TWFqb3JpdHlGaWVsZEluUHVsc2VzKHB1bHNlcywgXCJibG9ja0RpZ2VzdFwiLCBcInB0QmxvY2tcIiwgdm90aW5nQm94KTtcbiAgICByZXR1cm4gYnRCbG9jaztcbn1cblxuZXhwb3J0cy5tYWtlU2V0RnJvbUJsb2NrID0gZnVuY3Rpb24gKGtub3duVHJhbnNhY3Rpb25zLCBibG9jaykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJsb2NrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0gYmxvY2tbaV07XG4gICAgICAgIHJlc3VsdFtpdGVtXSA9IGtub3duVHJhbnNhY3Rpb25zW2l0ZW1dO1xuICAgICAgICBpZiAoIWtub3duVHJhbnNhY3Rpb25zLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXcgRXJyb3IoXCJEbyBub3QgZ2l2ZSB1bmtub3duIHRyYW5zYWN0aW9uIGRpZ2VzdHMgdG8gbWFrZVNldEZyb21CbG9jayBcIiArIGl0ZW0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnRzLnNldHNDb25jYXQgPSBmdW5jdGlvbiAodGFyZ2V0LCBmcm9tKSB7XG4gICAgZm9yICh2YXIgZCBpbiBmcm9tKSB7XG4gICAgICAgIHRhcmdldFtkXSA9IGZyb21bZF07XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbmV4cG9ydHMuc2V0c1JlbW92ZUFycmF5ID0gZnVuY3Rpb24gKHRhcmdldCwgYXJyKSB7XG4gICAgYXJyLmZvckVhY2goaXRlbSA9PiBkZWxldGUgdGFyZ2V0W2l0ZW1dKTtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnRzLnNldHNSZW1vdmVQdEJsb2NrQW5kUGFzdFRyYW5zYWN0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXQsIGFyciwgbWF4UHVsc2UpIHtcbiAgICB2YXIgdG9CZVJlbW92ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBkIGluIHRhcmdldCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFycltpXSA9PSBkIHx8IHRhcmdldFtkXS5DUCA8IG1heFB1bHNlKSB7XG4gICAgICAgICAgICAgICAgdG9CZVJlbW92ZWQucHVzaChkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvQmVSZW1vdmVkLmZvckVhY2goaXRlbSA9PiBkZWxldGUgdGFyZ2V0W2l0ZW1dKTtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnRzLmNyZWF0ZURlbW9jcmF0aWNWb3RpbmdCb3ggPSBmdW5jdGlvbiAoc2hhcmVIb2xkZXJzQ291bnRlcikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHZvdGU6IGZ1bmN0aW9uIChwcmV2aW9zVmFsdWUpIHtcbiAgICAgICAgICAgIGlmICghcHJldmlvc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcHJldmlvc1ZhbHVlID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcmV2aW9zVmFsdWUgKyAxO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzTWFqb3JpdGFyaWFuOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2codmFsdWUgLCBNYXRoLmZsb29yKHNoYXJlSG9sZGVyc0NvdW50ZXIvMikgKyAxKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA+PSBNYXRoLmZsb29yKHNoYXJlSG9sZGVyc0NvdW50ZXIgLyAyKSArIDE7XG4gICAgICAgIH1cbiAgICB9O1xufVxuIiwicmVxdWlyZShcIi4vZmxvd3MvQ1NCbWFuYWdlclwiKTtcbnJlcXVpcmUoXCIuL2Zsb3dzL3JlbW90ZVN3YXJtaW5nXCIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuY29uc3QgaHR0cFdyYXBwZXIgPSByZXF1aXJlKCcuL2xpYnMvaHR0cC13cmFwcGVyJyk7XG5jb25zdCBlZGZzID0gcmVxdWlyZShcImVkZnNcIik7XG5jb25zdCBFREZTTWlkZGxld2FyZSA9IGVkZnMuRURGU01pZGRsZXdhcmU7XG5jb25zdCBTZXJ2ZXIgPSBodHRwV3JhcHBlci5TZXJ2ZXI7XG5jb25zdCBSb3V0ZXIgPSBodHRwV3JhcHBlci5Sb3V0ZXI7XG5jb25zdCBUb2tlbkJ1Y2tldCA9IHJlcXVpcmUoJy4vbGlicy9Ub2tlbkJ1Y2tldCcpO1xuY29uc3QgbXNncGFjayA9IHJlcXVpcmUoJ0Btc2dwYWNrL21zZ3BhY2snKTtcblxuXG5mdW5jdGlvbiBWaXJ0dWFsTVEoe2xpc3RlbmluZ1BvcnQsIHJvb3RGb2xkZXIsIHNzbENvbmZpZ30sIGNhbGxiYWNrKSB7XG5cdGNvbnN0IHBvcnQgPSBsaXN0ZW5pbmdQb3J0IHx8IDgwODA7XG5cdGNvbnN0IHNlcnZlciA9IG5ldyBTZXJ2ZXIoc3NsQ29uZmlnKS5saXN0ZW4ocG9ydCk7XG5cdGNvbnN0IHRva2VuQnVja2V0ID0gbmV3IFRva2VuQnVja2V0KDYwMDAwMCwgMSwgMTApO1xuXHRjb25zdCBDU0Jfc3RvcmFnZV9mb2xkZXIgPSBcInVwbG9hZHNcIjtcblx0Y29uc3QgU1dBUk1fc3RvcmFnZV9mb2xkZXIgPSBcInN3YXJtc1wiO1xuXHRjb25zb2xlLmxvZyhcIkxpc3RlbmluZyBvbiBwb3J0OlwiLCBwb3J0KTtcblxuXHR0aGlzLmNsb3NlID0gc2VydmVyLmNsb3NlO1xuXHQkJC5mbG93LnN0YXJ0KFwiQ1NCbWFuYWdlclwiKS5pbml0KHBhdGguam9pbihyb290Rm9sZGVyLCBDU0Jfc3RvcmFnZV9mb2xkZXIpLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHR0aHJvdyBlcnI7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNvbnNvbGUubG9nKFwiQ1NCTWFuYWdlciBpcyB1c2luZyBmb2xkZXJcIiwgcmVzdWx0KTtcblx0XHRcdCQkLmZsb3cuc3RhcnQoXCJSZW1vdGVTd2FybWluZ1wiKS5pbml0KHBhdGguam9pbihyb290Rm9sZGVyLCBTV0FSTV9zdG9yYWdlX2ZvbGRlciksIGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcblx0XHRcdFx0cmVnaXN0ZXJFbmRwb2ludHMoKTtcblx0XHRcdFx0aWYgKGNhbGxiYWNrKSB7XG5cdFx0XHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KTtcblxuXHRmdW5jdGlvbiByZWdpc3RlckVuZHBvaW50cygpIHtcblx0XHRjb25zdCByb3V0ZXIgPSBuZXcgUm91dGVyKHNlcnZlcik7XG5cdFx0cm91dGVyLnVzZShcIi9FREZTXCIsIChuZXdTZXJ2ZXIpID0+IHtcblx0XHRcdG5ldyBFREZTTWlkZGxld2FyZShuZXdTZXJ2ZXIpO1xuXHRcdH0pO1xuXG5cdFx0c2VydmVyLnVzZShmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG5cdFx0XHRyZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJywgJ0dFVCwgUE9TVCwgUFVULCBERUxFVEUnKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnLCAnQ29udGVudC1UeXBlLCBBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nKTtcblx0XHRcdHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJywgdHJ1ZSk7XG5cdFx0XHRuZXh0KCk7XG5cdFx0fSk7XG5cbiAgICAgICAgc2VydmVyLnVzZShmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGlwID0gcmVzLnNvY2tldC5yZW1vdGVBZGRyZXNzO1xuXG4gICAgICAgICAgICB0b2tlbkJ1Y2tldC50YWtlVG9rZW4oaXAsIHRva2VuQnVja2V0LkNPU1RfTUVESVVNLCBmdW5jdGlvbihlcnIsIHJlbWFpbmVkVG9rZW5zKSB7XG4gICAgICAgICAgICBcdHJlcy5zZXRIZWFkZXIoJ1gtUmF0ZUxpbWl0LUxpbWl0JywgdG9rZW5CdWNrZXQuZ2V0TGltaXRCeUNvc3QodG9rZW5CdWNrZXQuQ09TVF9NRURJVU0pKTtcbiAgICAgICAgICAgIFx0cmVzLnNldEhlYWRlcignWC1SYXRlTGltaXQtUmVtYWluaW5nJywgdG9rZW5CdWNrZXQuZ2V0UmVtYWluaW5nVG9rZW5CeUNvc3QocmVtYWluZWRUb2tlbnMsIHRva2VuQnVja2V0LkNPU1RfTUVESVVNKSk7XG5cbiAgICAgICAgICAgIFx0aWYoZXJyKSB7XG4gICAgICAgICAgICBcdFx0c3dpdGNoIChlcnIpIHtcbiAgICAgICAgICAgIFx0XHRcdGNhc2UgVG9rZW5CdWNrZXQuRVJST1JfTElNSVRfRVhDRUVERUQ6XG4gICAgICAgICAgICBcdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gNDI5O1xuICAgICAgICAgICAgXHRcdFx0XHRicmVhaztcbiAgICAgICAgICAgIFx0XHRcdGRlZmF1bHQ6XG4gICAgICAgICAgICBcdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuXG4gICAgICAgICAgICBcdFx0fVxuXG4gICAgICAgICAgICBcdFx0cmVzLmVuZCgpO1xuICAgICAgICAgICAgXHRcdHJldHVybjtcbiAgICAgICAgICAgIFx0fVxuXG4gICAgICAgICAgICBcdG5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZXJ2ZXIucG9zdCgnLzpjaGFubmVsSWQnLCBmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRUeXBlID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddO1xuXG4gICAgICAgICAgICBpZiAoY29udGVudFR5cGUgPT09ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IE51bWJlci5wYXJzZUludChyZXEuaGVhZGVyc1snY29udGVudC1sZW5ndGgnXSk7XG5cbiAgICAgICAgICAgICAgICBzdHJlYW1Ub0J1ZmZlcihyZXEsIGNvbnRlbnRMZW5ndGgsIChlcnIsIGJvZHlBc0J1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxLmJvZHkgPSBtc2dwYWNrLmRlY29kZShib2R5QXNCdWZmZXIpO1xuXG4gICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8qKioqKiBIRUxQRVIgRlVOQ1RJT04gKioqKiovXG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHN0cmVhbVRvQnVmZmVyKHN0cmVhbSwgYnVmZmVyU2l6ZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuYWxsb2MoYnVmZmVyU2l6ZSk7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRPZmZzZXQgPSAwO1xuXG4gICAgICAgICAgICAgICAgc3RyZWFtXG4gICAgICAgICAgICAgICAgICAgIC5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNodW5rU2l6ZSA9IGNodW5rLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5leHRPZmZzZXQgPSBjaHVua1NpemUgKyBjdXJyZW50T2Zmc2V0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudE9mZnNldCA+IGJ1ZmZlclNpemUgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignU3RyZWFtIGlzIGJpZ2dlciB0aGFuIHJlcG9ydGVkIHNpemUnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHVuc2FmZUFwcGVuZEluQnVmZmVyRnJvbU9mZnNldChidWZmZXIsIGNodW5rLCBjdXJyZW50T2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRPZmZzZXQgPSBuZXh0T2Zmc2V0O1xuXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBidWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oJ2Vycm9yJywgY2FsbGJhY2spO1xuXG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gdW5zYWZlQXBwZW5kSW5CdWZmZXJGcm9tT2Zmc2V0KGJ1ZmZlciwgZGF0YVRvQXBwZW5kLCBvZmZzZXQpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkYXRhU2l6ZSA9IGRhdGFUb0FwcGVuZC5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyW29mZnNldCsrXSA9IGRhdGFUb0FwcGVuZFtpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VydmVyLnBvc3QoJy86Y2hhbm5lbElkJywgZnVuY3Rpb24gKHJlcSwgcmVzKSB7XG4gICAgICAgICAgICAkJC5mbG93LnN0YXJ0KFwiUmVtb3RlU3dhcm1pbmdcIikuc3RhcnRTd2FybShyZXEucGFyYW1zLmNoYW5uZWxJZCwgSlNPTi5zdHJpbmdpZnkocmVxLmJvZHkpLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICBzZXJ2ZXIuZ2V0KCcvOmNoYW5uZWxJZCcsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuICAgICAgICAgICAgJCQuZmxvdy5zdGFydChcIlJlbW90ZVN3YXJtaW5nXCIpLndhaXRGb3JTd2FybShyZXEucGFyYW1zLmNoYW5uZWxJZCwgcmVzLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQsIGNvbmZpcm1hdGlvbklkKSB7XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGxldCByZXNwb25zZU1lc3NhZ2UgPSByZXN1bHQ7XG5cbiAgICAgICAgICAgICAgICBpZiAoKHJlcS5xdWVyeS53YWl0Q29uZmlybWF0aW9uIHx8ICdmYWxzZScpID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5vbignZmluaXNoJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCQuZmxvdy5zdGFydCgnUmVtb3RlU3dhcm1pbmcnKS5jb25maXJtU3dhcm0ocmVxLnBhcmFtcy5jaGFubmVsSWQsIGNvbmZpcm1hdGlvbklkLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VNZXNzYWdlID0ge3Jlc3VsdCwgY29uZmlybWF0aW9uSWR9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGVuY29kZWRSZXNwb25zZU1lc3NhZ2UgPSBtc2dwYWNrLmVuY29kZShyZXNwb25zZU1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZShCdWZmZXIuZnJvbShlbmNvZGVkUmVzcG9uc2VNZXNzYWdlKSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG5cdFx0c2VydmVyLmRlbGV0ZShcIi86Y2hhbm5lbElkLzpjb25maXJtYXRpb25JZFwiLCBmdW5jdGlvbihyZXEsIHJlcyl7XG5cdFx0XHQkJC5mbG93LnN0YXJ0KFwiUmVtb3RlU3dhcm1pbmdcIikuY29uZmlybVN3YXJtKHJlcS5wYXJhbXMuY2hhbm5lbElkLCByZXEucGFyYW1zLmNvbmZpcm1hdGlvbklkLCBmdW5jdGlvbiAoZXJyLCByZXN1bHQpIHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA1MDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHQvL2ZvbGRlciBjYW4gYmUgdXNlcklkL3RyaXBJZC8uLi5cblx0XHRzZXJ2ZXIucG9zdCgnL2ZpbGVzL3VwbG9hZC86Zm9sZGVyJywgZnVuY3Rpb24gKHJlcSxyZXMpIHtcblx0XHRcdGxldCBmaWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vZmlsZU1hbmFnZXInKTtcblx0XHRcdGZpbGVNYW5hZ2VyLnVwbG9hZChyZXEsIChlcnIsIHJlc3VsdCk9Pntcblx0XHRcdFx0aWYoZXJyKXtcblx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDUwMDtcblx0XHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHRcdH1lbHNle1xuXHRcdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuXHRcdFx0XHRcdHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSk7XG5cblx0XHRzZXJ2ZXIuZ2V0KCcvZmlsZXMvZG93bmxvYWQvOmZvbGRlci86ZmlsZUlkJywgZnVuY3Rpb24gKHJlcSxyZXMpIHtcblx0XHRcdGxldCBmaWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vZmlsZU1hbmFnZXInKTtcblx0XHRcdGZpbGVNYW5hZ2VyLmRvd25sb2FkKHJlcSwgKGVyciwgcmVzdWx0KT0+e1xuXHRcdFx0XHRpZihlcnIpe1xuXHRcdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuXHRcdFx0XHRcdHJlcy5lbmQoKTtcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0cmVzLnN0YXR1c0NvZGUgPSAyMDA7XG5cdFx0XHRcdFx0cmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgYGltYWdlLyR7cmVxLnBhcmFtcy5maWxlSWQuc3BsaXQoJy4nKVsxXX1gKTtcblx0XHRcdFx0XHRyZXN1bHQucGlwZShyZXMpO1xuXHRcdFx0XHRcdHJlc3VsdC5vbignZmluaXNoJywgKCkgPT4ge1xuXHRcdFx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSk7XG5cblx0XHRzZXJ2ZXIucG9zdCgnL0NTQicsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuXHRcdFx0Ly9wcmV2ZW50aW5nIGlsbGVnYWwgY2hhcmFjdGVycyBwYXNzaW5nIGFzIGZpbGVJZFxuXHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA0MDA7XG5cdFx0XHRyZXMuZW5kKCk7XG5cdFx0fSk7XG5cblx0XHRzZXJ2ZXIucG9zdCgnL0NTQi9jb21wYXJlVmVyc2lvbnMnLCBmdW5jdGlvbihyZXEsIHJlcykge1xuXHRcdFx0JCQuZmxvdy5zdGFydCgnQ1NCbWFuYWdlcicpLmNvbXBhcmVWZXJzaW9ucyhyZXEsIGZ1bmN0aW9uKGVyciwgZmlsZXNXaXRoQ2hhbmdlcykge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDUwMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXMuZW5kKEpTT04uc3RyaW5naWZ5KGZpbGVzV2l0aENoYW5nZXMpKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXG5cdFx0c2VydmVyLnBvc3QoJy9DU0IvOmZpbGVJZCcsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuXHRcdFx0JCQuZmxvdy5zdGFydChcIkNTQm1hbmFnZXJcIikud3JpdGUocmVxLnBhcmFtcy5maWxlSWQsIHJlcSwgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gMjAxO1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA1MDA7XG5cblx0XHRcdFx0XHRpZiAoZXJyLmNvZGUgPT09ICdFQUNDRVMnKSB7XG5cdFx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDQwOTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzLmVuZCgpO1xuXHRcdFx0fSk7XG5cblx0XHR9KTtcblxuXHRcdHNlcnZlci5nZXQoJy9DU0IvOmZpbGVJZCcsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuXHRcdFx0cmVzLnNldEhlYWRlcihcImNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKTtcblx0XHRcdCQkLmZsb3cuc3RhcnQoXCJDU0JtYW5hZ2VyXCIpLnJlYWQocmVxLnBhcmFtcy5maWxlSWQsIHJlcywgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDQwNDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHNlcnZlci5nZXQoJy9DU0IvOmZpbGVJZC92ZXJzaW9ucycsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuXHRcdFx0JCQuZmxvdy5zdGFydChcIkNTQm1hbmFnZXJcIikuZ2V0VmVyc2lvbnNGb3JGaWxlKHJlcS5wYXJhbXMuZmlsZUlkLCBmdW5jdGlvbihlcnIsIGZpbGVWZXJzaW9ucykge1xuXHRcdFx0XHRpZihlcnIpIHtcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGVycik7XG5cdFx0XHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXMuZW5kKEpTT04uc3RyaW5naWZ5KGZpbGVWZXJzaW9ucykpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRzZXJ2ZXIuZ2V0KCcvQ1NCLzpmaWxlSWQvOnZlcnNpb24nLCBmdW5jdGlvbiAocmVxLCByZXMpIHtcblx0XHRcdCQkLmZsb3cuc3RhcnQoXCJDU0JtYW5hZ2VyXCIpLnJlYWRWZXJzaW9uKHJlcS5wYXJhbXMuZmlsZUlkLCByZXEucGFyYW1zLnZlcnNpb24sIHJlcywgZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG5cdFx0XHRcdHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0XHRyZXMuc3RhdHVzQ29kZSA9IDQwNDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXMuZW5kKCk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXG5cblxuXHRcdHNlcnZlci5vcHRpb25zKCcvKicsIGZ1bmN0aW9uIChyZXEsIHJlcykge1xuXHRcdFx0dmFyIGhlYWRlcnMgPSB7fTtcblx0XHRcdC8vIElFOCBkb2VzIG5vdCBhbGxvdyBkb21haW5zIHRvIGJlIHNwZWNpZmllZCwganVzdCB0aGUgKlxuXHRcdFx0Ly8gaGVhZGVyc1tcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiXSA9IHJlcS5oZWFkZXJzLm9yaWdpbjtcblx0XHRcdGhlYWRlcnNbXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIl0gPSBcIipcIjtcblx0XHRcdGhlYWRlcnNbXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCJdID0gXCJQT1NULCBHRVQsIFBVVCwgREVMRVRFLCBPUFRJT05TXCI7XG5cdFx0XHRoZWFkZXJzW1wiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIl0gPSB0cnVlO1xuXHRcdFx0aGVhZGVyc1tcIkFjY2Vzcy1Db250cm9sLU1heC1BZ2VcIl0gPSAnMzYwMCc7IC8vb25lIGhvdXJcblx0XHRcdGhlYWRlcnNbXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCJdID0gXCJDb250ZW50LVR5cGUsIEFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbiwgVXNlci1BZ2VudFwiO1xuXHRcdFx0cmVzLndyaXRlSGVhZCgyMDAsIGhlYWRlcnMpO1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdH0pO1xuXG5cdFx0c2VydmVyLnVzZShmdW5jdGlvbiAocmVxLCByZXMpIHtcblx0XHRcdHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuXHRcdFx0cmVzLmVuZCgpO1xuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZVZpcnR1YWxNUSA9IGZ1bmN0aW9uKHBvcnQsIGZvbGRlciwgc3NsQ29uZmlnLCBjYWxsYmFjayl7XG5cdGlmKHR5cGVvZiBzc2xDb25maWcgPT09ICdmdW5jdGlvbicpIHtcblx0XHRjYWxsYmFjayA9IHNzbENvbmZpZztcblx0XHRzc2xDb25maWcgPSB1bmRlZmluZWQ7XG5cdH1cblxuXHRyZXR1cm4gbmV3IFZpcnR1YWxNUSh7bGlzdGVuaW5nUG9ydDpwb3J0LCByb290Rm9sZGVyOmZvbGRlciwgc3NsQ29uZmlnfSwgY2FsbGJhY2spO1xufTtcblxubW9kdWxlLmV4cG9ydHMuVmlydHVhbE1RID0gVmlydHVhbE1RO1xuXG5tb2R1bGUuZXhwb3J0cy5nZXRIdHRwV3JhcHBlciA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gcmVxdWlyZSgnLi9saWJzL2h0dHAtd3JhcHBlcicpO1xufTtcbiIsImNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5sZXQgcm9vdEZvbGRlciA9IHByb2Nlc3MuZW52LlJPT1RfRklMRV9VUExPQUQgfHwgXCIuL0ZpbGVVcGxvYWRzXCI7XG5cbnJvb3RGb2xkZXIgPSBwYXRoLnJlc29sdmUocm9vdEZvbGRlcik7XG5cbmd1aWQgPSBmdW5jdGlvbigpIHtcbiAgICBmdW5jdGlvbiBzNCgpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApXG4gICAgICAgIC50b1N0cmluZygxNilcbiAgICAgICAgLnN1YnN0cmluZygxKTtcbiAgICB9XG4gIFxuICAgIHJldHVybiBgJHtzNCgpfSR7czQoKX0tJHtzNCgpfS0ke3M0KCl9LSR7czQoKX0tJHtzNCgpfSR7czQoKX0ke3M0KCl9YDtcbiAgfTtcblxubW9kdWxlLmV4cG9ydHMudXBsb2FkID0gZnVuY3Rpb24gKHJlcSwgY2FsbGJhY2spIHtcbiAgICBjb25zdCByZWFkRmlsZVN0cmVhbSA9IHJlcTtcbiAgICBpZighcmVhZEZpbGVTdHJlYW0gfHwgIXJlYWRGaWxlU3RyZWFtLnBpcGUgfHwgdHlwZW9mIHJlYWRGaWxlU3RyZWFtLnBpcGUgIT09IFwiZnVuY3Rpb25cIil7XG4gICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIlNvbWV0aGluZyB3cm9uZyBoYXBwZW5lZFwiKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBmb2xkZXIgPSBCdWZmZXIuZnJvbShyZXEucGFyYW1zLmZvbGRlciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkucmVwbGFjZSgnXFxuJywgJycpO1xuICAgIGlmIChmb2xkZXIuaW5jbHVkZXMoJy4uJykpe1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soJ2VycicpO1xuICAgIH1cbiAgICBsZXQgZmlsZW5hbWUgPSBndWlkKCk7XG4gICAgaWYgKGZpbGVuYW1lLnNwbGl0KCcuJykubGVuZ3RoID4gMSl7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygnZXJyJyk7XG4gICAgfVxuICAgIGNvbnN0IGNvbXBsZXRlRm9sZGVyUGF0aCA9IHBhdGguam9pbiggcm9vdEZvbGRlciwgZm9sZGVyICk7XG5cbiAgICBjb250ZW50VHlwZSA9IHJlcS5oZWFkZXJzWydjb250ZW50LXR5cGUnXS5zcGxpdCgnLycpO1xuXG4gICAgaWYgKGNvbnRlbnRUeXBlWzBdID09PSAnaW1hZ2UnKSB7XG4gICAgICAgIGZpbGVuYW1lICs9ICcuJyArIGNvbnRlbnRUeXBlWzFdO1xuICAgIH1lbHNlIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCdlcnInKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgZnMubWtkaXJTeW5jKGNvbXBsZXRlRm9sZGVyUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfWNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICB9XG4gICAgY29uc3Qgd3JpdGVTdHJlYW0gPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSggcGF0aC5qb2luKGNvbXBsZXRlRm9sZGVyUGF0aCwgZmlsZW5hbWUpKTtcblxuICAgIHdyaXRlU3RyZWFtLm9uKCdmaW5pc2gnLCAoKSA9PiB7XG4gICAgICAgIHdyaXRlU3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCB7J3BhdGgnOiBwYXRoLmpvaW4oZm9sZGVyLGZpbGVuYW1lKX0pO1xuICAgIH0pO1xuXG4gICAgd3JpdGVTdHJlYW0ub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICB3cml0ZVN0cmVhbS5jbG9zZSgpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgICByZXEucGlwZSh3cml0ZVN0cmVhbSk7XG59O1xubW9kdWxlLmV4cG9ydHMuZG93bmxvYWQgPSBmdW5jdGlvbiAocmVxLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHJlYWRGaWxlU3RyZWFtID0gcmVxO1xuICAgIGlmKCFyZWFkRmlsZVN0cmVhbSB8fCAhcmVhZEZpbGVTdHJlYW0ucGlwZSB8fCB0eXBlb2YgcmVhZEZpbGVTdHJlYW0ucGlwZSAhPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiU29tZXRoaW5nIHdyb25nIGhhcHBlbmVkXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGZvbGRlciA9IHJlcS5wYXJhbXMuZm9sZGVyO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gcmVxLnBhcmFtcy5maWxlSWQ7XG4gICAgY29uc3QgY29tcGxldGVGb2xkZXJQYXRoID0gcGF0aC5qb2luKCByb290Rm9sZGVyLCBmb2xkZXIgKTtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihjb21wbGV0ZUZvbGRlclBhdGgsIGZpbGVuYW1lKTtcblxuICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgICAgICBjb25zdCBmaWxlVG9TZW5kID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBmaWxlVG9TZW5kKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygnZXJyJyk7XG4gICAgfVxufTsiLCJyZXF1aXJlKCdsYXVuY2hlcicpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCBQc2tIYXNoID0gcmVxdWlyZSgncHNrY3J5cHRvJykuUHNrSGFzaDtcblxuY29uc3QgZm9sZGVyTmFtZVNpemUgPSBwcm9jZXNzLmVudi5GT0xERVJfTkFNRV9TSVpFIHx8IDU7XG5jb25zdCBGSUxFX1NFUEFSQVRPUiA9ICctJztcbmxldCByb290Zm9sZGVyO1xuXG4kJC5mbG93LmRlc2NyaWJlKFwiQ1NCbWFuYWdlclwiLCB7XG4gICAgaW5pdDogZnVuY3Rpb24ocm9vdEZvbGRlciwgY2FsbGJhY2spe1xuICAgICAgICBpZighcm9vdEZvbGRlcil7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJObyByb290IGZvbGRlciBzcGVjaWZpZWQhXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByb290Rm9sZGVyID0gcGF0aC5yZXNvbHZlKHJvb3RGb2xkZXIpO1xuICAgICAgICB0aGlzLl9fZW5zdXJlRm9sZGVyU3RydWN0dXJlKHJvb3RGb2xkZXIsIGZ1bmN0aW9uKGVyci8qLCBwYXRoKi8pe1xuICAgICAgICAgICAgcm9vdGZvbGRlciA9IHJvb3RGb2xkZXI7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJvb3RGb2xkZXIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHdyaXRlOiBmdW5jdGlvbihmaWxlTmFtZSwgcmVhZEZpbGVTdHJlYW0sIGNhbGxiYWNrKXtcbiAgICAgICAgaWYoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFyZWFkRmlsZVN0cmVhbSB8fCAhcmVhZEZpbGVTdHJlYW0ucGlwZSB8fCB0eXBlb2YgcmVhZEZpbGVTdHJlYW0ucGlwZSAhPT0gXCJmdW5jdGlvblwiKXtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIlNvbWV0aGluZyB3cm9uZyBoYXBwZW5lZFwiKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJOYW1lID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSksIGZpbGVOYW1lKTtcblxuICAgICAgICBjb25zdCBzZXJpYWwgPSB0aGlzLnNlcmlhbCgoKSA9PiB7fSk7IC8vVE9ETzogRW1wdHkgZnVuY3Rpb25cblxuICAgICAgICBzZXJpYWwuX19lbnN1cmVGb2xkZXJTdHJ1Y3R1cmUoZm9sZGVyTmFtZSwgc2VyaWFsLl9fcHJvZ3Jlc3MpO1xuICAgICAgICBzZXJpYWwuX193cml0ZUZpbGUocmVhZEZpbGVTdHJlYW0sIGZvbGRlck5hbWUsIGZpbGVOYW1lLCBjYWxsYmFjayk7XG4gICAgfSxcbiAgICByZWFkOiBmdW5jdGlvbihmaWxlTmFtZSwgd3JpdGVGaWxlU3RyZWFtLCBjYWxsYmFjayl7XG4gICAgICAgIGlmKCF0aGlzLl9fdmVyaWZ5RmlsZU5hbWUoZmlsZU5hbWUsIGNhbGxiYWNrKSl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSkpO1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmb2xkZXJQYXRoLCBmaWxlTmFtZSk7XG4gICAgICAgIHRoaXMuX192ZXJpZnlGaWxlRXhpc3RlbmNlKGZpbGVQYXRoLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmKCFlcnIpe1xuICAgICAgICAgICAgICAgIHRoaXMuX19nZXRMYXRlc3RWZXJzaW9uTmFtZU9mRmlsZShmaWxlUGF0aCwgKGVyciwgZmlsZVZlcnNpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fcmVhZEZpbGUod3JpdGVGaWxlU3RyZWFtLCBwYXRoLmpvaW4oZmlsZVBhdGgsIGZpbGVWZXJzaW9uLmZ1bGxWZXJzaW9uKSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIk5vIGZpbGUgZm91bmQuXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZWFkVmVyc2lvbjogZnVuY3Rpb24oZmlsZU5hbWUsIGZpbGVWZXJzaW9uLCB3cml0ZUZpbGVTdHJlYW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmKCF0aGlzLl9fdmVyaWZ5RmlsZU5hbWUoZmlsZU5hbWUsIGNhbGxiYWNrKSl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSkpO1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmb2xkZXJQYXRoLCBmaWxlTmFtZSwgZmlsZVZlcnNpb24pO1xuICAgICAgICB0aGlzLl9fdmVyaWZ5RmlsZUV4aXN0ZW5jZShmaWxlUGF0aCwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBpZighZXJyKXtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmVhZEZpbGUod3JpdGVGaWxlU3RyZWFtLCBwYXRoLmpvaW4oZmlsZVBhdGgpLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gZmlsZSBmb3VuZC5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldFZlcnNpb25zRm9yRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSksIGZpbGVOYW1lKTtcbiAgICAgICAgZnMucmVhZGRpcihmb2xkZXJQYXRoLCAoZXJyLCBmaWxlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0b3RhbE51bWJlck9mRmlsZXMgPSBmaWxlcy5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBmaWxlc0RhdGEgPSBbXTtcblxuICAgICAgICAgICAgbGV0IHJlc29sdmVkRmlsZXMgPSAwO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsTnVtYmVyT2ZGaWxlczsgKytpKSB7XG4gICAgICAgICAgICAgICAgZnMuc3RhdChwYXRoLmpvaW4oZm9sZGVyUGF0aCwgZmlsZXNbaV0pLCAoZXJyLCBzdGF0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlc0RhdGEucHVzaCh7dmVyc2lvbjogZmlsZXNbaV0sIGNyZWF0aW9uVGltZTogbnVsbCwgY3JlYXRpb25UaW1lTXM6IG51bGx9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGZpbGVzRGF0YS5wdXNoKHt2ZXJzaW9uOiBmaWxlc1tpXSwgY3JlYXRpb25UaW1lOiBzdGF0cy5iaXJ0aHRpbWUsIGNyZWF0aW9uVGltZU1zOiBzdGF0cy5iaXJ0aHRpbWVNc30pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkRmlsZXMgKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWRGaWxlcyA+PSB0b3RhbE51bWJlck9mRmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzRGF0YS5zb3J0KChmaXJzdCwgc2Vjb25kKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RDb21wYXJlRGF0YSA9IGZpcnN0LmNyZWF0aW9uVGltZU1zIHx8IGZpcnN0LnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vjb25kQ29tcGFyZURhdGEgPSBzZWNvbmQuY3JlYXRpb25UaW1lTXMgfHwgc2Vjb25kLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3RDb21wYXJlRGF0YSAtIHNlY29uZENvbXBhcmVEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodW5kZWZpbmVkLCBmaWxlc0RhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgY29tcGFyZVZlcnNpb25zOiBmdW5jdGlvbihib2R5U3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBsZXQgYm9keSA9ICcnO1xuXG4gICAgICAgIGJvZHlTdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgYm9keSArPSBkYXRhO1xuICAgICAgICB9KTtcblxuICAgICAgICBib2R5U3RyZWFtLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICBib2R5ID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgICAgIHRoaXMuX19jb21wYXJlVmVyc2lvbnMoYm9keSwgY2FsbGJhY2spO1xuICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgX192ZXJpZnlGaWxlTmFtZTogZnVuY3Rpb24oZmlsZU5hbWUsIGNhbGxiYWNrKXtcbiAgICAgICAgaWYoIWZpbGVOYW1lIHx8IHR5cGVvZiBmaWxlTmFtZSAhPSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIk5vIGZpbGVJZCBzcGVjaWZpZWQuXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGZpbGVOYW1lLmxlbmd0aCA8IGZvbGRlck5hbWVTaXplKXtcbiAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIkZpbGVJZCB0b28gc21hbGwuIFwiK2ZpbGVOYW1lKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIF9fZW5zdXJlRm9sZGVyU3RydWN0dXJlOiBmdW5jdGlvbihmb2xkZXIsIGNhbGxiYWNrKXtcbiAgICAgICAgZnMubWtkaXIoZm9sZGVyLCB7cmVjdXJzaXZlOiB0cnVlfSwgIGNhbGxiYWNrKTtcbiAgICB9LFxuICAgIF9fd3JpdGVGaWxlOiBmdW5jdGlvbihyZWFkU3RyZWFtLCBmb2xkZXJQYXRoLCBmaWxlTmFtZSwgY2FsbGJhY2spe1xuICAgICAgICB0aGlzLl9fZ2V0TmV4dFZlcnNpb25GaWxlTmFtZShmb2xkZXJQYXRoLCBmaWxlTmFtZSwgKGVyciwgbmV4dFZlcnNpb25GaWxlTmFtZSkgPT4ge1xuICAgICAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBoYXNoID0gbmV3IFBza0hhc2goKTtcbiAgICAgICAgICAgIHJlYWRTdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGhhc2gudXBkYXRlKGRhdGEpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZvbGRlclBhdGgsIG5leHRWZXJzaW9uRmlsZU5hbWUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBjb25zdCB3cml0ZVN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVQYXRoLCB7bW9kZTowbzQ0NH0pO1xuXG4gICAgICAgICAgICB3cml0ZVN0cmVhbS5vbihcImZpbmlzaFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFzaERpZ2VzdCA9IGhhc2guZGlnZXN0KCkudG9TdHJpbmcoJ2hleCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BhdGggPSBmaWxlUGF0aCArIEZJTEVfU0VQQVJBVE9SICsgaGFzaERpZ2VzdDtcbiAgICAgICAgICAgICAgICBmcy5yZW5hbWUoZmlsZVBhdGgsIG5ld1BhdGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB3cml0ZVN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR3cml0ZVN0cmVhbS5jbG9zZSgpO1xuXHRcdFx0XHRyZWFkU3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soLi4uYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWFkU3RyZWFtLnBpcGUod3JpdGVTdHJlYW0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIF9fZ2V0TmV4dFZlcnNpb25GaWxlTmFtZTogZnVuY3Rpb24gKGZvbGRlclBhdGgsIGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9fZ2V0TGF0ZXN0VmVyc2lvbk5hbWVPZkZpbGUoZm9sZGVyUGF0aCwgKGVyciwgZmlsZVZlcnNpb24pID0+IHtcbiAgICAgICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBmaWxlVmVyc2lvbi5udW1lcmljVmVyc2lvbiArIDEpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIF9fZ2V0TGF0ZXN0VmVyc2lvbk5hbWVPZkZpbGU6IGZ1bmN0aW9uIChmb2xkZXJQYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBmcy5yZWFkZGlyKGZvbGRlclBhdGgsIChlcnIsIGZpbGVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgZmlsZVZlcnNpb24gPSB7bnVtZXJpY1ZlcnNpb246IDAsIGZ1bGxWZXJzaW9uOiAnMCcgKyBGSUxFX1NFUEFSQVRPUn07XG5cbiAgICAgICAgICAgIGlmKGZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhbGxWZXJzaW9ucyA9IGZpbGVzLm1hcCgoZmlsZSkgPT4gZmlsZS5zcGxpdChGSUxFX1NFUEFSQVRPUilbMF0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsYXRlc3RGaWxlID0gdGhpcy5fX21heEVsZW1lbnQoYWxsVmVyc2lvbnMpO1xuICAgICAgICAgICAgICAgICAgICBmaWxlVmVyc2lvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWZXJzaW9uOiBwYXJzZUludChsYXRlc3RGaWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxWZXJzaW9uOiBmaWxlcy5maWx0ZXIoKGZpbGUpID0+IGZpbGUuc3BsaXQoRklMRV9TRVBBUkFUT1IpWzBdID09PSBsYXRlc3RGaWxlLnRvU3RyaW5nKCkpWzBdXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGUuY29kZSA9ICdpbnZhbGlkX2ZpbGVfbmFtZV9mb3VuZCc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgZmlsZVZlcnNpb24pO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIF9fbWF4RWxlbWVudDogZnVuY3Rpb24gKG51bWJlcnMpIHtcbiAgICAgICAgbGV0IG1heCA9IG51bWJlcnNbMF07XG5cbiAgICAgICAgZm9yKGxldCBpID0gMTsgaSA8IG51bWJlcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIG1heCA9IE1hdGgubWF4KG1heCwgbnVtYmVyc1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihpc05hTihtYXgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZWxlbWVudCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1heDtcbiAgICB9LFxuICAgIF9fY29tcGFyZVZlcnNpb25zOiBmdW5jdGlvbiAoZmlsZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzV2l0aENoYW5nZXMgPSBbXTtcbiAgICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGZpbGVzKTtcbiAgICAgICAgbGV0IHJlbWFpbmluZyA9IGVudHJpZXMubGVuZ3RoO1xuXG4gICAgICAgIGlmKGVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGVzV2l0aENoYW5nZXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZW50cmllcy5mb3JFYWNoKChbIGZpbGVOYW1lLCBmaWxlSGFzaCBdKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdldFZlcnNpb25zRm9yRmlsZShmaWxlTmFtZSwgKGVyciwgdmVyc2lvbnMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHZlcnNpb25zLnNvbWUoKHZlcnNpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzaCA9IHZlcnNpb24udmVyc2lvbi5zcGxpdChGSUxFX1NFUEFSQVRPUilbMV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoYXNoID09PSBmaWxlSGFzaDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXNXaXRoQ2hhbmdlcy5wdXNoKGZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHVuZGVmaW5lZCwgZmlsZXNXaXRoQ2hhbmdlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgX19yZWFkRmlsZTogZnVuY3Rpb24od3JpdGVGaWxlU3RyZWFtLCBmaWxlUGF0aCwgY2FsbGJhY2spe1xuICAgICAgICBjb25zdCByZWFkU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG5cbiAgICAgICAgd3JpdGVGaWxlU3RyZWFtLm9uKFwiZmluaXNoXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgd3JpdGVGaWxlU3RyZWFtLm9uKFwiZXJyb3JcIiwgY2FsbGJhY2spO1xuXG4gICAgICAgIHJlYWRTdHJlYW0ucGlwZSh3cml0ZUZpbGVTdHJlYW0pO1xuICAgIH0sXG4gICAgX19wcm9ncmVzczogZnVuY3Rpb24oZXJyLCByZXN1bHQpe1xuICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBfX3ZlcmlmeUZpbGVFeGlzdGVuY2U6IGZ1bmN0aW9uKGZpbGVQYXRoLCBjYWxsYmFjayl7XG4gICAgICAgIGZzLnN0YXQoZmlsZVBhdGgsIGNhbGxiYWNrKTtcbiAgICB9XG59KTsiLCJjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbmNvbnN0IGZvbGRlck1RID0gcmVxdWlyZShcImZvbGRlcm1xXCIpO1xuXG5sZXQgcm9vdGZvbGRlcjtcbmNvbnN0IGNoYW5uZWxzID0ge307XG5cbmZ1bmN0aW9uIHN0b3JlQ2hhbm5lbChpZCwgY2hhbm5lbCwgY2xpZW50Q29uc3VtZXIpe1xuXHR2YXIgc3RvcmVkQ2hhbm5lbCA9IHtcblx0XHRjaGFubmVsOiBjaGFubmVsLFxuXHRcdGhhbmRsZXI6IGNoYW5uZWwuZ2V0SGFuZGxlcigpLFxuXHRcdG1xQ29uc3VtZXI6IG51bGwsXG5cdFx0Y29uc3VtZXJzOltdXG5cdH07XG5cblx0aWYoIWNoYW5uZWxzW2lkXSl7XG5cdFx0Y2hhbm5lbHNbaWRdID0gc3RvcmVkQ2hhbm5lbDtcblx0fVxuXG5cdGlmKGNsaWVudENvbnN1bWVyKXtcblx0XHRzdG9yZWRDaGFubmVsID0gY2hhbm5lbHNbaWRdO1xuXHRcdGNoYW5uZWxzW2lkXS5jb25zdW1lcnMucHVzaChjbGllbnRDb25zdW1lcik7XG5cdH1cblxuXHRyZXR1cm4gc3RvcmVkQ2hhbm5lbDtcbn1cblxuXG5mdW5jdGlvbiByZWdpc3RlckNvbnN1bWVyKGlkLCBjb25zdW1lcil7XG5cdGNvbnN0IHN0b3JlZENoYW5uZWwgPSBjaGFubmVsc1tpZF07XG5cdGlmKHN0b3JlZENoYW5uZWwpe1xuXHRcdHN0b3JlZENoYW5uZWwuY29uc3VtZXJzLnB1c2goY29uc3VtZXIpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZGVsaXZlclRvQ29uc3VtZXJzKGNvbnN1bWVycywgZXJyLCByZXN1bHQsIGNvbmZpcm1hdGlvbklkKXtcblx0aWYoIWNvbnN1bWVycyl7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG4gICAgbGV0IGRlbGl2ZXJlZE1lc3NhZ2VzID0gMDtcbiAgICB3aGlsZShjb25zdW1lcnMubGVuZ3RoPjApe1xuICAgICAgICAvL3dlIGl0ZXJhdGUgdGhyb3VnaCB0aGUgY29uc3VtZXJzIGxpc3QgaW4gY2FzZSB0aGF0IHdlIGhhdmUgYSByZWYuIG9mIGEgcmVxdWVzdCB0aGF0IHRpbWUtb3V0ZWQgbWVhbndoaWxlXG4gICAgICAgIC8vYW5kIGluIHRoaXMgY2FzZSB3ZSBleHBlY3QgdG8gaGF2ZSBtb3JlIHRoZW4gb25lIGNvbnN1bWVyLi4uXG4gICAgICAgIGNvbnN0IGNvbnN1bWVyID0gY29uc3VtZXJzLnBvcCgpO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBjb25zdW1lcihlcnIsIHJlc3VsdCwgY29uZmlybWF0aW9uSWQpO1xuICAgICAgICAgICAgZGVsaXZlcmVkTWVzc2FnZXMrKztcbiAgICAgICAgfWNhdGNoKGVycm9yKXtcbiAgICAgICAgICAgIC8vanVzdCBzb21lIHNtYWxsIGVycm9yIGlnbm9yZWRcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgY2F0Y2hlZFwiLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICEhZGVsaXZlcmVkTWVzc2FnZXM7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTWFpbkNvbnN1bWVyKGlkKXtcblx0Y29uc3Qgc3RvcmVkQ2hhbm5lbCA9IGNoYW5uZWxzW2lkXTtcblx0aWYoc3RvcmVkQ2hhbm5lbCAmJiAhc3RvcmVkQ2hhbm5lbC5tcUNvbnN1bWVyKXtcblx0XHRzdG9yZWRDaGFubmVsLm1xQ29uc3VtZXIgPSAoZXJyLCByZXN1bHQsIGNvbmZpcm1hdGlvbklkKSA9PiB7XG5cdFx0XHRjaGFubmVsc1tpZF0gPSBudWxsO1xuXHRcdFx0ZGVsaXZlclRvQ29uc3VtZXJzKHN0b3JlZENoYW5uZWwuY29uc3VtZXJzLCBlcnIsIHJlc3VsdCwgY29uZmlybWF0aW9uSWQpO1xuXHRcdFx0Lyp3aGlsZShzdG9yZWRDaGFubmVsLmNvbnN1bWVycy5sZW5ndGg+MCl7XG5cdFx0XHRcdC8vd2UgaXRlcmF0ZSB0aHJvdWdoIHRoZSBjb25zdW1lcnMgbGlzdCBpbiBjYXNlIHRoYXQgd2UgaGF2ZSBhIHJlZi4gb2YgYSByZXF1ZXN0IHRoYXQgdGltZS1vdXRlZCBtZWFud2hpbGVcblx0XHRcdFx0Ly9hbmQgaW4gdGhpcyBjYXNlIHdlIGV4cGVjdCB0byBoYXZlIG1vcmUgdGhlbiBvbmUgY29uc3VtZXIuLi5cblx0XHRcdFx0bGV0IGNvbnN1bWVyID0gc3RvcmVkQ2hhbm5lbC5jb25zdW1lcnMucG9wKCk7XG5cdFx0XHRcdHRyeXtcblx0XHRcdFx0XHRjb25zdW1lcihlcnIsIHJlc3VsdCwgY29uZmlybWF0aW9uSWQpO1xuXHRcdFx0XHR9Y2F0Y2goZXJyb3Ipe1xuXHRcdFx0XHRcdC8vanVzdCBzb21lIHNtYWxsIGVycm9yIGlnbm9yZWRcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIkVycm9yIGNhdGNoZWRcIiwgZXJyb3IpO1xuXHRcdFx0XHR9XG5cdFx0XHR9Ki9cblx0XHR9O1xuXG5cdFx0c3RvcmVkQ2hhbm5lbC5jaGFubmVsLnJlZ2lzdGVyQ29uc3VtZXIoc3RvcmVkQ2hhbm5lbC5tcUNvbnN1bWVyLCBmYWxzZSwgKCkgPT4gISFjaGFubmVsc1tpZF0pO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVhZFN3YXJtRnJvbVN0cmVhbShzdHJlYW0sIGNhbGxiYWNrKXtcbiAgICBsZXQgc3dhcm0gPSBcIlwiO1xuICAgIHN0cmVhbS5vbignZGF0YScsIChjaHVuaykgPT57XG4gICAgICAgIHN3YXJtICs9IGNodW5rO1xuXHR9KTtcblxuICAgIHN0cmVhbS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICAgY2FsbGJhY2sobnVsbCwgc3dhcm0pO1xuXHR9KTtcblxuICAgIHN0cmVhbS5vbihcImVycm9yXCIsIChlcnIpID0+e1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuXHR9KTtcbn1cblxuJCQuZmxvdy5kZXNjcmliZShcIlJlbW90ZVN3YXJtaW5nXCIsIHtcblx0aW5pdDogZnVuY3Rpb24ocm9vdEZvbGRlciwgY2FsbGJhY2spe1xuXHRcdGlmKCFyb290Rm9sZGVyKXtcblx0XHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIk5vIHJvb3QgZm9sZGVyIHNwZWNpZmllZCFcIikpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRyb290Rm9sZGVyID0gcGF0aC5yZXNvbHZlKHJvb3RGb2xkZXIpO1xuXHRcdGZzLm1rZGlyKHJvb3RGb2xkZXIsIHtyZWN1cnNpdmU6IHRydWV9LCBmdW5jdGlvbihlcnIsIHBhdGgpe1xuXHRcdFx0cm9vdGZvbGRlciA9IHJvb3RGb2xkZXI7XG5cblx0XHRcdGlmKCFlcnIpe1xuXHRcdFx0XHRmcy5yZWFkZGlyKHJvb3Rmb2xkZXIsIChjbGVhbkVyciwgZmlsZXMpID0+IHtcblx0XHRcdFx0XHR3aGlsZShmaWxlcyAmJiBmaWxlcy5sZW5ndGggPiAwKXtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiUm9vdCBmb2xkZXIgZm91bmQgdG8gaGF2ZSBzb21lIGRpcnMuIFN0YXJ0IGNsZWFuaW5nIGVtcHR5IGRpcnMuXCIpO1xuXHRcdFx0XHRcdFx0bGV0IGRpciA9IGZpbGVzLnBvcCgpO1xuXHRcdFx0XHRcdFx0dHJ5e1xuXHRcdFx0XHRcdFx0XHRjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cdFx0XHRcdFx0XHRcdGRpciA9IHBhdGguam9pbihyb290Rm9sZGVyLCBkaXIpO1xuXHRcdFx0XHRcdFx0XHR2YXIgY29udGVudCA9IGZzLnJlYWRkaXJTeW5jKGRpcik7XG5cdFx0XHRcdFx0XHRcdGlmKGNvbnRlbnQgJiYgY29udGVudC5sZW5ndGggPT09IDApe1xuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiUmVtb3ZpbmcgZW1wdHkgZGlyXCIsIGRpcik7XG5cdFx0XHRcdFx0XHRcdFx0ZnMucm1kaXJTeW5jKGRpcik7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1jYXRjaChlcnIpe1xuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGNhbGxiYWNrKGNsZWFuRXJyLCByb290Rm9sZGVyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVyciwgcm9vdEZvbGRlcik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0sXG5cdHN0YXJ0U3dhcm06IGZ1bmN0aW9uIChjaGFubmVsSWQsIHN3YXJtU2VyaWFsaXphdGlvbiwgY2FsbGJhY2spIHtcblx0XHRsZXQgY2hhbm5lbCA9IGNoYW5uZWxzW2NoYW5uZWxJZF07XG5cdFx0aWYgKCFjaGFubmVsKSB7XG5cdFx0XHRjb25zdCBjaGFubmVsRm9sZGVyID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGNoYW5uZWxJZCk7XG5cdFx0XHRsZXQgc3RvcmVkQ2hhbm5lbDtcblx0XHRcdGNoYW5uZWwgPSBmb2xkZXJNUS5jcmVhdGVRdWUoY2hhbm5lbEZvbGRlciwgKGVyciwgcmVzdWx0KSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHQvL3dlIGRlbGV0ZSB0aGUgY2hhbm5lbCBpbiBvcmRlciB0byB0cnkgYWdhaW4gbmV4dCB0aW1lXG5cdFx0XHRcdFx0Y2hhbm5lbHNbY2hhbm5lbElkXSA9IG51bGw7XG5cdFx0XHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKFwiQ2hhbm5lbCBpbml0aWFsaXphdGlvbiBmYWlsZWRcIikpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBzZW50ID0gZmFsc2U7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0c2VudCA9IGRlbGl2ZXJUb0NvbnN1bWVycyhjaGFubmVsLmNvbnN1bWVycywgbnVsbCwgSlNPTi5wYXJzZShzd2FybVNlcmlhbGl6YXRpb24pKTtcblx0XHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghc2VudCkge1xuXHRcdFx0XHRcdHN0b3JlZENoYW5uZWwuaGFuZGxlci5zZW5kU3dhcm1TZXJpYWxpemF0aW9uKHN3YXJtU2VyaWFsaXphdGlvbiwgY2FsbGJhY2spO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCBzd2FybVNlcmlhbGl6YXRpb24pO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pO1xuXHRcdFx0c3RvcmVkQ2hhbm5lbCA9IHN0b3JlQ2hhbm5lbChjaGFubmVsSWQsIGNoYW5uZWwpO1xuXHRcdH0gZWxzZSB7XG5cblx0XHRcdGxldCBzZW50ID0gZmFsc2U7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRzZW50ID0gZGVsaXZlclRvQ29uc3VtZXJzKGNoYW5uZWwuY29uc3VtZXJzLCBudWxsLCBKU09OLnBhcnNlKHN3YXJtU2VyaWFsaXphdGlvbikpO1xuXHRcdFx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghc2VudCkge1xuXHRcdFx0XHRjaGFubmVsLmhhbmRsZXIuc2VuZFN3YXJtU2VyaWFsaXphdGlvbihzd2FybVNlcmlhbGl6YXRpb24sIGNhbGxiYWNrKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCBzd2FybVNlcmlhbGl6YXRpb24pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0Y29uZmlybVN3YXJtOiBmdW5jdGlvbihjaGFubmVsSWQsIGNvbmZpcm1hdGlvbklkLCBjYWxsYmFjayl7XG5cdFx0aWYoIWNvbmZpcm1hdGlvbklkKXtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IHN0b3JlZENoYW5uZWwgPSBjaGFubmVsc1tjaGFubmVsSWRdO1xuXHRcdGlmKCFzdG9yZWRDaGFubmVsKXtcblx0XHRcdGNvbnN0IGNoYW5uZWxGb2xkZXIgPSBwYXRoLmpvaW4ocm9vdGZvbGRlciwgY2hhbm5lbElkKTtcblx0XHRcdGNvbnN0IGNoYW5uZWwgPSBmb2xkZXJNUS5jcmVhdGVRdWUoY2hhbm5lbEZvbGRlciwgKGVyciwgcmVzdWx0KSA9PiB7XG5cdFx0XHRcdGlmKGVycil7XG5cdFx0XHRcdFx0Ly93ZSBkZWxldGUgdGhlIGNoYW5uZWwgaW4gb3JkZXIgdG8gdHJ5IGFnYWluIG5leHQgdGltZVxuXHRcdFx0XHRcdGNoYW5uZWxzW2NoYW5uZWxJZF0gPSBudWxsO1xuXHRcdFx0XHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkNoYW5uZWwgaW5pdGlhbGl6YXRpb24gZmFpbGVkXCIpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2hhbm5lbC51bmxpbmtDb250ZW50KGNvbmZpcm1hdGlvbklkLCBjYWxsYmFjayk7XG5cdFx0XHR9KTtcblx0XHR9ZWxzZXtcblx0XHRcdHN0b3JlZENoYW5uZWwuY2hhbm5lbC51bmxpbmtDb250ZW50KGNvbmZpcm1hdGlvbklkLCBjYWxsYmFjayk7XG5cdFx0fVxuXHR9LFxuXHR3YWl0Rm9yU3dhcm06IGZ1bmN0aW9uKGNoYW5uZWxJZCwgd3JpdGVTd2FybVN0cmVhbSwgY2FsbGJhY2spe1xuXHRcdGxldCBjaGFubmVsID0gY2hhbm5lbHNbY2hhbm5lbElkXTtcblx0XHRpZighY2hhbm5lbCl7XG5cdFx0XHRjb25zdCBjaGFubmVsRm9sZGVyID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGNoYW5uZWxJZCk7XG5cdFx0XHRjaGFubmVsID0gZm9sZGVyTVEuY3JlYXRlUXVlKGNoYW5uZWxGb2xkZXIsIChlcnIsIHJlc3VsdCkgPT4ge1xuXHRcdFx0XHRpZihlcnIpe1xuXHRcdFx0XHRcdC8vd2UgZGVsZXRlIHRoZSBjaGFubmVsIGluIG9yZGVyIHRvIHRyeSBhZ2FpbiBuZXh0IHRpbWVcblx0XHRcdFx0XHRjaGFubmVsc1tjaGFubmVsSWRdID0gbnVsbDtcblx0XHRcdFx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJDaGFubmVsIGluaXRpYWxpemF0aW9uIGZhaWxlZFwiKSwge30pO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZighcmVnaXN0ZXJDb25zdW1lcihjaGFubmVsSWQsIGNhbGxiYWNrKSl7XG5cdFx0XHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKFwiUmVnaXN0ZXJpbmcgY29uc3VtZXIgZmFpbGVkIVwiKSwge30pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlZ2lzdGVyTWFpbkNvbnN1bWVyKGNoYW5uZWxJZCk7XG5cdFx0XHR9KTtcblx0XHRcdHN0b3JlQ2hhbm5lbChjaGFubmVsSWQsIGNoYW5uZWwpO1xuXHRcdH1lbHNle1xuXHRcdFx0Ly9jaGFubmVsLmNoYW5uZWwucmVnaXN0ZXJDb25zdW1lcihjYWxsYmFjayk7XG4gICAgICAgICAgICBpZighcmVnaXN0ZXJDb25zdW1lcihjaGFubmVsSWQsIGNhbGxiYWNrKSl7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiUmVnaXN0ZXJpbmcgY29uc3VtZXIgZmFpbGVkIVwiKSwge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVnaXN0ZXJNYWluQ29uc3VtZXIoY2hhbm5lbElkKTtcblx0XHR9XG5cdH1cbn0pO1xuIiwiLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGUgVG9rZW4gYnVja2V0IGFsZ29yaXRobVxuICogQHBhcmFtIHN0YXJ0VG9rZW5zIC0gbWF4aW11bSBudW1iZXIgb2YgdG9rZW5zIHBvc3NpYmxlIHRvIG9idGFpbiBhbmQgdGhlIGRlZmF1bHQgc3RhcnRpbmcgdmFsdWVcbiAqIEBwYXJhbSB0b2tlblZhbHVlUGVyVGltZSAtIG51bWJlciBvZiB0b2tlbnMgZ2l2ZW4gYmFjayBmb3IgZWFjaCBcInVuaXRPZlRpbWVcIlxuICogQHBhcmFtIHVuaXRPZlRpbWUgLSBmb3IgZWFjaCBcInVuaXRPZlRpbWVcIiAoaW4gbWlsbGlzZWNvbmRzKSBwYXNzZWQgXCJ0b2tlblZhbHVlUGVyVGltZVwiIGFtb3VudCBvZiB0b2tlbnMgd2lsbCBiZSBnaXZlbiBiYWNrXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuXG5mdW5jdGlvbiBUb2tlbkJ1Y2tldChzdGFydFRva2VucyA9IDYwMDAsIHRva2VuVmFsdWVQZXJUaW1lID0gMTAsIHVuaXRPZlRpbWUgPSAxMDApIHtcblxuICAgIGlmKHR5cGVvZiBzdGFydFRva2VucyAhPT0gJ251bWJlcicgfHwgdHlwZW9mICB0b2tlblZhbHVlUGVyVGltZSAhPT0gJ251bWJlcicgfHwgdHlwZW9mIHVuaXRPZlRpbWUgIT09ICdudW1iZXInKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIHBhcmFtZXRlcnMgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpO1xuICAgIH1cblxuICAgIGlmKGlzTmFOKHN0YXJ0VG9rZW5zKSB8fCBpc05hTih0b2tlblZhbHVlUGVyVGltZSkgfHwgaXNOYU4odW5pdE9mVGltZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbGwgcGFyYW1ldGVycyBtdXN0IG5vdCBiZSBOYU4nKTtcbiAgICB9XG5cbiAgICBpZihzdGFydFRva2VucyA8PSAwIHx8IHRva2VuVmFsdWVQZXJUaW1lIDw9IDAgfHwgdW5pdE9mVGltZSA8PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIHBhcmFtZXRlcnMgbXVzdCBiZSBiaWdnZXIgdGhhbiAwJyk7XG4gICAgfVxuXG5cbiAgICBUb2tlbkJ1Y2tldC5wcm90b3R5cGUuQ09TVF9MT1cgICAgPSAxMDsgIC8vIGVxdWl2YWxlbnQgdG8gMTBvcC9zIHdpdGggZGVmYXVsdCB2YWx1ZXNcbiAgICBUb2tlbkJ1Y2tldC5wcm90b3R5cGUuQ09TVF9NRURJVU0gPSAxMDA7IC8vIGVxdWl2YWxlbnQgdG8gMW9wL3Mgd2l0aCBkZWZhdWx0IHZhbHVlc1xuICAgIFRva2VuQnVja2V0LnByb3RvdHlwZS5DT1NUX0hJR0ggICA9IDUwMDsgLy8gZXF1aXZhbGVudCB0byAxMm9wL21pbnV0ZSB3aXRoIGRlZmF1bHQgdmFsdWVzXG5cbiAgICBUb2tlbkJ1Y2tldC5FUlJPUl9MSU1JVF9FWENFRURFRCAgPSAnZXJyb3JfbGltaXRfZXhjZWVkZWQnO1xuICAgIFRva2VuQnVja2V0LkVSUk9SX0JBRF9BUkdVTUVOVCAgICA9ICdlcnJvcl9iYWRfYXJndW1lbnQnO1xuXG5cblxuICAgIGNvbnN0IGxpbWl0cyA9IHt9O1xuXG4gICAgZnVuY3Rpb24gdGFrZVRva2VuKHVzZXJLZXksIGNvc3QsIGNhbGxiYWNrID0gKCkgPT4ge30pIHtcbiAgICAgICAgaWYodHlwZW9mIGNvc3QgIT09ICdudW1iZXInIHx8IGlzTmFOKGNvc3QpIHx8IGNvc3QgPD0gMCB8fCBjb3N0ID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgY2FsbGJhY2soVG9rZW5CdWNrZXQuRVJST1JfQkFEX0FSR1VNRU5UKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZXJCdWNrZXQgPSBsaW1pdHNbdXNlcktleV07XG5cbiAgICAgICAgaWYgKHVzZXJCdWNrZXQpIHtcbiAgICAgICAgICAgIHVzZXJCdWNrZXQudG9rZW5zICs9IGNhbGN1bGF0ZVJldHVyblRva2Vucyh1c2VyQnVja2V0LnRpbWVzdGFtcCk7XG4gICAgICAgICAgICB1c2VyQnVja2V0LnRva2VucyAtPSBjb3N0O1xuXG4gICAgICAgICAgICB1c2VyQnVja2V0LnRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cblxuXG4gICAgICAgICAgICBpZiAodXNlckJ1Y2tldC50b2tlbnMgPCAwKSB7XG4gICAgICAgICAgICAgICAgdXNlckJ1Y2tldC50b2tlbnMgPSAwO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFRva2VuQnVja2V0LkVSUk9SX0xJTUlUX0VYQ0VFREVELCAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh1bmRlZmluZWQsIHVzZXJCdWNrZXQudG9rZW5zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxpbWl0c1t1c2VyS2V5XSA9IG5ldyBMaW1pdChzdGFydFRva2VucywgRGF0ZS5ub3coKSk7XG4gICAgICAgICAgICB0YWtlVG9rZW4odXNlcktleSwgY29zdCwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0TGltaXRCeUNvc3QoY29zdCkge1xuICAgICAgICBpZihzdGFydFRva2VucyA9PT0gMCB8fCBjb3N0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHN0YXJ0VG9rZW5zIC8gY29zdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVtYWluaW5nVG9rZW5CeUNvc3QodG9rZW5zLCBjb3N0KSB7XG4gICAgICAgIGlmKHRva2VucyA9PT0gMCB8fCBjb3N0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKHRva2VucyAvIGNvc3QpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIExpbWl0KG1heGltdW1Ub2tlbnMsIHRpbWVzdGFtcCkge1xuICAgICAgICB0aGlzLnRva2VucyA9IG1heGltdW1Ub2tlbnM7XG4gICAgICAgIHRoaXMudGltZXN0YW1wID0gdGltZXN0YW1wO1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzZXQgdG9rZW5zKG51bWJlck9mVG9rZW5zKSB7XG4gICAgICAgICAgICAgICAgaWYgKG51bWJlck9mVG9rZW5zIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBudW1iZXJPZlRva2VucyA9IC0xO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChudW1iZXJPZlRva2VucyA+IG1heGltdW1Ub2tlbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZUb2tlbnMgPSBtYXhpbXVtVG9rZW5zO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYudG9rZW5zID0gbnVtYmVyT2ZUb2tlbnM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0IHRva2VucygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi50b2tlbnM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGltZXN0YW1wXG4gICAgICAgIH07XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiBjYWxjdWxhdGVSZXR1cm5Ub2tlbnModGltZXN0YW1wKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBjb25zdCBlbGFwc2VkVGltZSA9IE1hdGguZmxvb3IoKGN1cnJlbnRUaW1lIC0gdGltZXN0YW1wKSAvIHVuaXRPZlRpbWUpO1xuXG4gICAgICAgIHJldHVybiBlbGFwc2VkVGltZSAqIHRva2VuVmFsdWVQZXJUaW1lO1xuICAgIH1cblxuICAgIHRoaXMudGFrZVRva2VuICAgICAgICAgICAgICAgPSB0YWtlVG9rZW47XG4gICAgdGhpcy5nZXRMaW1pdEJ5Q29zdCAgICAgICAgICA9IGdldExpbWl0QnlDb3N0O1xuICAgIHRoaXMuZ2V0UmVtYWluaW5nVG9rZW5CeUNvc3QgPSBnZXRSZW1haW5pbmdUb2tlbkJ5Q29zdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUb2tlbkJ1Y2tldDtcbiIsImNvbnN0IGh0dHAgPSByZXF1aXJlKCdodHRwJyk7XG5jb25zdCB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbmNvbnN0IHN0cmVhbSA9IHJlcXVpcmUoJ3N0cmVhbScpO1xuXG4vKipcbiAqIFdyYXBzIGEgcmVxdWVzdCBhbmQgYXVnbWVudHMgaXQgd2l0aCBhIFwiZG9cIiBtZXRob2QgdG8gbW9kaWZ5IGl0IGluIGEgXCJmbHVlbnQgYnVpbGRlclwiIHN0eWxlXG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gKiBAcGFyYW0geyp9IGJvZHlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBSZXF1ZXN0KHVybCwgYm9keSkge1xuICAgIHRoaXMucmVxdWVzdCA9IHtcbiAgICAgICAgb3B0aW9uczogdXJsLFxuICAgICAgICBib2R5XG4gICAgfTtcblxuICAgIHRoaXMuZG8gPSBmdW5jdGlvbiAobW9kaWZpZXIpIHtcbiAgICAgICAgbW9kaWZpZXIodGhpcy5yZXF1ZXN0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0SHR0cFJlcXVlc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3Q7XG4gICAgfTtcbn1cblxuXG4vKipcbiAqIE1vZGlmaWVzIHJlcXVlc3Qub3B0aW9ucyB0byBjb250YWluIHRoZSB1cmwgcGFyc2VkIGluc3RlYWQgb2YgYXMgc3RyaW5nXG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdCAtIE9iamVjdCB0aGF0IGNvbnRhaW5zIG9wdGlvbnMgYW5kIGJvZHlcbiAqL1xuZnVuY3Rpb24gdXJsVG9PcHRpb25zKHJlcXVlc3QpIHtcbiAgICBjb25zdCBwYXJzZWRVcmwgPSB1cmwucGFyc2UocmVxdWVzdC5vcHRpb25zKTtcblxuICAgIC8vIFRPRE86IG1vdmllIGhlYWRlcnMgZGVjbGFyYXRpb24gZnJvbSBoZXJlXG4gICAgcmVxdWVzdC5vcHRpb25zID0ge1xuICAgICAgICBob3N0OiBwYXJzZWRVcmwuaG9zdG5hbWUsXG4gICAgICAgIHBvcnQ6IHBhcnNlZFVybC5wb3J0LFxuICAgICAgICBwYXRoOiBwYXJzZWRVcmwucGF0aG5hbWUsXG4gICAgICAgIGhlYWRlcnM6IHt9XG4gICAgfTtcbn1cblxuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHJlcXVlc3QuYm9keSBpbiBhIHR5cGUgdGhhdCBjYW4gYmUgc2VudCB0aHJvdWdoIG5ldHdvcmsgaWYgaXQgaXMgbmVlZGVkXG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdCAtIE9iamVjdCB0aGF0IGNvbnRhaW5zIG9wdGlvbnMgYW5kIGJvZHlcbiAqL1xuZnVuY3Rpb24gc2VyaWFsaXplQm9keShyZXF1ZXN0KSB7XG4gICAgaWYgKCFyZXF1ZXN0LmJvZHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZXIgPSB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKHRhcmdldCwgbmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5hbWUgaW4gdGFyZ2V0ID8gdGFyZ2V0W25hbWVdIDogKGRhdGEpID0+IGRhdGE7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgYm9keVNlcmlhbGl6YXRpb25NYXBwaW5nID0gbmV3IFByb3h5KHtcbiAgICAgICAgJ09iamVjdCc6IChkYXRhKSA9PiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICB9LCBoYW5kbGVyKTtcblxuICAgIHJlcXVlc3QuYm9keSA9IGJvZHlTZXJpYWxpemF0aW9uTWFwcGluZ1tyZXF1ZXN0LmJvZHkuY29uc3RydWN0b3IubmFtZV0ocmVxdWVzdC5ib2R5KTtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlcXVlc3QgLSBPYmplY3QgdGhhdCBjb250YWlucyBvcHRpb25zIGFuZCBib2R5XG4gKi9cbmZ1bmN0aW9uIGJvZHlDb250ZW50TGVuZ3RoKHJlcXVlc3QpIHtcbiAgICBpZiAoIXJlcXVlc3QuYm9keSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3QuYm9keS5jb25zdHJ1Y3Rvci5uYW1lIGluIFsgJ1N0cmluZycsICdCdWZmZXInLCAnQXJyYXlCdWZmZXInIF0pIHtcbiAgICAgICAgcmVxdWVzdC5vcHRpb25zLmhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSBCdWZmZXIuYnl0ZUxlbmd0aChyZXF1ZXN0LmJvZHkpO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBDbGllbnQoKSB7XG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1JlcXVlc3R9IGN1c3RvbVJlcXVlc3RcbiAgICAgKiBAcGFyYW0gbW9kaWZpZXJzIC0gYXJyYXkgb2YgZnVuY3Rpb25zIHRoYXQgbW9kaWZ5IHRoZSByZXF1ZXN0XG4gICAgICogQHJldHVybnMge09iamVjdH0gLSB3aXRoIHVybCBhbmQgYm9keSBwcm9wZXJ0aWVzXG4gICAgICovXG4gICAgZnVuY3Rpb24gcmVxdWVzdChjdXN0b21SZXF1ZXN0LCBtb2RpZmllcnMpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RpZmllcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGN1c3RvbVJlcXVlc3QuZG8obW9kaWZpZXJzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjdXN0b21SZXF1ZXN0LmdldEh0dHBSZXF1ZXN0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UmVxKHVybCwgY29uZmlnLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBtb2RpZmllcnMgPSBbXG4gICAgICAgICAgICB1cmxUb09wdGlvbnMsXG4gICAgICAgICAgICAocmVxdWVzdCkgPT4ge3JlcXVlc3Qub3B0aW9ucy5oZWFkZXJzID0gY29uZmlnLmhlYWRlcnMgfHwge307fVxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IHBhY2tlZFJlcXVlc3QgPSByZXF1ZXN0KG5ldyBSZXF1ZXN0KHVybCwgY29uZmlnLmJvZHkpLCBtb2RpZmllcnMpO1xuICAgICAgICBjb25zdCBodHRwUmVxdWVzdCA9IGh0dHAucmVxdWVzdChwYWNrZWRSZXF1ZXN0Lm9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgaHR0cFJlcXVlc3QuZW5kKCk7XG5cbiAgICAgICAgcmV0dXJuIGh0dHBSZXF1ZXN0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc3RSZXEodXJsLCBjb25maWcsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG1vZGlmaWVycyA9IFtcbiAgICAgICAgICAgIHVybFRvT3B0aW9ucyxcbiAgICAgICAgICAgIChyZXF1ZXN0KSA9PiB7cmVxdWVzdC5vcHRpb25zLm1ldGhvZCA9ICdQT1NUJzsgfSxcbiAgICAgICAgICAgIChyZXF1ZXN0KSA9PiB7cmVxdWVzdC5vcHRpb25zLmhlYWRlcnMgPSBjb25maWcuaGVhZGVycyB8fCB7fTsgfSxcbiAgICAgICAgICAgIHNlcmlhbGl6ZUJvZHksXG4gICAgICAgICAgICBib2R5Q29udGVudExlbmd0aFxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IHBhY2tlZFJlcXVlc3QgPSByZXF1ZXN0KG5ldyBSZXF1ZXN0KHVybCwgY29uZmlnLmJvZHkpLCBtb2RpZmllcnMpO1xuICAgICAgICBjb25zdCBodHRwUmVxdWVzdCA9IGh0dHAucmVxdWVzdChwYWNrZWRSZXF1ZXN0Lm9wdGlvbnMsIGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAoY29uZmlnLmJvZHkgaW5zdGFuY2VvZiBzdHJlYW0uUmVhZGFibGUpIHtcbiAgICAgICAgICAgIGNvbmZpZy5ib2R5LnBpcGUoaHR0cFJlcXVlc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaHR0cFJlcXVlc3QuZW5kKHBhY2tlZFJlcXVlc3QuYm9keSwgY29uZmlnLmVuY29kaW5nIHx8ICd1dGY4Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGh0dHBSZXF1ZXN0O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlbGV0ZVJlcSh1cmwsIGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbW9kaWZpZXJzID0gW1xuICAgICAgICAgICAgdXJsVG9PcHRpb25zLFxuICAgICAgICAgICAgKHJlcXVlc3QpID0+IHtyZXF1ZXN0Lm9wdGlvbnMubWV0aG9kID0gJ0RFTEVURSc7fSxcbiAgICAgICAgICAgIChyZXF1ZXN0KSA9PiB7cmVxdWVzdC5vcHRpb25zLmhlYWRlcnMgPSBjb25maWcuaGVhZGVycyB8fCB7fTt9LFxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IHBhY2tlZFJlcXVlc3QgPSByZXF1ZXN0KG5ldyBSZXF1ZXN0KHVybCwgY29uZmlnLmJvZHkpLCBtb2RpZmllcnMpO1xuICAgICAgICBjb25zdCBodHRwUmVxdWVzdCA9IGh0dHAucmVxdWVzdChwYWNrZWRSZXF1ZXN0Lm9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgICAgaHR0cFJlcXVlc3QuZW5kKCk7XG5cbiAgICAgICAgcmV0dXJuIGh0dHBSZXF1ZXN0O1xuICAgIH1cblxuICAgIHRoaXMuZ2V0ID0gZ2V0UmVxO1xuICAgIHRoaXMucG9zdCA9IHBvc3RSZXE7XG4gICAgdGhpcy5kZWxldGUgPSBkZWxldGVSZXE7XG59XG5cbi8qKlxuICogU3dhcCB0aGlyZCBhbmQgc2Vjb25kIHBhcmFtZXRlciBpZiBvbmx5IHR3byBhcmUgcHJvdmlkZWQgYW5kIGNvbnZlcnRzIGFyZ3VtZW50cyB0byBhcnJheVxuICogQHBhcmFtIHtPYmplY3R9IHBhcmFtc1xuICogQHJldHVybnMge0FycmF5fSAtIGFyZ3VtZW50cyBhcyBhcnJheVxuICovXG5mdW5jdGlvbiBwYXJhbWV0ZXJzUHJlUHJvY2Vzc2luZyhwYXJhbXMpIHtcbiAgICBjb25zdCByZXMgPSBbXTtcblxuICAgIGlmICh0eXBlb2YgcGFyYW1zWzBdICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IHBhcmFtZXRlciBtdXN0IGJlIGEgc3RyaW5nICh1cmwpJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHBhcmFtc1swXSk7XG5cbiAgICBpZiAoIXBhcnNlZFVybC5ob3N0bmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50ICh1cmwpIGlzIG5vdCB2YWxpZCcpO1xuICAgIH1cblxuICAgIGlmIChwYXJhbXMubGVuZ3RoID49IDMpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXNbMV0gIT09ICdvYmplY3QnIHx8ICFwYXJhbXNbMV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2hlbiAzIHBhcmFtZXRlcnMgYXJlIHByb3ZpZGVkIHRoZSBzZWNvbmQgcGFyYW1ldGVyIG11c3QgYmUgYSBub3QgbnVsbCBvYmplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zWzJdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1doZW4gMyBwYXJhbWV0ZXJzIGFyZSBwcm92aWRlZCB0aGUgdGhpcmQgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBhcmFtcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXNbMV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignV2hlbiAyIHBhcmFtZXRlcnMgYXJlIHByb3ZpZGVkIHRoZSBzZWNvbmQgb25lIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyYW1zWzJdID0gcGFyYW1zWzFdO1xuICAgICAgICBwYXJhbXNbMV0gPSB7fTtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMocGFyYW1zKTtcbiAgICBmb3IobGV0IGkgPSAwLCBsZW4gPSBwcm9wZXJ0aWVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgIHJlcy5wdXNoKHBhcmFtc1twcm9wZXJ0aWVzW2ldXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlcztcbn1cblxuY29uc3QgaGFuZGxlciA9IHtcbiAgICBnZXQodGFyZ2V0LCBwcm9wTmFtZSkge1xuICAgICAgICBpZiAoIXRhcmdldFtwcm9wTmFtZV0pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb3BOYW1lLCBcIk5vdCBpbXBsZW1lbnRlZCFcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFyZ3MgPSBwYXJhbWV0ZXJzUHJlUHJvY2Vzc2luZyhhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXRbcHJvcE5hbWVdLmFwcGx5KHRhcmdldCwgYXJncyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIG5ldyBQcm94eShuZXcgQ2xpZW50KCksIGhhbmRsZXIpO1xufTsiLCJjb25zdCBxdWVyeXN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5cbmZ1bmN0aW9uIG1hdGNoVXJsKHBhdHRlcm4sIHVybCkge1xuXHRjb25zdCByZXN1bHQgPSB7XG5cdFx0bWF0Y2g6IHRydWUsXG5cdFx0cGFyYW1zOiB7fSxcblx0XHRxdWVyeToge31cblx0fTtcblxuXHRjb25zdCBxdWVyeVBhcmFtZXRlcnNTdGFydEluZGV4ID0gdXJsLmluZGV4T2YoJz8nKTtcblx0aWYocXVlcnlQYXJhbWV0ZXJzU3RhcnRJbmRleCAhPT0gLTEpIHtcblx0XHRjb25zdCB1cmxRdWVyeVN0cmluZyA9IHVybC5zdWJzdHIocXVlcnlQYXJhbWV0ZXJzU3RhcnRJbmRleCArIDEpOyAvLyArIDEgdG8gaWdub3JlIHRoZSAnPydcblx0XHRyZXN1bHQucXVlcnkgPSBxdWVyeXN0cmluZy5wYXJzZSh1cmxRdWVyeVN0cmluZyk7XG5cdFx0dXJsID0gdXJsLnN1YnN0cigwLCBxdWVyeVBhcmFtZXRlcnNTdGFydEluZGV4KTtcblx0fVxuXG4gICAgY29uc3QgcGF0dGVyblRva2VucyA9IHBhdHRlcm4uc3BsaXQoJy8nKTtcbiAgICBjb25zdCB1cmxUb2tlbnMgPSB1cmwuc3BsaXQoJy8nKTtcblxuICAgIGlmKHVybFRva2Vuc1t1cmxUb2tlbnMubGVuZ3RoIC0gMV0gPT09ICcnKSB7XG4gICAgICAgIHVybFRva2Vucy5wb3AoKTtcbiAgICB9XG5cbiAgICBpZiAocGF0dGVyblRva2Vucy5sZW5ndGggIT09IHVybFRva2Vucy5sZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0Lm1hdGNoID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYocGF0dGVyblRva2Vuc1twYXR0ZXJuVG9rZW5zLmxlbmd0aCAtIDFdID09PSAnKicpIHtcbiAgICAgICAgcmVzdWx0Lm1hdGNoID0gdHJ1ZTtcbiAgICAgICAgcGF0dGVyblRva2Vucy5wb3AoKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdHRlcm5Ub2tlbnMubGVuZ3RoICYmIHJlc3VsdC5tYXRjaDsgKytpKSB7XG4gICAgICAgIGlmIChwYXR0ZXJuVG9rZW5zW2ldLnN0YXJ0c1dpdGgoJzonKSkge1xuICAgICAgICAgICAgcmVzdWx0LnBhcmFtc1twYXR0ZXJuVG9rZW5zW2ldLnN1YnN0cmluZygxKV0gPSB1cmxUb2tlbnNbaV07XG4gICAgICAgIH0gZWxzZSBpZiAocGF0dGVyblRva2Vuc1tpXSAhPT0gdXJsVG9rZW5zW2ldKSB7XG4gICAgICAgICAgICByZXN1bHQubWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGlzVHJ1dGh5KHZhbHVlKSB7XG4gICAgcmV0dXJuICEhdmFsdWU7XG5cbn1cblxuZnVuY3Rpb24gbWV0aG9kTWF0Y2gocGF0dGVybiwgbWV0aG9kKSB7XG4gICAgaWYgKCFwYXR0ZXJuIHx8ICFtZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdHRlcm4gPT09IG1ldGhvZDtcbn1cblxuZnVuY3Rpb24gTWlkZGxld2FyZSgpIHtcbiAgICBjb25zdCByZWdpc3RlcmVkTWlkZGxld2FyZUZ1bmN0aW9ucyA9IFtdO1xuXG4gICAgZnVuY3Rpb24gdXNlKG1ldGhvZCwgdXJsLCBmbikge1xuICAgICAgICBtZXRob2QgPSBtZXRob2QgPyBtZXRob2QudG9Mb3dlckNhc2UoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcmVnaXN0ZXJlZE1pZGRsZXdhcmVGdW5jdGlvbnMucHVzaCh7bWV0aG9kLCB1cmwsIGZufSk7XG4gICAgfVxuXG4gICAgdGhpcy51c2UgPSBmdW5jdGlvbiAoLi4ucGFyYW1zKSB7XG5cdCAgICBsZXQgYXJncyA9IFsgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCBdO1xuXG5cdCAgICBzd2l0Y2ggKHBhcmFtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDpcblx0XHRcdFx0dGhyb3cgRXJyb3IoJ1VzZSBtZXRob2QgbmVlZHMgYXQgbGVhc3Qgb25lIGFyZ3VtZW50LicpO1xuXHRcdFx0XHRcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtc1swXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBFcnJvcignSWYgb25seSBvbmUgYXJndW1lbnQgaXMgcHJvdmlkZWQgaXQgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXJnc1syXSA9IHBhcmFtc1swXTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW1zWzBdICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgcGFyYW1zWzFdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJZiB0d28gYXJndW1lbnRzIGFyZSBwcm92aWRlZCB0aGUgZmlyc3Qgb25lIG11c3QgYmUgYSBzdHJpbmcgKHVybCkgYW5kIHRoZSBzZWNvbmQgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGFyZ3NbMV09cGFyYW1zWzBdO1xuICAgICAgICAgICAgICAgIGFyZ3NbMl09cGFyYW1zWzFdO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW1zWzBdICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgcGFyYW1zWzFdICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgcGFyYW1zWzJdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IEVycm9yKCdJZiB0aHJlZSBvciBtb3JlIGFyZ3VtZW50cyBhcmUgcHJvdmlkZWQgdGhlIGZpcnN0IG9uZSBtdXN0IGJlIGEgc3RyaW5nIChIVFRQIHZlcmIpLCB0aGUgc2Vjb25kIGEgc3RyaW5nICh1cmwpIGFuZCB0aGUgdGhpcmQgYSBmdW5jdGlvbicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghKFsgJ2dldCcsICdwb3N0JywgJ3B1dCcsICdkZWxldGUnLCAncGF0Y2gnLCAnaGVhZCcsICdjb25uZWN0JywgJ29wdGlvbnMnLCAndHJhY2UnIF0uaW5jbHVkZXMocGFyYW1zWzBdLnRvTG93ZXJDYXNlKCkpKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0lmIHRocmVlIG9yIG1vcmUgYXJndW1lbnRzIGFyZSBwcm92aWRlZCB0aGUgZmlyc3Qgb25lIG11c3QgYmUgYSBIVFRQIHZlcmIgYnV0IG5vbmUgY291bGQgYmUgbWF0Y2hlZCcpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGFyZ3MgPSBwYXJhbXM7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHVzZS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBTdGFydHMgZXhlY3V0aW9uIGZyb20gdGhlIGZpcnN0IHJlZ2lzdGVyZWQgbWlkZGxld2FyZSBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSByZXFcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcmVzXG4gICAgICovXG4gICAgdGhpcy5nbyA9IGZ1bmN0aW9uIGdvKHJlcSwgcmVzKSB7XG4gICAgICAgIGV4ZWN1dGUoMCwgcmVxLm1ldGhvZC50b0xvd2VyQ2FzZSgpLCByZXEudXJsLCByZXEsIHJlcyk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEV4ZWN1dGVzIGEgbWlkZGxld2FyZSBpZiBpdCBwYXNzZXMgdGhlIG1ldGhvZCBhbmQgdXJsIHZhbGlkYXRpb24gYW5kIGNhbGxzIHRoZSBuZXh0IG9uZSB3aGVuIG5lY2Vzc2FyeVxuICAgICAqIEBwYXJhbSBpbmRleFxuICAgICAqIEBwYXJhbSBtZXRob2RcbiAgICAgKiBAcGFyYW0gdXJsXG4gICAgICogQHBhcmFtIHBhcmFtc1xuICAgICAqL1xuICAgIGZ1bmN0aW9uIGV4ZWN1dGUoaW5kZXgsIG1ldGhvZCwgdXJsLCAuLi5wYXJhbXMpIHtcbiAgICAgICAgaWYgKCFyZWdpc3RlcmVkTWlkZGxld2FyZUZ1bmN0aW9uc1tpbmRleF0pIHtcbiAgICAgICAgICAgIGlmKGluZGV4PT09MCl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIk5vIGhhbmRsZXJzIHJlZ2lzdGVyZWQgeWV0IVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG5cdCAgICBjb25zdCByZWdpc3RlcmVkTWV0aG9kID0gcmVnaXN0ZXJlZE1pZGRsZXdhcmVGdW5jdGlvbnNbaW5kZXhdLm1ldGhvZDtcblx0ICAgIGNvbnN0IHJlZ2lzdGVyZWRVcmwgPSByZWdpc3RlcmVkTWlkZGxld2FyZUZ1bmN0aW9uc1tpbmRleF0udXJsO1xuXHQgICAgY29uc3QgZm4gPSByZWdpc3RlcmVkTWlkZGxld2FyZUZ1bmN0aW9uc1tpbmRleF0uZm47XG5cblx0ICAgIGlmICghbWV0aG9kTWF0Y2gocmVnaXN0ZXJlZE1ldGhvZCwgbWV0aG9kKSkge1xuICAgICAgICAgICAgZXhlY3V0ZSgrK2luZGV4LCBtZXRob2QsIHVybCwgLi4ucGFyYW1zKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc1RydXRoeShyZWdpc3RlcmVkVXJsKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsTWF0Y2ggPSBtYXRjaFVybChyZWdpc3RlcmVkVXJsLCB1cmwpO1xuXG4gICAgICAgICAgICBpZiAoIXVybE1hdGNoLm1hdGNoKSB7XG4gICAgICAgICAgICAgICAgZXhlY3V0ZSgrK2luZGV4LCBtZXRob2QsIHVybCwgLi4ucGFyYW1zKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwYXJhbXNbMF0pIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbMF0ucGFyYW1zID0gdXJsTWF0Y2gucGFyYW1zO1xuICAgICAgICAgICAgICAgIHBhcmFtc1swXS5xdWVyeSAgPSB1cmxNYXRjaC5xdWVyeTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb3VudGVyID0gMDtcblxuICAgICAgICBmbiguLi5wYXJhbXMsIChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvdW50ZXIrKztcbiAgICAgICAgICAgIGlmIChjb3VudGVyID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignWW91IGNhbGxlZCBuZXh0IG11bHRpcGxlIHRpbWVzLCBvbmx5IHRoZSBmaXJzdCBvbmUgd2lsbCBiZSBleGVjdXRlZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV4ZWN1dGUoKytpbmRleCwgbWV0aG9kLCB1cmwsIC4uLnBhcmFtcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNaWRkbGV3YXJlO1xuIiwiZnVuY3Rpb24gUm91dGVyKHNlcnZlcikge1xuICAgIHRoaXMudXNlID0gZnVuY3Rpb24gdXNlKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soc2VydmVyV3JhcHBlcih1cmwsIHNlcnZlcikpO1xuICAgIH07XG59XG5cblxuZnVuY3Rpb24gc2VydmVyV3JhcHBlcihiYXNlVXJsLCBzZXJ2ZXIpIHtcbiAgICBpZiAoYmFzZVVybC5lbmRzV2l0aCgnLycpKSB7XG4gICAgICAgIGJhc2VVcmwgPSBiYXNlVXJsLnN1YnN0cmluZygwLCBiYXNlVXJsLmxlbmd0aCAtIDEpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHVzZSh1cmwsIHJlcVJlc29sdmVyKSB7XG4gICAgICAgICAgICBzZXJ2ZXIudXNlKGJhc2VVcmwgKyB1cmwsIHJlcVJlc29sdmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0KHVybCwgcmVxUmVzb2x2ZXIpIHtcbiAgICAgICAgICAgIHNlcnZlci5nZXQoYmFzZVVybCArIHVybCwgcmVxUmVzb2x2ZXIpO1xuICAgICAgICB9LFxuICAgICAgICBwb3N0KHVybCwgcmVxUmVzb2x2ZXIpIHtcbiAgICAgICAgICAgIHNlcnZlci5wb3N0KGJhc2VVcmwgKyB1cmwsIHJlcVJlc29sdmVyKTtcbiAgICAgICAgfSxcbiAgICAgICAgcHV0KHVybCwgcmVxUmVzb2x2ZXIpIHtcbiAgICAgICAgICAgIHNlcnZlci5wdXQoYmFzZVVybCArIHVybCwgcmVxUmVzb2x2ZXIpO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGUodXJsLCByZXFSZXNvbHZlcikge1xuICAgICAgICAgICAgc2VydmVyLmRlbGV0ZShiYXNlVXJsICsgdXJsLCByZXFSZXNvbHZlcik7XG4gICAgICAgIH0sXG4gICAgICAgIG9wdGlvbnModXJsLCByZXFSZXNvbHZlcikge1xuICAgICAgICAgICAgc2VydmVyLm9wdGlvbnMoYmFzZVVybCArIHVybCwgcmVxUmVzb2x2ZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb3V0ZXI7XG4iLCJjb25zdCBNaWRkbGV3YXJlID0gcmVxdWlyZSgnLi9NaWRkbGV3YXJlJyk7XG5jb25zdCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xuY29uc3QgaHR0cHMgPSByZXF1aXJlKCdodHRwcycpO1xuXG5mdW5jdGlvbiBTZXJ2ZXIoc3NsT3B0aW9ucykge1xuICAgIGNvbnN0IG1pZGRsZXdhcmUgPSBuZXcgTWlkZGxld2FyZSgpO1xuICAgIGNvbnN0IHNlcnZlciA9IF9pbml0U2VydmVyKHNzbE9wdGlvbnMpO1xuXG5cbiAgICB0aGlzLmxpc3RlbiA9IGZ1bmN0aW9uIGxpc3Rlbihwb3J0KSB7XG4gICAgICAgIHNlcnZlci5saXN0ZW4ocG9ydCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICB0aGlzLnVzZSA9IGZ1bmN0aW9uIHVzZSh1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vVE9ETzogZmluZCBhIGJldHRlciB3YXlcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMikge1xuICAgICAgICAgICAgbWlkZGxld2FyZS51c2UodXJsLCBjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB1cmw7XG4gICAgICAgICAgICBtaWRkbGV3YXJlLnVzZShjYWxsYmFjayk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgIHNlcnZlci5jbG9zZShjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gZ2V0UmVxKHJlcVVybCwgcmVxUmVzb2x2ZXIpIHtcbiAgICAgICAgbWlkZGxld2FyZS51c2UoXCJHRVRcIiwgcmVxVXJsLCByZXFSZXNvbHZlcik7XG4gICAgfTtcblxuICAgIHRoaXMucG9zdCA9IGZ1bmN0aW9uIHBvc3RSZXEocmVxVXJsLCByZXFSZXNvbHZlcikge1xuICAgICAgICBtaWRkbGV3YXJlLnVzZShcIlBPU1RcIiwgcmVxVXJsLCByZXFSZXNvbHZlcik7XG4gICAgfTtcblxuICAgIHRoaXMucHV0ID0gZnVuY3Rpb24gcHV0UmVxKHJlcVVybCwgcmVxUmVzb2x2ZXIpIHtcbiAgICAgICAgbWlkZGxld2FyZS51c2UoXCJQVVRcIiwgcmVxVXJsLCByZXFSZXNvbHZlcik7XG4gICAgfTtcblxuICAgIHRoaXMuZGVsZXRlID0gZnVuY3Rpb24gZGVsZXRlUmVxKHJlcVVybCwgcmVxUmVzb2x2ZXIpIHtcbiAgICAgICAgbWlkZGxld2FyZS51c2UoXCJERUxFVEVcIiwgcmVxVXJsLCByZXFSZXNvbHZlcik7XG4gICAgfTtcblxuICAgIHRoaXMub3B0aW9ucyA9IGZ1bmN0aW9uIG9wdGlvbnNSZXEocmVxVXJsLCByZXFSZXNvbHZlcikge1xuICAgICAgICBtaWRkbGV3YXJlLnVzZShcIk9QVElPTlNcIiwgcmVxVXJsLCByZXFSZXNvbHZlcik7XG4gICAgfTtcblxuXG4gICAgLyogSU5URVJOQUwgTUVUSE9EUyAqL1xuXG4gICAgZnVuY3Rpb24gX2luaXRTZXJ2ZXIoc3NsQ29uZmlnKSB7XG4gICAgICAgIGlmIChzc2xDb25maWcpIHtcbiAgICAgICAgICAgIHJldHVybiBodHRwcy5jcmVhdGVTZXJ2ZXIoc3NsQ29uZmlnLCBtaWRkbGV3YXJlLmdvKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmNyZWF0ZVNlcnZlcihtaWRkbGV3YXJlLmdvKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2ZXI7IiwiY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuZnVuY3Rpb24gc2V0RGF0YUhhbmRsZXIocmVxdWVzdCwgY2FsbGJhY2spIHtcbiAgICBsZXQgYm9keUNvbnRlbnQgPSAnJztcblxuICAgIHJlcXVlc3Qub24oJ2RhdGEnLCBmdW5jdGlvbiAoZGF0YUNodW5rKSB7XG4gICAgICAgIGJvZHlDb250ZW50ICs9IGRhdGFDaHVuaztcbiAgICB9KTtcblxuICAgIHJlcXVlc3Qub24oJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBib2R5Q29udGVudCk7XG4gICAgfSk7XG5cbiAgICByZXF1ZXN0Lm9uKCdlcnJvcicsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gc2V0RGF0YUhhbmRsZXJNaWRkbGV3YXJlKHJlcXVlc3QsIHJlc3BvbnNlLCBuZXh0KSB7XG4gICAgaWYgKHJlcXVlc3QuaGVhZGVyc1snY29udGVudC10eXBlJ10gIT09ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nKSB7XG4gICAgICAgIHNldERhdGFIYW5kbGVyKHJlcXVlc3QsIGZ1bmN0aW9uIChlcnJvciwgYm9keUNvbnRlbnQpIHtcbiAgICAgICAgICAgIHJlcXVlc3QuYm9keSA9IGJvZHlDb250ZW50O1xuICAgICAgICAgICAgbmV4dChlcnJvcik7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzZW5kRXJyb3JSZXNwb25zZShlcnJvciwgcmVzcG9uc2UsIHN0YXR1c0NvZGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICByZXNwb25zZS5zdGF0dXNDb2RlID0gc3RhdHVzQ29kZTtcbiAgICByZXNwb25zZS5lbmQoKTtcbn1cblxuZnVuY3Rpb24gYm9keVBhcnNlcihyZXEsIHJlcywgbmV4dCkge1xuICAgIGxldCBib2R5Q29udGVudCA9ICcnO1xuXG4gICAgcmVxLm9uKCdkYXRhJywgZnVuY3Rpb24gKGRhdGFDaHVuaykge1xuICAgICAgICBib2R5Q29udGVudCArPSBkYXRhQ2h1bms7XG4gICAgfSk7XG5cbiAgICByZXEub24oJ2VuZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmVxLmJvZHkgPSBib2R5Q29udGVudDtcbiAgICAgICAgbmV4dCgpO1xuICAgIH0pO1xuXG4gICAgcmVxLm9uKCdlcnJvcicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgbmV4dChlcnIpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXJ2ZVN0YXRpY0ZpbGUoYmFzZUZvbGRlciwgaWdub3JlUGF0aCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAocmVxLCByZXMpIHtcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybC5zdWJzdHJpbmcoaWdub3JlUGF0aC5sZW5ndGgpO1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihiYXNlRm9sZGVyLCB1cmwpO1xuICAgICAgICBmcy5zdGF0KGZpbGVQYXRoLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVybC5lbmRzV2l0aCgnLmh0bWwnKSkge1xuICAgICAgICAgICAgICAgIHJlcy5jb250ZW50VHlwZSA9ICd0ZXh0L2h0bWwnO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh1cmwuZW5kc1dpdGgoJy5jc3MnKSkge1xuICAgICAgICAgICAgICAgIHJlcy5jb250ZW50VHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHVybC5lbmRzV2l0aCgnLmpzJykpIHtcbiAgICAgICAgICAgICAgICByZXMuY29udGVudFR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZmlsZVN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xuICAgICAgICAgICAgZmlsZVN0cmVhbS5waXBlKHJlcyk7XG5cbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7c2V0RGF0YUhhbmRsZXIsIHNldERhdGFIYW5kbGVyTWlkZGxld2FyZSwgc2VuZEVycm9yUmVzcG9uc2UsIGJvZHlQYXJzZXIsIHNlcnZlU3RhdGljRmlsZX07XG4iLCJjb25zdCBDbGllbnQgPSByZXF1aXJlKCcuL2NsYXNzZXMvQ2xpZW50Jyk7XG5jb25zdCBTZXJ2ZXIgPSByZXF1aXJlKCcuL2NsYXNzZXMvU2VydmVyJyk7XG5jb25zdCBodHRwVXRpbHMgPSByZXF1aXJlKCcuL2h0dHBVdGlscycpO1xuY29uc3QgUm91dGVyID0gcmVxdWlyZSgnLi9jbGFzc2VzL1JvdXRlcicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtTZXJ2ZXIsIENsaWVudCwgaHR0cFV0aWxzLCBSb3V0ZXJ9O1xuXG4iLCIvKiFcbiAqIERldGVybWluZSBpZiBhbiBvYmplY3QgaXMgYSBCdWZmZXJcbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbi8vIFRoZSBfaXNCdWZmZXIgY2hlY2sgaXMgZm9yIFNhZmFyaSA1LTcgc3VwcG9ydCwgYmVjYXVzZSBpdCdzIG1pc3Npbmdcbi8vIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHlcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICE9IG51bGwgJiYgKGlzQnVmZmVyKG9iaikgfHwgaXNTbG93QnVmZmVyKG9iaikgfHwgISFvYmouX2lzQnVmZmVyKVxufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAob2JqKSB7XG4gIHJldHVybiAhIW9iai5jb25zdHJ1Y3RvciAmJiB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopXG59XG5cbi8vIEZvciBOb2RlIHYwLjEwIHN1cHBvcnQuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHkuXG5mdW5jdGlvbiBpc1Nsb3dCdWZmZXIgKG9iaikge1xuICByZXR1cm4gdHlwZW9mIG9iai5yZWFkRmxvYXRMRSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLnNsaWNlID09PSAnZnVuY3Rpb24nICYmIGlzQnVmZmVyKG9iai5zbGljZSgwLCAwKSlcbn1cbiIsInZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG5cbnZhciBDUkNfVEFCTEUgPSBbXG4gIDB4MDAwMDAwMDAsIDB4NzcwNzMwOTYsIDB4ZWUwZTYxMmMsIDB4OTkwOTUxYmEsIDB4MDc2ZGM0MTksXG4gIDB4NzA2YWY0OGYsIDB4ZTk2M2E1MzUsIDB4OWU2NDk1YTMsIDB4MGVkYjg4MzIsIDB4NzlkY2I4YTQsXG4gIDB4ZTBkNWU5MWUsIDB4OTdkMmQ5ODgsIDB4MDliNjRjMmIsIDB4N2ViMTdjYmQsIDB4ZTdiODJkMDcsXG4gIDB4OTBiZjFkOTEsIDB4MWRiNzEwNjQsIDB4NmFiMDIwZjIsIDB4ZjNiOTcxNDgsIDB4ODRiZTQxZGUsXG4gIDB4MWFkYWQ0N2QsIDB4NmRkZGU0ZWIsIDB4ZjRkNGI1NTEsIDB4ODNkMzg1YzcsIDB4MTM2Yzk4NTYsXG4gIDB4NjQ2YmE4YzAsIDB4ZmQ2MmY5N2EsIDB4OGE2NWM5ZWMsIDB4MTQwMTVjNGYsIDB4NjMwNjZjZDksXG4gIDB4ZmEwZjNkNjMsIDB4OGQwODBkZjUsIDB4M2I2ZTIwYzgsIDB4NGM2OTEwNWUsIDB4ZDU2MDQxZTQsXG4gIDB4YTI2NzcxNzIsIDB4M2MwM2U0ZDEsIDB4NGIwNGQ0NDcsIDB4ZDIwZDg1ZmQsIDB4YTUwYWI1NmIsXG4gIDB4MzViNWE4ZmEsIDB4NDJiMjk4NmMsIDB4ZGJiYmM5ZDYsIDB4YWNiY2Y5NDAsIDB4MzJkODZjZTMsXG4gIDB4NDVkZjVjNzUsIDB4ZGNkNjBkY2YsIDB4YWJkMTNkNTksIDB4MjZkOTMwYWMsIDB4NTFkZTAwM2EsXG4gIDB4YzhkNzUxODAsIDB4YmZkMDYxMTYsIDB4MjFiNGY0YjUsIDB4NTZiM2M0MjMsIDB4Y2ZiYTk1OTksXG4gIDB4YjhiZGE1MGYsIDB4MjgwMmI4OWUsIDB4NWYwNTg4MDgsIDB4YzYwY2Q5YjIsIDB4YjEwYmU5MjQsXG4gIDB4MmY2ZjdjODcsIDB4NTg2ODRjMTEsIDB4YzE2MTFkYWIsIDB4YjY2NjJkM2QsIDB4NzZkYzQxOTAsXG4gIDB4MDFkYjcxMDYsIDB4OThkMjIwYmMsIDB4ZWZkNTEwMmEsIDB4NzFiMTg1ODksIDB4MDZiNmI1MWYsXG4gIDB4OWZiZmU0YTUsIDB4ZThiOGQ0MzMsIDB4NzgwN2M5YTIsIDB4MGYwMGY5MzQsIDB4OTYwOWE4OGUsXG4gIDB4ZTEwZTk4MTgsIDB4N2Y2YTBkYmIsIDB4MDg2ZDNkMmQsIDB4OTE2NDZjOTcsIDB4ZTY2MzVjMDEsXG4gIDB4NmI2YjUxZjQsIDB4MWM2YzYxNjIsIDB4ODU2NTMwZDgsIDB4ZjI2MjAwNGUsIDB4NmMwNjk1ZWQsXG4gIDB4MWIwMWE1N2IsIDB4ODIwOGY0YzEsIDB4ZjUwZmM0NTcsIDB4NjViMGQ5YzYsIDB4MTJiN2U5NTAsXG4gIDB4OGJiZWI4ZWEsIDB4ZmNiOTg4N2MsIDB4NjJkZDFkZGYsIDB4MTVkYTJkNDksIDB4OGNkMzdjZjMsXG4gIDB4ZmJkNDRjNjUsIDB4NGRiMjYxNTgsIDB4M2FiNTUxY2UsIDB4YTNiYzAwNzQsIDB4ZDRiYjMwZTIsXG4gIDB4NGFkZmE1NDEsIDB4M2RkODk1ZDcsIDB4YTRkMWM0NmQsIDB4ZDNkNmY0ZmIsIDB4NDM2OWU5NmEsXG4gIDB4MzQ2ZWQ5ZmMsIDB4YWQ2Nzg4NDYsIDB4ZGE2MGI4ZDAsIDB4NDQwNDJkNzMsIDB4MzMwMzFkZTUsXG4gIDB4YWEwYTRjNWYsIDB4ZGQwZDdjYzksIDB4NTAwNTcxM2MsIDB4MjcwMjQxYWEsIDB4YmUwYjEwMTAsXG4gIDB4YzkwYzIwODYsIDB4NTc2OGI1MjUsIDB4MjA2Zjg1YjMsIDB4Yjk2NmQ0MDksIDB4Y2U2MWU0OWYsXG4gIDB4NWVkZWY5MGUsIDB4MjlkOWM5OTgsIDB4YjBkMDk4MjIsIDB4YzdkN2E4YjQsIDB4NTliMzNkMTcsXG4gIDB4MmViNDBkODEsIDB4YjdiZDVjM2IsIDB4YzBiYTZjYWQsIDB4ZWRiODgzMjAsIDB4OWFiZmIzYjYsXG4gIDB4MDNiNmUyMGMsIDB4NzRiMWQyOWEsIDB4ZWFkNTQ3MzksIDB4OWRkMjc3YWYsIDB4MDRkYjI2MTUsXG4gIDB4NzNkYzE2ODMsIDB4ZTM2MzBiMTIsIDB4OTQ2NDNiODQsIDB4MGQ2ZDZhM2UsIDB4N2E2YTVhYTgsXG4gIDB4ZTQwZWNmMGIsIDB4OTMwOWZmOWQsIDB4MGEwMGFlMjcsIDB4N2QwNzllYjEsIDB4ZjAwZjkzNDQsXG4gIDB4ODcwOGEzZDIsIDB4MWUwMWYyNjgsIDB4NjkwNmMyZmUsIDB4Zjc2MjU3NWQsIDB4ODA2NTY3Y2IsXG4gIDB4MTk2YzM2NzEsIDB4NmU2YjA2ZTcsIDB4ZmVkNDFiNzYsIDB4ODlkMzJiZTAsIDB4MTBkYTdhNWEsXG4gIDB4NjdkZDRhY2MsIDB4ZjliOWRmNmYsIDB4OGViZWVmZjksIDB4MTdiN2JlNDMsIDB4NjBiMDhlZDUsXG4gIDB4ZDZkNmEzZTgsIDB4YTFkMTkzN2UsIDB4MzhkOGMyYzQsIDB4NGZkZmYyNTIsIDB4ZDFiYjY3ZjEsXG4gIDB4YTZiYzU3NjcsIDB4M2ZiNTA2ZGQsIDB4NDhiMjM2NGIsIDB4ZDgwZDJiZGEsIDB4YWYwYTFiNGMsXG4gIDB4MzYwMzRhZjYsIDB4NDEwNDdhNjAsIDB4ZGY2MGVmYzMsIDB4YTg2N2RmNTUsIDB4MzE2ZThlZWYsXG4gIDB4NDY2OWJlNzksIDB4Y2I2MWIzOGMsIDB4YmM2NjgzMWEsIDB4MjU2ZmQyYTAsIDB4NTI2OGUyMzYsXG4gIDB4Y2MwYzc3OTUsIDB4YmIwYjQ3MDMsIDB4MjIwMjE2YjksIDB4NTUwNTI2MmYsIDB4YzViYTNiYmUsXG4gIDB4YjJiZDBiMjgsIDB4MmJiNDVhOTIsIDB4NWNiMzZhMDQsIDB4YzJkN2ZmYTcsIDB4YjVkMGNmMzEsXG4gIDB4MmNkOTllOGIsIDB4NWJkZWFlMWQsIDB4OWI2NGMyYjAsIDB4ZWM2M2YyMjYsIDB4NzU2YWEzOWMsXG4gIDB4MDI2ZDkzMGEsIDB4OWMwOTA2YTksIDB4ZWIwZTM2M2YsIDB4NzIwNzY3ODUsIDB4MDUwMDU3MTMsXG4gIDB4OTViZjRhODIsIDB4ZTJiODdhMTQsIDB4N2JiMTJiYWUsIDB4MGNiNjFiMzgsIDB4OTJkMjhlOWIsXG4gIDB4ZTVkNWJlMGQsIDB4N2NkY2VmYjcsIDB4MGJkYmRmMjEsIDB4ODZkM2QyZDQsIDB4ZjFkNGUyNDIsXG4gIDB4NjhkZGIzZjgsIDB4MWZkYTgzNmUsIDB4ODFiZTE2Y2QsIDB4ZjZiOTI2NWIsIDB4NmZiMDc3ZTEsXG4gIDB4MThiNzQ3NzcsIDB4ODgwODVhZTYsIDB4ZmYwZjZhNzAsIDB4NjYwNjNiY2EsIDB4MTEwMTBiNWMsXG4gIDB4OGY2NTllZmYsIDB4Zjg2MmFlNjksIDB4NjE2YmZmZDMsIDB4MTY2Y2NmNDUsIDB4YTAwYWUyNzgsXG4gIDB4ZDcwZGQyZWUsIDB4NGUwNDgzNTQsIDB4MzkwM2IzYzIsIDB4YTc2NzI2NjEsIDB4ZDA2MDE2ZjcsXG4gIDB4NDk2OTQ3NGQsIDB4M2U2ZTc3ZGIsIDB4YWVkMTZhNGEsIDB4ZDlkNjVhZGMsIDB4NDBkZjBiNjYsXG4gIDB4MzdkODNiZjAsIDB4YTliY2FlNTMsIDB4ZGViYjllYzUsIDB4NDdiMmNmN2YsIDB4MzBiNWZmZTksXG4gIDB4YmRiZGYyMWMsIDB4Y2FiYWMyOGEsIDB4NTNiMzkzMzAsIDB4MjRiNGEzYTYsIDB4YmFkMDM2MDUsXG4gIDB4Y2RkNzA2OTMsIDB4NTRkZTU3MjksIDB4MjNkOTY3YmYsIDB4YjM2NjdhMmUsIDB4YzQ2MTRhYjgsXG4gIDB4NWQ2ODFiMDIsIDB4MmE2ZjJiOTQsIDB4YjQwYmJlMzcsIDB4YzMwYzhlYTEsIDB4NWEwNWRmMWIsXG4gIDB4MmQwMmVmOGRcbl07XG5cbmlmICh0eXBlb2YgSW50MzJBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgQ1JDX1RBQkxFID0gbmV3IEludDMyQXJyYXkoQ1JDX1RBQkxFKTtcbn1cblxuZnVuY3Rpb24gbmV3RW1wdHlCdWZmZXIobGVuZ3RoKSB7XG4gIHZhciBidWZmZXIgPSBuZXcgQnVmZmVyKGxlbmd0aCk7XG4gIGJ1ZmZlci5maWxsKDB4MDApO1xuICByZXR1cm4gYnVmZmVyO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVCdWZmZXIoaW5wdXQpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihpbnB1dCkpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cblxuICB2YXIgaGFzTmV3QnVmZmVyQVBJID1cbiAgICAgIHR5cGVvZiBCdWZmZXIuYWxsb2MgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgdHlwZW9mIEJ1ZmZlci5mcm9tID09PSBcImZ1bmN0aW9uXCI7XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBoYXNOZXdCdWZmZXJBUEkgPyBCdWZmZXIuYWxsb2MoaW5wdXQpIDogbmV3RW1wdHlCdWZmZXIoaW5wdXQpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBoYXNOZXdCdWZmZXJBUEkgPyBCdWZmZXIuZnJvbShpbnB1dCkgOiBuZXcgQnVmZmVyKGlucHV0KTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnB1dCBtdXN0IGJlIGJ1ZmZlciwgbnVtYmVyLCBvciBzdHJpbmcsIHJlY2VpdmVkIFwiICtcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGlucHV0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWZmZXJpemVJbnQobnVtKSB7XG4gIHZhciB0bXAgPSBlbnN1cmVCdWZmZXIoNCk7XG4gIHRtcC53cml0ZUludDMyQkUobnVtLCAwKTtcbiAgcmV0dXJuIHRtcDtcbn1cblxuZnVuY3Rpb24gX2NyYzMyKGJ1ZiwgcHJldmlvdXMpIHtcbiAgYnVmID0gZW5zdXJlQnVmZmVyKGJ1Zik7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIocHJldmlvdXMpKSB7XG4gICAgcHJldmlvdXMgPSBwcmV2aW91cy5yZWFkVUludDMyQkUoMCk7XG4gIH1cbiAgdmFyIGNyYyA9IH5+cHJldmlvdXMgXiAtMTtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCBidWYubGVuZ3RoOyBuKyspIHtcbiAgICBjcmMgPSBDUkNfVEFCTEVbKGNyYyBeIGJ1ZltuXSkgJiAweGZmXSBeIChjcmMgPj4+IDgpO1xuICB9XG4gIHJldHVybiAoY3JjIF4gLTEpO1xufVxuXG5mdW5jdGlvbiBjcmMzMigpIHtcbiAgcmV0dXJuIGJ1ZmZlcml6ZUludChfY3JjMzIuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG59XG5jcmMzMi5zaWduZWQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBfY3JjMzIuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5jcmMzMi51bnNpZ25lZCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIF9jcmMzMi5hcHBseShudWxsLCBhcmd1bWVudHMpID4+PiAwO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmMzMjtcbiIsIm1vZHVsZS5leHBvcnRzLkVERlNNaWRkbGV3YXJlID0gcmVxdWlyZShcIi4vbGliL0VERlNNaWRkbGV3YXJlXCIpO1xuXG5cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRcdFx0XHRcdGNyZWF0ZVF1ZTogcmVxdWlyZShcIi4vbGliL2ZvbGRlck1RXCIpLmdldEZvbGRlclF1ZXVlXG5cdFx0XHRcdFx0Ly9mb2xkZXJNUTogcmVxdWlyZShcIi4vbGliL2ZvbGRlck1RXCIpXG59OyIsInZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbnZhciBzdHJlYW0gPSByZXF1aXJlKCdzdHJlYW0nKTtcbnZhciBSZWFkYWJsZSA9IHN0cmVhbS5SZWFkYWJsZTtcbnZhciBXcml0YWJsZSA9IHN0cmVhbS5Xcml0YWJsZTtcbnZhciBQYXNzVGhyb3VnaCA9IHN0cmVhbS5QYXNzVGhyb3VnaDtcbnZhciBQZW5kID0gcmVxdWlyZSgnLi9tb2R1bGVzL25vZGUtcGVuZCcpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuZXhwb3J0cy5jcmVhdGVGcm9tQnVmZmVyID0gY3JlYXRlRnJvbUJ1ZmZlcjtcbmV4cG9ydHMuY3JlYXRlRnJvbUZkID0gY3JlYXRlRnJvbUZkO1xuZXhwb3J0cy5CdWZmZXJTbGljZXIgPSBCdWZmZXJTbGljZXI7XG5leHBvcnRzLkZkU2xpY2VyID0gRmRTbGljZXI7XG5cbnV0aWwuaW5oZXJpdHMoRmRTbGljZXIsIEV2ZW50RW1pdHRlcik7XG5mdW5jdGlvbiBGZFNsaWNlcihmZCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgdGhpcy5mZCA9IGZkO1xuICB0aGlzLnBlbmQgPSBuZXcgUGVuZCgpO1xuICB0aGlzLnBlbmQubWF4ID0gMTtcbiAgdGhpcy5yZWZDb3VudCA9IDA7XG4gIHRoaXMuYXV0b0Nsb3NlID0gISFvcHRpb25zLmF1dG9DbG9zZTtcbn1cblxuRmRTbGljZXIucHJvdG90eXBlLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLnBlbmQuZ28oZnVuY3Rpb24oY2IpIHtcbiAgICBmcy5yZWFkKHNlbGYuZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBmdW5jdGlvbihlcnIsIGJ5dGVzUmVhZCwgYnVmZmVyKSB7XG4gICAgICBjYigpO1xuICAgICAgY2FsbGJhY2soZXJyLCBieXRlc1JlYWQsIGJ1ZmZlcik7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuRmRTbGljZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5wZW5kLmdvKGZ1bmN0aW9uKGNiKSB7XG4gICAgZnMud3JpdGUoc2VsZi5mZCwgYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGZ1bmN0aW9uKGVyciwgd3JpdHRlbiwgYnVmZmVyKSB7XG4gICAgICBjYigpO1xuICAgICAgY2FsbGJhY2soZXJyLCB3cml0dGVuLCBidWZmZXIpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbkZkU2xpY2VyLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICByZXR1cm4gbmV3IFJlYWRTdHJlYW0odGhpcywgb3B0aW9ucyk7XG59O1xuXG5GZFNsaWNlci5wcm90b3R5cGUuY3JlYXRlV3JpdGVTdHJlYW0gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgV3JpdGVTdHJlYW0odGhpcywgb3B0aW9ucyk7XG59O1xuXG5GZFNsaWNlci5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucmVmQ291bnQgKz0gMTtcbn07XG5cbkZkU2xpY2VyLnByb3RvdHlwZS51bnJlZiA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYucmVmQ291bnQgLT0gMTtcblxuICBpZiAoc2VsZi5yZWZDb3VudCA+IDApIHJldHVybjtcbiAgaWYgKHNlbGYucmVmQ291bnQgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHVucmVmXCIpO1xuXG4gIGlmIChzZWxmLmF1dG9DbG9zZSkge1xuICAgIGZzLmNsb3NlKHNlbGYuZmQsIG9uQ2xvc2VEb25lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQ2xvc2VEb25lKGVycikge1xuICAgIGlmIChlcnIpIHtcbiAgICAgIHNlbGYuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLmVtaXQoJ2Nsb3NlJyk7XG4gICAgfVxuICB9XG59O1xuXG51dGlsLmluaGVyaXRzKFJlYWRTdHJlYW0sIFJlYWRhYmxlKTtcbmZ1bmN0aW9uIFJlYWRTdHJlYW0oY29udGV4dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgUmVhZGFibGUuY2FsbCh0aGlzLCBvcHRpb25zKTtcblxuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLmNvbnRleHQucmVmKCk7XG5cbiAgdGhpcy5zdGFydCA9IG9wdGlvbnMuc3RhcnQgfHwgMDtcbiAgdGhpcy5lbmRPZmZzZXQgPSBvcHRpb25zLmVuZDtcbiAgdGhpcy5wb3MgPSB0aGlzLnN0YXJ0O1xuICB0aGlzLmRlc3Ryb3llZCA9IGZhbHNlO1xufVxuXG5SZWFkU3RyZWFtLnByb3RvdHlwZS5fcmVhZCA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAoc2VsZi5kZXN0cm95ZWQpIHJldHVybjtcblxuICB2YXIgdG9SZWFkID0gTWF0aC5taW4oc2VsZi5fcmVhZGFibGVTdGF0ZS5oaWdoV2F0ZXJNYXJrLCBuKTtcbiAgaWYgKHNlbGYuZW5kT2Zmc2V0ICE9IG51bGwpIHtcbiAgICB0b1JlYWQgPSBNYXRoLm1pbih0b1JlYWQsIHNlbGYuZW5kT2Zmc2V0IC0gc2VsZi5wb3MpO1xuICB9XG4gIGlmICh0b1JlYWQgPD0gMCkge1xuICAgIHNlbGYuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICBzZWxmLnB1c2gobnVsbCk7XG4gICAgc2VsZi5jb250ZXh0LnVucmVmKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHNlbGYuY29udGV4dC5wZW5kLmdvKGZ1bmN0aW9uKGNiKSB7XG4gICAgaWYgKHNlbGYuZGVzdHJveWVkKSByZXR1cm4gY2IoKTtcbiAgICB2YXIgYnVmZmVyID0gbmV3IEJ1ZmZlcih0b1JlYWQpO1xuICAgIGZzLnJlYWQoc2VsZi5jb250ZXh0LmZkLCBidWZmZXIsIDAsIHRvUmVhZCwgc2VsZi5wb3MsIGZ1bmN0aW9uKGVyciwgYnl0ZXNSZWFkKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHNlbGYuZGVzdHJveShlcnIpO1xuICAgICAgfSBlbHNlIGlmIChieXRlc1JlYWQgPT09IDApIHtcbiAgICAgICAgc2VsZi5kZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgICBzZWxmLnB1c2gobnVsbCk7XG4gICAgICAgIHNlbGYuY29udGV4dC51bnJlZigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5wb3MgKz0gYnl0ZXNSZWFkO1xuICAgICAgICBzZWxmLnB1c2goYnVmZmVyLnNsaWNlKDAsIGJ5dGVzUmVhZCkpO1xuICAgICAgfVxuICAgICAgY2IoKTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG5SZWFkU3RyZWFtLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oZXJyKSB7XG4gIGlmICh0aGlzLmRlc3Ryb3llZCkgcmV0dXJuO1xuICBlcnIgPSBlcnIgfHwgbmV3IEVycm9yKFwic3RyZWFtIGRlc3Ryb3llZFwiKTtcbiAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgdGhpcy5jb250ZXh0LnVucmVmKCk7XG59O1xuXG51dGlsLmluaGVyaXRzKFdyaXRlU3RyZWFtLCBXcml0YWJsZSk7XG5mdW5jdGlvbiBXcml0ZVN0cmVhbShjb250ZXh0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBXcml0YWJsZS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXG4gIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gIHRoaXMuY29udGV4dC5yZWYoKTtcblxuICB0aGlzLnN0YXJ0ID0gb3B0aW9ucy5zdGFydCB8fCAwO1xuICB0aGlzLmVuZE9mZnNldCA9IChvcHRpb25zLmVuZCA9PSBudWxsKSA/IEluZmluaXR5IDogK29wdGlvbnMuZW5kO1xuICB0aGlzLmJ5dGVzV3JpdHRlbiA9IDA7XG4gIHRoaXMucG9zID0gdGhpcy5zdGFydDtcbiAgdGhpcy5kZXN0cm95ZWQgPSBmYWxzZTtcblxuICB0aGlzLm9uKCdmaW5pc2gnLCB0aGlzLmRlc3Ryb3kuYmluZCh0aGlzKSk7XG59XG5cbldyaXRlU3RyZWFtLnByb3RvdHlwZS5fd3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIGVuY29kaW5nLCBjYWxsYmFjaykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGlmIChzZWxmLmRlc3Ryb3llZCkgcmV0dXJuO1xuXG4gIGlmIChzZWxmLnBvcyArIGJ1ZmZlci5sZW5ndGggPiBzZWxmLmVuZE9mZnNldCkge1xuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoXCJtYXhpbXVtIGZpbGUgbGVuZ3RoIGV4Y2VlZGVkXCIpO1xuICAgIGVyci5jb2RlID0gJ0VUT09CSUcnO1xuICAgIHNlbGYuZGVzdHJveSgpO1xuICAgIGNhbGxiYWNrKGVycik7XG4gICAgcmV0dXJuO1xuICB9XG4gIHNlbGYuY29udGV4dC5wZW5kLmdvKGZ1bmN0aW9uKGNiKSB7XG4gICAgaWYgKHNlbGYuZGVzdHJveWVkKSByZXR1cm4gY2IoKTtcbiAgICBmcy53cml0ZShzZWxmLmNvbnRleHQuZmQsIGJ1ZmZlciwgMCwgYnVmZmVyLmxlbmd0aCwgc2VsZi5wb3MsIGZ1bmN0aW9uKGVyciwgYnl0ZXMpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIGNiKCk7XG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZWxmLmJ5dGVzV3JpdHRlbiArPSBieXRlcztcbiAgICAgICAgc2VsZi5wb3MgKz0gYnl0ZXM7XG4gICAgICAgIHNlbGYuZW1pdCgncHJvZ3Jlc3MnKTtcbiAgICAgICAgY2IoKTtcbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59O1xuXG5Xcml0ZVN0cmVhbS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVybjtcbiAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICB0aGlzLmNvbnRleHQudW5yZWYoKTtcbn07XG5cbnV0aWwuaW5oZXJpdHMoQnVmZmVyU2xpY2VyLCBFdmVudEVtaXR0ZXIpO1xuZnVuY3Rpb24gQnVmZmVyU2xpY2VyKGJ1ZmZlciwgb3B0aW9ucykge1xuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKTtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yZWZDb3VudCA9IDA7XG4gIHRoaXMuYnVmZmVyID0gYnVmZmVyO1xuICB0aGlzLm1heENodW5rU2l6ZSA9IG9wdGlvbnMubWF4Q2h1bmtTaXplIHx8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5CdWZmZXJTbGljZXIucHJvdG90eXBlLnJlYWQgPSBmdW5jdGlvbihidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spIHtcbiAgdmFyIGVuZCA9IHBvc2l0aW9uICsgbGVuZ3RoO1xuICB2YXIgZGVsdGEgPSBlbmQgLSB0aGlzLmJ1ZmZlci5sZW5ndGg7XG4gIHZhciB3cml0dGVuID0gKGRlbHRhID4gMCkgPyBkZWx0YSA6IGxlbmd0aDtcbiAgdGhpcy5idWZmZXIuY29weShidWZmZXIsIG9mZnNldCwgcG9zaXRpb24sIGVuZCk7XG4gIHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICBjYWxsYmFjayhudWxsLCB3cml0dGVuKTtcbiAgfSk7XG59O1xuXG5CdWZmZXJTbGljZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKSB7XG4gIGJ1ZmZlci5jb3B5KHRoaXMuYnVmZmVyLCBwb3NpdGlvbiwgb2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGgpO1xuICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgbGVuZ3RoLCBidWZmZXIpO1xuICB9KTtcbn07XG5cbkJ1ZmZlclNsaWNlci5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciByZWFkU3RyZWFtID0gbmV3IFBhc3NUaHJvdWdoKG9wdGlvbnMpO1xuICByZWFkU3RyZWFtLmRlc3Ryb3llZCA9IGZhbHNlO1xuICByZWFkU3RyZWFtLnN0YXJ0ID0gb3B0aW9ucy5zdGFydCB8fCAwO1xuICByZWFkU3RyZWFtLmVuZE9mZnNldCA9IG9wdGlvbnMuZW5kO1xuICAvLyBieSB0aGUgdGltZSB0aGlzIGZ1bmN0aW9uIHJldHVybnMsIHdlJ2xsIGJlIGRvbmUuXG4gIHJlYWRTdHJlYW0ucG9zID0gcmVhZFN0cmVhbS5lbmRPZmZzZXQgfHwgdGhpcy5idWZmZXIubGVuZ3RoO1xuXG4gIC8vIHJlc3BlY3QgdGhlIG1heENodW5rU2l6ZSBvcHRpb24gdG8gc2xpY2UgdXAgdGhlIGNodW5rIGludG8gc21hbGxlciBwaWVjZXMuXG4gIHZhciBlbnRpcmVTbGljZSA9IHRoaXMuYnVmZmVyLnNsaWNlKHJlYWRTdHJlYW0uc3RhcnQsIHJlYWRTdHJlYW0ucG9zKTtcbiAgdmFyIG9mZnNldCA9IDA7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgdmFyIG5leHRPZmZzZXQgPSBvZmZzZXQgKyB0aGlzLm1heENodW5rU2l6ZTtcbiAgICBpZiAobmV4dE9mZnNldCA+PSBlbnRpcmVTbGljZS5sZW5ndGgpIHtcbiAgICAgIC8vIGxhc3QgY2h1bmtcbiAgICAgIGlmIChvZmZzZXQgPCBlbnRpcmVTbGljZS5sZW5ndGgpIHtcbiAgICAgICAgcmVhZFN0cmVhbS53cml0ZShlbnRpcmVTbGljZS5zbGljZShvZmZzZXQsIGVudGlyZVNsaWNlLmxlbmd0aCkpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJlYWRTdHJlYW0ud3JpdGUoZW50aXJlU2xpY2Uuc2xpY2Uob2Zmc2V0LCBuZXh0T2Zmc2V0KSk7XG4gICAgb2Zmc2V0ID0gbmV4dE9mZnNldDtcbiAgfVxuXG4gIHJlYWRTdHJlYW0uZW5kKCk7XG4gIHJlYWRTdHJlYW0uZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICAgIHJlYWRTdHJlYW0uZGVzdHJveWVkID0gdHJ1ZTtcbiAgfTtcbiAgcmV0dXJuIHJlYWRTdHJlYW07XG59O1xuXG5CdWZmZXJTbGljZXIucHJvdG90eXBlLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICB2YXIgYnVmZmVyU2xpY2VyID0gdGhpcztcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHZhciB3cml0ZVN0cmVhbSA9IG5ldyBXcml0YWJsZShvcHRpb25zKTtcbiAgd3JpdGVTdHJlYW0uc3RhcnQgPSBvcHRpb25zLnN0YXJ0IHx8IDA7XG4gIHdyaXRlU3RyZWFtLmVuZE9mZnNldCA9IChvcHRpb25zLmVuZCA9PSBudWxsKSA/IHRoaXMuYnVmZmVyLmxlbmd0aCA6ICtvcHRpb25zLmVuZDtcbiAgd3JpdGVTdHJlYW0uYnl0ZXNXcml0dGVuID0gMDtcbiAgd3JpdGVTdHJlYW0ucG9zID0gd3JpdGVTdHJlYW0uc3RhcnQ7XG4gIHdyaXRlU3RyZWFtLmRlc3Ryb3llZCA9IGZhbHNlO1xuICB3cml0ZVN0cmVhbS5fd3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIGVuY29kaW5nLCBjYWxsYmFjaykge1xuICAgIGlmICh3cml0ZVN0cmVhbS5kZXN0cm95ZWQpIHJldHVybjtcblxuICAgIHZhciBlbmQgPSB3cml0ZVN0cmVhbS5wb3MgKyBidWZmZXIubGVuZ3RoO1xuICAgIGlmIChlbmQgPiB3cml0ZVN0cmVhbS5lbmRPZmZzZXQpIHtcbiAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoXCJtYXhpbXVtIGZpbGUgbGVuZ3RoIGV4Y2VlZGVkXCIpO1xuICAgICAgZXJyLmNvZGUgPSAnRVRPT0JJRyc7XG4gICAgICB3cml0ZVN0cmVhbS5kZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYnVmZmVyLmNvcHkoYnVmZmVyU2xpY2VyLmJ1ZmZlciwgd3JpdGVTdHJlYW0ucG9zLCAwLCBidWZmZXIubGVuZ3RoKTtcblxuICAgIHdyaXRlU3RyZWFtLmJ5dGVzV3JpdHRlbiArPSBidWZmZXIubGVuZ3RoO1xuICAgIHdyaXRlU3RyZWFtLnBvcyA9IGVuZDtcbiAgICB3cml0ZVN0cmVhbS5lbWl0KCdwcm9ncmVzcycpO1xuICAgIGNhbGxiYWNrKCk7XG4gIH07XG4gIHdyaXRlU3RyZWFtLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICB3cml0ZVN0cmVhbS5kZXN0cm95ZWQgPSB0cnVlO1xuICB9O1xuICByZXR1cm4gd3JpdGVTdHJlYW07XG59O1xuXG5CdWZmZXJTbGljZXIucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJlZkNvdW50ICs9IDE7XG59O1xuXG5CdWZmZXJTbGljZXIucHJvdG90eXBlLnVucmVmID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucmVmQ291bnQgLT0gMTtcblxuICBpZiAodGhpcy5yZWZDb3VudCA8IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHVucmVmXCIpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjcmVhdGVGcm9tQnVmZmVyKGJ1ZmZlciwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IEJ1ZmZlclNsaWNlcihidWZmZXIsIG9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVGcm9tRmQoZmQsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBGZFNsaWNlcihmZCwgb3B0aW9ucyk7XG59XG4iLCIvL3RvIGxvb2sgbmljZSB0aGUgcmVxdWlyZU1vZHVsZSBvbiBOb2RlXG5yZXF1aXJlKFwiLi9saWIvcHNrLWFic3RyYWN0LWNsaWVudFwiKTtcbmlmKCEkJC5icm93c2VyUnVudGltZSl7XG5cdHJlcXVpcmUoXCIuL2xpYi9wc2stbm9kZS1jbGllbnRcIik7XG59ZWxzZXtcblx0cmVxdWlyZShcIi4vbGliL3Bzay1icm93c2VyLWNsaWVudFwiKTtcbn0iLCJjb25zdCBCbG9ja2NoYWluID0gcmVxdWlyZSgnLi9saWIvQmxvY2tjaGFpbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzdGFydERCOiBmdW5jdGlvbiAoZm9sZGVyKSB7XG4gICAgICAgIGlmICgkJC5ibG9ja2NoYWluKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJyQkLmJsb2NrY2hhaW4gaXMgYWxyZWFkeSBkZWZpbmVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgJCQuYmxvY2tjaGFpbiA9IHRoaXMuY3JlYXRlREJIYW5kbGVyKGZvbGRlcik7XG4gICAgICAgIHJldHVybiAkJC5ibG9ja2NoYWluO1xuICAgIH0sXG4gICAgY3JlYXRlREJIYW5kbGVyOiBmdW5jdGlvbihmb2xkZXIpe1xuICAgICAgICByZXF1aXJlKCcuL2xpYi9kb21haW4nKTtcbiAgICAgICAgcmVxdWlyZSgnLi9saWIvc3dhcm1zJyk7XG5cbiAgICAgICAgY29uc3QgZnBkcyA9IHJlcXVpcmUoXCIuL2xpYi9Gb2xkZXJQZXJzaXN0ZW50UERTXCIpO1xuICAgICAgICBjb25zdCBwZHMgPSBmcGRzLm5ld1BEUyhmb2xkZXIpO1xuXG4gICAgICAgIHJldHVybiBuZXcgQmxvY2tjaGFpbihwZHMpO1xuICAgIH0sXG4gICAgcGFyc2VEb21haW5Vcmw6IGZ1bmN0aW9uIChkb21haW5VcmwpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJFbXB0eSBmdW5jdGlvblwiKTtcbiAgICB9LFxuICAgIGdldERvbWFpbkluZm86IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJFbXB0eSBmdW5jdGlvblwiKTtcbiAgICB9LFxuICAgIHN0YXJ0SW5NZW1vcnlEQjogZnVuY3Rpb24oKSB7XG5cdFx0cmVxdWlyZSgnLi9saWIvZG9tYWluJyk7XG5cdFx0cmVxdWlyZSgnLi9saWIvc3dhcm1zJyk7XG5cblx0XHRjb25zdCBwZHMgPSByZXF1aXJlKCcuL2xpYi9Jbk1lbW9yeVBEUycpO1xuXG5cdFx0cmV0dXJuIG5ldyBCbG9ja2NoYWluKHBkcy5uZXdQRFMobnVsbCkpO1xuICAgIH0sXG4gICAgc3RhcnREYjogZnVuY3Rpb24ocmVhZGVyV3JpdGVyKSB7XG4gICAgICAgIHJlcXVpcmUoJy4vbGliL2RvbWFpbicpO1xuICAgICAgICByZXF1aXJlKCcuL2xpYi9zd2FybXMnKTtcblxuICAgICAgICBjb25zdCBwcGRzID0gcmVxdWlyZShcIi4vbGliL1BlcnNpc3RlbnRQRFNcIik7XG4gICAgICAgIGNvbnN0IHBkcyA9IHBwZHMubmV3UERTKHJlYWRlcldyaXRlcik7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBCbG9ja2NoYWluKHBkcyk7XG4gICAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNvbnNVdGlsOiByZXF1aXJlKCcuL2NvbnNVdGlsJylcbn07IiwiY29uc3QgU2VydmVyID0gcmVxdWlyZSgnLi9WaXJ0dWFsTVEuanMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2ZXI7XG4iLCJ2YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XG52YXIgemxpYiA9IHJlcXVpcmUoXCJ6bGliXCIpO1xuY29uc3QgZmRfc2xpY2VyID0gcmVxdWlyZShcIm5vZGUtZmQtc2xpY2VyXCIpO1xudmFyIGNyYzMyID0gcmVxdWlyZShcImJ1ZmZlci1jcmMzMlwiKTtcbnZhciB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImV2ZW50c1wiKS5FdmVudEVtaXR0ZXI7XG52YXIgVHJhbnNmb3JtID0gcmVxdWlyZShcInN0cmVhbVwiKS5UcmFuc2Zvcm07XG52YXIgUGFzc1Rocm91Z2ggPSByZXF1aXJlKFwic3RyZWFtXCIpLlBhc3NUaHJvdWdoO1xudmFyIFdyaXRhYmxlID0gcmVxdWlyZShcInN0cmVhbVwiKS5Xcml0YWJsZTtcblxuZXhwb3J0cy5vcGVuID0gb3BlbjtcbmV4cG9ydHMuZnJvbUZkID0gZnJvbUZkO1xuZXhwb3J0cy5mcm9tQnVmZmVyID0gZnJvbUJ1ZmZlcjtcbmV4cG9ydHMuZnJvbVJhbmRvbUFjY2Vzc1JlYWRlciA9IGZyb21SYW5kb21BY2Nlc3NSZWFkZXI7XG5leHBvcnRzLmRvc0RhdGVUaW1lVG9EYXRlID0gZG9zRGF0ZVRpbWVUb0RhdGU7XG5leHBvcnRzLnZhbGlkYXRlRmlsZU5hbWUgPSB2YWxpZGF0ZUZpbGVOYW1lO1xuZXhwb3J0cy5aaXBGaWxlID0gWmlwRmlsZTtcbmV4cG9ydHMuRW50cnkgPSBFbnRyeTtcbmV4cG9ydHMuUmFuZG9tQWNjZXNzUmVhZGVyID0gUmFuZG9tQWNjZXNzUmVhZGVyO1xuXG5mdW5jdGlvbiBvcGVuKHBhdGgsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0Y2FsbGJhY2sgPSBvcHRpb25zO1xuXHRcdG9wdGlvbnMgPSBudWxsO1xuXHR9XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuYXV0b0Nsb3NlID09IG51bGwpIG9wdGlvbnMuYXV0b0Nsb3NlID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMubGF6eUVudHJpZXMgPT0gbnVsbCkgb3B0aW9ucy5sYXp5RW50cmllcyA9IGZhbHNlO1xuXHRpZiAob3B0aW9ucy5kZWNvZGVTdHJpbmdzID09IG51bGwpIG9wdGlvbnMuZGVjb2RlU3RyaW5ncyA9IHRydWU7XG5cdGlmIChvcHRpb25zLnZhbGlkYXRlRW50cnlTaXplcyA9PSBudWxsKSBvcHRpb25zLnZhbGlkYXRlRW50cnlTaXplcyA9IHRydWU7XG5cdGlmIChvcHRpb25zLnN0cmljdEZpbGVOYW1lcyA9PSBudWxsKSBvcHRpb25zLnN0cmljdEZpbGVOYW1lcyA9IGZhbHNlO1xuXHRpZiAoY2FsbGJhY2sgPT0gbnVsbCkgY2FsbGJhY2sgPSBkZWZhdWx0Q2FsbGJhY2s7XG5cdGZzLm9wZW4ocGF0aCwgXCJyXCIsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0ZnJvbUZkKGZkLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCB6aXBmaWxlKSB7XG5cdFx0XHRpZiAoZXJyKSBmcy5jbG9zZShmZCwgZGVmYXVsdENhbGxiYWNrKTtcblx0XHRcdGNhbGxiYWNrKGVyciwgemlwZmlsZSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBmcm9tRmQoZmQsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0Y2FsbGJhY2sgPSBvcHRpb25zO1xuXHRcdG9wdGlvbnMgPSBudWxsO1xuXHR9XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuYXV0b0Nsb3NlID09IG51bGwpIG9wdGlvbnMuYXV0b0Nsb3NlID0gZmFsc2U7XG5cdGlmIChvcHRpb25zLmxhenlFbnRyaWVzID09IG51bGwpIG9wdGlvbnMubGF6eUVudHJpZXMgPSBmYWxzZTtcblx0aWYgKG9wdGlvbnMuZGVjb2RlU3RyaW5ncyA9PSBudWxsKSBvcHRpb25zLmRlY29kZVN0cmluZ3MgPSB0cnVlO1xuXHRpZiAob3B0aW9ucy52YWxpZGF0ZUVudHJ5U2l6ZXMgPT0gbnVsbCkgb3B0aW9ucy52YWxpZGF0ZUVudHJ5U2l6ZXMgPSB0cnVlO1xuXHRpZiAob3B0aW9ucy5zdHJpY3RGaWxlTmFtZXMgPT0gbnVsbCkgb3B0aW9ucy5zdHJpY3RGaWxlTmFtZXMgPSBmYWxzZTtcblx0aWYgKGNhbGxiYWNrID09IG51bGwpIGNhbGxiYWNrID0gZGVmYXVsdENhbGxiYWNrO1xuXHRmcy5mc3RhdChmZCwgZnVuY3Rpb24gKGVyciwgc3RhdHMpIHtcblx0XHRpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHR2YXIgcmVhZGVyID0gZmRfc2xpY2VyLmNyZWF0ZUZyb21GZChmZCwge2F1dG9DbG9zZTogdHJ1ZX0pO1xuXHRcdGZyb21SYW5kb21BY2Nlc3NSZWFkZXIocmVhZGVyLCBzdGF0cy5zaXplLCBvcHRpb25zLCBjYWxsYmFjayk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyKGJ1ZmZlciwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0aWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRjYWxsYmFjayA9IG9wdGlvbnM7XG5cdFx0b3B0aW9ucyA9IG51bGw7XG5cdH1cblx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgb3B0aW9ucyA9IHt9O1xuXHRvcHRpb25zLmF1dG9DbG9zZSA9IGZhbHNlO1xuXHRpZiAob3B0aW9ucy5sYXp5RW50cmllcyA9PSBudWxsKSBvcHRpb25zLmxhenlFbnRyaWVzID0gZmFsc2U7XG5cdGlmIChvcHRpb25zLmRlY29kZVN0cmluZ3MgPT0gbnVsbCkgb3B0aW9ucy5kZWNvZGVTdHJpbmdzID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID09IG51bGwpIG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID09IG51bGwpIG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID0gZmFsc2U7XG5cdC8vIGxpbWl0IHRoZSBtYXggY2h1bmsgc2l6ZS4gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90aGVqb3Nod29sZmUveWF1emwvaXNzdWVzLzg3XG5cdHZhciByZWFkZXIgPSBmZF9zbGljZXIuY3JlYXRlRnJvbUJ1ZmZlcihidWZmZXIsIHttYXhDaHVua1NpemU6IDB4MTAwMDB9KTtcblx0ZnJvbVJhbmRvbUFjY2Vzc1JlYWRlcihyZWFkZXIsIGJ1ZmZlci5sZW5ndGgsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gZnJvbVJhbmRvbUFjY2Vzc1JlYWRlcihyZWFkZXIsIHRvdGFsU2l6ZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0aWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRjYWxsYmFjayA9IG9wdGlvbnM7XG5cdFx0b3B0aW9ucyA9IG51bGw7XG5cdH1cblx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgb3B0aW9ucyA9IHt9O1xuXHRpZiAob3B0aW9ucy5hdXRvQ2xvc2UgPT0gbnVsbCkgb3B0aW9ucy5hdXRvQ2xvc2UgPSB0cnVlO1xuXHRpZiAob3B0aW9ucy5sYXp5RW50cmllcyA9PSBudWxsKSBvcHRpb25zLmxhenlFbnRyaWVzID0gZmFsc2U7XG5cdGlmIChvcHRpb25zLmRlY29kZVN0cmluZ3MgPT0gbnVsbCkgb3B0aW9ucy5kZWNvZGVTdHJpbmdzID0gdHJ1ZTtcblx0dmFyIGRlY29kZVN0cmluZ3MgPSAhIW9wdGlvbnMuZGVjb2RlU3RyaW5ncztcblx0aWYgKG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID09IG51bGwpIG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID09IG51bGwpIG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID0gZmFsc2U7XG5cdGlmIChjYWxsYmFjayA9PSBudWxsKSBjYWxsYmFjayA9IGRlZmF1bHRDYWxsYmFjaztcblx0aWYgKHR5cGVvZiB0b3RhbFNpemUgIT09IFwibnVtYmVyXCIpIHRocm93IG5ldyBFcnJvcihcImV4cGVjdGVkIHRvdGFsU2l6ZSBwYXJhbWV0ZXIgdG8gYmUgYSBudW1iZXJcIik7XG5cdGlmICh0b3RhbFNpemUgPiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcInppcCBmaWxlIHRvbyBsYXJnZS4gb25seSBmaWxlIHNpemVzIHVwIHRvIDJeNTIgYXJlIHN1cHBvcnRlZCBkdWUgdG8gSmF2YVNjcmlwdCdzIE51bWJlciB0eXBlIGJlaW5nIGFuIElFRUUgNzU0IGRvdWJsZS5cIik7XG5cdH1cblxuXHQvLyB0aGUgbWF0Y2hpbmcgdW5yZWYoKSBjYWxsIGlzIGluIHppcGZpbGUuY2xvc2UoKVxuXHRyZWFkZXIucmVmKCk7XG5cblx0Ly8gZW9jZHIgbWVhbnMgRW5kIG9mIENlbnRyYWwgRGlyZWN0b3J5IFJlY29yZC5cblx0Ly8gc2VhcmNoIGJhY2t3YXJkcyBmb3IgdGhlIGVvY2RyIHNpZ25hdHVyZS5cblx0Ly8gdGhlIGxhc3QgZmllbGQgb2YgdGhlIGVvY2RyIGlzIGEgdmFyaWFibGUtbGVuZ3RoIGNvbW1lbnQuXG5cdC8vIHRoZSBjb21tZW50IHNpemUgaXMgZW5jb2RlZCBpbiBhIDItYnl0ZSBmaWVsZCBpbiB0aGUgZW9jZHIsIHdoaWNoIHdlIGNhbid0IGZpbmQgd2l0aG91dCB0cnVkZ2luZyBiYWNrd2FyZHMgdGhyb3VnaCB0aGUgY29tbWVudCB0byBmaW5kIGl0LlxuXHQvLyBhcyBhIGNvbnNlcXVlbmNlIG9mIHRoaXMgZGVzaWduIGRlY2lzaW9uLCBpdCdzIHBvc3NpYmxlIHRvIGhhdmUgYW1iaWd1b3VzIHppcCBmaWxlIG1ldGFkYXRhIGlmIGEgY29oZXJlbnQgZW9jZHIgd2FzIGluIHRoZSBjb21tZW50LlxuXHQvLyB3ZSBzZWFyY2ggYmFja3dhcmRzIGZvciBhIGVvY2RyIHNpZ25hdHVyZSwgYW5kIGhvcGUgdGhhdCB3aG9ldmVyIG1hZGUgdGhlIHppcCBmaWxlIHdhcyBzbWFydCBlbm91Z2ggdG8gZm9yYmlkIHRoZSBlb2NkciBzaWduYXR1cmUgaW4gdGhlIGNvbW1lbnQuXG5cdHZhciBlb2NkcldpdGhvdXRDb21tZW50U2l6ZSA9IDIyO1xuXHR2YXIgbWF4Q29tbWVudFNpemUgPSAweGZmZmY7IC8vIDItYnl0ZSBzaXplXG5cdHZhciBidWZmZXJTaXplID0gTWF0aC5taW4oZW9jZHJXaXRob3V0Q29tbWVudFNpemUgKyBtYXhDb21tZW50U2l6ZSwgdG90YWxTaXplKTtcblx0dmFyIGJ1ZmZlciA9IG5ld0J1ZmZlcihidWZmZXJTaXplKTtcblx0dmFyIGJ1ZmZlclJlYWRTdGFydCA9IHRvdGFsU2l6ZSAtIGJ1ZmZlci5sZW5ndGg7XG5cdHJlYWRBbmRBc3NlcnROb0VvZihyZWFkZXIsIGJ1ZmZlciwgMCwgYnVmZmVyU2l6ZSwgYnVmZmVyUmVhZFN0YXJ0LCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0Zm9yICh2YXIgaSA9IGJ1ZmZlclNpemUgLSBlb2NkcldpdGhvdXRDb21tZW50U2l6ZTsgaSA+PSAwOyBpIC09IDEpIHtcblx0XHRcdGlmIChidWZmZXIucmVhZFVJbnQzMkxFKGkpICE9PSAweDA2MDU0YjUwKSBjb250aW51ZTtcblx0XHRcdC8vIGZvdW5kIGVvY2RyXG5cdFx0XHR2YXIgZW9jZHJCdWZmZXIgPSBidWZmZXIuc2xpY2UoaSk7XG5cblx0XHRcdC8vIDAgLSBFbmQgb2YgY2VudHJhbCBkaXJlY3Rvcnkgc2lnbmF0dXJlID0gMHgwNjA1NGI1MFxuXHRcdFx0Ly8gNCAtIE51bWJlciBvZiB0aGlzIGRpc2tcblx0XHRcdHZhciBkaXNrTnVtYmVyID0gZW9jZHJCdWZmZXIucmVhZFVJbnQxNkxFKDQpO1xuXHRcdFx0aWYgKGRpc2tOdW1iZXIgIT09IDApIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIm11bHRpLWRpc2sgemlwIGZpbGVzIGFyZSBub3Qgc3VwcG9ydGVkOiBmb3VuZCBkaXNrIG51bWJlcjogXCIgKyBkaXNrTnVtYmVyKSk7XG5cdFx0XHR9XG5cdFx0XHQvLyA2IC0gRGlzayB3aGVyZSBjZW50cmFsIGRpcmVjdG9yeSBzdGFydHNcblx0XHRcdC8vIDggLSBOdW1iZXIgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkcyBvbiB0aGlzIGRpc2tcblx0XHRcdC8vIDEwIC0gVG90YWwgbnVtYmVyIG9mIGNlbnRyYWwgZGlyZWN0b3J5IHJlY29yZHNcblx0XHRcdHZhciBlbnRyeUNvdW50ID0gZW9jZHJCdWZmZXIucmVhZFVJbnQxNkxFKDEwKTtcblx0XHRcdC8vIDEyIC0gU2l6ZSBvZiBjZW50cmFsIGRpcmVjdG9yeSAoYnl0ZXMpXG5cdFx0XHQvLyAxNiAtIE9mZnNldCBvZiBzdGFydCBvZiBjZW50cmFsIGRpcmVjdG9yeSwgcmVsYXRpdmUgdG8gc3RhcnQgb2YgYXJjaGl2ZVxuXHRcdFx0dmFyIGNlbnRyYWxEaXJlY3RvcnlPZmZzZXQgPSBlb2NkckJ1ZmZlci5yZWFkVUludDMyTEUoMTYpO1xuXHRcdFx0Ly8gMjAgLSBDb21tZW50IGxlbmd0aFxuXHRcdFx0dmFyIGNvbW1lbnRMZW5ndGggPSBlb2NkckJ1ZmZlci5yZWFkVUludDE2TEUoMjApO1xuXHRcdFx0dmFyIGV4cGVjdGVkQ29tbWVudExlbmd0aCA9IGVvY2RyQnVmZmVyLmxlbmd0aCAtIGVvY2RyV2l0aG91dENvbW1lbnRTaXplO1xuXHRcdFx0aWYgKGNvbW1lbnRMZW5ndGggIT09IGV4cGVjdGVkQ29tbWVudExlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiaW52YWxpZCBjb21tZW50IGxlbmd0aC4gZXhwZWN0ZWQ6IFwiICsgZXhwZWN0ZWRDb21tZW50TGVuZ3RoICsgXCIuIGZvdW5kOiBcIiArIGNvbW1lbnRMZW5ndGgpKTtcblx0XHRcdH1cblx0XHRcdC8vIDIyIC0gQ29tbWVudFxuXHRcdFx0Ly8gdGhlIGVuY29kaW5nIGlzIGFsd2F5cyBjcDQzNy5cblx0XHRcdHZhciBjb21tZW50ID0gZGVjb2RlU3RyaW5ncyA/IGRlY29kZUJ1ZmZlcihlb2NkckJ1ZmZlciwgMjIsIGVvY2RyQnVmZmVyLmxlbmd0aCwgZmFsc2UpXG5cdFx0XHRcdDogZW9jZHJCdWZmZXIuc2xpY2UoMjIpO1xuXG5cdFx0XHRpZiAoIShlbnRyeUNvdW50ID09PSAweGZmZmYgfHwgY2VudHJhbERpcmVjdG9yeU9mZnNldCA9PT0gMHhmZmZmZmZmZikpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIG5ldyBaaXBGaWxlKHJlYWRlciwgY2VudHJhbERpcmVjdG9yeU9mZnNldCwgdG90YWxTaXplLCBlbnRyeUNvdW50LCBjb21tZW50LCBvcHRpb25zLmF1dG9DbG9zZSwgb3B0aW9ucy5sYXp5RW50cmllcywgZGVjb2RlU3RyaW5ncywgb3B0aW9ucy52YWxpZGF0ZUVudHJ5U2l6ZXMsIG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzKSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFpJUDY0IGZvcm1hdFxuXG5cdFx0XHQvLyBaSVA2NCBaaXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvclxuXHRcdFx0dmFyIHppcDY0RW9jZGxCdWZmZXIgPSBuZXdCdWZmZXIoMjApO1xuXHRcdFx0dmFyIHppcDY0RW9jZGxPZmZzZXQgPSBidWZmZXJSZWFkU3RhcnQgKyBpIC0gemlwNjRFb2NkbEJ1ZmZlci5sZW5ndGg7XG5cdFx0XHRyZWFkQW5kQXNzZXJ0Tm9Fb2YocmVhZGVyLCB6aXA2NEVvY2RsQnVmZmVyLCAwLCB6aXA2NEVvY2RsQnVmZmVyLmxlbmd0aCwgemlwNjRFb2NkbE9mZnNldCwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcblxuXHRcdFx0XHQvLyAwIC0gemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyIGxvY2F0b3Igc2lnbmF0dXJlID0gMHgwNzA2NGI1MFxuXHRcdFx0XHRpZiAoemlwNjRFb2NkbEJ1ZmZlci5yZWFkVUludDMyTEUoMCkgIT09IDB4MDcwNjRiNTApIHtcblx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiaW52YWxpZCB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvciBzaWduYXR1cmVcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIDQgLSBudW1iZXIgb2YgdGhlIGRpc2sgd2l0aCB0aGUgc3RhcnQgb2YgdGhlIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeVxuXHRcdFx0XHQvLyA4IC0gcmVsYXRpdmUgb2Zmc2V0IG9mIHRoZSB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkXG5cdFx0XHRcdHZhciB6aXA2NEVvY2RyT2Zmc2V0ID0gcmVhZFVJbnQ2NExFKHppcDY0RW9jZGxCdWZmZXIsIDgpO1xuXHRcdFx0XHQvLyAxNiAtIHRvdGFsIG51bWJlciBvZiBkaXNrc1xuXG5cdFx0XHRcdC8vIFpJUDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmRcblx0XHRcdFx0dmFyIHppcDY0RW9jZHJCdWZmZXIgPSBuZXdCdWZmZXIoNTYpO1xuXHRcdFx0XHRyZWFkQW5kQXNzZXJ0Tm9Fb2YocmVhZGVyLCB6aXA2NEVvY2RyQnVmZmVyLCAwLCB6aXA2NEVvY2RyQnVmZmVyLmxlbmd0aCwgemlwNjRFb2Nkck9mZnNldCwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRcdGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXG5cdFx0XHRcdFx0Ly8gMCAtIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpciBzaWduYXR1cmUgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzICAoMHgwNjA2NGI1MClcblx0XHRcdFx0XHRpZiAoemlwNjRFb2NkckJ1ZmZlci5yZWFkVUludDMyTEUoMCkgIT09IDB4MDYwNjRiNTApIHtcblx0XHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJpbnZhbGlkIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmQgc2lnbmF0dXJlXCIpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gNCAtIHNpemUgb2YgemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5IHJlY29yZCAgICAgICAgICAgICAgICA4IGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMTIgLSB2ZXJzaW9uIG1hZGUgYnkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMTQgLSB2ZXJzaW9uIG5lZWRlZCB0byBleHRyYWN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMTYgLSBudW1iZXIgb2YgdGhpcyBkaXNrICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMjAgLSBudW1iZXIgb2YgdGhlIGRpc2sgd2l0aCB0aGUgc3RhcnQgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICA0IGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMjQgLSB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgY2VudHJhbCBkaXJlY3Rvcnkgb24gdGhpcyBkaXNrICAgICAgICAgOCBieXRlc1xuXHRcdFx0XHRcdC8vIDMyIC0gdG90YWwgbnVtYmVyIG9mIGVudHJpZXMgaW4gdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgOCBieXRlc1xuXHRcdFx0XHRcdGVudHJ5Q291bnQgPSByZWFkVUludDY0TEUoemlwNjRFb2NkckJ1ZmZlciwgMzIpO1xuXHRcdFx0XHRcdC8vIDQwIC0gc2l6ZSBvZiB0aGUgY2VudHJhbCBkaXJlY3RvcnkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHRcdFx0XHRcdC8vIDQ4IC0gb2Zmc2V0IG9mIHN0YXJ0IG9mIGNlbnRyYWwgZGlyZWN0b3J5IHdpdGggcmVzcGVjdCB0byB0aGUgc3RhcnRpbmcgZGlzayBudW1iZXIgICAgIDggYnl0ZXNcblx0XHRcdFx0XHRjZW50cmFsRGlyZWN0b3J5T2Zmc2V0ID0gcmVhZFVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIDQ4KTtcblx0XHRcdFx0XHQvLyA1NiAtIHppcDY0IGV4dGVuc2libGUgZGF0YSBzZWN0b3IgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh2YXJpYWJsZSBzaXplKVxuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCBuZXcgWmlwRmlsZShyZWFkZXIsIGNlbnRyYWxEaXJlY3RvcnlPZmZzZXQsIHRvdGFsU2l6ZSwgZW50cnlDb3VudCwgY29tbWVudCwgb3B0aW9ucy5hdXRvQ2xvc2UsIG9wdGlvbnMubGF6eUVudHJpZXMsIGRlY29kZVN0cmluZ3MsIG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzLCBvcHRpb25zLnN0cmljdEZpbGVOYW1lcykpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkIHNpZ25hdHVyZSBub3QgZm91bmRcIikpO1xuXHR9KTtcbn1cblxudXRpbC5pbmhlcml0cyhaaXBGaWxlLCBFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBaaXBGaWxlKHJlYWRlciwgY2VudHJhbERpcmVjdG9yeU9mZnNldCwgZmlsZVNpemUsIGVudHJ5Q291bnQsIGNvbW1lbnQsIGF1dG9DbG9zZSwgbGF6eUVudHJpZXMsIGRlY29kZVN0cmluZ3MsIHZhbGlkYXRlRW50cnlTaXplcywgc3RyaWN0RmlsZU5hbWVzKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0RXZlbnRFbWl0dGVyLmNhbGwoc2VsZik7XG5cdHNlbGYucmVhZGVyID0gcmVhZGVyO1xuXHQvLyBmb3J3YXJkIGNsb3NlIGV2ZW50c1xuXHRzZWxmLnJlYWRlci5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHQvLyBlcnJvciBjbG9zaW5nIHRoZSBmZFxuXHRcdGVtaXRFcnJvcihzZWxmLCBlcnIpO1xuXHR9KTtcblx0c2VsZi5yZWFkZXIub25jZShcImNsb3NlXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRzZWxmLmVtaXQoXCJjbG9zZVwiKTtcblx0fSk7XG5cdHNlbGYucmVhZEVudHJ5Q3Vyc29yID0gY2VudHJhbERpcmVjdG9yeU9mZnNldDtcblx0c2VsZi5maWxlU2l6ZSA9IGZpbGVTaXplO1xuXHRzZWxmLmVudHJ5Q291bnQgPSBlbnRyeUNvdW50O1xuXHRzZWxmLmNvbW1lbnQgPSBjb21tZW50O1xuXHRzZWxmLmVudHJpZXNSZWFkID0gMDtcblx0c2VsZi5hdXRvQ2xvc2UgPSAhIWF1dG9DbG9zZTtcblx0c2VsZi5sYXp5RW50cmllcyA9ICEhbGF6eUVudHJpZXM7XG5cdHNlbGYuZGVjb2RlU3RyaW5ncyA9ICEhZGVjb2RlU3RyaW5ncztcblx0c2VsZi52YWxpZGF0ZUVudHJ5U2l6ZXMgPSAhIXZhbGlkYXRlRW50cnlTaXplcztcblx0c2VsZi5zdHJpY3RGaWxlTmFtZXMgPSAhIXN0cmljdEZpbGVOYW1lcztcblx0c2VsZi5pc09wZW4gPSB0cnVlO1xuXHRzZWxmLmVtaXR0ZWRFcnJvciA9IGZhbHNlO1xuXG5cdGlmICghc2VsZi5sYXp5RW50cmllcykgc2VsZi5fcmVhZEVudHJ5KCk7XG59XG5cblppcEZpbGUucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuXHRpZiAoIXRoaXMuaXNPcGVuKSByZXR1cm47XG5cdHRoaXMuaXNPcGVuID0gZmFsc2U7XG5cdHRoaXMucmVhZGVyLnVucmVmKCk7XG59O1xuXG5mdW5jdGlvbiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgZXJyKSB7XG5cdGlmIChzZWxmLmF1dG9DbG9zZSkgc2VsZi5jbG9zZSgpO1xuXHRlbWl0RXJyb3Ioc2VsZiwgZXJyKTtcbn1cblxuZnVuY3Rpb24gZW1pdEVycm9yKHNlbGYsIGVycikge1xuXHRpZiAoc2VsZi5lbWl0dGVkRXJyb3IpIHJldHVybjtcblx0c2VsZi5lbWl0dGVkRXJyb3IgPSB0cnVlO1xuXHRzZWxmLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xufVxuXG5aaXBGaWxlLnByb3RvdHlwZS5yZWFkRW50cnkgPSBmdW5jdGlvbiAoKSB7XG5cdGlmICghdGhpcy5sYXp5RW50cmllcykgdGhyb3cgbmV3IEVycm9yKFwicmVhZEVudHJ5KCkgY2FsbGVkIHdpdGhvdXQgbGF6eUVudHJpZXM6dHJ1ZVwiKTtcblx0dGhpcy5fcmVhZEVudHJ5KCk7XG59O1xuWmlwRmlsZS5wcm90b3R5cGUuX3JlYWRFbnRyeSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRpZiAoc2VsZi5lbnRyeUNvdW50ID09PSBzZWxmLmVudHJpZXNSZWFkKSB7XG5cdFx0Ly8gZG9uZSB3aXRoIG1ldGFkYXRhXG5cdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChzZWxmLmF1dG9DbG9zZSkgc2VsZi5jbG9zZSgpO1xuXHRcdFx0aWYgKHNlbGYuZW1pdHRlZEVycm9yKSByZXR1cm47XG5cdFx0XHRzZWxmLmVtaXQoXCJlbmRcIik7XG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChzZWxmLmVtaXR0ZWRFcnJvcikgcmV0dXJuO1xuXHR2YXIgYnVmZmVyID0gbmV3QnVmZmVyKDQ2KTtcblx0cmVhZEFuZEFzc2VydE5vRW9mKHNlbGYucmVhZGVyLCBidWZmZXIsIDAsIGJ1ZmZlci5sZW5ndGgsIHNlbGYucmVhZEVudHJ5Q3Vyc29yLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBlcnIpO1xuXHRcdGlmIChzZWxmLmVtaXR0ZWRFcnJvcikgcmV0dXJuO1xuXHRcdHZhciBlbnRyeSA9IG5ldyBFbnRyeSgpO1xuXHRcdC8vIDAgLSBDZW50cmFsIGRpcmVjdG9yeSBmaWxlIGhlYWRlciBzaWduYXR1cmVcblx0XHR2YXIgc2lnbmF0dXJlID0gYnVmZmVyLnJlYWRVSW50MzJMRSgwKTtcblx0XHRpZiAoc2lnbmF0dXJlICE9PSAweDAyMDE0YjUwKSByZXR1cm4gZW1pdEVycm9yQW5kQXV0b0Nsb3NlKHNlbGYsIG5ldyBFcnJvcihcImludmFsaWQgY2VudHJhbCBkaXJlY3RvcnkgZmlsZSBoZWFkZXIgc2lnbmF0dXJlOiAweFwiICsgc2lnbmF0dXJlLnRvU3RyaW5nKDE2KSkpO1xuXHRcdC8vIDQgLSBWZXJzaW9uIG1hZGUgYnlcblx0XHRlbnRyeS52ZXJzaW9uTWFkZUJ5ID0gYnVmZmVyLnJlYWRVSW50MTZMRSg0KTtcblx0XHQvLyA2IC0gVmVyc2lvbiBuZWVkZWQgdG8gZXh0cmFjdCAobWluaW11bSlcblx0XHRlbnRyeS52ZXJzaW9uTmVlZGVkVG9FeHRyYWN0ID0gYnVmZmVyLnJlYWRVSW50MTZMRSg2KTtcblx0XHQvLyA4IC0gR2VuZXJhbCBwdXJwb3NlIGJpdCBmbGFnXG5cdFx0ZW50cnkuZ2VuZXJhbFB1cnBvc2VCaXRGbGFnID0gYnVmZmVyLnJlYWRVSW50MTZMRSg4KTtcblx0XHQvLyAxMCAtIENvbXByZXNzaW9uIG1ldGhvZFxuXHRcdGVudHJ5LmNvbXByZXNzaW9uTWV0aG9kID0gYnVmZmVyLnJlYWRVSW50MTZMRSgxMCk7XG5cdFx0Ly8gMTIgLSBGaWxlIGxhc3QgbW9kaWZpY2F0aW9uIHRpbWVcblx0XHRlbnRyeS5sYXN0TW9kRmlsZVRpbWUgPSBidWZmZXIucmVhZFVJbnQxNkxFKDEyKTtcblx0XHQvLyAxNCAtIEZpbGUgbGFzdCBtb2RpZmljYXRpb24gZGF0ZVxuXHRcdGVudHJ5Lmxhc3RNb2RGaWxlRGF0ZSA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMTQpO1xuXHRcdC8vIDE2IC0gQ1JDLTMyXG5cdFx0ZW50cnkuY3JjMzIgPSBidWZmZXIucmVhZFVJbnQzMkxFKDE2KTtcblx0XHQvLyAyMCAtIENvbXByZXNzZWQgc2l6ZVxuXHRcdGVudHJ5LmNvbXByZXNzZWRTaXplID0gYnVmZmVyLnJlYWRVSW50MzJMRSgyMCk7XG5cdFx0Ly8gMjQgLSBVbmNvbXByZXNzZWQgc2l6ZVxuXHRcdGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPSBidWZmZXIucmVhZFVJbnQzMkxFKDI0KTtcblx0XHQvLyAyOCAtIEZpbGUgbmFtZSBsZW5ndGggKG4pXG5cdFx0ZW50cnkuZmlsZU5hbWVMZW5ndGggPSBidWZmZXIucmVhZFVJbnQxNkxFKDI4KTtcblx0XHQvLyAzMCAtIEV4dHJhIGZpZWxkIGxlbmd0aCAobSlcblx0XHRlbnRyeS5leHRyYUZpZWxkTGVuZ3RoID0gYnVmZmVyLnJlYWRVSW50MTZMRSgzMCk7XG5cdFx0Ly8gMzIgLSBGaWxlIGNvbW1lbnQgbGVuZ3RoIChrKVxuXHRcdGVudHJ5LmZpbGVDb21tZW50TGVuZ3RoID0gYnVmZmVyLnJlYWRVSW50MTZMRSgzMik7XG5cdFx0Ly8gMzQgLSBEaXNrIG51bWJlciB3aGVyZSBmaWxlIHN0YXJ0c1xuXHRcdC8vIDM2IC0gSW50ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzXG5cdFx0ZW50cnkuaW50ZXJuYWxGaWxlQXR0cmlidXRlcyA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMzYpO1xuXHRcdC8vIDM4IC0gRXh0ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzXG5cdFx0ZW50cnkuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyA9IGJ1ZmZlci5yZWFkVUludDMyTEUoMzgpO1xuXHRcdC8vIDQyIC0gUmVsYXRpdmUgb2Zmc2V0IG9mIGxvY2FsIGZpbGUgaGVhZGVyXG5cdFx0ZW50cnkucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyID0gYnVmZmVyLnJlYWRVSW50MzJMRSg0Mik7XG5cblx0XHRpZiAoZW50cnkuZ2VuZXJhbFB1cnBvc2VCaXRGbGFnICYgMHg0MCkgcmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJzdHJvbmcgZW5jcnlwdGlvbiBpcyBub3Qgc3VwcG9ydGVkXCIpKTtcblxuXHRcdHNlbGYucmVhZEVudHJ5Q3Vyc29yICs9IDQ2O1xuXG5cdFx0YnVmZmVyID0gbmV3QnVmZmVyKGVudHJ5LmZpbGVOYW1lTGVuZ3RoICsgZW50cnkuZXh0cmFGaWVsZExlbmd0aCArIGVudHJ5LmZpbGVDb21tZW50TGVuZ3RoKTtcblx0XHRyZWFkQW5kQXNzZXJ0Tm9Fb2Yoc2VsZi5yZWFkZXIsIGJ1ZmZlciwgMCwgYnVmZmVyLmxlbmd0aCwgc2VsZi5yZWFkRW50cnlDdXJzb3IsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdGlmIChlcnIpIHJldHVybiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgZXJyKTtcblx0XHRcdGlmIChzZWxmLmVtaXR0ZWRFcnJvcikgcmV0dXJuO1xuXHRcdFx0Ly8gNDYgLSBGaWxlIG5hbWVcblx0XHRcdHZhciBpc1V0ZjggPSAoZW50cnkuZ2VuZXJhbFB1cnBvc2VCaXRGbGFnICYgMHg4MDApICE9PSAwO1xuXHRcdFx0ZW50cnkuZmlsZU5hbWUgPSBzZWxmLmRlY29kZVN0cmluZ3MgPyBkZWNvZGVCdWZmZXIoYnVmZmVyLCAwLCBlbnRyeS5maWxlTmFtZUxlbmd0aCwgaXNVdGY4KVxuXHRcdFx0XHQ6IGJ1ZmZlci5zbGljZSgwLCBlbnRyeS5maWxlTmFtZUxlbmd0aCk7XG5cblx0XHRcdC8vIDQ2K24gLSBFeHRyYSBmaWVsZFxuXHRcdFx0dmFyIGZpbGVDb21tZW50U3RhcnQgPSBlbnRyeS5maWxlTmFtZUxlbmd0aCArIGVudHJ5LmV4dHJhRmllbGRMZW5ndGg7XG5cdFx0XHR2YXIgZXh0cmFGaWVsZEJ1ZmZlciA9IGJ1ZmZlci5zbGljZShlbnRyeS5maWxlTmFtZUxlbmd0aCwgZmlsZUNvbW1lbnRTdGFydCk7XG5cdFx0XHRlbnRyeS5leHRyYUZpZWxkcyA9IFtdO1xuXHRcdFx0dmFyIGkgPSAwO1xuXHRcdFx0d2hpbGUgKGkgPCBleHRyYUZpZWxkQnVmZmVyLmxlbmd0aCAtIDMpIHtcblx0XHRcdFx0dmFyIGhlYWRlcklkID0gZXh0cmFGaWVsZEJ1ZmZlci5yZWFkVUludDE2TEUoaSArIDApO1xuXHRcdFx0XHR2YXIgZGF0YVNpemUgPSBleHRyYUZpZWxkQnVmZmVyLnJlYWRVSW50MTZMRShpICsgMik7XG5cdFx0XHRcdHZhciBkYXRhU3RhcnQgPSBpICsgNDtcblx0XHRcdFx0dmFyIGRhdGFFbmQgPSBkYXRhU3RhcnQgKyBkYXRhU2l6ZTtcblx0XHRcdFx0aWYgKGRhdGFFbmQgPiBleHRyYUZpZWxkQnVmZmVyLmxlbmd0aCkgcmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJleHRyYSBmaWVsZCBsZW5ndGggZXhjZWVkcyBleHRyYSBmaWVsZCBidWZmZXIgc2l6ZVwiKSk7XG5cdFx0XHRcdHZhciBkYXRhQnVmZmVyID0gbmV3QnVmZmVyKGRhdGFTaXplKTtcblx0XHRcdFx0ZXh0cmFGaWVsZEJ1ZmZlci5jb3B5KGRhdGFCdWZmZXIsIDAsIGRhdGFTdGFydCwgZGF0YUVuZCk7XG5cdFx0XHRcdGVudHJ5LmV4dHJhRmllbGRzLnB1c2goe1xuXHRcdFx0XHRcdGlkOiBoZWFkZXJJZCxcblx0XHRcdFx0XHRkYXRhOiBkYXRhQnVmZmVyLFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0aSA9IGRhdGFFbmQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIDQ2K24rbSAtIEZpbGUgY29tbWVudFxuXHRcdFx0ZW50cnkuZmlsZUNvbW1lbnQgPSBzZWxmLmRlY29kZVN0cmluZ3MgPyBkZWNvZGVCdWZmZXIoYnVmZmVyLCBmaWxlQ29tbWVudFN0YXJ0LCBmaWxlQ29tbWVudFN0YXJ0ICsgZW50cnkuZmlsZUNvbW1lbnRMZW5ndGgsIGlzVXRmOClcblx0XHRcdFx0OiBidWZmZXIuc2xpY2UoZmlsZUNvbW1lbnRTdGFydCwgZmlsZUNvbW1lbnRTdGFydCArIGVudHJ5LmZpbGVDb21tZW50TGVuZ3RoKTtcblx0XHRcdC8vIGNvbXBhdGliaWxpdHkgaGFjayBmb3IgaHR0cHM6Ly9naXRodWIuY29tL3RoZWpvc2h3b2xmZS95YXV6bC9pc3N1ZXMvNDdcblx0XHRcdGVudHJ5LmNvbW1lbnQgPSBlbnRyeS5maWxlQ29tbWVudDtcblxuXHRcdFx0c2VsZi5yZWFkRW50cnlDdXJzb3IgKz0gYnVmZmVyLmxlbmd0aDtcblx0XHRcdHNlbGYuZW50cmllc1JlYWQgKz0gMTtcblxuXHRcdFx0aWYgKGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPT09IDB4ZmZmZmZmZmYgfHxcblx0XHRcdFx0ZW50cnkuY29tcHJlc3NlZFNpemUgPT09IDB4ZmZmZmZmZmYgfHxcblx0XHRcdFx0ZW50cnkucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyID09PSAweGZmZmZmZmZmKSB7XG5cdFx0XHRcdC8vIFpJUDY0IGZvcm1hdFxuXHRcdFx0XHQvLyBmaW5kIHRoZSBaaXA2NCBFeHRlbmRlZCBJbmZvcm1hdGlvbiBFeHRyYSBGaWVsZFxuXHRcdFx0XHR2YXIgemlwNjRFaWVmQnVmZmVyID0gbnVsbDtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyeS5leHRyYUZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBleHRyYUZpZWxkID0gZW50cnkuZXh0cmFGaWVsZHNbaV07XG5cdFx0XHRcdFx0aWYgKGV4dHJhRmllbGQuaWQgPT09IDB4MDAwMSkge1xuXHRcdFx0XHRcdFx0emlwNjRFaWVmQnVmZmVyID0gZXh0cmFGaWVsZC5kYXRhO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh6aXA2NEVpZWZCdWZmZXIgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHJldHVybiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgbmV3IEVycm9yKFwiZXhwZWN0ZWQgemlwNjQgZXh0ZW5kZWQgaW5mb3JtYXRpb24gZXh0cmEgZmllbGRcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBpbmRleCA9IDA7XG5cdFx0XHRcdC8vIDAgLSBPcmlnaW5hbCBTaXplICAgICAgICAgIDggYnl0ZXNcblx0XHRcdFx0aWYgKGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPT09IDB4ZmZmZmZmZmYpIHtcblx0XHRcdFx0XHRpZiAoaW5kZXggKyA4ID4gemlwNjRFaWVmQnVmZmVyLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJ6aXA2NCBleHRlbmRlZCBpbmZvcm1hdGlvbiBleHRyYSBmaWVsZCBkb2VzIG5vdCBpbmNsdWRlIHVuY29tcHJlc3NlZCBzaXplXCIpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9IHJlYWRVSW50NjRMRSh6aXA2NEVpZWZCdWZmZXIsIGluZGV4KTtcblx0XHRcdFx0XHRpbmRleCArPSA4O1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIDggLSBDb21wcmVzc2VkIFNpemUgICAgICAgIDggYnl0ZXNcblx0XHRcdFx0aWYgKGVudHJ5LmNvbXByZXNzZWRTaXplID09PSAweGZmZmZmZmZmKSB7XG5cdFx0XHRcdFx0aWYgKGluZGV4ICsgOCA+IHppcDY0RWllZkJ1ZmZlci5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgbmV3IEVycm9yKFwiemlwNjQgZXh0ZW5kZWQgaW5mb3JtYXRpb24gZXh0cmEgZmllbGQgZG9lcyBub3QgaW5jbHVkZSBjb21wcmVzc2VkIHNpemVcIikpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbnRyeS5jb21wcmVzc2VkU2l6ZSA9IHJlYWRVSW50NjRMRSh6aXA2NEVpZWZCdWZmZXIsIGluZGV4KTtcblx0XHRcdFx0XHRpbmRleCArPSA4O1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIDE2IC0gUmVsYXRpdmUgSGVhZGVyIE9mZnNldCA4IGJ5dGVzXG5cdFx0XHRcdGlmIChlbnRyeS5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPT09IDB4ZmZmZmZmZmYpIHtcblx0XHRcdFx0XHRpZiAoaW5kZXggKyA4ID4gemlwNjRFaWVmQnVmZmVyLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJ6aXA2NCBleHRlbmRlZCBpbmZvcm1hdGlvbiBleHRyYSBmaWVsZCBkb2VzIG5vdCBpbmNsdWRlIHJlbGF0aXZlIGhlYWRlciBvZmZzZXRcIikpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbnRyeS5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPSByZWFkVUludDY0TEUoemlwNjRFaWVmQnVmZmVyLCBpbmRleCk7XG5cdFx0XHRcdFx0aW5kZXggKz0gODtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyAyNCAtIERpc2sgU3RhcnQgTnVtYmVyICAgICAgNCBieXRlc1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBjaGVjayBmb3IgSW5mby1aSVAgVW5pY29kZSBQYXRoIEV4dHJhIEZpZWxkICgweDcwNzUpXG5cdFx0XHQvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RoZWpvc2h3b2xmZS95YXV6bC9pc3N1ZXMvMzNcblx0XHRcdGlmIChzZWxmLmRlY29kZVN0cmluZ3MpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyeS5leHRyYUZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBleHRyYUZpZWxkID0gZW50cnkuZXh0cmFGaWVsZHNbaV07XG5cdFx0XHRcdFx0aWYgKGV4dHJhRmllbGQuaWQgPT09IDB4NzA3NSkge1xuXHRcdFx0XHRcdFx0aWYgKGV4dHJhRmllbGQuZGF0YS5sZW5ndGggPCA2KSB7XG5cdFx0XHRcdFx0XHRcdC8vIHRvbyBzaG9ydCB0byBiZSBtZWFuaW5nZnVsXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gVmVyc2lvbiAgICAgICAxIGJ5dGUgICAgICB2ZXJzaW9uIG9mIHRoaXMgZXh0cmEgZmllbGQsIGN1cnJlbnRseSAxXG5cdFx0XHRcdFx0XHRpZiAoZXh0cmFGaWVsZC5kYXRhLnJlYWRVSW50OCgwKSAhPT0gMSkge1xuXHRcdFx0XHRcdFx0XHQvLyA+IENoYW5nZXMgbWF5IG5vdCBiZSBiYWNrd2FyZCBjb21wYXRpYmxlIHNvIHRoaXMgZXh0cmFcblx0XHRcdFx0XHRcdFx0Ly8gPiBmaWVsZCBzaG91bGQgbm90IGJlIHVzZWQgaWYgdGhlIHZlcnNpb24gaXMgbm90IHJlY29nbml6ZWQuXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gTmFtZUNSQzMyICAgICA0IGJ5dGVzICAgICBGaWxlIE5hbWUgRmllbGQgQ1JDMzIgQ2hlY2tzdW1cblx0XHRcdFx0XHRcdHZhciBvbGROYW1lQ3JjMzIgPSBleHRyYUZpZWxkLmRhdGEucmVhZFVJbnQzMkxFKDEpO1xuXHRcdFx0XHRcdFx0aWYgKGNyYzMyLnVuc2lnbmVkKGJ1ZmZlci5zbGljZSgwLCBlbnRyeS5maWxlTmFtZUxlbmd0aCkpICE9PSBvbGROYW1lQ3JjMzIpIHtcblx0XHRcdFx0XHRcdFx0Ly8gPiBJZiB0aGUgQ1JDIGNoZWNrIGZhaWxzLCB0aGlzIFVURi04IFBhdGggRXh0cmEgRmllbGQgc2hvdWxkIGJlXG5cdFx0XHRcdFx0XHRcdC8vID4gaWdub3JlZCBhbmQgdGhlIEZpbGUgTmFtZSBmaWVsZCBpbiB0aGUgaGVhZGVyIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gVW5pY29kZU5hbWUgICBWYXJpYWJsZSAgICBVVEYtOCB2ZXJzaW9uIG9mIHRoZSBlbnRyeSBGaWxlIE5hbWVcblx0XHRcdFx0XHRcdGVudHJ5LmZpbGVOYW1lID0gZGVjb2RlQnVmZmVyKGV4dHJhRmllbGQuZGF0YSwgNSwgZXh0cmFGaWVsZC5kYXRhLmxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gdmFsaWRhdGUgZmlsZSBzaXplXG5cdFx0XHRpZiAoc2VsZi52YWxpZGF0ZUVudHJ5U2l6ZXMgJiYgZW50cnkuY29tcHJlc3Npb25NZXRob2QgPT09IDApIHtcblx0XHRcdFx0dmFyIGV4cGVjdGVkQ29tcHJlc3NlZFNpemUgPSBlbnRyeS51bmNvbXByZXNzZWRTaXplO1xuXHRcdFx0XHRpZiAoZW50cnkuaXNFbmNyeXB0ZWQoKSkge1xuXHRcdFx0XHRcdC8vIHRyYWRpdGlvbmFsIGVuY3J5cHRpb24gcHJlZml4ZXMgdGhlIGZpbGUgZGF0YSB3aXRoIGEgaGVhZGVyXG5cdFx0XHRcdFx0ZXhwZWN0ZWRDb21wcmVzc2VkU2l6ZSArPSAxMjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZW50cnkuY29tcHJlc3NlZFNpemUgIT09IGV4cGVjdGVkQ29tcHJlc3NlZFNpemUpIHtcblx0XHRcdFx0XHR2YXIgbXNnID0gXCJjb21wcmVzc2VkL3VuY29tcHJlc3NlZCBzaXplIG1pc21hdGNoIGZvciBzdG9yZWQgZmlsZTogXCIgKyBlbnRyeS5jb21wcmVzc2VkU2l6ZSArIFwiICE9IFwiICsgZW50cnkudW5jb21wcmVzc2VkU2l6ZTtcblx0XHRcdFx0XHRyZXR1cm4gZW1pdEVycm9yQW5kQXV0b0Nsb3NlKHNlbGYsIG5ldyBFcnJvcihtc2cpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2VsZi5kZWNvZGVTdHJpbmdzKSB7XG5cdFx0XHRcdGlmICghc2VsZi5zdHJpY3RGaWxlTmFtZXMpIHtcblx0XHRcdFx0XHQvLyBhbGxvdyBiYWNrc2xhc2hcblx0XHRcdFx0XHRlbnRyeS5maWxlTmFtZSA9IGVudHJ5LmZpbGVOYW1lLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSB2YWxpZGF0ZUZpbGVOYW1lKGVudHJ5LmZpbGVOYW1lLCBzZWxmLnZhbGlkYXRlRmlsZU5hbWVPcHRpb25zKTtcblx0XHRcdFx0aWYgKGVycm9yTWVzc2FnZSAhPSBudWxsKSByZXR1cm4gZW1pdEVycm9yQW5kQXV0b0Nsb3NlKHNlbGYsIG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpKTtcblx0XHRcdH1cblx0XHRcdHNlbGYuZW1pdChcImVudHJ5XCIsIGVudHJ5KTtcblxuXHRcdFx0aWYgKCFzZWxmLmxhenlFbnRyaWVzKSBzZWxmLl9yZWFkRW50cnkoKTtcblx0XHR9KTtcblx0fSk7XG59O1xuXG5aaXBGaWxlLnByb3RvdHlwZS5vcGVuUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChlbnRyeSwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHQvLyBwYXJhbWV0ZXIgdmFsaWRhdGlvblxuXHR2YXIgcmVsYXRpdmVTdGFydCA9IDA7XG5cdHZhciByZWxhdGl2ZUVuZCA9IGVudHJ5LmNvbXByZXNzZWRTaXplO1xuXHRpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuXHRcdGNhbGxiYWNrID0gb3B0aW9ucztcblx0XHRvcHRpb25zID0ge307XG5cdH0gZWxzZSB7XG5cdFx0Ly8gdmFsaWRhdGUgb3B0aW9ucyB0aGF0IHRoZSBjYWxsZXIgaGFzIG5vIGV4Y3VzZSB0byBnZXQgd3Jvbmdcblx0XHRpZiAob3B0aW9ucy5kZWNyeXB0ICE9IG51bGwpIHtcblx0XHRcdGlmICghZW50cnkuaXNFbmNyeXB0ZWQoKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLmRlY3J5cHQgY2FuIG9ubHkgYmUgc3BlY2lmaWVkIGZvciBlbmNyeXB0ZWQgZW50cmllc1wiKTtcblx0XHRcdH1cblx0XHRcdGlmIChvcHRpb25zLmRlY3J5cHQgIT09IGZhbHNlKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIG9wdGlvbnMuZGVjcnlwdCB2YWx1ZTogXCIgKyBvcHRpb25zLmRlY3J5cHQpO1xuXHRcdFx0aWYgKGVudHJ5LmlzQ29tcHJlc3NlZCgpKSB7XG5cdFx0XHRcdGlmIChvcHRpb25zLmRlY29tcHJlc3MgIT09IGZhbHNlKSB0aHJvdyBuZXcgRXJyb3IoXCJlbnRyeSBpcyBlbmNyeXB0ZWQgYW5kIGNvbXByZXNzZWQsIGFuZCBvcHRpb25zLmRlY29tcHJlc3MgIT09IGZhbHNlXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAob3B0aW9ucy5kZWNvbXByZXNzICE9IG51bGwpIHtcblx0XHRcdGlmICghZW50cnkuaXNDb21wcmVzc2VkKCkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucy5kZWNvbXByZXNzIGNhbiBvbmx5IGJlIHNwZWNpZmllZCBmb3IgY29tcHJlc3NlZCBlbnRyaWVzXCIpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCEob3B0aW9ucy5kZWNvbXByZXNzID09PSBmYWxzZSB8fCBvcHRpb25zLmRlY29tcHJlc3MgPT09IHRydWUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcImludmFsaWQgb3B0aW9ucy5kZWNvbXByZXNzIHZhbHVlOiBcIiArIG9wdGlvbnMuZGVjb21wcmVzcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChvcHRpb25zLnN0YXJ0ICE9IG51bGwgfHwgb3B0aW9ucy5lbmQgIT0gbnVsbCkge1xuXHRcdFx0aWYgKGVudHJ5LmlzQ29tcHJlc3NlZCgpICYmIG9wdGlvbnMuZGVjb21wcmVzcyAhPT0gZmFsc2UpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic3RhcnQvZW5kIHJhbmdlIG5vdCBhbGxvd2VkIGZvciBjb21wcmVzc2VkIGVudHJ5IHdpdGhvdXQgb3B0aW9ucy5kZWNvbXByZXNzID09PSBmYWxzZVwiKTtcblx0XHRcdH1cblx0XHRcdGlmIChlbnRyeS5pc0VuY3J5cHRlZCgpICYmIG9wdGlvbnMuZGVjcnlwdCAhPT0gZmFsc2UpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic3RhcnQvZW5kIHJhbmdlIG5vdCBhbGxvd2VkIGZvciBlbmNyeXB0ZWQgZW50cnkgd2l0aG91dCBvcHRpb25zLmRlY3J5cHQgPT09IGZhbHNlXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAob3B0aW9ucy5zdGFydCAhPSBudWxsKSB7XG5cdFx0XHRyZWxhdGl2ZVN0YXJ0ID0gb3B0aW9ucy5zdGFydDtcblx0XHRcdGlmIChyZWxhdGl2ZVN0YXJ0IDwgMCkgdGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucy5zdGFydCA8IDBcIik7XG5cdFx0XHRpZiAocmVsYXRpdmVTdGFydCA+IGVudHJ5LmNvbXByZXNzZWRTaXplKSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLnN0YXJ0ID4gZW50cnkuY29tcHJlc3NlZFNpemVcIik7XG5cdFx0fVxuXHRcdGlmIChvcHRpb25zLmVuZCAhPSBudWxsKSB7XG5cdFx0XHRyZWxhdGl2ZUVuZCA9IG9wdGlvbnMuZW5kO1xuXHRcdFx0aWYgKHJlbGF0aXZlRW5kIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucy5lbmQgPCAwXCIpO1xuXHRcdFx0aWYgKHJlbGF0aXZlRW5kID4gZW50cnkuY29tcHJlc3NlZFNpemUpIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMuZW5kID4gZW50cnkuY29tcHJlc3NlZFNpemVcIik7XG5cdFx0XHRpZiAocmVsYXRpdmVFbmQgPCByZWxhdGl2ZVN0YXJ0KSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLmVuZCA8IG9wdGlvbnMuc3RhcnRcIik7XG5cdFx0fVxuXHR9XG5cdC8vIGFueSBmdXJ0aGVyIGVycm9ycyBjYW4gZWl0aGVyIGJlIGNhdXNlZCBieSB0aGUgemlwZmlsZSxcblx0Ly8gb3Igd2VyZSBpbnRyb2R1Y2VkIGluIGEgbWlub3IgdmVyc2lvbiBvZiB5YXV6bCxcblx0Ly8gc28gc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgY2xpZW50IHJhdGhlciB0aGFuIHRocm93bi5cblx0aWYgKCFzZWxmLmlzT3BlbikgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcImNsb3NlZFwiKSk7XG5cdGlmIChlbnRyeS5pc0VuY3J5cHRlZCgpKSB7XG5cdFx0aWYgKG9wdGlvbnMuZGVjcnlwdCAhPT0gZmFsc2UpIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJlbnRyeSBpcyBlbmNyeXB0ZWQsIGFuZCBvcHRpb25zLmRlY3J5cHQgIT09IGZhbHNlXCIpKTtcblx0fVxuXHQvLyBtYWtlIHN1cmUgd2UgZG9uJ3QgbG9zZSB0aGUgZmQgYmVmb3JlIHdlIG9wZW4gdGhlIGFjdHVhbCByZWFkIHN0cmVhbVxuXHRzZWxmLnJlYWRlci5yZWYoKTtcblx0dmFyIGJ1ZmZlciA9IG5ld0J1ZmZlcigzMCk7XG5cdHJlYWRBbmRBc3NlcnROb0VvZihzZWxmLnJlYWRlciwgYnVmZmVyLCAwLCBidWZmZXIubGVuZ3RoLCBlbnRyeS5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHQvLyAwIC0gTG9jYWwgZmlsZSBoZWFkZXIgc2lnbmF0dXJlID0gMHgwNDAzNGI1MFxuXHRcdFx0dmFyIHNpZ25hdHVyZSA9IGJ1ZmZlci5yZWFkVUludDMyTEUoMCk7XG5cdFx0XHRpZiAoc2lnbmF0dXJlICE9PSAweDA0MDM0YjUwKSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJpbnZhbGlkIGxvY2FsIGZpbGUgaGVhZGVyIHNpZ25hdHVyZTogMHhcIiArIHNpZ25hdHVyZS50b1N0cmluZygxNikpKTtcblx0XHRcdH1cblx0XHRcdC8vIGFsbCB0aGlzIHNob3VsZCBiZSByZWR1bmRhbnRcblx0XHRcdC8vIDQgLSBWZXJzaW9uIG5lZWRlZCB0byBleHRyYWN0IChtaW5pbXVtKVxuXHRcdFx0Ly8gNiAtIEdlbmVyYWwgcHVycG9zZSBiaXQgZmxhZ1xuXHRcdFx0Ly8gOCAtIENvbXByZXNzaW9uIG1ldGhvZFxuXHRcdFx0Ly8gMTAgLSBGaWxlIGxhc3QgbW9kaWZpY2F0aW9uIHRpbWVcblx0XHRcdC8vIDEyIC0gRmlsZSBsYXN0IG1vZGlmaWNhdGlvbiBkYXRlXG5cdFx0XHQvLyAxNCAtIENSQy0zMlxuXHRcdFx0Ly8gMTggLSBDb21wcmVzc2VkIHNpemVcblx0XHRcdC8vIDIyIC0gVW5jb21wcmVzc2VkIHNpemVcblx0XHRcdC8vIDI2IC0gRmlsZSBuYW1lIGxlbmd0aCAobilcblx0XHRcdHZhciBmaWxlTmFtZUxlbmd0aCA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMjYpO1xuXHRcdFx0Ly8gMjggLSBFeHRyYSBmaWVsZCBsZW5ndGggKG0pXG5cdFx0XHR2YXIgZXh0cmFGaWVsZExlbmd0aCA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMjgpO1xuXHRcdFx0Ly8gMzAgLSBGaWxlIG5hbWVcblx0XHRcdC8vIDMwK24gLSBFeHRyYSBmaWVsZFxuXHRcdFx0dmFyIGxvY2FsRmlsZUhlYWRlckVuZCA9IGVudHJ5LnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciArIGJ1ZmZlci5sZW5ndGggKyBmaWxlTmFtZUxlbmd0aCArIGV4dHJhRmllbGRMZW5ndGg7XG5cdFx0XHR2YXIgZGVjb21wcmVzcztcblx0XHRcdGlmIChlbnRyeS5jb21wcmVzc2lvbk1ldGhvZCA9PT0gMCkge1xuXHRcdFx0XHQvLyAwIC0gVGhlIGZpbGUgaXMgc3RvcmVkIChubyBjb21wcmVzc2lvbilcblx0XHRcdFx0ZGVjb21wcmVzcyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIGlmIChlbnRyeS5jb21wcmVzc2lvbk1ldGhvZCA9PT0gOCkge1xuXHRcdFx0XHQvLyA4IC0gVGhlIGZpbGUgaXMgRGVmbGF0ZWRcblx0XHRcdFx0ZGVjb21wcmVzcyA9IG9wdGlvbnMuZGVjb21wcmVzcyAhPSBudWxsID8gb3B0aW9ucy5kZWNvbXByZXNzIDogdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJ1bnN1cHBvcnRlZCBjb21wcmVzc2lvbiBtZXRob2Q6IFwiICsgZW50cnkuY29tcHJlc3Npb25NZXRob2QpKTtcblx0XHRcdH1cblx0XHRcdHZhciBmaWxlRGF0YVN0YXJ0ID0gbG9jYWxGaWxlSGVhZGVyRW5kO1xuXHRcdFx0dmFyIGZpbGVEYXRhRW5kID0gZmlsZURhdGFTdGFydCArIGVudHJ5LmNvbXByZXNzZWRTaXplO1xuXHRcdFx0aWYgKGVudHJ5LmNvbXByZXNzZWRTaXplICE9PSAwKSB7XG5cdFx0XHRcdC8vIGJvdW5kcyBjaGVjayBub3csIGJlY2F1c2UgdGhlIHJlYWQgc3RyZWFtcyB3aWxsIHByb2JhYmx5IG5vdCBjb21wbGFpbiBsb3VkIGVub3VnaC5cblx0XHRcdFx0Ly8gc2luY2Ugd2UncmUgZGVhbGluZyB3aXRoIGFuIHVuc2lnbmVkIG9mZnNldCBwbHVzIGFuIHVuc2lnbmVkIHNpemUsXG5cdFx0XHRcdC8vIHdlIG9ubHkgaGF2ZSAxIHRoaW5nIHRvIGNoZWNrIGZvci5cblx0XHRcdFx0aWYgKGZpbGVEYXRhRW5kID4gc2VsZi5maWxlU2l6ZSkge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJmaWxlIGRhdGEgb3ZlcmZsb3dzIGZpbGUgYm91bmRzOiBcIiArXG5cdFx0XHRcdFx0XHRmaWxlRGF0YVN0YXJ0ICsgXCIgKyBcIiArIGVudHJ5LmNvbXByZXNzZWRTaXplICsgXCIgPiBcIiArIHNlbGYuZmlsZVNpemUpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dmFyIHJlYWRTdHJlYW0gPSBzZWxmLnJlYWRlci5jcmVhdGVSZWFkU3RyZWFtKHtcblx0XHRcdFx0c3RhcnQ6IGZpbGVEYXRhU3RhcnQgKyByZWxhdGl2ZVN0YXJ0LFxuXHRcdFx0XHRlbmQ6IGZpbGVEYXRhU3RhcnQgKyByZWxhdGl2ZUVuZCxcblx0XHRcdH0pO1xuXHRcdFx0dmFyIGVuZHBvaW50U3RyZWFtID0gcmVhZFN0cmVhbTtcblx0XHRcdGlmIChkZWNvbXByZXNzKSB7XG5cdFx0XHRcdHZhciBkZXN0cm95ZWQgPSBmYWxzZTtcblx0XHRcdFx0dmFyIGluZmxhdGVGaWx0ZXIgPSB6bGliLmNyZWF0ZUluZmxhdGVSYXcoKTtcblx0XHRcdFx0cmVhZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdFx0XHQvLyBzZXRJbW1lZGlhdGUgaGVyZSBiZWNhdXNlIGVycm9ycyBjYW4gYmUgZW1pdHRlZCBkdXJpbmcgdGhlIGZpcnN0IGNhbGwgdG8gcGlwZSgpXG5cdFx0XHRcdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdGlmICghZGVzdHJveWVkKSBpbmZsYXRlRmlsdGVyLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmVhZFN0cmVhbS5waXBlKGluZmxhdGVGaWx0ZXIpO1xuXG5cdFx0XHRcdGlmIChzZWxmLnZhbGlkYXRlRW50cnlTaXplcykge1xuXHRcdFx0XHRcdGVuZHBvaW50U3RyZWFtID0gbmV3IEFzc2VydEJ5dGVDb3VudFN0cmVhbShlbnRyeS51bmNvbXByZXNzZWRTaXplKTtcblx0XHRcdFx0XHRpbmZsYXRlRmlsdGVyLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRcdFx0Ly8gZm9yd2FyZCB6bGliIGVycm9ycyB0byB0aGUgY2xpZW50LXZpc2libGUgc3RyZWFtXG5cdFx0XHRcdFx0XHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIWRlc3Ryb3llZCkgZW5kcG9pbnRTdHJlYW0uZW1pdChcImVycm9yXCIsIGVycik7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRpbmZsYXRlRmlsdGVyLnBpcGUoZW5kcG9pbnRTdHJlYW0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIHRoZSB6bGliIGZpbHRlciBpcyB0aGUgY2xpZW50LXZpc2libGUgc3RyZWFtXG5cdFx0XHRcdFx0ZW5kcG9pbnRTdHJlYW0gPSBpbmZsYXRlRmlsdGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHRoaXMgaXMgcGFydCBvZiB5YXV6bCdzIEFQSSwgc28gaW1wbGVtZW50IHRoaXMgZnVuY3Rpb24gb24gdGhlIGNsaWVudC12aXNpYmxlIHN0cmVhbVxuXHRcdFx0XHRlbmRwb2ludFN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGRlc3Ryb3llZCA9IHRydWU7XG5cdFx0XHRcdFx0aWYgKGluZmxhdGVGaWx0ZXIgIT09IGVuZHBvaW50U3RyZWFtKSBpbmZsYXRlRmlsdGVyLnVucGlwZShlbmRwb2ludFN0cmVhbSk7XG5cdFx0XHRcdFx0cmVhZFN0cmVhbS51bnBpcGUoaW5mbGF0ZUZpbHRlcik7XG5cdFx0XHRcdFx0Ly8gVE9ETzogdGhlIGluZmxhdGVGaWx0ZXIgbWF5IGNhdXNlIGEgbWVtb3J5IGxlYWsuIHNlZSBJc3N1ZSAjMjcuXG5cdFx0XHRcdFx0cmVhZFN0cmVhbS5kZXN0cm95KCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjayhudWxsLCBlbmRwb2ludFN0cmVhbSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHNlbGYucmVhZGVyLnVucmVmKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmZ1bmN0aW9uIEVudHJ5KCkge1xufVxuXG5FbnRyeS5wcm90b3R5cGUuZ2V0TGFzdE1vZERhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBkb3NEYXRlVGltZVRvRGF0ZSh0aGlzLmxhc3RNb2RGaWxlRGF0ZSwgdGhpcy5sYXN0TW9kRmlsZVRpbWUpO1xufTtcbkVudHJ5LnByb3RvdHlwZS5pc0VuY3J5cHRlZCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuICh0aGlzLmdlbmVyYWxQdXJwb3NlQml0RmxhZyAmIDB4MSkgIT09IDA7XG59O1xuRW50cnkucHJvdG90eXBlLmlzQ29tcHJlc3NlZCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuY29tcHJlc3Npb25NZXRob2QgPT09IDg7XG59O1xuXG5mdW5jdGlvbiBkb3NEYXRlVGltZVRvRGF0ZShkYXRlLCB0aW1lKSB7XG5cdHZhciBkYXkgPSBkYXRlICYgMHgxZjsgLy8gMS0zMVxuXHR2YXIgbW9udGggPSAoZGF0ZSA+PiA1ICYgMHhmKSAtIDE7IC8vIDEtMTIsIDAtMTFcblx0dmFyIHllYXIgPSAoZGF0ZSA+PiA5ICYgMHg3ZikgKyAxOTgwOyAvLyAwLTEyOCwgMTk4MC0yMTA4XG5cblx0dmFyIG1pbGxpc2Vjb25kID0gMDtcblx0dmFyIHNlY29uZCA9ICh0aW1lICYgMHgxZikgKiAyOyAvLyAwLTI5LCAwLTU4IChldmVuIG51bWJlcnMpXG5cdHZhciBtaW51dGUgPSB0aW1lID4+IDUgJiAweDNmOyAvLyAwLTU5XG5cdHZhciBob3VyID0gdGltZSA+PiAxMSAmIDB4MWY7IC8vIDAtMjNcblxuXHRyZXR1cm4gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVGaWxlTmFtZShmaWxlTmFtZSkge1xuXHRpZiAoZmlsZU5hbWUuaW5kZXhPZihcIlxcXFxcIikgIT09IC0xKSB7XG5cdFx0cmV0dXJuIFwiaW52YWxpZCBjaGFyYWN0ZXJzIGluIGZpbGVOYW1lOiBcIiArIGZpbGVOYW1lO1xuXHR9XG5cdGlmICgvXlthLXpBLVpdOi8udGVzdChmaWxlTmFtZSkgfHwgL15cXC8vLnRlc3QoZmlsZU5hbWUpKSB7XG5cdFx0cmV0dXJuIFwiYWJzb2x1dGUgcGF0aDogXCIgKyBmaWxlTmFtZTtcblx0fVxuXHRpZiAoZmlsZU5hbWUuc3BsaXQoXCIvXCIpLmluZGV4T2YoXCIuLlwiKSAhPT0gLTEpIHtcblx0XHRyZXR1cm4gXCJpbnZhbGlkIHJlbGF0aXZlIHBhdGg6IFwiICsgZmlsZU5hbWU7XG5cdH1cblx0Ly8gYWxsIGdvb2Rcblx0cmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlYWRBbmRBc3NlcnROb0VvZihyZWFkZXIsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaykge1xuXHRpZiAobGVuZ3RoID09PSAwKSB7XG5cdFx0Ly8gZnMucmVhZCB3aWxsIHRocm93IGFuIG91dC1vZi1ib3VuZHMgZXJyb3IgaWYgeW91IHRyeSB0byByZWFkIDAgYnl0ZXMgZnJvbSBhIDAgYnl0ZSBmaWxlXG5cdFx0cmV0dXJuIHNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRjYWxsYmFjayhudWxsLCBuZXdCdWZmZXIoMCkpO1xuXHRcdH0pO1xuXHR9XG5cdHJlYWRlci5yZWFkKGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBmdW5jdGlvbiAoZXJyLCBieXRlc1JlYWQpIHtcblx0XHRpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRpZiAoYnl0ZXNSZWFkIDwgbGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwidW5leHBlY3RlZCBFT0ZcIikpO1xuXHRcdH1cblx0XHRjYWxsYmFjaygpO1xuXHR9KTtcbn1cblxudXRpbC5pbmhlcml0cyhBc3NlcnRCeXRlQ291bnRTdHJlYW0sIFRyYW5zZm9ybSk7XG5cbmZ1bmN0aW9uIEFzc2VydEJ5dGVDb3VudFN0cmVhbShieXRlQ291bnQpIHtcblx0VHJhbnNmb3JtLmNhbGwodGhpcyk7XG5cdHRoaXMuYWN0dWFsQnl0ZUNvdW50ID0gMDtcblx0dGhpcy5leHBlY3RlZEJ5dGVDb3VudCA9IGJ5dGVDb3VudDtcbn1cblxuQXNzZXJ0Qnl0ZUNvdW50U3RyZWFtLnByb3RvdHlwZS5fdHJhbnNmb3JtID0gZnVuY3Rpb24gKGNodW5rLCBlbmNvZGluZywgY2IpIHtcblx0dGhpcy5hY3R1YWxCeXRlQ291bnQgKz0gY2h1bmsubGVuZ3RoO1xuXHRpZiAodGhpcy5hY3R1YWxCeXRlQ291bnQgPiB0aGlzLmV4cGVjdGVkQnl0ZUNvdW50KSB7XG5cdFx0dmFyIG1zZyA9IFwidG9vIG1hbnkgYnl0ZXMgaW4gdGhlIHN0cmVhbS4gZXhwZWN0ZWQgXCIgKyB0aGlzLmV4cGVjdGVkQnl0ZUNvdW50ICsgXCIuIGdvdCBhdCBsZWFzdCBcIiArIHRoaXMuYWN0dWFsQnl0ZUNvdW50O1xuXHRcdHJldHVybiBjYihuZXcgRXJyb3IobXNnKSk7XG5cdH1cblx0Y2IobnVsbCwgY2h1bmspO1xufTtcbkFzc2VydEJ5dGVDb3VudFN0cmVhbS5wcm90b3R5cGUuX2ZsdXNoID0gZnVuY3Rpb24gKGNiKSB7XG5cdGlmICh0aGlzLmFjdHVhbEJ5dGVDb3VudCA8IHRoaXMuZXhwZWN0ZWRCeXRlQ291bnQpIHtcblx0XHR2YXIgbXNnID0gXCJub3QgZW5vdWdoIGJ5dGVzIGluIHRoZSBzdHJlYW0uIGV4cGVjdGVkIFwiICsgdGhpcy5leHBlY3RlZEJ5dGVDb3VudCArIFwiLiBnb3Qgb25seSBcIiArIHRoaXMuYWN0dWFsQnl0ZUNvdW50O1xuXHRcdHJldHVybiBjYihuZXcgRXJyb3IobXNnKSk7XG5cdH1cblx0Y2IoKTtcbn07XG5cbnV0aWwuaW5oZXJpdHMoUmFuZG9tQWNjZXNzUmVhZGVyLCBFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBSYW5kb21BY2Nlc3NSZWFkZXIoKSB7XG5cdEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXHR0aGlzLnJlZkNvdW50ID0gMDtcbn1cblxuUmFuZG9tQWNjZXNzUmVhZGVyLnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbiAoKSB7XG5cdHRoaXMucmVmQ291bnQgKz0gMTtcbn07XG5SYW5kb21BY2Nlc3NSZWFkZXIucHJvdG90eXBlLnVucmVmID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHNlbGYucmVmQ291bnQgLT0gMTtcblxuXHRpZiAoc2VsZi5yZWZDb3VudCA+IDApIHJldHVybjtcblx0aWYgKHNlbGYucmVmQ291bnQgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHVucmVmXCIpO1xuXG5cdHNlbGYuY2xvc2Uob25DbG9zZURvbmUpO1xuXG5cdGZ1bmN0aW9uIG9uQ2xvc2VEb25lKGVycikge1xuXHRcdGlmIChlcnIpIHJldHVybiBzZWxmLmVtaXQoJ2Vycm9yJywgZXJyKTtcblx0XHRzZWxmLmVtaXQoJ2Nsb3NlJyk7XG5cdH1cbn07XG5SYW5kb21BY2Nlc3NSZWFkZXIucHJvdG90eXBlLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHR2YXIgc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHR2YXIgZW5kID0gb3B0aW9ucy5lbmQ7XG5cdGlmIChzdGFydCA9PT0gZW5kKSB7XG5cdFx0dmFyIGVtcHR5U3RyZWFtID0gbmV3IFBhc3NUaHJvdWdoKCk7XG5cdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdGVtcHR5U3RyZWFtLmVuZCgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBlbXB0eVN0cmVhbTtcblx0fVxuXHR2YXIgc3RyZWFtID0gdGhpcy5fcmVhZFN0cmVhbUZvclJhbmdlKHN0YXJ0LCBlbmQpO1xuXG5cdHZhciBkZXN0cm95ZWQgPSBmYWxzZTtcblx0dmFyIHJlZlVucmVmRmlsdGVyID0gbmV3IFJlZlVucmVmRmlsdGVyKHRoaXMpO1xuXHRzdHJlYW0ub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghZGVzdHJveWVkKSByZWZVbnJlZkZpbHRlci5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblx0XHR9KTtcblx0fSk7XG5cdHJlZlVucmVmRmlsdGVyLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cdFx0c3RyZWFtLnVucGlwZShyZWZVbnJlZkZpbHRlcik7XG5cdFx0cmVmVW5yZWZGaWx0ZXIudW5yZWYoKTtcblx0XHRzdHJlYW0uZGVzdHJveSgpO1xuXHR9O1xuXG5cdHZhciBieXRlQ291bnRlciA9IG5ldyBBc3NlcnRCeXRlQ291bnRTdHJlYW0oZW5kIC0gc3RhcnQpO1xuXHRyZWZVbnJlZkZpbHRlci5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFkZXN0cm95ZWQpIGJ5dGVDb3VudGVyLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXHRcdH0pO1xuXHR9KTtcblx0Ynl0ZUNvdW50ZXIuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcblx0XHRkZXN0cm95ZWQgPSB0cnVlO1xuXHRcdHJlZlVucmVmRmlsdGVyLnVucGlwZShieXRlQ291bnRlcik7XG5cdFx0cmVmVW5yZWZGaWx0ZXIuZGVzdHJveSgpO1xuXHR9O1xuXG5cdHJldHVybiBzdHJlYW0ucGlwZShyZWZVbnJlZkZpbHRlcikucGlwZShieXRlQ291bnRlcik7XG59O1xuUmFuZG9tQWNjZXNzUmVhZGVyLnByb3RvdHlwZS5fcmVhZFN0cmVhbUZvclJhbmdlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcblx0dGhyb3cgbmV3IEVycm9yKFwibm90IGltcGxlbWVudGVkXCIpO1xufTtcblJhbmRvbUFjY2Vzc1JlYWRlci5wcm90b3R5cGUucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spIHtcblx0dmFyIHJlYWRTdHJlYW0gPSB0aGlzLmNyZWF0ZVJlYWRTdHJlYW0oe3N0YXJ0OiBwb3NpdGlvbiwgZW5kOiBwb3NpdGlvbiArIGxlbmd0aH0pO1xuXHR2YXIgd3JpdGVTdHJlYW0gPSBuZXcgV3JpdGFibGUoKTtcblx0dmFyIHdyaXR0ZW4gPSAwO1xuXHR3cml0ZVN0cmVhbS5fd3JpdGUgPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nLCBjYikge1xuXHRcdGNodW5rLmNvcHkoYnVmZmVyLCBvZmZzZXQgKyB3cml0dGVuLCAwLCBjaHVuay5sZW5ndGgpO1xuXHRcdHdyaXR0ZW4gKz0gY2h1bmsubGVuZ3RoO1xuXHRcdGNiKCk7XG5cdH07XG5cdHdyaXRlU3RyZWFtLm9uKFwiZmluaXNoXCIsIGNhbGxiYWNrKTtcblx0cmVhZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnJvcikge1xuXHRcdGNhbGxiYWNrKGVycm9yKTtcblx0fSk7XG5cdHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XG59O1xuUmFuZG9tQWNjZXNzUmVhZGVyLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXHRzZXRJbW1lZGlhdGUoY2FsbGJhY2spO1xufTtcblxudXRpbC5pbmhlcml0cyhSZWZVbnJlZkZpbHRlciwgUGFzc1Rocm91Z2gpO1xuXG5mdW5jdGlvbiBSZWZVbnJlZkZpbHRlcihjb250ZXh0KSB7XG5cdFBhc3NUaHJvdWdoLmNhbGwodGhpcyk7XG5cdHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cdHRoaXMuY29udGV4dC5yZWYoKTtcblx0dGhpcy51bnJlZmZlZFlldCA9IGZhbHNlO1xufVxuXG5SZWZVbnJlZkZpbHRlci5wcm90b3R5cGUuX2ZsdXNoID0gZnVuY3Rpb24gKGNiKSB7XG5cdHRoaXMudW5yZWYoKTtcblx0Y2IoKTtcbn07XG5SZWZVbnJlZkZpbHRlci5wcm90b3R5cGUudW5yZWYgPSBmdW5jdGlvbiAoY2IpIHtcblx0aWYgKHRoaXMudW5yZWZmZWRZZXQpIHJldHVybjtcblx0dGhpcy51bnJlZmZlZFlldCA9IHRydWU7XG5cdHRoaXMuY29udGV4dC51bnJlZigpO1xufTtcblxudmFyIGNwNDM3ID0gJ1xcdTAwMDDimLrimLvimaXimabimaPimaDigKLil5jil4vil5nimYLimYDimarimavimLzilrril4TihpXigLzCtsKn4pas4oao4oaR4oaT4oaS4oaQ4oif4oaU4pay4pa8ICFcIiMkJSZcXCcoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXFxcXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7ijILDh8O8w6nDosOkw6DDpcOnw6rDq8Oow6/DrsOsw4TDhcOJw6bDhsO0w7bDssO7w7nDv8OWw5zCosKjwqXigqfGksOhw63Ds8O6w7HDkcKqwrrCv+KMkMKswr3CvMKhwqvCu+KWkeKWkuKWk+KUguKUpOKVoeKVouKVluKVleKVo+KVkeKVl+KVneKVnOKVm+KUkOKUlOKUtOKUrOKUnOKUgOKUvOKVnuKVn+KVmuKVlOKVqeKVpuKVoOKVkOKVrOKVp+KVqOKVpOKVpeKVmeKVmOKVkuKVk+KVq+KVquKUmOKUjOKWiOKWhOKWjOKWkOKWgM6xw5/Ok8+AzqPPg8K1z4TOps6YzqnOtOKIns+GzrXiiKniiaHCseKJpeKJpOKMoOKMocO34omIwrDiiJnCt+KImuKBv8Ky4pagwqAnO1xuXG5mdW5jdGlvbiBkZWNvZGVCdWZmZXIoYnVmZmVyLCBzdGFydCwgZW5kLCBpc1V0ZjgpIHtcblx0aWYgKGlzVXRmOCkge1xuXHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoXCJ1dGY4XCIsIHN0YXJ0LCBlbmQpO1xuXHR9IGVsc2Uge1xuXHRcdHZhciByZXN1bHQgPSBcIlwiO1xuXHRcdGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG5cdFx0XHRyZXN1bHQgKz0gY3A0MzdbYnVmZmVyW2ldXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufVxuXG5mdW5jdGlvbiByZWFkVUludDY0TEUoYnVmZmVyLCBvZmZzZXQpIHtcblx0Ly8gdGhlcmUgaXMgbm8gbmF0aXZlIGZ1bmN0aW9uIGZvciB0aGlzLCBiZWNhdXNlIHdlIGNhbid0IGFjdHVhbGx5IHN0b3JlIDY0LWJpdCBpbnRlZ2VycyBwcmVjaXNlbHkuXG5cdC8vIGFmdGVyIDUzIGJpdHMsIEphdmFTY3JpcHQncyBOdW1iZXIgdHlwZSAoSUVFRSA3NTQgZG91YmxlKSBjYW4ndCBzdG9yZSBpbmRpdmlkdWFsIGludGVnZXJzIGFueW1vcmUuXG5cdC8vIGJ1dCBzaW5jZSA1MyBiaXRzIGlzIGEgd2hvbGUgbG90IG1vcmUgdGhhbiAzMiBiaXRzLCB3ZSBkbyBvdXIgYmVzdCBhbnl3YXkuXG5cdHZhciBsb3dlcjMyID0gYnVmZmVyLnJlYWRVSW50MzJMRShvZmZzZXQpO1xuXHR2YXIgdXBwZXIzMiA9IGJ1ZmZlci5yZWFkVUludDMyTEUob2Zmc2V0ICsgNCk7XG5cdC8vIHdlIGNhbid0IHVzZSBiaXRzaGlmdGluZyBoZXJlLCBiZWNhdXNlIEphdmFTY3JpcHQgYml0c2hpZnRpbmcgb25seSB3b3JrcyBvbiAzMi1iaXQgaW50ZWdlcnMuXG5cdHJldHVybiB1cHBlcjMyICogMHgxMDAwMDAwMDAgKyBsb3dlcjMyO1xuXHQvLyBhcyBsb25nIGFzIHdlJ3JlIGJvdW5kcyBjaGVja2luZyB0aGUgcmVzdWx0IG9mIHRoaXMgZnVuY3Rpb24gYWdhaW5zdCB0aGUgdG90YWwgZmlsZSBzaXplLFxuXHQvLyB3ZSdsbCBjYXRjaCBhbnkgb3ZlcmZsb3cgZXJyb3JzLCBiZWNhdXNlIHdlIGFscmVhZHkgbWFkZSBzdXJlIHRoZSB0b3RhbCBmaWxlIHNpemUgd2FzIHdpdGhpbiByZWFzb24uXG59XG5cbi8vIE5vZGUgMTAgZGVwcmVjYXRlZCBuZXcgQnVmZmVyKCkuXG52YXIgbmV3QnVmZmVyO1xuaWYgKHR5cGVvZiBCdWZmZXIuYWxsb2NVbnNhZmUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRuZXdCdWZmZXIgPSBmdW5jdGlvbiAobGVuKSB7XG5cdFx0cmV0dXJuIEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW4pO1xuXHR9O1xufSBlbHNlIHtcblx0bmV3QnVmZmVyID0gZnVuY3Rpb24gKGxlbikge1xuXHRcdHJldHVybiBuZXcgQnVmZmVyKGxlbik7XG5cdH07XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDYWxsYmFjayhlcnIpIHtcblx0aWYgKGVycikgdGhyb3cgZXJyO1xufVxuIiwidmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoXCJzdHJlYW1cIikuVHJhbnNmb3JtO1xudmFyIFBhc3NUaHJvdWdoID0gcmVxdWlyZShcInN0cmVhbVwiKS5QYXNzVGhyb3VnaDtcbnZhciB6bGliID0gcmVxdWlyZShcInpsaWJcIik7XG52YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJldmVudHNcIikuRXZlbnRFbWl0dGVyO1xudmFyIGNyYzMyID0gcmVxdWlyZShcImJ1ZmZlci1jcmMzMlwiKTtcblxuZXhwb3J0cy5aaXBGaWxlID0gWmlwRmlsZTtcbmV4cG9ydHMuZGF0ZVRvRG9zRGF0ZVRpbWUgPSBkYXRlVG9Eb3NEYXRlVGltZTtcblxudXRpbC5pbmhlcml0cyhaaXBGaWxlLCBFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBaaXBGaWxlKCkge1xuXHR0aGlzLm91dHB1dFN0cmVhbSA9IG5ldyBQYXNzVGhyb3VnaCgpO1xuXHR0aGlzLmVudHJpZXMgPSBbXTtcblx0dGhpcy5vdXRwdXRTdHJlYW1DdXJzb3IgPSAwO1xuXHR0aGlzLmVuZGVkID0gZmFsc2U7IC8vIC5lbmQoKSBzZXRzIHRoaXNcblx0dGhpcy5hbGxEb25lID0gZmFsc2U7IC8vIHNldCB3aGVuIHdlJ3ZlIHdyaXR0ZW4gdGhlIGxhc3QgYnl0ZXNcblx0dGhpcy5mb3JjZVppcDY0RW9jZCA9IGZhbHNlOyAvLyBjb25maWd1cmFibGUgaW4gLmVuZCgpXG59XG5cblppcEZpbGUucHJvdG90eXBlLmFkZEZpbGUgPSBmdW5jdGlvbiAocmVhbFBhdGgsIG1ldGFkYXRhUGF0aCwgb3B0aW9ucykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdG1ldGFkYXRhUGF0aCA9IHZhbGlkYXRlTWV0YWRhdGFQYXRoKG1ldGFkYXRhUGF0aCwgZmFsc2UpO1xuXHRpZiAob3B0aW9ucyA9PSBudWxsKSBvcHRpb25zID0ge307XG5cblx0dmFyIGVudHJ5ID0gbmV3IEVudHJ5KG1ldGFkYXRhUGF0aCwgZmFsc2UsIG9wdGlvbnMpO1xuXHRzZWxmLmVudHJpZXMucHVzaChlbnRyeSk7XG5cdGZzLnN0YXQocmVhbFBhdGgsIGZ1bmN0aW9uIChlcnIsIHN0YXRzKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIHNlbGYuZW1pdChcImVycm9yXCIsIGVycik7XG5cdFx0aWYgKCFzdGF0cy5pc0ZpbGUoKSkgcmV0dXJuIHNlbGYuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihcIm5vdCBhIGZpbGU6IFwiICsgcmVhbFBhdGgpKTtcblx0XHRlbnRyeS51bmNvbXByZXNzZWRTaXplID0gc3RhdHMuc2l6ZTtcblx0XHRpZiAob3B0aW9ucy5tdGltZSA9PSBudWxsKSBlbnRyeS5zZXRMYXN0TW9kRGF0ZShzdGF0cy5tdGltZSk7XG5cdFx0aWYgKG9wdGlvbnMubW9kZSA9PSBudWxsKSBlbnRyeS5zZXRGaWxlQXR0cmlidXRlc01vZGUoc3RhdHMubW9kZSk7XG5cdFx0ZW50cnkuc2V0RmlsZURhdGFQdW1wRnVuY3Rpb24oZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHJlYWRTdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHJlYWxQYXRoKTtcblx0XHRcdGVudHJ5LnN0YXRlID0gRW50cnkuRklMRV9EQVRBX0lOX1BST0dSRVNTO1xuXHRcdFx0cmVhZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdFx0c2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblx0XHRcdH0pO1xuXHRcdFx0cHVtcEZpbGVEYXRhUmVhZFN0cmVhbShzZWxmLCBlbnRyeSwgcmVhZFN0cmVhbSk7XG5cdFx0fSk7XG5cdFx0cHVtcEVudHJpZXMoc2VsZik7XG5cdH0pO1xufTtcblxuWmlwRmlsZS5wcm90b3R5cGUuYWRkUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChyZWFkU3RyZWFtLCBtZXRhZGF0YVBhdGgsIG9wdGlvbnMpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRtZXRhZGF0YVBhdGggPSB2YWxpZGF0ZU1ldGFkYXRhUGF0aChtZXRhZGF0YVBhdGgsIGZhbHNlKTtcblx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgb3B0aW9ucyA9IHt9O1xuXHR2YXIgZW50cnkgPSBuZXcgRW50cnkobWV0YWRhdGFQYXRoLCBmYWxzZSwgb3B0aW9ucyk7XG5cdHNlbGYuZW50cmllcy5wdXNoKGVudHJ5KTtcblx0ZW50cnkuc2V0RmlsZURhdGFQdW1wRnVuY3Rpb24oZnVuY3Rpb24gKCkge1xuXHRcdGVudHJ5LnN0YXRlID0gRW50cnkuRklMRV9EQVRBX0lOX1BST0dSRVNTO1xuXHRcdHB1bXBGaWxlRGF0YVJlYWRTdHJlYW0oc2VsZiwgZW50cnksIHJlYWRTdHJlYW0pO1xuXHR9KTtcblx0cHVtcEVudHJpZXMoc2VsZik7XG59O1xuXG5aaXBGaWxlLnByb3RvdHlwZS5hZGRCdWZmZXIgPSBmdW5jdGlvbiAoYnVmZmVyLCBtZXRhZGF0YVBhdGgsIG9wdGlvbnMpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRtZXRhZGF0YVBhdGggPSB2YWxpZGF0ZU1ldGFkYXRhUGF0aChtZXRhZGF0YVBhdGgsIGZhbHNlKTtcblx0aWYgKGJ1ZmZlci5sZW5ndGggPiAweDNmZmZmZmZmKSB0aHJvdyBuZXcgRXJyb3IoXCJidWZmZXIgdG9vIGxhcmdlOiBcIiArIGJ1ZmZlci5sZW5ndGggKyBcIiA+IFwiICsgMHgzZmZmZmZmZik7XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuc2l6ZSAhPSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLnNpemUgbm90IGFsbG93ZWRcIik7XG5cdHZhciBlbnRyeSA9IG5ldyBFbnRyeShtZXRhZGF0YVBhdGgsIGZhbHNlLCBvcHRpb25zKTtcblx0ZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9IGJ1ZmZlci5sZW5ndGg7XG5cdGVudHJ5LmNyYzMyID0gY3JjMzIudW5zaWduZWQoYnVmZmVyKTtcblx0ZW50cnkuY3JjQW5kRmlsZVNpemVLbm93biA9IHRydWU7XG5cdHNlbGYuZW50cmllcy5wdXNoKGVudHJ5KTtcblx0aWYgKCFlbnRyeS5jb21wcmVzcykge1xuXHRcdHNldENvbXByZXNzZWRCdWZmZXIoYnVmZmVyKTtcblx0fSBlbHNlIHtcblx0XHR6bGliLmRlZmxhdGVSYXcoYnVmZmVyLCBmdW5jdGlvbiAoZXJyLCBjb21wcmVzc2VkQnVmZmVyKSB7XG5cdFx0XHRzZXRDb21wcmVzc2VkQnVmZmVyKGNvbXByZXNzZWRCdWZmZXIpO1xuXHRcdFx0XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDb21wcmVzc2VkQnVmZmVyKGNvbXByZXNzZWRCdWZmZXIpIHtcblx0XHRlbnRyeS5jb21wcmVzc2VkU2l6ZSA9IGNvbXByZXNzZWRCdWZmZXIubGVuZ3RoO1xuXHRcdGVudHJ5LnNldEZpbGVEYXRhUHVtcEZ1bmN0aW9uKGZ1bmN0aW9uICgpIHtcblx0XHRcdHdyaXRlVG9PdXRwdXRTdHJlYW0oc2VsZiwgY29tcHJlc3NlZEJ1ZmZlcik7XG5cdFx0XHR3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGVudHJ5LmdldERhdGFEZXNjcmlwdG9yKCkpO1xuXHRcdFx0ZW50cnkuc3RhdGUgPSBFbnRyeS5GSUxFX0RBVEFfRE9ORTtcblxuXHRcdFx0Ly8gZG9uJ3QgY2FsbCBwdW1wRW50cmllcygpIHJlY3Vyc2l2ZWx5LlxuXHRcdFx0Ly8gKGFsc28sIGRvbid0IGNhbGwgcHJvY2Vzcy5uZXh0VGljayByZWN1cnNpdmVseS4pXG5cdFx0XHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRwdW1wRW50cmllcyhzZWxmKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHB1bXBFbnRyaWVzKHNlbGYpO1xuXHR9XG59O1xuXG5cblppcEZpbGUucHJvdG90eXBlLmFkZEVtcHR5RGlyZWN0b3J5ID0gZnVuY3Rpb24gKG1ldGFkYXRhUGF0aCwgb3B0aW9ucykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdG1ldGFkYXRhUGF0aCA9IHZhbGlkYXRlTWV0YWRhdGFQYXRoKG1ldGFkYXRhUGF0aCwgdHJ1ZSk7XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuc2l6ZSAhPSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLnNpemUgbm90IGFsbG93ZWRcIik7XG5cdGlmIChvcHRpb25zLmNvbXByZXNzICE9IG51bGwpIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMuY29tcHJlc3Mgbm90IGFsbG93ZWRcIik7XG5cdHZhciBlbnRyeSA9IG5ldyBFbnRyeShtZXRhZGF0YVBhdGgsIHRydWUsIG9wdGlvbnMpO1xuXHRzZWxmLmVudHJpZXMucHVzaChlbnRyeSk7XG5cdGVudHJ5LnNldEZpbGVEYXRhUHVtcEZ1bmN0aW9uKGZ1bmN0aW9uICgpIHtcblx0XHR3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGVudHJ5LmdldERhdGFEZXNjcmlwdG9yKCkpO1xuXHRcdGVudHJ5LnN0YXRlID0gRW50cnkuRklMRV9EQVRBX0RPTkU7XG5cdFx0cHVtcEVudHJpZXMoc2VsZik7XG5cdH0pO1xuXHRwdW1wRW50cmllcyhzZWxmKTtcbn07XG5cblppcEZpbGUucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIChvcHRpb25zLCBmaW5hbFNpemVDYWxsYmFjaykge1xuXHRpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdGZpbmFsU2l6ZUNhbGxiYWNrID0gb3B0aW9ucztcblx0XHRvcHRpb25zID0gbnVsbDtcblx0fVxuXHRpZiAob3B0aW9ucyA9PSBudWxsKSBvcHRpb25zID0ge307XG5cdGlmICh0aGlzLmVuZGVkKSByZXR1cm47XG5cdHRoaXMuZW5kZWQgPSB0cnVlO1xuXHR0aGlzLmZpbmFsU2l6ZUNhbGxiYWNrID0gZmluYWxTaXplQ2FsbGJhY2s7XG5cdHRoaXMuZm9yY2VaaXA2NEVvY2QgPSAhIW9wdGlvbnMuZm9yY2VaaXA2NEZvcm1hdDtcblx0cHVtcEVudHJpZXModGhpcyk7XG59O1xuXG5mdW5jdGlvbiB3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGJ1ZmZlcikge1xuXHRzZWxmLm91dHB1dFN0cmVhbS53cml0ZShidWZmZXIpO1xuXHRzZWxmLm91dHB1dFN0cmVhbUN1cnNvciArPSBidWZmZXIubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBwdW1wRmlsZURhdGFSZWFkU3RyZWFtKHNlbGYsIGVudHJ5LCByZWFkU3RyZWFtKSB7XG5cdHZhciBjcmMzMldhdGNoZXIgPSBuZXcgQ3JjMzJXYXRjaGVyKCk7XG5cdHZhciB1bmNvbXByZXNzZWRTaXplQ291bnRlciA9IG5ldyBCeXRlQ291bnRlcigpO1xuXHR2YXIgY29tcHJlc3NvciA9IGVudHJ5LmNvbXByZXNzID8gbmV3IHpsaWIuRGVmbGF0ZVJhdygpIDogbmV3IFBhc3NUaHJvdWdoKCk7XG5cdHZhciBjb21wcmVzc2VkU2l6ZUNvdW50ZXIgPSBuZXcgQnl0ZUNvdW50ZXIoKTtcblx0cmVhZFN0cmVhbS5waXBlKGNyYzMyV2F0Y2hlcilcblx0XHQucGlwZSh1bmNvbXByZXNzZWRTaXplQ291bnRlcilcblx0XHQucGlwZShjb21wcmVzc29yKVxuXHRcdC5waXBlKGNvbXByZXNzZWRTaXplQ291bnRlcilcblx0XHQucGlwZShzZWxmLm91dHB1dFN0cmVhbSwge2VuZDogZmFsc2V9KTtcblx0Y29tcHJlc3NlZFNpemVDb3VudGVyLm9uKFwiZW5kXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRlbnRyeS5jcmMzMiA9IGNyYzMyV2F0Y2hlci5jcmMzMjtcblx0XHRpZiAoZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9PSBudWxsKSB7XG5cdFx0XHRlbnRyeS51bmNvbXByZXNzZWRTaXplID0gdW5jb21wcmVzc2VkU2l6ZUNvdW50ZXIuYnl0ZUNvdW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoZW50cnkudW5jb21wcmVzc2VkU2l6ZSAhPT0gdW5jb21wcmVzc2VkU2l6ZUNvdW50ZXIuYnl0ZUNvdW50KSByZXR1cm4gc2VsZi5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiZmlsZSBkYXRhIHN0cmVhbSBoYXMgdW5leHBlY3RlZCBudW1iZXIgb2YgYnl0ZXNcIikpO1xuXHRcdH1cblx0XHRlbnRyeS5jb21wcmVzc2VkU2l6ZSA9IGNvbXByZXNzZWRTaXplQ291bnRlci5ieXRlQ291bnQ7XG5cdFx0c2VsZi5vdXRwdXRTdHJlYW1DdXJzb3IgKz0gZW50cnkuY29tcHJlc3NlZFNpemU7XG5cdFx0d3JpdGVUb091dHB1dFN0cmVhbShzZWxmLCBlbnRyeS5nZXREYXRhRGVzY3JpcHRvcigpKTtcblx0XHRlbnRyeS5zdGF0ZSA9IEVudHJ5LkZJTEVfREFUQV9ET05FO1xuXHRcdHB1bXBFbnRyaWVzKHNlbGYpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcHVtcEVudHJpZXMoc2VsZikge1xuXHRpZiAoc2VsZi5hbGxEb25lKSByZXR1cm47XG5cdC8vIGZpcnN0IGNoZWNrIGlmIGZpbmFsU2l6ZSBpcyBmaW5hbGx5IGtub3duXG5cdGlmIChzZWxmLmVuZGVkICYmIHNlbGYuZmluYWxTaXplQ2FsbGJhY2sgIT0gbnVsbCkge1xuXHRcdHZhciBmaW5hbFNpemUgPSBjYWxjdWxhdGVGaW5hbFNpemUoc2VsZik7XG5cdFx0aWYgKGZpbmFsU2l6ZSAhPSBudWxsKSB7XG5cdFx0XHQvLyB3ZSBoYXZlIGFuIGFuc3dlclxuXHRcdFx0c2VsZi5maW5hbFNpemVDYWxsYmFjayhmaW5hbFNpemUpO1xuXHRcdFx0c2VsZi5maW5hbFNpemVDYWxsYmFjayA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0Ly8gcHVtcCBlbnRyaWVzXG5cdHZhciBlbnRyeSA9IGdldEZpcnN0Tm90RG9uZUVudHJ5KCk7XG5cblx0ZnVuY3Rpb24gZ2V0Rmlyc3ROb3REb25lRW50cnkoKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmVudHJpZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBlbnRyeSA9IHNlbGYuZW50cmllc1tpXTtcblx0XHRcdGlmIChlbnRyeS5zdGF0ZSA8IEVudHJ5LkZJTEVfREFUQV9ET05FKSByZXR1cm4gZW50cnk7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0aWYgKGVudHJ5ICE9IG51bGwpIHtcblx0XHQvLyB0aGlzIGVudHJ5IGlzIG5vdCBkb25lIHlldFxuXHRcdGlmIChlbnRyeS5zdGF0ZSA8IEVudHJ5LlJFQURZX1RPX1BVTVBfRklMRV9EQVRBKSByZXR1cm47IC8vIGlucHV0IGZpbGUgbm90IG9wZW4geWV0XG5cdFx0aWYgKGVudHJ5LnN0YXRlID09PSBFbnRyeS5GSUxFX0RBVEFfSU5fUFJPR1JFU1MpIHJldHVybjsgLy8gd2UnbGwgZ2V0IHRoZXJlXG5cdFx0Ly8gc3RhcnQgd2l0aCBsb2NhbCBmaWxlIGhlYWRlclxuXHRcdGVudHJ5LnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciA9IHNlbGYub3V0cHV0U3RyZWFtQ3Vyc29yO1xuXHRcdHZhciBsb2NhbEZpbGVIZWFkZXIgPSBlbnRyeS5nZXRMb2NhbEZpbGVIZWFkZXIoKTtcblx0XHR3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGxvY2FsRmlsZUhlYWRlcik7XG5cdFx0ZW50cnkuZG9GaWxlRGF0YVB1bXAoKTtcblx0fSBlbHNlIHtcblx0XHQvLyBhbGwgY291Z2h0IHVwIG9uIHdyaXRpbmcgZW50cmllc1xuXHRcdGlmIChzZWxmLmVuZGVkKSB7XG5cdFx0XHQvLyBoZWFkIGZvciB0aGUgZXhpdFxuXHRcdFx0c2VsZi5vZmZzZXRPZlN0YXJ0T2ZDZW50cmFsRGlyZWN0b3J5ID0gc2VsZi5vdXRwdXRTdHJlYW1DdXJzb3I7XG5cdFx0XHRzZWxmLmVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcblx0XHRcdFx0dmFyIGNlbnRyYWxEaXJlY3RvcnlSZWNvcmQgPSBlbnRyeS5nZXRDZW50cmFsRGlyZWN0b3J5UmVjb3JkKCk7XG5cdFx0XHRcdHdyaXRlVG9PdXRwdXRTdHJlYW0oc2VsZiwgY2VudHJhbERpcmVjdG9yeVJlY29yZCk7XG5cdFx0XHR9KTtcblx0XHRcdHdyaXRlVG9PdXRwdXRTdHJlYW0oc2VsZiwgZ2V0RW5kT2ZDZW50cmFsRGlyZWN0b3J5UmVjb3JkKHNlbGYpKTtcblx0XHRcdHNlbGYub3V0cHV0U3RyZWFtLmVuZCgpO1xuXHRcdFx0c2VsZi5hbGxEb25lID0gdHJ1ZTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlRmluYWxTaXplKHNlbGYpIHtcblx0dmFyIHByZXRlbmRPdXRwdXRDdXJzb3IgPSAwO1xuXHR2YXIgY2VudHJhbERpcmVjdG9yeVNpemUgPSAwO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZW50cmllcy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBlbnRyeSA9IHNlbGYuZW50cmllc1tpXTtcblx0XHQvLyBjb21wcmVzc2lvbiBpcyB0b28gaGFyZCB0byBwcmVkaWN0XG5cdFx0aWYgKGVudHJ5LmNvbXByZXNzKSByZXR1cm4gLTE7XG5cdFx0aWYgKGVudHJ5LnN0YXRlID49IEVudHJ5LlJFQURZX1RPX1BVTVBfRklMRV9EQVRBKSB7XG5cdFx0XHQvLyBpZiBhZGRSZWFkU3RyZWFtIHdhcyBjYWxsZWQgd2l0aG91dCBwcm92aWRpbmcgdGhlIHNpemUsIHdlIGNhbid0IHByZWRpY3QgdGhlIGZpbmFsIHNpemVcblx0XHRcdGlmIChlbnRyeS51bmNvbXByZXNzZWRTaXplID09IG51bGwpIHJldHVybiAtMTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gaWYgd2UncmUgc3RpbGwgd2FpdGluZyBmb3IgZnMuc3RhdCwgd2UgbWlnaHQgbGVhcm4gdGhlIHNpemUgc29tZWRheVxuXHRcdFx0aWYgKGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdC8vIHdlIGtub3cgdGhpcyBmb3Igc3VyZSwgYW5kIHRoaXMgaXMgaW1wb3J0YW50IHRvIGtub3cgaWYgd2UgbmVlZCBaSVA2NCBmb3JtYXQuXG5cdFx0ZW50cnkucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyID0gcHJldGVuZE91dHB1dEN1cnNvcjtcblx0XHR2YXIgdXNlWmlwNjRGb3JtYXQgPSBlbnRyeS51c2VaaXA2NEZvcm1hdCgpO1xuXG5cdFx0cHJldGVuZE91dHB1dEN1cnNvciArPSBMT0NBTF9GSUxFX0hFQURFUl9GSVhFRF9TSVpFICsgZW50cnkudXRmOEZpbGVOYW1lLmxlbmd0aDtcblx0XHRwcmV0ZW5kT3V0cHV0Q3Vyc29yICs9IGVudHJ5LnVuY29tcHJlc3NlZFNpemU7XG5cdFx0aWYgKCFlbnRyeS5jcmNBbmRGaWxlU2l6ZUtub3duKSB7XG5cdFx0XHQvLyB1c2UgYSBkYXRhIGRlc2NyaXB0b3Jcblx0XHRcdGlmICh1c2VaaXA2NEZvcm1hdCkge1xuXHRcdFx0XHRwcmV0ZW5kT3V0cHV0Q3Vyc29yICs9IFpJUDY0X0RBVEFfREVTQ1JJUFRPUl9TSVpFO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJldGVuZE91dHB1dEN1cnNvciArPSBEQVRBX0RFU0NSSVBUT1JfU0laRTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjZW50cmFsRGlyZWN0b3J5U2l6ZSArPSBDRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfRklYRURfU0laRSArIGVudHJ5LnV0ZjhGaWxlTmFtZS5sZW5ndGg7XG5cdFx0aWYgKHVzZVppcDY0Rm9ybWF0KSB7XG5cdFx0XHRjZW50cmFsRGlyZWN0b3J5U2l6ZSArPSBaSVA2NF9FWFRFTkRFRF9JTkZPUk1BVElPTl9FWFRSQV9GSUVMRF9TSVpFO1xuXHRcdH1cblx0fVxuXG5cdHZhciBlbmRPZkNlbnRyYWxEaXJlY3RvcnlTaXplID0gMDtcblx0aWYgKHNlbGYuZm9yY2VaaXA2NEVvY2QgfHxcblx0XHRzZWxmLmVudHJpZXMubGVuZ3RoID49IDB4ZmZmZiB8fFxuXHRcdGNlbnRyYWxEaXJlY3RvcnlTaXplID49IDB4ZmZmZiB8fFxuXHRcdHByZXRlbmRPdXRwdXRDdXJzb3IgPj0gMHhmZmZmZmZmZikge1xuXHRcdC8vIHVzZSB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3Rvcnkgc3R1ZmZcblx0XHRlbmRPZkNlbnRyYWxEaXJlY3RvcnlTaXplICs9IFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSArIFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SX1NJWkU7XG5cdH1cblx0ZW5kT2ZDZW50cmFsRGlyZWN0b3J5U2l6ZSArPSBFTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfUkVDT1JEX1NJWkU7XG5cdHJldHVybiBwcmV0ZW5kT3V0cHV0Q3Vyc29yICsgY2VudHJhbERpcmVjdG9yeVNpemUgKyBlbmRPZkNlbnRyYWxEaXJlY3RvcnlTaXplO1xufVxuXG52YXIgWklQNjRfRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFID0gNTY7XG52YXIgWklQNjRfRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1JfU0laRSA9IDIwO1xudmFyIEVORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSA9IDIyO1xuXG5mdW5jdGlvbiBnZXRFbmRPZkNlbnRyYWxEaXJlY3RvcnlSZWNvcmQoc2VsZiwgYWN0dWFsbHlKdXN0VGVsbE1lSG93TG9uZ0l0V291bGRCZSkge1xuXHR2YXIgbmVlZFppcDY0Rm9ybWF0ID0gZmFsc2U7XG5cdHZhciBub3JtYWxFbnRyaWVzTGVuZ3RoID0gc2VsZi5lbnRyaWVzLmxlbmd0aDtcblx0aWYgKHNlbGYuZm9yY2VaaXA2NEVvY2QgfHwgc2VsZi5lbnRyaWVzLmxlbmd0aCA+PSAweGZmZmYpIHtcblx0XHRub3JtYWxFbnRyaWVzTGVuZ3RoID0gMHhmZmZmO1xuXHRcdG5lZWRaaXA2NEZvcm1hdCA9IHRydWU7XG5cdH1cblx0dmFyIHNpemVPZkNlbnRyYWxEaXJlY3RvcnkgPSBzZWxmLm91dHB1dFN0cmVhbUN1cnNvciAtIHNlbGYub2Zmc2V0T2ZTdGFydE9mQ2VudHJhbERpcmVjdG9yeTtcblx0dmFyIG5vcm1hbFNpemVPZkNlbnRyYWxEaXJlY3RvcnkgPSBzaXplT2ZDZW50cmFsRGlyZWN0b3J5O1xuXHRpZiAoc2VsZi5mb3JjZVppcDY0RW9jZCB8fCBzaXplT2ZDZW50cmFsRGlyZWN0b3J5ID49IDB4ZmZmZmZmZmYpIHtcblx0XHRub3JtYWxTaXplT2ZDZW50cmFsRGlyZWN0b3J5ID0gMHhmZmZmZmZmZjtcblx0XHRuZWVkWmlwNjRGb3JtYXQgPSB0cnVlO1xuXHR9XG5cdHZhciBub3JtYWxPZmZzZXRPZlN0YXJ0T2ZDZW50cmFsRGlyZWN0b3J5ID0gc2VsZi5vZmZzZXRPZlN0YXJ0T2ZDZW50cmFsRGlyZWN0b3J5O1xuXHRpZiAoc2VsZi5mb3JjZVppcDY0RW9jZCB8fCBzZWxmLm9mZnNldE9mU3RhcnRPZkNlbnRyYWxEaXJlY3RvcnkgPj0gMHhmZmZmZmZmZikge1xuXHRcdG5vcm1hbE9mZnNldE9mU3RhcnRPZkNlbnRyYWxEaXJlY3RvcnkgPSAweGZmZmZmZmZmO1xuXHRcdG5lZWRaaXA2NEZvcm1hdCA9IHRydWU7XG5cdH1cblx0aWYgKGFjdHVhbGx5SnVzdFRlbGxNZUhvd0xvbmdJdFdvdWxkQmUpIHtcblx0XHRpZiAobmVlZFppcDY0Rm9ybWF0KSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRaSVA2NF9FTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfUkVDT1JEX1NJWkUgK1xuXHRcdFx0XHRaSVA2NF9FTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUl9TSVpFICtcblx0XHRcdFx0RU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFXG5cdFx0XHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFO1xuXHRcdH1cblx0fVxuXG5cdHZhciBlb2NkckJ1ZmZlciA9IG5ldyBCdWZmZXIoRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFKTtcblx0Ly8gZW5kIG9mIGNlbnRyYWwgZGlyIHNpZ25hdHVyZSAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlcyAgKDB4MDYwNTRiNTApXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUoMHgwNjA1NGI1MCwgMCk7XG5cdC8vIG51bWJlciBvZiB0aGlzIGRpc2sgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgYnl0ZXNcblx0ZW9jZHJCdWZmZXIud3JpdGVVSW50MTZMRSgwLCA0KTtcblx0Ly8gbnVtYmVyIG9mIHRoZSBkaXNrIHdpdGggdGhlIHN0YXJ0IG9mIHRoZSBjZW50cmFsIGRpcmVjdG9yeSAgMiBieXRlc1xuXHRlb2NkckJ1ZmZlci53cml0ZVVJbnQxNkxFKDAsIDYpO1xuXHQvLyB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgY2VudHJhbCBkaXJlY3Rvcnkgb24gdGhpcyBkaXNrICAyIGJ5dGVzXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDE2TEUobm9ybWFsRW50cmllc0xlbmd0aCwgOCk7XG5cdC8vIHRvdGFsIG51bWJlciBvZiBlbnRyaWVzIGluIHRoZSBjZW50cmFsIGRpcmVjdG9yeSAgIDIgYnl0ZXNcblx0ZW9jZHJCdWZmZXIud3JpdGVVSW50MTZMRShub3JtYWxFbnRyaWVzTGVuZ3RoLCAxMCk7XG5cdC8vIHNpemUgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgIDQgYnl0ZXNcblx0ZW9jZHJCdWZmZXIud3JpdGVVSW50MzJMRShub3JtYWxTaXplT2ZDZW50cmFsRGlyZWN0b3J5LCAxMik7XG5cdC8vIG9mZnNldCBvZiBzdGFydCBvZiBjZW50cmFsIGRpcmVjdG9yeSB3aXRoIHJlc3BlY3QgdG8gdGhlIHN0YXJ0aW5nIGRpc2sgbnVtYmVyICA0IGJ5dGVzXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUobm9ybWFsT2Zmc2V0T2ZTdGFydE9mQ2VudHJhbERpcmVjdG9yeSwgMTYpO1xuXHQvLyAuWklQIGZpbGUgY29tbWVudCBsZW5ndGggICAgICAgICAgICAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDE2TEUoMCwgMjApO1xuXHQvLyAuWklQIGZpbGUgY29tbWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodmFyaWFibGUgc2l6ZSlcblx0Ly8gbm8gY29tbWVudFxuXG5cdGlmICghbmVlZFppcDY0Rm9ybWF0KSByZXR1cm4gZW9jZHJCdWZmZXI7XG5cblx0Ly8gWklQNjQgZm9ybWF0XG5cdC8vIFpJUDY0IEVuZCBvZiBDZW50cmFsIERpcmVjdG9yeSBSZWNvcmRcblx0dmFyIHppcDY0RW9jZHJCdWZmZXIgPSBuZXcgQnVmZmVyKFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSk7XG5cdC8vIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpciBzaWduYXR1cmUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzICAoMHgwNjA2NGI1MClcblx0emlwNjRFb2NkckJ1ZmZlci53cml0ZVVJbnQzMkxFKDB4MDYwNjRiNTAsIDApO1xuXHQvLyBzaXplIG9mIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHR3cml0ZVVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSAtIDEyLCA0KTtcblx0Ly8gdmVyc2lvbiBtYWRlIGJ5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgYnl0ZXNcblx0emlwNjRFb2NkckJ1ZmZlci53cml0ZVVJbnQxNkxFKFZFUlNJT05fTUFERV9CWSwgMTIpO1xuXHQvLyB2ZXJzaW9uIG5lZWRlZCB0byBleHRyYWN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMiBieXRlc1xuXHR6aXA2NEVvY2RyQnVmZmVyLndyaXRlVUludDE2TEUoVkVSU0lPTl9ORUVERURfVE9fRVhUUkFDVF9aSVA2NCwgMTQpO1xuXHQvLyBudW1iZXIgb2YgdGhpcyBkaXNrICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHR6aXA2NEVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUoMCwgMTYpO1xuXHQvLyBudW1iZXIgb2YgdGhlIGRpc2sgd2l0aCB0aGUgc3RhcnQgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHR6aXA2NEVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUoMCwgMjApO1xuXHQvLyB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgY2VudHJhbCBkaXJlY3Rvcnkgb24gdGhpcyBkaXNrICAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHR3cml0ZVVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIHNlbGYuZW50cmllcy5sZW5ndGgsIDI0KTtcblx0Ly8gdG90YWwgbnVtYmVyIG9mIGVudHJpZXMgaW4gdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDggYnl0ZXNcblx0d3JpdGVVSW50NjRMRSh6aXA2NEVvY2RyQnVmZmVyLCBzZWxmLmVudHJpZXMubGVuZ3RoLCAzMik7XG5cdC8vIHNpemUgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA4IGJ5dGVzXG5cdHdyaXRlVUludDY0TEUoemlwNjRFb2NkckJ1ZmZlciwgc2l6ZU9mQ2VudHJhbERpcmVjdG9yeSwgNDApO1xuXHQvLyBvZmZzZXQgb2Ygc3RhcnQgb2YgY2VudHJhbCBkaXJlY3Rvcnkgd2l0aCByZXNwZWN0IHRvIHRoZSBzdGFydGluZyBkaXNrIG51bWJlciAgOCBieXRlc1xuXHR3cml0ZVVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIHNlbGYub2Zmc2V0T2ZTdGFydE9mQ2VudHJhbERpcmVjdG9yeSwgNDgpO1xuXHQvLyB6aXA2NCBleHRlbnNpYmxlIGRhdGEgc2VjdG9yICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHZhcmlhYmxlIHNpemUpXG5cdC8vIG5vdGhpbmcgaW4gdGhlIHppcDY0IGV4dGVuc2libGUgZGF0YSBzZWN0b3JcblxuXG5cdC8vIFpJUDY0IEVuZCBvZiBDZW50cmFsIERpcmVjdG9yeSBMb2NhdG9yXG5cdHZhciB6aXA2NEVvY2RsQnVmZmVyID0gbmV3IEJ1ZmZlcihaSVA2NF9FTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUl9TSVpFKTtcblx0Ly8gemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyIGxvY2F0b3Igc2lnbmF0dXJlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDQgYnl0ZXMgICgweDA3MDY0YjUwKVxuXHR6aXA2NEVvY2RsQnVmZmVyLndyaXRlVUludDMyTEUoMHgwNzA2NGI1MCwgMCk7XG5cdC8vIG51bWJlciBvZiB0aGUgZGlzayB3aXRoIHRoZSBzdGFydCBvZiB0aGUgemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5ICA0IGJ5dGVzXG5cdHppcDY0RW9jZGxCdWZmZXIud3JpdGVVSW50MzJMRSgwLCA0KTtcblx0Ly8gcmVsYXRpdmUgb2Zmc2V0IG9mIHRoZSB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkICAgICAgICAgICAgIDggYnl0ZXNcblx0d3JpdGVVSW50NjRMRSh6aXA2NEVvY2RsQnVmZmVyLCBzZWxmLm91dHB1dFN0cmVhbUN1cnNvciwgOCk7XG5cdC8vIHRvdGFsIG51bWJlciBvZiBkaXNrcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdHppcDY0RW9jZGxCdWZmZXIud3JpdGVVSW50MzJMRSgxLCAxNik7XG5cblxuXHRyZXR1cm4gQnVmZmVyLmNvbmNhdChbXG5cdFx0emlwNjRFb2NkckJ1ZmZlcixcblx0XHR6aXA2NEVvY2RsQnVmZmVyLFxuXHRcdGVvY2RyQnVmZmVyLFxuXHRdKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVNZXRhZGF0YVBhdGgobWV0YWRhdGFQYXRoLCBpc0RpcmVjdG9yeSkge1xuXHRpZiAobWV0YWRhdGFQYXRoID09PSBcIlwiKSB0aHJvdyBuZXcgRXJyb3IoXCJlbXB0eSBtZXRhZGF0YVBhdGhcIik7XG5cdG1ldGFkYXRhUGF0aCA9IG1ldGFkYXRhUGF0aC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcblx0aWYgKC9eW2EtekEtWl06Ly50ZXN0KG1ldGFkYXRhUGF0aCkgfHwgL15cXC8vLnRlc3QobWV0YWRhdGFQYXRoKSkgdGhyb3cgbmV3IEVycm9yKFwiYWJzb2x1dGUgcGF0aDogXCIgKyBtZXRhZGF0YVBhdGgpO1xuXHRpZiAobWV0YWRhdGFQYXRoLnNwbGl0KFwiL1wiKS5pbmRleE9mKFwiLi5cIikgIT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHJlbGF0aXZlIHBhdGg6IFwiICsgbWV0YWRhdGFQYXRoKTtcblx0dmFyIGxvb2tzTGlrZURpcmVjdG9yeSA9IC9cXC8kLy50ZXN0KG1ldGFkYXRhUGF0aCk7XG5cdGlmIChpc0RpcmVjdG9yeSkge1xuXHRcdC8vIGFwcGVuZCBhIHRyYWlsaW5nICcvJyBpZiBuZWNlc3NhcnkuXG5cdFx0aWYgKCFsb29rc0xpa2VEaXJlY3RvcnkpIG1ldGFkYXRhUGF0aCArPSBcIi9cIjtcblx0fSBlbHNlIHtcblx0XHRpZiAobG9va3NMaWtlRGlyZWN0b3J5KSB0aHJvdyBuZXcgRXJyb3IoXCJmaWxlIHBhdGggY2Fubm90IGVuZCB3aXRoICcvJzogXCIgKyBtZXRhZGF0YVBhdGgpO1xuXHR9XG5cdHJldHVybiBtZXRhZGF0YVBhdGg7XG59XG5cbnZhciBkZWZhdWx0RmlsZU1vZGUgPSBwYXJzZUludChcIjAxMDA2NjRcIiwgOCk7XG52YXIgZGVmYXVsdERpcmVjdG9yeU1vZGUgPSBwYXJzZUludChcIjA0MDc3NVwiLCA4KTtcblxuLy8gdGhpcyBjbGFzcyBpcyBub3QgcGFydCBvZiB0aGUgcHVibGljIEFQSVxuZnVuY3Rpb24gRW50cnkobWV0YWRhdGFQYXRoLCBpc0RpcmVjdG9yeSwgb3B0aW9ucykge1xuXHR0aGlzLnV0ZjhGaWxlTmFtZSA9IG5ldyBCdWZmZXIobWV0YWRhdGFQYXRoKTtcblx0aWYgKHRoaXMudXRmOEZpbGVOYW1lLmxlbmd0aCA+IDB4ZmZmZikgdGhyb3cgbmV3IEVycm9yKFwidXRmOCBmaWxlIG5hbWUgdG9vIGxvbmcuIFwiICsgdXRmOEZpbGVOYW1lLmxlbmd0aCArIFwiID4gXCIgKyAweGZmZmYpO1xuXHR0aGlzLmlzRGlyZWN0b3J5ID0gaXNEaXJlY3Rvcnk7XG5cdHRoaXMuc3RhdGUgPSBFbnRyeS5XQUlUSU5HX0ZPUl9NRVRBREFUQTtcblx0dGhpcy5zZXRMYXN0TW9kRGF0ZShvcHRpb25zLm10aW1lICE9IG51bGwgPyBvcHRpb25zLm10aW1lIDogbmV3IERhdGUoKSk7XG5cdGlmIChvcHRpb25zLm1vZGUgIT0gbnVsbCkge1xuXHRcdHRoaXMuc2V0RmlsZUF0dHJpYnV0ZXNNb2RlKG9wdGlvbnMubW9kZSk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5zZXRGaWxlQXR0cmlidXRlc01vZGUoaXNEaXJlY3RvcnkgPyBkZWZhdWx0RGlyZWN0b3J5TW9kZSA6IGRlZmF1bHRGaWxlTW9kZSk7XG5cdH1cblx0aWYgKGlzRGlyZWN0b3J5KSB7XG5cdFx0dGhpcy5jcmNBbmRGaWxlU2l6ZUtub3duID0gdHJ1ZTtcblx0XHR0aGlzLmNyYzMyID0gMDtcblx0XHR0aGlzLnVuY29tcHJlc3NlZFNpemUgPSAwO1xuXHRcdHRoaXMuY29tcHJlc3NlZFNpemUgPSAwO1xuXHR9IGVsc2Uge1xuXHRcdC8vIHVua25vd24gc28gZmFyXG5cdFx0dGhpcy5jcmNBbmRGaWxlU2l6ZUtub3duID0gZmFsc2U7XG5cdFx0dGhpcy5jcmMzMiA9IG51bGw7XG5cdFx0dGhpcy51bmNvbXByZXNzZWRTaXplID0gbnVsbDtcblx0XHR0aGlzLmNvbXByZXNzZWRTaXplID0gbnVsbDtcblx0XHRpZiAob3B0aW9ucy5zaXplICE9IG51bGwpIHRoaXMudW5jb21wcmVzc2VkU2l6ZSA9IG9wdGlvbnMuc2l6ZTtcblx0fVxuXHRpZiAoaXNEaXJlY3RvcnkpIHtcblx0XHR0aGlzLmNvbXByZXNzID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5jb21wcmVzcyA9IHRydWU7IC8vIGRlZmF1bHRcblx0XHRpZiAob3B0aW9ucy5jb21wcmVzcyAhPSBudWxsKSB0aGlzLmNvbXByZXNzID0gISFvcHRpb25zLmNvbXByZXNzO1xuXHR9XG5cdHRoaXMuZm9yY2VaaXA2NEZvcm1hdCA9ICEhb3B0aW9ucy5mb3JjZVppcDY0Rm9ybWF0O1xufVxuXG5FbnRyeS5XQUlUSU5HX0ZPUl9NRVRBREFUQSA9IDA7XG5FbnRyeS5SRUFEWV9UT19QVU1QX0ZJTEVfREFUQSA9IDE7XG5FbnRyeS5GSUxFX0RBVEFfSU5fUFJPR1JFU1MgPSAyO1xuRW50cnkuRklMRV9EQVRBX0RPTkUgPSAzO1xuRW50cnkucHJvdG90eXBlLnNldExhc3RNb2REYXRlID0gZnVuY3Rpb24gKGRhdGUpIHtcblx0dmFyIGRvc0RhdGVUaW1lID0gZGF0ZVRvRG9zRGF0ZVRpbWUoZGF0ZSk7XG5cdHRoaXMubGFzdE1vZEZpbGVUaW1lID0gZG9zRGF0ZVRpbWUudGltZTtcblx0dGhpcy5sYXN0TW9kRmlsZURhdGUgPSBkb3NEYXRlVGltZS5kYXRlO1xufTtcbkVudHJ5LnByb3RvdHlwZS5zZXRGaWxlQXR0cmlidXRlc01vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xuXHRpZiAoKG1vZGUgJiAweGZmZmYpICE9PSBtb2RlKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIG1vZGUuIGV4cGVjdGVkOiAwIDw9IFwiICsgbW9kZSArIFwiIDw9IFwiICsgMHhmZmZmKTtcblx0Ly8gaHR0cDovL3VuaXguc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzE0NzA1L3RoZS16aXAtZm9ybWF0cy1leHRlcm5hbC1maWxlLWF0dHJpYnV0ZS8xNDcyNyMxNDcyN1xuXHR0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXMgPSAobW9kZSA8PCAxNikgPj4+IDA7XG59O1xuLy8gZG9GaWxlRGF0YVB1bXAoKSBzaG91bGQgbm90IGNhbGwgcHVtcEVudHJpZXMoKSBkaXJlY3RseS4gc2VlIGlzc3VlICM5LlxuRW50cnkucHJvdG90eXBlLnNldEZpbGVEYXRhUHVtcEZ1bmN0aW9uID0gZnVuY3Rpb24gKGRvRmlsZURhdGFQdW1wKSB7XG5cdHRoaXMuZG9GaWxlRGF0YVB1bXAgPSBkb0ZpbGVEYXRhUHVtcDtcblx0dGhpcy5zdGF0ZSA9IEVudHJ5LlJFQURZX1RPX1BVTVBfRklMRV9EQVRBO1xufTtcbkVudHJ5LnByb3RvdHlwZS51c2VaaXA2NEZvcm1hdCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChcblx0XHQodGhpcy5mb3JjZVppcDY0Rm9ybWF0KSB8fFxuXHRcdCh0aGlzLnVuY29tcHJlc3NlZFNpemUgIT0gbnVsbCAmJiB0aGlzLnVuY29tcHJlc3NlZFNpemUgPiAweGZmZmZmZmZlKSB8fFxuXHRcdCh0aGlzLmNvbXByZXNzZWRTaXplICE9IG51bGwgJiYgdGhpcy5jb21wcmVzc2VkU2l6ZSA+IDB4ZmZmZmZmZmUpIHx8XG5cdFx0KHRoaXMucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyICE9IG51bGwgJiYgdGhpcy5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPiAweGZmZmZmZmZlKVxuXHQpO1xufVxudmFyIExPQ0FMX0ZJTEVfSEVBREVSX0ZJWEVEX1NJWkUgPSAzMDtcbnZhciBWRVJTSU9OX05FRURFRF9UT19FWFRSQUNUX1VURjggPSAyMDtcbnZhciBWRVJTSU9OX05FRURFRF9UT19FWFRSQUNUX1pJUDY0ID0gNDU7XG4vLyAzID0gdW5peC4gNjMgPSBzcGVjIHZlcnNpb24gNi4zXG52YXIgVkVSU0lPTl9NQURFX0JZID0gKDMgPDwgOCkgfCA2MztcbnZhciBGSUxFX05BTUVfSVNfVVRGOCA9IDEgPDwgMTE7XG52YXIgVU5LTk9XTl9DUkMzMl9BTkRfRklMRV9TSVpFUyA9IDEgPDwgMztcbkVudHJ5LnByb3RvdHlwZS5nZXRMb2NhbEZpbGVIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBjcmMzMiA9IDA7XG5cdHZhciBjb21wcmVzc2VkU2l6ZSA9IDA7XG5cdHZhciB1bmNvbXByZXNzZWRTaXplID0gMDtcblx0aWYgKHRoaXMuY3JjQW5kRmlsZVNpemVLbm93bikge1xuXHRcdGNyYzMyID0gdGhpcy5jcmMzMjtcblx0XHRjb21wcmVzc2VkU2l6ZSA9IHRoaXMuY29tcHJlc3NlZFNpemU7XG5cdFx0dW5jb21wcmVzc2VkU2l6ZSA9IHRoaXMudW5jb21wcmVzc2VkU2l6ZTtcblx0fVxuXG5cdHZhciBmaXhlZFNpemVTdHVmZiA9IG5ldyBCdWZmZXIoTE9DQUxfRklMRV9IRUFERVJfRklYRURfU0laRSk7XG5cdHZhciBnZW5lcmFsUHVycG9zZUJpdEZsYWcgPSBGSUxFX05BTUVfSVNfVVRGODtcblx0aWYgKCF0aGlzLmNyY0FuZEZpbGVTaXplS25vd24pIGdlbmVyYWxQdXJwb3NlQml0RmxhZyB8PSBVTktOT1dOX0NSQzMyX0FORF9GSUxFX1NJWkVTO1xuXG5cdC8vIGxvY2FsIGZpbGUgaGVhZGVyIHNpZ25hdHVyZSAgICAgNCBieXRlcyAgKDB4MDQwMzRiNTApXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUoMHgwNDAzNGI1MCwgMCk7XG5cdC8vIHZlcnNpb24gbmVlZGVkIHRvIGV4dHJhY3QgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKFZFUlNJT05fTkVFREVEX1RPX0VYVFJBQ1RfVVRGOCwgNCk7XG5cdC8vIGdlbmVyYWwgcHVycG9zZSBiaXQgZmxhZyAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKGdlbmVyYWxQdXJwb3NlQml0RmxhZywgNik7XG5cdC8vIGNvbXByZXNzaW9uIG1ldGhvZCAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMuZ2V0Q29tcHJlc3Npb25NZXRob2QoKSwgOCk7XG5cdC8vIGxhc3QgbW9kIGZpbGUgdGltZSAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMubGFzdE1vZEZpbGVUaW1lLCAxMCk7XG5cdC8vIGxhc3QgbW9kIGZpbGUgZGF0ZSAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMubGFzdE1vZEZpbGVEYXRlLCAxMik7XG5cdC8vIGNyYy0zMiAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKGNyYzMyLCAxNCk7XG5cdC8vIGNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKGNvbXByZXNzZWRTaXplLCAxOCk7XG5cdC8vIHVuY29tcHJlc3NlZCBzaXplICAgICAgICAgICAgICAgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKHVuY29tcHJlc3NlZFNpemUsIDIyKTtcblx0Ly8gZmlsZSBuYW1lIGxlbmd0aCAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUodGhpcy51dGY4RmlsZU5hbWUubGVuZ3RoLCAyNik7XG5cdC8vIGV4dHJhIGZpZWxkIGxlbmd0aCAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKDAsIDI4KTtcblx0cmV0dXJuIEJ1ZmZlci5jb25jYXQoW1xuXHRcdGZpeGVkU2l6ZVN0dWZmLFxuXHRcdC8vIGZpbGUgbmFtZSAodmFyaWFibGUgc2l6ZSlcblx0XHR0aGlzLnV0ZjhGaWxlTmFtZSxcblx0XHQvLyBleHRyYSBmaWVsZCAodmFyaWFibGUgc2l6ZSlcblx0XHQvLyBubyBleHRyYSBmaWVsZHNcblx0XSk7XG59O1xudmFyIERBVEFfREVTQ1JJUFRPUl9TSVpFID0gMTY7XG52YXIgWklQNjRfREFUQV9ERVNDUklQVE9SX1NJWkUgPSAyNDtcbkVudHJ5LnByb3RvdHlwZS5nZXREYXRhRGVzY3JpcHRvciA9IGZ1bmN0aW9uICgpIHtcblx0aWYgKHRoaXMuY3JjQW5kRmlsZVNpemVLbm93bikge1xuXHRcdC8vIHRoZSBNYWMgQXJjaGl2ZSBVdGlsaXR5IHJlcXVpcmVzIHRoaXMgbm90IGJlIHByZXNlbnQgdW5sZXNzIHdlIHNldCBnZW5lcmFsIHB1cnBvc2UgYml0IDNcblx0XHRyZXR1cm4gbmV3IEJ1ZmZlcigwKTtcblx0fVxuXHRpZiAoIXRoaXMudXNlWmlwNjRGb3JtYXQoKSkge1xuXHRcdHZhciBidWZmZXIgPSBuZXcgQnVmZmVyKERBVEFfREVTQ1JJUFRPUl9TSVpFKTtcblx0XHQvLyBvcHRpb25hbCBzaWduYXR1cmUgKHJlcXVpcmVkIGFjY29yZGluZyB0byBBcmNoaXZlIFV0aWxpdHkpXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUoMHgwODA3NGI1MCwgMCk7XG5cdFx0Ly8gY3JjLTMyICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUodGhpcy5jcmMzMiwgNCk7XG5cdFx0Ly8gY29tcHJlc3NlZCBzaXplICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUodGhpcy5jb21wcmVzc2VkU2l6ZSwgOCk7XG5cdFx0Ly8gdW5jb21wcmVzc2VkIHNpemUgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUodGhpcy51bmNvbXByZXNzZWRTaXplLCAxMik7XG5cdFx0cmV0dXJuIGJ1ZmZlcjtcblx0fSBlbHNlIHtcblx0XHQvLyBaSVA2NCBmb3JtYXRcblx0XHR2YXIgYnVmZmVyID0gbmV3IEJ1ZmZlcihaSVA2NF9EQVRBX0RFU0NSSVBUT1JfU0laRSk7XG5cdFx0Ly8gb3B0aW9uYWwgc2lnbmF0dXJlICh1bmtub3duIGlmIGFueW9uZSBjYXJlcyBhYm91dCB0aGlzKVxuXHRcdGJ1ZmZlci53cml0ZVVJbnQzMkxFKDB4MDgwNzRiNTAsIDApO1xuXHRcdC8vIGNyYy0zMiAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHRcdGJ1ZmZlci53cml0ZVVJbnQzMkxFKHRoaXMuY3JjMzIsIDQpO1xuXHRcdC8vIGNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHRcdHdyaXRlVUludDY0TEUoYnVmZmVyLCB0aGlzLmNvbXByZXNzZWRTaXplLCA4KTtcblx0XHQvLyB1bmNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgIDggYnl0ZXNcblx0XHR3cml0ZVVJbnQ2NExFKGJ1ZmZlciwgdGhpcy51bmNvbXByZXNzZWRTaXplLCAxNik7XG5cdFx0cmV0dXJuIGJ1ZmZlcjtcblx0fVxufTtcbnZhciBDRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfRklYRURfU0laRSA9IDQ2O1xudmFyIFpJUDY0X0VYVEVOREVEX0lORk9STUFUSU9OX0VYVFJBX0ZJRUxEX1NJWkUgPSAyODtcbkVudHJ5LnByb3RvdHlwZS5nZXRDZW50cmFsRGlyZWN0b3J5UmVjb3JkID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgZml4ZWRTaXplU3R1ZmYgPSBuZXcgQnVmZmVyKENFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9GSVhFRF9TSVpFKTtcblx0dmFyIGdlbmVyYWxQdXJwb3NlQml0RmxhZyA9IEZJTEVfTkFNRV9JU19VVEY4O1xuXHRpZiAoIXRoaXMuY3JjQW5kRmlsZVNpemVLbm93bikgZ2VuZXJhbFB1cnBvc2VCaXRGbGFnIHw9IFVOS05PV05fQ1JDMzJfQU5EX0ZJTEVfU0laRVM7XG5cblx0dmFyIG5vcm1hbENvbXByZXNzZWRTaXplID0gdGhpcy5jb21wcmVzc2VkU2l6ZTtcblx0dmFyIG5vcm1hbFVuY29tcHJlc3NlZFNpemUgPSB0aGlzLnVuY29tcHJlc3NlZFNpemU7XG5cdHZhciBub3JtYWxSZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPSB0aGlzLnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlcjtcblx0dmFyIHZlcnNpb25OZWVkZWRUb0V4dHJhY3Q7XG5cdHZhciB6ZWllZkJ1ZmZlcjtcblx0aWYgKHRoaXMudXNlWmlwNjRGb3JtYXQoKSkge1xuXHRcdG5vcm1hbENvbXByZXNzZWRTaXplID0gMHhmZmZmZmZmZjtcblx0XHRub3JtYWxVbmNvbXByZXNzZWRTaXplID0gMHhmZmZmZmZmZjtcblx0XHRub3JtYWxSZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPSAweGZmZmZmZmZmO1xuXHRcdHZlcnNpb25OZWVkZWRUb0V4dHJhY3QgPSBWRVJTSU9OX05FRURFRF9UT19FWFRSQUNUX1pJUDY0O1xuXG5cdFx0Ly8gWklQNjQgZXh0ZW5kZWQgaW5mb3JtYXRpb24gZXh0cmEgZmllbGRcblx0XHR6ZWllZkJ1ZmZlciA9IG5ldyBCdWZmZXIoWklQNjRfRVhURU5ERURfSU5GT1JNQVRJT05fRVhUUkFfRklFTERfU0laRSk7XG5cdFx0Ly8gMHgwMDAxICAgICAgICAgICAgICAgICAgMiBieXRlcyAgICBUYWcgZm9yIHRoaXMgXCJleHRyYVwiIGJsb2NrIHR5cGVcblx0XHR6ZWllZkJ1ZmZlci53cml0ZVVJbnQxNkxFKDB4MDAwMSwgMCk7XG5cdFx0Ly8gU2l6ZSAgICAgICAgICAgICAgICAgICAgMiBieXRlcyAgICBTaXplIG9mIHRoaXMgXCJleHRyYVwiIGJsb2NrXG5cdFx0emVpZWZCdWZmZXIud3JpdGVVSW50MTZMRShaSVA2NF9FWFRFTkRFRF9JTkZPUk1BVElPTl9FWFRSQV9GSUVMRF9TSVpFIC0gNCwgMik7XG5cdFx0Ly8gT3JpZ2luYWwgU2l6ZSAgICAgICAgICAgOCBieXRlcyAgICBPcmlnaW5hbCB1bmNvbXByZXNzZWQgZmlsZSBzaXplXG5cdFx0d3JpdGVVSW50NjRMRSh6ZWllZkJ1ZmZlciwgdGhpcy51bmNvbXByZXNzZWRTaXplLCA0KTtcblx0XHQvLyBDb21wcmVzc2VkIFNpemUgICAgICAgICA4IGJ5dGVzICAgIFNpemUgb2YgY29tcHJlc3NlZCBkYXRhXG5cdFx0d3JpdGVVSW50NjRMRSh6ZWllZkJ1ZmZlciwgdGhpcy5jb21wcmVzc2VkU2l6ZSwgMTIpO1xuXHRcdC8vIFJlbGF0aXZlIEhlYWRlciBPZmZzZXQgIDggYnl0ZXMgICAgT2Zmc2V0IG9mIGxvY2FsIGhlYWRlciByZWNvcmRcblx0XHR3cml0ZVVJbnQ2NExFKHplaWVmQnVmZmVyLCB0aGlzLnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciwgMjApO1xuXHRcdC8vIERpc2sgU3RhcnQgTnVtYmVyICAgICAgIDQgYnl0ZXMgICAgTnVtYmVyIG9mIHRoZSBkaXNrIG9uIHdoaWNoIHRoaXMgZmlsZSBzdGFydHNcblx0XHQvLyAob21pdClcblx0fSBlbHNlIHtcblx0XHR2ZXJzaW9uTmVlZGVkVG9FeHRyYWN0ID0gVkVSU0lPTl9ORUVERURfVE9fRVhUUkFDVF9VVEY4O1xuXHRcdHplaWVmQnVmZmVyID0gbmV3IEJ1ZmZlcigwKTtcblx0fVxuXG5cdC8vIGNlbnRyYWwgZmlsZSBoZWFkZXIgc2lnbmF0dXJlICAgNCBieXRlcyAgKDB4MDIwMTRiNTApXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUoMHgwMjAxNGI1MCwgMCk7XG5cdC8vIHZlcnNpb24gbWFkZSBieSAgICAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKFZFUlNJT05fTUFERV9CWSwgNCk7XG5cdC8vIHZlcnNpb24gbmVlZGVkIHRvIGV4dHJhY3QgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHZlcnNpb25OZWVkZWRUb0V4dHJhY3QsIDYpO1xuXHQvLyBnZW5lcmFsIHB1cnBvc2UgYml0IGZsYWcgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRShnZW5lcmFsUHVycG9zZUJpdEZsYWcsIDgpO1xuXHQvLyBjb21wcmVzc2lvbiBtZXRob2QgICAgICAgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRSh0aGlzLmdldENvbXByZXNzaW9uTWV0aG9kKCksIDEwKTtcblx0Ly8gbGFzdCBtb2QgZmlsZSB0aW1lICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUodGhpcy5sYXN0TW9kRmlsZVRpbWUsIDEyKTtcblx0Ly8gbGFzdCBtb2QgZmlsZSBkYXRlICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUodGhpcy5sYXN0TW9kRmlsZURhdGUsIDE0KTtcblx0Ly8gY3JjLTMyICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUodGhpcy5jcmMzMiwgMTYpO1xuXHQvLyBjb21wcmVzc2VkIHNpemUgICAgICAgICAgICAgICAgIDQgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MzJMRShub3JtYWxDb21wcmVzc2VkU2l6ZSwgMjApO1xuXHQvLyB1bmNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgIDQgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MzJMRShub3JtYWxVbmNvbXByZXNzZWRTaXplLCAyNCk7XG5cdC8vIGZpbGUgbmFtZSBsZW5ndGggICAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMudXRmOEZpbGVOYW1lLmxlbmd0aCwgMjgpO1xuXHQvLyBleHRyYSBmaWVsZCBsZW5ndGggICAgICAgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRSh6ZWllZkJ1ZmZlci5sZW5ndGgsIDMwKTtcblx0Ly8gZmlsZSBjb21tZW50IGxlbmd0aCAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUoMCwgMzIpO1xuXHQvLyBkaXNrIG51bWJlciBzdGFydCAgICAgICAgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRSgwLCAzNCk7XG5cdC8vIGludGVybmFsIGZpbGUgYXR0cmlidXRlcyAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKDAsIDM2KTtcblx0Ly8gZXh0ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzICAgICAgICA0IGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUodGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzLCAzOCk7XG5cdC8vIHJlbGF0aXZlIG9mZnNldCBvZiBsb2NhbCBoZWFkZXIgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKG5vcm1hbFJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciwgNDIpO1xuXG5cdHJldHVybiBCdWZmZXIuY29uY2F0KFtcblx0XHRmaXhlZFNpemVTdHVmZixcblx0XHQvLyBmaWxlIG5hbWUgKHZhcmlhYmxlIHNpemUpXG5cdFx0dGhpcy51dGY4RmlsZU5hbWUsXG5cdFx0Ly8gZXh0cmEgZmllbGQgKHZhcmlhYmxlIHNpemUpXG5cdFx0emVpZWZCdWZmZXIsXG5cdFx0Ly8gZmlsZSBjb21tZW50ICh2YXJpYWJsZSBzaXplKVxuXHRcdC8vIGVtcHR5IGNvbW1lbnRcblx0XSk7XG59O1xuRW50cnkucHJvdG90eXBlLmdldENvbXByZXNzaW9uTWV0aG9kID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgTk9fQ09NUFJFU1NJT04gPSAwO1xuXHR2YXIgREVGTEFURV9DT01QUkVTU0lPTiA9IDg7XG5cdHJldHVybiB0aGlzLmNvbXByZXNzID8gREVGTEFURV9DT01QUkVTU0lPTiA6IE5PX0NPTVBSRVNTSU9OO1xufTtcblxuZnVuY3Rpb24gZGF0ZVRvRG9zRGF0ZVRpbWUoanNEYXRlKSB7XG5cdHZhciBkYXRlID0gMDtcblx0ZGF0ZSB8PSBqc0RhdGUuZ2V0RGF0ZSgpICYgMHgxZjsgLy8gMS0zMVxuXHRkYXRlIHw9ICgoanNEYXRlLmdldE1vbnRoKCkgKyAxKSAmIDB4ZikgPDwgNTsgLy8gMC0xMSwgMS0xMlxuXHRkYXRlIHw9ICgoanNEYXRlLmdldEZ1bGxZZWFyKCkgLSAxOTgwKSAmIDB4N2YpIDw8IDk7IC8vIDAtMTI4LCAxOTgwLTIxMDhcblxuXHR2YXIgdGltZSA9IDA7XG5cdHRpbWUgfD0gTWF0aC5mbG9vcihqc0RhdGUuZ2V0U2Vjb25kcygpIC8gMik7IC8vIDAtNTksIDAtMjkgKGxvc2Ugb2RkIG51bWJlcnMpXG5cdHRpbWUgfD0gKGpzRGF0ZS5nZXRNaW51dGVzKCkgJiAweDNmKSA8PCA1OyAvLyAwLTU5XG5cdHRpbWUgfD0gKGpzRGF0ZS5nZXRIb3VycygpICYgMHgxZikgPDwgMTE7IC8vIDAtMjNcblxuXHRyZXR1cm4ge2RhdGU6IGRhdGUsIHRpbWU6IHRpbWV9O1xufVxuXG5mdW5jdGlvbiB3cml0ZVVJbnQ2NExFKGJ1ZmZlciwgbiwgb2Zmc2V0KSB7XG5cdC8vIGNhbid0IHVzZSBiaXRzaGlmdCBoZXJlLCBiZWNhdXNlIEphdmFTY3JpcHQgb25seSBhbGxvd3MgYml0c2hpdGluZyBvbiAzMi1iaXQgaW50ZWdlcnMuXG5cdHZhciBoaWdoID0gTWF0aC5mbG9vcihuIC8gMHgxMDAwMDAwMDApO1xuXHR2YXIgbG93ID0gbiAlIDB4MTAwMDAwMDAwO1xuXHRidWZmZXIud3JpdGVVSW50MzJMRShsb3csIG9mZnNldCk7XG5cdGJ1ZmZlci53cml0ZVVJbnQzMkxFKGhpZ2gsIG9mZnNldCArIDQpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q2FsbGJhY2soZXJyKSB7XG5cdGlmIChlcnIpIHRocm93IGVycjtcbn1cblxudXRpbC5pbmhlcml0cyhCeXRlQ291bnRlciwgVHJhbnNmb3JtKTtcblxuZnVuY3Rpb24gQnl0ZUNvdW50ZXIob3B0aW9ucykge1xuXHRUcmFuc2Zvcm0uY2FsbCh0aGlzLCBvcHRpb25zKTtcblx0dGhpcy5ieXRlQ291bnQgPSAwO1xufVxuXG5CeXRlQ291bnRlci5wcm90b3R5cGUuX3RyYW5zZm9ybSA9IGZ1bmN0aW9uIChjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG5cdHRoaXMuYnl0ZUNvdW50ICs9IGNodW5rLmxlbmd0aDtcblx0Y2IobnVsbCwgY2h1bmspO1xufTtcblxudXRpbC5pbmhlcml0cyhDcmMzMldhdGNoZXIsIFRyYW5zZm9ybSk7XG5cbmZ1bmN0aW9uIENyYzMyV2F0Y2hlcihvcHRpb25zKSB7XG5cdFRyYW5zZm9ybS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXHR0aGlzLmNyYzMyID0gMDtcbn1cblxuQ3JjMzJXYXRjaGVyLnByb3RvdHlwZS5fdHJhbnNmb3JtID0gZnVuY3Rpb24gKGNodW5rLCBlbmNvZGluZywgY2IpIHtcblx0dGhpcy5jcmMzMiA9IGNyYzMyLnVuc2lnbmVkKGNodW5rLCB0aGlzLmNyYzMyKTtcblx0Y2IobnVsbCwgY2h1bmspO1xufTsiXX0=
