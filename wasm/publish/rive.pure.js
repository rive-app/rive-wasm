
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
   if (ret.length >= 773 + 0) {
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
  var sa = 5263232;
  var ta = 0;
  
// EMSCRIPTEN_START_FUNCS
function Qd(a) {
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
              e = p[4922];
              g = a >>> 0 < 11 ? 16 : a + 11 & -8;
              a = g >>> 3 | 0;
              b = e >>> a | 0;
              if (b & 3) {
               c = a + ((b ^ -1) & 1) | 0;
               f = c << 3;
               b = p[f + 19736 >> 2];
               a = b + 8 | 0;
               d = p[b + 8 >> 2];
               f = f + 19728 | 0;
               m : {
                if ((d | 0) == (f | 0)) {
                 n = 19688, o = uv(c) & e, p[n >> 2] = o;
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
              i = p[4924];
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
               b = p[d + 19736 >> 2];
               a = p[b + 8 >> 2];
               d = d + 19728 | 0;
               n : {
                if ((a | 0) == (d | 0)) {
                 e = uv(c) & e;
                 p[4922] = e;
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
                b = (c << 3) + 19728 | 0;
                d = p[4927];
                c = 1 << c;
                o : {
                 if (!(c & e)) {
                  p[4922] = c | e;
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
               p[4927] = h;
               p[4924] = f;
               break a;
              }
              k = p[4923];
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
              b = p[((c | b) + (a >>> b | 0) << 2) + 19992 >> 2];
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
             i = p[4923];
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
             d = p[(e << 2) + 19992 >> 2];
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
                a = p[((d | b) + (a >>> b | 0) << 2) + 19992 >> 2];
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
             if (!f | c >>> 0 >= p[4924] - g >>> 0) {
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
            b = p[4924];
            if (b >>> 0 >= g >>> 0) {
             a = p[4927];
             c = b - g | 0;
             v : {
              if (c >>> 0 >= 16) {
               p[4924] = c;
               d = a + g | 0;
               p[4927] = d;
               p[d + 4 >> 2] = c | 1;
               p[a + b >> 2] = c;
               p[a + 4 >> 2] = g | 3;
               break v;
              }
              p[4927] = 0;
              p[4924] = 0;
              p[a + 4 >> 2] = b | 3;
              b = a + b | 0;
              p[b + 4 >> 2] = p[b + 4 >> 2] | 1;
             }
             a = a + 8 | 0;
             break a;
            }
            d = p[4925];
            if (d >>> 0 > g >>> 0) {
             b = d - g | 0;
             p[4925] = b;
             a = p[4928];
             c = a + g | 0;
             p[4928] = c;
             p[c + 4 >> 2] = b | 1;
             p[a + 4 >> 2] = g | 3;
             a = a + 8 | 0;
             break a;
            }
            a = 0;
            f = g + 47 | 0;
            c = f;
            if (p[5040]) {
             b = p[5042];
            } else {
             p[5043] = -1;
             p[5044] = -1;
             p[5041] = 4096;
             p[5042] = 4096;
             p[5040] = m + 12 & -16 ^ 1431655768;
             p[5045] = 0;
             p[5033] = 0;
             b = 4096;
            }
            e = c + b | 0;
            h = 0 - b | 0;
            c = e & h;
            if (c >>> 0 <= g >>> 0) {
             break a;
            }
            b = p[5032];
            if (b) {
             i = p[5030];
             j = i + c | 0;
             if (j >>> 0 <= i >>> 0 | j >>> 0 > b >>> 0) {
              break a;
             }
            }
            if (q[20132] & 4) {
             break f;
            }
            w : {
             x : {
              b = p[4928];
              if (b) {
               a = 20136;
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
              b = Ac(0);
              if ((b | 0) == -1) {
               break g;
              }
              e = c;
              a = p[5041];
              d = a + -1 | 0;
              if (d & b) {
               e = (c - b | 0) + (b + d & 0 - a) | 0;
              }
              if (e >>> 0 <= g >>> 0 | e >>> 0 > 2147483646) {
               break g;
              }
              a = p[5032];
              if (a) {
               d = p[5030];
               h = d + e | 0;
               if (h >>> 0 <= d >>> 0 | h >>> 0 > a >>> 0) {
                break g;
               }
              }
              a = Ac(e);
              if ((b | 0) != (a | 0)) {
               break w;
              }
              break e;
             }
             e = h & e - d;
             if (e >>> 0 > 2147483646) {
              break g;
             }
             b = Ac(e);
             if ((b | 0) == (p[a >> 2] + p[a + 4 >> 2] | 0)) {
              break h;
             }
             a = b;
            }
            if (!((a | 0) == -1 | g + 48 >>> 0 <= e >>> 0)) {
             b = p[5042];
             b = b + (f - e | 0) & 0 - b;
             if (b >>> 0 > 2147483646) {
              b = a;
              break e;
             }
             if ((Ac(b) | 0) != -1) {
              e = b + e | 0;
              b = a;
              break e;
             }
             Ac(0 - e | 0);
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
       p[5033] = p[5033] | 4;
      }
      if (c >>> 0 > 2147483646) {
       break d;
      }
      b = Ac(c);
      a = Ac(0);
      if (b >>> 0 >= a >>> 0 | (b | 0) == -1 | (a | 0) == -1) {
       break d;
      }
      e = a - b | 0;
      if (e >>> 0 <= g + 40 >>> 0) {
       break d;
      }
     }
     a = p[5030] + e | 0;
     p[5030] = a;
     if (a >>> 0 > s[5031]) {
      p[5031] = a;
     }
     y : {
      z : {
       A : {
        c = p[4928];
        if (c) {
         a = 20136;
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
        a = p[4926];
        if (!(b >>> 0 >= a >>> 0 ? a : 0)) {
         p[4926] = b;
        }
        a = 0;
        p[5035] = e;
        p[5034] = b;
        p[4930] = -1;
        p[4931] = p[5040];
        p[5037] = 0;
        while (1) {
         c = a << 3;
         d = c + 19728 | 0;
         p[c + 19736 >> 2] = d;
         p[c + 19740 >> 2] = d;
         a = a + 1 | 0;
         if ((a | 0) != 32) {
          continue;
         }
         break;
        }
        a = e + -40 | 0;
        c = b + 8 & 7 ? -8 - b & 7 : 0;
        d = a - c | 0;
        p[4925] = d;
        c = b + c | 0;
        p[4928] = c;
        p[c + 4 >> 2] = d | 1;
        p[(a + b | 0) + 4 >> 2] = 40;
        p[4929] = p[5044];
        break y;
       }
       if (q[a + 12 | 0] & 8 | b >>> 0 <= c >>> 0 | d >>> 0 > c >>> 0) {
        break z;
       }
       p[a + 4 >> 2] = e + f;
       a = c + 8 & 7 ? -8 - c & 7 : 0;
       b = a + c | 0;
       p[4928] = b;
       d = p[4925] + e | 0;
       a = d - a | 0;
       p[4925] = a;
       p[b + 4 >> 2] = a | 1;
       p[(c + d | 0) + 4 >> 2] = 40;
       p[4929] = p[5044];
       break y;
      }
      f = p[4926];
      if (b >>> 0 < f >>> 0) {
       p[4926] = b;
       f = 0;
      }
      d = b + e | 0;
      a = 20136;
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
           a = 20136;
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
           p[4928] = h;
           a = p[4925] + a | 0;
           p[4925] = a;
           p[h + 4 >> 2] = a | 1;
           break C;
          }
          if (p[4927] == (b | 0)) {
           p[4927] = h;
           a = p[4924] + a | 0;
           p[4924] = a;
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
              n = 19688, o = p[4922] & uv(f), p[n >> 2] = o;
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
            d = (c << 2) + 19992 | 0;
            K : {
             if (p[d >> 2] == (b | 0)) {
              p[d >> 2] = e;
              if (e) {
               break K;
              }
              n = 19692, o = p[4923] & uv(c), p[n >> 2] = o;
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
           a = (b << 3) + 19728 | 0;
           c = p[4922];
           b = 1 << b;
           L : {
            if (!(c & b)) {
             p[4922] = b | c;
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
          c = (b << 2) + 19992 | 0;
          d = p[4923];
          f = 1 << b;
          N : {
           if (!(d & f)) {
            p[4923] = d | f;
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
         p[4925] = h;
         d = b + d | 0;
         p[4928] = d;
         p[d + 4 >> 2] = h | 1;
         p[(a + b | 0) + 4 >> 2] = 40;
         p[4929] = p[5044];
         a = (f + (f + -39 & 7 ? 39 - f & 7 : 0) | 0) + -47 | 0;
         d = a >>> 0 < c + 16 >>> 0 ? c : a;
         p[d + 4 >> 2] = 27;
         a = p[5037];
         p[d + 16 >> 2] = p[5036];
         p[d + 20 >> 2] = a;
         a = p[5035];
         p[d + 8 >> 2] = p[5034];
         p[d + 12 >> 2] = a;
         p[5036] = d + 8;
         p[5035] = e;
         p[5034] = b;
         p[5037] = 0;
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
          a = (b << 3) + 19728 | 0;
          d = p[4922];
          b = 1 << b;
          O : {
           if (!(d & b)) {
            p[4922] = b | d;
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
         b = (a << 2) + 19992 | 0;
         d = p[4923];
         e = 1 << a;
         Q : {
          if (!(d & e)) {
           p[4923] = d | e;
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
     a = p[4925];
     if (a >>> 0 <= g >>> 0) {
      break d;
     }
     b = a - g | 0;
     p[4925] = b;
     a = p[4928];
     c = a + g | 0;
     p[4928] = c;
     p[c + 4 >> 2] = b | 1;
     p[a + 4 >> 2] = g | 3;
     a = a + 8 | 0;
     break a;
    }
    p[4904] = 48;
    a = 0;
    break a;
   }
   R : {
    if (!j) {
     break R;
    }
    a = p[f + 28 >> 2];
    d = (a << 2) + 19992 | 0;
    S : {
     if (p[d >> 2] == (f | 0)) {
      p[d >> 2] = b;
      if (b) {
       break S;
      }
      i = uv(a) & i;
      p[4923] = i;
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
     a = (b << 3) + 19728 | 0;
     c = p[4922];
     b = 1 << b;
     U : {
      if (!(c & b)) {
       p[4922] = b | c;
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
    b = (a << 2) + 19992 | 0;
    W : {
     d = 1 << a;
     X : {
      if (!(d & i)) {
       p[4923] = d | i;
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
   c = (a << 2) + 19992 | 0;
   Z : {
    if (p[c >> 2] == (b | 0)) {
     p[c >> 2] = f;
     if (f) {
      break Z;
     }
     n = 19692, o = uv(a) & k, p[n >> 2] = o;
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
    a = (c << 3) + 19728 | 0;
    f = p[4927];
    c = 1 << c;
    $ : {
     if (!(c & e)) {
      p[4922] = c | e;
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
   p[4927] = l;
   p[4924] = d;
  }
  a = b + 8 | 0;
 }
 sa = m + 16 | 0;
 return a | 0;
}
function sm() {
 var a = 0, b = 0, c = 0, d = 0, e = 0;
 a = sa - 1280 | 0;
 sa = a;
 rm();
 L(19398, 19399, 19400, 0, 12620, 564, 12623, 0, 12623, 0, 11465, 12625, 565);
 p[a + 792 >> 2] = 8;
 p[a + 796 >> 2] = 1;
 p[a + 1272 >> 2] = 8;
 p[a + 1276 >> 2] = 1;
 Qf(11474, a + 792 | 0);
 p[a + 784 >> 2] = 12;
 p[a + 788 >> 2] = 1;
 p[a + 1272 >> 2] = 12;
 p[a + 1276 >> 2] = 1;
 Qf(11479, a + 784 | 0);
 p[a + 776 >> 2] = 16;
 p[a + 780 >> 2] = 1;
 p[a + 1272 >> 2] = 16;
 p[a + 1276 >> 2] = 1;
 pm(a + 776 | 0);
 p[a + 768 >> 2] = 20;
 p[a + 772 >> 2] = 1;
 p[a + 1272 >> 2] = 20;
 p[a + 1276 >> 2] = 1;
 om(a + 768 | 0);
 p[a + 760 >> 2] = 24;
 p[a + 764 >> 2] = 1;
 p[a + 1272 >> 2] = 24;
 p[a + 1276 >> 2] = 1;
 nm(a + 760 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 566;
 b = p[a + 1276 >> 2];
 p[a + 752 >> 2] = p[a + 1272 >> 2];
 p[a + 756 >> 2] = b;
 lm(a + 752 | 0);
 L(19401, 19402, 19407, 19398, 12620, 567, 12620, 677, 12620, 678, 11521, 12625, 568);
 jm();
 P(19398, 12772, 2, 12800, 12616, 569, 570);
 P(19398, 12782, 3, 12960, 12972, 571, 572);
 L(19441, 19382, 19442, 0, 12620, 573, 12623, 0, 12623, 0, 11537, 12625, 574);
 p[a + 744 >> 2] = 8;
 p[a + 748 >> 2] = 1;
 p[a + 1272 >> 2] = 8;
 p[a + 1276 >> 2] = 1;
 Pf(11548, a + 744 | 0);
 p[a + 736 >> 2] = 40;
 p[a + 740 >> 2] = 1;
 p[a + 1272 >> 2] = 40;
 p[a + 1276 >> 2] = 1;
 em(a + 736 | 0);
 p[a + 728 >> 2] = 12;
 p[a + 732 >> 2] = 1;
 p[a + 1272 >> 2] = 12;
 p[a + 1276 >> 2] = 1;
 bm(a + 728 | 0);
 p[a + 720 >> 2] = 20;
 p[a + 724 >> 2] = 1;
 p[a + 1272 >> 2] = 20;
 p[a + 1276 >> 2] = 1;
 Of(11571, a + 720 | 0);
 p[a + 712 >> 2] = 24;
 p[a + 716 >> 2] = 1;
 p[a + 1272 >> 2] = 24;
 p[a + 1276 >> 2] = 1;
 Of(11578, a + 712 | 0);
 p[a + 704 >> 2] = 28;
 p[a + 708 >> 2] = 1;
 p[a + 1272 >> 2] = 28;
 p[a + 1276 >> 2] = 1;
 am(a + 704 | 0);
 p[a + 696 >> 2] = 32;
 p[a + 700 >> 2] = 1;
 p[a + 1272 >> 2] = 32;
 p[a + 1276 >> 2] = 1;
 Pf(11593, a + 696 | 0);
 L(19443, 19444, 19447, 19441, 12620, 575, 12620, 686, 12620, 687, 11599, 12625, 576);
 _l();
 P(19441, 12772, 2, 13108, 12616, 577, 578);
 P(19441, 12782, 3, 12960, 12972, 571, 579);
 R(19480, 11617, 4, 1);
 Nf(Nf(a + 1272 | 0, 11634, 1), 11639, 0);
 R(19445, 11646, 4, 1);
 Mf(Mf(a + 1272 | 0, 11655, 0), 11663, 1);
 R(19481, 11671, 4, 0);
 $d($d($d(a + 1272 | 0, 11681, 0), 11686, 1), 11692, 2);
 R(19482, 11699, 4, 0);
 _d(_d(_d(a + 1272 | 0, 11710, 0), 11686, 1), 11716, 2);
 R(19483, 11722, 4, 0);
 tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(tb(a + 1272 | 0, 11732, 3), 11740, 14), 11747, 15), 11755, 16), 11762, 17), 11770, 18), 11781, 19), 11791, 20), 11801, 21), 11811, 22), 11822, 23), 11832, 24), 11841, 25), 11845, 26), 11856, 27), 11862, 28);
 L(19484, 19381, 19485, 0, 12620, 580, 12623, 0, 12623, 0, 11873, 12625, 581);
 p[a + 688 >> 2] = 4;
 p[a + 692 >> 2] = 1;
 p[a + 1272 >> 2] = 4;
 p[a + 1276 >> 2] = 1;
 Wl(a + 688 | 0);
 p[a + 680 >> 2] = 0;
 p[a + 684 >> 2] = 1;
 p[a + 1272 >> 2] = 0;
 p[a + 1276 >> 2] = 1;
 Vl(a + 680 | 0);
 p[a + 672 >> 2] = 8;
 p[a + 676 >> 2] = 1;
 p[a + 1272 >> 2] = 8;
 p[a + 1276 >> 2] = 1;
 Ul(a + 672 | 0);
 p[a + 664 >> 2] = 12;
 p[a + 668 >> 2] = 1;
 p[a + 1272 >> 2] = 12;
 p[a + 1276 >> 2] = 1;
 Tl(a + 664 | 0);
 p[a + 656 >> 2] = 16;
 p[a + 660 >> 2] = 1;
 p[a + 1272 >> 2] = 16;
 p[a + 1276 >> 2] = 1;
 Sl(a + 656 | 0);
 p[a + 648 >> 2] = 20;
 p[a + 652 >> 2] = 1;
 p[a + 1272 >> 2] = 20;
 p[a + 1276 >> 2] = 1;
 Rl(a + 648 | 0);
 p[a + 640 >> 2] = 24;
 p[a + 644 >> 2] = 1;
 p[a + 1272 >> 2] = 24;
 p[a + 1276 >> 2] = 1;
 Jf(11920, a + 640 | 0);
 p[a + 632 >> 2] = 28;
 p[a + 636 >> 2] = 1;
 p[a + 1272 >> 2] = 28;
 p[a + 1276 >> 2] = 1;
 Jf(11935, a + 632 | 0);
 p[a + 624 >> 2] = 32;
 p[a + 628 >> 2] = 1;
 p[a + 1272 >> 2] = 32;
 p[a + 1276 >> 2] = 1;
 Pl(a + 624 | 0);
 p[a + 616 >> 2] = 36;
 p[a + 620 >> 2] = 1;
 p[a + 1272 >> 2] = 36;
 p[a + 1276 >> 2] = 1;
 Ol(a + 616 | 0);
 L(19486, 19487, 19488, 19484, 12620, 582, 12620, 699, 12620, 700, 11975, 12625, 583);
 Ml();
 P(19484, 12772, 2, 13496, 12616, 584, 585);
 P(19484, 12782, 3, 12960, 12972, 571, 586);
 L(19403, 19556, 19557, 0, 12620, 587, 12623, 0, 12623, 0, 11994, 12625, 588);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 589;
 b = p[a + 1276 >> 2];
 p[a + 608 >> 2] = p[a + 1272 >> 2];
 p[a + 612 >> 2] = b;
 I(19403, 12e3, 19446, 13760, 590, Xa(a + 608 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 591;
 b = p[a + 1276 >> 2];
 p[a + 600 >> 2] = p[a + 1272 >> 2];
 p[a + 604 >> 2] = b;
 I(19403, 12003, 19446, 13760, 590, Xa(a + 600 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 592;
 b = p[a + 1276 >> 2];
 p[a + 592 >> 2] = p[a + 1272 >> 2];
 p[a + 596 >> 2] = b;
 I(19403, 12006, 19446, 13760, 590, Xa(a + 592 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 593;
 b = p[a + 1276 >> 2];
 p[a + 584 >> 2] = p[a + 1272 >> 2];
 p[a + 588 >> 2] = b;
 I(19403, 12009, 19446, 13760, 590, Xa(a + 584 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 594;
 b = p[a + 1276 >> 2];
 p[a + 576 >> 2] = p[a + 1272 >> 2];
 p[a + 580 >> 2] = b;
 I(19403, 12012, 19446, 13760, 590, Xa(a + 576 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 595;
 b = p[a + 1276 >> 2];
 p[a + 568 >> 2] = p[a + 1272 >> 2];
 p[a + 572 >> 2] = b;
 I(19403, 12015, 19446, 13760, 590, Xa(a + 568 | 0) | 0, 0, 0, 0, 0);
 L(19558, 19397, 19559, 0, 12620, 596, 12623, 0, 12623, 0, 12018, 12625, 597);
 p[a + 1252 >> 2] = 0;
 p[a + 1248 >> 2] = 598;
 b = p[a + 1252 >> 2];
 p[a + 560 >> 2] = p[a + 1248 >> 2];
 p[a + 564 >> 2] = b;
 Za(a + 1256 | 0, a + 560 | 0);
 b = p[a + 1260 >> 2];
 c = p[a + 1256 >> 2];
 p[a + 552 >> 2] = c;
 p[a + 556 >> 2] = b;
 p[a + 1272 >> 2] = c;
 p[a + 1276 >> 2] = b;
 Fl(a + 552 | 0);
 p[a + 1236 >> 2] = 0;
 p[a + 1232 >> 2] = 599;
 b = p[a + 1236 >> 2];
 p[a + 544 >> 2] = p[a + 1232 >> 2];
 p[a + 548 >> 2] = b;
 Za(a + 1240 | 0, a + 544 | 0);
 b = p[a + 1244 >> 2];
 c = p[a + 1240 >> 2];
 p[a + 536 >> 2] = c;
 p[a + 540 >> 2] = b;
 p[a + 1272 >> 2] = c;
 p[a + 1276 >> 2] = b;
 El(a + 536 | 0);
 L(19561, 19560, 19562, 0, 12620, 600, 12623, 0, 12623, 0, 12048, 12625, 601);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 602;
 b = p[a + 1276 >> 2];
 p[a + 528 >> 2] = p[a + 1272 >> 2];
 p[a + 532 >> 2] = b;
 Cl(a + 528 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 603;
 b = p[a + 1276 >> 2];
 p[a + 520 >> 2] = p[a + 1272 >> 2];
 p[a + 524 >> 2] = b;
 Bl(a + 520 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 604;
 b = p[a + 1276 >> 2];
 p[a + 512 >> 2] = p[a + 1272 >> 2];
 p[a + 516 >> 2] = b;
 yl(a + 512 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 605;
 b = p[a + 1276 >> 2];
 p[a + 504 >> 2] = p[a + 1272 >> 2];
 p[a + 508 >> 2] = b;
 wl(a + 504 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 606;
 b = p[a + 1276 >> 2];
 p[a + 496 >> 2] = p[a + 1272 >> 2];
 p[a + 500 >> 2] = b;
 ul(a + 496 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 607;
 b = p[a + 1276 >> 2];
 p[a + 488 >> 2] = p[a + 1272 >> 2];
 p[a + 492 >> 2] = b;
 sl(a + 488 | 0);
 ql();
 nl();
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 610;
 b = p[a + 1276 >> 2];
 p[a + 480 >> 2] = p[a + 1272 >> 2];
 p[a + 484 >> 2] = b;
 ll(a + 480 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 611;
 b = p[a + 1276 >> 2];
 p[a + 472 >> 2] = p[a + 1272 >> 2];
 p[a + 476 >> 2] = b;
 I(19561, 12145, 19406, 12616, 612, Xa(a + 472 | 0) | 0, 0, 0, 0, 0);
 L(19571, 19565, 19572, 0, 12620, 613, 12623, 0, 12623, 0, 12152, 12625, 614);
 p[a + 1220 >> 2] = 0;
 p[a + 1216 >> 2] = 615;
 b = p[a + 1220 >> 2];
 p[a + 464 >> 2] = p[a + 1216 >> 2];
 p[a + 468 >> 2] = b;
 Za(a + 1224 | 0, a + 464 | 0);
 p[a + 1204 >> 2] = 0;
 p[a + 1200 >> 2] = 616;
 b = p[a + 1204 >> 2];
 p[a + 456 >> 2] = p[a + 1200 >> 2];
 p[a + 460 >> 2] = b;
 b = p[a + 1224 >> 2];
 c = p[a + 1228 >> 2];
 Za(a + 1208 | 0, a + 456 | 0);
 d = p[a + 1208 >> 2];
 e = p[a + 1212 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 448 >> 2] = p[a + 1272 >> 2];
 p[a + 452 >> 2] = b;
 b = Xa(a + 448 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 440 >> 2] = p[a + 1264 >> 2];
 p[a + 444 >> 2] = c;
 I(19571, 12171, 19446, 13760, 617, b | 0, 19446, 13372, 618, Xa(a + 440 | 0) | 0);
 p[a + 1188 >> 2] = 0;
 p[a + 1184 >> 2] = 619;
 b = p[a + 1188 >> 2];
 p[a + 432 >> 2] = p[a + 1184 >> 2];
 p[a + 436 >> 2] = b;
 Za(a + 1192 | 0, a + 432 | 0);
 p[a + 1172 >> 2] = 0;
 p[a + 1168 >> 2] = 620;
 b = p[a + 1172 >> 2];
 p[a + 424 >> 2] = p[a + 1168 >> 2];
 p[a + 428 >> 2] = b;
 b = p[a + 1192 >> 2];
 c = p[a + 1196 >> 2];
 Za(a + 1176 | 0, a + 424 | 0);
 d = p[a + 1176 >> 2];
 e = p[a + 1180 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 416 >> 2] = p[a + 1272 >> 2];
 p[a + 420 >> 2] = b;
 b = Xa(a + 416 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 408 >> 2] = p[a + 1264 >> 2];
 p[a + 412 >> 2] = c;
 I(19571, 12178, 19446, 13760, 617, b | 0, 19446, 13372, 618, Xa(a + 408 | 0) | 0);
 p[a + 1156 >> 2] = 0;
 p[a + 1152 >> 2] = 621;
 b = p[a + 1156 >> 2];
 p[a + 400 >> 2] = p[a + 1152 >> 2];
 p[a + 404 >> 2] = b;
 Za(a + 1160 | 0, a + 400 | 0);
 p[a + 1140 >> 2] = 0;
 p[a + 1136 >> 2] = 622;
 b = p[a + 1140 >> 2];
 p[a + 392 >> 2] = p[a + 1136 >> 2];
 p[a + 396 >> 2] = b;
 b = p[a + 1160 >> 2];
 c = p[a + 1164 >> 2];
 Za(a + 1144 | 0, a + 392 | 0);
 d = p[a + 1144 >> 2];
 e = p[a + 1148 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 384 >> 2] = p[a + 1272 >> 2];
 p[a + 388 >> 2] = b;
 b = Xa(a + 384 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 376 >> 2] = p[a + 1264 >> 2];
 p[a + 380 >> 2] = c;
 I(19571, 12185, 19446, 13760, 617, b | 0, 19446, 13372, 618, Xa(a + 376 | 0) | 0);
 L(19573, 19566, 19574, 19571, 12620, 623, 12620, 714, 12620, 715, 12194, 12625, 624);
 p[a + 1120 >> 2] = 68;
 p[a + 1124 >> 2] = 1;
 p[a + 368 >> 2] = 68;
 p[a + 372 >> 2] = 1;
 Za(a + 1128 | 0, a + 368 | 0);
 p[a + 1108 >> 2] = 0;
 p[a + 1104 >> 2] = 625;
 b = p[a + 1108 >> 2];
 p[a + 360 >> 2] = p[a + 1104 >> 2];
 p[a + 364 >> 2] = b;
 b = p[a + 1128 >> 2];
 c = p[a + 1132 >> 2];
 Za(a + 1112 | 0, a + 360 | 0);
 d = p[a + 1112 >> 2];
 e = p[a + 1116 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 352 >> 2] = p[a + 1272 >> 2];
 p[a + 356 >> 2] = b;
 b = Xa(a + 352 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 344 >> 2] = p[a + 1264 >> 2];
 p[a + 348 >> 2] = c;
 I(19573, 12199, 19446, 13760, 626, b | 0, 19446, 13372, 627, Xa(a + 344 | 0) | 0);
 p[a + 1088 >> 2] = 72;
 p[a + 1092 >> 2] = 1;
 p[a + 336 >> 2] = 72;
 p[a + 340 >> 2] = 1;
 Za(a + 1096 | 0, a + 336 | 0);
 p[a + 1076 >> 2] = 0;
 p[a + 1072 >> 2] = 628;
 b = p[a + 1076 >> 2];
 p[a + 328 >> 2] = p[a + 1072 >> 2];
 p[a + 332 >> 2] = b;
 b = p[a + 1096 >> 2];
 c = p[a + 1100 >> 2];
 Za(a + 1080 | 0, a + 328 | 0);
 d = p[a + 1080 >> 2];
 e = p[a + 1084 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 320 >> 2] = p[a + 1272 >> 2];
 p[a + 324 >> 2] = b;
 b = Xa(a + 320 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 312 >> 2] = p[a + 1264 >> 2];
 p[a + 316 >> 2] = c;
 I(19573, 12201, 19446, 13760, 626, b | 0, 19446, 13372, 627, Xa(a + 312 | 0) | 0);
 L(19575, 19567, 19576, 19571, 12620, 629, 12620, 716, 12620, 717, 12203, 12625, 630);
 p[a + 1060 >> 2] = 0;
 p[a + 1056 >> 2] = 631;
 b = p[a + 1060 >> 2];
 p[a + 304 >> 2] = p[a + 1056 >> 2];
 p[a + 308 >> 2] = b;
 Za(a + 1064 | 0, a + 304 | 0);
 p[a + 1044 >> 2] = 0;
 p[a + 1040 >> 2] = 632;
 b = p[a + 1044 >> 2];
 p[a + 296 >> 2] = p[a + 1040 >> 2];
 p[a + 300 >> 2] = b;
 b = p[a + 1064 >> 2];
 c = p[a + 1068 >> 2];
 Za(a + 1048 | 0, a + 296 | 0);
 d = p[a + 1048 >> 2];
 e = p[a + 1052 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 288 >> 2] = p[a + 1272 >> 2];
 p[a + 292 >> 2] = b;
 b = Xa(a + 288 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 280 >> 2] = p[a + 1264 >> 2];
 p[a + 284 >> 2] = c;
 I(19575, 12208, 19446, 13760, 633, b | 0, 19446, 13372, 634, Xa(a + 280 | 0) | 0);
 L(19577, 19568, 19578, 19575, 12620, 635, 12620, 718, 12620, 719, 12215, 12625, 636);
 p[a + 1024 >> 2] = 68;
 p[a + 1028 >> 2] = 1;
 p[a + 272 >> 2] = 68;
 p[a + 276 >> 2] = 1;
 Za(a + 1032 | 0, a + 272 | 0);
 p[a + 1012 >> 2] = 0;
 p[a + 1008 >> 2] = 637;
 b = p[a + 1012 >> 2];
 p[a + 264 >> 2] = p[a + 1008 >> 2];
 p[a + 268 >> 2] = b;
 b = p[a + 1032 >> 2];
 c = p[a + 1036 >> 2];
 Za(a + 1016 | 0, a + 264 | 0);
 d = p[a + 1016 >> 2];
 e = p[a + 1020 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 256 >> 2] = p[a + 1272 >> 2];
 p[a + 260 >> 2] = b;
 b = Xa(a + 256 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 248 >> 2] = p[a + 1264 >> 2];
 p[a + 252 >> 2] = c;
 I(19577, 12199, 19446, 13760, 638, b | 0, 19446, 13372, 639, Xa(a + 248 | 0) | 0);
 p[a + 992 >> 2] = 72;
 p[a + 996 >> 2] = 1;
 p[a + 240 >> 2] = 72;
 p[a + 244 >> 2] = 1;
 Za(a + 1e3 | 0, a + 240 | 0);
 p[a + 980 >> 2] = 0;
 p[a + 976 >> 2] = 640;
 b = p[a + 980 >> 2];
 p[a + 232 >> 2] = p[a + 976 >> 2];
 p[a + 236 >> 2] = b;
 b = p[a + 1e3 >> 2];
 c = p[a + 1004 >> 2];
 Za(a + 984 | 0, a + 232 | 0);
 d = p[a + 984 >> 2];
 e = p[a + 988 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 224 >> 2] = p[a + 1272 >> 2];
 p[a + 228 >> 2] = b;
 b = Xa(a + 224 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 216 >> 2] = p[a + 1264 >> 2];
 p[a + 220 >> 2] = c;
 I(19577, 12201, 19446, 13760, 638, b | 0, 19446, 13372, 639, Xa(a + 216 | 0) | 0);
 L(19579, 19569, 19580, 0, 12620, 641, 12623, 0, 12623, 0, 12224, 12625, 642);
 p[a + 964 >> 2] = 0;
 p[a + 960 >> 2] = 643;
 b = p[a + 964 >> 2];
 p[a + 208 >> 2] = p[a + 960 >> 2];
 p[a + 212 >> 2] = b;
 Za(a + 968 | 0, a + 208 | 0);
 b = p[a + 968 >> 2];
 p[a + 1276 >> 2] = p[a + 972 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 200 >> 2] = p[a + 1272 >> 2];
 p[a + 204 >> 2] = b;
 I(19579, 12240, 19440, 12616, 644, Xa(a + 200 | 0) | 0, 0, 0, 0, 0);
 p[a + 948 >> 2] = 0;
 p[a + 944 >> 2] = 645;
 b = p[a + 948 >> 2];
 p[a + 192 >> 2] = p[a + 944 >> 2];
 p[a + 196 >> 2] = b;
 Za(a + 952 | 0, a + 192 | 0);
 b = p[a + 952 >> 2];
 p[a + 1276 >> 2] = p[a + 956 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 184 >> 2] = p[a + 1272 >> 2];
 p[a + 188 >> 2] = b;
 I(19579, 12245, 19581, 12616, 646, Xa(a + 184 | 0) | 0, 0, 0, 0, 0);
 p[a + 932 >> 2] = 0;
 p[a + 928 >> 2] = 647;
 b = p[a + 932 >> 2];
 p[a + 176 >> 2] = p[a + 928 >> 2];
 p[a + 180 >> 2] = b;
 Za(a + 936 | 0, a + 176 | 0);
 b = p[a + 936 >> 2];
 p[a + 1276 >> 2] = p[a + 940 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 168 >> 2] = p[a + 1272 >> 2];
 p[a + 172 >> 2] = b;
 I(19579, 12254, 19581, 12616, 646, Xa(a + 168 | 0) | 0, 0, 0, 0, 0);
 p[a + 916 >> 2] = 0;
 p[a + 912 >> 2] = 648;
 b = p[a + 916 >> 2];
 p[a + 160 >> 2] = p[a + 912 >> 2];
 p[a + 164 >> 2] = b;
 Za(a + 920 | 0, a + 160 | 0);
 b = p[a + 920 >> 2];
 p[a + 1276 >> 2] = p[a + 924 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 152 >> 2] = p[a + 1272 >> 2];
 p[a + 156 >> 2] = b;
 I(19579, 12258, 19581, 12616, 646, Xa(a + 152 | 0) | 0, 0, 0, 0, 0);
 p[a + 900 >> 2] = 0;
 p[a + 896 >> 2] = 649;
 b = p[a + 900 >> 2];
 p[a + 144 >> 2] = p[a + 896 >> 2];
 p[a + 148 >> 2] = b;
 Za(a + 904 | 0, a + 144 | 0);
 b = p[a + 904 >> 2];
 p[a + 1276 >> 2] = p[a + 908 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 136 >> 2] = p[a + 1272 >> 2];
 p[a + 140 >> 2] = b;
 I(19579, 12268, 19581, 12616, 646, Xa(a + 136 | 0) | 0, 0, 0, 0, 0);
 p[a + 884 >> 2] = 0;
 p[a + 880 >> 2] = 650;
 b = p[a + 884 >> 2];
 p[a + 128 >> 2] = p[a + 880 >> 2];
 p[a + 132 >> 2] = b;
 Za(a + 888 | 0, a + 128 | 0);
 b = p[a + 888 >> 2];
 p[a + 1276 >> 2] = p[a + 892 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 120 >> 2] = p[a + 1272 >> 2];
 p[a + 124 >> 2] = b;
 I(19579, 12276, 19581, 12616, 646, Xa(a + 120 | 0) | 0, 0, 0, 0, 0);
 p[a + 868 >> 2] = 0;
 p[a + 864 >> 2] = 651;
 b = p[a + 868 >> 2];
 p[a + 112 >> 2] = p[a + 864 >> 2];
 p[a + 116 >> 2] = b;
 Za(a + 872 | 0, a + 112 | 0);
 b = p[a + 872 >> 2];
 p[a + 1276 >> 2] = p[a + 876 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 104 >> 2] = p[a + 1272 >> 2];
 p[a + 108 >> 2] = b;
 I(19579, 12286, 19446, 13760, 652, Xa(a + 104 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 653;
 b = p[a + 1276 >> 2];
 p[a + 96 >> 2] = p[a + 1272 >> 2];
 p[a + 100 >> 2] = b;
 bl(a + 96 | 0);
 L(19582, 19583, 19584, 0, 12620, 654, 12623, 0, 12623, 0, 12298, 12625, 655);
 _k();
 p[a + 852 >> 2] = 0;
 p[a + 848 >> 2] = 657;
 b = p[a + 852 >> 2];
 p[a + 88 >> 2] = p[a + 848 >> 2];
 p[a + 92 >> 2] = b;
 Za(a + 856 | 0, a + 88 | 0);
 p[a + 836 >> 2] = 0;
 p[a + 832 >> 2] = 658;
 b = p[a + 836 >> 2];
 p[a + 80 >> 2] = p[a + 832 >> 2];
 p[a + 84 >> 2] = b;
 b = p[a + 856 >> 2];
 c = p[a + 860 >> 2];
 Za(a + 840 | 0, a + 80 | 0);
 d = p[a + 840 >> 2];
 e = p[a + 844 >> 2];
 p[a + 1276 >> 2] = c;
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 72 >> 2] = p[a + 1272 >> 2];
 p[a + 76 >> 2] = b;
 b = Xa(a + 72 | 0);
 p[a + 1268 >> 2] = e;
 p[a + 1264 >> 2] = d;
 c = p[a + 1268 >> 2];
 p[a + 64 >> 2] = p[a + 1264 >> 2];
 p[a + 68 >> 2] = c;
 I(19582, 12322, 19446, 13760, 659, b | 0, 19446, 13372, 660, Xa(a - -64 | 0) | 0);
 p[a + 820 >> 2] = 0;
 p[a + 816 >> 2] = 661;
 b = p[a + 820 >> 2];
 p[a + 56 >> 2] = p[a + 816 >> 2];
 p[a + 60 >> 2] = b;
 Za(a + 824 | 0, a + 56 | 0);
 b = p[a + 824 >> 2];
 p[a + 1276 >> 2] = p[a + 828 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 48 >> 2] = p[a + 1272 >> 2];
 p[a + 52 >> 2] = b;
 I(19582, 12327, 19563, 12616, 662, Xa(a + 48 | 0) | 0, 0, 0, 0, 0);
 p[a + 804 >> 2] = 0;
 p[a + 800 >> 2] = 663;
 b = p[a + 804 >> 2];
 p[a + 40 >> 2] = p[a + 800 >> 2];
 p[a + 44 >> 2] = b;
 Za(a + 808 | 0, a + 40 | 0);
 b = p[a + 808 >> 2];
 p[a + 1276 >> 2] = p[a + 812 >> 2];
 p[a + 1272 >> 2] = b;
 b = p[a + 1276 >> 2];
 p[a + 32 >> 2] = p[a + 1272 >> 2];
 p[a + 36 >> 2] = b;
 Yk(a + 32 | 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 664;
 b = p[a + 1276 >> 2];
 p[a + 24 >> 2] = p[a + 1272 >> 2];
 p[a + 28 >> 2] = b;
 Vk(a + 24 | 0);
 R(19404, 12335, 1, 0);
 jc(jc(jc(jc(jc(jc(jc(a + 1272 | 0, 11634, 0), 12339, 1), 12347, 2), 12353, 3), 12362, 4), 12372, 5), 12377, 6);
 L(19405, 19585, 19586, 0, 12620, 665, 12623, 0, 12623, 0, 12387, 12625, 666);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 667;
 b = p[a + 1276 >> 2];
 p[a + 16 >> 2] = p[a + 1272 >> 2];
 p[a + 20 >> 2] = b;
 I(19405, 12199, 19446, 13760, 668, Xa(a + 16 | 0) | 0, 0, 0, 0, 0);
 p[a + 1276 >> 2] = 0;
 p[a + 1272 >> 2] = 669;
 b = p[a + 1276 >> 2];
 p[a + 8 >> 2] = p[a + 1272 >> 2];
 p[a + 12 >> 2] = b;
 I(19405, 12201, 19446, 13760, 668, Xa(a + 8 | 0) | 0, 0, 0, 0, 0);
 N(19405, 12397, 19405, 10332, 12620, 670, 0, 0);
 N(19405, 12405, 19405, 10340, 12620, 670, 0, 0);
 N(19405, 12415, 19405, 10348, 12620, 670, 0, 0);
 N(19405, 12424, 19405, 10356, 12620, 670, 0, 0);
 N(19405, 12435, 19405, 10364, 12620, 670, 0, 0);
 N(19405, 12442, 19405, 10372, 12620, 670, 0, 0);
 N(19405, 12454, 19405, 10380, 12620, 670, 0, 0);
 N(19405, 12465, 19405, 10388, 12620, 670, 0, 0);
 N(19405, 12478, 19405, 10396, 12620, 670, 0, 0);
 pa(19406, 12490, 13984, 724, 12625, 725);
 jd(jd(jd(jd(a + 1272 | 0, 12495, 0), 12500, 4), 12505, 8), 12510, 12);
 na(19406);
 sa = a + 1280 | 0;
}
function uf(a, b, c, d, e, f, g) {
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
     p[4904] = 61;
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
         j = !gd(n[p[h + 76 >> 2] + 1 | 0]);
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
             if (!gd(n[i + 1 | 0])) {
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
          t = Ni(h + 76 | 0);
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
            if (!gd(n[b + 2 | 0])) {
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
          l = Ni(h + 76 | 0);
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
          i = q[(i + v(B, 58) | 0) + 17599 | 0];
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
            Mi(h - -64 | 0, i, c, g);
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
         y = 17636;
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
                       j = 17636;
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
                    k = Nu(p[h + 64 >> 2], p[h + 68 >> 2], z, b & 32);
                    if (!(i & 8) | !(p[h + 64 >> 2] | p[h + 68 >> 2])) {
                     break y;
                    }
                    y = (b >>> 4 | 0) + 17636 | 0;
                    w = 2;
                    break y;
                   }
                   k = Mu(p[h + 64 >> 2], p[h + 68 >> 2], z);
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
                   j = 17636;
                   break z;
                  }
                  if (i & 2048) {
                   w = 1;
                   j = 17637;
                   break z;
                  }
                  w = i & 1;
                  j = w ? 17638 : 17636;
                 }
                 y = j;
                 k = Jc(b, k, z);
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
               k = b ? b : 17646;
               b = Eu(k, l);
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
              vb(a, 32, t, 0, i);
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
              k = Ji(h + 4 | 0, k);
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
            vb(a, 32, t, b, i);
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
             k = Ji(h + 4 | 0, k);
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
           vb(a, 32, t, b, i ^ 8192);
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
        Mi((b << 3) + d | 0, a, c, g);
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
    vb(a, 32, b, j, i);
    nb(a, y, w);
    vb(a, 48, b, j, i ^ 65536);
    vb(a, 48, l, r, 0);
    nb(a, k, r);
    vb(a, 32, b, j, i ^ 8192);
    continue;
   }
   break;
  }
  w = 0;
 }
 sa = h + 80 | 0;
 return w;
}
function Lu(a, b, c, d, f, g) {
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
   E = 18144;
   b = -b;
   h(+b);
   i = e(1) | 0;
   e(0) | 0;
   break a;
  }
  if (f & 2048) {
   C = 1;
   E = 18147;
   break a;
  }
  C = f & 1;
  E = C ? 18150 : 18145;
  D = !C;
 }
 b : {
  if ((i & 2146435072) == 2146435072) {
   s = C + 3 | 0;
   vb(a, 32, c, s, f & -65537);
   nb(a, E, C);
   d = g & 32;
   nb(a, b != b ? d ? 18171 : 18175 : d ? 18163 : 18167, 3);
   break b;
  }
  z = l + 16 | 0;
  c : {
   d : {
    e : {
     b = Pi(b, l + 44 | 0);
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
       u = tv(m, s, 1e9);
       G = t;
       t = sv(u, ta, 1e9);
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
    i = Jc(i + j ^ i, 0, z);
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
   vb(d, 32, r, s, f);
   nb(a, E, C);
   vb(a, 48, c, s, f ^ 65536);
   n : {
    o : {
     p : {
      if ((t | 0) == 70) {
       d = l + 16 | 8;
       j = l + 16 | 9;
       g = k >>> 0 > w >>> 0 ? w : k;
       k = g;
       while (1) {
        i = Jc(p[k >> 2], 0, j);
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
        nb(a, 18179, 1);
       }
       if ((o | 0) < 1 | k >>> 0 >= m >>> 0) {
        break p;
       }
       while (1) {
        i = Jc(p[k >> 2], 0, j);
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
        i = Jc(p[j >> 2], 0, r);
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
         nb(a, 18179, 1);
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
      vb(a, 48, o + 18 | 0, 18, 0);
      nb(a, A, z - A | 0);
      break n;
     }
     i = o;
    }
    vb(a, 48, i + 9 | 0, 9, 0);
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
  i = Jc(j ^ i + j, 0, z);
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
   n[k | 0] = u | q[j + 18128 | 0];
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
  vb(a, 32, c, s, f);
  nb(a, w, r);
  vb(a, 48, c, s, f ^ 65536);
  d = k - (l + 16 | 0) | 0;
  nb(a, l + 16 | 0, d);
  i = d;
  d = z - m | 0;
  vb(a, 48, g - (i + d | 0) | 0, 0, 0);
  nb(a, m, d);
 }
 vb(a, 32, c, s, f ^ 8192);
 sa = l + 560 | 0;
 return ((s | 0) < (c | 0) ? c : s) | 0;
}
function Rd(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = a;
 a : {
  if (a >>> 0 <= 211) {
   a = p[Ii(18336, 18528, e + 12 | 0) >> 2];
   break a;
  }
  if (a >>> 0 >= 4294967292) {
   Nb();
   E();
  }
  f = (a >>> 0) / 210 | 0;
  d = v(f, 210);
  p[e + 8 >> 2] = a - d;
  g = Ii(18528, 18720, e + 8 | 0) - 18528 >> 2;
  b : {
   while (1) {
    a = p[(g << 2) + 18528 >> 2] + d | 0;
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
       b = p[(d << 2) + 18336 >> 2];
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
function Ai(a, b, c) {
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
                     switch (b + -92 | 0) {
                     default:
                      u : {
                       switch (b + -40 | 0) {
                       default:
                        if ((b | 0) == 23) {
                         break j;
                        }
                        if ((b | 0) != 5) {
                         break d;
                        }
                        zi(a, c);
                        return;
                       case 28:
                        if (p[a + 8 >> 2] != (c | 0)) {
                         p[a + 8 >> 2] = c;
                         m[p[p[a >> 2] + 32 >> 2]](a);
                        }
                        return;
                       case 11:
                       case 13:
                       case 27:
                        break a;
                       case 0:
                        break k;
                       case 9:
                        break m;
                       case 8:
                        break n;
                       case 21:
                        break o;
                       case 20:
                        break p;
                       case 19:
                        break q;
                       case 17:
                        break r;
                       case 16:
                        break s;
                       case 29:
                        break u;
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
                        break d;
                       }
                      }
                      if (p[a + 12 >> 2] != (c | 0)) {
                       p[a + 12 >> 2] = c;
                       m[p[p[a >> 2] + 36 >> 2]](a);
                      }
                      return;
                     case 25:
                      break l;
                     case 1:
                     case 11:
                     case 28:
                      break b;
                     case 30:
                      break t;
                     case 0:
                     case 3:
                     case 10:
                     case 27:
                     case 29:
                      break c;
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
                      break d;
                     case 21:
                      break e;
                     case 20:
                      break f;
                     case 19:
                      break g;
                     case 18:
                      break h;
                     case 33:
                      break i;
                     }
                    }
                    Ff(a, c);
                    return;
                   }
                   zi(a, c);
                   return;
                  }
                  if (p[a + 20 >> 2] != (c | 0)) {
                   p[a + 20 >> 2] = c;
                   m[p[p[a >> 2] + 36 >> 2]](a);
                  }
                  return;
                 }
                 if (p[a + 28 >> 2] != (c | 0)) {
                  p[a + 28 >> 2] = c;
                  m[p[p[a >> 2] + 44 >> 2]](a);
                 }
                 return;
                }
                if (p[a + 32 >> 2] != (c | 0)) {
                 p[a + 32 >> 2] = c;
                 m[p[p[a >> 2] + 48 >> 2]](a);
                }
                return;
               }
               if (p[a + 36 >> 2] != (c | 0)) {
                p[a + 36 >> 2] = c;
                m[p[p[a >> 2] + 52 >> 2]](a);
               }
               return;
              }
              if (p[a + 60 >> 2] != (c | 0)) {
               p[a + 60 >> 2] = c;
               m[p[p[a >> 2] + 68 >> 2]](a);
              }
              return;
             }
             if (p[a + 64 >> 2] != (c | 0)) {
              p[a + 64 >> 2] = c;
              m[p[p[a >> 2] + 72 >> 2]](a);
             }
             return;
            }
            if (p[a + 60 >> 2] != (c | 0)) {
             p[a + 60 >> 2] = c;
             m[p[p[a >> 2] + 60 >> 2]](a);
            }
            return;
           }
           if (p[a + 56 >> 2] != (c | 0)) {
            p[a + 56 >> 2] = c;
            m[p[p[a >> 2] + 64 >> 2]](a);
           }
           return;
          }
          if (p[a + 128 >> 2] != (c | 0)) {
           p[a + 128 >> 2] = c;
           m[p[p[a >> 2] + 84 >> 2]](a);
          }
          return;
         }
         if (p[a + 164 >> 2] != (c | 0)) {
          p[a + 164 >> 2] = c;
          m[p[p[a >> 2] + 112 >> 2]](a);
         }
         return;
        }
        if (p[a + 64 >> 2] != (c | 0)) {
         p[a + 64 >> 2] = c;
         m[p[p[a >> 2] + 56 >> 2]](a);
        }
        return;
       }
       if (p[a + 68 >> 2] != (c | 0)) {
        p[a + 68 >> 2] = c;
        m[p[p[a >> 2] + 60 >> 2]](a);
       }
       return;
      }
      if (p[a + 72 >> 2] != (c | 0)) {
       p[a + 72 >> 2] = c;
       m[p[p[a >> 2] + 64 >> 2]](a);
      }
      return;
     }
     if (p[a + 76 >> 2] != (c | 0)) {
      p[a + 76 >> 2] = c;
      m[p[p[a >> 2] + 68 >> 2]](a);
     }
    }
    return;
   }
   Yd(a, c);
   return;
  }
  if (p[a + 52 >> 2] != (c | 0)) {
   p[a + 52 >> 2] = c;
   m[p[p[a >> 2] + 52 >> 2]](a);
  }
  return;
 }
 if (p[a + 4 >> 2] != (c | 0)) {
  p[a + 4 >> 2] = c;
  m[p[p[a >> 2] + 28 >> 2]](a);
 }
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
   if (d >>> 0 < s[4926]) {
    break a;
   }
   a = a + c | 0;
   if (p[4927] != (d | 0)) {
    if (c >>> 0 <= 255) {
     e = p[d + 8 >> 2];
     c = c >>> 3 | 0;
     b = p[d + 12 >> 2];
     if ((b | 0) == (e | 0)) {
      i = 19688, j = p[4922] & uv(c), p[i >> 2] = j;
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
    b = (e << 2) + 19992 | 0;
    e : {
     if (p[b >> 2] == (d | 0)) {
      p[b >> 2] = c;
      if (c) {
       break e;
      }
      i = 19692, j = p[4923] & uv(e), p[i >> 2] = j;
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
   p[4924] = a;
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
    if (p[4928] == (f | 0)) {
     p[4928] = d;
     a = p[4925] + a | 0;
     p[4925] = a;
     p[d + 4 >> 2] = a | 1;
     if (p[4927] != (d | 0)) {
      break a;
     }
     p[4924] = 0;
     p[4927] = 0;
     return;
    }
    if (p[4927] == (f | 0)) {
     p[4927] = d;
     a = p[4924] + a | 0;
     p[4924] = a;
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
       i = 19688, j = p[4922] & uv(c), p[i >> 2] = j;
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
     b = (e << 2) + 19992 | 0;
     j : {
      if (p[b >> 2] == (f | 0)) {
       p[b >> 2] = c;
       if (c) {
        break j;
       }
       i = 19692, j = p[4923] & uv(e), p[i >> 2] = j;
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
    if (p[4927] != (d | 0)) {
     break f;
    }
    p[4924] = a;
    return;
   }
   p[f + 4 >> 2] = c & -2;
   p[d + 4 >> 2] = a | 1;
   p[a + d >> 2] = a;
  }
  if (a >>> 0 <= 255) {
   a = a >>> 3 | 0;
   c = (a << 3) + 19728 | 0;
   b = p[4922];
   a = 1 << a;
   k : {
    if (!(b & a)) {
     p[4922] = a | b;
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
  g = (b << 2) + 19992 | 0;
  m : {
   n : {
    e = p[4923];
    c = 1 << b;
    o : {
     if (!(e & c)) {
      p[4923] = c | e;
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
  a = p[4930] + -1 | 0;
  p[4930] = a;
  if (a) {
   break a;
  }
  d = 20144;
  while (1) {
   a = p[d >> 2];
   d = a + 8 | 0;
   if (a) {
    continue;
   }
   break;
  }
  p[4930] = -1;
 }
}
function Ru(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, m = 0, n = 0, o = 0, q = 0, r = 0, s = 0, t = 0, w = 0, y = 0;
 g = sa - 560 | 0;
 sa = g;
 e = c;
 c = (c + -3 | 0) / 24 | 0;
 q = (c | 0) > 0 ? c : 0;
 k = e + v(q, -24) | 0;
 i = p[3696];
 if ((i | 0) >= 0) {
  e = i + 1 | 0;
  c = q;
  while (1) {
   u[(g + 320 | 0) + (f << 3) >> 3] = (c | 0) < 0 ? 0 : +p[(c << 2) + 14800 >> 2];
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
   d = Pd(d, m);
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
    d = d - Pd(1, m);
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
     u[(g + 320 | 0) + (h << 3) >> 3] = p[(q + e << 2) + 14800 >> 2];
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
  d = Pd(d, 0 - m | 0);
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
 d = Pd(1, k);
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
    d = d + u[(c << 3) + 17568 >> 3] * u[(c + f << 3) + g >> 3];
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
function nc(a) {
 var b = 0;
 a : {
  b : {
   switch (a + -1 | 0) {
   case 47:
    a = _a(Na(68), 0, 68);
    Tg(a);
    break a;
   case 24:
    a = Na(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    vc(a);
    p[a + 4 >> 2] = 0;
    p[a >> 2] = 7200;
    p[a >> 2] = 1084;
    ab(a + 8 | 0);
    break a;
   case 25:
    a = Na(20);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    vc(a);
    p[a + 4 >> 2] = 0;
    p[a >> 2] = 7240;
    p[a >> 2] = 1192;
    ab(a + 8 | 0);
    break a;
   case 49:
    a = Na(28);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 24 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 20 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ne(a);
    p[a + 24 >> 2] = 0;
    p[a >> 2] = 7280;
    p[a >> 2] = 1476;
    break a;
   case 26:
    a = Na(16);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    qg(a);
    break a;
   case 27:
    a = _a(Na(64), 0, 64);
    vc(a);
    p[a + 12 >> 2] = 1058306785;
    p[a + 16 >> 2] = 1065353216;
    p[a + 4 >> 2] = 1054280253;
    p[a + 8 >> 2] = 0;
    p[a >> 2] = 7428;
    p[a >> 2] = 1032;
    break a;
   case 29:
    a = Na(28);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 24 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 20 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ne(a);
    p[a + 24 >> 2] = 0;
    p[a >> 2] = 7480;
    p[a >> 2] = 1416;
    break a;
   case 36:
    a = Na(28);
    p[a >> 2] = 0;
    p[a + 4 >> 2] = 0;
    p[a + 24 >> 2] = 0;
    p[a + 16 >> 2] = 0;
    p[a + 20 >> 2] = 0;
    p[a + 8 >> 2] = 0;
    p[a + 12 >> 2] = 0;
    ne(a);
    p[a + 24 >> 2] = 0;
    p[a >> 2] = 7540;
    p[a >> 2] = 1356;
    break a;
   case 30:
    a = _a(Na(56), 0, 56);
    eo(a);
    p[a >> 2] = 1536;
    ab(a + 44 | 0);
    break a;
   case 21:
    a = _a(Na(100), 0, 100);
    pg(a);
    break a;
   case 16:
    a = _a(Na(100), 0, 100);
    pg(a);
    p[a + 68 >> 2] = 7840;
    p[a >> 2] = 7756;
    p[a + 68 >> 2] = 10976;
    p[a >> 2] = 10892;
    break a;
   case 23:
    a = _a(Na(76), 0, 76);
    hg(a);
    n[a + 68 | 0] = 1;
    p[a + 64 >> 2] = 0;
    p[a + 56 >> 2] = 1065353216;
    p[a + 60 >> 2] = 0;
    p[a >> 2] = 7852;
    p[a + 72 >> 2] = 0;
    p[a >> 2] = 11136;
    break a;
   case 17:
    a = _a(Na(64), 0, 64);
    Wb(a);
    p[a + 48 >> 2] = -9145228;
    p[a >> 2] = 8e3;
    b = lg(a + 52 | 0);
    p[a >> 2] = 11060;
    p[b >> 2] = 11124;
    break a;
   case 18:
    a = _a(Na(56), 0, 56);
    Wb(a);
    p[a + 48 >> 2] = -1;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 8060;
    p[a >> 2] = 10664;
    break a;
   case 46:
    a = Na(76);
    Om(a);
    break a;
   case 19:
    a = _a(Na(60), 0, 60);
    hg(a);
    p[a + 56 >> 2] = 0;
    p[a >> 2] = 8124;
    p[a >> 2] = 10588;
    break a;
   case 1:
    a = _a(Na(128), 0, 128);
    Xe(a);
    break a;
   case 2:
    a = _a(Na(192), 0, 192);
    jo(a);
    break a;
   case 4:
    a = _a(Na(64), 0, 64);
    Ub(a);
    break a;
   case 33:
    a = _a(Na(92), 0, 92);
    We(a);
    p[a + 88 >> 2] = 0;
    p[a + 80 >> 2] = 0;
    p[a + 84 >> 2] = 0;
    p[a >> 2] = 8396;
    p[a >> 2] = 2464;
    break a;
   case 15:
    a = _a(Na(160), 0, 160);
    Vh(a);
    n[a + 148 | 0] = 0;
    p[a >> 2] = 8484;
    b = a + 152 | 0;
    p[b + 4 >> 2] = 0;
    p[b >> 2] = 8592;
    p[a >> 2] = 4496;
    p[b >> 2] = 4608;
    break a;
   case 6:
    a = Na(424);
    _p(a);
    break a;
   case 34:
    a = _a(Na(88), 0, 88);
    We(a);
    p[a + 80 >> 2] = 0;
    p[a + 84 >> 2] = 0;
    p[a >> 2] = 8604;
    p[a >> 2] = 2644;
    break a;
   case 7:
    a = Na(356);
    xp(a);
    break a;
   case 3:
    a = Na(548);
    Ur(a);
    break a;
   case 41:
    a = _a(Na(80), 0, 80);
    Wb(a);
    n[a + 56 | 0] = 1;
    p[a + 48 >> 2] = 0;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 8688;
    p[a >> 2] = 2328;
    ab(a + 60 | 0);
    p[a + 72 >> 2] = 0;
    p[a + 76 >> 2] = 0;
    break a;
   case 50:
    a = Na(172);
    hh(a);
    break a;
   case 51:
    a = Na(176);
    hh(a);
    p[a + 172 >> 2] = 1056964608;
    p[a >> 2] = 5656;
    p[a >> 2] = 5516;
    break a;
   case 8:
    a = _a(Na(60), 0, 60);
    Wb(a);
    p[a >> 2] = 8756;
    p[a + 56 >> 2] = 0;
    p[a + 48 >> 2] = 0;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 4372;
    break a;
   case 5:
    a = _a(Na(96), 0, 96);
    Zc(a);
    break a;
   case 48:
    a = _a(Na(56), 0, 56);
    wc(a);
    p[a + 48 >> 2] = 0;
    p[a >> 2] = 8812;
    p[a + 52 >> 2] = 0;
    p[a >> 2] = 6556;
    break a;
   case 0:
    a = _a(Na(168), 0, 168);
    io(a);
    break a;
   case 22:
    a = Na(4);
    p[a >> 2] = 0;
    vc(a);
    p[a >> 2] = 9e3;
    p[a >> 2] = 8964;
    break a;
   case 44:
    a = _a(Na(64), 0, 64);
    og(a);
    break a;
   case 39:
    a = _a(Na(136), 0, 136);
    ng(a);
    break a;
   case 40:
    a = _a(Na(144), 0, 144);
    ng(a);
    p[a + 136 >> 2] = 0;
    p[a + 140 >> 2] = 0;
    p[a >> 2] = 9356;
    p[a >> 2] = 1912;
    break a;
   case 42:
    a = _a(Na(116), 0, 116);
    ho(a);
    break a;
   case 43:
    a = _a(Na(104), 0, 104);
    bo(a);
    p[a >> 2] = 2156;
    rb(a + 76 | 0);
    p[a + 100 >> 2] = 0;
    break a;
   case 45:
    b = Na(96);
    go(_a(b, 0, 96));
    break;
   default:
    break b;
   }
  }
  return b;
 }
 return a;
}
function Jq(a, b, c) {
 var d = 0, e = w(0), f = 0, g = 0, h = w(0), i = 0, j = 0, k = 0, l = w(0), n = 0, o = w(0), q = w(0), r = w(0), s = w(0), u = w(0), v = 0, x = w(0), y = 0, z = w(0), A = 0, B = 0, C = w(0), D = w(0), E = w(0), F = w(0), G = w(0), H = w(0);
 d = sa - 144 | 0;
 sa = d;
 m[p[p[a >> 2] + 8 >> 2]](a);
 v = cb(c);
 a : {
  if (v >>> 0 < 2) {
   break a;
  }
  f = p[Ta(c, 0) >> 2];
  y = Xc(f);
  b : {
   if (y) {
    g = Ib(d - -64 | 0, Nd(f));
    q = t[Ja(g, 0) >> 2];
    r = t[Ja(g, 1) >> 2];
    g = Ib(d + 136 | 0, Ze(f));
    e = t[Ja(g, 0) >> 2];
    l = t[Ja(g, 1) >> 2];
    bc(d + 128 | 0, f);
    s = t[Ja(d + 128 | 0, 0) >> 2];
    u = t[Ja(d + 128 | 0, 1) >> 2];
    m[p[p[a >> 2] + 20 >> 2]](a, s, u);
    break b;
   }
   i = nh(d - -64 | 0, f);
   e = t[i + 60 >> 2];
   t[d + 60 >> 2] = e;
   c : {
    if (!(e > w(0) ^ 1)) {
     g = p[Ta(c, v + -1 | 0) >> 2];
     bc(d + 136 | 0, i);
     f = db(d + 128 | 0);
     d : {
      if (Xc(g)) {
       Ib(d + 48 | 0, Ze(g));
       break d;
      }
      bc(d + 48 | 0, g);
     }
     ad(f, d + 48 | 0, d + 136 | 0);
     e = Od(f);
     t[d + 44 >> 2] = e;
     g = Ja(f, 0);
     t[g >> 2] = t[g >> 2] / e;
     e = t[d + 44 >> 2];
     g = Ja(f, 1);
     t[g >> 2] = t[g >> 2] / e;
     j = p[Ta(c, 1) >> 2];
     g = db(d + 48 | 0);
     e : {
      if (Xc(j)) {
       Ib(d + 32 | 0, Nd(j));
       break e;
      }
      bc(d + 32 | 0, j);
     }
     ad(g, d + 32 | 0, d + 136 | 0);
     e = Od(g);
     t[d + 28 >> 2] = e;
     j = Ja(g, 0);
     t[j >> 2] = t[j >> 2] / e;
     e = t[d + 28 >> 2];
     j = Ja(g, 1);
     t[j >> 2] = t[j >> 2] / e;
     e = t[Ed(d + 44 | 0, Ed(d + 28 | 0, d + 60 | 0)) >> 2];
     j = db(d + 32 | 0);
     Pb(j, d + 136 | 0, f, e);
     q = t[Ja(j, 0) >> 2];
     r = t[Ja(j, 1) >> 2];
     m[p[p[a >> 2] + 20 >> 2]](a, q, r);
     j = db(d + 16 | 0);
     l = w(e * w(.44771522283554077));
     Pb(j, d + 136 | 0, f, l);
     f = db(d + 8 | 0);
     Pb(f, d + 136 | 0, g, l);
     n = db(d);
     Pb(n, d + 136 | 0, g, e);
     h = t[Ja(j, 0) >> 2];
     o = t[Ja(j, 1) >> 2];
     s = t[Ja(f, 0) >> 2];
     u = t[Ja(f, 1) >> 2];
     e = t[Ja(n, 0) >> 2];
     l = t[Ja(n, 1) >> 2];
     m[p[p[a >> 2] + 28 >> 2]](a, h, o, s, u, e, l);
     break c;
    }
    bc(d + 136 | 0, i);
    q = t[Ja(d + 136 | 0, 0) >> 2];
    r = t[Ja(d + 136 | 0, 1) >> 2];
    m[p[p[a >> 2] + 20 >> 2]](a, q, r);
    l = r;
    e = q;
   }
   eb(i);
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
    i = p[Ta(c, j) >> 2];
    g = Xc(i);
    f : {
     if (g) {
      f = Ib(d - -64 | 0, Nd(i));
      bc(d + 136 | 0, i);
      B = a, C = e, D = l, E = t[Ja(f, 0) >> 2], F = t[Ja(f, 1) >> 2], G = t[Ja(d + 136 | 0, 0) >> 2], H = t[Ja(d + 136 | 0, 1) >> 2], A = p[p[a >> 2] + 28 >> 2], m[A](B | 0, w(C), w(D), w(E), w(F), w(G), w(H));
      f = Ib(d + 128 | 0, Ze(i));
      e = t[Ja(f, 0) >> 2];
      l = t[Ja(f, 1) >> 2];
      break f;
     }
     nh(d - -64 | 0, i);
     bc(d + 136 | 0, d - -64 | 0);
     h = t[(d - -64 | 0) + 60 >> 2];
     t[d + 60 >> 2] = h;
     g : {
      if (!(h > w(0) ^ 1)) {
       n = db(d + 128 | 0);
       ad(n, $a(d + 48 | 0, e, l), d + 136 | 0);
       h = Od(n);
       t[d + 44 >> 2] = h;
       i = Ja(n, 0);
       t[i >> 2] = t[i >> 2] / h;
       h = t[d + 44 >> 2];
       i = Ja(n, 1);
       t[i >> 2] = t[i >> 2] / h;
       k = p[Ta(c, (j + 1 >>> 0) % (v >>> 0) | 0) >> 2];
       i = db(d + 48 | 0);
       h : {
        if (Xc(k)) {
         Ib(d + 32 | 0, Nd(k));
         break h;
        }
        bc(d + 32 | 0, k);
       }
       ad(i, d + 32 | 0, d + 136 | 0);
       h = Od(i);
       t[d + 28 >> 2] = h;
       k = Ja(i, 0);
       t[k >> 2] = t[k >> 2] / h;
       h = t[d + 28 >> 2];
       k = Ja(i, 1);
       t[k >> 2] = t[k >> 2] / h;
       h = t[Ed(d + 44 | 0, Ed(d + 28 | 0, d + 60 | 0)) >> 2];
       k = db(d + 32 | 0);
       Pb(k, d + 136 | 0, n, h);
       o = t[Ja(k, 0) >> 2];
       x = t[Ja(k, 1) >> 2];
       i : {
        if (f & 1) {
         B = a, H = e, G = l, F = o, E = x, D = t[Ja(k, 0) >> 2], C = t[Ja(k, 1) >> 2], A = p[p[a >> 2] + 28 >> 2], m[A](B | 0, w(H), w(G), w(F), w(E), w(D), w(C));
         break i;
        }
        m[p[p[a >> 2] + 24 >> 2]](a, o, x);
       }
       f = db(d + 16 | 0);
       e = w(h * w(.44771522283554077));
       Pb(f, d + 136 | 0, n, e);
       n = db(d + 8 | 0);
       Pb(n, d + 136 | 0, i, e);
       k = db(d);
       Pb(k, d + 136 | 0, i, h);
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
     eb(d - -64 | 0);
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
function rp(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, n = 0;
 b = sa - 192 | 0;
 sa = b;
 c = a + 76 | 0;
 l = a, n = Uc(c, 0), p[l + 156 >> 2] = n;
 l = a, n = Uc(c, 0), p[l + 160 >> 2] = n;
 f = a + 92 | 0;
 l = b, n = Oa(f), p[l + 80 >> 2] = n;
 l = b, n = Pa(f), p[l + 40 >> 2] = n;
 g = a + 72 | 0;
 while (1) {
  a : {
   d = Ra(b + 80 | 0, b + 40 | 0);
   if (!d) {
    break a;
   }
   c = p[p[b + 80 >> 2] >> 2];
   if (c) {
    c = m[p[p[c >> 2] + 20 >> 2]](c, g) | 0;
    if (!Ad(c)) {
     break a;
    }
   }
   Qa(b + 80 | 0);
   continue;
  }
  break;
 }
 b : {
  if (d) {
   break b;
  }
  h = a + 104 | 0;
  l = b, n = Oa(h), p[l + 80 >> 2] = n;
  l = b, n = Pa(h), p[l + 40 >> 2] = n;
  while (1) {
   c : {
    e = Ra(b + 80 | 0, b + 40 | 0);
    if (!e) {
     d = c;
     break c;
    }
    d = p[p[b + 80 >> 2] >> 2];
    d = m[p[p[d >> 2] + 20 >> 2]](d, g) | 0;
    if (!Ad(d)) {
     break c;
    }
    Qa(b + 80 | 0);
    continue;
   }
   break;
  }
  if (e) {
   c = d;
   break b;
  }
  i = Ug(b + 168 | 0);
  l = b, n = Oa(f), p[l + 80 >> 2] = n;
  l = b, n = Pa(f), p[l + 40 >> 2] = n;
  k = p[4408];
  while (1) {
   d : {
    j = Ra(b + 80 | 0, b + 40 | 0);
    if (!j) {
     e = d;
     break d;
    }
    c = p[p[b + 80 >> 2] >> 2];
    e : {
     if (!c) {
      break e;
     }
     e = m[p[p[c >> 2] + 24 >> 2]](c, g) | 0;
     if (!Ad(e)) {
      break d;
     }
     if (!(m[p[p[c >> 2] + 12 >> 2]](c, 49) | 0)) {
      break e;
     }
     e = m[p[p[a >> 2] + 72 >> 2]](a, p[c + 16 >> 2]) | 0;
     p[b + 24 >> 2] = e;
     if (e) {
      l = qp(i, b + 24 | 0), n = c, p[l >> 2] = n;
      break e;
     }
     p[b >> 2] = p[c + 16 >> 2];
     jb(k, 6196, b);
    }
    Qa(b + 80 | 0);
    continue;
   }
   break;
  }
  f : {
   if (j) {
    c = e;
    break f;
   }
   l = b, n = Oa(h), p[l + 80 >> 2] = n;
   l = b, n = Pa(h), p[l + 40 >> 2] = n;
   while (1) {
    g : {
     d = Ra(b + 80 | 0, b + 40 | 0);
     if (!d) {
      c = e;
      break g;
     }
     c = p[p[b + 80 >> 2] >> 2];
     c = m[p[p[c >> 2] + 24 >> 2]](c, g) | 0;
     if (!Ad(c)) {
      break g;
     }
     Qa(b + 80 | 0);
     continue;
    }
    break;
   }
   if (d) {
    break f;
   }
   l = b, n = Oa(f), p[l + 80 >> 2] = n;
   l = b, n = Pa(f), p[l + 40 >> 2] = n;
   d = a + 128 | 0;
   while (1) {
    h : {
     i : {
      if (!Ra(b + 80 | 0, b + 40 | 0)) {
       pp(a);
       d = Tg(b + 80 | 0);
       l = b, n = Oa(f), p[l + 40 >> 2] = n;
       l = b, n = Pa(f), p[l + 24 >> 2] = n;
       break i;
      }
      c = p[p[b + 80 >> 2] >> 2];
      if (!c) {
       break h;
      }
      if (m[p[p[c >> 2] + 12 >> 2]](c, 10) | 0) {
       m[p[p[c >> 2] + 36 >> 2]](c);
      }
      if (!ff(c)) {
       break h;
      }
      p[b + 24 >> 2] = c;
      pc(d, b + 24 | 0);
      c = p[b + 24 >> 2];
      while (1) {
       if (!c) {
        break h;
       }
       p[b + 152 >> 2] = c;
       l = b, n = op(i, b + 152 | 0), p[l + 160 >> 2] = n;
       l = b, n = Sg(), p[l + 152 >> 2] = n;
       if (xe(b + 160 | 0, b + 152 | 0)) {
        c = yd(b + 160 | 0);
        p[p[b + 24 >> 2] + 144 >> 2] = p[c + 4 >> 2];
        break h;
       } else {
        c = p[c + 20 >> 2];
        continue;
       }
      }
     }
     while (1) {
      j : {
       k : {
        if (!Ra(b + 40 | 0, b + 24 | 0)) {
         e = Rg(b + 40 | 0);
         c = ab(b + 24 | 0);
         Ag(e, d, c);
         l = b, n = Oa(c), p[l + 160 >> 2] = n;
         Qg(b + 160 | 0);
         a = a + 140 | 0;
         while (1) {
          l = b, n = Pa(c), p[l + 152 >> 2] = n;
          if (!Ra(b + 160 | 0, b + 152 | 0)) {
           break k;
          }
          l = b, n = Qg(b + 160 | 0), p[l + 16 >> 2] = n;
          p[b + 152 >> 2] = p[p[b + 16 >> 2] >> 2];
          np(a, b + 152 | 0);
          continue;
         }
        }
        c = p[p[b + 40 >> 2] >> 2];
        if (!c) {
         break j;
        }
        if (!zd(c)) {
         break j;
        }
        Tb(d, c);
        g = p[p[c + 56 >> 2] + 144 >> 2];
        if (!g) {
         break j;
        }
        l = b, n = Oa(f), p[l + 160 >> 2] = n;
        l = b, n = Pa(f), p[l + 152 >> 2] = n;
        while (1) {
         if (!Ra(b + 160 | 0, b + 152 | 0)) {
          break j;
         }
         e = p[p[b + 160 >> 2] >> 2];
         if (!(!zd(e) | (g | 0) != p[e + 20 >> 2])) {
          Tb(e, c);
         }
         Qa(b + 160 | 0);
         continue;
        }
       }
       fb(c);
       Pg(e);
       eb(d);
       c = 0;
       break f;
      }
      Qa(b + 40 | 0);
      continue;
     }
    }
    Qa(b + 80 | 0);
    continue;
   }
  }
  vd(i);
 }
 sa = b + 192 | 0;
 return c & 255;
}
function de(a, b, c) {
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
            Va(e, a);
            return;
           }
           ce(e, e + 4 | 0, e + 8 | 0, b + -4 | 0, c);
           return;
          }
          be(e, e + 4 | 0, e + 8 | 0, e + 12 | 0, b + -4 | 0, c);
          return;
         }
         if ((a | 0) <= 123) {
          an(e, b, c);
          return;
         }
         f = ((d | 0) / 2 << 2) + e | 0;
         l : {
          if ((a | 0) >= 3997) {
           a = (d | 0) / 4 << 2;
           a = be(e, a + e | 0, f, a + f | 0, h, c);
           break l;
          }
          a = Dc(e, f, h, c);
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
              Va(d, h);
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
          Va(e, a);
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
           Va(g, a);
           f = (f | 0) == (g | 0) ? a : f;
           i = i + 1 | 0;
           continue;
          }
         }
        }
        Dc(e, e + 4 | 0, b + -4 | 0, c);
        break c;
       }
       m : {
        if ((d | 0) == (f | 0)) {
         break m;
        }
        if (!(m[p[c >> 2]](p[f >> 2], p[d >> 2]) | 0)) {
         break m;
        }
        Va(d, f);
        i = i + 1 | 0;
       }
       if (!i) {
        g = _f(e, d, c);
        a = d + 4 | 0;
        if (_f(a, b, c)) {
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
        de(e, d, c);
        a = d + 4 | 0;
        continue b;
       }
       de(d + 4 | 0, b, c);
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
        Va(a, f);
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
function Pe(a, b, c, d, e, f) {
 var g = 0, h = w(0), i = 0, j = 0, k = 0, l = 0, n = w(0), o = 0, r = 0, s = w(0), u = 0, v = 0, x = 0, y = w(0), z = w(0), A = w(0), B = w(0), C = w(0), D = w(0);
 g = sa + -64 | 0;
 sa = g;
 l = Gh(a + 40 | 0, b);
 o = q[l | 0];
 a : {
  if (!o) {
   a = a + 16 | 0;
   b = kb(a, q[l + 1 | 0] + -1 | 0);
   j = kb(a, q[l + 1 | 0]);
   a = db(g);
   ad(a, j, b);
   if (e) {
    e = db(g + 56 | 0);
    Pb(e, b, a, c);
    x = f, y = t[Ja(e, 0) >> 2], z = t[Ja(e, 1) >> 2], v = p[p[f >> 2] + 20 >> 2], m[v](x | 0, w(y), w(z));
   }
   Pb(a, b, a, d);
   x = f, z = t[Ja(a, 0) >> 2], y = t[Ja(a, 1) >> 2], v = p[p[f >> 2] + 24 >> 2], m[v](x | 0, w(z), w(y));
   break a;
  }
  j = o + -1 | 0;
  u = q[l + 2 | 0];
  n = t[Ta(a + 52 | 0, b) >> 2];
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
    c = Fh(t[kb(i, r) >> 2], t[k >> 2], w(w(h - c) / w(s - c)));
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
   h = Fh(t[kb(i, b) >> 2], t[k >> 2], w(w(n - d) / w(h - d)));
  }
  j = g + 48 | 0;
  b = g;
  while (1) {
   b = db(b) + 8 | 0;
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
   Hd(b, j, i, a, h, g);
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
  Hd(b, j, i, a, c, g);
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
  Hd(b, g + 32 | 0, g + 16 | 0, a, w(w(h - c) / w(w(1) - c)), g);
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
function Tj(a, b, c) {
 a : {
  switch (b + -7 | 0) {
  case 56:
   if (t[a + 4 >> 2] != c) {
    t[a + 4 >> 2] = c;
    m[p[p[a >> 2] + 28 >> 2]](a);
   }
   return;
  case 57:
   if (t[a + 8 >> 2] != c) {
    t[a + 8 >> 2] = c;
    m[p[p[a >> 2] + 32 >> 2]](a);
   }
   return;
  case 58:
   if (t[a + 12 >> 2] != c) {
    t[a + 12 >> 2] = c;
    m[p[p[a >> 2] + 36 >> 2]](a);
   }
   return;
  case 59:
   if (t[a + 16 >> 2] != c) {
    t[a + 16 >> 2] = c;
    m[p[p[a >> 2] + 40 >> 2]](a);
   }
   return;
  case 63:
   if (t[a + 24 >> 2] != c) {
    t[a + 24 >> 2] = c;
    m[p[p[a >> 2] + 48 >> 2]](a);
   }
   return;
  case 51:
   if (t[a + 24 >> 2] != c) {
    t[a + 24 >> 2] = c;
    m[p[p[a >> 2] + 40 >> 2]](a);
   }
   return;
  case 40:
   if (t[a + 56 >> 2] != c) {
    t[a + 56 >> 2] = c;
    m[p[p[a >> 2] + 64 >> 2]](a);
   }
   return;
  case 6:
   Sd(a, c);
   return;
  case 7:
   Li(a, c);
   return;
  case 74:
   Ki(a, c);
   return;
  case 13:
   if (t[a + 148 >> 2] != c) {
    t[a + 148 >> 2] = c;
    m[p[p[a >> 2] + 96 >> 2]](a);
   }
   return;
  case 14:
   if (t[a + 152 >> 2] != c) {
    t[a + 152 >> 2] = c;
    m[p[p[a >> 2] + 100 >> 2]](a);
   }
   return;
  case 116:
   if (t[a + 156 >> 2] != c) {
    t[a + 156 >> 2] = c;
    m[p[p[a >> 2] + 104 >> 2]](a);
   }
   return;
  case 117:
   if (t[a + 160 >> 2] != c) {
    t[a + 160 >> 2] = c;
    m[p[p[a >> 2] + 108 >> 2]](a);
   }
   return;
  case 24:
   if (t[a + 164 >> 2] != c) {
    t[a + 164 >> 2] = c;
    m[p[p[a >> 2] + 112 >> 2]](a);
   }
   return;
  case 119:
   if (t[a + 168 >> 2] != c) {
    t[a + 168 >> 2] = c;
    m[p[p[a >> 2] + 116 >> 2]](a);
   }
   return;
  case 120:
   if (t[a + 172 >> 2] != c) {
    t[a + 172 >> 2] = c;
    m[p[p[a >> 2] + 128 >> 2]](a);
   }
   return;
  case 79:
   Ki(a, c);
   return;
  case 80:
   if (t[a + 92 >> 2] != c) {
    t[a + 92 >> 2] = c;
    m[p[p[a >> 2] + 80 >> 2]](a);
   }
   return;
  case 82:
   Sd(a, c);
   return;
  case 83:
   Hi(a, c);
   return;
  case 84:
   Fi(a, c);
   return;
  case 94:
   if (t[a + 72 >> 2] != c) {
    t[a + 72 >> 2] = c;
    m[p[p[a >> 2] + 72 >> 2]](a);
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
   Xi(a, c);
   return;
  case 3:
  case 11:
  case 19:
  case 28:
  case 91:
  case 100:
   Kc(a, c);
   return;
  case 4:
  case 39:
  case 92:
  case 101:
   if (t[a + 64 >> 2] != c) {
    t[a + 64 >> 2] = c;
    m[p[p[a >> 2] + 64 >> 2]](a);
   }
   return;
  case 72:
  case 75:
  case 77:
   if (t[a + 80 >> 2] != c) {
    t[a + 80 >> 2] = c;
    m[p[p[a >> 2] + 68 >> 2]](a);
   }
   return;
  case 73:
  case 76:
  case 78:
   if (t[a + 84 >> 2] != c) {
    t[a + 84 >> 2] = c;
    m[p[p[a >> 2] + 72 >> 2]](a);
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
  m[p[p[a >> 2] + 68 >> 2]](a);
 }
}
function vo(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0, n = 0, o = 0, q = 0, r = 0, s = 0, u = 0, v = 0, x = 0, y = 0, z = 0, A = 0, B = 0, C = 0, D = 0;
 f = sa - 16 | 0;
 sa = f;
 d = to(b, c);
 p[a >> 2] = d;
 a : {
  b : {
   if (!d) {
    ed(6795, 43, p[4408]);
    break b;
   }
   s = a + 4 | 0;
   u = bb(b);
   v = ta;
   c : while (1) {
    a = 0;
    if ((q | 0) == (u | 0) & (r | 0) == (v | 0)) {
     break a;
    }
    d = bb(b);
    a = ta;
    h = a;
    if (!(a | d)) {
     ed(6839, 57, p[4408]);
     break b;
    }
    a = so(b, c);
    p[f + 12 >> 2] = a;
    if (!a) {
     ed(6897, 37, p[4408]);
     break b;
    }
    pc(s, f + 12 | 0);
    a = p[f + 12 >> 2];
    Ng(a, a);
    e = 1;
    a = 0;
    while (1) if ((d | 0) == (e | 0) & (a | 0) == (h | 0)) {
     j = 0;
     d = 0;
     x = bb(b);
     y = ta;
     while (1) {
      d : {
       if ((j | 0) == (x | 0) & (d | 0) == (y | 0)) {
        if (!rp(p[f + 12 >> 2])) {
         break d;
        }
        break b;
       }
       e : {
        g = ro(b, c);
        if (!g) {
         break e;
        }
        jp(p[f + 12 >> 2], g);
        if ((m[p[p[g >> 2] + 8 >> 2]](g) | 0) != 31) {
         break e;
        }
        k = 0;
        h = 0;
        z = bb(b);
        A = ta;
        while (1) {
         if ((k | 0) == (z | 0) & (h | 0) == (A | 0)) {
          break e;
         }
         f : {
          l = qo(b, c);
          if (!l) {
           break f;
          }
          zt(g, l);
          n = 0;
          a = bb(b);
          B = (a | 0) > 0 ? a : 0;
          while (1) {
           if ((n | 0) == (B | 0)) {
            break f;
           }
           g : {
            o = po(b, c);
            if (!o) {
             break g;
            }
            ai(l, o);
            e = 0;
            a = 0;
            C = bb(b);
            D = ta;
            while (1) {
             if ((e | 0) == (C | 0) & (a | 0) == (D | 0)) {
              break g;
             }
             i = oo(b, c);
             if (i) {
              t[i + 20 >> 2] = w(p[i + 4 >> 2]) / w(p[g + 16 >> 2]);
              ai(o, i);
             }
             e = e + 1 | 0;
             if (e >>> 0 < 1) {
              a = a + 1 | 0;
             }
             continue;
            }
           }
           n = n + 1 | 0;
           continue;
          }
         }
         a = k + 1 | 0;
         if (a >>> 0 < 1) {
          h = h + 1 | 0;
         }
         k = a;
         continue;
        }
       }
       a = j + 1 | 0;
       if (a >>> 0 < 1) {
        d = d + 1 | 0;
       }
       j = a;
       continue;
      }
      break;
     }
     a = r;
     d = q + 1 | 0;
     if (d >>> 0 < 1) {
      a = a + 1 | 0;
     }
     q = d;
     r = a;
     continue c;
    } else {
     g = no(b, c);
     Ng(p[f + 12 >> 2], g);
     e = e + 1 | 0;
     if (e >>> 0 < 1) {
      a = a + 1 | 0;
     }
     continue;
    }
   }
  }
  a = 2;
 }
 sa = f + 16 | 0;
 return a;
}
function kp(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0;
 c = sa - 16 | 0;
 sa = c;
 e = a + 140 | 0;
 h = c, i = Oa(e), p[h + 8 >> 2] = i;
 h = c, i = Pa(e), p[h >> 2] = i;
 while (1) {
  if (Ra(c + 8 | 0, c)) {
   b = p[p[c + 8 >> 2] >> 2];
   p[b + 60 >> 2] = 0;
   p[b + 64 >> 2] = 0;
   Qa(c + 8 | 0);
   continue;
  } else {
   p[a + 164 >> 2] = 0;
   b = a + 128 | 0;
   h = c, i = Oa(b), p[h + 8 >> 2] = i;
   h = c, i = Pa(b), p[h >> 2] = i;
   while (1) {
    if (Ra(c + 8 | 0, c)) {
     b = p[p[c + 8 >> 2] >> 2];
     d = p[b + 144 >> 2];
     a : {
      if (!(!d | !p[d + 52 >> 2])) {
       d = p[d + 52 >> 2];
       if (!p[d + 60 >> 2]) {
        p[d + 60 >> 2] = b;
        p[d + 64 >> 2] = b;
        p[b + 148 >> 2] = 0;
        p[b + 152 >> 2] = 0;
        break a;
       }
       f = p[d + 64 >> 2];
       p[f + 152 >> 2] = b;
       p[b + 148 >> 2] = f;
       p[d + 64 >> 2] = b;
       p[b + 152 >> 2] = 0;
       break a;
      }
      p[b + 152 >> 2] = 0;
      p[b + 148 >> 2] = g;
      b : {
       if (!g) {
        p[a + 164 >> 2] = b;
        break b;
       }
       p[g + 152 >> 2] = b;
      }
      g = b;
     }
     Qa(c + 8 | 0);
     continue;
    } else {
     h = c, i = Oa(e), p[h + 8 >> 2] = i;
     h = c, i = Pa(e), p[h >> 2] = i;
     while (1) {
      if (Ra(c + 8 | 0, c)) {
       b = p[p[c + 8 >> 2] >> 2];
       c : {
        if (!p[b + 60 >> 2]) {
         break c;
        }
        d = p[b + 56 >> 2];
        d : {
         switch (p[b + 52 >> 2] & 255) {
         case 0:
          e = p[d + 148 >> 2];
          if (e) {
           f = p[b + 60 >> 2];
           p[e + 152 >> 2] = f;
           p[f + 148 >> 2] = e;
          }
          if ((d | 0) == p[a + 164 >> 2]) {
           p[a + 164 >> 2] = p[b + 60 >> 2];
          }
          b = p[b + 64 >> 2];
          p[d + 148 >> 2] = b;
          p[b + 152 >> 2] = d;
          break c;
         case 1:
          break d;
         default:
          break c;
         }
        }
        e = p[d + 152 >> 2];
        if (e) {
         f = p[b + 64 >> 2];
         p[e + 148 >> 2] = f;
         p[f + 152 >> 2] = e;
        }
        g = (d | 0) == (g | 0) ? p[b + 64 >> 2] : g;
        b = p[b + 60 >> 2];
        p[d + 152 >> 2] = b;
        p[b + 148 >> 2] = d;
       }
       Qa(c + 8 | 0);
       continue;
      }
      break;
     }
     p[a + 164 >> 2] = g;
     sa = c + 16 | 0;
    }
    break;
   }
  }
  break;
 }
}
function Qb(a, b, c) {
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
function rv(a, b, c) {
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
function Bu(a, b, c, d) {
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
  Au(i + 16 | 0, a, b, c, e, j + -15233 | 0);
  Cu(i, a, b, c, e, 15361 - j | 0);
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



function Ar(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = w(0), j = 0, k = 0, l = w(0), m = 0, o = 0, r = 0, s = 0, u = w(0);
 c = sa - 32 | 0;
 sa = c;
 a : {
  b : {
   h = a + 52 | 0;
   if (Ue(h)) {
    break b;
   }
   if (!yr(b, a + 80 | 0)) {
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
  Id(h);
  e = a + 28 | 0;
  Ve(e);
  j = a + 16 | 0;
  f = a + 4 | 0;
  xr(j, lb(f));
  g = lb(f);
  g = (g | 0) > 0 ? g : 0;
  while (1) {
   if ((d | 0) == (g | 0)) {
    d = kb(j, 0);
    b = a + 40 | 0;
    r = c, s = Oa(b), p[r + 24 >> 2] = s;
    r = c, s = Pa(b), p[r + 16 >> 2] = s;
    b = 1;
    while (1) {
     if (Ra(c + 24 | 0, c + 16 | 0)) {
      f = p[c + 24 >> 2];
      c : {
       if (!q[f | 0]) {
        k = d;
        d = kb(j, b);
        r = c, u = ei(k, d), t[r + 12 >> 2] = u;
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
       r = c, u = Te(k, m, o, d, w(0), w(0), w(1), e), t[r + 12 >> 2] = u;
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
    hf(kb(j, d), kb(f, d), b);
    d = d + 1 | 0;
    continue;
   }
   break;
  }
 }
 sa = c + 32 | 0;
 return i;
}
function Qe(a, b, c, d, e) {
 var f = 0, g = 0, h = 0, i = 0, j = w(0), k = w(0), l = w(0), n = 0, o = 0, r = 0, s = 0, u = w(0), v = w(0), x = w(0), y = w(0), z = w(0), A = w(0);
 while (1) {
  f = a - -64 | 0;
  if (!Ue(f)) {
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
  f = uc(o);
  i = (f | 0) > 0 ? f : 0;
  h = a + 52 | 0;
  n = f + -1 | 0;
  while (1) {
   if ((g | 0) == (i | 0)) {
    break a;
   }
   j = t[Ta(h, g) >> 2];
   l = w(k + j);
   if (!(l > b)) {
    g = g + 1 | 0;
    k = l;
    continue;
   }
   break;
  }
  if ((g | 0) == -1) {
   break a;
  }
  l = w(w(b - k) / j);
  i = (f | 0) > (g | 0) ? f : g;
  f = g;
  while (1) {
   b : {
    if ((f | 0) == (i | 0)) {
     b = w(1);
    } else {
     j = t[Ta(h, f) >> 2];
     b = w(k + j);
     if (b >= c ^ 1) {
      break b;
     }
     n = f;
     b = w(w(c - k) / j);
    }
    if ((g | 0) == (n | 0)) {
     Pe(a, g, l, b, d, e);
     return;
    }
    Pe(a, g, l, w(1), d, e);
    f = a + 16 | 0;
    while (1) {
     g = g + 1 | 0;
     if ((g | 0) >= (n | 0)) {
      Pe(a, n, w(0), b, 0, e);
      break a;
     }
     h = Gh(o, g);
     i = q[h | 0];
     d = kb(f, q[h + 1 | 0]);
     if (i) {
      i = kb(f, q[h + 1 | 0] + 1 | 0);
      h = kb(f, q[h + 1 | 0] + 2 | 0);
      s = e, u = t[Ja(d, 0) >> 2], v = t[Ja(d, 1) >> 2], x = t[Ja(i, 0) >> 2], y = t[Ja(i, 1) >> 2], z = t[Ja(h, 0) >> 2], A = t[Ja(h, 1) >> 2], r = p[p[e >> 2] + 28 >> 2], m[r](s | 0, w(u), w(v), w(x), w(y), w(z), w(A));
     } else {
      s = e, A = t[Ja(d, 0) >> 2], z = t[Ja(d, 1) >> 2], r = p[p[e >> 2] + 24 >> 2], m[r](s | 0, w(A), w(z));
     }
     continue;
    }
   }
   f = f + 1 | 0;
   k = b;
   continue;
  }
 }
}
function Vf(a, b) {
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
  f = Ei(w(Ei(t[a + 56 >> 2]) + w(1)));
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
     b = cb(i);
     while (1) {
      if (d > w(0) ^ 1) {
       break a;
      }
      j = p[Ta(i, (c | 0) % (b | 0) | 0) >> 2];
      f = t[j + 76 >> 2];
      c : {
       if (!(e < f ^ 1)) {
        Qe(j, e, d, 1, p[a + 68 >> 2]);
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
   l = h, n = Pa(i), p[l >> 2] = n;
   while (1) {
    if (!Ra(h + 8 | 0, h)) {
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
    Qe(b, c ? w(g - e) : g, d, 1, p[a + 68 >> 2]);
    while (1) {
     if (!(d > e ^ 1)) {
      d = w(d - e);
      Qe(b, w(0), d, 0, p[a + 68 >> 2]);
      continue;
     }
     break;
    }
    Qa(h + 8 | 0);
    continue;
   }
  }
  c = p[a + 68 >> 2];
  p[a + 72 >> 2] = c;
 }
 sa = h + 16 | 0;
 return c | 0;
}
function Lo(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 i = re(Wa(b), p[c >> 2]);
 f = Gb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = gb(i, f);
   g = p[Ta(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((gb(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!td(ub(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  Ko(e + 16 | 0, b, i, d);
  c = p[Wa(b) >> 2];
  d = b;
  if (!(w(t[ub(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = Qc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Wa(b) >> 2] + 1 >>> 0) / t[ub(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   Jo(b, p[Ob(e + 12 | 0, e + 8 | 0) >> 2]);
   f = Gb(b);
   h = gb(i, f);
  }
  c = p[Ta(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[b + 8 >> 2] = p[e + 16 >> 2];
    k = Ta(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Ta(b, gb(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = te(e + 16 | 0);
  b = Wa(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  c = e + 16 | 0;
  b = p[c >> 2];
  p[c >> 2] = 0;
  if (b) {
   q[Db(c) + 4 | 0];
   if (b) {
    Ua(b);
   }
  }
 }
 se(a, hb(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function ko(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 Wa(b);
 i = p[c >> 2];
 f = Gb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = gb(i, f);
   g = p[Ta(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((gb(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!Rc(ub(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  Ig(e + 16 | 0, b, i, d);
  c = p[Wa(b) >> 2];
  d = b;
  if (!(w(t[ub(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = Qc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Wa(b) >> 2] + 1 >>> 0) / t[ub(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   Hg(b, p[Ob(e + 12 | 0, e + 8 | 0) >> 2]);
   f = Gb(b);
   h = gb(i, f);
  }
  c = p[Ta(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[c >> 2] = p[e + 16 >> 2];
    k = Ta(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Ta(b, gb(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = te(e + 16 | 0);
  b = Wa(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  Cg(e + 16 | 0);
 }
 se(a, hb(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function mp(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0;
 e = sa - 32 | 0;
 sa = e;
 i = Jg(Wa(b), c);
 f = Gb(b);
 n[e + 31 | 0] = 0;
 a : {
  b : {
   if (!f) {
    break b;
   }
   h = gb(i, f);
   g = p[Ta(b, h) >> 2];
   if (!g) {
    break b;
   }
   while (1) {
    g = p[g >> 2];
    if (!g) {
     break b;
    }
    if (p[g + 4 >> 2] != (i | 0)) {
     if ((gb(p[g + 4 >> 2], f) | 0) != (h | 0)) {
      break b;
     }
    }
    if (!Rc(ub(b), g + 8 | 0, c)) {
     continue;
    }
    break;
   }
   break a;
  }
  Ig(e + 16 | 0, b, i, d);
  c = p[Wa(b) >> 2];
  d = b;
  if (!(w(t[ub(b) >> 2] * w(f >>> 0)) < w(c + 1 >>> 0) ^ 1 ? f : 0)) {
   k = e, l = Qc(f) ^ 1 | f << 1, p[k + 12 >> 2] = l;
   c = e;
   j = w(C(w(w(p[Wa(b) >> 2] + 1 >>> 0) / t[ub(b) >> 2])));
   c : {
    if (j < w(4294967296) & j >= w(0)) {
     f = ~~j >>> 0;
     break c;
    }
    f = 0;
   }
   p[c + 8 >> 2] = f;
   Hg(b, p[Ob(e + 12 | 0, e + 8 | 0) >> 2]);
   f = Gb(b);
   h = gb(i, f);
  }
  c = p[Ta(d, h) >> 2];
  d : {
   if (!c) {
    c = b + 8 | 0;
    p[p[e + 16 >> 2] >> 2] = p[c >> 2];
    p[c >> 2] = p[e + 16 >> 2];
    k = Ta(b, h), l = c, p[k >> 2] = l;
    if (!p[p[e + 16 >> 2] >> 2]) {
     break d;
    }
    c = p[e + 16 >> 2];
    k = Ta(b, gb(p[p[p[e + 16 >> 2] >> 2] + 4 >> 2], f)), l = c, p[k >> 2] = l;
    break d;
   }
   p[p[e + 16 >> 2] >> 2] = p[c >> 2];
   p[c >> 2] = p[e + 16 >> 2];
  }
  g = te(e + 16 | 0);
  b = Wa(b);
  p[b >> 2] = p[b >> 2] + 1;
  n[e + 31 | 0] = 1;
  Cg(e + 16 | 0);
 }
 se(a, hb(e + 16 | 0, g), e + 31 | 0);
 sa = e + 32 | 0;
}
function mm(a, b, c, d, e) {
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
     j = w(yc(d) / g);
     f = w(xc(d) / h);
     break a;
    case 1:
     f = ii(w(yc(d) / g), w(xc(d) / h));
     break b;
    case 2:
     f = ru(w(yc(d) / g), w(xc(d) / h));
     break b;
    case 4:
     f = w(xc(d) / h);
     break b;
    case 3:
     f = w(yc(d) / g);
     break b;
    case 6:
     break c;
    default:
     break a;
    }
   }
   f = ii(w(yc(d) / g), w(xc(d) / h));
   f = f < w(1) ? f : w(1);
  }
  j = f;
 }
 b = rb(i + 72 | 0);
 k = t[Ja(d, 0) >> 2];
 l = yc(d);
 n = t[c >> 2];
 o = yc(d);
 v = Ja(b, 4), x = w(+l * .5 + +k + +w(n * o) * .5), t[v >> 2] = x;
 k = t[Ja(d, 1) >> 2];
 l = xc(d);
 n = t[c + 4 >> 2];
 o = xc(d);
 v = Ja(b, 5), x = w(+l * .5 + +k + +w(n * o) * .5), t[v >> 2] = x;
 d = rb(i + 48 | 0);
 v = Ja(d, 0), x = j, t[v >> 2] = x;
 v = Ja(d, 3), x = f, t[v >> 2] = x;
 e = rb(i + 24 | 0);
 v = Ja(e, 4), x = w(+w(-q) - +g * .5 - +w(g * r) * .5), t[v >> 2] = x;
 v = Ja(e, 5), x = w(+w(-s) - +h * .5 - +w(h * u) * .5), t[v >> 2] = x;
 c = rb(i);
 cd(c, b, d);
 cd(c, c, e);
 m[p[p[a >> 2] + 16 >> 2]](a, c);
 sa = i + 96 | 0;
}
function Di(a, b, c) {
 var d = 0;
 a : {
  if ((a | 0) == (b | 0)) {
   break a;
  }
  if ((b - a | 0) - c >>> 0 <= 0 - (c << 1) >>> 0) {
   Qb(a, b, c);
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
function bk(a, b) {
 var c = w(0);
 a : {
  switch (b + -7 | 0) {
  case 56:
   return t[a + 4 >> 2];
  case 57:
   return t[a + 8 >> 2];
  case 58:
   return t[a + 12 >> 2];
  case 59:
   return t[a + 16 >> 2];
  case 63:
   return t[a + 24 >> 2];
  case 51:
   return t[a + 24 >> 2];
  case 74:
   return t[a + 88 >> 2];
  case 13:
   return t[a + 148 >> 2];
  case 14:
   return t[a + 152 >> 2];
  case 116:
   return t[a + 156 >> 2];
  case 117:
   return t[a + 160 >> 2];
  case 24:
   return t[a + 164 >> 2];
  case 119:
   return t[a + 168 >> 2];
  case 120:
   return t[a + 172 >> 2];
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
   return w(m[p[p[a >> 2] + 68 >> 2]](a));
  case 7:
  case 84:
   return w(m[p[p[a >> 2] + 72 >> 2]](a));
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
function vq(a, b) {
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
   d = Ip(p[a + 48 >> 2] + 156 | 0);
   if ((Xb(d, 2) | 0) != 2) {
    break b;
   }
   b = p[a + 52 >> 2];
   c : {
    if (!b) {
     h = a, i = Uc(p[a + 48 >> 2] + 156 | 0, 2), p[h + 52 >> 2] = i;
     break c;
    }
    m[p[p[b >> 2] + 8 >> 2]](b);
   }
   b = hi(c + 72 | 0, ec(p[a + 48 >> 2]));
   e = rb(c + 48 | 0);
   if (!gi(e, b)) {
    fi(e);
   }
   b = Ee(p[a + 48 >> 2]);
   h = c, i = Oa(b), p[h + 40 >> 2] = i;
   h = c, i = Pa(b), p[h + 32 >> 2] = i;
   while (1) {
    if (!Ra(c + 40 | 0, c + 32 | 0)) {
     break b;
    }
    b = p[p[c + 40 >> 2] >> 2];
    f = rb(c + 8 | 0);
    cd(f, e, m[p[p[b >> 2] + 84 >> 2]](b) | 0);
    g = p[a + 52 >> 2];
    m[p[p[g >> 2] + 16 >> 2]](g, p[b + 132 >> 2], f);
    Qa(c + 40 | 0);
    continue;
   }
  }
  if ((Xb(d, 4) | 0) != 4) {
   break a;
  }
  b = p[a + 56 >> 2];
  d : {
   if (!b) {
    h = a, i = Uc(p[a + 48 >> 2] + 156 | 0, 4), p[h + 56 >> 2] = i;
    break d;
   }
   m[p[p[b >> 2] + 8 >> 2]](b);
  }
  b = Ee(p[a + 48 >> 2]);
  h = c, i = Oa(b), p[h + 72 >> 2] = i;
  h = c, i = Pa(b), p[h + 48 >> 2] = i;
  while (1) {
   if (!Ra(c + 72 | 0, c + 48 | 0)) {
    break a;
   }
   b = p[p[c + 72 >> 2] >> 2];
   e = m[p[p[b >> 2] + 84 >> 2]](b) | 0;
   d = p[a + 56 >> 2];
   m[p[p[d >> 2] + 16 >> 2]](d, p[b + 132 >> 2], e);
   Qa(c + 72 | 0);
   continue;
  }
 }
 sa = c + 96 | 0;
}
function to(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 d = sa + -64 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  while (1) {
   g = bb(a);
   e = ta;
   j = e;
   if (e | g) {
    if (q[a + 8 | 0]) {
     a = 0;
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    e = g;
    if (c) {
     if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
      continue;
     }
    }
    b : {
     f = mc(e);
     if ((f | 0) != -1) {
      break b;
     }
     f = lc(b, e);
     if ((f | 0) != -1) {
      break b;
     }
     p[d + 32 >> 2] = g;
     p[d + 36 >> 2] = j;
     a = 0;
     jb(p[4408], 7009, d + 32 | 0);
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    c : {
     switch (f | 0) {
     case 0:
      bb(a);
      continue;
     case 1:
      Sb(d + 48 | 0, a);
      ib(d + 48 | 0);
      continue;
     case 2:
      La(a);
      continue;
     case 3:
      break c;
     default:
      continue;
     }
    }
    Jb(a);
    continue;
   }
   break;
  }
  if (!c) {
   p[d + 8 >> 2] = h;
   p[d + 12 >> 2] = i;
   p[d >> 2] = 23;
   a = 0;
   jb(p[4408], 7064, d);
   break a;
  }
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 23) | 0)) {
   k = d, l = m[p[p[c >> 2] + 8 >> 2]](c) | 0, p[k + 20 >> 2] = l;
   p[d + 16 >> 2] = 23;
   a = 0;
   jb(p[4408], 7147, d + 16 | 0);
   m[p[p[c >> 2] + 4 >> 2]](c);
   break a;
  }
  a = c;
 }
 sa = d - -64 | 0;
 return a;
}
function ro(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 d = sa + -64 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  while (1) {
   g = bb(a);
   e = ta;
   j = e;
   if (e | g) {
    if (q[a + 8 | 0]) {
     a = 0;
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    e = g;
    if (c) {
     if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
      continue;
     }
    }
    b : {
     f = mc(e);
     if ((f | 0) != -1) {
      break b;
     }
     f = lc(b, e);
     if ((f | 0) != -1) {
      break b;
     }
     p[d + 32 >> 2] = g;
     p[d + 36 >> 2] = j;
     a = 0;
     jb(p[4408], 7009, d + 32 | 0);
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    c : {
     switch (f | 0) {
     case 0:
      bb(a);
      continue;
     case 1:
      Sb(d + 48 | 0, a);
      ib(d + 48 | 0);
      continue;
     case 2:
      La(a);
      continue;
     case 3:
      break c;
     default:
      continue;
     }
    }
    Jb(a);
    continue;
   }
   break;
  }
  if (!c) {
   p[d + 8 >> 2] = h;
   p[d + 12 >> 2] = i;
   p[d >> 2] = 27;
   a = 0;
   jb(p[4408], 7064, d);
   break a;
  }
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 27) | 0)) {
   k = d, l = m[p[p[c >> 2] + 8 >> 2]](c) | 0, p[k + 20 >> 2] = l;
   p[d + 16 >> 2] = 27;
   a = 0;
   jb(p[4408], 7147, d + 16 | 0);
   m[p[p[c >> 2] + 4 >> 2]](c);
   break a;
  }
  a = c;
 }
 sa = d - -64 | 0;
 return a;
}
function qo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 d = sa + -64 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  while (1) {
   g = bb(a);
   e = ta;
   j = e;
   if (e | g) {
    if (q[a + 8 | 0]) {
     a = 0;
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    e = g;
    if (c) {
     if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
      continue;
     }
    }
    b : {
     f = mc(e);
     if ((f | 0) != -1) {
      break b;
     }
     f = lc(b, e);
     if ((f | 0) != -1) {
      break b;
     }
     p[d + 32 >> 2] = g;
     p[d + 36 >> 2] = j;
     a = 0;
     jb(p[4408], 7009, d + 32 | 0);
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    c : {
     switch (f | 0) {
     case 0:
      bb(a);
      continue;
     case 1:
      Sb(d + 48 | 0, a);
      ib(d + 48 | 0);
      continue;
     case 2:
      La(a);
      continue;
     case 3:
      break c;
     default:
      continue;
     }
    }
    Jb(a);
    continue;
   }
   break;
  }
  if (!c) {
   p[d + 8 >> 2] = h;
   p[d + 12 >> 2] = i;
   p[d >> 2] = 25;
   a = 0;
   jb(p[4408], 7064, d);
   break a;
  }
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 25) | 0)) {
   k = d, l = m[p[p[c >> 2] + 8 >> 2]](c) | 0, p[k + 20 >> 2] = l;
   p[d + 16 >> 2] = 25;
   a = 0;
   jb(p[4408], 7147, d + 16 | 0);
   m[p[p[c >> 2] + 4 >> 2]](c);
   break a;
  }
  a = c;
 }
 sa = d - -64 | 0;
 return a;
}
function po(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 d = sa + -64 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  while (1) {
   g = bb(a);
   e = ta;
   j = e;
   if (e | g) {
    if (q[a + 8 | 0]) {
     a = 0;
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    e = g;
    if (c) {
     if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
      continue;
     }
    }
    b : {
     f = mc(e);
     if ((f | 0) != -1) {
      break b;
     }
     f = lc(b, e);
     if ((f | 0) != -1) {
      break b;
     }
     p[d + 32 >> 2] = g;
     p[d + 36 >> 2] = j;
     a = 0;
     jb(p[4408], 7009, d + 32 | 0);
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    c : {
     switch (f | 0) {
     case 0:
      bb(a);
      continue;
     case 1:
      Sb(d + 48 | 0, a);
      ib(d + 48 | 0);
      continue;
     case 2:
      La(a);
      continue;
     case 3:
      break c;
     default:
      continue;
     }
    }
    Jb(a);
    continue;
   }
   break;
  }
  if (!c) {
   p[d + 8 >> 2] = h;
   p[d + 12 >> 2] = i;
   p[d >> 2] = 26;
   a = 0;
   jb(p[4408], 7064, d);
   break a;
  }
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 26) | 0)) {
   k = d, l = m[p[p[c >> 2] + 8 >> 2]](c) | 0, p[k + 20 >> 2] = l;
   p[d + 16 >> 2] = 26;
   a = 0;
   jb(p[4408], 7147, d + 16 | 0);
   m[p[p[c >> 2] + 4 >> 2]](c);
   break a;
  }
  a = c;
 }
 sa = d - -64 | 0;
 return a;
}
function oo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 d = sa + -64 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  while (1) {
   g = bb(a);
   e = ta;
   j = e;
   if (e | g) {
    if (q[a + 8 | 0]) {
     a = 0;
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    e = g;
    if (c) {
     if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
      continue;
     }
    }
    b : {
     f = mc(e);
     if ((f | 0) != -1) {
      break b;
     }
     f = lc(b, e);
     if ((f | 0) != -1) {
      break b;
     }
     p[d + 32 >> 2] = g;
     p[d + 36 >> 2] = j;
     a = 0;
     jb(p[4408], 7009, d + 32 | 0);
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    c : {
     switch (f | 0) {
     case 0:
      bb(a);
      continue;
     case 1:
      Sb(d + 48 | 0, a);
      ib(d + 48 | 0);
      continue;
     case 2:
      La(a);
      continue;
     case 3:
      break c;
     default:
      continue;
     }
    }
    Jb(a);
    continue;
   }
   break;
  }
  if (!c) {
   p[d + 8 >> 2] = h;
   p[d + 12 >> 2] = i;
   p[d >> 2] = 29;
   a = 0;
   jb(p[4408], 7064, d);
   break a;
  }
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 29) | 0)) {
   k = d, l = m[p[p[c >> 2] + 8 >> 2]](c) | 0, p[k + 20 >> 2] = l;
   p[d + 16 >> 2] = 29;
   a = 0;
   jb(p[4408], 7147, d + 16 | 0);
   m[p[p[c >> 2] + 4 >> 2]](c);
   break a;
  }
  a = c;
 }
 sa = d - -64 | 0;
 return a;
}
function so(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0, l = 0;
 d = sa + -64 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  while (1) {
   g = bb(a);
   e = ta;
   j = e;
   if (e | g) {
    if (q[a + 8 | 0]) {
     a = 0;
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    e = g;
    if (c) {
     if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
      continue;
     }
    }
    b : {
     f = mc(e);
     if ((f | 0) != -1) {
      break b;
     }
     f = lc(b, e);
     if ((f | 0) != -1) {
      break b;
     }
     p[d + 32 >> 2] = g;
     p[d + 36 >> 2] = j;
     a = 0;
     jb(p[4408], 7009, d + 32 | 0);
     if (!c) {
      break a;
     }
     m[p[p[c >> 2] + 4 >> 2]](c);
     break a;
    }
    c : {
     switch (f | 0) {
     case 0:
      bb(a);
      continue;
     case 1:
      Sb(d + 48 | 0, a);
      ib(d + 48 | 0);
      continue;
     case 2:
      La(a);
      continue;
     case 3:
      break c;
     default:
      continue;
     }
    }
    Jb(a);
    continue;
   }
   break;
  }
  if (!c) {
   p[d + 8 >> 2] = h;
   p[d + 12 >> 2] = i;
   p[d >> 2] = 1;
   a = 0;
   jb(p[4408], 7064, d);
   break a;
  }
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 1) | 0)) {
   k = d, l = m[p[p[c >> 2] + 8 >> 2]](c) | 0, p[k + 20 >> 2] = l;
   p[d + 16 >> 2] = 1;
   a = 0;
   jb(p[4408], 7147, d + 16 | 0);
   m[p[p[c >> 2] + 4 >> 2]](c);
   break a;
  }
  a = c;
 }
 sa = d - -64 | 0;
 return a;
}
function _f(a, b, c) {
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
    Va(a, b);
    break a;
   case 3:
    Dc(a, a + 4 | 0, b + -4 | 0, c);
    break a;
   case 4:
    ce(a, a + 4 | 0, a + 8 | 0, b + -4 | 0, c);
    break a;
   case 5:
    be(a, a + 4 | 0, a + 8 | 0, a + 12 | 0, b + -4 | 0, c);
    break a;
   case 0:
   case 1:
    break a;
   default:
    break b;
   }
  }
  f = a + 8 | 0;
  Dc(a, a + 4 | 0, f, c);
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
function Ou(a, b, c) {
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
    if (!tf(V(p[a + 60 >> 2], d + 16 | 0, 2, d + 12 | 0) | 0)) {
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
      if (!tf(V(p[a + 60 >> 2], b | 0, j | 0, d + 12 | 0) | 0)) {
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
function ot(a, b) {
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
function tg(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 Db(a);
 a : {
  if (b) {
   d = a;
   f = b;
   if (1073741823 < b >>> 0) {
    Nb();
    E();
   }
   sd(d, Na(f << 2));
   i = Db(a), j = f, p[i >> 2] = j;
   while (1) if ((c | 0) == (f | 0)) {
    b = a + 8 | 0;
    d = p[b >> 2];
    if (!d) {
     break a;
    }
    g = gb(p[d + 4 >> 2], f);
    i = Ta(a, g), j = b, p[i >> 2] = j;
    while (1) {
     b = p[d >> 2];
     if (!b) {
      break a;
     }
     b : {
      e = gb(p[b + 4 >> 2], f);
      if ((g | 0) == (e | 0)) {
       break b;
      }
      c = b;
      if (!p[Ta(a, e) >> 2]) {
       i = Ta(a, e), j = d, p[i >> 2] = j;
       g = e;
       break b;
      }
      c : {
       while (1) {
        h = p[c >> 2];
        if (!h) {
         break c;
        }
        if (td(ub(a), b + 8 | 0, p[c >> 2] + 8 | 0)) {
         c = p[c >> 2];
         continue;
        }
        break;
       }
       h = p[c >> 2];
      }
      p[d >> 2] = h;
      i = c, j = p[p[Ta(a, e) >> 2] >> 2], p[i >> 2] = j;
      i = p[Ta(a, e) >> 2], j = b, p[i >> 2] = j;
      continue;
     }
     d = b;
     continue;
    }
   } else {
    i = Ta(a, c), j = 0, p[i >> 2] = j;
    c = c + 1 | 0;
    continue;
   }
  }
  sd(a, 0);
  i = Db(a), j = 0, p[i >> 2] = j;
 }
}
function no(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 d = sa - 48 | 0;
 sa = d;
 h = bb(a);
 i = ta;
 c = nc(h);
 a : {
  b : {
   while (1) {
    g = bb(a);
    e = ta;
    j = e;
    if (e | g) {
     if (q[a + 8 | 0]) {
      if (!c) {
       break b;
      }
      m[p[p[c >> 2] + 4 >> 2]](c);
      break b;
     }
     e = g;
     if (c) {
      if (m[p[p[c >> 2] + 16 >> 2]](c, e, a) | 0) {
       continue;
      }
     }
     c : {
      f = mc(e);
      if ((f | 0) != -1) {
       break c;
      }
      f = lc(b, e);
      if ((f | 0) != -1) {
       break c;
      }
      p[d + 16 >> 2] = g;
      p[d + 20 >> 2] = j;
      jb(p[4408], 7009, d + 16 | 0);
      if (!c) {
       break b;
      }
      m[p[p[c >> 2] + 4 >> 2]](c);
      break b;
     }
     d : {
      switch (f | 0) {
      case 0:
       bb(a);
       continue;
      case 1:
       Sb(d + 32 | 0, a);
       ib(d + 32 | 0);
       continue;
      case 2:
       La(a);
       continue;
      case 3:
       break d;
      default:
       continue;
      }
     }
     Jb(a);
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
   jb(p[4408], 9768, d);
   break a;
  }
  c = 0;
 }
 sa = d + 48 | 0;
 return c;
}
function Ei(a) {
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
function _a(a, b, c) {
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
function hn(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = w(0), g = 0, h = 0, i = 0, j = w(0), k = 0, l = 0, n = 0, o = w(0);
 c = sa - 32 | 0;
 sa = c;
 if (ob(b, 512)) {
  d = a + 80 | 0;
  fn(Oa(d), Pa(d));
 }
 d = ob(b, 64);
 if (!(k = !ob(b, $c($c(256, 128), 32)), l = 0, n = !q[a + 92 | 0] | d ^ 1, n ? k : l)) {
  g = a + 68 | 0;
  b = p[g + 8 >> 2];
  d = $a(c + 24 | 0, t[a + 48 >> 2], t[a + 52 >> 2]);
  h = $a(c + 16 | 0, t[a + 56 >> 2], t[a + 60 >> 2]);
  a : {
   b : {
    if (!q[a + 92 | 0]) {
     break b;
    }
    e = p[a + 96 >> 2];
    if (!e) {
     break b;
    }
    e = ec(e);
    i = db(c + 8 | 0);
    hf(i, d, e);
    d = db(c);
    hf(d, h, e);
    m[p[p[a >> 2] + 72 >> 2]](a, i, d);
    break a;
   }
   m[p[p[a >> 2] + 72 >> 2]](a, d, h);
  }
  f = t[a + 64 >> 2];
  j = t[g + 4 >> 2];
  a = a + 80 | 0;
  k = c, l = Oa(a), p[k + 8 >> 2] = l;
  k = c, l = Pa(a), p[k >> 2] = l;
  f = w(f * j);
  while (1) {
   if (Ra(c + 8 | 0, c)) {
    a = p[p[c + 8 >> 2] >> 2];
    l = b, n = cg(p[a + 48 >> 2], f), o = t[a + 52 >> 2], k = p[p[b >> 2] + 32 >> 2], m[k](l | 0, n | 0, w(o));
    Qa(c + 8 | 0);
    continue;
   } else {
    m[p[p[b >> 2] + 36 >> 2]](b);
   }
   break;
  }
 }
 sa = c + 32 | 0;
}
function Mi(a, b, c, d) {
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
function Eg(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0;
 Db(a);
 a : {
  if (b) {
   sd(a, Fe(b));
   i = Db(a), j = b, p[i >> 2] = j;
   while (1) if ((b | 0) == (c | 0)) {
    d = a + 8 | 0;
    e = p[d >> 2];
    if (!e) {
     break a;
    }
    g = gb(p[e + 4 >> 2], b);
    i = Ta(a, g), j = d, p[i >> 2] = j;
    while (1) {
     d = p[e >> 2];
     if (!d) {
      break a;
     }
     b : {
      f = gb(p[d + 4 >> 2], b);
      if ((g | 0) == (f | 0)) {
       break b;
      }
      c = d;
      if (!p[Ta(a, f) >> 2]) {
       i = Ta(a, f), j = e, p[i >> 2] = j;
       g = f;
       break b;
      }
      c : {
       while (1) {
        h = p[c >> 2];
        if (!h) {
         break c;
        }
        if (Rc(ub(a), d + 8 | 0, p[c >> 2] + 8 | 0)) {
         c = p[c >> 2];
         continue;
        }
        break;
       }
       h = p[c >> 2];
      }
      p[e >> 2] = h;
      i = c, j = p[p[Ta(a, f) >> 2] >> 2], p[i >> 2] = j;
      i = p[Ta(a, f) >> 2], j = d, p[i >> 2] = j;
      continue;
     }
     e = d;
     continue;
    }
   } else {
    i = Ta(a, c), j = 0, p[i >> 2] = j;
    c = c + 1 | 0;
    continue;
   }
  }
  sd(a, 0);
  i = Db(a), j = 0, p[i >> 2] = j;
 }
}
function wo(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 d = sa - 48 | 0;
 sa = d;
 a : {
  b : {
   while (1) {
    if ((c | 0) == 4) {
     break b;
    }
    e = c + 6935 | 0;
    c = c + 1 | 0;
    if (n[e | 0] == (ji(a) | 0)) {
     continue;
    }
    break;
   }
   c = 0;
   break a;
  }
  g = b, h = bb(a), p[g >> 2] = h;
  c = 0;
  if (q[a + 8 | 0]) {
   break a;
  }
  g = b, h = bb(a), p[g + 4 >> 2] = h;
  if (q[a + 8 | 0]) {
   break a;
  }
  g = b, h = bb(a), p[g + 8 >> 2] = h;
  g = b, h = bb(a), p[g + 12 >> 2] = h;
  e = ab(d + 32 | 0);
  while (1) {
   c = bb(a);
   p[d + 24 >> 2] = c;
   if (c) {
    pc(e, d + 24 | 0);
    continue;
   } else {
    g = d, h = Oa(e), p[g + 24 >> 2] = h;
    g = d, h = Pa(e), p[g + 16 >> 2] = h;
    f = b + 16 | 0;
    b = 0;
    c = 8;
    while (1) {
     if (Ra(d + 24 | 0, d + 16 | 0)) {
      p[d + 12 >> 2] = p[p[d + 24 >> 2] >> 2];
      if ((c | 0) == 8) {
       c = 0;
       b = Jb(a);
      }
      g = uo(f, d + 12 | 0), h = b >> c & 3, p[g >> 2] = h;
      c = c + 2 | 0;
      Qa(d + 24 | 0);
      continue;
     } else {
      fb(e);
     }
     break;
    }
   }
   break;
  }
  c = 1;
 }
 sa = d + 48 | 0;
 return c;
}
function Bc(a) {
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
   b = Lb(+a);
   break a;
  }
  if (d >>> 0 <= 1081824209) {
   g = +a;
   if (d >>> 0 >= 1075235812) {
    b = w(-Lb(((f | 0) > -1 ? -3.141592653589793 : 3.141592653589793) + g));
    break a;
   }
   if ((f | 0) <= -1) {
    b = Kb(g + 1.5707963267948966);
    break a;
   }
   b = Kb(1.5707963267948966 - g);
   break a;
  }
  if (d >>> 0 <= 1088565717) {
   if (d >>> 0 >= 1085271520) {
    b = Lb(((f | 0) > -1 ? -6.283185307179586 : 6.283185307179586) + +a);
    break a;
   }
   if ((f | 0) <= -1) {
    b = Kb(-4.71238898038469 - +a);
    break a;
   }
   b = Kb(+a + -4.71238898038469);
   break a;
  }
  b = w(a - a);
  if (d >>> 0 >= 2139095040) {
   break a;
  }
  b : {
   switch (Qi(a, c + 8 | 0) & 3) {
   case 0:
    b = Lb(u[c + 8 >> 3]);
    break a;
   case 1:
    b = Kb(-u[c + 8 >> 3]);
    break a;
   case 2:
    b = w(-Lb(u[c + 8 >> 3]));
    break a;
   default:
    break b;
   }
  }
  b = Kb(u[c + 8 >> 3]);
 }
 a = b;
 sa = c + 16 | 0;
 return a;
}
function Cc(a) {
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
   a = Kb(+a);
   break a;
  }
  if (c >>> 0 <= 1081824209) {
   d = +a;
   if (c >>> 0 <= 1075235811) {
    if ((f | 0) <= -1) {
     a = w(-Lb(d + 1.5707963267948966));
     break a;
    }
    a = Lb(d + -1.5707963267948966);
    break a;
   }
   a = Kb(-(((f | 0) > -1 ? -3.141592653589793 : 3.141592653589793) + d));
   break a;
  }
  if (c >>> 0 <= 1088565717) {
   d = +a;
   if (c >>> 0 <= 1085271519) {
    if ((f | 0) <= -1) {
     a = Lb(d + 4.71238898038469);
     break a;
    }
    a = w(-Lb(d + -4.71238898038469));
    break a;
   }
   a = Kb(((f | 0) > -1 ? -6.283185307179586 : 6.283185307179586) + d);
   break a;
  }
  if (c >>> 0 >= 2139095040) {
   a = w(a - a);
   break a;
  }
  b : {
   switch (Qi(a, b + 8 | 0) & 3) {
   case 0:
    a = Kb(u[b + 8 >> 3]);
    break a;
   case 1:
    a = Lb(u[b + 8 >> 3]);
    break a;
   case 2:
    a = Kb(-u[b + 8 >> 3]);
    break a;
   default:
    break b;
   }
  }
  a = w(-Lb(u[b + 8 >> 3]));
 }
 sa = b + 16 | 0;
 return a;
}
function Gp(a, b) {
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
 g = vg(c, f, h);
 b : {
  if (!(g >= w(.0010000000474974513) ^ 1)) {
   d = 0;
   while (1) {
    if ((d | 0) == 4) {
     break b;
    }
    e = vg(c, f, h);
    if (e == w(0)) {
     break b;
    }
    c = w(c - w(w(Gd(c, f, h) - b) / e));
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
   i = w(Gd(c, f, h) - b);
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
function Tr(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = 0, f = w(0), g = w(0), h = w(0), i = w(0), j = w(0), k = w(0), l = w(0), m = w(0), n = w(0);
 e = sa - 16 | 0;
 sa = e;
 if (ob(b, 8)) {
  g = t[a + 152 >> 2];
  d = t[a + 160 >> 2];
  i = t[a + 152 >> 2];
  c = a + 164 | 0;
  j = w(t[a + 148 >> 2] * w(.5));
  f = w(j - w(t[a + 156 >> 2] * t[a + 148 >> 2]));
  Ab(c, f);
  h = w(g * w(.5));
  g = w(h - w(d * i));
  d = w(g - h);
  zb(c, d);
  i = w(j * w(.5522847771644592));
  k = w(f - i);
  Ld(c, $a(e + 8 | 0, k, d));
  i = w(i + f);
  Md(c, $a(e + 8 | 0, i, d));
  c = a + 260 | 0;
  d = w(j + f);
  Ab(c, d);
  zb(c, g);
  l = w(h * w(.5522847771644592));
  m = w(g - l);
  Ld(c, $a(e + 8 | 0, d, m));
  n = d;
  d = w(l + g);
  Md(c, $a(e + 8 | 0, n, d));
  c = a + 356 | 0;
  Ab(c, f);
  h = w(h + g);
  zb(c, h);
  Ld(c, $a(e + 8 | 0, i, h));
  Md(c, $a(e + 8 | 0, k, h));
  c = a + 452 | 0;
  f = w(f - j);
  Ab(c, f);
  zb(c, g);
  Ld(c, $a(e + 8 | 0, f, d));
  Md(c, $a(e + 8 | 0, f, m));
 }
 Gc(a, b);
 sa = e + 16 | 0;
}
function cp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = w(0), f = w(0), g = 0, h = 0, i = 0, j = w(0);
 d = sa - 48 | 0;
 sa = d;
 m[p[p[b >> 2] + 8 >> 2]](b);
 c = p[a + 160 >> 2];
 h = b, i = m[p[p[c >> 2] + 36 >> 2]](c) | 0, g = p[p[b >> 2] + 24 >> 2], m[g](h | 0, i | 0);
 c = rb(d + 24 | 0);
 e = t[a + 48 >> 2];
 f = t[a + 64 >> 2];
 g = Ja(c, 4), j = w(e * f), t[g >> 2] = j;
 e = t[a + 52 >> 2];
 f = t[a + 68 >> 2];
 g = Ja(c, 5), j = w(e * f), t[g >> 2] = j;
 m[p[p[b >> 2] + 16 >> 2]](b, c);
 c = a + 80 | 0;
 g = d, i = Oa(c), p[g + 16 >> 2] = i;
 g = d, i = Pa(c), p[g + 8 >> 2] = i;
 while (1) {
  if (Ra(d + 16 | 0, d + 8 | 0)) {
   c = p[p[d + 16 >> 2] >> 2];
   m[p[p[c >> 2] + 60 >> 2]](c, b, p[a + 156 >> 2]);
   Qa(d + 16 | 0);
   continue;
  } else {
   a : {
    a = a + 164 | 0;
    while (1) {
     a = p[a >> 2];
     if (!a) {
      break a;
     }
     m[p[p[a >> 2] + 88 >> 2]](a, b);
     a = a + 148 | 0;
     continue;
    }
   }
  }
  break;
 }
 m[p[p[b >> 2] + 12 >> 2]](b);
 sa = d + 48 | 0;
}
function rs(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 c = sa - 32 | 0;
 sa = c;
 e = p[a + 20 >> 2];
 b = (b ? b + -72 | 0 : 0) + 92 | 0;
 g = c, h = Oa(b), p[g + 24 >> 2] = h;
 g = c, h = Pa(b), p[g + 16 >> 2] = h;
 f = a + 60 | 0;
 while (1) {
  a : {
   if (Ra(c + 24 | 0, c + 16 | 0)) {
    d = p[p[c + 24 >> 2] >> 2];
    if (!ff(d)) {
     break a;
    }
    b = d;
    while (1) {
     if (!b) {
      break a;
     }
     if ((b | 0) == (e | 0)) {
      zo(d, a);
      break a;
     } else {
      b = p[b + 20 >> 2];
      continue;
     }
    }
   }
   g = a, h = md(), p[g + 76 >> 2] = h;
   sa = c + 32 | 0;
   return 0;
  }
  b : {
   if (!ef(d) | (d | 0) == (e | 0)) {
    break b;
   }
   b = d;
   while (1) {
    if (!b) {
     break b;
    }
    if (p[a + 72 >> 2] == (b | 0)) {
     p[c + 12 >> 2] = d;
     ah(d + 156 | 0, $c(4, 16));
     Hb(f, c + 12 | 0);
    } else {
     b = p[b + 20 >> 2];
     continue;
    }
    break;
   }
  }
  Qa(c + 24 | 0);
  continue;
 }
}
function zg(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 d = sa - 48 | 0;
 sa = d;
 p[d + 44 >> 2] = b;
 f = d, g = yg(a, d + 44 | 0), p[f + 32 >> 2] = g;
 f = d, g = xg(), p[f + 16 >> 2] = g;
 b = 1;
 a : {
  if (xe(d + 32 | 0, d + 16 | 0)) {
   break a;
  }
  b = a + 20 | 0;
  f = d, g = yg(b, d + 44 | 0), p[f + 32 >> 2] = g;
  f = d, g = xg(), p[f + 16 >> 2] = g;
  if (xe(d + 32 | 0, d + 16 | 0)) {
   ed(6460, 18, p[4408]);
   b = 0;
   break a;
  }
  wg(d + 32 | 0, b, d + 44 | 0);
  b = mh(d + 32 | 0, p[d + 44 >> 2] + 24 | 0);
  f = d, g = Oa(b), p[f + 16 >> 2] = g;
  f = d, g = Pa(b), p[f + 24 >> 2] = g;
  b : {
   while (1) {
    e = Ra(d + 16 | 0, d + 24 | 0);
    if (e) {
     if (!zg(a, p[p[d + 16 >> 2] >> 2], c)) {
      break b;
     }
     Qa(d + 16 | 0);
     continue;
    }
    break;
   }
   wg(d + 16 | 0, a, d + 44 | 0);
   f = d, g = Oa(c), p[f + 16 >> 2] = g;
   p[d + 8 >> 2] = p[d + 16 >> 2];
   Qo(c, p[d + 8 >> 2], d + 44 | 0);
  }
  fb(b);
  b = e ^ 1;
 }
 sa = d + 48 | 0;
 return b;
}
function Vg(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a + 72 >> 2] = 6192;
 p[a >> 2] = 6108;
 e = a + 92 | 0;
 f = b, g = Oa(e), p[f + 8 >> 2] = g;
 f = b, g = Pa(e), p[f >> 2] = g;
 while (1) {
  if (!Ra(b + 8 | 0, b)) {
   d = a + 104 | 0;
   f = b, g = Oa(d), p[f + 8 >> 2] = g;
   f = b, g = Pa(d), p[f >> 2] = g;
   while (1) {
    if (!Ra(b + 8 | 0, b)) {
     c = p[a + 160 >> 2];
     if (c) {
      m[p[p[c >> 2] + 4 >> 2]](c);
     }
     c = p[a + 156 >> 2];
     if (c) {
      m[p[p[c >> 2] + 4 >> 2]](c);
     }
     fb(a + 140 | 0);
     fb(a + 128 | 0);
     fb(a + 116 | 0);
     fb(d);
     fb(e);
     _g(a + 76 | 0);
     eb(a);
     sa = b + 16 | 0;
     return a | 0;
    }
    c = p[p[b + 8 >> 2] >> 2];
    if (c) {
     m[p[p[c >> 2] + 4 >> 2]](c);
    }
    Qa(b + 8 | 0);
    continue;
   }
  }
  d = p[p[b + 8 >> 2] >> 2];
  if (!((d | 0) == (a | 0) | !d)) {
   m[p[p[d >> 2] + 4 >> 2]](d);
  }
  Qa(b + 8 | 0);
  continue;
 }
}
function Cu(a, b, c, d, e, f) {
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
function Oi(a, b, c, d, e) {
 var f = 0, g = 0, h = 0;
 f = sa - 208 | 0;
 sa = f;
 p[f + 204 >> 2] = c;
 c = 0;
 _a(f + 160 | 0, 0, 40);
 p[f + 200 >> 2] = p[f + 204 >> 2];
 a : {
  if ((uf(0, b, f + 200 | 0, f + 80 | 0, f + 160 | 0, d, e) | 0) < 0) {
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
    uf(a, b, f + 200 | 0, f + 80 | 0, f + 160 | 0, d, e);
    break b;
   }
   p[a + 48 >> 2] = 80;
   p[a + 16 >> 2] = f + 80;
   p[a + 28 >> 2] = f;
   p[a + 20 >> 2] = f;
   g = p[a + 44 >> 2];
   p[a + 44 >> 2] = f;
   uf(a, b, f + 200 | 0, f + 80 | 0, f + 160 | 0, d, e);
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
function Au(a, b, c, d, e, f) {
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
function lf(a, b, c, d, e, f, g) {
 var h = w(0), i = 0, j = w(0), k = w(0), l = w(0), m = w(0), n = w(0), o = w(0), p = w(0), q = w(0), r = w(0), s = w(0), u = w(0), x = w(0), y = 0, z = w(0);
 p = t[Ja(e, 0) >> 2];
 q = t[Ja(e, 2) >> 2];
 r = t[Ja(e, 4) >> 2];
 s = t[Ja(e, 1) >> 2];
 u = t[Ja(e, 3) >> 2];
 x = t[Ja(e, 5) >> 2];
 while (1) {
  if ((i | 0) != 4) {
   e = ni(i, d);
   if (e) {
    h = w(w(e | 0) / w(255));
    e = v(ni(i, c), 24);
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
function Uc(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 c = sa - 16 | 0;
 sa = c;
 d = Xb($c(b, q[a | 0]), 16);
 a = a + 4 | 0;
 g = c, h = Oa(a), p[g + 8 >> 2] = h;
 g = c, h = Pa(a), p[g >> 2] = h;
 f = (d | 0) == 16;
 a = 0;
 a : {
  while (1) {
   if (Ra(c + 8 | 0, c)) {
    d = p[p[c + 8 >> 2] >> 2];
    b : {
     c : {
      if (b) {
       if ((Xb(b, m[p[p[d >> 2] + 56 >> 2]](d) | 0) | 0) != (b | 0)) {
        break c;
       }
      }
      if (ze(d)) {
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
    Qa(c + 8 | 0);
    continue;
   } else {
    if (a & f) {
     a = Na(108);
     Eh(a);
     p[a >> 2] = 3796;
     g = a, h = md(), p[g + 104 >> 2] = h;
     break a;
    }
   }
   break;
  }
  if (a & 1) {
   a = Na(104);
   b = _a(a, 0, 104);
   Eh(b);
   p[b >> 2] = 5400;
   break a;
  }
  a = md();
 }
 sa = c + 16 | 0;
 return a;
}
function No(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 d = sa - 48 | 0;
 sa = d;
 a : {
  if (p[a + 8 >> 2] != p[Wa(a) >> 2]) {
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
    Di(f, e, g);
   }
   p[c >> 2] = f + g;
   p[h >> 2] = i + p[h >> 2];
   break a;
  }
  j = d, k = p[Wa(a) >> 2] - p[a >> 2] >> 1, p[j + 24 >> 2] = k;
  p[d + 44 >> 2] = 1;
  c = p[Ob(d + 24 | 0, d + 44 | 0) >> 2];
  c = Cd(d + 24 | 0, c, c >>> 2 | 0, p[a + 16 >> 2]);
  e = hb(d + 16 | 0, p[a + 4 >> 2]);
  f = hb(d + 8 | 0, p[a + 8 >> 2]);
  Io(c, p[e >> 2], p[f >> 2]);
  Va(a, c);
  Va(h, c + 4 | 0);
  Va(g, c + 8 | 0);
  Va(Wa(a), Wa(c));
  Vc(c);
 }
 oc(p[a + 16 >> 2], p[a + 8 >> 2], b);
 p[a + 8 >> 2] = p[a + 8 >> 2] + 4;
 sa = d + 48 | 0;
}
function Tn(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0, i = 0, j = w(0);
 h = a + 8 | 0;
 i = cb(h);
 e = i + -1 | 0;
 while (1) {
  a : {
   b : {
    if ((g | 0) <= (e | 0)) {
     f = e + g >> 1;
     j = t[p[Ta(h, f) >> 2] + 20 >> 2];
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
     a = p[Ta(h, 0) >> 2];
     m[p[p[a >> 2] + 40 >> 2]](a, b, f, d);
     return;
    }
    e = p[Ta(h, g + -1 | 0) >> 2];
    if (g >>> 0 < i >>> 0) {
     a = p[Ta(h, g) >> 2];
     if (t[a + 20 >> 2] == c) {
      m[p[p[a >> 2] + 40 >> 2]](a, b, f, d);
      return;
     }
     if (!p[e + 8 >> 2]) {
      break a;
     }
     m[p[p[e >> 2] + 44 >> 2]](e, b, f, c, a, d);
     return;
    }
    break a;
   }
   e = f + -1 | 0;
   continue;
  }
  break;
 }
 m[p[p[e >> 2] + 40 >> 2]](e, b, f, d);
}
function Ss(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 b = sa - 48 | 0;
 sa = b;
 e = rb(b + 24 | 0);
 c = a + 96 | 0;
 g = b, h = Oa(c), p[g + 16 >> 2] = h;
 g = b, h = Pa(c), p[g + 8 >> 2] = h;
 f = 6;
 while (1) {
  if (Ra(b + 16 | 0, b + 8 | 0)) {
   c = p[p[b + 16 >> 2] >> 2];
   cd(e, ec(p[c + 100 >> 2]), c + 76 | 0);
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
   Qa(b + 16 | 0);
   continue;
  } else {
   sa = b + 48 | 0;
  }
  break;
 }
}
function Sp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0, j = 0, k = 0;
 c = sa - 16 | 0;
 sa = c;
 f = yo(a, b);
 d = a + 160 | 0;
 i = c, j = Oa(d), p[i + 8 >> 2] = j;
 i = c, j = Pa(d), p[i >> 2] = j;
 while (1) {
  if (!Ra(c + 8 | 0, c)) {
   if (f) {
    m[p[p[b >> 2] + 12 >> 2]](b);
   }
   sa = c + 16 | 0;
   return;
  }
  d = p[p[c + 8 >> 2] >> 2];
  if (q[d + 46 | 0]) {
   m[p[p[b >> 2] + 8 >> 2]](b);
   g = d;
   h = b;
   a : {
    if ((Xb(m[p[p[d >> 2] + 56 >> 2]](d) | 0, 2) | 0) == 2) {
     j = b, k = ec(a), i = p[p[b >> 2] + 16 >> 2], m[i](j | 0, k | 0);
     e = p[p[a + 172 >> 2] + 52 >> 2];
     break a;
    }
    e = p[p[a + 172 >> 2] + 56 >> 2];
   }
   m[p[p[d >> 2] + 60 >> 2]](g, h, e);
   m[p[p[b >> 2] + 12 >> 2]](b);
  }
  Qa(c + 8 | 0);
  continue;
 }
}
function Eu(a, b) {
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
function Qi(a, b) {
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
  c = Ru(d + 8 | 0, d, c);
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
function cd(a, b, c) {
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
function Du(a, b) {
 a : {
  if (a) {
   if (b >>> 0 <= 127) {
    break a;
   }
   b : {
    if (!p[p[4810] >> 2]) {
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
   p[4904] = 25;
   a = -1;
  } else {
   a = 1;
  }
  return a;
 }
 n[a | 0] = b;
 return 1;
}
function Ks(a, b) {
 a = a | 0;
 b = b | 0;
 var c = w(0), d = 0, e = 0, f = 0, g = 0, h = w(0);
 f = sa - 32 | 0;
 sa = f;
 d = rb(f + 8 | 0);
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
  if (!gi(a + 76 | 0, d)) {
   break a;
  }
  e = Fb(a, b);
  if (e) {
   break a;
  }
  e = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!of(b)) {
   break a;
  }
  p[a + 100 >> 2] = b;
  e = 0;
 }
 sa = f + 32 | 0;
 return e | 0;
}
function Jo(a, b) {
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
   b = Rd(b);
  }
  p[e + 12 >> 2] = b;
 }
 d = Gb(a);
 b : {
  if (b >>> 0 > d >>> 0) {
   tg(a, b);
   break b;
  }
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  g = Qc(d);
  f = w(C(w(w(s[Wa(a) >> 2]) / t[ub(a) >> 2])));
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
    b = Dg(b);
    break d;
   }
   b = Rd(b);
  }
  p[e + 8 >> 2] = b;
  b = p[Ob(c + 12 | 0, c + 8 | 0) >> 2];
  p[c + 12 >> 2] = b;
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  tg(a, b);
 }
 sa = c + 16 | 0;
}
function Hg(a, b) {
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
   b = Rd(b);
  }
  p[e + 12 >> 2] = b;
 }
 d = Gb(a);
 b : {
  if (b >>> 0 > d >>> 0) {
   Eg(a, b);
   break b;
  }
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  g = Qc(d);
  f = w(C(w(w(s[Wa(a) >> 2]) / t[ub(a) >> 2])));
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
    b = Dg(b);
    break d;
   }
   b = Rd(b);
  }
  p[e + 8 >> 2] = b;
  b = p[Ob(c + 12 | 0, c + 8 | 0) >> 2];
  p[c + 12 >> 2] = b;
  if (b >>> 0 >= d >>> 0) {
   break b;
  }
  Eg(a, b);
 }
 sa = c + 16 | 0;
}
function qf(a, b, c) {
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
  Qb(f, a, b);
  p[c + 20 >> 2] = p[c + 20 >> 2] + b;
  e = b + g | 0;
 }
 return e;
}
function ep(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0;
 a : {
  d = Kg(a);
  if (!d) {
   break a;
  }
  e = a + 116 | 0;
  b = cb(e);
  h = (b | 0) > 0 ? b : 0;
  while (1) {
   if (!Kg(a)) {
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
     c = p[Ta(e, b) >> 2];
     p[a + 152 >> 2] = b;
     g = r[c + 44 >> 1];
     if (g) {
      o[c + 44 >> 1] = 0;
      m[p[p[c >> 2] + 44 >> 2]](c, g);
      if (s[a + 152 >> 2] < b >>> 0) {
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
function Gs(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  b : {
   switch (b + -95 | 0) {
   case 0:
    d = a, e = bb(c), p[d + 48 >> 2] = e;
    break a;
   case 1:
    d = a, f = w(La(c)), t[d + 52 >> 2] = f;
    break a;
   case 2:
    d = a, f = w(La(c)), t[d + 56 >> 2] = f;
    break a;
   case 3:
    d = a, f = w(La(c)), t[d + 60 >> 2] = f;
    break a;
   case 4:
    d = a, f = w(La(c)), t[d + 64 >> 2] = f;
    break a;
   case 5:
    d = a, f = w(La(c)), t[d + 68 >> 2] = f;
    break a;
   case 6:
    d = a, f = w(La(c)), t[d + 72 >> 2] = f;
    break a;
   default:
    break b;
   }
  }
  return wb(a, b, c) | 0;
 }
 return 1;
}
function Cp(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = w(0), f = 0, g = 0, h = 0, i = w(0), j = w(0), k = w(0), l = w(0);
 b = m[p[p[a >> 2] + 120 >> 2]](a) | 0;
 f = (b | 0) > 0 ? b : 0;
 g = a + 136 | 0;
 h = 6.283185307179586 / +(b | 0);
 i = w(t[a + 148 >> 2] * w(.5));
 j = w(t[a + 152 >> 2] * w(.5));
 k = w(w(t[a + 148 >> 2] * t[a + 172 >> 2]) * w(.5));
 l = w(w(t[a + 152 >> 2] * t[a + 172 >> 2]) * w(.5));
 d = -1.5707963267948966;
 while (1) {
  if ((c | 0) != (f | 0)) {
   b = p[Ta(g, c) >> 2];
   e = w(d);
   a : {
    if (c & 1) {
     Be(a, b, l, k, e);
     break a;
    }
    Be(a, b, j, i, e);
   }
   c = c + 1 | 0;
   d = h + d;
   continue;
  }
  break;
 }
}
function gi(a, b) {
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
function an(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0, h = 0;
 f = sa - 16 | 0;
 sa = f;
 d = a + 8 | 0;
 Dc(a, a + 4 | 0, d, c);
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
function Ts(a, b) {
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
  b = b ? b + 152 | 0 : 0;
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
function Po(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 e = re(Wa(a), p[b >> 2]);
 a : {
  b : {
   f = Gb(a);
   if (!f) {
    break b;
   }
   g = gb(e, f);
   c = p[Ta(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((gb(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!td(ub(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[hb(d + 8 | 0, c) >> 2];
   break a;
  }
  c = Sc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function xn(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 Wa(a);
 e = p[b >> 2];
 a : {
  b : {
   f = Gb(a);
   if (!f) {
    break b;
   }
   g = gb(e, f);
   c = p[Ta(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((gb(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!Rc(ub(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[hb(d + 8 | 0, c) >> 2];
   break a;
  }
  c = Sc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function wt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  b : {
   switch (b + -56 | 0) {
   case 0:
    d = a, e = bb(c), p[d + 16 >> 2] = e;
    break a;
   case 1:
    d = a, e = bb(c), p[d + 20 >> 2] = e;
    break a;
   case 2:
    d = a, f = w(La(c)), t[d + 24 >> 2] = f;
    break a;
   case 3:
    d = a, e = bb(c), p[d + 28 >> 2] = e;
    break a;
   case 4:
    d = a, e = bb(c), p[d + 32 >> 2] = e;
    break a;
   case 5:
    d = a, e = bb(c), p[d + 36 >> 2] = e;
    break a;
   case 6:
    d = a, e = Oc(c), n[d + 40 | 0] = e;
    break a;
   default:
    break b;
   }
  }
  return wi(a, b, c) | 0;
 }
 return 1;
}
function lp(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 e = Jg(Wa(a), b);
 a : {
  b : {
   f = Gb(a);
   if (!f) {
    break b;
   }
   g = gb(e, f);
   c = p[Ta(a, g) >> 2];
   if (!c) {
    break b;
   }
   while (1) {
    c = p[c >> 2];
    if (!c) {
     break b;
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     if ((gb(p[c + 4 >> 2], f) | 0) != (g | 0)) {
      break b;
     }
    }
    if (p[c + 4 >> 2] != (e | 0)) {
     continue;
    }
    if (!Rc(ub(a), c + 8 | 0, b)) {
     continue;
    }
    break;
   }
   c = p[hb(d + 8 | 0, c) >> 2];
   break a;
  }
  c = Sc();
  p[d + 8 >> 2] = c;
 }
 sa = d + 16 | 0;
 return c;
}
function Zn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   switch (b + -33 | 0) {
   case 9:
    d = a, e = w(La(c)), t[d + 48 >> 2] = e;
    return 1;
   case 0:
    d = a, e = w(La(c)), t[d + 52 >> 2] = e;
    return 1;
   case 1:
    d = a, e = w(La(c)), t[d + 56 >> 2] = e;
    return 1;
   case 2:
    d = a, e = w(La(c)), t[d + 60 >> 2] = e;
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
  return wb(a, b, c) | 0;
 }
 d = a, e = w(La(c)), t[d + 64 >> 2] = e;
 return 1;
}
function Qo(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 e = sa - 32 | 0;
 sa = e;
 p[e + 24 >> 2] = b;
 b = p[a >> 2];
 f = e, g = Oa(a), p[f >> 2] = g;
 b = b + (ug(e + 24 | 0, e) << 2) | 0;
 a : {
  if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
   d = p[a + 4 >> 2];
   if ((d | 0) == (b | 0)) {
    Yc(a, c);
    break a;
   }
   Oo(a, b, d, b + 4 | 0);
   d = b;
   if (b >>> 0 <= c >>> 0) {
    c = c >>> 0 < s[a + 4 >> 2] ? c + 4 | 0 : c;
   }
   p[d >> 2] = p[c >> 2];
   break a;
  }
  d = Ma(a);
  d = Cd(e, Bd(a, cb(a) + 1 | 0), b - p[a >> 2] >> 2, d);
  No(d, c);
  b = Mo(a, d, b);
  Vc(d);
 }
 gf(b);
 sa = e + 32 | 0;
}
function Te(a, b, c, d, e, f, g, h) {
 var i = 0, j = 0, k = w(0), l = 0, m = w(0);
 i = sa - 48 | 0;
 sa = i;
 a : {
  if (pr(a, b, c, d)) {
   k = w(f + g);
   l = i + 48 | 0;
   j = i;
   while (1) {
    j = db(j) + 8 | 0;
    if ((l | 0) != (j | 0)) {
     continue;
    }
    break;
   }
   Hd(a, b, c, d, w(.5), i);
   b = i + 40 | 0;
   m = e;
   e = w(k * w(.5));
   e = Te(b, i + 32 | 0, i + 16 | 0, d, Te(a, i, i + 24 | 0, b, m, f, e, h), e, g, h);
   break a;
  }
  f = ei(a, d);
  e = w(f + e);
  if (f > w(.05000000074505806) ^ 1) {
   break a;
  }
  or(h, $a(i, g, e));
 }
 sa = i + 48 | 0;
 return e;
}
function Ye(a, b, c) {
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
      d = a, e = w(La(c)), t[d + 148 >> 2] = e;
      return 1;
     case 1:
      break d;
     }
    }
    d = a, e = w(La(c)), t[d + 152 >> 2] = e;
    return 1;
   }
   d = a, e = w(La(c)), t[d + 156 >> 2] = e;
   return 1;
  }
  d = a, e = w(La(c)), t[d + 160 >> 2] = e;
  return 1;
 }
 return Jd(a, b, c) | 0;
}
function Rs(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 96 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Pa(c), p[e >> 2] = f;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   Tb(p[p[p[b + 8 >> 2] >> 2] + 100 >> 2], a);
   Qa(b + 8 | 0);
   continue;
  } else {
   d = a;
   a = v(cb(c), 6) + 6 | 0;
   a = Na((a | 0) != (a & 1073741822) ? -1 : a << 2);
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
function Ls(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   switch (b + -104 | 0) {
   case 0:
    d = a, e = w(La(c)), t[d + 48 >> 2] = e;
    break a;
   case 1:
    d = a, e = w(La(c)), t[d + 52 >> 2] = e;
    break a;
   case 2:
    d = a, e = w(La(c)), t[d + 56 >> 2] = e;
    break a;
   case 3:
    d = a, e = w(La(c)), t[d + 60 >> 2] = e;
    break a;
   case 4:
    d = a, e = w(La(c)), t[d + 64 >> 2] = e;
    break a;
   case 5:
    d = a, e = w(La(c)), t[d + 68 >> 2] = e;
    break a;
   default:
    break b;
   }
  }
  return wb(a, b, c) | 0;
 }
 return 1;
}
function Ci(a) {
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
function $o(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  b : {
   switch (b + -7 | 0) {
   case 0:
    d = a, e = w(La(c)), t[d + 48 >> 2] = e;
    break a;
   case 1:
    d = a, e = w(La(c)), t[d + 52 >> 2] = e;
    break a;
   case 2:
    d = a, e = w(La(c)), t[d + 56 >> 2] = e;
    break a;
   case 3:
    d = a, e = w(La(c)), t[d + 60 >> 2] = e;
    break a;
   case 4:
    d = a, e = w(La(c)), t[d + 64 >> 2] = e;
    break a;
   case 5:
    d = a, e = w(La(c)), t[d + 68 >> 2] = e;
    break a;
   default:
    break b;
   }
  }
  return wb(a, b, c) | 0;
 }
 return 1;
}
function xo(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa + -64 | 0;
 sa = d;
 e = d + 24 | 0;
 Ug(e + 16 | 0);
 a : {
  if (!wo(a, e)) {
   ed(6740, 11, p[4408]);
   break a;
  }
  if (p[e >> 2] >= 7) {
   a = p[e >> 2];
   b = p[e + 4 >> 2];
   p[d + 8 >> 2] = 6;
   p[d + 12 >> 2] = 3;
   p[d + 4 >> 2] = b;
   p[d >> 2] = a;
   jb(p[4408], 6752, d);
   break a;
  }
  c = Na(16);
  p[c >> 2] = 0;
  p[c + 4 >> 2] = 0;
  p[c + 8 >> 2] = 0;
  p[c + 12 >> 2] = 0;
  p[c >> 2] = 0;
  ab(c + 4 | 0);
  if (vo(c, a, e)) {
   rg(c);
   Ua(c);
   break a;
  }
  p[b >> 2] = c;
 }
 vd(e + 16 | 0);
 sa = d - -64 | 0;
}
function hq(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 a : {
  d = a + 136 | 0;
  a = cb(d);
  if ((b | 0) == (a | 0)) {
   break a;
  }
  if (a >>> 0 >= b >>> 0) {
   c = b;
   while (1) {
    if ((a | 0) == (c | 0)) {
     gh(d, b);
     break a;
    }
    e = p[Ta(d, c) >> 2];
    if (e) {
     m[p[p[e >> 2] + 4 >> 2]](e);
    }
    c = c + 1 | 0;
    continue;
   }
  }
  gh(d, b);
  b = (a | 0) > (b | 0) ? a : b;
  while (1) {
   if ((a | 0) == (b | 0)) {
    break a;
   }
   c = _a(Na(64), 0, 64);
   Ub(c);
   f = Ta(d, a), g = c, p[f >> 2] = g;
   a = a + 1 | 0;
   continue;
  }
 }
}
function os(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a : {
  if (!ob(b, $c(8, 64))) {
   break a;
  }
  b = p[a + 76 >> 2];
  m[p[p[b >> 2] + 8 >> 2]](b);
  b = p[a + 76 >> 2];
  m[p[p[b >> 2] + 12 >> 2]](b, p[a + 52 >> 2]);
  b = a + 60 | 0;
  d = c, e = Oa(b), p[d + 8 >> 2] = e;
  d = c, e = Pa(b), p[d >> 2] = e;
  while (1) {
   if (!Ra(c + 8 | 0, c)) {
    break a;
   }
   b = p[a + 76 >> 2];
   m[p[p[b >> 2] + 16 >> 2]](b, p[p[p[p[c + 8 >> 2] >> 2] + 172 >> 2] + 56 >> 2], 19296);
   Qa(c + 8 | 0);
   continue;
  }
 }
 sa = c + 16 | 0;
}
function Zp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = w(0), f = w(0), g = w(0);
 if (ob(b, 8)) {
  e = t[a + 164 >> 2];
  d = t[a + 160 >> 2];
  g = t[a + 152 >> 2];
  c = a + 168 | 0;
  f = w(t[a + 148 >> 2] * w(-t[a + 156 >> 2]));
  Ab(c, f);
  d = w(g * w(-d));
  zb(c, d);
  Kc(c, e);
  c = a + 232 | 0;
  Ab(c, w(f + t[a + 148 >> 2]));
  zb(c, d);
  Kc(c, e);
  c = a + 296 | 0;
  Ab(c, w(f + t[a + 148 >> 2]));
  zb(c, w(d + t[a + 152 >> 2]));
  Kc(c, e);
  c = a + 360 | 0;
  Ab(c, f);
  zb(c, w(d + t[a + 152 >> 2]));
  Kc(c, e);
 }
 Gc(a, b);
}
function To(a) {
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
function Cb(a, b, c) {
 var d = 0, e = 0, f = 0, g = 0;
 d = sa - 16 | 0;
 sa = d;
 e = 0;
 a : {
  if ((Xb(r[a + 44 >> 1], b) | 0) == (b | 0)) {
   break a;
  }
  xd(a + 44 | 0, b);
  m[p[p[a >> 2] + 40 >> 2]](a, r[a + 44 >> 1]);
  hp(p[a + 40 >> 2], a);
  e = 1;
  if (!c) {
   break a;
  }
  a = a + 24 | 0;
  f = d, g = Oa(a), p[f + 8 >> 2] = g;
  f = d, g = Pa(a), p[f >> 2] = g;
  while (1) {
   if (Ra(d + 8 | 0, d)) {
    Cb(p[p[d + 8 >> 2] >> 2], b, 1);
    Qa(d + 8 | 0);
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
function Bs(a, b, c) {
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
function Jc(a, b, c) {
 var d = 0, e = 0, f = 0;
 a : {
  if ((b | 0) == 1 & a >>> 0 < 0 | b >>> 0 < 1) {
   d = a;
   break a;
  }
  while (1) {
   d = tv(a, b, 10);
   e = ta;
   f = e;
   e = sv(d, e, 10);
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
function tl(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Pa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Ra(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   if (m[p[p[a >> 2] + 12 >> 2]](a, 41) | 0) {
    kc(c, a);
    d = Fc(c, b);
    ib(c);
    if (d) {
     break a;
    }
   }
   Qa(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Pd(a, b) {
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
function Tp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 je(a, b);
 a : {
  if (!ob(b, 128)) {
   break a;
  }
  b = a + 160 | 0;
  e = c, f = Oa(b), p[e + 8 >> 2] = f;
  e = c, f = Pa(b), p[e >> 2] = f;
  while (1) {
   if (!Ra(c + 8 | 0, c)) {
    break a;
   }
   b = p[p[p[c + 8 >> 2] >> 2] + 52 >> 2];
   d = t[a + 112 >> 2];
   if (t[b + 4 >> 2] != d) {
    t[b + 4 >> 2] = d;
    m[p[p[b >> 2] >> 2]](b);
   }
   Qa(c + 8 | 0);
   continue;
  }
 }
 sa = c + 16 | 0;
}
function Dc(a, b, c, d) {
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
    Va(b, c);
    e = 1;
    if (!(m[p[d >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
     break a;
    }
    Va(a, b);
    break b;
   }
   if (f) {
    Va(a, c);
    return 1;
   }
   Va(a, b);
   e = 1;
   if (!(m[p[d >> 2]](p[c >> 2], p[b >> 2]) | 0)) {
    break a;
   }
   Va(b, c);
  }
  e = 2;
 }
 return e;
}
function _i(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 104 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Pa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Ra(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   if (m[p[p[a >> 2] + 12 >> 2]](a, 31) | 0) {
    kc(c, a);
    d = Fc(c, b);
    ib(c);
    if (d) {
     break a;
    }
   }
   Qa(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a;
}
function Bm(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0;
 b = sa - 48 | 0;
 sa = b;
 c = ab(b + 32 | 0);
 Am(b + 8 | 0, a);
 d = zm(b + 8 | 0);
 Bb(b + 8 | 0);
 ym(c, d);
 p[b + 12 >> 2] = p[c >> 2];
 p[b + 8 >> 2] = d;
 d = xm(b + 24 | 0, b + 8 | 0);
 um(p[d >> 2], a);
 a = Cs(b + 8 | 0, p[c >> 2], ac(c));
 p[b + 4 >> 2] = 0;
 xo(a, b + 4 | 0);
 a = p[b + 4 >> 2];
 Bb(d);
 Rf(c);
 if (p[c >> 2]) {
  Gf(c, p[c >> 2]);
  Ma(c);
  d = p[c >> 2];
  hc(c);
  Ua(d);
 }
 sa = b + 48 | 0;
 return a | 0;
}
function yo(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 a : {
  a = a + 132 | 0;
  d = cb(a);
  if (!d) {
   break a;
  }
  m[p[p[b >> 2] + 8 >> 2]](b);
  e = c, f = Oa(a), p[e + 8 >> 2] = f;
  e = c, f = Pa(a), p[e >> 2] = f;
  while (1) {
   if (!Ra(c + 8 | 0, c)) {
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   if (q[a + 56 | 0]) {
    m[p[p[b >> 2] + 24 >> 2]](b, p[a + 76 >> 2]);
   }
   Qa(c + 8 | 0);
   continue;
  }
 }
 sa = c + 16 | 0;
 return (d | 0) != 0;
}
function Er(a, b) {
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
  e = c, f = Pa(a), p[e >> 2] = f;
  while (1) {
   if (Ra(c + 8 | 0, c)) {
    a = p[p[c + 8 >> 2] >> 2];
    m[p[p[a >> 2] + 20 >> 2]](a, b) | 0;
    Qa(c + 8 | 0);
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
function xl(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Pa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Ra(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   if (df(a)) {
    kc(c, a);
    d = Fc(c, b);
    ib(c);
    if (d) {
     break a;
    }
   }
   Qa(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function vl(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Pa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Ra(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   if (of(a)) {
    kc(c, a);
    d = Fc(c, b);
    ib(c);
    if (d) {
     break a;
    }
   }
   Qa(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function Al(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 92 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Pa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Ra(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   if (gg(a)) {
    kc(c, a);
    d = Fc(c, b);
    ib(c);
    if (d) {
     break a;
    }
   }
   Qa(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function qt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  b : {
   c : {
    switch (b + -63 | 0) {
    case 0:
     e = a, f = w(La(c)), t[e + 4 >> 2] = f;
     break b;
    case 1:
     e = a, f = w(La(c)), t[e + 8 >> 2] = f;
     break b;
    case 2:
     e = a, f = w(La(c)), t[e + 12 >> 2] = f;
     break b;
    case 3:
     break c;
    default:
     break a;
    }
   }
   e = a, f = w(La(c)), t[e + 16 >> 2] = f;
  }
  d = 1;
 }
 return d | 0;
}
function wm(a, b) {
 var c = 0, d = 0;
 d = sa - 32 | 0;
 sa = d;
 a : {
  if (p[Ma(a) >> 2] - p[a + 4 >> 2] >>> 0 >= b >>> 0) {
   Nk(a, b);
   break a;
  }
  c = Ma(a);
  c = Lk(d + 8 | 0, Mk(a, ac(a) + b | 0), ac(a), c);
  Kk(c, b);
  Jk(a, c);
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
   p[Wa(c) >> 2];
   Ua(a);
  }
 }
 sa = d + 32 | 0;
}
function rf(a, b, c) {
 var d = 0, e = 0, f = 0;
 e = sa - 16 | 0;
 sa = e;
 if (4294967279 >= c >>> 0) {
  a : {
   if (c >>> 0 <= 10) {
    ui(a, c);
    d = a;
    break a;
   }
   f = xu(c) + 1 | 0;
   d = f;
   if (4294967295 < d >>> 0) {
    Nb();
    E();
   }
   d = Na(d);
   p[a >> 2] = d;
   p[a + 8 >> 2] = f | -2147483648;
   p[a + 4 >> 2] = c;
  }
  if (c) {
   Qb(d, b, c);
  }
  n[e + 15 | 0] = 0;
  ti(c + d | 0, e + 15 | 0);
  sa = e + 16 | 0;
  return;
 }
 Nb();
 E();
}
function Su(a) {
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
function mo(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 32 | 0;
 sa = c;
 a = a + 4 | 0;
 e = c, f = Oa(a), p[e + 24 >> 2] = f;
 e = c, f = Pa(a), p[e + 16 >> 2] = f;
 while (1) {
  a : {
   if (!Ra(c + 24 | 0, c + 16 | 0)) {
    a = 0;
    break a;
   }
   a = p[p[c + 24 >> 2] >> 2];
   kc(c, a);
   d = Fc(c, b);
   ib(c);
   if (d) {
    break a;
   }
   Qa(c + 24 | 0);
   continue;
  }
  break;
 }
 sa = c + 32 | 0;
 return a | 0;
}
function wp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0), e = w(0), f = w(0);
 if (ob(b, 8)) {
  d = t[a + 160 >> 2];
  f = t[a + 152 >> 2];
  c = a + 164 | 0;
  e = w(t[a + 148 >> 2] * w(-t[a + 156 >> 2]));
  Ab(c, w(e + w(t[a + 148 >> 2] * w(.5))));
  d = w(f * w(-d));
  zb(c, d);
  c = a + 228 | 0;
  Ab(c, w(e + t[a + 148 >> 2]));
  zb(c, w(d + t[a + 152 >> 2]));
  c = a + 292 | 0;
  Ab(c, e);
  zb(c, w(d + t[a + 152 >> 2]));
 }
 Gc(a, b);
}
function Bt(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 44 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Pa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Ra(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 20 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Qa(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function At(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 44 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Pa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Ra(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 24 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Qa(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function tn(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 8 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Pa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Ra(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 20 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Qa(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function sn(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 8 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Pa(a), p[d >> 2] = e;
 while (1) {
  a : {
   if (!Ra(c + 8 | 0, c)) {
    a = 0;
    break a;
   }
   a = p[p[c + 8 >> 2] >> 2];
   a = m[p[p[a >> 2] + 24 >> 2]](a, b) | 0;
   if (a) {
    break a;
   }
   Qa(c + 8 | 0);
   continue;
  }
  break;
 }
 sa = c + 16 | 0;
 return a | 0;
}
function pp(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa + -64 | 0;
 sa = b;
 d = Rg(b + 24 | 0);
 c = a + 116 | 0;
 Ag(d, a, c);
 e = b, f = Oa(c), p[e + 16 >> 2] = f;
 e = b, f = Pa(c), p[e + 8 >> 2] = f;
 c = 0;
 while (1) {
  if (Ra(b + 16 | 0, b + 8 | 0)) {
   p[p[p[b + 16 >> 2] >> 2] + 36 >> 2] = c;
   c = c + 1 | 0;
   Qa(b + 16 | 0);
   continue;
  } else {
   xd(a + 44 | 0, 2);
   Pg(d);
   sa = b - -64 | 0;
  }
  break;
 }
}
function rr(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Vq(d + 8 | 0, Wq(a, uc(a) + 1 | 0), uc(a), c);
 uh(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 3;
 Uq(a, c);
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
  p[Wa(c) >> 2];
  Ua(a);
 }
 sa = d + 32 | 0;
}
function Hm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0), f = 0;
 a : {
  switch (b + -114 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 52 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(La(c)), t[d + 56 >> 2] = e;
   return 1;
  case 3:
   d = a, f = bb(c), p[d + 60 >> 2] = f;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function Yi() {
 ga(19396, 13989);
 fa(19563, 13994, 1, 1, 0);
 hv();
 gv();
 fv();
 ev();
 dv();
 cv();
 bv();
 av();
 $u();
 _u();
 Zu();
 X(19440, 14100);
 X(19588, 14112);
 T(19589, 4, 14145);
 T(19590, 2, 14158);
 T(19591, 4, 14173);
 ea(19380, 14188);
 Yu();
 Wi(14234);
 Vi(14271);
 Ui(14310);
 Ti(14341);
 Si(14381);
 Ri(14410);
 Xu();
 Wu();
 Wi(14517);
 Vi(14549);
 Ui(14582);
 Ti(14615);
 Si(14649);
 Ri(14682);
 Vu();
 Uu();
}
function mf(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -15 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 52 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(La(c)), t[d + 56 >> 2] = e;
   return 1;
  case 3:
   d = a, e = w(La(c)), t[d + 60 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function as(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -84 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 80 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 84 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(La(c)), t[d + 88 >> 2] = e;
   return 1;
  case 3:
   d = a, e = w(La(c)), t[d + 92 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return _c(a, b, c) | 0;
}
function rg(a) {
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 4 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Pa(c), p[e >> 2] = f;
 while (1) {
  if (!Ra(b + 8 | 0, b)) {
   a = p[a >> 2];
   if (a) {
    m[p[p[a >> 2] + 4 >> 2]](a);
   }
   fb(c);
   sa = b + 16 | 0;
   return;
  }
  d = p[p[b + 8 >> 2] >> 2];
  if (d) {
   m[p[p[d >> 2] + 4 >> 2]](d);
  }
  Qa(b + 8 | 0);
  continue;
 }
}
function Un(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0), f = 0;
 a : {
  switch (b + -47 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 56 >> 2] = e;
   return 1;
  case 1:
   d = a, f = bb(c), p[d + 60 >> 2] = f;
   return 1;
  case 2:
   d = a, f = bb(c), p[d + 64 >> 2] = f;
   return 1;
  case 3:
   d = a, f = Oc(c), n[d + 68 | 0] = f;
   return 1;
  default:
   break a;
  }
 }
 return le(a, b, c) | 0;
}
function zn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -110 | 0) {
  case 0:
   d = a, e = bb(c), p[d + 64 >> 2] = e;
   return 1;
  case 1:
   d = a, e = bb(c), p[d + 68 >> 2] = e;
   return 1;
  case 2:
   d = a, e = bb(c), p[d + 72 >> 2] = e;
   return 1;
  case 3:
   d = a, e = bb(c), p[d + 76 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return mi(a, b, c) | 0;
}
function be(a, b, c, d, e, f) {
 var g = 0;
 g = ce(a, b, c, d, f);
 if (m[p[f >> 2]](p[e >> 2], p[d >> 2]) | 0) {
  Va(d, e);
  if (!(m[p[f >> 2]](p[d >> 2], p[c >> 2]) | 0)) {
   return g + 1 | 0;
  }
  Va(c, d);
  if (!(m[p[f >> 2]](p[c >> 2], p[b >> 2]) | 0)) {
   return g + 2 | 0;
  }
  Va(b, c);
  if (!(m[p[f >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
   return g + 3 | 0;
  }
  Va(a, b);
  g = g + 4 | 0;
 }
 return g;
}
function yi(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 1536;
 c = a + 44 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Pa(c), p[e >> 2] = f;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   d = p[p[b + 8 >> 2] >> 2];
   if (d) {
    m[p[p[d >> 2] + 4 >> 2]](d);
   }
   Qa(b + 8 | 0);
   continue;
  }
  break;
 }
 fb(c);
 pf(a);
 sa = b + 16 | 0;
 return a | 0;
}
function Ip(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 n[b + 15 | 0] = q[a | 0];
 a = a + 4 | 0;
 c = b, d = Oa(a), p[c + 8 >> 2] = d;
 c = b, d = Pa(a), p[c >> 2] = d;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   a = p[p[b + 8 >> 2] >> 2];
   ah(b + 15 | 0, m[p[p[a >> 2] + 56 >> 2]](a) | 0);
   Qa(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
   a = q[b + 15 | 0];
  }
  break;
 }
 return a;
}
function wr(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 a : {
  b = m[p[p[b >> 2] + 72 >> 2]](b, p[a + 4 >> 2]) | 0;
  if (!b) {
   break a;
  }
  a = a + 8 | 0;
  f = e, g = Oa(a), p[f + 8 >> 2] = g;
  f = e, g = Pa(a), p[f >> 2] = g;
  while (1) {
   if (!Ra(e + 8 | 0, e)) {
    break a;
   }
   Tn(p[p[e + 8 >> 2] >> 2], b, c, d);
   Qa(e + 8 | 0);
   continue;
  }
 }
 sa = e + 16 | 0;
}
function Pi(a, b) {
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
    a = Pi(a * 0x10000000000000000, b);
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
function Iu(a, b) {
 var c = 0, d = 0;
 c = sa - 160 | 0;
 sa = c;
 Qb(c + 8 | 0, 18184, 144);
 p[c + 52 >> 2] = a;
 p[c + 28 >> 2] = a;
 d = -2 - a | 0;
 d = 2147483647 > d >>> 0 ? d : 2147483647;
 p[c + 56 >> 2] = d;
 a = a + d | 0;
 p[c + 36 >> 2] = a;
 p[c + 24 >> 2] = a;
 Oi(c + 8 | 0, 13986, b, 770, 771);
 if (d) {
  a = p[c + 28 >> 2];
  n[a - ((a | 0) == p[c + 24 >> 2]) | 0] = 0;
 }
 sa = c + 160 | 0;
}
function pi(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 1084;
 c = a + 8 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Pa(c), p[e >> 2] = f;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   d = p[p[b + 8 >> 2] >> 2];
   if (d) {
    m[p[p[d >> 2] + 4 >> 2]](d);
   }
   Qa(b + 8 | 0);
   continue;
  }
  break;
 }
 fb(c);
 sa = b + 16 | 0;
 return a | 0;
}
function mg(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 1192;
 c = a + 8 | 0;
 e = b, f = Oa(c), p[e + 8 >> 2] = f;
 e = b, f = Pa(c), p[e >> 2] = f;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   d = p[p[b + 8 >> 2] >> 2];
   if (d) {
    m[p[p[d >> 2] + 4 >> 2]](d);
   }
   Qa(b + 8 | 0);
   continue;
  }
  break;
 }
 fb(c);
 sa = b + 16 | 0;
 return a | 0;
}
function hf(a, b, c) {
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
function ld(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0;
 a : {
  b : {
   c : {
    switch (b + -67 | 0) {
    case 0:
     e = a, f = bb(c), p[e + 4 >> 2] = f;
     break b;
    case 1:
     e = a, f = bb(c), p[e + 8 >> 2] = f;
     break b;
    case 2:
     break c;
    default:
     break a;
    }
   }
   e = a, f = bb(c), p[e + 12 >> 2] = f;
  }
  d = 1;
 }
 return d | 0;
}
function yr(a, b) {
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
function us(a, b) {
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
function Ce(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 4620;
 c = a + 136 | 0;
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Pa(c), p[d >> 2] = e;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   c = p[p[b + 8 >> 2] >> 2];
   if (c) {
    m[p[p[c >> 2] + 4 >> 2]](c);
   }
   Qa(b + 8 | 0);
   continue;
  }
  break;
 }
 qc(a);
 sa = b + 16 | 0;
 return a | 0;
}
function Oo(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 f = sa - 16 | 0;
 sa = f;
 h = p[a + 4 >> 2];
 g = (h - d | 0) + b | 0;
 e = Dd(f, a, c - g >> 2);
 d = g;
 while (1) {
  if (d >>> 0 < c >>> 0) {
   oc(Ma(a), p[e + 4 >> 2], d);
   p[e + 4 >> 2] = p[e + 4 >> 2] + 4;
   d = d + 4 | 0;
   continue;
  }
  break;
 }
 Vb(e);
 a = g - b | 0;
 if (a) {
  Di(h - a | 0, b, a);
 }
 sa = f + 16 | 0;
}
function yu(a, b, c) {
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 b = b - a >> 2;
 while (1) {
  if (b) {
   p[d + 12 >> 2] = a;
   e = b >>> 1 | 0;
   p[d + 12 >> 2] = p[d + 12 >> 2] + (e << 2);
   if (qe(p[d + 12 >> 2], c)) {
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
function Fc(a, b) {
 var c = 0, d = 0, e = 0;
 c = Pc(a);
 a : {
  if ((c | 0) != (Pc(b) | 0)) {
   break a;
  }
  d = Ec(a);
  b = Ec(b);
  if (!Ic(a)) {
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
   a = Gu(d, b, c);
  } else {
   a = 0;
  }
  e = !a;
 }
 return e;
}
function wb(a, b, c) {
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
     Sb(d, c);
     vi(a + 4 | 0, d);
     ib(d);
     break b;
    case 1:
     break c;
    default:
     break a;
    }
   }
   f = a, g = bb(c), p[f + 16 >> 2] = g;
  }
  e = 1;
 }
 sa = d + 16 | 0;
 return e | 0;
}
function As(a, b) {
 var c = 0, d = 0, e = 0, f = 0, g = 0;
 c = sa;
 f = c;
 e = bb(b);
 g = ta;
 a : {
  if (q[b + 8 | 0]) {
   li(a);
   break a;
  }
  d = c;
  c = e;
  d = d - (c + 15 & -16) | 0;
  sa = d;
  c = zs(c & 255, p[b >> 2], p[b + 4 >> 2], d);
  b : {
   if ((e | 0) != (c | 0) | g) {
    dd(b);
    li(a);
    break b;
   }
   p[b >> 2] = c + p[b >> 2];
   jf(a, d);
  }
 }
 sa = f;
}
function Rp(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 ke(a);
 c = a + 160 | 0;
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Pa(c), p[d >> 2] = e;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   c = p[p[p[b + 8 >> 2] >> 2] + 48 >> 2];
   m[p[p[c >> 2] + 20 >> 2]](c, p[a + 128 >> 2]);
   Qa(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function Hp(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 a = a + 4 | 0;
 c = b, d = Oa(a), p[c + 8 >> 2] = d;
 c = b, d = Pa(a), p[c >> 2] = d;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   a = p[p[b + 8 >> 2] >> 2];
   if (ze(a)) {
    a = p[a + 72 >> 2];
    if (a) {
     m[p[p[a >> 2] + 4 >> 2]](a);
    }
   }
   Qa(b + 8 | 0);
   continue;
  }
  break;
 }
 sa = b + 16 | 0;
}
function _j(a, b, c, d, e, f, g) {
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
 Rj(p[a + 8 >> 2], h + 28 | 0, h + 24 | 0, h + 20 | 0, h + 16 | 0, h + 12 | 0, h + 8 | 0);
 sa = h + 32 | 0;
}
function eq(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = w(0), f = w(0), g = 0;
 d = a + 136 | 0;
 e = w(t[a + 148 >> 2] * w(.5));
 f = w(t[a + 152 >> 2] * w(.5));
 g = 6.283185307179586 / +p[a + 164 >> 2];
 b = -1.5707963267948966;
 while (1) {
  if ((c | 0) < p[a + 164 >> 2]) {
   Be(a, p[Ta(d, c) >> 2], f, e, w(b));
   c = c + 1 | 0;
   b = g + b;
   continue;
  }
  break;
 }
}
function Xr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0;
 e = sa - 16 | 0;
 sa = e;
 ih(a, b, c);
 d = p[a + 56 >> 2];
 f = Ib(e + 8 | 0, _h(a));
 lf(t[Ja(f, 0) >> 2], t[Ja(f, 1) >> 2], p[d + 68 >> 2], p[d + 64 >> 2], b, c, $h(d));
 a = Ib(e, Zh(a));
 lf(t[Ja(a, 0) >> 2], t[Ja(a, 1) >> 2], p[d + 76 >> 2], p[d + 72 >> 2], b, c, ec(d));
 sa = e + 16 | 0;
}
function Br(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 a = a + 8 | 0;
 d = c, e = Oa(a), p[d + 8 >> 2] = e;
 d = c, e = Pa(a), p[d >> 2] = e;
 while (1) {
  if (Ra(c + 8 | 0, c)) {
   a = p[p[c + 8 >> 2] >> 2];
   m[p[p[a >> 2] + 24 >> 2]](a, b) | 0;
   Qa(c + 8 | 0);
   continue;
  } else {
   sa = c + 16 | 0;
  }
  break;
 }
 return 0;
}
function wn(a) {
 var b = 0, c = w(0), d = 0, e = w(0);
 b = a - -64 | 0;
 a : {
  if (t[a + 48 >> 2] != w(0)) {
   vs(b, t[a + 48 >> 2]);
   break a;
  }
  fi(b);
 }
 c = w(m[p[p[a >> 2] + 68 >> 2]](a));
 b = a - -64 | 0;
 d = Ja(b, 4), e = c, t[d >> 2] = e;
 c = w(m[p[p[a >> 2] + 72 >> 2]](a));
 d = Ja(b, 5), e = c, t[d >> 2] = e;
 ts(b, t[a + 52 >> 2], t[a + 56 >> 2]);
}
function xi(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 a = a + 44 | 0;
 f = e, g = Oa(a), p[f + 8 >> 2] = g;
 f = e, g = Pa(a), p[f >> 2] = g;
 while (1) {
  if (Ra(e + 8 | 0, e)) {
   wr(p[p[e + 8 >> 2] >> 2], b, c, d);
   Qa(e + 8 | 0);
   continue;
  } else {
   sa = e + 16 | 0;
  }
  break;
 }
}
function fs(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -79 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 80 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 84 >> 2] = e;
   return 1;
  case 2:
   d = a, e = w(La(c)), t[d + 88 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return _c(a, b, c) | 0;
}
function Qs(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 e = c, f = Oa(b), p[e + 8 >> 2] = f;
 e = c, f = Pa(b), p[e >> 2] = f;
 b = a + 72 | 0;
 while (1) {
  if (Ra(c + 8 | 0, c)) {
   d = p[p[c + 8 >> 2] >> 2];
   m[p[p[d >> 2] + 56 >> 2]](d, b, p[a + 108 >> 2]);
   Qa(c + 8 | 0);
   continue;
  } else {
   sa = c + 16 | 0;
  }
  break;
 }
}
function bq(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Tc(a + 12 | 0, d);
 if (b) {
  if (1073741823 < b >>> 0) {
   Nb();
   E();
  }
  f = Na(b << 2);
 }
 p[a >> 2] = f;
 c = (c << 2) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Wa(a), h = (b << 2) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function Vq(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Tc(a + 12 | 0, d);
 if (b) {
  if (1431655765 < b >>> 0) {
   Nb();
   E();
  }
  f = Na(v(b, 3));
 }
 p[a >> 2] = f;
 c = v(c, 3) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Wa(a), h = v(b, 3) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function Ke(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Tc(a + 12 | 0, d);
 if (b) {
  if (536870911 < b >>> 0) {
   Nb();
   E();
  }
  f = Na(b << 3);
 }
 p[a >> 2] = f;
 c = (c << 3) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Wa(a), h = (b << 3) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function Fb(a, b) {
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
function Qu(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 var e = 0;
 e = sa - 16 | 0;
 sa = e;
 a : {
  if (!tf($(p[a + 60 >> 2], b | 0, c | 0, d & 255, e + 8 | 0) | 0)) {
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
function wq(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 Tb(p[a + 48 >> 2], a);
 c = Ee(p[a + 48 >> 2]);
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Pa(c), p[d >> 2] = e;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   Tb(p[p[b + 8 >> 2] >> 2], a);
   Qa(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function Nk(a, b) {
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
   Mc(p[b + 4 >> 2]);
   d = p[b + 4 >> 2] + 1 | 0;
   p[b + 4 >> 2] = d;
   continue;
  }
  break;
 }
 Vb(b);
 sa = c + 16 | 0;
}
function ks(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -92 | 0) {
  case 0:
   d = a, e = bb(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = bb(c), p[d + 52 >> 2] = e;
   return 1;
  case 2:
   d = a, e = Oc(c), n[d + 56 | 0] = e;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function vb(a, b, c, d, e) {
 var f = 0;
 f = sa - 256 | 0;
 sa = f;
 if (!(e & 73728 | (c | 0) <= (d | 0))) {
  c = c - d | 0;
  d = c >>> 0 < 256;
  _a(f, b & 255, d ? c : 256);
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
function fp(a, b) {
 a = a | 0;
 b = b | 0;
 if (ob(b, 4)) {
  kp(a);
 }
 if (ob(b, 8)) {
  b = p[a + 160 >> 2];
  m[p[p[b >> 2] + 8 >> 2]](b);
  Lg(p[a + 160 >> 2], w(0), w(0), t[a + 48 >> 2], t[a + 52 >> 2]);
  Lg(p[a + 156 >> 2], w(t[a + 64 >> 2] * w(-t[a + 48 >> 2])), w(t[a + 68 >> 2] * w(-t[a + 52 >> 2])), t[a + 48 >> 2], t[a + 52 >> 2]);
 }
}
function je(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0);
 if (ob(b, 32)) {
  wn(a);
 }
 if (ob(b, 64)) {
  vn(a);
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
  c = a, d = w(w(m[p[p[b >> 2] + 64 >> 2]](b)) * t[a + 112 >> 2]), t[c + 112 >> 2] = d;
 }
}
function Lk(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Tc(a + 12 | 0, d);
 if (b) {
  if (4294967295 < b >>> 0) {
   Nb();
   E();
  }
  f = Na(b);
 }
 p[a >> 2] = f;
 c = c + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Wa(a), h = b + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function hi(a, b) {
 var c = 0, d = 0;
 c = a, d = p[Ja(b, 0) >> 2], p[c >> 2] = d;
 c = a, d = p[Ja(b, 1) >> 2], p[c + 4 >> 2] = d;
 c = a, d = p[Ja(b, 2) >> 2], p[c + 8 >> 2] = d;
 c = a, d = p[Ja(b, 3) >> 2], p[c + 12 >> 2] = d;
 c = a, d = p[Ja(b, 4) >> 2], p[c + 16 >> 2] = d;
 c = a, d = p[Ja(b, 5) >> 2], p[c + 20 >> 2] = d;
 return a;
}
function ps(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 60 | 0;
 d = b, e = Oa(c), p[d + 8 >> 2] = e;
 d = b, e = Pa(c), p[d >> 2] = e;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   Tb(p[p[p[b + 8 >> 2] >> 2] + 172 >> 2], a);
   Qa(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function Tm(a, b, c) {
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
function Ih(a, b, c, d, e, f, g) {
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
 Re(i, Se(h + 8 | 0, 1, lb(a) & 255));
 Hc(a, $a(h + 8 | 0, b, c));
 Hc(a, $a(h + 8 | 0, d, e));
 Hc(a, $a(h + 8 | 0, f, g));
 sa = h + 16 | 0;
}
function $b(a, b) {
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
function cl(a, b) {
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
function ce(a, b, c, d, e) {
 var f = 0;
 f = Dc(a, b, c, e);
 if (m[p[e >> 2]](p[d >> 2], p[c >> 2]) | 0) {
  Va(c, d);
  if (!(m[p[e >> 2]](p[c >> 2], p[b >> 2]) | 0)) {
   return f + 1 | 0;
  }
  Va(b, c);
  if (!(m[p[e >> 2]](p[b >> 2], p[a >> 2]) | 0)) {
   return f + 2 | 0;
  }
  Va(a, b);
  f = f + 3 | 0;
 }
 return f;
}
function Io(a, b, c) {
 var d = 0;
 d = sa - 32 | 0;
 sa = d;
 p[d + 24 >> 2] = b;
 b = dh(d + 8 | 0, a + 8 | 0, Ho(b, c));
 while (1) {
  if (p[b >> 2] != p[b + 4 >> 2]) {
   oc(p[a + 16 >> 2], p[b >> 2], p[d + 24 >> 2]);
   p[b >> 2] = p[b >> 2] + 4;
   Qa(d + 24 | 0);
   continue;
  }
  break;
 }
 Fd(b);
 sa = d + 32 | 0;
}
function eo(a) {
 qg(a);
 p[a + 28 >> 2] = 0;
 p[a + 32 >> 2] = 0;
 p[a + 24 >> 2] = 1065353216;
 p[a + 16 >> 2] = 60;
 p[a + 20 >> 2] = 60;
 p[a >> 2] = 7600;
 n[a + 33 | 0] = 0;
 n[a + 34 | 0] = 0;
 n[a + 35 | 0] = 0;
 n[a + 36 | 0] = 0;
 n[a + 37 | 0] = 0;
 n[a + 38 | 0] = 0;
 n[a + 39 | 0] = 0;
 n[a + 40 | 0] = 0;
}
function ht(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 a = a + 124 | 0;
 c = b, d = Oa(a), p[c + 8 >> 2] = d;
 c = b, d = Pa(a), p[c >> 2] = d;
 while (1) {
  if (Ra(b + 8 | 0, b)) {
   fg(p[p[b + 8 >> 2] >> 2]);
   Qa(b + 8 | 0);
   continue;
  } else {
   sa = b + 16 | 0;
  }
  break;
 }
}
function Gu(a, b, c) {
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
function Cd(a, b, c, d) {
 var e = 0, f = 0, g = 0, h = 0;
 e = sa - 16 | 0;
 sa = e;
 p[e + 12 >> 2] = 0;
 Tc(a + 12 | 0, d);
 if (b) {
  f = Fe(b);
 }
 p[a >> 2] = f;
 c = (c << 2) + f | 0;
 p[a + 8 >> 2] = c;
 p[a + 4 >> 2] = c;
 g = Wa(a), h = (b << 2) + f | 0, p[g >> 2] = h;
 sa = e + 16 | 0;
 return a;
}
function vs(a, b) {
 var c = w(0), d = 0, e = w(0), f = 0;
 c = Cc(b);
 b = Bc(b);
 d = Ja(a, 0), e = b, t[d >> 2] = e;
 d = Ja(a, 1), e = c, t[d >> 2] = e;
 d = Ja(a, 2), e = w(-c), t[d >> 2] = e;
 d = Ja(a, 3), e = b, t[d >> 2] = e;
 d = Ja(a, 4), f = 0, p[d >> 2] = f;
 d = Ja(a, 5), f = 0, p[d >> 2] = f;
}
function eh(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  switch (b + -125 | 0) {
  case 0:
   d = a, e = bb(c), p[d + 164 >> 2] = e;
   return 1;
  case 1:
   d = a, f = w(La(c)), t[d + 168 >> 2] = f;
   return 1;
  default:
   break a;
  }
 }
 return Ye(a, b, c) | 0;
}
function Kj(a, b, c, d, e, f) {
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
  d = eg(g, d);
 }
 Af(b, c, f, w(t[a + 24 >> 2] + w(d * w(t[e + 24 >> 2] - t[a + 24 >> 2]))));
}
function Bh(a, b) {
 var c = 0, d = 0, e = w(0);
 c = sa - 16 | 0;
 sa = c;
 d = c, e = w(x(w(t[Ja(a, 0) >> 2] - t[Ja(b, 0) >> 2]))), t[d + 12 >> 2] = e;
 d = c, e = w(x(w(t[Ja(a, 1) >> 2] - t[Ja(b, 1) >> 2]))), t[d + 8 >> 2] = e;
 a = ar(c + 12 | 0, c + 8 | 0);
 sa = c + 16 | 0;
 return t[a >> 2] > w(1);
}
function qv(a, b, c) {
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
function Pm(a, b) {
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
function Ln(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 a : {
  switch (b + -38 | 0) {
  case 0:
   d = a, e = Jb(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, f = w(La(c)), t[d + 52 >> 2] = f;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function io(a) {
 var b = 0;
 co(a);
 b = a + 72 | 0;
 p[b >> 2] = 8952;
 kg(a + 76 | 0);
 p[a >> 2] = 6108;
 p[b >> 2] = 6192;
 ab(a + 92 | 0);
 ab(a + 104 | 0);
 ab(a + 116 | 0);
 ab(a + 128 | 0);
 ab(a + 140 | 0);
 p[a + 160 >> 2] = 0;
 p[a + 164 >> 2] = 0;
 p[a + 152 >> 2] = 0;
 p[a + 156 >> 2] = 0;
}
function Xs(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -90 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 136 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 140 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return si(a, b, c) | 0;
}
function Jd(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -13 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 120 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 124 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return mf(a, b, c) | 0;
}
function _c(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -24 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 52 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function Yr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 a : {
  switch (b + -82 | 0) {
  case 0:
   d = a, e = w(La(c)), t[d + 80 >> 2] = e;
   return 1;
  case 1:
   d = a, e = w(La(c)), t[d + 84 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return _c(a, b, c) | 0;
}
function en(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0), g = w(0), h = w(0), i = w(0);
 a = p[a + 76 >> 2];
 e = a, f = t[Ja(b, 0) >> 2], g = t[Ja(b, 1) >> 2], h = t[Ja(c, 0) >> 2], i = t[Ja(c, 1) >> 2], d = p[p[a >> 2] + 24 >> 2], m[d](e | 0, w(f), w(g), w(h), w(i));
}
function $m(a, b, c) {
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
function Mq(a, b) {
 a = a | 0;
 b = b | 0;
 b = rd(a, b);
 if (!b) {
  b = p[a + 20 >> 2];
  while (1) {
   a : {
    if (b) {
     if (!ef(b)) {
      break a;
     }
     p[a + 128 >> 2] = b;
     Up(b, a);
    }
    return !b | 0;
   }
   b = p[b + 20 >> 2];
   continue;
  }
 }
 return b | 0;
}
function kl(a, b) {
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
 a = ws(Na(16), c);
 sa = c + 16 | 0;
 return a | 0;
}
function dl(a, b) {
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
 a = mv(c);
 ib(c);
 sa = c + 16 | 0;
 return a | 0;
}
function Ac(a) {
 var b = 0, c = 0;
 b = p[5048];
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
  p[5048] = a;
  return b;
 }
 p[4904] = 48;
 return -1;
}
function mi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -102 | 0) {
  case 0:
   d = a, e = bb(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = bb(c), p[d + 52 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function Yo(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 a : {
  switch (b + -119 | 0) {
  case 0:
   d = a, e = bb(c), p[d + 48 >> 2] = e;
   return 1;
  case 1:
   d = a, e = bb(c), p[d + 52 >> 2] = e;
   return 1;
  default:
   break a;
  }
 }
 return wb(a, b, c) | 0;
}
function hk(a, b, c, d, e, f, g, h) {
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
function Wq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Tq(a);
 if (d >>> 0 >= b >>> 0) {
  a = sc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Ob(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 fd();
 E();
}
function Pj(a, b, c, d, e, f, g) {
 var h = 0;
 h = sa - 16 | 0;
 sa = h;
 p[h + 12 >> 2] = a;
 yb(h + 12 | 0, t[b >> 2]);
 yb(h + 12 | 0, t[c >> 2]);
 yb(h + 12 | 0, t[d >> 2]);
 yb(h + 12 | 0, t[e >> 2]);
 yb(h + 12 | 0, t[f >> 2]);
 yb(h + 12 | 0, t[g >> 2]);
 sa = h + 16 | 0;
 return a;
}
function Mk(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Ik(a);
 if (d >>> 0 >= b >>> 0) {
  a = hc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Ob(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 fd();
 E();
}
function Le(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = _q(a);
 if (d >>> 0 >= b >>> 0) {
  a = tc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Ob(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 fd();
 E();
}
function Bd(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = Yg(a);
 if (d >>> 0 >= b >>> 0) {
  a = rc(a);
  if (a >>> 0 < d >>> 1 >>> 0) {
   p[c + 8 >> 2] = a << 1;
   d = p[Ob(c + 8 | 0, c + 12 | 0) >> 2];
  }
  sa = c + 16 | 0;
  return d;
 }
 fd();
 E();
}
function aq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Dd(c, a, b);
 d = p[b + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (d | 0)) {
   Ma(a);
   oe(p[b + 4 >> 2]);
   d = p[b + 4 >> 2] + 4 | 0;
   p[b + 4 >> 2] = d;
   continue;
  }
  break;
 }
 Vb(b);
 sa = c + 16 | 0;
}
function Rq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Me(c, a, b);
 d = p[b + 4 >> 2];
 while (1) {
  if (p[b + 8 >> 2] != (d | 0)) {
   Ma(a);
   sh(p[b + 4 >> 2]);
   d = p[b + 4 >> 2] + 8 | 0;
   p[b + 4 >> 2] = d;
   continue;
  }
  break;
 }
 Vb(b);
 sa = c + 16 | 0;
}
function ov(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = w(0);
 b = 0;
 while (1) {
  if ((b | 0) != 11) {
   c = (b << 2) + a | 0, d = Gd(w(w(b | 0) * w(.10000000149011612)), t[a + 4 >> 2], t[a + 12 >> 2]), t[c + 20 >> 2] = d;
   b = b + 1 | 0;
   continue;
  }
  break;
 }
 return 0;
}
function bb(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = Bs(p[a >> 2], p[a + 4 >> 2], b + 8 | 0);
 a : {
  if (!c) {
   dd(a);
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
function lc(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 d = c, e = fo(a + 16 | 0, c + 12 | 0), p[d + 8 >> 2] = e;
 d = c, e = Sg(), p[d >> 2] = e;
 a = -1;
 if (!Bg(c + 8 | 0, c)) {
  a = p[yd(c + 8 | 0) + 4 >> 2];
 }
 sa = c + 16 | 0;
 return a;
}
function fc(a, b, c, d) {
 var e = w(0), f = w(0), g = w(0), h = 0, i = w(0);
 e = t[Ja(b, 0) >> 2];
 f = t[Ja(b, 1) >> 2];
 g = t[Ja(c, 0) >> 2];
 h = Ja(a, 0), i = w(e + w(w(g - e) * d)), t[h >> 2] = i;
 e = t[Ja(c, 1) >> 2];
 h = Ja(a, 1), i = w(f + w(w(e - f) * d)), t[h >> 2] = i;
}
function zl(a, b, c, d, e, f) {
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
  d = eg(g, d);
 }
 Lf(b, c, f, bg(p[a + 24 >> 2], p[e + 24 >> 2], d));
}
function qr(a, b) {
 var c = 0, d = 0;
 d = sa - 32 | 0;
 sa = d;
 a : {
  if (p[Ma(a) >> 2] - p[a + 4 >> 2] >> 3 >>> 0 >= b >>> 0) {
   Rq(a, b);
   break a;
  }
  c = Ma(a);
  c = Ke(d + 8 | 0, Le(a, lb(a) + b | 0), lb(a), c);
  Qq(c, b);
  vh(a, c);
  Je(c);
 }
 sa = d + 32 | 0;
}
function gq(a, b) {
 var c = 0, d = 0;
 d = sa - 32 | 0;
 sa = d;
 a : {
  if (p[Ma(a) >> 2] - p[a + 4 >> 2] >> 2 >>> 0 >= b >>> 0) {
   aq(a, b);
   break a;
  }
  c = Ma(a);
  c = Cd(d + 8 | 0, Bd(a, cb(a) + b | 0), cb(a), c);
  $p(c, b);
  Ae(a, c);
  Vc(c);
 }
 sa = d + 32 | 0;
}
function Mo(a, b, c) {
 var d = 0, e = 0, f = 0;
 cf(a);
 e = p[b + 4 >> 2];
 d = b + 4 | 0;
 wd(Ma(a), p[a >> 2], c, d);
 f = c;
 c = b + 8 | 0;
 lh(Ma(a), f, p[a + 4 >> 2], c);
 Va(a, d);
 Va(a + 4 | 0, c);
 Va(Ma(a), Wa(b));
 p[b >> 2] = p[b + 4 >> 2];
 we(a, cb(a));
 return e;
}
function Lc(a, b, c) {
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
 Td(d, c);
 a = m[a | 0](b, d) | 0;
 ib(d);
 sa = d + 16 | 0;
 return a | 0;
}
function Fo(a) {
 a = a | 0;
 var b = 0;
 a : {
  b : {
   b = p[a + 40 >> 2];
   b = m[p[p[b >> 2] + 72 >> 2]](b, p[a + 48 >> 2]) | 0;
   if (b) {
    if (zd(b)) {
     break b;
    }
   }
   p[a + 52 >> 2] = 0;
   break a;
  }
  p[a + 52 >> 2] = b;
 }
 Cb(p[a + 40 >> 2], 4, 0);
}
function sf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 a : {
  if (!Ic(b)) {
   p[a + 8 >> 2] = p[b + 8 >> 2];
   d = p[b + 4 >> 2];
   p[a >> 2] = p[b >> 2];
   p[a + 4 >> 2] = d;
   break a;
  }
  rf(a, p[b >> 2], p[b + 4 >> 2]);
 }
 sa = c + 16 | 0;
 return a;
}
function fi(a) {
 var b = 0, c = 0;
 b = Ja(a, 0), c = 1065353216, p[b >> 2] = c;
 b = Ja(a, 1), c = 0, p[b >> 2] = c;
 b = Ja(a, 2), c = 0, p[b >> 2] = c;
 b = Ja(a, 3), c = 1065353216, p[b >> 2] = c;
 b = Ja(a, 4), c = 0, p[b >> 2] = c;
 b = Ja(a, 5), c = 0, p[b >> 2] = c;
}
function Ql(a, b) {
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
function qs(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Fb(a, b);
 a : {
  if (c) {
   break a;
  }
  c = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!df(b)) {
   break a;
  }
  p[a + 72 >> 2] = b;
  c = 0;
 }
 return c | 0;
}
function Bo(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Fb(a, b);
 a : {
  if (c) {
   break a;
  }
  c = 1;
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!ff(b)) {
   break a;
  }
  p[a + 56 >> 2] = b;
  c = 0;
 }
 return c | 0;
}
function Om(a) {
 var b = 0;
 Wb(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 11320;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 b = a - -64 | 0;
 p[b >> 2] = 11392;
 p[a >> 2] = 11224;
 p[b >> 2] = 11304;
 b = md();
 p[a + 72 >> 2] = 0;
 p[a + 68 >> 2] = b;
}
function Ig(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 b = Ma(b);
 a = Fg(a, Na(16), Gg(e + 8 | 0, b));
 So(p[a >> 2] + 8 | 0, p[d >> 2]);
 f = Db(a), g = 1, n[f + 4 | 0] = g;
 p[p[a >> 2] + 4 >> 2] = c;
 p[p[a >> 2] >> 2] = 0;
 sa = e + 16 | 0;
}
function Cj(a, b, c, d, e) {
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
 wf(a, 11920, f + 12 | 0, f + 8 | 0, f + 4 | 0, f);
 sa = f + 16 | 0;
}
function Aj(a, b, c, d, e) {
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
 wf(a, 11935, f + 12 | 0, f + 8 | 0, f + 4 | 0, f);
 sa = f + 16 | 0;
}
function pg(a) {
 var b = 0;
 wc(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 7668;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 p[a + 64 >> 2] = 1065353216;
 b = lg(a + 68 | 0);
 p[a >> 2] = 10728;
 p[b >> 2] = 10812;
 ab(a + 80 | 0);
 p[a + 96 >> 2] = 0;
}
function Ko(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 b = Ma(b);
 a = Fg(a, Na(12), Gg(e + 8 | 0, b));
 oc(b, p[a >> 2] + 8 | 0, d);
 f = Db(a), g = 1, n[f + 4 | 0] = g;
 p[p[a >> 2] + 4 >> 2] = c;
 p[p[a >> 2] >> 2] = 0;
 sa = e + 16 | 0;
}
function st(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 if (Ic(a)) {
  Ua(p[a >> 2]);
 }
 p[a + 8 >> 2] = p[b + 8 >> 2];
 d = p[b + 4 >> 2];
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = d;
 ui(b, 0);
 n[c + 15 | 0] = 0;
 ti(b, c + 15 | 0);
 sa = c + 16 | 0;
}
function Qq(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Pq(c, a + 8 | 0, b);
 a = p[b >> 2];
 while (1) {
  if (p[b + 4 >> 2] != (a | 0)) {
   sh(p[b >> 2]);
   a = p[b >> 2] + 8 | 0;
   p[b >> 2] = a;
   continue;
  }
  break;
 }
 Fd(b);
 sa = c + 16 | 0;
}
function Kk(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 b = Hk(c, a + 8 | 0, b);
 a = p[b >> 2];
 while (1) {
  if (p[b + 4 >> 2] != (a | 0)) {
   Mc(p[b >> 2]);
   a = p[b >> 2] + 1 | 0;
   p[b >> 2] = a;
   continue;
  }
  break;
 }
 Fd(b);
 sa = c + 16 | 0;
}
function $p(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 b = dh(c, a + 8 | 0, b);
 a = p[b >> 2];
 while (1) {
  if (p[b + 4 >> 2] != (a | 0)) {
   oe(p[b >> 2]);
   a = p[b >> 2] + 4 | 0;
   p[b >> 2] = a;
   continue;
  }
  break;
 }
 Fd(b);
 sa = c + 16 | 0;
}
function ho(a) {
 wc(a);
 p[a + 64 >> 2] = 0;
 p[a + 68 >> 2] = 0;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 1065353216;
 p[a + 48 >> 2] = 1065353216;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 9452;
 p[a >> 2] = 2008;
 rb(a + 72 | 0);
 ab(a + 96 | 0);
 p[a + 108 >> 2] = 0;
}
function Fs(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = Fb(a, b);
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
function Pb(a, b, c, d) {
 var e = w(0), f = w(0), g = 0, h = w(0);
 e = t[Ja(b, 0) >> 2];
 f = t[Ja(c, 0) >> 2];
 g = Ja(a, 0), h = w(e + w(f * d)), t[g >> 2] = h;
 e = t[Ja(b, 1) >> 2];
 f = t[Ja(c, 1) >> 2];
 g = Ja(a, 1), h = w(e + w(f * d)), t[g >> 2] = h;
}
function Ck(a, b, c, d, e, f) {
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
function xs(a) {
 var b = 0, c = 0, d = w(0);
 b = sa - 16 | 0;
 sa = b;
 c = ki(p[a >> 2], p[a + 4 >> 2], b + 12 | 0);
 a : {
  if (!c) {
   dd(a);
   d = w(0);
   break a;
  }
  p[a >> 2] = p[a >> 2] + c;
  d = t[b + 12 >> 2];
 }
 sa = b + 16 | 0;
 return d;
}
function zs(a, b, c, d) {
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
function hm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 32 | 0;
 sa = d;
 Td(d + 8 | 0, b);
 Zd(d, c);
 m[a | 0](d + 24 | 0, d + 8 | 0, d);
 a = Ef(d + 24 | 0);
 Bb(d + 24 | 0);
 Bb(d);
 ib(d + 8 | 0);
 sa = d + 32 | 0;
 return a | 0;
}
function Lj(a, b, c, d, e, f) {
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
function pr(a, b, c, d) {
 var e = 0, f = 0, g = 0;
 e = sa - 16 | 0;
 sa = e;
 f = db(e + 8 | 0);
 g = db(e);
 fc(f, a, d, w(.3333333432674408));
 fc(g, a, d, w(.6666666865348816));
 a = 1;
 if (!Bh(b, f)) {
  a = Bh(c, g);
 }
 sa = e + 16 | 0;
 return a;
}
function Go(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = Fb(a, b);
 a : {
  if (c) {
   break a;
  }
  b = m[p[p[b >> 2] >> 2]](b, p[a + 48 >> 2]) | 0;
  if (!b) {
   break a;
  }
  if (!zd(b)) {
   break a;
  }
  p[a + 52 >> 2] = b;
 }
 return c | 0;
}
function Th(a) {
 wc(a);
 p[a + 56 >> 2] = 1065353216;
 p[a + 60 >> 2] = 1065353216;
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 1065353216;
 p[a >> 2] = 3348;
 p[a >> 2] = 10504;
 rb(a - -64 | 0);
 rb(a + 88 | 0);
 p[a + 112 >> 2] = 0;
 p[a + 116 >> 2] = 0;
}
function sq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = Fb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  c = p[a + 20 >> 2];
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 12) | 0)) {
   break a;
  }
  Eb(p[a + 20 >> 2], a);
  b = 0;
 }
 return b | 0;
}
function pn(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 b = Fb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  c = p[a + 20 >> 2];
  if (!(m[p[p[c >> 2] + 12 >> 2]](c, 22) | 0)) {
   break a;
  }
  kn(p[a + 20 >> 2], a);
  b = 0;
 }
 return b | 0;
}
function _p(a) {
 var b = 0, c = 0, d = 0, e = 0;
 Kd(a);
 p[a + 164 >> 2] = 0;
 p[a >> 2] = 5008;
 p[a >> 2] = 4884;
 b = Ub(a + 168 | 0);
 c = Ub(a + 232 | 0);
 d = Ub(a + 296 | 0);
 e = Ub(a + 360 | 0);
 Eb(a, b);
 Eb(a, c);
 Eb(a, d);
 Eb(a, e);
}
function Ni(a) {
 var b = 0, c = 0, d = 0;
 if (gd(n[p[a >> 2]])) {
  while (1) {
   b = p[a >> 2];
   d = n[b | 0];
   p[a >> 2] = b + 1;
   c = (v(c, 10) + d | 0) + -48 | 0;
   if (gd(n[b + 1 | 0])) {
    continue;
   }
   break;
  }
 }
 return c;
}
function xq(a, b) {
 a = a | 0;
 b = b | 0;
 b = p[a + 20 >> 2];
 while (1) {
  a : {
   if (b) {
    if (!ef(b)) {
     break a;
    }
    p[a + 48 >> 2] = b;
    p[b + 172 >> 2] = a;
   }
   return !b | 0;
  }
  b = p[b + 20 >> 2];
  continue;
 }
}
function Jb(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = ki(p[a >> 2], p[a + 4 >> 2], b + 12 | 0);
 a : {
  if (!c) {
   dd(a);
   a = 0;
   break a;
  }
  p[a >> 2] = p[a >> 2] + c;
  a = p[b + 12 >> 2];
 }
 sa = b + 16 | 0;
 return a;
}
function bi(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 bd(a - -64 | 0, $a(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), $a(b, w(Bc(t[a + 80 >> 2]) * w(-t[a + 84 >> 2])), w(Cc(t[a + 80 >> 2]) * w(-t[a + 84 >> 2]))));
 sa = b + 16 | 0;
}
function Lh(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = w(0);
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = b;
 e = a, f = w(Ar(b, c) + t[a + 76 >> 2]), t[e + 76 >> 2] = f;
 zr(a - -64 | 0, d + 12 | 0);
 sa = d + 16 | 0;
}
function bd(a, b, c) {
 var d = w(0), e = w(0), f = 0, g = w(0);
 d = t[Ja(b, 0) >> 2];
 e = t[Ja(c, 0) >> 2];
 f = Ja(a, 0), g = w(d + e), t[f >> 2] = g;
 d = t[Ja(b, 1) >> 2];
 e = t[Ja(c, 1) >> 2];
 f = Ja(a, 1), g = w(d + e), t[f >> 2] = g;
}
function ad(a, b, c) {
 var d = w(0), e = w(0), f = 0, g = w(0);
 d = t[Ja(b, 0) >> 2];
 e = t[Ja(c, 0) >> 2];
 f = Ja(a, 0), g = w(d - e), t[f >> 2] = g;
 d = t[Ja(b, 1) >> 2];
 e = t[Ja(c, 1) >> 2];
 f = Ja(a, 1), g = w(d - e), t[f >> 2] = g;
}
function ur(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Ke(d + 8 | 0, Le(a, lb(a) + 1 | 0), lb(a), c);
 He(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 8;
 vh(a, c);
 Je(c);
 sa = d + 32 | 0;
}
function ph(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Cd(d + 8 | 0, Bd(a, cb(a) + 1 | 0), cb(a), c);
 oc(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 4;
 Ae(a, c);
 Vc(c);
 sa = d + 32 | 0;
}
function br(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = Ke(d + 8 | 0, Le(a, lb(a) + 1 | 0), lb(a), c);
 zh(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 8;
 $q(a, c);
 Je(c);
 sa = d + 32 | 0;
}
function Uh(a, b) {
 var c = 0, d = 0, e = 0;
 d = sa - 32 | 0;
 sa = d;
 c = Ma(a);
 e = c;
 c = bq(d + 8 | 0, Bd(a, cb(a) + 1 | 0), cb(a), c);
 oc(e, p[c + 8 >> 2], b);
 p[c + 8 >> 2] = p[c + 8 >> 2] + 4;
 Ae(a, c);
 Vc(c);
 sa = d + 32 | 0;
}
function Vc(a) {
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
  p[Wa(a) >> 2];
  Ua(b);
 }
}
function Um(a, b) {
 a = a | 0;
 b = b | 0;
 b = ae(a, b);
 m[p[p[b >> 2] >> 2]](b, 0);
 m[p[p[b >> 2] + 8 >> 2]](b, t[a + 56 >> 2]);
 m[p[p[b >> 2] + 16 >> 2]](b, p[a + 60 >> 2]);
 m[p[p[b >> 2] + 12 >> 2]](b, p[a + 64 >> 2]);
 return b | 0;
}
function Je(a) {
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
  p[Wa(a) >> 2];
  Ua(b);
 }
}
function lv(a, b, c, d, e) {
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
function tr(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c >> 2] = a;
 d = p[a + 4 >> 2];
 p[c + 4 >> 2] = d;
 p[c + 8 >> 2] = d + 3;
 uh(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 3;
 Vb(c);
 sa = c + 16 | 0;
}
function es(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 bd(a - -64 | 0, $a(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), $a(b, w(Bc(t[a + 80 >> 2]) * t[a + 84 >> 2]), w(Cc(t[a + 80 >> 2]) * t[a + 84 >> 2])));
 sa = b + 16 | 0;
}
function Lg(a, b, c, d, e) {
 m[p[p[a >> 2] + 20 >> 2]](a, b, c);
 d = w(b + d);
 m[p[p[a >> 2] + 24 >> 2]](a, d, c);
 c = w(c + e);
 m[p[p[a >> 2] + 24 >> 2]](a, d, c);
 m[p[p[a >> 2] + 24 >> 2]](a, b, c);
 m[p[p[a >> 2] + 32 >> 2]](a);
}
function js(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 bd(a + 72 | 0, $a(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), $a(b, w(Bc(t[a + 80 >> 2]) * t[a + 88 >> 2]), w(Cc(t[a + 80 >> 2]) * t[a + 88 >> 2])));
 sa = b + 16 | 0;
}
function ds(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 bd(a + 72 | 0, $a(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), $a(b, w(Bc(t[a + 88 >> 2]) * t[a + 92 >> 2]), w(Cc(t[a + 88 >> 2]) * t[a + 92 >> 2])));
 sa = b + 16 | 0;
}
function $r(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 bd(a + 72 | 0, $a(b + 8 | 0, t[a + 48 >> 2], t[a + 52 >> 2]), $a(b, w(Bc(t[a + 80 >> 2]) * t[a + 84 >> 2]), w(Cc(t[a + 80 >> 2]) * t[a + 84 >> 2])));
 sa = b + 16 | 0;
}
function lr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0;
 Lh(a, b, c);
 a = p[a + 104 >> 2];
 e = a, f = m[p[p[b >> 2] + 36 >> 2]](b) | 0, g = c, d = p[p[a >> 2] + 16 >> 2], m[d](e | 0, f | 0, g | 0);
}
function vj() {
 var a = 0, b = 0;
 a : {
  if (n[19496] & 1) {
   break a;
  }
  if (!qb(19496)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13672) | 0;
  sa = a + 16 | 0;
  p[4873] = b;
  pb(19496);
 }
 return p[4873];
}
function tj() {
 var a = 0, b = 0;
 a : {
  if (n[19504] & 1) {
   break a;
  }
  if (!qb(19504)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13680) | 0;
  sa = a + 16 | 0;
  p[4875] = b;
  pb(19504);
 }
 return p[4875];
}
function rk() {
 var a = 0, b = 0;
 a : {
  if (n[19412] & 1) {
   break a;
  }
  if (!qb(19412)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(1, 12928) | 0;
  sa = a + 16 | 0;
  p[4852] = b;
  pb(19412);
 }
 return p[4852];
}
function qj() {
 var a = 0, b = 0;
 a : {
  if (n[19512] & 1) {
   break a;
  }
  if (!qb(19512)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13688) | 0;
  sa = a + 16 | 0;
  p[4877] = b;
  pb(19512);
 }
 return p[4877];
}
function pk() {
 var a = 0, b = 0;
 a : {
  if (n[19420] & 1) {
   break a;
  }
  if (!qb(19420)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 12932) | 0;
  sa = a + 16 | 0;
  p[4854] = b;
  pb(19420);
 }
 return p[4854];
}
function nj() {
 var a = 0, b = 0;
 a : {
  if (n[19520] & 1) {
   break a;
  }
  if (!qb(19520)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13696) | 0;
  sa = a + 16 | 0;
  p[4879] = b;
  pb(19520);
 }
 return p[4879];
}
function mk() {
 var a = 0, b = 0;
 a : {
  if (n[19428] & 1) {
   break a;
  }
  if (!qb(19428)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 12940) | 0;
  sa = a + 16 | 0;
  p[4856] = b;
  pb(19428);
 }
 return p[4856];
}
function lj() {
 var a = 0, b = 0;
 a : {
  if (n[19528] & 1) {
   break a;
  }
  if (!qb(19528)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13704) | 0;
  sa = a + 16 | 0;
  p[4881] = b;
  pb(19528);
 }
 return p[4881];
}
function jk() {
 var a = 0, b = 0;
 a : {
  if (n[19436] & 1) {
   break a;
  }
  if (!qb(19436)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 12952) | 0;
  sa = a + 16 | 0;
  p[4858] = b;
  pb(19436);
 }
 return p[4858];
}
function jj() {
 var a = 0, b = 0;
 a : {
  if (n[19536] & 1) {
   break a;
  }
  if (!qb(19536)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13712) | 0;
  sa = a + 16 | 0;
  p[4883] = b;
  pb(19536);
 }
 return p[4883];
}
function hj() {
 var a = 0, b = 0;
 a : {
  if (n[19544] & 1) {
   break a;
  }
  if (!qb(19544)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(5, 13728) | 0;
  sa = a + 16 | 0;
  p[4885] = b;
  pb(19544);
 }
 return p[4885];
}
function dj() {
 var a = 0, b = 0;
 a : {
  if (n[19552] & 1) {
   break a;
  }
  if (!qb(19552)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 13748) | 0;
  sa = a + 16 | 0;
  p[4887] = b;
  pb(19552);
 }
 return p[4887];
}
function Wj() {
 var a = 0, b = 0;
 a : {
  if (n[19452] & 1) {
   break a;
  }
  if (!qb(19452)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 13272) | 0;
  sa = a + 16 | 0;
  p[4862] = b;
  pb(19452);
 }
 return p[4862];
}
function Uj() {
 var a = 0, b = 0;
 a : {
  if (n[19460] & 1) {
   break a;
  }
  if (!qb(19460)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 13280) | 0;
  sa = a + 16 | 0;
  p[4864] = b;
  pb(19460);
 }
 return p[4864];
}
function Qj() {
 var a = 0, b = 0;
 a : {
  if (n[19468] & 1) {
   break a;
  }
  if (!qb(19468)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(7, 13296) | 0;
  sa = a + 16 | 0;
  p[4866] = b;
  pb(19468);
 }
 return p[4866];
}
function Pk() {
 var a = 0, b = 0;
 a : {
  if (n[19376] & 1) {
   break a;
  }
  if (!qb(19376)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(1, 12516) | 0;
  sa = a + 16 | 0;
  p[4843] = b;
  pb(19376);
 }
 return p[4843];
}
function Nj() {
 var a = 0, b = 0;
 a : {
  if (n[19476] & 1) {
   break a;
  }
  if (!qb(19476)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(3, 13324) | 0;
  sa = a + 16 | 0;
  p[4868] = b;
  pb(19476);
 }
 return p[4868];
}
function Fk() {
 var a = 0, b = 0;
 a : {
  if (n[19392] & 1) {
   break a;
  }
  if (!qb(19392)) {
   break a;
  }
  a = sa - 16 | 0;
  sa = a;
  b = J(2, 12600) | 0;
  sa = a + 16 | 0;
  p[4847] = b;
  pb(19392);
 }
 return p[4847];
}
function Dq(a, b) {
 var c = 0;
 Cq(a, b);
 p[a >> 2] = 6412;
 p[a + 20 >> 2] = p[b + 20 >> 2];
 mh(a + 24 | 0, b + 24 | 0);
 o[a + 44 >> 1] = r[b + 44 >> 1];
 c = p[b + 40 >> 2];
 p[a + 36 >> 2] = p[b + 36 >> 2];
 p[a + 40 >> 2] = c;
}
function rd(a, b) {
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
  if (!gg(p[a + 20 >> 2])) {
   break a;
  }
  c = p[a + 20 >> 2];
 }
 p[b + 116 >> 2] = c;
 return 0;
}
function Nu(a, b, c, d) {
 if (a | b) {
  while (1) {
   c = c + -1 | 0;
   n[c | 0] = q[(a & 15) + 18128 | 0] | d;
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
function Il(a, b, c) {
 a : {
  b : {
   switch (b + -37 | 0) {
   default:
    if ((b | 0) != 88) {
     break a;
    }
    Ff(a, c);
    return;
   case 0:
    Yd(a, c);
    return;
   case 1:
    break b;
   }
  }
  Yd(a, c);
 }
}
function fj(a, b, c, d, e) {
 var f = 0;
 f = sa - 16 | 0;
 sa = f;
 p[f + 12 >> 2] = a;
 yb(f + 12 | 0, t[b >> 2]);
 yb(f + 12 | 0, t[c >> 2]);
 yb(f + 12 | 0, t[d >> 2]);
 yb(f + 12 | 0, t[e >> 2]);
 sa = f + 16 | 0;
 return a;
}
function Hq(a, b) {
 var c = 0;
 Dq(a, b);
 p[a >> 2] = 3476;
 p[a >> 2] = 3420;
 p[a >> 2] = 3732;
 c = p[b + 52 >> 2];
 p[a + 48 >> 2] = p[b + 48 >> 2];
 p[a + 52 >> 2] = c;
 p[a >> 2] = 4428;
 p[a + 56 >> 2] = p[b + 56 >> 2];
}
function Ur(a) {
 var b = 0, c = 0, d = 0, e = 0;
 Kd(a);
 p[a >> 2] = 2924;
 p[a >> 2] = 2804;
 b = Zc(a + 164 | 0);
 c = Zc(a + 260 | 0);
 d = Zc(a + 356 | 0);
 e = Zc(a + 452 | 0);
 Eb(a, b);
 Eb(a, c);
 Eb(a, d);
 Eb(a, e);
}
function fh(a, b) {
 a = a | 0;
 b = b | 0;
 if (ob(b, 8)) {
  if ((cb(a + 136 | 0) | 0) != (m[p[p[a >> 2] + 120 >> 2]](a) | 0)) {
   hq(a, m[p[p[a >> 2] + 120 >> 2]](a) | 0);
  }
  m[p[p[a >> 2] + 124 >> 2]](a);
 }
 Gc(a, b);
}
function Xf(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0, e = 0, f = 0;
 b = a + 52 | 0;
 if (p[b + 8 >> 2]) {
  c = p[b + 8 >> 2];
  e = c, f = cg(p[a + 48 >> 2], t[b + 4 >> 2]), d = p[p[c >> 2] + 4 >> 2], m[d](e | 0, f | 0);
 }
}
function Hu(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 e = p[a + 20 >> 2];
 d = p[a + 16 >> 2] - e | 0;
 d = d >>> 0 > c >>> 0 ? c : d;
 Qb(e, b, d);
 p[a + 20 >> 2] = d + p[a + 20 >> 2];
 return c | 0;
}
function ln(a) {
 a = a | 0;
 var b = 0, c = 0, d = 0;
 b = p[a + 20 >> 2];
 if (!(!b | !p[b + 20 >> 2])) {
  d = a;
  b = p[b + 20 >> 2];
  if (df(b)) {
   c = b;
  } else {
   c = 0;
  }
  p[d + 96 >> 2] = c;
  Tb(b, a);
 }
}
function Df(a, b, c, d) {
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
function xf(a, b, c, d) {
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
function ik(a, b, c, d) {
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
function Hh(a) {
 a = a | 0;
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = a + 40 | 0;
 if (!q[p[c + 4 >> 2] + -3 | 0]) {
  a = a + 4 | 0;
  Re(c, Se(b + 8 | 0, 0, lb(a) & 255));
  Hc(a, kb(a, 0));
 }
 sa = b + 16 | 0;
}
function qn(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 if (q[a + 46 | 0]) {
  c = m[p[p[c >> 2] + 36 >> 2]](c) | 0;
  m[p[p[c >> 2] + 12 >> 2]](c, p[a + 56 >> 2]);
  m[p[p[b >> 2] + 20 >> 2]](b, c, p[a + 48 >> 2]);
 }
}
function Kp(a) {
 var b = 0;
 a : {
  switch ((m[p[p[a >> 2] + 8 >> 2]](a) | 0) + -1 | 0) {
  case 0:
   return a ? a + 76 | 0 : 0;
  case 2:
   b = a ? a + 156 | 0 : 0;
   break;
  default:
   break a;
  }
 }
 return b;
}
function jv(a, b, c) {
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
function Ym(a, b) {
 a = a | 0;
 b = b | 0;
 b = Fb(a, b);
 a : {
  if (b) {
   break a;
  }
  b = 1;
  if (!Yf(a + 52 | 0, p[a + 20 >> 2])) {
   break a;
  }
  m[p[p[a >> 2] + 52 >> 2]](a);
  b = 0;
 }
 return b | 0;
}
function zp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 50) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 393232 >>> b | 0 : ((1 << b) - 1 & 393232) << 32 - b | 9985 >>> b) & 1;
 }
 return 0;
}
function cq(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 49) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 131088 >>> b | 0 : ((1 << b) - 1 & 131088) << 32 - b | 9985 >>> b) & 1;
 }
 return 0;
}
function cg(a, b) {
 var c = 0;
 b = Su(w(w(w(w(fe(a) >>> 0) / w(255)) * w(255)) * b));
 a : {
  if (b < w(4294967296) & b >= w(0)) {
   c = ~~b >>> 0;
   break a;
  }
  c = 0;
 }
 return dg(c, ie(a), he(a), ge(a));
}
function aj(a, b, c) {
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
function Qf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(19401, a | 0, 2, 12628, 12636, 672, Ya(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Pf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(19443, a | 0, 2, 12980, 12636, 681, Ya(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Of(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(19443, a | 0, 4, 13024, 13040, 684, Ya(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Na(a) {
 var b = 0;
 a = a ? a : 1;
 a : {
  while (1) {
   b = Qd(a);
   if (b) {
    break a;
   }
   b = p[4921];
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
function Jf(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b + 4 >> 2];
 p[c + 8 >> 2] = p[b >> 2];
 p[c + 12 >> 2] = d;
 H(19486, a | 0, 6, 13424, 13448, 696, Ya(c + 8 | 0) | 0, 1);
 sa = c + 16 | 0;
}
function Ku(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0, d = 0, e = 0;
 c = b;
 b = p[b >> 2] + 15 & -16;
 p[c >> 2] = b + 16;
 d = a, e = Bu(p[b >> 2], p[b + 4 >> 2], p[b + 8 >> 2], p[b + 12 >> 2]), u[d >> 3] = e;
}
function Jh(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 e = a + 40 | 0;
 a = a + 4 | 0;
 Re(e, Se(d + 8 | 0, 0, lb(a) & 255));
 Hc(a, $a(d, b, c));
 sa = d + 16 | 0;
}
function rb(a) {
 var b = 0;
 b = p[579];
 p[a + 16 >> 2] = p[578];
 p[a + 20 >> 2] = b;
 b = p[577];
 p[a + 8 >> 2] = p[576];
 p[a + 12 >> 2] = b;
 b = p[575];
 p[a >> 2] = p[574];
 p[a + 4 >> 2] = b;
 return a;
}
function kh(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 4372;
 b = p[a + 52 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 b = p[a + 56 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 eb(a);
 return a | 0;
}
function Am(a, b) {
 var c = 0, d = 0, e = 0, f = 0;
 c = sa - 16 | 0;
 sa = c;
 d = p[b >> 2];
 b = c + 8 | 0;
 e = b, f = ka(11445) | 0, p[e >> 2] = f;
 hb(a, _(d | 0, p[b >> 2]) | 0);
 Bb(b);
 sa = c + 16 | 0;
}
function yl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12070, 3, 13816, 12972, 707, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function wl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12089, 3, 13828, 12972, 708, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function ul(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12094, 3, 13840, 12972, 709, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function sl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12099, 3, 13852, 12972, 710, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function pm(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19401, 11487, 3, 12640, 12652, 673, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function om(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19401, 11497, 4, 12672, 12688, 674, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function nm(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19401, 11506, 3, 12696, 12652, 675, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function lm(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19398, 11515, 6, 12720, 12744, 676, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function ll(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12130, 2, 13888, 12616, 713, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function em(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19443, 11554, 4, 12992, 12688, 682, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function bm(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19443, 11562, 3, 13008, 12652, 683, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function bl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19579, 12292, 5, 13904, 13924, 720, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function am(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19443, 11585, 8, 13056, 13088, 685, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Yk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19582, 12057, 3, 13940, 13952, 722, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Wl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11856, 3, 13336, 12652, 690, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Vl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11885, 3, 13348, 12652, 691, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Vk(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19582, 12292, 4, 13968, 13472, 723, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Ul(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11891, 3, 13360, 13372, 692, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Tl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11901, 3, 13380, 12652, 693, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Sl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11906, 3, 13392, 12652, 694, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Rl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11910, 3, 13404, 12652, 695, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Pl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11950, 4, 13456, 13472, 697, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Ol(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19486, 11958, 2, 13480, 12636, 698, Ya(b + 8 | 0) | 0, 1);
 sa = b + 16 | 0;
}
function Fl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19558, 12023, 3, 13764, 12972, 703, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function El(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19558, 12032, 2, 13776, 12616, 704, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Cl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12057, 3, 13784, 13796, 705, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Bl(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 H(19561, 12065, 3, 13804, 12652, 706, Ya(b + 8 | 0) | 0, 0);
 sa = b + 16 | 0;
}
function Mu(a, b, c) {
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
function gr(a, b, c, d, e, f, g) {
 a = a | 0;
 b = w(b);
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 Ih(a, b, c, d, e, f, g);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 28 >> 2]](a, b, c, d, e, f, g);
}
function Hd(a, b, c, d, e, f) {
 fc(f, a, b, e);
 a = f + 8 | 0;
 fc(a, b, c, e);
 b = f + 16 | 0;
 fc(b, c, d, e);
 c = f + 24 | 0;
 fc(c, f, a, e);
 d = f + 32 | 0;
 fc(d, a, b, e);
 fc(f + 40 | 0, c, d, e);
}
function Aq(a, b) {
 var c = 0, d = 0, e = 0;
 if (Yg(a) >>> 0 < b >>> 0) {
  fd();
  E();
 }
 Ma(a);
 c = Fe(b);
 p[a >> 2] = c;
 p[a + 4 >> 2] = c;
 d = Ma(a), e = (b << 2) + c | 0, p[d >> 2] = e;
 we(a, 0);
}
function wi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 if ((b | 0) == 55) {
  Sb(d, c);
  vi(a + 4 | 0, d);
  ib(d);
 }
 sa = d + 16 | 0;
 return (b | 0) == 55 | 0;
}
function tp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 10049 >>> b) & 1;
 }
 return 0;
}
function lq(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 18177 >>> b) & 1;
 }
 return 0;
}
function jd(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = c;
 oa(19406, b | 0, 19446, 13760, 726, ic(d + 12 | 0) | 0, 19446, 13372, 727, ic(d + 12 | 0) | 0);
 sa = d + 16 | 0;
 return a;
}
function bo(a) {
 Wb(a);
 p[a + 68 >> 2] = 0;
 p[a + 72 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 p[a + 64 >> 2] = 1065353216;
 p[a + 52 >> 2] = 1065353216;
 p[a + 56 >> 2] = 0;
 p[a + 48 >> 2] = 0;
 p[a >> 2] = 9532;
}
function Wp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 10017 >>> b) & 1;
 }
 return 0;
}
function Rb(a, b, c) {
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
function Qr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 9989 >>> b) & 1;
 }
 return 0;
}
function Op(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 2819 >>> b) & 1;
 }
 return 0;
}
function Nr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 9985 >>> b) & 1;
 }
 return 0;
}
function Mg(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 a : {
  if ((b | 0) < 0) {
   break a;
  }
  a = a + 92 | 0;
  if (cb(a) >>> 0 <= b >>> 0) {
   break a;
  }
  c = p[Ta(a, b) >> 2];
 }
 return c | 0;
}
function Lr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 1793 >>> b) & 1;
 }
 return 0;
}
function Lp(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 2817 >>> b) & 1;
 }
 return 0;
}
function Do(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 39) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 128 >>> b | 0 : ((1 << b) - 1 & 128) << 32 - b | 3 >>> b) & 1;
 }
 return 0;
}
function ts(a, b, c) {
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
function Nc(a, b, c) {
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
function Jr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -2 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 16 >>> b | 0 : ((1 << b) - 1 & 16) << 32 - b | 769 >>> b) & 1;
 }
 return 0;
}
function Uq(a, b) {
 var c = 0;
 xh(a);
 c = b + 4 | 0;
 Sq(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Va(a, c);
 Va(a + 4 | 0, b + 8 | 0);
 Va(Ma(a), Wa(b));
 p[b >> 2] = p[b + 4 >> 2];
 uc(a);
 sc(a);
 sc(a);
}
function Jk(a, b) {
 var c = 0;
 Rf(a);
 c = b + 4 | 0;
 wd(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Va(a, c);
 Va(a + 4 | 0, b + 8 | 0);
 Va(Ma(a), Wa(b));
 p[b >> 2] = p[b + 4 >> 2];
 ac(a);
 hc(a);
 hc(a);
}
function An(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 36) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 24 >>> b | 0 : ((1 << b) - 1 & 24) << 32 - b | 1 >>> b) & 1;
 }
 return 0;
}
function ye(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Xo(a);
 oe(a + 8 | 0);
 p[b + 12 >> 2] = 0;
 ve(a + 12 | 0, b + 12 | 0);
 p[b + 4 >> 2] = 1065353216;
 ve(a + 16 | 0, b + 4 | 0);
 sa = b + 16 | 0;
}
function uo(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 32 | 0;
 sa = c;
 d = c, e = Og(b), p[d + 16 >> 2] = e;
 ko(c + 24 | 0, a, b, c + 16 | 0);
 a = yd(c + 24 | 0);
 sa = c + 32 | 0;
 return a + 4 | 0;
}
function qp(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 32 | 0;
 sa = c;
 d = c, e = Og(b), p[d + 16 >> 2] = e;
 mp(c + 24 | 0, a, b, c + 16 | 0);
 a = yd(c + 24 | 0);
 sa = c + 32 | 0;
 return a + 4 | 0;
}
function pq(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 a : {
  if (!ob(b, 8)) {
   break a;
  }
  c = a + 152 | 0;
  if (!p[c + 4 >> 2]) {
   break a;
  }
  Qs(p[c + 4 >> 2], a + 136 | 0);
 }
 Gc(a, b);
}
function Ms(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 33) {
  b = a & 31;
  return (32 <= (a & 63) >>> 0 ? 2 >>> b | 0 : ((1 << b) - 1 & 2) << 32 - b | 3 >>> b) & 1;
 }
 return 0;
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
function bj(a, b) {
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
function Em(a, b, c) {
 var d = 0, e = 0;
 d = sa - 16 | 0;
 sa = d;
 e = +ma(Pk() | 0, b | 0, c | 0, d + 4 | 0, Hf(d + 8 | 0) | 0);
 b = hb(d, p[d + 4 >> 2]);
 Zd(a, id(e));
 nd(b);
 sa = d + 16 | 0;
}
function vk(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 8 >> 2] = c;
 p[d + 12 >> 2] = b;
 nk(p[a + 8 >> 2], d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function ck(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0, f = 0, g = 0;
 e = a, f = m[p[p[b >> 2] + 36 >> 2]](b) | 0, g = c, d = p[p[a >> 2] + 40 >> 2], m[d](e | 0, f | 0, g | 0);
}
function Fg(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = b;
 ue(a, d + 12 | 0);
 b = p[c + 4 >> 2];
 p[a + 4 >> 2] = p[c >> 2];
 p[a + 8 >> 2] = b;
 sa = d + 16 | 0;
 return a;
}
function zj(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 t[d + 8 >> 2] = c;
 p[d + 12 >> 2] = b;
 ej(p[a + 8 >> 2], d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function Kb(a) {
 var b = 0, c = 0;
 b = a * a;
 c = b * a;
 return w(c * (b * b) * (b * 2718311493989822e-21 + -.00019839334836096632) + (c * (b * .008333329385889463 + -.16666666641626524) + a));
}
function vh(a, b) {
 var c = 0;
 Ie(a);
 c = b + 4 | 0;
 Xq(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Va(a, c);
 Va(a + 4 | 0, b + 8 | 0);
 Va(Ma(a), Wa(b));
 p[b >> 2] = p[b + 4 >> 2];
 yh(a, lb(a));
}
function Ae(a, b) {
 var c = 0;
 cf(a);
 c = b + 4 | 0;
 wd(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Va(a, c);
 Va(a + 4 | 0, b + 8 | 0);
 Va(Ma(a), Wa(b));
 p[b >> 2] = p[b + 4 >> 2];
 we(a, cb(a));
}
function $q(a, b) {
 var c = 0;
 Ie(a);
 c = b + 4 | 0;
 wd(Ma(a), p[a >> 2], p[a + 4 >> 2], c);
 Va(a, c);
 Va(a + 4 | 0, b + 8 | 0);
 Va(Ma(a), Wa(b));
 p[b >> 2] = p[b + 4 >> 2];
 yh(a, lb(a));
}
function ym(a, b) {
 var c = 0;
 c = ac(a);
 if (c >>> 0 < b >>> 0) {
  wm(a, b - c | 0);
  return;
 }
 if (c >>> 0 > b >>> 0) {
  b = p[a >> 2] + b | 0;
  ac(a);
  Gf(a, b);
  hc(a);
  ac(a);
 }
}
function iv(a) {
 a = a | 0;
 var b = 0;
 b = sa - 112 | 0;
 sa = b;
 p[b + 108 >> 2] = a;
 p[b >> 2] = p[b + 108 >> 2];
 Ju(b + 16 | 0, b);
 a = Fu(b + 16 | 0);
 sa = b + 112 | 0;
 return a | 0;
}
function xr(a, b) {
 var c = 0;
 c = lb(a);
 if (c >>> 0 < b >>> 0) {
  qr(a, b - c | 0);
  return;
 }
 if (c >>> 0 > b >>> 0) {
  b = p[a >> 2] + (b << 3) | 0;
  lb(a);
  wh(a, b);
  Oh(a);
 }
}
function gh(a, b) {
 var c = 0;
 c = cb(a);
 if (c >>> 0 < b >>> 0) {
  gq(a, b - c | 0);
  return;
 }
 if (c >>> 0 > b >>> 0) {
  b = p[a >> 2] + (b << 2) | 0;
  cb(a);
  qh(a, b);
  Mh(a);
 }
}
function ak(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 t[d + 8 >> 2] = c;
 t[d + 12 >> 2] = b;
 yf(a, 11571, d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function Oe(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 3844;
 fb(a - -64 | 0);
 fb(a + 52 | 0);
 b = a + 40 | 0;
 xh(b);
 Zq(b);
 Ne(a + 28 | 0);
 Ne(a + 16 | 0);
 Ne(a + 4 | 0);
 return a | 0;
}
function $j(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 t[d + 8 >> 2] = c;
 t[d + 12 >> 2] = b;
 yf(a, 11578, d + 12 | 0, d + 8 | 0);
 sa = d + 16 | 0;
}
function Yg(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = 1073741823;
 p[b + 8 >> 2] = 2147483647;
 a = p[ud(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Tq(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = 1431655765;
 p[b + 8 >> 2] = 2147483647;
 a = p[ud(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function fn(a, b) {
 var c = 0;
 c = sa - 32 | 0;
 sa = c;
 p[c + 16 >> 2] = b;
 p[c + 24 >> 2] = a;
 p[c + 12 >> 2] = 525;
 de(p[c + 24 >> 2], p[c + 16 >> 2], c + 12 | 0);
 sa = c + 32 | 0;
}
function _q(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = 536870911;
 p[b + 8 >> 2] = 2147483647;
 a = p[ud(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Zi(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 a = p[a >> 2];
 Td(d, c);
 a = m[a | 0](b, d) | 0;
 ib(d);
 sa = d + 16 | 0;
 return a | 0;
}
function Xd(a, b) {
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
function Wb(a) {
 vc(a);
 p[a >> 2] = 1800;
 jf(a + 4 | 0, 3524);
 p[a + 16 >> 2] = 0;
 p[a + 20 >> 2] = 0;
 p[a >> 2] = 6412;
 ab(a + 24 | 0);
 o[a + 44 >> 1] = 65535;
 p[a + 40 >> 2] = 0;
}
function yp(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 127) {
  d = a, e = w(La(c)), t[d + 172 >> 2] = e;
  return 1;
 }
 return eh(a, b, c) | 0;
}
function xp(a) {
 var b = 0, c = 0, d = 0;
 Kd(a);
 p[a >> 2] = 5988;
 p[a >> 2] = 5868;
 b = Ub(a + 164 | 0);
 c = Ub(a + 228 | 0);
 d = Ub(a + 292 | 0);
 Eb(a, b);
 Eb(a, c);
 Eb(a, d);
}
function si(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 89) {
  d = a, e = w(La(c)), t[d + 120 >> 2] = e;
  return 1;
 }
 return mf(a, b, c) | 0;
}
function Vp(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 31) {
  d = a, e = w(La(c)), t[d + 164 >> 2] = e;
  return 1;
 }
 return Ye(a, b, c) | 0;
}
function zm(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = +S(p[a >> 2], p[3132], b + 4 | 0);
 a = hb(b, p[b + 4 >> 2]);
 d = id(c);
 nd(a);
 sa = b + 16 | 0;
 return d;
}
function mh(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 Ma(b);
 Bq(a);
 c = cb(b);
 if (c) {
  Aq(a, c);
  zq(a, p[b >> 2], p[b + 4 >> 2], c);
 }
 sa = d + 16 | 0;
 return a;
}
function gj(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 70) {
  d = a, e = w(La(c)), t[d + 24 >> 2] = e;
  return 1;
 }
 return ld(a, b, c) | 0;
}
function Fm(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = +S(p[a >> 2], p[3130], b + 4 | 0);
 a = hb(b, p[b + 4 >> 2]);
 d = id(c);
 nd(a);
 sa = b + 16 | 0;
 return d;
}
function Eq(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = w(0);
 if ((b | 0) == 26) {
  d = a, e = w(La(c)), t[d + 60 >> 2] = e;
  return 1;
 }
 return _c(a, b, c) | 0;
}
function Cm(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = +S(p[a >> 2], p[3131], b + 4 | 0);
 a = hb(b, p[b + 4 >> 2]);
 d = id(c);
 nd(a);
 sa = b + 16 | 0;
 return d;
}
function go(a) {
 og(a);
 p[a + 72 >> 2] = 255;
 p[a + 76 >> 2] = 1;
 p[a + 64 >> 2] = 255;
 p[a + 68 >> 2] = 1;
 p[a >> 2] = 9696;
 p[a >> 2] = 9616;
 db(a + 80 | 0);
 db(a + 88 | 0);
}
function Ik(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 Ma(a);
 p[b + 12 >> 2] = -1;
 p[b + 8 >> 2] = 2147483647;
 a = p[ud(b + 12 | 0, b + 8 | 0) >> 2];
 sa = b + 16 | 0;
 return a;
}
function Eh(a) {
 Dh(a);
 p[a >> 2] = 3844;
 ab(a + 4 | 0);
 ab(a + 16 | 0);
 ab(a + 28 | 0);
 ab(a + 40 | 0);
 ab(a + 52 | 0);
 ab(a - -64 | 0);
 p[a + 76 >> 2] = 0;
 rb(a + 80 | 0);
}
function co(a) {
 wc(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 8872;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 a = a - -64 | 0;
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
}
function Yf(a, b) {
 var c = 0, d = 0, e = 0;
 c = m[p[p[b >> 2] + 12 >> 2]](b, 21) | 0;
 if (c) {
  d = a, e = m[p[p[b >> 2] + 52 >> 2]](b, a) | 0, p[d + 8 >> 2] = e;
 }
 return c;
}
function kd(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 Zd(c + 8 | 0, b);
 a = m[a | 0](c + 8 | 0) | 0;
 Bb(c + 8 | 0);
 sa = c + 16 | 0;
 return a | 0;
}
function Xa(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[a + 4 >> 2];
 p[b + 8 >> 2] = p[a >> 2];
 p[b + 12 >> 2] = c;
 a = Ya(b + 8 | 0);
 sa = b + 16 | 0;
 return a;
}
function Np(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 23) {
  d = a, e = bb(c), p[d + 128 >> 2] = e;
  return 1;
 }
 return Jd(a, b, c) | 0;
}
function Js(a, b) {
 a = a | 0;
 b = b | 0;
 b = p[a + 20 >> 2];
 if (m[p[p[b >> 2] + 12 >> 2]](b, 43) | 0) {
  Ps(p[a + 20 >> 2], a);
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function Et(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 122) {
  d = a, e = bb(c), p[d + 24 >> 2] = e;
  return 1;
 }
 return ld(a, b, c) | 0;
}
function Co(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 121) {
  d = a, e = bb(c), p[d + 48 >> 2] = e;
  return 1;
 }
 return wb(a, b, c) | 0;
}
function vg(a, b, c) {
 var d = w(0);
 d = w(b * w(3));
 c = w(c * w(3));
 b = w(c + w(b * w(-6)));
 return w(d + w(w(w(b + b) * a) + w(w(w(w(d + w(w(1) - c)) * w(3)) * a) * a)));
}
function kq(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 32) {
  d = a, e = Oc(c), n[d + 148 | 0] = e;
  return 1;
 }
 return Jd(a, b, c) | 0;
}
function ih(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 lf(t[a + 48 >> 2], t[a + 52 >> 2], p[p[a + 56 >> 2] + 52 >> 2], p[p[a + 56 >> 2] + 48 >> 2], b, c, jh(p[a + 56 >> 2]));
}
function On(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 37) {
  d = a, e = Jb(c), p[d + 48 >> 2] = e;
  return 1;
 }
 return wb(a, b, c) | 0;
}
function Ok(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 88) {
  d = a, e = Jb(c), p[d + 24 >> 2] = e;
  return 1;
 }
 return ld(a, b, c) | 0;
}
function In(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 40) {
  d = a, e = bb(c), p[d + 56 >> 2] = e;
  return 1;
 }
 return le(a, b, c) | 0;
}
function le(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 41) {
  d = a, e = Oc(c), n[d + 46 | 0] = e;
  return 1;
 }
 return wb(a, b, c) | 0;
}
function Xq(a, b, c, d) {
 while (1) {
  if ((b | 0) != (c | 0)) {
   c = c + -8 | 0;
   He(a, p[d >> 2] + -8 | 0, c);
   p[d >> 2] = p[d >> 2] + -8;
   continue;
  }
  break;
 }
}
function Tg(a) {
 Wb(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 6276;
 p[a + 64 >> 2] = 0;
 p[a + 56 >> 2] = 0;
 p[a + 60 >> 2] = 0;
 p[a >> 2] = 6616;
 return a;
}
function Qh(a) {
 a = a | 0;
 var b = 0;
 p[a + 76 >> 2] = 0;
 Ve(a + 28 | 0);
 Ve(a + 4 | 0);
 b = a + 40 | 0;
 uc(b);
 Nh(b);
 sc(b);
 uc(b);
 Id(a + 52 | 0);
 Id(a - -64 | 0);
}
function ki(a, b, c) {
 if (b - a >>> 0 >= 4) {
  p[c >> 2] = q[a | 0] | q[a + 1 | 0] << 8 | (q[a + 2 | 0] << 16 | q[a + 3 | 0] << 24);
  a = 4;
 } else {
  a = 0;
 }
 return a;
}
function St(a, b, c, d, e, f, g, h, i) {
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
function vr(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 c = Me(d, a, 1);
 He(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 8;
 Vb(c);
 sa = d + 16 | 0;
}
function cr(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 c = Me(d, a, 1);
 zh(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 8;
 Vb(c);
 sa = d + 16 | 0;
}
function Yc(a, b) {
 var c = 0, d = 0;
 d = sa - 16 | 0;
 sa = d;
 c = Dd(d, a, 1);
 oc(Ma(a), p[c + 4 >> 2], b);
 p[c + 4 >> 2] = p[c + 4 >> 2] + 4;
 Vb(c);
 sa = d + 16 | 0;
}
function Lb(a) {
 var b = 0;
 a = a * a;
 b = a * a;
 return w(a * -.499999997251031 + 1 + b * .04166662332373906 + a * b * (a * 2439044879627741e-20 + -.001388676377460993));
}
function uu(a) {
 var b = 0, c = 0, d = 0;
 b = sa - 16 | 0;
 sa = b;
 c = p[hb(b + 8 | 0, p[a + 4 >> 2]) >> 2], d = 1, n[c | 0] = d;
 n[p[a + 8 >> 2]] = 1;
 sa = b + 16 | 0;
}
function ss(a, b) {
 var c = w(0), d = w(0);
 c = w(t[Ja(b, 0) >> 2] - t[Ja(a, 0) >> 2]);
 d = w(c * c);
 c = w(t[Ja(b, 1) >> 2] - t[Ja(a, 1) >> 2]);
 return w(d + w(c * c));
}
function ji(a) {
 var b = 0, c = 0;
 b = p[a >> 2];
 a : {
  if ((p[a + 4 >> 2] - b | 0) <= 0) {
   dd(a);
   break a;
  }
  p[a >> 2] = b + 1;
  c = q[b | 0];
 }
 return c;
}
function Wf(a) {
 a = a | 0;
 var b = 0;
 p[a + 64 >> 2] = 11304;
 p[a >> 2] = 11224;
 b = p[a + 68 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 eb(a);
 return a | 0;
}
function Yj(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = b;
 Oj(p[a + 8 >> 2], d + 12 | 0, c);
 sa = d + 16 | 0;
}
function wh(a, b) {
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
function qh(a, b) {
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
function Yq(a, b) {
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
function Gf(a, b) {
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
function yg(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 d = c, e = Po(a, b), p[d >> 2] = e;
 a = p[pe(c + 8 | 0, c) >> 2];
 sa = c + 16 | 0;
 return a;
}
function bp(a, b) {
 a = a | 0;
 b = b | 0;
 var c = w(0);
 c = t[b + 48 >> 2];
 t[a + 12 >> 2] = t[b + 52 >> 2];
 t[a + 8 >> 2] = c;
 t[a + 4 >> 2] = 0;
 t[a >> 2] = 0;
}
function xt(a, b) {
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
function xg() {
 var a = 0, b = 0, c = 0, d = 0;
 a = sa - 16 | 0;
 sa = a;
 c = a, d = Sc(), p[c >> 2] = d;
 b = pe(a + 8 | 0, a);
 sa = a + 16 | 0;
 return p[b >> 2];
}
function rt(a, b) {
 var c = w(0);
 p[a >> 2] = b;
 c = q[b + 40 | 0] ? w(w(p[b + 32 >> 2]) / w(p[b + 16 >> 2])) : c;
 p[a + 8 >> 2] = 1;
 t[a + 4 >> 2] = c;
 return a;
}
function md() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 Tf(a);
 Sf(a + 8 | 0, a, 11430);
 Bb(a);
 b = Cm(a + 8 | 0);
 Bb(a + 8 | 0);
 sa = a + 16 | 0;
 return b;
}
function hr(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 51) {
  d = a, e = bb(c), p[d + 4 >> 2] = e;
 }
 return (b | 0) == 51 | 0;
}
function Zm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 var d = 0, e = 0;
 if ((b | 0) == 53) {
  d = a, e = bb(c), p[d + 4 >> 2] = e;
 }
 return (b | 0) == 53 | 0;
}
function Kd(a) {
 Vh(a);
 p[a + 156 >> 2] = 1056964608;
 p[a + 160 >> 2] = 1056964608;
 p[a + 148 >> 2] = 0;
 p[a + 152 >> 2] = 0;
 p[a >> 2] = 3044;
 p[a >> 2] = 4008;
}
function Hn(a) {
 Xe(a);
 p[a + 128 >> 2] = 3;
 p[a >> 2] = 8300;
 p[a >> 2] = 5232;
 ab(a + 132 | 0);
 p[a + 152 >> 2] = 0;
 p[a + 144 >> 2] = 0;
 p[a + 148 >> 2] = 0;
}
function Gm() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 Tf(a);
 Sf(a + 8 | 0, a, 11414);
 Bb(a);
 b = Fm(a + 8 | 0);
 Bb(a + 8 | 0);
 sa = a + 16 | 0;
 return b;
}
function lk(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 _b(d + 12 | 0, p[b >> 2]);
 _b(d + 12 | 0, p[c >> 2]);
 sa = d + 16 | 0;
 return a;
}
function kv(a, b) {
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
function cj(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 _b(d + 12 | 0, p[b >> 2]);
 yb(d + 12 | 0, t[c >> 2]);
 sa = d + 16 | 0;
 return a;
}
function Sj(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 yb(d + 12 | 0, t[b >> 2]);
 yb(d + 12 | 0, t[c >> 2]);
 sa = d + 16 | 0;
 return a;
}
function qc(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 4128;
 b = p[a + 132 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 fb(a + 136 | 0);
 eb(a);
 return a | 0;
}
function di(a, b) {
 var c = 0, d = 0, e = 0;
 c = p[Ja(b, 0) >> 2];
 d = Ja(a, 0), e = c, p[d >> 2] = e;
 b = p[Ja(b, 1) >> 2];
 d = Ja(a, 1), e = b, p[d >> 2] = e;
}
function xm(a, b) {
 var c = 0, d = 0, e = 0;
 c = sa - 16 | 0;
 sa = c;
 d = a, e = Z(19384, vm(c + 8 | 0, b) | 0) | 0, p[d >> 2] = e;
 sa = c + 16 | 0;
 return a;
}
function su(a, b) {
 if (((i(a), e(2)) & 2147483647) >>> 0 <= 2139095040) {
  return ((i(b), e(2)) & 2147483647) >>> 0 > 2139095040 ? a : w(z(a, b));
 }
 return b;
}
function ru(a, b) {
 if (((i(a), e(2)) & 2147483647) >>> 0 <= 2139095040) {
  return ((i(b), e(2)) & 2147483647) >>> 0 > 2139095040 ? a : w(A(a, b));
 }
 return b;
}
function Mj(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = a;
 _b(d + 12 | 0, p[b >> 2]);
 _b(d + 12 | 0, Bf(c));
 sa = d + 16 | 0;
 return a;
}
function wg(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 Lo(d + 8 | 0, b, c, c);
 b = d + 8 | 0;
 pe(a, b);
 n[a + 4 | 0] = q[b + 4 | 0];
 sa = d + 16 | 0;
}
function So(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 8 >> 2] = b;
 b = p[p[c + 8 >> 2] >> 2];
 p[a + 4 >> 2] = 0;
 p[a >> 2] = b;
 sa = c + 16 | 0;
}
function au(a, b, c, d, e, f, g, h) {
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
function ql() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 608;
 H(19561, 12108, 3, 13864, 12972, 711, ic(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function nl() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 609;
 H(19561, 12118, 3, 13876, 12972, 712, ic(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function jm() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 679;
 H(19401, 12752, 2, 12792, 12636, 680, ic(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function gb(a, b) {
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
function _l() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 688;
 H(19443, 12752, 2, 13100, 12636, 689, ic(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function Va(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = p[a >> 2];
 p[a >> 2] = p[b >> 2];
 p[b >> 2] = p[c + 12 >> 2];
 sa = c + 16 | 0;
}
function Ml() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 701;
 H(19486, 12752, 2, 13488, 12636, 702, ic(a + 12 | 0) | 0, 0);
 sa = a + 16 | 0;
}
function Zc(a) {
 We(a);
 p[a + 80 >> 2] = 0;
 p[a + 84 >> 2] = 0;
 p[a >> 2] = 3572;
 p[a + 88 >> 2] = 0;
 p[a + 92 >> 2] = 0;
 p[a >> 2] = 2552;
 return a;
}
function Mm(a, b) {
 a = a | 0;
 b = b | 0;
 if (ze(p[a + 20 >> 2])) {
  p[p[a + 20 >> 2] + 72 >> 2] = a - -64;
  a = 0;
 } else {
  a = 2;
 }
 return a | 0;
}
function wu(a) {
 var b = 0, c = 0;
 b = sa - 16 | 0;
 sa = b;
 if (!q[p[hb(b + 8 | 0, p[a + 4 >> 2]) >> 2]]) {
  c = vu(a);
 }
 sa = b + 16 | 0;
 return c;
}
function ys(a) {
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
function Kt(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = +c;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 return m[a | 0](b, c, d, e, f, g) | 0;
}
function Gd(a, b, c) {
 var d = w(0);
 d = w(b * w(3));
 c = w(c * w(3));
 return w(w(d + w(w(w(c + w(b * w(-6))) + w(w(d + w(w(1) - c)) * a)) * a)) * a);
}
function vm(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 4 >> 2] = a;
 Za(c + 8 | 0, b);
 Gk(c + 4 | 0, c + 8 | 0);
 sa = c + 16 | 0;
 return a;
}
function uk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 kk(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function dk(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Xj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Ij(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 wj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Hj(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 uj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Fj(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 oj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Ej(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 mj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function Dj(a, b) {
 a = a | 0;
 b = b | 0;
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 kj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
}
function ws(a, b) {
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = p[b + 4 >> 2];
 p[a + 8 >> 2] = p[b + 8 >> 2];
 p[a + 12 >> 2] = p[b + 12 >> 2];
 return a;
}
function vn(a) {
 var b = 0, c = 0;
 b = a + 88 | 0;
 c = p[a + 116 >> 2];
 if (c) {
  cd(b, c + 88 | 0, a - -64 | 0);
  return;
 }
 us(b, a - -64 | 0);
}
function pl(a, b) {
 a = a | 0;
 b = b | 0;
 a = a + 104 | 0;
 if (cb(a) >>> 0 > b >>> 0) {
  a = p[Ta(a, b) >> 2];
 } else {
  a = 0;
 }
 return a | 0;
}
function it(a, b) {
 a = a | 0;
 b = b | 0;
 rd(a, b);
 if (of(p[a + 20 >> 2])) {
  jt(p[a + 20 >> 2], a);
  a = 0;
 } else {
  a = 1;
 }
 return a | 0;
}
function cv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14051;
 O(19581, p[a + 12 >> 2], 4, -2147483648, 2147483647);
 sa = a + 16 | 0;
}
function av() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14068;
 O(19597, p[a + 12 >> 2], 4, -2147483648, 2147483647);
 sa = a + 16 | 0;
}
function Gj(a, b) {
 a = a | 0;
 b = w(b);
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 t[c + 12 >> 2] = b;
 sj(p[a + 8 >> 2], c + 12 | 0);
 sa = c + 16 | 0;
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
function qd(a, b, c) {
 c = w(w(w(b >>> 0) * c) + w(w(w(1) - c) * w(a >>> 0)));
 if (c < w(4294967296) & c >= w(0)) {
  return ~~c >>> 0;
 }
 return 0;
}
function Kh(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 Hc(a + 4 | 0, $a(d + 8 | 0, b, c));
 sa = d + 16 | 0;
}
function Zf(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 10988;
 b = p[a + 48 >> 2];
 if (b) {
  m[p[p[b >> 2] + 44 >> 2]](b);
 }
 eb(a);
 return a | 0;
}
function Tu(a) {
 a = a | 0;
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 a = p[b + 12 >> 2];
 Yi();
 sa = b + 16 | 0;
 return a | 0;
}
function Kq(a, b) {
 a = a | 0;
 b = b | 0;
 a : {
  if (!ob(b, 64)) {
   break a;
  }
  a = p[a + 128 >> 2];
  if (!a) {
   break a;
  }
  bh(a);
 }
}
function Rj(a, b, c, d, e, f, g) {
 var h = 0;
 h = sa - 48 | 0;
 sa = h;
 K(Qj() | 0, a | 0, 11585, Pj(h, b, c, d, e, f, g) | 0);
 sa = h + 48 | 0;
}
function Ch(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 3796;
 b = p[a + 104 >> 2];
 if (b) {
  m[p[p[b >> 2] + 4 >> 2]](b);
 }
 Oe(a);
 return a | 0;
}
function Tt(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 g = g | 0;
 m[a | 0](b, c, d, e, f, g);
}
function Jt(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 a = m[a | 0](b, c, d, e) | 0;
 aa(ta | 0);
 return a | 0;
}
function Ho(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c >> 2] = b;
 p[c + 8 >> 2] = a;
 a = ug(c, c + 8 | 0);
 sa = c + 16 | 0;
 return a;
}
function Bq(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
 p[b + 12 >> 2] = 0;
 oe(a + 8 | 0);
 sa = b + 16 | 0;
}
function gu(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = w(e);
 f = f | 0;
 g = w(g);
 m[a | 0](b, c, d, e, f, g);
}
function ne(a) {
 vc(a);
 p[a + 12 >> 2] = 0;
 p[a + 4 >> 2] = 0;
 p[a + 8 >> 2] = 0;
 p[a >> 2] = 7340;
 p[a + 16 >> 2] = 0;
 p[a >> 2] = 1300;
}
function Gc(a, b) {
 a = a | 0;
 b = b | 0;
 je(a, b);
 if (ob(b, 8)) {
  Jq(p[a + 132 >> 2], m[p[p[a >> 2] + 92 >> 2]](a) | 0, a + 136 | 0);
 }
}
function oi(a) {
 a = a | 0;
 var b = 0;
 p[a >> 2] = 2008;
 b = p[a + 108 >> 2];
 if (b) {
  Ua(b);
 }
 fb(a + 96 | 0);
 eb(a);
 return a | 0;
}
function ct(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 30) {
  return 1879048195 >>> (a & 2147483647) & 1;
 }
 return 0;
}
function Rt(a, b, c, d, e, f, g) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = w(e);
 f = w(f);
 g = w(g);
 m[a | 0](b, c, d, e, f, g);
}
function ev() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14030;
 O(19595, p[a + 12 >> 2], 2, -32768, 32767);
 sa = a + 16 | 0;
}
function ch(a) {
 a = a | 0;
 p[a >> 2] = 4884;
 eb(a + 360 | 0);
 eb(a + 296 | 0);
 eb(a + 232 | 0);
 eb(a + 168 | 0);
 qc(a);
 return a | 0;
}
function bs(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -6 | 0;
 if (a >>> 0 <= 30) {
  return 1073742129 >>> (a & 2147483647) & 1;
 }
 return 0;
}
function Xh(a) {
 a = a | 0;
 p[a >> 2] = 2804;
 eb(a + 452 | 0);
 eb(a + 356 | 0);
 eb(a + 260 | 0);
 eb(a + 164 | 0);
 qc(a);
 return a | 0;
}
function Cn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 29) {
  return 805306371 >>> (a & 1073741823) & 1;
 }
 return 0;
}
function Af(a, b, c, d) {
 var e = 0, f = 0;
 e = a;
 f = b;
 if (c != w(1)) {
  d = w(w(c * d) + w(w(w(1) - c) * bk(a, b)));
 }
 Tj(e, f, d);
}
function mv(a) {
 var b = 0, c = 0, d = 0;
 b = Qd(Pc(a) + 4 | 0);
 c = b, d = Pc(a), p[c >> 2] = d;
 Qb(b + 4 | 0, Ec(a), Pc(a));
 return b;
}
function jo(a) {
 Hn(a);
 p[a >> 2] = 8200;
 kg(a + 156 | 0);
 p[a + 172 >> 2] = 0;
 p[a >> 2] = 5132;
 ab(a + 176 | 0);
 n[a + 188 | 0] = 0;
}
function Zr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 26) {
  return 100663315 >>> (a & 134217727) & 1;
 }
 return 0;
}
function Sq(a, b, c, d) {
 a = c - b | 0;
 c = p[d >> 2] + v((a | 0) / -3 | 0, 3) | 0;
 p[d >> 2] = c;
 if ((a | 0) >= 1) {
  Qb(c, b, a);
 }
}
function Hr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 28) {
  return 268435459 >>> (a & 536870911) & 1;
 }
 return 0;
}
function ng(a) {
 Th(a);
 p[a >> 2] = 9272;
 p[a >> 2] = 9188;
 p[a + 120 >> 2] = 0;
 p[a >> 2] = 9100;
 p[a >> 2] = 1712;
 ab(a + 124 | 0);
}
function gs(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 26) {
  return 83886099 >>> (a & 134217727) & 1;
 }
 return 0;
}
function Vr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 26) {
  return 67108883 >>> (a & 134217727) & 1;
 }
 return 0;
}
function $i(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = a;
 a = sf(c, b);
 b = _i(d, a);
 ib(a);
 sa = c + 16 | 0;
 return b;
}
function ij(a, b, c, d, e, f) {
 var g = 0;
 g = sa - 32 | 0;
 sa = g;
 K(hj() | 0, a | 0, b | 0, fj(g, c, d, e, f) | 0);
 sa = g + 32 | 0;
}
function hv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 13999;
 O(19592, p[a + 12 >> 2], 1, -128, 127);
 sa = a + 16 | 0;
}
function gv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14004;
 O(19593, p[a + 12 >> 2], 1, -128, 127);
 sa = a + 16 | 0;
}
function zq(a, b, c, d) {
 var e = 0;
 e = sa - 16 | 0;
 sa = e;
 d = Dd(e, a, d);
 lh(Ma(a), b, c, d + 4 | 0);
 Vb(d);
 sa = e + 16 | 0;
}
function dv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14036;
 O(19596, p[a + 12 >> 2], 2, 0, 65535);
 sa = a + 16 | 0;
}
function pj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 yb(c + 12 | 0, t[b >> 2]);
 sa = c + 16 | 0;
 return a;
}
function gc(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 _b(c + 12 | 0, p[b >> 2]);
 sa = c + 16 | 0;
 return a;
}
function dh(a, b, c) {
 var d = 0;
 p[a >> 2] = p[b >> 2];
 d = p[b >> 2];
 p[a + 8 >> 2] = b;
 p[a + 4 >> 2] = (c << 2) + d;
 return a;
}
function Pq(a, b, c) {
 var d = 0;
 p[a >> 2] = p[b >> 2];
 d = p[b >> 2];
 p[a + 8 >> 2] = b;
 p[a + 4 >> 2] = (c << 3) + d;
 return a;
}
function fv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14016;
 O(19594, p[a + 12 >> 2], 1, 0, 255);
 sa = a + 16 | 0;
}
function bv() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14055;
 O(19383, p[a + 12 >> 2], 4, 0, -1);
 sa = a + 16 | 0;
}
function $u() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14073;
 O(19570, p[a + 12 >> 2], 4, 0, -1);
 sa = a + 16 | 0;
}
function Vn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 14) {
  return 18435 >>> (a & 32767) & 1;
 }
 return 0;
}
function Od(a) {
 var b = w(0), c = w(0);
 b = t[Ja(a, 0) >> 2];
 c = w(b * b);
 b = t[Ja(a, 1) >> 2];
 return w(D(w(c + w(b * b))));
}
function ok(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 _b(c + 12 | 0, Bf(b));
 sa = c + 16 | 0;
 return a;
}
function mn(a, b) {
 a = a | 0;
 b = b | 0;
 b = Fb(a, b);
 if (!b) {
  return Yf(a + 68 | 0, p[a + 20 >> 2]) ^ 1;
 }
 return b | 0;
}
function Sk() {
 var a = 0;
 a = Na(16);
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
 p[a + 8 >> 2] = 0;
 p[a + 12 >> 2] = 0;
 return a | 0;
}
function Ek(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = a;
 _b(c + 12 | 0, Ef(b));
 sa = c + 16 | 0;
 return a;
}
function Xn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 12) {
  return 4227 >>> (a & 8191) & 1;
 }
 return 0;
}
function Rn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 11) {
  return 2051 >>> (a & 4095) & 1;
 }
 return 0;
}
function Jn(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 11) {
  return 3075 >>> (a & 4095) & 1;
 }
 return 0;
}
function $n(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 12) {
  return 4099 >>> (a & 8191) & 1;
 }
 return 0;
}
function ap(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -1 | 0;
 if (a >>> 0 <= 10) {
  return 1537 >>> (a & 2047) & 1;
 }
 return 0;
}
function Xo(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = 0;
 ue(a, b + 12 | 0);
 Wo(a + 4 | 0);
 sa = b + 16 | 0;
}
function vd(a) {
 var b = 0, c = 0;
 Vo(a, p[a + 8 >> 2]);
 c = a;
 b = p[a >> 2];
 p[a >> 2] = 0;
 if (b) {
  Db(c);
  Ua(b);
 }
}
function jr(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 Kh(a, b, c);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 20 >> 2]](a, b, c);
}
function ir(a, b, c) {
 a = a | 0;
 b = w(b);
 c = w(c);
 Jh(a, b, c);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 24 >> 2]](a, b, c);
}
function Sd(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 120 >> 2] != b) {
  t[a + 120 >> 2] = b;
  m[p[p[a >> 2] + 76 >> 2]](a);
 }
}
function Li(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 124 >> 2] != b) {
  t[a + 124 >> 2] = b;
  m[p[p[a >> 2] + 80 >> 2]](a);
 }
}
function Hk(a, b, c) {
 var d = 0;
 p[a >> 2] = p[b >> 2];
 d = p[b >> 2];
 p[a + 8 >> 2] = b;
 p[a + 4 >> 2] = c + d;
 return a;
}
function Hi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 136 >> 2] != b) {
  t[a + 136 >> 2] = b;
  m[p[p[a >> 2] + 80 >> 2]](a);
 }
}
function Fi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 140 >> 2] != b) {
  t[a + 140 >> 2] = b;
  m[p[p[a >> 2] + 84 >> 2]](a);
 }
}
function $t(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 f = f | 0;
 m[a | 0](b, c, d, e, f);
}
function Ys(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 31) {
  return -268435453 >>> a & 1;
 }
 return 0;
}
function Ht(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = e | 0;
 f = w(f);
 Ai(b, c, p[a + 24 >> 2]);
}
function Fq(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -5 | 0;
 if (a >>> 0 <= 9) {
  return 609 >>> (a & 1023) & 1;
 }
 return 0;
}
function zo(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 132 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function zb(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 52 >> 2] != b) {
  t[a + 52 >> 2] = b;
  m[p[p[a >> 2] + 52 >> 2]](a);
 }
}
function uh(a, b, c) {
 a = q[c | 0] | q[c + 1 | 0] << 8;
 n[b | 0] = a;
 n[b + 1 | 0] = a >>> 8;
 n[b + 2 | 0] = q[c + 2 | 0];
}
function jt(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 124 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function jp(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 pc(a + 104 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function _u() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14087;
 W(19446, p[a + 12 >> 2], 4);
 sa = a + 16 | 0;
}
function Zu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14093;
 W(19564, p[a + 12 >> 2], 8);
 sa = a + 16 | 0;
}
function Yu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14204;
 M(19598, 0, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Xu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14448;
 M(19604, 4, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Xi(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 56 >> 2] != b) {
  t[a + 56 >> 2] = b;
  m[p[p[a >> 2] + 56 >> 2]](a);
 }
}
function Wu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14478;
 M(19605, 5, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Vu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14716;
 M(19606, 6, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Vj(a, b, c, d) {
 var e = 0;
 e = sa - 16 | 0;
 sa = e;
 K(Uj() | 0, a | 0, b | 0, Sj(e, c, d) | 0);
 sa = e + 16 | 0;
}
function Uu() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 p[a + 12 >> 2] = 14747;
 M(19607, 7, p[a + 12 >> 2]);
 sa = a + 16 | 0;
}
function Up(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 176 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Pt(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = w(e);
 f = w(f);
 m[a | 0](b, c, d, e, f);
}
function Eb(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 pc(a + 136 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Ab(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 48 >> 2] != b) {
  t[a + 48 >> 2] = b;
  m[p[p[a >> 2] + 48 >> 2]](a);
 }
}
function zt(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 44 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function wj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(vj() | 0, a | 0, 11885, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function um(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Fk() | 0, a | 0, 11456, Ek(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function uj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(tj() | 0, a | 0, 11856, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function sj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(qj() | 0, a | 0, 11891, pj(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function qk(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(pk() | 0, a | 0, 11487, ok(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function oj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(nj() | 0, a | 0, 11901, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function mj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(lj() | 0, a | 0, 11906, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function kn(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 80 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function kk(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(jk() | 0, a | 0, 11506, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function kj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(jj() | 0, a | 0, 11910, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Xj(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(Wj() | 0, a | 0, 11562, gc(c + 8 | 0, b) | 0);
 sa = c + 16 | 0;
}
function Tb(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 pc(a + 24 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Ps(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 96 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Ng(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 pc(a + 92 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Cr(a, b) {
 a = a | 0;
 b = b | 0;
 a = b + -10 | 0;
 if (a >>> 0 <= 4) {
  return 19 >>> (a & 31) & 1;
 }
 return 0;
}
function op(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 a = p[hb(c + 8 | 0, lp(a, b)) >> 2];
 sa = c + 16 | 0;
 return a;
}
function hg(a) {
 wc(a);
 n[a + 46 | 0] = 1;
 p[a >> 2] = 7940;
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 10988;
}
function fo(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 a = p[hb(c + 8 | 0, xn(a, b)) >> 2];
 sa = c + 16 | 0;
 return a;
}
function ai(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 8 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function Rh(a) {
 wc(a);
 p[a + 48 >> 2] = 0;
 p[a + 52 >> 2] = 0;
 p[a >> 2] = 3732;
 p[a + 56 >> 2] = 0;
 p[a >> 2] = 4428;
}
function Lt(a, b, c, d, e, f) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 e = w(e);
 f = w(f);
 m[a | 0](b, c, d, e, f);
}
function Jp(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Hb(a + 4 | 0, c + 12 | 0);
 sa = c + 16 | 0;
}
function nk(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 K(mk() | 0, a | 0, 11497, lk(d, b, c) | 0);
 sa = d + 16 | 0;
}
function ej(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 K(dj() | 0, a | 0, 11950, cj(d, b, c) | 0);
 sa = d + 16 | 0;
}
function Wi(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(19599, 0, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function Wg(a) {
 a = a | 0;
 p[a >> 2] = 5868;
 eb(a + 292 | 0);
 eb(a + 228 | 0);
 eb(a + 164 | 0);
 qc(a);
 return a | 0;
}
function Vi(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(19384, 1, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function Vh(a) {
 Xe(a);
 p[a >> 2] = 3164;
 p[a + 128 >> 2] = 0;
 p[a + 132 >> 2] = 0;
 p[a >> 2] = 4128;
 ab(a + 136 | 0);
}
function Ui(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(19600, 2, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function Ti(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(19601, 3, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function Si(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(19602, 4, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function Sg() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 b = hb(a + 8 | 0, Sc());
 sa = a + 16 | 0;
 return p[b >> 2];
}
function Ri(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 M(19603, 5, p[b + 12 >> 2]);
 sa = b + 16 | 0;
}
function Oj(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 K(Nj() | 0, a | 0, 11554, Mj(d, b, c) | 0);
 sa = d + 16 | 0;
}
function tk(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 K(rk() | 0, a | 0, b | 0, Hf(c + 8 | 0) | 0);
 sa = c + 16 | 0;
}
function og(a) {
 Wb(a);
 p[a + 48 >> 2] = 255;
 p[a + 52 >> 2] = 1;
 p[a >> 2] = 9036;
 p[a >> 2] = 2240;
 db(a + 56 | 0);
}
function rh(a) {
 a = a | 0;
 var b = 0, c = 0;
 ke(a);
 b = a, c = Uc(p[a + 128 >> 2] + 156 | 0, 0), p[b + 132 >> 2] = c;
}
function Ya(a) {
 var b = 0, c = 0;
 b = Na(8);
 c = p[a + 4 >> 2];
 p[b >> 2] = p[a >> 2];
 p[b + 4 >> 2] = c;
 return b;
}
function Sc() {
 var a = 0, b = 0;
 a = sa - 16 | 0;
 sa = a;
 b = hb(a + 8 | 0, 0);
 sa = a + 16 | 0;
 return p[b >> 2];
}
function Lf(a, b, c, d) {
 var e = 0, f = 0;
 e = a;
 f = b;
 if (c != w(1)) {
  d = bg(Ql(a, b), d, c);
 }
 Il(e, f, d);
}
function wd(a, b, c, d) {
 a = c - b | 0;
 c = p[d >> 2] - a | 0;
 p[d >> 2] = c;
 if ((a | 0) >= 1) {
  Qb(c, b, a);
 }
}
function jb(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 p[d + 12 >> 2] = c;
 Oi(a, b, c, 0, 0);
 sa = d + 16 | 0;
}
function Me(a, b, c) {
 p[a >> 2] = b;
 b = p[b + 4 >> 2];
 p[a + 4 >> 2] = b;
 p[a + 8 >> 2] = b + (c << 3);
 return a;
}
function Dd(a, b, c) {
 p[a >> 2] = b;
 b = p[b + 4 >> 2];
 p[a + 4 >> 2] = b;
 p[a + 8 >> 2] = b + (c << 2);
 return a;
}
function zf(a) {
 a = a | 0;
 p[a >> 2] = 13176;
 if (q[a + 4 | 0]) {
  Zb(a, 12916);
 }
 Bb(a + 8 | 0);
 return a | 0;
}
function vf(a) {
 a = a | 0;
 p[a >> 2] = 13568;
 if (q[a + 4 | 0]) {
  Zb(a, 12916);
 }
 Bb(a + 8 | 0);
 return a | 0;
}
function lo(a) {
 a = a | 0;
 a = a + 4 | 0;
 if (Ue(a)) {
  a = 0;
 } else {
  a = p[Ta(a, 0) >> 2];
 }
 return a | 0;
}
function hp(a, b) {
 xd(a + 44 | 0, 2);
 if (s[b + 36 >> 2] < s[a + 152 >> 2]) {
  p[a + 152 >> 2] = p[b + 36 >> 2];
 }
}
function ae(a, b) {
 a = a | 0;
 b = b | 0;
 p[a + 52 >> 2] = b;
 b = a;
 a = Gm();
 p[b + 48 >> 2] = a;
 return a | 0;
}
function Gk(a, b) {
 p[p[a >> 2] >> 2] = p[b >> 2];
 p[p[a >> 2] + 4 >> 2] = p[b + 4 >> 2];
 p[a >> 2] = p[a >> 2] + 8;
}
function Cf(a) {
 a = a | 0;
 p[a >> 2] = 12852;
 if (q[a + 4 | 0]) {
  Zb(a, 12916);
 }
 Bb(a + 8 | 0);
 return a | 0;
}
function oq(a) {
 a = a | 0;
 var b = 0;
 b = a + 152 | 0;
 if (p[b + 4 >> 2]) {
  Cb(p[b + 4 >> 2], 8, 0);
 }
 oh(a);
}
function gk(a, b) {
 p[a >> 2] = 0;
 Dh(a);
 p[a >> 2] = 13228;
 Mc(a + 4 | 0);
 p[a >> 2] = 13176;
 Ud(a + 8 | 0, b);
}
function bg(a, b, c) {
 return dg(qd(fe(a), fe(b), c), qd(ie(a), ie(b), c), qd(he(a), he(b), c), qd(ge(a), ge(b), c));
}
function We(a) {
 Rh(a);
 p[a >> 2] = 3664;
 o[a + 60 >> 1] = 0;
 p[a >> 2] = 2728;
 db(a - -64 | 0);
 db(a + 72 | 0);
}
function Vo(a, b) {
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
function Cq(a, b) {
 p[a >> 2] = 3536;
 p[a >> 2] = 1800;
 sf(a + 4 | 0, b + 4 | 0);
 p[a + 16 >> 2] = p[b + 16 >> 2];
}
function Cg(a) {
 var b = 0;
 b = p[a >> 2];
 p[a >> 2] = 0;
 if (b) {
  q[Db(a) + 4 | 0];
  if (b) {
   Ua(b);
  }
 }
}
function lh(a, b, c, d) {
 a = c - b | 0;
 if ((a | 0) >= 1) {
  Qb(p[d >> 2], b, a);
  p[d >> 2] = p[d >> 2] + a;
 }
}
function ed(a, b, c) {
 a : {
  if (p[c + 76 >> 2] <= -1) {
   a = qf(a, b, c);
   break a;
  }
  a = qf(a, b, c);
 }
}
function ar(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = Ah(a, b);
 sa = c + 16 | 0;
 return d ? b : a;
}
function Uo(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = qe(a, b);
 sa = c + 16 | 0;
 return d ? b : a;
}
function Ro(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = qe(b, a);
 sa = c + 16 | 0;
 return d ? b : a;
}
function Iq(a, b) {
 var c = 0, d = 0;
 c = sa - 16 | 0;
 sa = c;
 d = Ah(b, a);
 sa = c + 16 | 0;
 return d ? b : a;
}
function _m(a, b) {
 a = a | 0;
 b = b | 0;
 b = Kp(p[a + 20 >> 2]);
 if (!b) {
  return 1;
 }
 Jp(b, a);
 return 0;
}
function _h(a) {
 if (!q[a + 60 | 0]) {
  m[p[p[a >> 2] + 60 >> 2]](a);
  n[a + 60 | 0] = 1;
 }
 return a - -64 | 0;
}
function rq(a) {
 a = a | 0;
 var b = 0;
 rh(a);
 b = a + 152 | 0;
 if (p[b + 4 >> 2]) {
  Tb(p[b + 4 >> 2], a);
 }
}
function re(a, b) {
 a = sa - 16 | 0;
 sa = a;
 p[a + 8 >> 2] = b;
 b = To(a + 8 | 0);
 sa = a + 16 | 0;
 return b;
}
function gf(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 a = p[hb(b + 8 | 0, a) >> 2];
 sa = b + 16 | 0;
 return a;
}
function bc(a, b) {
 if (_e(b)) {
  Ib(a, jh(p[b + 56 >> 2]));
  return;
 }
 $a(a, t[b + 48 >> 2], t[b + 52 >> 2]);
}
function Zh(a) {
 if (!q[a + 61 | 0]) {
  m[p[p[a >> 2] + 64 >> 2]](a);
  n[a + 61 | 0] = 1;
 }
 return a + 72 | 0;
}
function Og(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 sg(b + 8 | 0, a);
 sa = b + 16 | 0;
 return p[b + 8 >> 2];
}
function uv(a) {
 var b = 0;
 b = a & 31;
 a = 0 - a & 31;
 return (-1 >>> b & -2) << b | (-1 << a & -2) >>> a;
}



function kt(a, b) {
 a = a | 0;
 b = w(b);
 if (t[a + 4 >> 2] != b) {
  p[a + 8 >> 2] = 1;
  t[a + 4 >> 2] = b;
 }
}
function Wo(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = 0;
 ve(a, b + 12 | 0);
 sa = b + 16 | 0;
}
function Fu(a) {
 var b = 0, c = 0;
 b = Ci(a) + 1 | 0;
 c = Qd(b);
 if (!c) {
  return 0;
 }
 return Qb(c, a, b);
}
function nh(a, b) {
 Hq(a, b);
 p[a >> 2] = 4232;
 p[a + 60 >> 2] = p[b + 60 >> 2];
 p[a >> 2] = 5796;
 return a;
}
function me(a) {
 a = a | 0;
 p[a + 68 >> 2] = 10812;
 p[a >> 2] = 10728;
 fb(a + 80 | 0);
 eb(a);
 return a | 0;
}
function Cs(a, b, c) {
 p[a + 12 >> 2] = c;
 n[a + 8 | 0] = 0;
 p[a >> 2] = b;
 p[a + 4 >> 2] = b + c;
 return a;
}
function rm() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 qa(11460, 2, 12608, 12616, 671, 563);
 sa = a + 16 | 0;
}
function _k() {
 var a = 0;
 a = sa - 16 | 0;
 sa = a;
 ha(19582, 2, 13932, 12616, 721, 656);
 sa = a + 16 | 0;
}
function Ut(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = e | 0;
 m[a | 0](b, c, d, e);
}
function Gi(a, b) {
 p[a + 12 >> 2] = 0;
 p[a + 4 >> 2] = b;
 p[a >> 2] = b;
 p[a + 8 >> 2] = b + 1;
 return a;
}
function zi(a, b) {
 if (p[a + 16 >> 2] != (b | 0)) {
  p[a + 16 >> 2] = b;
  m[p[p[a >> 2] + 32 >> 2]](a);
 }
}
function hu(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 e = w(e);
 m[a | 0](b, c, d, e);
}
function fb(a) {
 var b = 0;
 cf(a);
 if (p[a >> 2]) {
  th(a);
  Ma(a);
  b = p[a >> 2];
  rc(a);
  Ua(b);
 }
}
function Yd(a, b) {
 if (p[a + 48 >> 2] != (b | 0)) {
  p[a + 48 >> 2] = b;
  m[p[p[a >> 2] + 48 >> 2]](a);
 }
}
function Ne(a) {
 var b = 0;
 Ie(a);
 if (p[a >> 2]) {
  Ph(a);
  Ma(a);
  b = p[a >> 2];
  tc(a);
  Ua(b);
 }
}
function Jj(a, b) {
 p[a >> 2] = 0;
 p[a >> 2] = 13624;
 Mc(a + 4 | 0);
 p[a >> 2] = 13568;
 Ud(a + 8 | 0, b);
}
function Ff(a, b) {
 if (p[a + 24 >> 2] != (b | 0)) {
  p[a + 24 >> 2] = b;
  m[p[p[a >> 2] + 48 >> 2]](a);
 }
}
function Bk(a, b) {
 p[a >> 2] = 0;
 p[a >> 2] = 12888;
 Mc(a + 4 | 0);
 p[a >> 2] = 12852;
 Ud(a + 8 | 0, b);
}
function Wt(a, b, c, d, e) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 e = w(e);
 m[a | 0](b, c, d, e);
}
function zu(a, b, c) {
 var d = 0;
 d = sa - 16 | 0;
 sa = d;
 a = yu(a, b, c);
 sa = d + 16 | 0;
 return a;
}
function Rm(a) {
 a = a | 0;
 var b = 0;
 b = p[a + 48 >> 2];
 m[p[p[b >> 2] + 16 >> 2]](b, p[a + 60 >> 2]);
}
function Qm(a) {
 a = a | 0;
 var b = 0;
 b = p[a + 48 >> 2];
 m[p[p[b >> 2] + 12 >> 2]](b, p[a + 64 >> 2]);
}
function Ju(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 p[c + 12 >> 2] = b;
 Iu(a, b);
 sa = c + 16 | 0;
}
function Xe(a) {
 Th(a);
 p[a + 120 >> 2] = 0;
 p[a + 124 >> 2] = 0;
 p[a >> 2] = 3256;
 p[a >> 2] = 10412;
}
function Sm(a) {
 a = a | 0;
 var b = 0;
 b = p[a + 48 >> 2];
 m[p[p[b >> 2] + 8 >> 2]](b, t[a + 56 >> 2]);
}
function qq(a) {
 a = a | 0;
 if (p[a + 156 >> 2]) {
  a = 19344;
 } else {
  a = ec(a);
 }
 return a | 0;
}
function hh(a) {
 Kd(a);
 p[a + 164 >> 2] = 5;
 p[a + 168 >> 2] = 0;
 p[a >> 2] = 4756;
 p[a >> 2] = 4620;
}
function Td(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 rf(a, b + 4 | 0, p[b >> 2]);
 sa = c + 16 | 0;
}
function $g(a) {
 a = a | 0;
 p[a >> 2] = 5132;
 fb(a + 176 | 0);
 _g(a + 156 | 0);
 Zg(a);
 return a | 0;
}
function mc(a) {
 a = a + -4 | 0;
 if (a >>> 0 <= 120) {
  return p[(a << 2) + 9848 >> 2];
 }
 return -1;
}
function Hf(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 p[b + 12 >> 2] = a;
 sa = b + 16 | 0;
 return a;
}
function ju(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 return m[a | 0](b, c, d) | 0;
}
function Ki(a, b) {
 if (t[a + 88 >> 2] != b) {
  t[a + 88 >> 2] = b;
  m[p[p[a >> 2] + 76 >> 2]](a);
 }
}
function Kc(a, b) {
 if (t[a + 60 >> 2] != b) {
  t[a + 60 >> 2] = b;
  m[p[p[a >> 2] + 60 >> 2]](a);
 }
}
function qb(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 a = wu(Gi(b, a));
 sa = b + 16 | 0;
 return a;
}
function Ot(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 return m[a | 0](b, c, d) | 0;
}
function rn(a, b) {
 a = a | 0;
 b = b | 0;
 a = ae(a, b);
 m[p[p[a >> 2] >> 2]](a, 1);
 return a | 0;
}
function gm(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 hd(a, U(Ec(b) | 0, 19401, p[c >> 2]) | 0);
}
function cm(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 Lf(b, c, d, p[a + 24 >> 2]);
}
function Zq(a) {
 var b = 0;
 if (p[a >> 2]) {
  Nh(a);
  Ma(a);
  b = p[a >> 2];
  sc(a);
  Ua(b);
 }
}
function Yl(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 hd(a, U(Ec(b) | 0, 19443, p[c >> 2]) | 0);
}
function Kl(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 hd(a, U(Ec(b) | 0, 19486, p[c >> 2]) | 0);
}
function Ak(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 Af(b, c, d, t[a + 24 >> 2]);
}
function Qt(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = +d;
 return m[a | 0](b, c, d) | 0;
}
function im(a) {
 a = a | 0;
 var b = 0;
 b = Na(12);
 Bk(b, a);
 p[b >> 2] = 12816;
 return b | 0;
}
function er(a, b) {
 a = a | 0;
 b = b | 0;
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 12 >> 2]](a, b);
}
function Zl(a) {
 a = a | 0;
 var b = 0;
 b = Na(12);
 gk(b, a);
 p[b >> 2] = 13124;
 return b | 0;
}
function Mt(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 Ai(b, c, p[a + 24 >> 2]);
}
function Ll(a) {
 a = a | 0;
 var b = 0;
 b = Na(12);
 Jj(b, a);
 p[b >> 2] = 13512;
 return b | 0;
}
function Be(a, b, c, d, e) {
 Ab(b, w(Bc(e) * d));
 zb(b, w(Cc(e) * c));
 Kc(b, t[a + 168 >> 2]);
}
function Wc(a) {
 if (p[a + 20 >> 2]) {
  a = p[a + 20 >> 2];
  m[p[p[a >> 2] + 88 >> 2]](a);
 }
}
function lg(a) {
 p[a + 4 >> 2] = 1065353216;
 p[a + 8 >> 2] = 0;
 p[a >> 2] = 7744;
 return a;
}
function Za(a, b) {
 var c = 0;
 c = p[b + 4 >> 2];
 p[a >> 2] = p[b >> 2];
 p[a + 4 >> 2] = c;
}
function sd(a, b) {
 var c = 0;
 c = p[a >> 2];
 p[a >> 2] = b;
 if (c) {
  Db(a);
  Ua(c);
 }
}
function pc(a, b) {
 if (p[a + 4 >> 2] != p[Ma(a) >> 2]) {
  Yc(a, b);
  return;
 }
 ph(a, b);
}
function jf(a, b) {
 var c = 0;
 c = sa - 16 | 0;
 sa = c;
 rf(a, b, Ci(b));
 sa = c + 16 | 0;
}
function dg(a, b, c, d) {
 return d & 255 | (c << 8 & 65280 | (b << 16 & 16711680 | a << 24));
}
function Xk(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 xi(p[a >> 2], b, t[a + 4 >> 2], c);
}
function Ub(a) {
 Rh(a);
 p[a + 60 >> 2] = 0;
 p[a >> 2] = 4232;
 p[a >> 2] = 5796;
 return a;
}
function Hb(a, b) {
 if (p[a + 4 >> 2] != p[Ma(a) >> 2]) {
  Yc(a, b);
  return;
 }
 Uh(a, b);
}
function zr(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  Yc(a, b);
  return;
 }
 Uh(a, b);
}
function or(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  cr(a, b);
  return;
 }
 br(a, b);
}
function np(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  Yc(a, b);
  return;
 }
 ph(a, b);
}
function cu(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = d | 0;
 m[a | 0](b, c, d);
}
function Re(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  tr(a, b);
  return;
 }
 rr(a, b);
}
function Hc(a, b) {
 if (s[a + 4 >> 2] < s[Ma(a) >> 2]) {
  vr(a, b);
  return;
 }
 ur(a, b);
}
function Xt(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 d = w(d);
 m[a | 0](b, c, d);
}
function bu(a, b, c, d) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 d = w(d);
 m[a | 0](b, c, d);
}
function Uf(a) {
 a = a | 0;
 p[a + 72 >> 2] = 0;
 Cb(p[p[a + 20 >> 2] + 20 >> 2], 256, 0);
}
function Os(a, b) {
 a = a | 0;
 b = b | 0;
 a = p[a + 112 >> 2];
 m[p[p[a >> 2] >> 2]](a);
}
function nv(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return m[p[a >> 2]](b, c) | 0;
}
function Zo(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 48) | 0;
}
function Wk(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 29 | (b | 0) == 37) | 0;
}
function Pn(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 18) | 0;
}
function Mn(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 19) | 0;
}
function Im(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 47) | 0;
}
function Hs(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 44) | 0;
}
function Ft(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 29 | (b | 0) == 50) | 0;
}
function Ds(a, b) {
 a = a | 0;
 b = b | 0;
 return !!((b | 0) == 10 | (b | 0) == 45) | 0;
}
function fr(a) {
 a = a | 0;
 Hh(a);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 32 >> 2]](a);
}
function pb(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 uu(Gi(b, a));
 sa = b + 16 | 0;
}
function nf(a) {
 a = a | 0;
 p[a >> 2] = 1712;
 fb(a + 124 | 0);
 eb(a);
 return a | 0;
}
function kr(a) {
 a = a | 0;
 Qh(a);
 a = p[a + 104 >> 2];
 m[p[p[a >> 2] + 8 >> 2]](a);
}
function gn(a, b) {
 a = a | 0;
 b = b | 0;
 return t[a + 52 >> 2] < t[b + 52 >> 2] | 0;
}
function _t(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return w(w(m[a | 0](b, c)));
}
function Zg(a) {
 a = a | 0;
 p[a >> 2] = 5232;
 fb(a + 132 | 0);
 eb(a);
 return a | 0;
}
function eb(a) {
 a = a | 0;
 p[a >> 2] = 6412;
 fb(a + 24 | 0);
 ri(a);
 return a | 0;
}
function ci(a) {
 a = a | 0;
 p[a >> 2] = 2328;
 fb(a + 60 | 0);
 eb(a);
 return a | 0;
}
function zh(a, b, c) {
 a = p[c + 4 >> 2];
 p[b >> 2] = p[c >> 2];
 p[b + 4 >> 2] = a;
}
function oh(a) {
 a = a | 0;
 Cb(a, 8, 0);
 a = p[a + 128 >> 2];
 if (a) {
  bh(a);
 }
}
function ku(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return m[a | 0](b, c) | 0;
}
function Se(a, b, c) {
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
function Vt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 return m[a | 0](b, c) | 0;
}
function Qk(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 t[p[a >> 2] + b >> 2] = c;
}
function qg(a) {
 vc(a);
 p[a >> 2] = 1604;
 jf(a + 4 | 0, 7189);
 p[a >> 2] = 7388;
}
function Zt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = +c;
 return m[a | 0](b, c) | 0;
}
function Fe(a) {
 if (1073741823 < a >>> 0) {
  Nb();
  E();
 }
 return Na(a << 2);
}
function id(a) {
 if (a < 4294967296 & a >= 0) {
  return ~~a >>> 0;
 }
 return 0;
}
function li(a) {
 var b = 0;
 b = sa - 16 | 0;
 sa = b;
 ys(a);
 sa = b + 16 | 0;
}
function Pc(a) {
 if (Ic(a)) {
  return p[a + 4 >> 2];
 }
 return q[a + 11 | 0];
}
function ke(a) {
 a = a | 0;
 if (p[a + 20 >> 2]) {
  Tb(p[a + 20 >> 2], a);
 }
}
function ri(a) {
 a = a | 0;
 p[a >> 2] = 1800;
 ib(a + 4 | 0);
 return a | 0;
}
function pv() {
 rb(19296);
 rb(19320);
 rb(19344);
 sm();
 m[766](19587) | 0;
}
function pf(a) {
 a = a | 0;
 p[a >> 2] = 1604;
 ib(a + 4 | 0);
 return a | 0;
}
function Ze(a) {
 if (_e(a)) {
  return ec(p[a + 56 >> 2]);
 }
 return Zh(a);
}
function Rk(a, b) {
 a = a | 0;
 b = b | 0;
 return w(t[p[a >> 2] + b >> 2]);
}
function Nd(a) {
 if (_e(a)) {
  return $h(p[a + 56 >> 2]);
 }
 return _h(a);
}
function ip(a, b) {
 a = a | 0;
 b = b | 0;
 return Mg(a + -72 | 0, b) | 0;
}
function ic(a) {
 var b = 0;
 b = Na(4);
 p[b >> 2] = p[a >> 2];
 return b;
}
function eu(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 m[a | 0](b, c);
}
function Lm(a, b) {
 a = a | 0;
 b = b | 0;
 return Vf(a + -64 | 0, b) | 0;
}
function rj(a, b) {
 a = a | 0;
 b = b | 0;
 return b + -29 >>> 0 < 2 | 0;
}
function Yt(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = w(c);
 m[a | 0](b, c);
}
function tq(a, b) {
 a = a | 0;
 b = b | 0;
 return b + -9 >>> 0 < 2 | 0;
}
function Kf(a) {
 a = a | 0;
 if (a) {
  m[p[p[a >> 2] + 44 >> 2]](a);
 }
}
function yc(a) {
 return w(t[Ja(a + 8 | 0, 0) >> 2] - t[Ja(a, 0) >> 2]);
}
function xc(a) {
 return w(t[Ja(a + 8 | 0, 1) >> 2] - t[Ja(a, 1) >> 2]);
}
function se(a, b, c) {
 p[a >> 2] = p[b >> 2];
 n[a + 4 | 0] = q[c | 0];
}
function eg(a, b) {
 return Gd(Gp(a, b), t[a + 8 >> 2], t[a + 16 >> 2]);
}
function Mb(a) {
 a = a | 0;
 if (a) {
  m[p[p[a >> 2] + 4 >> 2]](a);
 }
}
function yb(a, b) {
 t[p[a >> 2] >> 2] = b;
 p[a >> 2] = p[a >> 2] + 8;
}
function te(a) {
 var b = 0;
 b = p[a >> 2];
 p[a >> 2] = 0;
 return b;
}
function ls(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 32) == 42 | 0;
}
function _b(a, b) {
 p[p[a >> 2] >> 2] = b;
 p[a >> 2] = p[a >> 2] + 8;
}
function Fr(a, b) {
 a = a | 0;
 b = b | 0;
 return (b & -2) == 10 | 0;
}
function vt(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 28 | 0;
}
function tt(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 27 | 0;
}
function tm(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 29 | 0;
}
function nr(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 25 | 0;
}
function du(a, b) {
 a = a | 0;
 b = b | 0;
 return w(w(m[a | 0](b)));
}
function bn(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 26 | 0;
}
function Fn(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 23 | 0;
}
function $s(a, b) {
 a = a | 0;
 b = b | 0;
 return (b | 0) == 10 | 0;
}
function gt(a) {
 a = a | 0;
 return w(t[p[a + 20 >> 2] + 120 >> 2]);
}
function En(a, b, c) {
 a = a | 0;
 b = b | 0;
 c = c | 0;
 return 0;
}
function $a(a, b, c) {
 t[a + 4 >> 2] = c;
 t[a >> 2] = b;
 return a;
}
function tf(a) {
 if (!a) {
  return 0;
 }
 p[4904] = a;
 return -1;
}
function mu(a, b) {
 a = a | 0;
 b = b | 0;
 return m[a | 0](b) | 0;
}
function Dg(a) {
 return a >>> 0 >= 2 ? 1 << 32 - y(a + -1 | 0) : a;
}
function wk(a, b) {
 a = a | 0;
 b = b | 0;
 qk(p[a + 8 >> 2], b);
}
function wf(a, b, c, d, e, f) {
 ij(p[a + 8 >> 2], b, c, d, e, f);
}
function nn(a) {
 a = a | 0;
 Cb(p[a + 20 >> 2], Xb(256, 512), 0);
}
function uc(a) {
 return (p[a + 4 >> 2] - p[a >> 2] | 0) / 3 | 0;
}
function sc(a) {
 return (p[Ma(a) >> 2] - p[a >> 2] | 0) / 3 | 0;
}
function rl(a, b) {
 a = a | 0;
 b = b | 0;
 return $i(a, b) | 0;
}
function nb(a, b, c) {
 if (!(q[a | 0] & 32)) {
  qf(b, c, a);
 }
}
function _s(a, b) {
 a = a | 0;
 b = b | 0;
 return rd(a, b) | 0;
}
function Vm(a) {
 a = a | 0;
 return (q[a + 68 | 0] ? 2 : 4) | 0;
}
function Nq(a, b) {
 a = a | 0;
 b = b | 0;
 return Fb(a, b) | 0;
}
function Gg(a, b) {
 n[a + 4 | 0] = 0;
 p[a >> 2] = b;
 return a;
}
function gp(a, b) {
 a = a | 0;
 b = b | 0;
 xd(a + 44 | 0, 2);
}
function dd(a) {
 n[a + 8 | 0] = 1;
 p[a >> 2] = p[a + 4 >> 2];
}
function db(a) {
 p[a >> 2] = 0;
 p[a + 4 >> 2] = 0;
 return a;
}
function Qg(a) {
 var b = 0;
 b = p[a >> 2];
 Qa(a);
 return b;
}
function Ji(a, b) {
 if (!a) {
  return 0;
 }
 return Du(a, b);
}
function $k(a) {
 a = a | 0;
 return rt(Na(16), p[a >> 2]) | 0;
}
function ze(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 24) | 0;
}
function zd(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 48) | 0;
}
function wc(a) {
 Wb(a);
 p[a >> 2] = 3476;
 p[a >> 2] = 3420;
}
function of(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 40) | 0;
}
function kc(a, b) {
 a = a | 0;
 b = b | 0;
 sf(a, b + 4 | 0);
}
function gg(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 38) | 0;
}
function ff(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 13) | 0;
}
function bh(a) {
 Cb(p[a + 172 >> 2], 8, 1);
 Hp(a + 156 | 0);
}
function Xc(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 36) | 0;
}
function ef(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 3) | 0;
}
function df(a) {
 return m[p[p[a >> 2] + 12 >> 2]](a, 2) | 0;
}
function Vd(a, b) {
 a = a | 0;
 b = b | 0;
 m[p[a >> 2]](b);
}
function Ec(a) {
 if (Ic(a)) {
  a = p[a >> 2];
 }
 return a;
}
function Pu(a) {
 a = a | 0;
 return da(p[a + 60 >> 2]) | 0;
}
function Ld(a, b) {
 di(a - -64 | 0, b);
 n[a + 60 | 0] = 1;
}
function od(a) {
 a = a | 0;
 m[p[p[a >> 2] + 68 >> 2]](a);
}
function dp(a, b) {
 a = a | 0;
 b = +b;
 return ep(a) | 0;
}
function cc(a) {
 a = a | 0;
 m[p[p[a >> 2] + 88 >> 2]](a);
}
function Wm(a) {
 a = a | 0;
 m[p[p[a >> 2] + 52 >> 2]](a);
}
function Ud(a, b) {
 p[a >> 2] = p[b >> 2];
 p[b >> 2] = 0;
}
function Md(a, b) {
 di(a + 72 | 0, b);
 n[a + 61 | 0] = 1;
}
function tb(a, b, c) {
 Q(19483, b | 0, c | 0);
 return a;
}
function jc(a, b, c) {
 Q(19404, b | 0, c | 0);
 return a;
}
function _d(a, b, c) {
 Q(19482, b | 0, c | 0);
 return a;
}
function Nf(a, b, c) {
 Q(19480, b | 0, c | 0);
 return a;
}
function Mf(a, b, c) {
 Q(19445, b | 0, c | 0);
 return a;
}
function Kg(a) {
 return (Xb(r[a + 44 >> 1], 2) | 0) == 2;
}
function Gl(a) {
 a = a | 0;
 if (a) {
  rg(a);
 }
 Ua(a);
}
function Dp(a) {
 a = a | 0;
 return p[a + 164 >> 2] << 1;
}
function $d(a, b, c) {
 Q(19481, b | 0, c | 0);
 return a;
}
function ml(a) {
 a = a | 0;
 return cb(a + 104 | 0) | 0;
}
function lu(a, b) {
 a = a | 0;
 b = b | 0;
 m[a | 0](b);
}
function bf(a) {
 a = a | 0;
 o[a + 60 >> 1] = 0;
 Wc(a);
}
function Yh(a) {
 a = a | 0;
 Wc(a);
 o[a + 60 >> 1] = 0;
}
function tc(a) {
 return p[Ma(a) >> 2] - p[a >> 2] >> 3;
}
function rc(a) {
 return p[Ma(a) >> 2] - p[a >> 2] >> 2;
}
function lb(a) {
 return p[a + 4 >> 2] - p[a >> 2] >> 3;
}
function fg(a) {
 if (Cb(a, 32, 0)) {
  Cb(a, 64, 1);
 }
}
function cb(a) {
 return p[a + 4 >> 2] - p[a >> 2] >> 2;
}
function bt(a) {
 a = a | 0;
 return w(t[a + 112 >> 2]);
}
function af(a) {
 a = a | 0;
 n[a + 60 | 0] = 0;
 Wc(a);
}
function Ws(a) {
 a = a | 0;
 return w(t[a + 136 >> 2]);
}
function Vs(a) {
 a = a | 0;
 return w(t[a + 140 >> 2]);
}
function Vb(a) {
 p[p[a >> 2] + 4 >> 2] = p[a + 4 >> 2];
}
function Pr(a) {
 a = a | 0;
 return w(t[a + 124 >> 2]);
}
function Bi(a) {
 a = a | 0;
 return w(t[a + 120 >> 2]);
}
function $e(a) {
 a = a | 0;
 n[a + 61 | 0] = 0;
 Wc(a);
}
function yn(a) {
 a = a | 0;
 return w(t[a + 20 >> 2]);
}
function ug(a, b) {
 return p[a >> 2] - p[b >> 2] >> 2;
}
function sk(a) {
 a = a | 0;
 return w(t[a + 24 >> 2]);
}
function qu(a) {
 a = a | 0;
 return w(t[a + 48 >> 2]);
}
function nu(a) {
 a = a | 0;
 return w(t[a + 52 >> 2]);
}
function hc(a) {
 return p[Ma(a) >> 2] - p[a >> 2] | 0;
}
function fu(a) {
 a = a | 0;
 return w(t[a + 56 >> 2]);
}
function ac(a) {
 return p[a + 4 >> 2] - p[a >> 2] | 0;
}
function Ra(a, b) {
 return p[a >> 2] == p[b >> 2] ^ 1;
}
function Kr(a) {
 a = a | 0;
 return w(t[a + 12 >> 2]);
}
function Dk(a) {
 a = a | 0;
 return w(t[a + 16 >> 2]);
}
function Ao(a) {
 a = a | 0;
 Cb(p[a + 40 >> 2], 4, 0);
}
function yf(a, b, c, d) {
 Vj(p[a + 8 >> 2], b, c, d);
}
function xb(a, b) {
 a = a | 0;
 b = b | 0;
 return 0;
}
function td(a, b, c) {
 return p[b >> 2] == p[c >> 2];
}
function pe(a, b) {
 p[a >> 2] = p[b >> 2];
 return a;
}
function kf(a) {
 a = a | 0;
 return w(t[a + 4 >> 2]);
}
function dm(a) {
 a = a | 0;
 return w(t[a + 8 >> 2]);
}
function Fh(a, b, c) {
 return w(w(w(b - a) * c) + a);
}
function Bp(a, b) {
 a = a | 0;
 b = b | 0;
 fh(a, b);
}
function kb(a, b) {
 return p[a >> 2] + (b << 3) | 0;
}
function fq(a) {
 a = a | 0;
 return p[a + 164 >> 2];
}
function dr(a) {
 a = a | 0;
 return p[a + 104 >> 2];
}
function Ta(a, b) {
 return p[a >> 2] + (b << 2) | 0;
}
function Qc(a) {
 return !(a + -1 & a) & a >>> 0 > 2;
}
function pt(a) {
 a = a | 0;
 return p[a + 32 >> 2];
}
function ol(a) {
 a = a | 0;
 return p[a + 16 >> 2];
}
function nt(a) {
 a = a | 0;
 return p[a + 36 >> 2];
}
function mt(a) {
 a = a | 0;
 return p[a + 20 >> 2];
}
function lt(a) {
 a = a | 0;
 return p[a + 28 >> 2];
}
function jq(a) {
 a = a | 0;
 return q[a + 148 | 0];
}
function Ue(a) {
 return p[a >> 2] == p[a + 4 >> 2];
}
function Rg(a) {
 ye(a);
 ye(a + 20 | 0);
 return a;
}
function Nt(a) {
 a = a | 0;
 return m[a | 0]() | 0;
}
function Gh(a, b) {
 return p[a >> 2] + v(b, 3) | 0;
}
function Fd(a) {
 p[p[a + 8 >> 2] >> 2] = p[a >> 2];
}
function Zk(a) {
 a = a | 0;
 return q[a + 12 | 0];
}
function It(a) {
 a = a | 0;
 return va(a | 0) | 0;
}
function Ef(a) {
 ia(p[a >> 2]);
 return p[a >> 2];
}
function Bg(a, b) {
 return p[a >> 2] == p[b >> 2];
}
function qe(a, b) {
 return s[a >> 2] < s[b >> 2];
}
function ib(a) {
 if (Ic(a)) {
  Ua(p[a >> 2]);
 }
}
function If(a) {
 a = a | 0;
 return w(t[a >> 2]);
}
function Ah(a, b) {
 return t[a >> 2] < t[b >> 2];
}
function on(a) {
 a = a | 0;
 ee(p[a + 20 >> 2]);
}
function ni(a, b) {
 return b >>> (a << 3) & 255;
}
function ob(a, b) {
 return (Xb(a, b) | 0) != 0;
}
function xd(a, b) {
 o[a >> 1] = r[a >> 1] | b;
}
function nq(a) {
 a = a | 0;
 cc(a + -152 | 0);
}
function kg(a) {
 n[a | 0] = 0;
 ab(a + 4 | 0);
}
function Wd(a) {
 a = a | 0;
 n[a + 4 | 0] = 1;
}
function Tk(a) {
 a = a | 0;
 return Ya(a) | 0;
}
function Lq(a) {
 a = a | 0;
 return ec(a) | 0;
}
function oc(a, b, c) {
 p[b >> 2] = p[c >> 2];
}
function hb(a, b) {
 p[a >> 2] = b;
 return a;
}
function dn(a) {
 a = a | 0;
 ee(a + -68 | 0);
}
function Xm(a) {
 a = a | 0;
 Xf(a + -52 | 0);
}
function Tc(a, b) {
 oe(a);
 sg(a + 4 | 0, b);
}
function Km(a) {
 a = a | 0;
 Uf(a + -64 | 0);
}
function ft(a) {
 a = a | 0;
 return w(w(0));
}
function ah(a, b) {
 n[a | 0] = q[a | 0] | b;
}
function _e(a) {
 return p[a + 56 >> 2] != 0;
}
function Jg(a, b) {
 return re(a, p[b >> 2]);
}
function Ja(a, b) {
 return (b << 2) + a | 0;
}
function zk(a) {
 a = a | 0;
 Cf(a);
 Ua(a);
}
function xj(a) {
 a = a | 0;
 vf(a);
 Ua(a);
}
function un(a) {
 a = a | 0;
 Cb(a, 128, 1);
}
function qi(a) {
 a = a | 0;
 nf(a);
 Ua(a);
}
function mb(a) {
 a = a | 0;
 eb(a);
 Ua(a);
}
function jg(a) {
 a = a | 0;
 pf(a);
 Ua(a);
}
function ig(a) {
 a = a | 0;
 me(a);
 Ua(a);
}
function gd(a) {
 return a + -48 >>> 0 < 10;
}
function fk(a) {
 a = a | 0;
 zf(a);
 Ua(a);
}
function dc(a) {
 a = a | 0;
 qc(a);
 Ua(a);
}
function ag(a) {
 a = a | 0;
 Zf(a);
 Ua(a);
}
function Xg(a) {
 a = a | 0;
 Ce(a);
 Ua(a);
}
function Sf(a, b, c) {
 Em(a, p[b >> 2], c);
}
function Qa(a) {
 p[a >> 2] = p[a >> 2] + 4;
}
function Fp(a) {
 a = a | 0;
 Oe(a);
 Ua(a);
}
function Ag(a, b, c) {
 Id(c);
 zg(a, b, c);
}
function yk(a) {
 a = a | 0;
 Zb(a, 11474);
}
function yj(a) {
 a = a | 0;
 Zb(a, 11958);
}
function yd(a) {
 return p[a >> 2] + 8 | 0;
}
function xk(a) {
 a = a | 0;
 Zb(a, 11479);
}
function ue(a, b) {
 p[a >> 2] = p[b >> 2];
}
function tv(a, b, c) {
 return rv(a, b, c);
}
function sv(a, b, c) {
 return qv(a, b, c);
}
function sb(a) {
 a = a | 0;
 return a | 0;
}
function qm(a) {
 a = a | 0;
 return 19398;
}
function pd(a) {
 a = a | 0;
 Cb(a, 32, 0);
}
function km(a) {
 a = a | 0;
 return 19401;
}
function jl(a) {
 a = a | 0;
 return 19571;
}
function il(a) {
 a = a | 0;
 return 19573;
}
function hl(a) {
 a = a | 0;
 return 19575;
}
function gl(a) {
 a = a | 0;
 return 19577;
}
function fm(a) {
 a = a | 0;
 return 19441;
}
function fl(a) {
 a = a | 0;
 return 19579;
}
function ek(a) {
 a = a | 0;
 Zb(a, 11548);
}
function ei(a, b) {
 return w(D(ss(a, b)));
}
function al(a) {
 a = a | 0;
 return 19582;
}
function Zj(a) {
 a = a | 0;
 Zb(a, 11593);
}
function Xl(a) {
 a = a | 0;
 return 19484;
}
function Uk(a) {
 a = a | 0;
 return 19405;
}
function Rc(a, b, c) {
 return td(a, b, c);
}
function Pa(a) {
 return gf(p[a + 4 >> 2]);
}
function Nl(a) {
 a = a | 0;
 return 19486;
}
function Jl(a) {
 a = a | 0;
 return 19403;
}
function Ii(a, b, c) {
 return zu(a, b, c);
}
function Ic(a) {
 return n[a + 11 | 0] < 0;
}
function Hl(a) {
 a = a | 0;
 return 19558;
}
function Ge(a, b) {
 a = a | 0;
 b = b | 0;
}
function Dl(a) {
 a = a | 0;
 return 19561;
}
function $l(a) {
 a = a | 0;
 return 19443;
}
function Zb(a, b) {
 tk(p[a + 8 >> 2], b);
}
function Oc(a) {
 return (ji(a) | 0) == 1;
}
function xe(a, b) {
 return Bg(a, b) ^ 1;
}
function ti(a, b) {
 n[a | 0] = q[b | 0];
}
function iu(a) {
 a = a | 0;
 m[a | 0]();
}
function Pg(a) {
 vd(a + 20 | 0);
 vd(a);
}
function yt(a) {
 a = a | 0;
 return 31;
}
function yq(a) {
 a = a | 0;
 Ua(kh(a));
}
function xh(a) {
 sc(a);
 uc(a);
 sc(a);
}
function vp(a) {
 a = a | 0;
 Ua(Wg(a));
}
function ut(a) {
 a = a | 0;
 return 27;
}
function sr(a) {
 a = a | 0;
 return 25;
}
function sp(a) {
 a = a | 0;
 Ua(Vg(a));
}
function ns(a) {
 a = a | 0;
 Ua(ci(a));
}
function ms(a) {
 a = a | 0;
 return 42;
}
function mr(a) {
 a = a | 0;
 Ua(Ch(a));
}
function mq(a) {
 a = a | 0;
 return 16;
}
function jn(a) {
 a = a | 0;
 return 26;
}
function is(a) {
 a = a | 0;
 Ua(pi(a));
}
function iq(a) {
 a = a | 0;
 Ua(Ce(a));
}
function ie(a) {
 return a >>> 16 & 255;
}
function hs(a) {
 a = a | 0;
 return 34;
}
function et(a) {
 a = a | 0;
 Ua(nf(a));
}
function el(a) {
 a = a | 0;
 return 37;
}
function dt(a) {
 a = a | 0;
 return 40;
}
function dq(a) {
 a = a | 0;
 return 51;
}
function cn(a) {
 a = a | 0;
 Ua(me(a));
}
function cf(a) {
 rc(a);
 cb(a);
 rc(a);
}
function at(a) {
 a = a | 0;
 return 10;
}
function ao(a) {
 a = a | 0;
 return 22;
}
function _r(a) {
 a = a | 0;
 return 35;
}
function _o(a) {
 a = a | 0;
 return 48;
}
function _n(a) {
 a = a | 0;
 Ua(mg(a));
}
function Zs(a) {
 a = a | 0;
 return 41;
}
function Yp(a) {
 a = a | 0;
 Ua(ch(a));
}
function Yn(a) {
 a = a | 0;
 return 17;
}
function Wr(a) {
 a = a | 0;
 return 36;
}
function Wn(a) {
 a = a | 0;
 return 24;
}
function Ve(a) {
 lb(a);
 Ph(a);
 Oh(a);
}
function Us(a) {
 a = a | 0;
 Ua(oi(a));
}
function Sr(a) {
 a = a | 0;
 Ua(Xh(a));
}
function Sn(a) {
 a = a | 0;
 return 21;
}
function Rf(a) {
 hc(a);
 ac(a);
 hc(a);
}
function Qp(a) {
 a = a | 0;
 Ua($g(a));
}
function Qn(a) {
 a = a | 0;
 return 18;
}
function Or(a) {
 a = a | 0;
 return 15;
}
function Oq(a) {
 a = a | 0;
 Ua(qc(a));
}
function Ns(a) {
 a = a | 0;
 return 43;
}
function Nn(a) {
 a = a | 0;
 return 19;
}
function Nm(a) {
 a = a | 0;
 Ua(Wf(a));
}
function Mr(a) {
 a = a | 0;
 return 12;
}
function Mp(a) {
 a = a | 0;
 return 13;
}
function Kn(a) {
 a = a | 0;
 return 20;
}
function Jm(a) {
 a = a | 0;
 return 47;
}
function Is(a) {
 a = a | 0;
 return 44;
}
function Ir(a) {
 a = a | 0;
 return 38;
}
function Ie(a) {
 tc(a);
 lb(a);
 tc(a);
}
function Id(a) {
 cb(a);
 th(a);
 Mh(a);
}
function Gt(a) {
 a = a | 0;
 return 50;
}
function Gr(a) {
 a = a | 0;
 return 11;
}
function Gn(a) {
 a = a | 0;
 return 23;
}
function Es(a) {
 a = a | 0;
 return 45;
}
function Eo(a) {
 a = a | 0;
 return 49;
}
function Dt(a) {
 a = a | 0;
 return 28;
}
function Dr(a) {
 a = a | 0;
 return 14;
}
function Dn(a) {
 a = a | 0;
 return 39;
}
function Dm(a) {
 a = a | 0;
 return 29;
}
function Ct(a) {
 a = a | 0;
 Ua(yi(a));
}
function Bn(a) {
 a = a | 0;
 return 46;
}
function Bj(a) {
 a = a | 0;
 return 30;
}
function Ap(a) {
 a = a | 0;
 return 52;
}
function uq(a) {
 a = a | 0;
 return 9;
}
function up(a) {
 a = a | 0;
 return 8;
}
function ui(a, b) {
 n[a + 11 | 0] = b;
}
function he(a) {
 return a >>> 8 & 255;
}
function cs(a) {
 a = a | 0;
 return 6;
}
function Xp(a) {
 a = a | 0;
 return 7;
}
function Wh(a) {
 a = a | 0;
 return 1;
}
function Tf(a) {
 hb(a, ra(11400) | 0);
}
function Sh(a) {
 a = a | 0;
 return 2;
}
function Rr(a) {
 a = a | 0;
 return 4;
}
function Pp(a) {
 a = a | 0;
 return 3;
}
function Oa(a) {
 return gf(p[a >> 2]);
}
function Gq(a) {
 a = a | 0;
 return 5;
}
function Gb(a) {
 return p[Db(a) >> 2];
}
function Ep(a) {
 a = a | 0;
 return 0;
}
function Bf(a) {
 return hi(Na(24), a);
}
function fe(a) {
 return a >>> 24 | 0;
}
function Ad(a) {
 return (a | 0) != 2;
}
function ud(a, b) {
 return Ro(a, b);
}
function ii(a, b) {
 return su(a, b);
}
function Ob(a, b) {
 return Uo(a, b);
}
function Ee(a) {
 return a + 176 | 0;
}
function Ed(a, b) {
 return Iq(a, b);
}
function zc(a) {
 a = a | 0;
 fg(a);
}
function ub(a) {
 return a + 16 | 0;
}
function jh(a) {
 return a + 56 | 0;
}
function ec(a) {
 return a + 88 | 0;
}
function Yb(a) {
 a = a | 0;
 Ua(a);
}
function Wa(a) {
 return a + 12 | 0;
}
function De(a) {
 a = a | 0;
 Wc(a);
}
function $h(a) {
 return a + 80 | 0;
}
function $f(a) {
 a = a | 0;
 ee(a);
}
function yh(a, b) {
 tc(a);
 tc(a);
}
function we(a, b) {
 rc(a);
 rc(a);
}
function vc(a) {
 p[a >> 2] = 3536;
}
function th(a) {
 qh(a, p[a >> 2]);
}
function sg(a, b) {
 p[a >> 2] = b;
}
function ab(a) {
 Bq(a);
 return a;
}
function Ug(a) {
 ye(a);
 return a;
}
function Ph(a) {
 wh(a, p[a >> 2]);
}
function Nh(a) {
 Yq(a, p[a >> 2]);
}
function Ma(a) {
 return a + 8 | 0;
}
function Dh(a) {
 p[a >> 2] = 3960;
}
function Db(a) {
 return a + 4 | 0;
}
function Xb(a, b) {
 return a & b;
}
function Sa(a) {
 a = a | 0;
 E();
}
function $c(a, b) {
 return a | b;
}
function ge(a) {
 return a & 255;
}
function He(a, b, c) {
 Ib(b, c);
}
function oe(a) {
 p[a >> 2] = 0;
}
function nd(a) {
 la(p[a >> 2]);
}
function ee(a) {
 Cb(a, 256, 0);
}
function _g(a) {
 fb(a + 4 | 0);
}
function Oh(a) {
 tc(a);
 lb(a);
}
function Mh(a) {
 rc(a);
 cb(a);
}
function La(a) {
 return +xs(a);
}
function Bb(a) {
 ja(p[a >> 2]);
}
function Mc(a) {
 n[a | 0] = 0;
}
function vi(a, b) {
 st(a, b);
}
function ve(a, b) {
 ue(a, b);
}
function hd(a, b) {
 hb(a, b);
}
function Zd(a, b) {
 hd(a, b);
}
function Sb(a, b) {
 As(a, b);
}
function fd() {
 Nb();
 E();
}
function Ka(a) {
 a = a | 0;
}
function Nb() {
 Y();
 E();
}
function sh(a) {
 db(a);
}
function tu() {
 E();
}

// EMSCRIPTEN_END_FUNCS

  m[1] = sb;
  m[2] = Yb;
  m[3] = Dt;
  m[4] = vt;
  m[5] = qt;
  m[6] = ov;
  m[7] = xb;
  m[8] = Ka;
  m[9] = Ka;
  m[10] = Ka;
  m[11] = Ka;
  m[12] = pi;
  m[13] = is;
  m[14] = sr;
  m[15] = nr;
  m[16] = hr;
  m[17] = Er;
  m[18] = Br;
  m[19] = Ka;
  m[20] = mg;
  m[21] = _n;
  m[22] = jn;
  m[23] = bn;
  m[24] = Zm;
  m[25] = tn;
  m[26] = sn;
  m[27] = Ka;
  m[28] = Sa;
  m[29] = Dm;
  m[30] = tm;
  m[31] = ld;
  m[32] = Pm;
  m[33] = xb;
  m[34] = Ka;
  m[35] = Ka;
  m[36] = Ka;
  m[37] = tu;
  m[38] = Yb;
  m[39] = el;
  m[40] = Wk;
  m[41] = Ok;
  m[42] = cm;
  m[43] = zl;
  m[44] = Ka;
  m[45] = Yb;
  m[46] = Bj;
  m[47] = rj;
  m[48] = gj;
  m[49] = Ak;
  m[50] = Kj;
  m[51] = Ka;
  m[52] = Yb;
  m[53] = Gt;
  m[54] = Ft;
  m[55] = Et;
  m[56] = Mt;
  m[57] = Ht;
  m[58] = Ka;
  m[59] = yi;
  m[60] = Ct;
  m[61] = yt;
  m[62] = xt;
  m[63] = wt;
  m[64] = Bt;
  m[65] = At;
  m[66] = Ka;
  m[67] = Ka;
  m[68] = Ka;
  m[69] = Ka;
  m[70] = Ka;
  m[71] = Ka;
  m[72] = Ka;
  m[73] = Ka;
  m[74] = pf;
  m[75] = Sa;
  m[76] = ut;
  m[77] = tt;
  m[78] = wi;
  m[79] = nf;
  m[80] = et;
  m[81] = dt;
  m[82] = ct;
  m[83] = si;
  m[84] = Fb;
  m[85] = it;
  m[86] = Ka;
  m[87] = Ka;
  m[88] = ke;
  m[89] = Ge;
  m[90] = je;
  m[91] = zc;
  m[92] = zc;
  m[93] = zc;
  m[94] = un;
  m[95] = bt;
  m[96] = gt;
  m[97] = ft;
  m[98] = ht;
  m[99] = ri;
  m[100] = Sa;
  m[101] = at;
  m[102] = $s;
  m[103] = wb;
  m[104] = qi;
  m[105] = Zs;
  m[106] = Ys;
  m[107] = Xs;
  m[108] = _s;
  m[109] = Ws;
  m[110] = Vs;
  m[111] = zc;
  m[112] = zc;
  m[113] = oi;
  m[114] = Us;
  m[115] = Ns;
  m[116] = Ms;
  m[117] = Ls;
  m[118] = Ts;
  m[119] = Rs;
  m[120] = Os;
  m[121] = Ss;
  m[122] = Ka;
  m[123] = Ka;
  m[124] = Ka;
  m[125] = Ka;
  m[126] = Ka;
  m[127] = Ka;
  m[128] = eb;
  m[129] = mb;
  m[130] = Is;
  m[131] = Hs;
  m[132] = Gs;
  m[133] = Ks;
  m[134] = Js;
  m[135] = Ka;
  m[136] = Ge;
  m[137] = Ka;
  m[138] = Ka;
  m[139] = Ka;
  m[140] = Ka;
  m[141] = Ka;
  m[142] = Ka;
  m[143] = Ka;
  m[144] = mb;
  m[145] = Es;
  m[146] = Ds;
  m[147] = mi;
  m[148] = Fs;
  m[149] = xb;
  m[150] = Ka;
  m[151] = Ka;
  m[152] = ci;
  m[153] = ns;
  m[154] = ms;
  m[155] = ls;
  m[156] = ks;
  m[157] = qs;
  m[158] = rs;
  m[159] = ps;
  m[160] = os;
  m[161] = Ka;
  m[162] = Ka;
  m[163] = Ka;
  m[164] = mb;
  m[165] = hs;
  m[166] = gs;
  m[167] = fs;
  m[168] = sq;
  m[169] = xb;
  m[170] = Yh;
  m[171] = Yh;
  m[172] = Xr;
  m[173] = bi;
  m[174] = js;
  m[175] = bf;
  m[176] = af;
  m[177] = $e;
  m[178] = mb;
  m[179] = cs;
  m[180] = bs;
  m[181] = as;
  m[182] = es;
  m[183] = ds;
  m[184] = af;
  m[185] = af;
  m[186] = $e;
  m[187] = $e;
  m[188] = mb;
  m[189] = _r;
  m[190] = Zr;
  m[191] = Yr;
  m[192] = bi;
  m[193] = $r;
  m[194] = bf;
  m[195] = bf;
  m[196] = Sa;
  m[197] = Wr;
  m[198] = Vr;
  m[199] = _c;
  m[200] = Xh;
  m[201] = Sr;
  m[202] = Rr;
  m[203] = Qr;
  m[204] = Ye;
  m[205] = Nq;
  m[206] = Mq;
  m[207] = rh;
  m[208] = Kq;
  m[209] = Tr;
  m[210] = Bi;
  m[211] = Pr;
  m[212] = zc;
  m[213] = zc;
  m[214] = Lq;
  m[215] = oh;
  m[216] = Wh;
  m[217] = cc;
  m[218] = cc;
  m[219] = Ka;
  m[220] = Ka;
  m[221] = qc;
  m[222] = dc;
  m[223] = Gc;
  m[224] = dc;
  m[225] = Or;
  m[226] = Nr;
  m[227] = Ka;
  m[228] = Ka;
  m[229] = mb;
  m[230] = Mr;
  m[231] = Lr;
  m[232] = Jd;
  m[233] = rd;
  m[234] = mb;
  m[235] = Sh;
  m[236] = Jr;
  m[237] = Ka;
  m[238] = Ka;
  m[239] = Sa;
  m[240] = Ir;
  m[241] = Hr;
  m[242] = mf;
  m[243] = Ka;
  m[244] = Ka;
  m[245] = Ka;
  m[246] = Ka;
  m[247] = Sa;
  m[248] = Gr;
  m[249] = Fr;
  m[250] = Sa;
  m[251] = Sa;
  m[252] = Sa;
  m[253] = Ka;
  m[254] = Ka;
  m[255] = Ka;
  m[256] = Ka;
  m[257] = mb;
  m[258] = De;
  m[259] = De;
  m[260] = ih;
  m[261] = Sa;
  m[262] = Dr;
  m[263] = Cr;
  m[264] = Ka;
  m[265] = Ka;
  m[266] = Ch;
  m[267] = mr;
  m[268] = kr;
  m[269] = er;
  m[270] = lr;
  m[271] = jr;
  m[272] = ir;
  m[273] = gr;
  m[274] = fr;
  m[275] = dr;
  m[276] = Oe;
  m[277] = Sa;
  m[278] = Qh;
  m[279] = Lh;
  m[280] = Kh;
  m[281] = Jh;
  m[282] = Ih;
  m[283] = Hh;
  m[284] = sb;
  m[285] = Sa;
  m[286] = dc;
  m[287] = Oq;
  m[288] = mb;
  m[289] = Gq;
  m[290] = Fq;
  m[291] = Eq;
  m[292] = Ka;
  m[293] = kh;
  m[294] = yq;
  m[295] = uq;
  m[296] = tq;
  m[297] = xq;
  m[298] = wq;
  m[299] = vq;
  m[300] = mb;
  m[301] = dc;
  m[302] = mq;
  m[303] = lq;
  m[304] = kq;
  m[305] = rq;
  m[306] = pq;
  m[307] = qq;
  m[308] = oq;
  m[309] = jq;
  m[310] = Ka;
  m[311] = cc;
  m[312] = nq;
  m[313] = Ce;
  m[314] = iq;
  m[315] = dq;
  m[316] = cq;
  m[317] = eh;
  m[318] = fh;
  m[319] = cc;
  m[320] = cc;
  m[321] = fq;
  m[322] = eq;
  m[323] = dc;
  m[324] = Ka;
  m[325] = Ka;
  m[326] = ch;
  m[327] = Yp;
  m[328] = Xp;
  m[329] = Wp;
  m[330] = Vp;
  m[331] = Zp;
  m[332] = cc;
  m[333] = dc;
  m[334] = Ka;
  m[335] = $g;
  m[336] = Qp;
  m[337] = Pp;
  m[338] = Op;
  m[339] = Np;
  m[340] = Rp;
  m[341] = Tp;
  m[342] = Ka;
  m[343] = Sp;
  m[344] = Zg;
  m[345] = Sa;
  m[346] = Mp;
  m[347] = Lp;
  m[348] = Fp;
  m[349] = Ge;
  m[350] = Ep;
  m[351] = Xg;
  m[352] = Ap;
  m[353] = zp;
  m[354] = yp;
  m[355] = Bp;
  m[356] = Dp;
  m[357] = Cp;
  m[358] = cc;
  m[359] = Xg;
  m[360] = Ka;
  m[361] = mb;
  m[362] = De;
  m[363] = Wg;
  m[364] = vp;
  m[365] = up;
  m[366] = tp;
  m[367] = wp;
  m[368] = dc;
  m[369] = Vg;
  m[370] = sp;
  m[371] = Wh;
  m[372] = ap;
  m[373] = $o;
  m[374] = xb;
  m[375] = gp;
  m[376] = fp;
  m[377] = Ka;
  m[378] = Ka;
  m[379] = Ka;
  m[380] = Ka;
  m[381] = Ka;
  m[382] = Ka;
  m[383] = Mg;
  m[384] = ip;
  m[385] = Sa;
  m[386] = _o;
  m[387] = Zo;
  m[388] = Yo;
  m[389] = Ka;
  m[390] = Ka;
  m[391] = Sa;
  m[392] = mb;
  m[393] = Eo;
  m[394] = Do;
  m[395] = Co;
  m[396] = Go;
  m[397] = xb;
  m[398] = Fo;
  m[399] = mb;
  m[400] = Bo;
  m[401] = xb;
  m[402] = Ao;
  m[403] = Sa;
  m[404] = Sa;
  m[405] = Sa;
  m[406] = Sa;
  m[407] = jg;
  m[408] = xb;
  m[409] = xb;
  m[410] = Sa;
  m[411] = Sa;
  m[412] = Sa;
  m[413] = jg;
  m[414] = Sa;
  m[415] = ao;
  m[416] = $n;
  m[417] = Zn;
  m[418] = Ka;
  m[419] = Ka;
  m[420] = Ka;
  m[421] = Ka;
  m[422] = Ka;
  m[423] = me;
  m[424] = ig;
  m[425] = Yn;
  m[426] = Xn;
  m[427] = mn;
  m[428] = xb;
  m[429] = ln;
  m[430] = hn;
  m[431] = pd;
  m[432] = pd;
  m[433] = pd;
  m[434] = pd;
  m[435] = $f;
  m[436] = $f;
  m[437] = en;
  m[438] = dn;
  m[439] = Zf;
  m[440] = Sa;
  m[441] = Wn;
  m[442] = Vn;
  m[443] = Un;
  m[444] = _m;
  m[445] = Ka;
  m[446] = ae;
  m[447] = Ka;
  m[448] = Ka;
  m[449] = Ka;
  m[450] = Ka;
  m[451] = Sa;
  m[452] = Sn;
  m[453] = Rn;
  m[454] = le;
  m[455] = Sa;
  m[456] = Qn;
  m[457] = Pn;
  m[458] = On;
  m[459] = Ka;
  m[460] = Sa;
  m[461] = Nn;
  m[462] = Mn;
  m[463] = Ln;
  m[464] = Ka;
  m[465] = Ka;
  m[466] = Sa;
  m[467] = Kn;
  m[468] = Jn;
  m[469] = In;
  m[470] = Ka;
  m[471] = Sa;
  m[472] = mb;
  m[473] = Sa;
  m[474] = Ka;
  m[475] = Ka;
  m[476] = Ka;
  m[477] = dc;
  m[478] = Sa;
  m[479] = Ka;
  m[480] = Ka;
  m[481] = Sa;
  m[482] = Sa;
  m[483] = Sa;
  m[484] = Ka;
  m[485] = Sa;
  m[486] = Yb;
  m[487] = Gn;
  m[488] = Fn;
  m[489] = En;
  m[490] = xb;
  m[491] = xb;
  m[492] = Sa;
  m[493] = Sa;
  m[494] = Sa;
  m[495] = Ka;
  m[496] = Sa;
  m[497] = Dn;
  m[498] = Cn;
  m[499] = Sa;
  m[500] = qi;
  m[501] = Ka;
  m[502] = Ka;
  m[503] = Sa;
  m[504] = Sa;
  m[505] = mb;
  m[506] = Bn;
  m[507] = An;
  m[508] = zn;
  m[509] = Ka;
  m[510] = Ka;
  m[511] = Ka;
  m[512] = Ka;
  m[513] = mb;
  m[514] = mb;
  m[515] = Sa;
  m[516] = ag;
  m[517] = rn;
  m[518] = Sh;
  m[519] = qn;
  m[520] = mb;
  m[521] = pn;
  m[522] = xb;
  m[523] = on;
  m[524] = nn;
  m[525] = gn;
  m[526] = cn;
  m[527] = ig;
  m[528] = xb;
  m[529] = $m;
  m[530] = Sa;
  m[531] = mb;
  m[532] = Ym;
  m[533] = xb;
  m[534] = Wm;
  m[535] = Xf;
  m[536] = Xm;
  m[537] = ag;
  m[538] = Um;
  m[539] = Vm;
  m[540] = Tm;
  m[541] = Sm;
  m[542] = Rm;
  m[543] = Qm;
  m[544] = Wf;
  m[545] = Nm;
  m[546] = Jm;
  m[547] = Im;
  m[548] = Hm;
  m[549] = Mm;
  m[550] = od;
  m[551] = od;
  m[552] = od;
  m[553] = od;
  m[554] = Vf;
  m[555] = Uf;
  m[556] = Lm;
  m[557] = Km;
  m[558] = Sa;
  m[559] = Ka;
  m[560] = Ka;
  m[561] = Ka;
  m[562] = Ka;
  m[563] = Bm;
  m[564] = qm;
  m[565] = Mb;
  m[566] = mm;
  m[567] = km;
  m[568] = Mb;
  m[569] = kd;
  m[570] = im;
  m[571] = hm;
  m[572] = gm;
  m[573] = fm;
  m[574] = Mb;
  m[575] = $l;
  m[576] = Mb;
  m[577] = kd;
  m[578] = Zl;
  m[579] = Yl;
  m[580] = Xl;
  m[581] = Kf;
  m[582] = Nl;
  m[583] = Kf;
  m[584] = kd;
  m[585] = Ll;
  m[586] = Kl;
  m[587] = Jl;
  m[588] = Yb;
  m[589] = If;
  m[590] = $b;
  m[591] = kf;
  m[592] = dm;
  m[593] = Kr;
  m[594] = Dk;
  m[595] = yn;
  m[596] = Hl;
  m[597] = Gl;
  m[598] = mo;
  m[599] = lo;
  m[600] = Dl;
  m[601] = Mb;
  m[602] = dp;
  m[603] = cp;
  m[604] = Al;
  m[605] = xl;
  m[606] = vl;
  m[607] = tl;
  m[608] = rl;
  m[609] = pl;
  m[610] = ml;
  m[611] = bp;
  m[612] = kl;
  m[613] = jl;
  m[614] = Mb;
  m[615] = nu;
  m[616] = zb;
  m[617] = $b;
  m[618] = Nc;
  m[619] = fu;
  m[620] = Xi;
  m[621] = qu;
  m[622] = Ab;
  m[623] = il;
  m[624] = Mb;
  m[625] = Sd;
  m[626] = $b;
  m[627] = Nc;
  m[628] = Li;
  m[629] = hl;
  m[630] = Mb;
  m[631] = Bi;
  m[632] = Sd;
  m[633] = $b;
  m[634] = Nc;
  m[635] = gl;
  m[636] = Mb;
  m[637] = Hi;
  m[638] = $b;
  m[639] = Nc;
  m[640] = Fi;
  m[641] = fl;
  m[642] = Mb;
  m[643] = kc;
  m[644] = dl;
  m[645] = mt;
  m[646] = cl;
  m[647] = ol;
  m[648] = pt;
  m[649] = nt;
  m[650] = lt;
  m[651] = sk;
  m[652] = $b;
  m[653] = xi;
  m[654] = al;
  m[655] = Yb;
  m[656] = $k;
  m[657] = kf;
  m[658] = kt;
  m[659] = $b;
  m[660] = Nc;
  m[661] = Zk;
  m[662] = bj;
  m[663] = ot;
  m[664] = Xk;
  m[665] = Uk;
  m[666] = Yb;
  m[667] = If;
  m[668] = $b;
  m[669] = kf;
  m[670] = Tk;
  m[671] = kd;
  m[672] = Xd;
  m[673] = Rb;
  m[674] = Df;
  m[675] = Rb;
  m[676] = Ck;
  m[677] = sb;
  m[678] = sb;
  m[679] = Wd;
  m[680] = Vd;
  m[681] = Xd;
  m[682] = Df;
  m[683] = Rb;
  m[684] = ik;
  m[685] = hk;
  m[686] = sb;
  m[687] = sb;
  m[688] = Wd;
  m[689] = Vd;
  m[690] = Rb;
  m[691] = Rb;
  m[692] = Nc;
  m[693] = Rb;
  m[694] = Rb;
  m[695] = Rb;
  m[696] = Lj;
  m[697] = xf;
  m[698] = Xd;
  m[699] = sb;
  m[700] = sb;
  m[701] = Wd;
  m[702] = Vd;
  m[703] = Lc;
  m[704] = bj;
  m[705] = aj;
  m[706] = Rb;
  m[707] = Lc;
  m[708] = Lc;
  m[709] = Lc;
  m[710] = Lc;
  m[711] = Zi;
  m[712] = nv;
  m[713] = cl;
  m[714] = sb;
  m[715] = sb;
  m[716] = sb;
  m[717] = sb;
  m[718] = sb;
  m[719] = sb;
  m[720] = lv;
  m[721] = kv;
  m[722] = jv;
  m[723] = xf;
  m[724] = Sk;
  m[725] = Yb;
  m[726] = Rk;
  m[727] = Qk;
  m[728] = Cf;
  m[729] = zk;
  m[730] = yk;
  m[731] = xk;
  m[732] = wk;
  m[733] = vk;
  m[734] = uk;
  m[735] = Sa;
  m[736] = sb;
  m[737] = Sa;
  m[738] = zf;
  m[739] = fk;
  m[740] = ek;
  m[741] = dk;
  m[742] = ck;
  m[743] = ak;
  m[744] = $j;
  m[745] = _j;
  m[746] = Zj;
  m[747] = sb;
  m[748] = Yj;
  m[749] = Sa;
  m[750] = Sa;
  m[751] = Ij;
  m[752] = Hj;
  m[753] = Gj;
  m[754] = Fj;
  m[755] = Ej;
  m[756] = Dj;
  m[757] = Cj;
  m[758] = Aj;
  m[759] = zj;
  m[760] = yj;
  m[761] = vf;
  m[762] = xj;
  m[763] = Sa;
  m[764] = sb;
  m[765] = Sa;
  m[766] = Tu;
  m[767] = Pu;
  m[768] = Ou;
  m[769] = Qu;
  m[770] = Lu;
  m[771] = Ku;
  m[772] = Hu;
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
   "N": pv,
   "O": Qd,
   "P": iv,
   "Q": Yi,
   "R": Ua,
   "S": mu,
   "T": lu,
   "U": ku,
   "V": ju,
   "W": iu,
   "X": hu,
   "Y": gu,
   "Z": eu,
   "_": du,
   "$": cu,
   "aa": bu,
   "ba": au,
   "ca": $t,
   "da": _t,
   "ea": Zt,
   "fa": Yt,
   "ga": Xt,
   "ha": Wt,
   "ia": Vt,
   "ja": Ut,
   "ka": Tt,
   "la": St,
   "ma": Rt,
   "na": Qt,
   "oa": Pt,
   "pa": Ot,
   "qa": Nt,
   "ra": Lt,
   "sa": Jt,
   "ta": Kt,
   "ua": It
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
 Da(Aa, 1032, "AQAAAAIAAAADAAAABAAAAAUAAAAGAAAABwAAAAgAAAAJAAAACgAAAAs=");
 Da(Aa, 1084, "DAAAAA0AAAAOAAAADwAAABAAAAARAAAAEgAAABMAAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 1192, "FAAAABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 1300, "AQAAABwAAAAdAAAAHgAAAB8AAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAl");
 Da(Aa, 1356, "AQAAACYAAAAnAAAAKAAAACkAAAAgAAAAIQAAACIAAAAjAAAAJAAAACoAAAArAAAALA==");
 Da(Aa, 1416, "AQAAAC0AAAAuAAAALwAAADAAAAAgAAAAIQAAACIAAAAjAAAAJAAAADEAAAAyAAAAMw==");
 Da(Aa, 1476, "AQAAADQAAAA1AAAANgAAADcAAAAgAAAAIQAAACIAAAAjAAAAJAAAADgAAAA5AAAAOg==");
 Da(Aa, 1536, "OwAAADwAAAA9AAAAPgAAAD8AAABAAAAAQQAAAEIAAABDAAAARAAAAEUAAABGAAAARwAAAEgAAABJ");
 Da(Aa, 1604, "SgAAAEsAAABMAAAATQAAAE4AAAAlAAAAJQAAAEIAAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 1712, "TwAAAFAAAABRAAAAUgAAAFMAAABUAAAAVQAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAABgAAAAYQAAAGI=");
 Da(Aa, 1800, "YwAAAGQAAABlAAAAZgAAAGcAAAAlAAAAJQAAAFYAAABXAAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 1912, "TwAAAGgAAABpAAAAagAAAGsAAABUAAAAbAAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAABtAAAAbgAAAGIAAABvAAAAcA==");
 Da(Aa, 2008, "cQAAAHIAAABzAAAAdAAAAHUAAABUAAAAdgAAAFYAAABXAAAAdwAAAHgAAAB5AAAAegAAAHsAAAB8AAAAfQAAAH4AAAB/AAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 2156, "gAAAAIEAAACCAAAAgwAAAIQAAACFAAAAhgAAAFYAAABXAAAAhwAAAFkAAACIAAAAiQAAAIoAAACLAAAAjAAAAI0AAACOAAAAjw==");
 Da(Aa, 2240, "gAAAAJAAAACRAAAAkgAAAJMAAACUAAAAlQAAAFYAAABXAAAAhwAAAFkAAACIAAAAlgAAAJcAAAAAAIA/");
 Da(Aa, 2310, "gD8=");
 Da(Aa, 2328, "mAAAAJkAAACaAAAAmwAAAJwAAACdAAAAngAAAFYAAABXAAAAnwAAAFkAAACgAAAAoQAAAKIAAACjAAAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQ==");
 Da(Aa, 2464, "gAAAAKQAAAClAAAApgAAAKcAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAArQAAAK4AAACvAAAAsAAAALE=");
 Da(Aa, 2552, "gAAAALIAAACzAAAAtAAAALUAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAAtgAAALcAAAC4AAAAuQAAALoAAAC7");
 Da(Aa, 2644, "gAAAALwAAAC9AAAAvgAAAL8AAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAAwAAAAMEAAADCAAAAww==");
 Da(Aa, 2728, "gAAAAMQAAADFAAAAxgAAAMcAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAAJQAAACU=");
 Da(Aa, 2804, "yAAAAMkAAADKAAAAywAAAMwAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADRAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3A==");
 Da(Aa, 2924, "3QAAAN4AAADKAAAAywAAAMwAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3A==");
 Da(Aa, 3044, "3QAAAOAAAADhAAAA4gAAAMwAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA4wAAAOQAAADbAAAA3A==");
 Da(Aa, 3164, "gAAAAOUAAADmAAAA5wAAAOgAAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADV");
 Da(Aa, 3256, "gAAAAOoAAADrAAAA7AAAAOgAAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAAO0AAADu");
 Da(Aa, 3348, "gAAAAO8AAADwAAAA8QAAAPIAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAA8wAAAPQAAAD1AAAA9g==");
 Da(Aa, 3420, "gAAAAPcAAAD4AAAA+QAAAGcAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACI");
 Da(Aa, 3476, "gAAAAPoAAAD4AAAA+QAAAGcAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACI");
 Da(Aa, 3536, "AQAAAPsAAAAlAAAAJQAAACUAAAAlAAAAJQ==");
 Da(Aa, 3572, "gAAAAPwAAACzAAAAtAAAALUAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAAJQAAACUAAAD9AAAA/gAAAP8AAAAAAQ==");
 Da(Aa, 3664, "gAAAAAEBAADFAAAAxgAAAMcAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAAgEAAAMBAAAEAQ==");
 Da(Aa, 3732, "gAAAAAUBAAAGAQAABwEAAMcAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAACAEAAAkB");
 Da(Aa, 3796, "CgEAAAsBAAAMAQAADQEAAA4BAAAPAQAAEAEAABEBAAASAQAAEwE=");
 Da(Aa, 3844, "FAEAABUBAAAWAQAAJQAAABcBAAAYAQAAGQEAABoBAAAbAQAAJQAAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 3960, "HAEAAB0BAAAlAAAAJQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQ==");
 Da(Aa, 4008, "3QAAAB4BAADhAAAA4gAAAMwAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3A==");
 Da(Aa, 4128, "3QAAAB8BAADmAAAA5wAAAOgAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADY");
 Da(Aa, 4232, "gAAAACABAAAhAQAAIgEAACMBAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAAgEAAAMBAAAEAQAAJAEAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 4372, "JQEAACYBAAAnAQAAKAEAAGcAAABUAAAAKQEAAFYAAABXAAAAKgEAAFkAAAArAQ==");
 Da(Aa, 4428, "gAAAACwBAAAGAQAABwEAAMcAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAAgEAAAMBAAAEAQ==");
 Da(Aa, 4496, "3QAAAC0BAAAuAQAALwEAADABAADNAAAAzgAAAFYAAABXAAAAMQEAANAAAAAyAQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAAMwEAADQBAAA1AQAANgEAADcBAABo////AAAAADgB");
 Da(Aa, 4620, "OQEAADoBAAA7AQAAPAEAAD0BAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAAA+AQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3AAAAD8BAABAAQAAQQEAAEIB");
 Da(Aa, 4756, "3QAAAEMBAAA7AQAAPAEAAD0BAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3AAAAEQBAABFAQ==");
 Da(Aa, 4884, "RgEAAEcBAABIAQAASQEAAEoBAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAABLAQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3AAAAEwB");
 Da(Aa, 5008, "3QAAAE0BAABIAQAASQEAAEoBAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3AAAAE4B");
 Da(Aa, 5132, "TwEAAFABAABRAQAAUgEAAFMBAABUAAAA6QAAAFYAAABXAAAAVAEAAFkAAABVAQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAAVgEAAFcB");
 Da(Aa, 5232, "WAEAAFkBAABaAQAAWwEAAFMBAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAAVgEAACUAAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 5400, "FAEAAFwBAAAWAQAAXQEAABcBAAAYAQAAGQEAABoBAAAbAQAAXgEAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 5516, "OQEAAF8BAABgAQAAYQEAAGIBAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAABjAQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3AAAAD8BAABAAQAAZAEAAGUBAABmAQ==");
 Da(Aa, 5656, "OQEAAGcBAABgAQAAYQEAAGIBAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAAA+AQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3AAAAD8BAABAAQAAQQEAAEIBAABoAQ==");
 Da(Aa, 5796, "gAAAAGkBAAAhAQAAIgEAACMBAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAAgEAAAMBAAAEAQAAagE=");
 Da(Aa, 5868, "awEAAGwBAABtAQAAbgEAAMwAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAABvAQAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3A==");
 Da(Aa, 5988, "3QAAAHABAABtAQAAbgEAAMwAAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAA2QAAANoAAADbAAAA3A==");
 Da(Aa, 6108, "cQEAAHIBAABzAQAAdAEAAHUBAABUAAAAdgEAAFYAAABXAAAAhwAAAHcBAAB4AQAAeQEAAHoBAAB7AQAAfAEAAH0BAAB+AQAAfwEAALj///8AAAAAgAEAAEFydGJvYXJkOjppbml0aWFsaXplIC0gRHJhdyBydWxlIHRhcmdldHMgbWlzc2luZyBjb21wb25lbnQgd2lkdGggaWQgJWQK");
 Da(Aa, 6276, "gAAAAIEBAACCAQAAgwEAAIQBAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAhQEAAIYBAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXpl");
 Da(Aa, 6412, "gAAAAIcBAABlAAAAZgAAAGcAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAARGVwZW5kZW5jeSBjeWNsZSEKAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 6556, "gAAAAIgBAACJAQAAigEAAIsBAACMAQAAjQEAAFYAAABXAAAAhwAAAFkAAACIAAAAjgE=");
 Da(Aa, 6616, "gAAAAI8BAACCAQAAgwEAAIQBAACQAQAAkQEAAFYAAABXAAAAhwAAAFkAAACIAAAAhQEAAJIBAABhbGxvY2F0b3I8VD46OmFsbG9jYXRlKHNpemVfdCBuKSAnbicgZXhjZWVkcyBtYXhpbXVtIHN1cHBvcnRlZCBzaXplAEJhZCBoZWFkZXIKAFVuc3VwcG9ydGVkIHZlcnNpb24gJXUuJXUgZXhwZWN0ZWQgJXUuJXUuCgBFeHBlY3RlZCBmaXJzdCBvYmplY3QgdG8gYmUgdGhlIGJhY2tib2FyZC4KAEFydGJvYXJkcyBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIG9iamVjdCAodGhlbXNlbHZlcykuCgBGb3VuZCBub24tYXJ0Ym9hcmQgaW4gYXJ0Ym9hcmQgbGlzdC4KAFJJVkUAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQAAVW5rbm93biBwcm9wZXJ0eSBrZXkgJWxsdSwgbWlzc2luZyBmcm9tIHByb3BlcnR5IFRvQy4KAEV4cGVjdGVkIG9iamVjdCBvZiB0eXBlICVkIGJ1dCBmb3VuZCAlbGx1LCB3aGljaCB0aGlzIHJ1bnRpbWUgZG9lc24ndCB1bmRlcnN0YW5kLgoARXhwZWN0ZWQgb2JqZWN0IG9mIHR5cGUgJWQgYnV0IGZvdW5kICVkLgo=");
 Da(Aa, 7200, "AQAAAJMBAAAOAAAADwAAABAAAAAlAAAAJQAAABM=");
 Da(Aa, 7240, "AQAAAJQBAAAWAAAAFwAAABgAAAAlAAAAJQAAABs=");
 Da(Aa, 7280, "AQAAAJUBAAA1AAAANgAAADcAAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAlAAAAOg==");
 Da(Aa, 7340, "AQAAAJYBAAAdAAAAHgAAAB8AAAAlAAAAJQAAACIAAAAjAAAAJA==");
 Da(Aa, 7388, "SgAAAJcBAABMAAAATQAAAE4AAACYAQAAmQEAAEI=");
 Da(Aa, 7428, "AQAAAJoBAAADAAAABAAAAAUAAAAlAAAAJQAAAAgAAAAJAAAACgAAAAs=");
 Da(Aa, 7480, "AQAAAJsBAAAuAAAALwAAADAAAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAlAAAAMw==");
 Da(Aa, 7540, "AQAAAJwBAAAnAAAAKAAAACkAAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAAlAAAALA==");
 Da(Aa, 7600, "SgAAAJ0BAAA9AAAAPgAAAD8AAACYAQAAmQEAAEIAAABDAAAARAAAAEUAAABGAAAARwAAAEgAAABJ");
 Da(Aa, 7668, "gAAAAJ4BAACfAQAAoAEAAKEBAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAogEAAKMBAACkAQAApQEAAKYB");
 Da(Aa, 7744, "JQ==");
 Da(Aa, 7756, "pwEAAKgBAACpAQAAqgEAAKEBAACrAQAArAEAAFYAAABXAAAArQEAAFkAAACuAQAArwEAALABAACxAQAAsgEAALMBAAC0AQAAtQEAALz///8AAAAAtgE=");
 Da(Aa, 7852, "twEAALgBAAC5AQAAugEAALsBAABUAAAAvAEAAFYAAABXAAAAhwAAAFkAAACIAAAAvQEAAL4BAAAlAAAAJQAAAL8BAADAAQAAwQEAAMIB");
 Da(Aa, 7940, "gAAAAMMBAADEAQAAxQEAAMYBAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAvQE=");
 Da(Aa, 8e3, "gAAAAMcBAADIAQAAyQEAAMoBAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAywE=");
 Da(Aa, 8060, "gAAAAMwBAADNAQAAzgEAAM8BAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAA0AEAANEB");
 Da(Aa, 8124, "twEAANIBAADTAQAA1AEAANUBAABUAAAAvAEAAFYAAABXAAAAhwAAAFkAAACIAAAAvQEAAL4BAAAlAAAAJQAAANYB");
 Da(Aa, 8200, "WAEAANcBAABRAQAAUgEAAFMBAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAAVgEAACU=");
 Da(Aa, 8300, "gAAAANgBAABaAQAAWwEAAFMBAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAAVgE=");
 Da(Aa, 8396, "gAAAANkBAAClAAAApgAAAKcAAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAAJQAAACUAAADaAQAA2wEAANwB");
 Da(Aa, 8484, "3QAAAN0BAAAuAQAALwEAADABAADNAAAAzgAAAFYAAABXAAAAzwAAANAAAADfAAAAWwAAAFwAAABdAAAAXgAAAF8AAADSAAAA0wAAANQAAADVAAAA1gAAANcAAADYAAAANgE=");
 Da(Aa, 8592, "JQ==");
 Da(Aa, 8604, "gAAAAN4BAAC9AAAAvgAAAL8AAACoAAAAqQAAAFYAAABXAAAAhwAAAFkAAACIAAAAqgAAAKsAAACsAAAAJQAAACUAAADfAQAA4AE=");
 Da(Aa, 8688, "gAAAAOEBAACaAAAAmwAAAJwAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAoQAAAKIAAACj");
 Da(Aa, 8756, "gAAAAOIBAAAnAQAAKAEAAGcAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACI");
 Da(Aa, 8812, "gAAAAOMBAACJAQAAigEAAIsBAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAA5AE=");
 Da(Aa, 8872, "gAAAAOUBAABzAQAAdAEAAHUBAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAeQEAAHoBAAB7AQAAfAEAAH0BAAB+AQ==");
 Da(Aa, 8952, "JQ==");
 Da(Aa, 8964, "AQAAAOYBAADnAQAA6AEAAOkBAADqAQAA6wE=");
 Da(Aa, 9e3, "AQAAAOwBAADnAQAA6AEAAOkBAAAlAAAAJQ==");
 Da(Aa, 9036, "gAAAAO0BAACRAAAAkgAAAJMAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAlgAAAJc=");
 Da(Aa, 9100, "gAAAAO4BAABRAAAAUgAAAFMAAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAAAlAAAAJQAAAO8B");
 Da(Aa, 9188, "gAAAAPABAADxAQAA8gEAAPIAAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAAAlAAAAJQ==");
 Da(Aa, 9272, "gAAAAPMBAADxAQAA8gEAAPIAAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAAAlAAAAJQ==");
 Da(Aa, 9356, "TwAAAPQBAABpAAAAagAAAGsAAABUAAAAVQAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAABtAAAAbgAAAGIAAAD1AQAA9gE=");
 Da(Aa, 9452, "gAAAAPcBAABzAAAAdAAAAHUAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAegAAAHsAAAB8AAAAfQAAAH4AAAB/");
 Da(Aa, 9532, "gAAAAPgBAACCAAAAgwAAAIQAAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAAiQAAAIoAAACLAAAAjAAAAI0AAACOAAAAjw==");
 Da(Aa, 9616, "gAAAAPkBAAD6AQAA+wEAAPwBAACUAAAAlQAAAFYAAABXAAAAhwAAAFkAAACIAAAAlgAAAJcAAAD9AQAA/gEAAP8BAAAAAg==");
 Da(Aa, 9696, "gAAAAAECAAD6AQAA+wEAAPwBAACUAAAAlQAAAFYAAABXAAAAhwAAAFkAAACIAAAAlgAAAJcAAAD9AQAA/gEAAP8BAAAAAgAARXhwZWN0ZWQgYSBDb3JlIG9iamVjdCBidXQgZm91bmQgJWxsdSwgd2hpY2ggdGhpcyBydW50aW1lIGRvZXNuJ3QgdW5kZXJzdGFuZC4KAAABAAAAAAAAAP////8CAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAD/////AgAAAAIAAAD/////AAAAAAIAAAACAAAAAgAAAP////////////////////8CAAAAAAAAAAIAAAACAAAAAgAAAP////8DAAAAAwAAAAI=");
 Da(Aa, 1e4, "AgAAAP///////////////wIAAAAC");
 Da(Aa, 10040, "/////wAAAAD/////AQ==");
 Da(Aa, 10064, "Ag==");
 Da(Aa, 10084, "AgAAAAIAAAACAAAAAg==");
 Da(Aa, 10112, "AgAAAP//////////////////////////////////////////AgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAwAAAAIAAAACAAAAAg==");
 Da(Aa, 10216, "AgAAAAIAAAACAAAAAgAAAAIAAAAC");
 Da(Aa, 10248, "AgAAAAIAAAACAAAAAgAAAAIAAAAC");
 Da(Aa, 10288, "AgAAAAIAAAACAAAAAAAAAP////8=");
 Da(Aa, 10324, "AgAAAAIAAAAAAIC/AACAvwAAAAAAAIC/AACAPwAAgL8AAIC/");
 Da(Aa, 10374, "gD8AAAAAAACAvwAAgD8AAAAAAACAPwAAgD8AAIA/AAAAAAAAAACAAAAAAgIAAOsAAADsAAAA6AAAAFQAAADpAAAAVgAAAFcAAABYAAAAWQAAAFoAAABbAAAAXAAAAF0AAABeAAAAXwAAANIAAADTAAAA1AAAANU=");
 Da(Aa, 10504, "gAAAAAMCAADwAAAA8QAAAPIAAABUAAAA6QAAAFYAAABXAAAAWAAAAFkAAABaAAAAWwAAAFwAAABdAAAAXgAAAF8AAAAlAAAAJQ==");
 Da(Aa, 10588, "twEAAAQCAADTAQAA1AEAANUBAABUAAAAvAEAAFYAAABXAAAAhwAAAFkAAACIAAAAvQEAAAUCAAAGAgAABwIAANYB");
 Da(Aa, 10664, "gAAAAAgCAADNAQAAzgEAAM8BAAAJAgAACgIAAFYAAABXAAAAhwAAAFkAAACIAAAACwIAAAwC");
 Da(Aa, 10728, "pwEAAA4CAACfAQAAoAEAAKEBAACrAQAArAEAAFYAAABXAAAArQEAAFkAAACuAQAArwEAALABAACxAQAAsgEAALMBAAC0AQAAtQEAALz///8AAAAAtgEAAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemU=");
 Da(Aa, 10892, "pwEAAA8CAACpAQAAqgEAAKEBAACrAQAAEAIAAFYAAABXAAAArQEAAFkAAACuAQAArwEAALABAACxAQAAsgEAALMBAAC0AQAAEQIAALz///8AAAAAtgE=");
 Da(Aa, 10988, "twEAABICAADEAQAAxQEAAMYBAABUAAAAvAEAAFYAAABXAAAAhwAAAFkAAACIAAAAvQEAAL4BAAAlAAAAJQ==");
 Da(Aa, 11060, "gAAAABMCAADIAQAAyQEAAMoBAAAUAgAAFQIAAFYAAABXAAAAhwAAAFkAAACIAAAAFgIAABcCAADM////AAAAABgC");
 Da(Aa, 11136, "twEAABkCAAC5AQAAugEAALsBAABUAAAAvAEAAFYAAABXAAAAhwAAAFkAAACIAAAAvQEAABoCAAAbAgAAHAIAAB0CAAAeAgAAHwIAAMIB");
 Da(Aa, 11224, "IAIAACECAAAiAgAAIwIAACQCAABUAAAAJQIAAFYAAABXAAAAhwAAAFkAAACIAAAAJgIAACcCAAAoAgAAKQIAACoCAAArAgAAwP///wAAAAAsAgAALQI=");
 Da(Aa, 11320, "gAAAAC4CAAAiAgAAIwIAACQCAABUAAAAJQAAAFYAAABXAAAAhwAAAFkAAACIAAAALwIAADACAAAxAgAAMgI=");
 Da(Aa, 11392, "JQAAACUAAAByZW5kZXJGYWN0b3J5AG1ha2VSZW5kZXJQYWludABtYWtlUmVuZGVyUGF0aABieXRlTGVuZ3RoAHNldABsb2FkAFJlbmRlcmVyAHNhdmUAcmVzdG9yZQB0cmFuc2Zvcm0AZHJhd1BhdGgAY2xpcFBhdGgAYWxpZ24AUmVuZGVyZXJXcmFwcGVyAFJlbmRlclBhdGgAcmVzZXQAYWRkUGF0aABmaWxsUnVsZQBtb3ZlVG8AbGluZVRvAGN1YmljVG8AY2xvc2UAUmVuZGVyUGF0aFdyYXBwZXIAUmVuZGVyUGFpbnRTdHlsZQBmaWxsAHN0cm9rZQBGaWxsUnVsZQBub25aZXJvAGV2ZW5PZGQAU3Ryb2tlQ2FwAGJ1dHQAcm91bmQAc3F1YXJlAFN0cm9rZUpvaW4AbWl0ZXIAYmV2ZWwAQmxlbmRNb2RlAHNyY092ZXIAc2NyZWVuAG92ZXJsYXkAZGFya2VuAGxpZ2h0ZW4AY29sb3JEb2RnZQBjb2xvckJ1cm4AaGFyZExpZ2h0AHNvZnRMaWdodABkaWZmZXJlbmNlAGV4Y2x1c2lvbgBtdWx0aXBseQBodWUAc2F0dXJhdGlvbgBjb2xvcgBsdW1pbm9zaXR5AFJlbmRlclBhaW50AHN0eWxlAHRoaWNrbmVzcwBqb2luAGNhcABibGVuZE1vZGUAbGluZWFyR3JhZGllbnQAcmFkaWFsR3JhZGllbnQAYWRkU3RvcABjb21wbGV0ZUdyYWRpZW50AFJlbmRlclBhaW50V3JhcHBlcgBNYXQyRAB4eAB4eQB5eAB5eQB0eAB0eQBGaWxlAGFydGJvYXJkAGRlZmF1bHRBcnRib2FyZABBcnRib2FyZABhZHZhbmNlAGRyYXcAdHJhbnNmb3JtQ29tcG9uZW50AG5vZGUAYm9uZQByb290Qm9uZQBhbmltYXRpb24AYW5pbWF0aW9uQXQAYW5pbWF0aW9uQ291bnQAYm91bmRzAFRyYW5zZm9ybUNvbXBvbmVudABzY2FsZVgAc2NhbGVZAHJvdGF0aW9uAE5vZGUAeAB5AEJvbmUAbGVuZ3RoAFJvb3RCb25lAExpbmVhckFuaW1hdGlvbgBuYW1lAGR1cmF0aW9uAGZwcwB3b3JrU3RhcnQAd29ya0VuZABsb29wVmFsdWUAc3BlZWQAYXBwbHkATGluZWFyQW5pbWF0aW9uSW5zdGFuY2UAdGltZQBkaWRMb29wAEZpdABjb250YWluAGNvdmVyAGZpdFdpZHRoAGZpdEhlaWdodABub25lAHNjYWxlRG93bgBBbGlnbm1lbnQAdG9wTGVmdAB0b3BDZW50ZXIAdG9wUmlnaHQAY2VudGVyTGVmdABjZW50ZXIAY2VudGVyUmlnaHQAYm90dG9tTGVmdABib3R0b21DZW50ZXIAYm90dG9tUmlnaHQAQUFCQgBtaW5YAG1pblkAbWF4WABtYXhZAAC0SwAAtUsAALZLAAC3SwAAYWxsb2NhdG9yPFQ+OjphbGxvY2F0ZShzaXplX3QgbikgJ24nIGV4Y2VlZHMgbWF4aW11bSBzdXBwb3J0ZWQgc2l6ZQDESwAAtEsAAMVLAAC0SwAAaWlpAGlpAHYAdmkAxEsAAMpLAAB2aWkAxEsAAMpLAADLSwAAdmlpaQ==");
 Da(Aa, 12672, "xEsAAMpLAAC2SwAAtUsAAHZpaWlpAAAAxEsAAMpLAAC2Sw==");
 Da(Aa, 12720, "xEsAAMdLAADMSwAAzUsAAM5LAADOSwAAdmlpaWlpaQBub3RpZnlPbkRlc3RydWN0aW9uAGltcGxlbWVudABleHRlbmQAAAAAxEsAAMlLAADKSwAAtEs=");
 Da(Aa, 12816, "2AIAANkCAADaAgAA2wIAANwCAADdAgAA3gI=");
 Da(Aa, 12852, "2AIAAN8CAAAlAAAAJQAAACUAAAAlAAAAJQ==");
 Da(Aa, 12888, "4AIAAOECAAAlAAAAJQAAACUAAAAlAAAAJQAAAF9fZGVzdHJ1Y3QAAMRLAADESwAAy0sAAMRLAAC2SwAAtUsAAMRLAAC2SwAAtEsAAPBLAAC0SwAAaWlpaQAAAADESwAA9EsAAAAAAADESwAA9EsAALZLAADLSwAAxEsAAPRLAAD1SwAAAAAAAMRLAAD0SwAA9ksAAPZLAAB2aWlmZg==");
 Da(Aa, 13056, "xEsAAPRLAAD2SwAA9ksAAPZLAAD2SwAA9ksAAPZLAAB2aWlmZmZmZmYAAADESwAA80sAAPRLAAC0Sw==");
 Da(Aa, 13124, "4gIAAOMCAADkAgAA5QIAAOYCAADnAgAA6AIAAOkCAADqAgAA6wIAAOwC");
 Da(Aa, 13176, "4gIAAO0CAAAlAAAAJQAAAOYCAAAlAAAAJQAAACUAAAAlAAAA6wIAACU=");
 Da(Aa, 13228, "HAEAAO4CAAAlAAAAJQAAAOYCAAAlAAAAJQAAACUAAAAlAAAA6wIAACUAAADESwAA9UsAAMRLAAD2SwAA9ksAAAAAAADESwAA9ksAAPZLAAD2SwAA9ksAAPZLAAD2SwAAxEsAALZLAADLSwAAxEsAAB9MAAC3SwAAxEsAAB9MAAAYTAAAxEsAAB9MAAD2SwAAdmlpZgAAAADESwAAH0wAABpMAADESwAAH0wAABlMAADESwAAH0wAABtM");
 Da(Aa, 13424, "xEsAAB9MAAD2SwAA9ksAAPZLAAD2SwAAdmlpZmZmZgDESwAAH0wAALdLAAD2SwAAdmlpaWYAAADESwAAH0wAAMRLAAAeTAAAH0wAALRL");
 Da(Aa, 13512, "7wIAAPACAADxAgAA8gIAAPMCAAD0AgAA9QIAAPYCAAD3AgAA+AIAAPkCAAD6Ag==");
 Da(Aa, 13568, "JQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQAAAPkCAAD7Ag==");
 Da(Aa, 13624, "JQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQAAACUAAAAlAAAAJQAAAPwCAAD9AgAAxEsAABhMAADESwAAt0sAAMRLAAD2SwAAxEsAABpMAADESwAAGUwAAMRLAAAbTA==");
 Da(Aa, 13728, "xEsAAPZLAAD2SwAA9ksAAPZLAADESwAAt0sAAPZLAABmaWkAaEwAAGdMAADwSwAAaEwAAGdMAABrTAAAaEwAAGxMAABpaWlkAAAAAMRLAABoTAAAx0sAAG1MAABoTAAA8EsAAG5MAABoTAAA8EsAAG9MAABoTAAA8EsAAHBMAABoTAAA8EsAAHFMAABpTAAA8EsAAHFMAABpTAAAckwAAHJMAABoTA==");
 Da(Aa, 13904, "xEsAAHFMAABoTAAA9ksAAPZLAAB2aWlpZmYAAH9MAABxTAAAa0wAAH9MAAD2SwAAaWlpZg==");
 Da(Aa, 13968, "xEsAAIBMAABoTAAA9ksAAGkAJXAAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AAAAAAAAAwAAAAQAAAAEAAAABgAAAIP5ogBETm4A/CkVANFXJwDdNPUAYtvAADyZlQBBkEMAY1H+ALveqwC3YcUAOm4kANJNQgBJBuAACeouAByS0QDrHf4AKbEcAOg+pwD1NYIARLsuAJzphAC0JnAAQX5fANaROQBTgzkAnPQ5AItfhAAo+b0A+B87AN7/lwAPmAUAES/vAApaiwBtH20Az342AAnLJwBGT7cAnmY/AC3qXwC6J3UA5evHAD178QD3OQcAklKKAPtr6gAfsV8ACF2NADADVgB7/EYA8KtrACC8zwA29JoA46kdAF5hkQAIG+YAhZllAKAUXwCNQGgAgNj/ACdzTQAGBjEAylYVAMmocwB74mAAa4zAABnERwDNZ8MACejcAFmDKgCLdsQAphyWAESv3QAZV9EApT4FAAUH/wAzfj8AwjLoAJhP3gC7fTIAJj3DAB5r7wCf+F4ANR86AH/yygDxhx0AfJAhAGokfADVbvoAMC13ABU7QwC1FMYAwxmdAK3EwgAsTUEADABdAIZ9RgDjcS0Am8aaADNiAAC00nwAtKeXADdV1QDXPvYAoxAYAE12/ABknSoAcNerAGN8+AB6sFcAFxXnAMBJVgA71tkAp4Q4ACQjywDWincAWlQjAAAfuQDxChsAGc7fAJ8x/wBmHmoAmVdhAKz7RwB+f9gAImW3ADLoiQDmv2AA78TNAGw2CQBdP9QAFt7XAFg73gDem5IA0iIoACiG6ADiWE0AxsoyAAjjFgDgfcsAF8BQAPMdpwAY4FsALhM0AIMSYgCDSAEA9Y5bAK2wfwAe6fIASEpDABBn0wCq3dgArl9CAGphzgAKKKQA05m0AAam8gBcd38Ao8KDAGE8iACKc3gAr4xaAG/XvQAtpmMA9L/LAI2B7wAmwWcAVcpFAMrZNgAoqNIAwmGNABLJdwAEJhQAEkabAMRZxADIxUQATbKRAAAX8wDUQ60AKUnlAP3VEAAAvvwAHpTMAHDO7gATPvUA7PGAALPnwwDH+CgAkwWUAMFxPgAuCbMAC0XzAIgSnACrIHsALrWfAEeSwgB7Mi8ADFVtAHKnkABr5x8AMcuWAHkWSgBBeeIA9N+JAOiUlwDi5oQAmTGXAIjtawBfXzYAu/0OAEiatABnpGwAcXJCAI1dMgCfFbgAvOUJAI0xJQD3dDkAMAUcAA0MAQBLCGgALO5YAEeqkAB05wIAvdYkAPd9pgBuSHIAnxbvAI6UpgC0kfYA0VNRAM8K8gAgmDMA9Ut+ALJjaADdPl8AQF0DAIWJfwBVUikAN2TAAG3YEAAySDIAW0x1AE5x1ABFVG4ACwnBACr1aQAUZtUAJwedAF0EUAC0O9sA6nbFAIf5FwBJa30AHSe6AJZpKQDGzKwArRRUAJDiagCI2YkALHJQAASkvgB3B5QA8zBwAAD8JwDqcagAZsJJAGTgPQCX3YMAoz+XAEOU/QANhowAMUHeAJI5nQDdcIwAF7fnAAjfOwAVNysAXICgAFqAkwAQEZIAD+jYAGyArwDb/0sAOJAPAFkYdgBipRUAYcu7AMeJuQAQQL0A0vIEAEl1JwDrtvYA2yK7AAoUqgCJJi8AZIN2AAk7MwAOlBoAUTqqAB2jwgCv7a4AXCYSAG3CTQAtepwAwFaXAAM/gwAJ8PYAK0CMAG0xmQA5tAcADCAVANjDWwD1ksQAxq1LAE7KpQCnN80A5qk2AKuSlADdQmgAGWPeAHaM7wBoi1IA/Ns3AK6hqwDfFTEAAK6hAAz72gBkTWYA7QW3ACllMABXVr8AR/86AGr5uQB1vvMAKJPfAKuAMABmjPYABMsVAPoiBgDZ5B0APbOkAFcbjwA2zQkATkLpABO+pAAzI7UA8KoaAE9lqADSwaUACz8PAFt4zQAj+XYAe4sEAIkXcgDGplMAb27iAO/rAACbSlgAxNq3AKpmugB2z88A0QIdALHxLQCMmcEAw613AIZI2gD3XaAAxoD0AKzwLwDd7JoAP1y8ANDebQCQxx8AKtu2AKMlOgAAr5oArVOTALZXBAApLbQAS4B+ANoHpwB2qg4Ae1mhABYSKgDcty0A+uX9AInb/gCJvv0A5HZsAAap/AA+gHAAhW4VAP2H/wAoPgcAYWczACoYhgBNveoAs+evAI9tbgCVZzkAMb9bAITXSAAw3xYAxy1DACVhNQDJcM4AMMu4AL9s/QCkAKIABWzkAFrdoAAhb0cAYhLSALlchABwYUkAa1bgAJlSAQBQVTcAHtW3ADPxxAATbl8AXTDkAIUuqQAdssMAoTI2AAi3pADqsdQAFvchAI9p5AAn/3cADAOAAI1ALQBPzaAAIKWZALOi0wAvXQoAtPlCABHaywB9vtAAm9vBAKsXvQDKooEACGpcAC5VFwAnAFUAfxTwAOEHhgAUC2QAlkGNAIe+3gDa/SoAayW2AHuJNAAF8/4Aub+eAGhqTwBKKqgAT8RaAC34vADXWpgA9MeVAA1NjQAgOqYApFdfABQ/sQCAOJUAzCABAHHdhgDJ3rYAv2D1AE1lEQABB2sAjLCsALLA0ABRVUgAHvsOAJVywwCjBjsAwEA1AAbcewDgRcwATin6ANbKyADo80EAfGTeAJtk2ADZvjEApJfDAHdY1ABp48UA8NoTALo6PABGGEYAVXVfANK99QBuksYArC5dAA5E7QAcPkIAYcSHACn96QDn1vMAInzKAG+RNQAI4MUA/9eNAG5q4gCw/cYAkwjBAHxddABrrbIAzW6dAD5yewDGEWoA98+pAClz3wC1yboAtwBRAOKyDQB0uiQA5X1gAHTYigANFSwAgRgMAH5mlAABKRYAn3p2AP39vgBWRe8A2X42AOzZEwCLurkAxJf8ADGoJwDxbsMAlMU2ANioVgC0qLUAz8wOABKJLQBvVzQALFaJAJnO4wDWILkAa16qAD4qnAARX8wA/QtKAOH0+wCOO20A4oYsAOnUhAD8tKkA7+7RAC41yQAvOWEAOCFEABvZyACB/AoA+0pqAC8c2ABTtIQATpmMAFQizAAqVdwAwMbWAAsZlgAacLgAaZVkACZaYAA/Uu4AfxEPAPS1EQD8y/UANLwtADS87gDoXcwA3V5gAGeOmwCSM+8AyRe4AGFYmwDhV7wAUYPGANg+EADdcUgALRzdAK8YoQAhLEYAWfPXANl6mACeVMAAT4b6AFYG/ADlea4AiSI2ADitIgBnk9wAVeiqAIImOADK55sAUQ2kAJkzsQCp1w4AaQVIAGWy8AB/iKcAiEyXAPnRNgAhkrMAe4JKAJjPIQBAn9wA3EdVAOF0OgBn60IA/p3fAF7UXwB7Z6QAuqx6AFX2ogAriCMAQbpVAFluCAAhKoYAOUeDAInj5gDlntQASftAAP9W6QAcD8oAxVmKAJT6KwDTwcUAD8XPANtargBHxYYAhUNiACGGOwAseZQAEGGHACpMewCALBoAQ78SAIgmkAB4PIkAqMTkAOXbewDEOsIAJvTqAPdnigANkr8AZaMrAD2TsQC9fAsApFHcACfdYwBp4d0AmpQZAKgplQBozigACe20AESfIABOmMoAcIJjAH58IwAPuTIAp/WOABRW5wAh8QgAtZ0qAG9+TQClGVEAtfmrAILf1gCW3WEAFjYCAMQ6nwCDoqEAcu1tADmNegCCuKkAazJcAEYnWwAANO0A0gB3APz0VQABWU0A4HGA");
 Da(Aa, 17571, "QPsh+T8AAAAALUR0PgAAAICYRvg8AAAAYFHMeDsAAACAgxvwOQAAAEAgJXo4AAAAgCKC4zYAAAAAHfNpNehJAAAtKyAgIDBYMHgAKG51bGwp");
 Da(Aa, 17664, "EQAKABEREQAAAAAFAAAAAAAACQAAAAALAAAAAAAAAAARAA8KERERAwoHAAEACQsLAAAJBgsAAAsABhEAAAARERE=");
 Da(Aa, 17745, "CwAAAAAAAAAAEQAKChEREQAKAAACAAkLAAAACQALAAAL");
 Da(Aa, 17803, "DA==");
 Da(Aa, 17815, "DAAAAAAMAAAAAAkMAAAAAAAMAAAM");
 Da(Aa, 17861, "Dg==");
 Da(Aa, 17873, "DQAAAAQNAAAAAAkOAAAAAAAOAAAO");
 Da(Aa, 17919, "EA==");
 Da(Aa, 17931, "DwAAAAAPAAAAAAkQAAAAAAAQAAAQAAASAAAAEhIS");
 Da(Aa, 17986, "EgAAABISEgAAAAAAAAk=");
 Da(Aa, 18035, "Cw==");
 Da(Aa, 18047, "CgAAAAAKAAAAAAkLAAAAAAALAAAL");
 Da(Aa, 18093, "DA==");
 Da(Aa, 18105, "DAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAwMTIzNDU2Nzg5QUJDREVGLTBYKzBYIDBYLTB4KzB4IDB4AGluZgBJTkYAbmFuAE5BTgAu");
 Da(Aa, 18220, "BAM=");
 Da(Aa, 18259, "//////8=");
 Da(Aa, 18340, "AgAAAAMAAAAFAAAABwAAAAsAAAANAAAAEQAAABMAAAAXAAAAHQAAAB8AAAAlAAAAKQAAACsAAAAvAAAANQAAADsAAAA9AAAAQwAAAEcAAABJAAAATwAAAFMAAABZAAAAYQAAAGUAAABnAAAAawAAAG0AAABxAAAAfwAAAIMAAACJAAAAiwAAAJUAAACXAAAAnQAAAKMAAACnAAAArQAAALMAAAC1AAAAvwAAAMEAAADFAAAAxwAAANMAAAABAAAACwAAAA0AAAARAAAAEwAAABcAAAAdAAAAHwAAACUAAAApAAAAKwAAAC8AAAA1AAAAOwAAAD0AAABDAAAARwAAAEkAAABPAAAAUwAAAFkAAABhAAAAZQAAAGcAAABrAAAAbQAAAHEAAAB5AAAAfwAAAIMAAACJAAAAiwAAAI8AAACVAAAAlwAAAJ0AAACjAAAApwAAAKkAAACtAAAAswAAALUAAAC7AAAAvwAAAMEAAADFAAAAxwAAANEAAABfX25leHRfcHJpbWUgb3ZlcmZsb3cAYmFzaWNfc3RyaW5nAGFsbG9jYXRvcjxUPjo6YWxsb2NhdGUoc2l6ZV90IG4pICduJyBleGNlZWRzIG1heGltdW0gc3VwcG9ydGVkIHNpemUAdmVjdG9yAF9fY3hhX2d1YXJkX2FjcXVpcmUgZGV0ZWN0ZWQgcmVjdXJzaXZlIGluaXRpYWxpemF0aW9uAFB1cmUgdmlydHVhbCBmdW5jdGlvbiBjYWxsZWQh");
 Da(Aa, 18920, "BQ==");
 Da(Aa, 18932, "/wI=");
 Da(Aa, 18957, "AwAAAQMAAKBM");
 Da(Aa, 18980, "Ag==");
 Da(Aa, 18995, "//////8=");
 Da(Aa, 19240, "zEw=");
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
 "initial": 773,
 "maximum": 773 + 0,
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

var DYNAMIC_BASE = 5263232, DYNAMICTOP_PTR = 20192;

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
    
