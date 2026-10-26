import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

const frameQueue = new Map<number, FrameRequestCallback>();
let nextFrameId = 0;
let instances: rive.Rive[] = [];
let now = 0;

// `at` is performance.now() in the callbacks; lower `time` = stamped mid-task.
function runFrame(time: number, at = time) {
  now = at;
  const callbacks = [...frameQueue.values()];
  frameQueue.clear();
  callbacks.forEach((cb) => cb(time));
  expect(frameQueue.size).toBeLessThanOrEqual(1);
}

// Frozen per task in browsers, so a draw late in a long load reads its start.
function setTimelineTime(currentTime: number) {
  Object.defineProperty(document, "timeline", {
    value: { currentTime },
    configurable: true,
  });
}

function loadPlaying(): Promise<rive.Rive> {
  return new Promise((resolve) => {
    const r: rive.Rive = new rive.Rive({
      canvas: document.createElement("canvas"),
      buffer: stateMachineFileBuffer,
      stateMachine: "StateMachine",
      autoplay: true,
      onLoad: () => {
        if (!instances.includes(r)) instances.push(r);
        // The load's synchronous first draw runs before this resolves.
        resolve(r);
      },
    });
  });
}

function spyOnAdvance(r: rive.Rive): jest.SpyInstance[] {
  return (r as any).animator.stateMachines.map((sm: any) =>
    jest.spyOn(sm, "advanceAndApply"),
  );
}

function advancedBy(spies: jest.SpyInstance[]): number[] {
  return spies.flatMap((spy) => spy.mock.calls.map(([elapsed]) => elapsed));
}

beforeEach(() => {
  frameQueue.clear();
  now = 0;
  (rive.Rive as any).batchStart = { time: -1, now: 0 };
  jest.spyOn(performance, "now").mockImplementation(() => now);
  jest
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((cb: FrameRequestCallback) => {
      frameQueue.set(++nextFrameId, cb);
      return nextFrameId;
    });
  jest
    .spyOn(window, "cancelAnimationFrame")
    .mockImplementation((id: number) => {
      frameQueue.delete(id);
    });
});

afterEach(() => {
  // Instances share one runtime frame request; leaks block later tests.
  instances.forEach((r) => r.cleanup());
  instances = [];
  jest.restoreAllMocks();
  delete (document as any).timeline;
});

test("First animation frame after load advances by 0, not by the load time", async () => {
  // The load task started at 1000ms; the first frame lands 900ms later.
  setTimelineTime(1000);
  now = 1900;
  const r = await loadPlaying();
  const spies = spyOnAdvance(r);

  runFrame(1900);
  runFrame(1916);
  const [first, second] = advancedBy(spies);
  expect(first).toBe(0);
  expect(second).toBeCloseTo(0.016);
});

test("A first frame stamped inside the load task doesn't carry it into the next frame", async () => {
  setTimelineTime(1000);
  now = 1500;
  const r = await loadPlaying();
  const spies = spyOnAdvance(r);

  runFrame(1016, 1500);
  runFrame(1516);
  const [first, second] = advancedBy(spies);
  expect(first).toBe(0);
  expect(second).toBeCloseTo(0.016);
});

test("A first frame starts in step with a slow instance in the same batch", async () => {
  setTimelineTime(1000);
  now = 1000;
  const a = await loadPlaying();
  runFrame(1016);
  const b = await loadPlaying();
  const aSpies = spyOnAdvance(a);
  const bSpies = spyOnAdvance(b);
  const aAdvance = (a as any).advanceAndReportChanges.bind(a);
  jest
    .spyOn(a as any, "advanceAndReportChanges")
    .mockImplementation((elapsed: number) => {
      now += 30;
      aAdvance(elapsed);
    });

  runFrame(1032);
  runFrame(1078);
  expect(advancedBy(bSpies).pop()).toBeCloseTo(advancedBy(aSpies).pop()!);
});

test("Playback continues when rAF stamps run behind performance.now()", async () => {
  setTimelineTime(1000);
  now = 100000;
  const r = await loadPlaying();
  const spies = spyOnAdvance(r);

  runFrame(16, 100000);
  runFrame(32, 100000);
  runFrame(48, 100000);
  expect(advancedBy(spies).pop()).toBeCloseTo(0.016);
});

test("Resuming after pause does not jump by the time spent paused", async () => {
  setTimelineTime(1000);
  now = 1000;
  const r = await loadPlaying();
  runFrame(1016);
  runFrame(1032);

  r.pause();
  runFrame(1048);
  expect(r.isPaused).toBeTruthy();

  // play() lands in a task whose timeline time lags the next frame.
  setTimelineTime(5000);
  now = 5600;
  const spies = spyOnAdvance(r);
  r.play();
  runFrame(5600);
  runFrame(5616);

  const [draw, first, second] = advancedBy(spies);
  expect([draw, first]).toEqual([0, 0]);
  expect(second).toBeCloseTo(0.016);
});

test("Loading a new file doesn't jump by the reload time", async () => {
  setTimelineTime(1000);
  now = 1000;
  const r = await loadPlaying();
  runFrame(1016);
  runFrame(1032);

  now = 1932;
  await new Promise<void>((resolve) => {
    r.on(rive.EventType.Load, () => resolve());
    r.load({
      buffer: stateMachineFileBuffer,
      stateMachine: "StateMachine",
      autoplay: true,
    });
  });
  const spies = spyOnAdvance(r);
  runFrame(1932);
  runFrame(1948);

  const elapsed = advancedBy(spies);
  expect(Math.max(...elapsed.slice(0, -1))).toBe(0);
  expect(elapsed[elapsed.length - 1]).toBeCloseTo(0.016);
});

test("Restarting rendering still catches playing animations up", async () => {
  setTimelineTime(1000);
  now = 1000;
  const r = await loadPlaying();
  runFrame(1016);
  runFrame(1032);

  r.stopRendering();
  const spies = spyOnAdvance(r);
  setTimelineTime(3000);
  now = 3000;
  r.startRendering();
  runFrame(3032);

  // Documented catch-up: 3032 - 1032 ms.
  expect(advancedBy(spies)).toEqual([0, 2]);
});
