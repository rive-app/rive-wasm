Module.onRuntimeInitialized = function () {
    const _isFirefox = navigator.userAgent.match(/firefox|fxios/i);
    let _offscreenGL = null;
    const _pendingOffscreenRenderers = new Set();

    function OffscreenRenderer(canvas) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');

        this._realRenderer = _offscreenGL;

        this._drawList = [];
        this._saveCount = 0;

        this['clear'] = function () {
            // This is not expected to be called when there are any saves on the canvas.
            console.assert(this._saveCount == 0);
            this._drawList = [];
            _pendingOffscreenRenderers.delete(this);
        };

        this['save'] = function () {
            ++this._saveCount;
            this._drawList.push(_offscreenGL['save'].bind(_offscreenGL));
        };

        this['restore'] = function () {
            if (this._saveCount > 0) {
                this._drawList.push(_offscreenGL['restore'].bind(_offscreenGL));
                --this._saveCount;
            }
        };

        this['transform'] = function (xform) {
            this._drawList.push(_offscreenGL['transform'].bind(_offscreenGL, xform));
        };

        this['align'] = function (fit, align, from, to) {
            this._drawList.push(_offscreenGL['align'].bind(_offscreenGL, fit, align, from, to));
        };

        this['computeAlignment'] = function (mat2d, fit, align, from, to) {
            this._drawList.push(_offscreenGL['computeAlignment'].bind(
                    _offscreenGL, mat2d, fit, align, from, to));
        };

        this['flush'] = function () {
            console.assert(this._saveCount == 0);
            _pendingOffscreenRenderers.add(this);
            if (_isFirefox) {
                // The atlas gets poor performance on Firefox. Draw/blit the offscreen renderers
                // one-by-one instead of all at once in an atlas.
                flushOffscreenRenderers();
            }
        };
    }

    function makeGLRenderer(canvas) {
        var contextAttributes = {
            'alpha': 1,
            'depth': 0,
            'stencil': 8,
            'antialias': 0,
            'premultipliedAlpha': 1,
            'preserveDrawingBuffer': 0,
            'preferLowPowerToHighPerformance': 0,
            'failIfMajorPerformanceCaveat': 0,
            'enableExtensionsByDefault': 1,
            'explicitSwapControl': 0,
            'renderViaOffscreenBackBuffer': 0
        };

        var gl = canvas.getContext('webgl2', contextAttributes);
        // Fallback for browsers that don't support webgl2 (e.g Safari 14)
        if (!gl) {
            gl = canvas.getContext('webgl', contextAttributes);
        }
        var handle = GL.registerContext(gl, contextAttributes);

        GL.makeContextCurrent(handle);

        const renderer = makeRenderer(canvas.width, canvas.height);
        renderer._handle = handle;
        renderer._canvas = canvas;
        renderer._width = canvas.width;
        renderer._height = canvas.height;
        renderer._gl = gl;
        return renderer;
    }

    const makeRenderer = Module.makeRenderer;
    Module.makeRenderer = function (canvas, useOffScreenRenderer) {
        if (useOffScreenRenderer) {
            if (!_offscreenGL) {
                _offscreenGL = makeGLRenderer(document.createElement('canvas'));
                const gl = _offscreenGL._gl;
                _offscreenGL._maxRTSize = Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                                                   gl.getParameter(gl.MAX_TEXTURE_SIZE));
            }
            return new OffscreenRenderer(canvas);
        }
        return makeGLRenderer(canvas);
    };

    const wasmDraw = Module['Artboard']['prototype']['draw'];
    Module['Artboard']['prototype']['draw'] = function (renderer) {
        if (renderer._drawList) {
            // TODO: Is this safe? If the artboard is mutable, are we OK with rendering whatever
            // state it's in during flush time, rather than right now?
            renderer._drawList.push(wasmDraw.bind(this, renderer._realRenderer));
        } else {
            wasmDraw.call(this, renderer);
        }
    };

    // Finds the next power/log of 2 that is >= n:
    //
    //    nextpow2(7) => 8
    //    nextpow2(8) => 8
    //    nextpow2(9) => 16
    //
    function nextlog2(n) { return n <= 0 ? 0 : 32 - Math.clz32(n - 1); }
    function nextpow2(n) { return 1 << nextlog2(n); }

    const _atlasMaxRecentWidth = new MaxRecentSize(1000/*1sec*/, 8/*aligned to multiples of 256*/);
    const _atlasMaxRecentHeight = new MaxRecentSize(1000/*1sec*/, 8/*aligned to multiples of 256*/);

    // Draws the offscreen renderers all together in a single atlas.
    function flushOffscreenRenderers() {
        const maxRTSize = _offscreenGL._maxRTSize;

        // Gather some atlas stats and transfer the pending renders to a sortable array.
        let maxCanvasWidth = 0, maxCanvasHeight = 0, combinedCanvasArea = 0;
        const flushingRenderers = new Array(_pendingOffscreenRenderers.size);
        let i = 0;
        for (const renderer of _pendingOffscreenRenderers) {
            // Don't let any canvas backings grow larger than the max render target size.
            renderer._backingWidth = Math.min(renderer._canvas.width, maxRTSize);
            renderer._backingHeight = Math.min(renderer._canvas.height, maxRTSize);
            renderer._backingArea = renderer._backingHeight * renderer._backingWidth;
            maxCanvasWidth = Math.max(maxCanvasWidth, renderer._backingWidth);
            maxCanvasHeight = Math.max(maxCanvasHeight, renderer._backingHeight);
            combinedCanvasArea += renderer._backingArea;
            flushingRenderers[i++] = renderer;
        }
        _pendingOffscreenRenderers.clear();
        if (combinedCanvasArea <= 0) {
            return;
        }

        // Determine an initial size for the atlas.
        let atlasInitialWidth = nextpow2(maxCanvasWidth);
        let atlasInitialHeight = nextpow2(maxCanvasHeight);
        while (atlasInitialHeight * atlasInitialWidth < combinedCanvasArea) {
            if (atlasInitialWidth <= atlasInitialHeight) {
                atlasInitialWidth *= 2;
            } else {
                atlasInitialHeight *= 2;
            }
        }
        atlasInitialWidth = Math.min(atlasInitialWidth, maxRTSize);
        atlasInitialWidth = Math.min(atlasInitialHeight, maxRTSize);

        // Sort the renders, largest canvases first. This yields more efficient atlas packing.
        flushingRenderers.sort((a, b) => { return b._backingArea - a._backingArea; });

        // Render the canvasas in as few atlases as possible.
        const rectanizer = new Module['DynamicRectanizer'](maxRTSize);
        let flushStartIdx = 0;
        while (flushStartIdx < flushingRenderers.length) {
            rectanizer.reset(atlasInitialWidth, atlasInitialHeight);

            // Stuff as many canvases into the atlas as we can fit.
            let flushEndIdx = flushStartIdx;
            for (; flushEndIdx < flushingRenderers.length; ++flushEndIdx) {
                const renderer = flushingRenderers[flushEndIdx];
                let pos = rectanizer['addRect'](renderer._backingWidth, renderer._backingHeight);
                if (pos < 0) {
                    // The atlas ran out of room. Flush.
                    // (The atlas should always be big enough to fit at least one canvas.)
                    console.assert(flushEndIdx > flushStartIdx);
                    break;
                }
                renderer._atlasX = pos & 0xffff;
                renderer._atlasY = pos >> 16;
            }

            // Determine either:
            //
            //   * How large the atlas needs to be,
            //   * or the largest atlas dimensions we have used over the past second.
            //
            // Take whichever of those is larger and round it up to the nearest multiple of 512.
            const atlasWidth = _atlasMaxRecentWidth.push(rectanizer['drawWidth']());
            const atlasHeight = _atlasMaxRecentHeight.push(rectanizer['drawHeight']());
            console.assert(atlasWidth >= rectanizer['drawWidth']());
            console.assert(atlasHeight >= rectanizer['drawHeight']());
            console.assert(atlasWidth <= maxRTSize);
            console.assert(atlasHeight <= maxRTSize);
            if (_offscreenGL._canvas.width != atlasWidth) {
                _offscreenGL._canvas.width = atlasWidth;
            }
            if (_offscreenGL._canvas.height != atlasHeight) {
                _offscreenGL._canvas.height = atlasHeight;
            }

            // Render the atlas.
            _offscreenGL['clear']();
            for (let i = flushStartIdx; i < flushEndIdx; ++i) {
                const renderer = flushingRenderers[i];

                // Clip to prevent the artboard from drawing outside its bounds.
                _offscreenGL['saveClipRect'](renderer._atlasX,
                                             renderer._atlasY,
                                             renderer._atlasX + renderer._backingWidth,
                                             renderer._atlasY + renderer._backingHeight);

                // Transform to the artboard's location in the atlas.
                let mat = new Module['Mat2D']();
                mat['xx'] = renderer._backingWidth / renderer._canvas.width;
                mat['yy'] = renderer._backingHeight / renderer._canvas.height;
                mat['xy'] = mat['yx'] = 0;
                mat['tx'] = renderer._atlasX;
                mat['ty'] = renderer._atlasY;
                _offscreenGL['transform'](mat);

                for (const lambda of renderer._drawList) {
                    lambda();
                }

                _offscreenGL['restoreClipRect']();

                renderer._drawList = [];
            }
            _offscreenGL['flush']();

            // Copy out from the atlas back into canvases.
            for (let i = flushStartIdx; i < flushEndIdx; ++i) {
                const renderer = flushingRenderers[i];
                const ctx = renderer._ctx;
                ctx.globalCompositeOperation = 'copy';
                ctx.drawImage(_offscreenGL._canvas,
                              renderer._atlasX,
                              renderer._atlasY,
                              renderer._backingWidth,
                              renderer._backingHeight,
                              0,
                              0,
                              renderer._canvas.width,
                              renderer._canvas.height);
            }

            flushStartIdx = flushEndIdx;
        }
    }

    let _mainAnimationCallbackID = 0;
    let _lastAnimationSubCallbackID = 0;
    let _animationSubCallbacks = new Map();

    Module['requestAnimationFrame'] = function(callback) {
        if (!_mainAnimationCallbackID) {
            _mainAnimationCallbackID = window['requestAnimationFrame'](mainAnimationCallback);
        }
        const id = ++_lastAnimationSubCallbackID;
        _animationSubCallbacks.set(id, callback);
        return id;
    }

    function mainAnimationCallback(time) {
        // Snap off and reset the sub-callbacks first, since they might call requestAnimationFrame
        // recursively.
        const flushingSubCallbacks = _animationSubCallbacks;
        _mainAnimationCallbackID = 0;
        _lastAnimationSubCallbackID = 0;
        _animationSubCallbacks = new Map();

        // Invoke all pending animation callbacks.
        flushingSubCallbacks.forEach((callback) => {
            try {
                callback(time);
            } catch (err) {
                console.error(err);
            }
        });

        // Flush the offscreen atlas once all canvases have been queued up.
        flushOffscreenRenderers();
    }

    Module['cancelAnimationFrame'] = function(id) {
        _animationSubCallbacks.delete(id);
        if (_mainAnimationCallbackID && _animationSubCallbacks.size == 0) {
            window['cancelAnimationFrame'](_mainAnimationCallbackID);
            _mainAnimationCallbackID = 0;
        }
    }

    const cppClear = Module['WebGLRenderer']['prototype']['clear'];
    Module['WebGLRenderer']['prototype']['clear'] = function () {
        // Resize Skia surface if the canvas size changed.
        GL.makeContextCurrent(this._handle);
        const canvas = this._canvas;
        if (this._width != canvas.width || this._height != canvas.height) {
            this.resize(canvas.width, canvas.height);
            this._width = canvas.width;
            this._height = canvas.height;
        }
        cppClear.call(this);
    };
};
