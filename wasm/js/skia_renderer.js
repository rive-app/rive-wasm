Module.onRuntimeInitialized = function () {
    function OffscreenRenderer(canvas) {
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');

        this._realRenderer = _offscreenGL;
        this['clear'] = function () {
            const canvas = this._canvas;
            const glCanvas = _offscreenGL._canvas;

            if (glCanvas.width < canvas.width || glCanvas.height < canvas.height) {
                glCanvas.width = canvas.width;
                glCanvas.height = canvas.height;
            }
            _offscreenGL.clear();
        };

        this['save'] = function () {
            _offscreenGL.save();
        };

        this['restore'] = function () {
            _offscreenGL.restore();
        };

        this['transform'] = function (xform) {
            _offscreenGL.transform(xform);
        };

        this['align'] = function (fit, align, from, to) {
            _offscreenGL.align(fit, align, from, to);
        };

        this['computeAlignment'] = function (mat2d, fit, align, from, to) {
            _offscreenGL.computeAlignment(mat2d, fit, align, from, to);
        };

        this['flush'] = function () {
            _offscreenGL.flush();
            const ctx = this._ctx;
            ctx.globalCompositeOperation = 'copy';
            ctx.drawImage(_offscreenGL._canvas, 0, 0);
        };
    }

    let _offscreenGL = null;

    function makeGLRenderer(canvas) {
        var contextAttributes = {
            'alpha': 1,
            'depth': 1,
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

        var ctx = canvas.getContext('webgl2', contextAttributes);
        // Fallback for browsers that don't support webgl2 (e.g Safari 14)
        if (!ctx) {
            ctx = canvas.getContext('webgl', contextAttributes);
        }
        var handle = GL.registerContext(ctx, contextAttributes);

        GL.makeContextCurrent(handle);

        const renderer = makeRenderer(canvas.width, canvas.height);
        renderer._handle = handle;
        renderer._canvas = canvas;
        renderer._width = canvas.width;
        renderer._height = canvas.height;
        return renderer;
    }

    const makeRenderer = Module.makeRenderer;
    Module.makeRenderer = function (canvas, useOffScreenRenderer) {
        if (useOffScreenRenderer) {
            if (!_offscreenGL) {
                _offscreenGL = makeGLRenderer(document.createElement('canvas'));
            }
            return new OffscreenRenderer(canvas);
        }
        return makeGLRenderer(canvas);
    };

    const wasmDraw = Module['Artboard']['prototype']['draw'];
    Module['Artboard']['prototype']['draw'] = function (renderer) {
        const realRenderer = renderer._realRenderer;
        wasmDraw.call(this, realRenderer || renderer);
    };

    const cppClear = Module['WebGLRenderer']['prototype']['clear'];
    Module['WebGLRenderer']['prototype']['clear'] = function () {
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
