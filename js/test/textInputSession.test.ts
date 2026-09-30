import * as rive from "../src/rive";
import { AccessibilityOverlay } from "../src/semantics/accessibilityOverlay";
import { SemanticTreeModel } from "../src/semantics/semanticTreeModel";
import { SemanticRole, SemanticState, SemanticTrait } from "../src/semantics/types";
import { node, diff } from "./semanticsFixtures";
import { stateMachineFileBuffer } from "./assets/bytes";

const overlayInstanceId = "textinput-test";
const identityMat = { xx: 1, xy: 0, yx: 0, yy: 1, tx: 0, ty: 0 } as any;
const artboardBounds = { minX: 0, minY: 0, maxX: 500, maxY: 500 };
const semanticId = (nodeId: number) => `rive-${overlayInstanceId}-sem-${nodeId}`;

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
}

/**
 * Fake state-machine wrapper matching what pollFocusState filters on
 * (playing && hasFocusNodes). focusState() is shared with `instance` because
 * pollFocusState reads the wrapper while KeyboardInteractions/TextInputProxy
 * read the instance.
 *
 * `baseInstance` lets a test shadow the focus API onto a real wasm state-machine
 * instance, for code paths that hand the instance back to the runtime
 * (setupRiveListeners' hasListeners() rejects a plain object).
 */
function makeTextInputSm(baseInstance: object = {}) {
  const focusState = jest
    .fn()
    .mockReturnValue({ hasFocus: false, expectsKeyboardInput: false });
  const instance = Object.assign(baseInstance, {
    focusState,
    focusNext: jest.fn().mockReturnValue(true),
    focusPrevious: jest.fn().mockReturnValue(true),
    clearFocus: jest.fn(),
    keyInput: jest.fn().mockReturnValue(true),
    textInput: jest.fn().mockReturnValue(true),
    selectedText: jest.fn().mockReturnValue(""),
  });
  return {
    name: "FakeTextInputSm",
    playing: true,
    hasFocusNodes: true,
    instance,
    focusState,
    clearFocus: jest.fn(),
    reportedEventCount: jest.fn().mockReturnValue(0),
    reportedEventAt: jest.fn(),
    advanceAndApply: jest.fn(),
    get statesChanged() {
      return [];
    },
    cleanup: jest.fn(),
    setFocusState(state: { hasFocus: boolean; expectsKeyboardInput: boolean }) {
      focusState.mockReturnValue(state);
    },
  };
}

type FakeSm = ReturnType<typeof makeTextInputSm>;

const mounted: HTMLElement[] = [];

// The canvas lives inside a container so the proxy (mounted in canvas.parentElement)
// is findable and real DOM focus works.
function loadRive(
  extraParams: Partial<rive.RiveParameters> = {},
): Promise<{ r: rive.Rive; canvas: HTMLCanvasElement; container: HTMLDivElement }> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    document.body.appendChild(container);
    mounted.push(container);
    const r = new rive.Rive({
      canvas,
      buffer: stateMachineFileBuffer,
      autoplay: true,
      stateMachines: "StateMachine",
      ...extraParams,
      onLoad: () => resolve({ r, canvas, container }),
    });
  });
}

function callPollFocusState(r: rive.Rive) {
  (r as any).pollFocusState();
}

function injectFocusSm(r: rive.Rive, sm: FakeSm) {
  (r as any).animator.stateMachines.push(sm);
}

function proxyIn(container: HTMLElement): HTMLInputElement {
  const inputs = container.querySelectorAll("input");
  expect(inputs.length).toBe(1);
  return inputs[0] as HTMLInputElement;
}

/** Frame that wires KeyboardInteractions without starting a session. */
function primeKeyboardInteractions(r: rive.Rive, sm: FakeSm) {
  sm.setFocusState({ hasFocus: true, expectsKeyboardInput: false });
  callPollFocusState(r);
}

/** DOM focus on the canvas: the user is interacting with this instance. */
function focusCanvas(r: rive.Rive) {
  ((r as any).canvas as HTMLCanvasElement).focus();
}

function beginSession(r: rive.Rive, sm: FakeSm) {
  sm.setFocusState({ hasFocus: true, expectsKeyboardInput: true });
  callPollFocusState(r);
}

afterEach(() => {
  mounted.splice(0).forEach((el) => el.remove());
  document.body.innerHTML = "";
  jest.restoreAllMocks();
});

