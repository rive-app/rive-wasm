"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

var __classPrivateFieldSet = void 0 && (void 0).__classPrivateFieldSet || function (receiver, privateMap, value) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to set private field on non-instance");
  }

  privateMap.set(receiver, value);
  return value;
};

var __classPrivateFieldGet = void 0 && (void 0).__classPrivateFieldGet || function (receiver, privateMap) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
  }

  return privateMap.get(receiver);
};

define("rive-ts", ["require", "exports"], function (require, exports) {
  "use strict";

  var _canvas, _src, _buffer, _autoplay, _events, _artboard, _ctx, _renderer;

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.testables = exports.RiveAnimation = exports._loadWasm = void 0;

  var Rive = require('../../wasm/publish/rive'); // #region Type declarations
  // // Loop types
  // enum Loop {
  //   OneShot,
  //   Loop,
  //   PingPong,
  // }
  // // Playback states
  // enum Playback {
  //   Play,
  //   Pause,
  //   Stop,
  // }
  // // Loop event
  // type LoopEvent = [name: string, loop: Loop];
  // // Fit types
  // enum Fit {
  //   Cover,
  //   Contain,
  //   Fill,
  //   FitWidth,
  //   FitHeight,
  //   ScaleDown,
  //   None,
  // };
  // // Alignments
  // enum Alignment {
  //   TopLeft,
  //   TopCenter,
  //   TopRight,
  //   CenterLeft,
  //   Center,
  //   CenterRight,
  //   BottomLeft,
  //   BottomCenter,
  //   BottomRight,
  // };
  // // Fit string values
  // const fitValues: string[] = ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none',
  //                                    'scaleDown'];
  // // Canvas string values
  // const alignmentValues: string[] = ['topLeft', 'topCenter', 'topRight', 'centerLeft', 'center',
  //                                          'centerRight', 'bottomLeft', 'bottomCenter', 'bottomRight'];
  // // Alignment of Rive animations in a canvas
  // class CanvasAlignment {
  //   fit: Fit;
  //   alignment: Alignment;
  //   minX: bigint;
  //   minY: bigint;
  //   maxX: bigint | undefined;
  //   maxY: bigint | undefined;
  //   constructor(fit: Fit.None, alignment: Alignment.Center, minX: 0n, minY: 0n,
  //               maxX?: bigint, maxY?: bigint) {
  //     this.fit = fit;
  //     this.alignment = alignment;
  //     this.minX = minX;
  //     this.minY = minY;
  //     this.maxX = maxX;
  //     this.maxY = maxY;
  //   }
  // };
  // #endregion
  // #region Wasm loading
  // Holds a reference to the Rive runtime


  var _runtime; // Is the Wasm bundle loaded?


  var _isWasmLoaded = function _isWasmLoaded() {
    return _runtime !== undefined;
  }; // Is the Wasm bundle loading; prevents multiple concurrent Wasm loads


  var _isWasmLoading = false; // Queue of callbacks called when Wasm is loaded

  var _wasmLoadQueue = []; // Loads the runtime Wasm bundle

  var _loadWasm = function _loadWasm() {
    return __awaiter(void 0, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return Rive({
                // fetches the Wasm bundle
                locateFile: function locateFile(file) {
                  return 'file://../../wasm/publish/' + file;
                }
              }).then(function (r) {
                var _a;

                _runtime = r; // Fire all the callbacks

                while (_wasmLoadQueue.length > 0) {
                  (_a = _wasmLoadQueue.shift()) === null || _a === void 0 ? void 0 : _a(_runtime);
                }
              })["catch"](function (e) {
                console.error('Unable to load Wasm module');
                throw e;
              });

            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));
  };

  exports._loadWasm = _loadWasm; // Adds a listener for Wasm load

  var _onWasmLoaded = function _onWasmLoaded(cb) {
    if (!_isWasmLoading) {
      // Start loading Wasm
      _isWasmLoading = true;

      exports._loadWasm();
    }

    if (_runtime !== undefined) {
      // Wasm already loaded, fire immediately
      cb(_runtime);
    } else {
      // Add to the callback queue
      _wasmLoadQueue.push(cb);
    }
  }; // Unloads the Wasm bundle; used in testing


  var _unloadWasm = function _unloadWasm() {
    _runtime = undefined;
    _isWasmLoading = false;
  };

  var RiveAnimation = /*#__PURE__*/function () {
    function RiveAnimation(canvas, buffer, src, onload) {
      var _this = this;

      var autoplay = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

      _classCallCheck(this, RiveAnimation);

      _canvas.set(this, void 0);

      _src.set(this, void 0);

      _buffer.set(this, void 0);

      _autoplay.set(this, void 0);

      _events.set(this, {
        onload: []
      });

      _artboard.set(this, void 0);

      _ctx.set(this, void 0);

      _renderer.set(this, void 0);

      __classPrivateFieldSet(this, _canvas, canvas);

      __classPrivateFieldSet(this, _buffer, buffer);

      __classPrivateFieldSet(this, _src, src);

      __classPrivateFieldSet(this, _autoplay, autoplay); // Initialize canvas


      __classPrivateFieldSet(this, _ctx, canvas.getContext('2d')); // Set up events


      if (onload) {
        __classPrivateFieldGet(this, _events).onload = [onload];
      } // When the Wasm bundle is ready, load the file or buffer


      _onWasmLoaded(function (runtime) {
        if (__classPrivateFieldGet(_this, _src)) {
          _this.loadSource(__classPrivateFieldGet(_this, _src));
        } else if (__classPrivateFieldGet(_this, _buffer)) {
          _this.loadData(__classPrivateFieldGet(_this, _buffer));
        } else {
          throw new Error('Either src or buffer required');
        }
      });
    } // Getter for autoplay


    _createClass(RiveAnimation, [{
      key: "autoplay",
      get: function get() {
        return __classPrivateFieldGet(this, _autoplay);
      }
    }, {
      key: "loadSource",
      value: // Loads a Rive file
      function loadSource(src) {
        return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
          var req, res;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  req = new Request(src);
                  _context2.next = 3;
                  return fetch(req);

                case 3:
                  res = _context2.sent;
                  _context2.t0 = __classPrivateFieldSet;
                  _context2.t1 = this;
                  _context2.t2 = _buffer;
                  _context2.next = 9;
                  return res.arrayBuffer();

                case 9:
                  _context2.t3 = _context2.sent;
                  (0, _context2.t0)(_context2.t1, _context2.t2, _context2.t3);
                  this.loadData(__classPrivateFieldGet(this, _buffer));

                case 12:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this);
        }));
      } // Loads data from the buffer

    }, {
      key: "loadData",
      value: function loadData(buffer) {
        var riveFile = _runtime.load(new Uint8Array(__classPrivateFieldGet(this, _buffer)));

        if (riveFile) {
          this.emit('load', "".concat(__classPrivateFieldGet(this, _src) ? __classPrivateFieldGet(this, _src) : ''));
          this.initialize(riveFile);
        } else {
          throw new Error('Bad Rive data');
        }
      } // Initializes for playback

    }, {
      key: "initialize",
      value: function initialize(riveFile) {
        __classPrivateFieldSet(this, _artboard, riveFile.defaultArtboard());

        __classPrivateFieldSet(this, _renderer, new _runtime.CanvasRenderer(__classPrivateFieldGet(this, _ctx)));

        this.drawFrame();
      } // Draws a single frame of the artboard

    }, {
      key: "drawFrame",
      value: function drawFrame() {
        var _a, _b;

        (_a = __classPrivateFieldGet(this, _ctx)) === null || _a === void 0 ? void 0 : _a.save();

        __classPrivateFieldGet(this, _artboard).advance(0);

        __classPrivateFieldGet(this, _artboard).draw(__classPrivateFieldGet(this, _renderer));

        (_b = __classPrivateFieldGet(this, _ctx)) === null || _b === void 0 ? void 0 : _b.restore();
      } // Emits a new event

    }, {
      key: "emit",
      value: function emit(eventName, message) {
        var events = __classPrivateFieldGet(this, _events)['on' + eventName];

        events.forEach(function (event) {
          event(message);
        });
      }
    }], [{
      key: "fromOptions",
      value: function fromOptions(options) {
        return new RiveAnimation(options.canvas, options.buffer, options.src, options.onload, options.autoplay);
      }
    }]);

    return RiveAnimation;
  }();

  exports.RiveAnimation = RiveAnimation;
  _canvas = new WeakMap(), _src = new WeakMap(), _buffer = new WeakMap(), _autoplay = new WeakMap(), _events = new WeakMap(), _artboard = new WeakMap(), _ctx = new WeakMap(), _renderer = new WeakMap(); // #endregion
  // Exports for testing purposes only

  exports.testables = {
    loadWasm: exports._loadWasm,
    isWasmLoaded: _isWasmLoaded,
    onWasmLoaded: _onWasmLoaded,
    unloadWasm: _unloadWasm
  };
});
