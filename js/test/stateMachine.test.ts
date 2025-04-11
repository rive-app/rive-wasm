// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { stateMachineFileBuffer } from "./assets/bytes";

const originalErrorLog = console.error;
const originalWarnLog = console.warn;
const errorLogMock = jest.fn();
const warnLogMock = jest.fn();

beforeEach(() => {
  errorLogMock.mockClear();
  console.error = errorLogMock;
  warnLogMock.mockClear();
  console.warn = warnLogMock;
});

afterEach(() => {
  console.error = originalErrorLog;
  console.error = originalWarnLog;
});

// #region state machine

test("State machine names can be retrieved", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    onLoad: () => {
      const stateMachineNames = r.stateMachineNames;
      expect(stateMachineNames).toHaveLength(1);
      expect(stateMachineNames[0]).toBe("StateMachine");
      done();
    },
  });
});

test("State machines can be instanced", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onPause: () => {
      expect(r.pausedStateMachineNames).toHaveLength(1);
      done();
    },
  });
});

test("Instanced state machine inputs can be retrieved", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onPause: () => {
      let stateMachineInputs = r.stateMachineInputs("BadName");
      expect(stateMachineInputs).toBeUndefined();
      stateMachineInputs = r.stateMachineInputs("StateMachine");
      expect(stateMachineInputs).toHaveLength(3);

      expect(stateMachineInputs[0].type).toBe(
        rive.StateMachineInputType.Number,
      );
      expect(stateMachineInputs[0].name).toBe("MyNum");
      expect(stateMachineInputs[0].value).toBe(0);
      stateMachineInputs[0].value = 12;
      expect(stateMachineInputs[0].value).toBe(12);

      expect(stateMachineInputs[1].type).toBe(
        rive.StateMachineInputType.Boolean,
      );
      expect(stateMachineInputs[1].name).toBe("MyBool");
      expect(stateMachineInputs[1].value).toBe(false);
      stateMachineInputs[1].value = true;
      expect(stateMachineInputs[1].value).toBe(true);

      expect(stateMachineInputs[2].type).toBe(
        rive.StateMachineInputType.Trigger,
      );
      expect(stateMachineInputs[2].name).toBe("MyTrig");
      expect(stateMachineInputs[2].value).toBeUndefined();
      expect(stateMachineInputs[2].fire()).toBeUndefined();

      done();
    },
  });
});

test("Playing state machines can be manually started, paused, and restarted", (done) => {
  const canvas = document.createElement("canvas");
  let hasPaused = false;
  let isDone = false;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: "StateMachine",
    onLoad: () => {
      // Nothing should be playing whenever a file is loaded
      expect(r.isStopped).toBeFalsy();
      // Start playback
      r.play();
    },
    onPlay: () => {
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
      if (hasPaused && !isDone) {
        isDone = true;
        done();
      } else if (!hasPaused) {
        r.pause();
      }
    },
    onPause: (event: rive.Event) => {
      expect(r.isPaused).toBeTruthy();
      expect(r.isStopped).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      hasPaused = true;
      r.play();
    },
  });
});

test("Playing state machines report when states have changed", (done) => {
  const canvas = document.createElement("canvas");
  let state = 0;

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay: () => {
      // Expect the correct animation to be playing
      expect(r.playingStateMachineNames).toHaveLength(1);
      expect(r.playingStateMachineNames[0]).toBe("StateMachine");
      // Check the inputs are correct
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);
      expect(inputs).toHaveLength(3);
      expect(inputs[1].name).toBe("MyBool");
      expect(inputs[2].name).toBe("MyTrig");
    },
    onStateChange: ({ type: type, data: stateNames }) => {
      const inputs = r.stateMachineInputs(r.playingStateMachineNames[0]);

      if (state === 0) {
        // console.log(`State: ${(stateNames as string[])[0]}`);
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe("LoopingAnimation");

        state++;
        inputs[2].fire();
      } else if (state === 1) {
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe("PingPongAnimation");

        state++;
        inputs[1].value = true;
      } else if (state === 2) {
        expect(stateNames).toHaveLength(1);
        expect((stateNames as string[])[0]).toBe("exit");

        done();
      }
    },
  });
});

test("Advance event is not triggered when state machine is paused", (done) => {
  const canvas = document.createElement("canvas");
  const hasAdvancedMock = jest.fn();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    autoplay: true,
    onPlay: () => {
      setTimeout(() => {
        r.pause();
      }, 100);
    },
    onPause: () => {
      const advancedCallbackCount = hasAdvancedMock.mock.calls.length;
      setTimeout(() => {
        // Rive draws one more frame before pausing at the end of a render loop
        expect(hasAdvancedMock.mock.calls.length).toBe(
          advancedCallbackCount + 1,
        );
        done();
      }, 50);
    },
    onAdvance: hasAdvancedMock,
  });
});

test("State machine with wrong name logs a warning and an error", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    stateMachines: ["wrong!"],
    onLoad: () => {
      expect(warnLogMock.mock.calls.length).toBe(1);
      expect(warnLogMock.mock.lastCall[0]).toBe(
        "State Machine with name wrong! not found.",
      );
      expect(errorLogMock.mock.calls.length).toBe(1);
      expect(errorLogMock.mock.lastCall[0]).toBe(
        "Animation with name wrong! not found.",
      );
      done();
    },
  });
});

test("Animation with wrong name logs a warning and an error", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    animations: ["wrong!"],
    onLoad: () => {
      expect(warnLogMock.mock.calls.length).toBe(0);
      expect(errorLogMock.mock.calls.length).toBe(1);
      expect(errorLogMock.mock.lastCall[0]).toBe(
        "Animation with name wrong! not found.",
      );
      done();
    },
  });
});

// #endregion
