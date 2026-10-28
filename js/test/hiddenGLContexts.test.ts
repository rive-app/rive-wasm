// Runs the wasm pre-js renderer glue against a fake WebGL to count the hidden
// contexts it holds: Chrome caps live WebGL contexts per page at 16.
import * as fs from "fs";
import * as path from "path";

const UNMASKED_VENDOR = 0x9245;
const UNMASKED_RENDERER = 0x9246;

type GPU = { vendor: string; device: string; pls: boolean };
const CHROME_METAL: GPU = {
  vendor: "Google Inc. (Apple)",
  device: "ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)",
  pls: false,
};
const PLS: GPU = { vendor: "Google Inc. (NVIDIA)", device: "ANGLE (D3D11)", pls: true };
const MSAA: GPU = { vendor: "Mozilla", device: "Mozilla", pls: false };

interface FakeContext {
  canvas: HTMLCanvasElement;
  antialias: boolean;
  lost: boolean;
  isContextLost(): boolean;
  getParameter(p: number): unknown;
  getExtension(name: string): unknown;
  [k: string]: unknown;
}

let contexts: FakeContext[];
let maxLiveHidden: number;
let domCanvases: Set<HTMLCanvasElement>;

const live = (c: FakeContext) => !c.lost;
const hidden = () => contexts.filter((c) => !domCanvases.has(c.canvas));
const liveHidden = () => hidden().filter(live).length;

// Creates after the first `maxContexts` webgl contexts return null.
function installFakeWebGL(gpu: GPU, maxContexts = Infinity) {
  contexts = [];
  maxLiveHidden = 0;
  domCanvases = new Set();
  const byCanvas = new Map<HTMLCanvasElement, unknown>();
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockImplementation(function (
      this: HTMLCanvasElement,
      type: string,
      attrs?: { antialias?: boolean },
    ) {
      // Browsers hand back the same (possibly lost) context on every call.
      if (byCanvas.has(this)) {
        return byCanvas.get(this);
      }
      if (type === "2d") {
        const ctx2d = {};
        byCanvas.set(this, ctx2d);
        return ctx2d;
      }
      if (contexts.length >= maxContexts) {
        return null;
      }
      const canvas = this;
      const gl: FakeContext = {
        canvas,
        antialias: !!attrs?.antialias,
        lost: false,
        MAX_RENDERBUFFER_SIZE: 1,
        MAX_TEXTURE_SIZE: 2,
        isContextLost() {
          return gl.lost;
        },
        getParameter(p: number) {
          if (p === UNMASKED_VENDOR) return gpu.vendor;
          if (p === UNMASKED_RENDERER) return gpu.device;
          return 4096;
        },
        getExtension(name: string) {
          switch (name) {
            case "WEBGL_shader_pixel_local_storage":
              return gpu.pls ? {} : null;
            case "WEBGL_debug_renderer_info":
              return {
                UNMASKED_VENDOR_WEBGL: UNMASKED_VENDOR,
                UNMASKED_RENDERER_WEBGL: UNMASKED_RENDERER,
              };
            case "WEBGL_lose_context":
              return {
                loseContext() {
                  gl.lost = true;
                  // Dispatched synchronously, which is stricter than the
                  // browser's queued task for listener ordering.
                  canvas.dispatchEvent(new Event("webglcontextlost"));
                },
              };
          }
          return null;
        },
      };
      contexts.push(gl);
      byCanvas.set(this, gl);
      maxLiveHidden = Math.max(maxLiveHidden, liveHidden());
      return gl;
    } as unknown as HTMLCanvasElement["getContext"]);
}

function fakeEmscriptenGL() {
  const GL = {
    contexts: {} as Record<number, { GLctx: FakeContext } | null>,
    nextHandle: 1,
    current: 0,
    registerContext(gl: FakeContext) {
      const handle = GL.nextHandle++;
      GL.contexts[handle] = { GLctx: gl };
      return handle;
    },
    makeContextCurrent(handle: number) {
      GL.current = handle;
      return true;
    },
    deleteContext(handle: number) {
      if (GL.current === handle) GL.current = 0;
      GL.contexts[handle] = null;
    },
    // What emscripten's context table still pins (and so keeps alive).
    pinned() {
      return Object.values(GL.contexts)
        .filter(Boolean)
        .map((c) => c!.GLctx);
    },
  };
  return GL;
}

// The glue wraps delete() on the instance; nativeDelete keeps the original.
function makeNativeRenderer() {
  const nativeDelete = jest.fn();
  return {
    nativeDelete,
    delete: nativeDelete,
    setInkbleed: jest.fn(),
    resize: jest.fn(),
    clear: jest.fn(),
  };
}

function loadGlue(file: string, globals: Record<string, unknown>, exports = "") {
  const src = fs.readFileSync(path.join(__dirname, "../../wasm/js", file), "utf8");
  const names = Object.keys(globals);
  return new Function(...names, `${src}\n${exports}`)(
    ...names.map((n) => globals[n]),
  );
}

