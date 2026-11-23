import * as rc from "../src/rive_advanced.mjs.js";
import eventsBuffer from "./test-rive-buffers/eventsFile.json";
import * as rive from "../src/rive";
import listenerBuffer from "./test-rive-buffers/listenerFile.js";
import { pingPongRiveFileBuffer, loopRiveFileBuffer, oneShotRiveFileBuffer, stateMachineFileBuffer } from "./assets/bytes";
import {
  arrayToArrayBuffer,
  loadFile,
  loadRive,
  waitForPredicate,
} from "./helpers";
import { testWith } from "./buildFeatures";

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

test("Statemachines have pointer events", async () => {
  const runtime = await rive.RuntimeLoader.awaitInstance();
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
});

testWith("layout")("Statemachines take wheel scrolling", async () => {
  const runtime = await rive.RuntimeLoader.awaitInstance();
  const file = await runtime.load(
    new Uint8Array(loadFile("assets/layout_scroll_vertical.riv")),
  );
  const ab = file.artboardByIndex(0);
  const sm = ab.stateMachineByName("State Machine 1");
  const smi = new runtime.StateMachineInstance(sm, ab);
  smi.advanceAndApply(0);

  expect(smi.hasScrollTargetAt(50, 250)).toBe(true);
  // Already at the top, so a wheel up has nothing to move and would go to
  // the page.
  expect(smi.wantsScroll(50, 250, 0, 50, 1, false)).toBe(false);
  expect(smi.pointerScroll(50, 250, 0, 50, 1, false, 0, 0)).toBe(0);
  expect(smi.hasScrollLatch()).toBe(false);

  expect(smi.wantsScroll(50, 250, 0, -50, 1, false)).toBe(true);
  expect(smi.pointerScroll(50, 250, 0, -50, 1, false, 0, 0)).not.toBe(0);
  expect(smi.hasScrollLatch()).toBe(true);

  smi.cancelScroll();
  expect(smi.hasScrollLatch()).toBe(false);

  smi.delete();
  ab.delete();
});


test("Playing a ping-pong animation will fire a loop event", async () => {
  const canvas = document.createElement("canvas");
  const playStates: boolean[][] = [];
  const loops: { playing: boolean; event: rive.Event }[] = [];
  const r = new rive.Rive({
    canvas: canvas,
    buffer: pingPongRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      playStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    },
    onLoop: (event: rive.Event) => {
      loops.push({ playing: r.isPlaying, event });
    },
  });
  await waitForPredicate(() => loops.length > 0, 4000);

  // We expect things to start playing shortly after load
  expect(playStates.length).toBeGreaterThan(0);
  expect(playStates[0][0]).toBeFalsy();
  expect(playStates[0][1]).toBeFalsy();
  expect(playStates[0][2]).toBeTruthy();
  const { playing, event } = loops[0];
  expect(playing).toBeTruthy();
  expect(event.type).toBe(rive.EventType.Loop);
  expect(event.data).toBeDefined();
  expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.PingPong);
  r.cleanup();
});

test("Playing a loop animation will fire a loop event", async () => {
  const canvas = document.createElement("canvas");
  const playStates: boolean[][] = [];
  const loops: { playing: boolean; event: rive.Event }[] = [];
  const r = new rive.Rive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      playStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    },
    onLoop: (event: rive.Event) => {
      loops.push({ playing: r.isPlaying, event });
    },
  });
  await waitForPredicate(() => loops.length > 0, 4000);

  // We expect things to start playing shortly after load
  expect(playStates.length).toBeGreaterThan(0);
  expect(playStates[0][0]).toBeFalsy();
  expect(playStates[0][1]).toBeFalsy();
  expect(playStates[0][2]).toBeTruthy();
  const { playing, event } = loops[0];
  expect(playing).toBeTruthy();
  expect(event.type).toBe(rive.EventType.Loop);
  expect(event.data).toBeDefined();
  expect((event.data as rive.LoopEvent).type).toBe(rive.LoopType.Loop);
  r.cleanup();
});

