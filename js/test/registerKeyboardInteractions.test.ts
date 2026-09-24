import * as rc from "../src/rive_advanced.mjs.js";
import { KeyboardInteractions, FocusSessionState } from "../src/utils";
import { AccessibilityOverlay } from "../src/semantics/accessibilityOverlay";
import { SemanticTreeModel } from "../src/semantics/semanticTreeModel";
import {
  SemanticRole,
  SemanticTrait,
  SemanticActionType,
} from "../src/semantics/types";
import { node, diff } from "./semanticsFixtures";

const makeMockSm = ({
  focusNextResult = true,
  focusPreviousResult = true,
  hasFocus = false,
}: {
  focusNextResult?: boolean;
  focusPreviousResult?: boolean;
  hasFocus?: boolean;
} = {}) =>
  ({
    focusNext: jest.fn().mockReturnValue(focusNextResult),
    focusPrevious: jest.fn().mockReturnValue(focusPreviousResult),
    focusLeft: jest.fn().mockReturnValue(true),
    focusRight: jest.fn().mockReturnValue(true),
    focusUp: jest.fn().mockReturnValue(true),
    focusDown: jest.fn().mockReturnValue(true),
    clearFocus: jest.fn(),
    keyInput: jest.fn().mockReturnValue(true),
    focusState: jest
      .fn()
      .mockReturnValue({ hasFocus, expectsKeyboardInput: false }),
  }) as unknown as rc.StateMachineInstance;

// before — canvas — after laid out in DOM order so relatedTarget direction is meaningful
// for compareDocumentPosition.
let before: HTMLButtonElement;
let canvas: HTMLCanvasElement;
let after: HTMLButtonElement;
let mockSm: rc.StateMachineInstance;
let ki: KeyboardInteractions;

function setupKeyboardInteractions({
  hasFocusNodes = true,
  focusNextResult = true,
  focusPreviousResult = true,
  hasFocus = false,
  getOverlayElement,
}: {
  hasFocusNodes?: boolean;
  focusNextResult?: boolean;
  focusPreviousResult?: boolean;
  hasFocus?: boolean;
  getOverlayElement?: () => HTMLElement | null;
} = {}) {
  // Tests that re-setup with other options replace the beforeEach instance.
  teardownKeyboardInteractions();
  before = document.createElement("button");
  canvas = document.createElement("canvas");
  after = document.createElement("button");
  // Mirrors what Rive sets in production, and jsdom needs it for real focus() calls.
  canvas.tabIndex = 0;
  document.body.append(before, canvas, after);
  // Default to keyboard-driven focus; pointer-focus tests override this.
  jest.spyOn(canvas, "matches").mockReturnValue(true);
  mockSm = makeMockSm({ focusNextResult, focusPreviousResult, hasFocus });
  ki = new KeyboardInteractions({
    canvas,
    stateMachine: mockSm,
    hasFocusNodes,
    getOverlayElement,
  });
}

// Real DOM focus rather than a synthetic FocusEvent, so document.activeElement is the canvas
// and relatedTarget is the element focus came from — what the browser hands onCanvasFocus.
// Focusing nothing first (from === null) reports relatedTarget null, as a cold focus does.
function focusCanvasFrom(from: HTMLElement | null) {
  from?.focus();
  canvas.focus();
}

// Focusing the canvas may itself enter the focus tree. Reset the counts when a test asserts on
// what a later key press did.
function clearFocusNavigationCalls() {
  (mockSm.focusNext as jest.Mock).mockClear();
  (mockSm.focusPrevious as jest.Mock).mockClear();
}

function teardownKeyboardInteractions() {
  ki?.cleanup();
  before?.remove();
  canvas?.remove();
  after?.remove();
}

beforeEach(() => setupKeyboardInteractions());
afterEach(() => {
  teardownKeyboardInteractions();
  jest.restoreAllMocks();
});

// Initial state

test("initial focusSessionState is NotFocused", () => {
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});

// Direction-aware entry on focus (no priming Tab)

