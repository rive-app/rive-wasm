// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { loopRiveFileBuffer, stateMachineFileBuffer } from "./assets/bytes";

beforeEach(() => {
  // Silence the deprecation warnings the legacy playback APIs emit
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// #region playback control

test("Playing animations can be manually started and stopped", (done) => {
  const canvas = document.createElement("canvas");

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onLoad: () => {
      // Initial animation should be ready and paused on load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      // Start playback
      r.play();
    },
    onPlay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      // Once it's looped, attempt to stop
      r.stop();
    },
    onStop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

test("Playing animations can be manually started, paused, and restarted", (done) => {
  const canvas = document.createElement("canvas");
  let hasLooped = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    onLoad: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeTruthy();
      // Start playback
      r.play();
    },
    onPlay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      hasLooped ? r.stop() : r.pause();
      hasLooped = true;
    },
    onPause: (event: rive.Event) => {
      expect(r.isPaused).toBeTruthy();
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      r.play();
    },
    onStop: (event: rive.Event) => {
      expect(hasLooped).toBeTruthy();
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

// #endregion

// #region scrubbing

test("An animation can be played and scrubbed without altering playback state", (done) => {
  let isDone = false;
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      const firstAnimation = r.animationNames[0];
      r.play(firstAnimation);
    },
    onPlay: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.5);
      expect(r.isPlaying).toBeTruthy();
      r.pause(firstAnimation);
    },
    onPause: () => {
      const firstAnimation = r.animationNames[0];
      r.scrub(firstAnimation, 0.8);
      expect(r.isPlaying).toBeFalsy();
      // TODO: we call done multiple times
      if (!isDone) {
        isDone = true;
        done();
      }
    },
  });
});

// #endregion

// #region starting playback selection

test("With nothing specified, the first animation plays (v2)", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    onLoad: () => {
      // Current (v2) default: the first linear animation is chosen over
      // the artboard's state machine
      expect(r.pausedAnimationNames).toEqual(["WorkAreaPingPongAnimation"]);
      expect(r.pausedStateMachineNames).toHaveLength(0);
      done();
    },
  });
});

test("The deprecated stateMachines parameter still starts playback", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    onLoad: () => {
      expect(r.pausedStateMachineNames).toEqual(["StateMachine"]);
      expect(r.pausedAnimationNames).toHaveLength(0);
      done();
    },
  });
});

// #endregion

// #region resetting

test("reset accepts the stateMachine parameter", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachine: "StateMachine",
    onLoad: () => {
      r.reset({ artboard: "MyArtboard", stateMachine: "StateMachine" });
      expect(r.pausedStateMachineNames).toEqual(["StateMachine"]);
      expect(r.pausedAnimationNames).toHaveLength(0);
      done();
    },
  });
});

// #endregion
