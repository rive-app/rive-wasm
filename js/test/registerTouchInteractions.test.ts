import * as rc from "../src/rive_advanced.mjs.js";
import { registerTouchInteractions } from "../src/utils";

const mockArtboard = {
  bounds: {},
};

const mockFit = {};
const mockAlignment = {};
const renderer = {};

const mockMat2D = {
  invert: jest.fn(),
  delete: jest.fn(),
};

const mockRive = {
  computeAlignment: jest.fn(() => {
    return mockMat2D;
  }),
  Mat2D: jest.fn().mockImplementation(() => {
    return mockMat2D;
  }),
  Vec2D: jest.fn().mockImplementation((x, y) => {
    return {
      x: jest.fn(() => x),
      y: jest.fn(() => y),
      delete: jest.fn(),
    };
  }),
  mapXY: jest.fn((mat, vec) => {
    return vec;
  }),
};

const mockTouchPoint = {
  clientX: 100,
  clientY: 100,
  identifier: 0,
} as Touch;

const mockTouchPoint2 = {
  clientX: 200,
  clientY: 200,
  identifier: 1,
} as Touch;

let canvas: HTMLCanvasElement;

let mockStateMachines: rc.StateMachineInstance[];

let cleanupRiveListenersFunction: (() => void) | null;

// Mirrors the real `advanceAndReportChanges` wiring in rive.ts: a single call
// advances (and drains events/data-binding callbacks for) every state machine.
// Forwarding to advanceAndApply lets tests assert how many synchronous advances
// a pointer sequence triggers.
const mockAdvanceAndDrain = jest.fn((elapsedTime: number) => {
  mockStateMachines.forEach((sm) => sm.advanceAndApply(elapsedTime));
});

const createCanvasAndRiveListeners = ({
  isTouchScrollEnabled,
  dispatchPointerExit,
  enableMultiTouch,
  stateMachineCount = 1,
  isTextProxyFocused,
}: {
  isTextProxyFocused?: () => boolean;
  isTouchScrollEnabled?: boolean;
  dispatchPointerExit?: boolean;
  enableMultiTouch?: boolean;
  stateMachineCount?: number;
} = {}) => {
  canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.width = 500;
  canvas.height = 500;
  canvas.style.width = "500px";
  canvas.style.height = "500px";

  mockStateMachines = Array.from(
    { length: stateMachineCount },
    () =>
      ({
        pointerDown: jest.fn(),
        pointerMove: jest.fn(),
        pointerUp: jest.fn(),
        pointerExit: jest.fn(),
        pointerScroll: jest.fn(() => 1),
        hasScrollLatch: jest.fn(() => false),
        cancelScroll: jest.fn(),
        advanceAndApply: jest.fn(),
      }) as unknown as rc.StateMachineInstance,
  );

  cleanupRiveListenersFunction = registerTouchInteractions({
    canvas,
    artboard: mockArtboard as rc.Artboard,
    stateMachines: mockStateMachines as unknown as rc.StateMachineInstance[],
    renderer: renderer as rc.Renderer,
    rive: mockRive as unknown as rc.RiveCanvas,
    fit: mockFit as rc.Fit,
    alignment: mockAlignment as rc.Alignment,
    isTouchScrollEnabled,
    dispatchPointerExit,
    enableMultiTouch,
    advanceAndDrain: mockAdvanceAndDrain,
    isTextProxyFocused,
  });
};

beforeEach(() => {
  mockAdvanceAndDrain.mockClear();
  createCanvasAndRiveListeners();
});

afterEach(() => {
  if (cleanupRiveListenersFunction) {
    cleanupRiveListenersFunction();
  }
});

// #region test touch events for Rive listeners