function domCanvas() {
  const canvas = document.createElement("canvas");
  domCanvases.add(canvas);
  return canvas;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("webgl2 build: shared offscreen context", () => {
  let Module: any;
  let GL: ReturnType<typeof fakeEmscriptenGL>;
  let natives: ReturnType<typeof makeNativeRenderer>[];

  function init(gpu: GPU, maxContexts?: number) {
    installFakeWebGL(gpu, maxContexts);
    GL = fakeEmscriptenGL();
    natives = [];
    Module = {
      makeRenderer: jest.fn(() => {
        const r = makeNativeRenderer();
        natives.push(r);
        return r;
      }),
      Artboard: { prototype: { delete() {}, draw() {} } },
      WebGL2Renderer: { prototype: { clear() {} } },
      Renderer: { prototype: { align() {} } },
      load() {},
    };
    loadGlue("webgl2_renderer.js", {
      Module,
      GL,
      MaxRecentSize: class {},
      AnimationCallbackHandler: class {
        requestAnimationFrame() {}
        cancelAnimationFrame() {}
        enableFPSCounter() {}
      },
      frameEnd: (f: unknown) => f,
    });
    Module.onRuntimeInitialized();
  }

  test.each([
    ["Chrome on Metal", CHROME_METAL],
    ["pixel local storage", PLS],
  ])("releases the MSAA probe when dropping MSAA (%s)", (_, gpu) => {
    init(gpu);
    for (let i = 0; i < 3; i++) {
      Module.makeRenderer(domCanvas(), false);
    }
    // Draws through the shared context onto a 2d one.
    Module.makeRenderer(domCanvas(), true);

    const [probe, offscreen] = hidden();
    expect(hidden()).toHaveLength(2);
    expect(probe.antialias).toBe(true);
    expect(offscreen.antialias).toBe(false);
    expect(probe.lost).toBe(true);
    expect(liveHidden()).toBe(1);
    // Released before its replacement was created.
    expect(maxLiveHidden).toBe(1);
    expect(GL.pinned()).not.toContain(probe);
    expect(natives[0].nativeDelete).toHaveBeenCalledTimes(1);

    const dom = contexts.filter((c) => domCanvases.has(c.canvas));
    expect(dom).toHaveLength(3);
    expect(dom.every(live)).toBe(true);
    expect(dom.every((c) => !c.antialias)).toBe(true);
  });

  test("keeps the first context when MSAA stays on", () => {
    init(MSAA);
    Module.makeRenderer(domCanvas(), false);
    Module.makeRenderer(domCanvas(), true);

    expect(hidden()).toHaveLength(1);
    expect(hidden()[0].antialias).toBe(true);
    expect(contexts.every(live)).toBe(true);
  });

  test("throws without pinning the probe when the replacement fails", () => {
    init(CHROME_METAL, 1);

    expect(() => Module.makeRenderer(domCanvas(), false)).toThrow(
      /Unable to create WebGL context/,
    );
    expect(hidden()).toHaveLength(1);
    expect(liveHidden()).toBe(0);
    expect(GL.pinned()).toEqual([]);
  });

  test("deleting a canvas renderer doesn't lose the caller's context", () => {
    init(CHROME_METAL);
    const canvas = domCanvas();
    Module.makeRenderer(canvas, false).delete();
    const again = Module.makeRenderer(canvas, false);

    expect(again).not.toBeNull();
    expect(again._gl.lost).toBe(false);
  });
});

describe("canvas build: WebGL2 atlas context", () => {
  let api: { getWebGL2Renderer(): any };
  let GL: ReturnType<typeof fakeEmscriptenGL>;
  let natives: ReturnType<typeof makeNativeRenderer>[];
  let Module: { makeWebGL2Renderer: jest.Mock };

  function init(gpu: GPU) {
    installFakeWebGL(gpu);
    GL = fakeEmscriptenGL();
    natives = [];
    Module = {
      makeWebGL2Renderer: jest.fn(() => {
        const r = makeNativeRenderer();
        natives.push(r);
        return r;
      }),
    };
    api = loadGlue(
      "canvas_offscreen_webgl2.js",
      { Module, GL, CanvasOffscreenRenderer: class {} },
      "return { getWebGL2Renderer };",
    );
  }

  test.each([
    ["Chrome on Metal", CHROME_METAL],
    ["pixel local storage", PLS],
  ])("releases the MSAA probe when dropping MSAA (%s)", (_, gpu) => {
    init(gpu);
    const errors = jest.spyOn(console, "error").mockImplementation(() => {});
    const renderer = api.getWebGL2Renderer();

    const [probe, atlas] = hidden();
    expect(hidden()).toHaveLength(2);
    expect(probe.lost).toBe(true);
    expect(atlas.lost).toBe(false);
    expect(maxLiveHidden).toBe(1);
    expect(GL.pinned()).toEqual([atlas]);
    expect(natives[0].nativeDelete).toHaveBeenCalledTimes(1);
    // The probe's loss isn't a real context loss.
    expect(renderer._gl).toBe(atlas);
    expect(api.getWebGL2Renderer()).toBe(renderer);
    expect(errors).not.toHaveBeenCalled();
  });

  test("keeps the first context when MSAA stays on", () => {
    init(MSAA);
    api.getWebGL2Renderer();

    expect(hidden()).toHaveLength(1);
    expect(contexts.every(live)).toBe(true);
  });

  test("a real loss of the atlas context still disables WebGL2", () => {
    init(CHROME_METAL);
    jest.spyOn(console, "error").mockImplementation(() => {});
    const renderer = api.getWebGL2Renderer();
    renderer._canvas.dispatchEvent(new Event("webglcontextlost"));

    expect(api.getWebGL2Renderer()).toBeNull();
  });

  test("releases the context when the native renderer fails", () => {
    init(MSAA);
    jest.spyOn(console, "log").mockImplementation(() => {});
    Module.makeWebGL2Renderer.mockReturnValue(null);

    expect(api.getWebGL2Renderer()).toBeNull();
    expect(hidden()).toHaveLength(1);
    expect(liveHidden()).toBe(0);
    expect(GL.pinned()).toEqual([]);
  });
});