test("keyboard focus from a preceding element enters Rive via focusNext", () => {
  focusCanvasFrom(before);
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(mockSm.focusPrevious).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("keyboard focus from a following element enters Rive via focusPrevious", () => {
  focusCanvasFrom(after);
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("keyboard focus with unknown origin (null relatedTarget) defaults to focusNext", () => {
  focusCanvasFrom(null);
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("keyboard focus where no Rive node accepts falls back to EntryPending", () => {
  setupKeyboardInteractions({ focusNextResult: false });
  focusCanvasFrom(before);
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  // Nothing accepted entry, but the canvas is focused — the next Tab can retry / pass through.
  expect(ki.focusSessionState).toBe(FocusSessionState.EntryPending);
});

test("pointer-driven focus (not :focus-visible) does not move Rive focus but allows entry on next Tab", () => {
  (canvas.matches as jest.Mock).mockReturnValue(false);
  focusCanvasFrom(before);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(mockSm.focusPrevious).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.EntryPending);
});

test("focus moves to EntryPending state when :focus-visible is unsupported", () => {
  (canvas.matches as jest.Mock).mockImplementation(() => {
    throw new SyntaxError("unsupported pseudo-class");
  });
  focusCanvasFrom(before);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(mockSm.focusPrevious).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.EntryPending);
});

test("clicking the canvas then pressing Tab enters Rive via focusNext", () => {
  (canvas.matches as jest.Mock).mockReturnValue(false);
  focusCanvasFrom(before); // pointer focus → EntryPending, no navigation yet
  expect(mockSm.focusNext).not.toBeCalled();

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("clicking the canvas then pressing Shift+Tab enters Rive via focusPrevious", () => {
  (canvas.matches as jest.Mock).mockReturnValue(false);
  focusCanvasFrom(before); // pointer focus → EntryPending

  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", shiftKey: true, bubbles: true }));

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("focus is ignored when Rive already holds focus (programmatic path)", () => {
  setupKeyboardInteractions({ hasFocus: true });
  focusCanvasFrom(before);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(mockSm.focusPrevious).not.toBeCalled();
  // State is owned by pollFocusState in this path; the focus handler leaves it untouched.
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});

test("focus does nothing when hasFocusNodes is false", () => {
  setupKeyboardInteractions({ hasFocusNodes: false });
  focusCanvasFrom(before);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});

// Blur

test("canvas blur event transitions state to NotFocused", () => {
  focusCanvasFrom(before);
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
  canvas.dispatchEvent(new FocusEvent("blur"));
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});

test("blur resets focus state so subsequent keydowns are ignored", () => {
  focusCanvasFrom(before);
  canvas.dispatchEvent(new FocusEvent("blur"));
  (mockSm.focusNext as jest.Mock).mockClear();

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).not.toBeCalled();
});

// Blur → runtime focus

test("blurring the canvas to another page element clears Rive's internal focus", () => {
  focusCanvasFrom(before);
  canvas.dispatchEvent(new FocusEvent("blur", { relatedTarget: after }));

  expect(mockSm.clearFocus).toHaveBeenCalledTimes(1);
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});

test("blurring into the accessibility overlay leaves Rive's internal focus intact", () => {
  let overlayElement: HTMLElement | null = null;
  setupKeyboardInteractions({ getOverlayElement: () => overlayElement });

  overlayElement = document.createElement("div");
  const semanticNode = document.createElement("div");
  semanticNode.tabIndex = -1;
  overlayElement.appendChild(semanticNode);
  document.body.appendChild(overlayElement);

  focusCanvasFrom(before);
  canvas.dispatchEvent(new FocusEvent("blur", { relatedTarget: semanticNode }));

  expect(mockSm.clearFocus).not.toBeCalled();
  overlayElement.remove();
});

test("blurring because the whole document lost focus leaves Rive's internal focus intact", () => {
  focusCanvasFrom(before);
  jest.spyOn(document, "hasFocus").mockReturnValue(false);

  canvas.dispatchEvent(new FocusEvent("blur"));

  expect(mockSm.clearFocus).not.toBeCalled();
});

test("blurring to nothing while the document keeps focus clears Rive's internal focus", () => {
  focusCanvasFrom(before);
  jest.spyOn(document, "hasFocus").mockReturnValue(true);

  canvas.dispatchEvent(new FocusEvent("blur"));

  expect(mockSm.clearFocus).toHaveBeenCalledTimes(1);
});

// notifyRiveFocused

test("notifyRiveFocused sets state to RiveFocused", () => {
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
  ki.notifyRiveFocused();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

// setFocusSessionState

test("setFocusSessionState sets state directly", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
  ki.setFocusSessionState(FocusSessionState.NotFocused);
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});

// Tab traversal while RiveFocused

test("Tab calls focusNext and prevents default while a Rive node holds focus", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true }));
  expect(mockSm.focusNext).toHaveBeenCalledTimes(2);
});

test("Tab releases focus to the page when focusNext returns false (no more focus nodes)", () => {
  setupKeyboardInteractions({ focusNextResult: false });
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);

  // canvas lost focus state — subsequent Tab should not invoke focusNext again
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true }));
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
});