test("touchstart event can invoke pointerDown", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );

  expect(mockStateMachines[0].pointerDown).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("touchmove event can invoke pointerMove", (): void => {
  const mockTouchEvent = new TouchEvent("touchmove", {
    touches: [mockTouchPoint],
    changedTouches: [mockTouchPoint],
  });
  jest.spyOn(mockTouchEvent, "preventDefault");
  canvas.dispatchEvent(mockTouchEvent);

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
  expect(mockTouchEvent.preventDefault).toHaveBeenCalled();
});

test("touchend event can invoke pointerUp", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      changedTouches: [mockTouchPoint],
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).not.toBeCalledWith();
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100, 0);
});

test("mouseout event can invoke pointerMove with out of bounds coordinates", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ dispatchPointerExit: false });
  canvas.dispatchEvent(
    new MouseEvent("mouseout", {
      clientX: -1,
      clientY: 1,
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(-1, 1, 0);
  expect(mockStateMachines[0].pointerExit).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("dont prevent default on TouchEvent behavior if isTouchScrollEnabled is true", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ isTouchScrollEnabled: true });

  const mockTouchEvent = new TouchEvent("touchstart", {
    changedTouches: [mockTouchPoint],
  });
  jest.spyOn(mockTouchEvent, "preventDefault");
  canvas.dispatchEvent(mockTouchEvent);

  expect(mockTouchEvent.preventDefault).not.toHaveBeenCalled();
});

test("mouseout event can invoke pointerExit with out of bounds coordinates when dispatchPointerExit is set to true", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ dispatchPointerExit: true });
  canvas.dispatchEvent(
    new MouseEvent("mouseout", {
      clientX: -1,
      clientY: 1,
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
  expect(mockStateMachines[0].pointerExit).toBeCalledWith(-1, 1, 0);
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("touchstart event can invoke pointerDown with multiple touch events", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ enableMultiTouch: true });
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint, mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerDown).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("touchmove event can invoke pointerMove with multiple touch events", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ enableMultiTouch: true });
  canvas.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint, mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("touchend event can invoke pointerUp with multiple touch events", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ enableMultiTouch: true });
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint, mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).toHaveBeenCalledTimes(2);
  expect(mockStateMachines[0].pointerExit).toHaveBeenCalledTimes(2);
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerExit).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerExit).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
});

test("touchend event with multiple touch events with multi touch disabled only triggers one", (): void => {
  cleanupRiveListenersFunction && cleanupRiveListenersFunction();
  createCanvasAndRiveListeners({ dispatchPointerExit: false });
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint, mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerUp).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerExit).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
});

// #region same-frame pointer advance (advanceAndApply(0) on pointer down/up)

test("mousedown triggers a synchronous advanceAndApply(0)", (): void => {
  canvas.dispatchEvent(
    new MouseEvent("mousedown", { clientX: 100, clientY: 100 }),
  );

  expect(mockStateMachines[0].pointerDown).toBeCalledWith(100, 100, 0);
  expect(mockAdvanceAndDrain).toHaveBeenCalledTimes(1);
  expect(mockAdvanceAndDrain).toBeCalledWith(0, { pointerDown: true });
  expect(mockStateMachines[0].advanceAndApply).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].advanceAndApply).toBeCalledWith(0);
});

test("mouseup triggers a synchronous advanceAndApply(0)", (): void => {
  canvas.dispatchEvent(
    new MouseEvent("mouseup", { clientX: 100, clientY: 100 }),
  );

  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100, 0);
  expect(mockAdvanceAndDrain).toHaveBeenCalledTimes(1);
  expect(mockAdvanceAndDrain).toBeCalledWith(0);
  expect(mockStateMachines[0].advanceAndApply).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].advanceAndApply).toBeCalledWith(0);
});

test("a same-frame touchstart + touchend advances the state machine twice (once per pointer event)", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      changedTouches: [mockTouchPoint],
    }),
  );

  expect(mockStateMachines[0].pointerDown).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerUp).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].advanceAndApply).toHaveBeenCalledTimes(2);
  expect(mockStateMachines[0].advanceAndApply).toHaveBeenNthCalledWith(1, 0);
  expect(mockStateMachines[0].advanceAndApply).toHaveBeenNthCalledWith(2, 0);
});