describe("Text input session lifecycle through pollFocusState", () => {
  test("expectsKeyboardInput false→true focuses the proxy, and staying true does not restart", async () => {
    const { r, container } = await loadRive();
    const sm = makeTextInputSm();
    injectFocusSm(r, sm);

    primeKeyboardInteractions(r, sm);
    const ki = (r as any)._keyboardInteractions;
    expect(ki).not.toBeNull();
    expect(ki.isTextInputSessionActive()).toBe(false);

    focusCanvas(r);
    beginSession(r, sm);
    const proxy = proxyIn(container);
    expect(document.activeElement).toBe(proxy);
    expect(ki.isTextInputSessionActive()).toBe(true);

    const focusSpy = jest.spyOn(proxy, "focus");
    callPollFocusState(r);

    expect(focusSpy).not.toHaveBeenCalled();
    expect(proxyIn(container)).toBe(proxy);
    expect((r as any)._keyboardInteractions).toBe(ki);
    r.cleanup();
  });

  test("expectsKeyboardInput true→false with no overlay parks DOM focus on the canvas", async () => {
    const { r, canvas, container } = await loadRive();
    const sm = makeTextInputSm();
    injectFocusSm(r, sm);

    primeKeyboardInteractions(r, sm);
    focusCanvas(r);
    beginSession(r, sm);
    expect(document.activeElement).toBe(proxyIn(container));

    sm.setFocusState({ hasFocus: true, expectsKeyboardInput: false });
    callPollFocusState(r);

    expect(document.activeElement).toBe(canvas);
    expect(document.activeElement).not.toBe(document.body);
    expect((r as any)._keyboardInteractions.isTextInputSessionActive()).toBe(false);
    // Parking focus is not an entry into Rive, so no traversal runs.
    expect(sm.instance.focusNext).not.toHaveBeenCalled();
    expect(sm.instance.focusPrevious).not.toHaveBeenCalled();
    r.cleanup();
  });

  test("true→false with an overlay hands DOM focus to the newly focused node's element", async () => {
    (window as any).ResizeObserver = MockResizeObserver;
    const { r, canvas, container } = await loadRive();

    const tree = new SemanticTreeModel();
    tree.applyDiff(
      diff({
        added: [
          node(1, {
            role: SemanticRole.textField,
            label: "Email",
            traitFlags: SemanticTrait.Focusable,
            stateFlags: SemanticState.Focused,
          }),
          node(2, {
            role: SemanticRole.button,
            label: "Submit",
            traitFlags: SemanticTrait.Focusable,
          }),
        ],
      }),
    );
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: overlayInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test animation" },
      fireAction: jest.fn(),
      requestFocus: jest.fn(),
      clearFocus: jest.fn(),
      isEditingHostFocused: () =>
        (r as any)._keyboardInteractions?.isEditingHostFocused() ?? false,
    });
    overlay.update(tree, identityMat, 1, artboardBounds);
    (r as any)._accessibilityOverlay = overlay;
    (r as any)._semanticTree = tree;

    const sm = makeTextInputSm();
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    focusCanvas(r);
    beginSession(r, sm);

    const proxy = proxyIn(container);
    const fieldEl = document.getElementById(semanticId(1))!;
    const buttonEl = document.getElementById(semanticId(2))!;
    expect(document.activeElement).toBe(proxy);
    expect(fieldEl.getAttribute("aria-hidden")).toBe("true");
    expect(proxy.getAttribute("aria-label")).toBe("Email");
    expect(proxy.hasAttribute("aria-hidden")).toBe(false);

    // C++ moved focus off the field and onto the button.
    tree.applyDiff(
      diff({
        updatedSemantic: [
          node(1, {
            role: SemanticRole.textField,
            label: "Email",
            traitFlags: SemanticTrait.Focusable,
          }),
          node(2, {
            role: SemanticRole.button,
            label: "Submit",
            traitFlags: SemanticTrait.Focusable,
            stateFlags: SemanticState.Focused,
          }),
        ],
      }),
    );
    overlay.update(tree, identityMat, 1, artboardBounds);
    sm.setFocusState({ hasFocus: true, expectsKeyboardInput: false });
    callPollFocusState(r);

    expect(document.activeElement).toBe(buttonEl);
    expect(fieldEl.hasAttribute("aria-hidden")).toBe(false);
    expect(proxy.getAttribute("aria-hidden")).toBe("true");
    expect(proxy.hasAttribute("aria-label")).toBe(false);
    expect(sm.instance.clearFocus).not.toHaveBeenCalled();
    r.cleanup();
  });

  async function playMidSession(extraParams: Partial<rive.RiveParameters> = {}) {
    const { r, container } = await loadRive(extraParams);
    // play() re-registers touch listeners, which pass the instance back into wasm.
    const sm = makeTextInputSm((r as any).animator.stateMachines[0].instance);
    injectFocusSm(r, sm);

    primeKeyboardInteractions(r, sm);
    focusCanvas(r);
    beginSession(r, sm);
    const firstProxy = proxyIn(container);
    const firstKi = (r as any)._keyboardInteractions;
    expect(document.activeElement).toBe(firstProxy);

    r.play();

    expect((r as any)._prevWantsTextInputSession).toBe(false);
    expect(firstProxy.isConnected).toBe(false);
    // Teardown parks focus on the canvas rather than letting it fall to body.
    const focusedAfterPlay = document.activeElement;

    // Still editing as far as C++ is concerned, so the next frame starts a new session.
    callPollFocusState(r);

    const secondProxy = proxyIn(container);
    const secondKi = (r as any)._keyboardInteractions;
    expect(secondKi).not.toBe(firstKi);
    expect(secondProxy).not.toBe(firstProxy);
    expect(secondKi.isTextInputSessionActive()).toBe(true);
    // Captured before the next await: init's queued post-load setupRiveListeners() rebuilds the proxy.
    return { r, secondProxy, focusedAfterPlay, focusedAfterPoll: document.activeElement };
  }

  test("play() mid-session parks focus on the canvas, then re-focuses the rebuilt proxy", async () => {
    const { r, secondProxy, focusedAfterPlay, focusedAfterPoll } = await playMidSession();
    expect(focusedAfterPlay).toBe((r as any).canvas);
    expect(focusedAfterPoll).toBe(secondProxy);
    r.cleanup();
  });

  test("play() mid-session re-focuses the rebuilt proxy with allowFocusInterrupt", async () => {
    const { r, secondProxy, focusedAfterPoll } = await playMidSession({
      focusOptions: { allowFocusInterrupt: true },
    });
    expect(focusedAfterPoll).toBe(secondProxy);
    r.cleanup();
  });

  test("pause() mid-session parks focus on the canvas and removes the proxy", async () => {
    const { r, canvas, container } = await loadRive();
    const sm = makeTextInputSm((r as any).animator.stateMachines[0].instance);
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    focusCanvas(r);
    beginSession(r, sm);
    const proxy = proxyIn(container);
    expect(document.activeElement).toBe(proxy);

    r.pause();

    expect(proxy.isConnected).toBe(false);
    expect(document.activeElement).toBe(canvas);
    r.cleanup();
  });

  test("the pointer-down drain starts the session without focusing the proxy; the up-phase summon does", async () => {
    const { r, canvas, container } = await loadRive();
    const sm = makeTextInputSm();
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    canvas.focus();

    (r as any)._inPointerDownDrain = true;
    try {
      beginSession(r, sm);
    } finally {
      (r as any)._inPointerDownDrain = false;
    }

    const ki = (r as any)._keyboardInteractions;
    const proxy = proxyIn(container);
    expect(ki.isTextInputSessionActive()).toBe(true);
    expect(document.activeElement).toBe(canvas);

    (r as any).summonKeyboardForGesture();

    expect(document.activeElement).toBe(proxy);
    r.cleanup();
  });

  test("session edge while a page input has DOM focus leaves it there", async () => {
    const { r, container } = await loadRive();
    const pageInput = document.createElement("input");
    document.body.appendChild(pageInput);
    mounted.push(pageInput);

    const sm = makeTextInputSm();
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    pageInput.focus();
    beginSession(r, sm);

    expect(document.activeElement).toBe(pageInput);
    expect(proxyIn(container)).not.toBe(pageInput);
    expect((r as any)._keyboardInteractions.isTextInputSessionActive()).toBe(true);
    r.cleanup();
  });

  test("session edge while the canvas has DOM focus focuses the proxy", async () => {
    const { r, canvas, container } = await loadRive();
    const sm = makeTextInputSm();
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    canvas.focus();
    expect(document.activeElement).toBe(canvas);

    beginSession(r, sm);

    expect(document.activeElement).toBe(proxyIn(container));
    expect((r as any)._keyboardInteractions.isTextInputSessionActive()).toBe(true);
    r.cleanup();
  });

  test("proxy blur to a page element ends the session once, and the later false edge is a no-op", async () => {
    const { r, container } = await loadRive();
    const pageButton = document.createElement("button");
    document.body.appendChild(pageButton);
    mounted.push(pageButton);

    const sm = makeTextInputSm();
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    focusCanvas(r);
    beginSession(r, sm);
    expect(document.activeElement).toBe(proxyIn(container));

    pageButton.focus();

    const ki = (r as any)._keyboardInteractions;
    expect(sm.instance.clearFocus).toHaveBeenCalledTimes(1);
    expect(ki.isTextInputSessionActive()).toBe(false);
    expect(document.activeElement).toBe(pageButton);

    sm.setFocusState({ hasFocus: false, expectsKeyboardInput: false });
    expect(() => callPollFocusState(r)).not.toThrow();

    expect(sm.instance.clearFocus).toHaveBeenCalledTimes(1);
    expect(ki.isTextInputSessionActive()).toBe(false);
    expect(document.activeElement).toBe(pageButton);
    r.cleanup();
  });
});