// A "stop" scope reports no move at its edge but keeps focus on the canvas, so Tab has to
// stay trapped
test("Tab stays trapped when focusNext returns false but Rive still holds focus (stop scope)", () => {
  setupKeyboardInteractions({ focusNextResult: false, hasFocus: true });
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalledTimes(1);
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);

  // Still ours: the next Tab routes to Rive again rather than passing through to the page.
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true }));
  expect(mockSm.focusNext).toHaveBeenCalledTimes(2);
});

test("Shift+Tab stays trapped when focusPrevious returns false but Rive still holds focus", () => {
  setupKeyboardInteractions({ focusPreviousResult: false, hasFocus: true });
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", {
    code: "Tab",
    key: "Tab",
    shiftKey: true,
    bubbles: true,
  });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("keydown is ignored when NotFocused (Rive released focus → next Tab leaves)", () => {
  // Simulate Rive having entered then released focus internally (pollFocusState resets to
  // NotFocused while the canvas keeps DOM focus). The next Tab must pass through, not re-enter.
  ki.setFocusSessionState(FocusSessionState.NotFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).not.toBeCalled();
});

test("keydown is ignored when NotFocused even while the canvas holds real DOM focus", () => {
  // The test above passes on the fallback branch alone: with focus on <body>, the session gate
  // isn't what rejects the key. Only DOM focus on the canvas exercises isInFocusDomain.
  focusCanvasFrom(before);
  clearFocusNavigationCalls();
  ki.setFocusSessionState(FocusSessionState.NotFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).not.toBeCalled();
});

test("Tab still enters the tree from EntryPending while the canvas holds real DOM focus", () => {
  // Guards the session gate against over-reach: only NotFocused releases keyboard input.
  focusCanvasFrom(before);
  clearFocusNavigationCalls();
  ki.setFocusSessionState(FocusSessionState.EntryPending);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

// Shift+Tab traversal while RiveFocused

test("Shift+Tab calls focusPrevious and prevents default while a Rive node holds focus", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", shiftKey: true, bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", shiftKey: true, bubbles: true }));
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(2);
});

test("Shift+Tab releases focus when focusPrevious returns false (no more focus nodes)", () => {
  setupKeyboardInteractions({ focusPreviousResult: false });
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", shiftKey: true, bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);

  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", key: "Tab", shiftKey: true, bubbles: true }));
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
});

// cleanup

test("cleanup removes all event listeners on the canvas", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  ki.cleanup();

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).not.toBeCalled();
});

test("routes keydowns from a lazily available overlay element", () => {
  let overlayElement: HTMLElement | null = null;
  setupKeyboardInteractions({ getOverlayElement: () => overlayElement });

  overlayElement = document.createElement("div");
  const focusedNode = document.createElement("div");
  focusedNode.tabIndex = -1;
  overlayElement.appendChild(focusedNode);
  document.body.appendChild(overlayElement);
  focusedNode.focus();

  // Overlay focus opens a session, so the session gate doesn't swallow overlay keys.
  expect(ki.focusSessionState).toBe(FocusSessionState.EntryPending);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", key: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  focusedNode.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);

  overlayElement.remove();
});

function keyDownOnCanvas(code: string, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    code,
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  canvas.dispatchEvent(event);
  return event;
}

test.each([
  ["isComposing", { isComposing: true }, undefined],
  // Safari's first composition keydown: isComposing false, keyCode 229.
  ["keyCode 229", {}, 229],
] as const)("IME composition keys never reach Rive", (_label, init, keyCode) => {
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  for (const type of ["keydown", "keyup"]) {
    const event = new KeyboardEvent(type, {
      code: "ArrowDown",
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
      ...init,
    });
    if (keyCode !== undefined) {
      Object.defineProperty(event, "keyCode", { value: keyCode });
    }
    canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  }
  expect(mockSm.keyInput).not.toBeCalled();
  expect(mockSm.focusDown).not.toBeCalled();
});

