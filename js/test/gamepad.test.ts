// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { loadFile } from "./helpers";
import { stateMachineFileBuffer } from "./assets/bytes";

// gamepad_test.riv: view model numbers `a`/`b` are 1 while standard buttons 0/1
// are held, `connected` is 1 after a connected event and 0 after disconnected.
// The input surface is focused on entering the first state.

interface FakePad {
  index: number;
  id: string;
  connected: boolean;
  mapping: string;
  buttons: { value: number; pressed: boolean }[];
  axes: number[];
}

type DecodedRecord =
  | {
      type: "connected";
      deviceId: number;
      mapping: number;
      buttons: number[];
      axes: number[];
    }
  | { type: "update"; deviceId: number; kind: number; index: number; value: number }
  | { type: "disconnected"; deviceId: number };

let gamepads: (FakePad | null)[] = [];
let frameTime = 1000;
const instances: rive.Rive[] = [];
const originalGetGamepads = navigator.getGamepads;

beforeEach(() => {
  gamepads = [];
  (navigator as any).getGamepads = () => gamepads;
});

afterEach(() => {
  instances.splice(0).forEach((r) => r.cleanup());
  document.body.innerHTML = "";
  (navigator as any).getGamepads = originalGetGamepads;
  jest.restoreAllMocks();
});

function makePad(index: number, id = `Pad ${index}`): FakePad {
  const buttons = [];
  for (let i = 0; i < 17; i++) {
    buttons.push({ value: 0, pressed: false });
  }
  return { index, id, connected: true, mapping: "standard", buttons, axes: [0, 0, 0, 0] };
}

function setButton(pad: FakePad, index: number, value: number): void {
  pad.buttons[index] = { value, pressed: value >= 0.5 };
}

function plugIn(pad: FakePad): void {
  gamepads[pad.index] = pad;
  window.dispatchEvent(new Event("gamepadconnected"));
}

function unplug(pad: FakePad): void {
  gamepads[pad.index] = null;
}

function loadRive(
  params: Partial<rive.RiveParameters> = {},
): Promise<{ r: rive.Rive; canvas: HTMLCanvasElement }> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const r = new rive.Rive({
      canvas,
      buffer: loadFile("assets/gamepad_test/gamepad_test.riv"),
      stateMachine: "State Machine 1",
      autoplay: true,
      autoBind: true,
      ...params,
      onLoad: () => {
        r.stopRendering();
        // onLoad fires inside initData; gamepad input is attached in its
        // .then(setupRiveListeners), so wait for that to run.
        setTimeout(() => resolve({ r, canvas }), 0);
      },
    });
    instances.push(r);
  });
}

// Loads, runs the first frame, then records every batch submitted after it.
async function startRive(
  params: Partial<rive.RiveParameters> = {},
): Promise<{ r: rive.Rive; canvas: HTMLCanvasElement; batches: DecodedRecord[][] }> {
  const { r, canvas } = await loadRive(params);
  frame(r);
  return { r, canvas, batches: recordBatches(r) };
}

// One rAF tick, with the loop kept stopped so only explicit frames run.
function frame(r: rive.Rive, time = (frameTime += 16)): void {
  (r as any).draw(time);
  r.stopRendering();
}

function vmNumber(r: rive.Rive, name: string): number {
  return r.viewModelInstance!.number(name)!.value;
}

function smInstance(r: rive.Rive): any {
  return (r as any).animator.stateMachines[0].instance;
}

// Copies each submitted batch (the encoder reuses its buffer) before passing it on.
function recordBatches(r: rive.Rive): DecodedRecord[][] {
  const batches: DecodedRecord[][] = [];
  const instance = smInstance(r);
  const submit = instance.submitGamepadsFromBuffer.bind(instance);
  instance.submitGamepadsFromBuffer = (bytes: Uint8Array) => {
    batches.push(decode(bytes.slice()));
    return submit(bytes);
  };
  return batches;
}

