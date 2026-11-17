// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import {
  loopRiveFileBuffer,
  oneShotRiveFileBuffer,
  stateMachineFileBuffer,
} from "./assets/bytes";
import { loadFile, runtimeFixture } from "./helpers";

// Whether the state machines report work left to do. The fixture's own
// result depends on its content, so tests decide it here.
// undefined stands in for an older wasm that returns nothing.
let keepAnimating: boolean | undefined = false;
// advanceAndApply calls with a non-zero elapsed time since the last reset.
let timedAdvances = 0;

const frameQueue = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;
let frameTime = 1000;
let instances: rive.Rive[] = [];

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

function controlAdvance(r: rive.Rive) {
  (r as any).animator.stateMachines.forEach((sm: any) => {
    const instance = sm.instance;
    const advanceAndApply = instance.advanceAndApply.bind(instance);
    jest
      .spyOn(instance, "advanceAndApply")
      .mockImplementation((elapsed: number) => {
        advanceAndApply(elapsed);
        if (elapsed > 0) {
          timedAdvances++;
        }
        return keepAnimating;
      });
  });
}

/**
 * @param controlled when false, the state machines report their real result
 */
function loadRive(
  params: Partial<rive.RiveParameters> = {},
  controlled = true,
): Promise<rive.Rive> {
  return new Promise((resolve) => {
    const r: rive.Rive = new rive.Rive({
      canvas: document.createElement("canvas"),
      buffer: stateMachineFileBuffer,
      stateMachine: "StateMachine",
      autoplay: true,
      enableSettling: true,
      ...params,
      onLoad: () => {
        instances.push(r);
        if (controlled) {
          controlAdvance(r);
        }
        resolve(r);
      },
    });
  });
}

/** Loads without autoplay, then plays the artboard's first state machine and settles it. */
async function loadSettledFirstStateMachine(params: Partial<rive.RiveParameters>) {
  const r = await loadRive({ ...params, autoplay: false, stateMachine: undefined }, false);
  r.play(r.stateMachineNames[0]);
  controlAdvance(r);
  runFrames(3);
  expect(r.isSettled).toBe(true);
  timedAdvances = 0;
  return r;
}

async function loadSettled(params: Partial<rive.RiveParameters> = {}) {
  const r = await loadRive(params);
  // The first frame advances by 0, which always reports work; the next settles.
  runFrames(3);
  expect(r.isSettled).toBe(true);
  timedAdvances = 0;
  return r;
}

/** A wake restarts the loop: the next frames advance for real, then it settles again. */
function expectWoken(r: rive.Rive) {
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
  timedAdvances = 0;
  runFrames(3);
  expect(timedAdvances).toBeGreaterThan(0);
  expect(r.isSettled).toBe(true);
}

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
  keepAnimating = false;
  timedAdvances = 0;
  frameQueue.clear();
  (rive.Rive as any).batchStart = { time: -1, now: 0 };
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

test("Without enableSettling the loop keeps running when nothing animates", async () => {
  const r = await loadRive({ enableSettling: false });
  runFrames(5);
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
  expect(timedAdvances).toBeGreaterThan(0);
});

test("Settles once the state machine reports nothing left to animate", async () => {
  const r = await loadSettled();
  expect(frameQueue.size).toBe(0);
  expect(r.isPlaying).toBe(true);
  runFrames(3);
  expect(timedAdvances).toBe(0);
});

test("Keeps running while the state machine reports work", async () => {
  keepAnimating = true;
  const r = await loadRive();
  runFrames(5);
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
});

test("An undefined advance result from an older wasm never settles", async () => {
  const r = await loadRive();
  keepAnimating = undefined;
  runFrames(5);
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
});

test("Setting a state machine input wakes a settled instance", async () => {
  const r = await loadSettled();
  r.stateMachineInputs("StateMachine")[0].value = 12;
  expect(r.isSettled).toBe(false);
  expect(frameQueue.size).toBe(1);
  runFrames(3);
  expect(timedAdvances).toBeGreaterThan(0);
  // Settles again once the change has played out.
  expect(r.isSettled).toBe(true);
});

