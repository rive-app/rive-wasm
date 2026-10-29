// The replay worker itself only exists in the threaded webgl2 build, which jest
// cannot load. What these cover is the page side: rive.ts asking for the worker,
// pacing frames to it, and keeping its canvas on deferred files. The renderer is
// the canvas build's, dressed as a worker renderer through the methods rive.ts
// reads off it.
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

const newCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  return canvas;
};

const createRive = (params: rive.RiveParameters): Promise<rive.Rive> =>
  new Promise((resolve, reject) => {
    const r: rive.Rive = new rive.Rive({
      ...params,
      onLoad: () => resolve(r),
      onLoadError: (event: rive.Event) =>
        reject(new Error(String(event?.data ?? "load error"))),
    });
  });

const nextFrames = (count = 3): Promise<void> =>
  new Promise((resolve) => {
    let remaining = count;
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });

const rendererOf = (r: rive.Rive): any => (r as any).renderer;
const fileOf = (r: rive.Rive): rive.RiveFile => (r as any).riveFile;

/** What a worker renderer would report, per renderer. */
interface WorkerState {
  accepts: boolean;
  restored: boolean;
  clears: number;
  resizes: [number, number][];
  deleted: boolean;
  // detachSession and delete, in call order.
  calls: string[];
}

/**
 * Makes every renderer the runtime hands out claim to replay on the worker,
 * and records the options rive.ts asked for. Returns the per renderer state
 * and a restore function.
 */
