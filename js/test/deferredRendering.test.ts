// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests.
//
// Deferred rendering here is the Canvas2D path: `runtime.makeDeferredSession()` plus
// the renderer Proxy's `attachSession()` / `deferredActive()`. Nothing WebGL-only is
// mocked. A build without deferred support fails the suite in beforeAll rather than
// passing vacuously — jest runs against a prebuilt wasm, so a stale artifact would
// otherwise turn every case below green while testing nothing.
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";
import { loadFile } from "./helpers";

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

// #region helpers

const originalWarn = console.warn;

let warnSpy: jest.SpyInstance;

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

/** Lets the render loop run, so queued canvas draws actually reach the 2d context. */
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

/** Every Rive-emitted warning seen so far. */
const riveWarnings = (): string[] =>
  warnSpy.mock.calls
    .map((call) => String(call[0]))
    .filter((message) => message.startsWith("Rive:"));

/**
 * How many warnings Rive has emitted in this test so far.
 *
 * Deliberately not matched against the message text: the wording is product
 * copy that gets rewritten (renaming the opt-in flag broke these assertions
 * once already), while "warned, and warned exactly once" is the actual
 * contract. Each assertion below names the expected warning in a comment.
 */
const riveWarningCount = (): number => riveWarnings().length;

/** The `riveFile` an instance ended up with; it may be a re-import, not what was passed. */
const fileOf = (r: rive.Rive): rive.RiveFile => (r as any).riveFile;

const refCountOf = (file: rive.RiveFile): number => (file as any).referenceCount;

const canvasEvents = (canvas: HTMLCanvasElement): string[] => {
  const ctx = canvas.getContext("2d") as any;
  return ((ctx.__getEvents?.() ?? []) as { type: string }[]).map(
    (event) => event.type,
  );
};

/**
 * Ops that put marks on the canvas. Deliberately excludes `clearRect`: the
 * canvas renderer pushes one unconditionally on every drawn frame, so counting
 * it would report "painted" for a replay that emitted nothing at all.
 */
const DRAW_EVENTS = ["fill", "fillRect", "stroke", "drawImage"];

const drawOps = (canvas: HTMLCanvasElement): string[] =>
  canvasEvents(canvas).filter((type) => DRAW_EVENTS.includes(type));

/** True if anything was actually painted into this canvas' 2d context. */
const painted = (canvas: HTMLCanvasElement): boolean =>
  drawOps(canvas).length > 0;

/**
 * The draw ops of each rendered frame, split on the `clearRect` the renderer
 * emits at the top of every frame it draws.
 */
const drawOpsByFrame = (canvas: HTMLCanvasElement): string[][] => {
  const frames: string[][] = [];
  for (const type of canvasEvents(canvas)) {
    if (type === "clearRect") {
      frames.push([]);
    } else if (frames.length > 0 && DRAW_EVENTS.includes(type)) {
      frames[frames.length - 1].push(type);
    }
  }
  return frames;
};

/**
 * Swaps the runtime's renderer factory for one whose renderers cannot take a
 * session — `attachSession` either missing (the webgl2 offscreen shape) or
 * refusing. Returns a restore function.
 */
const stubRendererAttach = async (
  attachResult: boolean | "absent",
): Promise<() => void> => {
  const runtime = (await rive.RuntimeLoader.awaitInstance()) as any;
  const realMakeRenderer = runtime.makeRenderer;
  runtime.makeRenderer = function (...args: any[]) {
    const renderer = realMakeRenderer.apply(this, args);
    return new Proxy(renderer, {
      get(target: any, property: string | symbol) {
        if (property === "attachSession") {
          return attachResult === "absent"
            ? undefined
            : () => attachResult as boolean;
        }
        return target[property];
      },
    });
  };
  return () => {
    runtime.makeRenderer = realMakeRenderer;
  };
};

// #endregion