test("forwards key code, modifier bitmask, pressed/released and repeat to keyInput", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  keyDownOnCanvas("Enter", "Enter");
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(257, 0, true, false);

  keyDownOnCanvas("ArrowLeft", "ArrowLeft", { shiftKey: true, repeat: true });
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(263, 1, true, true);

  canvas.dispatchEvent(
    new KeyboardEvent("keyup", { code: "Enter", key: "Enter", bubbles: true }),
  );
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(257, 0, false, false);
});

test("a modifier key is forwarded as a key, with its own bit set", () => {
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const down = keyDownOnCanvas("ControlLeft", "Control", { ctrlKey: true });
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(341, 2, true, false);
  expect(down.defaultPrevented).toBe(false);

  canvas.dispatchEvent(
    new KeyboardEvent("keyup", { code: "ControlLeft", key: "Control", bubbles: true }),
  );
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(341, 0, false, false);
});

function tabUp(init: KeyboardEventInit = {}) {
  canvas.dispatchEvent(
    new KeyboardEvent("keyup", { code: "Tab", key: "Tab", bubbles: true, ...init }),
  );
}

// Tab listeners match per phase (down/repeat/up) as in the editor, so every Tab event
// is offered to Rive on its own, and one no listener claims traverses.
test("a claimed Tab keydown doesn't traverse; an unclaimed repeat of it does", () => {
  setupKeyboardInteractions({ hasFocus: true });
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const down = keyDownOnCanvas("Tab", "Tab", { shiftKey: true });
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(258, 1, true, false);
  expect(mockSm.focusPrevious).not.toBeCalled();
  expect(down.defaultPrevented).toBe(true);

  // A down-only listener doesn't match the repeat, so the held key traverses.
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  keyDownOnCanvas("Tab", "Tab", { shiftKey: true, repeat: true });
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(258, 1, true, true);
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);

  tabUp();
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(258, 0, false, false);
});

test("a repeat-only or up-only Tab listener still gets its phase", () => {
  setupKeyboardInteractions({ hasFocus: true });
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  // Nothing claims the down, so it traverses.
  keyDownOnCanvas("Tab", "Tab");
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);

  // A repeat-only listener claims the repeat: no traversal for that one.
  (mockSm.keyInput as jest.Mock).mockReturnValue(true);
  const repeat = keyDownOnCanvas("Tab", "Tab", { repeat: true });
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(258, 0, true, true);
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(repeat.defaultPrevented).toBe(true);

  // The release always reaches Rive, for an up-only listener.
  tabUp();
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(258, 0, false, false);
});

test("Tab is detected by its logical key, not the physical code", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  // Synthesized by assistive tech / virtual keyboards: no code, key "Tab".
  keyDownOnCanvas("", "Tab");
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);

  // A physical Tab remapped by the OS to another key is not Tab.
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
  keyDownOnCanvas("Tab", "Escape");
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(256, 0, true, false);
});

test("Tab isn't offered to Rive before any node has focus", () => {
  ki.setFocusSessionState(FocusSessionState.EntryPending);
  keyDownOnCanvas("Tab", "Tab");
  expect(mockSm.keyInput).not.toBeCalled();
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
});

test("an arrow the focused node consumes does not move focus", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  const event = keyDownOnCanvas("ArrowRight", "ArrowRight");

  expect(mockSm.keyInput).toHaveBeenCalledWith(262, 0, true, false);
  expect(mockSm.focusRight).not.toBeCalled();
  expect(event.defaultPrevented).toBe(true);
});

// Semantic overlay: a widget's own keydown handler runs at its element before the
// overlay-level listener (bubble phase), so a key it claims never reaches Rive.

class MockResizeObserver {
  observe = jest.fn();
  disconnect = jest.fn();
}
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}

const overlayInstanceId = "ki";
let overlay: AccessibilityOverlay | null = null;
let fireAction: jest.Mock;

afterEach(() => {
  overlay?.destroy();
  overlay = null;
});

