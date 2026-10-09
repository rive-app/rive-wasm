// AnimaScript modules run on the page's own wasm engine. These load files
// rive-cli baked from packages/runtime/tests/web_scripting/fixture through
// the public API, the way an app does, and watch what the scripts log and
// draw.
import * as rive from "../../src/rive";
import { webScriptingFixture } from "../helpers";

const lines: string[] = (globalThis as any).riveConsoleLines;

const fixture = webScriptingFixture;

const newCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  return canvas;
};

const instances: rive.Rive[] = [];

const play = (
  params: Omit<rive.RiveParameters, "canvas">,
): Promise<{ r: rive.Rive; canvas: HTMLCanvasElement }> =>
  new Promise((resolve, reject) => {
    const canvas = newCanvas();
    const r: rive.Rive = new rive.Rive({
      autoplay: true,
      ...params,
      canvas,
      onLoad: () => resolve({ r, canvas }),
      onLoadError: (event: rive.Event) =>
        reject(new Error(String(event?.data ?? "load error"))),
    });
    instances.push(r);
  });

const frames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      if (--remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

const logged = (text: string): boolean =>
  lines.some((line) => line.includes(text));

const expectLogged = (...texts: string[]) => {
  const missing = texts.filter((text) => !logged(text));
  expect({ missing, lines }).toEqual({ missing: [], lines });
};

const awaitLogged = async (...texts: string[]): Promise<void> => {
  const deadline = Date.now() + 4000;
  while (!texts.every(logged) && Date.now() < deadline) {
    await frames(1);
    await new Promise((done) => setTimeout(done, 10));
  }
  expectLogged(...texts);
};

type CanvasEvent = { type: string; props: { value?: string } };

const events = (canvas: HTMLCanvasElement): CanvasEvent[] =>
  (canvas.getContext("2d") as any).__getEvents();

// Fills per drawn frame, split on the clearRect each frame starts with.
const fillsByFrame = (canvas: HTMLCanvasElement): number[] => {
  const out: number[] = [];
  for (const event of events(canvas)) {
    if (event.type === "clearRect") {
      out.push(0);
    } else if (event.type === "fill" && out.length > 0) {
      out[out.length - 1]++;
    }
  }
  return out;
};

describe("AnimaScript on the web", () => {
  beforeEach(() => {
    lines.length = 0;
  });

  afterEach(() => {
    for (const r of instances.splice(0)) {
      r.cleanup();
    }
  });

  test("a script runs init, advances and draws", async () => {
    const { canvas } = await play({ buffer: fixture("basic.riv") });
    await frames(6);
    expectLogged("init ran on the web", "clocks ok", "random ok", "drew frame 2");
    const fillStyles = events(canvas)
      .filter((event) => event.type === "fillStyle")
      .map((event) => event.props.value);
    expect(fillStyles).toContain("#336699");
    expect(fillsByFrame(canvas).some((fills) => fills > 0)).toBe(true);
  });

  test("a RiveFile's module serves every instance made from it", async () => {
    const file = new rive.RiveFile({ buffer: fixture("basic.riv") });
    await file.init();
    expect(lines.filter((line) => line.includes("init ran")).length).toBe(0);
    await play({ riveFile: file });
    await play({ riveFile: file });
    await frames(4);
    expect(lines.filter((line) => line.includes("init ran")).length).toBe(2);
    file.cleanup();
  });

  test("the bridge counts its traffic only while asked", async () => {
    const runtime = (await rive.RuntimeLoader.awaitInstance()) as any;
    const scripting = runtime.riveScripting;
    scripting.countHostCalls(true);
    await play({ buffer: fixture("basic.riv") });
    await frames(4);
    const counted = scripting.hostCallCounts();
    // Every log line stages its text into librive's heap.
    expect(counted.hostCalls).toBeGreaterThan(0);
    expect(counted.bytesStaged).toBeGreaterThanOrEqual(
      "init ran on the web".length,
    );
    scripting.countHostCalls(false);
    await frames(4);
    expect(scripting.hostCallCounts().hostCalls).toBe(0);
  });

  test("a script trap is reported and the page keeps drawing", async () => {
    // A trapped advance asks for no more frames, so draw regardless.
    const { r, canvas } = await play({
      buffer: fixture("trap.riv"),
      drawingOptions: rive.DrawOptimizationOptions.AlwaysDraw,
    });
    await frames(10);
    expectLogged(
      "gradient ready",
      "wasm call trapped in host_obj_advance",
      "drew after advance 3",
    );
    const drawn = fillsByFrame(canvas).length;
    await frames(5);
    expect(r.isPlaying).toBe(true);
    const later = fillsByFrame(canvas);
    expect(later.length).toBeGreaterThan(drawn);
    expect(later[later.length - 1]).toBeGreaterThan(0);
  });

  test("a module importing an op the host lacks still starts", async () => {
    await play({ buffer: fixture("unlinked.riv") });
    await frames(4);
    expectLogged(
      "init without the missing op",
      "failed to call unlinked import function rive_web_gate_v1.missing",
    );
  });

  describe("image decode", () => {
    const saved = {
      createImageBitmap: (globalThis as any).createImageBitmap,
      OffscreenCanvas: (globalThis as any).OffscreenCanvas,
    };

    beforeEach(() => {
      // Accepts bytes starting with a PNG signature byte as a 2x1 image whose
      // first pixel is straight red at half alpha.
      (globalThis as any).createImageBitmap = async (blob: Blob) => {
        const bytes = await new Promise<Uint8Array>((done) => {
          const reader = new FileReader();
          reader.onload = () =>
            done(new Uint8Array(reader.result as ArrayBuffer));
          reader.readAsArrayBuffer(blob);
        });
        if (bytes[0] !== 0x89) {
          throw new Error("not an image");
        }
        return { width: 2, height: 1 };
      };
      (globalThis as any).OffscreenCanvas = class {
        getContext() {
          return {
            drawImage() {},
            getImageData: () => ({
              data: new Uint8ClampedArray([200, 0, 0, 128, 0, 0, 255, 255]),
            }),
          };
        }
      };
    });

    afterEach(() => {
      Object.assign(globalThis, saved);
    });

    test("goes through the browser decoder and arrives premultiplied", async () => {
      await play({ buffer: fixture("decode.riv") });
      await awaitLogged(
        "decoded 2x1 first pixel 100,128",
        "decode failed: failed to decode image data",
      );
    });
  });
});
