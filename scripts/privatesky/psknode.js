psknodeRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/opt/privatesky/builds/tmp/psknode_intermediar.js":[function(require,module,exports){
(function (global){
global.psknodeLoadModules = function(){ 
	$$.__runtimeModules["yazl"] = require("yazl");
	$$.__runtimeModules["yauzl"] = require("yauzl");
	$$.__runtimeModules["pskwallet"] = require("pskwallet");
	$$.__runtimeModules["signsensus"] = require("signsensus");
	$$.__runtimeModules["foldermq"] = require("foldermq");
	$$.__runtimeModules["pskdb"] = require("pskdb");
	$$.__runtimeModules["buffer-crc32"] = require("buffer-crc32");
	$$.__runtimeModules["node-fd-slicer"] = require("node-fd-slicer");
	$$.__runtimeModules["interact"] = require("interact");
	$$.__runtimeModules["psk-http-client"] = require("psk-http-client");
	$$.__runtimeModules["edfs"] = require("edfs");
	$$.__runtimeModules["bar"] = require("bar");
	$$.__runtimeModules["csb"] = require("csb");
	$$.__runtimeModules["edfs-brick-storage"] = require("edfs-brick-storage");
	$$.__runtimeModules["domainBase"] = require("domainBase");
	$$.__runtimeModules["agentBase"] = require("agentBase");
}
if (false) {
	psknodeLoadModules();
}; 
global.psknodeRequire = require;
if (typeof $$ !== "undefined") {            
    $$.requireBundle("psknode");
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"agentBase":"agentBase","bar":"bar","buffer-crc32":"buffer-crc32","csb":"csb","domainBase":"domainBase","edfs":"edfs","edfs-brick-storage":"edfs-brick-storage","foldermq":"foldermq","interact":"interact","node-fd-slicer":"node-fd-slicer","psk-http-client":"psk-http-client","pskdb":"pskdb","pskwallet":"pskwallet","signsensus":"signsensus","yauzl":"yauzl","yazl":"yazl"}],"/opt/privatesky/libraries/agentBase/agentPubSub.js":[function(require,module,exports){
(function (global){
const pubSub = require("soundpubsub").soundPubSub;
const mq = require("foldermq");
const path = require("path");

exports.create = function(folder, vm){
    var inbound = mq.createQue(path.join(folder, "mq", "inbound"), $$.defaultErrorHandlingImplementation);
    var outbound = mq.createQue(path.join(folder, "mq", "outbound"), $$.defaultErrorHandlingImplementation);
        outbound.setIPCChannel(process);
        outbound = outbound.getHandler();

    inbound.setIPCChannel(process);
    inbound.registerAsIPCConsumer(function(err, swarm){
        if(swarm){
            //restore and execute this tasty swarm
            global.$$.swarmsInstancesManager.revive_swarm(swarm);
        }else{
            console.log("Got an error", err);
            //TODO: what happens with the serialization if there where an error???
        }

    });

    /*inbound.registerConsumer(function(err, swarm){
       //restore and execute this tasty swarm
        global.$$.swarmsInstancesManager.revive_swarm(swarm);
    });*/

    pubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function(swarm){
        outbound.sendSwarmForExecution(swarm);
    });

    return pubSub;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"foldermq":"foldermq","path":false,"soundpubsub":false}],"/opt/privatesky/libraries/domainBase/domainPubSub.js":[function(require,module,exports){
var pubSub = $$.require("soundpubsub").soundPubSub;
const path = require("path");
const fs = require("fs");

exports.create = function(folder, codeFolder ){

    $$.PSK_PubSub = pubSub;
    var sandBoxesRoot = path.join(folder, "sandboxes");

    try{
        fs.mkdirSync(sandBoxesRoot, {recursive: true});
    }catch(err){
        console.log("Failed to create sandboxes dir structure!", err);
        //TODO: maybe it is ok to call process.exit ???
    }

    $$.SandBoxManager = require("../../psknode/core/sandboxes/util/SandBoxManager").create(sandBoxesRoot, codeFolder, function(err, res){
        console.log($$.DI_components.sandBoxReady, err, res);
        $$.container.resolve($$.DI_components.sandBoxReady, true);
    });

    return pubSub;
};

},{"../../psknode/core/sandboxes/util/SandBoxManager":"/opt/privatesky/psknode/core/sandboxes/util/SandBoxManager.js","fs":false,"path":false}],"/opt/privatesky/modules/bar/lib/Archive.js":[function(require,module,exports){
(function (Buffer){
const Brick = require('./Brick');
const path = require("path");
const isStream = require("../utils/isStream");

function Archive(archiveConfigurator, mapDigest) { //configObj
    //numele si provider-ul pe care il vom utiliza, provider-ul va fi un string
    //in functie de valoarea acestui string vom crea in variabila storagePrv
    //un obiect de tipul StorageFile sau StorageFolder


    const diskAdapter = archiveConfigurator.getDiskAdapter();
    const storageProvider = archiveConfigurator.getStorageProvider();
    let barMap;

    function putBarMap(callback) {
        if (typeof mapDigest !== "undefined") {
            storageProvider.deleteBrick(mapDigest, (err) => {
                if (err) {
                    return callback(err);
                }

                __putBarMap(callback);
            });
            return;
        }

        __putBarMap(callback);
    }

    function __putBarMap(callback) {
        storageProvider.putBarMap(barMap, (err, newMapDigest) => {
            if (err) {
                return callback(err);
            }

            mapDigest = newMapDigest;
            callback(undefined, mapDigest);
        });
    }

    this.appendToFile = function (filePath, data, callback) {
        //fileName - numele fisierului in care vrem sa facem append
        //data - buffer-ul de citire, vom prelua din el datele
        //callback - aceeasi functie care se ocupa de prelucarea datelor,
        //de creerea de brick-uri si scrierea lor
        loadBarMapThenExecute(helperAppendToFile, callback);

        function helperAppendToFile() {
            filePath = validateFileName(filePath);

            if (typeof data === "string") {
                data = Buffer.from(data);
            }

            if (Buffer.isBuffer(data)) {
                const dataBrick = new Brick(data);
                storageProvider.putBrick(dataBrick, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    barMap.add(filePath, dataBrick);
                    putBarMap(callback);
                });
                return;
            }

            if (isStream.isReadable(data)) {
                data.on('error', (err) => {
                    return callback(err);
                }).on('data', (chunk) => {
                    const dataBrick = new Brick(chunk);
                    storageProvider.putBrick(dataBrick, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        barMap.add(filePath, dataBrick);
                    });
                }).on("end", () => {
                    putBarMap(callback);
                });
                return;
            }
            callback(new Error("Invalid type of parameter data"));
        }
    };

    this.addFolder = function (folderPath, callback) {
        loadBarMapThenExecute(helperAddFolder, callback);

        function helperAddFolder() {
            diskAdapter.getNextFile(folderPath, __readFileCb);

            function __readFileCb(err, file) {
                if (err) {
                    return callback(err);
                }

                if (typeof file !== "undefined") {
                    const splitFolderPath = folderPath.split(path.sep);
                    splitFolderPath.pop();
                    readFileAsBlocks(splitFolderPath.join(path.sep), file, archiveConfigurator.getBufferSize(), barMap, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        diskAdapter.getNextFile(folderPath, __readFileCb);
                    });
                } else {
                    storageProvider.putBarMap(barMap, callback);
                }
            }
        }
    };

    function deleteForFileName(filename, hashList, length, index, callback) {
        if (index === length) {
            return callback();
        }
        storageProvider.deleteBrick(hashList[index], (err) => {
            if (err) {
                return callback(err);
            }

            deleteForFileName(filename, hashList, length, (index + 1), callback);
        });
    }

    this.replaceFile = function (fileName, stream, callback) {
        if (typeof stream !== 'object') {
            return callback(new Error('Wrong stream!'));
        }

        loadBarMapThenExecute(helperReplaceFile, callback);

        function helperReplaceFile() {
            fileName = validateFileName(fileName);
            stream.on('error', () => {
                return callback(new Error("File does not exist!"));
            }).on('open', () => {
                let hashList = barMap.getHashList(fileName);
                deleteForFileName(fileName, hashList, hashList.length, 0, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    barMap.emptyList(fileName);
                });
            }).on('data', (chunk) => {
                let tempBrick = new Brick(chunk);
                barMap.add(fileName, tempBrick);
                storageProvider.putBrick(tempBrick, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    putBarMap(callback);
                });
            });
        }
    };

    this.addFile = function (filePath, callback) {
        loadBarMapThenExecute(helperAddFile, callback);

        function helperAddFile() {
            const folderPath = path.dirname(filePath);
            diskAdapter.getNextFile(filePath, (err, file) => {
                if (err) {
                    return callback(err);
                }

                readFileAsBlocks(folderPath, file, archiveConfigurator.getBufferSize(), barMap, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    storageProvider.putBarMap(barMap, callback);
                });
            });
        }
    };

    this.getFile = function (savePath, callback) {
        this.extractFolder(savePath, callback);
    };

    this.extractFile = function (fileName, location, callback) {
        loadBarMapThenExecute(helperExtractFile, callback);

        function helperExtractFile() {
            fileName = validateFileName(fileName);
            const hashList = barMap.getHashList(fileName);
            __getFileRecursively(hashList, hashList.length, 0, callback);
        }

        function __getFileRecursively(hashList, length, index, callback) {
            if (index === length) {
                return callback();
            }

            storageProvider.getBrick(hashList[index], (err, data) => {
                if (err) {
                    return callback(err);
                }
                __appender(err, data, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    __getFileRecursively(hashList, length, index + 1, callback);
                });
            });
        }

        function __appender(err, data, callback) {
            if (err) {
                return callback(err);
            }
            let base = path.basename(fileName);
            let pth = path.join(location, base.toString());
            diskAdapter.appendBlockToFile(pth, data.getData(), callback);
        }
    };

    this.extractFolder = function (savePath, callback) {
        //functia asta extrage un fisier din arhiva, si foloseste functia de callback
        //pentru a retine datele intr-o lista sau pentru a face o procesare ulterioara
        loadBarMapThenExecute(helperExtractFolder, callback);

        function helperExtractFolder() {
            let filePaths = barMap.getFileList();
            function __readFilesRecursively(fileIndex, readFilesCb) {

                function __getBricksRecursively(brickIndex, getBricksCb) {
                    const brickHash = brickList[brickIndex];
                    storageProvider.getBrick(brickHash, (err, brickData) => {
                        if (err) {
                            return getBricksCb(err);
                        }
                        const newPath = path.join(savePath, filePath);
                        diskAdapter.appendBlockToFile(newPath, brickData.getData(), (err) => {
                            if (err) {
                                return getBricksCb(err);
                            }

                            ++brickIndex;
                            if (brickIndex < brickList.length) {
                                __getBricksRecursively(brickIndex, getBricksCb);
                            } else {
                                getBricksCb();
                            }
                        });
                    });
                }

                const filePath = filePaths[fileIndex];
                const brickList = barMap.getHashList(filePath);
                if (brickList.length > 0) {
                    __getBricksRecursively(0, (err) => {
                        if (err) {
                            return readFilesCb(err);
                        }

                        ++fileIndex;
                        if (fileIndex < filePaths.length) {
                            __readFilesRecursively(fileIndex, readFilesCb);
                        } else {
                            readFilesCb();
                        }
                    });
                }
            }

            __readFilesRecursively(0, callback);
        }

    };

    this.getReadStream = function (filePath) {
        //ne va oferi un buffer care sa citeasca dintr-un fisier din arhiva noastra?
        //return diskAdapter.getReadStream(filePath,bufferSize);

    };

    this.getWriteStream = function (filePath) {
        //ne va oferi un buffer care sa scrie intr-un fisier din arhiva noastra
        //return diskAdapter.getWriteStream(filePath);

    };

    this.store = function (callback) {
        storageProvider.putBarMap(barMap, callback);
    };

    this.list = function (callback) {
        if (typeof barMap === "undefined") {
            storageProvider.getBarMap(mapDigest, (err, map) => {
                if (err) {
                    return callback(err);
                }

                barMap = map;
                callback(undefined, barMap.getFileList());
            });
        } else {
            callback(undefined, barMap.getFileList());
        }
        //aceasta functie va lista denumirile fisierelor din arhiva
        //nu inteleg ce ar trebui sa faca functia de callback
    };

    function readFileAsBlocks(folderPath, fileName, blockSize, barMap, callback) {
        const absolutePath = path.join(folderPath, fileName);
        diskAdapter.getFileSize(absolutePath, (err, fileSize) => {
            if (err) {
                return callback(err);
            }


            let noBlocks = Math.floor(fileSize / blockSize);
            if (fileSize % blockSize > 0) {
                ++noBlocks;
            }

            let blockIndex = 0;

            function __readCb(err, buffer) {
                if (err) {
                    return callback(err);
                }

                const brick = new Brick(buffer);
                barMap.add(fileName, brick);
                storageProvider.putBrick(brick, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    ++blockIndex;
                    if (blockIndex < noBlocks) {
                        diskAdapter.readBlockFromFile(absolutePath, blockIndex, blockSize, __readCb);
                    } else {
                        callback();
                    }

                });
            }

            diskAdapter.readBlockFromFile(absolutePath, blockIndex, blockSize, __readCb);
        });
    }

    function validateFileName(fileName) {
        if (fileName[0] !== '/') {
            fileName = path.sep + fileName;
        }
        for (let it = 0; it < fileName.length; it++) {
            if (fileName[it] === '/')
                fileName = fileName.replace('/', path.sep);
        }
        return fileName;
    }
    
    function loadBarMapThenExecute(functionToBeExecuted, callback) {
        if (typeof barMap === "undefined") {
            storageProvider.getBarMap(mapDigest, (err, map) => {
                if (err) {
                    return callback(err);
                }

                barMap = map;
                functionToBeExecuted();
            });
        } else {
            functionToBeExecuted();
        }
    }

}

module.exports = Archive;
}).call(this,require("buffer").Buffer)

},{"../utils/isStream":"/opt/privatesky/modules/bar/utils/isStream.js","./Brick":"/opt/privatesky/modules/bar/lib/Brick.js","buffer":false,"path":false}],"/opt/privatesky/modules/bar/lib/ArchiveConfigurator.js":[function(require,module,exports){
const storageProviders = {};
const diskAdapters = {};

function ArchiveConfigurator() {
    const config = {};

    this.setBufferSize = function (bufferSize) {
        config.bufferSize = bufferSize;
    };

    this.getBufferSize = function () {
        return config.bufferSize;
    };

    this.setStorageProvider = function (storageProviderName, ...args) {
        config.storageProvider = storageProviders[storageProviderName](...args);
    };

    this.getStorageProvider = function () {

        return config.storageProvider;
    };

    this.setDiskAdapter = function (diskAdapterName, ...args) {
        config.diskAdapter = diskAdapters[diskAdapterName](...args);
    };
    this.getDiskAdapter = function () {
        return config.diskAdapter;
    }
}

ArchiveConfigurator.prototype.registerStorageProvider = function (storageProviderName, factory) {
    storageProviders[storageProviderName] = factory;
};

ArchiveConfigurator.prototype.registerDiskAdapter = function (diskAdapterName, factory) {
    diskAdapters[diskAdapterName] = factory;
};

module.exports = ArchiveConfigurator;
},{}],"/opt/privatesky/modules/bar/lib/Brick.js":[function(require,module,exports){
const crypto = require('crypto');

function Brick(data){
    let hash;
    this.getHash = function () {
        if (typeof hash === "undefined") {
            const h = crypto.createHash('sha256');
            h.update(data);
            hash = h.digest('hex');
        }
        return hash;
    };

    this.getData = function(){
        return data;
    }
}

module.exports = Brick;
},{"crypto":false}],"/opt/privatesky/modules/bar/lib/FileBarMap.js":[function(require,module,exports){
(function (Buffer){
const Brick = require("./Brick");

function FileBarMap(header){
    header = header || {};
    let brickPositions = [];
    let position = 0;
    let index=0;
    //header este un map in care vom retine datele intr-un format json
    //vom avea key-ul care va fi filename-ul, si datele care va fi lista de hash-uri
    this.add = function (filePath, brick) {
        //hashList-ul va fi direct lista de hash-uri, pentru ca o putem face pe masura
        //ce ne ocupam de salvarea brick-urilor
        let lastPosition = 96;
        if(index>0)
            lastPosition = brickPositions[index-1];
        if (typeof header[filePath] === "undefined") {
            header[filePath] = [];
            brickPositions.push((lastPosition+brick.getSize()));
            header[filePath].push(index);
            index++;
        }
        else{
            //let tempL = header[filePath].length;
            //let tempSize = header[filePath][tempL-1];
            brickPositions.push((lastPosition+brick.getSize()));
            header[filePath].push(index);
            index++;
        }
    };

    this.setBarMapPositon = function(actualPosition){
        position = actualPosition;
    }

    this.getHashList = function (filePath) {
        //avem nevoie de hash-uri ca sa putem obtine brick-urile unui fisier
        //un hash este de fapt denumirea unui brick
        //aceasta functie returneaza lista de hash-uri
        return header[filePath];
    };

    this.emptyList = function (filePath) {
        header[filePath] = [];
    };

    this.toBrick = function () {
        let tempMap = {};
        tempMap.positions = header;
        tempMap.indexes = brickPositions;
        return new Brick(Buffer.from(JSON.stringify(tempMap)));
    };

    this.getFileList = function(){
        return Object.keys(header);
    }

    this.getListOfBrickPositions = function(){
        return brickPositions;
    }

    this.getPosition = function(index){
        if(index>brickPositions.length)
            return undefined;
        return brickPositions[index];
    }

    this.setListOfBrickPositions = function(list){
        brickPositions = list;
    }
}

module.exports = FileBarMap;
}).call(this,require("buffer").Buffer)

},{"./Brick":"/opt/privatesky/modules/bar/lib/Brick.js","buffer":false}],"/opt/privatesky/modules/bar/lib/FileBrickStorage.js":[function(require,module,exports){
(function (Buffer){
const fs = require('fs');
const BarMap = require('./FileBarMap');
//const fileBarMap = require('FileBarMap');

function FileBrickStorage(location){
    //clasele acestea de storage, nu se mai ocupa de citiri si scrieri acum
    //deci aceste functii pe care le apelez, putBrick si getBrick sunt niste functii intermediare
    //toate procesarile se fac in BarWorker (partea de citire, mapare a header-ului arhivei)
    //si in storage, de exemplu append-ul de date la un Brick
    let map;
    let barMapPosition = 96;
    // this.putBrick = function(brick,callback){
    //     barMapPosition += brick.getData().length;
    //     brickSizes[brick.getHash()] = brick.getData().length; 
    //     fs.appendFile(location,brick.getData(),(err)=>{
    //         if(err)
    //             callback(err);
    //         else
    //             callback();
    //     });
    //     //aceasta functie va primi un brick
    //     //si va apela o fucntie din BarWorker ce se va ocupa de scrierea datelor in fisier
    //     //va face append la fisierul .bar, cu datele respective
    // }

    // this.putBrick = function(brick,callback){
    //     barMapPosition += brick.getData().length;
    //     brickSizes[brick.getHash()] = brick.getData().length;
    //     let tempBuffer = Buffer.alloc(brick.getData().length,brick.getData());
    //     fs.open(location,'w',(err,fd)=>{
    //         fs.write(fd,tempBuffer,0,tempBuffer,barMapPosition,(err,wrr,str)=>{
    //             if(err)
    //                 throw err;
    //         });
    //     });
    // }

    this.putBrick = function(brick,callback){
        fs.stat(location,(err,stat)=>{
            if(err){
                fs.open(location,'r+',(err,fd)=>{
                    let tempBuffer = Buffer.alloc(brick.getSize(),brick.getData());
                    fs.write(fd,tempBuffer,0,tempBuffer.length,96,(err,wrt,buffer)=>{
                        if(err)
                            return callback(err);
                    });
                });
            }else{
                fs.appendFile(location,brick.getData(),(err)=>{
                    if(err)
                        return callback(err);
                });
            }
            callback();
        });
    }

    // this.putBarMap = function(barMap,callback){
    //     let map = {};
    //     barMap.getFileList().forEach(file=>{
    //         map[file] = [];
    //         let tempSize = [];
    //         barMap.getHashList(file).forEach(hash=>{
    //             tempSize.push(brickSizes[hash]);
    //         });
    //         map[file] = [barMap.getHashList(file),tempSize];
    //     });
    //     let buffer = JSON.stringify(map);
    //     let bufferNumber = Buffer.alloc(number.toString().length,number.toString());
    //     fs.open(location,'w',(err,fd)=>{
    //         fs.write(fd,bufferNumber,0,bufferNumber.length,0,(err,bytesRead,str)=>{
    //             if(err)
    //                 callback(err);
    //         });
    //         fs.write(fd,buffer,0,buffer.length,barMapPosition,(err,wrt,str)=>{
    //             if(err)
    //                 callback(err);
    //         });
    //     });
    // }

    this.putBarMap = function(barMap,callback){
        // barMap.getFileList().forEach(file=>{
        //     map[file] = [];
        //     let tempSize = [];
        //     barMap.getHashList(file).forEach(hash=>{
        //         tempSize.push(brickSizes[hash]);
        //     });
        //     map[file] = [barMap.getHashList(file),tempSize];
        // });
        // let buffer = JSON.stringify(map);
        // let bufferNumber = Buffer.alloc(number.toString().length,number.toString());
        // fs.open(location,'w',(err,fd)=>{
        //     fs.write(fd,bufferNumber,0,bufferNumber.length,0,(err,bytesRead,str)=>{
        //         if(err)
        //             callback(err);
        //     });
        //     fs.write(fd,buffer,0,buffer.length,barMapPosition,(err,wrt,str)=>{
        //         if(err)
        //             callback(err);
        //     });
        // });
        // let tempMap = {};
        // map.getFileList().forEach(key=>{
        //     map.getHashList(key).forEach(el=>{
        //         tempMap[key] = el;
        //     });
        // });
        // let mapToWrite = {};
        // mapToWrite.positions = tempMap;
        // mapToWrite.indexes = map.getListOfBrickPositions();
        // let stringToWrite = JSOn.stringify(mapToWrite);
        // let tempBuffer = Buffer.alloc(stringToWrite.length,stringToWrite);
        let map = barMap.toBrick();
        let tempBuffer = Buffer.alloc(map.getData().length,map.getData().toString());
        fs.open(location,'r+',(err,fd)=>{
            if(err)
                return callback(err);
            fs.write(fd,tempBuffer,0,tempBuffer.length,barMapPosition,(err,wrt,buff)=>{
                if(err)
                    return callback(err);
            });
        });
        callback(undefined,);
    }

    // this.getBarMap = function(callback){
    //     fs.open(location,'r+',(err,fd)=>{
    //         if(err)
    //             return callback(err);
    //         let buffer = Buffer.alloc(128);
    //         fs.read(fd,buffer,0,78,0,(err,bytesRead,buffer)=>{
    //             if(err)
    //                 return callback(err);
    //             let number = ParseInt(buffer.slice(0,bytesRead));
    //             barMapPosition = number;
    //             fs.stat(location,(err,stat)=>{
    //                 let bufferBM = Buffer.alloc(stat.size-number);
    //                 fs.read(fd,bufferBM,0,bufferBM.length,number,(err,bytesRead,buffer)=>{
    //                     let temp = JSON.parse(bufferBM.toString());
    //                     let tempHeader = {};
    //                     Object.keys(temp).forEach(key=>{
    //                         tempHeader[key] = temp[key][0];
    //                         let tempArr = temp[key][1];
    //                         let index = 0;
    //                         tempHeader[key].forEach(element=>{
    //                             brickSizes[element] = tempArr[index];
    //                             index++;
    //                         });
    //                     });
    //                 });
    //             });
    //         });
    //     })
    // }

    // this.getBarMap = function(callback){
    //     fs.open(location,'r+',(err,fd)=>{
    //         if(err)
    //             return callback(err);
    //         let buffer = Buffer.alloc(128);
    //         fs.read(fd,buffer,0,78,0,(err,bytesRead,buffer)=>{
    //             if(err)
    //                 return callback(err);
    //             let number = ParseInt(buffer.slice(0,bytesRead));
    //             barMapPosition = number;
    //             fs.stat(location,(err,stat)=>{
    //                 let bufferBM = Buffer.alloc(stat.size-number);
    //                 fs.read(fd,bufferBM,0,bufferBM.length,number,(err,bytesRead,buffer)=>{
    //                     let temp = JSON.parse(bufferBM.toString());
    //                     let tempHeader = {};
    //                     Object.keys(temp).forEach(key=>{
    //                         tempHeader[key] = temp[key][0];
    //                         let tempArr = temp[key][1];
    //                         let index = 0;
    //                         tempHeader[key].forEach(element=>{
    //                             brickSizes[element] = tempArr[index];
    //                             index++;
    //                         });
    //                     });
    //                 });
    //             });
    //         });
    //     })
    // }

    this.getBarMap = function(mapDigest,callback){
        if(mapDigest === undefined){
            callback(undefined,new BarMap());
        }
        fs.open(location,'r+',(err,fd)=>{
            if(err)
                return callback(err);
            fs.stat(location,(err,stat)=>{
                if(err)
                    return callback(err);
                let numberBuffer = Buffer.alloc(64);
                fs.read(fd,numberBuffer,0,numberBuffer.length,0,(err,bytesRead,numberBuffer)=>{
                    if(err)
                        return callback(err);
                    numberBuffer = numberBuffer.slice(0,bytesRead);
                    let tempBuffer = Buffer.alloc((stat.size-parseInt(numberBuffer.toString())));
                    fs.read(fd,tempBuffer,0,tempBuffer.length,parseInt(numberBuffer),(err,bytesRead,tempBuffer)=>{
                        if(err)
                            return callback(err);
                        tempBuffer = tempBuffer.slice(0,bytesRead);
                        let tempMap = JSON.parse(tempBuffer.toString());
                        map = new Map(tempMap.positions);
                        map.setListOfBrickPositions(tempMap.indexes);
                        callback(undefined,map);
                    });
                });
            });
        });
    }
    
    // this.getBrick = function(brickHash,callback){
    //     let buffer = Buffer.alloc(brickSizes[brickHash]);
    //     fs.open(location,'r+',(err,fd)=>{
    //         if(err)
    //             return callback(err);
    //
    //         fs.read(fd,buffer,0,buffer.length,relativePosition,(err,bytesRead,buff)=>{
    //             relativePosition += brickSizes[birkHash];
    //             callback(err,buffer.slice(0,bytesRead));
    //         });
    //     });
    // }

    this.getBrick = function(brickIndex,callback){
        let tempBuffer = Buffer.alloc(map.getPosition(brickIndex+1)-map.getPosition(brickIndex));
        fs.open(location,'r+',(err,fd)=>{
            fs.read(fd,tempBuffer,0,map.getPosition(brickIndex+1)-map.getPosition(brickIndex),map.getPosition(brickIndex),(err,bytesRead,tempBuffer)=>{
                if(err)
                    return callback(err);
                tempBuffer = tempBuffer.slice(0,bytesRead);
                callback(undefined,tempBuffer);
            });
        });
    }
}

module.exports = {
    createFileBrickStorage: function (location) {
        return new FileBrickStorage(location);
    }
};
}).call(this,require("buffer").Buffer)

},{"./FileBarMap":"/opt/privatesky/modules/bar/lib/FileBarMap.js","buffer":false,"fs":false}],"/opt/privatesky/modules/bar/lib/FolderBarMap.js":[function(require,module,exports){
(function (Buffer){
const Brick = require("./Brick");

function FolderBarMap(header){
    header = header || {};
    //header este un map in care vom retine datele intr-un format json
    //vom avea key-ul care va fi filename-ul, si datele care va fi lista de hash-uri
    this.add = function (filePath, brick) {
        //hashList-ul va fi direct lista de hash-uri, pentru ca o putem face pe masura
        //ce ne ocupam de salvarea brick-urilor
        if (typeof header[filePath] === "undefined") {
            header[filePath] = [];
        }

        header[filePath].push(brick.getHash());
    };

    this.getHashList = function (filePath) {
        //avem nevoie de hash-uri ca sa putem obtine brick-urile unui fisier
        //un hash este de fapt denumirea unui brick
        //aceasta functie returneaza lista de hash-uri
        return header[filePath];
    };

    this.emptyList = function (filePath) {
        header[filePath] = [];
    };

    this.toBrick = function () {
        return new Brick(Buffer.from(JSON.stringify(header)));
    };

    this.getFileList = function () {
        return Object.keys(header);
    };

}

module.exports = FolderBarMap;
}).call(this,require("buffer").Buffer)

},{"./Brick":"/opt/privatesky/modules/bar/lib/Brick.js","buffer":false}],"/opt/privatesky/modules/bar/lib/FolderBrickStorage.js":[function(require,module,exports){
const fs = require("fs");
const path = require("path");
const BarMap = require("./FolderBarMap");
const Brick = require("./Brick");

function FolderBrickStorage(location) {

    this.putBrick = function (brick, callback) {
        const writeStream = fs.createWriteStream(path.join(location, brick.getHash()));
        writeStream.write(brick.getData(), callback);
        //aceasta functie va primi un brick
        //si va apela o fucntie din BarWorker ce se va ocupa de scrierea datelor in fisier
    };

    this.getBrick = function (brickHash, callback) {
        fs.readFile(path.join(location, brickHash), (err, brickData) => {
            callback(err, new Brick(brickData));
        });
    };

    this.deleteBrick = function (brickHash, callback) {
        fs.unlink(path.join(location, brickHash), callback);
    };

    this.putBarMap = function (barMap, callback) {
        const barMapBrick = barMap.toBrick();
        this.putBrick(barMapBrick, (err) => {
            if (err)
                return callback(err);
            callback(undefined, barMapBrick.getHash());
        });
    };

    this.getBarMap = function (mapDigest, callback) {
        if (typeof mapDigest === "function") {
            callback = mapDigest;
            mapDigest = undefined;
        }

        if (typeof mapDigest === "undefined") {
            return callback(undefined, new BarMap());
        }

        this.getBrick(mapDigest, (err, mapBrick) => {
            callback(err, new BarMap(JSON.parse(mapBrick.getData().toString())));
        });
    }
    //aceasta functie va primi id-ul unui brick
    //va cauta fisierul caruia ii corespunde id-ul
    //il va citi tot prin intermediul BarWorker, printr-o functie
    //il va trimite in callback, unde va fi mai departe, salvat
    //partea de citire va fi facuta prin intermediul functiei 'readFromFile' din BarWorker
}

module.exports = {
    createFolderBrickStorage: function (location) {
        return new FolderBrickStorage(location);
    }
};
},{"./Brick":"/opt/privatesky/modules/bar/lib/Brick.js","./FolderBarMap":"/opt/privatesky/modules/bar/lib/FolderBarMap.js","fs":false,"path":false}],"/opt/privatesky/modules/bar/lib/FsBarWorker.js":[function(require,module,exports){
(function (Buffer){
const fs = require('fs');
const path = require('path');
const AsyncDisptacher = require("../utils/AsyncDispatcher");

function PathAsyncIterator(inputPath) {
    let removablePathLen;
    const fileList = [];
    const folderList = [];
    let isFirstCall = true;
    let pathIsFolder;

    this.next = function (callback) {
        if (isFirstCall === true) {
            isDir(inputPath, (err, status) => {
                if (err) {
                    return callback(err);
                }

                isFirstCall = false;
                pathIsFolder = status;
                if (status === true) {
                    const splitInputPath = inputPath.split(path.sep);
                    splitInputPath.pop();
                    removablePathLen = splitInputPath.join(path.sep).length;
                    folderList.push(inputPath);
                    getNextFileFromFolder(callback);
                } else {
                    removablePathLen = path.dirname(inputPath).length;
                    const fileName = inputPath.substring(removablePathLen);

                    callback(undefined, fileName);
                }
            });
        }else if(pathIsFolder){
            getNextFileFromFolder(callback);
        }else {
            callback();
        }
    };

    //-----------------------------------------Internal methods-------------------------------------------------------
    function walkFolder(folderPath, callback) {
        const asyncDispatcher = new AsyncDisptacher((errors, results) => {
            if (fileList.length > 0) {
                const fileName = fileList.shift();
                return callback(undefined, fileName);
            }

            if (folderList.length > 0) {
                const folderName = folderList.shift();
                return walkFolder(folderName, callback);
            }

            return callback();
        });

        fs.readdir(folderPath, (err, files) => {
            if (err) {
                return callback(err);
            }

            if (files.length === 0 && folderList.length === 0) {
                return callback();
            }

            if (files.length === 0) {
                walkFolder(folderList.shift(), callback);
            }
            asyncDispatcher.dispatchEmpty(files.length);

            files.forEach(file => {
                let filePath = path.join(folderPath, file);
                isDir(filePath, (err, status) => {
                    if (err) {
                        return callback(err);
                    }

                    if (status) {
                        folderList.push(filePath);
                    } else {
                        fileList.push(filePath.substring(removablePathLen));
                    }

                    asyncDispatcher.markOneAsFinished();
                });
            });
        });
    }

    function isDir(filePath, callback) {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return callback(err);
            }

            return callback(undefined, stats.isDirectory());
        });
    }

    function getNextFileFromFolder(callback) {
        if (fileList.length === 0 && folderList.length === 0) {
            return callback();
        }

        if (fileList.length > 0) {
            const fileName = fileList.shift();
            return callback(undefined, fileName);
        }


        walkFolder(folderList.shift(), (err, file) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, file);
        });
    }
}

function FsBarWorker() {

    let pathAsyncIterator;

    this.getFileSize = function (filePath, callback) {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, stats.size);
        });
    };

    //readBlockFromFile
    this.readBlockFromFile = function (filePath, blockIndex, bufferSize, callback) {
        fs.open(filePath, 'r+', function (err, fd) {
            if (err) {
                return callback(err);
            }

            let buffer = Buffer.alloc(bufferSize);
            fs.read(fd, buffer, 0, bufferSize, bufferSize * blockIndex, (err, bytesRead, buffer) => {
                if (err) {
                    return callback(err);
                }

                fs.close(fd, (err) => {
                    callback(err, buffer.slice(0, bytesRead));
                });
            });
        });
    };

    this.getNextFile = function (inputPath, callback) {
        pathAsyncIterator = pathAsyncIterator || new PathAsyncIterator(inputPath);
        pathAsyncIterator.next(callback);
    };

    //appendToFile
    this.appendBlockToFile = function (filePath, data, callback) {
        const pth = constructPath(filePath);

        fs.mkdir(pth, {recursive: true}, (err) => {
            if (err && err.code !== "EEXIST") {
                return callback(err);
            }

            fs.appendFile(filePath, data, callback);
        });
    };

    // this.getReadStream = function(filePath,bufferSize){
    //     return fs.createReadStream(filePath,{highWaterMark:bufferSize});
    // }

    // this.getWriteStream = function(filePath){
    //     return fs.createWriteStream(filePath);
    // }
    //-------------------------------------------- Internal methods ----------------------------------------------------

    function constructPath(filePath) {
        let slices = filePath.split(path.sep);
        slices.pop();
        return slices.join(path.sep);
    }

}

module.exports = {
    createFsBarWorker: function () {
        return new FsBarWorker();
    }
};
}).call(this,require("buffer").Buffer)

},{"../utils/AsyncDispatcher":"/opt/privatesky/modules/bar/utils/AsyncDispatcher.js","buffer":false,"fs":false,"path":false}],"/opt/privatesky/modules/bar/utils/AsyncDispatcher.js":[function(require,module,exports){

function AsyncDispatcher(finalCallback) {
	let results = [];
	let errors = [];

	let started = 0;

	function markOneAsFinished(err, res) {
		if(err) {
			errors.push(err);
		}

		if(arguments.length > 2) {
			arguments[0] = undefined;
			res = arguments;
		}

		if(typeof res !== "undefined") {
			results.push(res);
		}

		if(--started <= 0) {
            return callCallback();
		}
	}

	function dispatchEmpty(amount = 1) {
		started += amount;
	}

	function callCallback() {
	    if(errors && errors.length === 0) {
	        errors = undefined;
        }

	    if(results && results.length === 0) {
	        results = undefined;
        }

        finalCallback(errors, results);
    }

	return {
		dispatchEmpty,
		markOneAsFinished
	};
}

module.exports = AsyncDispatcher;
},{}],"/opt/privatesky/modules/bar/utils/isStream.js":[function(require,module,exports){
function isStream(stream){
    return stream !== null && typeof stream === 'object' && typeof stream.pipe === 'function';
}

function isWritable(stream) {
    return isStream(stream) &&
        stream.writable !== false &&
        typeof stream._write === 'function' &&
        typeof stream._writableState === 'object';

}

function isReadable(stream) {
    return isStream(stream) &&
        stream.readable !== false &&
        typeof stream._read === 'function' &&
        typeof stream._readableState === 'object';
}

function isDuplex(stream){
    return isWritable(stream) &&
        isReadable(stream);
}

module.exports = {
    isStream,
    isReadable,
    isWritable,
    isDuplex
};

},{}],"/opt/privatesky/modules/csb/flows/addBackup.js":[function(require,module,exports){
const flowsUtils = require("../utils/flowsUtils");
const validator = require("../utils/validator");
const DseedCage = require("../utils/DseedCage");
const fs = require('fs');
const path = require('path');

$$.swarm.describe("addBackup", {
    start: function (backupUrl, localFolder = process.cwd()) {
        if(!backupUrl){
            return this.swarm("interaction", "handleError", new Error("No backup url provided"));
        }

        this.localFolder = localFolder;
        this.backupUrl = backupUrl;
        fs.stat(path.join(this.localFolder, ".privateSky", 'dseed'), (err, stats)=>{
            if(err){
                this.swarm("interaction", "createPin", flowsUtils.defaultPin, flowsUtils.noTries);
            }else{
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    validatePin: function (pin) {
        validator.validatePin(this.localFolder, this, "addBackup", pin, flowsUtils.noTries);
    },
    
    addBackup: function (pin = flowsUtils.defaultPin, backups) {
        backups = backups || [];
        backups.push(this.backupUrl);
        const dseedCage = new DseedCage(this.localFolder);
        dseedCage.saveDseedBackups(pin, this.csbIdentifier, backups, validator.reportOrContinue(this, 'finish', "Failed to save backups"));
    },

    finish: function () {
        this.swarm("interaction", 'printInfo', this.backupUrl + ' has been successfully added to backups list.');
    }
});
},{"../utils/DseedCage":"/opt/privatesky/modules/csb/utils/DseedCage.js","../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js","fs":false,"path":false}],"/opt/privatesky/modules/csb/flows/addCsb.js":[function(require,module,exports){
// var path = require("path");

const utils = require("./../utils/flowsUtils");
// const crypto = require("pskcrypto");
// var fs = require("fs");

$$.swarm.describe("addCsb", {
	start: function (aliasCsb, aliasDestCsb) {
		this.aliasCsb = aliasCsb;
		this.aliasDestCsb = aliasDestCsb;
		this.swarm("interaction", "readPin", 3);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.addCsb(pin, self.aliasCsb);
			}
		});
	},
	addCsb: function (pin, aliasCSb, aliasDestCsb, callback) {
		var self = this;
		utils.getCsb(pin, aliasCSb, function (err, parentCsb) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to get csb");
			}
		});
	}
});
},{"./../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js"}],"/opt/privatesky/modules/csb/flows/attachFile.js":[function(require,module,exports){
const flowsUtils = require("./../utils/flowsUtils");
const utils = require("./../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const path = require('path');
const validator = require("../utils/validator");
const CSBIdentifier = require("../lib/CSBIdentifier");
const HashCage = require('../utils/HashCage');
const RootCSB = require("../lib/RootCSB");

$$.swarm.describe("attachFile", { //url: CSB1/CSB2/aliasFile
    start: function (url, filePath, localFolder = process.cwd()) { //csb1:assetType:alias
        const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
        this.CSBPath = CSBPath;
        this.alias = alias;
        this.filePath = filePath;
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", flowsUtils.noTries);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, 'loadFileReference', pin, noTries);
    },

    withCSBIdentifier: function (id, url, filePath, localFolder = process.cwd()) {
        const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
        this.CSBPath = CSBPath;
        this.alias = alias;
        this.filePath = filePath;
        this.localFolder = localFolder;
        this.csbIdentifier = new CSBIdentifier(id);
        RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, (err, rootCSB) => {
            if (err) {
                this.swarm("interaction", "handleError", err, "Failed to load rootCSB");
                return;
            }

            this.rootCSB = rootCSB;
            this.loadFileReference();

        });
    },

    loadFileReference: function () {
        this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, 'loadAsset', 'Failed to load masterCSB.'));
    },

    loadAsset: function () {
        this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, 'saveFileToDisk', 'Failed to load asset'));
    },

    saveFileToDisk: function (fileReference) {
        if (fileReference.isPersisted()) {
            this.swarm("interaction", "handleError", new Error("File is persisted"), "A file with the same alias already exists ");
            return;
        }

        const csbIdentifier = new CSBIdentifier(undefined, this.csbIdentifier.getBackupUrls());
        this.fileID = utils.generatePath(this.localFolder, csbIdentifier);
        crypto.on('progress', (progress) => {
            this.swarm('interaction', 'reportProgress', progress);
        });
        crypto.encryptStream(this.filePath, this.fileID, csbIdentifier.getDseed(), validator.reportOrContinue(this, 'saveFileReference', "Failed at file encryption.", fileReference, csbIdentifier));

    },


    saveFileReference: function (fileReference, csbIdentifier) {
        crypto.removeAllListeners('progress');
        fileReference.init(this.alias, csbIdentifier.getSeed(), csbIdentifier.getDseed());
        this.rootCSB.saveAssetToPath(this.CSBPath, fileReference, validator.reportOrContinue(this, 'computeHash', "Failed to save file", this.fileID));
    },


    computeHash: function () {
        const fileStream = fs.createReadStream(this.fileID);
        crypto.pskHashStream(fileStream, validator.reportOrContinue(this, "loadHashObj", "Failed to compute hash"));
    },

    loadHashObj: function (digest) {
        this.hashCage = new HashCage(this.localFolder);
        this.hashCage.loadHash(validator.reportOrContinue(this, "addToHashObj", "Failed to load hashObj", digest));
    },

    addToHashObj: function (hashObj, digest) {
        hashObj[path.basename(this.fileID)] = digest.toString("hex");
        this.hashCage.saveHash(hashObj, validator.reportOrContinue(this, "printSuccess", "Failed to save hashObj"));
    },

    printSuccess: function () {
        this.swarm("interaction", "printInfo", this.filePath + " has been successfully added to " + this.CSBPath);
        this.swarm("interaction", "__return__");
    }
});

},{"../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","../utils/HashCage":"/opt/privatesky/modules/csb/utils/HashCage.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js","./../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js","./../utils/utils":"/opt/privatesky/modules/csb/utils/utils.js","fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/csb/flows/createCsb.js":[function(require,module,exports){
const flowsUtils = require('../utils/flowsUtils');
const RootCSB = require("../lib/RootCSB");
const RawCSB = require("../lib/RawCSB");
const validator = require("../utils/validator");
const DseedCage = require("../utils/DseedCage");
const CSBIdentifier = require("../lib/CSBIdentifier");

$$.swarm.describe("createCsb", {
    start: function (CSBPath, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath || '';
        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.swarm("interaction", "createPin", flowsUtils.defaultPin);
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    withoutPin: function (CSBPath, backups, localFolder = process.cwd(), seed, isMaster = false) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath;
        this.isMaster = isMaster;
        if (typeof backups === 'undefined' || backups.length === 0) {
            backups = [ flowsUtils.defaultBackup ];
        }

        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.createMasterCSB(backups);
            } else {
                const csbIdentifier = new CSBIdentifier(seed);
                this.withCSBIdentifier(CSBPath, csbIdentifier);
            }
        });

    },

    withCSBIdentifier: function (CSBPath, csbIdentifier) {
        this.CSBPath = CSBPath;
        RootCSB.loadWithIdentifier(this.localFolder, csbIdentifier, validator.reportOrContinue(this, 'createCSB', 'Failed to load master with provided dseed'));
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "createCSB", pin, noTries);
    },

    loadBackups: function (pin) {
        this.pin = pin;
        this.dseedCage = new DseedCage(this.localFolder);
        this.dseedCage.loadDseedBackups(this.pin, (err, csbIdentifier, backups) => {
            if (err) {
                this.createMasterCSB();
            } else {
                this.createMasterCSB(backups);
            }
        });
    },

    createMasterCSB: function (backups) {
        this.csbIdentifier = new CSBIdentifier(undefined, backups || flowsUtils.defaultBackup);

        this.swarm("interaction", "printSensitiveInfo", this.csbIdentifier.getSeed(), flowsUtils.defaultPin);

        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset('global.CSBMeta', 'meta');
        meta.init();
        meta.setIsMaster(true);
        if (typeof this.isMaster !== 'undefined') {
            meta.setIsMaster(this.isMaster);
        }
        rawCSB.saveAsset(meta);
        this.rootCSB = RootCSB.createNew(this.localFolder, this.csbIdentifier, rawCSB);
        const nextPhase = (this.CSBPath === '' || typeof this.CSBPath === 'undefined') ? 'saveRawCSB' : 'createCSB';
        if (this.pin) {
            this.dseedCage.saveDseedBackups(this.pin, this.csbIdentifier, backups, validator.reportOrContinue(this, nextPhase, "Failed to save dseed "));
        } else {
            this[nextPhase]();
        }
    },

    createCSB: function (rootCSB) {
        this.rootCSB = this.rootCSB || rootCSB;
        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset("global.CSBMeta", "meta");
        meta.init();
        meta.setIsMaster(false);
        rawCSB.saveAsset(meta);
        this.saveRawCSB(rawCSB);
    },

    saveRawCSB: function (rawCSB) {
        this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccess", "Failed to save raw CSB"));

    },


    printSuccess: function () {
        let message = "Successfully saved CSB at path " + this.CSBPath;
        if (!this.CSBPath || this.CSBPath === '') {
            message = 'Successfully saved CSB root';
        }
        this.swarm("interaction", "printInfo", message);
        this.swarm('interaction', '__return__');
    }
});

},{"../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../lib/RawCSB":"/opt/privatesky/modules/csb/lib/RawCSB.js","../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","../utils/DseedCage":"/opt/privatesky/modules/csb/utils/DseedCage.js","../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js"}],"/opt/privatesky/modules/csb/flows/extractFile.js":[function(require,module,exports){
const flowsUtils = require("./../utils/flowsUtils");
const utils = require("./../utils/utils");
const crypto = require("pskcrypto");
const validator = require("../utils/validator");
const CSBIdentifier = require("../lib/CSBIdentifier");

$$.swarm.describe("extractFile", {
	start: function (url, localFolder = process.cwd()) {
		this.localFolder = localFolder;
		const {CSBPath, alias} = utils.processUrl(url, 'global.FileReference');
		this.CSBPath = CSBPath;
		this.alias = alias;
		this.swarm("interaction", "readPin", flowsUtils.noTries);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(this.localFolder, this, "loadFileAsset", pin, noTries);
	},

	loadFileAsset: function () {
		this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, "decryptFile", "Failed to load file asset " + this.alias));
	},
	
	decryptFile: function (fileReference) {
		const csbIdentifier = new CSBIdentifier(fileReference.dseed);
		const filePath = utils.generatePath(this.localFolder, csbIdentifier);

		crypto.on('progress', (progress) => {
            this.swarm('interaction', 'reportProgress', progress);
        });

		crypto.decryptStream(filePath, this.localFolder, csbIdentifier.getDseed(), (err, fileNames) => {
			if(err){
				return this.swarm("interaction", "handleError", err, "Failed to decrypt file" + filePath);
			}

			this.swarm("interaction", "printInfo", this.alias + " was successfully extracted. ");
			this.swarm("interaction", "__return__", fileNames);
		});
	}
});
},{"../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js","./../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js","./../utils/utils":"/opt/privatesky/modules/csb/utils/utils.js","pskcrypto":false}],"/opt/privatesky/modules/csb/flows/index.js":[function(require,module,exports){
require("callflow");

module.exports = $$.library(function () {
    require('./addCsb');
    require('./addBackup');
    require('./attachFile');
    require('./createCsb');
    require('./extractFile');
    require('./listCSBs');
    require('./resetPin');
    require('./restore');
    require('./receive');
	require('./saveBackup');
    require('./setPin');
});



},{"./addBackup":"/opt/privatesky/modules/csb/flows/addBackup.js","./addCsb":"/opt/privatesky/modules/csb/flows/addCsb.js","./attachFile":"/opt/privatesky/modules/csb/flows/attachFile.js","./createCsb":"/opt/privatesky/modules/csb/flows/createCsb.js","./extractFile":"/opt/privatesky/modules/csb/flows/extractFile.js","./listCSBs":"/opt/privatesky/modules/csb/flows/listCSBs.js","./receive":"/opt/privatesky/modules/csb/flows/receive.js","./resetPin":"/opt/privatesky/modules/csb/flows/resetPin.js","./restore":"/opt/privatesky/modules/csb/flows/restore.js","./saveBackup":"/opt/privatesky/modules/csb/flows/saveBackup.js","./setPin":"/opt/privatesky/modules/csb/flows/setPin.js","callflow":false}],"/opt/privatesky/modules/csb/flows/listCSBs.js":[function(require,module,exports){
const flowsUtils = require("./../utils/flowsUtils");
const validator = require("../utils/validator");
// const fs = require("fs");
const RootCSB = require("../lib/RootCSB");
const CSBIdentifier = require("../lib/CSBIdentifier");

$$.swarm.describe("listCSBs", {
    start: function (CSBPath, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath || '';
        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.swarm("interaction", "noMasterCSBExists");
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    withCSBIdentifier: function (id, CSBPath = '', localFolder = process.cwd()) {
        this.csbIdentifier = new CSBIdentifier(id);
        this.CSBPath = CSBPath;
        this.localFolder = localFolder;
        this.loadMasterRawCSB();
    },

    loadMasterRawCSB: function () {
        RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, validator.reportOrContinue(this, "loadRawCSB", "Failed to create RootCSB."));
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, 'loadRawCSB', pin, noTries);
    },

    loadRawCSB: function (rootCSB) {
        if(typeof this.rootCSB === "undefined" && rootCSB){
            this.rootCSB = rootCSB;
        }
        this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, 'getCSBs', 'Failed to load rawCSB'));
    },

    getCSBs: function (rawCSB) {
        const csbReferences = rawCSB.getAllAssets('global.CSBReference');
        const csbsAliases = csbReferences.map((ref) => ref.alias);

        const fileReferences = rawCSB.getAllAssets('global.FileReference');
        const filesAliases = fileReferences.map((ref) => ref.alias);

        this.swarm("interaction", "__return__", {
            csbs: csbsAliases,
            files: filesAliases
        });
    }

});

},{"../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js","./../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js"}],"/opt/privatesky/modules/csb/flows/receive.js":[function(require,module,exports){

$$.swarm.describe("receive", {
    start: function (endpoint, channel) {

        const alias = 'remote';
        $$.remote.createRequestManager(1000);
        $$.remote.newEndPoint(alias, endpoint, channel);
        $$.remote[alias].on('*', '*', (err, swarm) => {
            if (err) {
                return this.swarm('interaction', 'handleError', err, 'Failed to get data from channel' + channel);
            }
            const seed = swarm.meta.args[0];
            this.swarm("interaction", "printSensitiveInfo", seed);

            $$.remote[alias].off("*", "*");
        });

    }
});
},{}],"/opt/privatesky/modules/csb/flows/resetPin.js":[function(require,module,exports){
const utils = require("./../utils/flowsUtils");
const RootCSB = require("../lib/RootCSB");
const DseedCage = require("../utils/DseedCage");
const CSBIdentifier = require("../lib/CSBIdentifier");

$$.swarm.describe("resetPin", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readSeed", utils.noTries);
    },

    validateSeed: function (seed, noTries) {
        try{
            this.csbIdentifier = new CSBIdentifier(seed);
            RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, (err, rootCSB) => {
                if (err) {
                    this.swarm("interaction", "readSeed", noTries - 1);
                }else{
                    this.swarm("interaction", "insertPin", utils.noTries);
                }
            });
        } catch (e) {
            return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
        }
    },

    actualizePin: function (pin) {
        const dseedCage = new DseedCage(this.localFolder);
        dseedCage.saveDseedBackups(pin, this.csbIdentifier, undefined, (err)=>{
            if(err){
                return this.swarm("interaction", "handleError", "Failed to save dseed.");
            }

            this.swarm("interaction", "printInfo", "The pin has been changed successfully.");
        });
    }
});

},{"../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","../utils/DseedCage":"/opt/privatesky/modules/csb/utils/DseedCage.js","./../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js"}],"/opt/privatesky/modules/csb/flows/restore.js":[function(require,module,exports){
const path = require("path");
const flowsUtils = require("./../utils/flowsUtils");
const utils = require("./../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const validator = require("../utils/validator");
const DseedCage = require("../utils/DseedCage");
const RootCSB = require('../lib/RootCSB');
const CSBIdentifier = require('../lib/CSBIdentifier');
const BackupEngine = require('../lib/BackupEngine');
const HashCage = require('../utils/HashCage');
const AsyncDispatcher = require('../utils/AsyncDispatcher');


$$.swarm.describe("restore", {
    start: function (url, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        if (url) {
            const {CSBPath, alias} = utils.processUrl(url, 'global.CSBReference');
            this.CSBPath = CSBPath;
            this.CSBAlias = alias;
        }

        this.swarm("interaction", "readSeed");
    },

    withSeed: function (url, localFolder = process.cwd(), seedRestore, localSeed) {
        this.localFolder = localFolder;
        if (url) {
            const {CSBPath, alias} = utils.processUrl(url, 'global.CSBReference');
            this.CSBPath = CSBPath;
            this.CSBAlias = alias;
        }

        if (localSeed) {
            this.localCSBIdentifier = new CSBIdentifier(localSeed);
        }

        this.restoreCSB(seedRestore);
    },

    restoreCSB: function (restoreSeed) {
        this.hashCage = new HashCage(this.localFolder);
        this.hashObj = {};
        this.csbRestoreIdentifier = new CSBIdentifier(restoreSeed);
        let backupUrls;
        try {
            backupUrls = this.csbRestoreIdentifier.getBackupUrls();
        } catch (e) {
            return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
        }

        this.backupUrls = backupUrls;
        this.restoreDseedCage = new DseedCage(this.localFolder);
        const backupEngine = new BackupEngine.getBackupEngine(this.backupUrls);

        backupEngine.load(this.csbRestoreIdentifier, (err, encryptedCSB) => {
            if (err) {
                return this.swarm("interaction", "handleError", err, "Failed to restore CSB");
            }

            this.__addCSBHash(this.csbRestoreIdentifier, encryptedCSB);
            this.encryptedCSB = encryptedCSB;

            validator.checkMasterCSBExists(this.localFolder, (err, status) => {
                if (err) {
                    console.log(err);
                }
                if (status === false) {
                    this.createAuxFolder();
                } else if (this.localCSBIdentifier) {
                    if (!this.CSBAlias) {
                        utils.deleteRecursively(this.localFolder, true, (err) => {
                            if (err) {
                                console.log(err);
                            }
                            return this.swarm("interaction", "handleError", new Error("No CSB alias was specified"));
                        });
                    } else {
                        this.writeCSB();
                    }
                } else {
                    if (!this.CSBAlias) {
                        return this.swarm("interaction", "handleError", new Error("No CSB alias was specified"));
                    } else {
                        this.swarm("interaction", "readPin", flowsUtils.noTries);
                    }
                }
            });
        });
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "writeCSB", pin, noTries);
    },

    createAuxFolder: function () {
        fs.mkdir(path.join(this.localFolder, ".privateSky"), {recursive: true}, validator.reportOrContinue(this, "writeCSB", "Failed to create folder .privateSky"));
    },


    writeCSB: function () {
        fs.writeFile(utils.generatePath(this.localFolder, this.csbRestoreIdentifier), this.encryptedCSB, validator.reportOrContinue(this, "createRootCSB", "Failed to write masterCSB to disk"));
    },

    createRootCSB: function () {
        RootCSB.loadWithIdentifier(this.localFolder, this.csbRestoreIdentifier, validator.reportOrContinue(this, "loadRawCSB", "Failed to create rootCSB with dseed"));
    },

    loadRawCSB: function (rootCSB) {

        this.asyncDispatcher = new AsyncDispatcher(( errs, succs) => {
            this.hashCage.saveHash(this.hashObj, (err) => {
                if (err) {
                    return this.swarm('interaction', 'handleError', err, 'Failed to save hashObj');
                }
                this.swarm('interaction', 'printInfo', 'All CSBs have been restored.');
                this.swarm('interaction', '__return__');

            });
        });
        rootCSB.loadRawCSB('', validator.reportOrContinue(this, "checkCSBStatus", "Failed to load RawCSB", rootCSB));
    },

    checkCSBStatus: function (rawCSB, rootCSB) {
        this.rawCSB = rawCSB;
        const meta = this.rawCSB.getAsset('global.CSBMeta', 'meta');
        if (this.rootCSB) {
            this.attachCSB(this.rootCSB, this.CSBPath, this.CSBAlias, this.csbRestoreIdentifier);
        } else {
            if (meta.isMaster) {
                this.rootCSB = rootCSB;
                this.saveDseed();
            } else {
                this.createMasterCSB();
            }
        }
    },

    saveDseed: function () {
        this.restoreDseedCage.saveDseedBackups(flowsUtils.defaultPin, this.csbRestoreIdentifier, undefined, validator.reportOrContinue(this, "collectFiles", "Failed to save dseed", this.rawCSB, this.csbRestoreIdentifier, '', 'master'));
    },


    createMasterCSB: function () {
        const csbIdentifier = new CSBIdentifier(undefined, this.backupUrls);
        this.swarm("interaction", "printSensitiveInfo", csbIdentifier.getSeed(), flowsUtils.defaultPin);
        this.rootCSB = RootCSB.createNew(this.localFolder, csbIdentifier);
        this.restoreDseedCage.saveDseedBackups(flowsUtils.defaultPin, csbIdentifier, undefined, validator.reportOrContinue(this, "attachCSB", "Failed to save master dseed ", this.rootCSB, this.CSBPath, this.CSBAlias, this.csbRestoreIdentifier));
    },


    attachCSB: function (rootCSB, CSBPath, CSBAlias, csbIdentifier) {
        this.__attachCSB(rootCSB, CSBPath, CSBAlias, csbIdentifier, validator.reportOrContinue(this, 'loadRestoredRawCSB', 'Failed to attach rawCSB'));

    },

    loadRestoredRawCSB: function () {
        this.CSBPath = this.CSBPath.split(':')[0] + '/' + this.CSBAlias;
        this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, "collectFiles", "Failed to load restored RawCSB", this.csbRestoreIdentifier, this.CSBPath, this.CSBAlias));
    },

    collectFiles: function (rawCSB, csbIdentifier, currentPath, alias, callback) {

        const listFiles = rawCSB.getAllAssets('global.FileReference');
        const asyncDispatcher = new AsyncDispatcher((errs, succs) => {
            this.collectCSBs(rawCSB, csbIdentifier, currentPath, alias);
            if (callback) {
                return callback(errs, succs);
            }
        });

        if (listFiles.length === 0) {
            asyncDispatcher.markOneAsFinished();
        }

        listFiles.forEach((fileReference) => {
            const csbIdentifier = new CSBIdentifier(fileReference.dseed);
            const fileAlias = fileReference.alias;
            const urls = csbIdentifier.getBackupUrls();
            const backupEngine = BackupEngine.getBackupEngine(urls);
            asyncDispatcher.dispatchEmpty();
            backupEngine.load(csbIdentifier, (err, encryptedFile) => {
                if (err) {
                    return this.swarm('interaction', 'handleError', err, 'Could not download file ' + fileAlias);
                }

                this.__addCSBHash(csbIdentifier, encryptedFile);

                fs.writeFile(utils.generatePath(this.localFolder, csbIdentifier), encryptedFile, (err) => {
                    if (err) {
                        return this.swarm('interaction', 'handleError', err, 'Could not save file ' + fileAlias);
                    }

                    asyncDispatcher.markOneAsFinished(undefined, fileAlias);
                });
            });
        });
    },

    collectCSBs: function (rawCSB, csbIdentifier, currentPath, alias) {

        const listCSBs = rawCSB.getAllAssets('global.CSBReference');
        const nextArguments = [];
        let counter = 0;

        if (listCSBs.length === 0) {
            this.asyncDispatcher.dispatchEmpty();
            this.asyncDispatcher.markOneAsFinished();
        }

        if (listCSBs && listCSBs.length > 0) {
            listCSBs.forEach((CSBReference) => {
                const nextPath = currentPath + '/' + CSBReference.alias;
                const nextCSBIdentifier = new CSBIdentifier(CSBReference.dseed);
                const nextAlias = CSBReference.alias;
                const nextURLs = csbIdentifier.getBackupUrls();
                const backupEngine = BackupEngine.getBackupEngine(nextURLs);
                this.asyncDispatcher.dispatchEmpty();
                backupEngine.load(nextCSBIdentifier, (err, encryptedCSB) => {
                    if (err) {
                        return this.swarm('interaction', 'handleError', err, 'Could not download CSB ' + nextAlias);
                    }

                    this.__addCSBHash(nextCSBIdentifier, encryptedCSB);

                    fs.writeFile(utils.generatePath(this.localFolder, nextCSBIdentifier), encryptedCSB, (err) => {
                        if (err) {
                            return this.swarm('interaction', 'handleError', err, 'Could not save CSB ' + nextAlias);
                        }

                        this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {

                            if (err) {
                                return this.swarm('interaction', 'handleError', err, 'Failed to load CSB ' + nextAlias);
                            }
                            nextArguments.push([ nextRawCSB, nextCSBIdentifier, nextPath, nextAlias ]);

                            if (++counter === listCSBs.length) {
                                nextArguments.forEach((args) => {
                                    this.collectFiles(...args, () => {
                                        this.asyncDispatcher.markOneAsFinished(undefined, alias);
                                    });
                                });
                            }
                        });
                    });
                });
            });
        }
    },

    __tryDownload(urls, csbIdentifier, index, callback) {
        if (index === urls.length) {
            return callback(new Error('Could not download resource'));
        }

        const url = urls[index];
        this.backupEngine.load(url, csbIdentifier, (err, resource) => {
            if (err) {
                return this.__tryDownload(urls, csbIdentifier, ++index, callback);
            }

            callback(undefined, resource);
        });

    },

    __addCSBHash: function (csbIdentifier, encryptedCSB) {
        const pskHash = new crypto.PskHash();
        pskHash.update(encryptedCSB);
        this.hashObj[csbIdentifier.getUid()] = pskHash.digest().toString('hex');

    },

    __attachCSB: function (rootCSB, CSBPath, CSBAlias, csbIdentifier, callback) {
        if (!CSBAlias) {
            return callback(new Error("No CSB alias was specified"));
        }

        rootCSB.loadRawCSB(CSBPath, (err, rawCSB) => {
            if (err) {
                rootCSB.loadAssetFromPath(CSBPath, (err, csbRef) => {
                    if (err) {
                        return callback(err);
                    }

                    csbRef.init(CSBAlias, csbIdentifier.getSeed(), csbIdentifier.getDseed());
                    rootCSB.saveAssetToPath(CSBPath, csbRef, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        callback();
                    });

                });
            } else {
                return callback(new Error(`A CSB having the alias ${CSBAlias} already exists.`));
            }
        });
    }
});


},{"../lib/BackupEngine":"/opt/privatesky/modules/csb/lib/BackupEngine.js","../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","../utils/AsyncDispatcher":"/opt/privatesky/modules/csb/utils/AsyncDispatcher.js","../utils/DseedCage":"/opt/privatesky/modules/csb/utils/DseedCage.js","../utils/HashCage":"/opt/privatesky/modules/csb/utils/HashCage.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js","./../utils/flowsUtils":"/opt/privatesky/modules/csb/utils/flowsUtils.js","./../utils/utils":"/opt/privatesky/modules/csb/utils/utils.js","fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/csb/flows/saveBackup.js":[function(require,module,exports){
const utils = require("./../utils/utils");
const fs = require("fs");
const validator = require("../utils/validator");
const HashCage = require('../utils/HashCage');
const AsyncDispatcher = require("../utils/AsyncDispatcher");
const RootCSB = require('../lib/RootCSB');
const CSBIdentifier = require('../lib/CSBIdentifier');
const BackupEngine = require('../lib/BackupEngine');
const path = require('path');


$$.swarm.describe("saveBackup", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", 3);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "loadHashFile", pin, noTries);
    },

    withCSBIdentifier: function (id, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.csbIdentifier = new CSBIdentifier(id);
        RootCSB.loadWithIdentifier(localFolder, this.csbIdentifier, (err, rootCSB) => {
            if (err) {
                this.swarm('interaction', 'handleError', err, 'Failed to load root CSB');
                return;
            }

            this.rootCSB = rootCSB;
            this.loadHashFile();
        });
    },

    loadHashFile: function (pin, backups) {
        this.backups = backups;
        this.hashCage = new HashCage(this.localFolder);
        this.hashCage.loadHash(validator.reportOrContinue(this, 'readEncryptedMaster', 'Failed to load hash file'));
    },

    readEncryptedMaster: function (hashFile) {
        this.hashFile = hashFile;
        this.masterID = utils.generatePath(this.localFolder, this.csbIdentifier);
        fs.readFile(this.masterID, validator.reportOrContinue(this, 'loadMasterRawCSB', 'Failed to read masterCSB.'));
    },


    loadMasterRawCSB: function () {
        this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, "dispatcher", "Failed to load masterCSB"));
    },

    dispatcher: function (rawCSB) {
        this.asyncDispatcher = new AsyncDispatcher((errors, results) => {
            if (errors) {
                this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect all CSBs');
                return;
            }
            this.collectFiles(results);
        });

        this.asyncDispatcher.dispatchEmpty();
        this.collectCSBs(rawCSB, this.csbIdentifier, '', 'master');
    },

    collectCSBs: function (rawCSB, csbIdentifier, currentPath, alias) {
        const listCSBs = rawCSB.getAllAssets('global.CSBReference');

        const nextArguments = [];
        let counter = 0;

        listCSBs.forEach((CSBReference) => {
            const nextPath = currentPath + '/' + CSBReference.alias;
            const nextCSBIdentifier = new CSBIdentifier(CSBReference.dseed);
            const nextAlias = CSBReference.alias;
            this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {
                if (err) {
                    console.log(err);
                }
                nextArguments.push([ nextRawCSB, nextCSBIdentifier, nextPath, nextAlias ]);
                if (++counter === listCSBs.length) {
                    nextArguments.forEach((args) => {
                        this.asyncDispatcher.dispatchEmpty();
                        this.collectCSBs(...args);
                    });
                    this.asyncDispatcher.markOneAsFinished(undefined, {rawCSB, csbIdentifier, alias});
                }
            });
        });

        if (listCSBs.length === 0) {
            this.asyncDispatcher.markOneAsFinished(undefined, {rawCSB, csbIdentifier, alias});
        }
    },

    collectFiles: function (collectedCSBs) {
        this.asyncDispatcher = new AsyncDispatcher((errors, newResults) => {
            if (errors) {
                this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect files attached to CSBs');
            }

            if (!newResults) {
                newResults = [];
            }
            this.__categorize(collectedCSBs.concat(newResults));
        });

        this.asyncDispatcher.dispatchEmpty(collectedCSBs.length);
        collectedCSBs.forEach(({rawCSB, csbIdentifier, alias}) => {
            this.__collectFiles(rawCSB, alias);
        });

    },

    __categorize: function (files) {
        const categories = {};
        let backups;
        files.forEach(({csbIdentifier, alias}) => {
            if (!this.backups || this.backups.length === 0) {
                backups = csbIdentifier.getBackupUrls();
            } else {
                backups = this.backups;
            }
            const uid = csbIdentifier.getUid();
            categories[uid] = {backups, alias};
        });

        this.asyncDispatcher = new AsyncDispatcher((errors, successes) => {
            this.swarm('interaction', 'csbBackupReport', {errors, successes});
        });

        this.backupEngine = BackupEngine.getBackupEngine(backups);
        this.filterFiles(categories);
        // Object.entries(categories).forEach(([uid, {alias, backups}]) => {
        //     this.filterFiles(uid, alias, backups);
        // });
    },

    filterFiles: function (filesBackups) {
        const filesToUpdate = {};
        Object.keys(this.hashFile).forEach((uid) => {
            if (filesBackups[uid]) {
                filesToUpdate[uid] = this.hashFile[uid];
            }
        });

        this.asyncDispatcher.dispatchEmpty();
        this.backupEngine.compareVersions(filesToUpdate, (err, modifiedFiles) => {
            if (err) {
                return this.swarm("interaction", "handleError", err, "Failed to retrieve list of modified files");
            }

            this.__backupFiles(JSON.parse(modifiedFiles), filesBackups);
        });
    },

    __backupFiles: function (files, filesBackups) {
        this.asyncDispatcher.dispatchEmpty(files.length);
        files.forEach((file) => {
            const fileStream = fs.createReadStream(path.join(this.localFolder, file));
            const backupUrls = filesBackups[file].backups;
            const backupEngine = BackupEngine.getBackupEngine(backupUrls);
            backupEngine.save(new CSBIdentifier(file), fileStream, (err, url) => {
                if (err) {
                    return  this.asyncDispatcher.markOneAsFinished({alias: filesBackups[file].alias, backupURL: url});
                }

                this.asyncDispatcher.markOneAsFinished(undefined, {alias: filesBackups[file].alias, backupURL: url});
            });
        });

        this.asyncDispatcher.markOneAsFinished(); // for http request to compareVersions
    },

    __collectFiles: function (rawCSB, csbAlias) {
        const files = rawCSB.getAllAssets('global.FileReference');
        this.asyncDispatcher.dispatchEmpty(files.length);
        files.forEach((FileReference) => {
            const alias = FileReference.alias;
            const csbIdentifier = new CSBIdentifier(FileReference.dseed);
            this.asyncDispatcher.markOneAsFinished(undefined, {csbIdentifier, alias});
        });
        this.asyncDispatcher.markOneAsFinished();
    }
});


},{"../lib/BackupEngine":"/opt/privatesky/modules/csb/lib/BackupEngine.js","../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","../utils/AsyncDispatcher":"/opt/privatesky/modules/csb/utils/AsyncDispatcher.js","../utils/HashCage":"/opt/privatesky/modules/csb/utils/HashCage.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js","./../utils/utils":"/opt/privatesky/modules/csb/utils/utils.js","fs":false,"path":false}],"/opt/privatesky/modules/csb/flows/setPin.js":[function(require,module,exports){
const validator = require("../utils/validator");
const DseedCage = require('../utils/DseedCage');

$$.swarm.describe("setPin", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", 3);
    },

    validatePin: function (oldPin, noTries) {
        this.oldPin = oldPin;
        validator.validatePin(this.localFolder, this, "interactionJumper", oldPin, noTries);
    },

    interactionJumper: function () {
        this.swarm("interaction", "enterNewPin");
    },

    actualizePin: function (newPin) {
        this.dseedCage = new DseedCage(this.localFolder);
        this.dseedCage.loadDseedBackups(this.oldPin, validator.reportOrContinue(this, "saveDseed", "Failed to load dseed.", newPin));
    },

    saveDseed: function (csbIdentifier, backups, pin) {
        this.dseedCage.saveDseedBackups(pin, csbIdentifier, backups, validator.reportOrContinue(this, "successState", "Failed to save dseed"));
    },

    successState: function () {
        this.swarm("interaction", "printInfo", "The pin has been successfully changed.");
    }
});
},{"../utils/DseedCage":"/opt/privatesky/modules/csb/utils/DseedCage.js","../utils/validator":"/opt/privatesky/modules/csb/utils/validator.js"}],"/opt/privatesky/modules/csb/lib/BackupEngine.js":[function(require,module,exports){
const AsyncDispatcher = require("../utils/AsyncDispatcher");
const EVFSResolver = require("./backupResolvers/EVFSResolver");
// const crypto = require("pskcrypto");

function BackupEngineBuilder() {
    const resolvers = {};
    this.addResolver = function (name, resolver) {
        resolvers[name] = resolver;
    };

    this.getBackupEngine = function(urls) {
        if (!urls || urls.length === 0) {
            throw new Error("No url was provided");
        }

        return new BackupEngine(urls, resolvers);
    };
}

function BackupEngine(urls, resolvers) {

    this.save = function (csbIdentifier, dataStream, callback) {
        const asyncDispatcher = new AsyncDispatcher(callback);
        asyncDispatcher.dispatchEmpty(urls.length);
        for (const url of urls) {
            resolverForUrl(url, (err, resolver) => {
                if(err){
                    return callback(err);
                }
                resolver.auth(url, undefined, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    resolver.save(url, csbIdentifier, dataStream, (err) => {
                        if (err) {
                            asyncDispatcher.markOneAsFinished(err);
                            return;
                        }
                        asyncDispatcher.markOneAsFinished(undefined, url);
                    });
                });
            });
        }
    };

    this.load = function (csbIdentifier, version, callback) {
        if (typeof version === "function") {
            callback = version;
            version = "";
        }

        tryDownload(csbIdentifier, version, 0, (err, resource) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, resource);
        });
    };

    this.getVersions = function (csbIdentifier, callback) {
        console.log("Empty function");
    };

    this.compareVersions = function (fileList, callback) {
        const url = urls[0];
        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return callback(err);
                }

                resolver.compareVersions(url, fileList, callback);
            });
        });
    };

    //------------------------------------------------ INTERNAL METHODS ------------------------------------------------

    function resolverForUrl(url, callback) {
        const keys = Object.keys(resolvers);
        let resolver;
        let i;

        for (i = 0; i < keys.length; ++i) {
            if (match(keys[i], url)) {
                resolver = resolvers[keys[i]];
                break;
            }
        }

        if (i === keys.length) {
            resolver = resolvers['evfs'];
            if (!resolver) {
                return callback(new Error(`No resolver matches the url ${url}`));
            }
        }

        callback(undefined, resolver);
    }

    function match(str1, str2) {
        return str1.includes(str2) || str2.includes(str1);
    }


    function tryDownload(csbIdentifier, version, index, callback) {
        if (index === urls.length) {
            return callback(new Error("Failed to download resource"));
        }

        const url = urls[index];
        resolverForUrl(url, (err, resolver) => {
            if (err) {
                return callback(err);
            }

            resolver.auth(url, undefined, (err) => {
                if (err) {
                    return tryDownload(csbIdentifier, version, ++index, callback);
                }

                resolver.load(url, csbIdentifier, version, (err, resource) =>{
                    if (err) {
                        return tryDownload(csbIdentifier, version, ++index, callback);
                    }

                    callback(undefined, resource);
                });
            });

        });
    }
}

const engineBuilder = new BackupEngineBuilder();

// engineBuilder.addResolver('dropbox', new DropboxResolver());
// engineBuilder.addResolver('drive', new DriveResolver());
engineBuilder.addResolver('evfs', new EVFSResolver());

module.exports = {
    getBackupEngine: function (urls) {
        return engineBuilder.getBackupEngine(urls);
    }
};

},{"../utils/AsyncDispatcher":"/opt/privatesky/modules/csb/utils/AsyncDispatcher.js","./backupResolvers/EVFSResolver":"/opt/privatesky/modules/csb/lib/backupResolvers/EVFSResolver.js"}],"/opt/privatesky/modules/csb/lib/CSBIdentifier.js":[function(require,module,exports){
(function (Buffer){
const crypto = require("pskcrypto");


function CSBIdentifier(id, domain, keyLen = 32) {
    let seed;
    let dseed;
    let uid;
    let encSeed;

    //TODO: eliminate unused var
    // let encDseed;

    init();

    this.getSeed = function () {
        if(!seed){
            throw new Error("Cannot return seed. Access is denied.");
        }

        return generateCompactForm(seed);
    };

    this.getDseed = function () {
        if(dseed){
            return generateCompactForm(dseed);
        }

        if(seed){
            dseed = deriveSeed(seed);
            return generateCompactForm(dseed);
        }

        throw new Error("Cannot return derived seed. Access is denied.");
    };

    this.getUid = function () {
        if(uid){
            return generateCompactForm(uid).toString();
        }

        if(dseed){
            uid = computeUid(dseed);
            return generateCompactForm(uid).toString();
        }

        if(seed){
            dseed = deriveSeed(seed);
            uid = computeUid(dseed);
            return generateCompactForm(uid).toString();
        }

        throw new Error("Cannot return uid");
    };

    this.getEncSeed = function (encryptionKey) {
        if(encSeed){
            return generateCompactForm(encSeed);
        }

        if(!seed){
            throw new Error("Cannot return encSeed. Access is denied");
        }

        if (!encryptionKey) {
            throw new Error("Cannot return encSeed. No encryption key was provided");
        }

        //TODO: encrypt seed using encryptionKey. Encryption algorithm remains to be chosen
    };



    this.getDomain = function () {
        if(seed){
            return seed.domain;
        }

        if(dseed){
            return dseed.domain;
        }

        throw new Error("Backup URLs could not be retrieved. Access is denied");
    };

    //------------------------------ internal methods ------------------------------
    function init() {
        if (!id) {
            if (!domain) {
                throw new Error("No domains provided.");
            }

            seed = create();
        }else{
            classifyId();
        }
    }

    function classifyId() {
        if (typeof id !== "string" && !Buffer.isBuffer(id) && !(typeof id === "object" && !Buffer.isBuffer(id))) {
            throw new Error(`Id must be a string or a buffer. The type provided was ${typeof id}`);
        }

        const expandedId = load(id);
        switch(expandedId.tag){
            case 's':
                seed = expandedId;
                break;
            case 'd':
                dseed = expandedId;
                break;
            case 'u':
                uid = expandedId;
                break;
            case 'es':
                encSeed = expandedId;
                break;
            case 'ed':
                encDseed = expandedId;
                break;
            default:
                throw new Error('Invalid tag');
        }
    }

    function create() {
        const localSeed = {};
        if (!Array.isArray(domain)) {
            domain = [ domain ];
        }

        localSeed.tag    = 's';
        localSeed.random = crypto.randomBytes(keyLen);
        localSeed.domain = domain;

        return localSeed;
    }

    function deriveSeed(seed) {
        let compactSeed = seed;

        if (typeof seed === 'object' && !Buffer.isBuffer(seed)) {
            compactSeed = generateCompactForm(seed);
        }

        if (Buffer.isBuffer(seed)) {
            compactSeed = seed.toString();
        }

        if (compactSeed[0] === 'd') {
            throw new Error('Tried to derive an already derived seed.');
        }

        const decodedCompactSeed = decodeURIComponent(compactSeed);
        const splitCompactSeed = decodedCompactSeed.substring(1).split('|');
        const strSeed = Buffer.from(splitCompactSeed[0], 'base64').toString('hex');
        const domain = Buffer.from(splitCompactSeed[1], 'base64').toString();
        const dseed = {};

        dseed.tag = 'd';
        dseed.random = crypto.deriveKey(strSeed, null, keyLen);
        dseed.domain = JSON.parse(domain);

        return dseed;
    }

    function computeUid(dseed){
        if(!dseed){
            throw new Error("Dseed was not provided");
        }

        if (typeof dseed === "object" && !Buffer.isBuffer(dseed)) {
            dseed = generateCompactForm(dseed);
        }

        const uid = {};
        uid.tag = 'u';
        uid.random = Buffer.from(crypto.generateSafeUid(dseed));

        return uid;
    }

    function generateCompactForm({tag, random, domain}) {
        let compactId = tag + random.toString('base64');
        if (domain) {
            compactId += '|' + Buffer.from(JSON.stringify(domain)).toString('base64');
        }
        return Buffer.from(encodeURIComponent(compactId));
    }

    // TODO: unused function!!!
    // function encrypt(id, encryptionKey) {
    //     if(arguments.length !== 2){
    //         throw new Error(`Wrong number of arguments. Expected: 2; provided ${arguments.length}`);
    //     }

    //     let tag;
    //     if (typeof id === "object" && !Buffer.isBuffer(id)) {
    //         tag = id.tag;
    //         id = generateCompactForm(id);
    //     }

    //     if (tag === 's') {
    //         //TODO encrypt seed
    //     }else if (tag === 'd') {
    //         //TODO encrypt dseed
    //     }else{
    //         throw new Error("The provided id cannot be encrypted");
    //     }

    // }

    function load(compactId) {
        if(typeof compactId === "undefined") {
            throw new Error(`Expected type string or Buffer. Received undefined`);
        }

        if(typeof compactId !== "string"){
            if (typeof compactId === "object" && !Buffer.isBuffer(compactId)) {
                compactId = Buffer.from(compactId);
            }

            compactId = compactId.toString();
        }

        const decodedCompactId = decodeURIComponent(compactId);
        const id = {};
        const splitCompactId = decodedCompactId.substring(1).split('|');

        id.tag = decodedCompactId[0];
        id.random = Buffer.from(splitCompactId[0], 'base64');

        if(splitCompactId[1] && splitCompactId[1].length > 0){
            id.domain = JSON.parse(Buffer.from(splitCompactId[1], 'base64').toString());
        }

        return id;
    }
}

module.exports = CSBIdentifier;

}).call(this,require("buffer").Buffer)

},{"buffer":false,"pskcrypto":false}],"/opt/privatesky/modules/csb/lib/Header.js":[function(require,module,exports){
const Brick = require("bar").Brick;
const pskCrypto = require("pskcrypto");

function Header(previousHeaderHash, files, transactions){
    previousHeaderHash = previousHeaderHash || "";
    files = files || {};
    transactions = transactions || [];

    this.toBrick = function (encryptionKey) {
        const headerObj = {previousHeaderHash, files, transactions};
        const encryptedHeaderObj = pskCrypto.encrypt(headerObj, encryptionKey);
        return new Brick(encryptedHeaderObj);
    };

    this.fromBrick = function (brick, decryptionKey) {
        const headerObj = JSON.parse(pskCrypto.decrypt(brick, decryptionKey));
        previousHeaderHash = headerObj.previousHeaderHash;
        files = headerObj.files;
        transactions = headerObj.transactions;
    };

    this.setPreviousHeaderHash = function (hash) {
        previousHeaderHash = hash;
    };

    this.getPreviousHeaderHash = function () {
        return previousHeaderHash;
    };

    this.addTransactions = function (newTransactions) {
        if (!Array.isArray(newTransactions)) {
            newTransactions = [ newTransactions ];
        }

        transactions = transactions.concat(newTransactions);
    };

    this.getTransactions = function () {
        return transactions;
    };

    this.addFiles = function (newFiles) {
        if (typeof newFiles !== "object" || Array.isArray(newFiles)) {
            throw new Error('Invalid type. Expected non-array object');
        }

        const newFilesKeys = Object.keys(newFiles);
        newFilesKeys.forEach((fileAlias) => {
            files[fileAlias] = newFiles[fileAlias];
        });
    };

    this.getFiles = function () {
        return files;
    };

    this.getHeaderObject = function () {

        return {
            previousHeaderHash,
            files,
            transactions
        };
    };

}

module.exports = Header;
},{"bar":"bar","pskcrypto":false}],"/opt/privatesky/modules/csb/lib/HeadersHistory.js":[function(require,module,exports){
const Brick = require("bar").Brick;
const pskCrypto = require("pskcrypto");

function HeadersHistory(initHeaders) {

    let headers = initHeaders || [];
    this.addHeader = function (headerBrick, encryptionKey) {
        const headerEntry = {};
        const headerHash = headerBrick.generateHash();
        headerEntry[headerHash] = encryptionKey;
        headers.push(headerEntry);
    };

    this.getHeaders = function () {
        return headers;
    };

    this.getLastHeaderHash = function () {
        if (headers.length > 0) {
            const headerEntry = headers[headers.length - 1];
            return Object.keys(headerEntry)[0];
        }
    };

    this.toBrick = function (encryptionKey) {
        return new Brick(pskCrypto.encrypt(headers, encryptionKey));
    };

    this.fromBrick = function (brick, decryptionKey) {
        headers = JSON.parse(pskCrypto.decrypt(brick, decryptionKey).toString());
    };

}

module.exports = HeadersHistory;
},{"bar":"bar","pskcrypto":false}],"/opt/privatesky/modules/csb/lib/RawCSB.js":[function(require,module,exports){
const OwM = require('swarmutils').OwM;
const pskdb = require('pskdb');

function RawCSB(initData) {
	const data = new OwM({blockchain: initData});
	const blockchain = pskdb.startDb({getInitValues, persist});

	if(!data.blockchain) {
		data.blockchain = {
			transactionLog: []
		};
	}

	data.attachFile = function (fileAlias, path, seed) {
		data.modifyAsset("global.FileReference", fileAlias, (file) => {
			if (!file.isEmpty()) {
				console.log(`File with alias ${fileAlias} already exists`);
				return;
			}

			file.init(fileAlias, path, seed);
		});
	};

	data.saveAsset = function(asset) {
		const transaction = blockchain.beginTransaction({});
		transaction.add(asset);
		blockchain.commit(transaction);
	};

	data.modifyAsset = function(assetType, aid, assetModifier) {
		const transaction = blockchain.beginTransaction({});
		const asset = transaction.lookup(assetType, aid);
		assetModifier(asset);

		transaction.add(asset);
		blockchain.commit(transaction);
	};

	data.getAsset = function (assetType, aid) {
		const transaction = blockchain.beginTransaction({});
		return transaction.lookup(assetType, aid);
	};

	data.getAllAssets = function(assetType) {
		const transaction = blockchain.beginTransaction({});
		return transaction.loadAssets(assetType);
	};

	data.applyTransaction = function (transactionSwarm) {
		// const transaction = blockchain.beginTransaction(transactionSwarm);
		blockchain.commitSwarm(transactionSwarm);
		// blockchain.commit(transaction);
	};

	data.getTransactionLog = function () {
		return data.blockchain.transactionLog;
	};
	/* internal functions */

	function persist(transactionLog, currentValues, currentPulse) {
		transactionLog.currentPulse = currentPulse;

		data.blockchain.currentValues = currentValues;
		data.blockchain.transactionLog.push(transactionLog);
	}

	function getInitValues () {
		if(!data.blockchain || !data.blockchain.currentValues) {
			return null;
		}
		return data.blockchain.currentValues;
	}

	return data;
}

module.exports = RawCSB;
},{"pskdb":"pskdb","swarmutils":false}],"/opt/privatesky/modules/csb/lib/RootCSB.js":[function(require,module,exports){
const RawCSB = require('./RawCSB');
const crypto = require('pskcrypto');
const CSBIdentifier = require("./CSBIdentifier");
const Header = require("./Header");
const HeadersHistory = require("./HeadersHistory");
const EDFSBrickStorage = require("edfs-brick-storage");
const Bar = require("bar");
const AsyncDispatcher = require("../../edfs/utils/AsyncDispatcher");
const Brick = Bar.Brick;
/**
 *
 * @param currentRawCSB - optional
 * @param csbIdentifier - required
 * @constructor
 */
function RootCSB(currentRawCSB, csbIdentifier, accessPoint) {
    this.getMidRoot = function (CSBPath, callback) {
        throw new Error('Not implemented');
    };

    this.createRawCSB = function () {
        return new RawCSB();
    };

    this.loadRawCSB = function (CSBPath, callback) {
        if (!currentRawCSB) {
            edfsBlockchainProxy.getCSBAnchor(csbIdentifier, (err, csbAnchor) => {
                if (err) {
                    return callback(err);
                }

                __loadRawCSB(csbIdentifier, csbAnchor.headerHistoryHash,(err, rawCSB) => {
                    if (err) {
                        return callback(err);
                    }

                    currentRawCSB = rawCSB;

                    if (CSBPath || CSBPath !== '') {
                        this.loadRawCSB(CSBPath, callback);
                        return;
                    }

                    callback(undefined, currentRawCSB);
                });
            });
            return;
        }
        if (!CSBPath || CSBPath === '') {
            return callback(null, currentRawCSB);
        }

        this.loadAssetFromPath(CSBPath, (err, asset, rawCSB) => {

            if (err) {
                return callback(err);
            }

            if (!asset || !asset.dseed) {
                return callback(new Error(`The CSBPath ${CSBPath} is invalid.`));
            }

            __loadRawCSB(new CSBIdentifier(asset.dseed), asset.headerHistoryHash, callback);
        });
    };

    this.loadAssetFromPath = function (CSBPath, callback) {
        let processedPath = __splitPath(CSBPath);
        if (!currentRawCSB) {
            return callback(new Error('currentRawCSB does not exist'));
        }

        let CSBReference = null;
        if (processedPath.CSBAliases.length > 0) {
            const nextAlias = processedPath.CSBAliases[0];
            CSBReference = currentRawCSB.getAsset('global.CSBReference', nextAlias);
        } else {
            if (!processedPath.assetType || !processedPath.assetAid) {
                return callback(new Error('Not asset type or id specified in CSBPath'));
            }

            CSBReference = currentRawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
        }

        if (processedPath.CSBAliases.length === 0) {
            return callback(null, CSBReference, currentRawCSB);
        }

        processedPath.CSBAliases.shift();

        if(!CSBReference || !CSBReference.dseed){
            return callback(new Error(`The CSBPath ${CSBPath} is invalid`));
        }
        __loadAssetFromPath(processedPath, new CSBIdentifier(CSBReference.dseed), CSBReference.barMapHash, 0, callback);
    };

    this.saveAssetToPath = function (CSBPath, asset, callback) {
        const splitPath = __splitPath(CSBPath, {keepAliasesAsString: true});
        this.loadRawCSB(splitPath.CSBAliases, (err, rawCSB) => {
            if (err) {
                return callback(err);
            }
            try {
                rawCSB.saveAsset(asset);
                this.saveRawCSB(rawCSB, splitPath.CSBAliases, callback);
            } catch (e) {
                return callback(e);
            }
        });
    };

    this.saveRawCSB = function (rawCSB, CSBPath, callback) {
        if (!CSBPath || CSBPath === '') {
            if (rawCSB) {
                currentRawCSB = rawCSB;
            }
        }

        const transactions = rawCSB.getTransactionLog();
        const headersHistory = new HeadersHistory();
        const header = new Header();
        edfsBlockchainProxy.getCSBAnchor(csbIdentifier, (err, csbAnchor) => {
            if (err) {
                console.log(err); //TODO: better handling
            }
            if (csbAnchor && typeof csbAnchor.headerHistoryHash !== "undefined") {
                edfsServiceProxy.getBrick(csbAnchor.headerHistoryHash, (err, headersHistoryBrick) => {
                    if (err) {
                        return callback(err);
                    }

                    headersHistory.fromBrick(headersHistoryBrick, csbIdentifier.getDseed());
                    header.setPreviousHeaderHash(headersHistory.getLastHeaderHash());
                    return __saveRawCSB(csbAnchor, headersHistory, header, transactions, callback);
                });
            }
            csbAnchor.init(csbIdentifier.getUid(), csbIdentifier.getUid());
            __saveRawCSB(csbAnchor, headersHistory, header, transactions, callback);
        });
    };


    /* ------------------- INTERNAL METHODS ------------------- */


    /**
     *
     * @param CSBPath: string - internal path that looks like /{CSBName1}/{CSBName2}:{assetType}:{assetAliasOrId}
     * @param options:object
     * @returns {{CSBAliases: [string], assetAid: (*|undefined), assetType: (*|undefined)}}
     * @private
     */
    function __splitPath(CSBPath, options = {}) {
        const pathSeparator = '/';

        if (CSBPath.startsWith(pathSeparator)) {
            CSBPath = CSBPath.substring(1);
        }

        let CSBAliases = CSBPath.split(pathSeparator);
        if (CSBAliases.length < 1) {
            throw new Error('CSBPath too short');
        }

        const lastIndex = CSBAliases.length - 1;
        const optionalAssetSelector = CSBAliases[lastIndex].split(':');

        if (optionalAssetSelector[0] === '') {
            CSBAliases = [];
        } else {
            CSBAliases[lastIndex] = optionalAssetSelector[0];
        }

        if (!optionalAssetSelector[1] && !optionalAssetSelector[2]) {
            optionalAssetSelector[1] = 'global.CSBReference';
            optionalAssetSelector[2] = CSBAliases[lastIndex];
            CSBAliases.pop();
        }

        if (options.keepAliasesAsString === true) {
            CSBAliases = CSBAliases.join('/');
        }
        return {
            CSBAliases: CSBAliases,
            assetType: optionalAssetSelector[1],
            assetAid: optionalAssetSelector[2]
        };
    }

    function __saveRawCSB(csbAnchor, headersHistory, header, transactions, callback) {
        const asyncDispatcher = new AsyncDispatcher(() => {
            const headerEncryptionKey = crypto.randomBytes(32);
            const headerBrick = header.toBrick(headerEncryptionKey);
            edfsServiceProxy.addBrick(headerBrick, (err) => {
                if (err) {
                    return callback(err);
                }

                headersHistory.addHeader(headerBrick, headerEncryptionKey);
                const historyBrick = headersHistory.toBrick(csbIdentifier.getDseed());
                edfsServiceProxy.addBrick(historyBrick, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    csbAnchor.updateHeaderHistoryHash(historyBrick.generateHash());
                    edfsBlockchainProxy.setCSBAnchor(csbAnchor, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        callback();
                    });
                });
            });

        });

        asyncDispatcher.dispatchEmpty(transactions.length);
        transactions.forEach((transaction) => {
            const encryptionKey = crypto.randomBytes(32);
            const transactionBrick = new Brick(crypto.encrypt(transaction, encryptionKey));
            const transactionEntry = {};
            const transactionHash = transactionBrick.generateHash();
            transactionEntry[transactionHash] = encryptionKey;
            header.addTransactions(transactionEntry);
            edfsServiceProxy.addBrick(transactionBrick, (err) => {
                if (err) {
                    return callback(err);
                }

                asyncDispatcher.markOneAsFinished();
            });
        });
    }



    function __loadRawCSB(localCSBIdentifier, localHeaderHistoryHash, callback) {
        if(typeof localHeaderHistoryHash === "function"){
            callback = localHeaderHistoryHash;
        }

        const rawCSB = new RawCSB();
        edfsServiceProxy.getBrick(localHeaderHistoryHash, (err, headersHistoryBrickData) => {
            if (err) {
                return callback(err);
            }

            const headersHistory = new HeadersHistory();
            headersHistory.fromBrick(headersHistoryBrickData, localCSBIdentifier.getDseed());
            const headersAsyncDispatcher = new AsyncDispatcher((errors, results) => {
                callback(undefined, rawCSB);
            });

            const headers = headersHistory.getHeaders();
            headersAsyncDispatcher.dispatchEmpty(headers.length);
            headers.forEach((headerEntry) => {
                const headerHash = Object.keys(headerEntry)[0];
                edfsServiceProxy.getBrick(headerHash, (err, headerBrick) => {
                    if (err) {
                        return callback(err);
                    }
                    const header = new Header();
                    header.fromBrick(headerBrick, headerEntry[headerHash]);
                    const transactionsEntries = header.getTransactions();
                    const transactionsAsyncDispatcher = new AsyncDispatcher((errors, results) => {
                        const resultsObj = {};
                        results.forEach((result) => {
                            const key = Object.keys(result)[0];
                            resultsObj[key] = Object.values(result[key])[0];
                        });

                        transactionsEntries.forEach((transactionEntry) => {
                            const transactionHash = Object.keys(transactionEntry)[0];
                            rawCSB.applyTransaction(resultsObj[transactionHash].swarm);
                        });

                        headersAsyncDispatcher.markOneAsFinished();
                    });
                    transactionsAsyncDispatcher.dispatchEmpty(transactionsEntries.length);
                    transactionsEntries.forEach((transactionEntry) => {
                        const transactionHash = Object.keys(transactionEntry)[0];
                        edfsServiceProxy.getBrick(transactionHash, (err, transactionBrick) => {
                            if (err) {
                                return callback(err);
                            }

                            const transactionObj = {};
                            transactionObj[transactionHash] = crypto.decryptObject(transactionBrick, transactionEntry[transactionHash]);
                            transactionsAsyncDispatcher.markOneAsFinished(undefined, transactionObj);

                        });
                    });
                });
            });
        });
    }

    function __loadAssetFromPath(processedPath, localCSBIdentifier, localHeaderHistoryHash, currentIndex, callback) {
        __loadRawCSB(localCSBIdentifier, (err, rawCSB) => {
            if (err) {
                return callback(err);
            }

            if (currentIndex < processedPath.CSBAliases.length) {
                const nextAlias = processedPath.CSBAliases[currentIndex];
                const asset = rawCSB.getAsset("global.CSBReference", nextAlias);
                const newCSBIdentifier = new CSBIdentifier(asset.dseed);

                __loadAssetFromPath(processedPath, newCSBIdentifier, ++currentIndex, callback);
                return;
            }

            const asset = rawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
            callback(null, asset, rawCSB);

        });

    }

}


module.exports = RootCSB;

},{"../../edfs/utils/AsyncDispatcher":"/opt/privatesky/modules/edfs/utils/AsyncDispatcher.js","./CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","./Header":"/opt/privatesky/modules/csb/lib/Header.js","./HeadersHistory":"/opt/privatesky/modules/csb/lib/HeadersHistory.js","./RawCSB":"/opt/privatesky/modules/csb/lib/RawCSB.js","bar":"bar","edfs-brick-storage":"edfs-brick-storage","pskcrypto":false}],"/opt/privatesky/modules/csb/lib/backupResolvers/EVFSResolver.js":[function(require,module,exports){

function EVFSResolver() {
    let isAuthenticated = false;

    this.auth = function (url, authObj, callback) {
        isAuthenticated = true;
        callback();
    };

    this.save = function (url, csbIdentifier, dataStream, callback) {
        if (!isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        $$.remote.doHttpPost(url + "/CSB/" + csbIdentifier.getUid(), dataStream, (err, res) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, res);
        });
    };

    this.load = function (url, csbIdentifier, version, callback) {
        if (!isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        if (typeof version === "function") {
            callback = version;
            version = "";
        }

        $$.remote.doHttpGet(url + "/CSB/" + csbIdentifier.getUid() + "/" + version, (err, resource) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, resource);
        });

    };

    this.getVersions = function (url, csbIdentifier, callback) {
        if (!isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        $$.remote.doHttpGet(url + "/CSB/" + csbIdentifier.getUid() + "/versions", (err, versions) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, JSON.parse(versions));
        });
    };

    this.compareVersions = function (url, filesList, callback) {
        if (!isAuthenticated) {
            return callback(new Error('Unauthenticated'));
        }

        $$.remote.doHttpPost(url + "/CSB/compareVersions", JSON.stringify(filesList), (err, modifiedFiles) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, modifiedFiles);
        });
    };
}

module.exports = EVFSResolver;
},{}],"/opt/privatesky/modules/csb/utils/AsyncDispatcher.js":[function(require,module,exports){

function AsyncDispatcher(finalCallback) {
	let results = [];
	let errors = [];

	let started = 0;

	function markOneAsFinished(err, res) {
		if(err) {
			errors.push(err);
		}

		if(arguments.length > 2) {
			arguments[0] = undefined;
			res = arguments;
		}

		if(typeof res !== "undefined") {
			results.push(res);
		}

		if(--started <= 0) {
            callCallback();
		}
	}

	function dispatchEmpty(amount = 1) {
		started += amount;
	}

	function callCallback() {
	    if(errors.length === 0) {
	        errors = undefined;
        }

	    if(results.length === 0) {
	        results = undefined;
        }

        finalCallback(errors, results);
    }

	return {
		dispatchEmpty,
		markOneAsFinished
	};
}

module.exports = AsyncDispatcher;
},{}],"/opt/privatesky/modules/csb/utils/DseedCage.js":[function(require,module,exports){
(function (Buffer){
const crypto = require('pskcrypto');
const path = require('path');
const fs = require("fs");
const CSBIdentifier = require("../lib/CSBIdentifier");

function DseedCage(localFolder) {
	const dseedFolder = path.join(localFolder, '.privateSky');
	const dseedPath = path.join(dseedFolder, 'dseed');

	function loadDseedBackups(pin, callback) {
		fs.mkdir(dseedFolder, {recursive: true}, (err) => {
			if (err) {
				return callback(err);
			}

			crypto.loadData(pin, dseedPath, (err, dseedBackups) => {
				if (err) {
					return callback(err);
				}
				try{
					dseedBackups = JSON.parse(dseedBackups.toString());
				}catch (e) {
					return callback(e);
				}

				let csbIdentifier;
				if (dseedBackups.dseed && !Buffer.isBuffer(dseedBackups.dseed)) {
					dseedBackups.dseed = Buffer.from(dseedBackups.dseed);
					csbIdentifier = new CSBIdentifier(dseedBackups.dseed);
				}

				callback(undefined, csbIdentifier, dseedBackups.backups);
			});
		});
	}

	function saveDseedBackups(pin, csbIdentifier, backups, callback) {
		fs.mkdir(dseedFolder, {recursive: true}, (err) => {
			if (err) {
				return callback(err);
			}

			let dseed;
			if(csbIdentifier){
				dseed = csbIdentifier.getDseed();
			}
			const dseedBackups = JSON.stringify({
				dseed,
				backups
			});

			crypto.saveData(Buffer.from(dseedBackups), pin, dseedPath, callback);
		});
	}


	return {
		loadDseedBackups,
		saveDseedBackups,
	};
}


module.exports = DseedCage;
}).call(this,require("buffer").Buffer)

},{"../lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","buffer":false,"fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/csb/utils/HashCage.js":[function(require,module,exports){
const path = require('path');
const fs = require('fs');

function HashCage(localFolder) {
	const hashFolder = path.join(localFolder, '.privateSky');
	const hashPath = path.join(hashFolder, 'hash');

	function loadHash(callback) {
		fs.mkdir(hashFolder, {recursive: true}, (err) => {
			if (err) {
				return callback(err);
			}

			fs.readFile(hashPath, (err, data) => {
				if(err){
					return callback(null, {});
				}

				callback(null, JSON.parse(data));
			});

		});
	}

	function saveHash(hashObj, callback) {
		fs.mkdir(hashFolder, {recursive: true}, (err) => {
			if (err) {
				return callback(err);
			}

			fs.writeFile(hashPath, JSON.stringify(hashObj, null, '\t'), (err) => {
				if (err) {
					return callback(err);
				}
				callback();
			});
		});
	}

	return {
		loadHash,
		saveHash
	};
}

module.exports = HashCage;

},{"fs":false,"path":false}],"/opt/privatesky/modules/csb/utils/flowsUtils.js":[function(require,module,exports){
exports.defaultBackup = "http://localhost:8080";
exports.defaultPin = "12345678";
exports.noTries = 3;

},{}],"/opt/privatesky/modules/csb/utils/utils.js":[function(require,module,exports){
const fs = require("fs");
const path = require('path');
// const crypto = require("pskcrypto");

function generatePath(localFolder, csbIdentifier) {
    return path.join(localFolder, csbIdentifier.getUid());
}

function processUrl(url, assetType) {
    const splitUrl = url.split('/');
    const aliasAsset = splitUrl.pop();
    const CSBPath = splitUrl.join('/');
    return {
        CSBPath: CSBPath + ':' + assetType + ':' + aliasAsset,
        alias: aliasAsset
    };
}

function deleteRecursively(inputPath, isRoot = true, callback) {

    fs.stat(inputPath, function (err, stats) {
        if (err) {
            callback(err, stats);
            return;
        }
        if (stats.isFile()) {
            fs.unlink(inputPath, (err) => {
                if (err) {
                    return callback(err, null);
                } else {
                    return callback(null, true);
                }
            });
        } else if (stats.isDirectory()) {
            fs.readdir(inputPath, (err, files) => {
                if (err) {
                    callback(err, null);
                    return;
                }
                const f_length = files.length;
                let f_delete_index = 0;

                const checkStatus = () => {
                    if (f_length === f_delete_index) {
                        if(!isRoot) {
                            fs.rmdir(inputPath, (err) => {
                                if (err) {
                                    return callback(err, null);
                                } else {
                                    return callback(null, true);
                                }
                            });
                        }
                        callback(null, true);
                        return true;
                    }
                    return false;
                };
                if (!checkStatus()) {
                    files.forEach((file) => {
                        const tempPath = path.join(inputPath, file);
                        deleteRecursively(tempPath, false,(err, status) => {
                            if (!err) {
                                f_delete_index++;
                                checkStatus();
                            } else {
                                return callback(err, null);
                            }
                        });
                    });
                }
            });
        }
    });
}

module.exports = {
    generatePath,
    processUrl,
    deleteRecursively
};


},{"fs":false,"path":false}],"/opt/privatesky/modules/csb/utils/validator.js":[function(require,module,exports){
const RootCSB = require("../lib/RootCSB");
const fs = require("fs");
const path = require("path");


module.exports.validatePin = function (localFolder, swarm, phaseName, pin, noTries, ...args) {
	RootCSB.createRootCSB(localFolder, undefined, undefined, pin, (err, rootCSB, csbIdentifier, backups) =>{
		if(err){
			swarm.swarm("interaction", "readPin", noTries - 1);
		}else{
			if(csbIdentifier){
				swarm.rootCSB = rootCSB;
				swarm.csbIdentifier = csbIdentifier;
			}
			args.push(backups);
			swarm[phaseName](pin, ...args);
		}
	});
};

module.exports.reportOrContinue = function(swarm, phaseName, errorMessage, ...args){
	return function(err,...res) {
		if (err) {
			swarm.swarm("interaction", "handleError", err, errorMessage);
		} else {
			if (phaseName) {
					swarm[phaseName](...res, ...args);
			}
		}
	};
};

module.exports.checkMasterCSBExists = function (localFolder, callback) {
	fs.stat(path.join(localFolder, ".privateSky/hash"), (err, stats)=>{
		if(err){
			return callback(err, false);
		}

		return callback(undefined, true);
	});
};
},{"../lib/RootCSB":"/opt/privatesky/modules/csb/lib/RootCSB.js","fs":false,"path":false}],"/opt/privatesky/modules/edfs-brick-storage/EDFSBrickStorage.js":[function(require,module,exports){
require("psk-http-client");
const bar = require("bar");
const Brick = bar.Brick;

function EDFSBrickStorage(url) {

    this.putBrick = function (brick, callback) {
        $$.remote.doHttpPost(url + "/EDFS/" + brick.getHash(), brick.getData(), callback);
    };

    this.getBrick = function (brickHash, callback) {
        $$.remote.doHttpGet(url + "/EDFS/" + brickHash, (err, brickData) => {
            callback(err, new Brick(brickData));
        });
    };

    this.deleteBrick = function (brickHash, callback) {
        throw new Error("Not implemented");
    };

    this.putBarMap = function (barMap, callback) {
        const mapBrick = barMap.toBrick();
        this.putBrick(mapBrick, (err) => {
            callback(err, mapBrick.getHash());
        });
    };

    this.getBarMap = function (mapDigest, callback) {
        if (typeof mapDigest === "function") {
            callback = mapDigest;
            mapDigest = undefined;
        }

        if (typeof mapDigest === "undefined") {
            return callback(undefined, new bar.FolderBarMap());
        }

        this.getBrick(mapDigest, (err, mapBrick) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, new bar.FolderBarMap(JSON.parse(mapBrick.getData().toString())));
        });
    }
}

module.exports = {
    createEDFSBrickStorage(url) {
        return new EDFSBrickStorage(url);
    }
};


},{"bar":"bar","psk-http-client":"psk-http-client"}],"/opt/privatesky/modules/edfs/flows/BricksManager.js":[function(require,module,exports){
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
},{"../flows/BricksManager":"/opt/privatesky/modules/edfs/flows/BricksManager.js"}],"/opt/privatesky/modules/edfs/utils/AsyncDispatcher.js":[function(require,module,exports){

function AsyncDispatcher(finalCallback) {
	let results = [];
	let errors = [];

	let started = 0;

	function markOneAsFinished(err, res) {
		if(err) {
			errors.push(err);
		}

		if(arguments.length > 2) {
			arguments[0] = undefined;
			res = arguments;
		}

		if(typeof res !== "undefined") {
			results.push(res);
		}

		if(--started <= 0) {
            return callCallback();
		}
	}

	function dispatchEmpty(amount = 1) {
		started += amount;
	}

	function callCallback() {
	    if(errors.length === 0) {
	        errors = undefined;
        }

	    if(results.length === 0) {
	        results = undefined;
        }

        finalCallback(errors, results);
    }

	return {
		dispatchEmpty,
		markOneAsFinished
	};
}

module.exports = AsyncDispatcher;
},{}],"/opt/privatesky/modules/foldermq/lib/folderMQ.js":[function(require,module,exports){
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

},{"fs":false,"path":false,"swarmutils":false}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace.js":[function(require,module,exports){
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
},{"./../swarmInteraction":"/opt/privatesky/modules/interact/lib/swarmInteraction.js","foldermq":"foldermq","swarmutils":false}],"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/httpInteractionSpace.js":[function(require,module,exports){
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


},{}],"/opt/privatesky/modules/node-fd-slicer/modules/node-pend/index.js":[function(require,module,exports){
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
},{"swarmutils":false}],"/opt/privatesky/modules/pskwallet/libraries/BackupEngine.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/lib/BackupEngine.js"][0].apply(exports,arguments)
},{"../utils/AsyncDispatcher":"/opt/privatesky/modules/pskwallet/utils/AsyncDispatcher.js","./backupResolvers/EVFSResolver":"/opt/privatesky/modules/pskwallet/libraries/backupResolvers/EVFSResolver.js"}],"/opt/privatesky/modules/pskwallet/libraries/CSBCache.js":[function(require,module,exports){
 function CSBCache(maxSize) {

     let cache = {};
    let size = 0;
    const clearingRatio = 0.5;


    this.load = function (uid) {
        // if (cache[uid]) {
        //     cache[uid].count += 1;
        //     return cache[uid].instance;
        // }

        return undefined;
    };

    this.put = function (uid, obj) {
        if (size > maxSize) {
            clear();
        } else {
            size++;
            cache[uid] = {
                instance: obj,
                count: 0
            };
        }

    };

    //-------------------------internal methods---------------------------------------

    function clear() {
        size = maxSize - Math.round(clearingRatio * maxSize);

        const entries = Object.entries(cache);
        cache = entries
            .sort((arr1, arr2) => arr2[1].count - arr1[1].count)
            .slice(0, size)
            .reduce((obj, [ k, v ]) => {
                obj[k] = v;
                return obj;
            }, {});
    }
}

module.exports = CSBCache;

},{}],"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js":[function(require,module,exports){
(function (Buffer){
const crypto = require("pskcrypto");


function CSBIdentifier(id, backupUrls, keyLen = 32) {
    let seed;
    let dseed;
    let uid;
    let encSeed;
    // let encDseed;

    init();

    this.getSeed = function () {
        if(!seed){
            throw new Error("Cannot return seed. Access is denied.");
        }

        return generateCompactForm(seed);
    };

    this.getDseed = function () {
        if(dseed){
            return generateCompactForm(dseed);
        }

        if(seed){
            dseed = deriveSeed(seed);
            return generateCompactForm(dseed);
        }

        throw new Error("Cannot return derived seed. Access is denied.");
    };

    this.getUid = function () {
        if(uid){
            return generateCompactForm(uid).toString();
        }

        if(dseed){
            uid = computeUid(dseed);
            return generateCompactForm(uid).toString();
        }

        if(seed){
            dseed = deriveSeed(seed);
            uid = computeUid(dseed);
            return generateCompactForm(uid).toString();
        }

        throw new Error("Cannot return uid");
    };

    this.getEncSeed = function (encryptionKey) {
        if(encSeed){
            return generateCompactForm(encSeed);
        }

        if(!seed){
            throw new Error("Cannot return encSeed. Access is denied");
        }

        if (!encryptionKey) {
            throw new Error("Cannot return encSeed. No encryption key was provided");
        }

        //TODO: encrypt seed using encryptionKey. Encryption algorithm remains to be chosen
    };



    this.getBackupUrls = function () {
        if(seed){
            return seed.backup;
        }

        if(dseed){
            return dseed.backup;
        }

        throw new Error("Backup URLs could not be retrieved. Access is denied");
    };

    //------------------------------ internal methods ------------------------------
    function init() {
        if (!id) {
            if (!backupUrls) {
                throw new Error("No backups provided.");
            }

            seed = create();
        }else{
            classifyId();
        }
    }

    function classifyId() {
        if (typeof id !== "string" && !Buffer.isBuffer(id) && !(typeof id === "object" && !Buffer.isBuffer(id))) {
            throw new Error(`Id must be a string or a buffer. The type provided was ${typeof id}`);
        }

        const expandedId = load(id);
        switch(expandedId.tag){
            case 's':
                seed = expandedId;
                break;
            case 'd':
                dseed = expandedId;
                break;
            case 'u':
                uid = expandedId;
                break;
            case 'es':
                encSeed = expandedId;
                break;
            case 'ed':
                encDseed = expandedId;
                break;
            default:
                throw new Error('Invalid tag');
        }
    }



    function create() {
        const localSeed = {};
        if (!Array.isArray(backupUrls)) {
            backupUrls = [ backupUrls ];
        }

        localSeed.tag    = 's';
        localSeed.random = crypto.randomBytes(keyLen);
        localSeed.backup = backupUrls;

        return localSeed;
    }

    function deriveSeed(seed) {
        let compactSeed = seed;

        if (typeof seed === 'object' && !Buffer.isBuffer(seed)) {
            compactSeed = generateCompactForm(seed);
        }

        if (Buffer.isBuffer(seed)) {
            compactSeed = seed.toString();
        }

        if (compactSeed[0] === 'd') {
            throw new Error('Tried to derive an already derived seed.');
        }

        const decodedCompactSeed = decodeURIComponent(compactSeed);
        const splitCompactSeed = decodedCompactSeed.substring(1).split('|');

        const strSeed = Buffer.from(splitCompactSeed[0], 'base64').toString('hex');
        const backupUrls = Buffer.from(splitCompactSeed[1], 'base64').toString();
        const dseed = {};

        dseed.tag = 'd';
        dseed.random = crypto.deriveKey(strSeed, null, keyLen);
        dseed.backup = JSON.parse(backupUrls);

        return dseed;
    }

    function computeUid(dseed){
        if(!dseed){
            throw new Error("Dseed was not provided");
        }

        if (typeof dseed === "object" && !Buffer.isBuffer(dseed)) {
            dseed = generateCompactForm(dseed);
        }

        const uid = {};
        uid.tag = 'u';
        uid.random = Buffer.from(crypto.generateSafeUid(dseed));

        return uid;
    }

    function generateCompactForm({tag, random, backup}) {
        let compactId = tag + random.toString('base64');
        if (backup) {
            compactId += '|' + Buffer.from(JSON.stringify(backup)).toString('base64');
        }
        return Buffer.from(encodeURIComponent(compactId));
    }

    function encrypt(id, encryptionKey) {
        if(arguments.length !== 2){
            throw new Error(`Wrong number of arguments. Expected: 2; provided ${arguments.length}`);
        }

        let tag;
        if (typeof id === "object" && !Buffer.isBuffer(id)) {
            tag = id.tag;
            id = generateCompactForm(id);
        }

        if (tag === 's') {
            //TODO encrypt seed
        }else if (tag === 'd') {
            //TODO encrypt dseed
        }else{
            throw new Error("The provided id cannot be encrypted");
        }

    }

    function load(compactId) {
        if(typeof compactId === "undefined") {
            throw new Error(`Expected type string or Buffer. Received undefined`);
        }

        if(typeof compactId !== "string"){
            if (typeof compactId === "object" && !Buffer.isBuffer(compactId)) {
                compactId = Buffer.from(compactId);
            }

            compactId = compactId.toString();
        }

        const decodedCompactId = decodeURIComponent(compactId);
        const id = {};
        const splitCompactId = decodedCompactId.substring(1).split('|');

        id.tag = decodedCompactId[0];
        id.random = Buffer.from(splitCompactId[0], 'base64');

        if(splitCompactId[1] && splitCompactId[1].length > 0){
            id.backup = JSON.parse(Buffer.from(splitCompactId[1], 'base64').toString());
        }

        return id;
    }
}

module.exports = CSBIdentifier;

}).call(this,require("buffer").Buffer)

},{"buffer":false,"pskcrypto":false}],"/opt/privatesky/modules/pskwallet/libraries/RawCSB.js":[function(require,module,exports){
const OwM = require('swarmutils').OwM;
const pskdb = require('pskdb');

function RawCSB(initData) {
	const data = new OwM({blockchain: initData});
	const blockchain = pskdb.startDb({getInitValues, persist});

	if(!data.blockchain) {
		data.blockchain = {
			transactionLog : '',
			embeddedFiles: {}
		};
	}

	data.embedFile = function (fileAlias, fileData) {
		const embeddedAsset = data.getAsset("global.EmbeddedFile", fileAlias);
		if(embeddedAsset.isPersisted()){
			console.log(`File with alias ${fileAlias} already exists`);
			return;
		}

		data.blockchain.embeddedFiles[fileAlias] = fileData;
		data.saveAsset(embeddedAsset);
	};

	data.attachFile = function (fileAlias, path, seed) {
		data.modifyAsset("global.FileReference", fileAlias, (file) => {
			if (!file.isEmpty()) {
				console.log(`File with alias ${fileAlias} already exists`);
				return;
			}

			file.init(fileAlias, path, seed);
		});
	};

	data.saveAsset = function(asset) {
		const transaction = blockchain.beginTransaction({});
		transaction.add(asset);
		blockchain.commit(transaction);
	};

	data.modifyAsset = function(assetType, aid, assetModifier) {
		const transaction = blockchain.beginTransaction({});
		const asset = transaction.lookup(assetType, aid);
		assetModifier(asset);

		transaction.add(asset);
		blockchain.commit(transaction);
	};

	data.getAsset = function (assetType, aid) {
		const transaction = blockchain.beginTransaction({});
		return transaction.lookup(assetType, aid);
	};

	data.getAllAssets = function(assetType) {
		const transaction = blockchain.beginTransaction({});
		return transaction.loadAssets(assetType);
	};

	/* internal functions */

	function persist(transactionLog, currentValues, currentPulse) {
		transactionLog.currentPulse = currentPulse;

		data.blockchain.currentValues = currentValues;
		data.blockchain.transactionLog += mkSingleLine(JSON.stringify(transactionLog)) + "\n";
	}

	function getInitValues () {
		if(!data.blockchain || !data.blockchain.currentValues) {
			return null;
		}
		return data.blockchain.currentValues;
	}

	function mkSingleLine(str) {
		return str.replace(/\n|\r/g, "");
	}

	return data;
}

module.exports = RawCSB;
},{"pskdb":"pskdb","swarmutils":false}],"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js":[function(require,module,exports){
const RawCSB = require('./RawCSB');
const fs = require('fs');
const crypto = require('pskcrypto');
const utils = require('../utils/utils');
const DseedCage = require('../utils/DseedCage');
const HashCage = require('../utils/HashCage');
const CSBCache = require("./CSBCache");
const CSBIdentifier = require("./CSBIdentifier");
const EventEmitter = require('events');

const rawCSBCache = new CSBCache(10);
const instances = {};

/**
 *
 * @param localFolder   - required
 * @param currentRawCSB - optional
 * @param csbIdentifier - required
 * @constructor
 */
function RootCSB(localFolder, currentRawCSB, csbIdentifier) {
    if (!localFolder || !csbIdentifier) {
        throw new Error('Missing required parameters');
    }


    const hashCage = new HashCage(localFolder);
    const event = new EventEmitter();
    this.on = event.on;
    this.off = event.removeListener;
    this.removeAllListeners = event.removeAllListeners;
    this.emit = event.emit;

    this.getMidRoot = function (CSBPath, callback) {
        throw new Error('Not implemented');
    };

    this.loadRawCSB = function (CSBPath, callback) {
        if (!currentRawCSB) {
            __loadRawCSB(csbIdentifier, (err, rawCSB) => {
                if (err) {
                    return callback(err);
                }

                currentRawCSB = rawCSB;

                if (CSBPath || CSBPath !== '') {
                    this.loadRawCSB(CSBPath, callback);
                    return;
                }

                callback(undefined, currentRawCSB);
            });
            return;
        }
        if (!CSBPath || CSBPath === '') {
            return callback(null, currentRawCSB);
        }

        this.loadAssetFromPath(CSBPath, (err, asset, rawCSB) => {

            if (err) {
                return callback(err);
            }

            if (!asset || !asset.dseed) {
                return callback(new Error(`The CSBPath ${CSBPath} is invalid.`));
            }

            __loadRawCSB(new CSBIdentifier(asset.dseed), callback);
        });
    };

    this.saveRawCSB = function (rawCSB, CSBPath, callback) {
        // save master
        if (!CSBPath || CSBPath === '') {
            if (rawCSB) {
                currentRawCSB = rawCSB;
            }

            __initializeAssets(currentRawCSB);
            return __writeRawCSB(currentRawCSB, csbIdentifier, callback);
        }

        // save csb in hierarchy
        const splitPath = __splitPath(CSBPath);
        this.loadAssetFromPath(CSBPath, (err, csbReference) => {
            if (err) {
                return callback(err);
            }
            if (!csbReference.dseed) {
                const backups = csbIdentifier.getBackupUrls();
                const newCSBIdentifier = new CSBIdentifier(undefined, backups);
                const localSeed = newCSBIdentifier.getSeed();
                const localDseed = newCSBIdentifier.getDseed();
                csbReference.init(splitPath.assetAid, localSeed, localDseed);

                this.saveAssetToPath(CSBPath, csbReference, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    this.loadAssetFromPath(CSBPath, (err, csbRef) => {
                        if (err) {
                            return callback(err);
                        }

                        __initializeAssets(rawCSB, csbRef, backups);
                        __writeRawCSB(rawCSB, new CSBIdentifier(csbReference.dseed), (err) => {
                            if (err) {
                                return callback(err);
                            }

                            this.emit('end');
                            callback();
                        });
                    });
                });
            } else {
                __writeRawCSB(rawCSB, new CSBIdentifier(csbReference.dseed), callback);
            }
        });
    };

    this.saveAssetToPath = function (CSBPath, asset, callback) {
        const splitPath = __splitPath(CSBPath, {keepAliasesAsString: true});
        this.loadRawCSB(splitPath.CSBAliases, (err, rawCSB) => {
            if (err) {
                return callback(err);
            }
            try {
                rawCSB.saveAsset(asset);
                this.saveRawCSB(rawCSB, splitPath.CSBAliases, callback);
            } catch (e) {
                return callback(e);
            }
        });
    };

    this.loadAssetFromPath = function (CSBPath, callback) {
        const processedPath = __splitPath(CSBPath);
        if (!currentRawCSB) {
            return callback(new Error('currentRawCSB does not exist'));
        }

        let CSBReference = null;
        if (processedPath.CSBAliases.length > 0) {
            const nextAlias = processedPath.CSBAliases[0];
            CSBReference = currentRawCSB.getAsset('global.CSBReference', nextAlias);
        } else {
            if (!processedPath.assetType || !processedPath.assetAid) {
                return callback(new Error('Not asset type or id specified in CSBPath'));
            }

            CSBReference = currentRawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
        }

        if (processedPath.CSBAliases.length === 0) {
            return callback(null, CSBReference, currentRawCSB);
        }

        processedPath.CSBAliases.shift();

        if(!CSBReference || !CSBReference.dseed){
            return callback(new Error(`The CSBPath ${CSBPath} is invalid`));
        }
        __loadAssetFromPath(processedPath, new CSBIdentifier(CSBReference.dseed), 0, callback);
    };


    /* ------------------- INTERNAL METHODS ------------------- */

    function __loadRawCSB(localCSBIdentifier, callback) {
        const uid = localCSBIdentifier.getUid();
        const cachedRawCSB = rawCSBCache.load(uid);

        if (cachedRawCSB) {
            return callback(null, cachedRawCSB);
        }

        const rootPath = utils.generatePath(localFolder, localCSBIdentifier);
        fs.readFile(rootPath, (err, encryptedCsb) => {
            if (err) {
                return callback(err);
            }

            crypto.decryptObject(encryptedCsb, localCSBIdentifier.getDseed(), (err, csbData) => {
                if (err) {
                    return callback(err);
                }
                const csb = new RawCSB(csbData);
                rawCSBCache.put(uid, csb);
                callback(null, csb);
            });
        });
    }

    /**
     *
     * @param CSBPath: string - internal path that looks like /{CSBName1}/{CSBName2}:{assetType}:{assetAliasOrId}
     * @param options:object
     * @returns {{CSBAliases: [string], assetAid: (*|undefined), assetType: (*|undefined)}}
     * @private
     */
    function __splitPath(CSBPath, options = {}) {
        const pathSeparator = '/';

        if (CSBPath.startsWith(pathSeparator)) {
            CSBPath = CSBPath.substring(1);
        }

        let CSBAliases = CSBPath.split(pathSeparator);
        if (CSBAliases.length < 1) {
            throw new Error('CSBPath too short');
        }

        const lastIndex = CSBAliases.length - 1;
        const optionalAssetSelector = CSBAliases[lastIndex].split(':');

        if (optionalAssetSelector[0] === '') {
            CSBAliases = [];
        } else {
            CSBAliases[lastIndex] = optionalAssetSelector[0];
        }

        if (!optionalAssetSelector[1] && !optionalAssetSelector[2]) {
            optionalAssetSelector[1] = 'global.CSBReference';
            optionalAssetSelector[2] = CSBAliases[lastIndex];
            CSBAliases.pop();
        }

        if (options.keepAliasesAsString === true) {
            CSBAliases = CSBAliases.join('/');
        }
        return {
            CSBAliases: CSBAliases,
            assetType: optionalAssetSelector[1],
            assetAid: optionalAssetSelector[2]
        };
    }

    function __loadAssetFromPath(processedPath, localCSBIdentifier, currentIndex, callback) {
        __loadRawCSB(localCSBIdentifier, (err, rawCSB) => {
            if (err) {
                return callback(err);
            }

            if (currentIndex < processedPath.CSBAliases.length) {
                const nextAlias = processedPath.CSBAliases[currentIndex];
                const asset = rawCSB.getAsset("global.CSBReference", nextAlias);
                const newCSBIdentifier = new CSBIdentifier(asset.dseed);

                __loadAssetFromPath(processedPath, newCSBIdentifier, ++currentIndex, callback);
                return;
            }

            const asset = rawCSB.getAsset(processedPath.assetType, processedPath.assetAid);
            callback(null, asset, rawCSB);

        });

    }

    function __writeRawCSB(rawCSB, localCSBIdentifier, callback) {
        crypto.encryptObject(rawCSB.blockchain, localCSBIdentifier.getDseed(), null, (err, encryptedBlockchain) => {
            if (err) {
                return callback(err);
            }

            hashCage.loadHash((err, hashObj) => {
                if (err) {
                    return callback(err);
                }

                const key = localCSBIdentifier.getUid();
                hashObj[key] = crypto.pskHash(encryptedBlockchain).toString('hex');

                hashCage.saveHash(hashObj, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    fs.writeFile(utils.generatePath(localFolder, localCSBIdentifier), encryptedBlockchain, callback);
                });
            });
        });
    }

    function __initializeAssets(rawCSB, csbRef, backupUrls) {

        let isMaster;

        const csbMeta = rawCSB.getAsset('global.CSBMeta', 'meta');
        if (currentRawCSB === rawCSB) {
            isMaster = typeof csbMeta.isMaster === 'undefined' ? true : csbMeta.isMaster;
            if (!csbMeta.id) {
                csbMeta.init($$.uidGenerator.safe_uuid());
                csbMeta.setIsMaster(isMaster);
                rawCSB.saveAsset(csbMeta);
            }
        } else {
            backupUrls.forEach((url) => {
                const uid = $$.uidGenerator.safe_uuid();
                const backup = rawCSB.getAsset('global.Backup', uid);
                backup.init(uid, url);
                rawCSB.saveAsset(backup);
            });

            isMaster = typeof csbMeta.isMaster === 'undefined' ? false : csbMeta.isMaster;
            csbMeta.init(csbRef.getMetadata('swarmId'));
            csbMeta.setIsMaster(isMaster);
            rawCSB.saveAsset(csbMeta);
        }
    }
}


function createRootCSB(localFolder, masterRawCSB, csbIdentifier, pin, callback) {
    let masterDseed;

    if (csbIdentifier) {
        masterDseed = csbIdentifier.getDseed();
        if (masterRawCSB) {
            const rootCSB = new RootCSB(localFolder, masterRawCSB, masterDseed);
            return callback(null, rootCSB);
        }

        return loadWithIdentifier(localFolder, masterDseed, callback);
    } else if (pin) {

        return loadWithPin(localFolder, pin, callback);
    } else {
        return callback(new Error('Missing seed, dseed and pin, at least one is required'));
    }
}

function loadWithPin(localFolder, pin, callback) {
    new DseedCage(localFolder).loadDseedBackups(pin, (err, csbIdentifier, backups) => {
        if (err) {
            return callback(err);
        }

        if (!csbIdentifier && (!backups || backups.length === 0)) {
            return callback();
        }

        if (!csbIdentifier) {
            return callback(undefined, undefined, undefined, backups);
        }

        const dseed = csbIdentifier.getDseed();
        const key = crypto.generateSafeUid(dseed, localFolder);
        if (!instances[key]) {
            instances[key] = new RootCSB(localFolder, null, csbIdentifier);
        }

        const rootCSB = instances[key];

        rootCSB.loadRawCSB('', (err) => {
            if (err) {
                return callback(err);
            }
            callback(undefined, rootCSB, csbIdentifier, backups);
        });
    });
}

function loadWithIdentifier(localFolder, csbIdentifier, callback) {
    const masterDseed = csbIdentifier.getDseed();
    const key = crypto.generateSafeUid(masterDseed, localFolder);
    if (!instances[key]) {
        instances[key] = new RootCSB(localFolder, null, csbIdentifier);
    }

    const rootCSB = instances[key];
    rootCSB.loadRawCSB('', (err) => {
        if (err) {
            return callback(err);
        }
        callback(null, rootCSB);
    });
}

function createNew(localFolder, csbIdentifier, rawCSB) {
    if (!localFolder || !csbIdentifier) {
        throw new Error("Missing required arguments");
    }

    rawCSB = rawCSB || new RawCSB();
    const masterDseed = csbIdentifier.getDseed();
    const key = crypto.generateSafeUid(masterDseed, localFolder);
    if (!instances[key]) {
        instances[key] = new RootCSB(localFolder, rawCSB, csbIdentifier);
    }

    return instances[key];
}

function writeNewMasterCSB(localFolder, csbIdentifier, callback) {
    if (!localFolder || !csbIdentifier) {
        return callback(new Error('Missing required arguments'));
    }

    const masterDseed = csbIdentifier.getDseed();
    const key = crypto.generateSafeUid(masterDseed, localFolder);
    if (!instances[key]) {
        instances[key] = new RootCSB(localFolder, null, csbIdentifier);
    }

    const rootCSB = instances[key];
    rootCSB.saveRawCSB(new RawCSB(), '', callback);
}

module.exports = {
    createNew,
    createRootCSB,
    loadWithIdentifier,
    loadWithPin,
    writeNewMasterCSB
};
},{"../utils/DseedCage":"/opt/privatesky/modules/pskwallet/utils/DseedCage.js","../utils/HashCage":"/opt/privatesky/modules/pskwallet/utils/HashCage.js","../utils/utils":"/opt/privatesky/modules/pskwallet/utils/utils.js","./CSBCache":"/opt/privatesky/modules/pskwallet/libraries/CSBCache.js","./CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","./RawCSB":"/opt/privatesky/modules/pskwallet/libraries/RawCSB.js","events":false,"fs":false,"pskcrypto":false}],"/opt/privatesky/modules/pskwallet/libraries/backupResolvers/EVFSResolver.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/lib/backupResolvers/EVFSResolver.js"][0].apply(exports,arguments)
},{}],"/opt/privatesky/modules/pskwallet/libraries/flows/addBackup.js":[function(require,module,exports){
const flowsUtils = require("../../utils/flowsUtils");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const fs = require('fs');
const path = require('path');

$$.swarm.describe("addBackup", {
    start: function (backupUrl, localFolder = process.cwd()) {
        if(!backupUrl){
            return this.swarm("interaction", "handleError", new Error("No backup url provided"));
        }

        this.localFolder = localFolder;
        this.backupUrl = backupUrl;
        fs.stat(path.join(this.localFolder, ".privateSky", 'dseed'), (err, stats)=>{
            if(err){
                this.swarm("interaction", "createPin", flowsUtils.defaultPin, flowsUtils.noTries);
            }else{
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    validatePin: function (pin) {
        validator.validatePin(this.localFolder, this, "addBackup", pin, flowsUtils.noTries);
    },
    
    addBackup: function (pin = flowsUtils.defaultPin, backups) {
        backups = backups || [];
        backups.push(this.backupUrl);
        const dseedCage = new DseedCage(this.localFolder);
        dseedCage.saveDseedBackups(pin, this.csbIdentifier, backups, validator.reportOrContinue(this, 'finish', "Failed to save backups"));
    },

    finish: function () {
        this.swarm("interaction", 'printInfo', this.backupUrl + ' has been successfully added to backups list.');
    }
});
},{"../../utils/DseedCage":"/opt/privatesky/modules/pskwallet/utils/DseedCage.js","../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js","../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","fs":false,"path":false}],"/opt/privatesky/modules/pskwallet/libraries/flows/addCsb.js":[function(require,module,exports){
// var path = require("path");

const utils = require("./../../utils/flowsUtils");
// const crypto = require("pskcrypto");
// var fs = require("fs");

$$.swarm.describe("addCsb", {
	start: function (aliasCsb, aliasDestCsb) {
		this.aliasCsb = aliasCsb;
		this.aliasDestCsb = aliasDestCsb;
		this.swarm("interaction", "readPin", 3);
	},
	validatePin: function (pin, noTries) {
		var self = this;
		utils.checkPinIsValid(pin, function (err) {
			if(err){
				self.swarm("interaction", "readPin", noTries-1);
			}else {
				self.addCsb(pin, self.aliasCsb);
			}
		});
	},
	addCsb: function (pin, aliasCSb, aliasDestCsb, callback) {
		var self = this;
		utils.getCsb(pin, aliasCSb, function (err, parentCsb) {
			if(err){
				self.swarm("interaction", "handleError", err, "Failed to get csb");
			}
		});
	}
});
},{"./../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js"}],"/opt/privatesky/modules/pskwallet/libraries/flows/attachFile.js":[function(require,module,exports){
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const path = require('path');
const validator = require("../../utils/validator");
const CSBIdentifier = require("../CSBIdentifier");
const HashCage = require('../../utils/HashCage');
const RootCSB = require("../RootCSB");

$$.swarm.describe("attachFile", { //url: CSB1/CSB2/aliasFile
    start: function (url, filePath, localFolder = process.cwd()) { //csb1:assetType:alias
        const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
        this.CSBPath = CSBPath;
        this.alias = alias;
        this.filePath = filePath;
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", flowsUtils.noTries);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, 'loadFileReference', pin, noTries);
    },

    withCSBIdentifier: function (id, url, filePath, localFolder = process.cwd()) {
        const {CSBPath, alias} = utils.processUrl(url, 'FileReference');
        this.CSBPath = CSBPath;
        this.alias = alias;
        this.filePath = filePath;
        this.localFolder = localFolder;
        this.csbIdentifier = new CSBIdentifier(id);
        RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, (err, rootCSB) => {
            if (err) {
                this.swarm("interaction", "handleError", err, "Failed to load rootCSB");
                return;
            }

            this.rootCSB = rootCSB;
            this.loadFileReference();

        });
    },

    loadFileReference: function () {
        this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, 'loadAsset', 'Failed to load masterCSB.'));
    },

    loadAsset: function () {
        this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, 'saveFileToDisk', 'Failed to load asset'));
    },

    saveFileToDisk: function (fileReference) {
        if (fileReference.isPersisted()) {
            this.swarm("interaction", "handleError", new Error("File is persisted"), "A file with the same alias already exists ");
            return;
        }

        const csbIdentifier = new CSBIdentifier(undefined, this.csbIdentifier.getBackupUrls());
        this.fileID = utils.generatePath(this.localFolder, csbIdentifier);
        crypto.on('progress', (progress) => {
            this.swarm('interaction', 'reportProgress', progress);
        });
        crypto.encryptStream(this.filePath, this.fileID, csbIdentifier.getDseed(), validator.reportOrContinue(this, 'saveFileReference', "Failed at file encryption.", fileReference, csbIdentifier));

    },


    saveFileReference: function (fileReference, csbIdentifier) {
        crypto.removeAllListeners('progress');
        fileReference.init(this.alias, csbIdentifier.getSeed(), csbIdentifier.getDseed());
        this.rootCSB.saveAssetToPath(this.CSBPath, fileReference, validator.reportOrContinue(this, 'computeHash', "Failed to save file", this.fileID));
    },


    computeHash: function () {
        const fileStream = fs.createReadStream(this.fileID);
        crypto.pskHashStream(fileStream, validator.reportOrContinue(this, "loadHashObj", "Failed to compute hash"));
    },

    loadHashObj: function (digest) {
        this.hashCage = new HashCage(this.localFolder);
        this.hashCage.loadHash(validator.reportOrContinue(this, "addToHashObj", "Failed to load hashObj", digest));
    },

    addToHashObj: function (hashObj, digest) {
        hashObj[path.basename(this.fileID)] = digest.toString("hex");
        this.hashCage.saveHash(hashObj, validator.reportOrContinue(this, "printSuccess", "Failed to save hashObj"));
    },

    printSuccess: function () {
        this.swarm("interaction", "printInfo", this.filePath + " has been successfully added to " + this.CSBPath);
        this.swarm("interaction", "__return__");
    }
});

},{"../../utils/HashCage":"/opt/privatesky/modules/pskwallet/utils/HashCage.js","../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","../RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","./../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js","./../../utils/utils":"/opt/privatesky/modules/pskwallet/utils/utils.js","fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/pskwallet/libraries/flows/createCsb.js":[function(require,module,exports){
const flowsUtils = require('../../utils/flowsUtils');
const RootCSB = require("../RootCSB");
const RawCSB = require("../RawCSB");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const CSBIdentifier = require("../CSBIdentifier");

$$.swarm.describe("createCsb", {
    start: function (CSBPath, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath || '';
        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.swarm("interaction", "createPin", flowsUtils.defaultPin);
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    withoutPin: function (CSBPath, backups, localFolder = process.cwd(), seed, isMaster = false) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath;
        this.isMaster = isMaster;
        if (typeof backups === 'undefined' || backups.length === 0) {
            backups = [ flowsUtils.defaultBackup ];
        }

        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.createMasterCSB(backups);
            } else {
                const csbIdentifier = new CSBIdentifier(seed);
                this.withCSBIdentifier(CSBPath, csbIdentifier);
            }
        });

    },

    withCSBIdentifier: function (CSBPath, csbIdentifier) {
        this.CSBPath = CSBPath;
        RootCSB.loadWithIdentifier(this.localFolder, csbIdentifier, validator.reportOrContinue(this, 'createCSB', 'Failed to load master with provided dseed'));
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "createCSB", pin, noTries);
    },

    loadBackups: function (pin) {
        this.pin = pin;
        this.dseedCage = new DseedCage(this.localFolder);
        this.dseedCage.loadDseedBackups(this.pin, (err, csbIdentifier, backups) => {
            if (err) {
                this.createMasterCSB();
            } else {
                this.createMasterCSB(backups);
            }
        });
    },

    createMasterCSB: function (backups) {
        this.csbIdentifier = new CSBIdentifier(undefined, backups || flowsUtils.defaultBackup);

        this.swarm("interaction", "printSensitiveInfo", this.csbIdentifier.getSeed(), flowsUtils.defaultPin);

        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset('global.CSBMeta', 'meta');
        meta.init();
        meta.setIsMaster(true);
        if (typeof this.isMaster !== 'undefined') {
            meta.setIsMaster(this.isMaster);
        }
        rawCSB.saveAsset(meta);
        this.rootCSB = RootCSB.createNew(this.localFolder, this.csbIdentifier, rawCSB);
        const nextPhase = (this.CSBPath === '' || typeof this.CSBPath === 'undefined') ? 'saveRawCSB' : 'createCSB';
        if (this.pin) {
            this.dseedCage.saveDseedBackups(this.pin, this.csbIdentifier, backups, validator.reportOrContinue(this, nextPhase, "Failed to save dseed "));
        } else {
            this[nextPhase]();
        }
    },

    createCSB: function (rootCSB) {
        this.rootCSB = this.rootCSB || rootCSB;
        const rawCSB = new RawCSB();
        const meta = rawCSB.getAsset("global.CSBMeta", "meta");
        meta.init();
        meta.setIsMaster(false);
        rawCSB.saveAsset(meta);
        this.saveRawCSB(rawCSB);
    },

    saveRawCSB: function (rawCSB) {
        this.rootCSB.saveRawCSB(rawCSB, this.CSBPath, validator.reportOrContinue(this, "printSuccess", "Failed to save raw CSB"));

    },


    printSuccess: function () {
        let message = "Successfully saved CSB at path " + this.CSBPath;
        if (!this.CSBPath || this.CSBPath === '') {
            message = 'Successfully saved CSB root';
        }
        this.swarm("interaction", "printInfo", message);
        this.swarm('interaction', '__return__');
    }
});

},{"../../utils/DseedCage":"/opt/privatesky/modules/pskwallet/utils/DseedCage.js","../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js","../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","../RawCSB":"/opt/privatesky/modules/pskwallet/libraries/RawCSB.js","../RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js"}],"/opt/privatesky/modules/pskwallet/libraries/flows/extractFile.js":[function(require,module,exports){
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const validator = require("../../utils/validator");
const CSBIdentifier = require("../CSBIdentifier");

$$.swarm.describe("extractFile", {
	start: function (url, localFolder = process.cwd()) {
		this.localFolder = localFolder;
		const {CSBPath, alias} = utils.processUrl(url, 'global.FileReference');
		this.CSBPath = CSBPath;
		this.alias = alias;
		this.swarm("interaction", "readPin", flowsUtils.noTries);
	},

	validatePin: function (pin, noTries) {
		validator.validatePin(this.localFolder, this, "loadFileAsset", pin, noTries);
	},

	loadFileAsset: function () {
		this.rootCSB.loadAssetFromPath(this.CSBPath, validator.reportOrContinue(this, "decryptFile", "Failed to load file asset " + this.alias));
	},
	
	decryptFile: function (fileReference) {
		const csbIdentifier = new CSBIdentifier(fileReference.dseed);
		const filePath = utils.generatePath(this.localFolder, csbIdentifier);

		crypto.on('progress', (progress) => {
            this.swarm('interaction', 'reportProgress', progress);
        });

		crypto.decryptStream(filePath, this.localFolder, csbIdentifier.getDseed(), (err, fileNames) => {
			if(err){
				return this.swarm("interaction", "handleError", err, "Failed to decrypt file" + filePath);
			}

			this.swarm("interaction", "printInfo", this.alias + " was successfully extracted. ");
			this.swarm("interaction", "__return__", fileNames);
		});
	}
});
},{"../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","./../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js","./../../utils/utils":"/opt/privatesky/modules/pskwallet/utils/utils.js","pskcrypto":false}],"/opt/privatesky/modules/pskwallet/libraries/flows/index.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/flows/index.js"][0].apply(exports,arguments)
},{"./addBackup":"/opt/privatesky/modules/pskwallet/libraries/flows/addBackup.js","./addCsb":"/opt/privatesky/modules/pskwallet/libraries/flows/addCsb.js","./attachFile":"/opt/privatesky/modules/pskwallet/libraries/flows/attachFile.js","./createCsb":"/opt/privatesky/modules/pskwallet/libraries/flows/createCsb.js","./extractFile":"/opt/privatesky/modules/pskwallet/libraries/flows/extractFile.js","./listCSBs":"/opt/privatesky/modules/pskwallet/libraries/flows/listCSBs.js","./receive":"/opt/privatesky/modules/pskwallet/libraries/flows/receive.js","./resetPin":"/opt/privatesky/modules/pskwallet/libraries/flows/resetPin.js","./restore":"/opt/privatesky/modules/pskwallet/libraries/flows/restore.js","./saveBackup":"/opt/privatesky/modules/pskwallet/libraries/flows/saveBackup.js","./setPin":"/opt/privatesky/modules/pskwallet/libraries/flows/setPin.js","callflow":false}],"/opt/privatesky/modules/pskwallet/libraries/flows/listCSBs.js":[function(require,module,exports){
const flowsUtils = require("./../../utils/flowsUtils");
const validator = require("../../utils/validator");
// const fs = require("fs");
const RootCSB = require("../RootCSB");
const CSBIdentifier = require("../CSBIdentifier");

$$.swarm.describe("listCSBs", {
    start: function (CSBPath, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.CSBPath = CSBPath || '';
        validator.checkMasterCSBExists(localFolder, (err, status) => {
            if (err) {
                this.swarm("interaction", "noMasterCSBExists");
            } else {
                this.swarm("interaction", "readPin", flowsUtils.noTries);
            }
        });
    },

    withCSBIdentifier: function (id, CSBPath = '', localFolder = process.cwd()) {
        this.csbIdentifier = new CSBIdentifier(id);
        this.CSBPath = CSBPath;
        this.localFolder = localFolder;
        this.loadMasterRawCSB();
    },

    loadMasterRawCSB: function () {
        RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, validator.reportOrContinue(this, "loadRawCSB", "Failed to create RootCSB."));
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, 'loadRawCSB', pin, noTries);
    },

    loadRawCSB: function (rootCSB) {
        if(typeof this.rootCSB === "undefined" && rootCSB){
            this.rootCSB = rootCSB;
        }
        this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, 'getCSBs', 'Failed to load rawCSB'));
    },

    getCSBs: function (rawCSB) {
        const csbReferences = rawCSB.getAllAssets('global.CSBReference');
        const csbsAliases = csbReferences.map((ref) => ref.alias);

        const fileReferences = rawCSB.getAllAssets('global.FileReference');
        const filesAliases = fileReferences.map((ref) => ref.alias);

        this.swarm("interaction", "__return__", {
            csbs: csbsAliases,
            files: filesAliases
        });
    }

});

},{"../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","../RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","./../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js"}],"/opt/privatesky/modules/pskwallet/libraries/flows/receive.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/flows/receive.js"][0].apply(exports,arguments)
},{}],"/opt/privatesky/modules/pskwallet/libraries/flows/resetPin.js":[function(require,module,exports){
const utils = require("./../../utils/flowsUtils");
const RootCSB = require("../RootCSB");
const DseedCage = require("../../utils/DseedCage");
const CSBIdentifier = require("../CSBIdentifier");

$$.swarm.describe("resetPin", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readSeed", utils.noTries);
    },

    validateSeed: function (seed, noTries) {
        try{
            this.csbIdentifier = new CSBIdentifier(seed);
            RootCSB.loadWithIdentifier(this.localFolder, this.csbIdentifier, (err, rootCSB) => {
                if (err) {
                    this.swarm("interaction", "readSeed", noTries - 1);
                }else{
                    this.swarm("interaction", "insertPin", utils.noTries);
                }
            });
        } catch (e) {
            return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
        }
    },

    actualizePin: function (pin) {
        const dseedCage = new DseedCage(this.localFolder);
        dseedCage.saveDseedBackups(pin, this.csbIdentifier, undefined, (err)=>{
            if(err){
                return this.swarm("interaction", "handleError", "Failed to save dseed.");
            }

            this.swarm("interaction", "printInfo", "The pin has been changed successfully.");
        });
    }
});

},{"../../utils/DseedCage":"/opt/privatesky/modules/pskwallet/utils/DseedCage.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","../RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","./../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js"}],"/opt/privatesky/modules/pskwallet/libraries/flows/restore.js":[function(require,module,exports){
const path = require("path");
const flowsUtils = require("./../../utils/flowsUtils");
const utils = require("./../../utils/utils");
const crypto = require("pskcrypto");
const fs = require("fs");
const validator = require("../../utils/validator");
const DseedCage = require("../../utils/DseedCage");
const RootCSB = require('../RootCSB');
const CSBIdentifier = require('../CSBIdentifier');
const BackupEngine = require('../BackupEngine');
const HashCage = require('../../utils/HashCage');
const AsyncDispatcher = require('../../utils/AsyncDispatcher');


$$.swarm.describe("restore", {
    start: function (url, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        if (url) {
            const {CSBPath, alias} = utils.processUrl(url, 'global.CSBReference');
            this.CSBPath = CSBPath;
            this.CSBAlias = alias;
        }

        this.swarm("interaction", "readSeed");
    },

    withSeed: function (url, localFolder = process.cwd(), seedRestore, localSeed) {
        this.localFolder = localFolder;
        if (url) {
            const {CSBPath, alias} = utils.processUrl(url, 'global.CSBReference');
            this.CSBPath = CSBPath;
            this.CSBAlias = alias;
        }

        if (localSeed) {
            this.localCSBIdentifier = new CSBIdentifier(localSeed);
        }

        this.restoreCSB(seedRestore);
    },

    restoreCSB: function (restoreSeed) {
        this.hashCage = new HashCage(this.localFolder);
        this.hashObj = {};
        this.csbRestoreIdentifier = new CSBIdentifier(restoreSeed);
        let backupUrls;
        try {
            backupUrls = this.csbRestoreIdentifier.getBackupUrls();
        } catch (e) {
            return this.swarm('interaction', 'handleError', new Error('Invalid seed'));
        }

        this.backupUrls = backupUrls;
        this.restoreDseedCage = new DseedCage(this.localFolder);
        const backupEngine = new BackupEngine.getBackupEngine(this.backupUrls);

        backupEngine.load(this.csbRestoreIdentifier, (err, encryptedCSB) => {
            if (err) {
                return this.swarm("interaction", "handleError", err, "Failed to restore CSB");
            }

            this.__addCSBHash(this.csbRestoreIdentifier, encryptedCSB);
            this.encryptedCSB = encryptedCSB;

            validator.checkMasterCSBExists(this.localFolder, (err, status) => {
                if (err) {
                    console.log(err);
                }
                if (status === false) {
                    this.createAuxFolder();
                } else if (this.localCSBIdentifier) {
                    if (!this.CSBAlias) {
                        utils.deleteRecursively(this.localFolder, true, (err) => {
                            if (err) {
                                console.log(err);
                            }
                            return this.swarm("interaction", "handleError", new Error("No CSB alias was specified"));
                        });
                    } else {
                        this.writeCSB();
                    }
                } else {
                    if (!this.CSBAlias) {
                        return this.swarm("interaction", "handleError", new Error("No CSB alias was specified"));
                    } else {
                        this.swarm("interaction", "readPin", flowsUtils.noTries);
                    }
                }
            });
        });
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "writeCSB", pin, noTries);
    },

    createAuxFolder: function () {
        fs.mkdir(path.join(this.localFolder, ".privateSky"), {recursive: true}, validator.reportOrContinue(this, "writeCSB", "Failed to create folder .privateSky"));
    },


    writeCSB: function () {
        fs.writeFile(utils.generatePath(this.localFolder, this.csbRestoreIdentifier), this.encryptedCSB, validator.reportOrContinue(this, "createRootCSB", "Failed to write masterCSB to disk"));
    },

    createRootCSB: function () {
        RootCSB.loadWithIdentifier(this.localFolder, this.csbRestoreIdentifier, validator.reportOrContinue(this, "loadRawCSB", "Failed to create rootCSB with dseed"));
    },

    loadRawCSB: function (rootCSB) {

        this.asyncDispatcher = new AsyncDispatcher(( errs, succs) => {
            this.hashCage.saveHash(this.hashObj, (err) => {
                if (err) {
                    return this.swarm('interaction', 'handleError', err, 'Failed to save hashObj');
                }
                this.swarm('interaction', 'printInfo', 'All CSBs have been restored.');
                this.swarm('interaction', '__return__');

            });
        });
        rootCSB.loadRawCSB('', validator.reportOrContinue(this, "checkCSBStatus", "Failed to load RawCSB", rootCSB));
    },

    checkCSBStatus: function (rawCSB, rootCSB) {
        this.rawCSB = rawCSB;
        const meta = this.rawCSB.getAsset('global.CSBMeta', 'meta');
        if (this.rootCSB) {
            this.attachCSB(this.rootCSB, this.CSBPath, this.CSBAlias, this.csbRestoreIdentifier);
        } else {
            if (meta.isMaster) {
                this.rootCSB = rootCSB;
                this.saveDseed();
            } else {
                this.createMasterCSB();
            }
        }
    },

    saveDseed: function () {
        this.restoreDseedCage.saveDseedBackups(flowsUtils.defaultPin, this.csbRestoreIdentifier, undefined, validator.reportOrContinue(this, "collectFiles", "Failed to save dseed", this.rawCSB, this.csbRestoreIdentifier, '', 'master'));
    },


    createMasterCSB: function () {
        const csbIdentifier = new CSBIdentifier(undefined, this.backupUrls);
        this.swarm("interaction", "printSensitiveInfo", csbIdentifier.getSeed(), flowsUtils.defaultPin);
        this.rootCSB = RootCSB.createNew(this.localFolder, csbIdentifier);
        this.restoreDseedCage.saveDseedBackups(flowsUtils.defaultPin, csbIdentifier, undefined, validator.reportOrContinue(this, "attachCSB", "Failed to save master dseed ", this.rootCSB, this.CSBPath, this.CSBAlias, this.csbRestoreIdentifier));
    },


    attachCSB: function (rootCSB, CSBPath, CSBAlias, csbIdentifier) {
        this.__attachCSB(rootCSB, CSBPath, CSBAlias, csbIdentifier, validator.reportOrContinue(this, 'loadRestoredRawCSB', 'Failed to attach rawCSB'));

    },

    loadRestoredRawCSB: function () {
        this.CSBPath = this.CSBPath.split(':')[0] + '/' + this.CSBAlias;
        this.rootCSB.loadRawCSB(this.CSBPath, validator.reportOrContinue(this, "collectFiles", "Failed to load restored RawCSB", this.csbRestoreIdentifier, this.CSBPath, this.CSBAlias));
    },

    collectFiles: function (rawCSB, csbIdentifier, currentPath, alias, callback) {

        const listFiles = rawCSB.getAllAssets('global.FileReference');
        const asyncDispatcher = new AsyncDispatcher((errs, succs) => {
            this.collectCSBs(rawCSB, csbIdentifier, currentPath, alias);
            if (callback) {
                return callback(errs, succs);
            }
        });

        if (listFiles.length === 0) {
            asyncDispatcher.markOneAsFinished();
        }

        listFiles.forEach((fileReference) => {
            const csbIdentifier = new CSBIdentifier(fileReference.dseed);
            const fileAlias = fileReference.alias;
            const urls = csbIdentifier.getBackupUrls();
            const backupEngine = BackupEngine.getBackupEngine(urls);
            asyncDispatcher.dispatchEmpty();
            backupEngine.load(csbIdentifier, (err, encryptedFile) => {
                if (err) {
                    return this.swarm('interaction', 'handleError', err, 'Could not download file ' + fileAlias);
                }

                this.__addCSBHash(csbIdentifier, encryptedFile);

                fs.writeFile(utils.generatePath(this.localFolder, csbIdentifier), encryptedFile, (err) => {
                    if (err) {
                        return this.swarm('interaction', 'handleError', err, 'Could not save file ' + fileAlias);
                    }

                    asyncDispatcher.markOneAsFinished(undefined, fileAlias);
                });
            });
        });
    },

    collectCSBs: function (rawCSB, csbIdentifier, currentPath, alias) {

        const listCSBs = rawCSB.getAllAssets('global.CSBReference');
        const nextArguments = [];
        let counter = 0;

        if (listCSBs.length === 0) {
            this.asyncDispatcher.dispatchEmpty();
            this.asyncDispatcher.markOneAsFinished();
        }

        if (listCSBs && listCSBs.length > 0) {
            listCSBs.forEach((CSBReference) => {
                const nextPath = currentPath + '/' + CSBReference.alias;
                const nextCSBIdentifier = new CSBIdentifier(CSBReference.dseed);
                const nextAlias = CSBReference.alias;
                const nextURLs = csbIdentifier.getBackupUrls();
                const backupEngine = BackupEngine.getBackupEngine(nextURLs);
                this.asyncDispatcher.dispatchEmpty();
                backupEngine.load(nextCSBIdentifier, (err, encryptedCSB) => {
                    if (err) {
                        return this.swarm('interaction', 'handleError', err, 'Could not download CSB ' + nextAlias);
                    }

                    this.__addCSBHash(nextCSBIdentifier, encryptedCSB);

                    fs.writeFile(utils.generatePath(this.localFolder, nextCSBIdentifier), encryptedCSB, (err) => {
                        if (err) {
                            return this.swarm('interaction', 'handleError', err, 'Could not save CSB ' + nextAlias);
                        }

                        this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {

                            if (err) {
                                return this.swarm('interaction', 'handleError', err, 'Failed to load CSB ' + nextAlias);
                            }
                            nextArguments.push([ nextRawCSB, nextCSBIdentifier, nextPath, nextAlias ]);

                            if (++counter === listCSBs.length) {
                                nextArguments.forEach((args) => {
                                    this.collectFiles(...args, () => {
                                        this.asyncDispatcher.markOneAsFinished(undefined, alias);
                                    });
                                });
                            }
                        });
                    });
                });
            });
        }
    },

    __tryDownload(urls, csbIdentifier, index, callback) {
        if (index === urls.length) {
            return callback(new Error('Could not download resource'));
        }

        const url = urls[index];
        this.backupEngine.load(url, csbIdentifier, (err, resource) => {
            if (err) {
                return this.__tryDownload(urls, csbIdentifier, ++index, callback);
            }

            callback(undefined, resource);
        });

    },

    __addCSBHash: function (csbIdentifier, encryptedCSB) {
        const pskHash = new crypto.PskHash();
        pskHash.update(encryptedCSB);
        this.hashObj[csbIdentifier.getUid()] = pskHash.digest().toString('hex');

    },

    __attachCSB: function (rootCSB, CSBPath, CSBAlias, csbIdentifier, callback) {
        if (!CSBAlias) {
            return callback(new Error("No CSB alias was specified"));
        }

        rootCSB.loadRawCSB(CSBPath, (err, rawCSB) => {
            if (err) {
                rootCSB.loadAssetFromPath(CSBPath, (err, csbRef) => {
                    if (err) {
                        return callback(err);
                    }

                    csbRef.init(CSBAlias, csbIdentifier.getSeed(), csbIdentifier.getDseed());
                    rootCSB.saveAssetToPath(CSBPath, csbRef, (err) => {
                        if (err) {
                            return callback(err);
                        }

                        callback();
                    });

                });
            } else {
                return callback(new Error(`A CSB having the alias ${CSBAlias} already exists.`));
            }
        });
    }
});


},{"../../utils/AsyncDispatcher":"/opt/privatesky/modules/pskwallet/utils/AsyncDispatcher.js","../../utils/DseedCage":"/opt/privatesky/modules/pskwallet/utils/DseedCage.js","../../utils/HashCage":"/opt/privatesky/modules/pskwallet/utils/HashCage.js","../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","../BackupEngine":"/opt/privatesky/modules/pskwallet/libraries/BackupEngine.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","../RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","./../../utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js","./../../utils/utils":"/opt/privatesky/modules/pskwallet/utils/utils.js","fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/pskwallet/libraries/flows/saveBackup.js":[function(require,module,exports){
const utils = require("./../../utils/utils");
const fs = require("fs");
const validator = require("../../utils/validator");
const HashCage = require('../../utils/HashCage');
const AsyncDispatcher = require("../../utils/AsyncDispatcher");
const RootCSB = require('../RootCSB');
const CSBIdentifier = require('../CSBIdentifier');
const BackupEngine = require('../BackupEngine');
const path = require('path');


$$.swarm.describe("saveBackup", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", 3);
    },

    validatePin: function (pin, noTries) {
        validator.validatePin(this.localFolder, this, "loadHashFile", pin, noTries);
    },

    withCSBIdentifier: function (id, localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.csbIdentifier = new CSBIdentifier(id);
        RootCSB.loadWithIdentifier(localFolder, this.csbIdentifier, (err, rootCSB) => {
            if (err) {
                this.swarm('interaction', 'handleError', err, 'Failed to load root CSB');
                return;
            }

            this.rootCSB = rootCSB;
            this.loadHashFile();
        });
    },

    loadHashFile: function (pin, backups) {
        this.backups = backups;
        this.hashCage = new HashCage(this.localFolder);
        this.hashCage.loadHash(validator.reportOrContinue(this, 'readEncryptedMaster', 'Failed to load hash file'));
    },

    readEncryptedMaster: function (hashFile) {
        this.hashFile = hashFile;
        this.masterID = utils.generatePath(this.localFolder, this.csbIdentifier);
        fs.readFile(this.masterID, validator.reportOrContinue(this, 'loadMasterRawCSB', 'Failed to read masterCSB.'));
    },


    loadMasterRawCSB: function () {
        this.rootCSB.loadRawCSB('', validator.reportOrContinue(this, "dispatcher", "Failed to load masterCSB"));
    },

    dispatcher: function (rawCSB) {
        this.asyncDispatcher = new AsyncDispatcher((errors, results) => {
            if (errors) {
                this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect all CSBs');
                return;
            }
            this.collectFiles(results);
        });

        this.asyncDispatcher.dispatchEmpty();
        this.collectCSBs(rawCSB, this.csbIdentifier, '', 'master');
    },

    collectCSBs: function (rawCSB, csbIdentifier, currentPath, alias) {
        const listCSBs = rawCSB.getAllAssets('global.CSBReference');

        const nextArguments = [];
        let counter = 0;

        listCSBs.forEach((CSBReference) => {
            const nextPath = currentPath + '/' + CSBReference.alias;
            const nextCSBIdentifier = new CSBIdentifier(CSBReference.dseed);
            const nextAlias = CSBReference.alias;
            this.rootCSB.loadRawCSB(nextPath, (err, nextRawCSB) => {
                if (err) {
                    console.log(err);
                }
                nextArguments.push([ nextRawCSB, nextCSBIdentifier, nextPath, nextAlias ]);
                if (++counter === listCSBs.length) {
                    nextArguments.forEach((args) => {
                        this.asyncDispatcher.dispatchEmpty();
                        this.collectCSBs(...args);
                    });
                    this.asyncDispatcher.markOneAsFinished(undefined, {rawCSB, csbIdentifier, alias});
                }
            });
        });

        if (listCSBs.length === 0) {
            this.asyncDispatcher.markOneAsFinished(undefined, {rawCSB, csbIdentifier, alias});
        }
    },

    collectFiles: function (collectedCSBs) {
        this.asyncDispatcher = new AsyncDispatcher((errors, newResults) => {
            if (errors) {
                this.swarm('interaction', 'handleError', JSON.stringify(errors, null, '\t'), 'Failed to collect files attached to CSBs');
            }

            if (!newResults) {
                newResults = [];
            }
            this.__categorize(collectedCSBs.concat(newResults));
        });

        this.asyncDispatcher.dispatchEmpty(collectedCSBs.length);
        collectedCSBs.forEach(({rawCSB, csbIdentifier, alias}) => {
            this.__collectFiles(rawCSB, alias);
        });

    },

    __categorize: function (files) {
        const categories = {};
        let backups;
        files.forEach(({csbIdentifier, alias}) => {
            if (!this.backups || this.backups.length === 0) {
                backups = csbIdentifier.getBackupUrls();
            } else {
                backups = this.backups;
            }
            const uid = csbIdentifier.getUid();
            categories[uid] = {backups, alias};
        });

        this.asyncDispatcher = new AsyncDispatcher((errors, successes) => {
            this.swarm('interaction', 'csbBackupReport', {errors, successes});
        });

        this.backupEngine = BackupEngine.getBackupEngine(backups);
        this.filterFiles(categories);
        // Object.entries(categories).forEach(([uid, {alias, backups}]) => {
        //     this.filterFiles(uid, alias, backups);
        // });
    },

    filterFiles: function (filesBackups) {
        const filesToUpdate = {};
        Object.keys(this.hashFile).forEach((uid) => {
            if (filesBackups[uid]) {
                filesToUpdate[uid] = this.hashFile[uid];
            }
        });

        this.asyncDispatcher.dispatchEmpty();
        this.backupEngine.compareVersions(filesToUpdate, (err, modifiedFiles) => {
            if (err) {
                return this.swarm("interaction", "handleError", err, "Failed to retrieve list of modified files");
            }

            this.__backupFiles(JSON.parse(modifiedFiles), filesBackups);
        });
    },

    __backupFiles: function (files, filesBackups) {
        this.asyncDispatcher.dispatchEmpty(files.length);
        files.forEach((file) => {
            const fileStream = fs.createReadStream(path.join(this.localFolder, file));
            const backupUrls = filesBackups[file].backups;
            const backupEngine = BackupEngine.getBackupEngine(backupUrls);
            backupEngine.save(new CSBIdentifier(file), fileStream, (err, url) => {
                if (err) {
                    return  this.asyncDispatcher.markOneAsFinished({alias: filesBackups[file].alias, backupURL: url});
                }

                this.asyncDispatcher.markOneAsFinished(undefined, {alias: filesBackups[file].alias, backupURL: url});
            });
        });

        this.asyncDispatcher.markOneAsFinished(); // for http request to compareVersions
    },

    __collectFiles: function (rawCSB, csbAlias) {
        const files = rawCSB.getAllAssets('global.FileReference');
        this.asyncDispatcher.dispatchEmpty(files.length);
        files.forEach((FileReference) => {
            const alias = FileReference.alias;
            const csbIdentifier = new CSBIdentifier(FileReference.dseed);
            this.asyncDispatcher.markOneAsFinished(undefined, {csbIdentifier, alias});
        });
        this.asyncDispatcher.markOneAsFinished();
    }
});


},{"../../utils/AsyncDispatcher":"/opt/privatesky/modules/pskwallet/utils/AsyncDispatcher.js","../../utils/HashCage":"/opt/privatesky/modules/pskwallet/utils/HashCage.js","../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js","../BackupEngine":"/opt/privatesky/modules/pskwallet/libraries/BackupEngine.js","../CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","../RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","./../../utils/utils":"/opt/privatesky/modules/pskwallet/utils/utils.js","fs":false,"path":false}],"/opt/privatesky/modules/pskwallet/libraries/flows/setPin.js":[function(require,module,exports){
const validator = require("../../utils/validator");
const DseedCage = require('../../utils/DseedCage');

$$.swarm.describe("setPin", {
    start: function (localFolder = process.cwd()) {
        this.localFolder = localFolder;
        this.swarm("interaction", "readPin", 3);
    },

    validatePin: function (oldPin, noTries) {
        this.oldPin = oldPin;
        validator.validatePin(this.localFolder, this, "interactionJumper", oldPin, noTries);
    },

    interactionJumper: function () {
        this.swarm("interaction", "enterNewPin");
    },

    actualizePin: function (newPin) {
        this.dseedCage = new DseedCage(this.localFolder);
        this.dseedCage.loadDseedBackups(this.oldPin, validator.reportOrContinue(this, "saveDseed", "Failed to load dseed.", newPin));
    },

    saveDseed: function (csbIdentifier, backups, pin) {
        this.dseedCage.saveDseedBackups(pin, csbIdentifier, backups, validator.reportOrContinue(this, "successState", "Failed to save dseed"));
    },

    successState: function () {
        this.swarm("interaction", "printInfo", "The pin has been successfully changed.");
    }
});
},{"../../utils/DseedCage":"/opt/privatesky/modules/pskwallet/utils/DseedCage.js","../../utils/validator":"/opt/privatesky/modules/pskwallet/utils/validator.js"}],"/opt/privatesky/modules/pskwallet/utils/AsyncDispatcher.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/utils/AsyncDispatcher.js"][0].apply(exports,arguments)
},{}],"/opt/privatesky/modules/pskwallet/utils/DseedCage.js":[function(require,module,exports){
(function (Buffer){
const crypto = require('pskcrypto');
const path = require('path');
const fs = require("fs");
const CSBIdentifier = require("../libraries/CSBIdentifier");

function DseedCage(localFolder) {
	const dseedFolder = path.join(localFolder, '.privateSky');
	const dseedPath = path.join(dseedFolder, 'dseed');

	function loadDseedBackups(pin, callback) {
		fs.mkdir(dseedFolder, {recursive: true}, (err) => {
			if (err) {
				return callback(err);
			}

			crypto.loadData(pin, dseedPath, (err, dseedBackups) => {
				if (err) {
					return callback(err);
				}
				try{
					dseedBackups = JSON.parse(dseedBackups.toString());
				}catch (e) {
					return callback(e);
				}

				let csbIdentifier;
				if (dseedBackups.dseed && !Buffer.isBuffer(dseedBackups.dseed)) {
					dseedBackups.dseed = Buffer.from(dseedBackups.dseed);
					csbIdentifier = new CSBIdentifier(dseedBackups.dseed);
				}

				callback(undefined, csbIdentifier, dseedBackups.backups);
			});
		});
	}

	function saveDseedBackups(pin, csbIdentifier, backups, callback) {
		fs.mkdir(dseedFolder, {recursive: true}, (err) => {
			if (err) {
				return callback(err);
			}

			let dseed;
			if(csbIdentifier){
				dseed = csbIdentifier.getDseed();
			}
			const dseedBackups = JSON.stringify({
				dseed,
				backups
			});

			crypto.saveData(Buffer.from(dseedBackups), pin, dseedPath, callback);
		});
	}


	return {
		loadDseedBackups,
		saveDseedBackups,
	};
}


module.exports = DseedCage;
}).call(this,require("buffer").Buffer)

},{"../libraries/CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","buffer":false,"fs":false,"path":false,"pskcrypto":false}],"/opt/privatesky/modules/pskwallet/utils/HashCage.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/utils/HashCage.js"][0].apply(exports,arguments)
},{"fs":false,"path":false}],"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js":[function(require,module,exports){
// const path = require("path");


exports.defaultBackup = "http://localhost:8080";
exports.defaultPin = "12345678";
exports.noTries = 3;


},{}],"/opt/privatesky/modules/pskwallet/utils/utils.js":[function(require,module,exports){
arguments[4]["/opt/privatesky/modules/csb/utils/utils.js"][0].apply(exports,arguments)
},{"fs":false,"path":false}],"/opt/privatesky/modules/pskwallet/utils/validator.js":[function(require,module,exports){
const RootCSB = require("../libraries/RootCSB");
const fs = require("fs");
const path = require("path");


module.exports.validatePin = function (localFolder, swarm, phaseName, pin, noTries, ...args) {
	RootCSB.createRootCSB(localFolder, undefined, undefined, pin, (err, rootCSB, csbIdentifier, backups) =>{
		if(err){
			swarm.swarm("interaction", "readPin", noTries - 1);
		}else{
			if(csbIdentifier){
				swarm.rootCSB = rootCSB;
				swarm.csbIdentifier = csbIdentifier;
			}
			args.push(backups);
			swarm[phaseName](pin, ...args);
		}
	});
};

module.exports.reportOrContinue = function(swarm, phaseName, errorMessage, ...args){
	return function(err,...res) {
		if (err) {
			swarm.swarm("interaction", "handleError", err, errorMessage);
		} else {
			if (phaseName) {
					swarm[phaseName](...res, ...args);
			}
		}
	};
};

module.exports.checkMasterCSBExists = function (localFolder, callback) {
	fs.stat(path.join(localFolder, ".privateSky/hash"), (err, stats)=>{
		if(err){
			return callback(err, false);
		}

		return callback(undefined, true);
	});
};
},{"../libraries/RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","fs":false,"path":false}],"/opt/privatesky/modules/signsensus/lib/consUtil.js":[function(require,module,exports){
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

},{"pskcrypto":false}],"/opt/privatesky/node_modules/is-buffer/index.js":[function(require,module,exports){
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

},{}],"/opt/privatesky/psknode/core/sandboxes/util/SandBoxManager.js":[function(require,module,exports){
var mq = $$.require("foldermq");

const path = require('path');
const child_process = require("child_process");
const fs = require('fs');

const RESTART_TIMEOUT = 500;
const RESTART_TIMEOUT_LIMIT = 50000;

var sandboxes = {};
var exitHandler = require("../../utils/exitHandler")(sandboxes);

var bootSandBox = $$.flow.describe("PrivateSky.swarm.engine.bootInLauncher", {
    boot:function(sandBox, spaceName, folder, codeFolder, callback){
        // console.log("Booting in ", folder, " context ", spaceName);

        this.callback   = callback;
        this.folder     = folder;
        this.spaceName  = spaceName;
        this.sandBox    = sandBox;
        this.codeFolder    = codeFolder;
        this.timeoutMultiplier = 1;

        var task = this.serial(this.ensureFoldersExists);

        task.folderShouldExist(path.join(this.folder, "mq"),    task.progress);
        task.folderShouldExist(path.join(this.folder, "bundles"),  task.progress);
        task.folderShouldExist(path.join(this.folder, "tmp"),   task.progress);
    },
    folderShouldExist:  function(path, progress){
        fs.mkdir(path, {recursive: true}, progress);
    },
    copyFolder: function(sourcePath, targetPath, callback){
        let fsExt = require("utils").fsExt;
        try{
            fsExt.copy(sourcePath, targetPath, {overwrite: true}, callback);
        }catch(err){
            console.log("Got something...", err);
        }
    },
    ensureFoldersExists: function(err, res){
        if(err){
            console.log(err);
        } else {
            var task = this.parallel(this.runCode);
            this.sandBox.inbound = mq.createQue(path.join(this.folder, "mq/inbound"), this.progress);
            this.sandBox.outbound = mq.createQue(path.join(this.folder, "mq/outbound"), this.progress);

            console.log("Preparing to copy", path.join(this.codeFolder, "bundles"), path.resolve(path.join(this.folder, "bundles")));
            this.copyFolder(path.join(this.codeFolder, "bundles"), path.resolve(path.join(this.folder, "bundles")), task.progress);
        }

    },
    runCode: function(err, res){
        if(!err){
            var mainFile = path.join(process.env.PRIVATESKY_ROOT_FOLDER, "core", "sandboxes", "agentSandbox.js");
            var args = [this.spaceName, process.env.PRIVATESKY_ROOT_FOLDER, path.resolve(process.env.PRIVATESKY_DOMAIN_BUILD)];
            var opts = {stdio: [0, 1, 2, "ipc"]};

            var startChild = (mainFile, args, opts) => {
				console.log("Running: ", mainFile, args, opts);

				// passing options.env might break the agentSandbox, it relies on some inherited env variables from domain
				var child = child_process.fork(mainFile, args);
				sandboxes[this.spaceName] = child;

				this.sandBox.inbound.setIPCChannel(child);
				this.sandBox.outbound.setIPCChannel(child);

				child.on("exit", (code, signal)=>{
				    if(code === 0){
				        console.log(`Sandbox <${this.spaceName}> shutting down.`);
				        return;
                    }
				    let timeout = (this.timeoutMultiplier*RESTART_TIMEOUT) % RESTART_TIMEOUT_LIMIT;
				    console.log(`Sandbox <${this.spaceName}> exits with code ${code}. Restarting in ${timeout} ms.`);
					setTimeout(()=>{
						startChild(mainFile, args, opts);
                        this.timeoutMultiplier *= 1.5;
                    }, timeout);
				});

				return child;
            };

            this.callback(null, startChild(mainFile, args, opts));
        } else {
            console.log("Error executing sandbox!:", err);
            this.callback(err, null);
        }
    }

});

function SandBoxHandler(spaceName, folder, codeFolder, resultCallBack){

    var self = this;
    var mqHandler;


    bootSandBox().boot(this, spaceName,folder, codeFolder, function(err, childProcess){
        if(!err){
            self.childProcess = childProcess;


            /*self.outbound.registerConsumer(function(err, swarm){
                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, swarm);
            });*/

            self.outbound.registerAsIPCConsumer(function(err, swarm){
                $$.PSK_PubSub.publish($$.CONSTANTS.SWARM_FOR_EXECUTION, swarm);
            });

            mqHandler = self.inbound.getHandler();
            if(pendingMessages.length){
                pendingMessages.map(function(item){
                    self.send(item);
                });
                pendingMessages = null;
            }
        }
    });

    var pendingMessages = [];

    this.send = function (swarm, callback) {
        if(mqHandler){
            mqHandler.sendSwarmForExecution(swarm, callback);
        } else {
            pendingMessages.push(swarm); //TODO: well, a deep clone will not be a better idea?
        }
    }

}


function SandBoxManager(sandboxesFolder, codeFolder, callback){
    var self = this;

    var sandBoxes = {

    };
    function belongsToReplicatedSpace(){
        return true;
    }

    //console.log("Subscribing to:", $$.CONSTANTS.SWARM_FOR_EXECUTION);
    $$.PSK_PubSub.subscribe($$.CONSTANTS.SWARM_FOR_EXECUTION, function(swarm){
        console.log("Executing in sandbox towards: ", swarm.meta.target);

        if(swarm.meta.target == "system" || swarm.meta.command == "asyncReturn"){
            $$.swarmsInstancesManager.revive_swarm(swarm);
            //$$.swarms.restart(swarm.meta.swarmTypeName, swarm);
        } else
        if(swarm.meta.target == "pds"){
            //
        } else
        if(belongsToReplicatedSpace(swarm.meta.target)){
            self.pushToSpaceASwarm(swarm.meta.target, swarm);
        } else {
            //TODO: send towards network
        }

    });


    function startSandBox(spaceName){
        var sandBox = new SandBoxHandler(spaceName, path.join(sandboxesFolder, spaceName), codeFolder);
        sandBoxes[spaceName] = sandBox;
        return sandBox;
    }


    this.pushToSpaceASwarm = function(spaceName, swarm, callback){

        console.log("pushToSpaceASwarm " , spaceName);
        var sandbox = sandBoxes[spaceName];
        if(!sandbox){
            sandbox = sandBoxes[spaceName] = startSandBox(spaceName);
        }
        sandbox.send(swarm, callback);
    }

    callback(null, this);
}


exports.create = function(folder, codeFolder, callback){
    new SandBoxManager(folder, codeFolder, callback);
};



},{"../../utils/exitHandler":"/opt/privatesky/psknode/core/utils/exitHandler.js","child_process":false,"fs":false,"path":false,"utils":false}],"/opt/privatesky/psknode/core/utils/exitHandler.js":[function(require,module,exports){
const events = ["exit", "SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM", "SIGHUP"];

module.exports = function manageShutdownProcess(childrenList){

    let shutting = false;
    function handler(){
        //console.log("Handling exit event on", process.pid, "arguments:", arguments);
        var childrenNames = Object.keys(childrenList);
        for(let j=0; j<childrenNames.length; j++){
            var child = childrenList[childrenNames[j]];
            //console.log(`[${process.pid}]`, "Sending kill signal to PID:", child.pid);
            try{
                process.kill(child.pid);
            }catch(err){
                //...
            }
        }

        if(!shutting){
            try{
                process.stdout.cursorTo(0);
                process.stdout.write(`[PID: ${process.pid}] [Timestamp: ${new Date().getTime()}] [Process argv: ${process.argv}]- Shutting down...\n`);
            }catch(err)
            {
                //...
            }
            shutting = true;
        }

        setTimeout(()=>{
            process.exit(0);
        }, 0);
    }

    process.stdin.resume();
    for(let i=0; i<events.length; i++){
        var eventType = events[i];
        process.on(eventType, handler);
    }
    //console.log("Exit handler setup!", `[${process.pid}]`);
};
},{}],"agentBase":[function(require,module,exports){
exports.agentPubSub = require("./agentPubSub");
},{"./agentPubSub":"/opt/privatesky/libraries/agentBase/agentPubSub.js"}],"bar":[function(require,module,exports){
module.exports.Brick = require("./lib/Brick");
module.exports.Archive = require("./lib/Archive");
module.exports.FolderBarMap = require("./lib/FolderBarMap");
module.exports.createFsBarWorker = require("./lib/FsBarWorker").createFsBarWorker;
const ArchiveConfigurator = require("./lib/ArchiveConfigurator");
const createFolderBrickStorage = require("./lib/FolderBrickStorage").createFolderBrickStorage;
const createFileBrickStorage = require("./lib/FileBrickStorage").createFileBrickStorage;
ArchiveConfigurator.prototype.registerStorageProvider("FolderBrickStorage", createFolderBrickStorage);
ArchiveConfigurator.prototype.registerStorageProvider("FileBrickStorage", createFileBrickStorage);
module.exports.ArchiveConfigurator = ArchiveConfigurator;


},{"./lib/Archive":"/opt/privatesky/modules/bar/lib/Archive.js","./lib/ArchiveConfigurator":"/opt/privatesky/modules/bar/lib/ArchiveConfigurator.js","./lib/Brick":"/opt/privatesky/modules/bar/lib/Brick.js","./lib/FileBrickStorage":"/opt/privatesky/modules/bar/lib/FileBrickStorage.js","./lib/FolderBarMap":"/opt/privatesky/modules/bar/lib/FolderBarMap.js","./lib/FolderBrickStorage":"/opt/privatesky/modules/bar/lib/FolderBrickStorage.js","./lib/FsBarWorker":"/opt/privatesky/modules/bar/lib/FsBarWorker.js"}],"buffer-crc32":[function(require,module,exports){
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

},{"buffer":false}],"csb":[function(require,module,exports){
module.exports.RootCSB = RootCSB;
module.exports.RawCSB = require('./lib/RawCSB');
module.exports.CSBIdentifier = require('./lib/CSBIdentifier');
$$.loadLibrary("csb", require("./flows/index"));



},{"./flows/index":"/opt/privatesky/modules/csb/flows/index.js","./lib/CSBIdentifier":"/opt/privatesky/modules/csb/lib/CSBIdentifier.js","./lib/RawCSB":"/opt/privatesky/modules/csb/lib/RawCSB.js"}],"domainBase":[function(require,module,exports){
exports.domainPubSub = require("./domainPubSub");
},{"./domainPubSub":"/opt/privatesky/libraries/domainBase/domainPubSub.js"}],"edfs-brick-storage":[function(require,module,exports){
const bar = require("bar");
const ArchiveConfigurator = bar.ArchiveConfigurator;
const createEDFSBrickStorage = require("./EDFSBrickStorage").createEDFSBrickStorage;
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
module.exports.createEDFSBrickStorage = createEDFSBrickStorage;

},{"./EDFSBrickStorage":"/opt/privatesky/modules/edfs-brick-storage/EDFSBrickStorage.js","bar":"bar"}],"edfs":[function(require,module,exports){
module.exports.EDFSMiddleware = require("./lib/EDFSMiddleware");



},{"./lib/EDFSMiddleware":"/opt/privatesky/modules/edfs/lib/EDFSMiddleware.js"}],"foldermq":[function(require,module,exports){
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
},{"./lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/SoundPubSubMQBasedInteractionSpace.js","./lib/interactionSpaceImpl/WebViewMQInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/WebViewMQInteractionSpace.js","./lib/interactionSpaceImpl/WindowMQInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/WindowMQInteractionSpace.js","./lib/interactionSpaceImpl/folderMQBasedInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/folderMQBasedInteractionSpace.js","./lib/interactionSpaceImpl/httpInteractionSpace":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/httpInteractionSpace.js","./lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWebViewMQ.js","./lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ":"/opt/privatesky/modules/interact/lib/interactionSpaceImpl/specificMQImpl/ChildWndMQ.js"}],"node-fd-slicer":[function(require,module,exports){
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

},{"./lib/Blockchain":"/opt/privatesky/modules/pskdb/lib/Blockchain.js","./lib/FolderPersistentPDS":"/opt/privatesky/modules/pskdb/lib/FolderPersistentPDS.js","./lib/InMemoryPDS":"/opt/privatesky/modules/pskdb/lib/InMemoryPDS.js","./lib/PersistentPDS":"/opt/privatesky/modules/pskdb/lib/PersistentPDS.js","./lib/domain":"/opt/privatesky/modules/pskdb/lib/domain/index.js","./lib/swarms":"/opt/privatesky/modules/pskdb/lib/swarms/index.js"}],"pskwallet":[function(require,module,exports){
module.exports.utils  = require("./utils/flowsUtils");
const RootCSB = require('./libraries/RootCSB');
module.exports.createRootCSB = RootCSB.createRootCSB;
module.exports.loadWithIdentifier = RootCSB.loadWithIdentifier;
module.exports.loadWithPin   = RootCSB.loadWithPin;
module.exports.writeNewMasterCSB = RootCSB.writeNewMasterCSB;
module.exports.RootCSB = RootCSB;
module.exports.RawCSB = require('./libraries/RawCSB');
module.exports.CSBIdentifier = require('./libraries/CSBIdentifier');
module.exports.init = function () {
	$$.loadLibrary("pskwallet", require("./libraries/flows/index"));
};


},{"./libraries/CSBIdentifier":"/opt/privatesky/modules/pskwallet/libraries/CSBIdentifier.js","./libraries/RawCSB":"/opt/privatesky/modules/pskwallet/libraries/RawCSB.js","./libraries/RootCSB":"/opt/privatesky/modules/pskwallet/libraries/RootCSB.js","./libraries/flows/index":"/opt/privatesky/modules/pskwallet/libraries/flows/index.js","./utils/flowsUtils":"/opt/privatesky/modules/pskwallet/utils/flowsUtils.js"}],"signsensus":[function(require,module,exports){
module.exports = {
    consUtil: require('./consUtil')
};
},{"./consUtil":"/opt/privatesky/modules/signsensus/lib/consUtil.js"}],"yauzl":[function(require,module,exports){
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

},{"buffer":false,"buffer-crc32":"buffer-crc32","events":false,"fs":false,"stream":false,"timers":false,"util":false,"zlib":false}]},{},["/opt/privatesky/builds/tmp/psknode_intermediar.js"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZHMvdG1wL3Bza25vZGVfaW50ZXJtZWRpYXIuanMiLCJsaWJyYXJpZXMvYWdlbnRCYXNlL2FnZW50UHViU3ViLmpzIiwibGlicmFyaWVzL2RvbWFpbkJhc2UvZG9tYWluUHViU3ViLmpzIiwibW9kdWxlcy9iYXIvbGliL0FyY2hpdmUuanMiLCJtb2R1bGVzL2Jhci9saWIvQXJjaGl2ZUNvbmZpZ3VyYXRvci5qcyIsIm1vZHVsZXMvYmFyL2xpYi9Ccmljay5qcyIsIm1vZHVsZXMvYmFyL2xpYi9GaWxlQmFyTWFwLmpzIiwibW9kdWxlcy9iYXIvbGliL0ZpbGVCcmlja1N0b3JhZ2UuanMiLCJtb2R1bGVzL2Jhci9saWIvRm9sZGVyQmFyTWFwLmpzIiwibW9kdWxlcy9iYXIvbGliL0ZvbGRlckJyaWNrU3RvcmFnZS5qcyIsIm1vZHVsZXMvYmFyL2xpYi9Gc0Jhcldvcmtlci5qcyIsIm1vZHVsZXMvYmFyL3V0aWxzL0FzeW5jRGlzcGF0Y2hlci5qcyIsIm1vZHVsZXMvYmFyL3V0aWxzL2lzU3RyZWFtLmpzIiwibW9kdWxlcy9jc2IvZmxvd3MvYWRkQmFja3VwLmpzIiwibW9kdWxlcy9jc2IvZmxvd3MvYWRkQ3NiLmpzIiwibW9kdWxlcy9jc2IvZmxvd3MvYXR0YWNoRmlsZS5qcyIsIm1vZHVsZXMvY3NiL2Zsb3dzL2NyZWF0ZUNzYi5qcyIsIm1vZHVsZXMvY3NiL2Zsb3dzL2V4dHJhY3RGaWxlLmpzIiwibW9kdWxlcy9jc2IvZmxvd3MvaW5kZXguanMiLCJtb2R1bGVzL2NzYi9mbG93cy9saXN0Q1NCcy5qcyIsIm1vZHVsZXMvY3NiL2Zsb3dzL3JlY2VpdmUuanMiLCJtb2R1bGVzL2NzYi9mbG93cy9yZXNldFBpbi5qcyIsIm1vZHVsZXMvY3NiL2Zsb3dzL3Jlc3RvcmUuanMiLCJtb2R1bGVzL2NzYi9mbG93cy9zYXZlQmFja3VwLmpzIiwibW9kdWxlcy9jc2IvZmxvd3Mvc2V0UGluLmpzIiwibW9kdWxlcy9jc2IvbGliL0JhY2t1cEVuZ2luZS5qcyIsIm1vZHVsZXMvY3NiL2xpYi9DU0JJZGVudGlmaWVyLmpzIiwibW9kdWxlcy9jc2IvbGliL0hlYWRlci5qcyIsIm1vZHVsZXMvY3NiL2xpYi9IZWFkZXJzSGlzdG9yeS5qcyIsIm1vZHVsZXMvY3NiL2xpYi9SYXdDU0IuanMiLCJtb2R1bGVzL2NzYi9saWIvUm9vdENTQi5qcyIsIm1vZHVsZXMvY3NiL2xpYi9iYWNrdXBSZXNvbHZlcnMvRVZGU1Jlc29sdmVyLmpzIiwibW9kdWxlcy9jc2IvdXRpbHMvQXN5bmNEaXNwYXRjaGVyLmpzIiwibW9kdWxlcy9jc2IvdXRpbHMvRHNlZWRDYWdlLmpzIiwibW9kdWxlcy9jc2IvdXRpbHMvSGFzaENhZ2UuanMiLCJtb2R1bGVzL2NzYi91dGlscy9mbG93c1V0aWxzLmpzIiwibW9kdWxlcy9jc2IvdXRpbHMvdXRpbHMuanMiLCJtb2R1bGVzL2NzYi91dGlscy92YWxpZGF0b3IuanMiLCJtb2R1bGVzL2VkZnMtYnJpY2stc3RvcmFnZS9FREZTQnJpY2tTdG9yYWdlLmpzIiwibW9kdWxlcy9lZGZzL2Zsb3dzL0JyaWNrc01hbmFnZXIuanMiLCJtb2R1bGVzL2VkZnMvbGliL0VERlNNaWRkbGV3YXJlLmpzIiwibW9kdWxlcy9lZGZzL3V0aWxzL0FzeW5jRGlzcGF0Y2hlci5qcyIsIm1vZHVsZXMvZm9sZGVybXEvbGliL2ZvbGRlck1RLmpzIiwibW9kdWxlcy9pbnRlcmFjdC9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvU291bmRQdWJTdWJNUUJhc2VkSW50ZXJhY3Rpb25TcGFjZS5qcyIsIm1vZHVsZXMvaW50ZXJhY3QvbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL1dlYlZpZXdNUUludGVyYWN0aW9uU3BhY2UuanMiLCJtb2R1bGVzL2ludGVyYWN0L2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9XaW5kb3dNUUludGVyYWN0aW9uU3BhY2UuanMiLCJtb2R1bGVzL2ludGVyYWN0L2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9mb2xkZXJNUUJhc2VkSW50ZXJhY3Rpb25TcGFjZS5qcyIsIm1vZHVsZXMvaW50ZXJhY3QvbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL2h0dHBJbnRlcmFjdGlvblNwYWNlLmpzIiwibW9kdWxlcy9pbnRlcmFjdC9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvc3BlY2lmaWNNUUltcGwvQ2hpbGRXZWJWaWV3TVEuanMiLCJtb2R1bGVzL2ludGVyYWN0L2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9zcGVjaWZpY01RSW1wbC9DaGlsZFduZE1RLmpzIiwibW9kdWxlcy9pbnRlcmFjdC9saWIvc3dhcm1JbnRlcmFjdGlvbi5qcyIsIm1vZHVsZXMvbm9kZS1mZC1zbGljZXIvbW9kdWxlcy9ub2RlLXBlbmQvaW5kZXguanMiLCJtb2R1bGVzL3Bzay1odHRwLWNsaWVudC9saWIvcHNrLWFic3RyYWN0LWNsaWVudC5qcyIsIm1vZHVsZXMvcHNrLWh0dHAtY2xpZW50L2xpYi9wc2stYnJvd3Nlci1jbGllbnQuanMiLCJtb2R1bGVzL3Bzay1odHRwLWNsaWVudC9saWIvcHNrLW5vZGUtY2xpZW50LmpzIiwibW9kdWxlcy9wc2tkYi9saWIvQmxvY2tjaGFpbi5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL0ZvbGRlclBlcnNpc3RlbnRQRFMuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9Jbk1lbW9yeVBEUy5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL1BlcnNpc3RlbnRQRFMuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vQUNMU2NvcGUuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vQWdlbnQuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vQmFja3VwLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvZG9tYWluL0NTQk1ldGEuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vQ1NCUmVmZXJlbmNlLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvZG9tYWluL0RvbWFpblJlZmVyZW5jZS5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9FbWJlZGRlZEZpbGUuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vRmlsZVJlZmVyZW5jZS5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL2RvbWFpbi9LZXkuanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vaW5kZXguanMiLCJtb2R1bGVzL3Bza2RiL2xpYi9kb21haW4vdHJhbnNhY3Rpb25zLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvc3dhcm1zL2FnZW50c1N3YXJtLmpzIiwibW9kdWxlcy9wc2tkYi9saWIvc3dhcm1zL2RvbWFpblN3YXJtcy5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL3N3YXJtcy9pbmRleC5qcyIsIm1vZHVsZXMvcHNrZGIvbGliL3N3YXJtcy9zaGFyZWRQaGFzZXMuanMiLCJtb2R1bGVzL3Bza3dhbGxldC9saWJyYXJpZXMvQ1NCQ2FjaGUuanMiLCJtb2R1bGVzL3Bza3dhbGxldC9saWJyYXJpZXMvQ1NCSWRlbnRpZmllci5qcyIsIm1vZHVsZXMvcHNrd2FsbGV0L2xpYnJhcmllcy9SYXdDU0IuanMiLCJtb2R1bGVzL3Bza3dhbGxldC9saWJyYXJpZXMvUm9vdENTQi5qcyIsIm1vZHVsZXMvcHNrd2FsbGV0L2xpYnJhcmllcy9mbG93cy9hZGRCYWNrdXAuanMiLCJtb2R1bGVzL3Bza3dhbGxldC9saWJyYXJpZXMvZmxvd3MvYWRkQ3NiLmpzIiwibW9kdWxlcy9wc2t3YWxsZXQvbGlicmFyaWVzL2Zsb3dzL2F0dGFjaEZpbGUuanMiLCJtb2R1bGVzL3Bza3dhbGxldC9saWJyYXJpZXMvZmxvd3MvY3JlYXRlQ3NiLmpzIiwibW9kdWxlcy9wc2t3YWxsZXQvbGlicmFyaWVzL2Zsb3dzL2V4dHJhY3RGaWxlLmpzIiwibW9kdWxlcy9wc2t3YWxsZXQvbGlicmFyaWVzL2Zsb3dzL2xpc3RDU0JzLmpzIiwibW9kdWxlcy9wc2t3YWxsZXQvbGlicmFyaWVzL2Zsb3dzL3Jlc2V0UGluLmpzIiwibW9kdWxlcy9wc2t3YWxsZXQvbGlicmFyaWVzL2Zsb3dzL3Jlc3RvcmUuanMiLCJtb2R1bGVzL3Bza3dhbGxldC9saWJyYXJpZXMvZmxvd3Mvc2F2ZUJhY2t1cC5qcyIsIm1vZHVsZXMvcHNrd2FsbGV0L2xpYnJhcmllcy9mbG93cy9zZXRQaW4uanMiLCJtb2R1bGVzL3Bza3dhbGxldC91dGlscy9Ec2VlZENhZ2UuanMiLCJtb2R1bGVzL3Bza3dhbGxldC91dGlscy9mbG93c1V0aWxzLmpzIiwibW9kdWxlcy9wc2t3YWxsZXQvdXRpbHMvdmFsaWRhdG9yLmpzIiwibW9kdWxlcy9zaWduc2Vuc3VzL2xpYi9jb25zVXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9pcy1idWZmZXIvaW5kZXguanMiLCJwc2tub2RlL2NvcmUvc2FuZGJveGVzL3V0aWwvU2FuZEJveE1hbmFnZXIuanMiLCJwc2tub2RlL2NvcmUvdXRpbHMvZXhpdEhhbmRsZXIuanMiLCJsaWJyYXJpZXMvYWdlbnRCYXNlL2luZGV4LmpzIiwibW9kdWxlcy9iYXIvaW5kZXguanMiLCJtb2R1bGVzL2J1ZmZlci1jcmMzMi9pbmRleC5qcyIsIm1vZHVsZXMvY3NiL2luZGV4LmpzIiwibGlicmFyaWVzL2RvbWFpbkJhc2UvaW5kZXguanMiLCJtb2R1bGVzL2VkZnMtYnJpY2stc3RvcmFnZS9pbmRleC5qcyIsIm1vZHVsZXMvZWRmcy9pbmRleC5qcyIsIm1vZHVsZXMvZm9sZGVybXEvaW5kZXguanMiLCJtb2R1bGVzL2ludGVyYWN0L2luZGV4LmpzIiwibW9kdWxlcy9ub2RlLWZkLXNsaWNlci9pbmRleC5qcyIsIm1vZHVsZXMvcHNrLWh0dHAtY2xpZW50L2luZGV4LmpzIiwibW9kdWxlcy9wc2tkYi9pbmRleC5qcyIsIm1vZHVsZXMvcHNrd2FsbGV0L2luZGV4LmpzIiwibW9kdWxlcy9zaWduc2Vuc3VzL2xpYi9pbmRleC5qcyIsIm1vZHVsZXMveWF1emwvaW5kZXguanMiLCJtb2R1bGVzL3lhemwvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3ZYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25hQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7OztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN6eUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJnbG9iYWwucHNrbm9kZUxvYWRNb2R1bGVzID0gZnVuY3Rpb24oKXsgXG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJ5YXpsXCJdID0gcmVxdWlyZShcInlhemxcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJ5YXV6bFwiXSA9IHJlcXVpcmUoXCJ5YXV6bFwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInBza3dhbGxldFwiXSA9IHJlcXVpcmUoXCJwc2t3YWxsZXRcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJzaWduc2Vuc3VzXCJdID0gcmVxdWlyZShcInNpZ25zZW5zdXNcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJmb2xkZXJtcVwiXSA9IHJlcXVpcmUoXCJmb2xkZXJtcVwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcInBza2RiXCJdID0gcmVxdWlyZShcInBza2RiXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiYnVmZmVyLWNyYzMyXCJdID0gcmVxdWlyZShcImJ1ZmZlci1jcmMzMlwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcIm5vZGUtZmQtc2xpY2VyXCJdID0gcmVxdWlyZShcIm5vZGUtZmQtc2xpY2VyXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiaW50ZXJhY3RcIl0gPSByZXF1aXJlKFwiaW50ZXJhY3RcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJwc2staHR0cC1jbGllbnRcIl0gPSByZXF1aXJlKFwicHNrLWh0dHAtY2xpZW50XCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiZWRmc1wiXSA9IHJlcXVpcmUoXCJlZGZzXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiYmFyXCJdID0gcmVxdWlyZShcImJhclwiKTtcblx0JCQuX19ydW50aW1lTW9kdWxlc1tcImNzYlwiXSA9IHJlcXVpcmUoXCJjc2JcIik7XG5cdCQkLl9fcnVudGltZU1vZHVsZXNbXCJlZGZzLWJyaWNrLXN0b3JhZ2VcIl0gPSByZXF1aXJlKFwiZWRmcy1icmljay1zdG9yYWdlXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiZG9tYWluQmFzZVwiXSA9IHJlcXVpcmUoXCJkb21haW5CYXNlXCIpO1xuXHQkJC5fX3J1bnRpbWVNb2R1bGVzW1wiYWdlbnRCYXNlXCJdID0gcmVxdWlyZShcImFnZW50QmFzZVwiKTtcbn1cbmlmIChmYWxzZSkge1xuXHRwc2tub2RlTG9hZE1vZHVsZXMoKTtcbn07IFxuZ2xvYmFsLnBza25vZGVSZXF1aXJlID0gcmVxdWlyZTtcbmlmICh0eXBlb2YgJCQgIT09IFwidW5kZWZpbmVkXCIpIHsgICAgICAgICAgICBcbiAgICAkJC5yZXF1aXJlQnVuZGxlKFwicHNrbm9kZVwiKTtcbn07IiwiY29uc3QgcHViU3ViID0gcmVxdWlyZShcInNvdW5kcHVic3ViXCIpLnNvdW5kUHViU3ViO1xuY29uc3QgbXEgPSByZXF1aXJlKFwiZm9sZGVybXFcIik7XG5jb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cbmV4cG9ydHMuY3JlYXRlID0gZnVuY3Rpb24oZm9sZGVyLCB2bSl7XG4gICAgdmFyIGluYm91bmQgPSBtcS5jcmVhdGVRdWUocGF0aC5qb2luKGZvbGRlciwgXCJtcVwiLCBcImluYm91bmRcIiksICQkLmRlZmF1bHRFcnJvckhhbmRsaW5nSW1wbGVtZW50YXRpb24pO1xuICAgIHZhciBvdXRib3VuZCA9IG1xLmNyZWF0ZVF1ZShwYXRoLmpvaW4oZm9sZGVyLCBcIm1xXCIsIFwib3V0Ym91bmRcIiksICQkLmRlZmF1bHRFcnJvckhhbmRsaW5nSW1wbGVtZW50YXRpb24pO1xuICAgICAgICBvdXRib3VuZC5zZXRJUENDaGFubmVsKHByb2Nlc3MpO1xuICAgICAgICBvdXRib3VuZCA9IG91dGJvdW5kLmdldEhhbmRsZXIoKTtcblxuICAgIGluYm91bmQuc2V0SVBDQ2hhbm5lbChwcm9jZXNzKTtcbiAgICBpbmJvdW5kLnJlZ2lzdGVyQXNJUENDb25zdW1lcihmdW5jdGlvbihlcnIsIHN3YXJtKXtcbiAgICAgICAgaWYoc3dhcm0pe1xuICAgICAgICAgICAgLy9yZXN0b3JlIGFuZCBleGVjdXRlIHRoaXMgdGFzdHkgc3dhcm1cbiAgICAgICAgICAgIGdsb2JhbC4kJC5zd2FybXNJbnN0YW5jZXNNYW5hZ2VyLnJldml2ZV9zd2FybShzd2FybSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJHb3QgYW4gZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgIC8vVE9ETzogd2hhdCBoYXBwZW5zIHdpdGggdGhlIHNlcmlhbGl6YXRpb24gaWYgdGhlcmUgd2hlcmUgYW4gZXJyb3I/Pz9cbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAvKmluYm91bmQucmVnaXN0ZXJDb25zdW1lcihmdW5jdGlvbihlcnIsIHN3YXJtKXtcbiAgICAgICAvL3Jlc3RvcmUgYW5kIGV4ZWN1dGUgdGhpcyB0YXN0eSBzd2FybVxuICAgICAgICBnbG9iYWwuJCQuc3dhcm1zSW5zdGFuY2VzTWFuYWdlci5yZXZpdmVfc3dhcm0oc3dhcm0pO1xuICAgIH0pOyovXG5cbiAgICBwdWJTdWIuc3Vic2NyaWJlKCQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OLCBmdW5jdGlvbihzd2FybSl7XG4gICAgICAgIG91dGJvdW5kLnNlbmRTd2FybUZvckV4ZWN1dGlvbihzd2FybSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHViU3ViO1xufTtcbiIsInZhciBwdWJTdWIgPSAkJC5yZXF1aXJlKFwic291bmRwdWJzdWJcIikuc291bmRQdWJTdWI7XG5jb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcblxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbihmb2xkZXIsIGNvZGVGb2xkZXIgKXtcblxuICAgICQkLlBTS19QdWJTdWIgPSBwdWJTdWI7XG4gICAgdmFyIHNhbmRCb3hlc1Jvb3QgPSBwYXRoLmpvaW4oZm9sZGVyLCBcInNhbmRib3hlc1wiKTtcblxuICAgIHRyeXtcbiAgICAgICAgZnMubWtkaXJTeW5jKHNhbmRCb3hlc1Jvb3QsIHtyZWN1cnNpdmU6IHRydWV9KTtcbiAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICAgY29uc29sZS5sb2coXCJGYWlsZWQgdG8gY3JlYXRlIHNhbmRib3hlcyBkaXIgc3RydWN0dXJlIVwiLCBlcnIpO1xuICAgICAgICAvL1RPRE86IG1heWJlIGl0IGlzIG9rIHRvIGNhbGwgcHJvY2Vzcy5leGl0ID8/P1xuICAgIH1cblxuICAgICQkLlNhbmRCb3hNYW5hZ2VyID0gcmVxdWlyZShcIi4uLy4uL3Bza25vZGUvY29yZS9zYW5kYm94ZXMvdXRpbC9TYW5kQm94TWFuYWdlclwiKS5jcmVhdGUoc2FuZEJveGVzUm9vdCwgY29kZUZvbGRlciwgZnVuY3Rpb24oZXJyLCByZXMpe1xuICAgICAgICBjb25zb2xlLmxvZygkJC5ESV9jb21wb25lbnRzLnNhbmRCb3hSZWFkeSwgZXJyLCByZXMpO1xuICAgICAgICAkJC5jb250YWluZXIucmVzb2x2ZSgkJC5ESV9jb21wb25lbnRzLnNhbmRCb3hSZWFkeSwgdHJ1ZSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHViU3ViO1xufTtcbiIsImNvbnN0IEJyaWNrID0gcmVxdWlyZSgnLi9CcmljaycpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuY29uc3QgaXNTdHJlYW0gPSByZXF1aXJlKFwiLi4vdXRpbHMvaXNTdHJlYW1cIik7XG5cbmZ1bmN0aW9uIEFyY2hpdmUoYXJjaGl2ZUNvbmZpZ3VyYXRvciwgbWFwRGlnZXN0KSB7IC8vY29uZmlnT2JqXG4gICAgLy9udW1lbGUgc2kgcHJvdmlkZXItdWwgcGUgY2FyZSBpbCB2b20gdXRpbGl6YSwgcHJvdmlkZXItdWwgdmEgZmkgdW4gc3RyaW5nXG4gICAgLy9pbiBmdW5jdGllIGRlIHZhbG9hcmVhIGFjZXN0dWkgc3RyaW5nIHZvbSBjcmVhIGluIHZhcmlhYmlsYSBzdG9yYWdlUHJ2XG4gICAgLy91biBvYmllY3QgZGUgdGlwdWwgU3RvcmFnZUZpbGUgc2F1IFN0b3JhZ2VGb2xkZXJcblxuXG4gICAgY29uc3QgZGlza0FkYXB0ZXIgPSBhcmNoaXZlQ29uZmlndXJhdG9yLmdldERpc2tBZGFwdGVyKCk7XG4gICAgY29uc3Qgc3RvcmFnZVByb3ZpZGVyID0gYXJjaGl2ZUNvbmZpZ3VyYXRvci5nZXRTdG9yYWdlUHJvdmlkZXIoKTtcbiAgICBsZXQgYmFyTWFwO1xuXG4gICAgZnVuY3Rpb24gcHV0QmFyTWFwKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFwRGlnZXN0ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBzdG9yYWdlUHJvdmlkZXIuZGVsZXRlQnJpY2sobWFwRGlnZXN0LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBfX3B1dEJhck1hcChjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIF9fcHV0QmFyTWFwKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfX3B1dEJhck1hcChjYWxsYmFjaykge1xuICAgICAgICBzdG9yYWdlUHJvdmlkZXIucHV0QmFyTWFwKGJhck1hcCwgKGVyciwgbmV3TWFwRGlnZXN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG1hcERpZ2VzdCA9IG5ld01hcERpZ2VzdDtcbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgbWFwRGlnZXN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5hcHBlbmRUb0ZpbGUgPSBmdW5jdGlvbiAoZmlsZVBhdGgsIGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vZmlsZU5hbWUgLSBudW1lbGUgZmlzaWVydWx1aSBpbiBjYXJlIHZyZW0gc2EgZmFjZW0gYXBwZW5kXG4gICAgICAgIC8vZGF0YSAtIGJ1ZmZlci11bCBkZSBjaXRpcmUsIHZvbSBwcmVsdWEgZGluIGVsIGRhdGVsZVxuICAgICAgICAvL2NhbGxiYWNrIC0gYWNlZWFzaSBmdW5jdGllIGNhcmUgc2Ugb2N1cGEgZGUgcHJlbHVjYXJlYSBkYXRlbG9yLFxuICAgICAgICAvL2RlIGNyZWVyZWEgZGUgYnJpY2stdXJpIHNpIHNjcmllcmVhIGxvclxuICAgICAgICBsb2FkQmFyTWFwVGhlbkV4ZWN1dGUoaGVscGVyQXBwZW5kVG9GaWxlLCBjYWxsYmFjayk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGVscGVyQXBwZW5kVG9GaWxlKCkge1xuICAgICAgICAgICAgZmlsZVBhdGggPSB2YWxpZGF0ZUZpbGVOYW1lKGZpbGVQYXRoKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IEJ1ZmZlci5mcm9tKGRhdGEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YUJyaWNrID0gbmV3IEJyaWNrKGRhdGEpO1xuICAgICAgICAgICAgICAgIHN0b3JhZ2VQcm92aWRlci5wdXRCcmljayhkYXRhQnJpY2ssIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBiYXJNYXAuYWRkKGZpbGVQYXRoLCBkYXRhQnJpY2spO1xuICAgICAgICAgICAgICAgICAgICBwdXRCYXJNYXAoY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGlzU3RyZWFtLmlzUmVhZGFibGUoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICBkYXRhLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfSkub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YUJyaWNrID0gbmV3IEJyaWNrKGNodW5rKTtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZVByb3ZpZGVyLnB1dEJyaWNrKGRhdGFCcmljaywgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBiYXJNYXAuYWRkKGZpbGVQYXRoLCBkYXRhQnJpY2spO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHB1dEJhck1hcChjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiSW52YWxpZCB0eXBlIG9mIHBhcmFtZXRlciBkYXRhXCIpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmFkZEZvbGRlciA9IGZ1bmN0aW9uIChmb2xkZXJQYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBsb2FkQmFyTWFwVGhlbkV4ZWN1dGUoaGVscGVyQWRkRm9sZGVyLCBjYWxsYmFjayk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGVscGVyQWRkRm9sZGVyKCkge1xuICAgICAgICAgICAgZGlza0FkYXB0ZXIuZ2V0TmV4dEZpbGUoZm9sZGVyUGF0aCwgX19yZWFkRmlsZUNiKTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gX19yZWFkRmlsZUNiKGVyciwgZmlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmaWxlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0Rm9sZGVyUGF0aCA9IGZvbGRlclBhdGguc3BsaXQocGF0aC5zZXApO1xuICAgICAgICAgICAgICAgICAgICBzcGxpdEZvbGRlclBhdGgucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlYWRGaWxlQXNCbG9ja3Moc3BsaXRGb2xkZXJQYXRoLmpvaW4ocGF0aC5zZXApLCBmaWxlLCBhcmNoaXZlQ29uZmlndXJhdG9yLmdldEJ1ZmZlclNpemUoKSwgYmFyTWFwLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2tBZGFwdGVyLmdldE5leHRGaWxlKGZvbGRlclBhdGgsIF9fcmVhZEZpbGVDYik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VQcm92aWRlci5wdXRCYXJNYXAoYmFyTWFwLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRlbGV0ZUZvckZpbGVOYW1lKGZpbGVuYW1lLCBoYXNoTGlzdCwgbGVuZ3RoLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGluZGV4ID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHN0b3JhZ2VQcm92aWRlci5kZWxldGVCcmljayhoYXNoTGlzdFtpbmRleF0sIChlcnIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGVsZXRlRm9yRmlsZU5hbWUoZmlsZW5hbWUsIGhhc2hMaXN0LCBsZW5ndGgsIChpbmRleCArIDEpLCBjYWxsYmFjayk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVwbGFjZUZpbGUgPSBmdW5jdGlvbiAoZmlsZU5hbWUsIHN0cmVhbSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHJlYW0gIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdXcm9uZyBzdHJlYW0hJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9hZEJhck1hcFRoZW5FeGVjdXRlKGhlbHBlclJlcGxhY2VGaWxlLCBjYWxsYmFjayk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGVscGVyUmVwbGFjZUZpbGUoKSB7XG4gICAgICAgICAgICBmaWxlTmFtZSA9IHZhbGlkYXRlRmlsZU5hbWUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgc3RyZWFtLm9uKCdlcnJvcicsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiRmlsZSBkb2VzIG5vdCBleGlzdCFcIikpO1xuICAgICAgICAgICAgfSkub24oJ29wZW4nLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGhhc2hMaXN0ID0gYmFyTWFwLmdldEhhc2hMaXN0KGZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICBkZWxldGVGb3JGaWxlTmFtZShmaWxlTmFtZSwgaGFzaExpc3QsIGhhc2hMaXN0Lmxlbmd0aCwgMCwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJhck1hcC5lbXB0eUxpc3QoZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdGVtcEJyaWNrID0gbmV3IEJyaWNrKGNodW5rKTtcbiAgICAgICAgICAgICAgICBiYXJNYXAuYWRkKGZpbGVOYW1lLCB0ZW1wQnJpY2spO1xuICAgICAgICAgICAgICAgIHN0b3JhZ2VQcm92aWRlci5wdXRCcmljayh0ZW1wQnJpY2ssIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHV0QmFyTWFwKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuYWRkRmlsZSA9IGZ1bmN0aW9uIChmaWxlUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgbG9hZEJhck1hcFRoZW5FeGVjdXRlKGhlbHBlckFkZEZpbGUsIGNhbGxiYWNrKTtcblxuICAgICAgICBmdW5jdGlvbiBoZWxwZXJBZGRGaWxlKCkge1xuICAgICAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IHBhdGguZGlybmFtZShmaWxlUGF0aCk7XG4gICAgICAgICAgICBkaXNrQWRhcHRlci5nZXROZXh0RmlsZShmaWxlUGF0aCwgKGVyciwgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVhZEZpbGVBc0Jsb2Nrcyhmb2xkZXJQYXRoLCBmaWxlLCBhcmNoaXZlQ29uZmlndXJhdG9yLmdldEJ1ZmZlclNpemUoKSwgYmFyTWFwLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZVByb3ZpZGVyLnB1dEJhck1hcChiYXJNYXAsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0RmlsZSA9IGZ1bmN0aW9uIChzYXZlUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5leHRyYWN0Rm9sZGVyKHNhdmVQYXRoLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIHRoaXMuZXh0cmFjdEZpbGUgPSBmdW5jdGlvbiAoZmlsZU5hbWUsIGxvY2F0aW9uLCBjYWxsYmFjaykge1xuICAgICAgICBsb2FkQmFyTWFwVGhlbkV4ZWN1dGUoaGVscGVyRXh0cmFjdEZpbGUsIGNhbGxiYWNrKTtcblxuICAgICAgICBmdW5jdGlvbiBoZWxwZXJFeHRyYWN0RmlsZSgpIHtcbiAgICAgICAgICAgIGZpbGVOYW1lID0gdmFsaWRhdGVGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBoYXNoTGlzdCA9IGJhck1hcC5nZXRIYXNoTGlzdChmaWxlTmFtZSk7XG4gICAgICAgICAgICBfX2dldEZpbGVSZWN1cnNpdmVseShoYXNoTGlzdCwgaGFzaExpc3QubGVuZ3RoLCAwLCBjYWxsYmFjayk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfX2dldEZpbGVSZWN1cnNpdmVseShoYXNoTGlzdCwgbGVuZ3RoLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JhZ2VQcm92aWRlci5nZXRCcmljayhoYXNoTGlzdFtpbmRleF0sIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfX2FwcGVuZGVyKGVyciwgZGF0YSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIF9fZ2V0RmlsZVJlY3Vyc2l2ZWx5KGhhc2hMaXN0LCBsZW5ndGgsIGluZGV4ICsgMSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBfX2FwcGVuZGVyKGVyciwgZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBiYXNlID0gcGF0aC5iYXNlbmFtZShmaWxlTmFtZSk7XG4gICAgICAgICAgICBsZXQgcHRoID0gcGF0aC5qb2luKGxvY2F0aW9uLCBiYXNlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgZGlza0FkYXB0ZXIuYXBwZW5kQmxvY2tUb0ZpbGUocHRoLCBkYXRhLmdldERhdGEoKSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuZXh0cmFjdEZvbGRlciA9IGZ1bmN0aW9uIChzYXZlUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgLy9mdW5jdGlhIGFzdGEgZXh0cmFnZSB1biBmaXNpZXIgZGluIGFyaGl2YSwgc2kgZm9sb3Nlc3RlIGZ1bmN0aWEgZGUgY2FsbGJhY2tcbiAgICAgICAgLy9wZW50cnUgYSByZXRpbmUgZGF0ZWxlIGludHItbyBsaXN0YSBzYXUgcGVudHJ1IGEgZmFjZSBvIHByb2Nlc2FyZSB1bHRlcmlvYXJhXG4gICAgICAgIGxvYWRCYXJNYXBUaGVuRXhlY3V0ZShoZWxwZXJFeHRyYWN0Rm9sZGVyLCBjYWxsYmFjayk7XG5cbiAgICAgICAgZnVuY3Rpb24gaGVscGVyRXh0cmFjdEZvbGRlcigpIHtcbiAgICAgICAgICAgIGxldCBmaWxlUGF0aHMgPSBiYXJNYXAuZ2V0RmlsZUxpc3QoKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIF9fcmVhZEZpbGVzUmVjdXJzaXZlbHkoZmlsZUluZGV4LCByZWFkRmlsZXNDYikge1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gX19nZXRCcmlja3NSZWN1cnNpdmVseShicmlja0luZGV4LCBnZXRCcmlja3NDYikge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBicmlja0hhc2ggPSBicmlja0xpc3RbYnJpY2tJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VQcm92aWRlci5nZXRCcmljayhicmlja0hhc2gsIChlcnIsIGJyaWNrRGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRCcmlja3NDYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV3UGF0aCA9IHBhdGguam9pbihzYXZlUGF0aCwgZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlza0FkYXB0ZXIuYXBwZW5kQmxvY2tUb0ZpbGUobmV3UGF0aCwgYnJpY2tEYXRhLmdldERhdGEoKSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldEJyaWNrc0NiKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyticmlja0luZGV4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChicmlja0luZGV4IDwgYnJpY2tMaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX2dldEJyaWNrc1JlY3Vyc2l2ZWx5KGJyaWNrSW5kZXgsIGdldEJyaWNrc0NiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRCcmlja3NDYigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGZpbGVQYXRoc1tmaWxlSW5kZXhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJyaWNrTGlzdCA9IGJhck1hcC5nZXRIYXNoTGlzdChmaWxlUGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKGJyaWNrTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF9fZ2V0QnJpY2tzUmVjdXJzaXZlbHkoMCwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWFkRmlsZXNDYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICArK2ZpbGVJbmRleDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWxlSW5kZXggPCBmaWxlUGF0aHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX19yZWFkRmlsZXNSZWN1cnNpdmVseShmaWxlSW5kZXgsIHJlYWRGaWxlc0NiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhZEZpbGVzQ2IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfX3JlYWRGaWxlc1JlY3Vyc2l2ZWx5KDAsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIHRoaXMuZ2V0UmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICAvL25lIHZhIG9mZXJpIHVuIGJ1ZmZlciBjYXJlIHNhIGNpdGVhc2NhIGRpbnRyLXVuIGZpc2llciBkaW4gYXJoaXZhIG5vYXN0cmE/XG4gICAgICAgIC8vcmV0dXJuIGRpc2tBZGFwdGVyLmdldFJlYWRTdHJlYW0oZmlsZVBhdGgsYnVmZmVyU2l6ZSk7XG5cbiAgICB9O1xuXG4gICAgdGhpcy5nZXRXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICAvL25lIHZhIG9mZXJpIHVuIGJ1ZmZlciBjYXJlIHNhIHNjcmllIGludHItdW4gZmlzaWVyIGRpbiBhcmhpdmEgbm9hc3RyYVxuICAgICAgICAvL3JldHVybiBkaXNrQWRhcHRlci5nZXRXcml0ZVN0cmVhbShmaWxlUGF0aCk7XG5cbiAgICB9O1xuXG4gICAgdGhpcy5zdG9yZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICBzdG9yYWdlUHJvdmlkZXIucHV0QmFyTWFwKGJhck1hcCwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB0aGlzLmxpc3QgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBiYXJNYXAgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHN0b3JhZ2VQcm92aWRlci5nZXRCYXJNYXAobWFwRGlnZXN0LCAoZXJyLCBtYXApID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGJhck1hcCA9IG1hcDtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGJhck1hcC5nZXRGaWxlTGlzdCgpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBiYXJNYXAuZ2V0RmlsZUxpc3QoKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy9hY2Vhc3RhIGZ1bmN0aWUgdmEgbGlzdGEgZGVudW1pcmlsZSBmaXNpZXJlbG9yIGRpbiBhcmhpdmFcbiAgICAgICAgLy9udSBpbnRlbGVnIGNlIGFyIHRyZWJ1aSBzYSBmYWNhIGZ1bmN0aWEgZGUgY2FsbGJhY2tcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcmVhZEZpbGVBc0Jsb2Nrcyhmb2xkZXJQYXRoLCBmaWxlTmFtZSwgYmxvY2tTaXplLCBiYXJNYXAsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHBhdGguam9pbihmb2xkZXJQYXRoLCBmaWxlTmFtZSk7XG4gICAgICAgIGRpc2tBZGFwdGVyLmdldEZpbGVTaXplKGFic29sdXRlUGF0aCwgKGVyciwgZmlsZVNpemUpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBsZXQgbm9CbG9ja3MgPSBNYXRoLmZsb29yKGZpbGVTaXplIC8gYmxvY2tTaXplKTtcbiAgICAgICAgICAgIGlmIChmaWxlU2l6ZSAlIGJsb2NrU2l6ZSA+IDApIHtcbiAgICAgICAgICAgICAgICArK25vQmxvY2tzO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgYmxvY2tJbmRleCA9IDA7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIF9fcmVhZENiKGVyciwgYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBicmljayA9IG5ldyBCcmljayhidWZmZXIpO1xuICAgICAgICAgICAgICAgIGJhck1hcC5hZGQoZmlsZU5hbWUsIGJyaWNrKTtcbiAgICAgICAgICAgICAgICBzdG9yYWdlUHJvdmlkZXIucHV0QnJpY2soYnJpY2ssIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICArK2Jsb2NrSW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGlmIChibG9ja0luZGV4IDwgbm9CbG9ja3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2tBZGFwdGVyLnJlYWRCbG9ja0Zyb21GaWxlKGFic29sdXRlUGF0aCwgYmxvY2tJbmRleCwgYmxvY2tTaXplLCBfX3JlYWRDYik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZGlza0FkYXB0ZXIucmVhZEJsb2NrRnJvbUZpbGUoYWJzb2x1dGVQYXRoLCBibG9ja0luZGV4LCBibG9ja1NpemUsIF9fcmVhZENiKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGVGaWxlTmFtZShmaWxlTmFtZSkge1xuICAgICAgICBpZiAoZmlsZU5hbWVbMF0gIT09ICcvJykge1xuICAgICAgICAgICAgZmlsZU5hbWUgPSBwYXRoLnNlcCArIGZpbGVOYW1lO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGl0ID0gMDsgaXQgPCBmaWxlTmFtZS5sZW5ndGg7IGl0KyspIHtcbiAgICAgICAgICAgIGlmIChmaWxlTmFtZVtpdF0gPT09ICcvJylcbiAgICAgICAgICAgICAgICBmaWxlTmFtZSA9IGZpbGVOYW1lLnJlcGxhY2UoJy8nLCBwYXRoLnNlcCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lO1xuICAgIH1cbiAgICBcbiAgICBmdW5jdGlvbiBsb2FkQmFyTWFwVGhlbkV4ZWN1dGUoZnVuY3Rpb25Ub0JlRXhlY3V0ZWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYmFyTWFwID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBzdG9yYWdlUHJvdmlkZXIuZ2V0QmFyTWFwKG1hcERpZ2VzdCwgKGVyciwgbWFwKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBiYXJNYXAgPSBtYXA7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb25Ub0JlRXhlY3V0ZWQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZnVuY3Rpb25Ub0JlRXhlY3V0ZWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFyY2hpdmU7IiwiY29uc3Qgc3RvcmFnZVByb3ZpZGVycyA9IHt9O1xuY29uc3QgZGlza0FkYXB0ZXJzID0ge307XG5cbmZ1bmN0aW9uIEFyY2hpdmVDb25maWd1cmF0b3IoKSB7XG4gICAgY29uc3QgY29uZmlnID0ge307XG5cbiAgICB0aGlzLnNldEJ1ZmZlclNpemUgPSBmdW5jdGlvbiAoYnVmZmVyU2l6ZSkge1xuICAgICAgICBjb25maWcuYnVmZmVyU2l6ZSA9IGJ1ZmZlclNpemU7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0QnVmZmVyU2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5idWZmZXJTaXplO1xuICAgIH07XG5cbiAgICB0aGlzLnNldFN0b3JhZ2VQcm92aWRlciA9IGZ1bmN0aW9uIChzdG9yYWdlUHJvdmlkZXJOYW1lLCAuLi5hcmdzKSB7XG4gICAgICAgIGNvbmZpZy5zdG9yYWdlUHJvdmlkZXIgPSBzdG9yYWdlUHJvdmlkZXJzW3N0b3JhZ2VQcm92aWRlck5hbWVdKC4uLmFyZ3MpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFN0b3JhZ2VQcm92aWRlciA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICByZXR1cm4gY29uZmlnLnN0b3JhZ2VQcm92aWRlcjtcbiAgICB9O1xuXG4gICAgdGhpcy5zZXREaXNrQWRhcHRlciA9IGZ1bmN0aW9uIChkaXNrQWRhcHRlck5hbWUsIC4uLmFyZ3MpIHtcbiAgICAgICAgY29uZmlnLmRpc2tBZGFwdGVyID0gZGlza0FkYXB0ZXJzW2Rpc2tBZGFwdGVyTmFtZV0oLi4uYXJncyk7XG4gICAgfTtcbiAgICB0aGlzLmdldERpc2tBZGFwdGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmRpc2tBZGFwdGVyO1xuICAgIH1cbn1cblxuQXJjaGl2ZUNvbmZpZ3VyYXRvci5wcm90b3R5cGUucmVnaXN0ZXJTdG9yYWdlUHJvdmlkZXIgPSBmdW5jdGlvbiAoc3RvcmFnZVByb3ZpZGVyTmFtZSwgZmFjdG9yeSkge1xuICAgIHN0b3JhZ2VQcm92aWRlcnNbc3RvcmFnZVByb3ZpZGVyTmFtZV0gPSBmYWN0b3J5O1xufTtcblxuQXJjaGl2ZUNvbmZpZ3VyYXRvci5wcm90b3R5cGUucmVnaXN0ZXJEaXNrQWRhcHRlciA9IGZ1bmN0aW9uIChkaXNrQWRhcHRlck5hbWUsIGZhY3RvcnkpIHtcbiAgICBkaXNrQWRhcHRlcnNbZGlza0FkYXB0ZXJOYW1lXSA9IGZhY3Rvcnk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFyY2hpdmVDb25maWd1cmF0b3I7IiwiY29uc3QgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG5cbmZ1bmN0aW9uIEJyaWNrKGRhdGEpe1xuICAgIGxldCBoYXNoO1xuICAgIHRoaXMuZ2V0SGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBoYXNoID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICBjb25zdCBoID0gY3J5cHRvLmNyZWF0ZUhhc2goJ3NoYTI1NicpO1xuICAgICAgICAgICAgaC51cGRhdGUoZGF0YSk7XG4gICAgICAgICAgICBoYXNoID0gaC5kaWdlc3QoJ2hleCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgIH07XG5cbiAgICB0aGlzLmdldERhdGEgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQnJpY2s7IiwiY29uc3QgQnJpY2sgPSByZXF1aXJlKFwiLi9Ccmlja1wiKTtcblxuZnVuY3Rpb24gRmlsZUJhck1hcChoZWFkZXIpe1xuICAgIGhlYWRlciA9IGhlYWRlciB8fCB7fTtcbiAgICBsZXQgYnJpY2tQb3NpdGlvbnMgPSBbXTtcbiAgICBsZXQgcG9zaXRpb24gPSAwO1xuICAgIGxldCBpbmRleD0wO1xuICAgIC8vaGVhZGVyIGVzdGUgdW4gbWFwIGluIGNhcmUgdm9tIHJldGluZSBkYXRlbGUgaW50ci11biBmb3JtYXQganNvblxuICAgIC8vdm9tIGF2ZWEga2V5LXVsIGNhcmUgdmEgZmkgZmlsZW5hbWUtdWwsIHNpIGRhdGVsZSBjYXJlIHZhIGZpIGxpc3RhIGRlIGhhc2gtdXJpXG4gICAgdGhpcy5hZGQgPSBmdW5jdGlvbiAoZmlsZVBhdGgsIGJyaWNrKSB7XG4gICAgICAgIC8vaGFzaExpc3QtdWwgdmEgZmkgZGlyZWN0IGxpc3RhIGRlIGhhc2gtdXJpLCBwZW50cnUgY2EgbyBwdXRlbSBmYWNlIHBlIG1hc3VyYVxuICAgICAgICAvL2NlIG5lIG9jdXBhbSBkZSBzYWx2YXJlYSBicmljay11cmlsb3JcbiAgICAgICAgbGV0IGxhc3RQb3NpdGlvbiA9IDk2O1xuICAgICAgICBpZihpbmRleD4wKVxuICAgICAgICAgICAgbGFzdFBvc2l0aW9uID0gYnJpY2tQb3NpdGlvbnNbaW5kZXgtMV07XG4gICAgICAgIGlmICh0eXBlb2YgaGVhZGVyW2ZpbGVQYXRoXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgaGVhZGVyW2ZpbGVQYXRoXSA9IFtdO1xuICAgICAgICAgICAgYnJpY2tQb3NpdGlvbnMucHVzaCgobGFzdFBvc2l0aW9uK2JyaWNrLmdldFNpemUoKSkpO1xuICAgICAgICAgICAgaGVhZGVyW2ZpbGVQYXRoXS5wdXNoKGluZGV4KTtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIC8vbGV0IHRlbXBMID0gaGVhZGVyW2ZpbGVQYXRoXS5sZW5ndGg7XG4gICAgICAgICAgICAvL2xldCB0ZW1wU2l6ZSA9IGhlYWRlcltmaWxlUGF0aF1bdGVtcEwtMV07XG4gICAgICAgICAgICBicmlja1Bvc2l0aW9ucy5wdXNoKChsYXN0UG9zaXRpb24rYnJpY2suZ2V0U2l6ZSgpKSk7XG4gICAgICAgICAgICBoZWFkZXJbZmlsZVBhdGhdLnB1c2goaW5kZXgpO1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLnNldEJhck1hcFBvc2l0b24gPSBmdW5jdGlvbihhY3R1YWxQb3NpdGlvbil7XG4gICAgICAgIHBvc2l0aW9uID0gYWN0dWFsUG9zaXRpb247XG4gICAgfVxuXG4gICAgdGhpcy5nZXRIYXNoTGlzdCA9IGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICAvL2F2ZW0gbmV2b2llIGRlIGhhc2gtdXJpIGNhIHNhIHB1dGVtIG9idGluZSBicmljay11cmlsZSB1bnVpIGZpc2llclxuICAgICAgICAvL3VuIGhhc2ggZXN0ZSBkZSBmYXB0IGRlbnVtaXJlYSB1bnVpIGJyaWNrXG4gICAgICAgIC8vYWNlYXN0YSBmdW5jdGllIHJldHVybmVhemEgbGlzdGEgZGUgaGFzaC11cmlcbiAgICAgICAgcmV0dXJuIGhlYWRlcltmaWxlUGF0aF07XG4gICAgfTtcblxuICAgIHRoaXMuZW1wdHlMaXN0ID0gZnVuY3Rpb24gKGZpbGVQYXRoKSB7XG4gICAgICAgIGhlYWRlcltmaWxlUGF0aF0gPSBbXTtcbiAgICB9O1xuXG4gICAgdGhpcy50b0JyaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgdGVtcE1hcCA9IHt9O1xuICAgICAgICB0ZW1wTWFwLnBvc2l0aW9ucyA9IGhlYWRlcjtcbiAgICAgICAgdGVtcE1hcC5pbmRleGVzID0gYnJpY2tQb3NpdGlvbnM7XG4gICAgICAgIHJldHVybiBuZXcgQnJpY2soQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkodGVtcE1hcCkpKTtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRGaWxlTGlzdCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhoZWFkZXIpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0TGlzdE9mQnJpY2tQb3NpdGlvbnMgPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gYnJpY2tQb3NpdGlvbnM7XG4gICAgfVxuXG4gICAgdGhpcy5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKGluZGV4KXtcbiAgICAgICAgaWYoaW5kZXg+YnJpY2tQb3NpdGlvbnMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIGJyaWNrUG9zaXRpb25zW2luZGV4XTtcbiAgICB9XG5cbiAgICB0aGlzLnNldExpc3RPZkJyaWNrUG9zaXRpb25zID0gZnVuY3Rpb24obGlzdCl7XG4gICAgICAgIGJyaWNrUG9zaXRpb25zID0gbGlzdDtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUJhck1hcDsiLCJjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5jb25zdCBCYXJNYXAgPSByZXF1aXJlKCcuL0ZpbGVCYXJNYXAnKTtcbi8vY29uc3QgZmlsZUJhck1hcCA9IHJlcXVpcmUoJ0ZpbGVCYXJNYXAnKTtcblxuZnVuY3Rpb24gRmlsZUJyaWNrU3RvcmFnZShsb2NhdGlvbil7XG4gICAgLy9jbGFzZWxlIGFjZXN0ZWEgZGUgc3RvcmFnZSwgbnUgc2UgbWFpIG9jdXBhIGRlIGNpdGlyaSBzaSBzY3JpZXJpIGFjdW1cbiAgICAvL2RlY2kgYWNlc3RlIGZ1bmN0aWkgcGUgY2FyZSBsZSBhcGVsZXosIHB1dEJyaWNrIHNpIGdldEJyaWNrIHN1bnQgbmlzdGUgZnVuY3RpaSBpbnRlcm1lZGlhcmVcbiAgICAvL3RvYXRlIHByb2Nlc2FyaWxlIHNlIGZhYyBpbiBCYXJXb3JrZXIgKHBhcnRlYSBkZSBjaXRpcmUsIG1hcGFyZSBhIGhlYWRlci11bHVpIGFyaGl2ZWkpXG4gICAgLy9zaSBpbiBzdG9yYWdlLCBkZSBleGVtcGx1IGFwcGVuZC11bCBkZSBkYXRlIGxhIHVuIEJyaWNrXG4gICAgbGV0IG1hcDtcbiAgICBsZXQgYmFyTWFwUG9zaXRpb24gPSA5NjtcbiAgICAvLyB0aGlzLnB1dEJyaWNrID0gZnVuY3Rpb24oYnJpY2ssY2FsbGJhY2spe1xuICAgIC8vICAgICBiYXJNYXBQb3NpdGlvbiArPSBicmljay5nZXREYXRhKCkubGVuZ3RoO1xuICAgIC8vICAgICBicmlja1NpemVzW2JyaWNrLmdldEhhc2goKV0gPSBicmljay5nZXREYXRhKCkubGVuZ3RoOyBcbiAgICAvLyAgICAgZnMuYXBwZW5kRmlsZShsb2NhdGlvbixicmljay5nZXREYXRhKCksKGVycik9PntcbiAgICAvLyAgICAgICAgIGlmKGVycilcbiAgICAvLyAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgIC8vICAgICAgICAgZWxzZVxuICAgIC8vICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICAvL2FjZWFzdGEgZnVuY3RpZSB2YSBwcmltaSB1biBicmlja1xuICAgIC8vICAgICAvL3NpIHZhIGFwZWxhIG8gZnVjbnRpZSBkaW4gQmFyV29ya2VyIGNlIHNlIHZhIG9jdXBhIGRlIHNjcmllcmVhIGRhdGVsb3IgaW4gZmlzaWVyXG4gICAgLy8gICAgIC8vdmEgZmFjZSBhcHBlbmQgbGEgZmlzaWVydWwgLmJhciwgY3UgZGF0ZWxlIHJlc3BlY3RpdmVcbiAgICAvLyB9XG5cbiAgICAvLyB0aGlzLnB1dEJyaWNrID0gZnVuY3Rpb24oYnJpY2ssY2FsbGJhY2spe1xuICAgIC8vICAgICBiYXJNYXBQb3NpdGlvbiArPSBicmljay5nZXREYXRhKCkubGVuZ3RoO1xuICAgIC8vICAgICBicmlja1NpemVzW2JyaWNrLmdldEhhc2goKV0gPSBicmljay5nZXREYXRhKCkubGVuZ3RoO1xuICAgIC8vICAgICBsZXQgdGVtcEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhicmljay5nZXREYXRhKCkubGVuZ3RoLGJyaWNrLmdldERhdGEoKSk7XG4gICAgLy8gICAgIGZzLm9wZW4obG9jYXRpb24sJ3cnLChlcnIsZmQpPT57XG4gICAgLy8gICAgICAgICBmcy53cml0ZShmZCx0ZW1wQnVmZmVyLDAsdGVtcEJ1ZmZlcixiYXJNYXBQb3NpdGlvbiwoZXJyLHdycixzdHIpPT57XG4gICAgLy8gICAgICAgICAgICAgaWYoZXJyKVxuICAgIC8vICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfSk7XG4gICAgLy8gfVxuXG4gICAgdGhpcy5wdXRCcmljayA9IGZ1bmN0aW9uKGJyaWNrLGNhbGxiYWNrKXtcbiAgICAgICAgZnMuc3RhdChsb2NhdGlvbiwoZXJyLHN0YXQpPT57XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIGZzLm9wZW4obG9jYXRpb24sJ3IrJywoZXJyLGZkKT0+e1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhicmljay5nZXRTaXplKCksYnJpY2suZ2V0RGF0YSgpKTtcbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGUoZmQsdGVtcEJ1ZmZlciwwLHRlbXBCdWZmZXIubGVuZ3RoLDk2LChlcnIsd3J0LGJ1ZmZlcik9PntcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBmcy5hcHBlbmRGaWxlKGxvY2F0aW9uLGJyaWNrLmdldERhdGEoKSwoZXJyKT0+e1xuICAgICAgICAgICAgICAgICAgICBpZihlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHRoaXMucHV0QmFyTWFwID0gZnVuY3Rpb24oYmFyTWFwLGNhbGxiYWNrKXtcbiAgICAvLyAgICAgbGV0IG1hcCA9IHt9O1xuICAgIC8vICAgICBiYXJNYXAuZ2V0RmlsZUxpc3QoKS5mb3JFYWNoKGZpbGU9PntcbiAgICAvLyAgICAgICAgIG1hcFtmaWxlXSA9IFtdO1xuICAgIC8vICAgICAgICAgbGV0IHRlbXBTaXplID0gW107XG4gICAgLy8gICAgICAgICBiYXJNYXAuZ2V0SGFzaExpc3QoZmlsZSkuZm9yRWFjaChoYXNoPT57XG4gICAgLy8gICAgICAgICAgICAgdGVtcFNpemUucHVzaChicmlja1NpemVzW2hhc2hdKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgbWFwW2ZpbGVdID0gW2Jhck1hcC5nZXRIYXNoTGlzdChmaWxlKSx0ZW1wU2l6ZV07XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICBsZXQgYnVmZmVyID0gSlNPTi5zdHJpbmdpZnkobWFwKTtcbiAgICAvLyAgICAgbGV0IGJ1ZmZlck51bWJlciA9IEJ1ZmZlci5hbGxvYyhudW1iZXIudG9TdHJpbmcoKS5sZW5ndGgsbnVtYmVyLnRvU3RyaW5nKCkpO1xuICAgIC8vICAgICBmcy5vcGVuKGxvY2F0aW9uLCd3JywoZXJyLGZkKT0+e1xuICAgIC8vICAgICAgICAgZnMud3JpdGUoZmQsYnVmZmVyTnVtYmVyLDAsYnVmZmVyTnVtYmVyLmxlbmd0aCwwLChlcnIsYnl0ZXNSZWFkLHN0cik9PntcbiAgICAvLyAgICAgICAgICAgICBpZihlcnIpXG4gICAgLy8gICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIGZzLndyaXRlKGZkLGJ1ZmZlciwwLGJ1ZmZlci5sZW5ndGgsYmFyTWFwUG9zaXRpb24sKGVycix3cnQsc3RyKT0+e1xuICAgIC8vICAgICAgICAgICAgIGlmKGVycilcbiAgICAvLyAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyB9XG5cbiAgICB0aGlzLnB1dEJhck1hcCA9IGZ1bmN0aW9uKGJhck1hcCxjYWxsYmFjayl7XG4gICAgICAgIC8vIGJhck1hcC5nZXRGaWxlTGlzdCgpLmZvckVhY2goZmlsZT0+e1xuICAgICAgICAvLyAgICAgbWFwW2ZpbGVdID0gW107XG4gICAgICAgIC8vICAgICBsZXQgdGVtcFNpemUgPSBbXTtcbiAgICAgICAgLy8gICAgIGJhck1hcC5nZXRIYXNoTGlzdChmaWxlKS5mb3JFYWNoKGhhc2g9PntcbiAgICAgICAgLy8gICAgICAgICB0ZW1wU2l6ZS5wdXNoKGJyaWNrU2l6ZXNbaGFzaF0pO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vICAgICBtYXBbZmlsZV0gPSBbYmFyTWFwLmdldEhhc2hMaXN0KGZpbGUpLHRlbXBTaXplXTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIGxldCBidWZmZXIgPSBKU09OLnN0cmluZ2lmeShtYXApO1xuICAgICAgICAvLyBsZXQgYnVmZmVyTnVtYmVyID0gQnVmZmVyLmFsbG9jKG51bWJlci50b1N0cmluZygpLmxlbmd0aCxudW1iZXIudG9TdHJpbmcoKSk7XG4gICAgICAgIC8vIGZzLm9wZW4obG9jYXRpb24sJ3cnLChlcnIsZmQpPT57XG4gICAgICAgIC8vICAgICBmcy53cml0ZShmZCxidWZmZXJOdW1iZXIsMCxidWZmZXJOdW1iZXIubGVuZ3RoLDAsKGVycixieXRlc1JlYWQsc3RyKT0+e1xuICAgICAgICAvLyAgICAgICAgIGlmKGVycilcbiAgICAgICAgLy8gICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyAgICAgZnMud3JpdGUoZmQsYnVmZmVyLDAsYnVmZmVyLmxlbmd0aCxiYXJNYXBQb3NpdGlvbiwoZXJyLHdydCxzdHIpPT57XG4gICAgICAgIC8vICAgICAgICAgaWYoZXJyKVxuICAgICAgICAvLyAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBsZXQgdGVtcE1hcCA9IHt9O1xuICAgICAgICAvLyBtYXAuZ2V0RmlsZUxpc3QoKS5mb3JFYWNoKGtleT0+e1xuICAgICAgICAvLyAgICAgbWFwLmdldEhhc2hMaXN0KGtleSkuZm9yRWFjaChlbD0+e1xuICAgICAgICAvLyAgICAgICAgIHRlbXBNYXBba2V5XSA9IGVsO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBsZXQgbWFwVG9Xcml0ZSA9IHt9O1xuICAgICAgICAvLyBtYXBUb1dyaXRlLnBvc2l0aW9ucyA9IHRlbXBNYXA7XG4gICAgICAgIC8vIG1hcFRvV3JpdGUuaW5kZXhlcyA9IG1hcC5nZXRMaXN0T2ZCcmlja1Bvc2l0aW9ucygpO1xuICAgICAgICAvLyBsZXQgc3RyaW5nVG9Xcml0ZSA9IEpTT24uc3RyaW5naWZ5KG1hcFRvV3JpdGUpO1xuICAgICAgICAvLyBsZXQgdGVtcEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYyhzdHJpbmdUb1dyaXRlLmxlbmd0aCxzdHJpbmdUb1dyaXRlKTtcbiAgICAgICAgbGV0IG1hcCA9IGJhck1hcC50b0JyaWNrKCk7XG4gICAgICAgIGxldCB0ZW1wQnVmZmVyID0gQnVmZmVyLmFsbG9jKG1hcC5nZXREYXRhKCkubGVuZ3RoLG1hcC5nZXREYXRhKCkudG9TdHJpbmcoKSk7XG4gICAgICAgIGZzLm9wZW4obG9jYXRpb24sJ3IrJywoZXJyLGZkKT0+e1xuICAgICAgICAgICAgaWYoZXJyKVxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgZnMud3JpdGUoZmQsdGVtcEJ1ZmZlciwwLHRlbXBCdWZmZXIubGVuZ3RoLGJhck1hcFBvc2l0aW9uLChlcnIsd3J0LGJ1ZmYpPT57XG4gICAgICAgICAgICAgICAgaWYoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCk7XG4gICAgfVxuXG4gICAgLy8gdGhpcy5nZXRCYXJNYXAgPSBmdW5jdGlvbihjYWxsYmFjayl7XG4gICAgLy8gICAgIGZzLm9wZW4obG9jYXRpb24sJ3IrJywoZXJyLGZkKT0+e1xuICAgIC8vICAgICAgICAgaWYoZXJyKVxuICAgIC8vICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIC8vICAgICAgICAgbGV0IGJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygxMjgpO1xuICAgIC8vICAgICAgICAgZnMucmVhZChmZCxidWZmZXIsMCw3OCwwLChlcnIsYnl0ZXNSZWFkLGJ1ZmZlcik9PntcbiAgICAvLyAgICAgICAgICAgICBpZihlcnIpXG4gICAgLy8gICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIC8vICAgICAgICAgICAgIGxldCBudW1iZXIgPSBQYXJzZUludChidWZmZXIuc2xpY2UoMCxieXRlc1JlYWQpKTtcbiAgICAvLyAgICAgICAgICAgICBiYXJNYXBQb3NpdGlvbiA9IG51bWJlcjtcbiAgICAvLyAgICAgICAgICAgICBmcy5zdGF0KGxvY2F0aW9uLChlcnIsc3RhdCk9PntcbiAgICAvLyAgICAgICAgICAgICAgICAgbGV0IGJ1ZmZlckJNID0gQnVmZmVyLmFsbG9jKHN0YXQuc2l6ZS1udW1iZXIpO1xuICAgIC8vICAgICAgICAgICAgICAgICBmcy5yZWFkKGZkLGJ1ZmZlckJNLDAsYnVmZmVyQk0ubGVuZ3RoLG51bWJlciwoZXJyLGJ5dGVzUmVhZCxidWZmZXIpPT57XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcCA9IEpTT04ucGFyc2UoYnVmZmVyQk0udG9TdHJpbmcoKSk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcEhlYWRlciA9IHt9O1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGVtcCkuZm9yRWFjaChrZXk9PntcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wSGVhZGVyW2tleV0gPSB0ZW1wW2tleV1bMF07XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBBcnIgPSB0ZW1wW2tleV1bMV07XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wSGVhZGVyW2tleV0uZm9yRWFjaChlbGVtZW50PT57XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyaWNrU2l6ZXNbZWxlbWVudF0gPSB0ZW1wQXJyW2luZGV4XTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9KVxuICAgIC8vIH1cblxuICAgIC8vIHRoaXMuZ2V0QmFyTWFwID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgIC8vICAgICBmcy5vcGVuKGxvY2F0aW9uLCdyKycsKGVycixmZCk9PntcbiAgICAvLyAgICAgICAgIGlmKGVycilcbiAgICAvLyAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAvLyAgICAgICAgIGxldCBidWZmZXIgPSBCdWZmZXIuYWxsb2MoMTI4KTtcbiAgICAvLyAgICAgICAgIGZzLnJlYWQoZmQsYnVmZmVyLDAsNzgsMCwoZXJyLGJ5dGVzUmVhZCxidWZmZXIpPT57XG4gICAgLy8gICAgICAgICAgICAgaWYoZXJyKVxuICAgIC8vICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAvLyAgICAgICAgICAgICBsZXQgbnVtYmVyID0gUGFyc2VJbnQoYnVmZmVyLnNsaWNlKDAsYnl0ZXNSZWFkKSk7XG4gICAgLy8gICAgICAgICAgICAgYmFyTWFwUG9zaXRpb24gPSBudW1iZXI7XG4gICAgLy8gICAgICAgICAgICAgZnMuc3RhdChsb2NhdGlvbiwoZXJyLHN0YXQpPT57XG4gICAgLy8gICAgICAgICAgICAgICAgIGxldCBidWZmZXJCTSA9IEJ1ZmZlci5hbGxvYyhzdGF0LnNpemUtbnVtYmVyKTtcbiAgICAvLyAgICAgICAgICAgICAgICAgZnMucmVhZChmZCxidWZmZXJCTSwwLGJ1ZmZlckJNLmxlbmd0aCxudW1iZXIsKGVycixieXRlc1JlYWQsYnVmZmVyKT0+e1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXAgPSBKU09OLnBhcnNlKGJ1ZmZlckJNLnRvU3RyaW5nKCkpO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBIZWFkZXIgPSB7fTtcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRlbXApLmZvckVhY2goa2V5PT57XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEhlYWRlcltrZXldID0gdGVtcFtrZXldWzBdO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wQXJyID0gdGVtcFtrZXldWzFdO1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IDA7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgdGVtcEhlYWRlcltrZXldLmZvckVhY2goZWxlbWVudD0+e1xuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmlja1NpemVzW2VsZW1lbnRdID0gdGVtcEFycltpbmRleF07XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4Kys7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgICAgICAgICAgfSk7XG4gICAgLy8gICAgICAgICAgICAgfSk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfSlcbiAgICAvLyB9XG5cbiAgICB0aGlzLmdldEJhck1hcCA9IGZ1bmN0aW9uKG1hcERpZ2VzdCxjYWxsYmFjayl7XG4gICAgICAgIGlmKG1hcERpZ2VzdCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCxuZXcgQmFyTWFwKCkpO1xuICAgICAgICB9XG4gICAgICAgIGZzLm9wZW4obG9jYXRpb24sJ3IrJywoZXJyLGZkKT0+e1xuICAgICAgICAgICAgaWYoZXJyKVxuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgZnMuc3RhdChsb2NhdGlvbiwoZXJyLHN0YXQpPT57XG4gICAgICAgICAgICAgICAgaWYoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICBsZXQgbnVtYmVyQnVmZmVyID0gQnVmZmVyLmFsbG9jKDY0KTtcbiAgICAgICAgICAgICAgICBmcy5yZWFkKGZkLG51bWJlckJ1ZmZlciwwLG51bWJlckJ1ZmZlci5sZW5ndGgsMCwoZXJyLGJ5dGVzUmVhZCxudW1iZXJCdWZmZXIpPT57XG4gICAgICAgICAgICAgICAgICAgIGlmKGVycilcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICBudW1iZXJCdWZmZXIgPSBudW1iZXJCdWZmZXIuc2xpY2UoMCxieXRlc1JlYWQpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcEJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygoc3RhdC5zaXplLXBhcnNlSW50KG51bWJlckJ1ZmZlci50b1N0cmluZygpKSkpO1xuICAgICAgICAgICAgICAgICAgICBmcy5yZWFkKGZkLHRlbXBCdWZmZXIsMCx0ZW1wQnVmZmVyLmxlbmd0aCxwYXJzZUludChudW1iZXJCdWZmZXIpLChlcnIsYnl0ZXNSZWFkLHRlbXBCdWZmZXIpPT57XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihlcnIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wQnVmZmVyID0gdGVtcEJ1ZmZlci5zbGljZSgwLGJ5dGVzUmVhZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcE1hcCA9IEpTT04ucGFyc2UodGVtcEJ1ZmZlci50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCA9IG5ldyBNYXAodGVtcE1hcC5wb3NpdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLnNldExpc3RPZkJyaWNrUG9zaXRpb25zKHRlbXBNYXAuaW5kZXhlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsbWFwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIHRoaXMuZ2V0QnJpY2sgPSBmdW5jdGlvbihicmlja0hhc2gsY2FsbGJhY2spe1xuICAgIC8vICAgICBsZXQgYnVmZmVyID0gQnVmZmVyLmFsbG9jKGJyaWNrU2l6ZXNbYnJpY2tIYXNoXSk7XG4gICAgLy8gICAgIGZzLm9wZW4obG9jYXRpb24sJ3IrJywoZXJyLGZkKT0+e1xuICAgIC8vICAgICAgICAgaWYoZXJyKVxuICAgIC8vICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIC8vXG4gICAgLy8gICAgICAgICBmcy5yZWFkKGZkLGJ1ZmZlciwwLGJ1ZmZlci5sZW5ndGgscmVsYXRpdmVQb3NpdGlvbiwoZXJyLGJ5dGVzUmVhZCxidWZmKT0+e1xuICAgIC8vICAgICAgICAgICAgIHJlbGF0aXZlUG9zaXRpb24gKz0gYnJpY2tTaXplc1tiaXJrSGFzaF07XG4gICAgLy8gICAgICAgICAgICAgY2FsbGJhY2soZXJyLGJ1ZmZlci5zbGljZSgwLGJ5dGVzUmVhZCkpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH1cblxuICAgIHRoaXMuZ2V0QnJpY2sgPSBmdW5jdGlvbihicmlja0luZGV4LGNhbGxiYWNrKXtcbiAgICAgICAgbGV0IHRlbXBCdWZmZXIgPSBCdWZmZXIuYWxsb2MobWFwLmdldFBvc2l0aW9uKGJyaWNrSW5kZXgrMSktbWFwLmdldFBvc2l0aW9uKGJyaWNrSW5kZXgpKTtcbiAgICAgICAgZnMub3Blbihsb2NhdGlvbiwncisnLChlcnIsZmQpPT57XG4gICAgICAgICAgICBmcy5yZWFkKGZkLHRlbXBCdWZmZXIsMCxtYXAuZ2V0UG9zaXRpb24oYnJpY2tJbmRleCsxKS1tYXAuZ2V0UG9zaXRpb24oYnJpY2tJbmRleCksbWFwLmdldFBvc2l0aW9uKGJyaWNrSW5kZXgpLChlcnIsYnl0ZXNSZWFkLHRlbXBCdWZmZXIpPT57XG4gICAgICAgICAgICAgICAgaWYoZXJyKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB0ZW1wQnVmZmVyID0gdGVtcEJ1ZmZlci5zbGljZSgwLGJ5dGVzUmVhZCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLHRlbXBCdWZmZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlRmlsZUJyaWNrU3RvcmFnZTogZnVuY3Rpb24gKGxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiBuZXcgRmlsZUJyaWNrU3RvcmFnZShsb2NhdGlvbik7XG4gICAgfVxufTsiLCJjb25zdCBCcmljayA9IHJlcXVpcmUoXCIuL0JyaWNrXCIpO1xuXG5mdW5jdGlvbiBGb2xkZXJCYXJNYXAoaGVhZGVyKXtcbiAgICBoZWFkZXIgPSBoZWFkZXIgfHwge307XG4gICAgLy9oZWFkZXIgZXN0ZSB1biBtYXAgaW4gY2FyZSB2b20gcmV0aW5lIGRhdGVsZSBpbnRyLXVuIGZvcm1hdCBqc29uXG4gICAgLy92b20gYXZlYSBrZXktdWwgY2FyZSB2YSBmaSBmaWxlbmFtZS11bCwgc2kgZGF0ZWxlIGNhcmUgdmEgZmkgbGlzdGEgZGUgaGFzaC11cmlcbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChmaWxlUGF0aCwgYnJpY2spIHtcbiAgICAgICAgLy9oYXNoTGlzdC11bCB2YSBmaSBkaXJlY3QgbGlzdGEgZGUgaGFzaC11cmksIHBlbnRydSBjYSBvIHB1dGVtIGZhY2UgcGUgbWFzdXJhXG4gICAgICAgIC8vY2UgbmUgb2N1cGFtIGRlIHNhbHZhcmVhIGJyaWNrLXVyaWxvclxuICAgICAgICBpZiAodHlwZW9mIGhlYWRlcltmaWxlUGF0aF0gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGhlYWRlcltmaWxlUGF0aF0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGhlYWRlcltmaWxlUGF0aF0ucHVzaChicmljay5nZXRIYXNoKCkpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldEhhc2hMaXN0ID0gZnVuY3Rpb24gKGZpbGVQYXRoKSB7XG4gICAgICAgIC8vYXZlbSBuZXZvaWUgZGUgaGFzaC11cmkgY2Egc2EgcHV0ZW0gb2J0aW5lIGJyaWNrLXVyaWxlIHVudWkgZmlzaWVyXG4gICAgICAgIC8vdW4gaGFzaCBlc3RlIGRlIGZhcHQgZGVudW1pcmVhIHVudWkgYnJpY2tcbiAgICAgICAgLy9hY2Vhc3RhIGZ1bmN0aWUgcmV0dXJuZWF6YSBsaXN0YSBkZSBoYXNoLXVyaVxuICAgICAgICByZXR1cm4gaGVhZGVyW2ZpbGVQYXRoXTtcbiAgICB9O1xuXG4gICAgdGhpcy5lbXB0eUxpc3QgPSBmdW5jdGlvbiAoZmlsZVBhdGgpIHtcbiAgICAgICAgaGVhZGVyW2ZpbGVQYXRoXSA9IFtdO1xuICAgIH07XG5cbiAgICB0aGlzLnRvQnJpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQnJpY2soQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoaGVhZGVyKSkpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldEZpbGVMaXN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoaGVhZGVyKTtcbiAgICB9O1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gRm9sZGVyQmFyTWFwOyIsImNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuY29uc3QgQmFyTWFwID0gcmVxdWlyZShcIi4vRm9sZGVyQmFyTWFwXCIpO1xuY29uc3QgQnJpY2sgPSByZXF1aXJlKFwiLi9Ccmlja1wiKTtcblxuZnVuY3Rpb24gRm9sZGVyQnJpY2tTdG9yYWdlKGxvY2F0aW9uKSB7XG5cbiAgICB0aGlzLnB1dEJyaWNrID0gZnVuY3Rpb24gKGJyaWNrLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCB3cml0ZVN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHBhdGguam9pbihsb2NhdGlvbiwgYnJpY2suZ2V0SGFzaCgpKSk7XG4gICAgICAgIHdyaXRlU3RyZWFtLndyaXRlKGJyaWNrLmdldERhdGEoKSwgY2FsbGJhY2spO1xuICAgICAgICAvL2FjZWFzdGEgZnVuY3RpZSB2YSBwcmltaSB1biBicmlja1xuICAgICAgICAvL3NpIHZhIGFwZWxhIG8gZnVjbnRpZSBkaW4gQmFyV29ya2VyIGNlIHNlIHZhIG9jdXBhIGRlIHNjcmllcmVhIGRhdGVsb3IgaW4gZmlzaWVyXG4gICAgfTtcblxuICAgIHRoaXMuZ2V0QnJpY2sgPSBmdW5jdGlvbiAoYnJpY2tIYXNoLCBjYWxsYmFjaykge1xuICAgICAgICBmcy5yZWFkRmlsZShwYXRoLmpvaW4obG9jYXRpb24sIGJyaWNrSGFzaCksIChlcnIsIGJyaWNrRGF0YSkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBuZXcgQnJpY2soYnJpY2tEYXRhKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmRlbGV0ZUJyaWNrID0gZnVuY3Rpb24gKGJyaWNrSGFzaCwgY2FsbGJhY2spIHtcbiAgICAgICAgZnMudW5saW5rKHBhdGguam9pbihsb2NhdGlvbiwgYnJpY2tIYXNoKSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB0aGlzLnB1dEJhck1hcCA9IGZ1bmN0aW9uIChiYXJNYXAsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGJhck1hcEJyaWNrID0gYmFyTWFwLnRvQnJpY2soKTtcbiAgICAgICAgdGhpcy5wdXRCcmljayhiYXJNYXBCcmljaywgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycilcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgYmFyTWFwQnJpY2suZ2V0SGFzaCgpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0QmFyTWFwID0gZnVuY3Rpb24gKG1hcERpZ2VzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXBEaWdlc3QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBtYXBEaWdlc3Q7XG4gICAgICAgICAgICBtYXBEaWdlc3QgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG1hcERpZ2VzdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHVuZGVmaW5lZCwgbmV3IEJhck1hcCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ2V0QnJpY2sobWFwRGlnZXN0LCAoZXJyLCBtYXBCcmljaykgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBuZXcgQmFyTWFwKEpTT04ucGFyc2UobWFwQnJpY2suZ2V0RGF0YSgpLnRvU3RyaW5nKCkpKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvL2FjZWFzdGEgZnVuY3RpZSB2YSBwcmltaSBpZC11bCB1bnVpIGJyaWNrXG4gICAgLy92YSBjYXV0YSBmaXNpZXJ1bCBjYXJ1aWEgaWkgY29yZXNwdW5kZSBpZC11bFxuICAgIC8vaWwgdmEgY2l0aSB0b3QgcHJpbiBpbnRlcm1lZGl1bCBCYXJXb3JrZXIsIHByaW50ci1vIGZ1bmN0aWVcbiAgICAvL2lsIHZhIHRyaW1pdGUgaW4gY2FsbGJhY2ssIHVuZGUgdmEgZmkgbWFpIGRlcGFydGUsIHNhbHZhdFxuICAgIC8vcGFydGVhIGRlIGNpdGlyZSB2YSBmaSBmYWN1dGEgcHJpbiBpbnRlcm1lZGl1bCBmdW5jdGllaSAncmVhZEZyb21GaWxlJyBkaW4gQmFyV29ya2VyXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZUZvbGRlckJyaWNrU3RvcmFnZTogZnVuY3Rpb24gKGxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiBuZXcgRm9sZGVyQnJpY2tTdG9yYWdlKGxvY2F0aW9uKTtcbiAgICB9XG59OyIsImNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBBc3luY0Rpc3B0YWNoZXIgPSByZXF1aXJlKFwiLi4vdXRpbHMvQXN5bmNEaXNwYXRjaGVyXCIpO1xuXG5mdW5jdGlvbiBQYXRoQXN5bmNJdGVyYXRvcihpbnB1dFBhdGgpIHtcbiAgICBsZXQgcmVtb3ZhYmxlUGF0aExlbjtcbiAgICBjb25zdCBmaWxlTGlzdCA9IFtdO1xuICAgIGNvbnN0IGZvbGRlckxpc3QgPSBbXTtcbiAgICBsZXQgaXNGaXJzdENhbGwgPSB0cnVlO1xuICAgIGxldCBwYXRoSXNGb2xkZXI7XG5cbiAgICB0aGlzLm5leHQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGlzRmlyc3RDYWxsID09PSB0cnVlKSB7XG4gICAgICAgICAgICBpc0RpcihpbnB1dFBhdGgsIChlcnIsIHN0YXR1cykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaXNGaXJzdENhbGwgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYXRoSXNGb2xkZXIgPSBzdGF0dXM7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGxpdElucHV0UGF0aCA9IGlucHV0UGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgICAgICAgICAgICAgIHNwbGl0SW5wdXRQYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICByZW1vdmFibGVQYXRoTGVuID0gc3BsaXRJbnB1dFBhdGguam9pbihwYXRoLnNlcCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBmb2xkZXJMaXN0LnB1c2goaW5wdXRQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgZ2V0TmV4dEZpbGVGcm9tRm9sZGVyKGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmFibGVQYXRoTGVuID0gcGF0aC5kaXJuYW1lKGlucHV0UGF0aCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlTmFtZSA9IGlucHV0UGF0aC5zdWJzdHJpbmcocmVtb3ZhYmxlUGF0aExlbik7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBmaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNlIGlmKHBhdGhJc0ZvbGRlcil7XG4gICAgICAgICAgICBnZXROZXh0RmlsZUZyb21Gb2xkZXIoY2FsbGJhY2spO1xuICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1JbnRlcm5hbCBtZXRob2RzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGZ1bmN0aW9uIHdhbGtGb2xkZXIoZm9sZGVyUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgYXN5bmNEaXNwYXRjaGVyID0gbmV3IEFzeW5jRGlzcHRhY2hlcigoZXJyb3JzLCByZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVOYW1lID0gZmlsZUxpc3Quc2hpZnQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodW5kZWZpbmVkLCBmaWxlTmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChmb2xkZXJMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb2xkZXJOYW1lID0gZm9sZGVyTGlzdC5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB3YWxrRm9sZGVyKGZvbGRlck5hbWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGZzLnJlYWRkaXIoZm9sZGVyUGF0aCwgKGVyciwgZmlsZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCA9PT0gMCAmJiBmb2xkZXJMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgd2Fsa0ZvbGRlcihmb2xkZXJMaXN0LnNoaWZ0KCksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KGZpbGVzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgIGZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVQYXRoID0gcGF0aC5qb2luKGZvbGRlclBhdGgsIGZpbGUpO1xuICAgICAgICAgICAgICAgIGlzRGlyKGZpbGVQYXRoLCAoZXJyLCBzdGF0dXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb2xkZXJMaXN0LnB1c2goZmlsZVBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUxpc3QucHVzaChmaWxlUGF0aC5zdWJzdHJpbmcocmVtb3ZhYmxlUGF0aExlbikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXNEaXIoZmlsZVBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGZzLnN0YXQoZmlsZVBhdGgsIChlcnIsIHN0YXRzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh1bmRlZmluZWQsIHN0YXRzLmlzRGlyZWN0b3J5KCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXROZXh0RmlsZUZyb21Gb2xkZXIoY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGZpbGVMaXN0Lmxlbmd0aCA9PT0gMCAmJiBmb2xkZXJMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmlsZUxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBmaWxlTGlzdC5zaGlmdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHVuZGVmaW5lZCwgZmlsZU5hbWUpO1xuICAgICAgICB9XG5cblxuICAgICAgICB3YWxrRm9sZGVyKGZvbGRlckxpc3Quc2hpZnQoKSwgKGVyciwgZmlsZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGUpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIEZzQmFyV29ya2VyKCkge1xuXG4gICAgbGV0IHBhdGhBc3luY0l0ZXJhdG9yO1xuXG4gICAgdGhpcy5nZXRGaWxlU2l6ZSA9IGZ1bmN0aW9uIChmaWxlUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgZnMuc3RhdChmaWxlUGF0aCwgKGVyciwgc3RhdHMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBzdGF0cy5zaXplKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vcmVhZEJsb2NrRnJvbUZpbGVcbiAgICB0aGlzLnJlYWRCbG9ja0Zyb21GaWxlID0gZnVuY3Rpb24gKGZpbGVQYXRoLCBibG9ja0luZGV4LCBidWZmZXJTaXplLCBjYWxsYmFjaykge1xuICAgICAgICBmcy5vcGVuKGZpbGVQYXRoLCAncisnLCBmdW5jdGlvbiAoZXJyLCBmZCkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgYnVmZmVyID0gQnVmZmVyLmFsbG9jKGJ1ZmZlclNpemUpO1xuICAgICAgICAgICAgZnMucmVhZChmZCwgYnVmZmVyLCAwLCBidWZmZXJTaXplLCBidWZmZXJTaXplICogYmxvY2tJbmRleCwgKGVyciwgYnl0ZXNSZWFkLCBidWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZzLmNsb3NlKGZkLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgYnVmZmVyLnNsaWNlKDAsIGJ5dGVzUmVhZCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmdldE5leHRGaWxlID0gZnVuY3Rpb24gKGlucHV0UGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgcGF0aEFzeW5jSXRlcmF0b3IgPSBwYXRoQXN5bmNJdGVyYXRvciB8fCBuZXcgUGF0aEFzeW5jSXRlcmF0b3IoaW5wdXRQYXRoKTtcbiAgICAgICAgcGF0aEFzeW5jSXRlcmF0b3IubmV4dChjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIC8vYXBwZW5kVG9GaWxlXG4gICAgdGhpcy5hcHBlbmRCbG9ja1RvRmlsZSA9IGZ1bmN0aW9uIChmaWxlUGF0aCwgZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgcHRoID0gY29uc3RydWN0UGF0aChmaWxlUGF0aCk7XG5cbiAgICAgICAgZnMubWtkaXIocHRoLCB7cmVjdXJzaXZlOiB0cnVlfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIuY29kZSAhPT0gXCJFRVhJU1RcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcy5hcHBlbmRGaWxlKGZpbGVQYXRoLCBkYXRhLCBjYWxsYmFjayk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyB0aGlzLmdldFJlYWRTdHJlYW0gPSBmdW5jdGlvbihmaWxlUGF0aCxidWZmZXJTaXplKXtcbiAgICAvLyAgICAgcmV0dXJuIGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgse2hpZ2hXYXRlck1hcms6YnVmZmVyU2l6ZX0pO1xuICAgIC8vIH1cblxuICAgIC8vIHRoaXMuZ2V0V3JpdGVTdHJlYW0gPSBmdW5jdGlvbihmaWxlUGF0aCl7XG4gICAgLy8gICAgIHJldHVybiBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaWxlUGF0aCk7XG4gICAgLy8gfVxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSW50ZXJuYWwgbWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBmdW5jdGlvbiBjb25zdHJ1Y3RQYXRoKGZpbGVQYXRoKSB7XG4gICAgICAgIGxldCBzbGljZXMgPSBmaWxlUGF0aC5zcGxpdChwYXRoLnNlcCk7XG4gICAgICAgIHNsaWNlcy5wb3AoKTtcbiAgICAgICAgcmV0dXJuIHNsaWNlcy5qb2luKHBhdGguc2VwKTtcbiAgICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlRnNCYXJXb3JrZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGc0JhcldvcmtlcigpO1xuICAgIH1cbn07IiwiXG5mdW5jdGlvbiBBc3luY0Rpc3BhdGNoZXIoZmluYWxDYWxsYmFjaykge1xuXHRsZXQgcmVzdWx0cyA9IFtdO1xuXHRsZXQgZXJyb3JzID0gW107XG5cblx0bGV0IHN0YXJ0ZWQgPSAwO1xuXG5cdGZ1bmN0aW9uIG1hcmtPbmVBc0ZpbmlzaGVkKGVyciwgcmVzKSB7XG5cdFx0aWYoZXJyKSB7XG5cdFx0XHRlcnJvcnMucHVzaChlcnIpO1xuXHRcdH1cblxuXHRcdGlmKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG5cdFx0XHRhcmd1bWVudHNbMF0gPSB1bmRlZmluZWQ7XG5cdFx0XHRyZXMgPSBhcmd1bWVudHM7XG5cdFx0fVxuXG5cdFx0aWYodHlwZW9mIHJlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cmVzdWx0cy5wdXNoKHJlcyk7XG5cdFx0fVxuXG5cdFx0aWYoLS1zdGFydGVkIDw9IDApIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsQ2FsbGJhY2soKTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBkaXNwYXRjaEVtcHR5KGFtb3VudCA9IDEpIHtcblx0XHRzdGFydGVkICs9IGFtb3VudDtcblx0fVxuXG5cdGZ1bmN0aW9uIGNhbGxDYWxsYmFjaygpIHtcblx0ICAgIGlmKGVycm9ycyAmJiBlcnJvcnMubGVuZ3RoID09PSAwKSB7XG5cdCAgICAgICAgZXJyb3JzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cblx0ICAgIGlmKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPT09IDApIHtcblx0ICAgICAgICByZXN1bHRzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmluYWxDYWxsYmFjayhlcnJvcnMsIHJlc3VsdHMpO1xuICAgIH1cblxuXHRyZXR1cm4ge1xuXHRcdGRpc3BhdGNoRW1wdHksXG5cdFx0bWFya09uZUFzRmluaXNoZWRcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBc3luY0Rpc3BhdGNoZXI7IiwiZnVuY3Rpb24gaXNTdHJlYW0oc3RyZWFtKXtcbiAgICByZXR1cm4gc3RyZWFtICE9PSBudWxsICYmIHR5cGVvZiBzdHJlYW0gPT09ICdvYmplY3QnICYmIHR5cGVvZiBzdHJlYW0ucGlwZSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNXcml0YWJsZShzdHJlYW0pIHtcbiAgICByZXR1cm4gaXNTdHJlYW0oc3RyZWFtKSAmJlxuICAgICAgICBzdHJlYW0ud3JpdGFibGUgIT09IGZhbHNlICYmXG4gICAgICAgIHR5cGVvZiBzdHJlYW0uX3dyaXRlID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIHR5cGVvZiBzdHJlYW0uX3dyaXRhYmxlU3RhdGUgPT09ICdvYmplY3QnO1xuXG59XG5cbmZ1bmN0aW9uIGlzUmVhZGFibGUoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGlzU3RyZWFtKHN0cmVhbSkgJiZcbiAgICAgICAgc3RyZWFtLnJlYWRhYmxlICE9PSBmYWxzZSAmJlxuICAgICAgICB0eXBlb2Ygc3RyZWFtLl9yZWFkID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIHR5cGVvZiBzdHJlYW0uX3JlYWRhYmxlU3RhdGUgPT09ICdvYmplY3QnO1xufVxuXG5mdW5jdGlvbiBpc0R1cGxleChzdHJlYW0pe1xuICAgIHJldHVybiBpc1dyaXRhYmxlKHN0cmVhbSkgJiZcbiAgICAgICAgaXNSZWFkYWJsZShzdHJlYW0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpc1N0cmVhbSxcbiAgICBpc1JlYWRhYmxlLFxuICAgIGlzV3JpdGFibGUsXG4gICAgaXNEdXBsZXhcbn07XG4iLCJjb25zdCBmbG93c1V0aWxzID0gcmVxdWlyZShcIi4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZShcIi4uL3V0aWxzL0RzZWVkQ2FnZVwiKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiYWRkQmFja3VwXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKGJhY2t1cFVybCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIGlmKCFiYWNrdXBVcmwpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIG5ldyBFcnJvcihcIk5vIGJhY2t1cCB1cmwgcHJvdmlkZWRcIikpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLmJhY2t1cFVybCA9IGJhY2t1cFVybDtcbiAgICAgICAgZnMuc3RhdChwYXRoLmpvaW4odGhpcy5sb2NhbEZvbGRlciwgXCIucHJpdmF0ZVNreVwiLCAnZHNlZWQnKSwgKGVyciwgc3RhdHMpPT57XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImNyZWF0ZVBpblwiLCBmbG93c1V0aWxzLmRlZmF1bHRQaW4sIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVBpbjogZnVuY3Rpb24gKHBpbikge1xuICAgICAgICB2YWxpZGF0b3IudmFsaWRhdGVQaW4odGhpcy5sb2NhbEZvbGRlciwgdGhpcywgXCJhZGRCYWNrdXBcIiwgcGluLCBmbG93c1V0aWxzLm5vVHJpZXMpO1xuICAgIH0sXG4gICAgXG4gICAgYWRkQmFja3VwOiBmdW5jdGlvbiAocGluID0gZmxvd3NVdGlscy5kZWZhdWx0UGluLCBiYWNrdXBzKSB7XG4gICAgICAgIGJhY2t1cHMgPSBiYWNrdXBzIHx8IFtdO1xuICAgICAgICBiYWNrdXBzLnB1c2godGhpcy5iYWNrdXBVcmwpO1xuICAgICAgICBjb25zdCBkc2VlZENhZ2UgPSBuZXcgRHNlZWRDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICBkc2VlZENhZ2Uuc2F2ZURzZWVkQmFja3VwcyhwaW4sIHRoaXMuY3NiSWRlbnRpZmllciwgYmFja3VwcywgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ2ZpbmlzaCcsIFwiRmFpbGVkIHRvIHNhdmUgYmFja3Vwc1wiKSk7XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgJ3ByaW50SW5mbycsIHRoaXMuYmFja3VwVXJsICsgJyBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgYWRkZWQgdG8gYmFja3VwcyBsaXN0LicpO1xuICAgIH1cbn0pOyIsIi8vIHZhciBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cbmNvbnN0IHV0aWxzID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvZmxvd3NVdGlsc1wiKTtcbi8vIGNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG4vLyB2YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiYWRkQ3NiXCIsIHtcblx0c3RhcnQ6IGZ1bmN0aW9uIChhbGlhc0NzYiwgYWxpYXNEZXN0Q3NiKSB7XG5cdFx0dGhpcy5hbGlhc0NzYiA9IGFsaWFzQ3NiO1xuXHRcdHRoaXMuYWxpYXNEZXN0Q3NiID0gYWxpYXNEZXN0Q3NiO1xuXHRcdHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgMyk7XG5cdH0sXG5cdHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHV0aWxzLmNoZWNrUGluSXNWYWxpZChwaW4sIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdGlmKGVycil7XG5cdFx0XHRcdHNlbGYuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgbm9Ucmllcy0xKTtcblx0XHRcdH1lbHNlIHtcblx0XHRcdFx0c2VsZi5hZGRDc2IocGluLCBzZWxmLmFsaWFzQ3NiKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0YWRkQ3NiOiBmdW5jdGlvbiAocGluLCBhbGlhc0NTYiwgYWxpYXNEZXN0Q3NiLCBjYWxsYmFjaykge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR1dGlscy5nZXRDc2IocGluLCBhbGlhc0NTYiwgZnVuY3Rpb24gKGVyciwgcGFyZW50Q3NiKSB7XG5cdFx0XHRpZihlcnIpe1xuXHRcdFx0XHRzZWxmLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBlcnIsIFwiRmFpbGVkIHRvIGdldCBjc2JcIik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pOyIsImNvbnN0IGZsb3dzVXRpbHMgPSByZXF1aXJlKFwiLi8uLi91dGlscy9mbG93c1V0aWxzXCIpO1xuY29uc3QgdXRpbHMgPSByZXF1aXJlKFwiLi8uLi91dGlscy91dGlsc1wiKTtcbmNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoXCIuLi9saWIvQ1NCSWRlbnRpZmllclwiKTtcbmNvbnN0IEhhc2hDYWdlID0gcmVxdWlyZSgnLi4vdXRpbHMvSGFzaENhZ2UnKTtcbmNvbnN0IFJvb3RDU0IgPSByZXF1aXJlKFwiLi4vbGliL1Jvb3RDU0JcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiYXR0YWNoRmlsZVwiLCB7IC8vdXJsOiBDU0IxL0NTQjIvYWxpYXNGaWxlXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICh1cmwsIGZpbGVQYXRoLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHsgLy9jc2IxOmFzc2V0VHlwZTphbGlhc1xuICAgICAgICBjb25zdCB7Q1NCUGF0aCwgYWxpYXN9ID0gdXRpbHMucHJvY2Vzc1VybCh1cmwsICdGaWxlUmVmZXJlbmNlJyk7XG4gICAgICAgIHRoaXMuQ1NCUGF0aCA9IENTQlBhdGg7XG4gICAgICAgIHRoaXMuYWxpYXMgPSBhbGlhcztcbiAgICAgICAgdGhpcy5maWxlUGF0aCA9IGZpbGVQYXRoO1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgZmxvd3NVdGlscy5ub1RyaWVzKTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVQaW46IGZ1bmN0aW9uIChwaW4sIG5vVHJpZXMpIHtcbiAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsICdsb2FkRmlsZVJlZmVyZW5jZScsIHBpbiwgbm9Ucmllcyk7XG4gICAgfSxcblxuICAgIHdpdGhDU0JJZGVudGlmaWVyOiBmdW5jdGlvbiAoaWQsIHVybCwgZmlsZVBhdGgsIGxvY2FsRm9sZGVyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgICAgICBjb25zdCB7Q1NCUGF0aCwgYWxpYXN9ID0gdXRpbHMucHJvY2Vzc1VybCh1cmwsICdGaWxlUmVmZXJlbmNlJyk7XG4gICAgICAgIHRoaXMuQ1NCUGF0aCA9IENTQlBhdGg7XG4gICAgICAgIHRoaXMuYWxpYXMgPSBhbGlhcztcbiAgICAgICAgdGhpcy5maWxlUGF0aCA9IGZpbGVQYXRoO1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMuY3NiSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKGlkKTtcbiAgICAgICAgUm9vdENTQi5sb2FkV2l0aElkZW50aWZpZXIodGhpcy5sb2NhbEZvbGRlciwgdGhpcy5jc2JJZGVudGlmaWVyLCAoZXJyLCByb290Q1NCKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaGFuZGxlRXJyb3JcIiwgZXJyLCBcIkZhaWxlZCB0byBsb2FkIHJvb3RDU0JcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJvb3RDU0IgPSByb290Q1NCO1xuICAgICAgICAgICAgdGhpcy5sb2FkRmlsZVJlZmVyZW5jZSgpO1xuXG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBsb2FkRmlsZVJlZmVyZW5jZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJvb3RDU0IubG9hZFJhd0NTQignJywgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ2xvYWRBc3NldCcsICdGYWlsZWQgdG8gbG9hZCBtYXN0ZXJDU0IuJykpO1xuICAgIH0sXG5cbiAgICBsb2FkQXNzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yb290Q1NCLmxvYWRBc3NldEZyb21QYXRoKHRoaXMuQ1NCUGF0aCwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ3NhdmVGaWxlVG9EaXNrJywgJ0ZhaWxlZCB0byBsb2FkIGFzc2V0JykpO1xuICAgIH0sXG5cbiAgICBzYXZlRmlsZVRvRGlzazogZnVuY3Rpb24gKGZpbGVSZWZlcmVuY2UpIHtcbiAgICAgICAgaWYgKGZpbGVSZWZlcmVuY2UuaXNQZXJzaXN0ZWQoKSkge1xuICAgICAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaGFuZGxlRXJyb3JcIiwgbmV3IEVycm9yKFwiRmlsZSBpcyBwZXJzaXN0ZWRcIiksIFwiQSBmaWxlIHdpdGggdGhlIHNhbWUgYWxpYXMgYWxyZWFkeSBleGlzdHMgXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3NiSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKHVuZGVmaW5lZCwgdGhpcy5jc2JJZGVudGlmaWVyLmdldEJhY2t1cFVybHMoKSk7XG4gICAgICAgIHRoaXMuZmlsZUlEID0gdXRpbHMuZ2VuZXJhdGVQYXRoKHRoaXMubG9jYWxGb2xkZXIsIGNzYklkZW50aWZpZXIpO1xuICAgICAgICBjcnlwdG8ub24oJ3Byb2dyZXNzJywgKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdyZXBvcnRQcm9ncmVzcycsIHByb2dyZXNzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNyeXB0by5lbmNyeXB0U3RyZWFtKHRoaXMuZmlsZVBhdGgsIHRoaXMuZmlsZUlELCBjc2JJZGVudGlmaWVyLmdldERzZWVkKCksIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdzYXZlRmlsZVJlZmVyZW5jZScsIFwiRmFpbGVkIGF0IGZpbGUgZW5jcnlwdGlvbi5cIiwgZmlsZVJlZmVyZW5jZSwgY3NiSWRlbnRpZmllcikpO1xuXG4gICAgfSxcblxuXG4gICAgc2F2ZUZpbGVSZWZlcmVuY2U6IGZ1bmN0aW9uIChmaWxlUmVmZXJlbmNlLCBjc2JJZGVudGlmaWVyKSB7XG4gICAgICAgIGNyeXB0by5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3Byb2dyZXNzJyk7XG4gICAgICAgIGZpbGVSZWZlcmVuY2UuaW5pdCh0aGlzLmFsaWFzLCBjc2JJZGVudGlmaWVyLmdldFNlZWQoKSwgY3NiSWRlbnRpZmllci5nZXREc2VlZCgpKTtcbiAgICAgICAgdGhpcy5yb290Q1NCLnNhdmVBc3NldFRvUGF0aCh0aGlzLkNTQlBhdGgsIGZpbGVSZWZlcmVuY2UsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdjb21wdXRlSGFzaCcsIFwiRmFpbGVkIHRvIHNhdmUgZmlsZVwiLCB0aGlzLmZpbGVJRCkpO1xuICAgIH0sXG5cblxuICAgIGNvbXB1dGVIYXNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGZpbGVTdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHRoaXMuZmlsZUlEKTtcbiAgICAgICAgY3J5cHRvLnBza0hhc2hTdHJlYW0oZmlsZVN0cmVhbSwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJsb2FkSGFzaE9ialwiLCBcIkZhaWxlZCB0byBjb21wdXRlIGhhc2hcIikpO1xuICAgIH0sXG5cbiAgICBsb2FkSGFzaE9iajogZnVuY3Rpb24gKGRpZ2VzdCkge1xuICAgICAgICB0aGlzLmhhc2hDYWdlID0gbmV3IEhhc2hDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICB0aGlzLmhhc2hDYWdlLmxvYWRIYXNoKHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwiYWRkVG9IYXNoT2JqXCIsIFwiRmFpbGVkIHRvIGxvYWQgaGFzaE9ialwiLCBkaWdlc3QpKTtcbiAgICB9LFxuXG4gICAgYWRkVG9IYXNoT2JqOiBmdW5jdGlvbiAoaGFzaE9iaiwgZGlnZXN0KSB7XG4gICAgICAgIGhhc2hPYmpbcGF0aC5iYXNlbmFtZSh0aGlzLmZpbGVJRCldID0gZGlnZXN0LnRvU3RyaW5nKFwiaGV4XCIpO1xuICAgICAgICB0aGlzLmhhc2hDYWdlLnNhdmVIYXNoKGhhc2hPYmosIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwicHJpbnRTdWNjZXNzXCIsIFwiRmFpbGVkIHRvIHNhdmUgaGFzaE9ialwiKSk7XG4gICAgfSxcblxuICAgIHByaW50U3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJwcmludEluZm9cIiwgdGhpcy5maWxlUGF0aCArIFwiIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBhZGRlZCB0byBcIiArIHRoaXMuQ1NCUGF0aCk7XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcIl9fcmV0dXJuX19cIik7XG4gICAgfVxufSk7XG4iLCJjb25zdCBmbG93c1V0aWxzID0gcmVxdWlyZSgnLi4vdXRpbHMvZmxvd3NVdGlscycpO1xuY29uc3QgUm9vdENTQiA9IHJlcXVpcmUoXCIuLi9saWIvUm9vdENTQlwiKTtcbmNvbnN0IFJhd0NTQiA9IHJlcXVpcmUoXCIuLi9saWIvUmF3Q1NCXCIpO1xuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZShcIi4uL3V0aWxzL3ZhbGlkYXRvclwiKTtcbmNvbnN0IERzZWVkQ2FnZSA9IHJlcXVpcmUoXCIuLi91dGlscy9Ec2VlZENhZ2VcIik7XG5jb25zdCBDU0JJZGVudGlmaWVyID0gcmVxdWlyZShcIi4uL2xpYi9DU0JJZGVudGlmaWVyXCIpO1xuXG4kJC5zd2FybS5kZXNjcmliZShcImNyZWF0ZUNzYlwiLCB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uIChDU0JQYXRoLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoIHx8ICcnO1xuICAgICAgICB2YWxpZGF0b3IuY2hlY2tNYXN0ZXJDU0JFeGlzdHMobG9jYWxGb2xkZXIsIChlcnIsIHN0YXR1cykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImNyZWF0ZVBpblwiLCBmbG93c1V0aWxzLmRlZmF1bHRQaW4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB3aXRob3V0UGluOiBmdW5jdGlvbiAoQ1NCUGF0aCwgYmFja3VwcywgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpLCBzZWVkLCBpc01hc3RlciA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgdGhpcy5DU0JQYXRoID0gQ1NCUGF0aDtcbiAgICAgICAgdGhpcy5pc01hc3RlciA9IGlzTWFzdGVyO1xuICAgICAgICBpZiAodHlwZW9mIGJhY2t1cHMgPT09ICd1bmRlZmluZWQnIHx8IGJhY2t1cHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBiYWNrdXBzID0gWyBmbG93c1V0aWxzLmRlZmF1bHRCYWNrdXAgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbGlkYXRvci5jaGVja01hc3RlckNTQkV4aXN0cyhsb2NhbEZvbGRlciwgKGVyciwgc3RhdHVzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVNYXN0ZXJDU0IoYmFja3Vwcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihzZWVkKTtcbiAgICAgICAgICAgICAgICB0aGlzLndpdGhDU0JJZGVudGlmaWVyKENTQlBhdGgsIGNzYklkZW50aWZpZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICB3aXRoQ1NCSWRlbnRpZmllcjogZnVuY3Rpb24gKENTQlBhdGgsIGNzYklkZW50aWZpZXIpIHtcbiAgICAgICAgdGhpcy5DU0JQYXRoID0gQ1NCUGF0aDtcbiAgICAgICAgUm9vdENTQi5sb2FkV2l0aElkZW50aWZpZXIodGhpcy5sb2NhbEZvbGRlciwgY3NiSWRlbnRpZmllciwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ2NyZWF0ZUNTQicsICdGYWlsZWQgdG8gbG9hZCBtYXN0ZXIgd2l0aCBwcm92aWRlZCBkc2VlZCcpKTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVQaW46IGZ1bmN0aW9uIChwaW4sIG5vVHJpZXMpIHtcbiAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsIFwiY3JlYXRlQ1NCXCIsIHBpbiwgbm9Ucmllcyk7XG4gICAgfSxcblxuICAgIGxvYWRCYWNrdXBzOiBmdW5jdGlvbiAocGluKSB7XG4gICAgICAgIHRoaXMucGluID0gcGluO1xuICAgICAgICB0aGlzLmRzZWVkQ2FnZSA9IG5ldyBEc2VlZENhZ2UodGhpcy5sb2NhbEZvbGRlcik7XG4gICAgICAgIHRoaXMuZHNlZWRDYWdlLmxvYWREc2VlZEJhY2t1cHModGhpcy5waW4sIChlcnIsIGNzYklkZW50aWZpZXIsIGJhY2t1cHMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZU1hc3RlckNTQigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZU1hc3RlckNTQihiYWNrdXBzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNyZWF0ZU1hc3RlckNTQjogZnVuY3Rpb24gKGJhY2t1cHMpIHtcbiAgICAgICAgdGhpcy5jc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIodW5kZWZpbmVkLCBiYWNrdXBzIHx8IGZsb3dzVXRpbHMuZGVmYXVsdEJhY2t1cCk7XG5cbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicHJpbnRTZW5zaXRpdmVJbmZvXCIsIHRoaXMuY3NiSWRlbnRpZmllci5nZXRTZWVkKCksIGZsb3dzVXRpbHMuZGVmYXVsdFBpbik7XG5cbiAgICAgICAgY29uc3QgcmF3Q1NCID0gbmV3IFJhd0NTQigpO1xuICAgICAgICBjb25zdCBtZXRhID0gcmF3Q1NCLmdldEFzc2V0KCdnbG9iYWwuQ1NCTWV0YScsICdtZXRhJyk7XG4gICAgICAgIG1ldGEuaW5pdCgpO1xuICAgICAgICBtZXRhLnNldElzTWFzdGVyKHRydWUpO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuaXNNYXN0ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBtZXRhLnNldElzTWFzdGVyKHRoaXMuaXNNYXN0ZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJhd0NTQi5zYXZlQXNzZXQobWV0YSk7XG4gICAgICAgIHRoaXMucm9vdENTQiA9IFJvb3RDU0IuY3JlYXRlTmV3KHRoaXMubG9jYWxGb2xkZXIsIHRoaXMuY3NiSWRlbnRpZmllciwgcmF3Q1NCKTtcbiAgICAgICAgY29uc3QgbmV4dFBoYXNlID0gKHRoaXMuQ1NCUGF0aCA9PT0gJycgfHwgdHlwZW9mIHRoaXMuQ1NCUGF0aCA9PT0gJ3VuZGVmaW5lZCcpID8gJ3NhdmVSYXdDU0InIDogJ2NyZWF0ZUNTQic7XG4gICAgICAgIGlmICh0aGlzLnBpbikge1xuICAgICAgICAgICAgdGhpcy5kc2VlZENhZ2Uuc2F2ZURzZWVkQmFja3Vwcyh0aGlzLnBpbiwgdGhpcy5jc2JJZGVudGlmaWVyLCBiYWNrdXBzLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBuZXh0UGhhc2UsIFwiRmFpbGVkIHRvIHNhdmUgZHNlZWQgXCIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXNbbmV4dFBoYXNlXSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNyZWF0ZUNTQjogZnVuY3Rpb24gKHJvb3RDU0IpIHtcbiAgICAgICAgdGhpcy5yb290Q1NCID0gdGhpcy5yb290Q1NCIHx8IHJvb3RDU0I7XG4gICAgICAgIGNvbnN0IHJhd0NTQiA9IG5ldyBSYXdDU0IoKTtcbiAgICAgICAgY29uc3QgbWV0YSA9IHJhd0NTQi5nZXRBc3NldChcImdsb2JhbC5DU0JNZXRhXCIsIFwibWV0YVwiKTtcbiAgICAgICAgbWV0YS5pbml0KCk7XG4gICAgICAgIG1ldGEuc2V0SXNNYXN0ZXIoZmFsc2UpO1xuICAgICAgICByYXdDU0Iuc2F2ZUFzc2V0KG1ldGEpO1xuICAgICAgICB0aGlzLnNhdmVSYXdDU0IocmF3Q1NCKTtcbiAgICB9LFxuXG4gICAgc2F2ZVJhd0NTQjogZnVuY3Rpb24gKHJhd0NTQikge1xuICAgICAgICB0aGlzLnJvb3RDU0Iuc2F2ZVJhd0NTQihyYXdDU0IsIHRoaXMuQ1NCUGF0aCwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJwcmludFN1Y2Nlc3NcIiwgXCJGYWlsZWQgdG8gc2F2ZSByYXcgQ1NCXCIpKTtcblxuICAgIH0sXG5cblxuICAgIHByaW50U3VjY2VzczogZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IFwiU3VjY2Vzc2Z1bGx5IHNhdmVkIENTQiBhdCBwYXRoIFwiICsgdGhpcy5DU0JQYXRoO1xuICAgICAgICBpZiAoIXRoaXMuQ1NCUGF0aCB8fCB0aGlzLkNTQlBhdGggPT09ICcnKSB7XG4gICAgICAgICAgICBtZXNzYWdlID0gJ1N1Y2Nlc3NmdWxseSBzYXZlZCBDU0Igcm9vdCc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicHJpbnRJbmZvXCIsIG1lc3NhZ2UpO1xuICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdfX3JldHVybl9fJyk7XG4gICAgfVxufSk7XG4iLCJjb25zdCBmbG93c1V0aWxzID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvZmxvd3NVdGlsc1wiKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvdXRpbHNcIik7XG5jb25zdCBjcnlwdG8gPSByZXF1aXJlKFwicHNrY3J5cHRvXCIpO1xuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZShcIi4uL3V0aWxzL3ZhbGlkYXRvclwiKTtcbmNvbnN0IENTQklkZW50aWZpZXIgPSByZXF1aXJlKFwiLi4vbGliL0NTQklkZW50aWZpZXJcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiZXh0cmFjdEZpbGVcIiwge1xuXHRzdGFydDogZnVuY3Rpb24gKHVybCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG5cdFx0dGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuXHRcdGNvbnN0IHtDU0JQYXRoLCBhbGlhc30gPSB1dGlscy5wcm9jZXNzVXJsKHVybCwgJ2dsb2JhbC5GaWxlUmVmZXJlbmNlJyk7XG5cdFx0dGhpcy5DU0JQYXRoID0gQ1NCUGF0aDtcblx0XHR0aGlzLmFsaWFzID0gYWxpYXM7XG5cdFx0dGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFBpblwiLCBmbG93c1V0aWxzLm5vVHJpZXMpO1xuXHR9LFxuXG5cdHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG5cdFx0dmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsIFwibG9hZEZpbGVBc3NldFwiLCBwaW4sIG5vVHJpZXMpO1xuXHR9LFxuXG5cdGxvYWRGaWxlQXNzZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLnJvb3RDU0IubG9hZEFzc2V0RnJvbVBhdGgodGhpcy5DU0JQYXRoLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImRlY3J5cHRGaWxlXCIsIFwiRmFpbGVkIHRvIGxvYWQgZmlsZSBhc3NldCBcIiArIHRoaXMuYWxpYXMpKTtcblx0fSxcblx0XG5cdGRlY3J5cHRGaWxlOiBmdW5jdGlvbiAoZmlsZVJlZmVyZW5jZSkge1xuXHRcdGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihmaWxlUmVmZXJlbmNlLmRzZWVkKTtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyKTtcblxuXHRcdGNyeXB0by5vbigncHJvZ3Jlc3MnLCAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ3JlcG9ydFByb2dyZXNzJywgcHJvZ3Jlc3MpO1xuICAgICAgICB9KTtcblxuXHRcdGNyeXB0by5kZWNyeXB0U3RyZWFtKGZpbGVQYXRoLCB0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyLmdldERzZWVkKCksIChlcnIsIGZpbGVOYW1lcykgPT4ge1xuXHRcdFx0aWYoZXJyKXtcblx0XHRcdFx0cmV0dXJuIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIGVyciwgXCJGYWlsZWQgdG8gZGVjcnlwdCBmaWxlXCIgKyBmaWxlUGF0aCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInByaW50SW5mb1wiLCB0aGlzLmFsaWFzICsgXCIgd2FzIHN1Y2Nlc3NmdWxseSBleHRyYWN0ZWQuIFwiKTtcblx0XHRcdHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcIl9fcmV0dXJuX19cIiwgZmlsZU5hbWVzKTtcblx0XHR9KTtcblx0fVxufSk7IiwicmVxdWlyZShcImNhbGxmbG93XCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICQkLmxpYnJhcnkoZnVuY3Rpb24gKCkge1xuICAgIHJlcXVpcmUoJy4vYWRkQ3NiJyk7XG4gICAgcmVxdWlyZSgnLi9hZGRCYWNrdXAnKTtcbiAgICByZXF1aXJlKCcuL2F0dGFjaEZpbGUnKTtcbiAgICByZXF1aXJlKCcuL2NyZWF0ZUNzYicpO1xuICAgIHJlcXVpcmUoJy4vZXh0cmFjdEZpbGUnKTtcbiAgICByZXF1aXJlKCcuL2xpc3RDU0JzJyk7XG4gICAgcmVxdWlyZSgnLi9yZXNldFBpbicpO1xuICAgIHJlcXVpcmUoJy4vcmVzdG9yZScpO1xuICAgIHJlcXVpcmUoJy4vcmVjZWl2ZScpO1xuXHRyZXF1aXJlKCcuL3NhdmVCYWNrdXAnKTtcbiAgICByZXF1aXJlKCcuL3NldFBpbicpO1xufSk7XG5cblxuIiwiY29uc3QgZmxvd3NVdGlscyA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuLy8gY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCBSb290Q1NCID0gcmVxdWlyZShcIi4uL2xpYi9Sb290Q1NCXCIpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoXCIuLi9saWIvQ1NCSWRlbnRpZmllclwiKTtcblxuJCQuc3dhcm0uZGVzY3JpYmUoXCJsaXN0Q1NCc1wiLCB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uIChDU0JQYXRoLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoIHx8ICcnO1xuICAgICAgICB2YWxpZGF0b3IuY2hlY2tNYXN0ZXJDU0JFeGlzdHMobG9jYWxGb2xkZXIsIChlcnIsIHN0YXR1cykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcIm5vTWFzdGVyQ1NCRXhpc3RzXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB3aXRoQ1NCSWRlbnRpZmllcjogZnVuY3Rpb24gKGlkLCBDU0JQYXRoID0gJycsIGxvY2FsRm9sZGVyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgICAgICB0aGlzLmNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihpZCk7XG4gICAgICAgIHRoaXMuQ1NCUGF0aCA9IENTQlBhdGg7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgdGhpcy5sb2FkTWFzdGVyUmF3Q1NCKCk7XG4gICAgfSxcblxuICAgIGxvYWRNYXN0ZXJSYXdDU0I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUm9vdENTQi5sb2FkV2l0aElkZW50aWZpZXIodGhpcy5sb2NhbEZvbGRlciwgdGhpcy5jc2JJZGVudGlmaWVyLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImxvYWRSYXdDU0JcIiwgXCJGYWlsZWQgdG8gY3JlYXRlIFJvb3RDU0IuXCIpKTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVQaW46IGZ1bmN0aW9uIChwaW4sIG5vVHJpZXMpIHtcbiAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsICdsb2FkUmF3Q1NCJywgcGluLCBub1RyaWVzKTtcbiAgICB9LFxuXG4gICAgbG9hZFJhd0NTQjogZnVuY3Rpb24gKHJvb3RDU0IpIHtcbiAgICAgICAgaWYodHlwZW9mIHRoaXMucm9vdENTQiA9PT0gXCJ1bmRlZmluZWRcIiAmJiByb290Q1NCKXtcbiAgICAgICAgICAgIHRoaXMucm9vdENTQiA9IHJvb3RDU0I7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yb290Q1NCLmxvYWRSYXdDU0IodGhpcy5DU0JQYXRoLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCAnZ2V0Q1NCcycsICdGYWlsZWQgdG8gbG9hZCByYXdDU0InKSk7XG4gICAgfSxcblxuICAgIGdldENTQnM6IGZ1bmN0aW9uIChyYXdDU0IpIHtcbiAgICAgICAgY29uc3QgY3NiUmVmZXJlbmNlcyA9IHJhd0NTQi5nZXRBbGxBc3NldHMoJ2dsb2JhbC5DU0JSZWZlcmVuY2UnKTtcbiAgICAgICAgY29uc3QgY3Nic0FsaWFzZXMgPSBjc2JSZWZlcmVuY2VzLm1hcCgocmVmKSA9PiByZWYuYWxpYXMpO1xuXG4gICAgICAgIGNvbnN0IGZpbGVSZWZlcmVuY2VzID0gcmF3Q1NCLmdldEFsbEFzc2V0cygnZ2xvYmFsLkZpbGVSZWZlcmVuY2UnKTtcbiAgICAgICAgY29uc3QgZmlsZXNBbGlhc2VzID0gZmlsZVJlZmVyZW5jZXMubWFwKChyZWYpID0+IHJlZi5hbGlhcyk7XG5cbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiX19yZXR1cm5fX1wiLCB7XG4gICAgICAgICAgICBjc2JzOiBjc2JzQWxpYXNlcyxcbiAgICAgICAgICAgIGZpbGVzOiBmaWxlc0FsaWFzZXNcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcbiIsIlxuJCQuc3dhcm0uZGVzY3JpYmUoXCJyZWNlaXZlXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKGVuZHBvaW50LCBjaGFubmVsKSB7XG5cbiAgICAgICAgY29uc3QgYWxpYXMgPSAncmVtb3RlJztcbiAgICAgICAgJCQucmVtb3RlLmNyZWF0ZVJlcXVlc3RNYW5hZ2VyKDEwMDApO1xuICAgICAgICAkJC5yZW1vdGUubmV3RW5kUG9pbnQoYWxpYXMsIGVuZHBvaW50LCBjaGFubmVsKTtcbiAgICAgICAgJCQucmVtb3RlW2FsaWFzXS5vbignKicsICcqJywgKGVyciwgc3dhcm0pID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdGYWlsZWQgdG8gZ2V0IGRhdGEgZnJvbSBjaGFubmVsJyArIGNoYW5uZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2VlZCA9IHN3YXJtLm1ldGEuYXJnc1swXTtcbiAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInByaW50U2Vuc2l0aXZlSW5mb1wiLCBzZWVkKTtcblxuICAgICAgICAgICAgJCQucmVtb3RlW2FsaWFzXS5vZmYoXCIqXCIsIFwiKlwiKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG59KTsiLCJjb25zdCB1dGlscyA9IHJlcXVpcmUoXCIuLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCBSb290Q1NCID0gcmVxdWlyZShcIi4uL2xpYi9Sb290Q1NCXCIpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZShcIi4uL3V0aWxzL0RzZWVkQ2FnZVwiKTtcbmNvbnN0IENTQklkZW50aWZpZXIgPSByZXF1aXJlKFwiLi4vbGliL0NTQklkZW50aWZpZXJcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwicmVzZXRQaW5cIiwge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAobG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFNlZWRcIiwgdXRpbHMubm9Ucmllcyk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlU2VlZDogZnVuY3Rpb24gKHNlZWQsIG5vVHJpZXMpIHtcbiAgICAgICAgdHJ5e1xuICAgICAgICAgICAgdGhpcy5jc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoc2VlZCk7XG4gICAgICAgICAgICBSb290Q1NCLmxvYWRXaXRoSWRlbnRpZmllcih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLmNzYklkZW50aWZpZXIsIChlcnIsIHJvb3RDU0IpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRTZWVkXCIsIG5vVHJpZXMgLSAxKTtcbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaW5zZXJ0UGluXCIsIHV0aWxzLm5vVHJpZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBuZXcgRXJyb3IoJ0ludmFsaWQgc2VlZCcpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhY3R1YWxpemVQaW46IGZ1bmN0aW9uIChwaW4pIHtcbiAgICAgICAgY29uc3QgZHNlZWRDYWdlID0gbmV3IERzZWVkQ2FnZSh0aGlzLmxvY2FsRm9sZGVyKTtcbiAgICAgICAgZHNlZWRDYWdlLnNhdmVEc2VlZEJhY2t1cHMocGluLCB0aGlzLmNzYklkZW50aWZpZXIsIHVuZGVmaW5lZCwgKGVycik9PntcbiAgICAgICAgICAgIGlmKGVycil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIFwiRmFpbGVkIHRvIHNhdmUgZHNlZWQuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJwcmludEluZm9cIiwgXCJUaGUgcGluIGhhcyBiZWVuIGNoYW5nZWQgc3VjY2Vzc2Z1bGx5LlwiKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG4iLCJjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5jb25zdCBmbG93c1V0aWxzID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvZmxvd3NVdGlsc1wiKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvdXRpbHNcIik7XG5jb25zdCBjcnlwdG8gPSByZXF1aXJlKFwicHNrY3J5cHRvXCIpO1xuY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZShcIi4uL3V0aWxzL0RzZWVkQ2FnZVwiKTtcbmNvbnN0IFJvb3RDU0IgPSByZXF1aXJlKCcuLi9saWIvUm9vdENTQicpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoJy4uL2xpYi9DU0JJZGVudGlmaWVyJyk7XG5jb25zdCBCYWNrdXBFbmdpbmUgPSByZXF1aXJlKCcuLi9saWIvQmFja3VwRW5naW5lJyk7XG5jb25zdCBIYXNoQ2FnZSA9IHJlcXVpcmUoJy4uL3V0aWxzL0hhc2hDYWdlJyk7XG5jb25zdCBBc3luY0Rpc3BhdGNoZXIgPSByZXF1aXJlKCcuLi91dGlscy9Bc3luY0Rpc3BhdGNoZXInKTtcblxuXG4kJC5zd2FybS5kZXNjcmliZShcInJlc3RvcmVcIiwge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAodXJsLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICBjb25zdCB7Q1NCUGF0aCwgYWxpYXN9ID0gdXRpbHMucHJvY2Vzc1VybCh1cmwsICdnbG9iYWwuQ1NCUmVmZXJlbmNlJyk7XG4gICAgICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoO1xuICAgICAgICAgICAgdGhpcy5DU0JBbGlhcyA9IGFsaWFzO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFNlZWRcIik7XG4gICAgfSxcblxuICAgIHdpdGhTZWVkOiBmdW5jdGlvbiAodXJsLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCksIHNlZWRSZXN0b3JlLCBsb2NhbFNlZWQpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICBpZiAodXJsKSB7XG4gICAgICAgICAgICBjb25zdCB7Q1NCUGF0aCwgYWxpYXN9ID0gdXRpbHMucHJvY2Vzc1VybCh1cmwsICdnbG9iYWwuQ1NCUmVmZXJlbmNlJyk7XG4gICAgICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoO1xuICAgICAgICAgICAgdGhpcy5DU0JBbGlhcyA9IGFsaWFzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxvY2FsU2VlZCkge1xuICAgICAgICAgICAgdGhpcy5sb2NhbENTQklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihsb2NhbFNlZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXN0b3JlQ1NCKHNlZWRSZXN0b3JlKTtcbiAgICB9LFxuXG4gICAgcmVzdG9yZUNTQjogZnVuY3Rpb24gKHJlc3RvcmVTZWVkKSB7XG4gICAgICAgIHRoaXMuaGFzaENhZ2UgPSBuZXcgSGFzaENhZ2UodGhpcy5sb2NhbEZvbGRlcik7XG4gICAgICAgIHRoaXMuaGFzaE9iaiA9IHt9O1xuICAgICAgICB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIocmVzdG9yZVNlZWQpO1xuICAgICAgICBsZXQgYmFja3VwVXJscztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJhY2t1cFVybHMgPSB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyLmdldEJhY2t1cFVybHMoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgbmV3IEVycm9yKCdJbnZhbGlkIHNlZWQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJhY2t1cFVybHMgPSBiYWNrdXBVcmxzO1xuICAgICAgICB0aGlzLnJlc3RvcmVEc2VlZENhZ2UgPSBuZXcgRHNlZWRDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICBjb25zdCBiYWNrdXBFbmdpbmUgPSBuZXcgQmFja3VwRW5naW5lLmdldEJhY2t1cEVuZ2luZSh0aGlzLmJhY2t1cFVybHMpO1xuXG4gICAgICAgIGJhY2t1cEVuZ2luZS5sb2FkKHRoaXMuY3NiUmVzdG9yZUlkZW50aWZpZXIsIChlcnIsIGVuY3J5cHRlZENTQikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBlcnIsIFwiRmFpbGVkIHRvIHJlc3RvcmUgQ1NCXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9fYWRkQ1NCSGFzaCh0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyLCBlbmNyeXB0ZWRDU0IpO1xuICAgICAgICAgICAgdGhpcy5lbmNyeXB0ZWRDU0IgPSBlbmNyeXB0ZWRDU0I7XG5cbiAgICAgICAgICAgIHZhbGlkYXRvci5jaGVja01hc3RlckNTQkV4aXN0cyh0aGlzLmxvY2FsRm9sZGVyLCAoZXJyLCBzdGF0dXMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQXV4Rm9sZGVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmxvY2FsQ1NCSWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuQ1NCQWxpYXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLmRlbGV0ZVJlY3Vyc2l2ZWx5KHRoaXMubG9jYWxGb2xkZXIsIHRydWUsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBuZXcgRXJyb3IoXCJObyBDU0IgYWxpYXMgd2FzIHNwZWNpZmllZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGVDU0IoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5DU0JBbGlhcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIG5ldyBFcnJvcihcIk5vIENTQiBhbGlhcyB3YXMgc3BlY2lmaWVkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgZmxvd3NVdGlscy5ub1RyaWVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgdmFsaWRhdGVQaW46IGZ1bmN0aW9uIChwaW4sIG5vVHJpZXMpIHtcbiAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsIFwid3JpdGVDU0JcIiwgcGluLCBub1RyaWVzKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlQXV4Rm9sZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZzLm1rZGlyKHBhdGguam9pbih0aGlzLmxvY2FsRm9sZGVyLCBcIi5wcml2YXRlU2t5XCIpLCB7cmVjdXJzaXZlOiB0cnVlfSwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJ3cml0ZUNTQlwiLCBcIkZhaWxlZCB0byBjcmVhdGUgZm9sZGVyIC5wcml2YXRlU2t5XCIpKTtcbiAgICB9LFxuXG5cbiAgICB3cml0ZUNTQjogZnVuY3Rpb24gKCkge1xuICAgICAgICBmcy53cml0ZUZpbGUodXRpbHMuZ2VuZXJhdGVQYXRoKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMuY3NiUmVzdG9yZUlkZW50aWZpZXIpLCB0aGlzLmVuY3J5cHRlZENTQiwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJjcmVhdGVSb290Q1NCXCIsIFwiRmFpbGVkIHRvIHdyaXRlIG1hc3RlckNTQiB0byBkaXNrXCIpKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlUm9vdENTQjogZnVuY3Rpb24gKCkge1xuICAgICAgICBSb290Q1NCLmxvYWRXaXRoSWRlbnRpZmllcih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImxvYWRSYXdDU0JcIiwgXCJGYWlsZWQgdG8gY3JlYXRlIHJvb3RDU0Igd2l0aCBkc2VlZFwiKSk7XG4gICAgfSxcblxuICAgIGxvYWRSYXdDU0I6IGZ1bmN0aW9uIChyb290Q1NCKSB7XG5cbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIgPSBuZXcgQXN5bmNEaXNwYXRjaGVyKCggZXJycywgc3VjY3MpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFzaENhZ2Uuc2F2ZUhhc2godGhpcy5oYXNoT2JqLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdGYWlsZWQgdG8gc2F2ZSBoYXNoT2JqJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ3ByaW50SW5mbycsICdBbGwgQ1NCcyBoYXZlIGJlZW4gcmVzdG9yZWQuJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnX19yZXR1cm5fXycpO1xuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJvb3RDU0IubG9hZFJhd0NTQignJywgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJjaGVja0NTQlN0YXR1c1wiLCBcIkZhaWxlZCB0byBsb2FkIFJhd0NTQlwiLCByb290Q1NCKSk7XG4gICAgfSxcblxuICAgIGNoZWNrQ1NCU3RhdHVzOiBmdW5jdGlvbiAocmF3Q1NCLCByb290Q1NCKSB7XG4gICAgICAgIHRoaXMucmF3Q1NCID0gcmF3Q1NCO1xuICAgICAgICBjb25zdCBtZXRhID0gdGhpcy5yYXdDU0IuZ2V0QXNzZXQoJ2dsb2JhbC5DU0JNZXRhJywgJ21ldGEnKTtcbiAgICAgICAgaWYgKHRoaXMucm9vdENTQikge1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hDU0IodGhpcy5yb290Q1NCLCB0aGlzLkNTQlBhdGgsIHRoaXMuQ1NCQWxpYXMsIHRoaXMuY3NiUmVzdG9yZUlkZW50aWZpZXIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG1ldGEuaXNNYXN0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJvb3RDU0IgPSByb290Q1NCO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZURzZWVkKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlTWFzdGVyQ1NCKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2F2ZURzZWVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZURzZWVkQ2FnZS5zYXZlRHNlZWRCYWNrdXBzKGZsb3dzVXRpbHMuZGVmYXVsdFBpbiwgdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllciwgdW5kZWZpbmVkLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImNvbGxlY3RGaWxlc1wiLCBcIkZhaWxlZCB0byBzYXZlIGRzZWVkXCIsIHRoaXMucmF3Q1NCLCB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyLCAnJywgJ21hc3RlcicpKTtcbiAgICB9LFxuXG5cbiAgICBjcmVhdGVNYXN0ZXJDU0I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc3QgY3NiSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKHVuZGVmaW5lZCwgdGhpcy5iYWNrdXBVcmxzKTtcbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicHJpbnRTZW5zaXRpdmVJbmZvXCIsIGNzYklkZW50aWZpZXIuZ2V0U2VlZCgpLCBmbG93c1V0aWxzLmRlZmF1bHRQaW4pO1xuICAgICAgICB0aGlzLnJvb3RDU0IgPSBSb290Q1NCLmNyZWF0ZU5ldyh0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyKTtcbiAgICAgICAgdGhpcy5yZXN0b3JlRHNlZWRDYWdlLnNhdmVEc2VlZEJhY2t1cHMoZmxvd3NVdGlscy5kZWZhdWx0UGluLCBjc2JJZGVudGlmaWVyLCB1bmRlZmluZWQsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwiYXR0YWNoQ1NCXCIsIFwiRmFpbGVkIHRvIHNhdmUgbWFzdGVyIGRzZWVkIFwiLCB0aGlzLnJvb3RDU0IsIHRoaXMuQ1NCUGF0aCwgdGhpcy5DU0JBbGlhcywgdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllcikpO1xuICAgIH0sXG5cblxuICAgIGF0dGFjaENTQjogZnVuY3Rpb24gKHJvb3RDU0IsIENTQlBhdGgsIENTQkFsaWFzLCBjc2JJZGVudGlmaWVyKSB7XG4gICAgICAgIHRoaXMuX19hdHRhY2hDU0Iocm9vdENTQiwgQ1NCUGF0aCwgQ1NCQWxpYXMsIGNzYklkZW50aWZpZXIsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdsb2FkUmVzdG9yZWRSYXdDU0InLCAnRmFpbGVkIHRvIGF0dGFjaCByYXdDU0InKSk7XG5cbiAgICB9LFxuXG4gICAgbG9hZFJlc3RvcmVkUmF3Q1NCOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuQ1NCUGF0aCA9IHRoaXMuQ1NCUGF0aC5zcGxpdCgnOicpWzBdICsgJy8nICsgdGhpcy5DU0JBbGlhcztcbiAgICAgICAgdGhpcy5yb290Q1NCLmxvYWRSYXdDU0IodGhpcy5DU0JQYXRoLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImNvbGxlY3RGaWxlc1wiLCBcIkZhaWxlZCB0byBsb2FkIHJlc3RvcmVkIFJhd0NTQlwiLCB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyLCB0aGlzLkNTQlBhdGgsIHRoaXMuQ1NCQWxpYXMpKTtcbiAgICB9LFxuXG4gICAgY29sbGVjdEZpbGVzOiBmdW5jdGlvbiAocmF3Q1NCLCBjc2JJZGVudGlmaWVyLCBjdXJyZW50UGF0aCwgYWxpYXMsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgY29uc3QgbGlzdEZpbGVzID0gcmF3Q1NCLmdldEFsbEFzc2V0cygnZ2xvYmFsLkZpbGVSZWZlcmVuY2UnKTtcbiAgICAgICAgY29uc3QgYXN5bmNEaXNwYXRjaGVyID0gbmV3IEFzeW5jRGlzcGF0Y2hlcigoZXJycywgc3VjY3MpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdENTQnMocmF3Q1NCLCBjc2JJZGVudGlmaWVyLCBjdXJyZW50UGF0aCwgYWxpYXMpO1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycnMsIHN1Y2NzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGxpc3RGaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGlzdEZpbGVzLmZvckVhY2goKGZpbGVSZWZlcmVuY2UpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihmaWxlUmVmZXJlbmNlLmRzZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVBbGlhcyA9IGZpbGVSZWZlcmVuY2UuYWxpYXM7XG4gICAgICAgICAgICBjb25zdCB1cmxzID0gY3NiSWRlbnRpZmllci5nZXRCYWNrdXBVcmxzKCk7XG4gICAgICAgICAgICBjb25zdCBiYWNrdXBFbmdpbmUgPSBCYWNrdXBFbmdpbmUuZ2V0QmFja3VwRW5naW5lKHVybHMpO1xuICAgICAgICAgICAgYXN5bmNEaXNwYXRjaGVyLmRpc3BhdGNoRW1wdHkoKTtcbiAgICAgICAgICAgIGJhY2t1cEVuZ2luZS5sb2FkKGNzYklkZW50aWZpZXIsIChlcnIsIGVuY3J5cHRlZEZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIGVyciwgJ0NvdWxkIG5vdCBkb3dubG9hZCBmaWxlICcgKyBmaWxlQWxpYXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuX19hZGRDU0JIYXNoKGNzYklkZW50aWZpZXIsIGVuY3J5cHRlZEZpbGUpO1xuXG4gICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlKHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyKSwgZW5jcnlwdGVkRmlsZSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdDb3VsZCBub3Qgc2F2ZSBmaWxlICcgKyBmaWxlQWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHVuZGVmaW5lZCwgZmlsZUFsaWFzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY29sbGVjdENTQnM6IGZ1bmN0aW9uIChyYXdDU0IsIGNzYklkZW50aWZpZXIsIGN1cnJlbnRQYXRoLCBhbGlhcykge1xuXG4gICAgICAgIGNvbnN0IGxpc3RDU0JzID0gcmF3Q1NCLmdldEFsbEFzc2V0cygnZ2xvYmFsLkNTQlJlZmVyZW5jZScpO1xuICAgICAgICBjb25zdCBuZXh0QXJndW1lbnRzID0gW107XG4gICAgICAgIGxldCBjb3VudGVyID0gMDtcblxuICAgICAgICBpZiAobGlzdENTQnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KCk7XG4gICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxpc3RDU0JzICYmIGxpc3RDU0JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxpc3RDU0JzLmZvckVhY2goKENTQlJlZmVyZW5jZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRQYXRoID0gY3VycmVudFBhdGggKyAnLycgKyBDU0JSZWZlcmVuY2UuYWxpYXM7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dENTQklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihDU0JSZWZlcmVuY2UuZHNlZWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRBbGlhcyA9IENTQlJlZmVyZW5jZS5hbGlhcztcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0VVJMcyA9IGNzYklkZW50aWZpZXIuZ2V0QmFja3VwVXJscygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJhY2t1cEVuZ2luZSA9IEJhY2t1cEVuZ2luZS5nZXRCYWNrdXBFbmdpbmUobmV4dFVSTHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLmRpc3BhdGNoRW1wdHkoKTtcbiAgICAgICAgICAgICAgICBiYWNrdXBFbmdpbmUubG9hZChuZXh0Q1NCSWRlbnRpZmllciwgKGVyciwgZW5jcnlwdGVkQ1NCKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIGVyciwgJ0NvdWxkIG5vdCBkb3dubG9hZCBDU0IgJyArIG5leHRBbGlhcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9fYWRkQ1NCSGFzaChuZXh0Q1NCSWRlbnRpZmllciwgZW5jcnlwdGVkQ1NCKTtcblxuICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUodXRpbHMuZ2VuZXJhdGVQYXRoKHRoaXMubG9jYWxGb2xkZXIsIG5leHRDU0JJZGVudGlmaWVyKSwgZW5jcnlwdGVkQ1NCLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgZXJyLCAnQ291bGQgbm90IHNhdmUgQ1NCICcgKyBuZXh0QWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJvb3RDU0IubG9hZFJhd0NTQihuZXh0UGF0aCwgKGVyciwgbmV4dFJhd0NTQikgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdGYWlsZWQgdG8gbG9hZCBDU0IgJyArIG5leHRBbGlhcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRBcmd1bWVudHMucHVzaChbIG5leHRSYXdDU0IsIG5leHRDU0JJZGVudGlmaWVyLCBuZXh0UGF0aCwgbmV4dEFsaWFzIF0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCsrY291bnRlciA9PT0gbGlzdENTQnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRBcmd1bWVudHMuZm9yRWFjaCgoYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0RmlsZXMoLi4uYXJncywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHVuZGVmaW5lZCwgYWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9fdHJ5RG93bmxvYWQodXJscywgY3NiSWRlbnRpZmllciwgaW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChpbmRleCA9PT0gdXJscy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ0NvdWxkIG5vdCBkb3dubG9hZCByZXNvdXJjZScpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVybCA9IHVybHNbaW5kZXhdO1xuICAgICAgICB0aGlzLmJhY2t1cEVuZ2luZS5sb2FkKHVybCwgY3NiSWRlbnRpZmllciwgKGVyciwgcmVzb3VyY2UpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fX3RyeURvd25sb2FkKHVybHMsIGNzYklkZW50aWZpZXIsICsraW5kZXgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCByZXNvdXJjZSk7XG4gICAgICAgIH0pO1xuXG4gICAgfSxcblxuICAgIF9fYWRkQ1NCSGFzaDogZnVuY3Rpb24gKGNzYklkZW50aWZpZXIsIGVuY3J5cHRlZENTQikge1xuICAgICAgICBjb25zdCBwc2tIYXNoID0gbmV3IGNyeXB0by5Qc2tIYXNoKCk7XG4gICAgICAgIHBza0hhc2gudXBkYXRlKGVuY3J5cHRlZENTQik7XG4gICAgICAgIHRoaXMuaGFzaE9ialtjc2JJZGVudGlmaWVyLmdldFVpZCgpXSA9IHBza0hhc2guZGlnZXN0KCkudG9TdHJpbmcoJ2hleCcpO1xuXG4gICAgfSxcblxuICAgIF9fYXR0YWNoQ1NCOiBmdW5jdGlvbiAocm9vdENTQiwgQ1NCUGF0aCwgQ1NCQWxpYXMsIGNzYklkZW50aWZpZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghQ1NCQWxpYXMpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJObyBDU0IgYWxpYXMgd2FzIHNwZWNpZmllZFwiKSk7XG4gICAgICAgIH1cblxuICAgICAgICByb290Q1NCLmxvYWRSYXdDU0IoQ1NCUGF0aCwgKGVyciwgcmF3Q1NCKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcm9vdENTQi5sb2FkQXNzZXRGcm9tUGF0aChDU0JQYXRoLCAoZXJyLCBjc2JSZWYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjc2JSZWYuaW5pdChDU0JBbGlhcywgY3NiSWRlbnRpZmllci5nZXRTZWVkKCksIGNzYklkZW50aWZpZXIuZ2V0RHNlZWQoKSk7XG4gICAgICAgICAgICAgICAgICAgIHJvb3RDU0Iuc2F2ZUFzc2V0VG9QYXRoKENTQlBhdGgsIGNzYlJlZiwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKGBBIENTQiBoYXZpbmcgdGhlIGFsaWFzICR7Q1NCQWxpYXN9IGFscmVhZHkgZXhpc3RzLmApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbiIsImNvbnN0IHV0aWxzID0gcmVxdWlyZShcIi4vLi4vdXRpbHMvdXRpbHNcIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuLi91dGlscy92YWxpZGF0b3JcIik7XG5jb25zdCBIYXNoQ2FnZSA9IHJlcXVpcmUoJy4uL3V0aWxzL0hhc2hDYWdlJyk7XG5jb25zdCBBc3luY0Rpc3BhdGNoZXIgPSByZXF1aXJlKFwiLi4vdXRpbHMvQXN5bmNEaXNwYXRjaGVyXCIpO1xuY29uc3QgUm9vdENTQiA9IHJlcXVpcmUoJy4uL2xpYi9Sb290Q1NCJyk7XG5jb25zdCBDU0JJZGVudGlmaWVyID0gcmVxdWlyZSgnLi4vbGliL0NTQklkZW50aWZpZXInKTtcbmNvbnN0IEJhY2t1cEVuZ2luZSA9IHJlcXVpcmUoJy4uL2xpYi9CYWNrdXBFbmdpbmUnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cblxuJCQuc3dhcm0uZGVzY3JpYmUoXCJzYXZlQmFja3VwXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKGxvY2FsRm9sZGVyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgMyk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG4gICAgICAgIHZhbGlkYXRvci52YWxpZGF0ZVBpbih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLCBcImxvYWRIYXNoRmlsZVwiLCBwaW4sIG5vVHJpZXMpO1xuICAgIH0sXG5cbiAgICB3aXRoQ1NCSWRlbnRpZmllcjogZnVuY3Rpb24gKGlkLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLmNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihpZCk7XG4gICAgICAgIFJvb3RDU0IubG9hZFdpdGhJZGVudGlmaWVyKGxvY2FsRm9sZGVyLCB0aGlzLmNzYklkZW50aWZpZXIsIChlcnIsIHJvb3RDU0IpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIGVyciwgJ0ZhaWxlZCB0byBsb2FkIHJvb3QgQ1NCJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJvb3RDU0IgPSByb290Q1NCO1xuICAgICAgICAgICAgdGhpcy5sb2FkSGFzaEZpbGUoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGxvYWRIYXNoRmlsZTogZnVuY3Rpb24gKHBpbiwgYmFja3Vwcykge1xuICAgICAgICB0aGlzLmJhY2t1cHMgPSBiYWNrdXBzO1xuICAgICAgICB0aGlzLmhhc2hDYWdlID0gbmV3IEhhc2hDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICB0aGlzLmhhc2hDYWdlLmxvYWRIYXNoKHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdyZWFkRW5jcnlwdGVkTWFzdGVyJywgJ0ZhaWxlZCB0byBsb2FkIGhhc2ggZmlsZScpKTtcbiAgICB9LFxuXG4gICAgcmVhZEVuY3J5cHRlZE1hc3RlcjogZnVuY3Rpb24gKGhhc2hGaWxlKSB7XG4gICAgICAgIHRoaXMuaGFzaEZpbGUgPSBoYXNoRmlsZTtcbiAgICAgICAgdGhpcy5tYXN0ZXJJRCA9IHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLmNzYklkZW50aWZpZXIpO1xuICAgICAgICBmcy5yZWFkRmlsZSh0aGlzLm1hc3RlcklELCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCAnbG9hZE1hc3RlclJhd0NTQicsICdGYWlsZWQgdG8gcmVhZCBtYXN0ZXJDU0IuJykpO1xuICAgIH0sXG5cblxuICAgIGxvYWRNYXN0ZXJSYXdDU0I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yb290Q1NCLmxvYWRSYXdDU0IoJycsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwiZGlzcGF0Y2hlclwiLCBcIkZhaWxlZCB0byBsb2FkIG1hc3RlckNTQlwiKSk7XG4gICAgfSxcblxuICAgIGRpc3BhdGNoZXI6IGZ1bmN0aW9uIChyYXdDU0IpIHtcbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIgPSBuZXcgQXN5bmNEaXNwYXRjaGVyKChlcnJvcnMsIHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIEpTT04uc3RyaW5naWZ5KGVycm9ycywgbnVsbCwgJ1xcdCcpLCAnRmFpbGVkIHRvIGNvbGxlY3QgYWxsIENTQnMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RGaWxlcyhyZXN1bHRzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eSgpO1xuICAgICAgICB0aGlzLmNvbGxlY3RDU0JzKHJhd0NTQiwgdGhpcy5jc2JJZGVudGlmaWVyLCAnJywgJ21hc3RlcicpO1xuICAgIH0sXG5cbiAgICBjb2xsZWN0Q1NCczogZnVuY3Rpb24gKHJhd0NTQiwgY3NiSWRlbnRpZmllciwgY3VycmVudFBhdGgsIGFsaWFzKSB7XG4gICAgICAgIGNvbnN0IGxpc3RDU0JzID0gcmF3Q1NCLmdldEFsbEFzc2V0cygnZ2xvYmFsLkNTQlJlZmVyZW5jZScpO1xuXG4gICAgICAgIGNvbnN0IG5leHRBcmd1bWVudHMgPSBbXTtcbiAgICAgICAgbGV0IGNvdW50ZXIgPSAwO1xuXG4gICAgICAgIGxpc3RDU0JzLmZvckVhY2goKENTQlJlZmVyZW5jZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV4dFBhdGggPSBjdXJyZW50UGF0aCArICcvJyArIENTQlJlZmVyZW5jZS5hbGlhcztcbiAgICAgICAgICAgIGNvbnN0IG5leHRDU0JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoQ1NCUmVmZXJlbmNlLmRzZWVkKTtcbiAgICAgICAgICAgIGNvbnN0IG5leHRBbGlhcyA9IENTQlJlZmVyZW5jZS5hbGlhcztcbiAgICAgICAgICAgIHRoaXMucm9vdENTQi5sb2FkUmF3Q1NCKG5leHRQYXRoLCAoZXJyLCBuZXh0UmF3Q1NCKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXh0QXJndW1lbnRzLnB1c2goWyBuZXh0UmF3Q1NCLCBuZXh0Q1NCSWRlbnRpZmllciwgbmV4dFBhdGgsIG5leHRBbGlhcyBdKTtcbiAgICAgICAgICAgICAgICBpZiAoKytjb3VudGVyID09PSBsaXN0Q1NCcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV4dEFyZ3VtZW50cy5mb3JFYWNoKChhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbGxlY3RDU0JzKC4uLmFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQodW5kZWZpbmVkLCB7cmF3Q1NCLCBjc2JJZGVudGlmaWVyLCBhbGlhc30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobGlzdENTQnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCh1bmRlZmluZWQsIHtyYXdDU0IsIGNzYklkZW50aWZpZXIsIGFsaWFzfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgY29sbGVjdEZpbGVzOiBmdW5jdGlvbiAoY29sbGVjdGVkQ1NCcykge1xuICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlciA9IG5ldyBBc3luY0Rpc3BhdGNoZXIoKGVycm9ycywgbmV3UmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgSlNPTi5zdHJpbmdpZnkoZXJyb3JzLCBudWxsLCAnXFx0JyksICdGYWlsZWQgdG8gY29sbGVjdCBmaWxlcyBhdHRhY2hlZCB0byBDU0JzJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghbmV3UmVzdWx0cykge1xuICAgICAgICAgICAgICAgIG5ld1Jlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX19jYXRlZ29yaXplKGNvbGxlY3RlZENTQnMuY29uY2F0KG5ld1Jlc3VsdHMpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eShjb2xsZWN0ZWRDU0JzLmxlbmd0aCk7XG4gICAgICAgIGNvbGxlY3RlZENTQnMuZm9yRWFjaCgoe3Jhd0NTQiwgY3NiSWRlbnRpZmllciwgYWxpYXN9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9fY29sbGVjdEZpbGVzKHJhd0NTQiwgYWxpYXMpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBfX2NhdGVnb3JpemU6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBjb25zdCBjYXRlZ29yaWVzID0ge307XG4gICAgICAgIGxldCBiYWNrdXBzO1xuICAgICAgICBmaWxlcy5mb3JFYWNoKCh7Y3NiSWRlbnRpZmllciwgYWxpYXN9KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuYmFja3VwcyB8fCB0aGlzLmJhY2t1cHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYmFja3VwcyA9IGNzYklkZW50aWZpZXIuZ2V0QmFja3VwVXJscygpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBiYWNrdXBzID0gdGhpcy5iYWNrdXBzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdWlkID0gY3NiSWRlbnRpZmllci5nZXRVaWQoKTtcbiAgICAgICAgICAgIGNhdGVnb3JpZXNbdWlkXSA9IHtiYWNrdXBzLCBhbGlhc307XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyID0gbmV3IEFzeW5jRGlzcGF0Y2hlcigoZXJyb3JzLCBzdWNjZXNzZXMpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2NzYkJhY2t1cFJlcG9ydCcsIHtlcnJvcnMsIHN1Y2Nlc3Nlc30pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmJhY2t1cEVuZ2luZSA9IEJhY2t1cEVuZ2luZS5nZXRCYWNrdXBFbmdpbmUoYmFja3Vwcyk7XG4gICAgICAgIHRoaXMuZmlsdGVyRmlsZXMoY2F0ZWdvcmllcyk7XG4gICAgICAgIC8vIE9iamVjdC5lbnRyaWVzKGNhdGVnb3JpZXMpLmZvckVhY2goKFt1aWQsIHthbGlhcywgYmFja3Vwc31dKSA9PiB7XG4gICAgICAgIC8vICAgICB0aGlzLmZpbHRlckZpbGVzKHVpZCwgYWxpYXMsIGJhY2t1cHMpO1xuICAgICAgICAvLyB9KTtcbiAgICB9LFxuXG4gICAgZmlsdGVyRmlsZXM6IGZ1bmN0aW9uIChmaWxlc0JhY2t1cHMpIHtcbiAgICAgICAgY29uc3QgZmlsZXNUb1VwZGF0ZSA9IHt9O1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmhhc2hGaWxlKS5mb3JFYWNoKCh1aWQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWxlc0JhY2t1cHNbdWlkXSkge1xuICAgICAgICAgICAgICAgIGZpbGVzVG9VcGRhdGVbdWlkXSA9IHRoaXMuaGFzaEZpbGVbdWlkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eSgpO1xuICAgICAgICB0aGlzLmJhY2t1cEVuZ2luZS5jb21wYXJlVmVyc2lvbnMoZmlsZXNUb1VwZGF0ZSwgKGVyciwgbW9kaWZpZWRGaWxlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBlcnIsIFwiRmFpbGVkIHRvIHJldHJpZXZlIGxpc3Qgb2YgbW9kaWZpZWQgZmlsZXNcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX19iYWNrdXBGaWxlcyhKU09OLnBhcnNlKG1vZGlmaWVkRmlsZXMpLCBmaWxlc0JhY2t1cHMpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgX19iYWNrdXBGaWxlczogZnVuY3Rpb24gKGZpbGVzLCBmaWxlc0JhY2t1cHMpIHtcbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eShmaWxlcy5sZW5ndGgpO1xuICAgICAgICBmaWxlcy5mb3JFYWNoKChmaWxlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWxlU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShwYXRoLmpvaW4odGhpcy5sb2NhbEZvbGRlciwgZmlsZSkpO1xuICAgICAgICAgICAgY29uc3QgYmFja3VwVXJscyA9IGZpbGVzQmFja3Vwc1tmaWxlXS5iYWNrdXBzO1xuICAgICAgICAgICAgY29uc3QgYmFja3VwRW5naW5lID0gQmFja3VwRW5naW5lLmdldEJhY2t1cEVuZ2luZShiYWNrdXBVcmxzKTtcbiAgICAgICAgICAgIGJhY2t1cEVuZ2luZS5zYXZlKG5ldyBDU0JJZGVudGlmaWVyKGZpbGUpLCBmaWxlU3RyZWFtLCAoZXJyLCB1cmwpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQoe2FsaWFzOiBmaWxlc0JhY2t1cHNbZmlsZV0uYWxpYXMsIGJhY2t1cFVSTDogdXJsfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQodW5kZWZpbmVkLCB7YWxpYXM6IGZpbGVzQmFja3Vwc1tmaWxlXS5hbGlhcywgYmFja3VwVVJMOiB1cmx9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCgpOyAvLyBmb3IgaHR0cCByZXF1ZXN0IHRvIGNvbXBhcmVWZXJzaW9uc1xuICAgIH0sXG5cbiAgICBfX2NvbGxlY3RGaWxlczogZnVuY3Rpb24gKHJhd0NTQiwgY3NiQWxpYXMpIHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSByYXdDU0IuZ2V0QWxsQXNzZXRzKCdnbG9iYWwuRmlsZVJlZmVyZW5jZScpO1xuICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KGZpbGVzLmxlbmd0aCk7XG4gICAgICAgIGZpbGVzLmZvckVhY2goKEZpbGVSZWZlcmVuY2UpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gRmlsZVJlZmVyZW5jZS5hbGlhcztcbiAgICAgICAgICAgIGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihGaWxlUmVmZXJlbmNlLmRzZWVkKTtcbiAgICAgICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHVuZGVmaW5lZCwge2NzYklkZW50aWZpZXIsIGFsaWFzfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCgpO1xuICAgIH1cbn0pO1xuXG4iLCJjb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZSgnLi4vdXRpbHMvRHNlZWRDYWdlJyk7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwic2V0UGluXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKGxvY2FsRm9sZGVyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgMyk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGluOiBmdW5jdGlvbiAob2xkUGluLCBub1RyaWVzKSB7XG4gICAgICAgIHRoaXMub2xkUGluID0gb2xkUGluO1xuICAgICAgICB2YWxpZGF0b3IudmFsaWRhdGVQaW4odGhpcy5sb2NhbEZvbGRlciwgdGhpcywgXCJpbnRlcmFjdGlvbkp1bXBlclwiLCBvbGRQaW4sIG5vVHJpZXMpO1xuICAgIH0sXG5cbiAgICBpbnRlcmFjdGlvbkp1bXBlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJlbnRlck5ld1BpblwiKTtcbiAgICB9LFxuXG4gICAgYWN0dWFsaXplUGluOiBmdW5jdGlvbiAobmV3UGluKSB7XG4gICAgICAgIHRoaXMuZHNlZWRDYWdlID0gbmV3IERzZWVkQ2FnZSh0aGlzLmxvY2FsRm9sZGVyKTtcbiAgICAgICAgdGhpcy5kc2VlZENhZ2UubG9hZERzZWVkQmFja3Vwcyh0aGlzLm9sZFBpbiwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJzYXZlRHNlZWRcIiwgXCJGYWlsZWQgdG8gbG9hZCBkc2VlZC5cIiwgbmV3UGluKSk7XG4gICAgfSxcblxuICAgIHNhdmVEc2VlZDogZnVuY3Rpb24gKGNzYklkZW50aWZpZXIsIGJhY2t1cHMsIHBpbikge1xuICAgICAgICB0aGlzLmRzZWVkQ2FnZS5zYXZlRHNlZWRCYWNrdXBzKHBpbiwgY3NiSWRlbnRpZmllciwgYmFja3VwcywgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJzdWNjZXNzU3RhdGVcIiwgXCJGYWlsZWQgdG8gc2F2ZSBkc2VlZFwiKSk7XG4gICAgfSxcblxuICAgIHN1Y2Nlc3NTdGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJwcmludEluZm9cIiwgXCJUaGUgcGluIGhhcyBiZWVuIHN1Y2Nlc3NmdWxseSBjaGFuZ2VkLlwiKTtcbiAgICB9XG59KTsiLCJjb25zdCBBc3luY0Rpc3BhdGNoZXIgPSByZXF1aXJlKFwiLi4vdXRpbHMvQXN5bmNEaXNwYXRjaGVyXCIpO1xuY29uc3QgRVZGU1Jlc29sdmVyID0gcmVxdWlyZShcIi4vYmFja3VwUmVzb2x2ZXJzL0VWRlNSZXNvbHZlclwiKTtcbi8vIGNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG5cbmZ1bmN0aW9uIEJhY2t1cEVuZ2luZUJ1aWxkZXIoKSB7XG4gICAgY29uc3QgcmVzb2x2ZXJzID0ge307XG4gICAgdGhpcy5hZGRSZXNvbHZlciA9IGZ1bmN0aW9uIChuYW1lLCByZXNvbHZlcikge1xuICAgICAgICByZXNvbHZlcnNbbmFtZV0gPSByZXNvbHZlcjtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRCYWNrdXBFbmdpbmUgPSBmdW5jdGlvbih1cmxzKSB7XG4gICAgICAgIGlmICghdXJscyB8fCB1cmxzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gdXJsIHdhcyBwcm92aWRlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgQmFja3VwRW5naW5lKHVybHMsIHJlc29sdmVycyk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gQmFja3VwRW5naW5lKHVybHMsIHJlc29sdmVycykge1xuXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24gKGNzYklkZW50aWZpZXIsIGRhdGFTdHJlYW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGFzeW5jRGlzcGF0Y2hlciA9IG5ldyBBc3luY0Rpc3BhdGNoZXIoY2FsbGJhY2spO1xuICAgICAgICBhc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eSh1cmxzLmxlbmd0aCk7XG4gICAgICAgIGZvciAoY29uc3QgdXJsIG9mIHVybHMpIHtcbiAgICAgICAgICAgIHJlc29sdmVyRm9yVXJsKHVybCwgKGVyciwgcmVzb2x2ZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZXIuYXV0aCh1cmwsIHVuZGVmaW5lZCwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVyLnNhdmUodXJsLCBjc2JJZGVudGlmaWVyLCBkYXRhU3RyZWFtLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHVuZGVmaW5lZCwgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmxvYWQgPSBmdW5jdGlvbiAoY3NiSWRlbnRpZmllciwgdmVyc2lvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2ZXJzaW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdmVyc2lvbjtcbiAgICAgICAgICAgIHZlcnNpb24gPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5RG93bmxvYWQoY3NiSWRlbnRpZmllciwgdmVyc2lvbiwgMCwgKGVyciwgcmVzb3VyY2UpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCByZXNvdXJjZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFZlcnNpb25zID0gZnVuY3Rpb24gKGNzYklkZW50aWZpZXIsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRW1wdHkgZnVuY3Rpb25cIik7XG4gICAgfTtcblxuICAgIHRoaXMuY29tcGFyZVZlcnNpb25zID0gZnVuY3Rpb24gKGZpbGVMaXN0LCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCB1cmwgPSB1cmxzWzBdO1xuICAgICAgICByZXNvbHZlckZvclVybCh1cmwsIChlcnIsIHJlc29sdmVyKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc29sdmVyLmF1dGgodXJsLCB1bmRlZmluZWQsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmVyLmNvbXBhcmVWZXJzaW9ucyh1cmwsIGZpbGVMaXN0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOVEVSTkFMIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBmdW5jdGlvbiByZXNvbHZlckZvclVybCh1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhyZXNvbHZlcnMpO1xuICAgICAgICBsZXQgcmVzb2x2ZXI7XG4gICAgICAgIGxldCBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goa2V5c1tpXSwgdXJsKSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVyID0gcmVzb2x2ZXJzW2tleXNbaV1dO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGkgPT09IGtleXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXNvbHZlciA9IHJlc29sdmVyc1snZXZmcyddO1xuICAgICAgICAgICAgaWYgKCFyZXNvbHZlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoYE5vIHJlc29sdmVyIG1hdGNoZXMgdGhlIHVybCAke3VybH1gKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHJlc29sdmVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaChzdHIxLCBzdHIyKSB7XG4gICAgICAgIHJldHVybiBzdHIxLmluY2x1ZGVzKHN0cjIpIHx8IHN0cjIuaW5jbHVkZXMoc3RyMSk7XG4gICAgfVxuXG5cbiAgICBmdW5jdGlvbiB0cnlEb3dubG9hZChjc2JJZGVudGlmaWVyLCB2ZXJzaW9uLCBpbmRleCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKGluZGV4ID09PSB1cmxzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIkZhaWxlZCB0byBkb3dubG9hZCByZXNvdXJjZVwiKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1cmwgPSB1cmxzW2luZGV4XTtcbiAgICAgICAgcmVzb2x2ZXJGb3JVcmwodXJsLCAoZXJyLCByZXNvbHZlcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNvbHZlci5hdXRoKHVybCwgdW5kZWZpbmVkLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ5RG93bmxvYWQoY3NiSWRlbnRpZmllciwgdmVyc2lvbiwgKytpbmRleCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmVyLmxvYWQodXJsLCBjc2JJZGVudGlmaWVyLCB2ZXJzaW9uLCAoZXJyLCByZXNvdXJjZSkgPT57XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnlEb3dubG9hZChjc2JJZGVudGlmaWVyLCB2ZXJzaW9uLCArK2luZGV4LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY29uc3QgZW5naW5lQnVpbGRlciA9IG5ldyBCYWNrdXBFbmdpbmVCdWlsZGVyKCk7XG5cbi8vIGVuZ2luZUJ1aWxkZXIuYWRkUmVzb2x2ZXIoJ2Ryb3Bib3gnLCBuZXcgRHJvcGJveFJlc29sdmVyKCkpO1xuLy8gZW5naW5lQnVpbGRlci5hZGRSZXNvbHZlcignZHJpdmUnLCBuZXcgRHJpdmVSZXNvbHZlcigpKTtcbmVuZ2luZUJ1aWxkZXIuYWRkUmVzb2x2ZXIoJ2V2ZnMnLCBuZXcgRVZGU1Jlc29sdmVyKCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZXRCYWNrdXBFbmdpbmU6IGZ1bmN0aW9uICh1cmxzKSB7XG4gICAgICAgIHJldHVybiBlbmdpbmVCdWlsZGVyLmdldEJhY2t1cEVuZ2luZSh1cmxzKTtcbiAgICB9XG59O1xuIiwiY29uc3QgY3J5cHRvID0gcmVxdWlyZShcInBza2NyeXB0b1wiKTtcblxuXG5mdW5jdGlvbiBDU0JJZGVudGlmaWVyKGlkLCBkb21haW4sIGtleUxlbiA9IDMyKSB7XG4gICAgbGV0IHNlZWQ7XG4gICAgbGV0IGRzZWVkO1xuICAgIGxldCB1aWQ7XG4gICAgbGV0IGVuY1NlZWQ7XG5cbiAgICAvL1RPRE86IGVsaW1pbmF0ZSB1bnVzZWQgdmFyXG4gICAgLy8gbGV0IGVuY0RzZWVkO1xuXG4gICAgaW5pdCgpO1xuXG4gICAgdGhpcy5nZXRTZWVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZighc2VlZCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmV0dXJuIHNlZWQuIEFjY2VzcyBpcyBkZW5pZWQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ29tcGFjdEZvcm0oc2VlZCk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0RHNlZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKGRzZWVkKXtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKGRzZWVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHNlZWQpe1xuICAgICAgICAgICAgZHNlZWQgPSBkZXJpdmVTZWVkKHNlZWQpO1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ29tcGFjdEZvcm0oZHNlZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJldHVybiBkZXJpdmVkIHNlZWQuIEFjY2VzcyBpcyBkZW5pZWQuXCIpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFVpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYodWlkKXtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKHVpZCkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGRzZWVkKXtcbiAgICAgICAgICAgIHVpZCA9IGNvbXB1dGVVaWQoZHNlZWQpO1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ29tcGFjdEZvcm0odWlkKS50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoc2VlZCl7XG4gICAgICAgICAgICBkc2VlZCA9IGRlcml2ZVNlZWQoc2VlZCk7XG4gICAgICAgICAgICB1aWQgPSBjb21wdXRlVWlkKGRzZWVkKTtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKHVpZCkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZXR1cm4gdWlkXCIpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldEVuY1NlZWQgPSBmdW5jdGlvbiAoZW5jcnlwdGlvbktleSkge1xuICAgICAgICBpZihlbmNTZWVkKXtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKGVuY1NlZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIXNlZWQpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJldHVybiBlbmNTZWVkLiBBY2Nlc3MgaXMgZGVuaWVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbmNyeXB0aW9uS2V5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmV0dXJuIGVuY1NlZWQuIE5vIGVuY3J5cHRpb24ga2V5IHdhcyBwcm92aWRlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vVE9ETzogZW5jcnlwdCBzZWVkIHVzaW5nIGVuY3J5cHRpb25LZXkuIEVuY3J5cHRpb24gYWxnb3JpdGhtIHJlbWFpbnMgdG8gYmUgY2hvc2VuXG4gICAgfTtcblxuXG5cbiAgICB0aGlzLmdldERvbWFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoc2VlZCl7XG4gICAgICAgICAgICByZXR1cm4gc2VlZC5kb21haW47XG4gICAgICAgIH1cblxuICAgICAgICBpZihkc2VlZCl7XG4gICAgICAgICAgICByZXR1cm4gZHNlZWQuZG9tYWluO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFja3VwIFVSTHMgY291bGQgbm90IGJlIHJldHJpZXZlZC4gQWNjZXNzIGlzIGRlbmllZFwiKTtcbiAgICB9O1xuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW50ZXJuYWwgbWV0aG9kcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGRvbWFpbnMgcHJvdmlkZWQuXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWVkID0gY3JlYXRlKCk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgY2xhc3NpZnlJZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xhc3NpZnlJZCgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpZCAhPT0gXCJzdHJpbmdcIiAmJiAhQnVmZmVyLmlzQnVmZmVyKGlkKSAmJiAhKHR5cGVvZiBpZCA9PT0gXCJvYmplY3RcIiAmJiAhQnVmZmVyLmlzQnVmZmVyKGlkKSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSWQgbXVzdCBiZSBhIHN0cmluZyBvciBhIGJ1ZmZlci4gVGhlIHR5cGUgcHJvdmlkZWQgd2FzICR7dHlwZW9mIGlkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhwYW5kZWRJZCA9IGxvYWQoaWQpO1xuICAgICAgICBzd2l0Y2goZXhwYW5kZWRJZC50YWcpe1xuICAgICAgICAgICAgY2FzZSAncyc6XG4gICAgICAgICAgICAgICAgc2VlZCA9IGV4cGFuZGVkSWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdkJzpcbiAgICAgICAgICAgICAgICBkc2VlZCA9IGV4cGFuZGVkSWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd1JzpcbiAgICAgICAgICAgICAgICB1aWQgPSBleHBhbmRlZElkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZXMnOlxuICAgICAgICAgICAgICAgIGVuY1NlZWQgPSBleHBhbmRlZElkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnZWQnOlxuICAgICAgICAgICAgICAgIGVuY0RzZWVkID0gZXhwYW5kZWRJZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHRhZycpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgICAgICBjb25zdCBsb2NhbFNlZWQgPSB7fTtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGRvbWFpbikpIHtcbiAgICAgICAgICAgIGRvbWFpbiA9IFsgZG9tYWluIF07XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbFNlZWQudGFnICAgID0gJ3MnO1xuICAgICAgICBsb2NhbFNlZWQucmFuZG9tID0gY3J5cHRvLnJhbmRvbUJ5dGVzKGtleUxlbik7XG4gICAgICAgIGxvY2FsU2VlZC5kb21haW4gPSBkb21haW47XG5cbiAgICAgICAgcmV0dXJuIGxvY2FsU2VlZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXJpdmVTZWVkKHNlZWQpIHtcbiAgICAgICAgbGV0IGNvbXBhY3RTZWVkID0gc2VlZDtcblxuICAgICAgICBpZiAodHlwZW9mIHNlZWQgPT09ICdvYmplY3QnICYmICFCdWZmZXIuaXNCdWZmZXIoc2VlZCkpIHtcbiAgICAgICAgICAgIGNvbXBhY3RTZWVkID0gZ2VuZXJhdGVDb21wYWN0Rm9ybShzZWVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChCdWZmZXIuaXNCdWZmZXIoc2VlZCkpIHtcbiAgICAgICAgICAgIGNvbXBhY3RTZWVkID0gc2VlZC50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbXBhY3RTZWVkWzBdID09PSAnZCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVHJpZWQgdG8gZGVyaXZlIGFuIGFscmVhZHkgZGVyaXZlZCBzZWVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVjb2RlZENvbXBhY3RTZWVkID0gZGVjb2RlVVJJQ29tcG9uZW50KGNvbXBhY3RTZWVkKTtcbiAgICAgICAgY29uc3Qgc3BsaXRDb21wYWN0U2VlZCA9IGRlY29kZWRDb21wYWN0U2VlZC5zdWJzdHJpbmcoMSkuc3BsaXQoJ3wnKTtcbiAgICAgICAgY29uc3Qgc3RyU2VlZCA9IEJ1ZmZlci5mcm9tKHNwbGl0Q29tcGFjdFNlZWRbMF0sICdiYXNlNjQnKS50b1N0cmluZygnaGV4Jyk7XG4gICAgICAgIGNvbnN0IGRvbWFpbiA9IEJ1ZmZlci5mcm9tKHNwbGl0Q29tcGFjdFNlZWRbMV0sICdiYXNlNjQnKS50b1N0cmluZygpO1xuICAgICAgICBjb25zdCBkc2VlZCA9IHt9O1xuXG4gICAgICAgIGRzZWVkLnRhZyA9ICdkJztcbiAgICAgICAgZHNlZWQucmFuZG9tID0gY3J5cHRvLmRlcml2ZUtleShzdHJTZWVkLCBudWxsLCBrZXlMZW4pO1xuICAgICAgICBkc2VlZC5kb21haW4gPSBKU09OLnBhcnNlKGRvbWFpbik7XG5cbiAgICAgICAgcmV0dXJuIGRzZWVkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbXB1dGVVaWQoZHNlZWQpe1xuICAgICAgICBpZighZHNlZWQpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRHNlZWQgd2FzIG5vdCBwcm92aWRlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZHNlZWQgPT09IFwib2JqZWN0XCIgJiYgIUJ1ZmZlci5pc0J1ZmZlcihkc2VlZCkpIHtcbiAgICAgICAgICAgIGRzZWVkID0gZ2VuZXJhdGVDb21wYWN0Rm9ybShkc2VlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1aWQgPSB7fTtcbiAgICAgICAgdWlkLnRhZyA9ICd1JztcbiAgICAgICAgdWlkLnJhbmRvbSA9IEJ1ZmZlci5mcm9tKGNyeXB0by5nZW5lcmF0ZVNhZmVVaWQoZHNlZWQpKTtcblxuICAgICAgICByZXR1cm4gdWlkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlbmVyYXRlQ29tcGFjdEZvcm0oe3RhZywgcmFuZG9tLCBkb21haW59KSB7XG4gICAgICAgIGxldCBjb21wYWN0SWQgPSB0YWcgKyByYW5kb20udG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBjb21wYWN0SWQgKz0gJ3wnICsgQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoZG9tYWluKSkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShlbmNvZGVVUklDb21wb25lbnQoY29tcGFjdElkKSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogdW51c2VkIGZ1bmN0aW9uISEhXG4gICAgLy8gZnVuY3Rpb24gZW5jcnlwdChpZCwgZW5jcnlwdGlvbktleSkge1xuICAgIC8vICAgICBpZihhcmd1bWVudHMubGVuZ3RoICE9PSAyKXtcbiAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihgV3JvbmcgbnVtYmVyIG9mIGFyZ3VtZW50cy4gRXhwZWN0ZWQ6IDI7IHByb3ZpZGVkICR7YXJndW1lbnRzLmxlbmd0aH1gKTtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIGxldCB0YWc7XG4gICAgLy8gICAgIGlmICh0eXBlb2YgaWQgPT09IFwib2JqZWN0XCIgJiYgIUJ1ZmZlci5pc0J1ZmZlcihpZCkpIHtcbiAgICAvLyAgICAgICAgIHRhZyA9IGlkLnRhZztcbiAgICAvLyAgICAgICAgIGlkID0gZ2VuZXJhdGVDb21wYWN0Rm9ybShpZCk7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICBpZiAodGFnID09PSAncycpIHtcbiAgICAvLyAgICAgICAgIC8vVE9ETyBlbmNyeXB0IHNlZWRcbiAgICAvLyAgICAgfWVsc2UgaWYgKHRhZyA9PT0gJ2QnKSB7XG4gICAgLy8gICAgICAgICAvL1RPRE8gZW5jcnlwdCBkc2VlZFxuICAgIC8vICAgICB9ZWxzZXtcbiAgICAvLyAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBwcm92aWRlZCBpZCBjYW5ub3QgYmUgZW5jcnlwdGVkXCIpO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyB9XG5cbiAgICBmdW5jdGlvbiBsb2FkKGNvbXBhY3RJZCkge1xuICAgICAgICBpZih0eXBlb2YgY29tcGFjdElkID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHR5cGUgc3RyaW5nIG9yIEJ1ZmZlci4gUmVjZWl2ZWQgdW5kZWZpbmVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZih0eXBlb2YgY29tcGFjdElkICE9PSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcGFjdElkID09PSBcIm9iamVjdFwiICYmICFCdWZmZXIuaXNCdWZmZXIoY29tcGFjdElkKSkge1xuICAgICAgICAgICAgICAgIGNvbXBhY3RJZCA9IEJ1ZmZlci5mcm9tKGNvbXBhY3RJZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbXBhY3RJZCA9IGNvbXBhY3RJZC50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVjb2RlZENvbXBhY3RJZCA9IGRlY29kZVVSSUNvbXBvbmVudChjb21wYWN0SWQpO1xuICAgICAgICBjb25zdCBpZCA9IHt9O1xuICAgICAgICBjb25zdCBzcGxpdENvbXBhY3RJZCA9IGRlY29kZWRDb21wYWN0SWQuc3Vic3RyaW5nKDEpLnNwbGl0KCd8Jyk7XG5cbiAgICAgICAgaWQudGFnID0gZGVjb2RlZENvbXBhY3RJZFswXTtcbiAgICAgICAgaWQucmFuZG9tID0gQnVmZmVyLmZyb20oc3BsaXRDb21wYWN0SWRbMF0sICdiYXNlNjQnKTtcblxuICAgICAgICBpZihzcGxpdENvbXBhY3RJZFsxXSAmJiBzcGxpdENvbXBhY3RJZFsxXS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgIGlkLmRvbWFpbiA9IEpTT04ucGFyc2UoQnVmZmVyLmZyb20oc3BsaXRDb21wYWN0SWRbMV0sICdiYXNlNjQnKS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ1NCSWRlbnRpZmllcjtcbiIsImNvbnN0IEJyaWNrID0gcmVxdWlyZShcImJhclwiKS5CcmljaztcbmNvbnN0IHBza0NyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG5cbmZ1bmN0aW9uIEhlYWRlcihwcmV2aW91c0hlYWRlckhhc2gsIGZpbGVzLCB0cmFuc2FjdGlvbnMpe1xuICAgIHByZXZpb3VzSGVhZGVySGFzaCA9IHByZXZpb3VzSGVhZGVySGFzaCB8fCBcIlwiO1xuICAgIGZpbGVzID0gZmlsZXMgfHwge307XG4gICAgdHJhbnNhY3Rpb25zID0gdHJhbnNhY3Rpb25zIHx8IFtdO1xuXG4gICAgdGhpcy50b0JyaWNrID0gZnVuY3Rpb24gKGVuY3J5cHRpb25LZXkpIHtcbiAgICAgICAgY29uc3QgaGVhZGVyT2JqID0ge3ByZXZpb3VzSGVhZGVySGFzaCwgZmlsZXMsIHRyYW5zYWN0aW9uc307XG4gICAgICAgIGNvbnN0IGVuY3J5cHRlZEhlYWRlck9iaiA9IHBza0NyeXB0by5lbmNyeXB0KGhlYWRlck9iaiwgZW5jcnlwdGlvbktleSk7XG4gICAgICAgIHJldHVybiBuZXcgQnJpY2soZW5jcnlwdGVkSGVhZGVyT2JqKTtcbiAgICB9O1xuXG4gICAgdGhpcy5mcm9tQnJpY2sgPSBmdW5jdGlvbiAoYnJpY2ssIGRlY3J5cHRpb25LZXkpIHtcbiAgICAgICAgY29uc3QgaGVhZGVyT2JqID0gSlNPTi5wYXJzZShwc2tDcnlwdG8uZGVjcnlwdChicmljaywgZGVjcnlwdGlvbktleSkpO1xuICAgICAgICBwcmV2aW91c0hlYWRlckhhc2ggPSBoZWFkZXJPYmoucHJldmlvdXNIZWFkZXJIYXNoO1xuICAgICAgICBmaWxlcyA9IGhlYWRlck9iai5maWxlcztcbiAgICAgICAgdHJhbnNhY3Rpb25zID0gaGVhZGVyT2JqLnRyYW5zYWN0aW9ucztcbiAgICB9O1xuXG4gICAgdGhpcy5zZXRQcmV2aW91c0hlYWRlckhhc2ggPSBmdW5jdGlvbiAoaGFzaCkge1xuICAgICAgICBwcmV2aW91c0hlYWRlckhhc2ggPSBoYXNoO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFByZXZpb3VzSGVhZGVySGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHByZXZpb3VzSGVhZGVySGFzaDtcbiAgICB9O1xuXG4gICAgdGhpcy5hZGRUcmFuc2FjdGlvbnMgPSBmdW5jdGlvbiAobmV3VHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShuZXdUcmFuc2FjdGlvbnMpKSB7XG4gICAgICAgICAgICBuZXdUcmFuc2FjdGlvbnMgPSBbIG5ld1RyYW5zYWN0aW9ucyBdO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJhbnNhY3Rpb25zID0gdHJhbnNhY3Rpb25zLmNvbmNhdChuZXdUcmFuc2FjdGlvbnMpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFRyYW5zYWN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9ucztcbiAgICB9O1xuXG4gICAgdGhpcy5hZGRGaWxlcyA9IGZ1bmN0aW9uIChuZXdGaWxlcykge1xuICAgICAgICBpZiAodHlwZW9mIG5ld0ZpbGVzICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkobmV3RmlsZXMpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdHlwZS4gRXhwZWN0ZWQgbm9uLWFycmF5IG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbmV3RmlsZXNLZXlzID0gT2JqZWN0LmtleXMobmV3RmlsZXMpO1xuICAgICAgICBuZXdGaWxlc0tleXMuZm9yRWFjaCgoZmlsZUFsaWFzKSA9PiB7XG4gICAgICAgICAgICBmaWxlc1tmaWxlQWxpYXNdID0gbmV3RmlsZXNbZmlsZUFsaWFzXTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0RmlsZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmaWxlcztcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRIZWFkZXJPYmplY3QgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHByZXZpb3VzSGVhZGVySGFzaCxcbiAgICAgICAgICAgIGZpbGVzLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zXG4gICAgICAgIH07XG4gICAgfTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcjsiLCJjb25zdCBCcmljayA9IHJlcXVpcmUoXCJiYXJcIikuQnJpY2s7XG5jb25zdCBwc2tDcnlwdG8gPSByZXF1aXJlKFwicHNrY3J5cHRvXCIpO1xuXG5mdW5jdGlvbiBIZWFkZXJzSGlzdG9yeShpbml0SGVhZGVycykge1xuXG4gICAgbGV0IGhlYWRlcnMgPSBpbml0SGVhZGVycyB8fCBbXTtcbiAgICB0aGlzLmFkZEhlYWRlciA9IGZ1bmN0aW9uIChoZWFkZXJCcmljaywgZW5jcnlwdGlvbktleSkge1xuICAgICAgICBjb25zdCBoZWFkZXJFbnRyeSA9IHt9O1xuICAgICAgICBjb25zdCBoZWFkZXJIYXNoID0gaGVhZGVyQnJpY2suZ2VuZXJhdGVIYXNoKCk7XG4gICAgICAgIGhlYWRlckVudHJ5W2hlYWRlckhhc2hdID0gZW5jcnlwdGlvbktleTtcbiAgICAgICAgaGVhZGVycy5wdXNoKGhlYWRlckVudHJ5KTtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRIZWFkZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRMYXN0SGVhZGVySGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGhlYWRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgaGVhZGVyRW50cnkgPSBoZWFkZXJzW2hlYWRlcnMubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMoaGVhZGVyRW50cnkpWzBdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMudG9CcmljayA9IGZ1bmN0aW9uIChlbmNyeXB0aW9uS2V5KSB7XG4gICAgICAgIHJldHVybiBuZXcgQnJpY2socHNrQ3J5cHRvLmVuY3J5cHQoaGVhZGVycywgZW5jcnlwdGlvbktleSkpO1xuICAgIH07XG5cbiAgICB0aGlzLmZyb21CcmljayA9IGZ1bmN0aW9uIChicmljaywgZGVjcnlwdGlvbktleSkge1xuICAgICAgICBoZWFkZXJzID0gSlNPTi5wYXJzZShwc2tDcnlwdG8uZGVjcnlwdChicmljaywgZGVjcnlwdGlvbktleSkudG9TdHJpbmcoKSk7XG4gICAgfTtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRlcnNIaXN0b3J5OyIsImNvbnN0IE93TSA9IHJlcXVpcmUoJ3N3YXJtdXRpbHMnKS5Pd007XG5jb25zdCBwc2tkYiA9IHJlcXVpcmUoJ3Bza2RiJyk7XG5cbmZ1bmN0aW9uIFJhd0NTQihpbml0RGF0YSkge1xuXHRjb25zdCBkYXRhID0gbmV3IE93TSh7YmxvY2tjaGFpbjogaW5pdERhdGF9KTtcblx0Y29uc3QgYmxvY2tjaGFpbiA9IHBza2RiLnN0YXJ0RGIoe2dldEluaXRWYWx1ZXMsIHBlcnNpc3R9KTtcblxuXHRpZighZGF0YS5ibG9ja2NoYWluKSB7XG5cdFx0ZGF0YS5ibG9ja2NoYWluID0ge1xuXHRcdFx0dHJhbnNhY3Rpb25Mb2c6IFtdXG5cdFx0fTtcblx0fVxuXG5cdGRhdGEuYXR0YWNoRmlsZSA9IGZ1bmN0aW9uIChmaWxlQWxpYXMsIHBhdGgsIHNlZWQpIHtcblx0XHRkYXRhLm1vZGlmeUFzc2V0KFwiZ2xvYmFsLkZpbGVSZWZlcmVuY2VcIiwgZmlsZUFsaWFzLCAoZmlsZSkgPT4ge1xuXHRcdFx0aWYgKCFmaWxlLmlzRW1wdHkoKSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhgRmlsZSB3aXRoIGFsaWFzICR7ZmlsZUFsaWFzfSBhbHJlYWR5IGV4aXN0c2ApO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGZpbGUuaW5pdChmaWxlQWxpYXMsIHBhdGgsIHNlZWQpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGRhdGEuc2F2ZUFzc2V0ID0gZnVuY3Rpb24oYXNzZXQpIHtcblx0XHRjb25zdCB0cmFuc2FjdGlvbiA9IGJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG5cdFx0dHJhbnNhY3Rpb24uYWRkKGFzc2V0KTtcblx0XHRibG9ja2NoYWluLmNvbW1pdCh0cmFuc2FjdGlvbik7XG5cdH07XG5cblx0ZGF0YS5tb2RpZnlBc3NldCA9IGZ1bmN0aW9uKGFzc2V0VHlwZSwgYWlkLCBhc3NldE1vZGlmaWVyKSB7XG5cdFx0Y29uc3QgdHJhbnNhY3Rpb24gPSBibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuXHRcdGNvbnN0IGFzc2V0ID0gdHJhbnNhY3Rpb24ubG9va3VwKGFzc2V0VHlwZSwgYWlkKTtcblx0XHRhc3NldE1vZGlmaWVyKGFzc2V0KTtcblxuXHRcdHRyYW5zYWN0aW9uLmFkZChhc3NldCk7XG5cdFx0YmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuXHR9O1xuXG5cdGRhdGEuZ2V0QXNzZXQgPSBmdW5jdGlvbiAoYXNzZXRUeXBlLCBhaWQpIHtcblx0XHRjb25zdCB0cmFuc2FjdGlvbiA9IGJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG5cdFx0cmV0dXJuIHRyYW5zYWN0aW9uLmxvb2t1cChhc3NldFR5cGUsIGFpZCk7XG5cdH07XG5cblx0ZGF0YS5nZXRBbGxBc3NldHMgPSBmdW5jdGlvbihhc3NldFR5cGUpIHtcblx0XHRjb25zdCB0cmFuc2FjdGlvbiA9IGJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG5cdFx0cmV0dXJuIHRyYW5zYWN0aW9uLmxvYWRBc3NldHMoYXNzZXRUeXBlKTtcblx0fTtcblxuXHRkYXRhLmFwcGx5VHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAodHJhbnNhY3Rpb25Td2FybSkge1xuXHRcdC8vIGNvbnN0IHRyYW5zYWN0aW9uID0gYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uU3dhcm0pO1xuXHRcdGJsb2NrY2hhaW4uY29tbWl0U3dhcm0odHJhbnNhY3Rpb25Td2FybSk7XG5cdFx0Ly8gYmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuXHR9O1xuXG5cdGRhdGEuZ2V0VHJhbnNhY3Rpb25Mb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIGRhdGEuYmxvY2tjaGFpbi50cmFuc2FjdGlvbkxvZztcblx0fTtcblx0LyogaW50ZXJuYWwgZnVuY3Rpb25zICovXG5cblx0ZnVuY3Rpb24gcGVyc2lzdCh0cmFuc2FjdGlvbkxvZywgY3VycmVudFZhbHVlcywgY3VycmVudFB1bHNlKSB7XG5cdFx0dHJhbnNhY3Rpb25Mb2cuY3VycmVudFB1bHNlID0gY3VycmVudFB1bHNlO1xuXG5cdFx0ZGF0YS5ibG9ja2NoYWluLmN1cnJlbnRWYWx1ZXMgPSBjdXJyZW50VmFsdWVzO1xuXHRcdGRhdGEuYmxvY2tjaGFpbi50cmFuc2FjdGlvbkxvZy5wdXNoKHRyYW5zYWN0aW9uTG9nKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldEluaXRWYWx1ZXMgKCkge1xuXHRcdGlmKCFkYXRhLmJsb2NrY2hhaW4gfHwgIWRhdGEuYmxvY2tjaGFpbi5jdXJyZW50VmFsdWVzKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0cmV0dXJuIGRhdGEuYmxvY2tjaGFpbi5jdXJyZW50VmFsdWVzO1xuXHR9XG5cblx0cmV0dXJuIGRhdGE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmF3Q1NCOyIsImNvbnN0IFJhd0NTQiA9IHJlcXVpcmUoJy4vUmF3Q1NCJyk7XG5jb25zdCBjcnlwdG8gPSByZXF1aXJlKCdwc2tjcnlwdG8nKTtcbmNvbnN0IENTQklkZW50aWZpZXIgPSByZXF1aXJlKFwiLi9DU0JJZGVudGlmaWVyXCIpO1xuY29uc3QgSGVhZGVyID0gcmVxdWlyZShcIi4vSGVhZGVyXCIpO1xuY29uc3QgSGVhZGVyc0hpc3RvcnkgPSByZXF1aXJlKFwiLi9IZWFkZXJzSGlzdG9yeVwiKTtcbmNvbnN0IEVERlNCcmlja1N0b3JhZ2UgPSByZXF1aXJlKFwiZWRmcy1icmljay1zdG9yYWdlXCIpO1xuY29uc3QgQmFyID0gcmVxdWlyZShcImJhclwiKTtcbmNvbnN0IEFzeW5jRGlzcGF0Y2hlciA9IHJlcXVpcmUoXCIuLi8uLi9lZGZzL3V0aWxzL0FzeW5jRGlzcGF0Y2hlclwiKTtcbmNvbnN0IEJyaWNrID0gQmFyLkJyaWNrO1xuLyoqXG4gKlxuICogQHBhcmFtIGN1cnJlbnRSYXdDU0IgLSBvcHRpb25hbFxuICogQHBhcmFtIGNzYklkZW50aWZpZXIgLSByZXF1aXJlZFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFJvb3RDU0IoY3VycmVudFJhd0NTQiwgY3NiSWRlbnRpZmllciwgYWNjZXNzUG9pbnQpIHtcbiAgICB0aGlzLmdldE1pZFJvb3QgPSBmdW5jdGlvbiAoQ1NCUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgICB9O1xuXG4gICAgdGhpcy5jcmVhdGVSYXdDU0IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmF3Q1NCKCk7XG4gICAgfTtcblxuICAgIHRoaXMubG9hZFJhd0NTQiA9IGZ1bmN0aW9uIChDU0JQYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIWN1cnJlbnRSYXdDU0IpIHtcbiAgICAgICAgICAgIGVkZnNCbG9ja2NoYWluUHJveHkuZ2V0Q1NCQW5jaG9yKGNzYklkZW50aWZpZXIsIChlcnIsIGNzYkFuY2hvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgX19sb2FkUmF3Q1NCKGNzYklkZW50aWZpZXIsIGNzYkFuY2hvci5oZWFkZXJIaXN0b3J5SGFzaCwoZXJyLCByYXdDU0IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50UmF3Q1NCID0gcmF3Q1NCO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChDU0JQYXRoIHx8IENTQlBhdGggIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvYWRSYXdDU0IoQ1NCUGF0aCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBjdXJyZW50UmF3Q1NCKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghQ1NCUGF0aCB8fCBDU0JQYXRoID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGN1cnJlbnRSYXdDU0IpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2FkQXNzZXRGcm9tUGF0aChDU0JQYXRoLCAoZXJyLCBhc3NldCwgcmF3Q1NCKSA9PiB7XG5cbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhc3NldCB8fCAhYXNzZXQuZHNlZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKGBUaGUgQ1NCUGF0aCAke0NTQlBhdGh9IGlzIGludmFsaWQuYCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBfX2xvYWRSYXdDU0IobmV3IENTQklkZW50aWZpZXIoYXNzZXQuZHNlZWQpLCBhc3NldC5oZWFkZXJIaXN0b3J5SGFzaCwgY2FsbGJhY2spO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5sb2FkQXNzZXRGcm9tUGF0aCA9IGZ1bmN0aW9uIChDU0JQYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBsZXQgcHJvY2Vzc2VkUGF0aCA9IF9fc3BsaXRQYXRoKENTQlBhdGgpO1xuICAgICAgICBpZiAoIWN1cnJlbnRSYXdDU0IpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ2N1cnJlbnRSYXdDU0IgZG9lcyBub3QgZXhpc3QnKSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgQ1NCUmVmZXJlbmNlID0gbnVsbDtcbiAgICAgICAgaWYgKHByb2Nlc3NlZFBhdGguQ1NCQWxpYXNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBuZXh0QWxpYXMgPSBwcm9jZXNzZWRQYXRoLkNTQkFsaWFzZXNbMF07XG4gICAgICAgICAgICBDU0JSZWZlcmVuY2UgPSBjdXJyZW50UmF3Q1NCLmdldEFzc2V0KCdnbG9iYWwuQ1NCUmVmZXJlbmNlJywgbmV4dEFsaWFzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghcHJvY2Vzc2VkUGF0aC5hc3NldFR5cGUgfHwgIXByb2Nlc3NlZFBhdGguYXNzZXRBaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdOb3QgYXNzZXQgdHlwZSBvciBpZCBzcGVjaWZpZWQgaW4gQ1NCUGF0aCcpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQ1NCUmVmZXJlbmNlID0gY3VycmVudFJhd0NTQi5nZXRBc3NldChwcm9jZXNzZWRQYXRoLmFzc2V0VHlwZSwgcHJvY2Vzc2VkUGF0aC5hc3NldEFpZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvY2Vzc2VkUGF0aC5DU0JBbGlhc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIENTQlJlZmVyZW5jZSwgY3VycmVudFJhd0NTQik7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9jZXNzZWRQYXRoLkNTQkFsaWFzZXMuc2hpZnQoKTtcblxuICAgICAgICBpZighQ1NCUmVmZXJlbmNlIHx8ICFDU0JSZWZlcmVuY2UuZHNlZWQpe1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihgVGhlIENTQlBhdGggJHtDU0JQYXRofSBpcyBpbnZhbGlkYCkpO1xuICAgICAgICB9XG4gICAgICAgIF9fbG9hZEFzc2V0RnJvbVBhdGgocHJvY2Vzc2VkUGF0aCwgbmV3IENTQklkZW50aWZpZXIoQ1NCUmVmZXJlbmNlLmRzZWVkKSwgQ1NCUmVmZXJlbmNlLmJhck1hcEhhc2gsIDAsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zYXZlQXNzZXRUb1BhdGggPSBmdW5jdGlvbiAoQ1NCUGF0aCwgYXNzZXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHNwbGl0UGF0aCA9IF9fc3BsaXRQYXRoKENTQlBhdGgsIHtrZWVwQWxpYXNlc0FzU3RyaW5nOiB0cnVlfSk7XG4gICAgICAgIHRoaXMubG9hZFJhd0NTQihzcGxpdFBhdGguQ1NCQWxpYXNlcywgKGVyciwgcmF3Q1NCKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJhd0NTQi5zYXZlQXNzZXQoYXNzZXQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVJhd0NTQihyYXdDU0IsIHNwbGl0UGF0aC5DU0JBbGlhc2VzLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5zYXZlUmF3Q1NCID0gZnVuY3Rpb24gKHJhd0NTQiwgQ1NCUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFDU0JQYXRoIHx8IENTQlBhdGggPT09ICcnKSB7XG4gICAgICAgICAgICBpZiAocmF3Q1NCKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFJhd0NTQiA9IHJhd0NTQjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9ucyA9IHJhd0NTQi5nZXRUcmFuc2FjdGlvbkxvZygpO1xuICAgICAgICBjb25zdCBoZWFkZXJzSGlzdG9yeSA9IG5ldyBIZWFkZXJzSGlzdG9yeSgpO1xuICAgICAgICBjb25zdCBoZWFkZXIgPSBuZXcgSGVhZGVyKCk7XG4gICAgICAgIGVkZnNCbG9ja2NoYWluUHJveHkuZ2V0Q1NCQW5jaG9yKGNzYklkZW50aWZpZXIsIChlcnIsIGNzYkFuY2hvcikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7IC8vVE9ETzogYmV0dGVyIGhhbmRsaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3NiQW5jaG9yICYmIHR5cGVvZiBjc2JBbmNob3IuaGVhZGVySGlzdG9yeUhhc2ggIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBlZGZzU2VydmljZVByb3h5LmdldEJyaWNrKGNzYkFuY2hvci5oZWFkZXJIaXN0b3J5SGFzaCwgKGVyciwgaGVhZGVyc0hpc3RvcnlCcmljaykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnNIaXN0b3J5LmZyb21CcmljayhoZWFkZXJzSGlzdG9yeUJyaWNrLCBjc2JJZGVudGlmaWVyLmdldERzZWVkKCkpO1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXIuc2V0UHJldmlvdXNIZWFkZXJIYXNoKGhlYWRlcnNIaXN0b3J5LmdldExhc3RIZWFkZXJIYXNoKCkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX19zYXZlUmF3Q1NCKGNzYkFuY2hvciwgaGVhZGVyc0hpc3RvcnksIGhlYWRlciwgdHJhbnNhY3Rpb25zLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjc2JBbmNob3IuaW5pdChjc2JJZGVudGlmaWVyLmdldFVpZCgpLCBjc2JJZGVudGlmaWVyLmdldFVpZCgpKTtcbiAgICAgICAgICAgIF9fc2F2ZVJhd0NTQihjc2JBbmNob3IsIGhlYWRlcnNIaXN0b3J5LCBoZWFkZXIsIHRyYW5zYWN0aW9ucywgY2FsbGJhY2spO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG5cbiAgICAvKiAtLS0tLS0tLS0tLS0tLS0tLS0tIElOVEVSTkFMIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSBDU0JQYXRoOiBzdHJpbmcgLSBpbnRlcm5hbCBwYXRoIHRoYXQgbG9va3MgbGlrZSAve0NTQk5hbWUxfS97Q1NCTmFtZTJ9Onthc3NldFR5cGV9Onthc3NldEFsaWFzT3JJZH1cbiAgICAgKiBAcGFyYW0gb3B0aW9uczpvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7e0NTQkFsaWFzZXM6IFtzdHJpbmddLCBhc3NldEFpZDogKCp8dW5kZWZpbmVkKSwgYXNzZXRUeXBlOiAoKnx1bmRlZmluZWQpfX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIF9fc3BsaXRQYXRoKENTQlBhdGgsIG9wdGlvbnMgPSB7fSkge1xuICAgICAgICBjb25zdCBwYXRoU2VwYXJhdG9yID0gJy8nO1xuXG4gICAgICAgIGlmIChDU0JQYXRoLnN0YXJ0c1dpdGgocGF0aFNlcGFyYXRvcikpIHtcbiAgICAgICAgICAgIENTQlBhdGggPSBDU0JQYXRoLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBDU0JBbGlhc2VzID0gQ1NCUGF0aC5zcGxpdChwYXRoU2VwYXJhdG9yKTtcbiAgICAgICAgaWYgKENTQkFsaWFzZXMubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDU0JQYXRoIHRvbyBzaG9ydCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbGFzdEluZGV4ID0gQ1NCQWxpYXNlcy5sZW5ndGggLSAxO1xuICAgICAgICBjb25zdCBvcHRpb25hbEFzc2V0U2VsZWN0b3IgPSBDU0JBbGlhc2VzW2xhc3RJbmRleF0uc3BsaXQoJzonKTtcblxuICAgICAgICBpZiAob3B0aW9uYWxBc3NldFNlbGVjdG9yWzBdID09PSAnJykge1xuICAgICAgICAgICAgQ1NCQWxpYXNlcyA9IFtdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQ1NCQWxpYXNlc1tsYXN0SW5kZXhdID0gb3B0aW9uYWxBc3NldFNlbGVjdG9yWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvcHRpb25hbEFzc2V0U2VsZWN0b3JbMV0gJiYgIW9wdGlvbmFsQXNzZXRTZWxlY3RvclsyXSkge1xuICAgICAgICAgICAgb3B0aW9uYWxBc3NldFNlbGVjdG9yWzFdID0gJ2dsb2JhbC5DU0JSZWZlcmVuY2UnO1xuICAgICAgICAgICAgb3B0aW9uYWxBc3NldFNlbGVjdG9yWzJdID0gQ1NCQWxpYXNlc1tsYXN0SW5kZXhdO1xuICAgICAgICAgICAgQ1NCQWxpYXNlcy5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChvcHRpb25zLmtlZXBBbGlhc2VzQXNTdHJpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgIENTQkFsaWFzZXMgPSBDU0JBbGlhc2VzLmpvaW4oJy8nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgQ1NCQWxpYXNlczogQ1NCQWxpYXNlcyxcbiAgICAgICAgICAgIGFzc2V0VHlwZTogb3B0aW9uYWxBc3NldFNlbGVjdG9yWzFdLFxuICAgICAgICAgICAgYXNzZXRBaWQ6IG9wdGlvbmFsQXNzZXRTZWxlY3RvclsyXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9fc2F2ZVJhd0NTQihjc2JBbmNob3IsIGhlYWRlcnNIaXN0b3J5LCBoZWFkZXIsIHRyYW5zYWN0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgYXN5bmNEaXNwYXRjaGVyID0gbmV3IEFzeW5jRGlzcGF0Y2hlcigoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBoZWFkZXJFbmNyeXB0aW9uS2V5ID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDMyKTtcbiAgICAgICAgICAgIGNvbnN0IGhlYWRlckJyaWNrID0gaGVhZGVyLnRvQnJpY2soaGVhZGVyRW5jcnlwdGlvbktleSk7XG4gICAgICAgICAgICBlZGZzU2VydmljZVByb3h5LmFkZEJyaWNrKGhlYWRlckJyaWNrLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBoZWFkZXJzSGlzdG9yeS5hZGRIZWFkZXIoaGVhZGVyQnJpY2ssIGhlYWRlckVuY3J5cHRpb25LZXkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhpc3RvcnlCcmljayA9IGhlYWRlcnNIaXN0b3J5LnRvQnJpY2soY3NiSWRlbnRpZmllci5nZXREc2VlZCgpKTtcbiAgICAgICAgICAgICAgICBlZGZzU2VydmljZVByb3h5LmFkZEJyaWNrKGhpc3RvcnlCcmljaywgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGNzYkFuY2hvci51cGRhdGVIZWFkZXJIaXN0b3J5SGFzaChoaXN0b3J5QnJpY2suZ2VuZXJhdGVIYXNoKCkpO1xuICAgICAgICAgICAgICAgICAgICBlZGZzQmxvY2tjaGFpblByb3h5LnNldENTQkFuY2hvcihjc2JBbmNob3IsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgICAgICBhc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eSh0cmFuc2FjdGlvbnMubGVuZ3RoKTtcbiAgICAgICAgdHJhbnNhY3Rpb25zLmZvckVhY2goKHRyYW5zYWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlbmNyeXB0aW9uS2V5ID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDMyKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uQnJpY2sgPSBuZXcgQnJpY2soY3J5cHRvLmVuY3J5cHQodHJhbnNhY3Rpb24sIGVuY3J5cHRpb25LZXkpKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uRW50cnkgPSB7fTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uSGFzaCA9IHRyYW5zYWN0aW9uQnJpY2suZ2VuZXJhdGVIYXNoKCk7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbkVudHJ5W3RyYW5zYWN0aW9uSGFzaF0gPSBlbmNyeXB0aW9uS2V5O1xuICAgICAgICAgICAgaGVhZGVyLmFkZFRyYW5zYWN0aW9ucyh0cmFuc2FjdGlvbkVudHJ5KTtcbiAgICAgICAgICAgIGVkZnNTZXJ2aWNlUHJveHkuYWRkQnJpY2sodHJhbnNhY3Rpb25CcmljaywgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIGZ1bmN0aW9uIF9fbG9hZFJhd0NTQihsb2NhbENTQklkZW50aWZpZXIsIGxvY2FsSGVhZGVySGlzdG9yeUhhc2gsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmKHR5cGVvZiBsb2NhbEhlYWRlckhpc3RvcnlIYXNoID09PSBcImZ1bmN0aW9uXCIpe1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBsb2NhbEhlYWRlckhpc3RvcnlIYXNoO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmF3Q1NCID0gbmV3IFJhd0NTQigpO1xuICAgICAgICBlZGZzU2VydmljZVByb3h5LmdldEJyaWNrKGxvY2FsSGVhZGVySGlzdG9yeUhhc2gsIChlcnIsIGhlYWRlcnNIaXN0b3J5QnJpY2tEYXRhKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnNIaXN0b3J5ID0gbmV3IEhlYWRlcnNIaXN0b3J5KCk7XG4gICAgICAgICAgICBoZWFkZXJzSGlzdG9yeS5mcm9tQnJpY2soaGVhZGVyc0hpc3RvcnlCcmlja0RhdGEsIGxvY2FsQ1NCSWRlbnRpZmllci5nZXREc2VlZCgpKTtcbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnNBc3luY0Rpc3BhdGNoZXIgPSBuZXcgQXN5bmNEaXNwYXRjaGVyKChlcnJvcnMsIHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHJhd0NTQik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgaGVhZGVycyA9IGhlYWRlcnNIaXN0b3J5LmdldEhlYWRlcnMoKTtcbiAgICAgICAgICAgIGhlYWRlcnNBc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eShoZWFkZXJzLmxlbmd0aCk7XG4gICAgICAgICAgICBoZWFkZXJzLmZvckVhY2goKGhlYWRlckVudHJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVhZGVySGFzaCA9IE9iamVjdC5rZXlzKGhlYWRlckVudHJ5KVswXTtcbiAgICAgICAgICAgICAgICBlZGZzU2VydmljZVByb3h5LmdldEJyaWNrKGhlYWRlckhhc2gsIChlcnIsIGhlYWRlckJyaWNrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlciA9IG5ldyBIZWFkZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyLmZyb21CcmljayhoZWFkZXJCcmljaywgaGVhZGVyRW50cnlbaGVhZGVySGFzaF0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbnNFbnRyaWVzID0gaGVhZGVyLmdldFRyYW5zYWN0aW9ucygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbnNBc3luY0Rpc3BhdGNoZXIgPSBuZXcgQXN5bmNEaXNwYXRjaGVyKChlcnJvcnMsIHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHNPYmogPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gT2JqZWN0LmtleXMocmVzdWx0KVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzT2JqW2tleV0gPSBPYmplY3QudmFsdWVzKHJlc3VsdFtrZXldKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbnNFbnRyaWVzLmZvckVhY2goKHRyYW5zYWN0aW9uRW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbkhhc2ggPSBPYmplY3Qua2V5cyh0cmFuc2FjdGlvbkVudHJ5KVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdDU0IuYXBwbHlUcmFuc2FjdGlvbihyZXN1bHRzT2JqW3RyYW5zYWN0aW9uSGFzaF0uc3dhcm0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRlcnNBc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uc0FzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KHRyYW5zYWN0aW9uc0VudHJpZXMubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25zRW50cmllcy5mb3JFYWNoKCh0cmFuc2FjdGlvbkVudHJ5KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbkhhc2ggPSBPYmplY3Qua2V5cyh0cmFuc2FjdGlvbkVudHJ5KVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkZnNTZXJ2aWNlUHJveHkuZ2V0QnJpY2sodHJhbnNhY3Rpb25IYXNoLCAoZXJyLCB0cmFuc2FjdGlvbkJyaWNrKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbk9iaiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uT2JqW3RyYW5zYWN0aW9uSGFzaF0gPSBjcnlwdG8uZGVjcnlwdE9iamVjdCh0cmFuc2FjdGlvbkJyaWNrLCB0cmFuc2FjdGlvbkVudHJ5W3RyYW5zYWN0aW9uSGFzaF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uc0FzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCh1bmRlZmluZWQsIHRyYW5zYWN0aW9uT2JqKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9fbG9hZEFzc2V0RnJvbVBhdGgocHJvY2Vzc2VkUGF0aCwgbG9jYWxDU0JJZGVudGlmaWVyLCBsb2NhbEhlYWRlckhpc3RvcnlIYXNoLCBjdXJyZW50SW5kZXgsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9fbG9hZFJhd0NTQihsb2NhbENTQklkZW50aWZpZXIsIChlcnIsIHJhd0NTQikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoY3VycmVudEluZGV4IDwgcHJvY2Vzc2VkUGF0aC5DU0JBbGlhc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRBbGlhcyA9IHByb2Nlc3NlZFBhdGguQ1NCQWxpYXNlc1tjdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFzc2V0ID0gcmF3Q1NCLmdldEFzc2V0KFwiZ2xvYmFsLkNTQlJlZmVyZW5jZVwiLCBuZXh0QWxpYXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NTQklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihhc3NldC5kc2VlZCk7XG5cbiAgICAgICAgICAgICAgICBfX2xvYWRBc3NldEZyb21QYXRoKHByb2Nlc3NlZFBhdGgsIG5ld0NTQklkZW50aWZpZXIsICsrY3VycmVudEluZGV4LCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBhc3NldCA9IHJhd0NTQi5nZXRBc3NldChwcm9jZXNzZWRQYXRoLmFzc2V0VHlwZSwgcHJvY2Vzc2VkUGF0aC5hc3NldEFpZCk7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCBhc3NldCwgcmF3Q1NCKTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gUm9vdENTQjtcbiIsIlxuZnVuY3Rpb24gRVZGU1Jlc29sdmVyKCkge1xuICAgIGxldCBpc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuYXV0aCA9IGZ1bmN0aW9uICh1cmwsIGF1dGhPYmosIGNhbGxiYWNrKSB7XG4gICAgICAgIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfTtcblxuICAgIHRoaXMuc2F2ZSA9IGZ1bmN0aW9uICh1cmwsIGNzYklkZW50aWZpZXIsIGRhdGFTdHJlYW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdVbmF1dGhlbnRpY2F0ZWQnKSk7XG4gICAgICAgIH1cblxuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdCh1cmwgKyBcIi9DU0IvXCIgKyBjc2JJZGVudGlmaWVyLmdldFVpZCgpLCBkYXRhU3RyZWFtLCAoZXJyLCByZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCByZXMpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5sb2FkID0gZnVuY3Rpb24gKHVybCwgY3NiSWRlbnRpZmllciwgdmVyc2lvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFpc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ1VuYXV0aGVudGljYXRlZCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgdmVyc2lvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHZlcnNpb247XG4gICAgICAgICAgICB2ZXJzaW9uID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBHZXQodXJsICsgXCIvQ1NCL1wiICsgY3NiSWRlbnRpZmllci5nZXRVaWQoKSArIFwiL1wiICsgdmVyc2lvbiwgKGVyciwgcmVzb3VyY2UpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCByZXNvdXJjZSk7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgIHRoaXMuZ2V0VmVyc2lvbnMgPSBmdW5jdGlvbiAodXJsLCBjc2JJZGVudGlmaWVyLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIWlzQXV0aGVudGljYXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignVW5hdXRoZW50aWNhdGVkJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgJCQucmVtb3RlLmRvSHR0cEdldCh1cmwgKyBcIi9DU0IvXCIgKyBjc2JJZGVudGlmaWVyLmdldFVpZCgpICsgXCIvdmVyc2lvbnNcIiwgKGVyciwgdmVyc2lvbnMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBKU09OLnBhcnNlKHZlcnNpb25zKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbXBhcmVWZXJzaW9ucyA9IGZ1bmN0aW9uICh1cmwsIGZpbGVzTGlzdCwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFpc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoJ1VuYXV0aGVudGljYXRlZCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBQb3N0KHVybCArIFwiL0NTQi9jb21wYXJlVmVyc2lvbnNcIiwgSlNPTi5zdHJpbmdpZnkoZmlsZXNMaXN0KSwgKGVyciwgbW9kaWZpZWRGaWxlcykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIG1vZGlmaWVkRmlsZXMpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVWRlNSZXNvbHZlcjsiLCJcbmZ1bmN0aW9uIEFzeW5jRGlzcGF0Y2hlcihmaW5hbENhbGxiYWNrKSB7XG5cdGxldCByZXN1bHRzID0gW107XG5cdGxldCBlcnJvcnMgPSBbXTtcblxuXHRsZXQgc3RhcnRlZCA9IDA7XG5cblx0ZnVuY3Rpb24gbWFya09uZUFzRmluaXNoZWQoZXJyLCByZXMpIHtcblx0XHRpZihlcnIpIHtcblx0XHRcdGVycm9ycy5wdXNoKGVycik7XG5cdFx0fVxuXG5cdFx0aWYoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcblx0XHRcdGFyZ3VtZW50c1swXSA9IHVuZGVmaW5lZDtcblx0XHRcdHJlcyA9IGFyZ3VtZW50cztcblx0XHR9XG5cblx0XHRpZih0eXBlb2YgcmVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2gocmVzKTtcblx0XHR9XG5cblx0XHRpZigtLXN0YXJ0ZWQgPD0gMCkge1xuICAgICAgICAgICAgY2FsbENhbGxiYWNrKCk7XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gZGlzcGF0Y2hFbXB0eShhbW91bnQgPSAxKSB7XG5cdFx0c3RhcnRlZCArPSBhbW91bnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBjYWxsQ2FsbGJhY2soKSB7XG5cdCAgICBpZihlcnJvcnMubGVuZ3RoID09PSAwKSB7XG5cdCAgICAgICAgZXJyb3JzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cblx0ICAgIGlmKHJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG5cdCAgICAgICAgcmVzdWx0cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbmFsQ2FsbGJhY2soZXJyb3JzLCByZXN1bHRzKTtcbiAgICB9XG5cblx0cmV0dXJuIHtcblx0XHRkaXNwYXRjaEVtcHR5LFxuXHRcdG1hcmtPbmVBc0ZpbmlzaGVkXG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXN5bmNEaXNwYXRjaGVyOyIsImNvbnN0IGNyeXB0byA9IHJlcXVpcmUoJ3Bza2NyeXB0bycpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoXCIuLi9saWIvQ1NCSWRlbnRpZmllclwiKTtcblxuZnVuY3Rpb24gRHNlZWRDYWdlKGxvY2FsRm9sZGVyKSB7XG5cdGNvbnN0IGRzZWVkRm9sZGVyID0gcGF0aC5qb2luKGxvY2FsRm9sZGVyLCAnLnByaXZhdGVTa3knKTtcblx0Y29uc3QgZHNlZWRQYXRoID0gcGF0aC5qb2luKGRzZWVkRm9sZGVyLCAnZHNlZWQnKTtcblxuXHRmdW5jdGlvbiBsb2FkRHNlZWRCYWNrdXBzKHBpbiwgY2FsbGJhY2spIHtcblx0XHRmcy5ta2Rpcihkc2VlZEZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIChlcnIpID0+IHtcblx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cblx0XHRcdGNyeXB0by5sb2FkRGF0YShwaW4sIGRzZWVkUGF0aCwgKGVyciwgZHNlZWRCYWNrdXBzKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR0cnl7XG5cdFx0XHRcdFx0ZHNlZWRCYWNrdXBzID0gSlNPTi5wYXJzZShkc2VlZEJhY2t1cHMudG9TdHJpbmcoKSk7XG5cdFx0XHRcdH1jYXRjaCAoZSkge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhlKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBjc2JJZGVudGlmaWVyO1xuXHRcdFx0XHRpZiAoZHNlZWRCYWNrdXBzLmRzZWVkICYmICFCdWZmZXIuaXNCdWZmZXIoZHNlZWRCYWNrdXBzLmRzZWVkKSkge1xuXHRcdFx0XHRcdGRzZWVkQmFja3Vwcy5kc2VlZCA9IEJ1ZmZlci5mcm9tKGRzZWVkQmFja3Vwcy5kc2VlZCk7XG5cdFx0XHRcdFx0Y3NiSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKGRzZWVkQmFja3Vwcy5kc2VlZCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayh1bmRlZmluZWQsIGNzYklkZW50aWZpZXIsIGRzZWVkQmFja3Vwcy5iYWNrdXBzKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9XG5cblx0ZnVuY3Rpb24gc2F2ZURzZWVkQmFja3VwcyhwaW4sIGNzYklkZW50aWZpZXIsIGJhY2t1cHMsIGNhbGxiYWNrKSB7XG5cdFx0ZnMubWtkaXIoZHNlZWRGb2xkZXIsIHtyZWN1cnNpdmU6IHRydWV9LCAoZXJyKSA9PiB7XG5cdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhlcnIpO1xuXHRcdFx0fVxuXG5cdFx0XHRsZXQgZHNlZWQ7XG5cdFx0XHRpZihjc2JJZGVudGlmaWVyKXtcblx0XHRcdFx0ZHNlZWQgPSBjc2JJZGVudGlmaWVyLmdldERzZWVkKCk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBkc2VlZEJhY2t1cHMgPSBKU09OLnN0cmluZ2lmeSh7XG5cdFx0XHRcdGRzZWVkLFxuXHRcdFx0XHRiYWNrdXBzXG5cdFx0XHR9KTtcblxuXHRcdFx0Y3J5cHRvLnNhdmVEYXRhKEJ1ZmZlci5mcm9tKGRzZWVkQmFja3VwcyksIHBpbiwgZHNlZWRQYXRoLCBjYWxsYmFjayk7XG5cdFx0fSk7XG5cdH1cblxuXG5cdHJldHVybiB7XG5cdFx0bG9hZERzZWVkQmFja3Vwcyxcblx0XHRzYXZlRHNlZWRCYWNrdXBzLFxuXHR9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gRHNlZWRDYWdlOyIsImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbmZ1bmN0aW9uIEhhc2hDYWdlKGxvY2FsRm9sZGVyKSB7XG5cdGNvbnN0IGhhc2hGb2xkZXIgPSBwYXRoLmpvaW4obG9jYWxGb2xkZXIsICcucHJpdmF0ZVNreScpO1xuXHRjb25zdCBoYXNoUGF0aCA9IHBhdGguam9pbihoYXNoRm9sZGVyLCAnaGFzaCcpO1xuXG5cdGZ1bmN0aW9uIGxvYWRIYXNoKGNhbGxiYWNrKSB7XG5cdFx0ZnMubWtkaXIoaGFzaEZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIChlcnIpID0+IHtcblx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cblx0XHRcdGZzLnJlYWRGaWxlKGhhc2hQYXRoLCAoZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdGlmKGVycil7XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIHt9KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhbGxiYWNrKG51bGwsIEpTT04ucGFyc2UoZGF0YSkpO1xuXHRcdFx0fSk7XG5cblx0XHR9KTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNhdmVIYXNoKGhhc2hPYmosIGNhbGxiYWNrKSB7XG5cdFx0ZnMubWtkaXIoaGFzaEZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIChlcnIpID0+IHtcblx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cblx0XHRcdGZzLndyaXRlRmlsZShoYXNoUGF0aCwgSlNPTi5zdHJpbmdpZnkoaGFzaE9iaiwgbnVsbCwgJ1xcdCcpLCAoZXJyKSA9PiB7XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGxvYWRIYXNoLFxuXHRcdHNhdmVIYXNoXG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSGFzaENhZ2U7XG4iLCJleHBvcnRzLmRlZmF1bHRCYWNrdXAgPSBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MFwiO1xuZXhwb3J0cy5kZWZhdWx0UGluID0gXCIxMjM0NTY3OFwiO1xuZXhwb3J0cy5ub1RyaWVzID0gMztcbiIsImNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbi8vIGNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUGF0aChsb2NhbEZvbGRlciwgY3NiSWRlbnRpZmllcikge1xuICAgIHJldHVybiBwYXRoLmpvaW4obG9jYWxGb2xkZXIsIGNzYklkZW50aWZpZXIuZ2V0VWlkKCkpO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzVXJsKHVybCwgYXNzZXRUeXBlKSB7XG4gICAgY29uc3Qgc3BsaXRVcmwgPSB1cmwuc3BsaXQoJy8nKTtcbiAgICBjb25zdCBhbGlhc0Fzc2V0ID0gc3BsaXRVcmwucG9wKCk7XG4gICAgY29uc3QgQ1NCUGF0aCA9IHNwbGl0VXJsLmpvaW4oJy8nKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBDU0JQYXRoOiBDU0JQYXRoICsgJzonICsgYXNzZXRUeXBlICsgJzonICsgYWxpYXNBc3NldCxcbiAgICAgICAgYWxpYXM6IGFsaWFzQXNzZXRcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBkZWxldGVSZWN1cnNpdmVseShpbnB1dFBhdGgsIGlzUm9vdCA9IHRydWUsIGNhbGxiYWNrKSB7XG5cbiAgICBmcy5zdGF0KGlucHV0UGF0aCwgZnVuY3Rpb24gKGVyciwgc3RhdHMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCBzdGF0cyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICBmcy51bmxpbmsoaW5wdXRQYXRoLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgZnMucmVhZGRpcihpbnB1dFBhdGgsIChlcnIsIGZpbGVzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGZfbGVuZ3RoID0gZmlsZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGxldCBmX2RlbGV0ZV9pbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja1N0YXR1cyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZfbGVuZ3RoID09PSBmX2RlbGV0ZV9pbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWlzUm9vdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLnJtZGlyKGlucHV0UGF0aCwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoIWNoZWNrU3RhdHVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcFBhdGggPSBwYXRoLmpvaW4oaW5wdXRQYXRoLCBmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZVJlY3Vyc2l2ZWx5KHRlbXBQYXRoLCBmYWxzZSwoZXJyLCBzdGF0dXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmX2RlbGV0ZV9pbmRleCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1N0YXR1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZW5lcmF0ZVBhdGgsXG4gICAgcHJvY2Vzc1VybCxcbiAgICBkZWxldGVSZWN1cnNpdmVseVxufTtcblxuIiwiY29uc3QgUm9vdENTQiA9IHJlcXVpcmUoXCIuLi9saWIvUm9vdENTQlwiKTtcbmNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xuY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuXG5cbm1vZHVsZS5leHBvcnRzLnZhbGlkYXRlUGluID0gZnVuY3Rpb24gKGxvY2FsRm9sZGVyLCBzd2FybSwgcGhhc2VOYW1lLCBwaW4sIG5vVHJpZXMsIC4uLmFyZ3MpIHtcblx0Um9vdENTQi5jcmVhdGVSb290Q1NCKGxvY2FsRm9sZGVyLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgcGluLCAoZXJyLCByb290Q1NCLCBjc2JJZGVudGlmaWVyLCBiYWNrdXBzKSA9Pntcblx0XHRpZihlcnIpe1xuXHRcdFx0c3dhcm0uc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgbm9UcmllcyAtIDEpO1xuXHRcdH1lbHNle1xuXHRcdFx0aWYoY3NiSWRlbnRpZmllcil7XG5cdFx0XHRcdHN3YXJtLnJvb3RDU0IgPSByb290Q1NCO1xuXHRcdFx0XHRzd2FybS5jc2JJZGVudGlmaWVyID0gY3NiSWRlbnRpZmllcjtcblx0XHRcdH1cblx0XHRcdGFyZ3MucHVzaChiYWNrdXBzKTtcblx0XHRcdHN3YXJtW3BoYXNlTmFtZV0ocGluLCAuLi5hcmdzKTtcblx0XHR9XG5cdH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMucmVwb3J0T3JDb250aW51ZSA9IGZ1bmN0aW9uKHN3YXJtLCBwaGFzZU5hbWUsIGVycm9yTWVzc2FnZSwgLi4uYXJncyl7XG5cdHJldHVybiBmdW5jdGlvbihlcnIsLi4ucmVzKSB7XG5cdFx0aWYgKGVycikge1xuXHRcdFx0c3dhcm0uc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIGVyciwgZXJyb3JNZXNzYWdlKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHBoYXNlTmFtZSkge1xuXHRcdFx0XHRcdHN3YXJtW3BoYXNlTmFtZV0oLi4ucmVzLCAuLi5hcmdzKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5jaGVja01hc3RlckNTQkV4aXN0cyA9IGZ1bmN0aW9uIChsb2NhbEZvbGRlciwgY2FsbGJhY2spIHtcblx0ZnMuc3RhdChwYXRoLmpvaW4obG9jYWxGb2xkZXIsIFwiLnByaXZhdGVTa3kvaGFzaFwiKSwgKGVyciwgc3RhdHMpPT57XG5cdFx0aWYoZXJyKXtcblx0XHRcdHJldHVybiBjYWxsYmFjayhlcnIsIGZhbHNlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gY2FsbGJhY2sodW5kZWZpbmVkLCB0cnVlKTtcblx0fSk7XG59OyIsInJlcXVpcmUoXCJwc2staHR0cC1jbGllbnRcIik7XG5jb25zdCBiYXIgPSByZXF1aXJlKFwiYmFyXCIpO1xuY29uc3QgQnJpY2sgPSBiYXIuQnJpY2s7XG5cbmZ1bmN0aW9uIEVERlNCcmlja1N0b3JhZ2UodXJsKSB7XG5cbiAgICB0aGlzLnB1dEJyaWNrID0gZnVuY3Rpb24gKGJyaWNrLCBjYWxsYmFjaykge1xuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdCh1cmwgKyBcIi9FREZTL1wiICsgYnJpY2suZ2V0SGFzaCgpLCBicmljay5nZXREYXRhKCksIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRCcmljayA9IGZ1bmN0aW9uIChicmlja0hhc2gsIGNhbGxiYWNrKSB7XG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBHZXQodXJsICsgXCIvRURGUy9cIiArIGJyaWNrSGFzaCwgKGVyciwgYnJpY2tEYXRhKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG5ldyBCcmljayhicmlja0RhdGEpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuZGVsZXRlQnJpY2sgPSBmdW5jdGlvbiAoYnJpY2tIYXNoLCBjYWxsYmFjaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gICAgfTtcblxuICAgIHRoaXMucHV0QmFyTWFwID0gZnVuY3Rpb24gKGJhck1hcCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgbWFwQnJpY2sgPSBiYXJNYXAudG9CcmljaygpO1xuICAgICAgICB0aGlzLnB1dEJyaWNrKG1hcEJyaWNrLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1hcEJyaWNrLmdldEhhc2goKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmdldEJhck1hcCA9IGZ1bmN0aW9uIChtYXBEaWdlc3QsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbWFwRGlnZXN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gbWFwRGlnZXN0O1xuICAgICAgICAgICAgbWFwRGlnZXN0ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXBEaWdlc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh1bmRlZmluZWQsIG5ldyBiYXIuRm9sZGVyQmFyTWFwKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5nZXRCcmljayhtYXBEaWdlc3QsIChlcnIsIG1hcEJyaWNrKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgbmV3IGJhci5Gb2xkZXJCYXJNYXAoSlNPTi5wYXJzZShtYXBCcmljay5nZXREYXRhKCkudG9TdHJpbmcoKSkpKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVFREZTQnJpY2tTdG9yYWdlKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IEVERlNCcmlja1N0b3JhZ2UodXJsKTtcbiAgICB9XG59O1xuXG4iLCJjb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbmNvbnN0IFBza0hhc2ggPSByZXF1aXJlKCdwc2tjcnlwdG8nKS5Qc2tIYXNoO1xuXG5jb25zdCBmb2xkZXJOYW1lU2l6ZSA9IHByb2Nlc3MuZW52LkZPTERFUl9OQU1FX1NJWkUgfHwgNTtcbmNvbnN0IEZJTEVfU0VQQVJBVE9SID0gJy0nO1xubGV0IHJvb3Rmb2xkZXI7XG5cbiQkLmZsb3cuZGVzY3JpYmUoXCJCcmlja3NNYW5hZ2VyXCIsIHtcbiAgICBpbml0OiBmdW5jdGlvbiAocm9vdEZvbGRlciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFyb290Rm9sZGVyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJObyByb290IGZvbGRlciBzcGVjaWZpZWQhXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByb290Rm9sZGVyID0gcGF0aC5yZXNvbHZlKHJvb3RGb2xkZXIpO1xuICAgICAgICB0aGlzLl9fZW5zdXJlRm9sZGVyU3RydWN0dXJlKHJvb3RGb2xkZXIsIGZ1bmN0aW9uIChlcnIsIHBhdGgpIHtcbiAgICAgICAgICAgIHJvb3Rmb2xkZXIgPSByb290Rm9sZGVyO1xuICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByb290Rm9sZGVyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICB3cml0ZTogZnVuY3Rpb24gKGZpbGVOYW1lLCByZWFkRmlsZVN0cmVhbSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLl9fdmVyaWZ5RmlsZU5hbWUoZmlsZU5hbWUsIGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFyZWFkRmlsZVN0cmVhbSB8fCAhcmVhZEZpbGVTdHJlYW0ucGlwZSB8fCB0eXBlb2YgcmVhZEZpbGVTdHJlYW0ucGlwZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJTb21ldGhpbmcgd3JvbmcgaGFwcGVuZWRcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9sZGVyTmFtZSA9IHBhdGguam9pbihyb290Zm9sZGVyLCBmaWxlTmFtZS5zdWJzdHIoMCwgZm9sZGVyTmFtZVNpemUpKTtcblxuICAgICAgICBjb25zdCBzZXJpYWwgPSB0aGlzLnNlcmlhbCgoKSA9PiB7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNlcmlhbC5fX2Vuc3VyZUZvbGRlclN0cnVjdHVyZShmb2xkZXJOYW1lLCBzZXJpYWwuX19wcm9ncmVzcyk7XG4gICAgICAgIHNlcmlhbC5fX3dyaXRlRmlsZShyZWFkRmlsZVN0cmVhbSwgZm9sZGVyTmFtZSwgZmlsZU5hbWUsIGNhbGxiYWNrKTtcbiAgICB9LFxuICAgIHJlYWQ6IGZ1bmN0aW9uIChmaWxlTmFtZSwgd3JpdGVGaWxlU3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb2xkZXJQYXRoID0gcGF0aC5qb2luKHJvb3Rmb2xkZXIsIGZpbGVOYW1lLnN1YnN0cigwLCBmb2xkZXJOYW1lU2l6ZSkpO1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmb2xkZXJQYXRoLCBmaWxlTmFtZSk7XG4gICAgICAgIHRoaXMuX192ZXJpZnlGaWxlRXhpc3RlbmNlKGZpbGVQYXRoLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fX3JlYWRGaWxlKHdyaXRlRmlsZVN0cmVhbSwgZmlsZVBhdGgsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gZmlsZSBmb3VuZC5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGFkZEFsaWFzOiBmdW5jdGlvbiAoZmlsZW5hbWUsIGFsaWFzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuX192ZXJpZnlGaWxlTmFtZShmaWxlTmFtZSwgY2FsbGJhY2spKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFsaWFzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gYWxpYXMgd2FzIHByb3ZpZGVkXCIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5hbGlhc2VzKSB7XG4gICAgICAgICAgICB0aGlzLmFsaWFzZXMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWxpYXNlc1thbGlhc10gPSBmaWxlbmFtZTtcblxuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH0sXG4gICAgd3JpdGVXaXRoQWxpYXM6IGZ1bmN0aW9uIChhbGlhcywgcmVhZFN0cmVhbSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSB0aGlzLl9fZ2V0RmlsZU5hbWUoYWxpYXMsIGNhbGxiYWNrKTtcbiAgICAgICAgdGhpcy53cml0ZShmaWxlTmFtZSwgcmVhZFN0cmVhbSwgY2FsbGJhY2spO1xuICAgIH0sXG4gICAgcmVhZFdpdGhBbGlhczogZnVuY3Rpb24gKGFsaWFzLCB3cml0ZVN0cmVhbSwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSB0aGlzLl9fZ2V0RmlsZU5hbWUoYWxpYXMsIGNhbGxiYWNrKTtcbiAgICAgICAgdGhpcy5yZWFkKGZpbGVOYW1lLCB3cml0ZVN0cmVhbSwgY2FsbGJhY2spO1xuICAgIH0sXG4gICAgcmVhZFZlcnNpb246IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVZlcnNpb24sIHdyaXRlRmlsZVN0cmVhbSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLl9fdmVyaWZ5RmlsZU5hbWUoZmlsZU5hbWUsIGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IHBhdGguam9pbihyb290Zm9sZGVyLCBmaWxlTmFtZS5zdWJzdHIoMCwgZm9sZGVyTmFtZVNpemUpKTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLmpvaW4oZm9sZGVyUGF0aCwgZmlsZU5hbWUsIGZpbGVWZXJzaW9uKTtcbiAgICAgICAgdGhpcy5fX3ZlcmlmeUZpbGVFeGlzdGVuY2UoZmlsZVBhdGgsIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9fcmVhZEZpbGUod3JpdGVGaWxlU3RyZWFtLCBwYXRoLmpvaW4oZmlsZVBhdGgpLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIk5vIGZpbGUgZm91bmQuXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRWZXJzaW9uc0ZvckZpbGU6IGZ1bmN0aW9uIChmaWxlTmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLl9fdmVyaWZ5RmlsZU5hbWUoZmlsZU5hbWUsIGNhbGxiYWNrKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZm9sZGVyUGF0aCA9IHBhdGguam9pbihyb290Zm9sZGVyLCBmaWxlTmFtZS5zdWJzdHIoMCwgZm9sZGVyTmFtZVNpemUpLCBmaWxlTmFtZSk7XG4gICAgICAgIGZzLnJlYWRkaXIoZm9sZGVyUGF0aCwgKGVyciwgZmlsZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdG90YWxOdW1iZXJPZkZpbGVzID0gZmlsZXMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZmlsZXNEYXRhID0gW107XG5cbiAgICAgICAgICAgIGxldCByZXNvbHZlZEZpbGVzID0gMDtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbE51bWJlck9mRmlsZXM7ICsraSkge1xuICAgICAgICAgICAgICAgIGZzLnN0YXQocGF0aC5qb2luKGZvbGRlclBhdGgsIGZpbGVzW2ldKSwgKGVyciwgc3RhdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZXNEYXRhLnB1c2goe3ZlcnNpb246IGZpbGVzW2ldLCBjcmVhdGlvblRpbWU6IG51bGwsIGNyZWF0aW9uVGltZU1zOiBudWxsfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmaWxlc0RhdGEucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBmaWxlc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0aW9uVGltZTogc3RhdHMuYmlydGh0aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRpb25UaW1lTXM6IHN0YXRzLmJpcnRodGltZU1zXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkRmlsZXMgKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzb2x2ZWRGaWxlcyA+PSB0b3RhbE51bWJlck9mRmlsZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzRGF0YS5zb3J0KChmaXJzdCwgc2Vjb25kKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlyc3RDb21wYXJlRGF0YSA9IGZpcnN0LmNyZWF0aW9uVGltZU1zIHx8IGZpcnN0LnZlcnNpb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Vjb25kQ29tcGFyZURhdGEgPSBzZWNvbmQuY3JlYXRpb25UaW1lTXMgfHwgc2Vjb25kLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3RDb21wYXJlRGF0YSAtIHNlY29uZENvbXBhcmVEYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGVzRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBjb21wYXJlVmVyc2lvbnM6IGZ1bmN0aW9uIChib2R5U3RyZWFtLCBjYWxsYmFjaykge1xuICAgICAgICBsZXQgYm9keSA9ICcnO1xuXG4gICAgICAgIGJvZHlTdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgYm9keSArPSBkYXRhO1xuICAgICAgICB9KTtcblxuICAgICAgICBib2R5U3RyZWFtLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGJvZHkgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX19jb21wYXJlVmVyc2lvbnMoYm9keSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIF9fdmVyaWZ5RmlsZU5hbWU6IGZ1bmN0aW9uIChmaWxlTmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFmaWxlTmFtZSB8fCB0eXBlb2YgZmlsZU5hbWUgIT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gZmlsZUlkIHNwZWNpZmllZC5cIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbGVOYW1lLmxlbmd0aCA8IGZvbGRlck5hbWVTaXplKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJGaWxlSWQgdG9vIHNtYWxsLiBcIiArIGZpbGVOYW1lKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIF9fZW5zdXJlRm9sZGVyU3RydWN0dXJlOiBmdW5jdGlvbiAoZm9sZGVyLCBjYWxsYmFjaykge1xuICAgICAgICBmcy5ta2Rpcihmb2xkZXIsIHtyZWN1cnNpdmU6IHRydWV9LCBjYWxsYmFjayk7XG4gICAgfSxcbiAgICBfX3dyaXRlRmlsZTogZnVuY3Rpb24gKHJlYWRTdHJlYW0sIGZvbGRlclBhdGgsIGZpbGVOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBoYXNoID0gcmVxdWlyZShcImNyeXB0b1wiKS5jcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihmb2xkZXJQYXRoLCBmaWxlTmFtZSk7XG4gICAgICAgIGZzLmFjY2VzcyhmaWxlUGF0aCwgKGVycikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlYWRTdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBoYXNoLnVwZGF0ZShkYXRhKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHdyaXRlU3RyZWFtID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0oZmlsZVBhdGgsIHttb2RlOiAwbzQ0NH0pO1xuXG4gICAgICAgICAgICAgICAgd3JpdGVTdHJlYW0ub24oXCJmaW5pc2hcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoYXNoRGlnZXN0ID0gaGFzaC5kaWdlc3QoXCJoZXhcIik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYXNoRGlnZXN0ICE9PSBmaWxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnMudW5saW5rKGZpbGVQYXRoLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiQ29udGVudCBoYXNoIGFuZCBmaWxlbmFtZSBhcmUgbm90IHRoZSBzYW1lXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgd3JpdGVTdHJlYW0ub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlU3RyZWFtLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlYWRTdHJlYW0uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soLi4uYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBfX2dldE5leHRWZXJzaW9uRmlsZU5hbWU6IGZ1bmN0aW9uIChmb2xkZXJQYXRoLCBmaWxlTmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5fX2dldExhdGVzdFZlcnNpb25OYW1lT2ZGaWxlKGZvbGRlclBhdGgsIChlcnIsIGZpbGVWZXJzaW9uKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGVWZXJzaW9uLm51bWVyaWNWZXJzaW9uICsgMSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAsXG4gICAgX19nZXRMYXRlc3RWZXJzaW9uTmFtZU9mRmlsZTogZnVuY3Rpb24gKGZvbGRlclBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGZzLnJlYWRkaXIoZm9sZGVyUGF0aCwgKGVyciwgZmlsZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBmaWxlVmVyc2lvbiA9IHtudW1lcmljVmVyc2lvbjogMCwgZnVsbFZlcnNpb246ICcwJyArIEZJTEVfU0VQQVJBVE9SfTtcblxuICAgICAgICAgICAgaWYgKGZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhbGxWZXJzaW9ucyA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUuc3BsaXQoRklMRV9TRVBBUkFUT1IpWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGF0ZXN0RmlsZSA9IHRoaXMuX19tYXhFbGVtZW50KGFsbFZlcnNpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZVZlcnNpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljVmVyc2lvbjogcGFyc2VJbnQobGF0ZXN0RmlsZSksXG4gICAgICAgICAgICAgICAgICAgICAgICBmdWxsVmVyc2lvbjogZmlsZXMuZmlsdGVyKGZpbGUgPT4gZmlsZS5zcGxpdChGSUxFX1NFUEFSQVRPUilbMF0gPT09IGxhdGVzdEZpbGUudG9TdHJpbmcoKSlbMF1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZS5jb2RlID0gJ2ludmFsaWRfZmlsZV9uYW1lX2ZvdW5kJztcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGZpbGVWZXJzaW9uKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgICxcbiAgICBfX21heEVsZW1lbnQ6IGZ1bmN0aW9uIChudW1iZXJzKSB7XG4gICAgICAgIGxldCBtYXggPSBudW1iZXJzWzBdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbnVtYmVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgbWF4ID0gTWF0aC5tYXgobWF4LCBudW1iZXJzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc05hTihtYXgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZWxlbWVudCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1heDtcbiAgICB9XG4gICAgLFxuICAgIF9fY29tcGFyZVZlcnNpb25zOiBmdW5jdGlvbiAoZmlsZXMsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzV2l0aENoYW5nZXMgPSBbXTtcbiAgICAgICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKGZpbGVzKTtcbiAgICAgICAgbGV0IHJlbWFpbmluZyA9IGVudHJpZXMubGVuZ3RoO1xuXG4gICAgICAgIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBmaWxlc1dpdGhDaGFuZ2VzKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGVudHJpZXMuZm9yRWFjaCgoW2ZpbGVOYW1lLCBmaWxlSGFzaF0pID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ2V0VmVyc2lvbnNGb3JGaWxlKGZpbGVOYW1lLCAoZXJyLCB2ZXJzaW9ucykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gdmVyc2lvbnMuc29tZSh2ZXJzaW9uID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzaCA9IHZlcnNpb24udmVyc2lvbi5zcGxpdChGSUxFX1NFUEFSQVRPUilbMV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBoYXNoID09PSBmaWxlSGFzaDtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXNXaXRoQ2hhbmdlcy5wdXNoKGZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodW5kZWZpbmVkLCBmaWxlc1dpdGhDaGFuZ2VzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLFxuICAgIF9fcmVhZEZpbGU6IGZ1bmN0aW9uICh3cml0ZUZpbGVTdHJlYW0sIGZpbGVQYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCByZWFkU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG5cbiAgICAgICAgd3JpdGVGaWxlU3RyZWFtLm9uKFwiZmluaXNoXCIsIGNhbGxiYWNrKTtcbiAgICAgICAgd3JpdGVGaWxlU3RyZWFtLm9uKFwiZXJyb3JcIiwgY2FsbGJhY2spO1xuXG4gICAgICAgIHJlYWRTdHJlYW0ucGlwZSh3cml0ZUZpbGVTdHJlYW0pO1xuICAgIH1cbiAgICAsXG4gICAgX19wcm9ncmVzczogZnVuY3Rpb24gKGVyciwgcmVzdWx0KSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAsXG4gICAgX192ZXJpZnlGaWxlRXhpc3RlbmNlOiBmdW5jdGlvbiAoZmlsZVBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGZzLmFjY2VzcyhmaWxlUGF0aCwgY2FsbGJhY2spO1xuICAgIH1cbiAgICAsXG4gICAgX19nZXRGaWxlTmFtZTogZnVuY3Rpb24gKGFsaWFzLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuYWxpYXNlcykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIk5vIGZpbGVzIGhhdmUgYmVlbiBhc3NvY2lhdGVkIHdpdGggYWxpYXNlc1wiKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSB0aGlzLmFsaWFzZXNbYWxpYXNdO1xuICAgICAgICBpZiAoIWZpbGVOYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiVGhlIHNwZWNpZmllZCBhbGlhcyB3YXMgbm90IGFzc29jaWF0ZWQgd2l0aCBhbnkgZmlsZVwiKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsZU5hbWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLFxufSk7XG4iLCJyZXF1aXJlKFwiLi4vZmxvd3MvQnJpY2tzTWFuYWdlclwiKTtcblxuZnVuY3Rpb24gRURGU01pZGRsZXdhcmUoc2VydmVyKSB7XG5cbiAgICBzZXJ2ZXIucG9zdCgnLzpmaWxlSWQnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgJCQuZmxvdy5zdGFydChcIkJyaWNrc01hbmFnZXJcIikud3JpdGUocmVxLnBhcmFtcy5maWxlSWQsIHJlcSwgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMTtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcblxuICAgICAgICAgICAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VBQ0NFUycpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG4gICAgc2VydmVyLmdldCgnLzpmaWxlSWQnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgcmVzLnNldEhlYWRlcihcImNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKTtcbiAgICAgICAgJCQuZmxvdy5zdGFydChcIkJyaWNrc01hbmFnZXJcIikucmVhZChyZXEucGFyYW1zLmZpbGVJZCwgcmVzLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAwO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA0MDQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgc2VydmVyLnBvc3QoJy9hZGRBbGlhcy86ZmlsZUlkJywgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICQkLmZsb3cuc3RhcnQoXCJCcmlja3NNYW5hZ2VyXCIpLmFkZEFsaWFzKHJlcS5wYXJhbXMuZmlsZUlkLCByZXEsICAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAxO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwOTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBzZXJ2ZXIucG9zdCgnL2FsaWFzLzphbGlhcycsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICAkJC5mbG93LnN0YXJ0KFwiQnJpY2tzTWFuYWdlclwiKS53cml0ZVdpdGhBbGlhcyhyZXEucGFyYW1zLmFsaWFzLCByZXEsICAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gMjAxO1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKGVyci5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDQwOTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgc2VydmVyLmdldCgnL2FsaWFzLzphbGlhcycsIChyZXEsIHJlcykgPT4ge1xuICAgICAgICByZXMuc2V0SGVhZGVyKFwiY29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIpO1xuICAgICAgICAkJC5mbG93LnN0YXJ0KFwiQnJpY2tzTWFuYWdlclwiKS5yZWFkV2l0aEFsaWFzKHJlcS5wYXJhbXMuYWxpYXMsIHJlcywgKGVyciwgcmVzdWx0KSA9PiB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDIwMDtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNDA0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFREZTTWlkZGxld2FyZTsiLCJcbmZ1bmN0aW9uIEFzeW5jRGlzcGF0Y2hlcihmaW5hbENhbGxiYWNrKSB7XG5cdGxldCByZXN1bHRzID0gW107XG5cdGxldCBlcnJvcnMgPSBbXTtcblxuXHRsZXQgc3RhcnRlZCA9IDA7XG5cblx0ZnVuY3Rpb24gbWFya09uZUFzRmluaXNoZWQoZXJyLCByZXMpIHtcblx0XHRpZihlcnIpIHtcblx0XHRcdGVycm9ycy5wdXNoKGVycik7XG5cdFx0fVxuXG5cdFx0aWYoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcblx0XHRcdGFyZ3VtZW50c1swXSA9IHVuZGVmaW5lZDtcblx0XHRcdHJlcyA9IGFyZ3VtZW50cztcblx0XHR9XG5cblx0XHRpZih0eXBlb2YgcmVzICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRyZXN1bHRzLnB1c2gocmVzKTtcblx0XHR9XG5cblx0XHRpZigtLXN0YXJ0ZWQgPD0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxDYWxsYmFjaygpO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIGRpc3BhdGNoRW1wdHkoYW1vdW50ID0gMSkge1xuXHRcdHN0YXJ0ZWQgKz0gYW1vdW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gY2FsbENhbGxiYWNrKCkge1xuXHQgICAgaWYoZXJyb3JzLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgICAgIGVycm9ycyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG5cdCAgICBpZihyZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgICAgIHJlc3VsdHMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaW5hbENhbGxiYWNrKGVycm9ycywgcmVzdWx0cyk7XG4gICAgfVxuXG5cdHJldHVybiB7XG5cdFx0ZGlzcGF0Y2hFbXB0eSxcblx0XHRtYXJrT25lQXNGaW5pc2hlZFxuXHR9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzeW5jRGlzcGF0Y2hlcjsiLCJjb25zdCB1dGlscyA9IHJlcXVpcmUoXCJzd2FybXV0aWxzXCIpO1xuY29uc3QgT3dNID0gdXRpbHMuT3dNO1xudmFyIGJlZXNIZWFsZXIgPSB1dGlscy5iZWVzSGVhbGVyO1xudmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xudmFyIHBhdGggPSByZXF1aXJlKFwicGF0aFwiKTtcblxuXG4vL1RPRE86IHByZXZlbnQgYSBjbGFzcyBvZiByYWNlIGNvbmRpdGlvbiB0eXBlIG9mIGVycm9ycyBieSBzaWduYWxpbmcgd2l0aCBmaWxlcyBtZXRhZGF0YSB0byB0aGUgd2F0Y2hlciB3aGVuIGl0IGlzIHNhZmUgdG8gY29uc3VtZVxuXG5mdW5jdGlvbiBGb2xkZXJNUShmb2xkZXIsIGNhbGxiYWNrID0gKCkgPT4ge30pe1xuXG5cdGlmKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgcGFyYW1ldGVyIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZ1bmN0aW9uXCIpO1xuXHR9XG5cblx0Zm9sZGVyID0gcGF0aC5ub3JtYWxpemUoZm9sZGVyKTtcblxuXHRmcy5ta2Rpcihmb2xkZXIsIHtyZWN1cnNpdmU6IHRydWV9LCBmdW5jdGlvbihlcnIsIHJlcyl7XG5cdFx0ZnMuZXhpc3RzKGZvbGRlciwgZnVuY3Rpb24oZXhpc3RzKSB7XG5cdFx0XHRpZiAoZXhpc3RzKSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCBmb2xkZXIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIG1rRmlsZU5hbWUoc3dhcm1SYXcpe1xuXHRcdGxldCBtZXRhID0gT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbShzd2FybVJhdyk7XG5cdFx0bGV0IG5hbWUgPSBgJHtmb2xkZXJ9JHtwYXRoLnNlcH0ke21ldGEuc3dhcm1JZH0uJHttZXRhLnN3YXJtVHlwZU5hbWV9YDtcblx0XHRjb25zdCB1bmlxdWUgPSBtZXRhLnBoYXNlSWQgfHwgJCQudWlkR2VuZXJhdG9yLnNhZmVfdXVpZCgpO1xuXG5cdFx0bmFtZSA9IG5hbWUrYC4ke3VuaXF1ZX1gO1xuXHRcdHJldHVybiBwYXRoLm5vcm1hbGl6ZShuYW1lKTtcblx0fVxuXG5cdHRoaXMuZ2V0SGFuZGxlciA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYocHJvZHVjZXIpe1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiT25seSBvbmUgY29uc3VtZXIgaXMgYWxsb3dlZCFcIik7XG5cdFx0fVxuXHRcdHByb2R1Y2VyID0gdHJ1ZTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VuZFN3YXJtU2VyaWFsaXphdGlvbjogZnVuY3Rpb24oc2VyaWFsaXphdGlvbiwgY2FsbGJhY2spe1xuXHRcdFx0XHRpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHR3cml0ZUZpbGUobWtGaWxlTmFtZShKU09OLnBhcnNlKHNlcmlhbGl6YXRpb24pKSwgc2VyaWFsaXphdGlvbiwgY2FsbGJhY2spO1xuXHRcdFx0fSxcblx0XHRcdGFkZFN0cmVhbSA6IGZ1bmN0aW9uKHN0cmVhbSwgY2FsbGJhY2spe1xuXHRcdFx0XHRpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmKCFzdHJlYW0gfHwgIXN0cmVhbS5waXBlIHx8IHR5cGVvZiBzdHJlYW0ucGlwZSAhPT0gXCJmdW5jdGlvblwiKXtcblx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiU29tZXRoaW5nIHdyb25nIGhhcHBlbmVkXCIpKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCBzd2FybSA9IFwiXCI7XG5cdFx0XHRcdHN0cmVhbS5vbignZGF0YScsIChjaHVuaykgPT57XG5cdFx0XHRcdFx0c3dhcm0gKz0gY2h1bms7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHN0cmVhbS5vbihcImVuZFwiLCAoKSA9PiB7XG5cdFx0XHRcdFx0d3JpdGVGaWxlKG1rRmlsZU5hbWUoSlNPTi5wYXJzZShzd2FybSkpLCBzd2FybSwgY2FsbGJhY2spO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRzdHJlYW0ub24oXCJlcnJvclwiLCAoZXJyKSA9Pntcblx0XHRcdFx0XHRjYWxsYmFjayhlcnIpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0sXG5cdFx0XHRhZGRTd2FybSA6IGZ1bmN0aW9uKHN3YXJtLCBjYWxsYmFjayl7XG5cdFx0XHRcdGlmKCFjYWxsYmFjayl7XG5cdFx0XHRcdFx0Y2FsbGJhY2sgPSAkJC5kZWZhdWx0RXJyb3JIYW5kbGluZ0ltcGxlbWVudGF0aW9uO1xuXHRcdFx0XHR9ZWxzZSBpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJlZXNIZWFsZXIuYXNKU09OKHN3YXJtLG51bGwsIG51bGwsIGZ1bmN0aW9uKGVyciwgcmVzKXtcblx0XHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHR3cml0ZUZpbGUobWtGaWxlTmFtZShyZXMpLCBKKHJlcyksIGNhbGxiYWNrKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9LFxuXHRcdFx0c2VuZFN3YXJtRm9yRXhlY3V0aW9uOiBmdW5jdGlvbihzd2FybSwgY2FsbGJhY2spe1xuXHRcdFx0XHRpZighY2FsbGJhY2spe1xuXHRcdFx0XHRcdGNhbGxiYWNrID0gJCQuZGVmYXVsdEVycm9ySGFuZGxpbmdJbXBsZW1lbnRhdGlvbjtcblx0XHRcdFx0fWVsc2UgaWYodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgY2FsbGJhY2sgZnVuY3Rpb25cIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiZWVzSGVhbGVyLmFzSlNPTihzd2FybSwgT3dNLnByb3RvdHlwZS5nZXRNZXRhRnJvbShzd2FybSwgXCJwaGFzZU5hbWVcIiksIE93TS5wcm90b3R5cGUuZ2V0TWV0YUZyb20oc3dhcm0sIFwiYXJnc1wiKSwgZnVuY3Rpb24oZXJyLCByZXMpe1xuXHRcdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBmaWxlID0gbWtGaWxlTmFtZShyZXMpO1xuXHRcdFx0XHRcdHZhciBjb250ZW50ID0gSlNPTi5zdHJpbmdpZnkocmVzKTtcblxuXHRcdFx0XHRcdC8vaWYgdGhlcmUgYXJlIG5vIG1vcmUgRkQncyBmb3IgZmlsZXMgdG8gYmUgd3JpdHRlbiB3ZSByZXRyeS5cblx0XHRcdFx0XHRmdW5jdGlvbiB3cmFwcGVyKGVycm9yLCByZXN1bHQpe1xuXHRcdFx0XHRcdFx0aWYoZXJyb3Ipe1xuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhgQ2F1Z2h0IGFuIHdyaXRlIGVycm9yLiBSZXRyeSB0byB3cml0ZSBmaWxlIFske2ZpbGV9XWApO1xuXHRcdFx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpPT57XG5cdFx0XHRcdFx0XHRcdFx0d3JpdGVGaWxlKGZpbGUsIGNvbnRlbnQsIHdyYXBwZXIpO1xuXHRcdFx0XHRcdFx0XHR9LCAxMCk7XG5cdFx0XHRcdFx0XHR9ZWxzZXtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycm9yLCByZXN1bHQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHdyaXRlRmlsZShmaWxlLCBjb250ZW50LCB3cmFwcGVyKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblx0fTtcblxuXHR2YXIgcmVjaXBpZW50O1xuXHR0aGlzLnNldElQQ0NoYW5uZWwgPSBmdW5jdGlvbihwcm9jZXNzQ2hhbm5lbCl7XG5cdFx0aWYocHJvY2Vzc0NoYW5uZWwgJiYgIXByb2Nlc3NDaGFubmVsLnNlbmQgfHwgKHR5cGVvZiBwcm9jZXNzQ2hhbm5lbC5zZW5kKSAhPSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiUmVjaXBpZW50IGlzIG5vdCBpbnN0YW5jZSBvZiBwcm9jZXNzL2NoaWxkX3Byb2Nlc3Mgb3IgaXQgd2FzIG5vdCBzcGF3bmVkIHdpdGggSVBDIGNoYW5uZWwhXCIpO1xuXHRcdH1cblx0XHRyZWNpcGllbnQgPSBwcm9jZXNzQ2hhbm5lbDtcblx0XHRpZihjb25zdW1lcil7XG5cdFx0XHRjb25zb2xlLmxvZyhgQ2hhbm5lbCB1cGRhdGVkYCk7XG5cdFx0XHQocmVjaXBpZW50IHx8IHByb2Nlc3MpLm9uKFwibWVzc2FnZVwiLCByZWNlaXZlRW52ZWxvcGUpO1xuXHRcdH1cblx0fTtcblxuXG5cdHZhciBjb25zdW1lZE1lc3NhZ2VzID0ge307XG5cblx0ZnVuY3Rpb24gY2hlY2tJZkNvbnN1bW1lZChuYW1lLCBtZXNzYWdlKXtcblx0XHRjb25zdCBzaG9ydE5hbWUgPSBwYXRoLmJhc2VuYW1lKG5hbWUpO1xuXHRcdGNvbnN0IHByZXZpb3VzU2F2ZWQgPSBjb25zdW1lZE1lc3NhZ2VzW3Nob3J0TmFtZV07XG5cdFx0bGV0IHJlc3VsdCA9IGZhbHNlO1xuXHRcdGlmKHByZXZpb3VzU2F2ZWQgJiYgIXByZXZpb3VzU2F2ZWQubG9jYWxlQ29tcGFyZShtZXNzYWdlKSl7XG5cdFx0XHRyZXN1bHQgPSB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0ZnVuY3Rpb24gc2F2ZTJIaXN0b3J5KGVudmVsb3BlKXtcblx0XHRjb25zdW1lZE1lc3NhZ2VzW3BhdGguYmFzZW5hbWUoZW52ZWxvcGUubmFtZSldID0gZW52ZWxvcGUubWVzc2FnZTtcblx0fVxuXG5cdGZ1bmN0aW9uIGJ1aWxkRW52ZWxvcGVDb25maXJtYXRpb24oZW52ZWxvcGUsIHNhdmVIaXN0b3J5KXtcblx0XHRpZihzYXZlSGlzdG9yeSl7XG5cdFx0XHRzYXZlMkhpc3RvcnkoZW52ZWxvcGUpO1xuXHRcdH1cblx0XHRyZXR1cm4gYENvbmZpcm0gZW52ZWxvcGUgJHtlbnZlbG9wZS50aW1lc3RhbXB9IHNlbnQgdG8gJHtlbnZlbG9wZS5kZXN0fWA7XG5cdH1cblxuXHRmdW5jdGlvbiBidWlsZEVudmVsb3BlKG5hbWUsIG1lc3NhZ2Upe1xuXHRcdHJldHVybiB7XG5cdFx0XHRkZXN0OiBmb2xkZXIsXG5cdFx0XHRzcmM6IHByb2Nlc3MucGlkLFxuXHRcdFx0dGltZXN0YW1wOiBuZXcgRGF0ZSgpLmdldFRpbWUoKSxcblx0XHRcdG1lc3NhZ2U6IG1lc3NhZ2UsXG5cdFx0XHRuYW1lOiBuYW1lXG5cdFx0fTtcblx0fVxuXG5cdGZ1bmN0aW9uIHJlY2VpdmVFbnZlbG9wZShlbnZlbG9wZSl7XG5cdFx0aWYoIWVudmVsb3BlIHx8IHR5cGVvZiBlbnZlbG9wZSAhPT0gXCJvYmplY3RcIil7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdC8vY29uc29sZS5sb2coXCJyZWNlaXZlZCBlbnZlbG9wZVwiLCBlbnZlbG9wZSwgZm9sZGVyKTtcblxuXHRcdGlmKGVudmVsb3BlLmRlc3QgIT09IGZvbGRlciAmJiBmb2xkZXIuaW5kZXhPZihlbnZlbG9wZS5kZXN0KSE9PSAtMSAmJiBmb2xkZXIubGVuZ3RoID09PSBlbnZlbG9wZS5kZXN0KzEpe1xuXHRcdFx0Y29uc29sZS5sb2coXCJUaGlzIGVudmVsb3BlIGlzIG5vdCBmb3IgbWUhXCIpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxldCBtZXNzYWdlID0gZW52ZWxvcGUubWVzc2FnZTtcblxuXHRcdGlmKGNhbGxiYWNrKXtcblx0XHRcdC8vY29uc29sZS5sb2coXCJTZW5kaW5nIGNvbmZpcm1hdGlvblwiLCBwcm9jZXNzLnBpZCk7XG5cdFx0XHRyZWNpcGllbnQuc2VuZChidWlsZEVudmVsb3BlQ29uZmlybWF0aW9uKGVudmVsb3BlLCB0cnVlKSk7XG5cdFx0XHRjb25zdW1lcihudWxsLCBKU09OLnBhcnNlKG1lc3NhZ2UpKTtcblx0XHR9XG5cdH1cblxuXHR0aGlzLnJlZ2lzdGVyQXNJUENDb25zdW1lciA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcblx0XHRpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUaGUgYXJndW1lbnQgc2hvdWxkIGJlIGEgY2FsbGJhY2sgZnVuY3Rpb25cIik7XG5cdFx0fVxuXHRcdHJlZ2lzdGVyZWRBc0lQQ0NvbnN1bWVyID0gdHJ1ZTtcblx0XHQvL3dpbGwgcmVnaXN0ZXIgYXMgbm9ybWFsIGNvbnN1bWVyIGluIG9yZGVyIHRvIGNvbnN1bWUgYWxsIGV4aXN0aW5nIG1lc3NhZ2VzIGJ1dCB3aXRob3V0IHNldHRpbmcgdGhlIHdhdGNoZXJcblx0XHR0aGlzLnJlZ2lzdGVyQ29uc3VtZXIoY2FsbGJhY2ssIHRydWUsICh3YXRjaGVyKSA9PiAhd2F0Y2hlcik7XG5cblx0XHQvL2NvbnNvbGUubG9nKFwiUmVnaXN0ZXJlZCBhcyBJUEMgQ29uc3VtbWVyXCIsICk7XG5cdFx0KHJlY2lwaWVudCB8fCBwcm9jZXNzKS5vbihcIm1lc3NhZ2VcIiwgcmVjZWl2ZUVudmVsb3BlKTtcblx0fTtcblxuXHR0aGlzLnJlZ2lzdGVyQ29uc3VtZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHNob3VsZERlbGV0ZUFmdGVyUmVhZCA9IHRydWUsIHNob3VsZFdhaXRGb3JNb3JlID0gKHdhdGNoZXIpID0+IHRydWUpIHtcblx0XHRpZih0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIil7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgY2FsbGJhY2sgZnVuY3Rpb25cIik7XG5cdFx0fVxuXHRcdGlmIChjb25zdW1lcikge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiT25seSBvbmUgY29uc3VtZXIgaXMgYWxsb3dlZCEgXCIgKyBmb2xkZXIpO1xuXHRcdH1cblxuXHRcdGNvbnN1bWVyID0gY2FsbGJhY2s7XG5cblx0XHRmcy5ta2Rpcihmb2xkZXIsIHtyZWN1cnNpdmU6IHRydWV9LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcblx0XHRcdGlmIChlcnIgJiYgKGVyci5jb2RlICE9PSAnRUVYSVNUJykpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coZXJyKTtcblx0XHRcdH1cblx0XHRcdGNvbnN1bWVBbGxFeGlzdGluZyhzaG91bGREZWxldGVBZnRlclJlYWQsIHNob3VsZFdhaXRGb3JNb3JlKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLndyaXRlTWVzc2FnZSA9IHdyaXRlRmlsZTtcblxuXHR0aGlzLnVubGlua0NvbnRlbnQgPSBmdW5jdGlvbiAobWVzc2FnZUlkLCBjYWxsYmFjaykge1xuXHRcdGNvbnN0IG1lc3NhZ2VQYXRoID0gcGF0aC5qb2luKGZvbGRlciwgbWVzc2FnZUlkKTtcblxuXHRcdGZzLnVubGluayhtZXNzYWdlUGF0aCwgKGVycikgPT4ge1xuXHRcdFx0Y2FsbGJhY2soZXJyKTtcblx0XHR9KTtcblx0fTtcblxuXHR0aGlzLmRpc3Bvc2UgPSBmdW5jdGlvbihmb3JjZSl7XG5cdFx0aWYodHlwZW9mIGZvbGRlciAhPSBcInVuZGVmaW5lZFwiKXtcblx0XHRcdHZhciBmaWxlcztcblx0XHRcdHRyeXtcblx0XHRcdFx0ZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhmb2xkZXIpO1xuXHRcdFx0fWNhdGNoKGVycm9yKXtcblx0XHRcdFx0Ly8uLlxuXHRcdFx0fVxuXG5cdFx0XHRpZihmaWxlcyAmJiBmaWxlcy5sZW5ndGggPiAwICYmICFmb3JjZSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiRGlzcG9zaW5nIGEgY2hhbm5lbCB0aGF0IHN0aWxsIGhhcyBtZXNzYWdlcyEgRGlyIHdpbGwgbm90IGJlIHJlbW92ZWQhXCIpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0dHJ5e1xuXHRcdFx0XHRcdGZzLnJtZGlyU3luYyhmb2xkZXIpO1xuXHRcdFx0XHR9Y2F0Y2goZXJyKXtcblx0XHRcdFx0XHQvLy4uXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Zm9sZGVyID0gbnVsbDtcblx0XHR9XG5cblx0XHRpZihwcm9kdWNlcil7XG5cdFx0XHQvL25vIG5lZWQgdG8gZG8gYW55dGhpbmcgZWxzZVxuXHRcdH1cblxuXHRcdGlmKHR5cGVvZiBjb25zdW1lciAhPSBcInVuZGVmaW5lZFwiKXtcblx0XHRcdGNvbnN1bWVyID0gKCkgPT4ge307XG5cdFx0fVxuXG5cdFx0aWYod2F0Y2hlcil7XG5cdFx0XHR3YXRjaGVyLmNsb3NlKCk7XG5cdFx0XHR3YXRjaGVyID0gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qIC0tLS0tLS0tLS0tLS0tLS0gcHJvdGVjdGVkICBmdW5jdGlvbnMgKi9cblx0dmFyIGNvbnN1bWVyID0gbnVsbDtcblx0dmFyIHJlZ2lzdGVyZWRBc0lQQ0NvbnN1bWVyID0gZmFsc2U7XG5cdHZhciBwcm9kdWNlciA9IG51bGw7XG5cblx0ZnVuY3Rpb24gYnVpbGRQYXRoRm9yRmlsZShmaWxlbmFtZSl7XG5cdFx0cmV0dXJuIHBhdGgubm9ybWFsaXplKHBhdGguam9pbihmb2xkZXIsIGZpbGVuYW1lKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb25zdW1lTWVzc2FnZShmaWxlbmFtZSwgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCBjYWxsYmFjaykge1xuXHRcdHZhciBmdWxsUGF0aCA9IGJ1aWxkUGF0aEZvckZpbGUoZmlsZW5hbWUpO1xuXG5cdFx0ZnMucmVhZEZpbGUoZnVsbFBhdGgsIFwidXRmOFwiLCBmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG5cdFx0XHRpZiAoIWVycikge1xuXHRcdFx0XHRpZiAoZGF0YSAhPT0gXCJcIikge1xuXHRcdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0XHR2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZGF0YSk7XG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiUGFyc2luZyBlcnJvclwiLCBlcnJvcik7XG5cdFx0XHRcdFx0XHRlcnIgPSBlcnJvcjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZihjaGVja0lmQ29uc3VtbWVkKGZ1bGxQYXRoLCBkYXRhKSl7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGBtZXNzYWdlIGFscmVhZHkgY29uc3VtZWQgWyR7ZmlsZW5hbWV9XWApO1xuXHRcdFx0XHRcdFx0cmV0dXJuIDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkKSB7XG5cblx0XHRcdFx0XHRcdGZzLnVubGluayhmdWxsUGF0aCwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG5cdFx0XHRcdFx0XHRcdGlmIChlcnIpIHt0aHJvdyBlcnI7fTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhlcnIsIG1lc3NhZ2UpO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNvbnN1bWUgZXJyb3JcIiwgZXJyKTtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBjb25zdW1lQWxsRXhpc3Rpbmcoc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCBzaG91bGRXYWl0Rm9yTW9yZSkge1xuXG5cdFx0bGV0IGN1cnJlbnRGaWxlcyA9IFtdO1xuXG5cdFx0ZnMucmVhZGRpcihmb2xkZXIsICd1dGY4JywgZnVuY3Rpb24gKGVyciwgZmlsZXMpIHtcblx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0JCQuZXJyb3JIYW5kbGVyLmVycm9yKGVycik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGN1cnJlbnRGaWxlcyA9IGZpbGVzO1xuXHRcdFx0aXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMpO1xuXG5cdFx0fSk7XG5cblx0XHRmdW5jdGlvbiBzdGFydFdhdGNoaW5nKCl7XG5cdFx0XHRpZiAoc2hvdWxkV2FpdEZvck1vcmUodHJ1ZSkpIHtcblx0XHRcdFx0d2F0Y2hGb2xkZXIoc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCBzaG91bGRXYWl0Rm9yTW9yZSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMsIGN1cnJlbnRJbmRleCA9IDApIHtcblx0XHRcdGlmIChjdXJyZW50SW5kZXggPT09IGZpbGVzLmxlbmd0aCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKFwic3RhcnQgd2F0Y2hpbmdcIiwgbmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuXHRcdFx0XHRzdGFydFdhdGNoaW5nKCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHBhdGguZXh0bmFtZShmaWxlc1tjdXJyZW50SW5kZXhdKSAhPT0gaW5fcHJvZ3Jlc3MpIHtcblx0XHRcdFx0Y29uc3VtZU1lc3NhZ2UoZmlsZXNbY3VycmVudEluZGV4XSwgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCAoZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0aXRlcmF0ZUFuZENvbnN1bWUoZmlsZXMsICsrY3VycmVudEluZGV4KTtcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y29uc3VtZXIobnVsbCwgZGF0YSwgcGF0aC5iYXNlbmFtZShmaWxlc1tjdXJyZW50SW5kZXhdKSk7XG5cdFx0XHRcdFx0aWYgKHNob3VsZFdhaXRGb3JNb3JlKCkpIHtcblx0XHRcdFx0XHRcdGl0ZXJhdGVBbmRDb25zdW1lKGZpbGVzLCArK2N1cnJlbnRJbmRleCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGl0ZXJhdGVBbmRDb25zdW1lKGZpbGVzLCArK2N1cnJlbnRJbmRleCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gd3JpdGVGaWxlKGZpbGVuYW1lLCBjb250ZW50LCBjYWxsYmFjayl7XG5cdFx0aWYocmVjaXBpZW50KXtcblx0XHRcdHZhciBlbnZlbG9wZSA9IGJ1aWxkRW52ZWxvcGUoZmlsZW5hbWUsIGNvbnRlbnQpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhcIlNlbmRpbmcgdG9cIiwgcmVjaXBpZW50LnBpZCwgcmVjaXBpZW50LnBwaWQsIFwiZW52ZWxvcGVcIiwgZW52ZWxvcGUpO1xuXHRcdFx0cmVjaXBpZW50LnNlbmQoZW52ZWxvcGUpO1xuXHRcdFx0dmFyIGNvbmZpcm1hdGlvblJlY2VpdmVkID0gZmFsc2U7XG5cblx0XHRcdGZ1bmN0aW9uIHJlY2VpdmVDb25maXJtYXRpb24obWVzc2FnZSl7XG5cdFx0XHRcdGlmKG1lc3NhZ2UgPT09IGJ1aWxkRW52ZWxvcGVDb25maXJtYXRpb24oZW52ZWxvcGUpKXtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiUmVjZWl2ZWQgY29uZmlybWF0aW9uXCIsIHJlY2lwaWVudC5waWQpO1xuXHRcdFx0XHRcdGNvbmZpcm1hdGlvblJlY2VpdmVkID0gdHJ1ZTtcblx0XHRcdFx0XHR0cnl7XG5cdFx0XHRcdFx0XHRyZWNpcGllbnQub2ZmKFwibWVzc2FnZVwiLCByZWNlaXZlQ29uZmlybWF0aW9uKTtcblx0XHRcdFx0XHR9Y2F0Y2goZXJyKXtcblx0XHRcdFx0XHRcdC8vLi4uXG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmVjaXBpZW50Lm9uKFwibWVzc2FnZVwiLCByZWNlaXZlQ29uZmlybWF0aW9uKTtcblxuXHRcdFx0c2V0VGltZW91dCgoKT0+e1xuXHRcdFx0XHRpZighY29uZmlybWF0aW9uUmVjZWl2ZWQpe1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coXCJObyBjb25maXJtYXRpb24uLi5cIiwgcHJvY2Vzcy5waWQpO1xuXHRcdFx0XHRcdGhpZGRlbl93cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIGNhbGxiYWNrKTtcblx0XHRcdFx0fWVsc2V7XG5cdFx0XHRcdFx0aWYoY2FsbGJhY2spe1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIGNvbnRlbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSwgMjAwKTtcblx0XHR9ZWxzZXtcblx0XHRcdGhpZGRlbl93cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIGNhbGxiYWNrKTtcblx0XHR9XG5cdH1cblxuXHRjb25zdCBpbl9wcm9ncmVzcyA9IFwiLmluX3Byb2dyZXNzXCI7XG5cdGZ1bmN0aW9uIGhpZGRlbl93cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnQsIGNhbGxiYWNrKXtcblx0XHR2YXIgdG1wRmlsZW5hbWUgPSBmaWxlbmFtZStpbl9wcm9ncmVzcztcblx0XHR0cnl7XG5cdFx0XHRpZihmcy5leGlzdHNTeW5jKHRtcEZpbGVuYW1lKSB8fCBmcy5leGlzdHNTeW5jKGZpbGVuYW1lKSl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKG5ldyBFcnJvcihgT3ZlcndyaXRpbmcgZmlsZSAke2ZpbGVuYW1lfWApKTtcblx0XHRcdH1cblx0XHRcdGZzLndyaXRlRmlsZVN5bmModG1wRmlsZW5hbWUsIGNvbnRlbnQpO1xuXHRcdFx0ZnMucmVuYW1lU3luYyh0bXBGaWxlbmFtZSwgZmlsZW5hbWUpO1xuXHRcdH1jYXRjaChlcnIpe1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0fVxuXHRcdGNhbGxiYWNrKG51bGwsIGNvbnRlbnQpO1xuXHR9XG5cblx0dmFyIGFscmVhZHlLbm93bkNoYW5nZXMgPSB7fTtcblxuXHRmdW5jdGlvbiBhbHJlYWR5RmlyZWRDaGFuZ2VzKGZpbGVuYW1lLCBjaGFuZ2Upe1xuXHRcdHZhciByZXMgPSBmYWxzZTtcblx0XHRpZihhbHJlYWR5S25vd25DaGFuZ2VzW2ZpbGVuYW1lXSl7XG5cdFx0XHRyZXMgPSB0cnVlO1xuXHRcdH1lbHNle1xuXHRcdFx0YWxyZWFkeUtub3duQ2hhbmdlc1tmaWxlbmFtZV0gPSBjaGFuZ2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlcztcblx0fVxuXG5cdGZ1bmN0aW9uIHdhdGNoRm9sZGVyKHNob3VsZERlbGV0ZUFmdGVyUmVhZCwgc2hvdWxkV2FpdEZvck1vcmUpe1xuXG5cdFx0c2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0ZnMucmVhZGRpcihmb2xkZXIsICd1dGY4JywgZnVuY3Rpb24gKGVyciwgZmlsZXMpIHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdCQkLmVycm9ySGFuZGxlci5lcnJvcihlcnIpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvcih2YXIgaT0wOyBpPGZpbGVzLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0XHR3YXRjaEZpbGVzSGFuZGxlcihcImNoYW5nZVwiLCBmaWxlc1tpXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0sIDEwMDApO1xuXG5cdFx0ZnVuY3Rpb24gd2F0Y2hGaWxlc0hhbmRsZXIoZXZlbnRUeXBlLCBmaWxlbmFtZSl7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGBHb3QgJHtldmVudFR5cGV9IG9uICR7ZmlsZW5hbWV9YCk7XG5cblx0XHRcdGlmKCFmaWxlbmFtZSB8fCBwYXRoLmV4dG5hbWUoZmlsZW5hbWUpID09PSBpbl9wcm9ncmVzcyl7XG5cdFx0XHRcdC8vY2F1Z2h0IGEgZGVsZXRlIGV2ZW50IG9mIGEgZmlsZVxuXHRcdFx0XHQvL29yXG5cdFx0XHRcdC8vZmlsZSBub3QgcmVhZHkgdG8gYmUgY29uc3VtZWQgKGluIHByb2dyZXNzKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdHZhciBmID0gYnVpbGRQYXRoRm9yRmlsZShmaWxlbmFtZSk7XG5cdFx0XHRpZighZnMuZXhpc3RzU3luYyhmKSl7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJGaWxlIG5vdCBmb3VuZFwiLCBmKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGBQcmVwYXJpbmcgdG8gY29uc3VtZSAke2ZpbGVuYW1lfWApO1xuXHRcdFx0aWYoIWFscmVhZHlGaXJlZENoYW5nZXMoZmlsZW5hbWUsIGV2ZW50VHlwZSkpe1xuXHRcdFx0XHRjb25zdW1lTWVzc2FnZShmaWxlbmFtZSwgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkLCAoZXJyLCBkYXRhKSA9PiB7XG5cdFx0XHRcdFx0Ly9hbGxvdyBhIHJlYWQgYSB0aGUgZmlsZVxuXHRcdFx0XHRcdGFscmVhZHlLbm93bkNoYW5nZXNbZmlsZW5hbWVdID0gdW5kZWZpbmVkO1xuXG5cdFx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdFx0Ly8gPz9cblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiXFxuQ2F1Z2h0IGFuIGVycm9yXCIsIGVycik7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc3VtZXIobnVsbCwgZGF0YSwgZmlsZW5hbWUpO1xuXG5cblx0XHRcdFx0XHRpZiAoIXNob3VsZFdhaXRGb3JNb3JlKCkpIHtcblx0XHRcdFx0XHRcdHdhdGNoZXIuY2xvc2UoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIGhhcHBlbnMuLi5cIiwgZmlsZW5hbWUpO1xuXHRcdFx0fVxuXHRcdH1cblxuXG5cdFx0Y29uc3Qgd2F0Y2hlciA9IGZzLndhdGNoKGZvbGRlciwgd2F0Y2hGaWxlc0hhbmRsZXIpO1xuXG5cdFx0Y29uc3QgaW50ZXJ2YWxUaW1lciA9IHNldEludGVydmFsKCgpPT57XG5cdFx0XHRmcy5yZWFkZGlyKGZvbGRlciwgJ3V0ZjgnLCBmdW5jdGlvbiAoZXJyLCBmaWxlcykge1xuXHRcdFx0XHRpZiAoZXJyKSB7XG5cdFx0XHRcdFx0JCQuZXJyb3JIYW5kbGVyLmVycm9yKGVycik7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoZmlsZXMubGVuZ3RoID4gMCl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coYFxcblxcbkZvdW5kICR7ZmlsZXMubGVuZ3RofSBmaWxlcyBub3QgY29uc3VtZWQgeWV0IGluICR7Zm9sZGVyfWAsIG5ldyBEYXRlKCkuZ2V0VGltZSgpLFwiXFxuXFxuXCIpO1xuXHRcdFx0XHRcdC8vZmFraW5nIGEgcmVuYW1lIGV2ZW50IHRyaWdnZXJcblx0XHRcdFx0XHR3YXRjaEZpbGVzSGFuZGxlcihcInJlbmFtZVwiLCBmaWxlc1swXSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH0sIDUwMDApO1xuXHR9XG59XG5cbmV4cG9ydHMuZ2V0Rm9sZGVyUXVldWUgPSBmdW5jdGlvbihmb2xkZXIsIGNhbGxiYWNrKXtcblx0cmV0dXJuIG5ldyBGb2xkZXJNUShmb2xkZXIsIGNhbGxiYWNrKTtcbn07XG4iLCJmdW5jdGlvbiBNZW1vcnlNUUludGVyYWN0aW9uU3BhY2UoKSB7XG4gICAgdmFyIHN3YXJtSW50ZXJhY3QgPSByZXF1aXJlKFwiLi8uLi9zd2FybUludGVyYWN0aW9uXCIpO1xuICAgIHZhciBzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnMgPSB7fTtcblxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoaW5nU3dhcm1zKHN3YXJtKXtcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgc3Vic0xpc3QgPSBzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnNbc3dhcm0ubWV0YS5zd2FybUlkXTtcbiAgICAgICAgICAgIGlmKHN1YnNMaXN0KXtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGk9MDsgaTxzdWJzTGlzdC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBoYW5kbGVyID0gc3Vic0xpc3RbaV07XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIobnVsbCwgc3dhcm0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMSk7XG4gICAgfVxuXG4gICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gaW5pdCgpe1xuXHRcdGlmKCFpbml0aWFsaXplZCl7XG5cdFx0XHRpbml0aWFsaXplZCA9IHRydWU7XG5cdFx0XHQkJC5QU0tfUHViU3ViLnN1YnNjcmliZSgkJC5DT05TVEFOVFMuU1dBUk1fRk9SX0VYRUNVVElPTiwgZGlzcGF0Y2hpbmdTd2FybXMpO1xuXHRcdH1cbiAgICB9XG5cbiAgICB2YXIgY29tbSA9IHtcbiAgICAgICAgc3RhcnRTd2FybTogZnVuY3Rpb24gKHN3YXJtTmFtZSwgY3RvciwgYXJncykge1xuXHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgcmV0dXJuICQkLnN3YXJtLnN0YXJ0KHN3YXJtTmFtZSwgY3RvciwgLi4uYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRpbnVlU3dhcm06IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIHN3YXJtU2VyaWFsaXNhdGlvbiwgY3RvciwgYXJncykge1xuXHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgc3dhcm1IYW5kbGVyW2N0b3JdLmFwcGx5KHN3YXJtSGFuZGxlciwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBjYWxsYmFjaykge1xuXHRcdFx0aW5pdCgpO1xuICAgICAgICAgICAgaWYoIXN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIuZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZF0pe1xuXHRcdFx0XHRzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnNbc3dhcm1IYW5kbGVyLmdldElubmVyVmFsdWUoKS5tZXRhLnN3YXJtSWRdID0gWyBjYWxsYmFjayBdO1xuICAgICAgICAgICAgfWVsc2V7XG5cdFx0XHRcdHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIuZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZF0ucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKHN3YXJtSGFuZGxlcikge1xuXHRcdFx0aWYoc3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5nZXRJbm5lclZhbHVlKCkubWV0YS5zd2FybUlkXSl7XG5cdFx0XHRcdHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIuZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZF0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gc3dhcm1JbnRlcmFjdC5uZXdJbnRlcmFjdGlvblNwYWNlKGNvbW0pO1xuXG59XG5cbnZhciBzcGFjZTtcbm1vZHVsZS5leHBvcnRzLmNyZWF0ZUludGVyYWN0aW9uU3BhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYoIXNwYWNlKXtcbiAgICAgICAgc3BhY2UgPSBuZXcgTWVtb3J5TVFJbnRlcmFjdGlvblNwYWNlKCk7XG4gICAgfWVsc2V7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTWVtb3J5TVFJbnRlcmFjdGlvblNwYWNlIGFscmVhZHkgY3JlYXRlZCEgVXNpbmcgc2FtZSBpbnN0YW5jZS5cIik7XG4gICAgfVxuICAgIHJldHVybiBzcGFjZTtcbn07IiwiZnVuY3Rpb24gV2luZG93TVFJbnRlcmFjdGlvblNwYWNlKGNoYW5uZWxOYW1lLCBjb21tdW5pY2F0aW9uV2luZG93LCBzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCl7XG4gICAgdmFyIHN3YXJtSW50ZXJhY3QgPSByZXF1aXJlKFwiLi8uLi9zd2FybUludGVyYWN0aW9uXCIpO1xuICAgIHZhciBjaGlsZE1lc3NhZ2VNUSA9IHJlcXVpcmUoXCIuL3NwZWNpZmljTVFJbXBsL0NoaWxkV2ViVmlld01RXCIpLmNyZWF0ZU1RKGNoYW5uZWxOYW1lLCBjb21tdW5pY2F0aW9uV2luZG93LCBzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCk7XG4gICAgdmFyIHN3YXJtSW5zdGFuY2VzID0ge307XG5cbiAgICB2YXIgY29tbSA9IHtcbiAgICAgICAgc3RhcnRTd2FybTogZnVuY3Rpb24gKHN3YXJtTmFtZSwgY3RvciwgYXJncykge1xuICAgICAgICAgICAgdmFyIHN3YXJtID0ge21ldGE6e1xuICAgICAgICAgICAgICAgICAgICBzd2FybVR5cGVOYW1lOnN3YXJtTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgY3RvcjpjdG9yLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOmFyZ3NcbiAgICAgICAgICAgICAgICB9fTtcbiAgICAgICAgICAgIGNoaWxkTWVzc2FnZU1RLnByb2R1Y2Uoc3dhcm0pO1xuICAgICAgICAgICAgcmV0dXJuIHN3YXJtO1xuICAgICAgICB9LFxuICAgICAgICBjb250aW51ZVN3YXJtOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBzd2FybVNlcmlhbGlzYXRpb24sIHBoYXNlTmFtZSwgYXJncykge1xuXG4gICAgICAgICAgICB2YXIgbmV3U2VyaWFsaXphdGlvbiA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoc3dhcm1TZXJpYWxpc2F0aW9uKSk7XG4gICAgICAgICAgICBuZXdTZXJpYWxpemF0aW9uLm1ldGEuY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG5ld1NlcmlhbGl6YXRpb24ubWV0YS5waGFzZU5hbWUgPSBwaGFzZU5hbWU7XG4gICAgICAgICAgICBuZXdTZXJpYWxpemF0aW9uLm1ldGEudGFyZ2V0ID0gXCJpZnJhbWVcIjtcbiAgICAgICAgICAgIG5ld1NlcmlhbGl6YXRpb24ubWV0YS5hcmdzID0gYXJncztcbiAgICAgICAgICAgIGNoaWxkTWVzc2FnZU1RLnByb2R1Y2UobmV3U2VyaWFsaXphdGlvbik7XG4gICAgICAgIH0sXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2hpbGRNZXNzYWdlTVEucmVnaXN0ZXJDb25zdW1lcihjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKHN3YXJtSGFuZGxlcikge1xuXG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICB2YXIgc3BhY2UgPSBzd2FybUludGVyYWN0Lm5ld0ludGVyYWN0aW9uU3BhY2UoY29tbSk7XG4gICAgdGhpcy5zdGFydFN3YXJtID0gZnVuY3Rpb24gKG5hbWUsIGN0b3IsIC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHNwYWNlLnN0YXJ0U3dhcm0obmFtZSwgY3RvciwgLi4uYXJncyk7XG4gICAgfTtcblxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBjaGlsZE1lc3NhZ2VNUS5yZWdpc3RlckNvbnN1bWVyKGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIHN3YXJtO1xuICAgICAgICAgICAgICAgIGlmKGRhdGEgJiYgZGF0YS5tZXRhICYmIGRhdGEubWV0YS5zd2FybUlkICYmIHN3YXJtSW5zdGFuY2VzW2RhdGEubWV0YS5zd2FybUlkXSl7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtID0gc3dhcm1JbnN0YW5jZXNbZGF0YS5tZXRhLnN3YXJtSWRdO1xuICAgICAgICAgICAgICAgICAgICBzd2FybS51cGRhdGUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtW2RhdGEubWV0YS5waGFzZU5hbWVdLmFwcGx5KHN3YXJtLCBkYXRhLm1ldGEuYXJncyk7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dhcm0gPSAkJC5zd2FybS5zdGFydChkYXRhLm1ldGEuc3dhcm1UeXBlTmFtZSwgZGF0YS5tZXRhLmN0b3IsIC4uLmRhdGEubWV0YS5hcmdzKTtcblxuICAgICAgICAgICAgICAgICAgICBzd2FybUluc3RhbmNlc1tzd2FybS5nZXRJbm5lclZhbHVlKCkubWV0YS5zd2FybUlkXSA9IHN3YXJtO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3YXJtLm9uUmV0dXJuKGZ1bmN0aW9uKGRhdGEpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTd2FybSBpcyBmaW5pc2hlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCByZWFkeUV2dCA9IHt3ZWJWaWV3SXNSZWFkeTogdHJ1ZX07XG4gICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZShKU09OLnN0cmluZ2lmeShyZWFkeUV2dCksIFwiKlwiKTtcblxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVyKG1lc3NhZ2Upe1xuICAgICAgICBsb2coXCJzZW5kaW5nIHN3YXJtIFwiLCBtZXNzYWdlKTtcbiAgICAgICAgY2hpbGRNZXNzYWdlTVEucHJvZHVjZShtZXNzYWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbnRlcmFjdGlvbnMobWVzc2FnZSl7XG4gICAgICAgIGxvZyhcImNoZWNraW5nIGlmIG1lc3NhZ2UgaXMgJ2ludGVyYWN0aW9uJyBcIiwgbWVzc2FnZSk7XG4gICAgICAgIHJldHVybiBtZXNzYWdlICYmIG1lc3NhZ2UubWV0YSAmJiBtZXNzYWdlLm1ldGEudGFyZ2V0ICYmIG1lc3NhZ2UubWV0YS50YXJnZXQgPT09IFwiaW50ZXJhY3Rpb25cIjtcbiAgICB9XG4gICAgLy9UT0RPIGZpeCB0aGlzIGZvciBuYXRpdmVXZWJWaWV3XG5cbiAgICAkJC5QU0tfUHViU3ViLnN1YnNjcmliZSgkJC5DT05TVEFOVFMuU1dBUk1fRk9SX0VYRUNVVElPTiwgaGFuZGxlciwgZnVuY3Rpb24oKXtyZXR1cm4gdHJ1ZTt9LCBmaWx0ZXJJbnRlcmFjdGlvbnMpO1xuXG4gICAgbG9nKFwicmVnaXN0ZXJpbmcgbGlzdGVuZXIgZm9yIGhhbmRsaW5nIGludGVyYWN0aW9uc1wiKTtcblxuICAgIGZ1bmN0aW9uIGxvZyguLi5hcmdzKXtcbiAgICAgICAgYXJncy51bnNoaWZ0KFwiW1dpbmRvd01RSW50ZXJhY3Rpb25TcGFjZVwiKyh3aW5kb3cuZnJhbWVFbGVtZW50ID8gXCIqXCI6IFwiXCIpK1wiXVwiICk7XG4gICAgICAgIC8vY29uc29sZS5sb2cuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVJbnRlcmFjdGlvblNwYWNlID0gZnVuY3Rpb24oY2hhbm5lbE5hbWUsIGNvbW11bmljYXRpb25XaW5kb3csIHNlY29uZENvbW11bmljYXRpb25DaGFubmVsKXtcbiAgICByZXR1cm4gbmV3IFdpbmRvd01RSW50ZXJhY3Rpb25TcGFjZShjaGFubmVsTmFtZSwgY29tbXVuaWNhdGlvbldpbmRvdywgc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwpO1xufTsiLCIvKlRPRE9cbkZvciB0aGUgbW9tZW50IEkgZG9uJ3Qgc2VlIGFueSBwcm9ibGVtcyBpZiBpdCdzIG5vdCBjcnlwdG9ncmFwaGljIHNhZmUuXG5UaGlzIHZlcnNpb24ga2VlcHMgIGNvbXBhdGliaWxpdHkgd2l0aCBtb2JpbGUgYnJvd3NlcnMvd2Vidmlld3MuXG4gKi9cbmZ1bmN0aW9uIHV1aWR2NCgpIHtcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIFdpbmRvd01RSW50ZXJhY3Rpb25TcGFjZShjaGFubmVsTmFtZSwgY29tbXVuaWNhdGlvbldpbmRvdykge1xuICAgIHZhciBzd2FybUludGVyYWN0ID0gcmVxdWlyZShcIi4vLi4vc3dhcm1JbnRlcmFjdGlvblwiKTtcbiAgICB2YXIgY2hpbGRNZXNzYWdlTVEgPSByZXF1aXJlKFwiLi9zcGVjaWZpY01RSW1wbC9DaGlsZFduZE1RXCIpLmNyZWF0ZU1RKGNoYW5uZWxOYW1lLCBjb21tdW5pY2F0aW9uV2luZG93KTtcbiAgICB2YXIgc3dhcm1JbnN0YW5jZXMgPSB7fTtcblxuICAgIHZhciBjb21tID0ge1xuICAgICAgICBzdGFydFN3YXJtOiBmdW5jdGlvbiAoc3dhcm1OYW1lLCBjdG9yLCBhcmdzKSB7XG5cbiAgICAgICAgICAgIHZhciB1bmlxdWVJZCA9IHV1aWR2NCgpO1xuICAgICAgICAgICAgdmFyIHN3YXJtID0ge1xuICAgICAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgICAgICAgc3dhcm1UeXBlTmFtZTogc3dhcm1OYW1lLFxuICAgICAgICAgICAgICAgICAgICBjdG9yOiBjdG9yLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBhcmdzLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWQ6IHVuaXF1ZUlkLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjaGlsZE1lc3NhZ2VNUS5wcm9kdWNlKHN3YXJtKTtcbiAgICAgICAgICAgIHJldHVybiBzd2FybTtcbiAgICAgICAgfSxcbiAgICAgICAgY29udGludWVTd2FybTogZnVuY3Rpb24gKHN3YXJtSGFuZGxlciwgc3dhcm1TZXJpYWxpc2F0aW9uLCBwaGFzZU5hbWUsIGFyZ3MpIHtcblxuICAgICAgICAgICAgdmFyIG5ld1NlcmlhbGl6YXRpb24gPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN3YXJtU2VyaWFsaXNhdGlvbikpO1xuICAgICAgICAgICAgbmV3U2VyaWFsaXphdGlvbi5tZXRhLmN0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBuZXdTZXJpYWxpemF0aW9uLm1ldGEucGhhc2VOYW1lID0gcGhhc2VOYW1lO1xuICAgICAgICAgICAgbmV3U2VyaWFsaXphdGlvbi5tZXRhLnRhcmdldCA9IFwiaWZyYW1lXCI7XG4gICAgICAgICAgICBuZXdTZXJpYWxpemF0aW9uLm1ldGEuYXJncyA9IGFyZ3M7XG4gICAgICAgICAgICBjaGlsZE1lc3NhZ2VNUS5wcm9kdWNlKG5ld1NlcmlhbGl6YXRpb24pO1xuICAgICAgICB9LFxuICAgICAgICBvbjogZnVuY3Rpb24gKHN3YXJtSGFuZGxlciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNoaWxkTWVzc2FnZU1RLnJlZ2lzdGVyQ2FsbGJhY2soc3dhcm1IYW5kbGVyLm1ldGEucmVxdWVzdElkLCBjYWxsYmFjayk7XG4gICAgICAgIH0sXG4gICAgICAgIG9mZjogZnVuY3Rpb24gKHN3YXJtSGFuZGxlcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJGdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQhXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdmFyIHNwYWNlID0gc3dhcm1JbnRlcmFjdC5uZXdJbnRlcmFjdGlvblNwYWNlKGNvbW0pO1xuICAgIHRoaXMuc3RhcnRTd2FybSA9IGZ1bmN0aW9uIChuYW1lLCBjdG9yLCAuLi5hcmdzKSB7XG4gICAgICAgIHJldHVybiBzcGFjZS5zdGFydFN3YXJtKG5hbWUsIGN0b3IsIC4uLmFyZ3MpO1xuICAgIH07XG5cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgY2hpbGRNZXNzYWdlTVEucmVnaXN0ZXJDb25zdW1lcihmdW5jdGlvbiAoZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBzd2FybTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLm1ldGEgJiYgZGF0YS5tZXRhLnN3YXJtSWQgJiYgc3dhcm1JbnN0YW5jZXNbZGF0YS5tZXRhLnN3YXJtSWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtID0gc3dhcm1JbnN0YW5jZXNbZGF0YS5tZXRhLnN3YXJtSWRdO1xuICAgICAgICAgICAgICAgICAgICBzd2FybS51cGRhdGUoZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHN3YXJtW2RhdGEubWV0YS5waGFzZU5hbWVdLmFwcGx5KHN3YXJtLCBkYXRhLm1ldGEuYXJncyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICBzd2FybSA9ICQkLnN3YXJtLnN0YXJ0KGRhdGEubWV0YS5zd2FybVR5cGVOYW1lLCBkYXRhLm1ldGEuY3RvciwgLi4uZGF0YS5tZXRhLmFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICBzd2FybS5zZXRNZXRhZGF0YShcInJlcXVlc3RJZFwiLCBkYXRhLm1ldGEucmVxdWVzdElkKTtcbiAgICAgICAgICAgICAgICAgICAgc3dhcm1JbnN0YW5jZXNbc3dhcm0uZ2V0SW5uZXJWYWx1ZSgpLm1ldGEuc3dhcm1JZF0gPSBzd2FybTtcblxuICAgICAgICAgICAgICAgICAgICBzd2FybS5vblJldHVybihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJTd2FybSBpcyBmaW5pc2hlZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBwYXJlbnQucG9zdE1lc3NhZ2Uoe3dlYlZpZXdJc1JlYWR5OiB0cnVlfSwgXCIqXCIpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBoYW5kbGVyKG1lc3NhZ2UpIHtcbiAgICAgICAgbG9nKFwic2VuZGluZyBzd2FybSBcIiwgbWVzc2FnZSk7XG4gICAgICAgIGNoaWxkTWVzc2FnZU1RLnByb2R1Y2UobWVzc2FnZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW50ZXJhY3Rpb25zKG1lc3NhZ2UpIHtcbiAgICAgICAgbG9nKFwiY2hlY2tpbmcgaWYgbWVzc2FnZSBpcyAnaW50ZXJhY3Rpb24nIFwiLCBtZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2UgJiYgbWVzc2FnZS5tZXRhICYmIG1lc3NhZ2UubWV0YS50YXJnZXQgJiYgbWVzc2FnZS5tZXRhLnRhcmdldCA9PT0gXCJpbnRlcmFjdGlvblwiO1xuICAgIH1cblxuICAgICQkLlBTS19QdWJTdWIuc3Vic2NyaWJlKCQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OLCBoYW5kbGVyLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sIGZpbHRlckludGVyYWN0aW9ucyk7XG4gICAgbG9nKFwicmVnaXN0ZXJpbmcgbGlzdGVuZXIgZm9yIGhhbmRsaW5nIGludGVyYWN0aW9uc1wiKTtcblxuICAgIGZ1bmN0aW9uIGxvZyguLi5hcmdzKSB7XG4gICAgICAgIGFyZ3MudW5zaGlmdChcIltXaW5kb3dNUUludGVyYWN0aW9uU3BhY2VcIiArICh3aW5kb3cuZnJhbWVFbGVtZW50ID8gXCIqXCIgOiBcIlwiKSArIFwiXVwiKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZUludGVyYWN0aW9uU3BhY2UgPSBmdW5jdGlvbiAoY2hhbm5lbE5hbWUsIGNvbW11bmljYXRpb25XaW5kb3cpIHtcbiAgICByZXR1cm4gbmV3IFdpbmRvd01RSW50ZXJhY3Rpb25TcGFjZShjaGFubmVsTmFtZSwgY29tbXVuaWNhdGlvbldpbmRvdyk7XG59O1xuIiwidmFyIE93TSA9IHJlcXVpcmUoXCJzd2FybXV0aWxzXCIpLk93TTtcbnZhciBzd2FybUludGVyYWN0ID0gcmVxdWlyZShcIi4vLi4vc3dhcm1JbnRlcmFjdGlvblwiKTtcbnZhciBmb2xkZXJNUSA9IHJlcXVpcmUoXCJmb2xkZXJtcVwiKTtcblxuZnVuY3Rpb24gRm9sZGVyTVFJbnRlcmFjdGlvblNwYWNlKGFnZW50LCB0YXJnZXRGb2xkZXIsIHJldHVybkZvbGRlcikge1xuICAgIHZhciBzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnMgPSB7fTtcbiAgICB2YXIgcXVldWVIYW5kbGVyID0gbnVsbDtcbiAgICB2YXIgcmVzcG9uc2VRdWV1ZSA9IG51bGw7XG5cbiAgICB2YXIgcXVldWUgPSBmb2xkZXJNUS5jcmVhdGVRdWUodGFyZ2V0Rm9sZGVyLCAoZXJyICwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGlmKGVycil7XG4gICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlU3dhcm1QYWNrKHN3YXJtTmFtZSwgcGhhc2VOYW1lLCAuLi5hcmdzKXtcbiAgICAgICAgdmFyIHN3YXJtID0gbmV3IE93TSgpO1xuXG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJzd2FybUlkXCIsICQkLnVpZEdlbmVyYXRvci5zYWZlX3V1aWQoKSk7XG5cbiAgICAgICAgc3dhcm0uc2V0TWV0YShcInJlcXVlc3RJZFwiLCBzd2FybS5nZXRNZXRhKFwic3dhcm1JZFwiKSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJzd2FybVR5cGVOYW1lXCIsIHN3YXJtTmFtZSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJwaGFzZU5hbWVcIiwgcGhhc2VOYW1lKTtcbiAgICAgICAgc3dhcm0uc2V0TWV0YShcImFyZ3NcIiwgYXJncyk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJjb21tYW5kXCIsIFwiZXhlY3V0ZVN3YXJtUGhhc2VcIik7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJ0YXJnZXRcIiwgYWdlbnQpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiLCByZXR1cm5Gb2xkZXIpO1xuXG4gICAgICAgIHJldHVybiBzd2FybTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwYXRjaGluZ1N3YXJtcyhlcnIsIHN3YXJtKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuXHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBzdWJzTGlzdCA9IHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybS5tZXRhLnN3YXJtSWRdO1xuICAgICAgICAgICAgaWYoc3Vic0xpc3Qpe1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPHN1YnNMaXN0Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGhhbmRsZXIgPSBzdWJzTGlzdFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlcihudWxsLCBzd2FybSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbml0KCl7XG4gICAgICAgIGlmKCFxdWV1ZUhhbmRsZXIpe1xuICAgICAgICAgICAgcXVldWVIYW5kbGVyID0gcXVldWUuZ2V0SGFuZGxlcigpO1xuICAgICAgICB9XG4gICAgfVxuXHRcblx0aW5pdCgpO1xuXG4gICAgZnVuY3Rpb24gcHJlcGFyZVRvQ29uc3VtZSgpe1xuICAgICAgICBpZighcmVzcG9uc2VRdWV1ZSl7XG4gICAgICAgICAgICByZXNwb25zZVF1ZXVlID0gZm9sZGVyTVEuY3JlYXRlUXVlKHJldHVybkZvbGRlcik7XG4gICAgICAgICAgICByZXNwb25zZVF1ZXVlLnJlZ2lzdGVyQ29uc3VtZXIoZGlzcGF0Y2hpbmdTd2FybXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNvbW11bmljYXRpb24gPSB7XG4gICAgICAgIHN0YXJ0U3dhcm06IGZ1bmN0aW9uIChzd2FybU5hbWUsIGN0b3IsIGFyZ3MpIHtcbiAgICAgICAgICAgIHByZXBhcmVUb0NvbnN1bWUoKTtcbiAgICAgICAgICAgIHZhciBzd2FybSA9IGNyZWF0ZVN3YXJtUGFjayhzd2FybU5hbWUsIGN0b3IsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgcXVldWVIYW5kbGVyLnNlbmRTd2FybUZvckV4ZWN1dGlvbihzd2FybSk7XG4gICAgICAgICAgICByZXR1cm4gc3dhcm07XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRpbnVlU3dhcm06IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIHN3YXJtU2VyaWFsaXNhdGlvbiwgY3RvciwgLi4uYXJncykge1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHN3YXJtSGFuZGxlci51cGRhdGUoc3dhcm1TZXJpYWxpc2F0aW9uKTtcbiAgICAgICAgICAgICAgICBzd2FybUhhbmRsZXJbY3Rvcl0uYXBwbHkoc3dhcm1IYW5kbGVyLCBhcmdzKTtcbiAgICAgICAgICAgIH1jYXRjaChlcnIpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgcHJlcGFyZVRvQ29uc3VtZSgpO1xuXG4gICAgICAgICAgICBpZighc3dhcm1IYW5kbGVyc1N1YnNjcmliZXJzW3N3YXJtSGFuZGxlci5tZXRhLnN3YXJtSWRdKXtcbiAgICAgICAgICAgICAgICBzd2FybUhhbmRsZXJzU3Vic2NyaWJlcnNbc3dhcm1IYW5kbGVyLm1ldGEuc3dhcm1JZF0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIubWV0YS5zd2FybUlkXS5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgICB9LFxuICAgICAgICBvZmY6IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIpIHtcbiAgICAgICAgICAgIHN3YXJtSGFuZGxlcnNTdWJzY3JpYmVyc1tzd2FybUhhbmRsZXIubWV0YS5zd2FybUlkXSA9IFtdO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBzd2FybUludGVyYWN0Lm5ld0ludGVyYWN0aW9uU3BhY2UoY29tbXVuaWNhdGlvbik7XG59XG5cbnZhciBzcGFjZXMgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSA9IGZ1bmN0aW9uIChhZ2VudCwgdGFyZ2V0Rm9sZGVyLCByZXR1cm5Gb2xkZXIpIHtcbiAgICB2YXIgaW5kZXggPSB0YXJnZXRGb2xkZXIrcmV0dXJuRm9sZGVyO1xuICAgIGlmKCFzcGFjZXNbaW5kZXhdKXtcbiAgICAgICAgc3BhY2VzW2luZGV4XSA9IG5ldyBGb2xkZXJNUUludGVyYWN0aW9uU3BhY2UoYWdlbnQsIHRhcmdldEZvbGRlciwgcmV0dXJuRm9sZGVyKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgY29uc29sZS5sb2coYEZvbGRlck1RIGludGVyYWN0aW9uIHNwYWNlIGJhc2VkIG9uIFske3RhcmdldEZvbGRlcn0sICR7cmV0dXJuRm9sZGVyfV0gYWxyZWFkeSBleGlzdHMhYCk7XG4gICAgfVxuICAgIHJldHVybiBzcGFjZXNbaW5kZXhdO1xufTsiLCJyZXF1aXJlKCdwc2staHR0cC1jbGllbnQnKTtcblxuZnVuY3Rpb24gSFRUUEludGVyYWN0aW9uU3BhY2UoYWxpYXMsIHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgY3J5cHRvSW5mbykge1xuICAgIGNvbnN0IHN3YXJtSW50ZXJhY3QgPSByZXF1aXJlKFwiLi8uLi9zd2FybUludGVyYWN0aW9uXCIpO1xuXG4gICAgbGV0IGluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gaW5pdCgpe1xuICAgICAgICBpZighaW5pdGlhbGl6ZWQpe1xuICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgICAgJCQucmVtb3RlLmNyZWF0ZVJlcXVlc3RNYW5hZ2VyKCk7XG4gICAgICAgICAgICAkJC5yZW1vdGUubmV3RW5kUG9pbnQoYWxpYXMsIHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgY3J5cHRvSW5mbyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb21tID0ge1xuICAgICAgICBzdGFydFN3YXJtOiBmdW5jdGlvbiAoc3dhcm1OYW1lLCBjdG9yLCBhcmdzKSB7XG4gICAgICAgICAgICBpbml0KCk7XG4gICAgICAgICAgICByZXR1cm4gJCQucmVtb3RlW2FsaWFzXS5zdGFydFN3YXJtKHN3YXJtTmFtZSwgY3RvciwgLi4uYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnRpbnVlU3dhcm06IGZ1bmN0aW9uIChzd2FybUhhbmRsZXIsIHN3YXJtU2VyaWFsaXNhdGlvbiwgY3RvciwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuICQkLnJlbW90ZVthbGlhc10uY29udGludWVTd2FybShzd2FybVNlcmlhbGlzYXRpb24sIGN0b3IsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBvbjogZnVuY3Rpb24gKHN3YXJtSGFuZGxlciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHN3YXJtSGFuZGxlci5vbignKicsIGNhbGxiYWNrKTtcbiAgICAgICAgfSxcbiAgICAgICAgb2ZmOiBmdW5jdGlvbiAoc3dhcm1IYW5kbGVyKSB7XG4gICAgICAgICAgICBzd2FybUhhbmRsZXIub2ZmKCcqJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHN3YXJtSW50ZXJhY3QubmV3SW50ZXJhY3Rpb25TcGFjZShjb21tKTtcbn1cblxubW9kdWxlLmV4cG9ydHMuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSA9IGZ1bmN0aW9uIChhbGlhcywgcmVtb3RlRW5kUG9pbnQsIGFnZW50VWlkLCBjcnlwdG9JbmZvKSB7XG4gICAgLy9zaW5nbGV0b25cbiAgICByZXR1cm4gbmV3IEhUVFBJbnRlcmFjdGlvblNwYWNlKGFsaWFzLCByZW1vdGVFbmRQb2ludCwgYWdlbnRVaWQsIGNyeXB0b0luZm8pO1xufTsiLCJ2YXIgY2hhbm5lbHNSZWdpc3RyeSA9IHt9OyAvL2tlZXBzIGNhbGxiYWNrcyBmb3IgY29uc3VtZXJzIGFuZCB3aW5kb3dzIHJlZmVyZW5jZXMgZm9yIHByb2R1Y2Vyc1xudmFyIGNhbGxiYWNrc1JlZ2lzdHJ5ID0ge307XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoZXZlbnQpIHtcbiAgICB2YXIgc3dhcm0gPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgIGlmKHN3YXJtLm1ldGEpe1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NSZWdpc3RyeVtzd2FybS5tZXRhLmNoYW5uZWxOYW1lXTtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgc3dhcm0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cblxuZnVuY3Rpb24gQ2hpbGRXbmRNUShjaGFubmVsTmFtZSwgbWFpbldpbmRvdywgc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwpIHtcbiAgICAvL2NoYW5uZWwgbmFtZSBpc1xuXG4gICAgY2hhbm5lbHNSZWdpc3RyeVtjaGFubmVsTmFtZV0gPSBtYWluV2luZG93O1xuXG4gICAgdGhpcy5wcm9kdWNlID0gZnVuY3Rpb24gKHN3YXJtTXNnKSB7XG4gICAgICAgIHN3YXJtTXNnLm1ldGEuY2hhbm5lbE5hbWUgPSBjaGFubmVsTmFtZTtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBtZXRhOnN3YXJtTXNnLm1ldGEsXG4gICAgICAgICAgICBwdWJsaWNWYXJzOnN3YXJtTXNnLnB1YmxpY1ZhcnMsXG4gICAgICAgICAgICBwcml2YXRlVmFyczpzd2FybU1zZy5wcml2YXRlVmFyc1xuICAgICAgICB9O1xuXG4gICAgICAgIG1lc3NhZ2UubWV0YS5hcmdzID0gbWVzc2FnZS5tZXRhLmFyZ3MubWFwKGZ1bmN0aW9uIChhcmd1bWVudCkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50IGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSB7fTtcbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnQubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcltcIm1lc3NhZ2VcIl0gPSBhcmd1bWVudC5tZXNzYWdlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJndW1lbnQuY29kZSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJvcltcImNvZGVcIl0gPSBhcmd1bWVudC5jb2RlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnQ7XG4gICAgICAgIH0pO1xuICAgICAgICBtYWluV2luZG93LnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpLCBcIipcIik7XG4gICAgfTtcblxuICAgIHZhciBjb25zdW1lcjtcblxuICAgIHRoaXMucmVnaXN0ZXJDb25zdW1lciA9IGZ1bmN0aW9uIChjYWxsYmFjaywgc2hvdWxkRGVsZXRlQWZ0ZXJSZWFkID0gdHJ1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IHBhcmFtZXRlciBzaG91bGQgYmUgYSBjYWxsYmFjayBmdW5jdGlvblwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uc3VtZXIpIHtcbiAgICAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKFwiT25seSBvbmUgY29uc3VtZXIgaXMgYWxsb3dlZCFcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdW1lciA9IGNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFja3NSZWdpc3RyeVtjaGFubmVsTmFtZV0gPSBjb25zdW1lcjtcblxuICAgICAgICBpZiAoc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwgJiYgdHlwZW9mIHNlY29uZENvbW11bmljYXRpb25DaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHNlY29uZENvbW11bmljYXRpb25DaGFubmVsLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGRpc3BhdGNoRXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9O1xufVxuXG5cbm1vZHVsZS5leHBvcnRzLmNyZWF0ZU1RID0gZnVuY3Rpb24gY3JlYXRlTVEoY2hhbm5lbE5hbWUsIHduZCwgc2Vjb25kQ29tbXVuaWNhdGlvbkNoYW5uZWwpe1xuICAgIHJldHVybiBuZXcgQ2hpbGRXbmRNUShjaGFubmVsTmFtZSwgd25kLCBzZWNvbmRDb21tdW5pY2F0aW9uQ2hhbm5lbCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzLmluaXRGb3JTd2FybWluZ0luQ2hpbGQgPSBmdW5jdGlvbihkb21haW5OYW1lKXtcblxuICAgIHZhciBwdWJTdWIgPSAkJC5yZXF1aXJlKFwic291bmRwdWJzdWJcIikuc291bmRQdWJTdWI7XG5cbiAgICB2YXIgaW5ib3VuZCA9IGNyZWF0ZU1RKGRvbWFpbk5hbWUrXCIvaW5ib3VuZFwiKTtcbiAgICB2YXIgb3V0Ym91bmQgPSBjcmVhdGVNUShkb21haW5OYW1lK1wiL291dGJvdW5kXCIpO1xuXG5cbiAgICBpbmJvdW5kLnJlZ2lzdGVyQ29uc3VtZXIoZnVuY3Rpb24oZXJyLCBzd2FybSl7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgLy9yZXN0b3JlIGFuZCBleGVjdXRlIHRoaXMgdGFzdHkgc3dhcm1cbiAgICAgICAgZ2xvYmFsLiQkLnN3YXJtc0luc3RhbmNlc01hbmFnZXIucmV2aXZlX3N3YXJtKHN3YXJtKTtcbiAgICB9KTtcblxuICAgIHB1YlN1Yi5zdWJzY3JpYmUoJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04sIGZ1bmN0aW9uKHN3YXJtKXtcbiAgICAgICAgb3V0Ym91bmQuc2VuZFN3YXJtRm9yRXhlY3V0aW9uKHN3YXJtKTtcbiAgICB9KTtcbn07XG5cbiIsInZhciBjaGFubmVsc1JlZ2lzdHJ5ID0ge307IC8va2VlcHMgY2FsbGJhY2tzIGZvciBjb25zdW1lcnMgYW5kIHdpbmRvd3MgcmVmZXJlbmNlcyBmb3IgcHJvZHVjZXJzXG52YXIgY2FsbGJhY2tzUmVnaXN0cnkgPSB7fTtcbnZhciBzd2FybUNhbGxiYWNrcyA9IHt9O1xuXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KGV2ZW50KSB7XG5cbiAgICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cpIHtcblxuICAgICAgICB2YXIgc3dhcm0gPSBldmVudC5kYXRhO1xuXG4gICAgICAgIGlmIChzd2FybS5tZXRhKSB7XG4gICAgICAgICAgICBsZXQgY2FsbGJhY2s7XG4gICAgICAgICAgICBpZiAoIXN3YXJtLm1ldGEucmVxdWVzdElkIHx8ICFzd2FybUNhbGxiYWNrc1tzd2FybS5tZXRhLnJlcXVlc3RJZF0pIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrc1JlZ2lzdHJ5W3N3YXJtLm1ldGEuY2hhbm5lbE5hbWVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBzd2FybUNhbGxiYWNrc1tzd2FybS5tZXRhLnJlcXVlc3RJZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBzd2FybSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIENoaWxkV25kTVEoY2hhbm5lbE5hbWUsIG1haW5XaW5kb3cpIHtcbiAgICAvL2NoYW5uZWwgbmFtZSBpc1xuXG4gICAgY2hhbm5lbHNSZWdpc3RyeVtjaGFubmVsTmFtZV0gPSBtYWluV2luZG93O1xuXG4gICAgdGhpcy5wcm9kdWNlID0gZnVuY3Rpb24gKHN3YXJtTXNnKSB7XG4gICAgICAgIHN3YXJtTXNnLm1ldGEuY2hhbm5lbE5hbWUgPSBjaGFubmVsTmFtZTtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSB7XG4gICAgICAgICAgICBtZXRhOiBzd2FybU1zZy5tZXRhLFxuICAgICAgICAgICAgcHVibGljVmFyczogc3dhcm1Nc2cucHVibGljVmFycyxcbiAgICAgICAgICAgIHByaXZhdGVWYXJzOiBzd2FybU1zZy5wcml2YXRlVmFyc1xuICAgICAgICB9O1xuICAgICAgICAvL2NvbnNvbGUubG9nKHN3YXJtTXNnLmdldEpTT04oKSk7XG4gICAgICAgIC8vY29uc29sZS5sb2coc3dhcm1Nc2cudmFsdWVPZigpKTtcbiAgICAgICAgbWVzc2FnZS5tZXRhLmFyZ3MgPSBtZXNzYWdlLm1ldGEuYXJncy5tYXAoZnVuY3Rpb24gKGFyZ3VtZW50KSB7XG4gICAgICAgICAgICBpZiAoYXJndW1lbnQgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IHt9O1xuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudC5tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yW1wibWVzc2FnZVwiXSA9IGFyZ3VtZW50Lm1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudC5jb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGVycm9yW1wiY29kZVwiXSA9IGFyZ3VtZW50LmNvZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhcmd1bWVudDtcbiAgICAgICAgfSk7XG4gICAgICAgIG1haW5XaW5kb3cucG9zdE1lc3NhZ2UobWVzc2FnZSwgXCIqXCIpO1xuICAgIH07XG5cbiAgICB2YXIgY29uc3VtZXI7XG5cbiAgICB0aGlzLnJlZ2lzdGVyQ29uc3VtZXIgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHNob3VsZERlbGV0ZUFmdGVyUmVhZCA9IHRydWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgY2FsbGJhY2sgZnVuY3Rpb25cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnN1bWVyKSB7XG4gICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IG9uZSBjb25zdW1lciBpcyBhbGxvd2VkIVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN1bWVyID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrc1JlZ2lzdHJ5W2NoYW5uZWxOYW1lXSA9IGNvbnN1bWVyO1xuICAgICAgICBtYWluV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGRpc3BhdGNoRXZlbnQpO1xuICAgIH07XG5cbiAgICB0aGlzLnJlZ2lzdGVyQ2FsbGJhY2sgPSBmdW5jdGlvbiAocmVxdWVzdElkLCBjYWxsYmFjaykge1xuICAgICAgICBzd2FybUNhbGxiYWNrc1tyZXF1ZXN0SWRdID0gY2FsbGJhY2s7XG4gICAgICAgIGNhbGxiYWNrc1JlZ2lzdHJ5W2NoYW5uZWxOYW1lXSA9IGNhbGxiYWNrO1xuICAgICAgICBtYWluV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGRpc3BhdGNoRXZlbnQpO1xuICAgIH07XG5cbn1cblxuXG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVNUSA9IGZ1bmN0aW9uIGNyZWF0ZU1RKGNoYW5uZWxOYW1lLCB3bmQpIHtcbiAgICByZXR1cm4gbmV3IENoaWxkV25kTVEoY2hhbm5lbE5hbWUsIHduZCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzLmluaXRGb3JTd2FybWluZ0luQ2hpbGQgPSBmdW5jdGlvbiAoZG9tYWluTmFtZSkge1xuXG4gICAgdmFyIHB1YlN1YiA9ICQkLnJlcXVpcmUoXCJzb3VuZHB1YnN1YlwiKS5zb3VuZFB1YlN1YjtcblxuICAgIHZhciBpbmJvdW5kID0gY3JlYXRlTVEoZG9tYWluTmFtZSArIFwiL2luYm91bmRcIik7XG4gICAgdmFyIG91dGJvdW5kID0gY3JlYXRlTVEoZG9tYWluTmFtZSArIFwiL291dGJvdW5kXCIpO1xuXG5cbiAgICBpbmJvdW5kLnJlZ2lzdGVyQ29uc3VtZXIoZnVuY3Rpb24gKGVyciwgc3dhcm0pIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuICAgICAgICAvL3Jlc3RvcmUgYW5kIGV4ZWN1dGUgdGhpcyB0YXN0eSBzd2FybVxuICAgICAgICBnbG9iYWwuJCQuc3dhcm1zSW5zdGFuY2VzTWFuYWdlci5yZXZpdmVfc3dhcm0oc3dhcm0pO1xuICAgIH0pO1xuXG4gICAgcHViU3ViLnN1YnNjcmliZSgkJC5DT05TVEFOVFMuU1dBUk1fRk9SX0VYRUNVVElPTiwgZnVuY3Rpb24gKHN3YXJtKSB7XG4gICAgICAgIG91dGJvdW5kLnNlbmRTd2FybUZvckV4ZWN1dGlvbihzd2FybSk7XG4gICAgfSk7XG59O1xuXG4iLCJpZiAodHlwZW9mICQkID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAkJCA9IHt9O1xufVxuXG5mdW5jdGlvbiBWaXJ0dWFsU3dhcm0oaW5uZXJPYmosIGdsb2JhbEhhbmRsZXIpe1xuICAgIGxldCBrbm93bkV4dHJhUHJvcHMgPSBbIFwic3dhcm1cIiBdO1xuXG4gICAgZnVuY3Rpb24gYnVpbGRIYW5kbGVyKCkge1xuICAgICAgICB2YXIgdXRpbGl0eSA9IHt9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGFyZ2V0LnByaXZhdGVWYXJzICYmIHRhcmdldC5wcml2YXRlVmFycy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk6XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHJpdmF0ZVZhcnNbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0YXJnZXQucHVibGljVmFycyAmJiB0YXJnZXQucHVibGljVmFycy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk6XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQucHVibGljVmFyc1twcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRhcmdldC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk6XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBrbm93bkV4dHJhUHJvcHMuaW5kZXhPZihwcm9wZXJ0eSkgPT09IC0xOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFnbG9iYWxIYW5kbGVyLnByb3RlY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdsb2JhbEhhbmRsZXIucHJvdGVjdGVkID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWxIYW5kbGVyLnByb3RlY3RlZFtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbGl0eVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAodGFyZ2V0LCBwcm9wZXJ0eSwgcmVjZWl2ZXIpIHtcblxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIHRhcmdldC5wdWJsaWNWYXJzICYmIHRhcmdldC5wdWJsaWNWYXJzLmhhc093blByb3BlcnR5KHByb3BlcnR5KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YXJnZXQucHVibGljVmFyc1twcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGFyZ2V0LnByaXZhdGVWYXJzICYmIHRhcmdldC5wcml2YXRlVmFycy5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LnByaXZhdGVWYXJzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0YXJnZXQuaGFzT3duUHJvcGVydHkocHJvcGVydHkpOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgZ2xvYmFsSGFuZGxlci5wcm90ZWN0ZWQgJiYgZ2xvYmFsSGFuZGxlci5wcm90ZWN0ZWQuaGFzT3duUHJvcGVydHkocHJvcGVydHkpOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdsb2JhbEhhbmRsZXIucHJvdGVjdGVkW3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB1dGlsaXR5Lmhhc093blByb3BlcnR5KHByb3BlcnR5KTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1dGlsaXR5W3Byb3BlcnR5XTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJveHkoaW5uZXJPYmosIGJ1aWxkSGFuZGxlcigpKTtcbn1cblxuZnVuY3Rpb24gU3dhcm1JbnRlcmFjdGlvbihjb21tdW5pY2F0aW9uSW50ZXJmYWNlLCBzd2FybU5hbWUsIGN0b3IsIGFyZ3MpIHtcblxuICAgIHZhciBzd2FybUhhbmRsZXIgPSBjb21tdW5pY2F0aW9uSW50ZXJmYWNlLnN0YXJ0U3dhcm0oc3dhcm1OYW1lLCBjdG9yLCBhcmdzKTtcblxuICAgIHRoaXMub24gPSBmdW5jdGlvbihkZXNjcmlwdGlvbil7XG4gICAgICAgIGNvbW11bmljYXRpb25JbnRlcmZhY2Uub24oc3dhcm1IYW5kbGVyLCBmdW5jdGlvbihlcnIsIHN3YXJtU2VyaWFsaXNhdGlvbil7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBwaGFzZSA9IGRlc2NyaXB0aW9uW3N3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLnBoYXNlTmFtZV07XG4gICAgICAgICAgICBsZXQgdmlydHVhbFN3YXJtID0gbmV3IFZpcnR1YWxTd2FybShzd2FybVNlcmlhbGlzYXRpb24sIHN3YXJtSGFuZGxlcik7XG5cbiAgICAgICAgICAgIGlmKCFwaGFzZSl7XG4gICAgICAgICAgICAgICAgLy9UT0RPIHJldmlldyBhbmQgZml4LiBGaXggY2FzZSB3aGVuIGFuIGludGVyYWN0aW9uIGlzIHN0YXJ0ZWQgZnJvbSBhbm90aGVyIGludGVyYWN0aW9uXG4gICAgICAgICAgICAgICAgaWYoc3dhcm1IYW5kbGVyICYmICghc3dhcm1IYW5kbGVyLlRhcmdldCB8fCBzd2FybUhhbmRsZXIuVGFyZ2V0LnN3YXJtSWQgIT09IHN3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLnN3YXJtSWQpKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJOb3QgbXkgc3dhcm0hXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpbnRlcmFjdFBoYXNlRXJyID0gIG5ldyBFcnJvcihcIkludGVyYWN0IG1ldGhvZCBcIitzd2FybVNlcmlhbGlzYXRpb24ubWV0YS5waGFzZU5hbWUrXCIgd2FzIG5vdCBmb3VuZC5cIik7XG4gICAgICAgICAgICAgICAgaWYoZGVzY3JpcHRpb25bXCJvbkVycm9yXCJdKXtcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb25bXCJvbkVycm9yXCJdLmNhbGwodmlydHVhbFN3YXJtLCBpbnRlcmFjdFBoYXNlRXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBpbnRlcmFjdFBoYXNlRXJyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmlydHVhbFN3YXJtLnN3YXJtID0gZnVuY3Rpb24ocGhhc2VOYW1lLCAuLi5hcmdzKXtcbiAgICAgICAgICAgICAgICBjb21tdW5pY2F0aW9uSW50ZXJmYWNlLmNvbnRpbnVlU3dhcm0oc3dhcm1IYW5kbGVyLCBzd2FybVNlcmlhbGlzYXRpb24sIHBoYXNlTmFtZSwgYXJncyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBwaGFzZS5hcHBseSh2aXJ0dWFsU3dhcm0sIHN3YXJtU2VyaWFsaXNhdGlvbi5tZXRhLmFyZ3MpO1xuICAgICAgICAgICAgaWYodmlydHVhbFN3YXJtLm1ldGEuY29tbWFuZCA9PT0gXCJhc3luY1JldHVyblwiKXtcbiAgICAgICAgICAgICAgICBjb21tdW5pY2F0aW9uSW50ZXJmYWNlLm9mZihzd2FybUhhbmRsZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5vblJldHVybiA9IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICAgICAgdGhpcy5vbih7XG4gICAgICAgICAgICBfX3JldHVybl9fOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG52YXIgYWJzdHJhY3RJbnRlcmFjdGlvblNwYWNlID0ge1xuICAgIHN0YXJ0U3dhcm06IGZ1bmN0aW9uIChzd2FybU5hbWUsIGN0b3IsIGFyZ3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlICBTd2FybUludGVyYWN0aW9uLnByb3RvdHlwZS5zdGFydFN3YXJtXCIpO1xuICAgIH0sXG4gICAgcmVzZW5kU3dhcm06IGZ1bmN0aW9uIChzd2FybUluc3RhbmNlLCBzd2FybVNlcmlhbGlzYXRpb24sIGN0b3IsIGFyZ3MpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlICBTd2FybUludGVyYWN0aW9uLnByb3RvdHlwZS5jb250aW51ZVN3YXJtIFwiKTtcbiAgICB9LFxuICAgIG9uOiBmdW5jdGlvbiAoc3dhcm1JbnN0YW5jZSwgcGhhc2VOYW1lLCBjYWxsYmFjaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgIFN3YXJtSW50ZXJhY3Rpb24ucHJvdG90eXBlLm9uU3dhcm1cIik7XG4gICAgfSxcbm9mZjogZnVuY3Rpb24gKHN3YXJtSW5zdGFuY2UpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlICBTd2FybUludGVyYWN0aW9uLnByb3RvdHlwZS5vblN3YXJtXCIpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzLm5ld0ludGVyYWN0aW9uU3BhY2UgPSBmdW5jdGlvbiAoY29tbXVuaWNhdGlvbkludGVyZmFjZSkge1xuXG4gICAgaWYoIWNvbW11bmljYXRpb25JbnRlcmZhY2UpIHtcbiAgICAgICAgY29tbXVuaWNhdGlvbkludGVyZmFjZSA9IGFic3RyYWN0SW50ZXJhY3Rpb25TcGFjZSA7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0U3dhcm06IGZ1bmN0aW9uIChzd2FybU5hbWUsIGN0b3IsIC4uLmFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgU3dhcm1JbnRlcmFjdGlvbihjb21tdW5pY2F0aW9uSW50ZXJmYWNlLCBzd2FybU5hbWUsIGN0b3IsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gUGVuZDtcblxuZnVuY3Rpb24gUGVuZCgpIHtcbiAgdGhpcy5wZW5kaW5nID0gMDtcbiAgdGhpcy5tYXggPSBJbmZpbml0eTtcbiAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgdGhpcy53YWl0aW5nID0gW107XG4gIHRoaXMuZXJyb3IgPSBudWxsO1xufVxuXG5QZW5kLnByb3RvdHlwZS5nbyA9IGZ1bmN0aW9uKGZuKSB7XG4gIGlmICh0aGlzLnBlbmRpbmcgPCB0aGlzLm1heCkge1xuICAgIHBlbmRHbyh0aGlzLCBmbik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy53YWl0aW5nLnB1c2goZm4pO1xuICB9XG59O1xuXG5QZW5kLnByb3RvdHlwZS53YWl0ID0gZnVuY3Rpb24oY2IpIHtcbiAgaWYgKHRoaXMucGVuZGluZyA9PT0gMCkge1xuICAgIGNiKHRoaXMuZXJyb3IpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2goY2IpO1xuICB9XG59O1xuXG5QZW5kLnByb3RvdHlwZS5ob2xkID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBwZW5kSG9sZCh0aGlzKTtcbn07XG5cbmZ1bmN0aW9uIHBlbmRIb2xkKHNlbGYpIHtcbiAgc2VsZi5wZW5kaW5nICs9IDE7XG4gIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgcmV0dXJuIG9uQ2I7XG4gIGZ1bmN0aW9uIG9uQ2IoZXJyKSB7XG4gICAgaWYgKGNhbGxlZCkgdGhyb3cgbmV3IEVycm9yKFwiY2FsbGJhY2sgY2FsbGVkIHR3aWNlXCIpO1xuICAgIGNhbGxlZCA9IHRydWU7XG4gICAgc2VsZi5lcnJvciA9IHNlbGYuZXJyb3IgfHwgZXJyO1xuICAgIHNlbGYucGVuZGluZyAtPSAxO1xuICAgIGlmIChzZWxmLndhaXRpbmcubGVuZ3RoID4gMCAmJiBzZWxmLnBlbmRpbmcgPCBzZWxmLm1heCkge1xuICAgICAgcGVuZEdvKHNlbGYsIHNlbGYud2FpdGluZy5zaGlmdCgpKTtcbiAgICB9IGVsc2UgaWYgKHNlbGYucGVuZGluZyA9PT0gMCkge1xuICAgICAgdmFyIGxpc3RlbmVycyA9IHNlbGYubGlzdGVuZXJzO1xuICAgICAgc2VsZi5saXN0ZW5lcnMgPSBbXTtcbiAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGNiTGlzdGVuZXIpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBjYkxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGlzdGVuZXIoc2VsZi5lcnJvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGVuZEdvKHNlbGYsIGZuKSB7XG4gIGZuKHBlbmRIb2xkKHNlbGYpKTtcbn1cbiIsImNvbnN0IG1zZ3BhY2sgPSByZXF1aXJlKCdAbXNncGFjay9tc2dwYWNrJyk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqICB1dGlsaXR5IGNsYXNzICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5mdW5jdGlvbiBSZXF1ZXN0TWFuYWdlcihwb2xsaW5nVGltZU91dCl7XG4gICAgaWYoIXBvbGxpbmdUaW1lT3V0KXtcbiAgICAgICAgcG9sbGluZ1RpbWVPdXQgPSAxMDAwOyAvLzEgc2Vjb25kIGJ5IGRlZmF1bHRcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBSZXF1ZXN0KGVuZFBvaW50LCBpbml0aWFsU3dhcm0pe1xuICAgICAgICB2YXIgb25SZXR1cm5DYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIG9uRXJyb3JDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgdmFyIG9uQ2FsbGJhY2tzID0gW107XG4gICAgICAgIHZhciByZXF1ZXN0SWQgPSBpbml0aWFsU3dhcm0ubWV0YS5yZXF1ZXN0SWQ7XG4gICAgICAgIGluaXRpYWxTd2FybSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5nZXRSZXF1ZXN0SWQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3RJZDtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uID0gZnVuY3Rpb24ocGhhc2VOYW1lLCBjYWxsYmFjayl7XG4gICAgICAgICAgICBpZih0eXBlb2YgcGhhc2VOYW1lICE9IFwic3RyaW5nXCIgICYmIHR5cGVvZiBjYWxsYmFjayAhPSBcImZ1bmN0aW9uXCIpe1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBmaXJzdCBwYXJhbWV0ZXIgc2hvdWxkIGJlIGEgc3RyaW5nIGFuZCB0aGUgc2Vjb25kIHBhcmFtZXRlciBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb25DYWxsYmFja3MucHVzaCh7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6Y2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgcGhhc2U6cGhhc2VOYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNlbGYucG9sbChlbmRQb2ludCwgdGhpcyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9uUmV0dXJuID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgICAgICAgICAgb25SZXR1cm5DYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICAgICAgICBzZWxmLnBvbGwoZW5kUG9pbnQsIHRoaXMpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5vbkVycm9yID0gZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgICAgICAgICAgaWYob25FcnJvckNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKSE9PS0xKXtcbiAgICAgICAgICAgICAgICBvbkVycm9yQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBjYWxsYmFjayBhbHJlYWR5IHJlZ2lzdGVyZWQhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGlzcGF0Y2ggPSBmdW5jdGlvbihlcnIsIHJlc3VsdCl7XG4gICAgICAgICAgICBpZihBcnJheUJ1ZmZlci5pc1ZpZXcocmVzdWx0KSB8fCBCdWZmZXIuaXNCdWZmZXIocmVzdWx0KSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG1zZ3BhY2suZGVjb2RlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIgPyBKU09OLnBhcnNlKHJlc3VsdCkgOiByZXN1bHQ7XG5cbiAgICAgICAgICAgIHJlc3VsdCA9IE93TS5wcm90b3R5cGUuY29udmVydChyZXN1bHQpO1xuICAgICAgICAgICAgdmFyIHJlc3VsdFJlcUlkID0gcmVzdWx0LmdldE1ldGEoXCJyZXF1ZXN0SWRcIik7XG4gICAgICAgICAgICB2YXIgcGhhc2VOYW1lID0gcmVzdWx0LmdldE1ldGEoXCJwaGFzZU5hbWVcIik7XG4gICAgICAgICAgICB2YXIgb25SZXR1cm4gPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYocmVzdWx0UmVxSWQgPT09IHJlcXVlc3RJZCl7XG4gICAgICAgICAgICAgICAgb25SZXR1cm5DYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihjKXtcbiAgICAgICAgICAgICAgICAgICAgYyhudWxsLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBvblJldHVybiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYob25SZXR1cm4pe1xuICAgICAgICAgICAgICAgICAgICBvblJldHVybkNhbGxiYWNrcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBvbkVycm9yQ2FsbGJhY2tzID0gW107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgb25DYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihpKXtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhcIlhYWFhYWFhYOlwiLCBwaGFzZU5hbWUgLCBpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocGhhc2VOYW1lID09PSBpLnBoYXNlIHx8IGkucGhhc2UgPT09ICcqJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaS5jYWxsYmFjayhlcnIsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYob25SZXR1cm5DYWxsYmFja3MubGVuZ3RoID09PSAwICYmIG9uQ2FsbGJhY2tzLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgICAgICAgICAgc2VsZi51bnBvbGwoZW5kUG9pbnQsIHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGlzcGF0Y2hFcnJvciA9IGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaSA8IG9uRXJyb3JDYWxsYmFja3MubGVuZ3RoOyBpKyspe1xuICAgICAgICAgICAgICAgIHZhciBlcnJDYiA9IG9uRXJyb3JDYWxsYmFja3NbaV07XG4gICAgICAgICAgICAgICAgZXJyQ2IoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLm9mZiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzZWxmLnVucG9sbChlbmRQb2ludCwgdGhpcyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5jcmVhdGVSZXF1ZXN0ID0gZnVuY3Rpb24ocmVtb3RlRW5kUG9pbnQsIHN3YXJtKXtcbiAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdChyZW1vdGVFbmRQb2ludCwgc3dhcm0pO1xuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9O1xuXG4gICAgLyogKioqKioqKioqKioqKioqKioqKioqKioqKioqIHBvbGxpbmcgem9uZSAqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4gICAgdmFyIHBvbGxTZXQgPSB7XG4gICAgfTtcblxuICAgIHZhciBhY3RpdmVDb25uZWN0aW9ucyA9IHtcbiAgICB9O1xuXG4gICAgdGhpcy5wb2xsID0gZnVuY3Rpb24ocmVtb3RlRW5kUG9pbnQsIHJlcXVlc3Qpe1xuICAgICAgICB2YXIgcmVxdWVzdHMgPSBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XTtcbiAgICAgICAgaWYoIXJlcXVlc3RzKXtcbiAgICAgICAgICAgIHJlcXVlc3RzID0ge307XG4gICAgICAgICAgICBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XSA9IHJlcXVlc3RzO1xuICAgICAgICB9XG4gICAgICAgIHJlcXVlc3RzW3JlcXVlc3QuZ2V0UmVxdWVzdElkKCldID0gcmVxdWVzdDtcbiAgICAgICAgcG9sbGluZ0hhbmRsZXIoKTtcbiAgICB9O1xuXG4gICAgdGhpcy51bnBvbGwgPSBmdW5jdGlvbihyZW1vdGVFbmRQb2ludCwgcmVxdWVzdCl7XG4gICAgICAgIHZhciByZXF1ZXN0cyA9IHBvbGxTZXRbcmVtb3RlRW5kUG9pbnRdO1xuICAgICAgICBpZihyZXF1ZXN0cyl7XG4gICAgICAgICAgICBkZWxldGUgcmVxdWVzdHNbcmVxdWVzdC5nZXRSZXF1ZXN0SWQoKV07XG4gICAgICAgICAgICBpZihPYmplY3Qua2V5cyhyZXF1ZXN0cykubGVuZ3RoID09PSAwKXtcbiAgICAgICAgICAgICAgICBkZWxldGUgcG9sbFNldFtyZW1vdGVFbmRQb2ludF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlVucG9sbGluZyB3cm9uZyByZXF1ZXN0OlwiLHJlbW90ZUVuZFBvaW50LCByZXF1ZXN0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVQb2xsVGhyZWFkKHJlbW90ZUVuZFBvaW50KXtcbiAgICAgICAgZnVuY3Rpb24gcmVBcm0oKXtcbiAgICAgICAgICAgICQkLnJlbW90ZS5kb0h0dHBHZXQocmVtb3RlRW5kUG9pbnQsIGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdHMgPSBwb2xsU2V0W3JlbW90ZUVuZFBvaW50XTtcblxuICAgICAgICAgICAgICAgIGlmKGVycil7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgcmVxX2lkIGluIHJlcXVlc3RzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlcnJfaGFuZGxlciA9IHJlcXVlc3RzW3JlcV9pZF0uZGlzcGF0Y2hFcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVycl9oYW5kbGVyKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJfaGFuZGxlcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZUNvbm5lY3Rpb25zW3JlbW90ZUVuZFBvaW50XSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKEJ1ZmZlci5pc0J1ZmZlcihyZXMpIHx8IEFycmF5QnVmZmVyLmlzVmlldyhyZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSBtc2dwYWNrLmRlY29kZShyZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIHJlcXVlc3RzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzW2tdLmRpc3BhdGNoKG51bGwsIHJlcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZihPYmplY3Qua2V5cyhyZXF1ZXN0cykubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZUFybSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFjdGl2ZUNvbm5lY3Rpb25zW3JlbW90ZUVuZFBvaW50XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRW5kaW5nIHBvbGxpbmcgZm9yIFwiLCByZW1vdGVFbmRQb2ludCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZUFybSgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvbGxpbmdIYW5kbGVyKCl7XG4gICAgICAgIGxldCBzZXRUaW1lciA9IGZhbHNlO1xuICAgICAgICBmb3IodmFyIHYgaW4gcG9sbFNldCl7XG4gICAgICAgICAgICBpZighYWN0aXZlQ29ubmVjdGlvbnNbdl0pe1xuICAgICAgICAgICAgICAgIGNyZWF0ZVBvbGxUaHJlYWQodik7XG4gICAgICAgICAgICAgICAgYWN0aXZlQ29ubmVjdGlvbnNbdl0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0VGltZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHNldFRpbWVyKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KHBvbGxpbmdIYW5kbGVyLCBwb2xsaW5nVGltZU91dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRUaW1lb3V0KCBwb2xsaW5nSGFuZGxlciwgcG9sbGluZ1RpbWVPdXQpO1xufVxuXG5cbmZ1bmN0aW9uIGV4dHJhY3REb21haW5BZ2VudERldGFpbHModXJsKXtcbiAgICBjb25zdCB2UmVnZXggPSAvKFthLXpBLVowLTldKnwuKSpcXC9hZ2VudFxcLyhbYS16QS1aMC05XSsoXFwvKSopKy9nO1xuXG4gICAgaWYoIXVybC5tYXRjaCh2UmVnZXgpKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBmb3JtYXQuIChFZy4gZG9tYWluWy5zdWJkb21haW5dKi9hZ2VudC9bb3JnYW5pc2F0aW9uL10qYWdlbnRJZClcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZGV2aWRlciA9IFwiL2FnZW50L1wiO1xuICAgIGxldCBkb21haW47XG4gICAgbGV0IGFnZW50VXJsO1xuXG4gICAgY29uc3Qgc3BsaXRQb2ludCA9IHVybC5pbmRleE9mKGRldmlkZXIpO1xuICAgIGlmKHNwbGl0UG9pbnQgIT09IC0xKXtcbiAgICAgICAgZG9tYWluID0gdXJsLnNsaWNlKDAsIHNwbGl0UG9pbnQpO1xuICAgICAgICBhZ2VudFVybCA9IHVybC5zbGljZShzcGxpdFBvaW50K2RldmlkZXIubGVuZ3RoKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge2RvbWFpbiwgYWdlbnRVcmx9O1xufVxuXG5mdW5jdGlvbiB1cmxFbmRXaXRoU2xhc2godXJsKXtcblxuICAgIGlmKHVybFt1cmwubGVuZ3RoIC0gMV0gIT09IFwiL1wiKXtcbiAgICAgICAgdXJsICs9IFwiL1wiO1xuICAgIH1cblxuICAgIHJldHVybiB1cmw7XG59XG5cbmNvbnN0IE93TSA9IHJlcXVpcmUoXCJzd2FybXV0aWxzXCIpLk93TTtcblxuLyoqKioqKioqKioqKioqKioqKioqKiogbWFpbiBBUElzIG9uIHdvcmtpbmcgd2l0aCByZW1vdGUgZW5kIHBvaW50cyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuZnVuY3Rpb24gUHNrSHR0cENsaWVudChyZW1vdGVFbmRQb2ludCwgYWdlbnRVaWQsIG9wdGlvbnMpe1xuICAgIHZhciBiYXNlT2ZSZW1vdGVFbmRQb2ludCA9IHJlbW90ZUVuZFBvaW50OyAvL3JlbW92ZSBsYXN0IGlkXG5cbiAgICByZW1vdGVFbmRQb2ludCA9IHVybEVuZFdpdGhTbGFzaChyZW1vdGVFbmRQb2ludCk7XG5cbiAgICAvL2RvbWFpbkluZm8gY29udGFpbnMgMiBtZW1iZXJzOiBkb21haW4gKHByaXZhdGVTa3kgZG9tYWluKSBhbmQgYWdlbnRVcmxcbiAgICBjb25zdCBkb21haW5JbmZvID0gZXh0cmFjdERvbWFpbkFnZW50RGV0YWlscyhhZ2VudFVpZCk7XG4gICAgbGV0IGhvbWVTZWN1cml0eUNvbnRleHQgPSBkb21haW5JbmZvLmFnZW50VXJsO1xuICAgIGxldCByZXR1cm5SZW1vdGVFbmRQb2ludCA9IHJlbW90ZUVuZFBvaW50O1xuXG4gICAgaWYob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucy5yZXR1cm5SZW1vdGUgIT0gXCJ1bmRlZmluZWRcIil7XG4gICAgICAgIHJldHVyblJlbW90ZUVuZFBvaW50ID0gb3B0aW9ucy5yZXR1cm5SZW1vdGU7XG4gICAgfVxuXG4gICAgaWYoIW9wdGlvbnMgfHwgb3B0aW9ucyAmJiAodHlwZW9mIG9wdGlvbnMudW5pcXVlSWQgPT0gXCJ1bmRlZmluZWRcIiB8fCBvcHRpb25zLnVuaXF1ZUlkKSl7XG4gICAgICAgIGhvbWVTZWN1cml0eUNvbnRleHQgKz0gXCJfXCIrTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpO1xuICAgIH1cblxuICAgIHJldHVyblJlbW90ZUVuZFBvaW50ID0gdXJsRW5kV2l0aFNsYXNoKHJldHVyblJlbW90ZUVuZFBvaW50KTtcblxuICAgIHRoaXMuc3RhcnRTd2FybSA9IGZ1bmN0aW9uKHN3YXJtTmFtZSwgcGhhc2VOYW1lLCAuLi5hcmdzKXtcbiAgICAgICAgY29uc3Qgc3dhcm0gPSBuZXcgT3dNKCk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJzd2FybUlkXCIsICQkLnVpZEdlbmVyYXRvci5zYWZlX3V1aWQoKSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJyZXF1ZXN0SWRcIiwgc3dhcm0uZ2V0TWV0YShcInN3YXJtSWRcIikpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwic3dhcm1UeXBlTmFtZVwiLCBzd2FybU5hbWUpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwicGhhc2VOYW1lXCIsIHBoYXNlTmFtZSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJhcmdzXCIsIGFyZ3MpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiY29tbWFuZFwiLCBcImV4ZWN1dGVTd2FybVBoYXNlXCIpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwidGFyZ2V0XCIsIGRvbWFpbkluZm8uYWdlbnRVcmwpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiLCByZXR1cm5SZW1vdGVFbmRQb2ludCskJC5yZW1vdGUuYmFzZTY0RW5jb2RlKGhvbWVTZWN1cml0eUNvbnRleHQpKTtcblxuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdChnZXRSZW1vdGUocmVtb3RlRW5kUG9pbnQsIGRvbWFpbkluZm8uZG9tYWluKSwgbXNncGFjay5lbmNvZGUoc3dhcm0pLCBmdW5jdGlvbihlcnIsIHJlcyl7XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAkJC5yZW1vdGUucmVxdWVzdE1hbmFnZXIuY3JlYXRlUmVxdWVzdChzd2FybS5nZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiKSwgc3dhcm0pO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbnRpbnVlU3dhcm0gPSBmdW5jdGlvbihleGlzdGluZ1N3YXJtLCBwaGFzZU5hbWUsIC4uLmFyZ3Mpe1xuICAgICAgICB2YXIgc3dhcm0gPSBuZXcgT3dNKGV4aXN0aW5nU3dhcm0pO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwicGhhc2VOYW1lXCIsIHBoYXNlTmFtZSk7XG4gICAgICAgIHN3YXJtLnNldE1ldGEoXCJhcmdzXCIsIGFyZ3MpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiY29tbWFuZFwiLCBcImV4ZWN1dGVTd2FybVBoYXNlXCIpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwidGFyZ2V0XCIsIGRvbWFpbkluZm8uYWdlbnRVcmwpO1xuICAgICAgICBzd2FybS5zZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiLCByZXR1cm5SZW1vdGVFbmRQb2ludCskJC5yZW1vdGUuYmFzZTY0RW5jb2RlKGhvbWVTZWN1cml0eUNvbnRleHQpKTtcblxuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdChnZXRSZW1vdGUocmVtb3RlRW5kUG9pbnQsIGRvbWFpbkluZm8uZG9tYWluKSwgbXNncGFjay5lbmNvZGUoc3dhcm0pLCBmdW5jdGlvbihlcnIsIHJlcyl7XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvL3JldHVybiAkJC5yZW1vdGUucmVxdWVzdE1hbmFnZXIuY3JlYXRlUmVxdWVzdChzd2FybS5nZXRNZXRhKFwiaG9tZVNlY3VyaXR5Q29udGV4dFwiKSwgc3dhcm0pO1xuICAgIH07XG5cbiAgICB2YXIgYWxsQ2F0Y2hBbGxzID0gW107XG4gICAgdmFyIHJlcXVlc3RzQ291bnRlciA9IDA7XG4gICAgZnVuY3Rpb24gQ2F0Y2hBbGwoc3dhcm1OYW1lLCBwaGFzZU5hbWUsIGNhbGxiYWNrKXsgLy9zYW1lIGludGVyZmFjZSBhcyBSZXF1ZXN0XG4gICAgICAgIHZhciByZXF1ZXN0SWQgPSByZXF1ZXN0c0NvdW50ZXIrKztcbiAgICAgICAgdGhpcy5nZXRSZXF1ZXN0SWQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgbGV0IHJlcUlkID0gXCJzd2FybU5hbWVcIiArIFwicGhhc2VOYW1lXCIgKyByZXF1ZXN0SWQ7XG4gICAgICAgICAgICByZXR1cm4gcmVxSWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kaXNwYXRjaCA9IGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgIHJlc3VsdCA9IE93TS5wcm90b3R5cGUuY29udmVydChyZXN1bHQpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRQaGFzZU5hbWUgPSByZXN1bHQuZ2V0TWV0YShcInBoYXNlTmFtZVwiKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50U3dhcm1OYW1lID0gcmVzdWx0LmdldE1ldGEoXCJzd2FybVR5cGVOYW1lXCIpO1xuICAgICAgICAgICAgaWYoKGN1cnJlbnRTd2FybU5hbWUgPT09IHN3YXJtTmFtZSB8fCBzd2FybU5hbWUgPT09ICcqJykgJiYgKGN1cnJlbnRQaGFzZU5hbWUgPT09IHBoYXNlTmFtZSB8fCBwaGFzZU5hbWUgPT09ICcqJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCByZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMub24gPSBmdW5jdGlvbihzd2FybU5hbWUsIHBoYXNlTmFtZSwgY2FsbGJhY2spe1xuICAgICAgICB2YXIgYyA9IG5ldyBDYXRjaEFsbChzd2FybU5hbWUsIHBoYXNlTmFtZSwgY2FsbGJhY2spO1xuICAgICAgICBhbGxDYXRjaEFsbHMucHVzaCh7XG4gICAgICAgICAgICBzOnN3YXJtTmFtZSxcbiAgICAgICAgICAgIHA6cGhhc2VOYW1lLFxuICAgICAgICAgICAgYzpjXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQkLnJlbW90ZS5yZXF1ZXN0TWFuYWdlci5wb2xsKGdldFJlbW90ZShyZW1vdGVFbmRQb2ludCwgZG9tYWluSW5mby5kb21haW4pICwgYyk7XG4gICAgfTtcblxuICAgIHRoaXMub2ZmID0gZnVuY3Rpb24oc3dhcm1OYW1lLCBwaGFzZU5hbWUpe1xuICAgICAgICBhbGxDYXRjaEFsbHMuZm9yRWFjaChmdW5jdGlvbihjYSl7XG4gICAgICAgICAgICBpZigoY2EucyA9PT0gc3dhcm1OYW1lIHx8IHN3YXJtTmFtZSA9PT0gJyonKSAmJiAocGhhc2VOYW1lID09PSBjYS5wIHx8IHBoYXNlTmFtZSA9PT0gJyonKSl7XG4gICAgICAgICAgICAgICAgJCQucmVtb3RlLnJlcXVlc3RNYW5hZ2VyLnVucG9sbChnZXRSZW1vdGUocmVtb3RlRW5kUG9pbnQsIGRvbWFpbkluZm8uZG9tYWluKSwgY2EuYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLnVwbG9hZENTQiA9IGZ1bmN0aW9uKGNyeXB0b1VpZCwgYmluYXJ5RGF0YSwgY2FsbGJhY2spe1xuICAgICAgICAkJC5yZW1vdGUuZG9IdHRwUG9zdChiYXNlT2ZSZW1vdGVFbmRQb2ludCArIFwiL0NTQi9cIiArIGNyeXB0b1VpZCwgYmluYXJ5RGF0YSwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB0aGlzLmRvd25sb2FkQ1NCID0gZnVuY3Rpb24oY3J5cHRvVWlkLCBjYWxsYmFjayl7XG4gICAgICAgICQkLnJlbW90ZS5kb0h0dHBHZXQoYmFzZU9mUmVtb3RlRW5kUG9pbnQgKyBcIi9DU0IvXCIgKyBjcnlwdG9VaWQsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0UmVtb3RlKGJhc2VVcmwsIGRvbWFpbikge1xuICAgICAgICByZXR1cm4gdXJsRW5kV2l0aFNsYXNoKGJhc2VVcmwpICsgJCQucmVtb3RlLmJhc2U2NEVuY29kZShkb21haW4pO1xuICAgIH1cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKiogaW5pdGlhbGlzYXRpb24gc3R1ZmYgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbmlmICh0eXBlb2YgJCQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAkJCA9IHt9O1xufVxuXG5pZiAodHlwZW9mICAkJC5yZW1vdGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAkJC5yZW1vdGUgPSB7fTtcbiAgICAkJC5yZW1vdGUuY3JlYXRlUmVxdWVzdE1hbmFnZXIgPSBmdW5jdGlvbih0aW1lT3V0KXtcbiAgICAgICAgJCQucmVtb3RlLnJlcXVlc3RNYW5hZ2VyID0gbmV3IFJlcXVlc3RNYW5hZ2VyKHRpbWVPdXQpO1xuICAgIH07XG5cblxuICAgICQkLnJlbW90ZS5jcnlwdG9Qcm92aWRlciA9IG51bGw7XG4gICAgJCQucmVtb3RlLm5ld0VuZFBvaW50ID0gZnVuY3Rpb24oYWxpYXMsIHJlbW90ZUVuZFBvaW50LCBhZ2VudFVpZCwgY3J5cHRvSW5mbyl7XG4gICAgICAgIGlmKGFsaWFzID09PSBcIm5ld1JlbW90ZUVuZFBvaW50XCIgfHwgYWxpYXMgPT09IFwicmVxdWVzdE1hbmFnZXJcIiB8fCBhbGlhcyA9PT0gXCJjcnlwdG9Qcm92aWRlclwiKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUHNrSHR0cENsaWVudCBVbnNhZmUgYWxpYXMgbmFtZTpcIiwgYWxpYXMpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgICQkLnJlbW90ZVthbGlhc10gPSBuZXcgUHNrSHR0cENsaWVudChyZW1vdGVFbmRQb2ludCwgYWdlbnRVaWQsIGNyeXB0b0luZm8pO1xuICAgIH07XG5cblxuICAgICQkLnJlbW90ZS5kb0h0dHBQb3N0ID0gZnVuY3Rpb24gKHVybCwgZGF0YSwgY2FsbGJhY2spe1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPdmVyd3JpdGUgdGhpcyFcIik7XG4gICAgfTtcblxuICAgICQkLnJlbW90ZS5kb0h0dHBHZXQgPSBmdW5jdGlvbiBkb0h0dHBHZXQodXJsLCBjYWxsYmFjayl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJ3cml0ZSB0aGlzIVwiKTtcbiAgICB9O1xuXG4gICAgJCQucmVtb3RlLmJhc2U2NEVuY29kZSA9IGZ1bmN0aW9uIGJhc2U2NEVuY29kZShzdHJpbmdUb0VuY29kZSl7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk92ZXJ3cml0ZSB0aGlzIVwiKTtcbiAgICB9O1xuXG4gICAgJCQucmVtb3RlLmJhc2U2NERlY29kZSA9IGZ1bmN0aW9uIGJhc2U2NERlY29kZShlbmNvZGVkU3RyaW5nKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3ZlcndyaXRlIHRoaXMhXCIpO1xuICAgIH07XG59XG5cblxuXG4vKiAgaW50ZXJmYWNlXG5mdW5jdGlvbiBDcnlwdG9Qcm92aWRlcigpe1xuXG4gICAgdGhpcy5nZW5lcmF0ZVNhZmVVaWQgPSBmdW5jdGlvbigpe1xuXG4gICAgfVxuXG4gICAgdGhpcy5zaWduU3dhcm0gPSBmdW5jdGlvbihzd2FybSwgYWdlbnQpe1xuXG4gICAgfVxufSAqL1xuIiwiJCQucmVtb3RlLmRvSHR0cFBvc3QgPSBmdW5jdGlvbiAodXJsLCBkYXRhLCBjYWxsYmFjaykge1xuICAgIGNvbnN0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0ICYmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHhoci5yZXNwb25zZTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoeGhyLnN0YXR1cz49NDAwKXtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJBbiBlcnJvciBvY2N1cmVkLiBTdGF0dXNDb2RlOiBcIiArIHhoci5zdGF0dXMpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFN0YXR1cyBjb2RlICR7eGhyLnN0YXR1c30gcmVjZWl2ZWQsIHJlc3BvbnNlIGlzIGlnbm9yZWQuYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgeGhyLm9wZW4oXCJQT1NUXCIsIHVybCwgdHJ1ZSk7XG4gICAgLy94aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNvbnRlbnQtVHlwZVwiLCBcImFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD1VVEYtOFwiKTtcblxuICAgIGlmKGRhdGEgJiYgZGF0YS5waXBlICYmIHR5cGVvZiBkYXRhLnBpcGUgPT09IFwiZnVuY3Rpb25cIil7XG4gICAgICAgIGNvbnN0IGJ1ZmZlcnMgPSBbXTtcbiAgICAgICAgZGF0YS5vbihcImRhdGFcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgYnVmZmVycy5wdXNoKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgZGF0YS5vbihcImVuZFwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGFjdHVhbENvbnRlbnRzID0gQnVmZmVyLmNvbmNhdChidWZmZXJzKTtcbiAgICAgICAgICAgIHhoci5zZW5kKGFjdHVhbENvbnRlbnRzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkpIHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XG4gICAgICAgIH1cblxuICAgICAgICB4aHIuc2VuZChkYXRhKTtcbiAgICB9XG59O1xuXG5cbiQkLnJlbW90ZS5kb0h0dHBHZXQgPSBmdW5jdGlvbiBkb0h0dHBHZXQodXJsLCBjYWxsYmFjaykge1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9jaGVjayBpZiBoZWFkZXJzIHdlcmUgcmVjZWl2ZWQgYW5kIGlmIGFueSBhY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBiZWZvcmUgcmVjZWl2aW5nIGRhdGFcbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSAyKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudFR5cGUgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIik7XG4gICAgICAgICAgICBpZiAoY29udGVudFR5cGUgPT09IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCIpIHtcbiAgICAgICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09IDQgJiYgeGhyLnN0YXR1cyA9PSBcIjIwMFwiKSB7XG4gICAgICAgICAgICB2YXIgY29udGVudFR5cGUgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoXCJDb250ZW50LVR5cGVcIik7XG5cbiAgICAgICAgICAgIGlmKGNvbnRlbnRUeXBlPT09XCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIil7XG4gICAgICAgICAgICAgICAgbGV0IHJlc3BvbnNlQnVmZmVyID0gQnVmZmVyLmZyb20odGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzcG9uc2VCdWZmZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsLCB4aHIucmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJBbiBlcnJvciBvY2N1cmVkLiBTdGF0dXNDb2RlOiBcIiArIHhoci5zdGF0dXMpKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwpO1xuICAgIHhoci5zZW5kKCk7XG59O1xuXG5cbmZ1bmN0aW9uIENyeXB0b1Byb3ZpZGVyKCl7XG5cbiAgICB0aGlzLmdlbmVyYXRlU2FmZVVpZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCB1aWQgPSBcIlwiO1xuICAgICAgICB2YXIgYXJyYXkgPSBuZXcgVWludDMyQXJyYXkoMTApO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhhcnJheSk7XG5cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB1aWQgKz0gYXJyYXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVpZDtcbiAgICB9XG5cbiAgICB0aGlzLnNpZ25Td2FybSA9IGZ1bmN0aW9uKHN3YXJtLCBhZ2VudCl7XG4gICAgICAgIHN3YXJtLm1ldGEuc2lnbmF0dXJlID0gYWdlbnQ7XG4gICAgfVxufVxuXG5cblxuJCQucmVtb3RlLmNyeXB0b1Byb3ZpZGVyID0gbmV3IENyeXB0b1Byb3ZpZGVyKCk7XG5cbiQkLnJlbW90ZS5iYXNlNjRFbmNvZGUgPSBmdW5jdGlvbiBiYXNlNjRFbmNvZGUoc3RyaW5nVG9FbmNvZGUpe1xuICAgIHJldHVybiB3aW5kb3cuYnRvYShzdHJpbmdUb0VuY29kZSk7XG59O1xuXG4kJC5yZW1vdGUuYmFzZTY0RGVjb2RlID0gZnVuY3Rpb24gYmFzZTY0RGVjb2RlKGVuY29kZWRTdHJpbmcpe1xuICAgIHJldHVybiB3aW5kb3cuYXRvYihlbmNvZGVkU3RyaW5nKTtcbn07XG4iLCJyZXF1aXJlKFwiLi9wc2stYWJzdHJhY3QtY2xpZW50XCIpO1xuXG5jb25zdCBodHRwID0gcmVxdWlyZShcImh0dHBcIik7XG5jb25zdCBodHRwcyA9IHJlcXVpcmUoXCJodHRwc1wiKTtcbmNvbnN0IFVSTCA9IHJlcXVpcmUoXCJ1cmxcIik7XG5jb25zdCB1c2VyQWdlbnQgPSAnUFNLIE5vZGVBZ2VudC8wLjAuMSc7XG5cbmNvbnNvbGUubG9nKFwiUFNLIG5vZGUgY2xpZW50IGxvYWRpbmdcIik7XG5cbmZ1bmN0aW9uIGdldE5ldHdvcmtGb3JPcHRpb25zKG9wdGlvbnMpIHtcblx0aWYob3B0aW9ucy5wcm90b2NvbCA9PT0gJ2h0dHA6Jykge1xuXHRcdHJldHVybiBodHRwO1xuXHR9IGVsc2UgaWYob3B0aW9ucy5wcm90b2NvbCA9PT0gJ2h0dHBzOicpIHtcblx0XHRyZXR1cm4gaHR0cHM7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKGBDYW4ndCBoYW5kbGUgcHJvdG9jb2wgJHtvcHRpb25zLnByb3RvY29sfWApO1xuXHR9XG5cbn1cblxuJCQucmVtb3RlLmRvSHR0cFBvc3QgPSBmdW5jdGlvbiAodXJsLCBkYXRhLCBjYWxsYmFjayl7XG5cdGNvbnN0IGlubmVyVXJsID0gVVJMLnBhcnNlKHVybCk7XG5cblx0Y29uc3Qgb3B0aW9ucyA9IHtcblx0XHRob3N0bmFtZTogaW5uZXJVcmwuaG9zdG5hbWUsXG5cdFx0cGF0aDogaW5uZXJVcmwucGF0aG5hbWUsXG5cdFx0cG9ydDogcGFyc2VJbnQoaW5uZXJVcmwucG9ydCksXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J1VzZXItQWdlbnQnOiB1c2VyQWdlbnRcblx0XHR9LFxuXHRcdG1ldGhvZDogJ1BPU1QnXG5cdH07XG5cblx0Y29uc3QgbmV0d29yayA9IGdldE5ldHdvcmtGb3JPcHRpb25zKGlubmVyVXJsKTtcblxuXHRpZihBcnJheUJ1ZmZlci5pc1ZpZXcoZGF0YSkgfHwgQnVmZmVyLmlzQnVmZmVyKGRhdGEpKSB7XG5cdFx0aWYoIUJ1ZmZlci5pc0J1ZmZlcihkYXRhKSkge1xuXHRcdFx0ZGF0YSA9IEJ1ZmZlci5mcm9tKGRhdGEpO1xuXHRcdH1cblxuXHRcdG9wdGlvbnMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJztcblx0XHRvcHRpb25zLmhlYWRlcnNbJ0NvbnRlbnQtTGVuZ3RoJ10gPSBkYXRhLmxlbmd0aDtcblx0fVxuXG5cdGNvbnN0IHJlcSA9IG5ldHdvcmsucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG5cdFx0Y29uc3QgeyBzdGF0dXNDb2RlIH0gPSByZXM7XG5cblx0XHRsZXQgZXJyb3I7XG5cdFx0aWYgKHN0YXR1c0NvZGUgPj0gNDAwKSB7XG5cdFx0XHRlcnJvciA9IG5ldyBFcnJvcignUmVxdWVzdCBGYWlsZWQuXFxuJyArXG5cdFx0XHRcdGBTdGF0dXMgQ29kZTogJHtzdGF0dXNDb2RlfWApO1xuXHRcdH1cblxuXHRcdGlmIChlcnJvcikge1xuXHRcdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHRcdFx0Ly8gZnJlZSB1cCBtZW1vcnlcblx0XHRcdHJlcy5yZXN1bWUoKTtcblx0XHRcdHJldHVybiA7XG5cdFx0fVxuXG5cdFx0bGV0IHJhd0RhdGEgPSAnJztcblx0XHRyZXMub24oJ2RhdGEnLCAoY2h1bmspID0+IHsgcmF3RGF0YSArPSBjaHVuazsgfSk7XG5cdFx0cmVzLm9uKCdlbmQnLCAoKSA9PiB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobnVsbCwgcmF3RGF0YSk7XG5cdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiUE9TVCBFcnJvclwiLCBlcnJvcik7XG5cdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHR9KTtcblxuICAgIGlmKGRhdGEgJiYgZGF0YS5waXBlICYmIHR5cGVvZiBkYXRhLnBpcGUgPT09IFwiZnVuY3Rpb25cIil7XG4gICAgICAgIGRhdGEucGlwZShyZXEpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYodHlwZW9mIGRhdGEgIT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNCdWZmZXIoZGF0YSkgJiYgIUFycmF5QnVmZmVyLmlzVmlldyhkYXRhKSkge1xuXHRcdGRhdGEgPSBKU09OLnN0cmluZ2lmeShkYXRhKTtcblx0fVxuXG5cdHJlcS53cml0ZShkYXRhKTtcblx0cmVxLmVuZCgpO1xufTtcblxuJCQucmVtb3RlLmRvSHR0cEdldCA9IGZ1bmN0aW9uIGRvSHR0cEdldCh1cmwsIGNhbGxiYWNrKXtcbiAgICBjb25zdCBpbm5lclVybCA9IFVSTC5wYXJzZSh1cmwpO1xuXG5cdGNvbnN0IG9wdGlvbnMgPSB7XG5cdFx0aG9zdG5hbWU6IGlubmVyVXJsLmhvc3RuYW1lLFxuXHRcdHBhdGg6IGlubmVyVXJsLnBhdGhuYW1lICsgKGlubmVyVXJsLnNlYXJjaCB8fCAnJyksXG5cdFx0cG9ydDogcGFyc2VJbnQoaW5uZXJVcmwucG9ydCksXG5cdFx0aGVhZGVyczoge1xuXHRcdFx0J1VzZXItQWdlbnQnOiB1c2VyQWdlbnRcblx0XHR9LFxuXHRcdG1ldGhvZDogJ0dFVCdcblx0fTtcblxuXHRjb25zdCBuZXR3b3JrID0gZ2V0TmV0d29ya0Zvck9wdGlvbnMoaW5uZXJVcmwpO1xuXG5cdGNvbnN0IHJlcSA9IG5ldHdvcmsucmVxdWVzdChvcHRpb25zLCAocmVzKSA9PiB7XG5cdFx0Y29uc3QgeyBzdGF0dXNDb2RlIH0gPSByZXM7XG5cblx0XHRsZXQgZXJyb3I7XG5cdFx0aWYgKHN0YXR1c0NvZGUgIT09IDIwMCkge1xuXHRcdFx0ZXJyb3IgPSBuZXcgRXJyb3IoJ1JlcXVlc3QgRmFpbGVkLlxcbicgK1xuXHRcdFx0XHRgU3RhdHVzIENvZGU6ICR7c3RhdHVzQ29kZX1gKTtcblx0XHRcdGVycm9yLmNvZGUgPSBzdGF0dXNDb2RlO1xuXHRcdH1cblxuXHRcdGlmIChlcnJvcikge1xuXHRcdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHRcdFx0Ly8gZnJlZSB1cCBtZW1vcnlcblx0XHRcdHJlcy5yZXN1bWUoKTtcblx0XHRcdHJldHVybiA7XG5cdFx0fVxuXG5cdFx0bGV0IHJhd0RhdGE7XG5cdFx0Y29uc3QgY29udGVudFR5cGUgPSByZXMuaGVhZGVyc1snY29udGVudC10eXBlJ107XG5cblx0XHRpZihjb250ZW50VHlwZSA9PT0gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIil7XG5cdFx0XHRyYXdEYXRhID0gW107XG5cdFx0fWVsc2V7XG5cdFx0XHRyYXdEYXRhID0gJyc7XG5cdFx0fVxuXG5cdFx0cmVzLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG5cdFx0XHRpZihBcnJheS5pc0FycmF5KHJhd0RhdGEpKXtcblx0XHRcdFx0cmF3RGF0YS5wdXNoKC4uLmNodW5rKTtcblx0XHRcdH1lbHNle1xuXHRcdFx0XHRyYXdEYXRhICs9IGNodW5rO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJlcy5vbignZW5kJywgKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aWYoQXJyYXkuaXNBcnJheShyYXdEYXRhKSl7XG5cdFx0XHRcdFx0cmF3RGF0YSA9IEJ1ZmZlci5mcm9tKHJhd0RhdGEpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCByYXdEYXRhKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIkNsaWVudCBlcnJvcjpcIiwgZXJyKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0cmVxLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG5cdFx0aWYoZXJyb3IgJiYgZXJyb3IuY29kZSAhPT0gJ0VDT05OUkVTRVQnKXtcbiAgICAgICAgXHRjb25zb2xlLmxvZyhcIkdFVCBFcnJvclwiLCBlcnJvcik7XG5cdFx0fVxuXG5cdFx0Y2FsbGJhY2soZXJyb3IpO1xuXHR9KTtcblxuXHRyZXEuZW5kKCk7XG59O1xuXG4kJC5yZW1vdGUuYmFzZTY0RW5jb2RlID0gZnVuY3Rpb24gYmFzZTY0RW5jb2RlKHN0cmluZ1RvRW5jb2RlKXtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oc3RyaW5nVG9FbmNvZGUpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbn07XG5cbiQkLnJlbW90ZS5iYXNlNjREZWNvZGUgPSBmdW5jdGlvbiBiYXNlNjREZWNvZGUoZW5jb2RlZFN0cmluZyl7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGVuY29kZWRTdHJpbmcsICdiYXNlNjQnKS50b1N0cmluZygnYXNjaWknKTtcbn07XG4iLCJjb25zdCBjb25zVXRpbCA9IHJlcXVpcmUoJ3NpZ25zZW5zdXMnKS5jb25zVXRpbDtcbmNvbnN0IGJlZXNIZWFsZXIgPSByZXF1aXJlKFwic3dhcm11dGlsc1wiKS5iZWVzSGVhbGVyO1xuXG5mdW5jdGlvbiBCbG9ja2NoYWluKHBkcykge1xuICAgIGxldCBzd2FybSA9IG51bGw7XG5cbiAgICB0aGlzLmJlZ2luVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAodHJhbnNhY3Rpb25Td2FybSkge1xuICAgICAgICBpZiAoIXRyYW5zYWN0aW9uU3dhcm0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBzd2FybScpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3dhcm0gPSB0cmFuc2FjdGlvblN3YXJtO1xuICAgICAgICByZXR1cm4gbmV3IFRyYW5zYWN0aW9uKHBkcy5nZXRIYW5kbGVyKCkpO1xuICAgIH07XG5cbiAgICB0aGlzLmNvbW1pdCA9IGZ1bmN0aW9uICh0cmFuc2FjdGlvbikge1xuXG4gICAgICAgIGNvbnN0IGRpZmYgPSBwZHMuY29tcHV0ZVN3YXJtVHJhbnNhY3Rpb25EaWZmKHN3YXJtLCB0cmFuc2FjdGlvbi5nZXRIYW5kbGVyKCkpO1xuICAgICAgICBjb25zdCB0ID0gY29uc1V0aWwuY3JlYXRlVHJhbnNhY3Rpb24oMCwgZGlmZik7XG4gICAgICAgIGNvbnN0IHNldCA9IHt9O1xuICAgICAgICBzZXRbdC5kaWdlc3RdID0gdDtcbiAgICAgICAgcGRzLmNvbW1pdChzZXQsIDEpO1xuICAgIH07XG59XG5cblxuZnVuY3Rpb24gVHJhbnNhY3Rpb24ocGRzSGFuZGxlcikge1xuICAgIGNvbnN0IEFMSUFTRVMgPSAnL2FsaWFzZXMnO1xuXG5cbiAgICB0aGlzLmFkZCA9IGZ1bmN0aW9uIChhc3NldCkge1xuICAgICAgICBjb25zdCBzd2FybVR5cGVOYW1lID0gYXNzZXQuZ2V0TWV0YWRhdGEoJ3N3YXJtVHlwZU5hbWUnKTtcbiAgICAgICAgY29uc3Qgc3dhcm1JZCA9IGFzc2V0LmdldE1ldGFkYXRhKCdzd2FybUlkJyk7XG5cbiAgICAgICAgY29uc3QgYWxpYXNJbmRleCA9IG5ldyBBbGlhc0luZGV4KHN3YXJtVHlwZU5hbWUpO1xuICAgICAgICBpZiAoYXNzZXQuYWxpYXMgJiYgYWxpYXNJbmRleC5nZXRVaWQoYXNzZXQuYWxpYXMpICE9PSBzd2FybUlkKSB7XG4gICAgICAgICAgICBhbGlhc0luZGV4LmNyZWF0ZShhc3NldC5hbGlhcywgc3dhcm1JZCk7XG4gICAgICAgIH1cblxuICAgICAgICBhc3NldC5zZXRNZXRhZGF0YSgncGVyc2lzdGVkJywgdHJ1ZSk7XG4gICAgICAgIGNvbnN0IHNlcmlhbGl6ZWRTd2FybSA9IGJlZXNIZWFsZXIuYXNKU09OKGFzc2V0LCBudWxsLCBudWxsKTtcblxuICAgICAgICBwZHNIYW5kbGVyLndyaXRlS2V5KHN3YXJtVHlwZU5hbWUgKyAnLycgKyBzd2FybUlkLCBKKHNlcmlhbGl6ZWRTd2FybSkpO1xuICAgIH07XG5cbiAgICB0aGlzLmxvb2t1cCA9IGZ1bmN0aW9uIChhc3NldFR5cGUsIGFpZCkgeyAvLyBhbGlhcyBzYXUgaWRcbiAgICAgICAgbGV0IGxvY2FsVWlkID0gYWlkO1xuXG4gICAgICAgIGlmIChoYXNBbGlhc2VzKGFzc2V0VHlwZSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzSW5kZXggPSBuZXcgQWxpYXNJbmRleChhc3NldFR5cGUpO1xuICAgICAgICAgICAgbG9jYWxVaWQgPSBhbGlhc0luZGV4LmdldFVpZChhaWQpIHx8IGFpZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGRzSGFuZGxlci5yZWFkS2V5KGFzc2V0VHlwZSArICcvJyArIGxvY2FsVWlkKTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gJCQuYXNzZXQuc3RhcnQoYXNzZXRUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHN3YXJtID0gJCQuYXNzZXQuY29udGludWUoYXNzZXRUeXBlLCBKU09OLnBhcnNlKHZhbHVlKSk7XG4gICAgICAgICAgICBzd2FybS5zZXRNZXRhZGF0YShcInBlcnNpc3RlZFwiLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiBzd2FybTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmxvYWRBc3NldHMgPSBmdW5jdGlvbiAoYXNzZXRUeXBlKSB7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IFtdO1xuXG4gICAgICAgIGNvbnN0IGFsaWFzSW5kZXggPSBuZXcgQWxpYXNJbmRleChhc3NldFR5cGUpO1xuICAgICAgICBPYmplY3Qua2V5cyhhbGlhc0luZGV4LmdldEFsaWFzZXMoKSkuZm9yRWFjaCgoYWxpYXMpID0+IHtcbiAgICAgICAgICAgIGFzc2V0cy5wdXNoKHRoaXMubG9va3VwKGFzc2V0VHlwZSwgYWxpYXMpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGFzc2V0cztcbiAgICB9O1xuXG4gICAgdGhpcy5nZXRIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcGRzSGFuZGxlcjtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gaGFzQWxpYXNlcyhzcGFjZU5hbWUpIHtcbiAgICAgICAgcmV0dXJuICEhcGRzSGFuZGxlci5yZWFkS2V5KHNwYWNlTmFtZSArIEFMSUFTRVMpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIEFsaWFzSW5kZXgoYXNzZXRUeXBlKSB7XG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKGFsaWFzLCB1aWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0QWxpYXNlcyA9IHRoaXMuZ2V0QWxpYXNlcygpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGFzc2V0QWxpYXNlc1thbGlhc10gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAkJC5lcnJvckhhbmRsZXIudGhyb3dFcnJvcihuZXcgRXJyb3IoYEFsaWFzICR7YWxpYXN9IGZvciBhc3NldHMgb2YgdHlwZSAke2Fzc2V0VHlwZX0gYWxyZWFkeSBleGlzdHNgKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFzc2V0QWxpYXNlc1thbGlhc10gPSB1aWQ7XG5cbiAgICAgICAgICAgIHBkc0hhbmRsZXIud3JpdGVLZXkoYXNzZXRUeXBlICsgQUxJQVNFUywgSihhc3NldEFsaWFzZXMpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldFVpZCA9IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICAgICAgY29uc3QgYXNzZXRBbGlhc2VzID0gdGhpcy5nZXRBbGlhc2VzKCk7XG4gICAgICAgICAgICByZXR1cm4gYXNzZXRBbGlhc2VzW2FsaWFzXTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldEFsaWFzZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgYWxpYXNlcyA9IHBkc0hhbmRsZXIucmVhZEtleShhc3NldFR5cGUgKyBBTElBU0VTKTtcbiAgICAgICAgICAgIHJldHVybiBhbGlhc2VzID8gSlNPTi5wYXJzZShhbGlhc2VzKSA6IHt9O1xuICAgICAgICB9O1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja2NoYWluOyIsInZhciBtZW1vcnlQRFMgPSByZXF1aXJlKFwiLi9Jbk1lbW9yeVBEU1wiKTtcbnZhciBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbnZhciBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cblxuZnVuY3Rpb24gRm9sZGVyUGVyc2lzdGVudFBEUyhmb2xkZXIpIHtcbiAgICB0aGlzLm1lbUNhY2hlID0gbWVtb3J5UERTLm5ld1BEUyh0aGlzKTtcblxuICAgIGZ1bmN0aW9uIG1rU2luZ2xlTGluZShzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bXFxuXFxyXS9nLCBcIlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQ3VycmVudFZhbHVlRmlsZW5hbWUoKSB7XG4gICAgICAgIHJldHVybiBwYXRoLm5vcm1hbGl6ZShmb2xkZXIgKyAnL2N1cnJlbnRWZXJzaW9uJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q3VycmVudFZhbHVlKHBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmKCFmcy5leGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhwYXRoKS50b1N0cmluZygpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yICcsIGUpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBlcnNpc3QgPSBmdW5jdGlvbiAodHJhbnNhY3Rpb25Mb2csIGN1cnJlbnRWYWx1ZXMsIGN1cnJlbnRQdWxzZSkge1xuXG4gICAgICAgIHRyYW5zYWN0aW9uTG9nLmN1cnJlbnRQdWxzZSA9IGN1cnJlbnRQdWxzZTtcbiAgICAgICAgdHJhbnNhY3Rpb25Mb2cgPSBta1NpbmdsZUxpbmUoSlNPTi5zdHJpbmdpZnkodHJhbnNhY3Rpb25Mb2cpKSArIFwiXFxuXCI7XG5cbiAgICAgICAgZnMubWtkaXIoZm9sZGVyLCB7cmVjdXJzaXZlOiB0cnVlfSwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XG4gICAgICAgICAgICBpZiAoZXJyICYmIGVyci5jb2RlICE9PSBcIkVFWElTVFwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmcy5hcHBlbmRGaWxlU3luYyhmb2xkZXIgKyAnL3RyYW5zYWN0aW9uc0xvZycsIHRyYW5zYWN0aW9uTG9nLCAndXRmOCcpO1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhtYWtlQ3VycmVudFZhbHVlRmlsZW5hbWUoKSwgSlNPTi5zdHJpbmdpZnkoY3VycmVudFZhbHVlcywgbnVsbCwgMSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgY29uc3QgaW5uZXJWYWx1ZXMgPSBnZXRDdXJyZW50VmFsdWUobWFrZUN1cnJlbnRWYWx1ZUZpbGVuYW1lKCkpO1xuICAgIHRoaXMubWVtQ2FjaGUuaW5pdGlhbGlzZShpbm5lclZhbHVlcyk7XG59XG5cbmV4cG9ydHMubmV3UERTID0gZnVuY3Rpb24gKGZvbGRlcikge1xuICAgIGNvbnN0IHBkcyA9IG5ldyBGb2xkZXJQZXJzaXN0ZW50UERTKGZvbGRlcik7XG4gICAgcmV0dXJuIHBkcy5tZW1DYWNoZTtcbn07XG4iLCJcbnZhciBjdXRpbCAgID0gcmVxdWlyZShcIi4uLy4uL3NpZ25zZW5zdXMvbGliL2NvbnNVdGlsXCIpO1xudmFyIHNzdXRpbCAgPSByZXF1aXJlKFwicHNrY3J5cHRvXCIpO1xuXG5cbmZ1bmN0aW9uIFN0b3JhZ2UocGFyZW50U3RvcmFnZSl7XG4gICAgdmFyIGNzZXQgICAgICAgICAgICA9IHt9OyAgLy8gY29udGFpbmVzIGFsbCBrZXlzIGluIHBhcmVudCBzdG9yYWdlLCBjb250YWlucyBvbmx5IGtleXMgdG91Y2hlZCBpbiBoYW5kbGVyc1xuICAgIHZhciB3cml0ZVNldCAgICAgICAgPSAhcGFyZW50U3RvcmFnZSA/IGNzZXQgOiB7fTsgICAvL2NvbnRhaW5zIG9ubHkga2V5cyBtb2RpZmllZCBpbiBoYW5kbGVyc1xuXG4gICAgdmFyIHJlYWRTZXRWZXJzaW9ucyAgPSB7fTsgLy9tZWFuaW5nZnVsIG9ubHkgaW4gaGFuZGxlcnNcbiAgICB2YXIgd3JpdGVTZXRWZXJzaW9ucyA9IHt9OyAvL3dpbGwgc3RvcmUgYWxsIHZlcnNpb25zIGdlbmVyYXRlZCBieSB3cml0ZUtleVxuXG4gICAgdmFyIHZzZCAgICAgICAgICAgICA9IFwiZW1wdHlcIjsgLy9vbmx5IGZvciBwYXJlbnQgc3RvcmFnZVxuICAgIHZhciBwcmV2aW91c1ZTRCAgICAgPSBudWxsO1xuXG4gICAgdmFyIG15Q3VycmVudFB1bHNlICAgID0gMDtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cblxuICAgIGZ1bmN0aW9uIGhhc0xvY2FsS2V5KG5hbWUpe1xuICAgICAgICByZXR1cm4gY3NldC5oYXNPd25Qcm9wZXJ0eShuYW1lKTtcbiAgICB9XG5cbiAgICB0aGlzLmhhc0tleSA9IGZ1bmN0aW9uKG5hbWUpe1xuICAgICAgICByZXR1cm4gcGFyZW50U3RvcmFnZSA/IHBhcmVudFN0b3JhZ2UuaGFzS2V5KG5hbWUpIDogaGFzTG9jYWxLZXkobmFtZSk7XG4gICAgfTtcblxuICAgIHRoaXMucmVhZEtleSA9IGZ1bmN0aW9uIHJlYWRLZXkobmFtZSl7XG4gICAgICAgIHZhciB2YWx1ZTtcbiAgICAgICAgaWYoaGFzTG9jYWxLZXkobmFtZSkpe1xuICAgICAgICAgICAgdmFsdWUgPSBjc2V0W25hbWVdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKHRoaXMuaGFzS2V5KG5hbWUpKXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHBhcmVudFN0b3JhZ2UucmVhZEtleShuYW1lKTtcbiAgICAgICAgICAgICAgICBjc2V0W25hbWVdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgcmVhZFNldFZlcnNpb25zW25hbWVdID0gcGFyZW50U3RvcmFnZS5nZXRWZXJzaW9uKG5hbWUpO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgY3NldFtuYW1lXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZWFkU2V0VmVyc2lvbnNbbmFtZV0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd3JpdGVTZXRWZXJzaW9uc1tuYW1lXSA9IHJlYWRTZXRWZXJzaW9uc1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0VmVyc2lvbiA9IGZ1bmN0aW9uKG5hbWUsIHJlYWxWZXJzaW9uKXtcbiAgICAgICAgdmFyIHZlcnNpb24gPSAwO1xuICAgICAgICBpZihoYXNMb2NhbEtleShuYW1lKSl7XG4gICAgICAgICAgICB2ZXJzaW9uID0gcmVhZFNldFZlcnNpb25zW25hbWVdO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKHRoaXMuaGFzS2V5KG5hbWUpKXtcbiAgICAgICAgICAgICAgICBjc2V0W25hbWVdID0gcGFyZW50U3RvcmFnZS5yZWFkS2V5KCk7XG4gICAgICAgICAgICAgICAgdmVyc2lvbiA9IHJlYWRTZXRWZXJzaW9uc1tuYW1lXSA9IHBhcmVudFN0b3JhZ2UuZ2V0VmVyc2lvbihuYW1lKTtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGNzZXRbbmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmVhZFNldFZlcnNpb25zW25hbWVdID0gdmVyc2lvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmVyc2lvbjtcbiAgICB9O1xuXG4gICAgdGhpcy53cml0ZUtleSA9IGZ1bmN0aW9uIG1vZGlmeUtleShuYW1lLCB2YWx1ZSl7XG4gICAgICAgIHZhciBrID0gdGhpcy5yZWFkS2V5KG5hbWUpOyAvL1RPRE86IHVudXNlZCB2YXJcblxuICAgICAgICBjc2V0IFtuYW1lXSA9IHZhbHVlO1xuICAgICAgICB3cml0ZVNldFZlcnNpb25zW25hbWVdKys7XG4gICAgICAgIHdyaXRlU2V0W25hbWVdID0gdmFsdWU7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0SW5wdXRPdXRwdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpbnB1dDogcmVhZFNldFZlcnNpb25zLFxuICAgICAgICAgICAgb3V0cHV0OiB3cml0ZVNldFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB0aGlzLmdldEludGVybmFsVmFsdWVzID0gZnVuY3Rpb24oY3VycmVudFB1bHNlLCB1cGRhdGVQcmV2aW91c1ZTRCl7XG4gICAgICAgIGlmKHVwZGF0ZVByZXZpb3VzVlNEKXtcbiAgICAgICAgICAgIG15Q3VycmVudFB1bHNlID0gY3VycmVudFB1bHNlO1xuICAgICAgICAgICAgcHJldmlvdXNWU0QgPSB2c2Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNzZXQ6Y3NldCxcbiAgICAgICAgICAgIHdyaXRlU2V0VmVyc2lvbnM6d3JpdGVTZXRWZXJzaW9ucyxcbiAgICAgICAgICAgIHByZXZpb3VzVlNEOnByZXZpb3VzVlNELFxuICAgICAgICAgICAgdnNkOnZzZCxcbiAgICAgICAgICAgIGN1cnJlbnRQdWxzZTpjdXJyZW50UHVsc2VcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0aWFsaXNlSW50ZXJuYWxWYWx1ZSA9IGZ1bmN0aW9uKHN0b3JlZFZhbHVlcyl7XG4gICAgICAgIGlmKCFzdG9yZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNzZXQgPSBzdG9yZWRWYWx1ZXMuY3NldDtcbiAgICAgICAgd3JpdGVTZXRWZXJzaW9ucyA9IHN0b3JlZFZhbHVlcy53cml0ZVNldFZlcnNpb25zO1xuICAgICAgICB2c2QgPSBzdG9yZWRWYWx1ZXMudnNkO1xuICAgICAgICB3cml0ZVNldCA9IGNzZXQ7XG4gICAgICAgIG15Q3VycmVudFB1bHNlID0gc3RvcmVkVmFsdWVzLmN1cnJlbnRQdWxzZTtcbiAgICAgICAgcHJldmlvdXNWU0QgPSBzdG9yZWRWYWx1ZXMucHJldmlvdXNWU0Q7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGFwcGx5VHJhbnNhY3Rpb24odCl7XG4gICAgICAgIGZvcihsZXQgayBpbiB0Lm91dHB1dCl7IFxuICAgICAgICAgICAgaWYoIXQuaW5wdXQuaGFzT3duUHJvcGVydHkoaykpe1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IobGV0IGwgaW4gdC5pbnB1dCl7XG4gICAgICAgICAgICB2YXIgdHJhbnNhY3Rpb25WZXJzaW9uID0gdC5pbnB1dFtsXTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50VmVyc2lvbiA9IHNlbGYuZ2V0VmVyc2lvbihsKTtcbiAgICAgICAgICAgIGlmKHRyYW5zYWN0aW9uVmVyc2lvbiAhPT0gY3VycmVudFZlcnNpb24pe1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2cobCwgdHJhbnNhY3Rpb25WZXJzaW9uICwgY3VycmVudFZlcnNpb24pO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihsZXQgdiBpbiB0Lm91dHB1dCl7XG4gICAgICAgICAgICBzZWxmLndyaXRlS2V5KHYsIHQub3V0cHV0W3ZdKTtcbiAgICAgICAgfVxuXG5cdFx0dmFyIGFyciA9IHByb2Nlc3MuaHJ0aW1lKCk7XG5cdFx0dmFyIGN1cnJlbnRfc2Vjb25kID0gYXJyWzBdO1xuXHRcdHZhciBkaWZmID0gY3VycmVudF9zZWNvbmQtdC5zZWNvbmQ7XG5cblx0XHRnbG9iYWxbXCJUcmFuemFjdGlvbnNfVGltZVwiXSs9ZGlmZjtcblxuXHRcdHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuY29tcHV0ZVBUQmxvY2sgPSBmdW5jdGlvbihuZXh0QmxvY2tTZXQpeyAgIC8vbWFrZSBhIHRyYW5zYWN0aW9ucyBibG9jayBmcm9tIG5leHRCbG9ja1NldCBieSByZW1vdmluZyBpbnZhbGlkIHRyYW5zYWN0aW9ucyBmcm9tIHRoZSBrZXkgdmVyc2lvbnMgcG9pbnQgb2Ygdmlld1xuICAgICAgICB2YXIgdmFsaWRCbG9jayA9IFtdO1xuICAgICAgICB2YXIgb3JkZXJlZEJ5VGltZSA9IGN1dGlsLm9yZGVyVHJhbnNhY3Rpb25zKG5leHRCbG9ja1NldCk7XG4gICAgICAgIHZhciBpID0gMDtcblxuICAgICAgICB3aGlsZShpIDwgb3JkZXJlZEJ5VGltZS5sZW5ndGgpe1xuICAgICAgICAgICAgdmFyIHQgPSBvcmRlcmVkQnlUaW1lW2ldO1xuICAgICAgICAgICAgaWYoYXBwbHlUcmFuc2FjdGlvbih0KSl7XG4gICAgICAgICAgICAgICAgdmFsaWRCbG9jay5wdXNoKHQuZGlnZXN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsaWRCbG9jaztcbiAgICB9O1xuXG4gICAgdGhpcy5jb21taXQgPSBmdW5jdGlvbihibG9ja1NldCl7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIG9yZGVyZWRCeVRpbWUgPSBjdXRpbC5vcmRlclRyYW5zYWN0aW9ucyhibG9ja1NldCk7XG5cbiAgICAgICAgd2hpbGUoaSA8IG9yZGVyZWRCeVRpbWUubGVuZ3RoKXtcbiAgICAgICAgICAgIHZhciB0ID0gb3JkZXJlZEJ5VGltZVtpXTtcbiAgICAgICAgICAgIGlmKCFhcHBseVRyYW5zYWN0aW9uKHQpKXsgLy9wYXJhbm9pZCBjaGVjaywgIGZhaWwgdG8gd29yayBpZiBhIG1ham9yaXR5IGlzIGNvcnJ1cHRlZFxuICAgICAgICAgICAgICAgIC8vcHJldHR5IGJhZFxuICAgICAgICAgICAgICAgIC8vdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIGNvbW1pdCBhbiBpbnZhbGlkIGJsb2NrLiBUaGlzIGNvdWxkIGJlIGEgbmFzdHkgYnVnIG9yIHRoZSBzdGFrZWhvbGRlcnMgbWFqb3JpdHkgaXMgY29ycnVwdGVkISBJdCBzaG91bGQgbmV2ZXIgaGFwcGVuIVwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBjb21taXQgYW4gaW52YWxpZCBibG9jay4gVGhpcyBjb3VsZCBiZSBhIG5hc3R5IGJ1ZyBvciB0aGUgc3Rha2Vob2xkZXJzIG1ham9yaXR5IGlzIGNvcnJ1cHRlZCEgSXQgc2hvdWxkIG5ldmVyIGhhcHBlbiFcIik7IC8vVE9ETzogcmVwbGFjZSB3aXRoIGJldHRlciBlcnJvciBoYW5kbGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ2V0VlNEKHRydWUpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFZTRCA9IGZ1bmN0aW9uKGZvcmNlQ2FsY3VsYXRpb24pe1xuICAgICAgICBpZihmb3JjZUNhbGN1bGF0aW9uKXtcbiAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLmdldEludGVybmFsVmFsdWVzKG15Q3VycmVudFB1bHNlLCB0cnVlKTtcbiAgICAgICAgICAgIHZzZCA9IHNzdXRpbC5oYXNoVmFsdWVzKHRtcCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZzZDtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBJbk1lbW9yeVBEUyhwZXJtYW5lbnRQZXJzaXN0ZW5jZSl7XG5cbiAgICB2YXIgbWFpblN0b3JhZ2UgPSBuZXcgU3RvcmFnZShudWxsKTtcblxuXG4gICAgdGhpcy5nZXRIYW5kbGVyID0gZnVuY3Rpb24oKXsgLy8gYSB3YXkgdG8gd29yayB3aXRoIFBEU1xuICAgICAgICB2YXIgdGVtcFN0b3JhZ2UgPSBuZXcgU3RvcmFnZShtYWluU3RvcmFnZSk7XG4gICAgICAgIHJldHVybiB0ZW1wU3RvcmFnZTtcbiAgICB9O1xuXG4gICAgdGhpcy5jb21wdXRlU3dhcm1UcmFuc2FjdGlvbkRpZmYgPSBmdW5jdGlvbihzd2FybSwgZm9ya2VkUGRzKXtcbiAgICAgICAgdmFyIGlucE91dHAgICAgID0gZm9ya2VkUGRzLmdldElucHV0T3V0cHV0KCk7XG4gICAgICAgIHN3YXJtLmlucHV0ICAgICA9IGlucE91dHAuaW5wdXQ7XG4gICAgICAgIHN3YXJtLm91dHB1dCAgICA9IGlucE91dHAub3V0cHV0O1xuICAgICAgICByZXR1cm4gc3dhcm07XG4gICAgfTtcblxuICAgIHRoaXMuY29tcHV0ZVBUQmxvY2sgPSBmdW5jdGlvbihuZXh0QmxvY2tTZXQpe1xuICAgICAgICB2YXIgdGVtcFN0b3JhZ2UgPSBuZXcgU3RvcmFnZShtYWluU3RvcmFnZSk7XG4gICAgICAgIHJldHVybiB0ZW1wU3RvcmFnZS5jb21wdXRlUFRCbG9jayhuZXh0QmxvY2tTZXQpO1xuXG4gICAgfTtcblxuICAgIHRoaXMuY29tbWl0ID0gZnVuY3Rpb24oYmxvY2tTZXQsIGN1cnJlbnRQdWxzZSl7XG4gICAgICAgIG1haW5TdG9yYWdlLmNvbW1pdChibG9ja1NldCk7XG4gICAgICAgIGlmKHBlcm1hbmVudFBlcnNpc3RlbmNlKSB7XG4gICAgICAgICAgICBwZXJtYW5lbnRQZXJzaXN0ZW5jZS5wZXJzaXN0KGJsb2NrU2V0LCBtYWluU3RvcmFnZS5nZXRJbnRlcm5hbFZhbHVlcyhjdXJyZW50UHVsc2UsIGZhbHNlKSwgY3VycmVudFB1bHNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLmdldFZTRCA9IGZ1bmN0aW9uICgpe1xuICAgICAgICByZXR1cm4gbWFpblN0b3JhZ2UuZ2V0VlNEKGZhbHNlKTtcbiAgICB9O1xuXG4gICAgdGhpcy5pbml0aWFsaXNlID0gZnVuY3Rpb24oc2F2ZWRJbnRlcm5hbFZhbHVlcyl7XG4gICAgICAgIG1haW5TdG9yYWdlLmluaXRpYWxpc2VJbnRlcm5hbFZhbHVlKHNhdmVkSW50ZXJuYWxWYWx1ZXMpO1xuICAgIH07XG5cbn1cblxuXG5leHBvcnRzLm5ld1BEUyA9IGZ1bmN0aW9uKHBlcnNpc3RlbmNlKXtcbiAgICByZXR1cm4gbmV3IEluTWVtb3J5UERTKHBlcnNpc3RlbmNlKTtcbn07IiwiY29uc3QgbWVtb3J5UERTID0gcmVxdWlyZShcIi4vSW5NZW1vcnlQRFNcIik7XG5cbmZ1bmN0aW9uIFBlcnNpc3RlbnRQRFMoe2dldEluaXRWYWx1ZXMsIHBlcnNpc3R9KSB7XG5cdHRoaXMubWVtQ2FjaGUgPSBtZW1vcnlQRFMubmV3UERTKHRoaXMpO1xuXHR0aGlzLnBlcnNpc3QgPSBwZXJzaXN0O1xuXG5cdGNvbnN0IGlubmVyVmFsdWVzID0gZ2V0SW5pdFZhbHVlcygpIHx8IG51bGw7XG5cdHRoaXMubWVtQ2FjaGUuaW5pdGlhbGlzZShpbm5lclZhbHVlcyk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMubmV3UERTID0gZnVuY3Rpb24gKHJlYWRlcldyaXRlcikge1xuXHRjb25zdCBwZHMgPSBuZXcgUGVyc2lzdGVudFBEUyhyZWFkZXJXcml0ZXIpO1xuXHRyZXR1cm4gcGRzLm1lbUNhY2hlO1xufTtcbiIsIlxuJCQuYXNzZXQuZGVzY3JpYmUoXCJBQ0xTY29wZVwiLCB7XG4gICAgcHVibGljOntcbiAgICAgICAgY29uY2VybjpcInN0cmluZzprZXlcIixcbiAgICAgICAgZGI6XCJqc29uXCJcbiAgICB9LFxuICAgIGluaXQ6ZnVuY3Rpb24oY29uY2Vybil7XG4gICAgICAgIHRoaXMuY29uY2VybiA9IGNvbmNlcm47XG4gICAgfSxcbiAgICBhZGRSZXNvdXJjZVBhcmVudCA6IGZ1bmN0aW9uKHJlc291cmNlSWQsIHBhcmVudElkKXtcbiAgICAgICAgLy9UT0RPOiBlbXB0eSBmdW5jdGlvbnMhXG4gICAgfSxcbiAgICBhZGRab25lUGFyZW50IDogZnVuY3Rpb24oem9uZUlkLCBwYXJlbnRJZCl7XG4gICAgICAgIC8vVE9ETzogZW1wdHkgZnVuY3Rpb25zIVxuICAgIH0sXG4gICAgZ3JhbnQgOmZ1bmN0aW9uKGFnZW50SWQsICByZXNvdXJjZUlkKXtcbiAgICAgICAgLy9UT0RPOiBlbXB0eSBmdW5jdGlvbnMhXG4gICAgfSxcbiAgICBhbGxvdyA6ZnVuY3Rpb24oYWdlbnRJZCwgIHJlc291cmNlSWQpe1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KTsiLCJcbiQkLmFzc2V0LmRlc2NyaWJlKFwiQWdlbnRcIiwge1xuICAgIHB1YmxpYzp7XG4gICAgICAgIGFsaWFzOlwic3RyaW5nOmtleVwiLFxuICAgICAgICBwdWJsaWNLZXk6XCJzdHJpbmdcIlxuICAgIH0sXG4gICAgaW5pdDpmdW5jdGlvbihhbGlhcywgdmFsdWUpe1xuICAgICAgICB0aGlzLmFsaWFzICAgICAgPSBhbGlhcztcbiAgICAgICAgdGhpcy5wdWJsaWNLZXkgID0gdmFsdWU7XG4gICAgfSxcbiAgICB1cGRhdGU6ZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICB0aGlzLnB1YmxpY0tleSA9IHZhbHVlO1xuICAgIH0sXG4gICAgYWRkQWdlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgSW1wbGVtZW50ZWQnKTtcbiAgICB9LFxuICAgIGxpc3RBZ2VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuXG4gICAgfSxcbiAgICByZW1vdmVBZ2VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuXG4gICAgfVxufSk7IiwiXG4kJC5hc3NldC5kZXNjcmliZShcIkJhY2t1cFwiLCB7XG4gICAgcHVibGljOntcbiAgICAgICAgaWQ6ICBcInN0cmluZ1wiLFxuICAgICAgICB1cmw6IFwic3RyaW5nXCJcbiAgICB9LFxuXG4gICAgaW5pdDpmdW5jdGlvbihpZCwgdXJsKXtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcbiAgICB9XG59KTtcbiIsIlxuJCQuYXNzZXQuZGVzY3JpYmUoXCJDU0JNZXRhXCIsIHtcblx0cHVibGljOntcblx0XHRpc01hc3RlcjpcInN0cmluZ1wiLFxuXHRcdGFsaWFzOlwic3RyaW5nOmtleVwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcInN0cmluZ1wiLFxuXHRcdGNyZWF0aW9uRGF0ZTogXCJzdHJpbmdcIixcblx0XHR1cGRhdGVkRGF0ZSA6IFwic3RyaW5nXCIsXG5cdFx0aWQ6IFwic3RyaW5nXCIsXG5cdFx0aWNvbjogXCJzdHJpbmdcIlxuXHR9LFxuXHRpbml0OmZ1bmN0aW9uKGlkKXtcblx0XHR0aGlzLmFsaWFzID0gXCJtZXRhXCI7XG5cdFx0dGhpcy5pZCA9IGlkO1xuXHR9LFxuXG5cdHNldElzTWFzdGVyOiBmdW5jdGlvbiAoaXNNYXN0ZXIpIHtcblx0XHR0aGlzLmlzTWFzdGVyID0gaXNNYXN0ZXI7XG5cdH1cblxufSk7XG4iLCJcbiQkLmFzc2V0LmRlc2NyaWJlKFwiQ1NCUmVmZXJlbmNlXCIsIHtcbiAgICBwdWJsaWM6e1xuICAgICAgICBhbGlhczpcInN0cmluZzprZXlcIixcbiAgICAgICAgc2VlZCA6XCJzdHJpbmdcIixcbiAgICAgICAgZHNlZWQ6XCJzdHJpbmdcIlxuICAgIH0sXG4gICAgaW5pdDpmdW5jdGlvbihhbGlhcywgc2VlZCwgZHNlZWQgKXtcbiAgICAgICAgdGhpcy5hbGlhcyA9IGFsaWFzO1xuICAgICAgICB0aGlzLnNlZWQgID0gc2VlZDtcbiAgICAgICAgdGhpcy5kc2VlZCA9IGRzZWVkO1xuICAgIH0sXG4gICAgdXBkYXRlOmZ1bmN0aW9uKGZpbmdlcnByaW50KXtcbiAgICAgICAgdGhpcy5maW5nZXJwcmludCA9IGZpbmdlcnByaW50O1xuICAgICAgICB0aGlzLnZlcnNpb24rKztcbiAgICB9LFxuICAgIHJlZ2lzdGVyQmFja3VwVXJsOmZ1bmN0aW9uKGJhY2t1cFVybCl7XG4gICAgICAgIHRoaXMuYmFja3Vwcy5hZGQoYmFja3VwVXJsKTtcbiAgICB9XG59KTtcbiIsIlxuJCQuYXNzZXQuZGVzY3JpYmUoXCJEb21haW5SZWZlcmVuY2VcIiwge1xuICAgIHB1YmxpYzp7XG4gICAgICAgIHJvbGU6XCJzdHJpbmc6aW5kZXhcIixcbiAgICAgICAgYWxpYXM6XCJzdHJpbmc6a2V5XCIsXG4gICAgICAgIGFkZHJlc3NlczpcIm1hcFwiLFxuICAgICAgICBjb25zdGl0dXRpb246XCJzdHJpbmdcIixcbiAgICAgICAgd29ya3NwYWNlOlwic3RyaW5nXCIsXG4gICAgICAgIHJlbW90ZUludGVyZmFjZXM6XCJtYXBcIixcbiAgICAgICAgbG9jYWxJbnRlcmZhY2VzOlwibWFwXCJcbiAgICB9LFxuICAgIGluaXQ6ZnVuY3Rpb24ocm9sZSwgYWxpYXMpe1xuICAgICAgICB0aGlzLnJvbGUgPSByb2xlO1xuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXM7XG4gICAgICAgIHRoaXMuYWRkcmVzc2VzID0ge307XG4gICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlcyA9IHt9O1xuICAgICAgICB0aGlzLmxvY2FsSW50ZXJmYWNlcyA9IHt9O1xuICAgIH0sXG4gICAgdXBkYXRlRG9tYWluQWRkcmVzczpmdW5jdGlvbihyZXBsaWNhdGlvbkFnZW50LCBhZGRyZXNzKXtcbiAgICAgICAgaWYoIXRoaXMuYWRkcmVzc2VzKXtcbiAgICAgICAgICAgIHRoaXMuYWRkcmVzc2VzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hZGRyZXNzZXNbcmVwbGljYXRpb25BZ2VudF0gPSBhZGRyZXNzO1xuICAgIH0sXG4gICAgcmVtb3ZlRG9tYWluQWRkcmVzczpmdW5jdGlvbihyZXBsaWNhdGlvbkFnZW50KXtcbiAgICAgICAgdGhpcy5hZGRyZXNzZXNbcmVwbGljYXRpb25BZ2VudF0gPSB1bmRlZmluZWQ7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmFkZHJlc3Nlc1tyZXBsaWNhdGlvbkFnZW50XTtcbiAgICB9LFxuICAgIGFkZFJlbW90ZUludGVyZmFjZTpmdW5jdGlvbihhbGlhcywgcmVtb3RlRW5kUG9pbnQpe1xuICAgICAgICBpZighdGhpcy5yZW1vdGVJbnRlcmZhY2VzKXtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlcyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlc1thbGlhc10gPSByZW1vdGVFbmRQb2ludDtcbiAgICB9LFxuICAgIHJlbW92ZVJlbW90ZUludGVyZmFjZTpmdW5jdGlvbihhbGlhcyl7XG4gICAgICAgIGlmKHRoaXMucmVtb3RlSW50ZXJmYWNlKXtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlSW50ZXJmYWNlc1thbGlhc10gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5yZW1vdGVJbnRlcmZhY2VzW2FsaWFzXTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYWRkTG9jYWxJbnRlcmZhY2U6ZnVuY3Rpb24oYWxpYXMsIHBhdGgpe1xuICAgICAgICBpZighdGhpcy5sb2NhbEludGVyZmFjZXMpe1xuICAgICAgICAgICAgdGhpcy5sb2NhbEludGVyZmFjZXMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvY2FsSW50ZXJmYWNlc1thbGlhc10gPSBwYXRoO1xuICAgIH0sXG4gICAgcmVtb3ZlTG9jYWxJbnRlcmZhY2U6ZnVuY3Rpb24oYWxpYXMpe1xuICAgICAgICBpZih0aGlzLmxvY2FsSW50ZXJmYWNlcyl7XG4gICAgICAgICAgICB0aGlzLmxvY2FsSW50ZXJmYWNlc1thbGlhc10gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEludGVyZmFjZXNbYWxpYXNdO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZXRDb25zdGl0dXRpb246ZnVuY3Rpb24ocGF0aE9yVXJsT3JDU0Ipe1xuICAgICAgICB0aGlzLmNvbnN0aXR1dGlvbiA9IHBhdGhPclVybE9yQ1NCO1xuICAgIH0sXG4gICAgZ2V0Q29uc3RpdHV0aW9uOmZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0aXR1dGlvbjtcbiAgICB9LFxuICAgIHNldFdvcmtzcGFjZTpmdW5jdGlvbihwYXRoKXtcbiAgICAgICAgdGhpcy53b3Jrc3BhY2UgPSBwYXRoO1xuICAgIH0sXG4gICAgZ2V0V29ya3NwYWNlOmZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiB0aGlzLndvcmtzcGFjZTtcbiAgICB9XG59KTsiLCIkJC5hc3NldC5kZXNjcmliZShcIkVtYmVkZGVkRmlsZVwiLCB7XG5cdHB1YmxpYzp7XG5cdFx0YWxpYXM6XCJzdHJpbmdcIlxuXHR9LFxuXG5cdGluaXQ6ZnVuY3Rpb24oYWxpYXMpe1xuXHRcdHRoaXMuYWxpYXMgPSBhbGlhcztcblx0fVxufSk7IiwiJCQuYXNzZXQuZGVzY3JpYmUoXCJGaWxlUmVmZXJlbmNlXCIsIHtcblx0cHVibGljOntcblx0XHRhbGlhczpcInN0cmluZ1wiLFxuXHRcdHNlZWQgOlwic3RyaW5nXCIsXG5cdFx0ZHNlZWQ6XCJzdHJpbmdcIlxuXHR9LFxuXHRpbml0OmZ1bmN0aW9uKGFsaWFzLCBzZWVkLCBkc2VlZCl7XG5cdFx0dGhpcy5hbGlhcyA9IGFsaWFzO1xuXHRcdHRoaXMuc2VlZCAgPSBzZWVkO1xuXHRcdHRoaXMuZHNlZWQgPSBkc2VlZDtcblx0fVxufSk7IiwiXG4kJC5hc3NldC5kZXNjcmliZShcImtleVwiLCB7XG4gICAgcHVibGljOntcbiAgICAgICAgYWxpYXM6XCJzdHJpbmdcIlxuICAgIH0sXG4gICAgaW5pdDpmdW5jdGlvbihhbGlhcywgdmFsdWUpe1xuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXM7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9LFxuICAgIHVwZGF0ZTpmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9ICQkLmxpYnJhcnkoZnVuY3Rpb24oKXtcbiAgICByZXF1aXJlKFwiLi9Eb21haW5SZWZlcmVuY2VcIik7XG4gICAgcmVxdWlyZShcIi4vQ1NCUmVmZXJlbmNlXCIpO1xuICAgIHJlcXVpcmUoXCIuL0FnZW50XCIpO1xuICAgIHJlcXVpcmUoXCIuL0JhY2t1cFwiKTtcbiAgICByZXF1aXJlKFwiLi9BQ0xTY29wZVwiKTtcbiAgICByZXF1aXJlKFwiLi9LZXlcIik7XG4gICAgcmVxdWlyZShcIi4vdHJhbnNhY3Rpb25zXCIpO1xuICAgIHJlcXVpcmUoXCIuL0ZpbGVSZWZlcmVuY2VcIik7XG4gICAgcmVxdWlyZShcIi4vRW1iZWRkZWRGaWxlXCIpO1xuICAgIHJlcXVpcmUoJy4vQ1NCTWV0YScpO1xufSk7IiwiJCQudHJhbnNhY3Rpb24uZGVzY3JpYmUoXCJ0cmFuc2FjdGlvbnNcIiwge1xuICAgIHVwZGF0ZUtleTogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIHRyYW5zYWN0aW9uID0gJCQuYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHRoaXMpO1xuICAgICAgICB2YXIga2V5ID0gdHJhbnNhY3Rpb24ubG9va3VwKFwiS2V5XCIsIGtleSk7XG4gICAgICAgIHZhciBrZXlQZXJtaXNzaW9ucyA9IHRyYW5zYWN0aW9uLmxvb2t1cChcIkFDTFNjb3BlXCIsIFwiS2V5c0NvbmNlcm5cIik7XG4gICAgICAgIGlmIChrZXlQZXJtaXNzaW9ucy5hbGxvdyh0aGlzLmFnZW50SWQsIGtleSkpIHtcbiAgICAgICAgICAgIGtleS51cGRhdGUodmFsdWUpO1xuICAgICAgICAgICAgdHJhbnNhY3Rpb24uYWRkKGtleSk7XG4gICAgICAgICAgICAkJC5ibG9ja2NoYWluLmNvbW1pdCh0cmFuc2FjdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnNlY3VyaXR5RXJyb3IoXCJBZ2VudCBcIiArIHRoaXMuYWdlbnRJZCArIFwiIGRlbmllZCB0byBjaGFuZ2Uga2V5IFwiICsga2V5KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYWRkQ2hpbGQ6IGZ1bmN0aW9uIChhbGlhcykge1xuICAgICAgICB2YXIgdHJhbnNhY3Rpb24gPSAkJC5ibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oKTtcbiAgICAgICAgdmFyIHJlZmVyZW5jZSA9ICQkLmNvbnRyYWN0LnN0YXJ0KFwiRG9tYWluUmVmZXJlbmNlXCIsIFwiaW5pdFwiLCBcImNoaWxkXCIsIGFsaWFzKTtcbiAgICAgICAgdHJhbnNhY3Rpb24uYWRkKHJlZmVyZW5jZSk7XG4gICAgICAgICQkLmJsb2NrY2hhaW4uY29tbWl0KHRyYW5zYWN0aW9uKTtcbiAgICB9LFxuICAgIGFkZFBhcmVudDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciByZWZlcmVuY2UgPSAkJC5jb250cmFjdC5zdGFydChcIkRvbWFpblJlZmVyZW5jZVwiLCBcImluaXRcIiwgXCJjaGlsZFwiLCBhbGlhcyk7XG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb24uc2F2ZShyZWZlcmVuY2UpO1xuICAgICAgICAkJC5ibG9ja2NoYWluLnBlcnNpc3QodGhpcy50cmFuc2FjdGlvbik7XG4gICAgfSxcbiAgICBhZGRBZ2VudDogZnVuY3Rpb24gKGFsaWFzLCBwdWJsaWNLZXkpIHtcbiAgICAgICAgdmFyIHJlZmVyZW5jZSA9ICQkLmNvbnRyYWN0LnN0YXJ0KFwiQWdlbnRcIiwgXCJpbml0XCIsIGFsaWFzLCBwdWJsaWNLZXkpO1xuICAgICAgICB0aGlzLnRyYW5zYWN0aW9uLnNhdmUocmVmZXJlbmNlKTtcbiAgICAgICAgJCQuYmxvY2tjaGFpbi5wZXJzaXN0KHRoaXMudHJhbnNhY3Rpb24pO1xuICAgIH0sXG4gICAgdXBkYXRlQWdlbnQ6IGZ1bmN0aW9uIChhbGlhcywgcHVibGljS2V5KSB7XG4gICAgICAgIHZhciBhZ2VudCA9IHRoaXMudHJhbnNhY3Rpb24ubG9va3VwKFwiQWdlbnRcIiwgYWxpYXMpO1xuICAgICAgICBhZ2VudC51cGRhdGUocHVibGljS2V5KTtcbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbi5zYXZlKHJlZmVyZW5jZSk7XG4gICAgICAgICQkLmJsb2NrY2hhaW4ucGVyc2lzdCh0aGlzLnRyYW5zYWN0aW9uKTtcbiAgICB9XG59KTtcblxuXG4kJC5uZXdUcmFuc2FjdGlvbiA9IGZ1bmN0aW9uKHRyYW5zYWN0aW9uRmxvdyxjdG9yLC4uLmFyZ3Mpe1xuICAgIHZhciB0cmFuc2FjdGlvbiA9ICQkLnN3YXJtLnN0YXJ0KCB0cmFuc2FjdGlvbkZsb3cpO1xuICAgIHRyYW5zYWN0aW9uLm1ldGEoXCJhZ2VudElkXCIsICQkLmN1cnJlbnRBZ2VudElkKTtcbiAgICB0cmFuc2FjdGlvbi5tZXRhKFwiY29tbWFuZFwiLCBcInJ1bkV2ZXJ5V2hlcmVcIik7XG4gICAgdHJhbnNhY3Rpb24ubWV0YShcImN0b3JcIiwgY3Rvcik7XG4gICAgdHJhbnNhY3Rpb24ubWV0YShcImFyZ3NcIiwgYXJncyk7XG4gICAgdHJhbnNhY3Rpb24uc2lnbigpO1xuICAgIC8vJCQuYmxvY2tjaGFpbi5zZW5kRm9yQ29uc2VudCh0cmFuc2FjdGlvbik7XG4gICAgLy90ZW1wb3JhcnkgdW50aWwgY29uc2VudCBsYXllciBpcyBhY3RpdmF0ZWRcbiAgICB0cmFuc2FjdGlvbltjdG9yXS5hcHBseSh0cmFuc2FjdGlvbixhcmdzKTtcbn07XG5cbi8qXG51c2FnZXM6XG4gICAgJCQubmV3VHJhbnNhY3Rpb24oXCJkb21haW4udHJhbnNhY3Rpb25zXCIsIFwidXBkYXRlS2V5XCIsIFwia2V5XCIsIFwidmFsdWVcIilcblxuICovXG4iLCIvLyBjb25zdCBzaGFyZWRQaGFzZXMgPSByZXF1aXJlKCcuL3NoYXJlZFBoYXNlcycpO1xuLy8gY29uc3QgYmVlc0hlYWxlciA9IHJlcXVpcmUoJ3N3YXJtdXRpbHMnKS5iZWVzSGVhbGVyO1xuXG4kJC5zd2FybXMuZGVzY3JpYmUoXCJhZ2VudHNcIiwge1xuICAgIGFkZDogZnVuY3Rpb24gKGFsaWFzLCBwdWJsaWNLZXkpIHtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSAkJC5ibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuICAgICAgICBjb25zdCBhZ2VudEFzc2V0ID0gdHJhbnNhY3Rpb24ubG9va3VwKCdnbG9iYWwuQWdlbnQnLCBhbGlhcyk7XG5cbiAgICAgICAgYWdlbnRBc3NldC5pbml0KGFsaWFzLCBwdWJsaWNLZXkpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb24uYWRkKGFnZW50QXNzZXQpO1xuXG4gICAgICAgICAgICAkJC5ibG9ja2NoYWluLmNvbW1pdCh0cmFuc2FjdGlvbik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKFwiQWdlbnQgYWxyZWFkeSBleGlzdHNcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXR1cm4obnVsbCwgYWxpYXMpO1xuICAgIH0sXG59KTtcbiIsImNvbnN0IHNoYXJlZFBoYXNlcyA9IHJlcXVpcmUoJy4vc2hhcmVkUGhhc2VzJyk7XG5jb25zdCBiZWVzSGVhbGVyID0gcmVxdWlyZSgnc3dhcm11dGlscycpLmJlZXNIZWFsZXI7XG5cbiQkLnN3YXJtcy5kZXNjcmliZShcImRvbWFpbnNcIiwge1xuICAgIGFkZDogZnVuY3Rpb24gKHJvbGUsIGFsaWFzKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gJCQuYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHt9KTtcbiAgICAgICAgY29uc3QgZG9tYWluc1N3YXJtID0gdHJhbnNhY3Rpb24ubG9va3VwKCdnbG9iYWwuRG9tYWluUmVmZXJlbmNlJywgYWxpYXMpO1xuXG4gICAgICAgIGlmICghZG9tYWluc1N3YXJtKSB7XG4gICAgICAgICAgICB0aGlzLnJldHVybihuZXcgRXJyb3IoJ0NvdWxkIG5vdCBmaW5kIHN3YXJtIG5hbWVkIFwiZ2xvYmFsLkRvbWFpblJlZmVyZW5jZVwiJykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZG9tYWluc1N3YXJtLmluaXQocm9sZSwgYWxpYXMpO1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hZGQoZG9tYWluc1N3YXJtKTtcblxuICAgICAgICAgICAgJCQuYmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuICAgICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICAgICAgIHRoaXMucmV0dXJuKG5ldyBFcnJvcihcIkRvbWFpbiBhbGxyZWFkeSBleGlzdHMhXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmV0dXJuKG51bGwsIGFsaWFzKTtcbiAgICB9LFxuICAgIGdldERvbWFpbkRldGFpbHM6ZnVuY3Rpb24oYWxpYXMpe1xuICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9ICQkLmJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG4gICAgICAgIGNvbnN0IGRvbWFpbiA9IHRyYW5zYWN0aW9uLmxvb2t1cCgnZ2xvYmFsLkRvbWFpblJlZmVyZW5jZScsIGFsaWFzKTtcblxuICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBzd2FybSBuYW1lZCBcImdsb2JhbC5Eb21haW5SZWZlcmVuY2VcIicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmV0dXJuKG51bGwsIGJlZXNIZWFsZXIuYXNKU09OKGRvbWFpbikucHVibGljVmFycyk7XG4gICAgfSxcbiAgICBjb25uZWN0RG9tYWluVG9SZW1vdGUoZG9tYWluTmFtZSwgYWxpYXMsIHJlbW90ZUVuZFBvaW50KXtcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSAkJC5ibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuICAgICAgICBjb25zdCBkb21haW4gPSB0cmFuc2FjdGlvbi5sb29rdXAoJ2dsb2JhbC5Eb21haW5SZWZlcmVuY2UnLCBkb21haW5OYW1lKTtcblxuICAgICAgICBpZiAoIWRvbWFpbikge1xuICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKCdDb3VsZCBub3QgZmluZCBzd2FybSBuYW1lZCBcImdsb2JhbC5Eb21haW5SZWZlcmVuY2VcIicpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGRvbWFpbi5hZGRSZW1vdGVJbnRlcmZhY2UoYWxpYXMsIHJlbW90ZUVuZFBvaW50KTtcblxuICAgICAgICB0cnl7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbi5hZGQoZG9tYWluKTtcblxuICAgICAgICAgICAgJCQuYmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuICAgICAgICB9Y2F0Y2goZXJyKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICB0aGlzLnJldHVybihuZXcgRXJyb3IoXCJEb21haW4gdXBkYXRlIGZhaWxlZCFcIikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZXR1cm4obnVsbCwgYWxpYXMpO1xuICAgIH0sXG4gICAgLy8gZ2V0RG9tYWluRGV0YWlsczogc2hhcmVkUGhhc2VzLmdldEFzc2V0RmFjdG9yeSgnZ2xvYmFsLkRvbWFpblJlZmVyZW5jZScpLFxuICAgIGdldERvbWFpbnM6IHNoYXJlZFBoYXNlcy5nZXRBbGxBc3NldHNGYWN0b3J5KCdnbG9iYWwuRG9tYWluUmVmZXJlbmNlJylcbn0pO1xuIiwicmVxdWlyZSgnLi9kb21haW5Td2FybXMnKTtcbnJlcXVpcmUoJy4vYWdlbnRzU3dhcm0nKTsiLCJjb25zdCBiZWVzSGVhbGVyID0gcmVxdWlyZShcInN3YXJtdXRpbHNcIikuYmVlc0hlYWxlcjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2V0QXNzZXRGYWN0b3J5OiBmdW5jdGlvbihhc3NldFR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGFsaWFzKSB7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9ICQkLmJsb2NrY2hhaW4uYmVnaW5UcmFuc2FjdGlvbih7fSk7XG4gICAgICAgICAgICBjb25zdCBkb21haW5SZWZlcmVuY2VTd2FybSA9IHRyYW5zYWN0aW9uLmxvb2t1cChhc3NldFR5cGUsIGFsaWFzKTtcblxuICAgICAgICAgICAgaWYoIWRvbWFpblJlZmVyZW5jZVN3YXJtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXR1cm4obmV3IEVycm9yKGBDb3VsZCBub3QgZmluZCBzd2FybSBuYW1lZCBcIiR7YXNzZXRUeXBlfVwiYCkpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXR1cm4odW5kZWZpbmVkLCBiZWVzSGVhbGVyLmFzSlNPTihkb21haW5SZWZlcmVuY2VTd2FybSkpO1xuICAgICAgICB9O1xuICAgIH0sXG4gICAgZ2V0QWxsQXNzZXRzRmFjdG9yeTogZnVuY3Rpb24oYXNzZXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gJCQuYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHt9KTtcbiAgICAgICAgICAgIGNvbnN0IGRvbWFpbnMgPSB0cmFuc2FjdGlvbi5sb2FkQXNzZXRzKGFzc2V0VHlwZSkgfHwgW107XG5cbiAgICAgICAgICAgIHRoaXMucmV0dXJuKHVuZGVmaW5lZCwgZG9tYWlucy5tYXAoKGRvbWFpbikgPT4gYmVlc0hlYWxlci5hc0pTT04oZG9tYWluKSkpO1xuICAgICAgICB9O1xuICAgIH1cbn07IiwiIGZ1bmN0aW9uIENTQkNhY2hlKG1heFNpemUpIHtcblxuICAgICBsZXQgY2FjaGUgPSB7fTtcbiAgICBsZXQgc2l6ZSA9IDA7XG4gICAgY29uc3QgY2xlYXJpbmdSYXRpbyA9IDAuNTtcblxuXG4gICAgdGhpcy5sb2FkID0gZnVuY3Rpb24gKHVpZCkge1xuICAgICAgICAvLyBpZiAoY2FjaGVbdWlkXSkge1xuICAgICAgICAvLyAgICAgY2FjaGVbdWlkXS5jb3VudCArPSAxO1xuICAgICAgICAvLyAgICAgcmV0dXJuIGNhY2hlW3VpZF0uaW5zdGFuY2U7XG4gICAgICAgIC8vIH1cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH07XG5cbiAgICB0aGlzLnB1dCA9IGZ1bmN0aW9uICh1aWQsIG9iaikge1xuICAgICAgICBpZiAoc2l6ZSA+IG1heFNpemUpIHtcbiAgICAgICAgICAgIGNsZWFyKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzaXplKys7XG4gICAgICAgICAgICBjYWNoZVt1aWRdID0ge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlOiBvYmosXG4gICAgICAgICAgICAgICAgY291bnQ6IDBcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1pbnRlcm5hbCBtZXRob2RzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICAgICAgc2l6ZSA9IG1heFNpemUgLSBNYXRoLnJvdW5kKGNsZWFyaW5nUmF0aW8gKiBtYXhTaXplKTtcblxuICAgICAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXMoY2FjaGUpO1xuICAgICAgICBjYWNoZSA9IGVudHJpZXNcbiAgICAgICAgICAgIC5zb3J0KChhcnIxLCBhcnIyKSA9PiBhcnIyWzFdLmNvdW50IC0gYXJyMVsxXS5jb3VudClcbiAgICAgICAgICAgIC5zbGljZSgwLCBzaXplKVxuICAgICAgICAgICAgLnJlZHVjZSgob2JqLCBbIGssIHYgXSkgPT4ge1xuICAgICAgICAgICAgICAgIG9ialtrXSA9IHY7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgICAgIH0sIHt9KTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ1NCQ2FjaGU7XG4iLCJjb25zdCBjcnlwdG8gPSByZXF1aXJlKFwicHNrY3J5cHRvXCIpO1xuXG5cbmZ1bmN0aW9uIENTQklkZW50aWZpZXIoaWQsIGJhY2t1cFVybHMsIGtleUxlbiA9IDMyKSB7XG4gICAgbGV0IHNlZWQ7XG4gICAgbGV0IGRzZWVkO1xuICAgIGxldCB1aWQ7XG4gICAgbGV0IGVuY1NlZWQ7XG4gICAgLy8gbGV0IGVuY0RzZWVkO1xuXG4gICAgaW5pdCgpO1xuXG4gICAgdGhpcy5nZXRTZWVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZighc2VlZCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmV0dXJuIHNlZWQuIEFjY2VzcyBpcyBkZW5pZWQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ29tcGFjdEZvcm0oc2VlZCk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2V0RHNlZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKGRzZWVkKXtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKGRzZWVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHNlZWQpe1xuICAgICAgICAgICAgZHNlZWQgPSBkZXJpdmVTZWVkKHNlZWQpO1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ29tcGFjdEZvcm0oZHNlZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJldHVybiBkZXJpdmVkIHNlZWQuIEFjY2VzcyBpcyBkZW5pZWQuXCIpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldFVpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYodWlkKXtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKHVpZCkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGRzZWVkKXtcbiAgICAgICAgICAgIHVpZCA9IGNvbXB1dGVVaWQoZHNlZWQpO1xuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlQ29tcGFjdEZvcm0odWlkKS50b1N0cmluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoc2VlZCl7XG4gICAgICAgICAgICBkc2VlZCA9IGRlcml2ZVNlZWQoc2VlZCk7XG4gICAgICAgICAgICB1aWQgPSBjb21wdXRlVWlkKGRzZWVkKTtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKHVpZCkudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZXR1cm4gdWlkXCIpO1xuICAgIH07XG5cbiAgICB0aGlzLmdldEVuY1NlZWQgPSBmdW5jdGlvbiAoZW5jcnlwdGlvbktleSkge1xuICAgICAgICBpZihlbmNTZWVkKXtcbiAgICAgICAgICAgIHJldHVybiBnZW5lcmF0ZUNvbXBhY3RGb3JtKGVuY1NlZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIXNlZWQpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJldHVybiBlbmNTZWVkLiBBY2Nlc3MgaXMgZGVuaWVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbmNyeXB0aW9uS2V5KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmV0dXJuIGVuY1NlZWQuIE5vIGVuY3J5cHRpb24ga2V5IHdhcyBwcm92aWRlZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vVE9ETzogZW5jcnlwdCBzZWVkIHVzaW5nIGVuY3J5cHRpb25LZXkuIEVuY3J5cHRpb24gYWxnb3JpdGhtIHJlbWFpbnMgdG8gYmUgY2hvc2VuXG4gICAgfTtcblxuXG5cbiAgICB0aGlzLmdldEJhY2t1cFVybHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKHNlZWQpe1xuICAgICAgICAgICAgcmV0dXJuIHNlZWQuYmFja3VwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZHNlZWQpe1xuICAgICAgICAgICAgcmV0dXJuIGRzZWVkLmJhY2t1cDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhY2t1cCBVUkxzIGNvdWxkIG5vdCBiZSByZXRyaWV2ZWQuIEFjY2VzcyBpcyBkZW5pZWRcIik7XG4gICAgfTtcblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGludGVybmFsIG1ldGhvZHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgaWYgKCFiYWNrdXBVcmxzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYmFja3VwcyBwcm92aWRlZC5cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlZWQgPSBjcmVhdGUoKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBjbGFzc2lmeUlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbGFzc2lmeUlkKCkge1xuICAgICAgICBpZiAodHlwZW9mIGlkICE9PSBcInN0cmluZ1wiICYmICFCdWZmZXIuaXNCdWZmZXIoaWQpICYmICEodHlwZW9mIGlkID09PSBcIm9iamVjdFwiICYmICFCdWZmZXIuaXNCdWZmZXIoaWQpKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJZCBtdXN0IGJlIGEgc3RyaW5nIG9yIGEgYnVmZmVyLiBUaGUgdHlwZSBwcm92aWRlZCB3YXMgJHt0eXBlb2YgaWR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleHBhbmRlZElkID0gbG9hZChpZCk7XG4gICAgICAgIHN3aXRjaChleHBhbmRlZElkLnRhZyl7XG4gICAgICAgICAgICBjYXNlICdzJzpcbiAgICAgICAgICAgICAgICBzZWVkID0gZXhwYW5kZWRJZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2QnOlxuICAgICAgICAgICAgICAgIGRzZWVkID0gZXhwYW5kZWRJZDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3UnOlxuICAgICAgICAgICAgICAgIHVpZCA9IGV4cGFuZGVkSWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdlcyc6XG4gICAgICAgICAgICAgICAgZW5jU2VlZCA9IGV4cGFuZGVkSWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdlZCc6XG4gICAgICAgICAgICAgICAgZW5jRHNlZWQgPSBleHBhbmRlZElkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgdGFnJyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgICAgICBjb25zdCBsb2NhbFNlZWQgPSB7fTtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGJhY2t1cFVybHMpKSB7XG4gICAgICAgICAgICBiYWNrdXBVcmxzID0gWyBiYWNrdXBVcmxzIF07XG4gICAgICAgIH1cblxuICAgICAgICBsb2NhbFNlZWQudGFnICAgID0gJ3MnO1xuICAgICAgICBsb2NhbFNlZWQucmFuZG9tID0gY3J5cHRvLnJhbmRvbUJ5dGVzKGtleUxlbik7XG4gICAgICAgIGxvY2FsU2VlZC5iYWNrdXAgPSBiYWNrdXBVcmxzO1xuXG4gICAgICAgIHJldHVybiBsb2NhbFNlZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVyaXZlU2VlZChzZWVkKSB7XG4gICAgICAgIGxldCBjb21wYWN0U2VlZCA9IHNlZWQ7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzZWVkID09PSAnb2JqZWN0JyAmJiAhQnVmZmVyLmlzQnVmZmVyKHNlZWQpKSB7XG4gICAgICAgICAgICBjb21wYWN0U2VlZCA9IGdlbmVyYXRlQ29tcGFjdEZvcm0oc2VlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHNlZWQpKSB7XG4gICAgICAgICAgICBjb21wYWN0U2VlZCA9IHNlZWQudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21wYWN0U2VlZFswXSA9PT0gJ2QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RyaWVkIHRvIGRlcml2ZSBhbiBhbHJlYWR5IGRlcml2ZWQgc2VlZC4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlY29kZWRDb21wYWN0U2VlZCA9IGRlY29kZVVSSUNvbXBvbmVudChjb21wYWN0U2VlZCk7XG4gICAgICAgIGNvbnN0IHNwbGl0Q29tcGFjdFNlZWQgPSBkZWNvZGVkQ29tcGFjdFNlZWQuc3Vic3RyaW5nKDEpLnNwbGl0KCd8Jyk7XG5cbiAgICAgICAgY29uc3Qgc3RyU2VlZCA9IEJ1ZmZlci5mcm9tKHNwbGl0Q29tcGFjdFNlZWRbMF0sICdiYXNlNjQnKS50b1N0cmluZygnaGV4Jyk7XG4gICAgICAgIGNvbnN0IGJhY2t1cFVybHMgPSBCdWZmZXIuZnJvbShzcGxpdENvbXBhY3RTZWVkWzFdLCAnYmFzZTY0JykudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgZHNlZWQgPSB7fTtcblxuICAgICAgICBkc2VlZC50YWcgPSAnZCc7XG4gICAgICAgIGRzZWVkLnJhbmRvbSA9IGNyeXB0by5kZXJpdmVLZXkoc3RyU2VlZCwgbnVsbCwga2V5TGVuKTtcbiAgICAgICAgZHNlZWQuYmFja3VwID0gSlNPTi5wYXJzZShiYWNrdXBVcmxzKTtcblxuICAgICAgICByZXR1cm4gZHNlZWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcHV0ZVVpZChkc2VlZCl7XG4gICAgICAgIGlmKCFkc2VlZCl7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEc2VlZCB3YXMgbm90IHByb3ZpZGVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkc2VlZCA9PT0gXCJvYmplY3RcIiAmJiAhQnVmZmVyLmlzQnVmZmVyKGRzZWVkKSkge1xuICAgICAgICAgICAgZHNlZWQgPSBnZW5lcmF0ZUNvbXBhY3RGb3JtKGRzZWVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVpZCA9IHt9O1xuICAgICAgICB1aWQudGFnID0gJ3UnO1xuICAgICAgICB1aWQucmFuZG9tID0gQnVmZmVyLmZyb20oY3J5cHRvLmdlbmVyYXRlU2FmZVVpZChkc2VlZCkpO1xuXG4gICAgICAgIHJldHVybiB1aWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVDb21wYWN0Rm9ybSh7dGFnLCByYW5kb20sIGJhY2t1cH0pIHtcbiAgICAgICAgbGV0IGNvbXBhY3RJZCA9IHRhZyArIHJhbmRvbS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICAgIGlmIChiYWNrdXApIHtcbiAgICAgICAgICAgIGNvbXBhY3RJZCArPSAnfCcgKyBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeShiYWNrdXApKS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGVuY29kZVVSSUNvbXBvbmVudChjb21wYWN0SWQpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlbmNyeXB0KGlkLCBlbmNyeXB0aW9uS2V5KSB7XG4gICAgICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggIT09IDIpe1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzLiBFeHBlY3RlZDogMjsgcHJvdmlkZWQgJHthcmd1bWVudHMubGVuZ3RofWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRhZztcbiAgICAgICAgaWYgKHR5cGVvZiBpZCA9PT0gXCJvYmplY3RcIiAmJiAhQnVmZmVyLmlzQnVmZmVyKGlkKSkge1xuICAgICAgICAgICAgdGFnID0gaWQudGFnO1xuICAgICAgICAgICAgaWQgPSBnZW5lcmF0ZUNvbXBhY3RGb3JtKGlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0YWcgPT09ICdzJykge1xuICAgICAgICAgICAgLy9UT0RPIGVuY3J5cHQgc2VlZFxuICAgICAgICB9ZWxzZSBpZiAodGFnID09PSAnZCcpIHtcbiAgICAgICAgICAgIC8vVE9ETyBlbmNyeXB0IGRzZWVkXG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHByb3ZpZGVkIGlkIGNhbm5vdCBiZSBlbmNyeXB0ZWRcIik7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxvYWQoY29tcGFjdElkKSB7XG4gICAgICAgIGlmKHR5cGVvZiBjb21wYWN0SWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdHlwZSBzdHJpbmcgb3IgQnVmZmVyLiBSZWNlaXZlZCB1bmRlZmluZWRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHR5cGVvZiBjb21wYWN0SWQgIT09IFwic3RyaW5nXCIpe1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb21wYWN0SWQgPT09IFwib2JqZWN0XCIgJiYgIUJ1ZmZlci5pc0J1ZmZlcihjb21wYWN0SWQpKSB7XG4gICAgICAgICAgICAgICAgY29tcGFjdElkID0gQnVmZmVyLmZyb20oY29tcGFjdElkKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29tcGFjdElkID0gY29tcGFjdElkLnRvU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWNvZGVkQ29tcGFjdElkID0gZGVjb2RlVVJJQ29tcG9uZW50KGNvbXBhY3RJZCk7XG4gICAgICAgIGNvbnN0IGlkID0ge307XG4gICAgICAgIGNvbnN0IHNwbGl0Q29tcGFjdElkID0gZGVjb2RlZENvbXBhY3RJZC5zdWJzdHJpbmcoMSkuc3BsaXQoJ3wnKTtcblxuICAgICAgICBpZC50YWcgPSBkZWNvZGVkQ29tcGFjdElkWzBdO1xuICAgICAgICBpZC5yYW5kb20gPSBCdWZmZXIuZnJvbShzcGxpdENvbXBhY3RJZFswXSwgJ2Jhc2U2NCcpO1xuXG4gICAgICAgIGlmKHNwbGl0Q29tcGFjdElkWzFdICYmIHNwbGl0Q29tcGFjdElkWzFdLmxlbmd0aCA+IDApe1xuICAgICAgICAgICAgaWQuYmFja3VwID0gSlNPTi5wYXJzZShCdWZmZXIuZnJvbShzcGxpdENvbXBhY3RJZFsxXSwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDU0JJZGVudGlmaWVyO1xuIiwiY29uc3QgT3dNID0gcmVxdWlyZSgnc3dhcm11dGlscycpLk93TTtcbmNvbnN0IHBza2RiID0gcmVxdWlyZSgncHNrZGInKTtcblxuZnVuY3Rpb24gUmF3Q1NCKGluaXREYXRhKSB7XG5cdGNvbnN0IGRhdGEgPSBuZXcgT3dNKHtibG9ja2NoYWluOiBpbml0RGF0YX0pO1xuXHRjb25zdCBibG9ja2NoYWluID0gcHNrZGIuc3RhcnREYih7Z2V0SW5pdFZhbHVlcywgcGVyc2lzdH0pO1xuXG5cdGlmKCFkYXRhLmJsb2NrY2hhaW4pIHtcblx0XHRkYXRhLmJsb2NrY2hhaW4gPSB7XG5cdFx0XHR0cmFuc2FjdGlvbkxvZyA6ICcnLFxuXHRcdFx0ZW1iZWRkZWRGaWxlczoge31cblx0XHR9O1xuXHR9XG5cblx0ZGF0YS5lbWJlZEZpbGUgPSBmdW5jdGlvbiAoZmlsZUFsaWFzLCBmaWxlRGF0YSkge1xuXHRcdGNvbnN0IGVtYmVkZGVkQXNzZXQgPSBkYXRhLmdldEFzc2V0KFwiZ2xvYmFsLkVtYmVkZGVkRmlsZVwiLCBmaWxlQWxpYXMpO1xuXHRcdGlmKGVtYmVkZGVkQXNzZXQuaXNQZXJzaXN0ZWQoKSl7XG5cdFx0XHRjb25zb2xlLmxvZyhgRmlsZSB3aXRoIGFsaWFzICR7ZmlsZUFsaWFzfSBhbHJlYWR5IGV4aXN0c2ApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGRhdGEuYmxvY2tjaGFpbi5lbWJlZGRlZEZpbGVzW2ZpbGVBbGlhc10gPSBmaWxlRGF0YTtcblx0XHRkYXRhLnNhdmVBc3NldChlbWJlZGRlZEFzc2V0KTtcblx0fTtcblxuXHRkYXRhLmF0dGFjaEZpbGUgPSBmdW5jdGlvbiAoZmlsZUFsaWFzLCBwYXRoLCBzZWVkKSB7XG5cdFx0ZGF0YS5tb2RpZnlBc3NldChcImdsb2JhbC5GaWxlUmVmZXJlbmNlXCIsIGZpbGVBbGlhcywgKGZpbGUpID0+IHtcblx0XHRcdGlmICghZmlsZS5pc0VtcHR5KCkpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coYEZpbGUgd2l0aCBhbGlhcyAke2ZpbGVBbGlhc30gYWxyZWFkeSBleGlzdHNgKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHRmaWxlLmluaXQoZmlsZUFsaWFzLCBwYXRoLCBzZWVkKTtcblx0XHR9KTtcblx0fTtcblxuXHRkYXRhLnNhdmVBc3NldCA9IGZ1bmN0aW9uKGFzc2V0KSB7XG5cdFx0Y29uc3QgdHJhbnNhY3Rpb24gPSBibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuXHRcdHRyYW5zYWN0aW9uLmFkZChhc3NldCk7XG5cdFx0YmxvY2tjaGFpbi5jb21taXQodHJhbnNhY3Rpb24pO1xuXHR9O1xuXG5cdGRhdGEubW9kaWZ5QXNzZXQgPSBmdW5jdGlvbihhc3NldFR5cGUsIGFpZCwgYXNzZXRNb2RpZmllcikge1xuXHRcdGNvbnN0IHRyYW5zYWN0aW9uID0gYmxvY2tjaGFpbi5iZWdpblRyYW5zYWN0aW9uKHt9KTtcblx0XHRjb25zdCBhc3NldCA9IHRyYW5zYWN0aW9uLmxvb2t1cChhc3NldFR5cGUsIGFpZCk7XG5cdFx0YXNzZXRNb2RpZmllcihhc3NldCk7XG5cblx0XHR0cmFuc2FjdGlvbi5hZGQoYXNzZXQpO1xuXHRcdGJsb2NrY2hhaW4uY29tbWl0KHRyYW5zYWN0aW9uKTtcblx0fTtcblxuXHRkYXRhLmdldEFzc2V0ID0gZnVuY3Rpb24gKGFzc2V0VHlwZSwgYWlkKSB7XG5cdFx0Y29uc3QgdHJhbnNhY3Rpb24gPSBibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuXHRcdHJldHVybiB0cmFuc2FjdGlvbi5sb29rdXAoYXNzZXRUeXBlLCBhaWQpO1xuXHR9O1xuXG5cdGRhdGEuZ2V0QWxsQXNzZXRzID0gZnVuY3Rpb24oYXNzZXRUeXBlKSB7XG5cdFx0Y29uc3QgdHJhbnNhY3Rpb24gPSBibG9ja2NoYWluLmJlZ2luVHJhbnNhY3Rpb24oe30pO1xuXHRcdHJldHVybiB0cmFuc2FjdGlvbi5sb2FkQXNzZXRzKGFzc2V0VHlwZSk7XG5cdH07XG5cblx0LyogaW50ZXJuYWwgZnVuY3Rpb25zICovXG5cblx0ZnVuY3Rpb24gcGVyc2lzdCh0cmFuc2FjdGlvbkxvZywgY3VycmVudFZhbHVlcywgY3VycmVudFB1bHNlKSB7XG5cdFx0dHJhbnNhY3Rpb25Mb2cuY3VycmVudFB1bHNlID0gY3VycmVudFB1bHNlO1xuXG5cdFx0ZGF0YS5ibG9ja2NoYWluLmN1cnJlbnRWYWx1ZXMgPSBjdXJyZW50VmFsdWVzO1xuXHRcdGRhdGEuYmxvY2tjaGFpbi50cmFuc2FjdGlvbkxvZyArPSBta1NpbmdsZUxpbmUoSlNPTi5zdHJpbmdpZnkodHJhbnNhY3Rpb25Mb2cpKSArIFwiXFxuXCI7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRJbml0VmFsdWVzICgpIHtcblx0XHRpZighZGF0YS5ibG9ja2NoYWluIHx8ICFkYXRhLmJsb2NrY2hhaW4uY3VycmVudFZhbHVlcykge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdHJldHVybiBkYXRhLmJsb2NrY2hhaW4uY3VycmVudFZhbHVlcztcblx0fVxuXG5cdGZ1bmN0aW9uIG1rU2luZ2xlTGluZShzdHIpIHtcblx0XHRyZXR1cm4gc3RyLnJlcGxhY2UoL1xcbnxcXHIvZywgXCJcIik7XG5cdH1cblxuXHRyZXR1cm4gZGF0YTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSYXdDU0I7IiwiY29uc3QgUmF3Q1NCID0gcmVxdWlyZSgnLi9SYXdDU0InKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IGNyeXB0byA9IHJlcXVpcmUoJ3Bza2NyeXB0bycpO1xuY29uc3QgdXRpbHMgPSByZXF1aXJlKCcuLi91dGlscy91dGlscycpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZSgnLi4vdXRpbHMvRHNlZWRDYWdlJyk7XG5jb25zdCBIYXNoQ2FnZSA9IHJlcXVpcmUoJy4uL3V0aWxzL0hhc2hDYWdlJyk7XG5jb25zdCBDU0JDYWNoZSA9IHJlcXVpcmUoXCIuL0NTQkNhY2hlXCIpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoXCIuL0NTQklkZW50aWZpZXJcIik7XG5jb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcblxuY29uc3QgcmF3Q1NCQ2FjaGUgPSBuZXcgQ1NCQ2FjaGUoMTApO1xuY29uc3QgaW5zdGFuY2VzID0ge307XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBsb2NhbEZvbGRlciAgIC0gcmVxdWlyZWRcbiAqIEBwYXJhbSBjdXJyZW50UmF3Q1NCIC0gb3B0aW9uYWxcbiAqIEBwYXJhbSBjc2JJZGVudGlmaWVyIC0gcmVxdWlyZWRcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBSb290Q1NCKGxvY2FsRm9sZGVyLCBjdXJyZW50UmF3Q1NCLCBjc2JJZGVudGlmaWVyKSB7XG4gICAgaWYgKCFsb2NhbEZvbGRlciB8fCAhY3NiSWRlbnRpZmllcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgcmVxdWlyZWQgcGFyYW1ldGVycycpO1xuICAgIH1cblxuXG4gICAgY29uc3QgaGFzaENhZ2UgPSBuZXcgSGFzaENhZ2UobG9jYWxGb2xkZXIpO1xuICAgIGNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMub24gPSBldmVudC5vbjtcbiAgICB0aGlzLm9mZiA9IGV2ZW50LnJlbW92ZUxpc3RlbmVyO1xuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzID0gZXZlbnQucmVtb3ZlQWxsTGlzdGVuZXJzO1xuICAgIHRoaXMuZW1pdCA9IGV2ZW50LmVtaXQ7XG5cbiAgICB0aGlzLmdldE1pZFJvb3QgPSBmdW5jdGlvbiAoQ1NCUGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgICB9O1xuXG4gICAgdGhpcy5sb2FkUmF3Q1NCID0gZnVuY3Rpb24gKENTQlBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghY3VycmVudFJhd0NTQikge1xuICAgICAgICAgICAgX19sb2FkUmF3Q1NCKGNzYklkZW50aWZpZXIsIChlcnIsIHJhd0NTQikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY3VycmVudFJhd0NTQiA9IHJhd0NTQjtcblxuICAgICAgICAgICAgICAgIGlmIChDU0JQYXRoIHx8IENTQlBhdGggIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZFJhd0NTQihDU0JQYXRoLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIGN1cnJlbnRSYXdDU0IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFDU0JQYXRoIHx8IENTQlBhdGggPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgY3VycmVudFJhd0NTQik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvYWRBc3NldEZyb21QYXRoKENTQlBhdGgsIChlcnIsIGFzc2V0LCByYXdDU0IpID0+IHtcblxuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWFzc2V0IHx8ICFhc3NldC5kc2VlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoYFRoZSBDU0JQYXRoICR7Q1NCUGF0aH0gaXMgaW52YWxpZC5gKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9fbG9hZFJhd0NTQihuZXcgQ1NCSWRlbnRpZmllcihhc3NldC5kc2VlZCksIGNhbGxiYWNrKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHRoaXMuc2F2ZVJhd0NTQiA9IGZ1bmN0aW9uIChyYXdDU0IsIENTQlBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIHNhdmUgbWFzdGVyXG4gICAgICAgIGlmICghQ1NCUGF0aCB8fCBDU0JQYXRoID09PSAnJykge1xuICAgICAgICAgICAgaWYgKHJhd0NTQikge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRSYXdDU0IgPSByYXdDU0I7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIF9faW5pdGlhbGl6ZUFzc2V0cyhjdXJyZW50UmF3Q1NCKTtcbiAgICAgICAgICAgIHJldHVybiBfX3dyaXRlUmF3Q1NCKGN1cnJlbnRSYXdDU0IsIGNzYklkZW50aWZpZXIsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHNhdmUgY3NiIGluIGhpZXJhcmNoeVxuICAgICAgICBjb25zdCBzcGxpdFBhdGggPSBfX3NwbGl0UGF0aChDU0JQYXRoKTtcbiAgICAgICAgdGhpcy5sb2FkQXNzZXRGcm9tUGF0aChDU0JQYXRoLCAoZXJyLCBjc2JSZWZlcmVuY2UpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghY3NiUmVmZXJlbmNlLmRzZWVkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmFja3VwcyA9IGNzYklkZW50aWZpZXIuZ2V0QmFja3VwVXJscygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0NTQklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcih1bmRlZmluZWQsIGJhY2t1cHMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvY2FsU2VlZCA9IG5ld0NTQklkZW50aWZpZXIuZ2V0U2VlZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxvY2FsRHNlZWQgPSBuZXdDU0JJZGVudGlmaWVyLmdldERzZWVkKCk7XG4gICAgICAgICAgICAgICAgY3NiUmVmZXJlbmNlLmluaXQoc3BsaXRQYXRoLmFzc2V0QWlkLCBsb2NhbFNlZWQsIGxvY2FsRHNlZWQpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlQXNzZXRUb1BhdGgoQ1NCUGF0aCwgY3NiUmVmZXJlbmNlLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkQXNzZXRGcm9tUGF0aChDU0JQYXRoLCAoZXJyLCBjc2JSZWYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgX19pbml0aWFsaXplQXNzZXRzKHJhd0NTQiwgY3NiUmVmLCBiYWNrdXBzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9fd3JpdGVSYXdDU0IocmF3Q1NCLCBuZXcgQ1NCSWRlbnRpZmllcihjc2JSZWZlcmVuY2UuZHNlZWQpLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoJ2VuZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9fd3JpdGVSYXdDU0IocmF3Q1NCLCBuZXcgQ1NCSWRlbnRpZmllcihjc2JSZWZlcmVuY2UuZHNlZWQpLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLnNhdmVBc3NldFRvUGF0aCA9IGZ1bmN0aW9uIChDU0JQYXRoLCBhc3NldCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgc3BsaXRQYXRoID0gX19zcGxpdFBhdGgoQ1NCUGF0aCwge2tlZXBBbGlhc2VzQXNTdHJpbmc6IHRydWV9KTtcbiAgICAgICAgdGhpcy5sb2FkUmF3Q1NCKHNwbGl0UGF0aC5DU0JBbGlhc2VzLCAoZXJyLCByYXdDU0IpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmF3Q1NCLnNhdmVBc3NldChhc3NldCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zYXZlUmF3Q1NCKHJhd0NTQiwgc3BsaXRQYXRoLkNTQkFsaWFzZXMsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmxvYWRBc3NldEZyb21QYXRoID0gZnVuY3Rpb24gKENTQlBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHByb2Nlc3NlZFBhdGggPSBfX3NwbGl0UGF0aChDU0JQYXRoKTtcbiAgICAgICAgaWYgKCFjdXJyZW50UmF3Q1NCKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdjdXJyZW50UmF3Q1NCIGRvZXMgbm90IGV4aXN0JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IENTQlJlZmVyZW5jZSA9IG51bGw7XG4gICAgICAgIGlmIChwcm9jZXNzZWRQYXRoLkNTQkFsaWFzZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbmV4dEFsaWFzID0gcHJvY2Vzc2VkUGF0aC5DU0JBbGlhc2VzWzBdO1xuICAgICAgICAgICAgQ1NCUmVmZXJlbmNlID0gY3VycmVudFJhd0NTQi5nZXRBc3NldCgnZ2xvYmFsLkNTQlJlZmVyZW5jZScsIG5leHRBbGlhcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXByb2Nlc3NlZFBhdGguYXNzZXRUeXBlIHx8ICFwcm9jZXNzZWRQYXRoLmFzc2V0QWlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignTm90IGFzc2V0IHR5cGUgb3IgaWQgc3BlY2lmaWVkIGluIENTQlBhdGgnKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIENTQlJlZmVyZW5jZSA9IGN1cnJlbnRSYXdDU0IuZ2V0QXNzZXQocHJvY2Vzc2VkUGF0aC5hc3NldFR5cGUsIHByb2Nlc3NlZFBhdGguYXNzZXRBaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2Nlc3NlZFBhdGguQ1NCQWxpYXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBDU0JSZWZlcmVuY2UsIGN1cnJlbnRSYXdDU0IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvY2Vzc2VkUGF0aC5DU0JBbGlhc2VzLnNoaWZ0KCk7XG5cbiAgICAgICAgaWYoIUNTQlJlZmVyZW5jZSB8fCAhQ1NCUmVmZXJlbmNlLmRzZWVkKXtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoYFRoZSBDU0JQYXRoICR7Q1NCUGF0aH0gaXMgaW52YWxpZGApKTtcbiAgICAgICAgfVxuICAgICAgICBfX2xvYWRBc3NldEZyb21QYXRoKHByb2Nlc3NlZFBhdGgsIG5ldyBDU0JJZGVudGlmaWVyKENTQlJlZmVyZW5jZS5kc2VlZCksIDAsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG5cbiAgICAvKiAtLS0tLS0tLS0tLS0tLS0tLS0tIElOVEVSTkFMIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuXG4gICAgZnVuY3Rpb24gX19sb2FkUmF3Q1NCKGxvY2FsQ1NCSWRlbnRpZmllciwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgdWlkID0gbG9jYWxDU0JJZGVudGlmaWVyLmdldFVpZCgpO1xuICAgICAgICBjb25zdCBjYWNoZWRSYXdDU0IgPSByYXdDU0JDYWNoZS5sb2FkKHVpZCk7XG5cbiAgICAgICAgaWYgKGNhY2hlZFJhd0NTQikge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGNhY2hlZFJhd0NTQik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb290UGF0aCA9IHV0aWxzLmdlbmVyYXRlUGF0aChsb2NhbEZvbGRlciwgbG9jYWxDU0JJZGVudGlmaWVyKTtcbiAgICAgICAgZnMucmVhZEZpbGUocm9vdFBhdGgsIChlcnIsIGVuY3J5cHRlZENzYikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjcnlwdG8uZGVjcnlwdE9iamVjdChlbmNyeXB0ZWRDc2IsIGxvY2FsQ1NCSWRlbnRpZmllci5nZXREc2VlZCgpLCAoZXJyLCBjc2JEYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgY3NiID0gbmV3IFJhd0NTQihjc2JEYXRhKTtcbiAgICAgICAgICAgICAgICByYXdDU0JDYWNoZS5wdXQodWlkLCBjc2IpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIGNzYik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gQ1NCUGF0aDogc3RyaW5nIC0gaW50ZXJuYWwgcGF0aCB0aGF0IGxvb2tzIGxpa2UgL3tDU0JOYW1lMX0ve0NTQk5hbWUyfTp7YXNzZXRUeXBlfTp7YXNzZXRBbGlhc09ySWR9XG4gICAgICogQHBhcmFtIG9wdGlvbnM6b2JqZWN0XG4gICAgICogQHJldHVybnMge3tDU0JBbGlhc2VzOiBbc3RyaW5nXSwgYXNzZXRBaWQ6ICgqfHVuZGVmaW5lZCksIGFzc2V0VHlwZTogKCp8dW5kZWZpbmVkKX19XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBfX3NwbGl0UGF0aChDU0JQYXRoLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgY29uc3QgcGF0aFNlcGFyYXRvciA9ICcvJztcblxuICAgICAgICBpZiAoQ1NCUGF0aC5zdGFydHNXaXRoKHBhdGhTZXBhcmF0b3IpKSB7XG4gICAgICAgICAgICBDU0JQYXRoID0gQ1NCUGF0aC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgQ1NCQWxpYXNlcyA9IENTQlBhdGguc3BsaXQocGF0aFNlcGFyYXRvcik7XG4gICAgICAgIGlmIChDU0JBbGlhc2VzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ1NCUGF0aCB0b28gc2hvcnQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxhc3RJbmRleCA9IENTQkFsaWFzZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgY29uc3Qgb3B0aW9uYWxBc3NldFNlbGVjdG9yID0gQ1NCQWxpYXNlc1tsYXN0SW5kZXhdLnNwbGl0KCc6Jyk7XG5cbiAgICAgICAgaWYgKG9wdGlvbmFsQXNzZXRTZWxlY3RvclswXSA9PT0gJycpIHtcbiAgICAgICAgICAgIENTQkFsaWFzZXMgPSBbXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIENTQkFsaWFzZXNbbGFzdEluZGV4XSA9IG9wdGlvbmFsQXNzZXRTZWxlY3RvclswXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb3B0aW9uYWxBc3NldFNlbGVjdG9yWzFdICYmICFvcHRpb25hbEFzc2V0U2VsZWN0b3JbMl0pIHtcbiAgICAgICAgICAgIG9wdGlvbmFsQXNzZXRTZWxlY3RvclsxXSA9ICdnbG9iYWwuQ1NCUmVmZXJlbmNlJztcbiAgICAgICAgICAgIG9wdGlvbmFsQXNzZXRTZWxlY3RvclsyXSA9IENTQkFsaWFzZXNbbGFzdEluZGV4XTtcbiAgICAgICAgICAgIENTQkFsaWFzZXMucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAob3B0aW9ucy5rZWVwQWxpYXNlc0FzU3RyaW5nID09PSB0cnVlKSB7XG4gICAgICAgICAgICBDU0JBbGlhc2VzID0gQ1NCQWxpYXNlcy5qb2luKCcvJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIENTQkFsaWFzZXM6IENTQkFsaWFzZXMsXG4gICAgICAgICAgICBhc3NldFR5cGU6IG9wdGlvbmFsQXNzZXRTZWxlY3RvclsxXSxcbiAgICAgICAgICAgIGFzc2V0QWlkOiBvcHRpb25hbEFzc2V0U2VsZWN0b3JbMl1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfX2xvYWRBc3NldEZyb21QYXRoKHByb2Nlc3NlZFBhdGgsIGxvY2FsQ1NCSWRlbnRpZmllciwgY3VycmVudEluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICBfX2xvYWRSYXdDU0IobG9jYWxDU0JJZGVudGlmaWVyLCAoZXJyLCByYXdDU0IpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRJbmRleCA8IHByb2Nlc3NlZFBhdGguQ1NCQWxpYXNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0QWxpYXMgPSBwcm9jZXNzZWRQYXRoLkNTQkFsaWFzZXNbY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3NldCA9IHJhd0NTQi5nZXRBc3NldChcImdsb2JhbC5DU0JSZWZlcmVuY2VcIiwgbmV4dEFsaWFzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdDU0JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoYXNzZXQuZHNlZWQpO1xuXG4gICAgICAgICAgICAgICAgX19sb2FkQXNzZXRGcm9tUGF0aChwcm9jZXNzZWRQYXRoLCBuZXdDU0JJZGVudGlmaWVyLCArK2N1cnJlbnRJbmRleCwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYXNzZXQgPSByYXdDU0IuZ2V0QXNzZXQocHJvY2Vzc2VkUGF0aC5hc3NldFR5cGUsIHByb2Nlc3NlZFBhdGguYXNzZXRBaWQpO1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgYXNzZXQsIHJhd0NTQik7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfX3dyaXRlUmF3Q1NCKHJhd0NTQiwgbG9jYWxDU0JJZGVudGlmaWVyLCBjYWxsYmFjaykge1xuICAgICAgICBjcnlwdG8uZW5jcnlwdE9iamVjdChyYXdDU0IuYmxvY2tjaGFpbiwgbG9jYWxDU0JJZGVudGlmaWVyLmdldERzZWVkKCksIG51bGwsIChlcnIsIGVuY3J5cHRlZEJsb2NrY2hhaW4pID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFzaENhZ2UubG9hZEhhc2goKGVyciwgaGFzaE9iaikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gbG9jYWxDU0JJZGVudGlmaWVyLmdldFVpZCgpO1xuICAgICAgICAgICAgICAgIGhhc2hPYmpba2V5XSA9IGNyeXB0by5wc2tIYXNoKGVuY3J5cHRlZEJsb2NrY2hhaW4pLnRvU3RyaW5nKCdoZXgnKTtcblxuICAgICAgICAgICAgICAgIGhhc2hDYWdlLnNhdmVIYXNoKGhhc2hPYmosIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUodXRpbHMuZ2VuZXJhdGVQYXRoKGxvY2FsRm9sZGVyLCBsb2NhbENTQklkZW50aWZpZXIpLCBlbmNyeXB0ZWRCbG9ja2NoYWluLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX19pbml0aWFsaXplQXNzZXRzKHJhd0NTQiwgY3NiUmVmLCBiYWNrdXBVcmxzKSB7XG5cbiAgICAgICAgbGV0IGlzTWFzdGVyO1xuXG4gICAgICAgIGNvbnN0IGNzYk1ldGEgPSByYXdDU0IuZ2V0QXNzZXQoJ2dsb2JhbC5DU0JNZXRhJywgJ21ldGEnKTtcbiAgICAgICAgaWYgKGN1cnJlbnRSYXdDU0IgPT09IHJhd0NTQikge1xuICAgICAgICAgICAgaXNNYXN0ZXIgPSB0eXBlb2YgY3NiTWV0YS5pc01hc3RlciA9PT0gJ3VuZGVmaW5lZCcgPyB0cnVlIDogY3NiTWV0YS5pc01hc3RlcjtcbiAgICAgICAgICAgIGlmICghY3NiTWV0YS5pZCkge1xuICAgICAgICAgICAgICAgIGNzYk1ldGEuaW5pdCgkJC51aWRHZW5lcmF0b3Iuc2FmZV91dWlkKCkpO1xuICAgICAgICAgICAgICAgIGNzYk1ldGEuc2V0SXNNYXN0ZXIoaXNNYXN0ZXIpO1xuICAgICAgICAgICAgICAgIHJhd0NTQi5zYXZlQXNzZXQoY3NiTWV0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiYWNrdXBVcmxzLmZvckVhY2goKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHVpZCA9ICQkLnVpZEdlbmVyYXRvci5zYWZlX3V1aWQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBiYWNrdXAgPSByYXdDU0IuZ2V0QXNzZXQoJ2dsb2JhbC5CYWNrdXAnLCB1aWQpO1xuICAgICAgICAgICAgICAgIGJhY2t1cC5pbml0KHVpZCwgdXJsKTtcbiAgICAgICAgICAgICAgICByYXdDU0Iuc2F2ZUFzc2V0KGJhY2t1cCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaXNNYXN0ZXIgPSB0eXBlb2YgY3NiTWV0YS5pc01hc3RlciA9PT0gJ3VuZGVmaW5lZCcgPyBmYWxzZSA6IGNzYk1ldGEuaXNNYXN0ZXI7XG4gICAgICAgICAgICBjc2JNZXRhLmluaXQoY3NiUmVmLmdldE1ldGFkYXRhKCdzd2FybUlkJykpO1xuICAgICAgICAgICAgY3NiTWV0YS5zZXRJc01hc3Rlcihpc01hc3Rlcik7XG4gICAgICAgICAgICByYXdDU0Iuc2F2ZUFzc2V0KGNzYk1ldGEpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNyZWF0ZVJvb3RDU0IobG9jYWxGb2xkZXIsIG1hc3RlclJhd0NTQiwgY3NiSWRlbnRpZmllciwgcGluLCBjYWxsYmFjaykge1xuICAgIGxldCBtYXN0ZXJEc2VlZDtcblxuICAgIGlmIChjc2JJZGVudGlmaWVyKSB7XG4gICAgICAgIG1hc3RlckRzZWVkID0gY3NiSWRlbnRpZmllci5nZXREc2VlZCgpO1xuICAgICAgICBpZiAobWFzdGVyUmF3Q1NCKSB7XG4gICAgICAgICAgICBjb25zdCByb290Q1NCID0gbmV3IFJvb3RDU0IobG9jYWxGb2xkZXIsIG1hc3RlclJhd0NTQiwgbWFzdGVyRHNlZWQpO1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIHJvb3RDU0IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxvYWRXaXRoSWRlbnRpZmllcihsb2NhbEZvbGRlciwgbWFzdGVyRHNlZWQsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2UgaWYgKHBpbikge1xuXG4gICAgICAgIHJldHVybiBsb2FkV2l0aFBpbihsb2NhbEZvbGRlciwgcGluLCBjYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignTWlzc2luZyBzZWVkLCBkc2VlZCBhbmQgcGluLCBhdCBsZWFzdCBvbmUgaXMgcmVxdWlyZWQnKSk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBsb2FkV2l0aFBpbihsb2NhbEZvbGRlciwgcGluLCBjYWxsYmFjaykge1xuICAgIG5ldyBEc2VlZENhZ2UobG9jYWxGb2xkZXIpLmxvYWREc2VlZEJhY2t1cHMocGluLCAoZXJyLCBjc2JJZGVudGlmaWVyLCBiYWNrdXBzKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjc2JJZGVudGlmaWVyICYmICghYmFja3VwcyB8fCBiYWNrdXBzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjc2JJZGVudGlmaWVyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgYmFja3Vwcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkc2VlZCA9IGNzYklkZW50aWZpZXIuZ2V0RHNlZWQoKTtcbiAgICAgICAgY29uc3Qga2V5ID0gY3J5cHRvLmdlbmVyYXRlU2FmZVVpZChkc2VlZCwgbG9jYWxGb2xkZXIpO1xuICAgICAgICBpZiAoIWluc3RhbmNlc1trZXldKSB7XG4gICAgICAgICAgICBpbnN0YW5jZXNba2V5XSA9IG5ldyBSb290Q1NCKGxvY2FsRm9sZGVyLCBudWxsLCBjc2JJZGVudGlmaWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJvb3RDU0IgPSBpbnN0YW5jZXNba2V5XTtcblxuICAgICAgICByb290Q1NCLmxvYWRSYXdDU0IoJycsIChlcnIpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgcm9vdENTQiwgY3NiSWRlbnRpZmllciwgYmFja3Vwcyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsb2FkV2l0aElkZW50aWZpZXIobG9jYWxGb2xkZXIsIGNzYklkZW50aWZpZXIsIGNhbGxiYWNrKSB7XG4gICAgY29uc3QgbWFzdGVyRHNlZWQgPSBjc2JJZGVudGlmaWVyLmdldERzZWVkKCk7XG4gICAgY29uc3Qga2V5ID0gY3J5cHRvLmdlbmVyYXRlU2FmZVVpZChtYXN0ZXJEc2VlZCwgbG9jYWxGb2xkZXIpO1xuICAgIGlmICghaW5zdGFuY2VzW2tleV0pIHtcbiAgICAgICAgaW5zdGFuY2VzW2tleV0gPSBuZXcgUm9vdENTQihsb2NhbEZvbGRlciwgbnVsbCwgY3NiSWRlbnRpZmllcik7XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdENTQiA9IGluc3RhbmNlc1trZXldO1xuICAgIHJvb3RDU0IubG9hZFJhd0NTQignJywgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhudWxsLCByb290Q1NCKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTmV3KGxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyLCByYXdDU0IpIHtcbiAgICBpZiAoIWxvY2FsRm9sZGVyIHx8ICFjc2JJZGVudGlmaWVyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgcmVxdWlyZWQgYXJndW1lbnRzXCIpO1xuICAgIH1cblxuICAgIHJhd0NTQiA9IHJhd0NTQiB8fCBuZXcgUmF3Q1NCKCk7XG4gICAgY29uc3QgbWFzdGVyRHNlZWQgPSBjc2JJZGVudGlmaWVyLmdldERzZWVkKCk7XG4gICAgY29uc3Qga2V5ID0gY3J5cHRvLmdlbmVyYXRlU2FmZVVpZChtYXN0ZXJEc2VlZCwgbG9jYWxGb2xkZXIpO1xuICAgIGlmICghaW5zdGFuY2VzW2tleV0pIHtcbiAgICAgICAgaW5zdGFuY2VzW2tleV0gPSBuZXcgUm9vdENTQihsb2NhbEZvbGRlciwgcmF3Q1NCLCBjc2JJZGVudGlmaWVyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5zdGFuY2VzW2tleV07XG59XG5cbmZ1bmN0aW9uIHdyaXRlTmV3TWFzdGVyQ1NCKGxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyLCBjYWxsYmFjaykge1xuICAgIGlmICghbG9jYWxGb2xkZXIgfHwgIWNzYklkZW50aWZpZXIpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcignTWlzc2luZyByZXF1aXJlZCBhcmd1bWVudHMnKSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWFzdGVyRHNlZWQgPSBjc2JJZGVudGlmaWVyLmdldERzZWVkKCk7XG4gICAgY29uc3Qga2V5ID0gY3J5cHRvLmdlbmVyYXRlU2FmZVVpZChtYXN0ZXJEc2VlZCwgbG9jYWxGb2xkZXIpO1xuICAgIGlmICghaW5zdGFuY2VzW2tleV0pIHtcbiAgICAgICAgaW5zdGFuY2VzW2tleV0gPSBuZXcgUm9vdENTQihsb2NhbEZvbGRlciwgbnVsbCwgY3NiSWRlbnRpZmllcik7XG4gICAgfVxuXG4gICAgY29uc3Qgcm9vdENTQiA9IGluc3RhbmNlc1trZXldO1xuICAgIHJvb3RDU0Iuc2F2ZVJhd0NTQihuZXcgUmF3Q1NCKCksICcnLCBjYWxsYmFjayk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZU5ldyxcbiAgICBjcmVhdGVSb290Q1NCLFxuICAgIGxvYWRXaXRoSWRlbnRpZmllcixcbiAgICBsb2FkV2l0aFBpbixcbiAgICB3cml0ZU5ld01hc3RlckNTQlxufTsiLCJjb25zdCBmbG93c1V0aWxzID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0RzZWVkQ2FnZVwiKTtcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiYWRkQmFja3VwXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKGJhY2t1cFVybCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIGlmKCFiYWNrdXBVcmwpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIG5ldyBFcnJvcihcIk5vIGJhY2t1cCB1cmwgcHJvdmlkZWRcIikpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLmJhY2t1cFVybCA9IGJhY2t1cFVybDtcbiAgICAgICAgZnMuc3RhdChwYXRoLmpvaW4odGhpcy5sb2NhbEZvbGRlciwgXCIucHJpdmF0ZVNreVwiLCAnZHNlZWQnKSwgKGVyciwgc3RhdHMpPT57XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImNyZWF0ZVBpblwiLCBmbG93c1V0aWxzLmRlZmF1bHRQaW4sIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVBpbjogZnVuY3Rpb24gKHBpbikge1xuICAgICAgICB2YWxpZGF0b3IudmFsaWRhdGVQaW4odGhpcy5sb2NhbEZvbGRlciwgdGhpcywgXCJhZGRCYWNrdXBcIiwgcGluLCBmbG93c1V0aWxzLm5vVHJpZXMpO1xuICAgIH0sXG4gICAgXG4gICAgYWRkQmFja3VwOiBmdW5jdGlvbiAocGluID0gZmxvd3NVdGlscy5kZWZhdWx0UGluLCBiYWNrdXBzKSB7XG4gICAgICAgIGJhY2t1cHMgPSBiYWNrdXBzIHx8IFtdO1xuICAgICAgICBiYWNrdXBzLnB1c2godGhpcy5iYWNrdXBVcmwpO1xuICAgICAgICBjb25zdCBkc2VlZENhZ2UgPSBuZXcgRHNlZWRDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICBkc2VlZENhZ2Uuc2F2ZURzZWVkQmFja3VwcyhwaW4sIHRoaXMuY3NiSWRlbnRpZmllciwgYmFja3VwcywgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ2ZpbmlzaCcsIFwiRmFpbGVkIHRvIHNhdmUgYmFja3Vwc1wiKSk7XG4gICAgfSxcblxuICAgIGZpbmlzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgJ3ByaW50SW5mbycsIHRoaXMuYmFja3VwVXJsICsgJyBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgYWRkZWQgdG8gYmFja3VwcyBsaXN0LicpO1xuICAgIH1cbn0pOyIsIi8vIHZhciBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cbmNvbnN0IHV0aWxzID0gcmVxdWlyZShcIi4vLi4vLi4vdXRpbHMvZmxvd3NVdGlsc1wiKTtcbi8vIGNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG4vLyB2YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiYWRkQ3NiXCIsIHtcblx0c3RhcnQ6IGZ1bmN0aW9uIChhbGlhc0NzYiwgYWxpYXNEZXN0Q3NiKSB7XG5cdFx0dGhpcy5hbGlhc0NzYiA9IGFsaWFzQ3NiO1xuXHRcdHRoaXMuYWxpYXNEZXN0Q3NiID0gYWxpYXNEZXN0Q3NiO1xuXHRcdHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgMyk7XG5cdH0sXG5cdHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHV0aWxzLmNoZWNrUGluSXNWYWxpZChwaW4sIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdGlmKGVycil7XG5cdFx0XHRcdHNlbGYuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRQaW5cIiwgbm9Ucmllcy0xKTtcblx0XHRcdH1lbHNlIHtcblx0XHRcdFx0c2VsZi5hZGRDc2IocGluLCBzZWxmLmFsaWFzQ3NiKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcblx0YWRkQ3NiOiBmdW5jdGlvbiAocGluLCBhbGlhc0NTYiwgYWxpYXNEZXN0Q3NiLCBjYWxsYmFjaykge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR1dGlscy5nZXRDc2IocGluLCBhbGlhc0NTYiwgZnVuY3Rpb24gKGVyciwgcGFyZW50Q3NiKSB7XG5cdFx0XHRpZihlcnIpe1xuXHRcdFx0XHRzZWxmLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBlcnIsIFwiRmFpbGVkIHRvIGdldCBjc2JcIik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cbn0pOyIsImNvbnN0IGZsb3dzVXRpbHMgPSByZXF1aXJlKFwiLi8uLi8uLi91dGlscy9mbG93c1V0aWxzXCIpO1xuY29uc3QgdXRpbHMgPSByZXF1aXJlKFwiLi8uLi8uLi91dGlscy91dGlsc1wiKTtcbmNvbnN0IGNyeXB0byA9IHJlcXVpcmUoXCJwc2tjcnlwdG9cIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoXCIuLi9DU0JJZGVudGlmaWVyXCIpO1xuY29uc3QgSGFzaENhZ2UgPSByZXF1aXJlKCcuLi8uLi91dGlscy9IYXNoQ2FnZScpO1xuY29uc3QgUm9vdENTQiA9IHJlcXVpcmUoXCIuLi9Sb290Q1NCXCIpO1xuXG4kJC5zd2FybS5kZXNjcmliZShcImF0dGFjaEZpbGVcIiwgeyAvL3VybDogQ1NCMS9DU0IyL2FsaWFzRmlsZVxuICAgIHN0YXJ0OiBmdW5jdGlvbiAodXJsLCBmaWxlUGF0aCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7IC8vY3NiMTphc3NldFR5cGU6YWxpYXNcbiAgICAgICAgY29uc3Qge0NTQlBhdGgsIGFsaWFzfSA9IHV0aWxzLnByb2Nlc3NVcmwodXJsLCAnRmlsZVJlZmVyZW5jZScpO1xuICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoO1xuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXM7XG4gICAgICAgIHRoaXMuZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG4gICAgICAgIHZhbGlkYXRvci52YWxpZGF0ZVBpbih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLCAnbG9hZEZpbGVSZWZlcmVuY2UnLCBwaW4sIG5vVHJpZXMpO1xuICAgIH0sXG5cbiAgICB3aXRoQ1NCSWRlbnRpZmllcjogZnVuY3Rpb24gKGlkLCB1cmwsIGZpbGVQYXRoLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgY29uc3Qge0NTQlBhdGgsIGFsaWFzfSA9IHV0aWxzLnByb2Nlc3NVcmwodXJsLCAnRmlsZVJlZmVyZW5jZScpO1xuICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoO1xuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXM7XG4gICAgICAgIHRoaXMuZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLmNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihpZCk7XG4gICAgICAgIFJvb3RDU0IubG9hZFdpdGhJZGVudGlmaWVyKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMuY3NiSWRlbnRpZmllciwgKGVyciwgcm9vdENTQikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIGVyciwgXCJGYWlsZWQgdG8gbG9hZCByb290Q1NCXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yb290Q1NCID0gcm9vdENTQjtcbiAgICAgICAgICAgIHRoaXMubG9hZEZpbGVSZWZlcmVuY2UoKTtcblxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgbG9hZEZpbGVSZWZlcmVuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yb290Q1NCLmxvYWRSYXdDU0IoJycsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdsb2FkQXNzZXQnLCAnRmFpbGVkIHRvIGxvYWQgbWFzdGVyQ1NCLicpKTtcbiAgICB9LFxuXG4gICAgbG9hZEFzc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucm9vdENTQi5sb2FkQXNzZXRGcm9tUGF0aCh0aGlzLkNTQlBhdGgsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdzYXZlRmlsZVRvRGlzaycsICdGYWlsZWQgdG8gbG9hZCBhc3NldCcpKTtcbiAgICB9LFxuXG4gICAgc2F2ZUZpbGVUb0Rpc2s6IGZ1bmN0aW9uIChmaWxlUmVmZXJlbmNlKSB7XG4gICAgICAgIGlmIChmaWxlUmVmZXJlbmNlLmlzUGVyc2lzdGVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIG5ldyBFcnJvcihcIkZpbGUgaXMgcGVyc2lzdGVkXCIpLCBcIkEgZmlsZSB3aXRoIHRoZSBzYW1lIGFsaWFzIGFscmVhZHkgZXhpc3RzIFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcih1bmRlZmluZWQsIHRoaXMuY3NiSWRlbnRpZmllci5nZXRCYWNrdXBVcmxzKCkpO1xuICAgICAgICB0aGlzLmZpbGVJRCA9IHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyKTtcbiAgICAgICAgY3J5cHRvLm9uKCdwcm9ncmVzcycsIChwcm9ncmVzcykgPT4ge1xuICAgICAgICAgICAgdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAncmVwb3J0UHJvZ3Jlc3MnLCBwcm9ncmVzcyk7XG4gICAgICAgIH0pO1xuICAgICAgICBjcnlwdG8uZW5jcnlwdFN0cmVhbSh0aGlzLmZpbGVQYXRoLCB0aGlzLmZpbGVJRCwgY3NiSWRlbnRpZmllci5nZXREc2VlZCgpLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCAnc2F2ZUZpbGVSZWZlcmVuY2UnLCBcIkZhaWxlZCBhdCBmaWxlIGVuY3J5cHRpb24uXCIsIGZpbGVSZWZlcmVuY2UsIGNzYklkZW50aWZpZXIpKTtcblxuICAgIH0sXG5cblxuICAgIHNhdmVGaWxlUmVmZXJlbmNlOiBmdW5jdGlvbiAoZmlsZVJlZmVyZW5jZSwgY3NiSWRlbnRpZmllcikge1xuICAgICAgICBjcnlwdG8ucmVtb3ZlQWxsTGlzdGVuZXJzKCdwcm9ncmVzcycpO1xuICAgICAgICBmaWxlUmVmZXJlbmNlLmluaXQodGhpcy5hbGlhcywgY3NiSWRlbnRpZmllci5nZXRTZWVkKCksIGNzYklkZW50aWZpZXIuZ2V0RHNlZWQoKSk7XG4gICAgICAgIHRoaXMucm9vdENTQi5zYXZlQXNzZXRUb1BhdGgodGhpcy5DU0JQYXRoLCBmaWxlUmVmZXJlbmNlLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCAnY29tcHV0ZUhhc2gnLCBcIkZhaWxlZCB0byBzYXZlIGZpbGVcIiwgdGhpcy5maWxlSUQpKTtcbiAgICB9LFxuXG5cbiAgICBjb21wdXRlSGFzaDogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBmaWxlU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSh0aGlzLmZpbGVJRCk7XG4gICAgICAgIGNyeXB0by5wc2tIYXNoU3RyZWFtKGZpbGVTdHJlYW0sIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwibG9hZEhhc2hPYmpcIiwgXCJGYWlsZWQgdG8gY29tcHV0ZSBoYXNoXCIpKTtcbiAgICB9LFxuXG4gICAgbG9hZEhhc2hPYmo6IGZ1bmN0aW9uIChkaWdlc3QpIHtcbiAgICAgICAgdGhpcy5oYXNoQ2FnZSA9IG5ldyBIYXNoQ2FnZSh0aGlzLmxvY2FsRm9sZGVyKTtcbiAgICAgICAgdGhpcy5oYXNoQ2FnZS5sb2FkSGFzaCh2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImFkZFRvSGFzaE9ialwiLCBcIkZhaWxlZCB0byBsb2FkIGhhc2hPYmpcIiwgZGlnZXN0KSk7XG4gICAgfSxcblxuICAgIGFkZFRvSGFzaE9iajogZnVuY3Rpb24gKGhhc2hPYmosIGRpZ2VzdCkge1xuICAgICAgICBoYXNoT2JqW3BhdGguYmFzZW5hbWUodGhpcy5maWxlSUQpXSA9IGRpZ2VzdC50b1N0cmluZyhcImhleFwiKTtcbiAgICAgICAgdGhpcy5oYXNoQ2FnZS5zYXZlSGFzaChoYXNoT2JqLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcInByaW50U3VjY2Vzc1wiLCBcIkZhaWxlZCB0byBzYXZlIGhhc2hPYmpcIikpO1xuICAgIH0sXG5cbiAgICBwcmludFN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicHJpbnRJbmZvXCIsIHRoaXMuZmlsZVBhdGggKyBcIiBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgYWRkZWQgdG8gXCIgKyB0aGlzLkNTQlBhdGgpO1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJfX3JldHVybl9fXCIpO1xuICAgIH1cbn0pO1xuIiwiY29uc3QgZmxvd3NVdGlscyA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL2Zsb3dzVXRpbHMnKTtcbmNvbnN0IFJvb3RDU0IgPSByZXF1aXJlKFwiLi4vUm9vdENTQlwiKTtcbmNvbnN0IFJhd0NTQiA9IHJlcXVpcmUoXCIuLi9SYXdDU0JcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgRHNlZWRDYWdlID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0RzZWVkQ2FnZVwiKTtcbmNvbnN0IENTQklkZW50aWZpZXIgPSByZXF1aXJlKFwiLi4vQ1NCSWRlbnRpZmllclwiKTtcblxuJCQuc3dhcm0uZGVzY3JpYmUoXCJjcmVhdGVDc2JcIiwge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoQ1NCUGF0aCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgdGhpcy5DU0JQYXRoID0gQ1NCUGF0aCB8fCAnJztcbiAgICAgICAgdmFsaWRhdG9yLmNoZWNrTWFzdGVyQ1NCRXhpc3RzKGxvY2FsRm9sZGVyLCAoZXJyLCBzdGF0dXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJjcmVhdGVQaW5cIiwgZmxvd3NVdGlscy5kZWZhdWx0UGluKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFBpblwiLCBmbG93c1V0aWxzLm5vVHJpZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgd2l0aG91dFBpbjogZnVuY3Rpb24gKENTQlBhdGgsIGJhY2t1cHMsIGxvY2FsRm9sZGVyID0gcHJvY2Vzcy5jd2QoKSwgc2VlZCwgaXNNYXN0ZXIgPSBmYWxzZSkge1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMuQ1NCUGF0aCA9IENTQlBhdGg7XG4gICAgICAgIHRoaXMuaXNNYXN0ZXIgPSBpc01hc3RlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBiYWNrdXBzID09PSAndW5kZWZpbmVkJyB8fCBiYWNrdXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgYmFja3VwcyA9IFsgZmxvd3NVdGlscy5kZWZhdWx0QmFja3VwIF07XG4gICAgICAgIH1cblxuICAgICAgICB2YWxpZGF0b3IuY2hlY2tNYXN0ZXJDU0JFeGlzdHMobG9jYWxGb2xkZXIsIChlcnIsIHN0YXR1cykgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlTWFzdGVyQ1NCKGJhY2t1cHMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoc2VlZCk7XG4gICAgICAgICAgICAgICAgdGhpcy53aXRoQ1NCSWRlbnRpZmllcihDU0JQYXRoLCBjc2JJZGVudGlmaWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgd2l0aENTQklkZW50aWZpZXI6IGZ1bmN0aW9uIChDU0JQYXRoLCBjc2JJZGVudGlmaWVyKSB7XG4gICAgICAgIHRoaXMuQ1NCUGF0aCA9IENTQlBhdGg7XG4gICAgICAgIFJvb3RDU0IubG9hZFdpdGhJZGVudGlmaWVyKHRoaXMubG9jYWxGb2xkZXIsIGNzYklkZW50aWZpZXIsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsICdjcmVhdGVDU0InLCAnRmFpbGVkIHRvIGxvYWQgbWFzdGVyIHdpdGggcHJvdmlkZWQgZHNlZWQnKSk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG4gICAgICAgIHZhbGlkYXRvci52YWxpZGF0ZVBpbih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLCBcImNyZWF0ZUNTQlwiLCBwaW4sIG5vVHJpZXMpO1xuICAgIH0sXG5cbiAgICBsb2FkQmFja3VwczogZnVuY3Rpb24gKHBpbikge1xuICAgICAgICB0aGlzLnBpbiA9IHBpbjtcbiAgICAgICAgdGhpcy5kc2VlZENhZ2UgPSBuZXcgRHNlZWRDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICB0aGlzLmRzZWVkQ2FnZS5sb2FkRHNlZWRCYWNrdXBzKHRoaXMucGluLCAoZXJyLCBjc2JJZGVudGlmaWVyLCBiYWNrdXBzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVNYXN0ZXJDU0IoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVNYXN0ZXJDU0IoYmFja3Vwcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjcmVhdGVNYXN0ZXJDU0I6IGZ1bmN0aW9uIChiYWNrdXBzKSB7XG4gICAgICAgIHRoaXMuY3NiSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKHVuZGVmaW5lZCwgYmFja3VwcyB8fCBmbG93c1V0aWxzLmRlZmF1bHRCYWNrdXApO1xuXG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInByaW50U2Vuc2l0aXZlSW5mb1wiLCB0aGlzLmNzYklkZW50aWZpZXIuZ2V0U2VlZCgpLCBmbG93c1V0aWxzLmRlZmF1bHRQaW4pO1xuXG4gICAgICAgIGNvbnN0IHJhd0NTQiA9IG5ldyBSYXdDU0IoKTtcbiAgICAgICAgY29uc3QgbWV0YSA9IHJhd0NTQi5nZXRBc3NldCgnZ2xvYmFsLkNTQk1ldGEnLCAnbWV0YScpO1xuICAgICAgICBtZXRhLmluaXQoKTtcbiAgICAgICAgbWV0YS5zZXRJc01hc3Rlcih0cnVlKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmlzTWFzdGVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgbWV0YS5zZXRJc01hc3Rlcih0aGlzLmlzTWFzdGVyKTtcbiAgICAgICAgfVxuICAgICAgICByYXdDU0Iuc2F2ZUFzc2V0KG1ldGEpO1xuICAgICAgICB0aGlzLnJvb3RDU0IgPSBSb290Q1NCLmNyZWF0ZU5ldyh0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLmNzYklkZW50aWZpZXIsIHJhd0NTQik7XG4gICAgICAgIGNvbnN0IG5leHRQaGFzZSA9ICh0aGlzLkNTQlBhdGggPT09ICcnIHx8IHR5cGVvZiB0aGlzLkNTQlBhdGggPT09ICd1bmRlZmluZWQnKSA/ICdzYXZlUmF3Q1NCJyA6ICdjcmVhdGVDU0InO1xuICAgICAgICBpZiAodGhpcy5waW4pIHtcbiAgICAgICAgICAgIHRoaXMuZHNlZWRDYWdlLnNhdmVEc2VlZEJhY2t1cHModGhpcy5waW4sIHRoaXMuY3NiSWRlbnRpZmllciwgYmFja3VwcywgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgbmV4dFBoYXNlLCBcIkZhaWxlZCB0byBzYXZlIGRzZWVkIFwiKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzW25leHRQaGFzZV0oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjcmVhdGVDU0I6IGZ1bmN0aW9uIChyb290Q1NCKSB7XG4gICAgICAgIHRoaXMucm9vdENTQiA9IHRoaXMucm9vdENTQiB8fCByb290Q1NCO1xuICAgICAgICBjb25zdCByYXdDU0IgPSBuZXcgUmF3Q1NCKCk7XG4gICAgICAgIGNvbnN0IG1ldGEgPSByYXdDU0IuZ2V0QXNzZXQoXCJnbG9iYWwuQ1NCTWV0YVwiLCBcIm1ldGFcIik7XG4gICAgICAgIG1ldGEuaW5pdCgpO1xuICAgICAgICBtZXRhLnNldElzTWFzdGVyKGZhbHNlKTtcbiAgICAgICAgcmF3Q1NCLnNhdmVBc3NldChtZXRhKTtcbiAgICAgICAgdGhpcy5zYXZlUmF3Q1NCKHJhd0NTQik7XG4gICAgfSxcblxuICAgIHNhdmVSYXdDU0I6IGZ1bmN0aW9uIChyYXdDU0IpIHtcbiAgICAgICAgdGhpcy5yb290Q1NCLnNhdmVSYXdDU0IocmF3Q1NCLCB0aGlzLkNTQlBhdGgsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwicHJpbnRTdWNjZXNzXCIsIFwiRmFpbGVkIHRvIHNhdmUgcmF3IENTQlwiKSk7XG5cbiAgICB9LFxuXG5cbiAgICBwcmludFN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBcIlN1Y2Nlc3NmdWxseSBzYXZlZCBDU0IgYXQgcGF0aCBcIiArIHRoaXMuQ1NCUGF0aDtcbiAgICAgICAgaWYgKCF0aGlzLkNTQlBhdGggfHwgdGhpcy5DU0JQYXRoID09PSAnJykge1xuICAgICAgICAgICAgbWVzc2FnZSA9ICdTdWNjZXNzZnVsbHkgc2F2ZWQgQ1NCIHJvb3QnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInByaW50SW5mb1wiLCBtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnX19yZXR1cm5fXycpO1xuICAgIH1cbn0pO1xuIiwiY29uc3QgZmxvd3NVdGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCB1dGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL3V0aWxzXCIpO1xuY29uc3QgY3J5cHRvID0gcmVxdWlyZShcInBza2NyeXB0b1wiKTtcbmNvbnN0IHZhbGlkYXRvciA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy92YWxpZGF0b3JcIik7XG5jb25zdCBDU0JJZGVudGlmaWVyID0gcmVxdWlyZShcIi4uL0NTQklkZW50aWZpZXJcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwiZXh0cmFjdEZpbGVcIiwge1xuXHRzdGFydDogZnVuY3Rpb24gKHVybCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG5cdFx0dGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuXHRcdGNvbnN0IHtDU0JQYXRoLCBhbGlhc30gPSB1dGlscy5wcm9jZXNzVXJsKHVybCwgJ2dsb2JhbC5GaWxlUmVmZXJlbmNlJyk7XG5cdFx0dGhpcy5DU0JQYXRoID0gQ1NCUGF0aDtcblx0XHR0aGlzLmFsaWFzID0gYWxpYXM7XG5cdFx0dGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFBpblwiLCBmbG93c1V0aWxzLm5vVHJpZXMpO1xuXHR9LFxuXG5cdHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG5cdFx0dmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsIFwibG9hZEZpbGVBc3NldFwiLCBwaW4sIG5vVHJpZXMpO1xuXHR9LFxuXG5cdGxvYWRGaWxlQXNzZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLnJvb3RDU0IubG9hZEFzc2V0RnJvbVBhdGgodGhpcy5DU0JQYXRoLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImRlY3J5cHRGaWxlXCIsIFwiRmFpbGVkIHRvIGxvYWQgZmlsZSBhc3NldCBcIiArIHRoaXMuYWxpYXMpKTtcblx0fSxcblx0XG5cdGRlY3J5cHRGaWxlOiBmdW5jdGlvbiAoZmlsZVJlZmVyZW5jZSkge1xuXHRcdGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcihmaWxlUmVmZXJlbmNlLmRzZWVkKTtcblx0XHRjb25zdCBmaWxlUGF0aCA9IHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyKTtcblxuXHRcdGNyeXB0by5vbigncHJvZ3Jlc3MnLCAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ3JlcG9ydFByb2dyZXNzJywgcHJvZ3Jlc3MpO1xuICAgICAgICB9KTtcblxuXHRcdGNyeXB0by5kZWNyeXB0U3RyZWFtKGZpbGVQYXRoLCB0aGlzLmxvY2FsRm9sZGVyLCBjc2JJZGVudGlmaWVyLmdldERzZWVkKCksIChlcnIsIGZpbGVOYW1lcykgPT4ge1xuXHRcdFx0aWYoZXJyKXtcblx0XHRcdFx0cmV0dXJuIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImhhbmRsZUVycm9yXCIsIGVyciwgXCJGYWlsZWQgdG8gZGVjcnlwdCBmaWxlXCIgKyBmaWxlUGF0aCk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInByaW50SW5mb1wiLCB0aGlzLmFsaWFzICsgXCIgd2FzIHN1Y2Nlc3NmdWxseSBleHRyYWN0ZWQuIFwiKTtcblx0XHRcdHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcIl9fcmV0dXJuX19cIiwgZmlsZU5hbWVzKTtcblx0XHR9KTtcblx0fVxufSk7IiwiY29uc3QgZmxvd3NVdGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuLy8gY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCBSb290Q1NCID0gcmVxdWlyZShcIi4uL1Jvb3RDU0JcIik7XG5jb25zdCBDU0JJZGVudGlmaWVyID0gcmVxdWlyZShcIi4uL0NTQklkZW50aWZpZXJcIik7XG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwibGlzdENTQnNcIiwge1xuICAgIHN0YXJ0OiBmdW5jdGlvbiAoQ1NCUGF0aCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgdGhpcy5DU0JQYXRoID0gQ1NCUGF0aCB8fCAnJztcbiAgICAgICAgdmFsaWRhdG9yLmNoZWNrTWFzdGVyQ1NCRXhpc3RzKGxvY2FsRm9sZGVyLCAoZXJyLCBzdGF0dXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJub01hc3RlckNTQkV4aXN0c1wiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFBpblwiLCBmbG93c1V0aWxzLm5vVHJpZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgd2l0aENTQklkZW50aWZpZXI6IGZ1bmN0aW9uIChpZCwgQ1NCUGF0aCA9ICcnLCBsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5jc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoaWQpO1xuICAgICAgICB0aGlzLkNTQlBhdGggPSBDU0JQYXRoO1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMubG9hZE1hc3RlclJhd0NTQigpO1xuICAgIH0sXG5cbiAgICBsb2FkTWFzdGVyUmF3Q1NCOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFJvb3RDU0IubG9hZFdpdGhJZGVudGlmaWVyKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMuY3NiSWRlbnRpZmllciwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJsb2FkUmF3Q1NCXCIsIFwiRmFpbGVkIHRvIGNyZWF0ZSBSb290Q1NCLlwiKSk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG4gICAgICAgIHZhbGlkYXRvci52YWxpZGF0ZVBpbih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLCAnbG9hZFJhd0NTQicsIHBpbiwgbm9Ucmllcyk7XG4gICAgfSxcblxuICAgIGxvYWRSYXdDU0I6IGZ1bmN0aW9uIChyb290Q1NCKSB7XG4gICAgICAgIGlmKHR5cGVvZiB0aGlzLnJvb3RDU0IgPT09IFwidW5kZWZpbmVkXCIgJiYgcm9vdENTQil7XG4gICAgICAgICAgICB0aGlzLnJvb3RDU0IgPSByb290Q1NCO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucm9vdENTQi5sb2FkUmF3Q1NCKHRoaXMuQ1NCUGF0aCwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ2dldENTQnMnLCAnRmFpbGVkIHRvIGxvYWQgcmF3Q1NCJykpO1xuICAgIH0sXG5cbiAgICBnZXRDU0JzOiBmdW5jdGlvbiAocmF3Q1NCKSB7XG4gICAgICAgIGNvbnN0IGNzYlJlZmVyZW5jZXMgPSByYXdDU0IuZ2V0QWxsQXNzZXRzKCdnbG9iYWwuQ1NCUmVmZXJlbmNlJyk7XG4gICAgICAgIGNvbnN0IGNzYnNBbGlhc2VzID0gY3NiUmVmZXJlbmNlcy5tYXAoKHJlZikgPT4gcmVmLmFsaWFzKTtcblxuICAgICAgICBjb25zdCBmaWxlUmVmZXJlbmNlcyA9IHJhd0NTQi5nZXRBbGxBc3NldHMoJ2dsb2JhbC5GaWxlUmVmZXJlbmNlJyk7XG4gICAgICAgIGNvbnN0IGZpbGVzQWxpYXNlcyA9IGZpbGVSZWZlcmVuY2VzLm1hcCgocmVmKSA9PiByZWYuYWxpYXMpO1xuXG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcIl9fcmV0dXJuX19cIiwge1xuICAgICAgICAgICAgY3NiczogY3Nic0FsaWFzZXMsXG4gICAgICAgICAgICBmaWxlczogZmlsZXNBbGlhc2VzXG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG4iLCJjb25zdCB1dGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCBSb290Q1NCID0gcmVxdWlyZShcIi4uL1Jvb3RDU0JcIik7XG5jb25zdCBEc2VlZENhZ2UgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvRHNlZWRDYWdlXCIpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoXCIuLi9DU0JJZGVudGlmaWVyXCIpO1xuXG4kJC5zd2FybS5kZXNjcmliZShcInJlc2V0UGluXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKGxvY2FsRm9sZGVyID0gcHJvY2Vzcy5jd2QoKSkge1xuICAgICAgICB0aGlzLmxvY2FsRm9sZGVyID0gbG9jYWxGb2xkZXI7XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRTZWVkXCIsIHV0aWxzLm5vVHJpZXMpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVNlZWQ6IGZ1bmN0aW9uIChzZWVkLCBub1RyaWVzKSB7XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAgIHRoaXMuY3NiSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKHNlZWQpO1xuICAgICAgICAgICAgUm9vdENTQi5sb2FkV2l0aElkZW50aWZpZXIodGhpcy5sb2NhbEZvbGRlciwgdGhpcy5jc2JJZGVudGlmaWVyLCAoZXJyLCByb290Q1NCKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkU2VlZFwiLCBub1RyaWVzIC0gMSk7XG4gICAgICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcImluc2VydFBpblwiLCB1dGlscy5ub1RyaWVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgbmV3IEVycm9yKCdJbnZhbGlkIHNlZWQnKSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWN0dWFsaXplUGluOiBmdW5jdGlvbiAocGluKSB7XG4gICAgICAgIGNvbnN0IGRzZWVkQ2FnZSA9IG5ldyBEc2VlZENhZ2UodGhpcy5sb2NhbEZvbGRlcik7XG4gICAgICAgIGRzZWVkQ2FnZS5zYXZlRHNlZWRCYWNrdXBzKHBpbiwgdGhpcy5jc2JJZGVudGlmaWVyLCB1bmRlZmluZWQsIChlcnIpPT57XG4gICAgICAgICAgICBpZihlcnIpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBcIkZhaWxlZCB0byBzYXZlIGRzZWVkLlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicHJpbnRJbmZvXCIsIFwiVGhlIHBpbiBoYXMgYmVlbiBjaGFuZ2VkIHN1Y2Nlc3NmdWxseS5cIik7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuIiwiY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuY29uc3QgZmxvd3NVdGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL2Zsb3dzVXRpbHNcIik7XG5jb25zdCB1dGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL3V0aWxzXCIpO1xuY29uc3QgY3J5cHRvID0gcmVxdWlyZShcInBza2NyeXB0b1wiKTtcbmNvbnN0IGZzID0gcmVxdWlyZShcImZzXCIpO1xuY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL3ZhbGlkYXRvclwiKTtcbmNvbnN0IERzZWVkQ2FnZSA9IHJlcXVpcmUoXCIuLi8uLi91dGlscy9Ec2VlZENhZ2VcIik7XG5jb25zdCBSb290Q1NCID0gcmVxdWlyZSgnLi4vUm9vdENTQicpO1xuY29uc3QgQ1NCSWRlbnRpZmllciA9IHJlcXVpcmUoJy4uL0NTQklkZW50aWZpZXInKTtcbmNvbnN0IEJhY2t1cEVuZ2luZSA9IHJlcXVpcmUoJy4uL0JhY2t1cEVuZ2luZScpO1xuY29uc3QgSGFzaENhZ2UgPSByZXF1aXJlKCcuLi8uLi91dGlscy9IYXNoQ2FnZScpO1xuY29uc3QgQXN5bmNEaXNwYXRjaGVyID0gcmVxdWlyZSgnLi4vLi4vdXRpbHMvQXN5bmNEaXNwYXRjaGVyJyk7XG5cblxuJCQuc3dhcm0uZGVzY3JpYmUoXCJyZXN0b3JlXCIsIHtcbiAgICBzdGFydDogZnVuY3Rpb24gKHVybCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgY29uc3Qge0NTQlBhdGgsIGFsaWFzfSA9IHV0aWxzLnByb2Nlc3NVcmwodXJsLCAnZ2xvYmFsLkNTQlJlZmVyZW5jZScpO1xuICAgICAgICAgICAgdGhpcy5DU0JQYXRoID0gQ1NCUGF0aDtcbiAgICAgICAgICAgIHRoaXMuQ1NCQWxpYXMgPSBhbGlhcztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInJlYWRTZWVkXCIpO1xuICAgIH0sXG5cbiAgICB3aXRoU2VlZDogZnVuY3Rpb24gKHVybCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpLCBzZWVkUmVzdG9yZSwgbG9jYWxTZWVkKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgaWYgKHVybCkge1xuICAgICAgICAgICAgY29uc3Qge0NTQlBhdGgsIGFsaWFzfSA9IHV0aWxzLnByb2Nlc3NVcmwodXJsLCAnZ2xvYmFsLkNTQlJlZmVyZW5jZScpO1xuICAgICAgICAgICAgdGhpcy5DU0JQYXRoID0gQ1NCUGF0aDtcbiAgICAgICAgICAgIHRoaXMuQ1NCQWxpYXMgPSBhbGlhcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsb2NhbFNlZWQpIHtcbiAgICAgICAgICAgIHRoaXMubG9jYWxDU0JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIobG9jYWxTZWVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVzdG9yZUNTQihzZWVkUmVzdG9yZSk7XG4gICAgfSxcblxuICAgIHJlc3RvcmVDU0I6IGZ1bmN0aW9uIChyZXN0b3JlU2VlZCkge1xuICAgICAgICB0aGlzLmhhc2hDYWdlID0gbmV3IEhhc2hDYWdlKHRoaXMubG9jYWxGb2xkZXIpO1xuICAgICAgICB0aGlzLmhhc2hPYmogPSB7fTtcbiAgICAgICAgdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKHJlc3RvcmVTZWVkKTtcbiAgICAgICAgbGV0IGJhY2t1cFVybHM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBiYWNrdXBVcmxzID0gdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllci5nZXRCYWNrdXBVcmxzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIG5ldyBFcnJvcignSW52YWxpZCBzZWVkJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5iYWNrdXBVcmxzID0gYmFja3VwVXJscztcbiAgICAgICAgdGhpcy5yZXN0b3JlRHNlZWRDYWdlID0gbmV3IERzZWVkQ2FnZSh0aGlzLmxvY2FsRm9sZGVyKTtcbiAgICAgICAgY29uc3QgYmFja3VwRW5naW5lID0gbmV3IEJhY2t1cEVuZ2luZS5nZXRCYWNrdXBFbmdpbmUodGhpcy5iYWNrdXBVcmxzKTtcblxuICAgICAgICBiYWNrdXBFbmdpbmUubG9hZCh0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyLCAoZXJyLCBlbmNyeXB0ZWRDU0IpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaGFuZGxlRXJyb3JcIiwgZXJyLCBcIkZhaWxlZCB0byByZXN0b3JlIENTQlwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5fX2FkZENTQkhhc2godGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllciwgZW5jcnlwdGVkQ1NCKTtcbiAgICAgICAgICAgIHRoaXMuZW5jcnlwdGVkQ1NCID0gZW5jcnlwdGVkQ1NCO1xuXG4gICAgICAgICAgICB2YWxpZGF0b3IuY2hlY2tNYXN0ZXJDU0JFeGlzdHModGhpcy5sb2NhbEZvbGRlciwgKGVyciwgc3RhdHVzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUF1eEZvbGRlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2NhbENTQklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLkNTQkFsaWFzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1dGlscy5kZWxldGVSZWN1cnNpdmVseSh0aGlzLmxvY2FsRm9sZGVyLCB0cnVlLCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaGFuZGxlRXJyb3JcIiwgbmV3IEVycm9yKFwiTm8gQ1NCIGFsaWFzIHdhcyBzcGVjaWZpZWRcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRlQ1NCKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuQ1NCQWxpYXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJoYW5kbGVFcnJvclwiLCBuZXcgRXJyb3IoXCJObyBDU0IgYWxpYXMgd2FzIHNwZWNpZmllZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIGZsb3dzVXRpbHMubm9Ucmllcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHZhbGlkYXRlUGluOiBmdW5jdGlvbiAocGluLCBub1RyaWVzKSB7XG4gICAgICAgIHZhbGlkYXRvci52YWxpZGF0ZVBpbih0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLCBcIndyaXRlQ1NCXCIsIHBpbiwgbm9Ucmllcyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUF1eEZvbGRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICBmcy5ta2RpcihwYXRoLmpvaW4odGhpcy5sb2NhbEZvbGRlciwgXCIucHJpdmF0ZVNreVwiKSwge3JlY3Vyc2l2ZTogdHJ1ZX0sIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwid3JpdGVDU0JcIiwgXCJGYWlsZWQgdG8gY3JlYXRlIGZvbGRlciAucHJpdmF0ZVNreVwiKSk7XG4gICAgfSxcblxuXG4gICAgd3JpdGVDU0I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnMud3JpdGVGaWxlKHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyKSwgdGhpcy5lbmNyeXB0ZWRDU0IsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwiY3JlYXRlUm9vdENTQlwiLCBcIkZhaWxlZCB0byB3cml0ZSBtYXN0ZXJDU0IgdG8gZGlza1wiKSk7XG4gICAgfSxcblxuICAgIGNyZWF0ZVJvb3RDU0I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUm9vdENTQi5sb2FkV2l0aElkZW50aWZpZXIodGhpcy5sb2NhbEZvbGRlciwgdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllciwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJsb2FkUmF3Q1NCXCIsIFwiRmFpbGVkIHRvIGNyZWF0ZSByb290Q1NCIHdpdGggZHNlZWRcIikpO1xuICAgIH0sXG5cbiAgICBsb2FkUmF3Q1NCOiBmdW5jdGlvbiAocm9vdENTQikge1xuXG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyID0gbmV3IEFzeW5jRGlzcGF0Y2hlcigoIGVycnMsIHN1Y2NzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmhhc2hDYWdlLnNhdmVIYXNoKHRoaXMuaGFzaE9iaiwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgZXJyLCAnRmFpbGVkIHRvIHNhdmUgaGFzaE9iaicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdwcmludEluZm8nLCAnQWxsIENTQnMgaGF2ZSBiZWVuIHJlc3RvcmVkLicpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ19fcmV0dXJuX18nKTtcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByb290Q1NCLmxvYWRSYXdDU0IoJycsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwiY2hlY2tDU0JTdGF0dXNcIiwgXCJGYWlsZWQgdG8gbG9hZCBSYXdDU0JcIiwgcm9vdENTQikpO1xuICAgIH0sXG5cbiAgICBjaGVja0NTQlN0YXR1czogZnVuY3Rpb24gKHJhd0NTQiwgcm9vdENTQikge1xuICAgICAgICB0aGlzLnJhd0NTQiA9IHJhd0NTQjtcbiAgICAgICAgY29uc3QgbWV0YSA9IHRoaXMucmF3Q1NCLmdldEFzc2V0KCdnbG9iYWwuQ1NCTWV0YScsICdtZXRhJyk7XG4gICAgICAgIGlmICh0aGlzLnJvb3RDU0IpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoQ1NCKHRoaXMucm9vdENTQiwgdGhpcy5DU0JQYXRoLCB0aGlzLkNTQkFsaWFzLCB0aGlzLmNzYlJlc3RvcmVJZGVudGlmaWVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChtZXRhLmlzTWFzdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yb290Q1NCID0gcm9vdENTQjtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVEc2VlZCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZU1hc3RlckNTQigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNhdmVEc2VlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlc3RvcmVEc2VlZENhZ2Uuc2F2ZURzZWVkQmFja3VwcyhmbG93c1V0aWxzLmRlZmF1bHRQaW4sIHRoaXMuY3NiUmVzdG9yZUlkZW50aWZpZXIsIHVuZGVmaW5lZCwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJjb2xsZWN0RmlsZXNcIiwgXCJGYWlsZWQgdG8gc2F2ZSBkc2VlZFwiLCB0aGlzLnJhd0NTQiwgdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllciwgJycsICdtYXN0ZXInKSk7XG4gICAgfSxcblxuXG4gICAgY3JlYXRlTWFzdGVyQ1NCOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGNzYklkZW50aWZpZXIgPSBuZXcgQ1NCSWRlbnRpZmllcih1bmRlZmluZWQsIHRoaXMuYmFja3VwVXJscyk7XG4gICAgICAgIHRoaXMuc3dhcm0oXCJpbnRlcmFjdGlvblwiLCBcInByaW50U2Vuc2l0aXZlSW5mb1wiLCBjc2JJZGVudGlmaWVyLmdldFNlZWQoKSwgZmxvd3NVdGlscy5kZWZhdWx0UGluKTtcbiAgICAgICAgdGhpcy5yb290Q1NCID0gUm9vdENTQi5jcmVhdGVOZXcodGhpcy5sb2NhbEZvbGRlciwgY3NiSWRlbnRpZmllcik7XG4gICAgICAgIHRoaXMucmVzdG9yZURzZWVkQ2FnZS5zYXZlRHNlZWRCYWNrdXBzKGZsb3dzVXRpbHMuZGVmYXVsdFBpbiwgY3NiSWRlbnRpZmllciwgdW5kZWZpbmVkLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImF0dGFjaENTQlwiLCBcIkZhaWxlZCB0byBzYXZlIG1hc3RlciBkc2VlZCBcIiwgdGhpcy5yb290Q1NCLCB0aGlzLkNTQlBhdGgsIHRoaXMuQ1NCQWxpYXMsIHRoaXMuY3NiUmVzdG9yZUlkZW50aWZpZXIpKTtcbiAgICB9LFxuXG5cbiAgICBhdHRhY2hDU0I6IGZ1bmN0aW9uIChyb290Q1NCLCBDU0JQYXRoLCBDU0JBbGlhcywgY3NiSWRlbnRpZmllcikge1xuICAgICAgICB0aGlzLl9fYXR0YWNoQ1NCKHJvb3RDU0IsIENTQlBhdGgsIENTQkFsaWFzLCBjc2JJZGVudGlmaWVyLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCAnbG9hZFJlc3RvcmVkUmF3Q1NCJywgJ0ZhaWxlZCB0byBhdHRhY2ggcmF3Q1NCJykpO1xuXG4gICAgfSxcblxuICAgIGxvYWRSZXN0b3JlZFJhd0NTQjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLkNTQlBhdGggPSB0aGlzLkNTQlBhdGguc3BsaXQoJzonKVswXSArICcvJyArIHRoaXMuQ1NCQWxpYXM7XG4gICAgICAgIHRoaXMucm9vdENTQi5sb2FkUmF3Q1NCKHRoaXMuQ1NCUGF0aCwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgXCJjb2xsZWN0RmlsZXNcIiwgXCJGYWlsZWQgdG8gbG9hZCByZXN0b3JlZCBSYXdDU0JcIiwgdGhpcy5jc2JSZXN0b3JlSWRlbnRpZmllciwgdGhpcy5DU0JQYXRoLCB0aGlzLkNTQkFsaWFzKSk7XG4gICAgfSxcblxuICAgIGNvbGxlY3RGaWxlczogZnVuY3Rpb24gKHJhd0NTQiwgY3NiSWRlbnRpZmllciwgY3VycmVudFBhdGgsIGFsaWFzLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGNvbnN0IGxpc3RGaWxlcyA9IHJhd0NTQi5nZXRBbGxBc3NldHMoJ2dsb2JhbC5GaWxlUmVmZXJlbmNlJyk7XG4gICAgICAgIGNvbnN0IGFzeW5jRGlzcGF0Y2hlciA9IG5ldyBBc3luY0Rpc3BhdGNoZXIoKGVycnMsIHN1Y2NzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3RDU0JzKHJhd0NTQiwgY3NiSWRlbnRpZmllciwgY3VycmVudFBhdGgsIGFsaWFzKTtcbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnJzLCBzdWNjcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChsaXN0RmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBhc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxpc3RGaWxlcy5mb3JFYWNoKChmaWxlUmVmZXJlbmNlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoZmlsZVJlZmVyZW5jZS5kc2VlZCk7XG4gICAgICAgICAgICBjb25zdCBmaWxlQWxpYXMgPSBmaWxlUmVmZXJlbmNlLmFsaWFzO1xuICAgICAgICAgICAgY29uc3QgdXJscyA9IGNzYklkZW50aWZpZXIuZ2V0QmFja3VwVXJscygpO1xuICAgICAgICAgICAgY29uc3QgYmFja3VwRW5naW5lID0gQmFja3VwRW5naW5lLmdldEJhY2t1cEVuZ2luZSh1cmxzKTtcbiAgICAgICAgICAgIGFzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KCk7XG4gICAgICAgICAgICBiYWNrdXBFbmdpbmUubG9hZChjc2JJZGVudGlmaWVyLCAoZXJyLCBlbmNyeXB0ZWRGaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdDb3VsZCBub3QgZG93bmxvYWQgZmlsZSAnICsgZmlsZUFsaWFzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9fYWRkQ1NCSGFzaChjc2JJZGVudGlmaWVyLCBlbmNyeXB0ZWRGaWxlKTtcblxuICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZSh1dGlscy5nZW5lcmF0ZVBhdGgodGhpcy5sb2NhbEZvbGRlciwgY3NiSWRlbnRpZmllciksIGVuY3J5cHRlZEZpbGUsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgZXJyLCAnQ291bGQgbm90IHNhdmUgZmlsZSAnICsgZmlsZUFsaWFzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCh1bmRlZmluZWQsIGZpbGVBbGlhcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbGxlY3RDU0JzOiBmdW5jdGlvbiAocmF3Q1NCLCBjc2JJZGVudGlmaWVyLCBjdXJyZW50UGF0aCwgYWxpYXMpIHtcblxuICAgICAgICBjb25zdCBsaXN0Q1NCcyA9IHJhd0NTQi5nZXRBbGxBc3NldHMoJ2dsb2JhbC5DU0JSZWZlcmVuY2UnKTtcbiAgICAgICAgY29uc3QgbmV4dEFyZ3VtZW50cyA9IFtdO1xuICAgICAgICBsZXQgY291bnRlciA9IDA7XG5cbiAgICAgICAgaWYgKGxpc3RDU0JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eSgpO1xuICAgICAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsaXN0Q1NCcyAmJiBsaXN0Q1NCcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsaXN0Q1NCcy5mb3JFYWNoKChDU0JSZWZlcmVuY2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0UGF0aCA9IGN1cnJlbnRQYXRoICsgJy8nICsgQ1NCUmVmZXJlbmNlLmFsaWFzO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5leHRDU0JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoQ1NCUmVmZXJlbmNlLmRzZWVkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0QWxpYXMgPSBDU0JSZWZlcmVuY2UuYWxpYXM7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV4dFVSTHMgPSBjc2JJZGVudGlmaWVyLmdldEJhY2t1cFVybHMoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBiYWNrdXBFbmdpbmUgPSBCYWNrdXBFbmdpbmUuZ2V0QmFja3VwRW5naW5lKG5leHRVUkxzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5kaXNwYXRjaEVtcHR5KCk7XG4gICAgICAgICAgICAgICAgYmFja3VwRW5naW5lLmxvYWQobmV4dENTQklkZW50aWZpZXIsIChlcnIsIGVuY3J5cHRlZENTQikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdDb3VsZCBub3QgZG93bmxvYWQgQ1NCICcgKyBuZXh0QWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fX2FkZENTQkhhc2gobmV4dENTQklkZW50aWZpZXIsIGVuY3J5cHRlZENTQik7XG5cbiAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlKHV0aWxzLmdlbmVyYXRlUGF0aCh0aGlzLmxvY2FsRm9sZGVyLCBuZXh0Q1NCSWRlbnRpZmllciksIGVuY3J5cHRlZENTQiwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIGVyciwgJ0NvdWxkIG5vdCBzYXZlIENTQiAnICsgbmV4dEFsaWFzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yb290Q1NCLmxvYWRSYXdDU0IobmV4dFBhdGgsIChlcnIsIG5leHRSYXdDU0IpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3dhcm0oJ2ludGVyYWN0aW9uJywgJ2hhbmRsZUVycm9yJywgZXJyLCAnRmFpbGVkIHRvIGxvYWQgQ1NCICcgKyBuZXh0QWxpYXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0QXJndW1lbnRzLnB1c2goWyBuZXh0UmF3Q1NCLCBuZXh0Q1NCSWRlbnRpZmllciwgbmV4dFBhdGgsIG5leHRBbGlhcyBdKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgrK2NvdW50ZXIgPT09IGxpc3RDU0JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0QXJndW1lbnRzLmZvckVhY2goKGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29sbGVjdEZpbGVzKC4uLmFyZ3MsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCh1bmRlZmluZWQsIGFsaWFzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfX3RyeURvd25sb2FkKHVybHMsIGNzYklkZW50aWZpZXIsIGluZGV4LCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoaW5kZXggPT09IHVybHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKCdDb3VsZCBub3QgZG93bmxvYWQgcmVzb3VyY2UnKSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB1cmwgPSB1cmxzW2luZGV4XTtcbiAgICAgICAgdGhpcy5iYWNrdXBFbmdpbmUubG9hZCh1cmwsIGNzYklkZW50aWZpZXIsIChlcnIsIHJlc291cmNlKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX190cnlEb3dubG9hZCh1cmxzLCBjc2JJZGVudGlmaWVyLCArK2luZGV4LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHVuZGVmaW5lZCwgcmVzb3VyY2UpO1xuICAgICAgICB9KTtcblxuICAgIH0sXG5cbiAgICBfX2FkZENTQkhhc2g6IGZ1bmN0aW9uIChjc2JJZGVudGlmaWVyLCBlbmNyeXB0ZWRDU0IpIHtcbiAgICAgICAgY29uc3QgcHNrSGFzaCA9IG5ldyBjcnlwdG8uUHNrSGFzaCgpO1xuICAgICAgICBwc2tIYXNoLnVwZGF0ZShlbmNyeXB0ZWRDU0IpO1xuICAgICAgICB0aGlzLmhhc2hPYmpbY3NiSWRlbnRpZmllci5nZXRVaWQoKV0gPSBwc2tIYXNoLmRpZ2VzdCgpLnRvU3RyaW5nKCdoZXgnKTtcblxuICAgIH0sXG5cbiAgICBfX2F0dGFjaENTQjogZnVuY3Rpb24gKHJvb3RDU0IsIENTQlBhdGgsIENTQkFsaWFzLCBjc2JJZGVudGlmaWVyLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIUNTQkFsaWFzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiTm8gQ1NCIGFsaWFzIHdhcyBzcGVjaWZpZWRcIikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcm9vdENTQi5sb2FkUmF3Q1NCKENTQlBhdGgsIChlcnIsIHJhd0NTQikgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJvb3RDU0IubG9hZEFzc2V0RnJvbVBhdGgoQ1NCUGF0aCwgKGVyciwgY3NiUmVmKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY3NiUmVmLmluaXQoQ1NCQWxpYXMsIGNzYklkZW50aWZpZXIuZ2V0U2VlZCgpLCBjc2JJZGVudGlmaWVyLmdldERzZWVkKCkpO1xuICAgICAgICAgICAgICAgICAgICByb290Q1NCLnNhdmVBc3NldFRvUGF0aChDU0JQYXRoLCBjc2JSZWYsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihgQSBDU0IgaGF2aW5nIHRoZSBhbGlhcyAke0NTQkFsaWFzfSBhbHJlYWR5IGV4aXN0cy5gKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG4iLCJjb25zdCB1dGlscyA9IHJlcXVpcmUoXCIuLy4uLy4uL3V0aWxzL3V0aWxzXCIpO1xuY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCB2YWxpZGF0b3IgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvdmFsaWRhdG9yXCIpO1xuY29uc3QgSGFzaENhZ2UgPSByZXF1aXJlKCcuLi8uLi91dGlscy9IYXNoQ2FnZScpO1xuY29uc3QgQXN5bmNEaXNwYXRjaGVyID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL0FzeW5jRGlzcGF0Y2hlclwiKTtcbmNvbnN0IFJvb3RDU0IgPSByZXF1aXJlKCcuLi9Sb290Q1NCJyk7XG5jb25zdCBDU0JJZGVudGlmaWVyID0gcmVxdWlyZSgnLi4vQ1NCSWRlbnRpZmllcicpO1xuY29uc3QgQmFja3VwRW5naW5lID0gcmVxdWlyZSgnLi4vQmFja3VwRW5naW5lJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5cbiQkLnN3YXJtLmRlc2NyaWJlKFwic2F2ZUJhY2t1cFwiLCB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uIChsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIDMpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVBpbjogZnVuY3Rpb24gKHBpbiwgbm9Ucmllcykge1xuICAgICAgICB2YWxpZGF0b3IudmFsaWRhdGVQaW4odGhpcy5sb2NhbEZvbGRlciwgdGhpcywgXCJsb2FkSGFzaEZpbGVcIiwgcGluLCBub1RyaWVzKTtcbiAgICB9LFxuXG4gICAgd2l0aENTQklkZW50aWZpZXI6IGZ1bmN0aW9uIChpZCwgbG9jYWxGb2xkZXIgPSBwcm9jZXNzLmN3ZCgpKSB7XG4gICAgICAgIHRoaXMubG9jYWxGb2xkZXIgPSBsb2NhbEZvbGRlcjtcbiAgICAgICAgdGhpcy5jc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoaWQpO1xuICAgICAgICBSb290Q1NCLmxvYWRXaXRoSWRlbnRpZmllcihsb2NhbEZvbGRlciwgdGhpcy5jc2JJZGVudGlmaWVyLCAoZXJyLCByb290Q1NCKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBlcnIsICdGYWlsZWQgdG8gbG9hZCByb290IENTQicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yb290Q1NCID0gcm9vdENTQjtcbiAgICAgICAgICAgIHRoaXMubG9hZEhhc2hGaWxlKCk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBsb2FkSGFzaEZpbGU6IGZ1bmN0aW9uIChwaW4sIGJhY2t1cHMpIHtcbiAgICAgICAgdGhpcy5iYWNrdXBzID0gYmFja3VwcztcbiAgICAgICAgdGhpcy5oYXNoQ2FnZSA9IG5ldyBIYXNoQ2FnZSh0aGlzLmxvY2FsRm9sZGVyKTtcbiAgICAgICAgdGhpcy5oYXNoQ2FnZS5sb2FkSGFzaCh2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCAncmVhZEVuY3J5cHRlZE1hc3RlcicsICdGYWlsZWQgdG8gbG9hZCBoYXNoIGZpbGUnKSk7XG4gICAgfSxcblxuICAgIHJlYWRFbmNyeXB0ZWRNYXN0ZXI6IGZ1bmN0aW9uIChoYXNoRmlsZSkge1xuICAgICAgICB0aGlzLmhhc2hGaWxlID0gaGFzaEZpbGU7XG4gICAgICAgIHRoaXMubWFzdGVySUQgPSB1dGlscy5nZW5lcmF0ZVBhdGgodGhpcy5sb2NhbEZvbGRlciwgdGhpcy5jc2JJZGVudGlmaWVyKTtcbiAgICAgICAgZnMucmVhZEZpbGUodGhpcy5tYXN0ZXJJRCwgdmFsaWRhdG9yLnJlcG9ydE9yQ29udGludWUodGhpcywgJ2xvYWRNYXN0ZXJSYXdDU0InLCAnRmFpbGVkIHRvIHJlYWQgbWFzdGVyQ1NCLicpKTtcbiAgICB9LFxuXG5cbiAgICBsb2FkTWFzdGVyUmF3Q1NCOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucm9vdENTQi5sb2FkUmF3Q1NCKCcnLCB2YWxpZGF0b3IucmVwb3J0T3JDb250aW51ZSh0aGlzLCBcImRpc3BhdGNoZXJcIiwgXCJGYWlsZWQgdG8gbG9hZCBtYXN0ZXJDU0JcIikpO1xuICAgIH0sXG5cbiAgICBkaXNwYXRjaGVyOiBmdW5jdGlvbiAocmF3Q1NCKSB7XG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyID0gbmV3IEFzeW5jRGlzcGF0Y2hlcigoZXJyb3JzLCByZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FybSgnaW50ZXJhY3Rpb24nLCAnaGFuZGxlRXJyb3InLCBKU09OLnN0cmluZ2lmeShlcnJvcnMsIG51bGwsICdcXHQnKSwgJ0ZhaWxlZCB0byBjb2xsZWN0IGFsbCBDU0JzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb2xsZWN0RmlsZXMocmVzdWx0cyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLmRpc3BhdGNoRW1wdHkoKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0Q1NCcyhyYXdDU0IsIHRoaXMuY3NiSWRlbnRpZmllciwgJycsICdtYXN0ZXInKTtcbiAgICB9LFxuXG4gICAgY29sbGVjdENTQnM6IGZ1bmN0aW9uIChyYXdDU0IsIGNzYklkZW50aWZpZXIsIGN1cnJlbnRQYXRoLCBhbGlhcykge1xuICAgICAgICBjb25zdCBsaXN0Q1NCcyA9IHJhd0NTQi5nZXRBbGxBc3NldHMoJ2dsb2JhbC5DU0JSZWZlcmVuY2UnKTtcblxuICAgICAgICBjb25zdCBuZXh0QXJndW1lbnRzID0gW107XG4gICAgICAgIGxldCBjb3VudGVyID0gMDtcblxuICAgICAgICBsaXN0Q1NCcy5mb3JFYWNoKChDU0JSZWZlcmVuY2UpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5leHRQYXRoID0gY3VycmVudFBhdGggKyAnLycgKyBDU0JSZWZlcmVuY2UuYWxpYXM7XG4gICAgICAgICAgICBjb25zdCBuZXh0Q1NCSWRlbnRpZmllciA9IG5ldyBDU0JJZGVudGlmaWVyKENTQlJlZmVyZW5jZS5kc2VlZCk7XG4gICAgICAgICAgICBjb25zdCBuZXh0QWxpYXMgPSBDU0JSZWZlcmVuY2UuYWxpYXM7XG4gICAgICAgICAgICB0aGlzLnJvb3RDU0IubG9hZFJhd0NTQihuZXh0UGF0aCwgKGVyciwgbmV4dFJhd0NTQikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbmV4dEFyZ3VtZW50cy5wdXNoKFsgbmV4dFJhd0NTQiwgbmV4dENTQklkZW50aWZpZXIsIG5leHRQYXRoLCBuZXh0QWxpYXMgXSk7XG4gICAgICAgICAgICAgICAgaWYgKCsrY291bnRlciA9PT0gbGlzdENTQnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRBcmd1bWVudHMuZm9yRWFjaCgoYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb2xsZWN0Q1NCcyguLi5hcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHVuZGVmaW5lZCwge3Jhd0NTQiwgY3NiSWRlbnRpZmllciwgYWxpYXN9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGxpc3RDU0JzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQodW5kZWZpbmVkLCB7cmF3Q1NCLCBjc2JJZGVudGlmaWVyLCBhbGlhc30pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbGxlY3RGaWxlczogZnVuY3Rpb24gKGNvbGxlY3RlZENTQnMpIHtcbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIgPSBuZXcgQXN5bmNEaXNwYXRjaGVyKChlcnJvcnMsIG5ld1Jlc3VsdHMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnJvcnMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdoYW5kbGVFcnJvcicsIEpTT04uc3RyaW5naWZ5KGVycm9ycywgbnVsbCwgJ1xcdCcpLCAnRmFpbGVkIHRvIGNvbGxlY3QgZmlsZXMgYXR0YWNoZWQgdG8gQ1NCcycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW5ld1Jlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBuZXdSZXN1bHRzID0gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9fY2F0ZWdvcml6ZShjb2xsZWN0ZWRDU0JzLmNvbmNhdChuZXdSZXN1bHRzKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLmRpc3BhdGNoRW1wdHkoY29sbGVjdGVkQ1NCcy5sZW5ndGgpO1xuICAgICAgICBjb2xsZWN0ZWRDU0JzLmZvckVhY2goKHtyYXdDU0IsIGNzYklkZW50aWZpZXIsIGFsaWFzfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fX2NvbGxlY3RGaWxlcyhyYXdDU0IsIGFsaWFzKTtcbiAgICAgICAgfSk7XG5cbiAgICB9LFxuXG4gICAgX19jYXRlZ29yaXplOiBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgY29uc3QgY2F0ZWdvcmllcyA9IHt9O1xuICAgICAgICBsZXQgYmFja3VwcztcbiAgICAgICAgZmlsZXMuZm9yRWFjaCgoe2NzYklkZW50aWZpZXIsIGFsaWFzfSkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmJhY2t1cHMgfHwgdGhpcy5iYWNrdXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGJhY2t1cHMgPSBjc2JJZGVudGlmaWVyLmdldEJhY2t1cFVybHMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYmFja3VwcyA9IHRoaXMuYmFja3VwcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHVpZCA9IGNzYklkZW50aWZpZXIuZ2V0VWlkKCk7XG4gICAgICAgICAgICBjYXRlZ29yaWVzW3VpZF0gPSB7YmFja3VwcywgYWxpYXN9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlciA9IG5ldyBBc3luY0Rpc3BhdGNoZXIoKGVycm9ycywgc3VjY2Vzc2VzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN3YXJtKCdpbnRlcmFjdGlvbicsICdjc2JCYWNrdXBSZXBvcnQnLCB7ZXJyb3JzLCBzdWNjZXNzZXN9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5iYWNrdXBFbmdpbmUgPSBCYWNrdXBFbmdpbmUuZ2V0QmFja3VwRW5naW5lKGJhY2t1cHMpO1xuICAgICAgICB0aGlzLmZpbHRlckZpbGVzKGNhdGVnb3JpZXMpO1xuICAgICAgICAvLyBPYmplY3QuZW50cmllcyhjYXRlZ29yaWVzKS5mb3JFYWNoKChbdWlkLCB7YWxpYXMsIGJhY2t1cHN9XSkgPT4ge1xuICAgICAgICAvLyAgICAgdGhpcy5maWx0ZXJGaWxlcyh1aWQsIGFsaWFzLCBiYWNrdXBzKTtcbiAgICAgICAgLy8gfSk7XG4gICAgfSxcblxuICAgIGZpbHRlckZpbGVzOiBmdW5jdGlvbiAoZmlsZXNCYWNrdXBzKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzVG9VcGRhdGUgPSB7fTtcbiAgICAgICAgT2JqZWN0LmtleXModGhpcy5oYXNoRmlsZSkuZm9yRWFjaCgodWlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsZXNCYWNrdXBzW3VpZF0pIHtcbiAgICAgICAgICAgICAgICBmaWxlc1RvVXBkYXRlW3VpZF0gPSB0aGlzLmhhc2hGaWxlW3VpZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLmRpc3BhdGNoRW1wdHkoKTtcbiAgICAgICAgdGhpcy5iYWNrdXBFbmdpbmUuY29tcGFyZVZlcnNpb25zKGZpbGVzVG9VcGRhdGUsIChlcnIsIG1vZGlmaWVkRmlsZXMpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaGFuZGxlRXJyb3JcIiwgZXJyLCBcIkZhaWxlZCB0byByZXRyaWV2ZSBsaXN0IG9mIG1vZGlmaWVkIGZpbGVzXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9fYmFja3VwRmlsZXMoSlNPTi5wYXJzZShtb2RpZmllZEZpbGVzKSwgZmlsZXNCYWNrdXBzKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9fYmFja3VwRmlsZXM6IGZ1bmN0aW9uIChmaWxlcywgZmlsZXNCYWNrdXBzKSB7XG4gICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLmRpc3BhdGNoRW1wdHkoZmlsZXMubGVuZ3RoKTtcbiAgICAgICAgZmlsZXMuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlsZVN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aC5qb2luKHRoaXMubG9jYWxGb2xkZXIsIGZpbGUpKTtcbiAgICAgICAgICAgIGNvbnN0IGJhY2t1cFVybHMgPSBmaWxlc0JhY2t1cHNbZmlsZV0uYmFja3VwcztcbiAgICAgICAgICAgIGNvbnN0IGJhY2t1cEVuZ2luZSA9IEJhY2t1cEVuZ2luZS5nZXRCYWNrdXBFbmdpbmUoYmFja3VwVXJscyk7XG4gICAgICAgICAgICBiYWNrdXBFbmdpbmUuc2F2ZShuZXcgQ1NCSWRlbnRpZmllcihmaWxlKSwgZmlsZVN0cmVhbSwgKGVyciwgdXJsKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIHRoaXMuYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHthbGlhczogZmlsZXNCYWNrdXBzW2ZpbGVdLmFsaWFzLCBiYWNrdXBVUkw6IHVybH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuYXN5bmNEaXNwYXRjaGVyLm1hcmtPbmVBc0ZpbmlzaGVkKHVuZGVmaW5lZCwge2FsaWFzOiBmaWxlc0JhY2t1cHNbZmlsZV0uYWxpYXMsIGJhY2t1cFVSTDogdXJsfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQoKTsgLy8gZm9yIGh0dHAgcmVxdWVzdCB0byBjb21wYXJlVmVyc2lvbnNcbiAgICB9LFxuXG4gICAgX19jb2xsZWN0RmlsZXM6IGZ1bmN0aW9uIChyYXdDU0IsIGNzYkFsaWFzKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gcmF3Q1NCLmdldEFsbEFzc2V0cygnZ2xvYmFsLkZpbGVSZWZlcmVuY2UnKTtcbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIuZGlzcGF0Y2hFbXB0eShmaWxlcy5sZW5ndGgpO1xuICAgICAgICBmaWxlcy5mb3JFYWNoKChGaWxlUmVmZXJlbmNlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IEZpbGVSZWZlcmVuY2UuYWxpYXM7XG4gICAgICAgICAgICBjb25zdCBjc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoRmlsZVJlZmVyZW5jZS5kc2VlZCk7XG4gICAgICAgICAgICB0aGlzLmFzeW5jRGlzcGF0Y2hlci5tYXJrT25lQXNGaW5pc2hlZCh1bmRlZmluZWQsIHtjc2JJZGVudGlmaWVyLCBhbGlhc30pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hc3luY0Rpc3BhdGNoZXIubWFya09uZUFzRmluaXNoZWQoKTtcbiAgICB9XG59KTtcblxuIiwiY29uc3QgdmFsaWRhdG9yID0gcmVxdWlyZShcIi4uLy4uL3V0aWxzL3ZhbGlkYXRvclwiKTtcbmNvbnN0IERzZWVkQ2FnZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWxzL0RzZWVkQ2FnZScpO1xuXG4kJC5zd2FybS5kZXNjcmliZShcInNldFBpblwiLCB7XG4gICAgc3RhcnQ6IGZ1bmN0aW9uIChsb2NhbEZvbGRlciA9IHByb2Nlc3MuY3dkKCkpIHtcbiAgICAgICAgdGhpcy5sb2NhbEZvbGRlciA9IGxvY2FsRm9sZGVyO1xuICAgICAgICB0aGlzLnN3YXJtKFwiaW50ZXJhY3Rpb25cIiwgXCJyZWFkUGluXCIsIDMpO1xuICAgIH0sXG5cbiAgICB2YWxpZGF0ZVBpbjogZnVuY3Rpb24gKG9sZFBpbiwgbm9Ucmllcykge1xuICAgICAgICB0aGlzLm9sZFBpbiA9IG9sZFBpbjtcbiAgICAgICAgdmFsaWRhdG9yLnZhbGlkYXRlUGluKHRoaXMubG9jYWxGb2xkZXIsIHRoaXMsIFwiaW50ZXJhY3Rpb25KdW1wZXJcIiwgb2xkUGluLCBub1RyaWVzKTtcbiAgICB9LFxuXG4gICAgaW50ZXJhY3Rpb25KdW1wZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwiZW50ZXJOZXdQaW5cIik7XG4gICAgfSxcblxuICAgIGFjdHVhbGl6ZVBpbjogZnVuY3Rpb24gKG5ld1Bpbikge1xuICAgICAgICB0aGlzLmRzZWVkQ2FnZSA9IG5ldyBEc2VlZENhZ2UodGhpcy5sb2NhbEZvbGRlcik7XG4gICAgICAgIHRoaXMuZHNlZWRDYWdlLmxvYWREc2VlZEJhY2t1cHModGhpcy5vbGRQaW4sIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwic2F2ZURzZWVkXCIsIFwiRmFpbGVkIHRvIGxvYWQgZHNlZWQuXCIsIG5ld1BpbikpO1xuICAgIH0sXG5cbiAgICBzYXZlRHNlZWQ6IGZ1bmN0aW9uIChjc2JJZGVudGlmaWVyLCBiYWNrdXBzLCBwaW4pIHtcbiAgICAgICAgdGhpcy5kc2VlZENhZ2Uuc2F2ZURzZWVkQmFja3VwcyhwaW4sIGNzYklkZW50aWZpZXIsIGJhY2t1cHMsIHZhbGlkYXRvci5yZXBvcnRPckNvbnRpbnVlKHRoaXMsIFwic3VjY2Vzc1N0YXRlXCIsIFwiRmFpbGVkIHRvIHNhdmUgZHNlZWRcIikpO1xuICAgIH0sXG5cbiAgICBzdWNjZXNzU3RhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zd2FybShcImludGVyYWN0aW9uXCIsIFwicHJpbnRJbmZvXCIsIFwiVGhlIHBpbiBoYXMgYmVlbiBzdWNjZXNzZnVsbHkgY2hhbmdlZC5cIik7XG4gICAgfVxufSk7IiwiY29uc3QgY3J5cHRvID0gcmVxdWlyZSgncHNrY3J5cHRvJyk7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCBDU0JJZGVudGlmaWVyID0gcmVxdWlyZShcIi4uL2xpYnJhcmllcy9DU0JJZGVudGlmaWVyXCIpO1xuXG5mdW5jdGlvbiBEc2VlZENhZ2UobG9jYWxGb2xkZXIpIHtcblx0Y29uc3QgZHNlZWRGb2xkZXIgPSBwYXRoLmpvaW4obG9jYWxGb2xkZXIsICcucHJpdmF0ZVNreScpO1xuXHRjb25zdCBkc2VlZFBhdGggPSBwYXRoLmpvaW4oZHNlZWRGb2xkZXIsICdkc2VlZCcpO1xuXG5cdGZ1bmN0aW9uIGxvYWREc2VlZEJhY2t1cHMocGluLCBjYWxsYmFjaykge1xuXHRcdGZzLm1rZGlyKGRzZWVkRm9sZGVyLCB7cmVjdXJzaXZlOiB0cnVlfSwgKGVycikgPT4ge1xuXHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRcdH1cblxuXHRcdFx0Y3J5cHRvLmxvYWREYXRhKHBpbiwgZHNlZWRQYXRoLCAoZXJyLCBkc2VlZEJhY2t1cHMpID0+IHtcblx0XHRcdFx0aWYgKGVycikge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhlcnIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRyeXtcblx0XHRcdFx0XHRkc2VlZEJhY2t1cHMgPSBKU09OLnBhcnNlKGRzZWVkQmFja3Vwcy50b1N0cmluZygpKTtcblx0XHRcdFx0fWNhdGNoIChlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGUpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGNzYklkZW50aWZpZXI7XG5cdFx0XHRcdGlmIChkc2VlZEJhY2t1cHMuZHNlZWQgJiYgIUJ1ZmZlci5pc0J1ZmZlcihkc2VlZEJhY2t1cHMuZHNlZWQpKSB7XG5cdFx0XHRcdFx0ZHNlZWRCYWNrdXBzLmRzZWVkID0gQnVmZmVyLmZyb20oZHNlZWRCYWNrdXBzLmRzZWVkKTtcblx0XHRcdFx0XHRjc2JJZGVudGlmaWVyID0gbmV3IENTQklkZW50aWZpZXIoZHNlZWRCYWNrdXBzLmRzZWVkKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhbGxiYWNrKHVuZGVmaW5lZCwgY3NiSWRlbnRpZmllciwgZHNlZWRCYWNrdXBzLmJhY2t1cHMpO1xuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBzYXZlRHNlZWRCYWNrdXBzKHBpbiwgY3NiSWRlbnRpZmllciwgYmFja3VwcywgY2FsbGJhY2spIHtcblx0XHRmcy5ta2Rpcihkc2VlZEZvbGRlciwge3JlY3Vyc2l2ZTogdHJ1ZX0sIChlcnIpID0+IHtcblx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHR9XG5cblx0XHRcdGxldCBkc2VlZDtcblx0XHRcdGlmKGNzYklkZW50aWZpZXIpe1xuXHRcdFx0XHRkc2VlZCA9IGNzYklkZW50aWZpZXIuZ2V0RHNlZWQoKTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IGRzZWVkQmFja3VwcyA9IEpTT04uc3RyaW5naWZ5KHtcblx0XHRcdFx0ZHNlZWQsXG5cdFx0XHRcdGJhY2t1cHNcblx0XHRcdH0pO1xuXG5cdFx0XHRjcnlwdG8uc2F2ZURhdGEoQnVmZmVyLmZyb20oZHNlZWRCYWNrdXBzKSwgcGluLCBkc2VlZFBhdGgsIGNhbGxiYWNrKTtcblx0XHR9KTtcblx0fVxuXG5cblx0cmV0dXJuIHtcblx0XHRsb2FkRHNlZWRCYWNrdXBzLFxuXHRcdHNhdmVEc2VlZEJhY2t1cHMsXG5cdH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEc2VlZENhZ2U7IiwiLy8gY29uc3QgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xuXG5cbmV4cG9ydHMuZGVmYXVsdEJhY2t1cCA9IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCI7XG5leHBvcnRzLmRlZmF1bHRQaW4gPSBcIjEyMzQ1Njc4XCI7XG5leHBvcnRzLm5vVHJpZXMgPSAzO1xuXG4iLCJjb25zdCBSb290Q1NCID0gcmVxdWlyZShcIi4uL2xpYnJhcmllcy9Sb290Q1NCXCIpO1xuY29uc3QgZnMgPSByZXF1aXJlKFwiZnNcIik7XG5jb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5cblxubW9kdWxlLmV4cG9ydHMudmFsaWRhdGVQaW4gPSBmdW5jdGlvbiAobG9jYWxGb2xkZXIsIHN3YXJtLCBwaGFzZU5hbWUsIHBpbiwgbm9UcmllcywgLi4uYXJncykge1xuXHRSb290Q1NCLmNyZWF0ZVJvb3RDU0IobG9jYWxGb2xkZXIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBwaW4sIChlcnIsIHJvb3RDU0IsIGNzYklkZW50aWZpZXIsIGJhY2t1cHMpID0+e1xuXHRcdGlmKGVycil7XG5cdFx0XHRzd2FybS5zd2FybShcImludGVyYWN0aW9uXCIsIFwicmVhZFBpblwiLCBub1RyaWVzIC0gMSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRpZihjc2JJZGVudGlmaWVyKXtcblx0XHRcdFx0c3dhcm0ucm9vdENTQiA9IHJvb3RDU0I7XG5cdFx0XHRcdHN3YXJtLmNzYklkZW50aWZpZXIgPSBjc2JJZGVudGlmaWVyO1xuXHRcdFx0fVxuXHRcdFx0YXJncy5wdXNoKGJhY2t1cHMpO1xuXHRcdFx0c3dhcm1bcGhhc2VOYW1lXShwaW4sIC4uLmFyZ3MpO1xuXHRcdH1cblx0fSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5yZXBvcnRPckNvbnRpbnVlID0gZnVuY3Rpb24oc3dhcm0sIHBoYXNlTmFtZSwgZXJyb3JNZXNzYWdlLCAuLi5hcmdzKXtcblx0cmV0dXJuIGZ1bmN0aW9uKGVyciwuLi5yZXMpIHtcblx0XHRpZiAoZXJyKSB7XG5cdFx0XHRzd2FybS5zd2FybShcImludGVyYWN0aW9uXCIsIFwiaGFuZGxlRXJyb3JcIiwgZXJyLCBlcnJvck1lc3NhZ2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAocGhhc2VOYW1lKSB7XG5cdFx0XHRcdFx0c3dhcm1bcGhhc2VOYW1lXSguLi5yZXMsIC4uLmFyZ3MpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzLmNoZWNrTWFzdGVyQ1NCRXhpc3RzID0gZnVuY3Rpb24gKGxvY2FsRm9sZGVyLCBjYWxsYmFjaykge1xuXHRmcy5zdGF0KHBhdGguam9pbihsb2NhbEZvbGRlciwgXCIucHJpdmF0ZVNreS9oYXNoXCIpLCAoZXJyLCBzdGF0cyk9Pntcblx0XHRpZihlcnIpe1xuXHRcdFx0cmV0dXJuIGNhbGxiYWNrKGVyciwgZmFsc2UpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjYWxsYmFjayh1bmRlZmluZWQsIHRydWUpO1xuXHR9KTtcbn07IiwiLypcbmNvbnNlbnN1cyBoZWxwZXIgZnVuY3Rpb25zXG4qL1xuXG52YXIgcHNrY3J5cHRvID0gcmVxdWlyZShcInBza2NyeXB0b1wiKTtcblxuXG5mdW5jdGlvbiBQdWxzZShzaWduZXIsIGN1cnJlbnRQdWxzZU51bWJlciwgYmxvY2ssIG5ld1RyYW5zYWN0aW9ucywgdnNkLCB0b3AsIGxhc3QpIHtcbiAgICB0aGlzLnNpZ25lciAgICAgICAgID0gc2lnbmVyOyAgICAgICAgICAgICAgIC8vYS5rLmEuIGRlbGVnYXRlZEFnZW50TmFtZVxuICAgIHRoaXMuY3VycmVudFB1bHNlICAgPSBjdXJyZW50UHVsc2VOdW1iZXI7XG4gICAgdGhpcy5sc2V0ICAgICAgICAgICA9IG5ld1RyYW5zYWN0aW9uczsgICAgICAvL2RpZ2VzdCAtPiB0cmFuc2FjdGlvblxuICAgIHRoaXMucHRCbG9jayAgICAgICAgPSBibG9jazsgICAgICAgICAgICAgICAgLy9hcnJheSBvZiBkaWdlc3RzXG4gICAgdGhpcy52c2QgICAgICAgICAgICA9IHZzZDtcbiAgICB0aGlzLnRvcCAgICAgICAgICAgID0gdG9wOyAgICAgICAgICAgICAgICAgIC8vIGEuay5hLiB0b3BQdWxzZUNvbnNlbnN1c1xuICAgIHRoaXMubGFzdCAgICAgICAgICAgPSBsYXN0OyAgICAgICAgICAgICAgICAgLy8gYS5rLmEuIGxhc3RQdWxzZUFjaGlldmVkQ29uc2Vuc3VzXG59XG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uKGN1cnJlbnRQdWxzZSwgc3dhcm0pIHtcbiAgICB0aGlzLmlucHV0ICAgICAgPSBzd2FybS5pbnB1dDtcbiAgICB0aGlzLm91dHB1dCAgICAgPSBzd2FybS5vdXRwdXQ7XG4gICAgdGhpcy5zd2FybSAgICAgID0gc3dhcm07XG5cbiAgICB2YXIgYXJyID0gcHJvY2Vzcy5ocnRpbWUoKTtcbiAgICB0aGlzLnNlY29uZCAgICAgPSBhcnJbMF07XG4gICAgdGhpcy5uYW5vc2Vjb2QgID0gYXJyWzFdO1xuXG4gICAgdGhpcy5DUCAgICAgICAgID0gY3VycmVudFB1bHNlO1xuICAgIHRoaXMuZGlnZXN0ICAgICA9IHBza2NyeXB0by5oYXNoVmFsdWVzKHRoaXMpO1xufVxuXG5cbmV4cG9ydHMuY3JlYXRlVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAoY3VycmVudFB1bHNlLCBzd2FybSkge1xuICAgIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oY3VycmVudFB1bHNlLCBzd2FybSk7XG59XG5cbmV4cG9ydHMuY3JlYXRlUHVsc2UgPSBmdW5jdGlvbiAoc2lnbmVyLCBjdXJyZW50UHVsc2VOdW1iZXIsIGJsb2NrLCBuZXdUcmFuc2FjdGlvbnMsIHZzZCwgdG9wLCBsYXN0KSB7XG4gICAgcmV0dXJuIG5ldyBQdWxzZShzaWduZXIsIGN1cnJlbnRQdWxzZU51bWJlciwgYmxvY2ssIG5ld1RyYW5zYWN0aW9ucywgdnNkLCB0b3AsIGxhc3QpO1xufVxuXG5leHBvcnRzLm9yZGVyVHJhbnNhY3Rpb25zID0gZnVuY3Rpb24gKHBzZXQpIHsgLy9vcmRlciBpbiBwbGFjZSB0aGUgcHNldCBhcnJheVxuICAgIHZhciBhcnIgPSBbXTtcbiAgICBmb3IgKHZhciBkIGluIHBzZXQpIHtcbiAgICAgICAgYXJyLnB1c2gocHNldFtkXSk7XG4gICAgfVxuXG4gICAgYXJyLnNvcnQoZnVuY3Rpb24gKHQxLCB0Mikge1xuICAgICAgICBpZiAodDEuQ1AgPCB0Mi5DUCkgcmV0dXJuIC0xO1xuICAgICAgICBpZiAodDEuQ1AgPiB0Mi5DUCkgcmV0dXJuIDE7XG4gICAgICAgIGlmICh0MS5zZWNvbmQgPCB0Mi5zZWNvbmQpIHJldHVybiAtMTtcbiAgICAgICAgaWYgKHQxLnNlY29uZCA+IHQyLnNlY29uZCkgcmV0dXJuIDE7XG4gICAgICAgIGlmICh0MS5uYW5vc2Vjb2QgPCB0Mi5uYW5vc2Vjb2QpIHJldHVybiAtMTtcbiAgICAgICAgaWYgKHQxLm5hbm9zZWNvZCA+IHQyLm5hbm9zZWNvZCkgcmV0dXJuIDE7XG4gICAgICAgIGlmICh0MS5kaWdlc3QgPCB0Mi5kaWdlc3QpIHJldHVybiAtMTtcbiAgICAgICAgaWYgKHQxLmRpZ2VzdCA+IHQyLmRpZ2VzdCkgcmV0dXJuIDE7XG4gICAgICAgIHJldHVybiAwOyAvL29ubHkgZm9yIGlkZW50aWNhbCB0cmFuc2FjdGlvbnMuLi5cbiAgICB9KVxuICAgIHJldHVybiBhcnI7XG59XG5cbmZ1bmN0aW9uIGdldE1ham9yaXR5RmllbGRJblB1bHNlcyhhbGxQdWxzZXMsIGZpZWxkTmFtZSwgZXh0cmFjdEZpZWxkTmFtZSwgdm90aW5nQm94KSB7XG4gICAgdmFyIGNvdW50ZXJGaWVsZHMgPSB7fTtcbiAgICB2YXIgbWFqb3JpdHlWYWx1ZTtcbiAgICB2YXIgcHVsc2U7XG5cbiAgICBmb3IgKHZhciBhZ2VudCBpbiBhbGxQdWxzZXMpIHtcbiAgICAgICAgcHVsc2UgPSBhbGxQdWxzZXNbYWdlbnRdO1xuICAgICAgICB2YXIgdiA9IHB1bHNlW2ZpZWxkTmFtZV07XG4gICAgICAgIGNvdW50ZXJGaWVsZHNbdl0gPSB2b3RpbmdCb3gudm90ZShjb3VudGVyRmllbGRzW3ZdKTsgICAgICAgIC8vICsrY291bnRlckZpZWxkc1t2XVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gY291bnRlckZpZWxkcykge1xuICAgICAgICBpZiAodm90aW5nQm94LmlzTWFqb3JpdGFyaWFuKGNvdW50ZXJGaWVsZHNbaV0pKSB7XG4gICAgICAgICAgICBtYWpvcml0eVZhbHVlID0gaTtcbiAgICAgICAgICAgIGlmIChmaWVsZE5hbWUgPT0gZXh0cmFjdEZpZWxkTmFtZSkgeyAgICAgICAgICAgICAgICAgICAgLy8/Pz8gXCJ2c2RcIiwgXCJ2c2RcIlxuICAgICAgICAgICAgICAgIHJldHVybiBtYWpvcml0eVZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcImJsb2NrRGlnZXN0XCIsIFwicHRCbG9ja1wiXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYWdlbnQgaW4gYWxsUHVsc2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1bHNlID0gYWxsUHVsc2VzW2FnZW50XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHB1bHNlW2ZpZWxkTmFtZV0gPT0gbWFqb3JpdHlWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHB1bHNlW2V4dHJhY3RGaWVsZE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBcIm5vbmVcIjsgLy90aGVyZSBpcyBubyBtYWpvcml0eVxufVxuXG5leHBvcnRzLmRldGVjdE1ham9yaXRhcmlhblZTRCA9IGZ1bmN0aW9uIChwdWxzZSwgcHVsc2VzSGlzdG9yeSwgdm90aW5nQm94KSB7XG4gICAgaWYgKHB1bHNlID09IDApIHJldHVybiBcIm5vbmVcIjtcbiAgICB2YXIgcHVsc2VzID0gcHVsc2VzSGlzdG9yeVtwdWxzZV07XG4gICAgdmFyIG1ham9yaXR5VmFsdWUgPSBnZXRNYWpvcml0eUZpZWxkSW5QdWxzZXMocHVsc2VzLCBcInZzZFwiLCBcInZzZFwiLCB2b3RpbmdCb3gpO1xuICAgIHJldHVybiBtYWpvcml0eVZhbHVlO1xufVxuXG4vKlxuICAgIGRldGVjdCBhIGNhbmRpZGF0ZSBibG9ja1xuICovXG5leHBvcnRzLmRldGVjdE1ham9yaXRhcmlhblBUQmxvY2sgPSBmdW5jdGlvbiAocHVsc2UsIHB1bHNlc0hpc3RvcnksIHZvdGluZ0JveCkge1xuICAgIGlmIChwdWxzZSA9PSAwKSByZXR1cm4gXCJub25lXCI7XG4gICAgdmFyIHB1bHNlcyA9IHB1bHNlc0hpc3RvcnlbcHVsc2VdO1xuICAgIHZhciBidEJsb2NrID0gZ2V0TWFqb3JpdHlGaWVsZEluUHVsc2VzKHB1bHNlcywgXCJibG9ja0RpZ2VzdFwiLCBcInB0QmxvY2tcIiwgdm90aW5nQm94KTtcbiAgICByZXR1cm4gYnRCbG9jaztcbn1cblxuZXhwb3J0cy5tYWtlU2V0RnJvbUJsb2NrID0gZnVuY3Rpb24gKGtub3duVHJhbnNhY3Rpb25zLCBibG9jaykge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJsb2NrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0gYmxvY2tbaV07XG4gICAgICAgIHJlc3VsdFtpdGVtXSA9IGtub3duVHJhbnNhY3Rpb25zW2l0ZW1dO1xuICAgICAgICBpZiAoIWtub3duVHJhbnNhY3Rpb25zLmhhc093blByb3BlcnR5KGl0ZW0pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhuZXcgRXJyb3IoXCJEbyBub3QgZ2l2ZSB1bmtub3duIHRyYW5zYWN0aW9uIGRpZ2VzdHMgdG8gbWFrZVNldEZyb21CbG9jayBcIiArIGl0ZW0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnRzLnNldHNDb25jYXQgPSBmdW5jdGlvbiAodGFyZ2V0LCBmcm9tKSB7XG4gICAgZm9yICh2YXIgZCBpbiBmcm9tKSB7XG4gICAgICAgIHRhcmdldFtkXSA9IGZyb21bZF07XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbmV4cG9ydHMuc2V0c1JlbW92ZUFycmF5ID0gZnVuY3Rpb24gKHRhcmdldCwgYXJyKSB7XG4gICAgYXJyLmZvckVhY2goaXRlbSA9PiBkZWxldGUgdGFyZ2V0W2l0ZW1dKTtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnRzLnNldHNSZW1vdmVQdEJsb2NrQW5kUGFzdFRyYW5zYWN0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXQsIGFyciwgbWF4UHVsc2UpIHtcbiAgICB2YXIgdG9CZVJlbW92ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBkIGluIHRhcmdldCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGFycltpXSA9PSBkIHx8IHRhcmdldFtkXS5DUCA8IG1heFB1bHNlKSB7XG4gICAgICAgICAgICAgICAgdG9CZVJlbW92ZWQucHVzaChkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvQmVSZW1vdmVkLmZvckVhY2goaXRlbSA9PiBkZWxldGUgdGFyZ2V0W2l0ZW1dKTtcbiAgICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnRzLmNyZWF0ZURlbW9jcmF0aWNWb3RpbmdCb3ggPSBmdW5jdGlvbiAoc2hhcmVIb2xkZXJzQ291bnRlcikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHZvdGU6IGZ1bmN0aW9uIChwcmV2aW9zVmFsdWUpIHtcbiAgICAgICAgICAgIGlmICghcHJldmlvc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcHJldmlvc1ZhbHVlID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcmV2aW9zVmFsdWUgKyAxO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzTWFqb3JpdGFyaWFuOiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2codmFsdWUgLCBNYXRoLmZsb29yKHNoYXJlSG9sZGVyc0NvdW50ZXIvMikgKyAxKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSA+PSBNYXRoLmZsb29yKHNoYXJlSG9sZGVyc0NvdW50ZXIgLyAyKSArIDE7XG4gICAgICAgIH1cbiAgICB9O1xufVxuIiwiLyohXG4gKiBEZXRlcm1pbmUgaWYgYW4gb2JqZWN0IGlzIGEgQnVmZmVyXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuXG4vLyBUaGUgX2lzQnVmZmVyIGNoZWNrIGlzIGZvciBTYWZhcmkgNS03IHN1cHBvcnQsIGJlY2F1c2UgaXQncyBtaXNzaW5nXG4vLyBPYmplY3QucHJvdG90eXBlLmNvbnN0cnVjdG9yLiBSZW1vdmUgdGhpcyBldmVudHVhbGx5XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmIChpc0J1ZmZlcihvYmopIHx8IGlzU2xvd0J1ZmZlcihvYmopIHx8ICEhb2JqLl9pc0J1ZmZlcilcbn1cblxuZnVuY3Rpb24gaXNCdWZmZXIgKG9iaikge1xuICByZXR1cm4gISFvYmouY29uc3RydWN0b3IgJiYgdHlwZW9mIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJiBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKVxufVxuXG4vLyBGb3IgTm9kZSB2MC4xMCBzdXBwb3J0LiBSZW1vdmUgdGhpcyBldmVudHVhbGx5LlxuZnVuY3Rpb24gaXNTbG93QnVmZmVyIChvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmoucmVhZEZsb2F0TEUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIG9iai5zbGljZSA9PT0gJ2Z1bmN0aW9uJyAmJiBpc0J1ZmZlcihvYmouc2xpY2UoMCwgMCkpXG59XG4iLCJ2YXIgbXEgPSAkJC5yZXF1aXJlKFwiZm9sZGVybXFcIik7XG5cbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBjaGlsZF9wcm9jZXNzID0gcmVxdWlyZShcImNoaWxkX3Byb2Nlc3NcIik7XG5jb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbmNvbnN0IFJFU1RBUlRfVElNRU9VVCA9IDUwMDtcbmNvbnN0IFJFU1RBUlRfVElNRU9VVF9MSU1JVCA9IDUwMDAwO1xuXG52YXIgc2FuZGJveGVzID0ge307XG52YXIgZXhpdEhhbmRsZXIgPSByZXF1aXJlKFwiLi4vLi4vdXRpbHMvZXhpdEhhbmRsZXJcIikoc2FuZGJveGVzKTtcblxudmFyIGJvb3RTYW5kQm94ID0gJCQuZmxvdy5kZXNjcmliZShcIlByaXZhdGVTa3kuc3dhcm0uZW5naW5lLmJvb3RJbkxhdW5jaGVyXCIsIHtcbiAgICBib290OmZ1bmN0aW9uKHNhbmRCb3gsIHNwYWNlTmFtZSwgZm9sZGVyLCBjb2RlRm9sZGVyLCBjYWxsYmFjayl7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQm9vdGluZyBpbiBcIiwgZm9sZGVyLCBcIiBjb250ZXh0IFwiLCBzcGFjZU5hbWUpO1xuXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgICA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmZvbGRlciAgICAgPSBmb2xkZXI7XG4gICAgICAgIHRoaXMuc3BhY2VOYW1lICA9IHNwYWNlTmFtZTtcbiAgICAgICAgdGhpcy5zYW5kQm94ICAgID0gc2FuZEJveDtcbiAgICAgICAgdGhpcy5jb2RlRm9sZGVyICAgID0gY29kZUZvbGRlcjtcbiAgICAgICAgdGhpcy50aW1lb3V0TXVsdGlwbGllciA9IDE7XG5cbiAgICAgICAgdmFyIHRhc2sgPSB0aGlzLnNlcmlhbCh0aGlzLmVuc3VyZUZvbGRlcnNFeGlzdHMpO1xuXG4gICAgICAgIHRhc2suZm9sZGVyU2hvdWxkRXhpc3QocGF0aC5qb2luKHRoaXMuZm9sZGVyLCBcIm1xXCIpLCAgICB0YXNrLnByb2dyZXNzKTtcbiAgICAgICAgdGFzay5mb2xkZXJTaG91bGRFeGlzdChwYXRoLmpvaW4odGhpcy5mb2xkZXIsIFwiYnVuZGxlc1wiKSwgIHRhc2sucHJvZ3Jlc3MpO1xuICAgICAgICB0YXNrLmZvbGRlclNob3VsZEV4aXN0KHBhdGguam9pbih0aGlzLmZvbGRlciwgXCJ0bXBcIiksICAgdGFzay5wcm9ncmVzcyk7XG4gICAgfSxcbiAgICBmb2xkZXJTaG91bGRFeGlzdDogIGZ1bmN0aW9uKHBhdGgsIHByb2dyZXNzKXtcbiAgICAgICAgZnMubWtkaXIocGF0aCwge3JlY3Vyc2l2ZTogdHJ1ZX0sIHByb2dyZXNzKTtcbiAgICB9LFxuICAgIGNvcHlGb2xkZXI6IGZ1bmN0aW9uKHNvdXJjZVBhdGgsIHRhcmdldFBhdGgsIGNhbGxiYWNrKXtcbiAgICAgICAgbGV0IGZzRXh0ID0gcmVxdWlyZShcInV0aWxzXCIpLmZzRXh0O1xuICAgICAgICB0cnl7XG4gICAgICAgICAgICBmc0V4dC5jb3B5KHNvdXJjZVBhdGgsIHRhcmdldFBhdGgsIHtvdmVyd3JpdGU6IHRydWV9LCBjYWxsYmFjayk7XG4gICAgICAgIH1jYXRjaChlcnIpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJHb3Qgc29tZXRoaW5nLi4uXCIsIGVycik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGVuc3VyZUZvbGRlcnNFeGlzdHM6IGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgICAgICAgaWYoZXJyKXtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgdGFzayA9IHRoaXMucGFyYWxsZWwodGhpcy5ydW5Db2RlKTtcbiAgICAgICAgICAgIHRoaXMuc2FuZEJveC5pbmJvdW5kID0gbXEuY3JlYXRlUXVlKHBhdGguam9pbih0aGlzLmZvbGRlciwgXCJtcS9pbmJvdW5kXCIpLCB0aGlzLnByb2dyZXNzKTtcbiAgICAgICAgICAgIHRoaXMuc2FuZEJveC5vdXRib3VuZCA9IG1xLmNyZWF0ZVF1ZShwYXRoLmpvaW4odGhpcy5mb2xkZXIsIFwibXEvb3V0Ym91bmRcIiksIHRoaXMucHJvZ3Jlc3MpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlByZXBhcmluZyB0byBjb3B5XCIsIHBhdGguam9pbih0aGlzLmNvZGVGb2xkZXIsIFwiYnVuZGxlc1wiKSwgcGF0aC5yZXNvbHZlKHBhdGguam9pbih0aGlzLmZvbGRlciwgXCJidW5kbGVzXCIpKSk7XG4gICAgICAgICAgICB0aGlzLmNvcHlGb2xkZXIocGF0aC5qb2luKHRoaXMuY29kZUZvbGRlciwgXCJidW5kbGVzXCIpLCBwYXRoLnJlc29sdmUocGF0aC5qb2luKHRoaXMuZm9sZGVyLCBcImJ1bmRsZXNcIikpLCB0YXNrLnByb2dyZXNzKTtcbiAgICAgICAgfVxuXG4gICAgfSxcbiAgICBydW5Db2RlOiBmdW5jdGlvbihlcnIsIHJlcyl7XG4gICAgICAgIGlmKCFlcnIpe1xuICAgICAgICAgICAgdmFyIG1haW5GaWxlID0gcGF0aC5qb2luKHByb2Nlc3MuZW52LlBSSVZBVEVTS1lfUk9PVF9GT0xERVIsIFwiY29yZVwiLCBcInNhbmRib3hlc1wiLCBcImFnZW50U2FuZGJveC5qc1wiKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW3RoaXMuc3BhY2VOYW1lLCBwcm9jZXNzLmVudi5QUklWQVRFU0tZX1JPT1RfRk9MREVSLCBwYXRoLnJlc29sdmUocHJvY2Vzcy5lbnYuUFJJVkFURVNLWV9ET01BSU5fQlVJTEQpXTtcbiAgICAgICAgICAgIHZhciBvcHRzID0ge3N0ZGlvOiBbMCwgMSwgMiwgXCJpcGNcIl19O1xuXG4gICAgICAgICAgICB2YXIgc3RhcnRDaGlsZCA9IChtYWluRmlsZSwgYXJncywgb3B0cykgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlJ1bm5pbmc6IFwiLCBtYWluRmlsZSwgYXJncywgb3B0cyk7XG5cblx0XHRcdFx0Ly8gcGFzc2luZyBvcHRpb25zLmVudiBtaWdodCBicmVhayB0aGUgYWdlbnRTYW5kYm94LCBpdCByZWxpZXMgb24gc29tZSBpbmhlcml0ZWQgZW52IHZhcmlhYmxlcyBmcm9tIGRvbWFpblxuXHRcdFx0XHR2YXIgY2hpbGQgPSBjaGlsZF9wcm9jZXNzLmZvcmsobWFpbkZpbGUsIGFyZ3MpO1xuXHRcdFx0XHRzYW5kYm94ZXNbdGhpcy5zcGFjZU5hbWVdID0gY2hpbGQ7XG5cblx0XHRcdFx0dGhpcy5zYW5kQm94LmluYm91bmQuc2V0SVBDQ2hhbm5lbChjaGlsZCk7XG5cdFx0XHRcdHRoaXMuc2FuZEJveC5vdXRib3VuZC5zZXRJUENDaGFubmVsKGNoaWxkKTtcblxuXHRcdFx0XHRjaGlsZC5vbihcImV4aXRcIiwgKGNvZGUsIHNpZ25hbCk9Pntcblx0XHRcdFx0ICAgIGlmKGNvZGUgPT09IDApe1xuXHRcdFx0XHQgICAgICAgIGNvbnNvbGUubG9nKGBTYW5kYm94IDwke3RoaXMuc3BhY2VOYW1lfT4gc2h1dHRpbmcgZG93bi5gKTtcblx0XHRcdFx0ICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0ICAgIGxldCB0aW1lb3V0ID0gKHRoaXMudGltZW91dE11bHRpcGxpZXIqUkVTVEFSVF9USU1FT1VUKSAlIFJFU1RBUlRfVElNRU9VVF9MSU1JVDtcblx0XHRcdFx0ICAgIGNvbnNvbGUubG9nKGBTYW5kYm94IDwke3RoaXMuc3BhY2VOYW1lfT4gZXhpdHMgd2l0aCBjb2RlICR7Y29kZX0uIFJlc3RhcnRpbmcgaW4gJHt0aW1lb3V0fSBtcy5gKTtcblx0XHRcdFx0XHRzZXRUaW1lb3V0KCgpPT57XG5cdFx0XHRcdFx0XHRzdGFydENoaWxkKG1haW5GaWxlLCBhcmdzLCBvcHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGltZW91dE11bHRpcGxpZXIgKj0gMS41O1xuICAgICAgICAgICAgICAgICAgICB9LCB0aW1lb3V0KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cmV0dXJuIGNoaWxkO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdGhpcy5jYWxsYmFjayhudWxsLCBzdGFydENoaWxkKG1haW5GaWxlLCBhcmdzLCBvcHRzKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGV4ZWN1dGluZyBzYW5kYm94ITpcIiwgZXJyKTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5cbmZ1bmN0aW9uIFNhbmRCb3hIYW5kbGVyKHNwYWNlTmFtZSwgZm9sZGVyLCBjb2RlRm9sZGVyLCByZXN1bHRDYWxsQmFjayl7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIG1xSGFuZGxlcjtcblxuXG4gICAgYm9vdFNhbmRCb3goKS5ib290KHRoaXMsIHNwYWNlTmFtZSxmb2xkZXIsIGNvZGVGb2xkZXIsIGZ1bmN0aW9uKGVyciwgY2hpbGRQcm9jZXNzKXtcbiAgICAgICAgaWYoIWVycil7XG4gICAgICAgICAgICBzZWxmLmNoaWxkUHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcblxuXG4gICAgICAgICAgICAvKnNlbGYub3V0Ym91bmQucmVnaXN0ZXJDb25zdW1lcihmdW5jdGlvbihlcnIsIHN3YXJtKXtcbiAgICAgICAgICAgICAgICAkJC5QU0tfUHViU3ViLnB1Ymxpc2goJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04sIHN3YXJtKTtcbiAgICAgICAgICAgIH0pOyovXG5cbiAgICAgICAgICAgIHNlbGYub3V0Ym91bmQucmVnaXN0ZXJBc0lQQ0NvbnN1bWVyKGZ1bmN0aW9uKGVyciwgc3dhcm0pe1xuICAgICAgICAgICAgICAgICQkLlBTS19QdWJTdWIucHVibGlzaCgkJC5DT05TVEFOVFMuU1dBUk1fRk9SX0VYRUNVVElPTiwgc3dhcm0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIG1xSGFuZGxlciA9IHNlbGYuaW5ib3VuZC5nZXRIYW5kbGVyKCk7XG4gICAgICAgICAgICBpZihwZW5kaW5nTWVzc2FnZXMubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICBwZW5kaW5nTWVzc2FnZXMubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNlbmQoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcGVuZGluZ01lc3NhZ2VzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHBlbmRpbmdNZXNzYWdlcyA9IFtdO1xuXG4gICAgdGhpcy5zZW5kID0gZnVuY3Rpb24gKHN3YXJtLCBjYWxsYmFjaykge1xuICAgICAgICBpZihtcUhhbmRsZXIpe1xuICAgICAgICAgICAgbXFIYW5kbGVyLnNlbmRTd2FybUZvckV4ZWN1dGlvbihzd2FybSwgY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGVuZGluZ01lc3NhZ2VzLnB1c2goc3dhcm0pOyAvL1RPRE86IHdlbGwsIGEgZGVlcCBjbG9uZSB3aWxsIG5vdCBiZSBhIGJldHRlciBpZGVhP1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cblxuZnVuY3Rpb24gU2FuZEJveE1hbmFnZXIoc2FuZGJveGVzRm9sZGVyLCBjb2RlRm9sZGVyLCBjYWxsYmFjayl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHNhbmRCb3hlcyA9IHtcblxuICAgIH07XG4gICAgZnVuY3Rpb24gYmVsb25nc1RvUmVwbGljYXRlZFNwYWNlKCl7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vY29uc29sZS5sb2coXCJTdWJzY3JpYmluZyB0bzpcIiwgJCQuQ09OU1RBTlRTLlNXQVJNX0ZPUl9FWEVDVVRJT04pO1xuICAgICQkLlBTS19QdWJTdWIuc3Vic2NyaWJlKCQkLkNPTlNUQU5UUy5TV0FSTV9GT1JfRVhFQ1VUSU9OLCBmdW5jdGlvbihzd2FybSl7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRXhlY3V0aW5nIGluIHNhbmRib3ggdG93YXJkczogXCIsIHN3YXJtLm1ldGEudGFyZ2V0KTtcblxuICAgICAgICBpZihzd2FybS5tZXRhLnRhcmdldCA9PSBcInN5c3RlbVwiIHx8IHN3YXJtLm1ldGEuY29tbWFuZCA9PSBcImFzeW5jUmV0dXJuXCIpe1xuICAgICAgICAgICAgJCQuc3dhcm1zSW5zdGFuY2VzTWFuYWdlci5yZXZpdmVfc3dhcm0oc3dhcm0pO1xuICAgICAgICAgICAgLy8kJC5zd2FybXMucmVzdGFydChzd2FybS5tZXRhLnN3YXJtVHlwZU5hbWUsIHN3YXJtKTtcbiAgICAgICAgfSBlbHNlXG4gICAgICAgIGlmKHN3YXJtLm1ldGEudGFyZ2V0ID09IFwicGRzXCIpe1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfSBlbHNlXG4gICAgICAgIGlmKGJlbG9uZ3NUb1JlcGxpY2F0ZWRTcGFjZShzd2FybS5tZXRhLnRhcmdldCkpe1xuICAgICAgICAgICAgc2VsZi5wdXNoVG9TcGFjZUFTd2FybShzd2FybS5tZXRhLnRhcmdldCwgc3dhcm0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9UT0RPOiBzZW5kIHRvd2FyZHMgbmV0d29ya1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gc3RhcnRTYW5kQm94KHNwYWNlTmFtZSl7XG4gICAgICAgIHZhciBzYW5kQm94ID0gbmV3IFNhbmRCb3hIYW5kbGVyKHNwYWNlTmFtZSwgcGF0aC5qb2luKHNhbmRib3hlc0ZvbGRlciwgc3BhY2VOYW1lKSwgY29kZUZvbGRlcik7XG4gICAgICAgIHNhbmRCb3hlc1tzcGFjZU5hbWVdID0gc2FuZEJveDtcbiAgICAgICAgcmV0dXJuIHNhbmRCb3g7XG4gICAgfVxuXG5cbiAgICB0aGlzLnB1c2hUb1NwYWNlQVN3YXJtID0gZnVuY3Rpb24oc3BhY2VOYW1lLCBzd2FybSwgY2FsbGJhY2spe1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwicHVzaFRvU3BhY2VBU3dhcm0gXCIgLCBzcGFjZU5hbWUpO1xuICAgICAgICB2YXIgc2FuZGJveCA9IHNhbmRCb3hlc1tzcGFjZU5hbWVdO1xuICAgICAgICBpZighc2FuZGJveCl7XG4gICAgICAgICAgICBzYW5kYm94ID0gc2FuZEJveGVzW3NwYWNlTmFtZV0gPSBzdGFydFNhbmRCb3goc3BhY2VOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBzYW5kYm94LnNlbmQoc3dhcm0sIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBjYWxsYmFjayhudWxsLCB0aGlzKTtcbn1cblxuXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uKGZvbGRlciwgY29kZUZvbGRlciwgY2FsbGJhY2spe1xuICAgIG5ldyBTYW5kQm94TWFuYWdlcihmb2xkZXIsIGNvZGVGb2xkZXIsIGNhbGxiYWNrKTtcbn07XG5cblxuIiwiY29uc3QgZXZlbnRzID0gW1wiZXhpdFwiLCBcIlNJR0lOVFwiLCBcIlNJR1VTUjFcIiwgXCJTSUdVU1IyXCIsIFwidW5jYXVnaHRFeGNlcHRpb25cIiwgXCJTSUdURVJNXCIsIFwiU0lHSFVQXCJdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hbmFnZVNodXRkb3duUHJvY2VzcyhjaGlsZHJlbkxpc3Qpe1xuXG4gICAgbGV0IHNodXR0aW5nID0gZmFsc2U7XG4gICAgZnVuY3Rpb24gaGFuZGxlcigpe1xuICAgICAgICAvL2NvbnNvbGUubG9nKFwiSGFuZGxpbmcgZXhpdCBldmVudCBvblwiLCBwcm9jZXNzLnBpZCwgXCJhcmd1bWVudHM6XCIsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjaGlsZHJlbk5hbWVzID0gT2JqZWN0LmtleXMoY2hpbGRyZW5MaXN0KTtcbiAgICAgICAgZm9yKGxldCBqPTA7IGo8Y2hpbGRyZW5OYW1lcy5sZW5ndGg7IGorKyl7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbkxpc3RbY2hpbGRyZW5OYW1lc1tqXV07XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGBbJHtwcm9jZXNzLnBpZH1dYCwgXCJTZW5kaW5nIGtpbGwgc2lnbmFsIHRvIFBJRDpcIiwgY2hpbGQucGlkKTtcbiAgICAgICAgICAgIHRyeXtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmtpbGwoY2hpbGQucGlkKTtcbiAgICAgICAgICAgIH1jYXRjaChlcnIpe1xuICAgICAgICAgICAgICAgIC8vLi4uXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZighc2h1dHRpbmcpe1xuICAgICAgICAgICAgdHJ5e1xuICAgICAgICAgICAgICAgIHByb2Nlc3Muc3Rkb3V0LmN1cnNvclRvKDApO1xuICAgICAgICAgICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGBbUElEOiAke3Byb2Nlc3MucGlkfV0gW1RpbWVzdGFtcDogJHtuZXcgRGF0ZSgpLmdldFRpbWUoKX1dIFtQcm9jZXNzIGFyZ3Y6ICR7cHJvY2Vzcy5hcmd2fV0tIFNodXR0aW5nIGRvd24uLi5cXG5gKTtcbiAgICAgICAgICAgIH1jYXRjaChlcnIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8uLi5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNodXR0aW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCk9PntcbiAgICAgICAgICAgIHByb2Nlc3MuZXhpdCgwKTtcbiAgICAgICAgfSwgMCk7XG4gICAgfVxuXG4gICAgcHJvY2Vzcy5zdGRpbi5yZXN1bWUoKTtcbiAgICBmb3IobGV0IGk9MDsgaTxldmVudHMubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gZXZlbnRzW2ldO1xuICAgICAgICBwcm9jZXNzLm9uKGV2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgfVxuICAgIC8vY29uc29sZS5sb2coXCJFeGl0IGhhbmRsZXIgc2V0dXAhXCIsIGBbJHtwcm9jZXNzLnBpZH1dYCk7XG59OyIsImV4cG9ydHMuYWdlbnRQdWJTdWIgPSByZXF1aXJlKFwiLi9hZ2VudFB1YlN1YlwiKTsiLCJtb2R1bGUuZXhwb3J0cy5CcmljayA9IHJlcXVpcmUoXCIuL2xpYi9Ccmlja1wiKTtcbm1vZHVsZS5leHBvcnRzLkFyY2hpdmUgPSByZXF1aXJlKFwiLi9saWIvQXJjaGl2ZVwiKTtcbm1vZHVsZS5leHBvcnRzLkZvbGRlckJhck1hcCA9IHJlcXVpcmUoXCIuL2xpYi9Gb2xkZXJCYXJNYXBcIik7XG5tb2R1bGUuZXhwb3J0cy5jcmVhdGVGc0JhcldvcmtlciA9IHJlcXVpcmUoXCIuL2xpYi9Gc0JhcldvcmtlclwiKS5jcmVhdGVGc0JhcldvcmtlcjtcbmNvbnN0IEFyY2hpdmVDb25maWd1cmF0b3IgPSByZXF1aXJlKFwiLi9saWIvQXJjaGl2ZUNvbmZpZ3VyYXRvclwiKTtcbmNvbnN0IGNyZWF0ZUZvbGRlckJyaWNrU3RvcmFnZSA9IHJlcXVpcmUoXCIuL2xpYi9Gb2xkZXJCcmlja1N0b3JhZ2VcIikuY3JlYXRlRm9sZGVyQnJpY2tTdG9yYWdlO1xuY29uc3QgY3JlYXRlRmlsZUJyaWNrU3RvcmFnZSA9IHJlcXVpcmUoXCIuL2xpYi9GaWxlQnJpY2tTdG9yYWdlXCIpLmNyZWF0ZUZpbGVCcmlja1N0b3JhZ2U7XG5BcmNoaXZlQ29uZmlndXJhdG9yLnByb3RvdHlwZS5yZWdpc3RlclN0b3JhZ2VQcm92aWRlcihcIkZvbGRlckJyaWNrU3RvcmFnZVwiLCBjcmVhdGVGb2xkZXJCcmlja1N0b3JhZ2UpO1xuQXJjaGl2ZUNvbmZpZ3VyYXRvci5wcm90b3R5cGUucmVnaXN0ZXJTdG9yYWdlUHJvdmlkZXIoXCJGaWxlQnJpY2tTdG9yYWdlXCIsIGNyZWF0ZUZpbGVCcmlja1N0b3JhZ2UpO1xubW9kdWxlLmV4cG9ydHMuQXJjaGl2ZUNvbmZpZ3VyYXRvciA9IEFyY2hpdmVDb25maWd1cmF0b3I7XG5cbiIsInZhciBCdWZmZXIgPSByZXF1aXJlKCdidWZmZXInKS5CdWZmZXI7XG5cbnZhciBDUkNfVEFCTEUgPSBbXG4gIDB4MDAwMDAwMDAsIDB4NzcwNzMwOTYsIDB4ZWUwZTYxMmMsIDB4OTkwOTUxYmEsIDB4MDc2ZGM0MTksXG4gIDB4NzA2YWY0OGYsIDB4ZTk2M2E1MzUsIDB4OWU2NDk1YTMsIDB4MGVkYjg4MzIsIDB4NzlkY2I4YTQsXG4gIDB4ZTBkNWU5MWUsIDB4OTdkMmQ5ODgsIDB4MDliNjRjMmIsIDB4N2ViMTdjYmQsIDB4ZTdiODJkMDcsXG4gIDB4OTBiZjFkOTEsIDB4MWRiNzEwNjQsIDB4NmFiMDIwZjIsIDB4ZjNiOTcxNDgsIDB4ODRiZTQxZGUsXG4gIDB4MWFkYWQ0N2QsIDB4NmRkZGU0ZWIsIDB4ZjRkNGI1NTEsIDB4ODNkMzg1YzcsIDB4MTM2Yzk4NTYsXG4gIDB4NjQ2YmE4YzAsIDB4ZmQ2MmY5N2EsIDB4OGE2NWM5ZWMsIDB4MTQwMTVjNGYsIDB4NjMwNjZjZDksXG4gIDB4ZmEwZjNkNjMsIDB4OGQwODBkZjUsIDB4M2I2ZTIwYzgsIDB4NGM2OTEwNWUsIDB4ZDU2MDQxZTQsXG4gIDB4YTI2NzcxNzIsIDB4M2MwM2U0ZDEsIDB4NGIwNGQ0NDcsIDB4ZDIwZDg1ZmQsIDB4YTUwYWI1NmIsXG4gIDB4MzViNWE4ZmEsIDB4NDJiMjk4NmMsIDB4ZGJiYmM5ZDYsIDB4YWNiY2Y5NDAsIDB4MzJkODZjZTMsXG4gIDB4NDVkZjVjNzUsIDB4ZGNkNjBkY2YsIDB4YWJkMTNkNTksIDB4MjZkOTMwYWMsIDB4NTFkZTAwM2EsXG4gIDB4YzhkNzUxODAsIDB4YmZkMDYxMTYsIDB4MjFiNGY0YjUsIDB4NTZiM2M0MjMsIDB4Y2ZiYTk1OTksXG4gIDB4YjhiZGE1MGYsIDB4MjgwMmI4OWUsIDB4NWYwNTg4MDgsIDB4YzYwY2Q5YjIsIDB4YjEwYmU5MjQsXG4gIDB4MmY2ZjdjODcsIDB4NTg2ODRjMTEsIDB4YzE2MTFkYWIsIDB4YjY2NjJkM2QsIDB4NzZkYzQxOTAsXG4gIDB4MDFkYjcxMDYsIDB4OThkMjIwYmMsIDB4ZWZkNTEwMmEsIDB4NzFiMTg1ODksIDB4MDZiNmI1MWYsXG4gIDB4OWZiZmU0YTUsIDB4ZThiOGQ0MzMsIDB4NzgwN2M5YTIsIDB4MGYwMGY5MzQsIDB4OTYwOWE4OGUsXG4gIDB4ZTEwZTk4MTgsIDB4N2Y2YTBkYmIsIDB4MDg2ZDNkMmQsIDB4OTE2NDZjOTcsIDB4ZTY2MzVjMDEsXG4gIDB4NmI2YjUxZjQsIDB4MWM2YzYxNjIsIDB4ODU2NTMwZDgsIDB4ZjI2MjAwNGUsIDB4NmMwNjk1ZWQsXG4gIDB4MWIwMWE1N2IsIDB4ODIwOGY0YzEsIDB4ZjUwZmM0NTcsIDB4NjViMGQ5YzYsIDB4MTJiN2U5NTAsXG4gIDB4OGJiZWI4ZWEsIDB4ZmNiOTg4N2MsIDB4NjJkZDFkZGYsIDB4MTVkYTJkNDksIDB4OGNkMzdjZjMsXG4gIDB4ZmJkNDRjNjUsIDB4NGRiMjYxNTgsIDB4M2FiNTUxY2UsIDB4YTNiYzAwNzQsIDB4ZDRiYjMwZTIsXG4gIDB4NGFkZmE1NDEsIDB4M2RkODk1ZDcsIDB4YTRkMWM0NmQsIDB4ZDNkNmY0ZmIsIDB4NDM2OWU5NmEsXG4gIDB4MzQ2ZWQ5ZmMsIDB4YWQ2Nzg4NDYsIDB4ZGE2MGI4ZDAsIDB4NDQwNDJkNzMsIDB4MzMwMzFkZTUsXG4gIDB4YWEwYTRjNWYsIDB4ZGQwZDdjYzksIDB4NTAwNTcxM2MsIDB4MjcwMjQxYWEsIDB4YmUwYjEwMTAsXG4gIDB4YzkwYzIwODYsIDB4NTc2OGI1MjUsIDB4MjA2Zjg1YjMsIDB4Yjk2NmQ0MDksIDB4Y2U2MWU0OWYsXG4gIDB4NWVkZWY5MGUsIDB4MjlkOWM5OTgsIDB4YjBkMDk4MjIsIDB4YzdkN2E4YjQsIDB4NTliMzNkMTcsXG4gIDB4MmViNDBkODEsIDB4YjdiZDVjM2IsIDB4YzBiYTZjYWQsIDB4ZWRiODgzMjAsIDB4OWFiZmIzYjYsXG4gIDB4MDNiNmUyMGMsIDB4NzRiMWQyOWEsIDB4ZWFkNTQ3MzksIDB4OWRkMjc3YWYsIDB4MDRkYjI2MTUsXG4gIDB4NzNkYzE2ODMsIDB4ZTM2MzBiMTIsIDB4OTQ2NDNiODQsIDB4MGQ2ZDZhM2UsIDB4N2E2YTVhYTgsXG4gIDB4ZTQwZWNmMGIsIDB4OTMwOWZmOWQsIDB4MGEwMGFlMjcsIDB4N2QwNzllYjEsIDB4ZjAwZjkzNDQsXG4gIDB4ODcwOGEzZDIsIDB4MWUwMWYyNjgsIDB4NjkwNmMyZmUsIDB4Zjc2MjU3NWQsIDB4ODA2NTY3Y2IsXG4gIDB4MTk2YzM2NzEsIDB4NmU2YjA2ZTcsIDB4ZmVkNDFiNzYsIDB4ODlkMzJiZTAsIDB4MTBkYTdhNWEsXG4gIDB4NjdkZDRhY2MsIDB4ZjliOWRmNmYsIDB4OGViZWVmZjksIDB4MTdiN2JlNDMsIDB4NjBiMDhlZDUsXG4gIDB4ZDZkNmEzZTgsIDB4YTFkMTkzN2UsIDB4MzhkOGMyYzQsIDB4NGZkZmYyNTIsIDB4ZDFiYjY3ZjEsXG4gIDB4YTZiYzU3NjcsIDB4M2ZiNTA2ZGQsIDB4NDhiMjM2NGIsIDB4ZDgwZDJiZGEsIDB4YWYwYTFiNGMsXG4gIDB4MzYwMzRhZjYsIDB4NDEwNDdhNjAsIDB4ZGY2MGVmYzMsIDB4YTg2N2RmNTUsIDB4MzE2ZThlZWYsXG4gIDB4NDY2OWJlNzksIDB4Y2I2MWIzOGMsIDB4YmM2NjgzMWEsIDB4MjU2ZmQyYTAsIDB4NTI2OGUyMzYsXG4gIDB4Y2MwYzc3OTUsIDB4YmIwYjQ3MDMsIDB4MjIwMjE2YjksIDB4NTUwNTI2MmYsIDB4YzViYTNiYmUsXG4gIDB4YjJiZDBiMjgsIDB4MmJiNDVhOTIsIDB4NWNiMzZhMDQsIDB4YzJkN2ZmYTcsIDB4YjVkMGNmMzEsXG4gIDB4MmNkOTllOGIsIDB4NWJkZWFlMWQsIDB4OWI2NGMyYjAsIDB4ZWM2M2YyMjYsIDB4NzU2YWEzOWMsXG4gIDB4MDI2ZDkzMGEsIDB4OWMwOTA2YTksIDB4ZWIwZTM2M2YsIDB4NzIwNzY3ODUsIDB4MDUwMDU3MTMsXG4gIDB4OTViZjRhODIsIDB4ZTJiODdhMTQsIDB4N2JiMTJiYWUsIDB4MGNiNjFiMzgsIDB4OTJkMjhlOWIsXG4gIDB4ZTVkNWJlMGQsIDB4N2NkY2VmYjcsIDB4MGJkYmRmMjEsIDB4ODZkM2QyZDQsIDB4ZjFkNGUyNDIsXG4gIDB4NjhkZGIzZjgsIDB4MWZkYTgzNmUsIDB4ODFiZTE2Y2QsIDB4ZjZiOTI2NWIsIDB4NmZiMDc3ZTEsXG4gIDB4MThiNzQ3NzcsIDB4ODgwODVhZTYsIDB4ZmYwZjZhNzAsIDB4NjYwNjNiY2EsIDB4MTEwMTBiNWMsXG4gIDB4OGY2NTllZmYsIDB4Zjg2MmFlNjksIDB4NjE2YmZmZDMsIDB4MTY2Y2NmNDUsIDB4YTAwYWUyNzgsXG4gIDB4ZDcwZGQyZWUsIDB4NGUwNDgzNTQsIDB4MzkwM2IzYzIsIDB4YTc2NzI2NjEsIDB4ZDA2MDE2ZjcsXG4gIDB4NDk2OTQ3NGQsIDB4M2U2ZTc3ZGIsIDB4YWVkMTZhNGEsIDB4ZDlkNjVhZGMsIDB4NDBkZjBiNjYsXG4gIDB4MzdkODNiZjAsIDB4YTliY2FlNTMsIDB4ZGViYjllYzUsIDB4NDdiMmNmN2YsIDB4MzBiNWZmZTksXG4gIDB4YmRiZGYyMWMsIDB4Y2FiYWMyOGEsIDB4NTNiMzkzMzAsIDB4MjRiNGEzYTYsIDB4YmFkMDM2MDUsXG4gIDB4Y2RkNzA2OTMsIDB4NTRkZTU3MjksIDB4MjNkOTY3YmYsIDB4YjM2NjdhMmUsIDB4YzQ2MTRhYjgsXG4gIDB4NWQ2ODFiMDIsIDB4MmE2ZjJiOTQsIDB4YjQwYmJlMzcsIDB4YzMwYzhlYTEsIDB4NWEwNWRmMWIsXG4gIDB4MmQwMmVmOGRcbl07XG5cbmlmICh0eXBlb2YgSW50MzJBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgQ1JDX1RBQkxFID0gbmV3IEludDMyQXJyYXkoQ1JDX1RBQkxFKTtcbn1cblxuZnVuY3Rpb24gbmV3RW1wdHlCdWZmZXIobGVuZ3RoKSB7XG4gIHZhciBidWZmZXIgPSBuZXcgQnVmZmVyKGxlbmd0aCk7XG4gIGJ1ZmZlci5maWxsKDB4MDApO1xuICByZXR1cm4gYnVmZmVyO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVCdWZmZXIoaW5wdXQpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihpbnB1dCkpIHtcbiAgICByZXR1cm4gaW5wdXQ7XG4gIH1cblxuICB2YXIgaGFzTmV3QnVmZmVyQVBJID1cbiAgICAgIHR5cGVvZiBCdWZmZXIuYWxsb2MgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgICAgdHlwZW9mIEJ1ZmZlci5mcm9tID09PSBcImZ1bmN0aW9uXCI7XG5cbiAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBoYXNOZXdCdWZmZXJBUEkgPyBCdWZmZXIuYWxsb2MoaW5wdXQpIDogbmV3RW1wdHlCdWZmZXIoaW5wdXQpO1xuICB9XG4gIGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBoYXNOZXdCdWZmZXJBUEkgPyBCdWZmZXIuZnJvbShpbnB1dCkgOiBuZXcgQnVmZmVyKGlucHV0KTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnB1dCBtdXN0IGJlIGJ1ZmZlciwgbnVtYmVyLCBvciBzdHJpbmcsIHJlY2VpdmVkIFwiICtcbiAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGlucHV0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWZmZXJpemVJbnQobnVtKSB7XG4gIHZhciB0bXAgPSBlbnN1cmVCdWZmZXIoNCk7XG4gIHRtcC53cml0ZUludDMyQkUobnVtLCAwKTtcbiAgcmV0dXJuIHRtcDtcbn1cblxuZnVuY3Rpb24gX2NyYzMyKGJ1ZiwgcHJldmlvdXMpIHtcbiAgYnVmID0gZW5zdXJlQnVmZmVyKGJ1Zik7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIocHJldmlvdXMpKSB7XG4gICAgcHJldmlvdXMgPSBwcmV2aW91cy5yZWFkVUludDMyQkUoMCk7XG4gIH1cbiAgdmFyIGNyYyA9IH5+cHJldmlvdXMgXiAtMTtcbiAgZm9yICh2YXIgbiA9IDA7IG4gPCBidWYubGVuZ3RoOyBuKyspIHtcbiAgICBjcmMgPSBDUkNfVEFCTEVbKGNyYyBeIGJ1ZltuXSkgJiAweGZmXSBeIChjcmMgPj4+IDgpO1xuICB9XG4gIHJldHVybiAoY3JjIF4gLTEpO1xufVxuXG5mdW5jdGlvbiBjcmMzMigpIHtcbiAgcmV0dXJuIGJ1ZmZlcml6ZUludChfY3JjMzIuYXBwbHkobnVsbCwgYXJndW1lbnRzKSk7XG59XG5jcmMzMi5zaWduZWQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBfY3JjMzIuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbn07XG5jcmMzMi51bnNpZ25lZCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIF9jcmMzMi5hcHBseShudWxsLCBhcmd1bWVudHMpID4+PiAwO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmMzMjtcbiIsIm1vZHVsZS5leHBvcnRzLlJvb3RDU0IgPSBSb290Q1NCO1xubW9kdWxlLmV4cG9ydHMuUmF3Q1NCID0gcmVxdWlyZSgnLi9saWIvUmF3Q1NCJyk7XG5tb2R1bGUuZXhwb3J0cy5DU0JJZGVudGlmaWVyID0gcmVxdWlyZSgnLi9saWIvQ1NCSWRlbnRpZmllcicpO1xuJCQubG9hZExpYnJhcnkoXCJjc2JcIiwgcmVxdWlyZShcIi4vZmxvd3MvaW5kZXhcIikpO1xuXG5cbiIsImV4cG9ydHMuZG9tYWluUHViU3ViID0gcmVxdWlyZShcIi4vZG9tYWluUHViU3ViXCIpOyIsImNvbnN0IGJhciA9IHJlcXVpcmUoXCJiYXJcIik7XG5jb25zdCBBcmNoaXZlQ29uZmlndXJhdG9yID0gYmFyLkFyY2hpdmVDb25maWd1cmF0b3I7XG5jb25zdCBjcmVhdGVFREZTQnJpY2tTdG9yYWdlID0gcmVxdWlyZShcIi4vRURGU0JyaWNrU3RvcmFnZVwiKS5jcmVhdGVFREZTQnJpY2tTdG9yYWdlO1xuQXJjaGl2ZUNvbmZpZ3VyYXRvci5wcm90b3R5cGUucmVnaXN0ZXJTdG9yYWdlUHJvdmlkZXIoXCJFREZTQnJpY2tTdG9yYWdlXCIsIGNyZWF0ZUVERlNCcmlja1N0b3JhZ2UpO1xubW9kdWxlLmV4cG9ydHMuY3JlYXRlRURGU0JyaWNrU3RvcmFnZSA9IGNyZWF0ZUVERlNCcmlja1N0b3JhZ2U7XG4iLCJtb2R1bGUuZXhwb3J0cy5FREZTTWlkZGxld2FyZSA9IHJlcXVpcmUoXCIuL2xpYi9FREZTTWlkZGxld2FyZVwiKTtcblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0XHRcdFx0XHRjcmVhdGVRdWU6IHJlcXVpcmUoXCIuL2xpYi9mb2xkZXJNUVwiKS5nZXRGb2xkZXJRdWV1ZVxuXHRcdFx0XHRcdC8vZm9sZGVyTVE6IHJlcXVpcmUoXCIuL2xpYi9mb2xkZXJNUVwiKVxufTsiLCIvKlxuTW9kdWxlIHRoYXQgb2ZmZXJzIEFQSXMgdG8gaW50ZXJhY3Qgd2l0aCBQcml2YXRlU2t5IHdlYiBzYW5kYm94ZXNcbiAqL1xuXG5cbmNvbnN0IGV4cG9ydEJyb3dzZXJJbnRlcmFjdCA9IHtcbiAgICBlbmFibGVJZnJhbWVJbnRlcmFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuY3JlYXRlV2luZG93TVEgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvc3BlY2lmaWNNUUltcGwvQ2hpbGRXbmRNUVwiKS5jcmVhdGVNUTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuY3JlYXRlV2luZG93SW50ZXJhY3Rpb25TcGFjZSA9IHJlcXVpcmUoXCIuL2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9XaW5kb3dNUUludGVyYWN0aW9uU3BhY2VcIikuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZTtcbiAgICB9LFxuICAgIGVuYWJsZVJlYWN0SW50ZXJhY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVdpbmRvd01RID0gcmVxdWlyZShcIi4vbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL3NwZWNpZmljTVFJbXBsL0NoaWxkV25kTVFcIikuY3JlYXRlTVE7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVdpbmRvd0ludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvV2luZG93TVFJbnRlcmFjdGlvblNwYWNlXCIpLmNyZWF0ZUludGVyYWN0aW9uU3BhY2U7XG4gICAgfSxcbiAgICBlbmFibGVXZWJWaWV3SW50ZXJhY3Rpb25zOmZ1bmN0aW9uKCl7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVdpbmRvd0ludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvV2ViVmlld01RSW50ZXJhY3Rpb25TcGFjZVwiKS5jcmVhdGVJbnRlcmFjdGlvblNwYWNlO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5jcmVhdGVXaW5kb3dNUSA9IHJlcXVpcmUoXCIuL2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9zcGVjaWZpY01RSW1wbC9DaGlsZFdlYlZpZXdNUVwiKS5jcmVhdGVNUTtcbiAgICB9LFxuICAgIGVuYWJsZUxvY2FsSW50ZXJhY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZUludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvU291bmRQdWJTdWJNUUJhc2VkSW50ZXJhY3Rpb25TcGFjZVwiKS5jcmVhdGVJbnRlcmFjdGlvblNwYWNlO1xuICAgIH0sXG4gICAgZW5hYmxlUmVtb3RlSW50ZXJhY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLmNyZWF0ZVJlbW90ZUludGVyYWN0aW9uU3BhY2UgPSByZXF1aXJlKCcuL2xpYi9pbnRlcmFjdGlvblNwYWNlSW1wbC9odHRwSW50ZXJhY3Rpb25TcGFjZScpLmNyZWF0ZUludGVyYWN0aW9uU3BhY2U7XG4gICAgfVxufTtcblxuXG5pZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZXhwb3J0QnJvd3NlckludGVyYWN0O1xufVxuZWxzZSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgICAgIGNyZWF0ZU5vZGVJbnRlcmFjdGlvblNwYWNlOiByZXF1aXJlKFwiLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvZm9sZGVyTVFCYXNlZEludGVyYWN0aW9uU3BhY2VcIikuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSxcbiAgICAgICAgY3JlYXRlSW50ZXJhY3Rpb25TcGFjZTogcmVxdWlyZShcIi4vbGliL2ludGVyYWN0aW9uU3BhY2VJbXBsL1NvdW5kUHViU3ViTVFCYXNlZEludGVyYWN0aW9uU3BhY2VcIikuY3JlYXRlSW50ZXJhY3Rpb25TcGFjZSxcbiAgICAgICAgY3JlYXRlUmVtb3RlSW50ZXJhY3Rpb25TcGFjZTogcmVxdWlyZSgnLi9saWIvaW50ZXJhY3Rpb25TcGFjZUltcGwvaHR0cEludGVyYWN0aW9uU3BhY2UnKS5jcmVhdGVJbnRlcmFjdGlvblNwYWNlXG4gICAgfTtcbn0iLCJ2YXIgZnMgPSByZXF1aXJlKCdmcycpO1xudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG52YXIgc3RyZWFtID0gcmVxdWlyZSgnc3RyZWFtJyk7XG52YXIgUmVhZGFibGUgPSBzdHJlYW0uUmVhZGFibGU7XG52YXIgV3JpdGFibGUgPSBzdHJlYW0uV3JpdGFibGU7XG52YXIgUGFzc1Rocm91Z2ggPSBzdHJlYW0uUGFzc1Rocm91Z2g7XG52YXIgUGVuZCA9IHJlcXVpcmUoJy4vbW9kdWxlcy9ub2RlLXBlbmQnKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXI7XG5cbmV4cG9ydHMuY3JlYXRlRnJvbUJ1ZmZlciA9IGNyZWF0ZUZyb21CdWZmZXI7XG5leHBvcnRzLmNyZWF0ZUZyb21GZCA9IGNyZWF0ZUZyb21GZDtcbmV4cG9ydHMuQnVmZmVyU2xpY2VyID0gQnVmZmVyU2xpY2VyO1xuZXhwb3J0cy5GZFNsaWNlciA9IEZkU2xpY2VyO1xuXG51dGlsLmluaGVyaXRzKEZkU2xpY2VyLCBFdmVudEVtaXR0ZXIpO1xuZnVuY3Rpb24gRmRTbGljZXIoZmQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHRoaXMuZmQgPSBmZDtcbiAgdGhpcy5wZW5kID0gbmV3IFBlbmQoKTtcbiAgdGhpcy5wZW5kLm1heCA9IDE7XG4gIHRoaXMucmVmQ291bnQgPSAwO1xuICB0aGlzLmF1dG9DbG9zZSA9ICEhb3B0aW9ucy5hdXRvQ2xvc2U7XG59XG5cbkZkU2xpY2VyLnByb3RvdHlwZS5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgc2VsZi5wZW5kLmdvKGZ1bmN0aW9uKGNiKSB7XG4gICAgZnMucmVhZChzZWxmLmZkLCBidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgZnVuY3Rpb24oZXJyLCBieXRlc1JlYWQsIGJ1ZmZlcikge1xuICAgICAgY2IoKTtcbiAgICAgIGNhbGxiYWNrKGVyciwgYnl0ZXNSZWFkLCBidWZmZXIpO1xuICAgIH0pO1xuICB9KTtcbn07XG5cbkZkU2xpY2VyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHNlbGYucGVuZC5nbyhmdW5jdGlvbihjYikge1xuICAgIGZzLndyaXRlKHNlbGYuZmQsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBmdW5jdGlvbihlcnIsIHdyaXR0ZW4sIGJ1ZmZlcikge1xuICAgICAgY2IoKTtcbiAgICAgIGNhbGxiYWNrKGVyciwgd3JpdHRlbiwgYnVmZmVyKTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG5GZFNsaWNlci5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBSZWFkU3RyZWFtKHRoaXMsIG9wdGlvbnMpO1xufTtcblxuRmRTbGljZXIucHJvdG90eXBlLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICByZXR1cm4gbmV3IFdyaXRlU3RyZWFtKHRoaXMsIG9wdGlvbnMpO1xufTtcblxuRmRTbGljZXIucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJlZkNvdW50ICs9IDE7XG59O1xuXG5GZFNsaWNlci5wcm90b3R5cGUudW5yZWYgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBzZWxmLnJlZkNvdW50IC09IDE7XG5cbiAgaWYgKHNlbGYucmVmQ291bnQgPiAwKSByZXR1cm47XG4gIGlmIChzZWxmLnJlZkNvdW50IDwgMCkgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCB1bnJlZlwiKTtcblxuICBpZiAoc2VsZi5hdXRvQ2xvc2UpIHtcbiAgICBmcy5jbG9zZShzZWxmLmZkLCBvbkNsb3NlRG9uZSk7XG4gIH1cblxuICBmdW5jdGlvbiBvbkNsb3NlRG9uZShlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICBzZWxmLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5lbWl0KCdjbG9zZScpO1xuICAgIH1cbiAgfVxufTtcblxudXRpbC5pbmhlcml0cyhSZWFkU3RyZWFtLCBSZWFkYWJsZSk7XG5mdW5jdGlvbiBSZWFkU3RyZWFtKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIFJlYWRhYmxlLmNhbGwodGhpcywgb3B0aW9ucyk7XG5cbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5jb250ZXh0LnJlZigpO1xuXG4gIHRoaXMuc3RhcnQgPSBvcHRpb25zLnN0YXJ0IHx8IDA7XG4gIHRoaXMuZW5kT2Zmc2V0ID0gb3B0aW9ucy5lbmQ7XG4gIHRoaXMucG9zID0gdGhpcy5zdGFydDtcbiAgdGhpcy5kZXN0cm95ZWQgPSBmYWxzZTtcbn1cblxuUmVhZFN0cmVhbS5wcm90b3R5cGUuX3JlYWQgPSBmdW5jdGlvbihuKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgaWYgKHNlbGYuZGVzdHJveWVkKSByZXR1cm47XG5cbiAgdmFyIHRvUmVhZCA9IE1hdGgubWluKHNlbGYuX3JlYWRhYmxlU3RhdGUuaGlnaFdhdGVyTWFyaywgbik7XG4gIGlmIChzZWxmLmVuZE9mZnNldCAhPSBudWxsKSB7XG4gICAgdG9SZWFkID0gTWF0aC5taW4odG9SZWFkLCBzZWxmLmVuZE9mZnNldCAtIHNlbGYucG9zKTtcbiAgfVxuICBpZiAodG9SZWFkIDw9IDApIHtcbiAgICBzZWxmLmRlc3Ryb3llZCA9IHRydWU7XG4gICAgc2VsZi5wdXNoKG51bGwpO1xuICAgIHNlbGYuY29udGV4dC51bnJlZigpO1xuICAgIHJldHVybjtcbiAgfVxuICBzZWxmLmNvbnRleHQucGVuZC5nbyhmdW5jdGlvbihjYikge1xuICAgIGlmIChzZWxmLmRlc3Ryb3llZCkgcmV0dXJuIGNiKCk7XG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBCdWZmZXIodG9SZWFkKTtcbiAgICBmcy5yZWFkKHNlbGYuY29udGV4dC5mZCwgYnVmZmVyLCAwLCB0b1JlYWQsIHNlbGYucG9zLCBmdW5jdGlvbihlcnIsIGJ5dGVzUmVhZCkge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBzZWxmLmRlc3Ryb3koZXJyKTtcbiAgICAgIH0gZWxzZSBpZiAoYnl0ZXNSZWFkID09PSAwKSB7XG4gICAgICAgIHNlbGYuZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5wdXNoKG51bGwpO1xuICAgICAgICBzZWxmLmNvbnRleHQudW5yZWYoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYucG9zICs9IGJ5dGVzUmVhZDtcbiAgICAgICAgc2VsZi5wdXNoKGJ1ZmZlci5zbGljZSgwLCBieXRlc1JlYWQpKTtcbiAgICAgIH1cbiAgICAgIGNiKCk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuUmVhZFN0cmVhbS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKGVycikge1xuICBpZiAodGhpcy5kZXN0cm95ZWQpIHJldHVybjtcbiAgZXJyID0gZXJyIHx8IG5ldyBFcnJvcihcInN0cmVhbSBkZXN0cm95ZWRcIik7XG4gIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gIHRoaXMuY29udGV4dC51bnJlZigpO1xufTtcblxudXRpbC5pbmhlcml0cyhXcml0ZVN0cmVhbSwgV3JpdGFibGUpO1xuZnVuY3Rpb24gV3JpdGVTdHJlYW0oY29udGV4dCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgV3JpdGFibGUuY2FsbCh0aGlzLCBvcHRpb25zKTtcblxuICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICB0aGlzLmNvbnRleHQucmVmKCk7XG5cbiAgdGhpcy5zdGFydCA9IG9wdGlvbnMuc3RhcnQgfHwgMDtcbiAgdGhpcy5lbmRPZmZzZXQgPSAob3B0aW9ucy5lbmQgPT0gbnVsbCkgPyBJbmZpbml0eSA6ICtvcHRpb25zLmVuZDtcbiAgdGhpcy5ieXRlc1dyaXR0ZW4gPSAwO1xuICB0aGlzLnBvcyA9IHRoaXMuc3RhcnQ7XG4gIHRoaXMuZGVzdHJveWVkID0gZmFsc2U7XG5cbiAgdGhpcy5vbignZmluaXNoJywgdGhpcy5kZXN0cm95LmJpbmQodGhpcykpO1xufVxuXG5Xcml0ZVN0cmVhbS5wcm90b3R5cGUuX3dyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCBlbmNvZGluZywgY2FsbGJhY2spIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBpZiAoc2VsZi5kZXN0cm95ZWQpIHJldHVybjtcblxuICBpZiAoc2VsZi5wb3MgKyBidWZmZXIubGVuZ3RoID4gc2VsZi5lbmRPZmZzZXQpIHtcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKFwibWF4aW11bSBmaWxlIGxlbmd0aCBleGNlZWRlZFwiKTtcbiAgICBlcnIuY29kZSA9ICdFVE9PQklHJztcbiAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICBjYWxsYmFjayhlcnIpO1xuICAgIHJldHVybjtcbiAgfVxuICBzZWxmLmNvbnRleHQucGVuZC5nbyhmdW5jdGlvbihjYikge1xuICAgIGlmIChzZWxmLmRlc3Ryb3llZCkgcmV0dXJuIGNiKCk7XG4gICAgZnMud3JpdGUoc2VsZi5jb250ZXh0LmZkLCBidWZmZXIsIDAsIGJ1ZmZlci5sZW5ndGgsIHNlbGYucG9zLCBmdW5jdGlvbihlcnIsIGJ5dGVzKSB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICBjYigpO1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5ieXRlc1dyaXR0ZW4gKz0gYnl0ZXM7XG4gICAgICAgIHNlbGYucG9zICs9IGJ5dGVzO1xuICAgICAgICBzZWxmLmVtaXQoJ3Byb2dyZXNzJyk7XG4gICAgICAgIGNiKCk7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufTtcblxuV3JpdGVTdHJlYW0ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGVzdHJveWVkKSByZXR1cm47XG4gIHRoaXMuZGVzdHJveWVkID0gdHJ1ZTtcbiAgdGhpcy5jb250ZXh0LnVucmVmKCk7XG59O1xuXG51dGlsLmluaGVyaXRzKEJ1ZmZlclNsaWNlciwgRXZlbnRFbWl0dGVyKTtcbmZ1bmN0aW9uIEJ1ZmZlclNsaWNlcihidWZmZXIsIG9wdGlvbnMpIHtcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMucmVmQ291bnQgPSAwO1xuICB0aGlzLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgdGhpcy5tYXhDaHVua1NpemUgPSBvcHRpb25zLm1heENodW5rU2l6ZSB8fCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcbn1cblxuQnVmZmVyU2xpY2VyLnByb3RvdHlwZS5yZWFkID0gZnVuY3Rpb24oYnVmZmVyLCBvZmZzZXQsIGxlbmd0aCwgcG9zaXRpb24sIGNhbGxiYWNrKSB7XG4gIHZhciBlbmQgPSBwb3NpdGlvbiArIGxlbmd0aDtcbiAgdmFyIGRlbHRhID0gZW5kIC0gdGhpcy5idWZmZXIubGVuZ3RoO1xuICB2YXIgd3JpdHRlbiA9IChkZWx0YSA+IDApID8gZGVsdGEgOiBsZW5ndGg7XG4gIHRoaXMuYnVmZmVyLmNvcHkoYnVmZmVyLCBvZmZzZXQsIHBvc2l0aW9uLCBlbmQpO1xuICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgY2FsbGJhY2sobnVsbCwgd3JpdHRlbik7XG4gIH0pO1xufTtcblxuQnVmZmVyU2xpY2VyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaykge1xuICBidWZmZXIuY29weSh0aGlzLmJ1ZmZlciwgcG9zaXRpb24sIG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoKTtcbiAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgIGNhbGxiYWNrKG51bGwsIGxlbmd0aCwgYnVmZmVyKTtcbiAgfSk7XG59O1xuXG5CdWZmZXJTbGljZXIucHJvdG90eXBlLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgcmVhZFN0cmVhbSA9IG5ldyBQYXNzVGhyb3VnaChvcHRpb25zKTtcbiAgcmVhZFN0cmVhbS5kZXN0cm95ZWQgPSBmYWxzZTtcbiAgcmVhZFN0cmVhbS5zdGFydCA9IG9wdGlvbnMuc3RhcnQgfHwgMDtcbiAgcmVhZFN0cmVhbS5lbmRPZmZzZXQgPSBvcHRpb25zLmVuZDtcbiAgLy8gYnkgdGhlIHRpbWUgdGhpcyBmdW5jdGlvbiByZXR1cm5zLCB3ZSdsbCBiZSBkb25lLlxuICByZWFkU3RyZWFtLnBvcyA9IHJlYWRTdHJlYW0uZW5kT2Zmc2V0IHx8IHRoaXMuYnVmZmVyLmxlbmd0aDtcblxuICAvLyByZXNwZWN0IHRoZSBtYXhDaHVua1NpemUgb3B0aW9uIHRvIHNsaWNlIHVwIHRoZSBjaHVuayBpbnRvIHNtYWxsZXIgcGllY2VzLlxuICB2YXIgZW50aXJlU2xpY2UgPSB0aGlzLmJ1ZmZlci5zbGljZShyZWFkU3RyZWFtLnN0YXJ0LCByZWFkU3RyZWFtLnBvcyk7XG4gIHZhciBvZmZzZXQgPSAwO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIHZhciBuZXh0T2Zmc2V0ID0gb2Zmc2V0ICsgdGhpcy5tYXhDaHVua1NpemU7XG4gICAgaWYgKG5leHRPZmZzZXQgPj0gZW50aXJlU2xpY2UubGVuZ3RoKSB7XG4gICAgICAvLyBsYXN0IGNodW5rXG4gICAgICBpZiAob2Zmc2V0IDwgZW50aXJlU2xpY2UubGVuZ3RoKSB7XG4gICAgICAgIHJlYWRTdHJlYW0ud3JpdGUoZW50aXJlU2xpY2Uuc2xpY2Uob2Zmc2V0LCBlbnRpcmVTbGljZS5sZW5ndGgpKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZWFkU3RyZWFtLndyaXRlKGVudGlyZVNsaWNlLnNsaWNlKG9mZnNldCwgbmV4dE9mZnNldCkpO1xuICAgIG9mZnNldCA9IG5leHRPZmZzZXQ7XG4gIH1cblxuICByZWFkU3RyZWFtLmVuZCgpO1xuICByZWFkU3RyZWFtLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgICByZWFkU3RyZWFtLmRlc3Ryb3llZCA9IHRydWU7XG4gIH07XG4gIHJldHVybiByZWFkU3RyZWFtO1xufTtcblxuQnVmZmVyU2xpY2VyLnByb3RvdHlwZS5jcmVhdGVXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIGJ1ZmZlclNsaWNlciA9IHRoaXM7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgd3JpdGVTdHJlYW0gPSBuZXcgV3JpdGFibGUob3B0aW9ucyk7XG4gIHdyaXRlU3RyZWFtLnN0YXJ0ID0gb3B0aW9ucy5zdGFydCB8fCAwO1xuICB3cml0ZVN0cmVhbS5lbmRPZmZzZXQgPSAob3B0aW9ucy5lbmQgPT0gbnVsbCkgPyB0aGlzLmJ1ZmZlci5sZW5ndGggOiArb3B0aW9ucy5lbmQ7XG4gIHdyaXRlU3RyZWFtLmJ5dGVzV3JpdHRlbiA9IDA7XG4gIHdyaXRlU3RyZWFtLnBvcyA9IHdyaXRlU3RyZWFtLnN0YXJ0O1xuICB3cml0ZVN0cmVhbS5kZXN0cm95ZWQgPSBmYWxzZTtcbiAgd3JpdGVTdHJlYW0uX3dyaXRlID0gZnVuY3Rpb24oYnVmZmVyLCBlbmNvZGluZywgY2FsbGJhY2spIHtcbiAgICBpZiAod3JpdGVTdHJlYW0uZGVzdHJveWVkKSByZXR1cm47XG5cbiAgICB2YXIgZW5kID0gd3JpdGVTdHJlYW0ucG9zICsgYnVmZmVyLmxlbmd0aDtcbiAgICBpZiAoZW5kID4gd3JpdGVTdHJlYW0uZW5kT2Zmc2V0KSB7XG4gICAgICB2YXIgZXJyID0gbmV3IEVycm9yKFwibWF4aW11bSBmaWxlIGxlbmd0aCBleGNlZWRlZFwiKTtcbiAgICAgIGVyci5jb2RlID0gJ0VUT09CSUcnO1xuICAgICAgd3JpdGVTdHJlYW0uZGVzdHJveWVkID0gdHJ1ZTtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGJ1ZmZlci5jb3B5KGJ1ZmZlclNsaWNlci5idWZmZXIsIHdyaXRlU3RyZWFtLnBvcywgMCwgYnVmZmVyLmxlbmd0aCk7XG5cbiAgICB3cml0ZVN0cmVhbS5ieXRlc1dyaXR0ZW4gKz0gYnVmZmVyLmxlbmd0aDtcbiAgICB3cml0ZVN0cmVhbS5wb3MgPSBlbmQ7XG4gICAgd3JpdGVTdHJlYW0uZW1pdCgncHJvZ3Jlc3MnKTtcbiAgICBjYWxsYmFjaygpO1xuICB9O1xuICB3cml0ZVN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG4gICAgd3JpdGVTdHJlYW0uZGVzdHJveWVkID0gdHJ1ZTtcbiAgfTtcbiAgcmV0dXJuIHdyaXRlU3RyZWFtO1xufTtcblxuQnVmZmVyU2xpY2VyLnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZWZDb3VudCArPSAxO1xufTtcblxuQnVmZmVyU2xpY2VyLnByb3RvdHlwZS51bnJlZiA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnJlZkNvdW50IC09IDE7XG5cbiAgaWYgKHRoaXMucmVmQ291bnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCB1bnJlZlwiKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY3JlYXRlRnJvbUJ1ZmZlcihidWZmZXIsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBCdWZmZXJTbGljZXIoYnVmZmVyLCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRnJvbUZkKGZkLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgRmRTbGljZXIoZmQsIG9wdGlvbnMpO1xufVxuIiwiLy90byBsb29rIG5pY2UgdGhlIHJlcXVpcmVNb2R1bGUgb24gTm9kZVxucmVxdWlyZShcIi4vbGliL3Bzay1hYnN0cmFjdC1jbGllbnRcIik7XG5pZighJCQuYnJvd3NlclJ1bnRpbWUpe1xuXHRyZXF1aXJlKFwiLi9saWIvcHNrLW5vZGUtY2xpZW50XCIpO1xufWVsc2V7XG5cdHJlcXVpcmUoXCIuL2xpYi9wc2stYnJvd3Nlci1jbGllbnRcIik7XG59IiwiY29uc3QgQmxvY2tjaGFpbiA9IHJlcXVpcmUoJy4vbGliL0Jsb2NrY2hhaW4nKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc3RhcnREQjogZnVuY3Rpb24gKGZvbGRlcikge1xuICAgICAgICBpZiAoJCQuYmxvY2tjaGFpbikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCckJC5ibG9ja2NoYWluIGlzIGFscmVhZHkgZGVmaW5lZCcpO1xuICAgICAgICB9XG4gICAgICAgICQkLmJsb2NrY2hhaW4gPSB0aGlzLmNyZWF0ZURCSGFuZGxlcihmb2xkZXIpO1xuICAgICAgICByZXR1cm4gJCQuYmxvY2tjaGFpbjtcbiAgICB9LFxuICAgIGNyZWF0ZURCSGFuZGxlcjogZnVuY3Rpb24oZm9sZGVyKXtcbiAgICAgICAgcmVxdWlyZSgnLi9saWIvZG9tYWluJyk7XG4gICAgICAgIHJlcXVpcmUoJy4vbGliL3N3YXJtcycpO1xuXG4gICAgICAgIGNvbnN0IGZwZHMgPSByZXF1aXJlKFwiLi9saWIvRm9sZGVyUGVyc2lzdGVudFBEU1wiKTtcbiAgICAgICAgY29uc3QgcGRzID0gZnBkcy5uZXdQRFMoZm9sZGVyKTtcblxuICAgICAgICByZXR1cm4gbmV3IEJsb2NrY2hhaW4ocGRzKTtcbiAgICB9LFxuICAgIHBhcnNlRG9tYWluVXJsOiBmdW5jdGlvbiAoZG9tYWluVXJsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRW1wdHkgZnVuY3Rpb25cIik7XG4gICAgfSxcbiAgICBnZXREb21haW5JbmZvOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRW1wdHkgZnVuY3Rpb25cIik7XG4gICAgfSxcbiAgICBzdGFydEluTWVtb3J5REI6IGZ1bmN0aW9uKCkge1xuXHRcdHJlcXVpcmUoJy4vbGliL2RvbWFpbicpO1xuXHRcdHJlcXVpcmUoJy4vbGliL3N3YXJtcycpO1xuXG5cdFx0Y29uc3QgcGRzID0gcmVxdWlyZSgnLi9saWIvSW5NZW1vcnlQRFMnKTtcblxuXHRcdHJldHVybiBuZXcgQmxvY2tjaGFpbihwZHMubmV3UERTKG51bGwpKTtcbiAgICB9LFxuICAgIHN0YXJ0RGI6IGZ1bmN0aW9uKHJlYWRlcldyaXRlcikge1xuICAgICAgICByZXF1aXJlKCcuL2xpYi9kb21haW4nKTtcbiAgICAgICAgcmVxdWlyZSgnLi9saWIvc3dhcm1zJyk7XG5cbiAgICAgICAgY29uc3QgcHBkcyA9IHJlcXVpcmUoXCIuL2xpYi9QZXJzaXN0ZW50UERTXCIpO1xuICAgICAgICBjb25zdCBwZHMgPSBwcGRzLm5ld1BEUyhyZWFkZXJXcml0ZXIpO1xuXG4gICAgICAgIHJldHVybiBuZXcgQmxvY2tjaGFpbihwZHMpO1xuICAgIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cy51dGlscyAgPSByZXF1aXJlKFwiLi91dGlscy9mbG93c1V0aWxzXCIpO1xuY29uc3QgUm9vdENTQiA9IHJlcXVpcmUoJy4vbGlicmFyaWVzL1Jvb3RDU0InKTtcbm1vZHVsZS5leHBvcnRzLmNyZWF0ZVJvb3RDU0IgPSBSb290Q1NCLmNyZWF0ZVJvb3RDU0I7XG5tb2R1bGUuZXhwb3J0cy5sb2FkV2l0aElkZW50aWZpZXIgPSBSb290Q1NCLmxvYWRXaXRoSWRlbnRpZmllcjtcbm1vZHVsZS5leHBvcnRzLmxvYWRXaXRoUGluICAgPSBSb290Q1NCLmxvYWRXaXRoUGluO1xubW9kdWxlLmV4cG9ydHMud3JpdGVOZXdNYXN0ZXJDU0IgPSBSb290Q1NCLndyaXRlTmV3TWFzdGVyQ1NCO1xubW9kdWxlLmV4cG9ydHMuUm9vdENTQiA9IFJvb3RDU0I7XG5tb2R1bGUuZXhwb3J0cy5SYXdDU0IgPSByZXF1aXJlKCcuL2xpYnJhcmllcy9SYXdDU0InKTtcbm1vZHVsZS5leHBvcnRzLkNTQklkZW50aWZpZXIgPSByZXF1aXJlKCcuL2xpYnJhcmllcy9DU0JJZGVudGlmaWVyJyk7XG5tb2R1bGUuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xuXHQkJC5sb2FkTGlicmFyeShcInBza3dhbGxldFwiLCByZXF1aXJlKFwiLi9saWJyYXJpZXMvZmxvd3MvaW5kZXhcIikpO1xufTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY29uc1V0aWw6IHJlcXVpcmUoJy4vY29uc1V0aWwnKVxufTsiLCJ2YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XG52YXIgemxpYiA9IHJlcXVpcmUoXCJ6bGliXCIpO1xuY29uc3QgZmRfc2xpY2VyID0gcmVxdWlyZShcIm5vZGUtZmQtc2xpY2VyXCIpO1xudmFyIGNyYzMyID0gcmVxdWlyZShcImJ1ZmZlci1jcmMzMlwiKTtcbnZhciB1dGlsID0gcmVxdWlyZShcInV0aWxcIik7XG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImV2ZW50c1wiKS5FdmVudEVtaXR0ZXI7XG52YXIgVHJhbnNmb3JtID0gcmVxdWlyZShcInN0cmVhbVwiKS5UcmFuc2Zvcm07XG52YXIgUGFzc1Rocm91Z2ggPSByZXF1aXJlKFwic3RyZWFtXCIpLlBhc3NUaHJvdWdoO1xudmFyIFdyaXRhYmxlID0gcmVxdWlyZShcInN0cmVhbVwiKS5Xcml0YWJsZTtcblxuZXhwb3J0cy5vcGVuID0gb3BlbjtcbmV4cG9ydHMuZnJvbUZkID0gZnJvbUZkO1xuZXhwb3J0cy5mcm9tQnVmZmVyID0gZnJvbUJ1ZmZlcjtcbmV4cG9ydHMuZnJvbVJhbmRvbUFjY2Vzc1JlYWRlciA9IGZyb21SYW5kb21BY2Nlc3NSZWFkZXI7XG5leHBvcnRzLmRvc0RhdGVUaW1lVG9EYXRlID0gZG9zRGF0ZVRpbWVUb0RhdGU7XG5leHBvcnRzLnZhbGlkYXRlRmlsZU5hbWUgPSB2YWxpZGF0ZUZpbGVOYW1lO1xuZXhwb3J0cy5aaXBGaWxlID0gWmlwRmlsZTtcbmV4cG9ydHMuRW50cnkgPSBFbnRyeTtcbmV4cG9ydHMuUmFuZG9tQWNjZXNzUmVhZGVyID0gUmFuZG9tQWNjZXNzUmVhZGVyO1xuXG5mdW5jdGlvbiBvcGVuKHBhdGgsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0Y2FsbGJhY2sgPSBvcHRpb25zO1xuXHRcdG9wdGlvbnMgPSBudWxsO1xuXHR9XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuYXV0b0Nsb3NlID09IG51bGwpIG9wdGlvbnMuYXV0b0Nsb3NlID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMubGF6eUVudHJpZXMgPT0gbnVsbCkgb3B0aW9ucy5sYXp5RW50cmllcyA9IGZhbHNlO1xuXHRpZiAob3B0aW9ucy5kZWNvZGVTdHJpbmdzID09IG51bGwpIG9wdGlvbnMuZGVjb2RlU3RyaW5ncyA9IHRydWU7XG5cdGlmIChvcHRpb25zLnZhbGlkYXRlRW50cnlTaXplcyA9PSBudWxsKSBvcHRpb25zLnZhbGlkYXRlRW50cnlTaXplcyA9IHRydWU7XG5cdGlmIChvcHRpb25zLnN0cmljdEZpbGVOYW1lcyA9PSBudWxsKSBvcHRpb25zLnN0cmljdEZpbGVOYW1lcyA9IGZhbHNlO1xuXHRpZiAoY2FsbGJhY2sgPT0gbnVsbCkgY2FsbGJhY2sgPSBkZWZhdWx0Q2FsbGJhY2s7XG5cdGZzLm9wZW4ocGF0aCwgXCJyXCIsIGZ1bmN0aW9uIChlcnIsIGZkKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0ZnJvbUZkKGZkLCBvcHRpb25zLCBmdW5jdGlvbiAoZXJyLCB6aXBmaWxlKSB7XG5cdFx0XHRpZiAoZXJyKSBmcy5jbG9zZShmZCwgZGVmYXVsdENhbGxiYWNrKTtcblx0XHRcdGNhbGxiYWNrKGVyciwgemlwZmlsZSk7XG5cdFx0fSk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBmcm9tRmQoZmQsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG5cdGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XG5cdFx0Y2FsbGJhY2sgPSBvcHRpb25zO1xuXHRcdG9wdGlvbnMgPSBudWxsO1xuXHR9XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuYXV0b0Nsb3NlID09IG51bGwpIG9wdGlvbnMuYXV0b0Nsb3NlID0gZmFsc2U7XG5cdGlmIChvcHRpb25zLmxhenlFbnRyaWVzID09IG51bGwpIG9wdGlvbnMubGF6eUVudHJpZXMgPSBmYWxzZTtcblx0aWYgKG9wdGlvbnMuZGVjb2RlU3RyaW5ncyA9PSBudWxsKSBvcHRpb25zLmRlY29kZVN0cmluZ3MgPSB0cnVlO1xuXHRpZiAob3B0aW9ucy52YWxpZGF0ZUVudHJ5U2l6ZXMgPT0gbnVsbCkgb3B0aW9ucy52YWxpZGF0ZUVudHJ5U2l6ZXMgPSB0cnVlO1xuXHRpZiAob3B0aW9ucy5zdHJpY3RGaWxlTmFtZXMgPT0gbnVsbCkgb3B0aW9ucy5zdHJpY3RGaWxlTmFtZXMgPSBmYWxzZTtcblx0aWYgKGNhbGxiYWNrID09IG51bGwpIGNhbGxiYWNrID0gZGVmYXVsdENhbGxiYWNrO1xuXHRmcy5mc3RhdChmZCwgZnVuY3Rpb24gKGVyciwgc3RhdHMpIHtcblx0XHRpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHR2YXIgcmVhZGVyID0gZmRfc2xpY2VyLmNyZWF0ZUZyb21GZChmZCwge2F1dG9DbG9zZTogdHJ1ZX0pO1xuXHRcdGZyb21SYW5kb21BY2Nlc3NSZWFkZXIocmVhZGVyLCBzdGF0cy5zaXplLCBvcHRpb25zLCBjYWxsYmFjayk7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyKGJ1ZmZlciwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0aWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRjYWxsYmFjayA9IG9wdGlvbnM7XG5cdFx0b3B0aW9ucyA9IG51bGw7XG5cdH1cblx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgb3B0aW9ucyA9IHt9O1xuXHRvcHRpb25zLmF1dG9DbG9zZSA9IGZhbHNlO1xuXHRpZiAob3B0aW9ucy5sYXp5RW50cmllcyA9PSBudWxsKSBvcHRpb25zLmxhenlFbnRyaWVzID0gZmFsc2U7XG5cdGlmIChvcHRpb25zLmRlY29kZVN0cmluZ3MgPT0gbnVsbCkgb3B0aW9ucy5kZWNvZGVTdHJpbmdzID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID09IG51bGwpIG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID09IG51bGwpIG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID0gZmFsc2U7XG5cdC8vIGxpbWl0IHRoZSBtYXggY2h1bmsgc2l6ZS4gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90aGVqb3Nod29sZmUveWF1emwvaXNzdWVzLzg3XG5cdHZhciByZWFkZXIgPSBmZF9zbGljZXIuY3JlYXRlRnJvbUJ1ZmZlcihidWZmZXIsIHttYXhDaHVua1NpemU6IDB4MTAwMDB9KTtcblx0ZnJvbVJhbmRvbUFjY2Vzc1JlYWRlcihyZWFkZXIsIGJ1ZmZlci5sZW5ndGgsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gZnJvbVJhbmRvbUFjY2Vzc1JlYWRlcihyZWFkZXIsIHRvdGFsU2l6ZSwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0aWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRjYWxsYmFjayA9IG9wdGlvbnM7XG5cdFx0b3B0aW9ucyA9IG51bGw7XG5cdH1cblx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgb3B0aW9ucyA9IHt9O1xuXHRpZiAob3B0aW9ucy5hdXRvQ2xvc2UgPT0gbnVsbCkgb3B0aW9ucy5hdXRvQ2xvc2UgPSB0cnVlO1xuXHRpZiAob3B0aW9ucy5sYXp5RW50cmllcyA9PSBudWxsKSBvcHRpb25zLmxhenlFbnRyaWVzID0gZmFsc2U7XG5cdGlmIChvcHRpb25zLmRlY29kZVN0cmluZ3MgPT0gbnVsbCkgb3B0aW9ucy5kZWNvZGVTdHJpbmdzID0gdHJ1ZTtcblx0dmFyIGRlY29kZVN0cmluZ3MgPSAhIW9wdGlvbnMuZGVjb2RlU3RyaW5ncztcblx0aWYgKG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID09IG51bGwpIG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzID0gdHJ1ZTtcblx0aWYgKG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID09IG51bGwpIG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzID0gZmFsc2U7XG5cdGlmIChjYWxsYmFjayA9PSBudWxsKSBjYWxsYmFjayA9IGRlZmF1bHRDYWxsYmFjaztcblx0aWYgKHR5cGVvZiB0b3RhbFNpemUgIT09IFwibnVtYmVyXCIpIHRocm93IG5ldyBFcnJvcihcImV4cGVjdGVkIHRvdGFsU2l6ZSBwYXJhbWV0ZXIgdG8gYmUgYSBudW1iZXJcIik7XG5cdGlmICh0b3RhbFNpemUgPiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUikge1xuXHRcdHRocm93IG5ldyBFcnJvcihcInppcCBmaWxlIHRvbyBsYXJnZS4gb25seSBmaWxlIHNpemVzIHVwIHRvIDJeNTIgYXJlIHN1cHBvcnRlZCBkdWUgdG8gSmF2YVNjcmlwdCdzIE51bWJlciB0eXBlIGJlaW5nIGFuIElFRUUgNzU0IGRvdWJsZS5cIik7XG5cdH1cblxuXHQvLyB0aGUgbWF0Y2hpbmcgdW5yZWYoKSBjYWxsIGlzIGluIHppcGZpbGUuY2xvc2UoKVxuXHRyZWFkZXIucmVmKCk7XG5cblx0Ly8gZW9jZHIgbWVhbnMgRW5kIG9mIENlbnRyYWwgRGlyZWN0b3J5IFJlY29yZC5cblx0Ly8gc2VhcmNoIGJhY2t3YXJkcyBmb3IgdGhlIGVvY2RyIHNpZ25hdHVyZS5cblx0Ly8gdGhlIGxhc3QgZmllbGQgb2YgdGhlIGVvY2RyIGlzIGEgdmFyaWFibGUtbGVuZ3RoIGNvbW1lbnQuXG5cdC8vIHRoZSBjb21tZW50IHNpemUgaXMgZW5jb2RlZCBpbiBhIDItYnl0ZSBmaWVsZCBpbiB0aGUgZW9jZHIsIHdoaWNoIHdlIGNhbid0IGZpbmQgd2l0aG91dCB0cnVkZ2luZyBiYWNrd2FyZHMgdGhyb3VnaCB0aGUgY29tbWVudCB0byBmaW5kIGl0LlxuXHQvLyBhcyBhIGNvbnNlcXVlbmNlIG9mIHRoaXMgZGVzaWduIGRlY2lzaW9uLCBpdCdzIHBvc3NpYmxlIHRvIGhhdmUgYW1iaWd1b3VzIHppcCBmaWxlIG1ldGFkYXRhIGlmIGEgY29oZXJlbnQgZW9jZHIgd2FzIGluIHRoZSBjb21tZW50LlxuXHQvLyB3ZSBzZWFyY2ggYmFja3dhcmRzIGZvciBhIGVvY2RyIHNpZ25hdHVyZSwgYW5kIGhvcGUgdGhhdCB3aG9ldmVyIG1hZGUgdGhlIHppcCBmaWxlIHdhcyBzbWFydCBlbm91Z2ggdG8gZm9yYmlkIHRoZSBlb2NkciBzaWduYXR1cmUgaW4gdGhlIGNvbW1lbnQuXG5cdHZhciBlb2NkcldpdGhvdXRDb21tZW50U2l6ZSA9IDIyO1xuXHR2YXIgbWF4Q29tbWVudFNpemUgPSAweGZmZmY7IC8vIDItYnl0ZSBzaXplXG5cdHZhciBidWZmZXJTaXplID0gTWF0aC5taW4oZW9jZHJXaXRob3V0Q29tbWVudFNpemUgKyBtYXhDb21tZW50U2l6ZSwgdG90YWxTaXplKTtcblx0dmFyIGJ1ZmZlciA9IG5ld0J1ZmZlcihidWZmZXJTaXplKTtcblx0dmFyIGJ1ZmZlclJlYWRTdGFydCA9IHRvdGFsU2l6ZSAtIGJ1ZmZlci5sZW5ndGg7XG5cdHJlYWRBbmRBc3NlcnROb0VvZihyZWFkZXIsIGJ1ZmZlciwgMCwgYnVmZmVyU2l6ZSwgYnVmZmVyUmVhZFN0YXJ0LCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0Zm9yICh2YXIgaSA9IGJ1ZmZlclNpemUgLSBlb2NkcldpdGhvdXRDb21tZW50U2l6ZTsgaSA+PSAwOyBpIC09IDEpIHtcblx0XHRcdGlmIChidWZmZXIucmVhZFVJbnQzMkxFKGkpICE9PSAweDA2MDU0YjUwKSBjb250aW51ZTtcblx0XHRcdC8vIGZvdW5kIGVvY2RyXG5cdFx0XHR2YXIgZW9jZHJCdWZmZXIgPSBidWZmZXIuc2xpY2UoaSk7XG5cblx0XHRcdC8vIDAgLSBFbmQgb2YgY2VudHJhbCBkaXJlY3Rvcnkgc2lnbmF0dXJlID0gMHgwNjA1NGI1MFxuXHRcdFx0Ly8gNCAtIE51bWJlciBvZiB0aGlzIGRpc2tcblx0XHRcdHZhciBkaXNrTnVtYmVyID0gZW9jZHJCdWZmZXIucmVhZFVJbnQxNkxFKDQpO1xuXHRcdFx0aWYgKGRpc2tOdW1iZXIgIT09IDApIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIm11bHRpLWRpc2sgemlwIGZpbGVzIGFyZSBub3Qgc3VwcG9ydGVkOiBmb3VuZCBkaXNrIG51bWJlcjogXCIgKyBkaXNrTnVtYmVyKSk7XG5cdFx0XHR9XG5cdFx0XHQvLyA2IC0gRGlzayB3aGVyZSBjZW50cmFsIGRpcmVjdG9yeSBzdGFydHNcblx0XHRcdC8vIDggLSBOdW1iZXIgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkcyBvbiB0aGlzIGRpc2tcblx0XHRcdC8vIDEwIC0gVG90YWwgbnVtYmVyIG9mIGNlbnRyYWwgZGlyZWN0b3J5IHJlY29yZHNcblx0XHRcdHZhciBlbnRyeUNvdW50ID0gZW9jZHJCdWZmZXIucmVhZFVJbnQxNkxFKDEwKTtcblx0XHRcdC8vIDEyIC0gU2l6ZSBvZiBjZW50cmFsIGRpcmVjdG9yeSAoYnl0ZXMpXG5cdFx0XHQvLyAxNiAtIE9mZnNldCBvZiBzdGFydCBvZiBjZW50cmFsIGRpcmVjdG9yeSwgcmVsYXRpdmUgdG8gc3RhcnQgb2YgYXJjaGl2ZVxuXHRcdFx0dmFyIGNlbnRyYWxEaXJlY3RvcnlPZmZzZXQgPSBlb2NkckJ1ZmZlci5yZWFkVUludDMyTEUoMTYpO1xuXHRcdFx0Ly8gMjAgLSBDb21tZW50IGxlbmd0aFxuXHRcdFx0dmFyIGNvbW1lbnRMZW5ndGggPSBlb2NkckJ1ZmZlci5yZWFkVUludDE2TEUoMjApO1xuXHRcdFx0dmFyIGV4cGVjdGVkQ29tbWVudExlbmd0aCA9IGVvY2RyQnVmZmVyLmxlbmd0aCAtIGVvY2RyV2l0aG91dENvbW1lbnRTaXplO1xuXHRcdFx0aWYgKGNvbW1lbnRMZW5ndGggIT09IGV4cGVjdGVkQ29tbWVudExlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiaW52YWxpZCBjb21tZW50IGxlbmd0aC4gZXhwZWN0ZWQ6IFwiICsgZXhwZWN0ZWRDb21tZW50TGVuZ3RoICsgXCIuIGZvdW5kOiBcIiArIGNvbW1lbnRMZW5ndGgpKTtcblx0XHRcdH1cblx0XHRcdC8vIDIyIC0gQ29tbWVudFxuXHRcdFx0Ly8gdGhlIGVuY29kaW5nIGlzIGFsd2F5cyBjcDQzNy5cblx0XHRcdHZhciBjb21tZW50ID0gZGVjb2RlU3RyaW5ncyA/IGRlY29kZUJ1ZmZlcihlb2NkckJ1ZmZlciwgMjIsIGVvY2RyQnVmZmVyLmxlbmd0aCwgZmFsc2UpXG5cdFx0XHRcdDogZW9jZHJCdWZmZXIuc2xpY2UoMjIpO1xuXG5cdFx0XHRpZiAoIShlbnRyeUNvdW50ID09PSAweGZmZmYgfHwgY2VudHJhbERpcmVjdG9yeU9mZnNldCA9PT0gMHhmZmZmZmZmZikpIHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG51bGwsIG5ldyBaaXBGaWxlKHJlYWRlciwgY2VudHJhbERpcmVjdG9yeU9mZnNldCwgdG90YWxTaXplLCBlbnRyeUNvdW50LCBjb21tZW50LCBvcHRpb25zLmF1dG9DbG9zZSwgb3B0aW9ucy5sYXp5RW50cmllcywgZGVjb2RlU3RyaW5ncywgb3B0aW9ucy52YWxpZGF0ZUVudHJ5U2l6ZXMsIG9wdGlvbnMuc3RyaWN0RmlsZU5hbWVzKSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFpJUDY0IGZvcm1hdFxuXG5cdFx0XHQvLyBaSVA2NCBaaXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvclxuXHRcdFx0dmFyIHppcDY0RW9jZGxCdWZmZXIgPSBuZXdCdWZmZXIoMjApO1xuXHRcdFx0dmFyIHppcDY0RW9jZGxPZmZzZXQgPSBidWZmZXJSZWFkU3RhcnQgKyBpIC0gemlwNjRFb2NkbEJ1ZmZlci5sZW5ndGg7XG5cdFx0XHRyZWFkQW5kQXNzZXJ0Tm9Fb2YocmVhZGVyLCB6aXA2NEVvY2RsQnVmZmVyLCAwLCB6aXA2NEVvY2RsQnVmZmVyLmxlbmd0aCwgemlwNjRFb2NkbE9mZnNldCwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcblxuXHRcdFx0XHQvLyAwIC0gemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyIGxvY2F0b3Igc2lnbmF0dXJlID0gMHgwNzA2NGI1MFxuXHRcdFx0XHRpZiAoemlwNjRFb2NkbEJ1ZmZlci5yZWFkVUludDMyTEUoMCkgIT09IDB4MDcwNjRiNTApIHtcblx0XHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwiaW52YWxpZCB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgbG9jYXRvciBzaWduYXR1cmVcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIDQgLSBudW1iZXIgb2YgdGhlIGRpc2sgd2l0aCB0aGUgc3RhcnQgb2YgdGhlIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeVxuXHRcdFx0XHQvLyA4IC0gcmVsYXRpdmUgb2Zmc2V0IG9mIHRoZSB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkXG5cdFx0XHRcdHZhciB6aXA2NEVvY2RyT2Zmc2V0ID0gcmVhZFVJbnQ2NExFKHppcDY0RW9jZGxCdWZmZXIsIDgpO1xuXHRcdFx0XHQvLyAxNiAtIHRvdGFsIG51bWJlciBvZiBkaXNrc1xuXG5cdFx0XHRcdC8vIFpJUDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmRcblx0XHRcdFx0dmFyIHppcDY0RW9jZHJCdWZmZXIgPSBuZXdCdWZmZXIoNTYpO1xuXHRcdFx0XHRyZWFkQW5kQXNzZXJ0Tm9Fb2YocmVhZGVyLCB6aXA2NEVvY2RyQnVmZmVyLCAwLCB6aXA2NEVvY2RyQnVmZmVyLmxlbmd0aCwgemlwNjRFb2Nkck9mZnNldCwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRcdGlmIChlcnIpIHJldHVybiBjYWxsYmFjayhlcnIpO1xuXG5cdFx0XHRcdFx0Ly8gMCAtIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpciBzaWduYXR1cmUgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzICAoMHgwNjA2NGI1MClcblx0XHRcdFx0XHRpZiAoemlwNjRFb2NkckJ1ZmZlci5yZWFkVUludDMyTEUoMCkgIT09IDB4MDYwNjRiNTApIHtcblx0XHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJpbnZhbGlkIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmQgc2lnbmF0dXJlXCIpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gNCAtIHNpemUgb2YgemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5IHJlY29yZCAgICAgICAgICAgICAgICA4IGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMTIgLSB2ZXJzaW9uIG1hZGUgYnkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMTQgLSB2ZXJzaW9uIG5lZWRlZCB0byBleHRyYWN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMTYgLSBudW1iZXIgb2YgdGhpcyBkaXNrICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMjAgLSBudW1iZXIgb2YgdGhlIGRpc2sgd2l0aCB0aGUgc3RhcnQgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICA0IGJ5dGVzXG5cdFx0XHRcdFx0Ly8gMjQgLSB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgY2VudHJhbCBkaXJlY3Rvcnkgb24gdGhpcyBkaXNrICAgICAgICAgOCBieXRlc1xuXHRcdFx0XHRcdC8vIDMyIC0gdG90YWwgbnVtYmVyIG9mIGVudHJpZXMgaW4gdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgOCBieXRlc1xuXHRcdFx0XHRcdGVudHJ5Q291bnQgPSByZWFkVUludDY0TEUoemlwNjRFb2NkckJ1ZmZlciwgMzIpO1xuXHRcdFx0XHRcdC8vIDQwIC0gc2l6ZSBvZiB0aGUgY2VudHJhbCBkaXJlY3RvcnkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHRcdFx0XHRcdC8vIDQ4IC0gb2Zmc2V0IG9mIHN0YXJ0IG9mIGNlbnRyYWwgZGlyZWN0b3J5IHdpdGggcmVzcGVjdCB0byB0aGUgc3RhcnRpbmcgZGlzayBudW1iZXIgICAgIDggYnl0ZXNcblx0XHRcdFx0XHRjZW50cmFsRGlyZWN0b3J5T2Zmc2V0ID0gcmVhZFVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIDQ4KTtcblx0XHRcdFx0XHQvLyA1NiAtIHppcDY0IGV4dGVuc2libGUgZGF0YSBzZWN0b3IgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh2YXJpYWJsZSBzaXplKVxuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhudWxsLCBuZXcgWmlwRmlsZShyZWFkZXIsIGNlbnRyYWxEaXJlY3RvcnlPZmZzZXQsIHRvdGFsU2l6ZSwgZW50cnlDb3VudCwgY29tbWVudCwgb3B0aW9ucy5hdXRvQ2xvc2UsIG9wdGlvbnMubGF6eUVudHJpZXMsIGRlY29kZVN0cmluZ3MsIG9wdGlvbnMudmFsaWRhdGVFbnRyeVNpemVzLCBvcHRpb25zLnN0cmljdEZpbGVOYW1lcykpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRjYWxsYmFjayhuZXcgRXJyb3IoXCJlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkIHNpZ25hdHVyZSBub3QgZm91bmRcIikpO1xuXHR9KTtcbn1cblxudXRpbC5pbmhlcml0cyhaaXBGaWxlLCBFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBaaXBGaWxlKHJlYWRlciwgY2VudHJhbERpcmVjdG9yeU9mZnNldCwgZmlsZVNpemUsIGVudHJ5Q291bnQsIGNvbW1lbnQsIGF1dG9DbG9zZSwgbGF6eUVudHJpZXMsIGRlY29kZVN0cmluZ3MsIHZhbGlkYXRlRW50cnlTaXplcywgc3RyaWN0RmlsZU5hbWVzKSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0RXZlbnRFbWl0dGVyLmNhbGwoc2VsZik7XG5cdHNlbGYucmVhZGVyID0gcmVhZGVyO1xuXHQvLyBmb3J3YXJkIGNsb3NlIGV2ZW50c1xuXHRzZWxmLnJlYWRlci5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHQvLyBlcnJvciBjbG9zaW5nIHRoZSBmZFxuXHRcdGVtaXRFcnJvcihzZWxmLCBlcnIpO1xuXHR9KTtcblx0c2VsZi5yZWFkZXIub25jZShcImNsb3NlXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRzZWxmLmVtaXQoXCJjbG9zZVwiKTtcblx0fSk7XG5cdHNlbGYucmVhZEVudHJ5Q3Vyc29yID0gY2VudHJhbERpcmVjdG9yeU9mZnNldDtcblx0c2VsZi5maWxlU2l6ZSA9IGZpbGVTaXplO1xuXHRzZWxmLmVudHJ5Q291bnQgPSBlbnRyeUNvdW50O1xuXHRzZWxmLmNvbW1lbnQgPSBjb21tZW50O1xuXHRzZWxmLmVudHJpZXNSZWFkID0gMDtcblx0c2VsZi5hdXRvQ2xvc2UgPSAhIWF1dG9DbG9zZTtcblx0c2VsZi5sYXp5RW50cmllcyA9ICEhbGF6eUVudHJpZXM7XG5cdHNlbGYuZGVjb2RlU3RyaW5ncyA9ICEhZGVjb2RlU3RyaW5ncztcblx0c2VsZi52YWxpZGF0ZUVudHJ5U2l6ZXMgPSAhIXZhbGlkYXRlRW50cnlTaXplcztcblx0c2VsZi5zdHJpY3RGaWxlTmFtZXMgPSAhIXN0cmljdEZpbGVOYW1lcztcblx0c2VsZi5pc09wZW4gPSB0cnVlO1xuXHRzZWxmLmVtaXR0ZWRFcnJvciA9IGZhbHNlO1xuXG5cdGlmICghc2VsZi5sYXp5RW50cmllcykgc2VsZi5fcmVhZEVudHJ5KCk7XG59XG5cblppcEZpbGUucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuXHRpZiAoIXRoaXMuaXNPcGVuKSByZXR1cm47XG5cdHRoaXMuaXNPcGVuID0gZmFsc2U7XG5cdHRoaXMucmVhZGVyLnVucmVmKCk7XG59O1xuXG5mdW5jdGlvbiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgZXJyKSB7XG5cdGlmIChzZWxmLmF1dG9DbG9zZSkgc2VsZi5jbG9zZSgpO1xuXHRlbWl0RXJyb3Ioc2VsZiwgZXJyKTtcbn1cblxuZnVuY3Rpb24gZW1pdEVycm9yKHNlbGYsIGVycikge1xuXHRpZiAoc2VsZi5lbWl0dGVkRXJyb3IpIHJldHVybjtcblx0c2VsZi5lbWl0dGVkRXJyb3IgPSB0cnVlO1xuXHRzZWxmLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xufVxuXG5aaXBGaWxlLnByb3RvdHlwZS5yZWFkRW50cnkgPSBmdW5jdGlvbiAoKSB7XG5cdGlmICghdGhpcy5sYXp5RW50cmllcykgdGhyb3cgbmV3IEVycm9yKFwicmVhZEVudHJ5KCkgY2FsbGVkIHdpdGhvdXQgbGF6eUVudHJpZXM6dHJ1ZVwiKTtcblx0dGhpcy5fcmVhZEVudHJ5KCk7XG59O1xuWmlwRmlsZS5wcm90b3R5cGUuX3JlYWRFbnRyeSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRpZiAoc2VsZi5lbnRyeUNvdW50ID09PSBzZWxmLmVudHJpZXNSZWFkKSB7XG5cdFx0Ly8gZG9uZSB3aXRoIG1ldGFkYXRhXG5cdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmIChzZWxmLmF1dG9DbG9zZSkgc2VsZi5jbG9zZSgpO1xuXHRcdFx0aWYgKHNlbGYuZW1pdHRlZEVycm9yKSByZXR1cm47XG5cdFx0XHRzZWxmLmVtaXQoXCJlbmRcIik7XG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChzZWxmLmVtaXR0ZWRFcnJvcikgcmV0dXJuO1xuXHR2YXIgYnVmZmVyID0gbmV3QnVmZmVyKDQ2KTtcblx0cmVhZEFuZEFzc2VydE5vRW9mKHNlbGYucmVhZGVyLCBidWZmZXIsIDAsIGJ1ZmZlci5sZW5ndGgsIHNlbGYucmVhZEVudHJ5Q3Vyc29yLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBlcnIpO1xuXHRcdGlmIChzZWxmLmVtaXR0ZWRFcnJvcikgcmV0dXJuO1xuXHRcdHZhciBlbnRyeSA9IG5ldyBFbnRyeSgpO1xuXHRcdC8vIDAgLSBDZW50cmFsIGRpcmVjdG9yeSBmaWxlIGhlYWRlciBzaWduYXR1cmVcblx0XHR2YXIgc2lnbmF0dXJlID0gYnVmZmVyLnJlYWRVSW50MzJMRSgwKTtcblx0XHRpZiAoc2lnbmF0dXJlICE9PSAweDAyMDE0YjUwKSByZXR1cm4gZW1pdEVycm9yQW5kQXV0b0Nsb3NlKHNlbGYsIG5ldyBFcnJvcihcImludmFsaWQgY2VudHJhbCBkaXJlY3RvcnkgZmlsZSBoZWFkZXIgc2lnbmF0dXJlOiAweFwiICsgc2lnbmF0dXJlLnRvU3RyaW5nKDE2KSkpO1xuXHRcdC8vIDQgLSBWZXJzaW9uIG1hZGUgYnlcblx0XHRlbnRyeS52ZXJzaW9uTWFkZUJ5ID0gYnVmZmVyLnJlYWRVSW50MTZMRSg0KTtcblx0XHQvLyA2IC0gVmVyc2lvbiBuZWVkZWQgdG8gZXh0cmFjdCAobWluaW11bSlcblx0XHRlbnRyeS52ZXJzaW9uTmVlZGVkVG9FeHRyYWN0ID0gYnVmZmVyLnJlYWRVSW50MTZMRSg2KTtcblx0XHQvLyA4IC0gR2VuZXJhbCBwdXJwb3NlIGJpdCBmbGFnXG5cdFx0ZW50cnkuZ2VuZXJhbFB1cnBvc2VCaXRGbGFnID0gYnVmZmVyLnJlYWRVSW50MTZMRSg4KTtcblx0XHQvLyAxMCAtIENvbXByZXNzaW9uIG1ldGhvZFxuXHRcdGVudHJ5LmNvbXByZXNzaW9uTWV0aG9kID0gYnVmZmVyLnJlYWRVSW50MTZMRSgxMCk7XG5cdFx0Ly8gMTIgLSBGaWxlIGxhc3QgbW9kaWZpY2F0aW9uIHRpbWVcblx0XHRlbnRyeS5sYXN0TW9kRmlsZVRpbWUgPSBidWZmZXIucmVhZFVJbnQxNkxFKDEyKTtcblx0XHQvLyAxNCAtIEZpbGUgbGFzdCBtb2RpZmljYXRpb24gZGF0ZVxuXHRcdGVudHJ5Lmxhc3RNb2RGaWxlRGF0ZSA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMTQpO1xuXHRcdC8vIDE2IC0gQ1JDLTMyXG5cdFx0ZW50cnkuY3JjMzIgPSBidWZmZXIucmVhZFVJbnQzMkxFKDE2KTtcblx0XHQvLyAyMCAtIENvbXByZXNzZWQgc2l6ZVxuXHRcdGVudHJ5LmNvbXByZXNzZWRTaXplID0gYnVmZmVyLnJlYWRVSW50MzJMRSgyMCk7XG5cdFx0Ly8gMjQgLSBVbmNvbXByZXNzZWQgc2l6ZVxuXHRcdGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPSBidWZmZXIucmVhZFVJbnQzMkxFKDI0KTtcblx0XHQvLyAyOCAtIEZpbGUgbmFtZSBsZW5ndGggKG4pXG5cdFx0ZW50cnkuZmlsZU5hbWVMZW5ndGggPSBidWZmZXIucmVhZFVJbnQxNkxFKDI4KTtcblx0XHQvLyAzMCAtIEV4dHJhIGZpZWxkIGxlbmd0aCAobSlcblx0XHRlbnRyeS5leHRyYUZpZWxkTGVuZ3RoID0gYnVmZmVyLnJlYWRVSW50MTZMRSgzMCk7XG5cdFx0Ly8gMzIgLSBGaWxlIGNvbW1lbnQgbGVuZ3RoIChrKVxuXHRcdGVudHJ5LmZpbGVDb21tZW50TGVuZ3RoID0gYnVmZmVyLnJlYWRVSW50MTZMRSgzMik7XG5cdFx0Ly8gMzQgLSBEaXNrIG51bWJlciB3aGVyZSBmaWxlIHN0YXJ0c1xuXHRcdC8vIDM2IC0gSW50ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzXG5cdFx0ZW50cnkuaW50ZXJuYWxGaWxlQXR0cmlidXRlcyA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMzYpO1xuXHRcdC8vIDM4IC0gRXh0ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzXG5cdFx0ZW50cnkuZXh0ZXJuYWxGaWxlQXR0cmlidXRlcyA9IGJ1ZmZlci5yZWFkVUludDMyTEUoMzgpO1xuXHRcdC8vIDQyIC0gUmVsYXRpdmUgb2Zmc2V0IG9mIGxvY2FsIGZpbGUgaGVhZGVyXG5cdFx0ZW50cnkucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyID0gYnVmZmVyLnJlYWRVSW50MzJMRSg0Mik7XG5cblx0XHRpZiAoZW50cnkuZ2VuZXJhbFB1cnBvc2VCaXRGbGFnICYgMHg0MCkgcmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJzdHJvbmcgZW5jcnlwdGlvbiBpcyBub3Qgc3VwcG9ydGVkXCIpKTtcblxuXHRcdHNlbGYucmVhZEVudHJ5Q3Vyc29yICs9IDQ2O1xuXG5cdFx0YnVmZmVyID0gbmV3QnVmZmVyKGVudHJ5LmZpbGVOYW1lTGVuZ3RoICsgZW50cnkuZXh0cmFGaWVsZExlbmd0aCArIGVudHJ5LmZpbGVDb21tZW50TGVuZ3RoKTtcblx0XHRyZWFkQW5kQXNzZXJ0Tm9Fb2Yoc2VsZi5yZWFkZXIsIGJ1ZmZlciwgMCwgYnVmZmVyLmxlbmd0aCwgc2VsZi5yZWFkRW50cnlDdXJzb3IsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdGlmIChlcnIpIHJldHVybiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgZXJyKTtcblx0XHRcdGlmIChzZWxmLmVtaXR0ZWRFcnJvcikgcmV0dXJuO1xuXHRcdFx0Ly8gNDYgLSBGaWxlIG5hbWVcblx0XHRcdHZhciBpc1V0ZjggPSAoZW50cnkuZ2VuZXJhbFB1cnBvc2VCaXRGbGFnICYgMHg4MDApICE9PSAwO1xuXHRcdFx0ZW50cnkuZmlsZU5hbWUgPSBzZWxmLmRlY29kZVN0cmluZ3MgPyBkZWNvZGVCdWZmZXIoYnVmZmVyLCAwLCBlbnRyeS5maWxlTmFtZUxlbmd0aCwgaXNVdGY4KVxuXHRcdFx0XHQ6IGJ1ZmZlci5zbGljZSgwLCBlbnRyeS5maWxlTmFtZUxlbmd0aCk7XG5cblx0XHRcdC8vIDQ2K24gLSBFeHRyYSBmaWVsZFxuXHRcdFx0dmFyIGZpbGVDb21tZW50U3RhcnQgPSBlbnRyeS5maWxlTmFtZUxlbmd0aCArIGVudHJ5LmV4dHJhRmllbGRMZW5ndGg7XG5cdFx0XHR2YXIgZXh0cmFGaWVsZEJ1ZmZlciA9IGJ1ZmZlci5zbGljZShlbnRyeS5maWxlTmFtZUxlbmd0aCwgZmlsZUNvbW1lbnRTdGFydCk7XG5cdFx0XHRlbnRyeS5leHRyYUZpZWxkcyA9IFtdO1xuXHRcdFx0dmFyIGkgPSAwO1xuXHRcdFx0d2hpbGUgKGkgPCBleHRyYUZpZWxkQnVmZmVyLmxlbmd0aCAtIDMpIHtcblx0XHRcdFx0dmFyIGhlYWRlcklkID0gZXh0cmFGaWVsZEJ1ZmZlci5yZWFkVUludDE2TEUoaSArIDApO1xuXHRcdFx0XHR2YXIgZGF0YVNpemUgPSBleHRyYUZpZWxkQnVmZmVyLnJlYWRVSW50MTZMRShpICsgMik7XG5cdFx0XHRcdHZhciBkYXRhU3RhcnQgPSBpICsgNDtcblx0XHRcdFx0dmFyIGRhdGFFbmQgPSBkYXRhU3RhcnQgKyBkYXRhU2l6ZTtcblx0XHRcdFx0aWYgKGRhdGFFbmQgPiBleHRyYUZpZWxkQnVmZmVyLmxlbmd0aCkgcmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJleHRyYSBmaWVsZCBsZW5ndGggZXhjZWVkcyBleHRyYSBmaWVsZCBidWZmZXIgc2l6ZVwiKSk7XG5cdFx0XHRcdHZhciBkYXRhQnVmZmVyID0gbmV3QnVmZmVyKGRhdGFTaXplKTtcblx0XHRcdFx0ZXh0cmFGaWVsZEJ1ZmZlci5jb3B5KGRhdGFCdWZmZXIsIDAsIGRhdGFTdGFydCwgZGF0YUVuZCk7XG5cdFx0XHRcdGVudHJ5LmV4dHJhRmllbGRzLnB1c2goe1xuXHRcdFx0XHRcdGlkOiBoZWFkZXJJZCxcblx0XHRcdFx0XHRkYXRhOiBkYXRhQnVmZmVyLFxuXHRcdFx0XHR9KTtcblx0XHRcdFx0aSA9IGRhdGFFbmQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vIDQ2K24rbSAtIEZpbGUgY29tbWVudFxuXHRcdFx0ZW50cnkuZmlsZUNvbW1lbnQgPSBzZWxmLmRlY29kZVN0cmluZ3MgPyBkZWNvZGVCdWZmZXIoYnVmZmVyLCBmaWxlQ29tbWVudFN0YXJ0LCBmaWxlQ29tbWVudFN0YXJ0ICsgZW50cnkuZmlsZUNvbW1lbnRMZW5ndGgsIGlzVXRmOClcblx0XHRcdFx0OiBidWZmZXIuc2xpY2UoZmlsZUNvbW1lbnRTdGFydCwgZmlsZUNvbW1lbnRTdGFydCArIGVudHJ5LmZpbGVDb21tZW50TGVuZ3RoKTtcblx0XHRcdC8vIGNvbXBhdGliaWxpdHkgaGFjayBmb3IgaHR0cHM6Ly9naXRodWIuY29tL3RoZWpvc2h3b2xmZS95YXV6bC9pc3N1ZXMvNDdcblx0XHRcdGVudHJ5LmNvbW1lbnQgPSBlbnRyeS5maWxlQ29tbWVudDtcblxuXHRcdFx0c2VsZi5yZWFkRW50cnlDdXJzb3IgKz0gYnVmZmVyLmxlbmd0aDtcblx0XHRcdHNlbGYuZW50cmllc1JlYWQgKz0gMTtcblxuXHRcdFx0aWYgKGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPT09IDB4ZmZmZmZmZmYgfHxcblx0XHRcdFx0ZW50cnkuY29tcHJlc3NlZFNpemUgPT09IDB4ZmZmZmZmZmYgfHxcblx0XHRcdFx0ZW50cnkucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyID09PSAweGZmZmZmZmZmKSB7XG5cdFx0XHRcdC8vIFpJUDY0IGZvcm1hdFxuXHRcdFx0XHQvLyBmaW5kIHRoZSBaaXA2NCBFeHRlbmRlZCBJbmZvcm1hdGlvbiBFeHRyYSBGaWVsZFxuXHRcdFx0XHR2YXIgemlwNjRFaWVmQnVmZmVyID0gbnVsbDtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyeS5leHRyYUZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBleHRyYUZpZWxkID0gZW50cnkuZXh0cmFGaWVsZHNbaV07XG5cdFx0XHRcdFx0aWYgKGV4dHJhRmllbGQuaWQgPT09IDB4MDAwMSkge1xuXHRcdFx0XHRcdFx0emlwNjRFaWVmQnVmZmVyID0gZXh0cmFGaWVsZC5kYXRhO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh6aXA2NEVpZWZCdWZmZXIgPT0gbnVsbCkge1xuXHRcdFx0XHRcdHJldHVybiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgbmV3IEVycm9yKFwiZXhwZWN0ZWQgemlwNjQgZXh0ZW5kZWQgaW5mb3JtYXRpb24gZXh0cmEgZmllbGRcIikpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBpbmRleCA9IDA7XG5cdFx0XHRcdC8vIDAgLSBPcmlnaW5hbCBTaXplICAgICAgICAgIDggYnl0ZXNcblx0XHRcdFx0aWYgKGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPT09IDB4ZmZmZmZmZmYpIHtcblx0XHRcdFx0XHRpZiAoaW5kZXggKyA4ID4gemlwNjRFaWVmQnVmZmVyLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJ6aXA2NCBleHRlbmRlZCBpbmZvcm1hdGlvbiBleHRyYSBmaWVsZCBkb2VzIG5vdCBpbmNsdWRlIHVuY29tcHJlc3NlZCBzaXplXCIpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9IHJlYWRVSW50NjRMRSh6aXA2NEVpZWZCdWZmZXIsIGluZGV4KTtcblx0XHRcdFx0XHRpbmRleCArPSA4O1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIDggLSBDb21wcmVzc2VkIFNpemUgICAgICAgIDggYnl0ZXNcblx0XHRcdFx0aWYgKGVudHJ5LmNvbXByZXNzZWRTaXplID09PSAweGZmZmZmZmZmKSB7XG5cdFx0XHRcdFx0aWYgKGluZGV4ICsgOCA+IHppcDY0RWllZkJ1ZmZlci5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiBlbWl0RXJyb3JBbmRBdXRvQ2xvc2Uoc2VsZiwgbmV3IEVycm9yKFwiemlwNjQgZXh0ZW5kZWQgaW5mb3JtYXRpb24gZXh0cmEgZmllbGQgZG9lcyBub3QgaW5jbHVkZSBjb21wcmVzc2VkIHNpemVcIikpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbnRyeS5jb21wcmVzc2VkU2l6ZSA9IHJlYWRVSW50NjRMRSh6aXA2NEVpZWZCdWZmZXIsIGluZGV4KTtcblx0XHRcdFx0XHRpbmRleCArPSA4O1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIDE2IC0gUmVsYXRpdmUgSGVhZGVyIE9mZnNldCA4IGJ5dGVzXG5cdFx0XHRcdGlmIChlbnRyeS5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPT09IDB4ZmZmZmZmZmYpIHtcblx0XHRcdFx0XHRpZiAoaW5kZXggKyA4ID4gemlwNjRFaWVmQnVmZmVyLmxlbmd0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGVtaXRFcnJvckFuZEF1dG9DbG9zZShzZWxmLCBuZXcgRXJyb3IoXCJ6aXA2NCBleHRlbmRlZCBpbmZvcm1hdGlvbiBleHRyYSBmaWVsZCBkb2VzIG5vdCBpbmNsdWRlIHJlbGF0aXZlIGhlYWRlciBvZmZzZXRcIikpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbnRyeS5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPSByZWFkVUludDY0TEUoemlwNjRFaWVmQnVmZmVyLCBpbmRleCk7XG5cdFx0XHRcdFx0aW5kZXggKz0gODtcblx0XHRcdFx0fVxuXHRcdFx0XHQvLyAyNCAtIERpc2sgU3RhcnQgTnVtYmVyICAgICAgNCBieXRlc1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBjaGVjayBmb3IgSW5mby1aSVAgVW5pY29kZSBQYXRoIEV4dHJhIEZpZWxkICgweDcwNzUpXG5cdFx0XHQvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL3RoZWpvc2h3b2xmZS95YXV6bC9pc3N1ZXMvMzNcblx0XHRcdGlmIChzZWxmLmRlY29kZVN0cmluZ3MpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyeS5leHRyYUZpZWxkcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRcdHZhciBleHRyYUZpZWxkID0gZW50cnkuZXh0cmFGaWVsZHNbaV07XG5cdFx0XHRcdFx0aWYgKGV4dHJhRmllbGQuaWQgPT09IDB4NzA3NSkge1xuXHRcdFx0XHRcdFx0aWYgKGV4dHJhRmllbGQuZGF0YS5sZW5ndGggPCA2KSB7XG5cdFx0XHRcdFx0XHRcdC8vIHRvbyBzaG9ydCB0byBiZSBtZWFuaW5nZnVsXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gVmVyc2lvbiAgICAgICAxIGJ5dGUgICAgICB2ZXJzaW9uIG9mIHRoaXMgZXh0cmEgZmllbGQsIGN1cnJlbnRseSAxXG5cdFx0XHRcdFx0XHRpZiAoZXh0cmFGaWVsZC5kYXRhLnJlYWRVSW50OCgwKSAhPT0gMSkge1xuXHRcdFx0XHRcdFx0XHQvLyA+IENoYW5nZXMgbWF5IG5vdCBiZSBiYWNrd2FyZCBjb21wYXRpYmxlIHNvIHRoaXMgZXh0cmFcblx0XHRcdFx0XHRcdFx0Ly8gPiBmaWVsZCBzaG91bGQgbm90IGJlIHVzZWQgaWYgdGhlIHZlcnNpb24gaXMgbm90IHJlY29nbml6ZWQuXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gTmFtZUNSQzMyICAgICA0IGJ5dGVzICAgICBGaWxlIE5hbWUgRmllbGQgQ1JDMzIgQ2hlY2tzdW1cblx0XHRcdFx0XHRcdHZhciBvbGROYW1lQ3JjMzIgPSBleHRyYUZpZWxkLmRhdGEucmVhZFVJbnQzMkxFKDEpO1xuXHRcdFx0XHRcdFx0aWYgKGNyYzMyLnVuc2lnbmVkKGJ1ZmZlci5zbGljZSgwLCBlbnRyeS5maWxlTmFtZUxlbmd0aCkpICE9PSBvbGROYW1lQ3JjMzIpIHtcblx0XHRcdFx0XHRcdFx0Ly8gPiBJZiB0aGUgQ1JDIGNoZWNrIGZhaWxzLCB0aGlzIFVURi04IFBhdGggRXh0cmEgRmllbGQgc2hvdWxkIGJlXG5cdFx0XHRcdFx0XHRcdC8vID4gaWdub3JlZCBhbmQgdGhlIEZpbGUgTmFtZSBmaWVsZCBpbiB0aGUgaGVhZGVyIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gVW5pY29kZU5hbWUgICBWYXJpYWJsZSAgICBVVEYtOCB2ZXJzaW9uIG9mIHRoZSBlbnRyeSBGaWxlIE5hbWVcblx0XHRcdFx0XHRcdGVudHJ5LmZpbGVOYW1lID0gZGVjb2RlQnVmZmVyKGV4dHJhRmllbGQuZGF0YSwgNSwgZXh0cmFGaWVsZC5kYXRhLmxlbmd0aCwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0Ly8gdmFsaWRhdGUgZmlsZSBzaXplXG5cdFx0XHRpZiAoc2VsZi52YWxpZGF0ZUVudHJ5U2l6ZXMgJiYgZW50cnkuY29tcHJlc3Npb25NZXRob2QgPT09IDApIHtcblx0XHRcdFx0dmFyIGV4cGVjdGVkQ29tcHJlc3NlZFNpemUgPSBlbnRyeS51bmNvbXByZXNzZWRTaXplO1xuXHRcdFx0XHRpZiAoZW50cnkuaXNFbmNyeXB0ZWQoKSkge1xuXHRcdFx0XHRcdC8vIHRyYWRpdGlvbmFsIGVuY3J5cHRpb24gcHJlZml4ZXMgdGhlIGZpbGUgZGF0YSB3aXRoIGEgaGVhZGVyXG5cdFx0XHRcdFx0ZXhwZWN0ZWRDb21wcmVzc2VkU2l6ZSArPSAxMjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZW50cnkuY29tcHJlc3NlZFNpemUgIT09IGV4cGVjdGVkQ29tcHJlc3NlZFNpemUpIHtcblx0XHRcdFx0XHR2YXIgbXNnID0gXCJjb21wcmVzc2VkL3VuY29tcHJlc3NlZCBzaXplIG1pc21hdGNoIGZvciBzdG9yZWQgZmlsZTogXCIgKyBlbnRyeS5jb21wcmVzc2VkU2l6ZSArIFwiICE9IFwiICsgZW50cnkudW5jb21wcmVzc2VkU2l6ZTtcblx0XHRcdFx0XHRyZXR1cm4gZW1pdEVycm9yQW5kQXV0b0Nsb3NlKHNlbGYsIG5ldyBFcnJvcihtc2cpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2VsZi5kZWNvZGVTdHJpbmdzKSB7XG5cdFx0XHRcdGlmICghc2VsZi5zdHJpY3RGaWxlTmFtZXMpIHtcblx0XHRcdFx0XHQvLyBhbGxvdyBiYWNrc2xhc2hcblx0XHRcdFx0XHRlbnRyeS5maWxlTmFtZSA9IGVudHJ5LmZpbGVOYW1lLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBlcnJvck1lc3NhZ2UgPSB2YWxpZGF0ZUZpbGVOYW1lKGVudHJ5LmZpbGVOYW1lLCBzZWxmLnZhbGlkYXRlRmlsZU5hbWVPcHRpb25zKTtcblx0XHRcdFx0aWYgKGVycm9yTWVzc2FnZSAhPSBudWxsKSByZXR1cm4gZW1pdEVycm9yQW5kQXV0b0Nsb3NlKHNlbGYsIG5ldyBFcnJvcihlcnJvck1lc3NhZ2UpKTtcblx0XHRcdH1cblx0XHRcdHNlbGYuZW1pdChcImVudHJ5XCIsIGVudHJ5KTtcblxuXHRcdFx0aWYgKCFzZWxmLmxhenlFbnRyaWVzKSBzZWxmLl9yZWFkRW50cnkoKTtcblx0XHR9KTtcblx0fSk7XG59O1xuXG5aaXBGaWxlLnByb3RvdHlwZS5vcGVuUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChlbnRyeSwgb3B0aW9ucywgY2FsbGJhY2spIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHQvLyBwYXJhbWV0ZXIgdmFsaWRhdGlvblxuXHR2YXIgcmVsYXRpdmVTdGFydCA9IDA7XG5cdHZhciByZWxhdGl2ZUVuZCA9IGVudHJ5LmNvbXByZXNzZWRTaXplO1xuXHRpZiAoY2FsbGJhY2sgPT0gbnVsbCkge1xuXHRcdGNhbGxiYWNrID0gb3B0aW9ucztcblx0XHRvcHRpb25zID0ge307XG5cdH0gZWxzZSB7XG5cdFx0Ly8gdmFsaWRhdGUgb3B0aW9ucyB0aGF0IHRoZSBjYWxsZXIgaGFzIG5vIGV4Y3VzZSB0byBnZXQgd3Jvbmdcblx0XHRpZiAob3B0aW9ucy5kZWNyeXB0ICE9IG51bGwpIHtcblx0XHRcdGlmICghZW50cnkuaXNFbmNyeXB0ZWQoKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLmRlY3J5cHQgY2FuIG9ubHkgYmUgc3BlY2lmaWVkIGZvciBlbmNyeXB0ZWQgZW50cmllc1wiKTtcblx0XHRcdH1cblx0XHRcdGlmIChvcHRpb25zLmRlY3J5cHQgIT09IGZhbHNlKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIG9wdGlvbnMuZGVjcnlwdCB2YWx1ZTogXCIgKyBvcHRpb25zLmRlY3J5cHQpO1xuXHRcdFx0aWYgKGVudHJ5LmlzQ29tcHJlc3NlZCgpKSB7XG5cdFx0XHRcdGlmIChvcHRpb25zLmRlY29tcHJlc3MgIT09IGZhbHNlKSB0aHJvdyBuZXcgRXJyb3IoXCJlbnRyeSBpcyBlbmNyeXB0ZWQgYW5kIGNvbXByZXNzZWQsIGFuZCBvcHRpb25zLmRlY29tcHJlc3MgIT09IGZhbHNlXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAob3B0aW9ucy5kZWNvbXByZXNzICE9IG51bGwpIHtcblx0XHRcdGlmICghZW50cnkuaXNDb21wcmVzc2VkKCkpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucy5kZWNvbXByZXNzIGNhbiBvbmx5IGJlIHNwZWNpZmllZCBmb3IgY29tcHJlc3NlZCBlbnRyaWVzXCIpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKCEob3B0aW9ucy5kZWNvbXByZXNzID09PSBmYWxzZSB8fCBvcHRpb25zLmRlY29tcHJlc3MgPT09IHRydWUpKSB7XG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcihcImludmFsaWQgb3B0aW9ucy5kZWNvbXByZXNzIHZhbHVlOiBcIiArIG9wdGlvbnMuZGVjb21wcmVzcyk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChvcHRpb25zLnN0YXJ0ICE9IG51bGwgfHwgb3B0aW9ucy5lbmQgIT0gbnVsbCkge1xuXHRcdFx0aWYgKGVudHJ5LmlzQ29tcHJlc3NlZCgpICYmIG9wdGlvbnMuZGVjb21wcmVzcyAhPT0gZmFsc2UpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic3RhcnQvZW5kIHJhbmdlIG5vdCBhbGxvd2VkIGZvciBjb21wcmVzc2VkIGVudHJ5IHdpdGhvdXQgb3B0aW9ucy5kZWNvbXByZXNzID09PSBmYWxzZVwiKTtcblx0XHRcdH1cblx0XHRcdGlmIChlbnRyeS5pc0VuY3J5cHRlZCgpICYmIG9wdGlvbnMuZGVjcnlwdCAhPT0gZmFsc2UpIHtcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFwic3RhcnQvZW5kIHJhbmdlIG5vdCBhbGxvd2VkIGZvciBlbmNyeXB0ZWQgZW50cnkgd2l0aG91dCBvcHRpb25zLmRlY3J5cHQgPT09IGZhbHNlXCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAob3B0aW9ucy5zdGFydCAhPSBudWxsKSB7XG5cdFx0XHRyZWxhdGl2ZVN0YXJ0ID0gb3B0aW9ucy5zdGFydDtcblx0XHRcdGlmIChyZWxhdGl2ZVN0YXJ0IDwgMCkgdGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucy5zdGFydCA8IDBcIik7XG5cdFx0XHRpZiAocmVsYXRpdmVTdGFydCA+IGVudHJ5LmNvbXByZXNzZWRTaXplKSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLnN0YXJ0ID4gZW50cnkuY29tcHJlc3NlZFNpemVcIik7XG5cdFx0fVxuXHRcdGlmIChvcHRpb25zLmVuZCAhPSBudWxsKSB7XG5cdFx0XHRyZWxhdGl2ZUVuZCA9IG9wdGlvbnMuZW5kO1xuXHRcdFx0aWYgKHJlbGF0aXZlRW5kIDwgMCkgdGhyb3cgbmV3IEVycm9yKFwib3B0aW9ucy5lbmQgPCAwXCIpO1xuXHRcdFx0aWYgKHJlbGF0aXZlRW5kID4gZW50cnkuY29tcHJlc3NlZFNpemUpIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMuZW5kID4gZW50cnkuY29tcHJlc3NlZFNpemVcIik7XG5cdFx0XHRpZiAocmVsYXRpdmVFbmQgPCByZWxhdGl2ZVN0YXJ0KSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLmVuZCA8IG9wdGlvbnMuc3RhcnRcIik7XG5cdFx0fVxuXHR9XG5cdC8vIGFueSBmdXJ0aGVyIGVycm9ycyBjYW4gZWl0aGVyIGJlIGNhdXNlZCBieSB0aGUgemlwZmlsZSxcblx0Ly8gb3Igd2VyZSBpbnRyb2R1Y2VkIGluIGEgbWlub3IgdmVyc2lvbiBvZiB5YXV6bCxcblx0Ly8gc28gc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgY2xpZW50IHJhdGhlciB0aGFuIHRocm93bi5cblx0aWYgKCFzZWxmLmlzT3BlbikgcmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcImNsb3NlZFwiKSk7XG5cdGlmIChlbnRyeS5pc0VuY3J5cHRlZCgpKSB7XG5cdFx0aWYgKG9wdGlvbnMuZGVjcnlwdCAhPT0gZmFsc2UpIHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJlbnRyeSBpcyBlbmNyeXB0ZWQsIGFuZCBvcHRpb25zLmRlY3J5cHQgIT09IGZhbHNlXCIpKTtcblx0fVxuXHQvLyBtYWtlIHN1cmUgd2UgZG9uJ3QgbG9zZSB0aGUgZmQgYmVmb3JlIHdlIG9wZW4gdGhlIGFjdHVhbCByZWFkIHN0cmVhbVxuXHRzZWxmLnJlYWRlci5yZWYoKTtcblx0dmFyIGJ1ZmZlciA9IG5ld0J1ZmZlcigzMCk7XG5cdHJlYWRBbmRBc3NlcnROb0VvZihzZWxmLnJlYWRlciwgYnVmZmVyLCAwLCBidWZmZXIubGVuZ3RoLCBlbnRyeS5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHR0cnkge1xuXHRcdFx0aWYgKGVycikgcmV0dXJuIGNhbGxiYWNrKGVycik7XG5cdFx0XHQvLyAwIC0gTG9jYWwgZmlsZSBoZWFkZXIgc2lnbmF0dXJlID0gMHgwNDAzNGI1MFxuXHRcdFx0dmFyIHNpZ25hdHVyZSA9IGJ1ZmZlci5yZWFkVUludDMyTEUoMCk7XG5cdFx0XHRpZiAoc2lnbmF0dXJlICE9PSAweDA0MDM0YjUwKSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJpbnZhbGlkIGxvY2FsIGZpbGUgaGVhZGVyIHNpZ25hdHVyZTogMHhcIiArIHNpZ25hdHVyZS50b1N0cmluZygxNikpKTtcblx0XHRcdH1cblx0XHRcdC8vIGFsbCB0aGlzIHNob3VsZCBiZSByZWR1bmRhbnRcblx0XHRcdC8vIDQgLSBWZXJzaW9uIG5lZWRlZCB0byBleHRyYWN0IChtaW5pbXVtKVxuXHRcdFx0Ly8gNiAtIEdlbmVyYWwgcHVycG9zZSBiaXQgZmxhZ1xuXHRcdFx0Ly8gOCAtIENvbXByZXNzaW9uIG1ldGhvZFxuXHRcdFx0Ly8gMTAgLSBGaWxlIGxhc3QgbW9kaWZpY2F0aW9uIHRpbWVcblx0XHRcdC8vIDEyIC0gRmlsZSBsYXN0IG1vZGlmaWNhdGlvbiBkYXRlXG5cdFx0XHQvLyAxNCAtIENSQy0zMlxuXHRcdFx0Ly8gMTggLSBDb21wcmVzc2VkIHNpemVcblx0XHRcdC8vIDIyIC0gVW5jb21wcmVzc2VkIHNpemVcblx0XHRcdC8vIDI2IC0gRmlsZSBuYW1lIGxlbmd0aCAobilcblx0XHRcdHZhciBmaWxlTmFtZUxlbmd0aCA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMjYpO1xuXHRcdFx0Ly8gMjggLSBFeHRyYSBmaWVsZCBsZW5ndGggKG0pXG5cdFx0XHR2YXIgZXh0cmFGaWVsZExlbmd0aCA9IGJ1ZmZlci5yZWFkVUludDE2TEUoMjgpO1xuXHRcdFx0Ly8gMzAgLSBGaWxlIG5hbWVcblx0XHRcdC8vIDMwK24gLSBFeHRyYSBmaWVsZFxuXHRcdFx0dmFyIGxvY2FsRmlsZUhlYWRlckVuZCA9IGVudHJ5LnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciArIGJ1ZmZlci5sZW5ndGggKyBmaWxlTmFtZUxlbmd0aCArIGV4dHJhRmllbGRMZW5ndGg7XG5cdFx0XHR2YXIgZGVjb21wcmVzcztcblx0XHRcdGlmIChlbnRyeS5jb21wcmVzc2lvbk1ldGhvZCA9PT0gMCkge1xuXHRcdFx0XHQvLyAwIC0gVGhlIGZpbGUgaXMgc3RvcmVkIChubyBjb21wcmVzc2lvbilcblx0XHRcdFx0ZGVjb21wcmVzcyA9IGZhbHNlO1xuXHRcdFx0fSBlbHNlIGlmIChlbnRyeS5jb21wcmVzc2lvbk1ldGhvZCA9PT0gOCkge1xuXHRcdFx0XHQvLyA4IC0gVGhlIGZpbGUgaXMgRGVmbGF0ZWRcblx0XHRcdFx0ZGVjb21wcmVzcyA9IG9wdGlvbnMuZGVjb21wcmVzcyAhPSBudWxsID8gb3B0aW9ucy5kZWNvbXByZXNzIDogdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJ1bnN1cHBvcnRlZCBjb21wcmVzc2lvbiBtZXRob2Q6IFwiICsgZW50cnkuY29tcHJlc3Npb25NZXRob2QpKTtcblx0XHRcdH1cblx0XHRcdHZhciBmaWxlRGF0YVN0YXJ0ID0gbG9jYWxGaWxlSGVhZGVyRW5kO1xuXHRcdFx0dmFyIGZpbGVEYXRhRW5kID0gZmlsZURhdGFTdGFydCArIGVudHJ5LmNvbXByZXNzZWRTaXplO1xuXHRcdFx0aWYgKGVudHJ5LmNvbXByZXNzZWRTaXplICE9PSAwKSB7XG5cdFx0XHRcdC8vIGJvdW5kcyBjaGVjayBub3csIGJlY2F1c2UgdGhlIHJlYWQgc3RyZWFtcyB3aWxsIHByb2JhYmx5IG5vdCBjb21wbGFpbiBsb3VkIGVub3VnaC5cblx0XHRcdFx0Ly8gc2luY2Ugd2UncmUgZGVhbGluZyB3aXRoIGFuIHVuc2lnbmVkIG9mZnNldCBwbHVzIGFuIHVuc2lnbmVkIHNpemUsXG5cdFx0XHRcdC8vIHdlIG9ubHkgaGF2ZSAxIHRoaW5nIHRvIGNoZWNrIGZvci5cblx0XHRcdFx0aWYgKGZpbGVEYXRhRW5kID4gc2VsZi5maWxlU2l6ZSkge1xuXHRcdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJmaWxlIGRhdGEgb3ZlcmZsb3dzIGZpbGUgYm91bmRzOiBcIiArXG5cdFx0XHRcdFx0XHRmaWxlRGF0YVN0YXJ0ICsgXCIgKyBcIiArIGVudHJ5LmNvbXByZXNzZWRTaXplICsgXCIgPiBcIiArIHNlbGYuZmlsZVNpemUpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dmFyIHJlYWRTdHJlYW0gPSBzZWxmLnJlYWRlci5jcmVhdGVSZWFkU3RyZWFtKHtcblx0XHRcdFx0c3RhcnQ6IGZpbGVEYXRhU3RhcnQgKyByZWxhdGl2ZVN0YXJ0LFxuXHRcdFx0XHRlbmQ6IGZpbGVEYXRhU3RhcnQgKyByZWxhdGl2ZUVuZCxcblx0XHRcdH0pO1xuXHRcdFx0dmFyIGVuZHBvaW50U3RyZWFtID0gcmVhZFN0cmVhbTtcblx0XHRcdGlmIChkZWNvbXByZXNzKSB7XG5cdFx0XHRcdHZhciBkZXN0cm95ZWQgPSBmYWxzZTtcblx0XHRcdFx0dmFyIGluZmxhdGVGaWx0ZXIgPSB6bGliLmNyZWF0ZUluZmxhdGVSYXcoKTtcblx0XHRcdFx0cmVhZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdFx0XHQvLyBzZXRJbW1lZGlhdGUgaGVyZSBiZWNhdXNlIGVycm9ycyBjYW4gYmUgZW1pdHRlZCBkdXJpbmcgdGhlIGZpcnN0IGNhbGwgdG8gcGlwZSgpXG5cdFx0XHRcdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0XHRcdGlmICghZGVzdHJveWVkKSBpbmZsYXRlRmlsdGVyLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0cmVhZFN0cmVhbS5waXBlKGluZmxhdGVGaWx0ZXIpO1xuXG5cdFx0XHRcdGlmIChzZWxmLnZhbGlkYXRlRW50cnlTaXplcykge1xuXHRcdFx0XHRcdGVuZHBvaW50U3RyZWFtID0gbmV3IEFzc2VydEJ5dGVDb3VudFN0cmVhbShlbnRyeS51bmNvbXByZXNzZWRTaXplKTtcblx0XHRcdFx0XHRpbmZsYXRlRmlsdGVyLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRcdFx0Ly8gZm9yd2FyZCB6bGliIGVycm9ycyB0byB0aGUgY2xpZW50LXZpc2libGUgc3RyZWFtXG5cdFx0XHRcdFx0XHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIWRlc3Ryb3llZCkgZW5kcG9pbnRTdHJlYW0uZW1pdChcImVycm9yXCIsIGVycik7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRpbmZsYXRlRmlsdGVyLnBpcGUoZW5kcG9pbnRTdHJlYW0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIHRoZSB6bGliIGZpbHRlciBpcyB0aGUgY2xpZW50LXZpc2libGUgc3RyZWFtXG5cdFx0XHRcdFx0ZW5kcG9pbnRTdHJlYW0gPSBpbmZsYXRlRmlsdGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIHRoaXMgaXMgcGFydCBvZiB5YXV6bCdzIEFQSSwgc28gaW1wbGVtZW50IHRoaXMgZnVuY3Rpb24gb24gdGhlIGNsaWVudC12aXNpYmxlIHN0cmVhbVxuXHRcdFx0XHRlbmRwb2ludFN0cmVhbS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdGRlc3Ryb3llZCA9IHRydWU7XG5cdFx0XHRcdFx0aWYgKGluZmxhdGVGaWx0ZXIgIT09IGVuZHBvaW50U3RyZWFtKSBpbmZsYXRlRmlsdGVyLnVucGlwZShlbmRwb2ludFN0cmVhbSk7XG5cdFx0XHRcdFx0cmVhZFN0cmVhbS51bnBpcGUoaW5mbGF0ZUZpbHRlcik7XG5cdFx0XHRcdFx0Ly8gVE9ETzogdGhlIGluZmxhdGVGaWx0ZXIgbWF5IGNhdXNlIGEgbWVtb3J5IGxlYWsuIHNlZSBJc3N1ZSAjMjcuXG5cdFx0XHRcdFx0cmVhZFN0cmVhbS5kZXN0cm95KCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjayhudWxsLCBlbmRwb2ludFN0cmVhbSk7XG5cdFx0fSBmaW5hbGx5IHtcblx0XHRcdHNlbGYucmVhZGVyLnVucmVmKCk7XG5cdFx0fVxuXHR9KTtcbn07XG5cbmZ1bmN0aW9uIEVudHJ5KCkge1xufVxuXG5FbnRyeS5wcm90b3R5cGUuZ2V0TGFzdE1vZERhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBkb3NEYXRlVGltZVRvRGF0ZSh0aGlzLmxhc3RNb2RGaWxlRGF0ZSwgdGhpcy5sYXN0TW9kRmlsZVRpbWUpO1xufTtcbkVudHJ5LnByb3RvdHlwZS5pc0VuY3J5cHRlZCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuICh0aGlzLmdlbmVyYWxQdXJwb3NlQml0RmxhZyAmIDB4MSkgIT09IDA7XG59O1xuRW50cnkucHJvdG90eXBlLmlzQ29tcHJlc3NlZCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuY29tcHJlc3Npb25NZXRob2QgPT09IDg7XG59O1xuXG5mdW5jdGlvbiBkb3NEYXRlVGltZVRvRGF0ZShkYXRlLCB0aW1lKSB7XG5cdHZhciBkYXkgPSBkYXRlICYgMHgxZjsgLy8gMS0zMVxuXHR2YXIgbW9udGggPSAoZGF0ZSA+PiA1ICYgMHhmKSAtIDE7IC8vIDEtMTIsIDAtMTFcblx0dmFyIHllYXIgPSAoZGF0ZSA+PiA5ICYgMHg3ZikgKyAxOTgwOyAvLyAwLTEyOCwgMTk4MC0yMTA4XG5cblx0dmFyIG1pbGxpc2Vjb25kID0gMDtcblx0dmFyIHNlY29uZCA9ICh0aW1lICYgMHgxZikgKiAyOyAvLyAwLTI5LCAwLTU4IChldmVuIG51bWJlcnMpXG5cdHZhciBtaW51dGUgPSB0aW1lID4+IDUgJiAweDNmOyAvLyAwLTU5XG5cdHZhciBob3VyID0gdGltZSA+PiAxMSAmIDB4MWY7IC8vIDAtMjNcblxuXHRyZXR1cm4gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSwgaG91ciwgbWludXRlLCBzZWNvbmQsIG1pbGxpc2Vjb25kKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVGaWxlTmFtZShmaWxlTmFtZSkge1xuXHRpZiAoZmlsZU5hbWUuaW5kZXhPZihcIlxcXFxcIikgIT09IC0xKSB7XG5cdFx0cmV0dXJuIFwiaW52YWxpZCBjaGFyYWN0ZXJzIGluIGZpbGVOYW1lOiBcIiArIGZpbGVOYW1lO1xuXHR9XG5cdGlmICgvXlthLXpBLVpdOi8udGVzdChmaWxlTmFtZSkgfHwgL15cXC8vLnRlc3QoZmlsZU5hbWUpKSB7XG5cdFx0cmV0dXJuIFwiYWJzb2x1dGUgcGF0aDogXCIgKyBmaWxlTmFtZTtcblx0fVxuXHRpZiAoZmlsZU5hbWUuc3BsaXQoXCIvXCIpLmluZGV4T2YoXCIuLlwiKSAhPT0gLTEpIHtcblx0XHRyZXR1cm4gXCJpbnZhbGlkIHJlbGF0aXZlIHBhdGg6IFwiICsgZmlsZU5hbWU7XG5cdH1cblx0Ly8gYWxsIGdvb2Rcblx0cmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlYWRBbmRBc3NlcnROb0VvZihyZWFkZXIsIGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBjYWxsYmFjaykge1xuXHRpZiAobGVuZ3RoID09PSAwKSB7XG5cdFx0Ly8gZnMucmVhZCB3aWxsIHRocm93IGFuIG91dC1vZi1ib3VuZHMgZXJyb3IgaWYgeW91IHRyeSB0byByZWFkIDAgYnl0ZXMgZnJvbSBhIDAgYnl0ZSBmaWxlXG5cdFx0cmV0dXJuIHNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRjYWxsYmFjayhudWxsLCBuZXdCdWZmZXIoMCkpO1xuXHRcdH0pO1xuXHR9XG5cdHJlYWRlci5yZWFkKGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIHBvc2l0aW9uLCBmdW5jdGlvbiAoZXJyLCBieXRlc1JlYWQpIHtcblx0XHRpZiAoZXJyKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcblx0XHRpZiAoYnl0ZXNSZWFkIDwgbGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKFwidW5leHBlY3RlZCBFT0ZcIikpO1xuXHRcdH1cblx0XHRjYWxsYmFjaygpO1xuXHR9KTtcbn1cblxudXRpbC5pbmhlcml0cyhBc3NlcnRCeXRlQ291bnRTdHJlYW0sIFRyYW5zZm9ybSk7XG5cbmZ1bmN0aW9uIEFzc2VydEJ5dGVDb3VudFN0cmVhbShieXRlQ291bnQpIHtcblx0VHJhbnNmb3JtLmNhbGwodGhpcyk7XG5cdHRoaXMuYWN0dWFsQnl0ZUNvdW50ID0gMDtcblx0dGhpcy5leHBlY3RlZEJ5dGVDb3VudCA9IGJ5dGVDb3VudDtcbn1cblxuQXNzZXJ0Qnl0ZUNvdW50U3RyZWFtLnByb3RvdHlwZS5fdHJhbnNmb3JtID0gZnVuY3Rpb24gKGNodW5rLCBlbmNvZGluZywgY2IpIHtcblx0dGhpcy5hY3R1YWxCeXRlQ291bnQgKz0gY2h1bmsubGVuZ3RoO1xuXHRpZiAodGhpcy5hY3R1YWxCeXRlQ291bnQgPiB0aGlzLmV4cGVjdGVkQnl0ZUNvdW50KSB7XG5cdFx0dmFyIG1zZyA9IFwidG9vIG1hbnkgYnl0ZXMgaW4gdGhlIHN0cmVhbS4gZXhwZWN0ZWQgXCIgKyB0aGlzLmV4cGVjdGVkQnl0ZUNvdW50ICsgXCIuIGdvdCBhdCBsZWFzdCBcIiArIHRoaXMuYWN0dWFsQnl0ZUNvdW50O1xuXHRcdHJldHVybiBjYihuZXcgRXJyb3IobXNnKSk7XG5cdH1cblx0Y2IobnVsbCwgY2h1bmspO1xufTtcbkFzc2VydEJ5dGVDb3VudFN0cmVhbS5wcm90b3R5cGUuX2ZsdXNoID0gZnVuY3Rpb24gKGNiKSB7XG5cdGlmICh0aGlzLmFjdHVhbEJ5dGVDb3VudCA8IHRoaXMuZXhwZWN0ZWRCeXRlQ291bnQpIHtcblx0XHR2YXIgbXNnID0gXCJub3QgZW5vdWdoIGJ5dGVzIGluIHRoZSBzdHJlYW0uIGV4cGVjdGVkIFwiICsgdGhpcy5leHBlY3RlZEJ5dGVDb3VudCArIFwiLiBnb3Qgb25seSBcIiArIHRoaXMuYWN0dWFsQnl0ZUNvdW50O1xuXHRcdHJldHVybiBjYihuZXcgRXJyb3IobXNnKSk7XG5cdH1cblx0Y2IoKTtcbn07XG5cbnV0aWwuaW5oZXJpdHMoUmFuZG9tQWNjZXNzUmVhZGVyLCBFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBSYW5kb21BY2Nlc3NSZWFkZXIoKSB7XG5cdEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXHR0aGlzLnJlZkNvdW50ID0gMDtcbn1cblxuUmFuZG9tQWNjZXNzUmVhZGVyLnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbiAoKSB7XG5cdHRoaXMucmVmQ291bnQgKz0gMTtcbn07XG5SYW5kb21BY2Nlc3NSZWFkZXIucHJvdG90eXBlLnVucmVmID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdHNlbGYucmVmQ291bnQgLT0gMTtcblxuXHRpZiAoc2VsZi5yZWZDb3VudCA+IDApIHJldHVybjtcblx0aWYgKHNlbGYucmVmQ291bnQgPCAwKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHVucmVmXCIpO1xuXG5cdHNlbGYuY2xvc2Uob25DbG9zZURvbmUpO1xuXG5cdGZ1bmN0aW9uIG9uQ2xvc2VEb25lKGVycikge1xuXHRcdGlmIChlcnIpIHJldHVybiBzZWxmLmVtaXQoJ2Vycm9yJywgZXJyKTtcblx0XHRzZWxmLmVtaXQoJ2Nsb3NlJyk7XG5cdH1cbn07XG5SYW5kb21BY2Nlc3NSZWFkZXIucHJvdG90eXBlLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHR2YXIgc3RhcnQgPSBvcHRpb25zLnN0YXJ0O1xuXHR2YXIgZW5kID0gb3B0aW9ucy5lbmQ7XG5cdGlmIChzdGFydCA9PT0gZW5kKSB7XG5cdFx0dmFyIGVtcHR5U3RyZWFtID0gbmV3IFBhc3NUaHJvdWdoKCk7XG5cdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdGVtcHR5U3RyZWFtLmVuZCgpO1xuXHRcdH0pO1xuXHRcdHJldHVybiBlbXB0eVN0cmVhbTtcblx0fVxuXHR2YXIgc3RyZWFtID0gdGhpcy5fcmVhZFN0cmVhbUZvclJhbmdlKHN0YXJ0LCBlbmQpO1xuXG5cdHZhciBkZXN0cm95ZWQgPSBmYWxzZTtcblx0dmFyIHJlZlVucmVmRmlsdGVyID0gbmV3IFJlZlVucmVmRmlsdGVyKHRoaXMpO1xuXHRzdHJlYW0ub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0c2V0SW1tZWRpYXRlKGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmICghZGVzdHJveWVkKSByZWZVbnJlZkZpbHRlci5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblx0XHR9KTtcblx0fSk7XG5cdHJlZlVucmVmRmlsdGVyLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG5cdFx0c3RyZWFtLnVucGlwZShyZWZVbnJlZkZpbHRlcik7XG5cdFx0cmVmVW5yZWZGaWx0ZXIudW5yZWYoKTtcblx0XHRzdHJlYW0uZGVzdHJveSgpO1xuXHR9O1xuXG5cdHZhciBieXRlQ291bnRlciA9IG5ldyBBc3NlcnRCeXRlQ291bnRTdHJlYW0oZW5kIC0gc3RhcnQpO1xuXHRyZWZVbnJlZkZpbHRlci5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0aWYgKCFkZXN0cm95ZWQpIGJ5dGVDb3VudGVyLmVtaXQoXCJlcnJvclwiLCBlcnIpO1xuXHRcdH0pO1xuXHR9KTtcblx0Ynl0ZUNvdW50ZXIuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcblx0XHRkZXN0cm95ZWQgPSB0cnVlO1xuXHRcdHJlZlVucmVmRmlsdGVyLnVucGlwZShieXRlQ291bnRlcik7XG5cdFx0cmVmVW5yZWZGaWx0ZXIuZGVzdHJveSgpO1xuXHR9O1xuXG5cdHJldHVybiBzdHJlYW0ucGlwZShyZWZVbnJlZkZpbHRlcikucGlwZShieXRlQ291bnRlcik7XG59O1xuUmFuZG9tQWNjZXNzUmVhZGVyLnByb3RvdHlwZS5fcmVhZFN0cmVhbUZvclJhbmdlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcblx0dGhyb3cgbmV3IEVycm9yKFwibm90IGltcGxlbWVudGVkXCIpO1xufTtcblJhbmRvbUFjY2Vzc1JlYWRlci5wcm90b3R5cGUucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgbGVuZ3RoLCBwb3NpdGlvbiwgY2FsbGJhY2spIHtcblx0dmFyIHJlYWRTdHJlYW0gPSB0aGlzLmNyZWF0ZVJlYWRTdHJlYW0oe3N0YXJ0OiBwb3NpdGlvbiwgZW5kOiBwb3NpdGlvbiArIGxlbmd0aH0pO1xuXHR2YXIgd3JpdGVTdHJlYW0gPSBuZXcgV3JpdGFibGUoKTtcblx0dmFyIHdyaXR0ZW4gPSAwO1xuXHR3cml0ZVN0cmVhbS5fd3JpdGUgPSBmdW5jdGlvbiAoY2h1bmssIGVuY29kaW5nLCBjYikge1xuXHRcdGNodW5rLmNvcHkoYnVmZmVyLCBvZmZzZXQgKyB3cml0dGVuLCAwLCBjaHVuay5sZW5ndGgpO1xuXHRcdHdyaXR0ZW4gKz0gY2h1bmsubGVuZ3RoO1xuXHRcdGNiKCk7XG5cdH07XG5cdHdyaXRlU3RyZWFtLm9uKFwiZmluaXNoXCIsIGNhbGxiYWNrKTtcblx0cmVhZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnJvcikge1xuXHRcdGNhbGxiYWNrKGVycm9yKTtcblx0fSk7XG5cdHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XG59O1xuUmFuZG9tQWNjZXNzUmVhZGVyLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXHRzZXRJbW1lZGlhdGUoY2FsbGJhY2spO1xufTtcblxudXRpbC5pbmhlcml0cyhSZWZVbnJlZkZpbHRlciwgUGFzc1Rocm91Z2gpO1xuXG5mdW5jdGlvbiBSZWZVbnJlZkZpbHRlcihjb250ZXh0KSB7XG5cdFBhc3NUaHJvdWdoLmNhbGwodGhpcyk7XG5cdHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cdHRoaXMuY29udGV4dC5yZWYoKTtcblx0dGhpcy51bnJlZmZlZFlldCA9IGZhbHNlO1xufVxuXG5SZWZVbnJlZkZpbHRlci5wcm90b3R5cGUuX2ZsdXNoID0gZnVuY3Rpb24gKGNiKSB7XG5cdHRoaXMudW5yZWYoKTtcblx0Y2IoKTtcbn07XG5SZWZVbnJlZkZpbHRlci5wcm90b3R5cGUudW5yZWYgPSBmdW5jdGlvbiAoY2IpIHtcblx0aWYgKHRoaXMudW5yZWZmZWRZZXQpIHJldHVybjtcblx0dGhpcy51bnJlZmZlZFlldCA9IHRydWU7XG5cdHRoaXMuY29udGV4dC51bnJlZigpO1xufTtcblxudmFyIGNwNDM3ID0gJ1xcdTAwMDDimLrimLvimaXimabimaPimaDigKLil5jil4vil5nimYLimYDimarimavimLzilrril4TihpXigLzCtsKn4pas4oao4oaR4oaT4oaS4oaQ4oif4oaU4pay4pa8ICFcIiMkJSZcXCcoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXFxcXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7ijILDh8O8w6nDosOkw6DDpcOnw6rDq8Oow6/DrsOsw4TDhcOJw6bDhsO0w7bDssO7w7nDv8OWw5zCosKjwqXigqfGksOhw63Ds8O6w7HDkcKqwrrCv+KMkMKswr3CvMKhwqvCu+KWkeKWkuKWk+KUguKUpOKVoeKVouKVluKVleKVo+KVkeKVl+KVneKVnOKVm+KUkOKUlOKUtOKUrOKUnOKUgOKUvOKVnuKVn+KVmuKVlOKVqeKVpuKVoOKVkOKVrOKVp+KVqOKVpOKVpeKVmeKVmOKVkuKVk+KVq+KVquKUmOKUjOKWiOKWhOKWjOKWkOKWgM6xw5/Ok8+AzqPPg8K1z4TOps6YzqnOtOKIns+GzrXiiKniiaHCseKJpeKJpOKMoOKMocO34omIwrDiiJnCt+KImuKBv8Ky4pagwqAnO1xuXG5mdW5jdGlvbiBkZWNvZGVCdWZmZXIoYnVmZmVyLCBzdGFydCwgZW5kLCBpc1V0ZjgpIHtcblx0aWYgKGlzVXRmOCkge1xuXHRcdHJldHVybiBidWZmZXIudG9TdHJpbmcoXCJ1dGY4XCIsIHN0YXJ0LCBlbmQpO1xuXHR9IGVsc2Uge1xuXHRcdHZhciByZXN1bHQgPSBcIlwiO1xuXHRcdGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG5cdFx0XHRyZXN1bHQgKz0gY3A0MzdbYnVmZmVyW2ldXTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fVxufVxuXG5mdW5jdGlvbiByZWFkVUludDY0TEUoYnVmZmVyLCBvZmZzZXQpIHtcblx0Ly8gdGhlcmUgaXMgbm8gbmF0aXZlIGZ1bmN0aW9uIGZvciB0aGlzLCBiZWNhdXNlIHdlIGNhbid0IGFjdHVhbGx5IHN0b3JlIDY0LWJpdCBpbnRlZ2VycyBwcmVjaXNlbHkuXG5cdC8vIGFmdGVyIDUzIGJpdHMsIEphdmFTY3JpcHQncyBOdW1iZXIgdHlwZSAoSUVFRSA3NTQgZG91YmxlKSBjYW4ndCBzdG9yZSBpbmRpdmlkdWFsIGludGVnZXJzIGFueW1vcmUuXG5cdC8vIGJ1dCBzaW5jZSA1MyBiaXRzIGlzIGEgd2hvbGUgbG90IG1vcmUgdGhhbiAzMiBiaXRzLCB3ZSBkbyBvdXIgYmVzdCBhbnl3YXkuXG5cdHZhciBsb3dlcjMyID0gYnVmZmVyLnJlYWRVSW50MzJMRShvZmZzZXQpO1xuXHR2YXIgdXBwZXIzMiA9IGJ1ZmZlci5yZWFkVUludDMyTEUob2Zmc2V0ICsgNCk7XG5cdC8vIHdlIGNhbid0IHVzZSBiaXRzaGlmdGluZyBoZXJlLCBiZWNhdXNlIEphdmFTY3JpcHQgYml0c2hpZnRpbmcgb25seSB3b3JrcyBvbiAzMi1iaXQgaW50ZWdlcnMuXG5cdHJldHVybiB1cHBlcjMyICogMHgxMDAwMDAwMDAgKyBsb3dlcjMyO1xuXHQvLyBhcyBsb25nIGFzIHdlJ3JlIGJvdW5kcyBjaGVja2luZyB0aGUgcmVzdWx0IG9mIHRoaXMgZnVuY3Rpb24gYWdhaW5zdCB0aGUgdG90YWwgZmlsZSBzaXplLFxuXHQvLyB3ZSdsbCBjYXRjaCBhbnkgb3ZlcmZsb3cgZXJyb3JzLCBiZWNhdXNlIHdlIGFscmVhZHkgbWFkZSBzdXJlIHRoZSB0b3RhbCBmaWxlIHNpemUgd2FzIHdpdGhpbiByZWFzb24uXG59XG5cbi8vIE5vZGUgMTAgZGVwcmVjYXRlZCBuZXcgQnVmZmVyKCkuXG52YXIgbmV3QnVmZmVyO1xuaWYgKHR5cGVvZiBCdWZmZXIuYWxsb2NVbnNhZmUgPT09IFwiZnVuY3Rpb25cIikge1xuXHRuZXdCdWZmZXIgPSBmdW5jdGlvbiAobGVuKSB7XG5cdFx0cmV0dXJuIEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW4pO1xuXHR9O1xufSBlbHNlIHtcblx0bmV3QnVmZmVyID0gZnVuY3Rpb24gKGxlbikge1xuXHRcdHJldHVybiBuZXcgQnVmZmVyKGxlbik7XG5cdH07XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRDYWxsYmFjayhlcnIpIHtcblx0aWYgKGVycikgdGhyb3cgZXJyO1xufVxuIiwidmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoXCJzdHJlYW1cIikuVHJhbnNmb3JtO1xudmFyIFBhc3NUaHJvdWdoID0gcmVxdWlyZShcInN0cmVhbVwiKS5QYXNzVGhyb3VnaDtcbnZhciB6bGliID0gcmVxdWlyZShcInpsaWJcIik7XG52YXIgdXRpbCA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJldmVudHNcIikuRXZlbnRFbWl0dGVyO1xudmFyIGNyYzMyID0gcmVxdWlyZShcImJ1ZmZlci1jcmMzMlwiKTtcblxuZXhwb3J0cy5aaXBGaWxlID0gWmlwRmlsZTtcbmV4cG9ydHMuZGF0ZVRvRG9zRGF0ZVRpbWUgPSBkYXRlVG9Eb3NEYXRlVGltZTtcblxudXRpbC5pbmhlcml0cyhaaXBGaWxlLCBFdmVudEVtaXR0ZXIpO1xuXG5mdW5jdGlvbiBaaXBGaWxlKCkge1xuXHR0aGlzLm91dHB1dFN0cmVhbSA9IG5ldyBQYXNzVGhyb3VnaCgpO1xuXHR0aGlzLmVudHJpZXMgPSBbXTtcblx0dGhpcy5vdXRwdXRTdHJlYW1DdXJzb3IgPSAwO1xuXHR0aGlzLmVuZGVkID0gZmFsc2U7IC8vIC5lbmQoKSBzZXRzIHRoaXNcblx0dGhpcy5hbGxEb25lID0gZmFsc2U7IC8vIHNldCB3aGVuIHdlJ3ZlIHdyaXR0ZW4gdGhlIGxhc3QgYnl0ZXNcblx0dGhpcy5mb3JjZVppcDY0RW9jZCA9IGZhbHNlOyAvLyBjb25maWd1cmFibGUgaW4gLmVuZCgpXG59XG5cblppcEZpbGUucHJvdG90eXBlLmFkZEZpbGUgPSBmdW5jdGlvbiAocmVhbFBhdGgsIG1ldGFkYXRhUGF0aCwgb3B0aW9ucykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdG1ldGFkYXRhUGF0aCA9IHZhbGlkYXRlTWV0YWRhdGFQYXRoKG1ldGFkYXRhUGF0aCwgZmFsc2UpO1xuXHRpZiAob3B0aW9ucyA9PSBudWxsKSBvcHRpb25zID0ge307XG5cblx0dmFyIGVudHJ5ID0gbmV3IEVudHJ5KG1ldGFkYXRhUGF0aCwgZmFsc2UsIG9wdGlvbnMpO1xuXHRzZWxmLmVudHJpZXMucHVzaChlbnRyeSk7XG5cdGZzLnN0YXQocmVhbFBhdGgsIGZ1bmN0aW9uIChlcnIsIHN0YXRzKSB7XG5cdFx0aWYgKGVycikgcmV0dXJuIHNlbGYuZW1pdChcImVycm9yXCIsIGVycik7XG5cdFx0aWYgKCFzdGF0cy5pc0ZpbGUoKSkgcmV0dXJuIHNlbGYuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihcIm5vdCBhIGZpbGU6IFwiICsgcmVhbFBhdGgpKTtcblx0XHRlbnRyeS51bmNvbXByZXNzZWRTaXplID0gc3RhdHMuc2l6ZTtcblx0XHRpZiAob3B0aW9ucy5tdGltZSA9PSBudWxsKSBlbnRyeS5zZXRMYXN0TW9kRGF0ZShzdGF0cy5tdGltZSk7XG5cdFx0aWYgKG9wdGlvbnMubW9kZSA9PSBudWxsKSBlbnRyeS5zZXRGaWxlQXR0cmlidXRlc01vZGUoc3RhdHMubW9kZSk7XG5cdFx0ZW50cnkuc2V0RmlsZURhdGFQdW1wRnVuY3Rpb24oZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHJlYWRTdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKHJlYWxQYXRoKTtcblx0XHRcdGVudHJ5LnN0YXRlID0gRW50cnkuRklMRV9EQVRBX0lOX1BST0dSRVNTO1xuXHRcdFx0cmVhZFN0cmVhbS5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnIpIHtcblx0XHRcdFx0c2VsZi5lbWl0KFwiZXJyb3JcIiwgZXJyKTtcblx0XHRcdH0pO1xuXHRcdFx0cHVtcEZpbGVEYXRhUmVhZFN0cmVhbShzZWxmLCBlbnRyeSwgcmVhZFN0cmVhbSk7XG5cdFx0fSk7XG5cdFx0cHVtcEVudHJpZXMoc2VsZik7XG5cdH0pO1xufTtcblxuWmlwRmlsZS5wcm90b3R5cGUuYWRkUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIChyZWFkU3RyZWFtLCBtZXRhZGF0YVBhdGgsIG9wdGlvbnMpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRtZXRhZGF0YVBhdGggPSB2YWxpZGF0ZU1ldGFkYXRhUGF0aChtZXRhZGF0YVBhdGgsIGZhbHNlKTtcblx0aWYgKG9wdGlvbnMgPT0gbnVsbCkgb3B0aW9ucyA9IHt9O1xuXHR2YXIgZW50cnkgPSBuZXcgRW50cnkobWV0YWRhdGFQYXRoLCBmYWxzZSwgb3B0aW9ucyk7XG5cdHNlbGYuZW50cmllcy5wdXNoKGVudHJ5KTtcblx0ZW50cnkuc2V0RmlsZURhdGFQdW1wRnVuY3Rpb24oZnVuY3Rpb24gKCkge1xuXHRcdGVudHJ5LnN0YXRlID0gRW50cnkuRklMRV9EQVRBX0lOX1BST0dSRVNTO1xuXHRcdHB1bXBGaWxlRGF0YVJlYWRTdHJlYW0oc2VsZiwgZW50cnksIHJlYWRTdHJlYW0pO1xuXHR9KTtcblx0cHVtcEVudHJpZXMoc2VsZik7XG59O1xuXG5aaXBGaWxlLnByb3RvdHlwZS5hZGRCdWZmZXIgPSBmdW5jdGlvbiAoYnVmZmVyLCBtZXRhZGF0YVBhdGgsIG9wdGlvbnMpIHtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXHRtZXRhZGF0YVBhdGggPSB2YWxpZGF0ZU1ldGFkYXRhUGF0aChtZXRhZGF0YVBhdGgsIGZhbHNlKTtcblx0aWYgKGJ1ZmZlci5sZW5ndGggPiAweDNmZmZmZmZmKSB0aHJvdyBuZXcgRXJyb3IoXCJidWZmZXIgdG9vIGxhcmdlOiBcIiArIGJ1ZmZlci5sZW5ndGggKyBcIiA+IFwiICsgMHgzZmZmZmZmZik7XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuc2l6ZSAhPSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLnNpemUgbm90IGFsbG93ZWRcIik7XG5cdHZhciBlbnRyeSA9IG5ldyBFbnRyeShtZXRhZGF0YVBhdGgsIGZhbHNlLCBvcHRpb25zKTtcblx0ZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9IGJ1ZmZlci5sZW5ndGg7XG5cdGVudHJ5LmNyYzMyID0gY3JjMzIudW5zaWduZWQoYnVmZmVyKTtcblx0ZW50cnkuY3JjQW5kRmlsZVNpemVLbm93biA9IHRydWU7XG5cdHNlbGYuZW50cmllcy5wdXNoKGVudHJ5KTtcblx0aWYgKCFlbnRyeS5jb21wcmVzcykge1xuXHRcdHNldENvbXByZXNzZWRCdWZmZXIoYnVmZmVyKTtcblx0fSBlbHNlIHtcblx0XHR6bGliLmRlZmxhdGVSYXcoYnVmZmVyLCBmdW5jdGlvbiAoZXJyLCBjb21wcmVzc2VkQnVmZmVyKSB7XG5cdFx0XHRzZXRDb21wcmVzc2VkQnVmZmVyKGNvbXByZXNzZWRCdWZmZXIpO1xuXHRcdFx0XG5cdFx0fSk7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDb21wcmVzc2VkQnVmZmVyKGNvbXByZXNzZWRCdWZmZXIpIHtcblx0XHRlbnRyeS5jb21wcmVzc2VkU2l6ZSA9IGNvbXByZXNzZWRCdWZmZXIubGVuZ3RoO1xuXHRcdGVudHJ5LnNldEZpbGVEYXRhUHVtcEZ1bmN0aW9uKGZ1bmN0aW9uICgpIHtcblx0XHRcdHdyaXRlVG9PdXRwdXRTdHJlYW0oc2VsZiwgY29tcHJlc3NlZEJ1ZmZlcik7XG5cdFx0XHR3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGVudHJ5LmdldERhdGFEZXNjcmlwdG9yKCkpO1xuXHRcdFx0ZW50cnkuc3RhdGUgPSBFbnRyeS5GSUxFX0RBVEFfRE9ORTtcblxuXHRcdFx0Ly8gZG9uJ3QgY2FsbCBwdW1wRW50cmllcygpIHJlY3Vyc2l2ZWx5LlxuXHRcdFx0Ly8gKGFsc28sIGRvbid0IGNhbGwgcHJvY2Vzcy5uZXh0VGljayByZWN1cnNpdmVseS4pXG5cdFx0XHRzZXRJbW1lZGlhdGUoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRwdW1wRW50cmllcyhzZWxmKTtcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHB1bXBFbnRyaWVzKHNlbGYpO1xuXHR9XG59O1xuXG5cblppcEZpbGUucHJvdG90eXBlLmFkZEVtcHR5RGlyZWN0b3J5ID0gZnVuY3Rpb24gKG1ldGFkYXRhUGF0aCwgb3B0aW9ucykge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdG1ldGFkYXRhUGF0aCA9IHZhbGlkYXRlTWV0YWRhdGFQYXRoKG1ldGFkYXRhUGF0aCwgdHJ1ZSk7XG5cdGlmIChvcHRpb25zID09IG51bGwpIG9wdGlvbnMgPSB7fTtcblx0aWYgKG9wdGlvbnMuc2l6ZSAhPSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJvcHRpb25zLnNpemUgbm90IGFsbG93ZWRcIik7XG5cdGlmIChvcHRpb25zLmNvbXByZXNzICE9IG51bGwpIHRocm93IG5ldyBFcnJvcihcIm9wdGlvbnMuY29tcHJlc3Mgbm90IGFsbG93ZWRcIik7XG5cdHZhciBlbnRyeSA9IG5ldyBFbnRyeShtZXRhZGF0YVBhdGgsIHRydWUsIG9wdGlvbnMpO1xuXHRzZWxmLmVudHJpZXMucHVzaChlbnRyeSk7XG5cdGVudHJ5LnNldEZpbGVEYXRhUHVtcEZ1bmN0aW9uKGZ1bmN0aW9uICgpIHtcblx0XHR3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGVudHJ5LmdldERhdGFEZXNjcmlwdG9yKCkpO1xuXHRcdGVudHJ5LnN0YXRlID0gRW50cnkuRklMRV9EQVRBX0RPTkU7XG5cdFx0cHVtcEVudHJpZXMoc2VsZik7XG5cdH0pO1xuXHRwdW1wRW50cmllcyhzZWxmKTtcbn07XG5cblppcEZpbGUucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uIChvcHRpb25zLCBmaW5hbFNpemVDYWxsYmFjaykge1xuXHRpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdGZpbmFsU2l6ZUNhbGxiYWNrID0gb3B0aW9ucztcblx0XHRvcHRpb25zID0gbnVsbDtcblx0fVxuXHRpZiAob3B0aW9ucyA9PSBudWxsKSBvcHRpb25zID0ge307XG5cdGlmICh0aGlzLmVuZGVkKSByZXR1cm47XG5cdHRoaXMuZW5kZWQgPSB0cnVlO1xuXHR0aGlzLmZpbmFsU2l6ZUNhbGxiYWNrID0gZmluYWxTaXplQ2FsbGJhY2s7XG5cdHRoaXMuZm9yY2VaaXA2NEVvY2QgPSAhIW9wdGlvbnMuZm9yY2VaaXA2NEZvcm1hdDtcblx0cHVtcEVudHJpZXModGhpcyk7XG59O1xuXG5mdW5jdGlvbiB3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGJ1ZmZlcikge1xuXHRzZWxmLm91dHB1dFN0cmVhbS53cml0ZShidWZmZXIpO1xuXHRzZWxmLm91dHB1dFN0cmVhbUN1cnNvciArPSBidWZmZXIubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBwdW1wRmlsZURhdGFSZWFkU3RyZWFtKHNlbGYsIGVudHJ5LCByZWFkU3RyZWFtKSB7XG5cdHZhciBjcmMzMldhdGNoZXIgPSBuZXcgQ3JjMzJXYXRjaGVyKCk7XG5cdHZhciB1bmNvbXByZXNzZWRTaXplQ291bnRlciA9IG5ldyBCeXRlQ291bnRlcigpO1xuXHR2YXIgY29tcHJlc3NvciA9IGVudHJ5LmNvbXByZXNzID8gbmV3IHpsaWIuRGVmbGF0ZVJhdygpIDogbmV3IFBhc3NUaHJvdWdoKCk7XG5cdHZhciBjb21wcmVzc2VkU2l6ZUNvdW50ZXIgPSBuZXcgQnl0ZUNvdW50ZXIoKTtcblx0cmVhZFN0cmVhbS5waXBlKGNyYzMyV2F0Y2hlcilcblx0XHQucGlwZSh1bmNvbXByZXNzZWRTaXplQ291bnRlcilcblx0XHQucGlwZShjb21wcmVzc29yKVxuXHRcdC5waXBlKGNvbXByZXNzZWRTaXplQ291bnRlcilcblx0XHQucGlwZShzZWxmLm91dHB1dFN0cmVhbSwge2VuZDogZmFsc2V9KTtcblx0Y29tcHJlc3NlZFNpemVDb3VudGVyLm9uKFwiZW5kXCIsIGZ1bmN0aW9uICgpIHtcblx0XHRlbnRyeS5jcmMzMiA9IGNyYzMyV2F0Y2hlci5jcmMzMjtcblx0XHRpZiAoZW50cnkudW5jb21wcmVzc2VkU2l6ZSA9PSBudWxsKSB7XG5cdFx0XHRlbnRyeS51bmNvbXByZXNzZWRTaXplID0gdW5jb21wcmVzc2VkU2l6ZUNvdW50ZXIuYnl0ZUNvdW50O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoZW50cnkudW5jb21wcmVzc2VkU2l6ZSAhPT0gdW5jb21wcmVzc2VkU2l6ZUNvdW50ZXIuYnl0ZUNvdW50KSByZXR1cm4gc2VsZi5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiZmlsZSBkYXRhIHN0cmVhbSBoYXMgdW5leHBlY3RlZCBudW1iZXIgb2YgYnl0ZXNcIikpO1xuXHRcdH1cblx0XHRlbnRyeS5jb21wcmVzc2VkU2l6ZSA9IGNvbXByZXNzZWRTaXplQ291bnRlci5ieXRlQ291bnQ7XG5cdFx0c2VsZi5vdXRwdXRTdHJlYW1DdXJzb3IgKz0gZW50cnkuY29tcHJlc3NlZFNpemU7XG5cdFx0d3JpdGVUb091dHB1dFN0cmVhbShzZWxmLCBlbnRyeS5nZXREYXRhRGVzY3JpcHRvcigpKTtcblx0XHRlbnRyeS5zdGF0ZSA9IEVudHJ5LkZJTEVfREFUQV9ET05FO1xuXHRcdHB1bXBFbnRyaWVzKHNlbGYpO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gcHVtcEVudHJpZXMoc2VsZikge1xuXHRpZiAoc2VsZi5hbGxEb25lKSByZXR1cm47XG5cdC8vIGZpcnN0IGNoZWNrIGlmIGZpbmFsU2l6ZSBpcyBmaW5hbGx5IGtub3duXG5cdGlmIChzZWxmLmVuZGVkICYmIHNlbGYuZmluYWxTaXplQ2FsbGJhY2sgIT0gbnVsbCkge1xuXHRcdHZhciBmaW5hbFNpemUgPSBjYWxjdWxhdGVGaW5hbFNpemUoc2VsZik7XG5cdFx0aWYgKGZpbmFsU2l6ZSAhPSBudWxsKSB7XG5cdFx0XHQvLyB3ZSBoYXZlIGFuIGFuc3dlclxuXHRcdFx0c2VsZi5maW5hbFNpemVDYWxsYmFjayhmaW5hbFNpemUpO1xuXHRcdFx0c2VsZi5maW5hbFNpemVDYWxsYmFjayA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0Ly8gcHVtcCBlbnRyaWVzXG5cdHZhciBlbnRyeSA9IGdldEZpcnN0Tm90RG9uZUVudHJ5KCk7XG5cblx0ZnVuY3Rpb24gZ2V0Rmlyc3ROb3REb25lRW50cnkoKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxmLmVudHJpZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBlbnRyeSA9IHNlbGYuZW50cmllc1tpXTtcblx0XHRcdGlmIChlbnRyeS5zdGF0ZSA8IEVudHJ5LkZJTEVfREFUQV9ET05FKSByZXR1cm4gZW50cnk7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0aWYgKGVudHJ5ICE9IG51bGwpIHtcblx0XHQvLyB0aGlzIGVudHJ5IGlzIG5vdCBkb25lIHlldFxuXHRcdGlmIChlbnRyeS5zdGF0ZSA8IEVudHJ5LlJFQURZX1RPX1BVTVBfRklMRV9EQVRBKSByZXR1cm47IC8vIGlucHV0IGZpbGUgbm90IG9wZW4geWV0XG5cdFx0aWYgKGVudHJ5LnN0YXRlID09PSBFbnRyeS5GSUxFX0RBVEFfSU5fUFJPR1JFU1MpIHJldHVybjsgLy8gd2UnbGwgZ2V0IHRoZXJlXG5cdFx0Ly8gc3RhcnQgd2l0aCBsb2NhbCBmaWxlIGhlYWRlclxuXHRcdGVudHJ5LnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciA9IHNlbGYub3V0cHV0U3RyZWFtQ3Vyc29yO1xuXHRcdHZhciBsb2NhbEZpbGVIZWFkZXIgPSBlbnRyeS5nZXRMb2NhbEZpbGVIZWFkZXIoKTtcblx0XHR3cml0ZVRvT3V0cHV0U3RyZWFtKHNlbGYsIGxvY2FsRmlsZUhlYWRlcik7XG5cdFx0ZW50cnkuZG9GaWxlRGF0YVB1bXAoKTtcblx0fSBlbHNlIHtcblx0XHQvLyBhbGwgY291Z2h0IHVwIG9uIHdyaXRpbmcgZW50cmllc1xuXHRcdGlmIChzZWxmLmVuZGVkKSB7XG5cdFx0XHQvLyBoZWFkIGZvciB0aGUgZXhpdFxuXHRcdFx0c2VsZi5vZmZzZXRPZlN0YXJ0T2ZDZW50cmFsRGlyZWN0b3J5ID0gc2VsZi5vdXRwdXRTdHJlYW1DdXJzb3I7XG5cdFx0XHRzZWxmLmVudHJpZXMuZm9yRWFjaChmdW5jdGlvbiAoZW50cnkpIHtcblx0XHRcdFx0dmFyIGNlbnRyYWxEaXJlY3RvcnlSZWNvcmQgPSBlbnRyeS5nZXRDZW50cmFsRGlyZWN0b3J5UmVjb3JkKCk7XG5cdFx0XHRcdHdyaXRlVG9PdXRwdXRTdHJlYW0oc2VsZiwgY2VudHJhbERpcmVjdG9yeVJlY29yZCk7XG5cdFx0XHR9KTtcblx0XHRcdHdyaXRlVG9PdXRwdXRTdHJlYW0oc2VsZiwgZ2V0RW5kT2ZDZW50cmFsRGlyZWN0b3J5UmVjb3JkKHNlbGYpKTtcblx0XHRcdHNlbGYub3V0cHV0U3RyZWFtLmVuZCgpO1xuXHRcdFx0c2VsZi5hbGxEb25lID0gdHJ1ZTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlRmluYWxTaXplKHNlbGYpIHtcblx0dmFyIHByZXRlbmRPdXRwdXRDdXJzb3IgPSAwO1xuXHR2YXIgY2VudHJhbERpcmVjdG9yeVNpemUgPSAwO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYuZW50cmllcy5sZW5ndGg7IGkrKykge1xuXHRcdHZhciBlbnRyeSA9IHNlbGYuZW50cmllc1tpXTtcblx0XHQvLyBjb21wcmVzc2lvbiBpcyB0b28gaGFyZCB0byBwcmVkaWN0XG5cdFx0aWYgKGVudHJ5LmNvbXByZXNzKSByZXR1cm4gLTE7XG5cdFx0aWYgKGVudHJ5LnN0YXRlID49IEVudHJ5LlJFQURZX1RPX1BVTVBfRklMRV9EQVRBKSB7XG5cdFx0XHQvLyBpZiBhZGRSZWFkU3RyZWFtIHdhcyBjYWxsZWQgd2l0aG91dCBwcm92aWRpbmcgdGhlIHNpemUsIHdlIGNhbid0IHByZWRpY3QgdGhlIGZpbmFsIHNpemVcblx0XHRcdGlmIChlbnRyeS51bmNvbXByZXNzZWRTaXplID09IG51bGwpIHJldHVybiAtMTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gaWYgd2UncmUgc3RpbGwgd2FpdGluZyBmb3IgZnMuc3RhdCwgd2UgbWlnaHQgbGVhcm4gdGhlIHNpemUgc29tZWRheVxuXHRcdFx0aWYgKGVudHJ5LnVuY29tcHJlc3NlZFNpemUgPT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdC8vIHdlIGtub3cgdGhpcyBmb3Igc3VyZSwgYW5kIHRoaXMgaXMgaW1wb3J0YW50IHRvIGtub3cgaWYgd2UgbmVlZCBaSVA2NCBmb3JtYXQuXG5cdFx0ZW50cnkucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyID0gcHJldGVuZE91dHB1dEN1cnNvcjtcblx0XHR2YXIgdXNlWmlwNjRGb3JtYXQgPSBlbnRyeS51c2VaaXA2NEZvcm1hdCgpO1xuXG5cdFx0cHJldGVuZE91dHB1dEN1cnNvciArPSBMT0NBTF9GSUxFX0hFQURFUl9GSVhFRF9TSVpFICsgZW50cnkudXRmOEZpbGVOYW1lLmxlbmd0aDtcblx0XHRwcmV0ZW5kT3V0cHV0Q3Vyc29yICs9IGVudHJ5LnVuY29tcHJlc3NlZFNpemU7XG5cdFx0aWYgKCFlbnRyeS5jcmNBbmRGaWxlU2l6ZUtub3duKSB7XG5cdFx0XHQvLyB1c2UgYSBkYXRhIGRlc2NyaXB0b3Jcblx0XHRcdGlmICh1c2VaaXA2NEZvcm1hdCkge1xuXHRcdFx0XHRwcmV0ZW5kT3V0cHV0Q3Vyc29yICs9IFpJUDY0X0RBVEFfREVTQ1JJUFRPUl9TSVpFO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cHJldGVuZE91dHB1dEN1cnNvciArPSBEQVRBX0RFU0NSSVBUT1JfU0laRTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRjZW50cmFsRGlyZWN0b3J5U2l6ZSArPSBDRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfRklYRURfU0laRSArIGVudHJ5LnV0ZjhGaWxlTmFtZS5sZW5ndGg7XG5cdFx0aWYgKHVzZVppcDY0Rm9ybWF0KSB7XG5cdFx0XHRjZW50cmFsRGlyZWN0b3J5U2l6ZSArPSBaSVA2NF9FWFRFTkRFRF9JTkZPUk1BVElPTl9FWFRSQV9GSUVMRF9TSVpFO1xuXHRcdH1cblx0fVxuXG5cdHZhciBlbmRPZkNlbnRyYWxEaXJlY3RvcnlTaXplID0gMDtcblx0aWYgKHNlbGYuZm9yY2VaaXA2NEVvY2QgfHxcblx0XHRzZWxmLmVudHJpZXMubGVuZ3RoID49IDB4ZmZmZiB8fFxuXHRcdGNlbnRyYWxEaXJlY3RvcnlTaXplID49IDB4ZmZmZiB8fFxuXHRcdHByZXRlbmRPdXRwdXRDdXJzb3IgPj0gMHhmZmZmZmZmZikge1xuXHRcdC8vIHVzZSB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3Rvcnkgc3R1ZmZcblx0XHRlbmRPZkNlbnRyYWxEaXJlY3RvcnlTaXplICs9IFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSArIFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9MT0NBVE9SX1NJWkU7XG5cdH1cblx0ZW5kT2ZDZW50cmFsRGlyZWN0b3J5U2l6ZSArPSBFTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfUkVDT1JEX1NJWkU7XG5cdHJldHVybiBwcmV0ZW5kT3V0cHV0Q3Vyc29yICsgY2VudHJhbERpcmVjdG9yeVNpemUgKyBlbmRPZkNlbnRyYWxEaXJlY3RvcnlTaXplO1xufVxuXG52YXIgWklQNjRfRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFID0gNTY7XG52YXIgWklQNjRfRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX0xPQ0FUT1JfU0laRSA9IDIwO1xudmFyIEVORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSA9IDIyO1xuXG5mdW5jdGlvbiBnZXRFbmRPZkNlbnRyYWxEaXJlY3RvcnlSZWNvcmQoc2VsZiwgYWN0dWFsbHlKdXN0VGVsbE1lSG93TG9uZ0l0V291bGRCZSkge1xuXHR2YXIgbmVlZFppcDY0Rm9ybWF0ID0gZmFsc2U7XG5cdHZhciBub3JtYWxFbnRyaWVzTGVuZ3RoID0gc2VsZi5lbnRyaWVzLmxlbmd0aDtcblx0aWYgKHNlbGYuZm9yY2VaaXA2NEVvY2QgfHwgc2VsZi5lbnRyaWVzLmxlbmd0aCA+PSAweGZmZmYpIHtcblx0XHRub3JtYWxFbnRyaWVzTGVuZ3RoID0gMHhmZmZmO1xuXHRcdG5lZWRaaXA2NEZvcm1hdCA9IHRydWU7XG5cdH1cblx0dmFyIHNpemVPZkNlbnRyYWxEaXJlY3RvcnkgPSBzZWxmLm91dHB1dFN0cmVhbUN1cnNvciAtIHNlbGYub2Zmc2V0T2ZTdGFydE9mQ2VudHJhbERpcmVjdG9yeTtcblx0dmFyIG5vcm1hbFNpemVPZkNlbnRyYWxEaXJlY3RvcnkgPSBzaXplT2ZDZW50cmFsRGlyZWN0b3J5O1xuXHRpZiAoc2VsZi5mb3JjZVppcDY0RW9jZCB8fCBzaXplT2ZDZW50cmFsRGlyZWN0b3J5ID49IDB4ZmZmZmZmZmYpIHtcblx0XHRub3JtYWxTaXplT2ZDZW50cmFsRGlyZWN0b3J5ID0gMHhmZmZmZmZmZjtcblx0XHRuZWVkWmlwNjRGb3JtYXQgPSB0cnVlO1xuXHR9XG5cdHZhciBub3JtYWxPZmZzZXRPZlN0YXJ0T2ZDZW50cmFsRGlyZWN0b3J5ID0gc2VsZi5vZmZzZXRPZlN0YXJ0T2ZDZW50cmFsRGlyZWN0b3J5O1xuXHRpZiAoc2VsZi5mb3JjZVppcDY0RW9jZCB8fCBzZWxmLm9mZnNldE9mU3RhcnRPZkNlbnRyYWxEaXJlY3RvcnkgPj0gMHhmZmZmZmZmZikge1xuXHRcdG5vcm1hbE9mZnNldE9mU3RhcnRPZkNlbnRyYWxEaXJlY3RvcnkgPSAweGZmZmZmZmZmO1xuXHRcdG5lZWRaaXA2NEZvcm1hdCA9IHRydWU7XG5cdH1cblx0aWYgKGFjdHVhbGx5SnVzdFRlbGxNZUhvd0xvbmdJdFdvdWxkQmUpIHtcblx0XHRpZiAobmVlZFppcDY0Rm9ybWF0KSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRaSVA2NF9FTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfUkVDT1JEX1NJWkUgK1xuXHRcdFx0XHRaSVA2NF9FTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUl9TSVpFICtcblx0XHRcdFx0RU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFXG5cdFx0XHQpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFO1xuXHRcdH1cblx0fVxuXG5cdHZhciBlb2NkckJ1ZmZlciA9IG5ldyBCdWZmZXIoRU5EX09GX0NFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9TSVpFKTtcblx0Ly8gZW5kIG9mIGNlbnRyYWwgZGlyIHNpZ25hdHVyZSAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlcyAgKDB4MDYwNTRiNTApXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUoMHgwNjA1NGI1MCwgMCk7XG5cdC8vIG51bWJlciBvZiB0aGlzIGRpc2sgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgYnl0ZXNcblx0ZW9jZHJCdWZmZXIud3JpdGVVSW50MTZMRSgwLCA0KTtcblx0Ly8gbnVtYmVyIG9mIHRoZSBkaXNrIHdpdGggdGhlIHN0YXJ0IG9mIHRoZSBjZW50cmFsIGRpcmVjdG9yeSAgMiBieXRlc1xuXHRlb2NkckJ1ZmZlci53cml0ZVVJbnQxNkxFKDAsIDYpO1xuXHQvLyB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgY2VudHJhbCBkaXJlY3Rvcnkgb24gdGhpcyBkaXNrICAyIGJ5dGVzXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDE2TEUobm9ybWFsRW50cmllc0xlbmd0aCwgOCk7XG5cdC8vIHRvdGFsIG51bWJlciBvZiBlbnRyaWVzIGluIHRoZSBjZW50cmFsIGRpcmVjdG9yeSAgIDIgYnl0ZXNcblx0ZW9jZHJCdWZmZXIud3JpdGVVSW50MTZMRShub3JtYWxFbnRyaWVzTGVuZ3RoLCAxMCk7XG5cdC8vIHNpemUgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgIDQgYnl0ZXNcblx0ZW9jZHJCdWZmZXIud3JpdGVVSW50MzJMRShub3JtYWxTaXplT2ZDZW50cmFsRGlyZWN0b3J5LCAxMik7XG5cdC8vIG9mZnNldCBvZiBzdGFydCBvZiBjZW50cmFsIGRpcmVjdG9yeSB3aXRoIHJlc3BlY3QgdG8gdGhlIHN0YXJ0aW5nIGRpc2sgbnVtYmVyICA0IGJ5dGVzXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUobm9ybWFsT2Zmc2V0T2ZTdGFydE9mQ2VudHJhbERpcmVjdG9yeSwgMTYpO1xuXHQvLyAuWklQIGZpbGUgY29tbWVudCBsZW5ndGggICAgICAgICAgICAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGVvY2RyQnVmZmVyLndyaXRlVUludDE2TEUoMCwgMjApO1xuXHQvLyAuWklQIGZpbGUgY29tbWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAodmFyaWFibGUgc2l6ZSlcblx0Ly8gbm8gY29tbWVudFxuXG5cdGlmICghbmVlZFppcDY0Rm9ybWF0KSByZXR1cm4gZW9jZHJCdWZmZXI7XG5cblx0Ly8gWklQNjQgZm9ybWF0XG5cdC8vIFpJUDY0IEVuZCBvZiBDZW50cmFsIERpcmVjdG9yeSBSZWNvcmRcblx0dmFyIHppcDY0RW9jZHJCdWZmZXIgPSBuZXcgQnVmZmVyKFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSk7XG5cdC8vIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpciBzaWduYXR1cmUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzICAoMHgwNjA2NGI1MClcblx0emlwNjRFb2NkckJ1ZmZlci53cml0ZVVJbnQzMkxFKDB4MDYwNjRiNTAsIDApO1xuXHQvLyBzaXplIG9mIHppcDY0IGVuZCBvZiBjZW50cmFsIGRpcmVjdG9yeSByZWNvcmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHR3cml0ZVVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIFpJUDY0X0VORF9PRl9DRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfU0laRSAtIDEyLCA0KTtcblx0Ly8gdmVyc2lvbiBtYWRlIGJ5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIgYnl0ZXNcblx0emlwNjRFb2NkckJ1ZmZlci53cml0ZVVJbnQxNkxFKFZFUlNJT05fTUFERV9CWSwgMTIpO1xuXHQvLyB2ZXJzaW9uIG5lZWRlZCB0byBleHRyYWN0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMiBieXRlc1xuXHR6aXA2NEVvY2RyQnVmZmVyLndyaXRlVUludDE2TEUoVkVSU0lPTl9ORUVERURfVE9fRVhUUkFDVF9aSVA2NCwgMTQpO1xuXHQvLyBudW1iZXIgb2YgdGhpcyBkaXNrICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHR6aXA2NEVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUoMCwgMTYpO1xuXHQvLyBudW1iZXIgb2YgdGhlIGRpc2sgd2l0aCB0aGUgc3RhcnQgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHR6aXA2NEVvY2RyQnVmZmVyLndyaXRlVUludDMyTEUoMCwgMjApO1xuXHQvLyB0b3RhbCBudW1iZXIgb2YgZW50cmllcyBpbiB0aGUgY2VudHJhbCBkaXJlY3Rvcnkgb24gdGhpcyBkaXNrICAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHR3cml0ZVVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIHNlbGYuZW50cmllcy5sZW5ndGgsIDI0KTtcblx0Ly8gdG90YWwgbnVtYmVyIG9mIGVudHJpZXMgaW4gdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDggYnl0ZXNcblx0d3JpdGVVSW50NjRMRSh6aXA2NEVvY2RyQnVmZmVyLCBzZWxmLmVudHJpZXMubGVuZ3RoLCAzMik7XG5cdC8vIHNpemUgb2YgdGhlIGNlbnRyYWwgZGlyZWN0b3J5ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA4IGJ5dGVzXG5cdHdyaXRlVUludDY0TEUoemlwNjRFb2NkckJ1ZmZlciwgc2l6ZU9mQ2VudHJhbERpcmVjdG9yeSwgNDApO1xuXHQvLyBvZmZzZXQgb2Ygc3RhcnQgb2YgY2VudHJhbCBkaXJlY3Rvcnkgd2l0aCByZXNwZWN0IHRvIHRoZSBzdGFydGluZyBkaXNrIG51bWJlciAgOCBieXRlc1xuXHR3cml0ZVVJbnQ2NExFKHppcDY0RW9jZHJCdWZmZXIsIHNlbGYub2Zmc2V0T2ZTdGFydE9mQ2VudHJhbERpcmVjdG9yeSwgNDgpO1xuXHQvLyB6aXA2NCBleHRlbnNpYmxlIGRhdGEgc2VjdG9yICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHZhcmlhYmxlIHNpemUpXG5cdC8vIG5vdGhpbmcgaW4gdGhlIHppcDY0IGV4dGVuc2libGUgZGF0YSBzZWN0b3JcblxuXG5cdC8vIFpJUDY0IEVuZCBvZiBDZW50cmFsIERpcmVjdG9yeSBMb2NhdG9yXG5cdHZhciB6aXA2NEVvY2RsQnVmZmVyID0gbmV3IEJ1ZmZlcihaSVA2NF9FTkRfT0ZfQ0VOVFJBTF9ESVJFQ1RPUllfTE9DQVRPUl9TSVpFKTtcblx0Ly8gemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyIGxvY2F0b3Igc2lnbmF0dXJlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDQgYnl0ZXMgICgweDA3MDY0YjUwKVxuXHR6aXA2NEVvY2RsQnVmZmVyLndyaXRlVUludDMyTEUoMHgwNzA2NGI1MCwgMCk7XG5cdC8vIG51bWJlciBvZiB0aGUgZGlzayB3aXRoIHRoZSBzdGFydCBvZiB0aGUgemlwNjQgZW5kIG9mIGNlbnRyYWwgZGlyZWN0b3J5ICA0IGJ5dGVzXG5cdHppcDY0RW9jZGxCdWZmZXIud3JpdGVVSW50MzJMRSgwLCA0KTtcblx0Ly8gcmVsYXRpdmUgb2Zmc2V0IG9mIHRoZSB6aXA2NCBlbmQgb2YgY2VudHJhbCBkaXJlY3RvcnkgcmVjb3JkICAgICAgICAgICAgIDggYnl0ZXNcblx0d3JpdGVVSW50NjRMRSh6aXA2NEVvY2RsQnVmZmVyLCBzZWxmLm91dHB1dFN0cmVhbUN1cnNvciwgOCk7XG5cdC8vIHRvdGFsIG51bWJlciBvZiBkaXNrcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdHppcDY0RW9jZGxCdWZmZXIud3JpdGVVSW50MzJMRSgxLCAxNik7XG5cblxuXHRyZXR1cm4gQnVmZmVyLmNvbmNhdChbXG5cdFx0emlwNjRFb2NkckJ1ZmZlcixcblx0XHR6aXA2NEVvY2RsQnVmZmVyLFxuXHRcdGVvY2RyQnVmZmVyLFxuXHRdKTtcbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVNZXRhZGF0YVBhdGgobWV0YWRhdGFQYXRoLCBpc0RpcmVjdG9yeSkge1xuXHRpZiAobWV0YWRhdGFQYXRoID09PSBcIlwiKSB0aHJvdyBuZXcgRXJyb3IoXCJlbXB0eSBtZXRhZGF0YVBhdGhcIik7XG5cdG1ldGFkYXRhUGF0aCA9IG1ldGFkYXRhUGF0aC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcblx0aWYgKC9eW2EtekEtWl06Ly50ZXN0KG1ldGFkYXRhUGF0aCkgfHwgL15cXC8vLnRlc3QobWV0YWRhdGFQYXRoKSkgdGhyb3cgbmV3IEVycm9yKFwiYWJzb2x1dGUgcGF0aDogXCIgKyBtZXRhZGF0YVBhdGgpO1xuXHRpZiAobWV0YWRhdGFQYXRoLnNwbGl0KFwiL1wiKS5pbmRleE9mKFwiLi5cIikgIT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIHJlbGF0aXZlIHBhdGg6IFwiICsgbWV0YWRhdGFQYXRoKTtcblx0dmFyIGxvb2tzTGlrZURpcmVjdG9yeSA9IC9cXC8kLy50ZXN0KG1ldGFkYXRhUGF0aCk7XG5cdGlmIChpc0RpcmVjdG9yeSkge1xuXHRcdC8vIGFwcGVuZCBhIHRyYWlsaW5nICcvJyBpZiBuZWNlc3NhcnkuXG5cdFx0aWYgKCFsb29rc0xpa2VEaXJlY3RvcnkpIG1ldGFkYXRhUGF0aCArPSBcIi9cIjtcblx0fSBlbHNlIHtcblx0XHRpZiAobG9va3NMaWtlRGlyZWN0b3J5KSB0aHJvdyBuZXcgRXJyb3IoXCJmaWxlIHBhdGggY2Fubm90IGVuZCB3aXRoICcvJzogXCIgKyBtZXRhZGF0YVBhdGgpO1xuXHR9XG5cdHJldHVybiBtZXRhZGF0YVBhdGg7XG59XG5cbnZhciBkZWZhdWx0RmlsZU1vZGUgPSBwYXJzZUludChcIjAxMDA2NjRcIiwgOCk7XG52YXIgZGVmYXVsdERpcmVjdG9yeU1vZGUgPSBwYXJzZUludChcIjA0MDc3NVwiLCA4KTtcblxuLy8gdGhpcyBjbGFzcyBpcyBub3QgcGFydCBvZiB0aGUgcHVibGljIEFQSVxuZnVuY3Rpb24gRW50cnkobWV0YWRhdGFQYXRoLCBpc0RpcmVjdG9yeSwgb3B0aW9ucykge1xuXHR0aGlzLnV0ZjhGaWxlTmFtZSA9IG5ldyBCdWZmZXIobWV0YWRhdGFQYXRoKTtcblx0aWYgKHRoaXMudXRmOEZpbGVOYW1lLmxlbmd0aCA+IDB4ZmZmZikgdGhyb3cgbmV3IEVycm9yKFwidXRmOCBmaWxlIG5hbWUgdG9vIGxvbmcuIFwiICsgdXRmOEZpbGVOYW1lLmxlbmd0aCArIFwiID4gXCIgKyAweGZmZmYpO1xuXHR0aGlzLmlzRGlyZWN0b3J5ID0gaXNEaXJlY3Rvcnk7XG5cdHRoaXMuc3RhdGUgPSBFbnRyeS5XQUlUSU5HX0ZPUl9NRVRBREFUQTtcblx0dGhpcy5zZXRMYXN0TW9kRGF0ZShvcHRpb25zLm10aW1lICE9IG51bGwgPyBvcHRpb25zLm10aW1lIDogbmV3IERhdGUoKSk7XG5cdGlmIChvcHRpb25zLm1vZGUgIT0gbnVsbCkge1xuXHRcdHRoaXMuc2V0RmlsZUF0dHJpYnV0ZXNNb2RlKG9wdGlvbnMubW9kZSk7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5zZXRGaWxlQXR0cmlidXRlc01vZGUoaXNEaXJlY3RvcnkgPyBkZWZhdWx0RGlyZWN0b3J5TW9kZSA6IGRlZmF1bHRGaWxlTW9kZSk7XG5cdH1cblx0aWYgKGlzRGlyZWN0b3J5KSB7XG5cdFx0dGhpcy5jcmNBbmRGaWxlU2l6ZUtub3duID0gdHJ1ZTtcblx0XHR0aGlzLmNyYzMyID0gMDtcblx0XHR0aGlzLnVuY29tcHJlc3NlZFNpemUgPSAwO1xuXHRcdHRoaXMuY29tcHJlc3NlZFNpemUgPSAwO1xuXHR9IGVsc2Uge1xuXHRcdC8vIHVua25vd24gc28gZmFyXG5cdFx0dGhpcy5jcmNBbmRGaWxlU2l6ZUtub3duID0gZmFsc2U7XG5cdFx0dGhpcy5jcmMzMiA9IG51bGw7XG5cdFx0dGhpcy51bmNvbXByZXNzZWRTaXplID0gbnVsbDtcblx0XHR0aGlzLmNvbXByZXNzZWRTaXplID0gbnVsbDtcblx0XHRpZiAob3B0aW9ucy5zaXplICE9IG51bGwpIHRoaXMudW5jb21wcmVzc2VkU2l6ZSA9IG9wdGlvbnMuc2l6ZTtcblx0fVxuXHRpZiAoaXNEaXJlY3RvcnkpIHtcblx0XHR0aGlzLmNvbXByZXNzID0gZmFsc2U7XG5cdH0gZWxzZSB7XG5cdFx0dGhpcy5jb21wcmVzcyA9IHRydWU7IC8vIGRlZmF1bHRcblx0XHRpZiAob3B0aW9ucy5jb21wcmVzcyAhPSBudWxsKSB0aGlzLmNvbXByZXNzID0gISFvcHRpb25zLmNvbXByZXNzO1xuXHR9XG5cdHRoaXMuZm9yY2VaaXA2NEZvcm1hdCA9ICEhb3B0aW9ucy5mb3JjZVppcDY0Rm9ybWF0O1xufVxuXG5FbnRyeS5XQUlUSU5HX0ZPUl9NRVRBREFUQSA9IDA7XG5FbnRyeS5SRUFEWV9UT19QVU1QX0ZJTEVfREFUQSA9IDE7XG5FbnRyeS5GSUxFX0RBVEFfSU5fUFJPR1JFU1MgPSAyO1xuRW50cnkuRklMRV9EQVRBX0RPTkUgPSAzO1xuRW50cnkucHJvdG90eXBlLnNldExhc3RNb2REYXRlID0gZnVuY3Rpb24gKGRhdGUpIHtcblx0dmFyIGRvc0RhdGVUaW1lID0gZGF0ZVRvRG9zRGF0ZVRpbWUoZGF0ZSk7XG5cdHRoaXMubGFzdE1vZEZpbGVUaW1lID0gZG9zRGF0ZVRpbWUudGltZTtcblx0dGhpcy5sYXN0TW9kRmlsZURhdGUgPSBkb3NEYXRlVGltZS5kYXRlO1xufTtcbkVudHJ5LnByb3RvdHlwZS5zZXRGaWxlQXR0cmlidXRlc01vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xuXHRpZiAoKG1vZGUgJiAweGZmZmYpICE9PSBtb2RlKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIG1vZGUuIGV4cGVjdGVkOiAwIDw9IFwiICsgbW9kZSArIFwiIDw9IFwiICsgMHhmZmZmKTtcblx0Ly8gaHR0cDovL3VuaXguc3RhY2tleGNoYW5nZS5jb20vcXVlc3Rpb25zLzE0NzA1L3RoZS16aXAtZm9ybWF0cy1leHRlcm5hbC1maWxlLWF0dHJpYnV0ZS8xNDcyNyMxNDcyN1xuXHR0aGlzLmV4dGVybmFsRmlsZUF0dHJpYnV0ZXMgPSAobW9kZSA8PCAxNikgPj4+IDA7XG59O1xuLy8gZG9GaWxlRGF0YVB1bXAoKSBzaG91bGQgbm90IGNhbGwgcHVtcEVudHJpZXMoKSBkaXJlY3RseS4gc2VlIGlzc3VlICM5LlxuRW50cnkucHJvdG90eXBlLnNldEZpbGVEYXRhUHVtcEZ1bmN0aW9uID0gZnVuY3Rpb24gKGRvRmlsZURhdGFQdW1wKSB7XG5cdHRoaXMuZG9GaWxlRGF0YVB1bXAgPSBkb0ZpbGVEYXRhUHVtcDtcblx0dGhpcy5zdGF0ZSA9IEVudHJ5LlJFQURZX1RPX1BVTVBfRklMRV9EQVRBO1xufTtcbkVudHJ5LnByb3RvdHlwZS51c2VaaXA2NEZvcm1hdCA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIChcblx0XHQodGhpcy5mb3JjZVppcDY0Rm9ybWF0KSB8fFxuXHRcdCh0aGlzLnVuY29tcHJlc3NlZFNpemUgIT0gbnVsbCAmJiB0aGlzLnVuY29tcHJlc3NlZFNpemUgPiAweGZmZmZmZmZlKSB8fFxuXHRcdCh0aGlzLmNvbXByZXNzZWRTaXplICE9IG51bGwgJiYgdGhpcy5jb21wcmVzc2VkU2l6ZSA+IDB4ZmZmZmZmZmUpIHx8XG5cdFx0KHRoaXMucmVsYXRpdmVPZmZzZXRPZkxvY2FsSGVhZGVyICE9IG51bGwgJiYgdGhpcy5yZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPiAweGZmZmZmZmZlKVxuXHQpO1xufVxudmFyIExPQ0FMX0ZJTEVfSEVBREVSX0ZJWEVEX1NJWkUgPSAzMDtcbnZhciBWRVJTSU9OX05FRURFRF9UT19FWFRSQUNUX1VURjggPSAyMDtcbnZhciBWRVJTSU9OX05FRURFRF9UT19FWFRSQUNUX1pJUDY0ID0gNDU7XG4vLyAzID0gdW5peC4gNjMgPSBzcGVjIHZlcnNpb24gNi4zXG52YXIgVkVSU0lPTl9NQURFX0JZID0gKDMgPDwgOCkgfCA2MztcbnZhciBGSUxFX05BTUVfSVNfVVRGOCA9IDEgPDwgMTE7XG52YXIgVU5LTk9XTl9DUkMzMl9BTkRfRklMRV9TSVpFUyA9IDEgPDwgMztcbkVudHJ5LnByb3RvdHlwZS5nZXRMb2NhbEZpbGVIZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG5cdHZhciBjcmMzMiA9IDA7XG5cdHZhciBjb21wcmVzc2VkU2l6ZSA9IDA7XG5cdHZhciB1bmNvbXByZXNzZWRTaXplID0gMDtcblx0aWYgKHRoaXMuY3JjQW5kRmlsZVNpemVLbm93bikge1xuXHRcdGNyYzMyID0gdGhpcy5jcmMzMjtcblx0XHRjb21wcmVzc2VkU2l6ZSA9IHRoaXMuY29tcHJlc3NlZFNpemU7XG5cdFx0dW5jb21wcmVzc2VkU2l6ZSA9IHRoaXMudW5jb21wcmVzc2VkU2l6ZTtcblx0fVxuXG5cdHZhciBmaXhlZFNpemVTdHVmZiA9IG5ldyBCdWZmZXIoTE9DQUxfRklMRV9IRUFERVJfRklYRURfU0laRSk7XG5cdHZhciBnZW5lcmFsUHVycG9zZUJpdEZsYWcgPSBGSUxFX05BTUVfSVNfVVRGODtcblx0aWYgKCF0aGlzLmNyY0FuZEZpbGVTaXplS25vd24pIGdlbmVyYWxQdXJwb3NlQml0RmxhZyB8PSBVTktOT1dOX0NSQzMyX0FORF9GSUxFX1NJWkVTO1xuXG5cdC8vIGxvY2FsIGZpbGUgaGVhZGVyIHNpZ25hdHVyZSAgICAgNCBieXRlcyAgKDB4MDQwMzRiNTApXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUoMHgwNDAzNGI1MCwgMCk7XG5cdC8vIHZlcnNpb24gbmVlZGVkIHRvIGV4dHJhY3QgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKFZFUlNJT05fTkVFREVEX1RPX0VYVFJBQ1RfVVRGOCwgNCk7XG5cdC8vIGdlbmVyYWwgcHVycG9zZSBiaXQgZmxhZyAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKGdlbmVyYWxQdXJwb3NlQml0RmxhZywgNik7XG5cdC8vIGNvbXByZXNzaW9uIG1ldGhvZCAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMuZ2V0Q29tcHJlc3Npb25NZXRob2QoKSwgOCk7XG5cdC8vIGxhc3QgbW9kIGZpbGUgdGltZSAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMubGFzdE1vZEZpbGVUaW1lLCAxMCk7XG5cdC8vIGxhc3QgbW9kIGZpbGUgZGF0ZSAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMubGFzdE1vZEZpbGVEYXRlLCAxMik7XG5cdC8vIGNyYy0zMiAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKGNyYzMyLCAxNCk7XG5cdC8vIGNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKGNvbXByZXNzZWRTaXplLCAxOCk7XG5cdC8vIHVuY29tcHJlc3NlZCBzaXplICAgICAgICAgICAgICAgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKHVuY29tcHJlc3NlZFNpemUsIDIyKTtcblx0Ly8gZmlsZSBuYW1lIGxlbmd0aCAgICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUodGhpcy51dGY4RmlsZU5hbWUubGVuZ3RoLCAyNik7XG5cdC8vIGV4dHJhIGZpZWxkIGxlbmd0aCAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKDAsIDI4KTtcblx0cmV0dXJuIEJ1ZmZlci5jb25jYXQoW1xuXHRcdGZpeGVkU2l6ZVN0dWZmLFxuXHRcdC8vIGZpbGUgbmFtZSAodmFyaWFibGUgc2l6ZSlcblx0XHR0aGlzLnV0ZjhGaWxlTmFtZSxcblx0XHQvLyBleHRyYSBmaWVsZCAodmFyaWFibGUgc2l6ZSlcblx0XHQvLyBubyBleHRyYSBmaWVsZHNcblx0XSk7XG59O1xudmFyIERBVEFfREVTQ1JJUFRPUl9TSVpFID0gMTY7XG52YXIgWklQNjRfREFUQV9ERVNDUklQVE9SX1NJWkUgPSAyNDtcbkVudHJ5LnByb3RvdHlwZS5nZXREYXRhRGVzY3JpcHRvciA9IGZ1bmN0aW9uICgpIHtcblx0aWYgKHRoaXMuY3JjQW5kRmlsZVNpemVLbm93bikge1xuXHRcdC8vIHRoZSBNYWMgQXJjaGl2ZSBVdGlsaXR5IHJlcXVpcmVzIHRoaXMgbm90IGJlIHByZXNlbnQgdW5sZXNzIHdlIHNldCBnZW5lcmFsIHB1cnBvc2UgYml0IDNcblx0XHRyZXR1cm4gbmV3IEJ1ZmZlcigwKTtcblx0fVxuXHRpZiAoIXRoaXMudXNlWmlwNjRGb3JtYXQoKSkge1xuXHRcdHZhciBidWZmZXIgPSBuZXcgQnVmZmVyKERBVEFfREVTQ1JJUFRPUl9TSVpFKTtcblx0XHQvLyBvcHRpb25hbCBzaWduYXR1cmUgKHJlcXVpcmVkIGFjY29yZGluZyB0byBBcmNoaXZlIFV0aWxpdHkpXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUoMHgwODA3NGI1MCwgMCk7XG5cdFx0Ly8gY3JjLTMyICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUodGhpcy5jcmMzMiwgNCk7XG5cdFx0Ly8gY29tcHJlc3NlZCBzaXplICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUodGhpcy5jb21wcmVzc2VkU2l6ZSwgOCk7XG5cdFx0Ly8gdW5jb21wcmVzc2VkIHNpemUgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdFx0YnVmZmVyLndyaXRlVUludDMyTEUodGhpcy51bmNvbXByZXNzZWRTaXplLCAxMik7XG5cdFx0cmV0dXJuIGJ1ZmZlcjtcblx0fSBlbHNlIHtcblx0XHQvLyBaSVA2NCBmb3JtYXRcblx0XHR2YXIgYnVmZmVyID0gbmV3IEJ1ZmZlcihaSVA2NF9EQVRBX0RFU0NSSVBUT1JfU0laRSk7XG5cdFx0Ly8gb3B0aW9uYWwgc2lnbmF0dXJlICh1bmtub3duIGlmIGFueW9uZSBjYXJlcyBhYm91dCB0aGlzKVxuXHRcdGJ1ZmZlci53cml0ZVVJbnQzMkxFKDB4MDgwNzRiNTAsIDApO1xuXHRcdC8vIGNyYy0zMiAgICAgICAgICAgICAgICAgICAgICAgICAgNCBieXRlc1xuXHRcdGJ1ZmZlci53cml0ZVVJbnQzMkxFKHRoaXMuY3JjMzIsIDQpO1xuXHRcdC8vIGNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgICAgOCBieXRlc1xuXHRcdHdyaXRlVUludDY0TEUoYnVmZmVyLCB0aGlzLmNvbXByZXNzZWRTaXplLCA4KTtcblx0XHQvLyB1bmNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgIDggYnl0ZXNcblx0XHR3cml0ZVVJbnQ2NExFKGJ1ZmZlciwgdGhpcy51bmNvbXByZXNzZWRTaXplLCAxNik7XG5cdFx0cmV0dXJuIGJ1ZmZlcjtcblx0fVxufTtcbnZhciBDRU5UUkFMX0RJUkVDVE9SWV9SRUNPUkRfRklYRURfU0laRSA9IDQ2O1xudmFyIFpJUDY0X0VYVEVOREVEX0lORk9STUFUSU9OX0VYVFJBX0ZJRUxEX1NJWkUgPSAyODtcbkVudHJ5LnByb3RvdHlwZS5nZXRDZW50cmFsRGlyZWN0b3J5UmVjb3JkID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgZml4ZWRTaXplU3R1ZmYgPSBuZXcgQnVmZmVyKENFTlRSQUxfRElSRUNUT1JZX1JFQ09SRF9GSVhFRF9TSVpFKTtcblx0dmFyIGdlbmVyYWxQdXJwb3NlQml0RmxhZyA9IEZJTEVfTkFNRV9JU19VVEY4O1xuXHRpZiAoIXRoaXMuY3JjQW5kRmlsZVNpemVLbm93bikgZ2VuZXJhbFB1cnBvc2VCaXRGbGFnIHw9IFVOS05PV05fQ1JDMzJfQU5EX0ZJTEVfU0laRVM7XG5cblx0dmFyIG5vcm1hbENvbXByZXNzZWRTaXplID0gdGhpcy5jb21wcmVzc2VkU2l6ZTtcblx0dmFyIG5vcm1hbFVuY29tcHJlc3NlZFNpemUgPSB0aGlzLnVuY29tcHJlc3NlZFNpemU7XG5cdHZhciBub3JtYWxSZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPSB0aGlzLnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlcjtcblx0dmFyIHZlcnNpb25OZWVkZWRUb0V4dHJhY3Q7XG5cdHZhciB6ZWllZkJ1ZmZlcjtcblx0aWYgKHRoaXMudXNlWmlwNjRGb3JtYXQoKSkge1xuXHRcdG5vcm1hbENvbXByZXNzZWRTaXplID0gMHhmZmZmZmZmZjtcblx0XHRub3JtYWxVbmNvbXByZXNzZWRTaXplID0gMHhmZmZmZmZmZjtcblx0XHRub3JtYWxSZWxhdGl2ZU9mZnNldE9mTG9jYWxIZWFkZXIgPSAweGZmZmZmZmZmO1xuXHRcdHZlcnNpb25OZWVkZWRUb0V4dHJhY3QgPSBWRVJTSU9OX05FRURFRF9UT19FWFRSQUNUX1pJUDY0O1xuXG5cdFx0Ly8gWklQNjQgZXh0ZW5kZWQgaW5mb3JtYXRpb24gZXh0cmEgZmllbGRcblx0XHR6ZWllZkJ1ZmZlciA9IG5ldyBCdWZmZXIoWklQNjRfRVhURU5ERURfSU5GT1JNQVRJT05fRVhUUkFfRklFTERfU0laRSk7XG5cdFx0Ly8gMHgwMDAxICAgICAgICAgICAgICAgICAgMiBieXRlcyAgICBUYWcgZm9yIHRoaXMgXCJleHRyYVwiIGJsb2NrIHR5cGVcblx0XHR6ZWllZkJ1ZmZlci53cml0ZVVJbnQxNkxFKDB4MDAwMSwgMCk7XG5cdFx0Ly8gU2l6ZSAgICAgICAgICAgICAgICAgICAgMiBieXRlcyAgICBTaXplIG9mIHRoaXMgXCJleHRyYVwiIGJsb2NrXG5cdFx0emVpZWZCdWZmZXIud3JpdGVVSW50MTZMRShaSVA2NF9FWFRFTkRFRF9JTkZPUk1BVElPTl9FWFRSQV9GSUVMRF9TSVpFIC0gNCwgMik7XG5cdFx0Ly8gT3JpZ2luYWwgU2l6ZSAgICAgICAgICAgOCBieXRlcyAgICBPcmlnaW5hbCB1bmNvbXByZXNzZWQgZmlsZSBzaXplXG5cdFx0d3JpdGVVSW50NjRMRSh6ZWllZkJ1ZmZlciwgdGhpcy51bmNvbXByZXNzZWRTaXplLCA0KTtcblx0XHQvLyBDb21wcmVzc2VkIFNpemUgICAgICAgICA4IGJ5dGVzICAgIFNpemUgb2YgY29tcHJlc3NlZCBkYXRhXG5cdFx0d3JpdGVVSW50NjRMRSh6ZWllZkJ1ZmZlciwgdGhpcy5jb21wcmVzc2VkU2l6ZSwgMTIpO1xuXHRcdC8vIFJlbGF0aXZlIEhlYWRlciBPZmZzZXQgIDggYnl0ZXMgICAgT2Zmc2V0IG9mIGxvY2FsIGhlYWRlciByZWNvcmRcblx0XHR3cml0ZVVJbnQ2NExFKHplaWVmQnVmZmVyLCB0aGlzLnJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciwgMjApO1xuXHRcdC8vIERpc2sgU3RhcnQgTnVtYmVyICAgICAgIDQgYnl0ZXMgICAgTnVtYmVyIG9mIHRoZSBkaXNrIG9uIHdoaWNoIHRoaXMgZmlsZSBzdGFydHNcblx0XHQvLyAob21pdClcblx0fSBlbHNlIHtcblx0XHR2ZXJzaW9uTmVlZGVkVG9FeHRyYWN0ID0gVkVSU0lPTl9ORUVERURfVE9fRVhUUkFDVF9VVEY4O1xuXHRcdHplaWVmQnVmZmVyID0gbmV3IEJ1ZmZlcigwKTtcblx0fVxuXG5cdC8vIGNlbnRyYWwgZmlsZSBoZWFkZXIgc2lnbmF0dXJlICAgNCBieXRlcyAgKDB4MDIwMTRiNTApXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUoMHgwMjAxNGI1MCwgMCk7XG5cdC8vIHZlcnNpb24gbWFkZSBieSAgICAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKFZFUlNJT05fTUFERV9CWSwgNCk7XG5cdC8vIHZlcnNpb24gbmVlZGVkIHRvIGV4dHJhY3QgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHZlcnNpb25OZWVkZWRUb0V4dHJhY3QsIDYpO1xuXHQvLyBnZW5lcmFsIHB1cnBvc2UgYml0IGZsYWcgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRShnZW5lcmFsUHVycG9zZUJpdEZsYWcsIDgpO1xuXHQvLyBjb21wcmVzc2lvbiBtZXRob2QgICAgICAgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRSh0aGlzLmdldENvbXByZXNzaW9uTWV0aG9kKCksIDEwKTtcblx0Ly8gbGFzdCBtb2QgZmlsZSB0aW1lICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUodGhpcy5sYXN0TW9kRmlsZVRpbWUsIDEyKTtcblx0Ly8gbGFzdCBtb2QgZmlsZSBkYXRlICAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUodGhpcy5sYXN0TW9kRmlsZURhdGUsIDE0KTtcblx0Ly8gY3JjLTMyICAgICAgICAgICAgICAgICAgICAgICAgICA0IGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUodGhpcy5jcmMzMiwgMTYpO1xuXHQvLyBjb21wcmVzc2VkIHNpemUgICAgICAgICAgICAgICAgIDQgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MzJMRShub3JtYWxDb21wcmVzc2VkU2l6ZSwgMjApO1xuXHQvLyB1bmNvbXByZXNzZWQgc2l6ZSAgICAgICAgICAgICAgIDQgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MzJMRShub3JtYWxVbmNvbXByZXNzZWRTaXplLCAyNCk7XG5cdC8vIGZpbGUgbmFtZSBsZW5ndGggICAgICAgICAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKHRoaXMudXRmOEZpbGVOYW1lLmxlbmd0aCwgMjgpO1xuXHQvLyBleHRyYSBmaWVsZCBsZW5ndGggICAgICAgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRSh6ZWllZkJ1ZmZlci5sZW5ndGgsIDMwKTtcblx0Ly8gZmlsZSBjb21tZW50IGxlbmd0aCAgICAgICAgICAgICAyIGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDE2TEUoMCwgMzIpO1xuXHQvLyBkaXNrIG51bWJlciBzdGFydCAgICAgICAgICAgICAgIDIgYnl0ZXNcblx0Zml4ZWRTaXplU3R1ZmYud3JpdGVVSW50MTZMRSgwLCAzNCk7XG5cdC8vIGludGVybmFsIGZpbGUgYXR0cmlidXRlcyAgICAgICAgMiBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQxNkxFKDAsIDM2KTtcblx0Ly8gZXh0ZXJuYWwgZmlsZSBhdHRyaWJ1dGVzICAgICAgICA0IGJ5dGVzXG5cdGZpeGVkU2l6ZVN0dWZmLndyaXRlVUludDMyTEUodGhpcy5leHRlcm5hbEZpbGVBdHRyaWJ1dGVzLCAzOCk7XG5cdC8vIHJlbGF0aXZlIG9mZnNldCBvZiBsb2NhbCBoZWFkZXIgNCBieXRlc1xuXHRmaXhlZFNpemVTdHVmZi53cml0ZVVJbnQzMkxFKG5vcm1hbFJlbGF0aXZlT2Zmc2V0T2ZMb2NhbEhlYWRlciwgNDIpO1xuXG5cdHJldHVybiBCdWZmZXIuY29uY2F0KFtcblx0XHRmaXhlZFNpemVTdHVmZixcblx0XHQvLyBmaWxlIG5hbWUgKHZhcmlhYmxlIHNpemUpXG5cdFx0dGhpcy51dGY4RmlsZU5hbWUsXG5cdFx0Ly8gZXh0cmEgZmllbGQgKHZhcmlhYmxlIHNpemUpXG5cdFx0emVpZWZCdWZmZXIsXG5cdFx0Ly8gZmlsZSBjb21tZW50ICh2YXJpYWJsZSBzaXplKVxuXHRcdC8vIGVtcHR5IGNvbW1lbnRcblx0XSk7XG59O1xuRW50cnkucHJvdG90eXBlLmdldENvbXByZXNzaW9uTWV0aG9kID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgTk9fQ09NUFJFU1NJT04gPSAwO1xuXHR2YXIgREVGTEFURV9DT01QUkVTU0lPTiA9IDg7XG5cdHJldHVybiB0aGlzLmNvbXByZXNzID8gREVGTEFURV9DT01QUkVTU0lPTiA6IE5PX0NPTVBSRVNTSU9OO1xufTtcblxuZnVuY3Rpb24gZGF0ZVRvRG9zRGF0ZVRpbWUoanNEYXRlKSB7XG5cdHZhciBkYXRlID0gMDtcblx0ZGF0ZSB8PSBqc0RhdGUuZ2V0RGF0ZSgpICYgMHgxZjsgLy8gMS0zMVxuXHRkYXRlIHw9ICgoanNEYXRlLmdldE1vbnRoKCkgKyAxKSAmIDB4ZikgPDwgNTsgLy8gMC0xMSwgMS0xMlxuXHRkYXRlIHw9ICgoanNEYXRlLmdldEZ1bGxZZWFyKCkgLSAxOTgwKSAmIDB4N2YpIDw8IDk7IC8vIDAtMTI4LCAxOTgwLTIxMDhcblxuXHR2YXIgdGltZSA9IDA7XG5cdHRpbWUgfD0gTWF0aC5mbG9vcihqc0RhdGUuZ2V0U2Vjb25kcygpIC8gMik7IC8vIDAtNTksIDAtMjkgKGxvc2Ugb2RkIG51bWJlcnMpXG5cdHRpbWUgfD0gKGpzRGF0ZS5nZXRNaW51dGVzKCkgJiAweDNmKSA8PCA1OyAvLyAwLTU5XG5cdHRpbWUgfD0gKGpzRGF0ZS5nZXRIb3VycygpICYgMHgxZikgPDwgMTE7IC8vIDAtMjNcblxuXHRyZXR1cm4ge2RhdGU6IGRhdGUsIHRpbWU6IHRpbWV9O1xufVxuXG5mdW5jdGlvbiB3cml0ZVVJbnQ2NExFKGJ1ZmZlciwgbiwgb2Zmc2V0KSB7XG5cdC8vIGNhbid0IHVzZSBiaXRzaGlmdCBoZXJlLCBiZWNhdXNlIEphdmFTY3JpcHQgb25seSBhbGxvd3MgYml0c2hpdGluZyBvbiAzMi1iaXQgaW50ZWdlcnMuXG5cdHZhciBoaWdoID0gTWF0aC5mbG9vcihuIC8gMHgxMDAwMDAwMDApO1xuXHR2YXIgbG93ID0gbiAlIDB4MTAwMDAwMDAwO1xuXHRidWZmZXIud3JpdGVVSW50MzJMRShsb3csIG9mZnNldCk7XG5cdGJ1ZmZlci53cml0ZVVJbnQzMkxFKGhpZ2gsIG9mZnNldCArIDQpO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Q2FsbGJhY2soZXJyKSB7XG5cdGlmIChlcnIpIHRocm93IGVycjtcbn1cblxudXRpbC5pbmhlcml0cyhCeXRlQ291bnRlciwgVHJhbnNmb3JtKTtcblxuZnVuY3Rpb24gQnl0ZUNvdW50ZXIob3B0aW9ucykge1xuXHRUcmFuc2Zvcm0uY2FsbCh0aGlzLCBvcHRpb25zKTtcblx0dGhpcy5ieXRlQ291bnQgPSAwO1xufVxuXG5CeXRlQ291bnRlci5wcm90b3R5cGUuX3RyYW5zZm9ybSA9IGZ1bmN0aW9uIChjaHVuaywgZW5jb2RpbmcsIGNiKSB7XG5cdHRoaXMuYnl0ZUNvdW50ICs9IGNodW5rLmxlbmd0aDtcblx0Y2IobnVsbCwgY2h1bmspO1xufTtcblxudXRpbC5pbmhlcml0cyhDcmMzMldhdGNoZXIsIFRyYW5zZm9ybSk7XG5cbmZ1bmN0aW9uIENyYzMyV2F0Y2hlcihvcHRpb25zKSB7XG5cdFRyYW5zZm9ybS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXHR0aGlzLmNyYzMyID0gMDtcbn1cblxuQ3JjMzJXYXRjaGVyLnByb3RvdHlwZS5fdHJhbnNmb3JtID0gZnVuY3Rpb24gKGNodW5rLCBlbmNvZGluZywgY2IpIHtcblx0dGhpcy5jcmMzMiA9IGNyYzMyLnVuc2lnbmVkKGNodW5rLCB0aGlzLmNyYzMyKTtcblx0Y2IobnVsbCwgY2h1bmspO1xufTsiXX0=
