import * as rc from "../src/rive_advanced.mjs.js";
import { KeyboardInteractions, FocusSessionState } from "../src/utils";

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
    clearFocus: jest.fn(),
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

beforeEach(() => setupKeyboardInteractions());
afterEach(() => {
  ki?.cleanup();
  before?.remove();
  canvas?.remove();
  after?.remove();
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

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

test("clicking the canvas then pressing Shift+Tab enters Rive via focusPrevious", () => {
  (canvas.matches as jest.Mock).mockReturnValue(false);
  focusCanvasFrom(before); // pointer focus → EntryPending

  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true }));

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

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
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
  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", bubbles: true }));
  expect(mockSm.focusNext).toHaveBeenCalledTimes(2);
});

test("Tab releases focus to the page when focusNext returns false (no more focus nodes)", () => {
  setupKeyboardInteractions({ focusNextResult: false });
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);

  // canvas lost focus state — subsequent Tab should not invoke focusNext again
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", bubbles: true }));
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
});

test("keydown is ignored when NotFocused (Rive released focus → next Tab leaves)", () => {
  // Simulate Rive having entered then released focus internally (pollFocusState resets to
  // NotFocused while the canvas keeps DOM focus). The next Tab must pass through, not re-enter.
  ki.setFocusSessionState(FocusSessionState.NotFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
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

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
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

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);
});

// Shift+Tab traversal while RiveFocused

test("Shift+Tab calls focusPrevious and prevents default while a Rive node holds focus", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true }));
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(2);
});

test("Shift+Tab releases focus when focusPrevious returns false (no more focus nodes)", () => {
  setupKeyboardInteractions({ focusPreviousResult: false });
  ki.setFocusSessionState(FocusSessionState.RiveFocused);

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).not.toBeCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.NotFocused);

  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true }));
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
});

// cleanup

test("cleanup removes all event listeners on the canvas", () => {
  ki.setFocusSessionState(FocusSessionState.RiveFocused);
  ki.cleanup();

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
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

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  focusedNode.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
  expect(ki.focusSessionState).toBe(FocusSessionState.RiveFocused);

  overlayElement.remove();
});