// Real AccessibilityOverlay with a slider (node 1) and a button (node 2), both focusable.
function setupWithOverlay() {
  (window as any).ResizeObserver = MockResizeObserver;
  (window as any).IntersectionObserver = MockIntersectionObserver;
  setupKeyboardInteractions({
    getOverlayElement: () => overlay?.getSemanticOverlayContainer() ?? null,
  });
  fireAction = jest.fn();
  overlay = new AccessibilityOverlay({
    canvas,
    instanceId: overlayInstanceId,
    semanticsOptions: {},
    fireAction,
    requestFocus: jest.fn(),
    clearFocus: jest.fn(),
  });
  const tree = new SemanticTreeModel();
  tree.applyDiff(
    diff({
      added: [
        node(1, { role: SemanticRole.slider, traitFlags: SemanticTrait.Focusable }),
        node(2, { role: SemanticRole.button, traitFlags: SemanticTrait.Focusable }),
      ],
    }),
  );
  overlay.update(
    tree,
    { xx: 1, xy: 0, yx: 0, yy: 1, tx: 0, ty: 0 } as any,
    1,
    { minX: 0, minY: 0, maxX: 500, maxY: 500 },
  );
  (mockSm.keyInput as jest.Mock).mockReturnValue(false);
}

function overlayNode(id: number): HTMLElement {
  return document.getElementById(`rive-${overlayInstanceId}-sem-${id}`)!;
}

function keyDownOn(el: HTMLElement, code: string, key = code) {
  el.focus();
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  const event = new KeyboardEvent("keydown", {
    code,
    key,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
  return event;
}

test("a slider's arrow adjusts the slider and never reaches Rive", () => {
  setupWithOverlay();
  const event = keyDownOn(overlayNode(1), "ArrowRight");

  expect(fireAction).toHaveBeenCalledWith(1, SemanticActionType.increase);
  expect(mockSm.keyInput).not.toBeCalled();
  expect(mockSm.focusRight).not.toBeCalled();
  expect(event.defaultPrevented).toBe(true);
});

test("Enter on a button activates it and never reaches Rive", () => {
  setupWithOverlay();
  keyDownOn(overlayNode(2), "Enter");

  expect(fireAction).toHaveBeenCalledWith(2, SemanticActionType.tap);
  expect(mockSm.keyInput).not.toBeCalled();
});

test("an arrow on a button (no arrow handling of its own) moves Rive focus", () => {
  setupWithOverlay();
  const event = keyDownOn(overlayNode(2), "ArrowDown");

  expect(fireAction).not.toBeCalled();
  expect(mockSm.keyInput).toHaveBeenCalledWith(264, 0, true, false);
  expect(mockSm.focusDown).toHaveBeenCalledTimes(1);
  expect(event.defaultPrevented).toBe(true);
});

test("the keyup of a key an overlay widget claimed never reaches Rive", () => {
  setupWithOverlay();
  const el = overlayNode(2);
  keyDownOn(el, "Enter");
  el.dispatchEvent(
    new KeyboardEvent("keyup", { code: "Enter", key: "Enter", bubbles: true }),
  );
  expect(fireAction).toHaveBeenCalledWith(2, SemanticActionType.tap);
  expect(mockSm.keyInput).not.toBeCalled();

  // Only that one release is skipped; the next unclaimed stroke reaches Rive.
  el.dispatchEvent(
    new KeyboardEvent("keyup", { code: "Enter", key: "Enter", bubbles: true }),
  );
  expect(mockSm.keyInput).toHaveBeenCalledWith(257, 0, false, false);
});


test("a claim whose keyup never arrived doesn't swallow the next press's keyup", () => {
  setupWithOverlay();
  const el = overlayNode(2);
  keyDownOn(el, "Enter"); // claimed by the overlay; its keyup is lost

  canvas.focus();
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  keyDownOnCanvas("Enter", "Enter");
  canvas.dispatchEvent(
    new KeyboardEvent("keyup", { code: "Enter", key: "Enter", bubbles: true }),
  );
  expect(mockSm.keyInput).toHaveBeenLastCalledWith(257, 0, false, false);
});

test("focus arriving on the canvas from the overlay does not enter the tree", () => {
  setupWithOverlay();
  overlayNode(2).focus();

  canvas.focus();

  expect(mockSm.focusNext).not.toBeCalled();
  expect(mockSm.focusPrevious).not.toBeCalled();
});

test("releasing Shift+Tab from an overlay node hands DOM focus to the canvas first", () => {
  setupWithOverlay();
  (mockSm.focusPrevious as jest.Mock).mockReturnValue(false);
  const el = overlayNode(2);
  el.focus();
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", {
    code: "Tab",
    key: "Tab",
    shiftKey: true,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(tabEvent.defaultPrevented).toBe(false);
  expect(document.activeElement).toBe(canvas);
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);
});