beforeAll(async () => {
  const runtime = await rive.RuntimeLoader.awaitInstance();
  if (typeof (runtime as any).makeDeferredSession !== "function") {
    // Hard failure, not a skip: this suite runs against a prebuilt wasm, so a
    // silent bail-out here would report "all green" for a stale artifact.
    throw new Error(
      "deferredRendering requires a runtime build with makeDeferredSession(). " +
        "Rebuild with ./build.sh -r canvas-single from a branch that has deferred support.",
    );
  }
});

beforeEach(() => {
  (window as any).ResizeObserver = MockResizeObserver;
  jest.spyOn(console, "error").mockImplementation(() => {});
  warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  console.warn = originalWarn;
});

// #region multi-instance deferred

test("two deferred instances with their own buffers each get their own session", async () => {
  const canvas1 = newCanvas();
  const canvas2 = newCanvas();

  const r1 = await createRive({
    canvas: canvas1,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });
  const r2 = await createRive({
    canvas: canvas2,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    expect(r1.deferredRendererActive).toBe(true);
    expect(r2.deferredRendererActive).toBe(true);

    const session1 = fileOf(r1).deferredSession;
    const session2 = fileOf(r2).deferredSession;
    expect(session1).not.toBeNull();
    expect(session2).not.toBeNull();
    expect(session1).not.toBe(session2);

    // Each instance owns its file, so neither collides with the other.
    expect(fileOf(r1)).not.toBe(fileOf(r2));
    expect(riveWarnings()).toEqual([]);

    await nextFrames(3);
    expect(painted(canvas1)).toBe(true);
    expect(painted(canvas2)).toBe(true);
  } finally {
    r1.cleanup();
    r2.cleanup();
  }
});

test("a plain instance alongside a deferred one still renders immediately", async () => {
  const deferredCanvas = newCanvas();
  const plainCanvas = newCanvas();

  const deferredInstance = await createRive({
    canvas: deferredCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });
  const plainInstance = await createRive({
    canvas: plainCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
  });

  try {
    expect(deferredInstance.deferredRendererActive).toBe(true);
    // The plain instance's file imported immediate, so nothing routes it through
    // the other instance's session (the old global-routing regression).
    expect(plainInstance.deferredRendererActive).toBe(false);
    expect(fileOf(plainInstance).deferredSession).toBeNull();
    expect(riveWarnings()).toEqual([]);

    await nextFrames(3);
    expect(painted(plainCanvas)).toBe(true);
    expect(painted(deferredCanvas)).toBe(true);
  } finally {
    deferredInstance.cleanup();
    plainInstance.cleanup();
  }
});

test("a shared deferred RiveFile is claimed once, then re-imported for the next instance", async () => {
  const canvas1 = newCanvas();
  const canvas2 = newCanvas();

  const sharedFile = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
    enableGPUCanvas: true,
  });
  await sharedFile.init();
  expect(sharedFile.deferredSession).not.toBeNull();
  expect(sharedFile.sessionClaimed).toBe(false);

  const r1 = await createRive({
    canvas: canvas1,
    riveFile: sharedFile,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    // First instance claims the session.
    expect(r1.deferredRendererActive).toBe(true);
    expect(fileOf(r1)).toBe(sharedFile);
    expect(sharedFile.sessionClaimed).toBe(true);
    // Nothing has collided yet.
    expect(riveWarningCount()).toBe(0);

    const sharedRefCount = refCountOf(sharedFile);
    expect(sharedRefCount).toBe(1);

    const r2 = await createRive({
      canvas: canvas2,
      riveFile: sharedFile,
      artboard: "MyArtboard",
      stateMachines: "StateMachine",
      autoplay: true,
      enableGPUCanvas: true,
    });

    try {
      // Second instance re-imports from the retained buffer into a session of its own.
      // Warns: the file is already bound to another instance.
      expect(riveWarningCount()).toBe(1);
      expect(r2.deferredRendererActive).toBe(true);
      expect(fileOf(r2)).not.toBe(sharedFile);
      expect(fileOf(r2).deferredSession).not.toBeNull();
      expect(fileOf(r2).deferredSession).not.toBe(sharedFile.deferredSession);

      // Both instances render deferred, each through its own session.
      expect(r1.deferredRendererActive).toBe(true);

      // The clone never joins the shared wrapper's reference count.
      expect(refCountOf(sharedFile)).toBe(sharedRefCount);
      expect(refCountOf(fileOf(r2))).toBe(1);

      await nextFrames(3);
      expect(painted(canvas1)).toBe(true);
      expect(painted(canvas2)).toBe(true);
    } finally {
      r2.cleanup();
    }

    // Cleaning up instance 2 must not take instance 1's file with it.
    expect(refCountOf(sharedFile)).toBe(sharedRefCount);
    expect(sharedFile.deferredSession).not.toBeNull();
    expect(r1.deferredRendererActive).toBe(true);

    await nextFrames(3);
    expect(painted(canvas1)).toBe(true);

    // Only one warning however many instances collide on the file.
    expect(riveWarningCount()).toBe(1);
  } finally {
    r1.cleanup();
  }

  expect(refCountOf(sharedFile)).toBe(0);
});