test("pointer move does not trigger a synchronous advance", (): void => {
  canvas.dispatchEvent(
    new MouseEvent("mousemove", { clientX: 100, clientY: 100 }),
  );

  expect(mockStateMachines[0].pointerMove).toBeCalledWith(100, 100, 0);
  expect(mockAdvanceAndDrain).not.toHaveBeenCalled();
  expect(mockStateMachines[0].advanceAndApply).not.toHaveBeenCalled();
});

// #endregion

// #region single-touch primary finger tracking

test("in single-touch mode, a second finger touchstart does not invoke pointerDown", (): void => {
  // Establish the primary finger
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );
  expect(mockStateMachines[0].pointerDown).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerDown).toBeCalledWith(100, 100, 0);

  // Second finger touches while the first is held
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).toHaveBeenCalledTimes(1);
});

test("in single-touch mode, a touchmove from the second finger does not invoke pointerMove", (): void => {
  // Establish the primary finger
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );

  // Only the second finger moves; primary is stationary so only secondary is in changedTouches
  canvas.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
});

test("in single-touch mode, the primary finger position is used when both fingers appear in changedTouches with the secondary finger listed first", (): void => {
  // Establish primary finger (id=0)
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );

  const movedPrimary = { clientX: 150, clientY: 150, identifier: 0 } as Touch;
  const movedSecondary = { clientX: 250, clientY: 250, identifier: 1 } as Touch;

  // Both fingers moved simultaneously; secondary (id=1) is at changedTouches[0]
  canvas.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [movedPrimary, movedSecondary],
      changedTouches: [movedSecondary, movedPrimary],
    }),
  );

  expect(mockStateMachines[0].pointerMove).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(150, 150, 0);
  expect(mockStateMachines[0].pointerMove).not.toBeCalledWith(250, 250, 1);
});

test("in single-touch mode, a touchend from the second finger does not invoke pointerUp or pointerExit", (): void => {
  // Establish the primary finger
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );

  // Second finger lifts; primary is still held
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
  expect(mockStateMachines[0].pointerExit).not.toBeCalled();
});

test("in single-touch mode, the primary finger still invokes pointerUp after the secondary finger has already lifted", (): void => {
  // Establish the primary finger
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );

  // Second finger lifts first (should be ignored)
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint2],
    }),
  );
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();

  // Primary finger lifts
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [],
      changedTouches: [mockTouchPoint],
    }),
  );

  expect(mockStateMachines[0].pointerUp).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerExit).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerExit).toBeCalledWith(100, 100, 0);
});

test("in single-touch mode, a new primary touch can be established after the previous primary finger lifts", (): void => {
  // First gesture with finger 1 (id=0)
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [],
      changedTouches: [mockTouchPoint],
    }),
  );

  jest.clearAllMocks();

  // Second gesture with finger 2 (id=1) — should become the new primary
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint2],
      changedTouches: [mockTouchPoint2],
    }),
  );
  canvas.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [mockTouchPoint2],
      changedTouches: [mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerDown).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerMove).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(200, 200, 1);
});

test("touchcancel clears the primary touch ID so the next touchstart restores full interactivity", (): void => {
  // Establish primary finger (id=0)
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );

  // OS cancels the touch (incoming call, iOS gesture recognizer, etc.) — no touchend fires
  canvas.dispatchEvent(new TouchEvent("touchcancel"));

  jest.clearAllMocks();

  // User touches again; browser assigns a new identifier (id=1)
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint2],
      changedTouches: [mockTouchPoint2],
    }),
  );
  canvas.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [mockTouchPoint2],
      changedTouches: [mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerDown).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerMove).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(200, 200, 1);
});

// #endregion

// #region emulated mouse events after a touch tap

