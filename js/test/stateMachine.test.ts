import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";
import { frames, loadRive, waitForPredicate } from "./helpers";

const originalErrorLog = console.error;
const originalWarnLog = console.warn;
const errorLogMock = jest.fn();
const warnLogMock = jest.fn();

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", { value: hidden, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  errorLogMock.mockClear();
  console.error = errorLogMock;
  warnLogMock.mockClear();
  console.warn = warnLogMock;
});

afterEach(() => {
  console.error = originalErrorLog;
  console.warn = originalWarnLog;
  setDocumentHidden(false);
});

// #region state machine

test("State machine names can be retrieved", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
  });
  const stateMachineNames = r.stateMachineNames;
  expect(stateMachineNames).toHaveLength(1);
  expect(stateMachineNames[0]).toBe("StateMachine");
  r.cleanup();
});

test("The stateMachine parameter starts playback with just that state machine", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachine: "StateMachine",
  });
  expect(r.pausedStateMachineNames).toEqual(["StateMachine"]);
  expect(r.pausedAnimationNames).toHaveLength(0);
  expect(r.playingAnimationNames).toHaveLength(0);
  r.cleanup();
});

test("The stateMachine parameter takes priority over the deprecated plural parameters", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachine: "StateMachine",
    animations: "WorkAreaPingPongAnimation",
  });
  expect(r.pausedStateMachineNames).toEqual(["StateMachine"]);
  expect(r.pausedAnimationNames).toHaveLength(0);
  r.cleanup();
});

test("Instanced state machine inputs can be retrieved", async () => {
  const canvas = document.createElement("canvas");
  const onPause = jest.fn();
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onPause: onPause,
  });
  await waitForPredicate(() => onPause.mock.calls.length > 0);

  let stateMachineInputs = r.stateMachineInputs("BadName");
  expect(stateMachineInputs).toBeUndefined();
  stateMachineInputs = r.stateMachineInputs("StateMachine");
  expect(stateMachineInputs).toHaveLength(3);

  expect(stateMachineInputs[0].type).toBe(rive.StateMachineInputType.Number);
  expect(stateMachineInputs[0].name).toBe("MyNum");
  expect(stateMachineInputs[0].value).toBe(0);
  stateMachineInputs[0].value = 12;
  expect(stateMachineInputs[0].value).toBe(12);

  expect(stateMachineInputs[1].type).toBe(rive.StateMachineInputType.Boolean);
  expect(stateMachineInputs[1].name).toBe("MyBool");
  expect(stateMachineInputs[1].value).toBe(false);
  stateMachineInputs[1].value = true;
  expect(stateMachineInputs[1].value).toBe(true);

  expect(stateMachineInputs[2].type).toBe(rive.StateMachineInputType.Trigger);
  expect(stateMachineInputs[2].name).toBe("MyTrig");
  expect(stateMachineInputs[2].value).toBeUndefined();
  expect(stateMachineInputs[2].fire()).toBeUndefined();
  r.cleanup();
});

test("Playing state machines can be manually started, paused, and restarted", async () => {
  const canvas = document.createElement("canvas");
  type Snapshot = { isStopped: boolean; isPaused: boolean; isPlaying: boolean };
  const events: { name: string; snapshot: Snapshot }[] = [];
  const snapshot = (): Snapshot => ({
    isStopped: r.isStopped,
    isPaused: r.isPaused,
    isPlaying: r.isPlaying,
  });
  let loadedStopped: boolean | undefined;
  let hasPaused = false;

  const r: rive.Rive = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onLoad: () => {
      // Nothing should be playing whenever a file is loaded
      loadedStopped = r.isStopped;
      // Start playback
      r.play();
    },
    onPlay: () => {
      events.push({ name: "play", snapshot: snapshot() });
      if (!hasPaused) {
        r.pause();
      }
    },
    onPause: () => {
      events.push({ name: "pause", snapshot: snapshot() });
      hasPaused = true;
      r.play();
    },
  });

  await waitForPredicate(() => hasPaused && events.filter((e) => e.name === "play").length >= 2);
  expect(loadedStopped).toBe(false);
  const plays = events.filter((e) => e.name === "play");
  for (const e of plays) {
    expect(e.snapshot).toEqual({ isStopped: false, isPaused: false, isPlaying: true });
  }
  const pauses = events.filter((e) => e.name === "pause");
  expect(pauses.length).toBeGreaterThanOrEqual(1);
  for (const e of pauses) {
    expect(e.snapshot).toEqual({ isStopped: false, isPaused: true, isPlaying: false });
  }
  r.cleanup();
});