const stubWorkerRenderers = async (onWorker = () => true) => {
  const runtime = (await rive.RuntimeLoader.awaitInstance()) as any;
  const realMakeRenderer = runtime.makeRenderer;
  const options: any[] = [];
  const states: WorkerState[] = [];
  runtime.makeRenderer = function (...args: any[]) {
    options.push(args[2]);
    const renderer = realMakeRenderer.apply(this, args);
    if (!onWorker()) {
      return renderer;
    }
    const state: WorkerState = {
      accepts: true,
      restored: false,
      clears: 0,
      resizes: [],
      deleted: false,
      calls: [],
    };
    states.push(state);
    return new Proxy(renderer, {
      get(target: any, property: string | symbol) {
        switch (property) {
          case "replaysOnWorker":
            return () => true;
          case "acceptsFrame":
            return () => state.accepts;
          case "contextRestored":
            return () => state.restored;
          case "clear":
            return () => {
              state.clears += 1;
              return target.clear();
            };
          case "resize":
            return (width: number, height: number) => {
              state.resizes.push([width, height]);
              return target.resize?.(width, height);
            };
          case "detachSession":
            return () => {
              state.calls.push("detach");
              return target.detachSession();
            };
          case "delete":
            return () => {
              state.deleted = true;
              state.calls.push("delete");
              return target.delete();
            };
        }
        const value = target[property];
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };
  return {
    options,
    states,
    restore: () => {
      runtime.makeRenderer = realMakeRenderer;
    },
  };
};

const stateMachineParams = (canvas: HTMLCanvasElement) => ({
  canvas,
  buffer: stateMachineFileBuffer,
  artboard: "MyArtboard",
  stateMachines: "StateMachine",
  autoplay: true,
});

beforeEach(() => {
  (window as any).ResizeObserver = MockResizeObserver;
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("deferred instances ask for the worker unless they opt out", async () => {
  const stub = await stubWorkerRenderers(() => false);
  const instances: rive.Rive[] = [];
  try {
    instances.push(
      await createRive({
        ...stateMachineParams(newCanvas()),
        enableGPUCanvas: true,
      }),
      await createRive({
        ...stateMachineParams(newCanvas()),
        enableGPUCanvas: true,
        useReplayWorker: false,
      }),
      await createRive(stateMachineParams(newCanvas())),
    );
    expect(stub.options.map((o) => o.replayWorker)).toEqual([
      true,
      false,
      false,
    ]);
  } finally {
    instances.forEach((r) => r.cleanup());
    stub.restore();
  }
});

test("frames wait for the worker without advancing, then catch up the whole wait", async () => {
  const stub = await stubWorkerRenderers();
  const r = await createRive({
    ...stateMachineParams(newCanvas()),
    enableGPUCanvas: true,
    drawingOptions: rive.DrawOptimizationOptions.AlwaysDraw,
  });
  try {
    await nextFrames(3);
    const [state] = stub.states;
    state.accepts = false;
    const frames = r.frameCount;
    const clears = state.clears;
    const advance = jest.spyOn(r as any, "advanceAndReportChanges");
    await nextFrames(5);
    // Still scheduling, but nothing advanced or recorded.
    expect(r.frameCount).toBe(frames);
    expect(state.clears).toBe(clears);
    expect(advance).not.toHaveBeenCalled();
    expect((r as any).frameRequestId).not.toBeNull();

    state.accepts = true;
    await nextFrames(2);
    expect(r.frameCount).toBeGreaterThan(frames);
    expect(state.clears).toBeGreaterThan(clears);
    // The first frame back carries the time the held frames would have.
    const [elapsed] = advance.mock.calls[0] as [number];
    expect(elapsed).toBeGreaterThan(3 / 60);
  } finally {
    r.cleanup();
    stub.restore();
  }
});

test("a resize while the worker holds frames back still redraws", async () => {
  const stub = await stubWorkerRenderers();
  const canvas = newCanvas();
  const r = await createRive({
    ...stateMachineParams(canvas),
    enableGPUCanvas: true,
    autoplay: false,
  });
  try {
    await nextFrames(3);
    const [state] = stub.states;
    state.accepts = false;
    const clears = state.clears;
    canvas.width = 240;
    canvas.height = 120;
    r.resizeToCanvas();
    r.drawFrame();
    await nextFrames(3);
    expect(state.clears).toBe(clears);

    state.accepts = true;
    await nextFrames(3);
    // The held back redraw still goes out, with nothing animating to cause one.
    expect(state.clears).toBeGreaterThan(clears);
  } finally {
    r.cleanup();
    stub.restore();
  }
});

test("tearing down with frames in flight lets go of the session before the renderer", async () => {
  const stub = await stubWorkerRenderers();
  const r = await createRive({
    ...stateMachineParams(newCanvas()),
    enableGPUCanvas: true,
  });
  const [state] = stub.states;
  const session = fileOf(r).deferredSession as any;
  const sessionDelete = session.delete.bind(session);
  session.delete = () => {
    state.calls.push("session");
    sessionDelete();
  };
  try {
    await nextFrames(2);
    // The worker is mid replay: it would refuse another frame.
    state.accepts = false;
    const frames = r.frameCount;
    r.cleanup();
    const detach = state.calls.indexOf("detach");
    expect(detach).toBeGreaterThanOrEqual(0);
    expect(detach).toBeLessThan(state.calls.indexOf("session"));
    expect(state.calls.indexOf("session")).toBeLessThan(
      state.calls.indexOf("delete"),
    );
    await nextFrames(3);
    expect(r.frameCount).toBe(frames);
  } finally {
    stub.restore();
  }
});

test("two instances pace to the worker independently", async () => {
  const stub = await stubWorkerRenderers();
  const r1 = await createRive({
    ...stateMachineParams(newCanvas()),
    enableGPUCanvas: true,
  });
  const r2 = await createRive({
    ...stateMachineParams(newCanvas()),
    enableGPUCanvas: true,
  });
  try {
    expect(stub.states).toHaveLength(2);
    expect(fileOf(r1).deferredSession).not.toBe(fileOf(r2).deferredSession);
    stub.states[0].accepts = false;
    await nextFrames(1);
    const held = r1.frameCount;
    const moving = r2.frameCount;
    await nextFrames(4);
    expect(r1.frameCount).toBe(held);
    expect(r2.frameCount).toBeGreaterThan(moving);
  } finally {
    r1.cleanup();
    r2.cleanup();
    stub.restore();
  }
});

test("an immediate file on a worker canvas is re-imported deferred", async () => {
  const stub = await stubWorkerRenderers();
  const file = new rive.RiveFile({ buffer: stateMachineFileBuffer });
  await file.init();
  const r = await createRive({
    canvas: newCanvas(),
    riveFile: file,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
  });
  try {
    expect(fileOf(r)).not.toBe(file);
    expect(fileOf(r).deferredSession).not.toBeNull();
    expect(r.deferredRendererActive).toBe(true);
    expect(
      (console.warn as jest.Mock).mock.calls.some((call) =>
        String(call[0]).includes("replay worker"),
      ),
    ).toBe(true);
  } finally {
    r.cleanup();
    file.cleanup();
    stub.restore();
  }
});

test("a restored worker context reloads onto a fresh renderer", async () => {
  const stub = await stubWorkerRenderers();
  const r = await createRive({
    ...stateMachineParams(newCanvas()),
    enableGPUCanvas: true,
  });
  try {
    await nextFrames(2);
    const first = rendererOf(r);
    const firstSession = fileOf(r).deferredSession;
    const reloaded = new Promise<void>((resolve) =>
      r.on(rive.EventType.Load, () => resolve()),
    );
    stub.states[0].restored = true;
    await reloaded;
    expect(rendererOf(r)).not.toBe(first);
    expect(stub.states[0].deleted).toBe(true);
    expect(fileOf(r).deferredSession).not.toBe(firstSession);
    expect(r.playingStateMachineNames).toEqual(["StateMachine"]);
    const frames = r.frameCount;
    await nextFrames(3);
    expect(r.frameCount).toBeGreaterThan(frames);
  } finally {
    r.cleanup();
    stub.restore();
  }
});