function decode(bytes: Uint8Array): DecodedRecord[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const records: DecodedRecord[] = [];
  expect(view.getUint32(0, true)).toBe(2);
  let offset = 4;
  while (offset < bytes.length) {
    const type = view.getUint8(offset);
    const deviceId = view.getInt32(offset + 1, true);
    offset += 5;
    if (type === 0) {
      const mapping = view.getUint8(offset);
      const nButtons = view.getUint8(offset + 1);
      const nAxes = view.getUint8(offset + 2);
      offset += 4;
      const values: number[] = [];
      for (let i = 0; i < nButtons + nAxes; i++) {
        values.push(view.getFloat32(offset, true));
        offset += 4;
      }
      records.push({
        type: "connected",
        deviceId,
        mapping,
        buttons: values.slice(0, nButtons),
        axes: values.slice(nButtons),
      });
    } else if (type === 1) {
      expect(view.getUint8(offset)).toBe(1);
      records.push({
        type: "update",
        deviceId,
        kind: view.getUint8(offset + 1),
        index: view.getUint8(offset + 2),
        value: view.getFloat32(offset + 3, true),
      });
      offset += 7;
    } else {
      records.push({ type: "disconnected", deviceId });
    }
  }
  return records;
}

test("connects a pad at rest and fires press and release listeners", async () => {
  const { r, batches } = await startRive();

  const pad = makePad(0);
  plugIn(pad);
  frame(r);
  expect(vmNumber(r, "connected")).toBe(1);
  expect(vmNumber(r, "a")).toBe(0);

  setButton(pad, 0, 1);
  frame(r);
  expect(vmNumber(r, "a")).toBe(1);

  setButton(pad, 0, 0);
  frame(r);
  expect(vmNumber(r, "a")).toBe(0);

  expect(batches[0]).toEqual([
    {
      type: "connected",
      deviceId: expect.any(Number),
      mapping: 0,
      buttons: new Array(17).fill(0),
      axes: new Array(6).fill(0),
    },
  ]);
});

test("a button held when the pad is first seen fires its press", async () => {
  const { r, batches } = await startRive();

  const pad = makePad(0);
  setButton(pad, 0, 1);
  plugIn(pad);
  frame(r);

  expect(vmNumber(r, "connected")).toBe(1);
  expect(vmNumber(r, "a")).toBe(1);
  expect(batches[0].map((record) => record.type)).toEqual(["connected", "update"]);
  expect(batches[0][1]).toMatchObject({ kind: 0, index: 0, value: 1 });
});

test("mirrors triggers onto axes 4 and 5", async () => {
  const { r, batches } = await startRive();

  const pad = makePad(0);
  plugIn(pad);
  frame(r);
  setButton(pad, 6, 0.5);
  frame(r);

  expect(batches[1]).toEqual([
    { type: "update", deviceId: expect.any(Number), kind: 0, index: 6, value: 0.5 },
    { type: "update", deviceId: expect.any(Number), kind: 1, index: 4, value: 0.5 },
  ]);
});

test("reports every value change", async () => {
  const { r, batches } = await startRive();

  const pad = makePad(0);
  plugIn(pad);
  frame(r);

  pad.axes[0] = 0.001;
  frame(r);
  pad.axes[0] = 0.002;
  frame(r);

  expect(batches.length).toBe(3);
  expect(batches[1]).toHaveLength(1);
  expect(batches[1][0]).toMatchObject({ type: "update", kind: 1, index: 0 });
  expect((batches[1][0] as { value: number }).value).toBeCloseTo(0.001);
  expect((batches[2][0] as { value: number }).value).toBeCloseTo(0.002);
});

test("submits nothing when no pad state changed", async () => {
  const { r, batches } = await startRive();

  plugIn(makePad(0));
  frame(r);
  frame(r);
  frame(r);
  expect(batches.length).toBe(1);
});

test("disconnects an unplugged pad", async () => {
  const { r, batches } = await startRive();

  const pad = makePad(0);
  plugIn(pad);
  frame(r);
  unplug(pad);
  frame(r);

  expect(vmNumber(r, "connected")).toBe(0);
  expect(batches[1]).toEqual([
    { type: "disconnected", deviceId: batches[0][0].deviceId },
  ]);
});

test("gives each pad its own device id and a replugged pad a new one", async () => {
  const { r, batches } = await startRive();

  const first = makePad(0);
  const second = makePad(1);
  plugIn(first);
  plugIn(second);
  frame(r);
  const [firstId, secondId] = batches[0].map((record) => record.deviceId);
  expect(secondId).toBe(firstId + 1);

  setButton(first, 0, 1);
  setButton(second, 1, 1);
  frame(r);
  expect(vmNumber(r, "a")).toBe(1);
  expect(vmNumber(r, "b")).toBe(1);
  expect(batches[1]).toEqual([
    { type: "update", deviceId: firstId, kind: 0, index: 0, value: 1 },
    { type: "update", deviceId: secondId, kind: 0, index: 1, value: 1 },
  ]);

  unplug(first);
  frame(r);
  plugIn(makePad(0));
  frame(r);
  expect(batches[2]).toEqual([{ type: "disconnected", deviceId: firstId }]);
  expect(batches[3][0]).toMatchObject({
    type: "connected",
    deviceId: secondId + 1,
  });
});