const tapThenEmulatedMousedown = (): MouseEvent => {
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
      changedTouches: [mockTouchPoint],
    }),
  );
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [],
      changedTouches: [mockTouchPoint],
    }),
  );
  (mockStateMachines[0].pointerDown as jest.Mock).mockClear();
  const mousedown = new MouseEvent("mousedown", {
    clientX: 100,
    clientY: 100,
    cancelable: true,
  });
  canvas.dispatchEvent(mousedown);
  return mousedown;
};

test("emulated mousedown is default-prevented while the text proxy is focused", (): void => {
  cleanupRiveListenersFunction?.();
  createCanvasAndRiveListeners({
    isTouchScrollEnabled: true,
    isTextProxyFocused: () => true,
  });
  const mousedown = tapThenEmulatedMousedown();
  expect(mousedown.defaultPrevented).toBe(true);
  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
});

test("emulated mousedown is not default-prevented when the text proxy is not focused", (): void => {
  cleanupRiveListenersFunction?.();
  createCanvasAndRiveListeners({
    isTouchScrollEnabled: true,
    isTextProxyFocused: () => false,
  });
  const mousedown = tapThenEmulatedMousedown();
  expect(mousedown.defaultPrevented).toBe(false);
  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
});

test("real mousedown is never default-prevented", (): void => {
  cleanupRiveListenersFunction?.();
  createCanvasAndRiveListeners({
    isTouchScrollEnabled: false,
    isTextProxyFocused: () => true,
  });
  const mousedown = new MouseEvent("mousedown", {
    clientX: 100,
    clientY: 100,
    cancelable: true,
  });
  canvas.dispatchEvent(mousedown);
  expect(mousedown.defaultPrevented).toBe(false);
  expect(mockStateMachines[0].pointerDown).toBeCalledWith(100, 100, 0);
});

// #endregion

// #region wheel and trackpad scrolling

const wheel = (init: WheelEventInit): WheelEvent => {
  const event = new WheelEvent("wheel", {
    clientX: 100,
    clientY: 100,
    cancelable: true,
    ...init,
  });
  canvas.dispatchEvent(event);
  return event;
};

const scrollMock = (index: number) =>
  mockStateMachines[index].pointerScroll as jest.Mock;

test("a pixel wheel scrolls as precise content travel and keeps the page still", (): void => {
  const event = wheel({ deltaY: 30, deltaMode: WheelEvent.DOM_DELTA_PIXEL });

  expect(mockStateMachines[0].pointerScroll).toBeCalledWith(
    100,
    100,
    0,
    -30,
    1,
    true,
    expect.any(Number),
    0,
  );
  expect(event.defaultPrevented).toBe(true);
  expect(mockAdvanceAndDrain).toHaveBeenCalledTimes(1);
  expect(mockAdvanceAndDrain).toBeCalledWith(0);
});

test("a line wheel converts to pixels and is not precise", (): void => {
  wheel({ deltaX: 3, deltaMode: WheelEvent.DOM_DELTA_LINE });

  expect(mockStateMachines[0].pointerScroll).toBeCalledWith(
    100,
    100,
    -48,
    0,
    1,
    false,
    expect.any(Number),
    0,
  );
});

test("a page wheel moves by the canvas's visible size on each axis", (): void => {
  jest.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 300,
    height: 200,
  } as DOMRect);

  wheel({ deltaX: 1, deltaY: -1, deltaMode: WheelEvent.DOM_DELTA_PAGE });

  expect(scrollMock(0).mock.calls[0][2]).toBe(-300);
  expect(scrollMock(0).mock.calls[0][3]).toBe(200);
});

test("a shift+wheel reported on y scrolls sideways", (): void => {
  wheel({ deltaY: 30, shiftKey: true });

  expect(mockStateMachines[0].pointerScroll).toBeCalledWith(
    100,
    100,
    -30,
    0,
    1,
    true,
    expect.any(Number),
    0,
  );
});

