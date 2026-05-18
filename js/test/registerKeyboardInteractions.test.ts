import * as rc from "../src/rive_advanced.mjs.js";
import { registerKeyboardInteractions } from "../src/utils";

const makeMockSm = ({
  focusNextResult = true,
  focusPreviousResult = true,
}: { focusNextResult?: boolean; focusPreviousResult?: boolean } = {}) =>
  ({
    focusNext: jest.fn().mockReturnValue(focusNextResult),
    focusPrevious: jest.fn().mockReturnValue(focusPreviousResult),
  }) as unknown as rc.StateMachineInstance;

const mockRive = {} as rc.RiveCanvas;

let canvas: HTMLCanvasElement;
let mockSm: rc.StateMachineInstance;
let cleanup: (() => void) | null;

function setupKeyboardInteractions({
  hasFocusNodes = true,
  focusNextResult = true,
  focusPreviousResult = true,
}: {
  hasFocusNodes?: boolean;
  focusNextResult?: boolean;
  focusPreviousResult?: boolean;
} = {}) {
  canvas = document.createElement("canvas");
  mockSm = makeMockSm({ focusNextResult, focusPreviousResult });
  cleanup = registerKeyboardInteractions({
    canvas,
    stateMachine: mockSm,
    rive: mockRive,
    hasFocusNodes,
  });
}

beforeEach(() => setupKeyboardInteractions());
afterEach(() => {
  cleanup?.();
  cleanup = null;
  jest.clearAllMocks();
});

test("returns null when stateMachine is missing", () => {
  expect(
    registerKeyboardInteractions({
      canvas,
      stateMachine: null as unknown as rc.StateMachineInstance,
      rive: mockRive,
      hasFocusNodes: true,
    })
  ).toBeNull();
});

test("returns a cleanup function to remove canvas event listeners when all params are valid", () => {
  expect(
    typeof registerKeyboardInteractions({
      canvas,
      stateMachine: mockSm,
      rive: mockRive,
      hasFocusNodes: true,
    })
  ).toEqual("function");
});

test("cleanup removes all event listeners on the canvas", () => {
  canvas.dispatchEvent(new FocusEvent("focus"));
  cleanup!();

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).not.toBeCalled();
});

test("blur resets focus state so subsequent keydowns are ignored", () => {
  canvas.dispatchEvent(new FocusEvent("focus"));
  canvas.dispatchEvent(new FocusEvent("blur"));

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).not.toBeCalled();
  expect(tabEvent.preventDefault).not.toBeCalled();
});

// Tab

test("Tab calls focusNext and prevents default when a Rive node receives focus", () => {
  canvas.dispatchEvent(new FocusEvent("focus"));
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
  canvas.dispatchEvent(new FocusEvent("focus"));

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).not.toBeCalled();

  // canvas lost focus state — subsequent Tab should also be ignored
  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", bubbles: true }));
  expect(mockSm.focusNext).toHaveBeenCalledTimes(1);
});

// Shift+Tab (reverse traversal)

test("Shift+Tab calls focusPrevious and prevents default when a Rive node receives focus", () => {
  canvas.dispatchEvent(new FocusEvent("focus"));
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
  canvas.dispatchEvent(new FocusEvent("focus"));

  const tabEvent = new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true });
  jest.spyOn(tabEvent, "preventDefault");
  canvas.dispatchEvent(tabEvent);

  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
  expect(tabEvent.preventDefault).not.toBeCalled();

  canvas.dispatchEvent(new KeyboardEvent("keydown", { code: "Tab", shiftKey: true, bubbles: true }));
  expect(mockSm.focusPrevious).toHaveBeenCalledTimes(1);
});
