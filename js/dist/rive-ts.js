var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
define("rive-ts", ["require", "exports"], function (require, exports) {
    "use strict";
    var _canvas, _src, _buffer, _autoplay, _events, _artboard, _ctx, _renderer;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testables = exports.RiveAnimation = exports._loadWasm = void 0;
    const Rive = require('../../wasm/publish/rive');
    // #region Type declarations
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
    let _runtime;
    // Is the Wasm bundle loaded?
    const _isWasmLoaded = () => _runtime !== undefined;
    // Is the Wasm bundle loading; prevents multiple concurrent Wasm loads
    let _isWasmLoading = false;
    // Queue of callbacks called when Wasm is loaded
    const _wasmLoadQueue = [];
    // Loads the runtime Wasm bundle
    const _loadWasm = () => __awaiter(void 0, void 0, void 0, function* () {
        yield Rive({
            // fetches the Wasm bundle
            locateFile: (file) => 'file://../../wasm/publish/' + file
        }).then((r) => {
            var _a;
            _runtime = r;
            // Fire all the callbacks
            while (_wasmLoadQueue.length > 0) {
                (_a = _wasmLoadQueue.shift()) === null || _a === void 0 ? void 0 : _a(_runtime);
            }
        }).catch(e => {
            console.error('Unable to load Wasm module');
            throw e;
        });
    });
    exports._loadWasm = _loadWasm;
    // Adds a listener for Wasm load
    const _onWasmLoaded = (cb) => {
        if (!_isWasmLoading) {
            // Start loading Wasm
            _isWasmLoading = true;
            exports._loadWasm();
        }
        if (_runtime !== undefined) {
            // Wasm already loaded, fire immediately
            cb(_runtime);
        }
        else {
            // Add to the callback queue
            _wasmLoadQueue.push(cb);
        }
    };
    // Unloads the Wasm bundle; used in testing
    const _unloadWasm = () => {
        _runtime = undefined;
        _isWasmLoading = false;
    };
    class RiveAnimation {
        constructor(canvas, buffer, src, onload, autoplay = false) {
            _canvas.set(this, void 0);
            _src.set(this, void 0);
            _buffer.set(this, void 0);
            _autoplay.set(this, void 0);
            _events.set(this, { onload: [] });
            _artboard.set(this, void 0);
            _ctx.set(this, void 0);
            _renderer.set(this, void 0);
            __classPrivateFieldSet(this, _canvas, canvas);
            __classPrivateFieldSet(this, _buffer, buffer);
            __classPrivateFieldSet(this, _src, src);
            __classPrivateFieldSet(this, _autoplay, autoplay);
            // Initialize canvas
            __classPrivateFieldSet(this, _ctx, canvas.getContext('2d'));
            // Set up events
            if (onload) {
                __classPrivateFieldGet(this, _events).onload = [onload];
            }
            // When the Wasm bundle is ready, load the file or buffer
            _onWasmLoaded((runtime) => {
                if (__classPrivateFieldGet(this, _src)) {
                    this.loadSource(__classPrivateFieldGet(this, _src));
                }
                else if (__classPrivateFieldGet(this, _buffer)) {
                    this.loadData(__classPrivateFieldGet(this, _buffer));
                }
                else {
                    throw new Error('Either src or buffer required');
                }
            });
        }
        // Getter for autoplay
        get autoplay() {
            return __classPrivateFieldGet(this, _autoplay);
        }
        static fromOptions(options) {
            return new RiveAnimation(options.canvas, options.buffer, options.src, options.onload, options.autoplay);
        }
        // Loads a Rive file
        loadSource(src) {
            return __awaiter(this, void 0, void 0, function* () {
                const req = new Request(src);
                const res = yield fetch(req);
                __classPrivateFieldSet(this, _buffer, yield res.arrayBuffer());
                this.loadData(__classPrivateFieldGet(this, _buffer));
            });
        }
        // Loads data from the buffer
        loadData(buffer) {
            const riveFile = _runtime.load(new Uint8Array(__classPrivateFieldGet(this, _buffer)));
            if (riveFile) {
                this.emit('load', `${__classPrivateFieldGet(this, _src) ? __classPrivateFieldGet(this, _src) : ''}`);
                this.initialize(riveFile);
            }
            else {
                throw new Error('Bad Rive data');
            }
        }
        // Initializes for playback
        initialize(riveFile) {
            __classPrivateFieldSet(this, _artboard, riveFile.defaultArtboard());
            __classPrivateFieldSet(this, _renderer, new _runtime.CanvasRenderer(__classPrivateFieldGet(this, _ctx)));
            this.drawFrame();
        }
        // Draws a single frame of the artboard
        drawFrame() {
            var _a, _b;
            (_a = __classPrivateFieldGet(this, _ctx)) === null || _a === void 0 ? void 0 : _a.save();
            __classPrivateFieldGet(this, _artboard).advance(0);
            __classPrivateFieldGet(this, _artboard).draw(__classPrivateFieldGet(this, _renderer));
            (_b = __classPrivateFieldGet(this, _ctx)) === null || _b === void 0 ? void 0 : _b.restore();
        }
        // Emits a new event
        emit(eventName, message) {
            const events = __classPrivateFieldGet(this, _events)['on' + eventName];
            events.forEach(event => {
                event(message);
            });
        }
    }
    exports.RiveAnimation = RiveAnimation;
    _canvas = new WeakMap(), _src = new WeakMap(), _buffer = new WeakMap(), _autoplay = new WeakMap(), _events = new WeakMap(), _artboard = new WeakMap(), _ctx = new WeakMap(), _renderer = new WeakMap();
    // #endregion
    // Exports for testing purposes only
    exports.testables = {
        loadWasm: exports._loadWasm,
        isWasmLoaded: _isWasmLoaded,
        onWasmLoaded: _onWasmLoaded,
        unloadWasm: _unloadWasm
    };
});