test("Playing a one-shot animation will fire a stop event", async () => {
  const canvas = document.createElement("canvas");
  const playStates: boolean[][] = [];
  const stops: { stopped: boolean; event: rive.Event }[] = [];
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onPlay: () => {
      playStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    },
    onStop: (event: rive.Event) => {
      stops.push({ stopped: r.isStopped, event });
    },
  });
  await waitForPredicate(() => stops.length > 0, 4000);

  // We expect things to start playing shortly after load
  expect(playStates.length).toBeGreaterThan(0);
  expect(playStates[0][0]).toBeFalsy();
  expect(playStates[0][1]).toBeFalsy();
  expect(playStates[0][2]).toBeTruthy();
  expect(stops[0].stopped).toBeTruthy();
  expect(stops[0].event.type).toBe(rive.EventType.Stop);
  r.cleanup();
});

test("Stop events are received", async () => {
  const canvas = document.createElement("canvas");
  const stopStates: boolean[][] = [];
  const r = new rive.Rive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onStop: () => {
      stopStates.push([r.isStopped, r.isPaused, r.isPlaying]);
    },
  });
  await waitForPredicate(() => stopStates.length > 0, 4000);

  // We expect to receive a stop event when the animation's done
  expect(stopStates[0][0]).toBeTruthy();
  expect(stopStates[0][1]).toBeFalsy();
  expect(stopStates[0][2]).toBeFalsy();
  r.cleanup();
});

test("Advance events are received", async () => {
  const canvas = document.createElement("canvas");
  const advances: rive.Event[] = [];
  const r = await loadRive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: true,
    onAdvance: (event) => {
      advances.push(event);
    },
  });
  await waitForPredicate(() => advances.length >= 2);

  advances.forEach((event) => expect(event.type).toBe(rive.EventType.Advance));
  // The first advance is skipped: it may carry no time.
  expect(advances[1].data).toBeGreaterThan(0);
  r.cleanup();
});


test("Rive Events are received", async () => {
  const canvas = document.createElement("canvas");
  const events: rive.RiveEventPayload[] = [];
  const r = await loadRive({
    canvas: canvas,
    buffer: arrayToArrayBuffer(eventsBuffer),
    stateMachines: "State Machine 1",
    autoplay: false,
  });
  r.on(rive.EventType.RiveEvent, (riveEvent: rive.Event) => {
    events.push(riveEvent.data as rive.RiveEventPayload);
  });

  r.play("State Machine 1");
  r.stateMachineInputs("State Machine 1")[0].fire();

  await waitForPredicate(() => events.length >= 2);
  expect(events.map((e) => e.name)).toEqual(["genEvent", "urlEvent"]);
  r.cleanup();
});

test("Events can be unsubscribed from", async () => {
  const canvas = document.createElement("canvas");
  const removedStop = jest.fn();
  const keptStop = jest.fn();
  const r = await loadRive({
    canvas: canvas,
    buffer: oneShotRiveFileBuffer,
    autoplay: false,
    onStop: removedStop,
  });
  r.on(rive.EventType.Stop, keptStop);
  r.off(rive.EventType.Stop, removedStop);

  r.play();
  r.stop();

  expect(keptStop).toHaveBeenCalledTimes(1);
  expect(removedStop).not.toHaveBeenCalled();
  r.cleanup();
});

test("Events of a single type can be mass unsubscribed", async () => {
  const canvas = document.createElement("canvas");
  const removedLoops = [jest.fn(), jest.fn(), jest.fn()];
  const keptStop = jest.fn();
  const r = await loadRive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: false,
    onLoop: removedLoops[0],
    onStop: keptStop,
  });
  r.on(rive.EventType.Loop, removedLoops[1]);
  r.on(rive.EventType.Loop, removedLoops[2]);
  r.removeAllRiveEventListeners(rive.EventType.Loop);
  // Added after the removal, so it proves the animation did loop.
  const loopAfterRemoval = jest.fn();
  r.on(rive.EventType.Loop, loopAfterRemoval);

  r.play();
  await waitForPredicate(() => loopAfterRemoval.mock.calls.length > 0, 4000);
  r.stop();

  removedLoops.forEach((loop) => expect(loop).not.toHaveBeenCalled());
  // Listeners of other types are kept.
  expect(keptStop).toHaveBeenCalledTimes(1);
  r.cleanup();
});