test("a different controller in the same slot gets a new device id", async () => {
  const { r, batches } = await startRive();

  plugIn(makePad(0, "Controller A"));
  frame(r);
  plugIn(makePad(0, "Controller B"));
  frame(r);

  const firstId = batches[0][0].deviceId;
  expect(batches[1]).toEqual([
    expect.objectContaining({ type: "connected", deviceId: firstId + 1 }),
    { type: "disconnected", deviceId: firstId },
  ]);
});

test("passes non-standard pads through as unknown", async () => {
  const { r, batches } = await startRive();

  const pad = makePad(0);
  pad.mapping = "";
  for (let i = 17; i < 40; i++) {
    pad.buttons.push({ value: 0, pressed: false });
  }
  pad.axes = new Array(20).fill(0);
  plugIn(pad);
  frame(r);
  expect(batches[0]).toEqual([
    {
      type: "connected",
      deviceId: expect.any(Number),
      mapping: 1,
      buttons: new Array(32).fill(0),
      axes: new Array(16).fill(0),
    },
  ]);
  expect(vmNumber(r, "connected")).toBe(1);

  setButton(pad, 0, 1);
  setButton(pad, 6, 1);
  setButton(pad, 35, 1);
  frame(r);
  expect(batches[1]).toEqual([
    { type: "update", deviceId: expect.any(Number), kind: 0, index: 0, value: 1 },
    { type: "update", deviceId: expect.any(Number), kind: 0, index: 6, value: 1 },
  ]);
  // Standard-mapped listeners ignore unknown pads.
  expect(vmNumber(r, "a")).toBe(0);
});

test("catches up on changes made while paused", async () => {
  const { r } = await loadRive();
  frame(r);
  const pad = makePad(0);
  plugIn(pad);
  setButton(pad, 0, 1);
  frame(r);
  expect(vmNumber(r, "a")).toBe(1);

  r.pause();
  setButton(pad, 0, 0);
  frame(r);
  expect(vmNumber(r, "a")).toBe(1);

  r.play();
  r.stopRendering();
  frame(r);
  expect(vmNumber(r, "a")).toBe(0);
});

test("requireFocus releases held inputs while focus is outside the canvas", async () => {
  const { r, canvas, batches } = await startRive({ gamepadOptions: { requireFocus: true } });
  canvas.tabIndex = 0;
  document.body.appendChild(canvas);
  const elsewhere = document.createElement("button");
  document.body.appendChild(elsewhere);

  const pad = makePad(0);
  plugIn(pad);
  setButton(pad, 0, 1);
  canvas.focus();
  frame(r);
  expect(vmNumber(r, "a")).toBe(1);

  // Canvas blur clears Rive focus before this release is submitted, so the .riv
  // never sees it; only the sent batches are checked from here.
  elsewhere.focus();
  frame(r);
  expect(batches[1]).toEqual([
    { type: "update", deviceId: expect.any(Number), kind: 0, index: 0, value: 0 },
  ]);

  canvas.focus();
  frame(r);
  expect(batches[2]).toEqual([
    { type: "update", deviceId: expect.any(Number), kind: 0, index: 0, value: 1 },
  ]);
});

test("requireFocus treats the text input proxy as focus within the canvas", async () => {
  const { r, canvas } = await startRive({ gamepadOptions: { requireFocus: true } });
  canvas.tabIndex = 0;
  document.body.appendChild(canvas);

  const pad = makePad(0);
  plugIn(pad);
  canvas.focus();
  frame(r);

  const proxy: HTMLInputElement = (r as any)._keyboardInteractions.editingHost.element;
  proxy.focus();
  expect(document.activeElement).toBe(proxy);
  setButton(pad, 0, 1);
  frame(r);
  expect(vmNumber(r, "a")).toBe(1);
});

