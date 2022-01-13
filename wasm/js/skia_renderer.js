Module.onRuntimeInitialized = function () {
    const makeRenderer = Module.makeRenderer;
    Module.makeRenderer = function (canvas) {
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