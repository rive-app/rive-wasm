
var Rive = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(Rive) {
  Rive = Rive || {};

null;

var Module = typeof Rive !== "undefined" ? Rive : {};

var readyPromiseResolve, readyPromiseReject;

Module["ready"] = new Promise(function(resolve, reject) {
 readyPromiseResolve = resolve;
 readyPromiseReject = reject;
});

var moduleOverrides = {};

var key;

for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = function(status, toThrow) {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = false;

var ENVIRONMENT_IS_WORKER = false;

var ENVIRONMENT_IS_NODE = false;

var ENVIRONMENT_IS_SHELL = false;

ENVIRONMENT_IS_WEB = typeof window === "object";

ENVIRONMENT_IS_WORKER = typeof importScripts === "function";

ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";

ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

var nodeFS;

var nodePath;

if (ENVIRONMENT_IS_NODE) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = require("path").dirname(scriptDirectory) + "/";
 } else {
  scriptDirectory = __dirname + "/";
 }
 read_ = function shell_read(filename, binary) {
  var ret = tryParseAsDataURI(filename);
  if (ret) {
   return binary ? ret : ret.toString();
  }
  if (!nodeFS) nodeFS = require("fs");
  if (!nodePath) nodePath = require("path");
  filename = nodePath["normalize"](filename);
  return nodeFS["readFileSync"](filename, binary ? null : "utf8");
 };
 readBinary = function readBinary(filename) {
  var ret = read_(filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 if (process["argv"].length > 1) {
  thisProgram = process["argv"][1].replace(/\\/g, "/");
 }
 arguments_ = process["argv"].slice(2);
 process["on"]("uncaughtException", function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 });
 process["on"]("unhandledRejection", abort);
 quit_ = function(status) {
  process["exit"](status);
 };
 Module["inspect"] = function() {
  return "[Emscripten Module object]";
 };
} else if (ENVIRONMENT_IS_SHELL) {
 if (typeof read != "undefined") {
  read_ = function shell_read(f) {
   var data = tryParseAsDataURI(f);
   if (data) {
    return intArrayToString(data);
   }
   return read(f);
  };
 }
 readBinary = function readBinary(f) {
  var data;
  data = tryParseAsDataURI(f);
  if (data) {
   return data;
  }
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  arguments_ = scriptArgs;
 } else if (typeof arguments != "undefined") {
  arguments_ = arguments;
 }
 if (typeof quit === "function") {
  quit_ = function(status) {
   quit(status);
  };
 }
 if (typeof print !== "undefined") {
  if (typeof console === "undefined") console = {};
  console.log = print;
  console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (_scriptDir) {
  scriptDirectory = _scriptDir;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 {
  read_ = function shell_read(url) {
   try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
   } catch (err) {
    var data = tryParseAsDataURI(url);
    if (data) {
     return intArrayToString(data);
    }
    throw err;
   }
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = function readBinary(url) {
    try {
     var xhr = new XMLHttpRequest();
     xhr.open("GET", url, false);
     xhr.responseType = "arraybuffer";
     xhr.send(null);
     return new Uint8Array(xhr.response);
    } catch (err) {
     var data = tryParseAsDataURI(url);
     if (data) {
      return data;
     }
     throw err;
    }
   };
  }
  readAsync = function readAsync(url, onload, onerror) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = function xhr_onload() {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    var data = tryParseAsDataURI(url);
    if (data) {
     onload(data.buffer);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = function(title) {
  document.title = title;
 };
} else {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var tempRet0 = 0;

var setTempRet0 = function(value) {
 tempRet0 = value;
};

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

var noExitRuntime;

if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];

var WebAssembly = {
 Memory: function(opts) {
  this.buffer = new ArrayBuffer(opts["initial"] * 65536);
  this.grow = function(amount) {
   var ret = __growWasmMemory(amount);
   return ret;
  };
 },
 Table: function(opts) {
  var ret = new Array(opts["initial"]);
  ret.grow = function(by) {
   if (ret.length >= 900 + 0) {
    abort("Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.");
   }
   ret.push(null);
  };
  ret.set = function(i, func) {
   ret[i] = func;
  };
  ret.get = function(i) {
   return ret[i];
  };
  return ret;
 },
 Module: function(binary) {},
 Instance: function(module, info) {
  this.exports = (
// EMSCRIPTEN_START_ASM
function a(asmLibraryArg, wasmMemory, wasmTable) {
 var scratchBuffer = new ArrayBuffer(16);
 var b = new Int32Array(scratchBuffer);
 var c = new Float32Array(scratchBuffer);
 var d = new Float64Array(scratchBuffer);
 function e(index) {
  return b[index];
 }
 function f(index, value) {
  b[index] = value;
 }
 function g() {
  return d[0];
 }
 function h(value) {
  d[0] = value;
 }
 function i(value) {
  c[2] = value;
 }
 function j() {
  return c[2];
 }
 function k(global, env, buffer) {
  var l = env.memory;
  var m = wasmTable;
  var n = new global.Int8Array(buffer);
  var o = new global.Int16Array(buffer);
  var p = new global.Int32Array(buffer);
  var q = new global.Uint8Array(buffer);
  var r = new global.Uint16Array(buffer);
  var s = new global.Uint32Array(buffer);
  var t = new global.Float32Array(buffer);
  var u = new global.Float64Array(buffer);
  var v = global.Math.imul;
  var w = global.Math.fround;
  var x = global.Math.abs;
  var y = global.Math.clz32;
  var z = global.Math.min;
  var A = global.Math.max;
  var B = global.Math.floor;
  var C = global.Math.ceil;
  var D = global.Math.sqrt;
  var E = env.abort;
  var F = global.NaN;
  var G = global.Infinity;
  var H = env.a;
  var I = env.b;
  var J = env.c;
  var K = env.d;
  var L = env.e;
  var M = env.f;
  var N = env.g;
  var O = env.h;
  var P = env.i;
  var Q = env.j;
  var R = env.k;
  var S = env.l;
  var T = env.m;
  var U = env.n;
  var V = env.o;
  var W = env.p;
  var X = env.q;
  var Y = env.r;
  var Z = env.s;
  var _ = env.t;
  var $ = env.u;
  var aa = env.v;
  var ba = env.w;
  var ca = env.x;
  var da = env.y;
  var ea = env.z;
  var fa = env.A;
  var ga = env.B;
  var ha = env.C;
  var ia = env.D;
  var ja = env.E;
  var ka = env.F;
  var la = env.G;
  var ma = env.H;
  var na = env.I;
  var oa = env.J;
  var pa = env.K;
  var qa = env.L;
  var ra = env.M;
  var sa = 5265408;
  var ta = 0;
  
// EMSCRIPTEN_START_FUNCS
function $d(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0;
 m = sa - 16 | 0;
 sa = m;
 a : {
  b : {
   c : {
    d : {
     e : {
      f : {
       g : {
        h : {
         i : {
          j : {
           k : {
            l : {
             if (a >>> 0 <= 244) {
              e = p[5467];
              g = a >>> 0 < 11 ? 16 : a + 11 & -8;
              a = g >>> 3 | 0;
              b = e >>> a | 0;
              if (b & 3) {
               c = a + ((b ^ -1) & 1) | 0;
               f = c << 3;
               b = p[f + 21916 >> 2];
               a = b + 8 | 0;
               d = p[b + 8 >> 2];
               f = f + 21908 | 0;
               m : {
                if ((d | 0) == (f | 0)) {
                 n = 21868, o = Zw(c) & e, p[n >> 2] = o;
                 break m;
                }
                p[d + 12 >> 2] = f;
                p[f + 8 >> 2] = d;
               }
               c = c << 3;
               p[b + 4 >> 2] = c | 3;
               b = b + c | 0;
               p[b + 4 >> 2] = p[b + 4 >> 2] | 1;
               break a;
              }
              i = p[5469];
              if (g >>> 0 <= i >>> 0) {
               break l;
              }
              if (b) {
               c = 2 << a;
               a = (0 - c | c) & b << a;
               a = (0 - a & a) + -1 | 0;
               b = a >>> 12 & 16;
               c = b;
               a = a >>> b | 0;
               b = a >>> 5 & 8;
               c = c | b;
               a = a >>> b | 0;
               b = a >>> 2 & 4;
               c = c | b;
               a = a >>> b | 0;
               b = a >>> 1 & 2;
               c = c | b;
               a = a >>> b | 0;
               b = a >>> 1 & 1;
               c = (c | b) + (a >>> b | 0) | 0;
               d = c << 3;
               b = p[d + 21916 >> 2];
               a = p[b + 8 >> 2];
               d = d + 21908 | 0;
               n : {
                if ((a | 0) == (d | 0)) {
                 e = Zw(c) & e;
                 p[5467] = e;
                 break n;
                }
                p[a + 12 >> 2] = d;
                p[d + 8 >> 2] = a;
               }
               a = b + 8 | 0;
               p[b + 4 >> 2] = g | 3;
               h = b + g | 0;
               c = c << 3;
               f = c - g | 0;
               p[h + 4 >> 2] = f | 1;
               p[b + c >> 2] = f;
               if (i) {
                c = i >>> 3 | 0;
                b = (c << 3) + 21908 | 0;
                d = p[5472];
                c = 1 << c;
                o : {
                 if (!(c & e)) {
                  p[5467] = c | e;
                  c = b;
                  break o;
                 }
                 c = p[b + 8 >> 2];
                }
                p[b + 8 >> 2] = d;
                p[c + 12 >> 2] = d;
                p[d + 12 >> 2] = b;
                p[d + 8 >> 2] = c;
               }
               p[5472] = h;
               p[5469] = f;
               break a;
              }
              k = p[5468];
              if (!k) {
               break l;
              }
              a = (k & 0 - k) + -1 | 0;
              b = a >>> 12 & 16;
              c = b;
              a = a >>> b | 0;
              b = a >>> 5 & 8;
              c = c | b;
              a = a >>> b | 0;
              b = a >>> 2 & 4;
              c = c | b;
              a = a >>> b | 0;
              b = a >>> 1 & 2;
              c = c | b;
              a = a >>> b | 0;
              b = a >>> 1 & 1;
              b = p[((c | b) + (a >>> b | 0) << 2) + 22172 >> 2];
              d = (p[b + 4 >> 2] & -8) - g | 0;
              c = b;
              while (1) {
               p : {
                a = p[c + 16 >> 2];
                if (!a) {
                 a = p[c + 20 >> 2];
                 if (!a) {
                  break p;
                 }
                }
                f = (p[a + 4 >> 2] & -8) - g | 0;
                c = f >>> 0 < d >>> 0;
                d = c ? f : d;
                b = c ? a : b;
                c = a;
                continue;
               }
               break;
              }
              l = b + g | 0;
              if (l >>> 0 <= b >>> 0) {
               break k;
              }
              j = p[b + 24 >> 2];
              f = p[b + 12 >> 2];
              if ((f | 0) != (b | 0)) {
               a = p[b + 8 >> 2];
               p[a + 12 >> 2] = f;
               p[f + 8 >> 2] = a;
               break b;
              }
              c = b + 20 | 0;
              a = p[c >> 2];
              if (!a) {
               a = p[b + 16 >> 2];
               if (!a) {
                break j;
               }
               c = b + 16 | 0;
              }
              while (1) {
               h = c;
               f = a;
               c = a + 20 | 0;
               a = p[c >> 2];
               if (a) {
                continue;
               }
               c = f + 16 | 0;
               a = p[f + 16 >> 2];
               if (a) {
                continue;
               }
               break;
              }
              p[h >> 2] = 0;
              break b;
             }
             g = -1;
             if (a >>> 0 > 4294967231) {
              break l;
             }
             b = a + 11 | 0;
             g = b & -8;
             i = p[5468];
             if (!i) {
              break l;
             }
             c = 0 - g | 0;
             b = b >>> 8 | 0;
             e = 0;
             q : {
              if (!b) {
               break q;
              }
              e = 31;
              if (g >>> 0 > 16777215) {
               break q;
              }
              d = b + 1048320 >>> 16 & 8;
              b = b << d;
              a = b + 520192 >>> 16 & 4;
              e = b << a;
              b = e + 245760 >>> 16 & 2;
              a = (e << b >>> 15 | 0) - (b | (a | d)) | 0;
              e = (a << 1 | g >>> a + 21 & 1) + 28 | 0;
             }
             d = p[(e << 2) + 22172 >> 2];
             r : {
              s : {
               t : {
                if (!d) {
                 a = 0;
                 break t;
                }
                b = g << ((e | 0) == 31 ? 0 : 25 - (e >>> 1 | 0) | 0);
                a = 0;
                while (1) {
                 u : {
                  h = (p[d + 4 >> 2] & -8) - g | 0;
                  if (h >>> 0 >= c >>> 0) {
                   break u;
                  }
                  f = d;
                  c = h;
                  if (c) {
                   break u;
                  }
                  c = 0;
                  a = d;
                  break s;
                 }
                 h = p[d + 20 >> 2];
                 d = p[((b >>> 29 & 4) + d | 0) + 16 >> 2];
                 a = h ? (h | 0) == (d | 0) ? a : h : a;
                 b = b << ((d | 0) != 0);
                 if (d) {
                  continue;
                 }
                 break;
                }
               }
               if (!(a | f)) {
                a = 2 << e;
                a = (0 - a | a) & i;
                if (!a) {
                 break l;
                }
                a = (a & 0 - a) + -1 | 0;
                b = a >>> 12 & 16;
                d = b;
                a = a >>> b | 0;
                b = a >>> 5 & 8;
                d = d | b;
                a = a >>> b | 0;
                b = a >>> 2 & 4;
                d = d | b;
                a = a >>> b | 0;
                b = a >>> 1 & 2;
                d = d | b;
                a = a >>> b | 0;
                b = a >>> 1 & 1;
                a = p[((d | b) + (a >>> b | 0) << 2) + 22172 >> 2];
               }
               if (!a) {
                break r;
               }
              }
              while (1) {
               d = (p[a + 4 >> 2] & -8) - g | 0;
               b = d >>> 0 < c >>> 0;
               c = b ? d : c;
               f = b ? a : f;
               b = p[a + 16 >> 2];
               if (b) {
                a = b;
               } else {
                a = p[a + 20 >> 2];
               }
               if (a) {
                continue;
               }
               break;
              }
             }
             if (!f | c >>> 0 >= p[5469] - g >>> 0) {
              break l;
             }
             e = f + g | 0;
             if (e >>> 0 <= f >>> 0) {
              break k;
             }
             j = p[f + 24 >> 2];
             b = p[f + 12 >> 2];
             if ((f | 0) != (b | 0)) {
              a = p[f + 8 >> 2];
              p[a + 12 >> 2] = b;
              p[b + 8 >> 2] = a;
              break c;
             }
             d = f + 20 | 0;
             a = p[d >> 2];
             if (!a) {
              a = p[f + 16 >> 2];
              if (!a) {
               break i;
              }
              d = f + 16 | 0;
             }
             while (1) {
              h = d;
              b = a;
              d = a + 20 | 0;
              a = p[d >> 2];
              if (a) {
               continue;
              }
              d = b + 16 | 0;
              a = p[b + 16 >> 2];
              if (a) {
               continue;
              }
              break;
             }
             p[h >> 2] = 0;
             break c;
            }
            b = p[5469];
            if (b >>> 0 >= g >>> 0) {
             a = p[5472];
             c = b - g | 0;
             v : {
              if (c >>> 0 >= 16) {
               p[5469] = c;
               d = a + g | 0;
               p[5472] = d;
               p[d + 4 >> 2] = c | 1;
               p[a + b >> 2] = c;
               p[a + 4 >> 2] = g | 3;
               break v;
              }
              p[5472] = 0;
              p[5469] = 0;
              p[a + 4 >> 2] = b | 3;
              b = a + b | 0;
              p[b + 4 >> 2] = p[b + 4 >> 2] | 1;
             }
             a = a + 8 | 0;
             break a;
            }
            d = p[5470];
            if (d >>> 0 > g >>> 0) {
             b = d - g | 0;
             p[5470] = b;
             a = p[5473];
             c = a + g | 0;
             p[5473] = c;
             p[c + 4 >> 2] = b | 1;
             p[a + 4 >> 2] = g | 3;
             a = a + 8 | 0;
             break a;
            }
            a = 0;
            f = g + 47 | 0;
            c = f;
            if (p[5585]) {
             b = p[5587];
            } else {
             p[5588] = -1;
             p[5589] = -1;
             p[5586] = 4096;
             p[5587] = 4096;
             p[5585] = m + 12 & -16 ^ 1431655768;
             p[5590] = 0;
             p[5578] = 0;
             b = 4096;
            }
            e = c + b | 0;
            h = 0 - b | 0;
            c = e & h;
            if (c >>> 0 <= g >>> 0) {
             break a;
            }
            b = p[5577];
            if (b) {
             i = p[5575];
             j = i + c | 0;
             if (j >>> 0 <= i >>> 0 | j >>> 0 > b >>> 0) {
              break a;
             }
            }
            if (q[22312] & 4) {
             break f;
            }
            w : {
             x : {
              b = p[5473];
              if (b) {
               a = 22316;
               while (1) {
                i = p[a >> 2];
                if (i + p[a + 4 >> 2] >>> 0 > b >>> 0 ? i >>> 0 <= b >>> 0 : 0) {
                 break x;
                }
                a = p[a + 8 >> 2];
                if (a) {
                 continue;
                }
                break;
               }
              }
              b = wc(0);
              if ((b | 0) == -1) {
               break g;
              }
              e = c;
              a = p[5586];
              d = a + -1 | 0;
              if (d & b) {
               e = (c - b | 0) + (b + d & 0 - a) | 0;
              }
              if (e >>> 0 <= g >>> 0 | e >>> 0 > 2147483646) {
               break g;
              }
              a = p[5577];
              if (a) {
               d = p[5575];
               h = d + e | 0;
               if (h >>> 0 <= d >>> 0 | h >>> 0 > a >>> 0) {
                break g;
               }
              }
              a = wc(e);
              if ((b | 0) != (a | 0)) {
               break w;
              }
              break e;
             }
             e = h & e - d;
             if (e >>> 0 > 2147483646) {
              break g;
             }
             b = wc(e);
             if ((b | 0) == (p[a >> 2] + p[a + 4 >> 2] | 0)) {
              break h;
             }
             a = b;
            }
            if (!((a | 0) == -1 | g + 48 >>> 0 <= e >>> 0)) {
             b = p[5587];
             b = b + (f - e | 0) & 0 - b;
             if (b >>> 0 > 2147483646) {
              b = a;
              break e;
             }
             if ((wc(b) | 0) != -1) {
              e = b + e | 0;
              b = a;
              break e;
             }
             wc(0 - e | 0);
             break g;
            }
            b = a;
            if ((a | 0) != -1) {
             break e;
            }
            break g;
           }
           E();
          }
          f = 0;
          break b;
         }
         b = 0;
         break c;
        }
        if ((b | 0) != -1) {
         break e;
        }
       }
       p[5578] = p[5578] | 4;
      }
      if (c >>> 0 > 2147483646) {
       break d;
      }
      b = wc(c);
      a = wc(0);
      if (b >>> 0 >= a >>> 0 | (b | 0) == -1 | (a | 0) == -1) {
       break d;
      }
      e = a - b | 0;
      if (e >>> 0 <= g + 40 >>> 0) {
       break d;
      }
     }
     a = p[5575] + e | 0;
     p[5575] = a;
     if (a >>> 0 > s[5576]) {
      p[5576] = a;
     }
     y : {
      z : {
       A : {
        c = p[5473];
        if (c) {
         a = 22316;
         while (1) {
          d = p[a >> 2];
          f = p[a + 4 >> 2];
          if ((d + f | 0) == (b | 0)) {
           break A;
          }
          a = p[a + 8 >> 2];
          if (a) {
           continue;
          }
          break;
         }
         break z;
        }
        a = p[5471];
        if (!(b >>> 0 >= a >>> 0 ? a : 0)) {
         p[5471] = b;
        }
        a = 0;
        p[5580] = e;
        p[5579] = b;
        p[5475] = -1;
        p[5476] = p[5585];
        p[5582] = 0;
        while (1) {
         c = a << 3;
         d = c + 21908 | 0;
         p[c + 21916 >> 2] = d;
         p[c + 21920 >> 2] = d;
         a = a + 1 | 0;
         if ((a | 0) != 32) {
          continue;
         }
         break;
        }
        a = e + -40 | 0;
        c = b + 8 & 7 ? -8 - b & 7 : 0;
        d = a - c | 0;
        p[5470] = d;
        c = b + c | 0;
        p[5473] = c;
        p[c + 4 >> 2] = d | 1;
        p[(a + b | 0) + 4 >> 2] = 40;
        p[5474] = p[5589];
        break y;
       }
       if (q[a + 12 | 0] & 8 | b >>> 0 <= c >>> 0 | d >>> 0 > c >>> 0) {
        break z;
       }
       p[a + 4 >> 2] = e + f;
       a = c + 8 & 7 ? -8 - c & 7 : 0;
       b = a + c | 0;
       p[5473] = b;
       d = p[5470] + e | 0;
       a = d - a | 0;
       p[5470] = a;
       p[b + 4 >> 2] = a | 1;
       p[(c + d | 0) + 4 >> 2] = 40;
       p[5474] = p[5589];
       break y;
      }
      f = p[5471];
      if (b >>> 0 < f >>> 0) {
       p[5471] = b;
       f = 0;
      }
      d = b + e | 0;
      a = 22316;
      B : {
       C : {
        D : {
         E : {
          F : {
           G : {
            while (1) {
             if ((d | 0) != p[a >> 2]) {
              a = p[a + 8 >> 2];
              if (a) {
               continue;
              }
              break G;
             }
             break;
            }
            if (!(q[a + 12 | 0] & 8)) {
             break F;
            }
           }
           a = 22316;
           while (1) {
            d = p[a >> 2];
            if (d >>> 0 <= c >>> 0) {
             f = d + p[a + 4 >> 2] | 0;
             if (f >>> 0 > c >>> 0) {
              break E;
             }
            }
            a = p[a + 8 >> 2];
            continue;
           }
          }
          p[a >> 2] = b;
          p[a + 4 >> 2] = p[a + 4 >> 2] + e;
          j = (b + 8 & 7 ? -8 - b & 7 : 0) + b | 0;
          p[j + 4 >> 2] = g | 3;
          b = d + (d + 8 & 7 ? -8 - d & 7 : 0) | 0;
          a = (b - j | 0) - g | 0;
          h = g + j | 0;
          if ((b | 0) == (c | 0)) {
           p[5473] = h;
           a = p[5470] + a | 0;
           p[5470] = a;
           p[h + 4 >> 2] = a | 1;
           break C;
          }
          if (p[5472] == (b | 0)) {
           p[5472] = h;
           a = p[5469] + a | 0;
           p[5469] = a;
           p[h + 4 >> 2] = a | 1;
           p[a + h >> 2] = a;
           break C;
          }
          c = p[b + 4 >> 2];
          if ((c & 3) == 1) {
           k = c & -8;
           H : {
            if (c >>> 0 <= 255) {
             f = c >>> 3 | 0;
             c = p[b + 8 >> 2];
             d = p[b + 12 >> 2];
             if ((d | 0) == (c | 0)) {
              n = 21868, o = p[5467] & Zw(f), p[n >> 2] = o;
              break H;
             }
             p[c + 12 >> 2] = d;
             p[d + 8 >> 2] = c;
             break H;
            }
            i = p[b + 24 >> 2];
            e = p[b + 12 >> 2];
            I : {
             if ((e | 0) != (b | 0)) {
              c = p[b + 8 >> 2];
              p[c + 12 >> 2] = e;
              p[e + 8 >> 2] = c;
              break I;
             }
             J : {
              d = b + 20 | 0;
              g = p[d >> 2];
              if (g) {
               break J;
              }
              d = b + 16 | 0;
              g = p[d >> 2];
              if (g) {
               break J;
              }
              e = 0;
              break I;
             }
             while (1) {
              c = d;
              e = g;
              d = e + 20 | 0;
              g = p[d >> 2];
              if (g) {
               continue;
              }
              d = e + 16 | 0;
              g = p[e + 16 >> 2];
              if (g) {
               continue;
              }
              break;
             }
             p[c >> 2] = 0;
            }
            if (!i) {
             break H;
            }
            c = p[b + 28 >> 2];
            d = (c << 2) + 22172 | 0;
            K : {
             if (p[d >> 2] == (b | 0)) {
              p[d >> 2] = e;
              if (e) {
               break K;
              }
              n = 21872, o = p[5468] & Zw(c), p[n >> 2] = o;
              break H;
             }
             p[i + (p[i + 16 >> 2] == (b | 0) ? 16 : 20) >> 2] = e;
             if (!e) {
              break H;
             }
            }
            p[e + 24 >> 2] = i;
            c = p[b + 16 >> 2];
            if (c) {
             p[e + 16 >> 2] = c;
             p[c + 24 >> 2] = e;
            }
            c = p[b + 20 >> 2];
            if (!c) {
             break H;
            }
            p[e + 20 >> 2] = c;
            p[c + 24 >> 2] = e;
           }
           b = b + k | 0;
           a = a + k | 0;
          }
          p[b + 4 >> 2] = p[b + 4 >> 2] & -2;
          p[h + 4 >> 2] = a | 1;
          p[a + h >> 2] = a;
          if (a >>> 0 <= 255) {
           b = a >>> 3 | 0;
           a = (b << 3) + 21908 | 0;
           c = p[5467];
           b = 1 << b;
           L : {
            if (!(c & b)) {
             p[5467] = b | c;
             b = a;
             break L;
            }
            b = p[a + 8 >> 2];
           }
           p[a + 8 >> 2] = h;
           p[b + 12 >> 2] = h;
           p[h + 12 >> 2] = a;
           p[h + 8 >> 2] = b;
           break C;
          }
          c = h;
          d = a >>> 8 | 0;
          b = 0;
          M : {
           if (!d) {
            break M;
           }
           b = 31;
           if (a >>> 0 > 16777215) {
            break M;
           }
           f = d + 1048320 >>> 16 & 8;
           d = d << f;
           b = d + 520192 >>> 16 & 4;
           g = d << b;
           d = g + 245760 >>> 16 & 2;
           b = (g << d >>> 15 | 0) - (d | (b | f)) | 0;
           b = (b << 1 | a >>> b + 21 & 1) + 28 | 0;
          }
          p[c + 28 >> 2] = b;
          p[h + 16 >> 2] = 0;
          p[h + 20 >> 2] = 0;
          c = (b << 2) + 22172 | 0;
          d = p[5468];
          f = 1 << b;
          N : {
           if (!(d & f)) {
            p[5468] = d | f;
            p[c >> 2] = h;
            break N;
           }
           d = a << ((b | 0) == 31 ? 0 : 25 - (b >>> 1 | 0) | 0);
           b = p[c >> 2];
           while (1) {
            c = b;
            if ((p[b + 4 >> 2] & -8) == (a | 0)) {
             break D;
            }
            b = d >>> 29 | 0;
            d = d << 1;
            f = (b & 4) + c | 0;
            b = p[f + 16 >> 2];
            if (b) {
             continue;
            }
            break;
           }
           p[f + 16 >> 2] = h;
          }
          p[h + 24 >> 2] = c;
          p[h + 12 >> 2] = h;
          p[h + 8 >> 2] = h;
          break C;
         }
         a = e + -40 | 0;
         d = b + 8 & 7 ? -8 - b & 7 : 0;
         h = a - d | 0;
         p[5470] = h;
         d = b + d | 0;
         p[5473] = d;
         p[d + 4 >> 2] = h | 1;
         p[(a + b | 0) + 4 >> 2] = 40;
         p[5474] = p[5589];
         a = (f + (f + -39 & 7 ? 39 - f & 7 : 0) | 0) + -47 | 0;
         d = a >>> 0 < c + 16 >>> 0 ? c : a;
         p[d + 4 >> 2] = 27;
         a = p[5582];
         p[d + 16 >> 2] = p[5581];
         p[d + 20 >> 2] = a;
         a = p[5580];
         p[d + 8 >> 2] = p[5579];
         p[d + 12 >> 2] = a;
         p[5581] = d + 8;
         p[5580] = e;
         p[5579] = b;
         p[5582] = 0;
         a = d + 24 | 0;
         while (1) {
          p[a + 4 >> 2] = 7;
          b = a + 8 | 0;
          a = a + 4 | 0;
          if (f >>> 0 > b >>> 0) {
           continue;
          }
          break;
         }
         if ((c | 0) == (d | 0)) {
          break y;
         }
         p[d + 4 >> 2] = p[d + 4 >> 2] & -2;
         f = d - c | 0;
         p[c + 4 >> 2] = f | 1;
         p[d >> 2] = f;
         if (f >>> 0 <= 255) {
          b = f >>> 3 | 0;
          a = (b << 3) + 21908 | 0;
          d = p[5467];
          b = 1 << b;
          O : {
           if (!(d & b)) {
            p[5467] = b | d;
            b = a;
            break O;
           }
           b = p[a + 8 >> 2];
          }
          p[a + 8 >> 2] = c;
          p[b + 12 >> 2] = c;
          p[c + 12 >> 2] = a;
          p[c + 8 >> 2] = b;
          break y;
         }
         p[c + 16 >> 2] = 0;
         p[c + 20 >> 2] = 0;
         b = c;
         d = f >>> 8 | 0;
         a = 0;
         P : {
          if (!d) {
           break P;
          }
          a = 31;
          if (f >>> 0 > 16777215) {
           break P;
          }
          e = d + 1048320 >>> 16 & 8;
          d = d << e;
          a = d + 520192 >>> 16 & 4;
          h = d << a;
          d = h + 245760 >>> 16 & 2;
          a = (h << d >>> 15 | 0) - (d | (a | e)) | 0;
          a = (a << 1 | f >>> a + 21 & 1) + 28 | 0;
         }
         p[b + 28 >> 2] = a;
         b = (a << 2) + 22172 | 0;
         d = p[5468];
         e = 1 << a;
         Q : {
          if (!(d & e)) {
           p[5468] = d | e;
           p[b >> 2] = c;
           p[c + 24 >> 2] = b;
           break Q;
          }
          a = f << ((a | 0) == 31 ? 0 : 25 - (a >>> 1 | 0) | 0);
          b = p[b >> 2];
          while (1) {
           d = b;
           if ((f | 0) == (p[b + 4 >> 2] & -8)) {
            break B;
           }
           b = a >>> 29 | 0;
           a = a << 1;
           e = d + (b & 4) | 0;
           b = p[e + 16 >> 2];
           if (b) {
            continue;
           }
           break;
          }
          p[e + 16 >> 2] = c;
          p[c + 24 >> 2] = d;
         }
         p[c + 12 >> 2] = c;
         p[c + 8 >> 2] = c;
         break y;
        }
        a = p[c + 8 >> 2];
        p[a + 12 >> 2] = h;
        p[c + 8 >> 2] = h;
        p[h + 24 >> 2] = 0;
        p[h + 12 >> 2] = c;
        p[h + 8 >> 2] = a;
       }
       a = j + 8 | 0;
       break a;
      }
      a = p[d + 8 >> 2];
      p[a + 12 >> 2] = c;
      p[d + 8 >> 2] = c;
      p[c + 24 >> 2] = 0;
      p[c + 12 >> 2] = d;
      p[c + 8 >> 2] = a;
     }
     a = p[5470];
     if (a >>> 0 <= g >>> 0) {
      break d;
     }
     b = a - g | 0;
     p[5470] = b;
     a = p[5473];
     c = a + g | 0;
     p[5473] = c;
     p[c + 4 >> 2] = b | 1;
     p[a + 4 >> 2] = g | 3;
     a = a + 8 | 0;
     break a;
    }
    p[5449] = 48;
    a = 0;
    break a;
   }
   R : {
    if (!j) {
     break R;
    }
    a = p[f + 28 >> 2];
    d = (a << 2) + 22172 | 0;
    S : {
     if (p[d >> 2] == (f | 0)) {
      p[d >> 2] = b;
      if (b) {
       break S;
      }
      i = Zw(a) & i;
      p[5468] = i;
      break R;
     }
     p[j + (p[j + 16 >> 2] == (f | 0) ? 16 : 20) >> 2] = b;
     if (!b) {
      break R;
     }
    }
    p[b + 24 >> 2] = j;
    a = p[f + 16 >> 2];
    if (a) {
     p[b + 16 >> 2] = a;
     p[a + 24 >> 2] = b;
    }
    a = p[f + 20 >> 2];
    if (!a) {
     break R;
    }
    p[b + 20 >> 2] = a;
    p[a + 24 >> 2] = b;
   }
   T : {
    if (c >>> 0 <= 15) {
     a = c + g | 0;
     p[f + 4 >> 2] = a | 3;
     a = a + f | 0;
     p[a + 4 >> 2] = p[a + 4 >> 2] | 1;
     break T;
    }
    p[f + 4 >> 2] = g | 3;
    p[e + 4 >> 2] = c | 1;
    p[c + e >> 2] = c;
    if (c >>> 0 <= 255) {
     b = c >>> 3 | 0;
     a = (b << 3) + 21908 | 0;
     c = p[5467];
     b = 1 << b;
     U : {
      if (!(c & b)) {
       p[5467] = b | c;
       b = a;
       break U;
      }
      b = p[a + 8 >> 2];
     }
     p[a + 8 >> 2] = e;
     p[b + 12 >> 2] = e;
     p[e + 12 >> 2] = a;
     p[e + 8 >> 2] = b;
     break T;
    }
    b = e;
    d = c >>> 8 | 0;
    a = 0;
    V : {
     if (!d) {
      break V;
     }
     a = 31;
     if (c >>> 0 > 16777215) {
      break V;
     }
     g = d + 1048320 >>> 16 & 8;
     d = d << g;
     a = d + 520192 >>> 16 & 4;
     h = d << a;
     d = h + 245760 >>> 16 & 2;
     a = (h << d >>> 15 | 0) - (d | (a | g)) | 0;
     a = (a << 1 | c >>> a + 21 & 1) + 28 | 0;
    }
    p[b + 28 >> 2] = a;
    p[e + 16 >> 2] = 0;
    p[e + 20 >> 2] = 0;
    b = (a << 2) + 22172 | 0;
    W : {
     d = 1 << a;
     X : {
      if (!(d & i)) {
       p[5468] = d | i;
       p[b >> 2] = e;
       break X;
      }
      a = c << ((a | 0) == 31 ? 0 : 25 - (a >>> 1 | 0) | 0);
      g = p[b >> 2];
      while (1) {
       b = g;
       if ((p[b + 4 >> 2] & -8) == (c | 0)) {
        break W;
       }
       d = a >>> 29 | 0;
       a = a << 1;
       d = (d & 4) + b | 0;
       g = p[d + 16 >> 2];
       if (g) {
        continue;
       }
       break;
      }
      p[d + 16 >> 2] = e;
     }
     p[e + 24 >> 2] = b;
     p[e + 12 >> 2] = e;
     p[e + 8 >> 2] = e;
     break T;
    }
    a = p[b + 8 >> 2];
    p[a + 12 >> 2] = e;
    p[b + 8 >> 2] = e;
    p[e + 24 >> 2] = 0;
    p[e + 12 >> 2] = b;
    p[e + 8 >> 2] = a;
   }
   a = f + 8 | 0;
   break a;
  }
  Y : {
   if (!j) {
    break Y;
   }
   a = p[b + 28 >> 2];
   c = (a << 2) + 22172 | 0;
   Z : {
    if (p[c >> 2] == (b | 0)) {
     p[c >> 2] = f;
     if (f) {
      break Z;
     }
     n = 21872, o = Zw(a) & k, p[n >> 2] = o;
     break Y;
    }
    p[j + (p[j + 16 >> 2] == (b | 0) ? 16 : 20) >> 2] = f;
    if (!f) {
     break Y;
    }
   }
   p[f + 24 >> 2] = j;
   a = p[b + 16 >> 2];
   if (a) {
    p[f + 16 >> 2] = a;
    p[a + 24 >> 2] = f;
   }
   a = p[b + 20 >> 2];
   if (!a) {
    break Y;
   }
   p[f + 20 >> 2] = a;
   p[a + 24 >> 2] = f;
  }
  _ : {
   if (d >>> 0 <= 15) {
    a = d + g | 0;
    p[b + 4 >> 2] = a | 3;
    a = a + b | 0;
    p[a + 4 >> 2] = p[a + 4 >> 2] | 1;
    break _;
   }
   p[b + 4 >> 2] = g | 3;
   p[l + 4 >> 2] = d | 1;
   p[d + l >> 2] = d;
   if (i) {
    c = i >>> 3 | 0;
    a = (c << 3) + 21908 | 0;
    f = p[5472];
    c = 1 << c;
    $ : {
     if (!(c & e)) {
      p[5467] = c | e;
      c = a;
      break $;
     }
     c = p[a + 8 >> 2];
    }
    p[a + 8 >> 2] = f;
    p[c + 12 >> 2] = f;
    p[f + 12 >> 2] = a;
    p[f + 8 >> 2] = c;
   }
   p[5472] = l;
   p[5469] = d;
  }
  a = b + 8 | 0;
 }
 sa = m + 16 | 0;
 return a | 0;
}
function xl() {
 var a = 0, b = 0, c = 0, d = 0, e = 0;
 a = sa - 1408 | 0;
 sa = a;
 wl();
 L(21574, 21575, 21576, 0, 14792, 686, 14795, 0, 14795, 0, 13569, 14797, 687);
 p[a + 856 >> 2] = 8;
 p[a + 860 >> 2] = 1;
 p[a + 1400 >> 2] = 8;
 p[a + 1404 >> 2] = 1;
 Xf(13578, a + 856 | 0);
 p[a + 848 >> 2] = 12;
 p[a + 852 >> 2] = 1;
 p[a + 1400 >> 2] = 12;
 p[a + 1404 >> 2] = 1;
 Xf(13583, a + 848 | 0);
 p[a + 840 >> 2] = 16;
 p[a + 844 >> 2] = 1;
 p[a + 1400 >> 2] = 16;
 p[a + 1404 >> 2] = 1;
 tl(a + 840 | 0);
 p[a + 832 >> 2] = 20;
 p[a + 836 >> 2] = 1;
 p[a + 1400 >> 2] = 20;
 p[a + 1404 >> 2] = 1;
 sl(a + 832 | 0);
 p[a + 824 >> 2] = 24;
 p[a + 828 >> 2] = 1;
 p[a + 1400 >> 2] = 24;
 p[a + 1404 >> 2] = 1;
 rl(a + 824 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 688;
 b = p[a + 1404 >> 2];
 p[a + 816 >> 2] = p[a + 1400 >> 2];
 p[a + 820 >> 2] = b;
 pl(a + 816 | 0);
 L(21577, 21578, 21583, 21574, 14792, 689, 14792, 802, 14792, 803, 13625, 14797, 690);
 nl();
 P(21574, 14932, 2, 14960, 14788, 691, 692);
 P(21574, 14942, 3, 15120, 15132, 693, 694);
 L(21617, 21558, 21618, 0, 14792, 695, 14795, 0, 14795, 0, 13641, 14797, 696);
 p[a + 808 >> 2] = 8;
 p[a + 812 >> 2] = 1;
 p[a + 1400 >> 2] = 8;
 p[a + 1404 >> 2] = 1;
 Wf(13652, a + 808 | 0);
 p[a + 800 >> 2] = 40;
 p[a + 804 >> 2] = 1;
 p[a + 1400 >> 2] = 40;
 p[a + 1404 >> 2] = 1;
 hl(a + 800 | 0);
 p[a + 792 >> 2] = 12;
 p[a + 796 >> 2] = 1;
 p[a + 1400 >> 2] = 12;
 p[a + 1404 >> 2] = 1;
 gl(a + 792 | 0);
 p[a + 784 >> 2] = 20;
 p[a + 788 >> 2] = 1;
 p[a + 1400 >> 2] = 20;
 p[a + 1404 >> 2] = 1;
 Vf(13675, a + 784 | 0);
 p[a + 776 >> 2] = 24;
 p[a + 780 >> 2] = 1;
 p[a + 1400 >> 2] = 24;
 p[a + 1404 >> 2] = 1;
 Vf(13682, a + 776 | 0);
 p[a + 768 >> 2] = 28;
 p[a + 772 >> 2] = 1;
 p[a + 1400 >> 2] = 28;
 p[a + 1404 >> 2] = 1;
 fl(a + 768 | 0);
 p[a + 760 >> 2] = 32;
 p[a + 764 >> 2] = 1;
 p[a + 1400 >> 2] = 32;
 p[a + 1404 >> 2] = 1;
 Wf(13697, a + 760 | 0);
 L(21619, 21620, 21623, 21617, 14792, 697, 14792, 811, 14792, 812, 13703, 14797, 698);
 cl();
 P(21617, 14932, 2, 15268, 14788, 699, 700);
 P(21617, 14942, 3, 15120, 15132, 693, 701);
 R(21656, 13721, 4, 1);
 Uf(Uf(a + 1400 | 0, 13738, 1), 13743, 0);
 R(21621, 13750, 4, 1);
 Tf(Tf(a + 1400 | 0, 13759, 0), 13767, 1);
 R(21657, 13775, 4, 0);
 he(he(he(a + 1400 | 0, 13785, 0), 13790, 1), 13796, 2);
 R(21658, 13803, 4, 0);
 ge(ge(ge(a + 1400 | 0, 13814, 0), 13790, 1), 13820, 2);
 R(21659, 13826, 4, 0);
 vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(vb(a + 1400 | 0, 13836, 3), 13844, 14), 13851, 15), 13859, 16), 13866, 17), 13874, 18), 13885, 19), 13895, 20), 13905, 21), 13915, 22), 13926, 23), 13936, 24), 13945, 25), 13949, 26), 13960, 27), 13966, 28);
 L(21660, 21557, 21661, 0, 14792, 702, 14795, 0, 14795, 0, 13977, 14797, 703);
 p[a + 752 >> 2] = 4;
 p[a + 756 >> 2] = 1;
 p[a + 1400 >> 2] = 4;
 p[a + 1404 >> 2] = 1;
 Yk(a + 752 | 0);
 p[a + 744 >> 2] = 0;
 p[a + 748 >> 2] = 1;
 p[a + 1400 >> 2] = 0;
 p[a + 1404 >> 2] = 1;
 Xk(a + 744 | 0);
 p[a + 736 >> 2] = 8;
 p[a + 740 >> 2] = 1;
 p[a + 1400 >> 2] = 8;
 p[a + 1404 >> 2] = 1;
 Wk(a + 736 | 0);
 p[a + 728 >> 2] = 12;
 p[a + 732 >> 2] = 1;
 p[a + 1400 >> 2] = 12;
 p[a + 1404 >> 2] = 1;
 Vk(a + 728 | 0);
 p[a + 720 >> 2] = 16;
 p[a + 724 >> 2] = 1;
 p[a + 1400 >> 2] = 16;
 p[a + 1404 >> 2] = 1;
 Uk(a + 720 | 0);
 p[a + 712 >> 2] = 20;
 p[a + 716 >> 2] = 1;
 p[a + 1400 >> 2] = 20;
 p[a + 1404 >> 2] = 1;
 Tk(a + 712 | 0);
 p[a + 704 >> 2] = 24;
 p[a + 708 >> 2] = 1;
 p[a + 1400 >> 2] = 24;
 p[a + 1404 >> 2] = 1;
 Rf(14024, a + 704 | 0);
 p[a + 696 >> 2] = 28;
 p[a + 700 >> 2] = 1;
 p[a + 1400 >> 2] = 28;
 p[a + 1404 >> 2] = 1;
 Rf(14039, a + 696 | 0);
 p[a + 688 >> 2] = 32;
 p[a + 692 >> 2] = 1;
 p[a + 1400 >> 2] = 32;
 p[a + 1404 >> 2] = 1;
 Sk(a + 688 | 0);
 p[a + 680 >> 2] = 36;
 p[a + 684 >> 2] = 1;
 p[a + 1400 >> 2] = 36;
 p[a + 1404 >> 2] = 1;
 Rk(a + 680 | 0);
 L(21662, 21663, 21664, 21660, 14792, 704, 14792, 824, 14792, 825, 14079, 14797, 705);
 Ok();
 P(21660, 14932, 2, 15656, 14788, 706, 707);
 P(21660, 14942, 3, 15120, 15132, 693, 708);
 L(21579, 21732, 21733, 0, 14792, 709, 14795, 0, 14795, 0, 14098, 14797, 710);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 711;
 b = p[a + 1404 >> 2];
 p[a + 672 >> 2] = p[a + 1400 >> 2];
 p[a + 676 >> 2] = b;
 I(21579, 14104, 21622, 15920, 712, Ya(a + 672 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 713;
 b = p[a + 1404 >> 2];
 p[a + 664 >> 2] = p[a + 1400 >> 2];
 p[a + 668 >> 2] = b;
 I(21579, 14107, 21622, 15920, 712, Ya(a + 664 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 714;
 b = p[a + 1404 >> 2];
 p[a + 656 >> 2] = p[a + 1400 >> 2];
 p[a + 660 >> 2] = b;
 I(21579, 14110, 21622, 15920, 712, Ya(a + 656 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 715;
 b = p[a + 1404 >> 2];
 p[a + 648 >> 2] = p[a + 1400 >> 2];
 p[a + 652 >> 2] = b;
 I(21579, 14113, 21622, 15920, 712, Ya(a + 648 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 716;
 b = p[a + 1404 >> 2];
 p[a + 640 >> 2] = p[a + 1400 >> 2];
 p[a + 644 >> 2] = b;
 I(21579, 14116, 21622, 15920, 712, Ya(a + 640 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 717;
 b = p[a + 1404 >> 2];
 p[a + 632 >> 2] = p[a + 1400 >> 2];
 p[a + 636 >> 2] = b;
 I(21579, 14119, 21622, 15920, 712, Ya(a + 632 | 0) | 0, 0, 0, 0, 0);
 L(21734, 21573, 21735, 0, 14792, 718, 14795, 0, 14795, 0, 14122, 14797, 719);
 p[a + 1380 >> 2] = 0;
 p[a + 1376 >> 2] = 720;
 b = p[a + 1380 >> 2];
 p[a + 624 >> 2] = p[a + 1376 >> 2];
 p[a + 628 >> 2] = b;
 Za(a + 1384 | 0, a + 624 | 0);
 b = p[a + 1388 >> 2];
 c = p[a + 1384 >> 2];
 p[a + 616 >> 2] = c;
 p[a + 620 >> 2] = b;
 p[a + 1400 >> 2] = c;
 p[a + 1404 >> 2] = b;
 Hk(a + 616 | 0);
 p[a + 1364 >> 2] = 0;
 p[a + 1360 >> 2] = 721;
 b = p[a + 1364 >> 2];
 p[a + 608 >> 2] = p[a + 1360 >> 2];
 p[a + 612 >> 2] = b;
 Za(a + 1368 | 0, a + 608 | 0);
 b = p[a + 1372 >> 2];
 c = p[a + 1368 >> 2];
 p[a + 600 >> 2] = c;
 p[a + 604 >> 2] = b;
 p[a + 1400 >> 2] = c;
 p[a + 1404 >> 2] = b;
 Gk(a + 600 | 0);
 L(21737, 21736, 21738, 0, 14792, 722, 14795, 0, 14795, 0, 14152, 14797, 723);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 724;
 b = p[a + 1404 >> 2];
 p[a + 592 >> 2] = p[a + 1400 >> 2];
 p[a + 596 >> 2] = b;
 Ek(a + 592 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 725;
 b = p[a + 1404 >> 2];
 p[a + 584 >> 2] = p[a + 1400 >> 2];
 p[a + 588 >> 2] = b;
 Dk(a + 584 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 726;
 b = p[a + 1404 >> 2];
 p[a + 576 >> 2] = p[a + 1400 >> 2];
 p[a + 580 >> 2] = b;
 Bk(a + 576 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 727;
 b = p[a + 1404 >> 2];
 p[a + 568 >> 2] = p[a + 1400 >> 2];
 p[a + 572 >> 2] = b;
 zk(a + 568 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 728;
 b = p[a + 1404 >> 2];
 p[a + 560 >> 2] = p[a + 1400 >> 2];
 p[a + 564 >> 2] = b;
 wk(a + 560 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 729;
 b = p[a + 1404 >> 2];
 p[a + 552 >> 2] = p[a + 1400 >> 2];
 p[a + 556 >> 2] = b;
 uk(a + 552 | 0);
 p[a + 1348 >> 2] = 0;
 p[a + 1344 >> 2] = 730;
 b = p[a + 1348 >> 2];
 p[a + 544 >> 2] = p[a + 1344 >> 2];
 p[a + 548 >> 2] = b;
 Za(a + 1352 | 0, a + 544 | 0);
 b = p[a + 1352 >> 2];
 p[a + 1404 >> 2] = p[a + 1356 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 536 >> 2] = p[a + 1400 >> 2];
 p[a + 540 >> 2] = b;
 tk(a + 536 | 0);
 p[a + 1332 >> 2] = 0;
 p[a + 1328 >> 2] = 731;
 b = p[a + 1332 >> 2];
 p[a + 528 >> 2] = p[a + 1328 >> 2];
 p[a + 532 >> 2] = b;
 Za(a + 1336 | 0, a + 528 | 0);
 b = p[a + 1336 >> 2];
 p[a + 1404 >> 2] = p[a + 1340 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 520 >> 2] = p[a + 1400 >> 2];
 p[a + 524 >> 2] = b;
 sk(a + 520 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 732;
 b = p[a + 1404 >> 2];
 p[a + 512 >> 2] = p[a + 1400 >> 2];
 p[a + 516 >> 2] = b;
 Pf(14245, a + 512 | 0);
 p[a + 1316 >> 2] = 0;
 p[a + 1312 >> 2] = 733;
 b = p[a + 1316 >> 2];
 p[a + 504 >> 2] = p[a + 1312 >> 2];
 p[a + 508 >> 2] = b;
 Za(a + 1320 | 0, a + 504 | 0);
 b = p[a + 1320 >> 2];
 p[a + 1404 >> 2] = p[a + 1324 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 496 >> 2] = p[a + 1400 >> 2];
 p[a + 500 >> 2] = b;
 qk(a + 496 | 0);
 p[a + 1300 >> 2] = 0;
 p[a + 1296 >> 2] = 734;
 b = p[a + 1300 >> 2];
 p[a + 488 >> 2] = p[a + 1296 >> 2];
 p[a + 492 >> 2] = b;
 Za(a + 1304 | 0, a + 488 | 0);
 b = p[a + 1304 >> 2];
 p[a + 1404 >> 2] = p[a + 1308 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 480 >> 2] = p[a + 1400 >> 2];
 p[a + 484 >> 2] = b;
 pk(a + 480 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 735;
 b = p[a + 1404 >> 2];
 p[a + 472 >> 2] = p[a + 1400 >> 2];
 p[a + 476 >> 2] = b;
 Pf(14299, a + 472 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 736;
 b = p[a + 1404 >> 2];
 p[a + 464 >> 2] = p[a + 1400 >> 2];
 p[a + 468 >> 2] = b;
 I(21737, 14317, 21582, 14788, 737, Ya(a + 464 | 0) | 0, 0, 0, 0, 0);
 L(21748, 21741, 21749, 0, 14792, 738, 14795, 0, 14795, 0, 14324, 14797, 739);
 p[a + 1284 >> 2] = 0;
 p[a + 1280 >> 2] = 740;
 b = p[a + 1284 >> 2];
 p[a + 456 >> 2] = p[a + 1280 >> 2];
 p[a + 460 >> 2] = b;
 Za(a + 1288 | 0, a + 456 | 0);
 p[a + 1268 >> 2] = 0;
 p[a + 1264 >> 2] = 741;
 b = p[a + 1268 >> 2];
 p[a + 448 >> 2] = p[a + 1264 >> 2];
 p[a + 452 >> 2] = b;
 b = p[a + 1288 >> 2];
 c = p[a + 1292 >> 2];
 Za(a + 1272 | 0, a + 448 | 0);
 d = p[a + 1272 >> 2];
 e = p[a + 1276 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 440 >> 2] = p[a + 1400 >> 2];
 p[a + 444 >> 2] = b;
 b = Ya(a + 440 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 432 >> 2] = p[a + 1392 >> 2];
 p[a + 436 >> 2] = c;
 I(21748, 14343, 21622, 15920, 742, b | 0, 21622, 15532, 743, Ya(a + 432 | 0) | 0);
 p[a + 1252 >> 2] = 0;
 p[a + 1248 >> 2] = 744;
 b = p[a + 1252 >> 2];
 p[a + 424 >> 2] = p[a + 1248 >> 2];
 p[a + 428 >> 2] = b;
 Za(a + 1256 | 0, a + 424 | 0);
 p[a + 1236 >> 2] = 0;
 p[a + 1232 >> 2] = 745;
 b = p[a + 1236 >> 2];
 p[a + 416 >> 2] = p[a + 1232 >> 2];
 p[a + 420 >> 2] = b;
 b = p[a + 1256 >> 2];
 c = p[a + 1260 >> 2];
 Za(a + 1240 | 0, a + 416 | 0);
 d = p[a + 1240 >> 2];
 e = p[a + 1244 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 408 >> 2] = p[a + 1400 >> 2];
 p[a + 412 >> 2] = b;
 b = Ya(a + 408 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 400 >> 2] = p[a + 1392 >> 2];
 p[a + 404 >> 2] = c;
 I(21748, 14350, 21622, 15920, 742, b | 0, 21622, 15532, 743, Ya(a + 400 | 0) | 0);
 p[a + 1220 >> 2] = 0;
 p[a + 1216 >> 2] = 746;
 b = p[a + 1220 >> 2];
 p[a + 392 >> 2] = p[a + 1216 >> 2];
 p[a + 396 >> 2] = b;
 Za(a + 1224 | 0, a + 392 | 0);
 p[a + 1204 >> 2] = 0;
 p[a + 1200 >> 2] = 747;
 b = p[a + 1204 >> 2];
 p[a + 384 >> 2] = p[a + 1200 >> 2];
 p[a + 388 >> 2] = b;
 b = p[a + 1224 >> 2];
 c = p[a + 1228 >> 2];
 Za(a + 1208 | 0, a + 384 | 0);
 d = p[a + 1208 >> 2];
 e = p[a + 1212 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 376 >> 2] = p[a + 1400 >> 2];
 p[a + 380 >> 2] = b;
 b = Ya(a + 376 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 368 >> 2] = p[a + 1392 >> 2];
 p[a + 372 >> 2] = c;
 I(21748, 14357, 21622, 15920, 742, b | 0, 21622, 15532, 743, Ya(a + 368 | 0) | 0);
 L(21750, 21742, 21751, 21748, 14792, 748, 14792, 841, 14792, 842, 14366, 14797, 749);
 p[a + 1184 >> 2] = 72;
 p[a + 1188 >> 2] = 1;
 p[a + 360 >> 2] = 72;
 p[a + 364 >> 2] = 1;
 Za(a + 1192 | 0, a + 360 | 0);
 p[a + 1172 >> 2] = 0;
 p[a + 1168 >> 2] = 750;
 b = p[a + 1172 >> 2];
 p[a + 352 >> 2] = p[a + 1168 >> 2];
 p[a + 356 >> 2] = b;
 b = p[a + 1192 >> 2];
 c = p[a + 1196 >> 2];
 Za(a + 1176 | 0, a + 352 | 0);
 d = p[a + 1176 >> 2];
 e = p[a + 1180 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 344 >> 2] = p[a + 1400 >> 2];
 p[a + 348 >> 2] = b;
 b = Ya(a + 344 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 336 >> 2] = p[a + 1392 >> 2];
 p[a + 340 >> 2] = c;
 I(21750, 14371, 21622, 15920, 751, b | 0, 21622, 15532, 752, Ya(a + 336 | 0) | 0);
 p[a + 1152 >> 2] = 76;
 p[a + 1156 >> 2] = 1;
 p[a + 328 >> 2] = 76;
 p[a + 332 >> 2] = 1;
 Za(a + 1160 | 0, a + 328 | 0);
 p[a + 1140 >> 2] = 0;
 p[a + 1136 >> 2] = 753;
 b = p[a + 1140 >> 2];
 p[a + 320 >> 2] = p[a + 1136 >> 2];
 p[a + 324 >> 2] = b;
 b = p[a + 1160 >> 2];
 c = p[a + 1164 >> 2];
 Za(a + 1144 | 0, a + 320 | 0);
 d = p[a + 1144 >> 2];
 e = p[a + 1148 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 312 >> 2] = p[a + 1400 >> 2];
 p[a + 316 >> 2] = b;
 b = Ya(a + 312 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 304 >> 2] = p[a + 1392 >> 2];
 p[a + 308 >> 2] = c;
 I(21750, 14373, 21622, 15920, 751, b | 0, 21622, 15532, 752, Ya(a + 304 | 0) | 0);
 L(21752, 21743, 21753, 21748, 14792, 754, 14792, 843, 14792, 844, 14375, 14797, 755);
 p[a + 1124 >> 2] = 0;
 p[a + 1120 >> 2] = 756;
 b = p[a + 1124 >> 2];
 p[a + 296 >> 2] = p[a + 1120 >> 2];
 p[a + 300 >> 2] = b;
 Za(a + 1128 | 0, a + 296 | 0);
 p[a + 1108 >> 2] = 0;
 p[a + 1104 >> 2] = 757;
 b = p[a + 1108 >> 2];
 p[a + 288 >> 2] = p[a + 1104 >> 2];
 p[a + 292 >> 2] = b;
 b = p[a + 1128 >> 2];
 c = p[a + 1132 >> 2];
 Za(a + 1112 | 0, a + 288 | 0);
 d = p[a + 1112 >> 2];
 e = p[a + 1116 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 280 >> 2] = p[a + 1400 >> 2];
 p[a + 284 >> 2] = b;
 b = Ya(a + 280 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 272 >> 2] = p[a + 1392 >> 2];
 p[a + 276 >> 2] = c;
 I(21752, 14380, 21622, 15920, 758, b | 0, 21622, 15532, 759, Ya(a + 272 | 0) | 0);
 L(21754, 21744, 21755, 21752, 14792, 760, 14792, 845, 14792, 846, 14387, 14797, 761);
 p[a + 1088 >> 2] = 72;
 p[a + 1092 >> 2] = 1;
 p[a + 264 >> 2] = 72;
 p[a + 268 >> 2] = 1;
 Za(a + 1096 | 0, a + 264 | 0);
 p[a + 1076 >> 2] = 0;
 p[a + 1072 >> 2] = 762;
 b = p[a + 1076 >> 2];
 p[a + 256 >> 2] = p[a + 1072 >> 2];
 p[a + 260 >> 2] = b;
 b = p[a + 1096 >> 2];
 c = p[a + 1100 >> 2];
 Za(a + 1080 | 0, a + 256 | 0);
 d = p[a + 1080 >> 2];
 e = p[a + 1084 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 248 >> 2] = p[a + 1400 >> 2];
 p[a + 252 >> 2] = b;
 b = Ya(a + 248 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 240 >> 2] = p[a + 1392 >> 2];
 p[a + 244 >> 2] = c;
 I(21754, 14371, 21622, 15920, 763, b | 0, 21622, 15532, 764, Ya(a + 240 | 0) | 0);
 p[a + 1056 >> 2] = 76;
 p[a + 1060 >> 2] = 1;
 p[a + 232 >> 2] = 76;
 p[a + 236 >> 2] = 1;
 Za(a + 1064 | 0, a + 232 | 0);
 p[a + 1044 >> 2] = 0;
 p[a + 1040 >> 2] = 765;
 b = p[a + 1044 >> 2];
 p[a + 224 >> 2] = p[a + 1040 >> 2];
 p[a + 228 >> 2] = b;
 b = p[a + 1064 >> 2];
 c = p[a + 1068 >> 2];
 Za(a + 1048 | 0, a + 224 | 0);
 d = p[a + 1048 >> 2];
 e = p[a + 1052 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 216 >> 2] = p[a + 1400 >> 2];
 p[a + 220 >> 2] = b;
 b = Ya(a + 216 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 208 >> 2] = p[a + 1392 >> 2];
 p[a + 212 >> 2] = c;
 I(21754, 14373, 21622, 15920, 763, b | 0, 21622, 15532, 764, Ya(a + 208 | 0) | 0);
 L(21756, 21745, 21757, 0, 14792, 766, 14795, 0, 14795, 0, 14396, 14797, 767);
 p[a + 1028 >> 2] = 0;
 p[a + 1024 >> 2] = 768;
 b = p[a + 1028 >> 2];
 p[a + 200 >> 2] = p[a + 1024 >> 2];
 p[a + 204 >> 2] = b;
 Za(a + 1032 | 0, a + 200 | 0);
 b = p[a + 1032 >> 2];
 p[a + 1404 >> 2] = p[a + 1036 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 192 >> 2] = p[a + 1400 >> 2];
 p[a + 196 >> 2] = b;
 I(21756, 14412, 21616, 14788, 769, Ya(a + 192 | 0) | 0, 0, 0, 0, 0);
 p[a + 1012 >> 2] = 0;
 p[a + 1008 >> 2] = 770;
 b = p[a + 1012 >> 2];
 p[a + 184 >> 2] = p[a + 1008 >> 2];
 p[a + 188 >> 2] = b;
 Za(a + 1016 | 0, a + 184 | 0);
 b = p[a + 1016 >> 2];
 p[a + 1404 >> 2] = p[a + 1020 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 176 >> 2] = p[a + 1400 >> 2];
 p[a + 180 >> 2] = b;
 I(21756, 14417, 21758, 14788, 771, Ya(a + 176 | 0) | 0, 0, 0, 0, 0);
 p[a + 996 >> 2] = 0;
 p[a + 992 >> 2] = 772;
 b = p[a + 996 >> 2];
 p[a + 168 >> 2] = p[a + 992 >> 2];
 p[a + 172 >> 2] = b;
 Za(a + 1e3 | 0, a + 168 | 0);
 b = p[a + 1e3 >> 2];
 p[a + 1404 >> 2] = p[a + 1004 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 160 >> 2] = p[a + 1400 >> 2];
 p[a + 164 >> 2] = b;
 I(21756, 14426, 21758, 14788, 771, Ya(a + 160 | 0) | 0, 0, 0, 0, 0);
 p[a + 980 >> 2] = 0;
 p[a + 976 >> 2] = 773;
 b = p[a + 980 >> 2];
 p[a + 152 >> 2] = p[a + 976 >> 2];
 p[a + 156 >> 2] = b;
 Za(a + 984 | 0, a + 152 | 0);
 b = p[a + 984 >> 2];
 p[a + 1404 >> 2] = p[a + 988 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 144 >> 2] = p[a + 1400 >> 2];
 p[a + 148 >> 2] = b;
 I(21756, 14430, 21758, 14788, 771, Ya(a + 144 | 0) | 0, 0, 0, 0, 0);
 p[a + 964 >> 2] = 0;
 p[a + 960 >> 2] = 774;
 b = p[a + 964 >> 2];
 p[a + 136 >> 2] = p[a + 960 >> 2];
 p[a + 140 >> 2] = b;
 Za(a + 968 | 0, a + 136 | 0);
 b = p[a + 968 >> 2];
 p[a + 1404 >> 2] = p[a + 972 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 128 >> 2] = p[a + 1400 >> 2];
 p[a + 132 >> 2] = b;
 I(21756, 14440, 21758, 14788, 771, Ya(a + 128 | 0) | 0, 0, 0, 0, 0);
 p[a + 948 >> 2] = 0;
 p[a + 944 >> 2] = 775;
 b = p[a + 948 >> 2];
 p[a + 120 >> 2] = p[a + 944 >> 2];
 p[a + 124 >> 2] = b;
 Za(a + 952 | 0, a + 120 | 0);
 b = p[a + 952 >> 2];
 p[a + 1404 >> 2] = p[a + 956 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 112 >> 2] = p[a + 1400 >> 2];
 p[a + 116 >> 2] = b;
 I(21756, 14448, 21758, 14788, 771, Ya(a + 112 | 0) | 0, 0, 0, 0, 0);
 p[a + 932 >> 2] = 0;
 p[a + 928 >> 2] = 776;
 b = p[a + 932 >> 2];
 p[a + 104 >> 2] = p[a + 928 >> 2];
 p[a + 108 >> 2] = b;
 Za(a + 936 | 0, a + 104 | 0);
 b = p[a + 936 >> 2];
 p[a + 1404 >> 2] = p[a + 940 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 96 >> 2] = p[a + 1400 >> 2];
 p[a + 100 >> 2] = b;
 I(21756, 14458, 21622, 15920, 777, Ya(a + 96 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 778;
 b = p[a + 1404 >> 2];
 p[a + 88 >> 2] = p[a + 1400 >> 2];
 p[a + 92 >> 2] = b;
 ek(a + 88 | 0);
 L(21759, 21760, 21761, 0, 14792, 779, 14795, 0, 14795, 0, 14470, 14797, 780);
 bk();
 p[a + 916 >> 2] = 0;
 p[a + 912 >> 2] = 782;
 b = p[a + 916 >> 2];
 p[a + 80 >> 2] = p[a + 912 >> 2];
 p[a + 84 >> 2] = b;
 Za(a + 920 | 0, a + 80 | 0);
 p[a + 900 >> 2] = 0;
 p[a + 896 >> 2] = 783;
 b = p[a + 900 >> 2];
 p[a + 72 >> 2] = p[a + 896 >> 2];
 p[a + 76 >> 2] = b;
 b = p[a + 920 >> 2];
 c = p[a + 924 >> 2];
 Za(a + 904 | 0, a + 72 | 0);
 d = p[a + 904 >> 2];
 e = p[a + 908 >> 2];
 p[a + 1404 >> 2] = c;
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 64 >> 2] = p[a + 1400 >> 2];
 p[a + 68 >> 2] = b;
 b = Ya(a - -64 | 0);
 p[a + 1396 >> 2] = e;
 p[a + 1392 >> 2] = d;
 c = p[a + 1396 >> 2];
 p[a + 56 >> 2] = p[a + 1392 >> 2];
 p[a + 60 >> 2] = c;
 I(21759, 14494, 21622, 15920, 784, b | 0, 21622, 15532, 785, Ya(a + 56 | 0) | 0);
 p[a + 884 >> 2] = 0;
 p[a + 880 >> 2] = 786;
 b = p[a + 884 >> 2];
 p[a + 48 >> 2] = p[a + 880 >> 2];
 p[a + 52 >> 2] = b;
 Za(a + 888 | 0, a + 48 | 0);
 b = p[a + 888 >> 2];
 p[a + 1404 >> 2] = p[a + 892 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 40 >> 2] = p[a + 1400 >> 2];
 p[a + 44 >> 2] = b;
 I(21759, 14499, 21739, 14788, 787, Ya(a + 40 | 0) | 0, 0, 0, 0, 0);
 p[a + 868 >> 2] = 0;
 p[a + 864 >> 2] = 788;
 b = p[a + 868 >> 2];
 p[a + 32 >> 2] = p[a + 864 >> 2];
 p[a + 36 >> 2] = b;
 Za(a + 872 | 0, a + 32 | 0);
 b = p[a + 872 >> 2];
 p[a + 1404 >> 2] = p[a + 876 >> 2];
 p[a + 1400 >> 2] = b;
 b = p[a + 1404 >> 2];
 p[a + 24 >> 2] = p[a + 1400 >> 2];
 p[a + 28 >> 2] = b;
 _j(a + 24 | 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 789;
 b = p[a + 1404 >> 2];
 p[a + 16 >> 2] = p[a + 1400 >> 2];
 p[a + 20 >> 2] = b;
 Yj(a + 16 | 0);
 R(21580, 14507, 1, 0);
 ic(ic(ic(ic(ic(ic(ic(a + 1400 | 0, 13738, 0), 14511, 1), 14519, 2), 14525, 3), 14534, 4), 14544, 5), 14549, 6);
 L(21581, 21762, 21763, 0, 14792, 790, 14795, 0, 14795, 0, 14559, 14797, 791);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 792;
 b = p[a + 1404 >> 2];
 p[a + 8 >> 2] = p[a + 1400 >> 2];
 p[a + 12 >> 2] = b;
 I(21581, 14371, 21622, 15920, 793, Ya(a + 8 | 0) | 0, 0, 0, 0, 0);
 p[a + 1404 >> 2] = 0;
 p[a + 1400 >> 2] = 794;
 b = p[a + 1404 >> 2];
 p[a >> 2] = p[a + 1400 >> 2];
 p[a + 4 >> 2] = b;
 I(21581, 14373, 21622, 15920, 793, Ya(a) | 0, 0, 0, 0, 0);
 N(21581, 14569, 21581, 12392, 14792, 795, 0, 0);
 N(21581, 14577, 21581, 12400, 14792, 795, 0, 0);
 N(21581, 14587, 21581, 12408, 14792, 795, 0, 0);
 N(21581, 14596, 21581, 12416, 14792, 795, 0, 0);
 N(21581, 14607, 21581, 12424, 14792, 795, 0, 0);
 N(21581, 14614, 21581, 12432, 14792, 795, 0, 0);
 N(21581, 14626, 21581, 12440, 14792, 795, 0, 0);
 N(21581, 14637, 21581, 12448, 14792, 795, 0, 0);
 N(21581, 14650, 21581, 12456, 14792, 795, 0, 0);
 pa(21582, 14662, 16160, 851, 14797, 852);
 md(md(md(md(a + 1400 | 0, 14667, 0), 14672, 4), 14677, 8), 14682, 12);
 na(21582);
 sa = a + 1408 | 0;
}
function Hf(a, b, c, d, e, f, g) {
 var h = 0, i = 0, j = 0, k = 0, l = 0, r = 0, s = 0, t = 0, w = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0;
 h = sa - 80 | 0;
 sa = h;
 p[h + 76 >> 2] = b;
 C = h + 55 | 0;
 z = h + 56 | 0;
 b = 0;
 a : {
  b : while (1) {
   c : {
    if ((x | 0) < 0) {
     break c;
    }
    if ((b | 0) > (2147483647 - x | 0)) {
     p[5449] = 61;
     x = -1;
     break c;
    }
    x = b + x | 0;
   }
   d : {
    e : {
     f : {
      k = p[h + 76 >> 2];
      b = k;
      i = q[b | 0];
      if (i) {
       while (1) {
        g : {
         i = i & 255;
         h : {
          if (!i) {
           i = b;
           break h;
          }
          if ((i | 0) != 37) {
           break g;
          }
          i = b;
          while (1) {
           if (q[b + 1 | 0] != 37) {
            break h;
           }
           j = b + 2 | 0;
           p[h + 76 >> 2] = j;
           i = i + 1 | 0;
           l = q[b + 2 | 0];
           b = j;
           if ((l | 0) == 37) {
            continue;
           }
           break;
          }
         }
         b = i - k | 0;
         if (a) {
          nb(a, k, b);
         }
         if (b) {
          continue b;
         }
         i = h;
         j = !id(n[p[h + 76 >> 2] + 1 | 0]);
         b = p[h + 76 >> 2];
         i : {
          if (!(j | q[b + 2 | 0] != 36)) {
           y = n[b + 1 | 0] + -48 | 0;
           A = 1;
           b = b + 3 | 0;
           break i;
          }
          y = -1;
          b = b + 1 | 0;
         }
         p[i + 76 >> 2] = b;
         r = 0;
         s = n[b | 0];
         j = s + -32 | 0;
         j : {
          if (j >>> 0 > 31) {
           i = b;
           break j;
          }
          i = b;
          j = 1 << j;
          if (!(j & 75913)) {
           break j;
          }
          while (1) {
           i = b + 1 | 0;
           p[h + 76 >> 2] = i;
           r = j | r;
           s = n[b + 1 | 0];
           j = s + -32 | 0;
           if (j >>> 0 >= 32) {
            break j;
           }
           b = i;
           j = 1 << j;
           if (j & 75913) {
            continue;
           }
           break;
          }
         }
         k : {
          if ((s | 0) == 42) {
           j = h;
           l : {
            m : {
             if (!id(n[i + 1 | 0])) {
              break m;
             }
             b = p[h + 76 >> 2];
             if (q[b + 2 | 0] != 36) {
              break m;
             }
             p[((n[b + 1 | 0] << 2) + e | 0) + -192 >> 2] = 10;
             t = p[((n[b + 1 | 0] << 3) + d | 0) + -384 >> 2];
             A = 1;
             b = b + 3 | 0;
             break l;
            }
            if (A) {
             break f;
            }
            A = 0;
            t = 0;
            if (a) {
             b = p[c >> 2];
             p[c >> 2] = b + 4;
             t = p[b >> 2];
            }
            b = p[h + 76 >> 2] + 1 | 0;
           }
           p[j + 76 >> 2] = b;
           if ((t | 0) > -1) {
            break k;
           }
           t = 0 - t | 0;
           r = r | 8192;
           break k;
          }
          t = ij(h + 76 | 0);
          if ((t | 0) < 0) {
           break f;
          }
          b = p[h + 76 >> 2];
         }
         l = -1;
         n : {
          if (q[b | 0] != 46) {
           break n;
          }
          if (q[b + 1 | 0] == 42) {
           o : {
            if (!id(n[b + 2 | 0])) {
             break o;
            }
            b = p[h + 76 >> 2];
            if (q[b + 3 | 0] != 36) {
             break o;
            }
            p[((n[b + 2 | 0] << 2) + e | 0) + -192 >> 2] = 10;
            l = p[((n[b + 2 | 0] << 3) + d | 0) + -384 >> 2];
            b = b + 4 | 0;
            p[h + 76 >> 2] = b;
            break n;
           }
           if (A) {
            break f;
           }
           if (a) {
            b = p[c >> 2];
            p[c >> 2] = b + 4;
            b = p[b >> 2];
           } else {
            b = 0;
           }
           l = b;
           b = p[h + 76 >> 2] + 2 | 0;
           p[h + 76 >> 2] = b;
           break n;
          }
          p[h + 76 >> 2] = b + 1;
          l = ij(h + 76 | 0);
          b = p[h + 76 >> 2];
         }
         i = 0;
         while (1) {
          B = i;
          w = -1;
          if (n[b | 0] + -65 >>> 0 > 57) {
           break a;
          }
          s = b + 1 | 0;
          p[h + 76 >> 2] = s;
          i = n[b | 0];
          b = s;
          i = q[(i + v(B, 58) | 0) + 19775 | 0];
          if (i + -1 >>> 0 < 8) {
           continue;
          }
          break;
         }
         p : {
          q : {
           if ((i | 0) != 19) {
            if (!i) {
             break a;
            }
            if ((y | 0) >= 0) {
             p[(y << 2) + e >> 2] = i;
             b = (y << 3) + d | 0;
             i = p[b + 4 >> 2];
             p[h + 64 >> 2] = p[b >> 2];
             p[h + 68 >> 2] = i;
             break q;
            }
            if (!a) {
             break d;
            }
            hj(h - -64 | 0, i, c, g);
            s = p[h + 76 >> 2];
            break p;
           }
           if ((y | 0) > -1) {
            break a;
           }
          }
          b = 0;
          if (!a) {
           continue b;
          }
         }
         j = r & -65537;
         i = r & 8192 ? j : r;
         w = 0;
         y = 19812;
         r = z;
         r : {
          s : {
           t : {
            u : {
             v : {
              w : {
               x : {
                y : {
                 z : {
                  A : {
                   B : {
                    C : {
                     D : {
                      E : {
                       F : {
                        G : {
                         b = n[s + -1 | 0];
                         b = B ? (b & 15) == 3 ? b & -33 : b : b;
                         switch (b + -88 | 0) {
                         case 11:
                          break r;
                         case 9:
                         case 13:
                         case 14:
                         case 15:
                          break s;
                         case 27:
                          break x;
                         case 12:
                         case 17:
                          break A;
                         case 23:
                          break B;
                         case 0:
                         case 32:
                          break C;
                         case 24:
                          break D;
                         case 22:
                          break E;
                         case 29:
                          break F;
                         case 1:
                         case 2:
                         case 3:
                         case 4:
                         case 5:
                         case 6:
                         case 7:
                         case 8:
                         case 10:
                         case 16:
                         case 18:
                         case 19:
                         case 20:
                         case 21:
                         case 25:
                         case 26:
                         case 28:
                         case 30:
                         case 31:
                          break e;
                         default:
                          break G;
                         }
                        }
                        H : {
                         switch (b + -65 | 0) {
                         case 0:
                         case 4:
                         case 5:
                         case 6:
                          break s;
                         case 2:
                          break v;
                         case 1:
                         case 3:
                          break e;
                         default:
                          break H;
                         }
                        }
                        if ((b | 0) == 83) {
                         break w;
                        }
                        break e;
                       }
                       b = p[h + 64 >> 2];
                       k = p[h + 68 >> 2];
                       j = 19812;
                       break z;
                      }
                      b = 0;
                      I : {
                       switch (B & 255) {
                       case 0:
                        p[p[h + 64 >> 2] >> 2] = x;
                        continue b;
                       case 1:
                        p[p[h + 64 >> 2] >> 2] = x;
                        continue b;
                       case 2:
                        i = p[h + 64 >> 2];
                        p[i >> 2] = x;
                        p[i + 4 >> 2] = x >> 31;
                        continue b;
                       case 3:
                        o[p[h + 64 >> 2] >> 1] = x;
                        continue b;
                       case 4:
                        n[p[h + 64 >> 2]] = x;
                        continue b;
                       case 6:
                        p[p[h + 64 >> 2] >> 2] = x;
                        continue b;
                       case 7:
                        break I;
                       default:
                        continue b;
                       }
                      }
                      i = p[h + 64 >> 2];
                      p[i >> 2] = x;
                      p[i + 4 >> 2] = x >> 31;
                      continue b;
                     }
                     l = l >>> 0 > 8 ? l : 8;
                     i = i | 8;
                     b = 120;
                    }
                    k = Qu(p[h + 64 >> 2], p[h + 68 >> 2], z, b & 32);
                    if (!(i & 8) | !(p[h + 64 >> 2] | p[h + 68 >> 2])) {
                     break y;
                    }
                    y = (b >>> 4 | 0) + 19812 | 0;
                    w = 2;
                    break y;
                   }
                   k = Pu(p[h + 64 >> 2], p[h + 68 >> 2], z);
                   if (!(i & 8)) {
                    break y;
                   }
                   b = z - k | 0;
                   l = (l | 0) > (b | 0) ? l : b + 1 | 0;
                   break y;
                  }
                  j = p[h + 68 >> 2];
                  k = j;
                  b = p[h + 64 >> 2];
                  if ((j | 0) < -1 ? 1 : (j | 0) <= -1) {
                   k = 0 - (k + (0 < b >>> 0) | 0) | 0;
                   b = 0 - b | 0;
                   p[h + 64 >> 2] = b;
                   p[h + 68 >> 2] = k;
                   w = 1;
                   j = 19812;
                   break z;
                  }
                  if (i & 2048) {
                   w = 1;
                   j = 19813;
                   break z;
                  }
                  w = i & 1;
                  j = w ? 19814 : 19812;
                 }
                 y = j;
                 k = Oc(b, k, z);
                }
                i = (l | 0) > -1 ? i & -65537 : i;
                b = p[h + 68 >> 2];
                j = b;
                s = p[h + 64 >> 2];
                if (!(!!(b | s) | l)) {
                 l = 0;
                 k = z;
                 break e;
                }
                b = !(j | s) + (z - k | 0) | 0;
                l = (l | 0) > (b | 0) ? l : b;
                break e;
               }
               b = p[h + 64 >> 2];
               k = b ? b : 19822;
               b = Gu(k, l);
               r = b ? b : l + k | 0;
               i = j;
               l = b ? b - k | 0 : l;
               break e;
              }
              j = p[h + 64 >> 2];
              if (l) {
               break u;
              }
              b = 0;
              xb(a, 32, t, 0, i);
              break t;
             }
             p[h + 12 >> 2] = 0;
             p[h + 8 >> 2] = p[h + 64 >> 2];
             p[h + 64 >> 2] = h + 8;
             l = -1;
             j = h + 8 | 0;
            }
            b = 0;
            J : {
             while (1) {
              k = p[j >> 2];
              if (!k) {
               break J;
              }
              k = gj(h + 4 | 0, k);
              r = (k | 0) < 0;
              if (!(r | k >>> 0 > l - b >>> 0)) {
               j = j + 4 | 0;
               b = b + k | 0;
               if (l >>> 0 > b >>> 0) {
                continue;
               }
               break J;
              }
              break;
             }
             w = -1;
             if (r) {
              break a;
             }
            }
            xb(a, 32, t, b, i);
            if (!b) {
             b = 0;
             break t;
            }
            s = 0;
            j = p[h + 64 >> 2];
            while (1) {
             k = p[j >> 2];
             if (!k) {
              break t;
             }
             k = gj(h + 4 | 0, k);
             s = k + s | 0;
             if ((s | 0) > (b | 0)) {
              break t;
             }
             nb(a, h + 4 | 0, k);
             j = j + 4 | 0;
             if (s >>> 0 < b >>> 0) {
              continue;
             }
             break;
            }
           }
           xb(a, 32, t, b, i ^ 8192);
           b = (t | 0) > (b | 0) ? t : b;
           continue b;
          }
          b = m[f | 0](a, u[h + 64 >> 3], t, l, i, b) | 0;
          continue b;
         }
         n[h + 55 | 0] = p[h + 64 >> 2];
         l = 1;
         k = C;
         i = j;
         break e;
        }
        j = b + 1 | 0;
        p[h + 76 >> 2] = j;
        i = q[b + 1 | 0];
        b = j;
        continue;
       }
      }
      w = x;
      if (a) {
       break a;
      }
      if (!A) {
       break d;
      }
      b = 1;
      while (1) {
       a = p[(b << 2) + e >> 2];
       if (a) {
        hj((b << 3) + d | 0, a, c, g);
        w = 1;
        b = b + 1 | 0;
        if ((b | 0) != 10) {
         continue;
        }
        break a;
       }
       break;
      }
      w = 1;
      if (b >>> 0 >= 10) {
       break a;
      }
      while (1) {
       if (p[(b << 2) + e >> 2]) {
        break f;
       }
       b = b + 1 | 0;
       if ((b | 0) != 10) {
        continue;
       }
       break;
      }
      break a;
     }
     w = -1;
     break a;
    }
    r = r - k | 0;
    l = (l | 0) < (r | 0) ? r : l;
    j = l + w | 0;
    b = (t | 0) < (j | 0) ? j : t;
    xb(a, 32, b, j, i);
    nb(a, y, w);
    xb(a, 48, b, j, i ^ 65536);
    xb(a, 48, l, r, 0);
    nb(a, k, r);
    xb(a, 32, b, j, i ^ 8192);
    continue;
   }
   break;
  }
  w = 0;
 }
 sa = h + 80 | 0;
 return w;
}
function Ou(a, b, c, d, f, g) {
 a = a | 0;
 b = +b;
 c = c | 0;
 d = d | 0;
 f = f | 0;
 g = g | 0;
 var i = 0, j = 0, k = 0, l = 0, m = 0, o = 0, r = 0, s = 0, t = 0, u = 0, w = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0, E = 0, F = 0, G = 0, H = 0;
 l = sa - 560 | 0;
 sa = l;
 p[l + 44 >> 2] = 0;
 h(+b);
 i = e(1) | 0;
 e(0) | 0;
 a : {
  if ((i | 0) < -1 ? 1 : (i | 0) <= -1) {
   C = 1;
   E = 20320;
   b = -b;
   h(+b);
   i = e(1) | 0;
   e(0) | 0;
   break a;
  }
  if (f & 2048) {
   C = 1;
   E = 20323;
   break a;
  }
  C = f & 1;
  E = C ? 20326 : 20321;
  D = !C;
 }
 b : {
  if ((i & 2146435072) == 2146435072) {
   s = C + 3 | 0;
   xb(a, 32, c, s, f & -65537);
   nb(a, E, C);
   d = g & 32;
   nb(a, b != b ? d ? 20347 : 20351 : d ? 20339 : 20343, 3);
   break b;
  }
  z = l + 16 | 0;
  c : {
   d : {
    e : {
     b = kj(b, l + 44 | 0);
     b = b + b;
     if (b != 0) {
      i = p[l + 44 >> 2];
      p[l + 44 >> 2] = i + -1;
      F = g | 32;
      if ((F | 0) != 97) {
       break e;
      }
      break c;
     }
     F = g | 32;
     if ((F | 0) == 97) {
      break c;
     }
     r = p[l + 44 >> 2];
     o = (d | 0) < 0 ? 6 : d;
     break d;
    }
    r = i + -29 | 0;
    p[l + 44 >> 2] = r;
    b = b * 268435456;
    o = (d | 0) < 0 ? 6 : d;
   }
   w = (r | 0) < 0 ? l + 48 | 0 : l + 336 | 0;
   j = w;
   while (1) {
    d = j;
    if (b < 4294967296 & b >= 0) {
     i = ~~b >>> 0;
    } else {
     i = 0;
    }
    p[d >> 2] = i;
    j = j + 4 | 0;
    b = (b - +(i >>> 0)) * 1e9;
    if (b != 0) {
     continue;
    }
    break;
   }
   f : {
    if ((r | 0) < 1) {
     d = r;
     i = j;
     k = w;
     break f;
    }
    k = w;
    d = r;
    while (1) {
     y = (d | 0) < 29 ? d : 29;
     i = j + -4 | 0;
     g : {
      if (i >>> 0 < k >>> 0) {
       break g;
      }
      d = y;
      u = 0;
      while (1) {
       t = i;
       s = 0;
       G = u;
       u = p[i >> 2];
       m = d & 31;
       if (32 <= (d & 63) >>> 0) {
        H = u << m;
        m = 0;
       } else {
        H = (1 << m) - 1 & u >>> 32 - m;
        m = u << m;
       }
       u = G + m | 0;
       s = s + H | 0;
       s = u >>> 0 < m >>> 0 ? s + 1 | 0 : s;
       m = u;
       u = Yw(m, s, 1e9);
       G = t;
       t = Xw(u, ta, 1e9);
       p[G >> 2] = m - t;
       i = i + -4 | 0;
       if (i >>> 0 >= k >>> 0) {
        continue;
       }
       break;
      }
      d = u;
      if (!d) {
       break g;
      }
      k = k + -4 | 0;
      p[k >> 2] = d;
     }
     while (1) {
      i = j;
      if (i >>> 0 > k >>> 0) {
       j = i + -4 | 0;
       if (!p[j >> 2]) {
        continue;
       }
      }
      break;
     }
     d = p[l + 44 >> 2] - y | 0;
     p[l + 44 >> 2] = d;
     j = i;
     if ((d | 0) > 0) {
      continue;
     }
     break;
    }
   }
   if ((d | 0) <= -1) {
    A = ((o + 25 | 0) / 9 | 0) + 1 | 0;
    y = (F | 0) == 102;
    while (1) {
     u = (d | 0) < -9 ? 9 : 0 - d | 0;
     h : {
      if (k >>> 0 >= i >>> 0) {
       k = p[k >> 2] ? k : k + 4 | 0;
       break h;
      }
      t = 1e9 >>> u | 0;
      m = -1 << u ^ -1;
      d = 0;
      j = k;
      while (1) {
       G = d;
       d = p[j >> 2];
       p[j >> 2] = G + (d >>> u | 0);
       d = v(t, d & m);
       j = j + 4 | 0;
       if (j >>> 0 < i >>> 0) {
        continue;
       }
       break;
      }
      k = p[k >> 2] ? k : k + 4 | 0;
      if (!d) {
       break h;
      }
      p[i >> 2] = d;
      i = i + 4 | 0;
     }
     d = p[l + 44 >> 2] + u | 0;
     p[l + 44 >> 2] = d;
     j = y ? w : k;
     i = i - j >> 2 > (A | 0) ? j + (A << 2) | 0 : i;
     if ((d | 0) < 0) {
      continue;
     }
     break;
    }
   }
   j = 0;
   i : {
    if (k >>> 0 >= i >>> 0) {
     break i;
    }
    j = v(w - k >> 2, 9);
    d = 10;
    m = p[k >> 2];
    if (m >>> 0 < 10) {
     break i;
    }
    while (1) {
     j = j + 1 | 0;
     d = v(d, 10);
     if (m >>> 0 >= d >>> 0) {
      continue;
     }
     break;
    }
   }
   d = (o - ((F | 0) == 102 ? 0 : j) | 0) - ((F | 0) == 103 & (o | 0) != 0) | 0;
   if ((d | 0) < (v(i - w >> 2, 9) + -9 | 0)) {
    t = d + 9216 | 0;
    m = (t | 0) / 9 | 0;
    s = ((m << 2) + ((r | 0) < 0 ? l + 48 | 4 : l + 340 | 0) | 0) + -4096 | 0;
    d = 10;
    t = t - v(m, 9) | 0;
    if ((t | 0) <= 7) {
     while (1) {
      d = v(d, 10);
      t = t + 1 | 0;
      if ((t | 0) != 8) {
       continue;
      }
      break;
     }
    }
    t = p[s >> 2];
    m = (t >>> 0) / (d >>> 0) | 0;
    A = s + 4 | 0;
    y = t - v(d, m) | 0;
    j : {
     if (y ? 0 : (A | 0) == (i | 0)) {
      break j;
     }
     r = d >>> 1 | 0;
     B = y >>> 0 < r >>> 0 ? .5 : (i | 0) == (A | 0) ? (r | 0) == (y | 0) ? 1 : 1.5 : 1.5;
     b = m & 1 ? 9007199254740994 : 9007199254740992;
     if (!(q[E | 0] != 45 | D)) {
      B = -B;
      b = -b;
     }
     r = t - y | 0;
     p[s >> 2] = r;
     if (b + B == b) {
      break j;
     }
     d = d + r | 0;
     p[s >> 2] = d;
     if (d >>> 0 >= 1e9) {
      while (1) {
       p[s >> 2] = 0;
       s = s + -4 | 0;
       if (s >>> 0 < k >>> 0) {
        k = k + -4 | 0;
        p[k >> 2] = 0;
       }
       d = p[s >> 2] + 1 | 0;
       p[s >> 2] = d;
       if (d >>> 0 > 999999999) {
        continue;
       }
       break;
      }
     }
     j = v(w - k >> 2, 9);
     d = 10;
     r = p[k >> 2];
     if (r >>> 0 < 10) {
      break j;
     }
     while (1) {
      j = j + 1 | 0;
      d = v(d, 10);
      if (r >>> 0 >= d >>> 0) {
       continue;
      }
      break;
     }
    }
    d = s + 4 | 0;
    i = i >>> 0 > d >>> 0 ? d : i;
   }
   while (1) {
    m = i;
    r = i >>> 0 <= k >>> 0;
    if (!r) {
     i = m + -4 | 0;
     if (!p[i >> 2]) {
      continue;
     }
    }
    break;
   }
   k : {
    if ((F | 0) != 103) {
     D = f & 8;
     break k;
    }
    i = o ? o : 1;
    d = (i | 0) > (j | 0) & (j | 0) > -5;
    o = (d ? j ^ -1 : -1) + i | 0;
    g = (d ? -1 : -2) + g | 0;
    D = f & 8;
    if (D) {
     break k;
    }
    i = -9;
    l : {
     if (r) {
      break l;
     }
     r = p[m + -4 >> 2];
     if (!r) {
      break l;
     }
     t = 10;
     i = 0;
     if ((r >>> 0) % 10 | 0) {
      break l;
     }
     while (1) {
      d = i;
      i = i + 1 | 0;
      t = v(t, 10);
      if (!((r >>> 0) % (t >>> 0) | 0)) {
       continue;
      }
      break;
     }
     i = d ^ -1;
    }
    d = v(m - w >> 2, 9);
    if ((g & -33) == 70) {
     D = 0;
     d = (d + i | 0) + -9 | 0;
     d = (d | 0) > 0 ? d : 0;
     o = (o | 0) < (d | 0) ? o : d;
     break k;
    }
    D = 0;
    d = ((d + j | 0) + i | 0) + -9 | 0;
    d = (d | 0) > 0 ? d : 0;
    o = (o | 0) < (d | 0) ? o : d;
   }
   u = o | D;
   y = (u | 0) != 0;
   d = a;
   r = c;
   t = g & -33;
   i = (j | 0) > 0 ? j : 0;
   m : {
    if ((t | 0) == 70) {
     break m;
    }
    i = j >> 31;
    i = Oc(i + j ^ i, 0, z);
    if ((z - i | 0) <= 1) {
     while (1) {
      i = i + -1 | 0;
      n[i | 0] = 48;
      if ((z - i | 0) < 2) {
       continue;
      }
      break;
     }
    }
    A = i + -2 | 0;
    n[A | 0] = g;
    n[i + -1 | 0] = (j | 0) < 0 ? 45 : 43;
    i = z - A | 0;
   }
   s = (i + (y + (o + C | 0) | 0) | 0) + 1 | 0;
   xb(d, 32, r, s, f);
   nb(a, E, C);
   xb(a, 48, c, s, f ^ 65536);
   n : {
    o : {
     p : {
      if ((t | 0) == 70) {
       d = l + 16 | 8;
       j = l + 16 | 9;
       g = k >>> 0 > w >>> 0 ? w : k;
       k = g;
       while (1) {
        i = Oc(p[k >> 2], 0, j);
        q : {
         if ((g | 0) != (k | 0)) {
          if (i >>> 0 <= l + 16 >>> 0) {
           break q;
          }
          while (1) {
           i = i + -1 | 0;
           n[i | 0] = 48;
           if (i >>> 0 > l + 16 >>> 0) {
            continue;
           }
           break;
          }
          break q;
         }
         if ((i | 0) != (j | 0)) {
          break q;
         }
         n[l + 24 | 0] = 48;
         i = d;
        }
        nb(a, i, j - i | 0);
        k = k + 4 | 0;
        if (k >>> 0 <= w >>> 0) {
         continue;
        }
        break;
       }
       if (u) {
        nb(a, 20355, 1);
       }
       if ((o | 0) < 1 | k >>> 0 >= m >>> 0) {
        break p;
       }
       while (1) {
        i = Oc(p[k >> 2], 0, j);
        if (i >>> 0 > l + 16 >>> 0) {
         while (1) {
          i = i + -1 | 0;
          n[i | 0] = 48;
          if (i >>> 0 > l + 16 >>> 0) {
           continue;
          }
          break;
         }
        }
        nb(a, i, (o | 0) < 9 ? o : 9);
        i = o + -9 | 0;
        k = k + 4 | 0;
        if (k >>> 0 >= m >>> 0) {
         break o;
        }
        d = (o | 0) > 9;
        o = i;
        if (d) {
         continue;
        }
        break;
       }
       break o;
      }
      r : {
       if ((o | 0) < 0) {
        break r;
       }
       g = m >>> 0 > k >>> 0 ? m : k + 4 | 0;
       d = l + 16 | 8;
       r = l + 16 | 9;
       j = k;
       while (1) {
        i = Oc(p[j >> 2], 0, r);
        if ((r | 0) == (i | 0)) {
         n[l + 24 | 0] = 48;
         i = d;
        }
        s : {
         if ((k | 0) != (j | 0)) {
          if (i >>> 0 <= l + 16 >>> 0) {
           break s;
          }
          while (1) {
           i = i + -1 | 0;
           n[i | 0] = 48;
           if (i >>> 0 > l + 16 >>> 0) {
            continue;
           }
           break;
          }
          break s;
         }
         nb(a, i, 1);
         i = i + 1 | 0;
         if ((o | 0) < 1 ? !D : 0) {
          break s;
         }
         nb(a, 20355, 1);
        }
        m = i;
        i = r - i | 0;
        nb(a, m, (o | 0) > (i | 0) ? i : o);
        o = o - i | 0;
        j = j + 4 | 0;
        if (j >>> 0 >= g >>> 0) {
         break r;
        }
        if ((o | 0) > -1) {
         continue;
        }
        break;
       }
      }
      xb(a, 48, o + 18 | 0, 18, 0);
      nb(a, A, z - A | 0);
      break n;
     }
     i = o;
    }
    xb(a, 48, i + 9 | 0, 9, 0);
   }
   break b;
  }
  o = g & 32;
  w = o ? E + 9 | 0 : E;
  t : {
   if (d >>> 0 > 11) {
    break t;
   }
   i = 12 - d | 0;
   if (!i) {
    break t;
   }
   B = 8;
   while (1) {
    B = B * 16;
    i = i + -1 | 0;
    if (i) {
     continue;
    }
    break;
   }
   if (q[w | 0] == 45) {
    b = -(B + (-b - B));
    break t;
   }
   b = b + B - B;
  }
  i = p[l + 44 >> 2];
  j = i >> 31;
  i = Oc(j ^ i + j, 0, z);
  if ((z | 0) == (i | 0)) {
   n[l + 15 | 0] = 48;
   i = l + 15 | 0;
  }
  r = C | 2;
  j = p[l + 44 >> 2];
  m = i + -2 | 0;
  n[m | 0] = g + 15;
  n[i + -1 | 0] = (j | 0) < 0 ? 45 : 43;
  i = f & 8;
  k = l + 16 | 0;
  while (1) {
   g = k;
   u = o;
   if (x(b) < 2147483648) {
    j = ~~b;
   } else {
    j = -2147483648;
   }
   n[k | 0] = u | q[j + 20304 | 0];
   k = g + 1 | 0;
   b = (b - +(j | 0)) * 16;
   if (!((k - (l + 16 | 0) | 0) != 1 | (b == 0 ? !(i | (d | 0) > 0) : 0))) {
    n[g + 1 | 0] = 46;
    k = g + 2 | 0;
   }
   if (b != 0) {
    continue;
   }
   break;
  }
  g = !d | ((k - l | 0) + -18 | 0) >= (d | 0) ? ((z - (l + 16 | 0) | 0) - m | 0) + k | 0 : ((d + z | 0) - m | 0) + 2 | 0;
  s = g + r | 0;
  xb(a, 32, c, s, f);
  nb(a, w, r);
  xb(a, 48, c, s, f ^ 65536);
  d = k - (l + 16 | 0) | 0;
  nb(a, l + 16 | 0, d);
  i = d;
  d = z - m | 0;
  xb(a, 48, g - (i + d | 0) | 0, 0, 0);
  nb(a, m, d);
 }
 xb(a, 32, c, s, f ^ 8192);
 sa = l + 560 | 0;
 return ((s | 0) < (c | 0) ? c : s) | 0;
}
function Nc(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = a;
 a : {
  if (a >>> 0 <= 211) {
   a = p[fj(20512, 20704, e + 12 | 0) >> 2];
   break a;
  }
  if (a >>> 0 >= 4294967292) {
   Mb();
   E();
  }
  f = (a >>> 0) / 210 | 0;
  d = v(f, 210);
  p[e + 8 >> 2] = a - d;
  g = fj(20704, 20896, e + 8 | 0) - 20704 >> 2;
  b : {
   while (1) {
    a = p[(g << 2) + 20704 >> 2] + d | 0;
    d = 5;
    b = h;
    c : {
     d : {
      while (1) {
       h = b;
       if ((d | 0) == 47) {
        d = 211;
        while (1) {
         b = (a >>> 0) / (d >>> 0) | 0;
         if (b >>> 0 < d >>> 0) {
          break c;
         }
         if ((v(b, d) | 0) == (a | 0)) {
          break d;
         }
         b = d + 10 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 12 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 16 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 18 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 22 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 28 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 30 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 36 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 40 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 42 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 46 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 52 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 58 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 60 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 66 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 70 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 72 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 78 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 82 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 88 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 96 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 100 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 102 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 106 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 108 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 112 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 120 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 126 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 130 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 136 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 138 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 142 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 148 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 150 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 156 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 162 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 166 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 168 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 172 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 178 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 180 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 186 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 190 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 192 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 196 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 198 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         if ((v(b, c) | 0) == (a | 0)) {
          break d;
         }
         b = d + 208 | 0;
         c = (a >>> 0) / (b >>> 0) | 0;
         if (c >>> 0 < b >>> 0) {
          break c;
         }
         d = d + 210 | 0;
         if ((v(b, c) | 0) != (a | 0)) {
          continue;
         }
         break;
        }
        break d;
       }
       b = p[(d << 2) + 20512 >> 2];
       c = (a >>> 0) / (b >>> 0) | 0;
       i = v(b, c);
       c = c >>> 0 < b >>> 0;
       if (!c) {
        b = c ? a : h;
        d = d + 1 | 0;
        if ((a | 0) != (i | 0)) {
         continue;
        }
       }
       break;
      }
      if (c | (a | 0) != (i | 0)) {
       break b;
      }
     }
     b = g + 1 | 0;
     a = (b | 0) == 48;
     g = a ? 0 : b;
     f = a + f | 0;
     d = v(f, 210);
     continue;
    }
    break;
   }
   p[e + 12 >> 2] = a;
   break a;
  }
  p[e + 12 >> 2] = a;
  a = c ? a : h;
 }
 sa = e + 16 | 0;
 return a;
}
function Si(a, b, c) {
 a : {
  b : {
   c : {
    d : {
     e : {
      f : {
       g : {
        h : {
         i : {
          j : {
           k : {
            l : {
             m : {
              n : {
               o : {
                p : {
                 q : {
                  r : {
                   s : {
                    t : {
                     u : {
                      v : {
                       w : {
                        x : {
                         switch (b + -92 | 0) {
                         default:
                          y : {
                           switch (b + -40 | 0) {
                           default:
                            z : {
                             switch (b + -149 | 0) {
                             case 3:
                             case 7:
                              break a;
                             case 0:
                             case 2:
                             case 6:
                              break b;
                             case 9:
                              break w;
                             case 1:
                             case 4:
                             case 5:
                             case 8:
                              break e;
                             default:
                              break z;
                             }
                            }
                            if ((b | 0) == 23) {
                             break l;
                            }
                            if ((b | 0) != 5) {
                             break e;
                            }
                            Ri(a, c);
                            return;
                           case 28:
                            break a;
                           case 0:
                            break n;
                           case 9:
                            break p;
                           case 8:
                            break q;
                           case 21:
                            break r;
                           case 20:
                            break s;
                           case 11:
                           case 13:
                           case 27:
                            break b;
                           case 19:
                            break t;
                           case 17:
                            break u;
                           case 16:
                            break v;
                           case 29:
                            break y;
                           case 1:
                           case 2:
                           case 3:
                           case 4:
                           case 5:
                           case 6:
                           case 7:
                           case 10:
                           case 12:
                           case 14:
                           case 15:
                           case 18:
                           case 22:
                           case 23:
                           case 24:
                           case 25:
                           case 26:
                            break e;
                           }
                          }
                          Qi(a, c);
                          return;
                         case 33:
                          break j;
                         case 37:
                          break k;
                         case 36:
                          break m;
                         case 25:
                          break o;
                         case 30:
                          break x;
                         case 1:
                         case 11:
                         case 28:
                          break c;
                         case 0:
                         case 3:
                         case 10:
                         case 27:
                         case 29:
                          break d;
                         case 2:
                         case 4:
                         case 5:
                         case 6:
                         case 7:
                         case 8:
                         case 9:
                         case 12:
                         case 13:
                         case 14:
                         case 15:
                         case 16:
                         case 17:
                         case 22:
                         case 23:
                         case 24:
                         case 26:
                         case 31:
                         case 32:
                         case 34:
                         case 35:
                          break e;
                         case 21:
                          break f;
                         case 20:
                          break g;
                         case 19:
                          break h;
                         case 18:
                          break i;
                         }
                        }
                        vj(a, c);
                        return;
                       }
                       Qi(a, c);
                       return;
                      }
                      Ri(a, c);
                      return;
                     }
                     if (p[a + 20 >> 2] != (c | 0)) {
                      p[a + 20 >> 2] = c;
                      m[p[p[a >> 2] + 40 >> 2]](a);
                     }
                     return;
                    }
                    if (p[a + 28 >> 2] != (c | 0)) {
                     p[a + 28 >> 2] = c;
                     m[p[p[a >> 2] + 48 >> 2]](a);
                    }
                    return;
                   }
                   if (p[a + 32 >> 2] != (c | 0)) {
                    p[a + 32 >> 2] = c;
                    m[p[p[a >> 2] + 52 >> 2]](a);
                   }
                   return;
                  }
                  if (p[a + 36 >> 2] != (c | 0)) {
                   p[a + 36 >> 2] = c;
                   m[p[p[a >> 2] + 56 >> 2]](a);
                  }
                  return;
                 }
                 if (p[a + 60 >> 2] != (c | 0)) {
                  p[a + 60 >> 2] = c;
                  m[p[p[a >> 2] + 72 >> 2]](a);
                 }
                 return;
                }
                if (p[a + 64 >> 2] != (c | 0)) {
                 p[a + 64 >> 2] = c;
                 m[p[p[a >> 2] + 76 >> 2]](a);
                }
                return;
               }
               if (p[a + 60 >> 2] != (c | 0)) {
                p[a + 60 >> 2] = c;
                m[p[p[a >> 2] + 64 >> 2]](a);
               }
               return;
              }
              if (p[a + 56 >> 2] != (c | 0)) {
               p[a + 56 >> 2] = c;
               m[p[p[a >> 2] + 68 >> 2]](a);
              }
              return;
             }
             Pi(a, c);
             return;
            }
            Pi(a, c);
            return;
           }
           if (p[a + 132 >> 2] != (c | 0)) {
            p[a + 132 >> 2] = c;
            m[p[p[a >> 2] + 92 >> 2]](a);
           }
           return;
          }
          if (p[a + 168 >> 2] != (c | 0)) {
           p[a + 168 >> 2] = c;
           m[p[p[a >> 2] + 120 >> 2]](a);
          }
          return;
         }
         if (p[a + 64 >> 2] != (c | 0)) {
          p[a + 64 >> 2] = c;
          m[p[p[a >> 2] + 60 >> 2]](a);
         }
         return;
        }
        if (p[a + 68 >> 2] != (c | 0)) {
         p[a + 68 >> 2] = c;
         m[p[p[a >> 2] + 64 >> 2]](a);
        }
        return;
       }
       if (p[a + 72 >> 2] != (c | 0)) {
        p[a + 72 >> 2] = c;
        m[p[p[a >> 2] + 68 >> 2]](a);
       }
       return;
      }
      if (p[a + 76 >> 2] != (c | 0)) {
       p[a + 76 >> 2] = c;
       m[p[p[a >> 2] + 72 >> 2]](a);
      }
     }
     return;
    }
    If(a, c);
    return;
   }
   if (p[a + 52 >> 2] != (c | 0)) {
    p[a + 52 >> 2] = c;
    m[p[p[a >> 2] + 56 >> 2]](a);
   }
   return;
  }
  if (p[a + 4 >> 2] != (c | 0)) {
   p[a + 4 >> 2] = c;
   m[p[p[a >> 2] + 32 >> 2]](a);
  }
  return;
 }
 if (p[a + 8 >> 2] != (c | 0)) {
  p[a + 8 >> 2] = c;
  m[p[p[a >> 2] + 36 >> 2]](a);
 }
}
function Zn(a) {
 var b = 0;
 a : {
  b : {
   switch (a + -1 | 0) {
   case 47:
    a = eb(La(68), 0, 68);
    _g(a);
    break a;
   case 60:
    a = La(8);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    yd(a);
    p[a + 4 >> 2] = -1;
    p[a >> 2] = 7936;
    p[a >> 2] = 7892;
    break a;
   case 24:
    a = La(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Nb(a);
    p[a + 4 >> 2] = 0;
    p[a >> 2] = 8100;
    p[a >> 2] = 1088;
    bb(a + 8 | 0);
    break a;
   case 67:
    a = La(8);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    vg(a);
    p[a >> 2] = 8188;
    p[a >> 2] = 8144;
    break a;
   case 25:
    a = La(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Nb(a);
    p[a + 4 >> 2] = 0;
    p[a >> 2] = 8276;
    p[a >> 2] = 1200;
    bb(a + 8 | 0);
    break a;
   case 55:
    a = La(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Ae(a);
    p[a + 16 >> 2] = 0;
    p[a >> 2] = 8368;
    p[a >> 2] = 8320;
    break a;
   case 49:
    a = La(28);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 24 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 20 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ze(a);
    p[a + 24 >> 2] = -1;
    p[a >> 2] = 8504;
    p[a >> 2] = 1500;
    break a;
   case 61:
    a = La(4);
    p[a >> 2] = 0;
    yd(a);
    p[a >> 2] = 8660;
    p[a >> 2] = 8620;
    break a;
   case 56:
    a = La(16);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ug(a);
    p[a >> 2] = 8700;
    p[a >> 2] = 1876;
    break a;
   case 26:
    a = La(16);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Be(a);
    break a;
   case 27:
    a = eb(La(64), 0, 64);
    Nb(a);
    p[a + 12 >> 2] = 1058306785;
    p[a + 16 >> 2] = 1065353216;
    p[a + 4 >> 2] = 1054280253;
    p[a + 8 >> 2] = 0;
    p[a >> 2] = 8788;
    p[a >> 2] = 1032;
    break a;
   case 69:
    a = La(16);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    tg(a);
    p[a + 12 >> 2] = 0;
    p[a >> 2] = 8896;
    p[a >> 2] = 8844;
    break a;
   case 64:
    a = La(16);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    wg(a);
    p[a + 12 >> 2] = 0;
    p[a + 4 >> 2] = -1;
    p[a + 8 >> 2] = 0;
    p[a >> 2] = 9044;
    p[a >> 2] = 1920;
    break a;
   case 29:
    a = La(28);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 24 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 20 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ze(a);
    p[a + 24 >> 2] = 0;
    p[a >> 2] = 9096;
    p[a >> 2] = 1436;
    break a;
   case 36:
    a = La(28);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 24 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 20 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ze(a);
    p[a + 24 >> 2] = 0;
    p[a >> 2] = 9160;
    p[a >> 2] = 1372;
    break a;
   case 52:
    a = La(16);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Be(a);
    p[a >> 2] = 9268;
    p[a >> 2] = 9224;
    break a;
   case 62:
    a = La(4);
    p[a >> 2] = 0;
    yd(a);
    p[a >> 2] = 9352;
    p[a >> 2] = 9312;
    break a;
   case 30:
    a = eb(La(56), 0, 56);
    On(a);
    p[a >> 2] = 1604;
    bb(a + 44 | 0);
    break a;
   case 57:
    a = La(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Ae(a);
    p[a >> 2] = 9508;
    n[a + 16 | 0] = 0;
    p[a >> 2] = 9464;
    break a;
   case 63:
    a = La(4);
    p[a >> 2] = 0;
    yd(a);
    p[a >> 2] = 9592;
    p[a >> 2] = 9552;
    break a;
   case 70:
    a = La(12);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    tg(a);
    p[a >> 2] = 9680;
    p[a >> 2] = 9632;
    break a;
   case 58:
    a = La(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    Ae(a);
    n[a + 16 | 0] = 0;
    p[a >> 2] = 9776;
    p[a >> 2] = 9728;
    break a;
   case 21:
    a = eb(La(100), 0, 100);
    Bg(a);
    break a;
   case 16:
    a = eb(La(100), 0, 100);
    Bg(a);
    p[a + 68 >> 2] = 10004;
    p[a >> 2] = 9916;
    p[a + 68 >> 2] = 13060;
    p[a >> 2] = 12972;
    break a;
   case 23:
    a = eb(La(76), 0, 76);
    qg(a);
    n[a + 68 | 0] = 1;
    p[a + 64 >> 2] = 0;
    p[a + 56 >> 2] = 1065353216;
    p[a + 60 >> 2] = 0;
    p[a >> 2] = 10016;
    p[a + 72 >> 2] = 0;
    p[a >> 2] = 13228;
    break a;
   case 17:
    a = eb(La(64), 0, 64);
    Ub(a);
    p[a + 48 >> 2] = -9145228;
    p[a >> 2] = 10172;
    b = yg(a + 52 | 0);
    p[a >> 2] = 13148;
    p[b >> 2] = 13216;
    break a;
   case 18:
    a = eb(La(56), 0, 56);
    Ub(a);
    p[a + 48 >> 2] = -1;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 10236;
    p[a >> 2] = 12736;
    break a;
   case 46:
    a = La(76);
    Ul(a);
    break a;
   case 19:
    a = eb(La(60), 0, 60);
    qg(a);
    p[a + 56 >> 2] = 0;
    p[a >> 2] = 10304;
    p[a >> 2] = 12656;
    break a;
   case 1:
    a = eb(La(128), 0, 128);
    kf(a);
    break a;
   case 2:
    a = La(252);
    Kp(a);
    break a;
   case 4:
    a = eb(La(64), 0, 64);
    Tb(a);
    break a;
   case 33:
    a = eb(La(92), 0, 92);
    hf(a);
    p[a + 88 >> 2] = 0;
    p[a + 80 >> 2] = 0;
    p[a + 84 >> 2] = 0;
    p[a >> 2] = 10384;
    p[a >> 2] = 2896;
    break a;
   case 15:
    a = eb(La(164), 0, 164);
    bi(a);
    n[a + 152 | 0] = 0;
    p[a >> 2] = 10476;
    b = a + 156 | 0;
    p[b + 4 >> 2] = 0;
    p[b >> 2] = 10592;
    p[a >> 2] = 5036;
    p[b >> 2] = 5156;
    break a;
   case 6:
    a = La(428);
    Rp(a);
    break a;
   case 34:
    a = eb(La(88), 0, 88);
    hf(a);
    p[a + 80 >> 2] = 0;
    p[a + 84 >> 2] = 0;
    p[a >> 2] = 10604;
    p[a >> 2] = 3084;
    break a;
   case 7:
    a = La(360);
    jp(a);
    break a;
   case 3:
    a = La(552);
    Er(a);
    break a;
   case 41:
    a = eb(La(80), 0, 80);
    Ub(a);
    n[a + 56 | 0] = 1;
    p[a + 48 >> 2] = -1;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 10692;
    p[a >> 2] = 2756;
    bb(a + 60 | 0);
    p[a + 72 >> 2] = 0;
    p[a + 76 >> 2] = 0;
    break a;
   case 50:
    a = La(176);
    oh(a);
    break a;
   case 51:
    a = La(180);
    oh(a);
    p[a + 176 >> 2] = 1056964608;
    p[a >> 2] = 6472;
    p[a >> 2] = 6324;
    break a;
   case 5:
    a = eb(La(96), 0, 96);
    $c(a);
    break a;
   case 48:
    a = eb(La(56), 0, 56);
    rc(a);
    p[a + 48 >> 2] = -1;
    p[a >> 2] = 10764;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 7412;
    break a;
   case 0:
    a = eb(La(180), 0, 180);
    Sn(a);
    break a;
   case 22:
    a = La(4);
    p[a >> 2] = 0;
    Nb(a);
    p[a >> 2] = 10964;
    p[a >> 2] = 10924;
    break a;
   case 44:
    a = eb(La(64), 0, 64);
    Ag(a);
    break a;
   case 39:
    a = eb(La(136), 0, 136);
    zg(a);
    break a;
   case 40:
    a = eb(La(144), 0, 144);
    zg(a);
    p[a + 136 >> 2] = 0;
    p[a + 140 >> 2] = 0;
    p[a >> 2] = 11340;
    p[a >> 2] = 2224;
    break a;
   case 42:
    a = eb(La(116), 0, 116);
    Rn(a);
    break a;
   case 43:
    a = eb(La(104), 0, 104);
    Mn(a);
    p[a >> 2] = 2476;
    tb(a + 76 | 0);
    p[a + 100 >> 2] = 0;
    break a;
   case 45:
    b = La(96);
    Qn(eb(b, 0, 96));
    break;
   default:
    break b;
   }
  }
  return b;
 }
 return a;
}
function Ua(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 a : {
  if (!a) {
   break a;
  }
  d = a + -8 | 0;
  c = p[a + -4 >> 2];
  a = c & -8;
  f = d + a | 0;
  b : {
   if (c & 1) {
    break b;
   }
   if (!(c & 3)) {
    break a;
   }
   c = p[d >> 2];
   d = d - c | 0;
   if (d >>> 0 < s[5471]) {
    break a;
   }
   a = a + c | 0;
   if (p[5472] != (d | 0)) {
    if (c >>> 0 <= 255) {
     e = p[d + 8 >> 2];
     c = c >>> 3 | 0;
     b = p[d + 12 >> 2];
     if ((b | 0) == (e | 0)) {
      i = 21868, j = p[5467] & Zw(c), p[i >> 2] = j;
      break b;
     }
     p[e + 12 >> 2] = b;
     p[b + 8 >> 2] = e;
     break b;
    }
    h = p[d + 24 >> 2];
    c = p[d + 12 >> 2];
    c : {
     if ((d | 0) != (c | 0)) {
      b = p[d + 8 >> 2];
      p[b + 12 >> 2] = c;
      p[c + 8 >> 2] = b;
      break c;
     }
     d : {
      e = d + 20 | 0;
      b = p[e >> 2];
      if (b) {
       break d;
      }
      e = d + 16 | 0;
      b = p[e >> 2];
      if (b) {
       break d;
      }
      c = 0;
      break c;
     }
     while (1) {
      g = e;
      c = b;
      e = c + 20 | 0;
      b = p[e >> 2];
      if (b) {
       continue;
      }
      e = c + 16 | 0;
      b = p[c + 16 >> 2];
      if (b) {
       continue;
      }
      break;
     }
     p[g >> 2] = 0;
    }
    if (!h) {
     break b;
    }
    e = p[d + 28 >> 2];
    b = (e << 2) + 22172 | 0;
    e : {
     if (p[b >> 2] == (d | 0)) {
      p[b >> 2] = c;
      if (c) {
       break e;
      }
      i = 21872, j = p[5468] & Zw(e), p[i >> 2] = j;
      break b;
     }
     p[h + (p[h + 16 >> 2] == (d | 0) ? 16 : 20) >> 2] = c;
     if (!c) {
      break b;
     }
    }
    p[c + 24 >> 2] = h;
    b = p[d + 16 >> 2];
    if (b) {
     p[c + 16 >> 2] = b;
     p[b + 24 >> 2] = c;
    }
    b = p[d + 20 >> 2];
    if (!b) {
     break b;
    }
    p[c + 20 >> 2] = b;
    p[b + 24 >> 2] = c;
    break b;
   }
   c = p[f + 4 >> 2];
   if ((c & 3) != 3) {
    break b;
   }
   p[5469] = a;
   p[f + 4 >> 2] = c & -2;
   p[d + 4 >> 2] = a | 1;
   p[a + d >> 2] = a;
   return;
  }
  if (f >>> 0 <= d >>> 0) {
   break a;
  }
  c = p[f + 4 >> 2];
  if (!(c & 1)) {
   break a;
  }
  f : {
   if (!(c & 2)) {
    if (p[5473] == (f | 0)) {
     p[5473] = d;
     a = p[5470] + a | 0;
     p[5470] = a;
     p[d + 4 >> 2] = a | 1;
     if (p[5472] != (d | 0)) {
      break a;
     }
     p[5469] = 0;
     p[5472] = 0;
     return;
    }
    if (p[5472] == (f | 0)) {
     p[5472] = d;
     a = p[5469] + a | 0;
     p[5469] = a;
     p[d + 4 >> 2] = a | 1;
     p[a + d >> 2] = a;
     return;
    }
    a = (c & -8) + a | 0;
    g : {
     if (c >>> 0 <= 255) {
      b = p[f + 8 >> 2];
      c = c >>> 3 | 0;
      e = p[f + 12 >> 2];
      if ((b | 0) == (e | 0)) {
       i = 21868, j = p[5467] & Zw(c), p[i >> 2] = j;
       break g;
      }
      p[b + 12 >> 2] = e;
      p[e + 8 >> 2] = b;
      break g;
     }
     h = p[f + 24 >> 2];
     c = p[f + 12 >> 2];
     h : {
      if ((f | 0) != (c | 0)) {
       b = p[f + 8 >> 2];
       p[b + 12 >> 2] = c;
       p[c + 8 >> 2] = b;
       break h;
      }
      i : {
       e = f + 20 | 0;
       b = p[e >> 2];
       if (b) {
        break i;
       }
       e = f + 16 | 0;
       b = p[e >> 2];
       if (b) {
        break i;
       }
       c = 0;
       break h;
      }
      while (1) {
       g = e;
       c = b;
       e = c + 20 | 0;
       b = p[e >> 2];
       if (b) {
        continue;
       }
       e = c + 16 | 0;
       b = p[c + 16 >> 2];
       if (b) {
        continue;
       }
       break;
      }
      p[g >> 2] = 0;
     }
     if (!h) {
      break g;
     }
     e = p[f + 28 >> 2];
     b = (e << 2) + 22172 | 0;
     j : {
      if (p[b >> 2] == (f | 0)) {
       p[b >> 2] = c;
       if (c) {
        break j;
       }
       i = 21872, j = p[5468] & Zw(e), p[i >> 2] = j;
       break g;
      }
      p[h + (p[h + 16 >> 2] == (f | 0) ? 16 : 20) >> 2] = c;
      if (!c) {
       break g;
      }
     }
     p[c + 24 >> 2] = h;
     b = p[f + 16 >> 2];
     if (b) {
      p[c + 16 >> 2] = b;
      p[b + 24 >> 2] = c;
     }
     b = p[f + 20 >> 2];
     if (!b) {
      break g;
     }
     p[c + 20 >> 2] = b;
     p[b + 24 >> 2] = c;
    }
    p[d + 4 >> 2] = a | 1;
    p[a + d >> 2] = a;
    if (p[5472] != (d | 0)) {
     break f;
    }
    p[5469] = a;
    return;
   }
   p[f + 4 >> 2] = c & -2;
   p[d + 4 >> 2] = a | 1;
   p[a + d >> 2] = a;
  }
  if (a >>> 0 <= 255) {
   a = a >>> 3 | 0;
   c = (a << 3) + 21908 | 0;
   b = p[5467];
   a = 1 << a;
   k : {
    if (!(b & a)) {
     p[5467] = a | b;
     a = c;
     break k;
    }
    a = p[c + 8 >> 2];
   }
   p[c + 8 >> 2] = d;
   p[a + 12 >> 2] = d;
   p[d + 12 >> 2] = c;
   p[d + 8 >> 2] = a;
   return;
  }
  p[d + 16 >> 2] = 0;
  p[d + 20 >> 2] = 0;
  f = d;
  e = a >>> 8 | 0;
  b = 0;
  l : {
   if (!e) {
    break l;
   }
   b = 31;
   if (a >>> 0 > 16777215) {
    break l;
   }
   c = e;
   e = e + 1048320 >>> 16 & 8;
   b = c << e;
   h = b + 520192 >>> 16 & 4;
   b = b << h;
   g = b + 245760 >>> 16 & 2;
   b = (b << g >>> 15 | 0) - (g | (e | h)) | 0;
   b = (b << 1 | a >>> b + 21 & 1) + 28 | 0;
  }
  p[f + 28 >> 2] = b;
  g = (b << 2) + 22172 | 0;
  m : {
   n : {
    e = p[5468];
    c = 1 << b;
    o : {
     if (!(e & c)) {
      p[5468] = c | e;
      p[g >> 2] = d;
      p[d + 24 >> 2] = g;
      break o;
     }
     e = a << ((b | 0) == 31 ? 0 : 25 - (b >>> 1 | 0) | 0);
     c = p[g >> 2];
     while (1) {
      b = c;
      if ((p[c + 4 >> 2] & -8) == (a | 0)) {
       break n;
      }
      c = e >>> 29 | 0;
      e = e << 1;
      g = b + (c & 4) | 0;
      c = p[g + 16 >> 2];
      if (c) {
       continue;
      }
      break;
     }
     p[g + 16 >> 2] = d;
     p[d + 24 >> 2] = b;
    }
    p[d + 12 >> 2] = d;
    p[d + 8 >> 2] = d;
    break m;
   }
   a = p[b + 8 >> 2];
   p[a + 12 >> 2] = d;
   p[b + 8 >> 2] = d;
   p[d + 24 >> 2] = 0;
   p[d + 12 >> 2] = b;
   p[d + 8 >> 2] = a;
  }
  a = p[5475] + -1 | 0;
  p[5475] = a;
  if (a) {
   break a;
  }
  d = 22324;
  while (1) {
   a = p[d >> 2];
   d = a + 8 | 0;
   if (a) {
    continue;
   }
   break;
  }
  p[5475] = -1;
 }
}
function Vu(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, q = 0, r = 0, s = 0, t = 0, w = 0, y = 0;
 g = sa - 560 | 0;
 sa = g;
 e = c;
 c = (c + -3 | 0) / 24 | 0;
 q = (c | 0) > 0 ? c : 0;
 k = e + v(q, -24) | 0;
 i = p[4240];
 if ((i | 0) >= 0) {
  e = i + 1 | 0;
  c = q;
  while (1) {
   u[(g + 320 | 0) + (f << 3) >> 3] = (c | 0) < 0 ? 0 : +p[(c << 2) + 16976 >> 2];
   c = c + 1 | 0;
   f = f + 1 | 0;
   if ((e | 0) != (f | 0)) {
    continue;
   }
   break;
  }
 }
 m = k + -24 | 0;
 e = 0;
 f = (i | 0) > 0 ? i : 0;
 while (1) {
  c = 0;
  d = 0;
  while (1) {
   d = d + u[(c << 3) + a >> 3] * u[(g + 320 | 0) + (e - c << 3) >> 3];
   c = c + 1 | 0;
   if ((c | 0) != 1) {
    continue;
   }
   break;
  }
  u[(e << 3) + g >> 3] = d;
  c = (e | 0) == (f | 0);
  e = e + 1 | 0;
  if (!c) {
   continue;
  }
  break;
 }
 w = 47 - k | 0;
 r = 48 - k | 0;
 y = k + -25 | 0;
 e = i;
 a : {
  while (1) {
   d = u[(e << 3) + g >> 3];
   c = 0;
   f = e;
   l = (e | 0) < 1;
   if (!l) {
    while (1) {
     j = (g + 480 | 0) + (c << 2) | 0;
     n = d;
     d = d * 5.960464477539063e-8;
     b : {
      if (x(d) < 2147483648) {
       h = ~~d;
       break b;
      }
      h = -2147483648;
     }
     d = +(h | 0);
     n = n + d * -16777216;
     c : {
      if (x(n) < 2147483648) {
       h = ~~n;
       break c;
      }
      h = -2147483648;
     }
     p[j >> 2] = h;
     f = f + -1 | 0;
     d = u[(f << 3) + g >> 3] + d;
     c = c + 1 | 0;
     if ((e | 0) != (c | 0)) {
      continue;
     }
     break;
    }
   }
   d = _d(d, m);
   d = d + B(d * .125) * -8;
   d : {
    if (x(d) < 2147483648) {
     h = ~~d;
     break d;
    }
    h = -2147483648;
   }
   d = d - +(h | 0);
   e : {
    f : {
     g : {
      s = (m | 0) < 1;
      h : {
       if (!s) {
        f = (e << 2) + g | 0;
        j = p[f + 476 >> 2];
        c = j >> r;
        o = f;
        f = j - (c << r) | 0;
        p[o + 476 >> 2] = f;
        h = c + h | 0;
        j = f >> w;
        break h;
       }
       if (m) {
        break g;
       }
       j = p[((e << 2) + g | 0) + 476 >> 2] >> 23;
      }
      if ((j | 0) < 1) {
       break e;
      }
      break f;
     }
     j = 2;
     if (!(d >= .5 ^ 1)) {
      break f;
     }
     j = 0;
     break e;
    }
    c = 0;
    f = 0;
    if (!l) {
     while (1) {
      o = (g + 480 | 0) + (c << 2) | 0;
      t = p[o >> 2];
      l = 16777215;
      i : {
       j : {
        if (f) {
         break j;
        }
        l = 16777216;
        if (t) {
         break j;
        }
        f = 0;
        break i;
       }
       p[o >> 2] = l - t;
       f = 1;
      }
      c = c + 1 | 0;
      if ((e | 0) != (c | 0)) {
       continue;
      }
      break;
     }
    }
    k : {
     if (s) {
      break k;
     }
     l : {
      switch (y | 0) {
      case 0:
       c = (e << 2) + g | 0;
       p[c + 476 >> 2] = p[c + 476 >> 2] & 8388607;
       break k;
      case 1:
       break l;
      default:
       break k;
      }
     }
     c = (e << 2) + g | 0;
     p[c + 476 >> 2] = p[c + 476 >> 2] & 4194303;
    }
    h = h + 1 | 0;
    if ((j | 0) != 2) {
     break e;
    }
    d = 1 - d;
    j = 2;
    if (!f) {
     break e;
    }
    d = d - _d(1, m);
   }
   if (d == 0) {
    f = 0;
    m : {
     c = e;
     if ((c | 0) <= (i | 0)) {
      break m;
     }
     while (1) {
      c = c + -1 | 0;
      f = p[(g + 480 | 0) + (c << 2) >> 2] | f;
      if ((c | 0) > (i | 0)) {
       continue;
      }
      break;
     }
     if (!f) {
      break m;
     }
     k = m;
     while (1) {
      k = k + -24 | 0;
      e = e + -1 | 0;
      if (!p[(g + 480 | 0) + (e << 2) >> 2]) {
       continue;
      }
      break;
     }
     break a;
    }
    c = 1;
    while (1) {
     f = c;
     c = c + 1 | 0;
     if (!p[(g + 480 | 0) + (i - f << 2) >> 2]) {
      continue;
     }
     break;
    }
    f = e + f | 0;
    while (1) {
     h = e + 1 | 0;
     e = e + 1 | 0;
     u[(g + 320 | 0) + (h << 3) >> 3] = p[(q + e << 2) + 16976 >> 2];
     c = 0;
     d = 0;
     while (1) {
      d = d + u[(c << 3) + a >> 3] * u[(g + 320 | 0) + (h - c << 3) >> 3];
      c = c + 1 | 0;
      if ((c | 0) != 1) {
       continue;
      }
      break;
     }
     u[(e << 3) + g >> 3] = d;
     if ((e | 0) < (f | 0)) {
      continue;
     }
     break;
    }
    e = f;
    continue;
   }
   break;
  }
  d = _d(d, 0 - m | 0);
  n : {
   if (!(d >= 16777216 ^ 1)) {
    f = (g + 480 | 0) + (e << 2) | 0;
    n = d;
    d = d * 5.960464477539063e-8;
    o : {
     if (x(d) < 2147483648) {
      c = ~~d;
      break o;
     }
     c = -2147483648;
    }
    d = n + +(c | 0) * -16777216;
    p : {
     if (x(d) < 2147483648) {
      a = ~~d;
      break p;
     }
     a = -2147483648;
    }
    p[f >> 2] = a;
    e = e + 1 | 0;
    break n;
   }
   if (x(d) < 2147483648) {
    c = ~~d;
   } else {
    c = -2147483648;
   }
   k = m;
  }
  p[(g + 480 | 0) + (e << 2) >> 2] = c;
 }
 d = _d(1, k);
 q : {
  if ((e | 0) <= -1) {
   break q;
  }
  c = e;
  while (1) {
   u[(c << 3) + g >> 3] = d * +p[(g + 480 | 0) + (c << 2) >> 2];
   d = d * 5.960464477539063e-8;
   a = (c | 0) > 0;
   c = c + -1 | 0;
   if (a) {
    continue;
   }
   break;
  }
  l = 0;
  if ((e | 0) < 0) {
   break q;
  }
  a = (i | 0) > 0 ? i : 0;
  f = e;
  while (1) {
   k = a >>> 0 < l >>> 0 ? a : l;
   m = e - f | 0;
   c = 0;
   d = 0;
   while (1) {
    d = d + u[(c << 3) + 19744 >> 3] * u[(c + f << 3) + g >> 3];
    i = (c | 0) != (k | 0);
    c = c + 1 | 0;
    if (i) {
     continue;
    }
    break;
   }
   u[(g + 160 | 0) + (m << 3) >> 3] = d;
   f = f + -1 | 0;
   c = (e | 0) != (l | 0);
   l = l + 1 | 0;
   if (c) {
    continue;
   }
   break;
  }
 }
 d = 0;
 if ((e | 0) >= 0) {
  while (1) {
   d = d + u[(g + 160 | 0) + (e << 3) >> 3];
   a = (e | 0) > 0;
   e = e + -1 | 0;
   if (a) {
    continue;
   }
   break;
  }
 }
 u[b >> 3] = j ? -d : d;
 sa = g + 560 | 0;
 return h & 7;
}
function dp(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, n = 0, o = 0;
 b = sa - 192 | 0;
 sa = b;
 c = a + 76 | 0;
 n = a, o = Xc(c, 0), p[n + 168 >> 2] = o;
 n = a, o = Xc(c, 0), p[n + 172 >> 2] = o;
 f = a + 92 | 0;
 n = b, o = Oa(f), p[n + 80 >> 2] = o;
 n = b, o = Qa(f), p[n + 40 >> 2] = o;
 g = a + 72 | 0;
 while (1) {
  a : {
   d = Sa(b + 80 | 0, b + 40 | 0);
   if (!d) {
    break a;
   }
   c = p[p[b + 80 >> 2] >> 2];
   if (c) {
    c = m[p[p[c >> 2] + 20 >> 2]](c, g) | 0;
    if (!Gc(c)) {
     break a;
    }
   }
   Ra(b + 80 | 0);
   continue;
  }
  break;
 }
 b : {
  if (d) {
   break b;
  }
  h = a + 104 | 0;
  n = b, o = Oa(h), p[n + 80 >> 2] = o;
  n = b, o = Qa(h), p[n + 40 >> 2] = o;
  while (1) {
   c : {
    e = Sa(b + 80 | 0, b + 40 | 0);
    if (!e) {
     d = c;
     break c;
    }
    d = p[p[b + 80 >> 2] >> 2];
    d = m[p[p[d >> 2] + 20 >> 2]](d, g) | 0;
    if (!Gc(d)) {
     break c;
    }
    Ra(b + 80 | 0);
    continue;
   }
   break;
  }
  if (e) {
   c = d;
   break b;
  }
  i = a + 116 | 0;
  n = b, o = Oa(i), p[n + 80 >> 2] = o;
  n = b, o = Qa(i), p[n + 40 >> 2] = o;
  while (1) {
   d : {
    c = Sa(b + 80 | 0, b + 40 | 0);
    if (!c) {
     e = d;
     break d;
    }
    e = p[p[b + 80 >> 2] >> 2];
    e = m[p[p[e >> 2] + 20 >> 2]](e, g) | 0;
    if (!Gc(e)) {
     break d;
    }
    Ra(b + 80 | 0);
    continue;
   }
   break;
  }
  if (c) {
   c = e;
   break b;
  }
  j = Le(b + 168 | 0);
  n = b, o = Oa(f), p[n + 80 >> 2] = o;
  n = b, o = Qa(f), p[n + 40 >> 2] = o;
  l = p[4952];
  while (1) {
   e : {
    k = Sa(b + 80 | 0, b + 40 | 0);
    if (!k) {
     c = e;
     break e;
    }
    d = p[p[b + 80 >> 2] >> 2];
    f : {
     if (!d) {
      break f;
     }
     c = m[p[p[d >> 2] + 24 >> 2]](d, g) | 0;
     if (!Gc(c)) {
      break e;
     }
     if (!(m[p[p[d >> 2] + 12 >> 2]](d, 49) | 0)) {
      break f;
     }
     c = m[p[p[a >> 2] + 76 >> 2]](a, p[d + 16 >> 2]) | 0;
     p[b + 24 >> 2] = c;
     if (c) {
      n = cp(j, b + 24 | 0), o = d, p[n >> 2] = o;
      break f;
     }
     p[b >> 2] = p[d + 16 >> 2];
     ae(l, 7044, b);
    }
    Ra(b + 80 | 0);
    continue;
   }
   break;
  }
  g : {
   if (k) {
    break g;
   }
   n = b, o = Oa(h), p[n + 80 >> 2] = o;
   n = b, o = Qa(h), p[n + 40 >> 2] = o;
   while (1) {
    h : {
     e = Sa(b + 80 | 0, b + 40 | 0);
     if (!e) {
      d = c;
      break h;
     }
     d = p[p[b + 80 >> 2] >> 2];
     d = m[p[p[d >> 2] + 24 >> 2]](d, g) | 0;
     if (!Gc(d)) {
      break h;
     }
     Ra(b + 80 | 0);
     continue;
    }
    break;
   }
   if (e) {
    c = d;
    break g;
   }
   n = b, o = Oa(i), p[n + 80 >> 2] = o;
   n = b, o = Qa(i), p[n + 40 >> 2] = o;
   while (1) {
    i : {
     e = Sa(b + 80 | 0, b + 40 | 0);
     if (!e) {
      c = d;
      break i;
     }
     c = p[p[b + 80 >> 2] >> 2];
     c = m[p[p[c >> 2] + 24 >> 2]](c, g) | 0;
     if (!Gc(c)) {
      break i;
     }
     Ra(b + 80 | 0);
     continue;
    }
    break;
   }
   if (e) {
    break g;
   }
   n = b, o = Oa(f), p[n + 80 >> 2] = o;
   n = b, o = Qa(f), p[n + 40 >> 2] = o;
   d = a + 140 | 0;
   while (1) {
    j : {
     k : {
      if (!Sa(b + 80 | 0, b + 40 | 0)) {
       bp(a);
       d = _g(b + 80 | 0);
       n = b, o = Oa(f), p[n + 40 >> 2] = o;
       n = b, o = Qa(f), p[n + 24 >> 2] = o;
       break k;
      }
      c = p[p[b + 80 >> 2] >> 2];
      if (!c) {
       break j;
      }
      if (m[p[p[c >> 2] + 12 >> 2]](c, 10) | 0) {
       m[p[p[c >> 2] + 40 >> 2]](c);
      }
      if (!tf(c)) {
       break j;
      }
      p[b + 24 >> 2] = c;
      Ic(d, b + 24 | 0);
      c = p[b + 24 >> 2];
      while (1) {
       if (!c) {
        break j;
       }
       p[b + 152 >> 2] = c;
       n = b, o = ap(j, b + 152 | 0), p[n + 160 >> 2] = o;
       n = b, o = Lc(), p[n + 152 >> 2] = o;
       if (Kd(b + 160 | 0, b + 152 | 0)) {
        c = Wb(b + 160 | 0);
        p[p[b + 24 >> 2] + 148 >> 2] = p[c + 4 >> 2];
        break j;
       } else {
        c = p[c + 20 >> 2];
        continue;
       }
      }
     }
     while (1) {
      l : {
       m : {
        if (!Sa(b + 40 | 0, b + 24 | 0)) {
         e = Zg(b + 40 | 0);
         c = bb(b + 24 | 0);
         Mg(e, d, c);
         n = b, o = Oa(c), p[n + 160 >> 2] = o;
         Yg(b + 160 | 0);
         a = a + 152 | 0;
         while (1) {
          n = b, o = Qa(c), p[n + 152 >> 2] = o;
          if (!Sa(b + 160 | 0, b + 152 | 0)) {
           break m;
          }
          n = b, o = Yg(b + 160 | 0), p[n + 16 >> 2] = o;
          p[b + 152 >> 2] = p[p[b + 16 >> 2] >> 2];
          Xg(a, b + 152 | 0);
          continue;
         }
        }
        c = p[p[b + 40 >> 2] >> 2];
        if (!c) {
         break l;
        }
        if (!Jd(c)) {
         break l;
        }
        Rb(d, c);
        g = p[p[c + 56 >> 2] + 148 >> 2];
        if (!g) {
         break l;
        }
        n = b, o = Oa(f), p[n + 160 >> 2] = o;
        n = b, o = Qa(f), p[n + 152 >> 2] = o;
        while (1) {
         if (!Sa(b + 160 | 0, b + 152 | 0)) {
          break l;
         }
         e = p[p[b + 160 >> 2] >> 2];
         n : {
          if (!e) {
           break n;
          }
          if (!Jd(e) | (g | 0) != p[e + 20 >> 2]) {
           break n;
          }
          Rb(e, c);
         }
         Ra(b + 160 | 0);
         continue;
        }
       }
       ib(c);
       Wg(e);
       hb(d);
       c = 0;
       break g;
      }
      Ra(b + 40 | 0);
      continue;
     }
    }
    Ra(b + 80 | 0);
    continue;
   }
  }
  Wc(j);
 }
 sa = b + 192 | 0;
 return c & 255;
}
function zq(a, b, c) {
 var d = 0, e = w(0), f = 0, g = 0, h = w(0), i = 0, j = 0, k = 0, l = w(0), n = 0, o = w(0), q = w(0), r = w(0), s = w(0), u = w(0), v = 0, x = w(0), y = 0, z = w(0), A = 0, B = 0, C = w(0), D = w(0), E = w(0), F = w(0), G = w(0), H = w(0);
 d = sa - 144 | 0;
 sa = d;
 m[p[p[a >> 2] + 8 >> 2]](a);
 v = ab(c);
 a : {
  if (v >>> 0 < 2) {
   break a;
  }
  f = p[Pa(c, 0) >> 2];
  y = _c(f);
  b : {
   if (y) {
    g = Ib(d - -64 | 0, Vd(f));
    q = t[Ja(g, 0) >> 2];
    r = t[Ja(g, 1) >> 2];
    g = Ib(d + 136 | 0, nf(f));
    e = t[Ja(g, 0) >> 2];
    l = t[Ja(g, 1) >> 2];
    $b(d + 128 | 0, f);
    s = t[Ja(d + 128 | 0, 0) >> 2];
    u = t[Ja(d + 128 | 0, 1) >> 2];
    m[p[p[a >> 2] + 20 >> 2]](a, s, u);
    break b;
   }
   i = vh(d - -64 | 0, f);
   e = t[i + 60 >> 2];
   t[d + 60 >> 2] = e;
   c : {
    if (!(e > w(0) ^ 1)) {
     g = p[Pa(c, v + -1 | 0) >> 2];
     $b(d + 136 | 0, i);
     f = gb(d + 128 | 0);
     d : {
      if (_c(g)) {
       Ib(d + 48 | 0, nf(g));
       break d;
      }
      $b(d + 48 | 0, g);
     }
     cd(f, d + 48 | 0, d + 136 | 0);
     e = Wd(f);
     t[d + 44 >> 2] = e;
     g = Ja(f, 0);
     t[g >> 2] = t[g >> 2] / e;
     e = t[d + 44 >> 2];
     g = Ja(f, 1);
     t[g >> 2] = t[g >> 2] / e;
     j = p[Pa(c, 1) >> 2];
     g = gb(d + 48 | 0);
     e : {
      if (_c(j)) {
       Ib(d + 32 | 0, Vd(j));
       break e;
      }
      $b(d + 32 | 0, j);
     }
     cd(g, d + 32 | 0, d + 136 | 0);
     e = Wd(g);
     t[d + 28 >> 2] = e;
     j = Ja(g, 0);
     t[j >> 2] = t[j >> 2] / e;
     e = t[d + 28 >> 2];
     j = Ja(g, 1);
     t[j >> 2] = t[j >> 2] / e;
     e = t[Nd(d + 44 | 0, Nd(d + 28 | 0, d + 60 | 0)) >> 2];
     j = gb(d + 32 | 0);
     Ob(j, d + 136 | 0, f, e);
     q = t[Ja(j, 0) >> 2];
     r = t[Ja(j, 1) >> 2];
     m[p[p[a >> 2] + 20 >> 2]](a, q, r);
     j = gb(d + 16 | 0);
     l = w(e * w(.44771522283554077));
     Ob(j, d + 136 | 0, f, l);
     f = gb(d + 8 | 0);
     Ob(f, d + 136 | 0, g, l);
     n = gb(d);
     Ob(n, d + 136 | 0, g, e);
     h = t[Ja(j, 0) >> 2];
     o = t[Ja(j, 1) >> 2];
     s = t[Ja(f, 0) >> 2];
     u = t[Ja(f, 1) >> 2];
     e = t[Ja(n, 0) >> 2];
     l = t[Ja(n, 1) >> 2];
     m[p[p[a >> 2] + 28 >> 2]](a, h, o, s, u, e, l);
     break c;
    }
    $b(d + 136 | 0, i);
    q = t[Ja(d + 136 | 0, 0) >> 2];
    r = t[Ja(d + 136 | 0, 1) >> 2];
    m[p[p[a >> 2] + 20 >> 2]](a, q, r);
    l = r;
    e = q;
   }
   hb(i);
   u = r;
   s = q;
  }
  j = 1;
  f = y;
  while (1) {
   if ((j | 0) == (v | 0)) {
    if (!b) {
     break a;
    }
    if ((f | y) & 1) {
     m[p[p[a >> 2] + 28 >> 2]](a, e, l, q, r, s, u);
    }
    m[p[p[a >> 2] + 32 >> 2]](a);
   } else {
    i = p[Pa(c, j) >> 2];
    g = _c(i);
    f : {
     if (g) {
      f = Ib(d - -64 | 0, Vd(i));
      $b(d + 136 | 0, i);
      B = a, C = e, D = l, E = t[Ja(f, 0) >> 2], F = t[Ja(f, 1) >> 2], G = t[Ja(d + 136 | 0, 0) >> 2], H = t[Ja(d + 136 | 0, 1) >> 2], A = p[p[a >> 2] + 28 >> 2], m[A](B | 0, w(C), w(D), w(E), w(F), w(G), w(H));
      f = Ib(d + 128 | 0, nf(i));
      e = t[Ja(f, 0) >> 2];
      l = t[Ja(f, 1) >> 2];
      break f;
     }
     vh(d - -64 | 0, i);
     $b(d + 136 | 0, d - -64 | 0);
     h = t[(d - -64 | 0) + 60 >> 2];
     t[d + 60 >> 2] = h;
     g : {
      if (!(h > w(0) ^ 1)) {
       n = gb(d + 128 | 0);
       cd(n, cb(d + 48 | 0, e, l), d + 136 | 0);
       h = Wd(n);
       t[d + 44 >> 2] = h;
       i = Ja(n, 0);
       t[i >> 2] = t[i >> 2] / h;
       h = t[d + 44 >> 2];
       i = Ja(n, 1);
       t[i >> 2] = t[i >> 2] / h;
       k = p[Pa(c, (j + 1 >>> 0) % (v >>> 0) | 0) >> 2];
       i = gb(d + 48 | 0);
       h : {
        if (_c(k)) {
         Ib(d + 32 | 0, Vd(k));
         break h;
        }
        $b(d + 32 | 0, k);
       }
       cd(i, d + 32 | 0, d + 136 | 0);
       h = Wd(i);
       t[d + 28 >> 2] = h;
       k = Ja(i, 0);
       t[k >> 2] = t[k >> 2] / h;
       h = t[d + 28 >> 2];
       k = Ja(i, 1);
       t[k >> 2] = t[k >> 2] / h;
       h = t[Nd(d + 44 | 0, Nd(d + 28 | 0, d + 60 | 0)) >> 2];
       k = gb(d + 32 | 0);
       Ob(k, d + 136 | 0, n, h);
       o = t[Ja(k, 0) >> 2];
       x = t[Ja(k, 1) >> 2];
       i : {
        if (f & 1) {
         B = a, H = e, G = l, F = o, E = x, D = t[Ja(k, 0) >> 2], C = t[Ja(k, 1) >> 2], A = p[p[a >> 2] + 28 >> 2], m[A](B | 0, w(H), w(G), w(F), w(E), w(D), w(C));
         break i;
        }
        m[p[p[a >> 2] + 24 >> 2]](a, o, x);
       }
       f = gb(d + 16 | 0);
       e = w(h * w(.44771522283554077));
       Ob(f, d + 136 | 0, n, e);
       n = gb(d + 8 | 0);
       Ob(n, d + 136 | 0, i, e);
       k = gb(d);
       Ob(k, d + 136 | 0, i, h);
       h = t[Ja(f, 0) >> 2];
       o = t[Ja(f, 1) >> 2];
       x = t[Ja(n, 0) >> 2];
       z = t[Ja(n, 1) >> 2];
       e = t[Ja(k, 0) >> 2];
       l = t[Ja(k, 1) >> 2];
       m[p[p[a >> 2] + 28 >> 2]](a, h, o, x, z, e, l);
       break g;
      }
      h = t[Ja(d + 136 | 0, 0) >> 2];
      o = t[Ja(d + 136 | 0, 1) >> 2];
      j : {
       if (f & 1) {
        m[p[p[a >> 2] + 28 >> 2]](a, e, l, h, o, h, o);
        break j;
       }
       m[p[p[a >> 2] + 24 >> 2]](a, h, o);
      }
      l = o;
      e = h;
     }
     hb(d - -64 | 0);
    }
    j = j + 1 | 0;
    f = g;
    continue;
   }
   break;
  }
 }
 sa = d + 144 | 0;
}
function le(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 a : while (1) {
  h = b + -4 | 0;
  b : while (1) {
   e = a;
   while (1) {
    c : {
     d : {
      e : {
       f : {
        g : {
         h : {
          i : {
           j : {
            k : {
             a = b - e | 0;
             d = a >> 2;
             switch (d | 0) {
             case 5:
              break i;
             case 4:
              break j;
             case 2:
              break k;
             case 0:
             case 1:
              break c;
             case 3:
              break g;
             default:
              break h;
             }
            }
            a = b + -4 | 0;
            if (!(m[p[c >> 2]](p[a >> 2], p[e >> 2]) | 0)) {
             break c;
            }
            Wa(e, a);
            return;
           }
           ke(e, e + 4 | 0, e + 8 | 0, b + -4 | 0, c);
           return;
          }
          je(e, e + 4 | 0, e + 8 | 0, e + 12 | 0, b + -4 | 0, c);
          return;
         }
         if ((a | 0) <= 123) {
          fm(e, b, c);
          return;
         }
         f = ((d | 0) / 2 << 2) + e | 0;
         l : {
          if ((a | 0) >= 3997) {
           a = (d | 0) / 4 << 2;
           a = je(e, a + e | 0, f, a + f | 0, h, c);
           break l;
          }
          a = Cc(e, f, h, c);
         }
         i = a;
         a = h;
         if (!(m[p[c >> 2]](p[e >> 2], p[f >> 2]) | 0)) {
          while (1) {
           a = a + -4 | 0;
           if ((e | 0) == (a | 0)) {
            d = e + 4 | 0;
            if (m[p[c >> 2]](p[e >> 2], p[h >> 2]) | 0) {
             break e;
            }
            while (1) {
             if ((d | 0) == (h | 0)) {
              break c;
             }
             if (m[p[c >> 2]](p[e >> 2], p[d >> 2]) | 0) {
              Wa(d, h);
              d = d + 4 | 0;
              break e;
             } else {
              d = d + 4 | 0;
              continue;
             }
            }
           }
           if (!(m[p[c >> 2]](p[a >> 2], p[f >> 2]) | 0)) {
            continue;
           }
           break;
          }
          Wa(e, a);
          i = i + 1 | 0;
         }
         d = e + 4 | 0;
         if (d >>> 0 >= a >>> 0) {
          break f;
         }
         while (1) {
          g = d;
          d = d + 4 | 0;
          if (m[p[c >> 2]](p[g >> 2], p[f >> 2]) | 0) {
           continue;
          }
          while (1) {
           a = a + -4 | 0;
           if (!(m[p[c >> 2]](p[a >> 2], p[f >> 2]) | 0)) {
            continue;
           }
           break;
          }
          if (g >>> 0 > a >>> 0) {
           d = g;
           break f;
          } else {
           Wa(g, a);
           f = (f | 0) == (g | 0) ? a : f;
           i = i + 1 | 0;
           continue;
          }
         }
        }
        Cc(e, e + 4 | 0, b + -4 | 0, c);
        break c;
       }
       m : {
        if ((d | 0) == (f | 0)) {
         break m;
        }
        if (!(m[p[c >> 2]](p[f >> 2], p[d >> 2]) | 0)) {
         break m;
        }
        Wa(d, f);
        i = i + 1 | 0;
       }
       if (!i) {
        g = fg(e, d, c);
        a = d + 4 | 0;
        if (fg(a, b, c)) {
         b = d;
         a = e;
         if (!g) {
          continue a;
         }
         break c;
        }
        f = 2;
        if (g) {
         break d;
        }
       }
       if ((d - e | 0) < (b - d | 0)) {
        le(e, d, c);
        a = d + 4 | 0;
        continue b;
       }
       le(d + 4 | 0, b, c);
       b = d;
       a = e;
       continue a;
      }
      f = h;
      if ((f | 0) == (d | 0)) {
       break c;
      }
      while (1) {
       a = d;
       d = d + 4 | 0;
       if (!(m[p[c >> 2]](p[e >> 2], p[a >> 2]) | 0)) {
        continue;
       }
       while (1) {
        f = f + -4 | 0;
        if (m[p[c >> 2]](p[e >> 2], p[f >> 2]) | 0) {
         continue;
        }
        break;
       }
       if (a >>> 0 < f >>> 0) {
        Wa(a, f);
        continue;
       }
       break;
      }
      f = 4;
     }
     e = a;
     switch (f | 0) {
     case 0:
     case 2:
      continue b;
     case 4:
      continue;
     default:
      break c;
     }
    }
    break;
   }
   break;
  }
  break;
 }
}
function af(a, b, c, d, e, f) {
 var g = 0, h = w(0), i = 0, j = 0, k = 0, l = 0, n = w(0), o = 0, r = 0, s = w(0), u = 0, v = 0, x = 0, y = w(0), z = w(0), A = w(0), B = w(0), C = w(0), D = w(0);
 g = sa + -64 | 0;
 sa = g;
 l = Nh(a + 40 | 0, b);
 o = q[l | 0];
 a : {
  if (!o) {
   a = a + 16 | 0;
   b = kb(a, q[l + 1 | 0] + -1 | 0);
   j = kb(a, q[l + 1 | 0]);
   a = gb(g);
   cd(a, j, b);
   if (e) {
    e = gb(g + 56 | 0);
    Ob(e, b, a, c);
    x = f, y = t[Ja(e, 0) >> 2], z = t[Ja(e, 1) >> 2], v = p[p[f >> 2] + 20 >> 2], m[v](x | 0, w(y), w(z));
   }
   Ob(a, b, a, d);
   x = f, z = t[Ja(a, 0) >> 2], y = t[Ja(a, 1) >> 2], v = p[p[f >> 2] + 24 >> 2], m[v](x | 0, w(z), w(y));
   break a;
  }
  j = o + -1 | 0;
  u = q[l + 2 | 0];
  n = t[Pa(a + 52 | 0, b) >> 2];
  b : {
   c : {
    if (c == w(0)) {
     break c;
    }
    r = j + u | 0;
    i = a + 28 | 0;
    h = w(n * c);
    b = j;
    while (1) {
     if ((b | 0) >= (r | 0)) {
      break c;
     }
     d : {
      k = kb(i, b);
      s = t[k + 4 >> 2];
      if (!(s >= h ^ 1)) {
       if ((b | 0) != (j | 0)) {
        break d;
       }
       c = w(w(h / s) * t[k >> 2]);
       break c;
      }
      b = b + 1 | 0;
      continue;
     }
     break;
    }
    r = b + -1 | 0;
    c = t[kb(i, r) + 4 >> 2];
    s = t[k + 4 >> 2];
    c = Mh(t[kb(i, r) >> 2], t[k >> 2], w(w(h - c) / w(s - c)));
    break b;
   }
   b = j;
  }
  h = w(1);
  e : {
   if (d == w(1)) {
    break e;
   }
   i = o + u | 0;
   o = (b | 0) < (i | 0) ? i + -1 | 0 : b;
   i = a + 28 | 0;
   n = w(n * d);
   while (1) {
    h = d;
    if ((b | 0) == (o | 0)) {
     break e;
    }
    f : {
     k = kb(i, b);
     h = t[k + 4 >> 2];
     if (!(h >= n ^ 1)) {
      if ((b | 0) != (j | 0)) {
       break f;
      }
      h = w(w(n / h) * t[k >> 2]);
      break e;
     }
     b = b + 1 | 0;
     continue;
    }
    break;
   }
   b = b + -1 | 0;
   d = t[kb(i, b) + 4 >> 2];
   h = t[k + 4 >> 2];
   h = Mh(t[kb(i, b) >> 2], t[k >> 2], w(w(n - d) / w(h - d)));
  }
  j = g + 48 | 0;
  b = g;
  while (1) {
   b = gb(b) + 8 | 0;
   if ((j | 0) != (b | 0)) {
    continue;
   }
   break;
  }
  a = a + 16 | 0;
  b = kb(a, q[l + 1 | 0] + -1 | 0);
  j = kb(a, q[l + 1 | 0]);
  i = kb(a, q[l + 1 | 0] + 1 | 0);
  a = kb(a, q[l + 1 | 0] + 2 | 0);
  if (c == w(0)) {
   Qd(b, j, i, a, h, g);
   if (e) {
    x = f, y = t[Ja(b, 0) >> 2], z = t[Ja(b, 1) >> 2], v = p[p[f >> 2] + 20 >> 2], m[v](x | 0, w(y), w(z));
   }
   c = t[Ja(g, 0) >> 2];
   d = t[Ja(g, 1) >> 2];
   a = g + 24 | 0;
   h = t[Ja(a, 0) >> 2];
   n = t[Ja(a, 1) >> 2];
   a = g + 40 | 0;
   x = f, z = c, y = d, A = h, B = n, C = t[Ja(a, 0) >> 2], D = t[Ja(a, 1) >> 2], v = p[p[f >> 2] + 28 >> 2], m[v](x | 0, w(z), w(y), w(A), w(B), w(C), w(D));
   break a;
  }
  Qd(b, j, i, a, c, g);
  if (e) {
   b = g + 40 | 0;
   x = f, D = t[Ja(b, 0) >> 2], C = t[Ja(b, 1) >> 2], v = p[p[f >> 2] + 20 >> 2], m[v](x | 0, w(D), w(C));
  }
  if (h == w(1)) {
   b = g + 32 | 0;
   c = t[Ja(b, 0) >> 2];
   d = t[Ja(b, 1) >> 2];
   b = g + 16 | 0;
   x = f, C = c, D = d, B = t[Ja(b, 0) >> 2], A = t[Ja(b, 1) >> 2], y = t[Ja(a, 0) >> 2], z = t[Ja(a, 1) >> 2], v = p[p[f >> 2] + 28 >> 2], m[v](x | 0, w(C), w(D), w(B), w(A), w(y), w(z));
   break a;
  }
  b = g + 40 | 0;
  Qd(b, g + 32 | 0, g + 16 | 0, a, w(w(h - c) / w(w(1) - c)), g);
  a = g + 24 | 0;
  x = f, z = t[Ja(g, 0) >> 2], y = t[Ja(g, 1) >> 2], A = t[Ja(a, 0) >> 2], B = t[Ja(a, 1) >> 2], D = t[Ja(b, 0) >> 2], C = t[Ja(b, 1) >> 2], v = p[p[f >> 2] + 28 >> 2], m[v](x | 0, w(z), w(y), w(A), w(B), w(D), w(C));
 }
 sa = g - -64 | 0;
}
function pu(a, b) {
 var c = 0, d = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, p = 0;
 h(+b);
 d = e(1) | 0;
 o = e(0) | 0;
 m = d;
 a : {
  c = o;
  d = d << 1 | c >>> 31;
  k = c << 1;
  c = d;
  d = m & 2147483647;
  if (!(!(k | c) | ((d | 0) == 2146435072 & o >>> 0 > 0 | d >>> 0 > 2146435072))) {
   h(+a);
   d = e(1) | 0;
   j = e(0) | 0;
   p = d;
   l = d >>> 20 & 2047;
   if ((l | 0) != 2047) {
    break a;
   }
  }
  a = a * b;
  return a / a;
 }
 i = j;
 n = i << 1;
 d = p << 1 | i >>> 31;
 i = d;
 if ((c | 0) == (d | 0) & n >>> 0 > k >>> 0 | d >>> 0 > c >>> 0) {
  n = m >>> 20 & 2047;
  b : {
   if (!l) {
    l = 0;
    c = p << 12 | j >>> 20;
    i = j << 12;
    d = c;
    if ((c | 0) > 0 ? 1 : (c | 0) >= 0 ? i >>> 0 >= 0 : 0) {
     while (1) {
      l = l + -1 | 0;
      c = d << 1 | i >>> 31;
      i = i << 1;
      d = c;
      if ((c | 0) > -1) {
       continue;
      }
      break;
     }
    }
    d = p;
    c = 1 - l | 0;
    i = c & 31;
    if (32 <= (c & 63) >>> 0) {
     c = j << i;
     i = 0;
    } else {
     c = (1 << i) - 1 & j >>> 32 - i | d << i;
     i = j << i;
    }
    d = c;
    break b;
   }
   i = j;
   d = p & 1048575 | 1048576;
  }
  c : {
   if (!n) {
    n = 0;
    j = o;
    k = j << 12;
    c = m << 12 | j >>> 20;
    j = c;
    if ((c | 0) > 0 ? 1 : (c | 0) >= 0 ? k >>> 0 >= 0 : 0) {
     while (1) {
      n = n + -1 | 0;
      c = j << 1 | k >>> 31;
      k = k << 1;
      j = c;
      if ((c | 0) > -1) {
       continue;
      }
      break;
     }
    }
    k = o;
    c = 1 - n | 0;
    j = c & 31;
    if (32 <= (c & 63) >>> 0) {
     c = k << j;
     o = 0;
    } else {
     c = (1 << j) - 1 & k >>> 32 - j | m << j;
     o = k << j;
    }
    j = c;
    break c;
   }
   j = m & 1048575 | 1048576;
  }
  c = o;
  k = j;
  if ((l | 0) > (n | 0)) {
   while (1) {
    d : {
     j = i;
     m = d - ((j >>> 0 < c >>> 0) + k | 0) | 0;
     o = j - c | 0;
     j = m;
     if ((j | 0) < 0 ? 1 : (j | 0) <= 0 ? o >>> 0 < 0 : 0) {
      break d;
     }
     i = o;
     d = j;
     if (i | d) {
      break d;
     }
     return a * 0;
    }
    d = d << 1 | i >>> 31;
    i = i << 1;
    l = l + -1 | 0;
    if ((l | 0) > (n | 0)) {
     continue;
    }
    break;
   }
   l = n;
  }
  e : {
   j = d - ((i >>> 0 < c >>> 0) + k | 0) | 0;
   m = i - c | 0;
   c = j;
   if ((c | 0) < 0 ? 1 : (c | 0) <= 0 ? m >>> 0 < 0 : 0) {
    break e;
   }
   i = m;
   d = c;
   if (i | c) {
    break e;
   }
   return a * 0;
  }
  f : {
   if (d >>> 0 > 1048575) {
    k = i;
    j = d;
    break f;
   }
   while (1) {
    l = l + -1 | 0;
    m = (d | 0) == 524288 & i >>> 0 < 0 | d >>> 0 < 524288;
    c = i;
    d = d << 1 | c >>> 31;
    k = c << 1;
    j = d;
    i = k;
    if (m) {
     continue;
    }
    break;
   }
  }
  m = 0;
  p = p & -2147483648;
  if ((l | 0) >= 1) {
   c = j + -1048576 | 0;
   i = k;
   c = l << 20 | (i >>> 0 < 0 ? c + 1 | 0 : c);
  } else {
   i = k;
   c = 1 - l | 0;
   d = c & 31;
   if (32 <= (c & 63) >>> 0) {
    c = 0;
    i = j >>> d | 0;
   } else {
    c = j >>> d | 0;
    i = ((1 << d) - 1 & j) << 32 - d | i >>> d;
   }
  }
  f(0, i | m);
  f(1, c | p);
  return +g();
 }
 return (k | 0) == (n | 0) & (c | 0) == (i | 0) ? a * 0 : a;
}
function Ru(a, b, c) {
 a : {
  switch (b + -7 | 0) {
  case 133:
   if (t[a + 16 >> 2] != c) {
    t[a + 16 >> 2] = c;
    m[p[p[a >> 2] + 36 >> 2]](a);
   }
   return;
  case 56:
   if (t[a + 4 >> 2] != c) {
    t[a + 4 >> 2] = c;
    m[p[p[a >> 2] + 32 >> 2]](a);
   }
   return;
  case 57:
   if (t[a + 8 >> 2] != c) {
    t[a + 8 >> 2] = c;
    m[p[p[a >> 2] + 36 >> 2]](a);
   }
   return;
  case 58:
   bj(a, c);
   return;
  case 59:
   if (t[a + 16 >> 2] != c) {
    t[a + 16 >> 2] = c;
    m[p[p[a >> 2] + 44 >> 2]](a);
   }
   return;
  case 150:
   bj(a, c);
   return;
  case 63:
   if (t[a + 24 >> 2] != c) {
    t[a + 24 >> 2] = c;
    m[p[p[a >> 2] + 52 >> 2]](a);
   }
   return;
  case 51:
   if (t[a + 24 >> 2] != c) {
    t[a + 24 >> 2] = c;
    m[p[p[a >> 2] + 44 >> 2]](a);
   }
   return;
  case 40:
   if (t[a + 56 >> 2] != c) {
    t[a + 56 >> 2] = c;
    m[p[p[a >> 2] + 68 >> 2]](a);
   }
   return;
  case 6:
   Zd(a, c);
   return;
  case 7:
   Yi(a, c);
   return;
  case 74:
   Xi(a, c);
   return;
  case 13:
   if (t[a + 152 >> 2] != c) {
    t[a + 152 >> 2] = c;
    m[p[p[a >> 2] + 104 >> 2]](a);
   }
   return;
  case 14:
   if (t[a + 156 >> 2] != c) {
    t[a + 156 >> 2] = c;
    m[p[p[a >> 2] + 108 >> 2]](a);
   }
   return;
  case 116:
   if (t[a + 160 >> 2] != c) {
    t[a + 160 >> 2] = c;
    m[p[p[a >> 2] + 112 >> 2]](a);
   }
   return;
  case 117:
   if (t[a + 164 >> 2] != c) {
    t[a + 164 >> 2] = c;
    m[p[p[a >> 2] + 116 >> 2]](a);
   }
   return;
  case 24:
   if (t[a + 168 >> 2] != c) {
    t[a + 168 >> 2] = c;
    m[p[p[a >> 2] + 120 >> 2]](a);
   }
   return;
  case 119:
   if (t[a + 172 >> 2] != c) {
    t[a + 172 >> 2] = c;
    m[p[p[a >> 2] + 124 >> 2]](a);
   }
   return;
  case 120:
   if (t[a + 176 >> 2] != c) {
    t[a + 176 >> 2] = c;
    m[p[p[a >> 2] + 136 >> 2]](a);
   }
   return;
  case 79:
   Xi(a, c);
   return;
  case 80:
   if (t[a + 92 >> 2] != c) {
    t[a + 92 >> 2] = c;
    m[p[p[a >> 2] + 84 >> 2]](a);
   }
   return;
  case 82:
   Zd(a, c);
   return;
  case 83:
   Wi(a, c);
   return;
  case 84:
   Vi(a, c);
   return;
  case 94:
   if (t[a + 72 >> 2] != c) {
    t[a + 72 >> 2] = c;
    m[p[p[a >> 2] + 76 >> 2]](a);
   }
  default:
   return;
  case 0:
  case 8:
  case 17:
  case 35:
  case 97:
  case 107:
   Ab(a, c);
   return;
  case 1:
  case 9:
  case 18:
  case 26:
  case 32:
  case 89:
  case 98:
  case 108:
   zb(a, c);
   return;
  case 2:
  case 10:
  case 27:
  case 90:
  case 99:
  case 109:
   Zi(a, c);
   return;
  case 3:
  case 11:
  case 19:
  case 28:
  case 91:
  case 100:
   Mc(a, c);
   return;
  case 4:
  case 39:
  case 92:
  case 101:
   if (t[a + 64 >> 2] != c) {
    t[a + 64 >> 2] = c;
    m[p[p[a >> 2] + 68 >> 2]](a);
   }
   return;
  case 72:
  case 75:
  case 77:
   if (t[a + 80 >> 2] != c) {
    t[a + 80 >> 2] = c;
    m[p[p[a >> 2] + 72 >> 2]](a);
   }
   return;
  case 73:
  case 76:
  case 78:
   if (t[a + 84 >> 2] != c) {
    t[a + 84 >> 2] = c;
    m[p[p[a >> 2] + 76 >> 2]](a);
   }
   return;
  case 5:
  case 93:
  case 102:
   break a;
  }
 }
 if (t[a + 68 >> 2] != c) {
  t[a + 68 >> 2] = c;
  m[p[p[a >> 2] + 72 >> 2]](a);
 }
}
function Zo(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 c = sa - 16 | 0;
 sa = c;
 e = a + 152 | 0;
 h = c, i = Oa(e), p[h + 8 >> 2] = i;
 h = c, i = Qa(e), p[h >> 2] = i;
 while (1) {
  if (Sa(c + 8 | 0, c)) {
   b = p[p[c + 8 >> 2] >> 2];
   p[b + 60 >> 2] = 0;
   p[b + 64 >> 2] = 0;
   Ra(c + 8 | 0);
   continue;
  } else {
   p[a + 176 >> 2] = 0;
   b = a + 140 | 0;
   h = c, i = Oa(b), p[h + 8 >> 2] = i;
   h = c, i = Qa(b), p[h >> 2] = i;
   while (1) {
    if (Sa(c + 8 | 0, c)) {
     b = p[p[c + 8 >> 2] >> 2];
     d = p[b + 148 >> 2];
     a : {
      if (!(!d | !p[d + 52 >> 2])) {
       d = p[d + 52 >> 2];
       if (!p[d + 60 >> 2]) {
        p[d + 60 >> 2] = b;
        p[d + 64 >> 2] = b;
        p[b + 152 >> 2] = 0;
        p[b + 156 >> 2] = 0;
        break a;
       }
       f = p[d + 64 >> 2];
       p[f + 156 >> 2] = b;
       p[b + 152 >> 2] = f;
       p[d + 64 >> 2] = b;
       p[b + 156 >> 2] = 0;
       break a;
      }
      p[b + 156 >> 2] = 0;
      p[b + 152 >> 2] = g;
      b : {
       if (!g) {
        p[a + 176 >> 2] = b;
        break b;
       }
       p[g + 156 >> 2] = b;
      }
      g = b;
     }
     Ra(c + 8 | 0);
     continue;
    } else {
     h = c, i = Oa(e), p[h + 8 >> 2] = i;
     h = c, i = Qa(e), p[h >> 2] = i;
     while (1) {
      if (Sa(c + 8 | 0, c)) {
       b = p[p[c + 8 >> 2] >> 2];
       c : {
        if (!p[b + 60 >> 2]) {
         break c;
        }
        d = p[b + 56 >> 2];
        d : {
         switch (p[b + 52 >> 2] & 255) {
         case 0:
          e = p[d + 152 >> 2];
          if (e) {
           f = p[b + 60 >> 2];
           p[e + 156 >> 2] = f;
           p[f + 152 >> 2] = e;
          }
          if ((d | 0) == p[a + 176 >> 2]) {
           p[a + 176 >> 2] = p[b + 60 >> 2];
          }
          b = p[b + 64 >> 2];
          p[d + 152 >> 2] = b;
          p[b + 156 >> 2] = d;
          break c;
         case 1:
          break d;
         default:
          break c;
         }
        }
        e = p[d + 156 >> 2];
        if (e) {
         f = p[b + 64 >> 2];
         p[e + 152 >> 2] = f;
         p[f + 156 >> 2] = e;
        }
        g = (d | 0) == (g | 0) ? p[b + 64 >> 2] : g;
        b = p[b + 60 >> 2];
        p[d + 156 >> 2] = b;
        p[b + 152 >> 2] = d;
       }
       Ra(c + 8 | 0);
       continue;
      }
      break;
     }
     p[a + 176 >> 2] = g;
     sa = c + 16 | 0;
    }
    break;
   }
  }
  break;
 }
}
function Pb(a, b, c) {
 var d = 0, e = 0, f = 0;
 if (c >>> 0 >= 512) {
  ba(a | 0, b | 0, c | 0) | 0;
  return a;
 }
 e = a + c | 0;
 a : {
  if (!((a ^ b) & 3)) {
   b : {
    if ((c | 0) < 1) {
     c = a;
     break b;
    }
    if (!(a & 3)) {
     c = a;
     break b;
    }
    c = a;
    while (1) {
     n[c | 0] = q[b | 0];
     b = b + 1 | 0;
     c = c + 1 | 0;
     if (c >>> 0 >= e >>> 0) {
      break b;
     }
     if (c & 3) {
      continue;
     }
     break;
    }
   }
   d = e & -4;
   c : {
    if (d >>> 0 < 64) {
     break c;
    }
    f = d + -64 | 0;
    if (c >>> 0 > f >>> 0) {
     break c;
    }
    while (1) {
     p[c >> 2] = p[b >> 2];
     p[c + 4 >> 2] = p[b + 4 >> 2];
     p[c + 8 >> 2] = p[b + 8 >> 2];
     p[c + 12 >> 2] = p[b + 12 >> 2];
     p[c + 16 >> 2] = p[b + 16 >> 2];
     p[c + 20 >> 2] = p[b + 20 >> 2];
     p[c + 24 >> 2] = p[b + 24 >> 2];
     p[c + 28 >> 2] = p[b + 28 >> 2];
     p[c + 32 >> 2] = p[b + 32 >> 2];
     p[c + 36 >> 2] = p[b + 36 >> 2];
     p[c + 40 >> 2] = p[b + 40 >> 2];
     p[c + 44 >> 2] = p[b + 44 >> 2];
     p[c + 48 >> 2] = p[b + 48 >> 2];
     p[c + 52 >> 2] = p[b + 52 >> 2];
     p[c + 56 >> 2] = p[b + 56 >> 2];
     p[c + 60 >> 2] = p[b + 60 >> 2];
     b = b - -64 | 0;
     c = c - -64 | 0;
     if (c >>> 0 <= f >>> 0) {
      continue;
     }
     break;
    }
   }
   if (c >>> 0 >= d >>> 0) {
    break a;
   }
   while (1) {
    p[c >> 2] = p[b >> 2];
    b = b + 4 | 0;
    c = c + 4 | 0;
    if (c >>> 0 < d >>> 0) {
     continue;
    }
    break;
   }
   break a;
  }
  if (e >>> 0 < 4) {
   c = a;
   break a;
  }
  d = e + -4 | 0;
  if (d >>> 0 < a >>> 0) {
   c = a;
   break a;
  }
  c = a;
  while (1) {
   n[c | 0] = q[b | 0];
   n[c + 1 | 0] = q[b + 1 | 0];
   n[c + 2 | 0] = q[b + 2 | 0];
   n[c + 3 | 0] = q[b + 3 | 0];
   b = b + 4 | 0;
   c = c + 4 | 0;
   if (c >>> 0 <= d >>> 0) {
    continue;
   }
   break;
  }
 }
 if (c >>> 0 < e >>> 0) {
  while (1) {
   n[c | 0] = q[b | 0];
   b = b + 1 | 0;
   c = c + 1 | 0;
   if ((e | 0) != (c | 0)) {
    continue;
   }
   break;
  }
 }
 return a;
}
function Ww(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 a : {
  b : {
   c : {
    d : {
     e : {
      f : {
       g : {
        h : {
         i : {
          e = b;
          if (b) {
           d = c;
           if (!d) {
            break i;
           }
           break h;
          }
          a = (a >>> 0) / (c >>> 0) | 0;
          ta = 0;
          return a;
         }
         if (!a) {
          break g;
         }
         break f;
        }
        if (!(d + -1 & d)) {
         break e;
        }
        i = (y(d) + 33 | 0) - y(e) | 0;
        g = 0 - i | 0;
        break c;
       }
       a = (e >>> 0) / 0 | 0;
       ta = 0;
       return a;
      }
      d = 32 - y(e) | 0;
      if (d >>> 0 < 31) {
       break d;
      }
      break b;
     }
     if ((d | 0) == 1) {
      break a;
     }
     if (d) {
      d = 31 - y(d + -1 ^ d) | 0;
     } else {
      d = 32;
     }
     c = d & 31;
     if (32 <= (d & 63) >>> 0) {
      e = 0;
      a = b >>> c | 0;
     } else {
      e = b >>> c | 0;
      a = ((1 << c) - 1 & b) << 32 - c | a >>> c;
     }
     ta = e;
     return a;
    }
    i = d + 1 | 0;
    g = 63 - d | 0;
   }
   d = b;
   e = i & 63;
   f = e & 31;
   if (32 <= e >>> 0) {
    e = 0;
    f = d >>> f | 0;
   } else {
    e = d >>> f | 0;
    f = ((1 << f) - 1 & d) << 32 - f | a >>> f;
   }
   g = g & 63;
   d = g & 31;
   if (32 <= g >>> 0) {
    b = a << d;
    a = 0;
   } else {
    b = (1 << d) - 1 & a >>> 32 - d | b << d;
    a = a << d;
   }
   if (i) {
    d = -1;
    g = c + -1 | 0;
    if ((g | 0) != -1) {
     d = 0;
    }
    while (1) {
     h = f << 1 | b >>> 31;
     j = h;
     e = e << 1 | f >>> 31;
     h = d - (e + (g >>> 0 < h >>> 0) | 0) >> 31;
     k = c & h;
     f = j - k | 0;
     e = e - (j >>> 0 < k >>> 0) | 0;
     b = b << 1 | a >>> 31;
     a = l | a << 1;
     h = h & 1;
     l = h;
     i = i + -1 | 0;
     if (i) {
      continue;
     }
     break;
    }
   }
   ta = b << 1 | a >>> 31;
   return h | a << 1;
  }
  a = 0;
  b = 0;
 }
 ta = b;
 return a;
}
function eo(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 h = sa - 32 | 0;
 sa = h;
 k = a + 4 | 0;
 g = h + 8 | 0;
 Le(g);
 a : {
  b : {
   while (1) {
    if (p[b >> 2] == p[b + 4 >> 2]) {
     d = 1;
    } else {
     d = q[b + 8 | 0];
    }
    if (!d) {
     e = bo(b, c);
     if (!e) {
      e = zc(g, 1);
      if (!e) {
       break b;
      }
      vi(e, 0);
      continue;
     }
     f = 0;
     c : {
      d : {
       e : {
        f : {
         g : {
          j = m[p[p[e >> 2] + 8 >> 2]](e) | 0;
          switch (j + -25 | 0) {
          case 6:
           break f;
          case 2:
          case 3:
          case 4:
          case 5:
           break c;
          case 1:
           break d;
          case 0:
           break e;
          default:
           break g;
          }
         }
         if ((j | 0) != 1) {
          break c;
         }
         f = La(8);
         d = f;
         Xd(d);
         p[d + 4 >> 2] = e;
         p[d >> 2] = 2632;
         break c;
        }
        f = La(8);
        d = f;
        Xd(d);
        p[d + 4 >> 2] = e;
        p[d >> 2] = 2712;
        break c;
       }
       f = La(8);
       d = f;
       Xd(d);
       p[d + 4 >> 2] = e;
       p[d >> 2] = 2672;
       break c;
      }
      i = zc(g, 31);
      if (!i) {
       break b;
      }
      f = La(12);
      d = f;
      i = p[i + 4 >> 2];
      Xd(d);
      p[d + 8 >> 2] = e;
      p[d + 4 >> 2] = i;
      p[d >> 2] = 2692;
     }
     if (ao(g, j, f)) {
      break b;
     }
     if (m[p[p[e >> 2] + 28 >> 2]](e, g) | 0) {
      continue;
     }
     f = m[p[p[e >> 2] + 8 >> 2]](e) | 0;
     if ((f | 0) != 1) {
      if ((f | 0) != 23) {
       continue;
      }
      p[a >> 2] = e;
     } else {
      p[h + 4 >> 2] = e;
      Xg(k, h + 4 | 0);
     }
     continue;
    }
    break;
   }
   a = (($n(g) | 0) != 0) << 1;
   break a;
  }
  a = 2;
 }
 _n(g);
 sa = h + 32 | 0;
 return a;
}
function Cu(a, b, c, d) {
 var e = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0;
 i = sa - 32 | 0;
 sa = i;
 e = d & 2147483647;
 k = e;
 e = e + -1006698496 | 0;
 j = c;
 h = c;
 if (c >>> 0 < 0) {
  e = e + 1 | 0;
 }
 l = h;
 h = e;
 e = k + -1140785152 | 0;
 m = j;
 if (j >>> 0 < 0) {
  e = e + 1 | 0;
 }
 a : {
  if ((e | 0) == (h | 0) & l >>> 0 < m >>> 0 | h >>> 0 < e >>> 0) {
   e = d << 4 | c >>> 28;
   c = c << 4 | b >>> 28;
   b = b & 268435455;
   j = b;
   if ((b | 0) == 134217728 & a >>> 0 >= 1 | b >>> 0 > 134217728) {
    e = e + 1073741824 | 0;
    a = c + 1 | 0;
    if (a >>> 0 < 1) {
     e = e + 1 | 0;
    }
    h = a;
    break a;
   }
   h = c;
   e = e - ((c >>> 0 < 0) + -1073741824 | 0) | 0;
   if (a | j ^ 134217728) {
    break a;
   }
   a = h + (h & 1) | 0;
   if (a >>> 0 < h >>> 0) {
    e = e + 1 | 0;
   }
   h = a;
   break a;
  }
  if (!(!j & (k | 0) == 2147418112 ? !(a | b) : (k | 0) == 2147418112 & j >>> 0 < 0 | k >>> 0 < 2147418112)) {
   e = d << 4 | c >>> 28;
   h = c << 4 | b >>> 28;
   e = e & 524287 | 2146959360;
   break a;
  }
  h = 0;
  e = 2146435072;
  if (k >>> 0 > 1140785151) {
   break a;
  }
  e = 0;
  j = k >>> 16 | 0;
  if (j >>> 0 < 15249) {
   break a;
  }
  e = d & 65535 | 65536;
  Bu(i + 16 | 0, a, b, c, e, j + -15233 | 0);
  Du(i, a, b, c, e, 15361 - j | 0);
  c = p[i + 4 >> 2];
  a = p[i + 8 >> 2];
  e = p[i + 12 >> 2] << 4 | a >>> 28;
  h = a << 4 | c >>> 28;
  a = c & 268435455;
  c = a;
  b = p[i >> 2] | ((p[i + 16 >> 2] | p[i + 24 >> 2]) != 0 | (p[i + 20 >> 2] | p[i + 28 >> 2]) != 0);
  if ((a | 0) == 134217728 & b >>> 0 >= 1 | a >>> 0 > 134217728) {
   a = h + 1 | 0;
   if (a >>> 0 < 1) {
    e = e + 1 | 0;
   }
   h = a;
   break a;
  }
  if (b | c ^ 134217728) {
   break a;
  }
  a = h + (h & 1) | 0;
  if (a >>> 0 < h >>> 0) {
   e = e + 1 | 0;
  }
  h = a;
 }
 sa = i + 32 | 0;
 f(0, h | 0);
 f(1, d & -2147483648 | e);
 return +g();
}
function bf(a, b, c, d, e) {
 var f = 0, g = 0, h = 0, i = 0, j = 0, k = w(0), l = w(0), n = w(0), o = 0, r = 0, s = 0, u = w(0), v = w(0), x = w(0), y = w(0), z = w(0), A = w(0);
 while (1) {
  f = a - -64 | 0;
  if (!ff(f)) {
   a = p[p[f >> 2] >> 2];
   continue;
  }
  break;
 }
 a : {
  if (b == c) {
   break a;
  }
  o = a + 40 | 0;
  f = qc(o);
  i = (f | 0) > 0 ? f : 0;
  h = a + 52 | 0;
  while (1) {
   if ((g | 0) == (i | 0)) {
    break a;
   }
   k = t[Pa(h, g) >> 2];
   n = w(l + k);
   if (!(n > b)) {
    g = g + 1 | 0;
    l = n;
    continue;
   }
   break;
  }
  if ((g | 0) == -1) {
   break a;
  }
  i = f + -1 | 0;
  n = w(w(b - l) / k);
  j = (f | 0) > (g | 0) ? f : g;
  f = g;
  while (1) {
   b : {
    c : {
     if ((f | 0) == (j | 0)) {
      f = i;
      b = w(1);
      break c;
     }
     k = t[Pa(h, f) >> 2];
     b = w(l + k);
     if (b >= c ^ 1) {
      break b;
     }
     b = w(w(c - l) / k);
    }
    c = Yh(n);
    b = Yh(b);
    if ((f | 0) == (g | 0)) {
     af(a, g, c, b, d, e);
     return;
    }
    af(a, g, c, w(1), d, e);
    i = a + 16 | 0;
    while (1) {
     g = g + 1 | 0;
     if ((g | 0) >= (f | 0)) {
      af(a, f, w(0), b, 0, e);
      break a;
     }
     h = Nh(o, g);
     j = q[h | 0];
     d = kb(i, q[h + 1 | 0]);
     if (j) {
      j = kb(i, q[h + 1 | 0] + 1 | 0);
      h = kb(i, q[h + 1 | 0] + 2 | 0);
      s = e, u = t[Ja(d, 0) >> 2], v = t[Ja(d, 1) >> 2], x = t[Ja(j, 0) >> 2], y = t[Ja(j, 1) >> 2], z = t[Ja(h, 0) >> 2], A = t[Ja(h, 1) >> 2], r = p[p[e >> 2] + 28 >> 2], m[r](s | 0, w(u), w(v), w(x), w(y), w(z), w(A));
     } else {
      s = e, A = t[Ja(d, 0) >> 2], z = t[Ja(d, 1) >> 2], r = p[p[e >> 2] + 24 >> 2], m[r](s | 0, w(A), w(z));
     }
     continue;
    }
   }
   f = f + 1 | 0;
   l = b;
   continue;
  }
 }
}
function nr(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = w(0), j = 0, k = 0, l = w(0), m = 0, o = 0, r = 0, s = 0, u = w(0);
 c = sa - 32 | 0;
 sa = c;
 a : {
  b : {
   h = a + 52 | 0;
   if (ff(h)) {
    break b;
   }
   if (!lr(b, a + 80 | 0)) {
    break b;
   }
   i = t[a + 76 >> 2];
   break a;
  }
  e = p[b + 4 >> 2];
  p[a + 80 >> 2] = p[b >> 2];
  p[a + 84 >> 2] = e;
  e = p[b + 20 >> 2];
  p[a + 96 >> 2] = p[b + 16 >> 2];
  p[a + 100 >> 2] = e;
  e = p[b + 12 >> 2];
  p[a + 88 >> 2] = p[b + 8 >> 2];
  p[a + 92 >> 2] = e;
  Rd(h);
  e = a + 28 | 0;
  gf(e);
  j = a + 16 | 0;
  f = a + 4 | 0;
  kr(j, lb(f));
  g = lb(f);
  g = (g | 0) > 0 ? g : 0;
  while (1) {
   if ((d | 0) == (g | 0)) {
    d = kb(j, 0);
    b = a + 40 | 0;
    r = c, s = Oa(b), p[r + 24 >> 2] = s;
    r = c, s = Qa(b), p[r + 16 >> 2] = s;
    b = 1;
    while (1) {
     if (Sa(c + 24 | 0, c + 16 | 0)) {
      f = p[c + 24 >> 2];
      c : {
       if (!q[f | 0]) {
        k = d;
        d = kb(j, b);
        r = c, u = pi(k, d), t[r + 12 >> 2] = u;
        Hb(h, c + 12 | 0);
        l = t[c + 12 >> 2];
        b = b + 1 | 0;
        break c;
       }
       g = lb(e);
       n[f | 0] = g + 1;
       k = d;
       m = d + 8 | 0;
       o = d + 16 | 0;
       d = d + 24 | 0;
       r = c, u = ef(k, m, o, d, w(0), w(0), w(1), e), t[r + 12 >> 2] = u;
       Hb(h, c + 12 | 0);
       l = t[c + 12 >> 2];
       r = f, s = lb(e) - g | 0, n[r + 2 | 0] = s;
       b = b + 3 | 0;
      }
      i = w(i + l);
      p[c + 24 >> 2] = p[c + 24 >> 2] + 3;
      continue;
     } else {
      t[a + 76 >> 2] = i;
     }
     break;
    }
   } else {
    uf(kb(j, d), kb(f, d), b);
    d = d + 1 | 0;
    continue;
   }
   break;
  }
 }
 sa = c + 32 | 0;
 return i;
}
function ag(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = w(0), f = w(0), g = w(0), h = 0, i = 0, j = 0, k = w(0), l = 0, n = 0;
 h = sa - 16 | 0;
 sa = h;
 c = p[a + 72 >> 2];
 if (!c) {
  i = b - -64 | 0;
  c = p[a + 68 >> 2];
  m[p[p[c >> 2] + 8 >> 2]](c);
  f = cj(w(cj(t[a + 56 >> 2]) + w(1)));
  a : {
   b : {
    switch (p[a + 60 >> 2] + -1 | 0) {
    case 0:
     d = t[b + 76 >> 2];
     g = w(d * w(f + t[a + 52 >> 2]));
     f = w(d * w(f + t[a + 48 >> 2]));
     b = g < f;
     e = b ? g : f;
     c = e > d;
     e = c ? w(e - d) : e;
     f = b ? f : g;
     d = c ? w(f - d) : f;
     c = 0;
     b = ab(i);
     while (1) {
      if (d > w(0) ^ 1) {
       break a;
      }
      j = p[Pa(i, (c | 0) % (b | 0) | 0) >> 2];
      f = t[j + 76 >> 2];
      c : {
       if (!(e < f ^ 1)) {
        bf(j, e, d, 1, p[a + 68 >> 2]);
        e = w(0);
        break c;
       }
       e = w(e - f);
      }
      c = c + 1 | 0;
      d = w(d - f);
      continue;
     }
    case 1:
     break b;
    default:
     break a;
    }
   }
   l = h, n = Oa(i), p[l + 8 >> 2] = n;
   l = h, n = Qa(i), p[l >> 2] = n;
   while (1) {
    if (!Sa(h + 8 | 0, h)) {
     break a;
    }
    b = p[p[h + 8 >> 2] >> 2];
    e = t[b + 76 >> 2];
    d = w(e * w(f + t[a + 52 >> 2]));
    g = w(e * w(f + t[a + 48 >> 2]));
    c = d < g;
    k = c ? g : d;
    g = c ? d : g;
    c = g > e;
    d = c ? w(k - e) : k;
    bf(b, c ? w(g - e) : g, d, 1, p[a + 68 >> 2]);
    while (1) {
     if (!(d > e ^ 1)) {
      d = w(d - e);
      bf(b, w(0), d, 0, p[a + 68 >> 2]);
      continue;
     }
     break;
    }
    Ra(h + 8 | 0);
    continue;
   }
  }
  c = p[a + 68 >> 2];
  p[a + 72 >> 2] = c;
 }
 sa = h + 16 | 0;
 return c | 0;
}
function uo(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 i = Ee(Va(b), p[c >> 2]);
 f = wb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = _a(i, f);
   g = p[Pa(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((_a(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!Ed(jb(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  to(e + 16 | 0, b, i, d);
  c = p[Va(b) >> 2];
  d = b;
  if (!(w(t[jb(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = jc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Va(b) >> 2] + 1 >>> 0) / t[jb(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   so(b, p[Fb(e + 12 | 0, e + 8 | 0) >> 2]);
   f = wb(b);
   h = _a(i, f);
  }
  c = p[Pa(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[b + 8 >> 2] = p[e + 16 >> 2];
    k = Pa(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Pa(b, _a(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = Gd(e + 16 | 0);
  b = Va(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  c = e + 16 | 0;
  b = p[c >> 2];
  p[c >> 2] = 0;
  if (b) {
   q[sb(c) + 4 | 0];
   if (b) {
    Ua(b);
   }
  }
 }
 Fd(a, db(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function Wu(a, b) {
 var c = w(0);
 a : {
  switch (b + -7 | 0) {
  case 133:
   return t[a + 16 >> 2];
  case 56:
   return t[a + 4 >> 2];
  case 57:
   return t[a + 8 >> 2];
  case 58:
   return t[a + 12 >> 2];
  case 59:
   return t[a + 16 >> 2];
  case 150:
   return t[a + 12 >> 2];
  case 63:
   return t[a + 24 >> 2];
  case 51:
   return t[a + 24 >> 2];
  case 74:
   return t[a + 88 >> 2];
  case 13:
   return t[a + 152 >> 2];
  case 14:
   return t[a + 156 >> 2];
  case 116:
   return t[a + 160 >> 2];
  case 117:
   return t[a + 164 >> 2];
  case 24:
   return t[a + 168 >> 2];
  case 119:
   return t[a + 172 >> 2];
  case 120:
   return t[a + 176 >> 2];
  case 79:
   return t[a + 88 >> 2];
  case 80:
   return t[a + 92 >> 2];
  case 82:
   return t[a + 120 >> 2];
  case 94:
   c = t[a + 72 >> 2];
  default:
   return c;
  case 0:
  case 8:
  case 17:
  case 35:
  case 97:
  case 107:
   return t[a + 48 >> 2];
  case 1:
  case 9:
  case 18:
  case 26:
  case 32:
  case 89:
  case 98:
  case 108:
   return t[a + 52 >> 2];
  case 2:
  case 10:
  case 27:
  case 40:
  case 90:
  case 99:
  case 109:
   return t[a + 56 >> 2];
  case 3:
  case 11:
  case 19:
  case 28:
  case 91:
  case 100:
   return t[a + 60 >> 2];
  case 4:
  case 39:
  case 92:
  case 101:
   return t[a + 64 >> 2];
  case 6:
  case 83:
   return w(m[p[p[a >> 2] + 72 >> 2]](a));
  case 7:
  case 84:
   return w(m[p[p[a >> 2] + 76 >> 2]](a));
  case 72:
  case 75:
  case 77:
   return t[a + 80 >> 2];
  case 73:
  case 76:
  case 78:
   return t[a + 84 >> 2];
  case 5:
  case 93:
  case 102:
   break a;
  }
 }
 return t[a + 68 >> 2];
}
function Tn(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 Va(b);
 i = p[c >> 2];
 f = wb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = _a(i, f);
   g = p[Pa(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((_a(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!Uc(jb(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  Pg(e + 16 | 0, b, i, d);
  c = p[Va(b) >> 2];
  d = b;
  if (!(w(t[jb(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = jc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Va(b) >> 2] + 1 >>> 0) / t[jb(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   Og(b, p[Fb(e + 12 | 0, e + 8 | 0) >> 2]);
   f = wb(b);
   h = _a(i, f);
  }
  c = p[Pa(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[c >> 2] = p[e + 16 >> 2];
    k = Pa(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Pa(b, _a(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = Gd(e + 16 | 0);
  b = Va(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  Bd(e + 16 | 0);
 }
 Fd(a, db(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function Em(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 Va(b);
 i = r[c >> 1];
 f = wb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = _a(i, f);
   g = p[Pa(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((_a(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!gi(jb(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  Bm(e + 16 | 0, b, i, d);
  c = p[Va(b) >> 2];
  d = b;
  if (!(w(t[jb(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = jc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Va(b) >> 2] + 1 >>> 0) / t[jb(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   Am(b, p[Fb(e + 12 | 0, e + 8 | 0) >> 2]);
   f = wb(b);
   h = _a(i, f);
  }
  c = p[Pa(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[c >> 2] = p[e + 16 >> 2];
    k = Pa(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Pa(b, _a(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = Gd(e + 16 | 0);
  b = Va(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  Bd(e + 16 | 0);
 }
 Fd(a, db(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function $o(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 i = Qg(Va(b), c);
 f = wb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = _a(i, f);
   g = p[Pa(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((_a(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!Uc(jb(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  Pg(e + 16 | 0, b, i, d);
  c = p[Va(b) >> 2];
  d = b;
  if (!(w(t[jb(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = jc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Va(b) >> 2] + 1 >>> 0) / t[jb(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   Og(b, p[Fb(e + 12 | 0, e + 8 | 0) >> 2]);
   f = wb(b);
   h = _a(i, f);
  }
  c = p[Pa(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[c >> 2] = p[e + 16 >> 2];
    k = Pa(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Pa(b, _a(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = Gd(e + 16 | 0);
  b = Va(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  Bd(e + 16 | 0);
 }
 Fd(a, db(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function ql(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 var f = w(0), g = w(0), h = w(0), i = 0, j = w(0), k = w(0), l = w(0), n = w(0), o = w(0), q = w(0), r = w(0), s = w(0), u = w(0), v = 0, x = w(0);
 i = sa - 96 | 0;
 sa = i;
 g = w(t[Ja(e, 2) >> 2] - t[Ja(e, 0) >> 2]);
 h = w(t[Ja(e, 3) >> 2] - t[Ja(e, 1) >> 2]);
 q = t[Ja(e, 0) >> 2];
 r = t[c >> 2];
 s = t[Ja(e, 1) >> 2];
 f = w(1);
 u = t[c + 4 >> 2];
 j = w(1);
 a : {
  b : {
   c : {
    switch (b | 0) {
    case 0:
     j = w(tc(d) / g);
     f = w(sc(d) / h);
     break a;
    case 1:
     f = ti(w(tc(d) / g), w(sc(d) / h));
     break b;
    case 2:
     f = qu(w(tc(d) / g), w(sc(d) / h));
     break b;
    case 4:
     f = w(sc(d) / h);
     break b;
    case 3:
     f = w(tc(d) / g);
     break b;
    case 6:
     break c;
    default:
     break a;
    }
   }
   f = ti(w(tc(d) / g), w(sc(d) / h));
   f = f < w(1) ? f : w(1);
  }
  j = f;
 }
 b = tb(i + 72 | 0);
 k = t[Ja(d, 0) >> 2];
 l = tc(d);
 n = t[c >> 2];
 o = tc(d);
 v = Ja(b, 4), x = w(+l * .5 + +k + +w(n * o) * .5), t[v >> 2] = x;
 k = t[Ja(d, 1) >> 2];
 l = sc(d);
 n = t[c + 4 >> 2];
 o = sc(d);
 v = Ja(b, 5), x = w(+l * .5 + +k + +w(n * o) * .5), t[v >> 2] = x;
 d = tb(i + 48 | 0);
 v = Ja(d, 0), x = j, t[v >> 2] = x;
 v = Ja(d, 3), x = f, t[v >> 2] = x;
 e = tb(i + 24 | 0);
 v = Ja(e, 4), x = w(+w(-q) - +g * .5 - +w(g * r) * .5), t[v >> 2] = x;
 v = Ja(e, 5), x = w(+w(-s) - +h * .5 - +w(h * u) * .5), t[v >> 2] = x;
 c = tb(i);
 ed(c, b, d);
 ed(c, c, e);
 m[p[p[a >> 2] + 16 >> 2]](a, c);
 sa = i + 96 | 0;
}
function aj(a, b, c) {
 var d = 0;
 a : {
  if ((a | 0) == (b | 0)) {
   break a;
  }
  if ((b - a | 0) - c >>> 0 <= 0 - (c << 1) >>> 0) {
   Pb(a, b, c);
   return;
  }
  d = (a ^ b) & 3;
  b : {
   c : {
    if (a >>> 0 < b >>> 0) {
     if (d) {
      break b;
     }
     if (!(a & 3)) {
      break c;
     }
     while (1) {
      if (!c) {
       break a;
      }
      n[a | 0] = q[b | 0];
      b = b + 1 | 0;
      c = c + -1 | 0;
      a = a + 1 | 0;
      if (a & 3) {
       continue;
      }
      break;
     }
     break c;
    }
    d : {
     if (d) {
      break d;
     }
     if (a + c & 3) {
      while (1) {
       if (!c) {
        break a;
       }
       c = c + -1 | 0;
       d = c + a | 0;
       n[d | 0] = q[b + c | 0];
       if (d & 3) {
        continue;
       }
       break;
      }
     }
     if (c >>> 0 <= 3) {
      break d;
     }
     while (1) {
      c = c + -4 | 0;
      p[c + a >> 2] = p[b + c >> 2];
      if (c >>> 0 > 3) {
       continue;
      }
      break;
     }
    }
    if (!c) {
     break a;
    }
    while (1) {
     c = c + -1 | 0;
     n[c + a | 0] = q[b + c | 0];
     if (c) {
      continue;
     }
     break;
    }
    break a;
   }
   if (c >>> 0 <= 3) {
    break b;
   }
   while (1) {
    p[a >> 2] = p[b >> 2];
    b = b + 4 | 0;
    a = a + 4 | 0;
    c = c + -4 | 0;
    if (c >>> 0 > 3) {
     continue;
    }
    break;
   }
  }
  if (!c) {
   break a;
  }
  while (1) {
   n[a | 0] = q[b | 0];
   a = a + 1 | 0;
   b = b + 1 | 0;
   c = c + -1 | 0;
   if (c) {
    continue;
   }
   break;
  }
 }
}
function nq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 c = sa - 96 | 0;
 sa = c;
 a : {
  if (!ob(b, 8)) {
   break a;
  }
  b : {
   d = tp(p[a + 48 >> 2] + 160 | 0);
   if ((Vb(d, 2) | 0) != 2) {
    break b;
   }
   b = p[a + 52 >> 2];
   c : {
    if (!b) {
     h = a, i = Xc(p[a + 48 >> 2] + 160 | 0, 2), p[h + 52 >> 2] = i;
     break c;
    }
    m[p[p[b >> 2] + 8 >> 2]](b);
   }
   b = si(c + 72 | 0, cc(p[a + 48 >> 2]));
   e = tb(c + 48 | 0);
   if (!ri(e, b)) {
    qi(e);
   }
   b = Qe(p[a + 48 >> 2]);
   h = c, i = Oa(b), p[h + 40 >> 2] = i;
   h = c, i = Qa(b), p[h + 32 >> 2] = i;
   while (1) {
    if (!Sa(c + 40 | 0, c + 32 | 0)) {
     break b;
    }
    b = p[p[c + 40 >> 2] >> 2];
    f = tb(c + 8 | 0);
    ed(f, e, m[p[p[b >> 2] + 92 >> 2]](b) | 0);
    g = p[a + 52 >> 2];
    m[p[p[g >> 2] + 16 >> 2]](g, p[b + 136 >> 2], f);
    Ra(c + 40 | 0);
    continue;
   }
  }
  if ((Vb(d, 4) | 0) != 4) {
   break a;
  }
  b = p[a + 56 >> 2];
  d : {
   if (!b) {
    h = a, i = Xc(p[a + 48 >> 2] + 160 | 0, 4), p[h + 56 >> 2] = i;
    break d;
   }
   m[p[p[b >> 2] + 8 >> 2]](b);
  }
  b = Qe(p[a + 48 >> 2]);
  h = c, i = Oa(b), p[h + 72 >> 2] = i;
  h = c, i = Qa(b), p[h + 48 >> 2] = i;
  while (1) {
   if (!Sa(c + 72 | 0, c + 48 | 0)) {
    break a;
   }
   b = p[p[c + 72 >> 2] >> 2];
   e = m[p[p[b >> 2] + 92 >> 2]](b) | 0;
   d = p[a + 56 >> 2];
   m[p[p[d >> 2] + 16 >> 2]](d, p[b + 136 >> 2], e);
   Ra(c + 72 | 0);
   continue;
  }
 }
 sa = c + 96 | 0;
}
function fg(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 g = sa - 16 | 0;
 sa = g;
 d = 1;
 a : {
  b : {
   switch (b - a >> 2) {
   case 2:
    b = b + -4 | 0;
    if (!(m[p[c >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
     break a;
    }
    Wa(a, b);
    break a;
   case 3:
    Cc(a, a + 4 | 0, b + -4 | 0, c);
    break a;
   case 4:
    ke(a, a + 4 | 0, a + 8 | 0, b + -4 | 0, c);
    break a;
   case 5:
    je(a, a + 4 | 0, a + 8 | 0, a + 12 | 0, b + -4 | 0, c);
    break a;
   case 0:
   case 1:
    break a;
   default:
    break b;
   }
  }
  f = a + 8 | 0;
  Cc(a, a + 4 | 0, f, c);
  e = a + 12 | 0;
  c : {
   while (1) {
    h = (b | 0) == (e | 0);
    if (h) {
     break c;
    }
    d : {
     if (m[p[c >> 2]](p[e >> 2], p[f >> 2]) | 0) {
      p[g + 12 >> 2] = p[e >> 2];
      i = e;
      while (1) {
       e : {
        d = f;
        p[i >> 2] = p[d >> 2];
        if ((a | 0) == (d | 0)) {
         d = a;
         break e;
        }
        i = d;
        f = d + -4 | 0;
        if (m[p[c >> 2]](p[g + 12 >> 2], p[f >> 2]) | 0) {
         continue;
        }
       }
       break;
      }
      p[d >> 2] = p[g + 12 >> 2];
      j = j + 1 | 0;
      if ((j | 0) == 8) {
       break d;
      }
     }
     f = e;
     e = e + 4 | 0;
     continue;
    }
    break;
   }
   d = (e + 4 | 0) == (b | 0);
  }
  d = d | h;
 }
 sa = g + 16 | 0;
 return d & 1;
}
function Su(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 d = sa - 32 | 0;
 sa = d;
 e = p[a + 28 >> 2];
 p[d + 16 >> 2] = e;
 f = p[a + 20 >> 2];
 p[d + 28 >> 2] = c;
 p[d + 24 >> 2] = b;
 b = f - e | 0;
 p[d + 20 >> 2] = b;
 e = b + c | 0;
 j = 2;
 b = d + 16 | 0;
 a : {
  b : {
   c : {
    if (!Gf(V(p[a + 60 >> 2], d + 16 | 0, 2, d + 12 | 0) | 0)) {
     while (1) {
      f = p[d + 12 >> 2];
      if ((f | 0) == (e | 0)) {
       break c;
      }
      if ((f | 0) <= -1) {
       break b;
      }
      g = p[b + 4 >> 2];
      h = f >>> 0 > g >>> 0;
      i = (h << 3) + b | 0;
      g = f - (h ? g : 0) | 0;
      p[i >> 2] = g + p[i >> 2];
      i = (h ? 12 : 4) + b | 0;
      p[i >> 2] = p[i >> 2] - g;
      e = e - f | 0;
      b = h ? b + 8 | 0 : b;
      j = j - h | 0;
      if (!Gf(V(p[a + 60 >> 2], b | 0, j | 0, d + 12 | 0) | 0)) {
       continue;
      }
      break;
     }
    }
    p[d + 12 >> 2] = -1;
    if ((e | 0) != -1) {
     break b;
    }
   }
   b = p[a + 44 >> 2];
   p[a + 28 >> 2] = b;
   p[a + 20 >> 2] = b;
   p[a + 16 >> 2] = b + p[a + 48 >> 2];
   a = c;
   break a;
  }
  p[a + 28 >> 2] = 0;
  p[a + 16 >> 2] = 0;
  p[a + 20 >> 2] = 0;
  p[a >> 2] = p[a >> 2] | 32;
  a = 0;
  if ((j | 0) == 2) {
   break a;
  }
  a = c - p[b + 4 >> 2] | 0;
 }
 sa = d + 32 | 0;
 return a | 0;
}
function fo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 d = sa - 48 | 0;
 sa = d;
 a : {
  b : {
   while (1) {
    if ((c | 0) == 4) {
     break b;
    }
    e = c + 7659 | 0;
    c = c + 1 | 0;
    if (n[e | 0] == (wi(a) | 0)) {
     continue;
    }
    break;
   }
   c = 0;
   break a;
  }
  h = b, i = ec(a), p[h >> 2] = i;
  c = 0;
  if (q[a + 8 | 0]) {
   break a;
  }
  h = b, i = ec(a), p[h + 4 >> 2] = i;
  if (q[a + 8 | 0]) {
   break a;
  }
  h = b, i = ec(a), p[h + 8 >> 2] = i;
  if (q[a + 8 | 0]) {
   break a;
  }
  e = bb(d + 32 | 0);
  c : {
   d : {
    while (1) {
     c = ec(a);
     p[d + 24 >> 2] = c;
     if (!c) {
      break d;
     }
     Ic(e, d + 24 | 0);
     if (!q[a + 8 | 0]) {
      continue;
     }
     break;
    }
    c = 0;
    break c;
   }
   h = d, i = Oa(e), p[h + 24 >> 2] = i;
   h = d, i = Qa(e), p[h + 16 >> 2] = i;
   g = b + 12 | 0;
   b = 0;
   c = 8;
   while (1) {
    e : {
     f = Sa(d + 24 | 0, d + 16 | 0);
     if (!f) {
      break e;
     }
     p[d + 12 >> 2] = p[p[d + 24 >> 2] >> 2];
     if ((c | 0) == 8) {
      c = 0;
      b = fd(a);
     }
     h = co(g, d + 12 | 0), i = b >> c & 3, p[h >> 2] = i;
     if (q[a + 8 | 0]) {
      break e;
     }
     c = c + 2 | 0;
     Ra(d + 24 | 0);
     continue;
    }
    break;
   }
   c = f ^ 1;
  }
  ib(e);
 }
 sa = d + 48 | 0;
 return c;
}
function nt(a, b) {
 a = a | 0;
 b = w(b);
 var c = 0, d = 0, e = w(0), f = 0, g = w(0), h = 0, i = 0, j = w(0), k = w(0), l = 0, m = w(0);
 c = p[a >> 2];
 t[a + 4 >> 2] = t[a + 4 >> 2] + w(w(t[c + 24 >> 2] * b) * w(p[a + 8 >> 2]));
 d = p[c + 16 >> 2];
 b = t[a + 4 >> 2];
 f = q[c + 40 | 0] ? p[c + 32 >> 2] : f;
 g = w(d | 0);
 if (q[c + 40 | 0]) {
  d = p[c + 36 >> 2];
 } else {
  d = p[c + 20 >> 2];
 }
 b = w(b * g);
 i = 1;
 a : {
  b : {
   switch (p[c + 28 >> 2]) {
   case 0:
    e = b;
    b = w(d | 0);
    if (e > b ^ 1) {
     break a;
    }
    t[a + 4 >> 2] = b / g;
    h = 1;
    i = 0;
    break a;
   case 1:
    if (b >= w(d | 0) ^ 1) {
     break a;
    }
    l = a, m = w(w(pu(+w(w(t[a + 4 >> 2] * g) - w(f | 0)), +(d - f | 0)) + +(f | 0)) / g), t[l + 4 >> 2] = m;
    h = 1;
    break a;
   case 2:
    break b;
   default:
    break a;
   }
  }
  c = p[a + 8 >> 2];
  j = w(d | 0);
  k = w(f | 0);
  while (1) {
   c : {
    d : {
     switch (c + 1 | 0) {
     case 0:
      c = 1;
      e = k;
      if (b < e ^ 1) {
       break a;
      }
      break c;
     case 2:
      break d;
     default:
      break a;
     }
    }
    c = -1;
    e = j;
    if (b >= e ^ 1) {
     break a;
    }
   }
   p[a + 8 >> 2] = c;
   b = w(w(e - b) + e);
   t[a + 4 >> 2] = b / g;
   h = 1;
   continue;
  }
 }
 n[a + 12 | 0] = h;
 return i | 0;
}
function ah(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a + 72 >> 2] = 7040;
 p[a >> 2] = 6952;
 f = a + 92 | 0;
 g = b, h = Oa(f), p[g + 8 >> 2] = h;
 g = b, h = Qa(f), p[g >> 2] = h;
 while (1) {
  if (!Sa(b + 8 | 0, b)) {
   d = a + 104 | 0;
   g = b, h = Oa(d), p[g + 8 >> 2] = h;
   g = b, h = Qa(d), p[g >> 2] = h;
   while (1) {
    if (!Sa(b + 8 | 0, b)) {
     e = a + 116 | 0;
     g = b, h = Oa(e), p[g + 8 >> 2] = h;
     g = b, h = Qa(e), p[g >> 2] = h;
     while (1) {
      if (!Sa(b + 8 | 0, b)) {
       c = p[a + 172 >> 2];
       if (c) {
        m[p[p[c >> 2] + 4 >> 2]](c);
       }
       c = p[a + 168 >> 2];
       if (c) {
        m[p[p[c >> 2] + 4 >> 2]](c);
       }
       ib(a + 152 | 0);
       ib(a + 140 | 0);
       ib(a + 128 | 0);
       ib(e);
       ib(d);
       ib(f);
       eh(a + 76 | 0);
       hb(a);
       sa = b + 16 | 0;
       return a | 0;
      }
      c = p[p[b + 8 >> 2] >> 2];
      if (c) {
       m[p[p[c >> 2] + 4 >> 2]](c);
      }
      Ra(b + 8 | 0);
      continue;
     }
    }
    e = p[p[b + 8 >> 2] >> 2];
    if (e) {
     m[p[p[e >> 2] + 4 >> 2]](e);
    }
    Ra(b + 8 | 0);
    continue;
   }
  }
  d = p[p[b + 8 >> 2] >> 2];
  if (!((d | 0) == (a | 0) | !d)) {
   m[p[p[d >> 2] + 4 >> 2]](d);
  }
  Ra(b + 8 | 0);
  continue;
 }
}
function Gg(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 sb(a);
 a : {
  if (b) {
   d = a;
   f = b;
   if (1073741823 < b >>> 0) {
    Mb();
    E();
   }
   Ec(d, La(f << 2));
   i = sb(a), j = f, p[i >> 2] = j;
   while (1) if ((c | 0) == (f | 0)) {
    b = a + 8 | 0;
    d = p[b >> 2];
    if (!d) {
     break a;
    }
    g = _a(p[d + 4 >> 2], f);
    i = Pa(a, g), j = b, p[i >> 2] = j;
    while (1) {
     b = p[d >> 2];
     if (!b) {
      break a;
     }
     b : {
      e = _a(p[b + 4 >> 2], f);
      if ((g | 0) == (e | 0)) {
       break b;
      }
      c = b;
      if (!p[Pa(a, e) >> 2]) {
       i = Pa(a, e), j = d, p[i >> 2] = j;
       g = e;
       break b;
      }
      c : {
       while (1) {
        h = p[c >> 2];
        if (!h) {
         break c;
        }
        if (Ed(jb(a), b + 8 | 0, p[c >> 2] + 8 | 0)) {
         c = p[c >> 2];
         continue;
        }
        break;
       }
       h = p[c >> 2];
      }
      p[d >> 2] = h;
      i = c, j = p[p[Pa(a, e) >> 2] >> 2], p[i >> 2] = j;
      i = p[Pa(a, e) >> 2], j = b, p[i >> 2] = j;
      continue;
     }
     d = b;
     continue;
    }
   } else {
    i = Pa(a, c), j = 0, p[i >> 2] = j;
    c = c + 1 | 0;
    continue;
   }
  }
  Ec(a, 0);
  i = sb(a), j = 0, p[i >> 2] = j;
 }
}
function bo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 d = sa - 48 | 0;
 sa = d;
 h = ec(a);
 i = ta;
 c = Zn(h);
 a : {
  b : {
   while (1) {
    e = ec(a);
    f = ta;
    j = f;
    if (e | f) {
     if (q[a + 8 | 0]) {
      if (!c) {
       break b;
      }
      m[p[p[c >> 2] + 4 >> 2]](c);
      break b;
     }
     if (c) {
      if (m[p[p[c >> 2] + 16 >> 2]](c, e & 65535, a) | 0) {
       continue;
      }
     }
     c : {
      f = e;
      g = Yn(e);
      if ((g | 0) != -1) {
       break c;
      }
      g = Xn(b, f);
      if ((g | 0) != -1) {
       break c;
      }
      p[d + 16 >> 2] = e;
      p[d + 20 >> 2] = j;
      ae(p[4952], 7733, d + 16 | 0);
      if (!c) {
       break b;
      }
      m[p[p[c >> 2] + 4 >> 2]](c);
      break b;
     }
     d : {
      switch (g | 0) {
      case 0:
       ec(a);
       continue;
      case 1:
       td(d + 32 | 0, a);
       ub(d + 32 | 0);
       continue;
      case 2:
       Na(a);
       continue;
      case 3:
       break d;
      default:
       continue;
      }
     }
     fd(a);
     continue;
    }
    break;
   }
   if (c) {
    break a;
   }
   p[d >> 2] = h;
   p[d + 4 >> 2] = i;
   c = 0;
   ae(p[4952], 7788, d);
   break a;
  }
  c = 0;
 }
 sa = d + 48 | 0;
 return c;
}
function cj(a) {
 var b = 0, c = 0, d = 0, g = 0, h = 0;
 g = (i(a), e(2));
 c = g >>> 23 & 255;
 if ((c | 0) == 255) {
  return w(a / a);
 }
 b = g << 1;
 if (b >>> 0 > 2130706432) {
  a : {
   if (!c) {
    c = 0;
    b = g << 9;
    if ((b | 0) >= 0) {
     while (1) {
      c = c + -1 | 0;
      b = b << 1;
      if ((b | 0) > -1) {
       continue;
      }
      break;
     }
    }
    b = g << 1 - c;
    break a;
   }
   b = g & 8388607 | 8388608;
  }
  if ((c | 0) > 127) {
   while (1) {
    b : {
     d = b - 8388608 | 0;
     if ((d | 0) < 0) {
      break b;
     }
     b = d;
     if (b) {
      break b;
     }
     return w(a * w(0));
    }
    b = b << 1;
    c = c + -1 | 0;
    if ((c | 0) > 127) {
     continue;
    }
    break;
   }
   c = 127;
  }
  c : {
   d = b - 8388608 | 0;
   if ((d | 0) < 0) {
    break c;
   }
   b = d;
   if (b) {
    break c;
   }
   return w(a * w(0));
  }
  d : {
   if (b >>> 0 > 8388607) {
    d = b;
    break d;
   }
   while (1) {
    c = c + -1 | 0;
    h = b >>> 0 < 4194304;
    d = b << 1;
    b = d;
    if (h) {
     continue;
    }
    break;
   }
  }
  return f(2, g & -2147483648 | ((c | 0) >= 1 ? d + -8388608 | c << 23 : d >>> 1 - c | 0)), j();
 }
 return (b | 0) == 2130706432 ? w(a * w(0)) : a;
}
function eb(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 a : {
  if (!c) {
   break a;
  }
  d = a + c | 0;
  n[d + -1 | 0] = b;
  n[a | 0] = b;
  if (c >>> 0 < 3) {
   break a;
  }
  n[d + -2 | 0] = b;
  n[a + 1 | 0] = b;
  n[d + -3 | 0] = b;
  n[a + 2 | 0] = b;
  if (c >>> 0 < 7) {
   break a;
  }
  n[d + -4 | 0] = b;
  n[a + 3 | 0] = b;
  if (c >>> 0 < 9) {
   break a;
  }
  d = 0 - a & 3;
  e = d + a | 0;
  b = v(b & 255, 16843009);
  p[e >> 2] = b;
  c = c - d & -4;
  d = c + e | 0;
  p[d + -4 >> 2] = b;
  if (c >>> 0 < 9) {
   break a;
  }
  p[e + 8 >> 2] = b;
  p[e + 4 >> 2] = b;
  p[d + -8 >> 2] = b;
  p[d + -12 >> 2] = b;
  if (c >>> 0 < 25) {
   break a;
  }
  p[e + 24 >> 2] = b;
  p[e + 20 >> 2] = b;
  p[e + 16 >> 2] = b;
  p[e + 12 >> 2] = b;
  p[d + -16 >> 2] = b;
  p[d + -20 >> 2] = b;
  p[d + -24 >> 2] = b;
  p[d + -28 >> 2] = b;
  g = e & 4 | 24;
  c = c - g | 0;
  if (c >>> 0 < 32) {
   break a;
  }
  d = b;
  f = b;
  b = e + g | 0;
  while (1) {
   p[b + 24 >> 2] = f;
   p[b + 28 >> 2] = d;
   p[b + 16 >> 2] = f;
   p[b + 20 >> 2] = d;
   p[b + 8 >> 2] = f;
   p[b + 12 >> 2] = d;
   p[b >> 2] = f;
   p[b + 4 >> 2] = d;
   b = b + 32 | 0;
   c = c + -32 | 0;
   if (c >>> 0 > 31) {
    continue;
   }
   break;
  }
 }
 return a;
}
function lm(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = w(0), g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0, n = 0, o = w(0);
 c = sa - 32 | 0;
 sa = c;
 if (ob(b, 512)) {
  d = a + 80 | 0;
  jm(Oa(d), Qa(d));
 }
 d = ob(b, 64);
 if (!(k = !ob(b, bd(bd(256, 128), 32)), l = 0, n = !q[a + 92 | 0] | d ^ 1, n ? k : l)) {
  g = a + 68 | 0;
  b = p[g + 8 >> 2];
  d = cb(c + 24 | 0, t[a + 48 >> 2], t[a + 52 >> 2]);
  h = cb(c + 16 | 0, t[a + 56 >> 2], t[a + 60 >> 2]);
  a : {
   b : {
    if (!q[a + 92 | 0]) {
     break b;
    }
    e = p[a + 96 >> 2];
    if (!e) {
     break b;
    }
    e = cc(e);
    i = gb(c + 8 | 0);
    uf(i, d, e);
    d = gb(c);
    uf(d, h, e);
    m[p[p[a >> 2] + 76 >> 2]](a, i, d);
    break a;
   }
   m[p[p[a >> 2] + 76 >> 2]](a, d, h);
  }
  f = t[a + 64 >> 2];
  j = t[g + 4 >> 2];
  a = a + 80 | 0;
  k = c, l = Oa(a), p[k + 8 >> 2] = l;
  k = c, l = Qa(a), p[k >> 2] = l;
  f = w(f * j);
  while (1) {
   if (Sa(c + 8 | 0, c)) {
    a = p[p[c + 8 >> 2] >> 2];
    l = b, n = kg(p[a + 48 >> 2], f), o = t[a + 52 >> 2], k = p[p[b >> 2] + 32 >> 2], m[k](l | 0, n | 0, w(o));
    Ra(c + 8 | 0);
    continue;
   } else {
    m[p[p[b >> 2] + 36 >> 2]](b);
   }
   break;
  }
 }
 sa = c + 32 | 0;
}
function hj(a, b, c, d) {
 a : {
  b : {
   if (b >>> 0 > 20) {
    break b;
   }
   c : {
    switch (b + -9 | 0) {
    case 0:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     p[a >> 2] = p[b >> 2];
     return;
    case 1:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     b = p[b >> 2];
     p[a >> 2] = b;
     p[a + 4 >> 2] = b >> 31;
     return;
    case 2:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     p[a >> 2] = p[b >> 2];
     p[a + 4 >> 2] = 0;
     return;
    case 4:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     b = o[b >> 1];
     p[a >> 2] = b;
     p[a + 4 >> 2] = b >> 31;
     return;
    case 5:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     p[a >> 2] = r[b >> 1];
     p[a + 4 >> 2] = 0;
     return;
    case 6:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     b = n[b | 0];
     p[a >> 2] = b;
     p[a + 4 >> 2] = b >> 31;
     return;
    case 7:
     b = p[c >> 2];
     p[c >> 2] = b + 4;
     p[a >> 2] = q[b | 0];
     p[a + 4 >> 2] = 0;
     return;
    case 3:
    case 8:
     break a;
    case 9:
     break c;
    default:
     break b;
    }
   }
   m[d | 0](a, c);
  }
  return;
 }
 b = p[c >> 2] + 7 & -8;
 p[c >> 2] = b + 8;
 c = p[b + 4 >> 2];
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = c;
}
function pg(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 sb(a);
 a : {
  if (b) {
   Ec(a, Md(b));
   i = sb(a), j = b, p[i >> 2] = j;
   while (1) if ((b | 0) == (c | 0)) {
    d = a + 8 | 0;
    e = p[d >> 2];
    if (!e) {
     break a;
    }
    g = _a(p[e + 4 >> 2], b);
    i = Pa(a, g), j = d, p[i >> 2] = j;
    while (1) {
     d = p[e >> 2];
     if (!d) {
      break a;
     }
     b : {
      f = _a(p[d + 4 >> 2], b);
      if ((g | 0) == (f | 0)) {
       break b;
      }
      c = d;
      if (!p[Pa(a, f) >> 2]) {
       i = Pa(a, f), j = e, p[i >> 2] = j;
       g = f;
       break b;
      }
      c : {
       while (1) {
        h = p[c >> 2];
        if (!h) {
         break c;
        }
        jb(a);
        if (di(d + 8 | 0, p[c >> 2] + 8 | 0)) {
         c = p[c >> 2];
         continue;
        }
        break;
       }
       h = p[c >> 2];
      }
      p[e >> 2] = h;
      i = c, j = p[p[Pa(a, f) >> 2] >> 2], p[i >> 2] = j;
      i = p[Pa(a, f) >> 2], j = d, p[i >> 2] = j;
      continue;
     }
     e = d;
     continue;
    }
   } else {
    i = Pa(a, c), j = 0, p[i >> 2] = j;
    c = c + 1 | 0;
    continue;
   }
  }
  Ec(a, 0);
  i = sb(a), j = 0, p[i >> 2] = j;
 }
}
function Ng(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 sb(a);
 a : {
  if (b) {
   Ec(a, Md(b));
   i = sb(a), j = b, p[i >> 2] = j;
   while (1) if ((b | 0) == (c | 0)) {
    d = a + 8 | 0;
    e = p[d >> 2];
    if (!e) {
     break a;
    }
    g = _a(p[e + 4 >> 2], b);
    i = Pa(a, g), j = d, p[i >> 2] = j;
    while (1) {
     d = p[e >> 2];
     if (!d) {
      break a;
     }
     b : {
      f = _a(p[d + 4 >> 2], b);
      if ((g | 0) == (f | 0)) {
       break b;
      }
      c = d;
      if (!p[Pa(a, f) >> 2]) {
       i = Pa(a, f), j = e, p[i >> 2] = j;
       g = f;
       break b;
      }
      c : {
       while (1) {
        h = p[c >> 2];
        if (!h) {
         break c;
        }
        if (Uc(jb(a), d + 8 | 0, p[c >> 2] + 8 | 0)) {
         c = p[c >> 2];
         continue;
        }
        break;
       }
       h = p[c >> 2];
      }
      p[e >> 2] = h;
      i = c, j = p[p[Pa(a, f) >> 2] >> 2], p[i >> 2] = j;
      i = p[Pa(a, f) >> 2], j = d, p[i >> 2] = j;
      continue;
     }
     e = d;
     continue;
    }
   } else {
    i = Pa(a, c), j = 0, p[i >> 2] = j;
    c = c + 1 | 0;
    continue;
   }
  }
  Ec(a, 0);
  i = sb(a), j = 0, p[i >> 2] = j;
 }
}
function xc(a) {
 var b = w(0), c = 0, d = 0, f = 0, g = 0;
 c = sa - 16 | 0;
 sa = c;
 f = (i(a), e(2));
 d = f & 2147483647;
 a : {
  if (d >>> 0 <= 1061752794) {
   b = w(1);
   if (d >>> 0 < 964689920) {
    break a;
   }
   b = Kb(+a);
   break a;
  }
  if (d >>> 0 <= 1081824209) {
   g = +a;
   if (d >>> 0 >= 1075235812) {
    b = w(-Kb(((f | 0) > -1 ? -3.141592653589793 : 3.141592653589793) + g));
    break a;
   }
   if ((f | 0) <= -1) {
    b = Jb(g + 1.5707963267948966);
    break a;
   }
   b = Jb(1.5707963267948966 - g);
   break a;
  }
  if (d >>> 0 <= 1088565717) {
   if (d >>> 0 >= 1085271520) {
    b = Kb(((f | 0) > -1 ? -6.283185307179586 : 6.283185307179586) + +a);
    break a;
   }
   if ((f | 0) <= -1) {
    b = Jb(-4.71238898038469 - +a);
    break a;
   }
   b = Jb(+a + -4.71238898038469);
   break a;
  }
  b = w(a - a);
  if (d >>> 0 >= 2139095040) {
   break a;
  }
  b : {
   switch (lj(a, c + 8 | 0) & 3) {
   case 0:
    b = Kb(u[c + 8 >> 3]);
    break a;
   case 1:
    b = Jb(-u[c + 8 >> 3]);
    break a;
   case 2:
    b = w(-Kb(u[c + 8 >> 3]));
    break a;
   default:
    break b;
   }
  }
  b = Jb(u[c + 8 >> 3]);
 }
 a = b;
 sa = c + 16 | 0;
 return a;
}
function yc(a) {
 var b = 0, c = 0, d = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 f = (i(a), e(2));
 c = f & 2147483647;
 a : {
  if (c >>> 0 <= 1061752794) {
   if (c >>> 0 < 964689920) {
    break a;
   }
   a = Jb(+a);
   break a;
  }
  if (c >>> 0 <= 1081824209) {
   d = +a;
   if (c >>> 0 <= 1075235811) {
    if ((f | 0) <= -1) {
     a = w(-Kb(d + 1.5707963267948966));
     break a;
    }
    a = Kb(d + -1.5707963267948966);
    break a;
   }
   a = Jb(-(((f | 0) > -1 ? -3.141592653589793 : 3.141592653589793) + d));
   break a;
  }
  if (c >>> 0 <= 1088565717) {
   d = +a;
   if (c >>> 0 <= 1085271519) {
    if ((f | 0) <= -1) {
     a = Kb(d + 4.71238898038469);
     break a;
    }
    a = w(-Kb(d + -4.71238898038469));
    break a;
   }
   a = Jb(((f | 0) > -1 ? -6.283185307179586 : 6.283185307179586) + d);
   break a;
  }
  if (c >>> 0 >= 2139095040) {
   a = w(a - a);
   break a;
  }
  b : {
   switch (lj(a, b + 8 | 0) & 3) {
   case 0:
    a = Jb(u[b + 8 >> 3]);
    break a;
   case 1:
    a = Kb(u[b + 8 >> 3]);
    break a;
   case 2:
    a = Jb(-u[b + 8 >> 3]);
    break a;
   default:
    break b;
   }
  }
  a = w(-Kb(u[b + 8 >> 3]));
 }
 sa = b + 16 | 0;
 return a;
}
function bq(a, b) {
 var c = w(0), d = 0, e = w(0), f = w(0), g = w(0), h = w(0), i = w(0);
 d = 1;
 while (1) {
  a : {
   if ((d | 0) == 10) {
    c = t[a + 60 >> 2];
    break a;
   }
   c = t[((d << 2) + a | 0) + 20 >> 2];
   if (c <= b ^ 1) {
    break a;
   }
   d = d + 1 | 0;
   e = w(e + w(.10000000149011612));
   continue;
  }
  break;
 }
 f = t[((d << 2) + a | 0) + 16 >> 2];
 c = w(e + w(w(w(b - f) / w(c - f)) * w(.10000000149011612)));
 f = t[a + 4 >> 2];
 h = t[a + 12 >> 2];
 g = Rg(c, f, h);
 b : {
  if (!(g >= w(.0010000000474974513) ^ 1)) {
   d = 0;
   while (1) {
    if ((d | 0) == 4) {
     break b;
    }
    e = Rg(c, f, h);
    if (e == w(0)) {
     break b;
    }
    c = w(c - w(w(Pd(c, f, h) - b) / e));
    d = d + 1 | 0;
    continue;
   }
  }
  if (g == w(0)) {
   break b;
  }
  g = w(e + w(.10000000149011612));
  d = 0;
  while (1) {
   c = w(e + w(w(g - e) * w(.5)));
   i = w(Pd(c, f, h) - b);
   if (w(x(i)) > w(1.0000000116860974e-7) ^ 1) {
    break b;
   }
   a = i > w(0);
   g = a ? c : g;
   e = a ? e : c;
   d = d + 1 | 0;
   if ((d | 0) != 10) {
    continue;
   }
   break;
  }
 }
 return c;
}
function bs(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 c = sa - 32 | 0;
 sa = c;
 e = p[a + 20 >> 2];
 b = (b ? b + -72 | 0 : 0) + 92 | 0;
 g = c, h = Oa(b), p[g + 24 >> 2] = h;
 g = c, h = Qa(b), p[g + 16 >> 2] = h;
 f = a + 60 | 0;
 while (1) {
  a : {
   b : {
    if (Sa(c + 24 | 0, c + 16 | 0)) {
     d = p[p[c + 24 >> 2] >> 2];
     if (!d) {
      break a;
     }
     if (!tf(d)) {
      break b;
     }
     b = d;
     while (1) {
      if (!b) {
       break b;
      }
      if ((b | 0) == (e | 0)) {
       io(d, a);
       break b;
      } else {
       b = p[b + 20 >> 2];
       continue;
      }
     }
    }
    g = a, h = od(), p[g + 76 >> 2] = h;
    sa = c + 32 | 0;
    return 0;
   }
   if (!ni(d) | (d | 0) == (e | 0)) {
    break a;
   }
   b = d;
   while (1) {
    if (!b) {
     break a;
    }
    if (p[a + 72 >> 2] == (b | 0)) {
     p[c + 12 >> 2] = d;
     gh(d + 160 | 0, bd(4, 16));
     Hb(f, c + 12 | 0);
    } else {
     b = p[b + 20 >> 2];
     continue;
    }
    break;
   }
  }
  Ra(c + 24 | 0);
  continue;
 }
}
function Dr(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = 0, f = w(0), g = w(0), h = w(0), i = w(0), j = w(0), k = w(0), l = w(0), m = w(0), n = w(0);
 e = sa - 16 | 0;
 sa = e;
 if (ob(b, 8)) {
  g = t[a + 156 >> 2];
  d = t[a + 164 >> 2];
  i = t[a + 156 >> 2];
  c = a + 168 | 0;
  j = w(t[a + 152 >> 2] * w(.5));
  f = w(j - w(t[a + 160 >> 2] * t[a + 152 >> 2]));
  Ab(c, f);
  h = w(g * w(.5));
  g = w(h - w(d * i));
  d = w(g - h);
  zb(c, d);
  i = w(j * w(.5522847771644592));
  k = w(f - i);
  Td(c, cb(e + 8 | 0, k, d));
  i = w(i + f);
  Ud(c, cb(e + 8 | 0, i, d));
  c = a + 264 | 0;
  d = w(j + f);
  Ab(c, d);
  zb(c, g);
  l = w(h * w(.5522847771644592));
  m = w(g - l);
  Td(c, cb(e + 8 | 0, d, m));
  n = d;
  d = w(l + g);
  Ud(c, cb(e + 8 | 0, n, d));
  c = a + 360 | 0;
  Ab(c, f);
  h = w(h + g);
  zb(c, h);
  Td(c, cb(e + 8 | 0, i, h));
  Ud(c, cb(e + 8 | 0, k, h));
  c = a + 456 | 0;
  f = w(f - j);
  Ab(c, f);
  zb(c, g);
  Td(c, cb(e + 8 | 0, f, d));
  Ud(c, cb(e + 8 | 0, f, m));
 }
 Hc(a, b);
 sa = e + 16 | 0;
}
function Qo(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = w(0), f = w(0), g = 0, h = 0, i = 0, j = w(0);
 d = sa - 48 | 0;
 sa = d;
 m[p[p[b >> 2] + 8 >> 2]](b);
 c = p[a + 172 >> 2];
 h = b, i = m[p[p[c >> 2] + 36 >> 2]](c) | 0, g = p[p[b >> 2] + 24 >> 2], m[g](h | 0, i | 0);
 c = tb(d + 24 | 0);
 e = t[a + 48 >> 2];
 f = t[a + 64 >> 2];
 g = Ja(c, 4), j = w(e * f), t[g >> 2] = j;
 e = t[a + 52 >> 2];
 f = t[a + 68 >> 2];
 g = Ja(c, 5), j = w(e * f), t[g >> 2] = j;
 m[p[p[b >> 2] + 16 >> 2]](b, c);
 c = a + 80 | 0;
 g = d, i = Oa(c), p[g + 16 >> 2] = i;
 g = d, i = Qa(c), p[g + 8 >> 2] = i;
 while (1) {
  if (Sa(d + 16 | 0, d + 8 | 0)) {
   c = p[p[d + 16 >> 2] >> 2];
   m[p[p[c >> 2] + 64 >> 2]](c, b, p[a + 168 >> 2]);
   Ra(d + 16 | 0);
   continue;
  } else {
   a : {
    a = a + 176 | 0;
    while (1) {
     a = p[a >> 2];
     if (!a) {
      break a;
     }
     m[p[p[a >> 2] + 96 >> 2]](a, b);
     a = a + 152 | 0;
     continue;
    }
   }
  }
  break;
 }
 m[p[p[b >> 2] + 12 >> 2]](b);
 sa = d + 48 | 0;
}
function Lg(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 d = sa - 48 | 0;
 sa = d;
 p[d + 44 >> 2] = b;
 f = d, g = Kg(a, d + 44 | 0), p[f + 32 >> 2] = g;
 f = d, g = Jg(), p[f + 16 >> 2] = g;
 b = 1;
 a : {
  if (Ie(d + 32 | 0, d + 16 | 0)) {
   break a;
  }
  b = a + 20 | 0;
  f = d, g = Kg(b, d + 44 | 0), p[f + 32 >> 2] = g;
  f = d, g = Jg(), p[f + 16 >> 2] = g;
  if (Ie(d + 32 | 0, d + 16 | 0)) {
   $i(7316, 18, p[4952]);
   b = 0;
   break a;
  }
  Ig(d + 32 | 0, b, d + 44 | 0);
  b = uh(d + 32 | 0, p[d + 44 >> 2] + 24 | 0);
  f = d, g = Oa(b), p[f + 16 >> 2] = g;
  f = d, g = Qa(b), p[f + 24 >> 2] = g;
  b : {
   while (1) {
    e = Sa(d + 16 | 0, d + 24 | 0);
    if (e) {
     if (!Lg(a, p[p[d + 16 >> 2] >> 2], c)) {
      break b;
     }
     Ra(d + 16 | 0);
     continue;
    }
    break;
   }
   Ig(d + 16 | 0, a, d + 44 | 0);
   f = d, g = Oa(c), p[f + 16 >> 2] = g;
   p[d + 8 >> 2] = p[d + 16 >> 2];
   Ao(c, p[d + 8 >> 2], d + 44 | 0);
  }
  ib(b);
  b = e ^ 1;
 }
 sa = d + 48 | 0;
 return b;
}
function Du(a, b, c, d, e, f) {
 var g = 0, h = 0, i = 0, j = 0;
 a : {
  if (f & 64) {
   c = f + -64 | 0;
   b = c & 31;
   if (32 <= (c & 63) >>> 0) {
    c = 0;
    b = e >>> b | 0;
   } else {
    c = e >>> b | 0;
    b = ((1 << b) - 1 & e) << 32 - b | d >>> b;
   }
   d = 0;
   e = 0;
   break a;
  }
  if (!f) {
   break a;
  }
  h = e;
  i = d;
  j = 64 - f | 0;
  g = j & 31;
  if (32 <= (j & 63) >>> 0) {
   h = i << g;
   j = 0;
  } else {
   h = (1 << g) - 1 & i >>> 32 - g | h << g;
   j = i << g;
  }
  i = b;
  g = f;
  b = g & 31;
  if (32 <= (g & 63) >>> 0) {
   g = 0;
   b = c >>> b | 0;
  } else {
   g = c >>> b | 0;
   b = ((1 << b) - 1 & c) << 32 - b | i >>> b;
  }
  b = j | b;
  c = g | h;
  g = d;
  d = f & 31;
  if (32 <= (f & 63) >>> 0) {
   h = 0;
   d = e >>> d | 0;
  } else {
   h = e >>> d | 0;
   d = ((1 << d) - 1 & e) << 32 - d | g >>> d;
  }
  e = h;
 }
 p[a >> 2] = b;
 p[a + 4 >> 2] = c;
 p[a + 8 >> 2] = d;
 p[a + 12 >> 2] = e;
}
function jj(a, b, c, d, e) {
 var f = 0, g = 0, h = 0;
 f = sa - 208 | 0;
 sa = f;
 p[f + 204 >> 2] = c;
 c = 0;
 eb(f + 160 | 0, 0, 40);
 p[f + 200 >> 2] = p[f + 204 >> 2];
 a : {
  if ((Hf(0, b, f + 200 | 0, f + 80 | 0, f + 160 | 0, d, e) | 0) < 0) {
   break a;
  }
  c = p[a + 76 >> 2] >= 0 ? 1 : c;
  g = p[a >> 2];
  if (n[a + 74 | 0] <= 0) {
   p[a >> 2] = g & -33;
  }
  h = g & 32;
  b : {
   if (p[a + 48 >> 2]) {
    Hf(a, b, f + 200 | 0, f + 80 | 0, f + 160 | 0, d, e);
    break b;
   }
   p[a + 48 >> 2] = 80;
   p[a + 16 >> 2] = f + 80;
   p[a + 28 >> 2] = f;
   p[a + 20 >> 2] = f;
   g = p[a + 44 >> 2];
   p[a + 44 >> 2] = f;
   Hf(a, b, f + 200 | 0, f + 80 | 0, f + 160 | 0, d, e);
   if (!g) {
    break b;
   }
   m[p[a + 36 >> 2]](a, 0, 0) | 0;
   p[a + 48 >> 2] = 0;
   p[a + 44 >> 2] = g;
   p[a + 28 >> 2] = 0;
   p[a + 16 >> 2] = 0;
   p[a + 20 >> 2] = 0;
  }
  p[a >> 2] = p[a >> 2] | h;
  if (!c) {
   break a;
  }
 }
 sa = f + 208 | 0;
}
function Bu(a, b, c, d, e, f) {
 var g = 0, h = 0, i = 0, j = 0;
 a : {
  if (f & 64) {
   d = b;
   e = f + -64 | 0;
   b = e & 31;
   if (32 <= (e & 63) >>> 0) {
    e = d << b;
    d = 0;
   } else {
    e = (1 << b) - 1 & d >>> 32 - b | c << b;
    d = d << b;
   }
   b = 0;
   c = 0;
   break a;
  }
  if (!f) {
   break a;
  }
  g = d;
  i = f;
  d = f & 31;
  if (32 <= (f & 63) >>> 0) {
   h = g << d;
   j = 0;
  } else {
   h = (1 << d) - 1 & g >>> 32 - d | e << d;
   j = g << d;
  }
  d = c;
  g = b;
  f = 64 - f | 0;
  e = f & 31;
  if (32 <= (f & 63) >>> 0) {
   f = 0;
   d = d >>> e | 0;
  } else {
   f = d >>> e | 0;
   d = ((1 << e) - 1 & d) << 32 - e | g >>> e;
  }
  d = j | d;
  e = f | h;
  f = b;
  b = i & 31;
  if (32 <= (i & 63) >>> 0) {
   h = f << b;
   b = 0;
  } else {
   h = (1 << b) - 1 & f >>> 32 - b | c << b;
   b = f << b;
  }
  c = h;
 }
 p[a >> 2] = b;
 p[a + 4 >> 2] = c;
 p[a + 8 >> 2] = d;
 p[a + 12 >> 2] = e;
}
function wf(a, b, c, d, e, f, g) {
 var h = w(0), i = 0, j = w(0), k = w(0), l = w(0), m = w(0), n = w(0), o = w(0), p = w(0), q = w(0), r = w(0), s = w(0), u = w(0), x = w(0), y = 0, z = w(0);
 p = t[Ja(e, 0) >> 2];
 q = t[Ja(e, 2) >> 2];
 r = t[Ja(e, 4) >> 2];
 s = t[Ja(e, 1) >> 2];
 u = t[Ja(e, 3) >> 2];
 x = t[Ja(e, 5) >> 2];
 while (1) {
  if ((i | 0) != 4) {
   e = Ai(i, d);
   if (e) {
    h = w(w(e | 0) / w(255));
    e = v(Ai(i, c), 24);
    j = w(j + w(h * t[e + f >> 2]));
    e = (e | 4) + f | 0;
    k = w(k + w(h * t[e >> 2]));
    l = w(l + w(h * t[e + 8 >> 2]));
    m = w(m + w(h * t[e + 4 >> 2]));
    n = w(n + w(h * t[e + 16 >> 2]));
    o = w(o + w(h * t[e + 12 >> 2]));
   }
   i = i + 1 | 0;
   continue;
  }
  break;
 }
 h = w(w(w(s * a) + w(u * b)) + x);
 a = w(w(w(p * a) + w(q * b)) + r);
 y = Ja(g, 0), z = w(o + w(w(h * m) + w(a * j))), t[y >> 2] = z;
 y = Ja(g, 1), z = w(n + w(w(h * l) + w(a * k))), t[y >> 2] = z;
}
function Xc(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 c = sa - 16 | 0;
 sa = c;
 d = Vb(bd(b, q[a | 0]), 16);
 a = a + 4 | 0;
 g = c, h = Oa(a), p[g + 8 >> 2] = h;
 g = c, h = Qa(a), p[g >> 2] = h;
 f = (d | 0) == 16;
 a = 0;
 a : {
  while (1) {
   if (Sa(c + 8 | 0, c)) {
    d = p[p[c + 8 >> 2] >> 2];
    b : {
     c : {
      if (b) {
       if ((Vb(b, m[p[p[d >> 2] + 60 >> 2]](d) | 0) | 0) != (b | 0)) {
        break c;
       }
      }
      if (Me(d)) {
       e = 1;
       if (p[d + 72 >> 2]) {
        break b;
       }
      }
      f = 1;
     }
     e = a;
    }
    a = e;
    Ra(c + 8 | 0);
    continue;
   } else {
    if (a & f) {
     a = La(108);
     Lh(a);
     p[a >> 2] = 4308;
     g = a, h = od(), p[g + 104 >> 2] = h;
     break a;
    }
   }
   break;
  }
  if (a & 1) {
   a = La(104);
   b = eb(a, 0, 104);
   Lh(b);
   p[b >> 2] = 6208;
   break a;
  }
  a = od();
 }
 sa = c + 16 | 0;
 return a;
}
function wo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 d = sa - 48 | 0;
 sa = d;
 a : {
  if (p[a + 8 >> 2] != p[Va(a) >> 2]) {
   break a;
  }
  g = a + 8 | 0;
  h = a + 4 | 0;
  e = p[a + 4 >> 2];
  f = p[a >> 2];
  if (e >>> 0 > f >>> 0) {
   i = ((e - f >> 2) + 1 | 0) / -2 << 2;
   f = i + e | 0;
   c = g;
   g = p[c >> 2] - e | 0;
   if (g) {
    aj(f, e, g);
   }
   p[c >> 2] = f + g;
   p[h >> 2] = i + p[h >> 2];
   break a;
  }
  j = d, k = p[Va(a) >> 2] - p[a >> 2] >> 1, p[j + 24 >> 2] = k;
  p[d + 44 >> 2] = 1;
  c = p[Fb(d + 24 | 0, d + 44 | 0) >> 2];
  c = Ld(d + 24 | 0, c, c >>> 2 | 0, p[a + 16 >> 2]);
  e = db(d + 16 | 0, p[a + 4 >> 2]);
  f = db(d + 8 | 0, p[a + 8 >> 2]);
  ro(c, p[e >> 2], p[f >> 2]);
  Wa(a, c);
  Wa(h, c + 4 | 0);
  Wa(g, c + 8 | 0);
  Wa(Va(a), Va(c));
  Tc(c);
 }
 kc(p[a + 16 >> 2], p[a + 8 >> 2], b);
 p[a + 8 >> 2] = p[a + 8 >> 2] + 4;
 sa = d + 48 | 0;
}
function Sl(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0);
 h = a + 8 | 0;
 i = ab(h);
 e = i + -1 | 0;
 while (1) {
  a : {
   b : {
    if ((g | 0) <= (e | 0)) {
     f = e + g >> 1;
     j = t[p[Pa(h, f) >> 2] + 20 >> 2];
     if (!(j < c ^ 1)) {
      g = f + 1 | 0;
      continue;
     }
     if (!(j > c ^ 1)) {
      break b;
     }
     g = f;
    }
    f = p[a + 4 >> 2];
    if (!g) {
     a = p[Pa(h, 0) >> 2];
     m[p[p[a >> 2] + 44 >> 2]](a, b, f, d);
     return;
    }
    e = p[Pa(h, g + -1 | 0) >> 2];
    if (g >>> 0 < i >>> 0) {
     a = p[Pa(h, g) >> 2];
     if (t[a + 20 >> 2] == c) {
      m[p[p[a >> 2] + 44 >> 2]](a, b, f, d);
      return;
     }
     if (!p[e + 8 >> 2]) {
      break a;
     }
     m[p[p[e >> 2] + 48 >> 2]](e, b, f, c, a, d);
     return;
    }
    break a;
   }
   e = f + -1 | 0;
   continue;
  }
  break;
 }
 m[p[p[e >> 2] + 44 >> 2]](e, b, f, d);
}
function Ds(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 b = sa - 48 | 0;
 sa = b;
 e = tb(b + 24 | 0);
 c = a + 96 | 0;
 g = b, h = Oa(c), p[g + 16 >> 2] = h;
 g = b, h = Qa(c), p[g + 8 >> 2] = h;
 f = 6;
 while (1) {
  if (Sa(b + 16 | 0, b + 8 | 0)) {
   c = p[p[b + 16 >> 2] >> 2];
   ed(e, cc(p[c + 100 >> 2]), c + 76 | 0);
   d = Ja(e, 0);
   c = f << 2;
   p[c + p[a + 108 >> 2] >> 2] = p[d >> 2];
   d = Ja(e, 1);
   p[p[a + 108 >> 2] + (c | 4) >> 2] = p[d >> 2];
   d = Ja(e, 2);
   p[(c + p[a + 108 >> 2] | 0) + 8 >> 2] = p[d >> 2];
   d = Ja(e, 3);
   p[(c + p[a + 108 >> 2] | 0) + 12 >> 2] = p[d >> 2];
   d = Ja(e, 4);
   p[(c + p[a + 108 >> 2] | 0) + 16 >> 2] = p[d >> 2];
   d = Ja(e, 5);
   p[(c + p[a + 108 >> 2] | 0) + 20 >> 2] = p[d >> 2];
   f = f + 6 | 0;
   Ra(b + 16 | 0);
   continue;
  } else {
   sa = b + 48 | 0;
  }
  break;
 }
}
function Gu(a, b) {
 var c = 0;
 c = (b | 0) != 0;
 a : {
  b : {
   c : {
    if (!b | !(a & 3)) {
     break c;
    }
    while (1) {
     if (!q[a | 0]) {
      break b;
     }
     a = a + 1 | 0;
     b = b + -1 | 0;
     c = (b | 0) != 0;
     if (!b) {
      break c;
     }
     if (a & 3) {
      continue;
     }
     break;
    }
   }
   if (!c) {
    break a;
   }
  }
  d : {
   if (!q[a | 0] | b >>> 0 < 4) {
    break d;
   }
   while (1) {
    c = p[a >> 2];
    if ((c ^ -1) & c + -16843009 & -2139062144) {
     break d;
    }
    a = a + 4 | 0;
    b = b + -4 | 0;
    if (b >>> 0 > 3) {
     continue;
    }
    break;
   }
  }
  if (!b) {
   break a;
  }
  while (1) {
   if (!q[a | 0]) {
    return a;
   }
   a = a + 1 | 0;
   b = b + -1 | 0;
   if (b) {
    continue;
   }
   break;
  }
 }
 return 0;
}
function Fp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 c = sa - 16 | 0;
 sa = c;
 g = ho(a, b);
 d = a + 164 | 0;
 j = c, k = Oa(d), p[j + 8 >> 2] = k;
 j = c, k = Qa(d), p[j >> 2] = k;
 e = a + 176 | 0;
 while (1) {
  if (!Sa(c + 8 | 0, c)) {
   if (g) {
    m[p[p[b >> 2] + 12 >> 2]](b);
   }
   sa = c + 16 | 0;
   return;
  }
  d = p[p[c + 8 >> 2] >> 2];
  if (q[d + 46 | 0]) {
   m[p[p[b >> 2] + 8 >> 2]](b);
   h = d;
   i = b;
   a : {
    if ((Vb(m[p[p[d >> 2] + 60 >> 2]](d) | 0, 2) | 0) == 2) {
     k = b, l = cc(a), j = p[p[b >> 2] + 16 >> 2], m[j](k | 0, l | 0);
     f = p[e + 52 >> 2];
     break a;
    }
    f = p[e + 56 >> 2];
   }
   m[p[p[d >> 2] + 64 >> 2]](h, i, f);
   m[p[p[b >> 2] + 12 >> 2]](b);
  }
  Ra(c + 8 | 0);
  continue;
 }
}
function Cm(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 h = sa - 16 | 0;
 sa = h;
 g = wb(b);
 f = _a(p[c + 4 >> 2], g);
 d = p[Pa(b, f) >> 2];
 while (1) {
  e = d;
  d = p[d >> 2];
  if ((d | 0) != (c | 0)) {
   continue;
  }
  break;
 }
 a : {
  if ((e | 0) != (b + 8 | 0)) {
   if ((_a(p[e + 4 >> 2], g) | 0) == (f | 0)) {
    break a;
   }
  }
  d = p[c >> 2];
  if (d) {
   if ((_a(p[d + 4 >> 2], g) | 0) == (f | 0)) {
    break a;
   }
  }
  i = Pa(b, f), j = 0, p[i >> 2] = j;
 }
 d = p[c >> 2];
 b : {
  if (!d) {
   break b;
  }
  d = _a(p[d + 4 >> 2], g);
  if ((d | 0) == (f | 0)) {
   break b;
  }
  i = Pa(b, d), j = e, p[i >> 2] = j;
 }
 p[e >> 2] = p[c >> 2];
 p[c >> 2] = 0;
 e = Va(b);
 p[e >> 2] = p[e >> 2] + -1;
 Cd(a, c, Dd(h + 8 | 0, Ma(b), 1));
 sa = h + 16 | 0;
}
function lj(a, b) {
 var c = 0, d = 0, g = 0, h = 0, k = 0, l = 0;
 d = sa - 16 | 0;
 sa = d;
 g = (i(a), e(2));
 c = g & 2147483647;
 a : {
  if (c >>> 0 <= 1305022426) {
   k = +a;
   h = k * .6366197723675814 + 6755399441055744 + -6755399441055744;
   u[b >> 3] = k + h * -1.5707963109016418 + h * -1.5893254773528196e-8;
   if (x(h) < 2147483648) {
    c = ~~h;
    break a;
   }
   c = -2147483648;
   break a;
  }
  if (c >>> 0 >= 2139095040) {
   u[b >> 3] = w(a - a);
   c = 0;
   break a;
  }
  l = c;
  c = (c >>> 23 | 0) + -150 | 0;
  u[d + 8 >> 3] = (f(2, l - (c << 23) | 0), j());
  c = Vu(d + 8 | 0, d, c);
  if ((g | 0) <= -1) {
   u[b >> 3] = -u[d >> 3];
   c = 0 - c | 0;
   break a;
  }
  g = p[d + 4 >> 2];
  p[b >> 2] = p[d >> 2];
  p[b + 4 >> 2] = g;
 }
 sa = d + 16 | 0;
 return c;
}
function ed(a, b, c) {
 var d = w(0), e = w(0), f = w(0), g = w(0), h = w(0), i = w(0), j = w(0), k = w(0), l = w(0), m = w(0), n = w(0), o = w(0), p = 0, q = w(0);
 d = t[Ja(b, 0) >> 2];
 e = t[Ja(b, 1) >> 2];
 f = t[Ja(b, 2) >> 2];
 g = t[Ja(b, 3) >> 2];
 n = t[Ja(b, 4) >> 2];
 o = t[Ja(b, 5) >> 2];
 h = t[Ja(c, 0) >> 2];
 i = t[Ja(c, 1) >> 2];
 j = t[Ja(c, 2) >> 2];
 k = t[Ja(c, 3) >> 2];
 l = t[Ja(c, 4) >> 2];
 m = t[Ja(c, 5) >> 2];
 p = Ja(a, 0), q = w(w(d * h) + w(f * i)), t[p >> 2] = q;
 p = Ja(a, 1), q = w(w(e * h) + w(g * i)), t[p >> 2] = q;
 p = Ja(a, 2), q = w(w(d * j) + w(f * k)), t[p >> 2] = q;
 p = Ja(a, 3), q = w(w(e * j) + w(g * k)), t[p >> 2] = q;
 p = Ja(a, 4), q = w(n + w(w(d * l) + w(f * m))), t[p >> 2] = q;
 p = Ja(a, 5), q = w(o + w(w(e * l) + w(g * m))), t[p >> 2] = q;
}
function Fu(a, b) {
 a : {
  if (a) {
   if (b >>> 0 <= 127) {
    break a;
   }
   b : {
    if (!p[p[5354] >> 2]) {
     if ((b & -128) == 57216) {
      break a;
     }
     break b;
    }
    if (b >>> 0 <= 2047) {
     n[a + 1 | 0] = b & 63 | 128;
     n[a | 0] = b >>> 6 | 192;
     return 2;
    }
    if (!((b & -8192) != 57344 ? b >>> 0 >= 55296 : 0)) {
     n[a + 2 | 0] = b & 63 | 128;
     n[a | 0] = b >>> 12 | 224;
     n[a + 1 | 0] = b >>> 6 & 63 | 128;
     return 3;
    }
    if (b + -65536 >>> 0 <= 1048575) {
     n[a + 3 | 0] = b & 63 | 128;
     n[a | 0] = b >>> 18 | 240;
     n[a + 2 | 0] = b >>> 6 & 63 | 128;
     n[a + 1 | 0] = b >>> 12 & 63 | 128;
     return 4;
    }
   }
   p[5449] = 25;
   a = -1;
  } else {
   a = 1;
  }
  return a;
 }
 n[a | 0] = b;
 return 1;
}
function vs(a, b) {
 a = a | 0;
 b = b | 0;
 var c = w(0), d = 0, e = 0, f = 0, g = 0, h = w(0);
 f = sa - 32 | 0;
 sa = f;
 d = tb(f + 8 | 0);
 c = t[a + 52 >> 2];
 g = Ja(d, 0), h = c, t[g >> 2] = h;
 c = t[a + 60 >> 2];
 g = Ja(d, 1), h = c, t[g >> 2] = h;
 c = t[a + 56 >> 2];
 g = Ja(d, 2), h = c, t[g >> 2] = h;
 e = 3;
 c = t[a + 64 >> 2];
 g = Ja(d, 3), h = c, t[g >> 2] = h;
 c = t[a + 68 >> 2];
 g = Ja(d, 4), h = c, t[g >> 2] = h;
 c = t[a + 72 >> 2];
 g = Ja(d, 5), h = c, t[g >> 2] = h;
 a : {
  if (!ri(a + 76 | 0, d)) {
   break a;
  }
  e = Eb(a, b);
  if (e) {
   break a;
  }
  e = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!Af(b)) {
   break a;
  }
  p[a + 100 >> 2] = b;
  e = 0;
 }
 sa = f + 32 | 0;
 return e | 0;
}
function so(a, b) {
 var c = 0, d = 0, e = 0, f = w(0), g = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 e = c;
 a : {
  if ((b | 0) == 1) {
   b = 2;
  } else {
   if (!(b + -1 & b)) {
    break a;
   }
   b = Nc(b);
  }
  p[e + 12 >> 2] = b;
 }
 d = wb(a);
 b : {
  if (b >>> 0 > d >>> 0) {
   Gg(a, b);
   break b;
  }
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  g = jc(d);
  f = w(C(w(w(s[Va(a) >> 2]) / t[jb(a) >> 2])));
  c : {
   if (f < w(4294967296) & f >= w(0)) {
    b = ~~f >>> 0;
    break c;
   }
   b = 0;
  }
  e = c;
  d : {
   if (g) {
    b = De(b);
    break d;
   }
   b = Nc(b);
  }
  p[e + 8 >> 2] = b;
  b = p[Fb(c + 12 | 0, c + 8 | 0) >> 2];
  p[c + 12 >> 2] = b;
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  Gg(a, b);
 }
 sa = c + 16 | 0;
}
function Og(a, b) {
 var c = 0, d = 0, e = 0, f = w(0), g = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 e = c;
 a : {
  if ((b | 0) == 1) {
   b = 2;
  } else {
   if (!(b + -1 & b)) {
    break a;
   }
   b = Nc(b);
  }
  p[e + 12 >> 2] = b;
 }
 d = wb(a);
 b : {
  if (b >>> 0 > d >>> 0) {
   Ng(a, b);
   break b;
  }
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  g = jc(d);
  f = w(C(w(w(s[Va(a) >> 2]) / t[jb(a) >> 2])));
  c : {
   if (f < w(4294967296) & f >= w(0)) {
    b = ~~f >>> 0;
    break c;
   }
   b = 0;
  }
  e = c;
  d : {
   if (g) {
    b = De(b);
    break d;
   }
   b = Nc(b);
  }
  p[e + 8 >> 2] = b;
  b = p[Fb(c + 12 | 0, c + 8 | 0) >> 2];
  p[c + 12 >> 2] = b;
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  Ng(a, b);
 }
 sa = c + 16 | 0;
}
function Am(a, b) {
 var c = 0, d = 0, e = 0, f = w(0), g = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 e = c;
 a : {
  if ((b | 0) == 1) {
   b = 2;
  } else {
   if (!(b + -1 & b)) {
    break a;
   }
   b = Nc(b);
  }
  p[e + 12 >> 2] = b;
 }
 d = wb(a);
 b : {
  if (b >>> 0 > d >>> 0) {
   pg(a, b);
   break b;
  }
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  g = jc(d);
  f = w(C(w(w(s[Va(a) >> 2]) / t[jb(a) >> 2])));
  c : {
   if (f < w(4294967296) & f >= w(0)) {
    b = ~~f >>> 0;
    break c;
   }
   b = 0;
  }
  e = c;
  d : {
   if (g) {
    b = De(b);
    break d;
   }
   b = Nc(b);
  }
  p[e + 8 >> 2] = b;
  b = p[Fb(c + 12 | 0, c + 8 | 0) >> 2];
  p[c + 12 >> 2] = b;
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  pg(a, b);
 }
 sa = c + 16 | 0;
}
function Ef(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 d = p[c + 16 >> 2];
 a : {
  if (!d) {
   if (ou(c)) {
    break a;
   }
   d = p[c + 16 >> 2];
  }
  f = p[c + 20 >> 2];
  if (d - f >>> 0 < b >>> 0) {
   return m[p[c + 36 >> 2]](c, a, b) | 0;
  }
  b : {
   if (n[c + 75 | 0] < 0) {
    break b;
   }
   e = b;
   while (1) {
    d = e;
    if (!d) {
     break b;
    }
    e = d + -1 | 0;
    if (q[e + a | 0] != 10) {
     continue;
    }
    break;
   }
   e = m[p[c + 36 >> 2]](c, a, d) | 0;
   if (e >>> 0 < d >>> 0) {
    break a;
   }
   a = a + d | 0;
   b = b - d | 0;
   f = p[c + 20 >> 2];
   g = d;
  }
  Pb(f, a, b);
  p[c + 20 >> 2] = p[c + 20 >> 2] + b;
  e = b + g | 0;
 }
 return e;
}
function So(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 a : {
  d = Sg(a);
  if (!d) {
   break a;
  }
  e = a + 128 | 0;
  b = ab(e);
  h = (b | 0) > 0 ? b : 0;
  while (1) {
   if (!Sg(a)) {
    break a;
   }
   b = 0;
   if (f >>> 0 > 99) {
    break a;
   }
   while (1) {
    b : {
     if ((b | 0) == (h | 0)) {
      break b;
     }
     c = p[Pa(e, b) >> 2];
     p[a + 164 >> 2] = b;
     g = r[c + 44 >> 1];
     if (g) {
      o[c + 44 >> 1] = 0;
      m[p[p[c >> 2] + 48 >> 2]](c, g);
      if (s[a + 164 >> 2] < b >>> 0) {
       break b;
      }
     }
     b = b + 1 | 0;
     continue;
    }
    break;
   }
   f = f + 1 | 0;
   continue;
  }
 }
 return d;
}
function rs(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  b : {
   switch (b + -95 | 0) {
   case 0:
    d = a, e = ec(c), p[d + 48 >> 2] = e;
    break a;
   case 1:
    d = a, f = w(Na(c)), t[d + 52 >> 2] = f;
    break a;
   case 2:
    d = a, f = w(Na(c)), t[d + 56 >> 2] = f;
    break a;
   case 3:
    d = a, f = w(Na(c)), t[d + 60 >> 2] = f;
    break a;
   case 4:
    d = a, f = w(Na(c)), t[d + 64 >> 2] = f;
    break a;
   case 5:
    d = a, f = w(Na(c)), t[d + 68 >> 2] = f;
    break a;
   case 6:
    d = a, f = w(Na(c)), t[d + 72 >> 2] = f;
    break a;
   default:
    break b;
   }
  }
  return yb(a, b, c) | 0;
 }
 return 1;
}
function op(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = w(0), f = 0, g = 0, h = 0, i = w(0), j = w(0), k = w(0), l = w(0);
 b = m[p[p[a >> 2] + 128 >> 2]](a) | 0;
 f = (b | 0) > 0 ? b : 0;
 g = a + 140 | 0;
 h = 6.283185307179586 / +(b | 0);
 i = w(t[a + 152 >> 2] * w(.5));
 j = w(t[a + 156 >> 2] * w(.5));
 k = w(w(t[a + 152 >> 2] * t[a + 176 >> 2]) * w(.5));
 l = w(w(t[a + 156 >> 2] * t[a + 176 >> 2]) * w(.5));
 d = -1.5707963267948966;
 while (1) {
  if ((c | 0) != (f | 0)) {
   b = p[Pa(g, c) >> 2];
   e = w(d);
   a : {
    if (c & 1) {
     Ne(a, b, l, k, e);
     break a;
    }
    Ne(a, b, j, i, e);
   }
   c = c + 1 | 0;
   d = h + d;
   continue;
  }
  break;
 }
}
function ri(a, b) {
 var c = w(0), d = w(0), e = w(0), f = w(0), g = w(0), h = w(0), i = w(0), j = w(0), k = 0, l = w(0);
 d = t[Ja(b, 0) >> 2];
 e = t[Ja(b, 1) >> 2];
 f = t[Ja(b, 2) >> 2];
 g = t[Ja(b, 3) >> 2];
 i = t[Ja(b, 4) >> 2];
 b = Ja(b, 5);
 h = w(w(d * g) - w(e * f));
 if (h != w(0)) {
  j = t[b >> 2];
  c = w(w(1) / h);
  k = Ja(a, 0), l = w(g * c), t[k >> 2] = l;
  k = Ja(a, 1), l = w(c * w(-e)), t[k >> 2] = l;
  k = Ja(a, 2), l = w(c * w(-f)), t[k >> 2] = l;
  k = Ja(a, 3), l = w(d * c), t[k >> 2] = l;
  k = Ja(a, 4), l = w(c * w(w(f * j) - w(g * i))), t[k >> 2] = l;
  k = Ja(a, 5), l = w(c * w(w(e * i) - w(d * j))), t[k >> 2] = l;
 }
 return h != w(0);
}
function fm(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 f = sa - 16 | 0;
 sa = f;
 d = a + 8 | 0;
 Cc(a, a + 4 | 0, d, c);
 e = a + 12 | 0;
 while (1) {
  if ((b | 0) != (e | 0)) {
   if (m[p[c >> 2]](p[e >> 2], p[d >> 2]) | 0) {
    p[f + 12 >> 2] = p[e >> 2];
    h = e;
    while (1) {
     a : {
      g = d;
      p[h >> 2] = p[d >> 2];
      if ((a | 0) == (d | 0)) {
       g = a;
       break a;
      }
      h = g;
      d = g + -4 | 0;
      if (m[p[c >> 2]](p[f + 12 >> 2], p[d >> 2]) | 0) {
       continue;
      }
     }
     break;
    }
    p[g >> 2] = p[f + 12 >> 2];
   }
   d = e;
   e = d + 4 | 0;
   continue;
  }
  break;
 }
 sa = f + 16 | 0;
}
function zo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 e = Ee(Va(a), p[b >> 2]);
 a : {
  b : {
   f = wb(a);
   if (!f) {
    break b;
   }
   g = _a(e, f);
   c = p[Pa(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((_a(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!Ed(jb(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[db(d + 8 | 0, c) >> 2];
   break a;
  }
  c = uc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function Es(a, b) {
 a = a | 0;
 b = b | 0;
 var c = w(0), d = 0, e = 0, f = w(0);
 c = t[a + 48 >> 2];
 b = a + 72 | 0;
 e = Ja(b, 0), f = c, t[e >> 2] = f;
 c = t[a + 56 >> 2];
 e = Ja(b, 1), f = c, t[e >> 2] = f;
 c = t[a + 52 >> 2];
 e = Ja(b, 2), f = c, t[e >> 2] = f;
 c = t[a + 60 >> 2];
 e = Ja(b, 3), f = c, t[e >> 2] = f;
 c = t[a + 64 >> 2];
 e = Ja(b, 4), f = c, t[e >> 2] = f;
 c = t[a + 68 >> 2];
 e = Ja(b, 5), f = c, t[e >> 2] = f;
 d = a;
 b = p[a + 20 >> 2];
 if ((m[p[p[b >> 2] + 8 >> 2]](b) | 0) == 16) {
  b = b ? b + 156 | 0 : 0;
 } else {
  b = 0;
 }
 p[d + 112 >> 2] = b;
 if (b) {
  p[b + 4 >> 2] = a;
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function Gm(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 Va(a);
 e = p[b >> 2];
 a : {
  b : {
   f = wb(a);
   if (!f) {
    break b;
   }
   g = _a(e, f);
   c = p[Pa(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((_a(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!Uc(jb(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[db(d + 8 | 0, c) >> 2];
   break a;
  }
  c = uc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function Bi(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 Va(a);
 e = r[b >> 1];
 a : {
  b : {
   f = wb(a);
   if (!f) {
    break b;
   }
   g = _a(e, f);
   c = p[Pa(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((_a(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!gi(jb(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[db(d + 8 | 0, c) >> 2];
   break a;
  }
  c = uc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function tt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  b : {
   switch (b + -56 | 0) {
   case 0:
    d = a, e = ec(c), p[d + 16 >> 2] = e;
    break a;
   case 1:
    d = a, e = ec(c), p[d + 20 >> 2] = e;
    break a;
   case 2:
    d = a, f = w(Na(c)), t[d + 24 >> 2] = f;
    break a;
   case 3:
    d = a, e = ec(c), p[d + 28 >> 2] = e;
    break a;
   case 4:
    d = a, e = ec(c), p[d + 32 >> 2] = e;
    break a;
   case 5:
    d = a, e = ec(c), p[d + 36 >> 2] = e;
    break a;
   case 6:
    d = a, e = Dc(c), n[d + 40 | 0] = e;
    break a;
   default:
    break b;
   }
  }
  return Ki(a, b, c) | 0;
 }
 return 1;
}
function _o(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 e = Qg(Va(a), b);
 a : {
  b : {
   f = wb(a);
   if (!f) {
    break b;
   }
   g = _a(e, f);
   c = p[Pa(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((_a(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!Uc(jb(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[db(d + 8 | 0, c) >> 2];
   break a;
  }
  c = uc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function en(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   switch (b + -33 | 0) {
   case 9:
    d = a, e = w(Na(c)), t[d + 48 >> 2] = e;
    return 1;
   case 0:
    d = a, e = w(Na(c)), t[d + 52 >> 2] = e;
    return 1;
   case 1:
    d = a, e = w(Na(c)), t[d + 56 >> 2] = e;
    return 1;
   case 2:
    d = a, e = w(Na(c)), t[d + 60 >> 2] = e;
    return 1;
   default:
    if ((b | 0) == 46) {
     break a;
    }
    break;
   case 3:
   case 4:
   case 5:
   case 6:
   case 7:
   case 8:
    break b;
   }
  }
  return yb(a, b, c) | 0;
 }
 d = a, e = w(Na(c)), t[d + 64 >> 2] = e;
 return 1;
}
function _r(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 c = sa - 16 | 0;
 sa = c;
 a : {
  if (!ob(b, bd(8, 64))) {
   break a;
  }
  b = p[a + 76 >> 2];
  m[p[p[b >> 2] + 8 >> 2]](b);
  b = p[a + 76 >> 2];
  m[p[p[b >> 2] + 12 >> 2]](b, p[a + 52 >> 2]);
  b = a + 60 | 0;
  d = c, e = Oa(b), p[d + 8 >> 2] = e;
  d = c, e = Qa(b), p[d >> 2] = e;
  while (1) {
   if (!Sa(c + 8 | 0, c)) {
    break a;
   }
   b = p[a + 76 >> 2];
   e = b, f = p[mi(p[p[c + 8 >> 2] >> 2]) + 56 >> 2], g = 21472, d = p[p[b >> 2] + 16 >> 2], m[d](e | 0, f | 0, g | 0);
   Ra(c + 8 | 0);
   continue;
  }
 }
 sa = c + 16 | 0;
}
function Ao(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 e = sa - 32 | 0;
 sa = e;
 p[e + 24 >> 2] = b;
 b = p[a >> 2];
 f = e, g = Oa(a), p[f >> 2] = g;
 b = b + (Hg(e + 24 | 0, e) << 2) | 0;
 a : {
  if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
   d = p[a + 4 >> 2];
   if ((d | 0) == (b | 0)) {
    Zc(a, c);
    break a;
   }
   xo(a, b, d, b + 4 | 0);
   d = b;
   if (b >>> 0 <= c >>> 0) {
    c = c >>> 0 < s[a + 4 >> 2] ? c + 4 | 0 : c;
   }
   p[d >> 2] = p[c >> 2];
   break a;
  }
  d = Ma(a);
  d = Ld(e, Ad(a, ab(a) + 1 | 0), b - p[a >> 2] >> 2, d);
  wo(d, c);
  b = vo(a, d, b);
  Tc(d);
 }
 _e(b);
 sa = e + 32 | 0;
}
function ef(a, b, c, d, e, f, g, h) {
 var i = 0, j = 0, k = w(0), l = 0, m = w(0);
 i = sa - 48 | 0;
 sa = i;
 a : {
  if (er(a, b, c, d)) {
   k = w(f + g);
   l = i + 48 | 0;
   j = i;
   while (1) {
    j = gb(j) + 8 | 0;
    if ((l | 0) != (j | 0)) {
     continue;
    }
    break;
   }
   Qd(a, b, c, d, w(.5), i);
   b = i + 40 | 0;
   m = e;
   e = w(k * w(.5));
   e = ef(b, i + 32 | 0, i + 16 | 0, d, ef(a, i, i + 24 | 0, b, m, f, e, h), e, g, h);
   break a;
  }
  f = pi(a, d);
  e = w(f + e);
  if (f > w(.05000000074505806) ^ 1) {
   break a;
  }
  dr(h, cb(i, g, e));
 }
 sa = i + 48 | 0;
 return e;
}
function mf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   c : {
    d : {
     switch (b + -20 | 0) {
     default:
      switch (b + -123 | 0) {
      case 1:
       break b;
      case 0:
       break c;
      default:
       break a;
      }
     case 0:
      d = a, e = w(Na(c)), t[d + 152 >> 2] = e;
      return 1;
     case 1:
      break d;
     }
    }
    d = a, e = w(Na(c)), t[d + 156 >> 2] = e;
    return 1;
   }
   d = a, e = w(Na(c)), t[d + 160 >> 2] = e;
   return 1;
  }
  d = a, e = w(Na(c)), t[d + 164 >> 2] = e;
  return 1;
 }
 return lf(a, b, c) | 0;
}
function Cs(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 96 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Qa(c), p[e >> 2] = f;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   Rb(p[p[p[b + 8 >> 2] >> 2] + 100 >> 2], a);
   Ra(b + 8 | 0);
   continue;
  } else {
   d = a;
   a = v(ab(c), 6) + 6 | 0;
   a = La((a | 0) != (a & 1073741822) ? -1 : a << 2);
   p[d + 108 >> 2] = a;
   p[a + 16 >> 2] = 0;
   p[a + 20 >> 2] = 0;
   p[a + 8 >> 2] = 0;
   p[a + 12 >> 2] = 1065353216;
   p[a >> 2] = 1065353216;
   p[a + 4 >> 2] = 0;
   sa = b + 16 | 0;
  }
  break;
 }
}
function ws(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   switch (b + -104 | 0) {
   case 0:
    d = a, e = w(Na(c)), t[d + 48 >> 2] = e;
    break a;
   case 1:
    d = a, e = w(Na(c)), t[d + 52 >> 2] = e;
    break a;
   case 2:
    d = a, e = w(Na(c)), t[d + 56 >> 2] = e;
    break a;
   case 3:
    d = a, e = w(Na(c)), t[d + 60 >> 2] = e;
    break a;
   case 4:
    d = a, e = w(Na(c)), t[d + 64 >> 2] = e;
    break a;
   case 5:
    d = a, e = w(Na(c)), t[d + 68 >> 2] = e;
    break a;
   default:
    break b;
   }
  }
  return yb(a, b, c) | 0;
 }
 return 1;
}
function _i(a) {
 var b = 0, c = 0, d = 0;
 a : {
  b : {
   b = a;
   if (!(b & 3)) {
    break b;
   }
   if (!q[a | 0]) {
    return 0;
   }
   while (1) {
    b = b + 1 | 0;
    if (!(b & 3)) {
     break b;
    }
    if (q[b | 0]) {
     continue;
    }
    break;
   }
   break a;
  }
  while (1) {
   c = b;
   b = b + 4 | 0;
   d = p[c >> 2];
   if (!((d ^ -1) & d + -16843009 & -2139062144)) {
    continue;
   }
   break;
  }
  if (!(d & 255)) {
   return c - a | 0;
  }
  while (1) {
   d = q[c + 1 | 0];
   b = c + 1 | 0;
   c = b;
   if (d) {
    continue;
   }
   break;
  }
 }
 return b - a | 0;
}
function Jo(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   switch (b + -7 | 0) {
   case 0:
    d = a, e = w(Na(c)), t[d + 48 >> 2] = e;
    break a;
   case 1:
    d = a, e = w(Na(c)), t[d + 52 >> 2] = e;
    break a;
   case 2:
    d = a, e = w(Na(c)), t[d + 56 >> 2] = e;
    break a;
   case 3:
    d = a, e = w(Na(c)), t[d + 60 >> 2] = e;
    break a;
   case 4:
    d = a, e = w(Na(c)), t[d + 64 >> 2] = e;
    break a;
   case 5:
    d = a, e = w(Na(c)), t[d + 68 >> 2] = e;
    break a;
   default:
    break b;
   }
  }
  return yb(a, b, c) | 0;
 }
 return 1;
}
function go(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 48 | 0;
 sa = d;
 e = d + 16 | 0;
 Le(e + 12 | 0);
 a : {
  if (!fo(a, e)) {
   $i(7604, 11, p[4952]);
   break a;
  }
  if (p[e >> 2] != 7) {
   a = p[e >> 2];
   b = p[e + 4 >> 2];
   p[d + 8 >> 2] = 7;
   p[d + 12 >> 2] = 0;
   p[d + 4 >> 2] = b;
   p[d >> 2] = a;
   ae(p[4952], 7616, d);
   break a;
  }
  c = La(16);
  p[c >> 2] = 0;
  p[c + 4 >> 2] = 0;
  p[c + 8 >> 2] = 0;
  p[c + 12 >> 2] = 0;
  p[c >> 2] = 0;
  bb(c + 4 | 0);
  if (eo(c, a, e)) {
   Fg(c);
   Ua(c);
   break a;
  }
  p[b >> 2] = c;
 }
 Wc(e + 12 | 0);
 sa = d + 48 | 0;
}
function _p(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 a : {
  d = a + 140 | 0;
  a = ab(d);
  if ((b | 0) == (a | 0)) {
   break a;
  }
  if (a >>> 0 >= b >>> 0) {
   c = b;
   while (1) {
    if ((a | 0) == (c | 0)) {
     nh(d, b);
     break a;
    }
    e = p[Pa(d, c) >> 2];
    if (e) {
     m[p[p[e >> 2] + 4 >> 2]](e);
    }
    c = c + 1 | 0;
    continue;
   }
  }
  nh(d, b);
  b = (a | 0) > (b | 0) ? a : b;
  while (1) {
   if ((a | 0) == (b | 0)) {
    break a;
   }
   c = eb(La(64), 0, 64);
   Tb(c);
   f = Pa(d, a), g = c, p[f >> 2] = g;
   a = a + 1 | 0;
   continue;
  }
 }
}
function ao(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 o[d + 14 >> 1] = b;
 f = d, g = Ui(a, d + 14 | 0), p[f + 8 >> 2] = g;
 f = d, g = Lc(), p[f >> 2] = g;
 a : {
  b : {
   if (!Kd(d + 8 | 0, d)) {
    break b;
   }
   e = p[Wb(d + 8 | 0) + 4 >> 2];
   b = m[p[p[e >> 2] + 8 >> 2]](e) | 0;
   if (e) {
    m[p[p[e >> 2] + 4 >> 2]](e);
   }
   if (!b) {
    break b;
   }
   Dg(a, d + 14 | 0);
   break a;
  }
  c : {
   if (!c) {
    Dg(a, d + 14 | 0);
    break c;
   }
   f = Wn(a, d + 14 | 0), g = c, p[f >> 2] = g;
  }
  b = 0;
 }
 sa = d + 16 | 0;
 return b;
}
function vk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   b : {
    if (!a) {
     break b;
    }
    if (!(m[p[p[a >> 2] + 12 >> 2]](a, 41) | 0)) {
     break b;
    }
    _b(c, a);
    d = lc(c, b);
    ub(c);
    if (d) {
     break a;
    }
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Qp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = w(0), f = w(0), g = w(0);
 if (ob(b, 8)) {
  e = t[a + 168 >> 2];
  d = t[a + 164 >> 2];
  g = t[a + 156 >> 2];
  c = a + 172 | 0;
  f = w(t[a + 152 >> 2] * w(-t[a + 160 >> 2]));
  Ab(c, f);
  d = w(g * w(-d));
  zb(c, d);
  Mc(c, e);
  c = a + 236 | 0;
  Ab(c, w(f + t[a + 152 >> 2]));
  zb(c, d);
  Mc(c, e);
  c = a + 300 | 0;
  Ab(c, w(f + t[a + 152 >> 2]));
  zb(c, w(d + t[a + 156 >> 2]));
  Mc(c, e);
  c = a + 364 | 0;
  Ab(c, f);
  zb(c, w(d + t[a + 156 >> 2]));
  Mc(c, e);
 }
 Hc(a, b);
}
function Co(a) {
 var b = 0, c = 0, d = 0;
 b = 4;
 c = 4;
 while (1) {
  if (c >>> 0 >= 4) {
   d = v(q[a | 0] | q[a + 1 | 0] << 8 | (q[a + 2 | 0] << 16 | q[a + 3 | 0] << 24), 1540483477);
   b = v(d ^ d >>> 24, 1540483477) ^ v(b, 1540483477);
   c = c + -4 | 0;
   a = a + 4 | 0;
   continue;
  }
  break;
 }
 a : {
  switch (c + -1 | 0) {
  case 2:
   b = q[a + 2 | 0] << 16 ^ b;
  case 1:
   b = q[a + 1 | 0] << 8 ^ b;
  case 0:
   b = v(q[a | 0] ^ b, 1540483477);
   break;
  default:
   break a;
  }
 }
 a = v(b >>> 13 ^ b, 1540483477);
 return a >>> 15 ^ a;
}
function Db(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 e = 0;
 a : {
  if ((Vb(r[a + 44 >> 1], b) | 0) == (b | 0)) {
   break a;
  }
  Id(a + 44 | 0, b);
  m[p[p[a >> 2] + 44 >> 2]](a, r[a + 44 >> 1]);
  Vo(p[a + 40 >> 2], a);
  e = 1;
  if (!c) {
   break a;
  }
  a = a + 24 | 0;
  f = d, g = Oa(a), p[f + 8 >> 2] = g;
  f = d, g = Qa(a), p[f >> 2] = g;
  while (1) {
   if (Sa(d + 8 | 0, d)) {
    Db(p[p[d + 8 >> 2] >> 2], b, 1);
    Ra(d + 8 | 0);
    continue;
   }
   break;
  }
  e = 1;
 }
 a = e;
 sa = d + 16 | 0;
 return a;
}
function xk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   b : {
    if (!a) {
     break b;
    }
    if (!Af(a)) {
     break b;
    }
    _b(c, a);
    d = lc(c, b);
    ub(c);
    if (d) {
     break a;
    }
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Ck(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   b : {
    if (!a) {
     break b;
    }
    if (!og(a)) {
     break b;
    }
    _b(c, a);
    d = lc(c, b);
    ub(c);
    if (d) {
     break a;
    }
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Ak(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   b : {
    if (!a) {
     break b;
    }
    if (!sf(a)) {
     break b;
    }
    _b(c, a);
    d = lc(c, b);
    ub(c);
    if (d) {
     break a;
    }
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function ms(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 e = a;
 a : {
  while (1) {
   if (e >>> 0 >= b >>> 0) {
    break a;
   }
   h = q[e | 0];
   g = h & 127;
   i = d & 255;
   f = i;
   d = f & 31;
   if (32 <= (f & 63) >>> 0) {
    f = g << d;
    d = 0;
   } else {
    f = (1 << d) - 1 & g >>> 32 - d;
    d = g << d;
   }
   j = d | j;
   k = f | k;
   e = e + 1 | 0;
   d = i + 7 | 0;
   if (h & 128) {
    continue;
   }
   break;
  }
  p[c >> 2] = j;
  p[c + 4 >> 2] = k;
  l = e - a | 0;
 }
 return l;
}
function Oc(a, b, c) {
 var d = 0, e = 0, f = 0;
 a : {
  if ((b | 0) == 1 & a >>> 0 < 0 | b >>> 0 < 1) {
   d = a;
   break a;
  }
  while (1) {
   d = Yw(a, b, 10);
   e = ta;
   f = e;
   e = Xw(d, e, 10);
   c = c + -1 | 0;
   n[c | 0] = a - e | 48;
   e = b >>> 0 > 9;
   a = d;
   b = f;
   if (e) {
    continue;
   }
   break;
  }
 }
 if (d) {
  while (1) {
   c = c + -1 | 0;
   a = (d >>> 0) / 10 | 0;
   n[c | 0] = d - v(a, 10) | 48;
   b = d >>> 0 > 9;
   d = a;
   if (b) {
    continue;
   }
   break;
  }
 }
 return c;
}
function _d(a, b) {
 a : {
  if ((b | 0) >= 1024) {
   a = a * 8.98846567431158e+307;
   if ((b | 0) < 2047) {
    b = b + -1023 | 0;
    break a;
   }
   a = a * 8.98846567431158e+307;
   b = ((b | 0) < 3069 ? b : 3069) + -2046 | 0;
   break a;
  }
  if ((b | 0) > -1023) {
   break a;
  }
  a = a * 2.2250738585072014e-308;
  if ((b | 0) > -2045) {
   b = b + 1022 | 0;
   break a;
  }
  a = a * 2.2250738585072014e-308;
  b = ((b | 0) > -3066 ? b : -3066) + 2044 | 0;
 }
 f(0, 0);
 f(1, b + 1023 << 20);
 return a * +g();
}
function Hp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 re(a, b);
 a : {
  if (!ob(b, 128)) {
   break a;
  }
  b = a + 164 | 0;
  e = c, f = Oa(b), p[e + 8 >> 2] = f;
  e = c, f = Qa(b), p[e >> 2] = f;
  while (1) {
   if (!Sa(c + 8 | 0, c)) {
    break a;
   }
   b = p[p[p[c + 8 >> 2] >> 2] + 52 >> 2];
   d = t[a + 112 >> 2];
   if (t[b + 4 >> 2] != d) {
    t[b + 4 >> 2] = d;
    m[p[p[b >> 2] >> 2]](b);
   }
   Ra(c + 8 | 0);
   continue;
  }
 }
 sa = c + 16 | 0;
}
function Cc(a, b, c, d) {
 var e = 0, f = 0;
 e = m[p[d >> 2]](p[b >> 2], p[a >> 2]) | 0;
 f = m[p[d >> 2]](p[c >> 2], p[b >> 2]) | 0;
 a : {
  b : {
   if (!e) {
    e = 0;
    if (!f) {
     break a;
    }
    Wa(b, c);
    e = 1;
    if (!(m[p[d >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
     break a;
    }
    Wa(a, b);
    break b;
   }
   if (f) {
    Wa(a, c);
    return 1;
   }
   Wa(a, b);
   e = 1;
   if (!(m[p[d >> 2]](p[c >> 2], p[b >> 2]) | 0)) {
    break a;
   }
   Wa(b, c);
  }
  e = 2;
 }
 return e;
}
function Gl(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0;
 b = sa - 48 | 0;
 sa = b;
 c = bb(b + 32 | 0);
 Fl(b + 8 | 0, a);
 d = Dl(b + 8 | 0);
 Cb(b + 8 | 0);
 Cl(c, d);
 p[b + 12 >> 2] = p[c >> 2];
 p[b + 8 >> 2] = d;
 d = Bl(b + 24 | 0, b + 8 | 0);
 yl(p[d >> 2], a);
 a = ns(b + 8 | 0, p[c >> 2], Zb(c));
 p[b + 4 >> 2] = 0;
 go(a, b + 4 | 0);
 a = p[b + 4 >> 2];
 Cb(d);
 Yf(c);
 if (p[c >> 2]) {
  Nf(c, p[c >> 2]);
  Ma(c);
  d = p[c >> 2];
  hc(c);
  Ua(d);
 }
 sa = b + 48 | 0;
 return a | 0;
}
function lq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 d = 1;
 a : {
  if (!(m[p[p[b >> 2] >> 2]](b, p[a + 4 >> 2]) | 0)) {
   break a;
  }
  a = a + 8 | 0;
  e = c, f = Oa(a), p[e + 8 >> 2] = f;
  e = c, f = Qa(a), p[e >> 2] = f;
  while (1) {
   if (Sa(c + 8 | 0, c)) {
    a = p[p[c + 8 >> 2] >> 2];
    m[p[p[a >> 2] + 20 >> 2]](a, b) | 0;
    Ra(c + 8 | 0);
    continue;
   }
   break;
  }
  d = 0;
 }
 a = d;
 sa = c + 16 | 0;
 return a | 0;
}
function ho(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 a : {
  a = a + 136 | 0;
  d = ab(a);
  if (!d) {
   break a;
  }
  m[p[p[b >> 2] + 8 >> 2]](b);
  e = c, f = Oa(a), p[e + 8 >> 2] = f;
  e = c, f = Qa(a), p[e >> 2] = f;
  while (1) {
   if (!Sa(c + 8 | 0, c)) {
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   if (q[a + 56 | 0]) {
    m[p[p[b >> 2] + 24 >> 2]](b, p[a + 76 >> 2]);
   }
   Ra(c + 8 | 0);
   continue;
  }
 }
 sa = c + 16 | 0;
 return (d | 0) != 0;
}
function Os(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  b : {
   c : {
    switch (b + -63 | 0) {
    case 0:
     e = a, f = w(Na(c)), t[e + 4 >> 2] = f;
     break b;
    case 1:
     e = a, f = w(Na(c)), t[e + 8 >> 2] = f;
     break b;
    case 2:
     e = a, f = w(Na(c)), t[e + 12 >> 2] = f;
     break b;
    case 3:
     break c;
    default:
     break a;
    }
   }
   e = a, f = w(Na(c)), t[e + 16 >> 2] = f;
  }
  d = 1;
 }
 return d | 0;
}
function Al(a, b) {
 var c = 0, d = 0;
 d = sa - 32 | 0;
 sa = d;
 a : {
  if (p[Ma(a) >> 2] - p[a + 4 >> 2] >>> 0 >= b >>> 0) {
   Qj(a, b);
   break a;
  }
  c = Ma(a);
  c = Oj(d + 8 | 0, Pj(a, Zb(a) + b | 0), Zb(a), c);
  Nj(c, b);
  Mj(a, c);
  a = c;
  b = p[a + 4 >> 2];
  while (1) {
   if (p[a + 8 >> 2] != (b | 0)) {
    p[a + 8 >> 2] = p[a + 8 >> 2] + -1;
    continue;
   }
   break;
  }
  if (p[c >> 2]) {
   a = p[c >> 2];
   p[Va(c) >> 2];
   Ua(a);
  }
 }
 sa = d + 32 | 0;
}
function Ff(a, b, c) {
 var d = 0, e = 0, f = 0;
 e = sa - 16 | 0;
 sa = e;
 if (4294967279 >= c >>> 0) {
  a : {
   if (c >>> 0 <= 10) {
    Ji(a, c);
    d = a;
    break a;
   }
   f = xu(c) + 1 | 0;
   d = f;
   if (4294967295 < d >>> 0) {
    Mb();
    E();
   }
   d = La(d);
   p[a >> 2] = d;
   p[a + 8 >> 2] = f | -2147483648;
   p[a + 4 >> 2] = c;
  }
  if (c) {
   Pb(d, b, c);
  }
  n[e + 15 | 0] = 0;
  Ii(c + d | 0, e + 15 | 0);
  sa = e + 16 | 0;
  return;
 }
 Mb();
 E();
}
function Xu(a) {
 var b = w(0), c = w(0), d = 0, f = 0;
 d = (i(a), e(2));
 f = d >>> 23 & 255;
 if (f >>> 0 <= 149) {
  if (f >>> 0 <= 125) {
   return w(a * w(0));
  }
  a = (d | 0) > -1 ? a : w(-a);
  b = w(w(w(a + w(8388608)) + w(-8388608)) - a);
  a : {
   if (!(b > w(.5) ^ 1)) {
    c = w(w(a + b) + w(-1));
    break a;
   }
   a = w(a + b);
   c = a;
   if (b <= w(-.5) ^ 1) {
    break a;
   }
   c = w(a + w(1));
  }
  a = c;
  a = (d | 0) > -1 ? a : w(-a);
 }
 return a;
}
function Oo(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 104 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   _b(c, a);
   d = lc(c, b);
   ub(c);
   if (d) {
    break a;
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Mo(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 116 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   _b(c, a);
   d = lc(c, b);
   ub(c);
   if (d) {
    break a;
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Vn(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 4 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Qa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Sa(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   _b(c, a);
   d = lc(c, b);
   ub(c);
   if (d) {
    break a;
   }
   Ra(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function ip(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = w(0), f = w(0);
 if (ob(b, 8)) {
  d = t[a + 164 >> 2];
  f = t[a + 156 >> 2];
  c = a + 168 | 0;
  e = w(t[a + 152 >> 2] * w(-t[a + 160 >> 2]));
  Ab(c, w(e + w(t[a + 152 >> 2] * w(.5))));
  d = w(f * w(-d));
  zb(c, d);
  c = a + 232 | 0;
  Ab(c, w(e + t[a + 152 >> 2]));
  zb(c, w(d + t[a + 156 >> 2]));
  c = a + 296 | 0;
  Ab(c, e);
  zb(c, w(d + t[a + 156 >> 2]));
 }
 Hc(a, b);
}
function zt(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 44 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Qa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Sa(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 20 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Ra(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function yt(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 44 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Qa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Sa(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 24 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Ra(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function vl(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 8 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Qa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Sa(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 24 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Ra(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function El(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 8 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Qa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Sa(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 20 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Ra(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function bp(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa + -64 | 0;
 sa = b;
 d = Zg(b + 24 | 0);
 c = a + 128 | 0;
 Mg(d, a, c);
 e = b, f = Oa(c), p[e + 16 >> 2] = f;
 e = b, f = Qa(c), p[e + 8 >> 2] = f;
 c = 0;
 while (1) {
  if (Sa(b + 16 | 0, b + 8 | 0)) {
   p[p[p[b + 16 >> 2] >> 2] + 36 >> 2] = c;
   c = c + 1 | 0;
   Ra(b + 16 | 0);
   continue;
  } else {
   Id(a + 44 | 0, 2);
   Wg(d);
   sa = b - -64 | 0;
  }
  break;
 }
}
function gr(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Lq(d + 8 | 0, Mq(a, qc(a) + 1 | 0), qc(a), c);
 Bh(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 3;
 Kq(a, c);
 a = c;
 b = p[c + 4 >> 2];
 while (1) {
  if (p[a + 8 >> 2] != (b | 0)) {
   p[a + 8 >> 2] = p[a + 8 >> 2] + -3;
   continue;
  }
  break;
 }
 if (p[c >> 2]) {
  a = p[c >> 2];
  p[Va(c) >> 2];
  Ua(a);
 }
 sa = d + 32 | 0;
}
function Ml(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0), f = 0;
 a : {
  switch (b + -114 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 52 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(Na(c)), t[d + 56 >> 2] = e;
   return 1;
  case 3:
   d = a, f = ec(c), p[d + 60 >> 2] = f;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function tj() {
 ga(21572, 16165);
 fa(21739, 16170, 1, 1, 0);
 nv();
 mv();
 lv();
 kv();
 jv();
 iv();
 hv();
 fv();
 ev();
 dv();
 cv();
 X(21616, 16276);
 X(21765, 16288);
 T(21766, 4, 16321);
 T(21767, 2, 16334);
 T(21768, 4, 16349);
 ea(21556, 16364);
 bv();
 sj(16410);
 rj(16447);
 qj(16486);
 pj(16517);
 oj(16557);
 mj(16586);
 av();
 $u();
 sj(16693);
 rj(16725);
 qj(16758);
 pj(16791);
 oj(16825);
 mj(16858);
 _u();
 Zu();
}
function yf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -15 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 52 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(Na(c)), t[d + 56 >> 2] = e;
   return 1;
  case 3:
   d = a, e = w(Na(c)), t[d + 60 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function Mr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -84 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 80 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 84 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(Na(c)), t[d + 88 >> 2] = e;
   return 1;
  case 3:
   d = a, e = w(Na(c)), t[d + 92 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return ad(a, b, c) | 0;
}
function Fg(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 4 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Qa(c), p[e >> 2] = f;
 while (1) {
  if (!Sa(b + 8 | 0, b)) {
   a = p[a >> 2];
   if (a) {
    m[p[p[a >> 2] + 4 >> 2]](a);
   }
   ib(c);
   sa = b + 16 | 0;
   return;
  }
  d = p[p[b + 8 >> 2] >> 2];
  if (d) {
   m[p[p[d >> 2] + 4 >> 2]](d);
  }
  Ra(b + 8 | 0);
  continue;
 }
}
function $m(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0), f = 0;
 a : {
  switch (b + -47 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 56 >> 2] = e;
   return 1;
  case 1:
   d = a, f = ec(c), p[d + 60 >> 2] = f;
   return 1;
  case 2:
   d = a, f = ec(c), p[d + 64 >> 2] = f;
   return 1;
  case 3:
   d = a, f = Dc(c), n[d + 68 | 0] = f;
   return 1;
  default:
   break a;
  }
 }
 return we(a, b, c) | 0;
}
function je(a, b, c, d, e, f) {
 var g = 0;
 g = ke(a, b, c, d, f);
 if (m[p[f >> 2]](p[e >> 2], p[d >> 2]) | 0) {
  Wa(d, e);
  if (!(m[p[f >> 2]](p[d >> 2], p[c >> 2]) | 0)) {
   return g + 1 | 0;
  }
  Wa(c, d);
  if (!(m[p[f >> 2]](p[c >> 2], p[b >> 2]) | 0)) {
   return g + 2 | 0;
  }
  Wa(b, c);
  if (!(m[p[f >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
   return g + 3 | 0;
  }
  Wa(a, b);
  g = g + 4 | 0;
 }
 return g;
}
function Hm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -110 | 0) {
  case 0:
   d = a, e = ec(c), p[d + 64 >> 2] = e;
   return 1;
  case 1:
   d = a, e = ec(c), p[d + 68 >> 2] = e;
   return 1;
  case 2:
   d = a, e = ec(c), p[d + 72 >> 2] = e;
   return 1;
  case 3:
   d = a, e = ec(c), p[d + 76 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return zi(a, b, c) | 0;
}
function Ni(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 1604;
 c = a + 44 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Qa(c), p[e >> 2] = f;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   d = p[p[b + 8 >> 2] >> 2];
   if (d) {
    m[p[p[d >> 2] + 4 >> 2]](d);
   }
   Ra(b + 8 | 0);
   continue;
  }
  break;
 }
 ib(c);
 Df(a);
 sa = b + 16 | 0;
 return a | 0;
}
function tp(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 n[b + 15 | 0] = q[a | 0];
 a = a + 4 | 0;
 c = b, d = Oa(a), p[c + 8 >> 2] = d;
 c = b, d = Qa(a), p[c >> 2] = d;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   a = p[p[b + 8 >> 2] >> 2];
   gh(b + 15 | 0, m[p[p[a >> 2] + 60 >> 2]](a) | 0);
   Ra(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
   a = q[b + 15 | 0];
  }
  break;
 }
 return a;
}
function Wp(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 a : {
  b = m[p[p[b >> 2] + 76 >> 2]](b, p[a + 4 >> 2]) | 0;
  if (!b) {
   break a;
  }
  a = a + 8 | 0;
  f = e, g = Oa(a), p[f + 8 >> 2] = g;
  f = e, g = Qa(a), p[f >> 2] = g;
  while (1) {
   if (!Sa(e + 8 | 0, e)) {
    break a;
   }
   Sl(p[p[e + 8 >> 2] >> 2], b, c, d);
   Ra(e + 8 | 0);
   continue;
  }
 }
 sa = e + 16 | 0;
}
function Ep(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 rh(a + 176 | 0);
 se(a);
 c = a + 164 | 0;
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Qa(c), p[d >> 2] = e;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   c = p[p[p[b + 8 >> 2] >> 2] + 48 >> 2];
   m[p[p[c >> 2] + 20 >> 2]](c, p[a + 128 >> 2]);
   Ra(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function kj(a, b) {
 var c = 0, d = 0, i = 0;
 h(+a);
 c = e(1) | 0;
 d = e(0) | 0;
 i = c;
 c = c >>> 20 & 2047;
 if ((c | 0) != 2047) {
  if (!c) {
   c = b;
   if (a == 0) {
    b = 0;
   } else {
    a = kj(a * 0x10000000000000000, b);
    b = p[b >> 2] + -64 | 0;
   }
   p[c >> 2] = b;
   return a;
  }
  p[b >> 2] = c + -1022;
  f(0, d | 0);
  f(1, i & -2146435073 | 1071644672);
  a = +g();
 }
 return a;
}
function Ku(a, b) {
 var c = 0, d = 0;
 c = sa - 160 | 0;
 sa = c;
 Pb(c + 8 | 0, 20360, 144);
 p[c + 52 >> 2] = a;
 p[c + 28 >> 2] = a;
 d = -2 - a | 0;
 d = 2147483647 > d >>> 0 ? d : 2147483647;
 p[c + 56 >> 2] = d;
 a = a + d | 0;
 p[c + 36 >> 2] = a;
 p[c + 24 >> 2] = a;
 jj(c + 8 | 0, 16162, b, 897, 898);
 if (d) {
  a = p[c + 28 >> 2];
  n[a - ((a | 0) == p[c + 24 >> 2]) | 0] = 0;
 }
 sa = c + 160 | 0;
}
function gg(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 1200;
 c = a + 8 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Qa(c), p[e >> 2] = f;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   d = p[p[b + 8 >> 2] >> 2];
   if (d) {
    m[p[p[d >> 2] + 4 >> 2]](d);
   }
   Ra(b + 8 | 0);
   continue;
  }
  break;
 }
 ib(c);
 sa = b + 16 | 0;
 return a | 0;
}
function _h(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 1088;
 c = a + 8 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Qa(c), p[e >> 2] = f;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   d = p[p[b + 8 >> 2] >> 2];
   if (d) {
    m[p[p[d >> 2] + 4 >> 2]](d);
   }
   Ra(b + 8 | 0);
   continue;
  }
  break;
 }
 ib(c);
 sa = b + 16 | 0;
 return a | 0;
}
function uf(a, b, c) {
 var d = w(0), e = w(0), f = w(0), g = w(0), h = w(0), i = 0, j = w(0);
 g = t[Ja(b, 0) >> 2];
 h = t[Ja(b, 1) >> 2];
 d = t[Ja(c, 0) >> 2];
 e = t[Ja(c, 2) >> 2];
 f = t[Ja(c, 4) >> 2];
 i = Ja(a, 0), j = w(f + w(w(g * d) + w(h * e))), t[i >> 2] = j;
 d = t[Ja(c, 1) >> 2];
 e = t[Ja(c, 3) >> 2];
 f = t[Ja(c, 5) >> 2];
 i = Ja(a, 1), j = w(f + w(w(g * d) + w(h * e))), t[i >> 2] = j;
}
function kd(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0;
 a : {
  b : {
   c : {
    switch (b + -67 | 0) {
    case 0:
     e = a, f = ec(c), p[e + 4 >> 2] = f;
     break b;
    case 1:
     e = a, f = ec(c), p[e + 8 >> 2] = f;
     break b;
    case 2:
     break c;
    default:
     break a;
    }
   }
   e = a, f = ec(c), p[e + 12 >> 2] = f;
  }
  d = 1;
 }
 return d | 0;
}
function lr(a, b) {
 var c = 0;
 a : {
  if (t[Ja(a, 0) >> 2] != t[Ja(b, 0) >> 2]) {
   break a;
  }
  if (t[Ja(a, 1) >> 2] != t[Ja(b, 1) >> 2]) {
   break a;
  }
  if (t[Ja(a, 2) >> 2] != t[Ja(b, 2) >> 2]) {
   break a;
  }
  if (t[Ja(a, 3) >> 2] != t[Ja(b, 3) >> 2]) {
   break a;
  }
  if (t[Ja(a, 4) >> 2] != t[Ja(b, 4) >> 2]) {
   break a;
  }
  c = t[Ja(a, 5) >> 2] == t[Ja(b, 5) >> 2];
 }
 return c;
}
function es(a, b) {
 var c = 0, d = 0, e = 0;
 c = p[Ja(b, 0) >> 2];
 d = Ja(a, 0), e = c, p[d >> 2] = e;
 c = p[Ja(b, 1) >> 2];
 d = Ja(a, 1), e = c, p[d >> 2] = e;
 c = p[Ja(b, 2) >> 2];
 d = Ja(a, 2), e = c, p[d >> 2] = e;
 c = p[Ja(b, 3) >> 2];
 d = Ja(a, 3), e = c, p[d >> 2] = e;
 c = p[Ja(b, 4) >> 2];
 d = Ja(a, 4), e = c, p[d >> 2] = e;
 b = p[Ja(b, 5) >> 2];
 d = Ja(a, 5), e = b, p[d >> 2] = e;
}
function Oe(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 5168;
 c = a + 140 | 0;
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Qa(c), p[d >> 2] = e;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   c = p[p[b + 8 >> 2] >> 2];
   if (c) {
    m[p[p[c >> 2] + 4 >> 2]](c);
   }
   Ra(b + 8 | 0);
   continue;
  }
  break;
 }
 nc(a);
 sa = b + 16 | 0;
 return a | 0;
}
function xo(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 f = sa - 16 | 0;
 sa = f;
 h = p[a + 4 >> 2];
 g = (h - d | 0) + b | 0;
 e = Hd(f, a, c - g >> 2);
 d = g;
 while (1) {
  if (d >>> 0 < c >>> 0) {
   kc(Ma(a), p[e + 4 >> 2], d);
   p[e + 4 >> 2] = p[e + 4 >> 2] + 4;
   d = d + 4 | 0;
   continue;
  }
  break;
 }
 Sb(e);
 a = g - b | 0;
 if (a) {
  aj(h - a | 0, b, a);
 }
 sa = f + 16 | 0;
}
function zu(a, b, c) {
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 b = b - a >> 2;
 while (1) {
  if (b) {
   p[d + 12 >> 2] = a;
   e = b >>> 1 | 0;
   p[d + 12 >> 2] = p[d + 12 >> 2] + (e << 2);
   if (ve(p[d + 12 >> 2], c)) {
    a = p[d + 12 >> 2] + 4 | 0;
    p[d + 12 >> 2] = a;
    b = (e ^ -1) + b | 0;
   } else {
    b = e;
   }
   continue;
  }
  break;
 }
 sa = d + 16 | 0;
 return a;
}
function lc(a, b) {
 var c = 0, d = 0, e = 0;
 c = Vc(a);
 a : {
  if ((c | 0) != (Vc(b) | 0)) {
   break a;
  }
  d = Fc(a);
  b = Fc(b);
  if (!Kc(a)) {
   while (1) {
    e = !c;
    if (!c | q[d | 0] != q[b | 0]) {
     break a;
    }
    b = b + 1 | 0;
    d = d + 1 | 0;
    c = c + -1 | 0;
    continue;
   }
  }
  if (c) {
   a = Iu(d, b, c);
  } else {
   a = 0;
  }
  e = !a;
 }
 return e;
}
function yb(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 a : {
  b : {
   c : {
    switch (b + -4 | 0) {
    case 0:
     td(d, c);
     Cf(a + 4 | 0, d);
     ub(d);
     break b;
    case 1:
     break c;
    default:
     break a;
    }
   }
   f = a, g = ec(c), p[f + 16 >> 2] = g;
  }
  e = 1;
 }
 sa = d + 16 | 0;
 return e | 0;
}
function ls(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 c = sa;
 f = c;
 e = ec(b);
 g = ta;
 a : {
  if (q[b + 8 | 0]) {
   yi(a);
   break a;
  }
  d = c;
  c = e;
  d = d - (c + 15 & -16) | 0;
  sa = d;
  c = ks(c & 255, p[b >> 2], p[b + 4 >> 2], d);
  b : {
   if ((e | 0) != (c | 0) | g) {
    gd(b);
    yi(a);
    break b;
   }
   p[b >> 2] = c + p[b >> 2];
   Yd(a, d);
  }
 }
 sa = f;
}
function $n(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = b, d = Cg(a), p[c + 8 >> 2] = d;
 c = b, d = Lc(), p[c >> 2] = d;
 while (1) {
  a : {
   if (!Kd(b + 8 | 0, b)) {
    a = 0;
    break a;
   }
   a = p[Wb(b + 8 | 0) + 4 >> 2];
   a = m[p[p[a >> 2] + 8 >> 2]](a) | 0;
   if (a) {
    break a;
   }
   ue(b + 8 | 0);
   continue;
  }
  break;
 }
 sa = b + 16 | 0;
 return a;
}
function sp(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 a = a + 4 | 0;
 c = b, d = Oa(a), p[c + 8 >> 2] = d;
 c = b, d = Qa(a), p[c >> 2] = d;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   a = p[p[b + 8 >> 2] >> 2];
   if (Me(a)) {
    a = p[a + 72 >> 2];
    if (a) {
     m[p[p[a >> 2] + 4 >> 2]](a);
    }
   }
   Ra(b + 8 | 0);
   continue;
  }
  break;
 }
 sa = b + 16 | 0;
}
function pw(a, b, c, d, e, f, g) {
 a = a | 0;
 b = w(b);
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 var h = 0;
 h = sa - 32 | 0;
 sa = h;
 t[h + 24 >> 2] = c;
 t[h + 28 >> 2] = b;
 t[h + 20 >> 2] = d;
 t[h + 16 >> 2] = e;
 t[h + 12 >> 2] = f;
 t[h + 8 >> 2] = g;
 gw(p[a + 8 >> 2], h + 28 | 0, h + 24 | 0, h + 20 | 0, h + 16 | 0, h + 12 | 0, h + 8 | 0);
 sa = h + 32 | 0;
}
function Xp(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = w(0), f = w(0), g = 0;
 d = a + 140 | 0;
 e = w(t[a + 152 >> 2] * w(.5));
 f = w(t[a + 156 >> 2] * w(.5));
 g = 6.283185307179586 / +p[a + 168 >> 2];
 b = -1.5707963267948966;
 while (1) {
  if ((c | 0) < p[a + 168 >> 2]) {
   Ne(a, p[Pa(d, c) >> 2], f, e, w(b));
   c = c + 1 | 0;
   b = g + b;
   continue;
  }
  break;
 }
}
function aq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 8 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Qa(a), p[d >> 2] = e;
 while (1) {
  if (Sa(c + 8 | 0, c)) {
   a = p[p[c + 8 >> 2] >> 2];
   m[p[p[a >> 2] + 24 >> 2]](a, b) | 0;
   Ra(c + 8 | 0);
   continue;
  } else {
   sa = c + 16 | 0;
  }
  break;
 }
 return 0;
}
function Hr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0;
 e = sa - 16 | 0;
 sa = e;
 ph(a, b, c);
 d = p[a + 56 >> 2];
 f = Ib(e + 8 | 0, ii(a));
 wf(t[Ja(f, 0) >> 2], t[Ja(f, 1) >> 2], p[d + 68 >> 2], p[d + 64 >> 2], b, c, ji(d));
 a = Ib(e, hi(a));
 wf(t[Ja(a, 0) >> 2], t[Ja(a, 1) >> 2], p[d + 76 >> 2], p[d + 72 >> 2], b, c, cc(d));
 sa = e + 16 | 0;
}
function xm(a) {
 var b = 0, c = w(0), d = 0, e = w(0);
 b = a - -64 | 0;
 a : {
  if (t[a + 48 >> 2] != w(0)) {
   fs(b, t[a + 48 >> 2]);
   break a;
  }
  qi(b);
 }
 c = w(m[p[p[a >> 2] + 72 >> 2]](a));
 b = a - -64 | 0;
 d = Ja(b, 4), e = c, t[d >> 2] = e;
 c = w(m[p[p[a >> 2] + 76 >> 2]](a));
 d = Ja(b, 5), e = c, t[d >> 2] = e;
 ds(b, t[a + 52 >> 2], t[a + 56 >> 2]);
}
function Li(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 a = a + 44 | 0;
 f = e, g = Oa(a), p[f + 8 >> 2] = g;
 f = e, g = Qa(a), p[f >> 2] = g;
 while (1) {
  if (Sa(e + 8 | 0, e)) {
   Wp(p[p[e + 8 >> 2] >> 2], b, c, d);
   Ra(e + 8 | 0);
   continue;
  } else {
   sa = e + 16 | 0;
  }
  break;
 }
}
function Rr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -79 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 80 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 84 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(Na(c)), t[d + 88 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return ad(a, b, c) | 0;
}
function Bs(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 e = c, f = Oa(b), p[e + 8 >> 2] = f;
 e = c, f = Qa(b), p[e >> 2] = f;
 b = a + 72 | 0;
 while (1) {
  if (Sa(c + 8 | 0, c)) {
   d = p[p[c + 8 >> 2] >> 2];
   m[p[p[d >> 2] + 60 >> 2]](d, b, p[a + 108 >> 2]);
   Ra(c + 8 | 0);
   continue;
  } else {
   sa = c + 16 | 0;
  }
  break;
 }
}
function yo(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Sc(a + 12 | 0, d);
 if (b) {
  if (1073741823 < b >>> 0) {
   Mb();
   E();
  }
  f = La(b << 2);
 }
 p[a >> 2] = f;
 c = (c << 2) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Va(a), h = (b << 2) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function Ve(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Sc(a + 12 | 0, d);
 if (b) {
  if (536870911 < b >>> 0) {
   Mb();
   E();
  }
  f = La(b << 3);
 }
 p[a >> 2] = f;
 c = (c << 3) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Va(a), h = (b << 3) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function Lq(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Sc(a + 12 | 0, d);
 if (b) {
  if (1431655765 < b >>> 0) {
   Mb();
   E();
  }
  f = La(v(b, 3));
 }
 p[a >> 2] = f;
 c = v(c, 3) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Va(a), h = v(b, 3) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function Eb(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0;
 c = b ? b + -72 | 0 : 0;
 p[a + 40 >> 2] = c;
 a : {
  if ((a | 0) == (c | 0)) {
   break a;
  }
  d = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 16 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!(m[p[p[b >> 2] + 12 >> 2]](b, 11) | 0)) {
   break a;
  }
  p[a + 20 >> 2] = b;
  d = 0;
 }
 return d | 0;
}
function Uu(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0;
 e = sa - 16 | 0;
 sa = e;
 a : {
  if (!Gf($(p[a + 60 >> 2], b | 0, c | 0, d & 255, e + 8 | 0) | 0)) {
   b = p[e + 12 >> 2];
   a = p[e + 8 >> 2];
   break a;
  }
  p[e + 8 >> 2] = -1;
  p[e + 12 >> 2] = -1;
  b = -1;
  a = -1;
 }
 sa = e + 16 | 0;
 ta = b;
 return a | 0;
}
function rh(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 Rb(p[a + 48 >> 2], a);
 c = Qe(p[a + 48 >> 2]);
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Qa(c), p[d >> 2] = e;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   Rb(p[p[b + 8 >> 2] >> 2], a);
   Ra(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function Qj(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c >> 2] = a;
 d = p[a + 4 >> 2];
 p[c + 4 >> 2] = d;
 p[c + 8 >> 2] = b + d;
 b = c;
 d = p[b + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (d | 0)) {
   Ma(a);
   Pc(p[b + 4 >> 2]);
   d = p[b + 4 >> 2] + 1 | 0;
   p[b + 4 >> 2] = d;
   continue;
  }
  break;
 }
 Sb(b);
 sa = c + 16 | 0;
}
function Wr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -92 | 0) {
  case 0:
   d = a, e = ec(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = ec(c), p[d + 52 >> 2] = e;
   return 1;
  case 2:
   d = a, e = Dc(c), n[d + 56 | 0] = e;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function $s(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -151 | 0) {
  case 0:
   d = a, e = ec(c), p[d + 4 >> 2] = e;
   return 1;
  case 1:
   d = a, e = ec(c), p[d + 8 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 if ((b | 0) != 158) {
  return 0;
 }
 d = a, e = ec(c), p[d + 12 >> 2] = e;
 return 1;
}
function xb(a, b, c, d, e) {
 var f = 0;
 f = sa - 256 | 0;
 sa = f;
 if (!(e & 73728 | (c | 0) <= (d | 0))) {
  c = c - d | 0;
  d = c >>> 0 < 256;
  eb(f, b & 255, d ? c : 256);
  if (!d) {
   while (1) {
    nb(a, f, 256);
    c = c + -256 | 0;
    if (c >>> 0 > 255) {
     continue;
    }
    break;
   }
  }
  nb(a, f, c);
 }
 sa = f + 256 | 0;
}
function To(a, b) {
 a = a | 0;
 b = b | 0;
 if (ob(b, 4)) {
  Zo(a);
 }
 if (ob(b, 8)) {
  b = p[a + 172 >> 2];
  m[p[p[b >> 2] + 8 >> 2]](b);
  Tg(p[a + 172 >> 2], w(0), w(0), t[a + 48 >> 2], t[a + 52 >> 2]);
  Tg(p[a + 168 >> 2], w(t[a + 64 >> 2] * w(-t[a + 48 >> 2])), w(t[a + 68 >> 2] * w(-t[a + 52 >> 2])), t[a + 48 >> 2], t[a + 52 >> 2]);
 }
}
function re(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0);
 if (ob(b, 32)) {
  xm(a);
 }
 if (ob(b, 64)) {
  wm(a);
 }
 a : {
  if (!ob(b, 128)) {
   break a;
  }
  t[a + 112 >> 2] = t[a + 60 >> 2];
  b = p[a + 116 >> 2];
  if (!b) {
   break a;
  }
  c = a, d = w(w(m[p[p[b >> 2] + 68 >> 2]](b)) * t[a + 112 >> 2]), t[c + 112 >> 2] = d;
 }
}
function Oj(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Sc(a + 12 | 0, d);
 if (b) {
  if (4294967295 < b >>> 0) {
   Mb();
   E();
  }
  f = La(b);
 }
 p[a >> 2] = f;
 c = c + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Va(a), h = b + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function _n(a) {
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 d = b, e = Cg(a), p[d + 8 >> 2] = e;
 d = b, e = Lc(), p[d >> 2] = e;
 while (1) {
  if (Kd(b + 8 | 0, b)) {
   c = p[Wb(b + 8 | 0) + 4 >> 2];
   if (c) {
    m[p[p[c >> 2] + 4 >> 2]](c);
   }
   ue(b + 8 | 0);
   continue;
  }
  break;
 }
 Wc(a);
 sa = b + 16 | 0;
}
function si(a, b) {
 var c = 0, d = 0;
 c = a, d = p[Ja(b, 0) >> 2], p[c >> 2] = d;
 c = a, d = p[Ja(b, 1) >> 2], p[c + 4 >> 2] = d;
 c = a, d = p[Ja(b, 2) >> 2], p[c + 8 >> 2] = d;
 c = a, d = p[Ja(b, 3) >> 2], p[c + 12 >> 2] = d;
 c = a, d = p[Ja(b, 4) >> 2], p[c + 16 >> 2] = d;
 c = a, d = p[Ja(b, 5) >> 2], p[c + 20 >> 2] = d;
 return a;
}
function Yl(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 if (q[a + 46 | 0]) {
  e = b;
  d = p[a + 72 >> 2];
  if (d) {
   c = m[p[p[d >> 2] >> 2]](d, c) | 0;
  }
  g = e, h = m[p[p[c >> 2] + 36 >> 2]](c) | 0, i = p[a + 48 >> 2], f = p[p[b >> 2] + 20 >> 2], m[f](g | 0, h | 0, i | 0);
 }
}
function Ph(a, b, c, d, e, f, g) {
 a = a | 0;
 b = w(b);
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 var h = 0, i = 0;
 h = sa - 16 | 0;
 sa = h;
 i = a + 40 | 0;
 a = a + 4 | 0;
 cf(i, df(h + 8 | 0, 1, lb(a) & 255));
 Jc(a, cb(h + 8 | 0, b, c));
 Jc(a, cb(h + 8 | 0, d, e));
 Jc(a, cb(h + 8 | 0, f, g));
 sa = h + 16 | 0;
}
function Yb(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = w(0);
 c = sa - 16 | 0;
 sa = c;
 d = p[a >> 2];
 e = c;
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  d = p[p[b >> 2] + d >> 2];
 }
 g = e, h = w(m[d | 0](f)), t[g + 12 >> 2] = h;
 sa = c + 16 | 0;
 return w(t[c + 12 >> 2]);
}
function $r(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 60 | 0;
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Qa(c), p[d >> 2] = e;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   Rb(mi(p[p[b + 8 >> 2] >> 2]), a);
   Ra(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function gk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[a >> 2];
 e = c;
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  d = p[p[b >> 2] + d >> 2];
 }
 g = e, h = m[d | 0](f) | 0, p[g + 12 >> 2] = h;
 sa = c + 16 | 0;
 return p[c + 12 >> 2];
}
function ke(a, b, c, d, e) {
 var f = 0;
 f = Cc(a, b, c, e);
 if (m[p[e >> 2]](p[d >> 2], p[c >> 2]) | 0) {
  Wa(c, d);
  if (!(m[p[e >> 2]](p[c >> 2], p[b >> 2]) | 0)) {
   return f + 1 | 0;
  }
  Wa(b, c);
  if (!(m[p[e >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
   return f + 2 | 0;
  }
  Wa(a, b);
  f = f + 3 | 0;
 }
 return f;
}
function ro(a, b, c) {
 var d = 0;
 d = sa - 32 | 0;
 sa = d;
 p[d + 24 >> 2] = b;
 b = kh(d + 8 | 0, a + 8 | 0, qo(b, c));
 while (1) {
  if (p[b >> 2] != p[b + 4 >> 2]) {
   kc(p[a + 16 >> 2], p[b >> 2], p[d + 24 >> 2]);
   p[b >> 2] = p[b >> 2] + 4;
   Ra(d + 24 | 0);
   continue;
  }
  break;
 }
 Od(b);
 sa = d + 32 | 0;
}
function Sn(a) {
 var b = 0;
 Nn(a);
 b = a + 72 | 0;
 p[b >> 2] = 10912;
 ih(a + 76 | 0);
 p[a >> 2] = 6952;
 p[b >> 2] = 7040;
 bb(a + 92 | 0);
 bb(a + 104 | 0);
 bb(a + 116 | 0);
 bb(a + 128 | 0);
 bb(a + 140 | 0);
 bb(a + 152 | 0);
 p[a + 172 >> 2] = 0;
 p[a + 176 >> 2] = 0;
 p[a + 164 >> 2] = 0;
 p[a + 168 >> 2] = 0;
}
function Ws(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 a = a + 124 | 0;
 c = b, d = Oa(a), p[c + 8 >> 2] = d;
 c = b, d = Qa(a), p[c >> 2] = d;
 while (1) {
  if (Sa(b + 8 | 0, b)) {
   ng(p[p[b + 8 >> 2] >> 2]);
   Ra(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function Iu(a, b, c) {
 var d = 0, e = 0, f = 0;
 a : {
  if (!c) {
   break a;
  }
  while (1) {
   d = q[a | 0];
   e = q[b | 0];
   if ((d | 0) == (e | 0)) {
    b = b + 1 | 0;
    a = a + 1 | 0;
    c = c + -1 | 0;
    if (c) {
     continue;
    }
    break a;
   }
   break;
  }
  f = d - e | 0;
 }
 return f;
}
function Ld(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Sc(a + 12 | 0, d);
 if (b) {
  f = Md(b);
 }
 p[a >> 2] = f;
 c = (c << 2) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Va(a), h = (b << 2) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function lh(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  switch (b + -125 | 0) {
  case 0:
   d = a, e = ec(c), p[d + 168 >> 2] = e;
   return 1;
  case 1:
   d = a, f = w(Na(c)), t[d + 172 >> 2] = f;
   return 1;
  default:
   break a;
  }
 }
 return mf(a, b, c) | 0;
}
function fs(a, b) {
 var c = w(0), d = 0, e = w(0), f = 0;
 c = yc(b);
 b = xc(b);
 d = Ja(a, 0), e = b, t[d >> 2] = e;
 d = Ja(a, 1), e = c, t[d >> 2] = e;
 d = Ja(a, 2), e = w(-c), t[d >> 2] = e;
 d = Ja(a, 3), e = b, t[d >> 2] = e;
 d = Ja(a, 4), f = 0, p[d >> 2] = f;
 d = Ja(a, 5), f = 0, p[d >> 2] = f;
}
function Mu(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = e | 0;
 f = w(f);
 var g = 0;
 d = w(w(d - t[a + 20 >> 2]) / w(t[e + 20 >> 2] - t[a + 20 >> 2]));
 g = p[a + 16 >> 2];
 if (g) {
  d = xg(g, d);
 }
 nj(b, c, f, w(t[a + 24 >> 2] + w(d * w(t[e + 24 >> 2] - t[a + 24 >> 2]))));
}
function Ih(a, b) {
 var c = 0, d = 0, e = w(0);
 c = sa - 16 | 0;
 sa = c;
 d = c, e = w(x(w(t[Ja(a, 0) >> 2] - t[Ja(b, 0) >> 2]))), t[d + 12 >> 2] = e;
 d = c, e = w(x(w(t[Ja(a, 1) >> 2] - t[Ja(b, 1) >> 2]))), t[d + 8 >> 2] = e;
 a = Tq(c + 12 | 0, c + 8 | 0);
 sa = c + 16 | 0;
 return t[a >> 2] > w(1);
}
function Vw(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 e = c >>> 16 | 0;
 d = a >>> 16 | 0;
 h = v(e, d);
 f = c & 65535;
 a = a & 65535;
 g = v(f, a);
 d = (g >>> 16 | 0) + v(d, f) | 0;
 a = (d & 65535) + v(a, e) | 0;
 ta = h + v(b, c) + (d >>> 16) + (a >>> 16) | 0;
 return g & 65535 | a << 16;
}
function Sm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  switch (b + -38 | 0) {
  case 0:
   d = a, e = fd(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, f = w(Na(c)), t[d + 52 >> 2] = f;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function Ik(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 a : {
  if (!p[a + 12 >> 2]) {
   break a;
  }
  c = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 12 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!(m[p[p[b >> 2] + 12 >> 2]](b, 28) | 0)) {
   break a;
  }
  p[a + 16 >> 2] = b;
  c = 0;
 }
 return c | 0;
}
function jf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -13 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 120 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 124 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return yf(a, b, c) | 0;
}
function Is(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -90 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 136 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 140 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return Fi(a, b, c) | 0;
}
function ad(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -24 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 52 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function Ir(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -82 | 0) {
  case 0:
   d = a, e = w(Na(c)), t[d + 80 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(Na(c)), t[d + 84 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return ad(a, b, c) | 0;
}
function im(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0), g = w(0), h = w(0), i = w(0);
 a = p[a + 76 >> 2];
 e = a, f = t[Ja(b, 0) >> 2], g = t[Ja(b, 1) >> 2], h = t[Ja(c, 0) >> 2], i = t[Ja(c, 1) >> 2], d = p[p[a >> 2] + 24 >> 2], m[d](e | 0, w(f), w(g), w(h), w(i));
}
function em(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0), g = w(0), h = w(0), i = w(0);
 a = p[a + 76 >> 2];
 e = a, f = t[Ja(b, 0) >> 2], g = t[Ja(b, 1) >> 2], h = t[Ja(c, 0) >> 2], i = t[Ja(c, 1) >> 2], d = p[p[a >> 2] + 28 >> 2], m[d](e | 0, w(f), w(g), w(h), w(i));
}
function ou(a) {
 var b = 0;
 b = q[a + 74 | 0];
 n[a + 74 | 0] = b + -1 | b;
 b = p[a >> 2];
 if (b & 8) {
  p[a >> 2] = b | 32;
  return -1;
 }
 p[a + 4 >> 2] = 0;
 p[a + 8 >> 2] = 0;
 b = p[a + 44 >> 2];
 p[a + 28 >> 2] = b;
 p[a + 20 >> 2] = b;
 p[a + 16 >> 2] = b + p[a + 48 >> 2];
 return 0;
}
function Cq(a, b) {
 a = a | 0;
 b = b | 0;
 b = ud(a, b);
 if (!b) {
  b = p[a + 20 >> 2];
  while (1) {
   a : {
    if (b) {
     if (!ni(b)) {
      break a;
     }
     p[a + 132 >> 2] = b;
     Ip(b, a);
    }
    return !b | 0;
   }
   b = p[b + 20 >> 2];
   continue;
  }
 }
 return b | 0;
}
function wc(a) {
 var b = 0, c = 0;
 b = p[5592];
 c = a + 3 & -4;
 a = b + c | 0;
 a : {
  if (a >>> 0 <= b >>> 0 ? (c | 0) >= 1 : 0) {
   break a;
  }
  if (a >>> 0 > ua() << 16 >>> 0) {
   if (!(ca(a | 0) | 0)) {
    break a;
   }
  }
  p[5592] = a;
  return b;
 }
 p[5449] = 48;
 return -1;
}
function nk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[a >> 2];
 e = c;
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  d = p[p[b >> 2] + d >> 2];
 }
 m[d | 0](e, f);
 a = gs(La(16), c);
 sa = c + 16 | 0;
 return a | 0;
}
function hk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[a >> 2];
 e = c;
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  d = p[d + p[b >> 2] >> 2];
 }
 m[d | 0](e, f);
 a = tv(c);
 ub(c);
 sa = c + 16 | 0;
 return a | 0;
}
function zi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -102 | 0) {
  case 0:
   d = a, e = ec(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = ec(c), p[d + 52 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function Go(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -119 | 0) {
  case 0:
   d = a, e = ec(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = ec(c), p[d + 52 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return yb(a, b, c) | 0;
}
function yw(a, b, c, d, e, f, g, h) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 h = w(h);
 var i = 0, j = 0;
 i = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 j = b;
 if (a & 1) {
  i = p[i + p[b >> 2] >> 2];
 }
 m[i | 0](j, c, d, e, f, g, h);
}
function ew(a, b, c, d, e, f, g) {
 var h = 0;
 h = sa - 16 | 0;
 sa = h;
 p[h + 12 >> 2] = a;
 Bb(h + 12 | 0, t[b >> 2]);
 Bb(h + 12 | 0, t[c >> 2]);
 Bb(h + 12 | 0, t[d >> 2]);
 Bb(h + 12 | 0, t[e >> 2]);
 Bb(h + 12 | 0, t[f >> 2]);
 Bb(h + 12 | 0, t[g >> 2]);
 sa = h + 16 | 0;
 return a;
}
function Xe(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Rq(a);
 if (d >>> 0 >= b >>> 0) {
  a = pc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Fb(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 hd();
 E();
}
function Pj(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Kj(a);
 if (d >>> 0 >= b >>> 0) {
  a = hc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Fb(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 hd();
 E();
}
function Mq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Jq(a);
 if (d >>> 0 >= b >>> 0) {
  a = oc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Fb(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 hd();
 E();
}
function Ad(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Eg(a);
 if (d >>> 0 >= b >>> 0) {
  a = mc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Fb(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 hd();
 E();
}
function yp(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  if ((b | 0) != 129) {
   if ((b | 0) != 23) {
    break a;
   }
   d = a, e = ec(c), p[d + 128 >> 2] = e;
   return 1;
  }
  d = a, e = ec(c), p[d + 132 >> 2] = e;
  return 1;
 }
 return jf(a, b, c) | 0;
}
function Tp(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Hd(c, a, b);
 d = p[b + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (d | 0)) {
   Ma(a);
   te(p[b + 4 >> 2]);
   d = p[b + 4 >> 2] + 4 | 0;
   p[b + 4 >> 2] = d;
   continue;
  }
  break;
 }
 Sb(b);
 sa = c + 16 | 0;
}
function Hq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Ye(c, a, b);
 d = p[b + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (d | 0)) {
   Ma(a);
   zh(p[b + 4 >> 2]);
   d = p[b + 4 >> 2] + 8 | 0;
   p[b + 4 >> 2] = d;
   continue;
  }
  break;
 }
 Sb(b);
 sa = c + 16 | 0;
}
function Tw(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0);
 b = 0;
 while (1) {
  if ((b | 0) != 11) {
   c = (b << 2) + a | 0, d = Pd(w(w(b | 0) * w(.10000000149011612)), t[a + 4 >> 2], t[a + 12 >> 2]), t[c + 20 >> 2] = d;
   b = b + 1 | 0;
   continue;
  }
  break;
 }
 return 0;
}
function ec(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = ms(p[a >> 2], p[a + 4 >> 2], b + 8 | 0);
 a : {
  if (!c) {
   gd(a);
   c = 0;
   a = 0;
   break a;
  }
  p[a >> 2] = p[a >> 2] + c;
  c = p[b + 12 >> 2];
  a = p[b + 8 >> 2];
 }
 sa = b + 16 | 0;
 ta = c;
 return a;
}
function dc(a, b, c, d) {
 var e = w(0), f = w(0), g = w(0), h = 0, i = w(0);
 e = t[Ja(b, 0) >> 2];
 f = t[Ja(b, 1) >> 2];
 g = t[Ja(c, 0) >> 2];
 h = Ja(a, 0), i = w(e + w(w(g - e) * d)), t[h >> 2] = i;
 e = t[Ja(c, 1) >> 2];
 h = Ja(a, 1), i = w(f + w(w(e - f) * d)), t[h >> 2] = i;
}
function Xn(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = c, e = Pn(a + 12 | 0, c + 12 | 0), p[d + 8 >> 2] = e;
 d = c, e = Lc(), p[d >> 2] = e;
 a = -1;
 if (!Mi(c + 8 | 0, c)) {
  a = p[Wb(c + 8 | 0) + 4 >> 2];
 }
 sa = c + 16 | 0;
 return a;
}
function Aw(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = e | 0;
 f = w(f);
 var g = 0;
 d = w(w(d - t[a + 20 >> 2]) / w(t[e + 20 >> 2] - t[a + 20 >> 2]));
 g = p[a + 16 >> 2];
 if (g) {
  d = xg(g, d);
 }
 Lf(b, c, f, jg(p[a + 24 >> 2], p[e + 24 >> 2], d));
}
function fr(a, b) {
 var c = 0, d = 0;
 d = sa - 32 | 0;
 sa = d;
 a : {
  if (p[Ma(a) >> 2] - p[a + 4 >> 2] >> 3 >>> 0 >= b >>> 0) {
   Hq(a, b);
   break a;
  }
  c = Ma(a);
  c = Ve(d + 8 | 0, Xe(a, lb(a) + b | 0), lb(a), c);
  Gq(c, b);
  Ch(a, c);
  Ue(c);
 }
 sa = d + 32 | 0;
}
function Zp(a, b) {
 var c = 0, d = 0;
 d = sa - 32 | 0;
 sa = d;
 a : {
  if (p[Ma(a) >> 2] - p[a + 4 >> 2] >> 2 >>> 0 >= b >>> 0) {
   Tp(a, b);
   break a;
  }
  c = Ma(a);
  c = Ld(d + 8 | 0, Ad(a, ab(a) + b | 0), ab(a), c);
  Sp(c, b);
  Ce(a, c);
  Tc(c);
 }
 sa = d + 32 | 0;
}
function vo(a, b, c) {
 var d = 0, e = 0, f = 0;
 We(a);
 e = p[b + 4 >> 2];
 d = b + 4 | 0;
 xd(Ma(a), p[a >> 2], c, d);
 f = c;
 c = b + 8 | 0;
 th(Ma(a), f, p[a + 4 >> 2], c);
 Wa(a, d);
 Wa(a + 4 | 0, c);
 Wa(Ma(a), Va(b));
 p[b >> 2] = p[b + 4 >> 2];
 ye(a, ab(a));
 return e;
}
function oo(a) {
 a = a | 0;
 var b = 0;
 a : {
  b : {
   b = p[a + 40 >> 2];
   b = m[p[p[b >> 2] + 76 >> 2]](b, p[a + 48 >> 2]) | 0;
   if (b) {
    if (Jd(b)) {
     break b;
    }
   }
   p[a + 52 >> 2] = 0;
   break a;
  }
  p[a + 52 >> 2] = b;
 }
 Db(p[a + 40 >> 2], 4, 0);
}
function Ac(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 e = p[a + 4 >> 2];
 b = (e >> 1) + b | 0;
 a = p[a >> 2];
 a = e & 1 ? p[p[b >> 2] + a >> 2] : a;
 Bj(d, c);
 a = m[a | 0](b, d) | 0;
 ub(d);
 sa = d + 16 | 0;
 return a | 0;
}
function zc(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 o[c + 14 >> 1] = b;
 d = c, e = Ui(a, c + 14 | 0), p[d + 8 >> 2] = e;
 d = c, e = Lc(), p[d >> 2] = e;
 a = 0;
 if (!Mi(c + 8 | 0, c)) {
  a = p[Wb(c + 8 | 0) + 4 >> 2];
 }
 sa = c + 16 | 0;
 return a;
}
function qi(a) {
 var b = 0, c = 0;
 b = Ja(a, 0), c = 1065353216, p[b >> 2] = c;
 b = Ja(a, 1), c = 0, p[b >> 2] = c;
 b = Ja(a, 2), c = 0, p[b >> 2] = c;
 b = Ja(a, 3), c = 1065353216, p[b >> 2] = c;
 b = Ja(a, 4), c = 0, p[b >> 2] = c;
 b = Ja(a, 5), c = 0, p[b >> 2] = c;
}
function Sw(a, b) {
 var c = 0;
 a : {
  b : {
   switch (b + -37 | 0) {
   default:
    c = 0;
    if ((b | 0) != 88) {
     break a;
    }
    return p[a + 24 >> 2];
   case 0:
    return p[a + 48 >> 2];
   case 1:
    break b;
   }
  }
  c = p[a + 48 >> 2];
 }
 return c;
}
function ko(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Eb(a, b);
 a : {
  if (c) {
   break a;
  }
  c = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!tf(b)) {
   break a;
  }
  p[a + 56 >> 2] = b;
  c = 0;
 }
 return c | 0;
}
function as(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Eb(a, b);
 a : {
  if (c) {
   break a;
  }
  c = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!sf(b)) {
   break a;
  }
  p[a + 72 >> 2] = b;
  c = 0;
 }
 return c | 0;
}
function Pg(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 b = Ma(b);
 a = Cd(a, La(16), Dd(e + 8 | 0, b, 0));
 Bo(p[a >> 2] + 8 | 0, p[d >> 2]);
 f = sb(a), g = 1, n[f + 4 | 0] = g;
 p[p[a >> 2] + 4 >> 2] = c;
 p[p[a >> 2] >> 2] = 0;
 sa = e + 16 | 0;
}
function Bm(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 b = Ma(b);
 a = Cd(a, La(16), Dd(e + 8 | 0, b, 0));
 zm(p[a >> 2] + 8 | 0, p[d >> 2]);
 f = sb(a), g = 1, n[f + 4 | 0] = g;
 p[p[a >> 2] + 4 >> 2] = c;
 p[p[a >> 2] >> 2] = 0;
 sa = e + 16 | 0;
}
function Ul(a) {
 var b = 0;
 Ub(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 13420;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 b = a - -64 | 0;
 p[b >> 2] = 13496;
 p[a >> 2] = 13320;
 p[b >> 2] = 13404;
 b = od();
 p[a + 72 >> 2] = 0;
 p[a + 68 >> 2] = b;
}
function Tv(a, b, c, d, e) {
 a = a | 0;
 b = w(b);
 c = w(c);
 d = w(d);
 e = w(e);
 var f = 0;
 f = sa - 16 | 0;
 sa = f;
 t[f + 8 >> 2] = c;
 t[f + 12 >> 2] = b;
 t[f + 4 >> 2] = d;
 t[f >> 2] = e;
 xj(a, 14024, f + 12 | 0, f + 8 | 0, f + 4 | 0, f);
 sa = f + 16 | 0;
}
function Sv(a, b, c, d, e) {
 a = a | 0;
 b = w(b);
 c = w(c);
 d = w(d);
 e = w(e);
 var f = 0;
 f = sa - 16 | 0;
 sa = f;
 t[f + 8 >> 2] = c;
 t[f + 12 >> 2] = b;
 t[f + 4 >> 2] = d;
 t[f >> 2] = e;
 xj(a, 14039, f + 12 | 0, f + 8 | 0, f + 4 | 0, f);
 sa = f + 16 | 0;
}
function to(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 b = Ma(b);
 a = Cd(a, La(12), Dd(e + 8 | 0, b, 0));
 kc(b, p[a >> 2] + 8 | 0, d);
 f = sb(a), g = 1, n[f + 4 | 0] = g;
 p[p[a >> 2] + 4 >> 2] = c;
 p[p[a >> 2] >> 2] = 0;
 sa = e + 16 | 0;
}
function Bg(a) {
 var b = 0;
 rc(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 9824;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 p[a + 64 >> 2] = 1065353216;
 b = yg(a + 68 | 0);
 p[a >> 2] = 12804;
 p[b >> 2] = 12892;
 bb(a + 80 | 0);
 p[a + 96 >> 2] = 0;
}
function qt(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 if (Kc(a)) {
  Ua(p[a >> 2]);
 }
 p[a + 8 >> 2] = p[b + 8 >> 2];
 d = p[b + 4 >> 2];
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = d;
 Ji(b, 0);
 n[c + 15 | 0] = 0;
 Ii(b, c + 15 | 0);
 sa = c + 16 | 0;
}
function ej(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 a : {
  if (!Kc(b)) {
   p[a + 8 >> 2] = p[b + 8 >> 2];
   d = p[b + 4 >> 2];
   p[a >> 2] = p[b >> 2];
   p[a + 4 >> 2] = d;
   break a;
  }
  Ff(a, p[b >> 2], p[b + 4 >> 2]);
 }
 sa = c + 16 | 0;
}
function Sp(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 b = kh(c, a + 8 | 0, b);
 a = p[b >> 2];
 while (1) {
  if (p[b + 4 >> 2] != (a | 0)) {
   te(p[b >> 2]);
   a = p[b >> 2] + 4 | 0;
   p[b >> 2] = a;
   continue;
  }
  break;
 }
 Od(b);
 sa = c + 16 | 0;
}
function Nj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Jj(c, a + 8 | 0, b);
 a = p[b >> 2];
 while (1) {
  if (p[b + 4 >> 2] != (a | 0)) {
   Pc(p[b >> 2]);
   a = p[b >> 2] + 1 | 0;
   p[b >> 2] = a;
   continue;
  }
  break;
 }
 Od(b);
 sa = c + 16 | 0;
}
function Gq(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Fq(c, a + 8 | 0, b);
 a = p[b >> 2];
 while (1) {
  if (p[b + 4 >> 2] != (a | 0)) {
   zh(p[b >> 2]);
   a = p[b >> 2] + 8 | 0;
   p[b >> 2] = a;
   continue;
  }
  break;
 }
 Od(b);
 sa = c + 16 | 0;
}
function Rn(a) {
 rc(a);
 p[a + 64 >> 2] = 0;
 p[a + 68 >> 2] = 0;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 1065353216;
 p[a + 48 >> 2] = 1065353216;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 11440;
 p[a >> 2] = 2324;
 tb(a + 72 | 0);
 bb(a + 96 | 0);
 p[a + 108 >> 2] = 0;
}
function qs(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = Eb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  c = p[a + 20 >> 2];
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 14) | 0)) {
   break a;
  }
  p[p[a + 20 >> 2] + 56 >> 2] = a;
  b = 0;
 }
 return b | 0;
}
function Ob(a, b, c, d) {
 var e = w(0), f = w(0), g = 0, h = w(0);
 e = t[Ja(b, 0) >> 2];
 f = t[Ja(c, 0) >> 2];
 g = Ja(a, 0), h = w(e + w(f * d)), t[g >> 2] = h;
 e = t[Ja(b, 1) >> 2];
 f = t[Ja(c, 1) >> 2];
 g = Ja(a, 1), h = w(e + w(f * d)), t[g >> 2] = h;
}
function Fj(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 var g = 0, h = 0;
 g = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 h = b;
 if (a & 1) {
  g = p[g + p[b >> 2] >> 2];
 }
 m[g | 0](h, c, d, e, f);
}
function is(a) {
 var b = 0, c = 0, d = w(0);
 b = sa - 16 | 0;
 sa = b;
 c = xi(p[a >> 2], p[a + 4 >> 2], b + 12 | 0);
 a : {
  if (!c) {
   gd(a);
   d = w(0);
   break a;
  }
  p[a >> 2] = p[a >> 2] + c;
  d = t[b + 12 >> 2];
 }
 sa = b + 16 | 0;
 return d;
}
function ks(a, b, c, d) {
 var e = 0;
 if ((c - b | 0) < (a | 0)) {
  return 0;
 }
 while (1) {
  if ((a | 0) == (e | 0)) {
   n[a + d | 0] = 0;
  } else {
   n[d + e | 0] = q[b | 0];
   e = e + 1 | 0;
   b = b + 1 | 0;
   continue;
  }
  break;
 }
 return a;
}
function kl(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 32 | 0;
 sa = d;
 Bj(d + 8 | 0, b);
 fe(d, c);
 m[a | 0](d + 24 | 0, d + 8 | 0, d);
 a = Mf(d + 24 | 0);
 Cb(d + 24 | 0);
 Cb(d);
 ub(d + 8 | 0);
 sa = d + 32 | 0;
 return a | 0;
}
function aw(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 var g = 0, h = 0;
 g = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 h = b;
 if (a & 1) {
  g = p[g + p[b >> 2] >> 2];
 }
 m[g | 0](h, c, d, e, f);
}
function er(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 f = gb(e + 8 | 0);
 g = gb(e);
 dc(f, a, d, w(.3333333432674408));
 dc(g, a, d, w(.6666666865348816));
 a = 1;
 if (!Ih(b, f)) {
  a = Ih(c, g);
 }
 sa = e + 16 | 0;
 return a;
}
function po(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Eb(a, b);
 a : {
  if (c) {
   break a;
  }
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!Jd(b)) {
   break a;
  }
  p[a + 52 >> 2] = b;
 }
 return c | 0;
}
function ai(a) {
 rc(a);
 p[a + 56 >> 2] = 1065353216;
 p[a + 60 >> 2] = 1065353216;
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 1065353216;
 p[a >> 2] = 3832;
 p[a >> 2] = 12568;
 tb(a - -64 | 0);
 tb(a + 88 | 0);
 p[a + 112 >> 2] = 0;
 p[a + 116 >> 2] = 0;
}
function Fm(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 32 | 0;
 sa = c;
 d = c, e = Bi(a, b), p[d + 24 >> 2] = e;
 d = c, e = uc(), p[d + 16 >> 2] = e;
 if (!vf(c + 24 | 0, c + 16 | 0)) {
  Dm(a, p[zd(c + 8 | 0, c + 24 | 0) >> 2]);
 }
 sa = c + 32 | 0;
}
function rm(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = Eb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  c = p[a + 20 >> 2];
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 22) | 0)) {
   break a;
  }
  mm(p[a + 20 >> 2], a);
  b = 0;
 }
 return b | 0;
}
function mq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = Eb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  c = p[a + 20 >> 2];
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 12) | 0)) {
   break a;
  }
  Gb(p[a + 20 >> 2], a);
  b = 0;
 }
 return b | 0;
}
function ij(a) {
 var b = 0, c = 0, d = 0;
 if (id(n[p[a >> 2]])) {
  while (1) {
   b = p[a >> 2];
   d = n[b | 0];
   p[a >> 2] = b + 1;
   c = (v(c, 10) + d | 0) + -48 | 0;
   if (id(n[b + 1 | 0])) {
    continue;
   }
   break;
  }
 }
 return c;
}
function Rp(a) {
 var b = 0, c = 0, d = 0, e = 0;
 Sd(a);
 p[a + 168 >> 2] = 0;
 p[a >> 2] = 5580;
 p[a >> 2] = 5448;
 b = Tb(a + 172 | 0);
 c = Tb(a + 236 | 0);
 d = Tb(a + 300 | 0);
 e = Tb(a + 364 | 0);
 Gb(a, b);
 Gb(a, c);
 Gb(a, d);
 Gb(a, e);
}
function fd(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = xi(p[a >> 2], p[a + 4 >> 2], b + 12 | 0);
 a : {
  if (!c) {
   gd(a);
   a = 0;
   break a;
  }
  p[a >> 2] = p[a >> 2] + c;
  a = p[b + 12 >> 2];
 }
 sa = b + 16 | 0;
 return a;
}
function ki(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 dd(a - -64 | 0, cb(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), cb(b, w(xc(t[a + 80 >> 2]) * w(-t[a + 84 >> 2])), w(yc(t[a + 80 >> 2]) * w(-t[a + 84 >> 2]))));
 sa = b + 16 | 0;
}
function Sh(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = b;
 e = a, f = w(nr(b, c) + t[a + 76 >> 2]), t[e + 76 >> 2] = f;
 mr(a - -64 | 0, d + 12 | 0);
 sa = d + 16 | 0;
}
function dd(a, b, c) {
 var d = w(0), e = w(0), f = 0, g = w(0);
 d = t[Ja(b, 0) >> 2];
 e = t[Ja(c, 0) >> 2];
 f = Ja(a, 0), g = w(d + e), t[f >> 2] = g;
 d = t[Ja(b, 1) >> 2];
 e = t[Ja(c, 1) >> 2];
 f = Ja(a, 1), g = w(d + e), t[f >> 2] = g;
}
function cd(a, b, c) {
 var d = w(0), e = w(0), f = 0, g = w(0);
 d = t[Ja(b, 0) >> 2];
 e = t[Ja(c, 0) >> 2];
 f = Ja(a, 0), g = w(d - e), t[f >> 2] = g;
 d = t[Ja(b, 1) >> 2];
 e = t[Ja(c, 1) >> 2];
 f = Ja(a, 1), g = w(d - e), t[f >> 2] = g;
}
function xh(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Ld(d + 8 | 0, Ad(a, ab(a) + 1 | 0), ab(a), c);
 kc(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 4;
 Ce(a, c);
 Tc(c);
 sa = d + 32 | 0;
}
function sh(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = yo(d + 8 | 0, Ad(a, ab(a) + 1 | 0), ab(a), c);
 kc(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 4;
 Ce(a, c);
 Tc(c);
 sa = d + 32 | 0;
}
function ir(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Ve(d + 8 | 0, Xe(a, lb(a) + 1 | 0), lb(a), c);
 Se(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 8;
 Ch(a, c);
 Ue(c);
 sa = d + 32 | 0;
}
function Uq(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Ve(d + 8 | 0, Xe(a, lb(a) + 1 | 0), lb(a), c);
 Gh(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 8;
 Sq(a, c);
 Ue(c);
 sa = d + 32 | 0;
}
function lp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 50) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 393232 >>> a | 0 : ((1 << a) - 1 & 393232) << 32 - a | 9985 >>> a) & 1;
 }
 return 0;
}
function Zl(a, b) {
 a = a | 0;
 b = b | 0;
 b = ie(a, b);
 m[p[p[b >> 2] >> 2]](b, 0);
 m[p[p[b >> 2] + 8 >> 2]](b, t[a + 56 >> 2]);
 m[p[p[b >> 2] + 16 >> 2]](b, p[a + 60 >> 2]);
 m[p[p[b >> 2] + 12 >> 2]](b, p[a + 64 >> 2]);
 return b | 0;
}
function Up(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 49) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 131088 >>> a | 0 : ((1 << a) - 1 & 131088) << 32 - a | 9985 >>> a) & 1;
 }
 return 0;
}
function Ue(a) {
 var b = 0, c = 0;
 b = a;
 c = p[a + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (c | 0)) {
   p[b + 8 >> 2] = p[b + 8 >> 2] + -8;
   continue;
  }
  break;
 }
 if (p[a >> 2]) {
  b = p[a >> 2];
  p[Va(a) >> 2];
  Ua(b);
 }
}
function Tc(a) {
 var b = 0, c = 0;
 b = a;
 c = p[a + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (c | 0)) {
   p[b + 8 >> 2] = p[b + 8 >> 2] + -4;
   continue;
  }
  break;
 }
 if (p[a >> 2]) {
  b = p[a >> 2];
  p[Va(a) >> 2];
  Ua(b);
 }
}
function sv(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = w(e);
 var f = 0, g = 0;
 f = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 g = b;
 if (a & 1) {
  f = p[f + p[b >> 2] >> 2];
 }
 m[f | 0](g, c, d, e);
}
function Kp(a) {
 var b = 0;
 Jp(a);
 p[a >> 2] = 5820;
 ih(a + 160 | 0);
 p[a >> 2] = 5712;
 b = a + 176 | 0;
 Ub(b);
 p[b + 52 >> 2] = 0;
 p[b + 56 >> 2] = 0;
 p[b + 48 >> 2] = a;
 p[b >> 2] = 4904;
 bb(a + 236 | 0);
 n[a + 248 | 0] = 0;
}
function hr(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c >> 2] = a;
 d = p[a + 4 >> 2];
 p[c + 4 >> 2] = d;
 p[c + 8 >> 2] = d + 3;
 Bh(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 3;
 Sb(c);
 sa = c + 16 | 0;
}
function Tg(a, b, c, d, e) {
 m[p[p[a >> 2] + 20 >> 2]](a, b, c);
 d = w(b + d);
 m[p[p[a >> 2] + 24 >> 2]](a, d, c);
 c = w(c + e);
 m[p[p[a >> 2] + 24 >> 2]](a, d, c);
 m[p[p[a >> 2] + 24 >> 2]](a, b, c);
 m[p[p[a >> 2] + 32 >> 2]](a);
}
function Qr(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 dd(a - -64 | 0, cb(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), cb(b, w(xc(t[a + 80 >> 2]) * t[a + 84 >> 2]), w(yc(t[a + 80 >> 2]) * t[a + 84 >> 2])));
 sa = b + 16 | 0;
}
function Vr(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 dd(a + 72 | 0, cb(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), cb(b, w(xc(t[a + 80 >> 2]) * t[a + 88 >> 2]), w(yc(t[a + 80 >> 2]) * t[a + 88 >> 2])));
 sa = b + 16 | 0;
}
function Pr(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 dd(a + 72 | 0, cb(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), cb(b, w(xc(t[a + 88 >> 2]) * t[a + 92 >> 2]), w(yc(t[a + 88 >> 2]) * t[a + 92 >> 2])));
 sa = b + 16 | 0;
}
function Lr(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 dd(a + 72 | 0, cb(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), cb(b, w(xc(t[a + 80 >> 2]) * t[a + 84 >> 2]), w(yc(t[a + 80 >> 2]) * t[a + 84 >> 2])));
 sa = b + 16 | 0;
}
function fp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 10049 >>> a) & 1;
 }
 return 0;
}
function eq(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 18177 >>> a) & 1;
 }
 return 0;
}
function br(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0;
 Sh(a, b, c);
 a = p[a + 104 >> 2];
 e = a, f = m[p[p[b >> 2] + 36 >> 2]](b) | 0, g = c, d = p[p[a >> 2] + 16 >> 2], m[d](e | 0, f | 0, g | 0);
}
function Mp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 10017 >>> a) & 1;
 }
 return 0;
}
function zv() {
 var a = 0, b = 0;
 a : {
  if (n[21720] & 1) {
   break a;
  }
  if (!rb(21720)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(5, 15888) | 0;
  sa = a + 16 | 0;
  p[5429] = b;
  qb(21720);
 }
 return p[5429];
}
function zp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 2819 >>> a) & 1;
 }
 return 0;
}
function xr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 9985 >>> a) & 1;
 }
 return 0;
}
function wv() {
 var a = 0, b = 0;
 a : {
  if (n[21728] & 1) {
   break a;
  }
  if (!rb(21728)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 15908) | 0;
  sa = a + 16 | 0;
  p[5431] = b;
  qb(21728);
 }
 return p[5431];
}
function wp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 2817 >>> a) & 1;
 }
 return 0;
}
function vr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 1793 >>> a) & 1;
 }
 return 0;
}
function tq(a, b) {
 var c = 0;
 sq(a, b);
 p[a >> 2] = 7264;
 p[a + 20 >> 2] = p[b + 20 >> 2];
 uh(a + 24 | 0, b + 24 | 0);
 o[a + 44 >> 1] = r[b + 44 >> 1];
 c = p[b + 40 >> 2];
 p[a + 36 >> 2] = p[b + 36 >> 2];
 p[a + 40 >> 2] = c;
}
function mo(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 39) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 128 >>> a | 0 : ((1 << a) - 1 & 128) << 32 - a | 3 >>> a) & 1;
 }
 return 0;
}
function lw() {
 var a = 0, b = 0;
 a : {
  if (n[21628] & 1) {
   break a;
  }
  if (!rb(21628)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15432) | 0;
  sa = a + 16 | 0;
  p[5406] = b;
  qb(21628);
 }
 return p[5406];
}
function jw() {
 var a = 0, b = 0;
 a : {
  if (n[21636] & 1) {
   break a;
  }
  if (!rb(21636)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 15440) | 0;
  sa = a + 16 | 0;
  p[5408] = b;
  qb(21636);
 }
 return p[5408];
}
function fw() {
 var a = 0, b = 0;
 a : {
  if (n[21644] & 1) {
   break a;
  }
  if (!rb(21644)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(7, 15456) | 0;
  sa = a + 16 | 0;
  p[5410] = b;
  qb(21644);
 }
 return p[5410];
}
function cw() {
 var a = 0, b = 0;
 a : {
  if (n[21652] & 1) {
   break a;
  }
  if (!rb(21652)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 15484) | 0;
  sa = a + 16 | 0;
  p[5412] = b;
  qb(21652);
 }
 return p[5412];
}
function Rj() {
 var a = 0, b = 0;
 a : {
  if (n[21552] & 1) {
   break a;
  }
  if (!rb(21552)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(1, 14688) | 0;
  sa = a + 16 | 0;
  p[5387] = b;
  qb(21552);
 }
 return p[5387];
}
function Mv() {
 var a = 0, b = 0;
 a : {
  if (n[21672] & 1) {
   break a;
  }
  if (!rb(21672)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15832) | 0;
  sa = a + 16 | 0;
  p[5417] = b;
  qb(21672);
 }
 return p[5417];
}
function Kw() {
 var a = 0, b = 0;
 a : {
  if (n[21588] & 1) {
   break a;
  }
  if (!rb(21588)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(1, 15088) | 0;
  sa = a + 16 | 0;
  p[5396] = b;
  qb(21588);
 }
 return p[5396];
}
function Kv() {
 var a = 0, b = 0;
 a : {
  if (n[21680] & 1) {
   break a;
  }
  if (!rb(21680)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15840) | 0;
  sa = a + 16 | 0;
  p[5419] = b;
  qb(21680);
 }
 return p[5419];
}
function Iv() {
 var a = 0, b = 0;
 a : {
  if (n[21688] & 1) {
   break a;
  }
  if (!rb(21688)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15848) | 0;
  sa = a + 16 | 0;
  p[5421] = b;
  qb(21688);
 }
 return p[5421];
}
function Hw() {
 var a = 0, b = 0;
 a : {
  if (n[21596] & 1) {
   break a;
  }
  if (!rb(21596)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15092) | 0;
  sa = a + 16 | 0;
  p[5398] = b;
  qb(21596);
 }
 return p[5398];
}
function Hj() {
 var a = 0, b = 0;
 a : {
  if (n[21568] & 1) {
   break a;
  }
  if (!rb(21568)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 14772) | 0;
  sa = a + 16 | 0;
  p[5391] = b;
  qb(21568);
 }
 return p[5391];
}
function Fv() {
 var a = 0, b = 0;
 a : {
  if (n[21696] & 1) {
   break a;
  }
  if (!rb(21696)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15856) | 0;
  sa = a + 16 | 0;
  p[5423] = b;
  qb(21696);
 }
 return p[5423];
}
function Ew() {
 var a = 0, b = 0;
 a : {
  if (n[21604] & 1) {
   break a;
  }
  if (!rb(21604)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 15100) | 0;
  sa = a + 16 | 0;
  p[5400] = b;
  qb(21604);
 }
 return p[5400];
}
function Dv() {
 var a = 0, b = 0;
 a : {
  if (n[21704] & 1) {
   break a;
  }
  if (!rb(21704)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15864) | 0;
  sa = a + 16 | 0;
  p[5425] = b;
  qb(21704);
 }
 return p[5425];
}
function Bw() {
 var a = 0, b = 0;
 a : {
  if (n[21612] & 1) {
   break a;
  }
  if (!rb(21612)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15112) | 0;
  sa = a + 16 | 0;
  p[5402] = b;
  qb(21612);
 }
 return p[5402];
}
function Bv() {
 var a = 0, b = 0;
 a : {
  if (n[21712] & 1) {
   break a;
  }
  if (!rb(21712)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 15872) | 0;
  sa = a + 16 | 0;
  p[5427] = b;
  qb(21712);
 }
 return p[5427];
}
function Ar(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 9989 >>> a) & 1;
 }
 return 0;
}
function ur(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 16 >>> a | 0 : ((1 << a) - 1 & 16) << 32 - a | 769 >>> a) & 1;
 }
 return 0;
}
function Im(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 36) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 24 >>> a | 0 : ((1 << a) - 1 & 24) << 32 - a | 1 >>> a) & 1;
 }
 return 0;
}
function ud(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = a;
 c = 0;
 a : {
  if (!p[a + 20 >> 2]) {
   break a;
  }
  c = 0;
  if (!og(p[a + 20 >> 2])) {
   break a;
  }
  c = p[a + 20 >> 2];
 }
 p[b + 116 >> 2] = c;
 return 0;
}
function Qu(a, b, c, d) {
 if (a | b) {
  while (1) {
   c = c + -1 | 0;
   n[c | 0] = q[(a & 15) + 20304 | 0] | d;
   a = (b & 15) << 28 | a >>> 4;
   b = b >>> 4 | 0;
   if (a | b) {
    continue;
   }
   break;
  }
 }
 return c;
}
function Iw(a, b, c) {
 a : {
  b : {
   switch (b + -37 | 0) {
   default:
    if ((b | 0) != 88) {
     break a;
    }
    vj(a, c);
    return;
   case 0:
    If(a, c);
    return;
   case 1:
    break b;
   }
  }
  If(a, c);
 }
}
function xs(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 33) {
  b = a & 65535;
  a = b & 31;
  return (32 <= (b & 63) >>> 0 ? 2 >>> a | 0 : ((1 << a) - 1 & 2) << 32 - a | 3 >>> a) & 1;
 }
 return 0;
}
function yv(a, b, c, d, e) {
 var f = 0;
 f = sa - 16 | 0;
 sa = f;
 p[f + 12 >> 2] = a;
 Bb(f + 12 | 0, t[b >> 2]);
 Bb(f + 12 | 0, t[c >> 2]);
 Bb(f + 12 | 0, t[d >> 2]);
 Bb(f + 12 | 0, t[e >> 2]);
 sa = f + 16 | 0;
 return a;
}
function xq(a, b) {
 var c = 0;
 tq(a, b);
 p[a >> 2] = 3968;
 p[a >> 2] = 3908;
 p[a >> 2] = 4240;
 c = p[b + 52 >> 2];
 p[a + 48 >> 2] = p[b + 48 >> 2];
 p[a + 52 >> 2] = c;
 p[a >> 2] = 4964;
 p[a + 56 >> 2] = p[b + 56 >> 2];
}
function Er(a) {
 var b = 0, c = 0, d = 0, e = 0;
 Sd(a);
 p[a >> 2] = 3380;
 p[a >> 2] = 3252;
 b = $c(a + 168 | 0);
 c = $c(a + 264 | 0);
 d = $c(a + 360 | 0);
 e = $c(a + 456 | 0);
 Gb(a, b);
 Gb(a, c);
 Gb(a, d);
 Gb(a, e);
}
function mh(a, b) {
 a = a | 0;
 b = b | 0;
 if (ob(b, 8)) {
  if ((ab(a + 140 | 0) | 0) != (m[p[p[a >> 2] + 128 >> 2]](a) | 0)) {
   _p(a, m[p[p[a >> 2] + 128 >> 2]](a) | 0);
  }
  m[p[p[a >> 2] + 132 >> 2]](a);
 }
 Hc(a, b);
}
function cg(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = a + 52 | 0;
 if (p[b + 8 >> 2]) {
  c = p[b + 8 >> 2];
  e = c, f = kg(p[a + 48 >> 2], t[b + 4 >> 2]), d = p[p[c >> 2] + 4 >> 2], m[d](e | 0, f | 0);
 }
}
function Ju(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 e = p[a + 20 >> 2];
 d = p[a + 16 >> 2] - e | 0;
 d = d >>> 0 > c >>> 0 ? c : d;
 Pb(e, b, d);
 p[a + 20 >> 2] = d + p[a + 20 >> 2];
 return c | 0;
}
function nm(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0;
 b = p[a + 20 >> 2];
 if (!(!b | !p[b + 20 >> 2])) {
  d = a;
  b = p[b + 20 >> 2];
  if (sf(b)) {
   c = b;
  } else {
   c = 0;
  }
  p[d + 96 >> 2] = c;
  Rb(b, a);
 }
}
function Kf(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0, f = 0;
 e = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  e = p[e + p[b >> 2] >> 2];
 }
 m[e | 0](f, c, d);
}
function yj(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 var e = 0, f = 0;
 e = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  e = p[e + p[b >> 2] >> 2];
 }
 m[e | 0](f, c, d);
}
function zw(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 var e = 0, f = 0;
 e = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 f = b;
 if (a & 1) {
  e = p[e + p[b >> 2] >> 2];
 }
 m[e | 0](f, c, d);
}
function Oh(a) {
 a = a | 0;
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 40 | 0;
 if (!q[p[c + 4 >> 2] + -3 | 0]) {
  a = a + 4 | 0;
  cf(c, df(b + 8 | 0, 0, lb(a) & 255));
  Jc(a, kb(a, 0));
 }
 sa = b + 16 | 0;
}
function tm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if (q[a + 46 | 0]) {
  c = m[p[p[c >> 2] + 36 >> 2]](c) | 0;
  m[p[p[c >> 2] + 12 >> 2]](c, p[a + 56 >> 2]);
  m[p[p[b >> 2] + 20 >> 2]](b, c, p[a + 48 >> 2]);
 }
}
function vp(a) {
 var b = 0;
 a : {
  switch ((m[p[p[a >> 2] + 8 >> 2]](a) | 0) + -1 | 0) {
  case 0:
   return a ? a + 76 | 0 : 0;
  case 2:
   b = a ? a + 160 | 0 : 0;
   break;
  default:
   break a;
  }
 }
 return b;
}
function uj(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 d = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 e = b;
 if (a & 1) {
  d = p[d + p[b >> 2] >> 2];
 }
 return m[d | 0](e, c) | 0;
}
function pv(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 var d = 0, e = 0;
 d = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 e = b;
 if (a & 1) {
  d = p[d + p[b >> 2] >> 2];
 }
 return m[d | 0](e, c) | 0;
}
function cm(a, b) {
 a = a | 0;
 b = b | 0;
 b = Eb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  if (!dg(a + 52 | 0, p[a + 20 >> 2])) {
   break a;
  }
  m[p[p[a >> 2] + 56 >> 2]](a);
  b = 0;
 }
 return b | 0;
}
function Nu(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = b;
 b = p[b >> 2] + 15 & -16;
 p[c >> 2] = b + 16;
 d = a, e = Cu(p[b >> 2], p[b + 4 >> 2], p[b + 8 >> 2], p[b + 12 >> 2]), u[d >> 3] = e;
}



function uv(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = +c;
 var d = 0, e = 0;
 d = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 e = b;
 if (a & 1) {
  d = p[d + p[b >> 2] >> 2];
 }
 return m[d | 0](e, c) | 0;
}
function kg(a, b) {
 var c = 0;
 b = Xu(w(w(w(w(ne(a) >>> 0) / w(255)) * w(255)) * b));
 a : {
  if (b < w(4294967296) & b >= w(0)) {
   c = ~~b >>> 0;
   break a;
  }
  c = 0;
 }
 return lg(c, qe(a), pe(a), oe(a));
}
function Xf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(21577, a | 0, 2, 14800, 14808, 797, Xa(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Wf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(21619, a | 0, 2, 15140, 14808, 806, Xa(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Vf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(21619, a | 0, 4, 15184, 15200, 809, Xa(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Rf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(21662, a | 0, 6, 15584, 15608, 821, Xa(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Pf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(21737, a | 0, 2, 16048, 14788, 838, Xa(c + 8 | 0) | 0, 0);
 sa = c + 16 | 0;
}
function La(a) {
 var b = 0;
 a = a ? a : 1;
 a : {
  while (1) {
   b = $d(a);
   if (b) {
    break a;
   }
   b = p[5466];
   if (b) {
    m[b | 0]();
    continue;
   }
   break;
  }
  Y();
  E();
 }
 return b;
}
function Qh(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 e = a + 40 | 0;
 a = a + 4 | 0;
 cf(e, df(d + 8 | 0, 0, lb(a) & 255));
 Jc(a, cb(d, b, c));
 sa = d + 16 | 0;
}
function tb(a) {
 var b = 0;
 b = p[686];
 p[a + 16 >> 2] = p[685];
 p[a + 20 >> 2] = b;
 b = p[684];
 p[a + 8 >> 2] = p[683];
 p[a + 12 >> 2] = b;
 b = p[682];
 p[a >> 2] = p[681];
 p[a + 4 >> 2] = b;
 return a;
}
function Re(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 4904;
 b = p[a + 52 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 b = p[a + 56 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 hb(a);
 return a | 0;
}
function Fl(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b >> 2];
 b = c + 8 | 0;
 e = b, f = ka(13549) | 0, p[e >> 2] = f;
 db(a, _(d | 0, p[b >> 2]) | 0);
 Cb(b);
 sa = c + 16 | 0;
}
function zk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14193, 3, 15988, 15132, 833, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function uk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14203, 3, 16012, 15132, 835, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function tl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21577, 13591, 3, 14812, 14824, 798, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function tk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14212, 3, 16024, 15132, 836, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function sl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21577, 13601, 4, 14832, 14848, 799, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function sk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14229, 3, 16036, 15132, 837, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function rl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21577, 13610, 3, 14856, 14824, 800, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function qk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14260, 3, 16056, 15132, 839, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function pl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21574, 13619, 6, 14880, 14904, 801, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function pk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14280, 3, 16068, 15132, 840, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function hl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21619, 13658, 4, 15152, 14848, 807, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function gl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21619, 13666, 3, 15168, 14824, 808, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function fl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21619, 13689, 8, 15216, 15248, 810, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function ek(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21756, 14464, 5, 16080, 16100, 847, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function _j(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21759, 14161, 3, 16116, 16128, 849, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Yk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 13960, 3, 15496, 14824, 815, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Yj(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21759, 14464, 4, 16144, 15632, 850, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Xk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 13989, 3, 15508, 14824, 816, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Wk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 13995, 3, 15520, 15532, 817, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Vk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 14005, 3, 15540, 14824, 818, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Uk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 14010, 3, 15552, 14824, 819, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Tk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 14014, 3, 15564, 14824, 820, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Sk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 14054, 4, 15616, 15632, 822, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Rk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21662, 14062, 2, 15640, 14808, 823, Xa(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Hk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21734, 14127, 3, 15924, 15132, 828, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Gk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21734, 14136, 2, 15936, 14788, 829, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Ek(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14161, 3, 15944, 15956, 830, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Dk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14169, 3, 15964, 14824, 831, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Bk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14174, 3, 15976, 15132, 832, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function wk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(21737, 14198, 3, 16e3, 15132, 834, Xa(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Pu(a, b, c) {
 if (a | b) {
  while (1) {
   c = c + -1 | 0;
   n[c | 0] = a & 7 | 48;
   a = (b & 7) << 29 | a >>> 3;
   b = b >>> 3 | 0;
   if (a | b) {
    continue;
   }
   break;
  }
 }
 return c;
}
function Mn(a) {
 Ub(a);
 p[a + 68 >> 2] = 0;
 p[a + 72 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 p[a + 64 >> 2] = 1065353216;
 p[a + 52 >> 2] = 1065353216;
 p[a + 56 >> 2] = 0;
 p[a + 48 >> 2] = -1;
 p[a >> 2] = 11524;
}
function Bf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 if ((b | 0) == 138) {
  td(d, c);
  Cf(a + 4 | 0, d);
  ub(d);
 }
 sa = d + 16 | 0;
 return (b | 0) == 138 | 0;
}
function qq(a, b) {
 var c = 0, d = 0, e = 0;
 if (Eg(a) >>> 0 < b >>> 0) {
  hd();
  E();
 }
 Ma(a);
 c = Md(b);
 p[a >> 2] = c;
 p[a + 4 >> 2] = c;
 d = Ma(a), e = (b << 2) + c | 0, p[d >> 2] = e;
 ye(a, 0);
}
function Zq(a, b, c, d, e, f, g) {
 a = a | 0;
 b = w(b);
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 Ph(a, b, c, d, e, f, g);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 28 >> 2]](a, b, c, d, e, f, g);
}
function Qd(a, b, c, d, e, f) {
 dc(f, a, b, e);
 a = f + 8 | 0;
 dc(a, b, c, e);
 b = f + 16 | 0;
 dc(b, c, d, e);
 c = f + 24 | 0;
 dc(c, f, a, e);
 d = f + 32 | 0;
 dc(d, a, b, e);
 dc(f + 40 | 0, c, d, e);
}
function md(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = c;
 oa(21582, b | 0, 21622, 15920, 853, Qc(d + 12 | 0) | 0, 21622, 15532, 854, Qc(d + 12 | 0) | 0);
 sa = d + 16 | 0;
 return a;
}
function Ki(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 if ((b | 0) == 55) {
  td(d, c);
  Cf(a + 4 | 0, d);
  ub(d);
 }
 sa = d + 16 | 0;
 return (b | 0) == 55 | 0;
}
function Vg(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 a : {
  if ((b | 0) < 0) {
   break a;
  }
  a = a + 92 | 0;
  if (ab(a) >>> 0 <= b >>> 0) {
   break a;
  }
  c = p[Pa(a, b) >> 2];
 }
 return c | 0;
}
function Qb(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 d = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 e = b;
 if (a & 1) {
  d = p[d + p[b >> 2] >> 2];
 }
 m[d | 0](e, c);
}
function ds(a, b, c) {
 var d = 0;
 d = Ja(a, 0);
 t[d >> 2] = t[d >> 2] * b;
 d = Ja(a, 1);
 t[d >> 2] = t[d >> 2] * b;
 d = Ja(a, 2);
 t[d >> 2] = t[d >> 2] * c;
 a = Ja(a, 3);
 t[a >> 2] = t[a >> 2] * c;
}
function Rc(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 var d = 0, e = 0;
 d = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 e = b;
 if (a & 1) {
  d = p[d + p[b >> 2] >> 2];
 }
 m[d | 0](e, c);
}
function Mj(a, b) {
 var c = 0;
 Yf(a);
 c = b + 4 | 0;
 xd(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Wa(a, c);
 Wa(a + 4 | 0, b + 8 | 0);
 Wa(Ma(a), Va(b));
 p[b >> 2] = p[b + 4 >> 2];
 Zb(a);
 hc(a);
 hc(a);
}
function Kq(a, b) {
 var c = 0;
 Eh(a);
 c = b + 4 | 0;
 Iq(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Wa(a, c);
 Wa(a + 4 | 0, b + 8 | 0);
 Wa(Ma(a), Va(b));
 p[b >> 2] = p[b + 4 >> 2];
 qc(a);
 oc(a);
 oc(a);
}
function iq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 a : {
  if (!ob(b, 8)) {
   break a;
  }
  c = a + 156 | 0;
  if (!p[c + 4 >> 2]) {
   break a;
  }
  Bs(p[c + 4 >> 2], a + 140 | 0);
 }
 Hc(a, b);
}
function cp(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 32 | 0;
 sa = c;
 d = c, e = Je(b), p[d + 16 >> 2] = e;
 $o(c + 24 | 0, a, b, c + 16 | 0);
 a = Wb(c + 24 | 0);
 sa = c + 32 | 0;
 return a + 4 | 0;
}
function co(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 32 | 0;
 sa = c;
 d = c, e = Je(b), p[d + 16 >> 2] = e;
 Tn(c + 24 | 0, a, b, c + 16 | 0);
 a = Wb(c + 24 | 0);
 sa = c + 32 | 0;
 return a + 4 | 0;
}
function Wn(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 32 | 0;
 sa = c;
 d = c, e = Je(b), p[d + 16 >> 2] = e;
 Em(c + 24 | 0, a, b, c + 16 | 0);
 a = Wb(c + 24 | 0);
 sa = c + 32 | 0;
 return a + 4 | 0;
}
function Ke(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Fo(a);
 te(a + 8 | 0);
 p[b + 12 >> 2] = 0;
 Ge(a + 12 | 0, b + 12 | 0);
 p[b + 4 >> 2] = 1065353216;
 Ge(a + 16 | 0, b + 4 | 0);
 sa = b + 16 | 0;
}
function On(a) {
 Be(a);
 n[a + 40 | 0] = 0;
 p[a + 32 >> 2] = -1;
 p[a + 36 >> 2] = -1;
 p[a + 24 >> 2] = 1065353216;
 p[a + 28 >> 2] = 0;
 p[a + 16 >> 2] = 60;
 p[a + 20 >> 2] = 60;
 p[a >> 2] = 9392;
}
function vu(a) {
 var b = 0;
 a : {
  a = p[a + 8 >> 2];
  b = q[a | 0];
  if ((b | 0) != 1) {
   if (b & 2) {
    break a;
   }
   n[a | 0] = 2;
   a = 1;
  } else {
   a = 0;
  }
  return a;
 }
 E();
}
function Il(a, b, c) {
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 e = +ma(Rj() | 0, b | 0, c | 0, d + 4 | 0, Of(d + 8 | 0) | 0);
 b = db(d, p[d + 4 >> 2]);
 fe(a, ld(e));
 pd(b);
 sa = d + 16 | 0;
}
function $j(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0;
 c = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 d = b;
 if (a & 1) {
  c = p[p[b >> 2] + c >> 2];
 }
 return m[c | 0](d) | 0;
}
function tw(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0;
 e = a, f = m[p[p[b >> 2] + 36 >> 2]](b) | 0, g = c, d = p[p[a >> 2] + 40 >> 2], m[d](e | 0, f | 0, g | 0);
}
function Nw(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 8 >> 2] = c;
 p[d + 12 >> 2] = b;
 Fw(p[a + 8 >> 2], d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function Cd(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = b;
 Fe(a, d + 12 | 0);
 b = p[c + 4 >> 2];
 p[a + 4 >> 2] = p[c >> 2];
 p[a + 8 >> 2] = b;
 sa = d + 16 | 0;
 return a;
}
function Rv(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 t[d + 8 >> 2] = c;
 p[d + 12 >> 2] = b;
 xv(p[a + 8 >> 2], d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function Jb(a) {
 var b = 0, c = 0;
 b = a * a;
 c = b * a;
 return w(c * (b * b) * (b * 2718311493989822e-21 + -.00019839334836096632) + (c * (b * .008333329385889463 + -.16666666641626524) + a));
}
function Sq(a, b) {
 var c = 0;
 Te(a);
 c = b + 4 | 0;
 xd(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Wa(a, c);
 Wa(a + 4 | 0, b + 8 | 0);
 Wa(Ma(a), Va(b));
 p[b >> 2] = p[b + 4 >> 2];
 Fh(a, lb(a));
}
function Ch(a, b) {
 var c = 0;
 Te(a);
 c = b + 4 | 0;
 Nq(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Wa(a, c);
 Wa(a + 4 | 0, b + 8 | 0);
 Wa(Ma(a), Va(b));
 p[b >> 2] = p[b + 4 >> 2];
 Fh(a, lb(a));
}
function Ce(a, b) {
 var c = 0;
 We(a);
 c = b + 4 | 0;
 xd(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Wa(a, c);
 Wa(a + 4 | 0, b + 8 | 0);
 Wa(Ma(a), Va(b));
 p[b >> 2] = p[b + 4 >> 2];
 ye(a, ab(a));
}
function ov(a) {
 a = a | 0;
 var b = 0;
 b = sa - 112 | 0;
 sa = b;
 p[b + 108 >> 2] = a;
 p[b >> 2] = p[b + 108 >> 2];
 Lu(b + 16 | 0, b);
 a = Hu(b + 16 | 0);
 sa = b + 112 | 0;
 return a | 0;
}
function Cl(a, b) {
 var c = 0;
 c = Zb(a);
 if (c >>> 0 < b >>> 0) {
  Al(a, b - c | 0);
  return;
 }
 if (c >>> 0 > b >>> 0) {
  b = p[a >> 2] + b | 0;
  Zb(a);
  Nf(a, b);
  hc(a);
  Zb(a);
 }
}
function nh(a, b) {
 var c = 0;
 c = ab(a);
 if (c >>> 0 < b >>> 0) {
  Zp(a, b - c | 0);
  return;
 }
 if (c >>> 0 > b >>> 0) {
  b = p[a >> 2] + (b << 2) | 0;
  ab(a);
  Ug(a, b);
  Th(a);
 }
}
function kr(a, b) {
 var c = 0;
 c = lb(a);
 if (c >>> 0 < b >>> 0) {
  fr(a, b - c | 0);
  return;
 }
 if (c >>> 0 > b >>> 0) {
  b = p[a >> 2] + (b << 3) | 0;
  lb(a);
  Dh(a, b);
  Vh(a);
 }
}
function sw(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 t[d + 8 >> 2] = c;
 t[d + 12 >> 2] = b;
 zj(a, 13675, d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function qw(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 t[d + 8 >> 2] = c;
 t[d + 12 >> 2] = b;
 zj(a, 13682, d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function $e(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 4356;
 ib(a - -64 | 0);
 ib(a + 52 | 0);
 b = a + 40 | 0;
 Eh(b);
 Qq(b);
 Ze(a + 28 | 0);
 Ze(a + 16 | 0);
 Ze(a + 4 | 0);
 return a | 0;
}
function Jq(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = 1431655765;
 p[b + 8 >> 2] = 2147483647;
 a = p[vd(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Eg(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = 1073741823;
 p[b + 8 >> 2] = 2147483647;
 a = p[vd(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function jm(a, b) {
 var c = 0;
 c = sa - 32 | 0;
 sa = c;
 p[c + 16 >> 2] = b;
 p[c + 24 >> 2] = a;
 p[c + 12 >> 2] = 647;
 le(p[c + 24 >> 2], p[c + 16 >> 2], c + 12 | 0);
 sa = c + 32 | 0;
}
function Rq(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = 536870911;
 p[b + 8 >> 2] = 2147483647;
 a = p[vd(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Jp(a) {
 kf(a);
 p[a + 128 >> 2] = 3;
 p[a + 132 >> 2] = 0;
 p[a >> 2] = 6036;
 p[a >> 2] = 5928;
 bb(a + 136 | 0);
 p[a + 156 >> 2] = 0;
 p[a + 148 >> 2] = 0;
 p[a + 152 >> 2] = 0;
}
function ee(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0;
 c = p[a >> 2];
 a = p[a + 4 >> 2];
 b = (a >> 1) + b | 0;
 d = b;
 if (a & 1) {
  c = p[p[b >> 2] + c >> 2];
 }
 m[c | 0](d);
}
function Ub(a) {
 Nb(a);
 p[a >> 2] = 2108;
 Yd(a + 4 | 0, 4020);
 p[a + 16 >> 2] = 0;
 p[a + 20 >> 2] = 0;
 p[a >> 2] = 7264;
 bb(a + 24 | 0);
 o[a + 44 >> 1] = 65535;
 p[a + 40 >> 2] = 0;
}
function yk(a, b) {
 a = a | 0;
 b = b | 0;
 b = zc(b, 26);
 if (!b) {
  return 1;
 }
 t[a + 20 >> 2] = w(p[a + 4 >> 2]) / w(p[p[b + 4 >> 2] + 16 >> 2]);
 Ah(p[b + 8 >> 2], a);
 return 0;
}
function kp(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 127) {
  d = a, e = w(Na(c)), t[d + 176 >> 2] = e;
  return 1;
 }
 return lh(a, b, c) | 0;
}
function jp(a) {
 var b = 0, c = 0, d = 0;
 Sd(a);
 p[a >> 2] = 6824;
 p[a >> 2] = 6696;
 b = Tb(a + 168 | 0);
 c = Tb(a + 232 | 0);
 d = Tb(a + 296 | 0);
 Gb(a, b);
 Gb(a, c);
 Gb(a, d);
}
function xn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 157) {
  d = a, e = w(Na(c)), t[d + 12 >> 2] = e;
  return 1;
 }
 return sg(a, b, c) | 0;
}
function Qn(a) {
 Ag(a);
 p[a + 72 >> 2] = 255;
 p[a + 76 >> 2] = 1;
 p[a + 64 >> 2] = 255;
 p[a + 68 >> 2] = 1;
 p[a >> 2] = 11696;
 p[a >> 2] = 11612;
 gb(a + 80 | 0);
 gb(a + 88 | 0);
}
function Lp(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 31) {
  d = a, e = w(Na(c)), t[d + 168 >> 2] = e;
  return 1;
 }
 return mf(a, b, c) | 0;
}
function Fi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 89) {
  d = a, e = w(Na(c)), t[d + 120 >> 2] = e;
  return 1;
 }
 return yf(a, b, c) | 0;
}
function Cn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 140) {
  d = a, e = w(Na(c)), t[d + 16 >> 2] = e;
  return 1;
 }
 return Bf(a, b, c) | 0;
}
function uq(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 26) {
  d = a, e = w(Na(c)), t[d + 60 >> 2] = e;
  return 1;
 }
 return ad(a, b, c) | 0;
}
function uh(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 Ma(b);
 rq(a);
 c = ab(b);
 if (c) {
  qq(a, c);
  pq(a, p[b >> 2], p[b + 4 >> 2], c);
 }
 sa = d + 16 | 0;
 return a;
}
function su(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 70) {
  d = a, e = w(Na(c)), t[d + 24 >> 2] = e;
  return 1;
 }
 return kd(a, b, c) | 0;
}
function Jl(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = +S(p[a >> 2], p[3673], b + 4 | 0);
 a = db(b, p[b + 4 >> 2]);
 d = ld(c);
 pd(a);
 sa = b + 16 | 0;
 return d;
}
function Hl(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = +S(p[a >> 2], p[3674], b + 4 | 0);
 a = db(b, p[b + 4 >> 2]);
 d = ld(c);
 pd(a);
 sa = b + 16 | 0;
 return d;
}
function Dl(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = +S(p[a >> 2], p[3675], b + 4 | 0);
 a = db(b, p[b + 4 >> 2]);
 d = ld(c);
 pd(a);
 sa = b + 16 | 0;
 return d;
}
function Lh(a) {
 Kh(a);
 p[a >> 2] = 4356;
 bb(a + 4 | 0);
 bb(a + 16 | 0);
 bb(a + 28 | 0);
 bb(a + 40 | 0);
 bb(a + 52 | 0);
 bb(a - -64 | 0);
 p[a + 76 >> 2] = 0;
 tb(a + 80 | 0);
}
function Kj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = -1;
 p[b + 8 >> 2] = 2147483647;
 a = p[vd(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Nn(a) {
 rc(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 10828;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 a = a - -64 | 0;
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
}
function lf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 128) {
  d = a, e = ec(c), p[d + 128 >> 2] = e;
  return 1;
 }
 return jf(a, b, c) | 0;
}
function dg(a, b) {
 var c = 0, d = 0, e = 0;
 c = m[p[p[b >> 2] + 12 >> 2]](b, 21) | 0;
 if (c) {
  d = a, e = m[p[p[b >> 2] + 56 >> 2]](b, a) | 0, p[d + 8 >> 2] = e;
 }
 return c;
}
function us(a, b) {
 a = a | 0;
 b = b | 0;
 b = p[a + 20 >> 2];
 if (m[p[p[b >> 2] + 12 >> 2]](b, 43) | 0) {
  As(p[a + 20 >> 2], a);
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function nd(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 fe(c + 8 | 0, b);
 a = m[a | 0](c + 8 | 0) | 0;
 Cb(c + 8 | 0);
 sa = c + 16 | 0;
 return a | 0;
}
function lo(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 121) {
  d = a, e = ec(c), p[d + 48 >> 2] = e;
  return 1;
 }
 return yb(a, b, c) | 0;
}
function Ya(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 a = Xa(b + 8 | 0);
 sa = b + 16 | 0;
 return a;
}
function Dt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 122) {
  d = a, e = ec(c), p[d + 24 >> 2] = e;
  return 1;
 }
 return kd(a, b, c) | 0;
}
function sg(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 156) {
  d = a, e = ec(c), p[d + 8 >> 2] = e;
  return 1;
 }
 return Gi(a, b, c) | 0;
}
function ph(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 wf(t[a + 48 >> 2], t[a + 52 >> 2], p[p[a + 56 >> 2] + 52 >> 2], p[p[a + 56 >> 2] + 48 >> 2], b, c, qh(p[a + 56 >> 2]));
}
function hn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 141) {
  d = a, e = Dc(c), n[d + 16 | 0] = e;
  return 1;
 }
 return Bf(a, b, c) | 0;
}
function dq(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 32) {
  d = a, e = Dc(c), n[d + 152 | 0] = e;
  return 1;
 }
 return lf(a, b, c) | 0;
}
function _g(a) {
 Ub(a);
 p[a + 48 >> 2] = -1;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 7124;
 p[a + 64 >> 2] = 0;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 p[a >> 2] = 7476;
 return a;
}
function Vm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 37) {
  d = a, e = fd(c), p[d + 48 >> 2] = e;
  return 1;
 }
 return yb(a, b, c) | 0;
}
function Rg(a, b, c) {
 var d = w(0);
 d = w(b * w(3));
 c = w(c * w(3));
 b = w(c + w(b * w(-6)));
 return w(d + w(w(w(b + b) * a) + w(w(w(w(d + w(w(1) - c)) * w(3)) * a) * a)));
}
function Qv(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 88) {
  d = a, e = fd(c), p[d + 24 >> 2] = e;
  return 1;
 }
 return kd(a, b, c) | 0;
}
function Pm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 40) {
  d = a, e = ec(c), p[d + 56 >> 2] = e;
  return 1;
 }
 return we(a, b, c) | 0;
}
function we(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 41) {
  d = a, e = Dc(c), n[d + 46 | 0] = e;
  return 1;
 }
 return yb(a, b, c) | 0;
}
function Xh(a) {
 a = a | 0;
 var b = 0;
 p[a + 76 >> 2] = 0;
 gf(a + 28 | 0);
 gf(a + 4 | 0);
 b = a + 40 | 0;
 qc(b);
 Uh(b);
 oc(b);
 qc(b);
 Rd(a + 52 | 0);
 Rd(a - -64 | 0);
}
function Nq(a, b, c, d) {
 while (1) {
  if ((b | 0) != (c | 0)) {
   c = c + -8 | 0;
   Se(a, p[d >> 2] + -8 | 0, c);
   p[d >> 2] = p[d >> 2] + -8;
   continue;
  }
  break;
 }
}
function xi(a, b, c) {
 if (b - a >>> 0 >= 4) {
  p[c >> 2] = q[a | 0] | q[a + 1 | 0] << 8 | (q[a + 2 | 0] << 16 | q[a + 3 | 0] << 24);
  a = 4;
 } else {
  a = 0;
 }
 return a;
}
function Ut(a, b, c, d, e, f, g, h, i) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 h = w(h);
 i = w(i);
 m[a | 0](b, c, d, e, f, g, h, i);
}
function jr(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 c = Ye(d, a, 1);
 Se(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 8;
 Sb(c);
 sa = d + 16 | 0;
}
function Zc(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 c = Hd(d, a, 1);
 kc(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 4;
 Sb(c);
 sa = d + 16 | 0;
}
function Vq(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 c = Ye(d, a, 1);
 Gh(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 8;
 Sb(c);
 sa = d + 16 | 0;
}
function Kb(a) {
 var b = 0;
 a = a * a;
 b = a * a;
 return w(a * -.499999997251031 + 1 + b * .04166662332373906 + a * b * (a * 2439044879627741e-20 + -.001388676377460993));
}
function uu(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[db(b + 8 | 0, p[a + 4 >> 2]) >> 2], d = 1, n[c | 0] = d;
 n[p[a + 8 >> 2]] = 1;
 sa = b + 16 | 0;
}
function cs(a, b) {
 var c = w(0), d = w(0);
 c = w(t[Ja(b, 0) >> 2] - t[Ja(a, 0) >> 2]);
 d = w(c * c);
 c = w(t[Ja(b, 1) >> 2] - t[Ja(a, 1) >> 2]);
 return w(d + w(c * c));
}
function wi(a) {
 var b = 0, c = 0;
 b = p[a >> 2];
 a : {
  if ((p[a + 4 >> 2] - b | 0) <= 0) {
   gd(a);
   break a;
  }
  p[a >> 2] = b + 1;
  c = q[b | 0];
 }
 return c;
}
function bg(a) {
 a = a | 0;
 var b = 0;
 p[a + 64 >> 2] = 13404;
 p[a >> 2] = 13320;
 b = p[a + 68 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 hb(a);
 return a | 0;
}
function nw(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = b;
 dw(p[a + 8 >> 2], d + 12 | 0, c);
 sa = d + 16 | 0;
}
function Ug(a, b) {
 var c = 0;
 c = p[a + 4 >> 2];
 while (1) {
  if ((b | 0) != (c | 0)) {
   Ma(a);
   c = c + -4 | 0;
   continue;
  }
  break;
 }
 p[a + 4 >> 2] = b;
}
function Oq(a, b) {
 var c = 0;
 c = p[a + 4 >> 2];
 while (1) {
  if ((b | 0) != (c | 0)) {
   Ma(a);
   c = c + -3 | 0;
   continue;
  }
  break;
 }
 p[a + 4 >> 2] = b;
}
function Nf(a, b) {
 var c = 0;
 c = p[a + 4 >> 2];
 while (1) {
  if ((b | 0) != (c | 0)) {
   Ma(a);
   c = c + -1 | 0;
   continue;
  }
  break;
 }
 p[a + 4 >> 2] = b;
}
function Gi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 155) {
  d = a, e = ec(c), p[d + 4 >> 2] = e;
 }
 return (b | 0) == 155 | 0;
}
function Dh(a, b) {
 var c = 0;
 c = p[a + 4 >> 2];
 while (1) {
  if ((b | 0) != (c | 0)) {
   Ma(a);
   c = c + -8 | 0;
   continue;
  }
  break;
 }
 p[a + 4 >> 2] = b;
}
function Po(a, b) {
 a = a | 0;
 b = b | 0;
 var c = w(0);
 c = t[b + 48 >> 2];
 t[a + 12 >> 2] = t[b + 52 >> 2];
 t[a + 8 >> 2] = c;
 t[a + 4 >> 2] = 0;
 t[a >> 2] = 0;
}
function Kg(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 d = c, e = zo(a, b), p[d >> 2] = e;
 a = p[zd(c + 8 | 0, c) >> 2];
 sa = c + 16 | 0;
 return a;
}
function vn(a, b) {
 a = a | 0;
 b = b | 0;
 a = 1;
 a : {
  switch (b + -67 | 0) {
  default:
   a = 0;
   break;
  case 0:
  case 2:
   break a;
  }
 }
 return a | 0;
}
function ut(a, b) {
 a = a | 0;
 b = b | 0;
 a = 1;
 a : {
  switch (b + -27 | 0) {
  default:
   a = 0;
   break;
  case 0:
  case 4:
   break a;
  }
 }
 return a | 0;
}
function rp(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 51) {
  d = a, e = ec(c), p[d + 4 >> 2] = e;
 }
 return (b | 0) == 51 | 0;
}
function pt(a, b) {
 var c = w(0);
 p[a >> 2] = b;
 c = q[b + 40 | 0] ? w(w(p[b + 32 >> 2]) / w(p[b + 16 >> 2])) : c;
 p[a + 8 >> 2] = 1;
 t[a + 4 >> 2] = c;
 return a;
}
function od() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 _f(a);
 Zf(a + 8 | 0, a, 13534);
 Cb(a);
 b = Hl(a + 8 | 0);
 Cb(a + 8 | 0);
 sa = a + 16 | 0;
 return b;
}
function dt(a, b) {
 a = a | 0;
 b = b | 0;
 a = 1;
 a : {
  switch (b + -54 | 0) {
  default:
   a = 0;
   break;
  case 0:
  case 3:
   break a;
  }
 }
 return a | 0;
}
function Sd(a) {
 bi(a);
 p[a + 160 >> 2] = 1056964608;
 p[a + 164 >> 2] = 1056964608;
 p[a + 152 >> 2] = 0;
 p[a + 156 >> 2] = 0;
 p[a >> 2] = 3508;
 p[a >> 2] = 4520;
}
function Qk(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 53) {
  d = a, e = ec(c), p[d + 4 >> 2] = e;
 }
 return (b | 0) == 53 | 0;
}
function Ll() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 _f(a);
 Zf(a + 8 | 0, a, 13518);
 Cb(a);
 b = Jl(a + 8 | 0);
 Cb(a + 8 | 0);
 sa = a + 16 | 0;
 return b;
}
function Jg() {
 var a = 0, b = 0, c = 0, d = 0;
 a = sa - 16 | 0;
 sa = a;
 c = a, d = uc(), p[c >> 2] = d;
 b = zd(a + 8 | 0, a);
 sa = a + 16 | 0;
 return p[b >> 2];
}
function vv(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 Xb(d + 12 | 0, p[b >> 2]);
 Bb(d + 12 | 0, t[c >> 2]);
 sa = d + 16 | 0;
 return a;
}
function rv(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 a = m[a | 0](c + 12 | 0) | 0;
 sa = c + 16 | 0;
 return a | 0;
}
function iw(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 Bb(d + 12 | 0, t[b >> 2]);
 Bb(d + 12 | 0, t[c >> 2]);
 sa = d + 16 | 0;
 return a;
}
function Dw(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 Xb(d + 12 | 0, p[b >> 2]);
 Xb(d + 12 | 0, p[c >> 2]);
 sa = d + 16 | 0;
 return a;
}
function nc(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 4648;
 b = p[a + 136 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 ib(a + 140 | 0);
 hb(a);
 return a | 0;
}
function oi(a, b) {
 var c = 0, d = 0, e = 0;
 c = p[Ja(b, 0) >> 2];
 d = Ja(a, 0), e = c, p[d >> 2] = e;
 b = p[Ja(b, 1) >> 2];
 d = Ja(a, 1), e = b, p[d >> 2] = e;
}
function Jn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 149) {
  d = a, e = ec(c), p[d + 4 >> 2] = e;
  return 1;
 }
 return 0;
}
function Bl(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 d = a, e = Z(21560, zl(c + 8 | 0, b) | 0) | 0, p[d >> 2] = e;
 sa = c + 16 | 0;
 return a;
}
function ru(a, b) {
 if (((i(a), e(2)) & 2147483647) >>> 0 <= 2139095040) {
  return ((i(b), e(2)) & 2147483647) >>> 0 > 2139095040 ? a : w(z(a, b));
 }
 return b;
}
function qu(a, b) {
 if (((i(a), e(2)) & 2147483647) >>> 0 <= 2139095040) {
  return ((i(b), e(2)) & 2147483647) >>> 0 > 2139095040 ? a : w(A(a, b));
 }
 return b;
}
function bw(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 Xb(d + 12 | 0, p[b >> 2]);
 Xb(d + 12 | 0, Cj(c));
 sa = d + 16 | 0;
 return a;
}
function Ig(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 uo(d + 8 | 0, b, c, c);
 b = d + 8 | 0;
 zd(a, b);
 n[a + 4 | 0] = q[b + 4 | 0];
 sa = d + 16 | 0;
}
function zm(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 8 >> 2] = b;
 b = r[p[c + 8 >> 2] >> 1];
 p[a + 4 >> 2] = 0;
 o[a >> 1] = b;
 sa = c + 16 | 0;
}
function Bo(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 8 >> 2] = b;
 b = p[p[c + 8 >> 2] >> 2];
 p[a + 4 >> 2] = 0;
 p[a >> 2] = b;
 sa = c + 16 | 0;
}
function cu(a, b, c, d, e, f, g, h) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 h = w(h);
 m[a | 0](b, c, d, e, f, g, h);
}
function nl() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 804;
 H(21577, 14912, 2, 14952, 14808, 805, Qc(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function cl() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 813;
 H(21619, 14912, 2, 15260, 14808, 814, Qc(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function _a(a, b) {
 var c = 0;
 c = b + -1 | 0;
 if (!(c & b)) {
  return a & c;
 }
 if (a >>> 0 >= b >>> 0) {
  a = (a >>> 0) % (b >>> 0) | 0;
 }
 return a;
}
function Wa(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = p[a >> 2];
 p[a >> 2] = p[b >> 2];
 p[b >> 2] = p[c + 12 >> 2];
 sa = c + 16 | 0;
}
function Ok() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 826;
 H(21662, 14912, 2, 15648, 14808, 827, Qc(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function Rl(a, b) {
 a = a | 0;
 b = b | 0;
 if (Me(p[a + 20 >> 2])) {
  p[p[a + 20 >> 2] + 72 >> 2] = a - -64;
  a = 0;
 } else {
  a = 2;
 }
 return a | 0;
}
function $c(a) {
 hf(a);
 p[a + 80 >> 2] = 0;
 p[a + 84 >> 2] = 0;
 p[a >> 2] = 4072;
 p[a + 88 >> 2] = 0;
 p[a + 92 >> 2] = 0;
 p[a >> 2] = 2988;
 return a;
}
function wu(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 if (!q[p[db(b + 8 | 0, p[a + 4 >> 2]) >> 2]]) {
  c = vu(a);
 }
 sa = b + 16 | 0;
 return c;
}
function js(a) {
 var b = 0;
 b = a;
 a = 0;
 while (1) {
  if ((a | 0) != 3) {
   p[(a << 2) + b >> 2] = 0;
   a = a + 1 | 0;
   continue;
  }
  break;
 }
}
function Nt(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = +c;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 return m[a | 0](b, c, d, e, f, g) | 0;
}
function Pd(a, b, c) {
 var d = w(0);
 d = w(b * w(3));
 c = w(c * w(3));
 return w(w(d + w(w(w(c + w(b * w(-6))) + w(w(d + w(w(1) - c)) * a)) * a)) * a);
}
function zl(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 4 >> 2] = a;
 Za(c + 8 | 0, b);
 Ij(c + 4 | 0, c + 8 | 0);
 sa = c + 16 | 0;
 return a;
}
function uw(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 mw(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Zv(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Nv(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Yv(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Lv(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Wv(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Gv(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Vv(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Ev(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Uv(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Cv(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Mw(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Cw(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function wm(a) {
 var b = 0, c = 0;
 b = a + 88 | 0;
 c = p[a + 116 >> 2];
 if (c) {
  ed(b, c + 88 | 0, a - -64 | 0);
  return;
 }
 es(b, a - -64 | 0);
}
function iv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16227;
 O(21758, p[a + 12 >> 2], 4, -2147483648, 2147483647);
 sa = a + 16 | 0;
}
function gs(a, b) {
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = p[b + 4 >> 2];
 p[a + 8 >> 2] = p[b + 8 >> 2];
 p[a + 12 >> 2] = p[b + 12 >> 2];
 return a;
}
function fv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16244;
 O(21774, p[a + 12 >> 2], 4, -2147483648, 2147483647);
 sa = a + 16 | 0;
}
function Xv(a, b) {
 a = a | 0;
 b = w(b);
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 t[c + 12 >> 2] = b;
 Jv(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Xs(a, b) {
 a = a | 0;
 b = b | 0;
 ud(a, b);
 if (Af(p[a + 20 >> 2])) {
  Ys(p[a + 20 >> 2], a);
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function No(a, b) {
 a = a | 0;
 b = b | 0;
 a = a + 104 | 0;
 if (ab(a) >>> 0 > b >>> 0) {
  a = p[Pa(a, b) >> 2];
 } else {
  a = 0;
 }
 return a | 0;
}
function Lo(a, b) {
 a = a | 0;
 b = b | 0;
 a = a + 116 | 0;
 if (ab(a) >>> 0 > b >>> 0) {
  a = p[Pa(a, b) >> 2];
 } else {
  a = 0;
 }
 return a | 0;
}
function xu(a) {
 var b = 0;
 if (a >>> 0 >= 11) {
  b = a + 16 & -16;
  a = b + -1 | 0;
  a = (a | 0) == 11 ? b : a;
 } else {
  a = 10;
 }
 return a;
}
function sd(a, b, c) {
 c = w(w(w(b >>> 0) * c) + w(w(w(1) - c) * w(a >>> 0)));
 if (c < w(4294967296) & c >= w(0)) {
  return ~~c >>> 0;
 }
 return 0;
}
function Rh(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 Jc(a + 4 | 0, cb(d + 8 | 0, b, c));
 sa = d + 16 | 0;
}
function eg(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 13072;
 b = p[a + 48 >> 2];
 if (b) {
  m[p[p[b >> 2] + 44 >> 2]](b);
 }
 hb(a);
 return a | 0;
}
function Yu(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 a = p[b + 12 >> 2];
 tj();
 sa = b + 16 | 0;
 return a | 0;
}
function Aq(a, b) {
 a = a | 0;
 b = b | 0;
 a : {
  if (!ob(b, 64)) {
   break a;
  }
  a = p[a + 132 >> 2];
  if (!a) {
   break a;
  }
  hh(a);
 }
}
function gw(a, b, c, d, e, f, g) {
 var h = 0;
 h = sa - 48 | 0;
 sa = h;
 K(fw() | 0, a | 0, 13689, ew(h, b, c, d, e, f, g) | 0);
 sa = h + 48 | 0;
}
function Jh(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 4308;
 b = p[a + 104 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 $e(a);
 return a | 0;
}
function Vt(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 m[a | 0](b, c, d, e, f, g);
}
function Mt(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 a = m[a | 0](b, c, d, e) | 0;
 aa(ta | 0);
 return a | 0;
}
function rq(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
 p[b + 12 >> 2] = 0;
 te(a + 8 | 0);
 sa = b + 16 | 0;
}
function qo(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c >> 2] = b;
 p[c + 8 >> 2] = a;
 a = Hg(c, c + 8 | 0);
 sa = c + 16 | 0;
 return a;
}
function bi(a) {
 kf(a);
 p[a + 128 >> 2] = 0;
 p[a >> 2] = 3636;
 p[a + 132 >> 2] = 0;
 p[a + 136 >> 2] = 0;
 p[a >> 2] = 4648;
 bb(a + 140 | 0);
}
function ze(a) {
 Nb(a);
 p[a + 12 >> 2] = -1;
 p[a + 4 >> 2] = 0;
 p[a + 8 >> 2] = 0;
 p[a >> 2] = 8568;
 p[a + 16 >> 2] = 0;
 p[a >> 2] = 1312;
}
function hu(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = w(e);
 f = f | 0;
 g = w(g);
 m[a | 0](b, c, d, e, f, g);
}
function Hc(a, b) {
 a = a | 0;
 b = b | 0;
 re(a, b);
 if (ob(b, 8)) {
  zq(p[a + 136 >> 2], m[p[p[a >> 2] + 100 >> 2]](a) | 0, a + 140 | 0);
 }
}
function zg(a) {
 ai(a);
 p[a >> 2] = 11252;
 p[a >> 2] = 11164;
 p[a + 120 >> 2] = 0;
 p[a >> 2] = 11072;
 p[a >> 2] = 2016;
 bb(a + 124 | 0);
}
function an(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 14) {
  return 18435 >>> (a & 32767) & 1;
 }
 return 0;
}
function Tt(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 m[a | 0](b, c, d, e, f, g);
}
function Ci(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 2324;
 b = p[a + 108 >> 2];
 if (b) {
  Ua(b);
 }
 ib(a + 96 | 0);
 hb(a);
 return a | 0;
}
function nj(a, b, c, d) {
 var e = 0, f = 0;
 e = a;
 f = b;
 if (c != w(1)) {
  d = w(w(c * d) + w(w(w(1) - c) * Wu(a, b)));
 }
 Ru(e, f, d);
}
function kv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16206;
 O(21772, p[a + 12 >> 2], 2, -32768, 32767);
 sa = a + 16 | 0;
}
function jh(a) {
 a = a | 0;
 p[a >> 2] = 5448;
 hb(a + 364 | 0);
 hb(a + 300 | 0);
 hb(a + 236 | 0);
 hb(a + 172 | 0);
 nc(a);
 return a | 0;
}
function ei(a) {
 a = a | 0;
 p[a >> 2] = 3252;
 hb(a + 456 | 0);
 hb(a + 360 | 0);
 hb(a + 264 | 0);
 hb(a + 168 | 0);
 nc(a);
 return a | 0;
}
function tv(a) {
 var b = 0, c = 0, d = 0;
 b = $d(Vc(a) + 4 | 0);
 c = b, d = Vc(a), p[c >> 2] = d;
 Pb(b + 4 | 0, Fc(a), Vc(a));
 return b;
}
function fn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 12) {
  return 4099 >>> (a & 8191) & 1;
 }
 return 0;
}
function cn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 12) {
  return 4227 >>> (a & 8191) & 1;
 }
 return 0;
}
function Ym(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 11) {
  return 2051 >>> (a & 4095) & 1;
 }
 return 0;
}
function Yh(a) {
 var b = w(0);
 a : {
  if (a < w(0)) {
   break a;
  }
  b = w(1);
  if (a > w(1)) {
   break a;
  }
  b = a;
 }
 return b;
}
function Qm(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 11) {
  return 3075 >>> (a & 4095) & 1;
 }
 return 0;
}
function Iq(a, b, c, d) {
 a = c - b | 0;
 c = p[d >> 2] + v((a | 0) / -3 | 0, 3) | 0;
 p[d >> 2] = c;
 if ((a | 0) >= 1) {
  Pb(c, b, a);
 }
}
function Ko(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -1 | 0;
 if ((a & 65535) >>> 0 <= 10) {
  return 1537 >>> (a & 2047) & 1;
 }
 return 0;
}
function Av(a, b, c, d, e, f) {
 var g = 0;
 g = sa - 32 | 0;
 sa = g;
 K(zv() | 0, a | 0, b | 0, yv(g, c, d, e, f) | 0);
 sa = g + 32 | 0;
}
function wt(a, b) {
 a = a | 0;
 b = b | 0;
 b = zc(b, 1);
 if (b) {
  Xo(p[b + 4 >> 2], a);
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function vq(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -5 | 0;
 if ((a & 65535) >>> 0 <= 9) {
  return 609 >>> (a & 1023) & 1;
 }
 return 0;
}
function nv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16175;
 O(21769, p[a + 12 >> 2], 1, -128, 127);
 sa = a + 16 | 0;
}
function mv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16180;
 O(21770, p[a + 12 >> 2], 1, -128, 127);
 sa = a + 16 | 0;
}
function Dm(a, b) {
 var c = 0;
 c = sa - 32 | 0;
 sa = c;
 ue(db(c + 24 | 0, b));
 Cm(c + 8 | 0, a, b);
 Bd(c + 8 | 0);
 sa = c + 32 | 0;
}
function rn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -60 | 0;
 if ((a & 65535) >>> 0 <= 6) {
  return 73 >>> (a & 127) & 1;
 }
 return 0;
}
function pq(a, b, c, d) {
 var e = 0;
 e = sa - 16 | 0;
 sa = e;
 d = Hd(e, a, d);
 th(Ma(a), b, c, d + 4 | 0);
 Sb(d);
 sa = e + 16 | 0;
}
function nn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -60 | 0;
 if ((a & 65535) >>> 0 <= 6) {
  return 81 >>> (a & 127) & 1;
 }
 return 0;
}
function jv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16212;
 O(21773, p[a + 12 >> 2], 2, 0, 65535);
 sa = a + 16 | 0;
}
function Kn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -60 | 0;
 if ((a & 65535) >>> 0 <= 6) {
  return 67 >>> (a & 127) & 1;
 }
 return 0;
}
function An(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -60 | 0;
 if ((a & 65535) >>> 0 <= 6) {
  return 69 >>> (a & 127) & 1;
 }
 return 0;
}
function yn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -67 | 0;
 if ((a & 65535) >>> 0 <= 3) {
  return 13 >>> (a & 15) & 1;
 }
 return 0;
}
function pn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -54 | 0;
 if ((a & 65535) >>> 0 <= 4) {
  return 19 >>> (a & 31) & 1;
 }
 return 0;
}
function or(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if ((a & 65535) >>> 0 <= 4) {
  return 19 >>> (a & 31) & 1;
 }
 return 0;
}
function kh(a, b, c) {
 var d = 0;
 p[a >> 2] = p[b >> 2];
 d = p[b >> 2];
 p[a + 8 >> 2] = b;
 p[a + 4 >> 2] = (c << 2) + d;
 return a;
}
function jn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -54 | 0;
 if ((a & 65535) >>> 0 <= 5) {
  return 35 >>> (a & 63) & 1;
 }
 return 0;
}
function Hv(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 Bb(c + 12 | 0, t[b >> 2]);
 sa = c + 16 | 0;
 return a;
}
function Fq(a, b, c) {
 var d = 0;
 p[a >> 2] = p[b >> 2];
 d = p[b >> 2];
 p[a + 8 >> 2] = b;
 p[a + 4 >> 2] = (c << 3) + d;
 return a;
}
function Bc(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 Xb(c + 12 | 0, p[b >> 2]);
 sa = c + 16 | 0;
 return a;
}
function lv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16192;
 O(21771, p[a + 12 >> 2], 1, 0, 255);
 sa = a + 16 | 0;
}
function hv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16231;
 O(21559, p[a + 12 >> 2], 4, 0, -1);
 sa = a + 16 | 0;
}
function ev() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16249;
 O(21746, p[a + 12 >> 2], 4, 0, -1);
 sa = a + 16 | 0;
}
function Wd(a) {
 var b = w(0), c = w(0);
 b = t[Ja(a, 0) >> 2];
 c = w(b * b);
 b = t[Ja(a, 1) >> 2];
 return w(D(w(c + w(b * b))));
}
function om(a, b) {
 a = a | 0;
 b = b | 0;
 b = Eb(a, b);
 if (!b) {
  return dg(a + 68 | 0, p[a + 20 >> 2]) ^ 1;
 }
 return b | 0;
}
function Uj() {
 var a = 0;
 a = La(16);
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
 p[a + 8 >> 2] = 0;
 p[a + 12 >> 2] = 0;
 return a | 0;
}
function Qs(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 30) {
  return 1879048195 >>> a & 1;
 }
 return 0;
}
function Js(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 31) {
  return -268435453 >>> a & 1;
 }
 return 0;
}
function Gw(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 Xb(c + 12 | 0, Cj(b));
 sa = c + 16 | 0;
 return a;
}
function Gj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 Xb(c + 12 | 0, Mf(b));
 sa = c + 16 | 0;
 return a;
}
function sr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 28) {
  return 268435459 >>> a & 1;
 }
 return 0;
}
function Nr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -6 & 65535;
 if (a >>> 0 <= 30) {
  return 1073742129 >>> a & 1;
 }
 return 0;
}
function Km(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 29) {
  return 805306371 >>> a & 1;
 }
 return 0;
}
function Jr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 26) {
  return 100663315 >>> a & 1;
 }
 return 0;
}
function Tr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 26) {
  return 83886099 >>> a & 1;
 }
 return 0;
}
function Fr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 & 65535;
 if (a >>> 0 <= 26) {
  return 67108883 >>> a & 1;
 }
 return 0;
}
function Fo(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = 0;
 Fe(a, b + 12 | 0);
 Eo(a + 4 | 0);
 sa = b + 16 | 0;
}
function ln(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -67 | 0;
 if ((a & 65535) >>> 0 <= 4) {
  return !(a & 1) | 0;
 }
 return 0;
}
function bu(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 m[a | 0](b, c, d, e, f);
}
function _q(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 Qh(a, b, c);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 24 >> 2]](a, b, c);
}
function Zd(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 120 >> 2] != b) {
  t[a + 120 >> 2] = b;
  m[p[p[a >> 2] + 80 >> 2]](a);
 }
}
function Yi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 124 >> 2] != b) {
  t[a + 124 >> 2] = b;
  m[p[p[a >> 2] + 84 >> 2]](a);
 }
}
function Wi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 136 >> 2] != b) {
  t[a + 136 >> 2] = b;
  m[p[p[a >> 2] + 84 >> 2]](a);
 }
}
function Wc(a) {
 var b = 0, c = 0;
 Do(a, p[a + 8 >> 2]);
 c = a;
 b = p[a >> 2];
 p[a >> 2] = 0;
 if (b) {
  sb(c);
  Ua(b);
 }
}
function Vi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 140 >> 2] != b) {
  t[a + 140 >> 2] = b;
  m[p[p[a >> 2] + 88 >> 2]](a);
 }
}
function Jj(a, b, c) {
 var d = 0;
 p[a >> 2] = p[b >> 2];
 d = p[b >> 2];
 p[a + 8 >> 2] = b;
 p[a + 4 >> 2] = c + d;
 return a;
}
function $q(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 Rh(a, b, c);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 20 >> 2]](a, b, c);
}
function Gt(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = e | 0;
 f = w(f);
 Si(b, c, p[a + 24 >> 2]);
}
function zb(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 52 >> 2] != b) {
  t[a + 52 >> 2] = b;
  m[p[p[a >> 2] + 56 >> 2]](a);
 }
}
function ym(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 a = p[db(b + 8 | 0, p[a + 8 >> 2]) >> 2];
 sa = b + 16 | 0;
 return a;
}
function kw(a, b, c, d) {
 var e = 0;
 e = sa - 16 | 0;
 sa = e;
 K(jw() | 0, a | 0, b | 0, iw(e, c, d) | 0);
 sa = e + 16 | 0;
}
function io(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 136 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function dv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16263;
 W(21622, p[a + 12 >> 2], 4);
 sa = a + 16 | 0;
}
function cv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16269;
 W(21740, p[a + 12 >> 2], 8);
 sa = a + 16 | 0;
}
function bv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16380;
 M(21775, 0, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function av() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16624;
 M(21781, 4, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function _u() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16892;
 M(21783, 6, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Zu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16923;
 M(21784, 7, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Zi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 56 >> 2] != b) {
  t[a + 56 >> 2] = b;
  m[p[p[a >> 2] + 60 >> 2]](a);
 }
}
function Ys(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 124 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Xo(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Ic(a + 104 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Rt(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = w(e);
 f = w(f);
 m[a | 0](b, c, d, e, f);
}
function Ip(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 236 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Gb(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Ic(a + 140 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Bh(a, b, c) {
 a = q[c | 0] | q[c + 1 | 0] << 8;
 n[b | 0] = a;
 n[b + 1 | 0] = a >>> 8;
 n[b + 2 | 0] = q[c + 2 | 0];
}
function Ab(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 48 >> 2] != b) {
  t[a + 48 >> 2] = b;
  m[p[p[a >> 2] + 52 >> 2]](a);
 }
}
function $u() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 16654;
 M(21782, 5, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function yl(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Hj() | 0, a | 0, 13560, Gj(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function xt(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 44 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function qg(a) {
 rc(a);
 n[a + 46 | 0] = 1;
 p[a >> 2] = 10108;
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 13072;
}
function mw(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(lw() | 0, a | 0, 13666, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function mm(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 80 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Yo(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Ic(a + 92 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Rb(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Ic(a + 24 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Nv(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Mv() | 0, a | 0, 13989, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Lv(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Kv() | 0, a | 0, 13960, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Jw(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Hw() | 0, a | 0, 13591, Gw(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Jv(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Iv() | 0, a | 0, 13995, Hv(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Gv(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Fv() | 0, a | 0, 14005, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Ev(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Dv() | 0, a | 0, 14010, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Dj(a, b) {
 a = a | 0;
 b = b | 0;
 b = zc(b, 1);
 if (b) {
  vi(b, a);
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function Cw(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Bw() | 0, a | 0, 13610, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Cv(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Bv() | 0, a | 0, 14014, Bc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function As(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 96 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function up(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 4 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function ap(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 a = p[db(c + 8 | 0, _o(a, b)) >> 2];
 sa = c + 16 | 0;
 return a;
}
function Zh(a) {
 rc(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 4240;
 p[a + 56 >> 2] = 0;
 p[a >> 2] = 4964;
}
function Ui(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 a = p[db(c + 8 | 0, Bi(a, b)) >> 2];
 sa = c + 16 | 0;
 return a;
}
function Pn(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 a = p[db(c + 8 | 0, Gm(a, b)) >> 2];
 sa = c + 16 | 0;
 return a;
}
function Ot(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 m[a | 0](b, c, d, e, f);
}
function Dp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Eb(a, b);
 if (!c) {
  c = Eb(a + 176 | 0, b);
 }
 return c | 0;
}
function Ah(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 8 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function xv(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 K(wv() | 0, a | 0, 14054, vv(d, b, c) | 0);
 sa = d + 16 | 0;
}
function sj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(21776, 0, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function rj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(21560, 1, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function qj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(21777, 2, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function pj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(21778, 3, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function oj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(21779, 4, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function mj(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(21780, 5, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function fh(a) {
 a = a | 0;
 p[a >> 2] = 5712;
 ib(a + 236 | 0);
 Re(a + 176 | 0);
 eh(a + 160 | 0);
 dh(a);
 return a | 0;
}
function dw(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 K(cw() | 0, a | 0, 13658, bw(d, b, c) | 0);
 sa = d + 16 | 0;
}
function bh(a) {
 a = a | 0;
 p[a >> 2] = 6696;
 hb(a + 296 | 0);
 hb(a + 232 | 0);
 hb(a + 168 | 0);
 nc(a);
 return a | 0;
}
function Lc() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 b = db(a + 8 | 0, uc());
 sa = a + 16 | 0;
 return p[b >> 2];
}
function Fw(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 K(Ew() | 0, a | 0, 13601, Dw(d, b, c) | 0);
 sa = d + 16 | 0;
}
function Ag(a) {
 Ub(a);
 p[a + 48 >> 2] = 255;
 p[a + 52 >> 2] = 1;
 p[a >> 2] = 11004;
 p[a >> 2] = 2564;
 gb(a + 56 | 0);
}
function Lw(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Kw() | 0, a | 0, b | 0, Of(c + 8 | 0) | 0);
 sa = c + 16 | 0;
}
function yh(a) {
 a = a | 0;
 var b = 0, c = 0;
 se(a);
 b = a, c = Xc(p[a + 132 >> 2] + 160 | 0, 0), p[b + 136 >> 2] = c;
}
function Xa(a) {
 var b = 0, c = 0;
 b = La(8);
 c = p[a + 4 >> 2];
 p[b >> 2] = p[a >> 2];
 p[b + 4 >> 2] = c;
 return b;
}
function uc() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 b = db(a + 8 | 0, 0);
 sa = a + 16 | 0;
 return p[b >> 2];
}
function Lf(a, b, c, d) {
 var e = 0, f = 0;
 e = a;
 f = b;
 if (c != w(1)) {
  d = jg(Sw(a, b), d, c);
 }
 Iw(e, f, d);
}
function xd(a, b, c, d) {
 a = c - b | 0;
 c = p[d >> 2] - a | 0;
 p[d >> 2] = c;
 if ((a | 0) >= 1) {
  Pb(c, b, a);
 }
}
function ae(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = c;
 jj(a, b, c, 0, 0);
 sa = d + 16 | 0;
}
function Ye(a, b, c) {
 p[a >> 2] = b;
 b = p[b + 4 >> 2];
 p[a + 4 >> 2] = b;
 p[a + 8 >> 2] = b + (c << 3);
 return a;
}
function Hd(a, b, c) {
 p[a >> 2] = b;
 b = p[b + 4 >> 2];
 p[a + 4 >> 2] = b;
 p[a + 8 >> 2] = b + (c << 2);
 return a;
}
function wj(a) {
 a = a | 0;
 p[a >> 2] = 15728;
 if (q[a + 4 | 0]) {
  gc(a, 15076);
 }
 Cb(a + 8 | 0);
 return a | 0;
}
function ml(a, b) {
 a = a | 0;
 b = b | 0;
 b = zc(b, 25);
 if (!b) {
  return 1;
 }
 Ah(p[b + 4 >> 2], a);
 return 0;
}
function ie(a, b) {
 a = a | 0;
 b = b | 0;
 p[a + 52 >> 2] = b;
 b = a;
 a = Ll();
 p[b + 48 >> 2] = a;
 return a | 0;
}
function Vo(a, b) {
 Id(a + 44 | 0, 2);
 if (s[b + 36 >> 2] < s[a + 164 >> 2]) {
  p[a + 164 >> 2] = p[b + 36 >> 2];
 }
}
function Un(a) {
 a = a | 0;
 a = a + 4 | 0;
 if (ff(a)) {
  a = 0;
 } else {
  a = p[Pa(a, 0) >> 2];
 }
 return a | 0;
}
function Pp(a, b) {
 a = a | 0;
 b = b | 0;
 b = zc(b, 31);
 if (!b) {
  return 1;
 }
 xt(p[b + 4 >> 2], a);
 return 0;
}
function Jf(a) {
 a = a | 0;
 p[a >> 2] = 15012;
 if (q[a + 4 | 0]) {
  gc(a, 15076);
 }
 Cb(a + 8 | 0);
 return a | 0;
}
function Ij(a, b) {
 p[p[a >> 2] >> 2] = p[b >> 2];
 p[p[a >> 2] + 4 >> 2] = p[b + 4 >> 2];
 p[a >> 2] = p[a >> 2] + 8;
}
function Cg(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 a = p[db(b + 8 | 0, ym(a)) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Aj(a) {
 a = a | 0;
 p[a >> 2] = 15336;
 if (q[a + 4 | 0]) {
  gc(a, 15076);
 }
 Cb(a + 8 | 0);
 return a | 0;
}
function xw(a, b) {
 p[a >> 2] = 0;
 Kh(a);
 p[a >> 2] = 15388;
 Pc(a + 4 | 0);
 p[a >> 2] = 15336;
 be(a + 8 | 0, b);
}
function sq(a, b) {
 p[a >> 2] = 4032;
 p[a >> 2] = 2108;
 ej(a + 4 | 0, b + 4 | 0);
 p[a + 16 >> 2] = p[b + 16 >> 2];
}
function jg(a, b, c) {
 return lg(sd(ne(a), ne(b), c), sd(qe(a), qe(b), c), sd(pe(a), pe(b), c), sd(oe(a), oe(b), c));
}
function hq(a) {
 a = a | 0;
 var b = 0;
 b = a + 156 | 0;
 if (p[b + 4 >> 2]) {
  Db(p[b + 4 >> 2], 8, 0);
 }
 wh(a);
}
function hf(a) {
 Zh(a);
 p[a >> 2] = 4168;
 o[a + 60 >> 1] = 0;
 p[a >> 2] = 3172;
 gb(a - -64 | 0);
 gb(a + 72 | 0);
}
function Do(a, b) {
 Ma(a);
 while (1) {
  if (b) {
   a = p[b >> 2];
   Ua(b);
   b = a;
   continue;
  }
  break;
 }
}
function Bd(a) {
 var b = 0;
 b = p[a >> 2];
 p[a >> 2] = 0;
 if (b) {
  q[sb(a) + 4 | 0];
  if (b) {
   Ua(b);
  }
 }
}
function yq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = Hh(b, a);
 sa = c + 16 | 0;
 return d ? b : a;
}
function th(a, b, c, d) {
 a = c - b | 0;
 if ((a | 0) >= 1) {
  Pb(p[d >> 2], b, a);
  p[d >> 2] = p[d >> 2] + a;
 }
}
function Zm(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = ve(a, b);
 sa = c + 16 | 0;
 return d ? b : a;
}
function Tq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = Hh(a, b);
 sa = c + 16 | 0;
 return d ? b : a;
}
function Om(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = ve(b, a);
 sa = c + 16 | 0;
 return d ? b : a;
}
function $i(a, b, c) {
 a : {
  if (p[c + 76 >> 2] <= -1) {
   a = Ef(a, b, c);
   break a;
  }
  a = Ef(a, b, c);
 }
}
function ii(a) {
 if (!q[a + 60 | 0]) {
  m[p[p[a >> 2] + 64 >> 2]](a);
  n[a + 60 | 0] = 1;
 }
 return a - -64 | 0;
}
function dm(a, b) {
 a = a | 0;
 b = b | 0;
 b = vp(p[a + 20 >> 2]);
 if (!b) {
  return 1;
 }
 up(b, a);
 return 0;
}
function kq(a) {
 a = a | 0;
 var b = 0;
 yh(a);
 b = a + 156 | 0;
 if (p[b + 4 >> 2]) {
  Rb(p[b + 4 >> 2], a);
 }
}
function hi(a) {
 if (!q[a + 61 | 0]) {
  m[p[p[a >> 2] + 68 >> 2]](a);
  n[a + 61 | 0] = 1;
 }
 return a + 72 | 0;
}
function _e(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 a = p[db(b + 8 | 0, a) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Je(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 mg(b + 8 | 0, a);
 sa = b + 16 | 0;
 return p[b + 8 >> 2];
}
function Ee(a, b) {
 a = sa - 16 | 0;
 sa = a;
 p[a + 8 >> 2] = b;
 b = Co(a + 8 | 0);
 sa = a + 16 | 0;
 return b;
}
function $b(a, b) {
 if (of(b)) {
  Ib(a, qh(p[b + 56 >> 2]));
  return;
 }
 cb(a, t[b + 48 >> 2], t[b + 52 >> 2]);
}
function jt(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 4 >> 2] != b) {
  p[a + 8 >> 2] = 1;
  t[a + 4 >> 2] = b;
 }
}
function Zw(a) {
 var b = 0;
 b = a & 31;
 a = 0 - a & 31;
 return (-1 >>> b & -2) << b | (-1 << a & -2) >>> a;
}



function Hu(a) {
 var b = 0, c = 0;
 b = _i(a) + 1 | 0;
 c = $d(b);
 if (!c) {
  return 0;
 }
 return Pb(c, a, b);
}
function Eo(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = 0;
 Ge(a, b + 12 | 0);
 sa = b + 16 | 0;
}
function xe(a) {
 a = a | 0;
 p[a + 68 >> 2] = 12892;
 p[a >> 2] = 12804;
 ib(a + 80 | 0);
 hb(a);
 return a | 0;
}
function vh(a, b) {
 xq(a, b);
 p[a >> 2] = 4760;
 p[a + 60 >> 2] = p[b + 60 >> 2];
 p[a >> 2] = 6620;
 return a;
}
function ns(a, b, c) {
 p[a + 12 >> 2] = c;
 n[a + 8 | 0] = 0;
 p[a >> 2] = b;
 p[a + 4 >> 2] = b + c;
 return a;
}
function Pi(a, b) {
 if (p[a + 128 >> 2] != (b | 0)) {
  p[a + 128 >> 2] = b;
  m[p[p[a >> 2] + 88 >> 2]](a);
 }
}
function wl() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 qa(13564, 2, 14780, 14788, 796, 685);
 sa = a + 16 | 0;
}
function dj(a, b) {
 p[a + 12 >> 2] = 0;
 p[a + 4 >> 2] = b;
 p[a >> 2] = b;
 p[a + 8 >> 2] = b + 1;
 return a;
}
function bk() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 ha(21759, 2, 16108, 14788, 848, 781);
 sa = a + 16 | 0;
}
function Wt(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 m[a | 0](b, c, d, e);
}
function vj(a, b) {
 if (p[a + 24 >> 2] != (b | 0)) {
  p[a + 24 >> 2] = b;
  m[p[p[a >> 2] + 52 >> 2]](a);
 }
}
function iu(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = w(e);
 m[a | 0](b, c, d, e);
}
function ib(a) {
 var b = 0;
 We(a);
 if (p[a >> 2]) {
  $g(a);
  Ma(a);
  b = p[a >> 2];
  mc(a);
  Ua(b);
 }
}
function Ze(a) {
 var b = 0;
 Te(a);
 if (p[a >> 2]) {
  Wh(a);
  Ma(a);
  b = p[a >> 2];
  pc(a);
  Ua(b);
 }
}
function Ri(a, b) {
 if (p[a + 16 >> 2] != (b | 0)) {
  p[a + 16 >> 2] = b;
  m[p[p[a >> 2] + 36 >> 2]](a);
 }
}
function Qi(a, b) {
 if (p[a + 12 >> 2] != (b | 0)) {
  p[a + 12 >> 2] = b;
  m[p[p[a >> 2] + 40 >> 2]](a);
 }
}
function If(a, b) {
 if (p[a + 48 >> 2] != (b | 0)) {
  p[a + 48 >> 2] = b;
  m[p[p[a >> 2] + 52 >> 2]](a);
 }
}
function Ej(a, b) {
 p[a >> 2] = 0;
 p[a >> 2] = 15048;
 Pc(a + 4 | 0);
 p[a >> 2] = 15012;
 be(a + 8 | 0, b);
}
function $v(a, b) {
 p[a >> 2] = 0;
 p[a >> 2] = 15784;
 Pc(a + 4 | 0);
 p[a >> 2] = 15728;
 be(a + 8 | 0, b);
}
function Yt(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = w(e);
 m[a | 0](b, c, d, e);
}
function Wl(a) {
 a = a | 0;
 var b = 0;
 b = p[a + 48 >> 2];
 m[p[p[b >> 2] + 16 >> 2]](b, p[a + 60 >> 2]);
}
function Vl(a) {
 a = a | 0;
 var b = 0;
 b = p[a + 48 >> 2];
 m[p[p[b >> 2] + 12 >> 2]](b, p[a + 64 >> 2]);
}
function Lu(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Ku(a, b);
 sa = c + 16 | 0;
}
function Au(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 a = zu(a, b, c);
 sa = d + 16 | 0;
 return a;
}
function kf(a) {
 ai(a);
 p[a + 120 >> 2] = 0;
 p[a + 124 >> 2] = 0;
 p[a >> 2] = 3736;
 p[a >> 2] = 12472;
}
function Xl(a) {
 a = a | 0;
 var b = 0;
 b = p[a + 48 >> 2];
 m[p[p[b >> 2] + 8 >> 2]](b, t[a + 56 >> 2]);
}
function oh(a) {
 Sd(a);
 p[a + 168 >> 2] = 5;
 p[a + 172 >> 2] = 0;
 p[a >> 2] = 5312;
 p[a >> 2] = 5168;
}
function jq(a) {
 a = a | 0;
 if (p[a + 160 >> 2]) {
  a = 21520;
 } else {
  a = cc(a);
 }
 return a | 0;
}
function Yn(a) {
 a = a + -4 | 0;
 if (a >>> 0 <= 154) {
  return p[(a << 2) + 11772 >> 2];
 }
 return -1;
}
function Bj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 Ff(a, b + 4 | 0, p[b >> 2]);
 sa = c + 16 | 0;
}
function Of(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 sa = b + 16 | 0;
 return a;
}
function ku(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 return m[a | 0](b, c, d) | 0;
}
function bj(a, b) {
 if (t[a + 12 >> 2] != b) {
  t[a + 12 >> 2] = b;
  m[p[p[a >> 2] + 40 >> 2]](a);
 }
}
function Xi(a, b) {
 if (t[a + 88 >> 2] != b) {
  t[a + 88 >> 2] = b;
  m[p[p[a >> 2] + 80 >> 2]](a);
 }
}
function Mc(a, b) {
 if (t[a + 60 >> 2] != b) {
  t[a + 60 >> 2] = b;
  m[p[p[a >> 2] + 64 >> 2]](a);
 }
}
function rb(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 a = wu(dj(b, a));
 sa = b + 16 | 0;
 return a;
}
function Qt(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 return m[a | 0](b, c, d) | 0;
}
function um(a, b) {
 a = a | 0;
 b = b | 0;
 a = ie(a, b);
 m[p[p[a >> 2] >> 2]](a, 1);
 return a | 0;
}
function qv(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 nj(b, c, d, t[a + 24 >> 2]);
}
function jl(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 jd(a, U(Fc(b) | 0, 21577, p[c >> 2]) | 0);
}
function al(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 jd(a, U(Fc(b) | 0, 21619, p[c >> 2]) | 0);
}
function Qq(a) {
 var b = 0;
 if (p[a >> 2]) {
  Uh(a);
  Ma(a);
  b = p[a >> 2];
  oc(a);
  Ua(b);
 }
}
function Mk(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 jd(a, U(Fc(b) | 0, 21662, p[c >> 2]) | 0);
}
function Lj(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 Lf(b, c, d, p[a + 24 >> 2]);
}
function St(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = +d;
 return m[a | 0](b, c, d) | 0;
}
function ll(a) {
 a = a | 0;
 var b = 0;
 b = La(12);
 Ej(b, a);
 p[b >> 2] = 14976;
 return b | 0;
}
function bl(a) {
 a = a | 0;
 var b = 0;
 b = La(12);
 xw(b, a);
 p[b >> 2] = 15284;
 return b | 0;
}
function Xq(a, b) {
 a = a | 0;
 b = b | 0;
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 12 >> 2]](a, b);
}
function Nk(a) {
 a = a | 0;
 var b = 0;
 b = La(12);
 $v(b, a);
 p[b >> 2] = 15672;
 return b | 0;
}
function Ht(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 Si(b, c, p[a + 24 >> 2]);
}
function Ne(a, b, c, d, e) {
 Ab(b, w(xc(e) * d));
 zb(b, w(yc(e) * c));
 Mc(b, t[a + 172 >> 2]);
}
function Yc(a) {
 if (p[a + 20 >> 2]) {
  a = p[a + 20 >> 2];
  m[p[p[a >> 2] + 96 >> 2]](a);
 }
}
function yg(a) {
 p[a + 4 >> 2] = 1065353216;
 p[a + 8 >> 2] = 0;
 p[a >> 2] = 9904;
 return a;
}
function Za(a, b) {
 var c = 0;
 c = p[b + 4 >> 2];
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = c;
}
function lg(a, b, c, d) {
 return d & 255 | (c << 8 & 65280 | (b << 16 & 16711680 | a << 24));
}
function Zj(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 Li(p[a >> 2], b, t[a + 4 >> 2], c);
}
function Yd(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 Ff(a, b, _i(b));
 sa = c + 16 | 0;
}
function Tb(a) {
 Zh(a);
 p[a + 60 >> 2] = 0;
 p[a >> 2] = 4760;
 p[a >> 2] = 6620;
 return a;
}
function Ic(a, b) {
 if (p[a + 4 >> 2] != p[Ma(a) >> 2]) {
  Zc(a, b);
  return;
 }
 xh(a, b);
}
function Hb(a, b) {
 if (p[a + 4 >> 2] != p[Ma(a) >> 2]) {
  Zc(a, b);
  return;
 }
 sh(a, b);
}
function Ec(a, b) {
 var c = 0;
 c = p[a >> 2];
 p[a >> 2] = b;
 if (c) {
  sb(a);
  Ua(c);
 }
}
function mr(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  Zc(a, b);
  return;
 }
 sh(a, b);
}
function eu(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 m[a | 0](b, c, d);
}
function dr(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  Vq(a, b);
  return;
 }
 Uq(a, b);
}
function cf(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  hr(a, b);
  return;
 }
 gr(a, b);
}
function Xg(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  Zc(a, b);
  return;
 }
 xh(a, b);
}
function Jc(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  jr(a, b);
  return;
 }
 ir(a, b);
}
function Zt(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 m[a | 0](b, c, d);
}
function zs(a, b) {
 a = a | 0;
 b = b | 0;
 a = p[a + 112 >> 2];
 m[p[p[a >> 2] >> 2]](a);
}
function du(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 m[a | 0](b, c, d);
}
function $f(a) {
 a = a | 0;
 p[a + 72 >> 2] = 0;
 Db(p[p[a + 20 >> 2] + 20 >> 2], 256, 0);
}
function tn(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 27 | (b | 0) == 53) | 0;
}
function ss(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 44) | 0;
}
function os(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 45) | 0;
}
function _v(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 29 | (b | 0) == 37) | 0;
}
function Wm(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 18) | 0;
}
function Tm(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 19) | 0;
}
function Nl(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 47) | 0;
}
function Ho(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 48) | 0;
}
function Et(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 29 | (b | 0) == 50) | 0;
}
function Bt(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 60 | (b | 0) == 66) | 0;
}
function Yq(a) {
 a = a | 0;
 Oh(a);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 32 >> 2]](a);
}
function zf(a) {
 a = a | 0;
 p[a >> 2] = 2016;
 ib(a + 124 | 0);
 hb(a);
 return a | 0;
}
function qb(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 uu(dj(b, a));
 sa = b + 16 | 0;
}
function km(a, b) {
 a = a | 0;
 b = b | 0;
 return t[a + 52 >> 2] < t[b + 52 >> 2] | 0;
}
function dh(a) {
 a = a | 0;
 p[a >> 2] = 5928;
 ib(a + 136 | 0);
 hb(a);
 return a | 0;
}
function au(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return w(w(m[a | 0](b, c)));
}
function ar(a) {
 a = a | 0;
 Xh(a);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 8 >> 2]](a);
}
function li(a) {
 a = a | 0;
 p[a >> 2] = 2756;
 ib(a + 60 | 0);
 hb(a);
 return a | 0;
}
function hb(a) {
 a = a | 0;
 p[a >> 2] = 7264;
 ib(a + 24 | 0);
 Ei(a);
 return a | 0;
}
function wh(a) {
 a = a | 0;
 Db(a, 8, 0);
 a = p[a + 132 >> 2];
 if (a) {
  hh(a);
 }
}
function lu(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return m[a | 0](b, c) | 0;
}
function df(a, b, c) {
 n[a + 2 | 0] = 0;
 n[a + 1 | 0] = c;
 n[a | 0] = b;
 return a;
}
function Ib(a, b) {
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = p[b + 4 >> 2];
 return a;
}
function Gh(a, b, c) {
 a = p[c + 4 >> 2];
 p[b >> 2] = p[c >> 2];
 p[b + 4 >> 2] = a;
}
function Xt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 return m[a | 0](b, c) | 0;
}
function Sj(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 t[p[a >> 2] + b >> 2] = c;
}
function ug(a) {
 Nb(a);
 p[a >> 2] = 1832;
 Yd(a + 4 | 0, 7880);
 p[a >> 2] = 8460;
}
function Be(a) {
 Nb(a);
 p[a >> 2] = 1676;
 Yd(a + 4 | 0, 7880);
 p[a >> 2] = 8744;
}
function vg(a) {
 Nb(a);
 p[a + 4 >> 2] = -1;
 p[a >> 2] = 8232;
 p[a >> 2] = 1972;
}
function Md(a) {
 if (1073741823 < a >>> 0) {
  Mb();
  E();
 }
 return La(a << 2);
}
function $t(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = +c;
 return m[a | 0](b, c) | 0;
}
function tg(a) {
 vg(a);
 p[a + 8 >> 2] = 0;
 p[a >> 2] = 8996;
 p[a >> 2] = 8948;
}
function ld(a) {
 if (a < 4294967296 & a >= 0) {
  return ~~a >>> 0;
 }
 return 0;
}
function yi(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 js(a);
 sa = b + 16 | 0;
}
function Vc(a) {
 if (Kc(a)) {
  return p[a + 4 >> 2];
 }
 return q[a + 11 | 0];
}
function se(a) {
 a = a | 0;
 if (p[a + 20 >> 2]) {
  Rb(p[a + 20 >> 2], a);
 }
}
function Uw() {
 tb(21472);
 tb(21496);
 tb(21520);
 xl();
 m[893](21764) | 0;
}
function Hi(a) {
 a = a | 0;
 p[a >> 2] = 1832;
 ub(a + 4 | 0);
 return a | 0;
}
function Ei(a) {
 a = a | 0;
 p[a >> 2] = 2108;
 ub(a + 4 | 0);
 return a | 0;
}
function Df(a) {
 a = a | 0;
 p[a >> 2] = 1676;
 ub(a + 4 | 0);
 return a | 0;
}
function nf(a) {
 if (of(a)) {
  return cc(p[a + 56 >> 2]);
 }
 return hi(a);
}
function Vd(a) {
 if (of(a)) {
  return ji(p[a + 56 >> 2]);
 }
 return ii(a);
}
function Tj(a, b) {
 a = a | 0;
 b = b | 0;
 return w(t[p[a >> 2] + b >> 2]);
}
function gu(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 m[a | 0](b, c);
}
function Wo(a, b) {
 a = a | 0;
 b = b | 0;
 return Vg(a + -72 | 0, b) | 0;
}
function Ql(a, b) {
 a = a | 0;
 b = b | 0;
 return ag(a + -64 | 0, b) | 0;
}
function Qc(a) {
 var b = 0;
 b = La(4);
 p[b >> 2] = p[a >> 2];
 return b;
}
function yu(a, b) {
 a = a | 0;
 b = b | 0;
 return b + -29 >>> 0 < 2 | 0;
}
function qr(a, b) {
 a = a | 0;
 b = b | 0;
 return (b & 65534) == 10 | 0;
}
function ht(a, b) {
 a = a | 0;
 b = b | 0;
 return (b & 65534) == 54 | 0;
}
function at(a, b) {
 a = a | 0;
 b = b | 0;
 return b + -65 >>> 0 < 2 | 0;
}
function _t(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 m[a | 0](b, c);
}
function Fn(a, b) {
 a = a | 0;
 b = b | 0;
 return b + -67 >>> 0 < 2 | 0;
}
function Dn(a, b) {
 a = a | 0;
 b = b | 0;
 return b + -54 >>> 0 < 3 | 0;
}
function Sf(a) {
 a = a | 0;
 if (a) {
  m[p[p[a >> 2] + 44 >> 2]](a);
 }
}
function xg(a, b) {
 return Pd(bq(a, b), t[a + 8 >> 2], t[a + 16 >> 2]);
}
function tc(a) {
 return w(t[Ja(a + 8 | 0, 0) >> 2] - t[Ja(a, 0) >> 2]);
}
function sc(a) {
 return w(t[Ja(a + 8 | 0, 1) >> 2] - t[Ja(a, 1) >> 2]);
}
function Lb(a) {
 a = a | 0;
 if (a) {
  m[p[p[a >> 2] + 4 >> 2]](a);
 }
}
function Fd(a, b, c) {
 p[a >> 2] = p[b >> 2];
 n[a + 4 | 0] = q[c | 0];
}
function Xr(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 32) == 42 | 0;
}
function Xb(a, b) {
 p[p[a >> 2] >> 2] = b;
 p[a >> 2] = p[a >> 2] + 8;
}
function Gd(a) {
 var b = 0;
 b = p[a >> 2];
 p[a >> 2] = 0;
 return b;
}
function Bb(a, b) {
 t[p[a >> 2] >> 2] = b;
 p[a >> 2] = p[a >> 2] + 8;
}
function rt(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 27 | 0;
}
function fu(a, b) {
 a = a | 0;
 b = b | 0;
 return w(w(m[a | 0](b)));
}
function ft(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 54 | 0;
}
function Zs(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 67 | 0;
}
function Zk(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 26 | 0;
}
function Xj(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 29 | 0;
}
function Vs(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 28 | 0;
}
function Ms(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 10 | 0;
}
function Mm(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 23 | 0;
}
function Hn(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 66 | 0;
}
function Ap(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 25 | 0;
}
function cb(a, b, c) {
 t[a + 4 >> 2] = c;
 t[a >> 2] = b;
 return a;
}
function Us(a) {
 a = a | 0;
 return w(t[p[a + 20 >> 2] + 120 >> 2]);
}
function Oi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return 0;
}
function nu(a, b) {
 a = a | 0;
 b = b | 0;
 return m[a | 0](b) | 0;
}
function Gf(a) {
 if (!a) {
  return 0;
 }
 p[5449] = a;
 return -1;
}
function De(a) {
 return a >>> 0 >= 2 ? 1 << 32 - y(a + -1 | 0) : a;
}
function Dd(a, b, c) {
 n[a + 4 | 0] = c;
 p[a >> 2] = b;
 return a;
}
function xj(a, b, c, d, e, f) {
 Av(p[a + 8 >> 2], b, c, d, e, f);
}
function pm(a) {
 a = a | 0;
 Db(p[a + 20 >> 2], Vb(256, 512), 0);
}
function Ow(a, b) {
 a = a | 0;
 b = b | 0;
 Jw(p[a + 8 >> 2], b);
}
function qc(a) {
 return (p[a + 4 >> 2] - p[a >> 2] | 0) / 3 | 0;
}
function oc(a) {
 return (p[Ma(a) >> 2] - p[a >> 2] | 0) / 3 | 0;
}
function nb(a, b, c) {
 if (!(q[a | 0] & 32)) {
  Ef(b, c, a);
 }
}
function _l(a) {
 a = a | 0;
 return (q[a + 68 | 0] ? 2 : 4) | 0;
}
function Ls(a, b) {
 a = a | 0;
 b = b | 0;
 return ud(a, b) | 0;
}
function Dq(a, b) {
 a = a | 0;
 b = b | 0;
 return Eb(a, b) | 0;
}
function gj(a, b) {
 if (!a) {
  return 0;
 }
 return Fu(a, b);
}
function gd(a) {
 n[a + 8 | 0] = 1;
 p[a >> 2] = p[a + 4 >> 2];
}
function gb(a) {
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
 return a;
}
function ck(a) {
 a = a | 0;
 return pt(La(16), p[a >> 2]) | 0;
}
function Yg(a) {
 var b = 0;
 b = p[a >> 2];
 Ra(a);
 return b;
}
function Uo(a, b) {
 a = a | 0;
 b = b | 0;
 Id(a + 44 | 0, 2);
}
function yd(a) {
 wg(a);
 p[a >> 2] = 7980;
 p[a >> 2] = 1564;
}
function wg(a) {
 Nb(a);
 p[a >> 2] = 8060;
 p[a >> 2] = 8020;
}
function tf(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 13) | 0;
}
function rc(a) {
 Ub(a);
 p[a >> 2] = 3968;
 p[a >> 2] = 3908;
}
function og(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 38) | 0;
}
function _c(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 36) | 0;
}
function _b(a, b) {
 a = a | 0;
 b = b | 0;
 ej(a, b + 4 | 0);
}
function Me(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 24) | 0;
}
function Jd(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 48) | 0;
}
function Af(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 40) | 0;
}
function Ae(a) {
 ug(a);
 p[a >> 2] = 8416;
 p[a >> 2] = 1788;
}
function sf(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 2) | 0;
}
function ni(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 3) | 0;
}
function ce(a, b) {
 a = a | 0;
 b = b | 0;
 m[p[a >> 2]](b);
}
function Fc(a) {
 if (Kc(a)) {
  a = p[a >> 2];
 }
 return a;
}
function Tu(a) {
 a = a | 0;
 return da(p[a + 60 >> 2]) | 0;
}
function Td(a, b) {
 oi(a - -64 | 0, b);
 n[a + 60 | 0] = 1;
}
function qd(a) {
 a = a | 0;
 m[p[p[a >> 2] + 72 >> 2]](a);
}
function hs(a) {
 a = a | 0;
 return dp(p[a + 4 >> 2]) | 0;
}
function be(a, b) {
 p[a >> 2] = p[b >> 2];
 p[b >> 2] = 0;
}
function ac(a) {
 a = a | 0;
 m[p[p[a >> 2] + 96 >> 2]](a);
}
function Ud(a, b) {
 oi(a + 72 | 0, b);
 n[a + 61 | 0] = 1;
}
function Ro(a, b) {
 a = a | 0;
 b = +b;
 return So(a) | 0;
}
function $l(a) {
 a = a | 0;
 m[p[p[a >> 2] + 56 >> 2]](a);
}
function vb(a, b, c) {
 Q(21659, b | 0, c | 0);
 return a;
}
function pp(a) {
 a = a | 0;
 return p[a + 168 >> 2] << 1;
}
function ic(a, b, c) {
 Q(21580, b | 0, c | 0);
 return a;
}
function hh(a) {
 Db(a + 176 | 0, 8, 1);
 sp(a + 160 | 0);
}
function he(a, b, c) {
 Q(21657, b | 0, c | 0);
 return a;
}
function ge(a, b, c) {
 Q(21658, b | 0, c | 0);
 return a;
}
function Uf(a, b, c) {
 Q(21656, b | 0, c | 0);
 return a;
}
function Tf(a, b, c) {
 Q(21621, b | 0, c | 0);
 return a;
}
function Sg(a) {
 return (Vb(r[a + 44 >> 1], 2) | 0) == 2;
}
function Jk(a) {
 a = a | 0;
 if (a) {
  Fg(a);
 }
 Ua(a);
}
function rk(a) {
 a = a | 0;
 return ab(a + 104 | 0) | 0;
}
function rf(a) {
 a = a | 0;
 o[a + 60 >> 1] = 0;
 Yc(a);
}
function ok(a) {
 a = a | 0;
 return ab(a + 116 | 0) | 0;
}
function mu(a, b) {
 a = a | 0;
 b = b | 0;
 m[a | 0](b);
}
function fi(a) {
 a = a | 0;
 Yc(a);
 o[a + 60 >> 1] = 0;
}
function zr(a) {
 a = a | 0;
 return w(t[a + 124 >> 2]);
}
function qf(a) {
 a = a | 0;
 n[a + 60 | 0] = 0;
 Yc(a);
}
function pf(a) {
 a = a | 0;
 n[a + 61 | 0] = 0;
 Yc(a);
}
function pc(a) {
 return p[Ma(a) >> 2] - p[a >> 2] >> 3;
}
function ng(a) {
 if (Db(a, 32, 0)) {
  Db(a, 64, 1);
 }
}
function mc(a) {
 return p[Ma(a) >> 2] - p[a >> 2] >> 2;
}
function lb(a) {
 return p[a + 4 >> 2] - p[a >> 2] >> 3;
}
function ab(a) {
 return p[a + 4 >> 2] - p[a >> 2] >> 2;
}
function Ti(a) {
 a = a | 0;
 return w(t[a + 120 >> 2]);
}
function Sb(a) {
 p[p[a >> 2] + 4 >> 2] = p[a + 4 >> 2];
}
function Ps(a) {
 a = a | 0;
 return w(t[a + 112 >> 2]);
}
function Hs(a) {
 a = a | 0;
 return w(t[a + 136 >> 2]);
}
function Gs(a) {
 a = a | 0;
 return w(t[a + 140 >> 2]);
}
function jo(a) {
 a = a | 0;
 Db(p[a + 40 >> 2], 4, 0);
}
function hc(a) {
 return p[Ma(a) >> 2] - p[a >> 2] | 0;
}
function gv(a) {
 a = a | 0;
 return w(t[a + 24 >> 2]);
}
function _k(a) {
 a = a | 0;
 return w(t[a + 16 >> 2]);
}
function Zb(a) {
 return p[a + 4 >> 2] - p[a >> 2] | 0;
}
function Sr(a) {
 a = a | 0;
 return w(t[a + 12 >> 2]);
}
function Sa(a, b) {
 return p[a >> 2] == p[b >> 2] ^ 1;
}
function Kt(a) {
 a = a | 0;
 return w(t[a + 48 >> 2]);
}
function Kl(a) {
 a = a | 0;
 return w(t[a + 20 >> 2]);
}
function Jt(a) {
 a = a | 0;
 return w(t[a + 52 >> 2]);
}
function It(a) {
 a = a | 0;
 return w(t[a + 56 >> 2]);
}
function Hg(a, b) {
 return p[a >> 2] - p[b >> 2] >> 2;
}
function zj(a, b, c, d) {
 kw(p[a + 8 >> 2], b, c, d);
}
function zd(a, b) {
 p[a >> 2] = p[b >> 2];
 return a;
}
function xf(a) {
 a = a | 0;
 return w(t[a + 4 >> 2]);
}
function sm(a) {
 a = a | 0;
 return w(t[a + 8 >> 2]);
}
function np(a, b) {
 a = a | 0;
 b = b | 0;
 mh(a, b);
}
function fb(a, b) {
 a = a | 0;
 b = b | 0;
 return 0;
}
function Mh(a, b, c) {
 return w(w(w(b - a) * c) + a);
}
function Ed(a, b, c) {
 return p[b >> 2] == p[c >> 2];
}
function kb(a, b) {
 return p[a >> 2] + (b << 3) | 0;
}
function jc(a) {
 return !(a + -1 & a) & a >>> 0 > 2;
}
function Yp(a) {
 a = a | 0;
 return p[a + 168 >> 2];
}
function Wq(a) {
 a = a | 0;
 return p[a + 104 >> 2];
}
function Pa(a, b) {
 return p[a >> 2] + (b << 2) | 0;
}
function rw(a) {
 a = a | 0;
 return p[a + 16 >> 2];
}
function ot(a) {
 a = a | 0;
 return p[a + 32 >> 2];
}
function mt(a) {
 a = a | 0;
 return p[a + 36 >> 2];
}
function lt(a) {
 a = a | 0;
 return p[a + 20 >> 2];
}
function kt(a) {
 a = a | 0;
 return p[a + 28 >> 2];
}
function ff(a) {
 return p[a >> 2] == p[a + 4 >> 2];
}
function cq(a) {
 a = a | 0;
 return q[a + 152 | 0];
}
function Zg(a) {
 Ke(a);
 Ke(a + 20 | 0);
 return a;
}
function Pt(a) {
 a = a | 0;
 return m[a | 0]() | 0;
}
function Od(a) {
 p[p[a + 8 >> 2] >> 2] = p[a >> 2];
}
function Nh(a, b) {
 return p[a >> 2] + v(b, 3) | 0;
}
function vf(a, b) {
 return p[a >> 2] == p[b >> 2];
}
function di(a, b) {
 return r[a >> 1] == r[b >> 1];
}
function ak(a) {
 a = a | 0;
 return q[a + 12 | 0];
}
function Mf(a) {
 ia(p[a >> 2]);
 return p[a >> 2];
}
function Lt(a) {
 a = a | 0;
 return va(a | 0) | 0;
}
function ve(a, b) {
 return s[a >> 2] < s[b >> 2];
}
function ub(a) {
 if (Kc(a)) {
  Ua(p[a >> 2]);
 }
}
function Qf(a) {
 a = a | 0;
 return w(t[a >> 2]);
}
function Hh(a, b) {
 return t[a >> 2] < t[b >> 2];
}
function qm(a) {
 a = a | 0;
 me(p[a + 20 >> 2]);
}
function Ai(a, b) {
 return b >>> (a << 3) & 255;
}
function ue(a) {
 p[a >> 2] = p[p[a >> 2] >> 2];
}
function ob(a, b) {
 return (Vb(a, b) | 0) != 0;
}
function ih(a) {
 n[a | 0] = 0;
 bb(a + 4 | 0);
}
function gq(a) {
 a = a | 0;
 ac(a + -156 | 0);
}
function de(a) {
 a = a | 0;
 n[a + 4 | 0] = 1;
}
function Vj(a) {
 a = a | 0;
 return Xa(a) | 0;
}
function Id(a, b) {
 o[a >> 1] = r[a >> 1] | b;
}
function Bq(a) {
 a = a | 0;
 return cc(a) | 0;
}
function kc(a, b, c) {
 p[b >> 2] = p[c >> 2];
}
function hm(a) {
 a = a | 0;
 me(a + -68 | 0);
}
function db(a, b) {
 p[a >> 2] = b;
 return a;
}
function bm(a) {
 a = a | 0;
 cg(a + -52 | 0);
}
function Sc(a, b) {
 te(a);
 mg(a + 4 | 0, b);
}
function Pl(a) {
 a = a | 0;
 $f(a + -64 | 0);
}
function of(a) {
 return p[a + 56 >> 2] != 0;
}
function gh(a, b) {
 n[a | 0] = q[a | 0] | b;
}
function Ts(a) {
 a = a | 0;
 return w(w(0));
}
function Qg(a, b) {
 return Ee(a, p[b >> 2]);
}
function Ja(a, b) {
 return (b << 2) + a | 0;
}
function ww(a) {
 a = a | 0;
 Aj(a);
 Ua(a);
}
function wd(a) {
 a = a | 0;
 Df(a);
 Ua(a);
}
function vm(a) {
 a = a | 0;
 Db(a, 128, 1);
}
function rg(a) {
 a = a | 0;
 xe(a);
 Ua(a);
}
function qp(a) {
 a = a | 0;
 $e(a);
 Ua(a);
}
function mb(a) {
 a = a | 0;
 hb(a);
 Ua(a);
}
function ig(a) {
 a = a | 0;
 eg(a);
 Ua(a);
}
function id(a) {
 return a + -48 >>> 0 < 10;
}
function fc(a) {
 a = a | 0;
 Hi(a);
 Ua(a);
}
function ch(a) {
 a = a | 0;
 Oe(a);
 Ua(a);
}
function bc(a) {
 a = a | 0;
 nc(a);
 Ua(a);
}
function Zf(a, b, c) {
 Il(a, p[b >> 2], c);
}
function Rw(a) {
 a = a | 0;
 Jf(a);
 Ua(a);
}
function Ra(a) {
 p[a >> 2] = p[a >> 2] + 4;
}
function Ov(a) {
 a = a | 0;
 wj(a);
 Ua(a);
}
function Mg(a, b, c) {
 Rd(c);
 Lg(a, b, c);
}
function Di(a) {
 a = a | 0;
 zf(a);
 Ua(a);
}
function vw(a) {
 a = a | 0;
 gc(a, 13652);
}
function ul(a) {
 a = a | 0;
 return 21574;
}
function rd(a) {
 a = a | 0;
 Db(a, 32, 0);
}
function pi(a, b) {
 return w(D(cs(a, b)));
}
function pb(a) {
 a = a | 0;
 return a | 0;
}
function ow(a) {
 a = a | 0;
 gc(a, 13697);
}
function ol(a) {
 a = a | 0;
 return 21577;
}
function mk(a) {
 a = a | 0;
 return 21748;
}
function lk(a) {
 a = a | 0;
 return 21750;
}
function kk(a) {
 a = a | 0;
 return 21752;
}
function jk(a) {
 a = a | 0;
 return 21754;
}
function il(a) {
 a = a | 0;
 return 21617;
}
function ik(a) {
 a = a | 0;
 return 21756;
}
function fj(a, b, c) {
 return Au(a, b, c);
}
function dl(a) {
 a = a | 0;
 return 21619;
}
function dk(a) {
 a = a | 0;
 return 21759;
}
function Yw(a, b, c) {
 return Ww(a, b, c);
}
function Xw(a, b, c) {
 return Vw(a, b, c);
}
function Wj(a) {
 a = a | 0;
 return 21581;
}
function Wb(a) {
 return p[a >> 2] + 8 | 0;
}
function Uc(a, b, c) {
 return Ed(a, b, c);
}
function Qw(a) {
 a = a | 0;
 gc(a, 13578);
}
function Qa(a) {
 return _e(p[a + 4 >> 2]);
}
function Pw(a) {
 a = a | 0;
 gc(a, 13583);
}
function Pv(a) {
 a = a | 0;
 gc(a, 14062);
}
function Pk(a) {
 a = a | 0;
 return 21662;
}
function Lk(a) {
 a = a | 0;
 return 21579;
}
function Kk(a) {
 a = a | 0;
 return 21734;
}
function Kc(a) {
 return n[a + 11 | 0] < 0;
}
function He(a, b) {
 a = a | 0;
 b = b | 0;
}
function Fk(a) {
 a = a | 0;
 return 21737;
}
function Fe(a, b) {
 p[a >> 2] = p[b >> 2];
}
function $k(a) {
 a = a | 0;
 return 21660;
}
function vi(a, b) {
 Yo(p[a + 4 >> 2], b);
}
function gc(a, b) {
 Lw(p[a + 8 >> 2], b);
}
function Dc(a) {
 return (wi(a) | 0) == 1;
}
function ju(a) {
 a = a | 0;
 m[a | 0]();
}
function Wg(a) {
 Wc(a + 20 | 0);
 Wc(a);
}
function Ii(a, b) {
 n[a | 0] = q[b | 0];
}
function Ie(a, b) {
 return vf(a, b) ^ 1;
}
function zn(a) {
 a = a | 0;
 return 70;
}
function ys(a) {
 a = a | 0;
 return 43;
}
function yr(a) {
 a = a | 0;
 return 15;
}
function xp(a) {
 a = a | 0;
 return 13;
}
function wr(a) {
 a = a | 0;
 return 12;
}
function wn(a) {
 a = a | 0;
 return 69;
}
function vt(a) {
 a = a | 0;
 return 31;
}
function un(a) {
 a = a | 0;
 return 53;
}
function ts(a) {
 a = a | 0;
 return 44;
}
function tr(a) {
 a = a | 0;
 return 38;
}
function st(a) {
 a = a | 0;
 return 27;
}
function sn(a) {
 a = a | 0;
 return 63;
}
function rr(a) {
 a = a | 0;
 return 11;
}
function qn(a) {
 a = a | 0;
 return 58;
}
function qe(a) {
 return a >>> 16 & 255;
}
function ps(a) {
 a = a | 0;
 return 45;
}
function pr(a) {
 a = a | 0;
 return 14;
}
function oq(a) {
 a = a | 0;
 Ua(Re(a));
}
function on(a) {
 a = a | 0;
 return 64;
}
function no(a) {
 a = a | 0;
 return 49;
}
function mp(a) {
 a = a | 0;
 return 52;
}
function mn(a) {
 a = a | 0;
 return 71;
}
function kn(a) {
 a = a | 0;
 return 59;
}
function it(a) {
 a = a | 0;
 return 55;
}
function hw(a) {
 a = a | 0;
 return 37;
}
function hp(a) {
 a = a | 0;
 Ua(bh(a));
}
function gt(a) {
 a = a | 0;
 return 54;
}
function gn(a) {
 a = a | 0;
 return 22;
}
function gm(a) {
 a = a | 0;
 Ua(xe(a));
}
function gi(a, b, c) {
 return di(b, c);
}
function gf(a) {
 lb(a);
 Wh(a);
 Vh(a);
}
function fq(a) {
 a = a | 0;
 return 16;
}
function fk(a) {
 a = a | 0;
 return 29;
}
function et(a) {
 a = a | 0;
 return 57;
}
function ep(a) {
 a = a | 0;
 Ua(ah(a));
}
function el(a) {
 a = a | 0;
 return 26;
}
function dn(a) {
 a = a | 0;
 return 17;
}
function ct(a) {
 a = a | 0;
 return 28;
}
function cr(a) {
 a = a | 0;
 Ua(Jh(a));
}
function bt(a) {
 a = a | 0;
 return 65;
}
function bn(a) {
 a = a | 0;
 return 24;
}
function am(a) {
 a = a | 0;
 Ua(gg(a));
}
function _s(a) {
 a = a | 0;
 return 67;
}
function _m(a) {
 a = a | 0;
 return 21;
}
function Zr(a) {
 a = a | 0;
 Ua(li(a));
}
function Yr(a) {
 a = a | 0;
 return 42;
}
function Yf(a) {
 hc(a);
 Zb(a);
 hc(a);
}
function Xm(a) {
 a = a | 0;
 return 18;
}
function We(a) {
 mc(a);
 ab(a);
 mc(a);
}
function Vp(a) {
 a = a | 0;
 return 51;
}
function Ur(a) {
 a = a | 0;
 return 34;
}
function Um(a) {
 a = a | 0;
 return 19;
}
function Tl(a) {
 a = a | 0;
 Ua(bg(a));
}
function Te(a) {
 pc(a);
 lb(a);
 pc(a);
}
function Ss(a) {
 a = a | 0;
 Ua(zf(a));
}
function Rs(a) {
 a = a | 0;
 return 40;
}
function Rm(a) {
 a = a | 0;
 return 20;
}
function Rd(a) {
 ab(a);
 $g(a);
 Th(a);
}
function Pq(a) {
 a = a | 0;
 Ua(_h(a));
}
function Op(a) {
 a = a | 0;
 Ua(jh(a));
}
function Ol(a) {
 a = a | 0;
 return 47;
}
function Ns(a) {
 a = a | 0;
 return 10;
}
function Nm(a) {
 a = a | 0;
 return 23;
}
function Ln(a) {
 a = a | 0;
 return 61;
}
function Lm(a) {
 a = a | 0;
 return 39;
}
function Ks(a) {
 a = a | 0;
 return 41;
}
function Kr(a) {
 a = a | 0;
 return 35;
}
function Jm(a) {
 a = a | 0;
 return 46;
}
function Io(a) {
 a = a | 0;
 return 48;
}
function In(a) {
 a = a | 0;
 return 66;
}
function Gr(a) {
 a = a | 0;
 return 36;
}
function Gp(a) {
 a = a | 0;
 return 25;
}
function Gn(a) {
 a = a | 0;
 return 68;
}
function Ft(a) {
 a = a | 0;
 return 50;
}
function Fs(a) {
 a = a | 0;
 Ua(Ci(a));
}
function Eu(a) {
 a = a | 0;
 return 30;
}
function Eq(a) {
 a = a | 0;
 Ua(nc(a));
}
function En(a) {
 a = a | 0;
 return 56;
}
function Eh(a) {
 oc(a);
 qc(a);
 oc(a);
}
function Ct(a) {
 a = a | 0;
 return 60;
}
function Cr(a) {
 a = a | 0;
 Ua(ei(a));
}
function Cp(a) {
 a = a | 0;
 Ua(fh(a));
}
function Bn(a) {
 a = a | 0;
 return 62;
}
function At(a) {
 a = a | 0;
 Ua(Ni(a));
}
function $p(a) {
 a = a | 0;
 Ua(Oe(a));
}
function wq(a) {
 a = a | 0;
 return 5;
}
function wb(a) {
 return p[sb(a) >> 2];
}
function ui(a) {
 a = a | 0;
 return 0;
}
function pe(a) {
 return a >>> 8 & 255;
}
function gp(a) {
 a = a | 0;
 return 8;
}
function ci(a) {
 a = a | 0;
 return 1;
}
function _f(a) {
 db(a, ra(13504) | 0);
}
function Or(a) {
 a = a | 0;
 return 6;
}
function Oa(a) {
 return _e(p[a >> 2]);
}
function Np(a) {
 a = a | 0;
 return 7;
}
function Ji(a, b) {
 n[a + 11 | 0] = b;
}
function Cj(a) {
 return si(La(24), a);
}
function Br(a) {
 a = a | 0;
 return 4;
}
function Bp(a) {
 a = a | 0;
 return 3;
}
function $h(a) {
 a = a | 0;
 return 2;
}
function ne(a) {
 return a >>> 24 | 0;
}
function Gc(a) {
 return (a | 0) != 2;
}
function vd(a, b) {
 return Om(a, b);
}
function ti(a, b) {
 return ru(a, b);
}
function mi(a) {
 return a + 176 | 0;
}
function Qe(a) {
 return a + 236 | 0;
}
function Nd(a, b) {
 return yq(a, b);
}
function Mi(a, b) {
 return vf(a, b);
}
function Kd(a, b) {
 return Ie(a, b);
}
function Fb(a, b) {
 return Zm(a, b);
}
function vc(a) {
 a = a | 0;
 ng(a);
}
function qh(a) {
 return a + 56 | 0;
}
function ji(a) {
 return a + 80 | 0;
}
function jb(a) {
 return a + 16 | 0;
}
function hg(a) {
 a = a | 0;
 me(a);
}
function cc(a) {
 return a + 88 | 0;
}
function Va(a) {
 return a + 12 | 0;
}
function Pe(a) {
 a = a | 0;
 Yc(a);
}
function $a(a) {
 a = a | 0;
 Ua(a);
}
function ye(a, b) {
 mc(a);
 mc(a);
}
function sb(a) {
 return a + 4 | 0;
}
function mg(a, b) {
 p[a >> 2] = b;
}
function bb(a) {
 rq(a);
 return a;
}
function Xd(a) {
 p[a >> 2] = 2652;
}
function Wh(a) {
 Dh(a, p[a >> 2]);
}
function Uh(a) {
 Oq(a, p[a >> 2]);
}
function Nb(a) {
 p[a >> 2] = 4032;
}
function Ma(a) {
 return a + 8 | 0;
}
function Le(a) {
 Ke(a);
 return a;
}
function Kh(a) {
 p[a >> 2] = 4472;
}
function Fh(a, b) {
 pc(a);
 pc(a);
}
function $g(a) {
 Ug(a, p[a >> 2]);
}
function bd(a, b) {
 return a | b;
}
function Vb(a, b) {
 return a & b;
}
function Ta(a) {
 a = a | 0;
 E();
}
function oe(a) {
 return a & 255;
}
function Se(a, b, c) {
 Ib(b, c);
}
function te(a) {
 p[a >> 2] = 0;
}
function pd(a) {
 la(p[a >> 2]);
}
function me(a) {
 Db(a, 256, 0);
}
function eh(a) {
 ib(a + 4 | 0);
}
function Vh(a) {
 pc(a);
 lb(a);
}
function Th(a) {
 mc(a);
 ab(a);
}
function Na(a) {
 return +is(a);
}
function Cb(a) {
 ja(p[a >> 2]);
}
function Pc(a) {
 n[a | 0] = 0;
}
function td(a, b) {
 ls(a, b);
}
function jd(a, b) {
 db(a, b);
}
function fe(a, b) {
 jd(a, b);
}
function Ge(a, b) {
 Fe(a, b);
}
function Dg(a, b) {
 Fm(a, b);
}
function Cf(a, b) {
 qt(a, b);
}
function hd() {
 Mb();
 E();
}
function Ka(a) {
 a = a | 0;
}
function Mb() {
 Y();
 E();
}
function zh(a) {
 gb(a);
}
function tu() {
 E();
}

// EMSCRIPTEN_END_FUNCS

  m[1] = pb;
  m[2] = $a;
  m[3] = ct;
  m[4] = Vs;
  m[5] = Os;
  m[6] = Tw;
  m[7] = fb;
  m[8] = Dj;
  m[9] = Ka;
  m[10] = Ka;
  m[11] = Ka;
  m[12] = Ka;
  m[13] = _h;
  m[14] = Pq;
  m[15] = Gp;
  m[16] = Ap;
  m[17] = rp;
  m[18] = lq;
  m[19] = aq;
  m[20] = Pp;
  m[21] = Ka;
  m[22] = gg;
  m[23] = am;
  m[24] = el;
  m[25] = Zk;
  m[26] = Qk;
  m[27] = El;
  m[28] = vl;
  m[29] = ml;
  m[30] = Ka;
  m[31] = Ta;
  m[32] = fk;
  m[33] = Xj;
  m[34] = kd;
  m[35] = Ik;
  m[36] = fb;
  m[37] = yk;
  m[38] = Ka;
  m[39] = Ka;
  m[40] = Ka;
  m[41] = tu;
  m[42] = $a;
  m[43] = hw;
  m[44] = _v;
  m[45] = Qv;
  m[46] = Lj;
  m[47] = Aw;
  m[48] = Ka;
  m[49] = $a;
  m[50] = Eu;
  m[51] = yu;
  m[52] = su;
  m[53] = qv;
  m[54] = Mu;
  m[55] = Ka;
  m[56] = $a;
  m[57] = Ft;
  m[58] = Et;
  m[59] = Dt;
  m[60] = Ht;
  m[61] = Gt;
  m[62] = Ka;
  m[63] = $a;
  m[64] = Ct;
  m[65] = Bt;
  m[66] = Oi;
  m[67] = fb;
  m[68] = fb;
  m[69] = fb;
  m[70] = Ni;
  m[71] = At;
  m[72] = vt;
  m[73] = ut;
  m[74] = tt;
  m[75] = zt;
  m[76] = yt;
  m[77] = wt;
  m[78] = Ka;
  m[79] = Ka;
  m[80] = Ka;
  m[81] = Ka;
  m[82] = Ka;
  m[83] = Ka;
  m[84] = Ka;
  m[85] = Ka;
  m[86] = Df;
  m[87] = Ta;
  m[88] = st;
  m[89] = rt;
  m[90] = Ki;
  m[91] = Hi;
  m[92] = fc;
  m[93] = it;
  m[94] = ht;
  m[95] = Bf;
  m[96] = fb;
  m[97] = fb;
  m[98] = Ka;
  m[99] = Ta;
  m[100] = gt;
  m[101] = ft;
  m[102] = fc;
  m[103] = et;
  m[104] = dt;
  m[105] = fb;
  m[106] = fb;
  m[107] = $a;
  m[108] = bt;
  m[109] = at;
  m[110] = $s;
  m[111] = fb;
  m[112] = fb;
  m[113] = Ka;
  m[114] = Ka;
  m[115] = Ka;
  m[116] = $a;
  m[117] = _s;
  m[118] = Zs;
  m[119] = Gi;
  m[120] = fb;
  m[121] = fb;
  m[122] = Ka;
  m[123] = zf;
  m[124] = Ss;
  m[125] = Rs;
  m[126] = Qs;
  m[127] = Fi;
  m[128] = Eb;
  m[129] = Xs;
  m[130] = Dj;
  m[131] = Ka;
  m[132] = Ka;
  m[133] = se;
  m[134] = He;
  m[135] = re;
  m[136] = vc;
  m[137] = vc;
  m[138] = vc;
  m[139] = vm;
  m[140] = Ps;
  m[141] = Us;
  m[142] = Ts;
  m[143] = Ws;
  m[144] = Ei;
  m[145] = Ta;
  m[146] = Ns;
  m[147] = Ms;
  m[148] = yb;
  m[149] = Di;
  m[150] = Ks;
  m[151] = Js;
  m[152] = Is;
  m[153] = Ls;
  m[154] = Hs;
  m[155] = Gs;
  m[156] = vc;
  m[157] = vc;
  m[158] = Ci;
  m[159] = Fs;
  m[160] = ys;
  m[161] = xs;
  m[162] = ws;
  m[163] = Es;
  m[164] = Cs;
  m[165] = zs;
  m[166] = Ds;
  m[167] = Ka;
  m[168] = Ka;
  m[169] = Ka;
  m[170] = Ka;
  m[171] = Ka;
  m[172] = Ka;
  m[173] = hb;
  m[174] = mb;
  m[175] = ts;
  m[176] = ss;
  m[177] = rs;
  m[178] = vs;
  m[179] = us;
  m[180] = Ka;
  m[181] = He;
  m[182] = Ka;
  m[183] = Ka;
  m[184] = Ka;
  m[185] = Ka;
  m[186] = Ka;
  m[187] = Ka;
  m[188] = Ka;
  m[189] = mb;
  m[190] = ps;
  m[191] = os;
  m[192] = zi;
  m[193] = qs;
  m[194] = fb;
  m[195] = Ka;
  m[196] = Ka;
  m[197] = pb;
  m[198] = $a;
  m[199] = hs;
  m[200] = $a;
  m[201] = ui;
  m[202] = $a;
  m[203] = $a;
  m[204] = $a;
  m[205] = li;
  m[206] = Zr;
  m[207] = Yr;
  m[208] = Xr;
  m[209] = Wr;
  m[210] = as;
  m[211] = bs;
  m[212] = $r;
  m[213] = _r;
  m[214] = Ka;
  m[215] = Ka;
  m[216] = Ka;
  m[217] = mb;
  m[218] = Ur;
  m[219] = Tr;
  m[220] = Rr;
  m[221] = mq;
  m[222] = fb;
  m[223] = fi;
  m[224] = fi;
  m[225] = Hr;
  m[226] = ki;
  m[227] = Vr;
  m[228] = rf;
  m[229] = qf;
  m[230] = pf;
  m[231] = mb;
  m[232] = Or;
  m[233] = Nr;
  m[234] = Mr;
  m[235] = Qr;
  m[236] = Pr;
  m[237] = qf;
  m[238] = qf;
  m[239] = pf;
  m[240] = pf;
  m[241] = mb;
  m[242] = Kr;
  m[243] = Jr;
  m[244] = Ir;
  m[245] = ki;
  m[246] = Lr;
  m[247] = rf;
  m[248] = rf;
  m[249] = Ta;
  m[250] = Gr;
  m[251] = Fr;
  m[252] = ad;
  m[253] = ei;
  m[254] = Cr;
  m[255] = Br;
  m[256] = Ar;
  m[257] = mf;
  m[258] = Dq;
  m[259] = Cq;
  m[260] = yh;
  m[261] = Aq;
  m[262] = Dr;
  m[263] = Ti;
  m[264] = zr;
  m[265] = vc;
  m[266] = vc;
  m[267] = Ka;
  m[268] = Bq;
  m[269] = wh;
  m[270] = ci;
  m[271] = ac;
  m[272] = ac;
  m[273] = Ka;
  m[274] = Ka;
  m[275] = nc;
  m[276] = bc;
  m[277] = Hc;
  m[278] = bc;
  m[279] = yr;
  m[280] = xr;
  m[281] = Ka;
  m[282] = Ka;
  m[283] = mb;
  m[284] = wr;
  m[285] = vr;
  m[286] = lf;
  m[287] = ud;
  m[288] = mb;
  m[289] = $h;
  m[290] = ur;
  m[291] = jf;
  m[292] = Ka;
  m[293] = Ka;
  m[294] = Ta;
  m[295] = tr;
  m[296] = sr;
  m[297] = yf;
  m[298] = Ka;
  m[299] = Ka;
  m[300] = Ka;
  m[301] = Ka;
  m[302] = Ta;
  m[303] = rr;
  m[304] = qr;
  m[305] = Ta;
  m[306] = Ta;
  m[307] = Ta;
  m[308] = Ka;
  m[309] = Ka;
  m[310] = Ka;
  m[311] = Ka;
  m[312] = mb;
  m[313] = Pe;
  m[314] = Pe;
  m[315] = ph;
  m[316] = Ta;
  m[317] = pr;
  m[318] = or;
  m[319] = Ka;
  m[320] = Ka;
  m[321] = Jh;
  m[322] = cr;
  m[323] = ar;
  m[324] = Xq;
  m[325] = br;
  m[326] = $q;
  m[327] = _q;
  m[328] = Zq;
  m[329] = Yq;
  m[330] = Wq;
  m[331] = $e;
  m[332] = Ta;
  m[333] = Xh;
  m[334] = Sh;
  m[335] = Rh;
  m[336] = Qh;
  m[337] = Ph;
  m[338] = Oh;
  m[339] = pb;
  m[340] = Ta;
  m[341] = bc;
  m[342] = Eq;
  m[343] = mb;
  m[344] = wq;
  m[345] = vq;
  m[346] = uq;
  m[347] = Ka;
  m[348] = Re;
  m[349] = oq;
  m[350] = fb;
  m[351] = rh;
  m[352] = nq;
  m[353] = mb;
  m[354] = bc;
  m[355] = fq;
  m[356] = eq;
  m[357] = dq;
  m[358] = kq;
  m[359] = iq;
  m[360] = jq;
  m[361] = hq;
  m[362] = cq;
  m[363] = Ka;
  m[364] = ac;
  m[365] = gq;
  m[366] = Oe;
  m[367] = $p;
  m[368] = Vp;
  m[369] = Up;
  m[370] = lh;
  m[371] = mh;
  m[372] = ac;
  m[373] = ac;
  m[374] = Yp;
  m[375] = Xp;
  m[376] = bc;
  m[377] = Ka;
  m[378] = Ka;
  m[379] = jh;
  m[380] = Op;
  m[381] = Np;
  m[382] = Mp;
  m[383] = Lp;
  m[384] = Qp;
  m[385] = ac;
  m[386] = bc;
  m[387] = Ka;
  m[388] = fh;
  m[389] = Cp;
  m[390] = Bp;
  m[391] = zp;
  m[392] = yp;
  m[393] = Dp;
  m[394] = Ep;
  m[395] = Hp;
  m[396] = Ka;
  m[397] = Ka;
  m[398] = Fp;
  m[399] = dh;
  m[400] = Ta;
  m[401] = Ta;
  m[402] = xp;
  m[403] = wp;
  m[404] = mb;
  m[405] = qp;
  m[406] = He;
  m[407] = ui;
  m[408] = ch;
  m[409] = mp;
  m[410] = lp;
  m[411] = kp;
  m[412] = np;
  m[413] = pp;
  m[414] = op;
  m[415] = ac;
  m[416] = ch;
  m[417] = Ka;
  m[418] = mb;
  m[419] = Pe;
  m[420] = bh;
  m[421] = hp;
  m[422] = gp;
  m[423] = fp;
  m[424] = ip;
  m[425] = bc;
  m[426] = ah;
  m[427] = ep;
  m[428] = ci;
  m[429] = Ko;
  m[430] = Jo;
  m[431] = fb;
  m[432] = Uo;
  m[433] = To;
  m[434] = Ka;
  m[435] = Ka;
  m[436] = Ka;
  m[437] = Ka;
  m[438] = Ka;
  m[439] = Ka;
  m[440] = Vg;
  m[441] = Wo;
  m[442] = Ta;
  m[443] = Io;
  m[444] = Ho;
  m[445] = Go;
  m[446] = Ka;
  m[447] = Ka;
  m[448] = Ta;
  m[449] = mb;
  m[450] = no;
  m[451] = mo;
  m[452] = lo;
  m[453] = po;
  m[454] = fb;
  m[455] = oo;
  m[456] = mb;
  m[457] = ko;
  m[458] = fb;
  m[459] = jo;
  m[460] = $a;
  m[461] = Ln;
  m[462] = Kn;
  m[463] = Jn;
  m[464] = Ka;
  m[465] = $a;
  m[466] = Ta;
  m[467] = Ta;
  m[468] = In;
  m[469] = Hn;
  m[470] = Ta;
  m[471] = Ta;
  m[472] = $a;
  m[473] = Gn;
  m[474] = Fn;
  m[475] = $a;
  m[476] = Ta;
  m[477] = Ta;
  m[478] = fc;
  m[479] = En;
  m[480] = Dn;
  m[481] = Cn;
  m[482] = Ka;
  m[483] = fc;
  m[484] = Ta;
  m[485] = Ta;
  m[486] = Ta;
  m[487] = Ta;
  m[488] = $a;
  m[489] = Bn;
  m[490] = An;
  m[491] = $a;
  m[492] = Ta;
  m[493] = wd;
  m[494] = fb;
  m[495] = fb;
  m[496] = Ta;
  m[497] = $a;
  m[498] = zn;
  m[499] = yn;
  m[500] = xn;
  m[501] = Ka;
  m[502] = Ka;
  m[503] = $a;
  m[504] = $a;
  m[505] = wn;
  m[506] = vn;
  m[507] = sg;
  m[508] = $a;
  m[509] = Ta;
  m[510] = Ta;
  m[511] = Ta;
  m[512] = wd;
  m[513] = un;
  m[514] = tn;
  m[515] = wd;
  m[516] = $a;
  m[517] = sn;
  m[518] = rn;
  m[519] = $a;
  m[520] = wd;
  m[521] = fc;
  m[522] = qn;
  m[523] = pn;
  m[524] = fc;
  m[525] = $a;
  m[526] = on;
  m[527] = nn;
  m[528] = $a;
  m[529] = $a;
  m[530] = mn;
  m[531] = ln;
  m[532] = $a;
  m[533] = fc;
  m[534] = kn;
  m[535] = jn;
  m[536] = hn;
  m[537] = Ka;
  m[538] = fc;
  m[539] = Ta;
  m[540] = gn;
  m[541] = fn;
  m[542] = en;
  m[543] = Ka;
  m[544] = Ka;
  m[545] = Ka;
  m[546] = Ka;
  m[547] = Ka;
  m[548] = xe;
  m[549] = rg;
  m[550] = dn;
  m[551] = cn;
  m[552] = om;
  m[553] = fb;
  m[554] = nm;
  m[555] = lm;
  m[556] = rd;
  m[557] = rd;
  m[558] = rd;
  m[559] = rd;
  m[560] = hg;
  m[561] = hg;
  m[562] = im;
  m[563] = hm;
  m[564] = eg;
  m[565] = Ta;
  m[566] = bn;
  m[567] = an;
  m[568] = $m;
  m[569] = dm;
  m[570] = Ka;
  m[571] = ie;
  m[572] = Ka;
  m[573] = Ka;
  m[574] = Ka;
  m[575] = Ka;
  m[576] = Ta;
  m[577] = _m;
  m[578] = Ym;
  m[579] = we;
  m[580] = Ta;
  m[581] = Xm;
  m[582] = Wm;
  m[583] = Vm;
  m[584] = Ka;
  m[585] = Ta;
  m[586] = Um;
  m[587] = Tm;
  m[588] = Sm;
  m[589] = Ka;
  m[590] = Ka;
  m[591] = Ta;
  m[592] = Rm;
  m[593] = Qm;
  m[594] = Pm;
  m[595] = Ka;
  m[596] = Ta;
  m[597] = Ka;
  m[598] = Ka;
  m[599] = Ka;
  m[600] = bc;
  m[601] = Ta;
  m[602] = Ka;
  m[603] = Ka;
  m[604] = Ta;
  m[605] = Ta;
  m[606] = Ka;
  m[607] = Ta;
  m[608] = $a;
  m[609] = Nm;
  m[610] = Mm;
  m[611] = Oi;
  m[612] = fb;
  m[613] = fb;
  m[614] = Ta;
  m[615] = Ta;
  m[616] = Ta;
  m[617] = Ka;
  m[618] = Ta;
  m[619] = Lm;
  m[620] = Km;
  m[621] = Ta;
  m[622] = Di;
  m[623] = Ka;
  m[624] = Ka;
  m[625] = Ta;
  m[626] = Ta;
  m[627] = mb;
  m[628] = Jm;
  m[629] = Im;
  m[630] = Hm;
  m[631] = Ka;
  m[632] = Ka;
  m[633] = Ka;
  m[634] = Ka;
  m[635] = mb;
  m[636] = mb;
  m[637] = Ta;
  m[638] = ig;
  m[639] = um;
  m[640] = $h;
  m[641] = tm;
  m[642] = mb;
  m[643] = rm;
  m[644] = fb;
  m[645] = qm;
  m[646] = pm;
  m[647] = km;
  m[648] = gm;
  m[649] = rg;
  m[650] = fb;
  m[651] = em;
  m[652] = Ta;
  m[653] = mb;
  m[654] = cm;
  m[655] = fb;
  m[656] = $l;
  m[657] = cg;
  m[658] = bm;
  m[659] = ig;
  m[660] = Zl;
  m[661] = _l;
  m[662] = Yl;
  m[663] = Xl;
  m[664] = Wl;
  m[665] = Vl;
  m[666] = bg;
  m[667] = Tl;
  m[668] = Ol;
  m[669] = Nl;
  m[670] = Ml;
  m[671] = Rl;
  m[672] = qd;
  m[673] = qd;
  m[674] = qd;
  m[675] = qd;
  m[676] = ag;
  m[677] = $f;
  m[678] = Ql;
  m[679] = Pl;
  m[680] = Ta;
  m[681] = Ka;
  m[682] = Ka;
  m[683] = Ka;
  m[684] = Ka;
  m[685] = Gl;
  m[686] = ul;
  m[687] = Lb;
  m[688] = ql;
  m[689] = ol;
  m[690] = Lb;
  m[691] = nd;
  m[692] = ll;
  m[693] = kl;
  m[694] = jl;
  m[695] = il;
  m[696] = Lb;
  m[697] = dl;
  m[698] = Lb;
  m[699] = nd;
  m[700] = bl;
  m[701] = al;
  m[702] = $k;
  m[703] = Sf;
  m[704] = Pk;
  m[705] = Sf;
  m[706] = nd;
  m[707] = Nk;
  m[708] = Mk;
  m[709] = Lk;
  m[710] = $a;
  m[711] = Qf;
  m[712] = Yb;
  m[713] = xf;
  m[714] = sm;
  m[715] = Sr;
  m[716] = _k;
  m[717] = Kl;
  m[718] = Kk;
  m[719] = Jk;
  m[720] = Vn;
  m[721] = Un;
  m[722] = Fk;
  m[723] = Lb;
  m[724] = Ro;
  m[725] = Qo;
  m[726] = Ck;
  m[727] = Ak;
  m[728] = xk;
  m[729] = vk;
  m[730] = No;
  m[731] = Oo;
  m[732] = rk;
  m[733] = Lo;
  m[734] = Mo;
  m[735] = ok;
  m[736] = Po;
  m[737] = nk;
  m[738] = mk;
  m[739] = Lb;
  m[740] = Jt;
  m[741] = zb;
  m[742] = Yb;
  m[743] = Rc;
  m[744] = It;
  m[745] = Zi;
  m[746] = Kt;
  m[747] = Ab;
  m[748] = lk;
  m[749] = Lb;
  m[750] = Zd;
  m[751] = Yb;
  m[752] = Rc;
  m[753] = Yi;
  m[754] = kk;
  m[755] = Lb;
  m[756] = Ti;
  m[757] = Zd;
  m[758] = Yb;
  m[759] = Rc;
  m[760] = jk;
  m[761] = Lb;
  m[762] = Wi;
  m[763] = Yb;
  m[764] = Rc;
  m[765] = Vi;
  m[766] = ik;
  m[767] = Lb;
  m[768] = _b;
  m[769] = hk;
  m[770] = lt;
  m[771] = gk;
  m[772] = rw;
  m[773] = ot;
  m[774] = mt;
  m[775] = kt;
  m[776] = gv;
  m[777] = Yb;
  m[778] = Li;
  m[779] = dk;
  m[780] = $a;
  m[781] = ck;
  m[782] = xf;
  m[783] = jt;
  m[784] = Yb;
  m[785] = Rc;
  m[786] = ak;
  m[787] = $j;
  m[788] = nt;
  m[789] = Zj;
  m[790] = Wj;
  m[791] = $a;
  m[792] = Qf;
  m[793] = Yb;
  m[794] = xf;
  m[795] = Vj;
  m[796] = nd;
  m[797] = ee;
  m[798] = Qb;
  m[799] = Kf;
  m[800] = Qb;
  m[801] = Fj;
  m[802] = pb;
  m[803] = pb;
  m[804] = de;
  m[805] = ce;
  m[806] = ee;
  m[807] = Kf;
  m[808] = Qb;
  m[809] = zw;
  m[810] = yw;
  m[811] = pb;
  m[812] = pb;
  m[813] = de;
  m[814] = ce;
  m[815] = Qb;
  m[816] = Qb;
  m[817] = Rc;
  m[818] = Qb;
  m[819] = Qb;
  m[820] = Qb;
  m[821] = aw;
  m[822] = yj;
  m[823] = ee;
  m[824] = pb;
  m[825] = pb;
  m[826] = de;
  m[827] = ce;
  m[828] = Ac;
  m[829] = $j;
  m[830] = uv;
  m[831] = Qb;
  m[832] = Ac;
  m[833] = Ac;
  m[834] = Ac;
  m[835] = Ac;
  m[836] = uj;
  m[837] = Ac;
  m[838] = gk;
  m[839] = uj;
  m[840] = Ac;
  m[841] = pb;
  m[842] = pb;
  m[843] = pb;
  m[844] = pb;
  m[845] = pb;
  m[846] = pb;
  m[847] = sv;
  m[848] = rv;
  m[849] = pv;
  m[850] = yj;
  m[851] = Uj;
  m[852] = $a;
  m[853] = Tj;
  m[854] = Sj;
  m[855] = Jf;
  m[856] = Rw;
  m[857] = Qw;
  m[858] = Pw;
  m[859] = Ow;
  m[860] = Nw;
  m[861] = Mw;
  m[862] = Ta;
  m[863] = pb;
  m[864] = Ta;
  m[865] = Aj;
  m[866] = ww;
  m[867] = vw;
  m[868] = uw;
  m[869] = tw;
  m[870] = sw;
  m[871] = qw;
  m[872] = pw;
  m[873] = ow;
  m[874] = pb;
  m[875] = nw;
  m[876] = Ta;
  m[877] = Ta;
  m[878] = Zv;
  m[879] = Yv;
  m[880] = Xv;
  m[881] = Wv;
  m[882] = Vv;
  m[883] = Uv;
  m[884] = Tv;
  m[885] = Sv;
  m[886] = Rv;
  m[887] = Pv;
  m[888] = wj;
  m[889] = Ov;
  m[890] = Ta;
  m[891] = pb;
  m[892] = Ta;
  m[893] = Yu;
  m[894] = Tu;
  m[895] = Su;
  m[896] = Uu;
  m[897] = Ou;
  m[898] = Nu;
  m[899] = Ju;
  function ua() {
   return buffer.byteLength / 65536 | 0;
  }
  function va(pagesToAdd) {
   pagesToAdd = pagesToAdd | 0;
   var wa = ua() | 0;
   var xa = wa + pagesToAdd | 0;
   if (wa < xa && xa < 65536) {
    var ya = new ArrayBuffer(v(xa, 65536));
    var za = new global.Int8Array(ya);
    za.set(n);
    n = za;
    n = new global.Int8Array(ya);
    o = new global.Int16Array(ya);
    p = new global.Int32Array(ya);
    q = new global.Uint8Array(ya);
    r = new global.Uint16Array(ya);
    s = new global.Uint32Array(ya);
    t = new global.Float32Array(ya);
    u = new global.Float64Array(ya);
    buffer = ya;
    l.buffer = ya;
   }
   return wa;
  }
  return {
   "N": Uw,
   "O": $d,
   "P": ov,
   "Q": tj,
   "R": Ua,
   "S": nu,
   "T": mu,
   "U": lu,
   "V": ku,
   "W": ju,
   "X": iu,
   "Y": hu,
   "Z": gu,
   "_": fu,
   "$": eu,
   "aa": du,
   "ba": cu,
   "ca": bu,
   "da": au,
   "ea": $t,
   "fa": _t,
   "ga": Zt,
   "ha": Yt,
   "ia": Xt,
   "ja": Wt,
   "ka": Vt,
   "la": Ut,
   "ma": Tt,
   "na": St,
   "oa": Rt,
   "pa": Qt,
   "qa": Pt,
   "ra": Ot,
   "sa": Mt,
   "ta": Nt,
   "ua": Lt
  };
 }
 var Aa = new Uint8Array(wasmMemory.buffer);
 for (var Ba = new Uint8Array(123), Ca = 25; Ca >= 0; --Ca) {
  Ba[48 + Ca] = 52 + Ca;
  Ba[65 + Ca] = Ca;
  Ba[97 + Ca] = 26 + Ca;
 }
 Ba[43] = 62;
 Ba[47] = 63;
 function Da(uint8Array, offset, b64) {
  var Ea, Fa, Ca = 0, Ga = offset, Ha = b64.length, Ia = offset + (Ha * 3 >> 2) - (b64[Ha - 2] == "=") - (b64[Ha - 1] == "=");
  for (; Ca < Ha; Ca += 4) {
   Ea = Ba[b64.charCodeAt(Ca + 1)];
   Fa = Ba[b64.charCodeAt(Ca + 2)];
   uint8Array[Ga++] = Ba[b64.charCodeAt(Ca)] << 2 | Ea >> 4;
   if (Ga < Ia) uint8Array[Ga++] = Ea << 4 | Fa >> 2;
   if (Ga < Ia) uint8Array[Ga++] = Fa << 6 | Ba[b64.charCodeAt(Ca + 3)];
  }
 }
 Da(Aa, 1032, "AQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAsAAAAM");
 Da(Aa, 1088, "DQAAAA4AAAAPAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 1200, "FgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAB0AAAAeAAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 1312, "AQAAAB8AAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKQ==");
 Da(Aa, 1372, "AQAAACoAAAArAAAALAAAAC0AAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAAuAAAALwAAADA=");
 Da(Aa, 1436, "AQAAADEAAAAyAAAAMwAAADQAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAA1AAAANgAAADc=");
 Da(Aa, 1500, "AQAAADgAAAA5AAAAOgAAADsAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAA8AAAAPQAAAD4=");
 Da(Aa, 1564, "AQAAAD8AAABAAAAAQQAAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 1604, "RgAAAEcAAABIAAAASQAAAEoAAABLAAAATAAAAE0AAABOAAAATwAAAFAAAABRAAAAUgAAAFMAAABUAAAAVQ==");
 Da(Aa, 1676, "VgAAAFcAAABYAAAAWQAAAFoAAAApAAAAKQAAAEUAAABOAAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 1788, "WwAAAFwAAABdAAAAXgAAAF8AAABgAAAAYQAAAEUAAABi");
 Da(Aa, 1832, "WwAAAGMAAABkAAAAZQAAAF8AAAApAAAAKQAAAEUAAABi");
 Da(Aa, 1876, "WwAAAGYAAABnAAAAaAAAAF8AAABpAAAAagAAAEUAAABi");
 Da(Aa, 1920, "AQAAAGsAAABsAAAAbQAAAG4AAABvAAAAcAAAAEUAAABxAAAAcgAAAHM=");
 Da(Aa, 1972, "AQAAAHQAAAB1AAAAdgAAAHcAAAB4AAAAeQAAAEUAAAB6");
 Da(Aa, 2016, "ewAAAHwAAAB9AAAAfgAAAH8AAACAAAAAgQAAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAjQAAAI4AAACP");
 Da(Aa, 2108, "kAAAAJEAAACSAAAAkwAAAJQAAAApAAAAKQAAAEUAAACDAAAAhAAAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 2224, "ewAAAJUAAACWAAAAlwAAAJgAAACAAAAAmQAAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAmgAAAJsAAACPAAAAnAAAAJ0=");
 Da(Aa, 2324, "ngAAAJ8AAACgAAAAoQAAAKIAAACAAAAAowAAAIIAAACDAAAAhAAAAKQAAAClAAAApgAAAKcAAACoAAAAqQAAAKoAAACrAAAArAAAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 2476, "rQAAAK4AAACvAAAAsAAAALEAAACyAAAAswAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAALYAAAC3AAAAuAAAALkAAAC6AAAAuwAAALw=");
 Da(Aa, 2564, "rQAAAL0AAAC+AAAAvwAAAMAAAADBAAAAwgAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAMMAAADE");
 Da(Aa, 2632, "xQAAAMYAAADH");
 Da(Aa, 2652, "xQAAAMgAAADJ");
 Da(Aa, 2672, "xQAAAMoAAADJ");
 Da(Aa, 2692, "xQAAAMsAAADJ");
 Da(Aa, 2712, "xQAAAMwAAADJAAAAAACAPw==");
 Da(Aa, 2738, "gD8=");
 Da(Aa, 2756, "zQAAAM4AAADPAAAA0AAAANEAAADSAAAA0wAAAIIAAACDAAAAhAAAANQAAACGAAAA1QAAANYAAADXAAAA2AAAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 2896, "rQAAANkAAADaAAAA2wAAANwAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAAOIAAADjAAAA5AAAAOUAAADm");
 Da(Aa, 2988, "rQAAAOcAAADoAAAA6QAAAOoAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAAOsAAADsAAAA7QAAAO4AAADvAAAA8A==");
 Da(Aa, 3084, "rQAAAPEAAADyAAAA8wAAAPQAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAAPUAAAD2AAAA9wAAAPg=");
 Da(Aa, 3172, "rQAAAPkAAAD6AAAA+wAAAPwAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAACkAAAAp");
 Da(Aa, 3252, "/QAAAP4AAAD/AAAAAAEAAAEBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAABgEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQ==");
 Da(Aa, 3380, "EwEAABQBAAD/AAAAAAEAAAEBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQ==");
 Da(Aa, 3508, "EwEAABYBAAAXAQAAGAEAAAEBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAZAQAAGgEAABEBAAASAQ==");
 Da(Aa, 3636, "rQAAABsBAAAcAQAAHQEAAB4BAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsB");
 Da(Aa, 3736, "rQAAACABAAAhAQAAIgEAACMBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAkAQAAJQE=");
 Da(Aa, 3832, "rQAAACYBAAAnAQAAKAEAACkBAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAACoBAAArAQAALAEAAC0B");
 Da(Aa, 3908, "rQAAAC4BAAAvAQAAMAEAAJQAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQ==");
 Da(Aa, 3968, "rQAAADEBAAAvAQAAMAEAAJQAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQ==");
 Da(Aa, 4032, "AQAAADIBAAApAAAAKQAAACkAAAApAAAAKQAAAEU=");
 Da(Aa, 4072, "rQAAADMBAADoAAAA6QAAAOoAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAACkAAAApAAAANAEAADUBAAA2AQAANwE=");
 Da(Aa, 4168, "rQAAADgBAAD6AAAA+wAAAPwAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADkBAAA6AQAAOwE=");
 Da(Aa, 4240, "rQAAADwBAAA9AQAAPgEAAPwAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAD8BAABAAQ==");
 Da(Aa, 4308, "QQEAAEIBAABDAQAARAEAAEUBAABGAQAARwEAAEgBAABJAQAASgE=");
 Da(Aa, 4356, "SwEAAEwBAABNAQAAKQAAAE4BAABPAQAAUAEAAFEBAABSAQAAKQAAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 4472, "UwEAAFQBAAApAAAAKQAAACkAAAApAAAAKQAAACkAAAApAAAAKQ==");
 Da(Aa, 4520, "EwEAAFUBAAAXAQAAGAEAAAEBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQ==");
 Da(Aa, 4648, "EwEAAFYBAAAcAQAAHQEAAB4BAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4B");
 Da(Aa, 4760, "rQAAAFcBAABYAQAAWQEAAFoBAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADkBAAA6AQAAOwEAAFsBAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 4904, "XAEAAF0BAACSAAAAkwAAAJQAAACAAAAAXgEAAIIAAACDAAAAhAAAAF8BAACGAAAAYAE=");
 Da(Aa, 4964, "rQAAAGEBAAA9AQAAPgEAAPwAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADkBAAA6AQAAOwE=");
 Da(Aa, 5036, "EwEAAGIBAABjAQAAZAEAAGUBAAACAQAAAwEAAIIAAACDAAAAhAAAAGYBAAAFAQAAZwEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAABoAQAAaQEAAGoBAABrAQAAbAEAAGT///8AAAAAbQE=");
 Da(Aa, 5168, "bgEAAG8BAABwAQAAcQEAAHIBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAcwEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAdAEAAHUBAAB2AQAAdwE=");
 Da(Aa, 5312, "EwEAAHgBAABwAQAAcQEAAHIBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAeQEAAHoB");
 Da(Aa, 5448, "ewEAAHwBAAB9AQAAfgEAAH8BAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAgAEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAgQE=");
 Da(Aa, 5580, "EwEAAIIBAAB9AQAAfgEAAH8BAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAgwE=");
 Da(Aa, 5712, "hAEAAIUBAACGAQAAhwEAAIgBAACJAQAAHwEAAIIAAACDAAAAhAAAAIoBAACGAAAAiwEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAIwBAACNAQAAjgE=");
 Da(Aa, 5820, "jwEAAJABAACGAQAAhwEAAIgBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAIwBAACNAQAAKQ==");
 Da(Aa, 5928, "jwEAAJEBAACSAQAAkwEAAIgBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAIwBAACNAQAAKQ==");
 Da(Aa, 6036, "rQAAAJQBAACSAQAAkwEAAIgBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAIwBAACNAQAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 6208, "SwEAAJUBAABNAQAAlgEAAE4BAABPAQAAUAEAAFEBAABSAQAAlwEAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 6324, "bgEAAJgBAACZAQAAmgEAAJsBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAnAEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAdAEAAHUBAACdAQAAngEAAJ8B");
 Da(Aa, 6472, "bgEAAKABAACZAQAAmgEAAJsBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAcwEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAdAEAAHUBAAB2AQAAdwEAAKEB");
 Da(Aa, 6620, "rQAAAKIBAABYAQAAWQEAAFoBAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADkBAAA6AQAAOwEAAKMB");
 Da(Aa, 6696, "pAEAAKUBAACmAQAApwEAAAEBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAqAEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQ==");
 Da(Aa, 6824, "EwEAAKkBAACmAQAApwEAAAEBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQ==");
 Da(Aa, 6952, "qgEAAKsBAACsAQAArQEAAK4BAACAAAAArwEAAIIAAACDAAAAhAAAALQAAACwAQAAsQEAALIBAACzAQAAtAEAALUBAAC2AQAAtwEAALgBAAC4////AAAAALkBAABBcnRib2FyZDo6aW5pdGlhbGl6ZSAtIERyYXcgcnVsZSB0YXJnZXRzIG1pc3NpbmcgY29tcG9uZW50IHdpZHRoIGlkICVkCg==");
 Da(Aa, 7124, "rQAAALoBAAC7AQAAvAEAAL0BAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAL4BAAC/AQAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 7264, "rQAAAMABAACSAAAAkwAAAJQAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAERlcGVuZGVuY3kgY3ljbGUhCgBhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 7412, "rQAAAMEBAADCAQAAwwEAAMQBAADFAQAAxgEAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAMcB");
 Da(Aa, 7476, "rQAAAMgBAAC7AQAAvAEAAL0BAADJAQAAygEAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAL4BAADLAQAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQBCYWQgaGVhZGVyCgBVbnN1cHBvcnRlZCB2ZXJzaW9uICV1LiV1IGV4cGVjdGVkICV1LiV1LgoAUklWRQBhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXplAABVbmtub3duIHByb3BlcnR5IGtleSAlbGx1LCBtaXNzaW5nIGZyb20gcHJvcGVydHkgVG9DLgoARmlsZSBjb250YWlucyBhbiB1bmtub3duIG9iamVjdCB3aXRoIGNvcmVUeXBlICVsbHUsIHdoaWNoIHRoaXMgcnVudGltZSBkb2Vzbid0IHVuZGVyc3RhbmQuCg==");
 Da(Aa, 7892, "AQAAAMwBAADNAQAAzgEAAM8BAABDAAAARAAAAEUAAADQAQ==");
 Da(Aa, 7936, "AQAAANEBAADNAQAAzgEAAM8BAABDAAAARAAAAEUAAADQAQ==");
 Da(Aa, 7980, "AQAAANIBAABAAAAAQQAAAEIAAAApAAAAKQAAAEU=");
 Da(Aa, 8020, "AQAAANMBAADUAQAA1QEAAEIAAAApAAAAKQAAAEU=");
 Da(Aa, 8060, "AQAAANYBAADUAQAA1QEAAEIAAAApAAAAKQAAAEU=");
 Da(Aa, 8100, "AQAAANcBAAAPAAAAEAAAABEAAAApAAAAKQAAAEUAAAAV");
 Da(Aa, 8144, "AQAAANgBAADZAQAA2gEAAHcAAAB4AAAAeQAAAEUAAAB6");
 Da(Aa, 8188, "AQAAANsBAADZAQAA2gEAAHcAAAB4AAAAeQAAAEUAAAB6");
 Da(Aa, 8232, "AQAAANwBAAB1AAAAdgAAAHcAAAApAAAAKQAAAEUAAAB6");
 Da(Aa, 8276, "AQAAAN0BAAAYAAAAGQAAABoAAAApAAAAKQAAAEUAAAAe");
 Da(Aa, 8320, "WwAAAN4BAADfAQAA4AEAAOEBAABgAAAAYQAAAEUAAABiAAAA4gE=");
 Da(Aa, 8368, "WwAAAOMBAADfAQAA4AEAAOEBAABgAAAAYQAAAEUAAABiAAAA4gE=");
 Da(Aa, 8416, "WwAAAOQBAABdAAAAXgAAAF8AAAApAAAAKQAAAEUAAABi");
 Da(Aa, 8460, "WwAAAOUBAABkAAAAZQAAAF8AAAApAAAAKQAAAEUAAABi");
 Da(Aa, 8504, "AQAAAOYBAAA5AAAAOgAAADsAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKQAAAD4=");
 Da(Aa, 8568, "AQAAAOcBAAAgAAAAIQAAACIAAAApAAAAKQAAAEUAAAAmAAAAJwAAACg=");
 Da(Aa, 8620, "AQAAAOgBAADpAQAA6gEAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 8660, "AQAAAOsBAADpAQAA6gEAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 8700, "WwAAAOwBAABnAAAAaAAAAF8AAAApAAAAKQAAAEUAAABi");
 Da(Aa, 8744, "VgAAAO0BAABYAAAAWQAAAFoAAADuAQAA7wEAAEUAAABO");
 Da(Aa, 8788, "AQAAAPABAAADAAAABAAAAAUAAAApAAAAKQAAAEUAAAAJAAAACgAAAAsAAAAM");
 Da(Aa, 8844, "AQAAAPEBAADyAQAA8wEAAPQBAAB4AAAAeQAAAEUAAAB6AAAA9QEAAPYB");
 Da(Aa, 8896, "AQAAAPcBAADyAQAA8wEAAPQBAAB4AAAAeQAAAEUAAAB6AAAA9QEAAPYB");
 Da(Aa, 8948, "AQAAAPgBAAD5AQAA+gEAAPsBAAB4AAAAeQAAAEUAAAB6AAAA9QE=");
 Da(Aa, 8996, "AQAAAPwBAAD5AQAA+gEAAPsBAAB4AAAAeQAAAEUAAAB6AAAA9QE=");
 Da(Aa, 9044, "AQAAAP0BAABsAAAAbQAAAG4AAAApAAAAKQAAAEUAAABxAAAAcgAAAHM=");
 Da(Aa, 9096, "AQAAAP4BAAAyAAAAMwAAADQAAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKQAAADc=");
 Da(Aa, 9160, "AQAAAP8BAAArAAAALAAAAC0AAAAjAAAAJAAAACUAAAAmAAAAJwAAACgAAAApAAAAKQAAADA=");
 Da(Aa, 9224, "VgAAAAACAAABAgAAAgIAAFoAAADuAQAA7wEAAEUAAABO");
 Da(Aa, 9268, "VgAAAAMCAAABAgAAAgIAAFoAAADuAQAA7wEAAEUAAABO");
 Da(Aa, 9312, "AQAAAAQCAAAFAgAABgIAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 9352, "AQAAAAcCAAAFAgAABgIAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 9392, "VgAAAAgCAABIAAAASQAAAEoAAADuAQAA7wEAAEUAAABOAAAATwAAAFAAAABRAAAAUgAAAFMAAABUAAAAVQ==");
 Da(Aa, 9464, "WwAAAAkCAAAKAgAACwIAAF8AAABgAAAAYQAAAEUAAABi");
 Da(Aa, 9508, "WwAAAAwCAAAKAgAACwIAAF8AAABgAAAAYQAAAEUAAABi");
 Da(Aa, 9552, "AQAAAA0CAAAOAgAADwIAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 9592, "AQAAABACAAAOAgAADwIAAEIAAABDAAAARAAAAEU=");
 Da(Aa, 9632, "AQAAABECAAASAgAAEwIAAPsBAAB4AAAAeQAAAEUAAAB6AAAA9QE=");
 Da(Aa, 9680, "AQAAABQCAAASAgAAEwIAAPsBAAB4AAAAeQAAAEUAAAB6AAAA9QE=");
 Da(Aa, 9728, "WwAAABUCAAAWAgAAFwIAABgCAABgAAAAYQAAAEUAAABiAAAAGQI=");
 Da(Aa, 9776, "WwAAABoCAAAWAgAAFwIAABgCAABgAAAAYQAAAEUAAABiAAAAGQI=");
 Da(Aa, 9824, "rQAAABsCAAAcAgAAHQIAAB4CAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAB8CAAAgAgAAIQIAACICAAAjAg==");
 Da(Aa, 9904, "KQ==");
 Da(Aa, 9916, "JAIAACUCAAAmAgAAJwIAAB4CAAAoAgAAKQIAAIIAAACDAAAAhAAAACoCAACGAAAAKwIAACwCAAAtAgAALgIAAC8CAAAwAgAAMQIAADICAAC8////AAAAADMC");
 Da(Aa, 10016, "NAIAADUCAAA2AgAANwIAADgCAACAAAAAOQIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADoCAAA7AgAAKQAAACkAAAA8AgAAPQIAAD4CAAA/Ag==");
 Da(Aa, 10108, "rQAAAEACAABBAgAAQgIAAEMCAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADoC");
 Da(Aa, 10172, "rQAAAEQCAABFAgAARgIAAEcCAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAEgC");
 Da(Aa, 10236, "rQAAAEkCAABKAgAASwIAAEwCAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAE0CAABOAg==");
 Da(Aa, 10304, "NAIAAE8CAABQAgAAUQIAAFICAACAAAAAOQIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADoCAAA7AgAAKQAAACkAAABTAg==");
 Da(Aa, 10384, "rQAAAFQCAADaAAAA2wAAANwAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAACkAAAApAAAAVQIAAFYCAABXAg==");
 Da(Aa, 10476, "EwEAAFgCAABjAQAAZAEAAGUBAAACAQAAAwEAAIIAAACDAAAAhAAAAAQBAAAFAQAAFQEAAIgAAACJAAAAigAAAIsAAACMAAAABwEAAAgBAAAJAQAACgEAAAsBAAAMAQAADQEAAA4BAABrAQ==");
 Da(Aa, 10592, "KQ==");
 Da(Aa, 10604, "rQAAAFkCAADyAAAA8wAAAPQAAADdAAAA3gAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAN8AAADgAAAA4QAAACkAAAApAAAAWgIAAFsC");
 Da(Aa, 10692, "rQAAAFwCAADPAAAA0AAAANEAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAANYAAADXAAAA2A==");
 Da(Aa, 10764, "rQAAAF0CAADCAQAAwwEAAMQBAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAF4C");
 Da(Aa, 10828, "rQAAAF8CAACsAQAArQEAAK4BAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAALIBAACzAQAAtAEAALUBAAC2AQAAtwE=");
 Da(Aa, 10912, "KQ==");
 Da(Aa, 10924, "AQAAAGACAABhAgAAYgIAAGMCAABkAgAAZQIAAEU=");
 Da(Aa, 10964, "AQAAAGYCAABhAgAAYgIAAGMCAAApAAAAKQAAAEU=");
 Da(Aa, 11004, "rQAAAGcCAAC+AAAAvwAAAMAAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAMMAAADE");
 Da(Aa, 11072, "rQAAAGgCAAB9AAAAfgAAAH8AAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAKQAAACkAAABpAg==");
 Da(Aa, 11164, "rQAAAGoCAABrAgAAbAIAACkBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAKQAAACk=");
 Da(Aa, 11252, "rQAAAG0CAABrAgAAbAIAACkBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAKQAAACk=");
 Da(Aa, 11340, "ewAAAG4CAACWAAAAlwAAAJgAAACAAAAAgQAAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAmgAAAJsAAACPAAAAbwIAAHAC");
 Da(Aa, 11440, "rQAAAHECAACgAAAAoQAAAKIAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAKcAAACoAAAAqQAAAKoAAACrAAAArA==");
 Da(Aa, 11524, "rQAAAHICAACvAAAAsAAAALEAAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAALYAAAC3AAAAuAAAALkAAAC6AAAAuwAAALw=");
 Da(Aa, 11612, "rQAAAHMCAAB0AgAAdQIAAHYCAADBAAAAwgAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAMMAAADEAAAAdwIAAHgCAAB5AgAAegI=");
 Da(Aa, 11696, "rQAAAHsCAAB0AgAAdQIAAHYCAADBAAAAwgAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAMMAAADEAAAAdwIAAHgCAAB5AgAAegIAAAEAAAAAAAAA/////wIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAP////8CAAAAAgAAAP////8AAAAAAgAAAAIAAAACAAAA/////////////////////wIAAAAAAAAAAgAAAAIAAAACAAAA/////wMAAAADAAAAAg==");
 Da(Aa, 11924, "AgAAAP///////////////wIAAAAC");
 Da(Aa, 11964, "/////wAAAAD/////AQ==");
 Da(Aa, 11988, "Ag==");
 Da(Aa, 12008, "AgAAAAIAAAACAAAAAg==");
 Da(Aa, 12036, "AgAAAP//////////////////////////////////////////AgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAwAAAAIAAAACAAAAAg==");
 Da(Aa, 12140, "AgAAAAIAAAACAAAAAgAAAAIAAAAC");
 Da(Aa, 12172, "AgAAAAIAAAACAAAAAgAAAAIAAAAC");
 Da(Aa, 12212, "AgAAAAIAAAACAAAAAAAAAP////8=");
 Da(Aa, 12248, "AgAAAAIAAAAAAAAAAgAAAAI=");
 Da(Aa, 12276, "//////////////////////////////////////////8BAAAA/////wIAAAAAAAAA/////////////////////////////////////wAAAAD/////AAAAAAAAAAD//////////wAAAAAAAAAAAg==");
 Da(Aa, 12394, "gL8AAIC/AAAAAAAAgL8AAIA/AACAvwAAgL8=");
 Da(Aa, 12434, "gD8AAAAAAACAvwAAgD8AAAAAAACAPwAAgD8AAIA/AAAAAAAAAACtAAAAfAIAACEBAAAiAQAAIwEAAIAAAAAfAQAAggAAAIMAAACEAAAAhQAAAIYAAACHAAAAiAAAAIkAAACKAAAAiwAAAIwAAAAHAQAACAEAAAkBAAAKAQ==");
 Da(Aa, 12568, "rQAAAH0CAAAnAQAAKAEAACkBAACAAAAAHwEAAIIAAACDAAAAhAAAAIUAAACGAAAAhwAAAIgAAACJAAAAigAAAIsAAACMAAAAKQAAACk=");
 Da(Aa, 12656, "NAIAAH4CAABQAgAAUQIAAFICAACAAAAAOQIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADoCAAB/AgAAgAIAAIECAABTAg==");
 Da(Aa, 12736, "rQAAAIICAABKAgAASwIAAEwCAACDAgAAhAIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAIUCAACGAg==");
 Da(Aa, 12804, "JAIAAIgCAAAcAgAAHQIAAB4CAAAoAgAAKQIAAIIAAACDAAAAhAAAACoCAACGAAAAKwIAACwCAAAtAgAALgIAAC8CAAAwAgAAMQIAADICAAC8////AAAAADMCAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 12972, "JAIAAIkCAAAmAgAAJwIAAB4CAAAoAgAAigIAAIIAAACDAAAAhAAAACoCAACGAAAAKwIAACwCAAAtAgAALgIAAC8CAAAwAgAAMQIAAIsCAAC8////AAAAADMC");
 Da(Aa, 13072, "NAIAAIwCAABBAgAAQgIAAEMCAACAAAAAOQIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADoCAAA7AgAAKQAAACk=");
 Da(Aa, 13148, "rQAAAI0CAABFAgAARgIAAEcCAACOAgAAjwIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAJACAACRAgAAzP///wAAAACSAg==");
 Da(Aa, 13228, "NAIAAJMCAAA2AgAANwIAADgCAACAAAAAOQIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAADoCAACUAgAAlQIAAJYCAACXAgAAmAIAAJkCAAA/Ag==");
 Da(Aa, 13320, "mgIAAJsCAACcAgAAnQIAAJ4CAACAAAAAnwIAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAKACAAChAgAAogIAAKMCAACkAgAApQIAAMD///8AAAAApgIAAKcC");
 Da(Aa, 13420, "rQAAAKgCAACcAgAAnQIAAJ4CAACAAAAAKQAAAIIAAACDAAAAhAAAALQAAACGAAAAtQAAAKkCAACqAgAAqwIAAKwC");
 Da(Aa, 13496, "KQAAACkAAAByZW5kZXJGYWN0b3J5AG1ha2VSZW5kZXJQYWludABtYWtlUmVuZGVyUGF0aABieXRlTGVuZ3RoAHNldABsb2FkAFJlbmRlcmVyAHNhdmUAcmVzdG9yZQB0cmFuc2Zvcm0AZHJhd1BhdGgAY2xpcFBhdGgAYWxpZ24AUmVuZGVyZXJXcmFwcGVyAFJlbmRlclBhdGgAcmVzZXQAYWRkUGF0aABmaWxsUnVsZQBtb3ZlVG8AbGluZVRvAGN1YmljVG8AY2xvc2UAUmVuZGVyUGF0aFdyYXBwZXIAUmVuZGVyUGFpbnRTdHlsZQBmaWxsAHN0cm9rZQBGaWxsUnVsZQBub25aZXJvAGV2ZW5PZGQAU3Ryb2tlQ2FwAGJ1dHQAcm91bmQAc3F1YXJlAFN0cm9rZUpvaW4AbWl0ZXIAYmV2ZWwAQmxlbmRNb2RlAHNyY092ZXIAc2NyZWVuAG92ZXJsYXkAZGFya2VuAGxpZ2h0ZW4AY29sb3JEb2RnZQBjb2xvckJ1cm4AaGFyZExpZ2h0AHNvZnRMaWdodABkaWZmZXJlbmNlAGV4Y2x1c2lvbgBtdWx0aXBseQBodWUAc2F0dXJhdGlvbgBjb2xvcgBsdW1pbm9zaXR5AFJlbmRlclBhaW50AHN0eWxlAHRoaWNrbmVzcwBqb2luAGNhcABibGVuZE1vZGUAbGluZWFyR3JhZGllbnQAcmFkaWFsR3JhZGllbnQAYWRkU3RvcABjb21wbGV0ZUdyYWRpZW50AFJlbmRlclBhaW50V3JhcHBlcgBNYXQyRAB4eAB4eQB5eAB5eQB0eAB0eQBGaWxlAGFydGJvYXJkAGRlZmF1bHRBcnRib2FyZABBcnRib2FyZABhZHZhbmNlAGRyYXcAdHJhbnNmb3JtQ29tcG9uZW50AG5vZGUAYm9uZQByb290Qm9uZQBhbmltYXRpb25CeUluZGV4AGFuaW1hdGlvbkJ5TmFtZQBhbmltYXRpb25Db3VudABzdGF0ZU1hY2hpbmVCeUluZGV4AHN0YXRlTWFjaGluZUJ5TmFtZQBzdGF0ZU1hY2hpbmVDb3VudABib3VuZHMAVHJhbnNmb3JtQ29tcG9uZW50AHNjYWxlWABzY2FsZVkAcm90YXRpb24ATm9kZQB4AHkAQm9uZQBsZW5ndGgAUm9vdEJvbmUATGluZWFyQW5pbWF0aW9uAG5hbWUAZHVyYXRpb24AZnBzAHdvcmtTdGFydAB3b3JrRW5kAGxvb3BWYWx1ZQBzcGVlZABhcHBseQBMaW5lYXJBbmltYXRpb25JbnN0YW5jZQB0aW1lAGRpZExvb3AARml0AGNvbnRhaW4AY292ZXIAZml0V2lkdGgAZml0SGVpZ2h0AG5vbmUAc2NhbGVEb3duAEFsaWdubWVudAB0b3BMZWZ0AHRvcENlbnRlcgB0b3BSaWdodABjZW50ZXJMZWZ0AGNlbnRlcgBjZW50ZXJSaWdodABib3R0b21MZWZ0AGJvdHRvbUNlbnRlcgBib3R0b21SaWdodABBQUJCAG1pblgAbWluWQBtYXhYAG1heFkAADRUAAA1VAAANlQAADdUAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXplAERUAAA0VAAARVQAADRUAABpaWkAaWkAdgB2aQBEVAAASlQAAHZpaQBEVAAASlQAAEtUAAB2aWlpAAAAAERUAABKVAAANlQAADVUAAB2aWlpaQAAAERUAABKVAAANlQ=");
 Da(Aa, 14880, "RFQAAEdUAABMVAAATVQAAE5UAABOVAAAdmlpaWlpaQBub3RpZnlPbkRlc3RydWN0aW9uAGltcGxlbWVudABleHRlbmQAAAAARFQAAElUAABKVAAANFQ=");
 Da(Aa, 14976, "VwMAAFgDAABZAwAAWgMAAFsDAABcAwAAXQM=");
 Da(Aa, 15012, "VwMAAF4DAAApAAAAKQAAACkAAAApAAAAKQ==");
 Da(Aa, 15048, "XwMAAGADAAApAAAAKQAAACkAAAApAAAAKQAAAF9fZGVzdHJ1Y3QAAERUAABEVAAAS1QAAERUAAA2VAAANVQAAERUAAA2VAAANFQAAHBUAAA0VAAAaWlpaQAAAABEVAAAdFQAAAAAAABEVAAAdFQAADZUAABLVAAARFQAAHRUAAB1VAAAAAAAAERUAAB0VAAAdlQAAHZUAAB2aWlmZg==");
 Da(Aa, 15216, "RFQAAHRUAAB2VAAAdlQAAHZUAAB2VAAAdlQAAHZUAAB2aWlmZmZmZmYAAABEVAAAc1QAAHRUAAA0VA==");
 Da(Aa, 15284, "YQMAAGIDAABjAwAAZAMAAGUDAABmAwAAZwMAAGgDAABpAwAAagMAAGsD");
 Da(Aa, 15336, "YQMAAGwDAAApAAAAKQAAAGUDAAApAAAAKQAAACkAAAApAAAAagMAACk=");
 Da(Aa, 15388, "UwEAAG0DAAApAAAAKQAAAGUDAAApAAAAKQAAACkAAAApAAAAagMAACkAAABEVAAAdVQAAERUAAB2VAAAdlQAAAAAAABEVAAAdlQAAHZUAAB2VAAAdlQAAHZUAAB2VAAARFQAADZUAABLVAAARFQAAJ9UAAA3VAAARFQAAJ9UAACYVAAARFQAAJ9UAAB2VAAAdmlpZgAAAABEVAAAn1QAAJpUAABEVAAAn1QAAJlUAABEVAAAn1QAAJtU");
 Da(Aa, 15584, "RFQAAJ9UAAB2VAAAdlQAAHZUAAB2VAAAdmlpZmZmZgBEVAAAn1QAADdUAAB2VAAAdmlpaWYAAABEVAAAn1QAAERUAACeVAAAn1QAADRU");
 Da(Aa, 15672, "bgMAAG8DAABwAwAAcQMAAHIDAABzAwAAdAMAAHUDAAB2AwAAdwMAAHgDAAB5Aw==");
 Da(Aa, 15728, "KQAAACkAAAApAAAAKQAAACkAAAApAAAAKQAAACkAAAApAAAAKQAAAHgDAAB6Aw==");
 Da(Aa, 15784, "KQAAACkAAAApAAAAKQAAACkAAAApAAAAKQAAACkAAAApAAAAKQAAAHsDAAB8AwAARFQAAJhUAABEVAAAN1QAAERUAAB2VAAARFQAAJpUAABEVAAAmVQAAERUAACbVA==");
 Da(Aa, 15888, "RFQAAHZUAAB2VAAAdlQAAHZUAABEVAAAN1QAAHZUAABmaWkA6FQAAOdUAABwVAAA6FQAAOdUAADrVAAA6FQAAOxUAABpaWlkAAAAAERUAADoVAAAR1QAAO1UAADoVAAAcFQAAO5UAADoVAAAcFQAAO9UAADoVAAAcFQAAPBUAADoVAAAcFQAAPFUAADoVAAA8lQAAPFUAADoVAAAcFQAAPJUAADoVAAA81QAAOhUAADyVAAA81QAAOhUAABwVAAARFQAAPFUAADoVAAAdlQAAHZUAAB2aWlpZmYAAABVAADxVAAA61QAAABVAAB2VAAAaWlpZg==");
 Da(Aa, 16144, "RFQAAAFVAADoVAAAdlQAAGkAJXAAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AAAAAAAAAwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20Az342AAnLJwBGT7cAnmY/AC3qXwC6J3UA5evHAD178QD3OQcAklKKAPtr6gAfsV8ACF2NADADVgB7/EYA8KtrACC8zwA29JoA46kdAF5hkQAIG+YAhZllAKAUXwCNQGgAgNj/ACdzTQAGBjEAylYVAMmocwB74mAAa4zAABnERwDNZ8MACejcAFmDKgCLdsQAphyWAESv3QAZV9EApT4FAAUH/wAzfj8AwjLoAJhP3gC7fTIAJj3DAB5r7wCf+F4ANR86AH/yygDxhx0AfJAhAGokfADVbvoAMC13ABU7QwC1FMYAwxmdAK3EwgAsTUEADABdAIZ9RgDjcS0Am8aaADNiAAC00nwAtKeXADdV1QDXPvYAoxAYAE12/ABknSoAcNerAGN8+AB6sFcAFxXnAMBJVgA71tkAp4Q4ACQjywDWincAWlQjAAAfuQDxChsAGc7fAJ8x/wBmHmoAmVdhAKz7RwB+f9gAImW3ADLoiQDmv2AA78TNAGw2CQBdP9QAFt7XAFg73gDem5IA0iIoACiG6ADiWE0AxsoyAAjjFgDgfcsAF8BQAPMdpwAY4FsALhM0AIMSYgCDSAEA9Y5bAK2wfwAe6fIASEpDABBn0wCq3dgArl9CAGphzgAKKKQA05m0AAam8gBcd38Ao8KDAGE8iACKc3gAr4xaAG/XvQAtpmMA9L/LAI2B7wAmwWcAVcpFAMrZNgAoqNIAwmGNABLJdwAEJhQAEkabAMRZxADIxUQATbKRAAAX8wDUQ60AKUnlAP3VEAAAvvwAHpTMAHDO7gATPvUA7PGAALPnwwDH+CgAkwWUAMFxPgAuCbMAC0XzAIgSnACrIHsALrWfAEeSwgB7Mi8ADFVtAHKnkABr5x8AMcuWAHkWSgBBeeIA9N+JAOiUlwDi5oQAmTGXAIjtawBfXzYAu/0OAEiatABnpGwAcXJCAI1dMgCfFbgAvOUJAI0xJQD3dDkAMAUcAA0MAQBLCGgALO5YAEeqkAB05wIAvdYkAPd9pgBuSHIAnxbvAI6UpgC0kfYA0VNRAM8K8gAgmDMA9Ut+ALJjaADdPl8AQF0DAIWJfwBVUikAN2TAAG3YEAAySDIAW0x1AE5x1ABFVG4ACwnBACr1aQAUZtUAJwedAF0EUAC0O9sA6nbFAIf5FwBJa30AHSe6AJZpKQDGzKwArRRUAJDiagCI2YkALHJQAASkvgB3B5QA8zBwAAD8JwDqcagAZsJJAGTgPQCX3YMAoz+XAEOU/QANhowAMUHeAJI5nQDdcIwAF7fnAAjfOwAVNysAXICgAFqAkwAQEZIAD+jYAGyArwDb/0sAOJAPAFkYdgBipRUAYcu7AMeJuQAQQL0A0vIEAEl1JwDrtvYA2yK7AAoUqgCJJi8AZIN2AAk7MwAOlBoAUTqqAB2jwgCv7a4AXCYSAG3CTQAtepwAwFaXAAM/gwAJ8PYAK0CMAG0xmQA5tAcADCAVANjDWwD1ksQAxq1LAE7KpQCnN80A5qk2AKuSlADdQmgAGWPeAHaM7wBoi1IA/Ns3AK6hqwDfFTEAAK6hAAz72gBkTWYA7QW3ACllMABXVr8AR/86AGr5uQB1vvMAKJPfAKuAMABmjPYABMsVAPoiBgDZ5B0APbOkAFcbjwA2zQkATkLpABO+pAAzI7UA8KoaAE9lqADSwaUACz8PAFt4zQAj+XYAe4sEAIkXcgDGplMAb27iAO/rAACbSlgAxNq3AKpmugB2z88A0QIdALHxLQCMmcEAw613AIZI2gD3XaAAxoD0AKzwLwDd7JoAP1y8ANDebQCQxx8AKtu2AKMlOgAAr5oArVOTALZXBAApLbQAS4B+ANoHpwB2qg4Ae1mhABYSKgDcty0A+uX9AInb/gCJvv0A5HZsAAap/AA+gHAAhW4VAP2H/wAoPgcAYWczACoYhgBNveoAs+evAI9tbgCVZzkAMb9bAITXSAAw3xYAxy1DACVhNQDJcM4AMMu4AL9s/QCkAKIABWzkAFrdoAAhb0cAYhLSALlchABwYUkAa1bgAJlSAQBQVTcAHtW3ADPxxAATbl8AXTDkAIUuqQAdssMAoTI2AAi3pADqsdQAFvchAI9p5AAn/3cADAOAAI1ALQBPzaAAIKWZALOi0wAvXQoAtPlCABHaywB9vtAAm9vBAKsXvQDKooEACGpcAC5VFwAnAFUAfxTwAOEHhgAUC2QAlkGNAIe+3gDa/SoAayW2AHuJNAAF8/4Aub+eAGhqTwBKKqgAT8RaAC34vADXWpgA9MeVAA1NjQAgOqYApFdfABQ/sQCAOJUAzCABAHHdhgDJ3rYAv2D1AE1lEQABB2sAjLCsALLA0ABRVUgAHvsOAJVywwCjBjsAwEA1AAbcewDgRcwATin6ANbKyADo80EAfGTeAJtk2ADZvjEApJfDAHdY1ABp48UA8NoTALo6PABGGEYAVXVfANK99QBuksYArC5dAA5E7QAcPkIAYcSHACn96QDn1vMAInzKAG+RNQAI4MUA/9eNAG5q4gCw/cYAkwjBAHxddABrrbIAzW6dAD5yewDGEWoA98+pAClz3wC1yboAtwBRAOKyDQB0uiQA5X1gAHTYigANFSwAgRgMAH5mlAABKRYAn3p2AP39vgBWRe8A2X42AOzZEwCLurkAxJf8ADGoJwDxbsMAlMU2ANioVgC0qLUAz8wOABKJLQBvVzQALFaJAJnO4wDWILkAa16qAD4qnAARX8wA/QtKAOH0+wCOO20A4oYsAOnUhAD8tKkA7+7RAC41yQAvOWEAOCFEABvZyACB/AoA+0pqAC8c2ABTtIQATpmMAFQizAAqVdwAwMbWAAsZlgAacLgAaZVkACZaYAA/Uu4AfxEPAPS1EQD8y/UANLwtADS87gDoXcwA3V5gAGeOmwCSM+8AyRe4AGFYmwDhV7wAUYPGANg+EADdcUgALRzdAK8YoQAhLEYAWfPXANl6mACeVMAAT4b6AFYG/ADlea4AiSI2ADitIgBnk9wAVeiqAIImOADK55sAUQ2kAJkzsQCp1w4AaQVIAGWy8AB/iKcAiEyXAPnRNgAhkrMAe4JKAJjPIQBAn9wA3EdVAOF0OgBn60IA/p3fAF7UXwB7Z6QAuqx6AFX2ogAriCMAQbpVAFluCAAhKoYAOUeDAInj5gDlntQASftAAP9W6QAcD8oAxVmKAJT6KwDTwcUAD8XPANtargBHxYYAhUNiACGGOwAseZQAEGGHACpMewCALBoAQ78SAIgmkAB4PIkAqMTkAOXbewDEOsIAJvTqAPdnigANkr8AZaMrAD2TsQC9fAsApFHcACfdYwBp4d0AmpQZAKgplQBozigACe20AESfIABOmMoAcIJjAH58IwAPuTIAp/WOABRW5wAh8QgAtZ0qAG9+TQClGVEAtfmrAILf1gCW3WEAFjYCAMQ6nwCDoqEAcu1tADmNegCCuKkAazJcAEYnWwAANO0A0gB3APz0VQABWU0A4HGA");
 Da(Aa, 19747, "QPsh+T8AAAAALUR0PgAAAICYRvg8AAAAYFHMeDsAAACAgxvwOQAAAEAgJXo4AAAAgCKC4zYAAAAAHfNpNWhSAAAtKyAgIDBYMHgAKG51bGwp");
 Da(Aa, 19840, "EQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAEACQsLAAAJBgsAAAsABhEAAAARERE=");
 Da(Aa, 19921, "CwAAAAAAAAAAEQAKChEREQAKAAACAAkLAAAACQALAAAL");
 Da(Aa, 19979, "DA==");
 Da(Aa, 19991, "DAAAAAAMAAAAAAkMAAAAAAAMAAAM");
 Da(Aa, 20037, "Dg==");
 Da(Aa, 20049, "DQAAAAQNAAAAAAkOAAAAAAAOAAAO");
 Da(Aa, 20095, "EA==");
 Da(Aa, 20107, "DwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhIS");
 Da(Aa, 20162, "EgAAABISEgAAAAAAAAk=");
 Da(Aa, 20211, "Cw==");
 Da(Aa, 20223, "CgAAAAAKAAAAAAkLAAAAAAALAAAL");
 Da(Aa, 20269, "DA==");
 Da(Aa, 20281, "DAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAwMTIzNDU2Nzg5QUJDREVGLTBYKzBYIDBYLTB4KzB4IDB4AGluZgBJTkYAbmFuAE5BTgAu");
 Da(Aa, 20396, "gwM=");
 Da(Aa, 20435, "//////8=");
 Da(Aa, 20516, "AgAAAAMAAAAFAAAABwAAAAsAAAANAAAAEQAAABMAAAAXAAAAHQAAAB8AAAAlAAAAKQAAACsAAAAvAAAANQAAADsAAAA9AAAAQwAAAEcAAABJAAAATwAAAFMAAABZAAAAYQAAAGUAAABnAAAAawAAAG0AAABxAAAAfwAAAIMAAACJAAAAiwAAAJUAAACXAAAAnQAAAKMAAACnAAAArQAAALMAAAC1AAAAvwAAAMEAAADFAAAAxwAAANMAAAABAAAACwAAAA0AAAARAAAAEwAAABcAAAAdAAAAHwAAACUAAAApAAAAKwAAAC8AAAA1AAAAOwAAAD0AAABDAAAARwAAAEkAAABPAAAAUwAAAFkAAABhAAAAZQAAAGcAAABrAAAAbQAAAHEAAAB5AAAAfwAAAIMAAACJAAAAiwAAAI8AAACVAAAAlwAAAJ0AAACjAAAApwAAAKkAAACtAAAAswAAALUAAAC7AAAAvwAAAMEAAADFAAAAxwAAANEAAABfX25leHRfcHJpbWUgb3ZlcmZsb3cAYmFzaWNfc3RyaW5nAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemUAdmVjdG9yAF9fY3hhX2d1YXJkX2FjcXVpcmUgZGV0ZWN0ZWQgcmVjdXJzaXZlIGluaXRpYWxpemF0aW9uAFB1cmUgdmlydHVhbCBmdW5jdGlvbiBjYWxsZWQh");
 Da(Aa, 21096, "BQ==");
 Da(Aa, 21108, "fgM=");
 Da(Aa, 21132, "fwMAAIADAAAhVQ==");
 Da(Aa, 21156, "Ag==");
 Da(Aa, 21171, "//////8=");
 Da(Aa, 21416, "UFU=");
 return k({
  "Int8Array": Int8Array,
  "Int16Array": Int16Array,
  "Int32Array": Int32Array,
  "Uint8Array": Uint8Array,
  "Uint16Array": Uint16Array,
  "Uint32Array": Uint32Array,
  "Float32Array": Float32Array,
  "Float64Array": Float64Array,
  "NaN": NaN,
  "Infinity": Infinity,
  "Math": Math
 }, asmLibraryArg, wasmMemory.buffer);
}


// EMSCRIPTEN_END_ASM




)(asmLibraryArg, wasmMemory, wasmTable);
 },
 instantiate: function(binary, info) {
  return {
   then: function(ok) {
    var module = new WebAssembly.Module(binary);
    ok({
     "instance": new WebAssembly.Instance(module)
    });
   }
  };
 },
 RuntimeError: Error
};

wasmBinary = [];

if (typeof WebAssembly !== "object") {
 abort("no native wasm support detected");
}

var wasmMemory;

var wasmTable = new WebAssembly.Table({
 "initial": 900,
 "maximum": 900 + 0,
 "element": "anyfunc"
});

var ABORT = false;

var EXITSTATUS = 0;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(heap.subarray(idx, endPtr));
 } else {
  var str = "";
  while (idx < endPtr) {
   var u0 = heap[idx++];
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   var u1 = heap[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   var u2 = heap[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4;
 }
 return len;
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
 var endPtr = ptr;
 var idx = endPtr >> 1;
 var maxIdx = idx + maxBytesToRead / 2;
 while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
 endPtr = idx << 1;
 if (endPtr - ptr > 32 && UTF16Decoder) {
  return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
 } else {
  var i = 0;
  var str = "";
  while (1) {
   var codeUnit = HEAP16[ptr + i * 2 >> 1];
   if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
   ++i;
   str += String.fromCharCode(codeUnit);
  }
 }
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr >> 1] = codeUnit;
  outPtr += 2;
 }
 HEAP16[outPtr >> 1] = 0;
 return outPtr - startPtr;
}

function lengthBytesUTF16(str) {
 return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
 var i = 0;
 var str = "";
 while (!(i >= maxBytesToRead / 4)) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) break;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
 return str;
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 HEAP32[outPtr >> 2] = 0;
 return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}

var WASM_PAGE_SIZE = 65536;

function alignUp(x, multiple) {
 if (x % multiple > 0) {
  x += multiple - x % multiple;
 }
 return x;
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var DYNAMIC_BASE = 5265408, DYNAMICTOP_PTR = 22368;

var INITIAL_INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

if (Module["wasmMemory"]) {
 wasmMemory = Module["wasmMemory"];
} else {
 wasmMemory = new WebAssembly.Memory({
  "initial": INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE,
  "maximum": 2147483648 / WASM_PAGE_SIZE
 });
}

if (wasmMemory) {
 buffer = wasmMemory.buffer;
}

INITIAL_INITIAL_MEMORY = buffer.byteLength;

updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback(Module);
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Module["dynCall_v"](func);
   } else {
    Module["dynCall_vi"](func, callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what += "";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
 var e = new WebAssembly.RuntimeError(what);
 readyPromiseReject(e);
 throw e;
}

function hasPrefix(str, prefix) {
 return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

function isFileURI(filename) {
 return hasPrefix(filename, fileURIPrefix);
}

var wasmBinaryFile = "";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
 try {
  if (wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  var binary = tryParseAsDataURI(wasmBinaryFile);
  if (binary) {
   return binary;
  }
  if (readBinary) {
   return readBinary(wasmBinaryFile);
  } else {
   throw "both async and sync fetching of the wasm failed";
  }
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
  return fetch(wasmBinaryFile, {
   credentials: "same-origin"
  }).then(function(response) {
   if (!response["ok"]) {
    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
   }
   return response["arrayBuffer"]();
  }).catch(function() {
   return getBinary();
  });
 }
 return Promise.resolve().then(getBinary);
}

function createWasm() {
 var info = {
  "a": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiatedSource(output) {
  receiveInstance(output["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  return getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   abort(reason);
  });
 }
 function instantiateAsync() {
  if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
   fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    var result = WebAssembly.instantiateStreaming(response, info);
    return result.then(receiveInstantiatedSource, function(reason) {
     err("wasm streaming compile failed: " + reason);
     err("falling back to ArrayBuffer instantiation");
     return instantiateArrayBuffer(receiveInstantiatedSource);
    });
   });
  } else {
   return instantiateArrayBuffer(receiveInstantiatedSource);
  }
 }
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 instantiateAsync();
 return {};
}

__ATINIT__.push({
 func: function() {
  ___wasm_call_ctors();
 }
});

var char_0 = 48;

var char_9 = 57;

function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}

function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body);
}

var emval_free_list = [];

var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];

function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}

function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}

function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}

function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }

 case null:
  {
   return 2;
  }

 case true:
  {
   return 3;
  }

 case false:
  {
   return 4;
  }

 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}

function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, function(message) {
  this.name = errorName;
  this.message = message;
  var stack = new Error(message).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 });
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 };
 return errorClass;
}

var PureVirtualError = undefined;

function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (HEAPU8[c]) {
  ret += embind_charCodes[HEAPU8[c++]];
 }
 return ret;
}

function getInheritedInstanceCount() {
 return Object.keys(registeredInstances).length;
}

function getLiveInheritedInstances() {
 var rv = [];
 for (var k in registeredInstances) {
  if (registeredInstances.hasOwnProperty(k)) {
   rv.push(registeredInstances[k]);
  }
 }
 return rv;
}

var deletionQueue = [];

function flushPendingDeletes() {
 while (deletionQueue.length) {
  var obj = deletionQueue.pop();
  obj.$$.deleteScheduled = false;
  obj["delete"]();
 }
}

var delayFunction = undefined;

function setDelayFunction(fn) {
 delayFunction = fn;
 if (deletionQueue.length && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
}

function init_embind() {
 Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
 Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
 Module["flushPendingDeletes"] = flushPendingDeletes;
 Module["setDelayFunction"] = setDelayFunction;
}

var registeredInstances = {};

var BindingError = undefined;

function throwBindingError(message) {
 throw new BindingError(message);
}

function getBasestPointer(class_, ptr) {
 if (ptr === undefined) {
  throwBindingError("ptr should not be undefined");
 }
 while (class_.baseClass) {
  ptr = class_.upcast(ptr);
  class_ = class_.baseClass;
 }
 return ptr;
}

function registerInheritedInstance(class_, ptr, instance) {
 ptr = getBasestPointer(class_, ptr);
 if (registeredInstances.hasOwnProperty(ptr)) {
  throwBindingError("Tried to register registered instance: " + ptr);
 } else {
  registeredInstances[ptr] = instance;
 }
}

function requireHandle(handle) {
 if (!handle) {
  throwBindingError("Cannot use deleted val. handle = " + handle);
 }
 return emval_handle_array[handle].value;
}

var registeredTypes = {};

function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}

function requireRegisteredType(rawType, humanName) {
 var impl = registeredTypes[rawType];
 if (undefined === impl) {
  throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
 }
 return impl;
}

function unregisterInheritedInstance(class_, ptr) {
 ptr = getBasestPointer(class_, ptr);
 if (registeredInstances.hasOwnProperty(ptr)) {
  delete registeredInstances[ptr];
 } else {
  throwBindingError("Tried to unregister unregistered instance: " + ptr);
 }
}

function detachFinalizer(handle) {}

var finalizationGroup = false;

function runDestructor($$) {
 if ($$.smartPtr) {
  $$.smartPtrType.rawDestructor($$.smartPtr);
 } else {
  $$.ptrType.registeredClass.rawDestructor($$.ptr);
 }
}

function releaseClassHandle($$) {
 $$.count.value -= 1;
 var toDelete = 0 === $$.count.value;
 if (toDelete) {
  runDestructor($$);
 }
}

function attachFinalizer(handle) {
 if ("undefined" === typeof FinalizationGroup) {
  attachFinalizer = function(handle) {
   return handle;
  };
  return handle;
 }
 finalizationGroup = new FinalizationGroup(function(iter) {
  for (var result = iter.next(); !result.done; result = iter.next()) {
   var $$ = result.value;
   if (!$$.ptr) {
    console.warn("object already deleted: " + $$.ptr);
   } else {
    releaseClassHandle($$);
   }
  }
 });
 attachFinalizer = function(handle) {
  finalizationGroup.register(handle, handle.$$, handle.$$);
  return handle;
 };
 detachFinalizer = function(handle) {
  finalizationGroup.unregister(handle.$$);
 };
 return attachFinalizer(handle);
}

function __embind_create_inheriting_constructor(constructorName, wrapperType, properties) {
 constructorName = readLatin1String(constructorName);
 wrapperType = requireRegisteredType(wrapperType, "wrapper");
 properties = requireHandle(properties);
 var arraySlice = [].slice;
 var registeredClass = wrapperType.registeredClass;
 var wrapperPrototype = registeredClass.instancePrototype;
 var baseClass = registeredClass.baseClass;
 var baseClassPrototype = baseClass.instancePrototype;
 var baseConstructor = registeredClass.baseClass.constructor;
 var ctor = createNamedFunction(constructorName, function() {
  registeredClass.baseClass.pureVirtualFunctions.forEach(function(name) {
   if (this[name] === baseClassPrototype[name]) {
    throw new PureVirtualError("Pure virtual function " + name + " must be implemented in JavaScript");
   }
  }.bind(this));
  Object.defineProperty(this, "__parent", {
   value: wrapperPrototype
  });
  this["__construct"].apply(this, arraySlice.call(arguments));
 });
 wrapperPrototype["__construct"] = function __construct() {
  if (this === wrapperPrototype) {
   throwBindingError("Pass correct 'this' to __construct");
  }
  var inner = baseConstructor["implement"].apply(undefined, [ this ].concat(arraySlice.call(arguments)));
  detachFinalizer(inner);
  var $$ = inner.$$;
  inner["notifyOnDestruction"]();
  $$.preservePointerOnDelete = true;
  Object.defineProperties(this, {
   $$: {
    value: $$
   }
  });
  attachFinalizer(this);
  registerInheritedInstance(registeredClass, $$.ptr, this);
 };
 wrapperPrototype["__destruct"] = function __destruct() {
  if (this === wrapperPrototype) {
   throwBindingError("Pass correct 'this' to __destruct");
  }
  detachFinalizer(this);
  unregisterInheritedInstance(registeredClass, this.$$.ptr);
 };
 ctor.prototype = Object.create(wrapperPrototype);
 for (var p in properties) {
  ctor.prototype[p] = properties[p];
 }
 return __emval_register(ctor);
}

var structRegistrations = {};

function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}

function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](HEAPU32[pointer >> 2]);
}

var awaitingDependencies = {};

var typeDependencies = {};

var InternalError = undefined;

function throwInternalError(message) {
 throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach(function(type) {
  typeDependencies[type] = dependentTypes;
 });
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach(function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push(function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   });
  }
 });
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}

function __embind_finalize_value_object(structType) {
 var reg = structRegistrations[structType];
 delete structRegistrations[structType];
 var rawConstructor = reg.rawConstructor;
 var rawDestructor = reg.rawDestructor;
 var fieldRecords = reg.fields;
 var fieldTypes = fieldRecords.map(function(field) {
  return field.getterReturnType;
 }).concat(fieldRecords.map(function(field) {
  return field.setterArgumentType;
 }));
 whenDependentTypesAreResolved([ structType ], fieldTypes, function(fieldTypes) {
  var fields = {};
  fieldRecords.forEach(function(field, i) {
   var fieldName = field.fieldName;
   var getterReturnType = fieldTypes[i];
   var getter = field.getter;
   var getterContext = field.getterContext;
   var setterArgumentType = fieldTypes[i + fieldRecords.length];
   var setter = field.setter;
   var setterContext = field.setterContext;
   fields[fieldName] = {
    read: function(ptr) {
     return getterReturnType["fromWireType"](getter(getterContext, ptr));
    },
    write: function(ptr, o) {
     var destructors = [];
     setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
     runDestructors(destructors);
    }
   };
  });
  return [ {
   name: reg.name,
   "fromWireType": function(ptr) {
    var rv = {};
    for (var i in fields) {
     rv[i] = fields[i].read(ptr);
    }
    rawDestructor(ptr);
    return rv;
   },
   "toWireType": function(destructors, o) {
    for (var fieldName in fields) {
     if (!(fieldName in o)) {
      throw new TypeError('Missing field:  "' + fieldName + '"');
     }
    }
    var ptr = rawConstructor();
    for (fieldName in fields) {
     fields[fieldName].write(ptr, o[fieldName]);
    }
    if (destructors !== null) {
     destructors.push(rawDestructor, ptr);
    }
    return ptr;
   },
   "argPackAdvance": 8,
   "readValueFromPointer": simpleReadValueFromPointer,
   destructorFunction: rawDestructor
  } ];
 });
}

function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;

 case 2:
  return 1;

 case 4:
  return 2;

 case 8:
  return 3;

 default:
  throw new TypeError("Unknown type size: " + size);
 }
}

function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach(function(cb) {
   cb();
  });
 }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(wt) {
   return !!wt;
  },
  "toWireType": function(destructors, o) {
   return o ? trueValue : falseValue;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  },
  destructorFunction: null
 });
}

function ClassHandle_isAliasOf(other) {
 if (!(this instanceof ClassHandle)) {
  return false;
 }
 if (!(other instanceof ClassHandle)) {
  return false;
 }
 var leftClass = this.$$.ptrType.registeredClass;
 var left = this.$$.ptr;
 var rightClass = other.$$.ptrType.registeredClass;
 var right = other.$$.ptr;
 while (leftClass.baseClass) {
  left = leftClass.upcast(left);
  leftClass = leftClass.baseClass;
 }
 while (rightClass.baseClass) {
  right = rightClass.upcast(right);
  rightClass = rightClass.baseClass;
 }
 return leftClass === rightClass && left === right;
}

function shallowCopyInternalPointer(o) {
 return {
  count: o.count,
  deleteScheduled: o.deleteScheduled,
  preservePointerOnDelete: o.preservePointerOnDelete,
  ptr: o.ptr,
  ptrType: o.ptrType,
  smartPtr: o.smartPtr,
  smartPtrType: o.smartPtrType
 };
}

function throwInstanceAlreadyDeleted(obj) {
 function getInstanceTypeName(handle) {
  return handle.$$.ptrType.registeredClass.name;
 }
 throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}

function ClassHandle_clone() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.preservePointerOnDelete) {
  this.$$.count.value += 1;
  return this;
 } else {
  var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
   $$: {
    value: shallowCopyInternalPointer(this.$$)
   }
  }));
  clone.$$.count.value += 1;
  clone.$$.deleteScheduled = false;
  return clone;
 }
}

function ClassHandle_delete() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 detachFinalizer(this);
 releaseClassHandle(this.$$);
 if (!this.$$.preservePointerOnDelete) {
  this.$$.smartPtr = undefined;
  this.$$.ptr = undefined;
 }
}

function ClassHandle_isDeleted() {
 return !this.$$.ptr;
}

function ClassHandle_deleteLater() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 deletionQueue.push(this);
 if (deletionQueue.length === 1 && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
 this.$$.deleteScheduled = true;
 return this;
}

function init_ClassHandle() {
 ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
 ClassHandle.prototype["clone"] = ClassHandle_clone;
 ClassHandle.prototype["delete"] = ClassHandle_delete;
 ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
 ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}

function ClassHandle() {}

var registeredPointers = {};

function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  };
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}

function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}

function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
 this.name = name;
 this.constructor = constructor;
 this.instancePrototype = instancePrototype;
 this.rawDestructor = rawDestructor;
 this.baseClass = baseClass;
 this.getActualType = getActualType;
 this.upcast = upcast;
 this.downcast = downcast;
 this.pureVirtualFunctions = [];
}

function upcastPointer(ptr, ptrClass, desiredClass) {
 while (ptrClass !== desiredClass) {
  if (!ptrClass.upcast) {
   throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
  }
  ptr = ptrClass.upcast(ptr);
  ptrClass = ptrClass.baseClass;
 }
 return ptr;
}

function constNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}

function genericPointerToWireType(destructors, handle) {
 var ptr;
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  if (this.isSmartPointer) {
   ptr = this.rawConstructor();
   if (destructors !== null) {
    destructors.push(this.rawDestructor, ptr);
   }
   return ptr;
  } else {
   return 0;
  }
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (!this.isConst && handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 if (this.isSmartPointer) {
  if (undefined === handle.$$.smartPtr) {
   throwBindingError("Passing raw pointer to smart pointer is illegal");
  }
  switch (this.sharingPolicy) {
  case 0:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
   }
   break;

  case 1:
   ptr = handle.$$.smartPtr;
   break;

  case 2:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    var clonedHandle = handle["clone"]();
    ptr = this.rawShare(ptr, __emval_register(function() {
     clonedHandle["delete"]();
    }));
    if (destructors !== null) {
     destructors.push(this.rawDestructor, ptr);
    }
   }
   break;

  default:
   throwBindingError("Unsupporting sharing policy");
  }
 }
 return ptr;
}

function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}

function RegisteredPointer_getPointee(ptr) {
 if (this.rawGetPointee) {
  ptr = this.rawGetPointee(ptr);
 }
 return ptr;
}

function RegisteredPointer_destructor(ptr) {
 if (this.rawDestructor) {
  this.rawDestructor(ptr);
 }
}

function RegisteredPointer_deleteObject(handle) {
 if (handle !== null) {
  handle["delete"]();
 }
}

function downcastPointer(ptr, ptrClass, desiredClass) {
 if (ptrClass === desiredClass) {
  return ptr;
 }
 if (undefined === desiredClass.baseClass) {
  return null;
 }
 var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
 if (rv === null) {
  return null;
 }
 return desiredClass.downcast(rv);
}

function getInheritedInstance(class_, ptr) {
 ptr = getBasestPointer(class_, ptr);
 return registeredInstances[ptr];
}

function makeClassHandle(prototype, record) {
 if (!record.ptrType || !record.ptr) {
  throwInternalError("makeClassHandle requires ptr and ptrType");
 }
 var hasSmartPtrType = !!record.smartPtrType;
 var hasSmartPtr = !!record.smartPtr;
 if (hasSmartPtrType !== hasSmartPtr) {
  throwInternalError("Both smartPtrType and smartPtr must be specified");
 }
 record.count = {
  value: 1
 };
 return attachFinalizer(Object.create(prototype, {
  $$: {
   value: record
  }
 }));
}

function RegisteredPointer_fromWireType(ptr) {
 var rawPointer = this.getPointee(ptr);
 if (!rawPointer) {
  this.destructor(ptr);
  return null;
 }
 var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
 if (undefined !== registeredInstance) {
  if (0 === registeredInstance.$$.count.value) {
   registeredInstance.$$.ptr = rawPointer;
   registeredInstance.$$.smartPtr = ptr;
   return registeredInstance["clone"]();
  } else {
   var rv = registeredInstance["clone"]();
   this.destructor(ptr);
   return rv;
  }
 }
 function makeDefaultHandle() {
  if (this.isSmartPointer) {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this.pointeeType,
    ptr: rawPointer,
    smartPtrType: this,
    smartPtr: ptr
   });
  } else {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this,
    ptr: ptr
   });
  }
 }
 var actualType = this.registeredClass.getActualType(rawPointer);
 var registeredPointerRecord = registeredPointers[actualType];
 if (!registeredPointerRecord) {
  return makeDefaultHandle.call(this);
 }
 var toType;
 if (this.isConst) {
  toType = registeredPointerRecord.constPointerType;
 } else {
  toType = registeredPointerRecord.pointerType;
 }
 var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
 if (dp === null) {
  return makeDefaultHandle.call(this);
 }
 if (this.isSmartPointer) {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp,
   smartPtrType: this,
   smartPtr: ptr
  });
 } else {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp
  });
 }
}

function init_RegisteredPointer() {
 RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
 RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
 RegisteredPointer.prototype["argPackAdvance"] = 8;
 RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
 RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
 RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}

function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
 this.name = name;
 this.registeredClass = registeredClass;
 this.isReference = isReference;
 this.isConst = isConst;
 this.isSmartPointer = isSmartPointer;
 this.pointeeType = pointeeType;
 this.sharingPolicy = sharingPolicy;
 this.rawGetPointee = rawGetPointee;
 this.rawConstructor = rawConstructor;
 this.rawShare = rawShare;
 this.rawDestructor = rawDestructor;
 if (!isSmartPointer && registeredClass.baseClass === undefined) {
  if (isConst) {
   this["toWireType"] = constNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  } else {
   this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  }
 } else {
  this["toWireType"] = genericPointerToWireType;
 }
}

function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  Module[name].argCount = numArguments;
 }
}

function embind__requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller(dynCall) {
  var args = [];
  for (var i = 1; i < signature.length; ++i) {
   args.push("a" + i);
  }
  var name = "dynCall_" + signature + "_" + rawFunction;
  var body = "return function " + name + "(" + args.join(", ") + ") {\n";
  body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
  body += "};\n";
  return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction);
 }
 var dc = Module["dynCall_" + signature];
 var fp = makeDynCaller(dc);
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}

var UnboundTypeError = undefined;

function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}

function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
 name = readLatin1String(name);
 getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
 if (upcast) {
  upcast = embind__requireFunction(upcastSignature, upcast);
 }
 if (downcast) {
  downcast = embind__requireFunction(downcastSignature, downcast);
 }
 rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
 var legalFunctionName = makeLegalFunctionName(name);
 exposePublicSymbol(legalFunctionName, function() {
  throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [ baseClassRawType ]);
 });
 whenDependentTypesAreResolved([ rawType, rawPointerType, rawConstPointerType ], baseClassRawType ? [ baseClassRawType ] : [], function(base) {
  base = base[0];
  var baseClass;
  var basePrototype;
  if (baseClassRawType) {
   baseClass = base.registeredClass;
   basePrototype = baseClass.instancePrototype;
  } else {
   basePrototype = ClassHandle.prototype;
  }
  var constructor = createNamedFunction(legalFunctionName, function() {
   if (Object.getPrototypeOf(this) !== instancePrototype) {
    throw new BindingError("Use 'new' to construct " + name);
   }
   if (undefined === registeredClass.constructor_body) {
    throw new BindingError(name + " has no accessible constructor");
   }
   var body = registeredClass.constructor_body[arguments.length];
   if (undefined === body) {
    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
   }
   return body.apply(this, arguments);
  });
  var instancePrototype = Object.create(basePrototype, {
   constructor: {
    value: constructor
   }
  });
  constructor.prototype = instancePrototype;
  var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
  var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
  var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
  var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
  registeredPointers[rawType] = {
   pointerType: pointerConverter,
   constPointerType: constPointerConverter
  };
  replacePublicSymbol(legalFunctionName, constructor);
  return [ referenceConverter, pointerConverter, constPointerConverter ];
 });
}

function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function() {});
 dummy.prototype = constructor.prototype;
 var obj = new dummy();
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 var returns = argTypes[0].name !== "void";
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}

function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(HEAP32[(firstElement >> 2) + i]);
 }
 return array;
}

function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.constructor;
  if (undefined === proto[methodName]) {
   unboundTypesHandler.argCount = argCount - 1;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
   var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
   var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
   if (undefined === proto[methodName].overloadTable) {
    func.argCount = argCount - 1;
    proto[methodName] = func;
   } else {
    proto[methodName].overloadTable[argCount - 1] = func;
   }
   return [];
  });
  return [];
 });
}

function validateThis(this_, classType, humanName) {
 if (!(this_ instanceof Object)) {
  throwBindingError(humanName + ' with invalid "this": ' + this_);
 }
 if (!(this_ instanceof classType.registeredClass.constructor)) {
  throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
 }
 if (!this_.$$.ptr) {
  throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object");
 }
 return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass);
}

function __embind_register_class_class_property(rawClassType, fieldName, rawFieldType, rawFieldPtr, getterSignature, getter, setterSignature, setter) {
 fieldName = readLatin1String(fieldName);
 getter = embind__requireFunction(getterSignature, getter);
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + fieldName;
  var desc = {
   get: function() {
    throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [ rawFieldType ]);
   },
   enumerable: true,
   configurable: true
  };
  if (setter) {
   desc.set = function() {
    throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [ rawFieldType ]);
   };
  } else {
   desc.set = function(v) {
    throwBindingError(humanName + " is a read-only property");
   };
  }
  Object.defineProperty(classType.registeredClass.constructor, fieldName, desc);
  whenDependentTypesAreResolved([], [ rawFieldType ], function(fieldType) {
   fieldType = fieldType[0];
   var desc = {
    get: function() {
     return fieldType["fromWireType"](getter(rawFieldPtr));
    },
    enumerable: true
   };
   if (setter) {
    setter = embind__requireFunction(setterSignature, setter);
    desc.set = function(v) {
     var destructors = [];
     setter(rawFieldPtr, fieldType["toWireType"](destructors, v));
     runDestructors(destructors);
    };
   }
   Object.defineProperty(classType.registeredClass.constructor, fieldName, desc);
   return [];
  });
  return [];
 });
}

function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
 assert(argCount > 0);
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 invoker = embind__requireFunction(invokerSignature, invoker);
 var args = [ rawConstructor ];
 var destructors = [];
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = "constructor " + classType.name;
  if (undefined === classType.registeredClass.constructor_body) {
   classType.registeredClass.constructor_body = [];
  }
  if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
   throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
  }
  classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
   throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
  };
  whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
   classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
    if (arguments.length !== argCount - 1) {
     throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1));
    }
    destructors.length = 0;
    args.length = argCount;
    for (var i = 1; i < argCount; ++i) {
     args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1]);
    }
    var ptr = invoker.apply(null, args);
    runDestructors(destructors);
    return argTypes[0]["fromWireType"](ptr);
   };
   return [];
  });
  return [];
 });
}

function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  if (isPureVirtual) {
   classType.registeredClass.pureVirtualFunctions.push(methodName);
  }
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.instancePrototype;
  var method = proto[methodName];
  if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
   unboundTypesHandler.argCount = argCount - 2;
   unboundTypesHandler.className = classType.name;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
   var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
   if (undefined === proto[methodName].overloadTable) {
    memberFunction.argCount = argCount - 2;
    proto[methodName] = memberFunction;
   } else {
    proto[methodName].overloadTable[argCount - 2] = memberFunction;
   }
   return [];
  });
  return [];
 });
}

function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
 fieldName = readLatin1String(fieldName);
 getter = embind__requireFunction(getterSignature, getter);
 whenDependentTypesAreResolved([], [ classType ], function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + fieldName;
  var desc = {
   get: function() {
    throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [ getterReturnType, setterArgumentType ]);
   },
   enumerable: true,
   configurable: true
  };
  if (setter) {
   desc.set = function() {
    throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [ getterReturnType, setterArgumentType ]);
   };
  } else {
   desc.set = function(v) {
    throwBindingError(humanName + " is a read-only property");
   };
  }
  Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
  whenDependentTypesAreResolved([], setter ? [ getterReturnType, setterArgumentType ] : [ getterReturnType ], function(types) {
   var getterReturnType = types[0];
   var desc = {
    get: function() {
     var ptr = validateThis(this, classType, humanName + " getter");
     return getterReturnType["fromWireType"](getter(getterContext, ptr));
    },
    enumerable: true
   };
   if (setter) {
    setter = embind__requireFunction(setterSignature, setter);
    var setterArgumentType = types[1];
    desc.set = function(v) {
     var ptr = validateThis(this, classType, humanName + " setter");
     var destructors = [];
     setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, v));
     runDestructors(destructors);
    };
   }
   Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
   return [];
  });
  return [];
 });
}

function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}

function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  },
  "toWireType": function(destructors, value) {
   return __emval_register(value);
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}

function enumReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return function(pointer) {
   var heap = signed ? HEAP8 : HEAPU8;
   return this["fromWireType"](heap[pointer]);
  };

 case 1:
  return function(pointer) {
   var heap = signed ? HEAP16 : HEAPU16;
   return this["fromWireType"](heap[pointer >> 1]);
  };

 case 2:
  return function(pointer) {
   var heap = signed ? HEAP32 : HEAPU32;
   return this["fromWireType"](heap[pointer >> 2]);
  };

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function __embind_register_enum(rawType, name, size, isSigned) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 function ctor() {}
 ctor.values = {};
 registerType(rawType, {
  name: name,
  constructor: ctor,
  "fromWireType": function(c) {
   return this.constructor.values[c];
  },
  "toWireType": function(destructors, c) {
   return c.value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": enumReadValueFromPointer(name, shift, isSigned),
  destructorFunction: null
 });
 exposePublicSymbol(name, ctor);
}

function __embind_register_enum_value(rawEnumType, name, enumValue) {
 var enumType = requireRegisteredType(rawEnumType, "enum");
 name = readLatin1String(name);
 var Enum = enumType.constructor;
 var Value = Object.create(enumType.constructor.prototype, {
  value: {
   value: enumValue
  },
  constructor: {
   value: createNamedFunction(enumType.name + "_" + name, function() {})
  }
 });
 Enum.values[enumValue] = Value;
 Enum[name] = Value;
}

function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}

function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return function(pointer) {
   return this["fromWireType"](HEAPF32[pointer >> 2]);
  };

 case 3:
  return function(pointer) {
   return this["fromWireType"](HEAPF64[pointer >> 3]);
  };

 default:
  throw new TypeError("Unknown float type: " + name);
 }
}

function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   return value;
  },
  "toWireType": function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}

function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
 var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 name = readLatin1String(name);
 rawInvoker = embind__requireFunction(signature, rawInvoker);
 exposePublicSymbol(name, function() {
  throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
 }, argCount - 1);
 whenDependentTypesAreResolved([], argTypes, function(argTypes) {
  var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
  replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
  return [];
 });
}

function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return HEAP8[pointer];
  } : function readU8FromPointer(pointer) {
   return HEAPU8[pointer];
  };

 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return HEAP16[pointer >> 1];
  } : function readU16FromPointer(pointer) {
   return HEAPU16[pointer >> 1];
  };

 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return HEAP32[pointer >> 2];
  } : function readU32FromPointer(pointer) {
   return HEAPU32[pointer >> 2];
  };

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = function(value) {
  return value;
 };
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = function(value) {
   return value << bitshift >>> bitshift;
  };
 }
 var isUnsignedType = name.indexOf("unsigned") != -1;
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return isUnsignedType ? value >>> 0 : value | 0;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(buffer, data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}

function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 var stdStringIsUTF8 = name === "std::string";
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = HEAPU32[value >> 2];
   var str;
   if (stdStringIsUTF8) {
    var decodeStartPtr = value + 4;
    for (var i = 0; i <= length; ++i) {
     var currentBytePtr = value + 4 + i;
     if (i == length || HEAPU8[currentBytePtr] == 0) {
      var maxRead = currentBytePtr - decodeStartPtr;
      var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
      if (str === undefined) {
       str = stringSegment;
      } else {
       str += String.fromCharCode(0);
       str += stringSegment;
      }
      decodeStartPtr = currentBytePtr + 1;
     }
    }
   } else {
    var a = new Array(length);
    for (var i = 0; i < length; ++i) {
     a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
    }
    str = a.join("");
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   var getLength;
   var valueIsOfTypeString = typeof value === "string";
   if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
    throwBindingError("Cannot pass non-string to std::string");
   }
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    getLength = function() {
     return lengthBytesUTF8(value);
    };
   } else {
    getLength = function() {
     return value.length;
    };
   }
   var length = getLength();
   var ptr = _malloc(4 + length + 1);
   HEAPU32[ptr >> 2] = length;
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    stringToUTF8(value, ptr + 4, length + 1);
   } else {
    if (valueIsOfTypeString) {
     for (var i = 0; i < length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode > 255) {
       _free(ptr);
       throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
      }
      HEAPU8[ptr + 4 + i] = charCode;
     }
    } else {
     for (var i = 0; i < length; ++i) {
      HEAPU8[ptr + 4 + i] = value[i];
     }
    }
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
 if (charSize === 2) {
  decodeString = UTF16ToString;
  encodeString = stringToUTF16;
  lengthBytesUTF = lengthBytesUTF16;
  getHeap = function() {
   return HEAPU16;
  };
  shift = 1;
 } else if (charSize === 4) {
  decodeString = UTF32ToString;
  encodeString = stringToUTF32;
  lengthBytesUTF = lengthBytesUTF32;
  getHeap = function() {
   return HEAPU32;
  };
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = HEAPU32[value >> 2];
   var HEAP = getHeap();
   var str;
   var decodeStartPtr = value + 4;
   for (var i = 0; i <= length; ++i) {
    var currentBytePtr = value + 4 + i * charSize;
    if (i == length || HEAP[currentBytePtr >> shift] == 0) {
     var maxReadBytes = currentBytePtr - decodeStartPtr;
     var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
     if (str === undefined) {
      str = stringSegment;
     } else {
      str += String.fromCharCode(0);
      str += stringSegment;
     }
     decodeStartPtr = currentBytePtr + charSize;
    }
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (!(typeof value === "string")) {
    throwBindingError("Cannot pass non-string to C++ string type " + name);
   }
   var length = lengthBytesUTF(value);
   var ptr = _malloc(4 + length + charSize);
   HEAPU32[ptr >> 2] = length >> shift;
   encodeString(value, ptr + 4, length + charSize);
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
 structRegistrations[rawType] = {
  name: readLatin1String(name),
  rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
  rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
  fields: []
 };
}

function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
 structRegistrations[structType].fields.push({
  fieldName: readLatin1String(fieldName),
  getterReturnType: getterReturnType,
  getter: embind__requireFunction(getterSignature, getter),
  getterContext: getterContext,
  setterArgumentType: setterArgumentType,
  setter: embind__requireFunction(setterSignature, setter),
  setterContext: setterContext
 });
}

function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": function() {
   return undefined;
  },
  "toWireType": function(destructors, o) {
   return undefined;
  }
 });
}

function __emval_as(handle, returnType, destructorsRef) {
 handle = requireHandle(handle);
 returnType = requireRegisteredType(returnType, "emval::as");
 var destructors = [];
 var rd = __emval_register(destructors);
 HEAP32[destructorsRef >> 2] = rd;
 return returnType["toWireType"](destructors, handle);
}

function __emval_allocateDestructors(destructorsRef) {
 var destructors = [];
 HEAP32[destructorsRef >> 2] = __emval_register(destructors);
 return destructors;
}

var emval_symbols = {};

function getStringOrSymbol(address) {
 var symbol = emval_symbols[address];
 if (symbol === undefined) {
  return readLatin1String(address);
 } else {
  return symbol;
 }
}

var emval_methodCallers = [];

function __emval_call_method(caller, handle, methodName, destructorsRef, args) {
 caller = emval_methodCallers[caller];
 handle = requireHandle(handle);
 methodName = getStringOrSymbol(methodName);
 return caller(handle, methodName, __emval_allocateDestructors(destructorsRef), args);
}

function __emval_call_void_method(caller, handle, methodName, args) {
 caller = emval_methodCallers[caller];
 handle = requireHandle(handle);
 methodName = getStringOrSymbol(methodName);
 caller(handle, methodName, null, args);
}

function __emval_addMethodCaller(caller) {
 var id = emval_methodCallers.length;
 emval_methodCallers.push(caller);
 return id;
}

function __emval_lookupTypes(argCount, argTypes) {
 var a = new Array(argCount);
 for (var i = 0; i < argCount; ++i) {
  a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i);
 }
 return a;
}

function __emval_get_method_caller(argCount, argTypes) {
 var types = __emval_lookupTypes(argCount, argTypes);
 var retType = types[0];
 var signatureName = retType.name + "_$" + types.slice(1).map(function(t) {
  return t.name;
 }).join("_") + "$";
 var params = [ "retType" ];
 var args = [ retType ];
 var argsList = "";
 for (var i = 0; i < argCount - 1; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  params.push("argType" + i);
  args.push(types[1 + i]);
 }
 var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
 var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
 var offset = 0;
 for (var i = 0; i < argCount - 1; ++i) {
  functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
  offset += types[i + 1]["argPackAdvance"];
 }
 functionBody += "    var rv = handle[name](" + argsList + ");\n";
 for (var i = 0; i < argCount - 1; ++i) {
  if (types[i + 1]["deleteObject"]) {
   functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n";
  }
 }
 if (!retType.isVoid) {
  functionBody += "    return retType.toWireType(destructors, rv);\n";
 }
 functionBody += "};\n";
 params.push(functionBody);
 var invokerFunction = new_(Function, params).apply(null, args);
 return __emval_addMethodCaller(invokerFunction);
}

function __emval_get_module_property(name) {
 name = getStringOrSymbol(name);
 return __emval_register(Module[name]);
}

function __emval_get_property(handle, key) {
 handle = requireHandle(handle);
 key = requireHandle(key);
 return __emval_register(handle[key]);
}

function __emval_incref(handle) {
 if (handle > 4) {
  emval_handle_array[handle].refcount += 1;
 }
}

function __emval_new_cstring(v) {
 return __emval_register(getStringOrSymbol(v));
}

function __emval_run_destructors(handle) {
 var destructors = emval_handle_array[handle].value;
 runDestructors(destructors);
 __emval_decref(handle);
}

function __emval_take_value(type, argv) {
 type = requireRegisteredType(type, "_emval_take_value");
 var v = type["readValueFromPointer"](argv);
 return __emval_register(v);
}

function _abort() {
 abort();
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function _emscripten_get_heap_size() {
 return HEAPU8.length;
}

function emscripten_realloc_buffer(size) {
 try {
  wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
  updateGlobalBufferAndViews(wasmMemory.buffer);
  return 1;
 } catch (e) {}
}

function _emscripten_resize_heap(requestedSize) {
 requestedSize = requestedSize >>> 0;
 var oldSize = _emscripten_get_heap_size();
 var PAGE_MULTIPLE = 65536;
 var maxHeapSize = 2147483648;
 if (requestedSize > maxHeapSize) {
  return false;
 }
 var minHeapSize = 16777216;
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
  var replacement = emscripten_realloc_buffer(newSize);
  if (replacement) {
   return true;
  }
 }
 return false;
}

var PATH = {
 splitPath: function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 },
 normalizeArray: function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (;up; up--) {
    parts.unshift("..");
   }
  }
  return parts;
 },
 normalize: function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(function(p) {
   return !!p;
  }), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 },
 dirname: function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 },
 basename: function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 },
 extname: function(path) {
  return PATH.splitPath(path)[3];
 },
 join: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 },
 join2: function(l, r) {
  return PATH.normalize(l + "/" + r);
 }
};

var SYSCALLS = {
 mappings: {},
 buffers: [ null, [], [] ],
 printChar: function(stream, curr) {
  var buffer = SYSCALLS.buffers[stream];
  if (curr === 0 || curr === 10) {
   (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
   buffer.length = 0;
  } else {
   buffer.push(curr);
  }
 },
 varargs: undefined,
 get: function() {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 },
 get64: function(low, high) {
  return low;
 }
};

function _fd_close(fd) {
 return 0;
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {}

function _fd_write(fd, iov, iovcnt, pnum) {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = HEAP32[iov + i * 8 >> 2];
  var len = HEAP32[iov + (i * 8 + 4) >> 2];
  for (var j = 0; j < len; j++) {
   SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
  }
  num += len;
 }
 HEAP32[pnum >> 2] = num;
 return 0;
}

init_emval();

PureVirtualError = Module["PureVirtualError"] = extendError(Error, "PureVirtualError");

embind_init_charCodes();

init_embind();

BindingError = Module["BindingError"] = extendError(Error, "BindingError");

InternalError = Module["InternalError"] = extendError(Error, "InternalError");

init_ClassHandle();

init_RegisteredPointer();

UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");

var ASSERTIONS = false;

function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   if (ASSERTIONS) {
    assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
   }
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}

var decodeBase64 = typeof atob === "function" ? atob : function(input) {
 var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var output = "";
 var chr1, chr2, chr3;
 var enc1, enc2, enc3, enc4;
 var i = 0;
 input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 do {
  enc1 = keyStr.indexOf(input.charAt(i++));
  enc2 = keyStr.indexOf(input.charAt(i++));
  enc3 = keyStr.indexOf(input.charAt(i++));
  enc4 = keyStr.indexOf(input.charAt(i++));
  chr1 = enc1 << 2 | enc2 >> 4;
  chr2 = (enc2 & 15) << 4 | enc3 >> 2;
  chr3 = (enc3 & 3) << 6 | enc4;
  output = output + String.fromCharCode(chr1);
  if (enc3 !== 64) {
   output = output + String.fromCharCode(chr2);
  }
  if (enc4 !== 64) {
   output = output + String.fromCharCode(chr3);
  }
 } while (i < input.length);
 return output;
};

function intArrayFromBase64(s) {
 if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
  var buf;
  try {
   buf = Buffer.from(s, "base64");
  } catch (_) {
   buf = new Buffer(s, "base64");
  }
  return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
 }
 try {
  var decoded = decodeBase64(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0; i < decoded.length; ++i) {
   bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
 } catch (_) {
  throw new Error("Converting base64 string to bytes failed.");
 }
}

function tryParseAsDataURI(filename) {
 if (!isDataURI(filename)) {
  return;
 }
 return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}

var asmLibraryArg = {
 "n": __embind_create_inheriting_constructor,
 "I": __embind_finalize_value_object,
 "A": __embind_register_bool,
 "e": __embind_register_class,
 "i": __embind_register_class_class_function,
 "g": __embind_register_class_class_property,
 "C": __embind_register_class_constructor,
 "a": __embind_register_class_function,
 "b": __embind_register_class_property,
 "z": __embind_register_emval,
 "k": __embind_register_enum,
 "j": __embind_register_enum_value,
 "p": __embind_register_float,
 "L": __embind_register_function,
 "h": __embind_register_integer,
 "f": __embind_register_memory_view,
 "q": __embind_register_std_string,
 "m": __embind_register_std_wstring,
 "K": __embind_register_value_object,
 "J": __embind_register_value_object_field,
 "B": __embind_register_void,
 "l": __emval_as,
 "H": __emval_call_method,
 "d": __emval_call_void_method,
 "E": __emval_decref,
 "c": __emval_get_method_caller,
 "M": __emval_get_module_property,
 "t": __emval_get_property,
 "D": __emval_incref,
 "F": __emval_new_cstring,
 "G": __emval_run_destructors,
 "s": __emval_take_value,
 "r": _abort,
 "w": _emscripten_memcpy_big,
 "x": _emscripten_resize_heap,
 "y": _fd_close,
 "u": _fd_seek,
 "o": _fd_write,
 "memory": wasmMemory,
 "v": setTempRet0,
 "table": wasmTable
};

var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
 return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["N"]).apply(null, arguments);
};

var _malloc = Module["_malloc"] = function() {
 return (_malloc = Module["_malloc"] = Module["asm"]["O"]).apply(null, arguments);
};

var ___getTypeName = Module["___getTypeName"] = function() {
 return (___getTypeName = Module["___getTypeName"] = Module["asm"]["P"]).apply(null, arguments);
};

var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function() {
 return (___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = Module["asm"]["Q"]).apply(null, arguments);
};

var _free = Module["_free"] = function() {
 return (_free = Module["_free"] = Module["asm"]["R"]).apply(null, arguments);
};

var dynCall_ii = Module["dynCall_ii"] = function() {
 return (dynCall_ii = Module["dynCall_ii"] = Module["asm"]["S"]).apply(null, arguments);
};

var dynCall_vi = Module["dynCall_vi"] = function() {
 return (dynCall_vi = Module["dynCall_vi"] = Module["asm"]["T"]).apply(null, arguments);
};

var dynCall_iii = Module["dynCall_iii"] = function() {
 return (dynCall_iii = Module["dynCall_iii"] = Module["asm"]["U"]).apply(null, arguments);
};

var dynCall_iiii = Module["dynCall_iiii"] = function() {
 return (dynCall_iiii = Module["dynCall_iiii"] = Module["asm"]["V"]).apply(null, arguments);
};

var dynCall_v = Module["dynCall_v"] = function() {
 return (dynCall_v = Module["dynCall_v"] = Module["asm"]["W"]).apply(null, arguments);
};

var dynCall_viiif = Module["dynCall_viiif"] = function() {
 return (dynCall_viiif = Module["dynCall_viiif"] = Module["asm"]["X"]).apply(null, arguments);
};

var dynCall_viiifif = Module["dynCall_viiifif"] = function() {
 return (dynCall_viiifif = Module["dynCall_viiifif"] = Module["asm"]["Y"]).apply(null, arguments);
};

var dynCall_vii = Module["dynCall_vii"] = function() {
 return (dynCall_vii = Module["dynCall_vii"] = Module["asm"]["Z"]).apply(null, arguments);
};

var dynCall_fi = Module["dynCall_fi"] = function() {
 return (dynCall_fi = Module["dynCall_fi"] = Module["asm"]["_"]).apply(null, arguments);
};

var dynCall_viii = Module["dynCall_viii"] = function() {
 return (dynCall_viii = Module["dynCall_viii"] = Module["asm"]["$"]).apply(null, arguments);
};

var dynCall_viff = Module["dynCall_viff"] = function() {
 return (dynCall_viff = Module["dynCall_viff"] = Module["asm"]["aa"]).apply(null, arguments);
};

var dynCall_viffffff = Module["dynCall_viffffff"] = function() {
 return (dynCall_viffffff = Module["dynCall_viffffff"] = Module["asm"]["ba"]).apply(null, arguments);
};

var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
 return (dynCall_viiiii = Module["dynCall_viiiii"] = Module["asm"]["ca"]).apply(null, arguments);
};

var dynCall_fii = Module["dynCall_fii"] = function() {
 return (dynCall_fii = Module["dynCall_fii"] = Module["asm"]["da"]).apply(null, arguments);
};

var dynCall_iid = Module["dynCall_iid"] = function() {
 return (dynCall_iid = Module["dynCall_iid"] = Module["asm"]["ea"]).apply(null, arguments);
};

var dynCall_vif = Module["dynCall_vif"] = function() {
 return (dynCall_vif = Module["dynCall_vif"] = Module["asm"]["fa"]).apply(null, arguments);
};

var dynCall_viif = Module["dynCall_viif"] = function() {
 return (dynCall_viif = Module["dynCall_viif"] = Module["asm"]["ga"]).apply(null, arguments);
};

var dynCall_viiff = Module["dynCall_viiff"] = function() {
 return (dynCall_viiff = Module["dynCall_viiff"] = Module["asm"]["ha"]).apply(null, arguments);
};

var dynCall_iif = Module["dynCall_iif"] = function() {
 return (dynCall_iif = Module["dynCall_iif"] = Module["asm"]["ia"]).apply(null, arguments);
};

var dynCall_viiii = Module["dynCall_viiii"] = function() {
 return (dynCall_viiii = Module["dynCall_viiii"] = Module["asm"]["ja"]).apply(null, arguments);
};

var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
 return (dynCall_viiiiii = Module["dynCall_viiiiii"] = Module["asm"]["ka"]).apply(null, arguments);
};

var dynCall_viiffffff = Module["dynCall_viiffffff"] = function() {
 return (dynCall_viiffffff = Module["dynCall_viiffffff"] = Module["asm"]["la"]).apply(null, arguments);
};

var dynCall_viiffff = Module["dynCall_viiffff"] = function() {
 return (dynCall_viiffff = Module["dynCall_viiffff"] = Module["asm"]["ma"]).apply(null, arguments);
};

var dynCall_iiid = Module["dynCall_iiid"] = function() {
 return (dynCall_iiid = Module["dynCall_iiid"] = Module["asm"]["na"]).apply(null, arguments);
};

var dynCall_viiiff = Module["dynCall_viiiff"] = function() {
 return (dynCall_viiiff = Module["dynCall_viiiff"] = Module["asm"]["oa"]).apply(null, arguments);
};

var dynCall_iiif = Module["dynCall_iiif"] = function() {
 return (dynCall_iiif = Module["dynCall_iiif"] = Module["asm"]["pa"]).apply(null, arguments);
};

var dynCall_i = Module["dynCall_i"] = function() {
 return (dynCall_i = Module["dynCall_i"] = Module["asm"]["qa"]).apply(null, arguments);
};

var dynCall_viffff = Module["dynCall_viffff"] = function() {
 return (dynCall_viffff = Module["dynCall_viffff"] = Module["asm"]["ra"]).apply(null, arguments);
};

var dynCall_jiji = Module["dynCall_jiji"] = function() {
 return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["sa"]).apply(null, arguments);
};

var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
 return (dynCall_iidiiii = Module["dynCall_iidiiii"] = Module["asm"]["ta"]).apply(null, arguments);
};

var __growWasmMemory = Module["__growWasmMemory"] = function() {
 return (__growWasmMemory = Module["__growWasmMemory"] = Module["asm"]["ua"]).apply(null, arguments);
};

var calledRun;

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function run(args) {
 args = args || arguments_;
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  readyPromiseResolve(Module);
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

Module["run"] = run;

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

noExitRuntime = true;

run();

function makeMatrix(m2d) {
    const m = new DOMMatrix();
    m.a = m2d.xx;
    m.b = m2d.xy;
    m.c = m2d.yx;
    m.d = m2d.yy;
    m.e = m2d.tx;
    m.f = m2d.ty;
    return m;
}

Module.onRuntimeInitialized = function () {
    const {
        RenderPaintStyle,
        FillRule,
        RenderPath,
        RenderPaint,
        Renderer,
        StrokeCap,
        StrokeJoin,
        BlendMode
    } = Module;

    const {
        fill,
        stroke
    } = RenderPaintStyle;

    const {
        evenOdd,
        nonZero
    } = FillRule;

    var CanvasRenderPath = RenderPath.extend("CanvasRenderPath", {
        __construct: function () {
            this.__parent.__construct.call(this);
            this._path2D = new Path2D();
        },
        reset: function () {
            this._path2D = new Path2D();
        },
        addPath: function (path, m2d) {
            this._path2D.addPath(path._path2D, makeMatrix(m2d));
        },
        fillRule: function(fillRule) {
            this._fillRule = fillRule;
        },
        moveTo: function (x, y) {
            this._path2D.moveTo(x, y);
        },
        lineTo: function (x, y) {
            this._path2D.lineTo(x, y);
        },
        cubicTo: function (ox, oy, ix, iy, x, y) {
            this._path2D.bezierCurveTo(ox, oy, ix, iy, x, y);
        },
        close: function () {
            this._path2D.closePath();
        }
    });

    function _colorStyle(value) {
        return 'rgba(' + ((0x00ff0000 & value) >>>
                16) + ',' + ((0x0000ff00 &
                value) >>> 8) + ',' + ((0x000000ff & value) >>> 0) + ',' +
            (((0xff000000 & value) >>> 24) / 0xFF) + ')'
    }
    var CanvasRenderPaint = RenderPaint.extend("CanvasRenderPaint", {
        color: function (value) {
            this._value = _colorStyle(value);
        },
        thickness: function (value) {
            this._thickness = value;
        },
        join: function (value) {
            switch (value) {
                case StrokeJoin.miter:
                    this._join = 'miter';
                    break;
                case StrokeJoin.round:
                    this._join = 'round';
                    break;
                case StrokeJoin.bevel:
                    this._join = 'bevel';
                    break;
            }
        },
        cap: function (value) {
            switch (value) {
                case StrokeCap.butt:
                    this._cap = 'butt';
                    break;
                case StrokeCap.round:
                    this._cap = 'round';
                    break;
                case StrokeCap.square:
                    this._cap = 'square';
                    break;
            }
        },
        style: function (value) {
            this._style = value;
        },
        blendMode: function (value) {
            switch (value) {
                case BlendMode.srcOver:
                    this._blend = 'source-over';
                    break;
                case BlendMode.screen:
                    this._blend = 'screen';
                    break;
                case BlendMode.overlay:
                    this._blend = 'overlay';
                    break;
                case BlendMode.darken:
                    this._blend = 'darken';
                    break;
                case BlendMode.lighten:
                    this._blend = 'lighten';
                    break;
                case BlendMode.colorDodge:
                    this._blend = 'color-dodge';
                    break;
                case BlendMode.colorBurn:
                    this._blend = 'color-burn';
                    break;
                case BlendMode.hardLight:
                    this._blend = 'hard-light';
                    break;
                case BlendMode.softLight:
                    this._blend = 'soft-light';
                    break;
                case BlendMode.difference:
                    this._blend = 'difference';
                    break;
                case BlendMode.exclusion:
                    this._blend = 'exclusion';
                    break;
                case BlendMode.multiply:
                    this._blend = 'multiply';
                    break;
                case BlendMode.hue:
                    this._blend = 'hue';
                    break;
                case BlendMode.saturation:
                    this._blend = 'saturation';
                    break;
                case BlendMode.color:
                    this._blend = 'color';
                    break;
                case BlendMode.luminosity:
                    this._blend = 'luminosity';
                    break;
            }
        },
        linearGradient: function (sx, sy, ex, ey) {
            this._gradient = {
                sx,
                sy,
                ex,
                ey,
                stops: []
            };
        },
        radialGradient: function (sx, sy, ex, ey) {
            this._gradient = {
                sx,
                sy,
                ex,
                ey,
                stops: [],
                isRadial: true
            };
        },
        addStop: function (color, stop) {
            this._gradient.stops.push({
                color,
                stop
            });
        },

        completeGradient: function () {

        },

        draw: function (ctx, path) {
            let {
                _style,
                _value,
                _gradient,
                _blend
            } = this;

            ctx.globalCompositeOperation = _blend;

            if (_gradient != null) {
                const {
                    sx,
                    sy,
                    ex,
                    ey,
                    stops,
                    isRadial
                } = _gradient;

                if (isRadial) {
                    var dx = ex - sx;
                    var dy = ey - sy;
                    var radius = Math.sqrt(dx * dx + dy * dy);
                    _value = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
                } else {
                    _value = ctx.createLinearGradient(sx, sy, ex, ey);
                }

                for ({
                        stop,
                        color
                    } of stops) {
                    _value.addColorStop(stop, _colorStyle(color));
                }
                this._value = _value;
                this._gradient = null;
            }
            switch (_style) {
                case stroke:
                    ctx.strokeStyle = _value;
                    ctx.lineWidth = this._thickness;
                    ctx.lineCap = this._cap;
                    ctx.lineJoin = this._join;
                    ctx.stroke(path._path2D);
                    break;
                case fill:
                    ctx.fillStyle = _value;
                    ctx.fill(path._path2D, path._fillRule === evenOdd ? 'evenodd' : 'nonzero');
                    break;
            }
        }
    });

    Module.CanvasRenderer = Renderer.extend("Renderer", {
        __construct: function (ctx) {
            this.__parent.__construct.call(this);
            this._ctx = ctx;
        },
        save: function () {
            this._ctx.save();
        },
        restore: function () {
            this._ctx.restore();
        },
        transform: function (matrix) {
            this._ctx.transform(matrix.xx, matrix.xy, matrix.yx, matrix.yy, matrix.tx,
                matrix.ty);
        },
        drawPath: function (path, paint) {
            paint.draw(this._ctx, path);
        },
        clipPath: function (path) {
            this._ctx.clip(path._path2D, path._fillRule === evenOdd ? 'evenodd' : 'nonzero');
        }
    });

    Module.renderFactory = {
        makeRenderPaint: function () {
            return new CanvasRenderPaint();
        },
        makeRenderPath: function () {
            return new CanvasRenderPath();
        }
    };
};


  return Rive.ready
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = Rive;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return Rive; });
    else if (typeof exports === 'object')
      exports["Rive"] = Rive;
    
