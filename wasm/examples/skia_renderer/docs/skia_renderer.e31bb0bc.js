// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"node_modules/regenerator-runtime/runtime.js":[function(require,module,exports) {
var define;
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function () {
    return this;
  });

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = GeneratorFunctionPrototype;
  define(Gp, "constructor", GeneratorFunctionPrototype);
  define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
    return this;
  });
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  define(Gp, iteratorSymbol, function() {
    return this;
  });

  define(Gp, "toString", function() {
    return "[object Generator]";
  });

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, in modern engines
  // we can explicitly access globalThis. In older engines we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  if (typeof globalThis === "object") {
    globalThis.regeneratorRuntime = runtime;
  } else {
    Function("r", "regeneratorRuntime = r")(runtime);
  }
}

},{}],"node_modules/process/browser.js":[function(require,module,exports) {

// shim for using process in browser
var process = module.exports = {}; // cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
  throw new Error('setTimeout has not been defined');
}

function defaultClearTimeout() {
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
})();

function runTimeout(fun) {
  if (cachedSetTimeout === setTimeout) {
    //normal enviroments in sane situations
    return setTimeout(fun, 0);
  } // if setTimeout wasn't available but was latter defined


  if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
    cachedSetTimeout = setTimeout;
    return setTimeout(fun, 0);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedSetTimeout(fun, 0);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
      return cachedSetTimeout.call(null, fun, 0);
    } catch (e) {
      // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
      return cachedSetTimeout.call(this, fun, 0);
    }
  }
}

