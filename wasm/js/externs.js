var Rive = {
    RenderPaintStyle: {
        fill: {},
        stroke: {}
    },
    FillRule: {
        evenOdd: {},
        nonZero: {}
    },
    StrokeCap: {
        butt: {},
        round: {},
        square: {}
    },
    StrokeJoin: {
        miter: {},
        round: {},
        bevel: {}
    },
    BlendMode: {
        srcOver: {},
        screen: {},
        overlay: {},
        darken: {},
        lighten: {},
        colorDodge: {},
        colorBurn: {},
        hardLight: {},
        softLight: {},
        difference: {},
        exclusion: {},
        multiply: {},
        hue: {},
        saturation: {},
        color: {},
        luminosity: {}
    },
    Renderer: {},
    CanvasRenderer: {},
    RenderPath: {},
    RenderPaint: {},
    RenderImage: {},
    renderFactory: {
        makeRenderPaint: function () {},
        makeRenderPath: function () {},
        makeRenderImage: function () {},
    },
    onRuntimeInitialized: function () {},
    makeRenderer: function () {}
};