import * as rive from "../src/rive";
import { loopRiveFileBuffer, stateMachineFileBuffer } from "./assets/bytes";
import { loadRive, waitForPredicate } from "./helpers";

beforeEach(() => {
  // Silence the deprecation warnings the legacy playback APIs emit
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// #region playback control

test("Playing animations can be manually started and stopped", async () => {
  const canvas = document.createElement("canvas");
  const playStates: boolean[][] = [];
  const stops: { states: boolean[]; event: rive.Event }[] = [];

  const r = await loadRive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onPlay: () => {
      playStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    },
    onLoop: (event: rive.Event) => {
      // Once it's looped, attempt to stop
      r.stop();
    },
    onStop: (event: rive.Event) => {
      stops.push({ states: [r.isStopped, r.isPaused, r.isPlaying], event });
    },
  });
  // Initial animation should be ready and paused on load
  expect(r.isStopped).toBeFalsy();
  expect(r.isPaused).toBeTruthy();
  // Start playback
  r.play();

  await waitForPredicate(() => stops.length > 0, 4000);
  expect(playStates.length).toBeGreaterThan(0);
  expect(playStates[0]).toEqual([false, false, true]);
  expect(stops[0].states).toEqual([true, false, false]);
  expect(stops[0].event.type).toBe(rive.EventType.Stop);
  r.cleanup();
});

test("Playing animations can be manually started, paused, and restarted", async () => {
  const canvas = document.createElement("canvas");
  let hasLooped = false;
  const playStates: boolean[][] = [];
  const pauseStates: boolean[][] = [];
  const stops: { hasLooped: boolean; states: boolean[] }[] = [];

  const r = await loadRive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onPlay: () => {
      playStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    },
    onLoop: (event: rive.Event) => {
      hasLooped ? r.stop() : r.pause();
      hasLooped = true;
    },
    onStop: (event: rive.Event) => {
      stops.push({
        hasLooped,
        states: [r.isStopped, r.isPaused, r.isPlaying],
      });
    },
  });
  // Nothing should be playing whenever a file is loaded
  expect(r.isStopped).toBeFalsy();
  expect(r.isPaused).toBeTruthy();
  // Registered after load: the load's own Pause fires before `r` is assigned.
  r.on(rive.EventType.Pause, () => {
    pauseStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    r.play();
  });
  // Start playback
  r.play();

  await waitForPredicate(() => stops.length > 0, 4000);
  expect(playStates.length).toBeGreaterThan(0);
  playStates.forEach((s) => expect(s).toEqual([false, false, true]));
  expect(pauseStates.length).toBeGreaterThan(0);
  pauseStates.forEach((s) => expect(s).toEqual([false, true, false]));
  expect(stops[0].hasLooped).toBeTruthy();
  expect(stops[0].states).toEqual([true, false, false]);
  r.cleanup();
});

// #endregion

// #region scrubbing

test("An animation can be played and scrubbed without altering playback state", async () => {
  const canvas = document.createElement("canvas");
  const playingAtPlay: boolean[] = [];
  const playingAtPause: boolean[] = [];
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onPlay: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.5);
      playingAtPlay.push(r.isPlaying);
      r.pause(firstAnimation);
    },
  });
  // Registered after load: the load's own Pause fires before `r` is assigned.
  r.on(rive.EventType.Pause, () => {
    const firstAnimation = r.animationNames[0];
    r.scrub(firstAnimation, 0.8);
    playingAtPause.push(r.isPlaying);
  });
  r.play(r.animationNames[0]);

  await waitForPredicate(() => playingAtPause.length > 0);
  expect(playingAtPlay[0]).toBeTruthy();
  // onPause can fire more than once, so check every call
  playingAtPause.forEach((playing) => expect(playing).toBeFalsy());
  r.cleanup();
});

// #endregion

// #region starting playback selection

test("With nothing specified, the first animation plays (v2)", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
  });
  // Current (v2) default: the first linear animation is chosen over
  // the artboard's state machine
  expect(r.pausedAnimationNames).toEqual(["WorkAreaPingPongAnimation"]);
  expect(r.pausedStateMachineNames).toHaveLength(0);
  r.cleanup();
});

test("The deprecated stateMachines parameter still starts playback", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
  });
  expect(r.pausedStateMachineNames).toEqual(["StateMachine"]);
  expect(r.pausedAnimationNames).toHaveLength(0);
  r.cleanup();
});

// #endregion

// #region resetting

test("reset accepts the stateMachine parameter", async () => {
  const canvas = document.createElement("canvas");
  const r = await loadRive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachine: "StateMachine",
  });
  r.reset({ artboard: "MyArtboard", stateMachine: "StateMachine" });
  expect(r.pausedStateMachineNames).toEqual(["StateMachine"]);
  expect(r.pausedAnimationNames).toHaveLength(0);
  r.cleanup();
});

// #endregion
