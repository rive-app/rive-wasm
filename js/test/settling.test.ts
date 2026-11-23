import * as rive from "../src/rive";
import { loopRiveFileBuffer, oneShotRiveFileBuffer } from "./assets/bytes";
import { loadFile, runtimeFixture } from "./helpers";

// Every advanceAndApply call since the last clear, with the state machine's real result.
const advances: { elapsed: number; result: boolean }[] = [];
const timedAdvances = () => advances.filter(({ elapsed }) => elapsed > 0).length;

const frameQueue = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;
let frameTime = 1000;
let instances: rive.Rive[] = [];

// The default file's "Main" plays this long on load before it can settle.
const INTRO_SECONDS = 0.4;

function runFrame(step = 16) {
  frameTime += step;
  const callbacks = [...frameQueue.values()];
  frameQueue.clear();
  callbacks.forEach((cb) => cb(frameTime));
}

function runFrames(count: number, step = 16) {
  for (let i = 0; i < count; i++) {
    runFrame(step);
  }
}

/** Runs 16ms frames until settled; returns the seconds of frames that ran. */
function runUntilSettled(r: rive.Rive, maxSeconds = 5): number {
  let seconds = 0;
  while (!r.isSettled && seconds < maxSeconds) {
    runFrame(16);
    seconds += 0.016;
  }
  return seconds;
}

/** Records the playing state machines' advances into `advances`, calling through. */
function recordAdvances(r: rive.Rive) {
  (r as any).animator.stateMachines.forEach((sm: any) => {
    const instance = sm.instance;
    if (jest.isMockFunction(instance.advanceAndApply)) {
      return;
    }
    const advanceAndApply = instance.advanceAndApply.bind(instance);
    jest
      .spyOn(instance, "advanceAndApply")
      .mockImplementation((elapsed: number) => {
        const result = advanceAndApply(elapsed);
        advances.push({ elapsed, result });
        return result;
      });
  });
}

/** A 200x200 canvas whose bounds match the default artboard. */
function sizedCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  jest.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 200,
    bottom: 200,
    width: 200,
    height: 200,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
  return canvas;
}

/** Loads assets/settling_cases unless `params` names another file. */
function loadRive(params: Partial<rive.RiveParameters> = {}): Promise<rive.Rive> {
  return new Promise((resolve) => {
    const r: rive.Rive = new rive.Rive({
      canvas: sizedCanvas(),
      buffer: loadFile("assets/settling_cases/settling_cases.riv"),
      artboard: "Settle",
      stateMachine: "Main",
      autoBind: true,
      layout: new rive.Layout({ fit: rive.Fit.Fill }),
      autoplay: true,
      enableSettling: true,
      ...params,
      onLoad: () => {
        instances.push(r);
        recordAdvances(r);
        resolve(r);
      },
    });
  });
}

/**
 * Expects the loop to keep running for at least `seconds` of frames while the
 * content animates, then to settle and stop requesting frames.
 */
function expectPlaysThenSettles(r: rive.Rive, seconds: number) {
  expect(r.isSettled).toBe(false);
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.016) {
    runFrame(16);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  }
  runUntilSettled(r);
  expect(r.isSettled).toBe(true);
}

/**
 * Loads, then plays the file's content out until it settles.
 * @param playsFor seconds the file animates on load before it can settle
 */
async function loadSettled(
  params: Partial<rive.RiveParameters> = {},
  playsFor = INTRO_SECONDS,
) {
  const r = await loadRive(params);
  expectPlaysThenSettles(r, playsFor);
  advances.length = 0;
  return r;
}

/** Loads without autoplay, then plays the artboard's first state machine until it settles. */
async function loadSettledFirstStateMachine(
  params: Partial<rive.RiveParameters>,
  playsFor: number,
) {
  const r = await loadRive({ ...params, autoplay: false, stateMachine: undefined });
  r.play(r.stateMachineNames[0]);
  recordAdvances(r);
  expectPlaysThenSettles(r, playsFor);
  advances.length = 0;
  return r;
}

/** A wake restarts the loop: the next frames advance for real, then it settles again. */
function expectWoken(r: rive.Rive) {
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
  advances.length = 0;
  runUntilSettled(r);
  expect(timedAdvances()).toBeGreaterThan(0);
  expect(r.isSettled).toBe(true);
}

const input = (r: rive.Rive, name: string) =>
  r.stateMachineInputs("Main").find((i) => i.name === name)!;