// #endregion

// #region file-wins matrix

test("a deferred file renders deferred even when enableGPUCanvas is false, and warns", async () => {
  const canvas = newCanvas();
  const file = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
    enableGPUCanvas: true,
  });
  await file.init();

  const r = await createRive({
    canvas: canvas,
    riveFile: file,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    // enableGPUCanvas intentionally omitted (defaults to false): the file wins.
  });

  try {
    expect(r.deferredRendererActive).toBe(true);
    // Warns: the file's mode wins over the instance's flag.
    expect(riveWarningCount()).toBe(1);

    await nextFrames(3);
    expect(painted(canvas)).toBe(true);
  } finally {
    r.cleanup();
  }
});

test("an immediate file stays immediate even when enableGPUCanvas is true, and warns", async () => {
  const canvas = newCanvas();
  const file = new rive.RiveFile({ buffer: stateMachineFileBuffer });
  await file.init();
  expect(file.deferredSession).toBeNull();

  const r = await createRive({
    canvas: canvas,
    riveFile: file,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    expect(r.deferredRendererActive).toBe(false);
    expect(fileOf(r).deferredSession).toBeNull();
    // Warns: the file was imported without the flag, so the instance stays immediate.
    expect(riveWarningCount()).toBe(1);

    await nextFrames(3);
    expect(painted(canvas)).toBe(true);
  } finally {
    r.cleanup();
  }
});

// #endregion

// #region cleanup ordering

test("cleanup of a plain instance next to deferred ones does not throw", async () => {
  const deferredCanvas = newCanvas();
  const plainCanvas = newCanvas();

  const deferredInstance = await createRive({
    canvas: deferredCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });
  const plain = await createRive({
    canvas: plainCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
  });

  await nextFrames(3);

  try {
    // No session is attached to this renderer, so nothing in teardown reaches
    // the native side twice.
    expect(() => plain.cleanup()).not.toThrow();
    expect(() => plain.cleanup()).not.toThrow();
    expect(() => plain.deleteRiveRenderer()).not.toThrow();
    expect(plain.deferredRendererActive).toBe(false);

    // The deferred instance next to it is untouched and still painting.
    expect(deferredInstance.deferredRendererActive).toBe(true);
    await nextFrames(3);
  } finally {
    deferredInstance.cleanup();
  }
});

/**
 * Regression test: cleanup() must detach the renderer's session before the
 * file releases (deletes) it — a detach after session.delete() hands embind a
 * deleted DeferredSession pointer and throws out of user code.
 */
test("cleanup of deferred and shared-deferred instances does not throw", async () => {
  const ownCanvas = newCanvas();
  const sharedCanvas1 = newCanvas();
  const sharedCanvas2 = newCanvas();

  const sharedFile = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
    enableGPUCanvas: true,
  });
  await sharedFile.init();

  const owner = await createRive({
    canvas: ownCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });
  const sharedFirst = await createRive({
    canvas: sharedCanvas1,
    riveFile: sharedFile,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });
  const sharedSecond = await createRive({
    canvas: sharedCanvas2,
    riveFile: sharedFile,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });
  await nextFrames(3);

  try {
    // Three ownership shapes: the re-imported clone, the instance holding the
    // shared file's session, and an instance owning its own deferred file.
    expect(() => sharedSecond.cleanup()).not.toThrow();
    expect(() => sharedFirst.cleanup()).not.toThrow();
    expect(() => owner.cleanup()).not.toThrow();

    // Idempotent: a second cleanup, and an explicit renderer delete, are no-ops.
    expect(() => owner.cleanup()).not.toThrow();
    expect(() => owner.deleteRiveRenderer()).not.toThrow();

    // Nothing is left rendering.
    expect(owner.deferredRendererActive).toBe(false);
    expect(sharedFirst.deferredRendererActive).toBe(false);

    await nextFrames(3);
  } finally {
    // Whatever the ordering did, leave nothing running for the next test.
    [sharedSecond, sharedFirst, owner].forEach((instance) => instance.cleanup());
  }
});