test("Playing state machines report when states have changed", async () => {
  const canvas = document.createElement("canvas");
  let state = 0;
  const playSnapshots: {
    names: string[];
    inputNames: string[];
    inputCount: number;
  }[] = [];
  const stateEvents: string[][] = [];

  const r: rive.Rive = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay: () => {
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);
      playSnapshots.push({
        names: [...r.playingStateMachineNames],
        inputNames: inputs ? inputs.map((i) => i.name) : [],
        inputCount: inputs ? inputs.length : 0,
      });
    },
    onStateChange: ({ data: stateNames }) => {
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);
      stateEvents.push([...(stateNames as string[])]);

      if (state === 0) {
        state++;
        inputs[2].fire();
      } else if (state === 1) {
        state++;
        inputs[1].value = true;
      }
    },
  });

  await waitForPredicate(() => stateEvents.length >= 3);

  // Expect the correct animation to be playing
  expect(playSnapshots.length).toBeGreaterThan(0);
  expect(playSnapshots[0].names).toEqual(["StateMachine"]);
  // Check the inputs are correct
  expect(playSnapshots[0].inputCount).toBe(3);
  expect(playSnapshots[0].inputNames[1]).toBe("MyBool");
  expect(playSnapshots[0].inputNames[2]).toBe("MyTrig");

  expect(stateEvents[0]).toEqual(["LoopingAnimation"]);
  expect(stateEvents[1]).toEqual(["PingPongAnimation"]);
  expect(stateEvents[2]).toEqual(["exit"]);
  r.cleanup();
});

test("Advance event is not triggered when state machine is paused", async () => {
  const canvas = document.createElement("canvas");
  const hasAdvancedMock = jest.fn();
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    onAdvance: hasAdvancedMock,
  });
  await waitForPredicate(() => hasAdvancedMock.mock.calls.length > 0);

  r.pause();
  const advancedCallbackCount = hasAdvancedMock.mock.calls.length;
  await frames(5);

  // Rive draws one more frame before pausing at the end of a render loop
  expect(hasAdvancedMock.mock.calls.length).toBe(advancedCallbackCount + 1);
  r.cleanup();
});

test("State machine with wrong name invokes onLoadError", async () => {
  const canvas = document.createElement("canvas");
  const onLoad = jest.fn();
  const onLoadError = jest.fn();
  await expect(
    loadRive({
      canvas: canvas,
      buffer: stateMachineFileBuffer,
      stateMachines: ["wrong!"],
      onLoad: onLoad,
      onLoadError: onLoadError,
    }),
  ).rejects.toThrow("Rive failed to load");
  expect(onLoadError).toHaveBeenCalledTimes(1);
  // onLoad should not be called when the state machine name is invalid.
  expect(onLoad).not.toHaveBeenCalled();
});

test("Animation with wrong name logs a warning and an error", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    animations: ["wrong!"],
  });
  expect(errorLogMock.mock.calls.length).toBe(1);
  expect(errorLogMock.mock.lastCall[0]).toBe(
    "Animation with name wrong! not found.",
  );
  r.cleanup();
});

// #endregion

// #region page visibility

