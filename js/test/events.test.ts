// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rc from "../src/rive_advanced.mjs.js";
import eventsBuffer from "./test-rive-buffers/eventsFile.json";
import * as rive from "../src/rive";
import listenerBuffer from "./test-rive-buffers/listenerFile.js";
import { pingPongRiveFileBuffer, loopRiveFileBuffer, oneShotRiveFileBuffer, stateMachineFileBuffer } from "./assets/bytes";
import { arrayToArrayBuffer } from "./helpers";

// #region event

test("Events can be subscribed and unsubscribed to and fired", () => {
  const manager = new rive.Testing.EventManager();
  expect(manager).toBeDefined();

  const mockFired = jest.fn();
  const listener: rive.EventListener = {
    type: rive.EventType.Load,
    callback: (e: rive.Event) => {
      expect(e.type).toBe(rive.EventType.Load);
      expect(e.data).toBe("fired");
      mockFired();
    },
  };

  manager.add(listener);
  manager.fire({ type: rive.EventType.Load, data: "fired" });
  expect(mockFired).toBeCalledTimes(1);

  manager.remove(listener);
  manager.fire({ type: rive.EventType.Load, data: "fired" });
  expect(mockFired).toBeCalledTimes(1);

  manager.add(listener);
  manager.fire({ type: rive.EventType.Load, data: "fired" });
  expect(mockFired).toBeCalledTimes(2);
});

test("Creating loop event accepts enum and string values", (): void => {
  let loopEvent: rive.LoopEvent = {
    animation: "test animation",
    type: rive.LoopType.PingPong,
  };
  expect(loopEvent.type).toBe("pingpong");

  loopEvent = { animation: "test animation", type: rive.LoopType.OneShot };
  expect(loopEvent.type).toBe("oneshot");
});


// #endregion


// #region Firing events

test("Statemachines have pointer events", (done) => {
  rive.RuntimeLoader.awaitInstance().then(async (runtime) => {
    const file = await runtime.load(new Uint8Array(stateMachineFileBuffer));
    const ab = file.artboardByIndex(0);
    const sm = ab.stateMachineByIndex(0);
    const smi = new runtime.StateMachineInstance(sm, ab);

    smi.pointerDown(0, 0, 0);
    smi.pointerMove(0, 0, 0);
    smi.pointerUp(0, 0, 0);

    smi.delete();
    ab.delete();
    //  file.delete();  // todo: need to expose delete() on file
    done();
  });
});


test("Playing a ping-pong animation will fire a loop event", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.PingPong);
      done();
    },
  });
});

test("Playing a loop animation will fire a loop event", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onLoop: (event: rive.Event) => {
      expect(r.isPlaying).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Loop);
      expect(event.data).toBeDefined();
      expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.Loop);
      done();
    },
  });
});

test("Playing a one-shot animation will fire a stop event", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      // We expect things to start playing shortly after load
      expect(r.isStopped).toBeFalsy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeTruthy();
    },
    onStop: (event: rive.Event) => {
      expect(r.isStopped).toBeTruthy();
      expect(event.type).toBe(rive.EventType.Stop);
      done();
    },
  });
});

test("Stop events are received", (done) => {
  const canvas = document.createElement("canvas");
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onStop: () => {
      // We expect to receive a stop event when the animation's done
      expect(r.isStopped).toBeTruthy();
      expect(r.isPaused).toBeFalsy();
      expect(r.isPlaying).toBeFalsy();
      done();
    },
  });
});

test("Advance events are received", (done) => {
  const canvas = document.createElement("canvas");
  let hasAdvancedOnce = false;
  new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onAdvance: (event) => {
      expect(event.type).toBe(rive.EventType.Advance);
      if (hasAdvancedOnce) {
        expect(event.data).toBeGreaterThan(0);
        done();
      }
      if (!hasAdvancedOnce) {
        hasAdvancedOnce = true;
      }
    },
  });
});

test("Rive Events are received", (done) => {
  const canvas = document.createElement("canvas");
  const eventsArrayBuffer = arrayToArrayBuffer(eventsBuffer);
  const events: rive.RiveEventPayload[] = [];
  const riveEventCb = jest.fn((riveEvent: rive.Event) => {
    events.push(riveEvent.data as rive.RiveEventPayload);
  });
  const r = new rive.Rive({
    canvas: canvas,
    buffer: eventsArrayBuffer,
    stateMachines: "State Machine 1",
    autoplay: false,
    onLoad: () => {
      r.play("State Machine 1");
      const input = r.stateMachineInputs("State Machine 1")[0];
      setTimeout(() => input.fire(), 100);
    },
  });

  r.on(rive.EventType.RiveEvent, riveEventCb);
  setTimeout(() => {
    expect(events[0].name).toBe('genEvent');
    expect(events[1].name).toBe('urlEvent');
    done();
  }, 200);
});

