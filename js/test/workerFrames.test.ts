// The frame pacing for canvases on the replay worker only exists in the
// threaded webgl2 build, which jest cannot load, so this runs its pre-js glue
// against a fake worker and a hand-cranked requestAnimationFrame.
import * as fs from "fs";
import * as path from "path";

const glue = (name: string) =>
  fs.readFileSync(path.join(__dirname, "../../wasm/js", name), "utf8");

const kTimeOrigin = 1000;

class FakeWorker {
  static instances: FakeWorker[] = [];
  static blocked = false;
  asks = 0;
  asked = false;
  onmessage: ((event: { data: number }) => void) | null = null;
  constructor() {
    if (FakeWorker.blocked) {
      throw new Error("blocked by the page's policy");
    }
    FakeWorker.instances.push(this);
  }
  postMessage() {
    this.asks += 1;
    this.asked = true;
  }
  // One of the worker's animation frames, which it has only when asked,
  // posted on the clock both threads share.
  frame(pageTime: number) {
    if (this.asked) {
      this.asked = false;
      this.onmessage?.({ data: kTimeOrigin + pageTime });
    }
  }
}

class FakeCanvas {
  width = 10;
  height = 10;
  transferControlToOffscreen() {
    return {};
  }
}

interface Harness {
  handler: any;
  module: any;
  worker: () => FakeWorker | undefined;
  pagePending: () => number;
  pageFrame: (time: number) => void;
  pageCancels: number[];
  now: { value: number };
  // Makes a canvas draw on the replay worker, which starts the frame worker.
  drawOnWorker: () => void;
}

function load(): Harness {
  FakeWorker.instances = [];
  const pageCallbacks = new Map<number, (time: number) => void>();
  const pageCancels: number[] = [];
  let lastPageId = 0;
  const now = { value: 0 };
  const module: any = {
    makeRenderer: () => ({}),
    makeWorkerRenderer: () => ({ surfaceRef: () => 1 }),
    WebGL2WorkerRenderer: { prototype: { clear() {} } },
    _riveReplayWorkerListening: () => true,
    _riveReplayWorkerThread: () => 1,
    _riveReplayWorkerEnable: () => {},
  };
  const globals: Record<string, unknown> = {
    Module: module,
    ENVIRONMENT_IS_PTHREAD: false,
    PThread: { pthreads: { 1: { postMessage() {} } } },
    Worker: FakeWorker,
    URL: { createObjectURL: () => "blob:frames" },
    requestAnimationFrame: (callback: (time: number) => void) => {
      pageCallbacks.set(++lastPageId, callback);
      return lastPageId;
    },
    cancelAnimationFrame: (id: number) => {
      pageCancels.push(id);
      pageCallbacks.delete(id);
    },
    performance: { timeOrigin: kTimeOrigin, now: () => now.value },
    OffscreenCanvas: class {
      getContext() {
        return { getExtension: () => null };
      }
    },
    HTMLCanvasElement: FakeCanvas,
    // A registry would release a collected canvas into a later test.
    FinalizationRegistry: undefined,
    riveSyncRendererSize: () => {},
  };
  const source =
    glue("animation_callback_handler.js") +
    glue("replay_worker.js") +
    "\nreturn AnimationCallbackHandler;";
  const AnimationCallbackHandler = new Function(
    ...Object.keys(globals),
    source,
  )(...Object.values(globals));
  module.onRuntimeInitialized();
  const handler = new AnimationCallbackHandler();
  return {
    handler,
    module,
    worker: () => FakeWorker.instances[0],
    pagePending: () => pageCallbacks.size,
    pageFrame: (time) => {
      const callbacks = [...pageCallbacks.values()];
      pageCallbacks.clear();
      callbacks.forEach((callback) => callback(time));
    },
    pageCancels,
    now,
    drawOnWorker: () => {
      expect(module.enableReplayWorker()).toBe(true);
      module.makeRenderer(new FakeCanvas(), false, { replayWorker: true });
    },
  };
}

interface Loop {
  times: number[];
  ids: number[];
  stop: () => void;
}

// A caller that draws on the worker and asks for every next frame.
function animate(h: Harness): Loop {
  let stopped = false;
  const loop: Loop = { times: [], ids: [], stop: () => (stopped = true) };
  const frame = (time: number) => {
    loop.times.push(time);
    stopped || loop.ids.push(h.handler.requestAnimationFrame(frame, true));
  };
  loop.ids.push(h.handler.requestAnimationFrame(frame, true));
  return loop;
}

// Page frames, each after some of the worker's, all 8 ms apart.
function crank(h: Harness, pageFrames: number, workerFramesEach: number) {
  for (let i = 0; i < pageFrames; i++) {
    for (let j = 0; j < workerFramesEach; j++) {
      h.now.value += 8;
      h.worker()!.frame(h.now.value);
    }
    workerFramesEach || (h.now.value += 8);
    h.pageFrame(h.now.value);
  }
}

const last = (ids: number[]) => ids[ids.length - 1];

// A caller wakes the idle loop and the page answers with a frame.
function wake(h: Harness) {
  h.handler.requestAnimationFrame(() => {}, true);
  crank(h, 1, 0);
}