test("Registers a visibilitychange listener to the document on construction", () => {
  const spy = jest.spyOn(document, "addEventListener");
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({ canvas, buffer: stateMachineFileBuffer });

  const calls = spy.mock.calls.filter(([event]) => event === "visibilitychange");
  expect(calls).toHaveLength(1);
  spy.mockRestore();
});

test("Removes the visibilitychange listener from document on cleanup", () => {
  const addSpy = jest.spyOn(document, "addEventListener");
  const removeSpy = jest.spyOn(document, "removeEventListener");
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({ canvas, buffer: stateMachineFileBuffer });

  const addCall = addSpy.mock.calls.find(([event]) => event === "visibilitychange");
  const registeredHandler = addCall?.[1];

  r.cleanup();

  const removeCalls = removeSpy.mock.calls.filter(
    ([event]) => event === "visibilitychange",
  );
  expect(removeCalls).toHaveLength(1);
  expect(removeCalls[0][1]).toBe(registeredHandler);

  addSpy.mockRestore();
  removeSpy.mockRestore();
});

test("Resets lastRenderTime to 0 and frameRequestId when the tab becomes hidden", async () => {
  const canvas = document.createElement("canvas");
  const onPlay = jest.fn();
  const r = await loadRive({
    canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay,
  });
  await waitForPredicate(() => onPlay.mock.calls.length > 0);

  setDocumentHidden(true);
  expect((r as any).lastRenderTime).toBe(0);
  expect((r as any).frameRequestId).toBeNull();
  r.cleanup();
});

test("Schedules a new frame when the tab becomes visible while playing", async () => {
  const canvas = document.createElement("canvas");
  const onPlay = jest.fn();
  const r = await loadRive({
    canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay,
  });
  await waitForPredicate(() => onPlay.mock.calls.length > 0);

  setDocumentHidden(true);
  expect((r as any).frameRequestId).toBeNull();

  setDocumentHidden(false);
  expect((r as any).frameRequestId).not.toBeNull();
  r.cleanup();
});

test("Does not schedule a new frame when the tab becomes visible while not playing", async () => {
  const canvas = document.createElement("canvas");
  const onPause = jest.fn();
  const r = await loadRive({
    canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onPause,
  });
  await waitForPredicate(() => onPause.mock.calls.length > 0);
  expect(r.isPlaying).toBeFalsy();

  setDocumentHidden(true);
  setDocumentHidden(false);

  expect((r as any).frameRequestId).toBeNull();
  r.cleanup();
});

test("Does not restart rendering on tab show when stopRendering() was called before document goes hidden", async () => {
  const canvas = document.createElement("canvas");
  const onPlay = jest.fn();
  const r = await loadRive({
    canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay,
  });
  await waitForPredicate(() => onPlay.mock.calls.length > 0);

  r.stopRendering();
  expect((r as any).frameRequestId).toBeNull();
  expect(r.isPlaying).toBeTruthy();

  // A hide/show cycle must not restart the loop we intentionally stopped.
  setDocumentHidden(true);
  setDocumentHidden(false);

  expect((r as any).frameRequestId).toBeNull();
  r.cleanup();
});

test("Applies zero elapsed time on the first draw after tab restore", async () => {
  const canvas = document.createElement("canvas");
  const onPlay = jest.fn();
  const r = await loadRive({
    canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay,
  });
  await waitForPredicate(() => onPlay.mock.calls.length > 0);

  setDocumentHidden(true);

  const stateMachines: any[] = (r as any).animator.stateMachines;
  const spies = stateMachines.map((sm) => jest.spyOn(sm, "advanceAndApply"));

  // Draw with a large timestamp. Because lastRenderTime was zeroed on hide,
  // draw() initialises it to this value and computes elapsedTime === 0.
  (r as any).draw(9000);

  expect(spies.length).toBeGreaterThan(0);
  for (const spy of spies) {
    expect(spy).toHaveBeenCalledWith(0);
    spy.mockRestore();
  }
  r.cleanup();
});

// #endregion
