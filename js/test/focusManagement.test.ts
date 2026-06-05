// Note: This uses the canvas-advanced-single module, which has WASM embedded in JS
// which means there is no loading an external WASM file for tests
import * as rive from "../src/rive";
import { KeyboardInteractions, FocusSessionState } from "../src/utils";
import { stateMachineFileBuffer } from "./assets/bytes";

// Minimal fake state machine that satisfies the pollFocusState filter:
//   sm.playing && sm.hasFocusNodes
// Only focusState() is called by pollFocusState itself.
function makeFocusSm(hasFocusResult: boolean) {
  return {
    name: "FakeFocusSm",
    playing: true,
    hasFocusNodes: true,
    // Render-loop methods (no-op stubs) to keep these tests stable even if a frame renders.
    reportedEventCount: jest.fn().mockReturnValue(0),
    reportedEventAt: jest.fn(),
    advanceAndApply: jest.fn(),
    get statesChanged() {
      return [];
    },
    focusState: jest.fn().mockReturnValue({
      hasFocus: hasFocusResult,
      expectsKeyboardInput: false,
    }),
    clearFocus: jest.fn(),
    cleanup: jest.fn(),
  };
}

// Load a Rive instance against the stateMachine buffer and resolve on load.
// The Rive file doesn't matter for testing focus, since we'll artificially inject
// a fake SM with certain commands to test the different focus scenarios
function loadRive(
  extraParams: Partial<rive.RiveParameters> = {},
): Promise<{ r: rive.Rive; canvas: HTMLCanvasElement }> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const r = new rive.Rive({
      canvas,
      buffer: stateMachineFileBuffer,
      autoplay: true,
      stateMachines: "StateMachine",
      ...extraParams,
      onLoad: () => resolve({ r, canvas }),
    });
  });
}

// Call the private pollFocusState method directly.
function callPollFocusState(r: rive.Rive) {
  (r as any).pollFocusState();
}

// Push a fake SM into the animator so pollFocusState picks it up.
// The real SMs from stateMachineFileBuffer have hasFocusNodes=false and are ignored.
function injectFocusSm(r: rive.Rive, sm: ReturnType<typeof makeFocusSm>) {
  (r as any).animator.stateMachines.push(sm);
}