test("All events can be mass unsubscribed", async () => {
  const canvas = document.createElement("canvas");
  const removed = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
  const r = await loadRive({
    canvas: canvas,
    buffer: loopRiveFileBuffer,
    autoplay: false,
    onLoop: removed[0],
    onStop: removed[1],
  });
  r.on(rive.EventType.Loop, removed[2]);
  r.on(rive.EventType.Stop, removed[3]);
  r.removeAllRiveEventListeners();
  // Added after the removal, so they prove both events still fire.
  const loopAfterRemoval = jest.fn();
  const stopAfterRemoval = jest.fn();
  r.on(rive.EventType.Loop, loopAfterRemoval);
  r.on(rive.EventType.Stop, stopAfterRemoval);

  r.play();
  await waitForPredicate(() => loopAfterRemoval.mock.calls.length > 0, 4000);
  r.stop();

  expect(stopAfterRemoval).toHaveBeenCalledTimes(1);
  removed.forEach((callback) => expect(callback).not.toHaveBeenCalled());
  r.cleanup();
});

// #endregion


// #region remove mouse events

test("Mouse events are removed from canvas when reset", async () => {
  const canvas = document.createElement("canvas");
  let resetMe = true;
  let stateChanges = 0;
  let dispatchError: unknown = undefined;

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
          dispatchError = err;
        }
        stateChanges++;
      }
    },
  });
  await waitForPredicate(() => stateChanges > 0, 4000);

  expect(dispatchError).toBeUndefined();
  r.cleanup();
});

test("Canvas has listener events attached on a Rive file with Rive Listeners", async () => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const stateChange = jest.fn();
  const r = await loadRive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: true,
    stateMachines: "State Machine 1",
    onStateChange: stateChange,
  });
  await waitForPredicate(() => stateChange.mock.calls.length > 0, 4000);
  expect(listenerSpy).toHaveBeenCalled();
  r.cleanup();
});

test("Canvas does not have listener events if shouldDisableRiveListeners is true", async () => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const stateChange = jest.fn();
  const r = await loadRive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: true,
    stateMachines: "State Machine 1",
    shouldDisableRiveListeners: true,
    onStateChange: stateChange,
  });
  // Positive control: the state machine ran, so listeners would have been
  // attached by now if they were going to be.
  await waitForPredicate(() => stateChange.mock.calls.length > 0, 4000);
  expect(listenerSpy).not.toHaveBeenCalled();
  r.cleanup();
});

test("Canvas has listeners attached once play() is invoked with a state machine", async () => {
  const canvasEl = document.createElement("canvas");
  const listenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const stateMachineName = "State Machine 1";
  const advance = jest.fn();
  const r = await loadRive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: false,
    stateMachines: stateMachineName,
    onAdvance: advance,
  });
  // loadRive resolves from onLoad, which runs before play() is called
  expect(listenerSpy).not.toHaveBeenCalled();
  expect(advance).not.toHaveBeenCalled();
  r.play(stateMachineName);

  await waitForPredicate(() => advance.mock.calls.length > 0, 4000);
  // onAdvance invoked after play() is called
  expect(listenerSpy).toHaveBeenCalled();
  r.cleanup();
});

test("Canvas has listeners detached once stop() is invoked with a state machine", async () => {
  const canvasEl = document.createElement("canvas");
  const addEventListenerSpy = jest.spyOn(canvasEl, "addEventListener");
  const removeEventListenerSpy = jest.spyOn(canvasEl, "removeEventListener");
  const stateMachineName = "State Machine 1";
  const advance = jest.fn();
  const r = await loadRive({
    canvas: canvasEl,
    buffer: arrayToArrayBuffer(listenerBuffer()),
    autoplay: false,
    stateMachines: stateMachineName,
    onAdvance: advance,
  });
  // onLoad called first
  expect(addEventListenerSpy).not.toHaveBeenCalled();
  expect(removeEventListenerSpy).not.toHaveBeenCalled();
  r.play(stateMachineName);

  await waitForPredicate(() => advance.mock.calls.length > 0, 4000);
  // onAdvance invoked after play() is called
  expect(addEventListenerSpy).toHaveBeenCalled();
  r.stop(stateMachineName);
  expect(removeEventListenerSpy).toHaveBeenCalled();
  r.cleanup();
});

// #endregion