// #endregion

// #region output equivalence

test("a deferred replay draws the same ops as immediate rendering", async () => {
  const immediateCanvas = newCanvas();
  const deferredCanvas = newCanvas();

  const immediate = await createRive({
    canvas: immediateCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
  });
  const deferred = await createRive({
    canvas: deferredCanvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    expect(deferred.deferredRendererActive).toBe(true);
    expect(immediate.deferredRendererActive).toBe(false);

    await nextFrames(3);

    // The substantive check: the replay has to put the same marks on the canvas
    // that the immediate path does. Compares the first drawn frame, where both
    // state machines are still at t=0.
    const immediateFirst = drawOpsByFrame(immediateCanvas)[0] ?? [];
    const deferredFirst = drawOpsByFrame(deferredCanvas)[0] ?? [];
    expect(immediateFirst.length).toBeGreaterThan(0);
    expect(deferredFirst).toEqual(immediateFirst);
  } finally {
    immediate.cleanup();
    deferred.cleanup();
  }
});

// #endregion

// #region fallbacks

test("a deferred RiveFile on a build without deferred support warns once and imports immediate", async () => {
  const runtime = (await rive.RuntimeLoader.awaitInstance()) as any;
  const realMakeDeferredSession = runtime.makeDeferredSession;
  runtime.makeDeferredSession = undefined;
  // The warning latches for the page, so reset it to keep the count meaningful
  // however this file is ordered.
  (rive.RiveFile as any).deferredUnsupportedWarned = false;

  const canvas = newCanvas();
  const file = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
    enableGPUCanvas: true,
  });

  try {
    await file.init();
    expect(file.deferredSession).toBeNull();
    // Warns: this build has no GPU Canvas support.
    expect(riveWarningCount()).toBe(1);

    const r = await createRive({
      canvas: canvas,
      riveFile: file,
      artboard: "MyArtboard",
      stateMachines: "StateMachine",
      autoplay: true,
      enableGPUCanvas: true,
    });

    try {
      // Degraded to immediate, and still rendering.
      expect(r.deferredRendererActive).toBe(false);
      // The file asked for deferred, so no second warning telling the user to
      // set the flag they already set: still just the unsupported-build one.
      expect(riveWarningCount()).toBe(1);
      await nextFrames(3);
      expect(painted(canvas)).toBe(true);

      // A second deferred file does not warn again.
      const second = new rive.RiveFile({
        buffer: stateMachineFileBuffer,
        enableGPUCanvas: true,
      });
      await second.init();
      // The unsupported-build warning latches, so still one in total.
      expect(riveWarningCount()).toBe(1);
      second.cleanup();
    } finally {
      r.cleanup();
    }
  } finally {
    runtime.makeDeferredSession = realMakeDeferredSession;
    (rive.RiveFile as any).deferredUnsupportedWarned = false;
  }
});