// Attach a real KeyboardInteractions instance and wire it into the Rive instance.
// The stub state machine reports hasFocus=true so that any focus event the poll triggers
// (canvas.focus() under allowFocusInterrupt) is treated as the programmatic path — onCanvasFocus
// early-returns and leaves the session state to pollFocusState. These tests drive session state
// directly via notifyRiveFocused()/setFocusSessionState() rather than through focus events.
function attachKeyboardInteractions(
  r: rive.Rive,
  canvas: HTMLCanvasElement,
): KeyboardInteractions {
  const ki = new KeyboardInteractions({
    canvas,
    stateMachine: {
      focusState: jest
        .fn()
        .mockReturnValue({ hasFocus: true, expectsKeyboardInput: false }),
      focusNext: jest.fn().mockReturnValue(true),
      focusPrevious: jest.fn().mockReturnValue(true),
    } as any,
    hasFocusNodes: true,
  });
  (r as any)._keyboardInteractions = ki;
  return ki;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Polling focus each frame", () => {
  test("pollFocusState: hasFocus=true calls notifyRiveFocused and sets _prevHasFocus to true", async () => {
    const { r, canvas } = await loadRive();
    const ki = attachKeyboardInteractions(r, canvas);
    expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
    injectFocusSm(r, makeFocusSm(true));

    const spy = jest.spyOn(ki, "notifyRiveFocused");
    callPollFocusState(r);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
    expect((r as any)._prevHasFocus).toBe(true);
    r.cleanup();
  });

  test("pollFocusState: hasFocus=true on first frame calls canvas.focus() when allowFocusInterrupt=true", async () => {
    const { r, canvas } = await loadRive({
      focusOptions: { allowFocusInterrupt: true },
    });
    attachKeyboardInteractions(r, canvas);
    injectFocusSm(r, makeFocusSm(true));
    (r as any)._prevHasFocus = false;

    const focusSpy = jest.spyOn(canvas, "focus");
    callPollFocusState(r);

    expect(focusSpy).toHaveBeenCalledTimes(1);
    r.cleanup();
  });

  test("pollFocusState: hasFocus=true on subsequent frames does NOT call canvas.focus()", async () => {
    const { r, canvas } = await loadRive({
      focusOptions: { allowFocusInterrupt: true },
    });
    attachKeyboardInteractions(r, canvas);
    injectFocusSm(r, makeFocusSm(true));
    (r as any)._prevHasFocus = true; // simulate already-focused prior frame

    const focusSpy = jest.spyOn(canvas, "focus");
    callPollFocusState(r);

    expect(focusSpy).not.toHaveBeenCalled();
    r.cleanup();
  });

  test("pollFocusState: hasFocus=true does NOT call canvas.focus() when allowFocusInterrupt=false", async () => {
    const { r, canvas } = await loadRive({
      focusOptions: { allowFocusInterrupt: false },
    });
    attachKeyboardInteractions(r, canvas);
    injectFocusSm(r, makeFocusSm(true));
    (r as any)._prevHasFocus = false;

    const focusSpy = jest.spyOn(canvas, "focus");
    callPollFocusState(r);

    expect(focusSpy).not.toHaveBeenCalled();
    r.cleanup();
  });

  test("pollFocusState: hasFocus=false with RiveFocused calls setFocusSessionState(NotFocused)", async () => {
    const { r, canvas } = await loadRive();
    const ki = attachKeyboardInteractions(r, canvas);
    ki.notifyRiveFocused(); // → RiveFocused
    injectFocusSm(r, makeFocusSm(false));

    callPollFocusState(r);

    expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
    expect((r as any)._prevHasFocus).toBe(false);
    r.cleanup();
  });

  test("pollFocusState: hasFocus=false with NotFocused does nothing", async () => {
    const { r, canvas } = await loadRive();
    const ki = attachKeyboardInteractions(r, canvas);
    // ki starts NotFocused by default — no DOM event dispatched
    injectFocusSm(r, makeFocusSm(false));

    const spy = jest.spyOn(ki, "setFocusSessionState");
    callPollFocusState(r);

    expect(spy).not.toHaveBeenCalled();
    expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
    r.cleanup();
  });

  test("pollFocusState: hasFocus=false with EntryPending leaves the state intact", async () => {
    // A click on the canvas leaves the session EntryPending awaiting its first Tab. A frame
    // rendering in between (hasFocus=false) must not reset it, or the click→Tab entry breaks.
    const { r, canvas } = await loadRive();
    const ki = attachKeyboardInteractions(r, canvas);
    ki.setFocusSessionState(FocusSessionState.EntryPending);
    injectFocusSm(r, makeFocusSm(false));

    const spy = jest.spyOn(ki, "setFocusSessionState");
    callPollFocusState(r);

    expect(spy).not.toHaveBeenCalled();
    expect(ki.focusSessionState).toBe(FocusSessionState.EntryPending);
    r.cleanup();
  });

  test("pollFocusState: _prevHasFocus resets to false when hasFocus transitions true→false", async () => {
    const { r, canvas } = await loadRive();
    const ki = attachKeyboardInteractions(r, canvas);
    ki.notifyRiveFocused(); // → RiveFocused

    const sm = makeFocusSm(true);
    injectFocusSm(r, sm);

    // Frame 1: hasFocus=true → _prevHasFocus becomes true
    callPollFocusState(r);
    expect((r as any)._prevHasFocus).toBe(true);

    // Frame 2: hasFocus=false → _prevHasFocus resets
    sm.focusState.mockReturnValue({ hasFocus: false, expectsKeyboardInput: false });
    callPollFocusState(r);
    expect((r as any)._prevHasFocus).toBe(false);
    r.cleanup();
  });

  test("pollFocusState: canvas.focus() fires again if focus returns after a gap", async () => {
    const { r, canvas } = await loadRive({
      focusOptions: { allowFocusInterrupt: true },
    });
    const ki = attachKeyboardInteractions(r, canvas);
    ki.notifyRiveFocused();

    const sm = makeFocusSm(true);
    injectFocusSm(r, sm);
    const focusSpy = jest.spyOn(canvas, "focus");

    // Frame 1: hasFocus=true → focus called, _prevHasFocus=true
    callPollFocusState(r);
    expect(focusSpy).toHaveBeenCalledTimes(1);

    // Frame 2: hasFocus=false → _prevHasFocus resets, session released to NotFocused
    sm.focusState.mockReturnValue({ hasFocus: false, expectsKeyboardInput: false });
    callPollFocusState(r);
    expect((r as any)._prevHasFocus).toBe(false);
    expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);

    // Frame 3: hasFocus=true again → focus called again (new session)
    sm.focusState.mockReturnValue({ hasFocus: true, expectsKeyboardInput: false });
    callPollFocusState(r);
    expect(focusSpy).toHaveBeenCalledTimes(2);
    r.cleanup();
  });

  test("pollFocusState: no _keyboardInteractions → no-op, no crash", async () => {
    const { r } = await loadRive();
    injectFocusSm(r, makeFocusSm(true));
    // _keyboardInteractions is null — the buffer SM has no focus nodes so none was created

    expect(() => callPollFocusState(r)).not.toThrow();
    r.cleanup();
  });

  test("pollFocusState: no playing state machine with hasFocusNodes → no-op", async () => {
    const { r, canvas } = await loadRive();
    attachKeyboardInteractions(r, canvas);
    // No fake SM injected — real SMs have hasFocusNodes=false

    expect(() => callPollFocusState(r)).not.toThrow();
    expect((r as any)._prevHasFocus).toBe(false);
    r.cleanup();
  });
});