test("requireFocus sees focus on a canvas inside a shadow root", async () => {
  const { r, canvas, batches } = await startRive({ gamepadOptions: { requireFocus: true } });
  canvas.tabIndex = 0;
  const host = document.createElement("div");
  document.body.appendChild(host);
  host.attachShadow({ mode: "open" }).appendChild(canvas);

  const pad = makePad(0);
  plugIn(pad);
  setButton(pad, 0, 1);
  canvas.focus();
  expect(document.activeElement).toBe(host);
  frame(r);

  expect(batches[0][1]).toMatchObject({ type: "update", kind: 0, index: 0, value: 1 });
  expect(vmNumber(r, "a")).toBe(1);
});

test("requireFocus checks the canvas when keyboard interactions are absent", async () => {
  // No focus nodes, so no keyboard interactions are created.
  const { r, canvas, batches } = await startRive({
    buffer: stateMachineFileBuffer,
    stateMachine: "StateMachine",
    autoBind: false,
    gamepadOptions: { requireFocus: true },
  });
  expect((r as any)._keyboardInteractions).toBeNull();
  canvas.tabIndex = 0;
  document.body.appendChild(canvas);
  const elsewhere = document.createElement("button");
  document.body.appendChild(elsewhere);

  const pad = makePad(0);
  plugIn(pad);
  setButton(pad, 0, 1);
  canvas.focus();
  frame(r);
  elsewhere.focus();
  frame(r);

  expect(batches[0].map((record) => record.type)).toEqual(["connected", "update"]);
  expect(batches[0][1]).toMatchObject({ kind: 0, index: 0, value: 1 });
  expect(batches[1]).toEqual([
    { type: "update", deviceId: expect.any(Number), kind: 0, index: 0, value: 0 },
  ]);
});

test("shouldDisableGamepad sends no gamepad input", async () => {
  const { r, batches } = await startRive({ shouldDisableGamepad: true });

  const pad = makePad(0);
  setButton(pad, 0, 1);
  plugIn(pad);
  frame(r);
  expect(batches.length).toBe(0);
  expect(vmNumber(r, "a")).toBe(0);
});

test("shouldDisableRiveListeners also disables gamepad input", async () => {
  const { r, batches } = await startRive({ shouldDisableRiveListeners: true });

  plugIn(makePad(0));
  frame(r);
  expect(batches.length).toBe(0);
});

// On mount, initData's synchronous drawFrame (needs document.timeline,
// which jsdom lacks) must advance the state machine before setupRiveListeners
// attaches gamepad input, or the connected event and held press are lost.
test("a pad present at mount connects with its held press on the first frame", async () => {
  Object.defineProperty(document, "timeline", {
    configurable: true,
    value: { currentTime: 500 },
  });
  try {
    const pad = makePad(0);
    setButton(pad, 0, 1);
    plugIn(pad);
    const { r } = await loadRive();
    r.stopRendering();
    frame(r);

    expect(vmNumber(r, "connected")).toBe(1);
    expect(vmNumber(r, "a")).toBe(1);
  } finally {
    delete (document as any).timeline;
  }
});

test("load sends connected again to the new state machine", async () => {
  const { r } = await loadRive();
  frame(r);
  plugIn(makePad(0));
  frame(r);
  const firstSm = smInstance(r);

  await new Promise<void>((resolve) => {
    r.on(rive.EventType.Load, () => resolve());
    r.load({
      buffer: loadFile("assets/gamepad_test/gamepad_test.riv"),
      stateMachine: "State Machine 1",
      autoplay: true,
      autoBind: true,
    });
  });
  r.stopRendering();
  expect(smInstance(r)).not.toBe(firstSm);
  const batches = recordBatches(r);
  frame(r);

  expect(batches[0]).toEqual([
    expect.objectContaining({ type: "connected" }),
  ]);
});

// reset() doesn't re-run setupRiveListeners; play() does.
test("reset then play sends connected again to the new state machine", async () => {
  const { r } = await loadRive();
  frame(r);
  plugIn(makePad(0));
  frame(r);
  const firstSm = smInstance(r);

  r.reset({ stateMachine: "State Machine 1", autoBind: true });
  r.play();
  r.stopRendering();
  expect(smInstance(r)).not.toBe(firstSm);
  const batches = recordBatches(r);
  frame(r);

  expect(batches[0]).toEqual([
    expect.objectContaining({ type: "connected" }),
  ]);
});