test("a deferred RiveFile releases its session when the import rejects", async () => {
  const runtime = (await rive.RuntimeLoader.awaitInstance()) as any;
  const realLoad = runtime.load;
  runtime.load = () => Promise.reject(new Error("import blew up"));

  const file = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
    enableGPUCanvas: true,
  });

  try {
    // fireLoadError() rethrows after firing the event, so init() rejects.
    await expect(file.init()).rejects.toThrow("import blew up");
    // releaseSession() deletes the session and clears the field. Without it the
    // session outlives the failed load with nothing left to reclaim it.
    expect(file.deferredSession).toBeNull();
  } finally {
    runtime.load = realLoad;
  }
});

test("a deferred RiveFile releases its session when the import resolves to null", async () => {
  const runtime = (await rive.RuntimeLoader.awaitInstance()) as any;
  const realLoad = runtime.load;
  runtime.load = () => Promise.resolve(null);

  const file = new rive.RiveFile({
    buffer: stateMachineFileBuffer,
    enableGPUCanvas: true,
  });

  try {
    await expect(file.init()).rejects.toThrow();
    expect(file.deferredSession).toBeNull();
  } finally {
    runtime.load = realLoad;
  }
});

test("load() keeps the deferred flag and releases the outgoing session", async () => {
  // The flag is sticky across reloads, and each outgoing file is released so a
  // reload does not strand its session — nothing reclaims one on GC except the
  // file's own finalizer.
  const canvas = newCanvas();
  const r = await createRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    expect(r.deferredRendererActive).toBe(true);
    const firstFile = fileOf(r);

    // enableGPUCanvas deliberately omitted: it must survive the reload.
    await new Promise<void>((resolve, reject) => {
      const onLoad = () => {
        r.off(rive.EventType.Load, onLoad);
        resolve();
      };
      r.on(rive.EventType.Load, onLoad);
      r.on(rive.EventType.LoadError, (e: rive.Event) =>
        reject(new Error(String(e?.data ?? "load error"))),
      );
      r.load({
        buffer: stateMachineFileBuffer,
        artboard: "MyArtboard",
        stateMachines: "StateMachine",
        autoplay: true,
      });
    });
    await nextFrames(3);

    expect(r.deferredRendererActive).toBe(true);
    // A new file, and the one it replaced was released rather than dropped.
    expect(fileOf(r)).not.toBe(firstFile);
    expect((firstFile as any).destroyed).toBe(true);
    expect(firstFile.deferredSession).toBeNull();
    expect(painted(canvas)).toBe(true);
  } finally {
    r.cleanup();
  }
});

test("a renderer that cannot take a session falls back to an immediate re-import", async () => {
  const restore = await stubRendererAttach("absent");
  const canvas = newCanvas();

  try {
    const r = await createRive({
      canvas: canvas,
      buffer: stateMachineFileBuffer,
      artboard: "MyArtboard",
      stateMachines: "StateMachine",
      autoplay: true,
      enableGPUCanvas: true,
    });

    try {
      // Warns: this renderer cannot replay a deferred session.
      expect(riveWarningCount()).toBe(1);
      expect(r.deferredRendererActive).toBe(false);
      // The instance ended up on an immediate re-import, not on the deferred file.
      expect(fileOf(r).deferredSession).toBeNull();

      await nextFrames(3);
      expect(painted(canvas)).toBe(true);
    } finally {
      r.cleanup();
    }
  } finally {
    restore();
  }
});

test("an instance whose re-imported session cannot attach renders immediate, not blank", async () => {
  // Every attach refused: the first one sends this down the re-import path, and
  // the copy's attach fails too, which is the terminal branch.
  const restore = await stubRendererAttach(false);
  const canvas = newCanvas();

  try {
    const r = await createRive({
      canvas: canvas,
      buffer: stateMachineFileBuffer,
      artboard: "MyArtboard",
      stateMachines: "StateMachine",
      autoplay: true,
      enableGPUCanvas: true,
    });

    try {
      // Two warnings: bound elsewhere, then the fall back to immediate.
      expect(riveWarningCount()).toBe(2);
      expect(r.deferredRendererActive).toBe(false);
      expect(fileOf(r).deferredSession).toBeNull();

      // The whole point of the fallback: something is on the canvas.
      await nextFrames(3);
      expect(painted(canvas)).toBe(true);
    } finally {
      r.cleanup();
    }
  } finally {
    restore();
  }
});

