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

// Fire a focus event on the canvas with an optional element focus came from.
function focusCanvasFrom(relatedTarget: Element | null) {
  canvas.dispatchEvent(new FocusEvent("focus", { relatedTarget }));
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

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  focusedNode.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).toHaveBeenCalled();
});
