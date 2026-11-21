// Runs the canvas build's renderer glue against a fake embind Module to check
// when an image paint's WebGL2 paint is rebuilt. The runtime calls
// modulatedImage() before every draw of an image paint, so the cached paint has
// to follow a changed image, sampler or transform, and only those.
import * as fs from "fs";
import * as path from "path";

type Methods = Record<string, (...args: any[]) => any>;

function fakeEmbindClass(classes: Record<string, any>) {
  function extend(name: string, methods: Methods) {
    function Derived(this: any, ...args: unknown[]) {
      methods.__construct?.apply(this, args);
    }
    Derived.prototype = Object.assign(
      { __parent: { __construct() {}, __destruct() {} } },
      methods,
    );
    (Derived as any).extend = extend;
    classes[name] = Derived;
    return Derived;
  }
  return { extend, prototype: {} };
}

// Embind hands enum values over as one shared object per value.
const enumOf = (...names: string[]) =>
  Object.fromEntries(names.map((n, value) => [n, { value }]));

function loadCanvasRenderer() {
  const classes: Record<string, any> = {};
  const Module: any = {
    RenderPaintStyle: enumOf("fill", "stroke"),
    FillRule: enumOf("nonZero", "evenOdd"),
    StrokeCap: enumOf("butt", "round", "square"),
    StrokeJoin: enumOf("miter", "round", "bevel"),
    StrokePosition: enumOf("center", "inside", "outside"),
    BlendMode: { srcOver: { value: 3 } },
    ImageFilter: enumOf("bilinear", "nearest"),
    ImageWrap: enumOf("clamp", "repeat", "mirror"),
    RenderPath: fakeEmbindClass(classes),
    RenderImage: fakeEmbindClass(classes),
    RenderPaint: fakeEmbindClass(classes),
    Renderer: fakeEmbindClass(classes),
    FileAssetLoader: fakeEmbindClass(classes),
    Artboard: { prototype: {} },
    RendererWrapper: { prototype: { align() {} } },
    makeWebGL2Paint: jest.fn(() => ({})),
    refWebGL2Paint: jest.fn(),
    unrefWebGL2Paint: jest.fn(),
  };
  const globals: Record<string, unknown> = {
    Module,
    canvasOffscreenRenderer: { backend: { supportsPaths: true } },
    AnimationCallbackHandler: class {
      requestAnimationFrame() {}
      cancelAnimationFrame() {}
      enableFPSCounter() {}
      disableFPSCounter() {}
    },
    frameEnd: (f: unknown) => f,
  };
  const src = fs.readFileSync(
    path.join(__dirname, "../../wasm/js/renderer.js"),
    "utf8",
  );
  const names = Object.keys(globals);
  new Function(...names, src)(...names.map((n) => globals[n]));
  Module.onRuntimeInitialized();
  return { Module, CanvasRenderPaint: classes.CanvasRenderPaint };
}

const IDENTITY = [1, 0, 0, 1, 0, 0];

describe("canvas build: image paint", () => {
  let Module: any;
  let paint: any;
  let filter: any;
  let clamp: any;
  let repeat: any;

  // An image the way CanvasRenderImage looks once it has decoded.
  const decoded = () => ({ _image: {}, _webGL2Image: {} });

  const modulate = (image: unknown, m = IDENTITY, wrap = clamp) =>
    paint.modulatedImage(image, filter, wrap, wrap, ...m);

  // What the next draw sends to the WebGL2 renderer, or null when the
  // cached paint is reused.
  const nextDraw = () => {
    const before = Module.makeWebGL2Paint.mock.calls.length;
    paint._acquireWebGL2Paint();
    const calls = Module.makeWebGL2Paint.mock.calls;
    return calls.length === before ? null : calls[calls.length - 1];
  };
  // makeWebGL2Paint's image argument, then the six matrix values.
  const imageArgs = (call: unknown[]) => [call[20], ...call.slice(24, 30)];

  beforeEach(() => {
    const loaded = loadCanvasRenderer();
    Module = loaded.Module;
    paint = new loaded.CanvasRenderPaint();
    filter = Module.ImageFilter.bilinear;
    clamp = Module.ImageWrap.clamp;
    repeat = Module.ImageWrap.repeat;
  });

  test("a changed transform rebuilds the paint", () => {
    const image = decoded();
    modulate(image);
    expect(imageArgs(nextDraw()!)).toEqual([image._webGL2Image, ...IDENTITY]);

    const scaled = [0.5, 0.1, -0.1, 0.5, 20, 30];
    modulate(image, scaled);
    expect(imageArgs(nextDraw()!)).toEqual([image._webGL2Image, ...scaled]);
  });

  test("a changed image rebuilds the paint", () => {
    modulate(decoded());
    nextDraw();

    const other = decoded();
    modulate(other);
    expect(imageArgs(nextDraw()!)[0]).toBe(other._webGL2Image);
  });

  test("a changed sampler rebuilds the paint", () => {
    const image = decoded();
    modulate(image);
    nextDraw();

    modulate(image, IDENTITY, repeat);
    const call = nextDraw()!;
    expect(call[22]).toBe(repeat);
    expect(call[23]).toBe(repeat);
  });

  test("the same image paint every frame reuses the paint", () => {
    const image = decoded();
    modulate(image, [2, 0, 0, 2, 5, 5]);
    nextDraw();

    for (let frame = 0; frame < 3; frame++) {
      modulate(image, [2, 0, 0, 2, 5, 5]);
      expect(nextDraw()).toBeNull();
    }
  });

  test("an image that finishes decoding reaches the paint", () => {
    const image: any = { _image: {}, _webGL2Image: null };
    modulate(image);
    nextDraw();

    image._webGL2Image = {};
    modulate(image);
    expect(imageArgs(nextDraw()!)[0]).toBe(image._webGL2Image);
  });

  test("clearing the image rebuilds the paint without it", () => {
    modulate(decoded());
    nextDraw();

    modulate(null);
    expect(paint._modulatedImage).toBeNull();
    expect(imageArgs(nextDraw()!)[0]).toBeNull();

    modulate(null);
    expect(nextDraw()).toBeNull();
  });
});