// #endregion

// #region frame-skip probe

/**
 * The frame-skip gate's only view of stream content the artboard's dirt flag
 * cannot see: quiet after a replay reset, set as soon as anything is recorded.
 *
 * The draw loop reads it before `renderer.clear()` because webgl2's
 * `beginRecord` writes an ore marker that self-dirties the stream. Canvas2D has
 * no ore, so that is not observable here — asserted below so the difference is
 * explicit.
 */
test("the deferred work probe tracks recorded stream content", async () => {
  const canvas = newCanvas();
  const r = await createRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    await nextFrames(3);
    // Stop the loop so the manual clear() below is not racing a real frame:
    // every drawn frame pairs its clear() with a flush(), so once the loop is
    // wound down no target frame is left open.
    r.pause();
    await nextFrames(2);

    const session = fileOf(r).deferredSession as any;
    expect(typeof session.recordedThisFrame).toBe("function");

    // Replay resets the stream, so between frames there is nothing recorded.
    expect(session.recordedThisFrame()).toBe(false);

    // Opening the recording window records nothing by itself on canvas2d.
    const renderer = (r as any).renderer;
    renderer.clear();
    expect(session.recordedThisFrame()).toBe(false);

    // A recorded op is what the gate has to see: without this term the draw
    // loop would park a frame whose stream still holds unreplayed work.
    renderer.save();
    expect(session.recordedThisFrame()).toBe(true);
    renderer.restore();
  } finally {
    r.cleanup();
  }
});

// #endregion

// #region embedded assets

/**
 * Embedded images must start decoding at import so load() waits on them, the
 * way an immediate import does. A recorded decode would only start at first
 * replay, so a static artboard's sole frame would draw before the browser
 * finished decoding and stay permanently blank.
 */
test("a deferred file's embedded images decode at import, before any renderer exists", async () => {
  const createObjectUrl = jest.fn(() => "blob:stub");
  (window.URL as any).createObjectURL = createObjectUrl;
  (window.URL as any).revokeObjectURL = jest.fn();
  // jsdom never loads images, so fire onload for the decode to complete;
  // without it a load that correctly waits on the image would hang here.
  const RealImage = window.Image;
  class StubImage {
    onload: (() => void) | null = null;
    width = 1;
    height = 1;
    set src(_value: string) {
      queueMicrotask(() => this.onload && this.onload());
    }
  }
  (window as any).Image = StubImage;

  try {
    const file = new rive.RiveFile({
      buffer: loadFile("assets/embedded_png_asset.riv"),
      enableGPUCanvas: true,
    });
    await file.init();
    try {
      expect(file.deferredSession).not.toBeNull();
      // The decode began during import; no renderer or replay exists yet.
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
    } finally {
      file.cleanup();
    }
  } finally {
    (window as any).Image = RealImage;
  }
});

// #endregion

// #region recording overrides

/**
 * CanvasRenderer implements rotate() as `this.transform(...)`, and the Proxy
 * binds fall-through methods to the canvas renderer — so without an explicit
 * override rotate() transforms immediately instead of recording. The session
 * probe is the discriminator: it stays empty if the override regresses.
 */
test("rotate() records into the session instead of transforming the canvas", async () => {
  const canvas = newCanvas();
  const r = await createRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    enableGPUCanvas: true,
  });

  try {
    await nextFrames(3);
    // Wind the loop down so the calls below are not racing a real frame.
    r.pause();
    await nextFrames(2);

    const session = fileOf(r).deferredSession as any;
    const renderer = (r as any).renderer;

    // Replay reset the stream, so nothing is recorded between frames.
    expect(session.recordedThisFrame()).toBe(false);

    renderer.rotate(Math.PI / 2);
    expect(session.recordedThisFrame()).toBe(true);
  } finally {
    r.cleanup();
  }
});

// #endregion