function runClearTimeout(marker) {
  if (cachedClearTimeout === clearTimeout) {
    //normal enviroments in sane situations
    return clearTimeout(marker);
  } // if clearTimeout wasn't available but was latter defined


  if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
    cachedClearTimeout = clearTimeout;
    return clearTimeout(marker);
  }

  try {
    // when when somebody has screwed with setTimeout but no I.E. maddness
    return cachedClearTimeout(marker);
  } catch (e) {
    try {
      // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
      return cachedClearTimeout.call(null, marker);
    } catch (e) {
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

  while (len) {
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
}; // v8 likes predictible objects


function Item(fun, array) {
  this.fun = fun;
  this.array = array;
}

Item.prototype.run = function () {
  this.fun.apply(null, this.array);
};

process.title = 'browser';
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

process.listeners = function (name) {
  return [];
};

process.binding = function (name) {
  throw new Error('process.binding is not supported');
};

process.cwd = function () {
  return '/';
};

process.chdir = function (dir) {
  throw new Error('process.chdir is not supported');
};

process.umask = function () {
  return 0;
};
},{}],"node_modules/path-browserify/index.js":[function(require,module,exports) {
var process = require("process");
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

},{"process":"node_modules/process/browser.js"}],"node_modules/parcel-bundler/src/builtins/_empty.js":[function(require,module,exports) {

},{}],"node_modules/base64-js/index.js":[function(require,module,exports) {
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

  var i
  for (i = 0; i < len; i += 4) {
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
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
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

},{}],"node_modules/ieee754/index.js":[function(require,module,exports) {
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
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

},{}],"node_modules/isarray/index.js":[function(require,module,exports) {
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],"node_modules/buffer/index.js":[function(require,module,exports) {

var global = arguments[3];
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
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
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
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
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
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
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
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
  if (!isArray(list)) {
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
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

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
      case undefined:
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
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
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

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
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
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
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
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
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
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
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

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
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
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
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
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
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

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

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
  offset = offset | 0
  byteLength = byteLength | 0
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
  offset = offset | 0
  byteLength = byteLength | 0
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
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
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
  offset = offset | 0
  byteLength = byteLength | 0
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
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
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
  offset = offset | 0
  byteLength = byteLength | 0
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
  offset = offset | 0
  byteLength = byteLength | 0
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
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

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
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

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
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
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
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
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
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
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
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
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

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":"node_modules/base64-js/index.js","ieee754":"node_modules/ieee754/index.js","isarray":"node_modules/isarray/index.js","buffer":"node_modules/buffer/index.js"}],"../../../js/dist/rive_canvas_light.mjs":[function(require,module,exports) {
var __filename = "/Users/luigi/Projects/rive-wasm/js/dist/rive_canvas_light.mjs";
var process = require("process");
var __dirname = "/Users/luigi/Projects/rive-wasm/js/dist";
var Buffer = require("buffer").Buffer;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var Rive = function () {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return function (Rive) {
    Rive = Rive || {};
    null;
    var h;
    h || (h = typeof Rive !== 'undefined' ? Rive : {});
    var aa, ba;
    h.ready = new Promise(function (a, b) {
      aa = a;
      ba = b;
    });

    Rive.onRuntimeInitialized = function () {
      function a(n) {
        switch (n) {
          case k.srcOver:
            return "source-over";

          case k.screen:
            return "screen";

          case k.overlay:
            return "overlay";

          case k.darken:
            return "darken";

          case k.lighten:
            return "lighten";

          case k.colorDodge:
            return "color-dodge";

          case k.colorBurn:
            return "color-burn";

          case k.hardLight:
            return "hard-light";

          case k.softLight:
            return "soft-light";

          case k.difference:
            return "difference";

          case k.exclusion:
            return "exclusion";

          case k.multiply:
            return "multiply";

          case k.hue:
            return "hue";

          case k.saturation:
            return "saturation";

          case k.color:
            return "color";

          case k.luminosity:
            return "luminosity";
        }
      }

      function b(n) {
        return "rgba(" + ((16711680 & n) >>> 16) + "," + ((65280 & n) >>> 8) + "," + ((255 & n) >>> 0) + "," + ((4278190080 & n) >>> 24) / 255 + ")";
      }

      var c = Rive.RenderPaintStyle,
          d = Rive.RenderPath,
          e = Rive.RenderPaint,
          f = Rive.Renderer,
          m = Rive.StrokeCap,
          g = Rive.StrokeJoin,
          k = Rive.BlendMode,
          l = c.fill,
          p = c.stroke,
          q = Rive.FillRule.evenOdd;
      var u = Rive.RenderImage.extend("CanvasRenderImage", {
        __construct: function __construct() {
          this.__parent.__construct.call(this);
        },
        decode: function decode(n) {
          var t = this,
              v = new Image();
          v.src = URL.createObjectURL(new Blob([n], {
            type: "image/png"
          }));

          v.onload = function () {
            t.Ja = v;
            console.log("SETTING", v.width, v.height, t.size);
            t.size(v.width, v.height);
          };
        }
      }),
          z = d.extend("CanvasRenderPath", {
        __construct: function __construct() {
          this.__parent.__construct.call(this);

          this.ea = new Path2D();
        },
        reset: function reset() {
          this.ea = new Path2D();
        },
        addPath: function addPath(n, t) {
          var v = this.ea,
              w = v.addPath;
          n = n.ea;
          var y = new DOMMatrix();
          y.a = t.xx;
          y.b = t.xy;
          y.c = t.yx;
          y.d = t.yy;
          y.e = t.tx;
          y.f = t.ty;
          w.call(v, n, y);
        },
        fillRule: function fillRule(n) {
          this.ya = n;
        },
        moveTo: function moveTo(n, t) {
          this.ea.moveTo(n, t);
        },
        lineTo: function lineTo(n, t) {
          this.ea.lineTo(n, t);
        },
        cubicTo: function cubicTo(n, t, v, w, y, L) {
          this.ea.bezierCurveTo(n, t, v, w, y, L);
        },
        close: function close() {
          this.ea.closePath();
        }
      }),
          x = e.extend("CanvasRenderPaint", {
        color: function color(n) {
          this.za = b(n);
        },
        thickness: function thickness(n) {
          this.La = n;
        },
        join: function join(n) {
          switch (n) {
            case g.miter:
              this.ra = "miter";
              break;

            case g.round:
              this.ra = "round";
              break;

            case g.bevel:
              this.ra = "bevel";
          }
        },
        cap: function cap(n) {
          switch (n) {
            case m.butt:
              this.qa = "butt";
              break;

            case m.round:
              this.qa = "round";
              break;

            case m.square:
              this.qa = "square";
          }
        },
        style: function style(n) {
          this.Ka = n;
        },
        blendMode: function blendMode(n) {
          this.Ia = a(n);
        },
        linearGradient: function linearGradient(n, t, v, w) {
          this.na = {
            Ga: n,
            Ha: t,
            Ba: v,
            Ca: w,
            wa: []
          };
        },
        radialGradient: function radialGradient(n, t, v, w) {
          this.na = {
            Ga: n,
            Ha: t,
            Ba: v,
            Ca: w,
            wa: [],
            Va: !0
          };
        },
        addStop: function addStop(n, t) {
          this.na.wa.push({
            color: n,
            stop: t
          });
        },
        completeGradient: function completeGradient() {},
        draw: function draw(n, t) {
          var v = this.Ka;
          var w = this.za,
              y = this.na;
          n.globalCompositeOperation = this.Ia;

          if (null != y) {
            w = y.Ga;
            var L = y.Ha;
            var fb = y.Ba;
            var ta = y.Ca;
            var gb = y.wa;
            y.Va ? (y = fb - w, ta -= L, w = n.createRadialGradient(w, L, 0, w, L, Math.sqrt(y * y + ta * ta))) : w = n.createLinearGradient(w, L, fb, ta);

            for (var Oa = 0, Ib = gb.length; Oa < Ib; Oa++) {
              L = gb[Oa], w.addColorStop(L.stop, b(L.color));
            }

            this.za = w;
            this.na = null;
          }

          switch (v) {
            case p:
              n.strokeStyle = w;
              n.lineWidth = this.La;
              n.lineCap = this.qa;
              n.lineJoin = this.ra;
              n.stroke(t.ea);
              break;

            case l:
              n.fillStyle = w, n.fill(t.ea, t.ya === q ? "evenodd" : "nonzero");
          }
        }
      }),
          I = Rive.CanvasRenderer = f.extend("Renderer", {
        __construct: function __construct(n) {
          this.__parent.__construct.call(this);

          this.ha = n.getContext("2d");
          this.xa = n;
        },
        save: function save() {
          this.ha.save();
        },
        restore: function restore() {
          this.ha.restore();
        },
        transform: function transform(n) {
          this.ha.transform(n.xx, n.xy, n.yx, n.yy, n.tx, n.ty);
        },
        drawPath: function drawPath(n, t) {
          t.draw(this.ha, n);
        },
        drawImage: function drawImage(n, t, v) {
          if (n = n.Ja) {
            var w = this.ha;
            w.globalCompositeOperation = a(t);
            w.globalAlpha = v;
            w.drawImage(n, 0, 0);
            w.globalAlpha = 1;
          }
        },
        clipPath: function clipPath(n) {
          this.ha.clip(n.ea, n.ya === q ? "evenodd" : "nonzero");
        },
        clear: function clear() {
          this.ha.clearRect(0, 0, this.xa.width, this.xa.height);
        },
        flush: function flush() {}
      });

      Rive.makeRenderer = function (n) {
        return new I(n);
      };

      Rive.renderFactory = {
        makeRenderPaint: function makeRenderPaint() {
          return new x();
        },
        makeRenderPath: function makeRenderPath() {
          return new z();
        },
        makeRenderImage: function makeRenderImage() {
          return new u();
        }
      };
    };

    var ca = {},
        r;

    for (r in h) {
      h.hasOwnProperty(r) && (ca[r] = h[r]);
    }

    var da = "object" === (typeof window === "undefined" ? "undefined" : _typeof(window)),
        ea = "function" === typeof importScripts,
        fa = "object" === (typeof process === "undefined" ? "undefined" : _typeof(process)) && "object" === _typeof(process.versions) && "string" === typeof process.versions.node,
        A = "",
        ha,
        ia,
        ja,
        B,
        C;
    if (fa) A = ea ? require("path").dirname(A) + "/" : __dirname + "/", ha = function ha(a, b) {
      var c = D(a);
      if (c) return b ? c : c.toString();
      B || (B = require("fs"));
      C || (C = require("path"));
      a = C.normalize(a);
      return B.readFileSync(a, b ? null : "utf8");
    }, ja = function ja(a) {
      a = ha(a, !0);
      a.buffer || (a = new Uint8Array(a));
      assert(a.buffer);
      return a;
    }, ia = function ia(a, b, c) {
      var d = D(a);
      d && b(d);
      B || (B = require("fs"));
      C || (C = require("path"));
      a = C.normalize(a);
      B.readFile(a, function (e, f) {
        e ? c(e) : b(f.buffer);
      });
    }, 1 < process.argv.length && process.argv[1].replace(/\\/g, "/"), process.argv.slice(2), process.on("uncaughtException", function (a) {
      throw a;
    }), process.on("unhandledRejection", function (a) {
      throw a;
    }), h.inspect = function () {
      return "[Emscripten Module object]";
    };else if (da || ea) ea ? A = self.location.href : "undefined" !== typeof document && document.currentScript && (A = document.currentScript.src), _scriptDir && (A = _scriptDir), 0 !== A.indexOf("blob:") ? A = A.substr(0, A.replace(/[?#].*/, "").lastIndexOf("/") + 1) : A = "", ha = function ha(a) {
      try {
        var b = new XMLHttpRequest();
        b.open("GET", a, !1);
        b.send(null);
        return b.responseText;
      } catch (e) {
        if (a = D(a)) {
          b = [];

          for (var c = 0; c < a.length; c++) {
            var d = a[c];
            255 < d && (ka && assert(!1, "Character code " + d + " (" + String.fromCharCode(d) + ")  at offset " + c + " not in 0x00-0xFF."), d &= 255);
            b.push(String.fromCharCode(d));
          }

          return b.join("");
        }

        throw e;
      }
    }, ea && (ja = function ja(a) {
      try {
        var b = new XMLHttpRequest();
        b.open("GET", a, !1);
        b.responseType = "arraybuffer";
        b.send(null);
        return new Uint8Array(b.response);
      } catch (c) {
        if (a = D(a)) return a;
        throw c;
      }
    }), ia = function ia(a, b, c) {
      var d = new XMLHttpRequest();
      d.open("GET", a, !0);
      d.responseType = "arraybuffer";

      d.onload = function () {
        if (200 == d.status || 0 == d.status && d.response) b(d.response);else {
          var e = D(a);
          e ? b(e.buffer) : c();
        }
      };

      d.onerror = c;
      d.send(null);
    };
    var la = h.print || console.log.bind(console),
        ma = h.printErr || console.warn.bind(console);

    for (r in ca) {
      ca.hasOwnProperty(r) && (h[r] = ca[r]);
    }

    ca = null;
    var na;
    h.wasmBinary && (na = h.wasmBinary);
    var noExitRuntime = h.noExitRuntime || !0;
    "object" !== (typeof WebAssembly === "undefined" ? "undefined" : _typeof(WebAssembly)) && oa("no native wasm support detected");
    var pa,
        qa = !1;

    function assert(a, b) {
      a || oa("Assertion failed: " + b);
    }

    var ra = "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0;

    function sa(a, b, c) {
      var d = b + c;

      for (c = b; a[c] && !(c >= d);) {
        ++c;
      }

      if (16 < c - b && a.subarray && ra) return ra.decode(a.subarray(b, c));

      for (d = ""; b < c;) {
        var e = a[b++];

        if (e & 128) {
          var f = a[b++] & 63;
          if (192 == (e & 224)) d += String.fromCharCode((e & 31) << 6 | f);else {
            var m = a[b++] & 63;
            e = 224 == (e & 240) ? (e & 15) << 12 | f << 6 | m : (e & 7) << 18 | f << 12 | m << 6 | a[b++] & 63;
            65536 > e ? d += String.fromCharCode(e) : (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023));
          }
        } else d += String.fromCharCode(e);
      }

      return d;
    }

    function ua(a, b, c) {
      var d = E;

      if (0 < c) {
        c = b + c - 1;

        for (var e = 0; e < a.length; ++e) {
          var f = a.charCodeAt(e);

          if (55296 <= f && 57343 >= f) {
            var m = a.charCodeAt(++e);
            f = 65536 + ((f & 1023) << 10) | m & 1023;
          }

          if (127 >= f) {
            if (b >= c) break;
            d[b++] = f;
          } else {
            if (2047 >= f) {
              if (b + 1 >= c) break;
              d[b++] = 192 | f >> 6;
            } else {
              if (65535 >= f) {
                if (b + 2 >= c) break;
                d[b++] = 224 | f >> 12;
              } else {
                if (b + 3 >= c) break;
                d[b++] = 240 | f >> 18;
                d[b++] = 128 | f >> 12 & 63;
              }

              d[b++] = 128 | f >> 6 & 63;
            }

            d[b++] = 128 | f & 63;
          }
        }

        d[b] = 0;
      }
    }

    var va = "undefined" !== typeof TextDecoder ? new TextDecoder("utf-16le") : void 0;

    function wa(a, b) {
      var c = a >> 1;

      for (var d = c + b / 2; !(c >= d) && xa[c];) {
        ++c;
      }

      c <<= 1;
      if (32 < c - a && va) return va.decode(E.subarray(a, c));
      c = "";

      for (d = 0; !(d >= b / 2); ++d) {
        var e = F[a + 2 * d >> 1];
        if (0 == e) break;
        c += String.fromCharCode(e);
      }

      return c;
    }

    function ya(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (2 > c) return 0;
      c -= 2;
      var d = b;
      c = c < 2 * a.length ? c / 2 : a.length;

      for (var e = 0; e < c; ++e) {
        F[b >> 1] = a.charCodeAt(e), b += 2;
      }

      F[b >> 1] = 0;
      return b - d;
    }

    function za(a) {
      return 2 * a.length;
    }

    function Aa(a, b) {
      for (var c = 0, d = ""; !(c >= b / 4);) {
        var e = G[a + 4 * c >> 2];
        if (0 == e) break;
        ++c;
        65536 <= e ? (e -= 65536, d += String.fromCharCode(55296 | e >> 10, 56320 | e & 1023)) : d += String.fromCharCode(e);
      }

      return d;
    }

    function Ba(a, b, c) {
      void 0 === c && (c = 2147483647);
      if (4 > c) return 0;
      var d = b;
      c = d + c - 4;

      for (var e = 0; e < a.length; ++e) {
        var f = a.charCodeAt(e);

        if (55296 <= f && 57343 >= f) {
          var m = a.charCodeAt(++e);
          f = 65536 + ((f & 1023) << 10) | m & 1023;
        }

        G[b >> 2] = f;
        b += 4;
        if (b + 4 > c) break;
      }

      G[b >> 2] = 0;
      return b - d;
    }

    function Ca(a) {
      for (var b = 0, c = 0; c < a.length; ++c) {
        var d = a.charCodeAt(c);
        55296 <= d && 57343 >= d && ++c;
        b += 4;
      }

      return b;
    }

    var Da, Ea, E, F, xa, G, H, Fa, Ga;

    function Ha() {
      var a = pa.buffer;
      Da = a;
      h.HEAP8 = Ea = new Int8Array(a);
      h.HEAP16 = F = new Int16Array(a);
      h.HEAP32 = G = new Int32Array(a);
      h.HEAPU8 = E = new Uint8Array(a);
      h.HEAPU16 = xa = new Uint16Array(a);
      h.HEAPU32 = H = new Uint32Array(a);
      h.HEAPF32 = Fa = new Float32Array(a);
      h.HEAPF64 = Ga = new Float64Array(a);
    }

    var Ia,
        Ja = [],
        Ka = [],
        La = [];

    function Ma() {
      var a = h.preRun.shift();
      Ja.unshift(a);
    }

    var J = 0,
        Na = null,
        Pa = null;
    h.preloadedImages = {};
    h.preloadedAudios = {};

    function oa(a) {
      if (h.onAbort) h.onAbort(a);
      a = "Aborted(" + a + ")";
      ma(a);
      qa = !0;
      a = new WebAssembly.RuntimeError(a + ". Build with -s ASSERTIONS=1 for more info.");
      ba(a);
      throw a;
    }

    var Qa = "data:application/octet-stream;base64,",
        K;
    K = "data:application/octet-stream;base64,AGFzbQEAAAAB8ANEYAF/AX9gAX8AYAJ/fwF/YAJ/fwBgA39/fwF/YAN/f38AYAJ/fQBgAX8BfWADf319AGAHf319fX19fQBgBH9/f30AYAN/f30AYAN/fX8AYAR/f39/AGAAAX9gBn9/f39/fwBgBH9/f38Bf2AFf39/f38AYAAAYAF9AX1gBX99fX19AGADf399AX9gBn9/f31/fQBgB39/f39/f38AYAV/f39/fwF/YAJ9fQF9YAR/f319AGACf38BfWACf30Bf2ADfX19AX1gCH9/f39/f39/AGAKf39/f39/f39/fwBgAXwBfWACfH8BfGACf3wBf2ABfAF8YAZ/fH9/f38Bf2ADf35/AX5gDX9/f39/f39/f39/f38AYAN/f38BfGAFf39/f38BfGABfwF8YAN/fX0Bf2ABfwF+YAJ+fwF/YAF8AX9gAnx8AXxgA3x8fwF8YAZ/f39/fX8AYAd9fX9/f39/AGAGf399fX9/AGAEf319fwBgCH9/f399fX1/AX1gBn9/f39/fwF/YAR/f31/AGACf30BfWACfX0Bf2AEf39+fgBgAnx/AX9gAn1/AX9gB39/f39/f38Bf2ADf39/AX1gAn1/AXxgBH9/f30Bf2AFf39/fX0AYAN/f3wBf2AGf399fX19AGAIf399fX19fX0AAusBJwFhAWEAHgFhAWIAHwFhAWMAJgFhAWQAAgFhAWUADQFhAWYAHgFhAWcABQFhAWgAEQFhAWkAFwFhAWoABQFhAWsADQFhAWwAJwFhAW0ABAFhAW4AAAFhAW8ABQFhAXAADwFhAXEAKAFhAXIABQFhAXMAAwFhAXQAEgFhAXUAAAFhAXYAAgFhAXcAAQFhAXgAGAFhAXkAFwFhAXoAAQFhAUEAEAFhAUIAAAFhAUMAAgFhAUQAAwFhAUUAEQFhAUYAAwFhAUcAHwFhAUgAAQFhAUkADwFhAUoAAQFhAUsADwFhAUwAAQFhAU0AAAOaC5gLAgAAAQIBAQQpAAEFAAIBAAIAAwABAQICAgAAACoCAAAAAwUABQIRAAECAQQGAwIADgYCBgEBAAQBAAIDAgMCAwECAgMCAQQSGQIFBQMBBQIDASAgAgEAAwABCgoBBgYGGwMrAwAAAgIDGQEHAhIDCwIAAwMGAQADAAIEAwACAAIDAwEZAgMAExMFAQIEAQIDBgEDAAEs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AyAENgIYCyADIAM2AgwgAyADNgIIDAELIAQoAggiACADNgIMIAQgAzYCCCADQQA2AhggAyAENgIMIAMgADYCCAtBvNgBQbzYASgCAEEBayIAQX8gABs2AgALCykBAX8gAgRAIAAhAwNAIAMgAToAACADQQFqIQMgAkEBayICDQALCyAAC1QCAn8BfSMAQRBrIgEkAAJ9IAAoAgAgACgCBCABQQxqEPQEIgJFBEAgABDXAUMAAAAADAELIAAgACgCACACajYCACABKgIMCyEDIAFBEGokACADuwsHACAAQQhqCwMAAAsQACAAIAI2AgQgACABNgIACwgAIAAQiQGnCwgAIAAgARA3CwYAIAAQLQsKACAAEMUBGiAACxgBAX9BCBApIgIgATYCBCACIAA2AgAgAgsLACAAQgA3AgAgAAscAQF/IAAoAgAhAiAAIAEoAgA2AgAgASACNgIACwsAIABB/wFxQQBHCwsAIAAQRRogABAtCyEBAX8gACgCAARAIAAQUSAAKAIAIQEgABClAxogARAtCwsNACAAKAIAIAFBAnRqCwsAIAAgATYCACAACygBAX8gASABQQFrIgJxRQRAIAAgAnEPCyAAIAFPBH8gACABcAUgAAsLBAAgAAsoACAAQcDhACkCADcCECAAQbjhACkCADcCCCAAQbDhACkCADcCACAACwcAIABBDGoLEgAgACACOAIEIAAgATgCACAACwoAIAEgAGtBAnULGgAgAEHQtQE2AgAgAEEYahA8IAAQqQIaIAALBwAgAEEEagsHACAAQTRqCyEAIAAoAgQgABAwKAIARwRAIAAgARCUBQ8LIAAgARD8AguQAgIMfQN/IAFBABAnIQ8gAUEBECcqAgAhAyABQQIQJyEQIAFBAxAnKgIAIQQgAUEEECcqAgAhCyABQQUQJyoCACEMIAJBABAnIQEgAkEBECchESACQQIQJyoCACEFIAJBAxAnKgIAIQYgAkEEECcqAgAhByACQQUQJyoCACEIIABBABAnIA8qAgAiCSABKgIAIg2UIBAqAgAiCiARKgIAIg6UkjgCACAAQQEQJyADIA2UIAQgDpSSOAIAIABBAhAnIAkgBZQgCiAGlJI4AgAgAEEDECcgAyAFlCAEIAaUkjgCACAAQQQQJyALIAkgB5QgCiAIlJKSOAIAIABBBRAnIAwgAyAHlCAEIAiUkpI4AgALGAAgACgCFCIAEJsEBH8gABBHBUGk1wELCxgAIAAtAABBIHFFBEAgASACIAAQ2wIaCwsLACAAIAEQYUEARwttAQF/IwBBgAJrIgUkACAEQYDABHEgAiADTHJFBEAgBSABQf8BcSACIANrIgJBgAIgAkGAAkkiARsQLhogAUUEQANAIAAgBUGAAhBLIAJBgAJrIgJB/wFLDQALCyAAIAUgAhBLCyAFQYACaiQACwoAIAAQ8wRBAUYLCQAgACgCABAjCwoAIAAgAUEDdGoLCwAgACAAKAIAEGQLUAECfyMAQRBrIgMkAAJAAkACQAJAIAFBBGsOAgABAwsgAyACENEBIABBBGogAxCHAiADEGwMAQsgACACEDM2AhALQQEhBAsgA0EQaiQAIAQLIQAgASAAKgIwXARAIAAgATgCMCAAIAAoAgAoAjgRAQALCwwAQdzVASAAIAEQCQsUACABIAAgACgCACABKAIAEPoCGwsJACAAEEYoAgALJQECfyMAQRBrIgAkACAAQQhqEMABED4oAgAhASAAQRBqJAAgAQshACABIAAqAjRcBEAgACABOAI0IAAgACgCACgCPBEBAAsLWgECfyAAIAFB6ABrQQAgARsiAzYCKAJAIAAgA0YNAEEBIQIgASAAKAIQIAEoAgAoAgARAgAiAUUNACABQQsgASgCACgCDBECAEUNACAAIAE2AhRBACECCyACCxkAIAAoAgAgATgCACAAIAAoAgBBCGo2AgALCwAgAEHctAE2AgALFAAgAARAIAAgACgCACgCBBEBAAsLEQEBf0EEECkiASAANgIAIAELuQEBA38jAEEQayIDJAACf0EAIAAvASwgARBhIAFGDQAaIAAgAEEsaiABEJ4CLwEAIAAoAgAoAjARAwAgACgCKCIEQSxqQQIQngIaIAAoAiQiBSAEKALQAUkEQCAEIAU2AtABC0EBIAJFDQAaIAMgACgCGBAoIgI2AgggACgCHBAoIQADfyACIAAQKwR/IAIoAgAgAUEBEF4aIANBCGoQLCADKAIIIQIMAQVBAQsLCyEAIANBEGokACAACw8AIAAoAgAgACgCBDYCBAsJACAAKAIAEDALBwAgACABcQupAQIHfQR/IAFBABAnIQkgAUEBECchCiABQQIQJyELIAFBAxAnIQwgCioCACICIAkqAgAiAxCqASEGIAMgA5QgAiAClJIiBJEhBSADIAsqAgAiB5QgAiAMKgIAIgiUkiAEEKoBIQQgACABQQQQJyoCABC3ASAAIAFBBRAnKgIAENMBIAAgBRCGASAAIAMgCJQgAiAHlJMgBZUQhQEgACAGEIQBIAAgBBDSAQsYACAAIAEqAgA4AgAgACABKgIEOAIEIAALCQAgACABNgIECwQAQQALbQEBfyMAQRBrIgIkACACIAE2AgwgAEEYaiIBKAIAECggACgCHBAoIAJBDGoQzAIgACgCHBAoECtFBEACQCACQQxqIQAgASgCBCABEDAoAgBHBEAgASAAEJ8EDAELIAEgABD8AgsLIAJBEGokAAsPACAAIAAoAgAoAmQRAQALCgAgASAAa0EDdQsHACAAIAFGCygBAX8jAEEQayICJAAgAiABNgIMIABBmAFqIAJBDGoQSCACQRBqJAAL4gECCH0EfyABQQAQJyEKIAFBARAnIQsgAUECECchDCABQQMQJyENIAFBBBAnKgIAIQMgAUEFECchASAKKgIAIgQgDSoCACIFlCAMKgIAIgYgCyoCACIHlJMiCEMAAAAAXARAIAEqAgAhCSAAQQAQJyAFQwAAgD8gCJUiApQ4AgAgAEEBECcgAiAHjJQ4AgAgAEECECcgAiAGjJQ4AgAgAEEDECcgBCAClDgCACAAQQQQJyACIAYgCZQgAyAFlJOUOAIAIABBBRAnIAIgByADlCAJIASUk5Q4AgALIAhDAAAAAFwLEQAgABCYAQRAIAAoAgAQLQsLMwEBfyACBEAgACEDA0AgAyABLQAAOgAAIANBAWohAyABQQFqIQEgAkEBayICDQALCyAACwYAEJQBAAsHACABIACTC0cBAX8jAEEQayICJAAgAiAAIAEQjgE2AgggAhBXNgIAQQAhACACQQhqIAIQjQFFBEAgAkEIahBgKAIEIQALIAJBEGokACAAC0wBAn8gAUEAECchAyACQQAQJyEEIABBABAnIAMqAgAgBCoCAJM4AgAgAUEBECchASACQQEQJyECIABBARAnIAEqAgAgAioCAJM4AgALkAECBH8CfSABQQAQJyEDIAFBARAnIQEgAkEAECchBCACQQIQJyEFIAJBBBAnIQYgAEEAECcgBCoCACADKgIAIgeUIAEqAgAiCCAFKgIAlJIgBioCAJI4AgAgAkEBECchASACQQMQJyEDIAJBBRAnIQIgAEEBECcgByABKgIAlCAIIAMqAgCUkiACKgIAkjgCAAsJACAAIAE2AgALCQAgAEEAOgAACzcBAX8gASAAKAIEIgNBAXVqIQEgACgCACEAIAEgAiADQQFxBH8gASgCACAAaigCAAUgAAsRAwALNQEBfyABIAAoAgQiAkEBdWohASAAKAIAIQAgASACQQFxBH8gASgCACAAaigCAAUgAAsRAAALGQAgAEEEaiABQQRqEIEFIAAgASgCEDYCEAtJACAAEFsgAEGQtgE2AgAgAEEEakGVHRCIASAAQQA2AhAgAEEANgIUIABB0LUBNgIAIABBGGoQNhogAEH//wM7ASwgAEEANgIoC08BAXwgACAAoiIAIAAgAKIiAaIgAERpUO7gQpP5PqJEJx4P6IfAVr+goiABREI6BeFTVaU/oiAARIFeDP3//9+/okQAAAAAAADwP6CgoLYLSwECfCAAIACiIgEgAKIiAiABIAGioiABRKdGO4yHzcY+okR058ri+QAqv6CiIAIgAUSy+26JEBGBP6JEd6zLVFVVxb+goiAAoKC2CwoAIAAgAUE8bGoLDAAgABDiARogABAtCyIAIAAQlgQgAEEANgI8IABBnK8BNgIAIABBzK4BNgIAIAALGQAgACgCACABNgIAIAAgACgCAEEIajYCAAsSACAAEJgBBEAgACgCAA8LIAALCwAgAEHQkAE2AgALUgECfyABQQAQJyEEIAJBABAnIQUgAEEAECcgBSoCACADlCAEKgIAkjgCACABQQEQJyEBIAJBARAnIQIgAEEBECcgAioCACADlCABKgIAkjgCAAtcAgJ9AX8gAUEAECchBiABQQEQJyoCACEEIAJBABAnIQEgAEEAECcgAyABKgIAIAYqAgAiBZOUIAWSOAIAIAJBARAnIQEgAEEBECcgBCADIAEqAgAgBJOUkjgCAAsMACAAEPcBGiAAEC0LCQAgACABOAIQCwkAIAAgATgCDAsJACAAIAE4AggLNQEBfyABIAAoAgQiAkEBdWohASAAKAIAIQAgASACQQFxBH8gASgCACAAaigCAAUgAAsRBwALDgAgACABIAEQtAMQ1AQLnAECB38BfiMAQRBrIgMkAAJ+IAAoAgQhBSAAKAIAIgYhAQJAA0AgASAFTw0BIAEtAAAiB0H/AHGtIAJB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QQFrIQAMAQsgBCACawwDC0EAIQIMAQtBASECDAALAAsFQQALRSEECyAECxEAIAAgAEEBa3FFIABBAktxCxQAIAEgACABKAIAIAAoAgAQ+gIbCxEAIAAQxgIgAEEEaiABED4aCyEAIAAoAgQgABAwKAIASQRAIAAgARCUBQ8LIAAgARD8AgsHACAAEPYBC94CAQR/An0gACABkiAAvEH/////B3FBgYCA/AdJIAG8Qf////8HcUGAgID8B01xRQ0AGiABvCICQYCAgPwDRgRAIAAQpQUMAQsgAkEedkECcSIFIAC8IgNBH3ZyIQQCQAJAIANB/////wdxIgNFBEACQAJAIARBAmsOAgABAwtD2w9JQAwEC0PbD0nADAMLIAJB/////wdxIgJBgICA/AdHBEBD2w/JPyAAmCACRQ0DGkPbD8k/IACYIANBgICA/AdHIAJBgICA6ABqIANPcUUNAxoCfSAFBEBDAAAAACADQYCAgOgAaiACSQ0BGgsgACABlYsQpQULIQACQAJAAkAgBA4DBAABAgsgAIwMBQtD2w9JQCAAQy69uzOSkwwECyAAQy69uzOSQ9sPScCSDAMLIANBgICA/AdGDQEgBEECdEHwtgFqKgIAIQALIAAMAQsgBEECdEHgtgFqKgIACwsKACABIABrQTxtC60NAgx/CX0gACABEJ0CIAFBCBBMBEAgACgClAEhAyAAIAAoAgAoAmgRAAAhDSMAQZABayICJAAgAyADKAIAKAIIEQEAAkAgACgCmAEiASAAKAKcARBEIgpBAkkNAAJAIAFBABAnKAIAIgEQ3QEiDARAIAJBQGsgARDyARBjIgZBABAnKgIAIRIgBkEBECcqAgAhEyACQYgBaiABEMUCEGMiBkEAECcqAgAhDiAGQQEQJyoCACEQIAJBgAFqIgYgARCaASADIAZBABAnKgIAIhQgBkEBECcqAgAiFSADKAIAKAIUEQgADAELIAIgAkFAayABENkFIggqAjwiDjgCPAJAIA5DAAAAAF4EQCAAKAKYASAKQQFrECcoAgAhBiACQYgBaiAIEJoBIAJBgAFqEDghAQJAIAYQ3QEEQCACQTBqIAYQxQIQYxoMAQsgAkEwaiAGEJoBCyABIAJBMGoiBiACQYgBahBxIAIgARCSASIOOAIsIAFBABAnIgQgBCoCACAOlTgCACABQQEQJyIEIAQqAgAgAioCLJU4AgAgACgCmAFBARAnKAIAIQQgBhA4IQYCQCAEEN0BBEAgAkEgaiAEEPIBEGMaDAELIAJBIGogBBCaAQsgBiACQSBqIgcgAkGIAWoiBBBxIAIgBhCSASIOOAIcIAZBABAnIgUgBSoCACAOlTgCACAGQQEQJyIFIAUqAgAgAioCHJU4AgAgAkEsaiACQRxqIAJBPGoQkwEQkwEqAgAhDiAHEDgiByAEIAEgDhCBASADIAdBABAnKgIAIhIgB0EBECcqAgAiEyADKAIAKAIUEQgAIAJBEGoQOCIHIAQgASAOQ+465T6UIhAQgQEgAkEIahA4IgEgBCAGIBAQgQEgAhA4IgUgBCAGIA4QgQEgAyAHQQAQJyoCACAHQQEQJyoCACABQQAQJyoCACABQQEQJyoCACAFQQAQJyoCACIOIAVBARAnKgIAIhAgAygCACgCHBEJAAwBCyACQYgBaiIBIAgQmgEgAyABQQAQJyoCACISIAFBARAnKgIAIhMgAygCACgCFBEIACATIRAgEiEOCyAIEEUaIBMhFSASIRQLQQEhCCAMIQECQANAIAggCkYEQAJAIA1FDQQgASAMckEBcUUNACADIA4gECASIBMgFCAVIAMoAgAoAhwRCQAMAwsFAkAgACgCmAEgCBAnKAIAIgQQ3QEiBgRAIAJBQGsgBBDyARBjIQEgAkGIAWoiByAEEJoBIAMgDiAQIAFBABAnKgIAIAFBARAnKgIAIAdBABAnKgIAIAdBARAnKgIAIAMoAgAoAhwRCQAgAkGAAWogBBDFAhBjIgFBABAnKgIAIQ4gAUEBECcqAgAhEAwBCyACQUBrIgcgBBDZBRogAkGIAWogBxCaASACIAIqAnwiDzgCPAJAIA9DAAAAAF4EQCACQYABahA4IgcgAkEwaiIEIA4gEBBDIAJBiAFqEHEgAiAHEJIBIg84AiwgB0EAECciBSAFKgIAIA+VOAIAIAdBARAnIgUgBSoCACACKgIslTgCACAAKAKYASAIQQFqIApwECcoAgAhBSAEEDghBAJAIAUQ3QEEQCACQSBqIAUQ8gEQYxoMAQsgAkEgaiAFEJoBCyAEIAJBIGoiBSACQYgBaiIJEHEgAiAEEJIBIg84AhwgBEEAECciCyALKgIAIA+VOAIAIARBARAnIgsgCyoCACACKgIclTgCACACQSxqIAJBHGogAkE8ahCTARCTASoCACEPIAUQOCIFIAkgByAPEIEBIAVBABAnKgIAIREgBUEBECcqAgAhFgJAIAFBAXEEQCADIA4gECARIBYgESAWIAMoAgAoAhwRCQAMAQsgAyARIBYgAygCACgCGBEIAAsgAkEQahA4IgEgAkGIAWoiBSAHIA9D7jrlPpQiDhCBASACQQhqEDgiByAFIAQgDhCBASACEDgiCSAFIAQgDxCBASADIAFBABAnKgIAIAFBARAnKgIAIAdBABAnKgIAIAdBARAnKgIAIAlBABAnKgIAIg4gCUEBECcqAgAiECADKAIAKAIcEQkADAELIAJBiAFqIgRBABAnKgIAIQ8gBEEBECcqAgAhEQJAIAFBAXEEQCADIA4gECAPIBEgDyARIAMoAgAoAhwRCQAMAQsgAyAPIBEgAygCACgCGBEIAAsgESEQIA8hDgsgAkFAaxBFGgsgCEEBaiEIIAYhAQwBCwsgAyAUIBUgAygCACgCGBEIAAsgAyADKAIAKAIgEQEACyACQZABaiQACwsoACAAEMcCIABCADcCUCAAQdjAADYCACAAQgA3AlggAEH0PzYCACAAC/4CAgF8A38jAEEQayICJAACQCAAvCIEQf////8HcSIDQdqfpPoDTQRAIANBgICAzANJDQEgALsQeiEADAELIANB0aftgwRNBEAgALshASADQeOX24AETQRAIARBAEgEQCABRBgtRFT7Ifk/oBB5jCEADAMLIAFEGC1EVPsh+b+gEHkhAAwCC0QYLURU+yEJwEQYLURU+yEJQCAEQQBOGyABoJoQeiEADAELIANB1eOIhwRNBEAgALshASADQd/bv4UETQRAIARBAEgEQCABRNIhM3982RJAoBB5IQAMAwsgAUTSITN/fNkSwKAQeYwhAAwCC0QYLURU+yEZwEQYLURU+yEZQCAEQQBOGyABoBB6IQAMAQsgA0GAgID8B08EQCAAIACTIQAMAQsCQAJAAkACQCAAIAJBCGoQmAVBA3EOAwABAgMLIAIrAwgQeiEADAMLIAIrAwgQeSEADAILIAIrAwiaEHohAAwBCyACKwMIEHmMIQALIAJBEGokACAAC+gCAgN/AXwjAEEQayIBJAACfSAAvCIDQf////8HcSICQdqfpPoDTQRAQwAAgD8gAkGAgIDMA0kNARog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BBArBEAgASgCACIBBEAgASABKAIAKAIEEQEACyACQQhqECwgAigCCCEBDAELCyADEDwgABD3ARogAkEQaiQAIAALwQEBA38CQCABIAIoAhAiAwR/IAMFIAIQ1wQNASACKAIQCyACKAIUIgVrSwRAIAIgACABIAIoAiQRBAAPCwJAIAIoAlBBAEgEQEEAIQMMAQsgASEEA0AgBCIDRQRAQQAhAwwCCyAAIANBAWsiBGotAABBCkcNAAsgAiAAIAMgAigCJBEEACIEIANJDQEgACADaiEAIAEgA2shASACKAIUIQULIAUgACABEG0aIAIgAigCFCABajYCFCABIANqIQQLIAQLEQAgAEE4IAAoAgAoAgwRAgALGgAgAUGlAUYEQCAAIAIQMzYCBAsgAUGlAUYLeAICfwF8IwBBEGsiAyQAAn9BmNUBLQAAQQFxBEBBlNUBKAIADAELQQFB0B0QAyEEQZjVAUEBOgAAQZTVASAENgIAIAQLIAEgAiADQQxqQQAQECEFIANBCGogAygCDBA+IQEgACAFEM0BEOUCIAEQtAEgA0EQaiQACwwAIABBswgQJhA+GgsQACAAIAFBgICAgHhyNgIICwsAQRgQKSAAELUBCyQAIABBC08EfyAAQRBqQXBxIgAgAEEBayIAIABBC0YbBUEKCwsMACABIAAoAgARAAALEQAgAEECIAAoAgAoAgwRAgALCQAgACABEJkBCwoAIABBBGoQzgQLOQEBfyABIAAoAgQiBEEBdWohASAAKAIAIQAgASACIAMgBEEBcQR/IAEoAgAgAGooAgAFIAALEQUAC2ECAn8BfSABIAAqAgRcBEAgACABOAIEIAAqAgggACoCDJMhBCAAKAIAIgItACgEQCACKAIgIQMLIAIoAhAhAiAAQQE2AhQgACABIAIgA2yykyIBOAIIIAAgASAEkzgCDAsLIQAgASAAKgJUXARAIAAgATgCVCAAIAAoAgAoAkgRAQALCyEAIAEgACoCUFwEQCAAIAE4AlAgACAAKAIAKAJEEQEACwsMACAAENQBGiAAEC0LBwAgACoCBAsMAEGG1gEgACABEAkLDABBhdYBIAAgARAJCy0BAX8jAEEQayIEJAAgASACIAQgACADEPgEIgBBBGoQ9gQgABBfIARBEGokAAsuAQF/EPkEIAFJBEAQbgALIAAgARApIgI2AgAgACACNgIEIAAQMCABIAJqNgIACy0BAX8gACEBQQAhAANAIABBA0cEQCABIABBAnRqQQA2AgAgAEEBaiEADAELCwsnAQF/IwBBEGsiAiQAIAIgATYCDCAAQRxqIAJBDGoQSCACQRBqJAALCQAgACABEIoFCxIAIAAgASoCMDgCMCAAIAEQdwuKAwIHfwF9IwBBEGsiBSQAIAUgACgCxAEQKCICNgIIIAG2IQkgACgCyAEQKCEGA38gAiAGECsEfyACKAIAIQIjAEEQayIDJAAgAigCsAEEfyADIAIoArQBECgiBDYCCCACKAK4ARAoIQcDfyAEIAcQKwR/IAQoAgAiBCAJIAIoArABIAQoAgAoAjwRDAAgA0EIahAsIAMoAgghBAwBBSACKAKwASAJuxD1AgsLBUEACxogA0EQaiQAIAVBCGoQLCAFKAIIIQIMAQVBACEEAkAgAC8BLCICEIgFIgZFDQAgACgCoAEgACgCpAEQRCEHA0AgAhCIBUUgBEHjAEtyDQEgACACQf//A3FB/f8DEGE7ASxBACECA0ACQCACIAdGDQAgACgCoAEgAhAnKAIAIQMgACACNgLQASADLwEsIggEQCADQQA7ASwgAyAIIAMoAgAoAjQRAwAgACgC0AEgAkkNAQsgAkEBaiECDAELCyAEQQFqIQQgAC8BLCECDAALAAsgBUEQaiQAIAYLCwsoAQF/IwBBEGsiAiQAIAIgATYCDCAAQZQBaiACQQxqEEggAkEQaiQACygBAX8gACgCACEBIABBADYCACABBEAgABBGLQAEGiABBEAgARAtCwsLFgBBAUEgIABBAWtna3QgACAAQQJPGwsHACAAEPcCCwcAIAAgAUkLVwECfyMAQRBrIgIkACACIAE2AgwgARCRBSIDTQRAIAAQpQMiACADQQF2SQRAIAIgAEEBdDYCCCACQQhqIAJBDGoQVSgCACEDCyACQRBqJAAgAw8LEG4AC2kBAn8jAEEgayIDJAAgABAwIQIgA0EIaiAAIAAoAgAgACgCBBBEQQFqEPsCIAAoAgAgACgCBBBEIAIQlgIiAigCCCABKAIAEHMgAiACKAIIQQRqNgIIIAAgAhCVAiACEJQCIANBIGokAAspAQJ/IwBBEGsiASQAIAFBCGoiAiAAEJkBIAIoAgAhACABQRBqJAAgAAsHAD8AQRB0CysAIAAgAENr0w28lEO6Ey+9kpRDdaoqPpIgAJQgAEOu5TS/lEMAAIA/kpULEQAgAEENIAAoAgAoAgwRAgALMQAgABB4IABC/////w83AjAgAEHkLjYCACAAQQA2AkAgAEIANwI4IABBnC42AgAgAAsMACAAKAIEQQE6AAQLGQAgACABNgIIIAAgAjYCBCAAQbSJATYCAAsRACAAQRggACgCACgCDBECAAvLAQECfyMAQRBrIgEkAAJAIAC9QiCIp0H/////B3EiAkH7w6T/A00EQCACQYCAwPIDSQ0BIABEAAAAAAAAAABBABDZASEADAELIAJBgIDA/wdPBEAgACAAoSEADAELAkACQAJAAkAgACABEJcFQQNxDgMAAQIDCyABKwMAIAErAwhBARDZASEADAMLIAErAwAgASsDCBDYASEADAILIAErAwAgASsDCEEBENkBmiEADAELIAErAwAgASsDCBDYAZohAAsgAUEQaiQAIAALxwEBAn8jAEEQayIBJAACfCAAvUIgiKdB/////wdxIgJB+8Ok/wNNBEBEAAAAAAAA8D8gAkGewZryA0kNARogAEQAAAAAAAAAABDYAQwBCyAAIAChIAJBgIDA/wdPDQAaAkACQAJAAkAgACABEJcFQQNxDgMAAQIDCyABKwMAIAErAwgQ2AEMAwsgASsDACABKwMIQQEQ2QGaDAILIAErAwAgASsDCBDYAZoMAQsgASsDACABKwMIQQEQ2QELIQAgAUEQaiQAIAALPgECfyAAQdTsADYCACAAQbwBaiIBKAIABEAgASABKAIAENMFIAEoAgAhAiABENIFGiACEC0LIAAQnQEaIAALCAAgAEH4AWoLQgEBfyAAQYjqADYCACAAKAI0IgEEQCABIAEoAgAoAgQRAQALIAAoAjgiAQRAIAEgASgCACgCBBEBAAsgABBFGiAACxQBAX8gACgCFCIBBEAgASAAEGYLC10AIAAgASACIAAoAgAoAhQRCAAgACABIAOSIgMgAiAAKAIAKAIYEQgAIAAgAyACIASSIgIgACgCACgCGBEIACAAIAEgAiAAKAIAKAIYEQgAIAAgACgCACgCIBEBAAshAQF/IAAoAgAEQCAAEFEgACgCACEBIAAQ+AUaIAEQLQsLVwECfyAAQfSAATYCACAAQUBrEDwgAEE0ahA8IABBKGoiASgCAARA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ABAtIAAQMEEANgIAIABCADcCAAsLIAAgAUHMAUYEQCAAIAIQMzYCEEEBDwsgACABIAIQxwMLOQAgABC7AyAAQQA6AGYgAEEBOwFkIABBADYCYCAAQoCAgPwDNwJYIABByJ4BNgIAIABBuJ0BNgIACzcAAkACQAJAIAFBswFrDgIAAQILIAAgAhAzNgI8QQEPCyAAIAIQMzYCQEEBDwsgACABIAIQ7QELngEAAkACQAJAAkACQAJAAkACQAJAAkAgAUG2AWsODgECAwgICAQFBgcICAgACAsgACACEDM2AkQMCAsgACACEC+2OAJIDAcLIAAgAhAvtjgCTAwGCyAAIAIQL7Y4AlAMBQsgACACEE46AFQMBAsgACACEE46AFUMAwsgACACEE46AFYMAgsgACACEE46AFcMAQsgACABIAIQuAMPC0EBCyAAIAAQuwIgAEIANwI8IABBoKIBNgIAIABByKEBNgIAC0QAIAAQugMgAEIANwJMIABCgICAgICAgMA/NwJEIABB0KABNgIAIABBADoAVCAAQQA6AFcgAEEBOwBVIABB2J8BNgIACx8AIAFBxgFGBEAgACACEDM2AjBBAQ8LIAAgASACEFILHwAgABB4IABBfzYCMCAAQcTpADYCACAAQfjoADYCAAsrACAAEL0DIABBgICA/AM2AjQgAEGQ5wA2AgAgAEEANgI4IABBwOYANgIACwQAQQELGgAgAUGbAUYEQCAAIAIQMzYCBAsgAUGbAUYLIAAgAUGcAUYEQCAAIAIQMzYCCEEBDwsgACABIAIQwAMLHwAgABBbIABBfzYCBCAAQeiaATYCACAAQbCaATYCAAsgACAAEMIDIABBADYCCCAAQYSZATYCACAAQciYATYCAAsJACAAQQRqEDwLIwAgABBbIABBsI4BNgIAIABBBGpBlR0QiAEgAEGAjgE2AgALJwAgABC4ASAAQQE6AC4gAEGEkwE2AgAgAEIANwIwIABBsJIBNgIACzgBAX8jAEEQayIDJAAgAUHLAUYEQCADIAIQ0QEgAEEEaiADEIcCIAMQbAsgA0EQaiQAIAFBywFGC5QDAQR/IwBBIGsiAiQAIABBrMMANgJoIABBxMIANgIAIAIgAEH8AGoiBCgCABAoIgE2AhggACgCgAEQKCEDA0AgASADECtFBEACQCAALQDgAQ0AIAIgACgCiAEQKDYCECAAKAKMARAoIQMDQCACKAIQIgEgAxArRQRAIAIgACgClAEQKDYCCCAAKAKYARAoIQMDQCACKAIIIgEgAxArRQ0DIAEoAgAiAQRAIAEgASgCACgCBBEBAAsgAkEIahAsDAALAAsgASgCACIBBEAgASABKAIAKAIEEQEACyACQRBqECwMAAsACyAAKALYASIBBEAgASABKAIAKAIEEQEACyAAKALUASIBBEAgASABKAIAKAIEEQEACyAAQcQBahA8IABBuAFqEDwgAEGsAWoQPCAAQaABahA8IABBlAFqEDwgAEGIAWoQPCAEEDwgAEHsAGoQxAMgABBFGiACQSBqJAAgAA8LIAEoAgAiASAARiABRXJFBEAgASABKAIAKAIEEQEACyACQRhqECwgAigCGCEBDAALAAsjACAAEFsgAEHs1QA2AgAgAEEEakGVHRCIASAAQfjUADYCAAsfACAAQQA2AgwgAEKAgID8AzcCBCAAQZyEATYCACAACyIAIAAQWyAAQfTMADYCACAAQQRqEDYaIABBpM0ANgIAIAALxwECBX8BfCAAEMkDIABBADYCECAAQcTUADYCACAAQYjUADYCACAAQgA3AhQgAEHE0wA2AgAgAEGA0wA2AgAgAEGo1QA2AgAgAEG80gA2AgAjAEEQayIBJAAgARDfAiABQQhqIgQgASgCAEGVFBDeAiABEE8gASgCCCEDIwBBEGsiAiQAIANBntUBIAJBDGoQCyEGIAJBCGogAigCDBA+IQMgBhDNASEFIAMQtAEgAkEQaiQAIAQQTyABQRBqJAAgACAFNgIcIAALGwAgABDJAyAAQZzPADYCACAAQczPADYCACAAC1IAIAAQeCAAQgA3AkQgAEKAgICAgICAwD83AjwgAEKAgID8AzcCNCAAQX82AjAgAEHokwE2AgAgAEHElAE2AgAgAEHMAGoQQRogAEEANgJkIAALVQAgABC4ASAAQgA3AkAgAEKAgICAgICAwD83AjggAEKAgID8AzcCMCAAQdSBATYCACAAQayCATYCACAAQcgAahBBGiAAQeAAahA2GiAAQQA2AmwgAAskACAAENICGiAAQgA3AqABIABBsPQANgIAIABBmPUANgIAIAALRQEBfyAAELACIABBfzYCrAEgAEGc1gA2AgAgAEGwAWoiAUGU2AA2AgAgAEGQ1wA2AgAgAUGI2AA2AgAgAEEANgK0ASAACygAIAAQsQIaIABBgICA+AM2AsgBIABBwIUBNgIAIABBqIQBNgIAIAALTQEDfyAAEOoBIABBgLEBNgIAIABBqKUBNgIAIABBtAFqEH0hASAAQfQBahB9IQIgAEG0AmoQfSEDIAAgARBqIAAgAhBqIAAgAxBqIAALdQEEfyAAEOoBIABCADcCuAEgAEEBOgC0ASAAQZjzADYCACAAQgA3AsABIABBgPIANgIAIABByAFqEH0hASAAQYgCahB9IQIgAEHIAmoQfSEDIABBiANqEH0hBCAAIAEQaiAAIAIQaiAAIAMQaiAAIAQQaiAAC0QBAX8gABCBBCAAQQA6AKQBIABByOoANgIAIABBqAFqIgFBADYCBCABQcjsADYCACAAQcDrADYCACABQbzsADYCACAAC1gBAX8gABCwAiAAQeT+ADYCACAAQawBahCDBSAAQYj9ADYCACAAQbwBaiIBEHggAUIANwI0IAEgADYCMCABQYjqADYCACAAQfgBahA2GiAAQQA6AIQCIAALIgAgABDGAyAAQQA2AjggAEHszQA2AgAgAEHEzgA2AgAgAAtUAQF/IAAQeCAAQgA3AjAgAEH8sgE2AgAgAEIANwI4IABBQGsiAUHssgE2AgAgAEGEsgE2AgAgAUHcsgE2AgAQ/QEhASAAQQA2AkggACABNgJEIAALJQAgABB4IABC/////w83AjAgAEH8zwA2AgAgAEHE0AA2AgAgAAs5AQF/IAAQeCAAQfTo0Xs2AjAgAEGEgwE2AgAgAEE0ahDKAyEBIABByIMBNgIAIAFBkIQBNgIAIAALOwAgABDGAyAAQQE6AEQgAEEANgJAIABCgICA/AM3AjggAEHokAE2AgAgAEEANgJIIABBzJEBNgIAIAALLgAgABCyAhogAEHQ7wA2AkQgAEH07gA2AgAgAEG48AA2AkQgAEHc7wA2AgAgAAsiACAAEK0CIABBADoAECAAQbSIATYCACAAQeiIATYCACAACxsAIAAQwwMgAEHQlgE2AgAgAEGMlwE2AgAgAAsiACAAEL4DIABBADYCPCAAQejjADYCACAAQbzkADYCACAACxsAIAAQvQMgAEHg5wA2AgAgAEGs6AA2AgAgAAsbACAAEK0CIABBwIwBNgIAIABB8IwBNgIAIAALGQAgABCxASAAQbwzNgIAIABBjDM2AgAgAAtJACAAEI0CGiAAQQA6ACggAEJ/NwIgIABCgICA/AM3AhggAEK8gICAwAc3AhAgAEGI4AA2AgAgAEHU4AA2AgAgAEEsahA2GiAACywAIAAQjQIaIABB9IYBNgIAIABBpIcBNgIAIABBEGoQNhogAEEcahA2GiAACyIAIAAQ4QEgAEEANgIYIABBmNsANgIAIABB3NsANgIAIAALIgAgABDhASAAQQA2AhggAEGg3AA2AgAgAEHk3AA2AgAgAAsxACAAEMUDIABBhIoBNgIAIABBtIoBNgIAIABBEGoQNhogAEEANgIkIABCADcCHCAACyIAIAAQwwMgAEEANgIMIABByJcBNgIAIABBiJgBNgIAIAALIgAgABDhASAAQQA6ABggAEGQ2gA2AgAgAEHU2gA2AgAgAAsiACAAEOEBIABBfzYCGCAAQajdADYCACAAQezdADYCACAACykAIAAQWyAAQQA2AgQgAEGY2QA2AgAgAEHI2QA2AgAgAEEIahA2GiAACxsAIAAQwgMgAEHAmQE2AgAgAEH4mQE2AgAgAAsiACAAEK0CIABBADYCECAAQdiLATYCACAAQYyMATYCACAACykAIAAQWyAAQQA2AgQgAEGg2AA2AgAgAEHQ2AA2AgAgAEEIahA2GiAACy0AIAAQvgMgAEEAOgBAIABBgICA/AM2AjwgAEGQ5QA2AgAgAEHo5QA2AgAgAAs0ACAAELACIABBfzYCrAEgAEGA4gA2AgAgAEEANgKwASAAQfTiADYCACAAQbQBahA2GiAACy0AIAAQuwMgAEH4+AA2AgAgAEHw+QA2AgAgAEHYAGoQnAEgAEHwAGoQnAEgAAstACAAELcDIABB6PoANgIAIABB+PsANgIAIABB6ABqEJwBIABBgAFqEJwBIAALLQAgABC6AyAAQaCVATYCACAAQfiVATYCACAAQcQAahCcASAAQdwAahCcASAACxsAIAAQtwMgAEGYmwE2AgAgAEGonAE2AgAgAAsyACAAELsCIABBADYCQCAAQQA6ADwgAEGM0QA2AgAgAEHk0QA2AgAgAEHEAGoQNhogAAsSACAAIAI6AAQgACABNgIAIAALSAECfyMAQRBrIgEkACMAQRBrIgIkACACQQhqIABBCGooAgAQPigCACEAIAJBEGokACABQQhqIAAQPigCACEAIAFBEGokACAAC8ICAQl/IwBBEGsiCCQAIAAgARDMBSIBEMABEGlFBEAgCEEIaiABED4oAgAhAiMAQSBrIgYkACAGQRhqIAIQPhC2AiAGQQhqIQkjAEEQayIKJAAgACIBEFYhAyABIAIoAgQgAxA/IgQQPSgCACEAA0AgACIFKAIAIgAgAkcNAAsCQCAFIAFBCGpHBEAgBSgCBCADED8gBEYNAQsgAigCACIABEAgACgCBCADED8gBEYNAQsgASAEED1BADYCAAtBACEAAkAgAigCACIHRQ0AIAciACgCBCADED8iByAERg0AIAEgBxA9IAU2AgAgAigCACEACyAFIAA2AgAgAkEANgIAIAEQQiIAIAAoAgBBAWs2AgAgCSACIApBCGogARAwQQEQ9gMQjgIaIApBEGokACAJEPcCIAZBIGokAAsgCEEQaiQACy0BAX8jAEEQayIBJAAgASAAKAIENgIIIAFBCGoQswIoAgAhACABQRBqJAAgAAsIACAAIAEQKwsLACAAIAEQKBC1AgtHAQF/IwBBEGsiASQAIAEgAEEfEI4BNgIIIAEQVzYCAEEAIQAgAUEIaiABEI0BRQRAIAFBCGoQYCgCBCEACyABQRBqJAAgAAsHACAALQAoCxkAIAAQsQEgAEG0NzYCACAAQYQ3NgIAIAALGQAgABCxASAAQZQ1NgIAIABB5DQ2AgAgAAsVACAAIAEoAowBNgKMASAAIAEQtwILMwAgABDoARogAEEANgKMASAAQaipATYCACAAQgA3ApABIABBtKgBNgIAIABBmAFqEDYaCzYAIABBlCw2AgAgAEHUA2oQRRogAEH0AmoQRRogAEGUAmoQRRogAEG0AWoQRRogABCdARogAAtfAQR/IAAQ6gEgAEGYLTYCACAAQZQsNgIAIABBtAFqEK0BIQEgAEGUAmoQrQEhAiAAQfQCahCtASEDIABB1ANqEK0BIQQgACABEGogACACEGogACADEGogACAEEGogAAspACAAELgBIABBfzYCMCAAQYDCADYCACAAQQA2AjQgAEG8wQA2AgAgAAskACAAELsCIABCgICglgQ3AjwgAEGEMDYCACAAQawvNgIAIAALNgEBfyABQQAQJyEDIABBABAnIAMqAgAgApQ4AgAgAUEBECchASAAQQEQJyABKgIAIAKU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AToAAAtCAQF/An9BuNUBLQAAQQFxBEBBtNUBKAIADAELQQFBkCAQAyECQbjVAUEBOgAAQbTVASACNgIAIAILIAAgAUEAEAQLDAAgACABKQIANwIACykBAX8jAEEQayICJAAgAiAANgIMIAJBDGogARDbBBB+IAJBEGokACAACyYAIABBvCc2AgAgAC0ADARAIAAoAhBBzQwQzwQLIABBEGoQTyAAC4IBAQN/IAEQmAFFBEAgACABKAIINgIIIAAgASkCADcCAA8LIAEoAgAhAwJAAkACQCABKAIEIgJBCk0EQCAAIgEgAhCBAgwBCyACQXBPDQEgACACEOICQQFqIgQQKSIBEHMgACAEEOACIAAgAhBkCyABIAMgAkEBahCzARoMAQsQbgALC1UBAn8gAkFwSQRAAkAgAkEKTQRAIAAgAhCBAiAAIQMMAQsgACACEOICQQFqIgQQKSIDEHMgACAEEOACIAAgAhBkCyADIAEgAhCzASACahB0DwsQbgALKQEBfyMAQRBrIgIkACACIAE2AgwgAkEMaiAAEQAAIQAgAkEQaiQAIAALBgAgABBHC1kBAX8gACAAKAJIIgFBAWsgAXI2AkggACgCACIBQQhxBEAgACABQSByNgIAQX8PCyAAQgA3AgQgACAAKAIsIgE2AhwgACABNgIUIAAgASAAKAIwajYCEEEACywBAX8gABCjAUEEahCYAiIBIAAQowE2AgAgAUEEaiAAEH8gABCjARBtGiABC4EBAQR/IwBBEGsiAiQAIAIgAEEEaiIDKAIAECgiATYCCCAAKAIIECghBANAIAEgBBArRQRAIAAoAgAiAARAIAAgACgCACgCBBEBAAsgAxA8IAJBEGokAA8LIAEoAgAiAQRAIAEgASgCACgCBBEBAAsgAkEIahAsIAIoAgghAQwACwALOQEBfyABIAAoAgQiBEEBdWohASAAKAIAIQAgASACIAMgBEEBcQR/IAEoAgAgAGooAgAFIAALEQsACw4AIAAoAgAQJSAAKAIACxEAIAAgAUEEaiABKAIAEPsEC3IBBH8jAEEQayIDJAAjAEEQayICJAAgAiADQQhqIgU2AgQgAkEIaiIEIAEQ0AQgAigCBCAEKAIANgIAIAIoAgQgBCgCBDYCBCACIAIoAgRBCGo2AgQgAkEQaiQAIABBhNgBIAUQHDYCACADQRBq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EFUoAgAQjAUgBiAAEFYiAxA/IQcLAkAgACAHED0oAgAiAkUEQCABKAIQIABBCGoiAigCADYCACACIAEoAhA2AgAgACAHED0gAjYCACABKAIQKAIARQ0BIAEoAhAhAiAAIAEoAhAoAgAoAgQgAxA/ED0gAjYCAAwBCyABKAIQIAIoAgA2AgAgAiABKAIQNgIACyABQRBqIgAQkAIhAiAEIAQoAgBBAWo2AgAgABD5AkEBCyEAIAggAUEQaiACED4gABCPAiABQSBqJAAgBSgCCBAwIQAgBUEQaiQAIABBBGoLGQAgACABNgKwASABRAAAAAAAAAAAEPUCGgulAQEFfyMAQRBrIgMkACMAQRBrIgIkAAJAAkAgABBWIgRFDQAgACABIAQQPyIFED0oAgAiAEUNAANAIAAoAgAiAEUNASABIAAoAgQiBkcEQCAGIAQQPyAFRg0BDAILIABBCGogARCSAkUNAAsgAkEIaiAAED4oAgAhAAwBCyACEMABIgA2AggLIAJBEGokACADQQhqIAAQPigCACEAIANBEGokACAACykAIABBuB02AgAgAEE0ahA8IABBKGoQPCAAQRxqEDwgAEEIahC7ASAACxoAIAAQWyAAQdTEADYCACAAQajEADYCACAAC9oBAQJ/IAAgAUcEQCAAEJgBRQRAIAEQmAFFBEAgACABKAIINgIIIAAgASkCADcCAA8LIAEQfyECAkAgARCjASIBQQpNBEAgACABEIECIAAgAiABELMBIAFqEHQMAQsgAEEKIAFBCmsgAC0ACyIAIAAgASACEJsFCw8LIAEQfyECIAEQowEhAQJAIAEgACgCCEH/////B3EiA0kEQCAAKAIAIQMgACABEGQgAyACIAEQswEgAWoQdAwBCyAAIANBAWsgASADa0EBaiAAKAIEIgAgACABIAIQmwULCwssACAAELgBIABBgICA/AM2AjAgAEGIrQE2AgAgAEGItQE2AgAgAEE0ahBBGgsRACAAQQA6AAAgAEEEahA2GguyAQEBfyAAEIIFIABCADcCUCAAQQE6AEwgAEG4wwA2AgAgAEIANwJYIABCADcCYCAAQegAaiIBQZzEADYCACAAQewAahCDBSAAQcTCADYCACABQazDADYCACAAQfwAahA2GiAAQYgBahA2GiAAQZQBahA2GiAAQaABahA2GiAAQawB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EDwgABDUARogAkEQaiQAIAALCgAgACABQQZ0agsMACAALwEAIAEQvQULDAAgABCHAxogABAtCygBAX8gACgCPCIBBEAgASAAKAIwIAAqAjgQoQQgASgCACgCBBEDAAsLKgEBfyAAQayCATYCACAAKAJsIgEEQCABEC0LIABB4ABqEDwgABBFGiAACw8AIAAgAC0AACABcjoAAAsuACAAQYj9ADYCACAAQfgBahA8IABBvAFqEIkDGiAAQawBahDEAyAAEOMBGiAAC0UAIAAgASoCWDgCWCAAIAEqAlw4AlwgACABKgJgOAJgIAAgAS0AZDoAZCAAIAEtAGU6AGUgACABLQBmOgBmIAAgARDJBQsdACAAIAEoAjw2AjwgACABKAJANgJAIAAgARC8AgsJACAAQf//A3ELWQAgACABKAJENgJEIAAgASoCSDgCSCAAIAEqAkw4AkwgACABKgJQOAJQIAAgAS0AVDoAVCAAIAEtAFU6AFUgACABLQBWOgBWIAAgAS0AVzoAVyAAIAEQxwULPgAgACABKgIAOAIAIAAgASoCBDgCBCAAIAEqAgg4AgggACABKgIMOAIMIAAgASoCEDgCECAAIAEqAhQ4AhQLDAAgABDUAhogABAtC44BAQV/IwBBEGsiAiQAIAEQyAUhAwJAAkAgABBWIgRFDQAgACADIAQQPyIFED0oAgAiAEUNAANAIAAoAgAiAEUNASADIAAoAgQiBkcEQCAGIAQQPyAFRg0BDAILIABBCGogARDABUUNAAsgAkEIaiAAED4oAgAhAAwBCyACEMABIgA2AggLIAJBEGokACAACzcAIABBgPIANgIAIABBiANqEEUaIABByAJqEEUaIABBiAJqEEUaIABByAFqEEUaIAAQnQEaIAALDAAgABCWAxogABAtCyEAIAAgASgCtAE2ArQBIAAgASoCuAE4ArgBIAAgARDmAQsOACAAQQBBwAAQLhB9GgsQACAAIAAoAgAoAgARAAAaCxIAIAAQMCgCACAAKAIAa0EGdQspAQF/IAAoAgQhAgNAIAEgAkcEQCACQUBqIgIQ0QUMAQsLIAAgATYCBAsPACAAIAAoAgBBQGs2AgALkQkBC38jAEEQayIKJAAgAUEIEEwEQAJAIABBvAFqIgUoAgAgACgCwAEQnAIgACAAKAIAKAKEAREAAEYNACAAIAAoAgAoAoQBEQAAIQcCQCAHIAUoAgAiAyAFKAIEEJwCIgJLBEAjAEEgayIMJAACQCAHIAJrIgkgBRAwKAIAIAUoAgQiA2tBBnVNBEAjAEEQayIDJAAgAyAFNgIAIAMgBSgCBCICNgIEIAMgAiAJQQZ0ajYCCCADKAIEIQIgAygCCCEHA0AgAiAHRgRAIAMQXyADQRBqJAAFIAIQ0AUgAyACQUBrIgI2AgQMAQsLDAELIAUQMCEHIAxBCGohBAJ/IAUoAgAgAxCcAiAJaiEIIwBBEGsiBiQAIAYgCDYCDCMAQRBrIgIkACACQf///x82AgwgAkH/////BzYCCCACQQxqIAJBCGoQpgEoAgAhAyACQRBqJAAgCCADIgJNBEAgBRDSBSIDIAJBAXZJBEAgBiADQQF0NgIIIAZBCGogBkEMahBVKAIAIQILIAZBEGokACACDAELEG4ACyEIIAUoAgAgBSgCBBCcAiEDIARBDGogBxCnASAEIAgEfyAIQYCAgCBPBEAQlAEACyAIQQZ0ECkFQQALIgI2AgAgBCACIANBBnRqIgM2AgggBCADNgIEIAQQQiACIAhBBnRqNgIAIwBBEGsiAyQAIAMgBCgCCDYCACAEKAIIIQIgAyAEQQhqNgIIIAMgAiAJQQZ0ajYCBCADKAIAIQIDQCADKAIEIAJHBEAgAhDQBSADIAMoAgBBQGsiAjYCAAwBCwsgAxDOASADQRBqJAAgBSgCACEHIAUoAgQhBiAEQQRqIQsDQCAGIAdHBEAgCygCAEFAaiICEFsgAkGQtgE2AgAgAiAGQUBqIgZBBGoiAykCADcCBCACIAMoAgg2AgwgAxDxAiACIAYoAhA2AhAgAkHQtQE2AgAgAiAGKAIUNgIUIAJBGGoQxQEhAyACIAZBGGoiCSgCADYCGCACIAkoAgQ2AhwgCRAwIQggAxAwIAgoAgA2AgAgCEEANgIAIAlCADcCACACIAYvASw7ASwgAiAGKQIkNwIkIAJBjK4BNgIAIAJBzK0BNgIAIAJBuLABNgIAIAIgBikCMDcCMCACQeyvATYCACACIAYoAjg2AjggAkGcrwE2AgAgAiAGKgI8OAI8IAJBzK4BNgIAIAsgCygCAEFAajYCAAwBCwsgBSALEDkgBUEEaiAEQQhqEDkgBRAwIAQQQhA5IAQgBCgCBDYCACAEKAIEIQIDQCACIAQoAggiA0cEQCAEIANBQGoiAzYCCCADENEFDAELCyAEKAIAIgMEQCAEEEIoAgAgBCgCAGsaIAMQLQsLIAxBIGokAAwBCyACIAdLBEAgBSADIAdBBnRqENMFCwsgAEGYAWoiAhBRIAogACgCvAEQKCIHNgIIIAAoAsABECghAwNAIAcgAxArRQ0BIAogBzYCBCACIApBBGoQqAEgCkEIahDUBSAKKAIIIQcMAAsACyAAIAAoAgAoAogBEQEACyAAIAEQrAEgCkEQaiQACzoAAkACQAJAIAFB/QBrDgIAAQILIAAgAhAzNgK0AUEBDwsgACACEC+2OAK4AUEBDwsgACABIAIQugILBwAgAEE4agtiAQN/IwBBEGsiASQAIAAoAjAgABBmIAEgACgCMBCIAyICKAIAECgiAzYCCCACKAIEECghAgNAIAMgAhArBEAgAygCACAAEGYgAUEIahAsIAEoAgghAwwBBSABQRBqJAALCwuxAQAgABBbIABBkLYBNgIAIABBBGogAUEEahDTBCAAIAEoAhA2AhAgAEHQtQE2AgAgACABKAIUNgIUIABBGGogAUEYahCHBBogACABLwEsOwEsIAAgASkCJDcCJCAAQYyuATYCACAAQcytATYCACAAQbiwATYCACAAIAEpAjA3AjAgAEHsrwE2AgAgACABKAI4NgI4IABBnK8BNgIAIAAgASoCPDgCPCAAQcyuATYCACAACxsAIABBCEEAEF4aIAAoApABIgAEQCAAENsFCwtqAQJ/IABBvAFqQQhBARBeGiMAQRBrIgIkACACIAAoArABECgiATYCCCAAKAK0ARAoIQADQCABIAAQKwRAIAEoAgAiARCEAwRAIAEoAkgQXAsgAkEIahAsIAIoAgghAQwBCwsgAkEQaiQACxwAIAAQigMgACAAKAKQAUGsAWpBABDcATYClAELAwABCxMAIAAgASoCNDgCNCAAIAEQ6wELLwECfwJAIAFBAEgNACAAKAJ8IgMgACgCgAEQRCABTA0AIAMgARAnKAIAIQILIAILDAAgABDiBRogABAtCx8BAX9BIBApIgIgASAAKAIwEIwCEOwBGiAAIAI2AjgLGQAgAEHA5gA2AgAgACgCOBAtIAAQRRogAAscAQF/QcABEClBAEHAARAuEPADIgEgABCkAyABC0EBAX8gAEH04gA2AgAgACgCsAEiAS0A4AEQOkUgAUVyRQRAIAEgASgCACgCBBEBAAsgAEG0AWoQPCAAEOMBGiAACywBAX8gAEHQ4QA2AgAgACgCaCIBBEAgASABKAIAKAIEEQEACyAAEI0DGiAAC1AAIAAQyQQgAEH0gAE2AgAgAEEEahA2GiAAQRBqEDYaIABBHGoQNhogAEEoahA2GiAAQTRqEDYaIABBQGsQNhogAEEANgJMIABB0ABqEEEaCw0AIAIgASAAk5QgAJILCgAgACABQQNsagtkAQN/IwBBEGsiCSQAIABBKGogCUEIaiIHQQEgAEEEaiIIKAIAIAAoAggQaEH/AXEQ7AUQ6wUgCCAHIAEgAhBDEN4BIAggByADIAQQQxDeASAIIAcgBSAGEEMQ3gEgCUEQaiQACxYAIAAgAS8AADsAACAAIAEtAAI6AAILugQBB38gACgCBCAAEDAoAgBJBEAjAEEQayICJAAgAiAANgIAIAIgACgCBCIANgIEIAIgAEEDajYCCCACKAIEIAEQ6gUgAiACKAIEQQNqNgIEIAIQXyACQRBqJAAPCyMAQSBrIggkACAAEDAhByAIQQhqIQICfyAAIgUoAgAgACgCBBCVA0EBaiEEIwBBEGsiBiQAIAYgBDYCDCMAQRBrIgMkACADQdWq1aoFNgIMIANB/////wc2AgggA0EMaiADQQhqEKYBKAIAIQAgA0EQaiQAIAAgBE8EQCAFEPkFIgQgAEEBdkkEQCAGIARBAXQ2AgggBkEIaiAGQQxqEFUoAgAhAAsgBkEQaiQAIAAMAQsQbgALIQMgBSgCACAFKAIEEJUDIQAgAkEMaiAHEKcBIAIgAwR/IANB1qrVqgVPBEAQlAEACyADQQNsECkFQQALIgQ2AgAgAiAEIABBA2xqIgA2AgggAiAANgIEIAIQQiAEIANBA2xqNgIAIAIoAgggARDqBSACIAIoAghBA2o2AgggAkEEaiIEIgAgACgCACAFKAIEIAUoAgAiAWsiB0F9bUEDbGoiADYCACAHQQBKBEAgACABIAcQbRoLIAUgBBA5IAVBBGogAkEIahA5IAUQMCACEEIQOSACIAIoAgQ2AgAgAigCBCEAIAIoAgghAQNAIAAgAUcEQCACIAFBA2siATYCCAwBCwsgAigCACIABEAgAhBCKAIAIAIoAgBrGiAAEC0LIAhBIGokAAsZACAAQQA6AAIgACACOgABIAAgAToAACAAC0gBAn8jAEEQayIDJAAgAEEoaiADQQhqQQAgAEEEaiIEKAIAIAAoAggQaEH/AXEQ7AUQ6wUgBCADIAEgAhBDEN4BIANBEGokAAsnAQF/IwBBEGsiAyQAIABBBGogA0EIaiABIAIQQxDeASADQRBqJAALBwAgABA4GgskACAAIAE2AgAgACABKAIEIgE2AgQgACABIAJBA3RqNgIIIAALawEDfyAAKAIAIQQgACgCBCEDIAFBBGohAgNAIAMgBEcEQCACKAIAQQhrIANBCGsiAxCQAyACIAIoAgBBCGs2AgAMAQsLIAAgAhA5IABBBGogAUEIahA5IAAQMCABEEIQOSABIAEoAgQ2AgALCQAgACABELcBCwkAIAAgARDQBAtiAgF/AX0jAEEQayICJAAgAiAAQQAQJyoCACABQQAQJyoCAJOLOAIMIAIgAEEBECcqAgAgAUEBECcqAgCTizgCCCACQQxqIAJBCGoQygEqAgAhAyACQRBqJAAgA0MAAIA/XguwAQECfyAAKAIEIAAQMCgCAEcEQCMAQRBrIgIkACACIAAQkgUiACgCBCABKgIAEPIFIAAgACgCBEEEajYCBCAAEF8gAkEQaiQADwsjAEEgayIDJAAgABAwIQIgA0EIaiAAIAAoAgAgACgCBBBEQQFqEPsCIAAoAgAgACgCBBBEIAIQlgIiAigCCCABKgIAEPIFIAIgAigCCEEEajYCCCAAIAIQlQIgAhCUAiADQSBqJAALNgEBfSABQQAQJyoCACAAQQAQJyoCAJMiAiAClCABQQEQJyoCACAAQQEQJyoCAJMiAiAClJKRC60HAgt/An0jAEEQayIJJAAgCSABNgIMIwBBEGsiCCQAAkACQCABQTRqIgooAgAgASgCOBBpDQACQCACQQAQJyoCACABQdAAaiIDQQAQJyoCAFwNACACQQEQJyoCACADQQEQJyoCAFwNACACQQIQJyoCACADQQIQJyoCAFwNACACQQMQJyoCACADQQMQJyoCAFwNACACQQQQJyoCACADQQQQJyoCAFwNACACQQUQJyoCACADQQUQJyoCAFshBAsgBEUNACABKgJMIQ4MAQsgASACKQIANwJQIAEgAikCEDcCYCABIAIpAgg3AlggChBRIAFBHGoiDBBRIAEoAgQgASgCCBBoIQMCQCADIAFBEGoiBCgCACIGIAQoAgQQaCIFSwRAIwBBIGsiCyQAAkAgAyAFayIFIAQQMCgCACAEKAIEIgNrQQN1TQRAIwBBEGsiBiQAIAYgBCAFEPAFIgQoAgQhAyAEKAIIIQUDQCADIAVGBEAgBBBfIAZBEGokAAUgAxDvBSAEIANBCGoiAzYCBAwBCwsMAQsgBBAwIQYgC0EIaiAEIAQoAgAgAxBoIAVqEJMDIAQoAgAgBCgCBBBoIAYQkgMhBiMAQRBrIgMkACADIAYoAgg2AgAgBigCCCENIAMgBkEIajYCCCADIA0gBUEDdGo2AgQgAygCACEFA0AgAygCBCAFRwRAIAUQ7wUgAyADKAIAQQhqIgU2AgAMAQsLIAMQzgEgA0EQaiQAIAQgBhDxBSAGEJEDCyALQSBqJAAMAQsgAyAFSQRAIAQgBiADQQN0ahDPAQsLIAEoAgQgASgCCBBoIQQDQCABKAIQIQMgBCAHRgRAIANBABBQIQIgCCABKAIoECgiBzYCCCABKAIsECghBEEBIQMDQCAHIAQQKwRAAn8gBy0AAEUEQCAIIAIgASgCECADEFAiAhD2BSIPOAIEIAogCEEEahD1BSADQQFqDAELIAcgASgCHCABKAIgEGgiBUEBajoAACAIIAIgAkEIaiACQRBqIAJBGGoiAkMAAAAAQwAAAABDAACAPyAMEJQDIg84AgAgCiAIEPUFIAcgASgCHCABKAIgEGggBWs6AAIgA0EDagshAyAOIA+SIQ4gCCAIKAIIQQNqNgIIIAgoAgghBwwBBSABIA44AkwLCwUgAyAHEFAgASgCBCAHEFAgAhByIAdBAWohBwwBCwsLIAhBEGokACAAIA4gACoCTJI4AkwgAEFAayAJQQxqEKgBIAlBEGokAAsSACAAEDAoAgAgACgCAGtBA3ULEgAgABAwKAIAIAAoAgBrQQNtCywAIABBADYCTCAAQRxqEFEgAEEEahBRIABBKGoQUSAAQTRqEFEgAEFAaxBRCxgAQwAAAAAgAEMAAIA/liAAQwAAAABdGws6ACAAIAEqAjA4AjAgACABKgI0OAI0IAAgASoCODgCOCAAIAEqAjw4AjwgACABKgJAOAJAIAAgARB3CwcAIAAQpwILxAIBBn9BASEGAkACQAJAAkACQAJAIAEgAGtBAnUOBgUFAAECAwQLIAFBBGsiASgCACAAKAIAIAIoAgARAgBFDQQgACABEDlBAQ8LIAAgAEEEaiABQQRrIAIQwQEaQQEPCyAAIABBBGogAEEIaiABQQRrIAIQmAMaQQEPCyAAIABBBGogAEEIaiAAQQxqIAFBBGsgAhCXAxpBAQ8LIAAgAEEEaiAAQQhqIgUgAhDBARogAEEMaiEDA0AgASADRg0BAkAgAygCACAFKAIAIAIoAgARAgAEQCADKAIAIQggAyEEA0ACQCAEIAUiBCgCADYCACAAIARGBEAgACEEDAELIAggBEEEayIFKAIAIAIoAgARAgANAQsLIAQgCDYCACAHQQFqIgdBCEYNAQsgAyIFQQRqIQMMAQsLIANBBGogAUYhBgsgBgs8AQF/IAEoAhQhAiAAIAE2AgwgAkEVIAIoAgAoAgwRAgAiAQRAIAAgAiAAIAIoAgAoAkARAgA2AggLIAELkwQDBH4BfwJ8AnwgALshBwJAIAG3Igi9IgRCAYYiA1AgBEL///////////8Ag0KAgICAgICA+P8AVnJFBEAgB70iBUI0iKdB/w9xIgZB/w9HDQELIAcgCKIiCCAIowwBCyADIAVCAYYiAloEQCAHRAAAAAAAAAAAoiAHIAIgA1EbDAELIARCNIinQf8PcSEBAn4gBkUEQEEAIQYgBUIMhiICQgBZBEADQCAGQQFrIQYgAkIBhiICQgBZDQALCyAFQQEgBmuthgwBCyAFQv////////8Hg0KAgICAgICACIQLIQICfiABRQRAQQAhASAEQgyGIgNCAFkEQANAIAFBAWshASADQgGGIgNCAFkNAAsLIARBASABa62GDAELIARC/////////weDQoCAgICAgIAIhAshBCABIAZIBEADQAJAIAIgBH0iA0IAUw0AIAMiAkIAUg0AIAdEAAAAAAAAAACiDAMLIAJCAYYhAiAGQQFrIgYgAUoNAAsgASEGCwJAIAIgBH0iA0IAUw0AIAMiAkIAUg0AIAdEAAAAAAAAAACiDAELAkAgAkL/////////B1YEQCACIQMMAQsDQCAGQQFrIQYgAkKAgICAgICABFQhASACQgGGIgMhAiABDQALCyAFQoCAgICAgICAgH+DIANCgICAgICAgAh9IAatQjSGhCADQQEgBmutiCAGQQBKG4S/CwsdACAALQAoBH0gACgCILIFQwAAAAALIAAoAhCylQt4AQR/IwBBEGsiAiQAIABB1OAANgIAIAIgAEEsaiIDKAIAECgiATYCCCAAKAIwECghBANAIAEgBBArBEAgASgCACIBBEAgASABKAIAKAIEEQEACyACQQhqECwgAigCCCEBDAELCyADEDwgABDUARogAkEQaiQAIAALEgAgAEHIACAAKAIAKAIMEQIACycBAX8jAEEQayICJAAgAiABNgIMIABBBGogAkEMahBIIAJBEGokAAshACABIAAoAiRHBEAgACABNgIkIAAgACgCACgCPBEBAAsLIQAgASAAKAIMRwRAIAAgATYCDCAAIAAoAgAoAiwRAQALCyEAIAEgACgCCEcEQCAAIAE2AgggACAAKAIAKAIoEQEACwsjACABIAAoAqwBRwRAIAAgATYCrAEgACAAKAIAKAJoEQEACwsjACABIAAoAowBRwRAIAAgATYCjAEgACAAKAIAKAJcEQEACwshACABIAAoAhBHBEAgACABNgIQIAAgACgCACgCKBEBAAsL9ggAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCABQdwAaw4mHyAdHx0dHR0dHR8gHR0dHR0dGBkaGx0dHRMdHyAfBh0dFh0dFQEACwJAAkACQAJAAkAgAUGVAWsOICIhJgwhISYLIQ0hDiEhISEmIRMHISEUIQEhJSEhJQIlAAsCQCABQShrDh4YISEhISEhIRUWISYhJiEhIg8hEBESISEhISEmCAkACwJAIAFBwwFrDgwDIQYjISEhISEgIRsACyABQRdGDQMgAUEFRw0gDCELIAIgACgCNEcEQCAAIAI2AjQgACAAKAIAKAJEEQEACw8LIAIgACgCPEcEQCAAIAI2AjwgACAAKAIAKAJIEQEACw8LIAIgACgCREcEQCAAIAI2AkQgACAAKAIAKAJQEQEACw8LIAAgAhCJBg8LIAIgACgCkAFHBEAgACACNgKQASAAIAAoAgAoAmARAQALDwsgACACEIgGDwsgAiAAKAIMRwRAIAAgAjYCDCAAIAAoAgAoAigRAQALDwsgACACEIcGDwsgACACEIYGDwsgACACEJ0DDwsgAiAAKAIIRwRAIAAgAjYCCCAAIAAoAgAoAjARAQALDwsg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ACABIAIqAhA4AgwMAQtBEBApIgEgAiADEIMDIAFBADoADCABQfCJATYCAAsgAygCDCAAQQJ0aiABNgIAIABBAWohACADKAIIIQEMAQsLIQADQCADKAIQIABLBEAgAygCFCAAQSxsaiECIAQoAhAiASAEKAIUEEQgAEsEfyABIAAQJygCAAVBAAsiASgCHCIFIAUoAgAoAiQRAAAhBSACIAE2AgAgAiAFNgIEIAIgASgCIBC8BRogAEEBaiEADAELCyADCzcBAX8gASAAKAIEIgNBAXVqIQEgACgCACEAIAEgAiADQQFxBH8gASgCACAAaigCAAUgAAsRHAALDgBBIBApIAAoAgAQ7AELOwEBfyABIAAoAgQiBUEBdWohASAAKAIAIQAgASACIAMgBCAFQQFxBH8gASgCACAAaigCAAUgAAsRGgALDgAgASACIAAoAgARAwALCwAgASAAEEoQtgELDwAgASAAKAIAEQAAEOECCwkAIAAQ1AEQLQs3AQF/IAEgACgCBCIDQQF1aiEBIAAoAgAhACABIAIgA0EBcQR/IAEoAgAgAGooAgAFIAALESIACxAAIAEgAiADIAAoAgARBQALCgAgASAAIAIQSQsOACABIAIgACgCABECAAsIACABIAAQawsHACAAEQ4ACwgAQRgQKRBBCwoAIABBDGoQzgQLOQEBfyABIAAoAgQiBEEBdWohASAAKAIAIQAgASACIAMgBEEBcQR/IAEoAgAgAGooAgAFIAALEQQACz0BAX8gASAAKAIEIgZBAXVqIQEgACgCACEAIAEgAiADIAQgBSAGQQFxBH8gASgCACAAaigCAAUgAAsRFAALQQEBfyABIAAoAgQiCEEBdWohASAAKAIAIQAgASACIAMgBCAFIAYgByAIQQFxBH8gASgCACAAaigCAAUgAAsRCQALOQEBfyABIAAoAgQiBEEBdWohASAAKAIAIQAgASACIAMgBEEBcQR/IAEoAgAgAGooAgAFIAALEQgACz8BAX8gASAAKAIEIgdBAXVqIQEgACgCACEAIAEgAiADIAQgBSAGIAdBAXEEfyABKAIAIABqKAIABSAACxEPAAs9AQF/IAEgACgCBCIGQQF1aiEBIAAoAgAhACABIAIgAyAEIAUgBkEBcQR/IAEoAgAgAGooAgAFIAALEREAC6ktBBh/AX0BfgF8IwBB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AEIANwMIIAAQ7QMMOwtBCBApIgBCADcDACAAEOwDDDoLQRQQKSIAQgA3AwAgAEEANgIQIABCADcDCCAAEOsDDDkLQRwQKSIAQgA3AwAgAEEANgIYIABCADcDECAAQgA3AwggABDqAww4C0EcECkiAEIANwMAIABBADYCGCAAQgA3AxAgAEIANwMIIAAQ6QMMNwtBEBApIgBCADcDACAAQgA3AwggABDoAww2C0EQECkiAEIANwMAIABCADcDCCAAEOIDGgw0C0EoEClBAEEoEC4Q5wMMNAtBEBApIgBCADcDACAAQgA3AwggABCNAgwzC0HAABApQQBBwAAQLhCTBAwyC0EkEClBAEEkEC4Q1QIMMQtBHBApIgBCADcDACAAQQA2AhggAEIANwMQIABCADcDCCAAEOYDDDALQRwQKSIAQgA3AwAgAEEANgIYIABCADcDECAAQgA3AwggABDlAwwvC0EoEClBAEEoEC4Q5AMMLgtBEBApIgBCADcDACAAQgA3AwggABD/AxoMLAtBOBApQQBBOBAuEOMDDCwLQRAQKSIAQgA3AwAgAEIANwMIIAAQ4QMMKwtBHBApIgBCADcDACAAQQA2AhggAEIANwMQIABCADcDCCAAELUEGgwpC0E0EClBAEE0EC4Q4AMMKQtBEBApIgBCADcDACAAQgA3AwggABD+AxoMJwtBIBApIgBCADcDACAAQgA3AxggAEIANwMQIABCADcDCCAAEL8EGgwmC0HAABApQQBBwAAQLhDfAwwmC0EMECkiAEIANwMAIABBADYCCCAAEN4DDCULQSwQKUEAQSwQLiIAELAEGgwjC0EUECkiAEIANwMAIABBADYCECAAQgA3AwggABDdAwwjC0EQECkiAEIANwMAIABCADcDCCAAEMUEGgwhC0HkABApQQBB5AAQLhCyAgwhC0HkABApQQBB5AAQLhDcAwwgC0HMABApQQBBzAAQLhDbAwwfC0HEABApQQBBxAAQLhDaAwweC0E4EClBAEE4EC4Q2QMMHQtBzAAQKSIAENgDGgwbC0E8EClBAEE8EC4Q1wMMGwtBiAIQKSIAENYDGgwZC0HAABApQQBBwAAQLhB9DBkLQdwAEClBAEHcABAuIgAQlwQaDBcLQbABEClBAEGwARAuENUDDBcLQcgDECkQ1AMMFgtB2AAQKUEAQdgAEC4i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pAENAQsgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILdAECfyMAQRBrIgMkACADIAAoAnwQKCICNgIIIAAoAoABECghAANAAkAgAiAAECtFBEBBACECDAELAkAgAigCACICRQ0AIAIQ0AFFDQAgAhBGIAEQpAENAQsgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILdAECfyMAQRBrIgMkACADIAAoAnwQKCICNgIIIAAoAoABECghAANAAkAgAiAAECtFBEBBACECDAELAkAgAigCACICRQ0AIAIQ5AJFDQAgAhBGIAEQpAENAQsgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILdAECfyMAQRBrIgMkACADIAAoAnwQKCICNgIIIAAoAoABECghAANAAkAgAiAAECtFBEBBACECDAELAkAgAigCACICRQ0AIAIQ/wFFDQAgAhBGIAEQpAENAQsgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILBgBB4dYBC2MBAn8jAEEQayIDJAAgAyAAKAIEECgiAjYCCCAAKAIIECghAANAAkAgAiAAECtFBEBBACECDAELIAIoAgAiAhBGIAEQpAENACADQQhqECwgAygCCCECDAELCyADQRBqJAAgAgshAQJ/IAAoAgQiAiAAKAIIEGkEf0EABSACQQAQJygCAAsLEAAgAARAIAAQ2QQLIAAQLQsGAEHe1gELBwAgACoCFAsHACAAKgIQCwcAIAAqAggLBgBBrtUBCxYAIAAgARB/Qc7WASACKAIAEAwQmQELQQEBf0EUECkiAUIANwIEIAFCADcCBCABQdAnNgIAIAFBDGoQdCABQbwnNgIAIAFBEGogABD+ASABQagnNgIAIAELBgBBztYBCxAAIAAgAjYCCCAAIAE2AgQLBgBBzNYBCxYAIAAgARB/QYnWASACKAIAEAwQmQELMwEBf0EMECkiAUHYJTYCACABQQRqEHQgAUGgJTYCACABQQhqIAAQ/gEgAUHoJDYCACABCwYAQYnWAQsGAEGH1gELFgAgACABEH9B39UBIAIoAgAQDBCZAQs4AQF/QQwQKSIBEMkEIAFBzCI2AgAgAUEEahB0IAFBmCI2AgAgAUEIaiAAEP4BIAFB5CE2AgAgAQsGAEHf1QELBgBB3dUBCxYAIAAgARB/QazVASACKAIAEAwQmQELTAECfyMAQSBrIgMkACADQQhqIgQgARDcBCADIAIQ5QIgA0EYaiIBIAQgAyAAEQUAIAEQ2wQhACABEE8gAxBPIAQQbCADQSBqJAAgAAszAQF/QQwQKSIBQfAfNgIAIAFBBGoQdCABQcgfNgIAIAFBCGogABD+ASABQaAfNgIAIAELBgBBrNUBCzkBAn8jAEEgayIFJAAgACAFQQhqEEEiBiABIAIgAyAEEPEEIAAgBiAAKAIAKAIQEQMAIAVBIGokAAsGAEGp1QEL4AEBBX8jAEEgayIBJAAgASAAKAIcECgiAjYCGCAAQQhqIQMgACgCIBAoIQQDfyACIAQQKwR/IAEgAyACKAIAIgIoAqwBEP4ENgIQIAEQVzYCCAJAIAFBEGogAUEIahDbAUUNACABQRBqEGAoAgQiBUUNACACIAUQ/QQLIAFBGGoQLCABKAIYIQIMAQUgASAAKAI0ECg2AhggAEEoaiECIAAoAjgQKAsLIQADQCABKAIYIgMgABArBEAgAygCACIDIAIgAygCACgCABEDACABQRhqECwMAQsLIAFBIGokAEEACwkAIAAQ/wQQLQsHACABQRdGCwQAQRcLEgBBBBApIgBBADYCACAAEIAFCw4AIAAoAgRBABDzAkEBCwoAIAAoAgQQtgULDAAgAUH+/wNxQQpGCwQAQQsLFQBBASEAIAFB2wBGIAFBCmtBAklyCwUAQdsAC2IBAX9B5AEQKUEAQeQBEC4QhAUiASAALQBMOgBMIAEgACoCUDgCUCABIAAqAlQ4AlQgASAAKgJYOAJYIAEgACoCXDgCXCABIAAqAmA4AmAgASAAKgJkOAJkIAEgABD0AiABCx8AIAEgAC0A4QFHBEAgACABOgDhASAAQQhBABBeGgsLJgECfyAAKAKUASIDIAAoApgBEEQgAUsEfyADIAEQJygCAAVBAAsLZQECfyMAQRBrIgMkACADIAAoApQBECgiAjYCCCAAKAKYARAoIQADQAJAIAIgABArRQRAQQAhAgwBCyACKAIAIgIQRiABEKQBDQAgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILZQECfyMAQRBrIgMkACADIAAoAogBECgiAjYCCCAAKAKMARAoIQADQAJAIAIgABArRQRAQQAhAgwBCyACKAIAIgIQRiABEKQBDQAgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILMAEBfSABKgJQIQIgACABKgJUOAIMIAAgAjgCCCAAQwAAAAA4AgQgAEMAAAAAOAIACyQBAX9BEBApIgFCADcDACABQgA3AwggARCNAiIBIAAQigEgAQsiAQF+IAEgAq0gA61CIIaEIAQgABElACIFQiCIpxAZIAWnCwMAAAuoAQEFfyAAKAJUIgMoAgAhBSADKAIEIgQgACgCFCAAKAIcIgdrIgYgBCAGSRsiBgRAIAUgByAGEG0aIAMgAygCACAGaiIFNgIAIAMgAygCBCAGayIENgIECyAEIAIgAiAESxsiBARAIAUgASAEEG0aIAMgAygCACAEaiIFNgIAIAMgAygCBCAEazYCBAsgBUEAOgAAIAAgACgCLCIBNgIcIAAgATYCFCACC48FAgZ+AX8gASABKAIAQQdqQXhxIgFBEGo2AgAgAAJ8IAEpAwAhAyABKQMIIQYjAEEgayIIJAACQCAGQv///////////wCDIgRCgICAgICAwIA8fSAEQoCAgICAgMD/wwB9VARAIAZCBIYgA0I8iIQhBCADQv//////////D4MiA0KBgICAgICAgAhaBEAgBEKBgICAgICAgMAAfCECDAILIARCgICAgICAgIBAfSECIANCgICAgICAgIAIhUIAUg0BIAIgBEIBg3whAgwBCyADUCAEQoCAgICAgMD//wBUIARCgICAgICAwP//AFEbRQRAIAZCBIYgA0I8iIRC/////////wODQoCAgICAgID8/wCEIQIMAQtCgICAgICAgPj/ACECIARC////////v//DAFYNAEIAIQIgBEIwiKciAEGR9wBJDQAgAyECIAZC////////P4NCgICAgICAwACEIgUhBwJAIABBgfcAayIBQcAAcQRAIAIgAUFAaq2GIQdCACECDAELIAFFDQAgByABrSIEhiACQcAAIAFrrYiEIQcgAiAEhiECCyAIIAI3AxAgCCAHNwMYAkBBgfgAIABrIgBBwABxBEAgBSAAQUBqrYghA0IAIQUMAQsgAEUNACAFQcAAIABrrYYgAyAArSICiIQhAyAFIAKIIQULIAggAzcDACAIIAU3AwggCCkDCEIEhiAIKQMAIgNCPIiEIQIgCCkDECAIKQMYhEIAUq0gA0L//////////w+DhCIDQoGAgICAgICA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ASAAKAI8IAEoAgAoAhARAwALGwEBfyAAKAIwIgEgACoCOCABKAIAKAIIEQYAC04BAX8gACAAKAIAKAI4EQAABEAgACgCSCIDBEAgAyACIAMoAgAoAgARAgAhAgsgASACIAIoAgAoAiQRAAAgACgCMCABKAIAKAIUEQUACwsTACAALQAuIAAqAjhDAAAAAF5xC1MAIAAgARCoAiIBQQAgASgCACgCABEDACABIAAqAjggASgCACgCCBEGACABIAAoAjwgASgCACgCEBEDACABIABBQGsoAgAgASgCACgCDBEDACABCw4AQQJBBCAALQBEEDobCygBAX9BwAAQKUEAQcAAEC4iARB9GiABIAAqAjw4AjwgASAAEPQBIAELIAAgAUEaRgRAIAAgAhAvtjgCPEEBDwsgACABIAIQxgELGABB4QQgAUEFayIAdiAAQf//A3FBCklxCwQAQQULGgEBf0EkEClBAEEkEC4Q1QIiASAAEK8EIAELHwBBACEAAkAgAUUNACABEL8BRQ0AIAEoAhQhAAsgAAshAEEAIQACQCABRQ0AIAEoAgQQvwFFDQAgARAwIQALIAALHQAgAUE8EHAiAUUEQEEBDwsgASgCBCAAEIQGQQALawECfyMAQRBrIgMkACADIAAoAhgQKCICNgIIIAAoAhwQKCEAA0ACQCACIAAQK0UEQEEAIQIMAQsgAigCACICIAEgAigCACgCHBECACICDQAgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILawECfyMAQRBrIgMkACADIAAoAhgQKCICNgIIIAAoAhwQKCEAA0ACQCACIAAQK0UEQEEAIQIMAQsgAigCACICIAEgAigCACgCGBECACICDQAgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILCwAgAUHBAGtBAkkLBQBBwQALCQAgABDWAhAtCyQBAX9BEBApIgFCADcDACABQgA3AwggARDhAyIBIAAQigEgAQs1AQF/QRQQKSIBQgA3AwAgAUEANgIQIAFCADcDCCABEO0DIgEgACoCEDgCECABIAAQigEgAQsnAQF/QRAQKSIBQgA3AwAgAUIANwMIIAEQsQEgACgCBCABEJsDQQEL9wEBB38jAEEQayICJAAgAiAAKAIEIgQoAhAQKCIBNgIIIAQoAhQQKCEEAn8CQANAIAEgBBArRQ0BAkAgASgCACIBEL8BRQ0AIAEoAhAiA0F/Rg0AIAEgACgCCCADEIwCIgM2AhQgAw0AQQEMAwsgAiABKAIEECg2AgAgASgCCBAoIQMCQANAIAIoAgAiASADECsEQCABKAIAIgUoAgQiAUEASA0CIAAoAgQiBigCECIHIAYoAhQQRCABSQ0CIAUgByABECcoAgA2AhQgAhAsDAELCyACQQhqECwgAigCCCEBDAELC0ECDAELQQALIQAgAkEQaiQAIAALGgEBf0EoEClBAEEoEC4Q5wMiASAAEIoBIAELHAAgARDMASIBRQRAQQEPCyABKAIEIAAQmwNBAAtrAQJ/IwBBEGsiAyQAIAMgACgCEBAoIgI2AgggACgCFBAoIQADQAJAIAIgABArRQRAQQAhAgwBCyACKAIAIgIgASACKAIAKAIcEQIAIgINACADQQhqECwgAygCCCECDAELCyADQRBqJAAgAgu6AQEEfyMAQRBrIgMkACADIAAoAhAQKCICNgIIIAAoAhQQKCEFAkADQCACIAUQKwRAIAIoAgAiAiABIAIoAgAoAhgRAgAiBA0CAkACQAJAAkAgAiACKAIAKAIIEQAAQT5rDgMAAQIDCyAAIAI2AhwMAgsgACACNgIgDAELIAAgAjYCJAsgA0EIahAsIAMoAgghAgwBCwsgACgCJEVBAXRBAiAAKAIgG0ECIAAoAhwbIQQLIANBEGokACAECw0AIAFBOUYgAUE2RnILBABBOQsJACAAELgFEC0LCQAgAEEAOgAMCxwAIAEQzAEiAUUEQEEBDwsgASgCBCAAEPICQQALDgAgACgCBEEAEPICQQELNwECf0EUECkiAUIANwMAIAFBADYCECABQgA3AwggARDdAyECIAEgAC0AEDoAECABIAAQigEgAgsaAQF/QSgQKUEAQSgQLhDkAyIBIAAQigEgAQscACABQQEQcCIBBH8gASgCBCAAEPYCQQAFQQELC7ABAQN/IwBBEGsiAyQAIAMgACgCHBAoIgI2AgggACgCIBAoIQQCQANAIAIgBBArBEAgAigCACICIAEgAigCACgCHBECACICDQIgA0EIahAsIAMoAgghAgwBCwsgAyAAKAIQECg2AgAgACgCFBAoIQADQCADKAIAIgIgABArRQRAQQAhAgwCCyACKAIAIgIgASACKAIAKAIcEQIAIgIN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ASAAEIQGQQALFQEBf0GIAhApENYDIgEgABCjAyABC/4CAQZ/IwBBEGsiBCQAAkAgACoCcEMAAAAAWw0AIwBBEGsiAiQAAkAgACgClAEgACgCmAEQRCIFRQ0AIAEgASgCACgCCBEBACACIAAoApQBECgiAzYCCCAAKAKYARAoIQYDQCADIAYQK0UNASADKAIAIgMtADgQOgRAIAEgAygCTCABKAIAKAIYEQMACyACQQhqECwgAigCCCEDDAALAAsgAkEQaiQAIAVBAEchAyAEIAAoArABECgiAjYCCCAAQfABaiEFIABB9AFqIQYgACgCtAEQKCEHA0AgAiAHECtFBEAgA0UNAiABIAEoAgAoAgwRAQAMAgsgAigCACICIAIoAgAoAjgRAAAEQCABIAEoAgAoAggRAQAgAiABIAIgAigCACgCRBEAAEECEGFBAkYEfyABIAAQRyABKAIAKAIQEQMAIAUFIAYLKAIAIAIoAgAoAkgRBQAgASABKAIAKAIMEQEACyAEQQhqECwgBCgCCCECDAALAAsgBEEQaiQAC4wBAgJ/AX0jAEEQayICJAAgACABEJ0CAkAgAUGAARBMRQ0AIAIgACgCsAEQKCIBNgIIIAAoArQBECghAwNAIAEgAxArRQ0BIAAqAnAiBCABKAIAKAI0IgEqAgRcBEAgASAEOAIEIAEgASgCACgCABEBAAsgAkEIahAsIAIoAgghAQwACwALIAJBEGokAAtzAQN/IwBBEGsiAiQAIABBvAFqENgFIAAQigMgAiAAKAKwARAoIgE2AgggACgCtAEQKCEDA0AgASADECsEQCABKAIAKAIwIgEgACgCjAEgASgCACgCFBEDACACQQhqECwgAigCCCEBDAEFIAJBEGokAAsLCx4BAX9BASECIAAgARBZBH9BAQUgAEG8AWogARBZCws0ACABQdsARiABQQJrQQJJciABQQprIgBBHE1BAEEBIAB0QYuAgIABcRtyRQRAQQAPC0EBCwQAQQMLCQAgABDFBRAtCx8BAX9BmAEQKUEAQZgBEC4iARDyAxogASAAEMYFIAELKAAgAUEKRiABQc8AayIAQQtNQQBBASAAdEHDFXEbckUEQEEADwtBAQsFAEHYAAvNBQIFfwJ9IwBBMGsiBCQAIAEQRyEDIARBGGoQQSECIABB6ABqIgUgAxBiAkACQCAA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IARxGwRAIAAoAkwhASADQRhqIAAqAjAgACoCNBBDIQQgA0EQaiAAKgI4IAAqAjwQQyEFAkACQCACQQRHDQAgACgCYCICRQ0AIAIQRyECIANBCGoQOCIGIAQgAhByIAMQOCIEIAUgAhByIAAgBiAEIAAoAgAoAlARBQAMAQsgACAEIAUgACgCACgCUBEFAAsgACoCSCEHIABBQGsqAgAhCCADIAAoAlQQKDYCCCAIIAeUIQcgACgCWBAoIQADQCADKAIIIgIgABArBEAgASACKAIAIgIoAjAgBxChBCACKgI0IAEoAgAoAiARCwAgA0EIahAsDAEFIAEgASgCACgCJBEBAAsLCyADQSBqJAALMAEBfwJAIAAoAhQiAUUNACABKAIUIgFFDQAgACABQQAgARDkAhs2AmAgASAAEGYLCyIBAX9BASECIAAgARBZBH9BAQUgAEHEAGogABD/BUEBcwsLZAECf0E4EClBAEE4EC4iARDjAyECIAEgACgCEDYCECABIAAoAhQ2AhQgASAAKgIYOAIYIAEgACgCHDYCHCABIAAoAiA2AiAgASAAKAIkNgIkIAEgAC0AKDoAKCABIAAQigEgAgscACABQQEQcCIBBH8gASgCBCAAEIkFQQAFQQELC2sBAn8jAEEQayIDJAAgAyAAKAIsECgiAjYCCCAAKAIwECghAANAAkAgAiAAECtFBEBBACECDAELIAIoAgAiAiABIAIoAgAoAhwRAgAiAg0AIANBCGoQLCADKAIIIQIMAQsLIANBEGokACACC2sBAn8jAEEQayIDJAAgAyAAKAIsECgiAjYCCCAAKAIwECghAANAAkAgAiAAECtFBEBBACECDAELIAIoAgAiAiABIAIoAgAoAhgRAgAiAg0AIANBCGoQLCADKAIIIQIMAQsLIANBEGokACACC4YBAAJAAkACQAJAAkACQAJAAkACQCABQThrDgcAAQIDBAUGBwsgACACEDM2AhAMBwsgACACEDM2AhQMBgsgACACEC+2OAIYDAULIAAgAhAzNgIcDAQLIAAgAhAzNgIgDAMLIAAgAhAzNgIkDAILIAAgAhBOOgAoDAELIAAgASACEOAEDwtBAQsMACABQfv/A3FBG0YLBABBHwsJACAAEIIGEC0LpQEBBX8jAEEQayIBJAACQCAAKAIEEIMGRQ0AIAEgACgCBCICKAIEECgiADYCCCACKAIIECghBANAIAAgBBArRQ0BAkAgACgCACIAQc4AIAAoAgAoAgwRAgBFDQAgACgCJCIDQQBIDQAgAigCECIFIAIoAhQQRCADTQ0AIAAgBSADECcoAgA2AigLIAFBCGoQLCABKAIIIQAMAAsACyABQRBqJABBAAsSAQF/QQgQKSIBIAAQwAQaIAELawECfyMAQRBrIgMkACADIAAoAgQQKCICNgIIIAAoAggQKCEAA0ACQCACIAAQK0UEQEEAIQIMAQsgAigCACICIAEgAigCACgCHBECACICDQAgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILawECfyMAQRBrIgMkACADIAAoAgQQKCICNgIIIAAoAggQKCEAA0ACQCACIAAQK0UEQEEAIQIMAQsgAigCACICIAEgAigCACgCGBECACICDQAgA0EIahAsIAMoAgghAgwBCwsgA0EQaiQAIAILCQAgABD3ARAtCzIBAX9BHBApIgFCADcDACABQQA2AhggAUIANwMQIAFCADcDCCABEOoDIgEgABCRBiABCyAAIAFB+gBGBEAgACACEDM2AhhBAQ8LIAAgASACEMIBCw0AIAFBMkYgAUEdRnILBABBMgsOACABIAIgACgCGBCLBguSAQACQAJAAkACQAJAAkACQAJAAkAgAUEHaw4GAQIDBAUGAAsgAUHEAUcNBiAAIAIQTjoATAwHCyAAIAIQL7Y4AlAMBgsgACACEC+2OAJUDAULIAAgAhAvtjgCWAwECyAAIAIQL7Y4AlwMAwsgACACEC+2OAJgDAILIAAgAhAvtjgCZAwBCyAAIAEgAhCaAw8LQQELDgAgASACIAAoAhgQiwYLSQEBf0EcECkiAUIANwMAIAFBADYCGCABQgA3AxAgAUIANwMIIAEQ5gMiASAAKgIYOAIYIAEgACgCBCAAKAIIIAAoAgwQpQIgAQshACABQcYARgRAIAAgAhAvtjgCGEEBDwsgACABIAIQwgELCgAgAUEda0ECSQsEAEEeC0gBAX8gAyAAKgIUIgOTIAQqAhQgA5OVIQMgACgCECIGBEAgBiADEJQEIQMLIAEgAiAFIAQqAhggACoCGCIFkyADlCAFkhCQBgsjACABQdsARiABQQtNQQBBASABdEGCGHEbckUEQEEADwtBAQsQACABIAIgAyAAKgIYEJAGCzIBAX9BHBApIgFCADcDACABQQA2AhggAUIANwMQIAFCADcDCCABEOUDIgEgABCRBiABCyEAIAFB2ABGBEAgACACENYBNgIYQQEPCyAAIAEgAhDCAQsNACABQSVGIAFBHUZyCwQAQSULRAEBfyADIAAqAhQiA5MgBCoCFCADk5UhAyAAKAIQIgYEQCAGIAMQlAQhAwsgASACIAUgACgCGCAEKAIYIAMQoAQQngMLCQAgABDIAxAtCwvXwwGiAgBBiAgLjRUXAQAAGAEAABkBAAAaAQAAGwEAAHl5AHh5AGx1bWlub3NpdHkAZW50cnkAcmVuZGVyRmFjdG9yeQBhbnkAYXBwbHkAbXVsdGlwbHkAb3ZlcmxheQB5eAB4eAB0eABhbmltYXRpb25CeUluZGV4AHN0YXRlTWFjaGluZUJ5SW5kZXgAc3RhdGVDaGFuZ2VkTmFtZUJ5SW5kZXgAYXJ0Ym9hcmRCeUluZGV4AC0rICAgMFgweAAtMFgrMFggMFgtMHgrMHggMHgAZHJhdwBpbnB1dABTTUlJbnB1dABidXR0AHVuc2lnbmVkIHNob3J0AGludmVydAB3b3JrU3RhcnQAaW5wdXRDb3VudABhbmltYXRpb25Db3VudABzdGF0ZU1hY2hpbmVDb3VudABhcnRib2FyZENvdW50AHN0YXRlQ2hhbmdlZENvdW50AG1ha2VSZW5kZXJQYWludAB1bnNpZ25lZCBpbnQAdHJhbnNmb3JtQ29tcG9uZW50AFRyYW5zZm9ybUNvbXBvbmVudABjb21wdXRlQWxpZ25tZW50AGltcGxlbWVudABsaW5lYXJHcmFkaWVudAByYWRpYWxHcmFkaWVudABjb21wbGV0ZUdyYWRpZW50AGV4aXQARml0AGZpdEhlaWdodABjZW50ZXJSaWdodAB0b3BSaWdodABib3R0b21SaWdodABzb2Z0TGlnaHQAaGFyZExpZ2h0AGNlbnRlckxlZnQAdG9wTGVmdABib3R0b21MZWZ0AHJlc2V0AF9fZGVzdHJ1Y3QAZmxvYXQAdWludDY0X3QAdGhpY2tuZXNzAGZwcwBib3VuZHMAY29sb3IAY292ZXIAc3JjT3ZlcgBjZW50ZXIAdG9wQ2VudGVyAGJvdHRvbUNlbnRlcgBtaXRlcgBSZW5kZXJlcgBSZW5kZXJQYWludFdyYXBwZXIAUmVuZGVyZXJXcmFwcGVyAFJlbmRlclBhdGhXcmFwcGVyAFJlbmRlckltYWdlV3JhcHBlcgB0cmlnZ2VyAGFzVHJpZ2dlcgBTTUlUcmlnZ2VyAG51bWJlcgBhc051bWJlcgBTTUlOdW1iZXIAdW5zaWduZWQgY2hhcgBhZGRTdG9wAGRpZExvb3AAY2FwAFN0cm9rZUNhcAAlcABub25aZXJvAG1vdmVUbwBsaW5lVG8AY3ViaWNUbwB1bmtub3duAHNjYWxlRG93bgBjb2xvckJ1cm4Abm90aWZ5T25EZXN0cnVjdGlvbgByb3RhdGlvbgBzYXR1cmF0aW9uAGR1cmF0aW9uAExpbmVhckFuaW1hdGlvbgBleGNsdXNpb24Aam9pbgBTdHJva2VKb2luAGZyYW1lT3JpZ2luAGNvbnRhaW4AYWxpZ24AbGlnaHRlbgBkYXJrZW4Ac2NyZWVuAG5hbgB0cmFuc2Zvcm0Ad29ybGRUcmFuc2Zvcm0AcGFyZW50V29ybGRUcmFuc2Zvcm0AYm9vbABhc0Jvb2wAU01JQm9vbABmaWxsAGJldmVsAGVtc2NyaXB0ZW46OnZhbABsZW5ndGgAYnl0ZUxlbmd0aABmaXRXaWR0aABkcmF3UGF0aABtYWtlUmVuZGVyUGF0aABjbGlwUGF0aABhZGRQYXRoAHBuZwB1bnNpZ25lZCBsb25nAHN0ZDo6d3N0cmluZwBzdGQ6OnN0cmluZwBzdGQ6OnUxNnN0cmluZwBzdGQ6OnUzMnN0cmluZwBpbmYAc2l6ZQBzYXZlAHZhbHVlAGxvb3BWYWx1ZQBodWUAY2xvc2UAcmVzdG9yZQBmaXJlAHNxdWFyZQB0eXBlAG5vbmUAYm9uZQByb290Qm9uZQBSb290Qm9uZQBTdGF0ZU1hY2hpbmUAdGltZQBuYW1lAGFuaW1hdGlvbkJ5TmFtZQBzdGF0ZU1hY2hpbmVCeU5hbWUAYXJ0Ym9hcmRCeU5hbWUAc3R5bGUAUmVuZGVyUGFpbnRTdHlsZQBmaWxsUnVsZQBGaWxsUnVsZQBGaWxlAGRvdWJsZQBzdHJva2UAY29sb3JEb2RnZQBkcmF3SW1hZ2UAbWFrZVJlbmRlckltYWdlAG5vZGUAZGVjb2RlAE5vZGUAYmxlbmRNb2RlAEJsZW5kTW9kZQBkaWZmZXJlbmNlAGFkdmFuY2UAaW5zdGFuY2UATGluZWFyQW5pbWF0aW9uSW5zdGFuY2UAU3RhdGVNYWNoaW5lSW5zdGFuY2UAZGVmYXVsdEFydGJvYXJkAHJvdW5kAGV4dGVuZAB3b3JrRW5kAHZvaWQAc3BlZWQAZXZlbk9kZABsb2FkAGVuYWJsZVdvcmtBcmVhAG1heFkAbWluWQBzY2FsZVkAbWF4WABtaW5YAHNjYWxlWABOQU4ASU5GAFJJVkUATWF0MkQAQUFCQgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxmbG9hdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDhfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGNoYXI+AHN0ZDo6YmFzaWNfc3RyaW5nPHVuc2lnbmVkIGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AC4AKG51bGwpAEJhZCBoZWFkZXIKAEZhaWxlZCB0byBpbXBvcnQgb2JqZWN0IG9mIHR5cGUgJWQKAEFydGJvYXJkOjppbml0aWFsaXplIC0gRHJhdyBydWxlIHRhcmdldHMgbWlzc2luZyBjb21wb25lbnQgd2lkdGggaWQgJWQKAFVuc3VwcG9ydGVkIHZlcnNpb24gJXUuJXUgZXhwZWN0ZWQgJXUuJXUuCgBTdGF0ZU1hY2hpbmUgZXhjZWVkZWQgbWF4IGl0ZXJhdGlvbnMuCgBVbmtub3duIHByb3BlcnR5IGtleSAlbGx1LCBtaXNzaW5nIGZyb20gcHJvcGVydHkgVG9DLgoARGVwZW5kZW5jeSBjeWNsZSEKAEGgHQsOHAEAAB0BAAAeAQAAHwEAQbgdC3ogAQAAIQEAACIBAAAjAQAAOwA4ADoAAAD0awAA7WsAAPRrAACoagAA9GsAAGlpaQBpaQB2AHZpAO1rAACtagAAdmlpAO1rAACtagAArmoAAHZpaWkAAAAA7WsAAK1qAACdagAAnGoAAHZpaWlpAAAA7WsAAK1qAACdagBBwB4LVu1rAACqagAAr2oAALBqAACxagAAsWoAAHZpaWlpaWkA7WsAAKpqAACuagAAr2oAALBqAACxagAAsWoAAHZpaWlpaWlpAAAAAO1rAACsagAArWoAAPRrAEGgHwseJAEAACUBAAAmAQAAJwEAACgBAAApAQAAKgEAACsBAEHIHwseJAEAACwBAAAtAQAALQEAAC0BAAAtAQAALQEAAC0BAEHwHwulAS4BAAAvAQAALQEAAC0BAAAtAQAALQEAAC0BAAAtAQAA7WsAAO1rAACuagAA7WsAAJ1qAACcagAA7WsAAJ1qAADtawAAnmoAANxqAAAAbAAA9GsAAO9rAAD0awAAaWlpaQAAAADtawAA4GoAAAAAAADtawAA4GoAAJ1qAACuagAA7WsAAOBqAADhagAAAAAAAO1rAADgagAAAGwAAABsAAB2aWlmZgBBoCELOu1rAADgagAAAGwAAABsAAAAbAAAAGwAAABsAAAAbAAAdmlpZmZmZmZmAAAA7WsAAN9qAADgagAA9GsAQeQhCyowAQAAMQEAADIBAAAzAQAANAEAADUBAAA2AQAANwEAADgBAAA5AQAAOgEAQZgiCyowAQAAOwEAAC0BAAAtAQAANAEAAC0BAAAtAQAALQEAAC0BAAA5AQAALQEAQcwiC7oBPAEAAD0BAAAtAQAALQEAADQBAAAtAQAALQEAAC0BAAAtAQAAOQEAAC0BAADtawAA4WoAAO1rAAAAbAAAAGwAAAAAAADtawAAAGwAAABsAAAAbAAAAGwAAABsAAAAbAAA7WsAAJ1qAACuagAA7WsAAAprAAD7awAA7WsAAAprAAAEawAA7WsAAAprAAAAbAAAdmlpZgAAAADtawAACmsAAAZrAADtawAACmsAAAVrAADtawAACmsAANxqAEGQJAtO7WsAAAprAAAAbAAAAGwAAABsAAAAbAAAdmlpZmZmZgDtawAACmsAAPtrAAAAbAAAdmlpaWYAAADtawAACmsAAO1rAAAJawAACmsAAPRrAEHoJAsuPgEAAD8BAABAAQAAQQEAAEIBAABDAQAARAEAAEUBAABGAQAARwEAAEgBAABJAQBBoCULLi0BAAAtAQAALQEAAC0BAAAtAQAALQEAAC0BAAAtAQAALQEAAC0BAABIAQAASgEAQdglC14tAQAALQEAAC0BAAAtAQAALQEAAC0BAAAtAQAALQEAAC0BAAAtAQAASwEAAEwBAADtawAABGsAAO1rAAD7awAA7WsAAABsAADtawAABmsAAO1rAAAFawAA7WsAANxqAEHAJgs17WsAAABsAAAAbAAAAGwAAABsAADtawAA+2sAAABsAADuawAAT2sAAFBrAAD9awAAaWlpaWkAQYAnCx7tawAAT2sAAPprAAD6awAA7WsAAE5rAABPawAA9GsAQagnCwpNAQAATgEAAE8BAEG8JwsKTQEAAFABAAAtAQBB0CcLJlEBAABSAQAALQEAAO5rAAD0awAAXGsAAGZpaQDuawAArmoAAK5qAEGAKAuUAu1rAACuagAArmoAAK5qAABgawAAX2sAAGBrAABfawAA72sAAGBrAABfawAA/WsAAP1rAABfawAA7msAAGBrAAABbAAAaWlpZAAAAADtawAAYGsAAKpqAABjawAAYGsAAO9rAABkawAAYGsAAO9rAABlawAAYGsAAO9rAABmawAAYGsAAO9rAABnawAAYmsAAP1rAABnawAAYmsAAO9rAAD9awAAYmsAAGhrAABiawAA/WsAAGhrAABiawAA72sAAGBrAABiawAArmoAAGlrAADtawAAaWsAAK5qAAAAAAAA7WsAAHVrAABgawAAAGwAAABsAAB2aWlpZmYAAHdrAABnawAA7msAAHdrAAAAbAAAaWlpZgBBoCoLFu1rAAB4awAAYGsAAABsAAB8awAAaGsAQcAqC1nuawAAfGsAAGBrAAAAbAAAaWlpaWYAAAD9awAAfWsAAH5rAAB9awAA/WsAAO9rAAB7awAA/WsAAIFrAAB/awAAgmsAAH9rAACDawAAf2sAAO1rAACDawAAaQBBpCsLElMBAABUAQAAVQEAAFYBAABXAQBBwCsLElMBAABYAQAAWQEAAFYBAABXAQBB3CsLEloBAABbAQAAXAEAAF0BAABeAQBB+CsLEloBAABfAQAAYAEAAF0BAABeAQBBlCwLemEBAABiAQAAYwEAAGQBAABlAQAAZgEAAGcBAABoAQAAaQEAAGoBAABrAQAAbAEAAG0BAABuAQAAbwEAAHABAABxAQAAcgEAAHMBAAB0AQAAdQEAAHYBAAB3AQAAeAEAAHkBAAB6AQAAewEAAHwBAAB9AQAAfgEAAH8BAEGYLQt6gAEAAIEBAABjAQAAZAEAAGUBAABmAQAAZwEAAGgBAABpAQAAagEAAGsBAABsAQAAbQEAAIIBAABvAQAAcAEAAHEBAAByAQAAcwEAAHQBAAB1AQAAdgEAAHcBAAB4AQAAeQEAAHoBAAB7AQAAfAEAAH0BAAB+AQAAfwEAQZwuCz6DAQAAhAEAAIUBAACGAQAAhwEAAIgBAACJAQAAigEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAAI4BAACPAQBB5C4LPoMBAACQAQAAhQEAAIYBAACHAQAAiAEAAJEBAACSAQAAaQEAAGoBAABrAQAAiwEAAIwBAACNAQAAjgEAAJMBAEGsLwtOgwEAAJQBAACVAQAAlgEAAJcBAACYAQAAmQEAAJoBAABpAQAAagEAAGsBAACbAQAAnAEAAI0BAACdAQAAngEAAJ8BAACgAQAAoQEAAKIBAEGEMAtOgwEAAKMBAACVAQAAlgEAAJcBAACYAQAAmQEAAJoBAABpAQAAagEAAGsBAACbAQAAnAEAAI0BAACdAQAAngEAAC0BAACgAQAAoQEAAKIBAEHcMAsqpAEAAKUBAACmAQAApwEAAKgBAACpAQAAqgEAAKsBAACsAQAArQEAAK4BAEGQMQsqpAEAAK8BAACmAQAApwEAAKgBAACpAQAAqgEAAKsBAACsAQAAsAEAAK4BAEHEMQsqsQEAALIBAACzAQAAtAEAALUBAAC2AQAAtwEAALgBAAC5AQAAugEAALsBAEH4MQsqsQEAALwBAACzAQAAtAEAALUBAAC2AQAAvQEAAJIBAAC+AQAAugEAALsBAEGsMgsmsQEAAL8BAADAAQAAwQEAAMIBAADDAQAAvQEAAJIBAAC+AQAAugEAQdwyCyaxAQAAxAEAAMABAADBAQAAwgEAAMMBAAC9AQAAkgEAAMUBAAC6AQBBjDMLJqQBAADGAQAAxwEAAMgBAADJAQAAygEAAKoBAACrAQAArAEAALABAEG8MwsmpAEAAMsBAADHAQAAyAEAAMkBAADKAQAAqgEAAKsBAACsAQAAsAEAQewzCzKxAQAAzAEAAM0BAADOAQAAzwEAANABAADRAQAAkgEAANIBAADTAQAA1AEAANUBAADWAQBBqDQLMrEBAADXAQAAzQEAAM4BAADPAQAA0AEAAL0BAACSAQAAxQEAANMBAADUAQAA1QEAANYBAEHkNAsmpAEAANgBAADZAQAA2gEAAMkBAADbAQAAqgEAAKsBAACsAQAAsAEAQZQ1CyakAQAA3AEAANkBAADaAQAAyQEAANsBAACqAQAAqwEAAKwBAACwAQBBxDULJt0BAADeAQAA3wEAAOABAADJAQAA4QEAAKoBAACrAQAArAEAAOIBAEH0NQsm3QEAAOMBAADfAQAA4AEAAMkBAADhAQAAqgEAAKsBAACsAQAAsAEAQaQ2CybdAQAA5AEAAOUBAADmAQAAyQEAAMMBAACqAQAAqwEAAKwBAACwAQBB1DYLJqQBAADnAQAA5QEAAOYBAADJAQAAwwEAAKoBAACrAQAArAEAALABAEGENwsmpAEAAOgBAADpAQAA6gEAAMkBAADrAQAAqgEAAKsBAACsAQAAsAEAQbQ3CyakAQAA7AEAAOkBAADqAQAAyQEAAOsBAACqAQAAqwEAAKwBAACwAQBB5DcLKt0BAADtAQAA7gEAAO8BAADwAQAA8QEAAKoBAACrAQAA8gEAAPMBAAD0AQBBmDgLKt0BAAD1AQAA7gEAAO8BAADwAQAA8QEAAKoBAACrAQAArAEAALABAAD0AQBBzDgLPvYBAAD3AQAA+AEAAPkBAAD6AQAA+wEAAPwBAAD9AQAA/gEAAP8BAAAAAgAAAQIAAAICAAADAgAABAIAAAUCAEGUOQs+9gEAAAYCAAD4AQAA+QEAAPoBAAD7AQAA/AEAAP0BAAD+AQAA/wEAAAACAAABAgAAAgIAAAcCAAAIAgAABQIAQdw5CyqxAQAACQIAAAoCAAALAgAADAIAAA0CAAAOAgAADwIAAL4BAAC6AQAAEAIAQZA6CyqxAQAAEQIAAAoCAAALAgAADAIAAA0CAAC9AQAAkgEAAL4BAAC6AQAAEAIAQcQ6C1aDAQAAEgIAABMCAAAUAgAAFQIAABYCAAAXAgAAkgEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAABgCAAAZAgAAGgIAABsCAAAcAgAAHQIAAB4CAAAfAgBBpDsLVoMBAAAgAgAAEwIAABQCAAAVAgAAFgIAABcCAACSAQAAaQEAAGoBAABrAQAAiwEAAIwBAACNAQAAGAIAABkCAAAaAgAALQEAAC0BAAAhAgAAIgIAACMCAEGEPAtKgwEAACQCAAAlAgAAJgIAACcCAADDAQAAFwIAAJIBAABpAQAAagEAAGsBAACLAQAAjAEAAI0BAAAYAgAAGQIAABoCAAAtAQAALQEAQdg8C0KDAQAAKAIAACUCAAAmAgAAJwIAAMMBAAAXAgAAkgEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAACkCAAAqAgAAKwIAQaQ9C1KDAQAALAIAAC0CAAAuAgAALwIAADACAAAXAgAAkgEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAABgCAAAZAgAAGgIAADECAAAyAgAAMwIAADQCAEGAPgtSgwEAADUCAAAtAgAALgIAAC8CAAAwAgAAFwIAAJIBAABpAQAAagEAAGsBAACLAQAAjAEAAI0BAAAYAgAAGQIAABoCAAAtAQAALQEAADYCAAA3AgBB3D4LQjgCAAA5AgAAOgIAADsCAAA8AgAAPQIAAD4CAAA/AgAAaQEAAGoBAABrAQAAQAIAAIwBAABBAgAAQgIAAEMCAABEAgBBqD8LQoMBAABFAgAAOgIAADsCAAA8AgAAPQIAAJEBAACSAQAAaQEAAGoBAABrAQAAiwEAAIwBAACNAQAAQgIAAEMCAABEAgBB9D8LWoMBAABGAgAARwIAAEgCAABJAgAASgIAABcCAACSAQAAaQEAAGoBAABrAQAAiwEAAIwBAACNAQAAGAIAABkCAAAaAgAASwIAAEwCAABNAgAATgIAAE8CAABQAgBB2MAAC1qDAQAAUQIAAEcCAABIAgAASQIAAEoCAAAXAgAAkgEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAABgCAAAZAgAAGgIAAC0BAAAtAQAAUgIAAFMCAABUAgAAVQIAQbzBAAs6gwEAAFYCAABXAgAAWAIAAFkCAABaAgAAWwIAAFwCAABpAQAAagEAAGsBAACLAQAAjAEAAI0BAABdAgBBgMIACzqDAQAAXgIAAFcCAABYAgAAWQIAAFoCAACRAQAAkgEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAAF8CAEHEwgALamACAABhAgAAYgIAAGMCAABkAgAAZQIAAJEBAACSAQAAZgIAAGoBAABrAQAAiwEAAGcCAABoAgAAbwEAAGkCAABqAgAAawIAAGwCAABtAgAAbgIAAG8CAABwAgAAcQIAAJj///8AAAAAcgIAQbjDAAtagwEAAHMCAABiAgAAYwIAAGQCAABlAgAAkQEAAJIBAABpAQAAagEAAGsBAACLAQAAjAEAAI0BAABvAQAAaQIAAGoCAABrAgAAbAIAAG0CAABuAgAAbwIAAHACAEGcxAALAi0BAEGoxAALIrEBAAB0AgAAdQIAAHYCAAB3AgAAeAIAAL0BAACSAQAAxQEAQdTEAAsisQEAAHkCAAB1AgAAdgIAAHcCAAB4AgAAvQEAAJIBAADFAQBBgMUAC06DAQAAegIAAHsCAAB8AgAAfQIAAH4CAAB/AgAAkgEAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAAIACAACBAgAAggIAAIMCAACEAgAAhQIAQdjFAAvdAYMBAACGAgAAewIAAHwCAAB9AgAAfgIAAH8CAACSAQAAaQEAAGoBAABrAQAAiwEAAIwBAACNAQAAgAIAAIECAACCAgAAgwIAAIQCAACFAgAAAQAAAAAAAAD/////AgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAA/////wIAAAACAAAA/////wAAAAACAAAAAgAAAAIAAAD/////////////////////AgAAAAAAAAACAAAAAgAAAAIAAAD/////AwAAAAMAAAACAEHAxwALFQIAAAD///////////////8CAAAAAgBB6McACw3/////AAAAAP////8BAEGAyAALAQIAQZTIAAsNAgAAAAIAAAACAAAAAgBBsMgAC1UCAAAA//////////////////////////////////////////8CAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAADAAAAAgAAAAIAAAACAEGYyQALFQIAAAACAAAAAgAAAAIAAAACAAAAAgBBuMkACxUCAAAAAgAAAAIAAAACAAAAAgAAAAIAQeDJAAsUAgAAAAIAAAACAAAAAAAAAP////8AQYTKAAsRAgAAAAIAAAAAAAAAAgAAAAIAQaDKAAuFAf//////////////////////////////////////////AQAAAP////8CAAAAAAAAAP////////////////////////////////////8AAAAA/////wAAAAAAAAAA//////////8AAAAAAAAAAAIAAAAAAAAA/////wAAAAACAAAAAgAAAAIAQbDLAAsBAgBBvMsACw3//////////wAAAAACAEHYywALBf////8CAEHwywALFQIAAAACAAAAAgAAAAIAAAACAAAAAgBBtMwACzUCAAAAAgAAAAAAAAACAAAAAQAAAAAAAAD/////AAAAAAIAAAACAAAA////////////////AQBB9MwACyaHAgAAiAIAAIkCAACKAgAAiwIAAIwCAAC9AQAAkgEAAMUBAACNAgBBpM0ACyaHAgAAjgIAAIkCAACKAgAAiwIAAIwCAAC9AQAAkgEAAI8CAACNAgBB1M0ACw4cAQAAkAIAAJECAAAjAQBB7M0AC06SAgAAkwIAAJQCAACVAgAAlgIAAJcCAACRAQAAmAIAAGkBAABqAQAAawEAAIsBAACMAQAAjQEAAJkCAACaAgAAmwIAAC0BAAAtAQAAnAIAQcTOAAtOkgIAAJ0CAACUAgAAlQIAAJYCAACXAgAAkQEAAJgCAABpAQAAagEAAGsBAACLAQAAjAEAAI0BAACZAgAAmgIAAJ4CAACfAgAAoAIAAJwCAEGczwALJqECAACiAgAAowIAAKQCAAClAgAApgIAAL0BAACSAQAAxQEAAKcCAEHMzwALJqECAACoAgAAowIAAKQCAAClAgAApgIAAL0BAACSAQAAxQEAAKcCAEH8zwALPoMBAACpAgAAqgIAAKsCAACsAgAArQIAAJEBAACSAQAAaQEAAGoBAABrAQAAiwEAAIwBAACNAQAArgIAAK8C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";

    if (!K.startsWith(Qa)) {
      var Ra = K;
      K = h.locateFile ? h.locateFile(Ra, A) : A + Ra;
    }

    function Sa() {
      var a = K;

      try {
        if (a == K && na) return new Uint8Array(na);
        var b = D(a);
        if (b) return b;
        if (ja) return ja(a);
        throw "both async and sync fetching of the wasm failed";
      } catch (c) {
        oa(c);
      }
    }

    function Ta() {
      if (!na && (da || ea)) {
        if ("function" === typeof fetch && !K.startsWith("file://")) return fetch(K, {
          credentials: "same-origin"
        }).then(function (a) {
          if (!a.ok) throw "failed to load wasm binary file at '" + K + "'";
          return a.arrayBuffer();
        }).catch(function () {
          return Sa();
        });
        if (ia) return new Promise(function (a, b) {
          ia(K, function (c) {
            a(new Uint8Array(c));
          }, b);
        });
      }

      return Promise.resolve().then(function () {
        return Sa();
      });
    }

    function Ua(a) {
      for (; 0 < a.length;) {
        var b = a.shift();
        if ("function" == typeof b) b(h);else {
          var c = b.cb;
          "number" === typeof c ? void 0 === b.sa ? Ia.get(c)() : Ia.get(c)(b.sa) : c(void 0 === b.sa ? null : b.sa);
        }
      }
    }

    function Va(a) {
      if (void 0 === a) return "_unknown";
      a = a.replace(/[^a-zA-Z0-9_]/g, "$");
      var b = a.charCodeAt(0);
      return 48 <= b && 57 >= b ? "_" + a : a;
    }

    function Wa(a, b) {
      a = Va(a);
      return new Function("body", "return function " + a + '() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(b);
    }

    var M = [{}, {
      value: void 0
    }, {
      value: null
    }, {
      value: !0
    }, {
      value: !1
    }],
        Xa = [];

    function Ya(a) {
      var b = Error,
          c = Wa(a, function (d) {
        this.name = a;
        this.message = d;
        d = Error(d).stack;
        void 0 !== d && (this.stack = this.toString() + "\n" + d.replace(/^Error(:[^\n]*)?\n/, ""));
      });
      c.prototype = Object.create(b.prototype);
      c.prototype.constructor = c;

      c.prototype.toString = function () {
        return void 0 === this.message ? this.name : this.name + ": " + this.message;
      };

      return c;
    }

    var Za = void 0;

    function N(a) {
      throw new Za(a);
    }

    function O(a) {
      a || N("Cannot use deleted val. handle = " + a);
      return M[a].value;
    }

    function P(a) {
      switch (a) {
        case void 0:
          return 1;

        case null:
          return 2;

        case !0:
          return 3;

        case !1:
          return 4;

        default:
          var b = Xa.length ? Xa.pop() : M.length;
          M[b] = {
            va: 1,
            value: a
          };
          return b;
      }
    }

    var $a = void 0,
        ab = void 0;

    function Q(a) {
      for (var b = ""; E[a];) {
        b += ab[E[a++]];
      }

      return b;
    }

    var bb = [];

    function cb() {
      for (; bb.length;) {
        var a = bb.pop();
        a.V.ka = !1;
        a["delete"]();
      }
    }

    var db = void 0,
        R = {};

    function eb(a, b) {
      for (void 0 === b && N("ptr should not be undefined"); a.$;) {
        b = a.ma(b), a = a.$;
      }

      return b;
    }

    var S = {};

    function hb(a) {
      a = ib(a);
      var b = Q(a);
      T(a);
      return b;
    }

    function jb(a, b) {
      var c = S[a];
      void 0 === c && N(b + " has unknown type " + hb(a));
      return c;
    }

    function kb() {}

    var lb = !1;

    function mb(a) {
      --a.count.value;
      0 === a.count.value && (a.aa ? a.da.ga(a.aa) : a.Y.W.ga(a.X));
    }

    function nb(a) {
      if ("undefined" === typeof FinalizationGroup) return nb = function nb(b) {
        return b;
      }, a;
      lb = new FinalizationGroup(function (b) {
        for (var c = b.next(); !c.done; c = b.next()) {
          c = c.value, c.X ? mb(c) : console.warn("object already deleted: " + c.X);
        }
      });

      nb = function nb(b) {
        lb.register(b, b.V, b.V);
        return b;
      };

      kb = function kb(b) {
        lb.unregister(b.V);
      };

      return nb(a);
    }

    var ob = {};

    function pb(a) {
      for (; a.length;) {
        var b = a.pop();
        a.pop()(b);
      }
    }

    function qb(a) {
      return this.fromWireType(H[a >> 2]);
    }

    var rb = {},
        sb = {},
        tb = void 0;

    function ub(a) {
      throw new tb(a);
    }

    function U(a, b, c) {
      function d(g) {
        g = c(g);
        g.length !== a.length && ub("Mismatched type converter count");

        for (var k = 0; k < a.length; ++k) {
          V(a[k], g[k]);
        }
      }

      a.forEach(function (g) {
        sb[g] = b;
      });
      var e = Array(b.length),
          f = [],
          m = 0;
      b.forEach(function (g, k) {
        S.hasOwnProperty(g) ? e[k] = S[g] : (f.push(g), rb.hasOwnProperty(g) || (rb[g] = []), rb[g].push(function () {
          e[k] = S[g];
          ++m;
          m === f.length && d(e);
        }));
      });
      0 === f.length && d(e);
    }

    function vb(a) {
      switch (a) {
        case 1:
          return 0;

        case 2:
          return 1;

        case 4:
          return 2;

        case 8:
          return 3;

        default:
          throw new TypeError("Unknown type size: " + a);
      }
    }

    function V(a, b, c) {
      c = c || {};
      if (!("argPackAdvance" in b)) throw new TypeError("registerType registeredInstance requires argPackAdvance");
      var d = b.name;
      a || N('type "' + d + '" must have a positive integer typeid pointer');

      if (S.hasOwnProperty(a)) {
        if (c.Ua) return;
        N("Cannot register type '" + d + "' twice");
      }

      S[a] = b;
      delete sb[a];
      rb.hasOwnProperty(a) && (b = rb[a], delete rb[a], b.forEach(function (e) {
        e();
      }));
    }

    function wb(a) {
      N(a.V.Y.W.name + " instance already deleted");
    }

    function W() {}

    var xb = {};

    function yb(a, b, c) {
      if (void 0 === a[b].Z) {
        var d = a[b];

        a[b] = function () {
          a[b].Z.hasOwnProperty(arguments.length) || N("Function '" + c + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + a[b].Z + ")!");
          return a[b].Z[arguments.length].apply(this, arguments);
        };

        a[b].Z = [];
        a[b].Z[d.ja] = d;
      }
    }

    function zb(a, b, c) {
      h.hasOwnProperty(a) ? ((void 0 === c || void 0 !== h[a].Z && void 0 !== h[a].Z[c]) && N("Cannot register public name '" + a + "' twice"), yb(h, a, a), h.hasOwnProperty(c) && N("Cannot register multiple overloads of a function with the same number of arguments (" + c + ")!"), h[a].Z[c] = b) : (h[a] = b, void 0 !== c && (h[a].eb = c));
    }

    function Ab(a, b, c, d, e, f, m, g) {
      this.name = a;
      this.constructor = b;
      this.fa = c;
      this.ga = d;
      this.$ = e;
      this.Pa = f;
      this.ma = m;
      this.Na = g;
      this.Ea = [];
    }

    function Bb(a, b, c) {
      for (; b !== c;) {
        b.ma || N("Expected null or instance of " + c.name + ", got an instance of " + b.name), a = b.ma(a), b = b.$;
      }

      return a;
    }

    function Cb(a, b) {
      if (null === b) return this.ta && N("null is not a valid " + this.name), 0;
      b.V || N('Cannot pass "' + Db(b) + '" as a ' + this.name);
      b.V.X || N("Cannot pass deleted object as a pointer of type " + this.name);
      return Bb(b.V.X, b.V.Y.W, this.W);
    }

    function Eb(a, b) {
      if (null === b) {
        this.ta && N("null is not a valid " + this.name);

        if (this.pa) {
          var c = this.ua();
          null !== a && a.push(this.ga, c);
          return c;
        }

        return 0;
      }

      b.V || N('Cannot pass "' + Db(b) + '" as a ' + this.name);
      b.V.X || N("Cannot pass deleted object as a pointer of type " + this.name);
      !this.oa && b.V.Y.oa && N("Cannot convert argument of type " + (b.V.da ? b.V.da.name : b.V.Y.name) + " to parameter type " + this.name);
      c = Bb(b.V.X, b.V.Y.W, this.W);
      if (this.pa) switch (void 0 === b.V.aa && N("Passing raw pointer to smart pointer is illegal"), this.bb) {
        case 0:
          b.V.da === this ? c = b.V.aa : N("Cannot convert argument of type " + (b.V.da ? b.V.da.name : b.V.Y.name) + " to parameter type " + this.name);
          break;

        case 1:
          c = b.V.aa;
          break;

        case 2:
          if (b.V.da === this) c = b.V.aa;else {
            var d = b.clone();
            c = this.Ya(c, P(function () {
              d["delete"]();
            }));
            null !== a && a.push(this.ga, c);
          }
          break;

        default:
          N("Unsupporting sharing policy");
      }
      return c;
    }

    function Fb(a, b) {
      if (null === b) return this.ta && N("null is not a valid " + this.name), 0;
      b.V || N('Cannot pass "' + Db(b) + '" as a ' + this.name);
      b.V.X || N("Cannot pass deleted object as a pointer of type " + this.name);
      b.V.Y.oa && N("Cannot convert argument of type " + b.V.Y.name + " to parameter type " + this.name);
      return Bb(b.V.X, b.V.Y.W, this.W);
    }

    function Gb(a, b, c) {
      if (b === c) return a;
      if (void 0 === c.$) return null;
      a = Gb(a, b, c.$);
      return null === a ? null : c.Na(a);
    }

    function Hb(a, b) {
      b = eb(a, b);
      return R[b];
    }

    function Jb(a, b) {
      b.Y && b.X || ub("makeClassHandle requires ptr and ptrType");
      !!b.da !== !!b.aa && ub("Both smartPtrType and smartPtr must be specified");
      b.count = {
        value: 1
      };
      return nb(Object.create(a, {
        V: {
          value: b
        }
      }));
    }

    function X(a, b, c, d) {
      this.name = a;
      this.W = b;
      this.ta = c;
      this.oa = d;
      this.pa = !1;
      this.ga = this.Ya = this.ua = this.Fa = this.bb = this.Xa = void 0;
      void 0 !== b.$ ? this.toWireType = Eb : (this.toWireType = d ? Cb : Fb, this.ba = null);
    }

    function Kb(a, b, c) {
      h.hasOwnProperty(a) || ub("Replacing nonexistant public symbol");
      void 0 !== h[a].Z && void 0 !== c ? h[a].Z[c] = b : (h[a] = b, h[a].ja = c);
    }

    function Lb(a, b) {
      var c = [];
      return function () {
        c.length = arguments.length;

        for (var d = 0; d < arguments.length; d++) {
          c[d] = arguments[d];
        }

        a.includes("j") ? (d = h["dynCall_" + a], d = c && c.length ? d.apply(null, [b].concat(c)) : d.call(null, b)) : d = Ia.get(b).apply(null, c);
        return d;
      };
    }

    function Y(a, b) {
      a = Q(a);
      var c = a.includes("j") ? Lb(a, b) : Ia.get(b);
      "function" !== typeof c && N("unknown function pointer with signature " + a + ": " + b);
      return c;
    }

    var Mb = void 0;

    function Z(a, b) {
      function c(f) {
        e[f] || S[f] || (sb[f] ? sb[f].forEach(c) : (d.push(f), e[f] = !0));
      }

      var d = [],
          e = {};
      b.forEach(c);
      throw new Mb(a + ": " + d.map(hb).join([", "]));
    }

    function Nb(a) {
      var b = Function;
      if (!(b instanceof Function)) throw new TypeError("new_ called with constructor type " + _typeof(b) + " which is not a function");
      var c = Wa(b.name || "unknownFunctionName", function () {});
      c.prototype = b.prototype;
      c = new c();
      a = b.apply(c, a);
      return a instanceof Object ? a : c;
    }

    function Ob(a, b, c, d, e) {
      var f = b.length;
      2 > f && N("argTypes array size mismatch! Must at least get return value and 'this' types!");
      var m = null !== b[1] && null !== c,
          g = !1;

      for (c = 1; c < b.length; ++c) {
        if (null !== b[c] && void 0 === b[c].ba) {
          g = !0;
          break;
        }
      }

      var k = "void" !== b[0].name,
          l = "",
          p = "";

      for (c = 0; c < f - 2; ++c) {
        l += (0 !== c ? ", " : "") + "arg" + c, p += (0 !== c ? ", " : "") + "arg" + c + "Wired";
      }

      a = "return function " + Va(a) + "(" + l + ") {\nif (arguments.length !== " + (f - 2) + ") {\nthrowBindingError('function " + a + " called with ' + arguments.length + ' arguments, expected " + (f - 2) + " args!');\n}\n";
      g && (a += "var destructors = [];\n");
      var q = g ? "destructors" : "null";
      l = "throwBindingError invoker fn runDestructors retType classParam".split(" ");
      d = [N, d, e, pb, b[0], b[1]];
      m && (a += "var thisWired = classParam.toWireType(" + q + ", this);\n");

      for (c = 0; c < f - 2; ++c) {
        a += "var arg" + c + "Wired = argType" + c + ".toWireType(" + q + ", arg" + c + "); // " + b[c + 2].name + "\n", l.push("argType" + c), d.push(b[c + 2]);
      }

      m && (p = "thisWired" + (0 < p.length ? ", " : "") + p);
      a += (k ? "var rv = " : "") + "invoker(fn" + (0 < p.length ? ", " : "") + p + ");\n";
      if (g) a += "runDestructors(destructors);\n";else for (c = m ? 1 : 2; c < b.length; ++c) {
        f = 1 === c ? "thisWired" : "arg" + (c - 2) + "Wired", null !== b[c].ba && (a += f + "_dtor(" + f + "); // " + b[c].name + "\n", l.push(f + "_dtor"), d.push(b[c].ba));
      }
      k && (a += "var ret = retType.fromWireType(rv);\nreturn ret;\n");
      l.push(a + "}\n");
      return Nb(l).apply(null, d);
    }

    function Pb(a, b) {
      for (var c = [], d = 0; d < a; d++) {
        c.push(G[(b >> 2) + d]);
      }

      return c;
    }

    function Qb(a, b, c) {
      a instanceof Object || N(c + ' with invalid "this": ' + a);
      a instanceof b.W.constructor || N(c + ' incompatible with "this" of type ' + a.constructor.name);
      a.V.X || N("cannot call emscripten binding method " + c + " on deleted object");
      return Bb(a.V.X, a.V.Y.W, b.W);
    }

    function Rb(a) {
      4 < a && 0 === --M[a].va && (M[a] = void 0, Xa.push(a));
    }

    function Sb(a, b, c) {
      switch (b) {
        case 0:
          return function (d) {
            return this.fromWireType((c ? Ea : E)[d]);
          };

        case 1:
          return function (d) {
            return this.fromWireType((c ? F : xa)[d >> 1]);
          };

        case 2:
          return function (d) {
            return this.fromWireType((c ? G : H)[d >> 2]);
          };

        default:
          throw new TypeError("Unknown integer type: " + a);
      }
    }

    function Db(a) {
      if (null === a) return "null";

      var b = _typeof(a);

      return "object" === b || "array" === b || "function" === b ? a.toString() : "" + a;
    }

    function Tb(a, b) {
      switch (b) {
        case 2:
          return function (c) {
            return this.fromWireType(Fa[c >> 2]);
          };

        case 3:
          return function (c) {
            return this.fromWireType(Ga[c >> 3]);
          };

        default:
          throw new TypeError("Unknown float type: " + a);
      }
    }

    function Ub(a, b, c) {
      switch (b) {
        case 0:
          return c ? function (d) {
            return Ea[d];
          } : function (d) {
            return E[d];
          };

        case 1:
          return c ? function (d) {
            return F[d >> 1];
          } : function (d) {
            return xa[d >> 1];
          };

        case 2:
          return c ? function (d) {
            return G[d >> 2];
          } : function (d) {
            return H[d >> 2];
          };

        default:
          throw new TypeError("Unknown integer type: " + a);
      }
    }

    var Vb = {};

    function Wb(a) {
      var b = Vb[a];
      return void 0 === b ? Q(a) : b;
    }

    var Xb = [];

    function Yb(a) {
      var b = Xb.length;
      Xb.push(a);
      return b;
    }

    function Zb(a, b) {
      for (var c = Array(a), d = 0; d < a; ++d) {
        c[d] = jb(G[(b >> 2) + d], "parameter " + d);
      }

      return c;
    }

    var $b = [],
        ac = [null, [], []];
    Za = h.BindingError = Ya("BindingError");

    h.count_emval_handles = function () {
      for (var a = 0, b = 5; b < M.length; ++b) {
        void 0 !== M[b] && ++a;
      }

      return a;
    };

    h.get_first_emval = function () {
      for (var a = 5; a < M.length; ++a) {
        if (void 0 !== M[a]) return M[a];
      }

      return null;
    };

    $a = h.PureVirtualError = Ya("PureVirtualError");

    for (var bc = Array(256), cc = 0; 256 > cc; ++cc) {
      bc[cc] = String.fromCharCode(cc);
    }

    ab = bc;

    h.getInheritedInstanceCount = function () {
      return Object.keys(R).length;
    };

    h.getLiveInheritedInstances = function () {
      var a = [],
          b;

      for (b in R) {
        R.hasOwnProperty(b) && a.push(R[b]);
      }

      return a;
    };

    h.flushPendingDeletes = cb;

    h.setDelayFunction = function (a) {
      db = a;
      bb.length && db && db(cb);
    };

    tb = h.InternalError = Ya("InternalError");

    W.prototype.isAliasOf = function (a) {
      if (!(this instanceof W && a instanceof W)) return !1;
      var b = this.V.Y.W,
          c = this.V.X,
          d = a.V.Y.W;

      for (a = a.V.X; b.$;) {
        c = b.ma(c), b = b.$;
      }

      for (; d.$;) {
        a = d.ma(a), d = d.$;
      }

      return b === d && c === a;
    };

    W.prototype.clone = function () {
      this.V.X || wb(this);
      if (this.V.la) return this.V.count.value += 1, this;
      var a = nb,
          b = Object,
          c = b.create,
          d = Object.getPrototypeOf(this),
          e = this.V;
      a = a(c.call(b, d, {
        V: {
          value: {
            count: e.count,
            ka: e.ka,
            la: e.la,
            X: e.X,
            Y: e.Y,
            aa: e.aa,
            da: e.da
          }
        }
      }));
      a.V.count.value += 1;
      a.V.ka = !1;
      return a;
    };

    W.prototype["delete"] = function () {
      this.V.X || wb(this);
      this.V.ka && !this.V.la && N("Object already scheduled for deletion");
      kb(this);
      mb(this.V);
      this.V.la || (this.V.aa = void 0, this.V.X = void 0);
    };

    W.prototype.isDeleted = function () {
      return !this.V.X;
    };

    W.prototype.deleteLater = function () {
      this.V.X || wb(this);
      this.V.ka && !this.V.la && N("Object already scheduled for deletion");
      bb.push(this);
      1 === bb.length && db && db(cb);
      this.V.ka = !0;
      return this;
    };

    X.prototype.Qa = function (a) {
      this.Fa && (a = this.Fa(a));
      return a;
    };

    X.prototype.Aa = function (a) {
      this.ga && this.ga(a);
    };

    X.prototype.argPackAdvance = 8;
    X.prototype.readValueFromPointer = qb;

    X.prototype.deleteObject = function (a) {
      if (null !== a) a["delete"]();
    };

    X.prototype.fromWireType = function (a) {
      function b() {
        return this.pa ? Jb(this.W.fa, {
          Y: this.Xa,
          X: c,
          da: this,
          aa: a
        }) : Jb(this.W.fa, {
          Y: this,
          X: a
        });
      }

      var c = this.Qa(a);
      if (!c) return this.Aa(a), null;
      var d = Hb(this.W, c);

      if (void 0 !== d) {
        if (0 === d.V.count.value) return d.V.X = c, d.V.aa = a, d.clone();
        d = d.clone();
        this.Aa(a);
        return d;
      }

      d = this.W.Pa(c);
      d = xb[d];
      if (!d) return b.call(this);
      d = this.oa ? d.Ma : d.pointerType;
      var e = Gb(c, this.W, d.W);
      return null === e ? b.call(this) : this.pa ? Jb(d.W.fa, {
        Y: d,
        X: e,
        da: this,
        aa: a
      }) : Jb(d.W.fa, {
        Y: d,
        X: e
      });
    };

    Mb = h.UnboundTypeError = Ya("UnboundTypeError");
    var ka = !1,
        dc = "function" === typeof atob ? atob : function (a) {
      var b = "",
          c = 0;
      a = a.replace(/[^A-Za-z0-9\+\/=]/g, "");

      do {
        var d = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
        var e = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
        var f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
        var m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(a.charAt(c++));
        d = d << 2 | e >> 4;
        e = (e & 15) << 4 | f >> 2;
        var g = (f & 3) << 6 | m;
        b += String.fromCharCode(d);
        64 !== f && (b += String.fromCharCode(e));
        64 !== m && (b += String.fromCharCode(g));
      } while (c < a.length);

      return b;
    };

    function D(a) {
      if (a.startsWith(Qa)) {
        a = a.slice(Qa.length);

        if ("boolean" === typeof fa && fa) {
          var b = Buffer.from(a, "base64");
          b = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
        } else try {
          var c = dc(a),
              d = new Uint8Array(c.length);

          for (a = 0; a < c.length; ++a) {
            d[a] = c.charCodeAt(a);
          }

          b = d;
        } catch (e) {
          throw Error("Converting base64 string to bytes failed.");
        }

        return b;
      }
    }

    var fc = {
      m: function m(a, b, c) {
        a = Q(a);
        b = jb(b, "wrapper");
        c = O(c);
        var d = [].slice,
            e = b.W,
            f = e.fa,
            m = e.$.fa,
            g = e.$.constructor;
        a = Wa(a, function () {
          e.$.Ea.forEach(function (l) {
            if (this[l] === m[l]) throw new $a("Pure virtual function " + l + " must be implemented in JavaScript");
          }.bind(this));
          Object.defineProperty(this, "__parent", {
            value: f
          });

          this.__construct.apply(this, d.call(arguments));
        });

        f.__construct = function () {
          this === f && N("Pass correct 'this' to __construct");
          var l = g.implement.apply(void 0, [this].concat(d.call(arguments)));
          kb(l);
          var p = l.V;
          l.notifyOnDestruction();
          p.la = !0;
          Object.defineProperties(this, {
            V: {
              value: p
            }
          });
          nb(this);
          l = p.X;
          l = eb(e, l);
          R.hasOwnProperty(l) ? N("Tried to register registered instance: " + l) : R[l] = this;
        };

        f.__destruct = function () {
          this === f && N("Pass correct 'this' to __destruct");
          kb(this);
          var l = this.V.X;
          l = eb(e, l);
          R.hasOwnProperty(l) ? delete R[l] : N("Tried to unregister unregistered instance: " + l);
        };

        a.prototype = Object.create(f);

        for (var k in c) {
          a.prototype[k] = c[k];
        }

        return P(a);
      },
      H: function H(a) {
        var b = ob[a];
        delete ob[a];
        var c = b.ua,
            d = b.ga,
            e = b.Da,
            f = e.map(function (m) {
          return m.Ta;
        }).concat(e.map(function (m) {
          return m.$a;
        }));
        U([a], f, function (m) {
          var g = {};
          e.forEach(function (k, l) {
            var p = m[l],
                q = k.Ra,
                u = k.Sa,
                z = m[l + e.length],
                x = k.Za,
                I = k.ab;
            g[k.Oa] = {
              read: function read(n) {
                return p.fromWireType(q(u, n));
              },
              write: function write(n, t) {
                var v = [];
                x(I, n, z.toWireType(v, t));
                pb(v);
              }
            };
          });
          return [{
            name: b.name,
            fromWireType: function fromWireType(k) {
              var l = {},
                  p;

              for (p in g) {
                l[p] = g[p].read(k);
              }

              d(k);
              return l;
            },
            toWireType: function toWireType(k, l) {
              for (var p in g) {
                if (!(p in l)) throw new TypeError('Missing field:  "' + p + '"');
              }

              var q = c();

              for (p in g) {
                g[p].write(q, l[p]);
              }

              null !== k && k.push(d, q);
              return q;
            },
            argPackAdvance: 8,
            readValueFromPointer: qb,
            ba: d
          }];
        });
      },
      y: function y() {},
      E: function E(a, b, c, d, e) {
        var f = vb(c);
        b = Q(b);
        V(a, {
          name: b,
          fromWireType: function fromWireType(m) {
            return !!m;
          },
          toWireType: function toWireType(m, g) {
            return g ? d : e;
          },
          argPackAdvance: 8,
          readValueFromPointer: function readValueFromPointer(m) {
            if (1 === c) var g = Ea;else if (2 === c) g = F;else if (4 === c) g = G;else throw new TypeError("Unknown boolean type size: " + b);
            return this.fromWireType(g[m >> f]);
          },
          ba: null
        });
      },
      c: function c(a, b, _c, d, e, f, m, g, k, l, p, q, u) {
        p = Q(p);
        f = Y(e, f);
        g && (g = Y(m, g));
        l && (l = Y(k, l));
        u = Y(q, u);
        var z = Va(p);
        zb(z, function () {
          Z("Cannot construct " + p + " due to unbound types", [d]);
        });
        U([a, b, _c], d ? [d] : [], function (x) {
          x = x[0];

          if (d) {
            var I = x.W;
            var n = I.fa;
          } else n = W.prototype;

          x = Wa(z, function () {
            if (Object.getPrototypeOf(this) !== t) throw new Za("Use 'new' to construct " + p);
            if (void 0 === v.ia) throw new Za(p + " has no accessible constructor");
            var y = v.ia[arguments.length];
            if (void 0 === y) throw new Za("Tried to invoke ctor of " + p + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(v.ia).toString() + ") parameters instead!");
            return y.apply(this, arguments);
          });
          var t = Object.create(n, {
            constructor: {
              value: x
            }
          });
          x.prototype = t;
          var v = new Ab(p, x, t, u, I, f, g, l);
          I = new X(p, v, !0, !1);
          n = new X(p + "*", v, !1, !1);
          var w = new X(p + " const*", v, !1, !0);
          xb[a] = {
            pointerType: n,
            Ma: w
          };
          Kb(z, x);
          return [I, n, w];
        });
      },
      i: function i(a, b, c, d, e, f, m) {
        var g = Pb(c, d);
        b = Q(b);
        f = Y(e, f);
        U([], [a], function (k) {
          function l() {
            Z("Cannot call " + p + " due to unbound types", g);
          }

          k = k[0];
          var p = k.name + "." + b;
          b.startsWith("@@") && (b = Symbol[b.substring(2)]);
          var q = k.W.constructor;
          void 0 === q[b] ? (l.ja = c - 1, q[b] = l) : (yb(q, b, p), q[b].Z[c - 1] = l);
          U([], g, function (u) {
            u = [u[0], null].concat(u.slice(1));
            u = Ob(p, u, null, f, m);
            void 0 === q[b].Z ? (u.ja = c - 1, q[b] = u) : q[b].Z[c - 1] = u;
            return [];
          });
          return [];
        });
      },
      f: function f(a, b, c, d, e, _f, m, g) {
        b = Q(b);
        _f = Y(e, _f);
        U([], [a], function (k) {
          k = k[0];
          var l = k.name + "." + b,
              p = {
            get: function get() {
              Z("Cannot access " + l + " due to unbound types", [c]);
            },
            enumerable: !0,
            configurable: !0
          };
          p.set = g ? function () {
            Z("Cannot access " + l + " due to unbound types", [c]);
          } : function () {
            N(l + " is a read-only property");
          };
          Object.defineProperty(k.W.constructor, b, p);
          U([], [c], function (q) {
            q = q[0];
            var u = {
              get: function get() {
                return q.fromWireType(_f(d));
              },
              enumerable: !0
            };
            g && (g = Y(m, g), u.set = function (z) {
              var x = [];
              g(d, q.toWireType(x, z));
              pb(x);
            });
            Object.defineProperty(k.W.constructor, b, u);
            return [];
          });
          return [];
        });
      },
      p: function p(a, b, c, d, e, f) {
        assert(0 < b);
        var m = Pb(b, c);
        e = Y(d, e);
        U([], [a], function (g) {
          g = g[0];
          var k = "constructor " + g.name;
          void 0 === g.W.ia && (g.W.ia = []);
          if (void 0 !== g.W.ia[b - 1]) throw new Za("Cannot register multiple constructors with identical number of parameters (" + (b - 1) + ") for class '" + g.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");

          g.W.ia[b - 1] = function () {
            Z("Cannot construct " + g.name + " due to unbound types", m);
          };

          U([], m, function (l) {
            l.splice(1, 0, null);
            g.W.ia[b - 1] = Ob(k, l, null, e, f);
            return [];
          });
          return [];
        });
      },
      a: function a(_a, b, c, d, e, f, m, g) {
        var k = Pb(c, d);
        b = Q(b);
        f = Y(e, f);
        U([], [_a], function (l) {
          function p() {
            Z("Cannot call " + q + " due to unbound types", k);
          }

          l = l[0];
          var q = l.name + "." + b;
          b.startsWith("@@") && (b = Symbol[b.substring(2)]);
          g && l.W.Ea.push(b);
          var u = l.W.fa,
              z = u[b];
          void 0 === z || void 0 === z.Z && z.className !== l.name && z.ja === c - 2 ? (p.ja = c - 2, p.className = l.name, u[b] = p) : (yb(u, b, q), u[b].Z[c - 2] = p);
          U([], k, function (x) {
            x = Ob(q, x, l, f, m);
            void 0 === u[b].Z ? (x.ja = c - 2, u[b] = x) : u[b].Z[c - 2] = x;
            return [];
          });
          return [];
        });
      },
      b: function b(a, _b, c, d, e, f, m, g, k, l) {
        _b = Q(_b);
        e = Y(d, e);
        U([], [a], function (p) {
          p = p[0];
          var q = p.name + "." + _b,
              u = {
            get: function get() {
              Z("Cannot access " + q + " due to unbound types", [c, m]);
            },
            enumerable: !0,
            configurable: !0
          };
          u.set = k ? function () {
            Z("Cannot access " + q + " due to unbound types", [c, m]);
          } : function () {
            N(q + " is a read-only property");
          };
          Object.defineProperty(p.W.fa, _b, u);
          U([], k ? [c, m] : [c], function (z) {
            var x = z[0],
                I = {
              get: function get() {
                var t = Qb(this, p, q + " getter");
                return x.fromWireType(e(f, t));
              },
              enumerable: !0
            };

            if (k) {
              k = Y(g, k);
              var n = z[1];

              I.set = function (t) {
                var v = Qb(this, p, q + " setter"),
                    w = [];
                k(l, v, n.toWireType(w, t));
                pb(w);
              };
            }

            Object.defineProperty(p.W.fa, _b, I);
            return [];
          });
          return [];
        });
      },
      D: function D(a, b) {
        b = Q(b);
        V(a, {
          name: b,
          fromWireType: function fromWireType(c) {
            var d = O(c);
            Rb(c);
            return d;
          },
          toWireType: function toWireType(c, d) {
            return P(d);
          },
          argPackAdvance: 8,
          readValueFromPointer: qb,
          ba: null
        });
      },
      k: function k(a, b, c, d) {
        function e() {}

        c = vb(c);
        b = Q(b);
        e.values = {};
        V(a, {
          name: b,
          constructor: e,
          fromWireType: function fromWireType(f) {
            return this.constructor.values[f];
          },
          toWireType: function toWireType(f, m) {
            return m.value;
          },
          argPackAdvance: 8,
          readValueFromPointer: Sb(b, c, d),
          ba: null
        });
        zb(b, e);
      },
      j: function j(a, b, c) {
        var d = jb(a, "enum");
        b = Q(b);
        a = d.constructor;
        d = Object.create(d.constructor.prototype, {
          value: {
            value: c
          },
          constructor: {
            value: Wa(d.name + "_" + b, function () {})
          }
        });
        a.values[c] = d;
        a[b] = d;
      },
      r: function r(a, b, c) {
        c = vb(c);
        b = Q(b);
        V(a, {
          name: b,
          fromWireType: function fromWireType(d) {
            return d;
          },
          toWireType: function toWireType(d, e) {
            return e;
          },
          argPackAdvance: 8,
          readValueFromPointer: Tb(b, c),
          ba: null
        });
      },
      K: function K(a, b, c, d, e, f) {
        var m = Pb(b, c);
        a = Q(a);
        e = Y(d, e);
        zb(a, function () {
          Z("Cannot call " + a + " due to unbound types", m);
        }, b - 1);
        U([], m, function (g) {
          g = [g[0], null].concat(g.slice(1));
          Kb(a, Ob(a, g, null, e, f), b - 1);
          return [];
        });
      },
      h: function h(a, b, c, d, e) {
        function f(l) {
          return l;
        }

        b = Q(b);
        -1 === e && (e = 4294967295);
        var m = vb(c);

        if (0 === d) {
          var g = 32 - 8 * c;

          f = function f(l) {
            return l << g >>> g;
          };
        }

        var k = b.includes("unsigned");
        V(a, {
          name: b,
          fromWireType: f,
          toWireType: function toWireType(l, p) {
            if ("number" !== typeof p && "boolean" !== typeof p) throw new TypeError('Cannot convert "' + Db(p) + '" to ' + this.name);
            if (p < d || p > e) throw new TypeError('Passing a number "' + Db(p) + '" from JS side to C/C++ side to an argument of type "' + b + '", which is outside the valid range [' + d + ", " + e + "]!");
            return k ? p >>> 0 : p | 0;
          },
          argPackAdvance: 8,
          readValueFromPointer: Ub(b, m, 0 !== d),
          ba: null
        });
      },
      g: function g(a, b, c) {
        function d(f) {
          f >>= 2;
          var m = H;
          return new e(Da, m[f + 1], m[f]);
        }

        var e = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][b];
        c = Q(c);
        V(a, {
          name: c,
          fromWireType: d,
          argPackAdvance: 8,
          readValueFromPointer: d
        }, {
          Ua: !0
        });
      },
      s: function s(a, b) {
        b = Q(b);
        var c = "std::string" === b;
        V(a, {
          name: b,
          fromWireType: function fromWireType(d) {
            var e = H[d >> 2];
            if (c) for (var f = d + 4, m = 0; m <= e; ++m) {
              var g = d + 4 + m;

              if (m == e || 0 == E[g]) {
                f = f ? sa(E, f, g - f) : "";
                if (void 0 === k) var k = f;else k += String.fromCharCode(0), k += f;
                f = g + 1;
              }
            } else {
              k = Array(e);

              for (m = 0; m < e; ++m) {
                k[m] = String.fromCharCode(E[d + 4 + m]);
              }

              k = k.join("");
            }
            T(d);
            return k;
          },
          toWireType: function toWireType(d, e) {
            e instanceof ArrayBuffer && (e = new Uint8Array(e));
            var f = "string" === typeof e;
            f || e instanceof Uint8Array || e instanceof Uint8ClampedArray || e instanceof Int8Array || N("Cannot pass non-string to std::string");
            var m = (c && f ? function () {
              for (var l = 0, p = 0; p < e.length; ++p) {
                var q = e.charCodeAt(p);
                55296 <= q && 57343 >= q && (q = 65536 + ((q & 1023) << 10) | e.charCodeAt(++p) & 1023);
                127 >= q ? ++l : l = 2047 >= q ? l + 2 : 65535 >= q ? l + 3 : l + 4;
              }

              return l;
            } : function () {
              return e.length;
            })(),
                g = ec(4 + m + 1);
            H[g >> 2] = m;
            if (c && f) ua(e, g + 4, m + 1);else if (f) for (f = 0; f < m; ++f) {
              var k = e.charCodeAt(f);
              255 < k && (T(g), N("String has UTF-16 code units that do not fit in 8 bits"));
              E[g + 4 + f] = k;
            } else for (f = 0; f < m; ++f) {
              E[g + 4 + f] = e[f];
            }
            null !== d && d.push(T, g);
            return g;
          },
          argPackAdvance: 8,
          readValueFromPointer: qb,
          ba: function ba(d) {
            T(d);
          }
        });
      },
      o: function o(a, b, c) {
        c = Q(c);

        if (2 === b) {
          var d = wa;
          var e = ya;
          var f = za;

          var m = function m() {
            return xa;
          };

          var g = 1;
        } else 4 === b && (d = Aa, e = Ba, f = Ca, m = function m() {
          return H;
        }, g = 2);

        V(a, {
          name: c,
          fromWireType: function fromWireType(k) {
            for (var l = H[k >> 2], p = m(), q, u = k + 4, z = 0; z <= l; ++z) {
              var x = k + 4 + z * b;
              if (z == l || 0 == p[x >> g]) u = d(u, x - u), void 0 === q ? q = u : (q += String.fromCharCode(0), q += u), u = x + b;
            }

            T(k);
            return q;
          },
          toWireType: function toWireType(k, l) {
            "string" !== typeof l && N("Cannot pass non-string to C++ string type " + c);
            var p = f(l),
                q = ec(4 + p + b);
            H[q >> 2] = p >> g;
            e(l, q + 4, p + b);
            null !== k && k.push(T, q);
            return q;
          },
          argPackAdvance: 8,
          readValueFromPointer: qb,
          ba: function ba(k) {
            T(k);
          }
        });
      },
      I: function I(a, b, c, d, e, f) {
        ob[a] = {
          name: Q(b),
          ua: Y(c, d),
          ga: Y(e, f),
          Da: []
        };
      },
      G: function G(a, b, c, d, e, f, m, g, k, l) {
        ob[a].Da.push({
          Oa: Q(b),
          Ta: c,
          Ra: Y(d, e),
          Sa: f,
          $a: m,
          Za: Y(g, k),
          ab: l
        });
      },
      F: function F(a, b) {
        b = Q(b);
        V(a, {
          Wa: !0,
          name: b,
          argPackAdvance: 0,
          fromWireType: function fromWireType() {},
          toWireType: function toWireType() {}
        });
      },
      l: function l(a, b, c) {
        a = O(a);
        b = jb(b, "emval::as");
        var d = [],
            e = P(d);
        G[c >> 2] = e;
        return b.toWireType(d, a);
      },
      q: function q(a, b, c, d, e) {
        a = Xb[a];
        b = O(b);
        c = Wb(c);
        var f = [];
        G[d >> 2] = P(f);
        return a(b, c, f, e);
      },
      e: function e(a, b, c, d) {
        a = Xb[a];
        b = O(b);
        c = Wb(c);
        a(b, c, null, d);
      },
      J: Rb,
      d: function d(a, b) {
        var c = Zb(a, b),
            d = c[0];
        b = d.name + "_$" + c.slice(1).map(function (p) {
          return p.name;
        }).join("_") + "$";
        var e = $b[b];
        if (void 0 !== e) return e;
        e = ["retType"];

        for (var f = [d], m = "", g = 0; g < a - 1; ++g) {
          m += (0 !== g ? ", " : "") + "arg" + g, e.push("argType" + g), f.push(c[1 + g]);
        }

        var k = "return function " + Va("methodCaller_" + b) + "(handle, name, destructors, args) {\n",
            l = 0;

        for (g = 0; g < a - 1; ++g) {
          k += "    var arg" + g + " = argType" + g + ".readValueFromPointer(args" + (l ? "+" + l : "") + ");\n", l += c[g + 1].argPackAdvance;
        }

        k += "    var rv = handle[name](" + m + ");\n";

        for (g = 0; g < a - 1; ++g) {
          c[g + 1].deleteObject && (k += "    argType" + g + ".deleteObject(arg" + g + ");\n");
        }

        d.Wa || (k += "    return retType.toWireType(destructors, rv);\n");
        e.push(k + "};\n");
        a = Nb(e).apply(null, f);
        e = Yb(a);
        return $b[b] = e;
      },
      M: function M(a) {
        a = Wb(a);
        return P(h[a]);
      },
      v: function v(a, b) {
        a = O(a);
        b = O(b);
        return P(a[b]);
      },
      L: function L(a) {
        4 < a && (M[a].va += 1);
      },
      u: function u(a) {
        return P(Wb(a));
      },
      w: function w(a) {
        var b = O(a);
        pb(b);
        Rb(a);
      },
      C: function C(a, b) {
        a = jb(a, "_emval_take_value");
        a = a.readValueFromPointer(b);
        return P(a);
      },
      t: function t() {
        oa("");
      },
      n: function n(a) {
        var b = E.length;
        a >>>= 0;
        if (2147483648 < a) return !1;

        for (var c = 1; 4 >= c; c *= 2) {
          var d = b * (1 + .2 / c);
          d = Math.min(d, a + 100663296);
          d = Math.max(a, d);
          0 < d % 65536 && (d += 65536 - d % 65536);

          a: {
            try {
              pa.grow(Math.min(2147483648, d) - Da.byteLength + 65535 >>> 16);
              Ha();
              var e = 1;
              break a;
            } catch (f) {}

            e = void 0;
          }

          if (e) return !0;
        }

        return !1;
      },
      B: function B() {
        return 0;
      },
      x: function x() {},
      A: function A(a, b, c, d) {
        for (var e = 0, f = 0; f < c; f++) {
          var m = G[b >> 2],
              g = G[b + 4 >> 2];
          b += 8;

          for (var k = 0; k < g; k++) {
            var l = E[m + k],
                p = ac[a];
            0 === l || 10 === l ? ((1 === a ? la : ma)(sa(p, 0)), p.length = 0) : p.push(l);
          }

          e += g;
        }

        G[d >> 2] = e;
        return 0;
      },
      z: function z() {}
    };

    (function () {
      function a(e) {
        h.asm = e.exports;
        pa = h.asm.N;
        Ha();
        Ia = h.asm.T;
        Ka.unshift(h.asm.O);
        J--;
        h.monitorRunDependencies && h.monitorRunDependencies(J);
        0 == J && (null !== Na && (clearInterval(Na), Na = null), Pa && (e = Pa, Pa = null, e()));
      }

      function b(e) {
        a(e.instance);
      }

      function c(e) {
        return Ta().then(function (f) {
          return WebAssembly.instantiate(f, d);
        }).then(function (f) {
          return f;
        }).then(e, function (f) {
          ma("failed to asynchronously prepare wasm: " + f);
          oa(f);
        });
      }

      var d = {
        a: fc
      };
      J++;
      h.monitorRunDependencies && h.monitorRunDependencies(J);
      if (h.instantiateWasm) try {
        return h.instantiateWasm(d, a);
      } catch (e) {
        return ma("Module.instantiateWasm callback failed with error: " + e), !1;
      }
      (function () {
        return na || "function" !== typeof WebAssembly.instantiateStreaming || K.startsWith(Qa) || K.startsWith("file://") || "function" !== typeof fetch ? c(b) : fetch(K, {
          credentials: "same-origin"
        }).then(function (e) {
          return WebAssembly.instantiateStreaming(e, d).then(b, function (f) {
            ma("wasm streaming compile failed: " + f);
            ma("falling back to ArrayBuffer instantiation");
            return c(b);
          });
        });
      })().catch(ba);
      return {};
    })();

    h.___wasm_call_ctors = function () {
      return (h.___wasm_call_ctors = h.asm.O).apply(null, arguments);
    };

    var ec = h._malloc = function () {
      return (ec = h._malloc = h.asm.P).apply(null, arguments);
    },
        ib = h.___getTypeName = function () {
      return (ib = h.___getTypeName = h.asm.Q).apply(null, arguments);
    };

    h.___embind_register_native_and_builtin_types = function () {
      return (h.___embind_register_native_and_builtin_types = h.asm.R).apply(null, arguments);
    };

    var T = h._free = function () {
      return (T = h._free = h.asm.S).apply(null, arguments);
    };

    h.dynCall_jiji = function () {
      return (h.dynCall_jiji = h.asm.U).apply(null, arguments);
    };

    var gc;

    Pa = function hc() {
      gc || ic();
      gc || (Pa = hc);
    };

    function ic() {
      function a() {
        if (!gc && (gc = !0, h.calledRun = !0, !qa)) {
          Ua(Ka);
          aa(h);
          if (h.onRuntimeInitialized) h.onRuntimeInitialized();
          if (h.postRun) for ("function" == typeof h.postRun && (h.postRun = [h.postRun]); h.postRun.length;) {
            var b = h.postRun.shift();
            La.unshift(b);
          }
          Ua(La);
        }
      }

      if (!(0 < J)) {
        if (h.preRun) for ("function" == typeof h.preRun && (h.preRun = [h.preRun]); h.preRun.length;) {
          Ma();
        }
        Ua(Ja);
        0 < J || (h.setStatus ? (h.setStatus("Running..."), setTimeout(function () {
          setTimeout(function () {
            h.setStatus("");
          }, 1);
          a();
        }, 1)) : a());
      }
    }

    h.run = ic;
    if (h.preInit) for ("function" == typeof h.preInit && (h.preInit = [h.preInit]); 0 < h.preInit.length;) {
      h.preInit.pop()();
    }
    ic();
    return Rive.ready;
  };
}();

var _default = Rive;
exports.default = _default;
},{"path":"node_modules/path-browserify/index.js","fs":"node_modules/parcel-bundler/src/builtins/_empty.js","process":"node_modules/process/browser.js","buffer":"node_modules/buffer/index.js"}],"node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)?\/[^/]+(?:\?.*)?$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"node_modules/parcel-bundler/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();

  newLink.onload = function () {
    link.remove();
  };

  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;

function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":"node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"main.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"node_modules/parcel-bundler/src/builtins/css-loader.js"}],"index.js":[function(require,module,exports) {
"use strict";

require("regenerator-runtime/runtime");

var _rive_canvas_light = _interopRequireDefault(require("../../../js/dist/rive_canvas_light.mjs"));

require("./main.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var rive, canvas, renderer, loadFile, lastTime, artboard, animation, draw;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            draw = function _draw(time) {
              if (!lastTime) {
                lastTime = time;
              }

              var elapsedSeconds = (time - lastTime) / 1000;
              lastTime = time;
              renderer.clear();

              if (artboard) {
                animation.advance(elapsedSeconds);
                animation.apply(artboard, 1);
                artboard.advance(elapsedSeconds);
                renderer.save();
                renderer.align(rive.Fit.contain, rive.Alignment.center, {
                  minX: 0,
                  minY: 0,
                  maxX: canvas.width,
                  maxY: canvas.height
                }, artboard.bounds);
                artboard.draw(renderer);
                renderer.restore();
              }

              renderer.flush();
              requestAnimationFrame(draw);
            };

            loadFile = function _loadFile(droppedFile) {
              var reader = new FileReader();

              reader.onload = function (event) {
                var file = rive.load(new Uint8Array(event.target.result));
                artboard = file.defaultArtboard();
                animation = new rive.LinearAnimationInstance(artboard.animationByIndex(0));
              };

              reader.readAsArrayBuffer(droppedFile);
            };

            _context.next = 4;
            return (0, _rive_canvas_light.default)();

          case 4:
            rive = _context.sent;
            canvas = document.getElementById('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            renderer = rive.makeRenderer(canvas);

            window.onresize = function () {
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
            }; // 'assets/lets_get_animated.wav'
            //  await (await fetch(new Request(filename))).arrayBuffer()


            document.body.addEventListener('dragover', function (ev) {
              ev.preventDefault();
            });
            document.body.addEventListener('drop', function (ev) {
              ev.preventDefault();

              if (ev.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                  // If dropped items aren't files, reject them
                  if (ev.dataTransfer.items[i].kind === 'file') {
                    loadFile(ev.dataTransfer.items[i].getAsFile());
                    break;
                  }
                }
              } else {
                for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                  loadFile(ev.dataTransfer.files[i]);
                  break;
                }
              }
            });
            lastTime = 0;
            requestAnimationFrame(draw);

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _main.apply(this, arguments);
}

main();
},{"regenerator-runtime/runtime":"node_modules/regenerator-runtime/runtime.js","../../../js/dist/rive_canvas_light.mjs":"../../../js/dist/rive_canvas_light.mjs","./main.css":"main.css"}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "60397" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.js"], null)
//# sourceMappingURL=/skia_renderer.e31bb0bc.js.map