describe("Text input session gating on the focused semantic node's role", () => {
  const field = (focused: boolean) =>
    node(1, {
      role: SemanticRole.textField,
      label: "Email",
      traitFlags: SemanticTrait.Focusable,
      stateFlags: focused ? SemanticState.Focused : 0,
    });
  const button = (focused: boolean) =>
    node(2, {
      role: SemanticRole.button,
      label: "Submit",
      traitFlags: SemanticTrait.Focusable,
      stateFlags: focused ? SemanticState.Focused : 0,
    });

  async function loadWithSemantics(focus: "field" | "button" | "none") {
    (window as any).ResizeObserver = MockResizeObserver;
    const { r, canvas, container } = await loadRive();
    const tree = new SemanticTreeModel();
    tree.applyDiff(diff({ added: [field(focus === "field"), button(focus === "button")] }));
    const overlay = new AccessibilityOverlay({
      canvas,
      instanceId: overlayInstanceId,
      semanticsOptions: { riveCanvasLabel: "Test animation" },
      fireAction: jest.fn(),
      requestFocus: jest.fn(),
      clearFocus: jest.fn(),
      isEditingHostFocused: () =>
        (r as any)._keyboardInteractions?.isEditingHostFocused() ?? false,
    });
    overlay.update(tree, identityMat, 1, artboardBounds);
    (r as any)._accessibilityOverlay = overlay;
    (r as any)._semanticTree = tree;

    // Real instance base: the queued post-load setupRiveListeners() hands it to wasm.
    const sm = makeTextInputSm((r as any).animator.stateMachines[0].instance);
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    const moveFocus = (to: "field" | "button") => {
      tree.applyDiff(
        diff({ updatedSemantic: [field(to === "field"), button(to === "button")] }),
      );
      overlay.update(tree, identityMat, 1, artboardBounds);
    };
    return {
      r,
      canvas,
      container,
      sm,
      moveFocus,
      // Getter: init's queued post-load setupRiveListeners() rebuilds KeyboardInteractions
      // once the awaiting test resumes.
      get ki() {
        return (r as any)._keyboardInteractions;
      },
      fieldEl: document.getElementById(semanticId(1))!,
      buttonEl: document.getElementById(semanticId(2))!,
    };
  }

  test("focused non-textField node with expectsKeyboardInput starts no session and keeps DOM focus", async () => {
    const s = await loadWithSemantics("button");
    const { r, sm, buttonEl } = s;
    buttonEl.focus();
    expect(document.activeElement).toBe(buttonEl);

    beginSession(r, sm);

    expect(s.ki.isTextInputSessionActive()).toBe(false);
    expect(document.activeElement).toBe(buttonEl);
    expect((r as any)._prevWantsTextInputSession).toBe(false);

    (r as any).summonKeyboardForGesture();

    expect(s.ki.isTextInputSessionActive()).toBe(false);
    expect(document.activeElement).toBe(buttonEl);
    r.cleanup();
  });

  test("focused textField node starts a session as before", async () => {
    const s = await loadWithSemantics("field");
    const { r, container, sm, fieldEl } = s;
    fieldEl.focus();

    beginSession(r, sm);

    const proxy = proxyIn(container);
    expect(s.ki.isTextInputSessionActive()).toBe(true);
    expect(document.activeElement).toBe(proxy);
    expect(proxy.getAttribute("aria-label")).toBe("Email");
    r.cleanup();
  });

  test("semantics on with no focused semantic node starts a session", async () => {
    const s = await loadWithSemantics("none");
    const { r, container, sm } = s;
    focusCanvas(r);

    beginSession(r, sm);

    expect(s.ki.isTextInputSessionActive()).toBe(true);
    expect(document.activeElement).toBe(proxyIn(container));
    r.cleanup();
  });

  test("semantics off starts a session", async () => {
    const { r, container } = await loadRive();
    expect((r as any)._semanticTree).toBeNull();
    const sm = makeTextInputSm();
    injectFocusSm(r, sm);
    primeKeyboardInteractions(r, sm);
    focusCanvas(r);

    beginSession(r, sm);

    expect((r as any)._keyboardInteractions.isTextInputSessionActive()).toBe(true);
    expect(document.activeElement).toBe(proxyIn(container));
    r.cleanup();
  });

  test("mid-session hop textField → button ends the session; hopping back resumes it", async () => {
    const s = await loadWithSemantics("field");
    const { r, container, sm, moveFocus, fieldEl, buttonEl } = s;
    fieldEl.focus();
    beginSession(r, sm);
    const proxy = proxyIn(container);
    expect(document.activeElement).toBe(proxy);
    expect(fieldEl.getAttribute("aria-hidden")).toBe("true");

    // Both nodes have listeners, so expectsKeyboardInput stays true across the hop.
    moveFocus("button");
    callPollFocusState(r);

    expect(s.ki.isTextInputSessionActive()).toBe(false);
    expect(document.activeElement).toBe(buttonEl);
    expect(fieldEl.hasAttribute("aria-hidden")).toBe(false);
    expect(proxy.getAttribute("aria-hidden")).toBe("true");
    expect(proxy.hasAttribute("aria-label")).toBe(false);
    expect(sm.instance.clearFocus).not.toHaveBeenCalled();

    moveFocus("field");
    callPollFocusState(r);

    expect(s.ki.isTextInputSessionActive()).toBe(true);
    expect(document.activeElement).toBe(proxyIn(container));
    expect(proxyIn(container).getAttribute("aria-label")).toBe("Email");
    expect(fieldEl.getAttribute("aria-hidden")).toBe("true");
    r.cleanup();
  });

  test("session begun without DOM focus leaves the proxy undecorated until it is focused", async () => {
    const s = await loadWithSemantics("field");
    const { r, container, sm, fieldEl } = s;
    const pageInput = document.createElement("input");
    document.body.appendChild(pageInput);
    pageInput.focus();

    beginSession(r, sm);

    const proxy = proxyIn(container);
    expect(s.ki.isTextInputSessionActive()).toBe(true);
    expect(document.activeElement).toBe(pageInput);
    expect(proxy.getAttribute("aria-hidden")).toBe("true");
    expect(proxy.hasAttribute("aria-label")).toBe(false);
    expect(fieldEl.hasAttribute("aria-hidden")).toBe(false);

    s.ki.summonForPointer();
    expect(document.activeElement).toBe(proxy);
    callPollFocusState(r);

    expect(proxy.getAttribute("aria-label")).toBe("Email");
    expect(proxy.hasAttribute("aria-hidden")).toBe(false);
    expect(fieldEl.getAttribute("aria-hidden")).toBe("true");
    r.cleanup();
  });

  test("proxy losing DOM focus mid-session drops the decoration but keeps the session", async () => {
    const s = await loadWithSemantics("field");
    const { r, canvas, container, sm, fieldEl } = s;
    fieldEl.focus();
    beginSession(r, sm);
    const proxy = proxyIn(container);
    expect(proxy.getAttribute("aria-label")).toBe("Email");

    canvas.focus();
    callPollFocusState(r);

    expect(s.ki.isTextInputSessionActive()).toBe(true);
    expect(proxy.getAttribute("aria-hidden")).toBe("true");
    expect(proxy.hasAttribute("aria-label")).toBe(false);
    expect(fieldEl.hasAttribute("aria-hidden")).toBe(false);
    expect(document.activeElement).toBe(canvas);
    expect(sm.instance.clearFocus).not.toHaveBeenCalled();
    expect(sm.clearFocus).not.toHaveBeenCalled();

    s.ki.summonForPointer();
    callPollFocusState(r);

    expect(document.activeElement).toBe(proxy);
    expect(proxy.getAttribute("aria-label")).toBe("Email");
    expect(proxy.hasAttribute("aria-hidden")).toBe(false);
    expect(fieldEl.getAttribute("aria-hidden")).toBe("true");
    r.cleanup();
  });
});