test("Firing a trigger input wakes a settled instance", async () => {
  const r = await loadSettled();
  const trigger = r
    .stateMachineInputs("StateMachine")
    .find((input) => input.type === rive.StateMachineInputType.Trigger)!;
  trigger.fire();
  expectWoken(r);
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
  r.layout = new rive.Layout({ fit: rive.Fit.Cover });
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
  r.stateMachineInputs("StateMachine")[0].value = 3;
  expect(frameQueue.size).toBe(0);
  r.startRendering();
  expect(frameQueue.size).toBe(1);
});

test("A wake while paused doesn't restart the loop until play()", async () => {
  const r = await loadSettled();
  r.pause();
  r.stateMachineInputs("StateMachine")[0].value = 3;
  expect(frameQueue.size).toBe(0);
  r.play();
  expect(frameQueue.size).toBe(1);
});

test("reset() while paused doesn't draw until play()", async () => {
  const r = await loadSettled();
  r.pause();
  r.reset({ stateMachines: "StateMachine", autoplay: false });
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
    expect(timedAdvances).toBe(0);
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

describe("view model writes", () => {
  const dataBindParams = (): Partial<rive.RiveParameters> => ({
    buffer: loadFile("assets/data_bind_runtime_test.riv"),
    artboard: "main",
    stateMachine: "State Machine 1",
    autoBind: true,
  });

  test("Writing a bound instance's property wakes its instance", async () => {
    const r = await loadSettled(dataBindParams());
    r.viewModelInstance!.string("outer")!.value = "changed";
    expectWoken(r);
  });

  test("Writing a nested instance's property wakes through its parents", async () => {
    const r = await loadSettled(dataBindParams());
    r.viewModelInstance!.string("vm2/vm3/inner")!.value = "changed";
    expectWoken(r);
  });

  test("Writing through a nested instance handle wakes through its parents", async () => {
    const r = await loadSettled(dataBindParams());
    const vm3 = r.viewModelInstance!.viewModel("vm2/vm3")!;
    vm3.string("inner")!.value = "changed";
    expectWoken(r);
  });

  test("Writing an instance bound nowhere wakes nothing", async () => {
    const r = await loadSettled(dataBindParams());
    const unbound = r.viewModelByName("vm1")!.instance()!;
    unbound.string("outer")!.value = "changed";
    expect(r.isSettled).toBe(true);
    expect(frameQueue.size).toBe(0);
  });

  test("Binding a new instance wakes, and the old one no longer does", async () => {
    const r = await loadSettled(dataBindParams());
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
    const r = await loadSettled(dataBindParams());
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
  });
  r.setTextRunValueAtPath("ArtboardBRun", "changed", "ArtboardB-1");
  expectWoken(r);
});

// These leave advanceAndApply alone, so settling follows the file's own content.
describe("real state machine results", () => {
  // Every timeline in this file is a one-shot, so its state machines run out of work.
  const oneShot = (): Partial<rive.RiveParameters> => ({
    buffer: loadFile("assets/runtime_nested_text_runs.riv"),
    artboard: "ArtboardA",
    stateMachine: "State Machine 1",
  });
  // "Looping" plays a looping spin that rotates a shape. (A looping timeline
  // that keys nothing settles, so it can't stand in for this.)
  const looping = (): Partial<rive.RiveParameters> => ({
    buffer: loadFile("assets/settling_cases/settling_cases.riv"),
    artboard: "Settle",
    stateMachine: "Looping",
    autoBind: true,
  });

  // Records every advanceAndApply result in call order, calling through.
  function recordAdvances(r: rive.Rive) {
    const results: { elapsed: number; result: boolean }[] = [];
    (r as any).animator.stateMachines.forEach((sm: any) => {
      const instance = sm.instance;
      const advanceAndApply = instance.advanceAndApply.bind(instance);
      jest
        .spyOn(instance, "advanceAndApply")
        .mockImplementation((elapsed: number) => {
          const result = advanceAndApply(elapsed);
          results.push({ elapsed, result });
          return result;
        });
    });
    return results;
  }

  function countDraws(r: rive.Rive) {
    return jest.spyOn((r as any).artboard, "draw");
  }

  // 10 seconds of 50ms frames, longer than any timeline in these files.
  const playOut = () => runFrames(200, 50);

  test("A one-shot state machine settles on the first timed advance that reports false", async () => {
    const r = await loadRive(oneShot(), false);
    const results = recordAdvances(r);
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
    const r = await loadRive(oneShot(), false);
    playOut();
    expect(r.isSettled).toBe(true);
    const results = recordAdvances(r);
    const draws = countDraws(r);
    runFrames(10, 50);
    expect(results).toHaveLength(0);
    expect(draws).not.toHaveBeenCalled();
    expect(frameQueue.size).toBe(0);
  });

  test("A looping state machine never settles", async () => {
    const r = await loadRive(looping(), false);
    playOut();
    expect(r.isSettled).toBe(false);
    const results = recordAdvances(r);
    runFrames(10, 50);
    expect(results).toHaveLength(10);
    expect(results.every(({ result }) => result)).toBe(true);
    expect(frameQueue.size).toBe(1);
  });

  test("Without enableSettling a one-shot state machine keeps advancing every frame", async () => {
    const r = await loadRive({ ...oneShot(), enableSettling: false }, false);
    playOut();
    expect(r.isSettled).toBe(false);
    const results = recordAdvances(r);
    runFrames(10, 50);
    // Today's loop: one advance per frame, even though there is nothing to animate.
    expect(results).toHaveLength(10);
    expect(results.every(({ result }) => result === false)).toBe(true);
    expect(frameQueue.size).toBe(1);
  });

  test("A change after settling is advanced and drawn, then settles again", async () => {
    const r = await loadRive(oneShot(), false);
    playOut();
    expect(r.isSettled).toBe(true);
    const results = recordAdvances(r);
    const draws = countDraws(r);

    r.setTextRunValueAtPath("ArtboardBRun", "changed", "ArtboardB-1");
    runFrame(50);
    expect(results.length).toBeGreaterThan(0);
    expect(draws).toHaveBeenCalled();
    expect(r.getTextRunValueAtPath("ArtboardBRun", "ArtboardB-1")).toBe("changed");

    playOut();
    expect(r.isSettled).toBe(true);
    const drawsWhileSettled = draws.mock.calls.length;
    runFrames(10, 50);
    expect(draws.mock.calls.length).toBe(drawsWhileSettled);
  });

  test("The first frame after a wake advances by 0, not by the time spent settled", async () => {
    const r = await loadRive(oneShot(), false);
    playOut();
    expect(r.isSettled).toBe(true);
    // A long idle stretch while settled.
    frameTime += 60_000;
    const results = recordAdvances(r);
    r.drawFrame();
    runFrames(2, 50);
    expect(results.length).toBeGreaterThan(0);
    results.forEach(({ elapsed }) => expect(elapsed).toBeLessThanOrEqual(0.05));
  });
});

describe("settle rule", () => {
  test("A 0-second advance never settles, even when the state machine reports false", async () => {
    const r = await loadSettled();
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
    const r = await loadRive(
      { buffer: loopRiveFileBuffer, stateMachine: undefined, animations: undefined },
      false,
    );
    runFrames(100, 50);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  });

  test("A finished one-shot linear animation stops the loop as it does today, without settling", async () => {
    const r = await loadRive(
      { buffer: oneShotRiveFileBuffer, stateMachine: undefined, animations: undefined },
      false,
    );
    runFrames(200, 50);
    expect(r.isPlaying).toBe(false);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(0);
  });

  test("Settled instances settle and wake independently", async () => {
    const a = await loadSettled();
    keepAnimating = true;
    const b = await loadRive();
    runFrames(3);
    expect(a.isSettled).toBe(true);
    expect(b.isSettled).toBe(false);
    keepAnimating = false;
    runFrames(3);
    expect(b.isSettled).toBe(true);
    a.stateMachineInputs("StateMachine")[0].value = 4;
    expect(a.isSettled).toBe(false);
    expect(b.isSettled).toBe(true);
  });

  test("A cleaned-up instance is no longer woken by asset changes", async () => {
    const r = await loadSettled();
    const runtime = (r as any).runtime;
    r.cleanup();
    instances = instances.filter((i) => i !== r);
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
    runFrames(3);
    expect(r.isSettled).toBe(true);
  });

  test("reset() starts a new artboard that hasn't settled, and plays it", async () => {
    const r = await loadSettled();
    r.reset({ stateMachines: "StateMachine", autoplay: true });
    controlAdvance(r);
    expectWoken(r);
  });

  test("reset() without autoplay still draws the new artboard once", async () => {
    const r = await loadSettled();
    r.reset({ stateMachines: "StateMachine", autoplay: false });
    expect(frameQueue.size).toBe(1);
  });

  test("load() starts a new file that hasn't settled", async () => {
    const r = await loadSettled();
    await new Promise<void>((resolve) => {
      r.on(rive.EventType.Load, () => resolve());
      r.load({ buffer: stateMachineFileBuffer, stateMachines: "StateMachine", autoplay: true });
    });
    expect(r.isSettled).toBe(false);
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
  test("Writing a global view model instance's property wakes", async () => {
    const r = await loadSettledFirstStateMachine({
      buffer: loadFile("assets/global_view_models_test.riv"),
      autoBind: true,
    });
    r.globalViewModelInstance("Sizes")!.number("gaps")!.value = 42;
    expectWoken(r);
  });

  test("Setting a global view model instance wakes", async () => {
    const r = await loadSettledFirstStateMachine({
      buffer: loadFile("assets/global_view_models_test.riv"),
      autoBind: true,
    });
    const colors = r.viewModelByName("Colors")!.instance()!;
    r.setGlobalViewModelInstance("Colors", colors);
    expectWoken(r);
  });

  test("Replacing one of two global slots holding the same instance still wakes from the other", async () => {
    const r = await loadSettledFirstStateMachine({
      buffer: loadFile("assets/global_view_models_test.riv"),
      autoBind: true,
    });
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
      stateMachine: "State Machine 1",
      autoBind: true,
    });
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
    });
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
    });
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
    runFrames(3);
    expect(r.isSettled).toBe(true);
    key(canvas, "keydown", "Tab");
    expect(r.isSettled).toBe(false);
    key(canvas, "keyup", "Tab");
    runFrames(3);
    // The focus change reached the state machine and its view model.
    expect(r.viewModelInstance!.viewModel("p1")!.boolean("focused")!.value).toBe(true);
    expect(r.isSettled).toBe(true);
  });

  test("clearFocus wakes a settled instance that has focus nodes", async () => {
    const { r } = await loadFocusSettled();
    r.clearFocus();
    expectWoken(r);
  });
});