test("Events can be unsubscribed from", (done) => {
  const canvas = document.createElement("canvas");

  const stopCallback = (event: rive.Event) =>
    // We should never reach this
    expect(false).toBeTruthy();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onStop: stopCallback,
    onPlay: (event: rive.Event) => {
      // Deregister stop subscription
      r.off(rive.EventType.Stop, stopCallback);
    },
  });
  // Time out after 200 ms
  setTimeout(() => done(), 200);
});

test("Events of a single type can be mass unsubscribed", (done) => {
  const canvas = document.createElement("canvas");

  const loopCallback1 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback2 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback3 = (event: rive.Event) => expect(false).toBeTruthy();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onLoop: loopCallback1,
    onPlay: (event: rive.Event) => {
      r.on(rive.EventType.Loop, loopCallback2);
      r.on(rive.EventType.Loop, loopCallback3);
      // Deregisters all loop subscriptions
      r.removeAllRiveEventListeners(rive.EventType.Loop);
    },
    onStop: (event: rive.Event) => {
      // This should not hgave been removed
      done();
    },
  });

  setTimeout(() => r.stop(), 200);
});

test("All events can be mass unsubscribed", (done) => {
  const canvas = document.createElement("canvas");

  const loopCallback1 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback2 = (event: rive.Event) => expect(false).toBeTruthy();
  const loopCallback3 = (event: rive.Event) => expect(false).toBeTruthy();
  const stopCallback1 = (event: rive.Event) => expect(false).toBeTruthy();
  const stopCallback2 = (event: rive.Event) => expect(false).toBeTruthy();

  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onLoop: loopCallback1,
    onPlay: (event: rive.Event) => {
      r.on(rive.EventType.Loop, loopCallback2);
      r.on(rive.EventType.Loop, loopCallback3);
      r.on(rive.EventType.Stop, stopCallback2);
      // Deregisters all loop subscriptions
      r.removeAllRiveEventListeners();
    },
    onStop: stopCallback1,
  });

  setTimeout(() => {
    r.stop();
    done();
  }, 200);
});

// #endregion


// #region remove mouse events

test("Mouse events are removed from canvas when reset", (done) => {
  const canvas = document.createElement("canvas");
  let resetMe = true;

  // Start up a looping animation
  const r = new rive.Rive({
    canvas: canvas,
    buffer: stateMachineFileBuffer,
    autoplay: true,
    artboard: "MyArtboard",
    stateMachines: "StateMachine",
    onStateChange: () => {
      // lets make sure we're moving so we got things registered
      if (resetMe) {
        resetMe = false;
        r.reset({
          artboard: "MyArtboard",
          stateMachines: "StateMachine",
          autoplay: true,
        });
      }
      if (!resetMe) {
        try {
          // This will fake a mouse event, and trigger their event handlers
          // If those are illegal, we'll crash
          canvas.dispatchEvent(new Event("mousedown"));
        } catch (err) {
          done(err);
        }
        done();
      }
    },
  });
});

test("Canvas has listener events attached on a Rive file with Rive Listeners", (done) => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: true,
    stateMachines: "State Machine 1",
    onStateChange: () => {
      expect(listenerSpy).toHaveBeenCalled();
      done();
    },
  });
});

test("Canvas does not have listener events if shouldDisableRiveListeners is true", (done) => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: true,
    stateMachines: "State Machine 1",
    shouldDisableRiveListeners: true,
    onStateChange: () => {
      expect(listenerSpy).not.toHaveBeenCalled();
      done();
    },
  });
});

test("Canvas has listeners attached once play() is invoked with a state machine", (done) => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const stateMachineName = "State Machine 1";
  const r = new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: false,
    stateMachines: stateMachineName,
    onLoad: () => {
      // onLoad called first
      expect(listenerSpy).not.toHaveBeenCalled();
      r.play(stateMachineName);
    },
    onAdvance: () => {
      // onAdvance invoked after play() is called
      expect(listenerSpy).toHaveBeenCalled();
      done();
    },
  });
});

test("Canvas has listeners detached once stop() is invoked with a state machine", (done) => {
  const canvasEl = document.createElement("canvas");
  const addEventListenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const removeEventListenerSpy = jest.spyOn(canvasEl, "removeEventListener");
  const stateMachineName = "State Machine 1";
  const r = new rive.Rive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: false,
    stateMachines: stateMachineName,
    onLoad: () => {
      // onLoad called first
      expect(addEventListenerSpy).not.toHaveBeenCalled();
      expect(removeEventListenerSpy).not.toHaveBeenCalled();
      r.play(stateMachineName);
    },
    onAdvance: () => {
      // onAdvance invoked after play() is called
      expect(addEventListenerSpy).toHaveBeenCalled();
      r.stop(stateMachineName);
      expect(removeEventListenerSpy).toHaveBeenCalled();
      done();
    },
  });
});

// #endregion