test("a shift+wheel the browser already moved to x is left alone", (): void => {
  wheel({ deltaX: 30, shiftKey: true });

  expect(scrollMock(0).mock.calls[0][2]).toBe(-30);
  expect(scrollMock(0).mock.calls[0][3]).toBe(0);
});

test("registering cancels scroll gestures latched before the last teardown", (): void => {
  cleanupRiveListenersFunction?.();
  createCanvasAndRiveListeners({ stateMachineCount: 2 });

  expect(mockStateMachines[0].cancelScroll).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[1].cancelScroll).toHaveBeenCalledTimes(1);
});

test("cleanup does not touch the state machines, which may already be deleted", (): void => {
  cleanupRiveListenersFunction?.();
  cleanupRiveListenersFunction = null;

  expect(mockStateMachines[0].cancelScroll).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerScroll).not.toBeCalled();
});

test("the wheel delta takes the fit's scale but not its offset", (): void => {
  const identity = mockRive.mapXY.getMockImplementation();
  mockRive.mapXY.mockImplementation((mat, vec) => {
    const x = vec.x() * 0.5 + 10;
    const y = vec.y() * 0.5 + 20;
    return { x: () => x, y: () => y, delete: jest.fn() };
  });
  try {
    wheel({ deltaY: 30 });
  } finally {
    mockRive.mapXY.mockImplementation(identity);
  }

  expect(mockStateMachines[0].pointerScroll).toBeCalledWith(
    60,
    70,
    0,
    -15,
    1,
    true,
    expect.any(Number),
    0,
  );
});

test("a wheel nothing scrolls goes to the page", (): void => {
  scrollMock(0).mockReturnValue(0);
  const event = wheel({ deltaY: 30 });

  expect(mockStateMachines[0].pointerScroll).toHaveBeenCalledTimes(1);
  expect(event.defaultPrevented).toBe(false);
  expect(mockAdvanceAndDrain).not.toBeCalled();
});

test("a ctrl+wheel is left to the page for zooming", (): void => {
  const event = wheel({ deltaY: 30, ctrlKey: true });

  expect(mockStateMachines[0].pointerScroll).not.toBeCalled();
  expect(event.defaultPrevented).toBe(false);
});

test("a wheel that can't be cancelled is left to the page", (): void => {
  wheel({ deltaY: 30, cancelable: false });

  expect(mockStateMachines[0].pointerScroll).not.toBeCalled();
  expect(mockAdvanceAndDrain).not.toBeCalled();
});

test("a wheel with no delta is ignored", (): void => {
  const event = wheel({ deltaX: 0, deltaY: 0 });

  expect(mockStateMachines[0].pointerScroll).not.toBeCalled();
  expect(event.defaultPrevented).toBe(false);
});

test("a latched state machine takes the wheel before the others", (): void => {
  cleanupRiveListenersFunction?.();
  createCanvasAndRiveListeners({ stateMachineCount: 2 });
  (mockStateMachines[1].hasScrollLatch as jest.Mock).mockReturnValue(true);

  wheel({ deltaY: 30 });

  expect(mockStateMachines[1].pointerScroll).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[0].pointerScroll).not.toBeCalled();
});

test("a wheel falls through to the next state machine when one declines", (): void => {
  cleanupRiveListenersFunction?.();
  createCanvasAndRiveListeners({ stateMachineCount: 2 });
  scrollMock(0).mockReturnValue(0);

  const event = wheel({ deltaY: 30 });

  expect(mockStateMachines[0].pointerScroll).toHaveBeenCalledTimes(1);
  expect(mockStateMachines[1].pointerScroll).toHaveBeenCalledTimes(1);
  expect(event.defaultPrevented).toBe(true);
});

test("cleanup stops forwarding the wheel", (): void => {
  cleanupRiveListenersFunction?.();
  cleanupRiveListenersFunction = null;

  const event = wheel({ deltaY: 30 });

  expect(mockStateMachines[0].pointerScroll).not.toBeCalled();
  expect(event.defaultPrevented).toBe(false);
});

// #endregion