/**
 * Wakes a settled instance, then runs `fn` from an Advance callback on the
 * first frame that would settle (the wake's 0-second frame always continues).
 */
function runOnSettlingFrame(r: rive.Rive, fn: () => void) {
  let armed = false;
  r.on(rive.EventType.Advance, () => {
    if (armed) {
      armed = false;
      fn();
    }
  });
  r.drawFrame();
  runFrame(16);
  armed = true;
  runFrame(16);
}

beforeEach(() => {
  advances.length = 0;
  frameQueue.clear();
  (rive.Rive as any).batchStart = { time: -1, now: 0 };
  // Nothing here checks what's logged; the runtime's view model errors print
  // the whole single-line wasm bundle as their code frame.
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Frames stamp the clock they run at, so a seeded frame start never leads them.
  jest.spyOn(performance, "now").mockImplementation(() => frameTime);
  jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb: FrameRequestCallback) => {
      frameQueue.set(++nextFrameId, cb);
      return nextFrameId;
    });
  jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
    frameQueue.delete(id);
  });
});

afterEach(() => {
  // Instances share one runtime frame request; leaks block later tests.
  instances.forEach((r) => r.cleanup());
  instances = [];
  jest.restoreAllMocks();
});

test("Without enableSettling the loop keeps running after the intro plays out", async () => {
  const r = await loadRive({ enableSettling: false });
  runFrames(60);
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
  expect(timedAdvances()).toBeGreaterThan(0);
});

test("Plays the intro, then settles once the state machine reports nothing left to animate", async () => {
  const r = await loadSettled();
  expect(frameQueue.size).toBe(0);
  expect(r.isPlaying).toBe(true);
  runFrames(3);
  expect(timedAdvances()).toBe(0);
});

test("drawFrame wakes a settled instance", async () => {
  const r = await loadSettled();
  r.drawFrame();
  expectWoken(r);
});

test("Pointer input wakes a settled instance", async () => {
  const r = await loadSettled();
  (r as any).advanceAndDrainForPointer(0);
  expectWoken(r);
});

test("Changing the layout wakes a settled instance", async () => {
  const r = await loadSettled();
  // Explicit bounds skip the canvas resize, so only the layout setter can wake.
  r.layout = new rive.Layout({
    fit: rive.Fit.Cover,
    minX: 0,
    minY: 0,
    maxX: 50,
    maxY: 50,
  });
  expectWoken(r);
});

