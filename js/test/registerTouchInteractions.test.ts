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

const createCanvasAndRiveListeners = ({
  isTouchScrollEnabled,
  dispatchPointerExit,
  enableMultiTouch,
}: {
  isTouchScrollEnabled?: boolean;
  dispatchPointerExit?: boolean;
  enableMultiTouch?: boolean;
} = {}) => {
  canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.width = 500;
  canvas.height = 500;
  canvas.style.width = "500px";
  canvas.style.height = "500px";

  mockStateMachines = [
    {
      pointerDown: jest.fn(),
      pointerMove: jest.fn(),
      pointerUp: jest.fn(),
      pointerExit: jest.fn(),
    } as unknown as rc.StateMachineInstance,
  ];

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
  });
};

beforeEach(() => {
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