// A harness whose worker has outrun the page, so it paces.
function loadPaced(): Harness {
  const h = load();
  h.drawOnWorker();
  const loop = animate(h);
  crank(h, 1, 0);
  crank(h, 6, 2);
  expect(last(loop.ids)).toBeLessThan(0);
  loop.stop();
  crank(h, 4, 1);
  expect(h.pagePending()).toBe(0);
  return h;
}

afterEach(() => {
  FakeWorker.blocked = false;
});

describe("frames for canvases on the replay worker", () => {
  it("keeps the page's frames for callers that draw on the page", () => {
    const h = loadPaced();
    const asks = h.worker()!.asks;
    const callback = jest.fn();
    expect(h.handler.requestAnimationFrame(callback)).toBeGreaterThan(0);
    expect(h.worker()!.asks).toBe(asks);
    h.worker()!.frame(8);
    expect(callback).not.toHaveBeenCalled();
    h.pageFrame(16);
    expect(callback).toHaveBeenCalledWith(16);
  });

  it("starts no frame worker until a canvas draws on the replay worker", () => {
    const h = load();
    expect(h.worker()).toBeUndefined();
    const callback = jest.fn();
    expect(h.handler.requestAnimationFrame(callback, true)).toBeGreaterThan(0);
    h.pageFrame(16);
    expect(callback).toHaveBeenCalledWith(16);
  });

  it("asks the worker nothing before the page's first frame", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    // An iframe that loads out of view gets no frames of its own.
    expect(h.worker()!.asks).toBe(0);
    expect(loop.times).toEqual([]);
    crank(h, 1, 0);
    expect(h.worker()!.asks).toBe(1);
    expect(loop.times.length).toBe(1);
  });

  it("keeps the page's frames while the worker's are no faster", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    // A worker that misses a frame now and then.
    for (let i = 0; i < 20; i++) {
      crank(h, 29, 1);
      crank(h, 1, 0);
    }
    expect(loop.ids.every((id) => id > 0)).toBe(true);
    expect(loop.times.length).toBe(600);
  });

  it("moves to the worker's frames once they outrun the page's", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    crank(h, 1, 0);
    crank(h, 3, 2);
    expect(loop.ids.every((id) => id > 0)).toBe(true);
    crank(h, 2, 2);
    expect(last(loop.ids)).toBeLessThan(0);
    const frames = loop.times.length;
    // A page slowed to a quarter of the display's rate.
    crank(h, 50, 4);
    expect(loop.times.length).toBe(frames + 200);
    // Handed over on the page's clock.
    expect(last(loop.times)).toBe(h.now.value);
  });

  it("does not take one late page frame for a slower page", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    crank(h, 1, 0);
    crank(h, 30, 1);
    crank(h, 1, 8);
    crank(h, 30, 1);
    expect(loop.ids.every((id) => id > 0)).toBe(true);
  });

  it("skips a worker frame older than the last frame drawn", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    crank(h, 1, 0);
    crank(h, 3, 2);
    h.worker()!.frame(h.now.value + 8);
    h.worker()!.frame(h.now.value + 16);
    // The page was busy, and the worker's next frame is still on its way.
    h.now.value += 200;
    h.pageFrame(h.now.value);
    expect(last(loop.ids)).toBeLessThan(0);
    const asks = h.worker()!.asks;
    h.worker()!.frame(h.now.value - 100);
    expect(last(loop.times)).toBe(h.now.value);
    expect(h.worker()!.asks).toBe(asks + 1);
    h.worker()!.frame(h.now.value + 8);
    expect(last(loop.times)).toBe(h.now.value + 8);
  });

  it("does not count a page whose frames stopped for the worker", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    crank(h, 1, 0);
    for (let i = 0; i < 6; i++) {
      crank(h, 1, 40);
    }
    expect(loop.ids.every((id) => id > 0)).toBe(true);
  });

  it("does not count frames from before a pause for the worker", () => {
    const h = load();
    h.drawOnWorker();
    crank(h, 1, 0);
    for (let i = 0; i < 10; i++) {
      const loop = animate(h);
      crank(h, 1, 2);
      loop.stop();
      crank(h, 4, 1);
      expect(h.pagePending()).toBe(0);
    }
    expect(last(animate(h).ids)).toBeGreaterThan(0);
  });

  it("draws nothing after a pause before the page's next frame", () => {
    const h = loadPaced();
    const asks = h.worker()!.asks;
    // The page may have left the view while nothing animated.
    const loop = animate(h);
    expect(last(loop.ids)).toBeLessThan(0);
    for (let i = 1; i <= 20; i++) {
      h.worker()!.frame(h.now.value + i * 8);
    }
    expect(loop.times).toEqual([]);
    expect(h.worker()!.asks).toBe(asks);
    crank(h, 1, 0);
    h.worker()!.frame(h.now.value + 8);
    expect(loop.times).toEqual([h.now.value, h.now.value + 8]);
  });

  it("holds a frame asked for before a pause until the page's next frame", () => {
    const h = loadPaced();
    wake(h);
    const cancelled = animate(h);
    cancelled.stop();
    h.handler.cancelAnimationFrame(last(cancelled.ids));
    crank(h, 3, 0);
    expect(h.pagePending()).toBe(0);
    expect(h.worker()!.asked).toBe(true);

    const loop = animate(h);
    h.worker()!.frame(h.now.value + 8);
    expect(loop.times).toEqual([]);
    crank(h, 1, 0);
    expect(loop.times).toEqual([h.now.value]);
  });

  it("batches page and worker callers apart", () => {
    const h = loadPaced();
    wake(h);
    const order: string[] = [];
    h.handler.onAfterCallbacks = () => order.push("end");
    h.handler.requestAnimationFrame(() => order.push("page"));
    h.handler.requestAnimationFrame(() => order.push("worker a"), true);
    h.handler.requestAnimationFrame(() => order.push("worker b"), true);
    h.worker()!.frame(h.now.value + 8);
    expect(order).toEqual(["worker a", "worker b", "end"]);
    h.pageFrame(h.now.value + 16);
    expect(order).toEqual(["worker a", "worker b", "end", "page", "end"]);
  });

  it("cancels in the batch the id came from", () => {
    const h = loadPaced();
    wake(h);
    const page = jest.fn();
    const paced = jest.fn();
    const pageId = h.handler.requestAnimationFrame(page);
    const pacedId = h.handler.requestAnimationFrame(paced, true);
    // Both batches number their callbacks from 1.
    expect(pacedId).toBe(-pageId);
    h.handler.cancelAnimationFrame(pacedId);
    h.worker()!.frame(8);
    h.pageFrame(16);
    expect(paced).not.toHaveBeenCalled();
    expect(page).toHaveBeenCalledTimes(1);

    const cancelled = jest.fn();
    const cancels = h.pageCancels.length;
    h.handler.cancelAnimationFrame(h.handler.requestAnimationFrame(cancelled));
    expect(h.pageCancels.length).toBe(cancels + 1);
    h.pageFrame(32);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it("asks the worker for nothing while no caller waits", () => {
    const h = loadPaced();
    const loop = animate(h);
    crank(h, 3, 1);
    loop.stop();
    crank(h, 4, 1);
    const asks = h.worker()!.asks;
    crank(h, 4, 1);
    expect(h.worker()!.asks).toBe(asks);
    expect(h.pagePending()).toBe(0);
  });

  it("stops with the page's frames, and resumes on the next", () => {
    const h = loadPaced();
    const loop = animate(h);
    crank(h, 1, 1);
    const frames = loop.times.length;
    // Out of view the browser holds the page's frames back.
    for (let i = 1; i <= 100; i++) {
      h.worker()!.frame(h.now.value + i * 8);
    }
    expect(loop.times.length).toBe(frames + 16);
    const asks = h.worker()!.asks;

    h.pageFrame(5000);
    expect(loop.times.length).toBe(frames + 17);
    expect(last(loop.times)).toBe(5000);
    expect(h.worker()!.asks).toBe(asks + 1);
    h.worker()!.frame(5008);
    expect(last(loop.times)).toBe(5008);
    expect(last(loop.ids)).toBeLessThan(0);
  });

  it("returns to the page's frames when the worker stops answering", () => {
    const h = loadPaced();
    const loop = animate(h);
    crank(h, 2, 1);
    const frames = loop.times.length;
    const worker = h.worker()!;
    const answer = worker.frame;
    worker.frame = () => {};
    crank(h, 7, 0);
    expect(loop.times.length).toBe(frames);
    crank(h, 3, 0);
    expect(loop.times.length).toBe(frames + 3);
    expect(last(loop.ids)).toBeGreaterThan(0);

    // Pacing again once it outruns the page again.
    worker.frame = answer;
    crank(h, 10, 2);
    expect(last(loop.ids)).toBeLessThan(0);
  });

  it("keeps the page's frames when the worker has none of its own", () => {
    const h = load();
    h.drawOnWorker();
    const loop = animate(h);
    // A worker without requestAnimationFrame never answers.
    h.worker()!.frame = () => {};
    crank(h, 20, 1);
    expect(loop.ids.every((id) => id > 0)).toBe(true);
    expect(loop.times.length).toBe(20);
    expect(h.worker()!.asks).toBe(1);
  });

  it("keeps the page's frames when the page forbids the worker", () => {
    FakeWorker.blocked = true;
    const h = load();
    h.drawOnWorker();
    h.drawOnWorker();
    const callback = jest.fn();
    expect(h.handler.requestAnimationFrame(callback, true)).toBeGreaterThan(0);
    h.pageFrame(16);
    expect(callback).toHaveBeenCalledWith(16);
  });

  it("reports the faster batch as the frame rate", () => {
    const h = loadPaced();
    const rates: number[] = [];
    const page = () => h.handler.requestAnimationFrame(page);
    page();
    animate(h);
    crank(h, 1, 4);
    h.handler.enableFPSCounter((fps: number) => rates.push(fps));
    // 8 ms apart, the page at a quarter of that rate.
    crank(h, 33, 4);
    expect(rates.length).toBe(1);
    expect(Math.round(rates[0])).toBe(125);
  });
});