test("An asset change wakes every settled instance", async () => {
  const a = await loadSettled();
  const b = await loadSettled();
  (a as any).runtime.onAssetChange();
  expect(a.isSettled).toBe(false);
  expect(b.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
});

test("A wake while rendering is stopped doesn't restart the loop", async () => {
  const r = await loadSettled();
  r.stopRendering();
  input(r, "trig").fire();
  expect(frameQueue.size).toBe(0);
  r.startRendering();
  expect(frameQueue.size).toBe(1);
});

test("A wake while paused doesn't restart the loop until play()", async () => {
  const r = await loadSettled();
  r.pause();
  input(r, "trig").fire();
  expect(frameQueue.size).toBe(0);
  r.play();
  expect(frameQueue.size).toBe(1);
});

test("reset() while paused doesn't draw until play()", async () => {
  const r = await loadSettled();
  r.pause();
  r.reset({ stateMachines: "Main", autoplay: false });
  expect(frameQueue.size).toBe(0);
  r.play();
  expect(frameQueue.size).toBe(1);
});

test("A settled instance stays stopped when the tab becomes visible", async () => {
  const r = await loadSettled();
  Object.defineProperty(document, "hidden", { value: false, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(frameQueue.size).toBe(0);
  expect(r.isSettled).toBe(true);
  delete (document as any).hidden;
});

test("A paused instance doesn't report settled", async () => {
  const r = await loadSettled();
  r.pause();
  expect(r.isSettled).toBe(false);
});

describe("gamepads", () => {
  const originalGetGamepads = navigator.getGamepads;
  let gamepads: any[] = [];

  function makePad() {
    const buttons = [];
    for (let i = 0; i < 17; i++) {
      buttons.push({ value: 0, pressed: false });
    }
    return {
      index: 0,
      id: "Pad 0",
      connected: true,
      mapping: "standard",
      buttons,
      axes: [0, 0, 0, 0],
    };
  }

  beforeEach(() => {
    gamepads = [];
    (navigator as any).getGamepads = () => gamepads;
  });

  afterEach(() => {
    (navigator as any).getGamepads = originalGetGamepads;
  });

  test("With no pad connected a settled instance requests no frames", async () => {
    await loadSettled();
    expect(frameQueue.size).toBe(0);
  });

  test("Connecting a pad wakes a settled instance", async () => {
    const r = await loadSettled();
    gamepads[0] = makePad();
    window.dispatchEvent(new Event("gamepadconnected"));
    expectWoken(r);
  });

  test("With a pad connected a settled instance polls without advancing", async () => {
    gamepads[0] = makePad();
    window.dispatchEvent(new Event("gamepadconnected"));
    const r = await loadSettled();
    expect(frameQueue.size).toBe(1);
    runFrames(5);
    expect(r.isSettled).toBe(true);
    expect(timedAdvances()).toBe(0);
    expect(frameQueue.size).toBe(1);
  });

  test("A button press wakes a settled instance that is polling", async () => {
    const pad = makePad();
    gamepads[0] = pad;
    window.dispatchEvent(new Event("gamepadconnected"));
    const r = await loadSettled();
    pad.buttons[0] = { value: 1, pressed: true };
    runFrame();
    expectWoken(r);
  });
});

test("pause() while settled with a pad connected stops polling", async () => {
  const originalGetGamepads = navigator.getGamepads;
  const buttons = Array.from({ length: 17 }, () => ({ value: 0, pressed: false }));
  const pads = [
    { index: 0, id: "Pad 0", connected: true, mapping: "standard", buttons, axes: [0, 0, 0, 0] },
  ];
  (navigator as any).getGamepads = () => pads;
  try {
    window.dispatchEvent(new Event("gamepadconnected"));
    const r = await loadSettled();
    expect(frameQueue.size).toBe(1);
    r.pause();
    runFrames(2);
    expect(frameQueue.size).toBe(0);
  } finally {
    (navigator as any).getGamepads = originalGetGamepads;
  }
});

// data_bind_runtime_test.riv, runtime_nested_text_runs.riv and
// list_add_instance_at_test.riv animate nothing; they're used for their view
// model and text shapes, so they settle on the first timed frame.
const STATIC = 0;

describe("view model writes", () => {
  const dataBindParams = (): Partial<rive.RiveParameters> => ({
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    artboard: "main",
    stateMachine: "State Machine 1",
    autoBind: true,
  });

  test("Writing a bound instance's property wakes its instance", async () => {
    const r = await loadSettled(dataBindParams(), STATIC);
    r.viewModelInstance!.string("outer")!.value = "changed";
    expectWoken(r);
  });

  test("Writing a nested instance's property wakes through its parents", async () => {
    const r = await loadSettled(dataBindParams(), STATIC);
    r.viewModelInstance!.string("vm2/vm3/inner")!.value = "changed";
    expectWoken(r);
  });

  test("Writing through a nested instance handle wakes through its parents", async () => {
    const r = await loadSettled(dataBindParams(), STATIC);
    const vm3 = r.viewModelInstance!.viewModel("vm2/vm3")!;
    vm3.string("inner")!.value = "changed";
    expectWoken(r);
  });

  test("Writing an instance bound nowhere wakes nothing", async () => {
    const r = await loadSettled(dataBindParams(), STATIC);
    const unbound = r.viewModelByName("vm1")!.instance()!;
    unbound.string("outer")!.value = "changed";
    expect(r.isSettled).toBe(true);
    expect(frameQueue.size).toBe(0);
  });

  test("Binding a new instance wakes, and the old one no longer does", async () => {
    const r = await loadSettled(dataBindParams(), STATIC);
    const previous = r.viewModelInstance!;
    // Keep the old instance alive after the binding releases it.
    previous.incrementReferenceCount();
    const next = r.viewModelByName("vm1")!.instance()!;
    r.bindViewModelInstance(next);
    runFrames(3);
    expect(r.isSettled).toBe(true);
    previous.string("outer")!.value = "changed";
    expect(r.isSettled).toBe(true);
    next.string("outer")!.value = "changed";
    expectWoken(r);
  });

  test("Replacing a nested view model wakes", async () => {
    const r = await loadSettled(dataBindParams(), STATIC);
    const vm3 = r.viewModelByName("vm3")!.instance()!;
    expect(r.viewModelInstance!.replaceViewModel("vm2/vm3", vm3)).toBe(true);
    expectWoken(r);
  });
});

test("Setting a nested text run wakes a settled instance", async () => {
  const r = await loadSettled({
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    artboard: "ArtboardA",
    stateMachine: "State Machine 1",
  }, STATIC);
  r.setTextRunValueAtPath("ArtboardBRun", "changed", "ArtboardB-1");
  expectWoken(r);
});

describe("state machine results", () => {
  // "Looping" plays a looping spin that rotates a shape. (A looping timeline
  // that keys nothing settles, so it can't stand in for this.)
  const looping = (): Partial<rive.RiveParameters> => ({ stateMachine: "Looping" });

  /** Clears `advances` and returns it, to collect the advances from here on. */
  function advancesFromHere() {
    advances.length = 0;
    return advances;
  }

  function countDraws(r: rive.Rive) {
    return jest.spyOn((r as any).artboard, "draw");
  }

  // 10 seconds of 50ms frames, longer than any timeline in these files.
  const playOut = () => runFrames(200, 50);

  test("A one-shot state machine settles on the first timed advance that reports false", async () => {
    const r = await loadRive();
    const results = advancesFromHere();
    let settledAt = -1;
    for (let i = 0; i < 200 && settledAt < 0; i++) {
      runFrame(50);
      if (r.isSettled) {
        settledAt = results.length - 1;
      }
    }
    expect(settledAt).toBeGreaterThanOrEqual(0);
    // Every advance before the settling one reported work, or was a 0-second advance.
    results.slice(0, settledAt).forEach(({ elapsed, result }) => {
      expect(result || elapsed === 0).toBe(true);
    });
    expect(results[settledAt]).toEqual({ elapsed: expect.any(Number), result: false });
    expect(results[settledAt].elapsed).toBeGreaterThan(0);
  });

  test("A settled one-shot state machine stops advancing, drawing and requesting frames", async () => {
    const r = await loadRive();
    playOut();
    expect(r.isSettled).toBe(true);
    const results = advancesFromHere();
    const draws = countDraws(r);
    runFrames(10, 50);
    expect(results).toHaveLength(0);
    expect(draws).not.toHaveBeenCalled();
    expect(frameQueue.size).toBe(0);
  });

  test("A looping state machine never settles", async () => {
    const r = await loadRive(looping());
    playOut();
    expect(r.isSettled).toBe(false);
    const results = advancesFromHere();
    runFrames(10, 50);
    expect(results).toHaveLength(10);
    expect(results.every(({ result }) => result)).toBe(true);
    expect(frameQueue.size).toBe(1);
  });

  test("Without enableSettling a one-shot state machine keeps advancing every frame", async () => {
    const r = await loadRive({ enableSettling: false });
    playOut();
    expect(r.isSettled).toBe(false);
    const results = advancesFromHere();
    runFrames(10, 50);
    // Today's loop: one advance per frame, even though there is nothing to animate.
    expect(results).toHaveLength(10);
    expect(results.every(({ result }) => result === false)).toBe(true);
    expect(frameQueue.size).toBe(1);
  });

  test("A change after settling is advanced and drawn, then settles again", async () => {
    const r = await loadRive();
    playOut();
    expect(r.isSettled).toBe(true);
    const results = advancesFromHere();
    const draws = countDraws(r);

    input(r, "trig").fire();
    runFrame(50);
    expect(results.length).toBeGreaterThan(0);
    expect(draws).toHaveBeenCalled();

    playOut();
    expect(r.isSettled).toBe(true);
    const drawsWhileSettled = draws.mock.calls.length;
    runFrames(10, 50);
    expect(draws.mock.calls.length).toBe(drawsWhileSettled);
  });

  test("The first frame after a wake advances by 0, not by the time spent settled", async () => {
    const r = await loadRive();
    playOut();
    expect(r.isSettled).toBe(true);
    // A long idle stretch while settled.
    frameTime += 60_000;
    const results = advancesFromHere();
    r.drawFrame();
    runFrames(2, 50);
    expect(results.length).toBeGreaterThan(0);
    results.forEach(({ elapsed }) => expect(elapsed).toBeLessThanOrEqual(0.05));
  });
});

describe("settle rule", () => {
  test("A 0-second advance never settles, even when the state machine reports false", async () => {
    const r = await loadSettled();
    // State machines report work on a 0-second advance, so only a forced false
    // shows that the elapsed time alone keeps the loop going.
    const advanceAndApply = (r as any).animator.stateMachines[0].instance.advanceAndApply;
    const recorded = advanceAndApply.getMockImplementation();
    advanceAndApply.mockImplementation((elapsed: number) => {
      recorded(elapsed);
      return false;
    });
    r.drawFrame();
    expect(r.isSettled).toBe(false);
    // The first frame after a wake advances by 0, so it keeps the loop going.
    runFrame();
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
    runFrame();
    expect(r.isSettled).toBe(true);
  });

  test("A playing linear animation without a state machine never settles", async () => {
    const r = await loadRive({
      buffer: loopRiveFileBuffer,
      artboard: undefined,
      stateMachine: undefined,
      animations: undefined,
    });
    runFrames(100, 50);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  });

  test("A finished one-shot linear animation stops the loop as it does today, without settling", async () => {
    const r = await loadRive({
      buffer: oneShotRiveFileBuffer,
      artboard: undefined,
      stateMachine: undefined,
      animations: undefined,
    });
    runFrames(200, 50);
    expect(r.isPlaying).toBe(false);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(0);
  });

  test("Settled instances settle and wake independently", async () => {
    const a = await loadSettled();
    // b plays its intro while a stays settled.
    const b = await loadRive();
    runFrames(3);
    expect(a.isSettled).toBe(true);
    expect(b.isSettled).toBe(false);
    runUntilSettled(b);
    expect(b.isSettled).toBe(true);
    input(a, "trig").fire();
    expect(a.isSettled).toBe(false);
    expect(b.isSettled).toBe(true);
  });

  test("A cleaned-up instance is no longer woken by asset changes", async () => {
    const r = await loadSettled();
    const runtime = (r as any).runtime;
    r.cleanup();
    instances = instances.filter((i) => i !== r);
    // Checked before the asset change, which would remove it by waking it.
    expect((r as any).isInSettledInstances).toBe(false);
    expect(() => runtime.onAssetChange()).not.toThrow();
    expect(frameQueue.size).toBe(0);
  });
});

describe("playback wakes", () => {
  test("play() wakes a settled instance", async () => {
    const r = await loadSettled();
    r.play();
    expectWoken(r);
  });

  test("pause() then play() resumes and settles again", async () => {
    const r = await loadSettled();
    r.pause();
    expect(r.isSettled).toBe(false);
    r.play();
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
  });

  test("reset() starts a new artboard that plays its intro, then settles", async () => {
    const r = await loadSettled();
    r.reset({ stateMachines: "Main", autoplay: true });
    recordAdvances(r);
    expectPlaysThenSettles(r, INTRO_SECONDS);
  });

  test("reset() without autoplay still draws the new artboard once", async () => {
    const r = await loadSettled();
    r.reset({ stateMachines: "Main", autoplay: false });
    expect(frameQueue.size).toBe(1);
  });

  test("load() starts a new file that plays its intro, then settles", async () => {
    const r = await loadSettled();
    await new Promise<void>((resolve) => {
      r.on(rive.EventType.Load, () => resolve());
      r.load({
        buffer: loadFile("assets/settling_cases/settling_cases.riv"),
        artboard: "Settle",
        stateMachines: "Main",
        autoplay: true,
      });
    });
    recordAdvances(r);
    expectPlaysThenSettles(r, INTRO_SECONDS);
  });
});

describe("other wake sites", () => {
  test("resizeToCanvas wakes a settled instance", async () => {
    const r = await loadSettled();
    r.resizeToCanvas();
    expectWoken(r);
  });

  test("devicePixelRatioUsed wakes a settled instance", async () => {
    const r = await loadSettled();
    r.devicePixelRatioUsed = 3;
    expectWoken(r);
  });

  test("Artboard size changes wake a settled instance", async () => {
    const r = await loadSettled();
    r.artboardWidth = 123;
    expect(r.isSettled).toBe(false);
    runFrames(3);
    expect(r.isSettled).toBe(true);
    r.resetArtboardSize();
    expectWoken(r);
  });

  test("Setting a text run by name wakes a settled instance", async () => {
    const r = await loadSettled();
    r.setTextRunValue("missing", "value");
    expectWoken(r);
  });

  test("enableSemantics wakes a settled instance", async () => {
    const r = await loadSettled();
    r.enableSemantics();
    expectWoken(r);
  });

  test("A semantic action wakes a settled instance", async () => {
    const r = await loadSettled();
    (r as any).animator.stateMachines[0].fireSemanticAction(0, 0);
    expectWoken(r);
  });

  test("A hidden tab doesn't wake a settled instance", async () => {
    const r = await loadSettled();
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(frameQueue.size).toBe(0);
    expect(r.isSettled).toBe(true);
    delete (document as any).hidden;
  });
});

describe("more view model writes", () => {
  // global_view_models_test.riv's first state machine animates this long on load.
  const GLOBALS_SECONDS = 1;

  test("Writing a global view model instance's property wakes", async () => {
    const r = await loadSettledFirstStateMachine({
      buffer: loadFile("assets/global_view_models_test.riv"),
      artboard: undefined,
      autoBind: true,
    }, GLOBALS_SECONDS);
    r.globalViewModelInstance("Sizes")!.number("gaps")!.value = 42;
    expectWoken(r);
  });

  test("Setting a global view model instance wakes", async () => {
    const r = await loadSettledFirstStateMachine({
      buffer: loadFile("assets/global_view_models_test.riv"),
      artboard: undefined,
      autoBind: true,
    }, GLOBALS_SECONDS);
    const colors = r.viewModelByName("Colors")!.instance()!;
    r.setGlobalViewModelInstance("Colors", colors);
    expectWoken(r);
  });

  test("Replacing one of two global slots holding the same instance still wakes from the other", async () => {
    const r = await loadSettledFirstStateMachine({
      buffer: loadFile("assets/global_view_models_test.riv"),
      artboard: undefined,
      autoBind: true,
    }, GLOBALS_SECONDS);
    const shared = r.viewModelByName("Sizes")!.instance()!;
    expect(r.setGlobalViewModelInstance("Sizes", shared)).toBe(true);
    expect(r.setGlobalViewModelInstance("Colors", shared)).toBe(true);
    runFrames(3);
    expect(r.setGlobalViewModelInstance("Colors", r.viewModelByName("Colors")!.instance()!)).toBe(true);
    runFrames(3);
    expect(r.isSettled).toBe(true);
    shared.number("gaps")!.value = 42;
    expectWoken(r);
  });

  test("Adding to a list and writing a list item wake", async () => {
    const r = await loadSettled({
      buffer: loadFile("assets/list_add_instance_at_test.riv"),
      artboard: undefined,
      stateMachine: "State Machine 1",
      autoBind: true,
    }, STATIC);
    const list = r.viewModelInstance!.list("lis")!;
    const item = r.viewModelByName("child")!.instance()!;
    list.addInstance(item);
    expect(r.isSettled).toBe(false);
    runFrames(3);
    expect(r.isSettled).toBe(true);
    // The item reaches this instance through the list's owner.
    item.string("str")!.value = "changed";
    expect(r.isSettled).toBe(false);
    runFrames(3);
    list.removeInstanceAt(0);
    expectWoken(r);
  });

  test("A property callback fires for the write that woke the instance, then it settles", async () => {
    const r = await loadSettled({
      buffer: loadFile("assets/data_bind_runtime_test.riv"),
      artboard: "main",
      stateMachine: "State Machine 1",
      autoBind: true,
    }, STATIC);
    const outer = r.viewModelInstance!.string("outer")!;
    const callback = jest.fn();
    outer.on(callback);
    outer.value = "changed";
    runFrames(3);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(r.isSettled).toBe(true);
  });

  test("Without enableSettling, bound instances register nothing to wake", async () => {
    const r = await loadRive({
      buffer: loadFile("assets/data_bind_runtime_test.riv"),
      artboard: "main",
      stateMachine: "State Machine 1",
      autoBind: true,
      enableSettling: false,
    });
    expect((r.viewModelInstance as any)._wakeCallbacks).toBeNull();
  });
});

describe("keyboard and focus", () => {
  // focus.riv's "State Machine 1" animates for about a second on load.
  async function loadFocusSettled() {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    // Pointer-style canvas focus, so entering the tree is an explicit Tab.
    jest.spyOn(canvas, "matches").mockReturnValue(false);
    // Keyboard interactions are created by the first frames, before settling.
    const r = await loadSettled({
      canvas,
      buffer: loadFile("assets/focus.riv"),
      artboard: "Buttons",
      stateMachine: "State Machine 1",
      autoBind: true,
    }, 1);
    expect((r as any)._keyboardInteractions).not.toBeNull();
    return { r, canvas };
  }

  function key(canvas: HTMLCanvasElement, type: "keydown" | "keyup", code: string) {
    canvas.dispatchEvent(
      new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true }),
    );
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("Focusing the canvas wakes a settled instance", async () => {
    const { r, canvas } = await loadFocusSettled();
    canvas.focus();
    expectWoken(r);
  });

  test("A Tab moves Rive focus while settled, then the instance settles again", async () => {
    const { r, canvas } = await loadFocusSettled();
    canvas.focus();
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    key(canvas, "keydown", "Tab");
    expect(r.isSettled).toBe(false);
    key(canvas, "keyup", "Tab");
    // The focused button animates before the instance settles again.
    expectPlaysThenSettles(r, 0.1);
    // The focus change reached the state machine and its view model.
    expect(r.viewModelInstance!.viewModel("p1")!.boolean("focused")!.value).toBe(true);
  });

  test("clearFocus wakes a settled instance that has focus nodes", async () => {
    const { r } = await loadFocusSettled();
    r.clearFocus();
    expectWoken(r);
  });
});

// assets/settling_cases (scene.rml is the source of settling_cases.riv), artboard "Settle",
// the default file for every test that doesn't name another:
// - "Main": a 0.4s intro on load, then Idle -> Move (0.5s one-shot moving Box, event "moved" on its last
//   frame) on input `trig`, `bool` true, `num` > 0, VM `pulse`, VM `level` > 0
//   or VM `flag` true; back to Idle at the end. Pointer down on Box fires `trig`.
//   Conditions that stay true restart Move, so tests reset them during it.
// - "Looping": a looping 0.5s spin.
// - Nested artboard "child" runs "ChildSM": `childNum` > 0 plays a 0.3s one-shot.
// Box is 40x40 centered at (20, 60) on a 200x200 artboard.
describe("inputs and pointers", () => {
  const MOVE_SECONDS = 0.5;

  /**
   * Expects a wake, then a settle no sooner than the move animation allows.
   * @param secondsSinceWake frames the test already ran after the wake
   */
  function expectMoveThenSettle(
    r: rive.Rive,
    draws: jest.SpyInstance,
    secondsSinceWake = 0,
  ) {
    expect(r.isSettled).toBe(false);
    const seconds = secondsSinceWake + runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(seconds).toBeGreaterThanOrEqual(MOVE_SECONDS);
    // The move was drawn while it played.
    expect(draws.mock.calls.length).toBeGreaterThanOrEqual(MOVE_SECONDS / 0.016 - 2);
  }

  const drawsOf = (r: rive.Rive) => jest.spyOn((r as any).artboard, "draw");
  const canvasOf = (r: rive.Rive): HTMLCanvasElement => (r as any).canvas;
  test("Never settles while a looping state machine plays beside a settled one", async () => {
    const r = await loadRive({
      stateMachine: undefined,
      stateMachines: ["Main", "Looping"],
    });
    runFrames(300, 16);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  });

  test("A trigger input plays the move to the end, then settles", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    input(r, "trig").fire();
    expectMoveThenSettle(r, draws);
  });

  test("A boolean input plays the move, then settles once reset", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    input(r, "bool").value = true;
    runFrames(3);
    input(r, "bool").value = false;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A number input plays the move, then settles once reset", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    input(r, "num").value = 1;
    runFrames(3);
    input(r, "num").value = 0;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A view model trigger plays the move, then settles", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    r.viewModelInstance!.trigger("pulse")!.trigger();
    expectMoveThenSettle(r, draws);
  });

  test("A view model number plays the move, then settles once reset", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    const level = r.viewModelInstance!.number("level")!;
    level.value = 1;
    runFrames(3);
    level.value = 0;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A view model boolean plays the move, then settles once reset", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    const flag = r.viewModelInstance!.boolean("flag")!;
    flag.value = true;
    runFrames(3);
    flag.value = false;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A bound color write is drawn, then settles", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    r.viewModelInstance!.color("tint")!.value = 0xff2060e0;
    expect(r.isSettled).toBe(false);
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(draws).toHaveBeenCalled();
  });

  test("A pointer down on the listener's shape plays the move, then settles", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    canvasOf(r).dispatchEvent(
      new MouseEvent("mousedown", { clientX: 20, clientY: 60, bubbles: true }),
    );
    canvasOf(r).dispatchEvent(
      new MouseEvent("mouseup", { clientX: 20, clientY: 60, bubbles: true }),
    );
    expectMoveThenSettle(r, draws);
  });

  test.each(["mousemove", "mouseover", "mouseout"])(
    "A %s wakes a settled instance, then it settles again",
    async (type) => {
      const r = await loadSettled();
      canvasOf(r).dispatchEvent(
        new MouseEvent(type, { clientX: 150, clientY: 150, bubbles: true }),
      );
      expect(r.isSettled).toBe(false);
      expect(frameQueue.size).toBe(1);
      runUntilSettled(r);
      expect(r.isSettled).toBe(true);
    },
  );

  test("A pointer down off the listener's shape settles again without moving", async () => {
    const r = await loadSettled();
    const moved = jest.fn();
    r.on(rive.EventType.RiveEvent, moved);
    canvasOf(r).dispatchEvent(
      new MouseEvent("mousedown", { clientX: 150, clientY: 150, bubbles: true }),
    );
    const seconds = runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(seconds).toBeLessThan(MOVE_SECONDS);
    expect(moved).not.toHaveBeenCalled();
  });

  test("The event on the move's last frame is delivered before the instance settles", async () => {
    const r = await loadSettled();
    const settledAtEvent: boolean[] = [];
    r.on(rive.EventType.RiveEvent, (event) => {
      if ((event.data as rive.RiveEventPayload).name === "moved") {
        settledAtEvent.push(r.isSettled);
      }
    });
    input(r, "trig").fire();
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(settledAtEvent).toEqual([false]);
  });

  test("A nested input set by path plays the nested move, then settles once reset", async () => {
    const r = await loadSettled();
    const draws = drawsOf(r);
    r.setNumberStateAtPath("childNum", 1, "child");
    expect(r.isSettled).toBe(false);
    runFrames(3);
    r.setNumberStateAtPath("childNum", 0, "child");
    const seconds = runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(seconds).toBeGreaterThanOrEqual(0.3 - 0.05);
    expect(draws).toHaveBeenCalled();
  });

  test("An input set from an Advance callback on the settling frame is still advanced", async () => {
    const r = await loadSettled();
    const moved = jest.fn();
    r.on(rive.EventType.RiveEvent, moved);
    runOnSettlingFrame(r, () => input(r, "trig").fire());
    expect(r.isSettled).toBe(false);
    const seconds = runUntilSettled(r);
    expect(seconds).toBeGreaterThanOrEqual(MOVE_SECONDS - 0.05);
    expect(moved).toHaveBeenCalledTimes(1);
  });

  test("play() from an Advance callback on the settling frame starts the new playback", async () => {
    const r = await loadSettled();
    runOnSettlingFrame(r, () => r.play("Looping"));
    expect(r.isSettled).toBe(false);
    // "Looping" never settles once it's playing.
    runFrames(60, 16);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  });
});