// assets/settling_cases (scene.rml is the source of settling_cases.riv), artboard "Settle":
// - "Main": Idle -> Move (0.5s one-shot moving Box, event "moved" on its last
//   frame) on input `trig`, `bool` true, `num` > 0, VM `pulse`, VM `level` > 0
//   or VM `flag` true; back to Idle at the end. Pointer down on Box fires `trig`.
//   Conditions that stay true restart Move, so tests reset them during it.
// - "Looping": a looping 0.5s spin.
// - Nested artboard "child" runs "ChildSM": `childNum` > 0 plays a 0.3s one-shot.
// Box is 40x40 centered at (20, 60) on a 200x200 artboard.
describe("settling_cases.riv", () => {
  const MOVE_SECONDS = 0.5;

  function loadCases(params: Partial<rive.RiveParameters> = {}) {
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
    return loadRive(
      {
        canvas,
        buffer: loadFile("assets/settling_cases/settling_cases.riv"),
        artboard: "Settle",
        stateMachine: "Main",
        autoBind: true,
        layout: new rive.Layout({ fit: rive.Fit.Fill }),
        ...params,
      },
      false,
    );
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

  async function loadCasesSettled(params: Partial<rive.RiveParameters> = {}) {
    const r = await loadCases(params);
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(frameQueue.size).toBe(0);
    return r;
  }

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
  const input = (r: rive.Rive, name: string) =>
    r.stateMachineInputs("Main").find((i) => i.name === name)!;

  test("Settles on its own after load", async () => {
    await loadCasesSettled();
  });

  test("Never settles while a looping state machine plays beside a settled one", async () => {
    const r = await loadCases({
      stateMachine: undefined,
      stateMachines: ["Main", "Looping"],
    });
    runFrames(300, 16);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  });

  test("A trigger input plays the move to the end, then settles", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    input(r, "trig").fire();
    expectMoveThenSettle(r, draws);
  });

  test("A boolean input plays the move, then settles once reset", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    input(r, "bool").value = true;
    runFrames(3);
    input(r, "bool").value = false;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A number input plays the move, then settles once reset", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    input(r, "num").value = 1;
    runFrames(3);
    input(r, "num").value = 0;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A view model trigger plays the move, then settles", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    r.viewModelInstance!.trigger("pulse")!.trigger();
    expectMoveThenSettle(r, draws);
  });

  test("A view model number plays the move, then settles once reset", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    const level = r.viewModelInstance!.number("level")!;
    level.value = 1;
    runFrames(3);
    level.value = 0;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A view model boolean plays the move, then settles once reset", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    const flag = r.viewModelInstance!.boolean("flag")!;
    flag.value = true;
    runFrames(3);
    flag.value = false;
    expectMoveThenSettle(r, draws, 3 * 0.016);
  });

  test("A bound color write is drawn, then settles", async () => {
    const r = await loadCasesSettled();
    const draws = drawsOf(r);
    r.viewModelInstance!.color("tint")!.value = 0xff2060e0;
    expect(r.isSettled).toBe(false);
    runUntilSettled(r);
    expect(r.isSettled).toBe(true);
    expect(draws).toHaveBeenCalled();
  });

  test("A pointer down on the listener's shape plays the move, then settles", async () => {
    const r = await loadCasesSettled();
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
      const r = await loadCasesSettled();
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
    const r = await loadCasesSettled();
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
    const r = await loadCasesSettled();
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
    const r = await loadCasesSettled();
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
    const r = await loadCasesSettled();
    const moved = jest.fn();
    r.on(rive.EventType.RiveEvent, moved);
    runOnSettlingFrame(r, () => input(r, "trig").fire());
    expect(r.isSettled).toBe(false);
    const seconds = runUntilSettled(r);
    expect(seconds).toBeGreaterThanOrEqual(MOVE_SECONDS - 0.05);
    expect(moved).toHaveBeenCalledTimes(1);
  });

  test("play() from an Advance callback on the settling frame starts the new playback", async () => {
    const r = await loadCasesSettled();
    runOnSettlingFrame(r, () => r.play("Looping"));
    expect(r.isSettled).toBe(false);
    // "Looping" never settles once it's playing.
    runFrames(60, 16);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
  });

  test("Without enableSettling the same file keeps the loop running", async () => {
    const r = await loadCases({ enableSettling: false });
    runFrames(300, 16);
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
    });
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
    runFrames(5);
    expect(r.isSettled).toBe(false);
    expect(frameQueue.size).toBe(1);
    canvas.width = 100;
    runFrames(3);
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
