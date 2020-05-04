pskruntimeRequire=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"@msgpack/msgpack":[function(require,module,exports){
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.MessagePack=t():e.MessagePack=t()}(this,(function(){return function(e){var t={};function r(n){if(t[n])return t[n].exports;var i=t[n]={i:n,l:!1,exports:{}};return e[n].call(i.exports,i,i.exports,r),i.l=!0,i.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(n,i,function(t){return e[t]}.bind(null,i));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";r.r(t),r.d(t,"encode",(function(){return I})),r.d(t,"decode",(function(){return N})),r.d(t,"decodeAsync",(function(){return Y})),r.d(t,"decodeArrayStream",(function(){return Z})),r.d(t,"decodeStream",(function(){return $})),r.d(t,"Decoder",(function(){return V})),r.d(t,"Encoder",(function(){return L})),r.d(t,"ExtensionCodec",(function(){return S})),r.d(t,"ExtData",(function(){return p})),r.d(t,"EXT_TIMESTAMP",(function(){return w})),r.d(t,"encodeDateToTimeSpec",(function(){return g})),r.d(t,"encodeTimeSpecToTimestamp",(function(){return v})),r.d(t,"decodeTimestampToTimeSpec",(function(){return x})),r.d(t,"encodeTimestampExtension",(function(){return b})),r.d(t,"decodeTimestampExtension",(function(){return U}));var n=function(e,t){var r="function"==typeof Symbol&&e[Symbol.iterator];if(!r)return e;var n,i,o=r.call(e),s=[];try{for(;(void 0===t||t-- >0)&&!(n=o.next()).done;)s.push(n.value)}catch(e){i={error:e}}finally{try{n&&!n.done&&(r=o.return)&&r.call(o)}finally{if(i)throw i.error}}return s},i=function(){for(var e=[],t=0;t<arguments.length;t++)e=e.concat(n(arguments[t]));return e},o="undefined"!=typeof process&&"undefined"!=typeof TextEncoder&&"undefined"!=typeof TextDecoder;function s(e){for(var t=e.length,r=0,n=0;n<t;){var i=e.charCodeAt(n++);if(0!=(4294967168&i))if(0==(4294965248&i))r+=2;else{if(i>=55296&&i<=56319&&n<t){var o=e.charCodeAt(n);56320==(64512&o)&&(++n,i=((1023&i)<<10)+(1023&o)+65536)}r+=0==(4294901760&i)?3:4}else r++}return r}var a=o?new TextEncoder:void 0,h="undefined"!=typeof process?200:0;var u=(null==a?void 0:a.encodeInto)?function(e,t,r){a.encodeInto(e,t.subarray(r))}:function(e,t,r){t.set(a.encode(e),r)};function c(e,t,r){for(var n=t,o=n+r,s=[],a="";n<o;){var h=e[n++];if(0==(128&h))s.push(h);else if(192==(224&h)){var u=63&e[n++];s.push((31&h)<<6|u)}else if(224==(240&h)){u=63&e[n++];var c=63&e[n++];s.push((31&h)<<12|u<<6|c)}else if(240==(248&h)){var f=(7&h)<<18|(u=63&e[n++])<<12|(c=63&e[n++])<<6|63&e[n++];f>65535&&(f-=65536,s.push(f>>>10&1023|55296),f=56320|1023&f),s.push(f)}else s.push(h);s.length>=4096&&(a+=String.fromCharCode.apply(String,i(s)),s.length=0)}return s.length>0&&(a+=String.fromCharCode.apply(String,i(s))),a}var f=o?new TextDecoder:null,l="undefined"!=typeof process?200:0;var p=function(e,t){this.type=e,this.data=t};function d(e,t,r){var n=Math.floor(r/4294967296),i=r;e.setUint32(t,n),e.setUint32(t+4,i)}function y(e,t){return 4294967296*e.getInt32(t)+e.getUint32(t+4)}var w=-1;function v(e){var t=e.sec,r=e.nsec;if(t>=0&&r>=0&&t<=17179869183){if(0===r&&t<=4294967295){var n=new Uint8Array(4);return(s=new DataView(n.buffer)).setUint32(0,t),n}var i=t/4294967296,o=4294967295&t;n=new Uint8Array(8);return(s=new DataView(n.buffer)).setUint32(0,r<<2|3&i),s.setUint32(4,o),n}var s;n=new Uint8Array(12);return(s=new DataView(n.buffer)).setUint32(0,r),d(s,4,t),n}function g(e){var t=e.getTime(),r=Math.floor(t/1e3),n=1e6*(t-1e3*r),i=Math.floor(n/1e9);return{sec:r+i,nsec:n-1e9*i}}function b(e){return e instanceof Date?v(g(e)):null}function x(e){var t=new DataView(e.buffer,e.byteOffset,e.byteLength);switch(e.byteLength){case 4:return{sec:t.getUint32(0),nsec:0};case 8:var r=t.getUint32(0);return{sec:4294967296*(3&r)+t.getUint32(4),nsec:r>>>2};case 12:return{sec:y(t,4),nsec:t.getUint32(0)};default:throw new Error("Unrecognized data size for timestamp: "+e.length)}}function U(e){var t=x(e);return new Date(1e3*t.sec+t.nsec/1e6)}var m={type:w,encode:b,decode:U},S=function(){function e(){this.builtInEncoders=[],this.builtInDecoders=[],this.encoders=[],this.decoders=[],this.register(m)}return e.prototype.register=function(e){var t=e.type,r=e.encode,n=e.decode;if(t>=0)this.encoders[t]=r,this.decoders[t]=n;else{var i=1+t;this.builtInEncoders[i]=r,this.builtInDecoders[i]=n}},e.prototype.tryToEncode=function(e,t){for(var r=0;r<this.builtInEncoders.length;r++){if(null!=(n=this.builtInEncoders[r]))if(null!=(i=n(e,t)))return new p(-1-r,i)}for(r=0;r<this.encoders.length;r++){var n,i;if(null!=(n=this.encoders[r]))if(null!=(i=n(e,t)))return new p(r,i)}return e instanceof p?e:null},e.prototype.decode=function(e,t,r){var n=t<0?this.builtInDecoders[-1-t]:this.decoders[t];return n?n(e,t,r):new p(t,e)},e.defaultCodec=new e,e}();function E(e){return e instanceof Uint8Array?e:ArrayBuffer.isView(e)?new Uint8Array(e.buffer,e.byteOffset,e.byteLength):e instanceof ArrayBuffer?new Uint8Array(e):Uint8Array.from(e)}var B=function(e){var t="function"==typeof Symbol&&Symbol.iterator,r=t&&e[t],n=0;if(r)return r.call(e);if(e&&"number"==typeof e.length)return{next:function(){return e&&n>=e.length&&(e=void 0),{value:e&&e[n++],done:!e}}};throw new TypeError(t?"Object is not iterable.":"Symbol.iterator is not defined.")},L=function(){function e(e,t,r,n,i,o,s){void 0===e&&(e=S.defaultCodec),void 0===r&&(r=100),void 0===n&&(n=2048),void 0===i&&(i=!1),void 0===o&&(o=!1),void 0===s&&(s=!1),this.extensionCodec=e,this.context=t,this.maxDepth=r,this.initialBufferSize=n,this.sortKeys=i,this.forceFloat32=o,this.ignoreUndefined=s,this.pos=0,this.view=new DataView(new ArrayBuffer(this.initialBufferSize)),this.bytes=new Uint8Array(this.view.buffer)}return e.prototype.encode=function(e,t){if(t>this.maxDepth)throw new Error("Too deep objects in depth "+t);null==e?this.encodeNil():"boolean"==typeof e?this.encodeBoolean(e):"number"==typeof e?this.encodeNumber(e):"string"==typeof e?this.encodeString(e):this.encodeObject(e,t)},e.prototype.getUint8Array=function(){return this.bytes.subarray(0,this.pos)},e.prototype.ensureBufferSizeToWrite=function(e){var t=this.pos+e;this.view.byteLength<t&&this.resizeBuffer(2*t)},e.prototype.resizeBuffer=function(e){var t=new ArrayBuffer(e),r=new Uint8Array(t),n=new DataView(t);r.set(this.bytes),this.view=n,this.bytes=r},e.prototype.encodeNil=function(){this.writeU8(192)},e.prototype.encodeBoolean=function(e){!1===e?this.writeU8(194):this.writeU8(195)},e.prototype.encodeNumber=function(e){Number.isSafeInteger(e)?e>=0?e<128?this.writeU8(e):e<256?(this.writeU8(204),this.writeU8(e)):e<65536?(this.writeU8(205),this.writeU16(e)):e<4294967296?(this.writeU8(206),this.writeU32(e)):(this.writeU8(207),this.writeU64(e)):e>=-32?this.writeU8(224|e+32):e>=-128?(this.writeU8(208),this.writeI8(e)):e>=-32768?(this.writeU8(209),this.writeI16(e)):e>=-2147483648?(this.writeU8(210),this.writeI32(e)):(this.writeU8(211),this.writeI64(e)):this.forceFloat32?(this.writeU8(202),this.writeF32(e)):(this.writeU8(203),this.writeF64(e))},e.prototype.writeStringHeader=function(e){if(e<32)this.writeU8(160+e);else if(e<256)this.writeU8(217),this.writeU8(e);else if(e<65536)this.writeU8(218),this.writeU16(e);else{if(!(e<4294967296))throw new Error("Too long string: "+e+" bytes in UTF-8");this.writeU8(219),this.writeU32(e)}},e.prototype.encodeString=function(e){var t=e.length;if(o&&t>h){var r=s(e);this.ensureBufferSizeToWrite(5+r),this.writeStringHeader(r),u(e,this.bytes,this.pos),this.pos+=r}else{r=s(e);this.ensureBufferSizeToWrite(5+r),this.writeStringHeader(r),function(e,t,r){for(var n=e.length,i=r,o=0;o<n;){var s=e.charCodeAt(o++);if(0!=(4294967168&s)){if(0==(4294965248&s))t[i++]=s>>6&31|192;else{if(s>=55296&&s<=56319&&o<n){var a=e.charCodeAt(o);56320==(64512&a)&&(++o,s=((1023&s)<<10)+(1023&a)+65536)}0==(4294901760&s)?(t[i++]=s>>12&15|224,t[i++]=s>>6&63|128):(t[i++]=s>>18&7|240,t[i++]=s>>12&63|128,t[i++]=s>>6&63|128)}t[i++]=63&s|128}else t[i++]=s}}(e,this.bytes,this.pos),this.pos+=r}},e.prototype.encodeObject=function(e,t){var r=this.extensionCodec.tryToEncode(e,this.context);if(null!=r)this.encodeExtension(r);else if(Array.isArray(e))this.encodeArray(e,t);else if(ArrayBuffer.isView(e))this.encodeBinary(e);else{if("object"!=typeof e)throw new Error("Unrecognized object: "+Object.prototype.toString.apply(e));this.encodeMap(e,t)}},e.prototype.encodeBinary=function(e){var t=e.byteLength;if(t<256)this.writeU8(196),this.writeU8(t);else if(t<65536)this.writeU8(197),this.writeU16(t);else{if(!(t<4294967296))throw new Error("Too large binary: "+t);this.writeU8(198),this.writeU32(t)}var r=E(e);this.writeU8a(r)},e.prototype.encodeArray=function(e,t){var r,n,i=e.length;if(i<16)this.writeU8(144+i);else if(i<65536)this.writeU8(220),this.writeU16(i);else{if(!(i<4294967296))throw new Error("Too large array: "+i);this.writeU8(221),this.writeU32(i)}try{for(var o=B(e),s=o.next();!s.done;s=o.next()){var a=s.value;this.encode(a,t+1)}}catch(e){r={error:e}}finally{try{s&&!s.done&&(n=o.return)&&n.call(o)}finally{if(r)throw r.error}}},e.prototype.countWithoutUndefined=function(e,t){var r,n,i=0;try{for(var o=B(t),s=o.next();!s.done;s=o.next()){void 0!==e[s.value]&&i++}}catch(e){r={error:e}}finally{try{s&&!s.done&&(n=o.return)&&n.call(o)}finally{if(r)throw r.error}}return i},e.prototype.encodeMap=function(e,t){var r,n,i=Object.keys(e);this.sortKeys&&i.sort();var o=this.ignoreUndefined?this.countWithoutUndefined(e,i):i.length;if(o<16)this.writeU8(128+o);else if(o<65536)this.writeU8(222),this.writeU16(o);else{if(!(o<4294967296))throw new Error("Too large map object: "+o);this.writeU8(223),this.writeU32(o)}try{for(var s=B(i),a=s.next();!a.done;a=s.next()){var h=a.value,u=e[h];this.ignoreUndefined&&void 0===u||(this.encodeString(h),this.encode(u,t+1))}}catch(e){r={error:e}}finally{try{a&&!a.done&&(n=s.return)&&n.call(s)}finally{if(r)throw r.error}}},e.prototype.encodeExtension=function(e){var t=e.data.length;if(1===t)this.writeU8(212);else if(2===t)this.writeU8(213);else if(4===t)this.writeU8(214);else if(8===t)this.writeU8(215);else if(16===t)this.writeU8(216);else if(t<256)this.writeU8(199),this.writeU8(t);else if(t<65536)this.writeU8(200),this.writeU16(t);else{if(!(t<4294967296))throw new Error("Too large extension object: "+t);this.writeU8(201),this.writeU32(t)}this.writeI8(e.type),this.writeU8a(e.data)},e.prototype.writeU8=function(e){this.ensureBufferSizeToWrite(1),this.view.setUint8(this.pos,e),this.pos++},e.prototype.writeU8a=function(e){var t=e.length;this.ensureBufferSizeToWrite(t),this.bytes.set(e,this.pos),this.pos+=t},e.prototype.writeI8=function(e){this.ensureBufferSizeToWrite(1),this.view.setInt8(this.pos,e),this.pos++},e.prototype.writeU16=function(e){this.ensureBufferSizeToWrite(2),this.view.setUint16(this.pos,e),this.pos+=2},e.prototype.writeI16=function(e){this.ensureBufferSizeToWrite(2),this.view.setInt16(this.pos,e),this.pos+=2},e.prototype.writeU32=function(e){this.ensureBufferSizeToWrite(4),this.view.setUint32(this.pos,e),this.pos+=4},e.prototype.writeI32=function(e){this.ensureBufferSizeToWrite(4),this.view.setInt32(this.pos,e),this.pos+=4},e.prototype.writeF32=function(e){this.ensureBufferSizeToWrite(4),this.view.setFloat32(this.pos,e),this.pos+=4},e.prototype.writeF64=function(e){this.ensureBufferSizeToWrite(8),this.view.setFloat64(this.pos,e),this.pos+=8},e.prototype.writeU64=function(e){this.ensureBufferSizeToWrite(8),function(e,t,r){var n=r/4294967296,i=r;e.setUint32(t,n),e.setUint32(t+4,i)}(this.view,this.pos,e),this.pos+=8},e.prototype.writeI64=function(e){this.ensureBufferSizeToWrite(8),d(this.view,this.pos,e),this.pos+=8},e}(),A={};function I(e,t){void 0===t&&(t=A);var r=new L(t.extensionCodec,t.context,t.maxDepth,t.initialBufferSize,t.sortKeys,t.forceFloat32,t.ignoreUndefined);return r.encode(e,1),r.getUint8Array()}function T(e){return(e<0?"-":"")+"0x"+Math.abs(e).toString(16).padStart(2,"0")}var k=function(){function e(e,t){void 0===e&&(e=16),void 0===t&&(t=16),this.maxKeyLength=e,this.maxLengthPerKey=t,this.caches=[];for(var r=0;r<this.maxKeyLength;r++)this.caches.push([])}return e.prototype.canBeCached=function(e){return e>0&&e<=this.maxKeyLength},e.prototype.get=function(e,t,r){var n=this.caches[r-1],i=n.length;e:for(var o=0;o<i;o++){for(var s=n[o],a=s.bytes,h=0;h<r;h++)if(a[h]!==e[t+h])continue e;return s.value}return null},e.prototype.store=function(e,t){var r=this.caches[e.length-1],n={bytes:e,value:t};r.length>=this.maxLengthPerKey?r[Math.random()*r.length|0]=n:r.push(n)},e.prototype.decode=function(e,t,r){var n=this.get(e,t,r);if(null!=n)return n;var i=c(e,t,r),o=Uint8Array.prototype.slice.call(e,t,t+r);return this.store(o,i),i},e}(),M=function(e,t,r,n){return new(r||(r=Promise))((function(i,o){function s(e){try{h(n.next(e))}catch(e){o(e)}}function a(e){try{h(n.throw(e))}catch(e){o(e)}}function h(e){var t;e.done?i(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}h((n=n.apply(e,t||[])).next())}))},z=function(e,t){var r,n,i,o,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function a(o){return function(a){return function(o){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(i=2&o[0]?n.return:o[0]?n.throw||((i=n.return)&&i.call(n),0):n.next)&&!(i=i.call(n,o[1])).done)return i;switch(n=0,i&&(o=[2&o[0],i.value]),o[0]){case 0:case 1:i=o;break;case 4:return s.label++,{value:o[1],done:!1};case 5:s.label++,n=o[1],o=[0];continue;case 7:o=s.ops.pop(),s.trys.pop();continue;default:if(!(i=s.trys,(i=i.length>0&&i[i.length-1])||6!==o[0]&&2!==o[0])){s=0;continue}if(3===o[0]&&(!i||o[1]>i[0]&&o[1]<i[3])){s.label=o[1];break}if(6===o[0]&&s.label<i[1]){s.label=i[1],i=o;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(o);break}i[2]&&s.ops.pop(),s.trys.pop();continue}o=t.call(e,s)}catch(e){o=[6,e],n=0}finally{r=i=0}if(5&o[0])throw o[1];return{value:o[0]?o[1]:void 0,done:!0}}([o,a])}}},C=function(e){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var t,r=e[Symbol.asyncIterator];return r?r.call(e):(e="function"==typeof __values?__values(e):e[Symbol.iterator](),t={},n("next"),n("throw"),n("return"),t[Symbol.asyncIterator]=function(){return this},t);function n(r){t[r]=e[r]&&function(t){return new Promise((function(n,i){(function(e,t,r,n){Promise.resolve(n).then((function(t){e({value:t,done:r})}),t)})(n,i,(t=e[r](t)).done,t.value)}))}}},D=function(e){return this instanceof D?(this.v=e,this):new D(e)},P=function(e,t,r){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var n,i=r.apply(e,t||[]),o=[];return n={},s("next"),s("throw"),s("return"),n[Symbol.asyncIterator]=function(){return this},n;function s(e){i[e]&&(n[e]=function(t){return new Promise((function(r,n){o.push([e,t,r,n])>1||a(e,t)}))})}function a(e,t){try{(r=i[e](t)).value instanceof D?Promise.resolve(r.value.v).then(h,u):c(o[0][2],r)}catch(e){c(o[0][3],e)}var r}function h(e){a("next",e)}function u(e){a("throw",e)}function c(e,t){e(t),o.shift(),o.length&&a(o[0][0],o[0][1])}},j=new DataView(new ArrayBuffer(0)),F=new Uint8Array(j.buffer),W=function(){try{j.getInt8(0)}catch(e){return e.constructor}throw new Error("never reached")}(),O=new W("Insufficient data"),K=new k,V=function(){function e(e,t,r,n,i,o,s,a){void 0===e&&(e=S.defaultCodec),void 0===r&&(r=4294967295),void 0===n&&(n=4294967295),void 0===i&&(i=4294967295),void 0===o&&(o=4294967295),void 0===s&&(s=4294967295),void 0===a&&(a=K),this.extensionCodec=e,this.context=t,this.maxStrLength=r,this.maxBinLength=n,this.maxArrayLength=i,this.maxMapLength=o,this.maxExtLength=s,this.cachedKeyDecoder=a,this.totalPos=0,this.pos=0,this.view=j,this.bytes=F,this.headByte=-1,this.stack=[]}return e.prototype.setBuffer=function(e){this.bytes=E(e),this.view=function(e){if(e instanceof ArrayBuffer)return new DataView(e);var t=E(e);return new DataView(t.buffer,t.byteOffset,t.byteLength)}(this.bytes),this.pos=0},e.prototype.appendBuffer=function(e){if(-1!==this.headByte||this.hasRemaining()){var t=this.bytes.subarray(this.pos),r=E(e),n=new Uint8Array(t.length+r.length);n.set(t),n.set(r,t.length),this.setBuffer(n)}else this.setBuffer(e)},e.prototype.hasRemaining=function(e){return void 0===e&&(e=1),this.view.byteLength-this.pos>=e},e.prototype.createNoExtraBytesError=function(e){var t=this.view,r=this.pos;return new RangeError("Extra "+(t.byteLength-r)+" byte(s) found at buffer["+e+"]")},e.prototype.decodeSingleSync=function(){var e=this.decodeSync();if(this.hasRemaining())throw this.createNoExtraBytesError(this.pos);return e},e.prototype.decodeSingleAsync=function(e){var t,r,n,i;return M(this,void 0,void 0,(function(){var o,s,a,h,u,c,f,l;return z(this,(function(p){switch(p.label){case 0:o=!1,p.label=1;case 1:p.trys.push([1,6,7,12]),t=C(e),p.label=2;case 2:return[4,t.next()];case 3:if((r=p.sent()).done)return[3,5];if(a=r.value,o)throw this.createNoExtraBytesError(this.totalPos);this.appendBuffer(a);try{s=this.decodeSync(),o=!0}catch(e){if(!(e instanceof W))throw e}this.totalPos+=this.pos,p.label=4;case 4:return[3,2];case 5:return[3,12];case 6:return h=p.sent(),n={error:h},[3,12];case 7:return p.trys.push([7,,10,11]),r&&!r.done&&(i=t.return)?[4,i.call(t)]:[3,9];case 8:p.sent(),p.label=9;case 9:return[3,11];case 10:if(n)throw n.error;return[7];case 11:return[7];case 12:if(o){if(this.hasRemaining())throw this.createNoExtraBytesError(this.totalPos);return[2,s]}throw c=(u=this).headByte,f=u.pos,l=u.totalPos,new RangeError("Insufficient data in parcing "+T(c)+" at "+l+" ("+f+" in the current buffer)")}}))}))},e.prototype.decodeArrayStream=function(e){return this.decodeMultiAsync(e,!0)},e.prototype.decodeStream=function(e){return this.decodeMultiAsync(e,!1)},e.prototype.decodeMultiAsync=function(e,t){return P(this,arguments,(function(){var r,n,i,o,s,a,h,u,c;return z(this,(function(f){switch(f.label){case 0:r=t,n=-1,f.label=1;case 1:f.trys.push([1,13,14,19]),i=C(e),f.label=2;case 2:return[4,D(i.next())];case 3:if((o=f.sent()).done)return[3,12];if(s=o.value,t&&0===n)throw this.createNoExtraBytesError(this.totalPos);this.appendBuffer(s),r&&(n=this.readArraySize(),r=!1,this.complete()),f.label=4;case 4:f.trys.push([4,9,,10]),f.label=5;case 5:return[4,D(this.decodeSync())];case 6:return[4,f.sent()];case 7:return f.sent(),0==--n?[3,8]:[3,5];case 8:return[3,10];case 9:if(!((a=f.sent())instanceof W))throw a;return[3,10];case 10:this.totalPos+=this.pos,f.label=11;case 11:return[3,2];case 12:return[3,19];case 13:return h=f.sent(),u={error:h},[3,19];case 14:return f.trys.push([14,,17,18]),o&&!o.done&&(c=i.return)?[4,D(c.call(i))]:[3,16];case 15:f.sent(),f.label=16;case 16:return[3,18];case 17:if(u)throw u.error;return[7];case 18:return[7];case 19:return[2]}}))}))},e.prototype.decodeSync=function(){e:for(;;){var e=this.readHeadByte(),t=void 0;if(e>=224)t=e-256;else if(e<192)if(e<128)t=e;else if(e<144){if(0!==(n=e-128)){this.pushMapState(n),this.complete();continue e}t={}}else if(e<160){if(0!==(n=e-144)){this.pushArrayState(n),this.complete();continue e}t=[]}else{var r=e-160;t=this.decodeUtf8String(r,0)}else if(192===e)t=null;else if(194===e)t=!1;else if(195===e)t=!0;else if(202===e)t=this.readF32();else if(203===e)t=this.readF64();else if(204===e)t=this.readU8();else if(205===e)t=this.readU16();else if(206===e)t=this.readU32();else if(207===e)t=this.readU64();else if(208===e)t=this.readI8();else if(209===e)t=this.readI16();else if(210===e)t=this.readI32();else if(211===e)t=this.readI64();else if(217===e){r=this.lookU8();t=this.decodeUtf8String(r,1)}else if(218===e){r=this.lookU16();t=this.decodeUtf8String(r,2)}else if(219===e){r=this.lookU32();t=this.decodeUtf8String(r,4)}else if(220===e){if(0!==(n=this.readU16())){this.pushArrayState(n),this.complete();continue e}t=[]}else if(221===e){if(0!==(n=this.readU32())){this.pushArrayState(n),this.complete();continue e}t=[]}else if(222===e){if(0!==(n=this.readU16())){this.pushMapState(n),this.complete();continue e}t={}}else if(223===e){if(0!==(n=this.readU32())){this.pushMapState(n),this.complete();continue e}t={}}else if(196===e){var n=this.lookU8();t=this.decodeBinary(n,1)}else if(197===e){n=this.lookU16();t=this.decodeBinary(n,2)}else if(198===e){n=this.lookU32();t=this.decodeBinary(n,4)}else if(212===e)t=this.decodeExtension(1,0);else if(213===e)t=this.decodeExtension(2,0);else if(214===e)t=this.decodeExtension(4,0);else if(215===e)t=this.decodeExtension(8,0);else if(216===e)t=this.decodeExtension(16,0);else if(199===e){n=this.lookU8();t=this.decodeExtension(n,1)}else if(200===e){n=this.lookU16();t=this.decodeExtension(n,2)}else{if(201!==e)throw new Error("Unrecognized type byte: "+T(e));n=this.lookU32();t=this.decodeExtension(n,4)}this.complete();for(var i=this.stack;i.length>0;){var o=i[i.length-1];if(0===o.type){if(o.array[o.position]=t,o.position++,o.position!==o.size)continue e;i.pop(),t=o.array}else{if(1===o.type){if(s=void 0,"string"!==(s=typeof t)&&"number"!==s)throw new Error("The type of key must be string or number but "+typeof t);o.key=t,o.type=2;continue e}if(o.map[o.key]=t,o.readCount++,o.readCount!==o.size){o.key=null,o.type=1;continue e}i.pop(),t=o.map}}return t}var s},e.prototype.readHeadByte=function(){return-1===this.headByte&&(this.headByte=this.readU8()),this.headByte},e.prototype.complete=function(){this.headByte=-1},e.prototype.readArraySize=function(){var e=this.readHeadByte();switch(e){case 220:return this.readU16();case 221:return this.readU32();default:if(e<160)return e-144;throw new Error("Unrecognized array type byte: "+T(e))}},e.prototype.pushMapState=function(e){if(e>this.maxMapLength)throw new Error("Max length exceeded: map length ("+e+") > maxMapLengthLength ("+this.maxMapLength+")");this.stack.push({type:1,size:e,key:null,readCount:0,map:{}})},e.prototype.pushArrayState=function(e){if(e>this.maxArrayLength)throw new Error("Max length exceeded: array length ("+e+") > maxArrayLength ("+this.maxArrayLength+")");this.stack.push({type:0,size:e,array:new Array(e),position:0})},e.prototype.decodeUtf8String=function(e,t){var r;if(e>this.maxStrLength)throw new Error("Max length exceeded: UTF-8 byte length ("+e+") > maxStrLength ("+this.maxStrLength+")");if(this.bytes.byteLength<this.pos+t+e)throw O;var n,i=this.pos+t;return n=this.stateIsMapKey()&&(null===(r=this.cachedKeyDecoder)||void 0===r?void 0:r.canBeCached(e))?this.cachedKeyDecoder.decode(this.bytes,i,e):o&&e>l?function(e,t,r){var n=e.subarray(t,t+r);return f.decode(n)}(this.bytes,i,e):c(this.bytes,i,e),this.pos+=t+e,n},e.prototype.stateIsMapKey=function(){return this.stack.length>0&&1===this.stack[this.stack.length-1].type},e.prototype.decodeBinary=function(e,t){if(e>this.maxBinLength)throw new Error("Max length exceeded: bin length ("+e+") > maxBinLength ("+this.maxBinLength+")");if(!this.hasRemaining(e+t))throw O;var r=this.pos+t,n=this.bytes.subarray(r,r+e);return this.pos+=t+e,n},e.prototype.decodeExtension=function(e,t){if(e>this.maxExtLength)throw new Error("Max length exceeded: ext length ("+e+") > maxExtLength ("+this.maxExtLength+")");var r=this.view.getInt8(this.pos+t),n=this.decodeBinary(e,t+1);return this.extensionCodec.decode(n,r,this.context)},e.prototype.lookU8=function(){return this.view.getUint8(this.pos)},e.prototype.lookU16=function(){return this.view.getUint16(this.pos)},e.prototype.lookU32=function(){return this.view.getUint32(this.pos)},e.prototype.readU8=function(){var e=this.view.getUint8(this.pos);return this.pos++,e},e.prototype.readI8=function(){var e=this.view.getInt8(this.pos);return this.pos++,e},e.prototype.readU16=function(){var e=this.view.getUint16(this.pos);return this.pos+=2,e},e.prototype.readI16=function(){var e=this.view.getInt16(this.pos);return this.pos+=2,e},e.prototype.readU32=function(){var e=this.view.getUint32(this.pos);return this.pos+=4,e},e.prototype.readI32=function(){var e=this.view.getInt32(this.pos);return this.pos+=4,e},e.prototype.readU64=function(){var e,t,r=(e=this.view,t=this.pos,4294967296*e.getUint32(t)+e.getUint32(t+4));return this.pos+=8,r},e.prototype.readI64=function(){var e=y(this.view,this.pos);return this.pos+=8,e},e.prototype.readF32=function(){var e=this.view.getFloat32(this.pos);return this.pos+=4,e},e.prototype.readF64=function(){var e=this.view.getFloat64(this.pos);return this.pos+=8,e},e}(),_={};function N(e,t){void 0===t&&(t=_);var r=new V(t.extensionCodec,t.context,t.maxStrLength,t.maxBinLength,t.maxArrayLength,t.maxMapLength,t.maxExtLength);return r.setBuffer(e),r.decodeSingleSync()}var R=function(e,t){var r,n,i,o,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function a(o){return function(a){return function(o){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(i=2&o[0]?n.return:o[0]?n.throw||((i=n.return)&&i.call(n),0):n.next)&&!(i=i.call(n,o[1])).done)return i;switch(n=0,i&&(o=[2&o[0],i.value]),o[0]){case 0:case 1:i=o;break;case 4:return s.label++,{value:o[1],done:!1};case 5:s.label++,n=o[1],o=[0];continue;case 7:o=s.ops.pop(),s.trys.pop();continue;default:if(!(i=s.trys,(i=i.length>0&&i[i.length-1])||6!==o[0]&&2!==o[0])){s=0;continue}if(3===o[0]&&(!i||o[1]>i[0]&&o[1]<i[3])){s.label=o[1];break}if(6===o[0]&&s.label<i[1]){s.label=i[1],i=o;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(o);break}i[2]&&s.ops.pop(),s.trys.pop();continue}o=t.call(e,s)}catch(e){o=[6,e],n=0}finally{r=i=0}if(5&o[0])throw o[1];return{value:o[0]?o[1]:void 0,done:!0}}([o,a])}}},H=function(e){return this instanceof H?(this.v=e,this):new H(e)},G=function(e,t,r){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var n,i=r.apply(e,t||[]),o=[];return n={},s("next"),s("throw"),s("return"),n[Symbol.asyncIterator]=function(){return this},n;function s(e){i[e]&&(n[e]=function(t){return new Promise((function(r,n){o.push([e,t,r,n])>1||a(e,t)}))})}function a(e,t){try{(r=i[e](t)).value instanceof H?Promise.resolve(r.value.v).then(h,u):c(o[0][2],r)}catch(e){c(o[0][3],e)}var r}function h(e){a("next",e)}function u(e){a("throw",e)}function c(e,t){e(t),o.shift(),o.length&&a(o[0][0],o[0][1])}};function X(e){if(null==e)throw new Error("Assertion Failure: value must not be null nor undefined")}function q(e){return null!=e[Symbol.asyncIterator]?e:function(e){return G(this,arguments,(function(){var t,r,n,i;return R(this,(function(o){switch(o.label){case 0:t=e.getReader(),o.label=1;case 1:o.trys.push([1,,9,10]),o.label=2;case 2:return[4,H(t.read())];case 3:return r=o.sent(),n=r.done,i=r.value,n?[4,H(void 0)]:[3,5];case 4:return[2,o.sent()];case 5:return X(i),[4,H(i)];case 6:return[4,o.sent()];case 7:return o.sent(),[3,2];case 8:return[3,10];case 9:return t.releaseLock(),[7];case 10:return[2]}}))}))}(e)}var J=function(e,t,r,n){return new(r||(r=Promise))((function(i,o){function s(e){try{h(n.next(e))}catch(e){o(e)}}function a(e){try{h(n.throw(e))}catch(e){o(e)}}function h(e){var t;e.done?i(e.value):(t=e.value,t instanceof r?t:new r((function(e){e(t)}))).then(s,a)}h((n=n.apply(e,t||[])).next())}))},Q=function(e,t){var r,n,i,o,s={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function a(o){return function(a){return function(o){if(r)throw new TypeError("Generator is already executing.");for(;s;)try{if(r=1,n&&(i=2&o[0]?n.return:o[0]?n.throw||((i=n.return)&&i.call(n),0):n.next)&&!(i=i.call(n,o[1])).done)return i;switch(n=0,i&&(o=[2&o[0],i.value]),o[0]){case 0:case 1:i=o;break;case 4:return s.label++,{value:o[1],done:!1};case 5:s.label++,n=o[1],o=[0];continue;case 7:o=s.ops.pop(),s.trys.pop();continue;default:if(!(i=s.trys,(i=i.length>0&&i[i.length-1])||6!==o[0]&&2!==o[0])){s=0;continue}if(3===o[0]&&(!i||o[1]>i[0]&&o[1]<i[3])){s.label=o[1];break}if(6===o[0]&&s.label<i[1]){s.label=i[1],i=o;break}if(i&&s.label<i[2]){s.label=i[2],s.ops.push(o);break}i[2]&&s.ops.pop(),s.trys.pop();continue}o=t.call(e,s)}catch(e){o=[6,e],n=0}finally{r=i=0}if(5&o[0])throw o[1];return{value:o[0]?o[1]:void 0,done:!0}}([o,a])}}};function Y(e,t){return void 0===t&&(t=_),J(this,void 0,void 0,(function(){var r;return Q(this,(function(n){return r=q(e),[2,new V(t.extensionCodec,t.context,t.maxStrLength,t.maxBinLength,t.maxArrayLength,t.maxMapLength,t.maxExtLength).decodeSingleAsync(r)]}))}))}function Z(e,t){void 0===t&&(t=_);var r=q(e);return new V(t.extensionCodec,t.context,t.maxStrLength,t.maxBinLength,t.maxArrayLength,t.maxMapLength,t.maxExtLength).decodeArrayStream(r)}function $(e,t){void 0===t&&(t=_);var r=q(e);return new V(t.extensionCodec,t.context,t.maxStrLength,t.maxBinLength,t.maxArrayLength,t.maxMapLength,t.maxExtLength).decodeStream(r)}}])}));

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\builds\\tmp\\pskruntime_intermediar.js":[function(require,module,exports){
(function (global){
global.pskruntimeLoadModules = function(){ 

	if(typeof $$.__runtimeModules["source-map-support"] === "undefined"){
		$$.__runtimeModules["source-map-support"] = require("source-map-support");
	}

	if(typeof $$.__runtimeModules["source-map"] === "undefined"){
		$$.__runtimeModules["source-map"] = require("source-map");
	}

	if(typeof $$.__runtimeModules["buffer-from"] === "undefined"){
		$$.__runtimeModules["buffer-from"] = require("buffer-from");
	}

	if(typeof $$.__runtimeModules["callflow"] === "undefined"){
		$$.__runtimeModules["callflow"] = require("callflow");
	}

	if(typeof $$.__runtimeModules["swarmutils"] === "undefined"){
		$$.__runtimeModules["swarmutils"] = require("swarmutils");
	}

	if(typeof $$.__runtimeModules["soundpubsub"] === "undefined"){
		$$.__runtimeModules["soundpubsub"] = require("soundpubsub");
	}

	if(typeof $$.__runtimeModules["pskbuffer"] === "undefined"){
		$$.__runtimeModules["pskbuffer"] = require("pskbuffer");
	}

	if(typeof $$.__runtimeModules["@msgpack/msgpack"] === "undefined"){
		$$.__runtimeModules["@msgpack/msgpack"] = require("@msgpack/msgpack");
	}

	if(typeof $$.__runtimeModules["psklogger"] === "undefined"){
		$$.__runtimeModules["psklogger"] = require("psklogger");
	}

	if(typeof $$.__runtimeModules["psk-security-context"] === "undefined"){
		$$.__runtimeModules["psk-security-context"] = require("psk-security-context");
	}

	if(typeof $$.__runtimeModules["syndicate"] === "undefined"){
		$$.__runtimeModules["syndicate"] = require("syndicate");
	}

	if(typeof $$.__runtimeModules["swarm-engine"] === "undefined"){
		$$.__runtimeModules["swarm-engine"] = require("swarm-engine");
	}
};
if (false) {
	pskruntimeLoadModules();
}
global.pskruntimeRequire = require;
if (typeof $$ !== "undefined") {
	$$.requireBundle("pskruntime");
}
require('source-map-support').install({});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"@msgpack/msgpack":"@msgpack/msgpack","buffer-from":"buffer-from","callflow":"callflow","psk-security-context":"psk-security-context","pskbuffer":"pskbuffer","psklogger":"psklogger","soundpubsub":"soundpubsub","source-map":"source-map","source-map-support":"source-map-support","swarm-engine":"swarm-engine","swarmutils":"swarmutils","syndicate":"syndicate"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\constants.js":[function(require,module,exports){
$$.CONSTANTS = {
    SWARM_FOR_EXECUTION:"swarm_for_execution",//TODO: remove
    INBOUND:"inbound",//TODO: remove
    OUTBOUND:"outbound",//TODO: remove
    PDS:"PrivateDataSystem", //TODO: remove
    CRL:"CommunicationReplicationLayer", //TODO: remove
    SWARM_RETURN: 'swarm_return', //TODO: remove
    BEFORE_INTERCEPTOR: 'before',//TODO: document
    AFTER_INTERCEPTOR: 'after'//TODO: document
};


$$.CONSTANTS.mixIn = function(otherConstants){
    for(let v in otherConstants){
        if($$.CONSTANTS[v] && $$.CONSTANTS[v] !== otherConstants[v]){
            $$.warn("Overwriting CONSTANT "+ v + " previous value " + $$.CONSTANTS[v] + "new value " + otherConstants[v]);
        }
        $$.CONSTANTS[v] = otherConstants[v];
    }
}

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\InterceptorRegistry.js":[function(require,module,exports){
(function (global){
// related to: SwarmSpace.SwarmDescription.createPhase()

function InterceptorRegistry() {
    const rules = new Map();

     global._CLASS_NAME = 'InterceptorRegistry';

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\loadLibrary.js":[function(require,module,exports){
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
            $$.syntaxError("Reusing already loaded library " + prefixName + "could be an error!");
        }
        return existing;
    }
    //var absolutePath = path.resolve(folder);
    return new SwarmLibrary(prefixName, folder);
}


},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\parallelJoinPoint.js":[function(require,module,exports){

var globalJoinCounter = 0;

function ParallelJoinPoint(swarm, callback, args){
    globalJoinCounter++;
    var channelId = "ParallelJoinPoint" + globalJoinCounter;
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
        $$.syntaxError("invalid join",swarm, "invalid function at join in swarm");
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
            $$.info(err);
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
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\serialJoinPoint.js":[function(require,module,exports){

var joinCounter = 0;

function SerialJoinPoint(swarm, callback, args){

    joinCounter++;

    var self = this;
    var channelId = "SerialJoinPoint" + joinCounter;

    if(typeof callback !== "function"){
        $$.syntaxError("unknown", swarm, "invalid function given to serial in swarm");
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
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\swarmDescription.js":[function(require,module,exports){
const OwM = require("swarmutils").OwM;

const swarmDescriptionsRegistry = {};
let currentInlineCounter = 0;

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
};


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
};


$$.fixSwarmName = function(shortName){
    let fullName;
    try{
        if(shortName && shortName.includes(".")) {
            fullName = shortName;
        } else {
            fullName = $$.libraryPrefix + "." + shortName;
        }

    } catch(err){
        $$.err(err);
    }
    return fullName;
};

function SwarmSpace(swarmType, utils) {
    let beesHealer = require("swarmutils").beesHealer;

    function getFullName(shortName){
        return $$.fixSwarmName(shortName);
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
            };
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
            }

            for(var v in privateVars){
                result.privateVars[v] = privateVars[v].init();
            }


            if(serialisedValues){
                beesHealer.jsonToNative(serialisedValues, result);
            }
            return result;
        };

        this.initialiseFunctions = function(valueObject, thisObject){

            for(var v in myFunctions){
                valueObject.myFunctions[v] = createPhase(thisObject, myFunctions[v], v);
            }

            localId++;
            valueObject.utilityFunctions = utils.createForObject(valueObject, thisObject, localId);

        };

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
                $$.syntaxError(" Undefined symbol " + property + " in swarm " + target.meta.swarmTypeName);
            }
            return undefined;
        };

        this.set = function(target, property, value, receiver){

            if(target.utilityFunctions.hasOwnProperty(property) || target.myFunctions.hasOwnProperty(property)) {
                $$.syntaxError(property);
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
        };

        this.apply = function(target, thisArg, argumentsList){
            console.log("Proxy apply");
            //var func = target[]
            //swarmGlobals.executionProvider.execute(null, thisArg, func, argumentsList)
        };

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

        return function(serialisedValues, initialisationContext){
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
                result.autoInit(initialisationContext);
                $$.fixMe("Reinstate somehow the next comment")
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
            $$.warn("Duplicate swarm description "+ swarmTypeName);
        }

        swarmDescriptionsRegistry[swarmTypeName] = description;
		//$$.registerSwarmDescription(libraryName, shortName, swarmTypeName, description);
        return description;
    };


    var self = this;
    $$.fixMe("This could generate memory leaks. Fix it later");
    this.inline = function inline(description, ...args){
        currentInlineCounter++;
        var desc = self.describe("inlineSwarm" + currentInlineCounter, description);
        var flow = desc();
        flow.start(...args);
        return flow;
    };

    this.create = function(){
        $$.err("Create APIs for creation of swarms was  removed. Use describe!");
    };

    this.continue = function(swarmTypeName, initialValues){
        if(!initialValues){
            initialValues = swarmTypeName;
            swarmTypeName = initialValues.meta.swarmTypeName;
        }

        swarmTypeName = getFullName(swarmTypeName);
        let desc = swarmDescriptionsRegistry[swarmTypeName];
        if(desc){
            return desc(initialValues);
        } else {
            $$.err(swarmTypeName,initialValues,
                "Failed to restart a swarm with type " + swarmTypeName + "\n Maybe different swarm space (used flow instead of swarm!?)");
        }
    };

    this.start = function(swarmTypeName, ctor, ...params){
        let ret = this.startWithContext(undefined, swarmTypeName, ctor, ...params);
        return ret;
    };

    this.startWithContext = function(context, swarmTypeName, ctor, ...params){
        swarmTypeName = getFullName(swarmTypeName);
        var desc = swarmDescriptionsRegistry[swarmTypeName];
        if(!desc){
            $$.syntaxError(null, swarmTypeName);
            return null;
        }
        let res = desc(undefined, context);
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


},{"./utilityFunctions/callflow":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\callflow.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\SwarmDebug.js":[function(require,module,exports){
(function (global){
/*
 Initial License: (c) Axiologic Research & Alboaie Sînică.
 Contributors: Axiologic Research , PrivateSky project
 Code License: LGPL or MIT.
 */

var util = require("util");
var fs = require("fs");
global.cprint = console.log;
global.wprint = console.warn;
global.dprint = console.debug;
global.eprint = console.error;


/**
 * Shortcut to JSON.stringify
 * @param obj
 */
global.J = function (obj) {
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
global.uncaughtExceptionString = "";
global.uncaughtExceptionExists = false;
if(typeof globalVerbosity == 'undefined'){
    global.globalVerbosity = false;
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
global.dprint = function (txt) {
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
global.aprint = function (txt) {
    console.log("DEBUG: [" + thisAdapter.nodeName + "]: " + txt);
}



/**
 * Utility function usually used in tests, exit current process after a while
 * @param msg
 * @param timeout
 */
global.delayExit = function (msg, retCode,timeout) {
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


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"fs":false,"util":"util"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\base.js":[function(require,module,exports){
var beesHealer = require("swarmutils").beesHealer;
var swarmDebug = require("./SwarmDebug");

exports.createForObject = function(valueObject, thisObject, localId){
	let ret = {};


	function getInnerValue(){
		return valueObject;
	}

	function runPhase(functName, args){
		var func = valueObject.myFunctions[functName];
		if(func){
			func.apply(thisObject, args);
		} else {
			$$.syntaxError(functName, valueObject, "Function " + functName + " does not exist!");
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

	function observe(callback, waitForMore, messageIdentityFilter){
		if(!waitForMore){
			waitForMore = function (){
				return false;
			}
		}

		ensureLocalId();

		$$.PSK_PubSub.subscribe(valueObject.localId, callback, waitForMore, messageIdentityFilter);
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

		setTimeout(()=>{
			$$.PSK_PubSub.publish(valueObject.localId, event);
		});
	}

	function getMeta(name){
		return valueObject.getMeta(name);
	}

	function setMeta(name, value){
		return valueObject.setMeta(name, value);
	}

	ret.setMeta			= setMeta;
	ret.getMeta			= getMeta;

	ret.notify          = notify;
	ret.getJSON    	    = getJSON;
	ret.toJSON          = toJSON;
	ret.observe         = observe;
	ret.inspect         = inspect;
	ret.join            = createParallel;
	ret.parallel        = createParallel;
	ret.serial          = createSerial;
	ret.valueOf         = valueOf;
	ret.actualize       = update;
	ret.runPhase        = runPhase;


	ret.getInnerValue   = getInnerValue;
	ret.toString        = toString;
	ret.constructor     = constructor;
	ret.setMetadata		= valueObject.setMeta.bind(valueObject);
	ret.getMetadata		= valueObject.getMeta.bind(valueObject);

	ret.autoInit		= null;
	return ret;

};

},{"../parallelJoinPoint":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\parallelJoinPoint.js","../serialJoinPoint":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\serialJoinPoint.js","./SwarmDebug":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\SwarmDebug.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\callflow.js":[function(require,module,exports){
exports.createForObject = function(valueObject, thisObject, localId){
	var ret = require("./base").createForObject(valueObject, thisObject, localId);
	return ret;
};
},{"./base":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\base.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\index.js":[function(require,module,exports){
//to look nice the requireModule on Node
require("./lib/psk-abstract-client");
const or = require('overwrite-require');
if ($$.environmentType === or.constants.BROWSER_ENVIRONMENT_TYPE) {
	require("./lib/psk-browser-client");
} else {
	require("./lib/psk-node-client");
}
},{"./lib/psk-abstract-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-abstract-client.js","./lib/psk-browser-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-browser-client.js","./lib/psk-node-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-node-client.js","overwrite-require":"overwrite-require"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-abstract-client.js":[function(require,module,exports){
/**********************  utility class **********************************/
function RequestManager(pollingTimeOut) {
    if (!pollingTimeOut) {
        pollingTimeOut = 1000; //1 second by default
    }

    const self = this;

    function Request(endPoint, initialSwarm, delayedStart) {
        let onReturnCallbacks = [];
        let onErrorCallbacks = [];
        let onCallbacks = [];
        const requestId = initialSwarm ? initialSwarm.meta.requestId : "weneedarequestid";
        initialSwarm = null;

        this.getRequestId = function () {
            return requestId;
        };

        this.on = function (phaseName, callback) {
            if (typeof phaseName != "string" && typeof callback != "function") {
                throw new Error("The first parameter should be a string and the second parameter should be a function");
            }

            onCallbacks.push({
                callback: callback,
                phase: phaseName
            });

            if (typeof delayedStart === "undefined") {
                self.poll(endPoint, this);
            }

            return this;
        };

        this.onReturn = function (callback) {
            onReturnCallbacks.push(callback);
            if (typeof delayedStart === "undefined") {
                self.poll(endPoint, this);
            }
            return this;
        };

        this.onError = function (callback) {
            if (onErrorCallbacks.indexOf(callback) !== -1) {
                onErrorCallbacks.push(callback);
            } else {
                console.log("Error callback already registered!");
            }
        };

        this.start = function () {
            if (typeof delayedStart !== "undefined") {
                self.poll(endPoint, this);
            }
        };

        this.dispatch = function (err, result) {
            if (result instanceof ArrayBuffer) {
                result = SwarmPacker.unpack(result);
            }

            result = typeof result === "string" ? JSON.parse(result) : result;

            result = OwM.prototype.convert(result);
            const resultReqId = result.getMeta("requestId");
            const phaseName = result.getMeta("phaseName");
            let onReturn = false;

            if (resultReqId === requestId) {
                onReturnCallbacks.forEach(function (c) {
                    c(null, result);
                    onReturn = true;
                });
                if (onReturn) {
                    onReturnCallbacks = [];
                    onErrorCallbacks = [];
                }

                onCallbacks.forEach(function (i) {
                    //console.log("XXXXXXXX:", phaseName , i);
                    if (phaseName === i.phase || i.phase === '*') {
                        i.callback(err, result);
                    }
                });
            }

            if (onReturnCallbacks.length === 0 && onCallbacks.length === 0) {
                self.unpoll(endPoint, this);
            }
        };

        this.dispatchError = function (err) {
            for (let i = 0; i < onErrorCallbacks.length; i++) {
                const errCb = onErrorCallbacks[i];
                errCb(err);
            }
        };

        this.off = function () {
            self.unpoll(endPoint, this);
        };
    }

    this.createRequest = function (remoteEndPoint, swarm, delayedStart) {
        return new Request(remoteEndPoint, swarm, delayedStart);
    };

    /* *************************** polling zone ****************************/

    const pollSet = {};

    const activeConnections = {};

    this.poll = function (remoteEndPoint, request) {
        let requests = pollSet[remoteEndPoint];
        if (!requests) {
            requests = {};
            pollSet[remoteEndPoint] = requests;
        }
        requests[request.getRequestId()] = request;
        pollingHandler();
    };

    this.unpoll = function (remoteEndPoint, request) {
        const requests = pollSet[remoteEndPoint];
        if (requests) {
            delete requests[request.getRequestId()];
            if (Object.keys(requests).length === 0) {
                delete pollSet[remoteEndPoint];
            }
        } else {
            console.log("Unpolling wrong request:", remoteEndPoint, request);
        }
    };

    function createPollThread(remoteEndPoint) {
        function reArm() {
            $$.remote.doHttpGet(remoteEndPoint, function (err, res) {
                let requests = pollSet[remoteEndPoint];
                if (err) {
                    for (const req_id in requests) {
                        if (!requests.hasOwnProperty(req_id)) {
                            return;
                        }

                        let err_handler = requests[req_id].dispatchError;
                        if (err_handler) {
                            err_handler(err);
                        }
                    }
                    activeConnections[remoteEndPoint] = false;
                } else {

                    for (const k in requests) {
                        if (!requests.hasOwnProperty(k)) {
                            return;
                        }

                        requests[k].dispatch(null, res);
                    }

                    if (Object.keys(requests).length !== 0) {
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

    function pollingHandler() {
        let setTimer = false;
        for (const remoteEndPoint in pollSet) {
            if (!pollSet.hasOwnProperty(remoteEndPoint)) {
                return;
            }

            if (!activeConnections[remoteEndPoint]) {
                createPollThread(remoteEndPoint);
                activeConnections[remoteEndPoint] = true;
            }
            setTimer = true;
        }
        if (setTimer) {
            setTimeout(pollingHandler, pollingTimeOut);
        }
    }

    setTimeout(pollingHandler, pollingTimeOut);
}

function urlEndWithSlash(url) {
    if (url[url.length - 1] !== "/") {
        url += "/";
    }
    return url;
}

/********************** main APIs on working with virtualMQ channels **********************************/
function HttpChannelClient(remoteEndPoint, channelName, options) {

    let clientType;
    const opts = {
        autoCreate: true,
        publicSignature: "no_signature_provided"
    };

    Object.keys(options).forEach((optName) => {
        opts[optName] = options[optName];
    });

    let channelCreated = false;
    function readyToBeUsed(){
        let res = false;

        if(clientType === HttpChannelClient.prototype.PRODUCER_CLIENT_TYPE){
            res = true;
        }
        if(clientType === HttpChannelClient.prototype.CONSUMER_CLIENT_TYPE){
            if(!options.autoCreate){
                res = true;
            }else{
                res = channelCreated;
            }
        }

        return res;
    }

    function encryptChannelName(channelName) {
        return $$.remote.base64Encode(channelName);
    }

    function CatchAll(swarmName, phaseName, callback) { //same interface as Request
        const requestId = requestsCounter++;
        this.getRequestId = function () {
            return "swarmName" + "phaseName" + requestId;
        };

        this.dispatch = function (err, result) {
            /*result = OwM.prototype.convert(result);
            const currentPhaseName = result.getMeta("phaseName");
            const currentSwarmName = result.getMeta("swarmTypeName");
            if ((currentSwarmName === swarmName || swarmName === '*') && (currentPhaseName === phaseName || phaseName === '*')) {
                return callback(err, result);
            }*/
            return callback(err, result);
        };
    }

    this.setSenderMode = function () {
        if (typeof clientType !== "undefined") {
            throw new Error(`HttpChannelClient is set as ${clientType}`);
        }
        clientType = HttpChannelClient.prototype.PRODUCER_CLIENT_TYPE;

        this.sendSwarm = function (swarmSerialization) {
            $$.remote.doHttpPost(getRemoteToSendMessage(remoteEndPoint, channelName), swarmSerialization, (err, res)=>{
                if(err){
                    console.log("Sending swarm failed", err);
                }else{
                    console.log("Swarm sent");
                }
            });
        };
    };

    this.setReceiverMode = function () {
        if (typeof clientType !== "undefined") {
            throw new Error(`HttpChannelClient is set as ${clientType}`);
        }
        clientType = HttpChannelClient.prototype.CONSUMER_CLIENT_TYPE;

        function createChannel(callback){
            if (!readyToBeUsed()) {
                $$.remote.doHttpPut(getRemoteToCreateChannel(), opts.publicSignature, (err) => {
                    if (err) {
                        if (err.statusCode !== 409) {
                            return callback(err);
                        }
                    }
                    channelCreated = true;
                    if(opts.enableForward){
                        console.log("Enabling forward");
                        $$.remote.doHttpPost(getUrlToEnableForward(), opts.publicSignature, (err, res)=>{
                            if(err){
                                console.log("Request to enable forward to zeromq failed", err);
                            }
                        });
                    }
                    return callback();
                });
            }
        }

        this.getReceiveAddress = function(){
            return getRemoteToSendMessage();
        };

        this.on = function (swarmId, swarmName, phaseName, callback) {
            const c = new CatchAll(swarmName, phaseName, callback);
            allCatchAlls.push({
                s: swarmName,
                p: phaseName,
                c: c
            });

           /* if (!readyToBeUsed()) {
                createChannel((err)=>{
                    $$.remote.requestManager.poll(getRemoteToReceiveMessage(), c);
                });
            } else {*/
                $$.remote.requestManager.poll(getRemoteToReceiveMessage(), c);
            /*}*/
        };

        this.off = function (swarmName, phaseName) {
            allCatchAlls.forEach(function (ca) {
                if ((ca.s === swarmName || swarmName === '*') && (phaseName === ca.p || phaseName === '*')) {
                    $$.remote.requestManager.unpoll(getRemoteToReceiveMessage(remoteEndPoint, domainInfo.domain), ca.c);
                }
            });
        };

        createChannel((err) => {
            if(err){
                console.log(err);
            }
        });

        $$.remote.createRequestManager();
    };

    const allCatchAlls = [];
    let requestsCounter = 0;

    this.uploadCSB = function (cryptoUid, binaryData, callback) {
        $$.remote.doHttpPost(baseOfRemoteEndPoint + "/CSB/" + cryptoUid, binaryData, callback);
    };

    this.downloadCSB = function (cryptoUid, callback) {
        $$.remote.doHttpGet(baseOfRemoteEndPoint + "/CSB/" + cryptoUid, callback);
    };

    function getRemoteToReceiveMessage() {
        return [urlEndWithSlash(remoteEndPoint), urlEndWithSlash(HttpChannelClient.prototype.RECEIVE_API_NAME), urlEndWithSlash(encryptChannelName(channelName))].join("");
    }

    function getRemoteToSendMessage() {
        return [urlEndWithSlash(remoteEndPoint), urlEndWithSlash(HttpChannelClient.prototype.SEND_API_NAME), urlEndWithSlash(encryptChannelName(channelName))].join("");
    }

    function getRemoteToCreateChannel() {
        return [urlEndWithSlash(remoteEndPoint), urlEndWithSlash(HttpChannelClient.prototype.CREATE_CHANNEL_API_NAME), urlEndWithSlash(encryptChannelName(channelName))].join("");
    }

    function getUrlToEnableForward() {
        return [urlEndWithSlash(remoteEndPoint), urlEndWithSlash(HttpChannelClient.prototype.FORWARD_CHANNEL_API_NAME), urlEndWithSlash(encryptChannelName(channelName))].join("");
    }
}

/********************** constants **********************************/
HttpChannelClient.prototype.RECEIVE_API_NAME = "receive-message";
HttpChannelClient.prototype.SEND_API_NAME = "send-message";
HttpChannelClient.prototype.CREATE_CHANNEL_API_NAME = "create-channel";
HttpChannelClient.prototype.FORWARD_CHANNEL_API_NAME = "forward-zeromq";
HttpChannelClient.prototype.PRODUCER_CLIENT_TYPE = "producer";
HttpChannelClient.prototype.CONSUMER_CLIENT_TYPE = "consumer";

/********************** initialisation stuff **********************************/
if (typeof $$ === "undefined") {
    $$ = {};
}

if (typeof $$.remote === "undefined") {
    $$.remote = {};

    function createRequestManager(timeOut) {
        const newRequestManager = new RequestManager(timeOut);
        Object.defineProperty($$.remote, "requestManager", {value: newRequestManager});
    }

    function registerHttpChannelClient(alias, remoteEndPoint, channelName, options) {
        $$.remote[alias] = new HttpChannelClient(remoteEndPoint, channelName, options);
    }

    Object.defineProperty($$.remote, "createRequestManager", {value: createRequestManager});
    Object.defineProperty($$.remote, "registerHttpChannelClient", {value: registerHttpChannelClient});

    $$.remote.doHttpPost = function (url, data, callback) {
        throw new Error("Overwrite this!");
    };

    $$.remote.doHttpPut = function (url, data, callback) {
        throw new Error("Overwrite this!");
    };

    $$.remote.doHttpGet = function doHttpGet(url, callback) {
        throw new Error("Overwrite this!");
    };

    $$.remote.base64Encode = function base64Encode(stringToEncode) {
        throw new Error("Overwrite this!");
    };

    $$.remote.base64Decode = function base64Decode(encodedString) {
        throw new Error("Overwrite this!");
    };
}

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-browser-client.js":[function(require,module,exports){
(function (Buffer){
function generateMethodForRequestWithData(httpMethod) {
    return function (url, data, callback) {
        const xhr = new XMLHttpRequest();

        xhr.onload = function () {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)) {
                const data = xhr.response;
                callback(undefined, data);
            } else {
                if(xhr.status>=400){
                    const error = new Error("An error occured. StatusCode: " + xhr.status);
                    callback({error: error, statusCode: xhr.status});
                } else {
                    console.log(`Status code ${xhr.status} received, response is ignored.`);
                }
            }
        };

        xhr.onerror = function (e) {
            callback(new Error("A network error occurred"));
        };

        xhr.open(httpMethod, url, true);
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
            if(ArrayBuffer.isView(data) || data instanceof ArrayBuffer) {
                xhr.setRequestHeader('Content-Type', 'application/octet-stream');

                /**
                 * Content-Length is an unsafe header and we cannot set it.
                 * When browser is making a request that is intercepted by a service worker,
                 * the Content-Length header is not set implicitly.
                 */
                xhr.setRequestHeader('X-Content-Length', data.byteLength);
            }
            xhr.send(data);
        }
    };
}


$$.remote.doHttpPost = generateMethodForRequestWithData('POST');

$$.remote.doHttpPut = generateMethodForRequestWithData('PUT');


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
        if (xhr.readyState === 4 && xhr.status == "200") {
            var contentType = xhr.getResponseHeader("Content-Type");
            if (contentType === "application/octet-stream") {
                let responseBuffer = this.response;

                let buffer = new Buffer(responseBuffer.byteLength);
                let view = new Uint8Array(responseBuffer);
                for (let i = 0; i < buffer.length; ++i) {
                    buffer[i] = view[i];
                }
                callback(undefined, buffer);
            }
            else{
                callback(undefined, xhr.response);
            }
        } else {
            const error = new Error("An error occurred. StatusCode: " + xhr.status);

            callback({error: error, statusCode: xhr.status});
        }
    };
    xhr.onerror = function (e) {
        callback(new Error("A network error occurred"));
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
    };

    this.signSwarm = function(swarm, agent){
        swarm.meta.signature = agent;
    };
}



$$.remote.cryptoProvider = new CryptoProvider();

$$.remote.base64Encode = function base64Encode(stringToEncode){
    return window.btoa(stringToEncode);
};

$$.remote.base64Decode = function base64Decode(encodedString){
    return window.atob(encodedString);
};

}).call(this,require("buffer").Buffer)

},{"buffer":"buffer"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-node-client.js":[function(require,module,exports){
(function (Buffer){
require("./psk-abstract-client");

const http = require("http");
const https = require("https");
const URL = require("url");
const userAgent = 'PSK NodeAgent/0.0.1';
const signatureHeaderName = process.env.vmq_signature_header_name || "x-signature";


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

function generateMethodForRequestWithData(httpMethod) {
	return function (url, data, callback) {
		const innerUrl = URL.parse(url);

		const options = {
			hostname: innerUrl.hostname,
			path: innerUrl.pathname,
			port: parseInt(innerUrl.port),
			headers: {
				'User-Agent': userAgent,
				[signatureHeaderName]: 'replaceThisPlaceholderSignature'
			},
			method: httpMethod
		};

		const network = getNetworkForOptions(innerUrl);

		if (ArrayBuffer.isView(data) || Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
			if (!Buffer.isBuffer(data)) {
				data = Buffer.from(data);
			}

			options.headers['Content-Type'] = 'application/octet-stream';
			options.headers['Content-Length'] = data.length;
		}

		const req = network.request(options, (res) => {
			const {statusCode} = res;

			let error;
			if (statusCode >= 400) {
				error = new Error('Request Failed.\n' +
					`Status Code: ${statusCode}\n` +
					`URL: ${options.hostname}:${options.port}${options.path}`);
			}

			if (error) {
				callback({error: error, statusCode: statusCode});
				// free up memory
				res.resume();
				return;
			}

			let rawData = '';
			res.on('data', (chunk) => {
				rawData += chunk;
			});
			res.on('end', () => {
				try {
					callback(undefined, rawData, res.headers);
				} catch (err) {
					return callback(err);
				}finally {
					//trying to prevent getting ECONNRESET error after getting our response
					req.abort();
				}
			});
		}).on("error", (error) => {
			console.log(`[POST] ${url}`, error);
			callback(error);
		});

		if (data && data.pipe && typeof data.pipe === "function") {
			data.pipe(req);
			return;
		}

		if (typeof data !== 'string' && !Buffer.isBuffer(data) && !ArrayBuffer.isView(data)) {
			data = JSON.stringify(data);
		}

		req.write(data);
		req.end();
	};
}

$$.remote.doHttpPost = generateMethodForRequestWithData('POST');

$$.remote.doHttpPut = generateMethodForRequestWithData('PUT');

$$.remote.doHttpGet = function doHttpGet(url, callback){
    const innerUrl = URL.parse(url);

	const options = {
		hostname: innerUrl.hostname,
		path: innerUrl.pathname + (innerUrl.search || ''),
		port: parseInt(innerUrl.port),
		headers: {
			'User-Agent': userAgent,
            [signatureHeaderName]: 'someSignature'
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
			callback({error:error, statusCode:statusCode});
			// free up memory
			res.resume();
			return
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
				callback(null, rawData, res.headers);
			} catch (err) {
				console.log("Client error:", err);
			}finally {
				//trying to prevent getting ECONNRESET error after getting our response
				req.abort();
			}
		});
	});

	req.on("error", (error) => {
		if(error && error.code !== 'ECONNRESET'){
        	console.log(`[GET] ${url}`, error);
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

},{"./psk-abstract-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\lib\\psk-abstract-client.js","buffer":"buffer","http":false,"https":false,"url":false}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\Agent.js":[function(require,module,exports){
function Agent(agentId, publicKey){
    this.agentId = agentId;
    this.publicKey = publicKey;
}

module.exports = Agent;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\EncryptedSecret.js":[function(require,module,exports){
function EncryptedSecret(encryptedData, agentId){
    this.encryptedData = encryptedData;
    this.agentId = agentId;
}

module.exports = EncryptedSecret;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\PSKSignature.js":[function(require,module,exports){
function PSKSignature(message, signature, type, agentId) {
    this.message = message;
    this.signature = signature;
    this.type = type;
    this.agentId = agentId;
}

module.exports = PSKSignature;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\RawCSBSecurityContext.js":[function(require,module,exports){
function RawCSBSecurityContext(parentSecurityContext) {
    this.generateIdentity = parentSecurityContext.generateIdentity;
    this.getCurrentAgentIdentity = parentSecurityContext.getCurrentAgentIdentity;
    this.generateSeed = parentSecurityContext.generateRandom;
    this.getSeed = parentSecurityContext.getSecret;
    this.shareSeed = parentSecurityContext.shareSecret;
    this.sign = parentSecurityContext.sign;
    this.verify = parentSecurityContext.verify;
}

module.exports = RawCSBSecurityContext;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\RootCSBSecurityContext.js":[function(require,module,exports){
const SecurityContext = require("./SecurityContext");

function RootCSBSecurityContext() {
    const securityContext = new SecurityContext();

    this.generateIdentity = securityContext.generateIdentity;
    this.getCurrentAgentIdentity = securityContext.getCurrentAgentIdentity;
    this.generateSeed = securityContext.generateRandom;
    this.getSeed = securityContext.getSecret;
    this.shareSeed = securityContext.shareSecret;
    this.sign = securityContext.sign;
    this.verify = securityContext.verify;
}

module.exports = RootCSBSecurityContext;
},{"./SecurityContext":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\SecurityContext.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\SecurityContext.js":[function(require,module,exports){
const crypto = require("pskcrypto");
const swarmUtils = require("swarmutils");
const PSKSignature = require("./PSKSignature");
const EncryptedSecret = require("./EncryptedSecret");
const Agent = require("./Agent");

function SecurityContext() {

    const knownAgents = []; // contains pairs (agentId, publicKey)
    const privateKeys = {};
    const signType = "sha256";

    this.generateIdentity = (callback) => {
        crypto.generateKeyPair((err, publicKey, privateKey) => {
            if (err) {
                return callback(err);
            }

            const agent = new Agent($$.uidGenerator.safe_uuid(), publicKey);
            knownAgents.push(agent);
            privateKeys[agent.agentId] = privateKey;

            return callback(undefined, agent.agentId);
        });
    };

    this.getCurrentAgentIdentity = () => {
        return knownAgents[0].agentId;
    };

    this.getSecret = (readList, callback) => {
        const encSecret = readList.find(secret => secret.agentId === this.getCurrentAgentIdentity());
        if (!encSecret) {
            return callback(Error("The current agent cannot get the secret"));
        }

        callback(undefined, crypto.privateDecrypt(privateKeys[this.getCurrentAgentIdentity()], encSecret));
    };

    this.shareSecret = (secret, list, callback) => {
        const readList = [];
        list.forEach(agentId => {
            const publicKey = getPublicKey(agentId);
            readList.push(new EncryptedSecret(crypto.publicEncrypt(publicKey, secret), agentId));
        });

        callback(undefined, readList);
    };

    this.sign = (digest, writeList, all, callback) => {
        if (typeof all === "function") {
            callback = all;
            all = false;
        }

        if (!listHasElement(writeList, this.getCurrentAgentIdentity())) {
            return callback(Error("The current agent does not have signing privileges"));
        }

        if (!all) {
            const agentId = this.getCurrentAgentIdentity();
            const signature = crypto.sign(privateKeys[agentId], digest);
            return callback(undefined, new PSKSignature(digest, signature, signType, agentId));
        }

        const pskSignatures = [];
        const taskCounter = new swarmUtils.TaskCounter(() => {
            callback(undefined, pskSignatures);
        });

        taskCounter.increment(knownAgents.length);
        knownAgents.forEach(agent => {
            if (listHasElement(writeList, agent.agentId)) {
                const signature = crypto.sign(privateKeys[agent.agentId], digest);
                pskSignatures.push(new PSKSignature(digest, signature, signType, agent.agentId));
                taskCounter.decrement();
            }else{
                taskCounter.decrement();
            }
        })
    };

    this.verify = (pskSignature) => {
        return crypto.verify(getPublicKey(pskSignature.agentId), pskSignature.signature, pskSignature.message);
    };

    this.generateRandom = (len = 32) => {
        crypto.randomBytes(len);
    };

    //----------------------------- internal functions ------------------------------
    function listHasElement(list, element) {
        return !!list.find(el => element === el);
    }

    function getPublicKey(agentId) {
        const agent = knownAgents.find(ag => ag.agentId === agentId);
        if(!agent){
            return undefined;
        }

        return agent.publicKey;
    }

}

module.exports = SecurityContext;

},{"./Agent":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\Agent.js","./EncryptedSecret":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\EncryptedSecret.js","./PSKSignature":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\PSKSignature.js","pskcrypto":"pskcrypto","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\pskbuffer\\lib\\PSKBuffer.js":[function(require,module,exports){
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
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\GenericLoggerClient.js":[function(require,module,exports){
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

},{"./LogFactory":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LogFactory.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LogFactory.js":[function(require,module,exports){
function getTime() {
    const envTypes = require("overwrite-require").constants;
    switch($$.environmentType) {
        case envTypes.NODEJS_ENVIRONMENT_TYPE:
            const perf_hooksModule = 'perf_hooks';
            const {performance} = require(perf_hooksModule);
            return performance.now() + performance.timeOrigin;
        default:
            return Date.now();
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

},{"overwrite-require":"overwrite-require"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LoggerClient.js":[function(require,module,exports){
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

    public_methods = ["debug", "error", "info", "log", "warn"];

    function exposePublicMethod(target, methodName){
        let handler = function (meta = {}, ...params) {
            const logLevel = _getLogLevel(LogLevel.debug);
            return genericLoggerClient.log(logLevel, meta, params);
        };
        Object.defineProperty(handler, "name", {value: methodName});
        target[methodName] = handler;
    }

    let self = this;
    public_methods.forEach(function(methodName){
        exposePublicMethod(self, methodName);
    });

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
    this.event    = event;
    this.redirect = redirect;
}

module.exports = LoggerClient;

},{"../utils/LogLevel":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\LogLevel.js","./GenericLoggerClient":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\GenericLoggerClient.js","./LoggerInterface":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LoggerInterface.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LoggerInterface.js":[function(require,module,exports){
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

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\index.js":[function(require,module,exports){
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

},{"./GenericLoggerClient":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\GenericLoggerClient.js","./LogFactory":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LogFactory.js","./LoggerClient":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LoggerClient.js","./LoggerInterface":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\LoggerInterface.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\MessagePublisher.js":[function(require,module,exports){
const TransportInterface = require('./TransportInterface');
const utils = require('../utils');
const zeroMQModuleName = "zeromq";
const zeroMQ = require(zeroMQModuleName);


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

},{"../utils":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\index.js","./TransportInterface":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\TransportInterface.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\MessagePublisherForSandbox.js":[function(require,module,exports){
(function (global){
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
            console.error('Error while sending or serializing message from sandbox', e);
        }
    };

}

module.exports = MessagePublisherForSandbox;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./TransportInterface":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\TransportInterface.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\TransportInterface.js":[function(require,module,exports){
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

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\index.js":[function(require,module,exports){
const TransportInterface = require('./TransportInterface');
const MessagePublisher = require('./MessagePublisher');
const MessagePublisherForSandbox = require('./MessagePublisherForSandbox');

module.exports = {
    TransportInterface,
    MessagePublisher,
    MessagePublisherForSandbox
};

},{"./MessagePublisher":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\MessagePublisher.js","./MessagePublisherForSandbox":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\MessagePublisherForSandbox.js","./TransportInterface":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\TransportInterface.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessageSubscriber\\MessageSubscriber.js":[function(require,module,exports){
const zeroMQModuleName = "zeromq";
const zeroMQ = require(zeroMQModuleName);

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

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessageSubscriber\\index.js":[function(require,module,exports){
const MessageSubscriber = require('./MessageSubscriber');

module.exports = {MessageSubscriber};

},{"./MessageSubscriber":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessageSubscriber\\MessageSubscriber.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PSKLoggerClient\\GenericPSKLogger.js":[function(require,module,exports){
(function (global){
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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LoggerClient":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\LoggerClient\\index.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PSKLoggerClient\\index.js":[function(require,module,exports){
const Configurator     = require('../utils/Configurator');
const GenericPSKLogger = require('./GenericPSKLogger');

function getLogger() {
    let messagePublisher;

    if (process.env.context === 'sandbox') {
        const MessagePublisher = require('../MessagePublisher').MessagePublisherForSandbox;
        messagePublisher = new MessagePublisher();
    } else {
        const config = Configurator.getConfig();
        const MessagePublisher = require('../MessagePublisher').MessagePublisher;
        messagePublisher = new MessagePublisher(config.addressForPublishers);
    }

    return new GenericPSKLogger(messagePublisher);
}

module.exports = {
    getLogger
};

},{"../MessagePublisher":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\index.js","../utils/Configurator":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\Configurator.js","./GenericPSKLogger":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PSKLoggerClient\\GenericPSKLogger.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PubSubProxy\\PubSubProxy.js":[function(require,module,exports){
const zeroMQModuleName = "zeromq";
const zeroMQ = require(zeroMQModuleName);
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

},{"../utils":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\index.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PubSubProxy\\index.js":[function(require,module,exports){
const PubSubProxy = require('./PubSubProxy');

module.exports = {PubSubProxy};

},{"./PubSubProxy":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PubSubProxy\\PubSubProxy.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\BufferedSocket.js":[function(require,module,exports){
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

},{"./SocketType":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\SocketType.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\Configurator.js":[function(require,module,exports){
const config = {
    addressForPublishers: process.env.PSK_PUBLISH_LOGS_ADDR || 'tcp://127.0.0.1:7000',
    addressForSubscribers: process.env.PSK_SUBSCRIBE_FOR_LOGS_ADDR || 'tcp://127.0.0.1:7001',
    addressToCollector: process.env.PSK_COLLECTOR_ADDR || 'tcp://127.0.0.1:5558'
};

module.exports = {
    getConfig () {
        return Object.freeze(config);
    }
};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\EnvironmentDataProvider.js":[function(require,module,exports){
(function (global){
function getEnvironmentData () {
    const or = require("overwrite-require");
    let data = {origin: $$.environmentType};

    switch ($$.environmentType){
        case or.NODEJS_ENVIRONMENT_TYPE:
            const pathModule = "path";
            const path = require(pathModule);
            const osModule = "os";
            const os = require(osModule);
            const platform = os.platform();

            const processPath = process.argv[1];
            const processStartFile = path.basename(processPath);

            data.processStartFile = processStartFile;
            data.platform = platform;
            break;
        case or.BROWSER_ENVIRONMENT_TYPE:
            //todo: maybe we need some details here?
            break;
        default:
            break;
    }
    return data;
}

function getEnvironmentDataForDomain() {
    const osModule = "os";
    const os = require(osModule);
    const platform = os.platform();

    return {
        origin: 'domain',
        domain: process.env.PRIVATESKY_DOMAIN_NAME,
        platform: platform
    };
}

function getEnvironmentDataForAgent() {
    const osModule = "os";
    const os = require(osModule);
    const platform = os.platform();
    const envTypes = require("overwrite-require").constants;

    let data = {origin: "agent"};
    switch($$.environmentType){
        case envTypes.THREAD_ENVIRONMENT_TYPE:
            data.domain = process.env.PRIVATESKY_DOMAIN_NAME;
            data.agent = process.env.PRIVATESKY_AGENT_NAME;
            data.platform = platform;
            break;
        default:
            break;
    }
    return data;
}

let handler;

if(process.env.hasOwnProperty('PRIVATESKY_AGENT_NAME')) {
    handler = getEnvironmentDataForAgent;
} else if(process.env.hasOwnProperty('PRIVATESKY_DOMAIN_NAME')) {
    handler = getEnvironmentDataForDomain;
} else {
    handler = getEnvironmentData;
}

if(typeof global.$$.getEnvironmentData === "undefined"){
    global.$$.getEnvironmentData = handler;
}else{
    console.log("EnvironmentData handler already set.");
}

//no need to export anything directly
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"overwrite-require":"overwrite-require"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\LogLevel.js":[function(require,module,exports){
const LogLevel = {};

LogLevel[LogLevel["error"] = 0] = "error";
LogLevel[LogLevel["warn"]  = 1] = "warn";
LogLevel[LogLevel["info"]  = 2] = "info";
LogLevel[LogLevel["debug"] = 3] = "debug";
LogLevel[LogLevel["log"]   = 4] = "log";

module.exports = Object.freeze(LogLevel);

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\SocketType.js":[function(require,module,exports){
const SocketType = {};
SocketType[SocketType["connectable"] = 0] = "connectable"; // if .connect is called on socket
SocketType[SocketType["bindable"] = 1] = "bindable"; // if .bind is called on socket

module.exports = Object.freeze(SocketType);

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\index.js":[function(require,module,exports){
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

},{"./BufferedSocket":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\BufferedSocket.js","./Configurator":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\Configurator.js","./EnvironmentDataProvider":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\EnvironmentDataProvider.js","./LogLevel":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\LogLevel.js","./SocketType":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\SocketType.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\soundpubsub\\lib\\soundPubSub.js":[function(require,module,exports){
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
},{"swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\SwarmEngine.js":[function(require,module,exports){
function SwarmEngine(identity) {
    let myOwnIdentity = identity || SwarmEngine.prototype.ANONYMOUS_IDENTITY;

    const protectedFunctions = {};

    const SwarmPacker = require("swarmutils").SwarmPacker;
    //serializationType used when starting a swarm from this SwarmEngine instance
    let serializationType = SwarmPacker.prototype.JSON;

    const swarmInstancesCache = new Map();
    const powerCordCollection = new Map();

    this.updateIdentity = function (identify) {
        if (myOwnIdentity === SwarmEngine.prototype.ANONYMOUS_IDENTITY) {
            console.log("Updating my identity with", identify);
            myOwnIdentity = identify;
        } else {
            $$.err(`Trying to changing identity from "${myOwnIdentity}" to "${identify}"`);
        }
    };

    this.setSerializationType = function (type) {
        if (typeof SwarmPacker.getSerializer(type) !== "undefined") {
            serializationType = type;
        } else {
            $$.throw(`Unknown serialization type "${type}"`);
        }
    };

    this.plug = function (identity, powerCordImpl) {
        makePluggable(powerCordImpl);
        powerCordImpl.plug(identity, relay);

        powerCordCollection.set(identity, powerCordImpl);
    };

    this.unplug = function (identity) {
        const powerCord = powerCordCollection.get(identity);

        if (!powerCord) {
            //silent fail
            return;
        }

        powerCord.unplug();
        powerCordCollection.delete(identity);
    };

    function relay(swarmSerialization, ignoreMyIdentity) {
        try {

            const swarmutils = require('swarmutils');

            const OwM = swarmutils.OwM;
            const SwarmPacker = swarmutils.SwarmPacker;

            const swarmHeader = SwarmPacker.getHeader(swarmSerialization);
            const swarmTargetIdentity = swarmHeader.swarmTarget;

            if(typeof ignoreMyIdentity === "undefined" || !ignoreMyIdentity){
                if (myOwnIdentity === swarmTargetIdentity || myOwnIdentity === "*") {
                    const deserializedSwarm = OwM.prototype.convert(SwarmPacker.unpack(swarmSerialization));
                    protectedFunctions.execute_swarm(deserializedSwarm);
                    return;
                }
            }

            const targetPowerCord = powerCordCollection.get(swarmTargetIdentity) || powerCordCollection.get(SwarmEngine.prototype.WILD_CARD_IDENTITY);

            if (targetPowerCord) {
                //console.log(myOwnIdentity, "calling powercord", swarmTargetIdentity);
                targetPowerCord.sendSwarm(swarmSerialization);
                return;
            } else {
                $$.err(`Bad Swarm Engine configuration. No PowerCord for identity "${swarmTargetIdentity}" found.`);
            }
        } catch (superError) {
            console.log(superError);
        }
    }

    function getPowerCord(identity) {
        const powerCord = powerCordCollection.get(identity);

        if (!powerCord) {
            //should improve the search of powerCord based on * and self :D

            $$.throw(`No powerCord found for the identity "${identity}"`);
        }

        return powerCord;
    }

    /* ???
    swarmCommunicationStrategy.enableSwarmExecution(function(swarm){

    }); */

    function serialize(swarm) {
        const beesHealer = require("swarmutils").beesHealer;
        const simpleJson = beesHealer.asJSON(swarm, swarm.meta.phaseName, swarm.meta.args);
        const serializer = SwarmPacker.getSerializer(swarm.meta.serializationType || serializationType);
        return SwarmPacker.pack(simpleJson, serializer);
    }

    function createBaseSwarm(swarmTypeName) {
        const swarmutils = require('swarmutils');
        const OwM = swarmutils.OwM;

        const swarm = new OwM();
        swarm.setMeta("swarmId", $$.uidGenerator.safe_uuid());
        swarm.setMeta("requestId", swarm.getMeta("swarmId"));
        swarm.setMeta("swarmTypeName", swarmTypeName);
        swarm.setMeta(SwarmEngine.META_SECURITY_HOME_CONTEXT, myOwnIdentity);

        return swarm;
    }

    function cleanSwarmWaiter(swarmSerialisation) { // TODO: add better mechanisms to prevent memory leaks
        let swarmId = swarmSerialisation.meta.swarmId;
        let watcher = swarmInstancesCache[swarmId];

        if (!watcher) {
            $$.warn("Invalid swarm received: " + swarmId);
            return;
        }

        let args = swarmSerialisation.meta.args;
        args.push(swarmSerialisation);

        watcher.callback.apply(null, args);
        if (!watcher.keepAliveCheck()) {
            delete swarmInstancesCache[swarmId];
        }
    }

    protectedFunctions.startSwarmAs = function (identity, swarmTypeName, phaseName, ...args) {
        const swarm = createBaseSwarm(swarmTypeName);
        swarm.setMeta($$.swarmEngine.META_SECURITY_HOME_CONTEXT, myOwnIdentity);

        protectedFunctions.sendSwarm(swarm, SwarmEngine.EXECUTE_PHASE_COMMAND, identity, phaseName, args);
        return swarm;
    };

    protectedFunctions.sendSwarm = function (swarmAsVO, command, identity, phaseName, args) {

        swarmAsVO.setMeta("phaseName", phaseName);
        swarmAsVO.setMeta("target", identity);
        swarmAsVO.setMeta("command", command);
        swarmAsVO.setMeta("args", args);

        relay(serialize(swarmAsVO), true);
    };

    protectedFunctions.waitForSwarm = function (callback, swarm, keepAliveCheck) {

        function doLogic() {
            let swarmId = swarm.getInnerValue().meta.swarmId;
            let watcher = swarmInstancesCache.get(swarmId);
            if (!watcher) {
                watcher = {
                    swarm: swarm,
                    callback: callback,
                    keepAliveCheck: keepAliveCheck
                };
                swarmInstancesCache.set(swarmId, watcher);
            }
        }

        function filter() {
            return swarm.getInnerValue().meta.swarmId;
        }

        //$$.uidGenerator.wait_for_condition(condition,doLogic);
        swarm.observe(doLogic, null, filter);
    };

    protectedFunctions.execute_swarm = function (swarmOwM) {

        const swarmCommand = swarmOwM.getMeta('command');

        //console.log("Switching on command ", swarmCommand);
        switch (swarmCommand) {
            case SwarmEngine.prototype.EXECUTE_PHASE_COMMAND:
                let swarmId = swarmOwM.getMeta('swarmId');
                let swarmType = swarmOwM.getMeta('swarmTypeName');
                let instance = swarmInstancesCache.get(swarmId);

                let swarm;

                if (instance) {
                    swarm = instance.swarm;
                    swarm.actualize(swarmOwM);

                } else {
                    if (typeof $$.blockchain !== "undefined") {
                        swarm = $$.swarm.startWithContext($$.blockchain, swarmType);
                    } else {
                        swarm = $$.swarm.start(swarmType);
                    }

                    if (!swarm) {
                        throw new Error(`Unknown swarm with type <${swarmType}>. Check if this swarm is defined in the domain constitution!`);
                    } else {
                        swarm.actualize(swarmOwM);
                    }

                    /*swarm = $$.swarm.start(swarmType, swarmSerialisation);*/
                }
                swarm.runPhase(swarmOwM.meta.phaseName, swarmOwM.meta.args);
                break;
            case SwarmEngine.prototype.EXECUTE_INTERACT_PHASE_COMMAND:
                is.dispatch(swarmOwM);
                break;
            case SwarmEngine.prototype.RETURN_PHASE_COMMAND:
                is.dispatch(swarmOwM);
                break;
            default:
                $$.err(`Unrecognized swarm command ${swarmCommand}`);
        }
    };

    protectedFunctions.acknowledge = function(method, swarmId, swarmName, swarmPhase, cb){
        powerCordCollection.forEach((powerCord, identity)=>{
            if(typeof powerCord[method] === "function"){
                powerCord[method].call(powerCord, swarmId, swarmName, swarmPhase, cb);
            }
        });
    };

    require("./swarms")(protectedFunctions);
    const is = require("./interactions")(protectedFunctions);
}

Object.defineProperty(SwarmEngine.prototype, "EXECUTE_PHASE_COMMAND", {value: "executeSwarmPhase"});
Object.defineProperty(SwarmEngine.prototype, "EXECUTE_INTERACT_PHASE_COMMAND", {value: "executeInteractPhase"});
Object.defineProperty(SwarmEngine.prototype, "RETURN_PHASE_COMMAND", {value: "__return__"});

Object.defineProperty(SwarmEngine.prototype, "META_RETURN_CONTEXT", {value: "returnContext"});
Object.defineProperty(SwarmEngine.prototype, "META_SECURITY_HOME_CONTEXT", {value: "homeSecurityContext"});
Object.defineProperty(SwarmEngine.prototype, "META_WAITSTACK", {value: "waitStack"});

Object.defineProperty(SwarmEngine.prototype, "ANONYMOUS_IDENTITY", {value: "anonymous"});
Object.defineProperty(SwarmEngine.prototype, "SELF_IDENTITY", {value: "self"});
Object.defineProperty(SwarmEngine.prototype, "WILD_CARD_IDENTITY", {value: "*"});

function makePluggable(powerCord) {
    powerCord.plug = function (identity, powerTransfer) {
        powerCord.transfer = powerTransfer;
        powerCord.identity = identity;
    };

    powerCord.unplug = function () {
        powerCord.transfer = null;
    };

    Object.defineProperty(powerCord, "identity", {
        set: (value) => {
            if(typeof powerCord.__identity === "undefined"){
                powerCord.__identity = value;
            }
        }, get: () => {
            return powerCord.__identity;
        }
    });

    return powerCord;
}

module.exports = SwarmEngine;
},{"./interactions":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\interactions\\index.js","./swarms":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\swarms\\index.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\BootEngine.js":[function(require,module,exports){
function BootEngine(getSeed, getEDFS, initializeSwarmEngine, runtimeBundles, constitutionBundles) {

	if (typeof getSeed !== "function") {
		throw new Error("getSeed missing or not a function");
	}
	getSeed = promisify(getSeed);

	if (typeof getEDFS !== "function") {
		throw new Error("getEDFS missing or not a function");
	}
	getEDFS = promisify(getEDFS);

	if (typeof initializeSwarmEngine !== "function") {
		throw new Error("initializeSwarmEngine missing or not a function");
	}
	initializeSwarmEngine = promisify(initializeSwarmEngine);

	if (typeof runtimeBundles !== "undefined" && !Array.isArray(runtimeBundles)) {
		throw new Error("runtimeBundles is not array");
	}

	if (typeof constitutionBundles !== "undefined" && !Array.isArray(constitutionBundles)) {
		throw new Error("constitutionBundles is not array");
	}

	const EDFS = require('edfs');
	let edfs;
	const pskPath = require("swarmutils").path;

	const evalBundles = async (bundles, ignore) => {
		const listFiles = promisify(this.rawDossier.listFiles);
		const readFile = promisify(this.rawDossier.readFile);

		let fileList = await listFiles(pskPath.join(EDFS.constants.CSB.CODE_FOLDER, EDFS.constants.CSB.CONSTITUTION_FOLDER));

		fileList = bundles.filter(bundle => fileList.includes(bundle))
			.map(bundle => pskPath.join(EDFS.constants.CSB.CODE_FOLDER, EDFS.constants.CSB.CONSTITUTION_FOLDER, bundle));

		if (fileList.length !== bundles.length) {
			const message = `Some bundles missing. Expected to have ${JSON.stringify(bundles)} but got only ${JSON.stringify(fileList)}`;
			if (!ignore) {
				throw new Error(message);
			} else {
				console.log(message);
			}
		}


		for (let i = 0; i < fileList.length; i++) {
			var fileContent = await readFile(fileList[i]);
			eval(fileContent.toString());
		}
	};

	this.boot = function (callback) {
		const __boot = async () => {
			const seed = await getSeed();
			edfs = await getEDFS();
			this.rawDossier = edfs.loadRawDossier(seed);
			try{
                await evalBundles(runtimeBundles);
            }catch(err)
            {
                console.log(err);
            }
			await initializeSwarmEngine();
			if (typeof constitutionBundles !== "undefined") {
				try{
					await evalBundles(constitutionBundles, true);
				}catch(err)
				{
					console.log(err);
				}
			}
		};

		__boot()
			.then(() => callback(undefined, this.rawDossier))
			.catch(callback);
	};
}

function promisify(fn) {
	return function (...args) {
		return new Promise((resolve, reject) => {
			fn(...args, (err, ...res) => {
				if (err) {
					reject(err);
				} else {
					resolve(...res);
				}
			});
		});
	}
}

module.exports = BootEngine;

},{"edfs":false,"swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\IsolateBootScript.js":[function(require,module,exports){

async function getIsolatesWorker({workerData: {constitutions}, externalApi}) {
    const swarmUtils = require('swarmutils');
    const beesHealer = swarmUtils.beesHealer;
    const OwM = swarmUtils.OwM;
    const SwarmPacker = swarmUtils.SwarmPacker;
    const pskIsolatesModuleName = "pskisolates";
    const IsolatedVM = require(pskIsolatesModuleName);
    const {EventEmitter} = require('events');

    const config = IsolatedVM.IsolateConfig.defaultConfig;
    config.logger = {
        send([logChannel, logObject]) {
            $$.redirectLog(logChannel, logObject)
        }
    };

    const fs = require('fs');

    constitutions = constitutions.map(constitution => fs.readFileSync(constitution, 'utf8'));

    const isolate = await IsolatedVM.getDefaultIsolate({
        shimsBundle: constitutions[0],
        browserifyBundles: constitutions.slice(1),
        config: config,
        externalApi: externalApi
    });

    class IsolatesWrapper extends EventEmitter {
        postMessage(packedSwarm) {
            const swarm = SwarmPacker.unpack(packedSwarm);

            const phaseName = OwM.prototype.getMetaFrom(swarm, 'phaseName');
            const args = OwM.prototype.getMetaFrom(swarm, 'args');
            const serializedSwarm = beesHealer.asJSON(swarm, phaseName, args);
            const stringifiedSwarm = JSON.stringify(serializedSwarm);

            isolate.run(`
                if(typeof global.identitySet === "undefined"){
                    global.identitySet = true;
                  
				    $$.swarmEngine.updateIdentity(getIdentity.applySync(undefined, []));
				}
            `).then(() => {
                const powerCordRef = isolate.context.global.getSync('powerCord');
                const transferFnRef = powerCordRef.getSync('transfer');
                const swarmAsRef = new isolate.ivm.ExternalCopy(new Uint8Array(packedSwarm)).copyInto();
                // console.log(transferFnRef, swarmAsRef);

                transferFnRef.applyIgnored(powerCordRef.derefInto(), [swarmAsRef]);
            }).catch((err) => {
                this.emit('error', err);
            });

        }
    }

    const isolatesWrapper = new IsolatesWrapper();
    isolatesWrapper.globalSetSync = isolate.globalSetSync;

    isolate.globalSetSync('returnSwarm', (err, swarm) => {
        try {
            isolatesWrapper.emit('message', swarm);
        } catch (e) {
            console.log('Caught error', e);
        }
    });

    await isolate.run(`
            const se = require("swarm-engine");
            global.powerCord = new se.InnerIsolatePowerCord();
            $$.swarmEngine.plug($$.swarmEngine.WILD_CARD_IDENTITY, global.powerCord);
		`);

    //TODO: this might cause a memory leak
    setInterval(async () => {
        const rawIsolate = isolate.rawIsolate;
        const cpuTime = rawIsolate.cpuTime;
        const wallTime = rawIsolate.wallTime;

        const heapStatistics = await rawIsolate.getHeapStatistics();
        const activeCPUTime = (cpuTime[0] + cpuTime[1] / 1e9) * 1000;
        const totalCPUTime = (wallTime[0] + wallTime[1] / 1e9) * 1000;
        const idleCPUTime = totalCPUTime - activeCPUTime;
        $$.event('sandbox.metrics', {heapStatistics, activeCPUTime, totalCPUTime, idleCPUTime});

    }, 10 * 1000); // 10 seconds


    return isolatesWrapper;
}

module.exports = getIsolatesWorker;

},{"events":"events","fs":false,"swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\ThreadWorkerBootScript.js":[function(require,module,exports){
function boot() {
    const worker_threads ='worker_threads';
    const {parentPort, workerData} = require(worker_threads);

    process.on("uncaughtException", (err) => {
        console.error('unchaughtException inside worker', err);
        setTimeout(() => {
            process.exit(1);
        }, 100);
    });

    function getSeed(callback){
        let err;
        if (!workerData.hasOwnProperty('constitutionSeed') || typeof workerData.constitutionSeed !== "string") {
            err = new Error(`Missing or wrong type of constitutionSeed in worker data configuration: ${JSON.stringify(workerData)}`);
            if(!callback){
                throw err;
            }
        }
        if(callback){
            return callback(err, workerData.constitutionSeed);
        }
        return workerData.constitutionSeed;
    }

    let edfs;
    function getEDFS(callback){
        const EDFS = require("edfs");
        EDFS.attachWithSeed(getSeed(), (err, edfsInst) => {
            if (err) {
                return callback(err);
            }

            edfs = edfsInst;
            callback(null, edfs);
        });
    }

    function initializeSwarmEngine(callback){
        require('callflow').initialise();
        const swarmEngine = require('swarm-engine');

        swarmEngine.initialise(process.env.IDENTITY);
        const powerCord = new swarmEngine.InnerThreadPowerCord();

        $$.swarmEngine.plug($$.swarmEngine.WILD_CARD_IDENTITY, powerCord);

        parentPort.on('message', (packedSwarm) => {
            powerCord.transfer(packedSwarm);
        });

        edfs.bootRawDossier(workerData.constitutionSeed, (err, csbhandler) =>{
            if(err){
                $$.throwError(err);
            }
            callback();
        });
    }

    const BootEngine = require("./BootEngine.js");

    const booter = new BootEngine(getSeed, getEDFS, initializeSwarmEngine, ["pskruntime.js", "blockchain.js"], ["domain.js"]);

    booter.boot((err) => {
        if(err){
            throw err;
        }
        parentPort.postMessage('ready');
    });
}

boot();
//module.exports = boot.toString();

},{"./BootEngine.js":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\BootEngine.js","callflow":"callflow","edfs":false,"swarm-engine":"swarm-engine"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\domainBootScript.js":[function(require,module,exports){
const path = require('path');
//enabling life line to parent process
require(path.join(process.env.PSK_ROOT_INSTALATION_FOLDER, "psknode/core/utils/pingpongFork.js")).enableLifeLine();

const seed = process.env.PSK_DOMAIN_SEED;
//preventing children to access the env parameter
process.env.PSK_DOMAIN_SEED = undefined;

if (process.argv.length > 3) {
    process.env.PRIVATESKY_DOMAIN_NAME = process.argv[2];
} else {
    process.env.PRIVATESKY_DOMAIN_NAME = "AnonymousDomain" + process.pid;
}

process.env.PRIVATESKY_TMP = path.resolve(process.env.PRIVATESKY_TMP || "../tmp");
process.env.DOMAIN_WORKSPACE = path.resolve(process.env.PRIVATESKY_TMP, "domainsWorkspace", process.env.PRIVATESKY_DOMAIN_NAME);

const config = JSON.parse(process.env.config);

if (typeof config.constitution !== "undefined" && config.constitution !== "undefined") {
    process.env.PRIVATESKY_DOMAIN_CONSTITUTION = config.constitution;
}

if (typeof config.workspace !== "undefined" && config.workspace !== "undefined") {
    process.env.DOMAIN_WORKSPACE = config.workspace;
}

function boot() {
    const BootEngine = require("./BootEngine");

    const bootter = new BootEngine(getSeed, getEDFS, initializeSwarmEngine, ["pskruntime.js", "virtualMQ.js", "edfsBar.js"], ["blockchain.js"]);
    bootter.boot(function (err, archive) {
        if (err) {
            console.log(err);
            return;
        }
        try {
            plugPowerCords();
        } catch (err) {
            console.log("Caught an error will finishing booting process", err);
        }
    })
}

function getSeed(callback) {
    callback(undefined, self.seed);
}

let self = {seed};

function getEDFS(callback) {
    let EDFS = require("edfs");
    EDFS.attachWithSeed(seed, (err, edfsInst) => {
        if (err) {
            return callback(err);
        }

        self.edfs = edfsInst;
        callback(undefined, self.edfs);
    });
}

function initializeSwarmEngine(callback) {
    const EDFS = require("edfs");
    const bar = self.edfs.loadBar(self.seed);
    bar.readFile(EDFS.constants.CSB.DOMAIN_IDENTITY_FILE, (err, content) => {
        if (err) {
            return callback(err);
        }
        self.domainName = content.toString();
        $$.log(`Domain ${self.domainName} is booting...`);

        $$.PSK_PubSub = require("soundpubsub").soundPubSub;
        const se = require("swarm-engine");
        se.initialise(self.domainName);

        callback();
    });
}

function plugPowerCords() {
    const dossier = require("dossier");
    dossier.load(self.seed, "DomainIdentity", function (err, dossierHandler) {
        if (err) {
            throw err;
        }

        dossierHandler.startTransaction("DomainConfigTransaction", "getDomains").onReturn(function (err, domainConfigs) {
            if (err) {
                throw  err;
            }

            const se = require("swarm-engine");
            if (domainConfigs.length === 0) {
                console.log("No domain configuration found in CSB. Boot process will stop here...");
                return;
            }
            self.domainConf = domainConfigs[0];

            for (const alias in self.domainConf.communicationInterfaces) {
                if (self.domainConf.communicationInterfaces.hasOwnProperty(alias)) {
                    let remoteUrls = self.domainConf.communicationInterfaces[alias];
                    let powerCordToDomain = new se.SmartRemoteChannelPowerCord([remoteUrls.virtualMQ + "/"], self.domainConf.alias, remoteUrls.zeroMQ);
                    $$.swarmEngine.plug("*", powerCordToDomain);
                }
            }

            dossierHandler.startTransaction("Agents", "getAgents").onReturn(function (err, agents) {
                if (err) {
                    throw err;
                }

                if (agents.length === 0) {
                    agents.push({alias: 'system'});
                }

                const EDFS = require("edfs");
                const pskPath = require("swarmutils").path;
                const rawDossier = self.edfs.loadRawDossier(self.seed);
                rawDossier.readFile(pskPath.join(EDFS.constants.CSB.CODE_FOLDER, EDFS.constants.CSB.CONSTITUTION_FOLDER , "threadBoot.js"), (err, fileContents) => {
                    if (err) {
                        throw err;
                    }

                    agents.forEach(agent => {
                        const agentPC = new se.OuterThreadPowerCord(fileContents.toString(), true, seed);
                        $$.swarmEngine.plug(`${self.domainConf.alias}/agent/${agent.alias}`, agentPC);
                    });

                    $$.event('status.domains.boot', {name: self.domainConf.alias});
                    console.log("Domain boot successfully");
                });
            });
        })
    });
}

boot();
},{"./BootEngine":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\BootEngine.js","dossier":false,"edfs":false,"path":"path","soundpubsub":"soundpubsub","swarm-engine":"swarm-engine","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\index.js":[function(require,module,exports){
module.exports = {
    getIsolatesBootScript: function() {
        return require('./IsolateBootScript');
    },
    getThreadBootScript: function() {
        return `(${require("./ThreadWorkerBootScript")})()`;
    },
    executeDomainBootScript: function() {
        return require('./domainBootScript');
    }
};
},{"./IsolateBootScript":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\IsolateBootScript.js","./ThreadWorkerBootScript":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\ThreadWorkerBootScript.js","./domainBootScript":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\domainBootScript.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\interactions\\InteractionSpace.js":[function(require,module,exports){
function InteractionSpace(swarmEngineApi) {
    const listeners = {};
    const interactionTemplate = require('./interaction_template').getTemplateHandler(swarmEngineApi);

    function createThis(swarm) {
        const thisObj = interactionTemplate.createForObject(swarm);
        //todo: implement a proxy for public and private vars...
        return thisObj;
    }

    this.dispatch = function (swarm) {
        const {swarmId, swarmTypeName, phaseName, args} = swarm.meta;

        const genericKey = `*/${swarmTypeName}/${phaseName}`;
        const particularKey = `${swarmId}/${swarmTypeName}/${phaseName}`;

        const handlers = listeners[particularKey] || listeners[genericKey] || [];

        handlers.forEach(fn => {
            fn.call(createThis(swarm), ...args);
        });

        if (phaseName === $$.swarmEngine.RETURN_PHASE_COMMAND) {
            delete listeners[particularKey];
        }

        if (handlers.length === 0) {
            console.log(`No implementation for phase "${phaseName}" was found`);
        }
    };

    this.on = function (swarmId, swarmTypeName, phaseName, handler) {
        const key = `${swarmId}/${swarmTypeName}/${phaseName}`;
        if (typeof listeners[key] === "undefined") {
            listeners[key] = [];
        }
        listeners[key].push(handler);
        swarmEngineApi.acknowledge("on", swarmId, swarmTypeName, phaseName, handler);
    };

    this.off = function (swarmId = '*', swarmTypeName = '*', phaseName = '*', handler) {

        function escapeIfStar(str) {
            return str.replace("*", "\\*")
        }

        swarmId = escapeIfStar(swarmId);
        swarmTypeName = escapeIfStar(swarmTypeName);
        phaseName = escapeIfStar(phaseName);

        const regexString = `(${swarmId})\\/(${swarmTypeName})\\/(${phaseName})`;
        const reg = new RegExp(regexString);

        const keys = Object.keys(listeners);
        keys.forEach(key => {
            if (key.match(reg)) {
                const handlers = listeners[key];

                if (!handler) {
                    listeners[key] = [];
                } else {
                    listeners[key] = handlers.filter(fn => fn !== handler);
                }
            }
        });
        swarmEngineApi.acknowledge("off", swarmId, swarmTypeName, phaseName, handler);
    };
}

module.exports = InteractionSpace;

},{"./interaction_template":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\interactions\\interaction_template.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\interactions\\index.js":[function(require,module,exports){
module.exports = function (swarmEngineApi) {
    let cm = require("callflow");
    const InteractionSpace = require("./InteractionSpace");
    const is = new InteractionSpace(swarmEngineApi);

    $$.interactions = {};
    //cm.createSwarmEngine("interaction", require("./interaction_template"));
    $$.interaction = $$.interactions;

    $$.interactions.attachTo = function (swarmTypeName, interactionDescription) {
        Object.keys(interactionDescription).forEach(phaseName => {
            is.on('*', swarmTypeName, phaseName, interactionDescription[phaseName]);
        });
    };

    $$.interactions.startSwarmAs = function (identity, swarmTypeName, phaseName, ...args) {
        const swarm = swarmEngineApi.startSwarmAs(identity, swarmTypeName, phaseName, ...args);
        let swarmId = swarm.getMeta('swarmId');

        return {
            on: function (interactionDescription) {
                Object.keys(interactionDescription).forEach(phaseName => {
                    is.on(swarmId, swarmTypeName, phaseName, interactionDescription[phaseName]);
                });

                return this;
            },
            off: function (interactionDescription) {
                is.off(interactionDescription);

                return this;
            },
            onReturn: function (callback) {
                is.on(swarmId, swarmTypeName, $$.swarmEngine.RETURN_PHASE_COMMAND, callback);

                return this;
            }
        }
    };

    return is;
};

},{"./InteractionSpace":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\interactions\\InteractionSpace.js","callflow":"callflow"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\interactions\\interaction_template.js":[function(require,module,exports){
exports.getTemplateHandler = function (swarmEngineApi) {

    return {
        createForObject: function (valueObject, thisObject, localId) {
            let cm = require("callflow");

            let swarmFunction = function (destinationContext, phaseName, ...args) {
                //make the execution at level 0  (after all pending events) and wait to have a swarmId
                ret.observe(function () {
                    swarmEngineApi.sendSwarm(valueObject, $$.swarmEngine.EXECUTE_PHASE_COMMAND, destinationContext, phaseName, args);
                }, null, null);
                ret.notify();
                return thisObject;
            };

            function off() {
                const swarmId = valueObject.getMeta('swarmId');
                const swarmTypeName = valueObject.getMeta('swarmTypeName');

                swarmEngineApi.off(swarmId, swarmTypeName);
            }


            let ret = cm.createStandardAPIsForSwarms(valueObject, thisObject, localId);

            ret.swarm = swarmFunction;
            ret.swarmAs = swarmFunction;
            ret.off = off;

            delete ret.home;
            delete ret.onReturn;
            delete ret.onResult;

            delete ret.asyncReturn;
            delete ret.return;

            delete ret.autoInit;

            return ret;
        }
    }
};

},{"callflow":"callflow"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\InnerIsolatePowerCord.js":[function(require,module,exports){
(function (global){
function InnerIsolatePowerCord() {

    let setterTransfer;

    function transfer(...args) {

        args = args.map(arg => {
            if(arg.buffer) {
                // transforming UInt8Array to ArrayBuffer
                arg = arg.buffer;
            }

            return arg;
        });

        return setterTransfer(...args);
    }

    Object.defineProperty(this, "transfer", {
        set: (fn) => {
            setterTransfer = fn;
        }, get: () => {
            return setterTransfer ? transfer : undefined;
        }
    });

    this.sendSwarm = function (swarmSerialization) {
        try{
            if(swarmSerialization instanceof ArrayBuffer) {
                swarmSerialization = global.createCopyIntoExternalCopy(new Uint8Array(swarmSerialization));
            }

            returnSwarm.apply(undefined, [null, swarmSerialization])
                .catch((err) => {
                    console.log(err);
                })
        }catch(err){
           console.log(err);
        }

    };

}

module.exports = InnerIsolatePowerCord;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\InnerThreadPowerCord.js":[function(require,module,exports){
function InnerThreadPowerCord() {
    const worker_threads = 'worker_threads';
    const {parentPort} = require(worker_threads);

    this.sendSwarm = function (swarmSerialization) {
        parentPort.postMessage(swarmSerialization);
    };

}

module.exports = InnerThreadPowerCord;

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\OuterIsolatePowerCord.js":[function(require,module,exports){
function OuterIsolatePowerCord(energySource, numberOfWires = 1, apis) { // seed or array of constitution bundle paths
    const syndicate = require('syndicate');
    const bootScripts = require('../bootScripts');
    const pskIsolatesModuleName = "pskisolates";
    const pskisolates = require(pskIsolatesModuleName);
    let pool = null;


    function connectToEnergy() {
        const WorkerStrategies = syndicate.WorkerStrategies;

        if(!apis) {
            apis = {};
        }

        if(typeof apis.require === "undefined"){
            apis.require = function(name) {
                console.log('Creating proxy for', name);
                return pskisolates.createDeepReference(require(name));
            };
        }

        const config = {
            bootScript: bootScripts.getIsolatesBootScript(),
            maximumNumberOfWorkers: numberOfWires,
            workerStrategy: WorkerStrategies.ISOLATES,
            workerOptions: {
                workerData: {
                    constitutions: energySource
                },
                externalApi: apis
            }
        };

        pool = syndicate.createWorkerPool(config, (isolate) => {

            isolate.globalSetSync("getIdentity", () => {
                return superThis.identity;
            });
        });

    }

    let superThis = this;
    connectToEnergy();


    this.sendSwarm = function (swarmSerialization) {
        pool.addTask(swarmSerialization, (err, msg) => {
            if (err instanceof Error) {
                throw err;
            }

            this.transfer(msg.buffer || msg);
        });
    };

}

module.exports = OuterIsolatePowerCord;

},{"../bootScripts":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\index.js","syndicate":"syndicate"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\OuterThreadPowerCord.js":[function(require,module,exports){
function OuterThreadPowerCord(threadBootScript, evaluate= false, energySourceSeed, numberOfWires = 1) { // seed or array of constitution bundle paths
    const syndicate = require('syndicate');
    let pool = null;
    let self = this;

    function connectToEnergy() {
        const config = {
            maximumNumberOfWorkers: numberOfWires,
            workerStrategy: syndicate.WorkerStrategies.THREADS,
            bootScript: threadBootScript,
            workerOptions: {
                // cwd: process.env.DOMAIN_WORKSPACE,
                eval: evaluate,
                env: {
                    IDENTITY: self.identity
                },
                workerData: {
                    constitutionSeed: energySourceSeed
                }
            }
        };

        pool = syndicate.createWorkerPool(config);

    }

    this.sendSwarm = function (swarmSerialization) {
        pool.addTask(swarmSerialization, (err, msg) => {
            if (err instanceof Error) {
                throw err;
            }

            this.transfer(msg.buffer || msg);
        });
    };

    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if(p === 'identity') {
                connectToEnergy();
            }
        }
    })
}

module.exports = OuterThreadPowerCord;

},{"syndicate":"syndicate"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\RemoteChannelPairPowerCord.js":[function(require,module,exports){
const outbound = "outbound";
const inbound = "inbound";

function RemoteChannelPairPowerCord(host, channelName, receivingHost, receivingChannelName){

    receivingHost = receivingHost || host;
    receivingChannelName = receivingChannelName || generateChannelName();

    function setup(){
        //injecting necessary http methods
        require("../../psk-http-client");

        //this should be a channel that exists... we don't try to create
        $$.remote.registerHttpChannelClient(outbound, host, channelName, {autoCreate: false});
        $$.remote[outbound].setSenderMode();

        //maybe instead of receivingChannelName we sould use our identity? :-??
        $$.remote.registerHttpChannelClient(inbound, receivingHost, receivingChannelName, {autoCreate: true});
        $$.remote[inbound].setReceiverMode();

        $$.remote[inbound].on("*", "*", "*", function (err, swarmSerialization){
            const swarmUtils = require("swarmutils");
            const SwarmPacker = swarmUtils.SwarmPacker;
            let header = SwarmPacker.getHeader(swarmSerialization);
            if(header.swarmTarget === $$.remote[inbound].getReceiveAddress() && startedSwarms[header.swarmId] === true){
                //it is a swarm that we started
                let message = swarmUtils.OwM.prototype.convert(SwarmPacker.unpack(swarmSerialization));
                //we set the correct target
                message.setMeta("target", identityOfOurSwarmEngineInstance);
                //... and transfer to our swarm engine instance
                self.transfer(SwarmPacker.pack(message, SwarmPacker.getSerializer(header.serializationType)));
            }else{
                self.transfer(swarmSerialization);
            }
        });
    }

    let identityOfOurSwarmEngineInstance;
    let startedSwarms = {};
    const self = this;
    this.sendSwarm = function (swarmSerialization) {
        const swarmUtils = require("swarmutils");
        const SwarmPacker = swarmUtils.SwarmPacker;
        let header = SwarmPacker.getHeader(swarmSerialization);
        let message = swarmUtils.OwM.prototype.convert(SwarmPacker.unpack(swarmSerialization));

        if(typeof message.publicVars === "undefined"){
            startedSwarms[message.getMeta("swarmId")] = true;

            //it is the start of swarm...
            if(typeof identityOfOurSwarmEngineInstance === "undefined"){
                identityOfOurSwarmEngineInstance = message.getMeta("homeSecurityContext");
            }
            //we change homeSecurityContext with a url in order to get back the swarm when is done.
            message.setMeta("homeSecurityContext", $$.remote[inbound].getReceiveAddress());
            //send the updated version of it
            $$.remote[outbound].sendSwarm(SwarmPacker.pack(message, SwarmPacker.getSerializer(header.serializationType)));
        }else{
            //the swarm was not started from our pair swarm engine so we just send it
            $$.remote[outbound].sendSwarm(swarmSerialization);
        }
    };

    function generateChannelName(){
        return Math.random().toString(36).substr(2, 9);
    }

    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if(p === 'identity') {
                setup();
            }
        }
    });
}

module.exports = RemoteChannelPairPowerCord;
},{"../../psk-http-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\index.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\RemoteChannelPowerCord.js":[function(require,module,exports){
const inbound = "inbound";

function RemoteChannelPowerCord(receivingHost, receivingChannelName){

    receivingHost = receivingHost || host;
    receivingChannelName = receivingChannelName || generateChannelName();

    let setup = ()=>{
        //injecting necessary http methods
        require("../../psk-http-client");

        //maybe instead of receivingChannelName we sould use our identity? :-??
        $$.remote.registerHttpChannelClient(inbound, receivingHost, receivingChannelName, {autoCreate: true});
        $$.remote[inbound].setReceiverMode();

        this.on("*", "*", "*", (err, result)=>{
            if(!err){
                console.log("We got a swarm for channel");
                this.transfer(result);
            }else{
                console.log("Got an error from our channel", err);
            }
        });
    };

    this.on = function(swarmId, swarmName, swarmPhase, callback){
        $$.remote[inbound].on(swarmId, swarmName, swarmPhase, callback);
    };

    this.off = function(swarmId, swarmName, swarmPhase, callback){

    };

    this.sendSwarm = function (swarmSerialization) {
        const SwarmPacker = require("swarmutils").SwarmPacker;
        let header = SwarmPacker.getHeader(swarmSerialization);
        let target = header.swarmTarget;
        console.log("Sending swarm to", target);
        //test if target is an url... else complain
        if(true){
            $$.remote.doHttpPost(target, swarmSerialization, (err, res)=>{

            });
        }else{

        }
    };

    function generateChannelName(){
        return Math.random().toString(36).substr(2, 9);
    }

    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if(p === 'identity') {
                setup();
            }
        }
    });
}

module.exports = RemoteChannelPowerCord;
},{"../../psk-http-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\index.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\SmartRemoteChannelPowerCord.js":[function(require,module,exports){
(function (Buffer){
const inbound = "inbound";

function SmartRemoteChannelPowerCord(communicationAddrs, receivingChannelName, zeroMQAddress) {

    //here are stored, for later use, fav hosts for different identities
    const favoriteHosts = {};
    let receivingHost = Array.isArray(communicationAddrs) && communicationAddrs.length > 0 ? communicationAddrs[0] : "http://127.0.0.1";
    receivingChannelName = receivingChannelName || generateChannelName();

    function testIfZeroMQAvailable(suplimentaryCondition){
        let available = true;
        let zmqModule;
        try{
            let zmqName = "zeromq";
            zmqModule = require(zmqName);
        }catch(err){
            console.log("Zeromq not available at this moment.");
        }
        available = typeof zmqModule !== "undefined";
        if(typeof suplimentaryCondition !== "undefined"){
            available = available && suplimentaryCondition;
        }
        return available;
    }

    let setup = () => {
        //injecting necessary http methods
        require("../../psk-http-client");

        const opts = {autoCreate: true, enableForward: testIfZeroMQAvailable(typeof zeroMQAddress !== "undefined"), publicSignature: "none"};

        console.log(`\n[***] Using channel "${receivingChannelName}" on "${receivingHost}".\n`);
        //maybe instead of receivingChannelName we sould use our identity? :-??
        $$.remote.registerHttpChannelClient(inbound, receivingHost, receivingChannelName, opts);
        $$.remote[inbound].setReceiverMode();

        function toArrayBuffer(buffer) {
            const ab = new ArrayBuffer(buffer.length);
            const view = new Uint8Array(ab);
            for (let i = 0; i < buffer.length; ++i) {
                view[i] = buffer[i];
            }
            return ab;
        }


        if (testIfZeroMQAvailable(typeof zeroMQAddress !== "undefined")) {
            //let's connect to zmq
            const reqFactory = require("virtualmq").getVMQRequestFactory(receivingHost, zeroMQAddress);
            reqFactory.receiveMessageFromZMQ($$.remote.base64Encode(receivingChannelName), opts.publicSignature, (...args) => {
                console.log("zeromq connection established");
            }, (channelName, swarmSerialization) => {
                console.log("Look", channelName, swarmSerialization);
                handlerSwarmSerialization(swarmSerialization);
            });
        } else {
            $$.remote[inbound].on("*", "*", "*", (err, swarmSerialization) => {
                if (err) {
                    console.log("Got an error from our channel", err);
                    return;
                }

                if(Buffer && Buffer.isBuffer(swarmSerialization)){
                    swarmSerialization = toArrayBuffer(swarmSerialization);
                }

                handlerSwarmSerialization(swarmSerialization);
            });
        }
    };

    /* this.on = function(swarmId, swarmName, swarmPhase, callback){
         $$.remote[inbound].on(swarmId, swarmName, swarmPhase, callback);
     };

     this.off = function(swarmId, swarmName, swarmPhase, callback){

     };*/

    function getMetaFromIdentity(identity){
        const vRegex = /([a-zA-Z0-9]*|.)*\/agent\/([a-zA-Z0-9]+(\/)*)+/g;

        if(!identity.match(vRegex)){
            throw new Error("Invalid format. (Eg. domain[.subdomain]*/agent/[organisation/]*agentId)");
        }

        const separatorKeyword = "/agent/";
        let domain;
        let agentIdentity;

        const splitPoint = identity.indexOf(separatorKeyword);
        if(splitPoint !== -1){
            domain = identity.slice(0, splitPoint);
            agentIdentity = identity.slice(splitPoint+separatorKeyword.length);
        }

        return {domain, agentIdentity};
    }

    function handlerSwarmSerialization(swarmSerialization) {
        const swarmUtils = require("swarmutils");
        const SwarmPacker = swarmUtils.SwarmPacker;
        let header = SwarmPacker.getHeader(swarmSerialization);
        if (header.swarmTarget === $$.remote[inbound].getReceiveAddress() && startedSwarms[header.swarmId] === true) {
            //it is a swarm that we started
            let message = swarmUtils.OwM.prototype.convert(SwarmPacker.unpack(swarmSerialization));
            //we set the correct target
            message.setMeta("target", identityOfOurSwarmEngineInstance);
            //... and transfer to our swarm engine instance
            self.transfer(SwarmPacker.pack(message, SwarmPacker.getSerializer(header.serializationType)));
        } else {
            self.transfer(swarmSerialization);
        }
    }

    let identityOfOurSwarmEngineInstance;
    let startedSwarms = {};
    const self = this;
    this.sendSwarm = function (swarmSerialization) {
        const swarmUtils = require("swarmutils");
        const SwarmPacker = swarmUtils.SwarmPacker;
        let header = SwarmPacker.getHeader(swarmSerialization);
        let message = swarmUtils.OwM.prototype.convert(SwarmPacker.unpack(swarmSerialization));

        if (typeof message.publicVars === "undefined") {
            startedSwarms[message.getMeta("swarmId")] = true;

            //it is the start of swarm...
            if (typeof identityOfOurSwarmEngineInstance === "undefined") {
                identityOfOurSwarmEngineInstance = message.getMeta("homeSecurityContext");
            }
            //we change homeSecurityContext with a url in order to get back the swarm when is done.
            message.setMeta("homeSecurityContext", $$.remote[inbound].getReceiveAddress());

            swarmSerialization = SwarmPacker.pack(message, SwarmPacker.getSerializer(header.serializationType));
        }

        let target = header.swarmTarget;
        console.log("Sending swarm to", target);
        const urlRegex = new RegExp(/^(www|http:|https:)+[^\s]+[\w]/);

        if (urlRegex.test(target)) {
            $$.remote.doHttpPost(target, swarmSerialization, (err, res) => {
                if (err) {
                    console.log(err);
                }
            });
        } else {
            deliverSwarmToRemoteChannel(target, swarmSerialization, 0);
        }
    };

    function deliverSwarmToRemoteChannel(target, swarmSerialization, remoteIndex) {
        let identityMeta;
        try{
            identityMeta = getMetaFromIdentity(target);
        }catch(err){
            //identityMeta = {};
            console.log(err);
        }

        if (remoteIndex >= communicationAddrs.length) {
            //end of the line
            console.log(`Unable to deliver swarm to target "${target}" on any of the remote addresses provided.`);
            return;
        }
        const currentAddr = communicationAddrs[remoteIndex];
        //if we don't have a fav host for target then lets start discovery process...
        const remoteChannelAddr = favoriteHosts[identityMeta.domain] || [currentAddr, "send-message/", $$.remote.base64Encode(identityMeta.domain) + "/"].join("");

        $$.remote.doHttpPost(remoteChannelAddr, swarmSerialization, (err, res) => {
            if (err) {
                setTimeout(() => {
                    deliverSwarmToRemoteChannel(target, swarmSerialization, ++remoteIndex);
                }, 10);
            } else {
                //success: found fav host for target
                favoriteHosts[identityMeta.domain] = remoteChannelAddr;
                console.log("Found our fav", remoteChannelAddr, "for target", target);
            }
        });
    }

    function generateChannelName() {
        return Math.random().toString(36).substr(2, 9);
    }

    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if (p === 'identity') {
                setup();
            }
            return true;
        }
    });
}

module.exports = SmartRemoteChannelPowerCord;

}).call(this,require("buffer").Buffer)

},{"../../psk-http-client":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-http-client\\index.js","buffer":"buffer","swarmutils":"swarmutils","virtualmq":false}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\HostPowerCord.js":[function(require,module,exports){
function HostPowerCord(parent){

    this.sendSwarm = function (swarmSerialization){
        parent.postMessage(swarmSerialization, "*");
    };

    let receivedMessageHandler  = (event)=>{
        console.log("Message received in iframe",event);
        let swarmSerialization = event.data;
        this.transfer(swarmSerialization);
    };

    let subscribe = () => {
        if(!window.iframePCMessageHandler){
            window.iframePCMessageHandler = receivedMessageHandler;
            window.addEventListener("message",receivedMessageHandler)
        }
    };


    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if(p === 'identity') {
                subscribe.call(target);
            }
        }
    });
}


module.exports = HostPowerCord;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\IframePowerCord.js":[function(require,module,exports){
function IframePowerCord(iframe){

    let iframeSrc = iframe.src;

    this.sendSwarm = function (swarmSerialization){
        const SwarmPacker = require("swarmutils").SwarmPacker;

        try {
           SwarmPacker.getHeader(swarmSerialization);
        }
        catch (e) {
            console.error("Could not deserialize swarm");
        }

        if(iframe && iframe.contentWindow){
            iframe.contentWindow.postMessage(swarmSerialization, iframe.src);
        }
        else{
            //TODO: check if the iframe/psk-app should be loaded again
            console.error(`Iframe is no longer available. ${iframeSrc}`);
        }

    };

    let receivedMessageHandler  = (event)=>{

        if (event.source !== window) {
            console.log("Message received in parent", event);
            this.transfer(event.data);
        }

    };

    let subscribe = () => {

        // if(this.identity && this.identity!=="*"){
        // }
        // else{
        //     //TODO: you should use a power cord capable of handling * identities.
        //     console.error("Cannot handle identity '*'. You should use a power cord capable of handling '*' identities.")
        // }

        if(!window.iframePCMessageHandler){
            window.iframePCMessageHandler = receivedMessageHandler;
            window.addEventListener("message",receivedMessageHandler)
        }
    };

    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if(p === 'identity') {
                subscribe.call(target);
            }
        }
    });
}

module.exports = IframePowerCord;
},{"swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\ServiceWorkerPC.js":[function(require,module,exports){
const UtilFunctions = require("../../utils/utilFunctions");
function ServiceWorkerPC() {
    const channelsManager = require("../../utils/SWChannelsManager").getChannelsManager();
    const SwarmPacker = require("swarmutils").SwarmPacker;
    const server = require("ssapp-middleware").getMiddleware();

    this.sendSwarm = function (swarmSerialization) {
        let header;

        try {
            header = SwarmPacker.getHeader(swarmSerialization);
        } catch (e) {
            console.error("Could not deserialize swarm");
        }

        //TODO
        //verifica header.target pt urmatoarele cazuri:
        // -- daca targetul este un regex de forma domain/agent/agentName atunci trebuie trimis mesajul cu ajutorul lui channelsManager pe canalul Base64(numeDomeniu)
        // -- daca targetul este un regex de forma http/https atunci trebuie verificat daca domeniul fake-uit de service worker coincide cu domeniul din url.
        //          Daca coincid atunci se trimite folosind channelsManagerul local daca nu coincide atunci se face un request http(s) (fetch)
        // -- default ???? - posibil sa fie nevoie sa intoarcem tot in swarm engine... NU SUNT SIGUR!!!

        if(UtilFunctions.isUrl(header.swarmTarget)){
            if (!UtilFunctions.isInMyHosts(header.swarmTarget, server.requestedHosts)) {
                fetch(header.swarmTarget,
                    {
                        method: 'POST',
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Content-Type': 'application/octet-stream'
                        },
                        redirect: 'follow', // manual, *follow, error
                        referrerPolicy: 'no-referrer', // no-referrer, *client
                        body: swarmSerialization
                    }).then(response => {

                    //TODO
                    //check status codes
                    if (!response.ok) {
                        console.error(`An error occurred:  ${response.status} - ${response.statusText}`);
                    }

                }).catch((err)=>{
                    //TODO
                    //handle error
                    console.log(err);
                });
                return;
            }
        }

        let channelName = UtilFunctions.getChannelName(header.swarmTarget);
        channelsManager.sendMessage(channelName, swarmSerialization, function () {
            //TODO
            //what now?
            console.log("done");
        });
    };

    let receiveSwarmSerialization = (err, message) => {
        if (err) {
            console.log(err);
            if (err.code >= 400 && err.code < 500) {
                return;
            }
        } else {
            //we facilitate the transfer of swarmSerialization to $$.swarmEngine
            this.transfer(message);
        }
        //we need tp subscribe again in order to be called when a new message arrive
        //because no matter why error or message channelManager will remove as from the subs list
        setTimeout(subscribe, 0);
    };

    let subscribe = () => {
        //TODO
        //verifica this.identity pt urmatoarele cazuri:
        // -- daca targetul este un regex de forma domain/agent/agentName atunci trebuie trimis mesajul cu ajutorul lui channelsManager pe canalul Base64(numeDomeniu)
        // -- default ???? - posibil sa fie nevoie sa intoarcem tot in swarm engine... NU SUNT SIGUR!!!


        //let channelName = ""; //based on this.identity when need to extract the domainName from regex domainName/agent/agentname
        let channelName = this.identity.split("/")[0];//temporary test
        channelsManager.receiveMessage(btoa(channelName), receiveSwarmSerialization);
    }

    return new Proxy(this, {
        set(target, p, value, receiver) {
            target[p] = value;
            if (p === 'identity') {
                //when we get our identity
                //setup means first call of subscribe
                subscribe.call(target);
            }
        }
    });
}

module.exports = ServiceWorkerPC;

},{"../../utils/SWChannelsManager":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\utils\\SWChannelsManager.js","../../utils/utilFunctions":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\utils\\utilFunctions.js","ssapp-middleware":false,"swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\swarms\\index.js":[function(require,module,exports){
module.exports = function(swarmEngineApi){
    const cm = require("callflow");
    const swarmUtils = require("./swarm_template-se");

    $$.swarms           = cm.createSwarmEngine("swarm", swarmUtils.getTemplateHandler(swarmEngineApi));
    $$.swarm            = $$.swarms;

    $$.swarms.startAs = function(identity, swarmName, ctor, ...params){
        swarmEngineApi.startSwarmAs(identity, swarmName, ctor, ...params);
    };
};
},{"./swarm_template-se":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\swarms\\swarm_template-se.js","callflow":"callflow"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\swarms\\swarm_template-se.js":[function(require,module,exports){
exports.getTemplateHandler = function (swarmEngine) {
    let cm = require("callflow");

    let beesHealer = require("swarmutils").beesHealer;
    return {
        createForObject: function (valueObject, thisObject, localId) {

            function messageIdentityFilter(valueObject) {
                return valueObject.meta.swarmId;
            }

            let swarmFunction = function (destinationContext, phaseName, ...args) {
                //make the execution at level 0  (after all pending events) and wait to have a swarmId
                ret.observe(function () {
                    swarmEngine.sendSwarm(valueObject, $$.swarmEngine.EXECUTE_PHASE_COMMAND, destinationContext, phaseName, args);
                }, null, null);
                ret.notify();
                return thisObject;
            };

            let asyncReturn = function (err, result) {

                let destinationContext = valueObject.meta[$$.swarmEngine.META_SECURITY_HOME_CONTEXT];
                if (!destinationContext && valueObject.meta[$$.swarmEngine.META_WAITSTACK]) {
                    destinationContext = valueObject.meta[$$.swarmEngine.META_WAITSTACK].pop();
                }
                if (!destinationContext) {
                    destinationContext = valueObject.meta[$$.swarmEngine.META_SECURITY_HOME_CONTEXT];
                }

                const {OwM} = require("swarmutils");
                const swarmClone = OwM.prototype.convert(JSON.parse(JSON.stringify(valueObject)));

                swarmEngine.sendSwarm(swarmClone, $$.swarmEngine.RETURN_PHASE_COMMAND, destinationContext, $$.swarmEngine.RETURN_PHASE_COMMAND, [err, result]);
            };

            function interact(phaseName, ...args) {
                const {OwM} = require("swarmutils");
                const swarmClone = OwM.prototype.convert(JSON.parse(JSON.stringify(valueObject)));
                let destinationContext = valueObject.meta[$$.swarmEngine.META_SECURITY_HOME_CONTEXT];

                swarmEngine.sendSwarm(swarmClone, $$.swarmEngine.EXECUTE_INTERACT_PHASE_COMMAND, destinationContext, phaseName, args);
            }

            function home(err, result) {
                let homeContext = valueObject.meta[$$.swarmEngine.META_SECURITY_HOME_CONTEXT];
                swarmEngine.sendSwarm(valueObject, $$.swarmEngine.RETURN_PHASE_COMMAND, homeContext, $$.swarmEngine.RETURN_PHASE_COMMAND, [err, result]);
            }

            function waitResults(callback, keepAliveCheck, swarm) {
                if (!swarm) {
                    swarm = this;
                }
                if (!keepAliveCheck) {
                    keepAliveCheck = function () {
                        return false;
                    }
                }
                var inner = swarm.getInnerValue();
                if (!inner.meta[$$.swarmEngine.META_WAITSTACK]) {
                    inner.meta[$$.swarmEngine.META_WAITSTACK] = [];
                    inner.meta[$$.swarmEngine.META_WAITSTACK].push($$.HRN_securityContext)
                }
                swarmEngine.waitForSwarm(callback, swarm, keepAliveCheck);
            }


            let ret = cm.createStandardAPIsForSwarms(valueObject, thisObject, localId);

            ret.interact        = interact;
            ret.swarm           = swarmFunction;
            ret.home            = home;
            ret.onReturn        = waitResults;
            ret.onResult        = waitResults;
            ret.asyncReturn     = asyncReturn;
            ret.return          = asyncReturn;

            ret.autoInit = function (someContext) {

            };

            return ret;
        }
    }
};
},{"callflow":"callflow","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\utils\\SWChannelsManager.js":[function(require,module,exports){
let Queue = require("swarmutils").Queue;
const maxQueueSize = 100;
const TOKEN_PLACEHOLDER = "WEB_TOKEN_PLACEHOLDER";
const queues = {};
const subscribers = {};


function _getSubscribersList(channelName) {
    if (typeof subscribers[channelName] === "undefined") {
        subscribers[channelName] = [];
    }

    return subscribers[channelName];
}

function _getQueue(name) {
    if (typeof queues[name] === "undefined") {
        queues[name] = new Queue();
    }

    return queues[name];
}

function _deliverMessage(subscribers, message) {
    let dispatched = false;
    try {
        while (subscribers.length > 0) {
            let subscriberCallback = subscribers.pop();
            if (!dispatched) {
                subscriberCallback(undefined, message);
                dispatched = true;
            } else {
                let e = new Error("Already dispatched");
                e.code = 403;
                subscriberCallback(e);
            }
        }
    } catch (err) {
        //... some subscribers could have a timeout connection
        if (subscribers.length > 0) {
            _deliverMessage(subscribers, message);
        }
    }

    return dispatched;
}

function createChannel(channelName, callback) {
    if (typeof queues[channelName] !== "undefined") {
        let e = new Error("Channel exists!");
        e.code = 409;
        return callback(e);
    }

    queues[channelName] = new Queue();
    callback(undefined, TOKEN_PLACEHOLDER);
}

const plugs = {};
function sendMessage(channelName, message, callback) {

    let header;
    try{
        const SwarmPacker = require("swarmutils").SwarmPacker;
        header = SwarmPacker.getHeader(message);
    }catch(error){
        let e = new Error("SwarmPacker could not deserialize message");
        e.code = 400;
        callback(e);
    }

    if(typeof plugs[header.swarmTarget] === "undefined"){
        //we need to do this in order to ensure that we have a handler for every fake/real channel that we create
        let PC = require("../powerCords/browser/ServiceWorkerPC");
        plugs[header.swarmTarget] =  new PC();
        $$.swarmEngine.plug(header.swarmTarget, plugs[header.swarmTarget]);
    }

    let queue = _getQueue(channelName);
    let subscribers = _getSubscribersList(channelName);
    let dispatched = false;
    if (queue.isEmpty()) {
        dispatched = _deliverMessage(subscribers, message);
    }

    if (!dispatched) {
        if (queue.length < maxQueueSize) {
            queue.push(message);
            return callback(undefined);

        } else {
            //queue is full
            let e = new Error("Queue is full");
            e.code = 429;
            return callback(e);
        }

    }
    callback(undefined);

}

function receiveMessage(channelName, callback) {
    console.log(`Trying to receive message from channel "${channelName}"`);
    let queue = _getQueue(channelName);
    let message = queue.pop();

    if (!message) {
        _getSubscribersList(channelName).push(callback);
    } else {
        callback(undefined, message);
    }

}

function SWChannelsManager() {

        this.createChannel = createChannel;
        this.sendMessage = sendMessage;
        this.receiveMessage = receiveMessage;
        this.forwardMessage = function (channel, enable, callback) {
            let e = new Error("Unsupported feature");
            e.code = 403;
            callback(e);
        };
        console.log("ChannelsManager initialised!");
}

let channelManagerInstance = new SWChannelsManager();

module.exports.getChannelsManager = function(){
    return channelManagerInstance;
}

},{"../powerCords/browser/ServiceWorkerPC":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\ServiceWorkerPC.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\utils\\utilFunctions.js":[function(require,module,exports){
const urlReg = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?([a-z0-9]+([\-.]{1}[a-z0-9]+)*\.[a-z]{2,5}|localhost)(:[0-9]{1,5})?(\/.*)?$/gi;
const domainReg = /^([0-9a-zA-Z]*)\/agent\/([0-9a-zA-Z]*)$/gi;
const httpUrlRegex = new RegExp(urlReg);
const domainRegex =  new RegExp(domainReg);


function prepareMessage(req, callback){
    const contentType = req.headers['content-type'];
    if (contentType === 'application/octet-stream') {
        const contentLength = Number.parseInt(req.headers['Content-Length'], 10);

        if(Number.isNaN(contentLength)){
            let e = new Error("Length Required");
            e.code = 411;
            return callback(e);
        }
        else{
            callback(undefined,req.body);
        }

    } else {
        let e = new Error("Wrong message format received!");
        e.code = 500;
        callback(e);
    }
}

function isUrl(url){
    return url.match(httpUrlRegex);
}

function isInMyHosts(swarmTarget, hosts) {
    let url = new URL(swarmTarget);
    let arrayHosts = Array.from(hosts);
    for(let i = 0; i<arrayHosts.length; i++){
        if (url.host === arrayHosts[i]) {
            return true;
        }
    }

    return false;
}

function getChannelName(swarmTarget){

    let channelName;
    //check against domain/agent/agentName;

    if(swarmTarget.match(domainRegex)){
        let regGroups = domainRegex.exec(swarmTarget);
        channelName = btoa(regGroups[2]);
        return channelName;
    }

    //check against urls;
    if (swarmTarget.match(httpUrlRegex)) {

        if (swarmTarget[swarmTarget.length - 1] === "/") {
            swarmTarget = swarmTarget.slice(0, -1);
        }

        let urlFragments = swarmTarget.split("/");
        channelName = urlFragments[urlFragments.length - 1];
    }

    return channelName;
}

function handleOptionsRequest(req,res, next){

    const headers = {};
    // IE8 does not allow domains to be specified, just the *
    headers["Access-Control-Allow-Origin"] = req.headers.origin;
    // headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = true;
    headers["Access-Control-Max-Age"] = '3600'; //one hour
    headers["Access-Control-Allow-Headers"] = `Content-Type, Content-Length, Access-Control-Allow-Origin, User-Agent, ${signatureHeaderName}`;
    res.set(headers);
    res.status(200);
    res.end();
}

module.exports = {prepareMessage, getChannelName, isUrl, isInMyHosts, handleOptionsRequest};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\Combos.js":[function(require,module,exports){
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
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\OwM.js":[function(require,module,exports){
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
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\Queue.js":[function(require,module,exports){
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
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\SwarmPacker.js":[function(require,module,exports){
const HEADER_SIZE_RESEARVED = 4;

function SwarmPacker(){
}

function copyStringtoArrayBuffer(str, buffer){
    if(typeof str !== "string"){
        throw new Error("Wrong param type received");
    }
    for(var i = 0; i < str.length; i++) {
        buffer[i] = str.charCodeAt(i);
    }
    return buffer;
}

function copyFromBuffer(target, source){
    for(let i=0; i<source.length; i++){
        target[i] = source[i];
    }
    return target;
}

let serializers = {};

SwarmPacker.registerSerializer = function(name, implementation){
    if(serializers[name]){
        throw new Error("Serializer name already exists");
    }
    serializers[name] = implementation;
};

function getSerializer(name){
    return serializers[name];
}

SwarmPacker.getSerializer = getSerializer;

Object.defineProperty(SwarmPacker.prototype, "JSON", {value: "json"});
Object.defineProperty(SwarmPacker.prototype, "MSGPACK", {value: "msgpack"});

SwarmPacker.registerSerializer(SwarmPacker.prototype.JSON, {
    serialize: JSON.stringify,
    deserialize: (serialization)=>{
        if(typeof serialization !== "string"){
            serialization = String.fromCharCode.apply(null, serialization);
        }
        return JSON.parse(serialization);
    },
    getType: ()=>{
        return SwarmPacker.prototype.JSON;
    }
});

function registerMsgPackSerializer(){
    const mp = '@msgpack/msgpack';
    let msgpack;

    try{
        msgpack = require(mp);
        if (typeof msgpack === "undefined") {
            throw new Error("msgpack is unavailable.")
        }
    }catch(err){
        console.log("msgpack not available. If you need msgpack serialization include msgpack in one of your bundles");
        //preventing msgPack serializer being register if msgPack dep is not found.
        return;
    }

    SwarmPacker.registerSerializer(SwarmPacker.prototype.MSGPACK, {
        serialize: msgpack.encode,
        deserialize: msgpack.decode,
        getType: ()=>{
            return SwarmPacker.prototype.MSGPACK;
        }
    });
}

registerMsgPackSerializer();

SwarmPacker.pack = function(swarm, serializer){

    let jsonSerializer = getSerializer(SwarmPacker.prototype.JSON);
    if(typeof serializer === "undefined"){
        serializer = jsonSerializer;
    }

    let swarmSerialization = serializer.serialize(swarm);

    let header = {
        command: swarm.getMeta("command"),
        swarmId : swarm.getMeta("swarmId"),
        swarmTypeName: swarm.getMeta("swarmTypeName"),
        swarmTarget: swarm.getMeta("target"),
        serializationType: serializer.getType()
    };

    header = serializer.serialize(header);

    if(header.length >= Math.pow(2, 32)){
        throw new Error("Swarm serialization too big.");
    }

    //arraybuffer construction
    let size = HEADER_SIZE_RESEARVED + header.length + swarmSerialization.length;
    let pack = new ArrayBuffer(size);

    let sizeHeaderView = new DataView(pack, 0);
    sizeHeaderView.setUint32(0, header.length);

    let headerView = new Uint8Array(pack, HEADER_SIZE_RESEARVED);
    copyStringtoArrayBuffer(header, headerView);

    let serializationView = new Uint8Array(pack, HEADER_SIZE_RESEARVED+header.length);
    if(typeof swarmSerialization === "string"){
        copyStringtoArrayBuffer(swarmSerialization, serializationView);
    }else{
        copyFromBuffer(serializationView, swarmSerialization);
    }

    return pack;
};

SwarmPacker.unpack = function(pack){
    let jsonSerialiser = SwarmPacker.getSerializer(SwarmPacker.prototype.JSON);
    let headerSerialization = getHeaderSerializationFromPack(pack);
    let header = jsonSerialiser.deserialize(headerSerialization);

    let serializer = SwarmPacker.getSerializer(header.serializationType);
    let messageView = new Uint8Array(pack, HEADER_SIZE_RESEARVED+headerSerialization.length);

    let swarm = serializer.deserialize(messageView);
    return swarm;
};

function getHeaderSerializationFromPack(pack){
    let headerSize = new DataView(pack).getUint32(0);

    let headerView = new Uint8Array(pack, HEADER_SIZE_RESEARVED, headerSize);
    return headerView;
}

SwarmPacker.getHeader = function(pack){
    let jsonSerialiser = SwarmPacker.getSerializer(SwarmPacker.prototype.JSON);
    let header = jsonSerialiser.deserialize(getHeaderSerializationFromPack(pack));

    return header;
};
module.exports = SwarmPacker;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\TaskCounter.js":[function(require,module,exports){

function TaskCounter(finalCallback) {
	let results = [];
	let errors = [];

	let started = 0;

	function decrement(err, res) {
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

	function increment(amount = 1) {
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
		increment,
		decrement
	};
}

module.exports = TaskCounter;
},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\beesHealer.js":[function(require,module,exports){
const OwM = require("./OwM");

/*
    Prepare the state of a swarm to be serialised
*/

exports.asJSON = function(valueObj, phaseName, args, callback){

        let valueObject = valueObj.valueOf();
        let res = new OwM();
        res.publicVars          = valueObject.publicVars;
        res.privateVars         = valueObject.privateVars;

        res.setMeta("COMMAND_ARGS",        OwM.prototype.getMetaFrom(valueObject, "COMMAND_ARGS"));
        res.setMeta("SecurityParadigm",        OwM.prototype.getMetaFrom(valueObject, "SecurityParadigm"));
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
},{"./OwM":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\OwM.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\path.js":[function(require,module,exports){
function replaceAll(str, search, replacement) {
    return str.split(search).join(replacement);
}

function resolve(pth) {
    let pathSegments = pth.split("/");
    let makeAbsolute = pathSegments[0] === "" ? true : false;
    for (let i = 0; i < pathSegments.length; i++) {
        let segment = pathSegments[i];
        if (segment === "..") {
            let j = 1;
            if (i > 0) {
                j = j + 1;
            } else {
                makeAbsolute = true;
            }
            pathSegments.splice(i + 1 - j, j);
            i = i - j;
        }
    }
    let res = pathSegments.join("/");
    if (makeAbsolute && res !== "") {
        res = __ensureIsAbsolute(res);
    }
    return res;
}

function normalize(pth) {
    if (typeof pth !== "string") {
        throw new TypeError();
    }
    pth = replaceAll(pth, "\\", "/");
    pth = replaceAll(pth, /[/]+/, "/");

    return resolve(pth);
}

function join(...args) {
    let pth = "";
    for (let i = 0; i < args.length; i++) {
        pth += "/" + args[i];
    }
    return normalize(pth);
}

function __ensureIsAbsolute(pth) {
    if (pth[0] !== "/") {
        pth = "/" + pth;
    }
    return pth;
}

function isAbsolute(pth) {
    pth = normalize(pth);
    if (pth[0] !== "/") {
        return false;
    }

    return true;
}

function ensureIsAbsolute(pth) {
    pth = normalize(pth);
    return __ensureIsAbsolute(pth);
}

module.exports = {
    normalize,
    join,
    isAbsolute,
    ensureIsAbsolute
};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\pingpongFork.js":[function(require,module,exports){
const PING = "PING";
const PONG = "PONG";

module.exports.fork = function pingPongFork(modulePath, args, options){
    const child_process = require("child_process");
    const defaultStdio = ["inherit", "inherit", "inherit", "ipc"];

    if(!options){
        options = {stdio: defaultStdio};
    }else{
        if(typeof options.stdio === "undefined"){
            options.stdio = defaultStdio;
        }

        let stdio = options.stdio;
        if(stdio.length<3){
            for(let i=stdio.length; i<4; i++){
                stdio.push("inherit");
            }
            stdio.push("ipc");
        }
    }

    let child = child_process.fork(modulePath, args, options);

    child.on("message", (message)=>{
        if(message === PING){
            child.send(PONG);
        }
    });

    return child;
};

module.exports.enableLifeLine = function(timeout){

    if(typeof process.send === "undefined"){
        console.log("\"process.send\" not found. LifeLine mechanism disabled!");
        return;
    }

    let lastConfirmationTime;
    const interval = timeout || 2000;

    // this is needed because new Date().getTime() has reduced precision to mitigate timer based attacks
    // for more information see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime
    const roundingError = 101;

    function sendPing(){
        try {
            process.send(PING);
        } catch (e) {
            console.log('Parent is not available, shutting down');
            exit(1)
        }
    }

    process.on("message", function (message){
        if(message === PONG){
            lastConfirmationTime = new Date().getTime();
        }
    });

    function exit(code){
        setTimeout(()=>{
            process.exit(code);
        }, 0);
    }

    const exceptionEvents = ["SIGINT", "SIGUSR1", "SIGUSR2", "uncaughtException", "SIGTERM", "SIGHUP"];
    let killingSignal = false;
    for(let i=0; i<exceptionEvents.length; i++){
        process.on(exceptionEvents[i], (event, code)=>{
            killingSignal = true;
            clearInterval(timeoutInterval);
            console.log(`Caught event type [${exceptionEvents[i]}]. Shutting down...`, code, event);
            exit(code);
        });
    }

    const timeoutInterval = setInterval(function(){
        const currentTime = new Date().getTime();

        if(typeof lastConfirmationTime === "undefined" || currentTime - lastConfirmationTime < interval + roundingError && !killingSignal){
            sendPing();
        }else{
            console.log("Parent process did not answer. Shutting down...", process.argv, killingSignal);
            exit(1);
        }
    }, interval);
};
},{"child_process":false}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\pskconsole.js":[function(require,module,exports){
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


},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\safe-uuid.js":[function(require,module,exports){

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
},{"crypto":"crypto"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\uidGenerator.js":[function(require,module,exports){
(function (Buffer){
const crypto = require('crypto');
const Queue = require("./Queue");
var PSKBuffer = typeof $$ !== "undefined" && $$.PSKBuffer ? $$.PSKBuffer : Buffer;

function UidGenerator(minBuffers, buffersSize) {
    var buffers = new Queue();
    var lowLimit = .2;

    function fillBuffers(size) {
        //notifyObserver();
        const sz = size || minBuffers;
        if (buffers.length < Math.floor(minBuffers * lowLimit)) {
            for (var i = buffers.length; i < sz; i++) {
                generateOneBuffer(null);
            }
        }
    }

    fillBuffers();

    function generateOneBuffer(b) {
        if (!b) {
            b = PSKBuffer.alloc(0);
        }
        const sz = buffersSize - b.length;
        /*crypto.randomBytes(sz, function (err, res) {
            buffers.push(Buffer.concat([res, b]));
            notifyObserver();
        });*/
        buffers.push(PSKBuffer.concat([crypto.randomBytes(sz), b]));
        notifyObserver();
    }

    function extractN(n) {
        var sz = Math.floor(n / buffersSize);
        var ret = [];

        for (var i = 0; i < sz; i++) {
            ret.push(buffers.pop());
            setTimeout(generateOneBuffer, 1);
        }


        var remainder = n % buffersSize;
        if (remainder > 0) {
            var front = buffers.pop();
            ret.push(front.slice(0, remainder));
            //generateOneBuffer(front.slice(remainder));
            setTimeout(function () {
                generateOneBuffer(front.slice(remainder));
            }, 1);
        }

        //setTimeout(fillBuffers, 1);

        return Buffer.concat(ret);
    }

    var fillInProgress = false;

    this.generateUid = function (n) {
        var totalSize = buffers.length * buffersSize;
        if (n <= totalSize) {
            return extractN(n);
        } else {
            if (!fillInProgress) {
                fillInProgress = true;
                setTimeout(function () {
                    fillBuffers(Math.floor(minBuffers * 2.5));
                    fillInProgress = false;
                }, 1);
            }
            return crypto.randomBytes(n);
        }
    };

    var observer;
    this.registerObserver = function (obs) {
        if (observer) {
            console.error(new Error("One observer allowed!"));
        } else {
            if (typeof obs == "function") {
                observer = obs;
                //notifyObserver();
            }
        }
    };

    function notifyObserver() {
        if (observer) {
            var valueToReport = buffers.length * buffersSize;
            setTimeout(function () {
                observer(null, {"size": valueToReport});
            }, 10);
        }
    }
}

module.exports.createUidGenerator = function (minBuffers, bufferSize) {
    return new UidGenerator(minBuffers, bufferSize);
};

}).call(this,require("buffer").Buffer)

},{"./Queue":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\Queue.js","buffer":"buffer","crypto":"crypto"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\AbstractPool.js":[function(require,module,exports){
(function (setImmediate){
const {assert} = require('./utils');
const util = require('util');
const {EventEmitter} = require('events');

const PoolEvents = {
    RELEASED_WORKER: 'releasedWorker'
};

/** @param {PoolConfig&PoolConfigStorage} options */
function AbstractPool(options) {
    EventEmitter.call(this);

    let pool = [];
    let currentPoolSize = 0;

    /** @returns {Worker|null} */
    this.getAvailableWorker = function () {
        // find first free worker
        const freeWorkerIndex = pool.findIndex(el => !el.isWorking);

        let worker = null;

        // if no free worker is available, try creating one
        if (freeWorkerIndex === -1) {
            _createNewWorker();
            return null;
        } else {
            worker = pool[freeWorkerIndex];
        }

        if (worker === null) {
            return null;
        }

        // if free worker exists, set its state to working
        worker.isWorking = true;
        return worker.workerInstance;
    };

    /** @param {Worker} worker */
    this.returnWorker = function (worker) {
        // find worker that matches one in the pool
        const freeWorkerIndex = pool.findIndex(el => el.workerInstance === worker);

        if (freeWorkerIndex === -1) {
            console.error('Tried to return a worker that is not owned by the pool');
            return;
        }

        // if worker is found, set its state to not working
        pool[freeWorkerIndex].isWorking = false;
        this.emit(PoolEvents.RELEASED_WORKER);
    };

    /** @param {Worker} worker */
    this.removeWorker = function (worker) {
        const localPoolSize = pool.length;

        pool = pool.filter(poolWorker => poolWorker.workerInstance !== worker); // keep elements that are not equal to worker
        currentPoolSize = pool.length;

        assert(currentPoolSize === localPoolSize - 1, {ifFails: `Tried returning a worker that could not be found`});
    };

    this.createNewWorker = function () {
        throw new Error('Not implemented! Overwrite this in subclass.');
    };

    const _createNewWorker = () => {
        // using currentPoolSize instead of pool.length because the creation of workers can be asynchronous
        // and the pool will increase only after the worker is creating, this can cause a situation where
        // more workers are created than the maximumNumberOfWorkers
        if (currentPoolSize >= options.maximumNumberOfWorkers) {
            return;
        }

        currentPoolSize += 1;

        this.createNewWorker((err, newWorker) => {
            if (err) {
                currentPoolSize -= 1;
                console.error('Error creating a new worker', err);
                return;
            }

            const workerObj = {
                isWorking: false,
                workerInstance: newWorker
            };

            pool.push(workerObj);

            // createNewWorker can be synchronous (even though it uses a callback),
            // in that case it will cause scheduling problems if not delayed
            setImmediate(() => {
                this.emit(PoolEvents.RELEASED_WORKER);
            });
        });
    };

}

AbstractPool.prototype.events = PoolEvents;
util.inherits(AbstractPool, EventEmitter);


module.exports = AbstractPool;

}).call(this,require("timers").setImmediate)

},{"./utils":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\utils.js","events":"events","timers":"timers","util":"util"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\Pool-Isolates.js":[function(require,module,exports){
const AbstractPool = require('./AbstractPool');
const util = require('util');
/**
 * @param {PoolConfig&PoolConfigStorage} options
 * @param workerCreateHelper
 * @mixes AbstractPool
 */
function PoolIsolates(options, workerCreateHelper) {
    AbstractPool.call(this, options);

    this.createNewWorker = function (callback) {
        const workerOptions = options.workerOptions;

        const getIsolatesWorker = options.bootScript;

        getIsolatesWorker(workerOptions)
            .then((newWorker) => {

                if (typeof workerCreateHelper === "function") {
                    workerCreateHelper(newWorker);
                }

                callback(undefined, newWorker)
            })
            .catch(err => {
                callback(err);
            });
    };

}

util.inherits(PoolIsolates, AbstractPool);

module.exports = PoolIsolates;

},{"./AbstractPool":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\AbstractPool.js","util":"util"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\Pool-Threads.js":[function(require,module,exports){
const AbstractPool = require('./AbstractPool');
const util = require('util');

/**
 * @param {PoolConfig&PoolConfigStorage} options
 * @param {function} workerCreateHelper
 * @mixes AbstractPool
 */
function PoolThreads(options, workerCreateHelper) {
    AbstractPool.call(this, options);

    this.createNewWorker = function (callback) {
        const worker_threads ='worker_threads';
        const {Worker} = require(worker_threads);

        const newWorker = new Worker(options.bootScript, options.workerOptions);

        if (typeof workerCreateHelper === "function") {
            workerCreateHelper(newWorker);
        }

        const callbackWrapper = (...args) => {
            removeListeners();
            callback(...args);
        };

        function onMessage(msg) {
            if(msg !== 'ready') {
                callbackWrapper(new Error('Build script did not respond accordingly, it might be incompatible with current version'));
                return;
            }

            callbackWrapper(undefined, newWorker);
        }

        function removeListeners() {
            newWorker.removeListener('message', onMessage);
            newWorker.removeListener('error', callbackWrapper);
            newWorker.removeListener('exit', callbackWrapper);
        }

        newWorker.on('message', onMessage);
        newWorker.on('error', callbackWrapper);
        newWorker.on('exit', callbackWrapper);
    };

}

util.inherits(PoolThreads, AbstractPool);

module.exports = PoolThreads;

},{"./AbstractPool":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\AbstractPool.js","util":"util"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\PoolConfig.js":[function(require,module,exports){
const os = require('os');
const util = require('util');
const WorkerStrategies = require('./WorkerStrategies');

function PoolConfigStorage() {
    this.bootScript = ``;
    this.maximumNumberOfWorkers = os.cpus().length;
    this.workerStrategy = WorkerStrategies.THREADS;
    this.workerOptions = {
        eval: false
    };
}

/**
 * This just provides validation for properties on config
 * Substituting this class to PoolConfigStorage should behave exactly the same effect if the config is valid
 * @constructor
 */
function PoolConfig() {
    const storage = new PoolConfigStorage();

    return {
        get bootScript() {
            return storage.bootScript;
        },
        set bootScript(value) {
            storage.bootScript = value;
        },

        get maximumNumberOfWorkers() {
            return storage.maximumNumberOfWorkers;
        },
        set maximumNumberOfWorkers(value) {
            if (!Number.isFinite(value)) {
                throw new TypeError(`Attribute maximumNumberOfWorkers should be a finite number, got ${typeof value}`);
            }

            if (value <= 0) {
                throw new RangeError(`Attribute maximumNumberOfWorkers should have a value bigger than 0, got ${value}`);
            }

            storage.maximumNumberOfWorkers = value;
        },

        get workerStrategy() {
            return storage.workerStrategy
        },
        set workerStrategy(value) {
            if (!Object.values(WorkerStrategies).includes(value)) {
                throw new TypeError(`Value ${value} not allowed for workerStrategy attribute`);
            }

            storage.workerStrategy = value;
        },

        get workerOptions() {
            return storage.workerOptions;
        },
        set workerOptions(value) {
            storage.workerOptions = value;
        },

        toJSON: function () {
            return JSON.stringify(storage);
        },
        [Symbol.toStringTag]: function () {
            return storage.toString()
        },
        [util.inspect.custom]: function () {
            return util.inspect(storage, {colors: true});
        }
    }
}

/**
 * This utility merges a new config to a default one. It is easier to use if you want to overwrite only a subset
 * of properties of the config.
 * @returns {PoolConfig&PoolConfigStorage}
 */
PoolConfig.createByOverwritingDefaults = function (config = {}, options = {allowNewKeys: true, allowUndefined: true}) {
    const defaultConfig = new PoolConfig();

    Object.keys(config).forEach(key => {

        if (!options.allowNewKeys && !defaultConfig.hasOwnProperty(key)) {
            throw new Error(`Tried overwriting property ${key} that does not exist on PoolConfig. ` +
                `If this is intentional, set in options argument "allowNewKeys" to true'`);
        }

        if (!options.allowUndefined && typeof config[key] === 'undefined') {
            throw new Error(`Tried setting value of ${key} to undefined. ` +
                'If this is intentional, set in options argument "allowUndefined" to true');
        }

        defaultConfig[key] = config[key];
    });

    return defaultConfig;
};

module.exports = PoolConfig;
},{"./WorkerStrategies":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\WorkerStrategies.js","os":"os","util":"util"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\QueueShim.js":[function(require,module,exports){
function Queue() {
    const backingStorage = [];

    Object.defineProperty(this, 'length', {
        get() {
            return backingStorage.length
        },
        set(value) {
            backingStorage.length = value;
        }
    });

    Object.defineProperty(this, 'head', {
        get: () => {
            if (backingStorage.length > 0) {
                return backingStorage[0];
            }

            return null;
        }
    });

    Object.defineProperty(this, 'tail', {
        get: () => {
            const length = backingStorage.length;
            if (length > 0) {
                return backingStorage[length - 1];
            }

            return null;
        }
    });


    this.push = (value) => {
        backingStorage.push(value);
    };

    this.pop = () => {
        return backingStorage.shift();
    };

    this.front = function () {
        return this.head;
    };

    this.isEmpty = function () {
        return backingStorage.length === 0;
    };

    this[Symbol.iterator] = backingStorage[Symbol.iterator];

    this.toString = backingStorage.toString;
    this[Symbol.for('nodejs.util.inspect.custom')] = function() {
        return JSON.stringify(backingStorage);
    }

}

module.exports = Queue;

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\WorkerPool.js":[function(require,module,exports){

/** @param pool {AbstractPool} */
function WorkerPool(pool) {
    const {assert} = require('./utils');
    let Queue;

    try {
        Queue = require('swarmutils').Queue;
    } catch (e) {
        Queue = require('./QueueShim.js');
    }

    const PoolEvents = pool.events;
    const taskQueue = new Queue();

    this.addTask = function (task, callback) {
        const taskAccepted = this.runTaskImmediately(task, callback);

        if (!taskAccepted) {
            taskQueue.push({task, callback});
            return false;
        }

        return true;
    };

    /**
     * Tries to run task if a worker is available, if it is not it will simply discard the task
     * @returns {boolean} - True if the task was given to a worker, false if no worker was available for this task
     */
    this.runTaskImmediately = function (task, callback) {
        const worker = pool.getAvailableWorker();

        if (!worker) {
            return false;
        }

        addWorkerListeners(worker, callback);

        worker.postMessage(task);
        return true;
    };

    pool.on(PoolEvents.RELEASED_WORKER, () => {
        if (taskQueue.isEmpty()) {
            return;
        }

        const taskSize = taskQueue.length;
        const nextTask = taskQueue.front();

        const taskWasAcceptedByAWorker = this.runTaskImmediately(nextTask.task, nextTask.callback);

        if (taskWasAcceptedByAWorker) {
            taskQueue.pop();
            const newTaskSize = taskQueue.length;
            assert(newTaskSize === taskSize - 1, {ifFails: `The task queue size did not decrease, expected to be ${taskSize - 1} but is ${newTaskSize}`})
        } else {
            const newTaskSize = taskQueue.length;
            assert(newTaskSize === taskSize, {ifFails: `The task queue size modified when it shouldn't, expected to be equal but got pair (old: ${taskSize}, new: ${newTaskSize})`});
            // events are propagates synchronously as mentioned in documentation (https://nodejs.org/api/events.html#events_asynchronous_vs_synchronous)
            // one reason why this can happen is if the worker is not properly marked as "not working"
            // another one is that the queue contains a worker that is free but can't accept tasks (it might have been terminated)
            console.error(`This should never happen and it's most likely a bug`);
        }
    });

    /**
     * @param {Worker} worker
     * @param {function} callbackForListeners
     */
    function addWorkerListeners(worker, callbackForListeners) {

        function callbackWrapper(...args) {
            removeListeners();
            if(args[0] instanceof Error) {
                pool.removeWorker(worker);
            } else {
                pool.returnWorker(worker);
            }
            callbackForListeners(...args);
        }

        function onMessage(...args) {
            if (args[0] instanceof Error) {
                callbackWrapper(...args);
            } else {
                callbackWrapper(undefined, ...args);
            }
        }

        function onError(err) {
            callbackWrapper(err);
        }

        function onExit(code) {
            if (code !== 0) {
                callbackWrapper(new Error(`Worker exited unexpectedly with code ${code}`));
            }
        }

        worker.once('message', onMessage);
        worker.once('error', onError);
        worker.once('exit', onExit);

        function removeListeners() {
            worker.removeListener('message', onMessage);
            worker.removeListener('error', onError);
            worker.removeListener('exit', onExit);
        }
    }

}

module.exports = WorkerPool;

},{"./QueueShim.js":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\QueueShim.js","./utils":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\utils.js","swarmutils":"swarmutils"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\WorkerStrategies.js":[function(require,module,exports){
const WorkerStrategies = {
    THREADS: 'threads',
    ISOLATES: 'isolates'
};

module.exports = Object.freeze(WorkerStrategies);

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\utils.js":[function(require,module,exports){
function assert(condition, {ifFails}) {
    if (condition === false) {
        console.error(ifFails);
    }
}

module.exports = {
    assert
};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\array-set.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;

},{"./util":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\util.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\base64-vlq.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = require('./base64');

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

},{"./base64":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\base64.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\base64.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
exports.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\binary-search.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\mapping-list.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

exports.MappingList = MappingList;

},{"./util":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\util.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\quick-sort.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
exports.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

},{}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-map-consumer.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap)
    : new BasicSourceMapConsumer(sourceMap);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      if (source != null && sourceRoot != null) {
        source = util.join(sourceRoot, source);
      }
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: Optional. the column number in the original source.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    if (this.sourceRoot != null) {
      needle.source = util.relative(this.sourceRoot, needle.source);
    }
    if (!this._sources.has(needle.source)) {
      return [];
    }
    needle.source = this._sources.indexOf(needle.source);

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The only parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._sources.toArray().map(function (s) {
      return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
    }, this);
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          if (this.sourceRoot != null) {
            source = util.join(this.sourceRoot, source);
          }
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    if (this.sourceRoot != null) {
      aSource = util.relative(this.sourceRoot, aSource);
    }

    if (this._sources.has(aSource)) {
      return this.sourcesContent[this._sources.indexOf(aSource)];
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + aSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + aSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    if (this.sourceRoot != null) {
      source = util.relative(this.sourceRoot, source);
    }
    if (!this._sources.has(source)) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }
    source = this._sources.indexOf(source);

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The only parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ''));
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'))
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.
 *   - column: The column number in the generated source.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.
 *   - column: The column number in the original source, or null.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.
 *   - column: The column number in the original source.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.
 *   - column: The column number in the generated source, or null.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer.sources.indexOf(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        if (section.consumer.sourceRoot !== null) {
          source = util.join(section.consumer.sourceRoot, source);
        }
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = section.consumer._names.at(mapping.name);
        this._names.add(name);
        name = this._names.indexOf(name);

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\array-set.js","./base64-vlq":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\base64-vlq.js","./binary-search":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\binary-search.js","./quick-sort":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\quick-sort.js","./util":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\util.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-map-generator.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\array-set.js","./base64-vlq":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\base64-vlq.js","./mapping-list":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\mapping-list.js","./util":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\util.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-node.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex];
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex];
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-map-generator.js","./util":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\util.js"}],"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\util.js":[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || !!aPath.match(urlRegexp);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = mappingA.source - mappingB.source;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return mappingA.name - mappingB.name;
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

},{}],"buffer-from":[function(require,module,exports){
(function (Buffer){
var toString = Object.prototype.toString

var isModern = (
  typeof Buffer.alloc === 'function' &&
  typeof Buffer.allocUnsafe === 'function' &&
  typeof Buffer.from === 'function'
)

function isArrayBuffer (input) {
  return toString.call(input).slice(8, -1) === 'ArrayBuffer'
}

function fromArrayBuffer (obj, byteOffset, length) {
  byteOffset >>>= 0

  var maxLength = obj.byteLength - byteOffset

  if (maxLength < 0) {
    throw new RangeError("'offset' is out of bounds")
  }

  if (length === undefined) {
    length = maxLength
  } else {
    length >>>= 0

    if (length > maxLength) {
      throw new RangeError("'length' is out of bounds")
    }
  }

  return isModern
    ? Buffer.from(obj.slice(byteOffset, byteOffset + length))
    : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)))
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  return isModern
    ? Buffer.from(string, encoding)
    : new Buffer(string, encoding)
}

function bufferFrom (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return isModern
    ? Buffer.from(value)
    : new Buffer(value)
}

module.exports = bufferFrom

}).call(this,require("buffer").Buffer)

},{"buffer":"buffer"}],"callflow":[function(require,module,exports){
(function (global){
function initialise() {
    if($$.callflow){
        throw new Error("Callflow already initialized!");
    }

    function defaultErrorHandlingImplementation(err, res){
        //console.log(err.stack);
        if(err) throw err;
        return res;
    }

    $$.__intern = {
        mkArgs:function(args,pos){
            var argsArray = [];
            for(var i = pos; i < args.length; i++){
                argsArray.push(args[i]);
            }
            return argsArray;
        }
    };

    $$.defaultErrorHandlingImplementation = defaultErrorHandlingImplementation;

    var callflowModule = require("./lib/swarmDescription");
    $$.callflows        = callflowModule.createSwarmEngine("callflow");
    $$.callflow         = $$.callflows;
    $$.flow             = $$.callflows;
    $$.flows            = $$.callflows;


    $$.PSK_PubSub = require("soundpubsub").soundPubSub;

    $$.securityContext = null;
    $$.HRN_securityContext = "unnamedSecurityContext"; /*HRN: Human Readable Name */
    $$.libraryPrefix = "global";
    $$.libraries = {
        global:{

        }
    };

    $$.interceptor = require("./lib/InterceptorRegistry").createInterceptorRegistry();

    $$.loadLibrary = require("./lib/loadLibrary").loadLibrary;

    global.requireLibrary = function(name){
        //var absolutePath = path.resolve(  $$.__global.__loadLibraryRoot + name);
        return $$.loadLibrary(name,name);
    };

    require("./constants");


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

        $$.event('swarm.call', {swarmTypeName, phaseName, swarmId});
    });
}

module.exports = {
    createSwarmEngine: require("./lib/swarmDescription").createSwarmEngine,
    createJoinPoint: require("./lib/parallelJoinPoint").createJoinPoint,
    createSerialJoinPoint: require("./lib/serialJoinPoint").createSerialJoinPoint,
    createStandardAPIsForSwarms: require("./lib/utilityFunctions/base").createForObject,
    initialise: initialise
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./constants":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\constants.js","./lib/InterceptorRegistry":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\InterceptorRegistry.js","./lib/loadLibrary":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\loadLibrary.js","./lib/parallelJoinPoint":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\parallelJoinPoint.js","./lib/serialJoinPoint":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\serialJoinPoint.js","./lib/swarmDescription":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\swarmDescription.js","./lib/utilityFunctions/base":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\callflow\\lib\\utilityFunctions\\base.js","crypto":"crypto","path":"path","soundpubsub":"soundpubsub"}],"psk-security-context":[function(require,module,exports){
const RawCSBSecurityContext = require("./lib/RawCSBSecurityContext");
const RootCSBSecurityContext = require("./lib/RootCSBSecurityContext");
const SecurityContext = require("./lib/SecurityContext");
const EncryptedSecret = require("./lib/EncryptedSecret");
const PSKSignature = require("./lib/PSKSignature");

module.exports.createSecurityContext = (securityContextType, ...args) => {
    switch (securityContextType) {
        case "RootCSBSecurityContext":
            return new RootCSBSecurityContext(...args);
        case "RawCSBSecurityContext":
            return new RawCSBSecurityContext(...args);
        default:
            return new SecurityContext(...args);
    }
};

module.exports.createEncryptedSecret = (serializedEncryptedSecret) => {
    return new EncryptedSecret(serializedEncryptedSecret);
};


module.exports.createPSKSignature = (serializedPSKSignature) => {
    return new PSKSignature(serializedPSKSignature);
};

},{"./lib/EncryptedSecret":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\EncryptedSecret.js","./lib/PSKSignature":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\PSKSignature.js","./lib/RawCSBSecurityContext":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\RawCSBSecurityContext.js","./lib/RootCSBSecurityContext":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\RootCSBSecurityContext.js","./lib/SecurityContext":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psk-security-context\\lib\\SecurityContext.js"}],"pskbuffer":[function(require,module,exports){
const PSKBuffer = require('./lib/PSKBuffer');

module.exports = PSKBuffer;

},{"./lib/PSKBuffer":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\pskbuffer\\lib\\PSKBuffer.js"}],"psklogger":[function(require,module,exports){
const PSKLogger = require('./src/PSKLoggerClient/index');
const EnvironmentDataProvider = require('./src/utils').EnvironmentDataProvider;
const envTypes = require("overwrite-require").constants;

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

switch ($$.environmentType) {
    case envTypes.NODEJS_ENVIRONMENT_TYPE:
    case envTypes.THREAD_ENVIRONMENT_TYPE:
        module.exports.MessagePublisherModule = require('./src/MessagePublisher');
        module.exports.MessageSubscriberModule = require('./src/MessageSubscriber');
        module.exports.PubSubProxyModule = require('./src/PubSubProxy');
        break;
    default:
        //nothing to do here for now;
}
module.exports.PSKLogger = PSKLogger;
},{"./src/MessagePublisher":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessagePublisher\\index.js","./src/MessageSubscriber":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\MessageSubscriber\\index.js","./src/PSKLoggerClient/index":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PSKLoggerClient\\index.js","./src/PubSubProxy":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\PubSubProxy\\index.js","./src/utils":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\psklogger\\src\\utils\\index.js","overwrite-require":"overwrite-require"}],"soundpubsub":[function(require,module,exports){
module.exports = {
					soundPubSub: require("./lib/soundPubSub").soundPubSub
};
},{"./lib/soundPubSub":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\soundpubsub\\lib\\soundPubSub.js"}],"source-map-support":[function(require,module,exports){
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var path = require('path');

var fs;
try {
  fs = require('fs');
  if (!fs.existsSync || !fs.readFileSync) {
    // fs doesn't have all methods we need
    fs = null;
  }
} catch (err) {
  /* nop */
}

var bufferFrom = require('buffer-from');

/**
 * Requires a module which is protected against bundler minification.
 *
 * @param {NodeModule} mod
 * @param {string} request
 */
function dynamicRequire(mod, request) {
  return mod.require(request);
}

// Only install once if called multiple times
var errorFormatterInstalled = false;
var uncaughtShimInstalled = false;

// If true, the caches are reset before a stack trace formatting operation
var emptyCacheBetweenOperations = false;

// Supports {browser, node, auto}
var environment = "auto";

// Maps a file path to a string containing the file contents
var fileContentsCache = {};

// Maps a file path to a source map for that file
var sourceMapCache = {};

// Regex for detecting source maps
var reSourceMap = /^data:application\/json[^,]+base64,/;

// Priority list of retrieve handlers
var retrieveFileHandlers = [];
var retrieveMapHandlers = [];

function isInBrowser() {
  if (environment === "browser")
    return true;
  if (environment === "node")
    return false;
  return ((typeof window !== 'undefined') && (typeof XMLHttpRequest === 'function') && !(window.require && window.module && window.process && window.process.type === "renderer"));
}

function hasGlobalProcessEventEmitter() {
  return ((typeof process === 'object') && (process !== null) && (typeof process.on === 'function'));
}

function handlerExec(list) {
  return function(arg) {
    for (var i = 0; i < list.length; i++) {
      var ret = list[i](arg);
      if (ret) {
        return ret;
      }
    }
    return null;
  };
}

var retrieveFile = handlerExec(retrieveFileHandlers);

retrieveFileHandlers.push(function(path) {
  // Trim the path to make sure there is no extra whitespace.
  path = path.trim();
  if (/^file:/.test(path)) {
    // existsSync/readFileSync can't handle file protocol, but once stripped, it works
    path = path.replace(/file:\/\/\/(\w:)?/, function(protocol, drive) {
      return drive ?
        '' : // file:///C:/dir/file -> C:/dir/file
        '/'; // file:///root-dir/file -> /root-dir/file
    });
  }
  if (path in fileContentsCache) {
    return fileContentsCache[path];
  }

  var contents = '';
  try {
    if (!fs) {
      // Use SJAX if we are in the browser
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, /** async */ false);
      xhr.send(null);
      if (xhr.readyState === 4 && xhr.status === 200) {
        contents = xhr.responseText;
      }
    } else if (fs.existsSync(path)) {
      // Otherwise, use the filesystem
      contents = fs.readFileSync(path, 'utf8');
    }
  } catch (er) {
    /* ignore any errors */
  }

  return fileContentsCache[path] = contents;
});

// Support URLs relative to a directory, but be careful about a protocol prefix
// in case we are in the browser (i.e. directories may start with "http://" or "file:///")
function supportRelativeURL(file, url) {
  if (!file) return url;
  var dir = path.dirname(file);
  var match = /^\w+:\/\/[^\/]*/.exec(dir);
  var protocol = match ? match[0] : '';
  var startPath = dir.slice(protocol.length);
  if (protocol && /^\/\w\:/.test(startPath)) {
    // handle file:///C:/ paths
    protocol += '/';
    return protocol + path.resolve(dir.slice(protocol.length), url).replace(/\\/g, '/');
  }
  return protocol + path.resolve(dir.slice(protocol.length), url);
}

function retrieveSourceMapURL(source) {
  var fileData;

  if (isInBrowser()) {
     try {
       var xhr = new XMLHttpRequest();
       xhr.open('GET', source, false);
       xhr.send(null);
       fileData = xhr.readyState === 4 ? xhr.responseText : null;

       // Support providing a sourceMappingURL via the SourceMap header
       var sourceMapHeader = xhr.getResponseHeader("SourceMap") ||
                             xhr.getResponseHeader("X-SourceMap");
       if (sourceMapHeader) {
         return sourceMapHeader;
       }
     } catch (e) {
     }
  }

  // Get the URL of the source map
  fileData = retrieveFile(source);
  var re = /(?:\/\/[@#][\s]*sourceMappingURL=([^\s'"]+)[\s]*$)|(?:\/\*[@#][\s]*sourceMappingURL=([^\s*'"]+)[\s]*(?:\*\/)[\s]*$)/mg;
  // Keep executing the search to find the *last* sourceMappingURL to avoid
  // picking up sourceMappingURLs from comments, strings, etc.
  var lastMatch, match;
  while (match = re.exec(fileData)) lastMatch = match;
  if (!lastMatch) return null;
  return lastMatch[1];
};

// Can be overridden by the retrieveSourceMap option to install. Takes a
// generated source filename; returns a {map, optional url} object, or null if
// there is no source map.  The map field may be either a string or the parsed
// JSON object (ie, it must be a valid argument to the SourceMapConsumer
// constructor).
var retrieveSourceMap = handlerExec(retrieveMapHandlers);
retrieveMapHandlers.push(function(source) {
  var sourceMappingURL = retrieveSourceMapURL(source);
  if (!sourceMappingURL) return null;

  // Read the contents of the source map
  var sourceMapData;
  if (reSourceMap.test(sourceMappingURL)) {
    // Support source map URL as a data url
    var rawData = sourceMappingURL.slice(sourceMappingURL.indexOf(',') + 1);
    sourceMapData = bufferFrom(rawData, "base64").toString();
    sourceMappingURL = source;
  } else {
    // Support source map URLs relative to the source URL
    sourceMappingURL = supportRelativeURL(source, sourceMappingURL);
    sourceMapData = retrieveFile(sourceMappingURL);
  }

  if (!sourceMapData) {
    return null;
  }

  return {
    url: sourceMappingURL,
    map: sourceMapData
  };
});

function mapSourcePosition(position) {
  var sourceMap = sourceMapCache[position.source];
  if (!sourceMap) {
    // Call the (overrideable) retrieveSourceMap function to get the source map.
    var urlAndMap = retrieveSourceMap(position.source);
    if (urlAndMap) {
      sourceMap = sourceMapCache[position.source] = {
        url: urlAndMap.url,
        map: new SourceMapConsumer(urlAndMap.map)
      };

      // Load all sources stored inline with the source map into the file cache
      // to pretend like they are already loaded. They may not exist on disk.
      if (sourceMap.map.sourcesContent) {
        sourceMap.map.sources.forEach(function(source, i) {
          var contents = sourceMap.map.sourcesContent[i];
          if (contents) {
            var url = supportRelativeURL(sourceMap.url, source);
            fileContentsCache[url] = contents;
          }
        });
      }
    } else {
      sourceMap = sourceMapCache[position.source] = {
        url: null,
        map: null
      };
    }
  }

  // Resolve the source URL relative to the URL of the source map
  if (sourceMap && sourceMap.map && typeof sourceMap.map.originalPositionFor === 'function') {
    var originalPosition = sourceMap.map.originalPositionFor(position);

    // Only return the original position if a matching line was found. If no
    // matching line is found then we return position instead, which will cause
    // the stack trace to print the path and line for the compiled file. It is
    // better to give a precise location in the compiled file than a vague
    // location in the original file.
    if (originalPosition.source !== null) {
      originalPosition.source = supportRelativeURL(
        sourceMap.url, originalPosition.source);
      return originalPosition;
    }
  }

  return position;
}

// Parses code generated by FormatEvalOrigin(), a function inside V8:
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js
function mapEvalOrigin(origin) {
  // Most eval() calls are in this format
  var match = /^eval at ([^(]+) \((.+):(\d+):(\d+)\)$/.exec(origin);
  if (match) {
    var position = mapSourcePosition({
      source: match[2],
      line: +match[3],
      column: match[4] - 1
    });
    return 'eval at ' + match[1] + ' (' + position.source + ':' +
      position.line + ':' + (position.column + 1) + ')';
  }

  // Parse nested eval() calls using recursion
  match = /^eval at ([^(]+) \((.+)\)$/.exec(origin);
  if (match) {
    return 'eval at ' + match[1] + ' (' + mapEvalOrigin(match[2]) + ')';
  }

  // Make sure we still return useful information if we didn't find anything
  return origin;
}

// This is copied almost verbatim from the V8 source code at
// https://code.google.com/p/v8/source/browse/trunk/src/messages.js. The
// implementation of wrapCallSite() used to just forward to the actual source
// code of CallSite.prototype.toString but unfortunately a new release of V8
// did something to the prototype chain and broke the shim. The only fix I
// could find was copy/paste.
function CallSiteToString() {
  var fileName;
  var fileLocation = "";
  if (this.isNative()) {
    fileLocation = "native";
  } else {
    fileName = this.getScriptNameOrSourceURL();
    if (!fileName && this.isEval()) {
      fileLocation = this.getEvalOrigin();
      fileLocation += ", ";  // Expecting source position to follow.
    }

    if (fileName) {
      fileLocation += fileName;
    } else {
      // Source code does not originate from a file and is not native, but we
      // can still get the source position inside the source string, e.g. in
      // an eval string.
      fileLocation += "<anonymous>";
    }
    var lineNumber = this.getLineNumber();
    if (lineNumber != null) {
      fileLocation += ":" + lineNumber;
      var columnNumber = this.getColumnNumber();
      if (columnNumber) {
        fileLocation += ":" + columnNumber;
      }
    }
  }

  var line = "";
  var functionName = this.getFunctionName();
  var addSuffix = true;
  var isConstructor = this.isConstructor();
  var isMethodCall = !(this.isToplevel() || isConstructor);
  if (isMethodCall) {
    var typeName = this.getTypeName();
    // Fixes shim to be backward compatable with Node v0 to v4
    if (typeName === "[object Object]") {
      typeName = "null";
    }
    var methodName = this.getMethodName();
    if (functionName) {
      if (typeName && functionName.indexOf(typeName) != 0) {
        line += typeName + ".";
      }
      line += functionName;
      if (methodName && functionName.indexOf("." + methodName) != functionName.length - methodName.length - 1) {
        line += " [as " + methodName + "]";
      }
    } else {
      line += typeName + "." + (methodName || "<anonymous>");
    }
  } else if (isConstructor) {
    line += "new " + (functionName || "<anonymous>");
  } else if (functionName) {
    line += functionName;
  } else {
    line += fileLocation;
    addSuffix = false;
  }
  if (addSuffix) {
    line += " (" + fileLocation + ")";
  }
  return line;
}

function cloneCallSite(frame) {
  var object = {};
  Object.getOwnPropertyNames(Object.getPrototypeOf(frame)).forEach(function(name) {
    object[name] = /^(?:is|get)/.test(name) ? function() { return frame[name].call(frame); } : frame[name];
  });
  object.toString = CallSiteToString;
  return object;
}

function wrapCallSite(frame, state) {
  // provides interface backward compatibility
  if (state === undefined) {
    state = { nextPosition: null, curPosition: null }
  }
  if(frame.isNative()) {
    state.curPosition = null;
    return frame;
  }

  // Most call sites will return the source file from getFileName(), but code
  // passed to eval() ending in "//# sourceURL=..." will return the source file
  // from getScriptNameOrSourceURL() instead
  var source = frame.getFileName() || frame.getScriptNameOrSourceURL();
  if (source) {
    var line = frame.getLineNumber();
    var column = frame.getColumnNumber() - 1;

    // Fix position in Node where some (internal) code is prepended.
    // See https://github.com/evanw/node-source-map-support/issues/36
    // Header removed in node at ^10.16 || >=11.11.0
    // v11 is not an LTS candidate, we can just test the one version with it.
    // Test node versions for: 10.16-19, 10.20+, 12-19, 20-99, 100+, or 11.11
    var noHeader = /^v(10\.1[6-9]|10\.[2-9][0-9]|10\.[0-9]{3,}|1[2-9]\d*|[2-9]\d|\d{3,}|11\.11)/;
    var headerLength = noHeader.test(process.version) ? 0 : 62;
    if (line === 1 && column > headerLength && !isInBrowser() && !frame.isEval()) {
      column -= headerLength;
    }

    var position = mapSourcePosition({
      source: source,
      line: line,
      column: column
    });
    state.curPosition = position;
    frame = cloneCallSite(frame);
    var originalFunctionName = frame.getFunctionName;
    frame.getFunctionName = function() {
      if (state.nextPosition == null) {
        return originalFunctionName();
      }
      return state.nextPosition.name || originalFunctionName();
    };
    frame.getFileName = function() { return position.source; };
    frame.getLineNumber = function() { return position.line; };
    frame.getColumnNumber = function() { return position.column + 1; };
    frame.getScriptNameOrSourceURL = function() { return position.source; };
    return frame;
  }

  // Code called using eval() needs special handling
  var origin = frame.isEval() && frame.getEvalOrigin();
  if (origin) {
    origin = mapEvalOrigin(origin);
    frame = cloneCallSite(frame);
    frame.getEvalOrigin = function() { return origin; };
    return frame;
  }

  // If we get here then we were unable to change the source position
  return frame;
}

// This function is part of the V8 stack trace API, for more info see:
// https://v8.dev/docs/stack-trace-api
function prepareStackTrace(error, stack) {
  if (emptyCacheBetweenOperations) {
    fileContentsCache = {};
    sourceMapCache = {};
  }

  var name = error.name || 'Error';
  var message = error.message || '';
  var errorString = name + ": " + message;

  var state = { nextPosition: null, curPosition: null };
  var processedStack = [];
  for (var i = stack.length - 1; i >= 0; i--) {
    processedStack.push('\n    at ' + wrapCallSite(stack[i], state));
    state.nextPosition = state.curPosition;
  }
  state.curPosition = state.nextPosition = null;
  return errorString + processedStack.reverse().join('');
}

// Generate position and snippet of original source with pointer
function getErrorSource(error) {
  var match = /\n    at [^(]+ \((.*):(\d+):(\d+)\)/.exec(error.stack);
  if (match) {
    var source = match[1];
    var line = +match[2];
    var column = +match[3];

    // Support the inline sourceContents inside the source map
    var contents = fileContentsCache[source];

    // Support files on disk
    if (!contents && fs && fs.existsSync(source)) {
      try {
        contents = fs.readFileSync(source, 'utf8');
      } catch (er) {
        contents = '';
      }
    }

    // Format the line from the original source code like node does
    if (contents) {
      var code = contents.split(/(?:\r\n|\r|\n)/)[line - 1];
      if (code) {
        return source + ':' + line + '\n' + code + '\n' +
          new Array(column).join(' ') + '^';
      }
    }
  }
  return null;
}

function printErrorAndExit (error) {
  var source = getErrorSource(error);

  // Ensure error is printed synchronously and not truncated
  if (process.stderr._handle && process.stderr._handle.setBlocking) {
    process.stderr._handle.setBlocking(true);
  }

  if (source) {
    console.error();
    console.error(source);
  }

  console.error(error.stack);
  process.exit(1);
}

function shimEmitUncaughtException () {
  var origEmit = process.emit;

  process.emit = function (type) {
    if (type === 'uncaughtException') {
      var hasStack = (arguments[1] && arguments[1].stack);
      var hasListeners = (this.listeners(type).length > 0);

      if (hasStack && !hasListeners) {
        return printErrorAndExit(arguments[1]);
      }
    }

    return origEmit.apply(this, arguments);
  };
}

var originalRetrieveFileHandlers = retrieveFileHandlers.slice(0);
var originalRetrieveMapHandlers = retrieveMapHandlers.slice(0);

exports.wrapCallSite = wrapCallSite;
exports.getErrorSource = getErrorSource;
exports.mapSourcePosition = mapSourcePosition;
exports.retrieveSourceMap = retrieveSourceMap;

exports.install = function(options) {
  options = options || {};

  if (options.environment) {
    environment = options.environment;
    if (["node", "browser", "auto"].indexOf(environment) === -1) {
      throw new Error("environment " + environment + " was unknown. Available options are {auto, browser, node}")
    }
  }

  // Allow sources to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveFile) {
    if (options.overrideRetrieveFile) {
      retrieveFileHandlers.length = 0;
    }

    retrieveFileHandlers.unshift(options.retrieveFile);
  }

  // Allow source maps to be found by methods other than reading the files
  // directly from disk.
  if (options.retrieveSourceMap) {
    if (options.overrideRetrieveSourceMap) {
      retrieveMapHandlers.length = 0;
    }

    retrieveMapHandlers.unshift(options.retrieveSourceMap);
  }

  // Support runtime transpilers that include inline source maps
  if (options.hookRequire && !isInBrowser()) {
    // Use dynamicRequire to avoid including in browser bundles
    var Module = dynamicRequire(module, 'module');
    var $compile = Module.prototype._compile;

    if (!$compile.__sourceMapSupport) {
      Module.prototype._compile = function(content, filename) {
        fileContentsCache[filename] = content;
        sourceMapCache[filename] = undefined;
        return $compile.call(this, content, filename);
      };

      Module.prototype._compile.__sourceMapSupport = true;
    }
  }

  // Configure options
  if (!emptyCacheBetweenOperations) {
    emptyCacheBetweenOperations = 'emptyCacheBetweenOperations' in options ?
      options.emptyCacheBetweenOperations : false;
  }

  // Install the error reformatter
  if (!errorFormatterInstalled) {
    errorFormatterInstalled = true;
    Error.prepareStackTrace = prepareStackTrace;
  }

  if (!uncaughtShimInstalled) {
    var installHandler = 'handleUncaughtExceptions' in options ?
      options.handleUncaughtExceptions : true;

    // Do not override 'uncaughtException' with our own handler in Node.js
    // Worker threads. Workers pass the error to the main thread as an event,
    // rather than printing something to stderr and exiting.
    try {
      // We need to use `dynamicRequire` because `require` on it's own will be optimized by WebPack/Browserify.
      var worker_threads = dynamicRequire(module, 'worker_threads');
      if (worker_threads.isMainThread === false) {
        installHandler = false;
      }
    } catch(e) {}

    // Provide the option to not install the uncaught exception handler. This is
    // to support other uncaught exception handlers (in test frameworks, for
    // example). If this handler is not installed and there are no other uncaught
    // exception handlers, uncaught exceptions will be caught by node's built-in
    // exception handler and the process will still be terminated. However, the
    // generated JavaScript code will be shown above the stack trace instead of
    // the original source code.
    if (installHandler && hasGlobalProcessEventEmitter()) {
      uncaughtShimInstalled = true;
      shimEmitUncaughtException();
    }
  }
};

exports.resetRetrieveHandlers = function() {
  retrieveFileHandlers.length = 0;
  retrieveMapHandlers.length = 0;

  retrieveFileHandlers = originalRetrieveFileHandlers.slice(0);
  retrieveMapHandlers = originalRetrieveMapHandlers.slice(0);

  retrieveSourceMap = handlerExec(retrieveMapHandlers);
  retrieveFile = handlerExec(retrieveFileHandlers);
}

},{"buffer-from":"buffer-from","fs":false,"path":"path","source-map":"source-map"}],"source-map":[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./lib/source-node').SourceNode;

},{"./lib/source-map-consumer":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-map-consumer.js","./lib/source-map-generator":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-map-generator.js","./lib/source-node":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\node_modules\\source-map\\lib\\source-node.js"}],"swarm-engine":[function(require,module,exports){
module.exports = {
    initialise:function(...args){
        if(typeof $$.swarmEngine === "undefined"){
            const SwarmEngine = require('./SwarmEngine');
            $$.swarmEngine = new SwarmEngine(...args);
        }else{
            $$.throw("Swarm engine already initialized!");
        }
    },
    OuterIsolatePowerCord: require("./powerCords/OuterIsolatePowerCord"),
    InnerIsolatePowerCord: require("./powerCords/InnerIsolatePowerCord"),
    OuterThreadPowerCord: require("./powerCords/OuterThreadPowerCord"),
    InnerThreadPowerCord: require("./powerCords/InnerThreadPowerCord"),
    RemoteChannelPairPowerCord: require("./powerCords/RemoteChannelPairPowerCord"),
    RemoteChannelPowerCord: require("./powerCords/RemoteChannelPowerCord"),
    SmartRemoteChannelPowerCord:require("./powerCords/SmartRemoteChannelPowerCord"),
    BootScripts: require('./bootScripts')
};

const or = require("overwrite-require");
const browserContexts = [or.constants.BROWSER_ENVIRONMENT_TYPE, or.constants.SERVICE_WORKER_ENVIRONMENT_TYPE];
if (browserContexts.indexOf($$.environmentType) !== -1) {
    module.exports.IframePowerCord = require("./powerCords/browser/IframePowerCord");
    module.exports.HostPowerCord = require("./powerCords/browser/HostPowerCord");
    module.exports.ServiceWorkerPC = require("./powerCords/browser/ServiceWorkerPC");
}

},{"./SwarmEngine":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\SwarmEngine.js","./bootScripts":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\bootScripts\\index.js","./powerCords/InnerIsolatePowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\InnerIsolatePowerCord.js","./powerCords/InnerThreadPowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\InnerThreadPowerCord.js","./powerCords/OuterIsolatePowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\OuterIsolatePowerCord.js","./powerCords/OuterThreadPowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\OuterThreadPowerCord.js","./powerCords/RemoteChannelPairPowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\RemoteChannelPairPowerCord.js","./powerCords/RemoteChannelPowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\RemoteChannelPowerCord.js","./powerCords/SmartRemoteChannelPowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\SmartRemoteChannelPowerCord.js","./powerCords/browser/HostPowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\HostPowerCord.js","./powerCords/browser/IframePowerCord":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\IframePowerCord.js","./powerCords/browser/ServiceWorkerPC":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarm-engine\\powerCords\\browser\\ServiceWorkerPC.js","overwrite-require":"overwrite-require"}],"swarmutils":[function(require,module,exports){
(function (global){
module.exports.OwM = require("./lib/OwM");
module.exports.beesHealer = require("./lib/beesHealer");

const uidGenerator = require("./lib/uidGenerator").createUidGenerator(200, 32);

module.exports.safe_uuid = require("./lib/safe-uuid").init(uidGenerator);

module.exports.Queue = require("./lib/Queue");
module.exports.combos = require("./lib/Combos");

module.exports.uidGenerator = uidGenerator;
module.exports.generateUid = uidGenerator.generateUid;
module.exports.TaskCounter = require("./lib/TaskCounter");
module.exports.SwarmPacker = require("./lib/SwarmPacker");
module.exports.path = require("./lib/path");
module.exports.createPskConsole = function () {
  return require('./lib/pskconsole');
};

module.exports.pingPongFork = require('./lib/pingpongFork');


if(typeof global.$$ == "undefined"){
  global.$$ = {};
}

if(typeof global.$$.uidGenerator == "undefined"){
    $$.uidGenerator = module.exports.safe_uuid;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./lib/Combos":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\Combos.js","./lib/OwM":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\OwM.js","./lib/Queue":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\Queue.js","./lib/SwarmPacker":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\SwarmPacker.js","./lib/TaskCounter":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\TaskCounter.js","./lib/beesHealer":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\beesHealer.js","./lib/path":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\path.js","./lib/pingpongFork":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\pingpongFork.js","./lib/pskconsole":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\pskconsole.js","./lib/safe-uuid":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\safe-uuid.js","./lib/uidGenerator":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\swarmutils\\lib\\uidGenerator.js"}],"syndicate":[function(require,module,exports){
const fs = require('fs');
const path = require('path');
const PoolConfig = require('./lib/PoolConfig');
const WorkerPool = require('./lib/WorkerPool');
const WorkerStrategies = require('./lib/WorkerStrategies');

/**
 * @throws if config is invalid, if config tries to set properties to undefined or add new properties (check PoolConfig to see solutions)
 * @throws if providing a working dir that does not exist, the directory should be created externally
 * @throws if trying to use a strategy that does not exist
 */
function createWorkerPool(poolConfig, workerCreateHelper) {
    const newPoolConfig = PoolConfig.createByOverwritingDefaults(poolConfig);

    if (newPoolConfig.workerOptions && newPoolConfig.workerOptions.cwd && !fs.existsSync(newPoolConfig.workerOptions.cwd)) {
        throw new Error(`The provided working directory does not exists ${config.workingDir}`);
    }

    let concretePool = null;

    if (newPoolConfig.workerStrategy === WorkerStrategies.THREADS) {
        const PoolThreads = require('./lib/Pool-Threads');

        concretePool = new PoolThreads(newPoolConfig, workerCreateHelper);
    } else if (newPoolConfig.workerStrategy === WorkerStrategies.ISOLATES) {
        const PoolIsolates = require('./lib/Pool-Isolates');

        concretePool = new PoolIsolates(newPoolConfig, workerCreateHelper)
    } else {
        throw new TypeError(`Could not find a implementation for worker strategy "${newPoolConfig.workerStrategy}"`);
    }

    return new WorkerPool(concretePool);
}


module.exports = {
    createWorkerPool,
    PoolConfig,
    WorkerStrategies
};

},{"./lib/Pool-Isolates":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\Pool-Isolates.js","./lib/Pool-Threads":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\Pool-Threads.js","./lib/PoolConfig":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\PoolConfig.js","./lib/WorkerPool":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\WorkerPool.js","./lib/WorkerStrategies":"D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\modules\\syndicate\\lib\\WorkerStrategies.js","fs":false,"path":"path"}]},{},["D:\\work\\git\\webcomponents\\pharmaledger-dev\\temp\\privatesky\\builds\\tmp\\pskruntime_intermediar.js"])
//# sourceMappingURL=pskruntime.js.map