test("reset with autoplay reattaches gamepad input without play", async () => {
  const { r } = await loadRive();
  frame(r);
  plugIn(makePad(0));
  frame(r);
  const firstSm = smInstance(r);

  r.reset({ stateMachine: "State Machine 1", autoplay: true, autoBind: true });
  r.stopRendering();
  expect(smInstance(r)).not.toBe(firstSm);
  // First advance of the new state machine; gamepad input reattaches after it.
  frame(r);
  const batches = recordBatches(r);
  frame(r);

  expect(batches[0]).toEqual([
    expect.objectContaining({ type: "connected" }),
  ]);
  expect(vmNumber(r, "connected")).toBe(1);
});

test("stop then play sends connected again to the new state machine", async () => {
  const { r } = await loadRive();
  frame(r);
  plugIn(makePad(0));
  frame(r);
  const firstSm = smInstance(r);

  r.stop();
  r.play("State Machine 1");
  r.stopRendering();
  expect(smInstance(r)).not.toBe(firstSm);
  const batches = recordBatches(r);
  frame(r);

  expect(batches[0]).toEqual([
    expect.objectContaining({ type: "connected" }),
  ]);
});

test("stops submitting after three rejected batches", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { r } = await loadRive();
  frame(r);
  const submit = jest.fn().mockReturnValue(false);
  smInstance(r).submitGamepadsFromBuffer = submit;

  plugIn(makePad(0));
  frame(r);
  frame(r);
  expect(errorSpy).not.toHaveBeenCalled();
  frame(r);
  expect(submit).toHaveBeenCalledTimes(3);
  expect(errorSpy).toHaveBeenCalledTimes(1);

  frame(r);
  expect(submit).toHaveBeenCalledTimes(3);
});

test("a rejected batch resends connected, and success resets the count", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { r } = await loadRive();
  frame(r);
  const batches: DecodedRecord[][] = [];
  const results = [false, false, true, false, false, true];
  smInstance(r).submitGamepadsFromBuffer = (bytes: Uint8Array) => {
    batches.push(decode(bytes.slice()));
    return results.shift();
  };

  plugIn(makePad(0));
  for (let i = 0; i < 6; i++) {
    if (i === 3) {
      setButton(gamepads[0]!, 0, 1);
    }
    frame(r);
  }

  expect(batches.length).toBe(6);
  expect(batches[0][0].type).toBe("connected");
  expect(batches[1][0].type).toBe("connected");
  expect(batches[2][0].type).toBe("connected");
  expect(batches[3]).toEqual([
    expect.objectContaining({ type: "update", index: 0, value: 1 }),
  ]);
  expect(batches[4][0].type).toBe("connected");
  expect(errorSpy).not.toHaveBeenCalled();
});

test("files without gamepad listeners accept batches", async () => {
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  const { r } = await loadRive({
    buffer: stateMachineFileBuffer,
    stateMachine: "StateMachine",
    autoBind: false,
  });
  frame(r);
  const instance = smInstance(r);
  const submit = jest.spyOn(instance, "submitGamepadsFromBuffer");

  const pad = makePad(0);
  plugIn(pad);
  frame(r);
  setButton(pad, 0, 1);
  frame(r);

  expect(submit).toHaveBeenCalledTimes(2);
  expect(submit.mock.results.map((result) => result.value)).toEqual([true, true]);
  expect(errorSpy).not.toHaveBeenCalled();
});

test("instances share one read per frame and keep reading after another cleans up", async () => {
  const first = await startRive();
  const second = await startRive();
  const getGamepads = jest.fn(() => gamepads);
  (navigator as any).getGamepads = getGamepads;
  const removeSpy = jest.spyOn(window, "removeEventListener");

  plugIn(makePad(0));
  frameTime += 16;
  frame(first.r, frameTime);
  frame(second.r, frameTime);
  expect(getGamepads).toHaveBeenCalledTimes(1);
  expect(first.batches[0]).toEqual(second.batches[0]);

  first.r.cleanup();
  instances.splice(instances.indexOf(first.r), 1);
  expect(removeSpy).not.toHaveBeenCalledWith("gamepadconnected", expect.any(Function));

  setButton(gamepads[0]!, 0, 1);
  frame(second.r);
  expect(vmNumber(second.r, "a")).toBe(1);
});

test("cleanup removes the window gamepadconnected listener", async () => {
  const removeSpy = jest.spyOn(window, "removeEventListener");
  const { r } = await loadRive();
  r.cleanup();
  instances.splice(instances.indexOf(r), 1);
  expect(removeSpy).toHaveBeenCalledWith("gamepadconnected", expect.any(Function));
});