describe("review cases", () => {
  test("bind() after a settled setViewModelInstance wakes", async () => {
    const r = await loadSettled({
      buffer: loadFile("assets/data_bind_runtime_test.riv"),
      artboard: "main",
      stateMachine: "State Machine 1",
      autoBind: true,
    }, STATIC);
    r.setViewModelInstance(r.viewModelByName("vm1")!.instance()!);
    runFrames(3);
    expect(r.isSettled).toBe(true);
    r.bind();
    expectWoken(r);
  });

  test("A canvas with no drawing surface doesn't settle until it can draw", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 0;
    const r = await loadRive({ canvas });
    // Well past the intro.
    runFrames(60);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
    canvas.width = 100;
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
  });

  test("Decoding and swapping a font for any file wakes every settled instance", async () => {
    const settled = await loadSettled();
    let fontAsset: rive.FontAsset | undefined;
    await new Promise<void>((resolve) => {
      const other: rive.Rive = new rive.Rive({
        canvas: document.createElement("canvas"),
        buffer: loadFile("assets/referenced_font_asset.riv"),
        autoplay: false,
        assetLoader: (asset) => {
          fontAsset = asset as rive.FontAsset;
          return true;
        },
        onLoad: () => {
          instances.push(other);
          resolve();
        },
      });
    });
    expect(fontAsset?.isFont).toBe(true);
    const bytes = new Uint8Array(
      runtimeFixture("tests/web_scripting/stress/text/label_font.ttf"),
    );

    // FileAsset.decode goes through the wasm glue's asset hook.
    fontAsset!.decode(bytes);
    expectWoken(settled);

    // So does swapping in a separately decoded font.
    const font = await rive.decodeFont(bytes);
    fontAsset!.setFont(font);
    expectWoken(settled);

    // A swap from a callback on the frame that would settle keeps that frame going.
    runOnSettlingFrame(settled, () => fontAsset!.setFont(font));
    expect(settled.isSettled).toBe(false);
    runFrames(3);
    expect(settled.isSettled).toBe(true);
  });
});
