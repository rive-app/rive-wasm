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
        var handle = GL.createContext(canvas, contextAttributes);
        GL.makeContextCurrent(handle);

        return makeRenderer(canvas.width, canvas.height);
    };
};