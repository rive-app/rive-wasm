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
}: {
  isTouchScrollEnabled?: boolean;
  dispatchPointerExit?: boolean;
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

test("touchstart event can invoke pointerMove with multiple touch events", (): void => {
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

test("touchstart event can invoke pointerUp with multiple touch events", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [mockTouchPoint, mockTouchPoint2],
      changedTouches: [mockTouchPoint, mockTouchPoint2],
    }),
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100, 0);
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(200, 200, 1);
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
});
