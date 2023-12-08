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
} as Touch;

let canvas: HTMLCanvasElement;

let mockStateMachines: rc.StateMachineInstance[];

beforeEach(() => {
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
    } as unknown as rc.StateMachineInstance,
  ];

  registerTouchInteractions({
    canvas,
    artboard: mockArtboard as rc.Artboard,
    stateMachines: mockStateMachines as unknown as rc.StateMachineInstance[],
    renderer: renderer as rc.Renderer,
    rive: mockRive as unknown as rc.RiveCanvas,
    fit: mockFit as rc.Fit,
    alignment: mockAlignment as rc.Alignment,
  });
});

// #region test touch events for Rive listeners

test("touchstart event can invoke pointerDown", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [mockTouchPoint],
    })
  );

  expect(mockStateMachines[0].pointerDown).toBeCalledWith(100, 100);
  expect(mockStateMachines[0].pointerMove).not.toBeCalled();
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("touchmove event can invoke pointerMove", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [mockTouchPoint],
    })
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(100, 100);
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});

test("touchend event can invoke pointerUp", (): void => {
  canvas.dispatchEvent(
    new TouchEvent("touchend", {
      changedTouches: [mockTouchPoint],
    })
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).not.toBeCalledWith();
  expect(mockStateMachines[0].pointerUp).toBeCalledWith(100, 100);
});

test("mouseout event can invoke pointerMove with out of bounds coordinates", (): void => {
  canvas.dispatchEvent(
    new MouseEvent("mouseout", {
      clientX: -1,
      clientY: 1,
    })
  );

  expect(mockStateMachines[0].pointerDown).not.toBeCalled();
  expect(mockStateMachines[0].pointerMove).toBeCalledWith(-10001, 10001);
  expect(mockStateMachines[0].pointerUp).not.toBeCalled();
});
